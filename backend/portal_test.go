package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	sdk "github.com/t8y2/dbx/plugins/sdk/go/dbx-plugin-sdk"
)

func call(t *testing.T, p *plugin, method string, params any) (any, *sdk.PluginError) {
	t.Helper()
	data, err := json.Marshal(params)
	if err != nil {
		t.Fatal(err)
	}
	return p.Handle(sdk.RequestContext{}, method, data, nil)
}

func portalFixture(t *testing.T) *httptest.Server {
	t.Helper()
	var uploads atomic.Int32
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/portal/") {
			http.NotFound(w, r)
			return
		}
		if r.URL.Path == "/portal/signin" {
			r.ParseForm()
			if r.Form.Get("password") != "private-password" {
				http.Redirect(w, r, "/portal/signin?#/error", 302)
				return
			}
			http.SetCookie(w, &http.Cookie{Name: "SESSION", Value: r.Form.Get("username"), Path: "/portal/", HttpOnly: true})
			http.Redirect(w, r, "/portal/", 302)
			return
		}
		cookie, err := r.Cookie("SESSION")
		if err != nil {
			http.Redirect(w, r, "/portal/signin", 302)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/portal/user":
			fmt.Fprintf(w, `{"userId":"%s","name":"%s"}`, cookie.Value, cookie.Value)
		case "/portal/transfer-download":
			w.Header().Set("Content-Type", "application/octet-stream")
			fmt.Fprint(w, strings.Repeat("B", 2*1024*1024))
		case "/portal/transfer-upload":
			body, _ := io.ReadAll(r.Body)
			digest := sha256.Sum256(body)
			count := uploads.Add(1)
			fmt.Fprintf(w, `{"size":%d,"sha256":"%x","count":%d}`, len(body), digest, count)
		case "/portal/transfer-count":
			fmt.Fprintf(w, `{"count":%d}`, uploads.Load())
		case "/portal/echo":
			http.SetCookie(w, &http.Cookie{Name: "hidden", Value: "private-cookie"})
			fmt.Fprintf(w, `{"user":"%s","method":"%s","query":"%s"}`, cookie.Value, r.Method, r.URL.RawQuery)
		case "/portal/consumers/consumer-token/assign-role":
			fmt.Fprintf(w, `{"method":"%s","query":"%s"}`, r.Method, r.URL.RawQuery)
		case "/portal/expired":
			http.Redirect(w, r, "/portal/signin", 302)
		case "/portal/escape":
			http.Redirect(w, r, "http://example.invalid/steal", 302)
		case "/portal/outside":
			http.Redirect(w, r, "/another-app/user", 302)
		case "/portal/denied":
			w.WriteHeader(403)
			fmt.Fprint(w, `{"message":"Permission denied"}`)
		case "/portal/slow":
			time.Sleep(80 * time.Millisecond)
			fmt.Fprint(w, `{}`)
		case "/portal/large":
			fmt.Fprint(w, strings.Repeat("x", maxBodyBytes+1))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(s.Close)
	return s
}

func lifecycle(server, id, user, password string) map[string]any {
	u, _ := url.Parse(server)
	return map[string]any{"connection": map[string]any{"id": id, "host": u.Hostname(), "port": u.Port(), "username": user, "connection_secrets": map[string]string{"password": password}, "external_config": map[string]any{"scheme": "http", "context_path": "/portal"}}}
}

func connect(t *testing.T, p *plugin, server, id, user string) {
	t.Helper()
	_, e := call(t, p, "connection/connect", lifecycle(server, id, user, "private-password"))
	if e != nil {
		t.Fatal(e.Message)
	}
}

