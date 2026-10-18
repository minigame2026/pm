const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{const f=localStorage.getItem('pm.check.fixture');if(f){localStorage.setItem('pm.creature-dice.v1',f);localStorage.removeItem('pm.check.fixture');}});
 const ready=()=>page.waitForFunction(()=>globalThis.__pm?.ready),state=()=>page.evaluate(()=>__pm.snapshot());
 await page.goto('http://127.0.0.1:8780/');await ready();
 const load=async f=>{await page.evaluate(f=>localStorage.setItem('pm.check.fixture',JSON.stringify(f)),f);await page.reload();await ready();await page.waitForTimeout(250);};
 const tap=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(180);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(200);};
 for(const kind of ['potion','boost','attack','heal']){const f=m.exports.fresh(47);f.reward={kind,values:['attack','heal'].includes(kind)?[3,5,7]:[2],title:'test'};await load(f);assert.equal((await state()).reward.kind,kind);await page.screenshot({path:__dirname+'/reward-row-'+kind+'.png',clip:{x:45,y:92,width:300,height:110}});}assert.equal(errors.length,0);console.log('Four reward rows rendered; no browser errors'); }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});