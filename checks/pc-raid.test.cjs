const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const cfg = require('../tools/workflow.config.json');
const ts = require(cfg.typescript.replace(/tsc\.js$/, 'typescript.js'));
const source = 'pc/game/PCRaid.ts';
const R = {};
if (fs.existsSync(source)) vm.runInNewContext(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: 1, target: 4 } }).outputText, { exports: R, Math, JSON, Number, Object, Array, String, Set, Map, Error });
assert.equal(typeof R.createRaid, 'function', 'raid creation must be implemented');
const clone = value => JSON.parse(JSON.stringify(value));
const id = i => `7656119800000000${i}`;
const pet = (uid, hp = 30, face = 5) => ({ uid, species: 'fox', name: 'Fox', maxHP: hp, faces: [face, face, face] });
const input = (count = 2, options = {}) => ({ runId: 'raid-test', seed: 123456, tier: 1, seasonId: 's1', players: Array.from({ length: count }, (_, i) => ({ steamId: id(i), name: `P${i}`, pets: [pet(`p${i}a`), pet(`p${i}b`), pet(`p${i}c`)] })), ...options });
const action = (state, slot, kind, extra = {}) => ({ steamId: state.players[slot].steamId, round: state.round, kind, ...extra });
const actions = (state, kind = 'attack') => state.players.filter(p => p.pets.some(x => x.hp > 0)).map(p => action(state, p.slot, p.pets[p.activePet].hp ? kind : 'switch', p.pets[p.activePet].hp ? {} : { petIndex: p.pets.findIndex(x => x.hp > 0) }));
let groups = 0;
function test(name, fn) { fn(); groups++; console.log(`PASS ${name}`); }

test('1–4 fixed player slots, stable SteamID order, immutable loadouts and bounded data', () => {
  for (let n = 1; n <= 4; n++) {
    const data = input(n); data.players.reverse(); const before = clone(data); const state = R.createRaid(data);
    assert.equal(state.players.length, n); assert.equal(state.playerCount, n);
    assert.equal(state.round, 1); assert.equal(state.status, 'planning');
    assert.equal(state.players[0].steamId, id(0)); assert.deepEqual(data, before);
    data.players[0].pets[0].faces[0] = 99; assert.equal(state.players[n - 1].pets[0].faces[0], 5);
    assert(state.players.every(p => p.die === 5));
  }
  assert.equal(R.createRaid(input(1, { players: [{ steamId: 'local', name: 'Local', pets: [pet('a')] }] })).players[0].steamId, 'local');
  for (const data of [input(0), input(5), input(2, { tier: 0 }), input(2, { tier: 1001 }), input(2, { seed: NaN }), input(2, { seed: -1 })]) assert.throws(() => R.createRaid(data));
  const duplicate = input(); duplicate.players[1].steamId = duplicate.players[0].steamId; assert.throws(() => R.createRaid(duplicate));
  const localPair = input(); localPair.players[0].steamId = 'local'; assert.throws(() => R.createRaid(localPair));
  for (const corrupt of [p => p.maxHP = Infinity, p => p.maxHP = 201, p => p.faces = [], p => p.faces = [0], p => p.faces = [101], p => p.faces = [1.5]]) {
    const data = input(); corrupt(data.players[0].pets[0]); assert.equal(R.validateLoadout(data.players).ok, false); assert.throws(() => R.createRaid(data));
  }
  const duplicatePet = input(); duplicatePet.players[0].pets[1].uid = duplicatePet.players[0].pets[0].uid; assert.throws(() => R.createRaid(duplicatePet));
});

