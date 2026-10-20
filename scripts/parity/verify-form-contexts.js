async (page) => {
  const sdk=page.context().pages().find(p=>p.url().startsWith('http://127.0.0.1:5198/'));
  const iframe=sdk.locator('iframe[title="Apollo"]'),native=iframe.contentFrame(),checks=[];
  async function click(action){await native.locator(`[data-action=${action}]`).first().click();await native.locator('.loading').waitFor({state:'hidden'});}
  async function language(locale){await native.locator('.apollo-nav details').filter({hasText:'Language'}).locator('summary').click();await native.locator(`[data-action=language][data-locale="${locale}"]`).click();}
  await sdk.bringToFront();await sdk.setViewportSize({width:1501,height:1101});await sdk.setViewportSize({width:1500,height:1100});
  await sdk.getByRole('button',{name:/重载页面/}).click();await sdk.getByRole('button',{name:'确认',exact:true}).click();await native.locator('.apollo-nav').waitFor();await native.locator('.loading').waitFor({state:'hidden'});
  await click('home');await click('new-project');
  for(const [name,value] of [['appId','context-draft'],['name','Context draft']])await native.locator(`input[name=${name}]`).fill(value);
  await native.locator('select[name=orgId]').selectOption('TEST1');
  const owner=native.locator('[data-user-picker=ownerName] .user-picker-input');await owner.fill('apollo');
  await native.locator('[data-user-picker=ownerName] [data-user-id=apollo]').click();
  await language('en');
  checks.push({id:'english-retains-unsaved-fields-and-owner',passed:await native.locator('input[name=appId]').inputValue()==='context-draft'&&await native.locator('input[name=name]').inputValue()==='Context draft'&&await native.locator('input[name=ownerName]').inputValue()==='apollo'});
  const label=await native.locator('input[name=ownerName]').getAttribute('aria-label');
  if(await sdk.getByRole('button',{name:'深色主题',exact:true}).count())await sdk.getByRole('button',{name:'深色主题',exact:true}).click();
  await native.locator('input[name=ownerName]').waitFor();
  checks.push({id:'theme-only-env-keeps-explicit-ui-language',passed:await native.locator('input[name=ownerName]').getAttribute('aria-label')===label});
  const background=await native.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
  checks.push({id:'dark-host-keeps-source-light-portal',passed:background==='rgb(241, 242, 247)',background});
  await iframe.screenshot({path:'output/playwright/polish/native-form-english-dark-host.png'});
  await sdk.setViewportSize({width:391,height:961});await sdk.setViewportSize({width:390,height:960});
  const size=await native.locator('body').evaluate(el=>({scrollWidth:el.scrollWidth,viewport:innerWidth}));
  checks.push({id:'narrow-host-retains-desktop-layout-and-draft',passed:size.scrollWidth>=960&&await native.locator('input[name=appId]').inputValue()==='context-draft',size});
  await iframe.screenshot({path:'output/playwright/polish/native-form-narrow-host.png'});
  await sdk.setViewportSize({width:1501,height:1101});await sdk.setViewportSize({width:1500,height:1100});
  if(await sdk.getByRole('button',{name:'浅色主题',exact:true}).count())await sdk.getByRole('button',{name:'浅色主题',exact:true}).click();
  await language('zh-CN');
  checks.push({id:'return-to-chinese-retains-draft',passed:await native.locator('input[name=appId]').inputValue()==='context-draft'&&await native.locator('input[name=ownerName]').inputValue()==='apollo'});
  const errors=await native.locator('.notice.error').allTextContents();
  return {checks,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,errors,scope:'Representative actual SDK language/theme/narrow form states, not every page at every viewport'};
}
