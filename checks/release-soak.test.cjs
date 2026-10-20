// Bounded deterministic exploration. Progression fixtures are not balance tests.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const flat=x=>JSON.parse(JSON.stringify(x)),T=1792454400000;
let checkpoints=0,actions=0,battles=0,floors=0;
function check(s,label){
 const r=M.restore(JSON.stringify(s));assert.ok(r,'restore rejected '+label);
 for(const k of ['phase','mapId','step','seed','hpRatio','hpBonus','attack','enemyAttack','enemyHP','heal','potions','boosts','usedHeal','doubled','skill','eggs','eggHunt','team','pets','active','reserve','stamina','clearedMaps'])assert.deepEqual(flat(r[k]??null),flat(s[k]??null),label+' changed '+k);
 assert.ok(s.hpRatio>=0&&s.hpRatio<=1);assert.ok(s.enemyHP>=0&&s.enemyHP<=s.enemyMax);
 assert.equal(new Set(s.pets.map(p=>p.uid)).size,s.pets.length);assert.equal(new Set(s.eggs.map(e=>e.id)).size,s.eggs.length);
 checkpoints++;return r;
}
function action(s,a){const before=JSON.stringify(s),next=M.act(s,a);assert.equal(JSON.stringify(s),before,'input mutated');actions++;return check(next,`${s.mapId}/${s.step}/${s.phase}/${a}`);}
// Exercise all 162 forms against map-appropriate random opponents using legal
// attack/heal/boost/guard/reroll choices, with deterministic seeds and reloads.
for(const id of M.PET_IDS)for(const rarity of M.RARITIES)for(let seed=1;seed<=3;seed++){
 const region=M.MAPS.find(m=>m.pets.includes(id)).id;let s=M.fresh(seed*713,[id]);
 s.clearedMaps=Array.from({length:region},(_,i)=>i);s.pets[0].rarity=rarity;
 s.pets[0].faces=M.naturalPetFaces(id,rarity);s.pets[0].baseFaces=s.pets[0].faces.slice();s.pets[0].baseHP=M.naturalPetHP(id,rarity);s.pets[0].skills=M.petSkills({id,rarity});s.active=flat(s.pets[0]);
 s=M.startMap(s,region,seed*713);s=check(s,'form fixture');
 if(seed===2)s=action(s,'reroll');s=action(s,'challenge');
 for(let turn=0;turn<35&&s.phase==='battle';turn++){
  s=action(s,'take'); // Invalid phase must not grant rewards.
  if(s.hpRatio<.65&&s.potions&&!s.usedHeal){s=action(s,'heal');const used=s;s=action(s,'heal');assert.deepEqual(flat(s),flat(used));}
  if(s.boosts&&!s.doubled&&turn%3===0){s=action(s,'boost');const used=s;s=action(s,'boost');assert.deepEqual(flat(s),flat(used));}
  s=action(s,turn%7===2?'guard':'attack');
 }
 assert.notEqual(s.phase,'battle','bounded fight did not end: '+id+'/'+rarity);battles++;
}
// Traverse every layer and settlement path. Force HP=1 only to isolate
// progression correctness from combat tuning; no player save is involved.
let s=M.syncStamina(M.fresh(97),T);
for(const map of M.MAPS){
 s=M.syncStamina(s,T+(map.id+1)*3600000);s=M.enterExpedition(s,map.id,T+(map.id+1)*3600000);
 assert.equal(s.mapId,map.id);assert.equal(s.stamina.value,25);
 for(let step=1;step<=map.stages;step++){
  assert.equal(s.step,step);assert.equal(s.phase,'encounter');s=action(s,'challenge');s.enemyHP=1;s.hpRatio=1;s=action(s,'attack');floors++;
  if(s.phase==='reward')s=action(s,'take');
  if(s.phase==='nest'){
   while(s.eggHunt.candidates.length<s.eggHunt.limit)s=action(s,'eggSearch');
   const ranks={normal:0,SR:1,SSR:2},best=Math.max(...s.eggHunt.candidates.map(e=>ranks[e.rarity]));
   assert.equal(s.eggHunt.selected,s.eggHunt.candidates.findIndex(e=>ranks[e.rarity]===best));
   s=action(s,'eggTake');const claimed=s;s=action(s,'eggTake');assert.deepEqual(flat(s),flat(claimed));s=action(s,'eggContinue');
  }
 }
 assert.equal(s.phase,'won');assert.ok(s.clearedMaps.includes(map.id));s=check(M.retreatExpedition(s,T+(map.id+1)*3600000),'settlement');assert.equal(s.expedition,false);
}
assert.equal(floors,450);assert.equal(s.clearedMaps.length,9);assert.equal(s.pets.length,2,'combat must not recruit pets');
console.log('PASS '+JSON.stringify({battles,floors,actions,checkpoints,allForms:162,balancedPlaythrough:false}));
