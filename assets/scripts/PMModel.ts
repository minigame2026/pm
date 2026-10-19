/** Engine-independent rules. Every action returns a committed, serializable state. */
export type PetRank = 'normal' | 'elite' | 'boss';
export type PetId = 'fox' | 'bud' | 'turtle' | 'cotton' | 'otter' | 'spark' | 'seal' | 'ape' | 'slug' | 'mole' | 'bird' | 'owl' | 'beetle' | 'ghost' | 'dragon' | 'lynx' | 'rhino' | 'deer';
export const PETS: Record<PetId,{name:string;trait:string;type:string;rank:PetRank;hp:number;faces:number[];enemyFaces:number[];color:string}> = {
  "fox": {
    "name": "闪尾狐",
    "trait": "火 · 普通",
    "type": "火",
    "rank": "normal",
    "hp": 22,
    "faces": [
      1,
      3,
      7
    ],
    "enemyFaces": [
      1,
      1,
      7
    ],
    "color": "#ffb24e"
  },
  "bud": {
    "name": "芽芽龙",
    "trait": "草 · 普通",
    "type": "草",
    "rank": "normal",
    "hp": 24,
    "faces": [
      3,
      3,
      4
    ],
    "enemyFaces": [
      2,
      2,
      3
    ],
    "color": "#8bd6a0"
  },
  "turtle": {
    "name": "岩背龟",
    "trait": "岩石 · 普通",
    "type": "岩石",
    "rank": "normal",
    "hp": 30,
    "faces": [
      2,
      2,
      4
    ],
    "enemyFaces": [
      1,
      3,
      5
    ],
    "color": "#7fc9f4"
  },
  "cotton": {
    "name": "绒团兔",
    "trait": "一般 · 普通",
    "type": "一般",
    "rank": "normal",
    "hp": 24,
    "faces": [
      2,
      3,
      4
    ],
    "enemyFaces": [
      1,
      2,
      3
    ],
    "color": "#ebd6b0"
  },
  "otter": {
    "name": "潮泡獭",
    "trait": "水 · 普通",
    "type": "水",
    "rank": "normal",
    "hp": 25,
    "faces": [
      2,
      4,
      5
    ],
    "enemyFaces": [
      1,
      3,
      4
    ],
    "color": "#66c5e5"
  },
  "spark": {
    "name": "蓄电貂",
    "trait": "电 · 普通",
    "type": "电",
    "rank": "normal",
    "hp": 21,
    "faces": [
      1,
      4,
      7
    ],
    "enemyFaces": [
      1,
      2,
      6
    ],
    "color": "#f1cd4f"
  },
  "seal": {
    "name": "霜团海豹",
    "trait": "冰 · 普通",
    "type": "冰",
    "rank": "normal",
    "hp": 27,
    "faces": [
      2,
      3,
      5
    ],
    "enemyFaces": [
      2,
      2,
      4
    ],
    "color": "#9fdfea"
  },
  "ape": {
    "name": "拳铠猿",
    "trait": "格斗 · 精英",
    "type": "格斗",
    "rank": "elite",
    "hp": 32,
    "faces": [
      3,
      5,
      7
    ],
    "enemyFaces": [
      3,
      4,
      7
    ],
    "color": "#cc7652"
  },
  "slug": {
    "name": "毒泡蜗",
    "trait": "毒 · 普通",
    "type": "毒",
    "rank": "normal",
    "hp": 23,
    "faces": [
      2,
      4,
      5
    ],
    "enemyFaces": [
      1,
      3,
      5
    ],
    "color": "#ae79cc"
  },
  "mole": {
    "name": "铲角鼹",
    "trait": "地面 · 普通",
    "type": "地面",
    "rank": "normal",
    "hp": 28,
    "faces": [
      2,
      3,
      5
    ],
    "enemyFaces": [
      2,
      2,
      5
    ],
    "color": "#c79363"
  },
  "bird": {
    "name": "云翎雀",
    "trait": "飞行 · 普通",
    "type": "飞行",
    "rank": "normal",
    "hp": 21,
    "faces": [
      1,
      4,
      6
    ],
    "enemyFaces": [
      1,
      2,
      5
    ],
    "color": "#81cce5"
  },
  "owl": {
    "name": "星环鸮",
    "trait": "超能力 · 精英",
    "type": "超能力",
    "rank": "elite",
    "hp": 28,
    "faces": [
      2,
      6,
      8
    ],
    "enemyFaces": [
      2,
      5,
      8
    ],
    "color": "#a17ddd"
  },
  "beetle": {
    "name": "芽角甲虫",
    "trait": "虫 · 普通",
    "type": "虫",
    "rank": "normal",
    "hp": 26,
    "faces": [
      2,
      3,
      5
    ],
    "enemyFaces": [
      1,
      3,
      4
    ],
    "color": "#8ac35a"
  },
  "ghost": {
    "name": "灯芯幽灵",
    "trait": "幽灵 · 普通",
    "type": "幽灵",
    "rank": "normal",
    "hp": 22,
    "faces": [
      1,
      5,
      6
    ],
    "enemyFaces": [
      1,
      1,
      6
    ],
    "color": "#aa9adf"
  },
  "dragon": {
    "name": "霆冠龙",
    "trait": "龙 · BOSS",
    "type": "龙",
    "rank": "boss",
    "hp": 36,
    "faces": [
      4,
      6,
      9
    ],
    "enemyFaces": [
      4,
      6,
      8,
      11
    ],
    "color": "#6479cf"
  },
  "lynx": {
    "name": "暮影猞猁",
    "trait": "恶 · 普通",
    "type": "恶",
    "rank": "normal",
    "hp": 23,
    "faces": [
      1,
      4,
      7
    ],
    "enemyFaces": [
      1,
      2,
      6
    ],
    "color": "#75658c"
  },
  "rhino": {
    "name": "铁垒犀",
    "trait": "钢 · BOSS",
    "type": "钢",
    "rank": "boss",
    "hp": 40,
    "faces": [
      3,
      6,
      8
    ],
    "enemyFaces": [
      3,
      5,
      8,
      10
    ],
    "color": "#8ba6b5"
  },
  "deer": {
    "name": "铃芽鹿",
    "trait": "妖精 · 普通",
    "type": "妖精",
    "rank": "normal",
    "hp": 24,
    "faces": [
      2,
      4,
      5
    ],
    "enemyFaces": [
      2,
      3,
      3
    ],
    "color": "#e9accf"
  }
};
export type Phase = 'encounter' | 'battle' | 'reward' | 'recruit' | 'team' | 'won' | 'lost' | 'nest' | 'eggClaimed';
export type EggRarity = 'normal' | 'SR' | 'SSR';
export interface Egg { id:string; rarity:EggRarity; affinity:PetId; stage:number; genes?:Genes; mapId?:number; bond?:FriendBond & {sourceAffinity:PetId} }
export interface FriendCard { version:1; owner:string; petUid:string; species:PetId; rarity:EggRarity; sex:Sex; id:string }
export interface FriendBond { species:PetId; owner:string; cardId:string }
export interface FriendSocial { version:1; owner:string; visitor?:{card:FriendCard;progress:number;lastPlayedAt:number}; bonds:FriendBond[] }
export interface EggHunt { limit:number; candidates:Egg[]; selected:number }
export const EGG_RATES={normal:80,SR:17,SSR:3};
export type Sex='female'|'male';
export interface Genes { id:PetId; rarity:EggRarity; baseHP:number; baseFaces:number[]; skills:SkillCode[] }
export interface Pet { id:PetId; faces:number[]; rarity?:EggRarity; uid?:string; sex?:Sex; baseHP?:number; baseFaces?:number[]; skills?:SkillCode[] }
export interface Breeding { id:string; mother:string; father:string; startedAt:number; readyAt:number; genes:Genes }
export interface Incubation { eggId:string; startedAt:number; readyAt:number; result:EggRarity }
export interface HatchResult { eggId:string; petId:PetId; rarity:EggRarity; duplicate:boolean; warmthGain:number; uid?:string }
export interface SkillState { usedCodes?:SkillCode[]; used:boolean; attacks:number; shield:number; poison:number; nextMax:boolean; previousRoll:number; event:string; lastDamage:number; lastTaken:number }
export interface Reward { kind: 'hp' | 'attack' | 'heal' | 'potion' | 'boost'; values: number[]; title: string }
export interface State {
  contentVersion?: 2; version: 1; seed: number; step: number; phase: Phase; active: Pet; reserve: Pet | null;
  owned: PetId[]; hpRatio: number; hpBonus: number; potions: number; boosts: number;
  healFaces: number[]; healMultiplier: number; boostMultiplier: number; usedHeal: boolean; doubled: boolean; swaps: number;
  enemy: PetId; enemyHP: number; enemyMax: number; attack: number; heal: number; enemyAttack: number;
  turn: number; reward: Reward; previousReward: string; recruit: PetId | null; revision: number;
  wins: number; message: string;
  roster?: Partial<Record<PetId,Pet>>;
  partySlots?: PetId[];
  eggs?: Egg[]; eggHunt?: EggHunt;
  incubators?:(Incubation|null)[]; warmth?:number; hatchSeed?:number; hatchedEggIds?:string[];
  qualities?:Partial<Record<PetId,EggRarity[]>>; preferredRarities?:Partial<Record<PetId,EggRarity>>;
  pendingHatch?:HatchResult; skill?:SkillState;
  individualVersion?:1; pets?:Pet[]; team?:string[]; runRoster?:Record<string,Pet>; breeding?:Breeding|null; breedingSerial?:number;
  mapVersion?:1; mapId?:number; clearedMaps?:number[]; enemyRarity?:EggRarity;
  social?:FriendSocial;
}
export type Action = 'challenge' | 'reroll' | 'switch' | 'attack' | 'guard' | 'heal' | 'boost' |
  'take' | 'keep' | 'reward0' | 'invite' | 'skip' | 'replace' | 'collect' |
  'eggSearch' | 'eggSelect0' | 'eggSelect1' | 'eggSelect2' | 'eggTake' | 'eggContinue';
