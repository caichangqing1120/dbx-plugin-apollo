async (page) => {
  const sdk = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:5198'));
  const reference = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:8070'));
  const native = sdk.locator('iframe[title="Apollo"]').contentFrame();
  await reference.goto('http://127.0.0.1:8070/config.html?#appid=DBXNative20261020&env=LOCAL&cluster=default');
  await reference.locator('.namespace-view-table table').filter({ hasText: 'native.acceptance' }).first().waitFor();
  await reference.waitForLoadState('networkidle');
  await reference.evaluate(async () => { await document.fonts.ready; });
  const viewport = sdk.viewportSize();
  await sdk.setViewportSize({ width: viewport.width + 1, height: viewport.height + 1 });
  await sdk.setViewportSize(viewport);
  await native.locator('.config-table').first().waitFor();
  if (await reference.locator('.namespace-view-table .search-input:visible').count() &&
    !await native.locator('[data-filter="application"]').isVisible())
    await native.locator('[data-action="filter-config"][data-ns="application"]').click();
  const table = reference.locator('.namespace-view-table table').filter({ hasText: 'native.acceptance' }).first();
  const actual = native.locator('[data-namespace="application"] .config-table');
  const measure = locator => locator.evaluateAll(elements => elements.map(e => {
    const r = e.getBoundingClientRect(), c = getComputedStyle(e);
    return { text: e.textContent.trim(), x: r.x, y: r.y, width: r.width, height: r.height,
      font: c.font, background: c.backgroundColor, padding: c.padding, whiteSpace: c.whiteSpace };
  }));
  const result = { scope: 'Real normal application table at aligned 1304x876, not all config/gray states',
    native: { table: await measure(actual), headers: await measure(actual.locator('thead th')),
      cells: await measure(actual.locator('tbody tr').first().locator('td')),
      actions: await measure(actual.locator('.config-icon')) },
    reference: { table: await measure(table), headers: await measure(table.locator('thead th')),
      cells: await measure(table.locator('tbody tr').first().locator('td')),
      actions: await measure(table.locator('tbody td:last-child img:visible')) } };
  await sdk.locator('iframe[title="Apollo"]').screenshot({ path: 'output/playwright/continue/native-config-current.png' });
  await reference.screenshot({ path: 'output/playwright/continue/reference-config-current.png' });
  return result;
}
