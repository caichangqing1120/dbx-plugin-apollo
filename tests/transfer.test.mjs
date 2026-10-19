import { test } from "node:test";
import assert from "node:assert/strict";
import { multipartFile, downloadName } from "../src/transfer.js";
test("multipart serialization preserves binary bytes, UTF8 content and safe filename", () => {
  const file = new Uint8Array([0, 255, 13, 10, 65]);
  const result = multipartFile(
    file,
    'a"\r\n.zip',
    "application/zip",
    "test-boundary",
  );
  const bytes = Buffer.from(result.bytes);
  assert.ok(bytes.includes(Buffer.from(file)));
  assert.match(bytes.toString(), /name="file"; filename="a___.zip"/);
  assert.ok(bytes.toString().endsWith("\r\n--test-boundary--\r\n"));
  assert.equal(
    result.contentType,
    "multipart/form-data; boundary=test-boundary",
  );
});
test("download filenames support RFC5987 and never produce local path components", () => {
  assert.equal(
    downloadName(
      "attachment; filename*=UTF-8''%E9%85%8D%E7%BD%AE.zip",
      "export.zip",
    ),
    "配置.zip",
  );
  assert.equal(
    downloadName('attachment; filename="../../secret.zip"', "export.zip"),
    "secret.zip",
  );
  assert.equal(
    downloadName('attachment; filename=""', "export.zip"),
    "export.zip",
  );
});
