import * as M from './PMModel';
import { PCDexState, recordDex, validDexState } from './PCDex';
import { restoreCooking } from './PCCooking';

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
interface Checkpoint {
  game: M.State;
  dex: PCDexState;
  sequence: number;
}
export interface PCProfileLoad {
  game: M.State | null;
  dex?: PCDexState;
  sequence: number;
  readOnly: boolean;
  error?: string;
}

const key = 'pm.pc-mobile.profile.v1';
const backupKey = key + '.backup';
const error = '无法读取或写入存档，已停止自动保存。';
const failed = (): PCProfileLoad => ({ game: null, sequence: 0, readOnly: true, error });
const validSequence = (value: number) => Number.isSafeInteger(value) && value > 0;

function parse(raw: string | null): Checkpoint | null {
  if (raw === null) return null;
  try {
    const data = JSON.parse(raw);
    if (!data?.game || !data.dex || !validSequence(data.sequence) || !validDexState(data.dex)) return null;
    const cooking = restoreCooking(data.game.pcCooking);
    if (!cooking) return null;
    const game = M.restore(JSON.stringify({ ...data.game, pcCooking: cooking }));
    return game ? { game, dex: data.dex, sequence: data.sequence } : null;
  } catch {
    return null;
  }
}

function current(storage: Storage) {
  const primaryRaw = storage.getItem(key);
  const backupRaw = storage.getItem(backupKey);
  const primary = parse(primaryRaw);
  const backup = parse(backupRaw);
  const best = backup && (!primary || backup.sequence > primary.sequence) ? backup : primary;
  return { primaryRaw, backupRaw, primary, backup, best };
}

export function loadPCProfile(storage: Storage): PCProfileLoad {
  try {
    const { primaryRaw, backupRaw, best } = current(storage);
    if (best) return { ...best, readOnly: false };
    if (primaryRaw !== null || backupRaw !== null) return failed();
    return { game: null, sequence: 0, readOnly: false };
  } catch {
    return failed();
  }
}

export function savePCProfile(storage: Storage, game: M.State, dex: PCDexState, sequence: number): boolean {
  try {
    const { primaryRaw, backupRaw, primary, backup, best } = current(storage);
    if (!validSequence(sequence) || sequence <= (best?.sequence || 0)) return false;
    if (!best && (primaryRaw !== null || backupRaw !== null)) return false;
    const raw = JSON.stringify({ game, dex, sequence });
    if (!parse(raw)) return false;
    if (primary && primaryRaw !== null && (!backup || primary.sequence >= backup.sequence)) storage.setItem(backupKey, primaryRaw);
    else if (!backup) storage.setItem(backupKey, raw);
    storage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

export function startNewPCProfile(storage: Storage): PCProfileLoad {
  try {
    const { primaryRaw, backupRaw, best } = current(storage);
    if (best) return { ...failed(), error: '已找到可用存档，请重试读取。' };
    const game = M.newJourney();
    const record = { game, dex: recordDex(undefined, game), sequence: 1 };
    const raw = JSON.stringify(record);
    if (!parse(raw)) return failed();
    storage.setItem(key + '.before-new.' + Date.now(), JSON.stringify({ primaryRaw, backupRaw }));
    storage.setItem(key, raw);
    return { ...record, readOnly: false };
  } catch {
    return failed();
  }
}
