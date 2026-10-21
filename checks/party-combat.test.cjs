const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
let s=M.fresh(71,['fox','turtle','bud']);s.expedition=true;
const team=M.homeParty(s),[a,b,c]=team;
s.hpRatio=.4;s.hpBonus=5;s.active.faces=[8,9,10];
let n=M.selectActive(s,b);assert.equal(n.hpRatio,1,'reserve has independent full HP');assert.equal(n.hpBonus,0);
n=M.selectActive(n,a);assert.equal(n.hpRatio,.4);assert.equal(n.hpBonus,5);assert.deepEqual([...n.active.faces],[8,9,10]);
n.phase='reward';n.reward={kind:'hp',values:[3],title:'HP'};n=M.act(n,'take');assert.equal(n.hpBonus,8);
n=M.selectActive(n,b);assert.equal(n.hpBonus,3);assert.equal(M.hp(n),M.petBaseHP(n.active),'team HP reward preserves current reserve health');
n.phase='reward';n.reward={kind:'attack',values:[11,12,13],title:'attack'};n=M.act(n,'take');n=M.selectActive(n,a);assert.deepEqual([...n.active.faces],[8,9,10]);
n=M.selectActive(n,b);assert.deepEqual([...n.active.faces],[11,12,13]);
n=M.selectActive(n,a);n=M.act(n,'challenge');
function kill(state){state.enemyHP=state.enemyMax=99999;state.enemyAttack=9999;state.attack=1;return M.act(state,'attack');}
n=kill(n);assert.equal(n.phase,'battle');assert.equal(n.active.uid,b);assert.equal(M.petCombat(n,a).hp,0);
assert.equal(n.lastRelay.from,a);assert.equal(n.hpRatio,1);
n=kill(n);assert.equal(n.phase,'battle');assert.equal(n.active.uid,c);assert.equal(M.petCombat(n,b).hp,0);
let saved=M.restore(JSON.stringify(n));assert(saved);assert.equal(saved.active.uid,c);assert.equal(M.petCombat(saved,a).hp,0);
let encounter={...saved,phase:'encounter'};assert.equal(M.selectActive(encounter,a),encounter,'dead cannot be selected');
n=kill(saved);assert.equal(n.phase,'lost');assert.equal(M.hp(n),0);for(const uid of team)assert.equal(M.petCombat(n,uid).hp,0);
n=M.restartRun(n,99);for(const uid of team){assert.equal(M.petCombat(n,uid).ratio,1);assert.equal(M.petCombat(n,uid).bonus,0);}
let old=M.fresh(32,['fox','turtle','bud']);delete old.combatVitals;delete old.combatVersion;old.hpRatio=.3;old.hpBonus=7;
old=M.restore(JSON.stringify(old));assert(old);assert.equal(old.hpRatio,.3);assert.equal(M.petCombat(old,old.reserve.uid).bonus,0);
let corrupt=JSON.parse(JSON.stringify(old));corrupt.combatVitals[old.reserve.uid]={hpRatio:-1,hpBonus:0};assert.equal(M.restore(JSON.stringify(corrupt)),null);
// Directional matchups are not symmetric: water attacking electric is neutral, electric attacking water is strong.
assert.equal(M.matchupMultiplier('otter','spark'),1);assert.equal(M.matchupMultiplier('spark','otter'),1.5);
console.log('PASS independent HP/growth/attacks, ordered relay, all-dead loss, dead lockout, save migration, restart and directional matchups');
