const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:mod.exports,Math,Date,JSON,Set});
const M=mod.exports,copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.deepEqual(copy(a),copy(b));
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
function saved(s){const n=M.restore(JSON.stringify(s));assert.ok(n,'state must survive save/load');eq(n,s);return n;}
function unchanged(s,fn){const before=copy(s);assert.equal(fn(s),s);eq(s,before);}
function host(seed=71){return M.ensureSocial(M.fresh(seed),'owner-B002');}
function source(species='dragon',rarity='SSR',owner='owner-A001'){
  let s=M.ensureSocial(M.fresh(19,[species]),owner),p=s.pets.find(p=>p.id===species);
  Object.assign(p,{rarity,sex:'female',baseHP:91,baseFaces:[71,81,91],faces:[71,81,91],skills:['opening','charged','healing','armor','focus','barrier']});
  s.qualities[species]=[rarity];
  if(s.active.uid===p.uid)s.active=copy(p);
  if(s.reserve?.uid===p.uid)s.reserve=copy(p);
  if(s.runRoster[p.uid])s.runRoster[p.uid]=copy(p);
  const code=M.makeVisitCode(s,p.uid);assert.equal(typeof code,'string');assert.ok(code.length>0);
  return {s:saved(s),p,code};
}
function welcomed(species='dragon',rarity='SSR',seed=71){const a=source(species,rarity);return {a,s:M.receiveVisitor(host(seed),a.code,1000)};}
function bonded(species='dragon',rarity='SSR',seed=71){let {a,s}=welcomed(species,rarity,seed);for(const at of [3500,6000,8500])s=M.visitAction(s,at);assert.ok(M.friendBonds(s).some(b=>b.species===species));return {a,s};}
function egg(s,id='own-egg',rarity='normal',affinity='bud',mapId=0){s.eggs.push({id,rarity,affinity,stage:5,mapId});return s.eggs.at(-1);}
function withoutSocial(s){const n=copy(s);delete n.social;delete n.revision;delete n.message;return n;}
function finish(s,index=0,now=10000){return M.claimHatch(saved(s),index,now+M.HATCH_DURATION);}

test('social initialization preserves legacy collections and is stable across saves',()=>{
  const legacy=M.fresh(41),before=copy(legacy);assert.equal(legacy.social,undefined);eq(saved(legacy),before);
  let s=M.ensureSocial(legacy,'owner-B002');eq(legacy,before);eq(withoutSocial(s),withoutSocial(legacy));assert.equal(s.social.owner,'owner-B002');assert.equal(s.social.version,1);eq(M.friendBonds(s),[]);assert.equal(M.visitorPet(s),null);s=saved(s);
  unchanged(s,x=>M.ensureSocial(x,'owner-B002'));unchanged(s,x=>M.ensureSocial(x,'owner-C003'));
});

test('visit codes expose appearance only and can be made only from an owned individual',()=>{
  const {s,p,code}=source(),card=M.readVisitCode(code);assert.ok(card);assert.equal(card.owner,s.social.owner);assert.equal(card.species,p.id);assert.equal(card.rarity,p.rarity);assert.equal(card.sex,p.sex);
  const forbidden=['baseHP','baseFaces','faces','skills','genes','hp','attack'];
  for(const key of forbidden)assert.ok(!JSON.stringify(card).includes('"'+key+'"'),'card must not transmit '+key);
  assert.equal(M.makeVisitCode(s,p.uid),code);assert.equal(M.makeVisitCode(s,'missing-owned-pet'),null);
  const b=M.receiveVisitor(host(),code,1000),v=M.visitorPet(b);assert.ok(v);assert.equal(M.makeVisitCode(b,v.uid),null);
});

test('malformed, altered-checksum and own visit codes are rejected without state changes',()=>{
  const a=source(),s=host(),middle=Math.floor(a.code.length/2),tampered=a.code.slice(0,middle)+(a.code[middle]==='A'?'B':'A')+a.code.slice(middle+1);
  for(const code of ['', 'not-a-visit-code', '{}', a.code.slice(0,-1), tampered, a.code+'junk']){assert.equal(M.readVisitCode(code),null);unchanged(s,x=>M.receiveVisitor(x,code,1000));}
  unchanged(a.s,x=>M.receiveVisitor(x,a.code,1000));
});

