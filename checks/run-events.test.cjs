const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x)),saved=s=>{const n=M.restore(JSON.stringify(s));assert(n,'save restores');return n;};
function base(){const s=M.fresh(91,['fox','turtle','bud']);s.expedition=true;return s;}
for(const [mr,fr] of [['normal','SR'],['SSR','normal'],['SR','SSR']]){
 let s=base();const [m,f]=s.pets;m.sex='female';f.sex='male';m.rarity=mr;f.rarity=fr;s.active=copy(m);s.reserve=copy(f);s.runRoster={};s=M.assignPartySlot(s,s.pets[2].uid,0);
 for(let seed=1;seed<=100;seed++){s.hatchSeed=seed;const n=M.startBreeding(s,m.uid,f.uid,1000);assert(n.breeding);const higher=M.RARITIES.indexOf(mr)>M.RARITIES.indexOf(fr)?m:f;assert.equal(n.breeding.genes.rarity,higher.rarity);assert.equal(n.breeding.genes.id,higher.id);}
}
let s=base(),team=M.homeParty(s);s.combatVitals[team[1]]={hpRatio:0,hpBonus:0};s.combatVitals[team[2]]={hpRatio:0,hpBonus:0};
let n=M.grantBattleEvent(s,'revive');assert.equal(n.phase,'event');assert.equal(team.slice(1).filter(uid=>M.petCombat(n,uid).hp>0).length,1);saved(n);
assert.equal(M.grantBattleEvent(base(),'revive').phase,'encounter','no dead target is a no-op');
s=base();team=M.homeParty(s);s.hpRatio=.5;s.combatVitals[team[1]]={hpRatio:.1,hpBonus:0};s.combatVitals[team[2]]={hpRatio:0,hpBonus:0};n=M.grantBattleEvent(s,'heal');assert.equal(n.battleEvent.uid,team[1]);assert.equal(M.petCombat(n,team[1]).ratio,1);assert.equal(M.petCombat(n,team[2]).hp,0);saved(n);
s=base();n=M.grantBattleEvent(s,'giant');const uid=n.battleEvent.uid;assert.equal(M.giantMultiplier(n,uid),1.5);assert.equal(M.petCombat(n,uid).max,Math.round(M.petCombat(s,uid).max*1.5));
n=saved(n);n=M.act(n,'eventContinue');assert.equal(n.step,2);n=M.selectActive(n,uid);assert.equal(M.giantMultiplier(n,uid),1.5);assert.deepEqual(copy(n.pets),copy(s.pets));
const once=M.act(n,'eventContinue');assert.equal(once,n);n.step=3;assert.equal(M.giantMultiplier(n,uid),1.5);n.step=4;assert.equal(M.giantMultiplier(n,uid),1);assert(!M.restartRun(n,55).runEffects);
s=base();n=M.grantBattleEvent(s,'learn');assert.equal(n.battleEvent.kind,'learn');assert.equal(M.combatSkills(n,n.battleEvent.uid).length,M.petSkills(M.petEntry(n,n.battleEvent.uid)).length+1);assert.deepEqual(copy(n.pets),copy(s.pets));saved(n);assert(!M.restartRun(n,5).runEffects);
n=M.grantBattleEvent(base(),'egg');assert.equal(n.eggs.length,1);assert.equal(n.eggs[0].stage,5);assert(M.MAPS[0].pets.includes(n.eggs[0].affinity));saved(n);assert.equal(M.act(M.act(n,'eventContinue'),'eventContinue').eggs.length,1);
let hits=0;const kinds=new Set();for(let i=1;i<=10000;i++){let a=base();a.seed=i;a.phase='reward';a.reward={kind:'potion',values:[1],title:'potion'};a=M.act(a,'take');if(a.phase==='event'){hits++;kinds.add(a.battleEvent.kind);saved(a);}else assert.equal(a.phase,'encounter');}
assert(hits>1800&&hits<2200,hits);assert(kinds.has('giant')&&kinds.has('learn')&&kinds.has('egg'));
for(const step of [5,10]){let a=base();a.step=step;a.phase='reward';a.reward={kind:'potion',values:[1],title:'potion'};a=M.act(a,'take');assert.notEqual(a.phase,'event');}
console.log('PASS higher-rarity breeding; events, 20% frequency, valid targets, death/revive, giant 2 battles, temporary skills, elite eggs, reload/repeat/restart');
