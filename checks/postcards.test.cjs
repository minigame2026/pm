const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.deepEqual(copy(a),copy(b));
const host=(id='local-player',species='fox')=>M.ensureSocial(M.fresh(7,[species]),id);
const save=s=>{const n=M.restore(JSON.stringify(s));assert(n,'save accepted');eq(n,s);return n;};
for(const id of M.PET_IDS){
 let s=host('foreign-owner',id),p=s.pets.find(p=>p.id===id);
 s=M.setSocialProfile(s,'小晴★あおい',[M.PET_IDS[0],M.PET_IDS[19],M.PET_IDS[53]]);
 for(const rarity of ['normal','SR','SSR']){
  p=s.pets.find(p=>p.id===id);p.rarity=rarity;p.shiny=true;p.ornament='steam';
  const code=M.makePostcardCode(s,p.uid),c=M.readVisitCode(code);assert(c);assert.equal(c.species,id);assert.equal(c.rarity,rarity);assert.equal(c.nickname,'小晴★あおい');assert(c.shiny);eq(c.wishes,s.social.wishes);eq(c.skills,M.petSkills(p));
  assert.equal(M.readVisitCode('My postcard\n'+code+'\n♥').id,c.id);assert.equal(M.readVisitCode(code+'x'),null);assert(!/baseHP|baseFaces|genes/.test(JSON.stringify(c)));
  assert.equal(M.readVisitCode(M.makeVisitCode(s,p.uid)).species,id);
 }
}
let a=M.setSocialProfile(host('friend-owner','dragon'),'Mika',['fox']),b=host(),code=M.makePostcardCode(a,a.pets.find(p=>p.id==='dragon').uid,b.social.owner),original=copy(b);
b=M.receiveVisitor(b,code,1000);eq(b.pets,original.pets);eq(b.team,original.team);eq(b.eggs,original.eggs);assert.equal(M.replyPet(b,M.readVisitCode(code)).id,'fox');assert.equal(M.makePostcardCode(b,'missing'),null);assert.equal(M.receiveVisitor(a,code,1000),a);
b=M.completeVisit(b,2000);assert.equal(b.social.visitor.progress,3);assert.equal(b.social.album.length,1);assert.equal(b.social.bonds[0].nickname,'Mika');eq(b.pets,original.pets);eq(b.eggs,original.eggs);b=save(b);assert.equal(M.completeVisit(b,9000),b);
const record=copy(b.social.album[0]);b=M.receiveVisitor(b,code,3000);assert.equal(M.completeVisit(b,4000),b);eq(b.social.album[0],record);
for(let i=0;i<16;i++){const sender=host('friend-'+String(i).padStart(3,'0'),M.PET_IDS[i]);b=M.receiveVisitor(b,M.makePostcardCode(sender,sender.pets.find(p=>p.id===M.PET_IDS[i]).uid),10000+i);b=save(M.completeVisit(b,11000+i));}
assert.equal(b.social.album.length,12);assert(b.social.bonds.some(v=>v.species==='dragon'),'album eviction keeps species bond');
let bonding=M.completeVisit(M.receiveVisitor(host(),code,1000),2000);bonding.eggs.push({id:'my-egg',rarity:'normal',affinity:'bud',stage:5,mapId:0});bonding=M.startBondIncubation(bonding,'my-egg','dragon',0,3000);assert.equal(bonding.eggs[0].bond.nickname,'Mika');bonding=M.claimHatch(bonding,0,bonding.incubators[0].readyAt);assert.equal(bonding.pets.at(-1).id,'dragon');assert.equal(bonding.pets.at(-1).rarity,'normal');save(bonding);
for(const input of ['', 'PMV2.!!', 'X'.repeat(4097),code.replace('PMV2.','PMV2.bad')])assert.equal(M.readVisitCode(input),null);
for(const changes of [{nickname:'<script>'},{wishes:['fox','fox']},{album:[{card:{},dice:[0,7]}]}]){const bad=copy(b);Object.assign(bad.social,changes);assert.equal(M.restore(JSON.stringify(bad)),null);}
assert.equal(M.setSocialProfile(b,'a'.repeat(13),[]),b);assert.equal(M.setSocialProfile(b,'ok',M.PET_IDS.slice(0,4)),b);
assert.equal(M.setSocialProfile(b,'\ud800',[]),b,'truncated emoji cannot corrupt a saved profile');
console.log('PASS 162 form V1/V2 roundtrips, unicode/wishes/cosmetics, tampering, no pet/stat transfer, one-action idempotence, 12 photos, reply match, own-egg bond provenance and old save support');
