/** PC-only camp cooking. No wall clock, global randomness, engine or model dependency. */
export type FoodQuality=1|2|3;
export type IngredientId='grain'|'meat'|'fish'|'herb'|'mushroom'|'spice';
export interface FoodBonuses {attack:number;defense:number;heal:number;health:number}
export interface ActiveMeal {recipeId:string;quality:FoodQuality;remaining:number}
export interface PCCookingState {
  version:1; ingredients:Record<string,number>; meals:Record<string,number>;
  active?:ActiveMeal; receipts:string[]; serial:number;
}
export interface CookingResult {state:PCCookingState;changed:boolean;error?:string;drop?:IngredientDrop;expired?:boolean}
export interface IngredientDrop {id:IngredientId;quality:FoodQuality;count:number}
export interface CookingBattle {id:string;won:boolean;completed:boolean;mapId:number;rank?:'normal'|'elite'|'boss';raidTier?:number}
export interface Recipe {id:string;name:string;types:string[];color:string;ingredient:IngredientId;garnish:IngredientId;description:string;bonuses:FoodBonuses}
export const FOOD_QUALITY_NAMES=['','家常','鲜美','珍馐'];
export const INGREDIENTS:{id:IngredientId;name:string;color:string}[]=[
  {id:'grain',name:'谷穗',color:'#e8c577'},{id:'meat',name:'鲜肉',color:'#d9876b'},
  {id:'fish',name:'溪鱼',color:'#70b6cc'},{id:'herb',name:'嫩叶',color:'#83b986'},
  {id:'mushroom',name:'香菇',color:'#bd98bf'},{id:'spice',name:'香辛果',color:'#e5a35e'},
];
export const RECIPES:Recipe[]=[
  {id:'ember-skewer',name:'炭火鲜肉串',types:['火','电','格斗'],color:'#e4a66c',ingredient:'meat',garnish:'spice',description:'热腾腾的肉串，让进攻更有力量。',bonuses:{attack:12,defense:0,heal:0,health:0}},
  {id:'stone-pot',name:'岩谷菌香焖饭',types:['岩石','地面','钢'],color:'#c6ad7c',ingredient:'grain',garnish:'mushroom',description:'慢火焖出的扎实滋味，帮助伙伴站稳。',bonuses:{attack:0,defense:12,heal:0,health:0}},
  {id:'tidal-soup',name:'海风鲜鱼浓汤',types:['水','冰','一般'],color:'#87c3ce',ingredient:'fish',garnish:'grain',description:'清甜浓汤，让生命药水恢复更多。',bonuses:{attack:0,defense:0,heal:20,health:0}},
  {id:'leaf-stew',name:'青叶暖菌煲',types:['草','虫','妖精'],color:'#8dbd8c',ingredient:'herb',garnish:'mushroom',description:'嫩叶与香菇炖出满满活力。',bonuses:{attack:0,defense:0,heal:0,health:12}},
  {id:'sky-pie',name:'云菇酥香饼',types:['飞行','超能力','龙'],color:'#aaa0d2',ingredient:'mushroom',garnish:'herb',description:'酥松小饼，兼顾进攻与恢复。',bonuses:{attack:8,defense:0,heal:8,health:0}},
  {id:'moon-fish',name:'月椒秘香鱼',types:['毒','幽灵','恶'],color:'#c393bf',ingredient:'spice',garnish:'fish',description:'微辣的秘制香气，让攻守都更从容。',bonuses:{attack:8,defense:8,heal:0,health:0}},
];
const integer=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const ingredientIds=INGREDIENTS.map(v=>v.id),recipeIds=RECIPES.map(v=>v.id);
export const cookingKey=(id:string,quality:FoodQuality)=>id+':'+quality;
export const newCooking=():PCCookingState=>({version:1,ingredients:{},meals:{},receipts:[],serial:0});
/** Missing field migrates safely; corrupt existing data must not silently reset inventories. */
export function restoreCooking(value:unknown):PCCookingState|null {
  if(value===undefined)return newCooking();
  const s=value as PCCookingState;if(!s||s.version!==1||!integer(s.serial,0,Number.MAX_SAFE_INTEGER)||!Array.isArray(s.receipts)||s.receipts.length>2048||s.receipts.some(id=>typeof id!=='string'||!id.length||id.length>160)||new Set(s.receipts).size!==s.receipts.length)return null;
  const validBag=(bag:unknown,ids:string[])=>bag&&typeof bag==='object'&&!Array.isArray(bag)&&Object.entries(bag).every(([key,count])=>{const [id,q,...rest]=key.split(':');return !rest.length&&ids.includes(id)&&['1','2','3'].includes(q)&&integer(count,0,9999);});
  if(!validBag(s.ingredients,ingredientIds)||!validBag(s.meals,recipeIds))return null;
  if(s.active!==undefined&&(!s.active||typeof s.active!=='object'||!recipeIds.includes(s.active.recipeId)||!integer(s.active.quality,1,3)||!integer(s.active.remaining,1,10)))return null;
  return {version:1,ingredients:{...s.ingredients},meals:{...s.meals},receipts:[...s.receipts],serial:s.serial,...(s.active?{active:{recipeId:s.active.recipeId,quality:s.active.quality,remaining:s.active.remaining}}:{})};
}
export function recipeCost(recipe:Recipe,quality:FoodQuality){return [{id:recipe.ingredient,quality,count:2},{id:recipe.garnish,quality,count:1}];}
export function cookingReason(state:PCCookingState,recipeId:string,quality:FoodQuality):string {
  const recipe=RECIPES.find(r=>r.id===recipeId);if(!recipe||!integer(quality,1,3))return '配方无效';
  const missing=recipeCost(recipe,quality).filter(v=>(state.ingredients[cookingKey(v.id,quality)]||0)<v.count);
  return missing.length?'食材不足：'+missing.map(v=>INGREDIENTS.find(i=>i.id===v.id)!.name).join('、'):'';
}
export function cookMeal(before:PCCookingState,recipeId:string,quality:FoodQuality):CookingResult {
  const error=cookingReason(before,recipeId,quality);if(error)return {state:before,changed:false,error};
  const state=clone(before),recipe=RECIPES.find(r=>r.id===recipeId)!,key=cookingKey(recipeId,quality);
  if((state.meals[key]||0)>=9999)return {state:before,changed:false,error:'成品食物已满'};
  for(const item of recipeCost(recipe,quality)){const key=cookingKey(item.id,quality);state.ingredients[key]=(state.ingredients[key]||0)-item.count;}
  state.meals[key]=(state.meals[key]||0)+1;state.serial++;return {state,changed:true};
}
export function eatMeal(before:PCCookingState,recipeId:string,quality:FoodQuality):CookingResult {
  if(!recipeIds.includes(recipeId)||!integer(quality,1,3))return {state:before,changed:false,error:'食物无效'};
  const key=cookingKey(recipeId,quality);if(!(before.meals[key]>0))return {state:before,changed:false,error:'先烹饪一份食物'};
  const state=clone(before);state.meals[key]--;state.active={recipeId,quality,remaining:10};state.serial++;return {state,changed:true};
}
export function foodBonuses(state:PCCookingState|undefined,type:string):FoodBonuses {
  const zero={attack:0,defense:0,heal:0,health:0},active=state?.active;if(!active||active.remaining<=0)return zero;
  const recipe=RECIPES.find(r=>r.id===active.recipeId);if(!recipe?.types.includes(type))return zero;
  const scale=1+(active.quality-1)*.5,b=recipe.bonuses;return {attack:b.attack*scale,defense:b.defense*scale,heal:b.heal*scale,health:b.health*scale};
}
const increase=(base:number,pct:number)=>pct>0&&base>0?Math.max(base+1,Math.round(base*(1+pct/100))):base;
export const foodAttack=(s:PCCookingState|undefined,type:string,base:number)=>increase(base,foodBonuses(s,type).attack);
export const foodDefense=(s:PCCookingState|undefined,type:string,base:number)=>base>0&&foodBonuses(s,type).defense>0?Math.max(1,Math.min(base-1,Math.round(base*(1-foodBonuses(s,type).defense/100)))):base;
export const foodHeal=(s:PCCookingState|undefined,type:string,base:number)=>increase(base,foodBonuses(s,type).heal);
export const foodHealth=(s:PCCookingState|undefined,type:string,base:number)=>increase(base,foodBonuses(s,type).health);
export function mealSummary(state:PCCookingState|undefined){const meal=state?.active,recipe=RECIPES.find(r=>r.id===meal?.recipeId);return meal&&recipe?recipe.name+' · 剩余 '+meal.remaining+' 场':'尚未用餐';}
export function bonusDescription(recipe:Recipe,quality:FoodQuality){const b=foodBonuses({...newCooking(),active:{recipeId:recipe.id,quality,remaining:10}},recipe.types[0]);return [b.attack?'攻击 +'+b.attack+'%':'',b.defense?'受到伤害 −'+b.defense+'%':'',b.heal?'治疗 +'+b.heal+'%':'',b.health?'最大生命 +'+b.health+'%':''].filter(Boolean).join(' · ');}
function randomUnit(text:string){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
const MAP_INGREDIENTS:IngredientId[][]=[['herb','fish','grain'],['meat','spice','mushroom'],['fish','mushroom','grain'],['herb','fish','grain'],['spice','meat','grain'],['mushroom','herb','fish'],['herb','mushroom','fish'],['grain','spice','meat'],['mushroom','fish','grain'],['herb','grain','fish'],['meat','spice','mushroom'],['mushroom','fish','herb']];
/** One completed encounter is one serving charge. Loot rolls do not consume mainline RNG. */
export function settleCookingBattle(before:PCCookingState,event:CookingBattle):CookingResult {
  if(!event.completed||typeof event.id!=='string'||!event.id.length||event.id.length>160||before.receipts.includes(event.id))return {state:before,changed:false};
  const state=clone(before);state.receipts.push(event.id);if(state.receipts.length>2048)state.receipts.splice(0,state.receipts.length-2048);state.serial++;
  let expired=false;if(state.active&&--state.active.remaining<=0){delete state.active;expired=true;}
  const map=Math.max(0,Math.min(11,Number.isInteger(event.mapId)?event.mapId:0)),difficulty=event.raidTier?Math.min(11,Math.max(5,event.raidTier+4)):map;
  const chance=event.raidTier?.9:event.rank==='boss'?.9:event.rank==='elite'?.8:.68;
  let drop:IngredientDrop|undefined;
  if(event.won&&randomUnit(event.id+':drop')<chance){
    const rare=Math.max(0,(difficulty-3)*.075),fine=.12+difficulty*.025,roll=randomUnit(event.id+':quality');
    const quality:FoodQuality=roll<rare?3:roll<rare+fine?2:1,rollKind=randomUnit(event.id+':kind'),pool=rollKind<.6?MAP_INGREDIENTS[map]:ingredientIds;
    const id=pool[Math.floor(randomUnit(event.id+':ingredient')*pool.length)],count=event.raidTier||event.rank==='boss'?3:event.rank==='elite'?2:1,key=cookingKey(id,quality);
    const added=Math.min(count,9999-(state.ingredients[key]||0));if(added>0){state.ingredients[key]=(state.ingredients[key]||0)+added;drop={id,quality,count:added};}
  }
  return {state,changed:true,...(drop?{drop}:{}),expired};
}
