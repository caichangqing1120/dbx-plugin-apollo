package main

import (
	"encoding/base64"
	"encoding/json"
	sdk "github.com/t8y2/dbx/plugins/sdk/go/dbx-plugin-sdk"
	"log"
	"net/url"
	"strings"
	"sync"
)

const pluginID = "io.github.caichangqing1120.apollo"

type plugin struct {
	mu        sync.Mutex
	sessions  map[string]*portalSession
	epochs    map[string]uint64
	transfers map[string]*transferRecord
}

func newPlugin() *plugin {
	return &plugin{sessions: map[string]*portalSession{}, epochs: map[string]uint64{}, transfers: map[string]*transferRecord{}}
}

func (p *plugin) Handle(_ sdk.RequestContext, method string, raw json.RawMessage, _ *sdk.Emitter) (any, *sdk.PluginError) {
	switch method {
	case "apollo/upload-start", "apollo/upload-chunk", "apollo/upload-finish", "apollo/upload-abort", "apollo/download-chunk", "apollo/download-close":
		return p.transferRequest(method, raw)
	case "apollo/consumer-authorize":
		var v struct {
			ConnectionID string          `json:"connectionId"`
			Token        string          `json:"token"`
			Type         string          `json:"type"`
			Envs         string          `json:"envs"`
			Namespace    json.RawMessage `json:"namespace"`
		}
		if json.Unmarshal(raw, &v) != nil || v.Token == "" || len(v.Token) > 1024 || strings.ContainsAny(v.Token, "/\\?#%\r\n") || (v.Type != "AppRole" && v.Type != "NamespaceRole") || len(v.Namespace) == 0 || v.Namespace[0] != '{' {
			return nil, sdk.NewError(-32602, "Invalid consumer authorization parameters")
		}
		query := url.Values{"type": {v.Type}}
		if v.Envs != "" {
			query.Set("envs", v.Envs)
		}
		// Keep the generated token in a redacted RPC field, not in logged UI request paths.
		params := requestParams{ConnectionID: v.ConnectionID, Method: "POST", Path: "/consumers/" + url.PathEscape(v.Token) + "/assign-role?" + query.Encode(), Headers: map[string]string{"Content-Type": "application/json"}, BodyBase64: base64.StdEncoding.EncodeToString(v.Namespace)}
		encoded, _ := json.Marshal(params)
		return p.Handle(sdk.RequestContext{}, "apollo/request", encoded, nil)
	case "connection/test", "connection/connect", "connection/disconnect":
		var v lifecycleParams
		if json.Unmarshal(raw, &v) != nil || v.Connection.ID == "" {
			return nil, sdk.NewError(-32602, "Invalid connection parameters")
		}
		id := v.Connection.ID
		var epoch uint64
		if method != "connection/test" {
			p.mu.Lock()
			p.epochs[id]++
			p.clearTransfersLocked(id)
			epoch = p.epochs[id]
			if old := p.sessions[id]; old != nil {
				old.close()
			}
			delete(p.sessions, id)
			p.mu.Unlock()
		}
		if method == "connection/disconnect" {
			return map[string]any{"success": true}, nil
		}
		session, err := login(v)
		if err != nil {
			return nil, sdk.NewError(-32000, err.Error())
		}
		if method == "connection/test" {
			session.close()
		} else {
			p.mu.Lock()
			if p.epochs[id] != epoch {
				p.mu.Unlock()
				session.close()
				return nil, sdk.NewError(-32000, "Connection changed while authenticating; reconnect")
			}
			p.sessions[id] = session
			p.mu.Unlock()
		}
		return map[string]any{"success": true, "message": "Apollo Portal authentication succeeded"}, nil
	case "apollo/request", "apollo/session":
		var v requestParams
		if json.Unmarshal(raw, &v) != nil {
			return nil, sdk.NewError(-32602, "Invalid request parameters")
		}
		p.mu.Lock()
		session := p.sessions[v.ConnectionID]
		p.mu.Unlock()
		if session == nil {
			return nil, sdk.NewError(-32001, "Apollo connection is not active; reconnect in DBX")
		}
		if method == "apollo/session" {
			return map[string]any{"readOnly": session.readOnly}, nil
		}
		response, err := session.request(v)
		if err != nil {
			return nil, sdk.NewError(-32000, err.Error())
		}
		if len(response.BodyBase64) > inlineBodyBytes*4/3 {
			return p.deferResponse(v.ConnectionID, session, response)
		}
		return response, nil
	default:
		return nil, sdk.MethodNotFound(method)
	}
}

func main() {
	server := sdk.NewServer(sdk.Metadata{ID: pluginID, Version: "0.1.3", Capabilities: []string{"connections"}}, newPlugin())
	if err := server.Serve(); err != nil {
		log.Fatal(err)
	}
}
