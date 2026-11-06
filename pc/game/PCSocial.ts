import * as M from './PMModel';
import {ACHIEVEMENT_IDS} from './PCAchievementIds';

/** PC metadata is saved atomically beside M.State; it never authenticates a Steam peer. */
export interface SteamBond {
  steamId: string;
  name: string;
  bondedAt: number;
  friend: M.VirtualFriend;
}
export interface RaidEggDefinition {
  dungeonId: string;
  variantId: string;
  name: string;
  eggName: string;
  affinity: M.PetId;
  rarity: M.EggRarity;
  tint: string;
  crest: string;
}
export interface RaidOrigin extends RaidEggDefinition {
  eggId: string;
  source: 'first-clear' | 'drop' | 'fragments';
  runId?: string;
}
export interface PCSocialState {
  version: 1;
  achievements?: string[];
  ownerSteamId: string;
  friends: SteamBond[];
  claimedRaidRuns: string[];
  firstRaidClears: string[];
  raidFragments: Record<string, number>;
  raidRedemptions: number;
  raidOrigins: RaidOrigin[];
}
export interface PCSocialResult {
  game: M.State;
  social: PCSocialState;
  changed: boolean;
  reason?: string;
  eggIds: string[];
}
export interface SteamPeer { steamId: string; name: string; pet: M.Pet }
export interface RaidReceipt {
  runId: string;
  dungeonId: string;
  steamId: string;
  won: boolean;
  completed: boolean;
  seed: number;
  participantSteamIds: string[];
}

