package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const maxBodyBytes = 4 * 1024 * 1024

type connectionConfig struct {
	ID       string            `json:"id"`
	Host     string            `json:"host"`
	Port     json.RawMessage   `json:"port"`
	Username string            `json:"username"`
	Password string            `json:"password"`
	Secrets  map[string]string `json:"connection_secrets"`
	Config   map[string]any    `json:"external_config"`
	ReadOnly bool              `json:"read_only"`
}
type lifecycleParams struct {
	Connection connectionConfig `json:"connection"`
	Runtime    *struct {
		Host string          `json:"host"`
		Port json.RawMessage `json:"port"`
	} `json:"runtime"`
}
type requestParams struct {
	ConnectionID string            `json:"connectionId"`
	Method       string            `json:"method"`
	Path         string            `json:"path"`
	Headers      map[string]string `json:"headers,omitempty"`
	BodyBase64   string            `json:"bodyBase64,omitempty"`
}
type portalResponse struct {
	Status     int               `json:"status"`
	Headers    map[string]string `json:"headers"`
	BodyBase64 string            `json:"bodyBase64"`
	DownloadID string            `json:"downloadId,omitempty"`
	Size       int               `json:"size,omitempty"`
}
type portalSession struct {
	base     *url.URL
	client   *http.Client
	readOnly bool
	ctx      context.Context
	cancel   context.CancelFunc
}

func (s *portalSession) close() { s.cancel(); s.client.CloseIdleConnections() }

func portNumber(raw json.RawMessage) (string, error) {
	value := strings.Trim(string(raw), `"`)
	n, err := strconv.Atoi(value)
	if err != nil || n < 1 || n > 65535 {
		return "", errors.New("Portal port must be between 1 and 65535")
	}
	return strconv.Itoa(n), nil
}

func login(v lifecycleParams) (*portalSession, error) {
	c := v.Connection
	scheme, _ := c.Config["scheme"].(string)
	if scheme == "" {
		scheme = "http"
	}
	if scheme != "http" && scheme != "https" {
		return nil, errors.New("Portal scheme must be http or https")
	}
	host, port := c.Host, c.Port
	if v.Runtime != nil && v.Runtime.Host != "" {
		host, port = v.Runtime.Host, v.Runtime.Port
	}
	host = strings.TrimSpace(host)
	if host == "" || strings.ContainsAny(host, "/@?#\\\r\n\t ") || strings.Contains(host, ":") && net.ParseIP(strings.Trim(host, "[]")) == nil {
		return nil, errors.New("Use a Portal hostname only, without URL, path or credentials")
	}
	p, err := portNumber(port)
	if err != nil {
		return nil, err
	}
	prefix, _ := c.Config["context_path"].(string)
	prefix = strings.TrimRight(prefix, "/")
	if prefix != "" {
		if _, err := relativePath(prefix); err != nil || strings.ContainsAny(prefix, "?%") {
			return nil, errors.New("Invalid Portal context path")
		}
	}
	if c.Username == "" {
		return nil, errors.New("Portal username is required")
	}
	password := c.Secrets["password"]
	if password == "" {
		password = c.Password
	}
	if password == "" {
		return nil, errors.New("Portal password is required")
	}
	base := &url.URL{Scheme: scheme, Host: net.JoinHostPort(strings.Trim(host, "[]"), p), Path: prefix + "/"}
	jar, _ := cookiejar.New(nil)
	ctx, cancel := context.WithCancel(context.Background())
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.ResponseHeaderTimeout = 20 * time.Second
	s := &portalSession{base: base, client: &http.Client{Jar: jar, Transport: transport, Timeout: 25 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}, readOnly: c.ReadOnly, ctx: ctx, cancel: cancel}
	succeeded := false
	defer func() {
		if !succeeded {
			s.close()
		}
	}()
	form := url.Values{"username": {c.Username}, "password": {password}}
	r, err := s.perform("POST", "/signin", map[string]string{"Content-Type": "application/x-www-form-urlencoded"}, []byte(form.Encode()))
	if err != nil {
		return nil, err
	}
	if r.StatusCode >= 300 && r.StatusCode < 400 {
		redirect, err := s.redirect(r)
		if err != nil || strings.Contains(redirect.Path, "/signin") {
			r.Body.Close()
			return nil, errors.New("Apollo login failed; check credentials and ordinary password authentication")
		}
	} else if r.StatusCode < 200 || r.StatusCode >= 300 {
		r.Body.Close()
		return nil, errors.New("Apollo login failed; check credentials and ordinary password authentication")
	}
	r.Body.Close()
	r, err = s.perform("GET", "/user", nil, nil)
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	var user struct {
		UserID string `json:"userId"`
	}
	if r.StatusCode != 200 || json.NewDecoder(io.LimitReader(r.Body, 65536)).Decode(&user) != nil || user.UserID == "" {
		return nil, errors.New("Apollo login failed; Portal session verification did not return a user")
	}
	succeeded = true
	return s, nil
}

