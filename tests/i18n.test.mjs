import { test } from "node:test";
import assert from "node:assert/strict";
import { observeHostLocale, translator } from "../src/i18n.js";
import { referenceCopy } from '../src/reference-copy.js';

test("host theme-only notifications preserve an independently chosen UI language", () => {
  const changed = [];
  const update = observeHostLocale("zh-CN", (value) => changed.push(value));
  update("zh-CN");
  assert.deepEqual(changed, []);
  update("en");
  assert.deepEqual(changed, ["en"]);
  update("en");
  assert.deepEqual(changed, ["en"]);
});

test("every selected source label has Chinese and English text, including the original confirm caption", () => {
  for (const [key, labels] of Object.entries(referenceCopy)) {
    assert.equal(typeof labels[0], 'string', key + ' Chinese');
    assert.equal(typeof labels[1], 'string', key + ' English');
  }
  assert.equal(translator('zh-CN')('sourceConfirm'),'确认');
  assert.equal(translator('en')('sourceConfirm'),'OK');
});
