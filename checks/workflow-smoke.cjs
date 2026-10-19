const config=require('../tools/workflow.config.json');
const {chromium}=require(config.playwright),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
 await page.goto(config.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,'missing control '+id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(220);await page.waitForFunction(()=>!__pm.animating());};
 await tap('start-game');await tap('hero-confirm');await tap('starter-confirm');
 await tap('home-explore');await tap('adventure-go');await tap('challenge');assert.equal((await state()).phase,'battle');
 const before=await state();await tap('attack');const after=await state();assert.ok(after.enemyHP<before.enemyHP||after.phase!=='battle');
 await page.screenshot({path:__dirname+'/workflow-battle.png'});await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);
 const restored=await state();assert.equal(restored.active.uid,after.active.uid);assert.equal(restored.enemyHP,after.enemyHP);assert.equal(restored.phase,after.phase);assert.equal(restored.step,after.step);
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);await page.screenshot({path:__dirname+'/workflow-small.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,battleAction:true,reloadPreserved:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
