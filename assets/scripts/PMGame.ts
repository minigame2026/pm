import { _decorator, Component, Node, Camera, Canvas, UITransform, Sprite, SpriteFrame, Texture2D, Graphics, Label, Vec3, Rect, UIOpacity, Layers, view, ResolutionPolicy, resources, input, Input, EventKeyboard, KeyCode, EventTouch, sys, game, Game, tween, Tween, profiler, director } from 'cc';
import * as M from './PMModel';
import { PMArt } from './PMArt';
import { PMAudio } from './PMAudio';
import { TrustedClock, fetchTrustedUtc } from './TrustedClock';
import { DurableCheckpoint } from './DurableCheckpoint';
import { loadShinyVisuals, tintShiny } from './ShinyVisuals';
import { PCUI, PC, hex, Control } from './PCUI';
import {PC_LANGUAGE_KEY,selectPCLanguage,currentLocale,languageChoice,LANGUAGES,pcFont,useBundledPCFonts,useMobileFonts} from './PCLocale';
import { PCInputGate } from './PCInputGate';
import { pcBattleAmbience } from './PCBattleAmbience';
import { PCPetMotion, attachPetMotion, PCBattleEffects } from './PCPetMotion';
import { PCDiceReel } from './PCDiceReel';
import { APP_BATTLE_IDS, APP_BATTLE_POSES, APP_BATTLE_ATLASES, appPoseKey, appPoseFeet } from './AppBattleArt';
import {recordDex,dexKey,claimDexReward,DEX_TOTAL,DEX_REWARDS,DEX_SPECIES,PCDexState} from './PCDex';
import {PCDexRewardsUI} from './PCDexRewardsUI';
import {loadPCProfile, savePCProfile, startNewPCProfile, PCProfileLoad} from './MobilePCProfile';
import {PC_TEXT_WARMUP} from './PCTextWarmupData';
import {pcMapScene,pcSceneCover} from './PCBattleScenes';
import {PCCookingUI} from './PCCookingUI';
import {newCooking,cookMeal,eatMeal,settleCookingBattle,mealSummary,cookingReason,INGREDIENTS,RECIPES,FOOD_QUALITY_NAMES,CookingResult} from './PCCooking';
const {ccclass}=_decorator;
type Route='home'|'map'|'partners'|'hatch'|'dex'|'gyms'|'battle'|'onboard'|'cooking';
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));

/** PC-only presentation. The generated project preserves the scene's PMGame component UUID. */
@ccclass('PMGame')
export class PMGame extends Component {
  private state!:M.State;
  private root!:Node; private content!:Node; private background!:Node; private camera!:Camera;
  private shell!:Node; private header!:Node; private navMarker!:Node; private retiring:Node|null=null; private closingModal:Node|null=null;
  private ui!:PCUI; private art=new PMArt(); private audio!:PMAudio;
  private clock=new TrustedClock(()=>performance.now(),fetchTrustedUtc); private durable=new DurableCheckpoint(); private gate=new PCInputGate();
  private dex:PCDexState|undefined; private profileReadOnly=false;
  private chromeMode=''; private route:Route='home'; private previous:Route='home'; private ready=false; private hidden=false;
  private sequence=0; private saveError=false; private nextSync=0; private lastSecond=-1; private size=''; private textResizeAt=0;
  private modal:Node|null=null; private modalConfirm:(()=>void)|null=null; private modalDismiss:(()=>void)|null=null;
  private hint:Label|null=null; private saveLabel:Label|null=null; private mealLabel:Label|null=null; private battleMeal:Label|null=null; private kitchen:PCCookingUI|null=null;
  private battleHint:Node|null=null; private battleHintText:Label|null=null; private battleHintUntil=0;
  private mapIndex=0; private page=0; private selected=''; private selectedHero:M.HeroId='ranger'; private selectedStarter:M.PetId='fox';
  private dexRewards:PCDexRewardsUI|null=null;
  private dexShiny=false; private hatchTab='hatch'; private mother=''; private father=''; private selectedEgg='';
  private timers:{label:Label;get:()=>string}[]=[];
  private eggChoices=new Map<string,{label:Label;index:string}>();private nestChoices=new Map<number,Label>();private eggChoiceSummary:Label|null=null;
  private player:Node|null=null; private enemy:Node|null=null; private playerHP:Label|null=null; private enemyHP:Label|null=null;
  private playerBar:Node|null=null; private enemyBar:Node|null=null;
  private attackLabel:Label|null=null; private turnLabel:Label|null=null;
  private playerName:Label|null=null; private enemyTitle:Label|null=null; private battleStamp=''; private battleRoot:Node|null=null;
  private campFrame:SpriteFrame|null=null; private idle:{node:Node;baseY:number;phase:number}[]=[];
  private reduced=false; private fast=false; private effects!:Node; private toastNode:Node|null=null;
  private battleWorld:Node|null=null; private battleScenery:Node|null=null; private ambient:Node|null=null; private sceneKey='';
  private battleFX:PCBattleEffects|null=null; private actorPoses=new Map<Node,{id:string;side:'front'|'back';size:number;image:Node}>();
  private actionValues:Record<string,Label>={}; private actionStocks:Record<string,Label>={}; private actionIcons:Record<string,Sprite>={}; private commandLayer:Node|null=null;
  private barValues=new WeakMap<Node,{target:number;trail:number;shield:number}>();
  private diceNode:Node|null=null; private diceValue:Label|null=null; private hintPanel:Node|null=null; private shownTurn=-1;
  private playerReel:PCDiceReel|null=null; private enemyReel:PCDiceReel|null=null; private diceRollToken:number|null=null; private animateNextRoll=false;

