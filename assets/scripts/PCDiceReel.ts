import {Label, Node, Vec3, Graphics, Tween, tween} from 'cc';
import {PCUI, PC, hex} from './PCUI';

/** Presentation only: reveal a model-owned roll without consuming any random numbers. */
export class PCDiceReel {
  readonly root:Node;
  private cells:Node[]=[];
  private labels:Label[]=[];
  private faces:number[]=[];
  private elapsed=0; private duration=0; private steps=0; private target=-1; private cursor=-1;
  private result:number|null=null; private digitHome:Vec3|null=null;
  constructor(private ui:PCUI,parent:Node,x:number,y:number,private width:number,private height:number,private digit:Label|null){
    this.root=ui.node(parent,'attack-faces',x,y,width,height);if(digit)this.digitHome=digit.node.position.clone();
  }
  get rolling(){return this.duration>0;}
  get values(){return [...this.faces];}
  get selected(){return this.cursor;}
  set(faces:number[],result:number|null){
    if(!this.rolling&&this.result===result&&faces.length===this.faces.length&&faces.every((v,i)=>v===this.faces[i]))return;
    this.duration=0;this.faces=[...faces];this.result=result;
    if(this.cells.length!==faces.length){for(const n of this.cells)this.ui.dispose(n);this.cells=[];this.labels=[];
      const cell=this.width/Math.max(1,faces.length);faces.forEach((v,i)=>{const n=this.ui.node(this.root,'face-'+i,-this.width/2+cell*(i+.5),0,cell-5,this.height);n.addComponent(Graphics);this.cells.push(n);this.labels.push(this.ui.text(n,String(v),0,0,Math.min(22,this.height-7),'#f4e9c7',cell-9,this.height));});
    }
    this.labels.forEach((l,i)=>l.string=String(faces[i]));this.target=result===null?-1:faces.indexOf(result);this.paint(this.target);
    if(this.digit){this.digit.string=result===null?'?':String(result);this.digit.node.setPosition(this.digitHome!);}
  }
  spin(faces:number[],result:number,duration:number){this.set(faces,null);this.result=result;this.target=Math.max(0,faces.indexOf(result));this.duration=duration;this.elapsed=0;this.steps=faces.length*3+this.target;this.paint(0);if(this.digit)this.digit.string=String(faces[0]);}
  private paint(index:number){const previous=this.cursor;this.cursor=index;const cell=this.width/Math.max(1,this.faces.length);this.cells.forEach((n,i)=>{if(this.rolling&&previous>=0&&i!==index&&i!==previous)return;const active=i===index,w=cell-5,h=this.height,g=n.getComponent(Graphics)!;g.clear();g.fillColor=hex(active?'#edc574':'#14282b',active?255:210);g.moveTo(-w/2+5,-h/2);g.lineTo(w/2,-h/2);g.lineTo(w/2-5,h/2);g.lineTo(-w/2,h/2);g.close();g.fill();g.strokeColor=hex(active?'#fff4cc':'#b1b89d',active?255:100);g.lineWidth=active?2:1;g.stroke();this.labels[i].isBold=true;this.labels[i].color=hex(active?PC.ink:'#eee4c7');});}
  tick(dt:number){if(!this.rolling||!this.root.isValid)return;
    this.elapsed+=Math.max(0,dt);const progress=Math.min(1,this.elapsed/this.duration),travel=this.steps*(1-Math.pow(1-progress,3)),index=Math.floor(travel)%this.faces.length;
    if(index!==this.cursor){this.paint(index);if(this.digit)this.digit.string=String(this.faces[index]);}
    if(this.digit)this.digit.node.setPosition(this.digitHome!.x,this.digitHome!.y-7*Math.sin(Math.PI*(travel%1)),this.digitHome!.z);
    if(progress===1){this.set(this.faces,this.result);const n=this.cells[this.selected];if(n){Tween.stopAllByTarget(n);n.setScale(1.08,1.08,1);tween(n).to(.16,{scale:new Vec3(1,1,1)},{easing:'quadOut'}).start();}}
  }
}
