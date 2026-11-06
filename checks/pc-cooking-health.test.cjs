// PC UI health must include meals without changing any model state transition.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const mobileSource=fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8').replace(/\r\n/g,'\n');
const cookingSource=fs.readFileSync(path.join(root,'pc/game/PCCooking.ts'),'utf8');
function compile(source,imports={}){const out={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:1,target:4}}).outputText,{exports:out,require:p=>imports[p],Math,Date,JSON,Set,Map});return out;}
const C=compile(cookingSource),M=compile(require('../tools/pc-model-overrides.cjs').applyPCModelOverrides(mobileSource),{'./PCCooking':C});
const copy=x=>JSON.parse(JSON.stringify(x)),results=[];
const display=(s,uid)=>(M.pcPetCombat||M.petCombat)(s,uid);
function food(quality=3){const s=C.newCooking();s.ingredients['herb:'+quality]=2;s.ingredients['mushroom:'+quality]=1;return C.eatMeal(C.cookMeal(s,'leaf-stew',quality).state,'leaf-stew',quality).state;}
function fixture(){let s=M.fresh(125,['beetle','fox','bud']);const uid=s.pets.find(p=>p.id==='beetle').uid;s=M.selectActive(s,uid);s.pcCooking=food();return s;}
function check(name,fn){fn();results.push(name);}
check('meal health is shown for the active pet instead of its unbuffed value',()=>{const s=fixture(),v=display(s,s.active.uid);assert.equal(v.max,32,'PC party panel must show the actual 32 maximum HP');assert.equal(v.hp,32);assert.equal(M.maxHP(s),32);assert.equal(M.hp(s),32);assert.equal(M.petCombat(s,s.active.uid).max,26,'shared internal calculation stays unchanged');});
check('all meal qualities apply to matching pets only',()=>{for(const [q,want]of [[1,29],[2,31],[3,32]]){const s=fixture();s.pcCooking=food(q);assert.equal(display(s,s.active.uid).max,want);const fox=s.pets.find(p=>p.id==='fox');assert.equal(display(s,fox.uid).max,22);assert.equal(display(s,fox.uid).hp,22);}});
check('injured reserves, dead pets and repeated team switches retain their exact health',()=>{let s=fixture(),uid=s.active.uid,other=s.pets.find(p=>p.id==='fox').uid;s.hpRatio=.5;s.combatVitals[uid]={hpRatio:.5,hpBonus:0};const before=copy(s);assert.equal(display(s,uid).hp,16);s=M.selectActive(s,other);assert.equal(display(s,uid).hp,16);s=M.selectActive(s,uid);assert.equal(M.hp(s),16);assert.equal(display(s,uid).hp,16);assert.equal(s.hpRatio,before.hpRatio);s=M.selectActive(s,other);s.combatVitals[uid].hpRatio=0;assert.equal(display(s,uid).hp,0);assert.equal(M.selectActive(s,uid),s);});
check('temporary giant health and injured ratios use the same order as the battle HUD',()=>{const s=fixture();s.runEffects={[s.active.uid]:{giantUntil:3}};s.hpRatio=.5;s.combatVitals[s.active.uid]={hpRatio:.5,hpBonus:0};assert.equal(M.maxHP(s),48);assert.equal(display(s,s.active.uid).max,48);assert.equal(display(s,s.active.uid).hp,24);s.step=4;assert.equal(display(s,s.active.uid).max,32);assert.equal(display(s,s.active.uid).hp,16);});
check('expiry removes only the meal display bonus without mutating the stored pet or vitals',()=>{const s=fixture(),before=JSON.stringify({pets:s.pets,vitals:s.combatVitals});for(let i=0;i<10;i++)s.pcCooking=C.settleCookingBattle(s.pcCooking,{id:'health-expiry-'+i,completed:true,won:true,mapId:0}).state;assert.equal(s.pcCooking.active,undefined);assert.equal(display(s,s.active.uid).max,26);assert.equal(display(s,s.active.uid).hp,26);assert.equal(M.maxHP(s),26);assert.equal(JSON.stringify({pets:s.pets,vitals:s.combatVitals}),before);assert(M.restore(JSON.stringify(s)));});
check('reading PC display health is pure and does not modify mobile health',()=>{const s=fixture(),before=JSON.stringify(s);for(const p of s.pets)display(s,p.uid);assert.equal(JSON.stringify(s),before);const mobile=compile(mobileSource);assert.equal(mobile.maxHP(s),26);assert.equal(mobile.petCombat(s,s.active.uid).max,26);assert.equal(mobile.pcPetCombat,undefined);});
if(process.argv.includes('--audit-fixture'))check('real meal witness gives identical old/new combat states for every recorded action request',()=>{
 const dir=path.join(__dirname,'pc-player-audit-20261026/progression'),old=compile(fs.readFileSync(path.join(dir,'pc-model-before-health.ts'),'utf8'),{'./PCCooking':C});
 const witness=JSON.parse(fs.readFileSync(path.join(dir,'meal-witness.json'),'utf8')),trace=JSON.parse(fs.readFileSync(path.join(dir,'meal-trace.json'),'utf8'));
 const now=Math.max(1792713600000,witness.stamina.updatedAt),uid='hatch-variant-0-2-404775443-8';M.setTimeProvider(()=>now);old.setTimeProvider(()=>now);
 function enter(model){let s=model.assignPartySlot(copy(witness),uid,0);s=model.enterExpedition(s,0,now);const spare=s.pets.find(p=>p.uid!==uid&&!model.isBreedingPet(s,p.uid));s=model.selectActive(s,spare.uid);return model.selectActive(s,uid);}
 let s=enter(M),baseline=enter(old);assert.equal(display(s,uid).max,32);assert.equal(old.petCombat(baseline,uid).max,26);
 const action=(model,s,a)=>{let next=model.act(s,a);if(s.phase==='battle'&&next.phase!=='battle'){const r=C.settleCookingBattle(s.pcCooking||C.newCooking(),{id:'main:'+s.revision+':'+s.mapId+':'+s.step+':'+s.seed,won:next.enemyHP<=0,completed:true,mapId:s.mapId||0,rank:model.rankForStage(s.step)});if(r.changed)next={...next,pcCooking:r.state};}return next;};
 for(let i=0;i<trace.actions.length;i++){
   const step=trace.actions[i];s=action(M,s,step.action);baseline=action(old,baseline,step.action);assert.equal(JSON.stringify(s),JSON.stringify(baseline),'state changed after '+step.action+' at '+s.step);assert.equal(display(s,s.active.uid).hp,M.hp(s),'display HP '+i);assert.equal(display(s,s.active.uid).max,M.maxHP(s),'display maximum '+i);assert(M.restore(JSON.stringify(s)));
 }
 results.push('audit action requests: '+trace.actions.length+' identical full old/new states');
});
console.log(JSON.stringify({passed:results.length,results},null,2));
