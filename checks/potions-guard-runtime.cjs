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
  const tap=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(240);};
  const shot=async id=>page.screenshot({path:__dirname+'/potions-'+id+'.png'});
  const f=m.exports.act(m.exports.fresh(47),'challenge'),stock=process.argv.includes('--remaining-stock')?2:1;
  Object.assign(f,{hpRatio:.4,heal:3,healMultiplier:2,attack:4,boostMultiplier:2,potions:stock,boosts:stock,enemyHP:500,enemyMax:500,enemyAttack:250});
  await page.evaluate(f=>localStorage.setItem('pm.check.fixture',JSON.stringify(f)),f);await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await shot('ready');
  let before=await state();await tap('heal');let after=await state();assert.equal(after.potions,stock-1);assert.equal(after.usedHeal,true);assert.equal(m.exports.hp(after),m.exports.hp(before)+6);
  await tap('boost');after=await state();assert.equal(after.boosts,stock-1);assert.equal(after.doubled,true);assert.equal(m.exports.attackAmount(after),8);await shot(stock===1?'empty':'used-with-stock');
  const empty=await state();await tap('heal');await tap('boost');assert.deepEqual(await state(),empty);
  before=await state();await tap('guard');assert.ok((await page.evaluate(()=>__pm.controls())).confirmGuard);await tap('confirmGuard');after=await state();
  assert.equal(m.exports.hp(before)-m.exports.hp(after),3,'250 damage must become 3 after guard');
  assert.equal(after.usedHeal,false);assert.equal(after.doubled,false);await shot('next-turn');
  const expected=m.exports.act(before,'guard');assert.equal(after.healMultiplier,expected.healMultiplier);assert.equal(after.boostMultiplier,expected.boostMultiplier);assert.ok([1,2,3].includes(after.healMultiplier));assert.ok([2,3,4].includes(after.boostMultiplier));
  const saved=await state();await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);assert.deepEqual(await state(),saved);
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(400);await shot('small');
  await tap('menu');assert.ok((await page.evaluate(()=>__pm.controls())).resume);await tap('resume');assert.deepEqual(await state(),saved);
  assert.equal(errors.length,0);const result={passed:true,initialStock:stock,remainingStock:stock-1,healFormula:'3 x 2 = +6',powerFormula:'4 x 2 = +8',usedButtonsNoAction:true,nextTurnClearsUsed:true,guard250Damage:3,reloadAndMenu:true,screens:['390x844','320x568'],errors};
  fs.writeFileSync(__dirname+'/potions-guard-result.json',JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
