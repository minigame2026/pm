const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
let clock=0;const exportsObject={},motionCalls=[];
const motion=()=>({strike:(...a)=>motionCalls.push(['strike',...a]),hurt:()=>motionCalls.push(['hurt']),support:()=>{},fall:()=>motionCalls.push(['fall']),settle:()=>{}});
const fakeNode=id=>({name:id,isValid:true,active:true,position:{clone(){return {x:0,y:0};}},motion:motion(),getComponent(){return this.motion;}});
const tw={to(){return this;},start(){return this;}};const modules={cc:{Vec3:class{},Tween:{stopAllByTarget(){}},tween:()=>tw},'./PMModel':{PETS:{fox:{type:'fire'},dragon:{type:'dragon'}}},'./PCUI':{PC:{gold:'gold',green:'green',red:'red'},hex:x=>x},'./PCOnline':{},'./PCRaid':{},'./PCSocial':{},'./PCSteam':{},'./PCBattleAmbience':{},'./PCBattleScenes':{},'./PCPetMotion':{PCPetMotion:class{},attachPetMotion:()=>motion(),PCBattleEffects:class{}}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('pc/game/PCOnlineUI.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:exportsObject,require:k=>{assert(k in modules,k);return modules[k];},performance:{now:()=>clock},Math,Map,Set});
function subject(events,{reduced=false,round=1}={}){
  clock=0;motionCalls.length=0;const ui=Object.create(exportsObject.PCOnlineUI.prototype),hp=[],completed=[];
  const state={roundsCompleted:round,players:[{steamId:'p1',activePet:0,pets:[{uid:'u1',species:'fox',hp:18,maxHP:25}]}],enemies:[{id:'boss',hp:36,maxHP:42}],lastEvents:events};
  Object.assign(ui,{h:{reduced:()=>reduced,online:{raid:state},fast:()=>false},alive:true,section:'raidbattle',root:{isValid:true},pendingEvents:[...events],scheduled:[],animationTime:0,eventAt:0,nextState:state,labels:{'battle-log':{string:''}},actors:{p1:{node:fakeNode('p1'),uid:'u1',motion:motion(),species:'fox'},boss:{node:fakeNode('boss'),uid:'boss',motion:motion(),species:'dragon'}},deathPending:new Set(),floats:new Set(),fx:{hit(){},cast(){},trail(){},dispose(){}},refresh(){},syncActions(){},setHP:(...v)=>hp.push(v),syncBattle:s=>completed.push(s),floating(){},ensureMinion(){}});
  return {ui,hp,completed};
}
const damage={kind:'damage',actorId:'boss',targetId:'p1',amount:7,hpBefore:25,hpAfter:18,petIndex:0,text:'hit'};
{
  const t=subject([damage]);t.ui.tick();assert.equal(t.hp.length,0,'HP must wait for the visual contact');assert.equal(t.ui.animating,true,'last queued event remains blocked before contact');
  t.ui.tick(.179);assert.equal(t.hp.length,0);t.ui.tick(.002);assert.equal(t.hp[0][1],18);assert.equal(t.completed.length,0,'recovery must not finish before semantic beat');
  t.ui.tick(.129);assert.equal(t.completed.length,0,'recoil recovery must finish before the next input');t.ui.tick(.10);assert.equal(t.completed.length,1);assert.equal(t.ui.animating,false);assert.equal(motionCalls.filter(x=>x[0]==='strike').length,1);
}
{
  const t=subject([damage]);t.ui.tick();t.ui.dispose();t.ui.tick(1);assert.equal(t.hp.length,0,'disposed scene cannot receive a stale hit');
}
{
  const t=subject([{...damage,hpAfter:0},{kind:'death',actorId:'p1',petIndex:0,text:'fall'}]);t.ui.tick();t.ui.tick(.181);assert.equal(t.ui.actors.p1.node.active,true,'death needs its own fall animation');
  t.ui.tick(.129);assert.equal(t.ui.actors.p1.node.active,true);t.ui.tick(.10);t.ui.tick(.34);assert.equal(t.ui.actors.p1.node.active,false);assert.equal(t.completed.length,1);
}
{
  const t=subject([damage,{...damage,targetId:'p2',text:'AOE'}],{round:3});t.ui.actors.p2={node:fakeNode('p2'),uid:'u2',motion:motion(),species:'fox'};t.ui.h.online.raid.players.push({steamId:'p2',activePet:0,pets:[{maxHP:25}]});
  t.ui.tick();t.ui.tick(.181);assert.equal(t.hp.length,2,'AOE damage reaches all targets on one contact');assert.equal(motionCalls.filter(x=>x[0]==='strike').length,1,'AOE uses one boss attack');t.ui.tick(.229);assert.equal(t.completed.length,1);
}
{
  const t=subject([damage]);t.ui.h.fast=()=>true;t.ui.tick();t.ui.tick(.116);assert.equal(t.hp.length,0);t.ui.tick(.002);assert.equal(t.hp[0][1],18,'fast mode changes timing, not the event HP');t.ui.tick(.15);assert.equal(t.completed.length,1);
}
{
  const t=subject([damage],{reduced:true});t.ui.tick();assert.equal(t.hp[0][1],18);assert.equal(t.completed.length,1,'reduced mode preserves the same result immediately');assert.equal(t.ui.animating,false);
}
console.log('PC raid animation: contact snapshots, last-event barrier, disposal, death, AOE, fast and reduced modes passed');




