/* Read-only fixtures. Reuses the production simulation policy; never accesses player saves. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'tools/simulate-balance.cjs'),'utf8').split('const mode=process.argv')[0];
const modelFile=process.env.PM_BALANCE_MODEL;
const scope={require,module:{exports:{}},__dirname:path.join(root,'tools'),console};
vm.runInNewContext((modelFile?source.replace("path.join(root,'assets/scripts/PMModel.ts')",JSON.stringify(modelFile)):source)+'\nmodule.exports={M,run,battleStep,team,chooseFighter,copy,mean,power,source,setNow:v=>now=v};',scope);
const {M,run,battleStep,copy,mean,power,setNow}=scope.module.exports;
const count=+(process.argv[2]||200),out=path.resolve(process.env.PM_BALANCE_OUTPUT||path.join(__dirname,'expansion-balance-audit'));fs.mkdirSync(out,{recursive:true});
const hash=require('crypto').createHash('sha256').update(scope.module.exports.source).digest('hex');
const roster=JSON.parse(fs.readFileSync(path.join(root,'art-source/regions-13-15/roster.json'),'utf8'));
const oldIds=M.MAPS.slice(9,12).flatMap(m=>m.pets);
function setup(ids,rarity,skills,seed){let s=M.fresh(seed,ids);s.pets=s.pets.filter(p=>ids.includes(p.id));s.owned=ids.slice();s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.clearedMaps=Array.from({length:15},(_,i)=>i);s.expedition=false;
 for(const p of s.pets){p.rarity=rarity;p.shiny=false;p.baseHP=M.naturalPetHP(p.id,rarity);p.baseFaces=copy(M.naturalPetFaces(p.id,rarity));p.faces=copy(p.baseFaces);p.skills=skills===3?M.RARITIES.map(r=>M.petSkills({id:p.id,rarity:r})[0]):copy(M.petSkills({id:p.id,rarity}));}
 s.qualities=Object.fromEntries(s.pets.map(p=>[p.id,[rarity]]));s.preferredRarities={};s.active=copy(s.pets[0]);s.reserve=s.pets[1]?copy(s.pets[1]):null;s.team=[s.pets[0].uid,s.pets[1]?.uid||'',s.pets[2]?.uid||''];s.runRoster={};s.combatVitals={};assert(M.restore(JSON.stringify(s)),'controlled fixture restores');return s;}
function ci(k,n){const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,w=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [c-w,c+w].map(x=>+(x*100).toFixed(1));}
const report={sourceSHA:hash,samplesPerCell:count,assumptions:{fixtures:'Controlled late-game inventory, not simulated acquisition history; fresh run each trial',policy:'Production visible-dice-only policy: matchup team, heal, boost, guard poor rolls, one conditional refresh; no future RNG',extras:'No badges, ads, shiny, friends or food; normal battle rewards/events remain enabled',seed:'Paired deterministic seeds in every cohort/map',skills:'Three skills means inherited R/SR/SSR skills of same species; mechanically obtainable, acquisition cost not simulated',scope:'Shared adventure model; browser/APP without platform-specific extras; not actual-player win rate'},stats:[],parity:[],matrix:[],duels:[]};
for(const p of roster.pets)for(const rarity of M.RARITIES){const old=oldIds.find(id=>M.PETS[id].type===p.type),faces=copy(M.naturalPetFaces(p.id,rarity)),oldFaces=M.naturalPetFaces(old,rarity),code=M.petSkills({id:p.id,rarity})[0],sk=M.SKILL_SPECS[code];
 report.stats.push({id:p.id,name:M.petName({id:p.id,rarity}),type:p.type,rank:M.PETS[p.id].rank,rarity,hp:M.naturalPetHP(p.id,rarity),faces,previous:old,hpRatio:+(M.naturalPetHP(p.id,rarity)/M.naturalPetHP(old,rarity)).toFixed(3),attackRatio:+(mean(faces)/mean(oldFaces)).toFixed(3)});
 if(['even','odd'].includes(sk.gate)){const matching=faces.filter(v=>v%2===(sk.gate==='odd'?1:0)).length;report.parity.push({id:p.id,rarity,code,gate:sk.gate,faces,matching,blockedAtBirth:matching===0});}}
const prior=process.argv.includes('--duels-only')?JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8')):null;
if(prior){assert.equal(prior.sourceSHA,hash);assert.equal(prior.samplesPerCell,count);report.matrix=prior.matrix;}
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));save();
if(process.argv.includes('--stats-only')){console.log(JSON.stringify({blockedParity:report.parity.filter(r=>r.blockedAtBirth),stats:report.stats},null,2));process.exit();}
for(const profile of (prior?[]:process.env.PM_BALANCE_PROFILES?.split(',')||['old-SSR-one','old-SSR-three','progressive-SSR-three','old-SR-one']))for(const map of [11,12,13,14]){
 const skills=profile.includes('three')?3:1,rarity=profile==='old-SR-one'?'SR':'SSR',ids=profile.startsWith('progressive')?M.MAPS.slice(9,Math.max(12,map)).flatMap(m=>m.pets):oldIds,rows=[],teams={};
 for(let i=0;i<count;i++){const now=1792713600000+i*178921,seed=(Math.imul(i+1,2654435761)^91357)>>>0;setNow(now);let s=setup(ids,rarity,skills,seed);const arranged=scope.module.exports.team(s,map),key=M.homeParty(arranged).filter(Boolean).map(uid=>M.petEntry(arranged,uid).id).join('/');teams[key]=(teams[key]||0)+1;const r=run(s,map,true);rows.push(r.stats);}
 const wins=rows.filter(r=>r.won).length,turns=rows.map(r=>r.turns).sort((a,b)=>a-b),r={profile,map:map+1,n:count,wins,rate:+(wins/count*100).toFixed(1),wilson95:ci(wins,count),medianTurns:turns[Math.floor(count/2)],deaths:Array.from({length:10},(_,i)=>rows.filter(r=>r.deathFloor===i+1).length),meanHeals:+mean(rows.map(r=>r.heals)).toFixed(1),meanBoosts:+mean(rows.map(r=>r.boosts)).toFixed(1),teams,rows};report.matrix.push(r);save();console.log(JSON.stringify({...r,rows:undefined}));
}
// Natural one-on-one comparisons: original faces and stocks, current-map normal opponents.
// The absence of an allyDown trigger here is expected; contextual effect tests cover it separately.
for(const floor of (process.argv.includes('--maps-only')?[]:[1,10]))for(const p of roster.pets)for(const rarity of M.RARITIES){const code=M.petSkills({id:p.id,rarity})[0],sk=M.SKILL_SPECS[code];let uses=0,winWith=0,winWithout=0,turnWith=0,healingWith=0;
 for(let i=0;i<count;i++){const now=1792713600000+i*178921,seed=(Math.imul(i+1,2654435761)^91357)>>>0;setNow(now);const fixture=setup([p.id],rarity,1,seed);let initial=M.enterExpedition(fixture,p.mapId,now);initial.step=floor;initial.enemy=M.MAPS[p.mapId].pets[floor===10?5:i%4];initial.enemyRarity=M.encounterRarity(floor,p.mapId);initial.enemyHP=initial.enemyMax=M.enemyHealthForStage(floor,p.mapId);
  for(const enabled of [true,false]){let s=copy(initial);if(!enabled){for(const pet of s.pets)pet.skills=[];s.active.skills=[];for(const v of Object.values(s.runRoster||{}))v.skills=[];}s=M.act(s,'challenge');assert.equal(s.active.id,p.id);assert.equal(M.homeParty(s).filter(Boolean).length,1);assert.equal(M.combatSkills(s).includes(code),enabled);let fired=s.skill.usedCodes.includes(code),stats={turns:0,heals:0,boosts:0,guards:0};
   while(s.phase==='battle'&&stats.turns<150){s=battleStep(s,true,stats);fired||=s.skill?.usedCodes?.includes(code);}
   assert(s.phase!=='battle','bounded duel');const won=s.phase!=='lost';if(enabled){winWith+=Number(won);uses+=Number(fired);turnWith+=stats.turns;healingWith+=stats.heals;}else winWithout+=Number(won);
  }
 }
 report.duels.push({floor,id:p.id,rarity,code,name:M.SKILLS[code][0],gate:sk.gate,when:sk.when,effect:sk.effect,n:count,triggered:uses,triggerRate:+(uses/count*100).toFixed(1),winWith,winWithout,meanTurns:+(turnWith/count).toFixed(2),meanHeals:+(healingWith/count).toFixed(2)});
}
save();console.log(JSON.stringify({done:true,file:path.join(out,'report.json'),mapRuns:report.matrix.length*count,pairedDuels:report.duels.length*count,blockedParity:report.parity.filter(r=>r.blockedAtBirth),zeroNaturalTriggers:report.duels.filter(r=>!r.triggered).map(r=>({id:r.id,rarity:r.rarity,gate:r.gate,when:r.when}))}));
