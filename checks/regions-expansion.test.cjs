const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const flat=x=>JSON.parse(JSON.stringify(x)),T=1780000000000;
assert.equal(M.PET_IDS.length,36);assert.equal(M.NEW_PET_IDS.length,18);assert.equal(new Set(M.NEW_PET_IDS.map(id=>M.PETS[id].type)).size,18);
assert.deepEqual(flat(M.MAPS.map(m=>m.stages)),[10,20,30,40,50,60]);assert.equal(new Set(M.MAPS.flatMap(m=>m.pets)).size,36);
const old=JSON.parse(fs.readFileSync('docs/generated/design-data.json','utf8'));
for(const p of old.forms.filter(p=>!M.NEW_PET_IDS.includes(p.id))){assert.equal(M.petBaseHP({id:p.id,rarity:p.rarity}),p.naturalHP);assert.deepEqual(flat(M.naturalPetFaces(p.id,p.rarity)),p.naturalFaces);assert.equal(M.petName(p),p.name);}
for(let region=3;region<6;region++){
 const map=M.MAPS[region];assert.ok(map.pets.every(id=>M.NEW_PET_IDS.includes(id)));
 for(let step=1;step<=map.stages;step++){
  const pool=M.encounterPool(step,region),rank=M.rankForStage(step);assert.ok(pool.every(id=>M.PETS[id].rank===rank));
  assert.ok(M.enemyHealthForStage(step,region)>M.enemyHealthForStage(step,region-1));
  const e={mapId:region,step,enemy:pool[0],enemyRarity:M.encounterRarity(step,region)};assert.ok(M.enemyAttackFaces(e).every(n=>Number.isInteger(n)&&n>0&&n<=100));
 }
 if(region>3){const prev=M.MAPS[region-1];assert.ok(Math.min(...map.pets.map(id=>M.PETS[id].hp))>Math.max(...prev.pets.map(id=>M.PETS[id].hp)));}
 let locked=M.fresh(17);locked.clearedMaps=Array.from({length:region-1},(_,i)=>i);assert.equal(M.startMap(locked,region),locked);locked.clearedMaps.push(region-1);assert.equal(M.startMap(locked,region,17).mapId,region);
}
let count=0;
for(const id of M.NEW_PET_IDS)for(const rarity of M.RARITIES){
 const map=M.MAPS.find(m=>m.pets.includes(id));let s=M.fresh(17);s.clearedMaps=Array.from({length:map.id},(_,i)=>i);s=M.startMap(s,map.id,17);
 s.eggs=[{id:`new-${id}-${rarity}`,rarity,affinity:id,stage:map.stages,mapId:map.id}];s=M.startIncubation(s,s.eggs[0].id,0,T);s.incubators[0].result=rarity;
 assert.ok(M.restore(JSON.stringify(s)),id+' incubating save');
 s=M.claimHatch(s,0,T+31*60000);const p=s.pets.find(p=>p.uid===s.pendingHatch.uid);assert.equal(p.id,id);assert.equal(p.rarity,rarity);assert.equal(p.baseHP,M.naturalPetHP(id,rarity));assert.deepEqual(flat(p.baseFaces),flat(M.naturalPetFaces(id,rarity)));assert.ok(['female','male'].includes(p.sex));assert.equal(p.skills.length,1);
 assert.ok(M.restore(JSON.stringify(s)),id+' hatched save');s=M.acknowledgeHatch(s);assert.ok(M.restore(JSON.stringify(s)),id+' acknowledged save');
 s.step=map.stages;s.phase='nest';s.eggHunt={limit:3,candidates:[],selected:-1};s=M.act(s,'eggSearch');assert.ok(M.restore(JSON.stringify(s)),id+' floor '+map.stages+' egg save');assert.ok(map.pets.includes(s.eggHunt.candidates[0].affinity));
 count++;
}
let oldSave=M.fresh(91);assert.ok(M.restore(JSON.stringify(oldSave)));assert.ok(!M.mapUnlocked(oldSave,3));
for(let region=3;region<6;region++){
 let s=M.fresh(17);s.clearedMaps=Array.from({length:region},(_,i)=>i);s=M.startMap(s,region,17);s.step=M.MAPS[region].stages;s.enemy=M.MAPS[region].pets[5];s.enemyRarity='SSR';s=M.act(s,'challenge');s.enemyHP=1;
 s=M.act(s,'attack');assert.equal(s.phase,'nest');s=M.act(s,'eggSearch');s=M.act(s,'eggTake');assert.equal(s.phase,'eggClaimed');assert.ok(M.restore(JSON.stringify(s)));
 s=M.act(s,'eggContinue');assert.equal(s.phase,'won');assert.ok(s.clearedMaps.includes(region));assert.ok(M.restore(JSON.stringify(s)));if(region<5)assert.ok(M.mapUnlocked(s,region+1));
}
console.log(`PASS: 18 attributes, 54 new forms, six disjoint map pools, 40/50/60 floors, unlock chain, stronger regional stats, old pet data preserved, ${count} hatching/high-floor egg/save scenarios`);
