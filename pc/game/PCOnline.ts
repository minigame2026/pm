import { steam, SteamIdentity, SteamEvent, SteamResult } from './PCSteam';
import * as R from './PCRaid';

export interface PCOnlineProfile { pet: any; loadout: R.RaidPlayerInput }
export interface PCOnlineLobby { lobbyId: string; ownerId: string; members: { steamId: string; name: string }[]; metadata: Record<string, string> }
export interface PCOnlineOptions {
  bridge?: typeof steam; getProfile: () => PCOnlineProfile; onChange: () => void; onNotice: (text: string) => void;
  onBond: (peer: { steamId: string; name: string; pet: any }) => boolean; onComplete: (state: R.RaidState) => void;
  canJoin: () => boolean; now?: () => number; onHelpEvent?: (event:SteamEvent) => void;
}
type Phase = 'idle' | 'planning' | 'confirming' | 'paused' | 'complete';
type Barrier = { stage: 'start' | 'round' | 'resume'; round: number; hash: string; acks: Set<string> };
const START = Date.UTC(2026, 9, 25) / 1000, SEASON = 8 * 7 * 86400;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const realId = (id: unknown): id is string => typeof id === 'string' && /^\d{17}$/.test(id) && id >= '76561197960265729' && id <= '76561202255233023';
const token = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9:_-]{1,96}$/.test(value);
function hash(text: string): number { let value = 2166136261; for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619); return value >>> 0; }
function sessionNonce(): string {
  const words = new Uint32Array(4);
  try {
    const source = (globalThis as any).crypto;
    if (!source || typeof source.getRandomValues !== 'function') throw new Error('no_crypto');
    source.getRandomValues(words);
  } catch {
    // This identifies a session only; it never consumes the deterministic raid/gameplay generator.
    for (let index = 0; index < words.length; index++) words[index] = Math.floor(Math.random() * 0x100000000);
  }
  return Array.from(words).map(word => word.toString(16).padStart(8, '0')).join('');
}
export function raidBoardName(seasonId: string, count: number): string { return `dicekin_raid_v1_${seasonId}_p${count}`; }

/** Player-hosted Steam session. Every reward-visible round crosses an all-participant replay ACK barrier. */
export class PCOnline {
  status: SteamIdentity = { available: false, online: false, steamId: '', name: '', appId: 5500200, overlayEnabled: false };
  lobby: PCOnlineLobby | null = null;
  profiles: Record<string, PCOnlineProfile> = {};
  ready: Record<string, boolean> = {};
  raid: R.RaidState | null = null;
  phase: Phase = 'idle';
  plans: Record<string, R.RaidAction> = {};
  tier = 1;
  ranked = false;
  friends: any[] = [];
  pendingBond: { steamId: string; nonce: string } | null = null;
  pendingInvite: string | null = null;
  boardEntries: any[] = [];
  boardBusy = false;
  boardError = '';
  selectedReplay: R.RaidState | null = null;
  lastError = '';
  overlayActive = false;
  private bridge: typeof steam;
  private now: () => number;
  private requests = new Map<number, { resolve: (data: any) => void; reject: (error: Error) => void; deadline: number; op: string }>();
  private queued: SteamEvent[] = [];
  private counter = 0;
  private session = sessionNonce();
  private lastPulse = -Infinity;
  private lastSeen: Record<string, number> = {};
  private missing: Record<string, number> = {};
  private runOwner = '';
  private runLobby = '';
  private barrier: Barrier | null = null;
  private deadline = Infinity;
  private resumeSent = false;
  private config = '1:false';
  private readyConfig: Record<string, string> = {};
  private completed = new Set<string>();
  private seenBonds = new Set<string>();
  private offered: { steamId: string; nonce: string } | null = null;
  private transfer: { id: string; parts: string[]; total: number; hash: string; ranked: boolean; at: number } | null = null;
  private boardContext = { name: '', count: 1, seasonId: '' };
  private boardSequence = 0;
  private detailSequence = 0;
  private accountLocked = false;
  private runRanked = false;
  private barrierAt = 0;
  private lobbyGeneration = 0;
  private acceptLobby = false;

