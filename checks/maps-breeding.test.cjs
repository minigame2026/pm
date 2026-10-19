const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:mod.exports,Math,Date,JSON,Set});
const M=mod.exports,copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.deepEqual(copy(a),copy(b));
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
function saved(s){const n=M.restore(JSON.stringify(s));assert.ok(n,'state must survive save/load');eq(n,s);return n;}
function mapState(mapId,step=1,seed=73){let s=M.fresh(seed);s.clearedMaps=Array.from({length:mapId},(_,i)=>i);s=M.startMap(s,mapId,seed);s.step=step;return s;}
function defeated(s){s=M.act(s,'challenge');assert.equal(s.phase,'battle');s.enemyHP=1;s.attack=999;return M.act(s,'attack');}
function nestAt(mapId,step,seed=73){let s=defeated(mapState(mapId,step,seed));if(s.phase==='reward')s=M.act(s,'take');assert.equal(s.phase,'nest');return s;}
function parents(extra=false){const s=M.fresh(47,extra?['fox','turtle','bud']:['fox','turtle']);s.pets[0].sex='female';s.pets[1].sex='male';s.pets[0].skills=['opening','charged','healing'];s.pets[1].skills=['armor','focus','barrier'];s.active=copy(s.pets[0]);s.reserve=copy(s.pets[1]);s.runRoster={};for(const p of s.pets)s.runRoster[p.uid]=copy(p);return s;}
function pair(s,now=2000){return M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,now);}

