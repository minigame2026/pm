import {steam, SteamIdentity, SteamResult} from './PCSteam';
import {accountSaveKey, isSteamId, newPCSocial} from './PCSocial';
import {PCCloudCandidate, PCProfileExport, PCProfileLoad, PCProfileStorage, exportPCProfile, restoreCloudProfile, validateCloudProfile, loadPCProfile} from './PCProfile';

/** Synchronous native boundary. The caller owns upload/restore confirmation and the candidate preview. */
export interface PCCloudBridge { request<T = any>(operation: string, args?: any): SteamResult<T> }
export type PCCloudResult = PCProfileExport;

export function cloudProfileName(ownerSteamId: string): string | null {
  return isSteamId(ownerSteamId)?'save-'+ownerSteamId+'.json':null;
}
function accountError(ownerSteamId: string, bridge: PCCloudBridge): string | null {
  if (!isSteamId(ownerSteamId)) return '请先登录对应 Steam 账号。';
  try {
    const response = bridge.request<SteamIdentity>('status'), identity = response.data;
    if (!response.ok || !identity?.available || identity.online===false) return 'Steam 当前未联网，云档案未操作。';
    if (identity.steamId!==ownerSteamId || identity.appId!==5500200) return 'Steam 账号已改变，请重启后再操作该账号的云档案。';
    return null;
  } catch { return 'Steam 连接暂不可用，云档案未操作。'; }
}
/** Returns a retained preview only. There is no automatic local overwrite or sequence arbitration. */
export function readCloudProfile(ownerSteamId: string, bridge: PCCloudBridge = steam): PCCloudResult {
  const error = accountError(ownerSteamId,bridge);
  if (error) return {ok:false,error};
  try {
    const response = bridge.request<{content:string}>('cloud.read',{name:cloudProfileName(ownerSteamId)!});
    if (!response.ok) return {ok:false,error:'无法读取 Steam 云档案，请检查连接或确认已有上传记录。'};
    const candidate = validateCloudProfile(response.data?.content!,ownerSteamId);
    return candidate?{ok:true,candidate}:{ok:false,error:'云档案损坏、账号不符或超出大小限制，未改动本机。'};
  } catch { return {ok:false,error:'Steam 云档案读取失败，未改动本机。'}; }
}
/** Call after the player confirms replacement of this account's cloud file. */
export function uploadCloudProfile(storage: PCProfileStorage, ownerSteamId: string, bridge: PCCloudBridge = steam): PCCloudResult {
  const error = accountError(ownerSteamId,bridge);
  if (error) return {ok:false,error};
  const exported = exportPCProfile(storage,ownerSteamId);
  if (!exported.ok || !exported.candidate) return exported;
  try {
    const name = cloudProfileName(ownerSteamId)!;
    const previous = bridge.request<{content:string}>('cloud.read',{name});
    if (previous.ok) {
      const old = validateCloudProfile(previous.data?.content!,ownerSteamId);
      if (!old) return {ok:false,error:'现有云档案无法验证，请先保留原文件；未覆盖云档案。'};
      const prefix = accountSaveKey(ownerSteamId)!+'.archive-cloud-upload.'+old.sequence+'.'+exported.candidate.sequence;
      let serial = 0, key = prefix, archived = storage.getItem(key);
      while (archived!==null && archived!==old.raw) { key=prefix+'.'+(++serial); archived=storage.getItem(key); }
      if (archived===null) storage.setItem(key,old.raw);
    } else if (previous.error!=='cloud_file_missing') return {ok:false,error:'无法读取现有云档案，未执行覆盖；请检查连接后重试。'};
    const response = bridge.request('cloud.write',{name,content:exported.candidate.raw});
    if(response.ok)rememberCloud(storage,ownerSteamId,exported.candidate.raw,exported.candidate.raw);
    return response.ok?exported:{ok:false,error:'Steam 云档案上传失败，本机档案保持不变。'};
  } catch { return {ok:false,error:'旧云档案备份或上传失败，未改动本机档案。'}; }
}
/** Call only after explicit restore confirmation; recheck the current Steam account at that moment. */
export function restoreCloudCandidate(storage: PCProfileStorage, ownerSteamId: string, candidate: PCCloudCandidate, bridge: PCCloudBridge = steam): PCProfileLoad {
  const error = accountError(ownerSteamId,bridge);
  if (error) return {game:null,social:newPCSocial(isSteamId(ownerSteamId)?ownerSteamId:'local'),sequence:0,error,legacyAvailable:false,readOnly:true};
  const restored=restoreCloudProfile(storage,ownerSteamId,candidate?.raw);
  if(!restored.error){const local=exportPCProfile(storage,ownerSteamId).candidate;if(local)rememberCloud(storage,ownerSteamId,candidate.raw,local.raw);}
  return restored;
}

function rememberCloud(storage:PCProfileStorage,owner:string,remote:string,local:string){
  // A failed marker write causes a conservative conflict on next sync, never blind replacement.
  try{storage.setItem(accountSaveKey(owner)!+'.cloud-sync',JSON.stringify({remote,local}));}catch{}
}
export type AutoCloudResult={status:'current'|'uploaded'|'restored'|'conflict'|'unavailable';profile?:PCProfileLoad};
/** Compare against the last common snapshot, not device-local sequence numbers or wall clocks.
 * Download only before gameplay starts. During play, a changed remote waits for explicit resolution.
 */
export function syncCloudProfile(storage:PCProfileStorage,owner:string,atStartup=false,bridge:PCCloudBridge=steam):AutoCloudResult{
  if(accountError(owner,bridge))return {status:'unavailable'};
  try{
    const loaded=loadPCProfile(storage,owner);if(loaded.readOnly)return {status:'unavailable'};
    const local=exportPCProfile(storage,owner).candidate;
    if(loaded.game&&!local)return {status:'unavailable'}; // Oversize/unexportable is not an empty machine.
    const response=bridge.request<{content:string}>('cloud.read',{name:cloudProfileName(owner)!});
    if(!response.ok&&response.error!=='cloud_file_missing')return {status:'unavailable'};
    const remote=response.ok?validateCloudProfile(response.data?.content!,owner):null;
    if(response.ok&&!remote)return {status:'unavailable'};
    let base:{remote:string;local:string}|null=null;
    try{const value=JSON.parse(storage.getItem(accountSaveKey(owner)!+'.cloud-sync')||'null');if(value&&validateCloudProfile(value.remote,owner)&&validateCloudProfile(value.local,owner))base=value;}catch{}
    if(remote&&local?.raw===remote.raw){rememberCloud(storage,owner,remote.raw,local.raw);return {status:'current'};}
    if(remote&&(!local||base?.remote!==remote.raw)){
      if(atStartup&&(!local||local.raw===base?.local)){
        const profile=restoreCloudCandidate(storage,owner,remote,bridge);
        return profile.error?{status:'unavailable'}:{status:'restored',profile};
      }
      return {status:'conflict'};
    }
    if(!local)return {status:'current'};
    // Preserve the previous Steam cache before updating. One rolling backup avoids unbounded autosave archives.
    if(remote)storage.setItem(accountSaveKey(owner)!+'.auto-cloud-backup',remote.raw);
    const write=bridge.request('cloud.write',{name:cloudProfileName(owner)!,content:local.raw});
    if(!write.ok)return {status:'unavailable'};
    rememberCloud(storage,owner,local.raw,local.raw);return {status:'uploaded'};
  }catch{return {status:'unavailable'};}
}
