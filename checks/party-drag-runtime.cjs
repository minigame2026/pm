const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON,Set});const M=m.exports;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),cdp=await page.context().newCDPSession(page),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.version==='0.8.1',null,{timeout:60000});
 const bind=()=>page.evaluate(async()=>{const cc=await System.import('cc');const walk=n=>{const c=n.components.find(c=>typeof c.bindPartyDrag==='function');if(c)return c;for(const child of n.children){const found=walk(child);if(found)return found;}};globalThis.__testGame=walk(cc.director.getScene());});await bind();
 const set=async s=>{await page.evaluate(s=>{__testGame.state=s;__testGame.screen='partners';__testGame.partnerPage=0;__testGame.partnerOwnedOnly=true;__testGame.save();__testGame.render();},JSON.parse(JSON.stringify(s)));await page.waitForTimeout(150);};
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const point=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);return {x:p.x*k,y:p.y*k};};
 const tap=async id=>{const p=await point(id);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(350);};
 const touch=async(type,p)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]});
 const drag=async(from,to,{cancel=false,shot=false}={})=>{const a=await point(from),b=typeof to==='string'?await point(to):to;await touch('touchStart',a);
  for(let i=1;i<=12;i++){await touch('touchMove',{x:a.x+(b.x-a.x)*i/12,y:a.y+(b.y-a.y)*i/12});await page.waitForTimeout(18);}
  if(shot){assert.equal(await page.evaluate(()=>__testGame.partyDrag?.target),0);await page.screenshot({path:__dirname+'/party-drag-active.png'});}
  await touch(cancel?'touchCancel':'touchEnd');await page.waitForTimeout(400);
 };
 let s=M.fresh(181);s.owned=M.PET_IDS.slice();s.hpRatio=.41;s.active.faces=[8,9,10];await set(s);assert.equal(M.rarityName(),'R');
 await tap('pet-bud');assert.equal((await state()).active.id,'fox');assert.equal(await page.evaluate(()=>__testGame.partnerSelected),'bud');
 await drag('pet-bud','team-slot-0',{shot:true});let n=await state();assert.equal(n.active.id,'bud');assert.equal(n.hpRatio,.41);assert.equal(n.enemy,s.enemy);assert.equal(n.seed,s.seed);
 await drag('team-slot-1','team-slot-0');n=await state();assert.equal(n.active.id,'turtle');assert.equal(n.reserve.id,'bud');
 await drag('pet-cotton','team-slot-2');assert.equal(M.homeParty(await state())[2],'cotton');
 let before=await state();await drag('pet-fox',{x:190,y:600});assert.deepEqual(await state(),before);
 await drag('pet-fox','team-slot-0',{cancel:true});assert.deepEqual(await state(),before);
 await drag('pet-fox','team-slot-0');assert.equal((await state()).active.id,'fox');assert.deepEqual((await state()).active.faces,[8,9,10]);
 await page.screenshot({path:__dirname+'/party-drag-result.png'});
 before=await state();await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await bind();assert.deepEqual(await state(),before);
 await tap('home-partners');assert.equal(await page.evaluate(()=>Object.keys(__pm.controls()).some(k=>k.startsWith('assign-'))),false);
 // Physical cancellation and battle/collection locks never commit a drop.
 s=M.act(M.fresh(77),'challenge');await set(s);before=await state();await drag('pet-turtle','team-slot-0');assert.deepEqual(await state(),before);
 s=M.fresh(77);await set(s);await tap('partner-filter');before=await state();await drag('pet-bud','team-slot-0');assert.deepEqual(await state(),before);
 // Small portrait screens use the same UI-coordinate hit testing.
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(200);s=M.fresh(3);s.owned=M.PET_IDS.slice();await set(s);await drag('pet-otter','team-slot-0');assert.equal((await state()).active.id,'otter');await page.screenshot({path:__dirname+'/party-drag-small.png'});
 await tap('partner-skill');const labels=await page.evaluate(async()=>{const {Label}=await System.import('cc');return __testGame.root.getComponentsInChildren(Label).map(l=>l.string);});assert.ok(labels.includes('R'));assert.ok(!labels.some(t=>t==='普通'));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,tapAndDrag:true,collectionToSlot:true,slotSwap:true,invalidDrop:true,touchCancel:true,battleLock:true,unownedLock:true,saveAndFaces:true,smallScreen:true,rarityR:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
