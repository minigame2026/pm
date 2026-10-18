const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON});
const {fresh,act,restore,restartRun}=m.exports;
function victory(step,seed=72){let s=act(fresh(seed),'challenge');s.step=step;s.enemy=step===10?'dragon':step===5?'ape':'cotton';s.enemyHP=1;s.attack=999;return act(s,'attack');}
function hunt(step,seed){let s=victory(step,seed);return step===5?act(s,'take'):s;}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name)}
test('Elite and boss enter bounded egg hunts; normals retain existing reward',()=>{
 assert.equal(victory(2).phase,'reward');
 for(const step of [5,10]){let s=hunt(step);assert.equal(s.phase,'nest');assert.equal(s.eggHunt.limit,step===5?2:3);assert.equal(act(s,'eggTake'),s);
 for(let i=0;i<s.eggHunt.limit;i++){s=act(s,'eggSearch');assert.equal(s.eggHunt.candidates.length,i+1);if(i<s.eggHunt.limit-1)assert.equal(s.eggHunt.selected,i);}
 assert.equal(act(s,'eggSearch'),s);assert.equal(act(s,'attack'),s);
 }
});
test('Candidates and choice survive reload; claiming once preserves exactly chosen egg',()=>{
 for(const step of [5,10]){let s=act(act(hunt(step),'eggSearch'),'eggSearch');s=act(s,'eggSelect0');const saved=JSON.stringify(s),r=restore(saved);assert.equal(JSON.stringify(r),saved);
 const egg=s.eggHunt.candidates[0];s=act(r,'eggTake');assert.equal(s.phase,'eggClaimed');assert.equal(s.eggs.length,1);assert.equal(s.eggs[0].id,egg.id);assert.equal(act(s,'eggTake'),s);
 s=restore(JSON.stringify(s));assert.ok(s);s=act(s,'eggContinue');assert.equal(s.phase,step===10?'encounter':'recruit');assert.equal(s.eggs.length,1);assert.equal(act(s,'eggContinue'),s);assert.equal(restartRun(s,56).eggs[0].id,egg.id);
 }
});
test('Early take, already-owned elite, and no extra wins from egg actions',()=>{
 let s=hunt(5);s.owned.push('ape');s=act(act(s,'eggSearch'),'eggTake');s=act(s,'eggContinue');assert.equal(s.step,6);assert.equal(s.phase,'encounter');
 s=hunt(10);const wins=s.wins;s=act(act(act(s,'eggSearch'),'eggTake'),'eggContinue');assert.equal(s.wins,wins);assert.equal(s.phase,'encounter');assert.equal(s.step,11);
});
test('Probabilities roughly 80/17/3 and all 18 attributes obtainable',()=>{
 const counts={normal:0,SR:0,SSR:0},types=new Set();for(let i=1;i<=10000;i++){const s=act(hunt(10,Math.imul(i,2654435761)),'eggSearch'),e=s.eggHunt.candidates[0];counts[e.rarity]++;types.add(e.affinity);}
 assert.equal(types.size,18);for(const [r,p] of [['normal',.8],['SR',.17],['SSR',.03]])assert.ok(Math.abs(counts[r]/10000-p)<.015);console.log(counts);
});
test('Legacy saves get empty eggs without altering battle; malformed hunts rejected',()=>{
 let s=act(fresh(99),'challenge');delete s.eggs;delete s.eggHunt;const r=restore(JSON.stringify(s));assert.ok(r);assert.equal(r.attack,s.attack);assert.equal(r.phase,s.phase);assert.equal(r.eggs.length,0);
 s=hunt(5);s.eggHunt.selected=9;assert.equal(restore(JSON.stringify(s)),null);
 s=act(hunt(5),'eggSearch');s.eggHunt.candidates[0].rarity='INVALID';assert.equal(restore(JSON.stringify(s)),null);
});
test('Last search selects highest rarity, first tied egg, while manual choice remains available',()=>{
 for(const rarities of [['SSR','SR'],['SR','SSR'],['SSR','SSR'],['normal','normal']]){
  let s=hunt(10);s.seed=0;s.eggHunt.candidates=rarities.map((rarity,i)=>({id:'candidate'+i,rarity,affinity:'fox',stage:10}));s.eggHunt.selected=1;
  s=act(s,'eggSearch');const rank={normal:0,SR:1,SSR:2},best=Math.max(...s.eggHunt.candidates.map(e=>rank[e.rarity])),first=s.eggHunt.candidates.findIndex(e=>rank[e.rarity]===best);assert.equal(s.eggHunt.selected,first);assert.equal(restore(JSON.stringify(s)).eggHunt.selected,first);
  s=act(s,'eggSelect2');assert.equal(s.eggHunt.selected,2);assert.equal(act(s,'eggTake').eggs[0].id,s.eggHunt.candidates[2].id);
 }
});
console.log(count+' egg hunt tests passed');