test('simultaneous order independence, stable dice, complete event snapshots and immutable round resolution', () => {
  const state = R.createRaid(input(4)); const before = clone(state); const plans = actions(state);
  const one = R.resolveRound(state, plans), two = R.resolveRound(clone(state), [...plans].reverse());
  assert.deepEqual(clone(one), clone(two)); assert.deepEqual(clone(state), before);
  assert.equal(one.round, 2); assert.equal(one.history.length, 1); assert.equal(one.history[0].dice.length, 4);
  const hit = one.lastEvents.find(e => e.kind === 'attack'); assert(hit.amount > 0); assert.equal(hit.hpBefore - hit.hpAfter, hit.amount);
  assert.equal(one.history[0].hash, R.stateHash(one));
});

test('reject stale, duplicate, missing, unknown and illegal target plans before changing state', () => {
  const state = R.createRaid(input()); const before = R.stateHash(state);
  assert.equal(R.validateAction(state, action(state, 0, 'attack', { round: 0 })).ok, false);
  for (const malformed of [{ targetId: '' }, { targetId: 0 }, { targetSteamId: '' }, { targetSteamId: 0 }]) {
    const kind = 'targetId' in malformed ? 'attack' : 'heal';
    assert.equal(R.validateAction(state, action(state, 0, kind, malformed)).ok, false, 'malformed target cannot silently default');
  }
  for (const bad of [[action(state, 0, 'attack', { round: 0 }), action(state, 1, 'attack')], [action(state, 0, 'attack'), action(state, 0, 'guard')], [action(state, 0, 'attack')], [action(state, 0, 'attack', { targetId: 'missing' }), action(state, 1, 'attack')], [action(state, 0, 'heal', { targetSteamId: 'stranger' }), action(state, 1, 'attack')], [action(state, 0, 'switch', { petIndex: 9 }), action(state, 1, 'attack')], [action(state, 0, 'attack', { kind: 'invented' }), action(state, 1, 'attack')]]) assert.throws(() => R.resolveRound(state, bad));
  assert.equal(R.stateHash(state), before);
});

test('damage and support generate per-enemy threat, taunt attracts bite, switching preserves threat and wounds', () => {
  let state = R.createRaid(input());
  state = R.resolveRound(state, [action(state, 0, 'attack'), action(state, 1, 'taunt')]);
  const damage = state.lastEvents.find(e => e.kind === 'damage' && e.actorId === 'boss'); assert.equal(damage.targetId, id(1));
  assert(state.enemies[0].threat[1] > state.enemies[0].threat[0]);
  const oldThreat = state.enemies[0].threat[1], injured = state.players[1].pets[0].hp;
  state = R.resolveRound(state, [action(state, 0, 'guard'), action(state, 1, 'switch', { petIndex: 1 })]);
  assert.equal(state.enemies[0].threat[1], oldThreat); assert.equal(state.players[1].pets[0].hp, injured);
  assert(state.enemies[0].threat[0] > 7, 'guard gains threat');
  state = R.resolveRound(state, [action(state, 0, 'heal', { targetSteamId: id(1) }), action(state, 1, 'guard')]);
  assert(state.players[1].pets[0].hp === injured, 'healing active pet does not resurrect or heal reserve');
  state = R.resolveRound(state, [action(state, 0, 'guard'), action(state, 1, 'switch', { petIndex: 0 })]);
  assert(state.players[1].pets[0].hp <= injured, 'switch does not refill health');
});

