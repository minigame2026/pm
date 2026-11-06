// Exercise actual inheritance through saved breeding, egg and hatch, not only probability buckets.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const copy=x=>JSON.parse(JSON.stringify(x)),reload=s=>{const r=M.restore(JSON.stringify(s));assert(r);return r;},codes=['opening','charged','heavy','focus','armor'];
const totals={};
for(const [a,b] of [[2,2],[1,3],[3,1],[2,1],[4,1]]){
 const counts={};
 for(let i=1;i<=2000;i++){
  let s=M.fresh(Math.imul(i,2654435761)>>>0,['fox','turtle','bud']);
  const mother=s.pets[0],father=s.pets[1];mother.sex='female';father.sex='male';mother.skills=codes.slice(0,a);father.skills=codes.slice(a,a+b);
  s.active=copy(mother);s.reserve=copy(father);s=M.assignPartySlot(s,s.pets[2].uid,0);
  s=M.startBreeding(s,mother.uid,father.uid,10000);assert(s.breeding);
  const n=s.breeding.genes.skills.length;counts[n]=(counts[n]||0)+1;
  const skills=JSON.stringify(s.breeding.genes.skills);s=reload(s);s=M.claimBreeding(s,s.breeding.readyAt);s=reload(s);
  const egg=s.eggs.at(-1);assert.equal(JSON.stringify(egg.genes.skills),skills);
  s=M.startIncubation(s,egg.id,0,4000000);s=reload(s);s=M.claimHatch(s,0,s.incubators[0].readyAt);s=reload(s);
  assert.equal(JSON.stringify(M.petEntry(s,s.pendingHatch.uid).skills),skills);
 }
 totals[a+'+'+b]=counts;
 const wanted=a+b===3?{2:.5,3:.5}:a+b===4?{2:.25,3:.5,4:.25}:{3:.25,4:.5,5:.25};
 for(const [n,p] of Object.entries(wanted))assert(Math.abs(counts[n]/2000-p)<.04,JSON.stringify({a,b,counts}));
}
assert.deepEqual(totals['2+2'],totals['1+3']);assert.deepEqual(totals['2+2'],totals['3+1']);
console.log('PASS inheritance split is irrelevant; 10000 breeding/egg/hatch/save flows:',JSON.stringify(totals));
