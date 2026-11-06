const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
assert.equal(typeof M.removePartySlot,'function');
for(const index of [1,2]){
 let s=M.fresh(48,['fox','turtle','bud']);s=M.assignPartySlot(s,s.pets[2].uid,2);
 const uid=M.homeParty(s)[index],other=M.homeParty(s)[3-index];s.runRoster[uid]={...s.pets.find(p=>p.uid===uid),faces:[11,12,13]};s.combatVitals[uid]={hpRatio:.42,hpBonus:7};if(index===1)s.reserve=JSON.parse(JSON.stringify(s.runRoster[uid]));
 const pets=JSON.stringify(s.pets),next=M.removePartySlot(s,index);
 assert.equal(M.homeParty(next)[index],'');assert.equal(M.homeParty(next)[3-index],other);assert.equal(next.active.uid,s.active.uid);assert.equal(JSON.stringify(next.pets),pets);assert.equal(next.combatVitals[uid].hpRatio,.42);
 const loaded=M.restore(JSON.stringify(next));assert(loaded);assert.equal(M.homeParty(loaded)[index],'');assert.equal(M.homeParty(M.restartRun(loaded,19))[index],'');
 const back=M.assignPartySlot(loaded,uid,index);assert.equal(M.homeParty(back)[index],uid);assert.deepEqual(Array.from(M.petCombat(back,uid).pet.faces),[11,12,13]);assert.equal(M.petCombat(back,uid).ratio,.42);
 assert.equal(M.removePartySlot(next,index),next);assert.equal(M.removePartySlot(s,0),s);const battle=M.act(s,'challenge');assert.equal(M.removePartySlot(battle,index),battle);
}
console.log('PASS remove each reserve only, preserve collection/vitals/growth/other slot, save and restart, reject active/battle removal');
