import * as M from './PMModel';

export type HelpTarget = {kind:'hatch'|'breed'; id:string; startedAt:number; slot:number};
export type HelpInvite = {token:string; friendId:string; day:number; target:HelpTarget; expiresAt:number; status:'reserved'|'sent'|'done'|'cancelled'};
export type FriendHelpLedger = {version:1; latestDay:number; invites:HelpInvite[]};
export const HELP_DAY = 86400000;
export const helpToken = (v:unknown):v is string => typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
export const helpSteamId = (v:unknown):v is string => typeof v==='string'&&/^\d{17}$/.test(v)&&v>='76561197960265729'&&v<='76561202255233023';
const uint=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
export const sameHelpTarget=(a:HelpTarget,b:HelpTarget)=>a.kind===b.kind&&a.id===b.id&&a.startedAt===b.startedAt&&a.slot===b.slot;
export function validHelpTarget(t:any):t is HelpTarget {
  return !!t&&['hatch','breed'].includes(t.kind)&&typeof t.id==='string'&&t.id.length>0&&t.id.length<=200&&uint(t.startedAt)&&(t.kind==='hatch'?[0,1].includes(t.slot):t.slot===-1);
}
/** Optional field for old profiles; malformed ledgers cannot silently reset daily limits. */
export function validFriendHelp(raw:unknown,owner:string):boolean {
  if(raw===undefined)return true;
  const l=raw as FriendHelpLedger;
  if(!l||l.version!==1||!uint(l.latestDay)||!Array.isArray(l.invites)||l.invites.length>4000)return false;
  const tokens=new Set<string>(),daily=new Set<string>();
  return l.invites.every(r=>{
    if(!r||!helpToken(r.token)||!helpSteamId(r.friendId)||r.friendId===owner||!uint(r.day)||r.day>l.latestDay||!validHelpTarget(r.target)||!uint(r.expiresAt)||r.expiresAt<=r.target.startedAt||!['reserved','sent','done','cancelled'].includes(r.status)||tokens.has(r.token)||daily.has(r.friendId+':'+r.day))return false;
    tokens.add(r.token);daily.add(r.friendId+':'+r.day);return true;
  })&&(owner!=='local'||!l.invites.length);
}
export function helpTarget(game:M.State,kind:'hatch'|'breed',slot=-1):HelpTarget|null {
  const task=kind==='hatch'?game.incubators?.[slot]:game.breeding;
  return task?{kind,id:kind==='hatch'?(task as M.Incubation).eggId:(task as M.Breeding).id,startedAt:task.startedAt,slot:kind==='hatch'?slot:-1}:null;
}
export function helpTask(game:M.State,target:HelpTarget){
  const current=helpTarget(game,target.kind,target.slot);
  if(!current||!sameHelpTarget(current,target))return null;
  return target.kind==='hatch'?game.incubators![target.slot]!:game.breeding!;
}
/** Only the targeted timer changes. Claiming (including consuming parents) stays explicit. */
export function completeHelpTask(game:M.State,target:HelpTarget,now:number):M.State {
  const task=helpTask(game,target);
  if(!task||!uint(now)||now<task.startedAt||now>=task.readyAt)return game;
  if(target.kind==='hatch')return M.grantHatchAd(game,target.slot,target.id,true,now);
  const next=M.grantBreedingAd(game,target.id,true,now);
  if(next!==game)(next.breeding as M.Breeding&{pcHelpCompletedAt?:number}).pcHelpCompletedAt=now;
  return next;
}
