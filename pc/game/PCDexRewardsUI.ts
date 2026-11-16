import {Node,Label,EventTouch} from 'cc';
import {PCUI,PC} from './PCUI';
import {PCDexState,DEX_TOTAL,DEX_REWARDS} from './PCDex';
import * as M from './PMModel';

interface Options {ui:PCUI;root:Node;book:()=>PCDexState;claim:(id:number)=>boolean;close:()=>void;egg:(parent:Node,rarity:M.EggRarity,x:number,y:number,size:number)=>unknown;}
export class PCDexRewardsUI {
  layer:Node;private total:Label;private counts=new Map<number,Label>();
  constructor(private o:Options){
    const u=o.ui;this.layer=u.node(o.root,'dex-rewards-modal',0,0,1600,900);
    const shade=u.panel(this.layer,800,450,4000,2000,PC.navy,175,0);
    for(const event of [Node.EventType.TOUCH_START,Node.EventType.TOUCH_END])shade.on(event,(e:EventTouch)=>e.propagationStopped=true);
    const card=u.panel(this.layer,800,450,1280,780,PC.paper,255,24);
    u.text(card,'图鉴收集奖励',0,-340,30,PC.ink,1140,48).isBold=true;
    u.text(card,'普通与闪光合计，每种形态只计一次。',-92,-292,17,PC.muted,890,42);
    this.total=u.text(card,'',482,-292,23,PC.green,200,40);
    for(const [i,r]of DEX_REWARDS.entries()){
      const n=u.panel(card,-488+(i%5)*244,-178+Math.floor(i/5)*178,230,164,'#edf2e7',255,12);
      u.text(n,String(r.id).padStart(2,'0')+' · '+M.MAPS[r.mapId].name,0,-58,17,PC.ink,210,34).isBold=true;
      o.egg(n,'SSR',70,-10,50);u.text(n,'SSR × 1',-35,-22,19,PC.green,120,30).isBold=true;
      this.counts.set(r.id,u.text(n,'',-35,8,18,PC.ink,130,28));
      u.button(n,'dex-claim-'+r.id,'',0,53,204,38,()=>{if(o.claim(r.id))this.refresh();},PC.green);
    }
    u.button(card,'dialog-confirm','返回',0,341,300,48,o.close,PC.paper);
    this.refresh();u.reveal(shade,0,0,.12);u.reveal(card,0,0,.18);
  }
  refresh(){
    if(!this.layer.isValid)return;const book=this.o.book(),count=book.collected.length;this.total.string=count+' / '+DEX_TOTAL;
    for(const r of DEX_REWARDS){const claimed=book.claimed.includes(r.id),ready=count>=r.required;
      this.counts.get(r.id)!.string=Math.min(count,r.required)+' / '+r.required;
      this.o.ui.set('dex-claim-'+r.id,claimed?'已领取':ready?'领取奖励':'未达成',ready&&!claimed,'',ready&&!claimed?PC.green:PC.paper);
    }
  }
}
