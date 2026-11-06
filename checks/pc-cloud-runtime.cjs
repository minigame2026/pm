const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const NOW=Date.now(),OWNER='76561198000000001',KEY='pm.pc.creature-dice.v1.steam.'+OWNER,out='checks/pc-cloud-runtime';
M.setTimeProvider(()=>NOW);fs.mkdirSync(out,{recursive:true});const results=[],errors=[],screenshots=[];let browser,activePage;
function state(starter,seed){let s=M.chooseStarter(M.chooseHero(M.newJourney(seed),starter==='fox'?'ranger':'medic'),starter);s.expedition=false;s=M.syncStamina(s,NOW);assert(M.restore(JSON.stringify(s)));return s;}
function envelope(game,sequence){return JSON.stringify({...game,pcOwner:OWNER,pcSocial:{version:1,ownerSteamId:OWNER,friends:[],claimedRaidRuns:[],firstRaidClears:[],raidFragments:{},raidRedemptions:0,raidOrigins:[]},checkpointSequence:sequence});}
const localState=state('fox',314),cloudState=state('otter',718),cloudRaw=envelope(cloudState,500);
function progress(raw){const p=typeof raw==='string'?JSON.parse(raw):JSON.parse(JSON.stringify(raw));delete p.trustedTime;delete p.checkpointSequence;delete p.pcOwner;delete p.pcSocial;delete p.pcLegacyImported;return p;}
async function context({online=true,onboarding=false,width=1280,height=720}={}){
  const ctx=await browser.newContext({viewport:{width,height}});
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(NOW).toISOString().slice(0,-1)})}));
  await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await ctx.addInitScript(({online,onboarding,owner,key,local,cloud,now})=>{
    if(!sessionStorage.getItem('pc-cloud-fixture')){
      localStorage.setItem('pm.creature-dice.v1','MOBILE_SAVE_SENTINEL');
      if(online&&!onboarding)localStorage.setItem(key,local);
      if(!online)localStorage.setItem('pm.pc.creature-dice.v1',JSON.stringify((({pcOwner,pcSocial,checkpointSequence,...game})=>game)(JSON.parse(local))));
      sessionStorage.setItem('pc-cloud-fixture','1');
    }
    globalThis.pcCloudRemote=cloud;globalThis.pcCloudCalls=[];globalThis.pcCloudOnline=online;
    globalThis.__dicekinSteam={request(op,encoded){const args=JSON.parse(encoded),call={op,args};globalThis.pcCloudCalls.push(call);
      if(op==='status')return JSON.stringify({ok:true,data:{available:online,online,steamId:online?owner:'',name:'云档案测试账号',appId:5500200,overlayEnabled:online}});
      if(op==='time')return JSON.stringify({ok:true,data:{unixSeconds:Math.floor(now/1000)}});
      if(op==='friends')return JSON.stringify({ok:true,data:{friends:[]}});
      if(op==='cloud.read'){call.localRaw=localStorage.getItem(key);return JSON.stringify(globalThis.pcCloudRemote===null?{ok:false,error:'cloud_file_missing'}:{ok:true,data:{content:globalThis.pcCloudRemote}});}
      if(op==='cloud.write'){
        call.previousCloud=globalThis.pcCloudRemote;
        call.previousArchived=Object.keys(localStorage).some(k=>k.startsWith(key+'.archive-cloud-upload.')&&localStorage.getItem(k)===globalThis.pcCloudRemote);
        globalThis.pcCloudRemote=args.content;return JSON.stringify({ok:true});
      }
      return JSON.stringify({ok:true,data:{}});
    },poll(){return '[]';}};
  },{online,onboarding,owner:OWNER,key:KEY,local:envelope(localState,1),cloud:cloudRaw,now:NOW});
  const p=await ctx.newPage();activePage=p;p.on('pageerror',e=>errors.push(String(e)));
  await p.goto('http://127.0.0.1:8781/');await p.waitForFunction(()=>globalThis.__pmPC?.ready&&__pmPC.timeReady(),null,{timeout:60000});
  assert.equal(await p.evaluate(()=>__pmPC.version),'pc-steam-0.2');
  await p.evaluate(async()=>{globalThis.pcCC=await System.import('cc');function find(n){const g=n.components.find(c=>typeof c.cloudProfile==='function');if(g)return g;for(const child of n.children){const g=find(child);if(g)return g;}}globalThis.pcGame=find(pcCC.director.getScene());});
  await wait(p);
  if(online&&!onboarding){assert.equal(await p.evaluate(()=>pcGame.cloudConflict),true,'divergent startup blocks automatic overwrite');assert.equal((await counts(p)).writes,0);assert.match(await labels(p),/云端与本机进度不同/);await shot(p,'startup-conflict');await p.evaluate(()=>{pcGame.closeDialog(false);pcCloudCalls=[];});}
  return {ctx,p};
}
async function wait(p){await p.waitForFunction(()=>!__pmPC.busy()&&!pcGame.closingModal,null,{timeout:10000});await p.waitForTimeout(200);}
async function click(p,id,allowDisabled=false){await wait(p);const point=await p.evaluate(({id,allowDisabled})=>{const c=__pmPC.controls()[id],v=__pmPC.resolution().visible,b=document.querySelector('canvas').getBoundingClientRect();if(!c||(!allowDisabled&&!c.enabled))throw Error('Unavailable control '+id);return{x:b.left+(b.width-v.width*Math.min(b.width/v.width,b.height/v.height))/2+c.x*Math.min(b.width/v.width,b.height/v.height),y:b.top+(b.height-v.height*Math.min(b.width/v.width,b.height/v.height))/2+c.y*Math.min(b.width/v.width,b.height/v.height)};},{id,allowDisabled});await p.mouse.click(point.x,point.y);await wait(p);}
async function labels(p){return p.evaluate(()=>pcGame.root.getComponentsInChildren(pcCC.Label).filter(l=>l.node.activeInHierarchy).map(l=>l.string).join('\n'));}
async function shot(p,name){await p.waitForTimeout(220);await p.screenshot({path:`${out}/${name}.png`});screenshots.push(name+'.png');}
async function cloudMenu(p){await click(p,'settings');await click(p,'cloud-profile');assert.match(await labels(p),/Steam 云档案/);}
async function saved(p){return p.evaluate(key=>localStorage.getItem(key),KEY);}
async function counts(p){return p.evaluate(()=>({reads:pcCloudCalls.filter(c=>c.op==='cloud.read').length,writes:pcCloudCalls.filter(c=>c.op==='cloud.write').length}));}
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});try{
  const {ctx,p}=await context();assert.equal(await p.evaluate(()=>__pmPC.route()),'home');
  await click(p,'settings');await shot(p,'settings-entry-720p');await click(p,'cloud-profile');await shot(p,'cloud-menu-720p');
  assert.deepEqual(await counts(p),{reads:0,writes:0},'opening cloud menu does not access or replace cloud contents');
  const beforeUpload=await saved(p);
  await click(p,'cloud-upload');assert.match(await labels(p),/确认备份/);await shot(p,'upload-confirm-720p');
  assert.deepEqual(await counts(p),{reads:0,writes:0},'upload must wait for explicit confirmation');
  await click(p,'dialog-close');assert.deepEqual(await counts(p),{reads:0,writes:0});assert.deepEqual(progress(await saved(p)),progress(beforeUpload),'cancelling upload preserves local progress');
  await cloudMenu(p);await click(p,'cloud-upload');await click(p,'dialog-confirm');
  await p.waitForFunction(()=>pcCloudCalls.some(c=>c.op==='cloud.write'));
  const uploaded=await p.evaluate(()=>({raw:pcCloudRemote,calls:pcCloudCalls.filter(c=>c.op.startsWith('cloud.'))}));
  assert.equal(uploaded.calls.length,2);assert.equal(uploaded.calls[0].op,'cloud.read');assert.equal(uploaded.calls[1].op,'cloud.write');assert(uploaded.calls[1].previousArchived,'old cloud original must already be archived when upload starts');
  assert.equal(uploaded.calls[1].previousCloud,cloudRaw);assert.equal(uploaded.calls[1].args.name,'save-'+OWNER+'.json');assert.equal(JSON.parse(uploaded.raw).active.id,'fox');
  assert(await p.evaluate(({key,raw})=>Object.keys(localStorage).some(k=>k.startsWith(key+'.archive-cloud-upload.')&&localStorage.getItem(k)===raw),{key:KEY,raw:cloudRaw}));
  results.push('settings entry, upload confirmation/cancel and old cloud archive before replacement');

  await p.evaluate(raw=>pcCloudRemote=raw,cloudRaw);await cloudMenu(p);const beforeRead=await saved(p),gameBeforeRead=await p.evaluate(()=>__pmPC.snapshot());
  await click(p,'cloud-read');assert.match(await labels(p),/确认恢复/);await shot(p,'restore-preview-720p');
  assert.deepEqual(progress(await p.evaluate(()=>__pmPC.snapshot())),progress(gameBeforeRead),'reading only previews cloud, without loading it');
  assert.deepEqual(progress(await saved(p)),progress(beforeRead));assert.equal(await p.evaluate(()=>pcCloudRemote),cloudRaw);
  await click(p,'dialog-close');assert.deepEqual(progress(await saved(p)),progress(beforeRead),'cancelling restore preserves local progress');
  assert.equal(await p.evaluate(key=>Object.keys(localStorage).filter(k=>k.startsWith(key+'.before-cloud.')).length,KEY),0,'cancel does not create restoration archives');
  results.push('cloud read and restore cancellation leave local and cloud progress unchanged');

  await cloudMenu(p);await click(p,'cloud-read');const beforeRestoreRaw=await saved(p);await click(p,'dialog-confirm');
  await p.waitForFunction(()=>__pmPC.snapshot().active.id==='otter'&&!pcGame.modal);await shot(p,'restored-home-720p');
  const restored=JSON.parse(await saved(p));assert(restored.checkpointSequence>500);assert.equal(restored.pcOwner,OWNER);assert.equal(restored.pcSocial.ownerSteamId,OWNER);
  const archives=await p.evaluate(key=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith(key+'.before-cloud.')||k.startsWith(key+'.cloud-source.')).map(k=>[k,localStorage.getItem(k)])),KEY);
  const localArchive=Object.entries(archives).find(([key])=>key.includes('.before-cloud.')),sourceArchive=Object.entries(archives).find(([key])=>key.includes('.cloud-source.'));
  assert(localArchive&&sourceArchive);assert.equal(JSON.parse(localArchive[1]).primaryRaw,beforeRestoreRaw,'restore archives exact original local file');assert.equal(sourceArchive[1],cloudRaw,'restore archives exact original cloud file');
  assert.equal(JSON.parse(await p.evaluate(()=>pcCloudRemote)).active.id,'otter','automatic sync after restore retains the selected cloud progress');assert(M.restore(await saved(p)));
  assert.equal(await p.evaluate(()=>localStorage.getItem('pm.creature-dice.v1')),'MOBILE_SAVE_SENTINEL');
  results.push('confirmed restore replaces progress, retains both exact originals and advances sequence beyond both');await ctx.close();

  const offline=await context({online:false});await cloudMenu(offline.p);await shot(offline.p,'offline-cloud-disabled-720p');
  const disabled=await offline.p.evaluate(()=>({upload:__pmPC.controls()['cloud-upload'].enabled,read:__pmPC.controls()['cloud-read'].enabled}));assert.deepEqual(disabled,{upload:false,read:false});
  await click(offline.p,'cloud-upload',true);await click(offline.p,'cloud-read',true);assert.deepEqual(await counts(offline.p),{reads:0,writes:0});assert.match(await labels(offline.p),/请先登录 Steam/);await offline.ctx.close();
  results.push('offline cloud buttons remain disabled and issue no cloud operations');

  const onboarding=await context({onboarding:true,width:1920,height:1080});assert.equal(await onboarding.p.evaluate(()=>__pmPC.route()),'home');
  assert.equal(await onboarding.p.evaluate(()=>__pmPC.snapshot().active.id),'otter');await cloudMenu(onboarding.p);await shot(onboarding.p,'automatic-cloud-restore-1080p');
  assert(await onboarding.p.evaluate(key=>Object.keys(localStorage).some(k=>k.startsWith(key+'.cloud-source.')),KEY));await onboarding.ctx.close();
  results.push('new Steam installation automatically resumes the existing cloud profile and retains the source backup');
  assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(`${out}/report.json`,JSON.stringify({results,errors,screenshots,platform:'Cocos web-desktop, Edge; injected Steam bridge',realSteamCloud:false,checkedAt:new Date().toISOString()},null,2));console.log(JSON.stringify({passed:results.length,results},null,2));
}catch(e){if(activePage&&!activePage.isClosed())await activePage.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw e;}finally{await browser.close();}})().catch(e=>{fs.writeFileSync(`${out}/failure.txt`,String(e.stack));console.error(e);process.exitCode=1;});
