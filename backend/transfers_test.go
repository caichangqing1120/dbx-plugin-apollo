package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"testing"
	"time"
)

func rpcMap(t *testing.T, p *plugin, method string, params any) map[string]any {
	t.Helper()
	v, e := call(t, p, method, params)
	if e != nil {
		t.Fatal(e)
	}
	encoded, _ := json.Marshal(v)
	var result map[string]any
	if json.Unmarshal(encoded, &result) != nil {
		t.Fatal("Invalid RPC response")
	}
	return result
}

func TestTransferSlotsExpireAndCanBeReleased(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	params := map[string]any{"connectionId": "a", "method": "POST", "path": "/transfer-upload", "size": 1}
	var first string
	for i := 0; i < 8; i++ {
		id := rpcMap(t, p, "apollo/upload-start", params)["uploadId"].(string)
		if first == "" {
			first = id
		}
	}
	if _, e := call(t, p, "apollo/upload-start", params); e == nil {
		t.Fatal("Transfer slot limit was bypassed")
	}
	rpcMap(t, p, "apollo/upload-abort", map[string]string{"connectionId": "a", "uploadId": first})
	rpcMap(t, p, "apollo/upload-start", params)
	p.mu.Lock()
	for _, record := range p.transfers {
		record.updated = time.Now().Add(-6 * time.Minute)
	}
	p.mu.Unlock()
	rpcMap(t, p, "apollo/upload-start", params)
	p.mu.Lock()
	count := len(p.transfers)
	p.mu.Unlock()
	if count != 1 {
		t.Fatalf("Expired transfer count: %d", count)
	}
}
func TestChunkedUploadPreservesBytesAndCommitCannotReplay(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	payload := bytes.Repeat([]byte{0, 255, 65}, 700000)
	start := rpcMap(t, p, "apollo/upload-start", map[string]any{"connectionId": "a", "method": "POST", "path": "/transfer-upload", "headers": map[string]string{"Content-Type": "application/octet-stream"}, "size": len(payload)})
	id, _ := start["uploadId"].(string)
	if id == "" {
		t.Fatal("Missing upload id")
	}
	for offset := 0; offset < len(payload); offset += 128 * 1024 {
		end := offset + 128*1024
		if end > len(payload) {
			end = len(payload)
		}
		rpcMap(t, p, "apollo/upload-chunk", map[string]any{"connectionId": "a", "uploadId": id, "offset": offset, "dataBase64": base64.StdEncoding.EncodeToString(payload[offset:end])})
	}
	reply := rpcMap(t, p, "apollo/upload-finish", map[string]string{"connectionId": "a", "uploadId": id})
	body, _ := base64.StdEncoding.DecodeString(reply["bodyBase64"].(string))
	var result struct {
		Size  int    `json:"size"`
		SHA   string `json:"sha256"`
		Count int    `json:"count"`
	}
	json.Unmarshal(body, &result)
	if result.Size != 2100000 || result.SHA != fmt.Sprintf("%x", sha256.Sum256(payload)) || result.Count != 1 {
		t.Fatal(string(body))
	}
	if _, e := call(t, p, "apollo/upload-finish", map[string]string{"connectionId": "a", "uploadId": id}); e == nil {
		t.Fatal("Upload commit replayed")
	}
}
func TestLargeResponseUsesConnectionScopedDownloadChunks(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	connect(t, p, s.URL, "b", "bob")
	start := rpcMap(t, p, "apollo/request", requestParams{ConnectionID: "a", Method: "GET", Path: "/transfer-download"})
	id, _ := start["downloadId"].(string)
	if id == "" || start["bodyBase64"] != "" {
		t.Fatal("Large body crossed Host JSON boundary")
	}
	if _, e := call(t, p, "apollo/download-chunk", map[string]any{"connectionId": "b", "downloadId": id, "offset": 0, "limit": 128 * 1024}); e == nil {
		t.Fatal("Download crossed connection identity")
	}
	var body []byte
	for offset := 0; offset < 2*1024*1024; offset += 128 * 1024 {
		chunk := rpcMap(t, p, "apollo/download-chunk", map[string]any{"connectionId": "a", "downloadId": id, "offset": offset, "limit": 128 * 1024})
		data, _ := base64.StdEncoding.DecodeString(chunk["dataBase64"].(string))
		body = append(body, data...)
	}
	if !bytes.Equal(body, bytes.Repeat([]byte("B"), 2*1024*1024)) {
		t.Fatal("Download corrupted")
	}
	rpcMap(t, p, "apollo/download-close", map[string]string{"connectionId": "a", "downloadId": id})
	if _, e := call(t, p, "apollo/download-chunk", map[string]any{"connectionId": "a", "downloadId": id, "offset": 0, "limit": 128 * 1024}); e == nil {
		t.Fatal("Closed download remained readable")
	}
}
func TestTransferLimitsOffsetsAndDisconnectInvalidation(t *testing.T) {
	s := portalFixture(t)
	p := newPlugin()
	connect(t, p, s.URL, "a", "alice")
	for _, path := range []string{"http://evil.test/", "/../escape"} {
		if _, e := call(t, p, "apollo/upload-start", map[string]any{"connectionId": "a", "method": "POST", "path": path, "size": 1}); e == nil {
			t.Fatal("Unsafe transfer path accepted")
		}
	}
	if _, e := call(t, p, "apollo/upload-start", map[string]any{"connectionId": "a", "method": "POST", "path": "/transfer-upload", "size": maxBodyBytes + 1}); e == nil {
		t.Fatal("Oversize upload accepted")
	}
	start := rpcMap(t, p, "apollo/upload-start", map[string]any{"connectionId": "a", "method": "POST", "path": "/transfer-upload", "size": 2})
	id := start["uploadId"].(string)
	if _, e := call(t, p, "apollo/upload-chunk", map[string]any{"connectionId": "a", "uploadId": id, "offset": 1, "dataBase64": "YQ=="}); e == nil {
		t.Fatal("Out of order chunk accepted")
	}
	if _, e := call(t, p, "apollo/upload-finish", map[string]string{"connectionId": "a", "uploadId": id}); e == nil {
		t.Fatal("Incomplete upload committed")
	}
	rpcMap(t, p, "connection/disconnect", map[string]any{"connection": map[string]string{"id": "a"}})
	if _, e := call(t, p, "apollo/upload-chunk", map[string]any{"connectionId": "a", "uploadId": id, "offset": 0, "dataBase64": "YQ=="}); e == nil {
		t.Fatal("Disconnected upload retained")
	}
}