  constructor(private options: PCOnlineOptions) {
    this.bridge = options.bridge || steam; this.now = options.now || (() => Date.now());
    const result = this.bridge.request<SteamIdentity>('status'); if (result.ok && result.data) this.status = result.data;
    this.refreshProfile();
  }
  private changed(): void { this.options.onChange(); }
  private notice(text: string): void { this.lastError = text; this.options.onNotice(text); this.changed(); }
  private online(): boolean { return !this.accountLocked && this.status.available && this.status.online !== false && realId(this.status.steamId); }
  private updateStatus(value: SteamIdentity): void {
    if (realId(this.status.steamId) && realId(value.steamId) && this.status.steamId !== value.steamId) {
      this.accountLocked = true;
      if (this.active()) this.abort('Steam账号已改变，请重启游戏后加载对应账号档案。', true);
      else this.notice('Steam账号已改变，请重启游戏后加载对应账号档案。');
    }
    if (!same(this.status, value)) { this.status = value; this.changed(); }
  }
  private me(): string { return this.online() ? this.status.steamId : 'local'; }
  private host(): boolean { return !!this.lobby && this.lobby.ownerId === this.status.steamId; }
  private active(): boolean { return !!this.raid && this.phase !== 'complete' && this.phase !== 'idle'; }
  private members(): string[] { return this.lobby ? this.lobby.members.map(member => member.steamId).sort() : []; }
  private participants(): string[] { return this.raid ? this.raid.players.map(player => player.steamId) : []; }
  private signature(): string { return `${this.tier}:${this.ranked}`; }
  private nextId(kind: string): string { return `${kind}-${this.me()}-${this.session}-${++this.counter}`; }
  private ownProfile(): PCOnlineProfile {
    const value = copy(this.options.getProfile());
    value.loadout.steamId = this.me(); value.loadout.name = this.status.name || value.loadout.name || '旅人';
    if (!R.validateLoadout([value.loadout]).ok) throw new Error('请选择有效的伙伴阵容');
    return value;
  }
  private request<T = any>(op: string, args: any = {}): Promise<T> {
    const result = this.bridge.request<T>(op, args);
    if (!result.ok) return Promise.reject(new Error(result.error || 'steam_request_failed'));
    if (result.requestId) return new Promise<T>((resolve, reject) => { this.requests.set(result.requestId!, { resolve, reject, deadline: this.now() + 35000, op }); });
    return Promise.resolve(result.data as T);
  }
  private checkOnline(): boolean { if (this.online()) return true; this.notice('Steam当前未联网，此功能暂不可用；单人试炼仍可游玩。'); return false; }
  private packet(type: string, data: any = {}): any { return { version: R.RAID_VERSION, lobbyId: this.lobby?.lobbyId || this.runLobby, type, ...data }; }
  private send(id: string, type: string, data: any = {}): boolean {
    if (!this.lobby || id === this.status.steamId || !this.members().includes(id)) return false;
    const result = this.bridge.request('message.send', { steamId: id, payload: this.packet(type, data) });
    if (!result.ok) { if (this.active()) this.pause(id); else this.notice('Steam消息发送失败，请稍后重试。'); return false; }
    return true;
  }
  private broadcast(type: string, data: any = {}): void { for (const id of this.members()) if (id !== this.status.steamId) this.send(id, type, data); }
  private keep(set: Set<string>, value: string): void { set.add(value); if (set.size > 256) set.delete(set.values().next().value!); }

  tick(): void {
    this.queued.push(...this.bridge.poll()); if (this.queued.length > 1024) this.queued.splice(0, this.queued.length - 1024);
    for (const event of this.queued.splice(0, 128)) {
      try { if(event.type==='helpInvite'||event.type==='helpMessage')this.options.onHelpEvent?.(event);else this.event(event); } catch { this.notice('收到的Steam资料无效，已忽略。'); }
    }
    const time = this.now();
    for (const [id, request] of this.requests) if (time >= request.deadline) { this.requests.delete(id); request.reject(new Error('steam_timeout')); }
    if (time - this.lastPulse >= 2000) {
      this.lastPulse = time;
      const result = this.bridge.request<SteamIdentity>('status'); if (result.ok && result.data) this.updateStatus(result.data);
      if (this.active()) this.ranked = this.runRanked;
      this.syncConfig();
      if (this.lobby && this.online()) this.broadcast('heartbeat', { runId: this.raid?.runId || '', phase: this.phase });
      if (this.active() && this.runLobby) this.checkConnections();
    }
    if (this.active() && this.runLobby) {
      if (this.host() && this.barrier && this.phase === 'confirming' && time - this.barrierAt >= 10000) {
        for (const id of this.participants()) if (!this.barrier.acks.has(id)) this.pause(id);
      }
      if (Object.keys(this.missing).some(id => time - this.missing[id] >= 60000)) this.abort('队员重连超时，本场已中止，不发放未完成奖励。', true);
      else if (this.phase === 'paused' && this.host() && !this.resumeSent && this.participants().every(id => this.members().includes(id) && (id === this.status.steamId || time - (this.lastSeen[id] ?? -Infinity) < 10000))) this.resumeEveryone();
    }
    if (this.phase === 'planning' && this.runRanked && time >= this.deadline && (!this.runLobby || this.host())) {
      for (const action of R.defaultRaidActions(this.raid!)) if (!this.plans[action.steamId]) this.plans[action.steamId] = action;
      this.tryResolve();
    }
    if (this.transfer && time - this.transfer.at > 30000) { this.transfer = null; this.notice('副本重连快照接收超时。'); }
  }

