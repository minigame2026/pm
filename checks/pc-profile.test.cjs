const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),cache={};
function load(name){
  if(cache[name])return cache[name];
  const out=cache[name]={},file=(name.startsWith('PC')?'pc/game/':'assets/scripts/')+name+'.ts';
  assert(fs.existsSync(file),'PC profile module must exist');
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,target:4}}).outputText,
    {exports:out,require:p=>load(p.replace('./','')),Math,Date,JSON,Set,Map,encodeURIComponent,decodeURIComponent});
  return out;
}
const M=load('PMModel'),S=load('PCSocial'),P=load('PCProfile'),copy=v=>JSON.parse(JSON.stringify(v));
const a='76561198000000001',b='76561198000000002',keyA=S.accountSaveKey(a),keyB=S.accountSaveKey(b),localKey=S.accountSaveKey('local');
const legacyKey='pm.pc.creature-dice.v1',legacy=M.act(M.fresh(43),'challenge'),rawLegacy=JSON.stringify(legacy);
class Store{
  constructor(){this.values=new Map();this.writes=[];this.failKey='';}
  getItem(k){return this.values.get(k)??null;}
  setItem(k,v){if(k===this.failKey)throw new Error('quota');this.values.set(k,v);this.writes.push(k);}
}
const store=new Store();store.setItem(legacyKey,rawLegacy);
let loaded=P.loadPCProfile(store,a);
assert.equal(loaded.game,null,'Steam cannot automatically import old offline save');assert(loaded.legacyAvailable);
assert.equal(loaded.sequence,0);assert.equal(loaded.error,undefined);assert.equal(loaded.readOnly,false);
assert.equal(store.getItem(keyA),null);
const local=P.loadPCProfile(store,'local');
assert(local.game);assert.equal(local.game.phase,legacy.phase);assert.equal(local.sequence,1);
assert(store.getItem(localKey));assert.equal(store.getItem(legacyKey),rawLegacy,'migration never changes original');
assert.equal(JSON.parse(store.getItem(localKey)).pcOwner,'local');

const journey=M.newJourney(2),socialA=S.newPCSocial(a),socialB=S.newPCSocial(b);
assert(P.savePCProfile(store,a,journey,socialA,1));
const savedA=store.getItem(keyA);
assert.equal(JSON.parse(savedA).version,1,'model stays top-level for legacy readers');
assert(M.restore(savedA));
assert.equal(P.savePCProfile(store,a,journey,socialA,1),false,'same checkpoint rejected');
assert.equal(P.savePCProfile(store,a,journey,socialA,0),false,'stale checkpoint rejected');
assert.equal(P.savePCProfile(store,a,journey,socialB,2),false,'cross-account social rejected');
assert.equal(P.loadPCProfile(store,b).game,null,'account B stays independent');
assert(P.savePCProfile(store,b,M.newJourney(99),socialB,1));
assert.equal(P.loadPCProfile(store,b).game.seed,M.newJourney(99).seed);assert.equal(store.getItem(keyA),savedA);

let imported=P.importLegacyPCProfile(store,a);
assert(imported.game&&!imported.error);assert.equal(imported.sequence,2);
assert.equal(imported.game.phase,'battle');assert.equal(imported.social.ownerSteamId,a);
assert.equal(store.getItem(legacyKey),rawLegacy);assert.equal(store.getItem(keyA+'.legacy-source'),rawLegacy);
assert.equal(store.getItem(keyA+'.backup'),savedA,'pre-import account snapshot is retained');
assert.equal(P.importLegacyPCProfile(store,a).readOnly,true,'existing progress cannot be replaced');
assert(P.savePCProfile(store,a,imported.game,imported.social,3));
assert.equal(JSON.parse(store.getItem(keyA)).pcLegacyImported,true,'one-time import marker persists');

const backupBefore=store.getItem(keyA+'.backup');
store.setItem(keyA,'{bad json');
let recovered=P.loadPCProfile(store,a);
assert(recovered.game&&!recovered.error&&recovered.recoveredFromBackup);assert.equal(recovered.sequence,2);
assert(P.savePCProfile(store,a,recovered.game,recovered.social,4));
assert.equal(store.getItem(keyA+'.backup'),backupBefore,'corrupt primary never replaces valid backup');
assert.equal(P.loadPCProfile(store,a).sequence,4);

const both=new Store(),badEnvelope=JSON.parse(store.getItem(keyA));delete badEnvelope.pcSocial;
both.setItem(keyA,JSON.stringify(badEnvelope));
const badRaw=both.getItem(keyA),writeCount=both.writes.length;
const failed=P.loadPCProfile(both,a);
assert(failed.error&&failed.readOnly);assert.equal(failed.game,null,'missing reward ledger blocks load');
assert.equal(P.savePCProfile(both,a,journey,socialA,9),false);assert.equal(both.getItem(keyA),badRaw);
assert.equal(both.writes.length,writeCount,'corruption neither resets nor overwrites');
both.setItem(keyA+'.backup',store.getItem(keyB));
assert(P.loadPCProfile(both,a).error,'other-account backup cannot recover this profile');
assert.equal(P.importLegacyPCProfile(both,a).readOnly,true);