export const PET_IDS=Object.keys(PETS) as PetId[];
const ids=PET_IDS;
export interface MapConfig { id:number; name:string; stages:number; tint:string; pets:PetId[]; types:string; eggs:string; note:string }
export const MAPS:MapConfig[]=[
  {id:0,name:'草叶海岸',stages:10,tint:'#589c80',pets:['cotton','bud','otter','bird','beetle','turtle'],types:'一般 · 草 · 水 · 飞行 · 虫 · 岩石',eggs:'R 为主 · 终点 SSR 蛋 5%',note:'6 个系列 · 18 种形态 · R → SR → SSR'},
  {id:1,name:'熔岩山径',stages:20,tint:'#b67e60',pets:['fox','spark','slug','mole','ape','rhino'],types:'火 · 电 · 毒 · 地面 · 格斗 · 钢',eggs:'SR 更多 · 终点 SSR 蛋 35%',note:'6 个系列 · 18 种形态 · 难度提升'},
  {id:2,name:'霜月雪原',stages:30,tint:'#759bb3',pets:['seal','ghost','owl','lynx','deer','dragon'],types:'冰 · 幽灵 · 超能力 · 恶 · 妖精 · 龙',eggs:'SR / SSR 为主 · 终点必得 SSR 蛋',note:'6 个系列 · 18 种形态 · 高阶挑战'}
];
export const TOTAL_STAGES=30;
export const mapFor=(s:Pick<State,'mapId'>)=>MAPS[s.mapId||0];
export const mapStageCount=(s:Pick<State,'mapId'>)=>mapFor(s).stages;
export const mapUnlocked=(s:State,id:number)=>Number.isInteger(id)&&id>=0&&id<MAPS.length&&(id===0||!!s.clearedMaps?.includes(id-1));
export const hasActivePet=(s:State)=>!!s.pets?.some(p=>p.uid===s.active.uid);
export const rankForStage=(step:number):PetRank=>step%10===0?'boss':step%5===0?'elite':'normal';
const growthTier=(step:number)=>step<=10?(step<=3?0:step<=6?2:4):Math.floor((step-1)/3)*2;
export const encounterRarity=(step:number,mapId=0):EggRarity=>mapId===0?(step<5?'normal':step<10?'SR':'SSR'):mapId===1?(step<=5?'normal':step<15?'SR':'SSR'):(step<=10?'SR':'SSR');
export const enemyHealthForStage=(step:number,mapId=0)=>{
  const base=step<=10?[7,9,11,14,24,20,23,26,29,48][step-1]:Math.round((rankForStage(step)==='normal'?29/9:4.8)*step);
  return Math.round((base+mapId*(8+Math.floor(step*.6)))*(encounterRarity(step,mapId)==='SSR'?1.2:encounterRarity(step,mapId)==='SR'?1.1:1));
};
export const encounterPool=(step:number,mapId=0)=>{const pool=MAPS[mapId].pets,rank=rankForStage(step);return rank==='boss'?pool.slice(5):rank==='elite'?pool.slice(4,5):pool.slice(0,4);};
export function eggRates(s:Pick<State,'mapId'|'step'>){
  const wave=Math.max(0,Math.min(Math.floor(s.step/5)-1,mapFor(s).stages/5-1));
  const rates=[[[85,14,1],[70,25,5]],[[55,35,10],[40,43,17],[25,50,25],[10,55,35]],[[5,55,40],[0,50,50],[0,40,60],[0,30,70],[0,20,80],[0,0,100]]][s.mapId||0][wave];
  return {normal:rates[0],SR:rates[1],SSR:rates[2]};
}
// Independent per-turn rolls: heal x1/x2/x3, boost x2/x3/x4, both 50%/40%/10%.
export const ITEM_MULTIPLIERS = { heal: [1,1,1,1,1,2,2,2,2,3], boost: [2,2,2,2,2,3,3,3,3,4] };
export const healAmount = (s: State) => s.heal * s.healMultiplier;
export const attackAmount = (s: State) => s.attack * (s.doubled ? s.boostMultiplier : 1) + (skillReady(s,'opening')?2:0) + (skillReady(s,'heavy')&&s.skill!.attacks===2?4:0);
export const guardDamage = (incoming: number) => Math.max(1, Math.round(incoming / 100));
const rand = (s: State) => { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; };
const pick = <T>(s: State, a: T[]): T => a[Math.floor(rand(s) * a.length)];
export const maxHP = (s: State) => petBaseHP(s.active) + s.hpBonus;
export const hp = (s: State) => Math.max(0, Math.ceil(s.hpRatio * maxHP(s) - 1e-8));
export const pet = (id: PetId): Pet => ({ id, faces: [...PETS[id].faces] });
export const enemyPet=(s:State):Pet=>({id:s.enemy,rarity:s.enemyRarity||'normal',faces:[]});
export const enemyName = (s: State) => petName(enemyPet(s));
export const enemyAttackFaces = (s: State): number[] => {
  const rank=rankForStage(s.step),tier=(rank==='normal'?(s.step<=10?(s.step<=3?0:s.step<=6?1:2):Math.floor((s.step-1)/3)):s.step<=10?0:Math.floor((s.step-(rank==='elite'?5:10))/5)*2)+(s.mapId||0)*2+(s.enemyRarity==='SSR'?2:s.enemyRarity==='SR'?1:0);
  return PETS[s.enemy].enemyFaces.map(v=>v+tier);
};
export function fresh(seed = Date.now(), owned: PetId[] = ['fox', 'turtle'], wins = 0): State {
  const s: State = {mapVersion:1,mapId:0,clearedMaps:[],contentVersion:2,version:1, seed:seed >>> 0, step:1, phase:'encounter', active:pet('fox'), reserve:pet('turtle'),
    owned:ids.filter(id=>id==='fox'||id==='turtle'||owned.indexOf(id)>=0), hpRatio:1, hpBonus:0, potions:3, boosts:2,
    healFaces:[3,5,7], healMultiplier:1, boostMultiplier:2, usedHeal:false, doubled:false, swaps:2, enemy:'bud', enemyHP:7, enemyMax:7,
    attack:0, heal:0, enemyAttack:0, turn:0, reward:{kind:'hp',values:[3],title:'生命上限 +3'},
    previousReward:'', recruit:null, revision:0, wins, eggs:[], incubators:[null,null],warmth:0,hatchSeed:(seed^0x9e3779b9)>>>0,hatchedEggIds:[],qualities:{},preferredRarities:{},message:'先选伙伴，再开始挑战'};
  encounter(s, false); migrateIndividuals(s); return s;
}
function reward(s: State, excluded: string[] = []): Reward {
  const tier = growthTier(s.step)+(s.mapId||0)*2;
  const kinds = ['hp','attack','heal','potion','boost'].filter(x => !excluded.includes(x) && (excluded.length>0 || x!==s.previousReward) && !(x==='potion'&&s.potions>=9) && !(x==='boost'&&s.boosts>=9));
  const k = pick(s,kinds) as Reward['kind'];
  if (k==='attack' || k==='heal') {
    const pool = k==='attack' ? [[2,3,5],[3,3,4],[1,2,7]] : [[3,5,7],[4,4,6],[2,3,9]];
    const a = pick(s,pool).map(v=>v+tier);
    return {kind:k,values:a,title:(k==='attack'?'攻击点数':'治疗点数')+' '+a.join(' / ')};
  }
  const n = k==='hp' ? (rand(s)<.25 ? 5:3) : (rand(s)<.25?2:1);
  return {kind:k, values:[n],title:({hp:'生命上限',potion:'治疗药水',boost:'攻击强化'}[k] || '')+' +'+n};
}
// One visible drop per encounter; combat and reloads never replace it.
export function rewardOptions(s: State): Reward[] {
  return [s.reward];
}
function encounter(s: State, reroll: boolean) {
  delete s.skill;
  s.phase='encounter'; s.attack=s.heal=s.enemyAttack=0; s.turn=0; s.usedHeal=s.doubled=false;
  const pool=encounterPool(s.step,s.mapId||0),others=pool.filter(id=>id!==s.enemy);s.enemy=pick(s,reroll&&others.length?others:pool);s.enemyRarity=encounterRarity(s.step,s.mapId||0);
  s.enemyMax=enemyHealthForStage(s.step,s.mapId||0);s.enemyHP=s.enemyMax;
  s.reward=reward(s); s.recruit=null;
  if(!reroll) s.swaps=rankForStage(s.step)==='boss'?0:2;
}
function roll(s: State) {
  s.attack=pick(s,s.active.faces); s.heal=pick(s,s.healFaces);
  s.enemyAttack=pick(s,enemyAttackFaces(s));
  s.healMultiplier=pick(s,ITEM_MULTIPLIERS.heal);s.boostMultiplier=pick(s,ITEM_MULTIPLIERS.boost);
  s.usedHeal=false; s.doubled=false; s.turn++;
  if(s.skill){const k=s.skill;
    if(k.nextMax){s.attack=Math.max(...s.active.faces);k.nextMax=false;}
    if(skillReady(s,'steady')&&s.attack===Math.min(...s.active.faces)){s.attack=[...s.active.faces].sort((a,b)=>a-b)[Math.floor(s.active.faces.length/2)];trigger(s,'steady');}
    if(skillReady(s,'repeat')&&s.attack===k.previousRoll){s.attack=Math.max(...s.active.faces);trigger(s,'repeat');}
    k.previousRoll=s.attack;
  }
}
function next(s: State) { s.step++; encounter(s,false); s.message='新的对手出现了'; }
function afterReward(s: State) {
  s.previousReward=s.reward.kind;
  s.hpRatio=Math.min(1,s.hpRatio+Math.max(1,Math.floor(maxHP(s)*.2))/maxHP(s));
  if(rankForStage(s.step)==='elite'){beginEggHunt(s);return;}
  finishReward(s);
}
function finishReward(s:State){ next(s); }
function beginEggHunt(s: State) {
  s.phase='nest';s.eggHunt={limit:rankForStage(s.step)==='boss'?3:2,candidates:[],selected:-1};
  s.message='草丛后藏着一个巢穴，找找看！';
}
export function act(before: State, a: Action): State {
  if(!hasActivePet(before)&&!['eggSearch','eggSelect0','eggSelect1','eggSelect2','eggTake','eggContinue'].includes(a))return before;
  const s: State = JSON.parse(JSON.stringify(before)); let valid=false;
  if(s.phase==='encounter') {
    if(a==='switch' && s.reserve) { [s.active,s.reserve]=[s.reserve,s.active]; s.message='已切换伙伴 · 生命比例保持'; valid=true; }
    if(a==='reroll' && s.swaps>0 && rankForStage(s.step)!=='boss') { s.swaps--; encounter(s,true); s.message='换了一个对手'; valid=true; }
    if(a==='challenge') { s.active=preferredPet(s,s.active);s.phase='battle';s.skill={usedCodes:[],used:false,attacks:0,shield:0,poison:0,nextMax:false,previousRoll:0,event:'',lastDamage:0,lastTaken:0}; roll(s); s.message='点数已确定，选择你的行动'; valid=true; }
  } else if(s.phase==='battle') {
    const k=s.skill;
    if(k){k.event='';k.lastDamage=0;k.lastTaken=0;}
    if(a==='heal' && !s.usedHeal && s.potions>0 && s.hpRatio<1) {
      const amount=healAmount(s)+(skillReady(s,'healing')?2:0),recovered=Math.min(amount,maxHP(s)-hp(s));
      s.potions--;s.usedHeal=true;
      if(k){if(skillReady(s,'healing'))trigger(s,'healing');if(skillReady(s,'refund')){s.potions++;trigger(s,'refund');}if(skillReady(s,'overflow')&&amount>maxHP(s)-hp(s)){k.shield+=Math.min(6,Math.floor(amount-(maxHP(s)-hp(s))));trigger(s,'overflow');}}
      s.hpRatio=Math.min(1,s.hpRatio+amount/maxHP(s));s.message='治疗 ×'+s.healMultiplier+' · 恢复 '+recovered+' 点生命';valid=true;
    }
    if(a==='boost' && !s.doubled && s.boosts>0) {s.boosts--;s.doubled=true;if(skillReady(s,'charged')){s.attack=Math.max(...s.active.faces);trigger(s,'charged');}s.message='本回合攻击 ×'+s.boostMultiplier+' · 造成 '+attackAmount(s);valid=true;}
    if(a==='attack'||a==='guard') {
      valid=true;
      const previousEnemy=s.enemyHP;let slow=0;
      if(a==='attack'){
        const dealt=Math.min(s.enemyHP,attackAmount(s));s.enemyHP-=dealt;
        if(k){k.attacks++;
          if(skillReady(s,'opening'))trigger(s,'opening');
          if(skillReady(s,'heavy')&&k.attacks===3)trigger(s,'heavy');
          if(skillReady(s,'venom')){k.poison=3;trigger(s,'venom');}
          if(skillReady(s,'slow')){slow=2;trigger(s,'slow');}
          if(skillReady(s,'leech')){s.hpRatio=Math.min(1,s.hpRatio+Math.min(Math.ceil(dealt*.2),Math.ceil(maxHP(s)*.25))/maxHP(s));trigger(s,'leech');}
        }
      }else if(k){if(skillReady(s,'focus')){k.nextMax=true;trigger(s,'focus');}if(skillReady(s,'barrier')){k.shield+=6;trigger(s,'barrier');}}
      if(k&&k.poison>0&&s.enemyHP>0){s.enemyHP=Math.max(0,s.enemyHP-2);k.poison--;k.event=k.event||'毒素 −2';}
      if(k)k.lastDamage=previousEnemy-s.enemyHP;
      if(s.enemyHP===0) {
        s.warmth=Math.min(9999,(s.warmth||0)+(rankForStage(s.step)==='boss'?3:rankForStage(s.step)==='elite'?2:1));
        if(rankForStage(s.step)==='boss'){if(s.step===mapStageCount(s))s.wins++;beginEggHunt(s);}
        else {s.phase='reward';s.message='战斗胜利！领取战利品';}
      } else {
        let damage=a==='guard'?guardDamage(s.enemyAttack):Math.max(1,s.enemyAttack-slow);
        if(k){if(skillReady(s,'armor')){damage=Math.max(1,damage-2);trigger(s,'armor');}if(skillReady(s,'evade')){damage=0;trigger(s,'evade');}const blocked=Math.min(k.shield,damage);damage-=blocked;k.shield-=blocked;k.lastTaken=damage;}
        s.hpRatio=Math.max(0,s.hpRatio-damage/maxHP(s));
        if(skillReady(s,'emergency')&&s.hpRatio>1e-8&&s.hpRatio<=.3){s.hpRatio=Math.min(1,s.hpRatio+Math.ceil(maxHP(s)*.25)/maxHP(s));trigger(s,'emergency');}
        s.message=(a==='guard'?'挡住了攻击，只受 ':'对手反击，受到 ')+damage+' 点伤害';
        if(s.hpRatio<=1e-8) {s.hpRatio=0;s.phase='lost';s.message='伙伴累了，休息后再出发吧';}
        else roll(s);
      }
    }
  } else if(s.phase==='nest' && s.eggHunt) {
    const hunt=s.eggHunt;
    if(a==='eggSearch' && hunt.candidates.length<hunt.limit){
      const rates=eggRates(s),roll=rand(s)*100,rarity:EggRarity=roll<rates.normal?'normal':roll<rates.normal+rates.SR?'SR':'SSR';
      const affinity=pick(s,mapFor(s).pets);
      hunt.candidates.push({id:'map'+(s.mapId||0)+'-'+s.wins+'-'+s.step+'-'+s.revision+'-'+s.seed,rarity,affinity,stage:s.step,mapId:s.mapId||0});
      hunt.selected=hunt.candidates.length-1;
      if(hunt.candidates.length===hunt.limit){const rank={normal:0,SR:1,SSR:2};hunt.selected=0;for(let i=1;i<hunt.candidates.length;i++)if(rank[hunt.candidates[i].rarity]>rank[hunt.candidates[hunt.selected].rarity])hunt.selected=i;}
      s.message=rarity==='normal'?'找到一枚宠物蛋！':'发现 '+rarity+' 宠物蛋！';valid=true;
    }
    const index=['eggSelect0','eggSelect1','eggSelect2'].indexOf(a);
    if(index>=0 && index<hunt.candidates.length && index!==hunt.selected){hunt.selected=index;valid=true;}
    if(a==='eggTake' && hunt.candidates[hunt.selected]){
      const chosen=hunt.candidates[hunt.selected];s.eggs=s.eggs||[];
      if(!s.eggs.some(e=>e.id===chosen.id))s.eggs.push({...chosen});
      s.phase='eggClaimed';s.message='宠物蛋已存入蛋袋';valid=true;
    }
  } else if(s.phase==='eggClaimed' && a==='eggContinue') {
    delete s.eggHunt;if(s.step===mapStageCount(s)){s.phase='won';s.clearedMaps=Array.from(new Set([...(s.clearedMaps||[]),s.mapId||0]));s.message=mapFor(s).name+'已通关！';}else if(rankForStage(s.step)==='boss')next(s);else finishReward(s);valid=true;
  } else if(s.phase==='reward') {
    const choice=a==='reward0'?0:-1;
    if(a==='take'||a==='keep'||choice>=0) {
      if(choice>=0)s.reward=rewardOptions(s)[choice];
      if(a==='keep' && !['attack','heal'].includes(s.reward.kind))return before;
      if(a==='take'||choice>=0) {
        const r=s.reward;
        if(r.kind==='hp'){const current=s.hpRatio*maxHP(s);s.hpBonus+=r.values[0];s.hpRatio=current/maxHP(s);}
        if(r.kind==='attack')s.active.faces=[...r.values];
        if(r.kind==='heal')s.healFaces=[...r.values];
        if(r.kind==='potion')s.potions=Math.min(9,s.potions+r.values[0]);
        if(r.kind==='boost')s.boosts=Math.min(9,s.boosts+r.values[0]);
      }
      afterReward(s);valid=true;
    }
  } else if(s.phase==='recruit'||s.phase==='team') {
    // Legacy screens can only continue; new companions are exclusively hatched.
    if(['invite','skip','replace','collect'].includes(a)){s.recruit=null;next(s);valid=true;}
  }
  if(!valid)return before;
  s.revision++;
  return s;
}
export function restore(raw: string | null): State | null {
  try {
    const s=JSON.parse(raw || 'null') as State;
    const finite=(n: unknown)=>typeof n==='number'&&Number.isFinite(n);
    const faces=(a: any)=>Array.isArray(a)&&a.length>=1&&a.length<=5&&a.every((n:any)=>finite(n)&&n>=1&&n<=100);
    const validPet=(p: any)=>p&&ids.includes(p.id)&&faces(p.faces)&&(p.rarity===undefined||RARITIES.includes(p.rarity));
    if(!s||s.version!==1||!validPet(s.active)||(s.reserve!==null&&!validPet(s.reserve)))return null;
    const legacyMaps=s.mapVersion===undefined;
    if(legacyMaps){s.mapId=s.step>10?1:0;s.clearedMaps=s.wins>0?[0,1]:s.step>10?[0]:[];if(s.phase==='won'&&!s.clearedMaps.includes(s.mapId))s.clearedMaps.push(s.mapId);s.mapVersion=1;s.enemyRarity='normal';}
    if(s.mapVersion!==1||!Number.isInteger(s.mapId)||s.mapId!<0||s.mapId!>=MAPS.length||!Array.isArray(s.clearedMaps)||s.clearedMaps.some((id,i,a)=>!Number.isInteger(id)||id<0||id>=MAPS.length||a.indexOf(id)!==i)||!mapUnlocked(s,s.mapId!)||!RARITIES.includes(s.enemyRarity!))return null;
    if(s.roster!==undefined&&(!s.roster||typeof s.roster!=='object'||Array.isArray(s.roster)||Object.keys(s.roster).some(id=>!ids.includes(id as PetId)||!validPet(s.roster![id])||s.roster![id].id!==id)))return null;
    if(!['encounter','battle','reward','recruit','team','won','lost','nest','eggClaimed'].includes(s.phase))return null;
    if(![s.seed,s.step,s.hpRatio,s.hpBonus,s.potions,s.boosts,s.swaps,s.enemyHP,s.enemyMax,s.revision,s.wins,s.attack,s.heal,s.enemyAttack,s.turn].every(finite))return null;
    if(s.step<1||s.step>mapStageCount(s)||!Number.isInteger(s.step)||s.hpRatio<0||s.hpRatio>1||s.hpBonus<0||s.hpBonus>150)return null;
    if(s.potions<0||s.potions>9||s.boosts<0||s.boosts>9||s.swaps<0||s.swaps>2)return null;
    if(!ids.includes(s.enemy)||!Array.isArray(s.owned)||!faces(s.healFaces))return null;
    // Recover the early preview's Set-serialization anomaly without dropping its run.
    if(s.owned.some(x=>typeof x==='object'&&x!==null))s.owned=ids.filter(id=>id==='fox'||id==='turtle'||s.owned.indexOf(id)>=0||s.active.id===id||s.reserve?.id===id||(s.phase==='team'&&s.recruit===id));
    if(!s.owned.every(x=>ids.includes(x)))return null;
    if(s.partySlots!==undefined&&(!Array.isArray(s.partySlots)||s.partySlots.length!==3||s.partySlots.some((id,i)=>!ids.includes(id)||s.partySlots!.indexOf(id)!==i)||!s.partySlots.includes(s.active.id)||(s.reserve&&!s.partySlots.includes(s.reserve.id))))return null;
    if(!s.reward||!['hp','attack','heal','potion','boost'].includes(s.reward.kind)||!faces(s.reward.values)||typeof s.reward.title!=='string')return null;
    if(['recruit','team'].includes(s.phase)&&(!s.recruit||!ids.includes(s.recruit)))return null;
    if(s.enemyMax<=0||s.enemyHP<0||s.enemyHP>s.enemyMax||typeof s.usedHeal!=='boolean'||typeof s.doubled!=='boolean')return null;
    // Preserve effects already committed in older saves; new turns roll multipliers.
    if(s.healMultiplier===undefined)s.healMultiplier=1;
    if(s.boostMultiplier===undefined)s.boostMultiplier=2;
    // Preserve a previous version's already-rolled x1; new turns use the current pool.
    if(!ITEM_MULTIPLIERS.heal.includes(s.healMultiplier)||![1,2,3,4].includes(s.boostMultiplier))return null;
    const validEgg=(e:any)=>e&&typeof e.id==='string'&&['normal','SR','SSR'].includes(e.rarity)&&ids.includes(e.affinity)&&(e.bond===undefined||validFriendBond(e.bond)&&ids.includes(e.bond.sourceAffinity)&&e.bond.species===e.affinity)&&((e.stage===0&&validGenes(e.genes)&&e.genes.id===e.affinity&&e.genes.rarity===e.rarity)||(Number.isInteger(e.stage)&&e.stage>=5&&e.stage<=30&&e.stage%5===0&&(e.mapId===undefined?e.stage<=20:Number.isInteger(e.mapId)&&e.mapId>=0&&e.mapId<MAPS.length&&e.stage<=MAPS[e.mapId].stages&&MAPS[e.mapId].pets.includes(e.bond?.sourceAffinity||e.affinity))));
    if(s.eggs===undefined)s.eggs=[];
    if(!Array.isArray(s.eggs)||!s.eggs.every(validEgg)||s.eggs.some((e,i)=>s.eggs!.findIndex(v=>v.id===e.id)!==i))return null;
    if(s.phase==='nest'||s.phase==='eggClaimed'){
      const h=s.eggHunt;if(s.step%5!==0||!h||h.limit!==(rankForStage(s.step)==='boss'?3:2)||!Array.isArray(h.candidates)||h.candidates.length>h.limit||!h.candidates.every(e=>validEgg(e)&&e.stage===s.step&&(e.mapId===undefined||e.mapId===s.mapId))||!Number.isInteger(h.selected)||h.selected<(h.candidates.length?0:-1)||h.selected>=h.candidates.length)return null;
      if(h.candidates.some((e,i)=>h.candidates.findIndex(v=>v.id===e.id)!==i))return null;
      if(s.phase==='eggClaimed'&&(!h.candidates[h.selected]||!s.eggs.some(e=>e.id===h.candidates[h.selected].id)))return null;
    }else delete s.eggHunt;
    if(!validHatching(s)||!validSocial(s))return null;
    if(s.contentVersion!==2){if(s.phase==='encounter'){const swaps=s.swaps;encounter(s,false);s.swaps=rankForStage(s.step)==='boss'?0:swaps;}s.contentVersion=2;}
    if(s.individualVersion===1&&!validIndividuals(s))return null;
    migrateIndividuals(s);
    if(legacyMaps&&s.phase==='encounter'){const swaps=s.swaps;encounter(s,false);s.swaps=rankForStage(s.step)==='boss'?0:swaps;}
    if(s.phase==='recruit'||s.phase==='team'){s.recruit=null;next(s);}
    return s;
  } catch {return null;}
}
export function equipReserve(before:State,key:string):State { return assignPartySlot(before,key,1); }
export const canManageParty=(s:State)=>s.phase!=='battle';
export function partyChoices(s:State):string[]{return homeParty(s);}
export function homeParty(s:State):string[]{
  const slots=(s.team||[]).slice(0,3);while(slots.length<3)slots.push('');
  const place=(key:string,index:number)=>{const old=slots.indexOf(key);if(old>=0)slots[old]=slots[index];slots[index]=key;};
  place(s.active.uid||'',0);if(s.reserve?.uid)place(s.reserve.uid,1);
  return slots;
}
function rememberParty(s:State){s.runRoster=s.runRoster||{};if(s.active.uid)s.runRoster[s.active.uid]=clonePet(s.active);if(s.reserve?.uid)s.runRoster[s.reserve.uid]=clonePet(s.reserve);}
function runPet(s:State,key:string):Pet {return clonePet(s.runRoster?.[key]||s.pets!.find(p=>p.uid===key)!);}
export function selectActive(before:State,key:string):State {
  if(before.phase!=='encounter')return before;return assignPartySlot(before,key,0);
}
export function assignPartySlot(before:State,key:string,index:number):State {
  if(!canManageParty(before)||!before.pets?.some(p=>p.uid===key)||![0,1,2].includes(index))return before;
  const slots=homeParty(before);if(slots[index]===key)return before;
  const s=clone(before);rememberParty(s);const old=slots.indexOf(key);if(old>=0)slots[old]=slots[index];slots[index]=key;
  if(!slots[0]){const replacement=slots.findIndex((value,i)=>i!==index&&!!value);if(replacement<0)return before;slots[0]=slots[replacement];slots[replacement]='';}
  s.team=slots;s.active=runPet(s,slots[0]);s.reserve=slots[1]?runPet(s,slots[1]):null;delete s.partySlots;
  s.revision++;return s;
}
export function continueAdventure(before:State):State {
  if(before.phase!=='won')return before;
  return startMap(before,(before.mapId||0)+1);
}
export function restartRun(before:State,seed=Date.now()):State {
  if(!hasActivePet(before))return before;
  const s=fresh(seed,before.owned,before.wins);
  for(const key of ['eggs','incubators','warmth','hatchSeed','hatchedEggIds','qualities','preferredRarities','pendingHatch','pets','team','individualVersion','breeding','breedingSerial','mapId','mapVersion','clearedMaps','social'])if(before[key]!==undefined)s[key]=JSON.parse(JSON.stringify(before[key]));
  s.active=clonePet(s.pets!.find(p=>p.uid===before.active.uid)!);s.reserve=before.reserve?clonePet(s.pets!.find(p=>p.uid===before.reserve!.uid)!):null;
  s.team=homeParty(before);s.runRoster={};encounter(s,false);return s;
}
export function startMap(before:State,mapId:number,seed=Date.now()):State {
  if(!mapUnlocked(before,mapId)||!hasActivePet(before))return before;
  const s=restartRun(before,seed);s.mapId=mapId;encounter(s,false);s.revision=before.revision+1;return s;
}

