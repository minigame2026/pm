import * as M from './PMModel';
import {accountSaveKey, isSteamId, newPCSocial, PCSocialState, restorePCSocial} from './PCSocial';
import {restoreCooking} from './PCCooking';

export interface PCProfileStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface PCProfileLoad {
  game: M.State | null;
  social: PCSocialState;
  sequence: number;
  error?: string;
  legacyAvailable: boolean;
  readOnly: boolean;
  recoveredFromBackup?: boolean;
}
export interface PCCloudCandidate {
  raw: string;
  ownerSteamId: string;
  sequence: number;
  game: M.State;
  social: PCSocialState;
  legacyImported: boolean;
}
export interface PCProfileExport { ok: boolean; candidate?: PCCloudCandidate; error?: string }
interface Envelope {
  game: M.State;
  social: PCSocialState;
  sequence: number;
  imported: boolean;
}
interface Current {
  key: string;
  primaryRaw: string | null;
  backupRaw: string | null;
  primary: Envelope | null;
  backup: Envelope | null;
  best: Envelope | null;
}
const LEGACY_KEY = 'pm.pc.creature-dice.v1';
const corruptMessage = '该账号存档及备份无法读取，已停止自动保存。';
const storageMessage = '无法读取或写入存档，已停止自动保存。';
const sequenceValid = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;

