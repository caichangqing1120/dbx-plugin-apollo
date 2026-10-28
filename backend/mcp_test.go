package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func mcpResult(t *testing.T, p *plugin, tool string, args any, life any, wantError bool) map[string]any {
	t.Helper()
	value, rpcErr := call(t, p, "mcp/call", map[string]any{"tool": tool, "arguments": args, "lifecycle": life})
	if rpcErr != nil {
		t.Fatalf("expected MCP envelope, got RPC error: %v", rpcErr)
	}
	encoded, _ := json.Marshal(value)
	var result struct {
		Content []struct{ Type, Text string } `json:"content"`
		IsError bool                          `json:"isError"`
	}
	if json.Unmarshal(encoded, &result) != nil || len(result.Content) != 1 || result.Content[0].Type != "text" || result.IsError != wantError {
		t.Fatalf("invalid MCP result: %s", encoded)
	}
	var body map[string]any
	if json.Unmarshal([]byte(result.Content[0].Text), &body) != nil {
		t.Fatalf("invalid text content: %s", result.Content[0].Text)
	}
	return body
}

func mcpFixture(t *testing.T) (*httptest.Server, *atomic.Int32, *atomic.Int32) {
	t.Helper()
	logins, requests := &atomic.Int32{}, &atomic.Int32{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/portal/signin" {
			logins.Add(1)
			r.ParseForm()
			if r.Form.Get("password") != "private-password" {
				w.WriteHeader(401)
				return
			}
			http.SetCookie(w, &http.Cookie{Name: "SESSION", Value: r.Form.Get("username"), Path: "/portal/"})
			http.Redirect(w, r, "/portal/", 302)
			return
		}
		if r.URL.Path == "/portal/user" {
			fmt.Fprint(w, `{"userId":"alice"}`)
			return
		}
		requests.Add(1)
		if strings.Contains(r.URL.Path, "/export") {
			w.Header().Set("Content-Type", "application/zip")
			fmt.Fprint(w, "password=archive-secret")
			return
		}
		if r.URL.Query().Get("appId") == "denied" {
			w.WriteHeader(403)
			fmt.Fprint(w, `{"message":"private-password managed-consumer-token","password":"hidden"}`)
			return
		}
		if r.URL.Path == "/portal/consumer-tokens/by-appId" {
			fmt.Fprint(w, `{"token":"managed-consumer-token"}`)
			return
		}
		if r.URL.Path == "/portal/apps/huge" {
			json.NewEncoder(w).Encode(map[string]any{"text": strings.Repeat("x", 700*1024)})
			return
		}
		if r.URL.Path == "/portal/apps/status-error" {
			fmt.Fprint(w, `{"code":403,"message":"denied private-password"}`)
			return
		}
		if r.URL.Path == "/portal/apps/partial-error" {
			fmt.Fprint(w, `{"entities":[{"code":500,"message":"failed private-password"}]}`)
			return
		}
		body, _ := io.ReadAll(r.Body)
		cookie, _ := r.Cookie("SESSION")
		user := ""
		if cookie != nil {
			user = cookie.Value
		}
		json.NewEncoder(w).Encode(map[string]any{"method": r.Method, "path": r.URL.Path, "query": r.URL.RawQuery, "body": string(body), "user": user, "token": "managed-consumer-token", "password": "private-password", "private-password": "dynamic map key must not reveal lifecycle credentials", "configText": "db.password = text-only-secret\nnormal=value", "items": []any{map[string]any{"key": "db.password", "value": "config-secret"}, map[string]any{"key": "api-key", "value": "separate-api-value"}}, "accessKeys": []any{map[string]any{"secret": "existing-key"}}})
	}))
	t.Cleanup(server.Close)
	return server, logins, requests
}

