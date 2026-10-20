import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createPortalApp } from '../src/app.js';

async function setup(t) {
  const win = new Window({ url: 'http://localhost' });
  const root = win.document.createElement('div'); win.document.body.append(root);
  const requests = [], targets = [];
  const client = {
    user: async () => ({ userId: 'apollo', name: 'Apollo' }),
    rootPermission: async () => ({ hasPermission: true }),
    creationPermission: async () => ({ hasCreateApplicationPermission: true }),
    apps: async () => [], favorites: async () => [], publicNamespaces: async () => [],
    search: async (query, page) => {
      requests.push([query, page]);
      return { content: [{ appId: 'Target', name: '<Target App>', orgId: 'TEST2', orgName: 'Dept' }], size: 20 };
    },
    app: async appId => { targets.push(appId); return { appId, name: appId }; },
    tree: async () => ({ entities: [{ code: 200, body: { env: 'DEV', clusters: [{ name: 'default' }] } }] }),
    namespaces: async () => [],
  };
  const app = createPortalApp(root, { client, connectionId: 'search',
    storage: { get: async () => null, set: async () => {} } });
  await app.start();
  let now = 0, id = 0;
  const timers = new Map(), setTimeout = win.setTimeout, clearTimeout = win.clearTimeout;
  win.setTimeout = (fn, delay = 0) => { const key = ++id; timers.set(key, { at: now + delay, fn }); return key; };
  win.clearTimeout = key => timers.delete(key);
  const tick = async ms => {
    now += ms;
    for (const [key, task] of [...timers]) if (task.at <= now) { timers.delete(key); task.fn(); }
    await app.idle();
  };
  t.after(async () => { app.destroy(); win.setTimeout = setTimeout; win.clearTimeout = clearTimeout; await win.happyDOM.close(); });
  function open() {
    const button = root.querySelector('[data-app-search-toggle]');
    assert.ok(button, 'header must offer an application search combobox');
    button.click(); return root.querySelector('[data-app-search-input]');
  }
  function input(query) {
    const field = root.querySelector('[data-app-search-input]');
    field.value = query; field.dispatchEvent(new win.Event('input', { bubbles: true }));
  }
  return { win, root, app, client, requests, targets, tick, open, input };
}

test('header search debounces queries and preserves unrelated unsaved form nodes', async t => {
  const e = await setup(t); const query = e.open();
  assert.equal(e.win.document.activeElement, query);
  e.input('Ta'); await e.tick(200); e.input('Target'); await e.tick(399);
  assert.deepEqual(e.requests, []);
  await e.tick(1);
  assert.deepEqual(e.requests, [['Target', 0]]);
  assert.ok(e.root.querySelector('[role="option"]')?.textContent.includes('Target / <Target App>'));
  assert.equal(e.root.querySelector('target'), null);
  assert.ok(e.root.querySelector('[data-app-search-input]') === query);
});

test('selecting a search result navigates to its real application rather than replacing the home table', async t => {
  const e = await setup(t); e.open(); e.input('Target'); await e.tick(400);
  e.root.querySelector('[role="option"]').click(); await e.app.idle();
  assert.equal(e.app.state.route.view, 'config');
  assert.equal(e.app.state.route.appId, 'Target');
  assert.deepEqual(e.targets, ['Target']);
  assert.equal(e.root.querySelector('[data-app-search-dropdown]').hidden, true);
});

test('configuration-key search result preserves literal environment cluster namespace and key', async t => {
  const e = await setup(t);
  e.client.search = async () => ({ content: [{ appId: 'Other', name: 'UAT / shanghai / settings.yaml',
    orgName: 'SearchByItem+feature+enabled', orgId: 'UAT+shanghai+settings.yaml' }], size: 20 });
  e.client.namespaces = async () => [{ baseInfo: { namespaceName: 'settings.yaml' },
    format: 'properties', items: [{ item: { id: 1, key: 'feature+enabled', value: 'true' } },
      { item: { id: 2, key: 'other', value: 'false' } }] }];
  e.client.permission = async () => ({ hasPermission: true });
  e.open(); e.input('feature+enabled'); await e.tick(400);
  e.root.querySelector('[role="option"]').click(); await e.app.idle();
  assert.deepEqual(e.app.state.route, { view: 'config', appId: 'Other', env: 'UAT',
    cluster: 'shanghai', namespace: 'settings.yaml', item: 'feature+enabled' });
  assert.equal(e.root.querySelector('[data-filter]')?.value, 'feature+enabled');
  assert.equal(e.root.querySelectorAll('.config-table tbody tr').length, 1);
  assert.equal(e.root.querySelector('.key-cell')?.textContent, 'feature+enabled');
});

