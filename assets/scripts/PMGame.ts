import { PC_CAMPAIGN_TRANSLATIONS } from './PCCampaignTranslations';
import { DEX_REWARDS, DEX_TOTAL, DEX_SPECIES, dexKey, recordDex, validDexState, claimDexReward } from './PCDex';
import { INGREDIENTS, RECIPES, FOOD_QUALITY_NAMES, FoodQuality, CookingResult, newCooking, cookingKey, cookingReason, recipeCost, cookMeal, eatMeal, mealSummary, bonusDescription, settleCookingBattle } from './PCCooking';
import { hasHatchAction, hasOpenPartySlot, battleLearningHint, suggestedTypePartner, hatchPartySlot, welcomeHatchToParty } from './PMPlayerGuidance';
import { drawButtonSurface, drawPanelSurface, uiMotion } from './PMUIStyle';
import { BATTLE_EVENTS } from './PMModel';
import { MYTHIC_PET_IDS } from './PMModel';
import { fitBattlePair } from './PMBattleLayout';
import { _decorator, Component, Node, Canvas, Camera, UITransform, Graphics, Color, Label, LabelOutline, Sprite,
  SpriteFrame, Texture2D, Rect, Size, PageView, ScrollView, Layout, Mask, resources, Layers, view, ResolutionPolicy, EventTouch, tween, Tween, Vec3, UIOpacity, sys, game, Game, director, Director, profiler } from 'cc';
import { BATTLE_RECTS, PET_FEET } from './BattleArt';
import { EVOLUTION_ART } from './EvolutionArt';
import { REGION_ART } from './RegionArt';
import { REGION_PAD_RECTS } from './RegionPads';
import { HomePeriod, homePeriod, homeArtKey } from './HomeScenery';
import { loadShinyVisuals, tintShiny, shinyEntrance } from './ShinyVisuals';
import { battleAmbience } from './BattleAmbience';
import { drawGyms } from './PMGymsUI';
import { FRIEND_PET_IDS, gymBonus } from './PMModel';

