const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
function model(test=false){const M={},source=fs.readFileSync('assets/scripts/PMModel.ts','utf8').replace('BUILD_TEST_MODE=false','BUILD_TEST_MODE='+test);vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});return M;}
const M=model(),copy=s=>JSON.parse(JSON.stringify(s)),ready=(id='fox')=>M.chooseStarter(M.chooseHero(M.newJourney(411),'ranger'),id);
assert.equal(new Set(M.STARTERS.map(id=>M.petSkills(ready(id).active)[0])).size,3);
for(let mapId=0;mapId<9;mapId++){
 let s=ready();s.clearedMaps=Array.from({length:mapId},(_,i)=>i);
 assert.equal(M.latestUnlockedMap(s),mapId);assert.equal(M.MAPS[mapId].stages,10);
 s=M.enterExpedition(M.syncStamina(s,10000),mapId,10000);
 assert.equal(s.stamina.value,25);
 s.step=10;s.enemy=M.encounterPool(10,mapId)[0];s.enemyRarity='SSR';s.enemyHP=1;
 s=M.act(s,'challenge');s=M.act(s,'attack');assert.equal(s.phase,'nest');
 s=M.act(s,'eggSearch');s=M.act(s,'eggTake');s=M.act(s,'eggContinue');
 assert.equal(s.phase,'won');assert.ok(s.clearedMaps.includes(mapId));assert.ok(M.restore(JSON.stringify(s)));
}
let s=M.act(ready(),'challenge');s.enemyMax=s.enemyHP=100;s.attack=1;s.enemyAttack=2;
const expected=M.typedDamage(1,M.matchupMultiplier(s.active.id,s.enemy))+2,next=M.act(s,'attack');
assert.equal(next.skill.lastDamage,expected);assert.ok(next.skill.usedCodes.includes('opening'));
assert.equal(next.skill.attackHPRatio,1);assert.ok(next.hpRatio<next.skill.attackHPRatio);
const again=M.act(next,'attack');assert.equal(again.skill.lastDamage,M.typedDamage(next.attack,M.matchupMultiplier(next.active.id,next.enemy)));
let old=ready('otter');old.active.skills=['healing'];old.pets[0].skills=['healing'];old.runRoster[old.active.uid]=copy(old.active);
const upgraded=M.restore(JSON.stringify(old));assert.equal(upgraded.active.skills[0],'armor');assert.equal(upgraded.pets[0].skills[0],'armor');
old=ready();delete old.stageVersion;old.mapId=8;old.clearedMaps=[0,1,2,3,4,5,6,7];old.step=80;old.hpBonus=400;
old.eggs=[{id:'old80',rarity:'SSR',affinity:M.MAPS[8].pets[0],stage:80,mapId:8}];
let restored=M.restore(JSON.stringify(old));assert.ok(restored);assert.equal(restored.step,10);assert.equal(restored.phase,'encounter');assert.equal(restored.eggs[0].stage,80);assert.equal(restored.hpBonus,400);assert.ok(M.restore(JSON.stringify(restored)));
old.phase='nest';old.eggHunt={limit:3,candidates:[old.eggs[0]],selected:0};old.eggs=[];
restored=M.restore(JSON.stringify(old));assert.ok(restored);assert.equal(restored.eggHunt.candidates[0].stage,10);assert.ok(M.restore(JSON.stringify(restored)));
s=M.enterExpedition(M.syncStamina(ready(),10000),0,10000);
assert.equal(M.staminaRemaining(s,40000),90000);assert.equal(M.staminaFullRemaining(s,40000),570000);assert.ok(Number.isNaN(M.staminaRemaining(s,NaN)));
for(const test of [false,true]){
 const m=model(test);assert.equal(m.EXPEDITION_COST,test?1:5);assert.equal(m.HATCH_DURATION,test?3000:1800000);assert.equal(m.BREED_DURATION,test?3000:1800000);
 let b=m.chooseStarter(m.chooseHero(m.newJourney(20),'ranger'),'fox');b=m.enterExpedition(m.syncStamina(b,10000),0,10000);assert.equal(b.stamina.value,test?29:25);
 b.eggs=[{id:'a',rarity:'normal',affinity:'bud',stage:5,mapId:0}];b=m.startIncubation(b,'a',0,10000);assert.equal(b.incubators[0].readyAt,10000+m.HATCH_DURATION);
 assert.equal(m.hatchDuration({...b,journey:{...b.journey,hero:'keeper'}}),m.HATCH_DURATION*.8);
}
console.log('PASS distinct starters, first-hit skill, 9 x 10 floors, unlocks, legacy eggs/run/starter migration, next stamina tick, production/test balance');