  private event(event: SteamEvent): void {
    if (event.type === 'result') {
      const pending = this.requests.get(event.requestId); if (!pending || pending.op !== event.op) return;
      this.requests.delete(event.requestId); event.ok ? pending.resolve(event.data) : pending.reject(new Error(event.error || 'steam_request_failed')); return;
    }
    if (event.type === 'status') { const { type, ...identity } = event; this.updateStatus({ ...this.status, ...identity }); return; }
    if (event.type === 'overlay') { this.overlayActive = event.active === true; this.changed(); return; }
    if (event.type === 'lobbyInvite') { this.pendingInvite = typeof event.lobbyId === 'string' ? event.lobbyId : null; this.options.onNotice(this.options.canJoin() ? '收到好友组队邀请。' : '收到组队邀请，请先完成当前战斗并保存。'); this.changed(); return; }
    if (event.type === 'lobby') { this.applyLobby(event as unknown as PCOnlineLobby); return; }
    if (event.type === 'connection' && this.active()) { if (event.steamId === this.runOwner) this.abort('房主连接中断，本场已中止。', false); else this.pause(event.steamId); return; }
    if (event.type !== 'message' || !this.lobby || !realId(event.steamId) || event.steamId === this.status.steamId || !this.members().includes(event.steamId)) return;
    const message = event.payload;
    if (!message || typeof message !== 'object' || message.version !== R.RAID_VERSION || message.lobbyId !== this.lobby.lobbyId || typeof message.type !== 'string' || JSON.stringify(message).length > 60000) return;
    this.lastSeen[event.steamId] = this.now(); this.message(event.steamId, message);
  }

  async refreshFriends(): Promise<void> {
    if (!this.checkOnline()) return;
    try { const data = await this.request('friends'); this.friends = Array.isArray(data?.friends) ? data.friends.filter((friend: any) => realId(friend.steamId)).slice(0, 1000) : []; this.changed(); }
    catch { this.notice('无法读取Steam好友，请检查连接。'); }
  }
  async createRoom(): Promise<void> {
    if (!this.checkOnline() || !this.options.canJoin() || this.active()) return;
    const generation = ++this.lobbyGeneration; this.acceptLobby = true;
    try { const data = await this.request<PCOnlineLobby>('lobby.create', { maxMembers: 4, metadata: { version: R.RAID_VERSION, tier: String(this.tier), ranked: this.ranked ? '1' : '0' } }); if (generation === this.lobbyGeneration) this.applyLobby(data); }
    catch { if (generation === this.lobbyGeneration) { this.acceptLobby = false; this.lobby = null; this.notice('创建Steam房间失败，请稍后重试。'); } }
  }
  invite(): void { if (!this.lobby || !this.checkOnline()) return; if (!this.bridge.request('overlay.invite').ok) this.notice('Steam邀请界面无法打开，请确认已启用Overlay。'); }
  async join(lobbyId: string): Promise<void> {
    if (!this.checkOnline()) return;
    const reconnect = this.phase === 'paused' && this.runLobby === lobbyId;
    if ((!reconnect && (!this.options.canJoin() || this.active())) || typeof lobbyId !== 'string' || !/^\d{17,20}$/.test(lobbyId)) { this.notice('请先完成当前战斗并保存，再加入有效的Steam房间。'); return; }
    const generation = ++this.lobbyGeneration; this.acceptLobby = true;
    try { const data = await this.request<PCOnlineLobby>('lobby.join', { lobbyId }); if (generation === this.lobbyGeneration) { this.pendingInvite = null; this.applyLobby(data); } }
    catch { if (generation === this.lobbyGeneration) { this.acceptLobby = false; this.lobby = null; this.notice('加入Steam房间失败，请确认邀请仍然有效。'); } }
  }
  leave(): void {
    if (this.active()) this.abort('已离开房间，本场副本中止。', true);
    this.acceptLobby = false; this.lobbyGeneration++;
    this.bridge.request('lobby.leave'); this.lobby = null; this.profiles = {}; this.ready = {}; this.readyConfig = {}; this.pendingBond = null; this.offered = null; this.changed();
  }
  private applyLobby(data: PCOnlineLobby): void {
    if (!data || !Array.isArray(data.members) || data.members.length > 4 || data.members.some(member => !realId(member.steamId)) || new Set(data.members.map(member => member.steamId)).size !== data.members.length) return;
    if (data.lobbyId && !this.acceptLobby) return;
    if (!data.lobbyId) { if (this.active()) this.pause(this.status.steamId); this.lobby = null; this.changed(); return; }
    if (data.metadata?.version !== R.RAID_VERSION) { this.notice('房间规则版本不同，请所有玩家更新游戏后重试。'); this.bridge.request('lobby.leave'); return; }
    if (this.active() && (data.lobbyId !== this.runLobby || data.ownerId !== this.runOwner)) { this.abort('房主已退出或房间已改变，本场中止；不会自动迁移房主。', false); }
    const oldMembers = this.members(); this.lobby = copy(data);
    if (!this.active()) {
      this.tier = Math.max(1, Math.min(R.RAID_MAX_TIER, Number(data.metadata?.tier) || 1)); this.ranked = data.metadata?.ranked === '1'; this.config = this.signature();
      for (const id of Object.keys(this.profiles)) if (!this.members().includes(id)) { delete this.profiles[id]; delete this.ready[id]; delete this.readyConfig[id]; }
    }
    if (!oldMembers.length || this.members().some(id => !oldMembers.includes(id))) this.refreshProfile();
    if (this.active()) this.checkConnections(); this.changed();
  }
  refreshProfile(): void {
    try {
      const profile = this.ownProfile(), id = profile.loadout.steamId;
      if (!same(this.profiles[id], profile)) { this.profiles[id] = profile; this.ready = {}; this.readyConfig = {}; }
      if (this.lobby && !this.active()) this.broadcast('hello', { profile });
      else if (this.lobby && this.phase === 'paused') this.broadcast('heartbeat', { runId: this.raid?.runId, phase: this.phase });
      this.changed();
    } catch { this.notice('当前阵容无效，请先选择1至3只已有伙伴。'); }
  }
  setReady(value: boolean): void {
    if (!this.lobby || this.active()) return;
    this.refreshProfile(); const id = this.status.steamId;
    if (!this.profiles[id]) return;
    this.ready[id] = !!value; this.readyConfig[id] = this.signature(); this.broadcast('ready', { ready: !!value, config: this.signature() }); this.changed();
  }
  setTier(tier: number): void {
    if (this.active() || (this.lobby && !this.host()) || !Number.isInteger(tier) || tier < 1 || tier > R.RAID_MAX_TIER) return;
    this.tier = tier; this.syncConfig(); this.changed();
  }
  private syncConfig(): void {
    if (this.active() || (this.lobby && !this.host()) || this.config === this.signature()) return;
    this.config = this.signature(); this.ready = {}; this.readyConfig = {};
    if (this.lobby) {
      this.bridge.request('lobby.setData', { key: 'tier', value: String(this.tier) }); this.bridge.request('lobby.setData', { key: 'ranked', value: this.ranked ? '1' : '0' });
      this.broadcast('config', { tier: this.tier, ranked: this.ranked });
    }
  }

