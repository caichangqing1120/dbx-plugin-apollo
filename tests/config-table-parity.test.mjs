import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { renderPortal } from '../src/views.js';
import { translator } from '../src/i18n.js';

function table(items) {
  const win = new Window();
  const state = { route: { view: 'config', appId: 'Example', env: 'DEV', cluster: 'default' },
    envTree: [{ env: 'DEV', clusters: [{ name: 'default' }] }], app: { appId: 'Example' },
    user: { userId: 'apollo' }, isRoot: true, canManage: true, drafts: {}, filters: {},
    modes: {}, filterOpen: {}, permissions: { application: { modify: true, release: true } },
    namespaces: [{ baseInfo: { namespaceName: 'application' }, format: 'properties', items }],
  };
  win.document.body.innerHTML = renderPortal(state, translator('zh-CN'));
  return win.document.querySelector('.config-table');
}

test('deleted configuration rows show status but never offer edit or delete writes', () => {
  const root = table([{ isModified: true, isDeleted: true, item: {
    id: 42, key: 'removed', value: 'old', type: 0,
  } }]);
  assert.equal(root.querySelectorAll('[data-action="edit-item"],[data-action="delete-item"]').length, 0);
  assert.match(root.querySelector('.key-cell').textContent, /删/);
});

test('long key value and comment previews are bounded without changing inspection identity', () => {
  const root = table([{ item: { id: 7, key: 'K'.repeat(260), value: 'V'.repeat(300),
    comment: 'C'.repeat(280), type: 0, dataChangeLastModifiedBy: 'apollo' } }]);
  const key = root.querySelector('[data-field="key"]'), value = root.querySelector('[data-field="value"]');
  assert.equal(key.textContent, 'K'.repeat(250) + '...');
  assert.equal(value.textContent, 'V'.repeat(250) + '...');
  assert.equal(key.dataset.item, '7'); assert.equal(value.dataset.item, '7');
  assert.equal(root.querySelector('tbody td:nth-child(5)').textContent, 'C'.repeat(250) + '...');
});

test('new and modified rows carry distinct original-style change badges', () => {
  const root = table([
    { isNewlyAdded: true, isModified: true, item: { id: 1, key: 'new', value: 'a' } },
    { isModified: true, item: { id: 2, key: 'changed', value: 'b' } },
  ]);
  const keys = root.querySelectorAll('.key-cell');
  assert.match(keys[0].textContent, /新/);
  assert.match(keys[1].textContent, /改/);
});

test('an empty configuration table retains its headers without an invented data row', () => {
  const root = table([]);
  assert.equal(root.querySelectorAll('thead th').length, 8);
  assert.equal(root.querySelectorAll('tbody tr').length, 0);
});
