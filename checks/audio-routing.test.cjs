const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
const code=ts.transpileModule(fs.readFileSync('assets/scripts/PMAudio.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
for(const native of [false,true]){
 const pending=new Map(),loaded=[],released=[];
 class Node{addChild(){}addComponent(){return {playing:false,clip:null,play(){this.playing=true},stop(){this.playing=false},pause(){this.playing=false}};}}
 const exports={},cc={Node,AudioClip:class{},AudioSource:class{},sys:{isNative:native,localStorage:{getItem:()=>null,setItem(){}}},resources:{load(p,t,cb){loaded.push(p);pending.set(p,cb)},release(p){released.push(p)}}};
 vm.runInNewContext(code,{exports,require:()=>cc,Set,console});const a=new exports.PMAudio(new Node()),camp=native?'camp-app':'camp-short';
 assert(loaded.includes('audio/'+camp));assert(!loaded.includes('audio/'+(native?'camp-short':'camp-app')));assert(!loaded.includes('audio/battle-normal'));
 function finish(id){const p='audio/'+id,cb=pending.get(p);assert(cb,p);pending.delete(p);cb(null,{name:id});}
 finish(camp);assert(!a.music.playing);a.unlock();assert(a.music.playing);a.select('camp');assert.equal(loaded.filter(p=>p==='audio/'+camp).length,1);
 a.select('battle-normal');a.select('battle-elite');finish('battle-normal');assert.equal(a.music.clip.name,camp,'stale load cannot replace selected track');finish('battle-elite');assert.equal(a.music.clip.name,'battle-elite');assert(released.includes('audio/'+camp));assert(released.includes('audio/battle-normal'));
 a.pause('ad');assert(!a.music.playing);a.select('battle-boss');finish('battle-boss');assert(!a.music.playing);a.resume('ad');assert.equal(a.music.clip.name,'battle-boss');assert(a.music.playing);
 a.toggle('music');assert(!a.music.playing);a.toggle('music');assert(a.music.playing);a.dispose();assert(!a.music.playing);
}
assert(!fs.existsSync('assets/resources/audio/camp.mp3'));assert(!fs.existsSync('assets/resources/audio/battle.mp3'));
for(const n of ['camp-app','camp-short','battle-normal','battle-elite','battle-boss'])assert(fs.statSync('assets/resources/audio/'+n+'.mp3').size>1000);
console.log('PASS native/full vs browser/short; three enemy ranks; lazy loading, stale requests, release, ad/mute/dispose; obsolete tracks removed');
