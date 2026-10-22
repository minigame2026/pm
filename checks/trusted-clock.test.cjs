const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
function load(file){const e={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:e,Math,Date,JSON,Set,Promise,Number});return e;}
const C=load('assets/scripts/TrustedClock.ts'),M=load('assets/scripts/PMModel.ts'),T=1792396800000;
(async()=>{let mono=0,remote=T;const c=new C.TrustedClock(()=>mono,async()=>remote);assert.equal(c.now(),null);assert.equal(await c.sync(),true);M.setTimeProvider(()=>c.now()??NaN);
let s=M.syncStamina(M.fresh(55,['fox','turtle','bud']));s=M.enterExpedition(s,0);assert.equal(s.stamina.value,25);
s.eggs=[{id:'test-egg',rarity:'normal',affinity:'bud',stage:5,mapId:0}];s=M.startIncubation(s,'test-egg',0);assert.equal(s.incubators[0].startedAt,T);
s=M.assignPartySlot(s,s.pets[2].uid,0);s.pets[0].sex='female';s.pets[1].sex='male';s=M.startBreeding(s,s.pets[0].uid,s.pets[1].uid);assert.equal(s.breeding.startedAt,T);
const wall=Date.now;try{for(const jump of [86400000,-86400000,31536000000]){Date.now=()=>T+jump;assert.equal(M.syncStamina(s).stamina.value,25);assert.equal(M.claimHatch(s,0),s);assert.equal(M.claimBreeding(s),s);assert.equal(c.now(),T);}}finally{Date.now=wall;}
mono=120000;s=M.syncStamina(s);assert.equal(s.stamina.value,26);assert.equal(M.hatchRemaining(s.incubators[0]),480000);
const checkpoint=c.checkpoint();c.suspend();mono+=86400000;assert.equal(c.now(),null);assert.equal(M.claimHatch(s,0),s);assert.equal(M.claimBreeding(s),s);assert.equal(M.syncStamina(s),s);
const restart=new C.TrustedClock(()=>mono,async()=>{throw Error('offline');});restart.restore(checkpoint);M.setTimeProvider(()=>restart.now()??NaN);assert.equal(await restart.sync(),false);assert.equal(M.claimHatch(s,0),s);assert.equal(M.claimBreeding(s),s);assert.equal(M.enterExpedition(M.retreatExpedition(s),0).expedition,false);assert.ok(M.restore(JSON.stringify(M.retreatExpedition(s))),'offline retreat preserves valid save');
const later=new C.TrustedClock(()=>mono,async()=>T+3600000);later.restore(checkpoint);await later.sync();M.setTimeProvider(()=>later.now()??NaN);assert.equal(M.syncStamina(s).stamina.value,30);let hatched=M.claimHatch(s,0);assert.ok(hatched.pendingHatch);let bred=M.claimBreeding(s);assert.equal(bred.breeding,null);
const rollback=new C.TrustedClock(()=>mono,async()=>T-10000);rollback.restore(checkpoint);assert.equal(await rollback.sync(),false);assert.equal(rollback.now(),null);
mono+=C.CLOCK_LEASE_MS+1;assert.equal(later.now(),null);assert.equal(M.claimHatch(s,0),s);
console.log('PASS wall-clock forward/backward, monotonic recovery, offline fail-closed, restart, trusted offline settlement, rollback, lease expiry');
})().catch(e=>{console.error(e);process.exit(1);});
