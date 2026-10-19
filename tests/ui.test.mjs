import { test } from "node:test";
import assert from "node:assert/strict";
import { localTimestamp } from "../src/ui.js";
test("Portal timestamps use browser local time and preserve invalid or empty values safely", () => {
  const date = new Date("2026-10-19T00:00:00Z"),
    pad = (n) => String(n).padStart(2, "0");
  assert.equal(
    localTimestamp(date.toISOString()),
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:00:00`,
  );
  assert.equal(localTimestamp("not a date"), "not a date");
  assert.equal(localTimestamp(null), "");
});
