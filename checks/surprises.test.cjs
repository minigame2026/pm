const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
const src=fs.readFileSync('assets/scripts/PMModel.ts','utf8')+'\nexport const probe={rollGoldDie,rollEnemyVariant,revealEnemyVariant,rewardEnemyVariant,applyBreedingSurprises,applySkillSpecs};';
vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x)),saved=s=>{const n=M.restore(JSON.stringify(s));assert(n,'restore valid surprise state');return n;};
function base(){let s=M.fresh(91,['fox','turtle','bud']);s=M.syncStamina(s,1000);s.expedition=true;return s;}
function force(s,kind,seed=1){s.surprises={seed:kind==='shiny'?1972:seed,misses:{[kind]:Math.max(0,M.SURPRISE_RULES[kind].pity-1)},recipes:[]};return s;}
for(const kind of Object.keys(M.SURPRISE_RULES)){
 let s=base(),max=0,miss=0,hits=0;for(let i=0;i<10000;i++){if(M.surpriseChance(s,kind)){hits++;miss=0;}else miss++;max=Math.max(max,miss);}assert(hits>100);if(kind==='shiny')assert(hits>400&&hits<600,'fixed five percent');else assert(max<M.SURPRISE_RULES[kind].pity);
 s=force(base(),kind);assert(M.surpriseChance(s,kind));assert.equal(s.surprises.misses[kind],0);
 const restored=saved(s),originalSeed=s.seed;assert.equal(M.surpriseChance(s,kind),M.surpriseChance(restored,kind));assert.equal(s.seed,originalSeed,'independent random stream');
 assert.deepEqual(copy(M.restartRun(s,43).surprises),copy(s.surprises));
}
const golds=new Set();
for(let seed=1;seed<60;seed++){
 let s=M.act(base(),'challenge');s=force(s,'gold',seed);s.hpRatio=.3;s.attack=4;s.skill.shield=0;s.active.skills=['healing'];s.pets[0].skills=['healing'];s.runRoster={};s.skill.usedCodes=[];
 const dead=s.pets[1].uid;s.combatVitals[dead]={hpRatio:0,hpBonus:0};const before=M.hp(s),attack=M.attackAmount({...s,goldDie:undefined});M.probe.rollGoldDie(s);golds.add(s.goldDie);
 if(s.goldDie==='heal'){assert(M.hp(s)>before);assert.equal(M.petCombat(s,dead).hp,0);}
 if(s.goldDie==='shield')assert.equal(s.skill.shield,6);
 if(s.goldDie==='strike')assert(M.attackAmount(s)>attack);
 const r=saved(s);assert.equal(r.goldDie,s.goldDie);assert.equal(M.hp(r),M.hp(s));assert.equal(r.skill.shield,s.skill.shield);
}
assert.equal(golds.size,3);
for(const kind of ['giant','mirror','ward']){
 let s=base();s.enemyVariant={kind,revealed:false,shield:0};const max=s.enemyMax;s=M.act(s,'challenge');assert(s.enemyVariant.revealed);
 if(kind==='giant'){assert.equal(s.enemyMax,Math.ceil(max*1.4));assert.equal(M.enemyVariantAttack(s),1.2);}
 if(kind==='mirror'){s.turn=3;assert.equal(M.enemyVariantAttack(s),1.4);s.turn=2;assert.equal(M.enemyVariantAttack(s),1);}
 if(kind==='ward'){
  assert.equal(s.enemyVariant.shield,Math.ceil(max*.25));s.attack=1;s.active.skills=['healing'];s.pets[0].skills=['healing'];s.runRoster={};s.skill.usedCodes=[];delete s.goldDie;const shield=s.enemyVariant.shield,hp=s.enemyHP;s=M.act(s,'attack');assert(s.enemyVariant.shield<shield);assert.equal(s.enemyHP,hp);
 }
 s=saved(s);s.enemyHP=1;s.enemyVariant.shield=0;s=M.act(s,'attack');assert.equal(s.eggs.length,1);assert(s.enemyVariant.rewardEggId);s=saved(s);M.probe.rewardEnemyVariant(s);assert.equal(s.eggs.length,1);assert.equal(s.eggs[0].mapId,s.mapId||0);
}
// Start -> reload -> ready -> claim -> reload never re-rolls, doubles rewards or lowers rarity.
for(const rarity of ['normal','SR','SSR']){
 let s=base();s.expedition=false;s.eggs=[{id:'source-'+rarity,affinity:M.MAPS[0].pets[0],rarity,stage:5,mapId:0}];force(s,'shiny');s.surprises.misses.nested=24;
 s=M.startIncubation(s,s.eggs[0].id,0,1000);assert(s.incubators[0].shiny);assert(s.incubators[0].nestedEgg);const original=copy(s.incubators[0]);s=saved(s);assert.deepEqual(copy(s.incubators[0]),original);assert.equal(M.claimHatch(s,0,1001),s);
 s=M.claimHatch(s,0,original.readyAt);assert(s.pendingHatch.bonusEggId);assert(s.pets.at(-1).shiny);assert(M.RARITIES.indexOf(s.pets.at(-1).rarity)>=M.RARITIES.indexOf(rarity));const count=s.pets.length,eggs=s.eggs.length;s=saved(s);assert.equal(M.claimHatch(s,0,original.readyAt),s);assert.equal(s.pets.length,count);assert.equal(s.eggs.length,eggs);
 const bonus=s.eggs.find(e=>e.id===s.pendingHatch.bonusEggId);s=M.acknowledgeHatch(s);s.surprises.misses.nested=24;s=M.startIncubation(s,bonus.id,0,original.readyAt+1);assert(!s.incubators[0].nestedEgg,'no recursive bonus eggs');saved(s);
}
function parents(ids=['fox','otter','turtle']){
 let s=M.fresh(47,ids);s.pets=[s.pets.find(p=>p.id===ids[0]),s.pets.find(p=>p.id===ids[1]),...s.pets.filter(p=>!ids.slice(0,2).includes(p.id))];s.pets[0].sex='female';s.pets[1].sex='male';s.pets[0].skills=['healing'];s.pets[1].skills=['barrier'];s.active=copy(s.pets[0]);s.reserve=copy(s.pets[1]);s.runRoster={};return M.assignPartySlot(s,s.pets[2].uid,0);
}
assert.deepEqual(copy(M.SECRET_RECIPES.flatMap(r=>Array.from(r.types))).sort(),Array.from(M.TYPE_NAMES).sort(),'each of the 18 types participates exactly once');
for(const recipe of M.SECRET_RECIPES){
 const reverse={skills:['healing']};M.probe.applyBreedingSurprises(force(base(),'resonance'),{id:M.PET_IDS.find(id=>M.PETS[id].type===recipe.types[1])},{id:M.PET_IDS.find(id=>M.PETS[id].type===recipe.types[0])},reverse);assert.equal(reverse.ornament,recipe.id,'parent order does not affect recipe');
 const ids=recipe.types.map(t=>M.PET_IDS.find(id=>M.PETS[id].type===t));ids.push('turtle');let s=force(parents(ids),'resonance');const [m,f]=s.pets,count=s.pets.length;
 s=M.startBreeding(s,m.uid,f.uid,1000);assert.equal(s.breeding.genes.ornament,recipe.id);assert.equal(s.breeding.genes.skills.length,2);assert(s.breeding.genes.skills.includes('res_bloom'));s=saved(s);const genes=copy(s.breeding.genes),ready=s.breeding.readyAt;
 s=M.claimBreeding(s,ready);assert.equal(s.surprises.recipes[0],recipe.id);assert.equal(s.pets.length,count-2);assert.equal(M.claimBreeding(s,ready),s);s=saved(s);const egg=s.eggs[0];assert.deepEqual(copy(egg.genes),genes);
 s=M.startIncubation(s,egg.id,0,ready+1);s=M.claimHatch(s,0,s.incubators[0].readyAt);assert.equal(s.pets.at(-1).ornament,recipe.id);assert.deepEqual(copy(s.pets.at(-1).skills),genes.skills);saved(s);
}
for(const [skills,result] of [[['healing','barrier'],'res_bloom'],[['venom','leech'],'res_venom'],[['focus','armor'],'res_drive']]){
 let s=force(base(),'resonance');const g={skills:[...skills]};M.probe.applyBreedingSurprises(s,s.pets[0],s.pets[1],g);assert.equal(g.skills.length,2);assert(g.skills.includes(result));
 let b=M.act(base(),'challenge');b.active.skills=[result];b.pets[0].skills=[result];b.runRoster={};b.hpRatio=.4;b.skill.shield=0;b.skill.usedCodes=[];b.skill.used=false;
 M.probe.applySkillSpecs(b,[result],20);assert(b.skill.usedCodes.includes(result));
 if(result==='res_bloom'){assert(b.hpRatio>.4);assert.equal(b.skill.shield,4);}
 if(result==='res_venom'){assert(b.hpRatio>.4);assert.equal(b.skill.poison,3);assert.equal(b.skill.poisonDamage,3);}
 if(result==='res_drive'){assert.equal(b.skill.shield,5);assert(b.skill.nextMax);}
 saved(b);
}
// Same inherited skill exception still stays one; no spurious resonance.
let s=parents();s.pets[1].skills=['healing'];force(s,'resonance');s=M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,1000);assert.equal(s.breeding.genes.skills.join(),'healing');
console.log('PASS six surprises: probabilities/pity, independent saved RNG, 3 gold effects, 3 variant abilities/reward, shiny/bonus egg once, 9 recipes covering 18 types in both orders, 3 resonance effects and preserved skill counts');