test('receiving a visitor grants no egg, collection, stats, team or breeding parent',()=>{
  const a=source(),before=host(),snapshot=copy(before),s=M.receiveVisitor(before,a.code,1000),v=M.visitorPet(s);
  eq(before,snapshot);eq(withoutSocial(s),withoutSocial(before));assert.ok(v);assert.equal(v.id,a.p.id);assert.equal(v.rarity,'SSR');assert.ok(!s.pets.some(p=>p.uid===v.uid));assert.ok(!s.owned.includes('dragon'));
  unchanged(s,x=>M.assignPartySlot(x,v.uid,0));unchanged(s,x=>M.equipReserve(x,v.uid));
  unchanged(s,x=>M.startBreeding(x,v.uid,x.pets[1].uid,1000));unchanged(s,x=>M.startBreeding(x,x.pets[0].uid,v.uid,1000));saved(s);
});

test('three interactions require the full 2500ms gap and unlock a species only once',()=>{
  let {a,s}=welcomed();assert.equal(M.VISIT_ACTION_MS,2500);eq(M.friendBonds(s),[]);
  s=M.visitAction(s,3500);assert.equal(s.social.visitor.progress,1);eq(M.friendBonds(s),[]);s=saved(s);
  for(const at of [3500,3501,5999])unchanged(s,x=>M.visitAction(x,at));
  s=M.visitAction(s,6000);assert.equal(s.social.visitor.progress,2);eq(M.friendBonds(s),[]);
  unchanged(s,x=>M.visitAction(x,8499));s=M.visitAction(s,8500);assert.equal(s.social.visitor.progress,3);const bonds=M.friendBonds(s);assert.equal(bonds.length,1);assert.equal(bonds[0].species,'dragon');assert.equal(bonds[0].owner,a.s.social.owner);assert.equal(typeof bonds[0].cardId,'string');assert.ok(bonds[0].cardId.length);
  for(const at of [8500,11000,99999999])unchanged(s,x=>M.visitAction(x,at));eq(s.eggs,[]);assert.equal(s.pets.length,2);saved(s);
});

test('duplicate imports retain interaction progress and permanent species unlocks',()=>{
  let {a,s}=welcomed();s=M.visitAction(s,3500);const prior=copy(s.social);unchanged(s,x=>M.receiveVisitor(x,a.code,6000));eq(s.social,prior);
  for(const at of [6000,8500])s=M.visitAction(s,at);const bonds=copy(M.friendBonds(s));unchanged(s,x=>M.receiveVisitor(x,a.code,20000));
  const another=source('dragon','normal','owner-C003');s=M.receiveVisitor(s,another.code,23000);assert.equal(s.social.visitor.progress,3);eq(M.friendBonds(s),bonds);unchanged(s,x=>M.visitAction(x,25500));saved(s);
});

test('social progress and unlocks survive save/load, run restart and map changes',()=>{
  let {s}=welcomed();s=M.visitAction(s,3500);s=saved(s);let expected=copy(s.social);s=M.restartRun(s,89);eq(s.social,expected);s=saved(s);
  for(const at of [6000,8500])s=M.visitAction(s,at);expected=copy(s.social);s.clearedMaps=[0,1];s=M.startMap(saved(s),2,93);assert.equal(s.mapId,2);eq(s.social,expected);s=saved(s);s=M.startMap(s,0,97);eq(s.social,expected);saved(s);
});

test('bonding needs three interactions and an existing eligible egg',()=>{
  let {s}=welcomed();egg(s);assert.ok(M.bondBlockReason(s,s.eggs[0],'dragon'));eq(M.bondEligibleEggs(s,'dragon'),[]);unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',0,10000));
  s=bonded().s;eq(M.bondEligibleEggs(s,'dragon'),[]);unchanged(s,x=>M.startBondIncubation(x,'missing-egg','dragon',0,10000));assert.equal(s.eggs.length,0);assert.equal(s.pets.length,2);
});

