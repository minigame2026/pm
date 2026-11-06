const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={},R={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
vm.runInNewContext(ts.transpileModule(fs.readFileSync('pc/game/PCRaid.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:R,Math,JSON,Set,Map});
const NOW=Date.now(),out='checks/pc-online-runtime';M.setTimeProvider(()=>NOW);fs.mkdirSync(out,{recursive:true});
const results=[],errors=[],screenshots=[];let browser,activePage;
function fixture(){
  let s=M.chooseStarter(M.chooseHero(M.newJourney(917),'ranger'),'fox');
  for(const [index,id]of ['bud','otter'].entries()){
    const eggId='pc-online-fixture-'+id;s.eggs.push({id:eggId,rarity:'normal',affinity:id,stage:5,mapId:0});
    s=M.startIncubation(s,eggId,0,NOW-3600000);s=M.claimHatch(s,0,NOW);const uid=s.pendingHatch.uid;
    s=M.acknowledgeHatch(s);s=M.assignPartySlot(s,uid,index+1);
  }
  s.expedition=false;s=M.syncStamina(s,NOW);assert(M.restore(JSON.stringify(s)));return s;
}
async function context(width,height,mockSteam=false,state=fixture()){
  const ctx=await browser.newContext({viewport:{width,height}});
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(NOW).toISOString().slice(0,-1)})}));
  await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await ctx.addInitScript(({state,mockSteam,now,raidVersion})=>{
    if(!sessionStorage.getItem('pc-online-fixture')){
      localStorage.setItem('pm.pc.creature-dice.v1',JSON.stringify(state));localStorage.setItem('pm.creature-dice.v1','MOBILE_SAVE_SENTINEL');
      if(mockSteam){const owner='76561198000000001';localStorage.setItem('pm.pc.creature-dice.v1.steam.'+owner,JSON.stringify({...state,pcOwner:owner,pcSocial:{version:1,ownerSteamId:owner,friends:[],claimedRaidRuns:[],firstRaidClears:[],raidFragments:{},raidRedemptions:0,raidOrigins:[]},checkpointSequence:1}));}
      sessionStorage.setItem('pc-online-fixture','1');
    }
    if(mockSteam){
      const owner='76561198000000001';globalThis.pcMockEvents=[];globalThis.pcMockCalls=[];
      globalThis.pcMockFriends=Array.from({length:6},(_,i)=>({steamId:'7656119800000000'+(i+2),name:['阿青','同行旅人','远山','小雨','星夜','第六位旅伴'][i],inGame:i%2===0}));
      globalThis.__dicekinSteam={request(op,args){globalThis.pcMockCalls.push({op,args:JSON.parse(args)});let data={};
        if(op==='status')data={available:true,steamId:owner,name:'界面测试账号',appId:5500200,online:true,overlayEnabled:true};
        else if(op==='time')data={unixSeconds:Math.floor(now/1000)};
        else if(op==='friends')data={friends:globalThis.pcMockFriends};
        else if(op==='leaderboard.query')data={entries:[]};
        else if(op==='lobby.create')data={lobbyId:'109775241234567890',ownerId:owner,members:[{steamId:owner,name:'界面测试账号'}],metadata:{version:raidVersion,tier:'1',ranked:'0'}};
        return JSON.stringify({ok:true,data});},poll(){return JSON.stringify(globalThis.pcMockEvents.splice(0));}};
    }
  },{state,mockSteam,now:NOW,raidVersion:R.RAID_VERSION});
  const p=await ctx.newPage();activePage=p;p.on('pageerror',e=>errors.push(String(e)));
  await p.goto('http://127.0.0.1:8781/');await p.waitForFunction(()=>globalThis.__pmPC?.ready&&__pmPC.timeReady(),null,{timeout:60000});
  assert.equal(await p.evaluate(()=>__pmPC.version),'pc-steam-0.2');assert.equal(await p.evaluate(()=>__pmPC.route()),'home');
  await p.evaluate(async()=>{globalThis.pcCC=await System.import('cc');function find(n){const game=n.components.find(c=>typeof c.onlinePage==='function');if(game)return game;for(const child of n.children){const found=find(child);if(found)return found;}}globalThis.pcGame=find(pcCC.director.getScene());});
  await wait(p);return {ctx,p};
}
async function wait(p){await p.waitForFunction(()=>!__pmPC.busy(),null,{timeout:15000});await p.waitForTimeout(180);}
async function click(p,id){await wait(p);const point=await p.evaluate(id=>{const c=__pmPC.controls()[id],v=__pmPC.resolution().visible,b=document.querySelector('canvas').getBoundingClientRect();if(!c||!c.enabled)throw Error('Missing or disabled control '+id);return{x:b.left+(b.width-v.width*Math.min(b.width/v.width,b.height/v.height))/2+c.x*Math.min(b.width/v.width,b.height/v.height),y:b.top+(b.height-v.height*Math.min(b.width/v.width,b.height/v.height))/2+c.y*Math.min(b.width/v.width,b.height/v.height)};},id);await p.mouse.click(point.x,point.y);await wait(p);}
async function route(p,name){await p.waitForFunction(r=>__pmPC.route()===r,name,{timeout:10000});}
async function labels(p){return p.evaluate(()=>pcGame.root.getComponentsInChildren(pcCC.Label).filter(l=>l.node.activeInHierarchy).map(l=>l.string).join('\n'));}
async function shot(p,name){await p.waitForTimeout(400);await p.screenshot({path:`${out}/${name}.png`});screenshots.push(name+'.png');}
async function navFits(p){const bad=await p.evaluate(()=>{const v=__pmPC.resolution().visible;return Object.entries(__pmPC.controls()).filter(([id])=>id.startsWith('nav-')).filter(([,c])=>c.x-c.w/2<0||c.y-c.h/2<0||c.x+c.w/2>v.width||c.y+c.h/2>v.height).map(([id])=>id);});assert.deepEqual(bad,[],'all nine navigation buttons must fit');}
async function story(p){return p.evaluate(()=>{const s=__pmPC.snapshot();delete s.trustedTime;delete s.pcCooking;return JSON.stringify(s);});}
async function raidState(p){return p.evaluate(()=>__pmPC.online().raid);}
async function action(p,id){const before=(await raidState(p)).roundsCompleted;await click(p,id);await click(p,'primary');await p.waitForFunction(n=>__pmPC.online().raid.roundsCompleted>n,before,{timeout:15000});await wait(p);}
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const [width,height]of (process.argv.includes('--mock-only')?[]:[[1280,720],[1920,1080]])){
    const {ctx,p}=await context(width,height),suffix=height+'p';
    assert.equal(await p.evaluate(()=>__pmPC.online().status.available),false,'browser must not claim Steam authentication');
    await navFits(p);await shot(p,'home-'+suffix);
    await click(p,'nav-social');await route(p,'social');await navFits(p);assert.match(await labels(p),/启动 Steam 并登录/);
    const onlineButtons=await p.evaluate(()=>Object.fromEntries(['steam-invite','steam-store'].map(id=>[id,__pmPC.controls()[id]?.enabled])));
    assert.equal(onlineButtons['steam-invite'],false);assert.equal(onlineButtons['steam-store'],false);await shot(p,'social-'+suffix);
    await click(p,'legacy-postcards');await route(p,'postcards');assert((await p.evaluate(()=>Object.keys(__pmPC.controls()))).includes('receive-code'));await shot(p,'postcards-'+suffix);
    await click(p,'nav-raids');await route(p,'raids');await navFits(p);assert.equal(await p.evaluate(()=>__pmPC.controls()['create-room'].enabled),false);await shot(p,'lobby-'+suffix);
    const initialStory=await story(p),initialSocial=await p.evaluate(()=>JSON.stringify(__pmPC.online().social));
    await click(p,'solo-trial');await route(p,'raidbattle');await p.waitForTimeout(350);
    let run=await raidState(p);assert.equal(run.playerCount,1);assert.equal(run.players[0].pets.length,3);await shot(p,'battle-'+suffix);
    const controls=await p.evaluate(()=>Object.fromEntries(['raid-attack','raid-guard','raid-heal','raid-boost','primary'].map(id=>[id,__pmPC.controls()[id].nodeId])));
    const commandSlots=await p.evaluate(()=>['raid-attack','raid-guard','raid-heal','raid-boost','raid-taunt','primary'].map(id=>__pmPC.controls()[id]));for(const c of commandSlots)assert(c.x-c.w/2>=800&&c.x+c.w/2<=1600&&c.y+c.h/2<=900,'raid commands fit on the right');for(let i=0;i<commandSlots.length;i++)for(let j=i+1;j<commandSlots.length;j++){const a=commandSlots[i],b=commandSlots[j];assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2,'raid command hit regions do not overlap');}
    if(width===1280){
      for(const id of ['raid-guard','raid-heal','raid-boost','raid-attack','raid-switch-1']){
        assert.equal((await raidState(p)).status,'planning');await action(p,id);
        assert.deepEqual(await p.evaluate(()=>Object.fromEntries(['raid-attack','raid-guard','raid-heal','raid-boost','primary'].map(id=>[id,__pmPC.controls()[id].nodeId]))),controls,'round updates must preserve battle controls');
      }
      await shot(p,'battle-after-actions-'+suffix);
      let turns=5;
      while((run=await raidState(p)).status==='planning'&&turns<100){
        const me=run.players[0],living=me.pets.findIndex(q=>q.hp>0);let id='raid-attack';
        if(me.pets[me.activePet].hp<=0)id='raid-switch-'+living;
        else if(me.pets[me.activePet].hp<me.pets[me.activePet].maxHP*.35&&me.stocks.heals>0)id='raid-heal';
        await action(p,id);turns++;
      }
      assert(turns<100&&['won','lost'].includes(run.status),'solo trial must finish through actual pointer input');await shot(p,'result-'+suffix);
      assert.match(await labels(p),run.status==='won'?/单人试炼不掉落副本专属蛋/:/调整队伍，再来挑战/);await click(p,'primary');await route(p,'raids');
      results.push('720p real solo trial: switch, guard, heal, boost, attack, ready, persistent controls, terminal '+run.status+' in '+run.roundsCompleted+' rounds');
    }else{await action(p,'raid-guard');const sameRun=(await raidState(p)).runId;await click(p,'raid-back');await route(p,'home');await click(p,'nav-raids');await click(p,'primary');await route(p,'raidbattle');assert.equal((await raidState(p)).runId,sameRun);await click(p,'raid-abort');await route(p,'raids');results.push('1080p live solo round, camp return/resume and explicit abort');}
    assert.equal(await story(p),initialStory,'raid must not alter the saved story encounter, pet health, supplies, stamina or eggs');
    if(width===1280)assert.equal(await p.evaluate(()=>__pmPC.snapshot().pcCooking.receipts.filter(id=>id.startsWith('raid:')).length),1,'finished trial settles its shared food duration exactly once');
    assert.equal(await p.evaluate(()=>JSON.stringify(__pmPC.online().social)),initialSocial,'solo trial cannot grant exclusive raid loot');
    await click(p,'nav-ladder');await route(p,'ladder');await navFits(p);assert.match(await labels(p),/启动 Steam 并登录/);await shot(p,'ladder-'+suffix);
    for(const id of ['board-size-2','board-size-3','board-size-4','board-global','board-season'])await click(p,id);
    for(const id of ['nav-social','nav-raids','nav-ladder','nav-partners','nav-home','nav-social','nav-ladder'])await click(p,id);
    await navFits(p);assert.equal(await p.evaluate(()=>localStorage.getItem('pm.creature-dice.v1')),'MOBILE_SAVE_SENTINEL');
    if(width===1920){for(const size of [{width:1280,height:800},{width:2560,height:1080},{width:1280,height:720}]){await p.setViewportSize(size);await p.waitForTimeout(400);await click(p,'nav-raids');await navFits(p);await shot(p,'resize-'+size.width+'x'+size.height);await click(p,'nav-ladder');}results.push('live 16:10, ultrawide and 720p resize with actual navigation');}
    await ctx.close();results.push(suffix+' social, offline gating, legacy postcards, lobby, ladder filters and repeated navigation');
  }
  // Empty party slots must not manufacture fallback pets or prevent a fresh player from trying a raid.
  const single=M.chooseStarter(M.chooseHero(M.newJourney(145),'ranger'),'fox');
  const fresh=await context(1280,720,false,single),fp=fresh.p;await click(fp,'nav-raids');await click(fp,'solo-trial');await route(fp,'raidbattle');
  assert.equal((await raidState(fp)).players[0].pets.length,1,'one owned pet remains exactly one raid pet');
  await click(fp,'raid-attack');
  const point=await fp.evaluate(()=>{const c=__pmPC.controls().primary,v=__pmPC.resolution().visible,b=document.querySelector('canvas').getBoundingClientRect();return{x:b.left+(b.width-v.width*Math.min(b.width/v.width,b.height/v.height))/2+c.x*Math.min(b.width/v.width,b.height/v.height),y:b.top+(b.height-v.height*Math.min(b.width/v.width,b.height/v.height))/2+c.y*Math.min(b.width/v.width,b.height/v.height)};});
  await fp.mouse.click(point.x,point.y);await fp.waitForFunction(()=>pcGame.onlineUI.animating);
  assert.equal(await fp.evaluate(()=>__pmPC.controls().primary.enabled),false,'semantic playback blocks next-round confirmation');
  const settledRound=(await raidState(fp)).roundsCompleted;await fp.keyboard.press('Enter');assert.equal((await raidState(fp)).roundsCompleted,settledRound,'Enter shares playback barrier');await wait(fp);await fresh.ctx.close();results.push('fresh one-pet trial and shared pointer/keyboard semantic playback barrier');
  // This injected boundary verifies UI callbacks only; it is not Steam authentication or networking.
  const mocked=await context(1280,720,true),mp=mocked.p;
  await click(mp,'nav-social');await mp.waitForFunction(()=>pcGame.online.friends.length===6);await shot(mp,'mock-steam-friends-720p');
  assert.match(await labels(mp),/阿青/,'asynchronously loaded Steam friends must appear without changing page');
  await click(mp,'next');assert.match(await labels(mp),/第六位旅伴/);await click(mp,'prev');
  await mp.evaluate(()=>{pcMockFriends[0].name='阿青已更新';});await click(mp,'steam-refresh');assert.match(await labels(mp),/阿青已更新/,'manual friend refresh updates visible rows');
  await click(mp,'steam-invite');await mp.waitForFunction(()=>!!pcGame.online.lobby);await click(mp,'nav-raids');await shot(mp,'mock-steam-room-720p');
  assert.match(await labels(mp),/你是房主/);await click(mp,'room-ready');assert.equal(await mp.evaluate(()=>pcGame.online.ready['76561198000000001']),true);
  assert.equal(await mp.evaluate(()=>__pmPC.controls().primary.enabled),false,'one-player friend room cannot start multiplayer');
  await mp.evaluate(()=>pcMockEvents.push({type:'overlay',active:true}));await mp.waitForFunction(()=>pcGame.online.overlayActive);
  await click(mp,'nav-home');assert.equal(await mp.evaluate(()=>__pmPC.route()),'raids','Steam overlay blocks underlying game input');
  await mp.evaluate(()=>pcMockEvents.push({type:'overlay',active:false}));await mp.waitForFunction(()=>!pcGame.online.overlayActive);await click(mp,'nav-home');await route(mp,'home');
  await mocked.ctx.close();results.push('injected Steam boundary only: asynchronous friend list/refresh, pagination, room readiness and Overlay input barrier');
  assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(`${out}/report.json`,JSON.stringify({results,errors,screenshots,platform:'Cocos web-desktop, Edge',nativeSteam:false,checkedAt:new Date().toISOString()},null,2));console.log(JSON.stringify({passed:results.length,results},null,2));
}finally{await browser.close();}})().catch(async e=>{fs.writeFileSync(`${out}/failure.txt`,String(e.stack));console.error(e);process.exitCode=1;});