test('AOE is telegraphed a round ahead, ignores taunt and guard protects an ally', () => {
  let state = R.createRaid(input(3));
  state = R.resolveRound(state, actions(state, 'guard'));
  assert.equal(state.bossIntent.kind, 'charge'); assert.equal(state.nextBossIntent.kind, 'aoe');
  state = R.resolveRound(state, actions(state, 'guard')); assert.equal(state.bossIntent.kind, 'aoe');
  const before = state.players.map(p => p.pets[p.activePet].hp);
  state = R.resolveRound(state, [action(state, 0, 'taunt'), action(state, 1, 'guard', { targetSteamId: id(2) }), action(state, 2, 'attack')]);
  const damage = state.lastEvents.filter(e => e.kind === 'damage' && e.actorId === 'boss'); assert.equal(damage.length, 3);
  assert(before[0] > state.players[0].pets[0].hp); assert(before[1] > state.players[1].pets[0].hp);
  assert.equal(before[2], state.players[2].pets[0].hp, 'ally shield absorbs the telegraphed breath');
  state = R.resolveRound(state, actions(state, 'guard')); assert(state.enemies.some(e => e.kind === 'minion'));
  const minion = state.enemies.find(e => e.kind === 'minion'); assert.equal(minion.threat.length, 3);
  state = R.resolveRound(state, [action(state, 0, 'boost'), action(state, 1, 'attack', { targetId: minion.id }), action(state, 2, 'attack')]);
  assert.equal(state.lastEvents.find(e => e.kind === 'damage' && e.actorId === 'boss').targetId, id(0), 'AOE does not consume the next-single-target taunt');
  assert.equal(state.lastEvents.find(e => e.kind === 'damage' && e.actorId === minion.id).targetId, id(1), 'minion uses its own threat table');
});

test('effective healing gains threat, overheal does not; dead pets cannot return; reserves require a switch', () => {
  let state = R.createRaid(input()); state.players[1].pets[0].hp -= 10;
  state = R.resolveRound(state, [action(state, 0, 'heal', { targetSteamId: id(1) }), action(state, 1, 'guard')]);
  assert(state.lastEvents.find(e => e.kind === 'heal').amount > 0); assert(state.enemies[0].threat[0] > 0);
  let full = R.createRaid(input()); full = R.resolveRound(full, [action(full, 0, 'heal'), action(full, 1, 'guard')]); assert.equal(full.enemies[0].threat[0], 0);
  state = R.createRaid(input()); state.players[0].pets[0].hp = 0; state.deaths = 1;
  assert.equal(R.validateAction(state, action(state, 0, 'attack')).ok, false);
  assert.equal(R.defaultRaidActions(state).find(a => a.steamId === id(0)).kind, 'switch');
  state = R.resolveRound(state, R.defaultRaidActions(state)); assert.equal(state.players[0].activePet, 1);
  assert.equal(R.validateAction(state, action(state, 0, 'switch', { petIndex: 0 })).ok, false);
  assert.equal(state.players[0].pets[0].hp, 0);
});

test('switch event exposes the replacement health before later enemy damage', () => {
  let state = R.createRaid(input()); state.enemies[0].threat[1] = 100;
  state = R.resolveRound(state, [action(state, 0, 'guard'), action(state, 1, 'switch', { petIndex: 1 })]);
  const event = state.lastEvents.find(e => e.kind === 'switch');
  assert.equal(event.targetId, id(1)); assert.equal(event.hpAfter, 30); assert(state.players[1].pets[1].hp < event.hpAfter);
});

test('enrage, defeat and bounded solo/2/3/4-player completion', () => {
  let enraged = R.createRaid(input()); enraged.enemies[0].hp = Math.floor(enraged.enemies[0].maxHP * .3);
  enraged = R.resolveRound(enraged, actions(enraged, 'guard')); assert(enraged.enemies[0].enraged); assert(enraged.lastEvents.some(e => e.kind === 'enrage'));
  let doomed = R.createRaid(input(1, { players: [{ steamId: id(0), name: 'Solo', pets: [pet('fragile', 1, 1)] }] }));
  doomed = R.resolveRound(doomed, actions(doomed)); assert.equal(doomed.status, 'lost'); assert.equal(doomed.deaths, 1); assert.equal(R.scoreRaid(doomed), 0); assert.throws(() => R.resolveRound(doomed, []));
  for (let n = 1; n <= 4; n++) {
    let state = R.createRaid(input(n)), turns = 0;
    while (state.status === 'planning' && turns++ < 100) state = R.resolveRound(state, actions(state));
    assert.equal(state.status, 'won', `${n} players can clear tier one with existing moderate pets`); assert(state.roundsCompleted < 30); assert(R.scoreRaid(state) > 0);
  }
});

