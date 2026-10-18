const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON,Set});const M=m.exports;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],warnings=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',msg=>{if(msg.type()==='warning'&&/atlas|error/i.test(msg.text()))warnings.push(msg.text());});
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.version==='0.7.0',null,{timeout:60000});
 const bind=()=>page.evaluate(async()=>{const cc=await System.import('cc');const walk=n=>{const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const child of n.children){const found=walk(child);if(found)return found;}};globalThis.__testGame=walk(cc.director.getScene());});await bind();
 const set=async s=>{await page.evaluate(s=>{__testGame.state=s;__testGame.save();__testGame.render();},JSON.parse(JSON.stringify(s)));await page.waitForTimeout(180);};
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const tap=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);assert.ok(p.y*k>0&&p.y*k<page.viewportSize().height,id+' within viewport');await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(220);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(120);};
 const shot=name=>page.screenshot({path:__dirname+'/hatching-'+name+'.png'});
 const reload=async()=>{await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await bind();};
 let s=M.fresh(37);s.eggs=[{id:'hatch-a',rarity:'SSR',affinity:'fox',stage:10},{id:'hatch-b',rarity:'SR',affinity:'bud',stage:5},{id:'hatch-c',rarity:'normal',affinity:'otter',stage:5}];s.warmth=6;
 await set(s);await tap('menu');await tap('eggBag');await shot('empty');await tap('hatch-slot-0');await shot('picker');await tap('incubate-hatch-a');await tap('hatch-slot-1');await tap('incubate-hatch-b');await shot('running');
 let before=await state();assert.equal(before.incubators.filter(Boolean).length,2);await reload();assert.deepEqual(await state(),before);await tap('menu');await tap('eggBag');
 for(let i=0;i<6;i++)await tap('hatch-slot-0');assert.equal((await state()).warmth,0);await shot('ready');await tap('hatch-slot-0');assert.equal((await state()).pendingHatch.rarity,'SSR');assert.equal((await state()).active.rarity,'SSR');await shot('reveal');
 before=await state();await reload();assert.deepEqual(await state(),before);await tap('hatch-ack');assert.equal((await state()).pendingHatch,undefined);await tap('hatch-close');await tap('menu');await tap('collection');await tap('quality-fox');await shot('quality');await tap('rarity-normal');await tap('use-rarity');assert.equal((await state()).active.rarity,undefined);await tap('rarity-SSR');await tap('use-rarity');assert.equal((await state()).active.rarity,'SSR');await tap('quality-back');await tap('closeCollection');
 await tap('challenge');const old=await state();await tap('boost');const now=await state();assert.equal(now.attack,Math.max(...now.active.faces));assert.ok(now.skill.used);await shot('skill-battle');assert.equal(now.boosts,old.boosts-1);await tap('attack');assert.ok((await state()).revision>now.revision);
 // Offline maturation: readyAt is persisted, not dependent on frames or open UI.
 s=await state();s.incubators[1].startedAt=Date.now()-1801000;s.incubators[1].readyAt=Date.now()-1000;await set(s);await reload();await tap('menu');await tap('eggBag');await tap('hatch-slot-1');assert.ok(['SR','SSR'].includes((await state()).pendingHatch.rarity));await tap('hatch-ack');await tap('hatch-close');
 // Every quality / species detail renders; compact phone view and empty energy buttons.
 for(const id of M.PET_IDS){await page.evaluate(id=>__testGame.qualityDetail(id,'SSR',0),id);await page.waitForTimeout(30);}
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);await tap('menu');await tap('eggBag');await shot('small');await tap('hatch-slot-0');await shot('picker-small');await tap('incubate-hatch-c');await shot('running-small');
 // Clock updates in place and turns ready without clicking or reloading.
 s=await state();s.incubators[0].startedAt=Date.now()-1800000;s.incubators[0].readyAt=Date.now()+1200;await set(s);await tap('menu');await tap('eggBag');await page.waitForTimeout(2100);await tap('hatch-slot-0');assert.ok((await state()).pendingHatch);await shot('reveal-small');await tap('hatch-ack');await tap('hatch-close');
 await tap('menu');await tap('collection');await tap('quality-fox');await shot('quality-small');
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);console.log(JSON.stringify({passed:true,twoSlots:true,offline:true,acceleration:true,revealReload:true,qualitySwitch:true,automaticSkill:true,speciesDetails:18,viewports:['390x844','320x568'],errors,warnings}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