  private season(offset = 0): string | null {
    if (!this.online()) return null;
    const result = this.bridge.request<{ unixSeconds: number }>('time'), seconds = result.data?.unixSeconds;
    if (!result.ok || !Number.isInteger(seconds) || seconds! < START || !Number.isInteger(offset) || offset < 0 || offset > 12) return null;
    const index = Math.floor((seconds! - START) / SEASON) + 1 - offset;
    return index > 0 ? `s${index}` : null;
  }
  startRaid(): void {
    if (!this.host() || !this.checkOnline() || this.active()) return;
    if (!this.options.canJoin()) { this.notice('请先完成当前战斗并保存，再开始副本。'); return; }
    this.syncConfig(); const ids = this.members();
    if (ids.length < 2 || ids.length > 4 || ids.some(id => !this.profiles[id] || !this.ready[id] || this.readyConfig[id] !== this.signature())) { this.notice('请等待所有队员确认阵容并准备。'); return; }
    const seasonId = this.season(); if (this.ranked && !seasonId) { this.notice('无法取得Steam赛季时间，暂不能开始升阶挑战。'); return; }
    try {
      const runId = this.nextId('raid');
      const initial: R.RaidCreateInput = { runId, seed: hash(runId), tier: this.tier, seasonId: seasonId || 's1', bossArtKey: 'dragon', players: ids.map(id => copy(this.profiles[id].loadout)) };
      this.raid = R.createRaid(initial); this.runRanked = this.ranked; this.runOwner = this.status.steamId; this.runLobby = this.lobby!.lobbyId; this.plans = {}; this.missing = {}; this.resumeSent = false;
      for (const id of ids) this.lastSeen[id] = this.now();
      this.barrier = { stage: 'start', round: 0, hash: R.stateHash(this.raid), acks: new Set([this.status.steamId]) }; this.barrierAt = this.now(); this.phase = 'confirming';
      this.broadcast('start', { initial, ranked: this.ranked, readyIds: ids, hash: this.barrier.hash }); this.changed();
    } catch { this.notice('副本阵容资料无效，无法开始。'); }
  }
  startSolo(tier: number): void {
    if (this.accountLocked) { this.notice('Steam账号已改变，请重启游戏后再开始试炼。'); return; }
    if (this.active() || !this.options.canJoin() || !Number.isInteger(tier) || tier < 1 || tier > R.RAID_MAX_TIER) return;
    if (this.lobby) this.leave();
    const seasonId = this.season(); if (!this.online()) this.ranked = false;
    if (this.ranked && !seasonId) { this.notice('无法取得Steam赛季时间，暂不能开始升阶试炼。'); return; }
    try {
      const profile = this.ownProfile(), runId = this.nextId('solo');
      this.tier = tier; this.raid = R.createRaid({ runId, seed: hash(runId), tier, seasonId: seasonId || 's1', bossArtKey: 'dragon', players: [profile.loadout] });
      this.runRanked = this.ranked; this.runOwner = profile.loadout.steamId; this.runLobby = ''; this.plans = {}; this.barrier = null; this.missing = {}; this.beginPlanning();
    } catch { this.notice('单人试炼阵容无效。'); }
  }
  submit(action: R.RaidAction): void {
    if (!this.raid || this.phase !== 'planning' || action.steamId !== this.me()) return;
    const valid = R.validateAction(this.raid, action); if (!valid.ok) { this.notice(valid.error || '行动无效'); return; }
    const plan = copy(action); this.plans[this.me()] = plan;
    if (!this.runLobby || this.host()) { this.broadcast('plans', { runId: this.raid.runId, round: this.raid.round, plans: this.plans }); this.tryResolve(); }
    else this.send(this.runOwner, 'plan', { runId: this.raid.runId, round: this.raid.round, hash: R.stateHash(this.raid), action: plan });
    this.changed();
  }
  withdraw(): void {
    if (!this.raid || this.phase !== 'planning') return;
    delete this.plans[this.me()];
    if (!this.runLobby || this.host()) this.broadcast('plans', { runId: this.raid.runId, round: this.raid.round, plans: this.plans });
    else this.send(this.runOwner, 'withdraw', { runId: this.raid.runId, round: this.raid.round, hash: R.stateHash(this.raid) });
    this.changed();
  }
  private tryResolve(): void {
    if (!this.raid || this.phase !== 'planning' || (this.runLobby && !this.host())) return;
    const required = R.defaultRaidActions(this.raid).map(action => action.steamId); if (required.some(id => !this.plans[id])) return;
    try {
      const previous = this.raid, plans = required.map(id => this.plans[id]), next = R.resolveRound(previous, plans);
      this.raid = next; this.barrier = { stage: 'round', round: previous.round, hash: R.stateHash(next), acks: new Set([this.me()]) }; this.barrierAt = this.now(); this.phase = 'confirming';
      if (!this.runLobby) this.release();
      else this.broadcast('round', { runId: next.runId, round: previous.round, prevHash: R.stateHash(previous), actions: plans, hash: this.barrier.hash });
      this.changed();
    } catch { this.abort('行动结算失败，本场已中止。', true); }
  }
  private beginPlanning(): void { this.phase = 'planning'; this.plans = {}; this.deadline = this.runRanked ? this.now() + 30000 : Infinity; this.changed(); }
  planningSeconds(): number | null { return this.phase === 'planning' && this.runRanked ? Math.max(0, Math.ceil((this.deadline - this.now()) / 1000)) : null; }
  private release(): void {
    if (!this.raid || !this.barrier) return;
    const barrier = this.barrier;
    if (this.runLobby && this.host()) {
      if (!this.online() || this.participants().some(id => !barrier.acks.has(id) || !this.members().includes(id))) return;
      this.broadcast('release', { runId: this.raid.runId, stage: barrier.stage, round: barrier.round, hash: barrier.hash });
    }
    this.barrier = null; this.missing = {}; this.resumeSent = false;
    if (this.raid.status === 'planning') this.beginPlanning();
    else {
      this.phase = 'complete'; this.plans = {}; this.ready = {}; this.readyConfig = {};
      if (!this.completed.has(this.raid.runId)) {
        this.keep(this.completed, this.raid.runId); this.options.onComplete(copy(this.raid));
        if (this.runRanked && this.raid.status === 'won') void this.uploadScore(copy(this.raid));
      }
      this.changed();
    }
  }

