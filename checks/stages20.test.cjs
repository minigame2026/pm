const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js'),m={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});
const M=m.exports;assert.equal(M.TOTAL_STAGES,20);
let lastNormalHP=29,lastNormalAttack=0;
for(let step=11;step<=20;step++){
 let fixture=M.fresh(step);fixture.step=step;delete fixture.contentVersion;let s=M.restore(JSON.stringify(fixture));assert.ok(s);const rank=step===20?'boss':step===15?'elite':'normal';assert.equal(M.PETS[s.enemy].rank,rank);assert.ok(s.enemyHP>0);assert.deepEqual(JSON.parse(JSON.stringify(M.restore(JSON.stringify(s)))),JSON.parse(JSON.stringify(s)));
 if(rank==='normal'){assert.ok(s.enemyMax>lastNormalHP);lastNormalHP=s.enemyMax;const ref={...s,enemy:'fox'},attack=M.enemyAttackFaces(ref)[0];assert.ok(attack>=lastNormalAttack);lastNormalAttack=attack;}
 if(rank==='elite')assert.equal(s.enemyMax,72);if(rank==='boss'){assert.equal(s.enemyMax,96);assert.equal(M.act(s,'reroll'),s);}
 s=M.act(s,'challenge');s.enemyHP=1;s.attack=999;s=M.act(s,'attack');if(rank==='boss')assert.equal(s.phase,'nest');else s=M.act(s,'take');
 if(rank!=='normal'){assert.equal(s.phase,'nest');assert.equal(s.eggHunt.limit,rank==='boss'?3:2);s=M.act(M.act(M.act(s,'eggSearch'),'eggTake'),'eggContinue');}
 if(step===20){assert.equal(s.phase,'won');assert.equal(s.wins,1);}else{if(s.phase==='recruit')s=M.act(s,'skip');assert.equal(s.phase,'encounter');assert.equal(s.step,step+1);}
}
let s=M.act(M.fresh(9),'challenge');s.step=10;s.enemy='dragon';s.enemyHP=1;s.attack=999;s=M.act(s,'attack');assert.equal(s.wins,0);s=M.act(M.act(M.act(s,'eggSearch'),'eggTake'),'eggContinue');assert.equal(s.phase,'encounter');assert.equal(s.step,11);
let old=M.fresh(88);old.phase='won';old.step=10;old.wins=7;old.owned.push('dragon');old.eggs=[{id:'old-egg',rarity:'SSR',affinity:'dragon',stage:10}];const next=M.continueAdventure(M.restore(JSON.stringify(old)));assert.equal(next.step,11);assert.equal(next.wins,7);assert.ok(next.owned.includes('dragon'));assert.equal(next.eggs[0].id,'old-egg');assert.equal(M.continueAdventure(next),next);
console.log('PASS stages 11-20 scaling, encounter ranks, nests, final victory, legacy continuation');
