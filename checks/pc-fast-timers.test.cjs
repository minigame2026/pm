const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
const source=fs.readFileSync('assets/scripts/PMModel.ts','utf8');
const qa=require('../tools/pc-test-profile.cjs');
const compiled=ts.transpileModule(qa.fastTimers(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
const m={};vm.runInNewContext(compiled,{exports:m,Math,Date,JSON,Set});
assert.equal(m.BUILD_TEST_MODE,false);assert.equal(m.HATCH_DURATION,1000);assert.equal(m.BREED_DURATION,1000);
for(const rarity of ['normal','SR','SSR'])for(const hero of ['ranger','keeper']){
 let s=m.chooseStarter(m.chooseHero(m.newJourney(22),hero),'fox');s.eggs=[{id:'qa-egg',rarity,affinity:'bud',stage:5,mapId:0}];s=m.startIncubation(s,'qa-egg',0,10000);
 assert.equal(s.incubators[0].readyAt,11000);assert.equal(m.claimHatch(s,0,10999),s);assert.ok(m.claimHatch(s,0,11000).pendingHatch);assert.equal(m.restore(JSON.stringify(s)).incubators[0].readyAt,11000);
}
assert.ok(source.includes('BUILD_TEST_MODE=false'));assert.ok(source.includes('BREED_DURATION=BUILD_TEST_MODE?3000:30*60*1000'));
let b=m.fresh(55,['fox','turtle','bud']);b.pets[0].sex='female';b.pets[1].sex='male';b=m.assignPartySlot(b,b.pets[2].uid,0);b=m.startBreeding(b,b.pets[0].uid,b.pets[1].uid,10000);
assert.equal(b.breeding.readyAt,11000);assert.equal(m.claimBreeding(b,10999),b);b=m.restore(JSON.stringify(b));assert.ok(b);assert.equal(b.breeding.readyAt,11000);const ready=m.claimBreeding(b,11000);assert.equal(ready.breeding,null);assert.equal(ready.eggs.length,b.eggs.length+1);assert.equal(m.claimBreeding(ready,12000),ready);
const generated='build/pc-project/assets/scripts/';
if(fs.existsSync('build/releases/Dicekin-Windows-QA-1s-x64/qa-profile.json')){
 const bridge={},calls=[];vm.runInNewContext(ts.transpileModule(fs.readFileSync(generated+'PCSteam.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:bridge,globalThis:{__dicekinSteam:{request(op){calls.push(op);return JSON.stringify({ok:true,data:{unixSeconds:100}});}}},JSON,Number,Array});
 for(const op of ['cloud.read','cloud.write','achievements.sync','leaderboard.upload'])assert.equal(bridge.steam.request(op).error,'qa_profile_disabled');
 assert.equal(calls.length,0);assert.equal(bridge.steam.request('time').ok,true);assert.deepEqual(calls,['time']);
 const social=fs.readFileSync(generated+'PCSocial.ts','utf8');assert.ok(social.includes('pm.pc.qa-1s.creature-dice.v1.steam.'));assert.ok(!social.includes("'pm.pc.creature-dice.v1"));
 const built=fs.readFileSync('build/releases/Dicekin-Windows-QA-1s-x64/Resources/assets/main/index.js','utf8');assert.ok(built.includes('"HATCH_DURATION",1e3'));assert.ok(built.includes('"BREED_DURATION",1e3'));assert.ok(built.includes('qa_profile_disabled'));
}
console.log('PASS PC QA 1-second hatch/breed boundaries + save roundtrips, compiled constants, isolated saves, Steam writes blocked, trusted time retained');
