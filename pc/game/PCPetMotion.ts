import { _decorator, Component, Node, Vec3, UITransform, UIOpacity, Graphics, Color, tween, Tween } from 'cc';
const {ccclass}=_decorator;
type Pose='idle'|'charge'|'attack'|'hurt';
type Support='heal'|'guard'|'boost'|'taunt';
type Key={t:number;x:number;y:number;sx:number;sy:number;angle:number;alpha:number;pose?:Pose;hold?:boolean};
export interface PetMotionOptions {size:number;facing:1|-1;reduced:()=>boolean;pose?:(name:string)=>void;}
const key=(t:number,x=0,y=0,sx=1,sy=1,angle=0,pose?:Pose,alpha=255):Key=>({t,x,y,sx,sy,angle,pose,alpha});
const smooth=(t:number)=>t*t*(3-2*t);

/** One transform owner per pet. Cosmetics use elapsed time and never gameplay RNG. */
@ccclass('PCPetMotion')
export class PCPetMotion extends Component {
  size=200;
  private options!:PetMotionOptions;
  private home=new Vec3(); private homeScale=new Vec3(1,1,1); private opacity!:UIOpacity;
  private keys:Key[]=[]; private elapsed=0; private idleTime=0; private lastPose=''; private down=false;
  private current=key(0); private homeAngle=0; private shadow!:Node;
  configure(options:PetMotionOptions){this.options=options;this.size=options.size;this.home.set(this.node.position);this.homeScale.set(this.node.scale);this.homeAngle=this.node.eulerAngles.z;this.opacity=this.node.getComponent(UIOpacity)||this.node.addComponent(UIOpacity);this.idleTime=(this.home.x*.013+this.home.y*.009)%6;
    if(!this.shadow?.isValid&&this.node.parent){this.shadow=new Node('pet-ground-shadow');this.shadow.layer=this.node.layer;this.node.parent.addChild(this.shadow);this.shadow.addComponent(UITransform).setContentSize(options.size,options.size*.12);this.shadow.addComponent(UIOpacity);const ink=this.shadow.addComponent(Graphics);for(let i=0;i<4;i++){ink.fillColor=new Color(24,48,39,16);ink.ellipse(0,0,options.size*(.42-i*.035),options.size*(.052-i*.006));ink.fill();}this.shadow.setSiblingIndex(this.node.getSiblingIndex());}
    this.apply(this.current);this.setPose('idle');return this;}
  private setPose(value:Pose){if(value!==this.lastPose){this.lastPose=value;this.options.pose?.(value);}}
  private play(keys:Key[],factor:number){if(this.down)return;if(this.options.reduced()){this.settle();return;}const pose=keys[0]?.pose||'idle';this.keys=[{...this.current,t:0,pose},...keys.map(k=>({...k,t:k.t*Math.max(.2,factor)}))];this.elapsed=0;this.setPose(pose);}
  strike(target:Node|null,factor=1){const d=this.options.facing,posed=!!this.options.pose;let travel=Math.min(posed?116:52,this.size*(posed?.30:.14));
    if(target?.isValid&&this.node.parent){const p=this.node.parent.getComponent(UITransform)!.convertToNodeSpaceAR(target.worldPosition);travel=Math.min(travel,Math.max(30,Math.abs(p.x-this.home.x)*.3));}
    // Posed sprites can leap; a single illustration braces and casts without a paper cutout hop.
    const lift=posed?12:0,lean=posed?2.5:1.5;
    this.play([key(.075,-d*10,-2,1.014,.977,d*2,'charge'),key(.18,d*travel,lift,.99,1.01,-d*lean,'attack'),{...key(.218,d*travel,lift,.99,1.01,-d*lean,'attack'),hold:true},key(.31,d*travel*.42,lift*.35,1.005,.99,-d*.8,'attack'),key(.38,0,0,1.01,.99,0,'idle'),key(.43)],factor);
  }
  hurt(factor=1,strong=false){const d=this.options.facing,r=Math.min(strong?23:15,this.size*.07);this.play([key(.032,-d*r,0,1.018,.98,d*(strong?3.5:2),'hurt'),{...key(.065,-d*r,0,1.018,.98,d*(strong?3.5:2),'hurt'),hold:true},key(.14,-d*r*.25,0,1.005,.995,d*.5,'hurt'),key(.21,0,0,1,1,0,'idle')],factor);}
  support(kind:Support,factor=1){const guard=kind==='guard',d=this.options.facing;this.play([key(.09,guard?-d*5:0,0,guard?1.035:.985,guard?.955:1.025,guard?-d*2:0,'charge'),key(.2,0,0,1.012,.988,0,guard?'charge':'attack'),key(.34,0,0,1,1,0,'idle')],factor);}
  fall(factor=1){if(this.down)return;this.down=true;if(this.options.reduced()){this.node.active=false;return;}this.keys=[{...this.current,t:0},key(.11*factor,-this.options.facing*14,0,1.02,.96,-this.options.facing*9,'hurt',220),key(.32*factor,-this.options.facing*23,-8,.96,.88,-this.options.facing*16,'hurt',0)];this.elapsed=0;}
  settle(){this.keys=[];this.current=key(0);this.apply(this.current);if(!this.down)this.setPose('idle');}
  get isDown(){return this.down;}
  get moving(){return this.keys.length>0;}
  private apply(k:Key){this.current=k;this.node.setPosition(this.home.x+k.x,this.home.y+k.y,this.home.z);this.node.setScale(this.homeScale.x*k.sx,this.homeScale.y*k.sy,this.homeScale.z);this.node.setRotationFromEuler(0,0,this.homeAngle+k.angle);this.opacity.opacity=k.alpha;
    if(this.shadow?.isValid){const lift=Math.max(0,k.y),scale=1-Math.min(.12,lift/150);this.shadow.setPosition(this.home.x+k.x,this.home.y,this.home.z);this.shadow.setScale(scale,scale,1);this.shadow.getComponent(UIOpacity)!.opacity=k.alpha*(1-Math.min(.22,lift/85));this.shadow.active=this.node.active;}}
  update(dt:number){if(!this.options||!this.node.active)return;
    if(this.options.reduced()){if(this.down){this.node.active=false;return;}if(this.keys.length||this.current.sx!==1||this.current.sy!==1)this.settle();return;}
    // Use the same Cocos delta as semantic callbacks; wall time never drives this track.
    dt=Math.max(0,dt);this.idleTime+=dt;
    if(this.keys.length){this.elapsed+=dt;const frames=this.keys,last=frames[frames.length-1];let pose:Pose|undefined;for(const k of frames)if(k.t<=this.elapsed&&k.pose)pose=k.pose;if(pose)this.setPose(pose);
      if(this.elapsed>=last.t){this.apply(last);this.keys=[];if(this.down){this.node.active=false;if(this.shadow?.isValid)this.shadow.active=false;}return;}
      let i=1;while(i<frames.length-1&&frames[i].t<this.elapsed)i++;const a=frames[i-1],b=frames[i],u=b.hold?0:smooth(Math.min(1,(this.elapsed-a.t)/Math.max(.0001,b.t-a.t)));
      this.apply({t:this.elapsed,x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,sx:a.sx+(b.sx-a.sx)*u,sy:a.sy+(b.sy-a.sy)*u,angle:a.angle+(b.angle-a.angle)*u,alpha:a.alpha+(b.alpha-a.alpha)*u});
    }else if(!this.down){const w=Math.sin(this.idleTime*2.1);this.apply(key(0,0,0,1-w*.0025,1+w*.006,.25*Math.sin(this.idleTime*1.4)));}
  }
  onEnable(){if(this.shadow?.isValid)this.shadow.active=!this.down;}
  onDisable(){if(!this.down&&this.options)this.settle();if(this.shadow?.isValid)this.shadow.active=false;}
  onDestroy(){this.keys=[];if(this.shadow?.isValid)this.shadow.destroy();}
}
export function attachPetMotion(node:Node,options:PetMotionOptions):PCPetMotion{return (node.getComponent(PCPetMotion)||node.addComponent(PCPetMotion)).configure(options);}