  private message(from: string, message: any): void {
    if (message.type === 'heartbeat') return;
    if (message.type === 'hello' && !this.active()) {
      const profile = message.profile;
      if (!profile || profile.loadout?.steamId !== from || !R.validateLoadout([profile.loadout]).ok || JSON.stringify(profile).length > 16000) return;
      const first = !this.profiles[from];
      if (!same(profile, this.profiles[from])) { this.profiles[from] = copy(profile); this.ready = {}; this.readyConfig = {}; }
      if (first && this.profiles[this.status.steamId]) this.send(from, 'hello', { profile: this.profiles[this.status.steamId] }); this.changed(); return;
    }
    if (message.type === 'ready' && !this.active() && this.profiles[from] && typeof message.ready === 'boolean' && message.config === this.signature()) { this.ready[from] = message.ready; this.readyConfig[from] = message.config; this.changed(); return; }
    if (message.type === 'config' && from === this.lobby!.ownerId && !this.active() && Number.isInteger(message.tier) && message.tier >= 1 && message.tier <= R.RAID_MAX_TIER && typeof message.ranked === 'boolean') {
      this.tier = message.tier; this.ranked = message.ranked; this.config = this.signature(); this.ready = {}; this.readyConfig = {}; this.changed(); return;
    }
    if (message.type.startsWith('bond')) { this.bondMessage(from, message); return; }
    if (message.type === 'start') { this.receiveStart(from, message); return; }
    if (!this.raid || message.runId !== this.raid.runId || !this.participants().includes(from)) return;
    if (message.type === 'abort' && (from === this.runOwner || this.host())) { this.abort('队伍已中止本场副本，不提交天梯成绩。', this.host()); return; }
    if (message.type === 'snapshot' && from === this.runOwner) { this.receiveSnapshot(message); return; }
    if ((message.type === 'plan' || message.type === 'withdraw') && this.host() && this.phase === 'planning' && message.round === this.raid.round && message.hash === R.stateHash(this.raid)) {
      if (message.type === 'withdraw') delete this.plans[from];
      else { if (message.action?.steamId !== from || !R.validateAction(this.raid, message.action).ok) return; this.plans[from] = copy(message.action); }
      this.broadcast('plans', { runId: this.raid.runId, round: this.raid.round, plans: this.plans }); this.tryResolve(); this.changed(); return;
    }
    if (message.type === 'plans' && from === this.runOwner && this.phase === 'planning' && message.round === this.raid.round && message.plans && typeof message.plans === 'object') {
      const accepted: Record<string, R.RaidAction> = {};
      for (const id of Object.keys(message.plans)) { const action = message.plans[id]; if (id !== action?.steamId || !R.validateAction(this.raid, action).ok) return; accepted[id] = copy(action); }
      // Keep an in-flight local choice until the host receives it; stale host previews cannot rewrite intent.
      if (this.plans[this.me()]) accepted[this.me()] = this.plans[this.me()]; this.plans = accepted; this.changed(); return;
    }
    if (message.type === 'round' && from === this.runOwner && this.phase === 'planning' && message.round === this.raid.round) {
      try {
        if (message.prevHash !== R.stateHash(this.raid) || !Array.isArray(message.actions)) throw new Error('mismatch');
        const own = this.plans[this.me()], received = message.actions.find((action: R.RaidAction) => action.steamId === this.me());
        if (own && !same(own, received)) throw new Error('changed_action');
        const next = R.resolveRound(this.raid, message.actions); if (R.stateHash(next) !== message.hash) throw new Error('mismatch');
        this.raid = next; this.barrier = { stage: 'round', round: message.round, hash: message.hash, acks: new Set() }; this.phase = 'confirming';
        this.send(this.runOwner, 'ack', { runId: next.runId, ...this.barrier, acks: undefined }); this.changed();
      } catch { this.abort('副本回放校验不一致，本场已中止。', true); }
      return;
    }
    if (message.type === 'ack' && this.host() && this.barrier && message.stage === this.barrier.stage && message.round === this.barrier.round && message.hash === this.barrier.hash) { this.barrier.acks.add(from); this.release(); return; }
    if (message.type === 'release' && from === this.runOwner && this.barrier && message.stage === this.barrier.stage && message.round === this.barrier.round && message.hash === this.barrier.hash) this.release();
  }
  private receiveStart(from: string, message: any): void {
    if (from !== this.lobby!.ownerId || this.active() || !message.initial || this.completed.has(message.initial.runId) || typeof message.ranked !== 'boolean') return;
    if (!this.options.canJoin()) {
      this.ready[this.status.steamId] = false; delete this.readyConfig[this.status.steamId];
      if (token(message.initial.runId)) this.send(from, 'abort', { runId: message.initial.runId });
      this.notice('当前战斗尚未结束，未加入副本；请结算保存后重新准备。'); return;
    }
    try {
      const ids = this.members();
      if (!same([...message.readyIds].sort(), ids) || ids.length < 2 || ids.some(id => !this.ready[id] || this.readyConfig[id] !== this.signature()) || message.ranked !== this.ranked || message.initial.tier !== this.tier) throw new Error('unready');
      const initial: R.RaidCreateInput = message.initial;
      if (!Array.isArray(initial.players) || !same(initial.players.map(player => player.steamId).sort(), ids)) throw new Error('roster');
      for (const player of initial.players) if (!same(player, this.profiles[player.steamId]?.loadout)) throw new Error('changed_loadout');
      if (message.ranked && initial.seasonId !== this.season()) throw new Error('season');
      const state = R.createRaid(initial); if (R.stateHash(state) !== message.hash) throw new Error('hash');
      this.raid = state; this.runRanked = message.ranked; this.runOwner = from; this.runLobby = this.lobby!.lobbyId; this.plans = {}; this.missing = {}; this.phase = 'confirming';
      this.barrier = { stage: 'start', round: 0, hash: message.hash, acks: new Set() };
      for (const id of ids) this.lastSeen[id] = this.now();
      this.send(from, 'ack', { runId: state.runId, stage: 'start', round: 0, hash: message.hash }); this.changed();
    } catch { this.notice('房主的阵容、准备状态或规则不匹配，未开始副本。'); }
  }

