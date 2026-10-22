const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
 await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
 const attach=async()=>{await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const found=n.components.find(c=>typeof c.loadRegionArt==='function');if(found)return found;for(const child of n.children){const found=walk(child);if(found)return found;}}globalThis.g=walk(cc.director.getScene());const original=g.encounterNameAttack;g.encounterNameAttack=function(parent,name,faces,...rest){if(parent.name==='enemy-attack-values')this.lastPreviewFaces=faces;return original.call(this,parent,name,faces,...rest);};});};
 const tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert(p,'missing '+id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(120);await page.waitForFunction(()=>!__pm.animating());};
 await page.goto(cfg.url+'?gyms-check=1');await attach();
 let base=M.fresh(42,['fox','bud','otter']);base.clearedMaps=[0,1,2,3,4,5,6,7,8];base.expedition=false;
 for(const gym of M.GYMS){
  await page.evaluate(s=>{g.state=s;g.screen='home';g.render();g.gymUI();},base);await tap('gym-'+gym.id);
  const result=await page.evaluate(()=>({state:__pm.snapshot(),faces:g.lastPreviewFaces}));assert.equal(result.state.gymRun,gym.id);assert.equal(result.state.enemyMax,Math.round(M.enemyHealthForStage(1,gym.id)*1.5));
  assert.deepEqual(result.faces,[...M.enemyAttackFaces(result.state)].map(v=>M.enemyAttackAmount(result.state,v)),'visible preview has boosted damage');
 }
 // Every newly reachable friend form has both packaged views and a drawable enemy sprite.
 for(const id of M.FRIEND_PET_IDS){
  const gym=M.GYMS.find(g=>g.types.includes(M.PETS[id].type));
  for(const rarity of M.RARITIES){
   let s=M.enterGym(base,gym.id);s.enemy=id;s.enemyRarity=rarity;
   await page.evaluate(async s=>{g.state=s;g.screen='game';const form=s.enemyRarity==='normal'?s.enemy:s.enemy+'-'+s.enemyRarity;await g.artCache.warm([form+'-front',form+'-back']);for(const side of ['front','back'])if(!g.artCache.frames[form+'-'+side])throw Error('Missing '+form+'-'+side);g.render();},s);await page.waitForFunction(()=>!g.artCache.pending);
   assert(await page.evaluate(()=>!!g.enemyNode.getComponent(cc.Sprite)?.spriteFrame),id+' '+rarity+' enemy sprite');
   if(id==='postplat'||id==='railpede')await page.screenshot({path:`checks/gym-${id}-${rarity}.png`});
  }
 }
 for(const width of [390,320]){
  await page.setViewportSize({width,height:width===390?844:568});let s=M.enterGym(base,4);s.enemy='railpede';s.enemyRarity='SSR';
  await page.evaluate(async s=>{g.state=s;g.screen='game';await g.loadRegionArt(s.mapId);g.render();await g.save();},s);await page.waitForFunction(()=>!g.artCache.pending);await tap('challenge');
  const before=await page.evaluate(()=>__pm.snapshot());assert([...M.enemyAttackFaces(before)].includes(before.enemyAttack));
  await page.screenshot({path:`checks/gyms-battle-${width}.png`});await page.reload();await attach();const resumed=await page.evaluate(()=>__pm.snapshot());assert.equal(resumed.gymRun,before.gymRun);assert.equal(resumed.enemyAttack,before.enemyAttack);assert.equal(resumed.enemyHP,before.enemyHP);assert.equal(resumed.enemyMax,before.enemyMax);
 }
 assert.deepEqual(errors,[]);console.log('PASS nine gym entries / boosted visible preview / 54 friend forms with both views / 390 and 320 combat / reload preserves committed dice and HP.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
