import { _decorator, Component, Node, Canvas, Camera, UITransform, Graphics, Color, Label, LabelOutline, Sprite,
  SpriteFrame, Texture2D, Rect, Size, resources, Layers, view, ResolutionPolicy, EventTouch, tween, Tween, Vec3, UIOpacity, sys, game, Game, profiler } from 'cc';
import { BATTLE_RECTS, PET_FEET } from './BattleArt';
import { partyChoices, rankForStage, continueAdventure, homeParty, assignPartySlot } from './PMModel';
import { RARITIES, EggRarity, rarityName, qualityHP, preferredRarity, unlockedRarities, setPetRarity, skillFor, skillStatus, availableEggs, hatchRemaining, startIncubation, accelerateHatch, claimHatch, acknowledgeHatch } from './PMModel';
import { State, PetId, Action, Egg, PETS, PET_IDS, TOTAL_STAGES, fresh, act, hp, maxHP, enemyName, enemyAttackFaces, restore, equipReserve, selectActive, healAmount, attackAmount, guardDamage, rewardOptions, canManageParty, restartRun } from './PMModel';
const { ccclass } = _decorator;
const KEY='pm.creature-dice.v1';
const C={ink:'#183852',muted:'#647f95',paper:'#f7fcff',blue:'#168cdd',orange:'#f99b28',green:'#38b98c',line:'#d7e8f2'};
const color=(v:string,alpha=255)=>{const c=new Color();Color.fromHEX(c,v);c.a=alpha;return c;};
@ccclass('PMGame')
export class PMGame extends Component {
  private state!:State;private root!:Node;private cam!:Camera;private stage!:Node;
  private art:Record<string,SpriteFrame>={};private h=844;private lastSize='';private busy=false;
  private saveError=false;private controls:Record<string,{x:number,y:number,w:number,h:number}>={};
  private enemyNode:Node|null=null;private playerNode:Node|null=null;private modal:Node|null=null;
  private ready=false;private lastTap=0;private loading:Label|null=null;private pressPending=false;
  private diceNode:Node|null=null;private fx!:Node;
  private availableGlows:Node[]=[];
  private meters:Record<string,{fill:Node,label:Label}>={};
  private hatchClock: {label:Label;index:number;ready:boolean}[]=[];private hatchSecond=0;
  private screen:'home'|'adventure'|'partners'|'game'='home';
  private partnerPage=0;private partnerSelected:PetId|null=null;private partnerOwnedOnly=true;private mapIndex=0;
  private homeHatchStatus:Label|null=null;
  private partyDropNodes:Node[]=[];private partyDragHint:Label|null=null;
  private partyDrag:{id:PetId;touch:number;source:Node;start:Vec3;origin:Vec3;moved:boolean;ghost:Node|null;guides:Node[];target:number}|null=null;
  async start(){
    profiler.hideStats();view.setDesignResolutionSize(390,844,ResolutionPolicy.FIXED_WIDTH);
    this.root=new Node('PM UI');this.node.addChild(this.root);this.root.layer=Layers.Enum.UI_2D;
    this.root.addComponent(UITransform);
    const cn=new Node('PM Camera');this.node.addChild(cn);this.cam=cn.addComponent(Camera);
    this.cam.projection=Camera.ProjectionType.ORTHO;this.cam.near=.1;this.cam.far=2000;
    this.cam.clearFlags=Camera.ClearFlag.SOLID_COLOR;this.cam.clearColor=color('#a7dbea');this.cam.visibility=Layers.Enum.UI_2D;
    this.root.addComponent(Canvas).cameraComponent=this.cam;
    this.layout();this.loading=this.text(this.root,'伙伴们正在赶来…',0,0,19,C.ink);
    let stored:State|null=null;
    try{stored=restore(sys.localStorage.getItem(KEY));if(!stored)stored=restore(sys.localStorage.getItem(KEY+'.backup'));}catch{}
    this.state=stored||fresh();
    try{
      await Promise.all(['fox','bud','turtle','battle-arena','home-camp-v1','egg-nest-v1','attack-die-a','heal-potion','power-potion','guard-shield','loot-chest','refresh-enemy','battle-start'].map(async key=>{
        this.art[key]=await new Promise<SpriteFrame>((resolve,reject)=>resources.load('art/'+key+'/spriteFrame',SpriteFrame,(e,r)=>e?reject(e):resolve(r)));
      }));
      await Promise.all(PET_IDS.map(async id=>{
        const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('art/'+id+(['fox','bud','turtle'].includes(id)?'-battle-ref':'-battle-v1')+'/texture',Texture2D,(e,r)=>e?reject(e):resolve(r)));
        for(const side of ['back','front'] as const){const [x,y,w,h]=BATTLE_RECTS[id][side],frame=new SpriteFrame();
          frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art[id+'-'+side]=frame;if(side==='front'&&!['fox','bud','turtle'].includes(id))this.art[id]=frame;
        }
      }));
      this.ready=true;this.render();this.save();if(this.state.pendingHatch)this.hatchReveal();
      game.on(Game.EVENT_HIDE,this.onHide,this);
      (globalThis as any).__pm={snapshot:()=>JSON.parse(JSON.stringify(this.state)),controls:()=>({...this.controls}),animating:()=>this.busy||this.pressPending,version:'0.8.1',ready:true};
    }catch(e){this.loading!.string='资源加载失败，请刷新重试';console.error('PM asset loading',e);}
  }
  onDestroy(){game.off(Game.EVENT_HIDE,this.onHide,this);}
  private onHide(){this.cancelPartyDrag();if(this.ready)this.save();}
  update(){const second=Math.floor(Date.now()/1000);if(second!==this.hatchSecond){this.hatchSecond=second;if(this.homeHatchStatus?.isValid){const slots=(this.state.incubators||[]).filter(Boolean),ready=slots.filter(slot=>hatchRemaining(slot!)===0).length;this.homeHatchStatus.string=ready?'有 '+ready+' 枚可以破壳':slots.length+' / 2 孵化中';}for(const c of this.hatchClock){if(!c.label.isValid)continue;const slot=this.state.incubators?.[c.index];if(slot){const left=hatchRemaining(slot);c.label.string=this.hatchTime(left);if(!left&&!c.ready&&!this.pressPending){this.hatchery();break;}}}}
    for(let i=this.availableGlows.length-1;i>=0;i--){const glow=this.availableGlows[i];if(!glow.isValid)this.availableGlows.splice(i,1);else {const encounterAction=this.state.phase==='encounter'&&(glow.parent?.name==='reroll'||glow.parent?.name==='challenge');glow.active=!this.busy&&(!this.pressPending||encounterAction);}}
    const s=view.getVisibleSize();const key=s.width+':'+s.height;if(key!==this.lastSize){this.layout();if(this.ready&&!this.busy&&!this.pressPending)this.render();}}
  private layout(){const s=view.getVisibleSize();this.h=s.height;this.lastSize=s.width+':'+s.height;
    this.root.setPosition(s.width/2,s.height/2);this.root.getComponent(UITransform)!.setContentSize(s.width,s.height);
    this.cam.node.setPosition(s.width/2,s.height/2,1000);this.cam.orthoHeight=s.height/2;}
  private save(){try{
    const old=sys.localStorage.getItem(KEY);if(restore(old))sys.localStorage.setItem(KEY+'.backup',old!);
    sys.localStorage.setItem(KEY,JSON.stringify(this.state));this.saveError=false;
  }catch{this.saveError=true;}}
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
      n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{e.propagationStopped=true;if(this.busy||this.pressPending)return;
        Tween.stopAllByTarget(n);tween(n).to(.055,{scale:new Vec3(.94,.94,1)}).start();});
      n.on(Node.EventType.TOUCH_CANCEL,(e:EventTouch)=>{e.propagationStopped=true;release();});
      n.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;
        if(this.busy||this.pressPending||Date.now()-this.lastTap<180){release();return;}
        this.lastTap=Date.now();this.pressPending=true;Tween.stopAllByTarget(n);n.setScale(.94,.94,1);
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
  private petImage(parent:Node,id:PetId,x:number,y:number,size:number,role:'player'|'enemy'|'card'='card'){
    const key=role==='player'?id+'-back':role==='enemy'?id+'-front':id;
    return this.image(parent,key,x,y,size,size,role==='card'&&id==='fox');
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
  private petFeet(id:PetId,side:'back'|'front'){
    // Contact centers measured within each trimmed sprite; tails/ears are not ground anchors.
    const feet={fox:{back:[.647,.945],front:[.381,.941]},bud:{back:[.644,.951],front:[.431,.944]},turtle:{back:[.498,.931],front:[.488,.921]}};
    return (feet[id]||PET_FEET[id])[side];
  }
  private groundX(id:PetId,side:'back'|'front',size:number,preferred:number){
    const frame=this.art[id+'-'+side].originalSize,w=size*frame.width/Math.max(frame.width,frame.height),u=this.petFeet(id,side)[0];
    return Math.max(-187+u*w*1.025,Math.min(187-(1-u)*w*1.025,preferred));
  }
  private groundPet(n:Node,id:PetId,side:'back'|'front',x:number,y:number){
    const [u,v]=this.petFeet(id,side),ui=n.getComponent(UITransform)!;
    ui.setAnchorPoint(u,.5);n.setPosition(x,y+(v-.5)*ui.height);this.breathe(n,y);
  }
  private clear(){this.cancelPartyDrag();this.partyDropNodes=[];this.partyDragHint=null;const stop=(n:Node)=>{Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);for(const child of n.children)stop(child);};for(const n of [...this.root.children]){stop(n);n.destroy();}this.root.removeAllChildren();this.controls={};this.modal=null;this.enemyNode=null;this.playerNode=null;this.diceNode=null;this.meters={};this.availableGlows=[];}
  private render(){
    this.clear();this.layout();const s=this.state,H=this.h,b=-H/2;
    if(this.screen==='home'){this.homeUI();return;}
    if(this.screen==='adventure'){this.adventureUI();return;}
    if(this.screen==='partners'){this.partnersUI();return;}
    if(s.phase==='nest'||s.phase==='eggClaimed'){this.nestUI();return;}
    const phase=s.phase;const panelHeight=phase==='battle'?246:phase==='team'?300:phase==='reward'?350:phase==='encounter'?308:230;
    const sceneHeight=H-panelHeight;
    const bg=this.makeNode(this.root,'background',0,panelHeight/2,390,sceneHeight);const sp=bg.addComponent(Sprite);sp.spriteFrame=this.art['battle-arena'];sp.sizeMode=Sprite.SizeMode.CUSTOM;
    const os=this.art['battle-arena'].originalSize,k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    this.stage=this.makeNode(this.root,'actors',0,0,390,H);
    // Navigation stays at the edge; combat data belongs to the creature in the scene.
    const title=this.text(this.root,'草叶海岸 '+s.step+'/'+TOTAL_STAGES,0,H/2-30,18,'#ffffff',280,36);
    title.isBold=true;const outline=title.node.addComponent(LabelOutline);outline.color=color('#254b4d');outline.width=2;
    this.button(this.root,'menu','···',161,H/2-30,44,42,()=>this.menu(),C.paper,true,24);
    const stageBottom=b+panelHeight;const stageTop=H/2-92;const area=stageTop-stageBottom;
    const center=stageBottom+area*.48;const size=Math.max(125,Math.min(245,area*.67));
    if(phase==='battle'){
      // Low camera composition from the approved reference: two distinct diagonal battle pads.
      const playerGround=H/2-sceneHeight*.92,enemyGround=H/2-sceneHeight*.62;
      const baseSize=Math.min(230,sceneHeight*.38),playerSize=baseSize*1.2*Math.min(1.15,this.petScale(s.active.id)),enemySize=baseSize*.65*.8*this.petScale(s.enemy);
      const enemyX=this.groundX(s.enemy,'front',enemySize*1.1,82),playerX=this.groundX(s.active.id,'back',playerSize*.9,-92);
      this.battlePad(enemyX,enemyGround,enemySize*1.25*1.2);
      this.shadow(enemyX,enemyGround,enemySize*.55,.82);this.enemyNode=this.petImage(this.stage,s.enemy,enemyX,enemyGround,enemySize*1.1,'enemy');
      this.groundPet(this.enemyNode,s.enemy,'front',enemyX,enemyGround);
      const status=this.panel(this.enemyNode,0,this.enemyNode.getComponent(UITransform)!.height/2+32,176,54,C.paper,10,246);status.name='enemy-hud';
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-26);pointer.lineTo(0,-34);pointer.lineTo(6,-26);pointer.close();pointer.fill();
      this.text(status,enemyName(s),-31,14,12,C.ink,104,20);
      this.bar(status,-31,-10,104,s.enemyHP/s.enemyMax,s.enemyHP+' / '+s.enemyMax,'enemy');
      const intent=this.panel(status,55,0,58,38,'#fff0d9',8);
      this.attackDie(intent,-16,0,26);
      this.text(intent,''+s.enemyAttack,14,0,22,'#b94c0a',32,30);
      this.battlePad(playerX,playerGround,baseSize*1.25);
      this.shadow(playerX,playerGround,playerSize*.55);this.playerNode=this.petImage(this.stage,s.active.id,playerX,playerGround,playerSize*.9,'player');
      this.groundPet(this.playerNode,s.active.id,'back',playerX,playerGround);
      if(s.doubled){const tag=this.panel(this.stage,playerX,playerGround+this.playerNode.getComponent(UITransform)!.height+18,116,28,'#fff0cd',14);this.text(tag,'攻击 ×'+s.boostMultiplier,0,0,14,'#a95a10');}
    }else if(phase==='encounter'){
      const statusY=H/2-144,room=statusY-70-stageBottom-22,petSize=Math.min(200,room*.90/1.5)*this.petScale(s.enemy),petY=stageBottom+room*.5;
      this.shadow(0,petY-petSize*.4,145);this.enemyNode=this.petImage(this.stage,s.enemy,0,petY,petSize,'enemy');this.breathe(this.enemyNode);
      const status=this.panel(this.root,0,statusY,350,94,C.paper,14,246);status.name='encounter-enemy-hud';
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-45);pointer.lineTo(0,-55);pointer.lineTo(6,-45);pointer.close();pointer.fill();
      this.petImage(status,s.enemy,-142,17,52);
      this.text(status,PETS[s.enemy].trait,-142,-22,10,PETS[s.enemy].rank==='boss'?'#ad6e15':PETS[s.enemy].rank==='elite'?'#8656b0':C.muted,62,18);
      this.encounterNameAttack(status,enemyName(s),enemyAttackFaces(s),30);
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
      this.shadow(0,center-size*.42,150);this.enemyNode=this.petImage(this.stage,s.active.id,0,center,size);this.breathe(this.enemyNode);
    }else{
      const title=phase==='recruit'?'它想和你一起冒险！':phase==='team'?'新伙伴加入！':phase==='won'?'海岸冒险完成！':'休息一下，再出发';
      this.panel(this.root,0,stageTop-23,350,54,C.paper,24,245);this.text(this.root,title,0,stageTop-23,23);
      const id=phase==='won'||phase==='lost'?s.active.id:(s.recruit||s.enemy);
      this.shadow(0,center-size*.42,150);this.enemyNode=this.petImage(this.stage,id,0,center,size);this.breathe(this.enemyNode);
      this.text(this.root,PETS[id].name+' · '+PETS[id].trait,0,stageBottom+23,16);
    }
    const sheet=this.panel(this.root,0,b+panelHeight/2,390,panelHeight,'#f5fbff',24,251);
    if(phase==='encounter')this.encounterUI(sheet,panelHeight);
    if(phase==='battle')this.battleUI(sheet,panelHeight);
    if(phase==='reward')this.rewardUI(sheet,panelHeight);
    if(phase==='recruit')this.recruitUI(sheet,panelHeight);
    if(phase==='team')this.teamUI(sheet,panelHeight);
    if(phase==='won'||phase==='lost'){
      this.text(sheet,phase==='won'?'收藏与通关记录已保留':'收藏的伙伴会陪你再次启程',0,73,16);
      this.text(sheet,'已收集 '+s.owned.length+' / '+PET_IDS.length+'   ·   通关 '+s.wins+' 次',0,37,15,C.muted);
      if(phase==='won'&&s.step===10)this.button(sheet,'continueAdventure','继续第 11 关  ›',0,-17,340,58,()=>{this.state=continueAdventure(this.state);this.save();this.render();},C.orange,true,22);
      else this.button(sheet,'restart','再来一局',0,-17,340,58,()=>this.restart(),C.orange,true,22);
      this.button(sheet,'collection','查看伙伴',0,-77,340,42,()=>this.collection(),C.paper,true,15);
    }
    this.text(this.root,this.saveError?'保存失败，请勿关闭页面':'PM v0.8.1  ·  20 关 · 自动续玩',0,b+8,10,this.saveError?'#c44141':C.muted,350,14);
    this.fx=this.makeNode(this.root,'battle-effects',0,0,390,H);
    if(phase==='reward'||phase==='won'){const n=this.enemyNode!;const pos=n.position.clone();tween(n).by(.18,{position:new Vec3(0,15,0)},{easing:'quadOut'}).to(.2,{position:pos},{easing:'quadIn'}).start();}
  }
  private eggTint(egg:Egg){return egg.rarity==='SSR'?'#d79428':egg.rarity==='SR'?'#9062cf':'#5b9a80';}
  private eggName(egg:Egg){return (egg.rarity==='normal'?'普通':egg.rarity)+' · '+PETS[egg.affinity].type;}
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
    const bg=this.makeNode(this.root,'egg-nest',0,panelHeight/2,390,sceneHeight),sp=bg.addComponent(Sprite),os=this.art['egg-nest-v1'].originalSize;
    sp.spriteFrame=this.art['egg-nest-v1'];sp.sizeMode=Sprite.SizeMode.CUSTOM;const k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    this.stage=this.makeNode(this.root,'nest-stage',0,0,390,H);
    const title=this.text(this.root,claimed?'带着惊喜回家':'巢穴寻蛋',0,H/2-36,26,'#fff9df',280,42);title.isBold=true;const out=title.node.addComponent(LabelOutline);out.color=color('#365543');out.width=2;
    this.button(this.root,'menu','···',161,H/2-32,44,42,()=>this.menu(),C.paper,true,24);
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
      this.text(this.stage,'草丛里好像藏着什么…',0,nestY-58,16,'#fff9df',270,28).node.addComponent(LabelOutline).color=color('#526143');
    }
    const companionSize=Math.min(94,sceneHeight*.19);this.playerNode=this.petImage(this.stage,s.active.id,-130,b+panelHeight+companionSize*.52+8,companionSize);this.breathe(this.playerNode);
    const sheet=this.panel(this.root,0,b+panelHeight/2,390,panelHeight,'#fffbed',24,253);
    if(claimed){
      this.text(sheet,this.eggName(chosen)+' 蛋',0,79,22,this.eggTint(chosen),330,34).isBold=true;
      this.text(sheet,'已保存  ·  蛋袋共 '+(s.eggs||[]).length+' 枚',0,42,15,C.muted,330,27);
      this.button(sheet,'eggContinue',s.step===TOTAL_STAGES?'完成冒险  ›':'继续冒险  ›',0,-13,338,56,()=>this.command('eggContinue'),'#dba441',true,22);
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
      this.text(sheet,'每次翻找：普通 80% · SR 17% · SSR 3%',0,-119,11,C.muted,350,20);
    }
    this.text(this.root,this.saveError?'保存失败，请勿关闭页面':'PM v0.8.1  ·  自动保存',0,b+8,10,this.saveError?'#c44141':C.muted,350,14);
    this.fx=this.makeNode(this.root,'nest-effects',0,0,390,H);
  }
  private eggBag(page=0){
    const eggs=(this.state.eggs||[]).filter(e=>!(this.state.hatchedEggIds||[]).includes(e.id)).reverse(),pages=Math.max(1,Math.ceil(eggs.length/4));page=Math.max(0,Math.min(pages-1,page));
    const c=this.overlay('蛋袋 · '+eggs.length+' 枚',470);
    if(!eggs.length){this.text(c,'击败精英或 BOSS 后\n到巢穴挑选一枚宠物蛋',0,50,18,C.muted,310,75);}
    eggs.slice(page*4,page*4+4).forEach((egg,i)=>{const y=124-i*68;this.panel(c,0,y,310,61,'#f2f5ec',12);this.eggArt(c,egg,-116,y,52);this.text(c,this.eggName(egg)+' 蛋',20,y+10,17,this.eggTint(egg),200,25).isBold=true;this.text(c,(rankForStage(egg.stage)==='boss'?'BOSS 巢穴':'精英巢穴')+' · 第 '+egg.stage+' 关',20,y-14,12,C.muted,200,20);});
    this.button(c,'eggs-prev','‹',-110,-122,58,33,()=>this.eggBag(page-1),C.blue,page>0,23);this.text(c,(page+1)+' / '+pages,0,-122,14,C.muted,100,26);this.button(c,'eggs-next','›',110,-122,58,33,()=>this.eggBag(page+1),C.blue,page<pages-1,23);
    this.button(c,'hatchery','进入孵化屋',0,-162,302,32,()=>this.hatchery(),'#46976e',true,15);
    this.button(c,'closeEggBag','返回',0,-200,302,40,()=>this.render(),C.orange);
  }
  private attackDie(parent:Node,x:number,y:number,size:number){
    // Approved A: four pips in the side plane. Damage remains an independent number.
    const n=this.image(parent,'attack-die-a',x,y,size*1.13,size*1.13);n.name='attack-die';
    this.diceNode=n;return n;
  }
  private chestIcon(parent:Node,x:number,y:number,size:number){
    return this.image(parent,'loot-chest',x,y,size,size);
  }
  private encounterNameAttack(p:Node,name:string,faces:number[],top:number){
    this.text(p,name,-63,top,17,C.ink,120);
    this.attackDie(p,25,top,23);const gap=Math.min(35,130/faces.length);
    faces.forEach((v,i)=>{const chip=this.panel(p,62+i*gap,top,29,24,'#fff0d9',6);this.text(chip,''+v,0,0,17,'#b94c0a',27,22);});
  }
  private playerHUD(p:Node,top:number,preview=false){const s=this.state;
    this.petImage(p,s.active.id,preview?-142:-150,top-13,52);
    if(preview)this.encounterNameAttack(p,PETS[s.active.id].name,s.active.faces,top);
    else this.text(p,PETS[s.active.id].name,-50,top,17,C.ink,145);
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
      const selected=s.active.id===id,owned=s.owned.includes(id),tint=selected?'#fff2cf':owned?'#fbfeff':'#e7edf0',x=(i-1)*118;
      this.panel(p,x,-1,108,113,selected?'#c5933d':'#b9ced9',17);
      const card=this.button(p,'pet-'+id,'',x,4,108,110,()=>{const next=selectActive(this.state,id);if(next!==this.state){this.state=next;this.save();this.encounterPartyUI(p);}},tint,owned&&!selected,16,tint);
      const rim=card.getComponent(Graphics)!;rim.lineWidth=selected?3:1.5;rim.strokeColor=color(selected?'#e4ae48':'#bdd6e2');rim.roundRect(-52,-53,104,106,14);rim.stroke();
      const disc=this.makeNode(card,'portrait-disc',0,14,78,78).addComponent(Graphics);disc.fillColor=color(selected?'#ffe2a1':owned?'#e1f3f7':'#d7e1e6');disc.circle(0,0,37);disc.fill();
      this.petImage(card,id,0,15,78).getComponent(Sprite)!.grayscale=!owned;
      this.panel(card,0,-36,96,25,selected?'#f8d993':owned?'#eaf3f7':'#d4e0e6',8);
      this.text(card,PETS[id].name,0,-36,14,owned?C.ink:C.muted,94,23).isBold=selected;
      if(selected){const mark=this.panel(card,39,40,24,24,'#43a986',12);this.text(mark,'✓',0,0,17,'#ffffff',24,24);}
      if(!owned){const lock=this.makeNode(card,'locked',39,39,20,23),g=lock.addComponent(Graphics);g.strokeColor=color(C.muted);g.fillColor=color(C.muted);g.lineWidth=2;g.roundRect(-5,0,10,11,5);g.stroke();g.roundRect(-8,-8,16,13,3);g.fill();}
    });
  }
  private encounterUI(p:Node,height:number){const s=this.state;
    this.encounterPartyUI(this.makeNode(p,'encounter-party',0,0,390,height));
    this.panel(p,-128,-107,92,64,s.swaps>0?'#6795ae':'#a8bdca',16);
    const reroll=this.button(p,'reroll','',-128,-102,92,64,()=>this.command('reroll'),'#dff3fc',s.swaps>0);
    this.image(reroll,'refresh-enemy',-5,2,53,53).getComponent(Sprite)!.grayscale=s.swaps===0;
    const count=this.panel(reroll,29,-18,25,25,s.swaps>0?'#246987':'#93aab8',12);this.text(count,''+s.swaps,0,0,16,'#ffffff',23,23);
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
    this.text(p,skillStatus(s),0,63,11,s.active.rarity==='SSR'?'#b78022':s.active.rarity==='SR'?'#8b61bb':C.muted,342,20);
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
    this.attackDie(attack,-44,0,52);
    this.text(attack,''+attackAmount(s),32,0,36,'#ffffff',76,48);
    if(s.doubled){this.actionIcon(attack,'boost',17,-23,13,'#ffffff');this.text(attack,'×'+s.boostMultiplier,43,-23,11,'#ffffff',40,16);}
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
    this.text(p,'出战 '+PETS[s.active.id].name+' 保持不变',0,61,13,C.muted);
    if(s.reserve)this.petImage(p,s.reserve.id,-91,7,75);this.petImage(p,id,91,7,75);
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
  private popup(value:string,pos:Vec3,fill:string){
    const n=this.panel(this.fx,pos.x,pos.y+48,154,42,C.paper,21,245);
    this.text(n,value,0,0,22,fill,145,36);const opacity=n.addComponent(UIOpacity);
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
  private hurt(n:Node,damage:number,guard=false){
    const pos=n.position.clone(),sprite=n.getComponent(Sprite)!;Tween.stopAllByTarget(n);
    sprite.color=color(guard?'#c4efff':'#ffc4b0');
    tween(sprite).to(.2,{color:color('#ffffff')}).start();
    tween(n).by(.065,{position:new Vec3(n===this.playerNode?-12:12,0,0),eulerAngles:new Vec3(0,0,n===this.playerNode?6:-6)})
      .to(.18,{position:pos,eulerAngles:Vec3.ZERO},{easing:'backOut'}).start();
    this.spark(pos,guard?'#62ccfa':'#ffd35a',this.state.doubled);
    this.popup(guard?'格挡  −'+damage:'−'+damage,pos,guard?C.blue:'#bf5427');
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
      tween(n).to(.07,{eulerAngles:new Vec3(0,0,20),scale:new Vec3(base.x*1.13,base.y*1.13,1)})
        .to(.07,{eulerAngles:new Vec3(0,0,-15)}).to(.1,{eulerAngles:Vec3.ZERO,scale:base}).start();
      this.scheduleOnce(()=>{this.busy=false;},.25);
    }else this.busy=false;
  }
  private command(a:Action){
    if(this.busy)return;const old=this.state,next=act(old,a);if(next===old)return;
    this.state=next;this.save();
    if(this.modal){this.modal.removeFromParent();this.modal.destroy();this.modal=null;}
    if(a==='eggSearch'){
      this.busy=true;const companion=this.playerNode;if(companion){Tween.stopAllByTarget(companion);tween(companion).by(.12,{position:new Vec3(30,14,0)}).by(.13,{position:new Vec3(8,-9,0)}).by(.12,{position:new Vec3(-7,7,0)}).start();}
      this.popup('沙沙…',new Vec3(0,115,0),'#fff6d5');
      this.scheduleOnce(()=>{this.render();const n=this.enemyNode;if(n){Tween.stopAllByTarget(n);n.setScale(.15,.15,1);tween(n).to(.32,{scale:new Vec3(1.1,1.1,1)},{easing:'backOut'}).to(.16,{scale:Vec3.ONE}).call(()=>this.breathe(n)).start();const e=next.eggHunt!.candidates[next.eggHunt!.selected];this.spark(n.position,this.eggTint(e),e.rarity!=='normal');if(e.rarity!=='normal')this.popup(e.rarity+' !',new Vec3(0,n.position.y+100,0),this.eggTint(e));}this.scheduleOnce(()=>{this.busy=false;},.55);},.48);return;
    }
    const animate=['attack','guard','challenge','heal','boost','invite'].includes(a);
    if(!animate){this.render();return;}
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
      const damage=next.skill?.lastTaken??(a==='guard'?guardDamage(old.enemyAttack):old.enemyAttack);
      this.hurt(player,damage,a==='guard');this.lifeTo('player',next.hpRatio,maxHP(next));
    });};
    if(a==='attack'){
      this.strike(player,enemy,()=>{this.hurt(enemy,next.skill?.lastDamage??attackAmount(old));this.lifeTo('enemy',next.enemyHP/old.enemyMax,old.enemyMax);this.lifeTo('player',next.hpRatio,maxHP(next));});
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
  private confirmGuard(){const c=this.overlay('放弃这次攻击强化？',245);
    this.text(c,'防御会放弃已使用的 ×'+this.state.boostMultiplier+' 强化',0,34,14,C.muted,320);
    this.button(c,'cancel','返回',-82,-49,145,52,()=>this.render(),'#e8f3fa');
    this.button(c,'confirmGuard','仍然防御',82,-49,145,52,()=>this.command('guard'),C.blue);
  }
  private menu(){const c=this.overlay('伙伴骰子冒险',390);
    this.text(c,'18 种属性 · 18 只伙伴 · 20 场冒险',0,112,14,C.muted);
    this.button(c,'resume','继续冒险',0,58,300,50,()=>this.render(),C.orange);
    this.button(c,'collection','伙伴收藏  '+this.state.owned.length+' / '+PET_IDS.length,0,-3,300,48,()=>this.collection(),C.blue);
    this.button(c,'eggBag','孵化屋  ·  '+availableEggs(this.state).length+' 枚待孵',0,-61,300,46,()=>this.hatchery(),'#46976e');
    this.button(c,'home','返回营地',0,-115,300,42,()=>this.goHome(),'#e8f3fa');
    this.text(c,'退出自动续玩 · 收藏与宠物蛋永久保留',0,-163,12,C.muted,320,28);
  }
  private collection(page=0){this.screen='partners';this.partnerPage=page;this.partnerSelected=this.partnerSelected||this.state.active.id;this.render();}
  private confirmRestart(){const c=this.overlay('重新出发？',250);this.text(c,'本局进度重置，收藏与已带走的宠物蛋保留',0,35,14,C.muted,320);
    this.button(c,'cancel','继续当前',-82,-49,145,52,()=>this.render(),'#e8f3fa');this.button(c,'restart','重新出发',82,-49,145,52,()=>this.restart(),C.orange);}
  private restart(){this.state=restartRun(this.state);this.screen='game';this.save();this.render();}

  private hatchTime(ms:number){if(ms<=0)return '可以破壳啦！';const sec=Math.ceil(ms/1000);return Math.floor(sec/60).toString().padStart(2,'0')+':'+(sec%60).toString().padStart(2,'0');}
  private hatchery(){
    if(this.state.pendingHatch){this.hatchReveal();return;}
    const c=this.overlay('孵化屋',520),s=this.state;
    this.panel(c,0,178,310,36,'#fff0cf',12);this.text(c,'温暖能量  '+(s.warmth||0),0,178,18,'#a46d20',300,30);
    for(let index=0;index<2;index++){
      const x=index===0?-82:82,slot=s.incubators?.[index],egg=slot?s.eggs!.find(e=>e.id===slot.eggId):null;
      const p=this.panel(c,x,22,152,258,egg?'#f1f6ea':'#eaf2f7',18);
      this.text(p,'孵化位 '+(index+1),0,108,14,C.muted,140,24);
      if(egg&&slot){const ready=hatchRemaining(slot)===0;const art=this.eggArt(p,egg,0,47,90);this.breathe(art);
        this.text(p,this.eggName(egg),0,-13,15,this.eggTint(egg),140,26).isBold=true;
        const label=this.text(p,this.hatchTime(hatchRemaining(slot)),0,-45,20,ready?'#2b9b66':C.ink,142,30);this.hatchClock.push({label,index,ready});
        this.button(p,'hatch-slot-'+index,ready?'破壳！':'加速 5 分钟',0,-94,132,42,()=>{this.state=ready?claimHatch(this.state,index):accelerateHatch(this.state,index);this.save();this.hatchery();},ready?'#dba441':'#46976e',ready||(s.warmth||0)>0,16);
      }else{
        this.text(p,'+',0,41,62,'#9eb8c9',120,80);this.text(p,'离线也会成长',0,-38,13,C.muted,142,26);
        this.button(p,'hatch-slot-'+index,'放入宠物蛋',0,-94,132,42,()=>this.eggPicker(index),'#46976e',availableEggs(s).length>0,16);
      }
    }
    this.text(c,'每枚 30 分钟 · 每次加速消耗 1 点能量',0,-126,12,C.muted,330,24);
    this.text(c,'战胜普通 / 精英 / BOSS：能量 +1 / +2 / +3',0,-150,12,C.muted,330,24);
    this.button(c,'hatch-bag','蛋袋  '+availableEggs(s).length,-80,-192,146,40,()=>this.eggBag(),'#e8f3fa',true,15);
    this.button(c,'hatch-close',this.screen==='game'?'返回冒险':'返回营地',80,-192,146,40,()=>{if(this.screen!=='game')this.screen='home';this.render();},C.orange,true,16);
    this.text(c,'品质保底：SR 蛋 ≥ SR · SSR 蛋 = SSR',0,-230,12,'#967646',330,24);
  }
  private eggPicker(slot:number,page=0){
    const eggs=availableEggs(this.state),pages=Math.max(1,Math.ceil(eggs.length/4));page=Math.max(0,Math.min(page,pages-1));
    const c=this.overlay('选择宠物蛋',490);
    eggs.slice(page*4,page*4+4).forEach((egg,i)=>{const y=144-i*73;this.panel(c,0,y,316,66,'#f0f5e9',12);this.eggArt(c,egg,-121,y,56);
      this.text(c,this.eggName(egg),-23,y+12,17,this.eggTint(egg),140,26);this.text(c,'30 分钟',-23,y-15,12,C.muted,140,22);
      this.button(c,'incubate-'+egg.id,'放入',108,y,74,42,()=>{this.state=startIncubation(this.state,egg.id,slot);this.save();this.hatchery();},'#46976e',true,16);
    });
    if(!eggs.length)this.text(c,'没有待孵化的蛋',0,50,18,C.muted);
    this.button(c,'picker-prev','‹',-110,-123,58,34,()=>this.eggPicker(slot,page-1),C.blue,page>0,23);this.text(c,(page+1)+' / '+pages,0,-123,14,C.muted,80);
    this.button(c,'picker-next','›',110,-123,58,34,()=>this.eggPicker(slot,page+1),C.blue,page<pages-1,23);
    this.text(c,'普通：90% / 9% / 1%  ·  SR：95% / 5%\nSSR 蛋必定孵出 SSR 伙伴',0,-167,12,C.muted,328,45);
    this.button(c,'picker-back','返回孵化屋',0,-212,302,40,()=>this.hatchery(),C.orange,true,16);
  }
  private hatchReveal(){
    const r=this.state.pendingHatch;if(!r){this.hatchery();return;}
    const tint=r.rarity==='SSR'?'#b78022':r.rarity==='SR'?'#8b61bb':'#46976e',skill=skillFor({id:r.petId,rarity:r.rarity});
    const c=this.overlay(r.duplicate?'老朋友又见面啦':'新伙伴破壳啦！',520);
    this.panel(c,0,83,260,196,r.rarity==='SSR'?'#fff0ca':r.rarity==='SR'?'#f0e8fb':'#e6f3e8',28);
    const art=this.petImage(c,r.petId,0,85,165);art.setScale(.5,.5,1);tween(art).to(.3,{scale:Vec3.ONE},{easing:'backOut'}).start();
    this.text(c,rarityName(r.rarity)+' · '+PETS[r.petId].name,0,-34,24,tint,330,36).isBold=true;
    this.text(c,'HP '+(PETS[r.petId].hp+qualityHP(r.rarity))+'    ⚔ '+PETS[r.petId].faces.join(' / '),0,-70,16,C.ink,320,28);
    this.text(c,skill.name,0,-104,18,tint,320,28).isBold=true;this.text(c,skill.description,0,-143,14,C.muted,310,60);
    this.text(c,r.duplicate?'已拥有此品质 · 温暖能量 +'+r.warmthGain:'已收入收藏 · 自动技能随战斗触发',0,-187,13,tint,320,26);
    this.button(c,'hatch-ack','收下惊喜',0,-224,304,44,()=>{this.state=acknowledgeHatch(this.state);this.save();this.hatchery();},'#dba441',true,20);
  }
  private qualityDetail(id:PetId,rarity:EggRarity,page:number){
    const c=this.overlay(PETS[id].name,520),unlocked=unlockedRarities(this.state,id),selected=preferredRarity(this.state,id),skill=skillFor({id,rarity});
    RARITIES.forEach((r,i)=>this.button(c,'rarity-'+r,rarityName(r)+(unlocked.includes(r)?'':' · 未得'),(i-1)*106,173,98,37,()=>this.qualityDetail(id,r,page),r===rarity?(r==='SSR'?'#c39738':r==='SR'?'#9666bb':'#46976e'):'#e8f3fa',true,14));
    this.petImage(c,id,0,65,148);this.text(c,PETS[id].type+' · '+rarityName(rarity),0,-24,17,C.muted,300,28);
    this.text(c,'基础 HP '+(PETS[id].hp+qualityHP(rarity))+'  ·  ⚔ '+PETS[id].faces.join(' / '),0,-60,16,C.ink,320,28);
    this.text(c,skill.name,0,-98,22,rarity==='SSR'?'#b78022':rarity==='SR'?'#8b61bb':'#46976e',320,32).isBold=true;
    this.text(c,skill.description,0,-141,14,C.muted,310,64);
    const enabled=unlocked.includes(rarity)&&this.state.phase!=='battle'&&selected!==rarity;
    this.button(c,'use-rarity',!unlocked.includes(rarity)?'尚未获得':this.state.phase==='battle'?'战斗后可切换':selected===rarity?'正在使用':'使用此品质',0,-195,302,42,()=>{this.state=setPetRarity(this.state,id,rarity);this.save();this.qualityDetail(id,rarity,page);},C.blue,enabled,17);
    this.button(c,'quality-back','返回收藏',0,-237,302,30,()=>{this.render();this.collection(page);},'#e8f3fa',true,14);
  }

  private goHome(){this.screen='home';this.render();}
  private fillArt(key:string){const n=this.image(this.root,key,0,0,390,this.h),os=this.art[key].originalSize,k=Math.max(390/os.width,this.h/os.height);n.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);return n;}
  private menuIcon(parent:Node,kind:'map'|'dex'|'gear'|'lock',x:number,y:number,size:number,ink='#ffffff'){
    const n=this.makeNode(parent,kind,x,y,size,size),g=n.addComponent(Graphics);n.setScale(size/48,size/48,1);g.lineWidth=3;g.strokeColor=color(ink);g.fillColor=color(ink);
    if(kind==='map'){g.moveTo(-20,-16);g.lineTo(-20,17);g.lineTo(-7,12);g.lineTo(7,18);g.lineTo(20,13);g.lineTo(20,-19);g.lineTo(7,-14);g.lineTo(-7,-20);g.close();g.stroke();for(const dx of [-7,7]){g.moveTo(dx,-12);g.lineTo(dx,9);g.stroke();}g.fillColor=color('#ffe297');g.circle(8,4,6);g.fill();}
    if(kind==='dex'){g.roundRect(-19,-22,38,44,8);g.fill();g.fillColor=color('#f4fbff');g.roundRect(-14,-7,28,24,4);g.fill();g.fillColor=color('#df655b');g.circle(0,5,8);g.fill();g.strokeColor=color('#304d5a');g.moveTo(-8,5);g.lineTo(8,5);g.stroke();g.fillColor=color('#ffffff');g.circle(0,5,3);g.fill();g.fillColor=color('#304d5a');g.circle(-8,-15,2);g.circle(6,-15,2);g.fill();}
    if(kind==='gear'){g.circle(0,0,13);g.stroke();g.circle(0,0,5);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(Math.cos(a)*14,Math.sin(a)*14);g.lineTo(Math.cos(a)*20,Math.sin(a)*20);g.stroke();}}
    if(kind==='lock'){g.roundRect(-12,-17,24,21,5);g.fill();g.arc(0,4,9,0,Math.PI,false);g.stroke();g.fillColor=color('#ffffff');g.circle(0,-5,2);g.fill();}
    return n;
  }
  private sectionHeader(title:string,subtitle:string){const top=this.h/2;
    this.panel(this.root,0,top-44,390,88,'#e85d57',0);
    this.button(this.root,'nav-home','‹',-163,top-42,44,44,()=>this.goHome(),'#c94a49',true,30);
    this.text(this.root,title,0,top-32,23,'#ffffff',270,32).isBold=true;
    this.text(this.root,subtitle,0,top-61,12,'#ffe9d7',280,23);
  }
  private homeUI(){
    const s=this.state,H=this.h,b=-H/2,top=H/2;this.fillArt('home-camp-v1');
    this.panel(this.root,-78,top-47,194,64,'#fffdf1',22,240);
    this.text(this.root,'伙伴远行',-78,top-38,27,'#286977',182,38).isBold=true;
    this.text(this.root,'海岸营地 · 新的冒险在等你',-78,top-63,10,'#6f8b78',184,20);
    const setting=this.button(this.root,'home-settings','',161,top-39,44,44,()=>this.homeSettings(),'#fffdf1');this.menuIcon(setting,'gear',0,0,25,'#41717d');
    const petY=(top-98+b+360)/2,petSize=Math.max(112,Math.min(208,H-520));
    const shadow=this.makeNode(this.root,'camp-shadow',0,petY-petSize*.4,160,25),g=shadow.addComponent(Graphics);g.fillColor=color('#346951',55);g.ellipse(0,0,petSize*.38,12);g.fill();
    const lead=this.petImage(this.root,s.active.id,0,petY,petSize);this.breathe(lead);
    const tag=this.panel(this.root,0,b+350,192,30,'#fffdf0',15,240);this.text(tag,PETS[s.active.id].name+' · '+rarityName(s.active.rarity),0,0,15,'#316b70',184,26);
    this.panel(this.root,0,b+164,390,320,'#f8f5e8',28,246);
    const explore=this.button(this.root,'home-explore','',0,b+271,350,86,()=>{this.screen='adventure';this.render();},'#df6156');
    this.menuIcon(explore,'map',-128,0,47);this.text(explore,'探险',-35,16,28,'#ffffff',106,38).isBold=true;
    const ended=['lost','won'].includes(s.phase);this.text(explore,'草叶海岸  ·  '+(ended?'再次出发':s.step+' / 20'),11,-21,14,'#fff2d5',200,24);
    this.text(explore,'›',145,0,42,'#ffe4bd',40,60);
    const partners=this.button(this.root,'home-partners','',-90,b+164,170,104,()=>this.collection(0),'#427b9e');this.menuIcon(partners,'dex',-48,6,39,'#f3d58c');
    this.text(partners,'伙伴',25,10,24,'#ffffff',82,34).isBold=true;this.text(partners,'已收集 '+s.owned.length+' / '+PET_IDS.length,0,-31,13,'#dceef5',158,24);
    const incubating=(s.incubators||[]).filter(Boolean),ready=incubating.filter(slot=>hatchRemaining(slot!)===0).length;
    const nursery=this.button(this.root,'home-hatch','',90,b+164,170,104,()=>this.hatchery(),'#519b81');
    this.eggArt(nursery,{id:'home',rarity:'normal',affinity:'bud',stage:5},-48,9,46);
    this.text(nursery,'孵化屋',25,10,22,'#ffffff',94,34).isBold=true;
    this.homeHatchStatus=this.text(nursery,ready?'有 '+ready+' 枚可以破壳':incubating.length+' / 2 孵化中',0,-31,13,'#e5f7de',158,24);
    if(ready||s.pendingHatch){const dot=this.panel(nursery,73,43,24,24,'#f3ba4f',12);this.text(dot,'!',0,0,16,'#694b20',24,24);}
    for(let i=0;i<3;i++){const x=(i-1)*120,p=this.panel(this.root,x,b+64,110,64,'#e8e5d9',14);this.menuIcon(p,'lock',-28,3,24,'#a4ac9b');this.text(p,'待开放',15,2,13,'#919b90',64,25);}
    this.text(this.root,'PM v0.8.1 · 自动保存',0,b+15,10,'#85917f',320,18);
    this.fx=this.makeNode(this.root,'home-effects',0,0,390,H);
  }
  private homeSettings(){const c=this.overlay('营地设置',282);
    this.text(c,'收藏、宠物蛋与孵化进度会自动保存',0,56,14,C.muted,318,42);
    this.button(c,'resume','返回营地',0,0,300,46,()=>this.goHome(),C.blue);
    this.button(c,'restartConfirm','重新开始探险',0,-59,300,42,()=>this.confirmRestart(),'#e8f3fa',true,15);
    this.text(c,'重新出发保留收藏与孵化',0,-112,11,C.muted,300,20);
  }
  private adventureUI(){
    const H=this.h,b=-H/2,top=H/2;
    this.panel(this.root,0,0,390,H,'#edf3e8',0);this.sectionHeader('探险地图','发现伙伴 · 寻找宠物蛋');
    const maps=[{name:'草叶海岸',stages:20,tint:'#589c80',types:'18 种属性',pets:['fox','bud','turtle','ape','owl','dragon'] as PetId[],eggs:'全部 18 种属性',note:'普通 14 种 · 精英 2 种 · BOSS 2 种'},
      {name:'熔岩山径',stages:30,tint:'#b67e60',types:'火 · 岩石 · 地面 · 钢 · 龙',pets:['fox','turtle','mole','rhino','dragon','lynx'] as PetId[],eggs:'火 / 岩石 / 地面等属性蛋',note:'生态与掉落为规划示意'},
      {name:'霜月雪原',stages:40,tint:'#759bb3',types:'冰 · 水 · 超能力 · 妖精',pets:['seal','otter','owl','deer','ghost','bird'] as PetId[],eggs:'冰 / 水 / 超能力等属性蛋',note:'生态与掉落为规划示意'}];
    const m=maps[this.mapIndex],current=this.mapIndex===0;
    maps.forEach((map,i)=>{this.button(this.root,'map-'+i,(i===0?'01':'0'+(i+1))+' '+map.name,(i-1)*122,top-119,114,42,()=>{this.mapIndex=i;this.render();},i===this.mapIndex?map.tint:'#dbe5dc',true,13);});
    const center=(top-156+b+160)/2,height=top-156-(b+160),card=this.panel(this.root,0,center,354,height,'#fffdf5',22);
    this.panel(card,0,height/2-52,354,104,m.tint,22);this.menuIcon(card,'map',-123,height/2-51,44);
    this.text(card,m.name,28,height/2-36,27,'#ffffff',245,40).isBold=true;this.text(card,m.stages+' 关'+(current?' · 开放中':' · 规划中'),28,height/2-71,15,'#f5efcf',245,25);
    this.text(card,m.types,0,height/2-125,14,m.tint,330,25);
    const rowGap=Math.min(92,(height-195)/2),first=height/2-173;
    m.pets.forEach((id,i)=>{const x=(i%3-1)*104,y=first-Math.floor(i/3)*rowGap;this.petImage(card,id,x,y,Math.min(72,rowGap*.8));this.text(card,PETS[id].name,x,y-38,11,C.muted,102,20);});
    if(height>450){const routeY=-height/2+107;
      this.text(card,current?'海岸探险路线':'新的地区生态',0,routeY+42,13,m.tint,310,25);
      const path=this.makeNode(card,'route',0,routeY,290,50),g=path.addComponent(Graphics);g.strokeColor=color('#d6e2d3');g.lineWidth=4;g.moveTo(-136,0);g.lineTo(136,0);g.stroke();
      [1,Math.round(m.stages*.25),Math.round(m.stages*.5),Math.round(m.stages*.75),m.stages].forEach((step,i)=>{const x=(i-2)*68,done=current&&step<this.state.step,p=this.panel(path,x,0,30,30,done?m.tint:i===4?'#f2ce77':'#e6eddf',15);this.text(p,i===4?'★':''+step,0,0,14,done?'#ffffff':'#6c866f',28,27);});
    }
    this.text(card,m.note,0,-height/2+28,12,C.muted,330,24);
    const eggs=this.panel(this.root,0,b+115,354,70,'#dfeee0',16);this.eggArt(eggs,{id:'region',rarity:'SR',affinity:m.pets[0],stage:5},-137,0,44);
    this.text(eggs,current?'精英 / BOSS 巢穴寻蛋':'地区限定蛋 · 规划',24,15,16,'#41785c',270,27);this.text(eggs,m.eggs+' → 同属性伙伴',24,-15,12,'#64846e',270,24);
    const ended=['lost','won'].includes(this.state.phase),newRun=this.state.step===1&&this.state.phase==='encounter';
    this.button(this.root,'adventure-go',current?(ended?'再次出发':newRun?'出发！':'继续探险  '+this.state.step+' / 20'):'尚未开放',0,b+39,354,60,()=>{if(ended)this.restart();else{this.screen='game';this.render();}},current?'#df6156':'#aab7bd',current,23);
    this.fx=this.makeNode(this.root,'map-effects',0,0,390,H);
  }
  private partnersUI(){
    const s=this.state,H=this.h,top=H/2,b=-H/2,selected=this.partnerSelected||s.active.id;
    this.panel(this.root,0,0,390,H,'#edf4f5',0);this.sectionHeader('伙伴图鉴','拖到上方换队 · 点击查看伙伴');
    const slots=homeParty(s),teamY=top-150;
    slots.forEach((id,i)=>{const x=(i-1)*120,p=this.button(this.root,'team-slot-'+i,'',x,teamY,112,110,()=>{this.partnerSelected=id;this.render();},i===0?'#fff0d5':'#deedf2');
      const owned=s.owned.includes(id);if(owned)this.petImage(p,id,0,4,64);else this.menuIcon(p,'lock',0,6,31,'#9aacb0');
      this.text(p,i===0?'出战':'候补 '+i,0,40,12,i===0?'#b17a2d':'#63899a',100,22).isBold=true;this.text(p,owned?PETS[id].name:'空位',0,-38,13,C.ink,104,24);
      this.partyDropNodes.push(p);this.bindPartyDrag(p,id);
    });
    const filterY=top-232;this.text(this.root,'已收集 '+s.owned.length+' / '+PET_IDS.length,-101,filterY,16,C.ink,170,28).isBold=true;
    this.button(this.root,'partner-filter',this.partnerOwnedOnly?'已拥有 ▾':'全部图鉴 ▾',119,filterY,114,32,()=>{this.partnerOwnedOnly=!this.partnerOwnedOnly;this.partnerPage=0;this.render();},'#dbe9ef',true,13);
    const ids=this.partnerOwnedOnly?PET_IDS.filter(id=>s.owned.includes(id)):PET_IDS,pages=Math.max(1,Math.ceil(ids.length/6));this.partnerPage=Math.min(this.partnerPage,pages-1);
    const gridHeight=Math.min(148,Math.max(90,(H-510)/2)),gridTop=top-258-gridHeight/2,spacing=gridHeight+12;
    ids.slice(this.partnerPage*6,this.partnerPage*6+6).forEach((id,i)=>{const x=(i%3-1)*120,y=gridTop-Math.floor(i/3)*spacing,owned=s.owned.includes(id),chosen=id===selected;
      const p=this.button(this.root,'pet-'+id,'',x,y,112,gridHeight,()=>{this.partnerSelected=id;this.render();},chosen?'#fff1d6':'#ffffff'),petSize=Math.min(96,gridHeight-34);
      if(owned)this.petImage(p,id,0,4,petSize);else{const art=this.petImage(p,id,0,4,petSize);art.getComponent(Sprite)!.color=color('#697d89');art.getComponent(Sprite)!.grayscale=true;}
      this.text(p,PETS[id].name,0,-gridHeight/2+14,13,C.ink,108,22);this.text(p,owned?rarityName(preferredRarity(s,id)):'未收服',31,gridHeight/2-13,10,owned?'#a77d36':C.muted,48,18);
      if(chosen){const g=p.getComponent(Graphics)!;g.lineWidth=2;g.strokeColor=color('#dda841');g.roundRect(-55,-gridHeight/2+1,110,gridHeight-2,13);g.stroke();}
      this.bindPartyDrag(p,id);
    });
    this.button(this.root,'collection-prev','‹',-119,b+212,66,30,()=>{this.partnerPage=Math.max(0,this.partnerPage-1);this.render();},'#dbe9ef',this.partnerPage>0,22);
    this.text(this.root,(this.partnerPage+1)+' / '+pages,0,b+212,13,C.muted,94,25);
    this.button(this.root,'collection-next','›',119,b+212,66,30,()=>{this.partnerPage=Math.min(pages-1,this.partnerPage+1);this.render();},'#dbe9ef',this.partnerPage<pages-1,22);
    const owned=s.owned.includes(selected),rarity=preferredRarity(s,selected),detail=this.panel(this.root,0,b+102,390,186,'#fffdf5',22),skill=skillFor({id:selected,rarity});
    this.text(detail,PETS[selected].name,-82,67,19,C.ink,190,29).isBold=true;
    this.text(detail,PETS[selected].type+' · '+rarityName(rarity),105,67,13,'#889762',144,26);
    const faces=(s.active.id===selected?s.active:s.reserve?.id===selected?s.reserve:s.roster?.[selected])?.faces||PETS[selected].faces;
    this.text(detail,'HP '+(PETS[selected].hp+qualityHP(rarity))+'   /   ⚔ '+faces.join(' · '),-40,34,14,C.muted,270,25);
    this.button(detail,'partner-skill','技能 ›',135,34,72,28,()=>this.qualityDetail(selected,rarity,this.partnerPage),'#e4eef1',true,12);
    this.text(detail,skill.name,0,3,13,C.muted,356,25);
    const hint=this.panel(detail,0,-43,350,48,s.phase==='battle'?'#e5e9e9':'#e1f1e9',14);
    this.partyDragHint=this.text(hint,s.phase==='battle'?'战斗中 · 队伍已锁定':owned?'拖动宠物 → 上方出战 / 候补位':'未收服 · 通过探险或孵蛋获得',0,0,14,s.phase==='battle'?C.muted:'#45856c',336,38);
    this.fx=this.makeNode(this.root,'party-effects',0,0,390,H);
  }
  private cancelPartyDrag(){
    const d=this.partyDrag;if(!d)return;this.partyDrag=null;this.pressPending=false;
    if(d.source.isValid){const opacity=d.source.getComponent(UIOpacity);if(opacity)opacity.opacity=255;d.source.setScale(1,1,1);}
    d.ghost?.destroy();for(const guide of d.guides)guide.destroy();
  }
  private dragPoint(e:EventTouch){const p=e.getUILocation();return this.root.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(p.x,p.y,0));}
  private bindPartyDrag(n:Node,id:PetId){
    for(const type of [Node.EventType.TOUCH_START,Node.EventType.TOUCH_MOVE,Node.EventType.TOUCH_END,Node.EventType.TOUCH_CANCEL])n.off(type);
    n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{e.propagationStopped=true;if(this.busy||this.pressPending||this.partyDrag)return;
      const p=this.dragPoint(e);this.pressPending=true;
      this.partyDrag={id,touch:e.touch!.getID(),source:n,start:p,origin:this.root.getComponent(UITransform)!.convertToNodeSpaceAR(n.worldPosition),moved:false,ghost:null,guides:[],target:-1};
    });
    n.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{e.propagationStopped=true;const d=this.partyDrag;if(!d||d.touch!==e.touch!.getID())return;const p=this.dragPoint(e);
      if(!d.moved&&Vec3.distance(p,d.start)<10)return;
      if(!this.state.owned.includes(id)||!canManageParty(this.state)){d.moved=true;return;}
      if(!d.ghost){d.moved=true;const opacity=n.getComponent(UIOpacity)||n.addComponent(UIOpacity);opacity.opacity=120;
        d.ghost=this.panel(this.fx,p.x,p.y+48,90,92,'#fff5dc',18,244);this.petImage(d.ghost,id,0,3,78);
        this.text(d.ghost,PETS[id].name,0,-37,11,C.ink,86,18);
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
      if(canceled){this.cancelPartyDrag();this.render();return;}
      if(!d.moved){this.cancelPartyDrag();this.partnerSelected=id;this.lastTap=Date.now();this.render();return;}
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
