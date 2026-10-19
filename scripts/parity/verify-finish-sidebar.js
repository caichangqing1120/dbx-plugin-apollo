async page=>{
  const sdk=page.context().pages().find(tab=>tab.url().startsWith('http://127.0.0.1:5198/')),f=sdk.locator('iframe[title="Apollo"]').contentFrame(),results=[];
  await sdk.setViewportSize({width:1180,height:960});
  await f.locator('[data-action=home]').click();await f.locator('.loading').waitFor({state:'hidden'});await f.locator('[data-action=open-project]').click();await f.locator('.loading').waitFor({state:'hidden'});
  for(const width of [1180,1500,390]){
    await sdk.setViewportSize({width,height:960});
    for(const action of ['project-settings','access-keys','clusters','new-cluster','new-namespace']){
      const control=f.locator(`.project-links [data-action="${action}"]`).first();await control.scrollIntoViewIfNeeded();
      const hit=await control.evaluate(el=>{const r=el.getBoundingClientRect(),node=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {expected:el.dataset.action,actual:node?.closest('[data-action]')?.dataset.action,blocking:node?.tagName};});
      results.push({width,...hit,passed:hit.expected===hit.actual});
    }
  }
  await sdk.setViewportSize({width:1180,height:960});
  return {results,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length};
}
