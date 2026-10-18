import { _decorator, Component, Node, Canvas, Camera, UITransform, Graphics, Color, Label, LabelOutline, Sprite,
  SpriteFrame, Texture2D, Rect, Size, resources, Layers, view, ResolutionPolicy, EventTouch, tween, Tween, Vec3, UIOpacity, sys, game, Game, profiler } from 'cc';
import { BATTLE_RECTS } from './BattleArt';
import { State, PetId, Action, PETS, fresh, act, hp, maxHP, enemyName, enemyAttackFaces, restore, equipReserve, selectActive, healAmount, attackAmount, guardDamage, rewardOptions, canManageParty, restartRun } from './PMModel';
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
      await Promise.all(['fox','bud','turtle','battle-arena','attack-die-a','heal-potion','power-potion','guard-shield','loot-chest','refresh-enemy','battle-start'].map(async key=>{
        this.art[key]=await new Promise<SpriteFrame>((resolve,reject)=>resources.load('art/'+key+'/spriteFrame',SpriteFrame,(e,r)=>e?reject(e):resolve(r)));
      }));
      await Promise.all((['fox','bud','turtle'] as PetId[]).map(async id=>{
        const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('art/'+id+'-battle-ref/texture',Texture2D,(e,r)=>e?reject(e):resolve(r)));
        for(const side of ['back','front'] as const){const [x,y,w,h]=BATTLE_RECTS[id][side],frame=new SpriteFrame();
          frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art[id+'-'+side]=frame;
        }
      }));
      this.ready=true;this.render();this.save();
      game.on(Game.EVENT_HIDE,this.onHide,this);
      (globalThis as any).__pm={snapshot:()=>JSON.parse(JSON.stringify(this.state)),controls:()=>({...this.controls}),animating:()=>this.busy||this.pressPending,version:'0.3.0',ready:true};
    }catch(e){this.loading!.string='资源加载失败，请刷新重试';console.error('PM asset loading',e);}
  }
  onDestroy(){game.off(Game.EVENT_HIDE,this.onHide,this);}
  private onHide(){if(this.ready)this.save();}
  update(){for(let i=this.availableGlows.length-1;i>=0;i--){const glow=this.availableGlows[i];if(!glow.isValid)this.availableGlows.splice(i,1);else {const encounterAction=this.state.phase==='encounter'&&(glow.parent?.name==='reroll'||glow.parent?.name==='challenge');glow.active=!this.busy&&(!this.pressPending||encounterAction);}}
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
    l.cacheMode=Label.CacheMode.CHAR;l.overflow=Label.Overflow.SHRINK;return l;
  }
  private button(parent:Node,id:string,value:string,x:number,y:number,w:number,h:number,callback:()=>void,fill=C.blue,enabled=true,size=17,inactiveFill='#c9d8e2'){
    const n=this.panel(parent,x,y,w,h,enabled?fill:inactiveFill,14);n.name=id;
    this.text(n,value,0,0,size,enabled?(fill===C.paper||fill==='#e8f3fa'?C.ink:'#ffffff'):'#6a7d8b',w-12,h-4);
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
  private petImage(parent:Node,id:PetId,x:number,y:number,size:number,role:'player'|'enemy'|'card'='card'){
    const key=role==='player'?id+'-back':role==='enemy'?id+'-front':id;
    return this.image(parent,key,x,y,size,size);
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
  private groundPet(n:Node,id:PetId,side:'back'|'front',x:number,y:number){
    // Contact centers measured within each trimmed sprite; tails/ears are not ground anchors.
    const feet={fox:{back:[.647,.945],front:[.381,.941]},bud:{back:[.644,.951],front:[.431,.944]},turtle:{back:[.498,.931],front:[.488,.921]}};
    const [u,v]=feet[id][side],ui=n.getComponent(UITransform)!;
    ui.setAnchorPoint(u,.5);n.setPosition(x,y+(v-.5)*ui.height);this.breathe(n,y);
  }
  private clear(){const stop=(n:Node)=>{Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);for(const child of n.children)stop(child);};for(const n of [...this.root.children]){stop(n);n.destroy();}this.root.removeAllChildren();this.controls={};this.modal=null;this.enemyNode=null;this.playerNode=null;this.diceNode=null;this.meters={};this.availableGlows=[];}
  private render(){
    this.clear();this.layout();const s=this.state,H=this.h,b=-H/2;
    const phase=s.phase;const panelHeight=phase==='battle'?246:phase==='team'?300:phase==='reward'?350:phase==='encounter'?308:230;
    const sceneHeight=H-panelHeight;
    const bg=this.makeNode(this.root,'background',0,panelHeight/2,390,sceneHeight);const sp=bg.addComponent(Sprite);sp.spriteFrame=this.art['battle-arena'];sp.sizeMode=Sprite.SizeMode.CUSTOM;
    const os=this.art['battle-arena'].originalSize,k=Math.max(390/os.width,sceneHeight/os.height);bg.getComponent(UITransform)!.setContentSize(os.width*k,os.height*k);
    this.stage=this.makeNode(this.root,'actors',0,0,390,H);
    // Navigation stays at the edge; combat data belongs to the creature in the scene.
    const title=this.text(this.root,'草叶海岸 '+s.step+'/9',0,H/2-30,18,'#ffffff',280,36);
    title.isBold=true;const outline=title.node.addComponent(LabelOutline);outline.color=color('#254b4d');outline.width=2;
    this.button(this.root,'menu','···',161,H/2-30,44,42,()=>this.menu(),C.paper,true,24);
    const stageBottom=b+panelHeight;const stageTop=H/2-92;const area=stageTop-stageBottom;
    const center=stageBottom+area*.48;const size=Math.max(125,Math.min(245,area*.67));
    if(phase==='battle'){
      // Low camera composition from the approved reference: two distinct diagonal battle pads.
      const playerGround=H/2-sceneHeight*.92,enemyGround=H/2-sceneHeight*.62;
      const baseSize=Math.min(230,sceneHeight*.38),playerSize=baseSize*1.2,enemySize=baseSize*.65*.8*(s.step===9?1.1:1);
      const enemyX=82,playerX=Math.max(-92,-187+playerSize/2);
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
      const statusY=H/2-144,room=statusY-70-stageBottom-22,petSize=Math.min(245,room*.88),petY=stageBottom+room*.5;
      this.shadow(0,petY-petSize*.4,145);this.enemyNode=this.petImage(this.stage,s.enemy,0,petY,petSize,'enemy');this.breathe(this.enemyNode);
      const status=this.panel(this.root,0,statusY,350,94,C.paper,14,246);status.name='encounter-enemy-hud';
      const pointer=status.getComponent(Graphics)!;pointer.moveTo(-6,-45);pointer.lineTo(0,-55);pointer.lineTo(6,-45);pointer.close();pointer.fill();
      this.petImage(status,s.enemy,-142,17,52);
      this.encounterNameAttack(status,enemyName(s),enemyAttackFaces(s),30);
      this.bar(status,30,5,272,1,s.enemyMax+' / '+s.enemyMax);
      const r=s.reward,pointReward=r.kind==='attack'||r.kind==='heal';
      const contentWidth=s.step===9?28:r.kind==='hp'?80:pointReward?35+r.values.length*36-6:54;
      const rewardLeft=-(40+12+contentWidth)/2,contentLeft=rewardLeft+52;
      this.text(status,'奖励',rewardLeft+20,-29,15,C.muted,40,24);
      if(s.step===9){this.text(status,'★',contentLeft+14,-29,24,'#e49424',28,26);}
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
      this.text(sheet,'已收集 '+s.owned.length+' / 3   ·   通关 '+s.wins+' 次',0,37,15,C.muted);
      this.button(sheet,'restart','再来一局',0,-17,340,58,()=>this.restart(),C.orange,true,22);
      this.button(sheet,'collection','查看伙伴',0,-77,340,42,()=>this.collection(),C.paper,true,15);
    }
    this.text(this.root,this.saveError?'保存失败，请勿关闭页面':'PM v0.3  ·  自动续玩',0,b+8,10,this.saveError?'#c44141':C.muted,350,14);
    this.fx=this.makeNode(this.root,'battle-effects',0,0,390,H);
    if(phase==='reward'||phase==='won'){const n=this.enemyNode!;const pos=n.position.clone();tween(n).by(.18,{position:new Vec3(0,15,0)},{easing:'quadOut'}).to(.2,{position:pos},{easing:'quadIn'}).start();}
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
    (['fox','bud','turtle'] as PetId[]).forEach((id,i)=>{
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
      this.scheduleOnce(()=>{this.render();this.busy=false;},.68);return;
    }
    const retaliation=()=>{this.strike(enemy,player,()=>{
      const damage=a==='guard'?guardDamage(old.enemyAttack):old.enemyAttack;
      this.hurt(player,damage,a==='guard');this.lifeTo('player',next.hpRatio,maxHP(next));
    });};
    if(a==='attack'){
      this.strike(player,enemy,()=>{this.hurt(enemy,attackAmount(old));this.lifeTo('enemy',next.enemyHP/old.enemyMax,old.enemyMax);});
      if(next.enemyHP>0){this.scheduleOnce(retaliation,.48);this.scheduleOnce(()=>this.settle(),1.04);}
      else this.scheduleOnce(()=>this.settle(),.76);
    }else{this.shield(player);this.scheduleOnce(retaliation,.12);this.scheduleOnce(()=>this.settle(),.74);}
  }
  private overlay(title:string,h=350){
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
    this.text(c,'第一版 · 3 只伙伴 · 9 场冒险',0,112,14,C.muted);
    this.button(c,'resume','继续冒险',0,58,300,50,()=>this.render(),C.orange);
    this.button(c,'collection','伙伴收藏  '+this.state.owned.length+' / 3',0,-3,300,48,()=>this.collection(),C.blue);
    this.button(c,'restartConfirm','重新开始本局',0,-64,300,46,()=>this.confirmRestart(),'#e8f3fa');
    this.text(c,'每回合随机：治疗 ×1/2/3，强化 ×2/3/4\n道具每回合各一次，攻击 / 防御推进回合\n退出后自动续玩，换宠不回血',0,-132,12,C.muted,320,65);
  }
  private collection(){const c=this.overlay('伙伴收藏',470),s=this.state;const ids:PetId[]=['fox','bud','turtle'];
    for(let i=0;i<3;i++){const id=ids[i],y=125-i*101;this.petImage(c,id,-117,y,78);const owned=s.owned.includes(id);
      this.text(c,owned?PETS[id].name:'尚未结识',-13,y+22,17,C.ink,126);this.text(c,PETS[id].trait,-13,y-4,12,C.muted,126);
      const ready=owned&&canManageParty(s)&&id!==s.active.id&&id!==s.reserve?.id;
      const ended=s.phase==='won'||s.phase==='lost';
      this.button(c,'equip-'+id,id===s.active.id?(ended?'下局出战':'出战中'):id===s.reserve?.id?(ended?'下局候补':'候补中'):owned?'设为候补':'未收服',105,y,102,43,()=>{const n=equipReserve(this.state,id);if(n!==this.state){this.state=n;this.save();}this.collection();},C.blue,ready,12);
    }
    this.text(c,s.phase==='lost'||s.phase==='won'?'现在可调整候补，下局沿用所选队伍':canManageParty(s)?'可调整候补 · 本局强化仅跟随在队伙伴':'战斗结束后可调整候补',0,-135,11,C.muted,330);
    this.button(c,'closeCollection','返回冒险',0,-188,302,46,()=>this.render(),C.orange);
  }
  private confirmRestart(){const c=this.overlay('重新出发？',250);this.text(c,'本局进度重置，收藏与通关记录保留',0,35,14,C.muted,320);
    this.button(c,'cancel','继续当前',-82,-49,145,52,()=>this.render(),'#e8f3fa');this.button(c,'restart','重新出发',82,-49,145,52,()=>this.restart(),C.orange);}
  private restart(){this.state=restartRun(this.state);this.save();this.render();}
}
