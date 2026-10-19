const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const config=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(config.typescript),'typescript.js'));
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:mod.exports,Math,Date,JSON,Set});
const M=mod.exports,copy=s=>JSON.parse(JSON.stringify(s)),same=(a,b)=>assert.deepEqual(copy(a),copy(b));
const saved=s=>{const out=M.restore(JSON.stringify(s));assert.ok(out,'save must restore');same(out,s);return out;};
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('New journey starts with no gifted pets; every hero/starter combo persists exactly one pet',()=>{
 assert.equal(typeof M.newJourney,'function');
 for(const hero of ['ranger','keeper','medic'])for(const starter of ['fox','bud','otter']){
  let s=saved(M.newJourney(411));assert.equal(s.journey.stage,'hero');assert.equal(s.pets.length,0);assert.equal(M.act(s,'challenge'),s);
  assert.equal(M.chooseStarter(s,starter),s);s=saved(M.chooseHero(s,hero));assert.equal(s.journey.stage,'starter');
  assert.equal(M.chooseHero(s,'ranger'),s);assert.equal(M.chooseStarter(s,'dragon'),s);
  s=saved(M.chooseStarter(s,starter));assert.equal(s.journey.stage,'done');assert.equal(s.pets.length,1);assert.equal(s.active.id,starter);assert.equal(s.reserve,null);assert.equal(s.team.filter(Boolean).length,1);
  same(s.owned,[starter]);assert.equal(M.chooseStarter(s,'fox'),s);assert.equal(M.prepareJourney(s),s);
  const restarted=M.restartRun(s,77);same(restarted.journey,s.journey);assert.equal(restarted.pets.length,1);saved(restarted);
 }
});
test('Existing progressed saves choose only a hero and retain progress/collection',()=>{
 let old=M.fresh(8,['bud','fox','turtle']);old.step=3;old.potions=1;old.warmth=8;
 const before=copy(old);let s=M.prepareJourney(saved(old));assert.equal(s.journey.legacy,true);saved(s);
 s=M.chooseHero(s,'keeper');assert.equal(s.journey.stage,'done');assert.equal(s.step,3);same(s.pets,before.pets);same(s.team,before.team);assert.equal(s.warmth,8);assert.equal(s.potions,1);saved(s);
 assert.equal(M.prepareJourney(s),s);assert.equal(M.prepareJourney(M.fresh(8)).pets.length,0);
});
test('Invalid hero, stage and starter data rejected',()=>{
 const s=M.newJourney(4);assert.equal(M.chooseHero(s,'nope'),s);
 for(const change of [{hero:'nope'},{stage:'unknown'},{stage:'done',hero:'ranger'},{stage:'starter',hero:null}]){
  const n=copy(s);Object.assign(n.journey,change);assert.equal(M.restore(JSON.stringify(n)),null);
 }
});
function ready(hero,seed=41){return M.chooseStarter(M.chooseHero(M.newJourney(seed),hero),'fox');}
test('Keeper shortens new incubations to 24 minutes including fixed-quality eggs',()=>{
 for(const hero of ['ranger','keeper','medic']){
  let s=ready(hero);s.eggs=[{id:'egg-test',rarity:'SR',affinity:'bud',stage:5,mapId:0}];
  s=M.startIncubation(s,'egg-test',0,10000);assert.equal(s.incubators[0].readyAt-10000,(hero==='keeper'?24:30)*60000);saved(s);
 }
});
test('Medic adds exactly 3 to first heal each battle, survives reload and resets next battle',()=>{
 let s=M.act(ready('medic'),'challenge');s.hpRatio=.1;s.heal=1;s.healMultiplier=1;
 const before=s.hpRatio;s=saved(M.act(s,'heal'));assert.ok(Math.abs(s.hpRatio-before-4/M.maxHP(s))<1e-9);assert.equal(s.skill.heroHealUsed,true);
 s.enemyAttack=1;s.enemyHP=50;s=M.act(s,'guard');s.hpRatio=.1;s.heal=1;s.healMultiplier=1;
 const second=s.hpRatio;s=M.act(s,'heal');assert.ok(Math.abs(s.hpRatio-second-1/M.maxHP(s))<1e-9);
 s=M.restartRun(s,78);s=M.act(s,'challenge');assert.equal(s.skill.heroHealUsed,false);
});
test('Ranger extra egg is committed once, save-stable and approximately 20 percent',()=>{
 let extra=0;for(let i=0;i<5000;i++){
  let s=ready('ranger',i*7919+29);s.step=5;s.phase='nest';s.eggHunt={limit:2,candidates:[],selected:-1};
  s=M.act(s,'eggSearch');const before=saved(s);s=M.act(s,'eggTake');same(s,M.act(before,'eggTake'));
  assert.ok([1,2].includes(s.eggs.length));assert.equal(M.act(s,'eggTake'),s);saved(s);
  if(s.eggs.length===2){extra++;assert.equal(s.eggHunt.bonusEggId,s.eggs[1].id);assert.ok(M.MAPS[0].pets.includes(s.eggs[1].affinity));assert.notEqual(s.eggs[0].id,s.eggs[1].id);}
 }
 assert.ok(extra>850&&extra<1150,extra+' / 5000');console.log('Extra eggs '+extra+'/5000');
});
console.log(passed+' onboarding groups passed');
