import {Node,Label,EventTouch,Sprite,SpriteFrame,Texture2D,UITransform} from 'cc';
import {PCUI,PC} from './PCUI';
import {PCFriendHelp,HelpFriend,HelpIncoming} from './PCFriendHelp';
import {HelpTarget} from './PCFriendHelpState';
import {steam} from './PCSteam';
import * as M from './PMModel';

interface Options {ui:PCUI;root:Node;help:PCFriendHelp;close:()=>void;time:(ms:number)=>string;now:()=>number|null;egg:(parent:Node,rarity:M.EggRarity,x:number,y:number,size:number)=>void;}
/** A bounded modal, using the same paper, green actions and input barrier as the hatchery. */
export class PCFriendHelpUI {
  layer:Node;private card:Node;private rows:Node|null=null;private textures:Texture2D[]=[];private frames:SpriteFrame[]=[];private portraits:Sprite[]=[];
  private friends:HelpFriend[]=[];private page=0;private stamp='';private timer:Label|null=null;private status:Label|null=null;
  constructor(private o:Options,public readonly target?:HelpTarget,private incoming?:HelpIncoming){
    const u=o.ui;this.layer=u.node(o.root,'friend-help-modal',0,0,1600,900);
    const shade=u.panel(this.layer,800,450,4000,2000,PC.navy,175,0);
    for(const event of [Node.EventType.TOUCH_START,Node.EventType.TOUCH_END])shade.on(event,(e:EventTouch)=>e.propagationStopped=true);
    this.card=u.panel(this.layer,800,450,900,680,PC.paper,255,24);u.line(this.card,0,-302,80,PC.gold);
    u.text(this.card,incoming?'帮助好友加速':'邀请好友加速',0,-260,32,PC.ink,820,58).isBold=true;
    if(target){this.friends=o.help.friends();this.picker();}else this.details();
    u.reveal(shade,0,0,.12);u.reveal(this.card,0,0,.18);
  }
  dispose(){for(const sprite of this.portraits)if(sprite.isValid)sprite.spriteFrame=null;for(const f of this.frames)f.destroy();for(const t of this.textures)t.destroy();this.portraits=[];this.frames=[];this.textures=[];}
  private avatar(parent:Node,f:HelpFriend,x:number,y:number){
    const u=this.o.ui,n=u.panel(parent,x,y,42,42,PC.green,255,8),r=steam.request('friend.avatar',{steamId:f.steamId}).data;
    if(!r||!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width<1||r.height<1||r.width>64||r.height>64||!Array.isArray(r.rgba)||r.rgba.length!==r.width*r.height*4){u.text(n,Array.from(f.name||'?')[0],0,0,22,'#fffaf0',38,36);return;}
    const texture=new Texture2D();texture.reset({width:r.width,height:r.height,format:Texture2D.PixelFormat.RGBA8888});texture.uploadData(new Uint8Array(r.rgba));
    const frame=new SpriteFrame();frame.texture=texture;frame.packable=false;const sprite=n.addComponent(Sprite);sprite.spriteFrame=frame;sprite.sizeMode=Sprite.SizeMode.CUSTOM;n.getComponent(UITransform)!.setContentSize(42,42);this.textures.push(texture);this.frames.push(frame);this.portraits.push(sprite);
  }
  private picker(){
    const {ui:u,help}=this.o;
    if(this.rows)u.dispose(this.rows);this.dispose();this.rows=u.node(this.card,'help-friends',0,0);const p=this.rows;
    const pending=help.pending(this.target!);this.stamp=pending?.token||'';
    u.text(p,'每位好友每日可邀请一次，孵化与交配共用。',0,-204,18,PC.muted,804,56);
    this.timer=u.text(p,'',0,222,17,PC.muted,790,32);
    if(pending){
      const f=this.friends.find(f=>f.steamId===pending.friendId);if(f)this.avatar(p,f,0,-110);
      u.text(p,f?.name||pending.friendId,0,-57,26,PC.ink,740,44);
      u.text(p,'等待好友帮助',0,11,26,PC.green,760,48);u.text(p,'加速需要双方在线运行游戏',0,68,18,PC.muted,780,52);
      u.button(p,'help-cancel','取消邀请',0,146,360,50,()=>{if(help.cancel(this.target!))this.picker();},PC.paper);
    }else{
      const pages=Math.max(1,Math.ceil(this.friends.length/5));this.page=Math.min(this.page,pages-1);
      this.friends.slice(this.page*5,this.page*5+5).forEach((f,i)=>{
        const y=-129+i*64;const row=u.panel(p,0,y,808,58,'#edf2e7',255,10);this.avatar(row,f,-370,0);
        u.text(row,f.name,-166,-9,19,PC.ink,328,30,'left');u.text(row,f.inGame?'正在游戏':f.state>0?'在线':'离线',-166,14,14,PC.muted,328,24,'left');
        u.button(row,'help-invite-'+f.steamId,help.used(f.steamId)?'今日已邀请':'邀请好友加速',254,0,260,44,()=>{if(help.invite(this.target!,f.steamId))this.picker();},PC.green,f.state>0&&!help.used(f.steamId),help.used(f.steamId)?'今日已邀请':f.state===0?'好友暂时无法连接':'');
      });
      if(!this.friends.length)u.text(p,'暂无可邀请的 Steam 好友',0,0,24,PC.muted,760,60);
      if(pages>1){u.button(p,'help-prev','←',-120,184,64,38,()=>{this.page--;this.picker();},PC.paper,this.page>0);u.text(p,(this.page+1)+' / '+pages,0,184,17,PC.muted,110,30);u.button(p,'help-next','→',120,184,64,38,()=>{this.page++;this.picker();},PC.paper,this.page+1<pages);}
    }
    u.button(p,'dialog-confirm','返回',0,280,340,54,this.o.close,PC.green);this.refresh();
  }
  private details(){
    const {ui:u}=this.o,r=this.incoming!;
    u.text(this.card,r.name,0,-193,25,PC.ink,790,42).isBold=true;
    this.o.egg(this.card,(r.rarity||'normal') as M.EggRarity,0,-78,115);
    this.status=u.text(this.card,'',0,33,24,PC.green,800,68);this.timer=u.text(this.card,'',0,97,25,PC.ink,700,40);
    u.text(this.card,'帮助后立即完成等待',0,155,18,PC.muted,800,40);
    u.button(this.card,'dialog-close','稍后',-206,280,340,54,this.o.close,PC.paper);
    u.button(this.card,'dialog-confirm','帮助好友加速',206,280,340,54,()=>{if(r.phase==='ready')this.o.help.accept(r.token);else if(r.phase==='offline')this.o.help.retry(r.token);else if(['done','expired'].includes(r.phase)){this.o.help.dismiss(r.token);this.o.close();}},PC.green);
    this.refresh();
  }
  refresh(){
    if(!this.layer.isValid)return;
    if(this.target){
      const pending=this.o.help.pending(this.target);if((pending?.token||'')!==this.stamp){this.picker();return;}
      const seconds=Math.ceil(this.o.help.resetRemaining()/1000),pad=(n:number)=>String(n).padStart(2,'0');
      this.timer!.string='次数刷新 · '+(Number.isFinite(seconds)?pad(Math.floor(seconds/3600))+':'+pad(Math.floor(seconds/60)%60)+':'+pad(seconds%60):'--:--:--');
      for(const f of this.friends){const used=this.o.help.used(f.steamId);this.o.ui.set('help-invite-'+f.steamId,used?'今日已邀请':'邀请好友加速',f.state>0&&!used,used?'今日已邀请':f.state===0?'好友暂时无法连接':'');}
      return;
    }
    const r=this.incoming!,phase=r.phase;
    this.status!.string=phase==='ready'?(r.target?.kind==='breed'?'交配培育':'孵化'):phase==='done'?'已帮助好友':phase==='expired'?'帮助请求已失效':phase==='offline'?'好友暂时无法连接':'正在连接好友…';
    const now=this.o.now();this.timer!.string=phase==='ready'&&now!==null?this.o.time(Math.max(0,r.expiresAt!-now)):'';
    this.o.ui.set('dialog-confirm',phase==='ready'?'帮助好友加速':phase==='offline'?'重试':['done','expired'].includes(phase)?'返回':'正在连接好友…',['ready','offline','done','expired'].includes(phase));
  }
}
