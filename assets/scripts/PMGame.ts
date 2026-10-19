import { _decorator, Component, Node, Canvas, Camera, UITransform, Graphics, Color, Label, LabelOutline, Sprite,
  SpriteFrame, Texture2D, Rect, Size, EditBox, PageView, Layout, Mask, resources, Layers, view, ResolutionPolicy, EventTouch, tween, Tween, Vec3, UIOpacity, sys, game, Game, profiler } from 'cc';
import { BATTLE_RECTS, PET_FEET } from './BattleArt';
import { EVOLUTION_ART } from './EvolutionArt';
import { REGION_ART } from './RegionArt';
import { REGION_PAD_RECTS } from './RegionPads';
import { HomePeriod, homePeriod, homeArtKey } from './HomeScenery';
import { TYPE_NAMES, typeMultiplier, matchupMultiplier, typedDamage, enemyAttackAmount } from './PMModel';
import { HERO_RECTS } from './HeroArt';
import { TrustedClock } from './TrustedClock';
import { PMAudio } from './PMAudio';
import { DurableCheckpoint } from './DurableCheckpoint';
import { setTimeProvider, gameNow } from './PMModel';
import { syncStamina, staminaRemaining, staminaFullRemaining, enterExpedition, retreatExpedition, grantAdStamina, STAMINA_MAX, EXPEDITION_COST } from './PMModel';
import { HeroId, HEROES, HERO_IDS, STARTERS, newJourney, prepareJourney, chooseHero, chooseStarter, heroFor, heroHealBonus, hatchDuration } from './PMModel';
import { Pet, Sex, petEntry, petName, petBaseHP, formKey, sexSymbol, petSkills, SKILLS, startBreeding, claimBreeding, grantRerollAd } from './PMModel';
import { partyChoices, rankForStage, homeParty, assignPartySlot, MAPS, mapFor, mapStageCount, mapUnlocked, startMap, enemyPet, eggRates, hasActivePet } from './PMModel';
import { RARITIES, EggRarity, rarityName, qualityHP, preferredRarity, unlockedRarities, setPetRarity, skillFor, skillStatus, availableEggs, hatchRemaining, startIncubation, grantHatchAd, claimHatch, acknowledgeHatch } from './PMModel';
import { State, PetId, Action, Egg, PETS, PET_IDS, NEW_PET_IDS, fresh, act, hp, maxHP, enemyName, enemyAttackFaces, restore, equipReserve, selectActive, healAmount, attackAmount, guardDamage, rewardOptions, canManageParty, restartRun } from './PMModel';
import { ensureSocial, makeVisitCode, readVisitCode, receiveVisitor, visitAction, visitorPet, friendBonds, bondEligibleEggs, bondBlockReason, startBondIncubation, VISIT_ACTION_MS } from './PMModel';
const { ccclass } = _decorator;
const KEY='pm.creature-dice.v1';
const C={ink:'#183852',muted:'#647f95',paper:'#f7fcff',blue:'#168cdd',orange:'#f99b28',green:'#38b98c',line:'#d7e8f2'};
const color=(v:string,alpha=255)=>{const c=new Color();Color.fromHEX(c,v);c.a=alpha;return c;};
@ccclass('PMGame')
export class PMGame extends Component {
  private audio!:PMAudio;
  private state!:State;private root!:Node;private cam!:Camera;private stage!:Node;
  private art:Record<string,SpriteFrame>={};private h=844;private lastSize='';private busy=false;
  private regionLoads:Record<number,Promise<void>>={};
  private padLoad:Promise<void>|null=null;private homeLoads:Record<string,Promise<void>>={};
  private homeBackground:Node|null=null;private homeAmbient:Node|null=null;private homePeriod:HomePeriod='afternoon';
  private saveError=false;private controls:Record<string,{x:number,y:number,w:number,h:number}>={};
  private durableCheckpoint=new DurableCheckpoint();private checkpointSequence=0;
  private enemyNode:Node|null=null;private playerNode:Node|null=null;private modal:Node|null=null;
  private ready=false;private lastTap=0;private loading:Label|null=null;private pressPending=false;
  private diceNode:Node|null=null;private fx!:Node;
  private availableGlows:Node[]=[];
  private meters:Record<string,{fill:Node,label:Label}>={};
  private hatchClock: {label:Label;index:number;ready:boolean}[]=[];private hatchSecond=0;
  private screen:'login'|'hero'|'starter'|'home'|'adventure'|'partners'|'game'|'utility'='login';
  private selectedHero:HeroId='ranger';private selectedStarter:PetId='fox';
  private utilityDraw:(()=>void)|null=null;
  private utilityOrigin:'home'|'adventure'|'partners'|'game'='home';
  private selectedEgg='';
  private partnerPage=0;private partnerSelected:string|null=null;private partnerOwnedOnly=true;private mapIndex=0;
  private dexPage=0;private dexMap=-1;private dexType='';private dexOwnedOnly=false;
  private pageSwipeActive=false;
  private homeHatchStatus:Label|null=null;
  private staminaLabel:Label|null=null;private staminaCountdown:Label|null=null;private staminaFill:Graphics|null=null;private adPending=false;
  private trustedClock=new TrustedClock();private clockRetryAt=0;private clockSaveAt=0;private clockForeground=true;private clockUiRefresh=false;
  private partyDropNodes:Node[]=[];private partyDragHint:Label|null=null;
  private partyDrag:{id:string;touch:number;source:Node;start:Vec3;origin:Vec3;moved:boolean;ghost:Node|null;guides:Node[];target:number}|null=null;
  private breedMother='';private breedFather='';private breedClock:Label|null=null;
  private socialTab:'visit'|'share'|'bonds'='visit';private visitCode='';private sharePetUid='';private socialNote='';private socialPage=0;
  async start(){
    this.audio=new PMAudio(this.node);
    profiler.hideStats();view.setDesignResolutionSize(390,844,ResolutionPolicy.FIXED_WIDTH);
    this.root=new Node('PM UI');this.node.addChild(this.root);this.root.layer=Layers.Enum.UI_2D;
    this.root.addComponent(UITransform);
    const cn=new Node('PM Camera');this.node.addChild(cn);this.cam=cn.addComponent(Camera);
    this.cam.projection=Camera.ProjectionType.ORTHO;this.cam.near=.1;this.cam.far=2000;
    this.cam.clearFlags=Camera.ClearFlag.SOLID_COLOR;this.cam.clearColor=color('#a7dbea');this.cam.visibility=Layers.Enum.UI_2D;
    this.root.addComponent(Canvas).cameraComponent=this.cam;
    this.layout();this.loading=this.text(this.root,'伙伴们正在赶来…',0,0,19,C.ink);
    let stored:State|null=null;
    const candidates:string[]=[];
    for(const key of [KEY,KEY+'.backup'])try{const raw=sys.localStorage.getItem(key);if(raw)candidates.push(raw);}catch{}
    const durable=await this.durableCheckpoint.open();if(durable)candidates.push(durable);
    for(const raw of candidates){const candidate=restore(raw);if(!candidate)continue;
      const sequence=Number((candidate as any).checkpointSequence)||0;
      if(!stored||sequence>this.checkpointSequence){stored=candidate;this.checkpointSequence=sequence;}
    }
    this.state=stored?prepareJourney(stored):newJourney();
    if(!this.state.stamina)this.state=syncStamina(this.state,0);
    this.trustedClock.restore(this.state.trustedTime?.lastMs||0);
    setTimeProvider(()=>this.trustedClock.now()??NaN);
    const initialTime=this.synchronizeTime();
    try{
      await Promise.all(['fox','bud','turtle','battle-arena','home-camp-v1','egg-nest-v1','attack-die-a','heal-potion','power-potion','guard-shield','loot-chest','refresh-enemy','battle-start','login-cover-v2','login-title-v3','login-button-v4','trainer-trio-v1','trainer-medic-v2'].map(async key=>{
        this.art[key]=await new Promise<SpriteFrame>((resolve,reject)=>resources.load('art/'+key+'/spriteFrame',SpriteFrame,(e,r)=>e?reject(e):resolve(r)));
      }));
      for(const [key,rect] of Object.entries({'login-title-v3':[21,39,1906,732],'login-button-v4':[71,28,2031,602]})){
        const [x,y,w,h]=rect,frame=new SpriteFrame();frame.reset({texture:this.art[key].texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art[key]=frame;
      }
      for(const id of HERO_IDS){const [x,y,w,h]=HERO_RECTS[id],frame=new SpriteFrame();frame.reset({texture:this.art[id==='medic'?'trainer-medic-v2':'trainer-trio-v1'].texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art['hero-'+id]=frame;}
      const heads={ranger:[230,55,225,225],keeper:[688,57,234,234],medic:[370,150,360,360]};
      for(const id of HERO_IDS){const [x,y,w,h]=heads[id],frame=new SpriteFrame();frame.reset({texture:this.art[id==='medic'?'trainer-medic-v2':'trainer-trio-v1'].texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art['avatar-'+id]=frame;}
      await Promise.all(PET_IDS.filter(id=>!NEW_PET_IDS.includes(id)).map(async id=>{
        const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('art/'+id+(['fox','bud','turtle'].includes(id)?'-battle-ref':'-battle-v1')+'/texture',Texture2D,(e,r)=>e?reject(e):resolve(r)));
        for(const side of ['back','front'] as const){const [x,y,w,h]=BATTLE_RECTS[id][side],frame=new SpriteFrame();
          frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art[id+'-'+side]=frame;if(side==='front'&&!['fox','bud','turtle'].includes(id))this.art[id]=frame;
        }
      }));
      await Promise.all(PET_IDS.filter(id=>!NEW_PET_IDS.includes(id)).map(async id=>{
        const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('art/'+id+'-evolution-v1/texture',Texture2D,(e,r)=>e?reject(e):resolve(r)));
        for(const rarity of ['SR','SSR'])for(const side of ['back','front']){const [x,y,w,h]=EVOLUTION_ART[id][rarity][side].rect,frame=new SpriteFrame();frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art[id+'-'+rarity+'-'+side]=frame;}
      }));
      await Promise.all(NEW_PET_IDS.map(async id=>{
        const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('art/'+id+'-forms-v1/texture',Texture2D,(e,r)=>e?reject(e):resolve(r)));
        for(const rarity of RARITIES)for(const side of ['back','front']){
          const [x,y,w,h]=REGION_ART[id][rarity][side].rect,frame=new SpriteFrame();
          frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;
          this.art[(rarity==='normal'?id:formKey({id,rarity}))+'-'+side]=frame;
          if(rarity==='normal'&&side==='front')this.art[id]=frame;
        }
      }));
      await Promise.all([this.loadRegionArt(this.state.mapId||0),this.loadHomeArt(homePeriod())]);await initialTime;this.ready=true;this.render();this.save();
      game.on(Game.EVENT_HIDE,this.onHide,this);
      game.on(Game.EVENT_SHOW,this.onShow,this);
      (globalThis as any).__pm={snapshot:()=>JSON.parse(JSON.stringify(this.state)),controls:()=>({...this.controls}),animating:()=>this.busy||this.pressPending,screen:()=>this.screen,timeReady:()=>this.trustedClock.now()!==null,version:'0.12.0',ready:true};
    }catch(e){this.loading!.string='资源加载失败，请刷新重试';console.error('PM asset loading',e);}
  }
  onDestroy(){this.audio?.dispose();this.durableCheckpoint.close();game.off(Game.EVENT_HIDE,this.onHide,this);game.off(Game.EVENT_SHOW,this.onShow,this);}
  private onHide(){this.audio?.pause('background');this.cancelPartyDrag();if(this.ready)this.save();this.clockForeground=false;this.trustedClock.suspend();}
  private onShow(){this.audio?.resume('background');this.clockForeground=true;this.trustedClock.resume();void this.synchronizeTime();}
  private async synchronizeTime(){
    const wasReady=this.trustedClock.now()!==null;this.clockRetryAt=performance.now()+30000;
    const ok=await this.trustedClock.sync();
    if(ok){this.clockRetryAt=performance.now()+300000;this.state=syncStamina(this.state);this.settlePendingAd();this.save();if(!wasReady)this.clockUiRefresh=true;}
    return ok;
  }
  private settlePendingAd(){
    if(this.trustedClock.now()===null)return;
    if(this.state.pendingStaminaAd){this.state=grantAdStamina(this.state,true);delete this.state.pendingStaminaAd;}
    if(this.state.pendingHatchAd){const {index,eggId}=this.state.pendingHatchAd;this.state=grantHatchAd(this.state,index,eggId,true);delete this.state.pendingHatchAd;}
  }
  private requireTime(){if(this.trustedClock.now()!==null)return true;this.timeNotice();return false;}
  private timeNotice(message='连接网络后继续计时'){
    const c=this.overlay('等待联网',226);this.text(c,message,0,30,16,C.muted,320,50);
    this.button(c,'time-close','返回',-82,-56,145,48,()=>this.render(),'#e8f3fa');
    this.button(c,'time-retry','重试',82,-56,145,48,async()=>{this.busy=true;try{if(await this.synchronizeTime())this.render();else this.timeNotice('暂时无法校时，请稍后重试');}finally{this.busy=false;}},'#519b81');
  }
  update(){
    const mono=performance.now();if(this.ready&&this.clockForeground){
      if(mono>=this.clockRetryAt)void this.synchronizeTime();
      if(mono>=this.clockSaveAt){this.clockSaveAt=mono+15000;this.save();}
      if(this.clockUiRefresh&&!this.busy&&!this.pressPending){this.clockUiRefresh=false;this.render();}
    }
    const second=Math.floor(mono/1000);if(this.ready&&second!==this.hatchSecond&&this.screen==='home'&&this.clockForeground&&(!this.art[homeArtKey(homePeriod())]||homePeriod()!==this.homePeriod))void this.refreshHomeArt();if(this.ready&&second!==this.hatchSecond)this.refreshStaminaHUD();if(second!==this.hatchSecond){this.hatchSecond=second;if(this.breedClock?.isValid&&this.state.breeding){const now=gameNow(),left=Number.isFinite(now)?this.state.breeding.readyAt-now:Infinity;this.breedClock.string=left>0?this.hatchTime(left):'宠物蛋已准备好';if(left<=0&&!this.pressPending){this.breedClock=null;this.breedingUI();}}if(this.homeHatchStatus?.isValid){const slots=(this.state.incubators||[]).filter(Boolean),ready=slots.filter(slot=>hatchRemaining(slot!)===0).length;this.homeHatchStatus.string=ready?'有 '+ready+' 枚可以破壳':slots.length+' / 2 孵化中';}for(const c of this.hatchClock){if(!c.label.isValid)continue;const slot=this.state.incubators?.[c.index];if(slot){const left=hatchRemaining(slot);c.label.string=this.hatchTime(left);if(!left&&!c.ready&&!this.pressPending){this.hatchery();break;}}}}
    for(let i=this.availableGlows.length-1;i>=0;i--){const glow=this.availableGlows[i];if(!glow.isValid)this.availableGlows.splice(i,1);else {const encounterAction=this.state.phase==='encounter'&&(glow.parent?.name==='reroll'||glow.parent?.name==='challenge');glow.active=!this.busy&&(!this.pressPending||encounterAction);}}
    const s=view.getVisibleSize();const key=s.width+':'+s.height;if(key!==this.lastSize){this.layout();if(this.ready&&!this.busy&&!this.pressPending)this.render();}}
  private layout(){const s=view.getVisibleSize();this.h=s.height;this.lastSize=s.width+':'+s.height;
    this.root.setPosition(s.width/2,s.height/2);this.root.getComponent(UITransform)!.setContentSize(s.width,s.height);
    this.cam.node.setPosition(s.width/2,s.height/2,1000);this.cam.orthoHeight=s.height/2;}
  private async save(){
    const checkpoint=this.trustedClock.checkpoint();if(checkpoint>0)this.state.trustedTime={version:1,lastMs:checkpoint};
    const sequence=++this.checkpointSequence,raw=JSON.stringify({...this.state,checkpointSequence:sequence});let localSaved=false;
    try{
      const old=sys.localStorage.getItem(KEY),valid=restore(old);
      if(old&&valid){if(!sys.localStorage.getItem(KEY+'.pre-individuals-v1')&&valid.individualVersion!==1)sys.localStorage.setItem(KEY+'.pre-individuals-v1',old);if(!sys.localStorage.getItem(KEY+'.pre-maps-v1')&&valid.mapVersion!==1)sys.localStorage.setItem(KEY+'.pre-maps-v1',old);if(!sys.localStorage.getItem(KEY+'.pre-social-v1')&&!valid.social)sys.localStorage.setItem(KEY+'.pre-social-v1',old);sys.localStorage.setItem(KEY+'.backup',old);}
      sys.localStorage.setItem(KEY,raw);localSaved=true;
    }catch{}
    const durableSaved=await this.durableCheckpoint.write(raw);
    const saved=this.durableCheckpoint.available?durableSaved:localSaved;
    if(sequence===this.checkpointSequence)this.saveError=!saved;
    return saved;
  }
  private makeNode(parent:Node,name:string,x:number,y:number,w:number,h:number){
    const n=new Node(name);n.layer=Layers.Enum.UI_2D;parent.addChild(n);n.setPosition(x,y);n.addComponent(UITransform).setContentSize(w,h);return n;
  }
  private panel(parent:Node,x:number,y:number,w:number,h:number,fill=C.paper,r=18,alpha=255){
    const n=this.makeNode(parent,'panel',x,y,w,h),g=n.addComponent(Graphics);g.fillColor=color(fill,alpha);g.roundRect(-w/2,-h/2,w,h,r);g.fill();return n;
  }
  private text(parent:Node,value:string,x:number,y:number,size=16,fill=C.ink,w=350,h=size+12){
    const n=this.makeNode(parent,value,x,y,w,h),l=n.addComponent(Label);l.string=value;l.fontSize=size;l.lineHeight=size+7;
    l.color=color(fill);l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;
    // Dynamic text uses per-label textures: the shared CHAR atlas fills up across rounds,
    // silently dropping new glyphs (damage, rewards and end-screen labels).
    l.cacheMode=Label.CacheMode.NONE;l.overflow=Label.Overflow.SHRINK;return l;
  }
  private button(parent:Node,id:string,value:string,x:number,y:number,w:number,h:number,callback:()=>void,fill=C.blue,enabled=true,size=17,inactiveFill='#c9d8e2'){
    const n=this.panel(parent,x,y,w,h,enabled?fill:inactiveFill,14);n.name=id;
    this.text(n,value,0,0,size,enabled?([C.paper,'#e8f3fa','#dbe9ef','#dbe5dc','#e4eef1'].includes(fill)?C.ink:'#ffffff'):'#6a7d8b',w-12,h-4);
    const world=n.worldPosition;this.controls[id]={x:world.x,y:this.h-world.y,w,h};
    if(enabled){
      const glow=this.makeNode(n,'available-glow',0,0,w,h),g=glow.addComponent(Graphics);
      this.availableGlows.push(glow);
      g.lineWidth=2;g.strokeColor=color(fill===C.paper||fill==='#e8f3fa'?'#6bb8eb':'#ffffff');
      g.roundRect(-w/2+3,-h/2+3,w-6,h-6,12);g.stroke();
      const opacity=glow.addComponent(UIOpacity);opacity.opacity=45;
      glow.on(Node.EventType.NODE_DESTROYED,()=>Tween.stopAllByTarget(opacity));
      tween(opacity).to(1.05,{opacity:180},{easing:'sineInOut'}).to(1.05,{opacity:45},{easing:'sineInOut'}).union().repeatForever().start();
      const release=()=>{Tween.stopAllByTarget(n);tween(n).to(.12,{scale:new Vec3(1,1,1)},{easing:'backOut'}).start();};
      n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{this.audio?.unlock();e.propagationStopped=true;if(this.busy||this.pressPending)return;
        Tween.stopAllByTarget(n);tween(n).to(.055,{scale:new Vec3(.94,.94,1)}).start();});
      n.on(Node.EventType.TOUCH_CANCEL,(e:EventTouch)=>{e.propagationStopped=true;release();});
      n.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;
        if(this.busy||this.pressPending||performance.now()-this.lastTap<180){release();return;}
        this.lastTap=performance.now();this.pressPending=true;Tween.stopAllByTarget(n);n.setScale(.94,.94,1);
        tween(n).to(.075,{scale:new Vec3(1.035,1.035,1)}).to(.055,{scale:new Vec3(1,1,1)}).start();
        this.scheduleOnce(()=>{this.pressPending=false;callback();},.14);
      });
    }
    return n;
  }
  private image(parent:Node,key:string,x:number,y:number,w:number,h:number,mirror=false){
    const n=this.makeNode(parent,key,x,y,w,h);const sp=n.addComponent(Sprite);sp.spriteFrame=this.art[key];sp.sizeMode=Sprite.SizeMode.CUSTOM;
    const rect=this.art[key].originalSize;const k=Math.min(w/rect.width,h/rect.height);n.getComponent(UITransform)!.setContentSize(rect.width*k,rect.height*k);
    if(mirror)n.setScale(-1,1,1);return n;
  }
  private petScale(id:PetId){return {normal:.80,elite:1.15,boss:1.50}[PETS[id].rank];}
  private resolvePet(value:string|Pet):Pet {return typeof value==='string'?petEntry(this.state,value):value;}
  private petImage(parent:Node,value:string|Pet,x:number,y:number,size:number,role:'player'|'enemy'|'card'='card'){
    const p=this.resolvePet(value),id=p.id,side=role==='player'?'back':'front',evolved=p.rarity&&p.rarity!=='normal';
    const key=evolved?formKey(p)+'-'+side:role==='card'?id:id+'-'+side;
    return this.image(parent,key,x,y,size,size,!evolved&&role==='card'&&id==='fox');
  }
  private actionIcon(parent:Node,kind:'attack'|'heal'|'guard'|'boost',x:number,y:number,size:number,ink:string){
    const n=this.makeNode(parent,kind+'-icon',x,y,size,size),g=n.addComponent(Graphics);
    n.setScale(size/40,size/40,1);g.fillColor=color(ink);g.strokeColor=color(ink);g.lineWidth=3;
    if(kind==='attack'){
      g.moveTo(-8,-5);g.lineTo(9,15);g.lineTo(17,18);g.lineTo(15,9);g.lineTo(-3,-10);g.close();g.fill();
      g.moveTo(-14,-3);g.lineTo(3,-17);g.stroke();g.moveTo(-7,-10);g.lineTo(-16,-19);g.stroke();
    }else if(kind==='heal'){
      g.roundRect(-13,-17,26,27,5);g.fill();g.roundRect(-8,12,16,6,2);g.fill();
      g.fillColor=color('#ffffff');g.rect(-3,-11,6,16);g.rect(-8,-6,16,6);g.fill();
    }else if(kind==='guard'){
      g.moveTo(0,19);g.lineTo(16,11);g.lineTo(13,-8);g.lineTo(0,-19);g.lineTo(-13,-8);g.lineTo(-16,11);g.close();g.stroke();
      g.moveTo(0,11);g.lineTo(0,-10);g.stroke();
    }else{
      for(const side of [-1,1]){
        g.moveTo(-7*side,-5);g.lineTo(10*side,15);g.lineTo(17*side,19);g.lineTo(16*side,10);g.lineTo(-2*side,-10);g.close();g.fill();
        g.moveTo(-14*side,-3);g.lineTo(3*side,-17);g.stroke();g.moveTo(-7*side,-10);g.lineTo(-16*side,-19);g.stroke();
      }
    }
    return n;
  }
  private shadow(x:number,y:number,w:number,depth=1){const n=this.makeNode(this.stage,'shadow',x,y,w,18*depth),g=n.addComponent(Graphics);g.fillColor=color('#21495b',35);g.ellipse(0,0,w/2,9*depth);g.fill();}
  private battlePad(x:number,y:number,w:number){
    const key='region-pad-'+(this.state.mapId||0);
    if(this.art[key]){const n=this.image(this.stage,key,x,y-4,w,w*.27);n.name='battle-ground';return;}
    const n=this.makeNode(this.stage,'battle-ground',x,y-4,w,w*.27),g=n.addComponent(Graphics),ry=w*.12;
    g.fillColor=color('#305e58');g.ellipse(0,-3,w/2,ry+3);g.fill();
    g.fillColor=color('#5a9d80');g.ellipse(0,1,w/2-3,ry);g.fill();
    g.fillColor=color('#70b191');g.ellipse(-w*.05,4,w*.42,ry*.69);g.fill();
    g.strokeColor=color('#91c5a0');g.lineWidth=2;
    for(let i=0;i<14;i++){const a=i*Math.PI*2/14,px=Math.cos(a)*w*.43,py=Math.sin(a)*ry*.8;
      g.moveTo(px-3,py);g.lineTo(px-4,py+5);g.moveTo(px,py);g.lineTo(px+1,py+7);g.stroke();}
  }
  private bar(parent:Node,x:number,y:number,w:number,ratio:number,label:string,key=''){
    const n=this.panel(parent,x,y,w,24,'#dae9ef',12);
    const fill=this.makeNode(n,'life-fill',-w/2+2,0,w-4,20),g=fill.addComponent(Graphics);
    g.fillColor=color(ratio<.3?'#eb7772':'#37bd8b');g.roundRect(0,-10,w-4,20,9);g.fill();fill.setScale(ratio,1,1);
    const l=this.text(n,label,0,0,13,C.ink,w,23);if(key)this.meters[key]={fill,label:l};return n;
  }
  private breathe(n:Node,groundY?:number){const base=n.scale.clone(),pos=n.position.clone();Tween.stopAllByTarget(n);
    const rise=groundY===undefined?0:(pos.y-groundY)*.025;
    tween(n).to(1.2,{scale:new Vec3(base.x*1.025,base.y*1.025,1),position:new Vec3(pos.x,pos.y+rise,pos.z)},{easing:'sineInOut'}).to(1.2,{scale:base,position:pos},{easing:'sineInOut'}).union().repeatForever().start();}
  private petFeet(value:string|Pet,side:'back'|'front'){
    const p=this.resolvePet(value),id=p.id;if(REGION_ART[id])return REGION_ART[id][p.rarity||'normal'][side].feet;if(p.rarity&&p.rarity!=='normal')return EVOLUTION_ART[id][p.rarity][side].feet;
    // Contact centers measured within each trimmed sprite; tails/ears are not ground anchors.
    const feet={fox:{back:[.647,.945],front:[.381,.941]},bud:{back:[.644,.951],front:[.431,.944]},turtle:{back:[.498,.931],front:[.488,.921]}};
    return (feet[id]||PET_FEET[id])[side];
  }
  private groundX(value:string|Pet,side:'back'|'front',size:number,preferred:number){
    const p=this.resolvePet(value),id=p.id,key=p.rarity&&p.rarity!=='normal'?formKey(p)+'-'+side:id+'-'+side;
    const frame=this.art[key].originalSize,w=size*frame.width/Math.max(frame.width,frame.height),u=this.petFeet(value,side)[0];
    return Math.max(-187+u*w*1.025,Math.min(187-(1-u)*w*1.025,preferred));
  }
  private groundPet(n:Node,id:string|Pet,side:'back'|'front',x:number,y:number){
    const [u,v]=this.petFeet(id,side),ui=n.getComponent(UITransform)!;
    ui.setAnchorPoint(u,.5);n.setPosition(x,y+(v-.5)*ui.height);this.breathe(n,y);
  }
  private clear(){this.cancelPartyDrag();this.partyDropNodes=[];this.partyDragHint=null;const stop=(n:Node)=>{Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);for(const child of n.children)stop(child);};for(const n of [...this.root.children]){stop(n);n.destroy();}this.root.removeAllChildren();this.controls={};this.modal=null;this.enemyNode=null;this.playerNode=null;this.diceNode=null;this.meters={};this.availableGlows=[];}
  private render(){
    this.audio?.select((this.screen==='game'||this.screen==='utility'&&this.utilityOrigin==='game')&&this.state.phase==='battle'?'battle':'camp');
    if(this.screen==='utility'&&this.utilityDraw){this.utilityDraw();return;}
    this.clear();this.layout();const s=this.state,H=this.h,b=-H/2;
    if(this.screen==='login'){this.loginUI();return;}
    if(this.screen==='hero'){this.heroChoiceUI();return;}
    if(this.screen==='starter'){this.starterChoiceUI();return;}
    if(this.screen==='game'&&!hasActivePet(s))this.screen='home';
    if(this.screen==='home'){this.homeUI();return;}
    if(this.screen==='adventure'){this.adventureUI();return;}
    if(this.screen==='partners'){this.partnersUI();return;}
    if(s.phase==='nest'||s.phase==='eggClaimed'){this.nestUI();return;}
    const phase=s.phase;const panelHeight=phase==='battle'?246:phase==='team'?300:phase==='reward'?350:phase==='encounter'?308:230;
    const sceneHeight=H-panelHeight;
    const background=this.regionFrame('battle');
    const bg=this.makeNode(this.root,'background',0,panelHeight/2,390,sceneHeight);const sp=bg.addComponent(Sprite);sp.spriteFrame=background;sp.sizeMode=Sprite.SizeMode.CUSTOM;
    const os=background.originalSize,k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    this.stage=this.makeNode(this.root,'actors',0,0,390,H);
    // Navigation stays at the edge; combat data belongs to the creature in the scene.
    const title=this.text(this.root,mapFor(s).name+' '+s.step+'/'+mapStageCount(s),0,H/2-30,18,'#ffffff',280,36);
    title.isBold=true;const outline=title.node.addComponent(LabelOutline);outline.color=color('#254b4d');outline.width=2;
    if(phase!=='won'&&phase!=='lost')this.retreatButton(H/2-30);
    const stageBottom=b+panelHeight;const stageTop=H/2-92;const area=stageTop-stageBottom;
    const center=stageBottom+area*.48;const size=Math.max(125,Math.min(245,area*.67));
    if(phase==='battle'){
      // Low camera composition from the approved reference: two distinct diagonal battle pads.
      const playerGround=H/2-sceneHeight*.92,enemyGround=H/2-sceneHeight*.62;
      const baseSize=Math.min(230,sceneHeight*.38),playerSize=baseSize*1.2*Math.min(1.15,this.petScale(s.active.id)),enemySize=baseSize*.65*.8*this.petScale(s.enemy);
      const enemyX=this.groundX(enemyPet(s),'front',enemySize*1.1,82),playerX=this.groundX(s.active,'back',playerSize*.9,-92);
      this.battlePad(enemyX,enemyGround,enemySize*1.25*1.2*1.15);
      this.shadow(enemyX,enemyGround,enemySize*.55,.82);this.enemyNode=this.petImage(this.stage,enemyPet(s),enemyX,enemyGround,enemySize*1.1,'enemy');
      this.groundPet(this.enemyNode,enemyPet(s),'front',enemyX,enemyGround);
      const status=this.panel(this.enemyNode,0,this.enemyNode.getComponent(UITransform)!.height/2+32,176,54,C.paper,10,246);status.name='enemy-hud';
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-26);pointer.lineTo(0,-34);pointer.lineTo(6,-26);pointer.close();pointer.fill();
      this.typeIcon(status,PETS[s.enemy].type,-73,14,17);this.text(status,enemyName(s),-20,14,12,C.ink,82,20);
      this.bar(status,-31,-10,104,s.enemyHP/s.enemyMax,s.enemyHP+' / '+s.enemyMax,'enemy');
      const intent=this.panel(status,55,0,58,38,'#fff0d9',8);
      this.attackDie(intent,-16,0,26);
      this.text(intent,''+enemyAttackAmount(s),14,4,22,'#b94c0a',32,30);
      this.matchupBadge(intent,matchupMultiplier(s.enemy,s.active.id),8,-12,42);
      this.battlePad(playerX,playerGround,baseSize*1.25);
      this.shadow(playerX,playerGround,playerSize*.55);this.playerNode=this.petImage(this.stage,s.active,playerX,playerGround,playerSize*.9,'player');
      this.groundPet(this.playerNode,s.active,'back',playerX,playerGround);
      if(s.doubled){const tag=this.panel(this.stage,playerX,playerGround+this.playerNode.getComponent(UITransform)!.height+18,116,28,'#fff0cd',14);this.text(tag,'攻击 ×'+s.boostMultiplier,0,0,14,'#a95a10');}
    }else if(phase==='encounter'){
      const statusY=H/2-144,room=statusY-70-stageBottom-22,petSize=Math.min(200,room*.90/1.5)*this.petScale(s.enemy),petY=stageBottom+room*.5;
      this.shadow(0,petY-petSize*.4,145);this.enemyNode=this.petImage(this.stage,enemyPet(s),0,petY,petSize,'enemy');this.breathe(this.enemyNode);
      const status=this.panel(this.root,0,statusY,350,94,C.paper,14,246);status.name='encounter-enemy-hud';
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-45);pointer.lineTo(0,-55);pointer.lineTo(6,-45);pointer.close();pointer.fill();
      this.petImage(status,enemyPet(s),-142,17,52);
      const rank=rankForStage(s.step);this.text(status,rank==='boss'?'BOSS':rank==='elite'?'精英':'普通',-142,-22,10,rank==='boss'?'#ad6e15':rank==='elite'?'#8656b0':C.muted,62,18);
      this.makeNode(status,'enemy-attack-values',0,0,350,94);this.refreshEncounterThreat();
      this.bar(status,30,5,272,1,s.enemyMax+' / '+s.enemyMax);
      const r=s.reward,pointReward=r.kind==='attack'||r.kind==='heal';
      const contentWidth=rankForStage(s.step)==='boss'?28:r.kind==='hp'?80:pointReward?35+r.values.length*36-6:54;
      const rewardLeft=-(40+12+contentWidth)/2,contentLeft=rewardLeft+52;
      this.text(status,'奖励',rewardLeft+20,-29,15,C.muted,40,24);
      if(rankForStage(s.step)==='boss'){this.text(status,'★',contentLeft+14,-29,24,'#e49424',28,26);}
      else {
        if(r.kind==='hp')this.text(status,'HP +'+r.values[0],contentLeft+40,-29,17,C.ink,80,24);
        else {
          if(r.kind==='attack')this.attackDie(status,contentLeft+13.5,-29,24);
          else this.image(status,r.kind==='boost'?'power-potion':'heal-potion',contentLeft+13.5,-29,27,27);
          if(pointReward)r.values.forEach((v,i)=>{const chip=this.panel(status,contentLeft+50+i*36,-29,30,24,r.kind==='attack'?'#fce0d8':'#d3f0df',6);this.text(chip,''+v,0,0,17,r.kind==='attack'?'#b94c32':'#278665',28,22);});
          else this.text(status,'+'+r.values[0],contentLeft+40,-29,17,C.ink,28,24);
        }
      }
    }else if(phase==='reward'){
      this.shadow(0,center-size*.42,150);this.enemyNode=this.petImage(this.stage,s.active,0,center,size);this.breathe(this.enemyNode);
    }else{
      const title=phase==='recruit'?'它想和你一起冒险！':phase==='team'?'新伙伴加入！':phase==='won'?'胜利通关':'失败结算';
      this.panel(this.root,0,stageTop-23,350,54,C.paper,24,245);this.text(this.root,title,0,stageTop-23,23);
      const shown=phase==='won'||phase==='lost'?s.active:enemyPet(s);
      this.shadow(0,center-size*.42,150);this.enemyNode=this.petImage(this.stage,shown,0,center,size);this.breathe(this.enemyNode);
      // Result portraits carry no duplicate name/quality caption.
    }
    const sheet=this.panel(this.root,0,b+panelHeight/2,390,panelHeight,'#f5fbff',24,251);
    if(phase==='encounter')this.encounterUI(sheet,panelHeight);
    if(phase==='battle')this.battleUI(sheet,panelHeight);
    if(phase==='reward')this.rewardUI(sheet,panelHeight);
    if(phase==='recruit')this.recruitUI(sheet,panelHeight);
    if(phase==='team')this.teamUI(sheet,panelHeight);
    if(phase==='won'||phase==='lost'){
      this.text(sheet,mapFor(s).name+'  ·  '+(phase==='won'?mapStageCount(s):Math.max(0,s.step-1))+' / '+mapStageCount(s),0,65,22,C.ink,350,36).isBold=true;
      this.text(sheet,phase==='won'?'通关已记录 · 获得的宠物蛋已保留':'本次探险结束 · 已获得的宠物蛋保留',0,22,14,C.muted,350,32);
      this.button(sheet,'result-home','返回营地',0,-49,340,58,()=>this.goHome(),'#519b81',true,22);
    }
    this.text(this.root,this.saveError?'保存失败，请勿关闭页面':'PM v0.12.0  ·  '+mapStageCount(s)+' 关 · 自动续玩',0,b+8,10,this.saveError?'#c44141':C.muted,350,14);
    this.fx=this.makeNode(this.root,'battle-effects',0,0,390,H);
    if(phase==='reward'||phase==='won'){const n=this.enemyNode!;const pos=n.position.clone();tween(n).by(.18,{position:new Vec3(0,15,0)},{easing:'quadOut'}).to(.2,{position:pos},{easing:'quadIn'}).start();}
  }
  private startFromCover(){
    const step=this.state.journey?.stage;
    // Resume the committed expedition snapshot without entering again, charging stamina or rolling dice.
    this.screen=step==='hero'?'hero':step==='starter'?'starter':this.state.expedition?'game':'home';
    this.render();
    if(this.screen==='home'&&this.state.pendingHatch)this.hatchReveal();
  }
  private loginUI(){
    const H=this.h,top=H/2;this.fillArt('login-cover-v2');
    this.image(this.root,'login-title-v3',0,top-86,368,148);
    const button=this.button(this.root,'start-game','',0,-H*.2,216,64,()=>this.startFromCover(),'#ffd45c',true,26);
    button.getComponent(Graphics)!.clear();this.image(button,'login-button-v4',0,0,216,64);
    const glowNode=button.getChildByName('available-glow')!,glow=glowNode.getComponent(Graphics)!;glowNode.setSiblingIndex(button.children.length-1);
    glow.clear();glow.strokeColor=color('#fff7cb');glow.lineWidth=1.2;glow.roundRect(-101.6,-26.4,203.2,52.8,26.4);glow.stroke();
    this.fx=this.makeNode(this.root,'login-effects',0,0,390,H);
  }
  private choiceHeader(title:string,step:string){
    const top=this.h/2;this.panel(this.root,0,0,390,this.h,'#eef4f1',0);
    this.panel(this.root,0,top-44,390,88,'#d75c53',0);
    this.text(this.root,title,0,top-32,24,'#ffffff',280,36).isBold=true;
    this.text(this.root,step,0,top-63,12,'#ffe5cc',280,24);
    this.button(this.root,'onboarding-back','‹',-166,top-40,40,42,()=>{this.screen='login';this.render();},'#be4d47',true,27);
  }
  private heroChoiceUI(){
    this.choiceHeader('选择你的主角',this.state.journey?.legacy?'保留原有进度 · 选择一位同行者':'01  主角     ·     02  初始伙伴');
    const H=this.h,top=H/2,b=-H/2,cardTop=top-116,cardBottom=b+230,cardH=cardTop-cardBottom,cy=(cardTop+cardBottom)/2;
    HERO_IDS.forEach((id,i)=>{const hero=HEROES[id],selected=this.selectedHero===id;
      const card=this.button(this.root,'hero-'+id,'',(i-1)*120,cy,112,cardH,()=>{this.selectedHero=id;this.render();},selected?'#fff3d9':'#ffffff',true);
      const g=card.getComponent(Graphics)!;g.lineWidth=selected?3:1;g.strokeColor=color(selected?hero.color:'#d9e5e3');g.roundRect(-55,-cardH/2+1,110,cardH-2,14);g.stroke();
      this.image(card,'hero-'+id,0,15,106,Math.max(130,cardH-75));
      this.panel(card,0,-cardH/2+25,100,34,selected?hero.color:'#edf2f0',10);
      this.text(card,hero.name,0,-cardH/2+25,18,selected?'#ffffff':C.ink,96,28).isBold=true;
      if(selected){const badge=this.panel(card,39,cardH/2-19,23,23,hero.color,12);this.text(badge,'✓',0,0,15,'#ffffff',22,23);}
    });
    const hero=HEROES[this.selectedHero],foot=this.panel(this.root,0,b+103,390,206,'#fffdf5',24);
    this.text(foot,hero.name+' · '+hero.title,0,70,23,hero.color,350,34).isBold=true;
    this.text(foot,hero.effect,0,27,16,C.ink,342,48);
    this.button(foot,'hero-confirm','选择 '+hero.name+'  ›',0,-43,350,54,()=>{const next=chooseHero(this.state,this.selectedHero);if(next===this.state)return;this.state=next;this.save();this.screen=next.journey!.stage==='done'?'home':'starter';this.render();if(this.screen==='home'&&next.pendingHatch)this.hatchReveal();},hero.color,true,21);
    this.fx=this.makeNode(this.root,'hero-choice-effects',0,0,390,H);
  }
  private starterChoiceUI(){
    this.choiceHeader('选择第一位伙伴','01  主角 ✓     ·     02  初始伙伴');
    const H=this.h,top=H/2,b=-H/2,petInfo={fox:{color:'#d86d49',tag:'火',note:'抢先一击 · 首次攻击伤害 +2'},bud:{color:'#55a06a',tag:'草',note:'草木祝福 · 首次治疗恢复 +2'},otter:{color:'#479fbd',tag:'水',note:'草木祝福 · 首次治疗恢复 +2'}},selected=this.selectedStarter,entry=petInfo[selected];
    const hero=this.state.journey?.hero;this.text(this.root,(hero?HEROES[hero].name+'，':'')+'谁陪你踏上旅途？',0,top-115,18,C.ink,350,30);
    const cardH=114,cardY=b+265,artBottom=cardY+cardH/2+16,artTop=top-144,artSize=Math.max(105,Math.min(226,artTop-artBottom));
    const lead=this.petImage(this.root,{id:selected,rarity:'normal',faces:[]},0,(artTop+artBottom)/2,artSize);this.breathe(lead);
    STARTERS.forEach((id,i)=>{const data=petInfo[id],on=id===selected,card=this.button(this.root,'starter-'+id,'',(i-1)*120,cardY,112,cardH,()=>{this.selectedStarter=id;this.render();},on?'#fff0d4':'#ffffff');
      this.petImage(card,{id,rarity:'normal',faces:[]},0,12,76);this.text(card,PETS[id].name,0,-39,14,on?data.color:C.ink,108,25).isBold=on;
      const badge=this.panel(card,38,cardH/2-15,25,24,data.color,8);this.text(badge,data.tag,0,0,12,'#ffffff',24,24);
      if(on){const g=card.getComponent(Graphics)!;g.lineWidth=3;g.strokeColor=color(data.color);g.roundRect(-55,-56,110,112,14);g.stroke();}
    });
    const foot=this.panel(this.root,0,b+103,390,206,'#fffdf5',24);
    this.text(foot,PETS[selected].name+' · '+entry.tag,0,71,23,entry.color,350,34).isBold=true;
    this.text(foot,'HP '+PETS[selected].hp+'    ⚄ '+PETS[selected].faces.join(' / '),0,39,17,C.ink,340,28);
    this.text(foot,entry.note,0,7,14,C.muted,350,28);
    this.button(foot,'starter-confirm','和 '+PETS[selected].name+' 出发  ›',0,-49,350,54,()=>{const next=chooseStarter(this.state,this.selectedStarter);if(next===this.state)return;this.state=next;this.save();this.screen='home';this.render();},entry.color,true,20);
    this.fx=this.makeNode(this.root,'starter-choice-effects',0,0,390,H);
  }
  private eggTint(egg:Egg){return egg.rarity==='SSR'?'#d79428':egg.rarity==='SR'?'#9062cf':'#5b9a80';}
  private eggName(egg:Egg){return rarityName(egg.rarity)+' · '+PETS[egg.affinity].type;}
  private eggArt(parent:Node,egg:Egg,x:number,y:number,size:number){
    const n=this.makeNode(parent,'egg-'+egg.id,x,y,size,size),g=n.addComponent(Graphics),k=size/100;
    const shape=()=>{g.moveTo(0,48*k);g.bezierCurveTo(-18*k,48*k,-39*k,10*k,-36*k,-15*k);g.bezierCurveTo(-34*k,-53*k,34*k,-53*k,36*k,-15*k);g.bezierCurveTo(39*k,10*k,18*k,48*k,0,48*k);g.close();};
    const tint=this.eggTint(egg),shell=egg.rarity==='SSR'?'#fff1be':egg.rarity==='SR'?'#efe4ff':'#fffae9';
    if(egg.rarity!=='normal'){g.fillColor=color(tint,28);g.ellipse(0,0,49*k,53*k);g.fill();}
    g.fillColor=color(shell);g.strokeColor=color('#6c6349');g.lineWidth=2*k;shape();g.fill();g.stroke();
    g.fillColor=color(tint,100);g.moveTo(24*k,27*k);g.bezierCurveTo(53*k,-28*k,13*k,-47*k,-23*k,-32*k);g.bezierCurveTo(9*k,-58*k,51*k,-32*k,24*k,27*k);g.close();g.fill();
    const pattern=color(PETS[egg.affinity].color);g.fillColor=pattern;g.strokeColor=pattern;g.lineWidth=6*k;
    const motif=PET_IDS.indexOf(egg.affinity)%6;
    if(motif===0){for(const [px,py,r] of [[-15,12,8],[13,23,6],[16,-13,9],[-14,-24,5]]){g.ellipse(px*k,py*k,r*k,r*.85*k);g.fill();}}
    if(motif===1){for(const sy of [-16,7]){g.moveTo(-26*k,sy*k);g.bezierCurveTo(-8*k,(sy+15)*k,8*k,(sy-15)*k,26*k,sy*k);g.stroke();}}
    if(motif===2){g.moveTo(6*k,30*k);g.lineTo(-16*k,0);g.lineTo(-2*k,0);g.lineTo(-8*k,-27*k);g.lineTo(18*k,8*k);g.lineTo(2*k,8*k);g.close();g.fill();}
    if(motif===3){for(const [px,py] of [[-12,11],[12,-13]]){g.moveTo(px*k,(py+13)*k);g.quadraticCurveTo((px+18)*k,py*k,px*k,(py-13)*k);g.quadraticCurveTo((px-18)*k,py*k,px*k,(py+13)*k);g.fill();}}
    if(motif===4){for(const [px,py] of [[-12,15],[13,-10]]){g.moveTo(px*k,(py+11)*k);g.lineTo((px+7)*k,py*k);g.lineTo(px*k,(py-11)*k);g.lineTo((px-7)*k,py*k);g.close();g.fill();}}
    if(motif===5){g.moveTo(-23*k,11*k);g.lineTo(0,-3*k);g.lineTo(23*k,11*k);g.stroke();g.moveTo(-23*k,-10*k);g.lineTo(0,-24*k);g.lineTo(23*k,-10*k);g.stroke();}
    g.fillColor=color('#ffffff',170);g.ellipse(-12*k,28*k,7*k,12*k);g.fill();
    if(egg.rarity==='SSR'){for(let i=0;i<3;i++){const p=this.text(n,'✦',(-34+i*35)*k,(i===1?55:30)*k,19*k,['#e4a525','#7c83e9','#e48caf'][i],30*k,30*k);p.isBold=true;}}
    return n;
  }
  private nestUI(){
    const s=this.state,H=this.h,b=-H/2,hunt=s.eggHunt!,claimed=s.phase==='eggClaimed',panelHeight=claimed?230:280,sceneHeight=H-panelHeight;
    const background=this.regionFrame('nest');
    const bg=this.makeNode(this.root,'egg-nest',0,panelHeight/2,390,sceneHeight),sp=bg.addComponent(Sprite),os=background.originalSize;
    sp.spriteFrame=background;sp.sizeMode=Sprite.SizeMode.CUSTOM;const k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    this.stage=this.makeNode(this.root,'nest-stage',0,0,390,H);
    const title=this.text(this.root,claimed?'带着惊喜回家':'巢穴寻蛋',0,H/2-36,26,'#fff9df',280,42);title.isBold=true;const out=title.node.addComponent(LabelOutline);out.color=color('#365543');out.width=2;
    this.retreatButton(H/2-32);
    const info=this.panel(this.root,0,H/2-80,claimed?170:224,30,'#294c3f',15,210);
    this.text(info,claimed?'已存入蛋袋 ✓':(rankForStage(s.step)==='boss'?'BOSS 巢穴':'精英巢穴')+'  ·  '+(hunt.limit-hunt.candidates.length)+' 次翻找',0,0,14,'#fff8d9',216,26);
    const nestY=panelHeight/2+.035*os.height*k,eggSize=Math.min(158,sceneHeight*.32),eggY=nestY+eggSize*.2;
    const chosen=hunt.candidates[hunt.selected];
    if(chosen){
      const halo=this.makeNode(this.stage,'egg-glow',0,eggY,230,230),g=halo.addComponent(Graphics);g.fillColor=color(this.eggTint(chosen),chosen.rarity==='normal'?15:35);g.circle(0,0,eggSize*.76);g.fill();
      this.enemyNode=this.eggArt(this.stage,chosen,0,eggY,eggSize);this.breathe(this.enemyNode);
      const label=this.panel(this.stage,0,nestY-eggSize*.48,156,30,'#fff9e9',14,245);this.text(label,this.eggName(chosen),0,0,16,this.eggTint(chosen),148,26).isBold=true;
    }else{
      const hint=this.text(this.stage,'?',0,eggY,58,'#fff6cc',90,80);hint.isBold=true;this.breathe(hint.node);
    }
    const heroHeight=Math.min(140,sceneHeight*.3)*3,portraitH=heroHeight/2+28;
    const portrait=this.makeNode(this.stage,'nest-hero-portrait',-105,b+panelHeight+portraitH/2,312,portraitH);portrait.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    this.playerNode=this.image(portrait,'hero-'+(s.journey?.hero||'ranger'),0,-portraitH/2,282,heroHeight);this.breathe(this.playerNode);
    const sheet=this.panel(this.root,0,b+panelHeight/2,390,panelHeight,'#fffbed',24,253);
    if(claimed){
      const bonus=hunt.bonusEggId?s.eggs!.find(e=>e.id===hunt.bonusEggId):null;
      this.text(sheet,bonus?'寻蛋好手 · 额外带回一枚！':this.eggName(chosen)+' 蛋',0,79,bonus?20:22,this.eggTint(chosen),330,34).isBold=true;
      this.text(sheet,bonus?this.eggName(chosen)+' + '+this.eggName(bonus)+' · 已存入':('已保存  ·  蛋袋共 '+(s.eggs||[]).length+' 枚'),0,42,15,C.muted,350,27);
      this.button(sheet,'eggContinue',s.step===mapStageCount(s)?'完成冒险  ›':'继续冒险  ›',0,-13,338,56,()=>this.command('eggContinue'),'#dba441',true,22);
      this.button(sheet,'eggBag','查看蛋袋',0,-73,338,36,()=>this.eggBag(),C.paper,true,14);
    }else{
      this.text(sheet,'挑一枚，带回家',0,111,20,'#735b32',280,30).isBold=true;
      for(let i=0;i<hunt.limit;i++){
        const x=(i-(hunt.limit-1)/2)*116,e=hunt.candidates[i],selected=i===hunt.selected;
        const card=this.button(sheet,'eggSelect'+i,'',x,29,106,116,()=>this.command(('eggSelect'+i) as Action),selected?'#fff0c6':'#f2f0e6',!!e,16,'#edece1');
        if(e){this.eggArt(card,e,0,15,66);this.text(card,this.eggName(e),0,-34,13,this.eggTint(e),100,22).isBold=true;
          if(selected){const frame=card.getComponent(Graphics)!;frame.strokeColor=color('#d8a43c');frame.lineWidth=3;frame.roundRect(-51,-56,102,112,13);frame.stroke();this.text(card,'✓',38,43,18,'#b77c20',25,25);}
        }else this.text(card,'?',0,8,34,'#b8b7a5',66,55);
      }
      const remaining=hunt.limit-hunt.candidates.length;
      this.button(sheet,'eggSearch',hunt.candidates.length?'再找一次  '+remaining:'翻找草丛  '+remaining,-88,-72,166,53,()=>this.command('eggSearch'),'#46976e',remaining>0,18);
      this.button(sheet,'eggTake','带走这枚  ›',88,-72,166,53,()=>this.command('eggTake'),'#dba441',!!chosen,18);
      const rates=eggRates(s);this.text(sheet,'每次翻找：普通 '+rates.normal+'% · SR '+rates.SR+'% · SSR '+rates.SSR+'%',0,-119,11,C.muted,350,20);
    }
    this.text(this.root,this.saveError?'保存失败，请勿关闭页面':'PM v0.12.0  ·  '+mapFor(s).name+' '+s.step+'/'+mapStageCount(s),0,b+8,10,this.saveError?'#c44141':C.muted,350,14);
    this.fx=this.makeNode(this.root,'nest-effects',0,0,390,H);
  }
  private eggBag(page=0){
    this.eggShelf(null,page);
  }
  private eggShelf(slot:number|null,page=0){
    const eggs=slot===null?(this.state.eggs||[]).filter(e=>!(this.state.hatchedEggIds||[]).includes(e.id)).slice().reverse():availableEggs(this.state);
    const pages=Math.max(1,Math.ceil(eggs.length/6));page=Math.max(0,Math.min(pages-1,page));
    const c=this.fullPage(slot===null?'蛋袋':'选择宠物蛋',eggs.length+' 枚',()=>this.eggShelf(slot,page),()=>this.hatchery()),{top,bottom,height}=this.pageBounds(c);
    const visible=eggs.slice(page*6,page*6+6),selected=visible.find(e=>e.id===this.selectedEgg)||visible[0];this.selectedEgg=selected?.id||'';
    const cardH=Math.min(170,(height-236)/2),first=top-24-cardH/2;
    eggs.forEach((egg,itemIndex)=>{const i=itemIndex%6;const chosen=egg.id===this.selectedEgg,incubating=this.state.incubators?.some(s=>s?.eggId===egg.id),row=this.button(c,'egg-'+egg.id,'',(i%3-1)*120,first-Math.floor(i/3)*(cardH+12),112,cardH,()=>{this.selectedEgg=egg.id;this.eggShelf(slot,page);},chosen?'#fff1d6':'#ffffff');
      this.listItem(row,itemIndex,6);this.eggArt(row,egg,0,6,Math.min(86,cardH-48));this.text(row,rarityName(egg.rarity),32,cardH/2-17,12,this.eggTint(egg),45,24).isBold=true;
      this.text(row,incubating?'孵化中':this.eggName(egg),0,-cardH/2+19,12,C.ink,104,25);
    });
    if(!eggs.length)this.text(c,'还没有宠物蛋',0,40,21,C.muted,330,50);
    this.pagePager(c,bottom+191,page,pages,p=>this.eggShelf(slot,p),slot===null?'eggs':'picker');
    const foot=this.panel(c,0,bottom+82,390,164,'#fffdf5',22),busy=selected&&this.state.incubators?.some(s=>s?.eggId===selected.id),free=slot===null?[0,1].find(i=>!this.state.incubators?.[i]):slot;
    this.text(foot,selected?this.eggName(selected):'探险 · 交配获得',0,54,20,selected?this.eggTint(selected):C.muted,350,31).isBold=true;
    this.text(foot,selected?(selected.bond?'♡ 已结缘':selected.genes?'♥ 父母遗传':mapFor(selected).name)+' · '+hatchDuration(this.state)/60000+' 分钟':'',0,20,13,C.muted,340,27);
    this.button(foot,selected?'incubate-'+selected.id:'hatchery',busy?'查看孵化':free===undefined?'孵化位已满':selected?'开始孵化':'去孵化屋',0,-34,350,48,()=>{if(!selected||busy){this.hatchery();return;}if(free!==undefined){if(!this.requireTime())return;this.state=startIncubation(this.state,selected.id,free);this.save();this.hatchery();}},'#519b81',!selected||!!busy||free!==undefined,19);
    this.controls[slot===null?'closeEggBag':'picker-back']=this.controls['nav-home'];
  }
  private attackDie(parent:Node,x:number,y:number,size:number){
    // Approved A: four pips in the side plane. Damage remains an independent number.
    const n=this.image(parent,'attack-die-a',x,y,size*1.13,size*1.13);n.name='attack-die';
    this.diceNode=n;return n;
  }
  private chestIcon(parent:Node,x:number,y:number,size:number){
    return this.image(parent,'loot-chest',x,y,size,size);
  }
  private refreshEncounterThreat(){
    const n=this.root.getChildByName('encounter-enemy-hud')?.getChildByName('enemy-attack-values');if(!n)return;
    for(const child of [...n.children])child.destroy();n.removeAllChildren();
    this.encounterNameAttack(n,enemyName(this.state),enemyAttackFaces(this.state).map(v=>enemyAttackAmount(this.state,v)),30,PETS[this.state.enemy].type);
  }
  private matchupBadge(parent:Node,multiplier:number,x:number,y:number,w=60){
    if(multiplier===1)return;
    const n=this.panel(parent,x,y,w,16,multiplier>1?'#fff0c2':'#e0edf8',6);
    n.name='matchup-'+multiplier;
    this.text(n,(multiplier>1?'↑':'↓')+' ×'+multiplier,0,0,10,multiplier>1?'#a9610c':'#35638f',w-2,16).isBold=true;
  }
  private typeIcon(parent:Node,type:string,x:number,y:number,size:number){
    const colors:Record<string,string>={'一般':'#959b9d','火':'#e87640','水':'#418ec5','草':'#62a94a','电':'#d5ae26','冰':'#63b7c7','格斗':'#bf704c','毒':'#a466ba','地面':'#bb9358','飞行':'#8d9fce','超能力':'#d879a0','虫':'#92a53e','岩石':'#aa9b64','幽灵':'#7774ad','龙':'#6862bd','恶':'#656073','钢':'#79989f','妖精':'#d794bf'};
    const n=this.makeNode(parent,'type-'+type,x,y,size,size),g=n.addComponent(Graphics);n.setScale(size/32,size/32,1);
    g.fillColor=color(colors[type]||'#959b9d');g.circle(0,0,15);g.fill();g.strokeColor=color('#ffffff');g.fillColor=color('#ffffff');g.lineWidth=2.2;
    const line=(points:number[][],close=false,fill=false)=>{g.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))g.lineTo(p[0],p[1]);if(close)g.close();if(fill)g.fill();else g.stroke();};
    const circle=(cx:number,cy:number,r:number,fill=false)=>{g.circle(cx,cy,r);fill?g.fill():g.stroke();};
    switch(type){
      case '火':line([[-6,-8],[-9,-2],[-4,5],[-3,0],[3,10],[8,0],[7,-6],[2,-9]],true,true);break;
      case '水':g.moveTo(0,10);g.bezierCurveTo(-16,-6,-3,-13,4,-8);g.bezierCurveTo(12,-3,3,6,0,10);g.fill();break;
      case '草':g.moveTo(-8,-8);g.bezierCurveTo(-12,7,1,10,9,9);g.bezierCurveTo(9,-6,1,-11,-8,-8);g.stroke();line([[-7,-7],[6,6]]);break;
      case '电':line([[2,11],[-8,-2],[-1,-1],[-3,-11],[9,3],[2,2]],true,true);break;
      case '冰':for(let i=0;i<3;i++){const a=i*Math.PI/3;line([[-9*Math.cos(a),-9*Math.sin(a)],[9*Math.cos(a),9*Math.sin(a)]]);}break;
      case '格斗':g.roundRect(-7,-8,14,13,3);g.fill();for(let i=0;i<3;i++){g.roundRect(-7+i*5,2,4,8,2);g.fill();}break;
      case '毒':circle(0,3,8,true);g.roundRect(-5,-9,10,7,2);g.fill();g.fillColor=color(colors[type]);circle(-3,3,2,true);circle(3,3,2,true);break;
      case '地面':line([[-10,-8],[10,-8]]);line([[-9,-3],[-2,5],[2,0],[6,8],[10,-3]],true);break;
      case '飞行':line([[-9,-7],[-6,3],[10,9],[5,0],[-3,-3]],true,true);line([[-7,-8],[8,5]]);break;
      case '超能力':for(let i=0;i<28;i++){const a=i*.32,r=1+i*.28;if(i===0)g.moveTo(r*Math.cos(a),r*Math.sin(a));else g.lineTo(r*Math.cos(a),r*Math.sin(a));}g.stroke();break;
      case '虫':g.ellipse(0,-1,5,8);g.stroke();for(const y of [-5,0,5]){line([[-9,y-2],[-5,y],[5,y],[9,y-2]]);}line([[-3,5],[-6,10]]);line([[3,5],[6,10]]);break;
      case '岩石':line([[-9,-6],[-6,5],[2,9],[9,3],[7,-7],[0,-9]],true);line([[-6,5],[1,1],[9,3]]);line([[1,1],[0,-9]]);break;
      case '幽灵':g.moveTo(-8,-8);g.lineTo(-8,2);g.bezierCurveTo(-8,12,8,12,8,2);g.lineTo(8,-8);g.lineTo(3,-5);g.lineTo(0,-8);g.lineTo(-3,-5);g.close();g.fill();g.fillColor=color(colors[type]);circle(-3,2,1.7,true);circle(3,2,1.7,true);break;
      case '龙':line([[-7,-9],[-4,5],[1,2],[6,10],[9,0],[3,-2],[2,-8]],true);line([[-4,5],[-9,9],[-7,0]]);break;
      case '恶':circle(0,0,9,true);g.fillColor=color(colors[type]);circle(4,4,8,true);break;
      case '钢':line([[-5,9],[5,9],[10,0],[5,-9],[-5,-9],[-10,0]],true);circle(0,0,4);break;
      case '妖精':line([[0,11],[3,3],[10,0],[3,-3],[0,-11],[-3,-3],[-10,0],[-3,3]],true,true);break;
      default:circle(0,0,8);circle(0,0,3,true);
    }return n;
  }
  private encounterNameAttack(p:Node,name:string,faces:number[],top:number,type:string){
    this.typeIcon(p,type,-108,top,18);this.text(p,name,-52,top,16,C.ink,90);
    this.attackDie(p,25,top,23);const gap=Math.min(35,130/faces.length);
    faces.forEach((v,i)=>{const chip=this.panel(p,62+i*gap,top,29,24,'#fff0d9',6);this.text(chip,''+v,0,0,17,'#b94c0a',27,22);});
  }
  private playerHUD(p:Node,top:number,preview=false){const s=this.state;
    this.petImage(p,s.active,preview?-142:-150,top-13,52);
    if(preview)this.encounterNameAttack(p,petName(s.active),s.active.faces.map(v=>typedDamage(v,matchupMultiplier(s.active.id,s.enemy))),top,PETS[s.active.id].type);
    else {this.typeIcon(p,PETS[s.active.id].type,-109,top,20);this.text(p,petName(s.active),-42,top,17,C.ink,112);}
    this.bar(p,30,top-25,272,s.hpRatio,hp(s)+' / '+maxHP(s),'player');
  }
  private encounterPartyUI(p:Node){const s=this.state;
    const stop=(n:Node)=>{Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);for(const child of n.children)stop(child);};
    for(const child of [...p.children]){stop(child);child.destroy();}p.removeAllChildren();
    this.playerHUD(p,135,true);
    const healingStock=this.panel(p,-134,82,78,26,'#e5f5ed',8);this.image(healingStock,'heal-potion',-22,0,28,28);this.text(healingStock,'× '+s.potions,8,0,17,'#278665',42,24);
    const healingFaces=this.panel(p,-13,82,156,26,'#e5f5ed',8);this.text(healingFaces,'+',-61,0,20,'#278665',25,24);
    this.text(healingFaces,s.healFaces.join(' · '),15,0,16,'#278665',120,24);
    const powerStock=this.panel(p,133,82,78,26,'#fcebe7',8);this.image(powerStock,'power-potion',-22,0,28,28);this.text(powerStock,'× '+s.boosts,8,0,17,'#be5148',42,24);
    const choices=partyChoices(s);
    choices.forEach((id,i)=>{
      const selected=s.active.uid===id,owned=!!id&&s.pets!.some(p=>p.uid===id),breeding=owned&&!!s.breeding&&[s.breeding.mother,s.breeding.father].includes(id),tint=selected?'#fff2cf':owned&&!breeding?'#fbfeff':'#e7edf0',x=(i-1)*118;
      this.panel(p,x,-1,108,113,selected?'#c5933d':'#b9ced9',17);
      const card=this.button(p,'pet-'+id,'',x,4,108,110,()=>{const next=selectActive(this.state,id);if(next!==this.state){this.state=next;this.save();this.encounterPartyUI(p);this.refreshEncounterThreat();}},tint,owned&&!selected&&!breeding,16,tint);
      const rim=card.getComponent(Graphics)!;rim.lineWidth=selected?3:1.5;rim.strokeColor=color(selected?'#e4ae48':'#bdd6e2');rim.roundRect(-52,-53,104,106,14);rim.stroke();
      const disc=this.makeNode(card,'portrait-disc',0,14,78,78).addComponent(Graphics);disc.fillColor=color(selected?'#ffe2a1':owned?'#e1f3f7':'#d7e1e6');disc.circle(0,0,37);disc.fill();
      if(owned)this.petImage(card,id,0,15,78).getComponent(Sprite)!.grayscale=breeding;else this.menuIcon(card,'lock',0,15,30,'#9aacb0');
      this.panel(card,0,-36,96,25,selected?'#f8d993':owned?'#eaf3f7':'#d4e0e6',8);
      this.text(card,owned?petName(petEntry(s,id)):'空位',0,-36,14,owned?C.ink:C.muted,94,23).isBold=selected;
      if(selected){const mark=this.panel(card,39,40,24,24,'#43a986',12);this.text(mark,'✓',0,0,17,'#ffffff',24,24);}
      if(owned&&!breeding)this.matchupBadge(card,matchupMultiplier(petEntry(s,id).id,s.enemy),-21,40,60);
      if(breeding){const badge=this.panel(card,-6,40,80,19,'#947d90',7);this.text(badge,gameNow()>=s.breeding!.readyAt?'待领蛋':'交配中',0,0,11,'#ffffff',76,19);}
      if(!owned){const lock=this.makeNode(card,'locked',39,39,20,23),g=lock.addComponent(Graphics);g.strokeColor=color(C.muted);g.fillColor=color(C.muted);g.lineWidth=2;g.roundRect(-5,0,10,11,5);g.stroke();g.roundRect(-8,-8,16,13,3);g.fill();}
    });
  }
  private encounterUI(p:Node,height:number){const s=this.state;
    this.encounterPartyUI(this.makeNode(p,'encounter-party',0,0,390,height));
    const refreshable=rankForStage(s.step)!=='boss';
    this.panel(p,-128,-107,92,64,refreshable?'#6795ae':'#a8bdca',16);
    const reroll=this.button(p,'reroll','',-128,-102,92,64,()=>s.swaps>0?this.command('reroll'):void this.watchRerollAd(),'#dff3fc',refreshable);
    this.image(reroll,'refresh-enemy',-8,2,50,50).getComponent(Sprite)!.grayscale=!refreshable;
    const count=this.panel(reroll,28,-18,28,25,refreshable?'#246987':'#93aab8',10);
    if(refreshable&&s.swaps===0)this.menuIcon(count,'video',0,0,20,'#ffffff');else this.text(count,''+s.swaps,0,0,16,'#ffffff',23,23);
    this.panel(p,51,-107,246,64,'#bc6f26',16);
    const challenge=this.button(p,'challenge','',51,-102,246,64,()=>this.command('challenge'),'#f2ad45');
    const shine=challenge.getComponent(Graphics)!;shine.fillColor=color('#ffe3a0',125);shine.roundRect(-117,3,234,23,10);shine.fill();
    this.image(challenge,'battle-start',0,1,67,67);
    const arrows=this.makeNode(challenge,'forward',76,0,30,30).addComponent(Graphics);arrows.lineWidth=3;arrows.strokeColor=color('#fff6da');
    for(const dx of [0,13]){arrows.moveTo(dx-6,-9);arrows.lineTo(dx+2,0);arrows.lineTo(dx-6,9);arrows.stroke();}
  }
  private battleUI(p:Node,height:number){const s=this.state;
    this.playerHUD(p,104);
    this.text(p,'第 '+s.turn+' 回合',131,104,12,C.muted,85);
    this.text(p,skillStatus(s)+(heroHealBonus(s)?' · 首次治疗 +3':''),0,63,11,s.active.rarity==='SSR'?'#b78022':s.active.rarity==='SR'?'#8b61bb':C.muted,342,20);
    const canHeal=s.potions>0&&!s.usedHeal&&s.hpRatio<1,canBoost=s.boosts>0&&!s.doubled;
    const potion=(id:'heal'|'boost',x:number,key:string,stock:number,base:number,multiplier:number,enabled:boolean,tint:string)=>{
      const disabled=!enabled,used=id==='heal'?s.usedHeal:s.doubled,ink=disabled?'#6a7d8b':'#ffffff';
      const n=this.button(p,id,'',x,18,166,72,()=>this.command(id),tint,enabled,17,'#c9d8e2');
      const icon=this.image(n,key,-55,1,53,53);icon.getComponent(Sprite)!.grayscale=disabled;
      const count=this.panel(n,-38,-20,24,22,disabled?'#a9bac5':'#fff6df',10);
      this.text(count,''+stock,0,0,14,disabled?'#5a7180':C.ink,22,20);
      this.text(n,base+' × '+multiplier,26,15,17,ink,100,25);
      this.text(n,'= +'+base*multiplier,26,-12,25,ink,102,33);
      if(used){const mark=this.panel(n,-75,25,14,14,'#f7fcff',7);this.text(mark,'✓',0,0,10,C.muted,14,14);}
      return n;
    };
    potion('heal',-89,'heal-potion',s.potions,s.heal,s.healMultiplier,canHeal,'#2b9b66');
    potion('boost',89,'power-potion',s.boosts,s.attack,s.boostMultiplier,canBoost,'#d95557');
    const guard=this.button(p,'guard','',-89,-66,166,72,()=>s.doubled?this.confirmGuard():this.command('guard'),C.blue);
    this.image(guard,'guard-shield',-45,0,58,58);
    this.text(guard,'99%',31,0,30,'#ffffff',82,44);
    const attack=this.button(p,'attack','',89,-66,166,72,()=>this.command('attack'),C.orange);
    this.attackDie(attack,-44,5,45);
    const rolled=this.panel(attack,-44,-23,35,17,'#fff2ca',6);this.text(rolled,''+s.attack,0,0,12,'#915415',33,17);
    this.text(attack,''+attackAmount(s),32,4,36,'#ffffff',76,45);
    this.matchupBadge(attack,matchupMultiplier(s.active.id,s.enemy),32,-23,72);
  }
  private heartIcon(parent:Node,x:number,y:number,size:number,tint:string){
    const n=this.makeNode(parent,'heart-icon',x,y,size,size),g=n.addComponent(Graphics);n.setScale(size/48,size/48,1);
    g.fillColor=color(tint);g.strokeColor=color('#ffffff');g.lineWidth=2;
    g.moveTo(0,-20);g.bezierCurveTo(-38,3,-19,33,0,15);g.bezierCurveTo(19,33,38,3,0,-20);g.close();g.fill();g.stroke();
    return n;
  }
  private rewardUI(p:Node,height:number){const s=this.state,r=s.reward;
    this.text(p,'胜利',0,145,30,'#bf812b',240,42).isBold=true;
    const recovery=this.panel(p,0,104,198,29,'#e2f5eb',14);
    this.heartIcon(recovery,-77,0,19,'#36a779');this.text(recovery,'恢复生命 +20%',15,0,15,'#278665',160,25);
    this.text(p,r.kind==='attack'?'攻击点数 · 选择一项':r.kind==='heal'?'恢复点数 · 选择一项':'获得奖励',0,72,15,C.muted,260,24);
    if(r.kind==='attack'||r.kind==='heal'){
      const healing=r.kind==='heal';
      [{id:'keep' as Action,title:'原点数',action:'保留',values:healing?s.healFaces:s.active.faces,tint:'#448dbc',bg:'#edf7fd'},
       {id:'take' as Action,title:'新点数',action:'采用',values:r.values,tint:healing?'#299c72':'#d4932c',bg:healing?'#eaf9f1':'#fff7e4'}].forEach((option,i)=>{
        const x=i===0?-88:88;
        this.panel(p,x,-42,164,190,i===0?'#bad3e2':healing?'#9acdb7':'#d8b56a',16);
        const card=this.button(p,option.id,'',x,-37,164,190,()=>this.command(option.id),option.bg);
        const frame=card.getComponent(Graphics)!;frame.strokeColor=color(option.tint);frame.lineWidth=2;frame.roundRect(-80,-93,160,186,14);frame.stroke();
        this.text(card,option.title,0,73,16,option.tint,144,25).isBold=true;
        if(healing)this.image(card,'heal-potion',0,26,77,77);else this.attackDie(card,0,26,68);
        const w=Math.min(36,136/option.values.length);
        option.values.forEach((v,j)=>{const face=this.panel(card,(j-(option.values.length-1)/2)*(w+5),-28,w,32,option.tint,7);this.text(face,''+v,0,0,21,'#ffffff',w,30).isBold=true;});
        this.panel(card,0,-73,144,31,option.tint,9);this.text(card,option.action,0,-73,17,'#ffffff',138,29).isBold=true;
      });
      return;
    }
    const palette={hp:['#d95570','#fff0f3','生命上限'],attack:['#e49424','#fff5df','攻击点数'],heal:['#299c72','#eaf9f1','恢复点数'],potion:['#299c72','#eaf9f1','生命药水'],boost:['#d95557','#fff0ee','力量药水']};
      const [tint,bg,name]=palette[r.kind];
      const card=this.panel(p,0,-4,338,118,bg,17);
      const border=card.getComponent(Graphics)!;border.lineWidth=2;border.strokeColor=color(tint);border.roundRect(-167,-57,334,114,15);border.stroke();
      this.text(card,name,47,33,18,tint,206,28).isBold=true;
      if(r.kind==='hp')this.heartIcon(card,-105,0,70,tint);
      else this.image(card,r.kind==='boost'?'power-potion':'heal-potion',-105,0,87,87);
      {
        const current=r.kind==='hp'?maxHP(s):r.kind==='potion'?s.potions:s.boosts;
        const next=r.kind==='hp'?current+r.values[0]:Math.min(9,current+r.values[0]);
        this.text(card,'+'+(next-current),47,0,34,tint,180,44).isBold=true;
        this.text(card,current+' → '+next,47,-35,15,C.muted,180,24);
      }
    this.panel(p,0,-121,338,56,'#b47826',16);
    const take=this.button(p,'take','',0,-116,338,56,()=>this.command('take'),'#f4bd50');
    const surface=take.getComponent(Graphics)!;surface.fillColor=color('#ffe8a0',170);surface.roundRect(-162,2,324,21,10);surface.fill();
    const caption=this.text(take,'领取奖励',0,0,23,'#fffdf2',300,40);caption.isBold=true;
    const edge=caption.node.addComponent(LabelOutline);edge.color=color('#a97424');edge.width=1.4;
  }
  private recruitUI(p:Node,height:number){
    this.text(p,'它愿意成为你的伙伴',0,82,19);this.text(p,'邀请必定成功 · 不消耗道具',0,46,14,C.muted);
    this.button(p,'invite','邀请同行',0,-12,344,60,()=>this.command('invite'),C.orange,true,23);
    this.button(p,'skip','暂不邀请',0,-76,344,40,()=>this.command('skip'),C.paper,true,14);
  }
  private teamUI(p:Node,height:number){const s=this.state,id=s.recruit!;
    this.text(p,'队伍已满，安排它的位置',0,124,18);
    this.text(p,'攻击点数 '+PETS[id].faces.join(' / '),0,93,15,C.muted);
    this.text(p,'出战 '+petName(s.active)+' 保持不变',0,61,13,C.muted);
    if(s.reserve)this.petImage(p,s.reserve,-91,7,75);this.petImage(p,enemyPet(s),91,7,75);
    this.text(p,'替换',0,9,14,C.muted,50);this.text(p,s.reserve?PETS[s.reserve.id].name:'空位',-91,-40,14,C.ink,150);this.text(p,PETS[id].name,91,-40,14,C.ink,150);
    this.button(p,'collect','收入收藏',-89,-88,166,52,()=>this.command('collect'),'#e8f3fa');
    this.button(p,'replace','替换候补',89,-88,166,52,()=>this.command('replace'),C.orange);
    this.text(p,'被替换的伙伴仍在收藏中',0,-128,11,C.muted);
  }
  private lifeTo(key:string,ratio:number,max:number){
    const meter=this.meters[key];if(!meter)return;
    tween(meter.fill).to(.28,{scale:new Vec3(Math.max(0,ratio),1,1)},{easing:'quadOut',onUpdate:()=>{
      meter.label.string=Math.max(0,Math.ceil(meter.fill.scale.x*max-1e-8))+' / '+max;
    }}).start();
  }
  private popup(value:string,pos:Vec3,fill:string,impact:'normal'|'strong'|'resist'='normal'){
    const n=this.panel(this.fx,pos.x,pos.y+48,impact==='normal'?154:176,impact==='strong'?48:42,C.paper,21,245);
    if(impact==='resist')this.actionIcon(n,'guard',-70,0,19,fill);
    this.text(n,value,impact==='resist'?9:0,0,impact==='strong'?26:22,fill,impact==='resist'?140:166,38);const opacity=n.addComponent(UIOpacity);
    tween(n).by(.55,{position:new Vec3(0,30,0)},{easing:'quadOut'}).start();
    tween(opacity).delay(.32).to(.25,{opacity:0}).call(()=>n.destroy()).start();
  }
  private spark(pos:Vec3,fill:string,strong=false){
    const n=this.makeNode(this.fx,'impact',pos.x,pos.y,120,120),g=n.addComponent(Graphics);
    g.strokeColor=color(fill);g.lineWidth=strong?6:4;g.circle(0,0,24);g.stroke();g.fillColor=color(fill);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*42,y=Math.sin(a)*42;g.moveTo(x,y);g.lineTo(x+Math.cos(a+.7)*12,y+Math.sin(a+.7)*12);g.lineTo(x+Math.cos(a)*24,y+Math.sin(a)*24);g.close();g.fill();}
    n.setScale(.35,.35,1);const opacity=n.addComponent(UIOpacity);
    tween(n).to(.25,{scale:new Vec3(strong?1.4:1,strong?1.4:1,1)}).start();
    tween(opacity).to(.34,{opacity:0}).call(()=>n.destroy()).start();
  }
  private hurt(n:Node,damage:number,guard=false,multiplier=1){
    this.audio.effect('attack');
    const pos=n.position.clone(),sprite=n.getComponent(Sprite)!;Tween.stopAllByTarget(n);
    sprite.color=color(guard?'#c4efff':'#ffc4b0');
    tween(sprite).to(.2,{color:color('#ffffff')}).start();
    tween(n).by(.065,{position:new Vec3(n===this.playerNode?-12:12,0,0),eulerAngles:new Vec3(0,0,n===this.playerNode?6:-6)})
      .to(.18,{position:pos,eulerAngles:Vec3.ZERO},{easing:'backOut'}).start();
    this.spark(pos,guard||multiplier<1?'#62ccfa':'#ffd35a',!guard&&multiplier>1||this.state.doubled);
    this.popup(guard?'格挡  −'+damage:(damage>0&&multiplier>1?'克制 ':damage>0&&multiplier<1?'抵抗 ':'')+'−'+damage,pos,guard||multiplier<1?C.blue:'#bf5427',guard||damage===0?'normal':multiplier>1?'strong':multiplier<1?'resist':'normal');
  }
  private strike(n:Node,target:Node,hit:()=>void){
    Tween.stopAllByTarget(n);const pos=n.position.clone(),base=n.scale.clone(),dx=target.position.x-pos.x,dy=target.position.y-pos.y;
    const approach=new Vec3(pos.x+dx*.58,pos.y+dy*.58,0);
    tween(n).to(.09,{scale:new Vec3(base.x*1.09,base.y*.9,1),position:new Vec3(pos.x-dx*.06,pos.y-5,0)})
      .to(.13,{position:approach,scale:new Vec3(base.x*.96,base.y*1.04,1),eulerAngles:new Vec3(0,0,dx>0?-9:9)},{easing:'quadIn'})
      .call(hit).delay(.045).to(.18,{position:pos,scale:base,eulerAngles:Vec3.ZERO},{easing:'quadOut'}).start();
  }
  private shield(n:Node){
    const pos=n.position.clone(),shield=this.makeNode(this.fx,'shield',pos.x+30,pos.y,100,120),g=shield.addComponent(Graphics);
    g.fillColor=color('#67cfff',100);g.strokeColor=color('#e3faff');g.lineWidth=5;
    g.moveTo(0,55);g.lineTo(40,35);g.lineTo(32,-25);g.lineTo(0,-53);g.lineTo(-32,-25);g.lineTo(-40,35);g.close();g.fill();g.stroke();
    shield.setScale(.5,.5,1);tween(shield).to(.16,{scale:new Vec3(1,1,1)},{easing:'backOut'}).start();
    const opacity=shield.addComponent(UIOpacity);tween(opacity).delay(.5).to(.2,{opacity:0}).call(()=>shield.destroy()).start();
  }
  private itemEffect(n:Node,heal:boolean){
    const pos=n.position.clone();Tween.stopAllByTarget(n);
    tween(n).by(.18,{position:new Vec3(0,18,0)},{easing:'quadOut'}).to(.22,{position:pos},{easing:'quadIn'}).start();
    for(let i=0;i<6;i++){
      const p=this.makeNode(this.fx,heal?'healing-light':'power-light',pos.x+(i%3-1)*39,pos.y-50-Math.floor(i/3)*22,20,20),g=p.addComponent(Graphics);
      g.fillColor=color(heal?'#51d49c':'#ffca52');
      if(heal){g.rect(-3,-10,6,20);g.rect(-10,-3,20,6);}else{g.moveTo(0,14);g.lineTo(7,0);g.lineTo(0,-14);g.lineTo(-7,0);g.close();}g.fill();
      const opacity=p.addComponent(UIOpacity);tween(p).delay(i*.035).by(.42,{position:new Vec3(0,85,0)}).start();
      tween(opacity).delay(.24+i*.035).to(.24,{opacity:0}).call(()=>p.destroy()).start();
    }
    if(!heal)this.spark(pos,'#ffc24b',true);
  }
  private settle(){
    this.render();
    if(this.state.skill?.event&&this.state.phase==='battle')this.popup(this.state.skill.event,new Vec3(0,35,0),'#9565b7');
    if(this.state.phase==='battle'&&this.diceNode){const n=this.diceNode,base=n.scale.clone();
      this.audio.effect('dice');
      tween(n).to(.07,{eulerAngles:new Vec3(0,0,20),scale:new Vec3(base.x*1.13,base.y*1.13,1)})
        .to(.07,{eulerAngles:new Vec3(0,0,-15)}).to(.1,{eulerAngles:Vec3.ZERO,scale:base}).start();
      this.scheduleOnce(()=>{this.busy=false;},.25);
    }else this.busy=false;
  }
  private async command(a:Action){
    if(this.busy)return;const old=this.state,next=act(old,a);if(next===old)return;
    // Commit the entire action before animation; a killed process resumes after this action, never halfway through it.
    this.busy=true;this.state=next;await this.save();
    if(this.modal){this.modal.removeFromParent();this.modal.destroy();this.modal=null;}
    if(a==='eggSearch'){
      this.busy=true;const companion=this.playerNode;if(companion){Tween.stopAllByTarget(companion);tween(companion).by(.12,{position:new Vec3(30,14,0)}).by(.13,{position:new Vec3(8,-9,0)}).by(.12,{position:new Vec3(-7,7,0)}).start();}
      this.popup('沙沙…',new Vec3(0,115,0),'#594522');
      this.scheduleOnce(()=>{this.render();const n=this.enemyNode;if(n){Tween.stopAllByTarget(n);n.setScale(.15,.15,1);tween(n).to(.32,{scale:new Vec3(1.1,1.1,1)},{easing:'backOut'}).to(.16,{scale:Vec3.ONE}).call(()=>this.breathe(n)).start();const e=next.eggHunt!.candidates[next.eggHunt!.selected];this.spark(n.position,this.eggTint(e),e.rarity!=='normal');if(e.rarity!=='normal')this.popup(e.rarity+' !',new Vec3(0,n.position.y+100,0),this.eggTint(e));}this.scheduleOnce(()=>{this.busy=false;},.55);},.48);return;
    }
    const animate=['attack','guard','challenge','heal','boost','invite'].includes(a);
    if(!animate){this.busy=false;this.render();return;}
    this.busy=true;
    if(a==='challenge'){this.settle();return;}
    if(a==='invite'&&this.enemyNode){this.itemEffect(this.enemyNode,false);this.popup('成为伙伴！',this.enemyNode.position,C.green);this.scheduleOnce(()=>this.settle(),.7);return;}
    if(!this.playerNode||!this.enemyNode){this.settle();return;}
    const player=this.playerNode,enemy=this.enemyNode;
    if(a==='heal'||a==='boost'){
      this.itemEffect(player,a==='heal');
      if(a==='heal'){this.lifeTo('player',next.hpRatio,maxHP(next));this.popup('恢复 +'+(hp(next)-hp(old)),player.position,'#218461');}
      else this.popup('攻击 ×'+old.boostMultiplier,player.position,'#b97618');
      this.scheduleOnce(()=>{this.render();if(next.skill?.event)this.popup(next.skill.event,new Vec3(0,35,0),'#9565b7');this.busy=false;},.68);return;
    }
    const retaliation=()=>{this.strike(enemy,player,()=>{
      const damage=next.skill?.lastTaken??(a==='guard'?guardDamage(enemyAttackAmount(old)):enemyAttackAmount(old));
      this.hurt(player,damage,a==='guard',matchupMultiplier(old.enemy,old.active.id));this.lifeTo('player',next.hpRatio,maxHP(next));
    });};
    if(a==='attack'){
      this.strike(player,enemy,()=>{this.hurt(enemy,next.skill?.lastDamage??attackAmount(old),false,matchupMultiplier(old.active.id,old.enemy));this.lifeTo('enemy',next.enemyHP/old.enemyMax,old.enemyMax);this.lifeTo('player',next.hpRatio,maxHP(next));});
      if(next.enemyHP>0){this.scheduleOnce(retaliation,.48);this.scheduleOnce(()=>this.settle(),1.04);}
      else this.scheduleOnce(()=>this.settle(),.76);
    }else{this.shield(player);if(next.skill?.lastDamage)this.lifeTo('enemy',next.enemyHP/old.enemyMax,old.enemyMax);if(next.enemyHP>0)this.scheduleOnce(retaliation,.12);this.scheduleOnce(()=>this.settle(),.74);}
  }
  private overlay(title:string,h=350){
    this.hatchClock=[];
    if(this.modal){this.modal.destroy();this.modal=null;}
    const layer=this.panel(this.root,0,0,390,this.h,'#183852',0,170);this.modal=layer;
    layer.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;});
    const card=this.panel(layer,0,0,356,h);this.text(card,title,0,h/2-36,21);
    return card;
  }
  private fullPage(title:string,subtitle:string,draw:()=>void,back:()=>void=()=>this.exitUtility()){
    if(this.screen==='home'||this.screen==='adventure'||this.screen==='partners'||this.screen==='game')this.utilityOrigin=this.screen;
    this.screen='utility';this.utilityDraw=draw;this.clear();this.layout();this.hatchClock=[];this.breedClock=null;
    this.panel(this.root,0,0,390,this.h,'#edf4f5',0);this.sectionHeader(title,subtitle,back);
    const c=this.makeNode(this.root,'page-content',0,-44,390,this.h-88);
    this.fx=this.makeNode(this.root,'page-effects',0,0,390,this.h);return c;
  }
  private exitUtility(){this.screen=this.utilityOrigin;this.utilityDraw=null;this.render();}
  private pageBounds(c:Node){const h=c.getComponent(UITransform)!.height;return {top:h/2,bottom:-h/2,height:h};}
  private pageHelp(text:string){const c=this.overlay('玩法说明',330);this.text(c,text,0,10,16,C.muted,310,190);this.button(c,'help-close','知道了',0,-119,310,44,()=>this.render(),'#519b81');}
  private helpButton(c:Node,text:string){this.button(this.root,'page-help','?',163,this.h/2-42,36,36,()=>this.pageHelp(text),'#c94a49',true,19);}
  private pagePager(c:Node,y:number,page:number,pages:number,change:(page:number)=>void,prefix:string){
    this.text(c,(pages>1?'左右滑动 · ':'')+(page+1)+' / '+pages,0,y,13,C.muted,220,26);
    if(pages<=1)return;
    const items=c.children.filter(n=>(n as any).listPage!==undefined);if(!items.length)return;
    const upper=Math.max(...items.map(n=>n.position.y+n.getComponent(UITransform)!.height/2))+6;
    const lower=Math.min(...items.map(n=>n.position.y-n.getComponent(UITransform)!.height/2))-6,cy=(upper+lower)/2,h=upper-lower;
    const viewport=this.makeNode(c,prefix+'-swipe',0,cy,390,h);viewport.active=false;viewport.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    const content=this.makeNode(viewport,'pages',-195,0,390*pages,h);content.getComponent(UITransform)!.setAnchorPoint(0,.5);
    const layout=content.addComponent(Layout);layout.type=Layout.Type.HORIZONTAL;layout.resizeMode=Layout.ResizeMode.CONTAINER;
    const sheets=Array.from({length:pages},(_,i)=>this.makeNode(content,'page-'+i,0,0,390,h));
    for(const item of items){const index=(item as any).listPage,pos=item.position.clone();item.setParent(sheets[index]);item.setPosition(pos.x,pos.y-cy);
      if(index!==page){const remove=(n:Node)=>{delete this.controls[n.name];n.children.forEach(remove);};remove(item);}}
    let pv:PageView,vertical=false;
    if(prefix==='collection'){
      viewport.on(Node.EventType.TOUCH_START,()=>{vertical=false;this.pageSwipeActive=false;},this,true);
      viewport.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{const a=e.getUILocation(),b=e.touch!.getUIStartLocation(),dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
        if(!vertical&&!this.pageSwipeActive&&Math.max(dx,dy)>7){if(dy>dx){vertical=true;pv.enabled=false;}else{this.pageSwipeActive=true;this.cancelPartyDrag();}}},this,true);
      const finish=()=>{if(vertical)this.scheduleOnce(()=>{if(viewport.isValid)pv.enabled=true;},0);};
      viewport.on(Node.EventType.TOUCH_END,finish,this,true);viewport.on(Node.EventType.TOUCH_CANCEL,finish,this,true);
    }
    pv=viewport.addComponent(PageView);pv.content=content;pv.direction=PageView.Direction.HORIZONTAL;pv.scrollThreshold=.18;pv.pageTurningSpeed=.22;pv.pageTurningEventTiming=1;pv.cancelInnerEvents=true;
    viewport.active=true;layout.updateLayout();pv.scrollToPage(page,0);
    viewport.on(PageView.EventType.PAGE_TURNING,()=>{const next=pv.getCurrentPageIndex();if(next!==page){this.pageSwipeActive=false;this.pressPending=false;change(next);}});
  }
  private listItem(n:Node,index:number,size:number){(n as any).listPage=Math.floor(index/size);return n;}
  private confirmGuard(){const c=this.overlay('放弃这次攻击强化？',245);
    this.text(c,'防御会放弃已使用的 ×'+this.state.boostMultiplier+' 强化',0,34,14,C.muted,320);
    this.button(c,'cancel','返回',-82,-49,145,52,()=>this.render(),'#e8f3fa');
    this.button(c,'confirmGuard','仍然防御',82,-49,145,52,()=>this.command('guard'),C.blue);
  }
  private menu(){const c=this.overlay('伙伴骰子冒险',390);
    this.text(c,mapFor(this.state).name+' · '+mapStageCount(this.state)+' 关 · '+MAPS.length+' 张地图',0,112,14,C.muted);
    this.button(c,'resume','继续冒险',0,58,300,50,()=>this.render(),C.orange);
    this.button(c,'collection','伙伴收藏  '+this.state.pets!.length+' 只',0,-3,300,48,()=>this.collection(),C.blue);
    this.button(c,'eggBag','孵化屋  ·  '+availableEggs(this.state).length+' 枚待孵',0,-61,300,46,()=>this.hatchery(),'#46976e');
    this.button(c,'home','返回营地',0,-115,300,42,()=>this.goHome(),'#e8f3fa');
    this.text(c,'退出自动续玩 · 收藏与宠物蛋永久保留',0,-163,12,C.muted,320,28);
  }
  private collection(page=0){this.screen='partners';this.partnerOwnedOnly=true;this.partnerPage=page;this.partnerSelected=this.partnerSelected||(hasActivePet(this.state)?this.state.active.uid!:null);this.render();}
  private confirmRestart(){const c=this.overlay('重新出发？',250);this.text(c,'本局进度重置，收藏与已带走的宠物蛋保留',0,35,14,C.muted,320);
    this.button(c,'cancel','继续当前',-82,-49,145,52,()=>this.render(),'#e8f3fa');this.button(c,'restart','重新出发',82,-49,145,52,()=>this.restart(),C.orange);}
  private restart(){const id=mapFor(this.state).id;this.state=retreatExpedition(this.state);this.save();this.mapIndex=id;this.screen='adventure';this.render();}

  private hatchTime(ms:number){if(!Number.isFinite(ms))return '等待联网';if(ms<=0)return '可以破壳啦！';const sec=Math.ceil(ms/1000);return Math.floor(sec/60).toString().padStart(2,'0')+':'+(sec%60).toString().padStart(2,'0');}
  private hatchery(){
    if(this.state.pendingHatch){this.hatchReveal();return;}
    const c=this.fullPage('孵化屋','离线成长',()=>this.hatchery()),s=this.state,{top,bottom,height}=this.pageBounds(c);
    this.helpButton(c,'新放入的蛋孵化 '+hatchDuration(s)/60000+' 分钟，离线继续。\n完整观看视频，孵化时间减少 30 分钟。\nSR 蛋至少孵出 SR；SSR 蛋必出 SSR。');
    const cardH=height-174,cardY=top-24-cardH/2;
    for(let index=0;index<2;index++){
      const x=index===0?-91:91,slot=s.incubators?.[index],egg=slot?s.eggs!.find(e=>e.id===slot.eggId):null;
      const p=egg&&slot?this.panel(c,x,cardY,172,cardH,'#ffffff',18):this.button(c,'hatch-slot-'+index,'',x,cardY,172,cardH,()=>this.eggPicker(index),'#ffffff');
      this.text(p,'0'+(index+1),0,cardH/2-25,14,C.muted,150,24);
      if(egg&&slot){const ready=hatchRemaining(slot)===0;const art=this.eggArt(p,egg,0,48,Math.min(190,cardH-202));this.breathe(art);
        this.text(p,this.eggName(egg),0,-cardH/2+126,16,this.eggTint(egg),158,26).isBold=true;
        const label=this.text(p,this.hatchTime(hatchRemaining(slot)),0,-cardH/2+89,23,ready?'#2b9b66':C.ink,160,32);this.hatchClock.push({label,index,ready});
        const button=this.button(p,'hatch-slot-'+index,ready?'破壳！':'',0,-cardH/2+39,150,46,()=>{
          if(!ready){void this.watchHatchAd(index);return;}if(!this.requireTime())return;const next=claimHatch(this.state,index);if(next!==this.state&&next.pendingHatch)this.audio.effect('hatch');this.state=next;this.save();this.hatchery();
        },ready?'#dba441':'#519b81',!this.adPending,17);
        if(!ready){this.menuIcon(button,'video',-46,0,25);this.text(button,'−30分钟',20,0,16,'#ffffff',98,28).isBold=true;}
      }else{
        this.text(p,'+',0,16,76,'#7da99a',140,100);
        this.text(p,'放入宠物蛋',0,-48,16,C.muted,154,30);
      }
    }
    const foot=this.panel(c,0,bottom+65,390,130,'#fffdf5',22);this.text(foot,'待孵化  '+availableEggs(s).length,0,31,16,C.muted,350,28);
    this.button(foot,'hatch-bag','蛋袋  ›',0,-19,350,48,()=>this.eggBag(),'#519b81',true,20);this.controls['hatch-close']=this.controls['nav-home'];
  }
  private hatchAdNotice(message:string){const c=this.overlay('孵化加速',218);this.text(c,message,0,26,15,C.muted,318,60);this.button(c,'hatch-ad-close','返回',0,-58,300,46,()=>this.hatchery(),'#519b81');}
  private rerollAdNotice(message:string){const c=this.overlay('刷新对手',218);this.text(c,message,0,26,15,C.muted,318,60);this.button(c,'reroll-ad-close','返回',0,-58,300,46,()=>this.render(),'#427b9e');}
  private async watchRerollAd(){
    if(this.adPending||this.busy||this.state.phase!=='encounter'||this.state.swaps>0||rankForStage(this.state.step)==='boss')return;
    const bridge=(globalThis as any).pmRewardedAd as {show:(request:{placement:string})=>Promise<{completed:boolean}>}|undefined;
    if(!bridge||typeof bridge.show!=='function'){this.rerollAdNotice('激励广告待接入，暂不能刷新');return;}
    const token=[this.state.mapId,this.state.step,this.state.seed,this.state.revision].join(':');
    this.adPending=true;this.busy=true;this.audio.pause('ad');
    try{const result=await bridge.show({placement:'encounter_reroll'});
      if(token!==[this.state.mapId,this.state.step,this.state.seed,this.state.revision].join(':')||this.state.phase!=='encounter')return;
      if(result?.completed===true){this.state=grantRerollAd(this.state,true);this.save();this.render();}
      else this.rerollAdNotice('完整观看视频后可刷新');
    }catch{this.rerollAdNotice('广告暂不可用，请稍后再试');}
    finally{this.adPending=false;this.busy=false;this.audio.resume('ad');}
  }
  private async watchHatchAd(index:number){
    if(this.adPending||!this.requireTime())return;this.settlePendingAd();const slot=this.state.incubators?.[index];if(!slot||hatchRemaining(slot)===0){this.hatchery();return;}
    const bridge=(globalThis as any).pmRewardedAd as {show:(request:{placement:string})=>Promise<{completed:boolean}>}|undefined;
    if(!bridge||typeof bridge.show!=='function'){this.hatchAdNotice('激励广告待接入，暂不能加速');return;}
    const eggId=slot.eggId;this.adPending=true;this.busy=true;this.audio.pause('ad');
    try{const result=await bridge.show({placement:'hatch_reduce_30m'});
      if(result?.completed===true){this.state.pendingHatchAd={index,eggId};this.save();if(this.trustedClock.now()===null)await this.synchronizeTime();this.settlePendingAd();this.save();}
      this.hatchery();if(this.state.pendingHatchAd)this.timeNotice('加速奖励已保留，联网后到账');else if(result?.completed!==true)this.hatchAdNotice('完整观看视频后可加速');
    }catch{this.hatchAdNotice('广告暂不可用，请稍后再试');}
    finally{this.adPending=false;this.busy=false;this.audio.resume('ad');if(!this.modal)this.hatchery();}
  }
  private eggPicker(slot:number,page=0){
    this.eggShelf(slot,page);
  }
  private hatchReveal(){
    const r=this.state.pendingHatch;if(!r){this.hatchery();return;}const p=petEntry(this.state,r.uid!),tint=r.rarity==='SSR'?'#b78022':r.rarity==='SR'?'#8b61bb':'#46976e';
    const ack=()=>{this.state=acknowledgeHatch(this.state);this.save();this.hatchery();},c=this.fullPage('新伙伴',rarityName(p.rarity),()=>this.hatchReveal(),ack),{top,bottom,height}=this.pageBounds(c),cardH=height-234;
    this.panel(c,0,top-24-cardH/2,354,cardH,r.rarity==='SSR'?'#fff0ca':r.rarity==='SR'?'#f0e8fb':'#e6f3e8',22);
    const art=this.petImage(c,p,0,top-24-cardH/2,Math.min(252,cardH-40));art.setScale(.5,.5,1);tween(art).to(.3,{scale:Vec3.ONE},{easing:'backOut'}).start();
    const foot=this.panel(c,0,bottom+100,390,200,'#fffdf5',22);
    this.text(foot,petName(p)+' '+sexSymbol(p.sex),0,73,24,tint,350,36).isBold=true;
    this.text(foot,'HP '+petBaseHP(p)+'    ⚔ '+p.faces.join(' / '),0,35,16,C.ink,350,28);
    this.text(foot,petSkills(p).map(code=>SKILLS[code][0]).join(' · '),0,-5,14,tint,350,46);
    this.button(foot,'hatch-ack','收下伙伴',0,-61,350,48,ack,'#dba441',true,20);
  }
  private qualityDetail(key:string,rarity:EggRarity,page:number){
    const p=petEntry(this.state,key),codes=petSkills(p),c=this.overlay(petName(p)+' '+sexSymbol(p.sex),550);
    this.petImage(c,p,-103,153,104);this.text(c,PETS[p.id].type+' · '+rarityName(p.rarity),55,184,18,C.ink,190,28);
    this.text(c,'HP '+petBaseHP(p),55,151,17,C.ink,190,28);this.text(c,'⚔ '+(p.baseFaces||p.faces).join(' / '),55,120,15,C.muted,190,27);
    codes.forEach((code,i)=>{const y=60-i*43;this.panel(c,0,y,320,39,i%2?'#eef4f3':'#f8f4e9',9);this.text(c,SKILLS[code][0],-102,y,13,'#487d70',100,32).isBold=true;this.text(c,SKILLS[code][1],54,y,11,C.muted,196,36);});
    this.text(c,'各技能自动触发 · 每场限一次',0,-213,12,C.muted,310,25);
    this.button(c,'quality-back','返回伙伴',0,-246,302,36,()=>{this.partnerPage=page;this.render();},C.blue,true,16);
  }

  private breedingUI(){
    const s=this.state,b=s.breeding,c=this.fullPage('交配屋',b?'交配中':'选择一雌一雄',()=>this.breedingUI()),{top,bottom,height}=this.pageBounds(c);
    this.helpButton(c,'形态、HP、攻击各有 50% 随父或随母。\n技能从父母技能池随机继承，最多 6 个。\n交配需 30 分钟，离线继续。\n领取蛋后父母消失，蛋需再孵化。');
    if(!b){if(this.breedMother===s.active.uid||!s.pets!.some(p=>p.uid===this.breedMother))this.breedMother='';if(this.breedFather===s.active.uid||!s.pets!.some(p=>p.uid===this.breedFather))this.breedFather='';}
    const mother=b?.mother||this.breedMother,father=b?.father||this.breedFather;
    this.breedClock=null;
    const cardH=height-258,cardY=top-28-cardH/2;
    ([['female',mother,-91],['male',father,91]] as [Sex,string,number][]).forEach(([sex,key,x])=>{
      const p=s.pets!.find(p=>p.uid===key),card=this.button(c,'breed-'+sex,'',x,cardY,172,cardH,()=>this.breedingPicker(sex),sex==='female'?'#f7e6ec':'#e4eff8',!b,16,sex==='female'?'#f7e6ec':'#e4eff8');
      this.text(card,sex==='female'?'♀':'♂',0,cardH/2-30,28,sex==='female'?'#b46a8b':'#5086ac',150,36).isBold=true;
      if(p){this.petImage(card,p,0,8,Math.min(158,cardH-150));this.text(card,petName(p),0,-cardH/2+61,18,C.ink,158,30);this.text(card,rarityName(p.rarity)+' · '+petSkills(p).length+' 技能',0,-cardH/2+29,13,C.muted,158,26);}
      else{this.text(card,'+',0,8,54,'#93a7b4',150,75);this.text(card,'选择伙伴',0,-cardH/2+44,16,C.muted,158,30);}
    });
    this.text(c,'♥',0,cardY,22,'#d8809c',30,34);
    const foot=this.panel(c,0,bottom+105,390,210,'#fffdf5',22);
    this.text(foot,'领取蛋后，父母消失',0,80,15,'#b45f62',350,28).isBold=true;
    if(b){const now=gameNow(),left=Number.isFinite(now)?Math.max(0,b.readyAt-now):Infinity,locked=s.phase==='battle'||!!s.pendingHatch,clock=this.text(foot,left?this.hatchTime(left):'可以领蛋',0,43,25,'#a66f91',350,36);this.breedClock=left?clock:null;
      this.button(foot,'breed-claim',s.phase==='battle'?'战斗中':s.pendingHatch?'先领取新伙伴':left?'交配中…':'领取宠物蛋',0,-9,350,48,()=>{if(!this.requireTime())return;const next=claimBreeding(this.state);if(next!==this.state){this.state=next;this.breedMother='';this.breedFather='';this.partnerSelected=null;this.screen='home';this.save();this.render();this.hatchery();}},'#b57b9b',!left&&!locked,19);
    }else{this.text(foot,'30:00',0,43,25,'#a66f91',350,36);
      this.button(foot,'breed-start','开始交配',0,-9,350,48,()=>{if(!this.requireTime())return;const next=startBreeding(this.state,this.breedMother,this.breedFather);if(next!==this.state){this.state=next;this.save();this.breedingUI();}},'#b57b9b',!!mother&&!!father,20);
    }
    this.button(foot,'breed-hatch','孵化屋 ›',0,-67,350,38,()=>this.hatchery(),'#dbe9ef',true,16);this.controls['breed-back']=this.controls['nav-home'];
  }
  private breedingPicker(sex:Sex,page=0){
    const pets=this.state.pets!.filter(p=>p.sex===sex&&p.uid!==this.state.active.uid),pages=Math.max(1,Math.ceil(pets.length/4));page=Math.max(0,Math.min(page,pages-1));
    const c=this.fullPage(sex==='female'?'选择雌性 ♀':'选择雄性 ♂',pets.length+' 只',()=>this.breedingPicker(sex,page),()=>this.breedingUI()),{top,bottom,height}=this.pageBounds(c),rowH=Math.min(120,(height-130)/4);
    pets.forEach((p,itemIndex)=>{const i=itemIndex%4;const y=top-24-rowH/2-i*(rowH+12),row=this.button(c,'breed-pick-'+p.uid,'',0,y,354,rowH,()=>{if(sex==='female')this.breedMother=p.uid!;else this.breedFather=p.uid!;this.breedingUI();},'#ffffff');
      this.listItem(row,itemIndex,4);this.petImage(row,p,-119,0,64);this.text(row,petName(p)+' '+sexSymbol(p.sex),-3,19,17,C.ink,160,27).isBold=true;
      this.text(row,rarityName(p.rarity),132,19,14,p.rarity==='SSR'?'#b78022':'#8b61bb',50,25);
      this.text(row,'HP '+petBaseHP(p)+' · ⚔ '+(p.baseFaces||p.faces).join('/'),22,-6,12,C.muted,240,24);
    });
    if(!pets.length)this.text(c,'暂无可交配的'+(sex==='female'?'雌性':'雄性')+'伙伴',0,36,20,C.muted,330,60);
    this.pagePager(c,bottom+42,page,pages,p=>this.breedingPicker(sex,p),'breed-picker');this.controls['breed-picker-back']=this.controls['nav-home'];
  }
  private socialInput(parent:Node,id:string,value:string,y:number,placeholder:string,onChange:(value:string)=>void){
    const n=this.panel(parent,0,y,316,48,'#e8f3fa',12);n.name=id;n.active=false;
    const label=this.text(n,'',0,0,14,C.ink,296,38),hint=this.text(n,placeholder,0,0,14,C.muted,296,38);
    label.node.getComponent(UITransform)!.setAnchorPoint(0,1);hint.node.getComponent(UITransform)!.setAnchorPoint(0,1);
    label.horizontalAlign=hint.horizontalAlign=Label.HorizontalAlign.LEFT;
    const edit=n.addComponent(EditBox);edit.textLabel=label;edit.placeholderLabel=hint;edit.inputMode=EditBox.InputMode.SINGLE_LINE;
    edit.inputFlag=EditBox.InputFlag.DEFAULT;edit.returnType=EditBox.KeyboardReturnType.DONE;edit.maxLength=320;edit.string=value;edit.placeholder=placeholder;
    n.on('text-changed',(box:EditBox)=>onChange(box.string));
    n.active=true;
    const world=n.worldPosition;this.controls[id]={x:world.x,y:this.h-world.y,w:316,h:48};return edit;
  }
  private socialUI(tab:'visit'|'share'|'bonds'=this.socialTab){
    if(!this.state.social){this.state=ensureSocial(this.state,Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));this.save();}
    this.socialTab=tab;this.breedClock=null;
    const c=this.fullPage('来信','好友 · 结缘',()=>this.socialUI(tab)),{top}=this.pageBounds(c);
    this.helpButton(c,'分享来访码，邀请好友伙伴作客。\n完成 3 次互动，解锁该伙伴系列。\n用自己的蛋结缘，品质保持不变。\n未解锁地区仅支持 R 蛋。\n来访伙伴不会进入收藏或参与交配。');
    const tabs:[typeof tab,string][]=[['visit','来访'],['share','分享'],['bonds','结缘']];
    tabs.forEach(([key,label],i)=>this.button(c,'social-tab-'+key,label,(i-1)*120,top-34,112,42,()=>{this.socialNote='';this.socialPage=0;this.socialUI(key);},key===tab?'#769cba':'#dbe9ef',true,17));
    if(tab==='visit')this.visitorUI(c);else if(tab==='share')this.shareUI(c);else this.bondsUI(c);
    this.controls['social-close']=this.controls['nav-home'];
  }
  private visitorUI(c:Node){
    const {top,bottom,height}=this.pageBounds(c),input=this.socialInput(c,'visit-code',this.visitCode,top-98,'粘贴好友来访码',value=>this.visitCode=value);
    this.button(c,'visit-paste','粘贴',-81,top-154,150,42,()=>{
      const clipboard=(globalThis as any).navigator?.clipboard;
      if(!clipboard?.readText){this.socialNote='长按输入框粘贴';this.socialUI('visit');return;}
      clipboard.readText().then((value:string)=>{if(!input.isValid)return;this.visitCode=value.trim();input.string=this.visitCode;this.socialNote='已粘贴';this.socialUI('visit');}).catch(()=>{if(!input.isValid)return;this.socialNote='长按输入框粘贴';this.socialUI('visit');});
    },'#e8f3fa',true,16);
    this.button(c,'visit-receive','邀请',81,top-154,150,42,()=>{
      const code=input.string.trim(),card=readVisitCode(code);this.visitCode=code;
      if(!card)this.socialNote='来访码不完整';
      else if(card.owner===this.state.social!.owner)this.socialNote='请使用好友的来访码';
      else{const next=receiveVisitor(this.state,code);if(next===this.state)this.socialNote='好友已在这里';else{this.state=next;this.save();this.socialNote='新朋友来啦！';}}
      this.socialUI('visit');
    },'#769cba',true,16);
    this.text(c,this.socialNote,0,top-196,14,C.muted,350,30);
    const visit=this.state.social?.visitor,guest=visitorPet(this.state);
    if(!visit||!guest){this.text(c,'♡',0,-10,70,'#b57b9b',330,100);this.text(c,'等待新朋友',0,-90,21,C.muted,350,40);return;}
    const local=this.state.pets?.find(p=>p.uid===this.state.active.uid)||this.state.pets?.[0],progress=visit.progress;
    const cardH=height-413,card=this.panel(c,0,bottom+181+cardH/2,354,cardH,'#ffffff',20),artSize=Math.min(148,cardH-74);
    if(local)this.text(card,'我的伙伴',-86,cardH/2-23,13,C.muted,155,24);this.text(card,'好友伙伴',local?86:0,cardH/2-23,13,'#769cba',155,24);
    const own=local?this.petImage(card,local,-86,0,artSize):null,visitor=this.petImage(card,guest,local?86:0,0,artSize);
    if(own)this.breathe(own);this.breathe(visitor);
    if(local)this.text(card,petName(local),-86,-cardH/2+24,14,C.ink,158,26);
    this.text(card,petName(guest)+' · '+rarityName(guest.rarity),local?86:0,-cardH/2+24,14,C.ink,158,26);
    this.panel(c,0,bottom+80,390,160,'#fffdf5',22);
    this.text(c,progress>=3?'♡ 已结缘':('♥ '.repeat(progress)+'○ '.repeat(3-progress)).trim()+'   '+progress+' / 3',0,bottom+129,21,'#b57997',350,32).isBold=true;
    const names=['招招手','喂点心','一起玩'];
    this.button(c,progress>=3?'visit-bond':'visit-play',progress>=3?'结缘孵化 ›':names[Math.min(progress,2)],0,bottom+76,350,50,()=>{if(progress>=3){this.socialPage=0;this.socialNote='';this.socialUI('bonds');}else this.playVisitor(c,own,visitor);},'#b57b9b',true,20);
    this.text(c,progress>=3?'使用自己的蛋':'互动 3 次即可结缘',0,bottom+28,13,C.muted,350,26);
  }
  private playVisitor(c:Node,own:Node|null,guest:Node){
    const visitor=this.state.social?.visitor;if(!visitor||visitor.progress>=3||this.busy)return;
    const id=visitor.card.id,progress=visitor.progress;this.busy=true;
    const action=c.children.find(n=>n.name==='visit-play');if(action){const label=action.getComponentsInChildren(Label)[0];if(label)label.string=['正在招手…','一起吃点心…','开心地玩耍…'][progress];}
    [own,guest].filter(Boolean).forEach((n:Node,i)=>{Tween.stopAllByTarget(n);const p=n.position.clone(),direction=own?(i===0?1:-1):1;
      tween(n).to(.18,{scale:new Vec3(1.06,.94,1)}).by(.28,{position:new Vec3(direction*10,17,0)},{easing:'quadOut'}).by(.28,{position:new Vec3(-direction*10,-17,0)},{easing:'quadIn'}).to(.16,{scale:Vec3.ONE}).delay(.15).by(.28,{position:new Vec3(direction*7,12,0)},{easing:'quadOut'}).by(.28,{position:new Vec3(-direction*7,-12,0)},{easing:'quadIn'}).to(.16,{scale:new Vec3(1.04,.97,1)}).to(.18,{scale:Vec3.ONE}).to(.18,{position:p}).start();
    });
    for(let i=0;i<3;i++){const heart=this.text(c,'♥',(i-1)*31,-21-i*7,23,'#de92aa',34,40).node;heart.setScale(0,0,1);tween(heart).delay(.35+i*.42).to(.2,{scale:Vec3.ONE},{easing:'backOut'}).by(.9,{position:new Vec3((i-1)*8,45,0)}).to(.2,{scale:Vec3.ZERO}).start();}
    this.scheduleOnce(()=>{
      if(this.state.social?.visitor?.card.id===id){const next=visitAction(this.state);if(next!==this.state){this.state=next;this.save();this.socialNote=this.state.social!.visitor!.progress>=3?'结缘成功！':'好感 +1';}else this.socialNote='稍等片刻';}
      this.busy=false;if(c.isValid)this.socialUI('visit');
    },VISIT_ACTION_MS/1000+.1);
  }
  private shareUI(c:Node){
    const {top,bottom,height}=this.pageBounds(c);
    const pets=this.state.pets||[],chosen=pets.find(p=>p.uid===this.sharePetUid)||pets.find(p=>p.uid===this.state.active.uid)||pets[0];
    if(!chosen){this.text(c,'暂无伙伴',0,40,21,C.muted,350,50);this.button(c,'share-hatch','去孵化',0,bottom+48,350,48,()=>this.hatchery(),'#519b81');return;}
    this.sharePetUid=chosen.uid!;const code=makeVisitCode(this.state,chosen.uid!)||'';
    const cardH=height-342,card=this.panel(c,0,top-78-cardH/2,354,cardH,'#ffffff',20),art=this.petImage(card,chosen,0,27,Math.min(180,cardH-98));this.breathe(art);
    this.text(card,petName(chosen)+' '+sexSymbol(chosen.sex)+' · '+rarityName(chosen.rarity),0,-cardH/2+62,21,C.ink,330,32).isBold=true;
    this.button(card,'share-choose','更换伙伴 ›',0,-cardH/2+26,244,32,()=>this.sharePicker(),'#dbe9ef',true,15);
    this.panel(c,0,bottom+122,390,244,'#fffdf5',22);
    const input=this.socialInput(c,'share-code',code,bottom+192,'来访码',()=>{});
    this.button(c,'share-copy','复制来访码',0,bottom+130,350,50,()=>{
      const clipboard=(globalThis as any).navigator?.clipboard;
      const fallback=()=>{if(!input.isValid)return;this.socialNote='长按来访码，全选复制';this.socialUI('share');};
      if(!clipboard?.writeText){fallback();return;}
      clipboard.writeText(code).then(()=>{if(!input.isValid)return;this.socialNote='已复制，发给好友吧';this.socialUI('share');}).catch(fallback);
    },'#769cba',!!code,18);
    this.text(c,this.socialNote||'复制后发给好友',0,bottom+76,15,C.muted,350,30);
    this.text(c,'伙伴仍留在你的营地',0,bottom+34,13,C.muted,350,26);
  }
  private sharePicker(page=0){
    const pets=this.state.pets||[],pages=Math.max(1,Math.ceil(pets.length/4));page=Math.max(0,Math.min(page,pages-1));
    const c=this.fullPage('选择伙伴',pets.length+' 只',()=>this.sharePicker(page),()=>this.socialUI('share')),{top,bottom,height}=this.pageBounds(c),rowH=Math.min(120,(height-130)/4);
    pets.forEach((p,itemIndex)=>{const i=itemIndex%4;const y=top-24-rowH/2-i*(rowH+12),row=this.button(c,'share-pick-'+p.uid,'',0,y,354,rowH,()=>{this.sharePetUid=p.uid!;this.socialNote='';this.socialUI('share');},'#ffffff');this.listItem(row,itemIndex,4);this.petImage(row,p,-116,0,Math.min(84,rowH-16));this.text(row,petName(p)+' '+sexSymbol(p.sex),29,16,18,C.ink,208,30);this.text(row,rarityName(p.rarity)+' · '+PETS[p.id].type,29,-18,14,C.muted,208,26);});
    this.pagePager(c,bottom+42,page,pages,p=>this.sharePicker(p),'share');this.controls['share-picker-back']=this.controls['nav-home'];
  }
  private bondsUI(c:Node){
    const {top,bottom,height}=this.pageBounds(c),bonds=friendBonds(this.state),pages=Math.max(1,Math.ceil(bonds.length/6));this.socialPage=Math.max(0,Math.min(this.socialPage,pages-1));
    const cardH=Math.min(170,(height-222)/2);
    bonds.forEach((bond,itemIndex)=>{const i=itemIndex%6;const row=this.button(c,'bond-select-'+bond.species,'',(i%3-1)*120,top-80-cardH/2-Math.floor(i/3)*(cardH+12),112,cardH,()=>this.bondEggPicker(bond.species),'#ffffff'),p:Pet={id:bond.species,rarity:'normal',faces:[...PETS[bond.species].faces]};
      this.listItem(row,itemIndex,6);this.petImage(row,p,0,12,Math.min(96,cardH-48));this.text(row,PETS[bond.species].name,0,-cardH/2+23,13,C.ink,106,27).isBold=true;
    });
    if(!bonds.length)this.text(c,'与好友互动 3 次即可结缘',0,27,20,C.muted,350,60);
    this.pagePager(c,bottom+88,this.socialPage,pages,p=>{this.socialPage=p;this.socialUI('bonds');},'bonds');
    this.text(c,'选择伙伴系列，再选自己的蛋',0,bottom+34,14,C.muted,350,28);
  }
  private bondEggPicker(target:PetId,page=0){
    const eggs=availableEggs(this.state),eligible=new Set(bondEligibleEggs(this.state,target).map(e=>e.id)),pages=Math.max(1,Math.ceil(eggs.length/4));page=Math.max(0,Math.min(page,pages-1));
    const c=this.fullPage('选择结缘蛋',PETS[target].name+'系列',()=>this.bondEggPicker(target,page),()=>this.socialUI('bonds')),free=[0,1].find(i=>!this.state.incubators?.[i]),{top,bottom,height}=this.pageBounds(c),rowH=Math.min(120,(height-176)/4);
    eggs.forEach((egg,itemIndex)=>{const i=itemIndex%4;const y=top-24-rowH/2-i*(rowH+12),reason=bondBlockReason(this.state,egg,target),enabled=eligible.has(egg.id)&&free!==undefined,row=this.panel(c,0,y,354,rowH,enabled?'#ffffff':'#e3e9eb',14);
      this.listItem(row,itemIndex,4);this.eggArt(row,egg,-130,0,Math.min(72,rowH-20));this.text(row,this.eggName(egg),-24,16,16,this.eggTint(egg),136,27);this.text(row,reason?(egg.bond?'已结缘':'地区未解锁'):free===undefined?'孵化位已满':egg.genes?'保留遗传':rarityName(egg.rarity)+' · '+hatchDuration(this.state)/60000+'分',-24,-17,12,C.muted,136,28);
      this.button(row,'bond-egg-'+egg.id,'选择',112,0,72,42,()=>this.bondConfirm(target,egg.id,page),'#b57b9b',enabled,16);
    });
    if(!eggs.length)this.text(c,'暂无可用的蛋',0,41,21,C.muted,350,60);
    this.pagePager(c,bottom+109,page,pages,p=>this.bondEggPicker(target,p),'bond-eggs');
    this.button(c,'bond-eggs-hatch',free===undefined?'孵化位已满 · 去查看':'孵化屋 ›',0,bottom+44,350,46,()=>this.hatchery(),'#dbe9ef',true,17);this.controls['bond-eggs-back']=this.controls['nav-home'];
  }
  private bondConfirm(target:PetId,eggId:string,page:number){
    const egg=availableEggs(this.state).find(e=>e.id===eggId);if(!egg){this.bondEggPicker(target,page);return;}
    const slot=[0,1].find(i=>!this.state.incubators?.[i]),reason=bondBlockReason(this.state,egg,target),c=this.fullPage('结缘孵化','品质不变',()=>this.bondConfirm(target,eggId,page),()=>this.bondEggPicker(target,page)),p:Pet={id:target,rarity:egg.rarity,faces:[...PETS[target].faces]},{top,bottom,height}=this.pageBounds(c),cardH=height-244;
    const card=this.panel(c,0,top-24-cardH/2,354,cardH,'#ffffff',22);
    this.eggArt(card,egg,-95,12,108);this.text(card,'→',0,12,30,'#9aaaac',55,50);this.petImage(card,p,95,12,128);
    this.text(card,rarityName(egg.rarity)+' · '+PETS[target].name,0,-cardH/2+39,22,'#a36c8e',330,36).isBold=true;
    const foot=this.panel(c,0,bottom+100,390,200,'#fffdf5',22);
    this.text(foot,'宠物蛋 ×1  ·  孵化位 ×1',0,65,17,C.ink,350,30);
    this.text(foot,hatchDuration(this.state)/60000+(egg.genes?' 分钟 · 保留遗传':' 分钟 · 离线继续'),0,28,15,C.muted,350,30);
    if(reason||slot===undefined)this.text(foot,reason||'孵化位已满',0,-6,13,'#b45f62',350,28);
    this.button(foot,'bond-confirm','开始孵化',0,-55,350,50,()=>{
      const current=[0,1].find(i=>!this.state.incubators?.[i]);if(current===undefined){this.bondEggPicker(target,page);return;}
      if(!this.requireTime())return;const next=startBondIncubation(this.state,eggId,target,current);if(next===this.state){this.bondEggPicker(target,page);return;}this.state=next;this.save();this.hatchery();
    },'#b57b9b',!reason&&slot!==undefined,18);
    this.controls['bond-cancel']=this.controls['nav-home'];
  }
  private goHome(){this.state=retreatExpedition(this.state);this.screen='home';this.save();this.render();}
  private retreatButton(y:number){const n=this.button(this.root,'retreat','',161,y,44,42,()=>this.goHome(),C.paper);this.menuIcon(n,'home',0,0,28,'#397c80');}
  private fillArt(key:string){const n=this.image(this.root,key,0,0,390,this.h),os=this.art[key].originalSize,k=Math.max(390/os.width,this.h/os.height);n.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);return n;}
  private regionFrame(kind:'battle'|'nest'){return this.art['region-'+((this.state.mapId||0)+1)+'-'+kind+'-v1']||this.art[kind==='battle'?'battle-arena':'egg-nest-v1'];}
  private async loadRegionArt(mapId:number){
    if(mapId===0)return;
    if(!this.regionLoads[mapId])this.regionLoads[mapId]=Promise.all(['battle','nest'].map(async kind=>{
      const key='region-'+(mapId+1)+'-'+kind+'-v1';if(this.art[key])return;
      this.art[key]=await new Promise<SpriteFrame>((resolve,reject)=>resources.load('art/'+key+'/spriteFrame',SpriteFrame,(error,frame)=>error?reject(error):resolve(frame)));
    })).then(()=>{}).catch(error=>{delete this.regionLoads[mapId];throw error;});
    if(!this.padLoad)this.padLoad=new Promise<Texture2D>((resolve,reject)=>resources.load('art/region-pads-v1/texture',Texture2D,(error,texture)=>error?reject(error):resolve(texture))).then(texture=>{
      for(const [map,rect] of Object.entries(REGION_PAD_RECTS)){const [x,y,w,h]=rect,frame=new SpriteFrame();frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art['region-pad-'+map]=frame;}
    }).catch(error=>{this.padLoad=null;throw error;});
    await Promise.all([this.regionLoads[mapId],this.padLoad]);
  }
  private async loadHomeArt(period:HomePeriod){
    const key=homeArtKey(period);if(this.art[key])return;
    if(!this.homeLoads[key])this.homeLoads[key]=new Promise<SpriteFrame>((resolve,reject)=>resources.load('art/'+key+'/spriteFrame',SpriteFrame,(error,frame)=>error?reject(error):resolve(frame))).then(frame=>{this.art[key]=frame;}).catch(error=>{delete this.homeLoads[key];throw error;});
    await this.homeLoads[key];
  }
  private async refreshHomeArt(){
    if(this.screen!=='home'||!this.homeBackground?.isValid)return;
    const period=homePeriod(),target=this.homeBackground;this.homePeriod=period;
    try{await this.loadHomeArt(period);if(this.screen!=='home'||target!==this.homeBackground||!target.isValid||homePeriod()!==period)return;
      const frame=this.art[homeArtKey(period)],sp=target.getComponent(Sprite)!;
      if(sp.spriteFrame!==frame){sp.spriteFrame=frame;const os=frame.originalSize,k=Math.max(390/os.width,this.h/os.height);target.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);this.homeAtmosphere();}
    }catch{/* Keep the last valid scene; the next cosmetic clock check retries. */}
  }
  private homeAtmosphere(){
    if(this.homeAmbient?.isValid){for(const n of this.homeAmbient.children){Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);}this.homeAmbient.destroy();}
    if((globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const layer=this.makeNode(this.root,'home-ambient',0,0,390,this.h);layer.setSiblingIndex(1);this.homeAmbient=layer;
    const night=['evening','midnight','dawn'].includes(this.homePeriod),top=this.h/2-105,bottom=-this.h/2+360,span=Math.max(40,top-bottom);
    // At most ten small vector sprites; no real-time lights, blur or shaders.
    for(let i=0;i<10;i++){
      const x=-175+(i*83%350),y=bottom+(i*47%Math.floor(span)),n=this.makeNode(layer,'ambient-'+i,x,y,14,14),g=n.addComponent(Graphics),opacity=n.addComponent(UIOpacity);
      if(night){g.fillColor=color(i<6?'#ffe49c':'#c4e7ff',185);g.circle(0,0,i<6?2.2:1.2);g.fill();
        if(i>=6){g.strokeColor=color('#dcf3ff',140);g.lineWidth=1;g.moveTo(-3,0);g.lineTo(3,0);g.moveTo(0,-3);g.lineTo(0,3);g.stroke();}
        opacity.opacity=30;tween(opacity).delay(i*.17).to(1.6+i*.13,{opacity:165}).to(1.8,{opacity:20}).union().repeatForever().start();
        tween(n).by(3+i*.2,{position:new Vec3(9,12,0)},{easing:'sineInOut'}).by(3+i*.2,{position:new Vec3(-9,-12,0)},{easing:'sineInOut'}).union().repeatForever().start();
      }else{g.fillColor=color(this.homePeriod==='dusk'?'#efbf72':'#b4d786',145);g.moveTo(-5,0);g.quadraticCurveTo(0,7,6,1);g.quadraticCurveTo(0,-4,-5,0);g.fill();opacity.opacity=0;
        tween(opacity).delay(i*.3).to(1,{opacity:135}).delay(4).to(1,{opacity:0}).union().repeatForever().start();
        const origin=n.position.clone();tween(n).delay(i*.3).by(6,{position:new Vec3(42,-22,0),eulerAngles:new Vec3(0,0,95)},{easing:'sineInOut'}).call(()=>{n.setPosition(origin);n.setRotationFromEuler(0,0,0);}).union().repeatForever().start();
      }
    }
  }
  private menuIcon(parent:Node,kind:'map'|'dex'|'paw'|'gear'|'lock'|'home'|'energy'|'video',x:number,y:number,size:number,ink='#ffffff'){
    const n=this.makeNode(parent,kind,x,y,size,size),g=n.addComponent(Graphics);n.setScale(size/48,size/48,1);g.lineWidth=3;g.strokeColor=color(ink);g.fillColor=color(ink);
    if(kind==='map'){g.moveTo(-20,-16);g.lineTo(-20,17);g.lineTo(-7,12);g.lineTo(7,18);g.lineTo(20,13);g.lineTo(20,-19);g.lineTo(7,-14);g.lineTo(-7,-20);g.close();g.stroke();for(const dx of [-7,7]){g.moveTo(dx,-12);g.lineTo(dx,9);g.stroke();}g.fillColor=color('#ffe297');g.circle(8,4,6);g.fill();}
    if(kind==='dex'){g.roundRect(-19,-22,38,44,8);g.fill();g.fillColor=color('#f4fbff');g.roundRect(-14,-7,28,24,4);g.fill();g.fillColor=color('#df655b');g.circle(0,5,8);g.fill();g.strokeColor=color('#304d5a');g.moveTo(-8,5);g.lineTo(8,5);g.stroke();g.fillColor=color('#ffffff');g.circle(0,5,3);g.fill();g.fillColor=color('#304d5a');g.circle(-8,-15,2);g.circle(6,-15,2);g.fill();}
    if(kind==='paw'){g.moveTo(-16,-13);g.bezierCurveTo(-19,-5,-10,3,-5,5);g.bezierCurveTo(-2,8,2,8,5,5);g.bezierCurveTo(10,3,19,-5,16,-13);g.bezierCurveTo(12,-21,5,-15,0,-16);g.bezierCurveTo(-5,-15,-12,-21,-16,-13);g.close();g.fill();for(const [px,py,rx,ry] of [[-18,8,5,7],[-7,19,6,8],[7,19,6,8],[18,8,5,7]]){g.ellipse(px,py,rx,ry);g.fill();}}
    if(kind==='gear'){g.circle(0,0,13);g.stroke();g.circle(0,0,5);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(Math.cos(a)*14,Math.sin(a)*14);g.lineTo(Math.cos(a)*20,Math.sin(a)*20);g.stroke();}}
    if(kind==='lock'){g.roundRect(-12,-17,24,21,5);g.fill();g.arc(0,4,9,0,Math.PI,false);g.stroke();g.fillColor=color('#ffffff');g.circle(0,-5,2);g.fill();}
    if(kind==='home'){g.moveTo(-21,0);g.lineTo(0,19);g.lineTo(21,0);g.stroke();g.moveTo(-15,3);g.lineTo(-15,-19);g.lineTo(-5,-19);g.lineTo(-5,-5);g.lineTo(6,-5);g.lineTo(6,-19);g.lineTo(15,-19);g.lineTo(15,3);g.stroke();}
    if(kind==='energy'){g.moveTo(5,23);g.lineTo(-17,-4);g.lineTo(-3,-4);g.lineTo(-7,-23);g.lineTo(18,7);g.lineTo(3,7);g.close();g.fill();}
    if(kind==='video'){g.roundRect(-22,-16,44,32,7);g.stroke();g.moveTo(-5,-9);g.lineTo(-5,9);g.lineTo(10,0);g.close();g.fill();}
    return n;
  }
  private sectionHeader(title:string,subtitle:string,back:()=>void=()=>this.goHome()){const top=this.h/2;
    this.panel(this.root,0,top-44,390,88,'#e85d57',0);
    this.button(this.root,'nav-home','‹',-163,top-42,44,44,back,'#c94a49',true,30);
    this.text(this.root,title,0,top-32,23,'#ffffff',270,32).isBold=true;
    this.text(this.root,subtitle,0,top-61,12,'#ffe9d7',280,23);
  }
  private homeUI(){
    const s=this.state,H=this.h,b=-H/2,top=H/2,active=hasActivePet(s),map=mapFor(s);this.homePeriod=homePeriod();
    this.homeBackground=this.fillArt(this.art[homeArtKey(this.homePeriod)]?homeArtKey(this.homePeriod):'home-camp-v1');this.homeAtmosphere();void this.refreshHomeArt();
    this.homeStaminaUI(top);
    const setting=this.button(this.root,'home-settings','',161,top-39,44,44,()=>this.homeSettings(),'#fffdf1');this.menuIcon(setting,'gear',0,0,25,'#41717d');
    const petY=(top-98+b+360)/2,petSize=Math.max(112,Math.min(208,H-520));
    if(active){const shadow=this.makeNode(this.root,'camp-shadow',0,petY-petSize*.4,160,25),g=shadow.addComponent(Graphics);g.fillColor=color('#346951',55);g.ellipse(0,0,petSize*.38,12);g.fill();
      const lead=this.petImage(this.root,s.active,0,petY,petSize);this.breathe(lead);
    }else{const empty=this.panel(this.root,0,petY,280,72,'#fffdf0',20,235);this.text(empty,'营地等待新的伙伴\n请先孵化新伙伴',0,0,19,'#316b70',270,62);}
    this.panel(this.root,0,b+164,390,320,'#f8f5e8',28,246);
    const explore=this.button(this.root,'home-explore','',0,b+271,350,86,()=>{this.mapIndex=mapFor(this.state).id;this.screen='adventure';this.render();},'#df6156');
    this.menuIcon(explore,'map',-128,0,47);this.text(explore,'探险',0,16,28,'#ffffff',106,38).isBold=true;
    this.menuIcon(explore,'energy',-15,-20,20,'#ffde65');this.text(explore,'−5',12,-20,18,'#fff2d5',32,26);
    this.text(explore,'›',145,0,42,'#ffe4bd',40,60);
    const partners=this.button(this.root,'home-partners','',-90,b+164,170,104,()=>this.collection(0),'#427b9e');this.menuIcon(partners,'paw',-48,6,39,'#f3d58c');
    this.text(partners,'伙伴',25,10,24,'#ffffff',82,34).isBold=true;this.text(partners,'已拥有 '+s.pets!.length+' 只',0,-31,13,'#dceef5',158,24);
    const incubating=(s.incubators||[]).filter(Boolean),ready=incubating.filter(slot=>hatchRemaining(slot!)===0).length;
    const nursery=this.button(this.root,'home-hatch','',90,b+164,170,104,()=>this.hatchery(),'#519b81');
    this.eggArt(nursery,{id:'home',rarity:'normal',affinity:'bud',stage:5},-48,9,46);
    this.text(nursery,'孵化屋',25,10,22,'#ffffff',94,34).isBold=true;
    this.homeHatchStatus=this.text(nursery,ready?'有 '+ready+' 枚可以破壳':incubating.length+' / 2 孵化中',0,-31,13,'#e5f7de',158,24);
    if(ready||s.pendingHatch){const dot=this.panel(nursery,73,43,24,24,'#f3ba4f',12);this.text(dot,'!',0,0,16,'#694b20',24,24);}
    const breed=this.button(this.root,'home-breed','',-120,b+64,110,64,()=>this.breedingUI(),'#b57b9b');this.text(breed,'♀ ♂',0,11,22,'#fff2d9',104,30);this.text(breed,s.breeding?(gameNow()>=s.breeding.readyAt?'领取宠物蛋':'交配中'):'交配屋',0,-16,14,'#ffffff',104,25);
    const social=this.button(this.root,'home-social','',0,b+64,110,64,()=>this.socialUI(),'#769cba');this.text(social,'来信 ♡',0,11,20,'#fff2d9',104,30);this.text(social,'通信小屋',0,-16,14,'#ffffff',104,25);
    const dex=this.button(this.root,'home-dex','',120,b+64,110,64,()=>this.pokedexUI(),'#c78a4c');this.menuIcon(dex,'dex',-30,0,30,'#ffe1a0');this.text(dex,'图鉴',20,0,20,'#ffffff',64,30).isBold=true;
    this.text(this.root,'PM v0.12.0 · 自动保存',0,b+15,10,'#85917f',320,18);
    this.fx=this.makeNode(this.root,'home-effects',0,0,390,H);
  }
  private homeStaminaUI(top:number){
    this.panel(this.root,-73,top-39,220,48,'#fffdf1',19,246);
    const avatar=this.panel(this.root,-159,top-39,40,40,'#dceee7',12);this.image(avatar,'avatar-'+(this.state.journey?.hero||'ranger'),0,0,38,38);
    this.menuIcon(this.root,'energy',-125,top-33,18,'#e7af38');
    const track=this.panel(this.root,-69,top-33,88,22,'#dce8db',11);
    this.staminaFill=this.makeNode(track,'stamina-fill',0,0,88,22).addComponent(Graphics);
    this.staminaLabel=this.text(track,'',0,0,14,'#194f50',84,22);this.staminaLabel.isBold=true;
    this.staminaCountdown=this.text(this.root,'',-69,top-54,11,'#507b68',88,18);this.staminaCountdown.node.name='stamina-countdown';
    const ad=this.button(this.root,'stamina-ad','',9,top-39,40,44,()=>this.watchStaminaAd(),'#e6f3dc');this.menuIcon(ad,'video',0,6,24,'#507b55');this.text(ad,'+10',0,-12,11,'#507b55',38,17).isBold=true;
    this.refreshStaminaHUD();
  }
  private refreshStaminaHUD(){
    const next=syncStamina(this.state);if(next!==this.state){this.state=next;this.save();}
    if(this.staminaLabel?.isValid)this.staminaLabel.string=this.state.stamina!.value+' / '+STAMINA_MAX;
    if(this.staminaCountdown?.isValid){const left=staminaFullRemaining(this.state),seconds=Math.ceil(left/1000);this.staminaCountdown.string=Number.isFinite(left)?Math.floor(seconds/60).toString().padStart(2,'0')+':'+(seconds%60).toString().padStart(2,'0'):'--:--';}
    if(this.staminaFill?.isValid){const g=this.staminaFill;g.clear();g.fillColor=color('#69cba0');const w=88*this.state.stamina!.value/STAMINA_MAX;if(w>0){g.roundRect(-44,-11,w,22,Math.min(11,w/2));g.fill();}}
  }
  private staminaOffer(message='每2分钟恢复1点体力'){
    const c=this.overlay('体力',240);this.menuIcon(c,'energy',-42,44,31,'#dfad35');this.text(c,this.state.stamina!.value+' / 30',25,44,24,C.ink,130,38);
    this.text(c,message,0,-1,14,C.muted,324,40);
    this.button(c,'stamina-close','返回',-82,-66,145,48,()=>this.render(),'#e8f3fa');
    const ad=this.button(c,'stamina-watch','+10',82,-66,145,48,()=>this.watchStaminaAd(),'#519b81',this.state.stamina!.value<STAMINA_MAX,21);this.menuIcon(ad,'video',-44,0,25);
  }
  private async watchStaminaAd(){
    if(this.adPending||!this.requireTime())return;
    this.settlePendingAd();this.refreshStaminaHUD();if(this.state.stamina!.value>=STAMINA_MAX){this.staminaOffer('体力已满');return;}
    // Host integration point: only a completed rewarded-video result grants energy.
    const bridge=(globalThis as any).pmRewardedAd as {show:(request:{placement:string})=>Promise<{completed:boolean}>}|undefined;
    if(!bridge||typeof bridge.show!=='function'){this.staminaOffer('激励广告待接入，暂不能领取');return;}
    this.adPending=true;this.busy=true;this.audio.pause('ad');
    try{const result=await bridge.show({placement:'stamina_10'});
      if(result?.completed===true){this.state.pendingStaminaAd=true;this.save();if(this.trustedClock.now()===null)await this.synchronizeTime();this.settlePendingAd();}
      this.save();this.render();if(this.state.pendingStaminaAd)this.timeNotice('体力奖励已保留，联网后到账');else if(result?.completed!==true)this.staminaOffer('观看完成后可获得体力');}
    catch{this.staminaOffer('广告暂不可用，请稍后再试');}
    finally{this.adPending=false;this.busy=false;this.audio.resume('ad');}
  }
  private homeSettings(){const c=this.overlay('营地设置',220);
    this.button(c,'settings-close','×',143,75,38,38,()=>this.goHome(),'#e4eef1',true,27);
    this.button(c,'audio-music','音乐  '+(this.audio.musicEnabled?'开':'关'),0,13,300,48,()=>{this.audio.toggle('music');this.homeSettings();},this.audio.musicEnabled?'#519b81':'#8b9dab');
    this.button(c,'audio-effects','音效  '+(this.audio.effectsEnabled?'开':'关'),0,-50,300,48,()=>{this.audio.toggle('effects');this.homeSettings();},this.audio.effectsEnabled?'#519b81':'#8b9dab');
  }
  private adventureUI(){
    const s=this.state,H=this.h,b=-H/2,top=H/2;
    this.panel(this.root,0,0,390,H,'#edf3e8',0);this.sectionHeader('探险地图','发现伙伴 · 寻找宠物蛋');
    const m=MAPS[this.mapIndex]||MAPS[0],current=m.id===mapFor(s).id,unlocked=mapUnlocked(s,m.id),active=hasActivePet(s),cleared=!!s.clearedMaps?.includes(m.id);
    MAPS.forEach((map,i)=>{this.button(this.root,'map-'+i,'0'+(i+1),(i-(MAPS.length-1)/2)*59,top-119,54,42,()=>{this.mapIndex=i;this.render();},i===this.mapIndex?map.tint:'#dbe5dc',true,18);});
    const center=(top-156+b+160)/2,height=top-156-(b+160),card=this.panel(this.root,0,center,354,height,'#fffdf5',22);
    this.panel(card,0,height/2-52,354,104,m.tint,22);this.menuIcon(card,'map',-123,height/2-51,44);
    this.text(card,m.name,28,height/2-36,27,'#ffffff',245,40).isBold=true;this.text(card,m.stages+' 关 · '+(cleared?'已通关':unlocked?current?'当前探险':'已开放':'通关上一地图解锁'),28,height/2-71,15,'#f5efcf',245,25);
    this.text(card,m.types,0,height/2-125,14,m.tint,330,25);
    const rowGap=Math.min(92,(height-195)/2),first=height/2-173;
    m.pets.forEach((id,i)=>{const x=(i%3-1)*104,y=first-Math.floor(i/3)*rowGap;this.petImage(card,id,x,y,Math.min(72,rowGap*.8));this.text(card,PETS[id].name,x,y-38,11,C.muted,102,20);});
    if(height>450){const routeY=-height/2+107;
      this.text(card,'越深入，伙伴形态与蛋品质越高',0,routeY+42,13,m.tint,310,25);
      const path=this.makeNode(card,'route',0,routeY,290,50),g=path.addComponent(Graphics);g.strokeColor=color('#d6e2d3');g.lineWidth=4;g.moveTo(-136,0);g.lineTo(136,0);g.stroke();
      [1,Math.round(m.stages*.25),Math.round(m.stages*.5),Math.round(m.stages*.75),m.stages].forEach((step,i)=>{const x=(i-2)*68,done=cleared||current&&step<s.step,p=this.panel(path,x,0,30,30,done?m.tint:i===4?'#f2ce77':'#e6eddf',15);this.text(p,i===4?'★':''+step,0,0,14,done?'#ffffff':'#6c866f',28,27);});
    }
    this.text(card,m.note,0,-height/2+28,12,C.muted,330,24);
    const eggs=this.panel(this.root,0,b+115,354,70,'#dfeee0',16);this.eggArt(eggs,{id:'region',rarity:'SR',affinity:m.pets[0],stage:5},-137,0,44);
    this.text(eggs,'精英 / BOSS 巢穴寻蛋',24,15,16,'#41785c',270,27);this.text(eggs,m.eggs,24,-15,12,'#64846e',270,24);
    const resume=current&&s.expedition&&!['lost','won'].includes(s.phase);
    const label=!active?'请先孵化新伙伴':!unlocked?'通关 '+MAPS[m.id-1].name+' 解锁':resume?'继续探险':s.stamina!.value<EXPEDITION_COST?'体力不足':'出发！';
    const go=this.button(this.root,'adventure-go',label,-28,b+39,298,60,()=>this.enterMap(m.id),'#df6156',active&&unlocked,active&&unlocked?23:18);
    const cost=this.panel(this.root,151,b+39,52,60,'#fff3d5',14);this.menuIcon(cost,'energy',0,12,24,'#d9a539');this.text(cost,resume?'0':'−5',0,-15,17,'#886424',48,24);
    this.fx=this.makeNode(this.root,'map-effects',0,0,390,H);
  }
  private enterMap(mapId:number){
    this.refreshStaminaHUD();const s=this.state;if(!hasActivePet(s)||!mapUnlocked(s,mapId))return;
    const ended=['lost','won'].includes(s.phase);
    if(s.expedition&&mapId===mapFor(s).id&&!ended){this.screen='game';this.render();return;}
    if(!this.requireTime())return;
    if(s.stamina!.value<EXPEDITION_COST){this.staminaOffer();return;}
    const begin=async()=>{if(this.busy||!this.requireTime())return;this.busy=true;
      try{await this.loadRegionArt(mapId);if(!this.requireTime())return;const base=retreatExpedition(this.state),next=enterExpedition(base,mapId);if(!next.expedition)return;this.state=next;this.screen='game';this.save();this.render();}
      catch{const c=this.overlay('地图加载失败',218);this.text(c,'请重试进入地图',0,20,16,C.muted,300,40);this.button(c,'map-load-close','返回',0,-55,300,44,()=>this.render(),C.blue);}
      finally{this.busy=false;}};
    if(s.expedition&&!ended){const c=this.overlay('重新出发？',250);this.text(c,'结束当前地图进度，新探险消耗5体力',0,35,14,C.muted,320);
      this.button(c,'map-cancel','返回',-82,-49,145,52,()=>this.render(),'#e8f3fa');this.button(c,'map-confirm','出发',82,-49,145,52,begin,C.orange);
    }else begin();
  }
  private dexOwned(id:PetId,rarity?:EggRarity){return this.state.pets!.some(p=>p.id===id&&(!rarity||(p.rarity||'normal')===rarity));}
  private pokedexUI(){
    const owned=new Set(this.state.pets!.map(p=>formKey(p))).size;
    const c=this.fullPage('图鉴','已拥有 '+owned+' / '+PET_IDS.length*3+' 形态',()=>this.pokedexUI()),{top,bottom,height}=this.pageBounds(c);
    const chooseMap=(id:number)=>{this.dexMap=id;this.dexPage=0;this.pokedexUI();};
    this.button(c,'dex-map-all','全部',-156,top-27,42,36,()=>chooseMap(-1),this.dexMap===-1?'#df6156':'#dbe9ef',true,13);
    MAPS.forEach((m,i)=>this.button(c,'dex-map-'+i,'0'+(i+1),-104+i*52,top-27,42,36,()=>chooseMap(i),this.dexMap===i?m.tint:'#dbe9ef',true,15));
    this.button(c,'dex-type',(this.dexType||'全部属性')+' ▾',-91,top-72,172,34,()=>this.dexTypePicker(),C.paper,true,14);
    this.button(c,'dex-owned',this.dexOwnedOnly?'✓ 已拥有':'全部系列',91,top-72,172,34,()=>{this.dexOwnedOnly=!this.dexOwnedOnly;this.dexPage=0;this.pokedexUI();},this.dexOwnedOnly?'#519b81':C.paper,true,14);
    const ids=PET_IDS.filter(id=>(this.dexMap<0||MAPS[this.dexMap].pets.includes(id))&&(!this.dexType||PETS[id].type===this.dexType)&&(!this.dexOwnedOnly||this.dexOwned(id)));
    const pages=Math.max(1,Math.ceil(ids.length/9));this.dexPage=Math.min(this.dexPage,pages-1);
    const rowH=Math.min(198,(height-178)/3),start=top-105-rowH/2;
    ids.forEach((id,itemIndex)=>{const i=itemIndex%9;
      const p=this.button(c,'dex-pet-'+id,'',(i%3-1)*120,start-Math.floor(i/3)*(rowH+8),112,rowH,()=>this.dexDetail(id,'normal'),'#ffffff');
      this.listItem(p,itemIndex,9);const index=PET_IDS.indexOf(id)*3+1;
      this.text(p,'No.'+String(index).padStart(3,'0'),-18,rowH/2-14,11,C.muted,72,20);
      const count=RARITIES.filter(r=>this.dexOwned(id,r)).length;this.text(p,count+'/3',36,rowH/2-14,11,count?'#3e9673':'#9aaab0',32,20);
      const size=Math.min(112,rowH-70),art=this.petImage(p,petEntry(this.state,id+':normal'),0,8,size);if(!count)art.getComponent(Sprite)!.grayscale=true;
      this.text(p,PETS[id].name,0,-rowH/2+39,13,C.ink,106,23).isBold=true;
      const type=this.panel(p,0,-rowH/2+16,66,21,'#e5f0eb',10);this.text(type,PETS[id].type,0,0,11,'#4b8273',62,20);
    });
    if(!ids.length)this.text(c,'暂无符合条件的伙伴',0,0,18,C.muted,330,44);
    this.pagePager(c,bottom+25,this.dexPage,pages,page=>{this.dexPage=page;this.pokedexUI();},'dex');
  }
  private dexTypePicker(){
    const types=['',...Array.from(new Set(PET_IDS.map(id=>PETS[id].type)))],c=this.overlay('属性',444);
    types.forEach((type,i)=>this.button(c,'dex-type-'+i,type||'全部',(i%4-1.5)*79,133-Math.floor(i/4)*53,72,43,()=>{this.dexType=type;this.dexPage=0;this.pokedexUI();},this.dexType===type?'#c78a4c':'#dbe9ef',true,14));
    this.button(c,'dex-type-close','返回',0,-174,310,40,()=>this.pokedexUI(),'#427b9e',true,16);
  }
  private dexDetail(id:PetId,rarity:EggRarity){
    const p=petEntry(this.state,id+':'+rarity),index=PET_IDS.indexOf(id)*3+RARITIES.indexOf(rarity)+1,map=MAPS.find(m=>m.pets.includes(id))!;
    const tint=rarity==='SSR'?'#b78022':rarity==='SR'?'#8b61bb':'#46976e';
    const c=this.fullPage('No.'+String(index).padStart(3,'0')+'  '+petName(p),PETS[id].type+' · '+(this.dexOwned(id,rarity)?'已拥有':'未拥有'),()=>this.dexDetail(id,rarity),()=>this.pokedexUI()),{top,bottom,height}=this.pageBounds(c);
    RARITIES.forEach((r,i)=>this.button(c,'dex-form-'+r,rarityName(r),(i-1)*120,top-31,112,42,()=>this.dexDetail(id,r),r===rarity?tint:'#dbe9ef',true,17));
    const heroH=Math.min(310,height-365),hero=this.panel(c,0,top-65-heroH/2,354,heroH,'#ffffff',22);
    const disc=this.makeNode(hero,'dex-disc',0,-heroH*.32,180,28),g=disc.addComponent(Graphics);g.fillColor=color('#dae9e7');g.ellipse(0,0,88,12);g.fill();
    this.petImage(hero,p,0,5,heroH-32);
    const rowY=top-65-heroH-31;
    const stat=this.panel(c,0,rowY,354,46,'#fffdf5',13);
    this.text(stat,'HP '+petBaseHP(p),-113,0,18,'#45856c',112,32).isBold=true;
    this.actionIcon(stat,'attack',-36,0,24,'#c86458');
    p.faces.forEach((value,i)=>{const face=this.panel(stat,13+i*55,0,45,32,'#f8e2d9',9);this.text(face,''+value,0,0,17,'#a04c42',41,28).isBold=true;});
    const skill=skillFor(p),card=this.panel(c,0,rowY-70,354,80,'#ffffff',14);
    this.text(card,skill.name,0,23,16,tint,330,27).isBold=true;
    this.text(card,petSkills(p).map(code=>SKILLS[code][1]).join(' · '),0,-12,13,C.muted,326,43);
    const location=this.panel(c,0,rowY-143,354,50,'#e0eee7',14);this.menuIcon(location,'map',-145,0,26,map.tint);
    this.text(location,map.name+' · 孵蛋获得',17,0,15,'#427d68',290,32);
    this.button(c,'dex-types','属性关系',0,bottom+78,140,30,()=>this.typeRelationsUI(id,rarity),'#e8f3fa',true,13);
    this.button(c,'dex-detail-back','返回图鉴',0,bottom+32,354,44,()=>this.pokedexUI(),'#427b9e',true,17);
  }
  private typeRelationsUI(id:PetId,rarity:EggRarity){
    const type=PETS[id].type,c=this.fullPage('属性关系',type+' · '+petName({id,rarity}),()=>this.typeRelationsUI(id,rarity),()=>this.dexDetail(id,rarity)),{top,bottom,height}=this.pageBounds(c);
    const groups=[{name:'攻击克制  ×1.5',types:TYPE_NAMES.filter(t=>typeMultiplier(type,t)>1),incoming:false},{name:'攻击受阻  ×0.75 / ×0.5',types:TYPE_NAMES.filter(t=>typeMultiplier(type,t)<1),incoming:false},{name:'受击弱点  ×1.5',types:TYPE_NAMES.filter(t=>typeMultiplier(t,type)>1),incoming:true},{name:'受击抵抗  ×0.75 / ×0.5',types:TYPE_NAMES.filter(t=>typeMultiplier(t,type)<1),incoming:true}];
    const rowH=Math.min(132,(height-50)/4);
    groups.forEach((group,i)=>{const card=this.panel(c,0,top-12-rowH/2-i*rowH,354,rowH-8,'#ffffff',14);this.text(card,group.name,0,rowH/2-23,15,C.ink,330,24).isBold=true;
      group.types.forEach((t,j)=>{const x=(j%7-3)*47,y=rowH/2-54-Math.floor(j/7)*37;this.typeIcon(card,t,x,y,22);this.text(card,t,x,y-19,10,C.muted,46,17);const m=group.incoming?typeMultiplier(t,type):typeMultiplier(type,t);if(m===.5)this.text(card,'½',x+15,y+5,10,'#35638f',16,16);});
      if(!group.types.length)this.text(card,'—',0,-5,18,C.muted,250,28);
    });
    this.text(c,'未列出的关系为 ×1 · ½ 表示强抵抗 ×0.5',0,bottom+30,11,C.muted,354,22);
  }
  private partnersUI(){
    const s=this.state,H=this.h,top=H/2,b=-H/2;
    const selected=this.partnerSelected&&(!this.partnerOwnedOnly||s.pets!.some(p=>p.uid===this.partnerSelected))?this.partnerSelected:hasActivePet(s)?s.active.uid!:this.partnerOwnedOnly?null:PET_IDS[0]+':normal',selectedPet=selected?petEntry(s,selected):null;
    this.panel(this.root,0,0,390,H,'#edf4f5',0);this.sectionHeader('伙伴','拖动伙伴 · 调整队伍');
    const slots=homeParty(s),teamY=top-150;
    slots.forEach((key,i)=>{const x=(i-1)*120,p=this.button(this.root,'team-slot-'+i,'',x,teamY,112,110,()=>{if(key){this.partnerSelected=key;this.render();}},i===0?'#fff0d5':'#deedf2'),entry=key?petEntry(s,key):null;
      if(entry)this.petImage(p,entry,0,4,64);else this.menuIcon(p,'lock',0,6,31,'#9aacb0');
      this.text(p,i===0?'出战':'候补 '+i,0,40,12,i===0?'#b17a2d':'#63899a',100,22).isBold=true;this.text(p,entry?petName(entry)+sexSymbol(entry.sex):'空位',0,-38,12,C.ink,104,24);
      this.partyDropNodes.push(p);if(key)this.bindPartyDrag(p,key);
    });
    const filterY=top-232;this.text(this.root,'伙伴 '+s.pets!.length+' 只',-101,filterY,16,C.ink,170,28).isBold=true;
    this.button(this.root,'partner-filter','图鉴 ›',119,filterY,114,32,()=>this.pokedexUI(),'#dbe9ef',true,13);
    const keys=this.partnerOwnedOnly?s.pets!.map(p=>p.uid!):([] as string[]).concat(...PET_IDS.map(id=>RARITIES.map(r=>id+':'+r))),pages=Math.max(1,Math.ceil(keys.length/6));this.partnerPage=Math.min(this.partnerPage,pages-1);
    const gridHeight=Math.min(148,Math.max(90,(H-510)/2)),gridTop=top-258-gridHeight/2,spacing=gridHeight+12;
    keys.forEach((key,itemIndex)=>{const i=itemIndex%6;const entry=petEntry(s,key),x=(i%3-1)*120,y=gridTop-Math.floor(i/3)*spacing,owned=s.pets!.some(p=>p.uid===key),discovered=s.pets!.some(p=>formKey(p)===formKey(entry)),chosen=key===selected;
      const p=this.button(this.root,'pet-'+key,'',x,y,112,gridHeight,()=>{this.partnerSelected=key;this.render();},chosen?'#fff1d6':'#ffffff'),petSize=Math.min(96,gridHeight-34);
      this.listItem(p,itemIndex,6);const art=this.petImage(p,entry,0,4,petSize);if(!discovered)art.getComponent(Sprite)!.grayscale=true;
      this.text(p,petName(entry)+sexSymbol(entry.sex),0,-gridHeight/2+14,12,C.ink,108,22);this.text(p,rarityName(entry.rarity),31,gridHeight/2-13,10,entry.rarity==='SSR'?'#b78022':entry.rarity==='SR'?'#8b61bb':'#46976e',48,18);
      if(chosen){const g=p.getComponent(Graphics)!;g.lineWidth=2;g.strokeColor=color('#dda841');g.roundRect(-55,-gridHeight/2+1,110,gridHeight-2,13);g.stroke();}
      if(owned)this.bindPartyDrag(p,key);
    });
    if(!keys.length)this.text(this.root,'还没有伙伴\n请先孵化新伙伴',0,gridTop-32,20,C.muted,320,88);
    this.pagePager(this.root,b+212,this.partnerPage,pages,page=>{this.partnerPage=page;this.render();},'collection');
    const owned=s.pets!.some(p=>p.uid===selected),detail=this.panel(this.root,0,b+102,390,186,'#fffdf5',22);
    if(!selectedPet){
      this.text(detail,'伙伴破壳后会出现在这里',0,43,18,C.ink,340,32);
      this.text(detail,'先孵化新伙伴，再出发探险',0,4,14,C.muted,340,27);
      this.button(detail,'partner-hatch','前往孵化屋',0,-48,310,44,()=>this.hatchery(),'#519b81',true,18);
      this.fx=this.makeNode(this.root,'party-effects',0,0,390,H);return;
    }
    this.text(detail,petName(selectedPet)+' '+sexSymbol(selectedPet.sex),-82,67,19,C.ink,190,29).isBold=true;
    this.text(detail,PETS[selectedPet.id].type+' · '+rarityName(selectedPet.rarity),105,67,13,'#889762',144,26);
    const faces=(s.active.uid===selected?s.active:s.reserve?.uid===selected?s.reserve:s.runRoster?.[selected])?.faces||selectedPet.faces;
    this.text(detail,'HP '+petBaseHP(selectedPet)+'   /   ⚔ '+faces.join(' · '),-40,34,14,C.muted,270,25);
    this.button(detail,'partner-skill','技能 ›',135,34,72,28,()=>this.qualityDetail(selected,selectedPet.rarity||'normal',this.partnerPage),'#e4eef1',true,12);
    this.text(detail,skillFor(selectedPet).name,0,3,13,C.muted,356,25);
    const hint=this.panel(detail,0,-43,350,48,s.phase==='battle'?'#e5e9e9':'#e1f1e9',14);
    this.partyDragHint=this.text(hint,s.phase==='battle'?'战斗中 · 队伍已锁定':owned?'拖动宠物 → 上方出战 / 候补位':'通过孵蛋获得此形态',0,0,14,s.phase==='battle'?C.muted:'#45856c',336,38);
    this.fx=this.makeNode(this.root,'party-effects',0,0,390,H);
  }
  private cancelPartyDrag(){
    const d=this.partyDrag;if(!d)return;this.partyDrag=null;this.pressPending=false;
    if(d.source.isValid){const opacity=d.source.getComponent(UIOpacity);if(opacity)opacity.opacity=255;d.source.setScale(1,1,1);}
    d.ghost?.destroy();for(const guide of d.guides)guide.destroy();
  }
  private dragPoint(e:EventTouch){const p=e.getUILocation();return this.root.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(p.x,p.y,0));}
  private bindPartyDrag(n:Node,id:string){
    for(const type of [Node.EventType.TOUCH_START,Node.EventType.TOUCH_MOVE,Node.EventType.TOUCH_END,Node.EventType.TOUCH_CANCEL])n.off(type);
    n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{e.propagationStopped=true;if(this.busy||this.pressPending||this.partyDrag)return;
      const p=this.dragPoint(e);this.pressPending=true;
      this.partyDrag={id,touch:e.touch!.getID(),source:n,start:p,origin:this.root.getComponent(UITransform)!.convertToNodeSpaceAR(n.worldPosition),moved:false,ghost:null,guides:[],target:-1};
    });
    n.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{e.propagationStopped=true;const d=this.partyDrag;if(!d||d.touch!==e.touch!.getID())return;const p=this.dragPoint(e);
      if(!d.moved&&Vec3.distance(p,d.start)<10)return;
      if(!this.state.pets!.some(p=>p.uid===id)||!canManageParty(this.state)){d.moved=true;return;}
      if(!d.ghost){d.moved=true;const opacity=n.getComponent(UIOpacity)||n.addComponent(UIOpacity);opacity.opacity=120;
        d.ghost=this.panel(this.fx,p.x,p.y+48,90,92,'#fff5dc',18,244);this.petImage(d.ghost,id,0,3,78);
        this.text(d.ghost,petName(petEntry(this.state,id)),0,-37,11,C.ink,86,18);
        d.guides=this.partyDropNodes.map((slot,i)=>{const pos=this.root.getComponent(UITransform)!.convertToNodeSpaceAR(slot.worldPosition),guide=this.makeNode(this.fx,'drop-guide-'+i,pos.x,pos.y,118,116);guide.addComponent(Graphics);return guide;});
      }
      d.ghost.setPosition(p.x,p.y+48);d.target=this.partyDropNodes.findIndex(slot=>{const v=this.root.getComponent(UITransform)!.convertToNodeSpaceAR(slot.worldPosition);return Math.abs(p.x-v.x)<=58&&Math.abs(p.y-v.y)<=57;});
      d.guides.forEach((guide,i)=>{const g=guide.getComponent(Graphics)!;g.clear();g.fillColor=color(i===d.target?'#5dcc91':'#83b9dd',i===d.target?55:20);g.strokeColor=color(i===d.target?'#299b69':'#7db0cd');g.lineWidth=i===d.target?4:2;g.roundRect(-57,-56,114,112,15);g.fill();g.stroke();});
      if(this.partyDragHint)this.partyDragHint.string=d.target<0?'拖到上方高亮位置 · 松手放置':d.target===0?'松手设为出战':'松手放入候补 '+d.target;
    });
    const finish=(e:EventTouch)=>{e.propagationStopped=true;const d=this.partyDrag;if(!d||d.touch!==e.touch!.getID())return;
      // Creator 3.8 reports a release outside the source card as TOUCH_CANCEL;
      // getEventCode preserves the original physical end/cancel distinction.
      const canceled=e.getEventCode()!==Node.EventType.TOUCH_END;
      if(canceled){this.cancelPartyDrag();if(!this.pageSwipeActive)this.render();return;}
      if(!d.moved){this.cancelPartyDrag();this.partnerSelected=id;this.lastTap=performance.now();this.render();return;}
      const index=d.target,next=index>=0?assignPartySlot(this.state,id,index):this.state;
      if(next!==this.state){this.cancelPartyDrag();this.state=next;this.partnerSelected=id;this.save();this.render();
        const slot=this.partyDropNodes[index];slot.setScale(.92,.92,1);tween(slot).to(.2,{scale:Vec3.ONE},{easing:'backOut'}).start();
        this.popup(index===0?'已设为出战':'已放入候补 '+index,new Vec3(0,this.h/2-255,0),'#2a9266');
      }else if(d.ghost){const ghost=d.ghost;this.partyDrag=null;for(const guide of d.guides)guide.destroy();
        tween(ghost).to(.16,{position:d.origin,scale:new Vec3(.8,.8,1)},{easing:'quadOut'}).call(()=>{this.pressPending=false;this.render();}).start();
      }else{this.cancelPartyDrag();this.render();}
    };
    n.on(Node.EventType.TOUCH_END,finish);n.on(Node.EventType.TOUCH_CANCEL,finish);
  }
}
