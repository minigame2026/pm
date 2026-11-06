// Paired, read-only event-pool experiment. Uses production battle/raising APIs.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),reportDir=path.join(root,'checks/event-expansion');fs.mkdirSync(reportDir,{recursive:true});
const source=fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x)),mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const baseTime=1792713600000,repeats=+(process.argv[2]||25);assert(Number.isInteger(repeats)&&repeats>=1&&repeats<=500);
let harness=fs.readFileSync(path.join(root,'tools/simulate-balance.cjs'),'utf8').split('const mode=process.argv')[0];
const sourceLine="const source=fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8');";
assert(harness.includes(sourceLine));
const measuredSource=source.replace('for(const code of codes){const v=SKILL_SPECS[code],n=v.amount;',`for(const code of codes){const v=SKILL_SPECS[code],n=v.amount;const measure={hp:s.hpRatio,shield:k.shield,potions:s.potions,boosts:s.boosts};`)
 .replace('  trigger(s,code);','  trigger(s,code);if(code.startsWith("tm_"))__recordTemp({code,effect:v.effect,amount:n,hp:Math.max(0,(s.hpRatio-measure.hp)*maxHP(s)),shield:Math.max(0,k.shield-measure.shield),potions:s.potions-measure.potions,boosts:s.boosts-measure.boosts});');
