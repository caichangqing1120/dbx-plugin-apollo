import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
test("standalone build embeds every asset and never includes original Portal runtime", async () => {
  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: new URL("..", import.meta.url),
    stdio: "pipe",
  });
  const html = await readFile(
    new URL("../ui/index.html", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(html, /__APOLLO_[A-Z_]+__/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)=/);
  assert.doesNotMatch(html, /angular\.module\(|ng-app=|bootstrap\.min/);
  assert.match(html, /data:image\/svg\+xml;base64,/);
  assert.match(html, /<title>Apollo Portal Console<\/title>/);
});