test('three maps contain 18 distinct species and 54 separately named forms',()=>{
 eq(M.MAPS.map(m=>m.id),[0,1,2]);eq(M.MAPS.map(m=>m.stages),[10,20,30]);
 const ids=M.MAPS.flatMap(m=>m.pets),names=[],keys=[];
 assert.equal(new Set(ids).size,18);eq([...ids].sort(),[...M.PET_IDS].sort());
 for(const map of M.MAPS){assert.equal(map.pets.length,6);assert.ok(map.name);assert.equal(M.mapStageCount({mapId:map.id}),map.stages);assert.equal(M.mapFor({mapId:map.id}).id,map.id);for(const id of map.pets)for(const rarity of M.RARITIES){keys.push(M.formKey({id,rarity}));names.push(M.petName({id,rarity}));}}
 assert.equal(new Set(keys).size,54);assert.equal(new Set(names).size,54);
});
test('locked maps cannot start and unlock only after the preceding final egg is continued',()=>{
 let s=M.fresh(91);assert.equal(M.mapUnlocked(s,0),true);assert.equal(M.mapUnlocked(s,1),false);assert.equal(M.mapUnlocked(s,2),false);
 for(const id of [-1,1,2,3,1.5])assert.equal(M.startMap(s,id,1),s);
 s=nestAt(0,10);assert.equal(M.mapUnlocked(s,1),false);s=M.act(M.act(s,'eggSearch'),'eggTake');assert.equal(s.phase,'eggClaimed');assert.equal(M.mapUnlocked(s,1),false);
 s=M.act(saved(s),'eggContinue');assert.equal(s.phase,'won');assert.equal(s.step,10);assert.equal(M.mapUnlocked(s,1),true);assert.equal(M.mapUnlocked(s,2),false);
 const next=M.startMap(saved(s),1,92);assert.equal(next.mapId,1);assert.equal(next.step,1);assert.equal(next.phase,'encounter');eq(next.eggs,s.eggs);eq(next.pets,s.pets);saved(next);
});
test('every map ends at its own final stage and all generated encounters remain in its ranked pool',()=>{
 let s=M.fresh(127),expectedWins=0;
 for(const map of M.MAPS){s=M.startMap(s,map.id,127+map.id);for(let step=1;step<=map.stages;step++){
   assert.equal(s.step,step);assert.equal(s.mapId,map.id);assert.equal(s.phase,'encounter');const pool=M.encounterPool(step,map.id);
   assert.equal(pool.length,step%5?4:1);assert.ok(pool.every(id=>map.pets.includes(id)));assert.ok(pool.includes(s.enemy));assert.equal(M.enemyPet(s).rarity,s.enemyRarity);assert.equal(M.enemyName(s),M.petName(M.enemyPet(s)));saved(s);
   s=defeated(s);if(s.phase==='reward')s=M.act(s,'take');
   if(step%5===0){assert.equal(s.phase,'nest');assert.equal(s.eggHunt.limit,step%10===0?3:2);s=M.act(M.act(s,'eggSearch'),'eggTake');assert.equal(s.phase,'eggClaimed');s=M.act(saved(s),'eggContinue');}
   if(step===map.stages){expectedWins++;assert.equal(s.phase,'won');assert.equal(s.step,map.stages);assert.equal(s.wins,expectedWins);assert.ok(s.clearedMaps.includes(map.id));}else assert.equal(s.phase,'encounter');
 }
 saved(s);}
 assert.equal(M.continueAdventure(s),s);eq(s.clearedMaps,[0,1,2]);
});
test('later maps and later comparable stages raise health, attack and enemy form quality',()=>{
 for(const step of [1,5,10]){const health=M.MAPS.map(m=>M.enemyHealthForStage(step,m.id));assert.ok(health[0]<health[1]&&health[1]<health[2]);}
 for(const map of M.MAPS){let priorRarity=-1;for(let step=1;step<=map.stages;step++){const rarity=M.RARITIES.indexOf(M.encounterRarity(step,map.id));assert.ok(rarity>=priorRarity);priorRarity=rarity;}
   const early=mapState(map.id,1),late=mapState(map.id,map.stages-1);early.enemy=late.enemy=map.pets[0];early.enemyRarity=M.encounterRarity(1,map.id);late.enemyRarity=M.encounterRarity(late.step,map.id);
   assert.ok(M.enemyHealthForStage(late.step,map.id)>M.enemyHealthForStage(1,map.id));const a=M.enemyAttackFaces(early),b=M.enemyAttackFaces(late);assert.ok(b.every((n,i)=>n>a[i]));
 }
});
test('egg distributions total 100 and improve across each map and between maps',()=>{
 const all=[];for(const map of M.MAPS)for(let step=5;step<=map.stages;step+=5){const r=M.eggRates({mapId:map.id,step});assert.equal(r.normal+r.SR+r.SSR,100);for(const v of Object.values(r))assert.ok(Number.isFinite(v)&&v>=0&&v<=100);all.push(r);}
 for(let i=1;i<all.length;i++){assert.ok(all[i].normal<=all[i-1].normal);assert.ok(all[i].SSR>=all[i-1].SSR);}
 for(const step of [5,10]){const rates=M.MAPS.map(m=>M.eggRates({mapId:m.id,step}));assert.ok(rates[0].SSR<rates[1].SSR&&rates[1].SSR<rates[2].SSR);}
});
test('stage 25/30 nests, claimed eggs and hatching survive saves without cross-map species',()=>{
 for(const map of M.MAPS)for(let step=5;step<=map.stages;step+=5){let s=nestAt(map.id,step);s=saved(s);for(let i=0;i<s.eggHunt.limit;i++)s=M.act(s,'eggSearch');s=saved(s);
   for(const e of s.eggHunt.candidates){assert.equal(e.mapId,map.id);assert.equal(e.stage,step);assert.ok(map.pets.includes(e.affinity));}
   s=M.act(s,'eggTake');s=saved(s);const egg=s.eggs.at(-1);s=M.act(s,'eggContinue');s=M.startIncubation(saved(s),egg.id,0,1000);s=saved(s);assert.ok(M.RARITIES.indexOf(s.incubators[0].result)>=M.RARITIES.indexOf(egg.rarity));
   s=M.claimHatch(s,0,1000+M.HATCH_DURATION);assert.equal(s.pendingHatch.petId,egg.affinity);assert.ok(map.pets.includes(s.pets.at(-1).id));saved(s);
 }
});
test('equal seed and nest position on separate maps cannot reuse egg IDs',()=>{
 const ids=[];for(const map of M.MAPS){let s=nestAt(map.id,5);s.seed=789;s.revision=10;s.wins=0;s=M.act(s,'eggSearch');ids.push(s.eggHunt.candidates[0].id);}
 assert.equal(new Set(ids).size,3);
});
test('SR and SSR eggs hatch their exact map species at the same or higher quality',()=>{
 for(const map of M.MAPS)for(const affinity of map.pets)for(const rarity of ['SR','SSR'])for(const seed of [1,93,420,9071]){
   let s=mapState(map.id,1,seed);const egg={id:'quality-'+map.id+'-'+affinity+'-'+rarity,affinity,rarity,stage:5,mapId:map.id};s.eggs.push(egg);s=M.startIncubation(s,egg.id,0,1000);assert.ok(M.RARITIES.indexOf(s.incubators[0].result)>=M.RARITIES.indexOf(rarity));s=M.claimHatch(s,0,1000+M.HATCH_DURATION);
   const child=s.pets.at(-1);assert.equal(child.id,affinity);assert.ok(M.RARITIES.indexOf(child.rarity)>=M.RARITIES.indexOf(rarity));saved(s);
 }
});
test('malformed map data and a map egg with a foreign species are rejected',()=>{
 const mutations=[s=>s.mapId=-1,s=>s.mapId=3,s=>s.mapId=1.5,s=>s.mapId='0',s=>s.mapId=undefined,s=>s.mapVersion=2,s=>s.mapId=1,s=>s.clearedMaps=[3],s=>s.clearedMaps=[0,0],s=>s.clearedMaps=[.5],s=>s.enemyRarity='bad',s=>s.step=11];
 for(const mutate of mutations){const s=M.fresh(3);mutate(s);assert.equal(M.restore(JSON.stringify(s)),null);}
 for(const [mapId,step] of [[1,21],[2,31]])assert.equal(M.restore(JSON.stringify(mapState(mapId,step))),null);
 for(const map of M.MAPS){const s=mapState(map.id);s.eggs=[{id:'foreign',rarity:'SSR',affinity:M.MAPS[(map.id+1)%3].pets[0],stage:5,mapId:map.id}];assert.equal(M.restore(JSON.stringify(s)),null);}
});
test('legacy 20-stage saves migrate once while preserving collection, eggs and ongoing battles',()=>{
 for(const step of [1,10,11,20]){let s=M.fresh(51,['fox','turtle','owl','deer']);s.step=step;s.eggs=[{id:'legacy-egg',rarity:'SSR',affinity:'dragon',stage:20}];const collection=copy(s.pets),eggs=copy(s.eggs);delete s.mapVersion;delete s.mapId;delete s.clearedMaps;const n=M.restore(JSON.stringify(s));assert.ok(n);assert.equal(n.mapId,step>10?1:0);assert.equal(n.mapVersion,1);assert.equal(M.mapUnlocked(n,1),step>10);eq(n.pets,collection);eq(n.eggs,eggs);saved(n);}
 let s=mapState(1,20);s=M.act(s,'challenge');const active=copy(s.active),attack=s.attack;s.wins=0;delete s.mapVersion;delete s.mapId;delete s.clearedMaps;s=M.restore(JSON.stringify(s));assert.ok(s);assert.equal(s.phase,'battle');assert.equal(s.attack,attack);eq(s.active,active);saved(s);
 let old=M.fresh(9);old.step=20;old.phase='won';old.wins=2;delete old.mapVersion;delete old.mapId;delete old.clearedMaps;old=M.restore(JSON.stringify(old));assert.ok(old);assert.equal(M.mapUnlocked(old,2),true);assert.equal(old.wins,2);const next=M.continueAdventure(old);assert.equal(next.mapId,2);assert.equal(next.step,1);saved(next);
});
test('breeding consumes both parents exactly when the 30-minute egg is claimed',()=>{
 let s=parents(),parentsBefore=copy(s.pets),ownedBefore=copy(s.owned),qualitiesBefore=copy(s.qualities);s=pair(s);assert.equal(M.BREED_DURATION,30*60*1000);assert.equal(s.breeding.readyAt-s.breeding.startedAt,M.BREED_DURATION);const genes=copy(s.breeding.genes),eggId=s.breeding.id;
 assert.equal(M.claimBreeding(s,2000+M.BREED_DURATION-1),s);eq(s.pets,parentsBefore);s=saved(s);const before=s;s=M.claimBreeding(s,2000+M.BREED_DURATION);eq(before.pets,parentsBefore);assert.equal(s.pets.length,0);assert.equal(s.breeding,null);assert.equal(s.eggs.length,1);assert.equal(s.eggs[0].id,eggId);eq(s.eggs[0].genes,genes);eq(s.owned,ownedBefore);eq(s.qualities,qualitiesBefore);assert.equal(M.claimBreeding(s,99999999),s);saved(s);
});
test('no-parent remainder is a valid empty collection and cannot adventure before hatch',()=>{
 let s=M.claimBreeding(pair(parents()),2000+M.BREED_DURATION);s=saved(s);assert.equal(M.hasActivePet(s),false);assert.equal(s.active.uid,undefined);assert.equal(s.reserve,null);eq(s.team,['','','']);eq(s.runRoster,{});
 for(const action of ['challenge','reroll','switch','attack'])assert.equal(M.act(s,action),s);assert.equal(M.restartRun(s,8),s);assert.equal(M.startMap(s,0,8),s);
 const egg=s.eggs[0];s=M.startIncubation(s,egg.id,0,5000000);assert.equal(M.claimHatch(s,0,5000000+M.HATCH_DURATION-1),s);assert.equal(s.pets.length,0);s=saved(s);s=M.claimHatch(s,0,5000000+M.HATCH_DURATION);
 const child=s.pets[0];assert.equal(s.pets.length,1);assert.equal(M.hasActivePet(s),true);assert.equal(s.active.uid,child.uid);eq(s.team,[child.uid,'','']);assert.equal(s.phase,'encounter');assert.equal(child.id,egg.genes.id);assert.equal(child.rarity,egg.genes.rarity);assert.equal(child.baseHP,egg.genes.baseHP);eq(child.baseFaces,egg.genes.baseFaces);eq(child.skills,egg.genes.skills);assert.equal(M.claimHatch(s,0,99999999),s);s=saved(s);s=M.acknowledgeHatch(s);assert.equal(M.act(s,'challenge').phase,'battle');
});
test('remaining teammates replace consumed parents without dangling team or run records',()=>{
 let s=parents(true),removed=s.pets.slice(0,2).map(p=>p.uid),remaining=s.pets[2];s.team=[removed[0],removed[1],remaining.uid];s.runRoster[remaining.uid].faces=[8,9,10];s=pair(s);s=M.claimBreeding(s,2000+M.BREED_DURATION);
 assert.equal(s.pets.length,1);assert.equal(s.active.uid,remaining.uid);eq(s.active.faces,[8,9,10]);assert.equal(s.reserve,null);for(const uid of removed){assert.ok(!s.team.includes(uid));assert.ok(!Object.hasOwn(s.runRoster,uid));assert.ok(!s.pets.some(p=>p.uid===uid));}assert.equal(new Set(s.team.filter(Boolean)).size,1);saved(s);
});
test('battle and pending reveal block breeding claims without consuming either parent',()=>{
 let s=pair(parents(true));s=M.act(s,'challenge');assert.equal(M.claimBreeding(s,2000+M.BREED_DURATION),s);assert.equal(s.pets.length,3);assert.equal(s.eggs.length,0);
 let reveal=pair(parents());reveal.eggs.push({id:'other-hatch',affinity:'bud',rarity:'normal',stage:5});reveal=M.startIncubation(reveal,'other-hatch',0,0);reveal=M.claimHatch(reveal,0,M.HATCH_DURATION);assert.ok(reveal.pendingHatch);assert.equal(M.claimBreeding(reveal,2000+M.BREED_DURATION),reveal);saved(reveal);
});
test('claiming breeding after combat clears obsolete parent skill state and remains saveable',()=>{
 let s=pair(parents(true)),remaining=s.pets[2];s=defeated(s);assert.equal(s.phase,'reward');assert.ok(s.skill.usedCodes.includes('opening'));s=M.claimBreeding(s,2000+M.BREED_DURATION);assert.equal(s.pets.length,1);assert.equal(s.active.uid,remaining.uid);saved(s);
});
console.log(passed+' map/breeding groups passed; '+failed+' failed');if(failed)process.exitCode=1;
