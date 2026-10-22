const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const expected=[[[95,5,0],[90,9,1]],[[90,10,0],[75,20,5]],[[84,15,1],[70,20,10]],[[80,18,2],[60,25,15]],[[75,22,3],[50,30,20]],[[70,26,4],[40,35,25]],[[65,29,6],[35,35,30]],[[60,32,8],[30,35,35]],[[55,35,10],[25,35,40]],[[50,38,12],[20,35,45]],[[45,41,14],[15,35,50]],[[40,44,16],[10,35,55]]],mod=4294967296n,inverse=4276115653n;
assert.equal(M.MAPS.length,12);
assert.equal(1664525n*inverse%mod,1n);
let tested=0;
for(const map of M.MAPS)for(let step=5;step<=map.stages;step+=5){
 const rates=M.eggRates({mapId:map.id,step}),values=expected[map.id][step%10===0?1:0];assert.deepEqual([rates.normal,rates.SR,rates.SSR],values);assert.equal(values.reduce((a,b)=>a+b),100);
 // Exercise the actual eggSearch action on both sides of each cumulative probability boundary.
 const boundaries=[Math.ceil(values[0]/100*Number(mod)),Math.ceil((values[0]+values[1])/100*Number(mod))];
 for(const raw of new Set([0,Number(mod)-1,...boundaries.flatMap(n=>[n-1,n])].filter(n=>n>=0&&n<Number(mod)))){
  let s=M.fresh(17);s.clearedMaps=Array.from({length:map.id},(_,i)=>i);s=M.startMap(s,map.id,17);s.step=step;s.phase='nest';s.eggHunt={limit:step%10===0?3:2,candidates:[],selected:-1};s.seed=Number(((BigInt(raw)-1013904223n)*inverse%mod+mod)%mod);
  const roll=raw/Number(mod)*100,rarity=roll<values[0]?'normal':roll<values[0]+values[1]?'SR':'SSR';
  s=M.act(s,'eggSearch');assert.equal(s.eggHunt.candidates[0].rarity,rarity);assert.ok(M.restore(JSON.stringify(s)));tested++;
 }
}
console.log(`PASS all 24 elite/BOSS checkpoints, unchanged first 18 distributions and ${tested} real egg-search boundary/save cases`);
