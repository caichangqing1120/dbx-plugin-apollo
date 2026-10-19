async (page) => {
  if (!page.url().startsWith('http://127.0.0.1:5198/')) throw Error('Controlled SDK host required');
  const frame = page.locator('iframe[title="Apollo"]'), f = frame.contentFrame(), checks = [];
  const assert = (value, message) => { if (!value) throw Error(message); checks.push(message); };
  async function ready() { await f.locator('.loading').waitFor({ state: 'hidden' }); }
  async function click(action, suffix = '') {
    const el = f.locator(`[data-action="${action}"]${suffix}`).first();
    if (!(await el.isVisible())) { const details = el.locator('xpath=ancestor::details').first(); if (await details.count()) await details.locator('summary').click(); }
    await el.click(); await ready();
  }
  async function config() { if (await f.locator('[role="dialog"]').count()) await click('cancel-dialog'); await click('home'); await click('open-project'); await click('table-mode'); }
  async function nativeViewport() {
    let width=1500,height=960;
    for(let i=0;i<4;i++){await page.setViewportSize({width,height});const box=await frame.boundingBox();const dx=1304-Math.round(box.width),dy=876-Math.round(box.height);if(!dx&&!dy)return;width+=dx;height+=dy;}
    throw Error('Cannot align native inner viewport');
  }
  async function cap(id) { await nativeViewport(); await frame.screenshot({ path: `output/playwright/finish/native-critical-${id}.png`, animations: 'disabled' }); await page.setViewportSize({ width: 1180, height: 960 }); }
  async function submit(values = {}, selector = '[role="dialog"] form', closes = true) {
    const form = f.locator(selector);
    for (const [name, value] of Object.entries(values)) {
      const input = form.locator(`[name="${name}"]`);
      const tag = await input.evaluate(el => el.tagName);
      if (tag === 'SELECT') await input.selectOption(String(value));
      else if (typeof value === 'boolean') await input.setChecked(value);
      else await input.fill(String(value));
    }
    await form.locator('[data-action="submit-form"]').click(); await ready();
    await f.locator('[data-action="home"]:not([disabled])').waitFor(); await ready();
    if (closes) {
      const notice = f.locator('[role="dialog"][data-dialog-source="updateRuleTips"],[role="dialog"][data-dialog-source="grayReleaseWithoutRulesTips"]');
      if (await notice.count()) { await cap(await notice.getAttribute('data-dialog-source')); await click('cancel-dialog'); }
      await f.locator('[role="dialog"]').waitFor({state:'hidden'});
    }
    await ready();
  }
  async function calls() { return (await page.request.get('http://127.0.0.1:18070/fixture/calls')).json(); }
  await page.setViewportSize({ width: 1180, height: 960 });
  await config();
  await click('new-item'); await f.locator('[role="dialog"]').waitFor();
  await submit({ key: 'parity.empty', value: '' });
  assert((await f.locator('body').innerText()).includes('parity.empty'), 'empty String value saves through real sidecar');
  await click('edit-item'); await f.locator('[role="dialog"]').waitFor();
  assert(await f.locator('[role="dialog"] [name="key"]').getAttribute('readonly') !== null, 'existing key is immutable');
  await f.locator('[role="dialog"] [name="type"]').selectOption('2');
  assert((await f.locator('[role="dialog"] [name="value"]').evaluate(el => el.tagName)) === 'SELECT', 'Boolean type uses true/false selector');
  await cap('modal-item-boolean'); await submit({ value: 'false' });
  const beforePublish = (await calls()).filter(call => call.method === 'POST' && call.path.endsWith('/releases')).length;
  await click('publish'); await f.locator('[data-release-preview]').waitFor();
  const preview = await f.locator('[data-release-preview]').innerText();
  assert(preview.includes('Initial Apollo value') && preview.includes('false'), 'publication preview includes actual released and pending values');
  assert((await calls()).filter(call => call.method === 'POST' && call.path.endsWith('/releases')).length === beforePublish, 'preview makes no publication write');
  await cap('modal-release'); await submit({ title: 'Repair browser release' });
  await click('rollback-latest'); await f.locator('[data-release-preview]').waitFor(); await cap('modal-rollback');
  await submit({}, '[role="dialog"] form', false);
  assert((await f.locator('[role="dialog"]').innerText()).includes('回滚'), 'rollback preview leads to separate confirmation');
  await cap('modal-rollback-confirm'); await submit();
  assert((await f.locator('.config-table').innerText()).includes('false'), 'rollback preserves unpublished draft items');
  await click('revoke-items'); await submit();
  assert((await f.locator('.config-table').innerText()).includes('Initial Apollo value'), 'explicit revoke restores published baseline after rollback');
  await click('history'); await f.locator('[data-release-preview]').waitFor(); await cap('config-history');
  assert((await calls()).some(call => call.path === '/envs/DEV/releases/compare'), 'release-history Changes requests the real compare endpoint');
  await config(); await click('gray');
  if (await f.locator('[data-action="create-gray"]').count()) { await click('create-gray'); await submit(); }
  await click('gray-edit-item'); await f.locator('[role="dialog"]').waitFor(); await submit({ value: 'Gray repaired value' });
  await click('gray-tab', '[data-tab="rules"]'); await click('gray-add-rule'); await f.locator('[data-gray-rule-instances]').waitFor();
  await click('gray-rule-manual'); await f.locator('[name="newIps"]').fill('127.0.0.1,127.0.0.1'); await click('gray-rule-add-ip');
  assert(await f.locator('[data-gray-ip]').count() === 1, 'gray IP chip editor deduplicates addresses');
  await f.locator('[name="newLabels"]').fill('canary'); await click('gray-rule-add-label'); await cap('modal-gray-rule-manual'); await submit();
  await click('gray-publish'); await f.locator('[data-release-preview]').waitFor(); await submit({ title: 'Repaired gray' });
  await config(); await click('edit-item'); await f.locator('[role="dialog"]').waitFor(); await submit({ value: 'Pending master value' });
  await click('gray'); await click('gray-merge');
  await f.locator('[data-dialog-source="mergeAndReleaseDenyDialog"]').waitFor();
  assert((await f.locator('[role="dialog"]').innerText()).includes('主版本'), 'gray full merge refuses an unpublished master draft');
  assert(await f.locator('[role="dialog"] [data-action="submit-form"]').count() === 0, 'blocked gray merge never opens a submittable dialog');
  await cap('gray-merge-blocked');
  await config(); await click('revoke-items'); await submit(); await click('gray'); await click('gray-merge');
  await f.locator('[name="branchDisposition"]').first().waitFor(); await f.locator('[name="branchDisposition"][value="keep"]').check();
  await cap('modal-merge'); await submit({}, '[role="dialog"] form', false); await f.locator('[data-release-preview]').waitFor(); await cap('modal-merge-preview'); await submit({ title: 'Repaired full merge' });
  await config(); await click('permissions'); await f.locator('[data-role-env="ModifyNamespace"]').selectOption('UAT');
  await f.locator('[data-role="ModifyNamespace"] [data-action="submit-form"]').waitFor({ state: 'visible' });
  await submit({ user: 'apollo' }, '[data-role="ModifyNamespace"] form', false);
  assert((await calls()).some(call => call.method === 'POST' && call.path === '/apps/SampleApp/envs/UAT/namespaces/application/roles/ModifyNamespace'), 'inline role grant writes only the selected UAT scope');
  await config(); await click('access-keys'); await submit({ env: 'DEV' }, '[data-submit-action="key-create-inline"]', false);
  await cap('access-key-revealed');
  assert((await f.locator('body').innerText()).includes('fixture-access-secret'), 'source-visible environment-scoped access key works in SDK');
  await click('system-roles'); await submit({ appId: 'SampleApp' }, '[data-submit-action="master-lookup"]', false);
  await f.locator('[data-system-master] [name="user"]').fill('apollo'); await click('allow-master'); await cap('modal-master-grant'); await submit();
  assert((await calls()).some(call => call.method === 'POST' && call.path === '/apps/SampleApp/system/master/apollo'), 'Master lookup and confirmed grant use the source endpoint');
  await f.locator('[data-system-master] [name="appId"]').fill('OtherApp');
  assert(await f.locator('[data-action="allow-master"]').isDisabled(), 'changing Master AppId invalidates its lookup');
  await click('delete'); await submit({ appId: 'SampleApp' }, '[data-delete-kind="app"]', false);
  await cap('delete-queried'); await f.locator('[data-delete-kind="app"] [name="appId"]').fill('OtherApp');
  assert(await f.locator('[data-action="delete-queried"][data-kind="app"]').isDisabled(), 'delete query target invalidates immediately after an input change');
  await config();
  return { checks, requestCount: (await calls()).length, realApollo: false };
}