func TestLoginCookieIsolationAndNoSecrets(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	connect(t, p, s.URL, "b", "bob")
	for _, tc := range []struct{ id, user string }{{"a", "alice"}, {"b", "bob"}} {
		v, e := call(t, p, "apollo/request", requestParams{ConnectionID: tc.id, Method: "GET", Path: "/echo?q=a%20b"})
		if e != nil {
			t.Fatal(e)
		}
		r := v.(portalResponse)
		body, _ := base64.StdEncoding.DecodeString(r.BodyBase64)
		if string(body) != fmt.Sprintf(`{"user":"%s","method":"GET","query":"q=a%%20b"}`, tc.user) {
			t.Fatal(string(body))
		}
		encoded, _ := json.Marshal(r)
		for _, secret := range []string{"private-password", "private-cookie", "Set-Cookie", "SESSION"} {
			if strings.Contains(string(encoded), secret) {
				t.Fatalf("leaked %s", secret)
			}
		}
	}
}

func TestFailedReconnectInvalidatesSessionAndTestDoesNotStore(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	_, e := call(t, p, "connection/connect", lifecycle(s.URL, "a", "alice", "bad-private-password"))
	if e == nil || strings.Contains(e.Message, "bad-private-password") {
		t.Fatal("login not safely rejected", e)
	}
	_, e = call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/echo"})
	if e == nil {
		t.Fatal("stale session retained")
	}
	_, e = call(t, p, "connection/test", lifecycle(s.URL, "test", "alice", "private-password"))
	if e != nil {
		t.Fatal(e)
	}
	_, e = call(t, p, "apollo/request", requestParams{ConnectionID: "test", Method: "GET", Path: "/echo"})
	if e == nil {
		t.Fatal("test persisted credentials/session")
	}
}

func TestRejectsEscapesAndUnsafeHeaders(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	for _, path := range []string{"http://evil.test/", "//evil.test/", "/../user", "/%2e%2e/user", "/%252e%252e/user", "/x\\user", "/x%5cuser", "/x#fragment", "/x/%2f../user", "/x\r\nCookie:leak"} {
		_, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: path})
		if e == nil {
			t.Errorf("accepted unsafe path %q", path)
		}
	}
	for _, header := range []string{"Authorization", "Cookie", "Host", "Proxy-Authorization", "X-Forwarded-Host"} {
		_, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/echo", Headers: map[string]string{header: "injected"}})
		if e == nil {
			t.Errorf("accepted unsafe header %s", header)
		}
	}
}

func TestRedirectsStatusAndDisconnect(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	for _, path := range []string{"/escape", "/outside"} {
		_, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: path})
		if e == nil {
			t.Fatal("redirect accepted", path)
		}
	}
	v, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "POST", Path: "/denied"})
	if e != nil || v.(portalResponse).Status != 403 {
		t.Fatal("lost status", v, e)
	}
	v, e = call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/expired"})
	if e != nil || v.(portalResponse).Status != 401 {
		t.Fatal("lost auth expiration", v, e)
	}
	for i := 0; i < 2; i++ {
		if _, e := call(t, p, "connection/disconnect", map[string]any{"connection": map[string]string{"id": "a"}}); e != nil {
			t.Fatal(e)
		}
	}
	if _, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/echo"}); e == nil {
		t.Fatal("disconnected session usable")
	}
}

func TestReadOnlyLimitsAndRuntimeEndpoint(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	l := lifecycle(s.URL, "a", "alice", "private-password")
	l["connection"].(map[string]any)["read_only"] = true
	if _, e := call(t, p, "connection/connect", l); e != nil {
		t.Fatal(e)
	}
	if _, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "POST", Path: "/echo"}); e == nil {
		t.Fatal("read-only write allowed")
	}
	if _, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/large"}); e == nil {
		t.Fatal("oversize accepted")
	}
	if _, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/echo", BodyBase64: "not-base64"}); e == nil {
		t.Fatal("bad encoding accepted")
	}
	u, _ := url.Parse(s.URL)
	l = lifecycle("http://unreachable.invalid:1", "tunnel", "alice", "private-password")
	l["runtime"] = map[string]any{"host": u.Hostname(), "port": u.Port()}
	if _, e := call(t, p, "connection/connect", l); e != nil {
		t.Fatal("runtime endpoint ignored", e)
	}
}

