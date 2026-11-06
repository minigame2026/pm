/** PC-only deterministic raid rules. No clock, networking, rewards or engine dependencies. */
export const RAID_VERSION = 'dicekin-raid-v2-food';
export const RAID_MAX_TIER = 1000;
export const RAID_MAX_ROUNDS = 999;

export interface RaidValidation { ok: boolean; error?: string }
export interface RaidPetSnapshot {
  uid: string; species: string; name?: string; maxHP: number; faces: number[]; artKey?: string;
  food?:{attack:number;defense:number;heal:number;health:number};
}
export interface RaidPlayerInput { steamId: string; name: string; pets: RaidPetSnapshot[]; activePet?: number }
export interface RaidCreateInput {
  runId: string; seed: number; tier: number; seasonId?: string; bossArtKey?: string; players: RaidPlayerInput[];
}
export interface RaidPet extends RaidPetSnapshot { hp: number }
export interface RaidPlayer {
  slot: number; steamId: string; name: string; pets: RaidPet[]; activePet: number; die: number; guard: number;
  stocks: { heals: number; boosts: number }; boost: number;
}
export type RaidActionKind = 'attack' | 'guard' | 'heal' | 'boost' | 'taunt' | 'switch';
export interface RaidAction {
  steamId: string; round: number; kind: RaidActionKind; targetId?: string; targetSteamId?: string; petIndex?: number;
}
export interface RaidIntent { kind: 'bite' | 'charge' | 'aoe' | 'summon' | 'claw'; label: string; targetSteamId?: string }
export interface RaidEnemy {
  id: string; kind: 'boss' | 'minion'; name: string; artKey?: string; hp: number; maxHP: number;
  attack: number; threat: number[]; intent: RaidIntent; enraged: boolean; tauntedBy?: number;
}
export interface RaidEvent {
  kind: 'attack' | 'guard' | 'heal' | 'boost' | 'taunt' | 'switch' | 'damage' | 'death' | 'summon' | 'enrage' | 'charge' | 'win' | 'lose';
  actorId: string; targetId?: string; amount?: number; hpBefore?: number; hpAfter?: number; petIndex?: number; text: string;
}
export interface RaidRoundRecord {
  round: number; actions: RaidAction[]; dice: { steamId: string; value: number }[]; events: RaidEvent[]; hash: string;
}
export interface RaidState {
  version: string; runId: string; seed: number; rng: number; tier: number; seasonId: string; playerCount: number;
  initial: RaidCreateInput; players: RaidPlayer[]; enemies: RaidEnemy[]; round: number; roundsCompleted: number;
  status: 'planning' | 'won' | 'lost'; deaths: number; bossIntent: RaidIntent; nextBossIntent: RaidIntent;
  history: RaidRoundRecord[]; lastEvents: RaidEvent[];
}
export interface RaidReplay {
  version: string; initial: RaidCreateInput; rounds: { round: number; actions: RaidAction[]; hash: string }[]; hash: string;
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const integer = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const boundedText = (value: unknown, max = 64): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
const key = (value: unknown): value is string => boundedText(value, 96) && /^[A-Za-z0-9:_-]+$/.test(value);
const alive = (player: RaidPlayer) => player.pets.some(pet => pet.hp > 0);
const current = (player: RaidPlayer) => player.pets[player.activePet];
const fail = (message: string): never => { throw new Error(message); };

/** Validates a lobby loadout before its stats become an immutable encounter snapshot. */
export function validateLoadout(players: unknown): RaidValidation {
  if (!Array.isArray(players) || players.length < 1 || players.length > 4) return { ok: false, error: '副本需要1至4位玩家' };
  const identities = new Set<string>();
  for (const player of players) {
    if (!player || typeof player !== 'object' || !((players.length === 1 && player.steamId === 'local') || (typeof player.steamId === 'string' && /^\d{17}$/.test(player.steamId)))) return { ok: false, error: 'Steam身份无效' };
    if (identities.has(player.steamId)) return { ok: false, error: '玩家身份重复' };
    identities.add(player.steamId);
    if (!boundedText(player.name) || !Array.isArray(player.pets) || player.pets.length < 1 || player.pets.length > 3) return { ok: false, error: '每人需要1至3只伙伴' };
    if (player.activePet !== undefined && !integer(player.activePet, 0, player.pets.length - 1)) return { ok: false, error: '出场伙伴无效' };
    const petIds = new Set<string>();
    for (const pet of player.pets) {
      if (!pet || !boundedText(pet.uid, 96) || !key(pet.species) || petIds.has(pet.uid) || !integer(pet.maxHP, 1, 200) || !Array.isArray(pet.faces) || pet.faces.length < 1 || pet.faces.length > 6 || !pet.faces.every((face: unknown) => integer(face, 1, 100))) return { ok: false, error: '伙伴生命或骰面无效' };
      if ((pet.name !== undefined && !boundedText(pet.name)) || (pet.artKey !== undefined && !key(pet.artKey))) return { ok: false, error: '伙伴显示资料无效' };
      if(pet.food!==undefined&&(!pet.food||typeof pet.food!=='object'||Array.isArray(pet.food)||Object.keys(pet.food).length!==4||!integer(pet.food.attack,0,24)||!integer(pet.food.defense,0,24)||!integer(pet.food.heal,0,40)||!integer(pet.food.health,0,24)))return {ok:false,error:'料理效果快照无效'};
      petIds.add(pet.uid);
    }
  }
  return { ok: true };
}

function normalizeInput(input: RaidCreateInput): RaidCreateInput {
  if (!input || typeof input !== 'object' || !key(input.runId) || !integer(input.seed, 0, 0xffffffff) || !integer(input.tier, 1, RAID_MAX_TIER)) fail('副本场次、种子或阶层无效');
  const checked = validateLoadout(input.players);
  if (!checked.ok) fail(checked.error!);
  if ((input.seasonId !== undefined && !key(input.seasonId)) || (input.bossArtKey !== undefined && !key(input.bossArtKey))) fail('副本赛季或图像资料无效');
  const players = input.players.map(player => ({
    steamId: player.steamId, name: player.name, activePet: player.activePet || 0,
    pets: player.pets.map(pet => ({ uid: pet.uid, species: pet.species, maxHP: pet.maxHP, faces: [...pet.faces], ...(pet.name ? { name: pet.name } : {}), ...(pet.artKey ? { artKey: pet.artKey } : {}),...(pet.food?{food:{...pet.food}}:{}) }))
  })).sort((a, b) => a.steamId < b.steamId ? -1 : a.steamId > b.steamId ? 1 : 0);
  return { runId: input.runId, seed: input.seed, tier: input.tier, seasonId: input.seasonId || 's1', ...(input.bossArtKey ? { bossArtKey: input.bossArtKey } : {}), players };
}

function nextRandom(state: RaidState): number {
  let value = state.rng | 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  state.rng = value >>> 0;
  return state.rng;
}

function rollPlayers(state: RaidState): void {
  // Consume one draw for every original slot, including defeated slots, so disconnects cannot change rolls.
  for (const player of state.players) {
    const faces = current(player).faces;
    player.die = faces[nextRandom(state) % faces.length];
  }
}

function threatTarget(state: RaidState, enemy: RaidEnemy): RaidPlayer | undefined {
  const candidates = state.players.filter(player => current(player).hp > 0);
  if (enemy.tauntedBy !== undefined) {
    const forced = candidates.find(player => player.slot === enemy.tauntedBy);
    if (forced) return forced;
  }
  return candidates.sort((a, b) => enemy.threat[b.slot] - enemy.threat[a.slot] || a.slot - b.slot)[0];
}

function bossIntent(state: RaidState, round: number): RaidIntent {
  const stage = (round - 1) % 4;
  if (stage === 1) return { kind: 'charge', label: '蓄力 · 下一轮全体吐息' };
  if (stage === 2) return { kind: 'aoe', label: '全体吐息 · 无视挑衅' };
  if (stage === 3) return { kind: 'summon', label: '召唤幼龙' };
  const target = threatTarget(state, state.enemies[0]);
  return { kind: 'bite', label: '撕咬 · 最高仇恨', ...(target ? { targetSteamId: target.steamId } : {}) };
}

function updateIntents(state: RaidState): void {
  state.bossIntent = bossIntent(state, state.round);
  state.nextBossIntent = bossIntent(state, state.round + 1);
  state.enemies[0].intent = copy(state.bossIntent);
  for (const enemy of state.enemies.slice(1)) {
    const target = threatTarget(state, enemy);
    enemy.intent = { kind: 'claw', label: '幼龙扑击', ...(target ? { targetSteamId: target.steamId } : {}) };
  }
}

export function createRaid(input: RaidCreateInput): RaidState {
  const initial = normalizeInput(input), count = initial.players.length;
  const bossHP = (42 + (initial.tier - 1) * 18) * count;
  const state: RaidState = {
    version: RAID_VERSION, runId: initial.runId, seed: initial.seed, rng: initial.seed || 0x6d2b79f5,
    tier: initial.tier, seasonId: initial.seasonId!, playerCount: count, initial,
    players: initial.players.map((player, slot) => ({ slot, steamId: player.steamId, name: player.name, activePet: player.activePet!, die: 0, guard: 0, stocks: { heals: 3, boosts: 2 }, boost: 0, pets: player.pets.map(pet => {const maxHP=foodIncrease(pet.maxHP,pet.food?.health);return {...copy(pet),maxHP,hp:maxHP};}) })),
    enemies: [{ id: 'boss', kind: 'boss', name: '熔冠巨龙', ...(initial.bossArtKey ? { artKey: initial.bossArtKey } : {}), hp: bossHP, maxHP: bossHP, attack: 6 + initial.tier, threat: Array(count).fill(0), intent: { kind: 'bite', label: '' }, enraged: false }],
    round: 1, roundsCompleted: 0, status: 'planning', deaths: 0,
    bossIntent: { kind: 'bite', label: '' }, nextBossIntent: { kind: 'charge', label: '' }, history: [], lastEvents: []
  };
  rollPlayers(state); updateIntents(state);
  return state;
}

/** Validate against the committed planning snapshot; all plans are checked before any mutation. */
export function validateAction(state: RaidState, action: unknown): RaidValidation {
  if (!state || state.version !== RAID_VERSION || state.status !== 'planning') return { ok: false, error: '本场已结束或版本不一致' };
  const plan = action as RaidAction;
  if (!plan || typeof plan !== 'object' || plan.round !== state.round) return { ok: false, error: '回合已过期' };
  if ((plan.targetId !== undefined && !key(plan.targetId)) || (plan.targetSteamId !== undefined && !boundedText(plan.targetSteamId, 17))) return { ok: false, error: '行动目标格式无效' };
  const player = state.players.find(entry => entry.steamId === plan.steamId);
  if (!player || !alive(player)) return { ok: false, error: '行动玩家无效或已退场' };
  if (!['attack', 'guard', 'heal', 'boost', 'taunt', 'switch'].includes(plan.kind)) return { ok: false, error: '行动类型无效' };
  if (plan.kind === 'switch') {
    if (!integer(plan.petIndex, 0, player.pets.length - 1) || plan.petIndex === player.activePet || player.pets[plan.petIndex!].hp <= 0 || plan.targetId !== undefined || plan.targetSteamId !== undefined) return { ok: false, error: '只能切换至存活候补' };
    return { ok: true };
  }
  if (current(player).hp <= 0) return { ok: false, error: '伙伴已倒下，请先切换候补' };
  if (plan.petIndex !== undefined) return { ok: false, error: '该行动不能切换伙伴' };
  if (plan.kind === 'heal' && player.stocks.heals <= 0) return { ok: false, error: '本场治疗药水已用完' };
  if (plan.kind === 'boost') {
    if (player.stocks.boosts <= 0 || plan.targetId !== undefined || (plan.targetSteamId !== undefined && plan.targetSteamId !== plan.steamId)) return { ok: false, error: '本场力量药水已用完或目标无效' };
    return { ok: true };
  }
  if (plan.kind === 'attack' || plan.kind === 'taunt') {
    if (plan.targetSteamId !== undefined || !state.enemies.some(enemy => enemy.id === (plan.targetId || 'boss') && enemy.hp > 0)) return { ok: false, error: '敌方目标无效' };
  } else {
    const target = state.players.find(entry => entry.steamId === (plan.targetSteamId || plan.steamId));
    if (plan.targetId !== undefined || !target || current(target).hp <= 0) return { ok: false, error: '友方目标必须存活' };
  }
  return { ok: true };
}

/** Used only when the controller decides a player's preparation time has expired. */
export function defaultRaidActions(state: RaidState): RaidAction[] {
  if (state.status !== 'planning') return [];
  return state.players.filter(alive).map(player => current(player).hp > 0
    ? { steamId: player.steamId, round: state.round, kind: 'guard' as RaidActionKind }
    : { steamId: player.steamId, round: state.round, kind: 'switch' as RaidActionKind, petIndex: player.pets.findIndex(pet => pet.hp > 0) });
}

function canonicalAction(action: RaidAction): RaidAction {
  return { steamId: action.steamId, round: action.round, kind: action.kind,
    ...(action.targetId !== undefined ? { targetId: action.targetId } : {}),
    ...(action.targetSteamId !== undefined ? { targetSteamId: action.targetSteamId } : {}),
    ...(action.petIndex !== undefined ? { petIndex: action.petIndex } : {}) };
}

function addThreat(state: RaidState, slot: number, amount: number): void {
  for (const enemy of state.enemies) if (enemy.hp > 0) enemy.threat[slot] += amount;
}
function foodIncrease(base:number,pct=0):number{return pct>0&&base>0?Math.max(base+1,Math.round(base*(1+pct/100))):base;}

function hitPlayer(state: RaidState, enemy: RaidEnemy, player: RaidPlayer, power: number): void {
  const pet = current(player);
  if (pet.hp <= 0) return;
  if(pet.food?.defense&&power>0)power=Math.max(1,Math.min(power-1,Math.round(power*(1-pet.food.defense/100))));
  const absorbed = Math.min(player.guard, power);
  player.guard -= absorbed;
  const before = pet.hp, amount = Math.min(before, power - absorbed);
  pet.hp -= amount;
  state.lastEvents.push({ kind: 'damage', actorId: enemy.id, targetId: player.steamId, amount, hpBefore: before, hpAfter: pet.hp, petIndex: player.activePet, text: `${enemy.name}攻击${player.name}${absorbed ? `（护盾抵挡${absorbed}）` : ''}` });
  if (pet.hp === 0) {
    state.deaths++;
    state.lastEvents.push({ kind: 'death', actorId: player.steamId, petIndex: player.activePet, text: `${player.name}的伙伴倒下` });
  }
}

function resolvePlayer(state: RaidState, plan: RaidAction): void {
  const player = state.players.find(entry => entry.steamId === plan.steamId)!;
  const die = player.die;
  if (plan.kind === 'switch') {
    player.activePet = plan.petIndex!;
    state.lastEvents.push({ kind: 'switch', actorId: player.steamId, targetId: player.steamId, hpAfter: current(player).hp, petIndex: player.activePet, text: `${player.name}换上${current(player).name || current(player).species}` });
  } else if (plan.kind === 'boost') {
    player.stocks.boosts--; player.boost += die;
    state.lastEvents.push({ kind: 'boost', actorId: player.steamId, targetId: player.steamId, amount: die, text: `${player.name}强化下一次攻击` });
  } else if (plan.kind === 'guard') {
    const target = state.players.find(entry => entry.steamId === (plan.targetSteamId || plan.steamId))!;
    const amount = die + 4;
    target.guard += amount; addThreat(state, player.slot, die + 2);
    state.lastEvents.push({ kind: 'guard', actorId: player.steamId, targetId: target.steamId, amount, text: `${player.name}守护${target.name}` });
  } else if (plan.kind === 'heal') {
    player.stocks.heals--;
    const target = state.players.find(entry => entry.steamId === (plan.targetSteamId || plan.steamId))!, pet = current(target);
    const before = pet.hp, amount = Math.min(pet.maxHP - before, foodIncrease(die + 3,current(player).food?.heal));
    pet.hp += amount; addThreat(state, player.slot, Math.ceil(amount / 2));
    state.lastEvents.push({ kind: 'heal', actorId: player.steamId, targetId: target.steamId, amount, hpBefore: before, hpAfter: pet.hp, petIndex: target.activePet, text: `${player.name}治疗${target.name}` });
  } else {
    const enemy = state.enemies.find(entry => entry.id === (plan.targetId || 'boss'))!;
    if (plan.kind === 'taunt') {
      enemy.threat[player.slot] = Math.max(...enemy.threat) + 10 + die; enemy.tauntedBy = player.slot;
      state.lastEvents.push({ kind: 'taunt', actorId: player.steamId, targetId: enemy.id, text: `${player.name}挑衅${enemy.name}` });
    } else {
      // A teammate may have defeated this target in this same simultaneous plan; no implicit retarget.
      const before = enemy.hp, amount = Math.min(before, foodIncrease(die + 2 + player.boost,current(player).food?.attack));
      player.boost = 0;
      enemy.hp -= amount; enemy.threat[player.slot] += amount;
      state.lastEvents.push({ kind: 'attack', actorId: player.steamId, targetId: enemy.id, amount, hpBefore: before, hpAfter: enemy.hp, text: `${player.name}攻击${enemy.name}` });
    }
  }
}

function resolveEnemies(state: RaidState): void {
  const boss = state.enemies[0];
  if (!boss.enraged && boss.hp * 10 <= boss.maxHP * 3) {
    boss.enraged = true;
    state.lastEvents.push({ kind: 'enrage', actorId: boss.id, text: '熔冠巨龙进入狂怒' });
  }
  // Lock intents after all support and attacks, so UI receives the actual target before damage events.
  updateIntents(state);
  const existingEnemies = [...state.enemies];
  for (const enemy of existingEnemies) {
    if (enemy.hp <= 0) continue;
    const power = enemy.attack + (enemy.enraged ? Math.ceil(enemy.attack / 2) : 0);
    if (enemy.intent.kind === 'charge') {
      state.lastEvents.push({ kind: 'charge', actorId: enemy.id, text: '巨龙蓄力：下一轮全体吐息' });
    } else if (enemy.intent.kind === 'summon') {
      const slots = Math.min(2, Math.ceil(state.playerCount / 2));
      for (let index = state.enemies.filter(entry => entry.kind === 'minion' && entry.hp > 0).length; index < slots; index++) {
        const hp = 8 + state.tier * 3, id = `add-${state.round}-${index}`;
        state.enemies.push({ id, kind: 'minion', name: '熔冠幼龙', hp, maxHP: hp, attack: 3 + Math.ceil(state.tier / 3), threat: Array(state.playerCount).fill(0), intent: { kind: 'claw', label: '幼龙扑击' }, enraged: false });
        state.lastEvents.push({ kind: 'summon', actorId: enemy.id, targetId: id, text: '巨龙召来一只幼龙' });
      }
    } else if (enemy.intent.kind === 'aoe') {
      for (const player of state.players) if (current(player).hp > 0) hitPlayer(state, enemy, player, power);
    } else {
      const target = threatTarget(state, enemy);
      if (target) hitPlayer(state, enemy, target, power);
      // A taunt lasts until the next eligible single-target attack, even across charge/AOE/summon turns.
      delete enemy.tauntedBy;
    }
  }
}

export function resolveRound(state: RaidState, actions: RaidAction[]): RaidState {
  if (!state || state.version !== RAID_VERSION || state.status !== 'planning' || !integer(state.round, 1, RAID_MAX_ROUNDS)) fail('本场已结束或版本不一致');
  if (!Array.isArray(actions) || actions.length !== state.players.filter(alive).length) fail('需等待每位存活玩家准备');
  const seen = new Set<string>();
  for (const action of actions) {
    const validation = validateAction(state, action);
    if (!validation.ok) fail(validation.error!);
    if (seen.has(action.steamId)) fail('同一玩家不能重复提交');
    seen.add(action.steamId);
  }
  const next = copy(state), plans = actions.map(canonicalAction).sort((a, b) => a.steamId < b.steamId ? -1 : 1);
  next.lastEvents = [];
  for (const player of next.players) player.guard = 0;
  const dice = next.players.map(player => ({ steamId: player.steamId, value: player.die }));
  // Choices are simultaneous; a fixed phase order gives supports predictable effects before damage.
  for (const phase of ['switch', 'guard', 'taunt', 'heal', 'boost', 'attack'] as RaidActionKind[]) for (const plan of plans) if (plan.kind === phase) resolvePlayer(next, plan);
  if (next.enemies[0].hp <= 0) {
    next.status = 'won';
    next.lastEvents.push({ kind: 'win', actorId: 'boss', text: '熔冠巨龙已被击败' });
  } else {
    resolveEnemies(next);
    if (!next.players.some(alive) || next.round >= RAID_MAX_ROUNDS) {
      next.status = 'lost';
      next.lastEvents.push({ kind: 'lose', actorId: 'boss', text: next.round >= RAID_MAX_ROUNDS ? '超过副本回合上限' : '队伍已全部退场' });
    }
  }
  next.roundsCompleted = next.round;
  if (next.status === 'planning') { next.round++; rollPlayers(next); updateIntents(next); }
  next.history.push({ round: state.round, actions: plans, dice, events: copy(next.lastEvents), hash: stateHash(next) });
  return next;
}

/** Higher is better. Every tier dominates all possible round/death tiebreakers; fits signed int32. */
export function scoreRaid(state: RaidState): number {
  if (state.status !== 'won' || state.players.some(player => player.steamId === 'local')) return 0;
  if (!integer(state.tier, 1, RAID_MAX_TIER) || !integer(state.roundsCompleted, 1, RAID_MAX_ROUNDS) || !integer(state.deaths, 0, 12)) return 0;
  return state.tier * 1000000 + (RAID_MAX_ROUNDS - state.roundsCompleted) * 1000 + (99 - state.deaths);
}

function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  return `{${Object.keys(value).filter(name => (value as Record<string, unknown>)[name] !== undefined).sort().map(name => `${JSON.stringify(name)}:${canonicalJSON((value as Record<string, unknown>)[name])}`).join(',')}}`;
}

