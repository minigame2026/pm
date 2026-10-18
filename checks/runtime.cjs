const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.ready,{},{timeout:45000});
 await page.screenshot({path:path.join(__dirname,'01-encounter.png')});
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const click=async id=>{const controls=await page.evaluate(()=>__pm.controls());assert.ok(controls[id],id+' exists');const c=controls[id],scale=page.viewportSize().width/390;await page.touchscreen.tap(c.x*scale,c.y*scale);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(200);};
 await click('switch');assert.equal((await state()).active.id,'turtle');await click('switch');assert.equal((await state()).active.id,'fox');
 await click('challenge');await page.screenshot({path:path.join(__dirname,'02-battle.png')});
 await click('guard');const saved=await state();await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);assert.deepEqual(await state(),saved);
 const seen=new Set();let n=0;
 while(!['won','lost'].includes((await state()).phase)&&n++<300){const s=await state();
   if(!seen.has(s.phase)){await page.screenshot({path:path.join(__dirname,'phase-'+s.phase+'.png')});seen.add(s.phase);}
   if(s.phase==='encounter')await click('challenge');
   else if(s.phase==='reward') {const average=a=>a.reduce((x,y)=>x+y,0)/a.length;const old=s.reward.kind==='attack'?s.active.faces:s.healFaces;await click(['attack','heal'].includes(s.reward.kind)&&average(old)>average(s.reward.values)?'keep':'take');}
   else if(s.phase==='recruit')await click('invite');
   else if(s.phase==='team')await click('replace');
   else if(s.phase==='battle'){
     const max={fox:22,bud:24,turtle:30}[s.active.id]+s.hpBonus;
     if(s.hpRatio<.55&&!s.usedHeal&&s.potions)await click('heal');
     else if(!s.doubled&&s.boosts&&s.attack>=5&&s.enemyHP>s.attack)await click('boost');
     else await click(s.enemyAttack>4&&s.attack<3?'guard':'attack');
   }
 }
 const final=await state();assert.ok(['won','lost'].includes(final.phase));assert.ok(final.owned.includes('bud'));
 await page.screenshot({path:path.join(__dirname,'03-ending.png')});
 await click('restart');assert.ok((await state()).owned.includes('bud'));await click('menu');await click('collection');await click('equip-bud');await click('closeCollection');assert.equal((await state()).reserve.id,'bud');
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(600);await page.screenshot({path:path.join(__dirname,'04-small.png')});
 await click('challenge');assert.equal((await state()).phase,'battle');
 fs.writeFileSync(path.join(__dirname,'runtime-result.json'),JSON.stringify({status:'passed',screens:['390x844','320x568'],touch:true,reloadSameDice:true,capture:true,reserveReplacement:true,collectionEquip:true,ending:final.phase,step:final.step,actions:n,errors},null,2));
 console.log(JSON.stringify({status:'passed',ending:final.phase,step:final.step,actions:n,errors}));assert.equal(errors.length,0);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
