const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const config=require('../tools/workflow.config.json'),{chromium}=require(config.playwright),ts=require(path.join(path.dirname(config.typescript),'typescript.js'));
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:mod.exports,Math,Date,JSON,Set});const M=mod.exports;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];try{
 async function make(width,height,fixture){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
  if(fixture)await page.addInitScript(s=>{if(!sessionStorage.getItem('fixture-set')){localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));sessionStorage.setItem('fixture-set','1');}},fixture);
  await page.goto(config.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});
  const state=()=>page.evaluate(()=>__pm.snapshot()),screen=()=>page.evaluate(()=>__pm.screen());
  const tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const c=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(c,'missing '+id);const scale=width/390;await page.touchscreen.tap(c.x*scale,c.y*scale);await page.waitForTimeout(200);await page.waitForFunction(()=>!__pm.animating());};
  const shot=async name=>{await page.waitForTimeout(200);await page.screenshot({path:__dirname+'/onboarding-'+name+'.png'});};
  return {context,page,state,screen,tap,shot};
 }
 const a=await make(390,844);assert.equal(await a.screen(),'login');assert.deepEqual(Object.keys(await a.page.evaluate(()=>__pm.controls())),['start-game']);assert.equal((await a.state()).pets.length,0);await a.shot('cover');
 await a.tap('start-game');assert.equal(await a.screen(),'hero');await a.shot('heroes');await a.tap('hero-keeper');await a.tap('hero-confirm');assert.equal(await a.screen(),'starter');
 await a.page.reload();await a.page.waitForFunction(()=>globalThis.__pm?.ready);assert.equal(await a.screen(),'login');await a.tap('start-game');assert.equal(await a.screen(),'starter');assert.equal((await a.state()).journey.hero,'keeper');
 await a.tap('starter-otter');await a.shot('starters');await a.tap('starter-confirm');assert.equal(await a.screen(),'home');let s=await a.state();assert.equal(s.active.id,'otter');assert.equal(s.pets.length,1);const uid=s.active.uid;
 await a.shot('camp');await a.page.reload();await a.page.waitForFunction(()=>globalThis.__pm?.ready);await a.tap('start-game');assert.equal(await a.screen(),'home');assert.equal((await a.state()).active.uid,uid);assert.equal((await a.state()).pets.length,1);
 await a.tap('home-explore');await a.tap('adventure-go');await a.tap('challenge');assert.equal((await a.state()).phase,'battle');await a.context.close();
 const small=await make(320,568);await small.shot('cover-small');await small.tap('start-game');await small.tap('hero-medic');await small.shot('heroes-small');await small.tap('hero-confirm');await small.tap('starter-bud');await small.shot('starters-small');await small.tap('starter-confirm');assert.equal((await small.state()).pets.length,1);assert.equal((await small.state()).journey.hero,'medic');await small.context.close();
 let legacy=M.fresh(88,['fox','bud','turtle']);legacy.step=3;legacy.warmth=7;const old=await make(390,844,legacy);await old.tap('start-game');await old.tap('hero-ranger');await old.tap('hero-confirm');assert.equal(await old.screen(),'home');s=await old.state();assert.equal(s.step,3);assert.equal(s.pets.length,3);assert.equal(s.warmth,7);assert.equal(s.journey.legacy,true);await old.context.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,newJourney:true,oneStarter:true,reloadResume:true,oldSavePreserved:true,viewports:['390x844','320x568'],errors}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
