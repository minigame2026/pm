import {Node,Graphics,Label} from 'cc';
import {PCUI,PC,hex} from './PCUI';
import {PCCookingState,FoodQuality,Recipe,RECIPES,INGREDIENTS,FOOD_QUALITY_NAMES,cookingKey,recipeCost,cookingReason,bonusDescription,mealSummary} from './PCCooking';

export interface CookingUIHost {
  ui:PCUI;parent:Node;state:()=>PCCookingState;
  cook:(recipeId:string,quality:FoodQuality)=>boolean;
  eat:(recipeId:string,quality:FoodQuality)=>boolean;
  partyTypes?:()=>string[];
  disabledReason?:()=>string;
}
/** Native camp page: six dishes, one selected recipe, one meal in effect. */
export class PCCookingUI {
  private root:Node;private selected=RECIPES[0].id;private quality:FoodQuality=1;private alive=true;
  private meal!:Label;private counts=new Map<string,Label>();private stock:{id:string;name:Label;count:Label}[]=[];private stockTitle!:Label;
  constructor(private h:CookingUIHost){this.root=h.ui.node(h.parent,'pc-cooking',0,0,1600,900);this.refresh();}
  dispose(){this.alive=false;}
  private get ui(){return this.h.ui;}
  refresh(){if(!this.alive||!this.root.isValid)return;this.ui.onHint('');for(const child of [...this.root.children])this.ui.dispose(child);
    const p=this.root,s=this.h.state(),selected=RECIPES.find(r=>r.id===this.selected)!,q=this.quality,busy=this.h.disabledReason?.()||'';
    this.ui.text(p,'营地厨房',610,94,42,PC.ink,600,64,'left').isBold=true;
    this.ui.text(p,'料理效果不叠加，新料理替换旧效果',610,147,18,PC.muted,600,34,'left');
    this.ui.hud(p,1257,120,512,58,232);this.meal=this.ui.text(p,mealSummary(s),1257,120,19,'#fff2ce',480,44);this.counts.clear();this.stock=[];
    this.ui.line(p,920,187,1264);
    ([1,2,3] as FoodQuality[]).forEach((quality,i)=>{this.ui.button(p,'food-quality-'+quality,FOOD_QUALITY_NAMES[quality],410+i*190,227,175,45,()=>{if(this.quality===quality)return;this.quality=quality;this.refreshDetails();},quality===q?PC.green:PC.paper);});
    this.ui.text(p,'食材品质越好，料理效果越强',1214,227,17,PC.muted,476,32);
    const types=this.h.partyTypes?.()||[];
    RECIPES.forEach((recipe,i)=>{const x=470+(i%2)*328,y=325+Math.floor(i/2)*130,chosen=recipe.id===selected.id;
      const n=this.ui.button(p,'food-recipe-'+recipe.id,'',x,y,304,114,()=>{if(this.selected===recipe.id)return;this.selected=recipe.id;this.refreshDetails();},chosen?'#f2dfbb':PC.paper);
      this.dish(n,recipe,-101,2,65);
      this.ui.text(n,recipe.name,35,-23,20,PC.ink,204,50,'left').isBold=true;
      this.ui.text(n,recipe.types.join(' / '),35,19,15,PC.muted,204,26,'left');
      const owned=s.meals[cookingKey(recipe.id,q)]||0;
      this.counts.set(recipe.id,this.ui.text(n,owned?'已做好 ×'+owned:types.some(t=>recipe.types.includes(t))?'适合当前队伍':'',35,45,13,owned?PC.green:PC.muted,204,22,'left'));
    });
    this.ui.line(p,920,759,1264);
    INGREDIENTS.forEach((ingredient,i)=>{const x=391+i*204,badge=this.ui.badge(p,'',x,802,192,ingredient.color,PC.ink),name=badge.getComponentInChildren(Label)!,count=this.ui.text(p,'',x,837,19,PC.ink,130,28);count.isBold=true;this.stock.push({id:ingredient.id,name,count});});
    this.stockTitle=this.ui.text(p,'',920,881,14,PC.muted,1230,26);this.refreshDetails();
  }
  private refreshDetails(){if(!this.alive||!this.root.isValid)return;this.ui.onHint('');const old=this.root.getChildByName('cooking-details');if(old)this.ui.dispose(old);const p=this.ui.node(this.root,'cooking-details',0,0,1600,900),s=this.h.state(),selected=RECIPES.find(r=>r.id===this.selected)!,q=this.quality,busy=this.h.disabledReason?.()||'',types=this.h.partyTypes?.()||[];
    this.meal.string=mealSummary(s);for(const quality of [1,2,3] as FoodQuality[])this.ui.set('food-quality-'+quality,FOOD_QUALITY_NAMES[quality],true,'',quality===q?PC.green:PC.paper);
    for(const recipe of RECIPES){this.ui.set('food-recipe-'+recipe.id,'',true,'',recipe.id===selected.id?'#f2dfbb':PC.paper);const count=s.meals[cookingKey(recipe.id,q)]||0,label=this.counts.get(recipe.id)!;label.string=count?'已做好 ×'+count:types.some(t=>recipe.types.includes(t))?'适合当前队伍':'';label.color=hex(count?PC.green:PC.muted);}
    for(const item of this.stock){item.name.string=FOOD_QUALITY_NAMES[q]+' · '+INGREDIENTS.find(i=>i.id===item.id)!.name;item.count.string=String(s.ingredients[cookingKey(item.id,q)]||0);}this.stockTitle.string=FOOD_QUALITY_NAMES[q]+'食材 · 探险胜利有机会获得';
    const card=this.ui.panel(p,1254,468,496,406,PC.paper,255,20);
    this.dish(card,selected,0,-105,128);
    this.ui.text(card,selected.name,0,-15,29,PC.ink,450,45).isBold=true;
    this.ui.text(card,selected.types.join(' · ')+' 属性伙伴',0,30,18,PC.green,446,30);
    this.ui.text(card,bonusDescription(selected,q),0,69,19,PC.ink,446,38).isBold=true;
    this.ui.text(card,'持续 10 场战斗',0,107,17,PC.muted,446,28);
    const costs=recipeCost(selected,q);costs.forEach((item,i)=>{const ingredient=INGREDIENTS.find(v=>v.id===item.id)!,owned=s.ingredients[cookingKey(item.id,q)]||0,x=-111+i*222;
      this.ui.badge(card,FOOD_QUALITY_NAMES[q]+' · '+ingredient.name,x,147,208,ingredient.color,PC.ink);this.ui.text(card,owned+' / '+item.count,x,180,16,owned>=item.count?PC.green:PC.red,150,27);
    });
    const reason=busy||cookingReason(s,selected.id,q),made=s.meals[cookingKey(selected.id,q)]||0;
    this.ui.button(p,'food-cook','烹饪一份',1125,711,228,56,()=>{if(this.h.cook(selected.id,q))this.refreshDetails();},PC.paper,!reason,reason);
    this.ui.button(p,'food-eat',made?'享用  ×'+made:'先烹饪再享用',1381,711,228,56,()=>{if(this.h.eat(selected.id,q))this.refreshDetails();},PC.green,!busy&&made>0,busy||(s.active?'享用后替换当前料理效果':'持续 10 场已结算战斗'));
    this.ui.text(p,reason||selected.description,634,686,16,reason?PC.muted:PC.green,620,58,'left');
  }
  private dish(parent:Node,recipe:Recipe,x:number,y:number,size:number){const n=this.ui.node(parent,'dish-'+recipe.id,x,y,size,size),g=n.addComponent(Graphics),r=size*.42;
    g.fillColor=hex('#183c3b',18);g.ellipse(0,-size*.11,r*1.14,r*.45);g.fill();
    g.fillColor=hex('#f4eee0');g.ellipse(0,-size*.04,r*1.13,r*.63);g.fill();g.strokeColor=hex('#d3c8b3');g.lineWidth=1.5;g.ellipse(0,-size*.04,r*1.13,r*.63);g.stroke();
    g.fillColor=hex(recipe.color);g.ellipse(0,size*.025,r*.86,r*.43);g.fill();
    if(recipe.id==='ember-skewer'){for(let i=0;i<3;i++){const yy=(i-1)*size*.15;g.strokeColor=hex('#966e43');g.lineWidth=2;g.moveTo(-r*.9,yy);g.lineTo(r*.9,yy+size*.07);g.stroke();for(let j=0;j<3;j++){g.fillColor=hex(j%2?'#b46d4d':'#d1905d');g.roundRect((j-1)*size*.23-size*.075,yy-size*.055,size*.16,size*.15,3);g.fill();}}}
    else if(recipe.id==='tidal-soup'||recipe.id==='moon-fish'){g.fillColor=hex(recipe.id==='tidal-soup'?'#e9e2c1':'#dbbe99');g.ellipse(0,size*.04,r*.6,r*.23);g.fill();g.moveTo(r*.4,size*.04);g.lineTo(r*.72,r*.26);g.lineTo(r*.72,-r*.08);g.close();g.fill();g.fillColor=hex('#56777b');g.circle(-r*.35,r*.14,size*.025);g.fill();}
    else for(let i=0;i<7;i++){const a=i*2.4,xx=Math.cos(a)*r*.55,yy=Math.sin(a)*r*.25+size*.04;g.fillColor=hex(i%2?'#f4dc93':recipe.id==='leaf-stew'?'#4e9563':'#a67e6a');g.ellipse(xx,yy,size*.075,size*.055);g.fill();}
    g.fillColor=hex('#679969');g.ellipse(-r*.62,r*.16,r*.15,r*.07);g.fill();g.ellipse(-r*.57,r*.26,r*.07,r*.15);g.fill();
    g.strokeColor=hex('#9cae9e',80);g.lineWidth=Math.max(1,size*.018);for(let i=0;i<2;i++){const xx=(i-.5)*size*.23;g.moveTo(xx,size*.3);g.bezierCurveTo(xx-size*.06,size*.39,xx+size*.08,size*.43,xx,size*.53);g.stroke();}return n;
  }
}