test('A to B bond hatching consumes an existing egg and creates one natural local pet after its rarity-specific duration',()=>{
  let {a,s}=bonded();const original=copy(egg(s)),pets=copy(s.pets),before=s,prior=copy(s);eq(M.bondEligibleEggs(s,'dragon').map(e=>e.id),[original.id]);assert.equal(M.bondBlockReason(s,s.eggs[0],'dragon'),'');
  s=M.startBondIncubation(s,original.id,'dragon',0,10000);eq(before,prior);eq(s.pets,pets);assert.equal(s.eggs.length,1);const linked=s.eggs[0];assert.equal(linked.id,original.id);assert.equal(linked.affinity,'dragon');assert.equal(linked.rarity,original.rarity);assert.equal(linked.mapId,original.mapId);assert.equal(linked.stage,original.stage);assert.equal(linked.bond.sourceAffinity,original.affinity);assert.equal(linked.bond.species,'dragon');assert.equal(linked.bond.owner,a.s.social.owner);assert.ok(linked.bond.cardId);assert.equal(linked.genes,undefined);
  assert.equal(M.HATCH_DURATION,30*60*1000);assert.equal(s.incubators[0].readyAt-s.incubators[0].startedAt,M.HATCH_DURATIONS.normal);assert.equal(s.incubators[0].result,'normal');eq(M.availableEggs(s),[]);unchanged(s,x=>M.claimHatch(x,0,10000+M.HATCH_DURATIONS.normal-1));
  s=finish(s);assert.equal(s.pets.length,pets.length+1);const child=s.pets.at(-1);assert.equal(child.id,'dragon');assert.equal(child.rarity,'normal');assert.equal(child.baseHP,M.PETS.dragon.hp);eq(child.baseFaces,M.PETS.dragon.faces);eq(child.skills,M.petSkills({id:'dragon',rarity:'normal'}));assert.notEqual(child.baseHP,a.p.baseHP);assert.notEqual(child.uid,a.p.uid);assert.equal(s.pendingHatch.petId,'dragon');assert.equal(s.pendingHatch.rarity,'normal');assert.ok(s.hatchedEggIds.includes(original.id));unchanged(s,x=>M.claimHatch(x,0,99999999));saved(s);
});

test('locked-map friend species accepts R eggs but rejects SR and SSR without downgrading them',()=>{
  let {s}=bonded();assert.equal(M.mapUnlocked(s,2),false);egg(s,'normal','normal');egg(s,'SR','SR');egg(s,'SSR','SSR');
  eq(M.bondEligibleEggs(s,'dragon').map(e=>e.id),['normal']);
  for(const id of ['SR','SSR']){assert.ok(M.bondBlockReason(s,s.eggs.find(e=>e.id===id),'dragon'));unchanged(s,x=>M.startBondIncubation(x,id,'dragon',0,10000));}
  const before=copy(s.eggs);s=M.startBondIncubation(s,'normal','dragon',0,10000);assert.equal(s.incubators[0].result,'normal');eq(s.eggs.filter(e=>e.id!=='normal'),before.filter(e=>e.id!=='normal'));saved(s);
});

test('bond rarity is fixed even when the target map unlocks during incubation',()=>{
  for(const seed of [1,19,71,318,9071]){let {s}=bonded('dragon','SSR',seed);egg(s);s=M.startBondIncubation(s,'own-egg','dragon',0,10000);assert.equal(s.incubators[0].result,'normal');s.clearedMaps=[0,1];s=M.startMap(saved(s),2,seed);assert.equal(M.mapUnlocked(s,2),true);assert.equal(s.incubators[0].result,'normal');s=finish(s);assert.equal(s.pets.at(-1).rarity,'normal');saved(s);}
});

test('unlocked-map bonds preserve every egg quality exactly instead of rolling upgrades',()=>{
  for(const rarity of M.RARITIES)for(const seed of [1,19,71,318,9071]){let {s}=bonded('dragon','SSR',seed);s.clearedMaps=[0,1];egg(s,'own-quality',rarity);assert.equal(M.bondBlockReason(s,s.eggs[0],'dragon'),'');s=M.startBondIncubation(s,'own-quality','dragon',0,10000);assert.equal(s.eggs[0].rarity,rarity);assert.equal(s.incubators[0].result,rarity);s=finish(s);const p=s.pets.at(-1);assert.equal(p.id,'dragon');assert.equal(p.rarity,rarity);assert.equal(p.baseHP,M.PETS.dragon.hp+M.qualityHP(rarity));eq(p.skills,M.petSkills({id:'dragon',rarity}));saved(s);}
});

test('locally bred eggs retain their own inherited stats and skills when changing species',()=>{
  let {s}=bonded('dragon');const [mother,father]=s.pets;mother.sex='female';father.sex='male';mother.baseHP=43;father.baseHP=51;mother.baseFaces=[8,13,21];father.baseFaces=[11,17,23];mother.skills=['opening','charged','healing'];father.skills=['armor','focus','barrier'];
  const other=copy(M.fresh(99,['bud']).pets.find(p=>p.id==='bud'));s.pets.push(other);s.owned.push('bud');s.qualities.bud=['normal'];s.active=copy(other);s.reserve=copy(father);s.team=[other.uid,father.uid,mother.uid];s.runRoster={[mother.uid]:copy(mother),[father.uid]:copy(father),[other.uid]:copy(other)};s.combatVitals[other.uid]={hpBonus:0,hpRatio:1};s=M.startBreeding(saved(s),mother.uid,father.uid,1000);const expected=copy(s.breeding.genes);s=M.claimBreeding(s,1000+M.BREED_DURATION);assert.equal(s.pets.length,1);const original=copy(s.eggs[0]);const now=2000+M.BREED_DURATION;
  s=M.startBondIncubation(saved(s),original.id,'dragon',0,now);assert.equal(s.eggs[0].bond.sourceAffinity,original.affinity);eq(s.eggs[0].genes,{...expected,id:'dragon'});assert.equal(s.incubators[0].result,expected.rarity);s=finish(s,0,now);const child=s.pets.at(-1);assert.equal(child.id,'dragon');assert.equal(child.rarity,expected.rarity);assert.equal(child.baseHP,expected.baseHP);eq(child.baseFaces,expected.baseFaces);eq(child.skills,expected.skills);assert.equal(s.active.uid,other.uid);saved(s);
});

