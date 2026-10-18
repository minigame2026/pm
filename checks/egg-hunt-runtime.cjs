const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});const model=m.exports;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.version==='0.5.0',{timeout:60000});
 const bind=()=>page.evaluate(async()=>{const cc=await System.import('cc');const walk=n=>{const c=n.components.find(c=>typeof c.nestUI==='function');if(c)return c;for(const child of n.children){const found=walk(child);if(found)return found;}};globalThis.__testGame=walk(cc.director.getScene());});await bind();
 const set=async s=>{await page.evaluate(s=>{__testGame.state=s;__testGame.save();__testGame.render();},JSON.parse(JSON.stringify(s)));await page.waitForTimeout(200);};
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const tap=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(200);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(150);};
 const reload=async()=>{await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await bind();};
 for(const step of [5,10]){
  let s=model.act(model.fresh(337),'challenge');s.step=step;s.enemy=step===5?'owl':'rhino';s.attack=99;s.enemyHP=1;await set(s);await tap('attack');if(step===5)await tap('take');
  assert.equal((await state()).phase,'nest');await page.screenshot({path:__dirname+'/nest-'+step+'-empty.png'});
  const limit=step===5?2:3;for(let i=0;i<limit;i++){await tap('eggSearch');assert.equal((await state()).eggHunt.candidates.length,i+1);if(i===0){const before=await state();await reload();assert.deepEqual(await state(),before);}}
  await tap('eggSelect0');let selected=(await state()).eggHunt.candidates[0];await page.screenshot({path:__dirname+'/nest-'+step+'-choice.png'});await tap('eggTake');assert.equal((await state()).phase,'eggClaimed');assert.equal((await state()).eggs[0].id,selected.id);await page.screenshot({path:__dirname+'/nest-'+step+'-claimed.png'});await reload();assert.equal((await state()).phase,'eggClaimed');await tap('eggBag');await page.screenshot({path:__dirname+'/nest-bag.png'});await tap('closeEggBag');await tap('eggContinue');assert.equal((await state()).phase,step===5?'recruit':'won');
  if(step===10){await tap('restart');assert.equal((await state()).eggs[0].id,selected.id);assert.equal((await state()).step,1);}
 }
 // Render each rarity via deterministic real model draws, then verify short-screen controls.
 for(const rarity of ['normal','SR','SSR']){let sample;for(let i=1;i<10000;i++){let s=model.act(model.fresh(Math.imul(i,2654435761)),'challenge');s.step=10;s.enemy='dragon';s.attack=99;s.enemyHP=1;s=model.act(model.act(s,'attack'),'eggSearch');if(s.eggHunt.candidates[0].rarity===rarity){sample=s;break;}}assert.ok(sample);await set(sample);await page.screenshot({path:__dirname+'/nest-'+rarity+'.png'});await page.setViewportSize({width:320,height:568});await page.waitForTimeout(250);await page.screenshot({path:__dirname+'/nest-'+rarity+'-small.png'});await tap('eggTake');assert.equal((await state()).phase,'eggClaimed');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);}
 // Legacy v0.3 battle preserves progress, while the next encounter uses the 18-pet roster.
 let legacy=model.act(model.fresh(64),'challenge');legacy.step=7;legacy.enemy='fox';legacy.enemyHP=1;legacy.attack=99;delete legacy.contentVersion;delete legacy.eggs;await set(legacy);await reload();assert.equal((await state()).step,7);assert.equal((await state()).enemy,'fox');await tap('attack');await tap('take');assert.equal((await state()).step,8);assert.equal((await state()).phase,'encounter');
 const names=new Set();for(let i=1;i<=30;i++){await set(model.fresh(Math.imul(i,2654435761)));names.add((await state()).enemy);}assert.ok(names.size>3);const art=await page.evaluate(()=>Object.keys(__testGame.art));assert.ok(model.PET_IDS.every(id=>art.includes(id+'-front')));
 assert.equal(errors.length,0);console.log(JSON.stringify({passed:true,eliteAndBoss:true,reloadAndRestart:true,rarities:3,newEncounterSpecies:names.size,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