test('raid potion stocks are isolated, finite and boost is consumed by the next attack', () => {
  const data = input(); const before = clone(data);
  let state = R.createRaid(data);
  assert(state.players[0].stocks, 'raid players have independent potion stocks');
  assert.deepEqual(clone(state.players[0].stocks), { heals: 3, boosts: 2 });
  state = R.resolveRound(state, [action(state, 0, 'boost'), action(state, 1, 'guard')]);
  assert.equal(state.players[0].stocks.boosts, 1); assert.equal(state.players[0].boost, 5);
  assert(state.lastEvents.some(e => e.kind === 'boost'));
  state = R.resolveRound(state, [action(state, 0, 'attack'), action(state, 1, 'guard')]);
  assert.equal(state.lastEvents.find(e => e.kind === 'attack').amount, 12); assert.equal(state.players[0].boost, 0);
  state = R.resolveRound(state, [action(state, 0, 'boost'), action(state, 1, 'guard')]);
  assert.equal(R.validateAction(state, action(state, 0, 'boost')).ok, false);
  for (let i = 0; i < 3; i++) state = R.resolveRound(state, [action(state, 0, 'heal'), action(state, 1, 'guard')]);
  assert.equal(state.players[0].stocks.heals, 0); assert.equal(R.validateAction(state, action(state, 0, 'heal')).ok, false);
  assert.deepEqual(data, before, 'raid use never mutates caller pet or main-run data');
});

test('ranking is tier first, then fewer rounds, then fewer deaths; local trials never rank', () => {
  const strong = count => input(count, { players: Array.from({ length: count }, (_, i) => ({ steamId: id(i), name: `P${i}`, pets: [pet(`s${i}`, 200, 100)] })) });
  let fast = R.createRaid(strong(1)); fast = R.resolveRound(fast, actions(fast));
  let slower = R.createRaid(strong(1)); slower = R.resolveRound(slower, actions(slower, 'guard')); slower = R.resolveRound(slower, actions(slower));
  assert(R.scoreRaid(fast) > R.scoreRaid(slower));
  let higher = R.createRaid({ ...strong(1), tier: 2 }); higher = R.resolveRound(higher, actions(higher, 'guard')); higher = R.resolveRound(higher, actions(higher));
  assert(R.scoreRaid(higher) > R.scoreRaid(fast));
  const deathTie = clone(fast); deathTie.deaths = 1; assert(R.scoreRaid(fast) > R.scoreRaid(deathTie));
  const upper = clone(fast); upper.tier = 1000; assert(R.scoreRaid(upper) <= 2147483647);
  const local = strong(1); local.players[0].steamId = 'local'; let offline = R.createRaid(local); offline = R.resolveRound(offline, actions(offline)); assert.equal(R.scoreRaid(offline), 0);
});

test('portable replay, snapshot restoration and hash verification reject tampering and version mismatches', () => {
  let state = R.createRaid(input(4)); for (let i = 0; i < 5; i++) state = R.resolveRound(state, actions(state));
  const replay = R.exportRaidReplay(state), text = R.serializeRaid(state);
  assert.deepEqual(clone(R.replayRaid(replay)), clone(state)); assert.equal(R.stateHash(R.deserializeRaid(text)), R.stateHash(state));
  const changed = clone(replay); changed.rounds[0].actions[0].kind = 'guard'; assert.throws(() => R.replayRaid(changed));
  const version = clone(replay); version.version = 'unknown'; assert.throws(() => R.replayRaid(version));
  const stale = clone(replay); stale.rounds[0].actions[0].round = 0; assert.throws(() => R.replayRaid(stale));
  assert.throws(() => R.deserializeRaid('{broken')); assert.throws(() => R.deserializeRaid('{}'));
  const copy = clone(state); copy.players[0].pets[0].hp--; assert.notEqual(R.stateHash(copy), R.stateHash(state));
});
console.log(`PASS ${groups} PC raid rule groups.`);
