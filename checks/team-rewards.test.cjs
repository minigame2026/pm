const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x)),flat=x=>JSON.parse(JSON.stringify(x));
function base(){let s=M.fresh(71,['fox','turtle','bud','otter']);s.expedition=true;s.phase='reward';s.hpRatio=.4;const team=M.homeParty(s);s.runRoster={};
 [ [2,2,5],[3,6,6],[4,4,4] ].forEach((faces,i)=>s.runRoster[team[i]]={...copy(M.petEntry(s,team[i])),faces});
 s.active=copy(s.runRoster[team[0]]);s.reserve=copy(s.runRoster[team[1]]);s.combatVitals={[team[1]]:{hpRatio:.5,hpBonus:2},[team[2]]:{hpRatio:0,hpBonus:1}};return s;}
for(const kind of ['hp','attackMin','attackMax']){
 const s=base(),team=M.homeParty(s),before=team.map(uid=>M.petCombat(s,uid)),pets=flat(s.pets);s.reward={kind,values:[kind==='hp'?3:1],title:kind};
 const n=M.act(s,'take');assert.notEqual(n,s);assert.deepEqual(flat(n.pets),pets,'base genes untouched');
 for(let i=0;i<3;i++){
  const after=M.petCombat(n,team[i]);
  assert.equal(after.bonus,before[i].bonus+(kind==='hp'?3:0),'HP reward reaches each team member');
  const faces=before[i].pet.faces,edge=kind==='attackMin'?Math.min(...faces):Math.max(...faces);
  assert.deepEqual(flat(after.pet.faces),faces.map(v=>kind!=='hp'&&v===edge?v+1:v),'all tied extrema increase');
  if(i>0)assert.equal(after.hp,before[i].hp,'reserve HP preserved; dead stays dead');
 }
 assert(!n.runRoster[n.pets[3].uid],'unassigned collection excluded');
 assert.equal(M.act(n,'take'),n,'no duplicate reward');
 const loaded=M.restore(JSON.stringify(n));assert(loaded,'new reward kind can reload');
 const switched=M.selectActive(loaded,team[1]);assert.deepEqual(flat(switched.active.faces),flat(M.petCombat(n,team[1]).pet.faces));assert.equal(switched.hpBonus,M.petCombat(n,team[1]).bonus);
 const reset=M.restartRun(loaded,99);for(const uid of team){assert.equal(M.petCombat(reset,uid).bonus,0);assert.deepEqual(flat(M.petCombat(reset,uid).pet.faces),flat(M.petEntry(reset,uid).baseFaces));}
 assert(M.restore(JSON.stringify(s)),'unclaimed new reward saves');
}
const seen=new Set();for(let seed=1;seed<1000;seed++){const s=M.fresh(seed);seen.add(s.reward.kind);if(['attackMin','attackMax'].includes(s.reward.kind))assert.deepEqual(flat(s.reward.values),[1]);}
assert(seen.has('attackMin')&&seen.has('attackMax'),'new rewards occur naturally');
console.log('PASS team HP/min/max rewards, ties, independent HP, dead reserves, collection isolation, switch/reload, no repeat, run reset, random drops');