func TestMCPUserSearchIsExposedWithBoundedQuery(t *testing.T) {
	s, _, _ := mcpFixture(t)
	life := lifecycle(s.URL, "a", "alice", "private-password")
	result := mcpResult(t, newPlugin(), "apollo_read", map[string]any{"method": "GET", "path": "/users?keyword=alice&includeInactiveUsers=true&offset=0&limit=100"}, life, false)
	if result["data"].(map[string]any)["path"] != "/portal/users" {
		t.Fatalf("wrong user-search endpoint: %v", result)
	}
	for _, query := range []string{"offset=-1", "limit=0", "limit=2001", "includeInactiveUsers=maybe"} {
		mcpResult(t, newPlugin(), "apollo_read", map[string]any{"method": "GET", "path": "/users?" + query}, life, true)
	}
}

func TestMCPActiveTransportCannotFallBackToSavedEndpoint(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	for _, runtime := range []any{nil, map[string]any{}} {
		life := lifecycle(s.URL, "a", "alice", "private-password")
		life["connection"].(map[string]any)["transport_layers"] = []any{map[string]any{"type": "ssh"}}
		life["runtime"] = runtime
		mcpResult(t, newPlugin(), "apollo_read", map[string]any{"method": "GET", "path": "/apps/demo"}, life, true)
	}
	if logins.Load() != 0 || requests.Load() != 0 {
		t.Fatal("missing active transport endpoint sent credentials directly to saved endpoint")
	}
}

func TestMCPConfirmationBindsCompleteTransportConfiguration(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	life := lifecycle(s.URL, "a", "alice", "private-password")
	connection := life["connection"].(map[string]any)
	life["runtime"] = map[string]any{"host": connection["host"], "port": connection["port"]}
	layer := map[string]any{"type": "ssh", "id": "original-route"}
	connection["transport_layers"] = []any{layer}
	args := map[string]any{"method": "DELETE", "path": "/apps/demo", "phase": "prepare"}
	p := newPlugin()
	prepared := mcpResult(t, p, "apollo_admin", args, life, false)
	args["phase"], args["confirmationToken"] = "execute", prepared["confirmationToken"]
	layer["id"] = "different-route"
	mcpResult(t, p, "apollo_admin", args, life, true)
	if logins.Load() != 0 || requests.Load() != 0 {
		t.Fatal("confirmation replayed after host routing configuration changed")
	}
}

func TestMCPDiscoveryHasNoEffectsAndMatchesManifest(t *testing.T) {
	p := newPlugin()
	for i := 0; i < 2; i++ {
		v, e := call(t, p, "mcp/tools", map[string]any{})
		if e != nil {
			t.Fatal(e)
		}
		b, _ := json.Marshal(v)
		var discovered struct {
			Tools []struct {
				Name        string
				InputSchema map[string]any
				Annotations map[string]any
			}
		}
		if json.Unmarshal(b, &discovered) != nil || len(discovered.Tools) != 5 {
			t.Fatalf("invalid discovery %s", b)
		}
		manifestBytes, err := os.ReadFile("../manifest.json")
		if err != nil {
			t.Fatal(err)
		}
		var manifest struct {
			Contributions []struct {
				Type          string
				ExternalTools bool `json:"external_tools"`
				AITools       bool `json:"ai_tools"`
				Toolsets      []any
				Tools         map[string]struct{ Access, Toolset string }
			}
		}
		json.Unmarshal(manifestBytes, &manifest)
		var declarations map[string]struct{ Access, Toolset string }
		contributions := 0
		for _, c := range manifest.Contributions {
			if c.Type == "mcp" {
				contributions++
				declarations = c.Tools
				if !c.ExternalTools || !c.AITools || len(c.Toolsets) == 0 {
					t.Fatal("missing MCP enablement/toolsets")
				}
			}
		}
		want := map[string]string{"apollo_read": "read", "apollo_session": "read", "apollo_write": "write", "apollo_admin": "full", "apollo_authorize_consumer": "full"}
		if contributions != 1 || len(declarations) != len(want) {
			t.Fatal("MCP declarations missing or divergent")
		}
		for _, tool := range discovered.Tools {
			access, ok := want[tool.Name]
			if !ok || declarations[tool.Name].Access != access || declarations[tool.Name].Toolset == "" {
				t.Fatalf("tool/access mismatch %s", tool.Name)
			}
			if tool.Annotations["readOnlyHint"] != (access == "read") || tool.Annotations["destructiveHint"] != (access == "full") || tool.InputSchema["additionalProperties"] != false {
				t.Fatalf("schema/hints mismatch %s", tool.Name)
			}
		}
	}
	if len(p.sessions) != 0 || len(p.transfers) != 0 || len(p.epochs) != 0 {
		t.Fatal("discovery mutated state")
	}
}