for (const previousAction of ['fold-namespace', 'text-mode']) {
  test(`key search reveals filtered rows after the target previously used ${previousAction}`, async t => {
    const e = await setup(t);
    e.client.search = async () => ({ content: [{ appId: 'Other', name: 'DEV / default / application',
      orgName: 'SearchByItem+wanted', orgId: 'DEV+default+application' }], size: 20, total: 1, page: 0 });
    e.client.namespaces = async () => ['application', 'unrelated'].map(namespaceName => ({
      baseInfo: { namespaceName }, format: 'properties', items: [
        { item: { id: 1, key: 'wanted', value: 'match' } },
        { item: { id: 2, key: 'other', value: 'not matching' } },
      ],
    }));
    e.client.permission = async () => ({ hasPermission: true });
    await e.app.navigate({ view: 'config', appId: 'Other' });
    for (const [action, namespace] of [['text-mode', 'unrelated'], ['fold-namespace', 'unrelated'],
      [previousAction, 'application']]) {
      e.root.querySelector(`[data-action="${action}"][data-ns="${namespace}"]`).click();
      await e.app.idle();
    }
    e.open(); e.input('wanted'); await e.tick(400);
    e.root.querySelector('[role="option"]').click(); await e.app.idle();
    const filter = e.root.querySelector('[data-filter="application"]');
    assert.equal(filter?.value, 'wanted', 'the target must reveal its filter');
    const panel = filter.closest('.namespace-panel');
    assert.equal(panel.querySelectorAll('.config-table tbody tr').length, 1);
    assert.equal(panel.querySelector('.key-cell')?.textContent, 'wanted');
    assert.equal(e.app.state.collapsed.unrelated, true, 'unrelated folded state is retained');
    assert.equal(e.app.state.modes.unrelated, 'text', 'unrelated view choice is retained');
  });
}

test('late older search response cannot replace a newer query result', async t => {
  const e = await setup(t); let resolveOld;
  e.client.search = query => query === 'old'
    ? new Promise(resolve => { resolveOld = resolve; })
    : Promise.resolve({ content: [{ appId: 'New', name: 'New Result' }], size: 20 });
  e.open(); e.input('old');
  // Start the slow request without waiting for the external response.
  const oldTick = e.tick(400); await Promise.resolve();
  e.input('new'); const newTick = e.tick(400); await Promise.resolve(); await Promise.resolve();
  resolveOld({ content: [{ appId: 'Old', name: 'Obsolete' }], size: 20 });
  await oldTick; await newTick;
  assert.match(e.root.querySelector('[role="listbox"]').textContent, /New Result/);
  assert.ok(!e.root.querySelector('[role="listbox"]').textContent.includes('Obsolete'));
});

