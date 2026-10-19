const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={},H={};
for(const [file,exports] of [['PMModel',M],['HomeScenery',H]])vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,Math,Date,JSON,Set});
for(let hour=0;hour<24;hour++)assert.equal(H.homePeriod(hour),hour<4||hour>=23?'midnight':hour<7?'dawn':hour<12?'morning':hour<17?'afternoon':hour<19?'dusk':'evening');
const base=M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(17),'ranger'),'fox'),Date.now());base.clearedMaps=[0,1,2,3,4,5];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.addInitScript(s=>{globalThis.visualHour=13;const OriginalDate=Date;globalThis.Date=class extends OriginalDate{getHours(){return globalThis.visualHour;}};localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));},base);
 await page.goto(cfg.url+'?scenery-check=1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});await page.evaluate(async()=>{const cc=await System.import('cc');globalThis.cc=cc;function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());});
 async function tap(id){await page.waitForFunction(()=>!__pm.animating());const c=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(c,id);const k=page.viewportSize().width/390;await page.touchscreen.tap(c.x*k,c.y*k);await page.waitForTimeout(300);await page.waitForFunction(()=>!__pm.animating());}
 await tap('start-game');
 for(const [hour,period] of [[5,'dawn'],[9,'morning'],[13,'afternoon'],[18,'dusk'],[21,'evening'],[1,'midnight']]){
   await page.evaluate(async hour=>{visualHour=hour;await g.refreshHomeArt();},hour);
   const state=await page.evaluate(()=>({period:g.homePeriod,ambient:g.homeAmbient.children.length,frame:g.homeBackground.getComponent(cc.Sprite).spriteFrame._uuid,energy:g.state.stamina.value}));assert.equal(state.period,period);assert.ok(state.ambient<=10);assert.equal(state.energy,30);await page.screenshot({path:'checks/home-'+period+'-390.png'});
 }
 await tap('home-settings');await page.screenshot({path:'checks/settings-final.png'});await tap('settings-close');
 for(let mapId=1;mapId<6;mapId++){
   await tap('home-explore');await tap('map-'+mapId);await tap('adventure-go');assert.equal(await page.evaluate(()=>g.state.mapId),mapId);await tap('challenge');
   const result=await page.evaluate(id=>{const pads=g.stage.children.filter(n=>n.name==='battle-ground');return {background:g.regionFrame('battle')===g.art['region-'+(id+1)+'-battle-v1'],pads:pads.length,padFrames:pads.every(n=>n.getComponent(cc.Sprite)?.spriteFrame===g.art['region-pad-'+id]),size:pads.map(n=>[n.getComponent(cc.UITransform).width,n.getComponent(cc.UITransform).height])};},mapId);assert.ok(result.background);assert.equal(result.pads,2);assert.ok(result.padFrames);await page.screenshot({path:'checks/theme-'+(mapId+1)+'-battle.png'});
   await page.evaluate(id=>{g.state.step=5;g.state.phase='nest';g.state.eggHunt={limit:2,candidates:[],selected:-1};g.state.journey.hero=['ranger','keeper','medic'][id%3];g.render();},mapId);await tap('eggSearch');await page.waitForTimeout(700);assert.ok(await page.evaluate(id=>g.regionFrame('nest')===g.art['region-'+(id+1)+'-nest-v1'],mapId));await page.screenshot({path:'checks/theme-'+(mapId+1)+'-nest.png'});await page.evaluate(()=>g.goHome());
 }
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(250);await page.screenshot({path:'checks/home-midnight-320.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>g.render());assert.equal(await page.evaluate(()=>g.root.children.filter(n=>n.name==='home-ambient').length),0);
 assert.deepEqual(errors,[]);console.log('PASS: all 24 cosmetic hour mappings, six home images, <=10 ambient elements, reduced motion, five actual map entries with matching battles/nests/pads, stamina unaffected by cosmetic clock; no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
