async (page) => {
  const sdk = page.context().pages()[0], reference = page.context().pages()[1];
  const iframe = sdk.locator('iframe[title="Apollo"]'), native = iframe.contentFrame(), results = [];
  async function click(action) {
    const control = native.locator(`[data-action="${action}"]`).first();
    if (!await control.isVisible()) {
      const menu = control.locator('xpath=ancestor::details').first();
      if (await menu.count()) await menu.locator('summary').click();
    }
    await control.click(); await native.locator('.loading').waitFor({ state: 'hidden' });
  }
  async function align() {
    let width = 1500, height = 960;
    for (let i = 0; i < 4; i++) {
      await sdk.setViewportSize({ width, height });
      const box = await iframe.boundingBox(), dx = 1304 - Math.round(box.width), dy = 876 - Math.round(box.height);
      if (!dx && !dy) return;
      width += dx; height += dy;
    }
    throw Error('Native/reference viewport mismatch');
  }
  const cases = [
    ['app.html', 'new-project', [
      ['appId', 'input[name="appId"]', 'input[name="appId"]'],
      ['name', 'input[name="name"]', 'input[name="appName"]'],
      ['owner', '[data-user-picker="ownerName"]', '.form-group:has([apollo-id="\'ownerSelector\'"]) .select2-container'],
      ['department', 'select[name="orgId"]', '#organization + .select2-container'],
    ]],
    ['app/setting.html', 'project-settings', [
      ['appId', 'input[name="appId"]:visible, [data-static-field="appId"]', '.form-control-static'],
      ['name', 'input[name="name"]', 'input[name="appName"]'],
      ['owner', '[data-user-picker="ownerName"]', '.J_ownerSelectorPanel .select2-container'],
      ['department', 'select[name="orgId"]', '#organization + .select2-container'],
    ]],
    ['cluster.html', 'new-cluster', [
      ['appId', 'input[name="appId"]:visible, [data-static-field="appId"]', '.form-control-static'],
      ['name', 'input[name="name"]', 'input[name="clusterName"]'],
      ['comment', 'textarea[name="comment"]', 'textarea[name="clusterComment"]'],
      ['DEV', 'input[name="env_DEV"]', 'tr:has-text("DEV") input[type="checkbox"]'],
      ['UAT', 'input[name="env_UAT"]', 'tr:has-text("UAT") input[type="checkbox"]'],
    ]],
    ['namespace.html', 'new-namespace', [
      ['name', 'input[name="name"]', 'input[name="namespaceName"]'],
      ['format', 'select[name="format"]', 'select[name="format"]'],
      ['comment', 'textarea[name="comment"]', 'textarea[name="comment"]'],
    ]],
  ];
  const bounds = async locator => locator.first().evaluate(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
  for (const [source, action, fields] of cases) {
    await sdk.bringToFront(); await sdk.setViewportSize({ width: 1500, height: 1100 }); await click('home');
    if (action !== 'new-project') await click('open-project');
    await click(action); await align();
    await reference.setViewportSize({ width: 1304, height: 876 });
    await reference.goto('http://127.0.0.1:18070/' + source + '?#/appid=SampleApp&env=DEV&cluster=default&namespace=application');
    await reference.waitForLoadState('networkidle');
    for (const [field, actual, expected] of fields) {
      if (!await native.locator(actual).count() || !await reference.locator(expected).count()) {
        results.push({ source, field, missing: true, passed: false }); continue;
      }
      const nativeBox = await bounds(native.locator(actual)), referenceBox = await bounds(reference.locator(expected));
      const differences = Object.keys(nativeBox).map(property => ({ property, delta: nativeBox[property] - referenceBox[property] })).filter(value => Math.abs(value.delta) > .1);
      results.push({ source, field, nativeBox, referenceBox, differences, passed: !differences.length });
    }
  }
  return { scope: 'Selected rendered normal form control geometry only, not whole-page/picker-state parity', results, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length };
}
