import { Node, Graphics, Color, UITransform, UIOpacity, Layers, tween, Vec3 } from 'cc';

type Kind='leaf'|'ember'|'snow'|'petal'|'spark'|'star'|'rain'|'sand'|'spirit';
const THEMES:{kind:Kind;tint:string;accent:string;count:number}[]=[
  {kind:'leaf',tint:'#b8e279',accent:'#fff3bc',count:9},
  {kind:'ember',tint:'#ffb557',accent:'#ffda88',count:11},
  {kind:'snow',tint:'#ffffff',accent:'#ccefff',count:12},
  {kind:'petal',tint:'#ffd2e3',accent:'#e8fff2',count:10},
  {kind:'spark',tint:'#ffde89',accent:'#e2c6ff',count:9},
  {kind:'star',tint:'#bcefff',accent:'#e4ceff',count:11},
  {kind:'rain',tint:'#b5e7dc',accent:'#e1ffa1',count:12},
  {kind:'sand',tint:'#ffe5ac',accent:'#ffc980',count:12},
  {kind:'spirit',tint:'#d5bdff',accent:'#a9f2ed',count:10},
  {kind:'petal',tint:'#ffd2e3',accent:'#e8fff2',count:10},
  {kind:'spark',tint:'#ffde89',accent:'#e2c6ff',count:9},
  {kind:'star',tint:'#bcefff',accent:'#e4ceff',count:11},
];
const ink=(hex:string,alpha:number)=>{const c=new Color();Color.fromHEX(c,hex);c.a=alpha;return c;};
function node(parent:Node,name:string,x:number,y:number){
  const n=new Node(name);n.layer=Layers.Enum.UI_2D;n.parent=parent;n.setPosition(x,y);n.addComponent(UITransform).setContentSize(24,24);return n;
}
/** Cosmetic only: no model RNG, textures, event handlers or per-frame geometry rebuilds.
 * PMGame.clear stops all descendant node/opacity tweens before destroying this layer. */
export function battleAmbience(parent:Node,mapId:number,sceneHeight:number,height:number,reducedMotion=false):Node|null {
  if(reducedMotion)return null;
  const theme=THEMES[mapId]||THEMES[0],layer=node(parent,'battle-ambient',0,0);
  const bottom=height/2-sceneHeight+18,top=height/2-77,span=Math.max(40,top-bottom);
  for(let i=0;i<theme.count;i++){
    const x=-173+(i*79+mapId*23)%346,y=bottom+span*((i*.381+mapId*.11)%1);
    const n=node(layer,theme.kind+'-'+i,x,y),g=n.addComponent(Graphics),o=n.addComponent(UIOpacity);
    const size=2.2+(i%3)*1.25;g.fillColor=ink(theme.tint,theme.kind==='rain'?95:165);g.strokeColor=ink(theme.tint,150);g.lineWidth=1.2;
    if(theme.kind==='leaf'||theme.kind==='petal'){
      g.moveTo(-size*1.6,0);g.quadraticCurveTo(0,size*1.8,size*1.6,0);g.quadraticCurveTo(0,-size,-size*1.6,0);g.close();g.fill();
      if(theme.kind==='leaf'){g.strokeColor=ink('#739f58',100);g.moveTo(-size,0);g.lineTo(size,.5);g.stroke();}
    }else if(theme.kind==='rain'){
      g.moveTo(0,0);g.lineTo(-3,-10-size*2);g.stroke();
    }else if(theme.kind==='snow'){
      g.circle(0,0,size*.65);g.fill();if(i%3===0){for(let j=0;j<3;j++){const a=j*Math.PI/3;g.moveTo(-Math.cos(a)*size*1.5,-Math.sin(a)*size*1.5);g.lineTo(Math.cos(a)*size*1.5,Math.sin(a)*size*1.5);}g.stroke();}
    }else if(theme.kind==='star'||theme.kind==='spark'){
      for(const [a,b] of [[0,size*2],[size*.45,size*.45],[size*1.5,0],[size*.45,-size*.45],[0,-size*2],[-size*.45,-size*.45],[-size*1.5,0],[-size*.45,size*.45]]){if(a===0&&b===size*2)g.moveTo(a,b);else g.lineTo(a,b);}g.close();g.fill();
    }else if(theme.kind==='sand'){
      g.ellipse(0,0,size*1.9,size*.35);g.fill();
    }else{
      g.fillColor=ink(theme.tint,23);g.circle(0,0,size*2.6);g.fill();g.fillColor=ink(theme.tint,180);g.ellipse(0,0,size*.6,size);g.fill();
    }
    o.opacity=120+i%3*35;
    tween(o).to(1.4+i*.13,{opacity:230},{easing:'sineInOut'}).to(1.8+i*.1,{opacity:85},{easing:'sineInOut'}).union().repeatForever().start();
    const drifting=['leaf','petal','snow','rain','sand','ember'].includes(theme.kind);
    if(drifting){
      const rising=theme.kind==='ember',horizontal=theme.kind==='sand',speed=theme.kind==='rain'?2.3:theme.kind==='snow'?8:6+i%3;
      const start=new Vec3(horizontal?-184:x,rising?bottom:horizontal?y:top,0);
      const end=new Vec3(horizontal?184:Math.max(-184,Math.min(184,x+(i%2?23:-23))),rising?top:horizontal?Math.min(top,y+35):bottom,0);
      tween(n).to(speed,{position:end}).set({position:start}).union().repeatForever().start();
      if(theme.kind==='leaf'||theme.kind==='petal')tween(n).to(3+i*.1,{eulerAngles:new Vec3(0,0,45)},{easing:'sineInOut'}).to(3,{eulerAngles:new Vec3(0,0,-35)},{easing:'sineInOut'}).union().repeatForever().start();
    }else{
      tween(n).to(3+i*.2,{position:new Vec3(x+8,Math.min(top,y+20),0)},{easing:'sineInOut'}).to(3.6,{position:new Vec3(x,y,0)},{easing:'sineInOut'}).union().repeatForever().start();
    }
  }
  // Small edge highlights frame the scene; no screen flash or full-screen translucent layer.
  for(let i=0;i<2;i++){
    const n=node(layer,'edge-glimmer-'+i,i?171:-171,bottom+span*(i?.72:.3)),g=n.addComponent(Graphics),o=n.addComponent(UIOpacity);
    g.strokeColor=ink(theme.accent,100);g.lineWidth=1;g.ellipse(0,0,13,3);g.stroke();g.fillColor=ink(theme.accent,155);g.circle(0,0,1.5);g.fill();
    tween(o).set({opacity:40}).to(2.5+i,{opacity:160},{easing:'sineInOut'}).to(3.5,{opacity:40},{easing:'sineInOut'}).union().repeatForever().start();
  }
  return layer;
}
