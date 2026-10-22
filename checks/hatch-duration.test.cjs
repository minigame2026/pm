const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
function model(test=false){const M={},source=fs.readFileSync('assets/scripts/PMModel.ts','utf8').replace('BUILD_TEST_MODE=false','BUILD_TEST_MODE='+test);vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});return M;}
for(const test of [false,true]){
 const m=model(test);assert.equal(m.EXPEDITION_COST,test?1:5);assert.equal(m.HATCH_DURATION,test?3000:1800000);assert.equal(m.BREED_DURATION,test?3000:1800000);
 let b=m.chooseStarter(m.chooseHero(m.newJourney(20),'ranger'),'fox');b=m.enterExpedition(m.syncStamina(b,10000),0,10000);assert.equal(b.stamina.value,test?29:25);
 b.eggs=[{id:'a',rarity:'normal',affinity:'bud',stage:5,mapId:0}];b=m.startIncubation(b,'a',0,10000);assert.equal(b.incubators[0].readyAt,10000+m.HATCH_DURATIONS.normal);
 for(const [rarity,minutes] of [['normal',10],['SR',20],['SSR',30]])for(const hero of ['ranger','keeper']){
  let q=m.chooseStarter(m.chooseHero(m.newJourney(22),hero),'fox');q.eggs=[{id:'duration',rarity,affinity:'bud',stage:5,mapId:0}];q=m.startIncubation(q,'duration',0,10000);
  const expected=(test?3000:minutes*60000)*(hero==='keeper'?.8:1),deadline=q.incubators[0].readyAt;
  assert.equal(deadline-10000,expected);assert.equal(m.claimHatch(q,0,deadline-1),q);assert.ok(m.claimHatch(q,0,deadline).pendingHatch);assert.equal(m.restore(JSON.stringify(q)).incubators[0].readyAt,deadline);
 }
 assert.equal(m.hatchDuration({...b,journey:{...b.journey,hero:'keeper'}}),m.HATCH_DURATION*.8);
}
console.log('PASS R/SR/SSR 10/20/30 minutes, keeper 8/16/24, test mode 3 seconds, completion boundary and persisted deadlines');
