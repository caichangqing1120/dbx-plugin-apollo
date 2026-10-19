import { test } from "node:test";
import assert from "node:assert/strict";
import { ApolloClient } from "../src/client.js";
import { saveHostFile } from "../src/transfer.js";

test("large requests respect the actual 2 MiB Host JSON limit through bounded chunks", async () => {
  const payload = new Uint8Array(2 * 1024 * 1024).fill(255),
    chunks = [],
    methods = [];
  const host = {
    invoke: async (method, params) => {
      assert.ok(
        Buffer.byteLength(JSON.stringify({ method, params })) < 2 * 1024 * 1024,
        "Host payload cap exceeded",
      );
      methods.push(method);
      if (method === "apollo/upload-start") return { uploadId: "u" };
      if (method === "apollo/upload-chunk") {
        assert.equal(
          params.offset,
          chunks.reduce((n, b) => n + b.length, 0),
        );
        chunks.push(Buffer.from(params.dataBase64, "base64"));
        return { received: params.offset + chunks.at(-1).length };
      }
      if (method === "apollo/upload-finish")
        return { status: 200, headers: {}, bodyBase64: "e30=" };
      if (method === "apollo/upload-abort") return {};
      throw Error("Unexpected method: " + method);
    },
  };
  const reply = await new ApolloClient(host, "a").requestRaw(
    "PUT",
    "/configs",
    payload,
    { "Content-Type": "application/octet-stream" },
  );
  assert.equal(reply.status, 200);
  assert.deepEqual(Buffer.concat(chunks), Buffer.from(payload));
  assert.equal(methods.filter((m) => m === "apollo/upload-finish").length, 1);
  assert.ok(chunks.every((c) => c.length <= 128 * 1024));
});
test("large responses are reassembled from byte chunks and their remote handle is closed", async () => {
  const payload = Buffer.alloc(2 * 1024 * 1024, 0xff);
  let closed = false;
  const host = {
    invoke: async (method, params) => {
      if (method === "apollo/request")
        return {
          status: 200,
          headers: { "content-type": "application/zip" },
          bodyBase64: "",
          downloadId: "d",
          size: payload.length,
        };
      if (method === "apollo/download-chunk") {
        const part = payload.subarray(
          params.offset,
          Math.min(payload.length, params.offset + params.limit),
        );
        return {
          offset: params.offset,
          length: part.length,
          eof: params.offset + part.length === payload.length,
          dataBase64: part.toString("base64"),
        };
      }
      if (method === "apollo/download-close") {
        closed = true;
        return {};
      }
      throw Error(method);
    },
  };
  const reply = await new ApolloClient(host, "a").requestRaw(
    "GET",
    "/configs/export?envs=DEV",
  );
  assert.deepEqual(Buffer.from(reply.bodyBase64, "base64"), payload);
  assert.equal(closed, true);
});
test("native Host downloads use the transferred chunk API instead of oversized base64 requests", async () => {
  const bytes = Buffer.alloc(2 * 1024 * 1024, 0x41),
    writes = [];
  let finished = false;
  const host = {
    request: () => {
      throw Error("Unsafe oversized JSON fallback");
    },
    fileTransfer: {
      beginSave: async () => ({ handleId: "file", chunkBytes: 65536 }),
      write: async (id, offset, data) => {
        assert.equal(id, "file");
        writes.push({ offset, bytes: Buffer.from(data) });
        return { written: data.length, nextOffset: offset + data.length };
      },
      finish: async () => {
        finished = true;
      },
      cancel: async () => {
        throw Error("Unexpected cancel");
      },
    },
  };
  await saveHostFile(host, "configs.zip", {
    headers: { "content-type": "application/zip" },
    bodyBase64: bytes.toString("base64"),
  });
  assert.equal(finished, true);
  assert.deepEqual(Buffer.concat(writes.map((w) => w.bytes)), bytes);
  assert.ok(
    writes.every(
      (w, index) => w.offset === index * 65536 && w.bytes.length <= 65536,
    ),
  );
});
test("cancelled native save is not reported as success and failed writes close their handle", async () => {
  const response = { headers: {}, bodyBase64: "YQ==" };
  const canceled = await saveHostFile(
    { fileTransfer: { beginSave: async () => null } },
    "a.txt",
    response,
  );
  assert.equal(canceled.canceled, true);
  let closed = false;
  await assert.rejects(
    () =>
      saveHostFile(
        {
          fileTransfer: {
            beginSave: async () => ({ handleId: "f" }),
            write: async () => {
              throw Error("Disk full");
            },
            finish: async () => {},
            cancel: async () => (closed = true),
          },
        },
        "a.txt",
        response,
      ),
    /Disk full/,
  );
  assert.equal(closed, true);
});
