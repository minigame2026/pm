const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map,unescape,escape,encodeURIComponent,decodeURIComponent});
const day=86400000,t=1800000000000,copy=x=>JSON.parse(JSON.stringify(x));M.setTimeProvider(()=>t);
let a=M.ensureSocial(M.fresh(13,['fox']),'owner-a'),b=M.ensureSocial(M.fresh(99,['bud']),'owner-b');
const code=M.makePostcardCode(a,a.active.uid),receipt=()=>M.makePostcardCode(b,b.active.uid,'owner-a');
let received=M.receiveVisitor(b,code);assert.equal(received.eggs.length,b.eggs.length+1,'scanner welcome egg');b=received;
assert.equal(M.receiveVisitor(b,code).eggs.length,b.eggs.length,'same card no repeated egg');
a=M.receiveVisitor(a,receipt());assert.equal(a.eggs.length,1,'sender reply egg');assert.equal(M.receiveVisitor(a,receipt()).eggs.length,1);
assert.equal(a.social.friends.length,1);assert.equal(b.social.friends.length,1);assert(M.restore(JSON.stringify(a)));
assert.equal(M.settleFriendGifts(a,NaN),a);assert.equal(M.settleFriendGifts(a,t-1),a);assert.equal(M.settleFriendGifts(a,t+day-1),a);
let gifts=M.settleFriendGifts(a,t+day*200);assert.equal(gifts.social.friends[0].settledAt,t+day*200);assert(gifts.eggs.length>30&&gifts.eggs.length<100);assert.equal(M.settleFriendGifts(gifts,t+day*200),gifts);assert.equal(M.settleFriendGifts(gifts,t),gifts);assert(M.restore(JSON.stringify(gifts)));
let sequential=a;for(let i=1;i<=200;i++)sequential=M.settleFriendGifts(sequential,t+day*i);assert.deepEqual(copy(sequential.eggs),copy(gifts.eggs),'offline batching same rolls as daily');
let counts={normal:0,SR:0,SSR:0};for(let i=0;i<10000;i++){let s=copy(b);s.hatchSeed=(Math.imul(i,2654435761))>>>0;s.incubators=[null,null];s=M.startIncubation(s,s.eggs[0].id,0,t);counts[s.incubators[0].result]++;assert(M.FRIEND_PET_IDS.includes(s.eggs[0].affinity));}
assert(Math.abs(counts.normal/10000-.7)<.025);assert(Math.abs(counts.SR/10000-.25)<.025);assert(Math.abs(counts.SSR/10000-.05)<.02);
let hatch=M.startIncubation(b,b.eggs[0].id,0,t);const original=copy(hatch.incubators[0]);assert(M.restore(JSON.stringify(hatch)));hatch=M.claimHatch(hatch,0,t+day);assert(M.FRIEND_PET_IDS.includes(hatch.pets.at(-1).id));assert.equal(hatch.pets.at(-1).rarity,original.result);assert(M.restore(JSON.stringify(hatch)));
assert.equal(M.FRIEND_PET_IDS.length,18);assert.equal(new Set(M.FRIEND_PET_IDS.map(id=>M.PETS[id].type)).size,18);assert(!M.MAPS.some(map=>map.pets.some(id=>M.FRIEND_PET_IDS.includes(id))));
console.log('PASS scanner/reply single reward, trusted daily settlement 30%, deterministic offline/reload, exclusive 18x3 families, 70/25/5 hatching.',counts);