export const RARITIES:EggRarity[]=['normal','SR','SSR'];
export const rarityName=(r:EggRarity='normal')=>r==='normal'?'R':r;
export const qualityHP=(r:EggRarity='normal')=>r==='SSR'?4:r==='SR'?2:0;
export const HATCH_DURATION=30*60*1000, HATCH_ACCELERATION=5*60*1000;
export const HATCH_RATES={normal:[90,9,1],SR:[0,95,5],SSR:[0,0,100]};
export function unlockedRarities(s:State,id:PetId):EggRarity[]{return s.qualities?.[id]?.slice()||(s.owned.includes(id)?['normal']:[]);}
export function preferredRarity(s:State,id:PetId):EggRarity {const unlocked=unlockedRarities(s,id);return s.preferredRarities?.[id]||RARITIES.filter(r=>unlocked.includes(r)).pop()||'normal';}
function preferredPet(s:State,p:Pet):Pet {return p;}
const clone=(s:State):State=>JSON.parse(JSON.stringify(s));
const clonePet=(p:Pet):Pet=>JSON.parse(JSON.stringify(p));
// Forms are separate individuals and can no longer be toggled in place.
export function setPetRarity(before:State,id:PetId,rarity:EggRarity):State {return before;}
export const availableEggs=(s:State)=>(s.eggs||[]).filter(e=>!(s.hatchedEggIds||[]).includes(e.id)&&!(s.incubators||[]).some(slot=>slot?.eggId===e.id));
export const hatchRemaining=(slot:Incubation,now=Date.now())=>Math.max(0,slot.readyAt-now);
export function startIncubation(before:State,eggId:string,index:number,now=Date.now()):State {
  if(![0,1].includes(index)||before.incubators?.[index]||!Number.isFinite(now)||now<0)return before;
  const egg=availableEggs(before).find(e=>e.id===eggId);if(!egg)return before;
  const s=clone(before);s.incubators=s.incubators||[null,null];
  s.hatchSeed=(Math.imul(s.hatchSeed===undefined?(s.seed^0x9e3779b9)>>>0:s.hatchSeed,1664525)+1013904223)>>>0;
  const roll=s.hatchSeed/4294967296*100,weights=HATCH_RATES[egg.rarity];
  const result:EggRarity=egg.genes||egg.bond?egg.rarity:roll<weights[0]?'normal':roll<weights[0]+weights[1]?'SR':'SSR';
  s.incubators[index]={eggId,startedAt:now,readyAt:now+HATCH_DURATION,result};s.revision++;return s;
}
export function accelerateHatch(before:State,index:number,now=Date.now()):State {
  const slot=before.incubators?.[index];if(!slot||!Number.isFinite(now)||now<slot.startedAt||hatchRemaining(slot,now)===0||(before.warmth||0)<1)return before;
  const s=clone(before);s.warmth!--;s.incubators![index]!.readyAt=Math.max(now,slot.readyAt-HATCH_ACCELERATION);s.revision++;return s;
}
export function claimHatch(before:State,index:number,now=Date.now()):State {
  const slot=before.incubators?.[index];if(!slot||before.pendingHatch||!Number.isFinite(now)||now<slot.startedAt||hatchRemaining(slot,now)>0)return before;
  const egg=before.eggs?.find(e=>e.id===slot.eggId);if(!egg||(before.hatchedEggIds||[]).includes(egg.id))return before;
  const s=clone(before),id=egg.affinity,genes=egg.genes||naturalGenes(id,slot.result);
  const child=individual(s,'hatch-'+egg.id,genes);s.pets!.push(child);
  if(!hasActivePet(s)){s.active=clonePet(child);s.reserve=null;s.team=[child.uid!,'',''];s.runRoster={};s.hpRatio=1;s.phase='encounter';encounter(s,false);}
  if(!s.owned.includes(id))s.owned.push(id);
  s.qualities=s.qualities||{};s.qualities[id]=Array.from(new Set([...(s.qualities[id]||[]),slot.result]));
  s.hatchedEggIds=[...(s.hatchedEggIds||[]),egg.id];s.incubators![index]=null;
  s.pendingHatch={eggId:egg.id,petId:id,rarity:slot.result,duplicate:false,warmthGain:0,uid:child.uid};s.revision++;return s;
}
export function acknowledgeHatch(before:State):State {if(!before.pendingHatch)return before;const s=clone(before);delete s.pendingHatch;s.revision++;return s;}

