const fs=require('fs'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,lang] of [[390,650,'zh-CN'],[320,568,'zh-CN'],[390,844,'zh-CN'],[320,568,'en'],[390,650,'de']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});
  await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.adventureUI==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());g.screen='adventure';g.render();});
  for(let map=0;map<9;map++){
   await page.waitForTimeout(210);const control=await page.evaluate(id=>__pm.controls()['map-'+id],map);assert(control);await page.touchscreen.tap(control.x*width/390,control.y*width/390);await page.waitForTimeout(220);await page.waitForFunction(()=>!g.artCache.pending&&!g.pressPending);
   const boxes=await page.evaluate(()=>{const list=[];function walk(n){if(/^map-(pet-|types$|note$)/.test(n.name)){const r=n.getComponent(cc.UITransform).getBoundingBoxToWorld();list.push({name:n.name,x:r.x,y:r.y,w:r.width,h:r.height});}n.children.forEach(walk);}walk(g.root);return list;});assert.equal(boxes.length,14);
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j],dx=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),dy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);assert(!(dx>1&&dy>1),`${width}x${height} ${lang} map ${map+1}: ${a.name} overlaps ${b.name}`);}
   if(map===8)await page.screenshot({path:`checks/map-layout-${width}x${height}-${lang}.png`});
  }
  assert.deepEqual(errors,[]);await ctx.close();
 }
 console.log('PASS 9 maps at 390x650 / 320x568 / 390x844, English and German; images, names, types and note never overlap; real map buttons tested; isolated saves');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