test('invalid targets, slots, times and occupied incubators fail atomically',()=>{
  let {s}=bonded();egg(s);egg(s,'other-egg');
  for(const target of ['missing-species','turtle'])unchanged(s,x=>M.startBondIncubation(x,'own-egg',target,0,10000));
  for(const slot of [-1,2,.5])unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',slot,10000));
  for(const now of [-1,NaN,Infinity])unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',0,now));
  s=M.startIncubation(s,'other-egg',0,1000);unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',0,10000));assert.equal(s.eggs.find(e=>e.id==='own-egg').affinity,'bud');
  egg(s,'third-egg');s=M.startIncubation(s,'third-egg',1,1000);for(const slot of [0,1])unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',slot,10000));saved(s);
});

test('inflight, hatched and previously bonded eggs cannot be reused for another bond',()=>{
  let {s}=bonded();egg(s);s=M.startIncubation(s,'own-egg',0,10000);eq(M.bondEligibleEggs(s,'dragon'),[]);unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',1,10000));
  s=finish(s);s=M.acknowledgeHatch(s);eq(M.bondEligibleEggs(s,'dragon'),[]);unchanged(s,x=>M.startBondIncubation(x,'own-egg','dragon',1,20000));
  let linked=bonded().s;egg(linked);linked=M.startBondIncubation(linked,'own-egg','dragon',0,10000);unchanged(linked,x=>M.startBondIncubation(x,'own-egg','dragon',1,10000));
  const unqueued=copy(linked);unqueued.incubators[0]=null;assert.ok(M.bondBlockReason(unqueued,unqueued.eggs[0],'dragon'));unchanged(unqueued,x=>M.startBondIncubation(x,'own-egg','dragon',0,10000));saved(s);saved(linked);
});

test('bonded map eggs validate their original source affinity on save/load',()=>{
  let {s}=bonded();egg(s);s=M.startBondIncubation(s,'own-egg','dragon',0,10000);saved(s);
  for(const mutate of [x=>x.eggs[0].bond.sourceAffinity='fox',x=>x.eggs[0].mapId=1,x=>x.eggs[0].stage=7,x=>x.eggs[0].rarity='bad',x=>x.eggs[0].bond.species='seal',x=>x.eggs[0].bond.sourceAffinity='unknown',x=>delete x.eggs[0].bond.sourceAffinity,x=>x.eggs[0].bond.owner=x.social.owner,x=>x.eggs[0].bond.cardId='',x=>x.incubators[0].result='SSR',x=>delete x.social,x=>x.social.bonds=[]]){const invalid=copy(s);mutate(invalid);assert.equal(M.restore(JSON.stringify(invalid)),null);}
});

test('restore rejects malformed social fields and duplicate species unlocks',()=>{
  const s=bonded().s;
  const changes=[x=>x.social=null,x=>x.social=[],x=>x.social.version=2,x=>x.social.owner='',x=>x.social.visitor.progress=-1,x=>x.social.visitor.progress=4,x=>x.social.visitor.progress=.5,x=>x.social.visitor.lastPlayedAt=-1,x=>x.social.visitor.lastPlayedAt='8500',x=>x.social.bonds.push(copy(x.social.bonds[0])),x=>x.social.bonds[0].species='unknown',x=>x.social.bonds[0].owner=x.social.owner,x=>x.social.bonds[0].cardId='',x=>x.social.visitor.card.owner=x.social.owner];
  for(const mutate of changes){const invalid=copy(s);mutate(invalid);assert.equal(M.restore(JSON.stringify(invalid)),null);}
  saved(s);
});

console.log(passed+' friend-visit/bond groups passed; '+failed+' failed');if(failed)process.exitCode=1;
