async (page) => {
  const sdk = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:5198'));
  const reference = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:8070'));
  const iframe = sdk.locator('iframe[title="Apollo"]'), native = iframe.contentFrame();
  await sdk.setViewportSize({ width: 1501, height: 1101 });
  await sdk.setViewportSize({ width: 1500, height: 1100 });
  let size = { width: 1500, height: 1100 };
  for (let i = 0; i < 4; i++) {
    const box = await iframe.boundingBox();
    const dx = 1304 - Math.round(box.width), dy = 876 - Math.round(box.height);
    if (!dx && !dy) break;
    size = { width: size.width + dx, height: size.height + dy };
    await sdk.setViewportSize(size);
  }
  await reference.setViewportSize({ width: 1305, height: 877 });
  await reference.setViewportSize({ width: 1304, height: 876 });
  await native.locator('body').evaluate(async () => { await document.fonts.ready; });
  await reference.evaluate(async () => { await document.fonts.ready; });
  const measure = locator => locator.evaluateAll(elements => elements.map(element => {
    const b = element.getBoundingClientRect(), c = getComputedStyle(element);
    return { text: element.textContent.trim(), x: b.x, y: b.y, width: b.width,
      height: b.height, font: c.font, margin: c.margin, padding: c.padding,
      border: c.border, display: c.display, background: c.backgroundColor };
  }));
  const pairs = [
    ['search', '[data-app-search],.app-search', '.app-search-list .select2-container'],
    ['cluster-page', '.clusters-page>.reference-surface', '.project-setting>section.panel'],
    ['page-header', '.clusters-page .reference-heading', '.project-setting>section.panel>.panel-heading'],
    ['environment', '.clusters-page .reference-section>h4,.reference-cluster-group>h4', '.context>section>h4'],
    ['cluster-row', '.reference-cluster-card', '.cluster-info-panel'],
    ['cluster-label', '.reference-cluster-card strong', '.cluster-info-panel .namespace-name'],
    ['cluster-action', '.reference-cluster-card [data-action="cluster-roles"]', '.cluster-info-panel .header-buttons a'],
  ];
  const rows = [];
  for (const [name, actual, expected] of pairs) {
    const a = await measure(native.locator(actual));
    const e = await measure(reference.locator(expected));
    rows.push({ name, native: a, reference: e });
  }
  await sdk.locator('iframe[title="Apollo"]').screenshot({ path: 'output/playwright/continue/native-clusters-current.png' });
  await reference.screenshot({ path: 'output/playwright/continue/reference-clusters-current.png' });
  return { scope: 'Real Apollo data; selected normal search/cluster-management geometry, not whole-page acceptance', rows };
}
