import {Node, Label, Graphics, UITransform, UIOpacity, Vec3, tween, view} from 'cc';
import * as M from './PMModel';
import {PCUI, PC, hex} from './PCUI';
import {PCOnline} from './PCOnline';
import {RaidAction, RaidActionKind, RaidState, RaidEvent, validateAction} from './PCRaid';
import {PCSocialState, RAID_EGGS, RAID_REWARD_RULES} from './PCSocial';
import {steam} from './PCSteam';
import {pcBattleAmbience} from './PCBattleAmbience';
import {attachPetMotion, PCPetMotion, PCBattleEffects} from './PCPetMotion';
import {PC_RAID_SCENE, pcSceneCover} from './PCBattleScenes';
import {currentLocale} from './PCLocale';

export interface OnlineUIHost {
  ui:PCUI; parent:Node; online:PCOnline; game:()=>M.State; social:()=>PCSocialState;
  pet:(parent:Node,p:M.Pet,x:number,y:number,size:number,back?:boolean)=>Node;
  battlePet?:(parent:Node,p:M.Pet,x:number,y:number,size:number,back?:boolean)=>Node;
  egg:(parent:Node,r:M.EggRarity,x:number,y:number,size?:number)=>Node;
  navigate:(route:string)=>void; notice:(message:string)=>void; redeem:()=>void; claim:()=>boolean;
  reduced:()=>boolean; fast?:()=>boolean;
}
/** PC native UI; persistent battle slots update without rebuilding the whole battlefield. */
export class PCOnlineUI {
  private root:Node; private stamp=''; private page=0; private section:string;
  private count=1; private scope:'friends'|'global'='friends'; private seasonOffset=0;
  private labels:Record<string,Label>={}; private bars:Record<string,Node>={};
  private actors:Record<string,{node:Node;uid:string;species:string;motion:PCPetMotion}>={}; private round=-1;
  private action:RaidActionKind='attack'; private target='boss'; private ally=''; private petIndex=0;
  private pendingEvents:RaidEvent[]=[]; private eventAt=0; private nextState:RaidState|null=null;
  private animationTime=0;
  private scheduled:{at:number;run:()=>void}[]=[]; private deathPending=new Set<string>();
  private fx:PCBattleEffects|null=null; private floats=new Set<Node>();
  private raidScenery:Node|null=null; private raidViewport='';
  private selectedRow:any=null; private alive=true; private theme:Node|null=null;
  constructor(private h:OnlineUIHost,section:string){this.section=section;this.root=h.ui.node(h.parent,'steam-'+section,0,0,1600,900);this.refresh(true);}
  dispose(){this.alive=false;this.pendingEvents=[];this.scheduled=[];this.nextState=null;this.fx?.dispose();this.fx=null;for(const n of this.floats)if(n.isValid)this.ui.dispose(n);this.floats.clear();}
  get animating(){return this.pendingEvents.length>0||this.scheduled.length>0||this.nextState!==null;}
  private get ui(){return this.h.ui;} private get o(){return this.h.online;}
  private get me(){return this.o.status?.steamId||'local';}
  private clear(){this.pendingEvents=[];this.scheduled=[];this.nextState=null;this.deathPending.clear();this.fx?.dispose();this.fx=null;this.floats.clear();this.raidScenery=null;this.raidViewport='';for(const n of [...this.root.children])this.ui.dispose(n);this.labels={};this.bars={};this.actors={};}
  private text(key:string,value:string,x:number,y:number,size=18,color=PC.ink,w=300,h=32,align:'left'|'center'|'right'='center'){
    return this.labels[key]=this.ui.text(this.root,value,x,y,size,color,w,h,align);
  }
  private title(value:string,sub:string){this.text('title',value,650,96,42,PC.ink,724,62,'left').isBold=true;this.text('sub',sub,650,148,17,PC.muted,724,32,'left');this.ui.line(this.root,920,188,1264);}
  private button(id:string,label:string,x:number,y:number,w:number,h:number,run:()=>void,enabled=true,reason='',primary=false){const battle=this.section==='raidbattle',kind=battle?(id==='raid-attack'?'battle-die':/^raid-(guard|heal|boost|taunt)$/.test(id)?'battle-command':'battle-tag'):'normal';return this.ui.button(this.root,id,label,x,y,w,h,run,primary?PC.green:PC.paper,enabled,reason,kind);}
  private onlineStatus(){return this.o.status?.available&&this.o.status?.online!==false;}
  private offline(){return this.o.status?.available?'Steam 当前离线':this.o.status?.error==='steam_init_failed'?'Steam 连接未就绪，请确认登录与游戏访问权限':'启动 Steam 并登录后，即可与好友一起冒险';}
  private actionCall(fn:()=>unknown){try{fn();}catch(e){this.h.notice(String((e as Error)?.message||e));}}
  refresh(force=false){if(!this.alive||!this.root.isValid)return;
    if(this.section==='raidbattle'){this.refreshBattle(force);return;}
    const social=this.h.social(),o=this.o;
    const stamp=JSON.stringify([this.section,o.status,o.friends,o.lobby,o.profiles,o.ready,o.tier,o.ranked,o.phase,o.raid?.runId,o.pendingBond,o.pendingInvite,o.boardEntries,o.boardBusy,o.boardError,o.lastError,o.selectedReplay?.runId,this.page,this.count,this.scope,this.seasonOffset,social.friends.length,social.raidFragments]);
    if(!force&&stamp===this.stamp)return;this.stamp=stamp;this.clear();
    if(this.section==='social')this.social();else if(this.section==='raids')this.lobby();else this.ladder();
  }
  tick(dt=0){if(!this.alive||!this.root.isValid)return;this.animationTime+=Math.max(0,dt)*1000;this.refresh();if(this.section!=='raidbattle')return;this.layoutRaidScene();
    const now=this.animationTime;
    // Semantic contacts run once, in order. Scene disposal clears the entire queue.
    for(const job of this.scheduled.filter(job=>job.at<=now)){this.scheduled.splice(this.scheduled.indexOf(job),1);job.run();}
    if(this.pendingEvents.length&&now>=this.eventAt){const event=this.pendingEvents.shift()!;this.eventAt=now+this.playEvent(event);}
    if(!this.pendingEvents.length&&!this.scheduled.length&&this.nextState&&now>=this.eventAt){const state=this.nextState;this.nextState=null;this.syncBattle(state);}
  }
  private social(){const p=this.root,o=this.o,s=this.h.social();this.title('旅伴','结缘的伙伴，带来新的相遇');
    this.text('identity',this.onlineStatus()?o.status.name+' · Steam 在线':this.offline(),1280,148,16,PC.green,450,30,'right');
    this.ui.panel(p,638,490,650,540,PC.paper,255,22);this.ui.panel(p,1275,490,530,540,PC.paper,255,22);
    this.text('friends-heading','Steam 好友',470,252,24,PC.ink,260,38,'left');
    this.button('steam-refresh','刷新',837,252,160,36,()=>this.o.refreshFriends(),this.onlineStatus());
    const friends=(o as any).friends||[],pages=Math.max(1,Math.ceil(friends.length/5));this.page=Math.min(this.page,pages-1);
    if(!friends.length)this.text('friends-empty',this.onlineStatus()?'好友上线后，可以邀请他们来结缘。':'好友列表需要 Steam 连接',638,448,20,PC.muted,570,80);
    friends.slice(this.page*5,this.page*5+5).forEach((friend:any,i:number)=>{const y=330+i*76,bond=s.friends.some(f=>f.steamId===friend.steamId),present=!!o.profiles[friend.steamId];
      this.ui.glyph(p,'partners',359,y,27,PC.green);this.text('friend-name-'+i,friend.name,551,y-13,20,PC.ink,315,30,'left');
      this.text('friend-status-'+i,bond?'已结缘':present?'正在同一营地':friend.inGame?'正在游戏中':'尚未到访',551,y+17,14,PC.muted,315,25,'left');
      this.button('friend-'+i,bond?'已结缘':present?'结缘':'邀请',854,y,116,44,()=>present?this.o.offerBond(friend.steamId):this.openInvite(),!bond,this.onlineStatus()?'':'需要 Steam 连接',present);
    });
    this.button('prev','←',566,718,56,32,()=>{this.page--;this.refresh(true);},this.page>0);this.text('friend-page',(this.page+1)+' / '+pages,638,718,15,PC.muted,80,25);this.button('next','→',710,718,56,32,()=>{this.page++;this.refresh(true);},this.page+1<pages);
    this.text('bond-title','好友专属蛋',1275,262,27,PC.ink,460,42).isBold=true;this.h.egg(p,'SSR',1275,386,136);
    this.text('bond-number',String(s.friends.length)+' 位旅伴',1275,501,31,PC.green,460,44);
    this.text('bond-rate','每位旅伴 · 每24小时30%赠蛋',1275,552,17,PC.muted,470,34);this.text('bond-pool','收集 54 种好友专属形态',1275,585,17,PC.muted,470,30);
    if(o.pendingBond){this.text('bond-request','收到结缘邀请',1275,629,19,PC.green,470,30);this.button('bond-accept','接受结缘',1208,686,210,48,()=>this.o.acceptBond(),true,'',true);this.button('bond-dismiss','稍后',1410,686,120,48,()=>this.o.dismissBond());}
    else this.button('steam-invite',o.lobby?'邀请好友到营地':'打开好友营地',1275,678,360,54,()=>this.openInvite(),this.onlineStatus(),this.offline(),true);
    this.button('legacy-postcards','拜访码',410,807,180,46,()=>this.h.navigate('postcards'));
    this.button('steam-store','商店页面',611,807,180,46,()=>this.actionCall(()=>{const r=steam.request('overlay.store');if(!r.ok)this.h.notice('请先启动并登录 Steam');}),this.onlineStatus());
    this.button('to-raids','一起挑战副本 →',1335,807,300,50,()=>this.h.navigate('raids'),true,'',true);
  }
  private openInvite(){this.actionCall(()=>{if(!this.o.lobby)this.o.createRoom();else this.o.invite();});}
  private lobby(){const p=this.root,o=this.o;this.title('多人副本','熔冠巢穴');
    this.ui.cropImage(p,PC_RAID_SCENE,617,479,620,542);this.h.pet(p,{id:'dragon',rarity:'SSR',faces:[]},618,557,320);
    const shade=this.ui.hud(p,617,649,620,202,224);this.ui.text(shade,'熔冠巨龙',0,-58,31,'#fff6df',540,48).isBold=true;
    this.ui.text(shade,'撕咬 · 蓄力吐息 · 幼龙召唤',0,-9,17,'#f5e6c5',550,32);this.ui.text(shade,'首次通关：熔冠龙专属蛋',0,37,20,'#ffe0a1',550,34);
    this.text('raid-fragments','龙鳞碎片 '+(this.h.social().raidFragments['molten-crown']||0)+' / '+RAID_REWARD_RULES.redeemFragments,490,796,17,PC.muted,350,30,'left');
    this.button('redeem-raid','兑换专属蛋',792,796,210,48,()=>this.h.redeem(),(this.h.social().raidFragments['molten-crown']||0)>=RAID_REWARD_RULES.redeemFragments,'通关副本收集龙鳞碎片');
    const members=o.lobby?.members||[],isHost=o.lobby?.ownerId===this.me;
    this.text('room-title',o.lobby?'好友队伍  '+members.length+' / 4':'召集你的旅伴',1220,244,27,PC.ink,515,42,'left');
    this.text('room-state',this.onlineStatus()?(o.lobby?isHost?'你是房主':'等待房主开始':'Steam 好友邀请 · 2–4人'):this.offline(),1220,286,16,PC.muted,515,34,'left');
    for(let i=0;i<4;i++){const member=members[i],profile=member?o.profiles[member.steamId]:null,n=this.ui.panel(p,1250,363+i*87,536,75,PC.paper,255,15);
      if(member){if(profile?.pet)this.h.pet(n,profile.pet,-212,30,65);else this.ui.glyph(n,'partners',-212,0,32,PC.muted);
        this.ui.text(n,member.name,-25,-13,20,PC.ink,300,30,'left');this.ui.text(n,!profile?'等待伙伴资料':o.ready[member.steamId]?'已准备':'选择伙伴后准备',-25,16,14,PC.muted,300,24,'left');this.ui.badge(n,member.steamId===o.lobby!.ownerId?'房主':'队员',201,0,68);}
      else{this.ui.glyph(n,'partners',-212,0,27,PC.muted);this.ui.text(n,'等待旅伴',-22,0,18,PC.muted,300,30,'left');}}
    this.button('raid-tier-down','−',1020,696,48,40,()=>o.setTier(Math.max(1,o.tier-1)),!o.lobby||isHost);this.text('raid-tier','第 '+o.tier+' 阶',1140,696,22,PC.ink,160,38);this.button('raid-tier-up','＋',1250,696,48,40,()=>o.setTier(Math.min(1000,o.tier+1)),!o.lobby||isHost);
    this.button('raid-ranked',o.ranked?'天梯挑战':'普通挑战',1415,696,180,40,()=>{if((o as any).setRanked)(o as any).setRanked(!o.ranked);else {o.ranked=!o.ranked;o.setTier(o.tier);}this.refresh(true);},!o.lobby||isHost,'天梯挑战每轮准备限时30秒');
    if(o.raid&&!['idle','complete'].includes(o.phase)){this.button('primary','继续当前挑战 →',1250,775,530,56,()=>this.h.navigate('raidbattle'),true,'',true);}
    else if(!o.lobby){this.button('create-room','创建好友房',1110,775,250,56,()=>this.openInvite(),this.onlineStatus(),this.offline(),true);this.button('solo-trial','单人试炼',1390,775,250,56,()=>{this.actionCall(()=>o.startSolo(o.tier));if(o.raid)this.h.navigate('raidbattle');});}
    else{this.button('invite-room','邀请',1031,775,108,50,()=>o.invite(),this.onlineStatus());this.button('room-ready',o.ready[this.me]?'取消准备':'准备',1160,775,128,50,()=>o.setReady(!o.ready[this.me]),!!o.profiles[this.me]);
      this.button('primary','开始挑战',1390,775,250,56,()=>{this.actionCall(()=>o.startRaid());if(o.raid)this.h.navigate('raidbattle');},isHost&&members.length>=2&&members.every(m=>!!o.profiles[m.steamId]&&o.ready[m.steamId]),'所有队员准备后由房主开始',true);this.button('leave-room','离开队伍',1410,845,180,35,()=>o.leave());}
    if(o.pendingInvite)this.button('join-invite','接受好友邀请',1140,845,230,35,()=>o.join(o.pendingInvite!),true,'',true);
  }
  private ladder(){const p=this.root,o=this.o;this.title('赛季天梯','更高的阶层，更漂亮的一战');
    [1,2,3,4].forEach((n,i)=>this.button('board-size-'+n,n===1?'单人':n+'人',356+i*123,235,110,42,()=>{this.count=n;this.fetchBoard();},true,'',this.count===n));
    this.button('board-friends','好友',887,235,110,42,()=>{this.scope='friends';this.fetchBoard();},true,'',this.scope==='friends');this.button('board-global','全球',1024,235,140,42,()=>{this.scope='global';this.fetchBoard();},true,'',this.scope==='global');
    this.button('board-season',this.seasonOffset?'上一赛季':'当前赛季',1210,235,196,42,()=>{this.seasonOffset=this.seasonOffset?0:1;this.fetchBoard();});this.button('board-refresh','刷新',1440,235,150,42,()=>this.fetchBoard(),this.onlineStatus());
    this.ui.panel(p,699,526,796,486,PC.paper,255,18);this.ui.panel(p,1331,526,422,486,PC.paper,255,18);
    this.text('table-head','名次       驯兽师                                    阶层 / 回合',701,316,16,PC.muted,744,32,'left');
    const rows=o.boardEntries||[],pages=Math.max(1,Math.ceil(rows.length/7));this.page=Math.min(this.page,pages-1);
    if(!rows.length)this.text('board-empty',!this.onlineStatus()?this.offline():o.boardBusy?'正在读取成绩…':o.boardError||'还没有成绩，开始第一场挑战吧',699,510,21,PC.muted,690,110);
    rows.slice(this.page*7,this.page*7+7).forEach((r:any,i:number)=>{const detail=r.details||[],button=this.button('board-row-'+i,'',699,375+i*54,746,46,()=>{this.selectedRow=r;o.readEntry(r);},true,'',this.selectedRow?.steamId===r.steamId);
      this.ui.text(button,String(r.rank),-330,0,20,PC.ink,66,30);this.ui.text(button,r.name,-66,0,20,PC.ink,420,30,'left');this.ui.text(button,(detail[1]||'?')+' 阶 · '+(detail[2]||'?')+' 回合',262,0,18,PC.green,210,30);});
    const run=o.selectedReplay;if(run){this.text('entry-title','通关队伍',1331,316,24,PC.ink,370,40);run.players.forEach((player,i)=>{const pet=player.pets[player.activePet],y=395+i*82;
        this.h.pet(p,{id:(M.PET_IDS.includes(pet.species as M.PetId)?pet.species:'dragon') as M.PetId,faces:[]},1191,y+29,72);this.text('entry-player-'+i,player.name,1373,y-18,18,PC.ink,268,28,'left');this.text('entry-pet-'+i,pet.name||pet.species,1373,y+7,15,PC.muted,268,24,'left');this.text('entry-dice-'+i,'骰面 '+pet.faces.join(' / '),1373,y+31,13,PC.muted,268,22,'left');});
      this.text('entry-summary',run.tier+' 阶  ·  '+run.roundsCompleted+' 回合\n'+run.deaths+' 次阵亡',1331,734,17,PC.green,370,50);
    }else this.text('entry-empty',this.selectedRow?(o.boardError||o.lastError||'正在读取通关记录…'):'选择一条成绩\n查看当时的宠物与队伍',1331,505,20,PC.muted,350,100);
    this.button('prev','←',395,813,70,36,()=>{this.page--;this.refresh(true);},this.page>0);this.text('board-page',(this.page+1)+' / '+pages,490,813,17,PC.muted,100,30);this.button('next','→',585,813,70,36,()=>{this.page++;this.refresh(true);},this.page+1<pages);
    this.text('board-note','阶层 ＞ 回合 ＞ 阵亡',866,813,16,PC.muted,400,32);this.button('board-challenge','前往挑战 →',1331,813,350,50,()=>this.h.navigate('raids'),true,'',true);
  }
  private fetchBoard(){this.selectedRow=null;this.page=0;this.o.queryBoard(this.count,this.scope,this.seasonOffset);this.refresh(true);}
  private bar(id:string,x:number,y:number,w:number){const n=this.ui.node(this.root,'health-'+id,x,y,w,10);n.addComponent(Graphics);this.bars[id]=n;return n;}
  private setHP(id:string,hp:number,max:number){if(this.labels['hp-'+id])this.labels['hp-'+id].string=Math.max(0,hp)+' / '+max;const n=this.bars[id];if(!n?.isValid)return;const g=n.getComponent(Graphics)!;g.clear();g.fillColor=hex('#d2d9ce');g.roundRect(-92,-4,184,8,4);g.fill();if(hp>0){g.fillColor=hex(hp/max<.3?PC.red:PC.green);g.roundRect(-92,-4,184*Math.min(1,hp/max),8,4);g.fill();}}
  private raidArt(player:any,x:number,y:number,size:number){const q=player.pets[player.activePet],source=this.h.game().pets?.find(v=>v.uid===q.uid),pet=source||{id:(M.PET_IDS.includes(q.species)?q.species:'fox') as M.PetId,faces:[],uid:q.uid};
    const actor=(this.h.battlePet||this.h.pet)(this.root,pet,x,y,size,true),motion=actor.getComponent(PCPetMotion)||attachPetMotion(actor,{size,facing:1,reduced:this.h.reduced});this.actors[player.steamId]={node:actor,uid:q.uid,species:pet.id,motion};return actor;}
  private layoutRaidScene(){if(!this.raidScenery?.isValid)return;const visible=view.getVisibleSize(),stamp=visible.width+':'+visible.height;if(stamp===this.raidViewport)return;this.raidViewport=stamp;
    const size=this.ui.art.size(PC_RAID_SCENE),cover=pcSceneCover(size.width,size.height,visible.width,visible.height);this.raidScenery.getComponent(UITransform)!.setContentSize(cover.width,cover.height);this.raidScenery.setPosition(cover.x,cover.y);}
  private buildBattle(s:RaidState){this.clear();this.round=s.roundsCompleted;const p=this.root;
    this.raidScenery=this.ui.artImage(p,PC_RAID_SCENE,800,450,1600,900);this.raidScenery.name='raid-scenery';this.layoutRaidScene();this.theme=this.ui.node(p,'raid-atmosphere',800,450);pcBattleAmbience(this.theme,1,790,900,this.h.reduced(),1800);
    this.ui.battlePlate(p,800,51,480,36);this.text('round','',800,51,18,'#fff5dc',450,32);
    const meal=(this.h.game() as any).pcCooking?.active;if(meal){this.ui.hud(p,800,92,330,28,205);this.text('meal-status','料理加成 · 剩余 '+meal.remaining+' 场',800,92,14,'#fff2ce',310,25);}
    this.button('raid-back','返回营地',170,51,280,42,()=>this.h.navigate('home'));this.button('raid-abort','退出挑战',1400,51,300,42,()=>{this.o.cancelRaid();this.h.navigate('raids');});
    const boss=s.enemies[0];const actor=(this.h.battlePet||this.h.pet)(p,{id:'dragon',rarity:'SSR',faces:[]},1195,600,310);this.actors.boss={node:actor,uid:'boss',species:'dragon',motion:actor.getComponent(PCPetMotion)||attachPetMotion(actor,{size:310,facing:-1,reduced:this.h.reduced})};
    this.ui.battlePlate(p,1232,146,412,100);this.text('boss-name',boss.name,1232,114,26,'#fff5dc',380,38).isBold=true;this.text('hp-boss','',1232,151,17,'#fff5dc',230,28);this.bar('boss',1232,184,200);
    this.ui.battlePlate(p,1180,240,590,42,'#d38d6c');this.text('intent','',1180,240,19,'#ffdf9d',554,38);
    this.ui.battlePlate(p,1180,291,590,30);this.text('next-intent','',1180,291,15,'#fff5dc',554,27);
    s.players.forEach((player,i)=>{const x=195+i*210,y=650-i*21;this.raidArt(player,x,y,i===0?245:210);
      const tile=this.button('ally-'+i,'',x,361,194,92,()=>{this.ally=player.steamId;this.syncActions();});this.ui.text(tile,player.name,0,-26,17,'#fff5dc',174,28);this.text('hp-'+player.steamId,'',x,365,15,'#fff5dc',180,25);this.bar(player.steamId,x,390,184);this.text('threat-'+player.steamId,'',x,417,14,'#fff8e5',190,26);
      this.text('ready-'+player.steamId,'',x,y+25,15,'#fff4d5',210,26);
    });
    const shade=this.ui.node(p,'raid-command-shade',800,900),sg=shade.addComponent(Graphics);for(let i=0;i<20;i++){sg.fillColor=hex('#102328',Math.max(0,145-i*7));sg.rect(-900,i*10,1800,10);sg.fill();}
    const me=s.players.find(v=>v.steamId===this.me)||s.players[0];me.pets.forEach((q,i)=>{const n=this.button('raid-switch-'+i,'',70+i*116,799,103,106,()=>{this.action='switch';this.petIndex=i;this.syncActions();});this.h.pet(n,{id:q.species as M.PetId,faces:[]},0,20,72);this.ui.text(n,'候补 '+(i+1),0,40,13,'#fff5dc',95,24);});
    const die=this.button('raid-attack','',930,777,220,200,()=>{this.action='attack';this.syncActions();});this.ui.artImage(die,'attack-die-a',0,-22,115);this.text('die','',930,755,32,PC.ink,50,44).isBold=true;const attackTag=this.ui.battlePlate(die,0,69,180,34,'#d99072');this.ui.text(attackTag,'攻击',0,0,21,'#fff5dc',160,30);
    const actions:[RaidActionKind,string,string][]=[['guard','guard-shield','守护'],['heal','heal-potion','治疗'],['boost','power-potion','强化'],['taunt','guard-shield','挑衅']];
    actions.forEach(([kind,key,label],i)=>{const n=this.button('raid-'+kind,'',1128+i*132,735,112,112,()=>{this.action=kind;this.syncActions();});this.ui.artImage(n,key,0,-15,64);this.ui.combatText(n,label,0,34,'#fff5dc',17,100);if(kind==='heal'||kind==='boost')this.labels['stock-'+kind]=this.ui.battleStock(n,'',-38,-38);else this.text('stock-'+kind,'',1168+i*132,689,14,'#fff5dc',45,24);});
    this.button('primary','确认行动',1340,838,450,52,()=>{if(this.o.plans[this.me])this.o.withdraw();else this.actionCall(()=>this.o.submit(this.selectedAction()));},true,'',true);
    this.text('action-hint','',1340,884,16,'#fff5dc',450,28);this.text('battle-log','',425,712,20,'#fff2ce',740,38);
    this.button('target-boss','巨龙',1134,650,150,42,()=>{this.target='boss';this.syncActions();});this.button('target-add','幼龙',1351,650,150,42,()=>{const add=this.o.raid?.enemies.find(e=>e.kind==='minion'&&e.hp>0);if(add){this.target=add.id;this.syncActions();}},false);
    const fxLayer=this.ui.node(p,'raid-contact-effects',0,0,1600,900);this.fx=new PCBattleEffects(fxLayer,this.h.reduced);this.syncBattle(s);
  }
  private refreshBattle(force=false){const s=this.o.raid;if(!s){if(this.stamp!=='empty'){this.clear();this.stamp='empty';this.title('挑战结束','返回副本选择下一场挑战');this.button('primary','返回副本',920,470,360,60,()=>this.h.navigate('raids'),true,'',true);}return;}
    if(force||this.stamp!==s.runId){this.stamp=s.runId;this.buildBattle(s);return;}
    if(!this.animating&&s.roundsCompleted!==this.round){this.round=s.roundsCompleted;this.nextState=s;this.pendingEvents=this.h.reduced()?[]:[...s.lastEvents];this.eventAt=this.animationTime;if(!this.pendingEvents.length){this.nextState=null;this.syncBattle(s);}}
    this.syncActions();
  }
  private later(ms:number,run:()=>void){this.scheduled.push({at:this.animationTime+ms,run});}
  private floating(target:Node,text:string,color:string){if(!target.isValid||!text)return;const local=this.root.getComponent(UITransform)!.convertToNodeSpaceAR(target.worldPosition),key='combat-pop-'+target.uuid,stack=Array.from(this.floats).filter(n=>n.name===key).length%2,n=this.ui.node(this.root,key,Math.max(155,Math.min(1445,local.x+(stack?32:0))),-local.y-195-stack*86,300,140),amount=this.ui.impactText(n,text,0,0,color,/^[+-]?\d+$/.test(text)?60:36,286);this.floats.add(n);this.ui.animateImpact(n,amount,()=>this.floats.delete(n));}
  private ensureMinion(id:string){if(this.actors[id])return;const enemy=this.o.raid?.enemies.find(e=>e.id===id&&e.kind==='minion');if(!enemy)return;
    const index=this.o.raid!.enemies.filter(e=>e.kind==='minion').findIndex(e=>e.id===id),x=1380+(index%2)*108,y=575-(index%2)*52;
    const node=(this.h.battlePet||this.h.pet)(this.root,{id:'dragon',faces:[]},x,y,132);node.setSiblingIndex(3);this.actors[id]={node,uid:id,species:'dragon',motion:node.getComponent(PCPetMotion)||attachPetMotion(node,{size:132,facing:-1,reduced:this.h.reduced})};
  }
  private fall(id:string,factor:number){const actor=this.actors[id];if(!actor?.node.isValid||this.deathPending.has(id))return;this.deathPending.add(id);actor.motion.fall(factor);
    this.later(330*factor,()=>{if(this.actors[id]===actor&&actor.node.isValid)actor.node.active=false;this.deathPending.delete(id);});}
  private contact(e:RaidEvent,factor:number){
    const verb:Record<string,string>={attack:'攻击',damage:'攻击',guard:'守护',heal:'治疗',taunt:'挑衅'},state=this.o.raid!;
    const name=(id:string)=>state.players.find(p=>p.steamId===id)?.name||state.enemies.find(enemy=>enemy.id===id)?.name||id;
    // Localized action labels have explicit separators; never concatenate names with verbs.
    this.labels['battle-log'].string=currentLocale()!=='zh-CN'&&verb[e.kind]&&e.targetId?name(e.actorId)+' · '+verb[e.kind]+' → '+name(e.targetId):e.text;
    if(e.kind==='switch'){const s=this.o.raid!,index=s.players.findIndex(v=>v.steamId===e.actorId),player=s.players[index];if(player){const old=this.actors[e.actorId];if(old)this.ui.dispose(old.node);this.deathPending.delete(e.actorId);const shown={...player,activePet:e.petIndex};this.raidArt(shown,195+index*210,650-index*21,index===0?245:210);}}
    if(e.kind==='summon'&&e.targetId){this.ensureMinion(e.targetId);const add=this.actors[e.targetId];if(add){add.motion.support('boost',factor);this.fx?.cast(add.node,'boost');}}
    const targetId=e.targetId||e.actorId,target=this.actors[targetId];
    if(e.hpAfter!==undefined&&e.targetId){const s=this.o.raid!,pl=s.players.find(v=>v.steamId===e.targetId),enemy=s.enemies.find(v=>v.id===e.targetId);this.setHP(e.targetId,e.hpAfter,pl?pl.pets[e.petIndex??pl.activePet].maxHP:enemy?.maxHP||1);}
    if(!target?.node.isValid)return;
    if(e.kind==='death'){this.fall(targetId,factor);return;}
    if(e.kind==='attack'||e.kind==='damage'){const source=this.actors[e.actorId],type=source?M.PETS[source.species as M.PetId]?.type||'other':'other',allyHit=this.o.raid!.players.some(p=>p.steamId===targetId);target.motion.hurt(factor,(e.amount||0)>=10);this.fx?.hit(target.node,type,(e.amount||0)>=10);this.floating(target.node,e.amount?'-'+e.amount:'格挡',e.amount?(allyHit?'#ffb5ae':'#ffe28b'):'#d6fff1');if(e.hpAfter===0&&!allyHit)this.fall(targetId,factor);}
    else if(['heal','guard','boost','taunt'].includes(e.kind)){const kind=e.kind as 'heal'|'guard'|'boost'|'taunt';const recipient=kind==='taunt'?this.actors[e.actorId]:target;if(recipient)this.fx?.cast(recipient.node,kind);this.floating((recipient||target).node,kind==='heal'?'+'+(e.amount||0):kind==='guard'?'护盾 +'+e.amount:kind==='boost'?'力量 +'+e.amount:'挑衅',kind==='heal'?'#beffdb':PC.gold);}
  }
  private playEvent(e:RaidEvent){const factor=this.h.reduced()?0:this.h.fast?.()?.65:1,source=this.actors[e.actorId],target=this.actors[e.targetId||e.actorId];
    if(!factor){this.contact(e,0);return 0;}
    if(e.kind==='attack'||e.kind==='damage'){
      const group=[e];
      // AOE is one boss motion and one simultaneous contact, including deaths between target events.
      if(e.kind==='damage'&&e.actorId==='boss'&&this.nextState!.roundsCompleted%4===3){while(this.pendingEvents.length){const next=this.pendingEvents[0];if(next.kind==='damage'&&next.actorId==='boss'||next.kind==='death'){group.push(this.pendingEvents.shift()!);}else break;}}
      if(source?.node.isValid){source.motion.strike(target?.node||null,factor);if(target?.node.isValid)this.fx?.trail(source.node,target.node,M.PETS[source.species as M.PetId]?.type||'other',.18*factor);}
      this.later(180*factor,()=>{for(const event of group)this.contact(event,factor);});return 400*factor;
    }
    if(['heal','guard','boost','taunt','charge','enrage'].includes(e.kind)){
      const kind=(e.kind==='charge'||e.kind==='enrage'?'boost':e.kind) as 'heal'|'guard'|'boost'|'taunt';source?.motion.support(kind,factor);
      this.later(80*factor,()=>{this.contact(e,factor);if((e.kind==='charge'||e.kind==='enrage')&&source)this.fx?.cast(source.node,'boost');});return 150*factor;
    }
    this.contact(e,factor);return (e.kind==='switch'?150:e.kind==='death'?40:70)*factor;
  }
  private syncBattle(s:RaidState){const me=s.players.find(p=>p.steamId===this.me)||s.players[0];this.labels.round.string=(s.playerCount===1?'单人试炼':s.playerCount+'人副本')+' · 第'+s.tier+'阶 · 回合 '+s.round;
    this.labels.die.string=String(me.die);this.labels.intent.string=s.bossIntent.label;this.labels['next-intent'].string='下一轮：'+s.nextBossIntent.label;this.setHP('boss',s.enemies[0].hp,s.enemies[0].maxHP);
    if(this.actors.boss&&!this.deathPending.has('boss'))this.actors.boss.node.active=s.enemies[0].hp>0;
    s.players.forEach((player,i)=>{const q=player.pets[player.activePet],actor=this.actors[player.steamId];if(actor?.uid!==q.uid){if(actor)this.ui.dispose(actor.node);this.raidArt(player,195+i*210,650-i*21,i===0?245:210);}
      this.setHP(player.steamId,q.hp,q.maxHP);this.labels['threat-'+player.steamId].string=(s.bossIntent.targetSteamId===player.steamId?'◆ 当前目标 · ':'仇恨 ')+Math.round(s.enemies[0].threat[player.slot]);if(this.actors[player.steamId]&&!this.deathPending.has(player.steamId))this.actors[player.steamId].node.active=q.hp>0;
    });
    const add=s.enemies.find(e=>e.kind==='minion'&&e.hp>0);for(const enemy of s.enemies.filter(e=>e.kind==='minion'&&e.hp>0))this.ensureMinion(enemy.id);
    for(const [id,actor]of Object.entries(this.actors))if(id!=='boss'&&!s.players.some(p=>p.steamId===id))actor.node.active=!!s.enemies.find(e=>e.id===id&&e.hp>0);
    this.ui.set('target-add',add?'幼龙 '+add.hp:'幼龙',!!add);if(!s.enemies.some(e=>e.id===this.target&&e.hp>0))this.target='boss';
    if(s.status!=='planning'){this.labels['battle-log'].string=s.status==='won'?'挑战成功 · '+s.roundsCompleted+' 回合 · '+s.deaths+' 次阵亡':'挑战结束 · 调整队伍再出发';this.labels.intent.string=s.status==='won'?'熔冠巨龙已被击败':'伙伴已全部失去战斗能力';}
    if(this.labels['meal-status']){const meal=(this.h.game() as any).pcCooking?.active;this.labels['meal-status'].string=meal?'料理加成 · 剩余 '+meal.remaining+' 场':'料理加成已用完';}
    this.syncActions();
  }
  private selectedAction():RaidAction {const s=this.o.raid!,me=s.players.find(p=>p.steamId===this.me)||s.players[0];return {steamId:me.steamId,round:s.round,kind:this.action,...(['attack','taunt'].includes(this.action)?{targetId:this.target}:{}),...(['heal','guard'].includes(this.action)?{targetSteamId:this.ally||me.steamId}:{}),...(this.action==='switch'?{petIndex:this.petIndex}:{})};}
  private syncActions(){const s=this.o.raid;if(!s)return;const me=s.players.find(v=>v.steamId===this.me)||s.players[0],can=s.status==='planning'&&this.o.phase==='planning'&&!this.animating,prepared=!!this.o.plans[me.steamId];
    for(const kind of ['attack','guard','heal','boost','taunt'] as RaidActionKind[])this.ui.set('raid-'+kind,'',can&&!prepared,'',this.action===kind?PC.gold:PC.paper);
    if(!this.animating){this.labels['stock-heal'].string=String(me.stocks.heals);this.labels['stock-boost'].string=String(me.stocks.boosts);}
    me.pets.forEach((q,i)=>this.ui.set('raid-switch-'+i,'',can&&!prepared&&q.hp>0&&i!==me.activePet,q.hp<=0?'已阵亡':'换宠消耗本回合',this.action==='switch'&&this.petIndex===i?PC.gold:PC.paper));
    s.players.forEach((pl,i)=>{this.labels['ready-'+pl.steamId].string=this.animating?'':this.o.plans[pl.steamId]?'已准备':'选择行动';this.ui.set('ally-'+i,'',can&&!prepared,'守护/治疗目标',this.ally===pl.steamId?PC.gold:PC.paper);});
    this.ui.set('target-boss','巨龙',can&&!prepared,'',this.target==='boss'?PC.gold:PC.paper);
    const add=s.enemies.find(e=>e.kind==='minion'&&e.hp>0);this.ui.set('target-add',add?'幼龙 '+add.hp:'幼龙',!!add&&can&&!prepared,'',this.target===add?.id?PC.gold:PC.paper);
    if(s.status!=='planning'&&this.o.phase==='complete'&&!this.animating){const pending=s.status==='won'&&s.playerCount>1&&!this.h.social().claimedRaidRuns.includes(s.runId);const c=this.ui.controls.get('primary');if(c)c.run=()=>{if(pending){this.h.claim();this.syncActions();}else this.h.navigate('raids');};this.ui.set('primary',pending?'领取个人奖励':'返回副本',true,'',PC.green);this.labels['action-hint'].string=s.status==='lost'?'调整队伍，再来挑战':s.playerCount===1?'单人试炼不掉落副本专属蛋':pending?'奖励等待保存':'奖励已保存 · 前往孵化';return;}
    const valid=validateAction(s,this.selectedAction());this.ui.set('primary',prepared?'取消准备':this.animating?'战斗结算中':this.o.phase==='paused'?'等待重连':this.o.phase==='confirming'?'同步结果…':'确认行动',can&&(prepared||valid.ok),valid.error||'',PC.green);
    const names:any={attack:'攻击',guard:'守护',heal:'治疗',boost:'强化',taunt:'挑衅',switch:'换宠'},seconds=this.o.planningSeconds();this.labels['action-hint'].string=this.animating?'':!valid.ok?valid.error!:names[this.action]+(seconds!==null?' · '+seconds+'秒':' · Enter 确认');
  }
}
