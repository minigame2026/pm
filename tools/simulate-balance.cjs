// Read-only balance simulation using production model. No browser/user save or product values are changed.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),cfg=require(path.join(root,'tools/workflow.config.json'));
const ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
const source=fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
let now=1792713600000;M.setTimeProvider(()=>now);
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length,copy=x=>JSON.parse(JSON.stringify(x));
const q=(a,p)=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)]:null;
const rank=p=>M.RARITIES.indexOf(p.rarity||'normal');
function birth(seed,starter,hero){return M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(seed),hero),starter),now);}
function power(p){return Math.sqrt(M.petBaseHP(p))*mean(M.petAttackFaces(p,true))*(1+.16*(M.petSkills(p).length-1));}
function matchupPower(p,enemy){return power(p)*M.matchupMultiplier(p.id,enemy)/Math.sqrt(M.matchupMultiplier(enemy,p.id));}
function team(s,map){
 const ids=M.MAPS[map].pets,chosen=[];
 for(let i=0;i<3&&i<s.pets.length;i++){
  const candidates=s.pets.filter(p=>!chosen.some(x=>x.uid===p.uid)&&!M.isBreedingPet(s,p.uid));
  candidates.sort((a,b)=>score(b)-score(a));chosen.push(candidates[0]);
  function score(p){return mean(ids.map(e=>{const value=matchupPower(p,e),best=chosen.length?Math.max(...chosen.map(c=>matchupPower(c,e))):0;return value*(value>best?1:.35);}));}
 }
 for(let i=0;i<chosen.length;i++)s=M.assignPartySlot(s,chosen[i].uid,i);
 return s;
}
function chooseFighter(s){
 const alive=M.homeParty(s).filter(Boolean).map(uid=>M.petCombat(s,uid)).filter(v=>v.hp>0);
 alive.sort((a,b)=>matchupPower(b.pet,s.enemy)*Math.sqrt(b.ratio)-matchupPower(a.pet,s.enemy)*Math.sqrt(a.ratio));
 return alive.length?M.selectActive(s,alive[0].pet.uid):s;
}
function battleStep(s,careful,stats){
 let hit=M.attackAmount(s),incoming=M.enemyAttackAmount(s),health=M.hp(s),missing=M.maxHP(s)-health;
 if(s.potions&&!s.usedHeal&&missing>0&&(missing>=M.healAmount(s)*.85||health<=incoming+1||s.hpRatio<.35)){s=M.act(s,'heal');stats.heals++;}
 hit=M.attackAmount(s);health=M.hp(s);
 const avg=mean(M.petAttackFaces(s.active)),max=Math.max(...M.petAttackFaces(s.active));
 if(s.boosts&&!s.doubled&&hit<s.enemyHP){
  const boosted=M.act(s,'boost'),bh=M.attackAmount(boosted);
  if(bh>=s.enemyHP||s.attack>=avg&&s.boostMultiplier>=3||health<=incoming&&s.attack>=avg||s.boosts>=4){s=boosted;hit=bh;stats.boosts++;}
 }
 let defend=false;
 if(careful&&hit<s.enemyHP&&!s.doubled){
  const expected=mean(M.enemyAttackFaces(s))*M.matchupMultiplier(s.enemy,s.active.id),threshold=avg*M.matchupMultiplier(s.active.id,s.enemy);
  defend=(s.attack<avg*.85||incoming/Math.max(hit,1)>expected/Math.max(threshold,1)*1.25||health<=incoming&&s.attack<max);
  if(s.skill?.poison>0&&s.enemyHP<=(s.skill.poisonDamage||2)*s.skill.poison)defend=true;
 }
 stats.turns++;stats.guards+=Number(defend);
 return M.act(s,defend?'guard':'attack');
}
function run(s,map,careful=true){
 s=M.retreatExpedition(s,now);s=team(s,map);
 s=M.syncStamina(s,now);if(s.stamina.value<M.EXPEDITION_COST){now+=M.STAMINA_INTERVAL*(M.EXPEDITION_COST-s.stamina.value);s=M.syncStamina(s,now);}
 s=M.enterExpedition(s,map,now);assert(s.expedition&&s.mapId===map&&s.step===1);
 const stats={map,won:false,deathFloor:null,turns:0,guards:0,heals:0,boosts:0,battles:[],eggsBefore:s.eggs.length};let floorTurns=0,lastStep=1;
 for(let a=0;a<1400&&!['lost','won'].includes(s.phase);a++){
  if(s.step!==lastStep){stats.battles.push({floor:lastStep,turns:floorTurns});floorTurns=0;lastStep=s.step;}
  if(s.phase==='encounter'){
   s=chooseFighter(s);
   if(careful&&s.swaps&&M.matchupMultiplier(s.active.id,s.enemy)<1&&M.matchupMultiplier(s.enemy,s.active.id)>1){s=M.act(s,'reroll');s=chooseFighter(s);}
   s=M.act(s,'challenge');
  }else if(s.phase==='battle'){s=battleStep(s,careful,stats);floorTurns++;now+=3500;}
  else if(s.phase==='reward'){const r=s.reward,old=r.kind==='attack'?s.active.faces:s.healFaces;s=M.act(s,['attack','heal'].includes(r.kind)&&mean(r.values)<mean(old)?'keep':'take');}
  else if(s.phase==='event')s=M.act(s,'eventContinue');
  else if(s.phase==='nest')s=M.act(s,s.eggHunt.candidates.length<s.eggHunt.limit?'eggSearch':'eggTake');
  else if(s.phase==='eggClaimed')s=M.act(s,'eggContinue');
  else throw Error('Unhandled '+s.phase);
 }
 assert(['won','lost'].includes(s.phase),'bounded run did not end');stats.won=s.phase==='won';stats.deathFloor=stats.won?null:s.step;
 stats.battles.push({floor:s.step,turns:floorTurns,won:stats.won});stats.eggs=s.eggs.length-stats.eggsBefore;
 assert(M.restore(JSON.stringify(s)),'legitimate run must remain valid');
 return {s,stats};
}
function hatchAll(s,counts){
 for(let rounds=0;M.availableEggs(s).length||s.incubators.some(Boolean);rounds++){
  assert(rounds<300);for(let i=0;i<2;i++){const egg=M.availableEggs(s)[0];if(!s.incubators[i]&&egg)s=M.startIncubation(s,egg.id,i,now);}
  now=Math.max(now,...s.incubators.filter(Boolean).map(x=>x.readyAt));
  for(let i=0;i<2;i++)if(s.incubators[i]){const before=s.pets.length;s=M.acknowledgeHatch(M.claimHatch(s,i,now));counts.hatches+=s.pets.length-before;}
 }
 return s;
}
function breedOne(s,counts){
 if(s.pets.length<4)return s;
 const sorted=[...s.pets].sort((a,b)=>power(b)-power(a)),best=power(sorted[0]);let pair,bestScore=0;
 for(let i=0;i<Math.min(sorted.length,15);i++)for(let j=i+1;j<Math.min(sorted.length,20);j++){
  const a=sorted[i],b=sorted[j];if(a.sex===b.sex)continue;
  const n=new Set([...M.petSkills(a),...M.petSkills(b)]).size,expected=n<=2?n:n===3?2.5:n===4?3:n===5?4:5;
  if(expected<=Math.max(M.petSkills(a).length,M.petSkills(b).length))continue;
  const estimate=Math.sqrt((M.petBaseHP(a)+M.petBaseHP(b))/2)*(mean(a.baseFaces)+mean(b.baseFaces))/2*(1+.16*(expected-1));
  if(estimate<Math.max(power(a),power(b))*.98||estimate<best*.65)continue;
  const value=estimate-Math.max(power(a),power(b))+.1*estimate;
  if(value>bestScore){bestScore=value;pair=[a,b];}
 }
 if(!pair)return s;
 const spare=sorted.find(p=>!pair.includes(p));s=M.assignPartySlot(s,spare.uid,0);
 const mother=pair.find(p=>p.sex==='female'),father=pair.find(p=>p.sex==='male');
 s=M.startBreeding(s,mother.uid,father.uid,now);assert(s.breeding,'breeding must start');now=s.breeding.readyAt;s=M.claimBreeding(s,now);counts.breeds++;return hatchAll(s,counts);
}
const mode=process.argv[2]||'first',samples=+(process.argv[3]||100);
assert(['first','campaign'].includes(mode)&&Number.isInteger(samples)&&samples>0&&samples<=10000,'Usage: node tools/simulate-balance.cjs first|campaign [positive sample count <=10000]');
const report={sourceSHA:crypto.createHash('sha256').update(source).digest('hex'),mode,samples,assumptions:{freshFactory:'newJourney/chooseHero/chooseStarter',ads:false,gyms:false,friends:false,productChanges:false,waiting:'virtual trusted elapsed time, normal durations',policy:'visible current dice only, heal/boost, guard poor rolls, type-aware 3-pet team; no RNG peeking',breeding:'opposite sex, real consumes parents, choose high expected base stats plus skill union, never retry same egg'},results:[]};
if(mode==='first')for(const careful of [false,true])for(const starter of M.STARTERS)for(const hero of M.HERO_IDS){
 const rows=[];for(let i=0;i<samples;i++){now=1792713600000+(i*178921+M.STARTERS.indexOf(starter)*1271+M.HERO_IDS.indexOf(hero)*313);const seed=(Math.imul(i+1,2654435761)^91357)>>>0;rows.push(run(birth(seed,starter,hero),0,careful).stats);}
 const r={starter,hero,careful,n:samples,win:rows.filter(r=>r.won).length,reachElite:rows.filter(r=>r.won||r.deathFloor>=5).length,gotEgg:rows.filter(r=>r.eggs>0).length,deaths:Array.from({length:10},(_,i)=>rows.filter(r=>r.deathFloor===i+1).length),medianTurns:q(rows.map(r=>r.turns),.5)};report.results.push(r);console.log(JSON.stringify(r));
}
else for(const breeding of [false,true])for(const starter of M.STARTERS)for(let i=0;i<samples;i++){
 now=1792713600000+i*719233+M.STARTERS.indexOf(starter)*9511;const start=now,seed=(Math.imul(i+1,2654435761)^91357)>>>0;
 let s=birth(seed,starter,'ranger'),counts={hatches:0,breeds:0},logs=[],target=0,fail=0;
 for(let attempt=0;attempt<120&&target<12;attempt++){
  const farm=fail>=2&&target>0,map=farm?target-1:target,pre={pets:s.pets.length,skills:M.homeParty(s).filter(Boolean).map(uid=>M.petSkills(M.petEntry(s,uid)).length)};
  const result=run(s,map,true);s=result.s;logs.push({...result.stats,farm,pre});
  if(!farm){if(result.stats.won){target++;fail=0;}else fail++;}else fail=0;
  s=M.retreatExpedition(s,now);s=hatchAll(s,counts);if(breeding)s=breedOne(s,counts);
 }
 assert(M.restore(JSON.stringify(s)),'campaign save invalid');
 const r={starter,breeding,index:i,cleared:s.clearedMaps.length,attempts:logs.length,...counts,virtualHours:(now-start)/3600000,pets:s.pets.length,maxSkills:Math.max(...s.pets.map(p=>M.petSkills(p).length)),logs};report.results.push(r);
 console.log(JSON.stringify({...r,logs:undefined}));
}
fs.mkdirSync(path.join(root,'checks/difficulty-simulation'),{recursive:true});
fs.writeFileSync(path.join(root,'checks/difficulty-simulation',mode+'-report.json'),JSON.stringify(report,null,2));