func TestMCPExternalLifecycleDoesNotReplaceUIOrInheritWritableSession(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "ui-user")
	original := p.sessions["a"]
	life := lifecycle(s.URL, "a", "external-user", "private-password")
	connection := life["connection"].(map[string]any)
	connection["host"] = "saved.invalid"
	connection["port"] = 1
	u := original.base
	life["runtime"] = map[string]any{"host": u.Hostname(), "port": u.Port()}
	r := mcpResult(t, p, "apollo_read", map[string]any{"method": "GET", "path": "/apps/demo"}, life, false)
	if r["data"].(map[string]any)["user"] != "external-user" || logins.Load() != 2 || requests.Load() != 1 || p.sessions["a"] != original {
		t.Fatalf("external lifecycle isolation failed: %#v", r)
	}
	connection["read_only"] = true
	mcpResult(t, p, "apollo_write", map[string]any{"method": "POST", "path": "/favorites", "bodyBase64": base64.StdEncoding.EncodeToString([]byte(`{}`))}, life, true)
	mcpResult(t, p, "apollo_admin", map[string]any{"method": "DELETE", "path": "/apps/demo", "phase": "prepare"}, life, true)
	if logins.Load() != 2 || requests.Load() != 1 || original.readOnly {
		t.Fatal("readonly inherited writable session or authenticated")
	}
}

