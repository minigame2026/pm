/* Twelve-map navigation and readable previews; independent profiles, no player save changes. */
const fs=require('fs'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const out='checks/map-layout',now=Date.now();fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,lang] of [[390,650,'zh-CN'],[320,568,'zh-CN'],[390,844,'zh-CN'],[320,568,'en'],[390,650,'de'],[320,568,'ar'],[320,568,'ru'],[320,568,'ta']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.adventureUI==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());g.clockSaveAt=Infinity;
   globalThis.findNode=(id,n=g.root)=>n.name===id?n:n.children.map(c=>findNode(id,c)).find(Boolean);
   globalThis.rect=n=>{const t=n.getComponent(cc.UITransform),p=n.worldPosition,s=n.worldScale,w=t.width*Math.abs(s.x),h=t.height*Math.abs(s.y);return {name:n.name,x:p.x-w*t.anchorX,y:p.y-h*t.anchorY,w,h};};
   g.screen='adventure';g.render();});
  const idle=async()=>{await page.waitForFunction(()=>!g.artCache.pending&&!g.pressPending&&!g.busy);await page.waitForTimeout(240);};
  const tap=async id=>{await idle();const c=await page.evaluate(id=>__pm.controls()[id],id);assert(c,'missing '+id);await page.touchscreen.tap(c.x*width/390,c.y*width/390);await idle();};
  const nonOverlapping=(boxes,where)=>{for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j],dx=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),dy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);assert(!(dx>1&&dy>1),`${width}x${height} ${lang} ${where}: ${a.name} overlaps ${b.name}`);}};
  const checkTabs=async prefix=>{const tabs=await page.evaluate(prefix=>Array.from({length:12},(_,i)=>{const n=findNode(prefix+'-'+i);return n?rect(n):null;}),prefix);assert(tabs.every(Boolean),prefix+' has all twelve maps');const rows=new Map();for(const r of tabs){const key=Math.round(r.y);rows.set(key,(rows.get(key)||0)+1);assert(r.x>=0&&r.x+r.w<=390);}assert.deepEqual([...rows.values()],[6,6],prefix+' is fixed two rows of six');nonOverlapping(tabs,prefix);return tabs;};
  await idle();await checkTabs('map');assert.deepEqual(await page.evaluate(()=>Array.from({length:12},(_,i)=>g.sceneRegion(i))),[0,1,2,3,4,5,3,4,5,3,4,5],'existing scene assets reused for maps 10–12');
  const maps=['ar','ru','ta'].includes(lang)?[9,10,11]:Array.from({length:12},(_,i)=>i);
  for(const map of maps){
   await tap('map-'+map);assert.equal(await page.evaluate(()=>g.mapIndex),map);
   const boxes=await page.evaluate(()=>{const list=[];function walk(n){if(/^map-(pet-|types$|note$|title$|stage-count$)/.test(n.name))list.push(rect(n));n.children.forEach(walk);}walk(g.root);return list;});assert.equal(boxes.length,16);nonOverlapping(boxes,'map '+(map+1));
   const title=await page.evaluate(()=>{const l=findNode('map-title').getComponent(cc.Label);return {text:l.string,font:l.actualFontSize||l.fontSize};});assert(title.font>=12,`${lang} map ${map+1} title unreadable: ${JSON.stringify(title)}`);
   if(map===11)await page.screenshot({path:`${out}/${width}x${height}-${lang}-adventure.png`});
  }
  const before=await page.evaluate(()=>JSON.stringify(g.state));await page.evaluate(()=>g.pokedexUI());await idle();
  const tabs=await checkTabs('dex-map');const all=await page.evaluate(()=>rect(findNode('dex-map-all')));assert(all.y>Math.max(...tabs.map(t=>t.y+t.h)),'all filter is separate in header');
  for(const id of [0,5,6,11]){await tap('dex-map-'+id);assert.equal(await page.evaluate(()=>g.dexMap),id);}
  const dexBoxes=await page.evaluate(()=>{const ids=['dex-type','dex-owned','dex-friends','dex-shiny'],boxes=ids.map(id=>rect(findNode(id)));for(const id of Object.keys(__pm.controls()).filter(id=>id.startsWith('dex-pet-')))boxes.push(rect(findNode(id)));return boxes;});assert.equal(dexBoxes.length,10,'four filters and six cards');nonOverlapping([...tabs,...dexBoxes],'dex filters/cards');
  await page.screenshot({path:`${out}/${width}x${height}-${lang}-dex.png`});await tap('dex-map-all');assert.equal(await page.evaluate(()=>g.dexMap),-1);assert.equal(await page.evaluate(()=>JSON.stringify(g.state)),before,'navigation does not change game save');
  assert.deepEqual(errors,[]);console.log(`PASS map/dex 12 maps 2×6, all filter, geometry and untouched save: ${width}x${height} ${lang}`);await ctx.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
