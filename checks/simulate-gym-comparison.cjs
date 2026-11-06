// Reuse the existing production-model simulator, retaining its visible-dice policy.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tools/simulate-balance.cjs'),'utf8').split("const mode=process.argv[2]||'first'")[0];
harness=harness.replace('function team(s,map){','function team(s,map,enemyIds){').replace('const ids=M.MAPS[map].pets,chosen=[];','const ids=enemyIds||M.MAPS[map].pets,chosen=[];');
harness=harness.replace('function run(s,map,careful=true){','function run(s,map,careful=true,gym=false,fixedTeam=false){')
 .replace('s=M.retreatExpedition(s,now);s=team(s,map);','s=M.retreatExpedition(s,now);if(!fixedTeam)s=team(s,map);')
 .replace('s=M.enterExpedition(s,map,now);','s=gym?M.enterGym(s,map):M.enterExpedition(s,map,now);')
 .replace('stats.battles.push({floor:s.step,turns:floorTurns,won:stats.won});','stats.battles.push({floor:s.step,turns:floorTurns,won:stats.won});stats.deaths=M.homeParty(s).filter(Boolean).filter(uid=>M.petCombat(s,uid).hp<=0).length;');
const ctx={require:require('module').createRequire(path.join(root,'tools/simulate-balance.cjs')),__dirname:path.join(root,'tools'),console,Math,Date,JSON,Set,Map};
vm.runInNewContext(harness+'\nglobalThis.api={M,birth,run,team,hatchAll,breedOne,copy,mean,q,setNow:v=>now=v,getNow:()=>now};',ctx);
const A=ctx.api,M=A.M,samples=+(process.argv[2]||3),repeats=+(process.argv[3]||10);
const startIndex=+(process.argv[4]||0),suffix=process.argv[5]?'-'+process.argv[5]:'';
assert(Number.isInteger(startIndex)&&startIndex>=0&&/^[a-z0-9-]*$/.test(suffix));
const reportPath=path.join(root,'checks/gym-comparison-report'+suffix+'.json'),checkpointPath=path.join(root,'checks/gym-comparison-checkpoints'+suffix+'.json');
const report={sourceSHA:require('crypto').createHash('sha256').update(fs.readFileSync('assets/scripts/PMModel.ts')).digest('hex'),samples,repeats,startIndex,method:'Fresh progression, no granted pets/stats/unlocks. Checkpoint after first map clear and ordinary hatch/breed. Same three pets and visible-dice policy, independent repeat branches, no badge carryover. Production rules unmodified.',careers:[],pairs:[]};
const checkpoints=[];
for(const breeding of [false,true])for(const starter of M.STARTERS)for(let i=startIndex;i<startIndex+samples;i++){
 A.setNow(1792713600000+i*719233+M.STARTERS.indexOf(starter)*9511);
 let s=A.birth((Math.imul(i+1,2654435761)^91357)>>>0,starter,'ranger'),counts={hatches:0,breeds:0},target=0,fail=0,attempt=0;
 for(;attempt<120&&target<9;attempt++){
  const farm=fail>=2&&target>0,map=farm?target-1:target,result=A.run(s,map,true);s=result.s;
  const newlyCleared=!farm&&result.stats.won;
  if(!farm){if(result.stats.won){target++;fail=0;}else fail++;}else fail=0;
  s=M.retreatExpedition(s,A.getNow());s=A.hatchAll(s,counts);if(breeding)s=A.breedOne(s,counts);
  if(newlyCleared){
   const checkpoint=A.team(A.copy(s),map),savedTime=A.getNow();
   checkpoints.push({state:A.copy(checkpoint),savedTime,map,starter,breeding,career:i});
   for(let n=0;n<repeats;n++){
    const trialTime=savedTime+(n+1)*719233,seed=trialTime>>>0;
    const start=A.copy(checkpoint);start.seed=seed;
    A.setNow(trialTime);const adventure=A.run(A.copy(start),map,true,false,true).stats;
    A.setNow(trialTime);const gym=A.run(A.copy(start),map,true,true,true).stats;
    A.setNow(trialTime);const gymPrepared=A.run(A.team(A.copy(start),map,M.gymEnemyPool(map)),map,true,true,true).stats;
    report.pairs.push({starter,breeding,career:i,repeat:n,map,team:M.homeParty(checkpoint).filter(Boolean).map(uid=>{const p=M.petEntry(checkpoint,uid);return {id:p.id,rarity:p.rarity,hp:M.petBaseHP(p),faces:M.petAttackFaces(p,true),skills:M.petSkills(p)};}),adventure,gym,gymPrepared});
   }
   A.setNow(savedTime);
  }
 }
 report.careers.push({starter,breeding,index:i,cleared:target,attempts:attempt,...counts});
 console.log(JSON.stringify(report.careers.at(-1)));
 fs.writeFileSync(reportPath,JSON.stringify(report));
 fs.writeFileSync(checkpointPath,JSON.stringify(checkpoints));
}
report.summary=Array.from({length:9},(_,map)=>{
 const rows=report.pairs.filter(p=>p.map===map),metric=kind=>{const a=rows.map(r=>r[kind]),wins=a.filter(r=>r.won);return {wins:wins.length,n:a.length,winRate:+(100*wins.length/a.length).toFixed(1),meanDeaths:+A.mean(a.map(r=>r.deaths)).toFixed(2),meanTurns:+A.mean(a.map(r=>r.turns)).toFixed(1),winMedianTurns:A.q(wins.map(r=>r.turns),.5),deathFloors:Array.from({length:10},(_,i)=>a.filter(r=>r.deathFloor===i+1).length)};};
 return {map:map+1,name:M.GYMS[map].name,adventure:metric('adventure'),gym:metric('gym'),gymPrepared:metric('gymPrepared')};
});
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(JSON.stringify(report.summary,null,2));