function failure(owner: string, error: string, envelope?: Envelope | null): PCProfileLoad {
  return {game:envelope?.game || null, social:envelope?.social || newPCSocial(accountSaveKey(owner)?owner:'local'), sequence:envelope?.sequence || 0, error, legacyAvailable:false, readOnly:true};
}
function modelState(parsed: any): M.State | null {
  const plain = {...parsed};
  const cooking=restoreCooking(plain.pcCooking);
  if(!cooking)return null;
  if(plain.pcCooking!==undefined)plain.pcCooking=cooking;
  delete plain.pcOwner;
  delete plain.pcSocial;
  delete plain.checkpointSequence;
  delete plain.pcLegacyImported;
  return M.restore(JSON.stringify(plain));
}
function parseEnvelope(raw: string | null, owner: string): Envelope | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.pcOwner !== owner || !sequenceValid(parsed.checkpointSequence) || !Object.prototype.hasOwnProperty.call(parsed,'pcSocial') || parsed.pcLegacyImported !== undefined && typeof parsed.pcLegacyImported !== 'boolean') return null;
    const social = restorePCSocial(parsed.pcSocial,owner), game = modelState(parsed);
    return social && game ? {game,social,sequence:parsed.checkpointSequence,imported:parsed.pcLegacyImported===true} : null;
  } catch { return null; }
}
function parseLegacy(raw: string | null): M.State | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    // An account envelope copied into the old key must never become an account-free import.
    if (!parsed || Object.prototype.hasOwnProperty.call(parsed,'pcOwner') || Object.prototype.hasOwnProperty.call(parsed,'pcSocial') || Object.prototype.hasOwnProperty.call(parsed,'pcLegacyImported')) return null;
    return modelState(parsed);
  } catch { return null; }
}
function current(storage: PCProfileStorage, owner: string): Current {
  const key = accountSaveKey(owner);
  if (!key) throw new Error('Invalid profile identity');
  const primaryRaw = storage.getItem(key), backupRaw = storage.getItem(key+'.backup');
  const primary = parseEnvelope(primaryRaw,owner), backup = parseEnvelope(backupRaw,owner);
  const best = backup && (!primary || backup.sequence>primary.sequence) ? backup : primary;
  return {key,primaryRaw,backupRaw,primary,backup,best};
}
const damaged = (value: Current) => !value.best && (value.primaryRaw !== null || value.backupRaw !== null);
function importAllowed(value: Envelope | null): boolean {
  if (!value) return true;
  const g = value.game;
  return !value.imported && !value.social.friends.length && !value.social.claimedRaidRuns.length && !!g.journey && !g.journey.legacy && g.journey.stage!=='done' && !g.pets?.length && !g.eggs?.length && !g.clearedMaps?.length && g.wins===0 && g.step===1 && g.phase==='encounter';
}
function payload(owner: string, value: Envelope): string {
  return JSON.stringify({...value.game,pcOwner:owner,pcSocial:value.social,checkpointSequence:value.sequence,...(value.imported?{pcLegacyImported:true}:{})});
}
/** The primary value is one atomic storage write containing both gameplay and reward receipts. */
function commit(storage: PCProfileStorage, owner: string, existing: Current, value: Envelope): boolean {
  if (!sequenceValid(value.sequence) || value.sequence <= (existing.best?.sequence || 0)) return false;
  const raw = payload(owner,value);
  if (!parseEnvelope(raw,owner)) return false;
  // Do not back up a corrupt or older primary over the newest valid same-account checkpoint.
  if (existing.primary && (!existing.backup || existing.primary.sequence>=existing.backup.sequence)) storage.setItem(existing.key+'.backup',existing.primaryRaw!);
  else if (!existing.backup) storage.setItem(existing.key+'.backup',raw);
  storage.setItem(existing.key,raw);
  return true;
}
function loaded(value: Envelope, recovered: boolean, legacyAvailable: boolean): PCProfileLoad {
  return {game:value.game,social:value.social,sequence:value.sequence,legacyAvailable,readOnly:false,...(recovered?{recoveredFromBackup:true}:{})};
}
/** Steam accounts only read their own envelope. Only the local profile auto-migrates the old key. */
export function loadPCProfile(storage: PCProfileStorage, ownerSteamId: string): PCProfileLoad {
  if (!accountSaveKey(ownerSteamId)) return failure(ownerSteamId,'Steam 账号无效，已停止自动保存。');
  try {
    const existing = current(storage,ownerSteamId);
    if (damaged(existing)) return failure(ownerSteamId,corruptMessage);
    const legacyRaw = storage.getItem(LEGACY_KEY), legacy = parseLegacy(legacyRaw);
    if (existing.best) return loaded(existing.best,existing.best!==existing.primary,!!legacy&&importAllowed(existing.best));
    if (ownerSteamId==='local' && legacyRaw!==null) {
      if (!legacy) return failure(ownerSteamId,'旧本机存档无法读取，已停止自动保存。');
      const value: Envelope = {game:legacy,social:newPCSocial('local'),sequence:1,imported:true};
      try {
        // The source is never rewritten, even after successful migration.
        if (storage.getItem(existing.key+'.legacy-source')===null) storage.setItem(existing.key+'.legacy-source',legacyRaw);
        if (!commit(storage,ownerSteamId,existing,value)) return failure(ownerSteamId,storageMessage,value);
        return loaded(value,false,false);
      } catch { return failure(ownerSteamId,storageMessage,value); }
    }
    return {game:null,social:newPCSocial(ownerSteamId),sequence:0,legacyAvailable:!!legacy,readOnly:false};
  } catch { return failure(ownerSteamId,storageMessage); }
}
/** sequence is the proposed NEW number. Stale checkpoints and corrupt profiles cannot overwrite data. */
export function savePCProfile(storage: PCProfileStorage, ownerSteamId: string, game: M.State, social: PCSocialState, sequence: number): boolean {
  if (!accountSaveKey(ownerSteamId) || !sequenceValid(sequence) || !restorePCSocial(social,ownerSteamId)) return false;
  try {
    const existing = current(storage,ownerSteamId);
    if (damaged(existing)) return false;
    // The caller must load/migrate existing local data before its first new-envelope write.
    if (!existing.best && ownerSteamId==='local' && storage.getItem(LEGACY_KEY)!==null) return false;
    return commit(storage,ownerSteamId,existing,{game,social,sequence,imported:existing.best?.imported || false});
  } catch { return false; }
}
/** Explicit one-time legacy import. Existing played profiles and corrupt envelopes remain untouched. */
export function importLegacyPCProfile(storage: PCProfileStorage, ownerSteamId: string): PCProfileLoad {
  if (!accountSaveKey(ownerSteamId)) return failure(ownerSteamId,'Steam 账号无效，无法导入。');
  try {
    const existing = current(storage,ownerSteamId);
    if (damaged(existing)) return failure(ownerSteamId,corruptMessage);
    if (!importAllowed(existing.best)) return failure(ownerSteamId,'此账号已有游戏进度或已导入过旧存档，无法覆盖。',existing.best);
    const legacyRaw = storage.getItem(LEGACY_KEY), legacy = parseLegacy(legacyRaw);
    if (!legacy || legacyRaw===null) return failure(ownerSteamId,'没有可导入的旧本机存档。',existing.best);
    const value: Envelope = {game:legacy,social:newPCSocial(ownerSteamId),sequence:(existing.best?.sequence || 0)+1,imported:true};
    if (storage.getItem(existing.key+'.legacy-source')===null) storage.setItem(existing.key+'.legacy-source',legacyRaw);
    if (!commit(storage,ownerSteamId,existing,value)) return failure(ownerSteamId,storageMessage,existing.best);
    return loaded(value,false,false);
  } catch { return failure(ownerSteamId,storageMessage); }
}