  async start(){
    useBundledPCFonts(sys.isNative&&sys.os===sys.OS.WINDOWS);
    useMobileFonts(sys.isNative&&sys.isMobile);
    try{selectPCLanguage(sys.localStorage.getItem(PC_LANGUAGE_KEY),sys.languageCode||sys.language);}catch{selectPCLanguage(null,sys.languageCode||sys.language);}
    profiler.hideStats();view.enableRetina(true);view.setDesignResolutionSize(1600,900,ResolutionPolicy.SHOW_ALL);
    this.root=new Node('PC composition');this.node.addChild(this.root);this.root.layer=Layers.Enum.UI_2D;this.root.addComponent(UITransform).setContentSize(1600,900);
    const cn=new Node('PC camera');this.node.addChild(cn);this.camera=cn.addComponent(Camera);this.camera.projection=Camera.ProjectionType.ORTHO;
    this.camera.near=.1;this.camera.far=2000;this.camera.priority=10;this.camera.clearFlags=Camera.ClearFlag.SOLID_COLOR;this.camera.clearColor=hex('#bad8c8');this.camera.visibility=Layers.Enum.UI_2D;
    // Native camera priorities are unsigned; keep the clearing camera below the game with positive values.
    const clearNode=new Node('PC letterbox');this.node.addChild(clearNode);const clear=clearNode.addComponent(Camera);clear.priority=1;clear.visibility=0;clear.clearFlags=Camera.ClearFlag.SOLID_COLOR;clear.clearColor=hex('#10191c');
    const canvas=this.root.addComponent(Canvas);canvas.alignCanvasWithScreen=false;canvas.cameraComponent=this.camera;
    this.ui=new PCUI(this.root,this.art);this.audio=new PMAudio(this.node,undefined,true);
    this.ui.canActivate=c=>!this.gate.locked&&!this.closingModal&&(!this.modal||this.ui.contains(c.node,this.modal));this.ui.onActivate=()=>{this.audio.unlock();this.audio.effect('click');};this.ui.onHint=(t,c,pressed)=>this.showHint(t,c,pressed);
    try{const prefs=JSON.parse(sys.localStorage.getItem('pm.pc.display.v1')||'{}');this.reduced=prefs.reduced??!!(globalThis as any).matchMedia?.('(prefers-reduced-motion: reduce)').matches;this.fast=!!prefs.fast;}catch{}
    this.ui.reduced=this.reduced;this.layout();this.ui.text(this.root,'正在整理旅行背包…',800,450,26);
    let loaded=loadPCProfile(sys.localStorage);this.profileReadOnly=loaded.readOnly;
    if(loaded.readOnly)loaded=await this.recoverProfile(loaded);
    if(!this.node.isValid)return;
    this.sequence=loaded.sequence;this.dex=loaded.dex;this.profileReadOnly=loaded.readOnly;
    this.state=loaded.game?M.prepareJourney(loaded.game):M.newJourney();if(!this.state.stamina)this.state=M.syncStamina(this.state,0);
    this.clock.restore(this.state.trustedTime?.lastMs||0);M.setTimeProvider(()=>this.clock.now()??NaN);void this.syncTime();
    try{
      await loadShinyVisuals();
      const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('pc/camp-panorama-v1/texture',Texture2D,(e,t)=>e?reject(e):resolve(t)));
      this.campFrame=new SpriteFrame();this.campFrame.texture=texture;this.campFrame.packable=false;
      const ownedNames=[...(this.state.pets||[]).slice(0,12),...['fox','bud','otter'].map(id=>M.pet(id as M.PetId))].map(p=>this.petName(p)),mapNames=M.MAPS.map(m=>m.name),recipeNames=RECIPES.map(r=>r.name);
      // Dynamic copy is not visible to the static UI extractor. Warm it at its actual display sizes.
      const types=RECIPES.map(r=>r.types.join(' / ')),ingredients=INGREDIENTS.flatMap(i=>FOOD_QUALITY_NAMES.slice(1).map(q=>q+' · '+i.name));
      const dynamicText=[{size:14,texts:ingredients},{size:15,texts:types},{size:16,texts:[...ownedNames,...M.MAPS.map(m=>m.types),...RECIPES.map(r=>cookingReason(newCooking(),r.id,1))]},
        {size:17,texts:[...mapNames,...M.GYMS.map(g=>g.types.join(' · '))]},{size:18,texts:[...mapNames,...types]},{size:20,texts:recipeNames},
        {size:22,texts:[...ownedNames,...mapNames]},{size:25,texts:[...M.GYMS.map(g=>g.name),'总伤害 …']},{size:29,texts:recipeNames},{size:30,texts:mapNames},{size:34,texts:ownedNames}];
      await Promise.all([this.ui.warmText([...PC_TEXT_WARMUP,...dynamicText],view.getScaleX()),this.art.warm(['fox','bud','otter','attack-die-a','battle-start','heal-potion','power-potion','guard-shield',...M.HERO_IDS.map(id=>'hero-'+id),this.battleSceneKey(),...APP_BATTLE_IDS.flatMap(id=>['front','back'].flatMap(side=>APP_BATTLE_POSES.map(pose=>appPoseKey(id,side as 'front'|'back',pose))))])]);
      if(!this.node.isValid)return;
      this.ready=true;this.mapIndex=M.latestUnlockedMap(this.state);this.show(this.state.journey?.stage==='done'?'home':'onboard');void this.save();
      input.on(Input.EventType.KEY_DOWN,this.keyDown,this);input.on(Input.EventType.KEY_UP,this.keyUp,this);game.on(Game.EVENT_HIDE,this.onHide,this);game.on(Game.EVENT_SHOW,this.onShow,this);
      (globalThis as any).__pmPC={ready:true,snapshot:()=>clone(this.state),route:()=>this.route,controls:()=>this.controls(),busy:()=>this.gate.locked,timeReady:()=>this.clock.now()!==null,locale:()=>currentLocale(),setLanguage:(value:string)=>this.changeLanguage(value),resolution:()=>({design:view.getDesignResolutionSize(),visible:view.getVisibleSize(),canvas:view.getCanvasSize(),art:[1672,941]}),version:'pc-mobile-26696982'};
    }catch(e){this.ui.text(this.root,'资源未能加载，请重新启动',800,520,22,PC.red);console.error('PC startup',e);}
  }
  private recoverProfile(initial:PCProfileLoad):Promise<PCProfileLoad>{
    return new Promise(resolve=>{
      const layer=this.ui.node(this.root,'profile-recovery',0,0,1600,900);
      const card=this.ui.panel(layer,800,450,1080,520,PC.paper,255,24);
      this.ui.text(card,'恢复旅行档案',0,-190,34,PC.ink,960,60).isBold=true;
      this.ui.text(card,'本机档案暂时无法读取。原文件会保留，请选择恢复方式。',0,-97,22,PC.muted,940,90);
      const status=this.ui.text(card,initial.error||'存档无法读取',0,6,20,PC.red,940,100);
      const finish=(profile:PCProfileLoad)=>{
        if(profile.readOnly){this.closeDialog(false);status.string=profile.error||'存档无法读取';return;}
        this.closeDialog(false);this.ui.dispose(layer);resolve(profile);
      };
      this.ui.button(card,'recovery-retry','重试读取',-175,157,300,62,()=>finish(loadPCProfile(sys.localStorage)));
      this.ui.button(card,'recovery-new','开始独立新旅程',175,157,300,62,()=>{
        this.dialog('开始独立新旅程','原存档会先保存在本机。','保留原档并开始',()=>finish(startNewPCProfile(sys.localStorage)));
      });
    });
  }
  onDestroy(){input.off(Input.EventType.KEY_DOWN,this.keyDown,this);input.off(Input.EventType.KEY_UP,this.keyUp,this);game.off(Game.EVENT_HIDE,this.onHide,this);game.off(Game.EVENT_SHOW,this.onShow,this);this.kitchen?.dispose();if(this.root?.isValid)this.ui?.stopTree(this.root);this.battleFX?.dispose();this.art.dispose();this.audio?.dispose();this.durable.close();this.campFrame?.destroy();}
  private onHide(){this.hidden=true;this.gate.clearKeys();void this.save();this.clock.suspend();this.audio.pause('hidden');}
  private onShow(){this.hidden=false;this.clock.resume();this.audio.resume('hidden');void this.syncTime();}
  private async syncTime(){
    this.nextSync=performance.now()+30000;
    const ok=await this.clock.sync();
    if(ok){
      this.nextSync=performance.now()+300000;
      this.state=M.syncStamina(this.state);
      if(this.ready){void this.save();this.refreshCounters();}
    }
    return ok;
  }
  private needTime(){if(this.clock.now()!==null)return true;this.dialog('等待联网校时','孵化与交配需要联网校时。战斗和烹饪仍可使用。','重试',async()=>{this.closeDialog();const ok=await this.syncTime();if(ok)this.show(this.route);else this.dialog('暂时无法校时','请检查网络后再试。','返回',()=>this.closeDialog());});return false;}
  private async save(){
    if(!this.state||this.profileReadOnly)return false;
    const checkpoint=this.clock.checkpoint();
    if(checkpoint)this.state.trustedTime={version:1,lastMs:checkpoint};
    const ok=savePCProfile(sys.localStorage,this.state,this.dexBook(),++this.sequence);
    this.saveError=!ok;
    if(this.saveLabel?.isValid){this.saveLabel.string=ok?'':'保存失败 · 请勿退出';this.saveLabel.node.active=!ok;}
    return ok;
  }


  private petName(p:M.Pet){return M.petName(p);}
  private cooking(){this.kitchen=new PCCookingUI({ui:this.ui,parent:this.content,state:()=>this.state.pcCooking||newCooking(),cook:(id,q)=>this.applyCooking(cookMeal(this.state.pcCooking||newCooking(),id,q)),eat:(id,q)=>this.applyCooking(eatMeal(this.state.pcCooking||newCooking(),id,q)),partyTypes:()=>M.homeParty(this.state).filter(Boolean).map(uid=>this.state.pets?.find(p=>p.uid===uid)).filter(Boolean).map(p=>M.PETS[p!.id].type),disabledReason:()=>this.cookingBlocked()});}
  private cookingBlocked(){return this.state.expedition&&this.state.phase==='battle'?'请完成当前战斗后再用餐':this.profileReadOnly?'当前存档不可写入':'';}
  private applyCooking(result:CookingResult){
    const reason=this.cookingBlocked();
    if(reason){this.toast(reason);return false;}
    if(!result.changed){this.toast(result.error||'暂时无法完成料理');return false;}
    const next={...this.state,pcCooking:result.state};
    if(!savePCProfile(sys.localStorage,next,this.dexBook(),++this.sequence)){this.toast('保存失败，材料与食物未消耗');return false;}
    this.state=next;this.refreshCounters();
    this.toast(result.state.active?mealSummary(result.state):'料理已放入餐盒');
    return true;
  }



  private commit(next:M.State){if(next===this.state||this.profileReadOnly)return false;this.dex=recordDex(this.dex,this.state,next);this.state=next;void this.save();this.refreshCounters();return true;}
  update(dt:number){if(!this.ready)return;const now=performance.now();if(!this.hidden&&now>=this.nextSync)void this.syncTime();const frame=view.getFrameSize(),pixels=view.getCanvasSize(),key=frame.width+':'+frame.height+':'+pixels.width+':'+pixels.height;if(key!==this.size)this.layout();
    if(this.textResizeAt&&now>=this.textResizeAt){this.textResizeAt=0;this.ui.refreshTextResolution();}
    if(this.battleHintUntil&&now>=this.battleHintUntil)this.showHint('');
    this.playerReel?.tick(dt);this.enemyReel?.tick(dt);if(this.diceRollToken!==null&&!this.playerReel?.rolling&&!this.enemyReel?.rolling){const token=this.diceRollToken;this.diceRollToken=null;if(this.gate.finish(token))this.syncBattle(this.state);}
    const second=Math.floor(now/1000);if(second!==this.lastSecond){this.lastSecond=second;this.refreshCounters();this.art.sweep();for(const t of this.timers)if(t.label.isValid)t.label.string=t.get();if(second%15===0)void this.save();}
    if(!this.reduced&&!this.gate.locked&&!this.hidden)for(const p of this.idle)if(p.node.isValid){const wave=Math.sin(now*.0015+p.phase);p.node.setScale(1+wave*.002,1+wave*.004,1);}
  }
  private layout(){const frame=view.getFrameSize();view.setDesignResolutionSize(1600,900,ResolutionPolicy.SHOW_ALL);const s=view.getVisibleSize(),pixels=view.getCanvasSize();this.size=frame.width+':'+frame.height+':'+pixels.width+':'+pixels.height;
    // Desktop container resizing can precede the render window update. Keep picking and projection on the same pixels.
    if(this.camera.camera&&(this.camera.camera.width!==pixels.width||this.camera.camera.height!==pixels.height))director.root?.resize(pixels.width,pixels.height);
    const viewport=view.getViewportRect();this.camera.rect=new Rect(viewport.x/pixels.width,viewport.y/pixels.height,viewport.width/pixels.width,viewport.height/pixels.height);
    this.root.setPosition(0,900);this.root.setScale(1,1,1);
    if(sys.isMobile){
      // Fit the same 16:9 scene into the intersection of the viewport and device safe area.
      const safe=sys.getSafeAreaRect(false);
      const left=Math.max(0,safe.x),right=Math.min(1600,safe.x+safe.width);
      const bottom=Math.max(0,safe.y),top=Math.min(900,safe.y+safe.height);
      const scale=Math.min((right-left)/1600,(top-bottom)/900);
      if(scale>0){
        this.root.setScale(scale,scale,1);
        this.root.setPosition((left+right-1600*scale)/2,(bottom+top+900*scale)/2);
      }
    }
    this.camera.node.setPosition(800,450,1000);this.camera.orthoHeight=450;this.textResizeAt=performance.now()+80;
    if(this.background?.isValid){const size=this.background.getComponent(UITransform)!;const k=Math.max(s.width/1672,s.height/941);size.setContentSize(1672*k,941*k);}this.layoutBattleScenery();
  }
  private controls(){const result:any={};for(const [id,c]of this.ui.controls){if(!c.node.isValid||!c.node.activeInHierarchy)continue;const p=c.node.worldPosition,s=view.getVisibleSize();result[id]={x:p.x,y:s.height-p.y,w:c.w,h:c.h,enabled:c.enabled,nodeId:c.node.uuid};}return result;}
  private showHint(text:string,control?:Control,pressed=false){
    this.battleHintUntil=0;
    if(this.route==='battle'){
      if(this.hintPanel?.isValid)this.hintPanel.active=false;
      if(!text||!control?.node.isValid||this.modal||!this.ui.canActivate(control)||!this.shell?.isValid){if(this.battleHint?.isValid)this.battleHint.active=false;return;}
      const point=control.node.worldPosition,x=Math.max(280,Math.min(1320,point.x)),cy=900-point.y,y=cy<180?cy+control.h/2+60:cy-control.h/2-60;
      if(!this.battleHint?.isValid){this.battleHint=this.ui.panel(this.shell,x,y,520,92,PC.navy,248,8);this.battleHint.name='battle-context-hint';this.battleHintText=this.ui.text(this.battleHint,'',0,0,20,'#fff4d5',484,80);}
      this.battleHint.active=true;this.battleHint.setPosition(x,-Math.max(110,Math.min(800,y)));this.battleHintText!.string=text;
      // Native Graphics can discard a mesh hidden before its first frame; redraw after revealing.
      this.ui.surface(this.battleHint,520,92,PC.navy,248,'#83a597',8);
      if(pressed&&!control.hovered)this.battleHintUntil=performance.now()+4000;return;
    }
    if(this.battleHint?.isValid)this.battleHint.active=false;
    if(text&&!this.hintPanel){this.hintPanel=this.ui.hud(this.shell,800,875,960,32,224);this.hint=this.ui.text(this.hintPanel,'',0,0,16,'#eef4e9',930,28);}if(this.hintPanel?.isValid){const reveal=!!text&&!this.hintPanel.active;this.hintPanel.active=!!text;this.hintPanel.setPosition(800,-875);if(reveal)this.ui.surface(this.hintPanel,960,32,PC.navy,224,'',5,false);this.hint!.string=text;}
  }

  private keyDown(e:EventKeyboard){if(!this.gate.keyDown(e.keyCode)||!this.ready)return;if(this.modal){if(e.keyCode===KeyCode.ESCAPE)this.dismissDialog();else if(e.keyCode===KeyCode.ENTER)this.ui.activate('dialog-confirm');return;}
    if(this.closingModal)return;
    if(e.keyCode===KeyCode.ESCAPE){if(this.gate.locked)return;if(this.route==='home'||this.route==='battle')this.settings();else if(this.route!=='onboard')this.show('home');return;}
    if(e.keyCode===KeyCode.ENTER){this.ui.activate(this.route==='battle'&&this.state.phase==='battle'?'attack':'primary');return;}
    const actions:{[key:number]:string}={[KeyCode.DIGIT_1]:'attack',[KeyCode.DIGIT_2]:'guard',[KeyCode.DIGIT_3]:'heal',[KeyCode.DIGIT_4]:'boost'};
    if(this.route==='battle'&&actions[e.keyCode])this.ui.activate(actions[e.keyCode]);
    if(e.keyCode===KeyCode.ARROW_LEFT)this.ui.activate('prev');if(e.keyCode===KeyCode.ARROW_RIGHT)this.ui.activate('next');
  }
  private keyUp(e:EventKeyboard){this.gate.keyUp(e.keyCode);}
  private show(route:Route){if(this.gate.locked)return;this.kitchen?.dispose();this.kitchen=null;this.battleMeal=null;this.closeDialog(false);const old=this.content,changed=route!==this.route;this.previous=this.route;this.route=route;this.timers=[];this.idle=[];this.battleStamp='';this.player=null;this.enemy=null;this.battleFX?.dispose();this.battleFX=null;this.actorPoses.clear();this.actionValues={};this.actionStocks={};this.commandLayer=null;this.actionIcons={};this.diceNode=null;this.diceValue=null;this.shownTurn=-1;
    this.playerReel=null;this.enemyReel=null;this.diceRollToken=null;
    if(route==='map'&&changed)this.mapIndex=this.state.expedition?(this.state.mapId||0):M.latestUnlockedMap(this.state);
    if(this.retiring){this.ui.dispose(this.retiring);this.retiring=null;}
    if(!this.background){for(const n of [...this.root.children])this.ui.dispose(n);const size=view.getVisibleSize(),scale=Math.max(size.width/1672,size.height/941);this.background=this.ui.node(this.root,'pc-panorama',800,450,1672*scale,941*scale);const bg=this.background.addComponent(Sprite);bg.sizeMode=Sprite.SizeMode.CUSTOM;bg.spriteFrame=this.campFrame;this.background.getComponent(UITransform)!.setContentSize(1672*scale,941*scale);
      // Background and navigation remain in place while the page changes.
      for(let i=0;i<32;i++){const width=4000,shade=this.ui.node(this.root,'scene-shade',800,894-i*12,width,12);this.ui.surface(shade,width,12,PC.navy,Math.round(90-i*2.8),'',0);}
      this.shell=this.ui.node(this.root,'desktop-shell',0,0,1600,900);this.header=this.ui.node(this.shell,'navigation',0,0,1600,100);this.effects=this.ui.node(this.root,'effects',0,0,1600,900);
      this.saveLabel=this.ui.text(this.shell,'',1410,876,15,'#eef4e9',260,28,'right');
    }
    for(const n of [...this.effects.children])this.ui.dispose(n);for(const n of [...this.background.children])this.ui.dispose(n);
    if(old?.isValid){this.ui.retire(old);if(changed&&!this.reduced){this.retiring=old;const opacity=old.getComponent(UIOpacity)||old.addComponent(UIOpacity);tween(opacity).to(.10,{opacity:0},{easing:'quadOut'}).call(()=>{this.ui.dispose(old);if(this.retiring===old)this.retiring=null;}).start();}else this.ui.dispose(old);}
    this.content=this.ui.node(this.root,'desktop-page',0,0,1600,900);this.content.setSiblingIndex(this.shell.getSiblingIndex());this.header.active=!['onboard','battle'].includes(route);this.background.active=!['battle'].includes(route);if(route==='battle')this.ensureBattleScene();else if(this.battleWorld){this.ui.dispose(this.battleWorld);this.battleWorld=null;this.battleScenery=null;this.ambient=null;this.sceneKey='';}
    // Native Graphics must reach its first render while active; defer the hidden onboarding shell.
    const mode=route==='home'?'camp':'journal';if(this.header.active&&(this.chromeMode!==mode||['battle'].includes(this.previous))){this.ui.dispose(this.header);this.header=this.ui.node(this.shell,'navigation',0,0,1600,900);this.navMarker=null!;this.chromeMode=mode;}
    if(this.header.active&&!this.navMarker)this.chrome();if(this.navMarker)this.syncNavigation();
    if(!['home','battle','onboard'].includes(route))this.ui.pageBackdrop(this.content);
    if(route==='onboard')this.onboarding();else if(route==='home')this.home();else if(route==='map')this.maps();else if(route==='partners'||route==='dex')this.collection();else if(route==='hatch')this.hatchery();else if(route==='cooking')this.cooking();else if(route==='gyms')this.gyms();else this.battle();
    if(changed||!old)this.ui.present(this.content,this.routeOrder(route)>=this.routeOrder(this.previous)?1:-1);this.showHint('');this.saveLabel!.string=this.saveError?'保存失败 · 请勿退出':'';this.saveLabel!.node.active=this.saveError;this.refreshCounters();this.audio.select(route==='battle'?(M.rankForStage(this.state.step)==='boss'?'battle-boss':M.rankForStage(this.state.step)==='elite'?'battle-elite':'battle-normal'):'camp');
  }
  private routeOrder(route:Route){return ['home','map','partners','hatch','cooking','dex','gyms'].indexOf(route==='battle'?'map':route);}
  private syncNavigation(){if(!this.navMarker)return;const camp=this.route==='home',index=this.routeOrder(this.route);
    for(const [route,title]of [['home','营地'],['map','世界地图'],['partners','我的伙伴'],['hatch','孵化与培育'],['cooking','营地烹饪'],['dex','精灵图鉴'],['gyms','道馆挑战']])this.ui.set('nav-'+route,camp&&route==='home'?'':title,true,'',this.route===route?PC.gold:PC.paper);
    if(index<0||camp)return;const target=new Vec3(120,-(247+index*55),0);Tween.stopAllByTarget(this.navMarker);if(this.reduced||this.previous==='onboard'||this.previous==='home'||this.previous==='battle')this.navMarker.setPosition(target);else tween(this.navMarker).to(.18,{position:target},{easing:'cubicOut'}).start();
  }
  private chrome(){const p=this.header,camp=this.route==='home';
    if(!camp){this.ui.panel(p,120,450,240,1600,'#eeeadd',255,0);this.ui.line(p,240,450,1,PC.line);}
    this.ui.text(p,'DICEKIN',camp?206:120,camp?123:78,camp?43:27,PC.ink,camp?320:210,58).isBold=true;
    this.ui.text(p,camp?'骰子精灵 · 驯兽之旅':'骰子精灵',camp?206:120,camp?176:116,camp?21:15,PC.muted,camp?320:210,34);
    if(camp)this.ui.text(p,'MONSTER  TAMER',206,218,12,PC.green,290,22);
    const links:[Route,string][]=[['home','营地'],['map','世界地图'],['partners','我的伙伴'],['hatch','孵化与培育'],['cooking','营地烹饪'],['dex','精灵图鉴'],['gyms','道馆挑战']];
    links.forEach(([route,title],i)=>{if(camp&&i===0)return;const x=camp?206:120,y=camp?(i===0?74:397+(i-1)*44):224+i*55,w=camp?292:196,h=camp&&i===0?38:44;
      const n=this.ui.button(p,'nav-'+route,camp&&i===0?'':title,x,y,w,h,()=>{if(this.route===route)return;this.page=0;this.selected='';this.show(route);},this.route===route?PC.gold:PC.paper);
      if(!(camp&&i===0))this.ui.glyph(n,route,-w/2+29,0,22,PC.green);
    });
    this.navMarker=this.ui.panel(p,camp?206:120,248,36,3,PC.green,255,0);this.navMarker.active=!camp;
    this.ui.button(p,'settings','设置',camp?206:120,camp?804:800,camp?292:196,44,()=>this.settings(),PC.paper);
    this.mealLabel=this.ui.text(p,'',camp?206:120,camp?852:852,13,PC.muted,camp?292:210,30);this.refreshCounters();
  }
  private refreshCounters(){if(this.mealLabel?.isValid)this.mealLabel.string=this.state.pcCooking?.active?mealSummary(this.state.pcCooking):'';
    if(this.route==='map'&&this.state){const s=this.state,m=M.MAPS[this.mapIndex],continuing=s.expedition&&s.mapId===m.id,unlocked=M.mapUnlocked(s,m.id);this.ui.set('primary',continuing?'继续冒险  →':!unlocked?'通关上一地区后解锁':s.expedition?'请先结束当前冒险':'出发探险  →',unlocked&&(!s.expedition||continuing));}
  }
  private title(value:string,sub=''){this.ui.text(this.content,value,650,96,42,PC.ink,724,62,'left').isBold=true;if(sub)this.ui.text(this.content,sub,650,148,17,PC.muted,724,32,'left');this.ui.line(this.content,920,188,1264);}
  private pet(parent:Node,p:M.Pet,x:number,y:number,size:number,back=false,idle=false){const key=(p.rarity&&p.rarity!=='normal'?M.formKey(p):p.id)+(back?'-back':p.rarity&&p.rarity!=='normal'?'-front':'');
    const holder=this.ui.node(parent,'actor-'+(p.uid||key),x,y,1,1);const image=this.ui.artImage(holder,key,0,-size/2,size,size);if(p.shiny)tintShiny(image.getComponent(Sprite)!);
    if(idle)this.idle.push({node:holder,baseY:-y,phase:this.idle.length*1.7});return holder;
  }
  private home(){const p=this.content,s=this.state,veil=this.ui.node(p,'camp-menu-paper',0,0),g=veil.addComponent(Graphics);
    g.fillColor=hex('#fffaf0',247);g.moveTo(-1400,300);g.lineTo(400,300);g.lineTo(435,-160);g.lineTo(405,-710);g.lineTo(365,-1200);g.lineTo(-1400,-1200);g.close();g.fill();
    g.strokeColor=hex(PC.gold,150);g.lineWidth=2;g.moveTo(418,-200);g.lineTo(390,-720);g.stroke();
    this.ui.artImage(p,'hero-'+(s.journey?.hero||'ranger'),1082,502,300,470);this.ui.shadow(p,1320,740,190,28);this.pet(p,s.active,1320,738,270,false,true);
    this.ui.button(p,'primary',s.expedition?'继续旅程   →':'出发探险   →',206,300,292,68,()=>this.show(s.expedition?'battle':'map'),PC.green);
    this.ui.text(p,s.expedition?M.mapFor(s).name+'  ·  第 '+s.step+' 场':'选择目的地，开始新的冒险',206,350,15,PC.muted,292,26);
  }
  private onboarding(){const p=this.content,hero=this.state.journey?.stage==='hero';this.ui.pageBackdrop(p);this.ui.text(p,'DICEKIN',160,66,24,PC.green,200,36,'left').isBold=true;this.ui.text(p,hero?'你的旅程，由此开始':'选一位伙伴，一起出发',800,127,45,PC.ink,1240,72).isBold=true;this.ui.text(p,hero?'选择旅行者':'每一位伙伴，都有自己的拿手本领',800,184,18,PC.muted,1120,32);
    (hero?M.HERO_IDS:M.STARTERS).forEach((id,i)=>{const x=350+i*450,selected=hero?id===this.selectedHero:id===this.selectedStarter;const card=this.ui.button(p,'choose-'+id,'',x,hero?472:485,390,hero?468:540,()=>{if(hero)this.selectedHero=id as M.HeroId;else this.selectedStarter=id as M.PetId;this.show('onboard');},selected?'#f4dfad':PC.paper);
      this.ui.badge(card,selected?'已选择':'0'+(i+1),0,-196,86,selected?PC.green:'#e9efe7',selected?'#fffaf0':PC.green);
      if(hero){const h=M.HEROES[id as M.HeroId];this.ui.artImage(card,'hero-'+id,0,-35,255,292);this.ui.text(card,h.name,0,133,29).isBold=true;this.ui.text(card,h.effect,0,182,18,PC.muted,330,52);}
      else{const pet=M.pet(id as M.PetId);this.pet(card,pet,0,60,265);this.ui.text(card,this.petName(pet),0,100,29).isBold=true;this.ui.text(card,M.PETS[pet.id].type+' · '+M.skillFor(pet).name,0,140,18,PC.muted,330,36);
        this.ui.text(card,id==='fox'?'攻击起伏大，低点时防御':id==='bud'?'擅长恢复，受伤后及时治疗':'更耐打，适合初次冒险',0,184,19,PC.green,330,58);
        this.ui.line(card,0,221,330,PC.gold);const attack=this.ui.node(card,'starter-attack',0,245,340,38);this.ui.artImage(attack,'attack-die-a',-145,0,38);this.ui.text(attack,'攻击点数',-76,0,16,PC.ink,92,30,'left');new PCDiceReel(this.ui,attack,77,0,170,32,null).set(M.naturalPetFaces(pet.id),null);}
    });this.ui.button(p,'primary',hero?'确认旅行者   →':'一起出发   →',800,800,390,62,()=>{this.commit(hero?M.chooseHero(this.state,this.selectedHero):M.chooseStarter(this.state,this.selectedStarter));this.show(hero?'onboard':'home');},PC.green);
  }

  private maps(){const p=this.content,s=this.state;this.title('世界探险','每一次相遇，都值得收藏');
    const compact=M.MAPS.length>12,cardH=compact?104:124,rowStep=compact?116:143,firstY=compact?260:274;
    M.MAPS.forEach((map,i)=>{const x=393+(i%3)*224,y=firstY+Math.floor(i/3)*rowStep,unlocked=M.mapUnlocked(s,i),selected=i===this.mapIndex;const n=this.ui.button(p,'map-'+i,'',x,y,208,cardH,()=>{if(this.mapIndex===i)return;const previous=this.mapIndex;this.mapIndex=i;this.ui.set('map-'+previous,'',true,'',PC.paper);this.ui.set('map-'+i,'',true,'','#f4dfad');this.mapDetail();},selected?'#f4dfad':PC.paper);
      this.ui.text(n,String(i+1).padStart(2,'0'),-70,compact?-29:-36,14,PC.muted,42,24,'left');this.pet(n,M.pet(map.pets[0]),57,compact?17:27,compact?62:78);const name=this.ui.text(n,map.name,-2,compact?31:37,18,PC.ink,184,28,'left');name.isBold=true;name.node.name='map-name-'+i;this.ui.text(n,s.clearedMaps?.includes(i)?'已探索':unlocked?'可出发':'待解锁',-43,compact?-2:-1,13,unlocked?PC.green:PC.muted,100,25,'left');});
    this.mapDetail();
  }
  private mapDetail(){const s=this.state,m=M.MAPS[this.mapIndex],key=pcMapScene(m.id),old=this.content.getChildByName('map-detail');if(old)this.ui.dispose(old);this.idle=this.idle.filter(p=>p.node.isValid&&p.node.activeInHierarchy);const card=this.ui.panel(this.content,1274,505,464,594,PC.paper,255,20);card.name='map-detail';this.ui.cropImage(card,key,0,-146,432,258);
    this.ui.badge(card,'# '+String(m.id+1).padStart(2,'0'),-127,-253,150,PC.paper,PC.green);
    this.ui.text(card,m.name,0,20,30,PC.ink,410,46,'left').isBold=true;this.ui.text(card,m.types,0,61,16,PC.muted,410,36,'left');
    m.pets.slice(0,6).forEach((id,i)=>this.pet(card,M.pet(id),-171+i*68,145,65));
    this.ui.text(card,'10 场遭遇 · 精英与首领可寻蛋',0,185,15,PC.muted,410,46);
    const continuing=s.expedition&&s.mapId===m.id,available=M.mapUnlocked(s,m.id)&&(!s.expedition||continuing),label=continuing?'继续冒险  →':!M.mapUnlocked(s,m.id)?'通关上一地区后解锁':s.expedition?'请先结束当前冒险':'出发探险  →';
    this.ui.button(card,'primary',label,0,247,408,54,()=>{if(continuing){this.show('battle');return;}if(this.commit(M.enterExpedition(this.state,m.id)))this.show('battle');},PC.green,available);
  }
  private collection(){const p=this.content,s=this.state,dex=this.route==='dex';this.title(dex?'精灵图鉴':'我的伙伴',dex?'每一次相遇，都值得收藏':'查看伙伴，安排你的冒险队伍');
    const party=dex?[]:M.homeParty(s),pets=s.pets||[];
    const collected=new Set(this.dexBook().collected);
    const known=(pet:M.Pet)=>!dex||collected.has(dexKey(pet));
    const items:M.Pet[]=dex?DEX_SPECIES.flatMap(id=>M.RARITIES.map(rarity=>({...M.pet(id),rarity,shiny:this.dexShiny}))):[...party.map(uid=>pets.find(pet=>pet.uid===uid)).filter((pet):pet is M.Pet=>!!pet),...pets.filter(pet=>!party.includes(pet.uid!))];
    if(dex)this.dexProgressButton();
    if(dex)this.ui.button(p,'shiny-filter',this.dexShiny?'★ 闪光形态':'普通形态',1410,126,224,42,()=>{this.dexShiny=!this.dexShiny;this.show('dex');},PC.paper);
    const pageSize=12,pages=Math.max(1,Math.ceil(items.length/pageSize));this.page=Math.max(0,Math.min(this.page,pages-1));const selected=items.find(v=>(dex?M.formKey(v):v.uid)===this.selected)||items[this.page*pageSize];if(selected)this.selected=dex?M.formKey(selected):selected.uid!;
    items.slice(this.page*pageSize,(this.page+1)*pageSize).forEach((pet,i)=>{const x=381+(i%3)*196,y=(dex?277:265)+Math.floor(i/3)*(dex?132:148),id=dex?M.formKey(pet):pet.uid!,n=this.ui.button(p,'pet-'+id,'',x,y,180,dex?118:138,()=>this.selectCollection(pet,dex,known(pet)),id===this.selected?'#f4dfad':PC.paper);if(!known(pet)){this.ui.text(n,'?',0,0,44,PC.muted,150,74).isBold=true;return;}this.pet(n,pet,0,dex?29:34,dex?84:76);this.ui.text(n,this.petName(pet),0,dex?42:52,16,PC.ink,160,26).isBold=true;this.ui.text(n,M.rarityName(pet.rarity),-62,dex?-38:-53,12,PC.green,34,23);if(pet.shiny)this.ui.text(n,'★',62,dex?-38:-53,14,'#b78b35',25,23);const slot=party.indexOf(pet.uid!);if(slot>=0){const tag=this.ui.panel(n,0,-53,86,22,slot===0?PC.green:PC.navy,255,7);tag.name='party-role-'+id;this.ui.text(tag,slot===0?'领队':'候补 '+slot,0,0,13,'#fffdf2',80,20).isBold=true;}});
    if(!dex&&items.length<=6){const y=items.length<=3?565:635;this.ui.text(p,'当前队伍',577,y-118,22,PC.ink,572,34,'left').isBold=true;const party=M.homeParty(s);[0,1,2].forEach(i=>{const q=party[i]?M.petEntry(s,party[i]):null,card=this.ui.panel(p,381+i*196,y,180,174,'#edf0e5',255,18);this.ui.text(card,i===0?'领队':'候补 '+i,0,-65,13,PC.green,148,24);if(q){this.pet(card,q,0,42,100);this.ui.text(card,this.petName(q),0,64,16,PC.ink,164,26);}else{this.ui.text(card,'＋',0,-3,36,'#a9b8a7',100,52);this.ui.text(card,'待安排',0,55,15,PC.muted,148,28);}});}
    this.ui.button(p,'prev','←',320,dex?787:820,56,40,()=>{this.page--;this.selected='';this.show(this.route);},PC.paper,this.page>0);
    this.ui.text(p,(this.page+1)+' / '+pages+'    ·    '+items.length+(dex?' 种形态':' 位伙伴'),577,dex?787:820,16,PC.muted,390,30);
    this.ui.button(p,'next','→',835,dex?787:820,56,40,()=>{this.page++;this.selected='';this.show(this.route);},PC.paper,this.page<pages-1);
    if(!selected){this.ui.text(p,'孵化第一枚蛋，认识新的伙伴',1190,460,24,PC.muted,500,100);return;}
    this.collectionDetail(selected,dex,known(selected));
  }
  private dexBook(){this.dex=recordDex(this.dex,this.state);return this.dex;}
  private dexProgressButton(){
    const book=this.dexBook(),count=book.collected.length,ready=DEX_REWARDS.some(r=>count>=r.required&&!book.claimed.includes(r.id));
    const n=this.ui.button(this.content,'dex-rewards','',1100,126,330,64,()=>this.openDexRewards(),ready?PC.gold:PC.paper);
    this.ui.text(n,'收集奖励',-67,-8,19,PC.ink,164,30).isBold=true;this.ui.text(n,count+' / '+DEX_TOTAL,91,-8,21,PC.green,120,30).isBold=true;
    this.ui.panel(n,0,20,290,5,'#cdd8c9',255,2);const width=Math.max(1,290*count/DEX_TOTAL);this.ui.panel(n,-145+width/2,20,width,5,PC.green,255,2);
  }
  private openDexRewards(){
    this.closeDialog(false);this.dexRewards=new PCDexRewardsUI({ui:this.ui,root:this.root,book:()=>this.dexBook(),close:()=>this.closeDialog(),egg:(...args)=>this.egg(...args),claim:id=>this.claimDexMilestone(id)});
    this.modal=this.dexRewards.layer;this.modalDismiss=()=>this.closeDialog();
  }
  private claimDexMilestone(id:number){
    if(this.profileReadOnly||this.gate.locked)return false;
    const result=claimDexReward(this.state,this.dexBook(),id);if(!result.changed)return false;
    if(!savePCProfile(sys.localStorage,result.game,result.book,++this.sequence)){this.toast('保存失败，奖励尚未领取，请重试');return false;}
    this.state=result.game;this.dex=result.book;this.toast('获得 1 枚宠物蛋');
    const ready=DEX_REWARDS.some(r=>result.book.collected.length>=r.required&&!result.book.claimed.includes(r.id));this.ui.set('dex-rewards','',true,'',ready?PC.gold:PC.paper);this.audio.effect('hatch');return true;
  }
  private selectCollection(q:M.Pet,dex:boolean,known:boolean){const id=dex?M.formKey(q):q.uid!;if(this.selected===id)return;this.selected=id;for(const [key]of this.ui.controls)if(key.startsWith('pet-'))this.ui.set(key,'',true,'',key==='pet-'+id?'#f4dfad':PC.paper);this.collectionDetail(q,dex,known);}
  private collectionDetail(q:M.Pet,dex:boolean,known:boolean){const s=this.state,party=dex?[]:M.homeParty(s),old=this.content.getChildByName('collection-detail');if(old)this.ui.dispose(old);this.idle=this.idle.filter(p=>p.node.isValid&&p.node.activeInHierarchy);const detail=this.ui.panel(this.content,1230,507,584,598,PC.paper,255,24);detail.name='collection-detail';
    if(!known){this.ui.text(detail,'?',0,-20,120,PC.muted,500,180).isBold=true;this.ui.badge(detail,'尚未收集',0,254,180,'#eceee7',PC.muted);return;}
    this.ui.text(detail,this.petName(q),0,-253,34,PC.ink,520,50,'left').isBold=true;
    this.ui.text(detail,M.PETS[q.id].type+' · '+M.rarityName(q.rarity)+(q.sex?' · '+M.sexSymbol(q.sex):'')+(q.shiny?' · 闪光':''),0,-211,16,PC.muted,520,32,'left');
    const orb=this.ui.node(detail,'portrait-halo',0,-65),g=orb.addComponent(Graphics);g.fillColor=hex('#e7eee0');g.circle(0,0,135);g.fill();g.strokeColor=hex('#ccd9bc');g.lineWidth=1;g.circle(0,0,146);g.stroke();this.ui.shadow(detail,0,65,210,24);this.pet(detail,q,0,65,265);
    this.ui.line(detail,0,92,520);this.ui.text(detail,'生命',-195,124,14,PC.muted,100,24);this.ui.text(detail,String(M.petBaseHP(q)),-195,153,27,PC.ink,100,38).isBold=true;
    this.ui.text(detail,'攻击点数',82,124,14,PC.muted,320,24);this.ui.text(detail,M.petAttackFaces(q).join('   /   '),82,153,24,PC.ink,320,38).isBold=true;
    const codes=M.petSkills(q);this.ui.text(detail,'技能 ×'+codes.length,-86,198,20,PC.green,336,32,'left');
    this.ui.button(detail,'skill-details','详情',185,198,142,38,()=>this.showSkills(q));
    if(dex)this.ui.badge(detail,'已收集',0,254,180,'#e1eddf',PC.green);
    else{const available=M.canManageParty(s)&&!M.isBreedingPet(s,q.uid!);this.ui.text(detail,!available?'战斗或交配期间无法调整队伍':'安排队伍',0,232,13,PC.muted,520,22);[0,1,2].forEach(i=>{const inSlot=party[i]===q.uid;this.ui.button(detail,'assign-'+i,inSlot?(i===0?'当前领队':'下阵'):i===0?'设为领队':'候补 '+i,-177+i*177,270,165,40,()=>{if(this.commit(inSlot&&i>0?M.removePartySlot(this.state,i):M.assignPartySlot(this.state,q.uid!,i))){this.page=0;this.selected=q.uid!;}this.show('partners');},PC.green,available&&!(inSlot&&i===0));});}
  }
  private showSkills(p:M.Pet,page=0){this.showSkillCodes(M.petSkills(p),page);}
  private showSkillCodes(codes:M.SkillCode[],page=0,title='技能'){const pages=Math.max(1,Math.ceil(codes.length/2)),details=codes.slice(page*2,page*2+2).map(c=>M.SKILLS[c][0]+'\n'+M.SKILLS[c][1]).join('\n\n');this.dialog(title+'  '+(page+1)+' / '+pages,details,page<pages-1?'下一页':'知道了',()=>page<pages-1?this.showSkillCodes(codes,page+1,title):this.closeDialog());}
  private egg(parent:Node,rarity:M.EggRarity,x:number,y:number,size=95){const n=this.ui.node(parent,'egg',x,y,size,size*1.2),g=n.addComponent(Graphics),base=rarity==='SSR'?'#f4d17a':rarity==='SR'?'#b6d8d2':'#e2e8bc';g.fillColor=hex('#fff8da');g.ellipse(0,0,size*.36,size*.47);g.fill();g.strokeColor=hex(base);g.lineWidth=5;g.stroke();g.fillColor=hex(base);for(const[a,b,r]of[[-.12,.14,.1],[.12,-.12,.13],[-.15,-.25,.08]]){g.circle(a*size,b*size,r*size);g.fill();}return n;}
  private time(ms:number){if(!Number.isFinite(ms))return '等待联网校时';if(ms<=0)return '已完成 · 点击领取';const seconds=Math.ceil(ms/1000);return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
  private hatchery(){this.eggChoices.clear();this.nestChoices.clear();this.eggChoiceSummary=null;const p=this.content;this.title(this.hatchTab==='breed'?'交配培育':'孵化屋',this.hatchTab==='breed'?'让新的伙伴，加入你的旅程':'选择宠物蛋 → 放入宠物蛋 → 领取伙伴');this.ui.button(p,'hatch-tab','孵化',1228,125,140,42,()=>{if(this.hatchTab==='hatch')return;this.hatchTab='hatch';this.show('hatch');},this.hatchTab==='hatch'?PC.green:PC.paper);this.ui.button(p,'breed-tab','交配',1392,125,160,42,()=>{if(this.hatchTab==='breed')return;this.hatchTab='breed';this.show('hatch');},this.hatchTab==='breed'?PC.green:PC.paper);
    if(this.hatchTab==='breed'){this.breeding();return;}
    const available=M.availableEggs(this.state),chosen=available.find(e=>e.id===this.selectedEgg);if(!chosen)this.selectedEgg='';
    [0,1].forEach(i=>{const slot=this.state.incubators?.[i],egg=slot?this.state.eggs?.find(e=>e.id===slot.eggId):null,n=this.ui.panel(p,476+i*370,500,340,568,PC.paper,255,22);
      this.ui.badge(n,'孵化位 0'+(i+1),0,-239,230);const halo=this.ui.node(n,'nest-light',0,-34),g=halo.addComponent(Graphics);g.fillColor=hex('#ebefdc');g.circle(0,0,111);g.fill();g.strokeColor=hex('#d2ddbf');g.circle(0,0,124);g.stroke();
      if(slot&&egg){this.egg(n,egg.rarity,0,-54,155);this.ui.text(n,(M.PETS[egg.affinity].type+' · '+M.rarityName(egg.rarity)),0,89,21,PC.ink,296,36);const timer=this.ui.text(n,this.time(M.hatchRemaining(slot)),0,141,29,PC.green,296,46);this.timers.push({label:timer,get:()=>{const current=this.state.incubators?.[i],left=current?M.hatchRemaining(current):0;this.ui.set('claim-'+i,left===0?'领取伙伴':'孵化中',left===0,Number.isFinite(left)?'':'等待联网校时');return this.time(left);}});
        this.ui.button(n,'claim-'+i,M.hatchRemaining(slot)===0?'领取伙伴':'孵化中',0,224,284,54,()=>this.hatchAction(i),PC.green,M.hatchRemaining(slot)===0,Number.isFinite(M.hatchRemaining(slot))?'':'等待联网校时');
      }else{this.ui.glyph(n,'hatch',0,-35,76,PC.green);this.ui.text(n,'等待一枚蛋',0,92,25,PC.ink,296,44).isBold=true;this.nestChoices.set(i,this.ui.text(n,chosen?(M.PETS[chosen.affinity].type+' · '+M.rarityName(chosen.rarity)):'先从右侧蛋袋中选择',0,139,17,PC.muted,296,32));this.ui.button(n,'incubate-'+i,'放入宠物蛋',0,224,284,54,()=>{if(!this.selectedEgg){this.toast('先从右侧蛋袋中选择');return;}if(!this.needTime())return;if(this.commit(M.startIncubation(this.state,this.selectedEgg,i))){this.selectedEgg='';this.show('hatch');}},PC.green,!!this.selectedEgg,'请先在蛋袋选中一枚蛋');}
    });
    this.ui.text(p,'我的蛋袋  '+available.length,1300,235,25,PC.ink,400,42,'left').isBold=true;const eggs=available,pages=Math.max(1,Math.ceil(eggs.length/6));this.page=Math.max(0,Math.min(this.page,pages-1));
    eggs.slice(this.page*6,this.page*6+6).forEach((egg,i)=>{const selected=egg.id===this.selectedEgg,n=this.ui.button(p,'egg-'+egg.id,'',1189+(i%2)*205,326+Math.floor(i/2)*130,188,114,()=>this.selectEgg(egg.id),selected?'#f4dfad':PC.paper);this.egg(n,egg.rarity,0,-14,65);const index=String(this.page*6+i+1).padStart(2,'0'),label=this.ui.text(n,selected?'✓':index,-65,-35,15,PC.green,30,24);this.eggChoices.set(egg.id,{label,index});this.ui.text(n,(M.PETS[egg.affinity].type+' · '+M.rarityName(egg.rarity)),0,38,16,PC.ink,170,28);});
    this.eggChoiceSummary=this.ui.text(p,chosen?'已选择 · '+M.PETS[chosen.affinity].type+' · '+M.rarityName(chosen.rarity):'',1290,691,19,PC.green,392,60);
    if(!eggs.length){this.ui.glyph(p,'hatch',1290,430,70,PC.muted);this.ui.text(p,'蛋袋还是空的',1290,514,25,PC.ink,390,45);this.ui.text(p,'探险中击败精英与首领，\n就有机会带回宠物蛋。',1290,578,18,PC.muted,350,72);}
    if(pages>1){this.ui.button(p,'prev','←',1200,797,64,40,()=>{this.page--;this.show('hatch');},PC.paper,this.page>0);this.ui.text(p,(this.page+1)+' / '+pages,1300,797,16,PC.muted,110,30);this.ui.button(p,'next','→',1400,797,64,40,()=>{this.page++;this.show('hatch');},PC.paper,this.page<pages-1);}if(this.state.pendingHatch)this.showHatched();
  }

  private hatchAction(index:number){
    const slot=this.state.incubators?.[index];
    if(!slot||!this.needTime()||M.hatchRemaining(slot)>0)return;
    if(this.commit(M.claimHatch(this.state,index)))this.show('hatch');
  }
  private breedingAction(){
    const task=this.state.breeding;
    if(!task||!this.needTime()||task.readyAt>M.gameNow())return;
    this.dialog('领取宠物蛋','领取后父母会离开队伍，遗传宠物蛋进入蛋袋。此操作不可撤销。','确认领取',()=>{if(this.commit(M.claimBreeding(this.state)))this.show('hatch');});
  }

  private showHatched(){const result=this.state.pendingHatch;if(!result)return;const pet=this.state.pets?.find(p=>p.uid===result.uid),finish=(route:Route)=>{this.commit(M.acknowledgeHatch(this.state));this.closeDialog();this.selected=result.uid||'';this.show(route);};this.dialog('新伙伴诞生！','','欢迎加入',()=>finish('partners'),()=>finish('hatch'));if(pet&&this.modal){this.pet(this.modal,pet,800,510,145);this.ui.text(this.modal,this.petName(pet),800,535,22,PC.green,600,32);}}
  private selectEgg(id:string){const egg=M.availableEggs(this.state).find(e=>e.id===id);if(!egg||id===this.selectedEgg)return;this.selectedEgg=id;const name=M.PETS[egg.affinity].type+' · '+M.rarityName(egg.rarity);for(const [key,choice]of this.eggChoices){this.ui.set('egg-'+key,'',true,'',key===id?'#f4dfad':PC.paper);choice.label.string=key===id?'✓':choice.index;}for(const [slot,label]of this.nestChoices){label.string=name;this.ui.set('incubate-'+slot,'放入宠物蛋',true);}if(this.eggChoiceSummary?.isValid)this.eggChoiceSummary.string='已选择 · '+name;}
  private breeding(){const p=this.content,s=this.state,b=s.breeding;
    if(b){const n=this.ui.panel(p,918,497,1232,566,PC.paper,255,24);this.ui.badge(n,'培育进行中',0,-235,176);this.pet(n,M.petEntry(s,b.mother),-350,63,245);this.pet(n,M.petEntry(s,b.father),350,63,245);this.egg(n,b.genes.rarity,0,-45,127);const timer=this.ui.text(n,this.time(b.readyAt-M.gameNow()),0,90,31,PC.green,420,50);this.timers.push({label:timer,get:()=>{const left=(this.state.breeding?.readyAt??0)-M.gameNow();this.ui.set('primary',left<=0?'领取宠物蛋':'培育进行中',left<=0,Number.isFinite(left)?'':'等待联网校时');return this.time(left);}});
      this.ui.text(n,'领取后父母会离开队伍，留下遗传宠物蛋',0,159,17,PC.muted,1000,34);this.ui.button(n,'primary',b.readyAt<=M.gameNow()?'领取宠物蛋':'培育进行中',0,226,360,54,()=>this.breedingAction(),PC.green,b.readyAt<=M.gameNow(),Number.isFinite(M.gameNow())?'':'等待联网校时');return;}
    const eligible=(s.pets||[]).filter(pet=>pet.uid!==s.active.uid),mothers=eligible.filter(v=>v.sex==='female'),fathers=eligible.filter(v=>v.sex==='male');if(!mothers.some(v=>v.uid===this.mother))this.mother=mothers[0]?.uid||'';if(!fathers.some(v=>v.uid===this.father))this.father=fathers[0]?.uid||'';
    const groups=[{list:mothers,id:'mother',selected:this.mother,title:'母亲'},{list:fathers,id:'father',selected:this.father,title:'父亲'}];groups.forEach((group,j)=>{const n=this.ui.panel(p,604+j*628,412,592,394,PC.paper,255,22);n.name='breeding-'+group.id;this.ui.badge(n,group.title,-202,-163,116);const pet=group.list.find(v=>v.uid===group.selected);if(pet){
      this.ui.text(n,this.petIdentity(pet),83,-155,21,PC.ink,366,38,'left').isBold=true;this.ui.text(n,M.rarityName(pet.rarity)+' · '+M.sexSymbol(pet.sex!),83,-118,16,PC.muted,366,28,'left');this.pet(n,pet,-184,70,172);
      this.ui.text(n,'生命 '+M.petBaseHP(pet),83,-71,20,PC.green,366,32,'left');this.ui.text(n,'攻击点数',83,-34,16,PC.muted,366,28,'left');new PCDiceReel(this.ui,n,83,1,338,34,null).set(M.petAttackFaces(pet,true),null);
      this.ui.text(n,M.petSkills(pet).map(c=>M.SKILLS[c][0]).join(' · '),83,67,17,PC.ink,366,74,'left');this.ui.button(n,group.id+'-skills','技能 ×'+M.petSkills(pet).length,142,150,240,44,()=>this.showSkills(pet));
      this.ui.button(n,group.id+'-cycle','选择伙伴',-142,150,240,44,()=>this.breedingPicker(j===0?'mother':'father'),PC.paper,group.list.length>1);
    }else{this.ui.glyph(n,'partners',0,-10,70,PC.muted);this.ui.text(n,'没有符合条件的伙伴\n领队不能参与交配',0,97,20,PC.muted,490,100);}});
    const mother=mothers.find(v=>v.uid===this.mother),father=fathers.find(v=>v.uid===this.father);if(mother&&father)this.breedingPreview(p,mother,father);
    this.ui.text(p,'完成并领取后，父母会离开队伍，留下遗传宠物蛋。',918,790,16,PC.muted,1200,30);this.ui.button(p,'primary','开始交配',918,838,360,50,()=>{if(!this.needTime())return;this.dialog('确认交配',this.petIdentity(mother!)+' + '+this.petIdentity(father!)+'\n完成并领取后将消耗这两位父母。确认开始？','确认开始',()=>{this.commit(M.startBreeding(this.state,this.mother,this.father));this.show('hatch');});},PC.green,!!mother&&!!father);
  }
  private breedingCandidates(role:'mother'|'father'){return (this.state.pets||[]).filter(p=>p.uid!==this.state.active.uid&&p.sex===(role==='mother'?'female':'male'));}
  private selectBreedingParent(role:'mother'|'father',uid:string){const pet=this.breedingCandidates(role).find(p=>p.uid===uid);if(pet&&!this.state.breeding){if(role==='mother')this.mother=uid;else this.father=uid;}this.closeDialog();this.show('hatch');}
  private breedingPicker(role:'mother'|'father',page=0,type='',skill=''){
    const candidates=this.breedingCandidates(role),items=candidates.filter(p=>(!type||M.PETS[p.id].type===type)&&(!skill||M.petSkills(p).includes(skill))),pages=Math.max(1,Math.ceil(items.length/8));page=Math.max(0,Math.min(page,pages-1));
    this.dialog(role==='mother'?'母亲':'父亲','','返回',()=>this.closeDialog());const layer=this.modal!,old=layer.children[layer.children.length-1];this.ui.dispose(old);
    const card=this.ui.panel(layer,800,450,1336,800,PC.paper,255,22);this.ui.text(card,(role==='mother'?'母亲':'父亲')+' · 选择伙伴',0,-354,30,PC.ink,1200,48).isBold=true;
    this.ui.button(card,'breed-filter-type','筛选属性 · '+(type||'全部'),-390,-293,440,64,()=>this.breedingFilter(role,'type',page,type,skill),type? '#f4dfad':PC.paper);
    this.ui.button(card,'breed-filter-skill','筛选技能 · '+(skill?M.SKILLS[skill][0]:'全部'),210,-293,680,64,()=>this.breedingFilter(role,'skill',page,type,skill),skill? '#f4dfad':PC.paper);
    items.slice(page*8,page*8+8).forEach((pet,i)=>{const uid=pet.uid!,chosen=uid===(role==='mother'?this.mother:this.father),n=this.ui.button(card,'breed-pick-'+uid,'',-312+i%2*624,-188+Math.floor(i/2)*146,594,134,()=>this.selectBreedingParent(role,uid),chosen?'#f4dfad':PC.paper);
      this.pet(n,pet,-235,40,100);this.ui.text(n,this.petIdentity(pet),45,-43,19,PC.ink,404,32,'left').isBold=true;this.ui.text(n,M.PETS[pet.id].type+' · '+M.rarityName(pet.rarity)+' · '+M.sexSymbol(pet.sex!),20,-12,16,PC.muted,354,26,'left');
      this.ui.text(n,'生命 '+M.petBaseHP(pet),-122,22,16,PC.green,112,28,'left');this.ui.artImage(n,'attack-die-a',-48,22,28);this.ui.text(n,M.petAttackFaces(pet,true).join(' / '),50,22,18,PC.ink,150,28);this.ui.text(n,'技能 ×'+M.petSkills(pet).length,-55,51,16,PC.muted,230,26,'left');
      this.ui.button(n,'breed-details-'+uid,'详情',222,36,106,46,()=>this.breedingDetails(role,uid,page,type,skill));
    });
    if(!items.length)this.ui.text(card,'没有符合条件的伙伴',0,0,24,PC.muted,1100,100);
    this.ui.button(card,'breed-picker-prev','←',-180,354,72,44,()=>this.breedingPicker(role,page-1,type,skill),PC.paper,page>0);this.ui.text(card,(page+1)+' / '+pages+' · '+items.length+' 位伙伴',0,354,18,PC.muted,280,34);this.ui.button(card,'breed-picker-next','→',180,354,72,44,()=>this.breedingPicker(role,page+1,type,skill),PC.paper,page<pages-1);this.ui.button(card,'dialog-confirm','返回',490,354,232,48,()=>this.closeDialog(),PC.green);
  }
  private breedingFilter(role:'mother'|'father',kind:'type'|'skill',returnPage:number,type:string,skill:M.SkillCode|string,page=0){
    const candidates=this.breedingCandidates(role),values=kind==='type'?Array.from(new Set(candidates.map(p=>M.PETS[p.id].type))):Array.from(new Set(candidates.filter(p=>!type||M.PETS[p.id].type===type).flatMap(p=>M.petSkills(p)))),options=['',...values],size=kind==='type'?20:10,pages=Math.max(1,Math.ceil(options.length/size));page=Math.max(0,Math.min(page,pages-1));
    const back=()=>this.breedingPicker(role,returnPage,type,skill);this.dialog(kind==='type'?'筛选属性':'筛选技能','','返回',back,back);const layer=this.modal!,old=layer.children[layer.children.length-1];this.ui.dispose(old);const card=this.ui.panel(layer,800,450,1000,740,PC.paper,255,22);this.ui.text(card,kind==='type'?'筛选属性':'筛选技能',0,-315,30,PC.ink,900,48).isBold=true;
    options.slice(page*size,page*size+size).forEach((value,i)=>{const columns=kind==='type'?4:2,x=kind==='type'?-345+i%4*230:-230+i%2*460,selected=value===(kind==='type'?type:skill);this.ui.button(card,'breed-'+kind+'-select-'+(value||'all'),value?(kind==='type'?value:M.SKILLS[value][0]):'全部',x,-220+Math.floor(i/columns)*96,kind==='type'?216:444,kind==='type'?68:76,()=>kind==='type'?this.breedingPicker(role,0,value,''):this.breedingPicker(role,0,type,value),selected?'#f4dfad':PC.paper);});
    if(pages>1){this.ui.button(card,'breed-filter-prev','←',-150,252,72,42,()=>this.breedingFilter(role,kind,returnPage,type,skill,page-1),PC.paper,page>0);this.ui.text(card,(page+1)+' / '+pages,0,252,18,PC.muted,150,32);this.ui.button(card,'breed-filter-next','→',150,252,72,42,()=>this.breedingFilter(role,kind,returnPage,type,skill,page+1),PC.paper,page<pages-1);}this.ui.button(card,'breed-filter-back','返回',0,315,340,48,back,PC.green);
  }
  private breedingDetails(role:'mother'|'father',uid:string,page:number,type:string,skill:M.SkillCode|string,skillPage=0){
    const pet=this.breedingCandidates(role).find(p=>p.uid===uid);if(!pet){this.breedingPicker(role,page,type,skill);return;}const codes=M.petSkills(pet);skillPage=Math.max(0,Math.min(skillPage,codes.length-1));const code=codes[skillPage],back=()=>this.breedingPicker(role,page,type,skill);
    this.dialog(this.petIdentity(pet),'','选择伙伴',()=>this.selectBreedingParent(role,uid),back);const layer=this.modal!,old=layer.children[layer.children.length-1];this.ui.dispose(old);const card=this.ui.panel(layer,800,450,1060,740,PC.paper,255,22);this.ui.text(card,this.petIdentity(pet),0,-315,30,PC.ink,940,48).isBold=true;this.ui.text(card,M.PETS[pet.id].type+' · '+M.rarityName(pet.rarity)+' · '+M.sexSymbol(pet.sex!),0,-264,20,PC.muted,940,34);
    this.pet(card,pet,-350,50,220);this.ui.text(card,'生命 '+M.petBaseHP(pet),-350,90,22,PC.green,280,40);this.ui.text(card,'攻击点数',-350,140,16,PC.muted,280,30);new PCDiceReel(this.ui,card,-350,180,240,38,null).set(M.petAttackFaces(pet,true),null);
    this.ui.text(card,'技能 '+(skillPage+1)+' / '+codes.length,160,-200,24,PC.ink,600,40).isBold=true;this.ui.text(card,M.SKILLS[code][0]+'\n\n'+M.SKILLS[code][1],160,-30,21,PC.muted,600,240,'left');this.ui.button(card,'breed-detail-prev','←',20,160,72,44,()=>this.breedingDetails(role,uid,page,type,skill,skillPage-1),PC.paper,skillPage>0);this.ui.button(card,'breed-detail-next','→',300,160,72,44,()=>this.breedingDetails(role,uid,page,type,skill,skillPage+1),PC.paper,skillPage<codes.length-1);
    this.ui.button(card,'breed-detail-back','返回',-260,315,400,54,back,PC.paper);this.ui.button(card,'dialog-confirm','选择伙伴',260,315,400,54,()=>this.selectBreedingParent(role,uid),PC.green);
  }
  private petIdentity(p:M.Pet){return '#'+String((this.state.pets||[]).findIndex(v=>v.uid===p.uid)+1).padStart(3,'0')+' '+this.petName(p);}
  private breedingPreview(parent:Node,mother:M.Pet,father:M.Pet){const n=this.ui.panel(parent,918,697,1232,140,PC.paper,255,18);n.name='breeding-preview';const mr=M.RARITIES.indexOf(mother.rarity||'normal'),fr=M.RARITIES.indexOf(father.rarity||'normal'),forms=mr===fr?[mother,father]:[mr>fr?mother:father],pool=Array.from(new Set([...M.petSkills(mother),...M.petSkills(father)]));
    this.ui.text(n,'♥ 父母遗传',-446,-43,20,PC.green,286,32,'left').isBold=true;
    this.ui.text(n,forms.map(p=>this.petName(p)+' '+M.rarityName(p.rarity)+' '+(forms.length===2?'50%':'100%')).join(' / '),80,-43,19,PC.ink,742,34,'left');
    this.ui.text(n,'生命 '+M.petBaseHP(mother)+' / '+M.petBaseHP(father)+' · 50% / 50%',-330,-3,17,PC.ink,520,30,'left');
    this.ui.text(n,'攻击点数 ['+(mother.baseFaces||M.PETS[mother.id].faces).join('/')+']  /  ['+(father.baseFaces||M.PETS[father.id].faces).join('/')+'] · 50% / 50%',-110,34,17,PC.ink,960,30,'left');
    this.ui.button(n,'breed-skill-pool','遗传技能池 ×'+pool.length,425,7,316,48,()=>this.showSkillCodes(pool,0,'遗传技能池'),PC.paper);
  }
  private gymBadgeEffect(id:number){return M.GYMS[id].types.join(' · ')+'\n永久加成\n最大生命 +10% · 攻击 +10%';}
  private gyms(){const p=this.content,s=this.state;this.title('道馆挑战','以伙伴的力量，赢得属于你的徽章');M.GYMS.forEach((gym,i)=>{const x=500+(i%3)*420,y=302+Math.floor(i/3)*212,done=!!s.gymBadges?.includes(i),available=M.gymUnlocked(s,i)&&!done&&!s.expedition,n=this.ui.button(p,'gym-'+i,'',x,y,392,190,()=>{if(done){this.dialog(gym.name,this.gymBadgeEffect(i),'返回',()=>this.closeDialog(),undefined,true);return;}this.dialog(gym.name,gym.types.join(' · ')+'属性的十场挑战，获胜后永久强化对应属性伙伴。\n\n最大生命 +10% · 攻击 +10%','开始挑战',()=>{this.commit(M.enterGym(this.state,i));this.show('battle');});},done?'#f4dfad':PC.paper,done||available,done?'':!M.gymUnlocked(s,i)?'通关对应地区后解锁':s.expedition?'请先结束当前冒险':'');
      this.ui.glyph(n,'gyms',-133,-5,50,done?'#bd8f36':PC.green);this.ui.text(n,String(i+1).padStart(2,'0'),-133,-61,13,PC.muted,80,24);this.ui.text(n,'永久加成',-142,47,13,PC.muted,84,38);this.ui.text(n,gym.name,42,-65,25,PC.ink,270,38,'left').isBold=true;this.ui.text(n,gym.types.join(' · '),42,-30,17,PC.muted,270,28,'left');const bonus=this.ui.text(n,'最大生命 +10%\n攻击 +10%',42,15,17,PC.green,270,54,'left');bonus.node.name='gym-badge-bonus-'+i;this.ui.text(n,done?'徽章已获得':available?'开始挑战  →':'尚未开放',42,65,15,done?PC.green:PC.muted,270,28,'left');
    });
  }

  private battle(){const p=this.content,s=this.state;
    const location=this.ui.battlePlate(p,212,49,316,62);this.ui.text(location,s.gymRun!==undefined?M.GYMS[s.gymRun].name:M.mapFor(s).name,0,-12,22,'#fff5db',282,32,'left').isBold=true;this.ui.text(location,'第 '+s.step+' 场 / '+M.mapStageCount(s)+'  ·  '+(M.rankForStage(s.step)==='boss'?'首领':M.rankForStage(s.step)==='elite'?'精英':'野外遭遇'),0,17,13,'#cfcab2',282,22,'left');
    this.ui.button(p,'battle-help','?',1218,43,52,38,()=>this.battleHelp(),PC.navy,true,'战斗技巧','battle-tag');this.ui.button(p,'retreat','撤退',1340,43,150,38,()=>this.confirmRetreat(),PC.navy,true,'','battle-tag');this.ui.button(p,'battle-settings','设置',1490,43,130,38,()=>this.settings(),PC.navy,true,'','battle-tag');
    this.battleRoot=this.ui.node(p,'battle-persistent',0,0,1600,900);this.battleStamp=s.phase;
    if(['battle','encounter'].includes(s.phase)){this.battleActors();this.battleHUD();const animate=this.animateNextRoll;this.animateNextRoll=false;this.syncBattle(s,animate);return;}
    const veil=this.ui.panel(p,800,450,4000,2000,PC.paper,238,0);veil.setSiblingIndex(0);
    if(s.phase==='reward'){const choice=['attack','heal'].includes(s.reward.kind),orb=this.ui.node(p,'victory-halo',440,470),g=orb.addComponent(Graphics);g.fillColor=hex('#e0e9ca');g.circle(0,0,220);g.fill();g.strokeColor=hex(PC.gold);g.lineWidth=2;g.circle(0,0,238);g.stroke();
      this.ui.text(p,'战斗胜利',1060,261,66,PC.green,740,92,'left').isBold=true;
      this.ui.shadow(p,440,671,305,36);const actor=this.pet(p,s.active,440,667,410);this.ui.reveal(actor,.02,-16,.3);this.ui.badge(p,this.petName(s.active),440,739,240,PC.paper,PC.ink);
      this.ui.line(p,1060,351,740,PC.gold);
      if(choice){this.ui.text(p,s.reward.kind==='attack'?'攻击点数':'治疗点数',1060,387,23,PC.muted,740,40,'left');
        const options=[{id:'keep',title:'旧骰子',faces:s.reward.kind==='attack'?s.active.faces:s.healFaces,action:'keep' as M.Action,caption:'保留原点数'},{id:'primary',title:'新骰子',faces:s.reward.values,action:'take' as M.Action,caption:'替换'}];
        options.forEach((o,i)=>{const card=this.ui.button(p,o.id,'',867+i*386,571,354,288,()=>void this.command(o.action),i? '#f4dfad':PC.paper);card.name='reward-die-'+o.id;this.ui.text(card,o.title,0,-104,26,PC.ink,306,38).isBold=true;this.ui.artImage(card,s.reward.kind==='attack'?'attack-die-a':'heal-potion',0,-41,76);new PCDiceReel(this.ui,card,0,33,298,42,null).set(o.faces,null);const action=this.ui.panel(card,0,105,298,44,i?PC.green:'#e1e8df',255,12);this.ui.text(action,o.caption,0,0,20,i?'#fffaf0':PC.ink,278,36).isBold=true;});
      }else{this.ui.text(p,s.reward.title,1060,414,33,PC.ink,740,88,'left').isBold=true;this.ui.text(p,s.message,1060,525,23,PC.muted,740,108,'left');this.ui.button(p,'primary','领取奖励  →',1060,683,430,62,()=>void this.command('take'),PC.green);}return;
    }
    if(s.phase==='nest'||s.phase==='eggClaimed'){this.nest();return;}
    this.ui.shadow(p,435,657,300,35);this.pet(p,s.active,435,655,385);
    if(s.phase==='event'){const event=s.battleEvent,info=event?M.BATTLE_EVENTS[event.kind]:null;this.ui.badge(p,'旅途奇遇',820,247,180);this.ui.text(p,info?.title||'意外的相遇',1100,340,43,PC.ink,720,90,'left').isBold=true;this.ui.text(p,s.message||info?.description||'',1100,474,24,PC.muted,720,150,'left');this.ui.button(p,'primary','继续旅程  →',1100,662,430,62,()=>void this.command('eventContinue'),PC.green);return;}
    const win=s.phase==='won',gymWin=win&&s.gymRun!==undefined;this.ui.badge(p,gymWin?'获得道馆徽章':win?'探索完成':'旅程暂歇',830,258,gymWin?260:196);this.ui.text(p,gymWin?M.GYMS[s.gymRun!].name:win?'新的风景，已经抵达':'先回营地休息吧',1100,357,43,PC.ink,720,112,'left').isBold=true;const result=this.ui.text(p,gymWin?this.gymBadgeEffect(s.gymRun!):s.message,1100,gymWin?499:489,gymWin?28:24,gymWin?PC.green:PC.muted,720,gymWin?160:118,'left');if(gymWin)result.node.name='gym-earned-bonus';this.ui.button(p,'primary',win?'带着收获回营地':'回营地',1100,670,430,62,()=>{this.commit(M.retreatExpedition(this.state));this.show('home');},PC.green);
  }
  private battleSceneKey(){return pcMapScene(this.state.mapId||0);}
  private ensureBattleScene(){const key=this.battleSceneKey();if(this.battleWorld&&this.sceneKey===key)return;
    if(this.battleWorld)this.ui.dispose(this.battleWorld);this.sceneKey=key;this.battleWorld=this.ui.node(this.root,'battle-world',0,0,1600,900);this.battleWorld.setSiblingIndex(this.background.getSiblingIndex()+1);
    this.battleScenery=this.ui.artImage(this.battleWorld,key,800,450,1600,2400);this.battleScenery.name='battle-scenery-'+key;this.layoutBattleScenery();this.refreshBattleAmbience();
  }
  private layoutBattleScenery(){if(!this.battleScenery?.isValid)return;const v=view.getVisibleSize(),size=this.art.size(this.sceneKey),cover=pcSceneCover(size.width,size.height,v.width,v.height);
    this.battleScenery.getComponent(UITransform)!.setContentSize(cover.width,cover.height);this.battleScenery.setPosition(cover.x,cover.y);
  }
  private refreshBattleAmbience(){if(!this.battleWorld?.isValid)return;if(this.ambient?.isValid)this.ui.dispose(this.ambient);this.ambient=this.ui.node(this.battleWorld,'battle-atmosphere',800,450,1600,900);pcBattleAmbience(this.ambient,this.state.mapId||0,770,900,this.reduced,view.getVisibleSize().width);}
  private battleActor(parent:Node,pet:M.Pet,x:number,y:number,size:number,side:'front'|'back'){
    if(!APP_BATTLE_IDS.includes(pet.id)||(pet.rarity&&pet.rarity!=='normal')){const actor=this.pet(parent,pet,x,y,size,side==='back'),image=actor.children[0];image.setPosition(0,image.getComponent(UITransform)!.height/2);attachPetMotion(actor,{size,facing:side==='back'?1:-1,reduced:()=>this.reduced});return actor;}
    const holder=this.ui.node(parent,'battle-actor-'+side,x,y),image=this.ui.artImage(holder,appPoseKey(pet.id,side),0,0,size);
    this.actorPoses.set(holder,{id:pet.id,side,size,image});this.setPose(holder,'idle');if(pet.shiny)tintShiny(image.getComponent(Sprite)!);attachPetMotion(holder,{size,facing:side==='back'?1:-1,reduced:()=>this.reduced,pose:pose=>this.setPose(holder,pose)});return holder;
  }
  private setPose(actor:Node|null,pose:string){if(!actor?.isValid)return;const spec=this.actorPoses.get(actor);if(!spec)return;const key=appPoseKey(spec.id,spec.side,pose),size=this.art.size(key),atlas=APP_BATTLE_ATLASES[spec.id],k=spec.size/(atlas.size[0]/4)*atlas.scale,[u,v]=appPoseFeet(spec.id,spec.side,pose),ui=spec.image.getComponent(UITransform)!;ui.setContentSize(size.width*k,size.height*k);ui.setAnchorPoint(u,1-v);this.art.bind(spec.image,key);}
  private battleActors(){const p=this.battleRoot!,s=this.state,stage=this.ui.node(p,'battle-actors',0,0,1600,900);
    this.enemy=this.battleActor(stage,M.enemyPet(s),1110,533,282,'front');this.player=this.battleActor(stage,s.active,535,642,405,'back');
    this.battleFX=new PCBattleEffects(this.effects,()=>this.reduced);
  }
  private focusCommands(acting:boolean){const n=this.commandLayer;if(!n?.isValid)return;const o=n.getComponent(UIOpacity)||n.addComponent(UIOpacity);Tween.stopAllByTarget(o);if(this.reduced)o.opacity=acting?65:255;else tween(o).to(acting?.12:.18,{opacity:acting?65:255},{easing:'quadOut'}).start();}
  private bar(parent:Node,x:number,y:number,w:number){const n=this.ui.node(parent,'health-bar',x,y,w,14);n.addComponent(Graphics);return n;}
  private healthText(hp:number,max:number,shield=0){return `生命 ${hp} / ${max}`+(shield>0?' · 护盾 '+shield:'');}
  private battleRelations(parent:Node){const s=this.state,n=this.ui.battlePlate(parent,212,231,316,108);n.name='battle-matchups';this.ui.text(n,'克制关系',0,-34,15,'#d4bb83',278,24,'left');
    [{title:'我方攻击',from:s.active.id,to:s.enemy},{title:'敌方攻击',from:s.enemy,to:s.active.id}].forEach((row,i)=>{const y=-3+i*32,m=M.matchupMultiplier(row.from,row.to);this.ui.text(n,row.title,-97,y,14,'#fff6dd',88,24,'left');this.ui.text(n,M.PETS[row.from].type+' → '+M.PETS[row.to].type,8,y,15,'#fff6dd',120,26);this.ui.badge(n,'×'+m,109,y,65,m>1?'#fbe4d7':m<1?'#dceefa':'#e8ebe5',m>1?'#a43728':m<1?'#215c87':PC.ink);});
  }
  private battleParty(parent:Node){const s=this.state;
    M.homeParty(s).forEach((uid,i)=>{if(!uid)return;const pet=M.petEntry(s,uid),v=M.pcPetCombat(s,uid),chosen=uid===s.active.uid,available=!chosen&&!M.isBreedingPet(s,uid)&&v.hp>0,n=this.ui.button(parent,'battle-pet-'+uid,'',151+i*170,737,156,108,()=>{if(this.commit(M.selectActive(this.state,uid)))this.show('battle');},chosen?PC.gold:PC.navy,available,chosen?'当前领队':M.isBreedingPet(s,uid)?'交配中':v.hp===0?'阵亡':'选择伙伴','battle-tag');
      this.pet(n,pet,-42,17,66);this.ui.text(n,(chosen?'✓ ':'')+this.petName(pet),0,35,15,'#fff6dd',142,27);this.ui.text(n,v.hp+'/'+v.max,35,-24,15,'#fff6dd',62,24);this.ui.badge(n,'×'+M.matchupMultiplier(pet.id,s.enemy),35,6,62,'#e6eddf',PC.ink);});
    this.ui.button(parent,'battle-partners','选择伙伴',693,843,174,42,()=>this.battlePartnerPicker(),PC.navy,true,'','battle-tag');
  }
  private battlePartnerPicker(page=0){const pets=this.state.pets||[],pages=Math.max(1,Math.ceil(pets.length/6));page=Math.max(0,Math.min(page,pages-1));this.dialog('选择伙伴','','返回',()=>this.closeDialog());const layer=this.modal!,old=layer.children[layer.children.length-1];this.ui.dispose(old);
    const card=this.ui.panel(layer,800,450,1090,678,PC.paper,255,22);this.ui.text(card,'选择伙伴',0,-289,32,PC.ink,960,48).isBold=true;
    pets.slice(page*6,page*6+6).forEach((pet,i)=>{const v=M.pcPetCombat(this.state,pet.uid!),chosen=pet.uid===this.state.active.uid,reason=chosen?'当前领队':M.isBreedingPet(this.state,pet.uid!)?'交配中':v.hp===0?'阵亡':'',n=this.ui.button(card,'choose-battle-'+pet.uid,'',-344+i%3*344,-141+Math.floor(i/3)*198,326,180,()=>{if(this.commit(M.selectActive(this.state,pet.uid!))){this.closeDialog();this.show('battle');}},chosen?'#f4dfad':PC.paper,!reason,reason);
      this.pet(n,pet,-104,49,105);this.ui.text(n,this.petIdentity(pet),55,-55,18,PC.ink,184,34,'left').isBold=true;this.ui.text(n,'生命 '+v.hp+'/'+v.max,55,-17,17,PC.green,184,30,'left');this.ui.text(n,M.petSkills(pet).map(c=>M.SKILLS[c][0]).join(' · '),55,27,14,PC.muted,184,58,'left');this.ui.text(n,reason||('我方攻击 ×'+M.matchupMultiplier(pet.id,this.state.enemy)),0,70,15,PC.ink,298,28);});
    this.ui.button(card,'partner-prev','←',-210,239,72,40,()=>this.battlePartnerPicker(page-1),PC.paper,page>0);this.ui.text(card,(page+1)+' / '+pages,0,239,18,PC.muted,260,30);this.ui.button(card,'partner-next','→',210,239,72,40,()=>this.battlePartnerPicker(page+1),PC.paper,page<pages-1);this.ui.button(card,'dialog-confirm','返回',0,295,316,44,()=>this.closeDialog(),PC.green);
  }
  private paintBar(n:Node|null,ratio:number,shield?:number){if(!n?.isValid)return;const value=Math.max(0,Math.min(1,ratio)),w=n.getComponent(UITransform)!.width,g=n.getComponent(Graphics)!;
    let state=this.barValues.get(n);const nextShield=shield===undefined?state?.shield||0:Math.max(0,Math.min(1,shield));if(state&&state.target===value&&state.shield===nextShield)return;if(!state){state={target:value,trail:value,shield:0};this.barValues.set(n,state);}const current=state;current.shield=nextShield;
    const draw=()=>{if(!n.isValid)return;g.clear();g.fillColor=hex('#091c20',245);g.rect(-w/2-2,-8,w+4,16);g.fill();g.strokeColor=hex('#d8c99d',210);g.lineWidth=1;g.stroke();if(current.trail>0){g.fillColor=hex('#ebd99c');g.rect(-w/2,-5,w*current.trail,10);g.fill();}if(current.target>0){g.fillColor=hex(current.target<.28?'#df785e':'#a9cc73');g.rect(-w/2,-5,w*current.target,10);g.fill();g.fillColor=hex('#f6ffd8',110);g.rect(-w/2,2,w*current.target,3);g.fill();}if(current.shield>0){g.fillColor=hex('#ffffff');g.rect(-w/2,-5,w*current.shield,10);g.fill();}};
    if(current.target!==value){const from=current.trail;current.target=value;Tween.stopAllByTarget(n);if(from>value&&!this.reduced)tween(n).delay(.06).to(.32,{}, {onUpdate:(_target,progress)=>{current.trail=from+(value-from)*progress;draw();}}).start();else current.trail=value;}draw();
  }
  private battleHelp(){this.showHint('');this.dialog('战斗技巧',['先看双方骰子，选择攻击或防御。','防御会结束本回合，大幅降低受到的伤害。','治疗和强化后仍可行动，每种药水每回合可用一次。'].join('\n'),'完成',()=>this.closeDialog());}
  private battleHUD(){const p=this.battleRoot!,s=this.state;
    this.battleRelations(p);
    if(s.phase==='encounter')this.battleParty(p);
    const floor=this.ui.node(p,'battle-command-shade',800,900),g=floor.addComponent(Graphics);for(let i=0;i<16;i++){g.fillColor=hex('#102328',Math.round(110-i*6));g.rect(-2000,i*9,4000,9);g.fill();}
    const left=this.ui.battlePlate(p,330,843,520,76,'#a9cc73');this.ui.artImage(left,(s.active.rarity&&s.active.rarity!=='normal'?M.formKey(s.active)+'-front':s.active.id),-213,-6,90,90);
    this.playerName=this.ui.text(left,'',55,-26,22,'#fff6dd',350,34,'left');this.playerName.isBold=true;this.playerHP=this.ui.text(left,'',55,26,18,'#fff6dd',350,28,'right');this.playerHP.isBold=true;this.playerBar=this.bar(left,55,3,350);
    const right=this.ui.battlePlate(p,812,74,390,74,'#d7be8f');this.enemyTitle=this.ui.text(right,'',0,-23,22,'#fff6dd',344,32);this.enemyHP=this.ui.text(right,'',0,26,16,'#fff6dd',344,26);this.enemyBar=this.bar(right,0,3,340);
    const intent=this.ui.battlePlate(p,812,147,332,46);this.ui.artImage(intent,'attack-die-a',-138,0,48);this.enemyReel=new PCDiceReel(this.ui,intent,21,0,260,28,null);
    if(s.phase==='encounter'){const reward=this.ui.battlePlate(p,812,213,390,66,PC.gold);reward.name='encounter-reward';this.ui.badge(reward,'奖励',-143,0,66,PC.gold,PC.ink);this.ui.text(reward,s.reward.title,39,0,21,'#fff2ce',280,58,'left').isBold=true;this.ui.reveal(reward,.11,20,.24);}
    const turn=this.ui.battlePlate(p,212,109,316,32);this.turnLabel=this.ui.text(turn,'',0,0,15,'#f3e5ba',286,26);turn.active=s.phase==='battle';
    if(s.pcCooking?.active){const meal=this.ui.battlePlate(p,280,148,450,29,'#a9cc73');this.battleMeal=this.ui.text(meal,mealSummary(s.pcCooking),0,0,14,'#fff2ce',420,25);}
    this.commandLayer=this.ui.node(p,'battle-command-cluster',0,0,1600,900);this.commandLayer.addComponent(UIOpacity);const commands=this.commandLayer;
    this.ui.reveal(left,.02,-35,.28);this.ui.reveal(right,.04,28,.28);this.ui.reveal(intent,.08,28,.28);
    if(s.phase==='encounter'){const preview=this.ui.battlePlate(commands,1368,706,300,88);this.ui.artImage(preview,'attack-die-a',-105,0,84);this.playerReel=new PCDiceReel(this.ui,preview,39,0,190,32,null);this.ui.button(p,'reroll','更换对手 · '+s.swaps,1135,811,220,50,()=>void this.command('reroll'),PC.green,s.swaps>0,'每次探险的可用更换次数有限','battle-tag');const start=this.ui.button(p,'primary','',1400,811,270,70,()=>void this.command('challenge'),PC.green,true,'','battle-tag');this.ui.artImage(start,'battle-start',-85,0,54);this.ui.text(start,'开始战斗',30,0,24,'#fff6dd',190,40);return;}
    const attack=this.ui.button(commands,'attack','',800,755,236,236,()=>void this.command('attack'),PC.gold,true,'','battle-die');this.diceNode=this.ui.artImage(attack,'attack-die-a',0,-34,134);this.diceNode.name='attack-die';
    const damage=this.ui.battlePlate(attack,0,48,236,38,'#edbd79');this.attackLabel=this.ui.text(damage,'',0,0,25,'#fff2d1',214,34);this.attackLabel.isBold=true;this.playerReel=new PCDiceReel(this.ui,attack,0,94,228,32,null);
    const actions:[string,string,string,number,number][]=[['guard','guard-shield','防御',1050,790],['heal','heal-potion','治疗',1230,790],['boost','power-potion','强化',1410,790]];
    actions.forEach(([id,key,name,x,y],i)=>{const n=this.ui.button(commands,id,'',x,y,112,112,()=>void this.command(id as M.Action),PC.navy,true,'','battle-command');this.actionIcons[id]=this.ui.artImage(n,key,0,-13,62).getComponent(Sprite)!;if(id!=='guard')this.actionStocks[id]=this.ui.battleStock(n,'',-38,-38);this.actionValues[id]=this.ui.combatText(n,'',0,32,'#fff4d5',20,102);const tag=this.ui.battlePlate(n,0,67,106,28);this.ui.text(tag,name,0,0,17,'#fff4d5',90,26);this.ui.reveal(this.ui.controls.get(id)!.entry,.05+i*.025,28,.24);});
    this.ui.reveal(this.ui.controls.get('attack')!.entry,.12,40,.28);
  }
  private syncBattle(s:M.State,animateDice=false){if(!this.playerHP?.isValid)return;this.focusCommands(false);this.playerName!.string=this.petName(s.active)+' · '+M.PETS[s.active.id].type;this.enemyTitle!.string=M.enemyName(s)+' · '+M.PETS[s.enemy].type;
    const shield=s.skill?.shield||0,enemyShield=s.enemyVariant?.shield||0;
    this.playerHP.string=this.healthText(M.hp(s),M.maxHP(s),shield);this.enemyHP!.string=this.healthText(s.enemyHP,s.enemyMax,enemyShield);this.paintBar(this.playerBar,s.hpRatio,shield/M.maxHP(s));this.paintBar(this.enemyBar,s.enemyHP/s.enemyMax,enemyShield/s.enemyMax);
    this.turnLabel!.string=s.phase==='battle'?`回合 ${s.turn}`:'';
    this.playerReel?.set(M.petAttackFaces(s.active),s.phase==='battle'?s.attack:null);this.enemyReel?.set(M.enemyAttackFaces(s),s.phase==='battle'?s.enemyAttack:null);
    this.ui.set('reroll','更换对手 · '+s.swaps,s.swaps>0);if(s.phase!=='battle')return;
    this.attackLabel!.string='总伤害 '+M.attackAmount(s);this.ui.set('attack','',true,'当前骰子点数 '+s.attack+' · 造成 '+M.attackAmount(s)+' 点伤害');
    this.actionValues.guard.string='99%';this.ui.set('guard','',true,'防御 · 预计承受 '+M.guardDamage(M.enemyAttackAmount(s))+' 点伤害');
    const heal=!s.usedHeal&&s.potions>0&&s.hpRatio<1,boost=!s.doubled&&s.boosts>0;
    this.actionStocks.heal.string=String(s.potions);this.actionStocks.boost.string=String(s.boosts);
    this.actionValues.heal.string=s.usedHeal?'已使用':s.hpRatio>=1?'已满':'+ '+M.healAmount(s);
    this.actionValues.boost.string='× '+s.boostMultiplier;
    this.ui.set('heal','',heal,s.usedHeal?'本回合已经使用治疗':s.potions===0?'没有生命药水':s.hpRatio>=1?'生命已满':'治疗恢复 '+M.healAmount(s)+' 点生命，不消耗攻击行动');
    this.ui.set('boost','',boost,s.doubled?'本回合已经强化':s.boosts===0?'没有力量药水':'力量药水 · 攻击 ×'+s.boostMultiplier+'，使用后仍可行动');
    this.actionIcons.heal.grayscale=!heal;this.actionIcons.boost.grayscale=!boost;
    this.shownTurn=s.turn;
    if(animateDice&&!this.reduced){const token=this.gate.begin();if(token!==null){this.diceRollToken=token;const duration=this.fast?.34:.52;this.playerReel?.spin(M.petAttackFaces(s.active),s.attack,duration);this.enemyReel?.spin(M.enemyAttackFaces(s),s.enemyAttack,duration);this.attackLabel!.string='总伤害 …';this.showHint('');for(const id of ['attack','guard','heal','boost'])this.ui.set(id,'',false,'等待骰子停稳');}}
  }
  private async command(action:M.Action){const token=this.gate.begin();if(token===null)return;const old=this.state;let next=M.act(old,action);if(next===old){this.gate.finish(token);return;}
    const food=old.phase==='battle'&&next.phase!=='battle'?settleCookingBattle(old.pcCooking||newCooking(),{id:'main:'+old.revision+':'+old.mapId+':'+old.step+':'+old.seed,won:next.enemyHP<=0,completed:true,mapId:old.mapId||0,rank:M.rankForStage(old.step)}):null;if(food?.changed)next={...next,pcCooking:food.state};
    this.state=next;await this.save();if(!this.node.isValid)return;if(['attack','guard','heal','boost'].includes(action))this.focusCommands(true);
    const factor=this.reduced?0:this.fast?.65:1;
    const rolled=next.phase==='battle'&&(old.phase!=='battle'||old.turn!==next.turn||old.active.uid!==next.active.uid);
    const finish=()=>{if(!this.node.isValid||!this.gate.finish(token))return;if(old.phase===next.phase&&next.phase==='battle'&&old.active.uid===next.active.uid){this.syncBattle(next,rolled);}else{this.animateNextRoll=rolled;this.show('battle');}if(food?.drop)this.toast('获得食材：'+FOOD_QUALITY_NAMES[food.drop.quality]+INGREDIENTS.find(i=>i.id===food.drop!.id)?.name+' ×'+food.drop.count);else if(food?.expired)this.toast('料理效果已结束，回营地补充美食');};
    if(!factor||!['attack','guard','heal','boost'].includes(action)){finish();return;}
    const player=this.player!,enemy=this.enemy!,pm=player.getComponent(PCPetMotion)!,em=enemy.getComponent(PCPetMotion)!;
    const at=(seconds:number,run:()=>void)=>this.scheduleOnce(()=>{if(this.node.isValid&&this.gate.locked&&player.isValid&&enemy.isValid)run();},seconds*factor);
    const combat=next.lastRelay?.combat||next.skill;
    if(action==='attack'||action==='guard'){
      if(action==='attack'){pm.strike(enemy,factor);at(.05,()=>this.battleFX?.trail(player,enemy,M.PETS[old.active.id].type,.13*factor));}else{pm.support('guard',factor);this.battleFX?.cast(player,'guard');}
      at(.18,()=>{if(action==='attack'){this.audio.effect('attack');this.pop('-'+(combat?.lastDamage||0),1030,260,'#ffe28b','造成伤害');this.battleFX?.hit(enemy,M.PETS[old.active.id].type,M.matchupMultiplier(old.active.id,old.enemy)>1);if(next.enemyHP<=0)em.fall(factor);else em.hurt(factor);}this.paintBar(this.enemyBar,next.enemyHP/old.enemyMax,(next.enemyVariant?.shield||0)/old.enemyMax);if(this.enemyHP?.isValid)this.enemyHP.string=this.healthText(next.enemyHP,old.enemyMax,next.enemyVariant?.shield||0);if(combat?.attackHPRatio!==undefined){this.paintBar(this.playerBar,combat.attackHPRatio);if(this.playerHP?.isValid)this.playerHP.string=this.healthText(Math.max(0,Math.ceil(combat.attackHPRatio*M.maxHP(old)-1e-8)),M.maxHP(old),old.skill?.shield||0);}});
      const counter=action==='attack'?.40:.18;
      if(next.enemyHP>0){at(counter,()=>em.strike(player,factor));at(counter+.05,()=>this.battleFX?.trail(enemy,player,M.PETS[old.enemy].type,.13*factor));
        at(counter+.18,()=>{this.audio.effect('hurt');this.battleFX?.hit(player,M.PETS[old.enemy].type,false);if(next.lastRelay||next.hpRatio<=0)pm.fall(factor);else pm.hurt(factor);this.pop('-'+(combat?.lastTaken||0),730,460,'#ffb5ae','受到伤害');this.paintBar(this.playerBar,next.lastRelay?0:next.hpRatio,(combat?.shield||0)/M.maxHP(old));if(this.playerHP?.isValid)this.playerHP.string=this.healthText(next.lastRelay?0:M.hp(next),M.maxHP(old),combat?.shield||0);});}
      // The hit is complete; dice may roll while the recoil and floating text finish.
      const sameActor=next.phase==='battle'&&old.active.uid===next.active.uid;
      this.scheduleOnce(finish,(next.enemyHP>0?counter+(sameActor?.22:.44):.53)*factor);
    }else{pm.support(action as 'heal'|'boost',factor);this.audio.effect(action==='heal'?'heal':'boost');at(.12,()=>{this.battleFX?.cast(player,action as 'heal'|'boost');this.syncBattle(next);this.pop(action==='heal'?'+'+(M.hp(next)-M.hp(old)):'攻击强化',710,action==='heal'?330:225,action==='heal'?'#c7ffde':'#ffe28b',action==='heal'?'恢复生命':'');});this.scheduleOnce(finish,.23*factor);}
  }
  private nest(){const p=this.content,s=this.state,h=s.eggHunt!,claimed=s.phase==='eggClaimed';this.ui.text(p,claimed?'新的生命，即将与你同行':'草丛里，传来了新的声音',800,224,43,PC.ink,1260,68).isBold=true;this.ui.text(p,claimed?'宠物蛋已收入蛋袋':'寻找一枚蛋，带回营地孵化新伙伴',800,281,19,PC.muted,1160,36);
    h.candidates.forEach((egg,i)=>{const n=this.ui.button(p,'egg-choice-'+i,'',460+i*340,468,310,270,()=>void this.command(('eggSelect'+i) as M.Action),i===h.selected?'#f4dfad':PC.paper,!claimed);this.egg(n,egg.rarity,0,-25,150);this.ui.text(n,(M.PETS[egg.affinity].type+' · '+M.rarityName(egg.rarity)),0,100,24,PC.ink,280,40).isBold=true;});
    if(!h.candidates.length)this.ui.glyph(p,'hatch',800,466,100,PC.green);this.ui.text(p,s.message,800,651,19,PC.muted,1160,60);
    if(claimed)this.ui.button(p,'primary','继续旅程  →',800,759,440,62,()=>void this.command('eggContinue'),PC.green);else{this.ui.button(p,'search-egg','寻找宠物蛋  '+h.candidates.length+' / '+h.limit,560,759,420,62,()=>void this.command('eggSearch'),PC.paper,h.candidates.length<h.limit);this.ui.button(p,'primary','带走选中的蛋',1040,759,420,62,()=>void this.command('eggTake'),PC.green,!!h.candidates[h.selected]);}
  }
  private confirmRetreat(){if(['won','lost'].includes(this.state.phase)){this.commit(M.retreatExpedition(this.state));this.show('home');return;}this.dialog('暂别这段旅程？','撤退会结束本次冒险，已收集的宠物蛋和食材保留。','确认撤退',()=>{this.commit(M.retreatExpedition(this.state));this.show('home');});}
  private pop(value:string,x:number,y:number,color=PC.gold,caption=''){
    const n=this.ui.node(this.effects,'combat-pop',x,y,360,142),number=/^[+-]?\d+$/.test(value);
    const amount=this.ui.impactText(n,value,0,caption?10:0,color,number?68:40,340);
    if(caption)this.ui.impactText(n,caption,0,-42,'#fffaf0',24,340);
    this.ui.animateImpact(n,amount);
  }
  private toast(message:string){
    if(this.toastNode?.isValid)this.ui.dispose(this.toastNode);
    const n=this.ui.panel(this.effects,800,842,680,46,PC.navy,248,6);n.addComponent(UIOpacity);this.toastNode=n;
    this.ui.text(n,message,0,0,18,'#fffdf2',646,34);this.ui.reveal(n,0,0,.12);
    this.scheduleOnce(()=>{if(!n.isValid)return;const done=()=>{this.ui.dispose(n);if(this.toastNode===n)this.toastNode=null;};if(this.reduced)done();else tween(n.getComponent(UIOpacity)!).to(.15,{opacity:0}).call(done).start();},1.8);
  }
  private dialog(title:string,message:string,confirm:string,run:()=>void,dismiss?:()=>void,singleAction=false){this.closeDialog(false);const layer=this.ui.node(this.root,'modal-blocker',0,0,1600,900);this.modal=layer;this.modalDismiss=dismiss||null;const blocker=this.ui.panel(layer,800,450,4000,2000,PC.navy,175,0);blocker.on(Node.EventType.TOUCH_START,(e:EventTouch)=>e.propagationStopped=true);blocker.on(Node.EventType.TOUCH_END,(e:EventTouch)=>e.propagationStopped=true);
    const card=this.ui.panel(layer,800,450,780,430,PC.paper,255,24);this.ui.line(card,0,-178,80,PC.gold);this.ui.text(card,title,0,-130,33,PC.ink,690,58).isBold=true;this.ui.text(card,message,0,-16,21,PC.muted,664,156);if(!singleAction)this.ui.button(card,'dialog-close','返回',-180,151,308,54,()=>this.dismissDialog());this.ui.button(card,'dialog-confirm',confirm,singleAction?0:180,151,308,54,run,PC.green);this.modalConfirm=run;this.ui.reveal(blocker,0,0,.12);this.ui.reveal(card,0,0,.18);
  }
  private dismissDialog(){const dismiss=this.modalDismiss;this.modalDismiss=null;if(dismiss)dismiss();else this.closeDialog();}
  private closeDialog(animated=true){this.dexRewards=null;if(this.closingModal){this.ui.dispose(this.closingModal);this.closingModal=null;}const layer=this.modal;this.modal=null;this.modalConfirm=null;this.modalDismiss=null;if(!layer)return;this.ui.retire(layer);if(!animated||this.reduced){this.ui.dispose(layer);return;}this.closingModal=layer;const opacity=layer.getComponent(UIOpacity)||layer.addComponent(UIOpacity);tween(opacity).to(.09,{opacity:0},{easing:'quadOut'}).call(()=>{this.ui.dispose(layer);if(this.closingModal===layer)this.closingModal=null;}).start();}
  private settings(){this.dialog('游戏设置','','完成',()=>this.closeDialog());const layer=this.modal!,card=layer.children[layer.children.length-1];const cancel=this.ui.controls.get('dialog-close');if(cancel)this.ui.dispose(cancel.node);this.ui.controls.get('dialog-confirm')!.node.setPosition(0,-151);
    const refresh=()=>{this.ui.set('music',this.audio.musicEnabled?'音乐  ·  开':'音乐  ·  关');this.ui.set('sound',this.audio.effectsEnabled?'音效  ·  开':'音效  ·  关');this.ui.set('motion',this.reduced?'减少动态  ·  开':'减少动态  ·  关');this.ui.set('speed',this.fast?'战斗速度  ·  快速':'战斗速度  ·  标准');};
    this.ui.button(card,'music','',-175,-47,310,54,()=>{this.audio.toggle('music');refresh();});this.ui.button(card,'sound','',175,-47,310,54,()=>{this.audio.toggle('effects');refresh();});this.ui.button(card,'motion','',-175,25,310,54,()=>{this.reduced=!this.reduced;this.ui.reduced=this.reduced;this.syncNavigation();this.refreshBattleAmbience();this.savePrefs();refresh();});this.ui.button(card,'speed','',175,25,310,54,()=>{this.fast=!this.fast;this.savePrefs();refresh();});this.ui.button(card,'language','界面语言',0,96,310,40,()=>this.languageSettings());refresh();
  }
  private changeLanguage(value:string){
    if(!LANGUAGES.some(l=>l.id===value))return false;
    const choice=selectPCLanguage(value,sys.languageCode||sys.language);try{sys.localStorage.setItem(PC_LANGUAGE_KEY,choice);}catch{}
    this.ui.refreshLanguage();return true;
  }
  private languageSettings(){
    this.closeDialog(false);const layer=this.ui.node(this.root,'language-modal',0,0,1600,900);this.modal=layer;
    const blocker=this.ui.panel(layer,800,450,4000,2000,PC.navy,175,0);blocker.on(Node.EventType.TOUCH_START,(e:EventTouch)=>e.propagationStopped=true);blocker.on(Node.EventType.TOUCH_END,(e:EventTouch)=>e.propagationStopped=true);
    const card=this.ui.panel(layer,800,450,1080,790,PC.paper,255,24);this.ui.text(card,'选择语言',0,-346,32,PC.ink,980,52).isBold=true;
    this.ui.text(card,'语言设置立即生效',0,-300,17,PC.muted,980,48);
    LANGUAGES.forEach((lang,i)=>{this.ui.button(card,'language-'+lang.id,(languageChoice()===lang.id?'✓  ':'')+lang.name,(i%3-1)*334,-238+Math.floor(i/3)*65,314,52,()=>{this.changeLanguage(lang.id);this.languageSettings();},languageChoice()===lang.id?PC.green:PC.paper);if(lang.id!=='system')this.ui.controls.get('language-'+lang.id)!.label.fontFamily=pcFont(lang.id);});
    this.ui.button(card,'language-back','返回设置',0,332,340,54,()=>this.settings());this.modalConfirm=()=>this.settings();this.ui.reveal(card,0,0,.18);
  }
  private savePrefs(){try{sys.localStorage.setItem('pm.pc.display.v1',JSON.stringify({reduced:this.reduced,fast:this.fast}));}catch{}}

}
