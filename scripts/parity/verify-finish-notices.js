async (page) => {
  const pages=page.context().pages(), sdk=pages.find(p=>p.url().startsWith('http://127.0.0.1:5198/')), ref=pages.find(p=>p.url().startsWith('http://127.0.0.1:18070/'));
  if(!sdk||!ref)throw Error('Owned loopback SDK and reference tabs required');
  sdk.setDefaultTimeout(8000);ref.setDefaultTimeout(8000);
  const frame=sdk.locator('iframe[title="Apollo"]'),f=frame.contentFrame(),results=[]; let nativeBox,referenceBox,nativeTitleFont,referenceTitleFont;
  const base='http://127.0.0.1:18070',ns='/apps/SampleApp/envs/DEV/clusters/default/namespaces/application';
  async function mode(value){const r=await page.request.post(base+'/fixture/scenario',{data:{mode:value}});if(!r.ok())throw Error('Fixture mode rejected '+value);}
  async function ready(){await f.locator('.loading').waitFor({state:'hidden'});}
  async function click(action,suffix=''){
    let control=f.locator(`[data-action="${action}"]${suffix}:visible`).first();
    if(!await control.count()){const hidden=f.locator(`[data-action="${action}"]${suffix}`).first(),details=hidden.locator('xpath=ancestor::details').first();if(await details.count())await details.locator('summary').click();control=f.locator(`[data-action="${action}"]${suffix}:visible`).first();}
    await control.click();await ready();
  }
  async function closeNative(){if(await f.locator('[role="dialog"]').count())await click('cancel-dialog');}
  async function config(){await sdk.bringToFront();await sdk.setViewportSize({width:1180,height:960});await closeNative();await click('home');await click('open-project');}
  async function reload(){await sdk.bringToFront();await sdk.getByRole('button',{name:/重载页面/}).click();await sdk.getByRole('button',{name:'确认',exact:true}).click();await f.locator('.apollo-nav').waitFor();await ready();}
  async function refGo(gray=false){await ref.bringToFront();await ref.setViewportSize({width:1084,height:876});await ref.goto(base+'/config.html?notice='+Date.now()+'#/appid=SampleApp&env=DEV&cluster=default&namespace=application&clusterName=default&namespaceName=application');await ref.waitForLoadState('networkidle');const switcher=ref.locator(`[ng-click="${gray?"switchBranch(namespace.branchName, true)":"switchBranch('master', true)"}"]:visible`);if(await switcher.count())await switcher.click();}
  async function refClick(expression){await ref.locator(`[ng-click="${expression}"]:visible`).first().click();}
  async function nativeViewport(){
    let width=1500,height=960;
    for(let i=0;i<4;i++){await sdk.setViewportSize({width,height});const box=await frame.boundingBox();const dx=1304-Math.round(box.width),dy=876-Math.round(box.height);if(!dx&&!dy)return;width+=dx;height+=dy;}
    throw Error('Cannot align native inner viewport');
  }
  async function nativeCap(id){await f.locator('[role="dialog"]').waitFor();await nativeViewport();const frameBox=await frame.boundingBox();await sdk.mouse.move(frameBox.x+10,frameBox.y+frameBox.height-10);await frame.screenshot({path:`output/playwright/finish/native-dialog-${id}.png`,animations:'disabled'});const text=await f.locator('[role="dialog"]').innerText();nativeTitleFont=await f.locator('[role="dialog"] h2').evaluate(el=>getComputedStyle(el).font);nativeBox=await f.locator('[role="dialog"]').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});await sdk.setViewportSize({width:1180,height:960});return text;}
  async function refCap(id){await ref.locator('.modal.in').first().waitFor();await ref.setViewportSize({width:1304,height:876});await ref.waitForFunction(()=>[...document.querySelectorAll('.modal.in')].every(el=>getComputedStyle(el).opacity==='1'&&[...el.querySelectorAll('.modal-dialog')].every(dialog=>['none','matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(dialog).transform))));if(await ref.locator('.toast').count())await ref.locator('.toast').first().waitFor({state:'hidden',timeout:6500});await ref.mouse.move(10,860);await ref.screenshot({path:`output/playwright/finish/reference-dialog-${id}.png`,animations:'disabled'});const text=await ref.locator('.modal.in').first().innerText();referenceTitleFont=await ref.locator('.modal.in .modal-title').first().evaluate(el=>getComputedStyle(el).font);referenceBox=await ref.locator('.modal.in .modal-dialog').first().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});await ref.setViewportSize({width:1084,height:876});return text;}
  async function pair(id,fixture,native,original){try{await mode(fixture);await native();const nativeText=await nativeCap(id);await closeNative();await original();const referenceText=await refCap(id);const normalize=value=>value.replace(/[\s×]/g,'');const copyEqual=normalize(nativeText)===normalize(referenceText);results.push({id,fixture,nativeText,referenceText,nativeBox,referenceBox,nativeTitleFont,referenceTitleFont,fontEqual:nativeTitleFont===referenceTitleFont,copyEqual,...(!copyEqual?{error:'Dialog copy differs'}:{})});}catch(error){results.push({id,fixture,error:error.message,nativeBody:(await f.locator('body').innerText()).slice(-1200),referenceControls:await ref.locator('[ng-click]:visible').evaluateAll(els=>els.map(el=>el.getAttribute('ng-click')))});await closeNative().catch(()=>{});}}
  await mode('normal'); await reload();
  const fixtureHeaders={cookie:'SESSION=fixture-session'};
  async function freshBranch(){await page.request.delete(base+ns+'/branches/gray-1',{headers:fixtureHeaders});const r=await page.request.post(base+ns+'/branches',{headers:fixtureHeaders,data:{}});if(!r.ok())throw Error('Controlled branch setup failed');}
  await page.request.delete(base+ns+'/branches/gray-1',{headers:fixtureHeaders});
  await pair('createBranchTips','normal',async()=>{await config();await click('gray');await click('create-gray');},async()=>{await refGo();await refClick('preCreateBranch(namespace)');});
  await pair('updateRuleTips','normal',async()=>{
    await freshBranch();await config();await click('gray');await click('gray-tab','[data-tab="rules"]');await click('gray-add-rule');
    await f.locator('[name="newLabels"]').fill('canary');await click('gray-rule-add-label');await f.locator('[role="dialog"] [data-action="submit-form"]').click();await f.locator('[data-dialog-source="updateRuleTips"]').waitFor();
  },async()=>{
    await freshBranch();await refGo(true);await refClick("switchView(namespace.branch, 'rule')");await refClick('addRuleItem(namespace.branch)');
    await ref.locator('#rulesModal [ng-model="toAddLabels"]').fill('canary');await refClick('batchAddLabels(branch, toAddLabels)');await refClick('completeEditItem(branch)');await ref.locator('#updateRuleTips.modal.in').waitFor();
  });
  await pair('grayReleaseWithoutRulesTips','normal',async()=>{
    await freshBranch();await config();await click('gray');await click('gray-publish');await f.locator('[name="title"]').fill('No rules');await f.locator('[role="dialog"] [data-action="submit-form"]').click();await f.locator('[data-dialog-source="grayReleaseWithoutRulesTips"]').waitFor();
  },async()=>{
    await freshBranch();await refGo(true);await refClick('publish(namespace.branch)');await ref.locator('#releaseModal [name="releaseName"]').fill('No rules');await ref.locator('#releaseModal [type="submit"]').click();await ref.locator('#grayReleaseWithoutRulesTips.modal.in').waitFor();
  });
  await pair('warning','normal',async()=>{await config();await click('project-settings');await click('app-remove-admin');},async()=>{
    await ref.goto(base+'/app/setting.html?#/appid=SampleApp');
    for(let attempt=0;attempt<3;attempt++){
      await ref.waitForLoadState('networkidle');await refClick('removeMasterRoleFromUser(user.userId)');await ref.locator('#warning.modal.in').waitFor();
      if(!(await ref.locator('#warning').innerText()).includes('ApolloConfirmDialog.DefaultConfirmBtnName'))break;
      await ref.reload();
    }
  });
  await pair('namespaceLockedDialog','locked',async()=>{await config();await click('edit-item');},async()=>{await refGo();await refClick('editItem(namespace, config.item)');});
  await pair('releaseNoPermissionDialog','modify-only',async()=>{await reload();await config();await click('publish');},async()=>{await refGo();await refClick('publish(namespace)');});
  await pair('modifyNoPermissionDialog','no-permissions',async()=>{await reload();await config();await click('request-modify-permission');},async()=>{await refGo();await refClick('showNoModifyPermissionDialog()');});
  await pair('masterNoPermissionDialog','no-master',async()=>{await reload();await config();await click('request-master-permission');},async()=>{await refGo();if(!await ref.locator('[ng-click="showMasterPermissionTips()"]:visible').count())await refClick('showSideBar = !showSideBar');await refClick('showMasterPermissionTips()');});
  await mode('normal');await reload();
  await pair('publishDenyModal','self-lock',async()=>{await config();await click('publish');},async()=>{await refGo();await refClick('publish(namespace)');});
  await pair('emergencyPublishAlertDialog','self-lock',async()=>{await config();await click('publish');await f.locator('[role="dialog"] [data-action="submit-form"]').click();},async()=>{await refGo();await refClick('publish(namespace)');await ref.locator('#publishDenyModal .modal-footer .btn-danger').click();});
  await pair('syntaxCheckFailedDialog','syntax-error',async()=>{await config();await click('edit-text');await click('syntax-text');},async()=>{await refGo();await refClick('toggleTextEditStatus(namespace)');await refClick('syntaxCheck(namespace)');});
  for(const scenario of ['usage-master','usage-gray'])await pair('deleteNamespaceModal-'+scenario,scenario,async()=>{await config();await click('namespace-delete');},async()=>{await refGo();await ref.locator('.dropdown-toggle:visible').last().click();await refClick('deleteNamespace(namespace)');});
  await mode('normal');await config();await click('gray');
  if(await f.locator('[data-action="create-gray"]').count()){
    await click('create-gray');await f.locator('[role="dialog"] [data-action="submit-form"]').click();await f.locator('[data-action="home"]:not([disabled])').waitFor();await ready();
  }
  await pair('mergeAndReleaseDenyDialog','master-pending',async()=>{await config();await click('gray');await click('gray-merge');},async()=>{await refGo(true);await refClick('mergeAndPublish(namespace.branch)');});
  await mode('normal');await config();
  return {results,passed:results.filter(result=>!result.error).length,failed:results.filter(result=>result.error).length,controlledFixture:true};
}