/** Explicit cosmetic form of an existing non-friend species, with unchanged natural stats. */
export const RAID_EGGS: readonly RaidEggDefinition[] = [{
  dungeonId: 'molten-crown', variantId: 'molten-crown-dragon', name: '熔冠龙', eggName: '熔冠龙专属蛋',
  affinity: 'dragon', rarity: 'SSR', tint: '#ef9655', crest: '♛',
}];
/** Initial PC values, independent of story balance and the existing friend egg pool. */
export const RAID_REWARD_RULES = { repeatFragments: 3, wholeEggChance: .2, redeemFragments: 15 } as const;

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const integer = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const token = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9:_-]{0,95}$/.test(v);
const raid = (id: string) => RAID_EGGS.find(r => r.dungeonId === id);
const steamOwner = (steamId: string) => 'steam-' + steamId;
const unique = (values: string[]) => new Set(values).size === values.length;
const fail = (game: M.State, social: PCSocialState, reason: string): PCSocialResult => ({game, social, changed:false, reason, eggIds:[]});
function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}
/** Public individual SteamID64, kept as a string to avoid 64-bit precision loss. */
export function isSteamId(value: unknown): value is string {
  return typeof value === 'string' && /^\d{17}$/.test(value) && value >= '76561197960265729' && value <= '76561202255233023';
}
export function accountSaveKey(steamId: string): string | null {
  return steamId === 'local' ? 'pm.pc.creature-dice.v1.local' : isSteamId(steamId) ? 'pm.pc.creature-dice.v1.steam.' + steamId : null;
}
export function newPCSocial(ownerSteamId: string): PCSocialState {
  if (!accountSaveKey(ownerSteamId)) throw new Error('Invalid PC profile identity');
  return {version:1, ownerSteamId, friends:[], claimedRaidRuns:[], firstRaidClears:[], raidFragments:{}, raidRedemptions:0, raidOrigins:[]};
}
function peerCode(peer: SteamPeer): string | null {
  if (!peer?.pet || !M.PET_IDS.includes(peer.pet.id) || !['normal','SR','SSR'].includes(peer.pet.rarity || 'normal') || !['female','male'].includes(peer.pet.sex!)) return null;
  const pet = {...peer.pet, uid:'steam-avatar-' + peer.steamId};
  return M.makeVisitCode({social:{version:1, owner:steamOwner(peer.steamId), bonds:[]}, pets:[pet]} as M.State, pet.uid);
}
function safeName(name: string): string {
  return Array.from(typeof name === 'string' ? name : '').filter(c => !/[\u0000-\u001f\u007f<>]/.test(c)).slice(0,32).join('').trim() || 'Steam 旅伴';
}
function validBond(b: SteamBond, owner: string): boolean {
  if (!b || !isSteamId(b.steamId) || b.steamId === owner || typeof b.name !== 'string' || b.name !== safeName(b.name) || !integer(b.bondedAt)) return false;
  const f = b.friend, c = f?.card;
  if (!f || !c || c.version !== 1 || c.owner !== steamOwner(b.steamId) || f.since !== b.bondedAt || ![f.since,f.settledAt,f.seed,f.gifts].every(integer) || f.settledAt < f.since || f.seed > 0xffffffff || f.gifts < 1 || (f.settledAt-f.since) % M.FRIEND_GIFT_INTERVAL !== 0) return false;
  const code = peerCode({steamId:b.steamId, name:b.name, pet:{id:c.species, rarity:c.rarity, sex:c.sex, faces:[]}});
  const canonical = code && M.readVisitCode(code);
  return !!canonical && Object.keys(canonical).every(k=>canonical[k]===c[k]);
}
/** Corrupt or cross-account ledgers fail closed; callers must not silently reset an existing profile. */
export function restorePCSocial(raw: unknown, ownerSteamId: string): PCSocialState | null {
  try {
    const s = (typeof raw === 'string' ? JSON.parse(raw) : copy(raw)) as PCSocialState;
    if(s?.achievements!==undefined&&(!Array.isArray(s.achievements)||s.achievements.length>ACHIEVEMENT_IDS.length||!unique(s.achievements)||s.achievements.some(id=>!(ACHIEVEMENT_IDS as readonly string[]).includes(id))))return null;
    if (!s || !accountSaveKey(ownerSteamId) || s.version !== 1 || s.ownerSteamId !== ownerSteamId || !Array.isArray(s.friends) || !s.friends.every(b=>validBond(b,ownerSteamId)) || !unique(s.friends.map(b=>b.steamId))) return null;
    if (ownerSteamId === 'local' && (s.friends.length || s.claimedRaidRuns?.length || s.raidOrigins?.length)) return null;
    if (!Array.isArray(s.claimedRaidRuns) || !s.claimedRaidRuns.every(token) || !unique(s.claimedRaidRuns) || !Array.isArray(s.firstRaidClears) || !s.firstRaidClears.every(id=>!!raid(id)) || !unique(s.firstRaidClears) || !integer(s.raidRedemptions)) return null;
    if (!s.raidFragments || typeof s.raidFragments !== 'object' || Array.isArray(s.raidFragments) || Object.keys(s.raidFragments).some(id=>!raid(id) || !integer(s.raidFragments[id]))) return null;
    if (!Array.isArray(s.raidOrigins) || !unique(s.raidOrigins.map(o=>o?.eggId)) || s.raidOrigins.some(o=>{
      const definition = o && raid(o.dungeonId);
      return !definition || !o.eggId || typeof o.eggId !== 'string' || o.eggId.length > 200 || !['first-clear','drop','fragments'].includes(o.source) || Object.keys(definition).some(k=>o[k]!==definition[k]) || (o.source === 'fragments' ? o.runId !== undefined : !o.runId || !s.claimedRaidRuns.includes(o.runId)) || !s.firstRaidClears.includes(o.dungeonId);
    })) return null;
    return s;
  } catch { return null; }
}
function steamContext(game: M.State, social: PCSocialState): M.State {
  const clean = copy(game);
  // Imported postcard data remains intact. Only confirmed Steam bonds enter this reward context.
  delete clean.social;
  const state = M.ensureSocial(clean, steamOwner(social.ownerSteamId));
  state.social!.friends = copy(social.friends.map(b=>b.friend));
  return state;
}
function finishContext(original: M.State, next: M.State, social: PCSocialState): PCSocialResult {
  const game = {...original, eggs:next.eggs, revision:original.revision+1};
  return {game, social, changed:true, eggIds:(next.eggs || []).filter(e=>!original.eggs?.some(old=>old.id===e.id)).map(e=>e.id)};
}
/** Call only after mutual confirmation by a currently authenticated Steam friend. */
export function bondFriend(game: M.State, social: PCSocialState, peer: SteamPeer, trustedNow: number | null): PCSocialResult {
  if (!isSteamId(social.ownerSteamId) || !isSteamId(peer?.steamId) || peer.steamId === social.ownerSteamId) return fail(game,social,'invalid-identity');
  if (!integer(trustedNow)) return fail(game,social,'waiting-for-trusted-time');
  if (social.friends.some(f=>f.steamId===peer.steamId)) return fail(game,social,'already-bonded');
  if (trustedNow < (game.trustedTime?.lastMs || 0) || social.friends.some(f=>trustedNow<f.friend.settledAt)) return fail(game,social,'time-regressed');
  const code = peerCode(peer);
  if (!code) return fail(game,social,'invalid-pet');
  const received = M.receiveVisitor(steamContext(game,social), code, trustedNow);
  const friend = received.social?.friends?.find(f=>f.card.owner===steamOwner(peer.steamId));
  if (!friend) return fail(game,social,'invalid-bond');
  if (friend.gifts < 1) return fail(game,social,'reward-ledger-conflict');
  const next = copy(social);
  next.friends.push({steamId:peer.steamId,name:safeName(peer.name),bondedAt:trustedNow,friend});
  return finishContext(game,received,next);
}
/** Uses the unchanged shared 24-hour/30-percent rule and its persisted PRNG/cycle cursor. */
export function settleSteamFriendGifts(game: M.State, social: PCSocialState, trustedNow: number | null): PCSocialResult {
  if (!isSteamId(social.ownerSteamId)) return fail(game,social,'invalid-identity');
  if (!integer(trustedNow)) return fail(game,social,'waiting-for-trusted-time');
  if (trustedNow < (game.trustedTime?.lastMs || 0) || social.friends.some(f=>trustedNow<f.friend.settledAt)) return fail(game,social,'time-regressed');
  if (!social.friends.some(f=>trustedNow-f.friend.settledAt>=M.FRIEND_GIFT_INTERVAL)) return fail(game,social,'not-due');
  const settled = M.settleFriendGifts(steamContext(game,social), trustedNow), next = copy(social);
  next.friends.forEach(b=>b.friend=settled.social!.friends!.find(f=>f.card.owner===steamOwner(b.steamId))!);
  return finishContext(game,settled,next);
}
function addRaidEgg(game: M.State, social: PCSocialState, definition: RaidEggDefinition, eggId: string, source: RaidOrigin['source'], runId?: string): void {
  const rarity = definition.rarity, affinity = definition.affinity;
  const genes: M.Genes = {id:affinity,rarity,baseHP:M.naturalPetHP(affinity,rarity),baseFaces:M.naturalPetFaces(affinity,rarity),skills:M.petSkills({id:affinity,rarity})};
  game.eggs = [...(game.eggs || []), {id:eggId,rarity,affinity,stage:0,genes,nested:true}];
  social.raidOrigins.push({...definition,eggId,source,...(runId?{runId}:{})});
}
/** Caller validates the full replay first. Receipt fields alone are not an anti-cheat proof. */
export function claimRaidReward(game: M.State, social: PCSocialState, receipt: RaidReceipt): PCSocialResult {
  const definition = receipt && raid(receipt.dungeonId), people = receipt?.participantSteamIds;
  if (!isSteamId(social.ownerSteamId) || !receipt || receipt.steamId !== social.ownerSteamId || !definition || !token(receipt.runId) || receipt.won !== true || receipt.completed !== true || !integer(receipt.seed) || receipt.seed > 0xffffffff || !Array.isArray(people) || people.length < 2 || people.length > 4 || !people.every(isSteamId) || !unique(people) || !people.includes(social.ownerSteamId)) return fail(game,social,'invalid-receipt');
  if (social.claimedRaidRuns.includes(receipt.runId)) return fail(game,social,'already-claimed');
  const nextGame = copy(game), next = copy(social), first = !next.firstRaidClears.includes(definition.dungeonId);
  const eggIds: string[] = [];
  next.claimedRaidRuns.push(receipt.runId);
  if (first) next.firstRaidClears.push(definition.dungeonId);
  else next.raidFragments[definition.dungeonId] = (next.raidFragments[definition.dungeonId] || 0) + RAID_REWARD_RULES.repeatFragments;
  const roll = hash(receipt.seed + '|' + receipt.runId + '|' + receipt.steamId) / 4294967296;
  if (first || roll < RAID_REWARD_RULES.wholeEggChance) {
    const eggId = 'raid-' + receipt.runId + '-' + social.ownerSteamId;
    if (game.eggs?.some(e=>e.id===eggId) || game.hatchedEggIds?.includes(eggId)) return fail(game,social,'reward-ledger-conflict');
    addRaidEgg(nextGame,next,definition,eggId,first?'first-clear':'drop',receipt.runId);
    eggIds.push(eggId);
  }
  nextGame.revision++;
  return {game:nextGame,social:next,changed:true,eggIds};
}
export function redeemRaidEgg(game: M.State, social: PCSocialState, dungeonId: string): PCSocialResult {
  const definition = raid(dungeonId);
  if (!isSteamId(social.ownerSteamId) || !definition || !social.firstRaidClears.includes(dungeonId) || (social.raidFragments[dungeonId] || 0) < RAID_REWARD_RULES.redeemFragments) return fail(game,social,'insufficient-fragments');
  const nextGame = copy(game), next = copy(social);
  const eggId = 'raid-redeem-' + dungeonId + '-' + social.ownerSteamId + '-' + (next.raidRedemptions+1);
  if (game.eggs?.some(e=>e.id===eggId) || game.hatchedEggIds?.includes(eggId)) return fail(game,social,'reward-ledger-conflict');
  next.raidFragments[dungeonId] -= RAID_REWARD_RULES.redeemFragments;
  next.raidRedemptions++;
  addRaidEgg(nextGame,next,definition,eggId,'fragments');
  nextGame.revision++;
  return {game:nextGame,social:next,changed:true,eggIds:[eggId]};
}
export function raidOriginForEgg(social: PCSocialState, egg: M.Egg | string): RaidOrigin | null {
  const id = typeof egg === 'string' ? egg : egg?.id;
  return social.raidOrigins.find(o=>o.eggId===id) || null;
}
export function raidOriginForPet(social: PCSocialState, pet: M.Pet): RaidOrigin | null {
  return social.raidOrigins.find(o=>pet?.uid==='hatch-'+o.eggId && pet.id===o.affinity) || null;
}
