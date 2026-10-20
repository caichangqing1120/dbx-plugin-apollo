async (page) => {
  const sdk=page.context().pages().find(p=>p.url().startsWith('http://127.0.0.1:5198/'));
  const iframe=sdk.locator('iframe[title="Apollo"]'),native=iframe.contentFrame(),results=[];
  await page.request.post('http://127.0.0.1:18070/fixture/scenario',{data:{mode:'normal'}});
  await sdk.bringToFront();await sdk.setViewportSize({width:1501,height:1101});await sdk.setViewportSize({width:1500,height:1100});
  await sdk.getByRole('button',{name:/重载页面/}).click();await sdk.getByRole('button',{name:'确认',exact:true}).click();await native.locator('.apollo-nav').waitFor();await native.locator('.loading').waitFor({state:'hidden'});
  for(const action of ['home','open-project']){await native.locator(`[data-action=${action}]`).first().click();await native.locator('.loading').waitFor({state:'hidden'});}
  for(const width of [1500,1180,390]){
    await sdk.setViewportSize({width:width+1,height:961});await sdk.setViewportSize({width,height:960});
    const metrics=await native.locator('body').evaluate(()=>{
      const r=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};};
      return {sidebar:r('.project-sidebar'),layout:r('.project-layout'),footer:r('.apollo-footer'),main:r('.config-main')};
    });
    results.push({width,metrics,passed:metrics.layout.bottom+.1>=metrics.sidebar.bottom&&metrics.footer.y+.1>=metrics.sidebar.bottom});
  }
  return {results,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,scope:'Config sidebar/footer flow at three Host widths; no pixel-parity claim'};
}
