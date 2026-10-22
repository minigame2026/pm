import {EffectAsset,Material,resources,Sprite,Node,Graphics,Color,UIOpacity,tween,Vec3,UITransform} from 'cc';
let material:Material|null=null;
export function loadShinyVisuals():Promise<void>{return new Promise((resolve,reject)=>resources.load('shiny-pet',EffectAsset,(error,effect)=>{if(error){reject(error);return;}material=new Material();material.initialize({effectAsset:effect,defines:{USE_TEXTURE:true}});resolve();}));}
export function tintShiny(sprite:Sprite){if(material)sprite.customMaterial=material;}
/** Short, bounded entrance burst; no image assets, random gameplay calls or persistent timer. */
export function shinyEntrance(parent:Node,x:number,y:number,size:number){
 const root=new Node('shiny-entrance');root.layer=parent.layer;root.setPosition(x,y);parent.addChild(root);root.addComponent(UITransform).setContentSize(size,size);
 for(let i=0;i<10;i++){
  const n=new Node('shiny-spark-'+i);n.layer=parent.layer;root.addChild(n);n.addComponent(UITransform).setContentSize(20,20);
  const g=n.addComponent(Graphics),r=i%2?5:9,a=i*Math.PI*2/10;g.fillColor=new Color(i%2?'#c6f7ff':'#fff0a3');g.strokeColor=new Color('#ffffff');g.lineWidth=2;
  if(i%2){g.rect(-r,-r,2*r,2*r);g.stroke();}else{for(let j=0;j<8;j++){const t=j*Math.PI/4,d=j%2?r*.25:r;if(j===0)g.moveTo(Math.cos(t)*d,Math.sin(t)*d);else g.lineTo(Math.cos(t)*d,Math.sin(t)*d);}g.close();g.fill();}
  n.setPosition(Math.cos(a)*size*.12,Math.sin(a)*size*.12);n.setScale(.25,.25,1);const op=n.addComponent(UIOpacity);op.opacity=0;
  tween(n).delay(i*.025).to(.35,{position:new Vec3(Math.cos(a)*size*.48,Math.sin(a)*size*.4),scale:Vec3.ONE},{easing:'quadOut'}).to(.4,{scale:new Vec3(.25,.25,1)}).start();
  tween(op).delay(i*.025).to(.12,{opacity:255}).delay(.25).to(.38,{opacity:0}).start();
 }
 tween(root).delay(1.1).call(()=>{if(root.isValid)root.destroy();}).start();return root;
}
