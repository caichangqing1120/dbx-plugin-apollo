import { test } from "node:test";
import assert from "node:assert/strict";
import * as editor from "../src/editor.js";
test("JSON formatting preserves data and refuses duplicate keys instead of silently erasing values", () => {
  assert.equal(typeof editor.formatJSONUniqueKeys, "function");
  assert.equal(
    editor.formatJSONUniqueKeys('{"a":1,"b":{"a":2}}'),
    JSON.stringify({ a: 1, b: { a: 2 } }, null, 4),
  );
  assert.throws(
    () => editor.formatJSONUniqueKeys('{"a":1,"\\u0061":2}'),
    /Duplicate/,
  );
  assert.throws(() => editor.formatJSONUniqueKeys("{bad json}"));
});

test("JSON formatting never rounds large IDs or rewrites numeric literals in configuration", () => {
  const result=editor.formatJSONUniqueKeys('{"id":9223372036854775807,"tiny":1.2300e-1000,"negativeZero":-0}');
  assert.match(result,/9223372036854775807/);
  assert.match(result,/1\.2300e-1000/);
  assert.match(result,/"negativeZero": -0/);
});