export const SKILLS={
  opening:['抢先一击','首次攻击额外造成 2 点伤害。'], armor:['硬壳','首次受击减少 2 点伤害，至少受到 1 点。'],
  healing:['草木祝福','首次使用生命药水额外恢复 2 点生命。'], steady:['稳定发挥','首次掷出最低攻击点数，自动变为中间点数。'],
  repeat:['连锁电流','首次连续两回合攻击点数相同，后一次变为最高点数。'], charged:['力量共鸣','首次使用力量药水，攻击点数变为最高，再计算药水倍率。'],
  focus:['蓄势反击','首次防御后，下回合攻击必定为最高点数。'], barrier:['坚垒','首次防御获得 6 点护盾，可跨回合抵消伤害。'],
  overflow:['泡泡护盾','首次生命药水产生溢出治疗时，溢出部分变为护盾，最多 6 点。'], refund:['药水回响','首次生命药水不消耗库存；每回合仍只能使用一次。'],
  emergency:['生命绽放','首次受击后存活且生命不超过 30%，自动恢复最大生命的 25%。'],
  venom:['毒素印记','首次攻击施毒，本次及随后两次行动结束时各造成 2 点伤害。'],
  heavy:['三连重击','第三次攻击额外造成 4 点伤害。'], slow:['霜羽压制','首次攻击令本次反击伤害减少 2，至少受到 1 点。'],
  evade:['幻影守护','首次敌方反击完全免伤。'],leech:['生命汲取','首次攻击恢复其实际直接伤害的 20%（向上取整），不超过最大生命的 25%。'],
} as const;
export type SkillCode=keyof typeof SKILLS;
const PET_SKILLS:Record<PetId,[SkillCode,SkillCode,SkillCode]>={
  fox:['opening','steady','charged'],bud:['healing','refund','emergency'],turtle:['armor','focus','barrier'],
  cotton:['opening','steady','emergency'],otter:['healing','overflow','refund'],spark:['opening','repeat','charged'],
  seal:['armor','slow','focus'],ape:['opening','heavy','charged'],slug:['opening','venom','leech'],mole:['armor','focus','barrier'],
  bird:['opening','slow','evade'],owl:['opening','steady','charged'],beetle:['armor','venom','refund'],ghost:['opening','venom','leech'],
  dragon:['opening','heavy','charged'],lynx:['opening','steady','leech'],rhino:['armor','barrier','evade'],deer:['healing','refund','emergency']
};
export function petSkills(p:Pick<Pet,'id'|'rarity'|'skills'>):SkillCode[]{return p.skills?.slice()||[PET_SKILLS[p.id][RARITIES.indexOf(p.rarity||'normal')]];}
export function skillFor(p:Pick<Pet,'id'|'rarity'|'skills'>){const codes=petSkills(p);return {code:codes[0],name:codes.map(c=>SKILLS[c][0]).join(' · '),description:codes.map(c=>SKILLS[c][1]).join('\n')+'\n各技能每场限一次。'};}
function skillReady(s:State,code:SkillCode):boolean {return !!s.skill&&petSkills(s.active).includes(code)&&!(s.skill.usedCodes||(s.skill.used?petSkills(s.active):[])).includes(code);}
function trigger(s:State,code:SkillCode){if(s.skill){const k=s.skill;k.usedCodes=k.usedCodes||[];if(!k.usedCodes.includes(code))k.usedCodes.push(code);k.used=petSkills(s.active).every(c=>k.usedCodes!.includes(c));k.event+=(k.event?' · ':'')+SKILLS[code][0]+'！';}}
export function skillStatus(s:State):string {const k=s.skill;if(!k)return '技能从下一场生效';return rarityName(s.active.rarity)+' · 技能 '+(k.usedCodes?.length||(k.used?1:0))+'/'+petSkills(s.active).length+(k.shield?' · 护盾 '+k.shield:k.poison?' · 毒 '+k.poison+' 回合':k.nextMax?' · 下回合最高点数':'');}
function validHatching(s:State):boolean {
  const uint=(n:any)=>Number.isSafeInteger(n)&&n>=0,object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);
  if(s.warmth!==undefined&&(!uint(s.warmth)||s.warmth>9999))return false;
  if(s.hatchSeed!==undefined&&(!uint(s.hatchSeed)||s.hatchSeed>4294967295))return false;
  if(s.qualities!==undefined&&(!object(s.qualities)||Object.keys(s.qualities).some(id=>!ids.includes(id as PetId)||!s.owned.includes(id as PetId)||!Array.isArray(s.qualities![id])||!s.qualities![id].length||s.qualities![id].some((r:any,i:number,a:any[])=>!RARITIES.includes(r)||a.indexOf(r)!==i))))return false;
  if(s.preferredRarities!==undefined&&(!object(s.preferredRarities)||Object.keys(s.preferredRarities).some(id=>!ids.includes(id as PetId)||!unlockedRarities(s,id as PetId).includes(s.preferredRarities![id]))))return false;
  if(s.hatchedEggIds!==undefined&&(!Array.isArray(s.hatchedEggIds)||s.hatchedEggIds.some((id,i,a)=>!s.eggs!.some(e=>e.id===id)||a.indexOf(id)!==i)))return false;
  if(s.incubators!==undefined){if(!Array.isArray(s.incubators)||s.incubators.length!==2)return false;
    for(const slot of s.incubators){if(slot===null)continue;const egg=s.eggs!.find(e=>e.id===slot?.eggId);
      if(!egg||!uint(slot.startedAt)||!uint(slot.readyAt)||slot.readyAt<slot.startedAt||!RARITIES.includes(slot.result)||RARITIES.indexOf(slot.result)<RARITIES.indexOf(egg.rarity)||(egg.bond&&slot.result!==egg.rarity)||(s.hatchedEggIds||[]).includes(slot.eggId)||s.incubators.filter(x=>x?.eggId===slot.eggId).length!==1)return false;}
  }
  if(s.pendingHatch){const r=s.pendingHatch,e=s.eggs!.find(e=>e.id===r.eggId);if(!e||e.affinity!==r.petId||!(s.hatchedEggIds||[]).includes(r.eggId)||!unlockedRarities(s,r.petId).includes(r.rarity)||typeof r.duplicate!=='boolean'||r.warmthGain!==(r.duplicate?{normal:3,SR:8,SSR:20}[r.rarity]:0))return false;}
  if(s.skill){const k=s.skill;if(!object(k)||typeof k.used!=='boolean'||typeof k.nextMax!=='boolean'||typeof k.event!=='string'||![k.attacks,k.shield,k.poison,k.previousRoll,k.lastDamage,k.lastTaken].every(uint)||k.poison>3||k.shield>12||(k.usedCodes!==undefined&&(!Array.isArray(k.usedCodes)||k.usedCodes.some(c=>!petSkills(s.active).includes(c))||new Set(k.usedCodes).size!==k.usedCodes.length)))return false;}
  return true;
}