func TestCredentialsAndEndpointValidation(t *testing.T) {
	p := newPlugin()
	for _, endpoint := range []string{"file:///tmp/private", "http://user:password@localhost", "http://host/path", "http://host?token=secret", "http://host#fragment"} {
		l := lifecycle("http://localhost:1", "x", "a", "private-password")
		l["connection"].(map[string]any)["host"] = endpoint
		if _, e := call(t, p, "connection/connect", l); e == nil {
			t.Error("accepted", endpoint)
		}
	}
}

func TestClosedSessionCancelsInflightRequestAndCannotSendAnother(t *testing.T) {
	s := portalFixture(t)
	var v lifecycleParams
	b, _ := json.Marshal(lifecycle(s.URL, "a", "alice", "private-password"))
	json.Unmarshal(b, &v)
	session, err := login(v)
	if err != nil {
		t.Fatal(err)
	}
	session.client.Timeout = 10 * time.Millisecond
	if _, err := session.request(requestParams{Method: "GET", Path: "/slow"}); err == nil {
		t.Fatal("deadline ignored")
	}
	session.close()
	if _, err := session.request(requestParams{Method: "GET", Path: "/echo"}); err == nil {
		t.Fatal("closed session sent request")
	}
}

func TestLogoutCannotMutateReadOnlyConnectionViaGET(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	l := lifecycle(s.URL, "a", "alice", "private-password")
	l["connection"].(map[string]any)["read_only"] = true
	if _, e := call(t, p, "connection/connect", l); e != nil {
		t.Fatal(e)
	}
	if _, e := call(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/user/logout"}); e == nil {
		t.Fatal("logout GET bypassed read-only enforcement")
	}
}

func TestConsumerAuthorizationUsesRedactedTokenFieldAndReadOnlyGate(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	params := map[string]any{"connectionId": "a", "token": "consumer-token", "type": "NamespaceRole", "envs": "DEV,UAT", "namespace": map[string]string{"appId": "SampleApp", "namespaceName": "application"}}
	v, e := call(t, p, "apollo/consumer-authorize", params)
	if e != nil {
		t.Fatal(e)
	}
	body, _ := base64.StdEncoding.DecodeString(v.(portalResponse).BodyBase64)
	if string(body) != `{"method":"POST","query":"envs=DEV%2CUAT&type=NamespaceRole"}` {
		t.Fatal(string(body))
	}
	l := lifecycle(s.URL, "a", "alice", "private-password")
	l["connection"].(map[string]any)["read_only"] = true
	if _, e := call(t, p, "connection/connect", l); e != nil {
		t.Fatal(e)
	}
	if _, e := call(t, p, "apollo/consumer-authorize", params); e == nil {
		t.Fatal("consumer RPC bypassed read-only")
	}
	params["type"] = "unknown"
	if _, e := call(t, p, "apollo/consumer-authorize", params); e == nil {
		t.Fatal("unknown consumer role accepted")
	}
}

func TestSessionMetadataExposesOnlyReadOnlyAndRequiresActiveConnection(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	l := lifecycle(s.URL, "a", "alice", "private-password")
	l["connection"].(map[string]any)["read_only"] = true
	if _, e := call(t, p, "connection/connect", l); e != nil {
		t.Fatal(e)
	}
	v, e := call(t, p, "apollo/session", map[string]string{"connectionId": "a"})
	if e != nil {
		t.Fatal(e)
	}
	encoded, _ := json.Marshal(v)
	if string(encoded) != `{"readOnly":true}` {
		t.Fatal(string(encoded))
	}
	if _, e := call(t, p, "apollo/session", map[string]string{"connectionId": "missing"}); e == nil {
		t.Fatal("inactive session exposed metadata")
	}
}
