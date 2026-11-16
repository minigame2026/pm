/* Only the three new paintings; all browser state is disposable. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),{chromium}=require(cfg.playwright),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const manifest=require('../art-source/regions-13-15/scenes/manifest.json'),pc=process.argv.includes('--pc-only'),out='checks/region-scenes-13-15';fs.mkdirSync(out,{recursive:true});
const report={platform:pc?'web-desktop':'web-mobile',cases:[],errors:[],nativeVerified:false};
const now=Date.now();M.setTimeProvider(()=>now);
function fixture(map){let s=M.fresh(193,[M.MAPS[map].pets[5]]);s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.clearedMaps=M.MAPS.map(m=>m.id);s.expedition=false;s=M.enterExpedition(s,map,now);s.step=10;s.enemy=M.MAPS[map].pets[5];s.enemyRarity='SSR';s.enemyHP=s.enemyMax=M.enemyHealthForStage(10,map);s=M.act(s,'challenge');delete s.enemyVariant;assert(M.restore(JSON.stringify(s)));return s;}
for(const row of manifest.images){const f=pc?row.pc:row.mobile,b=fs.readFileSync(f),size=pc?row.masterSize:row.mobileSize;assert.equal(b.readUInt32BE(16),size[0]);assert.equal(b.readUInt32BE(20),size[1]);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),pc?row.sha256:row.mobileSha256);}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height]of pc?[[1280,720],[1920,1080]]:[[320,568],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:!pc,hasTouch:!pc,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:')&&r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+(pc?8781:8780)+'/');await page.waitForFunction(pc=>pc?globalThis.__pmPC?.ready:globalThis.__pm?.ready,pc,{timeout:120000});
  await page.evaluate(async pc=>{globalThis.cc=await System.import('cc');const find=n=>n.components.find(c=>typeof c[pc?'mapDetail':'adventureUI']==='function')||n.children.map(find).find(Boolean);globalThis.g=find(cc.director.getScene());g.clockSaveAt=Infinity;g.reduced=true;},pc);
  const idle=async()=>{await page.waitForFunction(pc=>pc?!g.art.pending&&!__pmPC.busy():!g.artCache.pending&&!g.busy,pc);await page.waitForTimeout(200);};
  for(const row of manifest.images){
   await page.evaluate(async({pc,map,s})=>{g.state=s;if(pc)g.show('battle');else{await g.loadRegionArt(map);g.screen='game';g.render();}},{pc,map:row.map-1,s:fixture(row.map-1)});await idle();
   const result=await page.evaluate(pc=>{const node=pc?g.battleScenery:g.root.getChildByName('background'),t=node.getComponent(cc.UITransform),f=node.getComponent(cc.Sprite).spriteFrame;return {key:pc?g.sceneKey:g.regionKey('battle'),width:t.width,height:t.height,texture:[f.texture.width,f.texture.height],visible:cc.view.getVisibleSize(),actors:pc?!!g.player&&!!g.enemy:!!g.playerNode&&!!g.enemyNode};},pc);
   assert.equal(result.key,pc?'pc-map-'+row.map+'-v1':'region-'+row.map+'-battle-v1');assert.deepEqual(result.texture,pc?row.masterSize:row.mobileSize);assert(result.actors);assert(result.width>=result.visible.width-.01);assert(result.height>=(pc?result.visible.height:result.visible.height-246)-.01);assert(Math.abs(result.width/result.height-result.texture[0]/result.texture[1])<.001,'aspect preserved');
   const file=`${pc?'pc':'mobile'}-${width}-map-${row.map}.png`;await page.screenshot({path:path.join(out,file)});
   if(pc){await page.evaluate(map=>{g.mapIndex=map;g.show('map');},row.map-1);await idle();assert(await page.evaluate(key=>Array.from(g.art.bindings).some(([n,k])=>k===key&&n.activeInHierarchy),result.key),'map preview uses its own painting');}
   else {const oldNest=await page.evaluate(()=>g.regionKey('nest'));assert.equal(oldNest,'region-'+({13:4,14:2,15:6}[row.map])+'-nest-v1','unrequested nest art unchanged');}
   report.cases.push({map:row.map,width,height,screenshot:file,...result});
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(`PASS ${report.platform}: 3 new scenes × 2 sizes, real texture loads, cover, no stretch or script errors`);
}finally{await browser.close();fs.writeFileSync(path.join(out,pc?'pc-report.json':'mobile-report.json'),JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
