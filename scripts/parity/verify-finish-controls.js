async (page) => {
  const frame = page.locator('iframe[title="Apollo"]'), f = frame.contentFrame(), checks = [];
  const base = 'http://127.0.0.1:18070';
  const assert = (value, message) => { if (!value) throw Error(message); checks.push(message); };
  async function ready() { await f.locator('.loading').waitFor({state:'hidden'}); }
  async function click(action, suffix = '') {
    const control=f.locator(`[data-action="${action}"]${suffix}`).first();
    if(!await control.isVisible())await control.locator('xpath=ancestor::details').locator('summary').click();
    await control.click(); await ready();
  }
  async function submit(selector) { await f.locator(selector+' [data-action="submit-form"]').click(); await f.locator('[data-action="home"]:not([disabled])').waitFor(); await ready(); }
  async function calls() { return (await page.request.get(base+'/fixture/calls')).json(); }
  await page.setViewportSize({width:1180,height:960});
  await click('consumers'); await click('new-consumer');
  await f.locator('[name="lookupAppId"]').fill('FinishConsumer');
  const create = '[data-submit-action="consumer-create-submit"]';
  await f.locator(create+' [name="name"]').fill('Finish browser consumer');
  await f.locator(create+' [name="orgId"]').selectOption('TEST1');
  const owner = f.locator('[data-user-picker="ownerName"] .user-picker-input');
  await owner.fill('apo'); await owner.press('ArrowDown'); await owner.press('Enter');
  assert(await owner.inputValue()==='apollo','keyboard owner selection resolves search text to the actual user');
  await f.locator(create+' [name="rateLimitEnabled"]').check();
  assert(await f.locator('[data-consumer-rate]').isVisible(),'rate input appears only when enabled');
  await f.locator(create+' [name="rateLimit"]').fill('25');
  await submit(create);
  const writes=(await calls()).filter(c=>c.path==='/consumers'&&c.method==='POST').map(c=>JSON.parse(c.body));
  assert(writes.some(model=>model.appId==='FinishConsumer'&&model.ownerName==='apollo'&&model.rateLimit===25),'consumer creation uses shared AppId and keyboard-selected owner through real sidecar');
  assert((await f.locator('[data-submit-action="consumer-grant-inline"] input[readonly]').inputValue()).startsWith('fixture-consumer-token-'),'new consumer token is fetched after successful creation');
  await f.locator('[name="lookupAppId"]').fill('ChangedConsumer');
  assert(await f.locator('[data-submit-action="consumer-grant-inline"] input[readonly]').inputValue()==='','changing the shared AppId clears a stale token immediately');
  assert(await owner.inputValue()==='apollo','creation draft retains keyboard owner after rerender');
  await f.locator('[name="lookupAppId"]').fill('FinishConsumer'); await submit('[data-submit-action="consumer-lookup"]');
  await f.locator('[name="managedAppId"]').fill('SampleApp');
  await f.locator('[name="namespace"]').fill('application');
  await f.locator('[name="env_UAT"]').check(); await submit('[data-submit-action="consumer-grant-inline"]');
  assert((await calls()).some(c=>c.method==='POST'&&/^\/consumers\/[^/]+\/assign-role$/.test(c.path)&&c.query.includes('UAT')&&JSON.parse(c.body).appId==='SampleApp'),'consumer authorization writes selected environment and target application');
  await click('home'); await click('new-project');
  const admins=f.locator('[data-user-picker="admins"]');
  await admins.locator('.user-picker-input').fill('apo'); await admins.locator('.user-picker-input').press('ArrowDown'); await admins.locator('.user-picker-input').press('Enter');
  assert(await admins.locator('[data-user-chip="apollo"]').count()===1,'administrator picker creates a selected-user chip');
  await admins.locator('[data-action="user-picker-remove"]').click();
  assert(await admins.locator('input[type="hidden"]').inputValue()==='','chip removal updates the submitted administrator IDs');
  await click('home'); await click('open-project');
  return {checks,controlledFixture:true};
}