test('Escape closes results without orphaning the active configuration draft', async t => {
  const e = await setup(t); e.app.state.drafts.application = 'not saved';
  const query = e.open(); e.input('Target'); await e.tick(400);
  query.dispatchEvent(new e.win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(e.root.querySelector('[data-app-search-dropdown]').hidden, true);
  assert.equal(e.app.state.drafts.application, 'not saved');
  assert.deepEqual(e.targets, []);
});

test('search selection refuses to navigate away from a live unsaved text draft', async t => {
  const e = await setup(t); e.open(); e.input('Target'); await e.tick(400);
  e.app.state.drafts.application = 'keep this draft';
  e.root.querySelector('[role="option"]').click(); await e.app.idle();
  assert.deepEqual(e.targets, []);
  assert.equal(e.app.state.drafts.application, 'keep this draft');
  assert.ok(e.root.querySelector('.notice.error'));
});

test('keyboard result selection and paged results keep distinct item matches for the same app', async t => {
  const e = await setup(t); const query = e.open();
  e.client.search = async (_query, page) => ({ content: [{ appId: 'Same', name: `Result ${page}`,
    orgName: 'SearchByItem+key', orgId: `${page ? 'UAT' : 'DEV'}+default+application` }], size: page ? 20 : 1 });
  e.input('key'); await e.tick(400);
  e.root.querySelector('[data-app-search-more]').click(); await e.app.idle();
  assert.equal(e.root.querySelectorAll('[role="option"]').length, 2);
  query.dispatchEvent(new e.win.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  query.dispatchEvent(new e.win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await e.app.idle();
  assert.equal(e.app.state.route.env, 'UAT');
});

test('multi-environment key search pages by the per-environment total, not merged row count', async t => {
  const e = await setup(t), pages = [];
  e.client.search = async (_query, page) => {
    pages.push(page);
    return { content: ['DEV', 'UAT'].flatMap(env =>
      Array.from({ length: page === 0 ? 20 : 10 }, (_, index) => ({
        appId: 'Same', name: `${env} / cluster-${page * 20 + index} / application`,
        orgName: 'SearchByItem+shared.key', orgId: `${env}+cluster-${page * 20 + index}+application`,
      }))), size: 20, total: 30, page };
  };
  e.open(); e.input('shared.key'); await e.tick(400);
  assert.equal(e.root.querySelectorAll('[role="option"]').length, 40);
  const more = e.root.querySelector('[data-app-search-more]');
  assert.ok(more, 'a merged 40-row page must still offer the second per-environment page');
  more.click(); await e.app.idle();
  assert.deepEqual(pages, [0, 1]);
  assert.equal(e.root.querySelectorAll('[role="option"]').length, 60);
  assert.equal(e.root.querySelector('[data-app-search-more]'), null, 'total prevents an extra page');
});

test('search without a reliable total continues from an oversized raw page and deduplicates identities', async t => {
  const e = await setup(t), pages = [];
  const rows = Array.from({ length: 21 }, (_, index) => ({ appId: `App${index}`, name: `Application ${index}` }));
  e.client.search = async (_query, page) => {
    pages.push(page);
    return { content: page === 0 ? rows : [rows[20], { appId: 'Last', name: 'Last application' }], size: 20, page };
  };
  e.open(); await e.tick(400);
  assert.equal(e.root.querySelectorAll('[role="option"]').length, 21);
  const more = e.root.querySelector('[data-app-search-more]');
  assert.ok(more, 'raw pages larger than size also need the compatibility fallback');
  more.click(); await e.app.idle();
  assert.deepEqual(pages, [0, 1]);
  assert.equal(e.root.querySelectorAll('[role="option"]').length, 22);
  assert.equal(e.root.querySelector('[data-app-search-more]'), null);
});

test('search authentication failure stays visible after the dropdown closes', async t => {
  const e = await setup(t);
  e.client.search = async () => { const error = Error('Search session expired'); error.status = 401; throw error; };
  e.open(); e.input('Target'); await e.tick(400);
  assert.match(e.root.querySelector('.notice.error')?.textContent || '', /Search session expired/);
  assert.equal(e.app.state.expired, true);
});

test('Escape cancels a queued query before it reaches the Portal', async t => {
  const e = await setup(t), query = e.open();
  e.input('queued');
  query.dispatchEvent(new e.win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await e.tick(1000);
  assert.deepEqual(e.requests, []);
});

test('malformed key-search metadata is rejected instead of opening an unintended target', async t => {
  const e = await setup(t);
  e.client.search = async () => ({ content: [{ appId: 'Other', name: 'Incomplete target',
    orgName: 'SearchByItem+secret', orgId: 'DEV+default' }], size: 20 });
  e.open(); e.input('secret'); await e.tick(400);
  e.root.querySelector('[role="option"]').click(); await e.app.idle();
  assert.deepEqual(e.targets, []);
  assert.equal(e.app.state.route.view, 'home');
  assert.match(e.root.querySelector('.notice.error')?.textContent || '', /Invalid configuration search target/);
});
