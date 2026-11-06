const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
const source=fs.readFileSync('assets/scripts/PMModel.ts','utf8')+'\nexport const testRoll=roll;export const testReadySkills=readySkillSpecs;';
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x));
assert.equal(M.NATURAL_SKILL_CODES.length,108);assert.equal(M.TEMP_SKILLS.length,32);
assert.deepEqual(copy(M.NATURAL_SKILL_CODES.slice(0,54)),Array.from({length:18},(_,i)=>[0,1,2].map(t=>'trait_'+i+'_'+t)).flat(),'old 54 natural skill indexes remain stable');
assert.equal(new Set(M.NATURAL_SKILL_CODES.map(c=>JSON.stringify(M.SKILL_SPECS[c]))).size,108,'natural skills have distinct triggers/effects');
assert.equal(new Set(M.TEMP_SKILLS.map(c=>JSON.stringify(M.SKILL_SPECS[c]))).size,32,'temporary skills have distinct triggers/effects');
for(const code of [...M.NATURAL_SKILL_CODES,...M.TEMP_SKILLS]){
 const v=M.SKILL_SPECS[code];let s=M.fresh(41,['fox','turtle','bud']);s.active.skills=[code];s.pets[0].skills=[code];s.runRoster={};s.team=[s.active.uid,'',''];s.reserve=null;s=M.act(s,'challenge');
 s.enemyHP=s.enemyMax=1000;s.enemyAttack=8;s.hpRatio=.6;s.skill.usedCodes=[];s.skill.used=false;s.skill.shield=0;s.skill.poison=0;s.skill.nextMax=false;s.skill.attacks=v.gate==='third'?2:0;s.attack=3;s.turn=2;
 if(v.gate==='low')s.hpRatio=.3;if(v.gate==='full')s.hpRatio=1;if(v.gate==='enemyHalf')s.enemyHP=400;if(v.gate==='minimum')s.attack=Math.min(...s.active.faces);if(v.gate==='maximum')s.attack=Math.max(...s.active.faces);if(v.gate==='boosted')s.doubled=true;if(v.gate==='lethal'){s.enemy='cotton';s.enemyAttack=M.hp(s)+1;}if(v.gate==='resisted')s.enemy='otter';
 let n;
 if(v.when==='roll'){
  let triggered=false;
  for(let seed=1;seed<2000&&!triggered;seed++){n=copy(s);n.seed=seed;n.turn=v.gate==='first'?0:1;n.skill.previousRoll=1;M.testRoll(n);triggered=n.skill.usedCodes.includes(code);}
  assert(triggered,code+' roll trigger');
 }else n=M.act(s,v.when==='hit'?(v.gate==='guarded'?'guard':'attack'):v.when);
 assert(n.skill.usedCodes.includes(code),code+' activates');
 const e=v.effect;
 if(e==='nextMax')assert(n.skill.nextMax||n.attack===Math.max(...n.active.faces),code);
 if(e==='maxRoll')assert.equal(n.attack,Math.max(...n.active.faces),code);
 if(e==='refundHeal')assert.equal(n.potions,s.potions+(v.when==='heal'?0:1),code);
 if(e==='refundBoost')assert.equal(n.boosts,s.boosts+(v.when==='boost'?0:1),code);
 if(e==='evade')assert.equal(n.skill.lastTaken,0,code);
 if(e==='survive')assert.equal(M.hp(n),1,code);
 if(e==='damage')assert(n.skill.lastDamage>=v.amount+1,code);
 if(e==='poison')assert.equal(n.skill.poisonDamage,v.amount,code);
 if(e==='reduce'){const plain=copy(s);plain.active.skills=[];plain.pets[0].skills=[];const baseline=M.act(plain,v.gate==='guarded'?'guard':'attack');assert(n.skill.lastTaken<baseline.skill.lastTaken,code+' reduces actual incoming damage');}
 if(e==='shield')assert(n.skill.shield>0||n.skill.lastTaken<M.enemyAttackAmount(s),code);
 if(e==='heal'||e==='healPct'||e==='drain'){
  const baseline=copy(s);baseline.active.skills=[];baseline.pets[0].skills=[];let b;if(v.when==='roll'){b=copy(n);b.hpRatio=s.hpRatio;}else b=M.act(baseline,v.when==='hit'?'attack':v.when);
  assert(n.hpRatio>b.hpRatio||n.hpRatio===1,code+' heals');
 }
 if(e==='healShield'){assert(n.hpRatio>s.hpRatio,code+' heals');assert(n.skill.shield>=4,code+' adds shield');}
 if(e==='venomDrain'){const plain=copy(s);plain.active.skills=[];plain.pets[0].skills=[];const baseline=M.act(plain,'attack');assert(n.hpRatio>baseline.hpRatio,code+' drains');assert.equal(n.skill.poisonDamage,3);assert(n.skill.lastDamage>baseline.skill.lastDamage,code+' poison deals damage');}
 if(e==='powerGuard'){assert(n.skill.nextMax||n.attack===Math.max(...n.active.faces),code+' maximizes next roll');if(v.when==='roll')assert(n.skill.shield>=5,code+' adds shield');else {const plain=copy(s);plain.active.skills=[];plain.pets[0].skills=[];const baseline=M.act(plain,v.when);assert(n.skill.lastTaken<baseline.skill.lastTaken,code+' shield blocks damage');}}
 assert.equal(n.skill.usedCodes.filter(c=>c===code).length,1);
 assert(!M.testReadySkills(n,v.when,999,true).includes(code),code+' cannot activate twice in same battle');
 const restored=M.restore(JSON.stringify(n));assert(restored,code+' combat save restores');assert(restored.skill.usedCodes.includes(code));assert(!M.testReadySkills(restored,v.when,999,true).includes(code),code+' reload cannot refresh spent skill');
}
// New 1-damage poison does not weaken legacy active 2-damage venom.
for(const prior of [0,2,5]){
 let s=M.fresh(41,['fox']);s.active.skills=['tm_venomMark'];s=M.act(s,'challenge');s.enemyMax=s.enemyHP=1000;s.enemyAttack=1;s.skill.poison=prior?2:0;if(prior===5)s.skill.poisonDamage=5;
 const n=M.act(s,'attack');assert.equal(n.skill.poisonDamage,Math.max(1,prior));
}
{let s=M.fresh(41,['fox']);s.active.skills=['venom','tm_venomMark'];s=M.act(s,'challenge');s.enemyMax=s.enemyHP=1000;s.enemyAttack=1;const n=M.act(s,'attack');assert.equal(n.skill.poisonDamage,2,'legacy venom triggered alongside new1 poison retains2');}
// Discover each move through the production event picker, then exercise its real runEffects lifecycle.
const learned=new Map();
for(let seed=1;seed<=10000&&learned.size<M.TEMP_SKILLS.length;seed++){
 const s=M.fresh(seed,['fox','turtle','bud']);s.team=[s.active.uid,'',''];s.reserve=null;s.hpRatio=.5;
 const e=M.grantBattleEvent(s,'learn');if(!learned.has(e.battleEvent.skill))learned.set(e.battleEvent.skill,e);
}
assert.equal(learned.size,32,'all32 moves can be granted by normal learning');
let lifecycleCases=0;
const stressSalt=Number(process.env.PM_EVENT_STRESS_SEED||0)>>>0;
for(const [code,initial] of learned)for(let seed=1;seed<=16;seed++){
 const permanent=copy(initial.pets),uid=initial.battleEvent.uid,v=M.SKILL_SPECS[code];
 let s=M.restore(JSON.stringify(initial));assert(s);s=M.act(s,'eventContinue');s.seed=(stressSalt+seed*971)>>>0;s=M.act(s,'challenge');
 s.enemy='cotton';s.enemyMax=s.enemyHP=10000;s.enemyAttack=1;s.potions=s.boosts=6;
 if(!s.skill.usedCodes.includes(code)){
  if(v.gate==='full')s.hpRatio=1;else s.hpRatio=.4;
  if(v.gate==='minimum')s.attack=Math.min(...M.petAttackFaces(s.active));if(v.gate==='maximum')s.attack=Math.max(...M.petAttackFaces(s.active));
  if(v.gate==='third')s.skill.attacks=2;if(v.gate==='enemyHalf')s.enemyHP=s.enemyMax*.4;if(v.gate==='resisted')s.enemy='otter';
  if(v.gate==='lethal'){s.hpRatio=.05;s.enemyAttack=100;}
  if(v.when==='roll'){
   for(let turn=0;turn<100&&!s.skill.usedCodes.includes(code);turn++){s.hpRatio=1;s=M.act(s,'guard');assert.equal(s.phase,'battle');}
  }else s=M.act(s,v.when==='hit'?'attack':v.when);
 }
 assert(s.skill.usedCodes.includes(code),code+' real granted move activates seed'+seed);
 assert(!M.testReadySkills(s,v.when,999,true).includes(code));assert.deepEqual(copy(s.pets),permanent,code+' leaves genes unchanged');
 const reloaded=M.restore(JSON.stringify(s));assert(reloaded,code+' real move reload');assert(!M.testReadySkills(reloaded,v.when,999,true).includes(code));s=reloaded;
 // Win, accept the real reward, then switch out and back in the next encounter.
 s.enemyHP=1;s.enemyAttack=1;s=M.act(s,'attack');assert.equal(s.phase,'reward');s=M.act(s,'take');if(s.phase==='event')s=M.act(s,'eventContinue');assert.equal(s.phase,'encounter');
 const other=s.pets.find(p=>p.uid!==uid).uid;s=M.selectActive(s,other);assert.equal(s.active.uid,other);assert(!M.combatSkills(s).includes(code),code+' does not transfer to another pet');assert(M.restore(JSON.stringify(s)),code+' switched save');
 s=M.selectActive(s,uid);assert.equal(s.active.uid,uid);assert(M.combatSkills(s).includes(code));assert(M.restore(JSON.stringify(s)));
 s=M.act(s,'challenge');assert(s.skill.usedCodes.length<=M.combatSkills(s).length);if(v.when!=='roll')assert(!s.skill.usedCodes.includes(code),'new battle refreshes move');
 const reset=M.restartRun(s,seed);assert(!reset.runEffects);assert(!M.combatSkills(reset).includes(code));assert(M.restore(JSON.stringify(reset)));assert.deepEqual(copy(reset.pets),permanent);
 lifecycleCases++;
}
assert.equal(lifecycleCases,512);
// Existing inherited skills remain intact; old natural pets receive their type/form skill.
let old=M.fresh(8,['fox','turtle','bud']);delete old.naturalSkillVersion;old.pets[0].skills=['opening'];old.active.skills=['opening'];old.runRoster={};let migrated=M.restore(JSON.stringify(old));assert(migrated);assert(migrated.active.skills[0].startsWith('trait_'));
old=M.fresh(8,['fox','turtle','bud']);delete old.naturalSkillVersion;old.pets[0].skills=['opening','healing'];old.active.skills=['opening','healing'];old.runRoster={};migrated=M.restore(JSON.stringify(old));assert(migrated);assert.equal(migrated.active.skills.join(),'opening,healing');
console.log('PASS108 permanent+32 temporary effects and one-use saves;512 production learning/trigger/reload/switch/reset lifecycles;legacy indexes/genes stable');
