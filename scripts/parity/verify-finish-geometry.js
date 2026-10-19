async (page) => {
  const [sdk,ref]=page.context().pages(),frame=sdk.locator('iframe[title="Apollo"]'),f=frame.contentFrame(),results=[];
  async function size(){let width=1500,height=960;for(let i=0;i<4;i++){await sdk.setViewportSize({width,height});const box=await frame.boundingBox(),dx=1304-Math.round(box.width),dy=876-Math.round(box.height);if(!dx&&!dy)return;width+=dx;height+=dy;}throw Error('Inner viewport mismatch');}
  async function click(action){await f.locator(`[data-action="${action}"]`).first().click();await f.locator('.loading').waitFor({state:'hidden'});}
  async function bounds(root,selector){return root.locator(selector).first().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});}
  await sdk.getByRole('button',{name:/重载页面/}).click();await sdk.getByRole('button',{name:'确认',exact:true}).click();await f.locator('.apollo-nav').waitFor();await f.locator('.loading').waitFor({state:'hidden'});
  for(const [source,action] of [['app.html','new-project'],['app/setting.html','project-settings']]){
    await sdk.setViewportSize({width:1180,height:960});await click('home');if(action==='project-settings')await click('open-project');await click(action);await size();
    await ref.setViewportSize({width:1304,height:876});await ref.goto('http://127.0.0.1:18070/'+source+'?#/appid=SampleApp');await ref.waitForLoadState('networkidle');
    const native={panel:await bounds(f,'.reference-surface'),heading:await bounds(f,'.reference-heading'),footer:await bounds(f,'.apollo-footer')};
    const reference={panel:await bounds(ref,'.panel'),heading:await bounds(ref,'.panel-heading'),footer:await bounds(ref,'.footer')};
    const differences=[];
    for(const [part,properties] of [['panel',['x','y','width']],['heading',['x','y','width','height']],['footer',['y']]])for(const property of properties){const delta=native[part][property]-reference[part][property];if(Math.abs(delta)>.5)differences.push({part,property,delta});}
    results.push({source,native,reference,differences});
  }
  await sdk.setViewportSize({width:1180,height:960});await click('home');await click('open-project');
  return {results,passed:results.filter(r=>!r.differences.length).length,failed:results.filter(r=>r.differences.length).length,scope:'Common page-frame geometry only, not pixel or full-content acceptance'};
}
