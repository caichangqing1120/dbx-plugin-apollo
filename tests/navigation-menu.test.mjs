import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { renderPortal } from '../src/views.js';
import { translator } from '../src/i18n.js';

function header(rootUser, locale = 'zh-CN') {
  const win = new Window();
  const state = { route: { view: 'home' }, homeTab: 'mine', isRoot: rootUser,
    user: { userId: 'apollo', name: 'Apollo' }, apps: [], publicNamespaces: [],
    recent: [], favorites: [], drafts: {}, canCreate: true };
  win.document.body.innerHTML = renderPortal(state, translator(locale));
  return win.document.querySelector('.apollo-nav');
}

test('root tools preserve original order, labels and explicit internal destinations', () => {
  const root = header(true);
  const menu = root.querySelector('[data-navigation-tools]');
  assert.ok(menu, 'the navigation tools menu is a shared original-page entry');
  assert.deepEqual([...menu.querySelectorAll('[data-action]')].map(button =>
    [button.dataset.action, button.textContent]), [
    ['users', '用户管理'], ['system-roles', '系统权限管理'],
    ['consumers', '开放平台授权管理'], ['server-config', '系统参数'],
    ['delete', '删除应用、集群、AppNamespace'], ['system-info', '系统信息'],
    ['transfer', '配置导出导入'], ['audit', '审计日志'], ['global-search', 'Value的全局搜索'],
  ]);
  assert.equal(root.querySelectorAll('[data-navigation-user] [data-action]').length, 1);
  assert.equal(root.querySelector('[data-navigation-user] [data-action]').dataset.action, 'logout');
});

test('ordinary users retain original user-management and export tools without root-only entries', () => {
  const root = header(false, 'en');
  const menu = root.querySelector('[data-navigation-tools]');
  assert.ok(menu, 'ordinary users must retain their non-admin tools');
  assert.match(menu.querySelector('summary').textContent, /Tools/);
  assert.deepEqual([...menu.querySelectorAll('[data-action]')].map(b => b.dataset.action), ['users', 'transfer']);
  assert.equal(root.querySelector('[data-action="delete"]'), null);
  assert.equal(root.querySelector('[data-action="system-roles"]'), null);
});
