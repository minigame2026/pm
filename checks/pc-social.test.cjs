const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const cfg = require('../tools/workflow.config.json'), ts = require(cfg.typescript.replace(/tsc\.js$/, 'typescript.js'));
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const out = cache[name] = {}, file = (name.startsWith('PC') ? 'pc/game/' : 'assets/scripts/') + name + '.ts';
  assert(fs.existsSync(file), 'PC social reward module must exist');
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:1,target:4}}).outputText,
    {exports:out,require:p=>load(p.replace('./','')),Math,Date,JSON,Set,Map,encodeURIComponent,decodeURIComponent});
  return out;
}
const M = load('PMModel'), P = load('PCSocial'), copy = x => JSON.parse(JSON.stringify(x));
const owner = '76561198000000001', friend = '76561198000000002', now = 1800000000000;
const peer = {steamId:friend,name:'旅伴',pet:M.fresh(4).pets[0]};
const base = M.act(M.fresh(42, ['fox','otter','bud']), 'challenge');
const story = s => {const out=copy(s);delete out.eggs;delete out.revision;return out;};
let social = P.newPCSocial(owner);
assert.notEqual(P.accountSaveKey(owner), P.accountSaveKey(friend));
assert.equal(P.accountSaveKey('../bad'), null);
assert.equal(P.restorePCSocial(social, friend), null, 'another account cannot load this ledger');
for (const id of ['local','0','76561197960265728','76561202255233024',owner]) {
  assert.equal(P.bondFriend(base,social,{...peer,steamId:id},now).changed,false,'invalid/self identity rejected');
}
for (const time of [null,NaN,Infinity,-1,1.5]) assert.equal(P.bondFriend(base,social,peer,time).changed,false);
assert.equal(P.bondFriend({...base,trustedTime:{version:1,lastMs:now+1}},social,peer,now).changed,false,'first bond cannot regress saved trusted clock');
assert.equal(P.bondFriend(base,P.newPCSocial('local'),peer,now).changed,false);
const granted=P.bondFriend(base,social,peer,now);
assert(granted.changed);assert.equal(granted.eggIds.length,1);assert.equal(base.eggs.length,0,'pure transaction');
assert(M.FRIEND_PET_IDS.includes(granted.game.eggs[0].affinity));
assert.deepEqual(story(granted.game),story(base),'grant does not alter ongoing story combat');
assert.equal(P.bondFriend(granted.game,granted.social,peer,now+1).changed,false,'repeated confirmation cannot grant again');
let loadedGame=M.restore(JSON.stringify(granted.game)), loadedSocial=P.restorePCSocial(JSON.stringify(granted.social),owner);
assert(loadedGame&&loadedSocial,'atomic envelope members survive restore');
assert.equal(P.bondFriend(loadedGame,loadedSocial,{...peer,name:'重新添加好友'},now+2).changed,false,'Steam friend list removal cannot clear ledger');
const invalid=copy(loadedSocial);invalid.friends.push(copy(invalid.friends[0]));
assert.equal(P.restorePCSocial(invalid,owner),null,'reject corrupt duplicate ledger rather than resetting claimed rewards');
assert.equal(P.bondFriend(granted.game,social,peer,now).changed,false,'missing side ledger cannot fabricate a fresh welcome grant');
const legacy=M.ensureSocial(base,'legacy-offline');
const withLegacy=P.bondFriend(legacy,social,peer,now);
assert.deepEqual(copy(withLegacy.game.social),copy(legacy.social),'Steam rewards preserve old postcard data');

