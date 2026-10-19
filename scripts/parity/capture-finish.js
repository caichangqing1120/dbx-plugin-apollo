async (page) => {
  const frame = page.locator('iframe[title="Apollo"]'), f = frame.contentFrame(), results = [];
  async function ready() {
    await f.locator('.loading').waitFor({ state: 'hidden' });
  }
  async function click(action, suffix = '') {
    const el = f.locator(`[data-action="${action}"]${suffix}`).first();
    if (!(await el.isVisible())) {
      const details = el.locator('xpath=ancestor::details').first();
      if (await details.count()) await details.locator('summary').click();
    }
    await el.click();
    await ready();
  }
  async function close() {
    if (await f.locator('[role="dialog"]').count()) await click('cancel-dialog');
  }
  async function nativeViewport() {
    let width=1500,height=960;
    for(let i=0;i<4;i++){await page.setViewportSize({width,height});const box=await frame.boundingBox();const dx=1304-Math.round(box.width),dy=876-Math.round(box.height);if(!dx&&!dy)return;width+=dx;height+=dy;}
    throw Error('Cannot align native inner viewport');
  }
  async function cap(id) {
    await nativeViewport();
    await f.locator('body').evaluate(() => window.scrollTo(0,0));
    await frame.screenshot({ path: `output/playwright/finish/native-${id}.png`, animations: 'disabled' });
    const errors = await f.locator('.notice.error').allTextContents();
    results.push({ id, errors, viewport: await frame.boundingBox(), geometry: await f.locator('body').evaluate(() => {const b=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {panel:b('.reference-surface'),heading:b('.reference-heading'),footer:b('.apollo-footer'),firstField:b('.form-field')};}), document: await f.locator('body').evaluate(el=>({width:el.scrollWidth,height:el.scrollHeight})), text: (await f.locator('body').innerText()).slice(0, 7000) });
    await page.setViewportSize({ width: 1180, height: 960 });
  }
  async function config() {
    await close(); await click('home'); await click('open-project');
    if (await f.locator('[data-action="table-mode"]').count()) await click('table-mode');
    if (!await f.locator('[data-filter]').count()) await click('filter-config');
  }
  async function modal(action, id, suffix = '') {
    await click(action, suffix); await f.locator('[role="dialog"]').waitFor(); await cap(id); await close();
  }
  async function step(id, callback) {
    try { await callback(); } catch (error) { results.push({ id, error: error.message }); await close().catch(() => {}); }
  }
  await page.getByRole('button',{name:/重载页面/}).click();await page.getByRole('button',{name:'确认',exact:true}).click();await f.locator('.apollo-nav').waitFor();await ready();
  await page.setViewportSize({ width: 1180, height: 960 });
  await step('core', async () => {
    await config(); await cap('config');
    await click('home'); await cap('index'); await click('new-project'); await cap('app'); await config();
    for (const [action, id] of [['edit-item','modal-item-edit'], ['new-item','modal-item-create'], ['delete-item','modal-item-delete'], ['publish','modal-release'], ['revoke-items','modal-revoke'], ['show-config-value','modal-show-text']]) await modal(action, id);
    await click('text-mode'); await cap('config-text'); await click('commits-mode'); await cap('config-commits'); await click('table-mode');
    await click('instances'); await cap('config-instances');
  });
  for (const [action, id] of [['history','config-history'], ['sync','config-sync'], ['diff','config-diff'], ['permissions','namespace-role'], ['new-namespace','namespace'], ['clusters','app-manage_cluster'], ['access-keys','app-access_key'], ['project-settings','app-setting'], ['new-cluster','cluster']]) {
    await step(id, async () => {
      await config(); await click(action);
      const expected={clusters:'.clusters-page','access-keys':'.access-page','project-settings':'.app-management-page',permissions:'.permissions-page','new-cluster':'.cluster-create-page','new-namespace':'.namespace-create-page'}[action];
      if(expected)await f.locator(expected).waitFor();
      await cap(id);
      if (action === 'permissions') {
        await f.locator('[data-role-env="ModifyNamespace"]').selectOption('DEV'); await ready(); await cap('namespace-role-env');
      }
      if (action === 'clusters') { await click('cluster-roles'); await cap('cluster-ns_role'); }
      if (action === 'project-settings') { await click('edit-project'); await cap('app-edit'); }
      if (action === 'new-namespace') { await click('namespace-mode', '[data-mode="link"]'); await cap('namespace-link'); }
      if (action === 'access-keys' && await f.locator('[data-action="reveal-key"]').count()) { await click('reveal-key'); await cap('access-key-revealed'); }
    });
  }
  await step('namespace-dialogs', async () => { await config(); await modal('import-namespace','modal-import-namespace'); await modal('namespace-delete','modal-delete-namespace'); });
  await step('gray', async () => {
    await config(); await click('gray'); if(await f.locator('[data-action="create-gray"]').count())await cap('config-gray-empty');
    if (await f.locator('[data-action="create-gray"]').count()) {
      await click('create-gray'); await cap('modal-create-gray');
      await f.locator('[role="dialog"] [data-action="submit-form"]').click();
      await f.locator('[role="dialog"]').waitFor({state:'hidden'}); await ready();
    }
    await cap('config-gray'); await modal('gray-edit-item','modal-gray-item');
    await modal('gray-publish','modal-gray-release'); await modal('gray-merge','modal-merge'); await modal('delete-gray','modal-delete-gray');
    await click('gray-tab','[data-tab="rules"]'); await cap('gray-rules'); await modal('gray-add-rule','modal-gray-rule');
    await click('gray-tab','[data-tab="instances"]'); await cap('gray-instances');
    await click('gray-tab','[data-tab="history"]'); await cap('gray-history');
  });
  for (const [action, id] of [['users','user-manage'], ['server-config','server_config_manage'], ['system-roles','system-role-manage'], ['consumers','open-manage'], ['system-info','system_info'], ['transfer','config_export'], ['delete','delete_app_cluster_namespace'], ['audit','audit_log_menu'], ['global-search','global_search_value']]) {
    await step(id, async () => {
      await close(); await click(action); await cap(id);
      if (action === 'users') { await click('new-user'); await cap('user-create'); await click('cancel-inline'); await click('edit-user'); await cap('user-edit'); }
      if (action === 'server-config') { await click('edit-server-config'); await cap('parameter-edit'); }
      if (action === 'consumers') { if(await f.locator('[data-action=assign-consumer]').count()){await modal('assign-consumer','modal-consumer-authorize');await modal('delete-consumer','modal-consumer-delete');} await click('new-consumer'); await cap('open-add-consumer'); }
      if (action === 'audit') { await click('audit-trace'); await cap('audit_log_trace_detail'); }
      if (action === 'transfer') { await click('transfer-tab','[data-tab="cluster"]'); await cap('transfer-cluster'); }
    });
  }
  await config();
  return results;
}
