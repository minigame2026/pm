const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON,Set});const M=m.exports;
let s=M.fresh(123);s.owned.push('bud','dragon','owl');s.hpRatio=.413;s.active.faces=[8,9,10];s.reserve.faces=[4,5,6];s.qualities.dragon=['SSR'];s.preferredRarities.dragon='SSR';
const enemy=JSON.stringify([s.enemy,s.enemyHP,s.reward,s.seed,s.step]);
for(const [id,slot] of [['bud',2],['dragon',0],['owl',1],['dragon',2],['fox',0],['turtle',1],['owl',2]]){
 const old=JSON.stringify(s),next=M.assignPartySlot(s,id,slot);assert.equal(JSON.stringify(s),old);s=next;
 assert.equal(M.homeParty(s)[slot],id);assert.equal(s.hpRatio,.413);assert.equal(JSON.stringify([s.enemy,s.enemyHP,s.reward,s.seed,s.step]),enemy);assert.equal(new Set(M.homeParty(s)).size,3);
 s=M.restore(JSON.stringify(s));assert.ok(s);
}
assert.equal(s.active.id,'fox');assert.deepEqual(Array.from(s.active.faces),[8,9,10]);assert.deepEqual(Array.from(s.reserve.faces),[4,5,6]);
s=M.assignPartySlot(s,'dragon',0);assert.equal(s.active.rarity,'SSR');const restarted=M.restartRun(s,23);assert.equal(restarted.active.id,'dragon');assert.equal(restarted.active.rarity,'SSR');assert.deepEqual(Array.from(restarted.partySlots),Array.from(s.partySlots));
const battle=M.act(s,'challenge');for(const i of [0,1,2])assert.equal(M.assignPartySlot(battle,'bud',i),battle);
assert.equal(M.assignPartySlot(s,'slug',0),s);assert.equal(M.assignPartySlot(s,'fox',3),s);
for(const phase of ['lost','won','reward','recruit','team','nest','eggClaimed']){const copy=JSON.parse(JSON.stringify(s));copy.phase=phase;const n=M.assignPartySlot(copy,'bud',0);assert.equal(n.active.id,'bud');assert.equal(n.phase,phase);assert.equal(n.hpRatio,.413);}
console.log('PASS home party: explicit 3 slots, swapping, rarity, upgraded faces, enemy preservation, immutable state, save/restart and battle lock');
