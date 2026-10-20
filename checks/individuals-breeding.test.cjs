const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:m.exports,Math,Date,JSON,Set});const M=m.exports;
const copy=x=>JSON.parse(JSON.stringify(x)),roundtrip=s=>{const n=M.restore(JSON.stringify(s));assert.ok(n,'save must restore');return n;};
let groups=0;function test(name,fn){fn();groups++;console.log('PASS '+name);}
function hatch(s,id,rarity='normal',suffix='x',genes){s=copy(s);const egg={id:'test-'+suffix,affinity:id,rarity,stage:genes?0:5};if(genes)egg.genes=genes;s.eggs.push(egg);s=M.startIncubation(s,egg.id,0,1000);assert.ok(s.incubators[0]);s=M.claimHatch(s,0,1000+M.HATCH_DURATION);assert.ok(s.pendingHatch);return M.acknowledgeHatch(s);}
test('old collection migrates once, retains run HP and upgraded faces',()=>{
 let s=M.fresh(14);delete s.individualVersion;delete s.pets;delete s.team;delete s.runRoster;s.active={id:'fox',rarity:'SR',faces:[8,9,10]};s.reserve={id:'turtle',faces:[6,7,8]};s.owned.push('bud');s.qualities={fox:['normal','SR','SSR'],bud:['normal']};s.hpRatio=.371;
 s=roundtrip(s);assert.equal(s.pets.length,5);assert.equal(s.active.rarity,'SR');assert.equal(s.hpRatio,.371);assert.equal(s.active.faces.join(), '8,9,10');assert.equal(s.active.baseFaces.join(),'1,3,7');assert.equal(roundtrip(s).pets.length,5);
});
test('duplicate hatches are independently retained and sex is random 50/50',()=>{
 let s=M.fresh(71),before=s.pets.length,female=0;for(let i=0;i<1000;i++){s=hatch(s,'fox','SSR','dup'+i);female+=s.pets.at(-1).sex==='female';}
 assert.equal(s.pets.length,before+1000);assert.equal(new Set(s.pets.map(p=>p.uid)).size,s.pets.length);assert.ok(female>450&&female<550,female);assert.equal(s.warmth,0);roundtrip(s);
});
test('duplicate individuals can occupy three separate team slots and preserve separate run faces',()=>{
 let s=M.fresh(9);s=hatch(s,'fox','SSR','a');s=hatch(s,'fox','SSR','b');const a=s.pets.at(-2),b=s.pets.at(-1);s.active.faces=[8,9,10];const original=s.active.uid;
 s=M.assignPartySlot(s,a.uid,1);s=M.assignPartySlot(s,b.uid,2);s=M.assignPartySlot(s,a.uid,0);s.active.faces=[11,12,13];s=M.assignPartySlot(s,original,0);
 assert.equal(s.active.faces.join(),'8,9,10');s=M.assignPartySlot(s,a.uid,0);assert.equal(s.active.faces.join(),'11,12,13');assert.equal(new Set(M.homeParty(s)).size,3);roundtrip(s);
 const battle=M.act(s,'challenge');assert.equal(M.assignPartySlot(battle,b.uid,0),battle);
});
test('two-pet teams preserve empty slots when dragging either pet to third slot',()=>{
 for(const index of [0,1]){let s=M.fresh(9);const key=s.pets[index].uid;s=M.assignPartySlot(s,key,2);assert.equal(M.homeParty(s)[2],key);assert.ok(s.active.uid);assert.equal(s.reserve,null);s=roundtrip(s);assert.equal(M.homeParty(s)[2],key);s=M.restartRun(s,90);assert.equal(M.homeParty(s)[2],key);s=M.assignPartySlot(s,key,0);assert.equal(s.active.uid,key);roundtrip(s);}
});
test('ordinary, elite and boss battles never add pets or enter recruitment',()=>{
 for(const [mapId,step] of [[0,1],[0,5],[0,10],[1,5],[1,10]]){let s=M.fresh(52);if(mapId){s.clearedMaps=[0];s=M.startMap(s,mapId,52);}s.step=step;s.enemy=M.encounterPool(step,s.mapId)[0];s=M.act(s,'challenge');s.enemyHP=1;s.enemyMax=100;const before=s.pets.length,owned=s.owned.join();s=M.act(s,'attack');assert.equal(s.pets.length,before);assert.equal(s.owned.join(),owned);
 if(s.phase==='reward')s=M.act(s,'take');if(s.phase==='nest'){s=M.act(s,'eggSearch');s=M.act(s,'eggTake');s=M.act(s,'eggContinue');}
 assert.ok(!['recruit','team'].includes(s.phase));assert.equal(s.pets.length,before);roundtrip(s);}
});
test('skill count exact interval boundaries for each pool size',()=>{
 const cases={1:[[0,1],[.999,1]],2:[[0,2],[.4999,2],[.999,2]],3:[[.4999,2],[.5,3]],4:[[.2499,2],[.25,3],[.7499,3],[.75,4]],5:[[.2499,3],[.25,4],[.7499,4],[.75,5]],6:[[.2499,4],[.25,5],[.7499,5],[.75,6]],12:[[0,4],[.99,6]]};
 for(const [total,cs] of Object.entries(cases))for(const [roll,count] of cs)assert.equal(M.inheritedSkillCount(+total,roll),count);
 const expected={1:{1:10000},2:{2:10000},3:{2:5000,3:5000},4:{2:2500,3:5000,4:2500},5:{3:2500,4:5000,5:2500},6:{4:2500,5:5000,6:2500},12:{4:2500,5:5000,6:2500}};
 for(const [total,wanted] of Object.entries(expected)){const actual={};for(let i=0;i<10000;i++){const n=M.inheritedSkillCount(+total,(i+.5)/10000);actual[n]=(actual[n]||0)+1;}assert.deepEqual(actual,wanted);}
});
function parents(){let s=M.fresh(47,['fox','turtle','bud']);s.pets[0].sex='female';s.pets[1].sex='male';s.pets[0].skills=['opening','charged','healing'];s.pets[1].skills=['armor','focus','barrier'];s.active=copy(s.pets[0]);s.reserve=copy(s.pets[1]);s.runRoster={};s=M.assignPartySlot(s,s.pets[2].uid,0);return s;}
test('breeding is timed, restart-safe, idempotent and produces an egg rather than a pet',()=>{
 let s=parents(),count=s.pets.length;s=M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,2000);assert.ok(s.breeding);const genes=JSON.stringify(s.breeding.genes);assert.equal(M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,3000),s);assert.equal(M.claimBreeding(s,2000+M.BREED_DURATION-1),s);
 s=roundtrip(s);s=M.restartRun(s,99);assert.equal(JSON.stringify(s.breeding.genes),genes);s=M.claimBreeding(s,2000+M.BREED_DURATION);assert.equal(s.pets.length,count-2);const egg=s.eggs.at(-1);assert.equal(JSON.stringify(egg.genes),genes);assert.equal(M.claimBreeding(s,99999999),s);s=roundtrip(s);
 s=M.startIncubation(s,egg.id,0,9000000);assert.equal(s.incubators[0].result,egg.rarity);s=M.claimHatch(s,0,9000000+M.HATCH_DURATION);const child=s.pets.at(-1);assert.equal(child.skills.join(),egg.genes.skills.join());assert.equal(child.baseHP,egg.genes.baseHP);assert.equal(child.rarity,egg.rarity);assert.equal(child.id,egg.affinity);assert.equal(child.faces.join(),egg.genes.baseFaces.join());assert.equal(s.pets.length,count-1);assert.equal(M.claimHatch(s,0,99999999),s);roundtrip(s);
});
test('independent inheritance is 50/50, ignores temporary upgrades, deduplicates max six skills',()=>{
 let s=parents();s.pets[0].rarity='SSR';s.pets[0].baseHP=41;s.runRoster[s.pets[0].uid]=copy(s.pets[0]);s.runRoster[s.pets[0].uid].faces=[99,99,99];s.hpBonus=80;let motherForm=0,motherHP=0,motherAttack=0,mixed=0;
 for(let i=0;i<3000;i++){s.breeding=null;s=M.startBreeding(s,s.pets[0].uid,s.pets[1].uid,i);const g=s.breeding.genes;motherForm+=g.id==='fox';motherHP+=g.baseHP===41;motherAttack+=g.baseFaces.join()==='1,3,7';mixed+=(g.id==='fox')!==(g.baseHP===41);assert.ok(g.skills.length>=3&&g.skills.length<=6);assert.equal(new Set(g.skills).size,g.skills.length);assert.ok(!g.baseFaces.includes(99));}
 for(const n of [motherForm,motherHP,motherAttack])assert.ok(n>1350&&n<1650,n);assert.ok(mixed>1000);
 const duplicate=parents();duplicate.pets[1].skills=['opening','charged','healing'];const n=M.startBreeding(duplicate,duplicate.pets[0].uid,duplicate.pets[1].uid,0);assert.ok(n.breeding.genes.skills.length<=3);
 for(const second of ['opening','armor']){const d=parents();d.pets[0].skills=['opening'];d.pets[1].skills=[second];const child=M.startBreeding(d,d.pets[0].uid,d.pets[1].uid,0).breeding.genes;assert.equal(child.skills.length,second==='opening'?1:2);assert.equal(new Set(child.skills).size,child.skills.length);}
});
test('multiple attack, potion and defense skills trigger independently once',()=>{
 let s=parents();const p=s.pets[0];p.skills=['opening','venom','leech','healing','refund','charged'];s.active=copy(p);s.runRoster={};s=M.act(s,'challenge');s.hpRatio=.4;s.enemyHP=s.enemyMax=200;s.enemyAttack=2;s.attack=3;
 s=M.act(s,'heal');assert.equal(s.potions,3);assert.ok(s.skill.usedCodes.includes('healing')&&s.skill.usedCodes.includes('refund'));s=M.act(s,'boost');assert.ok(s.skill.usedCodes.includes('charged'));s=M.act(s,'attack');assert.equal(new Set(s.skill.usedCodes).size,6);assert.equal(s.skill.used,true);s=M.act(s,'heal');assert.equal(s.potions,2);roundtrip(s);
 let d=parents();d.pets[0].skills=['focus','barrier','armor','evade','emergency'];d.active=copy(d.pets[0]);d.runRoster={};d=M.act(d,'challenge');d.enemyHP=d.enemyMax=200;d=M.act(d,'guard');for(const c of ['focus','barrier','armor','evade'])assert.ok(d.skill.usedCodes.includes(c));assert.equal(d.attack,Math.max(...d.active.faces));roundtrip(d);
});
test('invalid sex pair and malformed inherited data rejected',()=>{
 const s=parents();assert.equal(M.startBreeding(s,s.pets[1].uid,s.pets[0].uid,0),s);assert.equal(M.startBreeding(s,s.pets[0].uid,s.pets[0].uid,0),s);
 for(const mutate of [n=>n.pets[0].sex='x',n=>n.pets[0].skills=['bad'],n=>n.pets.push(copy(n.pets[0])),n=>n.team[0]='missing']){const n=copy(s);mutate(n);assert.equal(M.restore(JSON.stringify(n)),null);}
});
console.log(groups+' individual/breeding groups passed');
