import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createPortalApp } from '../src/app.js';

function noticeClock(win) {
  let now = 0, nextId = 0;
  const tasks = new Map(), set = win.setTimeout, clear = win.clearTimeout;
  win.setTimeout = (callback, delay = 0, ...args) => {
    const id = ++nextId;
    tasks.set(id, { at: now + Number(delay), callback, args });
    return id;
  };
  win.clearTimeout = (id) => tasks.delete(id);
  return {
    tick(milliseconds) {
      const end = now + milliseconds;
      for (;;) {
        const next = [...tasks].filter(([, task]) => task.at <= end)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        const [id, task] = next;
        tasks.delete(id); now = task.at; task.callback(...task.args);
      }
      now = end;
    },
    restore() { win.setTimeout = set; win.clearTimeout = clear; tasks.clear(); },
  };
}

async function setup(t, format = 'yaml') {
  const win = new Window({ url: 'http://localhost' });
  const root = win.document.createElement('div');
  win.document.body.append(root);
  const appData = { appId: 'SampleApp', name: 'Sample', orgId: 'TEST2',
    orgName: 'Department', ownerName: 'apollo', ownerEmail: 'apollo@example.test' };
  const client = {
    user: async () => ({ userId: 'apollo', name: 'Apollo', email: 'apollo@example.test' }),
    rootPermission: async () => ({ hasPermission: true }),
    creationPermission: async () => ({ hasCreateApplicationPermission: true }),
    apps: async () => [appData], app: async () => appData,
    favorites: async () => [], publicNamespaces: async () => [],
    tree: async () => ({ entities: [{ code: 200, body: {
      env: 'DEV', clusters: [{ name: 'default' }],
    } }] }),
    namespaces: async () => [{ baseInfo: { id: 1, appId: 'SampleApp',
      namespaceName: 'application', clusterName: 'default' }, format,
      isPublic: false, itemModifiedCnt: 1, items: [{ item: {
        id: 1, key: format === 'properties' ? 'sample.key' : 'content',
        value: 'key: value', comment: '', dataChangeLastModifiedBy: 'apollo',
      }, isModified: true }] }],
    namespace: async () => ({ format, isConfigHidden: false }),
    permission: async () => ({ hasPermission: true }),
    checkSyntax: async () => null, saveItem: async () => null,
    favorite: async () => ({ id: 7 }),
  };
  const options = { client, locale: 'zh-CN', connectionId: 'notice-test',
    storage: { get: async () => null, set: async () => {} } };
  const app = createPortalApp(root, options);
  await app.start();
  await app.navigate({ view: 'config', appId: 'SampleApp' });
  const clock = noticeClock(win);
  t.after(async () => { app.destroy(); clock.restore(); await win.happyDOM.close(); });
  return { win, root, client, app, options, clock };
}

async function syntaxSuccess(env) {
  if (!env.app.state.textEditing?.application) {
    env.root.querySelector('[data-action="edit-text"]').click();
    await env.app.idle();
  }
  const input = env.root.querySelector('[data-text]');
  input.value = 'key: valid';
  input.dispatchEvent(new env.win.Event('input', { bubbles: true }));
  env.root.querySelector('[data-action="syntax-text"]').click();
  await env.app.idle();
  assert.ok(env.root.querySelector('.notice.success'));
}

async function saveSuccess(env) {
  env.root.querySelector('[data-action="edit-item"]').click();
  await env.app.idle();
  const form = env.root.querySelector('[role="dialog"] form');
  form.querySelector('[name="value"]').value = 'saved value';
  form.dispatchEvent(new env.win.Event('submit', { bubbles: true, cancelable: true }));
  await env.app.idle();
  assert.ok(env.root.querySelector('.notice.success'));
  assert.equal(env.root.querySelector('[role="dialog"]'), null, 'successful item save closes its editor');
}

test('success feedback closes after five seconds without a manual dismiss', async (t) => {
  const env = await setup(t);
  await syntaxSuccess(env);
  env.clock.tick(4999);
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(1);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
  assert.equal(env.app.state.success, false);
});

test('saved-item success also expires through the shared notification lifecycle', async (t) => {
  const env = await setup(t, 'properties');
  await saveSuccess(env);
  env.clock.tick(5000);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});