const tint=(value:string,alpha=255)=>{const c=new Color();Color.fromHEX(c,value);c.a=alpha;return c;};
const COLORS:Record<string,string>={'火':'#ffad58','草':'#a7de75','水':'#7ddcf6','电':'#ffe580','冰':'#c7f5ff','龙':'#b6a6fa','幽灵':'#c6a2f1','毒':'#d697ed','岩石':'#e4c597','地面':'#dcb889','钢':'#b8dfdf','超能':'#f3a8d6','妖精':'#ffb8d8','恶':'#bbafdd','格斗':'#f5ad87','飞行':'#c8edf2','虫':'#c8df87','一般':'#f4dfa9'};
/** Bounded local effects. HUD/camera and gameplay clocks never shake or freeze. */
export class PCBattleEffects {
  private root:Node;private live=new Set<Node>();private disposed=false;
  constructor(parent:Node,private reduced:()=>boolean){this.root=this.node(parent,'pc-combat-fx',0,0);}
  private node(parent:Node,name:string,x:number,y:number){const n=new Node(name);n.layer=parent.layer;parent.addChild(n);n.addComponent(UITransform).setContentSize(1,1);n.setPosition(x,y);return n;}
  private point(target:Node){const m=target.getComponent(PCPetMotion),center=new Vec3(0,(m?.size||180)*.44,0),world=target.getComponent(UITransform)!.convertToWorldSpaceAR(center);return this.root.getComponent(UITransform)!.convertToNodeSpaceAR(world);}
  private effect(name:string,p:Vec3,duration:number){if(this.disposed||!this.root.isValid)return null;
    if(this.live.size>=14){const old=this.live.values().next().value as Node;this.remove(old);}
    const n=this.node(this.root,name,p.x,p.y);this.live.add(n);n.addComponent(UIOpacity);tween(n).delay(duration).call(()=>this.remove(n)).start();return n;}
  private remove(n:Node){if(!n)return;this.live.delete(n);const stop=(a:Node)=>{Tween.stopAllByTarget(a);const op=a.getComponent(UIOpacity);if(op)Tween.stopAllByTarget(op);for(const child of a.children)stop(child);};if(n.isValid){stop(n);n.destroy();}}
  private fade(n:Node,hold:number,duration:number){tween(n.getComponent(UIOpacity)!).delay(hold).to(duration,{opacity:0}).start();}
  trail(from:Node,to:Node,type:string,duration=.18){if(this.reduced()||!from?.isValid||!to?.isValid)return;const a=this.point(from),b=this.point(to),n=this.effect('element-flight',a,duration+.04);if(!n)return;const g=n.addComponent(Graphics),c=COLORS[type]||COLORS['一般'],dir=b.x>=a.x?1:-1;g.fillColor=tint(c,145);g.ellipse(-dir*17,0,28,8);g.fill();g.fillColor=tint('#fff8db',240);g.circle(0,0,8);g.fill();g.strokeColor=tint(c,175);g.lineWidth=3;g.moveTo(-dir*56,-8);g.lineTo(-dir*12,-3);g.moveTo(-dir*44,10);g.lineTo(-dir*14,4);g.stroke();tween(n).to(duration,{position:b},{easing:'quadIn'}).start();this.fade(n,duration*.8,duration*.2+.025);}
  hit(target:Node,type:string,strong=false){if(!target?.isValid)return;const p=this.point(target),minimal=this.reduced(),n=this.effect('contact-burst',p,minimal?.18:.43);if(!n)return;const c=COLORS[type]||COLORS['一般'],g=n.addComponent(Graphics),r=strong?51:38;
    g.fillColor=tint(c,minimal?45:65);g.circle(0,0,r);g.fill();g.strokeColor=tint('#fff8df',230);g.lineWidth=strong?5:3;g.arc(0,0,r*.7,.2,5.5,false);g.stroke();g.strokeColor=tint(c,225);g.lineWidth=3;g.arc(0,0,r*1.05,2,6.2,false);g.stroke();
    if(!minimal){g.strokeColor=tint('#fff8e2',235);g.lineWidth=4;g.moveTo(-r*.82,-r*.65);g.lineTo(r*.84,r*.7);g.moveTo(-r*.4,r*.65);g.lineTo(r*.5,-r*.7);g.stroke();for(let i=0;i<7;i++){const a=i*2.399,particle=this.node(n,'element-spark',0,0),ink=particle.addComponent(Graphics);ink.fillColor=tint(i%2?c:'#fff9e6',210);ink.ellipse(0,0,3,7);ink.fill();particle.setRotationFromEuler(0,0,-a*180/Math.PI);tween(particle).to(.3,{position:new Vec3(Math.cos(a)*r*1.6,Math.sin(a)*r*1.3),scale:new Vec3(.15,.15,1)},{easing:'quadOut'}).start();}}
    n.setScale(.72,.72,1);tween(n).to(.15,{scale:new Vec3(1.13,1.13,1)},{easing:'quadOut'}).start();this.fade(n,minimal?0:.055,minimal?.15:.3);
  }
  cast(target:Node,kind:Support){if(!target?.isValid)return;const p=this.point(target),n=this.effect('support-'+kind,p,.55);if(!n)return;const g=n.addComponent(Graphics),c=kind==='heal'?'#a1ecc4':kind==='guard'?'#9cdeef':kind==='boost'?'#ffe194':'#ffc18d';g.strokeColor=tint(c,205);g.lineWidth=3;
    if(kind==='guard'){g.moveTo(-42,36);g.quadraticCurveTo(0,46,42,36);g.lineTo(35,-7);g.quadraticCurveTo(22,-33,0,-49);g.quadraticCurveTo(-22,-33,-35,-7);g.close();g.fillColor=tint(c,35);g.fill();g.stroke();}
    else {g.ellipse(0,-28,49,15);g.stroke();for(let i=0;i<4;i++){const x=-32+i*22,y=(i%2)*20;g.moveTo(x-5,y);g.lineTo(x+5,y);g.moveTo(x,y-5);g.lineTo(x,y+5);g.stroke();}}
    if(!this.reduced())tween(n).by(.45,{position:new Vec3(0,25,0)},{easing:'sineOut'}).start();this.fade(n,.12,.4);
  }
  dispose(){this.disposed=true;for(const n of [...this.live])this.remove(n);if(this.root.isValid)this.root.destroy();}
}
