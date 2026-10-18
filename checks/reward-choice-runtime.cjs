const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{const f=localStorage.getItem('pm.check.fixture');if(f){localStorage.setItem('pm.creature-dice.v1',f);localStorage.removeItem('pm.check.fixture');}});
  await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.ready);
  const state=()=>page.evaluate(()=>__pm.snapshot());
  const tap=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(180);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(240);};
  const healing=process.argv.includes('--healing'),stat=healing?'heal':'attack';
  for(let i=0;i<3;i++){
   const f=m.exports.act(m.exports.fresh(47),'challenge');f.enemyHP=1;f.hpRatio=.4;f.reward=i<2?{kind:stat,values:healing?[4,4,6]:[3,3,4],title:'test'}:{kind:'potion',values:[2],title:'生命药水 +2'};
   await page.evaluate(f=>localStorage.setItem('pm.check.fixture',JSON.stringify(f)),f);await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);
   await tap('attack');const won=await state();assert.equal(won.phase,'reward');
   const controls=await page.evaluate(()=>__pm.controls());assert.ok(controls.take);assert.equal(!!controls.keep,i<2);for(const id of ['reward0','reward1','reward2'])assert.ok(!controls[id]);assert.equal(m.exports.rewardOptions(won).length,1);
   await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);assert.deepEqual(await state(),won);
   if(i===0){await page.waitForTimeout(400);await page.screenshot({path:__dirname+'/reward-'+stat+'-choice-390.png'});}
   if(i===1){await page.setViewportSize({width:320,height:568});await page.waitForTimeout(400);await page.screenshot({path:__dirname+'/reward-'+stat+'-choice-320.png'});}
   if(i===2)await page.screenshot({path:__dirname+'/reward-claim-320.png'});
   const action=i===0?'keep':'take';await tap(action);assert.equal(JSON.stringify(await state()),JSON.stringify(m.exports.act(won,action)));
   if(i===0)assert.deepEqual(healing?(await state()).healFaces:(await state()).active.faces,healing?won.healFaces:won.active.faces);
   if(i===1)assert.deepEqual(healing?(await state()).healFaces:(await state()).active.faces,won.reward.values);
   assert.equal((await state()).phase,'recruit');assert.ok(!(await page.evaluate(()=>__pm.controls())).take);
  }
  assert.equal(errors.length,0);console.log({passed:true,stat,exactlyOneDrop:true,keepOriginalAndTakeNewBothWork:true,ordinaryRewardClaim:true,reloadStable:true,recruitmentPreserved:true,screens:['390x844','320x568'],errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
