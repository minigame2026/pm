const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const original=fs.readFileSync('assets/scripts/PMModel.ts','utf8').replace(/\r\n/g,'\n'),{applyPCModelOverrides}=require('../tools/pc-model-overrides.cjs');
function load(source,cache={}){const out={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:1,target:4}}).outputText,{exports:out,require:p=>cache[p],Math,Date,JSON,Set,Map});return out;}
const cooking=load(fs.readFileSync('pc/game/PCCooking.ts','utf8')),M=load(applyPCModelOverrides(original),{'./PCCooking':cooking}),old=load(original),copy=v=>JSON.parse(JSON.stringify(v)),mean=a=>a.reduce((sum,n)=>sum+n,0)/a.length;
const base=()=>{const s=M.fresh(480,['fox','otter','bud']);s.clearedMaps=Array.from({length:12},(_,i)=>i);s.expedition=false;return s;};
const table=[];
for(let gym=0;gym<9;gym++){
 let s=M.enterGym(base(),gym);const world=gym+3,rows=[];
 for(let floor=1;floor<=10;floor++){
  assert.equal(s.step,floor);assert.equal(s.enemyMax,old.enemyHealthForStage(floor,world),`gym ${gym+1} floor ${floor} uses world ${world+1} HP`);
  const reference=mean(old.encounterPool(floor,world).map(enemy=>mean(old.enemyAttackFaces({...s,gymRun:undefined,gymDifficultyVersion:undefined,adventureDifficultyVersion:1,mapId:world,enemy,enemyRarity:old.encounterRarity(floor,world)}))));
  const expected=[.8,1,1.2].map(n=>Math.max(1,Math.round(reference*n)));
  assert.deepEqual(copy(M.enemyAttackFaces(s)),expected,'uses the mapped world attack budget without legacy gym multipliers');
  assert(M.gymEnemyPool(gym,floor).includes(s.enemy));assert.equal(s.mapId,gym,'difficulty does not move gym identity or scenery');
  assert.equal(s.gymDifficultyVersion,6);s=M.act(s,'challenge');assert(expected.includes(s.enemyAttack));
  const resumed=M.restore(JSON.stringify(s));assert(resumed);assert.equal(resumed.enemyHP,s.enemyHP);assert.equal(resumed.enemyAttack,s.enemyAttack);assert.deepEqual(copy(M.enemyAttackFaces(resumed)),expected);
  rows.push({floor,hp:s.enemyMax,dice:expected});s.enemyHP=1;s.attack=9999;s=M.act(s,'attack');
  if(floor<10)s=M.act(s,['attack','heal'].includes(s.reward.kind)?'keep':'take');
 }
 assert.equal(s.phase,'won');assert.deepEqual(copy(s.gymBadges),[gym]);assert.deepEqual(copy(s.clearedMaps),base().clearedMaps);
 const home=M.retreatExpedition(s);assert(home.gymBadges.includes(gym));assert.equal(M.enterGym(home,gym),home);assert(M.restore(JSON.stringify(home)));
 table.push({gym:gym+1,world:world+1,rows});
 // Every old-version ongoing encounter keeps saved HP and its displayed dice.
 for(const version of [undefined,1,2,3,4,5]){
  let legacy=old.enterGym(base(),gym);legacy.gymDifficultyVersion=version;legacy=old.act(legacy,'challenge');
  const restored=M.restore(JSON.stringify(legacy));assert(restored);assert.equal(restored.enemyMax,legacy.enemyMax);assert.equal(restored.enemyAttack,legacy.enemyAttack);assert.deepEqual(copy(M.enemyAttackFaces(restored)),copy(old.enemyAttackFaces(legacy)));
  restored.enemyHP=1;restored.attack=9999;let next=M.act(restored,'attack');next=M.act(next,['attack','heal'].includes(next.reward.kind)?'keep':'take');assert.equal(next.gymDifficultyVersion,6);assert.equal(next.enemyMax,old.enemyHealthForStage(2,world));
 }
}
for(let id=0;id<12;id++){const b=base(),s=M.startMap(b,id,88),ref=old.startMap(b,id,88);assert.equal(s.enemyMax,ref.enemyMax);assert.deepEqual(copy(M.enemyAttackFaces(s)),copy(old.enemyAttackFaces(ref)));}
for(let count=0;count<=9;count++){const b=base();b.clearedMaps=Array.from({length:count},(_,i)=>i);for(let gym=0;gym<9;gym++)assert.equal(M.gymUnlocked(b,gym),gym<count);}
const a=base(),badge=copy(a);badge.gymBadges=[2];a.attack=badge.attack=10;assert.equal(M.maxHP(badge),Math.round(M.maxHP(a)*1.1));assert(M.attackAmount(badge)>M.attackAmount(a));assert.deepEqual(copy(a.pets),copy(badge.pets));
assert.equal(fs.readFileSync('assets/scripts/PMModel.ts','utf8').replace(/\r\n/g,'\n'),original);
fs.mkdirSync('checks/pc-gyms-20261114',{recursive:true});fs.writeFileSync('checks/pc-gyms-20261114/rules.json',JSON.stringify({passed:true,encounters:90,legacyEncounters:54,unchangedWorldMaps:12,table},null,2));
console.log('PASS 90 mapped encounters, 54 legacy resumes, 12 unchanged world maps, unlocks, badges and save round trips');
