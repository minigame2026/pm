const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const KEY='pm.creature-dice.v1',T=Date.now(),copy=s=>JSON.parse(JSON.stringify(s));
let base=M.fresh(102,['fox','turtle']);base.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};base=M.enterExpedition(M.syncStamina(base,T),0,T);base=M.act(base,'challenge');base.enemyMax=base.enemyHP=400;base.hpRatio=.6;
const comparable=s=>{const v=copy(s);delete v.trustedTime;delete v.checkpointSequence;return v;};
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pm-resume-'));let context,page;const errors=[];
 async function boot(){context=await chromium.launchPersistentContext(dir,{channel:'msedge',headless:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});await context.route('https://timeapi.io/**',r=>r.abort());await context.route('https://worldtimeapi.org/**',r=>r.abort());page=context.pages()[0];page.on('pageerror',e=>errors.push(String(e)));await page.goto(cfg.url+'?resume=check');await ready();}
 async function ready(){await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());});}
 async function seed(s){assert.ok(M.restore(JSON.stringify(s)));await page.evaluate(async s=>{g.state=s;g.screen='game';g.busy=false;g.render();await g.save();},s);}
 async function reopen(expected){await page.reload();await ready();await page.evaluate(()=>g.startFromCover());assert.equal(await page.evaluate(()=>__pm.screen()),'game','start must resume the saved expedition');const actual=await page.evaluate(()=>__pm.snapshot());assert.deepEqual(comparable(actual),comparable(expected));assert.equal(await page.evaluate(()=>__pm.animating()),false);}
 try{
  await boot();await seed(base);await reopen(base);
  for(const action of ['heal','boost','attack','guard']){
   await seed(base);const expected=M.act(base,action);assert.notEqual(expected,base);
   await page.evaluate(action=>g.command(action),action); // Reload while the visual animation is still running.
   const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.deepEqual(comparable(saved),comparable(expected));await reopen(expected);
   if(action==='heal'||action==='boost'){await page.evaluate(action=>g.command(action),action);assert.deepEqual(comparable(await page.evaluate(()=>__pm.snapshot())),comparable(expected),'used potion cannot be spent twice');}
  }
  const defeated=copy(base);defeated.hpRatio=.001;defeated.enemyAttack=99;const lost=M.act(defeated,'attack');assert.equal(lost.phase,'lost');await seed(lost);await reopen(lost);
  const weak=copy(base);weak.enemyHP=1;const reward=M.act(weak,'attack');assert.equal(reward.phase,'reward');await seed(reward);await reopen(reward);
  await page.evaluate(()=>g.command('take'));const claimed=await page.evaluate(()=>__pm.snapshot());await reopen(claimed);await page.evaluate(()=>g.command('take'));assert.deepEqual(comparable(await page.evaluate(()=>__pm.snapshot())),comparable(claimed),'reward cannot be claimed again');
  await seed(base);await page.evaluate(()=>g.command('boost'));const crashState=await page.evaluate(()=>__pm.snapshot());
  console.log('PASS reload, potion locks, reward and defeat; testing forced browser crash');
  const cdp=await context.browser().newBrowserCDPSession();const {processInfo}=await cdp.send('SystemInfo.getProcessInfo');const processId=processInfo.find(p=>p.type==='browser')?.id;assert.ok(Number.isInteger(processId));
  // Terminate only this isolated test browser and its children; no graceful close/save callback.
  require('child_process').execFileSync('taskkill',['/PID',String(processId),'/T','/F'],{windowsHide:true,stdio:'pipe'});context=null;
  await boot();await page.evaluate(()=>g.startFromCover());assert.equal(await page.evaluate(()=>__pm.screen()),'game');assert.deepEqual(comparable(await page.evaluate(()=>__pm.snapshot())),comparable(crashState),'browser process crash must retain committed action');
  await page.screenshot({path:'checks/battle-resume-390.png'});
  await page.evaluate(()=>g.goHome());const home=await page.evaluate(()=>__pm.snapshot());await page.reload();await ready();await page.evaluate(()=>g.startFromCover());assert.equal(await page.evaluate(()=>__pm.screen()),'home');assert.equal(home.expedition,false);
  assert.deepEqual(errors,[]);console.log('PASS battle/animation reload, potion locks, dice/HP/skill/RNG/stamina preserved, reward idempotence, defeat, actual browser process crash/restart, retreat stays home');
 }finally{if(context)await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