  private pause(id: string): void {
    if (!this.active() || !this.participants().includes(id)) return;
    if (id === this.runOwner && id !== this.status.steamId) { this.abort('房主连接中断，本场已中止。', false); return; }
    if (this.missing[id] === undefined) { this.missing[id] = this.now(); this.options.onNotice('队员连接中断，副本暂停并等待60秒重连。'); }
    this.phase = 'paused'; this.resumeSent = false; this.changed();
  }
  private checkConnections(): void {
    if (!this.raid || !this.runLobby) return;
    if (this.lobby && this.lobby.ownerId !== this.runOwner) { this.abort('房主已退出，本场已中止。', false); return; }
    if (!this.online()) { if (this.runOwner === this.status.steamId) this.abort('房主已离线，本场已中止。', true); else this.pause(this.status.steamId); return; }
    for (const id of this.participants()) if (id !== this.status.steamId && (!this.members().includes(id) || this.now() - (this.lastSeen[id] ?? this.now()) >= 10000)) this.pause(id);
  }
  private resumeEveryone(): void {
    if (!this.raid) return;
    this.resumeSent = true; this.phase = 'confirming';
    const text = R.serializeRaid(this.raid), stateHash = R.stateHash(this.raid), transferId = `resume-${++this.counter}`, size = 10000, total = Math.ceil(text.length / size);
    if (total > 105) { this.abort('副本记录过大，无法安全重连。', true); return; }
    this.barrier = { stage: 'resume', round: this.raid.roundsCompleted, hash: stateHash, acks: new Set([this.status.steamId]) }; this.barrierAt = this.now();
    for (const id of this.participants()) if (id !== this.status.steamId) for (let index = 0; index < total; index++) this.send(id, 'snapshot', { runId: this.raid.runId, transferId, index, total, data: text.slice(index * size, (index + 1) * size), hash: stateHash, ranked: this.ranked });
  }
  private receiveSnapshot(message: any): void {
    if (!this.raid || !['paused', 'confirming', 'planning'].includes(this.phase) || !token(message.transferId) || !Number.isInteger(message.index) || !Number.isInteger(message.total) || message.total < 1 || message.total > 105 || message.index < 0 || message.index >= message.total || typeof message.data !== 'string' || message.data.length > 10000 || typeof message.ranked !== 'boolean' || message.ranked !== this.ranked) return;
    if (!this.transfer || this.transfer.id !== message.transferId) this.transfer = { id: message.transferId, parts: Array(message.total).fill(''), total: message.total, hash: message.hash, ranked: message.ranked, at: this.now() };
    const transfer = this.transfer; if (transfer.total !== message.total || transfer.hash !== message.hash) return;
    transfer.parts[message.index] = message.data; if (transfer.parts.some(part => !part)) return;
    try {
      const restored = R.deserializeRaid(transfer.parts.join(''));
      if (restored.runId !== this.raid.runId || !same(restored.initial, this.raid.initial) || restored.roundsCompleted < this.raid.roundsCompleted || restored.roundsCompleted > this.raid.roundsCompleted + 1 || R.stateHash(restored) !== transfer.hash || this.raid.history.some((round, index) => restored.history[index]?.hash !== round.hash)) throw new Error('mismatch');
      if (restored.roundsCompleted > this.raid.roundsCompleted) {
        const choice = this.plans[this.me()], received = restored.history[this.raid.roundsCompleted].actions.find(action => action.steamId === this.me());
        if (choice ? !same(choice, received) : received && (!this.runRanked || this.now() < this.deadline)) throw new Error('changed_action');
      }
      this.raid = restored; this.phase = 'confirming'; this.plans = {}; this.transfer = null;
      this.barrier = { stage: 'resume', round: restored.roundsCompleted, hash: transfer.hash, acks: new Set() };
      this.send(this.runOwner, 'ack', { runId: restored.runId, stage: 'resume', round: restored.roundsCompleted, hash: transfer.hash }); this.changed();
    } catch { this.abort('重连副本记录校验失败，本场已中止。', true); }
  }
  private abort(reason: string, send: boolean): void {
    if (send && this.raid && this.lobby) this.broadcast('abort', { runId: this.raid.runId });
    this.raid = null; this.phase = 'idle'; this.plans = {}; this.ready = {}; this.readyConfig = {}; this.barrier = null; this.missing = {}; this.transfer = null; this.resumeSent = false; this.runOwner = ''; this.runLobby = ''; this.notice(reason);
  }
  cancelRaid(): void { if (this.raid) this.abort('已中止本场副本，不提交天梯成绩。', true); }

