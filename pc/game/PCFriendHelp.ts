import * as M from './PMModel';
import {PCSocialState} from './PCSocial';
import {steam,SteamEvent} from './PCSteam';
import {HelpTarget,HelpInvite,FriendHelpLedger,HELP_DAY,helpToken,helpSteamId,validHelpTarget,sameHelpTarget,helpTask,completeHelpTask} from './PCFriendHelpState';

export type HelpFriend={steamId:string;name:string;state:number;inGame:boolean};
export type HelpIncoming={owner:string;token:string;name:string;target?:HelpTarget;expiresAt?:number;species?:string;rarity?:string;phase:'loading'|'ready'|'sending'|'done'|'expired'|'offline';retryAt:number;deadline:number};
interface Options {
  owner:string;get:()=>{game:M.State;social:PCSocialState};
  commit:(game:M.State,social:PCSocialState)=>boolean;now:()=>number|null;monotonic:()=>number;
  writable:()=>boolean;safe:()=>boolean;notice:(text:string)=>void;changed:()=>void;bridge?:typeof steam;
}
/** Independent from raid lobbies. One poll owner forwards only help events here. */
export class PCFriendHelp {
  incoming:HelpIncoming[]=[];
  private queue:SteamEvent[]=[];
  private bridge:typeof steam;
  constructor(private o:Options){this.bridge=o.bridge||steam;}
  private time(){const n=this.o.now();return n!==null&&Number.isSafeInteger(n)&&n>=0?n:null;}
  private connected(){const s=this.bridge.request('status').data;return !!s?.available&&s.online!==false&&s.steamId===this.o.owner&&helpSteamId(s.steamId);}
  private ledger():FriendHelpLedger{return this.o.get().social.friendHelp||{version:1,latestDay:0,invites:[]};}
  private persist(ledger:FriendHelpLedger,game=this.o.get().game){if(!this.o.writable()||!this.o.commit(game,{...this.o.get().social,friendHelp:ledger}))return false;this.o.changed();return true;}
  private edit(token:string,status:HelpInvite['status']|null){const l=this.ledger();return this.persist({...l,invites:l.invites.filter(r=>r.token!==token||status!==null).map(r=>r.token===token?{...r,status:status!}:r)});}
  private send(peer:string,payload:any){return this.bridge.request('help.send',{steamId:peer,payload:{v:1,...payload}}).ok;}
  friends():HelpFriend[]{const r=this.bridge.request('friends');return r.ok&&Array.isArray(r.data?.friends)?r.data.friends.filter((f:HelpFriend)=>helpSteamId(f.steamId)&&f.steamId!==this.o.owner).slice(0,1000).sort((a:HelpFriend,b:HelpFriend)=>Number(b.inGame)-Number(a.inGame)||Number(b.state>0)-Number(a.state>0)||a.name.localeCompare(b.name)):[];}
  private friend(id:string){return this.friends().find(f=>f.steamId===id);}
  used(id:string){const n=this.time();return n===null||this.ledger().invites.some(r=>r.friendId===id&&r.day>=Math.floor(n/HELP_DAY));}
  resetRemaining(){const n=this.time();return n===null?NaN:HELP_DAY-n%HELP_DAY;}
  pending(target:HelpTarget){const n=this.time();return this.ledger().invites.find(r=>sameHelpTarget(r.target,target)&&['reserved','sent'].includes(r.status)&&(n===null||r.expiresAt>n));}
  invite(target:HelpTarget,friendId:string):boolean {
    const now=this.time(),task=helpTask(this.o.get().game,target);
    if(!this.connected()){this.o.notice('请先登录 Steam 并保持在线');return false;}
    if(now===null){this.o.notice('等待 Steam 联网校时');return false;}
    if(!this.o.writable()||!this.o.safe()||!task||now<task.startedAt||now>=task.readyAt)return false;
    const friend=this.friend(friendId),day=Math.floor(now/HELP_DAY),l=this.ledger();
    if(!friend||friend.state===0){this.o.notice('好友暂时无法连接');return false;}
    if(day<l.latestDay||this.used(friendId)){this.o.notice('今日已邀请');return false;}
    if(this.pending(target))return false;
    const token=this.bridge.request('help.token').data?.token;
    if(!helpToken(token)){this.o.notice('邀请未发送，请重试');return false;}
    const record:HelpInvite={token,friendId,day,target:{...target},expiresAt:task.readyAt,status:'reserved'};
    // Reserve durably BEFORE notifying Steam. A crash cannot send an uncounted invitation.
    if(!this.persist({version:1,latestDay:day,invites:[...l.invites.filter(r=>r.day>=day-1),record]})){this.o.notice('保存失败，邀请未发送');return false;}
    const sent=this.bridge.request('help.invite',{steamId:friendId,token});
    if(!sent.ok){this.edit(token,null);this.o.notice('邀请未发送，请重试');return false;}
    this.edit(token,'sent');this.o.notice('加速邀请已发送');return true;
  }
  cancel(target:HelpTarget){const r=this.pending(target);if(!r)return true;if(!this.edit(r.token,'cancelled')){this.o.notice('保存失败，请重试');return false;}return true;}
  receive(event:SteamEvent){if(this.queue.length<128)this.queue.push(event);}
  dismiss(token:string){this.incoming=this.incoming.filter(r=>r.token!==token);this.o.changed();}
  accept(token:string):boolean {
    const r=this.incoming.find(i=>i.token===token);
    if(!r||r.phase!=='ready'||!this.connected()||!this.o.safe())return false;
    r.phase='sending';r.deadline=this.o.monotonic()+15000;r.retryAt=0;this.o.changed();this.tick();return true;
  }
  retry(token:string){const r=this.incoming.find(i=>i.token===token);if(r){r.phase='loading';r.deadline=this.o.monotonic()+15000;r.retryAt=0;this.o.changed();}}
  tick(){
    if(!this.queue.length&&!this.incoming.some(r=>r.phase==='loading'||r.phase==='sending'))return;
    const connected=this.connected();
    // Never replace the story state under an in-flight battle snapshot.
    if(connected&&this.o.safe())for(const e of this.queue.splice(0,24))this.event(e);
    const t=this.o.monotonic();
    for(const r of this.incoming){
      if(!['loading','sending'].includes(r.phase))continue;
      if(t>=r.deadline){r.phase='offline';this.o.changed();continue;}
      if(connected&&t>=r.retryAt){r.retryAt=t+2000;this.send(r.owner,{type:r.phase==='sending'?'accept':'inspect',token:r.token});}
    }
  }
  private event(e:SteamEvent){
    if(e.type==='helpInvite'){
      if(!helpSteamId(e.friendId)||e.friendId===this.o.owner||!helpToken(e.token)||this.incoming.some(r=>r.token===e.token))return;
      const f=this.friend(e.friendId);if(!f)return;
      if(this.incoming.length>=16)this.incoming.shift();
      this.incoming.push({owner:e.friendId,token:e.token,name:f.name,phase:'loading',retryAt:0,deadline:this.o.monotonic()+15000});
      this.o.notice('收到好友加速请求');this.o.changed();return;
    }
    const p=e.payload,peer=e.steamId;
    if(e.type!=='helpMessage'||!helpSteamId(peer)||peer===this.o.owner||!p||p.v!==1||!helpToken(p.token))return;
    if(p.type==='inspect'||p.type==='accept'){
      const record=this.ledger().invites.find(r=>r.token===p.token&&r.friendId===peer);
      if(!record)return;const now=this.time();if(now===null)return;
      if(record.status==='done'){this.send(peer,{type:'done',token:p.token});return;}
      const task=helpTask(this.o.get().game,record.target);
      if(record.status==='cancelled'||!task||now>=task.readyAt||now>=record.expiresAt){this.send(peer,{type:'expired',token:p.token});return;}
      if(now<task.startedAt)return;
      if(p.type==='inspect'){
        const g=this.o.get().game,egg=record.target.kind==='hatch'?g.eggs?.find(x=>x.id===record.target.id):null;
        this.send(peer,{type:'details',token:p.token,target:record.target,expiresAt:task.readyAt,species:egg?.affinity||g.breeding?.genes.id,rarity:egg?.rarity||g.breeding?.genes.rarity});return;
      }
      const game=completeHelpTask(this.o.get().game,record.target,now);
      if(game===this.o.get().game)return;
      const l=this.ledger();if(!this.persist({...l,invites:l.invites.map(r=>r.token===p.token?{...r,status:'done'}:r)},game))return;
      this.send(peer,{type:'done',token:p.token});this.o.notice('好友帮助成功，现已可以领取');return;
    }
    const r=this.incoming.find(i=>i.token===p.token&&i.owner===peer);if(!r)return;
    if(p.type==='done'){r.phase='done';this.o.notice('已帮助好友');this.o.changed();}
    else if(p.type==='expired'){r.phase='expired';this.o.changed();}
    else if(p.type==='details'&&r.phase!=='sending'&&r.phase!=='done'&&validHelpTarget(p.target)&&Number.isSafeInteger(p.expiresAt)&&p.expiresAt>p.target.startedAt){
      r.target=p.target;r.expiresAt=p.expiresAt;r.species=typeof p.species==='string'&&M.PET_IDS.includes(p.species as M.PetId)?p.species:undefined;r.rarity=['normal','SR','SSR'].includes(p.rarity)?p.rarity:'normal';r.phase='ready';this.o.changed();
    }
  }
}
