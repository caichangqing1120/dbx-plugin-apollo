async (page) => {
  const sdk = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:5198'));
  const native = sdk.locator('iframe[title="Apollo"]').contentFrame();
  const viewport = sdk.viewportSize(), cases = [];
  await sdk.setViewportSize({ width: viewport.width + 1, height: viewport.height + 1 });
  await sdk.setViewportSize(viewport);
  const target = () => native.locator('[data-namespace="application"]');
  for (const action of ['fold-namespace', 'text-mode']) {
    await target().locator(`[data-action="${action}"]`).click();
    await native.locator('[data-app-search-toggle]').click();
    await native.locator('[data-app-search-input]').fill('native.acceptance');
    const result = native.locator('[role="option"]').filter({ hasText: 'DBXNative20261020 / LOCAL / default / application' });
    await result.waitFor();
    await result.click();
    await target().locator('[data-filter="application"]').waitFor();
    const keys = await target().locator('.config-table .key-cell button').allTextContents();
    cases.push({ id: `key-result-after-${action}`, passed:
      await target().locator('[data-filter="application"]').inputValue() === 'native.acceptance' &&
      keys.length === 1 && keys[0] === 'native.acceptance', keys });
  }
  await sdk.locator('iframe[title="Apollo"]').screenshot({ path: 'output/playwright/continue/key-search-revealed.png' });
  return { scope: 'Real Apollo key-search navigation after retained collapse/text state; no configuration writes',
    cases, passed: cases.filter(c => c.passed).length, failed: cases.filter(c => !c.passed).length };
}
