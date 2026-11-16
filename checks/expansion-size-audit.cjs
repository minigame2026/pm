/* Actual rendered bounds, disposable browser profiles, no player save access. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),root=path.resolve(__dirname,'..');
const scope={require,module:{exports:{}},__dirname:path.join(root,'tools'),console};
vm.runInNewContext(fs.readFileSync(path.join(root,'tools/simulate-balance.cjs'),'utf8').split('const mode=process.argv')[0]+'\nmodule.exports={M};',scope);
const {M}=scope.module.exports,copy=x=>JSON.parse(JSON.stringify(x)),now=Date.now();M.setTimeProvider(()=>now);
const roster=JSON.parse(fs.readFileSync(path.join(root,'art-source/regions-13-15/roster.json'),'utf8')),out=path.resolve(process.env.PM_SIZE_OUTPUT||path.join(__dirname,'expansion-size-audit'));fs.mkdirSync(out,{recursive:true});
const result={status:'running',cases:[],errors:[],screenshots:[],platformNote:'Isolated browser renders; not native APK or Windows GPU verification'};
function fixture(p,rarity){let s=M.fresh(173,[p.id,'fox','bud']);s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.expedition=false;s.clearedMaps=M.MAPS.map(m=>m.id);const q=s.pets.find(q=>q.id===p.id);Object.assign(q,{rarity,shiny:true,baseHP:M.naturalPetHP(p.id,rarity),baseFaces:copy(M.naturalPetFaces(p.id,rarity)),skills:copy(M.petSkills({id:p.id,rarity}))});q.faces=copy(q.baseFaces);s.active=copy(q);s.runRoster={};s=M.enterExpedition(s,p.mapId,now);s.step={normal:1,elite:5,boss:10}[M.PETS[p.id].rank];s.enemy=p.id;s.enemyRarity=rarity;s.enemyMax=s.enemyHP=M.enemyHealthForStage(s.step,p.mapId);delete s.enemyVariant;s=M.act(s,'challenge');delete s.enemyVariant;assert(M.restore(JSON.stringify(s)));return s;}
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));
(async()=>{let browser;try{browser=await chromium.launch({channel:'msedge',headless:true});
 for(const [mode,width,height]of [['mobile',320,568],['mobile',390,844],['pc',1280,720]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:mode==='mobile',hasTouch:mode==='mobile',reducedMotion:'reduce'}),page=await ctx.newPage();page.on('pageerror',e=>result.errors.push(String(e)));page.setDefaultTimeout(20000);
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+(mode==='pc'?8781:8780)+'/');await page.waitForFunction(mode=>mode==='pc'?globalThis.__pmPC?.ready:globalThis.__pm?.ready,mode,{timeout:120000});
  await page.evaluate(async mode=>{globalThis.cc=await System.import('cc');const find=n=>n.components.find(c=>typeof c[mode==='pc'?'mapDetail':'adventureUI']==='function')||n.children.map(find).find(Boolean);globalThis.g=find(cc.director.getScene());g.clockSaveAt=Infinity;g.reduced=true;globalThis.auditPaint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},mode);
  for(const p of roster.pets)for(const rarity of M.RARITIES){await page.evaluate(async({s,mode})=>{g.state=s;if(mode==='pc')g.show('battle');else{await g.loadRegionArt(s.mapId);g.screen='game';g.render();}}, {s:fixture(p,rarity),mode});
   await page.waitForFunction(mode=>mode==='pc'?!__pmPC.busy()&&!g.art.pending:!g.busy&&!g.artCache.pending,mode);await page.evaluate(()=>auditPaint());
   const visual=await page.evaluate(mode=>{const width=cc.view.getVisibleSize().width,height=cc.view.getVisibleSize().height;
    const box=n=>{const t=n.getComponent(cc.UITransform),p=n.worldPosition,s=n.worldScale,w=t.width*Math.abs(s.x),h=t.height*Math.abs(s.y);return{x:p.x-t.anchorX*w,y:p.y-t.anchorY*h,w,h};};
    const part=side=>{const actor=mode==='pc'?(side==='player'?g.player:g.enemy):(side==='player'?g.playerNode:g.enemyNode),image=mode==='pc'?actor.children.find(n=>n.getComponent(cc.Sprite)):actor,sp=image.getComponent(cc.Sprite),bounds=box(image),screenClipped=bounds.x<-.5||bounds.y<-.5||bounds.x+bounds.w>width+.5||bounds.y+bounds.h>height+.5;return{bounds,frame:!!sp.spriteFrame,shiny:!!sp.customMaterial,screenClipped};};
    const player=part('player'),enemy=part('enemy'),hud=mode==='mobile'?box(g.root.getChildByName('enemy-hud')||g.enemyNode.getChildByName('enemy-hud')):null;
    const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    let controls=[];if(mode==='mobile')controls=Object.values(g.controls).filter(c=>c.node&&['attack','guard','heal','boost'].includes(c.node.name)).map(c=>box(c.node));
    return{visible:{width,height},player,enemy,hud,actorOverlap:overlap(player.bounds,enemy.bounds),hudOverEnemy:hud?overlap(hud,enemy.bounds):0,controls};},mode);
   assert(visual.player.frame&&visual.enemy.frame,'real frames resolve');assert(!visual.player.screenClipped&&!visual.enemy.screenClipped,'full silhouettes remain on screen');assert.equal(visual.actorOverlap,0,'opponents never cover each other');assert.equal(visual.hudOverEnemy,0,'enemy HUD clears its portrait');result.cases.push({mode,width,height,id:p.id,rarity,rank:M.PETS[p.id].rank,...visual});
   const capture=(rarity==='SSR'&&M.PETS[p.id].rank==='boss')||(rarity==='normal'&&['sundewcrown','sailfish','voltshark','rimestar'].includes(p.id));
   if(capture){const file=`${mode}-${width}-${p.id}-${rarity}.png`;await page.screenshot({path:path.join(out,file)});result.screenshots.push(file);}
  }
  save();console.log(`Measured 54 forms: ${mode} ${width}x${height}`);await ctx.close();
 }
 assert.equal(result.errors.length,0,'no runtime errors');result.status='complete';save();console.log('PASS rendered sprite bounds, separation and HUD clearance');console.log(JSON.stringify({cases:result.cases.length,clipped:result.cases.filter(c=>c.player.screenClipped||c.enemy.screenClipped).map(c=>[c.mode,c.width,c.id,c.rarity]),errors:result.errors}));
}finally{if(browser)await browser.close();save();}})().catch(e=>{result.status='error';result.errors.push(e.stack);save();console.error(e);process.exitCode=1;});
