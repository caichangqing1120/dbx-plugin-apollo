import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { translator } from '../src/i18n.js';

globalThis.APOLLO_DESIGN_ASSETS = {
  'assign.png': 'data:image/png;base64,' +
    (await readFile(new URL('../assets/reference/assign.png', import.meta.url))).toString('base64'),
};
const { referenceAdminView } = await import('../src/reference-pages.js');

function render(view, extra = {}) {
  const window = new Window();
  const state = {
    route: { view, appId: 'SampleApp', env: 'DEV', cluster: 'default' },
    organizations: [{ orgId: 'TEST1', orgName: 'Sample Department' }],
    userChoices: [{ userId: 'apollo' }], canCreate: true, canManage: true,
    canCreateCluster: true, clusterCreateEnvs: ['DEV', 'UAT'],
    advApp: { appId: 'SampleApp', name: 'Sample App', orgId: 'TEST1', ownerName: 'apollo' },
    appRoles: { masterUsers: [{ userId: 'apollo' }] }, ...extra,
  };
  window.document.body.innerHTML = referenceAdminView(state, translator('zh-CN'));
  return { window, root: window.document.body };
}

test('application help belongs to its control column and retains source punctuation', () => {
  const { root } = render('create-project');
  const row = root.querySelector('input[name=name]').closest('.form-field');
  assert.equal(row.querySelector('small')?.textContent, '（建议格式 xx-yy-zz 例: apollo-server）');
  const form = root.querySelector('form');
  root.querySelector('input[name=appId]').value = 'AnotherApp';
  root.querySelector('input[name=name]').value = 'Another Name';
  assert.equal(new root.ownerDocument.defaultView.FormData(form).get('appId'), 'AnotherApp');
});

test('cluster route identity renders as static text while remaining in submitted data', () => {
  const { window, root } = render('cluster-create');
  assert.equal(root.querySelector('[data-static-field=appId]')?.textContent, 'SampleApp');
  assert.equal(root.querySelector('input[name=appId]').type, 'hidden');
  assert.equal(new window.FormData(root.querySelector('form')).get('appId'), 'SampleApp');
  root.querySelector('input[name=env_UAT]').checked = true;
  assert.equal(new window.FormData(root.querySelector('form')).get('env_UAT'), 'on');
});

test('application information retains source administrator permissions and disabled controls', () => {
  const { root } = render('project');
  assert.ok(root.textContent.includes('（应用管理员具有以下权限: 1. 创建 Namespace 2. 创建集群 3. 管理应用、Namespace 权限）'));
  assert.ok(root.querySelector('[data-submit-action=save-project-submit] fieldset').disabled);
  assert.equal(root.querySelector('[data-static-field=appId]')?.textContent, 'SampleApp');
  assert.equal(root.querySelector('[data-action=edit-project]').disabled, false);
});

test('namespace form retains original format order and required type/name captions', () => {
  const { window, root } = render('namespace-create', {
    canCreateNamespace: true, namespaceChoices: [], namespacePublic: [],
  });
  assert.deepEqual([...root.querySelector('select[name=format]').options].map(o => o.value), ['properties', 'xml', 'json', 'yml', 'yaml', 'txt']);
  assert.equal(root.querySelector('input[name=name]').closest('.form-field').querySelector('b')?.textContent, '*');
  assert.equal(root.querySelector('input[name=namespaceType]').closest('.form-field').querySelector('b')?.textContent, '*');
  root.querySelector('input[name=name]').value = 'feature';
  root.querySelector('select[name=format]').value = 'json';
  const data = new window.FormData(root.querySelector('form'));
  assert.equal(data.get('namespaceType'), 'private');
  assert.equal(data.get('format'), 'json');
});

test('cluster authorization rows keep each exact environment and cluster destination', () => {
  const { root } = render('clusters', {
    advTree: [
      { env: 'DEV', clusters: [{ name: 'default' }, { name: '<unsafe>' }] },
      { env: 'UAT', clusters: [{ name: 'default' }] },
    ],
  });
  const rows = [...root.querySelectorAll('.reference-cluster-card')];
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(row => {
    const button = row.querySelector('[data-action="cluster-roles"]');
    return [button.dataset.env, button.dataset.name, button.textContent.trim()];
  }), [['DEV', 'default', '授权'], ['DEV', '<unsafe>', '授权'], ['UAT', 'default', '授权']]);
  assert.equal(rows[1].querySelector('strong').textContent, '集群: <unsafe>');
  assert.equal(rows[1].querySelector('unsafe'), null);
  assert.ok(rows.every(row => row.querySelector('img[alt=""]')),
    'each authorization action must show the source assignment icon');
  assert.equal(root.querySelectorAll('.reference-cluster-group>hr').length, 2);
});
