const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const config=require('../tools/workflow.config.json'),{chromium}=require(config.playwright),ts=require(path.join(path.dirname(config.typescript),'typescript.js'));
const M={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const initial=()=>M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(17),'medic'),'fox'));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];try{
async function make(width,height,s){const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));sessionStorage.setItem('seeded','1');}},s);
 await page.goto(config.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});
 const snap=()=>page.evaluate(()=>__pm.snapshot()),tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const c=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(c,id);await page.touchscreen.tap(c.x*width/390,c.y*width/390);await page.waitForTimeout(220);await page.waitForFunction(()=>!__pm.animating());};
 await tap('start-game');return{context,page,snap,tap};}
const a=await make(390,844,initial());assert.equal((await a.snap()).stamina.value,30);await a.page.screenshot({path:'checks/stamina-camp.png'});
await a.tap('home-explore');await a.tap('map-1');await a.tap('adventure-go');assert.equal(await a.page.evaluate(()=>__pm.screen()),'adventure');assert.equal((await a.snap()).stamina.value,30);
await a.tap('map-0');await a.tap('adventure-go');assert.equal((await a.snap()).stamina.value,25);assert.equal((await a.snap()).expedition,true);await a.tap('challenge');await a.page.screenshot({path:'checks/stamina-battle.png'});await a.tap('retreat');
let s=await a.snap();assert.equal(await a.page.evaluate(()=>__pm.screen()),'home');assert.equal(s.expedition,false);assert.equal(s.step,1);assert.equal(s.stamina.value,25);assert.equal(s.hpRatio,1);
await a.tap('stamina-ad');assert.equal((await a.snap()).stamina.value,25);await a.page.screenshot({path:'checks/stamina-ad-placeholder.png'});await a.tap('stamina-close');
await a.page.evaluate(()=>{globalThis.pmRewardedAd={show:async()=>({completed:false})};});await a.tap('stamina-ad');assert.equal((await a.snap()).stamina.value,25);await a.tap('stamina-close');
await a.page.evaluate(()=>{globalThis.pmRewardedAd={show:async()=>({completed:true})};});await a.tap('stamina-ad');await a.page.waitForFunction(()=>__pm.snapshot().stamina.value===30);
await a.tap('home-explore');await a.tap('adventure-go');assert.equal((await a.snap()).stamina.value,25);await a.page.reload();await a.page.waitForFunction(()=>globalThis.__pm?.ready);await a.tap('start-game');await a.tap('home-explore');await a.tap('adventure-go');assert.equal((await a.snap()).stamina.value,25,'reload resume cannot charge twice');await a.tap('retreat');await a.context.close();
let low=initial();low.stamina={value:4,updatedAt:Date.now()};const b=await make(320,568,low);await b.page.screenshot({path:'checks/stamina-camp-small.png'});await b.tap('home-explore');await b.tap('adventure-go');assert.equal((await b.snap()).stamina.value,4);assert.equal((await b.snap()).expedition,false);await b.context.close();
let offline=initial();offline.stamina={value:20,updatedAt:Date.now()-240100};const c=await make(390,844,offline);assert.equal((await c.snap()).stamina.value,22);await c.context.close();
let won=initial();won.phase='won';won.clearedMaps=[0];won.step=10;won.expedition=true;const d=await make(390,844,won);await d.tap('home-explore');await d.tap('map-1');await d.tap('adventure-go');s=await d.snap();assert.equal(s.mapId,1);assert.equal(s.step,1);assert.equal(s.stamina.value,25);await d.context.close();
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,entryAndRetreat:true,lockedMaps:true,insufficientEnergy:true,offlineRegen:true,adMissingCancelledCompleted:true,reloadNoDoubleCharge:true,viewports:['390x844','320x568']}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
