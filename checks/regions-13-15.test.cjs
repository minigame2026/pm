const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
const source=fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8');
vm.runInNewContext(ts.transpileModule(source+'\nexport const expansionProbe={readySkillSpecs,applySkillSpecs,newBattleSkill,roll,encounter};',{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const roster=JSON.parse(fs.readFileSync(path.join(root,'art-source/regions-13-15/roster.json'),'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>assert.deepEqual(copy(a),copy(b)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const save=s=>{const result=M.restore(JSON.stringify(s));assert(result,'save restores');same(result,s);return result;};
let checks=0;const test=(label,fn)=>{fn();checks++;console.log('PASS '+label);};

test('append-only species, skills and maps preserve every old content value and share index',()=>{
 assert.equal(M.PET_IDS.length,108);assert.equal(M.MAPS.length,15);assert.equal(M.NATURAL_SKILL_CODES.length,162);assert.equal(M.TEMP_SKILLS.length,32);
 same(M.PET_IDS.slice(90),roster.pets.map(p=>p.id));same(M.MYTHIC_PET_IDS,roster.pets.map(p=>p.id));
 assert.equal(hash(Object.fromEntries(Object.entries(M.PETS).slice(0,90))),'d42cce48992c8d5dbb18f8b3082839933f7272827dbf636bf2f6c60f3b460071');
 assert.equal(hash(Object.fromEntries(Object.entries(M.SKILLS).slice(0,159))),'3b425f20170b7794f47ec4d2a4b2369ff99368395f07b938ea0ec6cc6cdfe1b8');
 assert.equal(hash(Object.fromEntries(Object.entries(M.SKILL_SPECS).filter(([c])=>!c.startsWith('trait_mythic_')))),'a63509c6357715bcd050c7778b7fa6e59068d25e596879fc03b635ba39f6b1ec');
 assert.equal(hash(M.MAPS.slice(0,12)),'647add339ea1e119aa1c2ca4440a7da95883c5e9964513c5f58b97996f8374bd');
 assert.equal(hash(M.ADVENTURE_DIFFICULTY.slice(0,12)),'1f310dfc6911a3e7cc261f1c3e8f1c1ae8ad1b3856d1dbc044cca6d03565ab61');
 assert.equal(hash(Object.fromEntries(Object.entries(M.FORM_NAMES).slice(0,90))),'0772f8700f6f16780ca9735a1912a32a417214477c73684a0d6a0ff1c73e920f');
});

const curve=[];
test('18 distinct types, 54 forms and 30 progressively budgeted encounters; refresh cannot alter base strength',()=>{
 assert.equal(roster.pets.length,18);assert.equal(new Set(roster.pets.map(p=>p.type)).size,18);
 const names=new Set();for(const p of roster.pets){assert.equal(M.PETS[p.id].type,p.type);same(M.FORM_NAMES[p.id],p.forms.map(f=>f.name));for(const rarity of M.RARITIES){names.add(M.petName({id:p.id,rarity}));assert(M.naturalPetHP(p.id,rarity)<=200);assert(Math.max(...M.naturalPetFaces(p.id,rarity))<=100);assert(M.SHINY_PETS.includes(p.id));}}
 assert.equal(names.size,54);
 for(const map of roster.maps){assert.equal(map.stages,10);same(M.MAPS[map.id].pets,map.pets);same(M.encounterPool(1,map.id),map.pets.slice(0,4));same(M.encounterPool(5,map.id),map.pets.slice(4,5));same(M.encounterPool(10,map.id),map.id===14?[map.pets[5],map.pets[1],map.pets[3]]:map.pets.slice(5));
  for(let step=1;step<=10;step++){
   const state=(id,enemy)=>({mapId:id,step,enemy,enemyRarity:M.encounterRarity(step,id),adventureDifficultyVersion:id>=12?2:1});
   const hp=M.enemyHealthForStage(step,map.id),oldHP=M.enemyHealthForStage(step,map.id-1);assert(hp>oldHP&&hp/oldHP<(map.id===14?1.34:1.12),'final map trades burst attack for bounded extra HP');
   const all=M.encounterPool(step,map.id).map(enemy=>M.enemyAttackFaces(state(map.id,enemy)));for(const faces of all)for(let i=0;i<3;i++)assert(Math.abs(faces[i]-all[0][i])<=3,'boss types stay within the same attack budget');
   const oldFaces=M.enemyAttackFaces(state(map.id-1,M.encounterPool(step,map.id-1)[0]));for(let i=0;i<3;i++)assert(all[0][i]/oldFaces[i]>=.92&&all[0][i]/oldFaces[i]<1.36,'final map burst stays bounded;14 late floors ease cumulative attrition');
   curve.push({map:map.id+1,floor:step,role:M.rankForStage(step),hp,attack:copy(all[0])});
   const fresh=M.fresh(1);fresh.clearedMaps=Array.from({length:map.id},(_,i)=>i);let s=M.startMap(fresh,map.id,71);s.step=step;M.expansionProbe.encounter(s,false,false);const first=s.enemy;const committed=s.enemyMax;M.expansionProbe.encounter(s,true,false);assert.equal(s.enemyMax,committed);assert(all.some(f=>JSON.stringify(f)===JSON.stringify(M.enemyAttackFaces(s))));if(step!==5&&step!==10)assert.notEqual(s.enemy,first);
  }
  let s=M.fresh(1);assert.equal(M.mapUnlocked(s,map.id),false);s.clearedMaps=Array.from({length:map.id},(_,i)=>i);assert(M.mapUnlocked(s,map.id));s=M.startMap(s,map.id,7);assert.equal(s.mapId,map.id);assert(map.pets.includes(s.enemy));save(s);
 }
});

test('all maps use the approved map12 egg rates and new maps complete, hatch map eggs and unlock sequentially',()=>{
 for(let id=0;id<15;id++)for(const [i,step] of [5,10].entries()){const e=M.eggRates({mapId:id,step});same([e.normal,e.SR,e.SSR],i?[60,30,10]:[80,15,5]);}
 for(const map of roster.maps){let s=M.fresh(27);s.clearedMaps=Array.from({length:map.id},(_,i)=>i);s=M.startMap(s,map.id,27);s.expedition=true;let actions=0,nests=0;
  while(s.phase!=='won'&&actions++<80){if(s.phase==='encounter')s=M.act(s,'challenge');else if(s.phase==='battle'){s.enemyHP=1;s=M.act(s,'attack');}else if(s.phase==='reward')s=M.act(s,'take');else if(s.phase==='event')s=M.act(s,'eventContinue');else if(s.phase==='nest'){s=M.act(s,'eggSearch');assert(s.eggHunt.candidates.every(e=>map.pets.includes(e.affinity)&&e.mapId===map.id));s=M.act(s,'eggTake');nests++;}else if(s.phase==='eggClaimed')s=M.act(s,'eggContinue');else assert.fail(s.phase);}
  assert.equal(s.phase,'won');assert.equal(s.step,10);assert.equal(nests,2);assert(s.clearedMaps.includes(map.id));if(map.id<14)assert(M.mapUnlocked(s,map.id+1));save(s);
 }
});

test('54 new skills have unique trigger/effect combinations, distinct from old permanent and temporary skills',()=>{
 const codes=roster.pets.flatMap(p=>p.skills.map(sk=>sk.code)),old=new Set(Object.entries(M.SKILL_SPECS).filter(([c])=>!codes.includes(c)).map(([,v])=>[v.when,v.gate,v.effect].join('/'))),combos=new Set();assert.equal(new Set(codes).size,54);
 for(const p of roster.pets)for(const [i,sk] of p.skills.entries()){const v=M.SKILL_SPECS[sk.code];same(M.SKILLS[sk.code],[sk.name,sk.description]);same(v,{when:sk.when,gate:sk.gate,effect:sk.effect,amount:sk.amount});same(M.petSkills({id:p.id,rarity:M.RARITIES[i]}),[sk.code]);const c=[v.when,v.gate,v.effect].join('/');assert(!old.has(c));combos.add(c);if(['damage','drain','venomDrain'].includes(v.effect))assert.equal(v.when,'attack');if(['reduce','evade','survive'].includes(v.effect))assert.equal(v.when,'hit');if(v.effect==='maxRoll')assert.equal(v.when,'roll');}
 assert.equal(combos.size,54);
});

function battle(p,sk){let s=M.fresh(19,[p.id,'fox','turtle']);s=M.selectActive(s,s.pets.find(x=>x.id===p.id).uid);const pet=s.pets.find(x=>x.uid===s.active.uid),rarity=M.RARITIES[p.skills.indexOf(sk)];Object.assign(pet,{rarity,baseHP:M.naturalPetHP(p.id,rarity),baseFaces:copy(M.naturalPetFaces(p.id,rarity)),faces:copy(M.naturalPetFaces(p.id,rarity)),skills:[sk.code]});s.active=copy(pet);s.runRoster={};s=M.act(s,'challenge');s.enemy='cotton';s.enemyMax=s.enemyHP=10000;s.enemyAttack=35;s.hpRatio=.6;s.skill=M.expansionProbe.newBattleSkill();s.potions=s.boosts=6;s.turn=2;s.attack=sk.gate==='odd'?31:30;
 const other=s.pets.find(x=>x.uid!==s.active.uid);s.reserve=copy(other);s.team=[s.active.uid,other.uid,''];s.combatVitals=s.combatVitals||{};s.combatVitals[other.uid]={hpRatio:sk.gate==='allyDown'?0:1,hpBonus:0};
 if(sk.gate==='late')s.turn=4;if(sk.gate==='noHeal')s.potions=0;if(sk.gate==='noBoost')s.boosts=sk.when==='boost'?1:0;return s;
}
function noSkills(s){const b=copy(s);b.active.skills=[];b.pets.find(p=>p.uid===b.active.uid).skills=[];if(b.runRoster[b.active.uid])b.runRoster[b.active.uid].skills=[];return b;}
test('every new skill produces its actual effect, once only, across battle saves, negative gates and battle reset',()=>{
 for(const p of roster.pets)for(const sk of p.skills){const v=M.SKILL_SPECS[sk.code],code=sk.code;let s=battle(p,sk),n,b;
  const gate=copy(s);if(sk.gate==='noBoost')gate.boosts=0;assert(M.expansionProbe.readySkillSpecs(gate,v.when,99,true).includes(code),code+' positive gate');
  if(v.gate==='even')gate.attack=31;if(v.gate==='odd')gate.attack=30;if(v.gate==='late')gate.turn=1;if(v.gate==='allyDown')gate.combatVitals[gate.reserve.uid].hpRatio=1;if(v.gate==='noHeal')gate.potions=2;if(v.gate==='noBoost')gate.boosts=2;
  assert(!M.expansionProbe.readySkillSpecs(gate,v.when,99,true).includes(code),code+' negative gate');
  if(v.when==='roll'){for(let seed=1;seed<2000;seed++){n=copy(s);n.seed=seed;n.turn=v.gate==='late'?3:1;M.expansionProbe.roll(n);if(n.skill.usedCodes.includes(code)){b=noSkills(s);b.seed=seed;b.turn=v.gate==='late'?3:1;M.expansionProbe.roll(b);break;}}}
  else {n=M.act(s,v.when==='hit'?'attack':v.when);b=M.act(noSkills(s),v.when==='hit'?'attack':v.when);}
  assert(n.skill.usedCodes.includes(code),code+' public action activates');assert.equal(n.skill.usedCodes.filter(x=>x===code).length,1);assert(!M.expansionProbe.readySkillSpecs(n,v.when,999,true).includes(code));
  const e=v.effect;if(['heal','healPct','drain','venomDrain'].includes(e))assert(n.hpRatio>b.hpRatio,code+' heals actual HP');if(e==='shield')assert(n.skill.shield>b.skill.shield||n.skill.lastTaken<b.skill.lastTaken,code+' absorbs actual damage');if(e==='reduce')assert(n.skill.lastTaken<b.skill.lastTaken,code+' reduces actual damage');if(e==='evade')assert.equal(n.skill.lastTaken,0,code);if(['poison','venomDrain'].includes(e))assert.equal(n.skill.poisonDamage,v.amount,code);if(e==='damage')assert(n.skill.lastDamage>b.skill.lastDamage,code+' deals bonus damage');if(e==='refundHeal')assert.equal(n.potions,b.potions+1,code);if(e==='refundBoost')assert.equal(n.boosts,b.boosts+1,code);if(e==='maxRoll')assert.equal(n.attack,Math.max(...M.petAttackFaces(n.active)),code);if(e==='nextMax')assert(n.skill.nextMax||n.attack===Math.max(...M.petAttackFaces(n.active)),code);if(e==='powerGuard'){assert(n.skill.shield>=5);assert(n.skill.nextMax);}
  const restored=M.restore(JSON.stringify(n));assert(restored,code+' save');assert(restored.skill.usedCodes.includes(code));assert(!M.expansionProbe.readySkillSpecs(restored,v.when,999,true).includes(code));restored.skill=M.expansionProbe.newBattleSkill();if(v.gate==='noBoost')restored.boosts=0;if(v.gate==='noHeal')restored.potions=0;restored.turn=4;restored.attack=v.gate==='odd'?31:30;assert(M.expansionProbe.readySkillSpecs(restored,v.when,99,true).includes(code),code+' next battle resets');
 }
});

test('all54 forms hatch committed shiny results and new skill/genes round-trip without inflated bonuses',()=>{
 for(const p of roster.pets)for(const rarity of M.RARITIES){let s=M.fresh(7);s.eggs=[{id:'mythic-test',rarity,affinity:p.id,stage:5,mapId:p.mapId}];s.surprises={seed:1972,misses:{shiny:0},recipes:[]};s=M.startIncubation(s,'mythic-test',0,1000);assert(s.incubators[0].shiny);const committed=copy(s.incubators[0]);s=save(s);same(s.incubators[0],committed);s=M.claimHatch(s,0,committed.readyAt);const child=s.pets.at(-1);assert.equal(child.id,p.id);assert(child.shiny);same(child.skills,M.petSkills({id:p.id,rarity:committed.result}));assert.equal(Math.max(...M.petAttackFaces(child)),Math.max(...child.baseFaces)+2);save(s);assert.equal(M.claimHatch(s,0,committed.readyAt),s);}
});

test('new/old breeding and six-new-skill breeding preserve selection, inherited genes and shiny state through hatching',()=>{
 for(const ids of [['oathhippo','fox'],['chronospine','bellhummer']]){let s=M.fresh(44,['turtle',...ids]);s=M.selectActive(s,s.pets.find(p=>p.id==='turtle').uid);const [mother,father]=s.pets.filter(p=>ids.includes(p.id));mother.sex='female';father.sex='male';s.reserve=copy(mother);s.runRoster={};s=M.startBreeding(s,mother.uid,father.uid,1000);assert(s.breeding);const genes=copy(s.breeding.genes);assert(ids.includes(genes.id));assert.equal(new Set(genes.skills).size,2);assert(genes.skills.every(c=>[...mother.skills,...father.skills].includes(c)));s=save(s);s=M.claimBreeding(s,s.breeding.readyAt);const egg=s.eggs.find(e=>e.genes);same(egg.genes,genes);s=save(s);s=M.startIncubation(s,egg.id,0,2000000);s=M.claimHatch(save(s),0,s.incubators[0].readyAt);same(s.pets.at(-1).skills,genes.skills);save(s);}
 let sawSix=false;for(let seed=1;seed<=24;seed++){let s=M.fresh(8,['chronospine','bellhummer']);const mother=s.pets.find(p=>p.id==='chronospine'),father=s.pets.find(p=>p.id==='bellhummer');
  for(const [p,sex] of [[mother,'female'],[father,'male']]){p.sex=sex;p.rarity='SSR';p.baseHP=200;p.baseFaces=[98,100,100];p.faces=p.baseFaces.slice();p.skills=M.RARITIES.map(r=>M.petSkills({id:p.id,rarity:r})[0]);p.shiny=true;}
  s.hatchSeed=seed;s.surprises={seed:1,misses:{},recipes:[]};s=M.startBreeding(s,mother.uid,father.uid,1000);assert(s.breeding);const g=s.breeding.genes;sawSix||=g.skills.length===6;assert(g.skills.length>=4&&g.skills.length<=6);assert(g.skills.every(c=>c.startsWith('trait_mythic_')));assert.equal(g.baseHP,200);same(g.baseFaces,[98,100,100]);assert(g.shiny);s=save(s);s=M.claimBreeding(s,s.breeding.readyAt);const egg=s.eggs.find(e=>e.genes);s=M.startIncubation(s,egg.id,0,2000000);s=M.claimHatch(save(s),0,s.incubators[0].readyAt);const child=s.pets.at(-1);same(child.baseFaces,[98,100,100]);same(M.petAttackFaces(child),[98,102,102]);save(s);
 }
 assert(sawSix,'six-skill inheritance branch covered');
});

test('54 forms and their skills round-trip through both visit code formats and arena legacy challenge format',()=>{
 const A={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'assets/scripts/PMArena.ts'),'utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:A,require:()=>M,Math,Date,JSON,Set});
 for(const p of roster.pets)for(const rarity of M.RARITIES){let s=M.ensureSocial(M.fresh(37,[p.id]),'mythic-sender');const pet=s.pets.find(x=>x.id===p.id);pet.rarity=rarity;pet.baseHP=M.naturalPetHP(p.id,rarity);pet.baseFaces=M.naturalPetFaces(p.id,rarity);pet.faces=pet.baseFaces.slice();pet.skills=M.petSkills({id:p.id,rarity});pet.shiny=true;
  const oldCard=M.readVisitCode(M.makeVisitCode(s,pet.uid)),card=M.readVisitCode(M.makePostcardCode(s,pet.uid));assert.equal(oldCard.species,p.id);assert.equal(oldCard.rarity,rarity);assert.equal(card.species,p.id);assert.equal(card.rarity,rarity);same(card.skills,pet.skills);assert(card.shiny);
  const challenge=A.readChallenge(A.challengeCode({version:1,owner:'mythic-sender',name:'Mythic',team:[copy(pet),copy(pet),copy(pet)],kind:'challenge'}));assert(challenge);for(const member of challenge.team){assert.equal(member.id,p.id);assert.equal(member.rarity,rarity);assert.equal(member.baseHP,pet.baseHP);same(member.baseFaces,pet.baseFaces);same(member.skills,pet.skills);assert(member.shiny);}
 }
});

test('all nine gyms retain their approved normalized HP and dice despite expanded opponent pools',()=>{
 const s=M.fresh(92);s.clearedMaps=Array.from({length:15},(_,i)=>i);
 for(const g of M.GYMS){const run=M.enterGym(s,g.id),pool=M.gymEnemyPool(g.id);assert.equal(pool.length,12);assert(pool.some(id=>M.MYTHIC_PET_IDS.includes(id)));for(let step=1;step<=10;step++){const ref={...run,step,enemy:pool[0]},faces=M.enemyAttackFaces(ref);for(const enemy of pool)for(const enemyRarity of M.RARITIES)same(M.enemyAttackFaces({...ref,enemy,enemyRarity}),faces);let round={...run,step};M.expansionProbe.encounter(round,false,false);assert.equal(round.enemyMax,Math.round(Math.round(M.enemyHealthForStage(step,g.id)*1.2)*M.GYM_DIFFICULTY_UPLIFT));}}
});

// Result curve is deterministic input evidence, not a claim about real-player win rates.
fs.mkdirSync(path.join(__dirname,'regions-13-15'),{recursive:true});fs.writeFileSync(path.join(__dirname,'regions-13-15/model-result.json'),JSON.stringify({passed:true,checks,skillEffects:54,formsHatched:54,curve},null,2));
console.log(checks+' regions13–15 model checks passed');
