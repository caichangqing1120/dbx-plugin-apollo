async (page) => {
  const sdk = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:5198'));
  const iframe = sdk.locator('iframe[title="Apollo"]'), native = iframe.contentFrame(), cases = [];
  async function click(action) {
    const button = native.locator(`[data-action="${action}"]`).first();
    if (!await button.isVisible()) await button.locator('xpath=ancestor::details').locator('summary').click();
    await button.click(); await native.locator('.loading').waitFor({ state: 'hidden' });
  }
  const formName = native.locator('input[name="name"]');
  await click('home'); await click('new-project');
  await formName.fill('Unsaved application draft');
  const draftNode = await formName.elementHandle();
  await native.locator('[data-app-search-toggle]').click();
  await native.locator('[data-app-search-input]').fill('DBXNative');
  await native.locator('[role="option"]').first().waitFor();
  cases.push({ id: 'search-keeps-unsaved-form', passed: await draftNode.evaluate(el => el.isConnected && el.value === 'Unsaved application draft') });
  await native.locator('[data-app-search-input]').press('Escape');
  await native.locator('.nav-language-menu summary').click();
  await native.locator('[data-action="language"][data-locale="en"]').click();
  cases.push({ id: 'locale-keeps-application-draft', passed: await formName.inputValue() === 'Unsaved application draft' });
  await sdk.getByRole('button', { name: '深色主题', exact: true }).click();
  const appearance = await native.locator('.apollo-nav').evaluate(el => ({ color: getComputedStyle(el).backgroundColor }));
  cases.push({ id: 'dark-host-light-portal', passed: appearance.color === 'rgb(255, 255, 255)', appearance });
  await sdk.setViewportSize({ width: 391, height: 901 });
  await sdk.setViewportSize({ width: 390, height: 900 });
  cases.push({ id: 'narrow-host-draft-and-search-control', passed: await formName.inputValue() === 'Unsaved application draft' && await native.locator('[data-app-search-toggle]').count() === 1 });
  await sdk.screenshot({ path: 'output/playwright/continue/english-dark-narrow.png' });
  let width = 1500, height = 960;
  await sdk.setViewportSize({ width: width + 1, height: height + 1 });
  for (let i = 0; i < 4; i++) {
    await sdk.setViewportSize({ width, height });
    const box = await iframe.boundingBox(), dx = 1304 - Math.round(box.width), dy = 876 - Math.round(box.height);
    if (!dx && !dy) break;
    width += dx; height += dy;
  }
  await sdk.getByRole('button', { name: '浅色主题', exact: true }).click();
  await native.locator('.nav-language-menu summary').click();
  await native.locator('[data-action="language"][data-locale="zh-CN"]').click();
  for (const route of ['users', 'server-config', 'system-roles']) {
    await click(route);
    await native.locator('[data-app-search-toggle]').click();
    await native.locator('[data-app-search-input]').fill('DBXNative');
    await native.locator('[role="option"]').first().waitFor();
    cases.push({ id: `search-on-${route}`, passed: await native.locator('[role="option"]').first().textContent().then(text => text.includes('DBXNative20261020')) });
    await native.locator('[data-app-search-input]').press('Escape');
  }
  await click('home');
  await native.locator('[data-app="DBXNative20261020"]').click();
  await native.locator('.loading').waitFor({ state: 'hidden' });
  return { scope: 'Representative real-backend SDK pages, language/theme/narrow and unsaved fields; no original full-page parity claim',
    cases, passed: cases.filter(c => c.passed).length, failed: cases.filter(c => !c.passed).length };
}
