const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{const fixture=localStorage.getItem('pm.check.fixture');if(fixture){localStorage.setItem('pm.creature-dice.v1',fixture);localStorage.removeItem('pm.check.fixture');}});
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.ready);
 let fixture;for(let seed=1;seed<100;seed++){fixture=m.exports.act(m.exports.fresh(seed),'challenge');if(fixture.healMultiplier>=2&&fixture.boostMultiplier>=3&&fixture.attack===1)break;}
 fixture.hpRatio=2/22;
 await page.evaluate(s=>localStorage.setItem('pm.check.fixture',JSON.stringify(s)),fixture);await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const click=async id=>{const c=await page.evaluate(id=>__pm.controls()[id],id);await page.touchscreen.tap(c.x*page.viewportSize().width/390,c.y*page.viewportSize().width/390);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(200);};
 await page.screenshot({path:__dirname+'/items-before.png'});
 await click('heal');let s=await state();assert.equal(m.exports.hp(s),Math.min(22,2+fixture.heal*fixture.healMultiplier));assert.equal(s.potions,fixture.potions-1);
 await click('boost');s=await state();assert.equal(s.boosts,fixture.boosts-1);assert.equal(s.boostMultiplier,fixture.boostMultiplier);assert.equal(s.doubled,true);
 await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);assert.deepEqual(await state(),s);
 await page.screenshot({path:__dirname+'/items-active.png'});
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(500);await page.screenshot({path:__dirname+'/items-small.png'});
 await click('attack');const end=await state();assert.equal(end.enemyHP,Math.max(0,s.enemyHP-s.attack*s.boostMultiplier));assert.equal(end.doubled,false);
 await page.setViewportSize({width:390,height:844});
 for(const phase of ['lost','won','reward']){
   const ended=m.exports.fresh(52,['fox','bud','turtle']);ended.phase=phase;ended.hpRatio=phase==='lost'?0:1;
   await page.evaluate(s=>localStorage.setItem('pm.check.fixture',JSON.stringify(s)),ended);await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);
   if(phase==='reward')await click('menu');await click('collection');await click('equip-bud');assert.equal((await state()).reserve.id,'bud');
   await page.screenshot({path:__dirname+'/collection-'+phase+'.png'});
   await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);assert.equal((await state()).reserve.id,'bud');
   if(phase!=='reward'){await click('restart');assert.equal((await state()).reserve.id,'bud');assert.equal((await state()).phase,'encounter');}
 }
 assert.equal(errors.length,0);const result={passed:true,healMultiplier:fixture.healMultiplier,boostMultiplier:fixture.boostMultiplier,heal:m.exports.hp(s)-2,damage:s.attack*s.boostMultiplier,reloadSame:true,reserveSelection:['lost','won','reward'],restartKeepsTeam:true,errors};
 fs.writeFileSync(__dirname+'/items-runtime-result.json',JSON.stringify(result,null,2));console.log(result);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
