async (page) => {
  const sdk = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:5198'));
  const reference = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:8070'));
  const iframe = sdk.locator('iframe[title="Apollo"]'), native = iframe.contentFrame();
  const errors = [], requests = [];
  const collect = response => {
    if (new URL(response.url()).pathname === '/apps/search/by-appid-or-name')
      requests.push({ path: new URL(response.url()).pathname, query: new URL(response.url()).search,
        status: response.status() });
  };
  reference.on('response', collect);
  const measure = locator => locator.evaluate(element => {
    const r = element.getBoundingClientRect(), c = getComputedStyle(element);
    return { x: r.x, y: r.y, width: r.width, height: r.height,
      font: c.font, padding: c.padding, border: c.border, color: c.color };
  });
  const states = [];
  try {
    await native.locator('[data-app-search-toggle]').click();
    await native.locator('[data-app-search-input]').fill('DBXNative');
    await native.locator('[role="option"]').filter({ hasText: 'DBXNative20261020' }).waitFor();
    await reference.locator('.app-search-list .select2-selection').click();
    await reference.locator('.select2-search__field').fill('DBXNative');
    await reference.locator('.select2-results__option[aria-selected]').filter({ hasText: 'DBXNative20261020' }).waitFor();
    await reference.locator('.select2-results__option.loading-results').waitFor({ state: 'hidden' });
    const pairs = [
      ['selection', '[data-app-search-toggle]', '.app-search-list .select2-selection'],
      ['dropdown', '[data-app-search-dropdown]', '.select2-dropdown'],
      ['query', '[data-app-search-input]', '.select2-search__field'],
      ['result', '[role="option"]', '.select2-results__option[aria-selected]'],
    ];
    for (const [name, actual, expected] of pairs) states.push({ name,
      native: await measure(native.locator(actual).first()),
      reference: await measure(reference.locator(expected).first()) });
    await sdk.locator('iframe[title="Apollo"]').screenshot({ path: 'output/playwright/continue/native-search-results.png' });
    await reference.screenshot({ path: 'output/playwright/continue/reference-search-results.png' });
    await native.locator('[data-app-search-input]').press('Escape');
    await reference.locator('.select2-search__field').press('Escape');
    const escapeClosed = await native.locator('[data-app-search-dropdown]').isHidden();
    await native.locator('[data-app-search-toggle]').click();
    await native.locator('[data-app-search-input]').fill('DBXNative20261020');
    await native.locator('[role="option"]').first().waitFor();
    await native.locator('[data-app-search-input]').press('Enter');
    await native.locator('[data-action="new-item"]').first().waitFor();
    const navigated = await native.locator('.project-info').textContent();
    return { scope: 'Real Apollo original/plugin normal autocomplete state and keyboard selection; no full-page claim',
      states, escapeClosed, selectedAppVisible: navigated.includes('DBXNative20261020'), requests, errors };
  } finally { reference.off('response', collect); }
}
