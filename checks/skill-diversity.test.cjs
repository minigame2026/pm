const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
const source=fs.readFileSync('assets/scripts/PMModel.ts','utf8')+'\nexport const testRoll=roll;';
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x));
assert.equal(M.NATURAL_SKILL_CODES.length,54);assert.equal(M.TEMP_SKILLS.length,8);
assert.equal(new Set(M.NATURAL_SKILL_CODES.map(c=>JSON.stringify(M.SKILL_SPECS[c]))).size,54,'natural skills have distinct triggers/effects');
for(const code of [...M.NATURAL_SKILL_CODES,...M.TEMP_SKILLS]){
 const v=M.SKILL_SPECS[code];let s=M.fresh(41,['fox','turtle','bud']);s.active.skills=[code];s.pets[0].skills=[code];s.runRoster={};s=M.act(s,'challenge');
 s.enemyHP=s.enemyMax=1000;s.enemyAttack=8;s.hpRatio=.6;s.skill.usedCodes=[];s.skill.used=false;s.skill.shield=0;s.skill.poison=0;s.skill.nextMax=false;s.skill.attacks=v.gate==='third'?2:0;s.attack=3;s.turn=2;
 if(v.gate==='low')s.hpRatio=.3;if(v.gate==='full')s.hpRatio=1;if(v.gate==='enemyHalf')s.enemyHP=400;if(v.gate==='minimum')s.attack=Math.min(...s.active.faces);if(v.gate==='maximum')s.attack=Math.max(...s.active.faces);if(v.gate==='boosted')s.doubled=true;if(v.gate==='lethal')s.enemyAttack=999;if(v.gate==='resisted')s.enemy='otter';
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
 assert.equal(n.skill.usedCodes.filter(c=>c===code).length,1);
}
// Existing inherited skills remain intact; old natural pets receive their type/form skill.
let old=M.fresh(8,['fox','turtle','bud']);delete old.naturalSkillVersion;old.pets[0].skills=['opening'];old.active.skills=['opening'];old.runRoster={};let migrated=M.restore(JSON.stringify(old));assert(migrated);assert(migrated.active.skills[0].startsWith('trait_'));
old=M.fresh(8,['fox','turtle','bud']);delete old.naturalSkillVersion;old.pets[0].skills=['opening','healing'];old.active.skills=['opening','healing'];old.runRoster={};migrated=M.restore(JSON.stringify(old));assert(migrated);assert.equal(migrated.active.skills.join(),'opening,healing');
console.log('PASS all 54 distinct permanent + 8 temporary skills activate and produce effects; natural migration preserves inherited skills');
