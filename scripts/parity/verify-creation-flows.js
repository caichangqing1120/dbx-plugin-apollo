async (page) => {
  const sdk=page.context().pages()[0], reference=page.context().pages()[1];
  const iframe=sdk.locator('iframe[title="Apollo"]'), native=iframe.contentFrame(), checks=[];
  async function ready(){await native.locator('.loading').waitFor({state:'hidden'});}
  async function click(action){const control=native.locator(`[data-action="${action}"]`).first();if(!await control.isVisible()){const menu=control.locator('xpath=ancestor::details').first();if(await menu.count())await menu.locator('summary').click();}await control.click();await ready();}
  async function align(){let width=1500,height=960;for(let i=0;i<4;i++){await sdk.setViewportSize({width,height});const b=await iframe.boundingBox(),dx=1304-Math.round(b.width),dy=876-Math.round(b.height);if(!dx&&!dy)return;width+=dx;height+=dy;}}
  async function open(action){await sdk.bringToFront();await sdk.setViewportSize({width:1500,height:1100});await click('home');await click('open-project');await click(action);await align();}
  await sdk.getByRole('button',{name:/重载页面/}).click();await sdk.getByRole('button',{name:'确认',exact:true}).click();await native.locator('.apollo-nav').waitFor();await ready();
  await open('new-namespace');
  await reference.setViewportSize({width:1304,height:876});
  await reference.goto('http://127.0.0.1:18070/namespace.html?#/appid=SampleApp&env=DEV&cluster=default');await reference.waitForLoadState('networkidle');
  for(const [root,name] of [[native,'name'],[reference,'namespaceName']]){
    await root.locator(`input[name=${name}]`).fill('metrics');await root.locator('textarea[name=comment]').fill('retained draft');await root.locator('select[name=format]').selectOption('json');
  }
  await native.locator('input[name=namespaceType][value=public]').check();
  await reference.locator('input[name=namespaceType][value=true]').check();
  await reference.locator('.input-group-addon:visible').waitFor();
  const nativePrefix=await native.locator('[data-namespace-prefix]').innerText(),referencePrefix=await reference.locator('.input-group-addon:visible').innerText();
  checks.push({id:'public-department-prefix',passed:nativePrefix===referencePrefix&&nativePrefix==='TEST1.',native:nativePrefix,reference:referencePrefix});
  await iframe.screenshot({path:'output/playwright/polish/native-namespace-public.png'});await reference.screenshot({path:'output/playwright/polish/reference-namespace-public.png'});
  await native.locator('input[name=appendPrefix]').uncheck();await reference.locator('[ng-model=appendNamespacePrefix]').uncheck();
  checks.push({id:'prefix-toggle-hides-addon',passed:await native.locator('[data-namespace-prefix]').count()===0&&!await reference.locator('.input-group-addon').isVisible()});
  checks.push({id:'prefix-toggle-retains-draft',passed:await native.locator('input[name=name]').inputValue()==='metrics'&&await native.locator('textarea[name=comment]').inputValue()==='retained draft'&&await native.locator('select[name=format]').inputValue()==='json'});
  await iframe.screenshot({path:'output/playwright/polish/native-namespace-no-prefix.png'});await reference.screenshot({path:'output/playwright/polish/reference-namespace-no-prefix.png'});
  await open('new-cluster');
  await native.locator('input[name=name]').fill('polish-native-created');await native.locator('input[name=env_DEV]').check();
  await native.locator('[data-submit-action=cluster-create-submit] [data-action=submit-form]').click();await ready();await native.locator('[data-creation-complete]').waitFor();
  checks.push({id:'cluster-success-stays-visible-without-resubmission',passed:await native.locator('[data-submit-action=cluster-create-submit]').count()===0&&/创建成功/.test(await native.locator('[data-creation-complete]').innerText())});
  await reference.goto('http://127.0.0.1:18070/cluster.html?#/appid=SampleApp');await reference.waitForLoadState('networkidle');
  await reference.locator('input[name=clusterName]').fill('polish-reference-created');await reference.locator('tr:has-text("DEV") input[type=checkbox]').check();
  await reference.locator('form[name=clusterForm] button[type=submit]').click();await reference.locator('.panel-body > .row.text-center').waitFor({state:'visible'});
  await reference.locator('.toast').waitFor({state:'hidden'});
  const inspect=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,text:el.innerText};};
  const nativeState=await native.locator('[data-creation-complete]').evaluate(inspect),referenceState=await reference.locator('.panel-body > .row.text-center').evaluate(inspect);
  const nativeTitle=await native.locator('[data-creation-complete] h3').evaluate(inspect),referenceTitle=await reference.locator('.panel-body > .row.text-center h3').evaluate(inspect);
  checks.push({id:'cluster-created-title-matches-source',passed:nativeTitle.text===referenceTitle.text&&nativeTitle.font===referenceTitle.font,native:nativeTitle,reference:referenceTitle});
  checks.push({id:'cluster-created-panel-geometry',passed:['x','y','width','height'].every(key=>Math.abs(nativeState[key]-referenceState[key])<.1),native:nativeState,reference:referenceState});
  await iframe.screenshot({path:'output/playwright/polish/native-cluster-created.png'});await reference.screenshot({path:'output/playwright/polish/reference-cluster-created.png'});
  await open('new-cluster');checks.push({id:'cluster-create-new-visit-resets-success',passed:await native.locator('[data-submit-action=cluster-create-submit]').count()===1});
  const errors=await native.locator('.notice.error').allTextContents();
  return {checks,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,errors,scope:'Controlled loopback creation/prefix state flows; not real Apollo acceptance'};
}
