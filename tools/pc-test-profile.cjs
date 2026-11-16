const fs=require('fs'),path=require('path');
function fastTimers(source){
 const substitutions=[
  [/HATCH_DURATION=BUILD_TEST_MODE\?3000:(?:15|30)\*60\*1000/,'HATCH_DURATION=1000'],
  [/\{normal:BUILD_TEST_MODE\?3000:(?:5|10)\*60\*1000,SR:BUILD_TEST_MODE\?3000:(?:10|20)\*60\*1000,SSR:HATCH_DURATION\}/,'{normal:1000,SR:1000,SSR:1000}'],
  [/HATCH_DURATIONS\[rarity\]\*\(s\.journey\?\.hero==='keeper'\?\.8:1\)/,'HATCH_DURATIONS[rarity]'],
  [/BREED_DURATION=BUILD_TEST_MODE\?3000:(?:10|30)\*60\*1000/,'BREED_DURATION=1000']
 ];
 for(const [from,to]of substitutions){if(!from.test(source))throw Error('PC QA timer hook changed: '+from);source=source.replace(from,to);}
 return source;
}
function applyTestProfile(dest){
 const dir=path.join(dest,'assets/scripts'),model=path.join(dir,'PMModel.ts');
 fs.writeFileSync(model,fastTimers(fs.readFileSync(model,'utf8')));
 for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.ts'))){const file=path.join(dir,name);let s=fs.readFileSync(file,'utf8');s=s.replaceAll('pm.pc.','pm.pc.qa-1s.').replaceAll('pm-pc-checkpoints-v1','pm-pc-qa-1s-checkpoints-v1');fs.writeFileSync(file,s);}
 const bridge=path.join(dir,'PCSteam.ts');let s=fs.readFileSync(bridge,'utf8');const hook='    const bridge = native();';
 if(!s.includes(hook))throw Error('PC QA Steam boundary changed');
 s=s.replace(hook,"    // Fast-timer QA progress must never enter production Cloud, achievements or rankings.\n    if(op.startsWith('cloud.')||op.startsWith('help.')||op==='achievements.sync'||op==='leaderboard.upload')return {ok:false,error:'qa_profile_disabled'};\n"+hook);fs.writeFileSync(bridge,s);
 return {profile:'qa-fast-timers',hatchMs:1000,breedMs:1000,storage:'pm.pc.qa-1s.creature-dice.v1',productionCloudAndAchievements:false};
}
module.exports={fastTimers,applyTestProfile};
