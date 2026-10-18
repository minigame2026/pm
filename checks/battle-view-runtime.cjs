const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{const f=localStorage.getItem('pm.check.fixture');if(f){localStorage.setItem('pm.creature-dice.v1',f);localStorage.removeItem('pm.check.fixture');}});
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.ready);
 const state=()=>page.evaluate(()=>__pm.snapshot());const idle=async()=>{await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(220);};
 const target=async id=>{const c=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;return {x:c.x*k,y:c.y*k};};
 const tap=async id=>{const c=await target(id);await page.touchscreen.tap(c.x,c.y);await idle();};
 const shot=async name=>page.screenshot({path:__dirname+'/battle-view-'+name+'.png'});
 for(const [id,enemy] of [['fox','bud'],['bud','turtle'],['turtle','fox']]){
   const f=m.exports.act(m.exports.fresh(47),'challenge');f.owned=['fox','bud','turtle'];f.active=m.exports.pet(id);f.reserve=m.exports.pet(id==='fox'?'turtle':'fox');f.enemy=enemy;
   await page.evaluate(f=>localStorage.setItem('pm.check.fixture',JSON.stringify(f)),f);await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await shot(id);
 }
 if(process.argv.includes('--visual-only')){await page.setViewportSize({width:320,height:568});await page.waitForTimeout(500);await shot('small');assert.equal(errors.length,0);await browser.close();console.log('All six views and small-screen spacing checked.');return;}
 const before=await state();const cdp=await page.context().newCDPSession(page);const p=await target('attack');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});await page.waitForTimeout(100);await shot('button-down');assert.deepEqual(await state(),before);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await idle();assert.deepEqual(await state(),before);
 // Disabled full-health healing never consumes an item or starts an action.
 await tap('heal');assert.deepEqual(await state(),before);
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(500);await shot('small');
 await tap('attack');assert.deepEqual(await state(),JSON.parse(JSON.stringify(m.exports.act(before,'attack'))));
 const saved=await state();await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);assert.deepEqual(await state(),saved);
 assert.equal(errors.length,0);const result={passed:true,perspectives:['fox','bud','turtle'],screens:['390x844','320x568'],pressCancel:true,disabledNoAction:true,attackAndReload:true,errors};
 fs.writeFileSync(__dirname+'/battle-view-result.json',JSON.stringify(result,null,2));console.log(result);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