// Species forms and individuals are separate: no quality selector and no duplicate conversion.
export const FORM_NAMES:Record<PetId,[string,string,string]>={
  fox:['闪尾狐','焰鬃狐','曜焰灵狐'],bud:['芽芽龙','蕨翼龙','花冠森龙'],turtle:['岩背龟','峭甲龟','山垒巨龟'],
  cotton:['绒团兔','绒领兔','云绒王兔'],otter:['潮泡獭','涌浪獭','沧澜海獭'],spark:['蓄电貂','电弧貂','雷冠灵貂'],
  seal:['霜团海豹','霜鳍海豹','冰冠海狮'],ape:['拳铠猿','破岩拳猿','金刚斗猿'],slug:['毒泡蜗','棘壳蜗','毒冠巨蜗'],
  mole:['铲角鼹','钻甲鼹','地脉巨鼹'],bird:['云翎雀','流云隼','天穹鹏'],owl:['星环鸮','月轮鸮','星冕贤鸮'],
  beetle:['芽角甲虫','荆角甲虫','翠刃甲皇'],ghost:['灯芯幽灵','引魂灯灵','冥灯灵君'],dragon:['霆冠龙','裂霆翼龙','苍霆龙皇'],
  lynx:['暮影猞猁','夜刃猞猁','蚀月影王'],rhino:['铁垒犀','钢棘战犀','星钢巨犀'],deer:['铃芽鹿','花铃灵鹿','圣铃仙鹿']
};
export const petName=(p:Pick<Pet,'id'|'rarity'>)=>FORM_NAMES[p.id][RARITIES.indexOf(p.rarity||'normal')];
export const formKey=(p:Pick<Pet,'id'|'rarity'>)=>p.id+'-'+(p.rarity||'normal');
export const petBaseHP=(p:Pet)=>p.baseHP??PETS[p.id].hp+qualityHP(p.rarity);
export const sexSymbol=(sex?:Sex)=>sex==='female'?'♀':sex==='male'?'♂':'';
export function petEntry(s:State,key:string):Pet {
  const p=s.pets?.find(p=>p.uid===key);if(p)return p;
  const [id,r]=key.split(':') as [PetId,EggRarity];return {id:ids.includes(id)?id:'fox',rarity:RARITIES.includes(r)?r:'normal',faces:[...PETS[ids.includes(id)?id:'fox'].faces]};
}
function hatchRandom(s:State):number {s.hatchSeed=(Math.imul(s.hatchSeed===undefined?(s.seed^0x9e3779b9)>>>0:s.hatchSeed,1664525)+1013904223)>>>0;return s.hatchSeed/4294967296;}
function naturalGenes(id:PetId,rarity:EggRarity):Genes {return {id,rarity,baseHP:PETS[id].hp+qualityHP(rarity),baseFaces:[...PETS[id].faces],skills:[PET_SKILLS[id][RARITIES.indexOf(rarity)]]};}
function individual(s:State,uid:string,g:Genes):Pet {return {id:g.id,rarity:g.rarity,uid,sex:hatchRandom(s)<.5?'female':'male',baseHP:g.baseHP,baseFaces:[...g.baseFaces],faces:[...g.baseFaces],skills:[...g.skills]};}
function migrateIndividuals(s:State){
  if(s.individualVersion===1)return;
  s.pets=[];s.runRoster={};
  const oldActive=clonePet(s.active),oldReserve=s.reserve?clonePet(s.reserve):null;
  for(const id of Array.from(new Set([...s.owned,s.active.id,...(s.reserve?[s.reserve.id]:[])]))){
    const forms=Array.from(new Set([...(s.qualities?.[id]||['normal']),...(oldActive.id===id?[oldActive.rarity||'normal']:[]),...(oldReserve?.id===id?[oldReserve.rarity||'normal']:[])])) as EggRarity[];
    s.qualities=s.qualities||{};s.qualities[id]=forms;
    for(const rarity of forms)s.pets.push(individual(s,'legacy-'+id+'-'+rarity,naturalGenes(id,rarity)));
  }
  const find=(p:Pet)=>s.pets!.find(v=>v.id===p.id&&v.rarity===(p.rarity||s.preferredRarities?.[p.id]||'normal'))||s.pets!.find(v=>v.id===p.id)!;
  s.active={...clonePet(find(oldActive)),faces:oldActive.faces};s.reserve=oldReserve?{...clonePet(find(oldReserve)),faces:oldReserve.faces}:null;
  const extra=(s.partySlots||s.owned).map(id=>s.pets!.find(p=>p.id===id)?.uid||'');
  s.team=Array.from(new Set([s.active.uid!,s.reserve?.uid||'',...extra].filter(Boolean))).slice(0,3);while(s.team.length<3)s.team.push('');
  for(const id of Object.keys(s.roster||{}) as PetId[]){const old=s.roster![id]!;const p=find(old);s.runRoster[p.uid!]={...clonePet(p),faces:[...old.faces]};}
  rememberParty(s);delete s.partySlots;
  if(s.pendingHatch){const p=s.pets.find(p=>p.id===s.pendingHatch!.petId&&p.rarity===s.pendingHatch!.rarity);s.pendingHatch.uid=p?.uid;}
  if(s.skill&&!s.skill.usedCodes)s.skill.usedCodes=s.skill.used?petSkills(s.active):[];
  s.individualVersion=1;
}
export const BREED_DURATION=30*60*1000;
export function inheritedSkillCount(total:number,roll:number):number {
  if(total<=1)return Math.max(0,total);
  if(total<3)return roll<.5?1:2;
  if(total===3)return roll<.5?2:3;
  if(total===4)return roll<.3?2:roll<.7?3:4;
  if(total===5)return roll<.2?2:roll<.5?3:roll<.8?4:5;
  return roll<.2?3:roll<.5?4:roll<.8?5:6;
}
export function startBreeding(before:State,mother:string,father:string,now=Date.now()):State {
  const m=before.pets?.find(p=>p.uid===mother),f=before.pets?.find(p=>p.uid===father);
  if(before.breeding||!m||!f||m.sex!=='female'||f.sex!=='male'||mother===father||!Number.isSafeInteger(now)||now<0)return before;
  const s=clone(before),form=hatchRandom(s)<.5?m:f,health=hatchRandom(s)<.5?m:f,attack=hatchRandom(s)<.5?m:f;
  const pool=Array.from(new Set([...petSkills(m),...petSkills(f)])),count=inheritedSkillCount(pool.length,hatchRandom(s)),skills:SkillCode[]=[];
  while(skills.length<count){const i=Math.floor(hatchRandom(s)*pool.length);skills.push(pool.splice(i,1)[0]);}
  const genes:Genes={id:form.id,rarity:form.rarity||'normal',baseHP:petBaseHP(health),baseFaces:[...(attack.baseFaces||PETS[attack.id].faces)],skills};
  s.breedingSerial=(s.breedingSerial||0)+1;
  s.breeding={id:'breed-'+s.breedingSerial+'-'+s.hatchSeed,mother,father,startedAt:now,readyAt:now+BREED_DURATION,genes};s.revision++;return s;
}
export function claimBreeding(before:State,now=Date.now()):State {
  const b=before.breeding;if(!b||before.phase==='battle'||before.pendingHatch||!Number.isSafeInteger(now)||now<b.readyAt)return before;
  const s=clone(before);s.eggs=s.eggs||[];
  if(!s.eggs.some(e=>e.id===b.id))s.eggs.push({id:b.id,rarity:b.genes.rarity,affinity:b.genes.id,stage:0,genes:JSON.parse(JSON.stringify(b.genes))});
  const removed=[b.mother,b.father],slots=homeParty(s);rememberParty(s);
  if(removed.includes(s.active.uid!))delete s.skill;
  s.pets=s.pets!.filter(p=>!removed.includes(p.uid!));
  for(const uid of removed)delete s.runRoster![uid];
  s.team=slots.map(uid=>removed.includes(uid)?'':uid);
  if(s.pets.length){
    if(!s.team[0])s.team[0]=s.team.find(Boolean)||s.pets[0].uid!;
    for(let i=1;i<3;i++)if(s.team[i]===s.team[0])s.team[i]='';
    s.active=runPet(s,s.team[0]);s.reserve=s.team[1]?runPet(s,s.team[1]):null;
  }else{s.active=pet('fox');s.reserve=null;s.team=['','',''];s.runRoster={};s.hpRatio=1;s.phase='encounter';s.enemyHP=s.enemyMax;delete s.skill;}
  s.breeding=null;s.revision++;return s;
}
function validGenes(g:any):g is Genes {return !!g&&ids.includes(g.id)&&RARITIES.includes(g.rarity)&&Number.isInteger(g.baseHP)&&g.baseHP>0&&g.baseHP<=100&&Array.isArray(g.baseFaces)&&g.baseFaces.length>0&&g.baseFaces.length<=5&&g.baseFaces.every((v:any)=>Number.isInteger(v)&&v>0&&v<=100)&&Array.isArray(g.skills)&&g.skills.length>0&&g.skills.length<=6&&new Set(g.skills).size===g.skills.length&&g.skills.every((c:any)=>Object.prototype.hasOwnProperty.call(SKILLS,c));}
function validIndividuals(s:State):boolean {
  if(!Array.isArray(s.pets))return false;
  const valid=(p:Pet)=>p&&typeof p.uid==='string'&&p.uid.length>0&&['female','male'].includes(p.sex!)&&validGenes({...p,rarity:p.rarity||'normal'});
  if(s.pets.some(p=>!valid(p))||new Set(s.pets.map(p=>p.uid)).size!==s.pets.length)return false;
  const exists=(uid?:string)=>s.pets!.some(p=>p.uid===uid);
  const same=(p:Pet)=>valid(p)&&exists(p.uid)&&['id','rarity','sex','baseHP','baseFaces','skills'].every(k=>JSON.stringify(p[k])===JSON.stringify(s.pets!.find(v=>v.uid===p.uid)![k]));
  if(s.pets.length?(!same(s.active)||(s.reserve&&!same(s.reserve))||s.reserve?.uid===s.active.uid):(!!s.active.uid||s.reserve!==null||s.phase==='battle'))return false;
  if(!Array.isArray(s.team)||s.team.length!==3||s.team.some(uid=>uid!==''&&!exists(uid))||new Set(s.team.filter(Boolean)).size!==s.team.filter(Boolean).length||(s.pets.length&&!s.team.includes(s.active.uid!))||(s.reserve&&!s.team.includes(s.reserve.uid!)))return false;
  if(s.runRoster&&(typeof s.runRoster!=='object'||Array.isArray(s.runRoster)||Object.entries(s.runRoster).some(([uid,p])=>uid!==p.uid||!same(p)||!Array.isArray(p.faces)||!p.faces.every(n=>Number.isFinite(n)&&n>=1&&n<=100))))return false;
  if(s.pets.some(p=>!s.owned.includes(p.id)))return false;
  if(s.breeding){const b=s.breeding,m=s.pets.find(p=>p.uid===b.mother),f=s.pets.find(p=>p.uid===b.father);if(!b.id||!m||!f||m.sex!=='female'||f.sex!=='male'||!Number.isSafeInteger(b.startedAt)||b.startedAt<0||b.readyAt!==b.startedAt+BREED_DURATION||!validGenes(b.genes))return false;}
  if(s.breedingSerial!==undefined&&(!Number.isSafeInteger(s.breedingSerial)||s.breedingSerial<0))return false;
  if(s.pendingHatch&&!exists(s.pendingHatch.uid))return false;
  return true;
}

