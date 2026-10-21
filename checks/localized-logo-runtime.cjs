const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),assert=require('node:assert/strict');
const locales=['zh-CN','en','ja','ko','zh-TW','th','pt-BR','es-419','id','vi','de','fr'];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const locale of locales){
   const context=await browser.newContext({viewport:{width:390,height:844},locale,isMobile:true,hasTouch:true});
   await context.addInitScript(locale=>localStorage.setItem('pm.language.v1',locale),locale);
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(cfg.url+'?logos=v1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
   await page.evaluate(async()=>{
    globalThis.cc=await System.import('cc');
    const find=n=>n.components.find(c=>typeof c.languageSettings==='function')||n.children.map(find).find(Boolean);
    globalThis.g=find(cc.director.getScene());
   });
   const key=locale==='zh-CN'?'login-title-v3':`login-title-${locale}-v1`;
   await page.waitForFunction(key=>!!g.root.getChildByName(key)?.getComponent(cc.Sprite)?.spriteFrame,key);
   for(const width of [390,320]){
    await page.setViewportSize({width,height:width===390?844:568});await page.waitForTimeout(250);
    const info=await page.evaluate(key=>{
     const n=g.root.getChildByName(key),t=n.getComponent(cc.UITransform),frame=n.getComponent(cc.Sprite).spriteFrame;
     return {width:t.width,height:t.height,ratio:frame.rect.width/frame.rect.height,y:n.position.y,top:g.h/2,
      logoKeys:Object.keys(g.artCache.frames).filter(k=>k.startsWith('login-title')),
      button:!!__pm.controls()['start-game']};
    },key);
    assert(info.button);assert(info.width<=368&&info.height<=148);
    assert(Math.abs(info.width/info.height-info.ratio)<.001,'no stretching');
    assert(info.y+info.height/2<=info.top,'logo inside viewport');
    assert.deepEqual(info.logoKeys,[key],'load only current language logo');
    await page.screenshot({path:`checks/logo-${locale}-${width}.png`});
   }
   // The existing start action remains interactive at narrow width.
   const button=await page.evaluate(()=>__pm.controls()['start-game']);
   await page.touchscreen.tap(button.x*320/390,button.y*320/390);
   await page.waitForFunction(()=>__pm.screen()==='hero');
   assert.deepEqual(errors,[]);console.log('PASS',locale,'image logo, aspect ratio, lazy loading, 390/320, start');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
