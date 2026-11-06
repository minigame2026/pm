import { Node, UITransform, Graphics, Color, Label, Sprite, Vec3, tween, Tween, UIOpacity, Layers, EventTouch, Mask, sys } from 'cc';
import { PMArt } from './PMArt';
import {pcTr,pcFont} from './PCLocale';

export const PC = { ink:'#193e47', muted:'#526d6a', paper:'#fffaf0', green:'#287d70', navy:'#193e47', gold:'#edc574', line:'#d9e1d8', red:'#c96750' };
export const hex = (value:string, alpha=255) => { const c=new Color(); Color.fromHEX(c,value); c.a=alpha; return c; };
export interface Control {node:Node; entry:Node; visual:Node; rim:UIOpacity; label:Label; run:()=>void; enabled:boolean; reason:string; fill:string; x:number; y:number; w:number; h:number; hovered:boolean; armed:boolean; flat:boolean; kind:string;}

/** Native Cocos UI. Coordinates are centers in a 1600 x 900 desktop composition. */
export class PCUI {
  controls = new Map<string,Control>();
  private minimal = false;
  private entrances = new Map<Node,()=>void>();
  private textSources = new WeakMap<Label,string>();
  get reduced(){return this.minimal;}
  set reduced(value:boolean){this.minimal=value;if(value){for(const finish of Array.from(this.entrances.values()))finish();for(const c of this.controls.values())this.feedback(c);}}
  onActivate = () => {};
  onHint = (_text:string, _control?:Control, _pressed=false) => {};
  canActivate = (_control:Control) => true;
  constructor(public root:Node, public art:PMArt) {}
  node(parent:Node,name:string,x:number,y:number,w=1,h=1) {
    const n=new Node(name); n.layer=Layers.Enum.UI_2D; parent.addChild(n); n.setPosition(x,-y);
    n.addComponent(UITransform).setContentSize(w,h); return n;
  }
  surface(n:Node,w:number,h:number,fill:string,alpha=255,border=PC.line,r=12,raised=true) {
    const g=n.getComponent(Graphics)||n.addComponent(Graphics); g.clear();
    if(alpha>220&&raised){g.fillColor=hex('#183b36',14);g.roundRect(-w/2,-h/2-5,w,h,r);g.fill();}
    g.fillColor=hex(fill,alpha);g.roundRect(-w/2,-h/2,w,h,r);g.fill();
    if(border){g.strokeColor=hex(border,Math.min(alpha,180));g.lineWidth=1;g.roundRect(-w/2+.5,-h/2+.5,w-1,h-1,r);g.stroke();}
  }
  panel(parent:Node,x:number,y:number,w:number,h:number,fill=PC.paper,alpha=255,r=16) {
    const n=this.node(parent,'panel',x,y,w,h);this.surface(n,w,h,fill,alpha,fill===PC.navy?'#83a597':PC.line,r);return n;
  }
  hud(parent:Node,x:number,y:number,w:number,h:number,alpha=218) {
    const n=this.node(parent,'hud',x,y,w,h);this.surface(n,w,h,PC.navy,alpha,'',5,false);return n;
  }
  text(parent:Node,value:string,x:number,y:number,size=20,fill=PC.ink,w=300,h=size+12,align:'left'|'center'|'right'='center') {
    const n=this.node(parent,'text',x,y,w,h),l=n.addComponent(Label),property=Object.getOwnPropertyDescriptor(Label.prototype,'string')!;
    // Localize only PC-owned labels, including later counters and combat updates.
    Object.defineProperty(l,'string',{configurable:true,get:()=>property.get!.call(l),set:(v:string)=>{const source=String(v??'');this.textSources.set(l,source);property.set!.call(l,pcTr(source));}});
    l.string=value;l.fontSize=size;l.lineHeight=Math.ceil(size*1.38);
    l.fontFamily=pcFont();l.color=hex(fill);l.cacheMode=Label.CacheMode.NONE;
    l.horizontalAlign=align==='left'?Label.HorizontalAlign.LEFT:align==='right'?Label.HorizontalAlign.RIGHT:Label.HorizontalAlign.CENTER;
    l.verticalAlign=Label.VerticalAlign.CENTER;l.overflow=Label.Overflow.SHRINK;l.enableWrapText=h>size*1.8;return l;
  }
  refreshTextResolution(){
    // Fixed-layout nodes do not resize with the window. Rebuild glyph textures at the new output scale.
    for(const label of this.root.getComponentsInChildren(Label))if(label.isValid&&label.node.activeInHierarchy)label.updateRenderData(true);
  }
  refreshLanguage(){
    for(const label of this.root.getComponentsInChildren(Label)){
      const source=this.textSources.get(label);if(source===undefined||!label.isValid)continue;
      label.string=source;label.fontFamily=/^[+−×\-\d\s./]+$/.test(source)?pcFont('en'):pcFont();
    }
  }
  combatText(parent:Node,value:string,x:number,y:number,fill=PC.gold,size=42,w=260){
    const label=this.text(parent,value,x,y,size,fill,w,Math.max(size+26,Math.ceil(size*1.5)));label.isBold=true;label.enableWrapText=false;
    label.enableOutline=true;label.outlineWidth=size>=56?6:size>=32?4:size>=24?3:2;label.outlineColor=hex('#10232d');return label;
  }
  impactText(parent:Node,value:string,x:number,y:number,fill:string,size:number,w:number){
    if(!sys.isNative||sys.os!==sys.OS.WINDOWS)return this.combatText(parent,value,x,y,fill,size,w).node;
    // Cocos 3.8 Win32 Canvas strokeText is empty. Layer glyphs for an actual native outline.
    const n=this.node(parent,'impact-glyph',x,y,w,Math.ceil(size*1.6)),radius=size>=56?6:size>=32?4:3,numeric=/^[+-]?\d+$/.test(value);
    const glyph=(dx:number,dy:number,color:string)=>{const l=this.text(n,value,dx,dy,size,color,w,Math.ceil(size*1.6));l.isBold=true;l.enableWrapText=false;l.fontFamily=numeric?pcFont('en'):pcFont();return l;};
    for(let i=0;i<12;i++){const a=i*Math.PI/6;glyph(Math.cos(a)*radius,Math.sin(a)*radius,'#10232d');}
    glyph(0,0,fill);return n;
  }
  animateImpact(root:Node,amount:Node,onDone=()=>{}){
    const opacity=root.addComponent(UIOpacity),done=()=>{onDone();if(root.isValid)this.dispose(root);};
    if(this.reduced){tween(opacity).delay(1.05).call(done).start();return;}
    // Only the number punches in; the caption stays still and legible. This never holds the action gate.
    amount.setScale(.68,.68,1);tween(amount).to(.075,{scale:new Vec3(1.2,1.2,1)},{easing:'quadOut'}).to(.14,{scale:new Vec3(1,1,1)},{easing:'cubicOut'}).start();
    tween(root).by(.1,{position:new Vec3(0,14,0)},{easing:'quadOut'}).delay(.64).by(.31,{position:new Vec3(0,25,0)},{easing:'quadIn'}).start();
    tween(opacity).delay(.74).to(.31,{opacity:0}).call(done).start();
  }
  battlePlate(parent:Node,x:number,y:number,w:number,h:number,accent='#d4bb83'){
    const n=this.node(parent,'battle-ribbon',x,y,w,h);this.battleSurface(n,w,h,accent);return n;
  }
  battleSurface(n:Node,w:number,h:number,accent='#d4bb83',alpha=220){
    const g=n.getComponent(Graphics)||n.addComponent(Graphics),cut=Math.min(18,h*.32);g.clear();g.fillColor=hex('#14282b',alpha);
    g.moveTo(-w/2+cut,-h/2);g.lineTo(w/2,-h/2);g.lineTo(w/2-cut,h/2);g.lineTo(-w/2,h/2);g.close();g.fill();
    g.strokeColor=hex('#e5d9ba',170);g.lineWidth=1;g.stroke();g.strokeColor=hex(accent);g.lineWidth=3;
    g.moveTo(-w/2+cut,h/2-1);g.lineTo(w/2-cut*2,h/2-1);g.stroke();
    g.strokeColor=hex(accent,140);g.lineWidth=1;g.moveTo(-w/2+cut,-h/2-4);g.lineTo(-w/2+w*.35,-h/2-4);g.stroke();
  }
  private diamond(g:Graphics,w:number,h:number,inset=0){g.moveTo(0,h/2-inset);g.lineTo(w/2-inset,0);g.lineTo(0,-h/2+inset);g.lineTo(-w/2+inset,0);g.close();}
  battleStock(parent:Node,value:string,x:number,y:number){const n=this.node(parent,'item-stock',x,y,32,32),g=n.addComponent(Graphics);g.fillColor=hex('#f4ead0');g.circle(0,0,16);g.fill();g.strokeColor=hex('#1b3034');g.lineWidth=2;g.stroke();const l=this.text(n,value,0,0,20,PC.ink,28,28);l.isBold=true;return l;}
  commandPulse(id:string){const c=this.controls.get(id);if(!c||this.reduced||!['battle-die','battle-command'].includes(c.kind))return;let n=c.visual.getChildByName('command-pulse');if(!n){n=this.node(c.visual,'command-pulse',0,0,c.w,c.h);const g=n.addComponent(Graphics);g.strokeColor=hex('#ffe6a2');g.lineWidth=3;this.diamond(g,c.w,c.h,2);g.stroke();n.addComponent(UIOpacity);}const o=n.getComponent(UIOpacity)!;Tween.stopAllByTarget(n);Tween.stopAllByTarget(o);n.setScale(1,1,1);o.opacity=240;tween(n).to(.28,{scale:new Vec3(1.18,1.18,1)},{easing:'quadOut'}).start();tween(o).to(.28,{opacity:0}).start();}
  button(parent:Node,id:string,value:string,x:number,y:number,w:number,h:number,run:()=>void,fill=PC.paper,enabled=true,reason='',kind='normal') {
    // The hit slot never moves. Entrance and press feedback own separate visual transforms.
    const n=this.node(parent,id,x,y,w,h),entry=this.node(n,'button-entry',0,0,w,h),visual=this.node(entry,'button-visual',0,0,w,h),flat=id.startsWith('nav-');
    if(flat)kind='nav';
    const edge=this.node(visual,'hover-rim',0,0,w,h),g=edge.addComponent(Graphics);g.strokeColor=hex(PC.gold,255);g.lineWidth=2;
    if(kind==='round')g.circle(0,0,Math.min(w,h)/2-2);else if(kind==='battle-die'||kind==='battle-command')this.diamond(g,w,h,1);else if(kind==='battle-tag'){const cut=Math.min(18,h*.32);g.moveTo(-w/2+cut,-h/2);g.lineTo(w/2,-h/2);g.lineTo(w/2-cut,h/2);g.lineTo(-w/2,h/2);g.close();}else g.roundRect(-w/2+1,-h/2+1,w-2,h-2,kind==='nav'?12:16);g.stroke();const rim=edge.addComponent(UIOpacity);rim.opacity=0;
    const label=this.text(visual,value,flat?15:0,0,flat?19:20,enabled?(kind.startsWith('battle')||fill===PC.green||fill===PC.navy||fill===PC.red?'#fffdf2':PC.ink):(kind.startsWith('battle')?'#9ba9a4':'#7e8c89'),w-(flat?64:24),h-6,flat?'left':'center');label.isBold=true;
    const c:Control={node:n,entry,visual,rim,label,run,enabled,reason,fill,x,y,w,h,hovered:false,armed:false,flat,kind};this.drawControl(c);this.controls.set(id,c);
    n.on(Node.EventType.MOUSE_ENTER,()=>{c.hovered=true;this.feedback(c);this.onHint(c.reason,c);});
    n.on(Node.EventType.MOUSE_LEAVE,()=>{c.hovered=false;c.armed=false;this.feedback(c);this.onHint('');});
    n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{e.propagationStopped=true;c.armed=c.enabled&&this.canActivate(c);if(!c.enabled&&this.canActivate(c))this.onHint(c.reason,c,true);this.feedback(c);});
    n.on(Node.EventType.TOUCH_CANCEL,()=>{c.armed=false;this.feedback(c);});
    n.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;const accepted=c.armed;c.armed=false;this.feedback(c);if(accepted&&this.controls.get(id)===c)this.activate(id);});
    return visual;
  }
  private drawControl(c:Control){const {visual:n,w,h,kind}=c,fill=c.enabled?c.fill:'#e6e9e2',g=n.getComponent(Graphics)||n.addComponent(Graphics);g.clear();
    if(kind==='battle-die'||kind==='battle-command'){
      g.fillColor=hex('#0a181c',220);this.diamond(g,w,h);g.fill();g.strokeColor=hex('#ecdfbc',c.enabled?240:100);g.lineWidth=2;g.stroke();
      g.fillColor=hex(c.enabled?(kind==='battle-die'||c.fill===PC.gold?'#a54637':'#20393c'):'#263638',240);this.diamond(g,w,h,7);g.fill();
      g.strokeColor=hex(c.enabled?(kind==='battle-die'?'#f4c879':'#91a8a1'):'#586866');g.lineWidth=1;g.stroke();
      g.strokeColor=hex('#f7e9c5',c.enabled?160:50);g.lineWidth=2;g.moveTo(-w/2+16,0);g.lineTo(0,h/2-16);g.lineTo(w/2-16,0);g.stroke();return;
    }
    if(kind==='battle-tag'){this.battleSurface(n,w,h,c.enabled?c.fill:'#647777',c.enabled?220:175);return;}
    if(kind==='nav'&&c.fill!==PC.gold)return;
    if(kind==='round'){g.fillColor=hex('#193e47',18);g.circle(0,-4,Math.min(w,h)/2);g.fill();g.fillColor=hex(fill);g.circle(0,0,Math.min(w,h)/2-1);g.fill();g.strokeColor=hex(c.enabled?PC.line:'#d4dbd5');g.lineWidth=2;g.circle(0,0,Math.min(w,h)/2-1);g.stroke();return;}
    if(kind==='die'){g.fillColor=hex('#244b3f',20);g.roundRect(-w/2,-h/2-5,w,h,24);g.fill();g.fillColor=hex(fill);g.moveTo(-w/2+24,-h/2);g.lineTo(w/2-22,-h/2);g.lineTo(w/2,-h/2+22);g.lineTo(w/2,h/2-22);g.lineTo(w/2-22,h/2);g.lineTo(-w/2+24,h/2);g.quadraticCurveTo(-w/2,h/2,-w/2,h/2-24);g.lineTo(-w/2,-h/2+24);g.quadraticCurveTo(-w/2,-h/2,-w/2+24,-h/2);g.close();g.fill();return;}
    this.surface(n,w,h,fill,255,kind==='nav'||fill===PC.green||fill===PC.navy||fill===PC.red?'':PC.line,kind==='nav'?12:16,kind!=='nav');
  }
  private feedback(c:Control){if(!c.visual.isValid)return;const hot=c.hovered&&c.enabled,battle=c.kind.startsWith('battle'),scale=c.armed?(battle?.95:c.h>100?.996:.976):hot&&!c.flat?(battle?1.045:c.h>100?1.006:1.012):1,lift=c.armed?-1:hot&&!c.flat?(battle?5:2):0;Tween.stopAllByTarget(c.visual);Tween.stopAllByTarget(c.rim);
    if(this.reduced){c.visual.setScale(1,1,1);c.visual.setPosition(0,0);c.rim.opacity=hot?255:0;return;}
    tween(c.visual).to(c.armed?.055:.15,{scale:new Vec3(scale,scale,1),position:new Vec3(0,lift,0)},{easing:'cubicOut'}).start();tween(c.rim).to(.12,{opacity:hot?255:0},{easing:'quadOut'}).start();
  }
  activate(id:string){const c=this.controls.get(id);if(!c||!c.node.isValid||!c.node.activeInHierarchy||!this.canActivate(c))return false;if(!c.enabled){this.onHint(c.reason,c,true);return false;}this.onActivate();this.commandPulse(id);c.run();return true;}
  set(id:string,value:string,enabled=true,reason='',fill?:string) { const c=this.controls.get(id);if(!c?.node.isValid)return;const repaint=c.enabled!==enabled||fill!==undefined&&fill!==c.fill;c.label.string=value;c.enabled=enabled;c.reason=reason;if(c.hovered&&c.node.activeInHierarchy)this.onHint(reason,c);if(fill!==undefined)c.fill=fill;if(repaint){this.drawControl(c);this.feedback(c);}c.label.color=hex(enabled?(c.kind.startsWith('battle')||c.fill===PC.green||c.fill===PC.navy||c.fill===PC.red?'#fffdf2':PC.ink):(c.kind.startsWith('battle')?'#9ba9a4':'#7e8c89')); }
  glyph(parent:Node,kind:string,x:number,y:number,size=24,color=PC.ink){const n=this.node(parent,'glyph-'+kind,x,y,size,size),g=n.addComponent(Graphics);g.strokeColor=hex(color);g.fillColor=hex(color);g.lineWidth=1.8;const k=size/24;
    const line=(points:number[][])=>{g.moveTo(points[0][0]*k,points[0][1]*k);points.slice(1).forEach(p=>g.lineTo(p[0]*k,p[1]*k));g.stroke();};
    if(kind==='home'){line([[-10,0],[0,9],[10,0]]);line([[-7,1],[-7,-9],[7,-9],[7,1]]);}
    else if(kind==='map'){g.circle(0,0,10*k);g.stroke();line([[-3,-5],[6,6],[3,-4],[-3,-5]]);}
    else if(kind==='partners'){g.ellipse(0,-4*k,7*k,5*k);g.stroke();for(const [a,b]of[[-8,4],[-3,8],[3,8],[8,4]]){g.circle(a*k,b*k,2*k);g.fill();}}
    else if(kind==='hatch'){g.moveTo(0,11*k);g.bezierCurveTo(-13*k,5*k,-11*k,-10*k,0,-10*k);g.bezierCurveTo(11*k,-10*k,13*k,5*k,0,11*k);g.stroke();line([[-7,-1],[-2,2],[2,-2],[7,1]]);}
    else if(kind==='cooking'){g.arc(0,0,10*k,Math.PI,Math.PI*2,false);g.stroke();line([[-11,0],[11,0]]);line([[-5,4],[-4,7],[-5,10]]);line([[2,4],[3,7],[2,10]]);line([[-5,-10],[5,-10]]);}
    else if(kind==='dex'){line([[-10,-8],[-10,9],[-2,7],[0,5],[2,7],[10,9],[10,-8],[2,-9],[0,-11],[-2,-9],[-10,-8]]);line([[0,5],[0,-10]]);}
    else if(kind==='gyms'){for(let i=0;i<=6;i++){const a=i*Math.PI/3;const px=Math.sin(a)*9*k,py=Math.cos(a)*9*k;if(!i)g.moveTo(px,py);else g.lineTo(px,py);}g.stroke();g.circle(0,0,3*k);g.stroke();}
    else if(kind==='social'){g.roundRect(-10*k,-7*k,20*k,14*k,2*k);g.stroke();line([[-9,6],[0,-1],[9,6]]);}
    else if(kind==='raids'){line([[-8,8],[-9,-3],[0,-11],[9,-3],[8,8],[3,4],[0,9],[-3,4],[-8,8]]);line([[-4,0],[4,0]]);}
    else if(kind==='ladder'){g.rect(-10*k,-10*k,7*k,10*k);g.rect(-3*k,-10*k,7*k,20*k);g.rect(4*k,-10*k,7*k,14*k);g.stroke();}
    else{g.circle(0,0,7*k);g.stroke();g.circle(0,0,2.5*k);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[Math.cos(a)*8,Math.sin(a)*8],[Math.cos(a)*11,Math.sin(a)*11]]);}}
    return n;
  }
  badge(parent:Node,text:string,x:number,y:number,w=100,fill='#e5eee4',ink=PC.green){const n=this.panel(parent,x,y,w,28,fill,255,14);this.text(n,text,0,0,14,ink,w-12,24);return n;}
  pageBackdrop(parent:Node){const n=this.node(parent,'journal-background',800,450,4000,2000);this.surface(n,4000,2000,'#f6f3e9',255,'',0,false);const g=n.getComponent(Graphics)!;g.strokeColor=hex('#bdd3c6',70);g.lineWidth=1;g.circle(700,320,330);g.stroke();g.circle(700,320,350);g.stroke();g.circle(680,-330,290);g.stroke();return n;}
  cropImage(parent:Node,key:string,x:number,y:number,w:number,h:number){const n=this.node(parent,'crop-'+key,x,y,w,h);n.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;const s=this.art.size(key),k=Math.max(w/s.width,h/s.height),art=this.node(n,key,0,(s.height*k-h)*.4,s.width*k,s.height*k);art.addComponent(Sprite);this.art.bind(art,key);return n;}
  artImage(parent:Node,key:string,x:number,y:number,w:number,h=w) {
    const size=this.art.size(key),scale=Math.min(w/size.width,h/size.height);
    const n=this.node(parent,key,x,y,size.width*scale,size.height*scale);n.addComponent(Sprite);this.art.bind(n,key);return n;
  }
  shadow(parent:Node,x:number,y:number,w:number,h:number) {const n=this.node(parent,'contact-shadow',x,y,w,h),g=n.addComponent(Graphics);g.fillColor=hex('#163f35',65);g.ellipse(0,0,w/2,h/2);g.fill();return n;}
  line(parent:Node,x:number,y:number,w:number,fill=PC.line){return this.panel(parent,x,y,w,1,fill,170,0);}
  reveal(n:Node,delay=0,dx=0,duration=.23){if(this.reduced)return;const o=n.getComponent(UIOpacity)||n.addComponent(UIOpacity),end=n.position.clone();o.opacity=95;if(dx)n.setPosition(end.x+dx,end.y,end.z);
    const finish=()=>{this.entrances.delete(n);if(!n.isValid)return;Tween.stopAllByTarget(n);Tween.stopAllByTarget(o);n.setPosition(end);o.opacity=255;};this.entrances.set(n,finish);
    tween(o).delay(delay).to(duration,{opacity:255},{easing:'cubicOut'}).call(()=>{this.entrances.delete(n);}).start();if(dx)tween(n).delay(delay).to(duration,{position:end},{easing:'cubicOut'}).start();
  }
  present(n:Node,direction=1){if(this.reduced)return;const controls=Array.from(this.controls.values());for(const child of n.children){const c=controls.find(c=>c.node===child);const delay=Math.min(.065,Math.max(0,(-child.position.y-160)/6000));if(c)this.reveal(c.entry,delay,10*direction);else this.reveal(child,delay,child.getComponent(Label)?10*direction:0);}}
  contains(n:Node,root:Node){for(let p:Node|null=n;p;p=p.parent)if(p===root)return true;return false;}
  stopTree(n:Node){if(!n.isValid)return;this.entrances.delete(n);Tween.stopAllByTarget(n);const opacity=n.getComponent(UIOpacity);if(opacity)Tween.stopAllByTarget(opacity);for(const c of n.children)this.stopTree(c);}
  forget(root?:Node){for(const [id,c]of this.controls)if(!root||this.contains(c.node,root))this.controls.delete(id);}
  retire(n:Node){this.forget(n);this.stopTree(n);const quiet=(node:Node)=>{for(const type of [Node.EventType.TOUCH_START,Node.EventType.TOUCH_MOVE,Node.EventType.TOUCH_END,Node.EventType.TOUCH_CANCEL,Node.EventType.MOUSE_ENTER,Node.EventType.MOUSE_LEAVE,Node.EventType.MOUSE_MOVE])node.off(type);const edit=node.getComponent('cc.EditBox');if(edit)edit.enabled=false;for(const c of node.children)quiet(c);};quiet(n);}
  dispose(n:Node){if(!n?.isValid)return;this.forget(n);this.stopTree(n);n.removeFromParent();n.destroy();}
}