// Offline visitor cards carry appearance only. The checksum detects copying errors;
// it does not authenticate another player or make a local save tamper-proof.
export const VISIT_ACTION_MS=2500;
const socialIdentity=(value:any,min=6,max=64)=>typeof value==='string'&&value.length>=min&&value.length<=max&&/^[A-Za-z0-9_-]+$/.test(value);
function visitChecksum(value:string):string {let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return (hash>>>0).toString(36);}
function cardBody(card:Pick<FriendCard,'owner'|'species'|'rarity'|'sex'|'petUid'>):string {return ['PMV1',card.owner,ids.indexOf(card.species),RARITIES.indexOf(card.rarity),card.sex==='female'?'F':'M',card.petUid].join('.');}
function validFriendCard(card:any):card is FriendCard {return !!card&&card.version===1&&socialIdentity(card.owner)&&socialIdentity(card.petUid,1,160)&&ids.includes(card.species)&&RARITIES.includes(card.rarity)&&['female','male'].includes(card.sex)&&card.id==='card-'+visitChecksum(cardBody(card));}
function validFriendBond(bond:any):bond is FriendBond {return !!bond&&ids.includes(bond.species)&&socialIdentity(bond.owner)&&typeof bond.cardId==='string'&&/^card-[0-9a-z]{1,7}$/.test(bond.cardId);}
export function ensureSocial(before:State,owner:string):State {
  if(before.social||!socialIdentity(owner))return before;
  const s=clone(before);s.social={version:1,owner,bonds:[]};s.revision++;return s;
}
export function makeVisitCode(s:State,uid:string):string|null {
  const p=s.pets?.find(p=>p.uid===uid);if(!s.social||!p||!socialIdentity(p.uid,1,160)||!p.sex)return null;
  const body=cardBody({owner:s.social.owner,petUid:p.uid!,species:p.id,rarity:p.rarity||'normal',sex:p.sex});return body+'.'+visitChecksum(body);
}
export function readVisitCode(input:string):FriendCard|null {
  if(typeof input!=='string'||input.length>1024)return null;
  const code=input.replace(/\s/g,''),parts=code.split('.');if(parts.length!==7)return null;
  const [version,owner,species,rarity,sex,petUid,check]=parts;
  if(version!=='PMV1'||!socialIdentity(owner)||!socialIdentity(petUid,1,160)||!/^(?:[0-9]|1[0-7])$/.test(species)||!/[012]/.test(rarity)||rarity.length!==1||!['F','M'].includes(sex))return null;
  const body=parts.slice(0,6).join('.');if(check!==visitChecksum(body))return null;
  return {version:1,owner,petUid,species:ids[Number(species)],rarity:RARITIES[Number(rarity)],sex:sex==='F'?'female':'male',id:'card-'+check};
}
export function receiveVisitor(before:State,code:string,now=Date.now()):State {
  const card=readVisitCode(code);if(!before.social||!card||card.owner===before.social.owner||!Number.isSafeInteger(now)||now<0||before.social.visitor?.card.id===card.id)return before;
  const s=clone(before);s.social!.visitor={card,progress:s.social!.bonds.some(b=>b.species===card.species)?3:0,lastPlayedAt:now};s.revision++;return s;
}
export function visitorPet(s:State):Pet|null {const c=s.social?.visitor?.card;return c?{id:c.species,rarity:c.rarity,sex:c.sex,faces:[]}:null;}
export function friendBonds(s:State):FriendBond[] {return (s.social?.bonds||[]).map(b=>({...b}));}
export function visitAction(before:State,now=Date.now()):State {
  const v=before.social?.visitor;if(!v||v.progress>=3||!Number.isSafeInteger(now)||now-v.lastPlayedAt<VISIT_ACTION_MS)return before;
  const s=clone(before),visitor=s.social!.visitor!;visitor.progress++;visitor.lastPlayedAt=now;
  if(visitor.progress===3&&!s.social!.bonds.some(b=>b.species===visitor.card.species))s.social!.bonds.push({species:visitor.card.species,owner:visitor.card.owner,cardId:visitor.card.id});
  s.revision++;return s;
}
export function bondBlockReason(s:State,egg:Egg,target:PetId):string {
  if(!ids.includes(target)||!s.social?.bonds.some(b=>b.species===target))return '先接待这个系列的好友伙伴';
  if(!egg||!availableEggs(s).some(e=>e.id===egg.id))return '这枚蛋已在孵化或已经破壳';
  if(egg.bond)return '这枚蛋已经结缘';
  const region=MAPS.find(m=>m.pets.includes(target))!;
  if(egg.rarity!=='normal'&&!mapUnlocked(s,region.id))return '解锁'+region.name+'后可使用 SR / SSR 蛋';
  return '';
}
export function bondEligibleEggs(s:State,target:PetId):Egg[] {return availableEggs(s).filter(e=>!bondBlockReason(s,e,target));}
export function startBondIncubation(before:State,eggId:string,target:PetId,index:number,now=Date.now()):State {
  const egg=availableEggs(before).find(e=>e.id===eggId);
  if(!egg||bondBlockReason(before,egg,target)||![0,1].includes(index)||before.incubators?.[index]||!Number.isSafeInteger(now)||now<0)return before;
  const s=clone(before),bond=s.social!.bonds.find(b=>b.species===target)!,converted=s.eggs!.find(e=>e.id===eggId)!;
  converted.bond={...bond,sourceAffinity:converted.affinity};converted.affinity=target;
  if(converted.genes)converted.genes.id=target;
  const incubated=startIncubation(s,eggId,index,now);return incubated===s?before:incubated;
}
function validSocial(s:State):boolean {
  const social=s.social;
  if(social===undefined)return !s.eggs?.some(e=>e.bond);
  if(!social||social.version!==1||!socialIdentity(social.owner)||!Array.isArray(social.bonds)||social.bonds.length>ids.length||social.bonds.some(b=>!validFriendBond(b)||b.owner===social.owner)||new Set(social.bonds.map(b=>b.species)).size!==social.bonds.length)return false;
  if(social.visitor!==undefined){const v=social.visitor;if(!v||!validFriendCard(v.card)||v.card.owner===social.owner||!Number.isInteger(v.progress)||v.progress<0||v.progress>3||!Number.isSafeInteger(v.lastPlayedAt)||v.lastPlayedAt<0||(v.progress===3&&!social.bonds.some(b=>b.species===v.card.species)))return false;}
  if(s.eggs?.some(e=>e.bond&&!social.bonds.some(b=>b.species===e.bond!.species&&b.owner===e.bond!.owner&&b.cardId===e.bond!.cardId)))return false;
  return true;
}