assert.notEqual(measuredSource,source);
harness=harness.replace(sourceLine,'const source=MODEL_SOURCE;').replace('{exports:M,Math,Date,JSON,Set,Map}','{exports:M,Math,Date,JSON,Set,Map,__recordTemp}');
harness=harness.replace('return {s,stats};',`stats.remainingHPRatio=mean(M.homeParty(s).filter(Boolean).map(uid=>M.petCombat(s,uid).ratio));stats.remainingHP=M.homeParty(s).filter(Boolean).map(uid=>M.petCombat(s,uid).hp).reduce((a,b)=>a+b,0);stats.alive=M.homeParty(s).filter(Boolean).filter(uid=>M.petCombat(s,uid).hp>0).length;return {s,stats};`);
function engine(old){
 let tally=null;
 const ctx={require:require('module').createRequire(path.join(root,'tools/simulate-balance.cjs')),__dirname:path.join(root,'tools'),console,Math,Date,JSON,Set,Map,MODEL_SOURCE:measuredSource,
  __recordTemp:v=>{if(!tally)return;tally.skillUses[v.code]=(tally.skillUses[v.code]||0)+1;tally.skillEffects[v.effect]=(tally.skillEffects[v.effect]||0)+1;for(const k of ['hp','shield','potions','boosts'])tally.skillBenefits[k]+=v[k];if(v.effect==='damage')tally.skillBenefits.flatDamageBudget+=v.amount;if(v.effect==='reduce')tally.skillBenefits.damageReductionBudget+=v.amount;}};
 vm.runInNewContext(harness+'\nglobalThis.api={M,birth,run,team,hatchAll,breedOne,power,now:v=>v===undefined?now:(now=v)};',ctx);
 const api=ctx.api,M=api.M;
 if(old===true||old==='legacySkills')M.TEMP_SKILLS.splice(8);
 if(old===true||old==='legacyEvents')M.BATTLE_EVENT_KINDS.splice(5);
 const original=M.act;M.act=(s,action)=>{const next=original(s,action);if(tally&&s.phase!=='event'&&next.phase==='event'){const e=next.battleEvent;tally.events[e.kind]=(tally.events[e.kind]||0)+1;if(e.skill)tally.learned[e.skill]=(tally.learned[e.skill]||0)+1;}return next;};
 api.trial=(checkpoint,map,seed,time)=>{
  api.now(time);const state=copy(checkpoint);state.seed=seed;
  tally={events:{},learned:{},skillUses:{},skillEffects:{},skillBenefits:{hp:0,shield:0,potions:0,boosts:0,flatDamageBudget:0,damageReductionBudget:0}};
  const result=api.run(state,map,true);result.stats.telemetry=tally;tally=null;return result.stats;
 };return api;
}
const old=engine(true),current=engine(false),M=current.M;
if(process.argv.includes('--ablate12')){
 const reportPath=path.join(reportDir,'report.json'),r=JSON.parse(fs.readFileSync(reportPath,'utf8')),cached=JSON.parse(fs.readFileSync(path.join(reportDir,'checkpoints.json'),'utf8'));assert.equal(r.sourceSHA,sha(source));
 const t=r.targeted.find(x=>x.map===12&&x.cohort==='formed');assert(t.final500);
 const pool=cached.starts[11].formed,eventsOnly=engine('legacySkills'),skillsOnly=engine('legacyEvents'),rows=[];
 // Independent later seeds, excluding the initial25 that caused adaptive selection.
 for(let trial=150;trial<300;trial++){
  const baseline=t.followupPairs.find(x=>x.trial===trial);assert(baseline);const checkpoint=pool[trial%pool.length],time=checkpoint.time+(trial+1)*719233;
  rows.push({trial,seed:baseline.seed,old:baseline.old,current:baseline.current,eventsOnly:eventsOnly.trial(checkpoint.state,11,baseline.seed,time),skillsOnly:skillsOnly.trial(checkpoint.state,11,baseline.seed,time)});
 }
 r.ablation12={method:'150 matched later seeds (trials150–299), no first25 selection seeds; current rules, only one expanded pool at a time',fullExpansion:aggregate(rows),eventsOnly:aggregate(rows.map(x=>({old:x.old,current:x.eventsOnly}))),skillsOnly:aggregate(rows.map(x=>({old:x.old,current:x.skillsOnly}))),rows};
 r.totalAblationRuns=300;assert.equal(sha(fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8')),r.sourceSHA);fs.writeFileSync(reportPath,JSON.stringify(r,null,2));
 console.log(JSON.stringify({ablation12:Object.fromEntries(['fullExpansion','eventsOnly','skillsOnly'].map(k=>[k,{old:r.ablation12[k].old.winRate,current:r.ablation12[k].current.winRate,difference:r.ablation12[k].difference}]))}));process.exit(0);
}
if(process.argv.includes('--followup12')){
 const reportPath=path.join(reportDir,'report.json'),r=JSON.parse(fs.readFileSync(reportPath,'utf8')),cached=JSON.parse(fs.readFileSync(path.join(reportDir,'checkpoints.json'),'utf8'));
 assert.equal(r.sourceSHA,sha(source),'source changed since screening');const t=r.targeted.find(x=>x.map===12&&x.cohort==='formed');assert(t&&t.combined.old.n===150);
 const pool=cached.starts[11].formed,extra=[];
 for(let trial=150;trial<500;trial++){
  const checkpoint=pool[trial%pool.length],batch=trial%5,seed=(Math.imul(trial+10001+11*301,2654435761)^Math.imul(batch+1,374761393)^0x83ab)>>>0,time=checkpoint.time+(trial+1)*719233;
  extra.push({map:12,cohort:'formed',trial,batch,seed,checkpoint:{origin:checkpoint.origin,starter:checkpoint.starter,breeding:checkpoint.breeding,career:checkpoint.career},old:old.trial(checkpoint.state,11,seed,time),current:current.trial(checkpoint.state,11,seed,time)});
  if((trial+1)%100===0)console.log(JSON.stringify({followup12:trial+1}));
 }
 const initial=r.pairs.filter(x=>x.map===12&&x.cohort==='formed');t.followup350=aggregate(extra);t.followupPairs=extra;t.final500=aggregate([...initial,...t.pairs,...extra]);
 r.totalRunsPerVersion=r.wholeRunsPerVersion+r.targeted.reduce((n,g)=>n+g.pairs.length+(g.followupPairs?.length||0),0);
 assert.equal(sha(fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8')),r.sourceSHA);fs.writeFileSync(reportPath,JSON.stringify(r,null,2));
 console.log(JSON.stringify({totalRunsPerVersion:r.totalRunsPerVersion,followup350:t.followup350.difference,final500:t.final500.difference,old:t.final500.old.winRate,current:t.final500.current.winRate}));process.exit(0);
}
const historicalFiles=['gym-comparison-checkpoints.json','gym-comparison-checkpoints-holdout.json'];
let history=historicalFiles.flatMap(file=>JSON.parse(fs.readFileSync(path.join(root,'checks',file),'utf8')).map(x=>({...x,origin:file})));
for(const cp of history)assert(M.restore(JSON.stringify(cp.state)),'historical save must restore');
const starts={};for(let map=0;map<12;map++)starts[map]={weak:[],formed:[]};
const pack=x=>({state:x.state,time:x.savedTime,starter:x.starter,breeding:x.breeding,career:x.career,origin:x.origin});
for(let map=0;map<9;map++){
 starts[map].formed=history.filter(x=>x.map===map).map(pack);
 if(map)starts[map].weak=history.filter(x=>x.map===map-1).map(pack);
 else starts[0].weak=M.STARTERS.map((starter,i)=>{old.now(baseTime+i*719233);return{state:old.birth(91357+i*2971,starter,'ranger'),time:old.now(),starter,breeding:false,career:i,origin:'newJourney/chooseHero/chooseStarter'};});
}
// Extend six existing, valid ninth-map clears through real hatch/breed/battle actions.
// Both experiment versions share these old-pool checkpoint sources.
const lateLog=[];
for(const starter of M.STARTERS)for(const breeding of [false,true]){
 const cp=history.find(x=>x.map===8&&x.starter===starter&&x.breeding===breeding&&x.career===0);assert(cp);
 let s=copy(cp.state),target=9,failed=0;old.now(cp.savedTime);const counts={hatches:0,breeds:0},seen=new Set();
 for(let attempt=0;attempt<90&&target<12;attempt++){
  const meta={starter,breeding,career:0,origin:'production extension of '+cp.origin};
  if(!seen.has(target)){starts[target].weak.push({...meta,state:copy(s),time:old.now()});seen.add(target);}
  const farm=failed>=2,map=farm?target-1:target,r=old.run(s,map,true);s=r.s;
  lateLog.push({starter,breeding,attempt,map:map+1,farm,won:r.stats.won});
  s=old.M.retreatExpedition(s,old.now());s=old.hatchAll(s,counts);if(breeding)s=old.breedOne(s,counts);
  if(!farm&&r.stats.won){starts[target].formed.push({...meta,state:copy(s),time:old.now()});target++;failed=0;}else if(farm)failed=0;else failed++;
 }
 console.log(JSON.stringify({checkpointExtension:starter,breeding,clearedThrough:target,...counts}));
}
for(let map=0;map<12;map++)for(const cohort of ['weak','formed'])assert(starts[map][cohort].length,'missing '+map+' '+cohort);
fs.writeFileSync(path.join(reportDir,'checkpoints.json'),JSON.stringify({sourceSHA:sha(source),historicalFiles,lateLog,starts}));
function mergeCounts(rows,key){const out={};for(const row of rows)for(const[k,n]of Object.entries(row.telemetry[key]))out[k]=(out[k]||0)+n;return out;}
function summary(rows){const wins=rows.filter(x=>x.won),metric=k=>+mean(rows.map(r=>r[k])).toFixed(3);return {n:rows.length,wins:wins.length,winRate:+(wins.length/rows.length*100).toFixed(2),meanHPRatio:metric('remainingHPRatio'),winMeanHPRatio:+mean(wins.map(x=>x.remainingHPRatio)).toFixed(3),meanAlive:metric('alive'),meanTurns:metric('turns'),meanHealingPotions:metric('heals'),meanPowerPotions:metric('boosts'),events:mergeCounts(rows,'events'),learned:mergeCounts(rows,'learned'),skillUses:mergeCounts(rows,'skillUses'),skillEffects:mergeCounts(rows,'skillEffects'),skillBenefits:Object.fromEntries(Object.keys(rows[0].telemetry.skillBenefits).map(k=>[k,+rows.reduce((n,r)=>n+r.telemetry.skillBenefits[k],0).toFixed(2)]))};}
const pairs=[];
for(let map=0;map<12;map++){
 for(const cohort of ['weak','formed'])for(let trial=0;trial<repeats;trial++){
  const pool=starts[map][cohort],checkpoint=pool[trial%pool.length],batch=trial%5;
  const seed=(Math.imul(trial+10001+map*301,2654435761)^Math.imul(batch+1,374761393)^(cohort==='formed'?0x83ab:0x726))>>>0,time=checkpoint.time+(trial+1)*719233;
  const a=old.trial(checkpoint.state,map,seed,time),b=current.trial(checkpoint.state,map,seed,time);
  pairs.push({map:map+1,cohort,trial,batch,seed,checkpoint:{origin:checkpoint.origin,starter:checkpoint.starter,breeding:checkpoint.breeding,career:checkpoint.career},old:a,current:b});
 }
 console.log(JSON.stringify({map:map+1,old:summary(pairs.filter(x=>x.map===map+1).map(x=>x.old)).winRate,current:summary(pairs.filter(x=>x.map===map+1).map(x=>x.current)).winRate}));
}
function difference(rows){const d=rows.map(x=>Number(x.current.won)-Number(x.old.won)),avg=mean(d),se=Math.sqrt(d.reduce((n,v)=>n+(v-avg)**2,0)/Math.max(1,d.length-1)/d.length);return{winRatePoints:+(avg*100).toFixed(2),pairedApprox95CI:[Math.max(-100,(avg-1.96*se)*100),Math.min(100,(avg+1.96*se)*100)].map(x=>+x.toFixed(2)),newOnlyWins:d.filter(x=>x===1).length,oldOnlyWins:d.filter(x=>x===-1).length,meanHPRatio:+mean(rows.map(x=>x.current.remainingHPRatio-x.old.remainingHPRatio)).toFixed(3),meanHealingPotions:+mean(rows.map(x=>x.current.heals-x.old.heals)).toFixed(3),meanPowerPotions:+mean(rows.map(x=>x.current.boosts-x.old.boosts)).toFixed(3)};}
function aggregate(rows){return {old:summary(rows.map(x=>x.old)),current:summary(rows.map(x=>x.current)),difference:difference(rows)};}
// Target uncertainty only where the screening cohort differs by more than10 pp.
// Keep these extra trials separate: pooling them globally would overweight hard maps.
const targeted=[];
for(let map=0;map<12;map++)for(const cohort of ['weak','formed']){
 const screening=pairs.filter(x=>x.map===map+1&&x.cohort===cohort);
 if(Math.abs(difference(screening).winRatePoints)<=10)continue;
 const extra=[];
 for(let trial=repeats;trial<repeats+125;trial++){
  const pool=starts[map][cohort],checkpoint=pool[trial%pool.length],batch=trial%5;
  const seed=(Math.imul(trial+10001+map*301,2654435761)^Math.imul(batch+1,374761393)^(cohort==='formed'?0x83ab:0x726))>>>0,time=checkpoint.time+(trial+1)*719233;
  extra.push({map:map+1,cohort,trial,batch,seed,checkpoint:{origin:checkpoint.origin,starter:checkpoint.starter,breeding:checkpoint.breeding,career:checkpoint.career},old:old.trial(checkpoint.state,map,seed,time),current:current.trial(checkpoint.state,map,seed,time)});
 }
 const combined=[...screening,...extra];targeted.push({map:map+1,cohort,screening:aggregate(screening),additional:aggregate(extra),combined:aggregate(combined),pairs:extra});
 console.log(JSON.stringify({targeted:map+1,cohort,n:combined.length,difference:difference(combined)}));
}
const report={date:new Date().toISOString(),sourceSHA:sha(source),samplesPerCohortMap:repeats,wholeRunsPerVersion:pairs.length,method:{old:'same current source; BATTLE_EVENT_KINDS sliced to first5, TEMP_SKILLS to first8; no other numbers changed',gate:'20%, normal floors only; unmodified in both',policy:'same visible-dice, type-aware, heal/boost/guard and reward policy from simulate-balance.cjs; no lookahead, no ads',cohorts:'weak=previous-map first-clear checkpoint, map1 fresh single starter; formed=current-map first-clear after hatch/breed; historical snapshots from real model simulations, not human saves',lateMaps:'six historical map9 clears extended through production rules using old pools, normal raising; no stats/pets/unlocks granted',pairing:'same checkpoint, time, initial seed and policy in each version; five seed batches; pools consume RNG differently so later encounters can diverge',confidence:'approximate paired 95% interval for simulation win-rate difference; repeated snapshots and strategy bias mean not a human-player confidence claim',benefits:'HP is observed restoration from temporary skill execution; shield is granted, not necessarily absorbed. Damage/reduction budgets are proc configured amounts, not attributed final damage. Poison/nextMax/survive recorded as activation counts.'},historicalFiles,checkpointExtensions:lateLog,summary:aggregate(pairs),maps:Array.from({length:12},(_,i)=>({map:i+1,name:M.MAPS[i].name,...aggregate(pairs.filter(x=>x.map===i+1)),cohorts:Object.fromEntries(['weak','formed'].map(c=>[c,aggregate(pairs.filter(x=>x.map===i+1&&x.cohort===c))]))})),batches:Array.from({length:5},(_,i)=>({batch:i,...aggregate(pairs.filter(x=>x.batch===i))})),pairs};
assert.equal(sha(fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8')),report.sourceSHA,'source changed during simulation; rerun');
report.targeted=targeted;report.totalRunsPerVersion=pairs.length+targeted.reduce((n,g)=>n+g.pairs.length,0);
fs.writeFileSync(path.join(reportDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({runsPerVersion:pairs.length,old:report.summary.old.winRate,current:report.summary.current.winRate,difference:report.summary.difference}));
