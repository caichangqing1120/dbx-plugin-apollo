async page=>{
  const [sdk,ref]=page.context().pages(),frame=sdk.locator('iframe[title="Apollo"]'),f=frame.contentFrame(),base='http://127.0.0.1:18070',checks=[];
  const assert=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
  async function click(action,suffix=''){await f.locator(`[data-action="${action}"]${suffix}`).first().click();await f.locator('.loading').waitFor({state:'hidden'});}
  async function size(){let width=1500,height=960;for(let i=0;i<4;i++){await sdk.setViewportSize({width,height});const box=await frame.boundingBox(),dx=1304-Math.round(box.width),dy=876-Math.round(box.height);if(!dx&&!dy)return;width+=dx;height+=dy;}}
  await sdk.getByRole('button',{name:/重载页面/}).click();await sdk.getByRole('button',{name:'确认',exact:true}).click();await f.locator('.apollo-nav').waitFor();await f.locator('.loading').waitFor({state:'hidden'});
  await sdk.setViewportSize({width:1180,height:960});await click('home');await click('open-project');await click('gray');
  assert((await f.locator('[data-gray-master]').innerText()).includes('Master inherited value'),'non-overridden master configuration appears in a separate inherited table');
  await size();await frame.screenshot({path:'output/playwright/finish/native-gray-inherited.png'});
  await ref.setViewportSize({width:1084,height:876});await ref.goto(base+'/config.html?inheritance='+Date.now()+'#/appid=SampleApp&env=DEV&cluster=default&namespace=application&clusterName=default&namespaceName=application');await ref.waitForLoadState('networkidle');await ref.locator('[ng-click="switchBranch(namespace.branchName, true)"]:visible').click();
  assert((await ref.locator('body').innerText()).includes('Master inherited value'),'the original renders the same inherited data before the override write');
  await ref.setViewportSize({width:1304,height:876});await ref.screenshot({path:'output/playwright/finish/reference-gray-inherited.png'});
  const before=(await(await page.request.get(base+'/fixture/calls')).json()).length;
  await sdk.setViewportSize({width:1180,height:960});await click('gray-edit-item','[data-inherited-key="inherit.key"]');await f.locator('[role="dialog"] [name="value"]').fill('Browser gray override');await f.locator('[role="dialog"] [data-action="submit-form"]').click();await f.locator('[data-action=home]:not([disabled])').waitFor();await f.locator('.loading').waitFor({state:'hidden'});
  const calls=(await(await page.request.get(base+'/fixture/calls')).json()).slice(before),writes=calls.filter(call=>['POST','PUT','DELETE'].includes(call.method));
  assert(writes.length===1&&writes[0].method==='POST'&&writes[0].path==='/apps/SampleApp/envs/DEV/clusters/gray-1/namespaces/application/item','inherited editing creates exactly one override in the gray branch, never the parent');
  await click('gray-delete-item','[data-key="inherit.key"]');
  assert(await f.locator('[data-dialog-source="deleteConfirmDialog"]').count()===1,'gray deletion uses the source key/value confirmation');
  await size();await frame.screenshot({path:'output/playwright/finish/native-gray-delete-item.png'});await click('cancel-dialog');
  return {checks,controlledFixture:true};
}