test('successful two-stage rollback closes the confirmation and then expires its feedback', async t => {
  const env = await setup(t, 'properties'), writes = [];
  env.client.releases = async () => [
    { baseInfo: { id: 8, name: 'Native v2', isAbandoned: false } },
    { baseInfo: { id: 7, name: 'Native v1', isAbandoned: false } },
  ];
  env.client.compareReleases = async () => ({ changes: [] });
  env.client.rollback = async (...args) => { writes.push(args); };
  env.root.querySelector('[data-action="rollback-latest"]').click(); await env.app.idle();
  const submit = () => env.root.querySelector('[role="dialog"] form')
    .dispatchEvent(new env.win.Event('submit', { bubbles: true, cancelable: true }));
  submit(); await env.app.idle();
  assert.equal(env.root.querySelector('[role="dialog"]')?.dataset.dialogSource, 'rollbackAlertDialog');
  assert.deepEqual(writes, [], 'the preview is not an executed rollback');
  submit(); await env.app.idle();
  assert.deepEqual(writes, [['DEV', 8]]);
  assert.equal(env.root.querySelector('[role="dialog"]'), null, 'successful rollback closes its confirmation');
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(5000);
  assert.equal(env.root.querySelector('.notice.success'), null);
});

test('expiry preserves the live unsaved editor node, focus, selection and text', async (t) => {
  const env = await setup(t);
  await syntaxSuccess(env);
  const input = env.root.querySelector('[data-text]');
  input.value = 'key: still editing';
  input.dispatchEvent(new env.win.Event('input', { bubbles: true }));
  input.focus(); input.setSelectionRange(5, 10);
  env.clock.tick(5000);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
  assert.ok(env.root.querySelector('[data-text]') === input, 'editor node must be retained');
  assert.ok(env.win.document.activeElement === input, 'editor focus must be retained');
  assert.equal(input.value, 'key: still editing');
  assert.equal(env.app.state.drafts.application, 'key: still editing');
  assert.equal(input.selectionStart, 5);
  assert.equal(input.selectionEnd, 10);
});

test('a later success receives its own full interval instead of the older deadline', async (t) => {
  const env = await setup(t);
  await syntaxSuccess(env);
  env.clock.tick(3000);
  await syntaxSuccess(env);
  env.clock.tick(2000);
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(2999);
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(1);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});

test('locale rerender does not extend the original success interval', async (t) => {
  const env = await setup(t);
  await syntaxSuccess(env);
  env.clock.tick(2000);
  await env.app.setLocale('en');
  env.clock.tick(2999);
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(1);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});

test('opening a new confirmation removes stale success immediately', async (t) => {
  const env = await setup(t, 'properties');
  await saveSuccess(env);
  env.root.querySelector('[data-action="delete-item"]').click();
  await env.app.idle();
  assert.ok(env.root.querySelector('[role="dialog"]'));
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});

test('success expiry never auto-dismisses a subsequent important authentication error', async (t) => {
  const env = await setup(t);
  await syntaxSuccess(env);
  env.client.checkSyntax = async () => {
    const error = Error('Authentication expired'); error.status = 401; throw error;
  };
  env.root.querySelector('[data-action="syntax-text"]').click();
  await env.app.idle();
  assert.match(env.root.querySelector('.notice.error').textContent, /Authentication expired/);
  env.clock.tick(15000);
  assert.match(env.root.querySelector('.notice.error').textContent, /Authentication expired/);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});

test('advanced favorite success expires like core mutation success', async (t) => {
  const env = await setup(t, 'properties');
  env.root.querySelector('[data-action="favorite-project"]').click();
  await env.app.idle();
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(5000);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});

test('a disposed view cannot dismiss the replacement view notification', async (t) => {
  const env = await setup(t);
  await syntaxSuccess(env);
  env.clock.tick(1000);
  env.app.destroy();
  const next = createPortalApp(env.root, env.options);
  t.after(() => next.destroy());
  await next.start();
  await next.navigate({ view: 'config', appId: 'SampleApp' });
  await syntaxSuccess({ ...env, app: next });
  env.clock.tick(4000);
  assert.ok(env.root.querySelector('.notice.success'));
  env.clock.tick(1000);
  assert.equal(env.root.querySelector('.notice.success') === null, true, 'success notice must be removed');
});
