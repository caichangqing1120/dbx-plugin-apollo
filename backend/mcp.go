package main

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
)

type mcpRoute struct{ method, path, query, access string }

// This is the finite service surface used by ApolloClient, not a general HTTP proxy.
// Query names are part of the route contract: unknown parameters cannot select a
// different operation on an otherwise read-only endpoint.
var mcpRoutes = []mcpRoute{
	{"GET", "/user", "", "read"},
	{"GET", "/users", "keyword,includeInactiveUsers,offset,limit", "read"},
	{"GET", "/permissions/root", "", "read"},
	{"GET", "/system/role/createApplication/{user}", "", "read"},
	{"GET", "/envs", "", "read"},
	{"GET", "/system/role/createApplication", "", "read"},
	{"GET", "/system-info", "", "read"},
	{"GET", "/system-info/health", "instanceId", "read"},
	{"GET", "/openapi/v1/organizations", "", "read"},
	{"GET", "/apps/by-self", "page,size", "read"},
	{"GET", "/apps/search/by-appid-or-name", "query,page,size", "read"},
	{"GET", "/favorites", "userId,appId,page,size", "read"},
	{"GET", "/appnamespaces/public", "page,size", "read"},
	{"GET", "/apps/{app}", "", "read"},
	{"GET", "/apps/{app}/navtree", "", "read"},
	{"GET", "/apps/{app}/permissions/{role}", "", "read"},
	{"GET", "/apps/{app}/role_users", "", "read"},
	{"GET", "/apps/{app}/appnamespaces/{namespace}", "", "read"},
	{"GET", "/apps/{app}/namespaces/publish_info", "", "read"},
	{"GET", "/apps/{app}/namespaces/{namespace}/permissions/{role}", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/namespaces/{namespace}/permissions/{role}", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/ns_permissions/{role}", "", "read"},
	{"GET", "/apps/{app}/namespaces/{namespace}/role_users", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/namespaces/{namespace}/role_users", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/ns_role_users", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/items", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/commits", "key,page,size", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/releases/histories", "page,size", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/releases/all", "page,size", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/releases/active", "page,size", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches/{id}/rules", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/lock-info", "", "read"},
	{"GET", "/envs/{env}/releases/compare", "baseReleaseId,toCompareReleaseId", "read"},
	{"GET", "/envs/{env}/releases/{id}", "", "read"},
	{"GET", "/envs/{env}/instances/by-namespace", "appId,clusterName,namespaceName,instanceAppId,page,size", "read"},
	{"GET", "/server/portal-db/config/find-all-config", "", "read"},
	{"GET", "/server/envs/{env}/config-db/config/find-all-config", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/accesskeys", "", "read"},
	{"GET", "/consumers", "page,size", "read"},
	{"GET", "/consumer-tokens/by-appId", "appId", "read"},
	{"GET", "/apps/{app}/namespaces/{namespace}/usage", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/linked-namespaces/{namespace}/usage", "", "read"},
	{"GET", "/apollo/audit/logs", "page,size", "read"},
	{"GET", "/apollo/audit/logs/by-name-or-type-or-operator", "query,page,size", "read"},
	{"GET", "/apollo/audit/logs/opName", "opName,page,size,startDate,endDate", "read"},
	{"GET", "/apollo/audit/properties", "", "read"},
	{"GET", "/apollo/audit/trace", "traceId", "read"},
	{"GET", "/apollo/audit/logs/dataInfluences/field", "entityName,entityId,fieldName,page,size", "read"},
	{"GET", "/global-search/item-info/by-key-or-value", "key,value", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/items/export", "", "read"},
	{"GET", "/apps/{app}/envs/{env}/clusters/{cluster}/export", "", "read"},
	{"GET", "/configs/export", "envs", "read"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/syntax-check", "", "read"},
	{"POST", "/namespaces/{namespace}/diff", "", "read"},
	{"POST", "/favorites", "", "write"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/item", "", "write"},
	{"PUT", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/item", "", "write"},
	{"POST", "/apps/{app}/envs/{env}/clusters", "", "write"},
	{"POST", "/apps/{app}/appnamespaces", "appendNamespacePrefix", "write"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches", "", "write"},
	{"DELETE", "/favorites/{id}", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/items/{id}", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches/{id}", "", "full"},
	{"DELETE", "/apps/{app}", "", "full"},
	{"DELETE", "/apps/{app}/appnamespaces/{namespace}", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/clusters/{cluster}", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/clusters/{cluster}/linked-namespaces/{namespace}", "", "full"},
	{"POST", "/apps", "", "full"},
	{"PUT", "/apps/{app}", "", "full"},
	{"PUT", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/items", "", "full"},
	{"PUT", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/revoke-items", "", "full"},
	{"PUT", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches/{id}/rules", "", "full"},
	{"PUT", "/apps/{app}/namespaces/{namespace}/items", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/releases", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches/{id}/releases", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/branches/{id}/merge", "deleteBranch", "full"},
	{"PUT", "/envs/{env}/releases/{id}/rollback", "toReleaseId", "full"},
	{"POST", "/users", "isCreate", "full"},
	{"PUT", "/users/enabled", "", "full"},
	{"POST", "/server/portal-db/config", "", "full"},
	{"POST", "/server/envs/{env}/config-db/config", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/accesskeys", "", "full"},
	{"PUT", "/apps/{app}/envs/{env}/accesskeys/{id}/enable", "mode", "full"},
	{"PUT", "/apps/{app}/envs/{env}/accesskeys/{id}/disable", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/accesskeys/{id}", "", "full"},
	{"POST", "/consumers", "expires", "full"},
	{"DELETE", "/consumers/by-appId", "appId", "full"},
	{"POST", "/system/role/createApplication", "", "full"},
	{"DELETE", "/system/role/createApplication/{user}", "", "full"},
	{"POST", "/apps/{app}/system/master/{user}", "", "full"},
	{"DELETE", "/apps/{app}/system/master/{user}", "", "full"},
	{"POST", "/apps/{app}/roles/Master", "", "full"},
	{"DELETE", "/apps/{app}/roles/Master", "user", "full"},
	{"POST", "/apps/{app}/namespaces/{namespace}/roles/{role}", "", "full"},
	{"DELETE", "/apps/{app}/namespaces/{namespace}/roles/{role}", "user", "full"},
	{"POST", "/apps/{app}/envs/{env}/namespaces/{namespace}/roles/{role}", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/namespaces/{namespace}/roles/{role}", "user", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/ns_roles/{role}", "", "full"},
	{"DELETE", "/apps/{app}/envs/{env}/clusters/{cluster}/ns_roles/{role}", "user", "full"},
	{"POST", "/apps/{app}/initPermission", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/initNsPermission", "", "full"},
	{"POST", "/apps/{app}/namespaces", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/namespaces/{namespace}/items/import", "", "full"},
	{"POST", "/apps/{app}/envs/{env}/clusters/{cluster}/import", "conflictAction", "full"},
	{"POST", "/configs/import", "envs,conflictAction", "full"},
}

type mcpArguments struct {
	ConnectionID      string            `json:"connectionId,omitempty"`
	Method            string            `json:"method,omitempty"`
	Path              string            `json:"path,omitempty"`
	Headers           map[string]string `json:"headers,omitempty"`
	BodyBase64        string            `json:"bodyBase64,omitempty"`
	Phase             string            `json:"phase,omitempty"`
	ConfirmationToken string            `json:"confirmationToken,omitempty"`
	ConsumerAppID     string            `json:"consumerAppId,omitempty"`
	Type              string            `json:"type,omitempty"`
	Envs              string            `json:"envs,omitempty"`
	Namespace         *struct {
		AppID         string `json:"appId"`
		NamespaceName string `json:"namespaceName"`
	} `json:"namespace,omitempty"`
}

type mcpConfirmation struct {
	digest  [32]byte
	expires time.Time
}

func mcpConfirmationSummary(tool string, args mcpArguments, life lifecycleParams) any {
	secrets := []string{life.Connection.Password}
	for _, secret := range life.Connection.Secrets {
		secrets = append(secrets, secret)
	}
	summary := map[string]any{"tool": tool, "connectionId": life.Connection.ID}
	if tool == "apollo_authorize_consumer" {
		summary["action"] = "Grant consumer role"
		summary["consumerAppId"] = args.ConsumerAppID
		summary["type"] = args.Type
		summary["envs"] = args.Envs
		encoded, _ := json.Marshal(args.Namespace)
		var namespace any
		json.Unmarshal(encoded, &namespace)
		summary["namespace"] = namespace
	} else {
		summary["method"] = args.Method
		summary["path"] = args.Path
		body, _ := base64.StdEncoding.DecodeString(args.BodyBase64)
		summary["bodyBytes"] = len(body)
		var value any
		if len(body) > 64*1024 || len(body) > 0 && json.Unmarshal(body, &value) != nil {
			summary["bodyPreview"] = "Opaque/large body omitted; review the exact original request before approval"
		} else {
			summary["bodyPreview"] = value
		}
	}
	return mcpRedact(summary, secrets, 0)
}

func mcpTools() any {
	tools := []any{}
	for _, entry := range []struct{ name, access, description string }{
		{"apollo_read", "read", "Read allowlisted Apollo service APIs and redacted configuration/export previews. Raw binary exports and managed credentials are withheld. POST is only syntax-check or diff; readonly connections retain the existing non-GET restriction."},
		{"apollo_write", "write", "Ordinary allowlisted Apollo changes: favorites, single items, new clusters/namespaces/gray branches. No destructive, bulk or administrator operations."},
		{"apollo_admin", "full", "Destructive, bulk, release/rollback, import, access-key, role, user and system administration APIs. First prepare, explicitly review the request, then execute with the returned single-use confirmationToken. Never automatically confirm."},
		{"apollo_authorize_consumer", "full", "Authorize an existing consumer by consumerAppId. Token is resolved backend-side, never accepted or returned. Two-phase prepare/execute confirmation is mandatory."},
		{"apollo_session", "read", "Return the host-bound lifecycle identity and read-only policy, without authentication, endpoint or credential disclosure."},
	} {
		props := map[string]any{"connectionId": map[string]any{"type": "string", "description": "Optional assertion; must equal lifecycle.connection.id. The host supplies lifecycle, not model arguments."}}
		required := []string{}
		if entry.name == "apollo_authorize_consumer" {
			props["consumerAppId"] = map[string]any{"type": "string", "minLength": 1, "maxLength": 512}
			props["type"] = map[string]any{"type": "string", "enum": []string{"AppRole", "NamespaceRole"}}
			props["envs"] = map[string]any{"type": "string", "description": "Comma-separated environment names; empty means the existing Portal default."}
			props["namespace"] = map[string]any{"type": "object", "properties": map[string]any{"appId": map[string]any{"type": "string", "minLength": 1}, "namespaceName": map[string]any{"type": "string"}}, "required": []string{"appId"}, "additionalProperties": false}
			required = []string{"consumerAppId", "type", "namespace", "phase"}
		} else if entry.name != "apollo_session" {
			methods := []string{"GET", "POST"}
			if entry.access == "write" {
				methods = []string{"POST", "PUT"}
			}
			if entry.access == "full" {
				methods = []string{"POST", "PUT", "DELETE"}
			}
			props["method"] = map[string]any{"type": "string", "enum": methods}
			paths := []string{}
			for _, route := range mcpRoutes {
				if route.access == entry.access {
					paths = append(paths, route.method+" "+route.path+" (query: "+route.query+")")
				}
			}
			props["path"] = map[string]any{"type": "string", "maxLength": 8192, "description": "Relative Portal path; only these method/path/query contracts are permitted. Braced names are single encoded segments. " + strings.Join(paths, "; ")}
			props["headers"] = map[string]any{"type": "object", "properties": map[string]any{"Content-Type": map[string]any{"type": "string"}, "Accept": map[string]any{"type": "string"}, "If-Match": map[string]any{"type": "string"}, "If-None-Match": map[string]any{"type": "string"}, "X-Requested-With": map[string]any{"type": "string"}}, "additionalProperties": false}
			props["bodyBase64"] = map[string]any{"type": "string", "maxLength": (maxBodyBytes + 2) / 3 * 4, "description": "Base64 service request bytes (JSON, text/plain role user, or multipart file import); maximum 4 MiB. Cannot supply connection credentials/routing. New user passwords are provisioning input only on the confirmed full-access /users API."}
			required = []string{"method", "path"}
		}
		if entry.access == "full" {
			props["phase"] = map[string]any{"type": "string", "enum": []string{"prepare", "execute"}, "description": "prepare has no service/network effects; execute requires explicit approval and a matching confirmation token."}
			props["confirmationToken"] = map[string]any{"type": "string", "maxLength": 64, "description": "Single-use, two-minute token bound to tool, exact request and current lifecycle. Required for execute only."}
			if entry.name == "apollo_admin" {
				required = append(required, "phase")
			}
		}
		tools = append(tools, map[string]any{"name": entry.name, "description": entry.description, "inputSchema": map[string]any{"type": "object", "properties": props, "required": required, "additionalProperties": false}, "annotations": map[string]any{"readOnlyHint": entry.access == "read", "destructiveHint": entry.access == "full", "idempotentHint": false, "openWorldHint": true}})
	}
	return map[string]any{"tools": tools}
}

func strictMCPJSON(raw []byte, target any) error {
	if len(bytes.TrimSpace(raw)) == 0 || bytes.TrimSpace(raw)[0] != '{' {
		return errors.New("Expected a JSON object")
	}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if decoder.Decode(target) != nil {
		return errors.New("Invalid or unknown MCP arguments")
	}
	if decoder.Decode(new(any)) != io.EOF {
		return errors.New("Invalid trailing JSON")
	}
	return nil
}

func mcpEnvelope(value any, failed bool) any {
	data, err := json.Marshal(value)
	if err != nil {
		data = []byte(`{"error":"Could not encode Apollo result"}`)
		failed = true
	}
	if len(data) > inlineBodyBytes {
		data = []byte(`{"truncated":true,"untrusted":true,"message":"Redacted result exceeds 512 KiB; narrow the query or use the authorized UI for full-fidelity output"}`)
	}
	return map[string]any{"content": []any{map[string]any{"type": "text", "text": string(data)}}, "isError": failed}
}

func mcpFailure(message string) any { return mcpEnvelope(map[string]any{"error": message}, true) }

func safeMCPSegment(value string) bool {
	if value == "" || len(value) > 512 || value == "." || value == ".." || strings.ContainsAny(value, "/\\%?#;") {
		return false
	}
	return !strings.ContainsFunc(value, unicode.IsControl)
}

func mcpPathMatch(pattern, path string) bool {
	a, b := strings.Split(pattern, "/"), strings.Split(path, "/")
	if len(a) != len(b) {
		return false
	}
	for i := 1; i < len(a); i++ {
		if !safeMCPSegment(b[i]) || (!strings.HasPrefix(a[i], "{") && a[i] != b[i]) {
			return false
		}
	}
	return true
}

func validateMCPQuery(raw, allowed string) bool {
	values, err := url.ParseQuery(raw)
	if err != nil {
		return false
	}
	for key, vals := range values {
		if len(vals) != 1 || !strings.Contains(","+allowed+",", ","+key+",") || len(vals[0]) > 2048 || strings.ContainsFunc(vals[0], unicode.IsControl) {
			return false
		}
		value := vals[0]
		switch key {
		case "page", "size", "mode", "offset", "limit":
			n, e := strconv.Atoi(value)
			if e != nil || n < 0 || n > 1000000 || (key == "size" || key == "limit") && (n == 0 || n > 2000) {
				return false
			}
		case "isCreate", "appendNamespacePrefix", "deleteBranch", "includeInactiveUsers":
			if value != "true" && value != "false" {
				return false
			}
		case "conflictAction":
			if value != "ignore" && value != "cover" {
				return false
			}
		case "expires":
			if !regexp.MustCompile(`^\d{14}$`).MatchString(value) {
				return false
			}
		}
	}
	return true
}

func validateMCPRequest(args mcpArguments, access string) (requestParams, error) {
	v := requestParams{ConnectionID: args.ConnectionID, Method: args.Method, Path: args.Path, Headers: args.Headers, BodyBase64: args.BodyBase64}
	u, e := relativePath(v.Path)
	if e != nil || len(v.Path) > 8192 {
		return v, errors.New("Invalid relative Portal path")
	}
	matched := false
	for _, route := range mcpRoutes {
		if route.method == v.Method && mcpPathMatch(route.path, u.Path) {
			if route.access != access || !validateMCPQuery(u.RawQuery, route.query) {
				return v, errors.New("Method, path or query is not permitted for this tool")
			}
			matched = true
			break
		}
	}
	if !matched {
		return v, errors.New("Method or path is not a supported Apollo capability")
	}
	if args.ConsumerAppID != "" || args.Type != "" || args.Envs != "" || args.Namespace != nil {
		return v, errors.New("Consumer arguments require the dedicated consumer authorization tool")
	}
	for key, value := range v.Headers {
		switch strings.ToLower(key) {
		case "content-type", "accept", "if-match", "if-none-match", "x-requested-with":
		default:
			return v, errors.New("Request header is not permitted")
		}
		if strings.ContainsFunc(value, unicode.IsControl) || len(value) > 1024 {
			return v, errors.New("Invalid request header")
		}
	}
	if len(v.BodyBase64) > (maxBodyBytes+2)/3*4 {
		return v, errors.New("Request exceeds 4 MiB limit")
	}
	body, e := base64.StdEncoding.DecodeString(v.BodyBase64)
	if e != nil || len(body) > maxBodyBytes {
		return v, errors.New("Invalid or oversized request body")
	}
	if v.Method == "GET" && len(body) > 0 {
		return v, errors.New("Read GET requests cannot carry a body")
	}
	return v, nil
}

func (p *plugin) mcpConfirm(tool string, args mcpArguments, life lifecycleParams, rawLife json.RawMessage) (any, bool) {
	phase, token := args.Phase, args.ConfirmationToken
	args.Phase = ""
	args.ConfirmationToken = ""
	var completeLife any
	json.Unmarshal(rawLife, &completeLife)
	canonical, _ := json.Marshal([]any{tool, args, life, completeLife})
	digest := sha256.Sum256(canonical)
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.confirmations == nil {
		p.confirmations = map[string]mcpConfirmation{}
	}
	for id, c := range p.confirmations {
		if time.Now().After(c.expires) {
			delete(p.confirmations, id)
		}
	}
	if phase == "prepare" && token == "" {
		if len(p.confirmations) >= 128 {
			return mcpFailure("Too many pending confirmations; wait for expiry"), false
		}
		var random [24]byte
		if _, err := rand.Read(random[:]); err != nil {
			return mcpFailure("Could not allocate confirmation"), false
		}
		token = hex.EncodeToString(random[:])
		p.confirmations[token] = mcpConfirmation{digest: digest, expires: time.Now().Add(2 * time.Minute)}
		return mcpEnvelope(map[string]any{"confirmationToken": token, "expiresInSeconds": 120, "requiresExplicitApproval": true, "request": mcpConfirmationSummary(tool, args, life), "message": "No service request sent. Review and explicitly approve the exact original path and body before executing; contextual UI-only previews/rechecks are not replayed. Do not automatically confirm."}, false), false
	}
	if phase != "execute" || token == "" {
		return mcpFailure("Prepare and explicitly confirm this full-access operation first"), false
	}
	c, exists := p.confirmations[token]
	if !exists || c.digest != digest {
		return mcpFailure("Confirmation is missing, expired or does not match this lifecycle/request"), false
	}
	// Consume before authentication or HTTP dispatch: errors must never replay writes.
	delete(p.confirmations, token)
	return nil, true
}

func (p *plugin) mcpCall(raw json.RawMessage) any {
	var envelope struct {
		Tool      string          `json:"tool"`
		Arguments json.RawMessage `json:"arguments"`
		Lifecycle json.RawMessage `json:"lifecycle"`
	}
	if strictMCPJSON(raw, &envelope) != nil {
		return mcpFailure("Invalid MCP call envelope")
	}
	access := ""
	switch envelope.Tool {
	case "apollo_read", "apollo_session":
		access = "read"
	case "apollo_write":
		access = "write"
	case "apollo_admin", "apollo_authorize_consumer":
		access = "full"
	default:
		return mcpFailure("Unknown Apollo tool")
	}
	var args mcpArguments
	if strictMCPJSON(envelope.Arguments, &args) != nil {
		return mcpFailure("Invalid or unknown MCP arguments")
	}
	allowed := "connectionId,method,path,headers,bodyBase64"
	if envelope.Tool == "apollo_session" {
		allowed = "connectionId"
	}
	if envelope.Tool == "apollo_authorize_consumer" {
		allowed = "connectionId,consumerAppId,type,envs,namespace"
	}
	if access == "full" {
		allowed += ",phase,confirmationToken"
	}
	var fields map[string]json.RawMessage
	json.Unmarshal(envelope.Arguments, &fields)
	for key, value := range fields {
		if !strings.Contains(","+allowed+",", ","+key+",") || bytes.Equal(bytes.TrimSpace(value), []byte("null")) {
			return mcpFailure("Argument is not permitted by this tool's schema")
		}
	}
	var life lifecycleParams
	if json.Unmarshal(envelope.Lifecycle, &life) != nil || !safeMCPSegment(life.Connection.ID) {
		return mcpFailure("Host lifecycle.connection.id is required")
	}
	var routing struct {
		Connection struct {
			Layers []struct {
				Type    string `json:"type"`
				Enabled *bool  `json:"enabled"`
			} `json:"transport_layers"`
		} `json:"connection"`
	}
	if json.Unmarshal(envelope.Lifecycle, &routing) != nil {
		return mcpFailure("Invalid host lifecycle transport configuration")
	}
	for _, layer := range routing.Connection.Layers {
		if layer.Enabled != nil && !*layer.Enabled {
			continue
		}
		if (layer.Type != "ssh" && layer.Type != "proxy" && layer.Type != "http_tunnel") || life.Runtime == nil || strings.TrimSpace(life.Runtime.Host) == "" {
			return mcpFailure("Missing host transport endpoint; direct fallback is disabled")
		}
		if _, err := portNumber(life.Runtime.Port); err != nil {
			return mcpFailure("Invalid host transport endpoint")
		}
	}
	if args.ConnectionID != "" && args.ConnectionID != life.Connection.ID {
		return mcpFailure("Argument connectionId does not match host lifecycle identity")
	}
	args.ConnectionID = life.Connection.ID
	if access != "full" && (args.Phase != "" || args.ConfirmationToken != "") {
		return mcpFailure("This tool does not accept confirmation arguments")
	}
	if envelope.Tool == "apollo_session" {
		if args.Method != "" || args.Path != "" || len(args.Headers) > 0 || args.BodyBase64 != "" || args.ConsumerAppID != "" || args.Type != "" || args.Envs != "" || args.Namespace != nil {
			return mcpFailure("Session tool accepts only connectionId")
		}
		return mcpEnvelope(map[string]any{"connectionId": life.Connection.ID, "readOnly": life.Connection.ReadOnly}, false)
	}
	var request requestParams
	if envelope.Tool == "apollo_authorize_consumer" {
		if args.Method != "" || args.Path != "" || len(args.Headers) > 0 || args.BodyBase64 != "" || !safeMCPSegment(args.ConsumerAppID) || args.Namespace == nil || !safeMCPSegment(args.Namespace.AppID) || (args.Type != "AppRole" && args.Type != "NamespaceRole") || args.Type == "NamespaceRole" && !safeMCPSegment(args.Namespace.NamespaceName) || len(args.Envs) > 2048 || strings.ContainsFunc(args.Envs, unicode.IsControl) {
			return mcpFailure("Invalid consumer authorization parameters")
		}
	} else {
		var err error
		request, err = validateMCPRequest(args, access)
		if err != nil {
			return mcpFailure(err.Error())
		}
	}
	if life.Connection.ReadOnly && (access != "read" || request.Method != "GET") {
		return mcpFailure("This DBX connection is read-only")
	}
	if access == "full" {
		if result, execute := p.mcpConfirm(envelope.Tool, args, life, envelope.Lifecycle); !execute {
			return result
		}
	}
	// Each call owns its session. UI cookies, readonly state and transfer handles
	// remain untouched, even for the same saved connection identity.
	session, err := login(life)
	if err != nil {
		return mcpFailure("Apollo authentication failed; check the saved connection and runtime endpoint")
	}
	defer session.close()
	secrets := []string{life.Connection.Password}
	for _, secret := range life.Connection.Secrets {
		secrets = append(secrets, secret)
	}
	if envelope.Tool == "apollo_authorize_consumer" {
		lookup, e := session.request(requestParams{Method: "GET", Path: "/consumer-tokens/by-appId?appId=" + url.QueryEscape(args.ConsumerAppID)})
		if e != nil || lookup.Status < 200 || lookup.Status >= 300 {
			return mcpFailure("Could not resolve the existing consumer credential")
		}
		body, _ := base64.StdEncoding.DecodeString(lookup.BodyBase64)
		var credential struct {
			Token string `json:"token"`
		}
		if json.Unmarshal(body, &credential) != nil || !safeMCPSegment(credential.Token) || len(credential.Token) > 1024 {
			return mcpFailure("Existing consumer credential is unavailable")
		}
		secrets = append(secrets, credential.Token)
		query := url.Values{"type": {args.Type}}
		if args.Envs != "" {
			query.Set("envs", args.Envs)
		}
		body, _ = json.Marshal(args.Namespace)
		request = requestParams{Method: "POST", Path: "/consumers/" + url.PathEscape(credential.Token) + "/assign-role?" + query.Encode(), Headers: map[string]string{"Content-Type": "application/json"}, BodyBase64: base64.StdEncoding.EncodeToString(body)}
	}
	body, _ := base64.StdEncoding.DecodeString(request.BodyBase64)
	var input any
	if json.Unmarshal(body, &input) == nil {
		secrets = append(secrets, mcpSecretValues(input)...)
	}
	response, err := session.request(request)
	if err != nil {
		return mcpFailure("Apollo request failed; check the saved connection, permissions and 4 MiB limits")
	}
	if response.Status < 200 || response.Status >= 300 {
		return mcpEnvelope(map[string]any{"status": response.Status, "error": fmt.Sprintf("Apollo service returned HTTP %d", response.Status)}, true)
	}
	data, _ := base64.StdEncoding.DecodeString(response.BodyBase64)
	var result any
	if json.Unmarshal(data, &result) != nil {
		return mcpEnvelope(map[string]any{"status": response.Status, "binaryOmitted": true, "bytes": len(data), "untrusted": true, "message": "Raw binary/unstructured export omitted to avoid exposing embedded managed secrets; use the authorized UI for full-fidelity export"}, false)
	}
	failed := mcpServiceFailure(result)
	output := map[string]any{"status": response.Status, "data": mcpRedact(result, secrets, 0), "untrusted": true}
	if failed {
		output["error"] = "Apollo service reported an operation failure or partial environment failure"
	}
	return mcpEnvelope(output, failed)
}

func mcpServiceFailure(value any) bool {
	if object, ok := value.(map[string]any); ok {
		if code, ok := object["code"].(float64); ok && code != 0 && (code < 200 || code >= 300) {
			return true
		}
		if entities, ok := object["entities"].([]any); ok {
			for _, entity := range entities {
				if mcpServiceFailure(entity) {
					return true
				}
			}
		}
	}
	return false
}

func mcpSensitiveName(name string) bool {
	name = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			return unicode.ToLower(r)
		}
		return -1
	}, name)
	for _, part := range []string{"password", "passwd", "secret", "token", "credential", "authorization", "cookie", "privatekey", "accesskey", "apikey", "passphrase"} {
		if strings.Contains(name, part) {
			return true
		}
	}
	return false
}

func mcpSecretValues(value any) []string {
	values := []string{}
	switch v := value.(type) {
	case map[string]any:
		secretEntry := false
		for _, key := range []string{"key", "name", "configKey"} {
			if s, ok := v[key].(string); ok && mcpSensitiveName(s) {
				secretEntry = true
			}
		}
		for key, item := range v {
			if mcpSensitiveName(key) || strings.EqualFold(key, "configText") || secretEntry && (key == "value" || key == "configValue") {
				if s, ok := item.(string); ok {
					values = append(values, s)
				}
			}
			values = append(values, mcpSecretValues(item)...)
		}
	case []any:
		for _, item := range v {
			values = append(values, mcpSecretValues(item)...)
		}
	}
	return values
}

func mcpRedact(value any, secrets []string, depth int) any {
	if depth > 32 {
		return "[REDACTED: nesting limit]"
	}
	switch v := value.(type) {
	case map[string]any:
		secrets = append(secrets, mcpSecretValues(v)...)
		secretEntry := false
		for _, key := range []string{"key", "name", "configKey"} {
			if name, ok := v[key].(string); ok && mcpSensitiveName(name) {
				secretEntry = true
			}
		}
		out := map[string]any{}
		for key, item := range v {
			outputKey := key
			for _, secret := range secrets {
				if secret != "" {
					outputKey = strings.ReplaceAll(outputKey, secret, "[REDACTED]")
				}
			}
			if mcpSensitiveName(key) || secretEntry && (key == "value" || key == "configValue") {
				out[outputKey] = "[REDACTED]"
			} else {
				out[outputKey] = mcpRedact(item, secrets, depth+1)
			}
		}
		return out
	case []any:
		out := make([]any, len(v))
		for i, item := range v {
			out[i] = mcpRedact(item, secrets, depth+1)
		}
		return out
	case string:
		var embedded any
		if len(v) > 0 && (v[0] == '{' || v[0] == '[') && json.Unmarshal([]byte(v), &embedded) == nil {
			encoded, _ := json.Marshal(mcpRedact(embedded, secrets, depth+1))
			return string(encoded)
		}
		for _, secret := range secrets {
			if secret != "" {
				v = strings.ReplaceAll(v, secret, "[REDACTED]")
			}
		}
		return v
	default:
		return value
	}
}
