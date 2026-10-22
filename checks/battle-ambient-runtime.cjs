const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set});
const base=M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(17),'ranger'),'fox'),Date.now());base.clearedMaps=[0,1,2,3,4,5,6,7,8];
const themes=['leaf','ember','snow','petal','spark','star','rain','sand','spirit'];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.goto(cfg.url+'?battle-ambient=1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
 await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const g=n.components.find(c=>typeof c.loadRegionArt==='function');if(g)return g;for(const ch of n.children){const g=walk(ch);if(g)return g;}}globalThis.g=walk(cc.director.getScene());});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:width===390?844:568});await page.waitForTimeout(200);
  for(let id=0;id<9;id++){
   let s=M.startMap(base,id,17);s=M.act(s,'challenge');s.expedition=true;
   await page.evaluate(async s=>{g.state=s;g.screen='game';await g.loadRegionArt(s.mapId);g.render();},s);await page.waitForFunction(()=>!g.artCache.pending);await page.waitForTimeout(450);
   const before=await page.evaluate(()=>{const layer=g.root.getChildByName('battle-ambient');globalThis.oldLayer=layer;return {count:layer.children.length,names:layer.children.map(n=>n.name),points:layer.children.map(n=>[n.position.x,n.position.y]),order:layer.getSiblingIndex()<g.stage.getSiblingIndex(),seed:g.state.seed,hp:g.state.hpRatio,controls:Object.keys(g.controls)};});
   assert(before.count<=14);assert(before.names.some(n=>n.startsWith(themes[id]+'-')));assert(before.order);assert(before.controls.includes('attack'));
   await page.waitForTimeout(500);const after=await page.evaluate(()=>({points:oldLayer.children.map(n=>[n.position.x,n.position.y]),seed:g.state.seed,hp:g.state.hpRatio,valid:oldLayer.isValid,current:g.root.getChildByName('battle-ambient')===oldLayer}));assert.notDeepEqual(after.points,before.points,'particles should move '+JSON.stringify({id,valid:after.valid,current:after.current,first:before.points[0],last:after.points[0]}));assert.equal(after.seed,before.seed);assert.equal(after.hp,before.hp);
   await page.screenshot({path:`checks/battle-ambient-${id+1}-${width}.png`});
   await page.evaluate(()=>g.render());await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>oldLayer.isValid),false);assert.equal(await page.evaluate(()=>g.root.children.filter(n=>n.name==='battle-ambient').length),1);
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>g.render());assert.equal(await page.evaluate(()=>g.root.getChildByName('battle-ambient')),null);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>g.render());assert.equal(await page.evaluate(()=>g.root.children.filter(n=>n.name==='battle-ambient').length),1);
 await page.evaluate(()=>{g.screen='home';g.render();});assert.equal(await page.evaluate(()=>g.root.getChildByName('battle-ambient')),null);
 assert.deepEqual(errors,[]);console.log('PASS nine battle themes at 390/320, moving particles behind actors, <=14 nodes, unchanged combat RNG/HP, render cleanup/home exit, reduced-motion fallback.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