import { TYPE_NAMES, typeMultiplier, matchupMultiplier, typedDamage, enemyAttackAmount, petCombat, isBreedingPet, removePartySlot } from './PMModel';
import { giantMultiplier, runAttackMultiplier, runHealthMultiplier, SECRET_RECIPES, petAttackFaces } from './PMModel';
import { HERO_RECTS } from './HeroArt';
import { TrustedClock } from './TrustedClock';
import { PMAudio } from './PMAudio';
import { PMArt } from './PMArt';
import { PMAppBattle } from './PMAppBattle';
import { APP_BATTLE_IDS, APP_BATTLE_POSES, APP_BATTLE_ATLASES, appPoseKey, appPoseFeet } from './AppBattleArt';
import { DurableCheckpoint } from './DurableCheckpoint';
import { tr, currentLocale, selectLanguage, languageChoice, LANGUAGES, LANGUAGE_KEY } from './PMLocale';
import { setTimeProvider, gameNow, BUILD_TEST_MODE } from './PMModel';
import { enterExpedition, retreatExpedition } from './PMModel';
import { HeroId, HEROES, HERO_IDS, STARTERS, newJourney, prepareJourney, chooseHero, chooseStarter, heroFor, heroHealBonus, hatchDuration } from './PMModel';
import { Pet, Sex, pet, petEntry, petName, petBaseHP, formKey, sexSymbol, petSkills, SKILLS, startBreeding, claimBreeding, BREED_DURATION } from './PMModel';
import { partyChoices, rankForStage, homeParty, assignPartySlot, MAPS, mapFor, mapStageCount, mapUnlocked, latestUnlockedMap, startMap, enemyPet, eggRates, hasActivePet } from './PMModel';
import { RARITIES, EggRarity, rarityName, qualityHP, preferredRarity, unlockedRarities, setPetRarity, skillFor, skillStatus, availableEggs, hatchRemaining, startIncubation, grantHatchAd, grantBreedingAd, claimHatch, acknowledgeHatch } from './PMModel';
import { State, PetId, Action, Egg, PETS, PET_IDS, NEW_PET_IDS, fresh, act, hp, maxHP, enemyName, enemyAttackFaces, restore, equipReserve, selectActive, healAmount, attackAmount, guardDamage, rewardOptions, canManageParty, restartRun } from './PMModel';
const { ccclass } = _decorator;
const KEY='pm.creature-dice.v1';
const C={ink:'#183852',muted:'#566e80',paper:'#f7fcff',blue:'#237fa6',orange:'#efa63b',green:'#38b98c',line:'#d7e8f2'};
const campaignText=(value:string)=>currentLocale()==='zh-CN'?value:PC_CAMPAIGN_TRANSLATIONS[value]?.[currentLocale()]||tr(value);
const color=(v:string,alpha=255)=>{const c=new Color();Color.fromHEX(c,v);c.a=alpha;return c;};
@ccclass('PMGame')
export class PMGame extends Component {
  private audio!:PMAudio;
  private state!:State;private root!:Node;private cam!:Camera;private stage!:Node;
  private nativeApp=sys.isNative;
  private uiRoute='';private uiEnterUntil=0;private uiSerial=0;
  private appPresentation=PMAppBattle.enabled();
  private appBattle:PMAppBattle|null=null;
  private sampleOriginal:State|null=null;
  private sampleEnemy=0;
  private shinyEntranceKey='';
  private appActors=new Map<Node,{id:string;side:'back'|'front';size:number;ground:Vec3;pose:string}>();
  private pageFactories=new WeakMap<Node,(page:number)=>Node[]>();
  private artCache=new PMArt();private art=this.artCache.frames;private h=844;private lastSize='';private busy=false;
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
  private mapTabPage=0;private dexTabPage=0;
  private dexPage=0;private dexMap=-1;private dexType='';private dexOwnedOnly=false;private dexShinyOnly=false;
  private pageSwipeActive=false;
  private homeHatchBadge:Node|null=null;private homeBreedBadge:Node|null=null;
  private homeMotion:{since:number;next:number;pulse:UIOpacity;icons:{node:Node;x:number;y:number;z:number}[];index:number;badges:Node[]}|null=null;
  private trustedClock=new TrustedClock();private clockRetryAt=0;private clockSaveAt=0;private clockForeground=true;private clockUiRefresh=false;
  private partyDropNodes:Node[]=[];private partyDragHint:Label|null=null;
  private partyDrag:{id:string;touch:number;source:Node;start:Vec3;origin:Vec3;moved:boolean;axis?:'horizontal'|'vertical';ghost:Node|null;guides:Node[];target:number}|null=null;
  private breedMother='';private breedFather='';private breedClock:Label|null=null;
  async start(){
    let savedLanguage:string|null=null;try{savedLanguage=sys.localStorage.getItem(LANGUAGE_KEY);}catch{}
    selectLanguage(savedLanguage,sys.languageCode||sys.language||'en');
    this.audio=new PMAudio(this.node,()=>{
      if(this.modal?.children.some(card=>!!card.getChildByName('audio-music')))this.homeSettings();
    },!!(globalThis as any).tap);
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
    delete this.state.arena;
    if(!validDexState(this.state.dexCollection))delete this.state.dexCollection;
    this.state.dexCollection=recordDex(this.state.dexCollection,this.state);
    this.trustedClock.restore(this.state.trustedTime?.lastMs||0);
    setTimeProvider(()=>this.trustedClock.now()??NaN);
    // The cover needs local art, while timed benefits remain gated by requireTime().
    void this.synchronizeTime();
    try{
      await Promise.all([loadShinyVisuals(),...['login-cover-v2',this.loginLogoKey(),'login-button-v4'].map(key=>this.artCache.load(key))]);
      this.ready=true;this.render();this.save();
      director.once(Director.EVENT_AFTER_DRAW,()=>{
        if(this.nativeApp&&this.node.isValid)void this.warmAfterCover().catch(error=>console.warn('PM warmup',error));
      });
      game.on(Game.EVENT_HIDE,this.onHide,this);
      game.on(Game.EVENT_SHOW,this.onShow,this);
      (globalThis as any).__pm={snapshot:()=>JSON.parse(JSON.stringify(this.state)),controls:()=>({...this.controls}),animating:()=>this.busy||this.pressPending||this.uiEntering()||this.artCache.pending>0,artStats:()=>this.artCache.stats(),screen:()=>this.screen,timeReady:()=>this.trustedClock.now()!==null,version:'0.12.0',ready:true};
    }catch(e){this.loading!.string=tr('资源加载失败，请刷新重试');console.error('PM asset loading',e);}
  }
  private async warmAfterCover(){
    if(this.state.expedition){
      // Keep the resumed screen's assets ahead of unrelated character and menu art.
      const mapId=this.state.mapId||0;
      await this.artCache.warm([this.battleRegionKey(mapId),this.regionKey('nest')]);
      return;
    }
    const stage=this.state.journey?.stage;
    if(stage==='hero'||stage==='starter'){
      await this.artCache.warm([...HERO_IDS.map(id=>'hero-'+id),...STARTERS]);
      return;
    }
    const party=homeParty(this.state);
    await this.artCache.warm([homeArtKey(homePeriod()),...(this.state.pets||[])
      .filter(p=>party.includes(p.uid!))
      .map(p=>(p.rarity==='normal'?p.id:formKey(p))+'-front')]);
  }
  onDestroy(){this.homeMotion=null;this.appBattle?.dispose();this.artCache.dispose();this.audio?.dispose();this.durableCheckpoint.close();game.off(Game.EVENT_HIDE,this.onHide,this);game.off(Game.EVENT_SHOW,this.onShow,this);}
  private onHide(){this.audio?.pause('background');this.cancelPartyDrag();if(this.ready)this.save();this.clockForeground=false;this.trustedClock.suspend();}
  private onShow(){this.audio?.resume('background');this.clockForeground=true;this.trustedClock.resume();void this.synchronizeTime();}
  private async synchronizeTime(){
    const wasReady=this.trustedClock.now()!==null;this.clockRetryAt=performance.now()+30000;
    const ok=await this.trustedClock.sync();
    if(ok){this.clockRetryAt=performance.now()+300000;this.settlePendingAd();this.save();if(!wasReady)this.clockUiRefresh=true;}
    return ok;
  }
  private settlePendingAd(){
    if(this.trustedClock.now()===null)return;
    delete this.state.pendingStaminaAd;
    if(this.state.pendingHatchAd){const {index,eggId}=this.state.pendingHatchAd;this.state=grantHatchAd(this.state,index,eggId,true);delete this.state.pendingHatchAd;}
    if(this.state.pendingBreedingAd){
      const {breedingId}=this.state.pendingBreedingAd;
      const next=grantBreedingAd(this.state,breedingId,true);
      if(next!==this.state&&next.breeding)Object.assign(next.breeding,{pcHelpCompletedAt:next.breeding.readyAt});
      this.state=next;delete this.state.pendingBreedingAd;
    }
  }
  private requireTime(){if(this.trustedClock.now()!==null)return true;this.timeNotice();return false;}
  private timeNotice(message='连接网络后继续计时'){
    const c=this.overlay('等待联网',226);this.text(c,message,0,30,16,C.muted,320,50);
    this.button(c,'time-close','返回',-82,-56,145,48,()=>this.render(),'#e8f3fa');
    this.button(c,'time-retry','重试',82,-56,145,48,async()=>{this.busy=true;try{if(await this.synchronizeTime())this.render();else this.timeNotice('暂时无法校时，请稍后重试');}finally{this.busy=false;}},'#519b81');
  }
  update(){
    const mono=performance.now();this.homeMotionUpdate(mono);if(this.ready&&this.clockForeground){
      if(mono>=this.clockRetryAt)void this.synchronizeTime();
      if(mono>=this.clockSaveAt){this.clockSaveAt=mono+15000;this.save();}
      if(this.clockUiRefresh&&!this.busy&&!this.pressPending&&!this.modal?.isValid){this.clockUiRefresh=false;this.render();}
    }
    const second=Math.floor(mono/1000);if(this.ready&&second!==this.hatchSecond)this.artCache.sweep();if(this.ready&&second!==this.hatchSecond&&this.screen==='home'&&this.clockForeground&&(!this.art[homeArtKey(homePeriod())]||homePeriod()!==this.homePeriod))void this.refreshHomeArt();if(second!==this.hatchSecond){this.hatchSecond=second;if(this.breedClock?.isValid&&this.state.breeding){const now=gameNow(),left=Number.isFinite(now)?this.state.breeding.readyAt-now:Infinity;this.breedClock.string=tr(left>0?this.hatchTime(left):'宠物蛋已准备好');if(left<=0&&!this.pressPending){this.breedClock=null;this.breedingUI();}}if(this.screen==='home')this.refreshHomeBadges();for(const c of this.hatchClock){if(!c.label.isValid)continue;const slot=this.state.incubators?.[c.index];if(slot){const left=hatchRemaining(slot);c.label.string=tr(this.hatchTime(left));if(!left&&!c.ready&&!this.pressPending){this.hatchery();break;}}}}
    for(let i=this.availableGlows.length-1;i>=0;i--){const glow=this.availableGlows[i];if(!glow.isValid)this.availableGlows.splice(i,1);else {const encounterAction=this.state.phase==='encounter'&&(glow.parent?.name==='reroll'||glow.parent?.name==='challenge');glow.active=!this.busy&&(!this.pressPending||encounterAction);}}
    if(mono>=this.nextLayoutCheck&&!this.busy&&!this.pressPending){
      this.nextLayoutCheck=mono+250;
      const usable=this.usableArea();
      if(this.layoutKey(usable)!==this.lastSize){this.layout(usable);if(this.ready)this.render();}
    }}
  private nextLayoutCheck=0;
  private usableArea(){
    const s=view.getVisibleSize(), safe=sys.getSafeAreaRect(false);
    const left=Math.max(0,safe.x), bottom=Math.max(0,safe.y);
    const right=Math.min(s.width,safe.x+safe.width), top=Math.min(s.height,safe.y+safe.height);
    return right>left&&top>bottom
      ? {x:left,y:bottom,width:right-left,height:top-bottom}
      : {x:0,y:0,width:s.width,height:s.height};
  }
  private layoutKey(area:{x:number;y:number;width:number;height:number}){
    const size=view.getVisibleSize();
    return [size.width,size.height,area.x,area.y,area.width,area.height].join(':');
  }
  private layout(area=this.usableArea()){
    const s=view.getVisibleSize();
    const widthScale=Math.min(1,area.width/390), usableHeight=area.height/widthScale;
    this.h=this.screen==='partners'?Math.max(700,usableHeight):usableHeight;
    this.lastSize=this.layoutKey(area);
    const fit=area.height/this.h;this.root.setScale(fit,fit,1);
    this.root.setPosition(area.x+area.width/2,area.y+area.height/2);
    this.root.getComponent(UITransform)!.setContentSize(area.width/fit,this.h);
    this.cam.node.setPosition(s.width/2,s.height/2,1000);this.cam.orthoHeight=s.height/2;}
  private async save(){
    if(this.sampleOriginal)return true;
    this.state.dexCollection=recordDex(this.state.dexCollection,this.state);
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
    const n=this.makeNode(parent,'panel',x,y,w,h),g=n.addComponent(Graphics);drawPanelSurface(g,w,h,fill,r,alpha);return n;
  }
  private text(parent:Node,value:string,x:number,y:number,size=16,fill=C.ink,w=350,h=size+12){
    const n=this.makeNode(parent,value,x,y,w,h),l=n.addComponent(Label);l.string=campaignText(value);l.fontSize=size;
    // Keep connected scripts in whole-line textures and leave room for vowel marks.
    const complex=/[\u0600-\u06ff\u0900-\u0d7f]/.test(l.string);
    l.lineHeight=complex?Math.ceil(size*1.45):size+(currentLocale()==='th'?11:7);l.fontFamily='sans-serif';
    if(h<=size+14&&!l.string.includes('\n'))l.enableWrapText=false;
    l.color=color(fill);l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;
    // Dynamic text uses per-label textures: the shared CHAR atlas fills up across rounds,
    // silently dropping new glyphs (damage, rewards and end-screen labels).
    l.cacheMode=Label.CacheMode.NONE;l.overflow=Label.Overflow.SHRINK;return l;
  }
  private button(parent:Node,id:string,value:string,x:number,y:number,w:number,h:number,callback:()=>void,fill=C.blue,enabled=true,size=17,inactiveFill='#c9d8e2'){
    const n=this.makeNode(parent,id,x,y,w,h);drawButtonSurface(n.addComponent(Graphics),w,h,enabled?fill:inactiveFill,enabled);
    const caption=this.text(n,value,0,0,size,enabled?this.buttonInk(fill):'#566978',w-16,h-6);caption.isBold=enabled&&w>=90;
    const world=n.worldPosition,scale=n.worldScale;this.controls[id]={x:world.x,y:view.getVisibleSize().height-world.y,w:w*Math.abs(scale.x),h:h*Math.abs(scale.y)};
    this.buttonTouchArea(n,w,h,enabled);
    if(enabled){
      const glow=this.makeNode(n,'available-glow',0,0,w,h),g=glow.addComponent(Graphics);
      this.availableGlows.push(glow);
      g.lineWidth=2;g.strokeColor=color(fill===C.paper||fill==='#e8f3fa'?'#6bb8eb':'#ffffff');
      g.roundRect(-w/2+3,-h/2+3,w-6,h-6,12);g.stroke();
      const opacity=glow.addComponent(UIOpacity);opacity.opacity=45;
      glow.on(Node.EventType.NODE_DESTROYED,()=>Tween.stopAllByTarget(opacity));
      // Idle controls are quiet; only intentional home/action cues animate.
      opacity.opacity=28;
      const motion=this.uiMotion();let resting:Vec3|null=null,pressed=false;
      const release=()=>{pressed=false;opacity.opacity=28;if(!resting)return;Tween.stopAllByTarget(n);const target=resting.clone();
        if(motion.release)tween(n).to(motion.release,{scale:target},{easing:'quadOut'}).call(()=>{resting=null;}).start();else{n.setScale(target);resting=null;}};
      n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{this.audio?.unlock();e.propagationStopped=true;if(this.busy||this.pressPending||this.uiEntering())return;
        resting=resting||n.scale.clone();pressed=true;Tween.stopAllByTarget(n);opacity.opacity=100;
        if(motion.pressIn)tween(n).to(motion.pressIn,{scale:new Vec3(resting.x*motion.pressScale,resting.y*motion.pressScale,resting.z)},{easing:'quadOut'}).start();});
      n.on(Node.EventType.TOUCH_CANCEL,(e:EventTouch)=>{e.propagationStopped=true;release();});
      n.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;
        if(!pressed)return;pressed=false;
        if(this.busy||this.pressPending||this.uiEntering()||performance.now()-this.lastTap<180){release();return;}
        this.audio?.unlock();this.audio?.effect('click');this.lastTap=performance.now();this.pressPending=true;
        Tween.stopAllByTarget(n);opacity.opacity=28;const target=(resting||n.scale).clone();
        if(motion.release)tween(n).to(motion.release*.55,{scale:new Vec3(target.x*motion.overshoot,target.y*motion.overshoot,target.z)},{easing:'quadOut'}).to(motion.release*.45,{scale:target}).call(()=>{resting=null;}).start();else{n.setScale(target);resting=null;}
        const serial=this.uiSerial;
        this.scheduleOnce(()=>{this.pressPending=false;if(serial!==this.uiSerial||!n.isValid)return;callback();},motion.commit);
      });
    }
    return n;
  }
  private buttonInk(fill:string){
    const luminance=(hex:string)=>{const c=color(hex),linear=(v:number)=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*linear(c.r)+.7152*linear(c.g)+.0722*linear(c.b);};
    const light=luminance(fill),dark='#0b1e28';return (light+.05)/(luminance(dark)+.05)>1.05/(light+.05)?dark:'#ffffff';
  }
  private uiMotion(){return uiMotion(this.nativeApp,!!(globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches);}
  private uiEntering(){return performance.now()<this.uiEnterUntil;}
  private enterUI(n:Node,route:string){
    if(this.uiRoute===route)return;this.uiRoute=route;
    const motion=this.uiMotion();if(!motion.enter)return;
    const serial=this.uiSerial,opacity=n.getComponent(UIOpacity)||n.addComponent(UIOpacity),target=n.position.clone();
    opacity.opacity=0;this.uiEnterUntil=performance.now()+(motion.enter+.04)*1000;
    // Defer displacement until controls have recorded their final hit positions.
    this.scheduleOnce(()=>{if(!n.isValid||serial!==this.uiSerial)return;
      tween(opacity).to(motion.enter,{opacity:255},{easing:'quadOut'}).start();
      if(n!==this.root&&motion.travel){n.setPosition(target.x,target.y-motion.travel,target.z);tween(n).to(motion.enter,{position:target},{easing:'cubicOut'}).start();}
    },0);
  }
  private buttonTouchArea(n:Node,w:number,h:number,enabled:boolean){
    const scale=n.worldScale,pixels=view.getScaleX()/view.getDevicePixelRatio();
    const tw=Math.max(w,48/Math.max(.2,pixels*Math.abs(scale.x))),th=Math.max(h,48/Math.max(.2,pixels*Math.abs(scale.y)));
    (n as any).tapBounds={w,h,tw,th};
    if(!enabled||tw===w&&th===h)return;
    // Input-only node: no texture, draw call, animation or per-frame work.
    const target=this.makeNode(n,'touch-area',0,0,tw,th),ui=target.getComponent(UITransform)!,nativeHit=ui.hitTest.bind(ui);
    ui.hitTest=(point,windowId=0)=>{
      if(!nativeHit(point,windowId))return false;
      const world=this.cam.screenToWorld(new Vec3(point.x,point.y,0));
      const distance=(button:Node)=>{const bounds=(button as any).tapBounds,local=button.getComponent(UITransform)!.convertToNodeSpaceAR(world),s=button.worldScale;
        if(Math.abs(local.x)>bounds.tw/2||Math.abs(local.y)>bounds.th/2)return Infinity;
        const dx=Math.max(0,Math.abs(local.x)-bounds.w/2)*Math.abs(s.x),dy=Math.max(0,Math.abs(local.y)-bounds.h/2)*Math.abs(s.y);
        return dx*dx+dy*dy;
      };
      const own=distance(n);if(own===0)return true;
      // Overlapping margins belong to the nearest visible button, including disabled ones.
      return !(n.parent?.children||[]).some(other=>other!==n&&other.activeInHierarchy&&(other as any).tapBounds&&distance(other)<own);
    };
    target.on(Node.EventType.TOUCH_START,()=>{}); // Let the existing parent press/drag handlers receive it.
    this.controls[n.name].w=tw*Math.abs(scale.x);this.controls[n.name].h=th*Math.abs(scale.y);
  }
  private image(parent:Node,key:string,x:number,y:number,w:number,h:number,mirror=false){
    const n=this.makeNode(parent,key,x,y,w,h);n.addComponent(Sprite);const rect=this.artCache.size(key),k=Math.min(w/rect.width,h/rect.height);
    n.getComponent(UITransform)!.setContentSize(rect.width*k,rect.height*k);this.artCache.bind(n,key);
    if(mirror)n.setScale(-1,1,1);return n;
  }
  private petScale(id:PetId){return {normal:.80,elite:1.15,boss:1.50}[PETS[id].rank];}
  private resolvePet(value:string|Pet):Pet {return typeof value==='string'?petEntry(this.state,value):value;}
  private petImage(parent:Node,value:string|Pet,x:number,y:number,size:number,role:'player'|'enemy'|'card'='card'){
    const p=this.resolvePet(value),id=p.id,side=role==='player'?'back':'front',evolved=p.rarity&&p.rarity!=='normal';
    if(this.appPresentation&&(this.state.mapId||0)===0&&this.state.phase==='battle'&&role!=='card'&&!evolved&&APP_BATTLE_IDS.includes(id)){
      const n=this.image(parent,appPoseKey(id,side),x,y,size,size);
      this.appActors.set(n,{id,side,size,ground:new Vec3(x,y,0),pose:'idle'});this.decoratePet(n,p);return n;
    }
    const key=evolved?formKey(p)+'-'+side:role==='card'?id:id+'-'+side;
    const n=this.image(parent,key,x,y,size,size,!evolved&&role==='card'&&id==='fox');this.decoratePet(n,p);return n;
  }
  private decoratePet(n:Node,p:Pet){
    const recipe=SECRET_RECIPES.find(r=>r.id===p.ornament);if(!p.shiny&&!recipe)return;
    const ui=n.getComponent(UITransform)!,w=ui.width,h=ui.height;
    if(p.shiny){const sprite=n.getComponent(Sprite)!;tintShiny(sprite);}
    const aura=this.makeNode(n,'pet-cosmetic',0,0,w,h),g=aura.addComponent(Graphics),ink=recipe?.color||'#ffd44a';
    g.strokeColor=color(ink,190);g.lineWidth=Math.max(1,w*.012);if(!p.shiny){g.ellipse(0,-h*.16,w*.46,h*.32);g.stroke();}g.fillColor=color(ink);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.cos(a)*w*.43,y=Math.sin(a)*h*.36,r=Math.max(3,w*.035);g.moveTo(x,y+r);g.lineTo(x+r*.55,y);g.lineTo(x,y-r);g.lineTo(x-r*.55,y);g.close();g.fill();}
    if(recipe?.id==='steam'){g.strokeColor=color('#ddffff',220);for(const x of [-.24,0,.24]){g.moveTo(w*x,h*.1);g.bezierCurveTo(w*(x-.1),h*.24,w*(x+.1),h*.3,w*x,h*.43);g.stroke();}}
    if(recipe?.id==='moon'){g.fillColor=color('#ece0ff');g.circle(w*.32,h*.29,w*.09);g.fill();g.fillColor=color('#aa7dd5');g.circle(w*.35,h*.32,w*.075);g.fill();}
    if(recipe?.id==='valor'){for(const x of [-.32,.32]){g.moveTo(w*x,h*.2);g.lineTo(w*(x+.08),h*.32);g.lineTo(w*(x+.16),h*.2);g.stroke();}}
    if(recipe?.id==='cloudwing'){for(const side of [-1,1])for(let i=0;i<3;i++){g.moveTo(side*w*.23,h*(.1-i*.06));g.quadraticCurveTo(side*w*.52,h*.4,side*w*(.42-i*.05),h*(.08-i*.08));g.stroke();}}
    if(recipe?.id==='spore'){for(let i=0;i<4;i++){const x=(i%2?1:-1)*w*(.28+.05*Math.floor(i/2)),y=h*(.12+.17*Math.floor(i/2));g.circle(x,y,w*.055);g.stroke();g.circle(x,y,w*.018);g.fill();}}
    if(recipe?.id==='crystal'){for(const x of [-.32,.32]){g.moveTo(w*x,h*.39);g.lineTo(w*(x+.07),h*.23);g.lineTo(w*x,h*.1);g.lineTo(w*(x-.07),h*.23);g.close();g.stroke();g.moveTo(w*x,h*.1);g.lineTo(w*x,h*.39);g.stroke();}}
    if(recipe?.id==='frostarmor'){for(const side of [-1,1]){const x=side*w*.32,y=h*.25;for(let i=0;i<3;i++){const a=i*Math.PI/3,dx=Math.cos(a)*w*.08,dy=Math.sin(a)*w*.08;g.moveTo(x-dx,y-dy);g.lineTo(x+dx,y+dy);g.stroke();}}}
    if(recipe?.id==='dream'){for(const side of [-1,1]){g.ellipse(side*w*.31,h*.25,w*.085,h*.055);g.stroke();g.circle(side*w*.31,h*.25,w*.025);g.fill();}}
    const op=aura.addComponent(UIOpacity);tween(op).repeatForever(tween().to(1.2,{opacity:135}).to(1.2,{opacity:255})).start();
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
  private battlePad(x:number,y:number,w:number,mapId=this.state.mapId||0){
    const key='region-pad-'+this.sceneRegion(mapId);
    if(this.sceneRegion(mapId)>0){const n=this.image(this.stage,key,x,y-4,w,w*.27);n.name='battle-ground';return;}
    const n=this.makeNode(this.stage,'battle-ground',x,y-4,w,w*.27),g=n.addComponent(Graphics),ry=w*.12;
    if(this.appPresentation){
      for(let i=4;i>=0;i--){g.fillColor=color('#51774d',12);g.ellipse(0,-1,w/2+i*2,ry+i);g.fill();}
      g.fillColor=color('#a7bd71',135);g.ellipse(0,1,w*.47,ry*.9);g.fill();
      g.fillColor=color('#d6d99a',85);g.ellipse(-w*.04,4,w*.39,ry*.64);g.fill();
      g.strokeColor=color('#e2e5b6',170);g.lineWidth=1;g.ellipse(0,2,w*.46,ry*.8);g.stroke();
      for(let i=0;i<18;i++){const a=i*2.4,px=Math.cos(a)*w*.43,py=Math.sin(a)*ry*.78;g.strokeColor=color(i%2?'#5a894c':'#b6d484',210);g.moveTo(px,py);g.quadraticCurveTo(px-2,py+5,px+(i%2?4:-4),py+7);g.stroke();}
      return;
    }
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
    const frame=this.artCache.size(key),w=size*frame.width/Math.max(frame.width,frame.height),u=this.petFeet(value,side)[0];
    return Math.max(-187+u*w*1.025,Math.min(187-(1-u)*w*1.025,preferred));
  }
  private groundPet(n:Node,id:string|Pet,side:'back'|'front',x:number,y:number){
    if(this.appActors.has(n)){this.appPose(n,'idle');this.breathe(n);return;}
    const [u,v]=this.petFeet(id,side),ui=n.getComponent(UITransform)!;
    ui.setAnchorPoint(u,.5);n.getChildByName('pet-cosmetic')?.setPosition((.5-u)*ui.width,0);n.setPosition(x,y+(v-.5)*ui.height);this.breathe(n,y);
  }
  private clear(){this.uiSerial++;this.uiEnterUntil=0;const opacity=this.root.getComponent(UIOpacity);if(opacity){Tween.stopAllByTarget(opacity);opacity.opacity=255;}this.homeMotion=null;this.appBattle?.dispose();this.appBattle=null;this.appActors.clear();this.cancelPartyDrag();this.partyDropNodes=[];this.partyDragHint=null;const stop=(n:Node)=>{Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);for(const child of n.children)stop(child);};for(const n of [...this.root.children]){stop(n);n.destroy();}this.root.removeAllChildren();this.controls={};this.modal=null;this.enemyNode=null;this.playerNode=null;this.diceNode=null;this.meters={};this.availableGlows=[];}
  private render(){
    if(this.screen!=='game'||this.state.phase!=='battle')this.shinyEntranceKey='';
    const adventureAudio=this.screen==='game'||this.screen==='utility'&&this.utilityOrigin==='game';
    this.audio?.select(adventureAudio&&(this.state.phase==='nest'||this.state.phase==='eggClaimed')?'egg-quest':adventureAudio&&this.state.phase==='battle'?rankForStage(this.state.step)==='boss'?'battle-boss':rankForStage(this.state.step)==='elite'?'battle-elite':'battle-normal':'camp');
    if(this.screen==='utility'&&this.utilityDraw){this.utilityDraw();return;}
    this.clear();this.layout();const s=this.state,H=this.h,b=-H/2;
    if(this.screen==='login'){this.loginUI();return;}
    if(this.screen==='hero'){this.heroChoiceUI();return;}
    if(this.screen==='starter'){this.starterChoiceUI();return;}
    if(this.screen==='game'&&!hasActivePet(s))this.screen='home';
    if(this.screen==='home'){this.homeUI();this.enterUI(this.root,'home');return;}
    if(this.screen==='adventure'){this.adventureUI();this.enterUI(this.root,'adventure');return;}
    if(this.screen==='partners'){this.partnersUI();this.enterUI(this.root,'partners');return;}
    if(s.phase==='nest'||s.phase==='eggClaimed'){this.nestUI();return;}
    const phase=s.phase;this.uiRoute='game:'+phase;const panelHeight=phase==='battle'?246:phase==='team'?300:phase==='reward'||phase==='event'?350:phase==='encounter'?328:230;
    const sceneHeight=H-panelHeight;
    const bg=this.image(this.root,this.regionKey('battle'),0,panelHeight/2,390,sceneHeight);bg.name='background';
    const os=this.artCache.size(this.regionKey('battle')),k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    if(!(this.appPresentation&&(s.mapId||0)===0))battleAmbience(this.root,s.mapId||0,sceneHeight,H,!!(globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    this.stage=this.makeNode(this.root,'actors',0,0,390,H);
    // Navigation stays at the edge; combat data belongs to the creature in the scene.
    const title=this.text(this.root,mapFor(s).name+' '+s.step+'/'+mapStageCount(s),0,H/2-30,18,'#ffffff',280,36);
    title.isBold=true;const outline=title.node.addComponent(LabelOutline);outline.color=color('#254b4d');outline.width=2;
    if(phase==='encounter'||phase==='battle')this.journeyMilestones(H/2-64);
    if(phase!=='won'&&phase!=='lost')this.retreatButton(H/2-30);
    const stageBottom=b+panelHeight;const stageTop=H/2-92;const area=stageTop-stageBottom;
    const center=stageBottom+area*.48;const size=Math.max(125,Math.min(245,area*.67));
    if(phase==='battle'){
      // Low camera composition from the approved reference: two distinct diagonal battle pads.
      const playerGround=H/2-sceneHeight*.92,enemyGround=H/2-sceneHeight*.62;
      const variant=s.enemyVariant?.revealed?s.enemyVariant.kind:undefined;
      const baseSize=Math.min(230,sceneHeight*.38);let playerSize=baseSize*1.2*Math.min(1.15,this.petScale(s.active.id)),enemySize=baseSize*.65*(this.appPresentation&&(s.mapId||0)===0?1:.8)*this.petScale(s.enemy)*(variant==='giant'?1.3:1);
      let enemyX=this.groundX(enemyPet(s),'front',enemySize*1.1,82),playerX=this.groundX(s.active,'back',playerSize*.9*giantMultiplier(s,s.active.uid),-92);
      if(MYTHIC_PET_IDS.includes(s.active.id)||MYTHIC_PET_IDS.includes(s.enemy)){
        const portrait=(p:Pet,side:'front'|'back',size:number)=>{const key=p.rarity&&p.rarity!=='normal'?formKey(p)+'-'+side:p.id+'-'+side,frame=this.artCache.size(key),feet=this.petFeet(p,side);return {width:frame.width,height:frame.height,feetX:feet[0],feetY:feet[1],size};};
        const fit=fitBattlePair(portrait(s.active,'back',playerSize*.9*giantMultiplier(s,s.active.uid)),portrait(enemyPet(s),'front',enemySize*1.1),playerGround,enemyGround,H/2-95);
        playerSize=fit.player.size/(.9*giantMultiplier(s,s.active.uid));enemySize=fit.enemy.size/1.1;playerX=fit.player.x;enemyX=fit.enemy.x;
      }
      this.battlePad(enemyX,enemyGround,enemySize*1.25*1.2*1.15);
      this.shadow(enemyX,enemyGround,enemySize*.55,.82);this.enemyNode=this.petImage(this.stage,enemyPet(s),enemyX,enemyGround,enemySize*1.1,'enemy');
      this.groundPet(this.enemyNode,enemyPet(s),'front',enemyX,enemyGround);
      if(variant==='ward'&&s.enemyVariant!.shield>0){const aura=this.makeNode(this.stage,'enemy-ward',enemyX,enemyGround+enemySize*.42,enemySize,enemySize),g=aura.addComponent(Graphics);g.fillColor=color('#84d5ff',24);g.ellipse(0,0,enemySize*.52,enemySize*.59);g.fill();g.strokeColor=color('#b5ecff',205);g.lineWidth=2;g.ellipse(0,0,enemySize*.52,enemySize*.59);g.stroke();}
      const status=this.panel(this.enemyNode,0,this.enemyNode.getComponent(UITransform)!.height/2+32,176,54,C.paper,10,246);status.name='enemy-hud';
      if(this.appPresentation||MYTHIC_PET_IDS.includes(s.active.id)||MYTHIC_PET_IDS.includes(s.enemy)){const mythic=MYTHIC_PET_IDS.includes(s.active.id)||MYTHIC_PET_IDS.includes(s.enemy),statusY=Math.min(H/2-100,enemyGround+this.enemyNode.getComponent(UITransform)!.height*(mythic?this.petFeet(enemyPet(s),'front')[1]:.75)+(mythic?32:26));status.setParent(this.root);status.setPosition(Math.max(-99,Math.min(99,enemyX)),statusY);}
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-26);pointer.lineTo(0,-34);pointer.lineTo(6,-26);pointer.close();pointer.fill();
      this.typeIcon(status,PETS[s.enemy].type,-73,14,17);this.text(status,enemyName(s),-20,14,12,C.ink,82,20);
      this.bar(status,-31,-10,104,s.enemyHP/s.enemyMax,s.enemyHP+' / '+s.enemyMax,'enemy');
      const intent=this.panel(status,55,0,58,38,'#fff0d9',8);
      this.attackDie(intent,-16,0,26);
      this.text(intent,''+enemyAttackAmount(s),14,4,22,'#b94c0a',32,30);
      this.matchupBadge(intent,matchupMultiplier(s.enemy,s.active.id),8,-12,42);
      if(variant){const badge=this.panel(status,0,42,154,24,variant==='ward'?'#416daf':variant==='mirror'?'#8657b4':'#a96428',10);badge.name='variant-badge';this.text(badge,variant==='giant'?'巨兽':variant==='mirror'?'幻影':'护盾',-39,0,12,'#ffffff',67,22);this.text(badge,variant==='giant'?'HP ×1.4':variant==='mirror'?'3 → ×1.4':'+'+s.enemyVariant!.shield,38,0,12,'#ffffff',80,22);}
      this.battlePad(playerX,playerGround,baseSize*1.25);
      this.shadow(playerX,playerGround,playerSize*.55*giantMultiplier(s,s.active.uid));this.playerNode=this.petImage(this.stage,s.active,playerX,playerGround,playerSize*.9*giantMultiplier(s,s.active.uid),'player');
      this.groundPet(this.playerNode,s.active,'back',playerX,playerGround);
      const entranceKey=[s.mapId,s.step,s.active.uid].join(':');
      if(s.active.shiny&&this.shinyEntranceKey!==entranceKey){this.shinyEntranceKey=entranceKey;shinyEntrance(this.stage,playerX,playerGround+playerSize*.4,playerSize*1.15);}
      if(s.doubled){const tag=this.panel(this.stage,playerX,playerGround+this.playerNode.getComponent(UITransform)!.height+18,116,28,'#fff0cd',14);this.text(tag,'攻击 ×'+s.boostMultiplier,0,0,14,'#a95a10');}
    }else if(phase==='encounter'){
      const statusY=H/2-144,room=statusY-70-stageBottom-22,petSize=Math.min(200,room*.90/1.5)*this.petScale(s.enemy),petY=stageBottom+room*.5;
      this.shadow(0,petY-petSize*.4,145);this.enemyNode=this.petImage(this.stage,enemyPet(s),0,petY,petSize,'enemy');this.breathe(this.enemyNode);
      this.button(this.root,'encounter-types','?',-162,H/2-30,44,44,()=>this.encounterTypesUI(),'#f7fcff',true,21);
      const status=this.panel(this.root,0,statusY,350,114,C.paper,14,246);status.name='encounter-enemy-hud';
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-45);pointer.lineTo(0,-55);pointer.lineTo(6,-45);pointer.close();pointer.fill();
      this.petImage(status,enemyPet(s),-142,17,52);
      const rank=rankForStage(s.step);this.text(status,rank==='boss'?'BOSS':rank==='elite'?'精英':'普通',-142,-22,10,rank==='boss'?'#ad6e15':rank==='elite'?'#8656b0':C.muted,62,18);
      if(s.enemyVariant){const tag=this.panel(this.root,0,petY+petSize*.48+17,110,28,'#735aab',14);tag.name='mysterious-enemy';this.text(tag,'?  神秘气息',0,0,13,'#ffffff',104,24);}
      this.makeNode(status,'enemy-attack-values',0,0,350,94);this.refreshEncounterThreat();
      this.bar(status,30,5,272,1,s.enemyMax+' / '+s.enemyMax);
      const r=s.reward,pointReward=r.kind==='attack'||r.kind==='heal',edgeReward=r.kind==='attackMin'||r.kind==='attackMax';
      const contentWidth=rankForStage(s.step)==='boss'?28:r.kind==='hp'?80:edgeReward?94:pointReward?35+r.values.length*36-6:54;
      const rewardLabelWidth=['zh-CN','zh-TW','ja','ko'].includes(currentLocale())?40:82;
      const rewardLeft=-(rewardLabelWidth+12+contentWidth)/2,contentLeft=rewardLeft+rewardLabelWidth+12;
      this.text(status,'奖励',rewardLeft+rewardLabelWidth/2,-29,15,C.muted,rewardLabelWidth,24).enableWrapText=false;
      if(rankForStage(s.step)==='boss'){this.text(status,'★',contentLeft+14,-29,24,'#e49424',28,26);}
      else {
        if(r.kind==='hp')this.text(status,'HP +'+r.values[0],contentLeft+40,-29,17,C.ink,80,24);
        else {
          if(r.kind==='attack'||edgeReward)this.attackDie(status,contentLeft+13.5,-29,24);
          else this.image(status,r.kind==='boost'?'power-potion':'heal-potion',contentLeft+13.5,-29,27,27);
          if(edgeReward)this.text(status,(r.kind==='attackMin'?'↓':'↑')+' +1',contentLeft+62,-29,17,'#b94c32',60,24);
          else if(pointReward)r.values.forEach((v,i)=>{const chip=this.panel(status,contentLeft+50+i*36,-29,30,24,r.kind==='attack'?'#fce0d8':'#d3f0df',6);this.text(chip,''+v,0,0,17,r.kind==='attack'?'#b94c32':'#278665',28,22);});
          else this.text(status,'+'+r.values[0],contentLeft+40,-29,17,C.ink,28,24);
        }
      }
    }else if(phase==='event'){
      const e=s.battleEvent!;
      if(BATTLE_EVENTS[e.kind].group==='egg'){const egg=s.eggs!.find(v=>v.id===e.eggId)!;this.eggArt(this.stage,egg,0,center,Math.min(170,size));}
      else if(BATTLE_EVENTS[e.kind].group==='supply'){this.image(this.stage,e.supply==='boost'?'power-potion':'heal-potion',0,center,Math.min(155,size),Math.min(155,size));}
      else{const p=e.uid?petEntry(s,e.uid):s.active;this.enemyNode=this.petImage(this.stage,p,0,center,size);this.breathe(this.enemyNode);}
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
    if(phase==='event')this.battleEventUI(sheet);
    if(phase==='recruit')this.recruitUI(sheet,panelHeight);
    if(phase==='team')this.teamUI(sheet,panelHeight);
    if(phase==='won'||phase==='lost'){
      this.text(sheet,mapFor(s).name+'  ·  '+(phase==='won'?mapStageCount(s):Math.max(0,s.step-1))+' / '+mapStageCount(s),0,65,22,C.ink,350,36).isBold=true;
      const recoveryHint=phase==='lost'&&s.gymRun===undefined;
      this.text(sheet,s.gymRun!==undefined?(phase==='won'?'获得道馆徽章':'挑战结束'):(phase==='won'?'通关已记录 · 获得的宠物蛋已保留':'已获得的宠物蛋保留'),0,recoveryHint?34:22,14,C.muted,350,recoveryHint?24:32);
      if(recoveryHint)this.text(sheet,'试试防御和属性克制',0,7,14,'#335b68',350,24);
      const hatch=hasHatchAction(s,gameNow()),care=hatch||phase==='lost'||hasOpenPartySlot(s);
      if(care){
        this.button(sheet,'result-care',hatch?'孵化屋':'伙伴',-87,-49,166,58,()=>{this.goHome();if(hatch)this.hatchery();else this.collection(0);},'#519b81',true,20);
        this.button(sheet,'result-home','返回营地',87,-49,166,58,()=>this.goHome(),'#e3ece8',true,18);
      }else this.button(sheet,'result-home','返回营地',0,-49,340,58,()=>this.goHome(),'#519b81',true,22);
    }
    if(this.saveError)this.text(this.root,'保存失败，请勿关闭页面',0,b+12,14,'#c44141',350,24);
    this.fx=this.makeNode(this.root,'battle-effects',0,0,390,H);
    if(this.appPresentation&&(s.mapId||0)===0){this.appBattle=new PMAppBattle(this.stage,this.fx,sceneHeight,H,!!(globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches);this.appBattle.ambience();this.appBattleSkin(sheet,phase==='battle');}
    if(this.sampleOriginal&&(phase==='reward'||phase==='won'||phase==='lost'))this.sampleResult(sheet);
    if(phase==='reward'||phase==='won'){const n=this.enemyNode!;const pos=n.position.clone();tween(n).by(.18,{position:new Vec3(0,15,0)},{easing:'quadOut'}).to(.2,{position:pos},{easing:'quadIn'}).start();}
  }
  private startFromCover(){
    this.continueFromCover();
  }
  private continueFromCover(){
    const step=this.state.journey?.stage;
    // Resume the committed expedition snapshot without entering again, charging stamina or rolling dice.
    this.screen=step==='hero'?'hero':step==='starter'?'starter':this.state.expedition?'game':'home';
    this.render();
    if(this.screen==='home'&&this.state.pendingHatch)this.hatchReveal();

  }
  private loginLogoKey(){
    const locale=currentLocale();
    if(locale==='zh-CN')return 'login-title-v3';
    // New text locales share the existing international brand artwork.
    const branded=['en','ja','ko','zh-TW','th','pt-BR','es-419','id','vi','de','fr'];
    return 'login-title-'+(branded.includes(locale)?locale:'en')+'-v1';
  }
  private loginUI(){
    const H=this.h,top=H/2;this.fillArt('login-cover-v2');
    const chinese=currentLocale()==='zh-CN';
    const logoKey=this.loginLogoKey(),logoSize=this.artCache.size(logoKey);
    const logoScale=Math.min(368/logoSize.width,148/logoSize.height);
    this.image(this.root,logoKey,0,top-86,logoSize.width*logoScale,logoSize.height*logoScale);
    const button=this.button(this.root,'start-game',chinese?'':'开始游戏',0,-H*.2,216,64,()=>this.startFromCover(),'#ffd45c',true,24);
    if(chinese){button.getComponent(Graphics)!.clear();this.image(button,'login-button-v4',0,0,216,64);}
    else{const label=button.getComponentInChildren(Label)!;label.color=color('#234c73');label.isBold=true;}
    const glowNode=button.getChildByName('available-glow')!,glow=glowNode.getComponent(Graphics)!;glowNode.setSiblingIndex(button.children.length-1);
    glow.clear();glow.strokeColor=color('#fff7cb');glow.lineWidth=1.2;glow.roundRect(-101.6,-26.4,203.2,52.8,26.4);glow.stroke();
    this.fx=this.makeNode(this.root,'login-effects',0,0,390,H);
    if(this.appPresentation)this.button(this.root,'app-battle-sample','战斗样板',0,-H*.2-72,174,40,()=>void this.startBattleSample(),'#286d7b',true,17);
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
    const H=this.h,top=H/2,b=-H/2,petInfo={fox:{color:'#d86d49',tag:'火',note:skillFor({id:'fox',rarity:'normal'}).description},bud:{color:'#55a06a',tag:'草',note:skillFor({id:'bud',rarity:'normal'}).description},otter:{color:'#479fbd',tag:'水',note:skillFor({id:'otter',rarity:'normal'}).description}},selected=this.selectedStarter,entry=petInfo[selected];
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
    this.text(foot,entry.note,0,3,13,C.muted,350,48);
    this.button(foot,'starter-confirm','和 '+PETS[selected].name+' 出发  ›',0,-49,350,54,()=>{const next=chooseStarter(this.state,this.selectedStarter);if(next===this.state)return;this.state=next;this.save();this.screen='home';this.render();},entry.color,true,20);
    this.fx=this.makeNode(this.root,'starter-choice-effects',0,0,390,H);
  }
  private eggTint(egg:Egg){return egg.friend?'#c4719b':egg.rarity==='SSR'?'#d79428':egg.rarity==='SR'?'#9062cf':'#5b9a80';}
  private eggName(egg:Egg){return egg.friend&&!egg.genes?'宠物蛋':rarityName(egg.rarity)+' · '+PETS[egg.affinity].type;}
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
    const bg=this.image(this.root,this.regionKey('nest'),0,panelHeight/2,390,sceneHeight);bg.name='egg-nest';
    const os=this.artCache.size(this.regionKey('nest')),k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    this.stage=this.makeNode(this.root,'nest-stage',0,0,390,H);
    const title=this.text(this.root,claimed?'带着惊喜回家':'巢穴寻蛋',0,H/2-36,26,'#fff9df',280,42);title.isBold=true;const out=title.node.addComponent(LabelOutline);out.color=color('#365543');out.width=2;
    this.retreatButton(H/2-32);
    const info=this.panel(this.root,0,H/2-80,claimed?170:224,30,'#294c3f',15,210);
    this.text(info,claimed?'已存入蛋袋 ✓':(rankForStage(s.step)==='boss'?'BOSS 巢穴':'精英巢穴')+'  ·  '+(hunt.limit-hunt.candidates.length)+' 次翻找',0,0,14,'#fff8d9',216,26);
    if(s.enemyVariant?.rewardEggId){const egg=s.eggs!.find(e=>e.id===s.enemyVariant!.rewardEggId);if(egg){this.eggArt(this.root,egg,-157,H/2-83,32);this.text(this.root,'+1',-125,H/2-83,16,'#fff8d9',32,24);}}
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
      if(bonus)this.eggArt(this.stage,bonus,105,eggY-18,eggSize*.65);
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
    if(this.saveError)this.text(this.root,'保存失败，请勿关闭页面',0,b+12,14,'#c44141',350,24);
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
    this.listPages(c,eggs,6,page,(egg,itemIndex)=>{const i=itemIndex%6;const chosen=egg.id===this.selectedEgg,incubating=this.state.incubators?.some(s=>s?.eggId===egg.id),row=this.button(c,'egg-'+egg.id,'',(i%3-1)*120,first-Math.floor(i/3)*(cardH+12),112,cardH,()=>{this.selectedEgg=egg.id;this.eggShelf(slot,page);},chosen?'#fff1d6':'#ffffff');
      this.listItem(row,itemIndex,6);this.eggArt(row,egg,0,6,Math.min(86,cardH-48));this.text(row,egg.friend&&!egg.genes?'♡':rarityName(egg.rarity),32,cardH/2-17,12,this.eggTint(egg),45,24).isBold=true;
      this.text(row,incubating?'孵化中':this.eggName(egg),0,-cardH/2+19,12,C.ink,104,25);
    });
    if(!eggs.length)this.text(c,'还没有宠物蛋',0,40,21,C.muted,330,50);
    this.pagePager(c,bottom+191,page,pages,(p,redraw)=>{page=p;if(redraw)this.eggShelf(slot,p);},slot===null?'eggs':'picker');
    const foot=this.panel(c,0,bottom+82,390,164,'#fffdf5',22),busy=selected&&this.state.incubators?.some(s=>s?.eggId===selected.id),free=slot===null?[0,1].find(i=>!this.state.incubators?.[i]):slot;
    this.text(foot,selected?this.eggName(selected):'探险 · 交配获得',0,54,20,selected?this.eggTint(selected):C.muted,350,31).isBold=true;
    this.text(foot,selected?(selected.friend||selected.bond?'宠物蛋':selected.genes?'♥ 父母遗传':mapFor(selected).name)+' · '+hatchDuration(this.state,selected.rarity)/60000+' 分钟':'',0,20,13,C.muted,340,27);
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
    this.encounterNameAttack(n,enemyName(this.state),enemyAttackFaces(this.state).map(v=>enemyAttackAmount(this.state,v)),30,PETS[this.state.enemy].type,matchupMultiplier(this.state.enemy,this.state.active.id));
  }
  private matchupBadge(parent:Node,multiplier:number,x:number,y:number,w=60,showNeutral=false){
    if(multiplier===1&&!showNeutral)return;
    const n=this.panel(parent,x,y,w,18,multiplier>1?'#fff0eb':multiplier<1?'#e0edf8':'#edf0f2',6);
    n.name='matchup-'+multiplier;
    this.text(n,'×'+multiplier,0,0,multiplier>1?14:12,multiplier>1?'#d63737':multiplier<1?'#256cc1':'#202020',w-2,18).isBold=true;
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
  private encounterNameAttack(p:Node,name:string,faces:number[],top:number,type:string,multiplier=1){
    this.typeIcon(p,type,-108,top,18);this.text(p,name,-52,top,16,C.ink,90);
    this.attackDie(p,25,top,23);const gap=Math.min(35,130/faces.length);
    faces.forEach((v,i)=>{const chip=this.panel(p,62+i*gap,top,29,24,'#fff0d9',6);this.text(chip,''+v,0,0,17,'#b94c0a',27,22);});
    this.matchupBadge(p,multiplier,25,top+19,52,true);
  }
  private playerHUD(p:Node,top:number,preview=false,s=this.state){
    this.petImage(p,s.active,preview?-142:-150,top-13,52);
    if(preview)this.encounterNameAttack(p,petName(s.active),petAttackFaces(s.active).map(v=>typedDamage(v*runAttackMultiplier(s,s.active.uid)*gymBonus(s,s.active.id),matchupMultiplier(s.active.id,s.enemy))),top,PETS[s.active.id].type,matchupMultiplier(s.active.id,s.enemy));
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
    const choices=partyChoices(s),suggestion=suggestedTypePartner(s);
    choices.forEach((id,i)=>{
      const selected=s.active.uid===id,owned=!!id&&s.pets!.some(p=>p.uid===id),breeding=owned&&!!s.breeding&&[s.breeding.mother,s.breeding.father].includes(id),tint=selected?'#fff2cf':owned&&!breeding?'#fbfeff':'#e7edf0',x=(i-1)*118;
      const info=owned?petCombat(s,id):null,dead=info?.hp===0;
      this.panel(p,x,-1,108,113,selected?'#c5933d':'#b9ced9',17);
      const card=this.button(p,'pet-'+id,'',x,4,108,110,()=>{const next=selectActive(this.state,id);if(next!==this.state){this.state=next;this.save();this.encounterPartyUI(p);this.refreshEncounterThreat();}},tint,owned&&!selected&&!breeding&&!dead,16,tint);
      const rim=card.getComponent(Graphics)!;rim.lineWidth=selected?3:1.5;rim.strokeColor=color(selected?'#e4ae48':'#bdd6e2');rim.roundRect(-52,-53,104,106,14);rim.stroke();
      const disc=this.makeNode(card,'portrait-disc',0,14,78,78).addComponent(Graphics);disc.fillColor=color(selected?'#ffe2a1':owned?'#e1f3f7':'#d7e1e6');disc.circle(0,0,37);disc.fill();
      if(owned)this.petImage(card,id,0,18,58).getComponent(Sprite)!.grayscale=breeding||dead;else this.menuIcon(card,'lock',0,15,30,'#9aacb0');
      if(info){const health=this.panel(card,0,-14,76,18,dead?'#f5dfe2':'#f7fcff',6);this.text(health,dead?'阵亡':info.hp+'/'+info.max,0,0,11,dead?'#a34a53':C.ink,74,17);}
      this.panel(card,0,-36,96,25,selected?'#f8d993':owned?'#eaf3f7':'#d4e0e6',8);
      this.text(card,owned?petName(petEntry(s,id)):'空位',0,-36,14,owned?C.ink:C.muted,94,23).isBold=selected;
      if(selected){const mark=this.panel(card,39,40,24,24,'#43a986',12);this.text(mark,'✓',0,0,17,'#ffffff',24,24);}
      if(id===suggestion){const hint=this.panel(card,39,selected?12:40,24,24,'#357a65',12);hint.name='type-suggestion';this.text(hint,'★',0,0,16,'#fff3ba',22,22);}
      if(owned&&!breeding&&!dead)this.matchupBadge(card,matchupMultiplier(petEntry(s,id).id,s.enemy),-21,40,60);
      if(breeding){const badge=this.panel(card,-6,40,80,19,'#947d90',7);this.text(badge,gameNow()>=s.breeding!.readyAt?'待领蛋':'交配中',0,0,11,'#ffffff',76,19);}
      if(!owned){const lock=this.makeNode(card,'locked',39,39,20,23),g=lock.addComponent(Graphics);g.strokeColor=color(C.muted);g.fillColor=color(C.muted);g.lineWidth=2;g.roundRect(-5,0,10,11,5);g.stroke();g.roundRect(-8,-8,16,13,3);g.fill();}
    });
  }
  private encounterUI(p:Node,height:number){const s=this.state;
    this.encounterPartyUI(this.makeNode(p,'encounter-party',0,0,390,height));
    const refreshable=rankForStage(s.step)!=='boss'&&s.swaps>0;
    this.panel(p,-128,-107,92,64,refreshable?'#6795ae':'#a8bdca',16);
    const reroll=this.button(p,'reroll','',-128,-102,92,64,()=>this.command('reroll'),'#dff3fc',refreshable);
    this.image(reroll,'refresh-enemy',-8,2,50,50).getComponent(Sprite)!.grayscale=!refreshable;
    const count=this.panel(reroll,28,-18,28,25,refreshable?'#246987':'#93aab8',10);
    this.text(count,''+s.swaps,0,0,16,'#ffffff',23,23);
    this.panel(p,51,-107,246,64,'#bc6f26',16);
    const challenge=this.button(p,'challenge','',51,-102,246,64,()=>this.command('challenge'),'#f2ad45');
    const shine=challenge.getComponent(Graphics)!;shine.fillColor=color('#ffe3a0',125);shine.roundRect(-117,3,234,23,10);shine.fill();
    this.image(challenge,'battle-start',0,1,67,67);
    const arrows=this.makeNode(challenge,'forward',76,0,30,30).addComponent(Graphics);arrows.lineWidth=3;arrows.strokeColor=color('#fff6da');
    for(const dx of [0,13]){arrows.moveTo(dx-6,-9);arrows.lineTo(dx+2,0);arrows.lineTo(dx-6,9);arrows.stroke();}
  }
  private journeyMilestones(y:number){
    const s=this.state,total=mapStageCount(s),n=this.makeNode(this.root,'journey-milestones',0,y,220,24),g=n.addComponent(Graphics);
    g.lineWidth=2;g.strokeColor=color('#234c51',170);g.moveTo(-99,0);g.lineTo(99,0);g.stroke();
    for(let i=1;i<=total;i++){
      const x=(i-(total+1)/2)*22,done=i<s.step,current=i===s.step;
      const dot=this.panel(n,x,0,current?18:14,current?18:14,done?'#519d83':current?'#fff2bd':'#e2e9df',9);dot.name='milestone-'+i;
      if(i===total)this.text(dot,'★',0,0,13,done?'#ffffff':'#976c24',18,20);
      else if(i===5&&s.gymRun===undefined){const egg=dot.addComponent(Graphics);egg.fillColor=color(done?'#ffffff':'#899b60');egg.ellipse(0,0,3.8,5);egg.fill();}
      else if(done)this.text(dot,'✓',0,0,10,'#ffffff',14,16);
      else if(current)this.text(dot,''+i,0,0,11,'#694c26',18,18).isBold=true;
    }
  }
  private battleUI(p:Node,height:number,s=this.state,command:(a:Action)=>void=a=>void this.command(a)){
    this.playerHUD(p,104,false,s);
    this.text(p,'第 '+s.turn+' 回合',131,104,12,C.muted,85);
    const hint=battleLearningHint(s);
    const status=this.text(p,hint||skillStatus(s)+(heroHealBonus(s)?' · 首次治疗 +3':''),0,hint?59:63,hint?14:11,hint?'#335b68':s.active.rarity==='SSR'?'#b78022':s.active.rarity==='SR'?'#8b61bb':C.muted,342,hint?20:24);status.node.name=hint?'battle-learning-hint':'battle-skill-status';
    const canHeal=s.potions>0&&!s.usedHeal&&s.hpRatio<1,canBoost=s.boosts>0&&!s.doubled;
    const potion=(id:'heal'|'boost',x:number,key:string,stock:number,base:number,multiplier:number,enabled:boolean,tint:string)=>{
      const disabled=!enabled,used=id==='heal'?s.usedHeal:s.doubled,ink=disabled?'#6a7d8b':'#ffffff';
      const n=this.button(p,id,'',x,hint?9:18,166,72,()=>command(id),tint,enabled,17,'#c9d8e2');
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
    const guard=this.button(p,'guard','',-89,hint?-75:-66,166,72,()=>s.doubled?this.confirmGuard(s,command):command('guard'),C.blue);
    this.image(guard,'guard-shield',-45,0,58,58);
    this.text(guard,'99%',31,0,30,'#ffffff',82,44);
    const attack=this.button(p,'attack','',89,hint?-75:-66,166,72,()=>command('attack'),C.orange);
    if(s.goldDie){const halo=this.panel(attack,-44,4,58,58,'#fff3a1',16);halo.name='gold-die-halo';this.text(attack,'★',-71,27,17,'#fffadc',22,22);const op=halo.addComponent(UIOpacity);tween(op).repeatForever(tween().to(.6,{opacity:110}).to(.6,{opacity:255})).start();}
    this.attackDie(attack,-44,5,45);
    if(s.goldDie){const badge=this.panel(attack,28,32,92,20,'#fff5cf',8);this.text(badge,s.goldDie==='strike'?'⚔ ×1.5':s.goldDie==='heal'?'♥ +15%':'◆ +6',0,0,12,'#985e13',88,20);}
    const rolled=this.panel(attack,-44,-23,35,17,'#fff2ca',6);this.text(rolled,''+s.attack,0,0,12,'#915415',33,17);
    this.text(attack,''+attackAmount(s),32,4,36,'#ffffff',76,45);
    this.matchupBadge(attack,matchupMultiplier(s.active.id,s.enemy),32,-23,72);
  }
  /** Native presentation stays outside the model: frames and FX never decide damage. */
  private appPose(n:Node,pose:string){
    const actor=this.appActors.get(n);if(!actor||!n.isValid)return;
    actor.pose=pose;const key=appPoseKey(actor.id,actor.side,pose),size=this.artCache.size(key);
    const atlas=APP_BATTLE_ATLASES[actor.id],k=actor.size/(atlas.size[0]/4)*atlas.scale,ui=n.getComponent(UITransform)!;
    ui.setContentSize(size.width*k,size.height*k);const [u,v]=appPoseFeet(actor.id,actor.side,pose);
    ui.setAnchorPoint(u,1-v);n.getChildByName('pet-cosmetic')?.setPosition((.5-u)*ui.width,(v-.5)*ui.height);this.artCache.bind(n,key);
  }
  private appPoint(n:Node){const p=n.position.clone();if(this.appActors.has(n))p.y+=n.getComponent(UITransform)!.height*.43;return p;}
  private appBattleSkin(sheet:Node,battle:boolean){
    const ui=sheet.getComponent(UITransform)!,g=sheet.getComponent(Graphics)!;
    g.clear();g.fillColor=color('#163b50');g.roundRect(-195,-ui.height/2,390,ui.height,25);g.fill();
    g.fillColor=color('#f2f5ee');g.roundRect(-191,-ui.height/2+4,382,ui.height-8,22);g.fill();
    g.strokeColor=color('#d6b877');g.lineWidth=2;g.moveTo(-165,ui.height/2-2);g.lineTo(165,ui.height/2-2);g.stroke();
    if(!battle)return;
    for(const id of ['heal','boost','guard','attack']){
      const button=sheet.getChildByName(id);if(!button)continue;
      const frame=button.getComponent(Graphics)!;frame.strokeColor=color('#183c50',95);frame.lineWidth=2;
      frame.roundRect(-82,-35,164,70,14);frame.stroke();
      frame.fillColor=color('#ffffff',28);frame.roundRect(-78,12,156,20,10);frame.fill();
      frame.strokeColor=color('#ffffff',105);frame.lineWidth=1;frame.moveTo(-65,30);frame.lineTo(65,30);frame.stroke();
    }
  }
  private async startBattleSample(){
    if(this.busy)return;this.busy=true;
    try{
      await this.loadRegionArt(0);
      const original=this.sampleOriginal||this.state;
      let sample=chooseStarter(chooseHero(newJourney(417),'ranger'),'fox');
      for(const id of ['bud','otter'] as PetId[]){const p={...pet(id),uid:'app-sample-'+id,rarity:'normal' as EggRarity,sex:'female' as Sex};sample.pets!.push(p);sample.owned.push(id);sample.qualities![id]=['normal'];}
      sample.team=sample.pets!.map(p=>p.uid!).slice(0,3);sample.reserve=sample.pets![1];
      sample.mapId=0;sample.step=1;sample.expedition=true;sample.phase='encounter';
      sample.enemy=(['bud','otter','fox'] as PetId[])[this.sampleEnemy%3];sample.enemyHP=sample.enemyMax=32;
      sample.potions=3;sample.boosts=3;sample.swaps=1;
      this.sampleOriginal=original;this.state=sample;this.screen='game';this.busy=false;this.render();
    }catch(e){this.busy=false;console.error('APP sample assets',e);}
  }
  private sampleResult(sheet:Node){
    for(const child of [...sheet.children])child.destroy();sheet.removeAllChildren();
    for(const id of Object.keys(this.controls))if(id!=='retreat')delete this.controls[id];
    this.text(sheet,this.state.phase==='lost'?'再试一次':'胜利',0,70,32,'#b77d24',320,48).isBold=true;
    this.button(sheet,'sample-again','再试一次',0,-5,280,54,()=>{this.sampleEnemy++;void this.startBattleSample();},'#e5a13b',true,21);
    this.button(sheet,'sample-exit','返回',0,-73,180,40,()=>this.goHome(),'#387483',true,17);
  }
  private heartIcon(parent:Node,x:number,y:number,size:number,tint:string){
    const n=this.makeNode(parent,'heart-icon',x,y,size,size),g=n.addComponent(Graphics);n.setScale(size/48,size/48,1);
    g.fillColor=color(tint);g.strokeColor=color('#ffffff');g.lineWidth=2;
    g.moveTo(0,-20);g.bezierCurveTo(-38,3,-19,33,0,15);g.bezierCurveTo(19,33,38,3,0,-20);g.close();g.fill();g.stroke();
    return n;
  }
  private rewardUI(p:Node,height:number){const s=this.state,r=s.reward;
    this.text(p,'胜利',0,145,30,'#bf812b',240,42).isBold=true;
    if(s.enemyVariant?.rewardEggId){const egg=s.eggs!.find(e=>e.id===s.enemyVariant!.rewardEggId);if(egg){this.eggArt(p,egg,-142,143,34);this.text(p,'+1',-110,143,17,'#91672b',35,25);}}
    const recovery=this.panel(p,0,104,198,29,'#e2f5eb',14);
    this.heartIcon(recovery,-77,0,19,'#36a779');this.text(recovery,'恢复生命 +20%',15,0,15,'#278665',160,25);
    const teamReward=r.kind==='hp'||r.kind==='attackMin'||r.kind==='attackMax';
    this.text(p,r.kind==='attack'?'攻击点数 · 选择一项':r.kind==='heal'?'恢复点数 · 选择一项':teamReward?'全队获得奖励':'获得奖励',0,72,15,C.muted,320,24);
    if(r.kind==='attack'||r.kind==='heal'){
      const healing=r.kind==='heal';
      [{id:'keep' as Action,title:'原点数',action:'保留',values:healing?s.healFaces:petAttackFaces(s.active),tint:'#448dbc',bg:'#edf7fd'},
       {id:'take' as Action,title:'新点数',action:'采用',values:healing?r.values:petAttackFaces({...s.active,faces:r.values}),tint:healing?'#299c72':'#d4932c',bg:healing?'#eaf9f1':'#fff7e4'}].forEach((option,i)=>{
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
    const palette={hp:['#d95570','#fff0f3','生命上限'],attackMin:['#cf7130','#fff5df','最低攻击'],attackMax:['#ce4c40','#fff0ee','最高攻击'],attack:['#e49424','#fff5df','攻击点数'],heal:['#299c72','#eaf9f1','恢复点数'],potion:['#299c72','#eaf9f1','生命药水'],boost:['#d95557','#fff0ee','力量药水']};
      const [tint,bg,name]=palette[r.kind];
      const card=this.panel(p,0,-4,338,118,bg,17);
      const border=card.getComponent(Graphics)!;border.lineWidth=2;border.strokeColor=color(tint);border.roundRect(-167,-57,334,114,15);border.stroke();
      if(teamReward){
        this.text(card,name+' +'+r.values[0],0,36,18,tint,310,28).isBold=true;
        const team=homeParty(s).filter(Boolean);
        team.forEach((uid,i)=>{
          const stats=petCombat(s,uid),x=(i-(team.length-1)/2)*104;
          const current=r.kind==='hp'?stats.max:r.kind==='attackMin'?Math.min(...petAttackFaces(stats.pet)):Math.max(...stats.pet.faces);
          const next=r.kind==='hp'?Math.round((petBaseHP(stats.pet)+Math.min(450,stats.bonus+r.values[0]))*runHealthMultiplier(s,uid)*gymBonus(s,stats.pet.id)):Math.min(100,current+r.values[0]);
          this.petImage(card,stats.pet,x,0,39);
          this.text(card,current+' → '+next,x,-34,17,tint,100,26).isBold=true;
        });
      }else{
        this.text(card,name,47,33,18,tint,206,28).isBold=true;
        this.image(card,r.kind==='boost'?'power-potion':'heal-potion',-105,0,87,87);
        const current=r.kind==='potion'?s.potions:s.boosts;
        const next=Math.min(9,current+r.values[0]);
        this.text(card,'+'+(next-current),47,0,34,tint,180,44).isBold=true;
        this.text(card,current+' → '+next,47,-35,15,C.muted,180,24);
      }
    this.panel(p,0,-121,338,56,'#b47826',16);
    const take=this.button(p,'take','',0,-116,338,56,()=>this.command('take'),'#f4bd50');
    const surface=take.getComponent(Graphics)!;surface.fillColor=color('#ffe8a0',170);surface.roundRect(-162,2,324,21,10);surface.fill();
    const caption=this.text(take,'领取奖励',0,0,23,'#fffdf2',300,40);caption.isBold=true;
    const edge=caption.node.addComponent(LabelOutline);edge.color=color('#a97424');edge.width=1.4;
  }
  private battleEventUI(p:Node){
    const s=this.state,e=s.battleEvent!,event=BATTLE_EVENTS[e.kind],group=event.group;
    const tint=group==='egg'?'#ca8b2b':group==='learn'?'#7662bd':group==='buff'?'#d66a45':group==='supply'?'#477fa9':'#329574';
    this.text(p,'奇遇',0,142,30,tint,320,44).isBold=true;
    const title=this.text(p,event.title,0,99,21,C.ink,330,32);title.node.name='event-title';title.isBold=true;
    const card=this.panel(p,0,0,338,150,'#ffffff',17);card.name='event-detail';
    if(e.uid)this.text(card,petName(petEntry(s,e.uid)),0,53,18,tint,310,26).isBold=true;
    if(group==='heal'||group==='revive'){
      this.heartIcon(card,-57,e.uid?5:22,34,tint);
      const c=e.uid?petCombat(s,e.uid):null;this.text(card,c?c.hp+' / '+c.max:'+25%',25,e.uid?5:22,28,tint,200,42).isBold=true;
      this.text(card,event.description,0,-42,13,C.muted,310,44);
    }else if(group==='buff'){
      this.text(card,event.description,0,-1,19,tint,310,64).isBold=true;
    }else if(group==='learn'){
      this.text(card,SKILLS[e.skill!][0],0,20,18,tint,310,28).isBold=true;
      const detail=this.text(card,SKILLS[e.skill!][1],0,-32,14,C.muted,310,66);detail.node.name='event-skill-description';
    }else if(group==='supply'){
      const heal=e.supply==='potion';this.actionIcon(card,heal?'heal':'boost',-44,21,52,heal?'#329574':'#cc6257');
      this.text(card,'+1',42,21,30,tint,120,44).isBold=true;
      this.text(card,heal?'生命药水 +1':'力量药水 +1',0,-35,17,C.muted,310,32);
    }else if(group==='egg'){
      const egg=s.eggs!.find(v=>v.id===e.eggId)!;this.text(card,this.eggName(egg),0,20,26,this.eggTint(egg),310,42).isBold=true;
      this.text(card,'已放入蛋袋',0,-24,17,C.muted,310,30);
    }
    if(group==='learn'||group==='buff'||e.kind==='reviveHalf')this.text(p,group==='learn'?'本关内有效':'接下来2场 · 本关内有效',0,-90,13,C.muted,330,22);
    this.button(p,'eventContinue','继续冒险  ›',0,-134,338,56,()=>this.command('eventContinue'),tint,true,22);
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
  private skillPopup(value:string,pos=new Vec3(0,35,0)){
    // Match the enemy's blue skill badge: same dimensions, corners and type size.
    const n=this.panel(this.fx,pos.x,pos.y+48,154,24,'#416daf',10);n.name='skill-badge';
    const parts=value.split(' · ').filter(Boolean),label=this.text(n,parts[0]||value,0,0,12,'#ffffff',146,22);
    const opacity=n.addComponent(UIOpacity),sequence=tween(opacity);
    parts.forEach((part,i)=>{sequence.call(()=>{label.string=tr(part);opacity.opacity=255;}).delay(1.1);});
    sequence.to(.2,{opacity:0}).call(()=>n.destroy()).start();
  }
  private popup(value:string,pos:Vec3,fill:string,impact:'normal'|'strong'|'resist'='normal'){
    if(/^−\d+$/.test(value)){
      const n=this.makeNode(this.fx,'app-damage',Math.max(-126,Math.min(126,pos.x)),pos.y+52,144,60);
      const label=this.text(n,value,0,0,impact==='strong'?42:34,fill,140,58);label.isBold=true;
      const outline=label.node.addComponent(LabelOutline);outline.color=color('#fffdf0');outline.width=3;
      const opacity=n.addComponent(UIOpacity);n.setScale(.65,.65,1);
      tween(n).to(.12,{scale:new Vec3(1.12,1.12,1)},{easing:'backOut'}).to(.12,{scale:Vec3.ONE})
        .by(.4,{position:new Vec3(0,23,0)},{easing:'quadOut'}).start();
      tween(opacity).delay(.38).to(.26,{opacity:0}).call(()=>n.destroy()).start();return;
    }
    const n=this.panel(this.fx,pos.x,pos.y+48,impact==='normal'?154:176,impact==='strong'?48:42,C.paper,21,245);
    if(impact==='resist')this.actionIcon(n,'guard',-70,0,19,fill);
    this.text(n,value,impact==='resist'?9:0,0,impact==='strong'?30:22,fill,impact==='resist'?140:166,38);const opacity=n.addComponent(UIOpacity);
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
    this.audio.effect(n===this.playerNode?'hurt':'attack');
    const pos=n.position.clone(),sprite=n.getComponent(Sprite)!;Tween.stopAllByTarget(n);
    if(this.appBattle){const attacker=n===this.playerNode?this.enemyNode:this.playerNode,attackerId=attacker&&this.appActors.get(attacker)?.id;
      this.appPose(n,'hurt');this.appBattle.impact(this.appPoint(n),PETS[attackerId||(n===this.playerNode?this.state.enemy:this.state.active.id)].type,multiplier>1);this.appBattle.shake(multiplier>1);
      this.scheduleOnce(()=>{if(n.isValid)this.appPose(n,'idle');},.3);}
    sprite.color=color(guard?'#c4efff':'#ffc4b0');
    tween(sprite).to(.2,{color:color('#ffffff')}).start();
    tween(n).by(.065,{position:new Vec3(n===this.playerNode?-12:12,0,0),eulerAngles:new Vec3(0,0,n===this.playerNode?6:-6)})
      .to(.18,{position:pos,eulerAngles:Vec3.ZERO},{easing:'backOut'}).start();
    if(!this.appBattle)this.spark(pos,guard||multiplier<1?'#62ccfa':'#ffd35a',!guard&&multiplier>1||this.state.doubled);
    this.popup('−'+damage,this.appBattle?this.appPoint(n):pos,guard||multiplier<1?'#256cc1':multiplier>1?'#d63737':'#202020',guard||damage===0?'normal':multiplier>1?'strong':multiplier<1?'resist':'normal');
  }
  private strike(n:Node,target:Node,hit:()=>void){
    if(this.appBattle){this.appStrike(n,target,hit);return;}
    Tween.stopAllByTarget(n);const pos=n.position.clone(),base=n.scale.clone(),dx=target.position.x-pos.x,dy=target.position.y-pos.y;
    const approach=new Vec3(pos.x+dx*.58,pos.y+dy*.58,0);
    tween(n).to(.09,{scale:new Vec3(base.x*1.09,base.y*.9,1),position:new Vec3(pos.x-dx*.06,pos.y-5,0)})
      .to(.13,{position:approach,scale:new Vec3(base.x*.96,base.y*1.04,1),eulerAngles:new Vec3(0,0,dx>0?-9:9)},{easing:'quadIn'})
      .call(hit).delay(.045).to(.18,{position:pos,scale:base,eulerAngles:Vec3.ZERO},{easing:'quadOut'}).start();
  }
  private appStrike(n:Node,target:Node,hit:()=>void){
    const effect=this.appBattle!;Tween.stopAllByTarget(n);
    const pos=n.position.clone(),scale=n.scale.clone(),type=PETS[this.appActors.get(n)?.id||(n===this.playerNode?this.state.active.id:this.state.enemy)].type;
    const direction=target.position.x>pos.x?1:-1,close=type==='火';
    this.appPose(n,'charge');
    tween(n).to(.16,{scale:new Vec3(scale.x*1.05,scale.y*.94,1),position:new Vec3(pos.x-direction*8,pos.y-3,0)},{easing:'quadOut'})
      .call(()=>{
        if(!n.isValid)return;this.appPose(n,'attack');
        if(close){
          const contact=new Vec3(pos.x+(target.position.x-pos.x)*.68,pos.y+(target.position.y-pos.y)*.68+18,0);
          const perspective=n===this.playerNode ? .68 : 1.12;
          tween(n).to(.22,{position:contact,scale:new Vec3(scale.x*perspective,scale.y*perspective,1)},{easing:'quadIn'})
            .call(hit).delay(.08).to(.26,{position:pos,scale},{easing:'quadOut'})
            .call(()=>{if(n.isValid){this.appPose(n,'idle');this.breathe(n);}}).start();
        }else{
          tween(n).to(.11,{position:new Vec3(pos.x+direction*7,pos.y+4,0),scale:new Vec3(scale.x*.97,scale.y*1.04,1)}).start();
          effect.projectile(this.appPoint(n),this.appPoint(target),type,hit);
          this.scheduleOnce(()=>{if(n.isValid){tween(n).to(.16,{position:pos,scale}).call(()=>{this.appPose(n,'idle');this.breathe(n);}).start();}},.4);
        }
      }).start();
  }
  private shield(n:Node){
    const pos=n.position.clone(),shield=this.makeNode(this.fx,'shield',pos.x+30,pos.y,100,120),g=shield.addComponent(Graphics);
    g.fillColor=color('#67cfff',100);g.strokeColor=color('#e3faff');g.lineWidth=5;
    g.moveTo(0,55);g.lineTo(40,35);g.lineTo(32,-25);g.lineTo(0,-53);g.lineTo(-32,-25);g.lineTo(-40,35);g.close();g.fill();g.stroke();
    shield.setScale(.5,.5,1);tween(shield).to(.16,{scale:new Vec3(1,1,1)},{easing:'backOut'}).start();
    const opacity=shield.addComponent(UIOpacity);tween(opacity).delay(.5).to(.2,{opacity:0}).call(()=>shield.destroy()).start();
  }
  private itemEffect(n:Node,heal:boolean){
    this.audio.effect(heal?'heal':'boost');
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
    if(this.state.goldDie&&this.state.phase==='battle')this.spark(new Vec3(105,-this.h/2+98,0),'#ffdc55',true);
    if(this.state.lastRelay&&this.state.phase==='battle')this.popup(petName(this.state.active)+'接替出战',new Vec3(0,35,0),C.blue);
    if(this.state.skill?.event&&this.state.phase==='battle')this.skillPopup(this.state.skill.event);
    if(this.state.phase==='battle'&&this.diceNode){const n=this.diceNode,base=n.scale.clone();
      tween(n).to(.07,{eulerAngles:new Vec3(0,0,20),scale:new Vec3(base.x*1.13,base.y*1.13,1)})
        .to(.07,{eulerAngles:new Vec3(0,0,-15)}).to(.1,{eulerAngles:Vec3.ZERO,scale:base}).start();
      this.scheduleOnce(()=>{this.busy=false;},.25);
    }else this.busy=false;
  }
  private async command(a:Action){
    if(this.sampleOriginal&&a==='reroll'){this.sampleEnemy++;this.state.enemy=(['bud','otter','fox'] as PetId[])[this.sampleEnemy%3];this.state.enemyHP=this.state.enemyMax=32;this.render();return;}
    if(this.busy)return;
    const old=this.state;
    let next=act(old,a);if(next===old)return;
    if(!this.sampleOriginal&&old.phase==='battle'&&next.phase!=='battle'){
      const result=settleCookingBattle(old.pcCooking||newCooking(),{id:'main:'+old.revision+':'+old.mapId+':'+old.step+':'+old.seed,completed:true,won:next.enemyHP<=0,mapId:old.mapId||0,rank:rankForStage(old.step)});
      if(result.changed)next={...next,pcCooking:result.state};
    }
    // Commit the entire action before animation; a killed process resumes after this action, never halfway through it.
    this.busy=true;this.state=next;await this.save();
    if(this.modal){this.modal.removeFromParent();this.modal.destroy();this.modal=null;}
    if(a==='eggSearch'){
      this.busy=true;const companion=this.playerNode;if(companion){Tween.stopAllByTarget(companion);tween(companion).by(.12,{position:new Vec3(30,14,0)}).by(.13,{position:new Vec3(8,-9,0)}).by(.12,{position:new Vec3(-7,7,0)}).start();}
      this.popup('沙沙…',new Vec3(0,115,0),'#594522');
      this.scheduleOnce(()=>{this.render();const n=this.enemyNode;if(n){Tween.stopAllByTarget(n);n.setScale(.15,.15,1);tween(n).to(.32,{scale:new Vec3(1.1,1.1,1)},{easing:'backOut'}).to(.16,{scale:Vec3.ONE}).call(()=>this.breathe(n)).start();const e=next.eggHunt!.candidates[next.eggHunt!.selected];this.spark(n.position,this.eggTint(e),e.rarity!=='normal');if(e.rarity!=='normal')this.popup(e.rarity+' !',new Vec3(0,n.position.y+100,0),this.eggTint(e));}this.scheduleOnce(()=>{this.busy=false;},.55);},.48);return;
    }
    const animate=['attack','guard','challenge','heal','boost','invite'].includes(a);
    if(!animate){this.busy=false;this.render();if(a==='eggTake'&&next.eggHunt?.bonusEggId)this.popup('寻蛋好手 · 额外 +1',new Vec3(0,25,0),'#bc8134');return;}
    this.busy=true;
    if(a==='challenge'){this.settle();return;}
    if(a==='invite'&&this.enemyNode){this.itemEffect(this.enemyNode,false);this.popup('成为伙伴！',this.enemyNode.position,C.green);this.scheduleOnce(()=>this.settle(),.7);return;}
    if(!this.playerNode||!this.enemyNode){this.settle();return;}
    const player=this.playerNode,enemy=this.enemyNode,combat=next.lastRelay?.combat||next.skill;
    if(a==='heal'||a==='boost'){
      this.itemEffect(player,a==='heal');
      if(a==='heal'){this.lifeTo('player',next.hpRatio,maxHP(next));this.popup('恢复 +'+(hp(next)-hp(old)),player.position,'#218461');}
      else this.popup('攻击 ×'+old.boostMultiplier,player.position,'#b97618');
      this.scheduleOnce(()=>{this.render();if(next.skill?.event)this.skillPopup(next.skill.event);this.busy=false;},.68);return;
    }
    const retaliation=()=>{this.strike(enemy,player,()=>{
      const damage=combat?.lastTaken??(a==='guard'?guardDamage(enemyAttackAmount(old)):enemyAttackAmount(old));
      this.hurt(player,damage,a==='guard',matchupMultiplier(old.enemy,old.active.id));this.lifeTo('player',next.lastRelay?0:next.hpRatio,maxHP(old));
    });};
    if(a==='attack'){
      this.strike(player,enemy,()=>{this.hurt(enemy,combat?.lastDamage??attackAmount(old),false,matchupMultiplier(old.active.id,old.enemy));this.lifeTo('enemy',next.enemyHP/old.enemyMax,old.enemyMax);
        const afterAttack=combat?.attackHPRatio??old.hpRatio;if(afterAttack!==old.hpRatio)this.lifeTo('player',afterAttack,maxHP(old));
        if(combat?.usedCodes?.includes('opening')&&!old.skill?.usedCodes?.includes('opening'))this.skillPopup('抢先一击 +2');});
      if(next.enemyHP>0){this.scheduleOnce(retaliation,this.appBattle ? .74 : .48);this.scheduleOnce(()=>this.settle(),this.appBattle?1.6:1.04);}
      else this.scheduleOnce(()=>this.settle(),this.appBattle ? .9 : .76);
    }else{this.shield(player);if(combat?.lastDamage)this.lifeTo('enemy',next.enemyHP/old.enemyMax,old.enemyMax);if(next.enemyHP>0)this.scheduleOnce(retaliation,.12);this.scheduleOnce(()=>this.settle(),this.appBattle ? .98 : .74);}
  }
  private overlay(title:string,h=350){
    this.hatchClock=[];
    if(this.modal){this.modal.destroy();this.modal=null;}
    const layer=this.panel(this.root,0,0,390,this.h,'#183852',0,170);this.modal=layer;
    layer.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;});
    const card=this.panel(layer,0,0,356,h,C.paper,24);card.name='dialog-surface';this.text(card,title,0,h/2-36,21).isBold=true;this.enterUI(card,'dialog:'+title);
    return card;
  }
  private fullPage(title:string,subtitle:string,draw:()=>void,back:()=>void=()=>this.exitUtility()){
    if(this.screen==='home'||this.screen==='adventure'||this.screen==='partners'||this.screen==='game')this.utilityOrigin=this.screen;
    this.screen='utility';this.utilityDraw=draw;this.clear();this.layout();this.hatchClock=[];this.breedClock=null;
    this.panel(this.root,0,0,390,this.h,'#edf4f5',0);this.sectionHeader(title,subtitle,back);
    const c=this.makeNode(this.root,'page-content',0,-44,390,this.h-88);
    this.fx=this.makeNode(this.root,'page-effects',0,0,390,this.h);this.enterUI(c,'utility:'+title);return c;
  }
  private exitUtility(){this.screen=this.utilityOrigin;this.utilityDraw=null;this.render();}
  private pageBounds(c:Node){const h=c.getComponent(UITransform)!.height;return {top:h/2,bottom:-h/2,height:h};}
  private pageHelp(text:string){const c=this.overlay('玩法说明',330);this.text(c,text,0,10,16,C.muted,310,190);this.button(c,'help-close','知道了',0,-119,310,44,()=>this.render(),'#519b81');}
  private helpButton(c:Node,text:string){this.button(this.root,'page-help','?',163,this.h/2-42,36,36,()=>this.pageHelp(text),'#c94a49',true,19);}
  /** Build only the current page on web; the native pager owns a three-page window. */
  private listPages<T>(c:Node,items:T[],size:number,page:number,draw:(item:T,index:number)=>void){
    const build=(p:number)=>{const before=new Set(c.children);items.slice(p*size,(p+1)*size).forEach((item,i)=>draw(item,p*size+i));return c.children.filter(n=>!before.has(n));};
    this.pageFactories.set(c,build);build(page);
  }
  private pagePager(c:Node,y:number,page:number,pages:number,change:(page:number,redraw?:boolean)=>void,prefix:string){
    const label=this.text(c,(page+1)+' / '+pages,0,y,15,C.ink,100,32);
    if(pages<=1)return;
    if(!this.nativeApp){
      this.button(c,prefix+'-prev','‹',-88,y,64,46,()=>change(page-1,true),C.paper,page>0,26);
      this.button(c,prefix+'-next','›',88,y,64,46,()=>change(page+1,true),C.paper,page<pages-1,26);return;
    }
    const items=c.children.filter(n=>(n as any).listPage!==undefined),build=this.pageFactories.get(c);if(!items.length||!build)return;
    const upper=Math.max(...items.map(n=>n.position.y+n.getComponent(UITransform)!.height/2))+6;
    const lower=Math.min(...items.map(n=>n.position.y-n.getComponent(UITransform)!.height/2))-6,cy=(upper+lower)/2,h=upper-lower;
    const viewport=this.makeNode(c,prefix+'-swipe',0,cy,390,h);viewport.active=false;viewport.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    const content=this.makeNode(viewport,'pages',-195,0,390*pages,h);content.getComponent(UITransform)!.setAnchorPoint(0,.5);
    const layout=content.addComponent(Layout);layout.type=Layout.Type.HORIZONTAL;layout.resizeMode=Layout.ResizeMode.CONTAINER;
    const sheets=Array.from({length:pages},(_,i)=>this.makeNode(content,'page-'+i,0,0,390,h));
    const pv=viewport.addComponent(PageView);pv.content=content;pv.direction=PageView.Direction.HORIZONTAL;
    pv.scrollThreshold=.08;pv.autoPageTurningThreshold=100;pv.elastic=false;pv.inertia=false;
    pv.pageTurningSpeed=.22;pv.pageTurningEventTiming=1;pv.cancelInnerEvents=true;
    // Native Graphics must remain active while moving between parents.
    viewport.active=true;
    const records=new Map<Node,{id:string,value:{x:number,y:number,w:number,h:number}}[]>();
    const mount=(index:number,nodes:Node[])=>{for(const item of nodes){
      const entries:{id:string,value:{x:number,y:number,w:number,h:number}}[]=[];
      const collect=(n:Node)=>{if(this.controls[n.name]){entries.push({id:n.name,value:this.controls[n.name]});delete this.controls[n.name];}n.children.forEach(collect);};collect(item);records.set(item,entries);
      const pos=item.position.clone();item.setParent(sheets[index]);item.setPosition(pos.x,pos.y-cy);
    }};
    mount(page,items);
    const window=()=>{
      for(let i=0;i<pages;i++){
        const sheet=sheets[i],near=Math.abs(i-page)<=1;
        if(near&&!sheet.children.length)mount(i,build(i));
        if(!near)for(const n of [...sheet.children]){for(const r of records.get(n)||[])delete this.controls[r.id];records.delete(n);n.destroy();n.removeFromParent();}
      }
      // Neighbor images are resident before dragging; no visibility scans or loads per frame.
      for(const [node,entries] of records)for(const r of entries){if(node.parent===sheets[page])this.controls[r.id]=r.value;else delete this.controls[r.id];}
    };
    window();layout.updateLayout();pv.scrollToPage(page,0);
    let vertical=false;
    const owns=(e:EventTouch)=>{for(let n=e.target as Node|null;n;n=n.parent)if(n===viewport)return true;return false;};
    // The parent capture phase must lock the axis BEFORE PageView cancels child touches.
    c.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{if(owns(e)){vertical=false;this.pageSwipeActive=false;}},this,true);
    c.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{if(!owns(e))return;const a=e.getUILocation(),b=e.touch!.getUIStartLocation(),dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
      if(!vertical&&!this.pageSwipeActive&&Math.max(dx,dy)>7){if(dy>dx){vertical=true;pv.enabled=false;}else{this.pageSwipeActive=true;this.cancelPartyDrag();}}},this,true);
    const finish=(e:EventTouch)=>{if(owns(e)&&vertical)this.scheduleOnce(()=>{if(viewport.isValid)pv.enabled=true;this.pageSwipeActive=false;},0);};
    c.on(Node.EventType.TOUCH_END,finish,this,true);c.on(Node.EventType.TOUCH_CANCEL,finish,this,true);
    viewport.on(PageView.EventType.SCROLL_ENDED,()=>{
      const next=pv.getCurrentPageIndex();this.pageSwipeActive=false;this.pressPending=false;if(next===page)return;
      page=next;label.string=(page+1)+' / '+pages;change(page,false);
      // Build the next neighbor only after snapping has completed, keeping the live page intact.
      window();
    });
  }
  private regionTabs(parent:Node,y:number,options:{id:number;label:string;tint:string}[],selected:number,page:number,onPage:(n:number,redraw?:boolean)=>void,onSelect:(id:number)=>void,prefix:string){
    const columns=options.length>12?5:6,rows=Math.ceil(options.length/columns),step=columns===5?71:60;
    const strip=this.makeNode(parent,prefix+'-tabs',0,y-(rows-1)*30,354,rows*60-8);
    options.forEach((option,i)=>{
      const row=Math.floor(i/columns),count=Math.min(columns,options.length-row*columns);
      this.button(strip,prefix+'-'+(option.id<0?'all':option.id),option.label,(i%columns-(count-1)/2)*step,(rows-1)*30-row*60,columns===5?64:54,52,()=>onSelect(option.id),selected===option.id?option.tint:'#dbe9ef',true,18);
    });
  }
  private listItem(n:Node,index:number,size:number){
    (n as any).listPage=Math.floor(index/size);
    // Static card outlines; retain press/drag feedback without dozens of perpetual opacity tweens.
    const glow=n.getChildByName('available-glow'),opacity=glow?.getComponent(UIOpacity);if(opacity){Tween.stopAllByTarget(opacity);opacity.opacity=45;this.availableGlows=this.availableGlows.filter(v=>v!==glow);}
    return n;
  }
  private confirmGuard(s=this.state,command:(a:Action)=>void=a=>void this.command(a)){const c=this.overlay('放弃这次攻击强化？',245);
    this.text(c,'防御会放弃已使用的 ×'+s.boostMultiplier+' 强化',0,34,14,C.muted,320);
    this.button(c,'cancel','返回',-82,-49,145,52,()=>this.render(),'#e8f3fa');
    this.button(c,'confirmGuard','仍然防御',82,-49,145,52,()=>command('guard'),C.blue);
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
  private restart(){this.state=retreatExpedition(this.state);this.save();this.mapIndex=latestUnlockedMap(this.state);this.mapTabPage=Math.floor(this.mapIndex/6);this.screen='adventure';this.render();}

  private hatchTime(ms:number){if(!Number.isFinite(ms))return '等待联网';if(ms<=0)return '可以破壳啦！';const sec=Math.ceil(ms/1000);return Math.floor(sec/60).toString().padStart(2,'0')+':'+(sec%60).toString().padStart(2,'0');}
  private hatchery(){
    if(this.state.pendingHatch){this.hatchReveal();return;}
    const c=this.fullPage('孵化屋','离线成长',()=>this.hatchery()),s=this.state,{top,bottom,height}=this.pageBounds(c);
    this.helpButton(c,'新放入的蛋孵化 '+(BUILD_TEST_MODE?hatchDuration(s)/1000+' 秒':RARITIES.map(r=>rarityName(r)+' '+hatchDuration(s,r)/60000).join(' / ')+' 分钟')+'，离线继续。\nSR 蛋至少孵出 SR；SSR 蛋必出 SSR。');
    const cardH=height-174,cardY=top-24-cardH/2;
    for(let index=0;index<2;index++){
      const x=index===0?-91:91,slot=s.incubators?.[index],egg=slot?s.eggs!.find(e=>e.id===slot.eggId):null;
      const p=egg&&slot?this.panel(c,x,cardY,172,cardH,'#ffffff',18):this.button(c,'hatch-slot-'+index,'',x,cardY,172,cardH,()=>this.eggPicker(index),'#ffffff');
      this.text(p,'0'+(index+1),0,cardH/2-25,14,C.muted,150,24);
      if(egg&&slot){const ready=hatchRemaining(slot)===0;const art=this.eggArt(p,egg,0,48,Math.min(190,cardH-202));this.breathe(art);
        this.text(p,this.eggName(egg),0,-cardH/2+126,16,this.eggTint(egg),158,26).isBold=true;
        const label=this.text(p,this.hatchTime(hatchRemaining(slot)),0,-cardH/2+89,23,ready?'#2b9b66':C.ink,160,32);this.hatchClock.push({label,index,ready});
        this.button(p,'hatch-slot-'+index,ready?'破壳！':'孵化中…',0,-cardH/2+39,150,46,()=>{
          if(!this.requireTime())return;const next=claimHatch(this.state,index);if(next!==this.state&&next.pendingHatch)this.audio.effect('hatch');this.state=next;this.save();this.hatchery();
        },'#dba441',ready,17);
      }else{
        this.text(p,'+',0,16,76,'#7da99a',140,100);
        this.text(p,'放入宠物蛋',0,-48,16,C.muted,154,30);
      }
    }
    const foot=this.panel(c,0,bottom+65,390,130,'#fffdf5',22);this.text(foot,'待孵化  '+availableEggs(s).length,0,31,16,C.muted,350,28);
    this.button(foot,'hatch-bag','蛋袋  ›',0,-19,350,48,()=>this.eggBag(),'#519b81',true,20);this.controls['hatch-close']=this.controls['nav-home'];
  }
  private eggPicker(slot:number,page=0){
    this.eggShelf(slot,page);
  }
  private hatchReveal(){
    const r=this.state.pendingHatch;if(!r){this.hatchery();return;}const p=petEntry(this.state,r.uid!),tint=r.rarity==='SSR'?'#b78022':r.rarity==='SR'?'#8b61bb':'#46976e';
    const ack=()=>{this.state=acknowledgeHatch(this.state);this.save();this.hatchery();},c=this.fullPage(p.shiny?'闪光伙伴':'新伙伴',rarityName(p.rarity),()=>this.hatchReveal(),ack),{top,bottom,height}=this.pageBounds(c),cardH=height-234;
    this.panel(c,0,top-24-cardH/2,354,cardH,r.rarity==='SSR'?'#fff0ca':r.rarity==='SR'?'#f0e8fb':'#e6f3e8',22);
    const art=this.petImage(c,p,0,top-24-cardH/2,Math.min(252,cardH-40));art.setScale(.5,.5,1);tween(art).to(.3,{scale:Vec3.ONE},{easing:'backOut'}).start();
    const recipe=SECRET_RECIPES.find(v=>v.id===p.ornament);
    if(recipe)this.text(c,recipe.name,0,top-42,17,'#7a6498',300,28).isBold=true;
    if(r.bonusEggId){const egg=this.state.eggs!.find(e=>e.id===r.bonusEggId);if(egg){const bonus=this.panel(c,110,top-cardH+28,108,84,'#fff5cc',16);bonus.name='nested-egg';this.eggArt(bonus,egg,-23,5,52);this.text(bonus,'+1',28,7,25,'#aa772a',45,32);this.text(bonus,'蛋中蛋',0,-27,12,'#aa772a',100,20);const opacity=bonus.addComponent(UIOpacity);opacity.opacity=0;tween(opacity).delay(.65).to(.3,{opacity:255}).start();}}
    const foot=this.panel(c,0,bottom+100,390,200,'#fffdf5',22);
    this.text(foot,(p.shiny?'★ ':'')+petName(p)+' '+sexSymbol(p.sex),-24,73,24,tint,294,36).isBold=true;
    this.text(foot,'HP '+petBaseHP(p)+'    ⚔ '+petAttackFaces(p).join(' / '),0,35,16,C.ink,350,28);
    this.button(foot,'hatch-skills',tr('技能')+' ×'+petSkills(p).length+' ›',0,-5,350,38,()=>this.scrollSkillDetails(petName(p),petSkills(p),()=>this.hatchReveal()),'#e4eef1',true,17);
    const join=hatchPartySlot(this.state)>=0;
    this.button(foot,'hatch-ack','收下伙伴',join?-89:0,-61,join?172:350,48,ack,join?'#e4eef1':'#dba441',true,join?17:20);
    if(join)this.button(foot,'hatch-join','加入队伍',89,-61,172,48,()=>{this.state=welcomeHatchToParty(this.state);this.save();this.collection(0);},'#519b81',true,17);
  }
  private qualityDetail(key:string,rarity:EggRarity,page:number){
    const p=petEntry(this.state,key);this.scrollSkillDetails(petName(p)+' '+sexSymbol(p.sex),petSkills(p),()=>{this.partnerPage=page;this.screen='partners';this.render();});
  }
  private wrapConnectedScript(label:Label){
    // Creator's character wrapping can split Indic vowel signs and Arabic joins.
    // Measure whole words with the same TTF canvas, then supply explicit line breaks.
    if(!/[\u0600-\u06ff\u0900-\u0d7f]/.test(label.string))return;
    const source=label.string,width=label.node.getComponent(UITransform)!.width;
    label.enableWrapText=false;label.updateRenderData(true);
    const context=label.assemblerData?.context,style=(label as any).textStyle,layout=(label as any).textLayoutData;
    if(!context||!style?.fontDesc||!layout?.canvasSize?.width){label.enableWrapText=true;label.updateRenderData(true);return;}
    const scale=layout.canvasSize.width/width,limit=width-10;
    context.save();context.font=style.fontDesc;
    const measure=(value:string)=>{const m=context.measureText(value);return Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0))/scale;};
    const lines:string[]=[];
    for(const paragraph of source.split('\n')){
      let line='';
      for(const word of paragraph.trim().split(/\s+/)){
        const next=line?line+' '+word:word;
        if(line&&measure(next)>limit){lines.push(line);line=word;}else line=next;
      }
      lines.push(line);
    }
    context.restore();label.string=lines.join('\n');label.updateRenderData(true);
  }
  private scrollSkillDetails(subject:string,codes:ReturnType<typeof petSkills>,back:()=>void,pool=false){
    const c=this.fullPage(pool?'遗传技能池':'技能',subject,()=>this.scrollSkillDetails(subject,codes,back,pool),back),{top,bottom,height}=this.pageBounds(c);
    const viewportH=height-116,viewport=this.makeNode(c,'skill-scroll',0,top-14-viewportH/2,354,viewportH);
    viewport.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    const content=this.makeNode(viewport,'skill-content',0,viewportH/2,354,viewportH);content.getComponent(UITransform)!.setAnchorPoint(.5,1);
    let offset=0;
    codes.forEach((code,i)=>{const card=this.makeNode(content,'skill-row-'+code,0,0,338,1);
      const title=this.text(card,SKILLS[code][0],0,0,19,'#366b5d',310,30);title.isBold=true;title.enableWrapText=true;title.overflow=Label.Overflow.RESIZE_HEIGHT;title.updateRenderData(true);
      const description=this.text(card,SKILLS[code][1],0,0,18,'#395568',310,30);description.enableWrapText=true;description.overflow=Label.Overflow.RESIZE_HEIGHT;description.updateRenderData(true);
      this.wrapConnectedScript(title);this.wrapConnectedScript(description);
      const titleH=title.node.getComponent(UITransform)!.height,descriptionH=description.node.getComponent(UITransform)!.height,h=titleH+descriptionH+42;
      card.getComponent(UITransform)!.setContentSize(338,h);card.setPosition(0,-offset-h/2,0);
      this.panel(card,0,0,338,h,i%2?'#f7f3e8':'#ffffff',16).setSiblingIndex(0);
      title.node.setPosition(0,h/2-14-titleH/2,0);description.node.setPosition(0,-h/2+14+descriptionH/2,0);
      card.on(Node.EventType.TOUCH_START,()=>{});offset+=h+12;
    });
    content.getComponent(UITransform)!.setContentSize(354,Math.max(viewportH,offset));
    const scroll=viewport.addComponent(ScrollView);scroll.content=content;scroll.horizontal=false;scroll.vertical=true;scroll.elastic=false;scroll.inertia=true;scroll.brake=.8;scroll.cancelInnerEvents=true;
    const foot=this.panel(c,0,bottom+43,390,86,'#fffdf5',20);
    this.button(foot,'quality-back','返回',0,0,350,52,back,'#519b81',true,19);
  }

  private breedingUI(){
    const s=this.state,b=s.breeding,c=this.fullPage('交配屋',b?'交配中':'选择一雌一雄',()=>this.breedingUI()),{top,bottom,height}=this.pageBounds(c);
    this.helpButton(c,'异品质合成保留较高品质及形态。\n同品质形态、HP、攻击各有50%随父或母。\n技能从父母技能池随机继承，最多 6 个。\n交配需 '+(BUILD_TEST_MODE?'3 秒':'30 分钟')+'，离线继续。\n领取蛋后父母消失，蛋需再孵化。');
    if(!b){if(this.breedMother===s.active.uid||!s.pets!.some(p=>p.uid===this.breedMother))this.breedMother='';if(this.breedFather===s.active.uid||!s.pets!.some(p=>p.uid===this.breedFather))this.breedFather='';}
    const mother=b?.mother||this.breedMother,father=b?.father||this.breedFather;
    this.breedClock=null;
    const cardH=height-258,cardY=top-28-cardH/2;
    ([['female',mother,-91],['male',father,91]] as [Sex,string,number][]).forEach(([sex,key,x])=>{
      const p=s.pets!.find(p=>p.uid===key),card=this.button(c,'breed-'+sex,'',x,cardY,172,cardH,()=>this.breedingPicker(sex),sex==='female'?'#f7e6ec':'#e4eff8',!b,16,sex==='female'?'#f7e6ec':'#e4eff8');
      this.text(card,sex==='female'?'♀':'♂',0,cardH/2-30,28,sex==='female'?'#b46a8b':'#5086ac',150,36).isBold=true;
      if(p){this.petImage(card,p,0,8,Math.min(158,cardH-150));this.text(card,petName(p),0,-cardH/2+64,18,C.ink,158,30);this.text(card,rarityName(p.rarity),58,cardH/2-30,13,C.muted,42,26);
        this.button(card,'breed-skills-'+sex,tr('技能')+' ×'+petSkills(p).length+' ›',0,-cardH/2+28,146,34,()=>this.scrollSkillDetails(petName(p),petSkills(p),()=>this.breedingUI()),sex==='female'?'#ead3df':'#d4e5f1',true,15);}
      else{this.text(card,'+',0,8,54,'#93a7b4',150,75);this.text(card,'选择伙伴',0,-cardH/2+44,16,C.muted,158,30);}
    });
    this.text(c,'♥',0,cardY,22,'#d8809c',30,34);
    const foot=this.panel(c,0,bottom+105,390,210,'#fffdf5',22);
    this.text(foot,'领取蛋后，父母消失',0,80,15,'#b45f62',350,28).isBold=true;
    const parents=[mother,father].map(key=>s.pets!.find(p=>p.uid===key)),pool=parents.every(Boolean)?Array.from(new Set(parents.reduce((codes,p)=>codes.concat(petSkills(p!)),[] as ReturnType<typeof petSkills>))):[];
    if(pool.length)this.button(foot,'breed-skill-pool','遗传技能池',62,43,224,34,()=>this.scrollSkillDetails(tr('技能')+' ×'+pool.length,pool,()=>this.breedingUI(),true),'#eadfee',true,16);
    if(b){const now=gameNow(),left=Number.isFinite(now)?Math.max(0,b.readyAt-now):Infinity,locked=s.phase==='battle'||!!s.pendingHatch,clock=this.text(foot,left?this.hatchTime(left):'可以领蛋',pool.length?-122:0,43,23,'#a66f91',pool.length?92:350,36);this.breedClock=left?clock:null;
      this.button(foot,'breed-claim',s.phase==='battle'?'战斗中':s.pendingHatch?'先领取新伙伴':left?'交配中…':'领取宠物蛋',0,-9,350,48,
        ()=>this.confirmBreedingClaim(b.id),'#b57b9b',!left&&!locked,19);
    }else{this.text(foot,this.hatchTime(BREED_DURATION),pool.length?-122:0,43,23,'#a66f91',pool.length?92:350,36);
      this.button(foot,'breed-start','开始交配',0,-9,350,48,()=>{if(!this.requireTime())return;const next=startBreeding(this.state,this.breedMother,this.breedFather);if(next!==this.state){this.state=next;this.save();this.breedingUI();}},'#b57b9b',!!mother&&!!father,20);
    }
    this.button(foot,'breed-recipes','秘密配方',-91,-67,168,38,()=>this.recipeBook(),'#eadfee',true,16);
    this.button(foot,'breed-hatch','孵化屋 ›',91,-67,168,38,()=>this.hatchery(),'#dbe9ef',true,16);this.controls['breed-back']=this.controls['nav-home'];
  }
  private confirmBreedingClaim(id:string){
    if(!this.requireTime())return;
    const c=this.overlay('确认领取',250);
    this.text(c,'领取蛋后，父母消失',0,26,16,C.muted,315,56);
    this.button(c,'breed-claim-cancel','返回',-82,-56,145,48,()=>this.breedingUI(),'#e4eef1');
    this.button(c,'breed-claim-confirm','确认领取',82,-56,145,48,async()=>{
      if(this.state.breeding?.id!==id||!this.requireTime())return;
      const next=claimBreeding(this.state),egg=next.eggs?.find(item=>item.id===id);
      if(next===this.state||!egg)return;
      if(!await this.commitCampaign(next)){this.breedingUI();this.pageHelp('保存失败');return;}
      this.breedMother='';this.breedFather='';this.partnerSelected=null;this.screen='home';this.render();
      this.breedingEggResult(egg);
    },'#b57b9b');
  }
  private recipeBook(page=0){
    const known=this.state.surprises?.recipes||[],c=this.fullPage('秘密配方',known.length+' / '+SECRET_RECIPES.length,()=>this.recipeBook(page),()=>this.breedingUI()),{top,bottom,height}=this.pageBounds(c),h=Math.min(154,(height-96)/3-12);
    this.listPages(c,SECRET_RECIPES,3,page,(r,index)=>{const i=index%3,found=known.includes(r.id),y=top-24-h/2-i*(h+12),card=this.panel(c,0,y,354,h,found?'#fff8e7':'#ffffff',16);card.name='recipe-'+r.id;this.listItem(card,index,3);
      // Give passive cards a touch target so PageView can capture a swipe over them.
      card.on(Node.EventType.TOUCH_START,()=>{});
      this.typeIcon(card,r.types[0],-119,9,36);this.text(card,'+',-81,9,24,C.muted,30,32);this.typeIcon(card,r.types[1],-43,9,36);
      this.text(card,found?r.name:'?',72,15,22,found?'#927348':C.muted,178,40).isBold=true;
      this.text(card,found?'已发现':'合成探索',72,-22,13,C.muted,178,24);
    });
    this.pagePager(c,bottom+25,page,Math.ceil(SECRET_RECIPES.length/3),(p,redraw)=>{page=p;if(redraw)this.recipeBook(p);},'recipes');
  }
  private breedingEggResult(egg:Egg){
    const c=this.overlay('获得宠物蛋',340);
    const recipe=SECRET_RECIPES.find(r=>r.id===egg.genes?.ornament),resonance=egg.genes?.skills.some(c=>c.startsWith('res_'));
    if(recipe||resonance)this.text(c,[recipe?.name,resonance?'技能共鸣':''].filter(Boolean).join(' · '),0,103,14,'#9470a6',310,25).isBold=true;
    this.eggArt(c,egg,0,27,112);
    this.text(c,this.eggName(egg)+'蛋',0,-48,22,this.eggTint(egg),310,34).isBold=true;
    this.text(c,petName({id:egg.affinity,rarity:egg.rarity})+' · 已放入蛋袋',0,-80,13,C.muted,300,22);
    this.button(c,'breed-egg-confirm','去孵化',0,-125,300,44,()=>this.hatchery(),'#519b81',true,18);
  }
  private breedingPicker(sex:Sex,page=0){
    const pets=this.state.pets!.filter(p=>p.sex===sex&&p.uid!==this.state.active.uid),pages=Math.max(1,Math.ceil(pets.length/4));page=Math.max(0,Math.min(page,pages-1));
    const c=this.fullPage(sex==='female'?'选择雌性 ♀':'选择雄性 ♂',pets.length+' 只',()=>this.breedingPicker(sex,page),()=>this.breedingUI()),{top,bottom,height}=this.pageBounds(c),rowH=Math.min(120,(height-130)/4);
    this.listPages(c,pets,4,page,(p,itemIndex)=>{const i=itemIndex%4;const y=top-24-rowH/2-i*(rowH+12),row=this.button(c,'breed-pick-'+p.uid,'',0,y,354,rowH,()=>{if(sex==='female')this.breedMother=p.uid!;else this.breedFather=p.uid!;this.breedingUI();},'#ffffff');
      this.listItem(row,itemIndex,4);this.petImage(row,p,-126,0,64);this.text(row,petName(p)+' '+sexSymbol(p.sex),-3,rowH/2-23,17,C.ink,160,27).isBold=true;
      this.text(row,rarityName(p.rarity),132,rowH/2-23,14,p.rarity==='SSR'?'#b78022':'#8b61bb',50,25);
      this.text(row,'HP '+petBaseHP(p)+' · ⚔ '+petAttackFaces(p,true).join('/'),36,5,13,C.muted,254,24);
      this.button(row,'breed-pick-skills-'+p.uid,tr('技能')+' ×'+petSkills(p).length+' ›',36,-rowH/2+23,254,32,()=>this.scrollSkillDetails(petName(p),petSkills(p),()=>this.breedingPicker(sex,page)),'#e4eef1',true,15);
    });
    if(!pets.length)this.text(c,'暂无可交配的'+(sex==='female'?'雌性':'雄性')+'伙伴',0,36,20,C.muted,330,60);
    this.pagePager(c,bottom+42,page,pages,(p,redraw)=>{page=p;if(redraw)this.breedingPicker(sex,p);},'breed-picker');this.controls['breed-picker-back']=this.controls['nav-home'];
  }
  private goHome(){if(this.sampleOriginal){this.state=this.sampleOriginal;this.sampleOriginal=null;this.screen='login';this.render();return;}this.state=retreatExpedition(this.state);this.screen='home';this.save();this.render();}
  private retreatButton(y:number){const n=this.button(this.root,'retreat','',162,y,44,44,()=>this.confirmRetreat(),C.paper);this.menuIcon(n,'retreat',0,0,29,'#286579');}
  private confirmRetreat(){
    if(!this.state.expedition||this.sampleOriginal){this.goHome();return;}
    const c=this.overlay('撤退？',292);
    this.menuIcon(c,'retreat',0,54,38,'#a5564a');
    this.text(c,'本次挑战将结束，关卡进度不保留。',0,0,17,C.ink,310,70);
    this.button(c,'retreat-cancel','继续挑战',-82,-91,145,54,()=>this.render(),'#e8f3fa',true,17);
    this.button(c,'retreat-confirm','撤退',82,-91,145,54,()=>this.goHome(),'#bd594e',true,18);
  }
  private fillArt(key:string){const n=this.image(this.root,key,0,0,390,this.h),os=this.artCache.size(key),k=Math.max(390/os.width,this.h/os.height);n.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);return n;}
  private sceneRegion(mapId:number){if(mapId>=12)return [3,1,5][mapId-12]??0;return mapId>=9&&mapId<=11?mapId-6:mapId>=6?mapId-3:mapId;}
  private battleRegionKey(mapId:number){if(mapId>=12&&mapId<15)return 'region-'+(mapId+1)+'-battle-v1';const map=this.sceneRegion(mapId);return map?'region-'+(map+1)+'-battle-v1':this.appPresentation?'app-coast-v1':'battle-arena';}
  private regionKey(kind:'battle'|'nest'){if(kind==='battle')return this.battleRegionKey(this.state.mapId||0);const map=this.sceneRegion(this.state.mapId||0);return map?'region-'+(map+1)+'-nest-v1':'egg-nest-v1';}
  private regionFrame(kind:'battle'|'nest'){return this.art[this.regionKey(kind)];}
  private async loadRegionArt(mapId:number){
    const map=this.sceneRegion(mapId);await this.artCache.load(this.battleRegionKey(mapId));
    if(this.appPresentation&&mapId===0){const keys:string[]=[];for(const id of APP_BATTLE_IDS)for(const side of ['back','front'] as const)for(const pose of APP_BATTLE_POSES)keys.push(appPoseKey(id,side,pose));await this.artCache.warm(keys);}
    if(map)await this.artCache.load('region-pad-'+map);
    if(this.nativeApp)await this.artCache.warm([
      map?'region-'+(map+1)+'-nest-v1':'egg-nest-v1',
      ...MAPS[mapId].pets.reduce((keys:string[],id)=>keys.concat(RARITIES.map(r=>(r==='normal'?id:id+'-'+r)+'-front')),[]),
      ...(this.state.pets||[]).filter(p=>homeParty(this.state).includes(p.uid!)).map(p=>(p.rarity==='normal'?p.id:formKey(p))+'-back')
    ]);
  }
  private async loadHomeArt(period:HomePeriod){await this.artCache.load(homeArtKey(period));}
  private async refreshHomeArt(){
    if(this.screen!=='home'||!this.homeBackground?.isValid)return;
    const period=homePeriod(),target=this.homeBackground;this.homePeriod=period;
    try{await this.loadHomeArt(period);if(this.screen!=='home'||target!==this.homeBackground||!target.isValid||homePeriod()!==period)return;
      const frame=this.art[homeArtKey(period)],sp=target.getComponent(Sprite)!;
      if(sp.spriteFrame!==frame){this.artCache.bind(target,homeArtKey(period));const os=this.artCache.size(homeArtKey(period)),k=Math.max(390/os.width,this.h/os.height);target.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);this.homeAtmosphere();}
    }catch{/* Keep the last valid scene; the next cosmetic clock check retries. */}
  }
  private homeAtmosphere(){
    if(this.homeAmbient?.isValid){for(const n of this.homeAmbient.children){Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);}this.homeAmbient.destroy();}
    if((globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const layer=this.makeNode(this.root,'home-ambient',0,0,390,this.h);layer.setSiblingIndex(1);this.homeAmbient=layer;
    const night=['evening','midnight','dawn'].includes(this.homePeriod),top=this.h/2-105,bottom=-this.h/2+210,span=Math.max(40,top-bottom);
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
  private menuIcon(parent:Node,kind:'map'|'dex'|'paw'|'gear'|'lock'|'home'|'retreat'|'energy'|'video'|'reward-video'|'breed',x:number,y:number,size:number,ink='#ffffff'){
    const n=this.makeNode(parent,kind,x,y,size,size),g=n.addComponent(Graphics);n.setScale(size/48,size/48,1);g.lineWidth=3;g.strokeColor=color(ink);g.fillColor=color(ink);
    if(kind==='map'){g.moveTo(-20,-16);g.lineTo(-20,17);g.lineTo(-7,12);g.lineTo(7,18);g.lineTo(20,13);g.lineTo(20,-19);g.lineTo(7,-14);g.lineTo(-7,-20);g.close();g.stroke();for(const dx of [-7,7]){g.moveTo(dx,-12);g.lineTo(dx,9);g.stroke();}g.fillColor=color('#ffe297');g.circle(8,4,6);g.fill();}
    if(kind==='dex'){g.roundRect(-19,-22,38,44,8);g.fill();g.fillColor=color('#f4fbff');g.roundRect(-14,-7,28,24,4);g.fill();g.fillColor=color('#df655b');g.circle(0,5,8);g.fill();g.strokeColor=color('#304d5a');g.moveTo(-8,5);g.lineTo(8,5);g.stroke();g.fillColor=color('#ffffff');g.circle(0,5,3);g.fill();g.fillColor=color('#304d5a');g.circle(-8,-15,2);g.circle(6,-15,2);g.fill();}
    if(kind==='paw'){g.moveTo(-16,-13);g.bezierCurveTo(-19,-5,-10,3,-5,5);g.bezierCurveTo(-2,8,2,8,5,5);g.bezierCurveTo(10,3,19,-5,16,-13);g.bezierCurveTo(12,-21,5,-15,0,-16);g.bezierCurveTo(-5,-15,-12,-21,-16,-13);g.close();g.fill();for(const [px,py,rx,ry] of [[-18,8,5,7],[-7,19,6,8],[7,19,6,8],[18,8,5,7]]){g.ellipse(px,py,rx,ry);g.fill();}}
    if(kind==='breed'){g.moveTo(0,-19);g.bezierCurveTo(-35,2,-17,29,0,14);g.bezierCurveTo(17,29,35,2,0,-19);g.close();g.fill();g.fillColor=color('#fff7ee');g.ellipse(0,-1,7,9);g.fill();g.fillColor=color(ink);g.circle(0,1,2.4);g.fill();}
    if(kind==='gear'){g.circle(0,0,13);g.stroke();g.circle(0,0,5);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(Math.cos(a)*14,Math.sin(a)*14);g.lineTo(Math.cos(a)*20,Math.sin(a)*20);g.stroke();}}
    if(kind==='lock'){g.roundRect(-12,-17,24,21,5);g.fill();g.arc(0,4,9,0,Math.PI,false);g.stroke();g.fillColor=color('#ffffff');g.circle(0,-5,2);g.fill();}
    if(kind==='home'){g.moveTo(-21,0);g.lineTo(0,19);g.lineTo(21,0);g.stroke();g.moveTo(-15,3);g.lineTo(-15,-19);g.lineTo(-5,-19);g.lineTo(-5,-5);g.lineTo(6,-5);g.lineTo(6,-19);g.lineTo(15,-19);g.lineTo(15,3);g.stroke();}
    if(kind==='retreat'){g.lineWidth=4;g.circle(8,17,5);g.fill();g.moveTo(7,9);g.lineTo(0,-2);g.lineTo(12,-8);g.lineTo(17,-19);g.moveTo(1,-2);g.lineTo(-6,-12);g.lineTo(-17,-12);g.moveTo(6,7);g.lineTo(15,2);g.lineTo(22,5);g.moveTo(4,7);g.lineTo(-6,4);g.stroke();g.moveTo(-6,17);g.lineTo(-21,17);g.moveTo(-14,23);g.lineTo(-21,17);g.lineTo(-14,11);g.stroke();}
    if(kind==='energy'){g.moveTo(5,23);g.lineTo(-17,-4);g.lineTo(-3,-4);g.lineTo(-7,-23);g.lineTo(18,7);g.lineTo(3,7);g.close();g.fill();}
    if(kind==='reward-video'){g.lineWidth=3;g.roundRect(-23,-16,40,32,4);g.stroke();for(const x of [-17,11])for(const y of [-10,0,10]){g.rect(x-1.5,y-2,3,4);g.fill();}this.text(n,'AD',-3,0,12,ink,24,20).isBold=true;g.roundRect(8,-21,18,13,2);g.stroke();g.moveTo(17,-21);g.lineTo(17,-8);g.moveTo(8,-14);g.lineTo(26,-14);g.stroke();g.moveTo(17,-8);g.bezierCurveTo(4,4,7,7,17,-8);g.bezierCurveTo(27,7,30,4,17,-8);g.stroke();}
    if(kind==='video'){g.roundRect(-22,-16,44,32,7);g.stroke();g.moveTo(-5,-9);g.lineTo(-5,9);g.lineTo(10,0);g.close();g.fill();}
    return n;
  }
  private sectionHeader(title:string,subtitle:string,back:()=>void=()=>this.goHome()){const top=this.h/2;
    const head=this.panel(this.root,0,top-44,390,88,'#c95750',0),edge=head.getComponent(Graphics)!;edge.strokeColor=color('#f5d7aa',190);edge.lineWidth=2;edge.moveTo(-195,-43);edge.lineTo(195,-43);edge.stroke();
    this.button(this.root,'nav-home','‹',-163,top-42,44,44,back,'#c94a49',true,30);
    this.text(this.root,title,0,top-(subtitle?32:43),23,'#ffffff',270,32).isBold=true;
    this.text(this.root,subtitle,0,top-61,12,'#ffe9d7',280,23);
  }
  private homeUI(){
    const s=this.state,H=this.h,b=-H/2,top=H/2,active=hasActivePet(s);this.homePeriod=homePeriod();
    this.homeBackground=this.fillArt(homeArtKey(this.homePeriod));this.homeAtmosphere();void this.refreshHomeArt();
    this.homeProfileUI(top);
    const setting=this.button(this.root,'home-settings','',161,top-39,44,44,()=>this.homeSettings(),'#fffdf1');this.menuIcon(setting,'gear',0,0,25,'#41717d');
    const petY=(top-100+b+220)/2,petSize=Math.max(112,Math.min(208,H-320));
    if(active){const shadow=this.makeNode(this.root,'camp-shadow',0,petY-petSize*.4,160,25),g=shadow.addComponent(Graphics);g.fillColor=color('#346951',55);g.ellipse(0,0,petSize*.38,12);g.fill();
      const lead=this.petImage(this.root,s.active,0,petY,petSize);lead.name='home-pet';this.breathe(lead);
    }else{const empty=this.panel(this.root,0,petY,280,72,'#fffdf0',20,235);this.text(empty,'营地等待新的伙伴\n请先孵化新伙伴',0,0,19,'#316b70',270,62);}
    const dock=this.panel(this.root,0,b+99,374,174,'#fff9ed',24,244);dock.name='home-menu';
    // Two action tiers share a compact dock; every destination remains one tap away.
    const calm=(n:Node)=>{const glow=n.getChildByName('available-glow'),opacity=glow?.getComponent(UIOpacity);if(opacity){Tween.stopAllByTarget(opacity);opacity.opacity=65;}return n;};
    const gym=calm(this.button(this.root,'home-gym','',106,b+144,142,60,()=>drawGyms(this),'#f0dfba'));
    this.image(gym,'guard-shield',-41,0,36,36);const gymTitle=this.text(gym,'道馆',20,0,21,'#705334',91,34);gymTitle.isBold=true;gymTitle.enableWrapText=false;
    const explore=calm(this.button(this.root,'home-explore','',-76,b+144,202,60,()=>{this.mapIndex=latestUnlockedMap(this.state);this.mapTabPage=Math.floor(this.mapIndex/6);this.screen='adventure';this.render();},'#de6854'));
    this.menuIcon(explore,'map',-73,0,32,'#fff5db');const exploreTitle=this.text(explore,'探险',-1,0,22,'#ffffff',106,36);exploreTitle.isBold=true;exploreTitle.enableWrapText=false;
    const item=(id:string,title:string,x:number,fill:string,callback:()=>void)=>{
      const n=calm(this.button(this.root,id,'',x,b+62,64,72,callback,fill));
      const label=this.text(n,title,0,-22,14,'#3d5961',62,23);label.isBold=true;label.enableWrapText=false;return n;
    };
    const partners=item('home-partners','伙伴',-144,'#e7efeb',()=>this.collection(0)),pawIcon=this.menuIcon(partners,'paw',0,12,32,'#548c79');
    const nursery=item('home-hatch','孵化',-72,'#edf0df',()=>this.hatchery()),eggIcon=this.eggArt(nursery,{id:'home',rarity:'normal',affinity:'bud',stage:5},0,12,35);
    const breed=item('home-breed','交配',0,'#f7e8e5',()=>this.breedingUI()),breedIcon=this.menuIcon(breed,'breed',0,12,34,'#ba7890');
    const kitchen=item('home-cooking','料理',72,'#f8ebd8',()=>this.cookingUI());
    const cookIcon=this.text(kitchen,'♨',0,12,30,'#ab774e',48,34).node;
    const dex=item('home-dex','图鉴',144,'#f4eadd',()=>this.pokedexUI()),dexIcon=this.menuIcon(dex,'dex',0,12,32,'#b88856');
    const badge=(parent:Node,name:string)=>{const dot=this.panel(parent,24,27,20,20,'#d95e4b',10);dot.name=name;this.text(dot,'!',0,0,14,'#ffffff',20,20).isBold=true;return dot;};
    const partyBadge=badge(partners,'home-party-badge');partyBadge.active=hasOpenPartySlot(s);
    this.homeHatchBadge=badge(nursery,'home-hatch-badge');this.homeBreedBadge=badge(breed,'home-breed-badge');this.refreshHomeBadges();
    this.startHomeMotion(explore,[pawIcon,eggIcon,breedIcon,cookIcon,dexIcon]);
    this.fx=this.makeNode(this.root,'home-effects',0,0,390,H);
  }
  private startHomeMotion(explore:Node,icons:Node[]){
    // Reuse existing geometry. Replace home button glow loops with one bounded controller.
    for(const glow of this.availableGlows){const opacity=glow.getComponent(UIOpacity);if(opacity){Tween.stopAllByTarget(opacity);opacity.opacity=65;}}
    if((globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const pulse=explore.getChildByName('available-glow')!.getComponent(UIOpacity)!;
    this.homeMotion={since:performance.now(),next:0,pulse,icons:icons.map(node=>({node,x:node.position.x,y:node.position.y,z:node.eulerAngles.z})),index:-1,badges:[this.homeHatchBadge!,this.homeBreedBadge!]};
  }
  private homeMotionUpdate(mono:number){
    const m=this.homeMotion;if(!m||mono<m.next||this.screen!=='home'||!this.clockForeground||this.modal||this.busy||this.pressPending)return;
    m.next=mono+50;const elapsed=Math.max(0,mono-m.since);
    // At most 20 updates/sec: one border, one icon, two ready badges. No particles or redraws.
    m.pulse.opacity=Math.round(65+110*(.5-.5*Math.cos(elapsed*Math.PI*2/3600)));
    const index=Math.floor(elapsed/3500)%m.icons.length;
    if(index!==m.index){const old=m.icons[m.index];if(old){old.node.setPosition(old.x,old.y,0);old.node.setRotationFromEuler(0,0,old.z);}m.index=index;}
    const icon=m.icons[index],phase=elapsed%3500,p=phase<1100?Math.sin(phase/1100*Math.PI):0;
    icon.node.setPosition(icon.x,icon.y+2.5*p,0);icon.node.setRotationFromEuler(0,0,icon.z+Math.sin(phase/1100*Math.PI*2)*p*5);
    for(let i=0;i<m.badges.length;i++){const badge=m.badges[i];if(!badge.active)continue;const phase=(elapsed+i*650)%4600,bounce=phase<700?Math.abs(Math.sin(phase/700*Math.PI*2))*(1-phase/700):0;badge.setPosition(24,27+3*bounce,0);badge.setScale(1+.09*bounce,1+.09*bounce,1);}
  }
  private refreshHomeBadges(){
    if(this.homeHatchBadge?.isValid)this.homeHatchBadge.active=hasHatchAction(this.state,gameNow());
    if(this.homeBreedBadge?.isValid)this.homeBreedBadge.active=!!this.state.breeding&&gameNow()>=this.state.breeding.readyAt;
  }
  private gymUI(){drawGyms(this);}
  private homeProfileUI(top:number){
    this.panel(this.root,-80,top-39,206,48,'#fffdf1',19,246);
    const avatar=this.panel(this.root,-159,top-39,40,40,'#dceee7',20);avatar.name='home-avatar';
    const crop=this.makeNode(avatar,'home-avatar-crop',0,0,38,38);crop.addComponent(Mask).type=Mask.Type.GRAPHICS_ELLIPSE;
    this.image(crop,'avatar-'+(this.state.journey?.hero||'ranger'),0,0,38,38);
    this.text(this.root,this.state.pcCooking?.active?mealSummary(this.state.pcCooking,campaignText):heroFor(this.state).name,-62,top-39,13,C.ink,153,32);
  }
  private homeSettings(){const c=this.overlay('营地设置',292);
    this.button(c,'settings-close','×',143,111,38,38,()=>this.goHome(),'#e4eef1',true,27);
    this.button(c,'audio-music','音乐  '+(this.audio.musicEnabled?'开':'关'),0,50,300,48,()=>{this.audio.toggle('music');this.homeSettings();},this.audio.musicEnabled?'#519b81':'#8b9dab');
    this.button(c,'audio-effects','音效  '+(this.audio.effectsEnabled?'开':'关'),0,-11,300,48,()=>{this.audio.toggle('effects');this.homeSettings();},this.audio.effectsEnabled?'#519b81':'#8b9dab');
    this.button(c,'settings-language','语言  ›',0,-72,300,48,()=>this.languageSettings(),'#286f94');
  }
  private languageSettings(){
    const back=()=>{this.exitUtility();this.homeSettings();},c=this.fullPage('语言','',()=>this.languageSettings(),back),{top,bottom,height}=this.pageBounds(c);
    const viewportH=height-116,viewport=this.makeNode(c,'language-scroll',0,top-14-viewportH/2,354,viewportH);
    viewport.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    const rowH=56,step=66,contentH=Math.max(viewportH,LANGUAGES.length*step-10),content=this.makeNode(viewport,'language-content',0,viewportH/2,354,contentH);
    content.getComponent(UITransform)!.setAnchorPoint(.5,1);
    LANGUAGES.forEach((entry,i)=>{
      const chosen=languageChoice()===entry.id;
      const button=this.button(content,'language-'+entry.id,entry.name,0,-rowH/2-i*step,350,rowH,()=>{
        selectLanguage(entry.id,sys.languageCode||sys.language||'en');
        try{sys.localStorage.setItem(LANGUAGE_KEY,entry.id);}catch{}
        this.languageSettings();
      },chosen?'#286f94':'#ffffff',true,21);
      // Language names stay in their own script so players can always find them.
      const label=button.getComponentInChildren(Label)!;label.string=entry.id==='system'?tr(entry.name):entry.name;label.enableWrapText=false;
      label.node.getComponent(UITransform)!.setContentSize(294,48);label.node.setPosition(-14,0,0);
      if(chosen)this.text(button,'✓',149,0,23,'#ffffff',30,36).isBold=true;
    });
    const scroll=viewport.addComponent(ScrollView);scroll.content=content;scroll.horizontal=false;scroll.vertical=true;scroll.elastic=false;scroll.inertia=true;scroll.brake=.8;scroll.cancelInnerEvents=true;
    const syncControls=()=>{for(const row of content.children){const t=row.getComponent(UITransform)!,world=row.worldPosition,scale=row.worldScale;this.controls[row.name]={x:world.x,y:view.getVisibleSize().height-world.y,w:t.width*Math.abs(scale.x),h:t.height*Math.abs(scale.y)};}};
    viewport.on(ScrollView.EventType.SCROLLING,syncControls);
    const selected=Math.max(0,LANGUAGES.findIndex(entry=>entry.id===languageChoice())),maxOffset=Math.max(0,contentH-viewportH),offset=Math.min(maxOffset,Math.max(0,selected*step-(viewportH-rowH)/2));
    this.scheduleOnce(()=>{if(!scroll.isValid)return;scroll.scrollToPercentVertical(maxOffset?1-offset/maxOffset:1,0);syncControls();},0);
    const foot=this.panel(c,0,bottom+43,390,86,'#fffdf5',20);
    this.button(foot,'language-back','返回',0,0,350,52,back,'#519b81',true,19);
  }
  private adventureUI(){
    const s=this.state,H=this.h,b=-H/2,top=H/2;
    this.panel(this.root,0,0,390,H,'#edf3e8',0);this.sectionHeader('探险地图','');
    const m=MAPS[this.mapIndex]||MAPS[0],current=s.gymRun===undefined&&m.id===mapFor(s).id,unlocked=mapUnlocked(s,m.id),active=hasActivePet(s),cleared=!!s.clearedMaps?.includes(m.id);
    this.regionTabs(this.root,top-120,MAPS.map(m=>({id:m.id,label:String(m.id+1).padStart(2,'0'),tint:m.tint})),this.mapIndex,this.mapTabPage,(p,redraw)=>{this.mapTabPage=p;if(redraw)this.render();},id=>{this.mapIndex=id;this.render();},'map');
    const extraTabs=MAPS.length>12?60:0,cardBottom=b+(extraTabs?142:160),cardTop=top-218-extraTabs;
    const center=(cardTop+cardBottom)/2,height=cardTop-cardBottom,card=this.panel(this.root,0,center,354,height,'#fffdf5',22);
    const headerH=height<300?64:height<360?88:104;
    this.panel(card,0,height/2-headerH/2,354,headerH,m.tint,22);this.menuIcon(card,'map',-123,height/2-headerH/2,headerH<100?36:44);
    const title=this.text(card,m.name,28,height/2-headerH/2,23,'#ffffff',245,46);title.node.name='map-title';title.enableWrapText=true;title.isBold=true;
    const types=this.text(card,m.types,0,height/2-headerH-17,14,m.tint,330,22);types.node.name='map-types';types.enableWrapText=false;
    // Reserve independent bands for art, names, optional route and footer.
    const gridTop=height/2-headerH-34,gridBottom=-height/2+(height>450?166:height<300?30:46),rowH=(gridTop-gridBottom)/2,artSize=Math.min(72,Math.max(12,rowH-30));
    m.pets.forEach((id,i)=>{const x=(i%3-1)*104,rowTop=gridTop-Math.floor(i/3)*rowH,rowBottom=rowTop-rowH;
      const art=this.petImage(card,id,x,rowTop-5-artSize/2,artSize);art.name='map-pet-'+i;
      const name=this.text(card,PETS[id].name,x,rowBottom+13,11,C.muted,102,20);name.node.name='map-pet-name-'+i;name.enableWrapText=false;
    });
    if(height>450){const routeY=-height/2+107;
      this.text(card,'越深入，伙伴形态与蛋品质越高',0,routeY+42,13,m.tint,310,25);
      const path=this.makeNode(card,'route',0,routeY,290,50),g=path.addComponent(Graphics);g.strokeColor=color('#d6e2d3');g.lineWidth=4;g.moveTo(-136,0);g.lineTo(136,0);g.stroke();
      [1,Math.round(m.stages*.25),Math.round(m.stages*.5),Math.round(m.stages*.75),m.stages].forEach((step,i)=>{const x=(i-2)*68,done=cleared||current&&step<s.step,p=this.panel(path,x,0,30,30,done?m.tint:i===4?'#f2ce77':'#e6eddf',15);this.text(p,i===4?'★':''+step,0,0,14,done?'#ffffff':'#6c866f',28,27);});
    }
    const note=this.text(card,m.note,0,-height/2+(height<300?14:20),12,C.muted,330,height<300?22:24);note.node.name='map-note';note.enableWrapText=false;
    const eggs=this.panel(this.root,0,b+(extraTabs?103:115),354,extraTabs?58:70,'#dfeee0',16);this.eggArt(eggs,{id:'region',rarity:'SR',affinity:m.pets[0],stage:5},-137,0,44);
    this.text(eggs,'精英 / BOSS 巢穴寻蛋',24,extraTabs?12:15,16,'#41785c',270,27);this.text(eggs,m.eggs,24,extraTabs?-13:-15,12,'#64846e',270,24);
    const resume=current&&s.expedition&&!['lost','won'].includes(s.phase);
    const label=!active?'请先孵化新伙伴':!unlocked?'通关 '+MAPS[m.id-1].name+' 解锁':resume?'继续探险':'出发！';
    this.button(this.root,'adventure-go',label,0,b+39,354,60,()=>this.enterMap(m.id),'#df6156',active&&unlocked,active&&unlocked?23:18);
    this.fx=this.makeNode(this.root,'map-effects',0,0,390,H);
  }
  private enterMap(mapId:number){
    const s=this.state;if(!hasActivePet(s)||!mapUnlocked(s,mapId))return;
    const ended=['lost','won'].includes(s.phase);
    if(s.gymRun===undefined&&s.expedition&&mapId===mapFor(s).id&&!ended){this.screen='game';this.render();return;}
    const begin=async()=>{if(this.busy)return;this.busy=true;
      try{await this.loadRegionArt(mapId);const base=retreatExpedition(this.state),next=enterExpedition(base,mapId);if(!next.expedition)return;this.state=next;this.screen='game';this.save();this.render();}
      catch{const c=this.overlay('地图加载失败',218);this.text(c,'请重试进入地图',0,20,16,C.muted,300,40);this.button(c,'map-load-close','返回',0,-55,300,44,()=>this.render(),C.blue);}
      finally{this.busy=false;}};
    if(s.expedition&&!ended){const c=this.overlay('重新出发？',250);this.text(c,'当前挑战进度将重置',0,35,14,C.muted,320);
      this.button(c,'map-cancel','返回',-82,-49,145,52,()=>this.render(),'#e8f3fa');this.button(c,'map-confirm','出发',82,-49,145,52,begin,C.orange);
    }else begin();
  }
  private async commitCampaign(next:State){
    if(this.busy)return false;
    this.busy=true;
    const previous=this.state;
    this.state=next;
    try{
      if(await this.save())return true;
      this.state=previous;
      await this.save();
      return false;
    }finally{this.busy=false;}
  }
  private recipeIndex=0;
  private recipeQuality:FoodQuality=1;
  private cookingUI(){
    const state=this.state.pcCooking||newCooking(),recipe=RECIPES[this.recipeIndex],quality=this.recipeQuality;
    const replace=()=>this.cookingUI();
    const c=this.fullPage('营地烹饪',mealSummary(state,campaignText),replace),{top,bottom,height}=this.pageBounds(c);
    for(const q of [1,2,3] as FoodQuality[]){
      this.button(c,'food-quality-'+q,FOOD_QUALITY_NAMES[q],(q-2)*116,top-28,108,44,
        ()=>{this.recipeQuality=q;replace();},q===quality?'#c78a4c':'#f3e4d1',true,15);
    }
    RECIPES.forEach((item,i)=>this.button(c,'food-recipe-'+i,item.name,(i%3-1)*116,top-85-Math.floor(i/3)*55,108,48,
      ()=>{this.recipeIndex=i;replace();},i===this.recipeIndex?item.color:'#fffdf4',true,14));
    const cardHeight=height-294,card=this.panel(c,0,top-177-cardHeight/2,350,cardHeight,'#fffdf5',18);
    this.text(card,recipe.name,0,cardHeight/2-24,20,C.ink,322,31).isBold=true;
    this.text(card,recipe.types.map(type=>tr(type)).join(' · '),0,cardHeight/2-54,14,C.muted,322,24);
    this.text(card,bonusDescription(recipe,quality,campaignText),0,cardHeight/2-83,16,C.green,322,28);
    recipeCost(recipe,quality).forEach(({id,count},i)=>{
      const name=INGREDIENTS.find(item=>item.id===id)!.name;
      const have=state.ingredients[cookingKey(id,quality)]||0;
      this.text(card,campaignText(name)+'   '+have+' / '+count,0,cardHeight/2-119-i*28,15,have>=count?C.ink:'#a04c42',322,25);
    });
    const key=cookingKey(recipe.id,quality),made=state.meals[key]||0,blocked=this.state.phase==='battle';
    const apply=async(result:CookingResult)=>{
      if(blocked||!result.changed)return;
      const saved=await this.commitCampaign({...this.state,pcCooking:result.state,revision:this.state.revision+1});
      replace();
      if(!saved)this.pageHelp(campaignText('保存失败，材料与食物未消耗'));
    };
    this.text(c,state.active?'料理效果不叠加，新料理替换旧效果':'持续 10 场已结算战斗',0,bottom+100,14,C.muted,346,30);
    if(blocked)this.text(c,'请完成当前战斗后再用餐',0,bottom+73,14,'#a04c42',346,24);
    this.button(c,'food-cook','烹饪',-90,bottom+35,168,48,
      ()=>void apply(cookMeal(state,recipe.id,quality)),'#c78a4c',!blocked&&!cookingReason(state,recipe.id,quality),17);
    this.button(c,'food-eat',made?campaignText('享用')+' ×'+made:'先烹饪再享用',90,bottom+35,168,48,
      ()=>void apply(eatMeal(state,recipe.id,quality)),C.green,!blocked&&made>0,17);
  }
  private dexRewardsUI(){
    const book=this.dexBook();
    const c=this.fullPage('收集奖励',book.collected.length+' / '+DEX_TOTAL,()=>this.dexRewardsUI(),()=>this.pokedexUI());
    const {top,height}=this.pageBounds(c),row=Math.min(104,(height-26)/5);
    for(const reward of DEX_REWARDS){
      const id=reward.id,claimed=book.claimed.includes(id),ready=!claimed&&book.collected.length>=reward.required;
      const n=this.button(c,'dex-reward-'+id,'',((id-1)%3-1)*116,top-12-row/2-Math.floor((id-1)/3)*row,108,row-8,
        async()=>{
          const result=claimDexReward(this.state,this.dexBook(),id);
          if(!result.changed)return;
          const saved=await this.commitCampaign({...result.game,dexCollection:result.book});
          this.dexRewardsUI();
          if(!saved)this.pageHelp(campaignText('保存失败，奖励尚未领取，请重试'));
        },ready?'#f5d88c':claimed?'#e3eee0':'#edf0ef',ready);
      this.text(n,String(id).padStart(2,'0')+'  ·  SSR',0,14,16,C.ink,98,26).isBold=true;
      this.text(n,claimed?'已领取':ready?'领取奖励':''+reward.required,0,-14,14,C.muted,98,24);
    }
  }
  private dexBook(){return recordDex(this.state.dexCollection,this.state);}
  private dexOwned(id:PetId,rarity:EggRarity='normal',shiny=false){
    return !!this.state.dexCollection?.collected.includes(dexKey({id,rarity,shiny}))||
      this.state.pets!.some(p=>p.id===id&&(p.rarity||'normal')===rarity&&!!p.shiny===shiny);
  }
  private pokedexUI(){
    const owned=this.dexBook().collected.length;
    const catalog=[...DEX_SPECIES,...FRIEND_PET_IDS.filter(id=>this.state.pets!.some(p=>p.id===id))];
    const summary=owned+' / '+DEX_TOTAL,c=this.fullPage('图鉴',summary,()=>this.pokedexUI()),{top,bottom,height}=this.pageBounds(c);
    const chooseMap=(id:number)=>{this.dexMap=id;this.dexPage=0;this.pokedexUI();};
    for(const name of ['图鉴',summary]){const n=this.root.getChildByName(name);if(n){n.setPosition(0,n.position.y);n.getComponent(UITransform)!.width=158;}}
    this.button(this.root,'dex-map-all','全部',92,this.h/2-42,62,44,()=>chooseMap(-1),this.dexMap<0?'#b43d3a':'#f5e8dc',true,15);
    this.button(this.root,'dex-rewards','SSR',157,this.h/2-42,61,44,()=>this.dexRewardsUI(),'#f4df9e',true,15);
    this.regionTabs(c,top-32,MAPS.map(m=>({id:m.id,label:String(m.id+1).padStart(2,'0'),tint:m.tint})),this.dexMap,this.dexTabPage,(p,redraw)=>{this.dexTabPage=p;if(redraw)this.pokedexUI();},chooseMap,'dex-map');
    const extraTabs=MAPS.length>12?60:0;
    this.button(c,'dex-type',(this.dexType||'全部属性')+' ▾',-120,top-156-extraTabs,112,58,()=>this.dexTypePicker(),this.dexType?'#527e9a':C.paper,true,17);
    this.button(c,'dex-owned','已拥有',0,top-156-extraTabs,112,58,()=>{this.dexOwnedOnly=!this.dexOwnedOnly;this.dexPage=0;this.pokedexUI();},this.dexOwnedOnly?'#519b81':C.paper,true,17);
    this.button(c,'dex-shiny','闪光',120,top-156-extraTabs,112,58,()=>{this.dexShinyOnly=!this.dexShinyOnly;this.dexPage=0;this.pokedexUI();},this.dexShinyOnly?'#b27d27':C.paper,true,17);
    const forms=[false,true].reduce((all:{id:PetId;rarity:EggRarity;shiny:boolean}[],shiny)=>all.concat(catalog.reduce((rows:{id:PetId;rarity:EggRarity;shiny:boolean}[],id)=>rows.concat(RARITIES.map(rarity=>({id,rarity,shiny}))),[])),[]).filter(({id,rarity,shiny})=>(this.dexMap<0||MAPS[this.dexMap].pets.includes(id))&&(!this.dexType||PETS[id].type===this.dexType)&&(!this.dexOwnedOnly||this.dexOwned(id,rarity,shiny))&&(!this.dexShinyOnly||shiny));
    const perPage=6,pages=Math.max(1,Math.ceil(forms.length/perPage));this.dexPage=Math.min(this.dexPage,pages-1);
    const rowH=Math.min(222,(height-276-extraTabs)/2),start=top-198-extraTabs-rowH/2;
    this.listPages(c,forms,perPage,this.dexPage,({id,rarity,shiny},itemIndex)=>{const i=itemIndex%perPage,owned=this.dexOwned(id,rarity,shiny),pet={...petEntry(this.state,id+':'+rarity),shiny};
      const p=this.button(c,'dex-pet-'+id+'-'+rarity+(shiny?'-shiny':''),'',(i%3-1)*120,start-Math.floor(i/3)*(rowH+8),112,rowH,()=>this.dexDetail(id,rarity,shiny),shiny?'#fff6df':'#ffffff');
      this.listItem(p,itemIndex,perPage);const index=PET_IDS.indexOf(id)*3+RARITIES.indexOf(rarity)+1;
      this.text(p,'No.'+String(index).padStart(3,'0')+(shiny?' ★':''),-18,rowH/2-14,11,C.muted,72,20);
      const tint=rarity==='SSR'?'#b78022':rarity==='SR'?'#8b61bb':'#46976e';this.text(p,rarityName(rarity),36,rowH/2-14,11,tint,32,20);
      if(owned)this.petImage(p,pet,0,0,Math.min(108,rowH-54));
      else this.text(p,'?',0,0,30,C.muted,90,46).isBold=true;
      this.text(p,owned?petName(pet):'尚未收集',0,-rowH/2+20,14,C.ink,106,26).isBold=true;
    });
    if(!forms.length)this.text(c,'暂无符合条件的伙伴',0,0,18,C.muted,330,44);
    this.pagePager(c,bottom+25,this.dexPage,pages,(page,redraw)=>{this.dexPage=page;if(redraw)this.pokedexUI();},'dex');
  }
  private dexTypePicker(){
    const types=['',...Array.from(new Set(PET_IDS.map(id=>PETS[id].type)))],c=this.overlay('属性',444);
    types.forEach((type,i)=>this.button(c,'dex-type-'+i,type||'全部',(i%4-1.5)*79,133-Math.floor(i/4)*53,72,43,()=>{this.dexType=type;this.dexPage=0;this.pokedexUI();},this.dexType===type?'#c78a4c':'#dbe9ef',true,14));
    this.button(c,'dex-type-close','返回',0,-174,310,40,()=>this.pokedexUI(),'#427b9e',true,16);
  }
  private dexDetail(id:PetId,rarity:EggRarity,shiny=false){
    const index=PET_IDS.indexOf(id)*3+RARITIES.indexOf(rarity)+1;
    if(!this.dexOwned(id,rarity,shiny)){
      const c=this.fullPage('No.'+String(index).padStart(3,'0'),'尚未收集',()=>this.dexDetail(id,rarity,shiny),()=>this.pokedexUI());
      this.text(c,'?',0,0,72,C.muted,180,120);
      return;
    }
    const p={...petEntry(this.state,id+':'+rarity),shiny},map=MAPS.find(m=>m.pets.includes(id));
    const tint=rarity==='SSR'?'#b78022':rarity==='SR'?'#8b61bb':'#46976e';
    const c=this.fullPage('No.'+String(index).padStart(3,'0')+'  '+petName(p),PETS[id].type+' · '+(this.dexOwned(id,rarity,shiny)?'已拥有':'未拥有'),()=>this.dexDetail(id,rarity,shiny),()=>this.pokedexUI()),{top,bottom,height}=this.pageBounds(c);
    const badge=this.panel(c,0,top-31,112,36,tint,14);this.text(badge,(shiny?'★ ':'')+rarityName(rarity),0,0,18,'#ffffff',105,30).isBold=true;
    const heroH=Math.min(310,height-365),hero=this.panel(c,0,top-65-heroH/2,354,heroH,'#ffffff',22);
    const disc=this.makeNode(hero,'dex-disc',0,-heroH*.32,180,28),g=disc.addComponent(Graphics);g.fillColor=color('#dae9e7');g.ellipse(0,0,88,12);g.fill();
    this.petImage(hero,p,0,5,heroH-32);if(shiny)this.text(hero,'最高攻击 +2',0,-heroH/2+16,12,'#a47820',320,24);
    const rowY=top-65-heroH-31;
    const stat=this.panel(c,0,rowY,354,46,'#fffdf5',13);
    this.text(stat,'HP '+petBaseHP(p),-113,0,18,'#45856c',112,32).isBold=true;
    this.actionIcon(stat,'attack',-36,0,24,'#c86458');
    petAttackFaces(p).forEach((value,i)=>{const face=this.panel(stat,13+i*55,0,45,32,'#f8e2d9',9);this.text(face,''+value,0,0,17,'#a04c42',41,28).isBold=true;});
    const skill=skillFor(p),card=this.panel(c,0,rowY-70,354,80,'#ffffff',14);
    this.text(card,skill.name,0,23,16,tint,330,27).isBold=true;
    this.text(card,petSkills(p).map(code=>SKILLS[code][1]).join(' · '),0,-12,13,C.muted,326,43);
    const location=this.panel(c,0,rowY-143,354,50,'#e0eee7',14);this.menuIcon(location,'map',-145,0,26,map?.tint||'#769cba');
    this.text(location,map?map.name+' · 孵蛋获得':'宠物蛋',17,0,15,'#427d68',290,32);
    this.button(c,'dex-types','属性关系',0,bottom+78,140,30,()=>this.typeRelationsUI(id,rarity,()=>this.dexDetail(id,rarity,shiny)),'#e8f3fa',true,13);
    this.button(c,'dex-detail-back','返回图鉴',0,bottom+32,354,44,()=>this.pokedexUI(),'#427b9e',true,17);
  }
  private encounterTypesUI(s=this.state,returnTo?:()=>void){
    const c=this.overlay('克制关系',390);
    ([{name:'我方攻击',from:s.active.id,to:s.enemy,y:77},{name:'敌方攻击',from:s.enemy,to:s.active.id,y:8}]).forEach(row=>{
      this.text(c,row.name,-91,row.y,15,C.ink,110,25);
      this.typeIcon(c,PETS[row.from].type,-13,row.y,28);
      this.text(c,'→',27,row.y,22,C.muted,27,28);this.typeIcon(c,PETS[row.to].type,65,row.y,28);
      this.matchupBadge(c,matchupMultiplier(row.from,row.to),122,row.y,66,true);
    });
    this.text(c,'攻击数字已计入克制；两个方向分别计算',0,-33,12,C.muted,330,22);
    this.text(c,'★ 按属性推荐；技能需自行判断',0,-54,11,'#357a65',330,20);
    const back=()=>{if(returnTo)returnTo();else{this.screen='game';this.render();}this.encounterTypesUI(s,returnTo);};
    this.button(c,'types-player','我方关系 ›',-80,-95,144,54,()=>this.typeRelationsUI(s.active.id,s.active.rarity||'normal',back),'#286f94',true,16);
    this.button(c,'types-enemy','敌方关系 ›',80,-95,144,54,()=>this.typeRelationsUI(s.enemy,s.enemyRarity||'normal',back),'#a94f48',true,16);
    this.button(c,'types-close','返回',0,-161,310,52,()=>returnTo?returnTo():this.render(),C.blue,true,17);
  }
  private typeRelationsUI(id:PetId,rarity:EggRarity,back?:()=>void){
    const type=PETS[id].type,c=this.fullPage('属性关系',type+' · '+petName({id,rarity}),()=>this.typeRelationsUI(id,rarity,back),back||(()=>this.dexDetail(id,rarity))),{top,bottom,height}=this.pageBounds(c);
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
    const available=s.pets!.filter(p=>!isBreedingPet(s,p.uid!));
    const selected=this.partnerSelected&&!isBreedingPet(s,this.partnerSelected)&&(!this.partnerOwnedOnly||available.some(p=>p.uid===this.partnerSelected))?this.partnerSelected:hasActivePet(s)&&!isBreedingPet(s,s.active.uid!)?s.active.uid!:this.partnerOwnedOnly?null:PET_IDS[0]+':normal',selectedPet=selected?petEntry(s,selected):null;
    this.panel(this.root,0,0,390,H,'#edf4f5',0);this.sectionHeader('伙伴','点选伙伴 · 调整队伍');
    const slots=homeParty(s),teamY=top-150;
    slots.forEach((key,i)=>{const x=(i-1)*120,p=this.button(this.root,'team-slot-'+i,'',x,teamY,112,110,()=>{if(key){this.partnerSelected=key;this.render();}},i===0?'#fff0d5':'#deedf2'),entry=key?petEntry(s,key):null;
      if(entry)this.petImage(p,entry,0,4,64);else this.menuIcon(p,'lock',0,6,31,'#9aacb0');
      this.text(p,i===0?'出战':'候补 '+i,0,40,12,i===0?'#b17a2d':'#63899a',100,22).isBold=true;this.text(p,entry?petName(entry)+sexSymbol(entry.sex):'空位',0,-38,12,C.ink,104,24);
      this.partyDropNodes.push(p);if(key)this.bindPartyDrag(p,key);
    });
    const filterY=top-232;this.text(this.root,'伙伴 '+available.length,-101,filterY,16,C.ink,170,28).isBold=true;
    this.button(this.root,'partner-filter','图鉴 ›',119,filterY,114,32,()=>this.pokedexUI(),'#dbe9ef',true,13);
    const keys=this.partnerOwnedOnly?available.map(p=>p.uid!):([] as string[]).concat(...PET_IDS.map(id=>RARITIES.map(r=>id+':'+r))),pages=Math.max(1,Math.ceil(keys.length/6));this.partnerPage=Math.min(this.partnerPage,pages-1);
    const gridHeight=Math.min(148,Math.max(90,(H-520)/2)),gridTop=top-258-gridHeight/2,spacing=gridHeight+12;
    this.listPages(this.root,keys,6,this.partnerPage,(key,itemIndex)=>{const i=itemIndex%6;const entry=petEntry(s,key),x=(i%3-1)*120,y=gridTop-Math.floor(i/3)*spacing,owned=s.pets!.some(p=>p.uid===key),discovered=s.pets!.some(p=>formKey(p)===formKey(entry)),chosen=key===selected;
      const p=this.button(this.root,'pet-'+key,'',x,y,112,gridHeight,()=>{this.partnerSelected=key;this.render();},chosen?'#fff1d6':'#ffffff'),petSize=Math.min(96,gridHeight-34);
      this.listItem(p,itemIndex,6);const art=this.petImage(p,entry,0,4,petSize);if(!discovered)art.getComponent(Sprite)!.grayscale=true;
      this.text(p,petName(entry)+sexSymbol(entry.sex),0,-gridHeight/2+14,12,C.ink,108,22);this.text(p,rarityName(entry.rarity),31,gridHeight/2-13,10,entry.rarity==='SSR'?'#b78022':entry.rarity==='SR'?'#8b61bb':'#46976e',48,18);
      if(chosen){const g=p.getComponent(Graphics)!;g.lineWidth=2;g.strokeColor=color('#dda841');g.roundRect(-55,-gridHeight/2+1,110,gridHeight-2,13);g.stroke();}
      if(owned)this.bindPartyDrag(p,key);
    });
    if(!keys.length)this.text(this.root,'还没有伙伴\n请先孵化新伙伴',0,gridTop-32,20,C.muted,320,88);
    this.pagePager(this.root,b+222,this.partnerPage,pages,(page,redraw)=>{this.partnerPage=page;if(redraw)this.render();},'collection');
    const owned=s.pets!.some(p=>p.uid===selected),detail=this.panel(this.root,0,b+102,390,186,'#fffdf5',22);detail.name='partner-detail';
    if(!selectedPet){
      this.text(detail,'伙伴破壳后会出现在这里',0,43,18,C.ink,340,32);
      this.text(detail,'先孵化新伙伴，再出发探险',0,4,14,C.muted,340,27);
      this.button(detail,'partner-hatch','前往孵化屋',0,-48,310,44,()=>this.hatchery(),'#519b81',true,18);
      this.fx=this.makeNode(this.root,'party-effects',0,0,390,H);return;
    }
    this.text(detail,petName(selectedPet)+' '+sexSymbol(selectedPet.sex),-82,67,19,C.ink,190,29).isBold=true;
    this.text(detail,PETS[selectedPet.id].type+' · '+rarityName(selectedPet.rarity),105,67,13,'#889762',144,26);
    const faces=petAttackFaces((s.active.uid===selected?s.active:s.reserve?.uid===selected?s.reserve:s.runRoster?.[selected])||selectedPet);
    this.text(detail,'HP '+petBaseHP(selectedPet)+'   /   ⚔ '+faces.join(' · '),0,35,14,C.muted,350,25);
    this.button(detail,'partner-skill',tr('技能')+' ×'+petSkills(selectedPet).length+' ›',0,-2,350,34,()=>this.qualityDetail(selected,selectedPet.rarity||'normal',this.partnerPage),'#e4eef1',true,16);
    const manageable=owned&&canManageParty(s);
    this.partyDragHint=this.text(detail,!canManageParty(s)?'战斗中':!owned?'通过孵蛋获得此形态':'',0,-84,11,C.muted,356,16);
    slots.forEach((key,i)=>{const remove=i>0&&key===selected;
      this.button(detail,remove?'partner-remove-'+i:'partner-assign-'+i,remove?'−':i===0?'出战':'候补 '+i,(i-1)*120,-48,112,48,()=>{
        if(!remove){this.partnerQuickAssign(selected,i);return;}
        const next=removePartySlot(this.state,i);if(next===this.state)return;this.state=next;this.save();this.render();
      },remove?'#c96660':key===selected?'#dce8e5':i===0?'#d79d42':'#519b81',manageable&&(remove||key!==selected),remove?30:17);
    });
    this.fx=this.makeNode(this.root,'party-effects',0,0,390,H);
  }
  private partnerQuickAssign(key:string,index:number){
    const next=assignPartySlot(this.state,key,index);if(next===this.state)return;
    this.state=next;this.partnerSelected=key;this.save();this.render();
    const slot=this.partyDropNodes[index];if(slot){slot.setScale(.92,.92,1);tween(slot).to(.2,{scale:Vec3.ONE},{easing:'backOut'}).start();}
    this.popup(index===0?'已设为出战':'已放入候补 '+index,new Vec3(0,this.h/2-255,0),'#2a9266');
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
      if(!d.axis)d.axis=Math.abs(p.x-d.start.x)>Math.abs(p.y-d.start.y)?'horizontal':'vertical';
      if(d.axis==='horizontal'){d.moved=true;return;}
      if(!this.state.pets!.some(p=>p.uid===id)||!canManageParty(this.state)){d.moved=true;return;}
      if(!d.ghost){d.moved=true;const opacity=n.getComponent(UIOpacity)||n.addComponent(UIOpacity);opacity.opacity=120;
        d.ghost=this.panel(this.fx,p.x,p.y+48,90,92,'#fff5dc',18,244);this.petImage(d.ghost,id,0,3,78);
        this.text(d.ghost,petName(petEntry(this.state,id)),0,-37,11,C.ink,86,18);
        d.guides=this.partyDropNodes.map((slot,i)=>{const pos=this.root.getComponent(UITransform)!.convertToNodeSpaceAR(slot.worldPosition),guide=this.makeNode(this.fx,'drop-guide-'+i,pos.x,pos.y,118,116);guide.addComponent(Graphics);return guide;});
      }
      d.ghost.setPosition(p.x,p.y+48);d.target=this.partyDropNodes.findIndex(slot=>{const v=this.root.getComponent(UITransform)!.convertToNodeSpaceAR(slot.worldPosition);return Math.abs(p.x-v.x)<=58&&Math.abs(p.y-v.y)<=57;});
      d.guides.forEach((guide,i)=>{const g=guide.getComponent(Graphics)!;g.clear();g.fillColor=color(i===d.target?'#5dcc91':'#83b9dd',i===d.target?55:20);g.strokeColor=color(i===d.target?'#299b69':'#7db0cd');g.lineWidth=i===d.target?4:2;g.roundRect(-57,-56,114,112,15);g.fill();g.stroke();});
      if(this.partyDragHint)this.partyDragHint.string=tr(d.target<0?'拖到上方高亮位置 · 松手放置':d.target===0?'松手设为出战':'松手放入候补 '+d.target);
    });
    const finish=(e:EventTouch)=>{e.propagationStopped=true;const d=this.partyDrag;if(!d||d.touch!==e.touch!.getID())return;
      // Creator 3.8 reports a release outside the source card as TOUCH_CANCEL;
      // getEventCode preserves the original physical end/cancel distinction.
      const canceled=e.getEventCode()!==Node.EventType.TOUCH_END;
      if(canceled){this.cancelPartyDrag();if(!this.pageSwipeActive)this.render();return;}
      if(!d.moved){this.audio?.unlock();this.audio?.effect('click');this.cancelPartyDrag();this.partnerSelected=id;this.lastTap=performance.now();this.render();return;}
      const index=d.target,next=index>=0?assignPartySlot(this.state,id,index):this.state;
      if(next!==this.state){this.audio?.unlock();this.audio?.effect('click');this.cancelPartyDrag();this.state=next;this.partnerSelected=id;this.save();this.render();
        const slot=this.partyDropNodes[index];slot.setScale(.92,.92,1);tween(slot).to(.2,{scale:Vec3.ONE},{easing:'backOut'}).start();
        this.popup(index===0?'已设为出战':'已放入候补 '+index,new Vec3(0,this.h/2-255,0),'#2a9266');
      }else if(d.ghost){const ghost=d.ghost;this.partyDrag=null;for(const guide of d.guides)guide.destroy();
        tween(ghost).to(.16,{position:d.origin,scale:new Vec3(.8,.8,1)},{easing:'quadOut'}).call(()=>{this.pressPending=false;this.render();}).start();
      }else{this.cancelPartyDrag();this.render();}
    };
    n.on(Node.EventType.TOUCH_END,finish);n.on(Node.EventType.TOUCH_CANCEL,finish);
  }
}
