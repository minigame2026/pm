const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
for(const name of ['PMModel','PMTranslations','PMLocale']){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:p=>modules[p.replace('./','')],Math,Date,JSON,Set,Map,RegExp});modules[name]=exports;}
const M=modules.PMModel,L=modules.PMLocale,T=Date.now();
const seed=M.fresh(71,['fox','turtle','bud']);seed.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};
seed.eggs=[{id:'locale-egg',rarity:'normal',affinity:'bud',stage:5,mapId:0}];
const state=M.startIncubation(seed,'locale-egg',0,T);assert(state.incubators[0]);
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const lang of (process.env.PM_LOCALE_ONLY?[process.env.PM_LOCALE_ONLY]:['en','ja','ko','zh-TW','th','zh-CN','pt-BR','es-419','id','vi','de','fr'])){
  L.selectLanguage(lang,'en');const c=await b.newContext({viewport:{width:390,height:844},locale:lang}),p=await c.newPage();
  await c.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));
  await c.route('https://worldtimeapi.org/**',r=>r.abort());
  await p.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);
  await p.goto(cfg.url);await p.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  await p.evaluate(async state=>{const cc=await System.import('cc');function walk(n){const g=n.components.find(c=>typeof c.hatchery==='function');if(g)return g;for(const ch of n.children){const g=walk(ch);if(g)return g;}}globalThis.g=walk(cc.director.getScene());g.clockUiRefresh=false;g.state=state;globalThis.testTime=state.incubators[0].readyAt;g.trustedClock.now=()=>testTime;g.hatchery();},state);
  await p.waitForTimeout(1250);
  assert.equal(await p.evaluate(()=>g.hatchClock[0].label.string),L.tr('可以破壳啦！'),lang+' ready timer must stay translated');
  await p.screenshot({path:`checks/locale-hatch-ready-${lang}.png`});
  await p.evaluate(()=>{testTime=null;g.hatchery();});
  await p.waitForTimeout(1100);
  assert.equal(await p.evaluate(()=>g.hatchClock[0].label.string),L.tr('等待联网'),lang+' offline timer must stay translated');
  await p.evaluate(()=>{testTime=g.state.incubators[0].readyAt-5000;g.hatchery();});
  await p.waitForTimeout(1100);assert.equal(await p.evaluate(()=>g.hatchClock[0].label.string),'00:05');
  await p.evaluate(()=>{testTime=g.state.incubators[0].readyAt;});
  await p.waitForTimeout(1250);
  assert.equal(await p.evaluate(()=>g.hatchClock[0].label.string),L.tr('可以破壳啦！'),lang+' countdown expiry must stay translated');
  const parents=state.pets.slice(1);parents[0].sex='female';parents[1].sex='male';const breeding=M.startBreeding(state,parents[0].uid,parents[1].uid,T);
  await p.evaluate(s=>{g.state=s;testTime=null;g.breedingUI();},breeding);await p.waitForTimeout(1100);
  assert.equal(await p.evaluate(()=>g.breedClock.string),L.tr('等待联网'),lang+' breeding offline label');
  if(lang==='en'){
   const battle=M.act(M.fresh(71,['fox','turtle','bud']),'challenge');
   await p.evaluate(s=>{g.state=s;g.screen='game';g.render();},battle);
   assert.equal(await p.evaluate(()=>g.root.children.some(n=>n.name.startsWith('battle-reserve-'))),false);
   await p.waitForTimeout(300);await p.screenshot({path:'checks/battle-no-reserve-390.png'});
  }
  console.log('PASS',lang,'ready/offline/countdown expiry and breeding timer across update ticks');await c.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
