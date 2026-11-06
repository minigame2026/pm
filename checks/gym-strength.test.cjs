const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length,power=id=>M.PETS[id].hp*mean(M.PETS[id].enemyFaces),base=M.fresh(19);base.clearedMaps=Array.from({length:12},(_,i)=>i);
for(const g of M.GYMS){
 const s=M.enterGym(base,g.id);assert.equal(s.gymDifficultyVersion,5);
 const all=M.gymEnemyPool(g.id),elite=M.gymEnemyPool(g.id,5),boss=M.gymEnemyPool(g.id,10);assert.equal(all.length,10);assert.equal(elite.length,4);assert.equal(boss.length,2);
 for(const type of g.types){const ranked=all.filter(id=>M.PETS[id].type===type).sort((a,b)=>power(b)-power(a));assert(boss.includes(ranked[0]));assert(elite.includes(ranked[0])&&elite.includes(ranked[1]));}
 const sample=(id,step,rarity)=>({...s,enemy:id,step,enemyRarity:rarity});
 for(const step of [1,4,6,9])for(const rarity of ['normal','SR','SSR']){
  const strengths=all.map(id=>mean(M.enemyAttackFaces(sample(id,step,rarity))));assert(Math.max(...strengths)/Math.min(...strengths)<=1.1,'same layer must not inherit species level');
 }
 for(let step=1;step<=10;step++){
  const pool=M.encounterPool(step,g.id),reference=mean(pool.map(enemy=>mean(M.enemyAttackFaces({...s,gymRun:undefined,gymDifficultyVersion:undefined,adventureDifficultyVersion:1,enemy,step,enemyRarity:M.encounterRarity(step,g.id)}))));
  const previous=[.8,1,1.2].map(v=>Math.max(1,Math.round(reference*M.GYM_ATTACK_PRESSURE[g.id]*v)));
  const smooth=[.8,1,1.2].map(v=>Math.max(1,Math.round(reference*M.GYM_SMOOTH_PRESSURE[g.id]*v)));
  assert.deepEqual(Array.from(M.enemyAttackFaces({...s,step})),smooth.map(v=>Math.round(v*1.1)),'smoothed pressure, with HP uplift retained');
  assert.deepEqual(Array.from(M.enemyAttackFaces({...s,step,gymDifficultyVersion:4})),previous.map(v=>Math.round(v*1.1)),'v4 dice unchanged');
  assert.deepEqual(Array.from(M.enemyAttackFaces({...s,step,gymDifficultyVersion:3})),previous,'v3 dice unchanged');
 }
 // Old difficulty-v1 encounter remains numerically identical after load.
 const old={...s,gymDifficultyVersion:1,enemy:all.at(-1)},faces=M.enemyAttackFaces(old);const reload=M.restore(JSON.stringify(old));assert(reload);assert.deepEqual(Array.from(M.enemyAttackFaces(reload)),Array.from(faces));
 const v2={...s,gymDifficultyVersion:2,enemyMax:321,enemyHP:123};const restored=M.restore(JSON.stringify(v2));assert(restored);assert.equal(restored.enemyMax,321);assert.equal(restored.enemyHP,123);assert.deepEqual(Array.from(M.enemyAttackFaces(restored)),Array.from(M.enemyAttackFaces(v2)));
 const v3={...s,gymDifficultyVersion:3,enemyMax:99,enemyHP:37};const restored3=M.restore(JSON.stringify(v3));assert(restored3);assert.equal(restored3.enemyMax,99);assert.equal(restored3.enemyHP,37);assert.deepEqual(Array.from(M.enemyAttackFaces(restored3)),Array.from(M.enemyAttackFaces(v3)));
 const v4={...s,gymDifficultyVersion:4,enemyMax:55,enemyHP:27};const restored4=M.restore(JSON.stringify(v4));assert(restored4);assert.equal(restored4.enemyMax,55);assert.equal(restored4.enemyHP,27);assert.deepEqual(Array.from(M.enemyAttackFaces(restored4)),Array.from(M.enemyAttackFaces(v4)));
}
console.log('PASS nine gyms: smoothed attack, bounded species strength, role pools, v1-v4 encounters preserved');