  private isFriend(id: string): boolean {
    const result = this.bridge.request('friends'); if (!result.ok || !Array.isArray(result.data?.friends)) return false;
    this.friends = result.data.friends.filter((friend: any) => realId(friend.steamId)); return this.friends.some(friend => friend.steamId === id);
  }
  offerBond(id: string): void {
    if (!this.lobby || !this.members().includes(id) || id === this.status.steamId || !this.profiles[id] || !this.isFriend(id)) { this.notice('只能与同房间的Steam好友确认结缘。'); return; }
    this.offered = { steamId: id, nonce: this.nextId('bond') };
    this.send(id, 'bondOffer', { nonce: this.offered.nonce }); this.changed();
  }
  acceptBond(): void {
    const pending = this.pendingBond; if (!pending || !this.isFriend(pending.steamId) || !this.profiles[pending.steamId]) return;
    if (this.commitBond(pending.steamId, pending.nonce)) this.send(pending.steamId, 'bondAccept', { nonce: pending.nonce });
    this.pendingBond = null; this.changed();
  }
  dismissBond(): void { if (this.pendingBond) this.send(this.pendingBond.steamId, 'bondDecline', { nonce: this.pendingBond.nonce }); this.pendingBond = null; this.changed(); }
  private commitBond(id: string, nonce: string): boolean {
    const key = `${id}:${nonce}`; if (this.seenBonds.has(key)) return false;
    const profile = this.profiles[id]; if (!profile || !this.isFriend(id)) return false;
    this.keep(this.seenBonds, key);
    const accepted = this.options.onBond({ steamId: id, name: profile.loadout.name, pet: copy(profile.pet) });
    if (!accepted) this.notice('该旅伴已结缘，或对方伙伴资料无效。'); return accepted;
  }
  private bondMessage(from: string, message: any): void {
    if (!token(message.nonce) || !this.profiles[from] || !this.isFriend(from)) return;
    if (message.type === 'bondOffer' && !this.seenBonds.has(`${from}:${message.nonce}`)) { this.pendingBond = { steamId: from, nonce: message.nonce }; this.changed(); }
    else if (message.type === 'bondAccept' && this.offered?.steamId === from && this.offered.nonce === message.nonce) { this.commitBond(from, message.nonce); this.offered = null; this.changed(); }
    else if (message.type === 'bondDecline' && this.offered?.steamId === from && this.offered.nonce === message.nonce) { this.offered = null; this.options.onNotice('好友暂未接受结缘。'); this.changed(); }
  }

