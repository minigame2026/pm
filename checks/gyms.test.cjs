const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),cache={};
function load(name){if(cache[name])return cache[name];const out=cache[name]={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:out,require:p=>load(p.replace('./','')),Math,Date,JSON,Set,Map,unescape,escape,encodeURIComponent,decodeURIComponent});return out;}
const M=load('PMModel'),copy=x=>JSON.parse(JSON.stringify(x));
assert.equal(M.GYMS?.length,9,'nine gyms');assert.equal(new Set(M.GYMS.flatMap(g=>g.types)).size,18);
let base=M.fresh(42,['fox','otter','bud']);base.expedition=false;
assert.equal(M.enterGym(base,0),base,'locked until corresponding adventure cleared');
for(let cleared=0;cleared<=9;cleared++){
 base.clearedMaps=Array.from({length:cleared},(_,i)=>i);
 for(let id=0;id<9;id++){assert.equal(M.gymUnlocked(base,id),id<cleared);const result=M.enterGym(base,id);if(id<cleared)assert.equal(result.gymRun,id);else assert.equal(result,base,'no entry to uncleared corresponding map');}
}
for(const gym of M.GYMS){
 let s=M.enterGym(base,gym.id);assert.equal(s.gymRun,gym.id);assert(s.expedition);assert.equal(s.step,1);assert(M.restore(JSON.stringify(s)));
 const legacy=copy(s);legacy.clearedMaps=[0,1,2];assert(M.restore(JSON.stringify(legacy)),'preserve a gym run entered under the old unlock rule');
 const expectedPool=M.PET_IDS.filter(id=>gym.types.includes(M.PETS[id].type));
 assert.deepEqual(copy(M.gymEnemyPool(gym.id)),copy(expectedPool),'all families of both types, including friend pets');
 assert.equal(expectedPool.length,10);assert.equal(new Set(expectedPool.map(id=>M.PETS[id].type)).size,2);
 const clears=copy(s.clearedMaps),eggs=s.eggs.length;
 for(let step=1;step<=10;step++){
  assert.equal(s.step,step);assert(gym.types.includes(M.PETS[s.enemy].type));
  assert.equal(s.enemyMax,Math.round(M.legacyEnemyHealthForStage(step,gym.id)*1.5));
  const adventure=copy(s);delete adventure.gymRun;delete adventure.gymDifficultyVersion;
  assert.deepEqual(copy(M.enemyAttackFaces(s)),copy(M.enemyAttackFaces(adventure).map(v=>Math.round(v*1.5))));
  if(step===5)assert(['SR','SSR'].includes(s.enemyRarity));if(step===10)assert.equal(s.enemyRarity,'SSR');
  s=M.act(s,'challenge');assert(M.enemyAttackFaces(s).includes(s.enemyAttack),'roll uses the displayed boosted faces');
  assert.equal(M.enemyAttackAmount(s),M.typedDamage(s.enemyAttack,M.matchupMultiplier(s.enemy,s.active.id)),'damage does not multiply difficulty twice');
  const resumed=M.restore(JSON.stringify(s));assert(resumed);assert.equal(resumed.enemyMax,s.enemyMax);assert.equal(resumed.enemyAttack,s.enemyAttack);
  assert.deepEqual(copy(M.enemyAttackFaces(resumed)),copy(M.enemyAttackFaces(s)));
  s.enemyHP=1;s.attack=100;s=M.act(s,'attack');
  if(step<10){assert.equal(s.phase,'reward');s=M.act(s,s.reward.kind==='attack'||s.reward.kind==='heal'?'keep':'take');assert.equal(s.phase,'encounter','no egg hunt or random event');}
 }
 assert.equal(s.phase,'won');assert(s.gymBadges.includes(gym.id));assert.equal(s.eggs.length,eggs);assert.deepEqual(copy(s.clearedMaps),clears);
 assert.equal(M.enterGym(s,gym.id),s,'cannot replay');assert(M.restore(JSON.stringify(s)));
 const home=M.retreatExpedition(s);assert.equal(home.gymRun,undefined);assert(home.gymBadges.includes(gym.id));assert(M.restore(JSON.stringify(home)));
}
// Repeated seeded entries must be able to select every family in each rarity.
for(const gym of M.GYMS){
 const seen=new Set();for(let seed=1;seed<=3000;seed++){base.seed=Math.imul(seed,2654435761)>>>0;const s=M.enterGym(base,gym.id);seen.add(s.enemy+':'+s.enemyRarity);}
 for(const id of M.gymEnemyPool(gym.id))for(const rarity of ['normal','SR','SSR'])assert(seen.has(id+':'+rarity),gym.name+' missing '+id+':'+rarity);
}
// A legacy saved turn keeps both committed HP and its unboosted dice until the next encounter.
let legacy=M.enterGym(base,4);delete legacy.gymDifficultyVersion;legacy.enemyMax=M.legacyEnemyHealthForStage(1,4);legacy.enemyHP=legacy.enemyMax-7;
legacy=M.act(legacy,'challenge');const saved=copy(legacy);legacy=M.restore(JSON.stringify(legacy));assert(legacy);
assert.equal(legacy.enemyHP,saved.enemyHP);assert.equal(legacy.enemyMax,saved.enemyMax);assert.equal(legacy.enemyAttack,saved.enemyAttack);
assert.deepEqual(copy(M.enemyAttackFaces(legacy)),copy(M.enemyAttackFaces(saved)));
legacy.enemyHP=1;legacy.attack=100;legacy=M.act(legacy,'attack');legacy=M.act(legacy,legacy.reward.kind==='attack'||legacy.reward.kind==='heal'?'keep':'take');
assert.equal(legacy.step,2);assert.equal(legacy.gymDifficultyVersion,1);assert.equal(legacy.enemyMax,Math.round(M.legacyEnemyHealthForStage(2,4)*1.5));
for(let mapId=0;mapId<9;mapId++){const s=M.startMap(base,mapId,42);assert.equal(s.gymRun,undefined);assert.equal(s.enemyMax,M.enemyHealthForStage(1,mapId));}
console.log('PASS nine gyms / 18 types / 10 families and 30 forms each, +50% HP and dice, roll/damage/reload consistency, legacy turn preservation, unchanged adventure, ten fights and badges.');
let before=M.fresh(41,['fox','otter','bud']),boosted=copy(before);boosted.gymBadges=[2];boosted.attack=before.attack=10;boosted.skill=before.skill=undefined;
assert.equal(M.maxHP(boosted),Math.round(M.maxHP(before)*1.1));assert(M.attackAmount(boosted)>M.attackAmount(before));assert.deepEqual(copy(boosted.pets),copy(before.pets),'badge never changes genetic bases');
assert.equal(M.petCombat(boosted,boosted.active.uid).max,M.maxHP(boosted));
assert.equal(M.gymBonus(boosted,'otter'),1);assert.equal(M.gymBonus(boosted,'fox'),1.1);assert.equal(M.enemyAttackAmount(boosted),M.enemyAttackAmount(before));