func relativePath(path string) (*url.URL, error) {
	if !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") || strings.ContainsAny(path, "\\#\r\n\x00") {
		return nil, errors.New("Request must be a relative Portal path")
	}
	u, err := url.Parse(path)
	if err != nil || u.IsAbs() || u.Host != "" || u.Opaque != "" {
		return nil, errors.New("Invalid Portal path")
	}
	decoded := u.EscapedPath()
	for i := 0; i < 5; i++ {
		next, err := url.PathUnescape(decoded)
		if err != nil {
			return nil, errors.New("Invalid encoded path")
		}
		if strings.ContainsAny(next, "\\\r\n\x00") || strings.HasPrefix(next, "//") {
			return nil, errors.New("Unsafe encoded path")
		}
		for _, part := range strings.Split(next, "/") {
			if part == ".." || part == "." {
				return nil, errors.New("Portal path traversal is not allowed")
			}
		}
		if next == decoded {
			return u, nil
		}
		decoded = next
	}
	return nil, errors.New("Excessively encoded path")
}

func (s *portalSession) perform(method, path string, headers map[string]string, body []byte) (*http.Response, error) {
	u, err := relativePath(path)
	if err != nil {
		return nil, err
	}
	target := *s.base
	target.Path = strings.TrimSuffix(s.base.Path, "/") + u.Path
	target.RawPath = strings.TrimSuffix(s.base.EscapedPath(), "/") + u.EscapedPath()
	target.RawQuery = u.RawQuery
	r, err := http.NewRequestWithContext(s.ctx, method, target.String(), bytes.NewReader(body))
	if err != nil {
		return nil, errors.New("Invalid Portal request")
	}
	for k, v := range headers {
		r.Header.Set(k, v)
	}
	r.Header.Set("Accept", "application/json")
	response, err := s.client.Do(r)
	if err != nil {
		return nil, errors.New("Apollo Portal request failed; check network, TLS trust or reconnect (25s timeout)")
	}
	return response, nil
}

func (s *portalSession) redirect(r *http.Response) (*url.URL, error) {
	u, err := r.Location()
	if err != nil || u.Scheme != s.base.Scheme || u.Host != s.base.Host || !strings.HasPrefix(u.Path, s.base.Path) || u.User != nil {
		return nil, errors.New("Apollo redirect left the configured Portal; external/SSO redirects are unsupported")
	}
	if _, err := relativePath(u.RequestURI()); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *portalSession) request(v requestParams) (portalResponse, error) {
	u, pathError := relativePath(v.Path)
	if pathError != nil {
		return portalResponse{}, pathError
	}
	if u.Path == "/signin" || u.Path == "/user/logout" {
		return portalResponse{}, errors.New("Use the DBX connection lifecycle for login/logout")
	}
	method := strings.ToUpper(v.Method)
	switch method {
	case "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE":
	default:
		return portalResponse{}, errors.New("Unsupported HTTP method")
	}
	if s.readOnly && method != "GET" && method != "HEAD" {
		return portalResponse{}, errors.New("This DBX connection is read-only")
	}
	for key, value := range v.Headers {
		switch strings.ToLower(key) {
		case "content-type", "accept", "if-match", "if-none-match", "x-requested-with":
		default:
			return portalResponse{}, errors.New("Request header is not permitted")
		}
		if strings.ContainsAny(value, "\r\n") {
			return portalResponse{}, errors.New("Invalid request header")
		}
	}
	if len(v.BodyBase64) > (maxBodyBytes+2)/3*4 {
		return portalResponse{}, errors.New("Request exceeds 4 MiB limit")
	}
	body, err := base64.StdEncoding.DecodeString(v.BodyBase64)
	if err != nil || len(body) > maxBodyBytes {
		return portalResponse{}, errors.New("Invalid or oversized request body")
	}
	r, err := s.perform(method, v.Path, v.Headers, body)
	if err != nil {
		return portalResponse{}, err
	}
	defer r.Body.Close()
	if r.StatusCode >= 300 && r.StatusCode < 400 {
		u, err := s.redirect(r)
		if err != nil {
			return portalResponse{}, err
		}
		if strings.HasSuffix(u.Path, "/signin") {
			return portalResponse{Status: 401, Headers: map[string]string{"content-type": "application/json"}, BodyBase64: base64.StdEncoding.EncodeToString([]byte(`{"message":"Apollo session expired; reconnect in DBX"}`))}, nil
		}
		return portalResponse{}, errors.New("Unexpected Portal redirect; request was not retried")
	}
	data, err := io.ReadAll(io.LimitReader(r.Body, maxBodyBytes+1))
	if err != nil {
		return portalResponse{}, errors.New("Could not read Portal response")
	}
	if len(data) > maxBodyBytes {
		return portalResponse{}, errors.New("Portal response exceeds 4 MiB limit")
	}
	headers := map[string]string{}
	for _, key := range []string{"Content-Type", "Content-Disposition", "ETag", "Last-Modified"} {
		if value := r.Header.Get(key); value != "" {
			headers[strings.ToLower(key)] = value
		}
	}
	return portalResponse{Status: r.StatusCode, Headers: headers, BodyBase64: base64.StdEncoding.EncodeToString(data)}, nil
}
