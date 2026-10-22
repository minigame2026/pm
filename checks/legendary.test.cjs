const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
const source=fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8');
vm.runInNewContext(ts.transpileModule(source+'\nexport const legendaryProbe={readySkillSpecs,applySkillSpecs,newBattleSkill,roll};',{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set});
const roster=JSON.parse(fs.readFileSync(path.join(root,'art-source/regions-10-12/roster.json'),'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>assert.deepEqual(copy(a),copy(b));
const save=s=>{const result=M.restore(JSON.stringify(s));assert(result,'new content save restores');same(result,s);return result;};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const oldIds='fox bud turtle cotton otter spark seal ape slug mole bird owl beetle ghost dragon lynx rhino deer capy lotus manta crane mantis cragcrab cinder voltage venom dune monk ironboar frost spirit dream shade aurora starwyrm nectar orchid axolotl lantern cobra hornbill embercamel frill wombat trilobite wolverine bison narwhal raccoon octopus moonbat silkmoth kirin postplat emberhorse leafsloth bubpup arceel snowpeng punchshrimp velvetslug sandlion sailfrigate orbitphant twigbug gemnautilus shroudsprite quillwyvern nightmeerkat railpede peachflamingo'.split(' ');
const oldSkills='opening armor healing steady repeat charged focus barrier overflow refund emergency venom heavy slow evade leech tm_healStrike tm_guardHeal tm_boostShield tm_healPower tm_finisher tm_lastStand tm_firstShield tm_combo res_bloom res_venom res_drive'.split(' ').concat(Array.from({length:18},(_,i)=>[0,1,2].map(t=>'trait_'+i+'_'+t)).flat());
const oldRates=[[[95,5,0],[90,9,1]],[[90,10,0],[75,20,5]],[[84,15,1],[70,20,10]],[[80,18,2],[60,25,15]],[[75,22,3],[50,30,20]],[[70,26,4],[40,35,25]],[[65,29,6],[35,35,30]],[[60,32,8],[30,35,35]],[[55,35,10],[25,35,40]]];
let checks=0;const test=(label,fn)=>{fn();checks++;console.log('PASS '+label);};
test('90 species preserve all 72 existing species and permanent skill indexes',()=>{
 assert.equal(M.PET_IDS.length,90);same(M.PET_IDS.slice(0,72),oldIds);same(M.PET_IDS.slice(72),roster.pets.map(p=>p.id));
 assert.equal(hash(Object.fromEntries(oldIds.map(id=>[id,M.PETS[id]]))),'8314e49de80786549e5b44aee07b8171e8cb8d3e6eacd3d1c16df10315e6ba20');
 same(Object.keys(M.SKILLS).slice(0,oldSkills.length),oldSkills);
 assert.equal(hash(Object.fromEntries(Object.entries(M.SKILL_SPECS).filter(([id])=>!id.startsWith('trait_legendary_')))),'88993add65306cb6294fad79a34c0446c15196b430f4c163ae9945c68f3bc07c');
});
test('maps 10–12 have 18 types, 54 forms and progressive original-formula opponents',()=>{
 assert.equal(M.MAPS.length,12);assert.equal(roster.pets.length,18);assert.equal(new Set(roster.pets.map(p=>p.type)).size,18);
 const names=new Set();for(const p of roster.pets){assert.equal(M.PETS[p.id].type,p.type);same(M.FORM_NAMES[p.id],p.forms.map(f=>f.name));for(const r of M.RARITIES){names.add(M.petName({id:p.id,rarity:r}));assert(M.naturalPetHP(p.id,r)<=200);assert(Math.max(...M.naturalPetFaces(p.id,r))<=100);assert(M.SHINY_PETS.includes(p.id));}}
 assert.equal(names.size,54);
 for(const map of roster.maps){assert.equal(M.MAPS[map.id].stages,10);assert.equal(M.MAPS[map.id].name,map.name);same(M.MAPS[map.id].pets,map.pets);same(M.encounterPool(1,map.id),map.pets.slice(0,4));same(M.encounterPool(5,map.id),map.pets.slice(4,5));same(M.encounterPool(10,map.id),map.pets.slice(5));
  for(let step=1;step<=10;step++){const base=[7,9,11,14,24,20,23,26,29,48][step-1],expected=Math.round((base+map.id*(8+Math.floor(step*.6)))*(step===10?1.2:1.1));assert.equal(M.enemyHealthForStage(step,map.id),Math.round(expected*M.ADVENTURE_DIFFICULTY[map.id].hp));assert(expected>M.enemyHealthForStage(step,map.id-1));}
  const s=M.fresh(1);assert.equal(M.mapUnlocked(s,map.id),false);s.clearedMaps=Array.from({length:map.id},(_,i)=>i);assert(M.mapUnlocked(s,map.id));const entered=M.startMap(s,map.id,7);assert.equal(entered.mapId,map.id);assert(map.pets.includes(entered.enemy));save(entered);
 }
});
test('old egg rates are unchanged and new elite/boss rates match the approved ladder',()=>{
 for(let id=0;id<12;id++)for(const [i,step] of [5,10].entries()){const actual=M.eggRates({mapId:id,step}),expected=id<9?oldRates[id][i]:roster.maps[id-9].eggRates[i?'boss':'elite'];same([actual.normal,actual.SR,actual.SSR],expected);assert.equal(Object.values(actual).reduce((a,b)=>a+b,0),100);}
 same(M.HATCH_RATES,{normal:[90,9,1],SR:[0,95,5],SSR:[0,0,100]});
});
test('each new ten-floor expedition completes, offers map eggs and unlocks the next map',()=>{
 for(const map of roster.maps){let s=M.fresh(27);s.clearedMaps=Array.from({length:map.id},(_,i)=>i);s=M.startMap(s,map.id,27);s.expedition=true;let turns=0,nests=0;
  while(s.phase!=='won'&&turns++<80){if(s.phase==='encounter')s=M.act(s,'challenge');else if(s.phase==='battle'){s.enemyHP=1;s=M.act(s,'attack');}else if(s.phase==='reward')s=M.act(s,'take');else if(s.phase==='event')s=M.act(s,'eventContinue');else if(s.phase==='nest'){s=M.act(s,'eggSearch');assert(s.eggHunt.candidates.every(e=>map.pets.includes(e.affinity)&&e.mapId===map.id));s=M.act(s,'eggTake');nests++;}else if(s.phase==='eggClaimed')s=M.act(s,'eggContinue');else assert.fail(s.phase);}
  assert.equal(s.phase,'won');assert.equal(s.step,10);assert.equal(nests,2);assert(s.clearedMaps.includes(map.id));if(map.id<11)assert(M.mapUnlocked(s,map.id+1));save(s);
 }
});
test('54 appended skills use distinct playable trigger/effect combinations',()=>{
 const codes=roster.pets.flatMap(p=>M.RARITIES.map(r=>M.petSkills({id:p.id,rarity:r})[0]));assert.equal(new Set(codes).size,54);assert.equal(M.NATURAL_SKILL_CODES.length,108);
 const combinations=new Set();for(const code of codes){assert(code.startsWith('trait_legendary_'));const v=M.SKILL_SPECS[code];assert(v);assert(M.SKILLS[code][0]);assert(M.SKILLS[code][1].includes('每场一次'));combinations.add([v.when,v.gate,v.effect].join('/'));if(['damage','drain','venomDrain'].includes(v.effect))assert.equal(v.when,'attack');if(['reduce','evade','survive'].includes(v.effect))assert.equal(v.when,'hit');if(v.effect==='maxRoll')assert.equal(v.when,'roll');assert(!(v.when==='heal'&&v.gate==='full'),'full-health healing is not a playable trigger');}
 assert.equal(combinations.size,54,'all new skills differ by mechanics, not just name or amount');
 for(const code of codes){const v=M.SKILL_SPECS[code];assert(!(v.gate==='full'&&['heal','healPct','drain'].includes(v.effect)),'full-health healing must not waste a skill');}
 for(const p of roster.pets)for(const skill of p.skills){same(M.SKILLS[skill.code],[skill.name,skill.description]);for(const key of ['when','gate','effect','amount'])assert.equal(M.SKILL_SPECS[skill.code][key],skill[key]);}
});
test('all new skill gates trigger once and remain spent after a battle save',()=>{
 for(const p of roster.pets)for(const rarity of M.RARITIES){let s=M.fresh(18,[p.id,'fox']);s=M.act(M.selectActive(s,s.pets.find(x=>x.id===p.id).uid),'challenge');const pet=s.pets.find(x=>x.uid===s.active.uid);assert.equal(pet.id,p.id);pet.rarity=rarity;pet.baseHP=M.naturalPetHP(p.id,rarity);pet.baseFaces=M.naturalPetFaces(p.id,rarity);pet.faces=pet.baseFaces.slice();pet.skills=M.petSkills({id:p.id,rarity});s.active=copy(pet);s.runRoster={};s.skill=M.legendaryProbe.newBattleSkill();const code=pet.skills[0],v=M.SKILL_SPECS[code];s.enemyHP=100;s.enemyMax=200;s.hpRatio=.4;s.turn=2;s.attack=Math.min(...pet.faces);s.doubled=true;s.skill.attacks=2;s.skill.previousRoll=s.attack;
  if(v.gate==='full')s.hpRatio=1;if(v.gate==='first')s.turn=1;if(v.gate==='maximum')s.attack=Math.max(...pet.faces);if(v.gate==='resisted')s.enemy=M.PET_IDS.find(id=>M.matchupMultiplier(p.id,id)<1);
  assert(M.legendaryProbe.readySkillSpecs(s,v.when,999,true).includes(code),code+' reachable');assert.equal(M.legendaryProbe.readySkillSpecs(s,v.when==='attack'?'heal':'attack',999,true).includes(code),false,code+' correct event');
  M.legendaryProbe.applySkillSpecs(s,[code],40);assert(s.skill.usedCodes.includes(code));assert.equal(M.legendaryProbe.readySkillSpecs(s,v.when,999,true).includes(code),false);const restored=M.restore(JSON.stringify(s));assert(restored,code+' save');assert(restored.skill.usedCodes.includes(code));assert.equal(M.legendaryProbe.readySkillSpecs(restored,v.when,999,true).includes(code),false);
 }
});
test('all 54 new forms hatch, preserve committed shiny result and carry natural skills',()=>{
 for(const p of roster.pets)for(const rarity of M.RARITIES){let s=M.fresh(7);s.eggs=[{id:'legend-test',rarity,affinity:p.id,stage:5,mapId:p.mapId}];s.surprises={seed:1972,misses:{shiny:0},recipes:[]};s=M.startIncubation(s,'legend-test',0,1000);assert(s.incubators[0].shiny);const committed=copy(s.incubators[0]);s=save(s);same(s.incubators[0],committed);s=M.claimHatch(s,0,committed.readyAt);const child=s.pets.at(-1);assert.equal(child.id,p.id);assert(child.shiny);same(child.skills,M.petSkills({id:p.id,rarity:committed.result}));assert.equal(Math.max(...M.petAttackFaces(child)),Math.max(...child.baseFaces)+2);save(s);assert.equal(M.claimHatch(s,0,committed.readyAt),s);}
});
test('public battle actions apply new healing, poison, avoidance and one-use effects',()=>{
 function battle(id,rarity='normal'){let s=M.fresh(9,[id,'fox']);s=M.selectActive(s,s.pets.find(p=>p.id===id).uid);const p=s.pets.find(p=>p.uid===s.active.uid);p.rarity=rarity;p.skills=M.petSkills({id,rarity});s.active=copy(p);s.runRoster={};s=M.act(s,'challenge');s.enemy='cotton';s.enemyHP=s.enemyMax=999;s.enemyAttack=1;s.hpRatio=.4;s.skill=M.legendaryProbe.newBattleSkill();return s;}
 let s=battle('solion','SSR');s.attack=20;const before=M.hp(s),n=M.act(s,'attack');assert(M.hp(n)>before);assert(n.skill.usedCodes.includes('trait_legendary_solion_2'));
 s=battle('mandragrove','SR');const poisoned=M.act(s,'heal');assert.equal(poisoned.skill.poison,3);assert.equal(poisoned.skill.poisonDamage,4);assert.equal(poisoned.potions,s.potions-1);
 s=battle('oracleater','SR');const healed=M.act(s,'heal');assert.equal(healed.potions,s.potions);assert.equal(M.act(healed,'heal'),healed);
 s=battle('origamighost');s.attack=Math.min(...s.active.faces);const avoided=M.act(s,'attack');assert.equal(avoided.skill.lastTaken,0);assert.equal(avoided.hpRatio,s.hpRatio);assert(avoided.skill.usedCodes.includes('trait_legendary_origamighost_0'));
});
test('new-to-old and new-to-new breeding preserves genes and skill inheritance',()=>{
 for(const ids of [['oracleater','fox'],['triarchdrake','bloomgiraffe']]){let s=M.fresh(44,['turtle',...ids]);s=M.selectActive(s,s.pets.find(p=>p.id==='turtle').uid);const [mother,father]=s.pets.filter(p=>ids.includes(p.id));mother.sex='female';father.sex='male';s.reserve=copy(mother);s.runRoster={};s=M.startBreeding(s,mother.uid,father.uid,1000);assert(s.breeding);const genes=copy(s.breeding.genes);assert(ids.includes(genes.id));assert.equal(new Set(genes.skills).size,2);assert(genes.skills.every(c=>[...mother.skills,...father.skills].includes(c)));s=save(s);s=M.claimBreeding(s,s.breeding.readyAt);const egg=s.eggs.find(e=>e.genes);same(egg.genes,genes);s=save(s);s=M.startIncubation(s,egg.id,0,2000000);s=M.claimHatch(save(s),0,s.incubators[0].readyAt);same(s.pets.at(-1).skills,genes.skills);save(s);}
});
test('all new forms and skills round-trip through postcards and arena challenges',()=>{
 const A={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'assets/scripts/PMArena.ts'),'utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:A,require:()=>M,Math,Date,JSON,Set});
 for(const p of roster.pets)for(const rarity of M.RARITIES){let s=M.ensureSocial(M.fresh(37,[p.id]),'legend-sender');const pet=s.pets.find(x=>x.id===p.id);pet.rarity=rarity;pet.baseHP=M.naturalPetHP(p.id,rarity);pet.baseFaces=M.naturalPetFaces(p.id,rarity);pet.faces=pet.baseFaces.slice();pet.skills=M.petSkills({id:p.id,rarity});pet.shiny=true;
  const oldCard=M.readVisitCode(M.makeVisitCode(s,pet.uid)),card=M.readVisitCode(M.makePostcardCode(s,pet.uid));assert.equal(oldCard.species,p.id);assert.equal(oldCard.rarity,rarity);assert.equal(card.species,p.id);assert.equal(card.rarity,rarity);same(card.skills,pet.skills);assert(card.shiny);
  const challenge=A.readChallenge(A.challengeCode({version:1,owner:'legend-sender',name:'Legendary',team:[copy(pet),copy(pet),copy(pet)],kind:'challenge'}));assert(challenge);for(const member of challenge.team){assert.equal(member.id,p.id);assert.equal(member.rarity,rarity);assert.equal(member.baseHP,pet.baseHP);same(member.baseFaces,pet.baseFaces);same(member.skills,pet.skills);assert(member.shiny);}
 }
});
test('six inherited new skills and maximum raw stats remain valid without stacking shiny bonuses',()=>{
 let sawSix=false;for(let seed=1;seed<=24;seed++){let s=M.fresh(8,['triarchdrake','bloomgiraffe']);const mother=s.pets.find(p=>p.id==='triarchdrake'),father=s.pets.find(p=>p.id==='bloomgiraffe');
  for(const [p,sex] of [[mother,'female'],[father,'male']]){p.sex=sex;p.rarity='SSR';p.baseHP=200;p.baseFaces=[98,100,100];p.faces=p.baseFaces.slice();p.skills=M.RARITIES.map(r=>M.petSkills({id:p.id,rarity:r})[0]);p.shiny=true;}
  s.hatchSeed=seed;s.surprises={seed:1,misses:{},recipes:[]};s=M.startBreeding(s,mother.uid,father.uid,1000);assert(s.breeding);const g=s.breeding.genes;sawSix||=g.skills.length===6;assert(g.skills.length>=4&&g.skills.length<=6);assert(g.skills.every(c=>c.startsWith('trait_legendary_')));assert.equal(g.baseHP,200);same(g.baseFaces,[98,100,100]);assert(g.shiny);s=save(s);s=M.claimBreeding(s,s.breeding.readyAt);const egg=s.eggs.find(e=>e.genes);s=M.startIncubation(s,egg.id,0,2000000);s=M.claimHatch(save(s),0,s.incubators[0].readyAt);const child=s.pets.at(-1);same(child.baseFaces,[98,100,100]);same(M.petAttackFaces(child),[98,102,102]);save(s);
 }
 assert(sawSix,'the maximum six-skill inheritance branch was exercised');
});
console.log(checks+' legendary expansion checks passed');
