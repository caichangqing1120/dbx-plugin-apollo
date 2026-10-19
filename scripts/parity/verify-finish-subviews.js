async (page) => {
  const frame = page.locator('iframe[title="Apollo"]'), f = frame.contentFrame(), results = [];
  async function click(action, suffix = '') {
    let el = f.locator(`[data-action="${action}"]${suffix}:visible`).first();
    if (!(await el.count())) {
      const hidden = f.locator(`[data-action="${action}"]${suffix}`).first();
      const details = hidden.locator('xpath=ancestor::details').first();
      if (await details.count()) await details.locator('summary').click();
      el = f.locator(`[data-action="${action}"]${suffix}:visible`).first();
    }
    await el.click(); await f.locator('.loading').waitFor({ state: 'hidden' });
  }
  async function cap(id) { let width=1500,height=960;for(let i=0;i<4;i++){await page.setViewportSize({width,height});const box=await frame.boundingBox();const dx=1304-Math.round(box.width),dy=876-Math.round(box.height);if(!dx&&!dy)break;width+=dx;height+=dy;}  await frame.screenshot({ path: `output/playwright/finish/native-${id}.png` }); await page.setViewportSize({ width: 1180, height: 960 }); }
  async function config() { await click('home'); await click('open-project'); await click('table-mode'); }
  await page.setViewportSize({ width: 1180, height: 960 });
  await config(); await click('diff');
  await f.locator('[data-sync-target][data-env="UAT"]').check(); await click('sync-preview');
  if (!(await f.locator('body').innerText()).includes('sample.key')) throw Error('Missing comparison union key');
  await cap('diff-table-step2'); results.push('table comparison second step');
  await click('sync-back'); await f.locator('[name="compareMode"][value="text"]').check(); await click('sync-preview');
  if (!(await f.locator('.text-comparison').innerText()).includes('UAT')) throw Error('Missing text comparison target');
  await cap('diff-text-step2'); results.push('text comparison second step');
  await config(); await click('sync');
  await f.locator('[data-sync-target][data-env="UAT"]').check(); await f.locator('[data-sync-item]').first().check(); await click('sync-preview');
  if (await f.locator('[data-action="sync-apply"]').isDisabled()) throw Error('Sync preview did not become actionable');
  await cap('sync-step2'); results.push('sync preview second step without applying');
  await config();
  const language = f.locator('.nav-language-menu'); await language.locator('summary').click(); await click('language', '[data-locale="en"]'); await cap('config-en');
  if (!(await f.locator('body').innerText()).includes('Publish')) throw Error('English controls missing');
  await language.locator('summary').click(); await click('language', '[data-locale="zh-CN"]');
  const dark = page.getByRole('button', { name: '深色主题', exact: true }); await dark.click(); await cap('config-dark-host');
  await page.getByRole('button', { name: '浅色主题', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'output/playwright/finish/narrow-host.png' });
  await page.setViewportSize({ width: 1180, height: 960 });
  results.push('English/Chinese, light/dark host, 390px host with original desktop scrolling');
  return results;
}