  private async uploadScore(state: R.RaidState): Promise<void> {
    const score = R.scoreRaid(state); if (!score || !this.online() || state.seasonId !== this.season()) { this.notice('本场已完成，但Steam连接或赛季时间不可用，未提交天梯成绩。'); return; }
    try {
      const ownerSteamId = this.status.steamId, name = raidBoardName(state.seasonId, state.playerCount), filename = `raid-${ownerSteamId}-${hash(state.runId)}.json`;
      let ugcHandle: string | undefined;
      try {
        const content = JSON.stringify({ version: R.RAID_VERSION, ownerSteamId, boardName: name, score, ranked: true, replay: R.exportRaidReplay(state) });
        if (content.length > 1024 * 1024) throw new Error('too_large');
        await this.request('cloud.write', { name: filename, content }); const shared = await this.request('cloud.share', { name: filename });
        if (typeof shared?.handle !== 'string' || !/^\d+$/.test(shared.handle)) throw new Error('missing_handle');
        ugcHandle = shared.handle;
      } catch { /* Steam leaderboards work independently of Remote Storage quota and attachment availability. */ }
      if (!this.online() || this.status.steamId !== ownerSteamId || state.seasonId !== this.season()) throw new Error('account_or_season_changed');
      await this.request('leaderboard.upload', { name, score, details: [1, state.tier, state.roundsCompleted, state.deaths, state.playerCount], ...(ugcHandle ? { ugcHandle } : {}) });
      this.options.onNotice(ugcHandle ? '本场成绩已提交Steam荣誉榜。' : '成绩已提交，阵容详情暂不可用。'); this.changed();
    } catch { this.notice('本场已完成，但Steam天梯提交失败；本地奖励不受影响。'); }
  }
  async queryBoard(count: number, scope: 'global' | 'friends', seasonOffset = 0): Promise<void> {
    this.lastError = ''; this.detailSequence++;
    if (!this.checkOnline()) return;
    const seasonId = this.season(seasonOffset);
    if (!seasonId || !Number.isInteger(count) || count < 1 || count > 4 || !['global', 'friends'].includes(scope)) { this.boardError = '赛季时间或榜单参数无效。'; this.changed(); return; }
    const sequence = ++this.boardSequence, context = { name: raidBoardName(seasonId, count), count, seasonId };
    this.boardBusy = true; this.boardError = ''; this.selectedReplay = null; this.boardContext = context; this.changed();
    try { const data = await this.request('leaderboard.query', { name: context.name, scope, start: 1, end: 50 }); if (sequence !== this.boardSequence) return; this.boardEntries = Array.isArray(data?.entries) ? data.entries.filter((entry: any) => realId(entry.steamId) && Number.isInteger(entry.score)).slice(0, 100) : []; }
    catch { if (sequence === this.boardSequence) { this.boardEntries = []; this.boardError = 'Steam榜单读取失败，请稍后重试。'; this.notice(this.boardError); } }
    finally { if (sequence === this.boardSequence) { this.boardBusy = false; this.changed(); } }
  }
  async readEntry(row: any): Promise<void> {
    const context = { ...this.boardContext }, sequence = this.boardSequence, detail = ++this.detailSequence;
    this.selectedReplay = null; this.boardError = ''; this.lastError = ''; this.boardBusy = false;
    if (!row || !this.boardEntries.some(entry => entry.steamId === row.steamId && entry.score === row.score && entry.ugcHandle === row.ugcHandle) || !row.ugcHandle) { this.boardError = '该成绩尚无可验证的阵容详情。'; this.changed(); return; }
    this.boardBusy = true; this.changed();
    try {
      const data = await this.request('ugc.read', { handle: row.ugcHandle });
      if (sequence !== this.boardSequence || detail !== this.detailSequence) return;
      if (data?.ownerId !== row.steamId || typeof data.content !== 'string' || data.content.length > 1024 * 1024) throw new Error('owner');
      const file = JSON.parse(data.content);
      if (file.version !== R.RAID_VERSION || file.ownerSteamId !== row.steamId || file.boardName !== context.name || file.score !== row.score || file.ranked !== true) throw new Error('file');
      const state = R.replayRaid(file.replay), details = [1, state.tier, state.roundsCompleted, state.deaths, state.playerCount];
      if (state.status !== 'won' || state.playerCount !== context.count || state.seasonId !== context.seasonId || R.scoreRaid(state) !== row.score || !state.players.some(player => player.steamId === row.steamId) || !same(row.details?.slice(0, 5), details)) throw new Error('score');
      this.selectedReplay = state;
    } catch { if (sequence === this.boardSequence && detail === this.detailSequence) { this.selectedReplay = null; this.boardError = '成绩详情与Steam身份、分数或战斗回放不匹配。'; this.notice(this.boardError); } }
    finally { if (sequence === this.boardSequence && detail === this.detailSequence) { this.boardBusy = false; this.changed(); } }
  }
}
