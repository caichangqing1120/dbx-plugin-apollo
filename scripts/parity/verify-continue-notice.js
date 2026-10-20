async (page) => {
  const sdk = page.context().pages().find(p => p.url().startsWith('http://127.0.0.1:5198'));
  const native = sdk.locator('iframe[title="Apollo"]').contentFrame();
  const viewport = sdk.viewportSize();
  await sdk.setViewportSize({ width: viewport.width + 1, height: viewport.height + 1 });
  await sdk.setViewportSize(viewport);
  await native.locator('[data-action="favorite-project"]').click();
  const notice = native.locator('.notice.success');
  await notice.waitFor();
  const filter = native.locator('[data-filter="application"]');
  if (!await filter.isVisible()) {
    await native.locator('[data-action="filter-config"][data-ns="application"]').click();
    // Opening a new action deliberately clears stale feedback; create a fresh success.
    await native.locator('[data-action="favorite-project"]').click();
    await notice.waitFor();
  }
  const shownAt = Date.now();
  await filter.fill('native');
  await filter.click();
  await filter.press('ArrowLeft');
  const handle = await filter.elementHandle();
  const before = await handle.evaluate(el => ({ value: el.value, start: el.selectionStart, end: el.selectionEnd }));
  await notice.waitFor({ state: 'hidden', timeout: 7000 });
  const after = await handle.evaluate(el => ({ value: el.value, start: el.selectionStart, end: el.selectionEnd,
    connected: el.isConnected, focused: document.activeElement === el }));
  const autoClosed = Date.now() - shownAt;
  await sdk.locator('iframe[title="Apollo"]').screenshot({ path: 'output/playwright/continue/native-success-auto-closed.png' });
  await native.locator('[data-action="reset-items"][data-ns="application"]').click();
  await native.locator('[data-action="favorite-project"]').click();
  await notice.waitFor();
  await native.locator('[data-action="new-item"][data-ns="application"]').click();
  await native.locator('[role="dialog"]').waitFor();
  const staleClearedOnDialog = await notice.count() === 0;
  await native.locator('[role="dialog"] [data-action="cancel-dialog"]').first().click();
  return { scope: 'Real Apollo SDK host; favorite writes only on the local test app; no item writes',
    autoClosedAfterMs: autoClosed, before, after,
    filterNodeAndFocusPreserved: after.connected && after.focused && before.value === after.value &&
      before.start === after.start && before.end === after.end,
    staleClearedOnDialog };
}
