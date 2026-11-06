const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x)),saved=s=>{const n=M.restore(JSON.stringify(s));assert(n,'save restores');return n;};
function base(){const s=M.fresh(91,['fox','turtle','bud']);s.expedition=true;return s;}
for(const [mr,fr] of [['normal','SR'],['SSR','normal'],['SR','SSR']]){
 let s=base();const [m,f]=s.pets;m.sex='female';f.sex='male';m.rarity=mr;f.rarity=fr;s.active=copy(m);s.reserve=copy(f);s.runRoster={};s=M.assignPartySlot(s,s.pets[2].uid,0);
 for(let seed=1;seed<=100;seed++){s.hatchSeed=seed;const n=M.startBreeding(s,m.uid,f.uid,1000);assert(n.breeding);const higher=M.RARITIES.indexOf(mr)>M.RARITIES.indexOf(fr)?m:f;assert.equal(n.breeding.genes.rarity,higher.rarity);assert.equal(n.breeding.genes.id,higher.id);}
}
let s=base(),team=M.homeParty(s);s.combatVitals[team[1]]={hpRatio:0,hpBonus:0};s.combatVitals[team[2]]={hpRatio:0,hpBonus:0};
let n=M.grantBattleEvent(s,'revive');assert.equal(n.phase,'event');assert.equal(team.slice(1).filter(uid=>M.petCombat(n,uid).hp>0).length,1);saved(n);
assert.equal(M.grantBattleEvent(base(),'revive').phase,'encounter','no dead target is a no-op');
s=base();team=M.homeParty(s);s.hpRatio=.5;s.combatVitals[team[1]]={hpRatio:.1,hpBonus:0};s.combatVitals[team[2]]={hpRatio:0,hpBonus:0};n=M.grantBattleEvent(s,'heal');assert.equal(n.battleEvent.uid,team[1]);assert.equal(M.petCombat(n,team[1]).ratio,1);assert.equal(M.petCombat(n,team[2]).hp,0);saved(n);
s=base();n=M.grantBattleEvent(s,'giant');const uid=n.battleEvent.uid;assert.equal(M.giantMultiplier(n,uid),1.5);assert.equal(M.petCombat(n,uid).max,Math.round(M.petCombat(s,uid).max*1.5));
n=saved(n);n=M.act(n,'eventContinue');assert.equal(n.step,2);n=M.selectActive(n,uid);assert.equal(M.giantMultiplier(n,uid),1.5);assert.deepEqual(copy(n.pets),copy(s.pets));
const once=M.act(n,'eventContinue');assert.equal(once,n);n.step=3;assert.equal(M.giantMultiplier(n,uid),1.5);n.step=4;assert.equal(M.giantMultiplier(n,uid),1);assert(!M.restartRun(n,55).runEffects);
s=base();n=M.grantBattleEvent(s,'learn');assert.equal(n.battleEvent.kind,'learn');assert.equal(M.combatSkills(n,n.battleEvent.uid).length,M.petSkills(M.petEntry(n,n.battleEvent.uid)).length+1);assert.deepEqual(copy(n.pets),copy(s.pets));saved(n);assert(!M.restartRun(n,5).runEffects);
n=M.grantBattleEvent(base(),'egg');assert.equal(n.eggs.length,1);assert.equal(n.eggs[0].stage,5);assert(M.MAPS[0].pets.includes(n.eggs[0].affinity));saved(n);assert.equal(M.act(M.act(n,'eventContinue'),'eventContinue').eggs.length,1);
let hits=0;const kinds=new Set();for(let i=1;i<=10000;i++){let a=base();a.seed=i;a.phase='reward';a.reward={kind:'potion',values:[1],title:'potion'};a=M.act(a,'take');if(a.phase==='event'){hits++;kinds.add(a.battleEvent.kind);saved(a);}else assert.equal(a.phase,'encounter');}
assert(hits>1800&&hits<2200,hits);assert(kinds.has('giant')&&kinds.has('learn')&&kinds.has('egg'));
for(const step of [5,10]){let a=base();a.step=step;a.phase='reward';a.reward={kind:'potion',values:[1],title:'potion'};a=M.act(a,'take');assert.notEqual(a.phase,'event');}
assert.equal(M.BATTLE_EVENT_KINDS.length,20);assert.equal(M.TEMP_SKILLS.length,32);
assert.deepEqual(Object.keys(M.SKILLS).slice(-24),copy(M.TEMP_SKILLS.slice(8)),'new skills append after every legacy share-code index');
const learnKinds=['learn','attackLesson','guardLesson','potionLesson'];
const skillsBefore=copy(M.TEMP_SKILLS.slice(0,8));
assert.deepEqual(skillsBefore,['tm_healStrike','tm_guardHeal','tm_boostShield','tm_healPower','tm_finisher','tm_lastStand','tm_firstShield','tm_combo']);
function wounded(){const a=base(),uids=M.homeParty(a);a.hpRatio=.4;a.combatVitals[uids[1]]={hpRatio:.2,hpBonus:0};a.combatVitals[uids[2]]={hpRatio:0,hpBonus:0};a.potions=2;a.boosts=1;return a;}
for(const kind of M.BATTLE_EVENT_KINDS){
 const a=wounded(),n=M.grantBattleEvent(a,kind),e=n.battleEvent,group=M.BATTLE_EVENTS[kind].group;
 assert.equal(n.phase,'event',kind);assert.equal(e.kind,kind);saved(n);
 assert.equal(M.grantBattleEvent(n,kind),n,kind+' duplicate application blocked');
 assert.deepEqual(copy(n.pets),copy(a.pets),kind+' does not modify permanent pet genes');
 if(e.uid){assert(M.homeParty(n).includes(e.uid));if(group!=='revive')assert(M.petCombat(a,e.uid).hp>0,kind+' alive target');}
 if(kind==='teamHeal'){
  assert.equal(e.uids.length,2);for(const uid of e.uids)assert.equal(M.petCombat(n,uid).ratio,M.petCombat(a,uid).ratio+.25);
  assert.equal(M.petCombat(n,M.homeParty(n)[2]).hp,0,'campfire does not revive');
 }
 if(kind==='leadHeal'){assert.equal(e.uid,a.active.uid);assert.equal(n.hpRatio,1);}
 if(kind==='reserveHeal'){assert.equal(e.uid,M.homeParty(a)[1]);assert.equal(M.petCombat(n,e.uid).ratio,1);}
 if(kind==='reviveHalf'){assert.equal(M.petCombat(n,e.uid).ratio,.5);assert.equal(n.runEffects[e.uid].wardUntil,3);}
 if(group==='supply'){
  assert.equal(e.number,1);assert.equal(n.potions+n.boosts,a.potions+a.boosts+1);assert.equal(e.supply,kind==='potion'?'potion':'boost');
 }
 if(learnKinds.includes(kind)){
  assert(n.runEffects[e.uid].skills.includes(e.skill));const when=M.SKILL_SPECS[e.skill].when;
  if(kind==='attackLesson')assert.equal(when,'attack');if(kind==='guardLesson')assert(['guard','hit'].includes(when));if(kind==='potionLesson')assert(['heal','boost'].includes(when));
 }
 if(kind==='affinityEgg'){
  const egg=n.eggs.find(x=>x.id===e.eggId);assert.equal(egg.stage,5);assert(M.MAPS[a.mapId||0].pets.includes(egg.affinity));assert(M.homeParty(a).filter(Boolean).some(uid=>M.PETS[M.petCombat(a,uid).pet.id].type===M.PETS[egg.affinity].type));
 }
 const continued=M.act(n,'eventContinue');assert.equal(continued.step,a.step+1);assert.equal(M.act(continued,'eventContinue'),continued);saved(continued);
 assert(!M.restartRun(n,77).runEffects,kind+' restart discards temporary effects');
}
// Full HP, stock caps and full skill loadouts must not yield no-op events.
s=base();s.potions=s.boosts=9;for(const kind of ['heal','teamHeal','leadHeal','reserveHeal','revive','reviveHalf','potion','boost','supplies'])assert(!M.battleEventOptions(s).includes(kind),kind+' excluded');
for(const stock of [[9,8],[8,9],[8,8]]){s=base();[s.potions,s.boosts]=stock;n=M.grantBattleEvent(s,'supplies');assert(n.potions<=9&&n.boosts<=9);assert.equal(n.potions+n.boosts,stock[0]+stock[1]+1);}
s=base();s.runEffects={};for(const uid of M.homeParty(s))s.runEffects[uid]={skills:copy(M.TEMP_SKILLS.slice(0,8))};saved(s);
for(const kind of learnKinds){assert(!M.battleEventOptions(s).includes(kind));assert.equal(M.grantBattleEvent(s,kind),s);}
for(const code of M.TEMP_SKILLS){const a=base();a.runEffects={[a.active.uid]:{skills:[code]}};assert(M.combatSkills(saved(a)).includes(code),code+' restored');}
s=base();s.runEffects={[s.active.uid]:{skills:copy(M.TEMP_SKILLS.slice(0,9))}};assert.equal(M.restore(JSON.stringify(s)),null,'per-pet temporary limit remains8');
for(const key of ['giantUntil','powerUntil','vitalityUntil','wardUntil','focusUntil'])for(const value of [0,11,1.5,'3',null]){const a=base();a.runEffects={[a.active.uid]:{[key]:value}};assert.equal(M.restore(JSON.stringify(a)),null,key+' invalid expiry rejected');}
// All new buffs affect only the intended derived stat, not permanent data.
for(const kind of ['giant','power','vitality','ward','focus']){
 const a=base();a.expedition=false;a.team=[a.active.uid,'',''];a.reserve=null;a.hpRatio=.5;a.active.skills=[];a.pets[0].skills=[];a.runRoster={};
 let b=M.grantBattleEvent(a,kind),uid=b.battleEvent.uid;const ratio=b.hpRatio,oldHP=M.maxHP(a),expectedHealth=kind==='giant'?1.5:kind==='vitality'?1.25:1;
 assert.equal(M.maxHP(b),Math.round(oldHP*expectedHealth));assert.equal(b.hpRatio,ratio);assert.equal(M.giantMultiplier(b,uid),kind==='giant'?1.5:1);
 assert(!M.battleEventOptions(b).includes(kind),'same buff cannot stack');
 if(kind==='giant')assert(!M.battleEventOptions(b).includes('power')&&!M.battleEventOptions(b).includes('vitality'));
 if(['power','vitality'].includes(kind))assert(!M.battleEventOptions(b).includes('giant'));
 b=M.act(b,'eventContinue');b=M.act(b,'challenge');delete b.goldDie;delete b.enemyVariant;delete b.surprises;b.enemy='cotton';b.attack=10;b.enemyAttack=1;b.enemyHP=b.enemyMax=1000;
 const multiplier=kind==='giant'?1.5:kind==='power'?1.2:1;assert.equal(M.attackAmount(b),Math.round(10*multiplier),'actual attack preview '+kind);
 const attacked=M.act(b,'attack');assert.equal(attacked.skill.lastDamage,Math.round(10*multiplier),'actual enemy damage '+kind);
 assert.equal(M.enemyAttackAmount(b),1,'pet buff never multiplies enemy attack');
 if(kind==='ward'){assert.equal(b.skill.shield,6);assert.equal(attacked.skill.shield,5,'ward not re-added each turn');}
 for(const step of [3,4]){const turn=copy(b);turn.step=step;turn.phase='encounter';turn.turn=0;const entered=M.act(turn,'challenge');
  assert.equal(M.maxHP(entered),Math.round(oldHP*(step===3?expectedHealth:1)),'expiry health '+kind);assert.equal(entered.hpRatio,ratio);
  assert.equal(M.runAttackMultiplier(entered,uid),step===3?multiplier:1);
  if(kind==='ward')assert.equal(entered.skill.shield,step===3?6:0);
  if(kind==='focus'&&step===3){assert.equal(entered.attack,Math.max(...M.petAttackFaces(entered.active)));assert.equal(entered.skill.nextMax,false,'focus consumed by opening roll');}
 }
 const late=copy(a);late.step=9;const last=M.grantBattleEvent(late,kind);assert.equal(Math.max(...Object.values(last.runEffects[uid])),10,'buff capped at map end');
}
// Entry effects also work for a replacement partner, but not repeatedly each turn.
s=base();s.expedition=false;for(const pet of [...s.pets,s.active,s.reserve])if(pet)pet.skills=[];s.runRoster={};team=M.homeParty(s);s.runEffects={[team[1]]:{wardUntil:3,focusUntil:3}};s=M.act(s,'challenge');s.hpRatio=.01;s.attack=1;s.enemyHP=s.enemyMax=1000;s.enemyAttack=500;delete s.goldDie;delete s.enemyVariant;
n=M.act(s,'attack');assert.equal(n.active.uid,team[1]);assert.equal(n.skill.shield,6);assert.equal(n.attack,Math.max(...M.petAttackFaces(n.active)));assert.equal(n.skill.nextMax,false);
n.enemyAttack=1;const guard=M.act(n,'guard');assert.equal(guard.skill.shield,5);
// Affinity eggs remain in the current map pool; if no ally type is present, exclude the event.
s=base();s.mapId=M.MAPS.findIndex(m=>!m.pets.some(id=>M.homeParty(s).some(uid=>M.PETS[M.petCombat(s,uid).pet.id].type===M.PETS[id].type)));assert(s.mapId>=0);
assert(!M.battleEventOptions(s).includes('affinityEgg'));
// Cross-map production actions: grant a real event, run two subsequent fights, save at every action.
let eventChains=0,chainActions=0,chainLosses=0;const stressSalt=Number(process.env.PM_EVENT_STRESS_SEED||0)>>>0;
const checked=a=>{assert(Number.isFinite(M.maxHP(a))&&M.maxHP(a)>0);assert(a.hpRatio>=0&&a.hpRatio<=1);assert(a.potions>=0&&a.potions<=9);assert(a.boosts>=0&&a.boosts<=9);if(a.skill){assert(a.skill.shield>=0&&a.skill.shield<=200);assert(a.skill.poison>=0&&a.skill.poison<=3);}return saved(a);};
function playTwoFights(start){let a=start,fights=0,turns=0;
 while(fights<2&&a.phase!=='lost'&&turns++<200){
  let action;
  if(a.phase==='event')action='eventContinue';
  else if(a.phase==='encounter')action='challenge';
  else if(a.phase==='battle')action=a.hpRatio<.65&&!a.usedHeal&&a.potions?'heal':!a.doubled&&a.boosts&&a.attack===Math.max(...M.petAttackFaces(a.active))?'boost':'attack';
  else if(a.phase==='reward'){fights++;action='take';}
  else assert.fail('unexpected stress phase '+a.phase);
  const next=M.act(a,action);assert.notEqual(next,a,'stress action progresses');a=checked(next);chainActions++;
 }
 assert(turns<200,'no stall or endless loop');return a;
}
for(const kind of M.BATTLE_EVENT_KINDS)for(let seed=1;seed<=32;seed++){
 const mapId=(seed-1)%12,ids=M.MAPS[mapId].pets.slice(0,3);let a=M.fresh(stressSalt+seed*137,ids);a.clearedMaps=Array.from({length:mapId},(_,i)=>i);a=M.startMap(a,mapId,stressSalt+seed*997);a.expedition=true;
 const uids=M.homeParty(a);a.hpRatio=.6;a.combatVitals[uids[1]]={hpRatio:.3,hpBonus:0};a.combatVitals[uids[2]]={hpRatio:0,hpBonus:0};a.potions=3;a.boosts=2;
 a=M.grantBattleEvent(a,kind);assert.equal(a.battleEvent.kind,kind);const pets=copy(a.pets);a=playTwoFights(checked(a));if(a.phase==='lost')chainLosses++;
 assert.deepEqual(copy(a.pets),pets,kind+' cross-map effects never alter genetics');const reset=checked(M.restartRun(a,seed));assert(!reset.runEffects);assert(!reset.battleEvent);eventChains++;
}
// Eight simultaneous temporary moves stress combined triggers, caps and save boundaries.
let comboChains=0;
for(let seed=1;seed<=128;seed++){
 let a=base();a.seed=(stressSalt+seed*991)>>>0;a.potions=5;a.boosts=3;a.runEffects={};let rng=stressSalt+seed;
 for(const uid of M.homeParty(a)){
  const pool=copy(M.TEMP_SKILLS);for(let i=pool.length-1;i>0;i--){rng=(Math.imul(rng,1664525)+1013904223)>>>0;const j=rng%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  a.runEffects[uid]={skills:pool.slice(0,8),powerUntil:3,vitalityUntil:3,wardUntil:3,focusUntil:3};
 }
 const genes=copy(a.pets);a=playTwoFights(checked(a));assert.deepEqual(copy(a.pets),genes);checked(M.restartRun(a,seed));comboChains++;
}
assert.equal(eventChains,640);assert.equal(comboChains,128);
console.log('PASS20 events;32 skills;20% gate;grants/restore/caps/expiry/relay;640 cross-map event chains +128 eight-move combo chains;'+chainActions+' saved actions;'+chainLosses+' wounded-fixture defeats (not balance estimate)');
