package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"

	sdk "github.com/t8y2/dbx/plugins/sdk/go/dbx-plugin-sdk"
)

const inlineBodyBytes = 512 * 1024
const transferChunkBytes = 128 * 1024
const transferSlots = 8

type transferRecord struct {
	connectionID string
	session      *portalSession
	kind         string
	request      requestParams
	bytes        []byte
	expected     int
	updated      time.Time
}
type transferParams struct {
	ConnectionID string            `json:"connectionId"`
	UploadID     string            `json:"uploadId"`
	DownloadID   string            `json:"downloadId"`
	Method       string            `json:"method"`
	Path         string            `json:"path"`
	Headers      map[string]string `json:"headers"`
	Size         int               `json:"size"`
	Offset       int               `json:"offset"`
	Limit        int               `json:"limit"`
	DataBase64   string            `json:"dataBase64"`
}

func (p *plugin) clearTransfersLocked(connectionID string) {
	for id, record := range p.transfers {
		if record.connectionID == connectionID {
			delete(p.transfers, id)
		}
	}
}
func (p *plugin) expireTransfersLocked() {
	for id, record := range p.transfers {
		if time.Since(record.updated) > 5*time.Minute {
			delete(p.transfers, id)
		}
	}
}
func (p *plugin) storeTransferLocked(record *transferRecord) (string, error) {
	p.expireTransfersLocked()
	if len(p.transfers) >= transferSlots {
		return "", errors.New("Too many active transfers; close or cancel a previous transfer")
	}
	var random [16]byte
	if _, err := rand.Read(random[:]); err != nil {
		return "", errors.New("Could not allocate transfer handle")
	}
	id := hex.EncodeToString(random[:])
	record.updated = time.Now()
	p.transfers[id] = record
	return id, nil
}
func (p *plugin) deferResponse(connectionID string, session *portalSession, response portalResponse) (any, *sdk.PluginError) {
	bytes, err := base64.StdEncoding.DecodeString(response.BodyBase64)
	if err != nil {
		return nil, sdk.NewError(-32000, "Invalid response bytes")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.sessions[connectionID] != session {
		return nil, sdk.NewError(-32001, "Apollo connection changed during transfer")
	}
	id, err := p.storeTransferLocked(&transferRecord{connectionID: connectionID, session: session, kind: "download", bytes: bytes, expected: len(bytes)})
	if err != nil {
		return nil, sdk.NewError(-32000, err.Error())
	}
	response.BodyBase64 = ""
	response.DownloadID = id
	response.Size = len(bytes)
	return response, nil
}

func (p *plugin) transferRequest(method string, raw json.RawMessage) (any, *sdk.PluginError) {
	var v transferParams
	if json.Unmarshal(raw, &v) != nil || v.ConnectionID == "" {
		return nil, sdk.NewError(-32602, "Invalid transfer parameters")
	}
	p.mu.Lock()
	p.expireTransfersLocked()
	session := p.sessions[v.ConnectionID]
	if session == nil {
		p.mu.Unlock()
		return nil, sdk.NewError(-32001, "Apollo connection is not active; reconnect in DBX")
	}
	if method == "apollo/upload-start" {
		if v.Size <= 0 || v.Size > maxBodyBytes {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, "Transfer exceeds 4 MiB limit")
		}
		if session.readOnly {
			p.mu.Unlock()
			return nil, sdk.NewError(-32000, "This DBX connection is read-only")
		}
		if v.Method != "POST" && v.Method != "PUT" && v.Method != "PATCH" && v.Method != "DELETE" {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, "Invalid upload method")
		}
		if _, err := relativePath(v.Path); err != nil {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, err.Error())
		}
		if len(p.transfers) >= transferSlots {
			p.mu.Unlock()
			return nil, sdk.NewError(-32000, "Too many active transfers")
		}
		record := &transferRecord{connectionID: v.ConnectionID, session: session, kind: "upload", bytes: make([]byte, 0, v.Size), expected: v.Size, request: requestParams{ConnectionID: v.ConnectionID, Method: v.Method, Path: v.Path, Headers: v.Headers}}
		id, err := p.storeTransferLocked(record)
		p.mu.Unlock()
		if err != nil {
			return nil, sdk.NewError(-32000, err.Error())
		}
		return map[string]any{"uploadId": id, "chunkBytes": transferChunkBytes}, nil
	}
	id := v.UploadID
	if method == "apollo/download-chunk" || method == "apollo/download-close" {
		id = v.DownloadID
	}
	record := p.transfers[id]
	if record == nil || record.connectionID != v.ConnectionID || record.session != session {
		p.mu.Unlock()
		return nil, sdk.NewError(-32602, "Transfer expired or is not active")
	}
	record.updated = time.Now()
	if method == "apollo/upload-abort" || method == "apollo/download-close" {
		delete(p.transfers, id)
		p.mu.Unlock()
		return map[string]any{"success": true}, nil
	}
	if method == "apollo/download-chunk" {
		if record.kind != "download" || v.Offset < 0 || v.Offset > len(record.bytes) || v.Limit <= 0 || v.Limit > transferChunkBytes {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, "Invalid download chunk")
		}
		end := v.Offset + v.Limit
		if end > len(record.bytes) {
			end = len(record.bytes)
		}
		data := base64.StdEncoding.EncodeToString(record.bytes[v.Offset:end])
		p.mu.Unlock()
		return map[string]any{"offset": v.Offset, "length": end - v.Offset, "dataBase64": data, "eof": end == record.expected}, nil
	}
	if record.kind != "upload" {
		p.mu.Unlock()
		return nil, sdk.NewError(-32602, "Transfer kind mismatch")
	}
	if method == "apollo/upload-chunk" {
		if v.Offset != len(record.bytes) || len(v.DataBase64) > (transferChunkBytes+2)/3*4 {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, "Invalid upload offset or chunk size")
		}
		data, err := base64.StdEncoding.DecodeString(v.DataBase64)
		if err != nil || len(data) == 0 || len(data) > transferChunkBytes || len(record.bytes)+len(data) > record.expected {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, "Invalid upload chunk")
		}
		record.bytes = append(record.bytes, data...)
		received := len(record.bytes)
		p.mu.Unlock()
		return map[string]any{"received": received}, nil
	}
	if method == "apollo/upload-finish" {
		if len(record.bytes) != record.expected {
			p.mu.Unlock()
			return nil, sdk.NewError(-32602, "Upload is incomplete")
		}
		// Consume before HTTP dispatch: a repeated commit must never replay a write.
		delete(p.transfers, id)
		p.mu.Unlock()
		record.request.BodyBase64 = base64.StdEncoding.EncodeToString(record.bytes)
		response, err := record.session.request(record.request)
		if err != nil {
			return nil, sdk.NewError(-32000, err.Error())
		}
		if len(response.BodyBase64) > inlineBodyBytes*4/3 {
			return p.deferResponse(v.ConnectionID, record.session, response)
		}
		return response, nil
	}
	p.mu.Unlock()
	return nil, sdk.MethodNotFound(method)
}
