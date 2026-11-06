/** Native Steamworks boundary. Browsers and missing Steam stay playable offline. */
export type SteamResult<T = any> = { ok: boolean; data?: T; error?: string; requestId?: number };
export type SteamEvent = { type: string; [key: string]: any };
export type SteamIdentity = { available: boolean; steamId: string; name: string; appId: number; online?: boolean; overlayEnabled: boolean; error?: string };
type NativeSteam = { request(op: string, args: string): string; poll(): string };
const unavailable: SteamIdentity = { available: false, steamId: '', name: '', appId: 5500200, overlayEnabled: false, error: 'steam_unavailable' };
function native(): NativeSteam | undefined { return (globalThis as any).__dicekinSteam; }

export const steam = {
  request<T = any>(op: string, args: any = {}): SteamResult<T> {
    const bridge = native();
    if (!bridge || typeof bridge.request !== 'function') return op === 'status'
      ? { ok: true, data: { ...unavailable } as T } : { ok: false, error: 'steam_unavailable' };
    try {
      const result = JSON.parse(bridge.request(op, JSON.stringify(args)));
      if (!result || typeof result.ok !== 'boolean' || (result.requestId !== undefined &&
          (!Number.isSafeInteger(result.requestId) || result.requestId < 1))) return { ok: false, error: 'invalid_steam_response' };
      return result;
    } catch { return { ok: false, error: 'steam_bridge_failed' }; }
  },
  poll(): SteamEvent[] {
    try {
      const bridge = native();
      if (!bridge || typeof bridge.poll !== 'function') return [];
      const events = JSON.parse(bridge.poll());
      return Array.isArray(events) ? events.filter(e => e && typeof e === 'object' && typeof e.type === 'string') : [];
    } catch { return []; }
  },
};