func TestMCPRejectsMalformedInputsBeforeNetwork(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	cases := []struct {
		tool string
		args any
		life any
	}{
		{"unknown", map[string]any{}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo"}, nil},
		{"apollo_read", map[string]any{"connectionId": "other", "method": "GET", "path": "/apps/demo"}, life},
		{"apollo_read", []any{}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo", "password": "model-password"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo", "consumerAppId": ""}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo", "connectionId": nil}, life},
		{"apollo_read", map[string]any{"method": "POST", "path": "/favorites"}, life},
		{"apollo_write", map[string]any{"method": "DELETE", "path": "/apps/demo"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/user/logout"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "http://host/apps/demo"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/%252e%252e"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo?method=DELETE"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/by-self?page=1&page=2"}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo", "headers": map[string]string{"Authorization": "secret"}}, life},
		{"apollo_read", map[string]any{"method": "GET", "path": "/apps/demo", "bodyBase64": "!!!"}, life},
	}
	for i, tc := range cases {
		t.Run(fmt.Sprint(i), func(t *testing.T) { mcpResult(t, p, tc.tool, tc.args, tc.life, true) })
	}
	if logins.Load() != 0 || requests.Load() != 0 {
		t.Fatal("invalid input caused network effects")
	}
}

func TestMCPFullConfirmationIsBoundedBoundAndSingleUse(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	args := map[string]any{"method": "DELETE", "path": "/apps/demo", "phase": "prepare"}
	prepared := mcpResult(t, p, "apollo_admin", args, life, false)
	token, ok := prepared["confirmationToken"].(string)
	if !ok || token == "" || logins.Load() != 0 {
		t.Fatalf("prepare not side-effect-free: %#v", prepared)
	}
	if summary, ok := prepared["request"].(map[string]any); !ok || summary["method"] != "DELETE" || summary["path"] != "/apps/demo" {
		t.Fatalf("confirmation does not identify action and target: %#v", prepared)
	}
	args["phase"] = "execute"
	args["confirmationToken"] = token
	args["path"] = "/apps/other"
	mcpResult(t, p, "apollo_admin", args, life, true)
	args["path"] = "/apps/demo"
	mcpResult(t, p, "apollo_admin", args, lifecycle(s.URL, "b", "alice", "private-password"), true)
	mcpResult(t, p, "apollo_admin", args, life, false)
	mcpResult(t, p, "apollo_admin", args, life, true)
	if logins.Load() != 1 || requests.Load() != 1 {
		t.Fatal("confirmed operation replayed or failed to execute")
	}
}

func TestMCPRedactsManagedSecretsAndErrorsAndWithholdsBinaryExports(t *testing.T) {
	s, _, _ := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	for _, path := range []string{"/apps/demo", "/configs/export?envs=DEV", "/consumer-tokens/by-appId?appId=denied", "/apps/status-error", "/apps/partial-error"} {
		r := mcpResult(t, p, "apollo_read", map[string]any{"method": "GET", "path": path}, life, strings.Contains(path, "denied") || strings.Contains(path, "error"))
		b, _ := json.Marshal(r)
		for _, secret := range []string{"private-password", "managed-consumer-token", "config-secret", "text-only-secret", "separate-api-value", "existing-key", "archive-secret"} {
			if strings.Contains(string(b), secret) {
				t.Fatalf("secret leaked in %s: %s", path, b)
			}
		}
		if strings.Contains(path, "export") && r["binaryOmitted"] != true {
			t.Fatalf("raw export not withheld: %s", b)
		}
	}
}

func TestMCPConsumerAuthorizationResolvesTokenWithoutModelCredentials(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	args := map[string]any{"consumerAppId": "consumer-app", "type": "NamespaceRole", "envs": "DEV", "namespace": map[string]string{"appId": "demo", "namespaceName": "application"}, "phase": "prepare"}
	r := mcpResult(t, p, "apollo_authorize_consumer", args, life, false)
	if logins.Load() != 0 {
		t.Fatal("prepare authenticated")
	}
	args["phase"] = "execute"
	args["confirmationToken"] = r["confirmationToken"]
	r = mcpResult(t, p, "apollo_authorize_consumer", args, life, false)
	b, _ := json.Marshal(r)
	if requests.Load() != 2 || strings.Contains(string(b), "managed-consumer-token") {
		t.Fatalf("token lookup/grant/redaction failed %s", b)
	}
}

func TestMCPEndpointInventoryDispatch(t *testing.T) {
	s, _, requests := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	// Hand-derived endpoint examples exercise the public adapter rather than only its classifier.
	groups := map[string]string{
		"apollo_read": `GET /permissions/root
GET /system/role/createApplication/alice
GET /envs
GET /system/role/createApplication
GET /system-info
GET /system-info/health?instanceId=1
GET /openapi/v1/organizations
GET /apps/by-self?page=0&size=10
GET /apps/search/by-appid-or-name?query=x&page=0&size=20
GET /favorites?userId=alice&appId=demo&page=0&size=100
GET /appnamespaces/public?page=0&size=100
GET /apps/demo
GET /apps/demo/navtree
GET /apps/demo/permissions/AssignRole
GET /apps/demo/role_users
GET /apps/demo/appnamespaces/application
GET /apps/demo/namespaces/publish_info
GET /apps/demo/namespaces/application/permissions/ModifyNamespace
GET /apps/demo/envs/DEV/namespaces/application/permissions/ModifyNamespace
GET /apps/demo/envs/DEV/clusters/default/ns_permissions/ModifyNamespacesInCluster
GET /apps/demo/namespaces/application/role_users
GET /apps/demo/envs/DEV/namespaces/application/role_users
GET /apps/demo/envs/DEV/clusters/default/ns_role_users
GET /apps/demo/envs/DEV/clusters/default
GET /apps/demo/envs/DEV/clusters/default/namespaces
GET /apps/demo/envs/DEV/clusters/default/namespaces/application
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/items
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/commits?key=x&page=0&size=10
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/releases/histories?page=0&size=10
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/releases/all?page=0&size=100
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/releases/active?page=0&size=1
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/branches
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/branches/gray/rules
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/lock-info
GET /envs/DEV/releases/1
GET /envs/DEV/releases/compare?baseReleaseId=1&toCompareReleaseId=2
GET /envs/DEV/instances/by-namespace?appId=demo&clusterName=default&namespaceName=application&instanceAppId=&page=0&size=20
GET /server/portal-db/config/find-all-config
GET /server/envs/DEV/config-db/config/find-all-config
GET /apps/demo/envs/DEV/accesskeys
GET /consumers?page=0&size=20
GET /consumer-tokens/by-appId?appId=demo
GET /apps/demo/namespaces/application/usage
GET /apps/demo/envs/DEV/clusters/default/linked-namespaces/application/usage
GET /apollo/audit/logs?page=0&size=20
GET /apollo/audit/logs/by-name-or-type-or-operator?query=x&page=0&size=20
GET /apollo/audit/logs/opName?opName=x&page=0&size=20&startDate=&endDate=
GET /apollo/audit/properties
GET /apollo/audit/trace?traceId=1
GET /apollo/audit/logs/dataInfluences/field?entityName=Item&entityId=1&fieldName=value&page=0&size=10
GET /global-search/item-info/by-key-or-value?key=x&value=y
GET /apps/demo/envs/DEV/clusters/default/namespaces/application/items/export
GET /apps/demo/envs/DEV/clusters/default/export
GET /configs/export?envs=DEV
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/syntax-check
POST /namespaces/application/diff`,
		"apollo_write": `POST /favorites
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/item
PUT /apps/demo/envs/DEV/clusters/default/namespaces/application/item
POST /apps/demo/envs/DEV/clusters
POST /apps/demo/appnamespaces?appendNamespacePrefix=false
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/branches`,
		"apollo_admin": `DELETE /favorites/1
DELETE /apps/demo/envs/DEV/clusters/default/namespaces/application/items/1
DELETE /apps/demo/envs/DEV/clusters/default/namespaces/application/branches/gray
DELETE /apps/demo
DELETE /apps/demo/appnamespaces/application
DELETE /apps/demo/envs/DEV/clusters/default
DELETE /apps/demo/envs/DEV/clusters/default/linked-namespaces/application
POST /apps
PUT /apps/demo
PUT /apps/demo/envs/DEV/clusters/default/namespaces/application/items
PUT /apps/demo/envs/DEV/clusters/default/namespaces/application/revoke-items
PUT /apps/demo/envs/DEV/clusters/default/namespaces/application/branches/gray/rules
PUT /apps/demo/namespaces/application/items
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/releases
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/branches/gray/releases
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/branches/gray/merge?deleteBranch=true
PUT /envs/DEV/releases/1/rollback?toReleaseId=2
POST /users?isCreate=true
PUT /users/enabled
POST /server/portal-db/config
POST /server/envs/DEV/config-db/config
POST /apps/demo/envs/DEV/accesskeys
PUT /apps/demo/envs/DEV/accesskeys/1/enable?mode=0
PUT /apps/demo/envs/DEV/accesskeys/1/disable
DELETE /apps/demo/envs/DEV/accesskeys/1
POST /consumers?expires=20270101000000
DELETE /consumers/by-appId?appId=consumer
POST /system/role/createApplication
DELETE /system/role/createApplication/alice
POST /apps/demo/system/master/alice
DELETE /apps/demo/system/master/alice
POST /apps/demo/roles/Master
DELETE /apps/demo/roles/Master?user=alice
POST /apps/demo/namespaces/application/roles/ModifyNamespace
DELETE /apps/demo/namespaces/application/roles/ModifyNamespace?user=alice
POST /apps/demo/envs/DEV/namespaces/application/roles/ModifyNamespace
DELETE /apps/demo/envs/DEV/namespaces/application/roles/ModifyNamespace?user=alice
POST /apps/demo/envs/DEV/clusters/default/ns_roles/ModifyNamespacesInCluster
DELETE /apps/demo/envs/DEV/clusters/default/ns_roles/ModifyNamespacesInCluster?user=alice
POST /apps/demo/initPermission
POST /apps/demo/envs/DEV/clusters/default/initNsPermission
POST /apps/demo/namespaces
POST /apps/demo/envs/DEV/clusters/default/namespaces/application/items/import
POST /apps/demo/envs/DEV/clusters/default/import?conflictAction=ignore
POST /configs/import?envs=DEV&conflictAction=cover`,
	}
	count := int32(0)
	for tool, lines := range groups {
		for _, line := range strings.Split(lines, "\n") {
			parts := strings.SplitN(line, " ", 2)
			t.Run(tool+" "+line, func(t *testing.T) {
				args := map[string]any{"method": parts[0], "path": parts[1]}
				if tool == "apollo_admin" {
					args["phase"] = "prepare"
					prepare := mcpResult(t, p, tool, args, life, false)
					args["phase"] = "execute"
					args["confirmationToken"] = prepare["confirmationToken"]
				}
				r := mcpResult(t, p, tool, args, life, false)
				if data, ok := r["data"].(map[string]any); ok && data["method"] != nil && data["method"] != parts[0] {
					t.Fatalf("method drift: %#v", r)
				}
				count++
			})
		}
	}
	if requests.Load() != count {
		t.Fatalf("dispatch count = %d, want %d", requests.Load(), count)
	}
}

func TestMCPConfirmationExpiresAndTracksCurrentLifecycle(t *testing.T) {
	s, logins, requests := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	args := map[string]any{"method": "DELETE", "path": "/apps/demo", "phase": "prepare"}
	prepare := mcpResult(t, p, "apollo_admin", args, life, false)
	token := prepare["confirmationToken"].(string)
	args["phase"] = "execute"
	args["confirmationToken"] = token
	changed := lifecycle(s.URL, "a", "other-user", "private-password")
	mcpResult(t, p, "apollo_admin", args, changed, true)
	p.mu.Lock()
	c := p.confirmations[token]
	c.expires = time.Now().Add(-time.Second)
	p.confirmations[token] = c
	p.mu.Unlock()
	mcpResult(t, p, "apollo_admin", args, life, true)
	if logins.Load() != 0 || requests.Load() != 0 {
		t.Fatal("expired or lifecycle-changed confirmation caused network work")
	}
}

func TestMCPProvisioningPasswordOnlyUsesConfirmedFullTool(t *testing.T) {
	s, logins, _ := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	body := base64.StdEncoding.EncodeToString([]byte(`{"username":"new-user","password":"new-provisioning-password"}`))
	args := map[string]any{"method": "POST", "path": "/users?isCreate=true", "headers": map[string]string{"Content-Type": "application/json"}, "bodyBase64": body}
	for _, tool := range []string{"apollo_read", "apollo_write"} {
		mcpResult(t, p, tool, args, life, true)
	}
	if logins.Load() != 0 {
		t.Fatal("lower access authenticated for a provisioning API")
	}
	args["phase"] = "prepare"
	prepare := mcpResult(t, p, "apollo_admin", args, life, false)
	args["phase"] = "execute"
	args["confirmationToken"] = prepare["confirmationToken"]
	r := mcpResult(t, p, "apollo_admin", args, life, false)
	encoded, _ := json.Marshal(r)
	if strings.Contains(string(encoded), "new-provisioning-password") {
		t.Fatalf("provisioning password echoed: %s", encoded)
	}
}

func TestMCPBoundedResultsAndSessionMetadata(t *testing.T) {
	s, logins, _ := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	r := mcpResult(t, p, "apollo_session", map[string]any{}, life, false)
	if r["readOnly"] != false || r["connectionId"] != "a" || logins.Load() != 0 {
		t.Fatal("session metadata authenticates or differs from lifecycle")
	}
	r = mcpResult(t, p, "apollo_read", map[string]any{"method": "GET", "path": "/apps/huge"}, life, false)
	if r["truncated"] != true {
		t.Fatal("large result not bounded")
	}
	r = mcpResult(t, p, "apollo_read", map[string]any{"method": "GET", "path": "/user"}, life, false)
	if r["data"].(map[string]any)["userId"] != "alice" {
		t.Fatal("user capability unavailable")
	}
}

func TestMCPServiceErrorsDoNotResembleSuccess(t *testing.T) {
	s, _, _ := mcpFixture(t)
	p := newPlugin()
	life := lifecycle(s.URL, "a", "alice", "private-password")
	for _, path := range []string{"/apps/status-error", "/apps/partial-error"} {
		t.Run(path, func(t *testing.T) {
			mcpResult(t, p, "apollo_read", map[string]any{"method": "GET", "path": path}, life, true)
		})
	}
}