const due=now+M.FRIEND_GIFT_INTERVAL*100;
const settled=P.settleSteamFriendGifts(loadedGame,loadedSocial,due);
assert(settled.changed);assert(settled.eggIds.length>0&&settled.eggIds.length<100);
assert.equal(settled.social.friends[0].friend.settledAt,due);
assert.equal(P.settleSteamFriendGifts(settled.game,settled.social,due).changed,false);
assert.equal(P.settleSteamFriendGifts(settled.game,settled.social,now).changed,false);
assert.equal(P.settleSteamFriendGifts(settled.game,settled.social,null).changed,false);
assert.equal(P.settleSteamFriendGifts({...loadedGame,trustedTime:{version:1,lastMs:due+1}},loadedSocial,due).changed,false);
assert.deepEqual(story(settled.game),story(base));
assert(M.restore(JSON.stringify(settled.game)));
const opposite=P.bondFriend(M.fresh(43),P.newPCSocial(friend),{steamId:owner,name:'邀请方',pet:base.pets[0]},now);
assert.equal(opposite.eggIds.length,1,'mutual completion grants exactly one on each account');

const receipt={runId:'run-1',dungeonId:'molten-crown',steamId:owner,won:true,completed:true,seed:42,participantSteamIds:[owner,friend]};
for (const patch of [{won:false},{completed:false},{steamId:friend},{participantSteamIds:[owner]},{participantSteamIds:[owner,owner]},{participantSteamIds:[owner,'local']},{seed:NaN},{dungeonId:'unknown'}]) {
  assert.equal(P.claimRaidReward(base,social,{...receipt,...patch}).changed,false,'invalid/incomplete/solo receipt cannot grant');
}
let loot=P.claimRaidReward(base,social,receipt);
assert(loot.changed);assert.equal(loot.eggIds.length,1,'first boss clear guarantees actual egg');
const egg=loot.game.eggs.find(e=>e.id===loot.eggIds[0]);
assert(!egg.friend&&!M.FRIEND_PET_IDS.includes(egg.affinity),'raid pool is separate from friend pool');
assert.equal(P.raidOriginForEgg(loot.social,egg).variantId,'molten-crown-dragon');
assert.deepEqual(story(loot.game),story(base));
loadedGame=M.restore(JSON.stringify(loot.game));loadedSocial=P.restorePCSocial(loot.social,owner);
assert(loadedGame&&loadedSocial);
assert.equal(P.claimRaidReward(loadedGame,loadedSocial,receipt).changed,false,'completion replay after reload deduplicates');
let incubated=M.startIncubation(loadedGame,egg.id,0,now);
assert(incubated.incubators[0]);assert(M.restore(JSON.stringify(incubated)));
let hatched=M.claimHatch(incubated,0,incubated.incubators[0].readyAt);
assert(hatched.pendingHatch);assert(M.restore(JSON.stringify(hatched)),'exclusive variant is a real restorable pet');
const pet=hatched.pets.find(p=>p.uid===hatched.pendingHatch.uid);
assert.equal(P.raidOriginForPet(loadedSocial,pet).variantId,'molten-crown-dragon');
assert.equal(P.raidOriginForPet(loadedSocial,base.pets[0]),null);

let wholeEggs=0;
for(let i=2;i<=21;i++) {
  const result=P.claimRaidReward(loot.game,loot.social,{...receipt,runId:'run-'+i});
  assert(result.changed);wholeEggs+=result.eggIds.length;loot=result;
}
assert.equal(loot.social.raidFragments['molten-crown'],20*P.RAID_REWARD_RULES.repeatFragments);
assert(wholeEggs>0&&wholeEggs<20,'repeat deterministic personal rolls include both outcomes');
const replay=P.claimRaidReward(loot.game,loot.social,{...receipt,runId:'run-2',seed:765});
assert.equal(replay.changed,false,'different payload cannot replay a consumed run');
const beforeFragments=loot.social.raidFragments['molten-crown'];
const redeemed=P.redeemRaidEgg(loot.game,loot.social,'molten-crown');
assert(redeemed.changed);assert.equal(redeemed.eggIds.length,1);
assert.equal(redeemed.social.raidFragments['molten-crown'],beforeFragments-P.RAID_REWARD_RULES.redeemFragments);
assert.equal(P.redeemRaidEgg(base,social,'molten-crown').changed,false,'no free fragment redemption');
assert(M.restore(JSON.stringify(redeemed.game)));assert(P.restorePCSocial(redeemed.social,owner));
console.log('PC social: account isolation, mutual bonds, trusted cycles, replay-safe loot, real variant hatching and fragment redemption passed');