/** Portable FNV-1a consistency checksum. This is deliberately not an authenticity/anti-cheat proof. */
export function stateHash(state: RaidState): string {
  const { history, ...snapshot } = state;
  const text = canonicalJSON(snapshot);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

export function exportRaidReplay(state: RaidState): RaidReplay {
  return { version: RAID_VERSION, initial: copy(state.initial), rounds: state.history.map(round => ({ round: round.round, actions: copy(round.actions), hash: round.hash })), hash: stateHash(state) };
}

/** Restores only by replaying validated actions, never by trusting received HP/threat/score fields. */
export function replayRaid(replay: RaidReplay): RaidState {
  if (!replay || replay.version !== RAID_VERSION || !Array.isArray(replay.rounds) || replay.rounds.length > RAID_MAX_ROUNDS || typeof replay.hash !== 'string' || !/^[0-9a-f]{8}$/.test(replay.hash)) fail('副本记录版本或结构无效');
  let state = createRaid(replay.initial);
  for (const round of replay.rounds) {
    if (!round || round.round !== state.round || typeof round.hash !== 'string') fail('副本记录回合顺序无效');
    state = resolveRound(state, round.actions);
    if (stateHash(state) !== round.hash) fail('副本记录不同步');
  }
  if (stateHash(state) !== replay.hash) fail('副本快照校验失败');
  return state;
}

export function serializeRaid(state: RaidState): string { return JSON.stringify(exportRaidReplay(state)); }
export function deserializeRaid(text: string): RaidState {
  if (typeof text !== 'string' || text.length > 1024 * 1024) fail('副本记录过大');
  let value: RaidReplay;
  try { value = JSON.parse(text); } catch { return fail('副本记录无法读取'); }
  return replayRaid(value);
}