export const PC_CLOUD_MAX_BYTES = 1024 * 1024;
export function profileUTF8Bytes(value: string): number {
  let bytes = 0;
  for (const char of value) { const code = char.codePointAt(0)!; bytes += code<=0x7f?1:code<=0x7ff?2:code<=0xffff?3:4; }
  return bytes;
}
/** A validated, account-bound preview. Restoring always revalidates raw; edited preview fields are ignored. */
export function validateCloudProfile(raw: string, ownerSteamId: string): PCCloudCandidate | null {
  if (!isSteamId(ownerSteamId) || typeof raw!=='string' || profileUTF8Bytes(raw)>PC_CLOUD_MAX_BYTES) return null;
  const value = parseEnvelope(raw,ownerSteamId);
  return value ? {raw,ownerSteamId,sequence:value.sequence,game:value.game,social:value.social,legacyImported:value.imported} : null;
}
/** Read-only: no implicit migration, save, upload, or conflict resolution. */
export function exportPCProfile(storage: PCProfileStorage, ownerSteamId: string): PCProfileExport {
  if (!isSteamId(ownerSteamId)) return {ok:false,error:'请先登录对应 Steam 账号。'};
  try {
    const existing = current(storage,ownerSteamId);
    if (damaged(existing)) return {ok:false,error:corruptMessage};
    if (!existing.best) return {ok:false,error:'此 Steam 账号还没有可上传的本机档案。'};
    const raw = existing.best===existing.primary?existing.primaryRaw!:existing.backupRaw!;
    const candidate = validateCloudProfile(raw,ownerSteamId);
    return candidate?{ok:true,candidate}:{ok:false,error:'档案超出 1 MiB 或无法验证，未上传。'};
  } catch { return {ok:false,error:storageMessage}; }
}
/** Explicit user-confirmed restore. Archive both originals before a single active-primary write. */
export function restoreCloudProfile(storage: PCProfileStorage, ownerSteamId: string, raw: string): PCProfileLoad {
  const candidate = validateCloudProfile(raw,ownerSteamId);
  if (!candidate) return failure(ownerSteamId,'云档案损坏、账号不符或超出大小限制，未恢复。');
  let existing: Current | null = null;
  try {
    existing = current(storage,ownerSteamId);
    let sequence = Math.max(existing.best?.sequence || 0,candidate.sequence)+1;
    const before = JSON.stringify({ownerSteamId,primaryRaw:existing.primaryRaw,backupRaw:existing.backupRaw});
    let beforeKey = '', cloudKey = '', oldBefore: string | null = null, oldCloud: string | null = null;
    // An interrupted restore may have archived originals; retain them and choose another sequence.
    while (true) {
      if (!sequenceValid(sequence)) return failure(ownerSteamId,'档案序号超出范围，未恢复。',existing.best);
      beforeKey=existing.key+'.before-cloud.'+sequence;cloudKey=existing.key+'.cloud-source.'+sequence;
      oldBefore=storage.getItem(beforeKey);oldCloud=storage.getItem(cloudKey);
      if ((oldBefore===null||oldBefore===before) && (oldCloud===null||oldCloud===raw)) break;
      sequence++;
    }
    const value: Envelope = {game:candidate.game,social:candidate.social,sequence,imported:candidate.legacyImported || !!existing.best?.imported};
    const nextRaw = payload(ownerSteamId,value);
    if (!parseEnvelope(nextRaw,ownerSteamId)) return failure(ownerSteamId,'云档案无法恢复，未修改本机。',existing.best);
    if (oldBefore===null) storage.setItem(beforeKey,before);
    if (oldCloud===null) storage.setItem(cloudKey,raw);
    // Do not update the active backup before this write: failure must retain the previous local pair.
    storage.setItem(existing.key,nextRaw);
    return loaded(value,false,false);
  } catch { return failure(ownerSteamId,storageMessage,existing?.best); }
}

/** Explicit fresh-start confirmation only. Preserve unreadable originals before replacing the primary. */
export function startNewPCProfile(storage: PCProfileStorage, ownerSteamId: string): PCProfileLoad {
  if (!accountSaveKey(ownerSteamId)) return failure(ownerSteamId,'Steam 账号无效，已停止自动保存。');
  try {
    const existing=current(storage,ownerSteamId);
    if (existing.best) return failure(ownerSteamId,'已找到可用存档，请重试读取。',existing.best);
    const before=JSON.stringify({ownerSteamId,primaryRaw:existing.primaryRaw,backupRaw:existing.backupRaw,legacyRaw:storage.getItem(LEGACY_KEY),cloudSyncRaw:storage.getItem(existing.key+'.cloud-sync')});
    let serial=1,archiveKey=existing.key+'.before-new.'+serial;
    while (storage.getItem(archiveKey)!==null&&storage.getItem(archiveKey)!==before) archiveKey=existing.key+'.before-new.'+(++serial);
    const value:Envelope={game:M.newJourney(),social:newPCSocial(ownerSteamId),sequence:1,imported:true},raw=payload(ownerSteamId,value);
    if (!parseEnvelope(raw,ownerSteamId)) return failure(ownerSteamId,storageMessage);
    if(storage.getItem(archiveKey)===null)storage.setItem(archiveKey,before);
    // A new local journey has no common ancestor with the cloud. Retain any remote as a conflict.
    storage.setItem(existing.key+'.cloud-sync','null');
    storage.setItem(existing.key,raw);
    return loaded(value,false,false);
  } catch { return failure(ownerSteamId,storageMessage); }
}
