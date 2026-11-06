const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const cfg = require('../tools/workflow.config.json'), ts = require(cfg.typescript.replace(/tsc\.js$/, 'typescript.js'));
const cache = {};
function load(name) { if (cache[name]) return cache[name]; const out = cache[name] = {}; const path = `pc/game/${name}.ts`; if (fs.existsSync(path)) vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: 1, target: 4 } }).outputText, { exports: out, require: p => load(p.replace('./', '')), Math, Date, JSON, Number, Object, Array, String, Set, Map, Error, Promise, globalThis: {} }); return out; }
const { PCOnline } = load('PCOnline'), R = load('PCRaid');
assert.equal(typeof PCOnline, 'function', 'PCOnline session controller must be implemented');
const clone = x => JSON.parse(JSON.stringify(x));
const id = i => `7656119800000000${i}`;
function network(count = 2) {
  const n = { time: Date.UTC(2026, 9, 25, 12), members: [], owner: '', metadata: {}, queues: {}, controllers: [], notices: [], completed: [], bonds: [], cloud: {}, entries: [], calls: [], online: {}, drop: null, fail: '', nextRequest: 1 };
  n.snapshot = () => ({ lobbyId: n.members.length ? '109775240000000001' : '', ownerId: n.owner, members: n.members.map(steamId => ({ steamId, name: steamId })), metadata: clone(n.metadata) });
  n.emitLobby = () => n.members.forEach(who => n.queues[who].push({ type: 'lobby', ...n.snapshot() }));
  for (let i = 0; i < count; i++) {
    const who = id(i); n.queues[who] = []; n.online[who] = true; n.completed[i] = []; n.notices[i] = []; n.bonds[i] = [];
    const bridge = { poll: () => n.queues[who].splice(0), request(op, args = {}) {
      n.calls.push({ who, op, args: clone(args) });
      if (op === 'status') return { ok: true, data: { available: true, online: n.online[who], steamId: who, name: `P${i}`, appId: 5500200, overlayEnabled: true } };
      if (!n.online[who]) return { ok: false, error: 'steam_offline' };
      if (op === n.fail) return { ok: false, error: 'injected_failure' };
      if (op === 'time') return { ok: true, data: { unixSeconds: Math.floor(n.time / 1000) } };
      if (op === 'friends') return { ok: true, data: { friends: Array.from({ length: count }, (_, j) => ({ steamId: id(j), name: `P${j}`, state: 1, inGame: true, lobbyId: '109775240000000001' })).filter(f => f.steamId !== who) } };
      if (op === 'lobby.create') { n.members = [who]; n.owner = who; n.metadata = { app: 'dicekin', ...args.metadata }; n.emitLobby(); return { ok: true, data: n.snapshot() }; }
      if (op === 'lobby.join') { if (!n.members.includes(who)) n.members.push(who); n.emitLobby(); return { ok: true, data: n.snapshot() }; }
      if (op === 'lobby.get') return { ok: true, data: n.snapshot() };
      if (op === 'lobby.setData') { n.metadata[args.key] = args.value; n.emitLobby(); return { ok: true }; }
      if (op === 'lobby.leave') { n.members = n.members.filter(member => member !== who); if (n.owner === who) n.owner = n.members[0] || ''; n.emitLobby(); return { ok: true }; }
      if (op === 'message.send') { if (!n.members.includes(args.steamId)) return { ok: false, error: 'not_member' }; if (!n.drop || !n.drop(who, args.steamId, args.payload)) n.queues[args.steamId].push({ type: 'message', steamId: who, payload: clone(args.payload) }); return { ok: true }; }
      if (op === 'cloud.write') { n.cloud[args.name] = args.content; return { ok: true }; }
      if (op === 'cloud.share') { n.shared = { content: n.cloud[args.name], ownerId: who }; return { ok: true, data: { handle: '1234567' } }; }
      if (op === 'leaderboard.upload') { n.entries = [{ steamId: who, name: who, rank: 1, score: args.score, details: args.details, ugcHandle: args.ugcHandle }]; return { ok: true, data: { score: args.score, rank: 1, changed: true } }; }
      if (op === 'leaderboard.query') return { ok: true, data: { entries: clone(n.entries) } };
      if (op === 'ugc.read') return { ok: true, data: clone(n.sharedByHandle?.[args.handle] || n.shared) };
      if (op === 'overlay.invite') return { ok: true };
      return { ok: false, error: `unknown_${op}` };
    } };
    const immediate = bridge.request;
    bridge.request = (op, args) => { const result = immediate(op, args); if (result.ok && n.asyncOps?.includes(op)) { const requestId = n.nextRequest++; n.queues[who].push({ type: 'result', op, requestId, ...result }); return { ok: true, requestId }; } return result; };
    n.controllers.push(new PCOnline({ bridge, now: () => n.time, getProfile: () => n.profileOverrides?.[who] || ({ pet: { id: 'fox', uid: `pet${i}`, sex: 'male', rarity: 'normal', faces: [5, 5, 5] }, loadout: { steamId: who, name: `P${i}`, pets: [{ uid: `pet${i}`, species: 'fox', maxHP: 100, faces: [5, 5, 5] }] } }), onChange() {}, onNotice: text => n.notices[i].push(text), onBond: peer => { n.bonds[i].push(peer.steamId); return true; }, onComplete: state => n.completed[i].push(clone(state)), canJoin: () => n.canJoin?.[who] !== false }));
  }
  n.pump = async (times = 12) => { for (let turn = 0; turn < times; turn++) { n.controllers.forEach(c => c.tick()); await Promise.resolve(); } };
  n.room = async () => { await n.controllers[0].createRoom(); for (let i = 1; i < count; i++) await n.controllers[i].join('109775240000000001'); await n.pump(); n.controllers.forEach(c => c.setReady(true)); await n.pump(); };
  return n;
}
let groups = 0;
async function test(name, fn) { await fn(); groups++; console.log(`PASS ${name}`); }
(async () => {
  await test('independent controllers agree on every round and release completion only once', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers;
    host.startRaid(); await n.pump(); assert.equal(host.phase, 'planning'); assert.equal(peer.phase, 'planning');
    let turns = 0;
    while (host.phase !== 'complete' && turns++ < 30) {
      for (const c of n.controllers) c.submit({ steamId: c.status.steamId, round: c.raid.round, kind: 'attack' });
      await n.pump(); assert.equal(R.stateHash(host.raid), R.stateHash(peer.raid));
    }
    assert.equal(host.raid.status, 'won'); assert.equal(n.completed[0].length, 1); assert.equal(n.completed[1].length, 1);
    await n.pump(); assert.equal(n.completed[0].length, 1); assert.equal(n.completed[1].length, 1);
  });
  await test('missing start ACK cannot release a round; foreign identity and stale packets cannot choose a player action', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers;
    n.drop = (from, to, message) => from === id(1) && message.type === 'ack';
    host.startRaid(); await n.pump(); assert.equal(host.phase, 'confirming'); assert.equal(peer.phase, 'confirming'); assert.equal(n.completed[0].length, 0);
    n.queues[id(0)].push({ type: 'message', steamId: '76561198000000999', payload: { version: R.RAID_VERSION, lobbyId: host.lobby.lobbyId, type: 'ack', runId: host.raid.runId, hash: R.stateHash(host.raid), stage: 'start', round: 0 } });
    await n.pump(); assert.equal(host.phase, 'confirming');
  });
  await test('a prepared player entering a story battle cannot be pulled into a host-started raid', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers; n.canJoin = { [id(1)]: false };
    host.startRaid(); await n.pump(); assert.equal(peer.raid, null); assert.equal(host.raid, null); assert.equal(n.completed[0].length, 0); assert.equal(n.completed[1].length, 0);
  });
  await test('session identifiers stay unique when the same account restarts at the same monotonic time', async () => {
    const first = network(1), second = network(1); first.time = second.time = 1000;
    first.controllers[0].startSolo(1); second.controllers[0].startSolo(1);
    assert.notEqual(first.controllers[0].raid.runId, second.controllers[0].raid.runId, 'reward receipts cannot reuse a prior process run ID');
  });
  await test('winning round waits for every ACK and duplicate authentic ACK never pays twice', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers; host.startRaid(); await n.pump();
    n.drop = (from, to, message) => from === id(1) && message.type === 'ack' && peer.raid?.status === 'won';
    let turns = 0; while (host.phase === 'planning' && turns++ < 30) { n.controllers.forEach(c => c.submit({ steamId: c.status.steamId, round: c.raid.round, kind: 'attack' })); await n.pump(); }
    assert.equal(host.raid.status, 'won'); assert.equal(host.phase, 'confirming'); assert.equal(n.completed[0].length, 0); assert.equal(n.completed[1].length, 0);
    const ack = n.calls.filter(call => call.who === id(1) && call.op === 'message.send' && call.args.payload.type === 'ack').at(-1).args.payload;
    n.queues[id(0)].push({ type: 'message', steamId: id(1), payload: clone(ack) }); await n.pump();
    assert.equal(n.completed[0].length, 1); assert.equal(n.completed[1].length, 1);
    n.queues[id(0)].push({ type: 'message', steamId: id(1), payload: clone(ack) }); await n.pump(); assert.equal(n.completed[0].length, 1);
  });
  await test('a connected peer withholding ACK cannot hang or receive an unfinished reward indefinitely', async () => {
    const n = network(); await n.room(); const host = n.controllers[0];
    n.drop = (from, to, message) => from === id(1) && message.type === 'ack'; host.startRaid(); await n.pump();
    for (let i = 0; i < 40; i++) { n.time += 2000; await n.pump(); }
    assert.equal(host.raid, null); assert.equal(n.completed[0].length, 0); assert.equal(n.completed[1].length, 0);
  });
  await test('mutual friend consent and nonce replay protection grant bonds once on each account', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers;
    host.offerBond(id(1)); await n.pump(); assert(peer.pendingBond); assert.equal(n.bonds[0].length, 0); assert.equal(n.bonds[1].length, 0);
    const pending = clone(peer.pendingBond); peer.acceptBond(); await n.pump(); assert.deepEqual(n.bonds, [[id(1)], [id(0)]]);
    n.queues[id(0)].push({ type: 'message', steamId: id(1), payload: { version: R.RAID_VERSION, lobbyId: host.lobby.lobbyId, type: 'bondAccept', nonce: pending.nonce } });
    await n.pump(); assert.deepEqual(n.bonds, [[id(1)], [id(0)]]);
  });
  await test('host exit aborts; missing member pauses then times out without rewards', async () => {
    let n = network(); await n.room(); n.controllers[0].startRaid(); await n.pump();
    n.members = [id(1)]; n.owner = id(1); n.emitLobby(); await n.pump(); assert.equal(n.controllers[1].raid, null); assert.equal(n.completed[1].length, 0);
    n = network(); await n.room(); n.controllers[0].startRaid(); await n.pump(); n.members = [id(0)]; n.emitLobby(); await n.pump(); assert.equal(n.controllers[0].phase, 'paused');
    n.time += 61000; await n.pump(); assert.equal(n.controllers[0].raid, null); assert.equal(n.completed[0].length, 0);
  });
  await test('same Steam member reconnects through replay snapshot; ranked defaults and normal unlimited preparation differ', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers; host.startRaid(); await n.pump();
    const before = R.stateHash(host.raid); n.members = [id(0)]; n.emitLobby(); await n.pump(); assert.equal(host.phase, 'paused');
    n.members.push(id(1)); n.emitLobby(); n.time += 2000; await n.pump(); assert.equal(host.phase, 'planning'); assert.equal(peer.phase, 'planning'); assert.equal(R.stateHash(host.raid), before); assert.equal(R.stateHash(peer.raid), before);
    n.time += 31000; await n.pump(); assert.equal(host.raid.roundsCompleted, 0, 'normal room has no action countdown');
    assert.equal(host.planningSeconds(), null, 'normal rooms have no countdown');
    const solo = network(1), c = solo.controllers[0]; c.ranked = true; c.startSolo(1); assert.equal(c.planningSeconds(), 30); solo.time += 1001; assert.equal(c.planningSeconds(), 29); solo.time += 30000; assert.equal(c.planningSeconds(), 0); await solo.pump(); assert.equal(c.raid.roundsCompleted, 1, 'ranked timeout defends'); assert.equal(c.planningSeconds(), 30, 'next round shares the new real deadline');
  });
  await test('reconnect cannot replace already acknowledged history even with a self-consistent replay', async () => {
    const n = network(); await n.room(); const [host, peer] = n.controllers; host.startRaid(); await n.pump();
    n.controllers.forEach(c => c.submit({ steamId: c.status.steamId, round: c.raid.round, kind: 'attack' })); await n.pump();
    let changed = R.createRaid(peer.raid.initial); changed = R.resolveRound(changed, R.defaultRaidActions(changed)); peer.phase = 'paused';
    n.queues[id(1)].push({ type: 'message', steamId: id(0), payload: { version: R.RAID_VERSION, lobbyId: host.lobby.lobbyId, type: 'snapshot', runId: changed.runId, transferId: 'forged-recovery', index: 0, total: 1, data: R.serializeRaid(changed), hash: R.stateHash(changed), ranked: false } });
    await n.pump(); assert.equal(peer.raid, null, 'a different acknowledged first round must abort'); assert.equal(n.completed[1].length, 0);
  });
  await test('three and four separate Steam players all acknowledge the same fixed-count encounter', async () => {
    for (const count of [3, 4]) { const n = network(count); await n.room(); const host = n.controllers[0]; host.startRaid(); await n.pump(); assert(n.controllers.every(c => c.phase === 'planning')); n.controllers.forEach(c => c.submit({ steamId: c.status.steamId, round: 1, kind: 'attack' })); await n.pump(); assert(n.controllers.every(c => c.raid.playerCount === count && R.stateHash(c.raid) === R.stateHash(host.raid))); }
  });
  await test('bridge request IDs settle through tick; Overlay and account changes reach UI without switching an active save', async () => {
    const n = network(); n.asyncOps = ['lobby.create']; const [host] = n.controllers;
    const opening = host.createRoom(); await n.pump(); await opening; assert(host.lobby);
    n.queues[id(0)].push({ type: 'overlay', active: true }); await n.pump(); assert.equal(host.overlayActive, true);
    n.queues[id(0)].push({ type: 'overlay', active: false }); await n.pump(); assert.equal(host.overlayActive, false);
    n.queues[id(0)].push({ type: 'status', available: true, online: true, steamId: id(1), name: 'Changed account', appId: 5500200, overlayEnabled: true }); await n.pump();
    assert(n.notices[0].some(text => text.includes('账号') && text.includes('重启'))); host.startSolo(1); assert.equal(host.raid, null);
  });
  await test('late lobby creation callback cannot reopen a room after the player leaves', async () => {
    const n = network(); n.asyncOps = ['lobby.create']; const c = n.controllers[0], opening = c.createRoom(); c.leave(); await n.pump(); await opening; assert.equal(c.lobby, null);
  });
  await test('changed loadout clears the entire party readiness and synchronizes the replacement snapshot', async () => {
    const n = network(); await n.room(); const host = n.controllers[0];
    n.profileOverrides = { [id(0)]: clone(host.profiles[id(0)]) }; n.profileOverrides[id(0)].loadout.pets[0].faces = [6, 6, 6]; host.refreshProfile(); await n.pump();
    assert(n.controllers.every(c => Object.values(c.ready).every(value => !value)), 'nobody remains ready against an old team roster');
    assert.equal(n.controllers[1].profiles[id(0)].loadout.pets[0].faces[0], 6);
  });
  await test('ranked solo uses Steam season, uploads a verifiable roster and exposes upload failure', async () => {
    const n = network(1), c = n.controllers[0]; c.ranked = true; c.startSolo(1);
    let turns = 0; while (c.phase === 'planning' && turns++ < 30) c.submit({ steamId: id(0), round: c.raid.round, kind: 'attack' });
    await n.pump(); assert.equal(c.raid.status, 'won'); assert(n.calls.some(call => call.op === 'leaderboard.upload'));
    await c.queryBoard(1, 'global'); assert.equal(c.boardEntries.length, 1); await c.readEntry(c.boardEntries[0]); assert(c.selectedReplay); assert.equal(R.stateHash(c.selectedReplay), R.stateHash(c.raid));
    n.shared.ownerId = id(1); await c.readEntry(c.boardEntries[0]); assert.equal(c.selectedReplay, null); assert(c.boardError);
    const failed = network(1); failed.fail = 'cloud.write'; const f = failed.controllers[0]; f.ranked = true; f.startSolo(1); turns = 0;
    while (f.phase === 'planning' && turns++ < 30) f.submit({ steamId: id(0), round: f.raid.round, kind: 'attack' });
    await failed.pump(); const basic = failed.calls.filter(call => call.op === 'leaderboard.upload'); assert.equal(basic.length, 1, 'cloud quota failure must not disable the independent Steam leaderboard'); assert.equal(basic[0].args.ugcHandle, undefined); assert(failed.notices[0].some(text => text.includes('成绩已提交') && text.includes('阵容详情暂不可用')));
    await f.queryBoard(1, 'global'); await f.readEntry(f.boardEntries[0]); assert.equal(f.selectedReplay, null); assert(f.boardError.includes('尚无'));
  });
  await test('successive roster selections ignore out-of-order responses and clear previous errors', async () => {
    const n = network(), rows = [], files = {};
    for (let index = 0; index < 2; index++) {
      const c = n.controllers[index]; c.ranked = true; c.startSolo(index + 1); let turns = 0;
      while (c.phase === 'planning' && turns++ < 30) c.submit({ steamId: c.status.steamId, round: c.raid.round, kind: 'attack' });
      await n.pump(); const handle = String(100 + index); rows.push({ ...clone(n.entries[0]), ugcHandle: handle }); files[handle] = clone(n.shared);
    }
    n.entries = rows; n.sharedByHandle = files; const reader = n.controllers[0]; reader.lastError = 'old query error'; await reader.queryBoard(1, 'global'); assert.equal(reader.lastError, '');
    n.asyncOps = ['ugc.read']; reader.lastError = 'old detail error'; const first = reader.readEntry(reader.boardEntries[0]), second = reader.readEntry(reader.boardEntries[1]); assert.equal(reader.lastError, '');
    n.queues[id(0)].reverse(); await n.pump(); await Promise.all([first, second]); assert(reader.selectedReplay); assert.equal(reader.selectedReplay.runId, n.controllers[1].raid.runId); assert.equal(reader.boardBusy, false);
  });
  await test('offline solo stays playable and cannot create a lobby or rank', async () => {
    const notices = [], completions = []; const c = new PCOnline({ bridge: { request: op => op === 'status' ? { ok: true, data: { available: false, online: false, steamId: '', name: '', appId: 5500200, overlayEnabled: false } } : { ok: false, error: 'steam_unavailable' }, poll: () => [] }, getProfile: () => ({ pet: {}, loadout: { steamId: 'local', name: 'Local', pets: [{ uid: 'a', species: 'fox', maxHP: 100, faces: [100] }] } }), onChange() {}, onNotice: x => notices.push(x), onBond: () => false, onComplete: s => completions.push(s), canJoin: () => true });
    c.ranked = true; c.startSolo(1); assert.equal(c.ranked, false); assert.equal(c.raid.players[0].steamId, 'local'); c.submit({ steamId: 'local', round: 1, kind: 'attack' }); assert.equal(c.phase, 'complete'); assert.equal(completions.length, 1);
    await c.createRoom(); assert.equal(c.lobby, null); assert(notices.length > 0);
  });
  console.log(`PASS ${groups} PC online controller groups.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
