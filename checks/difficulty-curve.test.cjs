const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set});
const flat=x=>JSON.parse(JSON.stringify(x));
assert.equal(M.ADVENTURE_DIFFICULTY.length,M.MAPS.length);
for(let map=0;map<12;map++)for(let step=1;step<=10;step++){
 const hp=M.enemyHealthForStage(step,map);assert(hp>0);if(map)assert(hp>=M.enemyHealthForStage(step,map-1));
 assert.equal(hp,Math.round(M.legacyEnemyHealthForStage(step,map)*M.ADVENTURE_DIFFICULTY[map].hp));
}
let s=M.chooseStarter(M.chooseHero(M.newJourney(97),'ranger'),'fox');assert.equal(s.pets.length,1);assert.equal(s.adventureDifficultyVersion,1);
const old=flat(M.act(s,'challenge'));delete old.adventureDifficultyVersion;old.enemyMax=old.enemyHP=17;old.enemyAttack=9;
const loaded=M.restore(JSON.stringify(old));assert(loaded);assert.equal(loaded.enemyHP,17);assert.equal(loaded.enemyAttack,9);assert.deepEqual(flat(M.enemyAttackFaces(loaded)),flat(M.enemyAttackFaces(old)));
const continued=M.act(loaded,'guard');assert.equal(continued.adventureDifficultyVersion,undefined,'old current encounter retains its curve');
old.enemyHP=1;let next=M.act(old,'attack');next=M.act(next,'take');if(next.phase==='event')next=M.act(next,'eventContinue');assert.equal(next.adventureDifficultyVersion,1,'next new encounter uses new curve');
for(let i=0;i<9;i++){
 s.clearedMaps=Array.from({length:12},(_,j)=>j);const g=M.enterGym(s,i);assert.equal(g.adventureDifficultyVersion,undefined);assert.equal(g.enemyMax,Math.round(M.legacyEnemyHealthForStage(1,i)*1.5));
 const raw=flat(g);delete raw.gymRun;delete raw.gymDifficultyVersion;assert.deepEqual(flat(M.enemyAttackFaces(g)),flat(M.enemyAttackFaces(raw).map(v=>Math.round(v*1.5))));
}
assert.equal(M.EXPEDITION_COST,5);assert.equal(M.BREED_DURATION,1800000);assert.deepEqual(flat(M.HATCH_DURATIONS),{normal:600000,SR:1200000,SSR:1800000});
console.log('PASS adventure curve 120 floors, fresh one-pet entry, old encounter persistence, nine unchanged gym curves and production costs');
