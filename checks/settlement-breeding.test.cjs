const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=1792396800000;let s=M.fresh(55,['fox','turtle','bud']);s.pets[0].sex='female';s.pets[1].sex='male';
assert.equal(M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,T),s,'active mother blocked');
s=M.assignPartySlot(s,s.pets[1].uid,0);assert.equal(M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,T),s,'active father blocked');
s=M.assignPartySlot(s,s.pets[2].uid,0);const active=s.active.uid;s=M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,T);assert.ok(s.breeding);
for(const key of [s.breeding.mother,s.breeding.father])assert.equal(M.assignPartySlot(s,key,0),s,'breeding parents cannot become active');
for(const key of [s.breeding.mother,s.breeding.father]){
 assert.equal(M.homeParty(s).includes(key),false,'breeding parents leave team immediately');
 for(const slot of [0,1,2])assert.equal(M.assignPartySlot(s,key,slot),s,'breeding parents cannot fill any team slot');
}
assert.equal(s.reserve,null);assert.equal(s.pets.length,3,'parents retained until egg claim');
const legacy=JSON.parse(JSON.stringify(s));legacy.team=[active,s.breeding.mother,s.breeding.father];legacy.reserve=legacy.pets.find(p=>p.uid===s.breeding.mother);
const loaded=M.restore(JSON.stringify(legacy));assert.ok(loaded);assert.equal(loaded.reserve,null);assert.deepEqual([...M.homeParty(loaded)],[active,'','']);
// Also prevent promoting a breeding parent by dragging the current active into its reserve slot.
const slots=M.homeParty(s);for(let i=1;i<3;i++)if([s.breeding.mother,s.breeding.father].includes(slots[i]))assert.equal(M.assignPartySlot(s,active,i),s);
s=M.claimBreeding(s,T+M.BREED_DURATION);assert.equal(s.active.uid,active);assert.equal(s.pets.length,1);assert.ok(M.restore(JSON.stringify(s)));
for(const phase of ['lost','won']){let r=M.enterExpedition(M.fresh(17),0,T);r.step=10;r.phase=phase;if(phase==='won')r.clearedMaps=[0];r.eggs=[{id:'earned',rarity:'normal',affinity:'bud',stage:5,mapId:0}];r.warmth=7;
 r=M.retreatExpedition(r,T);assert.equal(r.expedition,false);assert.equal(r.step,1);assert.equal(r.stamina.value,25);assert.equal(r.eggs[0].id,'earned');assert.equal(r.warmth,7);assert.equal(M.mapUnlocked(r,1),phase==='won');assert.ok(M.restore(JSON.stringify(r)));}
console.log('PASS active parents excluded, indirect team swaps blocked, breeding preserves active, both settlements retain rewards without refund');