const blankLegacy=new Store();blankLegacy.setItem(legacyKey,JSON.stringify(M.newJourney(7)));
assert(P.importLegacyPCProfile(blankLegacy,a).game);
assert(P.importLegacyPCProfile(blankLegacy,a).error,'onboarding import is also one-time');
const quota=new Store();quota.setItem(legacyKey,rawLegacy);quota.failKey=localKey;
const quotaLoad=P.loadPCProfile(quota,'local');assert(quotaLoad.error&&quotaLoad.readOnly);
assert.equal(quota.getItem(legacyKey),rawLegacy);
const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
assert(P.loadPCProfile(denied,a).readOnly);assert.equal(P.savePCProfile(denied,a,journey,socialA,1),false);
const corruptLegacy=new Store();corruptLegacy.setItem(legacyKey,'broken');
assert(P.loadPCProfile(corruptLegacy,'local').error);assert.equal(P.savePCProfile(corruptLegacy,'local',journey,S.newPCSocial('local'),1),false);
assert.equal(P.loadPCProfile(corruptLegacy,a).error,undefined,'broken offline save does not block an unrelated new Steam account');
const atomic=new Store(),original=M.fresh(41);
assert(P.savePCProfile(atomic,a,original,socialA,1));
const grant=S.bondFriend(original,socialA,{steamId:b,name:'同行者',pet:M.fresh(42).pets[0]},1800000000000);
atomic.failKey=keyA;
assert.equal(P.savePCProfile(atomic,a,grant.game,grant.social,2),false);
const unchanged=P.loadPCProfile(atomic,a);
assert.equal(unchanged.game.eggs.length,0);assert.equal(unchanged.social.friends.length,0,'failed save retains matching old game and ledger');
atomic.failKey='';assert(P.savePCProfile(atomic,a,grant.game,grant.social,3));
const committed=P.loadPCProfile(atomic,a);
assert.equal(committed.game.eggs.length,1);assert.equal(committed.social.friends.length,1,'reward and receipt commit together');
assert.equal(S.bondFriend(committed.game,committed.social,{steamId:b,name:'同行者',pet:M.fresh(42).pets[0]},1800000000001).changed,false);
assert.equal(typeof P.exportPCProfile,'function','cloud export must be available');
const exported=P.exportPCProfile(atomic,a);assert(exported.ok&&exported.candidate);assert.equal(exported.candidate.sequence,3);
assert.equal(P.validateCloudProfile(exported.candidate.raw,b),null,'cloud candidates are account-bound');
const missingCloudSocial=JSON.parse(exported.candidate.raw);delete missingCloudSocial.pcSocial;
assert.equal(P.validateCloudProfile(JSON.stringify(missingCloudSocial),a),null);
const cloudRaw=JSON.stringify({...JSON.parse(exported.candidate.raw),checkpointSequence:20});
const priorPrimary=atomic.getItem(keyA),priorBackup=atomic.getItem(keyA+'.backup');
atomic.failKey=keyA;
const cloudFailed=P.restoreCloudProfile(atomic,a,cloudRaw);assert(cloudFailed.error);
assert.equal(atomic.getItem(keyA),priorPrimary);assert.equal(atomic.getItem(keyA+'.backup'),priorBackup,'failed cloud restore leaves active local copies unchanged');
atomic.failKey='';const restoredCloud=P.restoreCloudProfile(atomic,a,cloudRaw);
assert(!restoredCloud.error);assert.equal(restoredCloud.sequence,21);
const preserved=JSON.parse(atomic.getItem(keyA+'.before-cloud.21'));
assert.equal(preserved.primaryRaw,priorPrimary);assert.equal(preserved.backupRaw,priorBackup);
assert.equal(atomic.getItem(keyA+'.cloud-source.21'),cloudRaw,'cloud source preserved byte-for-byte');
assert.equal(P.loadPCProfile(atomic,a).social.friends.length,1);
const corruptForCloud=new Store();corruptForCloud.setItem(keyA,'broken primary');corruptForCloud.setItem(keyA+'.backup','broken backup');
assert(P.loadPCProfile(corruptForCloud,a).readOnly);
assert(!P.restoreCloudProfile(corruptForCloud,a,cloudRaw).error,'explicit valid cloud recovery can repair a corrupt account profile');
assert.equal(JSON.parse(corruptForCloud.getItem(keyA+'.before-cloud.21')).primaryRaw,'broken primary');
const retryCloud=new Store();assert(P.savePCProfile(retryCloud,a,original,socialA,3));retryCloud.failKey=keyA;
assert(P.restoreCloudProfile(retryCloud,a,cloudRaw).error);const firstAttemptBackup=retryCloud.getItem(keyA+'.before-cloud.21');
retryCloud.failKey='';assert(P.savePCProfile(retryCloud,a,original,socialA,4));
const retried=P.restoreCloudProfile(retryCloud,a,cloudRaw);assert(!retried.error,'a failed restore can be retried after further local play');assert.equal(retried.sequence,22);
assert.equal(retryCloud.getItem(keyA+'.before-cloud.21'),firstAttemptBackup,'retry never replaces an earlier original backup');
console.log('PC profiles: account isolation, atomic reward ledger, one-time backed-up import, stale writes, corrupt-save protection and same-account recovery passed');
