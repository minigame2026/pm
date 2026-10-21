const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const modules={},cache={};
vm.runInNewContext(fs.readFileSync('checks/apk-v6-main.js','utf8'),{System:{register:(name,deps,fn)=>modules[name]={deps,fn}},Math,Date,JSON,Set});
function load(name){
 if(name==='cc')return {cclegacy:{_RF:{push(){},pop(){}}}};
 name=name.startsWith('./')?'chunks:///_virtual/'+name.slice(2):name;
 if(cache[name])return cache[name];
 const out=cache[name]={},m=modules[name],body=m.fn((k,v)=>{if(typeof k==='string')out[k]=v;else Object.assign(out,k);return v;},{meta:{}});
 body.setters.forEach((s,i)=>s&&s(load(m.deps[i])));body.execute();return out;
}
const M=load('chunks:///_virtual/PMModel.ts'),codes=Object.keys(M.SKILLS),copy=x=>JSON.parse(JSON.stringify(x));
const saved=s=>{const r=M.restore(JSON.stringify(s));assert(r,'valid persisted state');return r;};
let different=0,same=0;
for(let seed=1;seed<=10;seed++)for(let i=0;i<codes.length;i++)for(let j=i;j<codes.length;j++){
 let s=M.fresh(seed,['fox','turtle','bud']);s.pets[0].sex='female';s.pets[1].sex='male';
 s.pets[0].skills=[codes[i]];s.pets[1].skills=[codes[j]];s.active=copy(s.pets[0]);s.reserve=copy(s.pets[1]);s.runRoster={};
 s=M.assignPartySlot(s,s.pets[2].uid,0);s=saved(s);
 const expected=[...new Set([codes[i],codes[j]])].sort(),check=skills=>assert.deepEqual([...skills].sort(),expected);
 s=M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,1000);check(s.breeding.genes.skills);s=saved(s);
 s=M.claimBreeding(s,1000+M.BREED_DURATION);s=saved(s);const egg=s.eggs.at(-1);check(egg.genes.skills);
 s=M.startIncubation(s,egg.id,0,2000+M.BREED_DURATION);s=saved(s);
 s=M.claimHatch(s,0,2000+M.BREED_DURATION+M.HATCH_DURATION);s=saved(s);
 check(M.petSkills(M.petEntry(s,s.pendingHatch.uid)));s=M.acknowledgeHatch(s);s=saved(M.restartRun(s,seed));check(s.pets.at(-1).skills);
 if(i===j)same++;else different++;
}
console.log(JSON.stringify({apkTestMode:M.BUILD_TEST_MODE,distinctSkillPairs:different,duplicateSkillPairs:same,lostSkills:0,stages:'breeding, egg, incubation, hatch reveal, save/reload, restart'},null,2));
