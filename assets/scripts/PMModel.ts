/** Engine-independent rules. Every action returns a committed, serializable state. */
let timeProvider:()=>number=()=>Date.now();
/** Runtime installs a trusted UTC provider; unavailable time is NaN, never wall-clock fallback. */
export function setTimeProvider(provider:()=>number){timeProvider=provider;}
export const gameNow=()=>timeProvider();
export type PetRank = 'normal' | 'elite' | 'boss';
export type PetId = 'fox' | 'bud' | 'turtle' | 'cotton' | 'otter' | 'spark' | 'seal' | 'ape' | 'slug' | 'mole' | 'bird' | 'owl' | 'beetle' | 'ghost' | 'dragon' | 'lynx' | 'rhino' | 'deer' | 'capy' | 'lotus' | 'manta' | 'crane' | 'mantis' | 'cragcrab' | 'cinder' | 'voltage' | 'venom' | 'dune' | 'monk' | 'ironboar' | 'frost' | 'spirit' | 'dream' | 'shade' | 'aurora' | 'starwyrm' | 'nectar' | 'orchid' | 'axolotl' | 'lantern' | 'cobra' | 'hornbill' | 'embercamel' | 'frill' | 'wombat' | 'trilobite' | 'wolverine' | 'bison' | 'narwhal' | 'raccoon' | 'octopus' | 'moonbat' | 'silkmoth' | 'kirin';
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
  },
  capy: {"name":"绒果豚","trait":"一般 · 普通","type":"一般","rank":"normal","hp":34,"faces":[4,7,10],"enemyFaces":[2,5,8],"color":"#bca57a"},
  lotus: {"name":"荷芽蛙","trait":"草 · 普通","type":"草","rank":"normal","hp":34,"faces":[4,7,10],"enemyFaces":[2,5,8],"color":"#71bd91"},
  manta: {"name":"泡泡鳐","trait":"水 · 普通","type":"水","rank":"normal","hp":34,"faces":[4,7,10],"enemyFaces":[2,5,8],"color":"#63b9ca"},
  crane: {"name":"风铃鹤","trait":"飞行 · 普通","type":"飞行","rank":"normal","hp":34,"faces":[4,7,10],"enemyFaces":[2,5,8],"color":"#88b9d6"},
  mantis: {"name":"叶镰螳","trait":"虫 · 精英","type":"虫","rank":"elite","hp":38,"faces":[5,8,11],"enemyFaces":[3,6,9],"color":"#6da265"},
  cragcrab: {"name":"砂晶蟹","trait":"岩石 · BOSS","type":"岩石","rank":"boss","hp":42,"faces":[6,9,12],"enemyFaces":[4,7,10],"color":"#b9a37c"},
  cinder: {"name":"炭角羊","trait":"火 · 普通","type":"火","rank":"normal","hp":44,"faces":[6,10,14],"enemyFaces":[4,8,12],"color":"#df8258"},
  voltage: {"name":"电绒鼠","trait":"电 · 普通","type":"电","rank":"normal","hp":44,"faces":[6,10,14],"enemyFaces":[4,8,12],"color":"#dbbd65"},
  venom: {"name":"紫尾蝎","trait":"毒 · 普通","type":"毒","rank":"normal","hp":44,"faces":[6,10,14],"enemyFaces":[4,8,12],"color":"#a77ab7"},
  dune: {"name":"沙鳞兽","trait":"地面 · 普通","type":"地面","rank":"normal","hp":44,"faces":[6,10,14],"enemyFaces":[4,8,12],"color":"#c2a26f"},
  monk: {"name":"拳袋鼠","trait":"格斗 · 精英","type":"格斗","rank":"elite","hp":48,"faces":[7,11,15],"enemyFaces":[5,9,13],"color":"#b77c5e"},
  ironboar: {"name":"铁鼻豕","trait":"钢 · BOSS","type":"钢","rank":"boss","hp":52,"faces":[8,12,16],"enemyFaces":[6,10,14],"color":"#8d9da5"},
  frost: {"name":"雪耳兔","trait":"冰 · 普通","type":"冰","rank":"normal","hp":56,"faces":[9,13,18],"enemyFaces":[7,11,16],"color":"#93c9dc"},
  spirit: {"name":"幽泡灵","trait":"幽灵 · 普通","type":"幽灵","rank":"normal","hp":56,"faces":[9,13,18],"enemyFaces":[7,11,16],"color":"#ac99cf"},
  dream: {"name":"梦芽貘","trait":"超能力 · 普通","type":"超能力","rank":"normal","hp":56,"faces":[9,13,18],"enemyFaces":[7,11,16],"color":"#a58ec7"},
  shade: {"name":"墨羽鸦","trait":"恶 · 普通","type":"恶","rank":"normal","hp":56,"faces":[9,13,18],"enemyFaces":[7,11,16],"color":"#817395"},
  aurora: {"name":"彩翎雏","trait":"妖精 · 精英","type":"妖精","rank":"elite","hp":60,"faces":[10,14,19],"enemyFaces":[8,12,17],"color":"#dfabd0"},
  starwyrm: {"name":"星鳞幼龙","trait":"龙 · BOSS","type":"龙","rank":"boss","hp":64,"faces":[11,15,20],"enemyFaces":[9,13,18],"color":"#7897c1"},
  nectar: {"name":"蜜团睡鼠","trait":"一般 · 普通","type":"一般","rank":"normal","hp":68,"faces":[12,17,23],"enemyFaces":[10,15,21],"color":"#c7a066"},
  orchid: {"name":"兰芽壁虎","trait":"草 · 普通","type":"草","rank":"normal","hp":68,"faces":[12,17,23],"enemyFaces":[10,15,21],"color":"#79b58a"},
  axolotl: {"name":"露鳃螈","trait":"水 · 普通","type":"水","rank":"normal","hp":68,"faces":[12,17,23],"enemyFaces":[10,15,21],"color":"#69b9d5"},
  lantern: {"name":"灯豆萤","trait":"虫 · 普通","type":"虫","rank":"normal","hp":68,"faces":[12,17,23],"enemyFaces":[10,15,21],"color":"#9bba68"},
  cobra: {"name":"紫芽蛇","trait":"毒 · 精英","type":"毒","rank":"elite","hp":72,"faces":[13,18,24],"enemyFaces":[11,16,22],"color":"#a26cb6"},
  hornbill: {"name":"冠喙雏","trait":"飞行 · BOSS","type":"飞行","rank":"boss","hp":76,"faces":[14,19,25],"enemyFaces":[12,17,23],"color":"#73a9c2"},
  embercamel: {"name":"炭团驼","trait":"火 · 普通","type":"火","rank":"normal","hp":80,"faces":[16,22,29],"enemyFaces":[14,20,27],"color":"#df925e"},
  frill: {"name":"电扇蜥","trait":"电 · 普通","type":"电","rank":"normal","hp":80,"faces":[16,22,29],"enemyFaces":[14,20,27],"color":"#ddc257"},
  wombat: {"name":"砂团熊","trait":"地面 · 普通","type":"地面","rank":"normal","hp":80,"faces":[16,22,29],"enemyFaces":[14,20,27],"color":"#b49a76"},
  trilobite: {"name":"砾甲虫","trait":"岩石 · 普通","type":"岩石","rank":"normal","hp":80,"faces":[16,22,29],"enemyFaces":[14,20,27],"color":"#99a4a8"},
  wolverine: {"name":"拳爪獾","trait":"格斗 · 精英","type":"格斗","rank":"elite","hp":84,"faces":[17,23,30],"enemyFaces":[15,21,28],"color":"#ad7e62"},
  bison: {"name":"铁角犊","trait":"钢 · BOSS","type":"钢","rank":"boss","hp":88,"faces":[18,24,31],"enemyFaces":[16,22,29],"color":"#8199ac"},
  narwhal: {"name":"雪角鲸","trait":"冰 · 普通","type":"冰","rank":"normal","hp":94,"faces":[21,28,36],"enemyFaces":[19,26,34],"color":"#9acde5"},
  raccoon: {"name":"幽面狸","trait":"幽灵 · 普通","type":"幽灵","rank":"normal","hp":94,"faces":[21,28,36],"enemyFaces":[19,26,34],"color":"#a397cb"},
  octopus: {"name":"念泡章","trait":"超能力 · 普通","type":"超能力","rank":"normal","hp":94,"faces":[21,28,36],"enemyFaces":[19,26,34],"color":"#af8cc7"},
  moonbat: {"name":"暮绒蝠","trait":"恶 · 普通","type":"恶","rank":"normal","hp":94,"faces":[21,28,36],"enemyFaces":[19,26,34],"color":"#817493"},
  silkmoth: {"name":"月绒蛾","trait":"妖精 · 精英","type":"妖精","rank":"elite","hp":98,"faces":[22,29,37],"enemyFaces":[20,27,35],"color":"#d8b0cd"},
  kirin: {"name":"曜角驹","trait":"龙 · BOSS","type":"龙","rank":"boss","hp":102,"faces":[23,30,38],"enemyFaces":[21,28,36],"color":"#6d9dae"}
};
export type Phase = 'encounter' | 'battle' | 'reward' | 'recruit' | 'team' | 'won' | 'lost' | 'nest' | 'eggClaimed' | 'event';
export type EggRarity = 'normal' | 'SR' | 'SSR';
export interface Egg { id:string; rarity:EggRarity; affinity:PetId; stage:number; genes?:Genes; mapId?:number; nested?:boolean; bond?:FriendBond & {sourceAffinity:PetId} }
export interface FriendCard { version:1|2; owner:string; petUid:string; species:PetId; rarity:EggRarity; sex:Sex; id:string; nickname?:string; wishes?:PetId[]; skills?:SkillCode[]; shiny?:boolean; ornament?:string; replyTo?:string }
export interface FriendBond { species:PetId; owner:string; cardId:string; nickname?:string }
export interface MailMemory {card:FriendCard; local:Pick<Pet,'id'|'rarity'|'shiny'|'ornament'>; dice:[number,number]; stamp:number}
export interface FriendSocial { version:1; owner:string; visitor?:{card:FriendCard;progress:number;lastPlayedAt:number}; bonds:FriendBond[]; nickname?:string; wishes?:PetId[]; album?:MailMemory[] }
export interface EggHunt { limit:number; candidates:Egg[]; selected:number; bonusEggId?:string }
export const EGG_RATES={normal:80,SR:17,SSR:3};
export type Sex='female'|'male';
export interface Genes { id:PetId; rarity:EggRarity; baseHP:number; baseFaces:number[]; skills:SkillCode[]; ornament?:string }
export interface Pet { id:PetId; faces:number[]; rarity?:EggRarity; uid?:string; sex?:Sex; baseHP?:number; baseFaces?:number[]; skills?:SkillCode[]; shiny?:boolean; ornament?:string }
export interface Breeding { id:string; mother:string; father:string; startedAt:number; readyAt:number; genes:Genes }
export interface Incubation { eggId:string; startedAt:number; readyAt:number; result:EggRarity; shiny?:boolean; nestedEgg?:Egg }
export interface HatchResult { eggId:string; petId:PetId; rarity:EggRarity; duplicate:boolean; warmthGain:number; uid?:string; bonusEggId?:string }
export interface SkillState { poisonDamage?:number; attackHPRatio?:number; usedCodes?:SkillCode[]; used:boolean; attacks:number; shield:number; poison:number; nextMax:boolean; previousRoll:number; event:string; lastDamage:number; lastTaken:number; heroHealUsed?:boolean }
export type HeroId='ranger'|'keeper'|'medic';
export const HEROES:Record<HeroId,{name:string;sex:Sex;title:string;effect:string;color:string}>={
  ranger:{name:'阿岚',sex:'male',title:'寻蛋好手',effect:'带走蛋时，20% 概率额外获得一枚',color:'#dc6651'},
  keeper:{name:'小晴',sex:'female',title:'孵化专家',effect:'孵化时间 −20%',color:'#439f99'},
  medic:{name:'星遥',sex:'female',title:'贴心照护',effect:'每场首次使用生命药水，额外恢复3点',color:'#b8739e'}
};
export const HERO_IDS:HeroId[]=['ranger','keeper','medic'];
export const STARTERS:PetId[]=['fox','bud','otter'];
export interface Journey {version:1;stage:'hero'|'starter'|'done';hero:HeroId|null;starter:PetId|null;legacy:boolean}
export interface Reward { kind: 'hp' | 'attack' | 'heal' | 'potion' | 'boost' | 'attackMin' | 'attackMax'; values: number[]; title: string }
export interface State {
  surprises?:{seed:number;misses:Partial<Record<SurpriseKind,number>>;recipes:string[]};
  goldDie?:'strike'|'heal'|'shield';
  enemyVariant?:{kind:'giant'|'mirror'|'ward';revealed:boolean;shield:number;rewardEggId?:string};
  naturalSkillVersion?:1;
  runEffects?:Record<string,{giantUntil?:number;skills?:SkillCode[]}>;
  battleEvent?:{kind:BattleEventKind;uid?:string;skill?:SkillCode;eggId?:string};
  combatVersion?:1; combatVitals?:Record<string,{hpRatio:number;hpBonus:number}>;
  lastRelay?:{from:string;to:string;combat:SkillState};
  stageVersion?:2; contentVersion?: 2; version: 1; seed: number; step: number; phase: Phase; active: Pet; reserve: Pet | null;
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
  journey?:Journey;
  stamina?:{value:number;updatedAt:number}; expedition?:boolean;
  trustedTime?:{version:1;lastMs:number}; pendingStaminaAd?:boolean;
  pendingHatchAd?:{index:number;eggId:string};
  rerollVersion?:1;
}
export type Action = 'challenge' | 'reroll' | 'switch' | 'attack' | 'guard' | 'heal' | 'boost' |
  'take' | 'keep' | 'reward0' | 'invite' | 'skip' | 'replace' | 'collect' |
  'eggSearch' | 'eggSelect0' | 'eggSelect1' | 'eggSelect2' | 'eggTake' | 'eggContinue' | 'eventContinue';
export const PET_IDS=Object.keys(PETS) as PetId[];
export const LATEST_PET_IDS:PetId[]=["nectar","orchid","axolotl","lantern","cobra","hornbill","embercamel","frill","wombat","trilobite","wolverine","bison","narwhal","raccoon","octopus","moonbat","silkmoth","kirin"];
export const NEW_PET_IDS:PetId[]=["capy","lotus","manta","crane","mantis","cragcrab","cinder","voltage","venom","dune","monk","ironboar","frost","spirit","dream","shade","aurora","starwyrm",...LATEST_PET_IDS];
const ids=PET_IDS;
export interface MapConfig { id:number; name:string; stages:number; tint:string; pets:PetId[]; types:string; eggs:string; note:string }
export const MAPS:MapConfig[]=[
  {id:0,name:'草叶海岸',stages:10,tint:'#589c80',pets:['cotton','bud','otter','bird','beetle','turtle'],types:'一般 · 草 · 水 · 飞行 · 虫 · 岩石',eggs:'精英 SR 蛋 5% · BOSS SSR 蛋 1%',note:'6 个系列 · 18 种形态 · R → SR → SSR'},
  {id:1,name:'熔岩山径',stages:10,tint:'#b67e60',pets:['fox','spark','slug','mole','ape','rhino'],types:'火 · 电 · 毒 · 地面 · 格斗 · 钢',eggs:'精英 SR 蛋 10% · BOSS SSR 蛋 5%',note:'6 个系列 · 18 种形态 · 难度提升'},
  {id:2,name:'霜月雪原',stages:10,tint:'#759bb3',pets:['seal','ghost','owl','lynx','deer','dragon'],types:'冰 · 幽灵 · 超能力 · 恶 · 妖精 · 龙',eggs:'精英 SSR 蛋 1% · BOSS SSR 蛋 10%',note:'6 个系列 · 18 种形态 · 高阶挑战'},
  {id:3,name:'翠风群岛',stages:10,tint:'#559d98',pets:['capy','lotus','manta','crane','mantis','cragcrab'],types:'一般 · 草 · 水 · 飞行 · 虫 · 岩石',eggs:'精英 SSR 蛋 2% · BOSS SSR 蛋 15%',note:'6 个新系列 · 18 种形态 · 进阶冒险'},
  {id:4,name:'赤雷荒原',stages:10,tint:'#bd8660',pets:['cinder','voltage','venom','dune','monk','ironboar'],types:'火 · 电 · 毒 · 地面 · 格斗 · 钢',eggs:'精英 SSR 蛋 3% · BOSS SSR 蛋 20%',note:'6 个新系列 · 18 种形态 · 强敌试炼'},
  {id:5,name:'星渊圣域',stages:10,tint:'#8b83bc',pets:['frost','spirit','dream','shade','aurora','starwyrm'],types:'冰 · 幽灵 · 超能力 · 恶 · 妖精 · 龙',eggs:'精英 SSR 蛋 4% · BOSS SSR 蛋 25%',note:'6 个新系列 · 18 种形态 · 最终挑战'},
  {"id":6,"name":"琉璃雨林","stages":10,"tint":"#529e90","pets":["nectar","orchid","axolotl","lantern","cobra","hornbill"],"types":"一般 · 草 · 水 · 虫 · 毒 · 飞行","eggs":"精英 SSR 蛋 6% · BOSS SSR 蛋 30%","note":"6 个新系列 · 18 种形态 · 雨林深处"},
  {"id":7,"name":"赤曜沙海","stages":10,"tint":"#bf8b63","pets":["embercamel","frill","wombat","trilobite","wolverine","bison"],"types":"火 · 电 · 地面 · 岩石 · 格斗 · 钢","eggs":"精英 SSR 蛋 8% · BOSS SSR 蛋 35%","note":"6 个新系列 · 18 种形态 · 沙海试炼"},
  {"id":8,"name":"冥辉天穹","stages":10,"tint":"#8d7fb9","pets":["narwhal","raccoon","octopus","moonbat","silkmoth","kirin"],"types":"冰 · 幽灵 · 超能力 · 恶 · 妖精 · 龙","eggs":"精英 SSR 蛋 10% · BOSS SSR 蛋 40%","note":"6 个新系列 · 18 种形态 · 天穹终境"}
];
// Changed only by the dedicated test-package wrapper; normal builds retain production balance.
export const BUILD_TEST_MODE=false;
export const TOTAL_STAGES=Math.max(...MAPS.map(m=>m.stages));
export const mapFor=(s:Pick<State,'mapId'>)=>MAPS[s.mapId||0];
export const mapStageCount=(s:Pick<State,'mapId'>)=>mapFor(s).stages;
export const mapUnlocked=(s:State,id:number)=>Number.isInteger(id)&&id>=0&&id<MAPS.length&&MAPS.slice(0,id).every(m=>!!s.clearedMaps?.includes(m.id));
export const latestUnlockedMap=(s:State)=>MAPS.filter(m=>mapUnlocked(s,m.id)).slice(-1)[0].id;
export const hasActivePet=(s:State)=>!!s.pets?.some(p=>p.uid===s.active.uid);
export const rankForStage=(step:number):PetRank=>step%10===0?'boss':step%5===0?'elite':'normal';
const growthTier=(step:number)=>step<=10?(step<=3?0:step<=6?2:4):Math.floor((step-1)/3)*2;
export const encounterRarity=(step:number,mapId=0):EggRarity=>mapId===0?(step<5?'normal':step<10?'SR':'SSR'):mapId===1?(step<5?'normal':step<10?'SR':'SSR'):(step<10?'SR':'SSR');
export const enemyHealthForStage=(step:number,mapId=0)=>{
  const base=step<=10?[7,9,11,14,24,20,23,26,29,48][step-1]:Math.round((rankForStage(step)==='normal'?29/9:4.8)*step);
  return Math.round((base+mapId*(8+Math.floor(step*.6)))*(encounterRarity(step,mapId)==='SSR'?1.2:encounterRarity(step,mapId)==='SR'?1.1:1));
};
export const encounterPool=(step:number,mapId=0)=>{const pool=MAPS[mapId].pets,rank=rankForStage(step);return rank==='boss'?pool.slice(5):rank==='elite'?pool.slice(4,5):pool.slice(0,4);};
export function eggRates(s:Pick<State,'mapId'|'step'>){
  const rates=[[[95,5,0],[90,9,1]],[[90,10,0],[75,20,5]],[[84,15,1],[70,20,10]],[[80,18,2],[60,25,15]],[[75,22,3],[50,30,20]],[[70,26,4],[40,35,25]],[[65,29,6],[35,35,30]],[[60,32,8],[30,35,35]],[[55,35,10],[25,35,40]]][s.mapId||0][rankForStage(s.step)==='boss'?1:0];
  return {normal:rates[0],SR:rates[1],SSR:rates[2]};
}
// Independent per-turn rolls: heal x1/x2/x3, boost x2/x3/x4, both 50%/40%/10%.
export const ITEM_MULTIPLIERS = { heal: [1,1,1,1,1,2,2,2,2,3], boost: [2,2,2,2,2,3,3,3,3,4] };
export const healAmount = (s: State) => s.heal * s.healMultiplier;
// Gen VI+ single-type attack chart; immunities become strong resistance in this game.
// Each row lists super effective, resisted, formerly immune defending types.
export const TYPE_CHART:Record<string,[string[],string[],string[]]>={
  '一般':[[],['岩石','钢'],['幽灵']],
  '火':[['草','冰','虫','钢'],['火','水','岩石','龙'],[]],
  '水':[['火','地面','岩石'],['水','草','龙'],[]],
  '电':[['水','飞行'],['电','草','龙'],['地面']],
  '草':[['水','地面','岩石'],['火','草','毒','飞行','虫','龙','钢'],[]],
  '冰':[['草','地面','飞行','龙'],['火','水','冰','钢'],[]],
  '格斗':[['一般','冰','岩石','恶','钢'],['毒','飞行','超能力','虫','妖精'],['幽灵']],
  '毒':[['草','妖精'],['毒','地面','岩石','幽灵'],['钢']],
  '地面':[['火','电','毒','岩石','钢'],['草','虫'],['飞行']],
  '飞行':[['草','格斗','虫'],['电','岩石','钢'],[]],
  '超能力':[['格斗','毒'],['超能力','钢'],['恶']],
  '虫':[['草','超能力','恶'],['火','格斗','毒','飞行','幽灵','钢','妖精'],[]],
  '岩石':[['火','冰','飞行','虫'],['格斗','地面','钢'],[]],
  '幽灵':[['超能力','幽灵'],['恶'],['一般']],
  '龙':[['龙'],['钢'],['妖精']],
  '恶':[['超能力','幽灵'],['格斗','恶','妖精'],[]],
  '钢':[['冰','岩石','妖精'],['火','水','电','钢'],[]],
  '妖精':[['格斗','龙','恶'],['火','毒','钢'],[]]
};
export const TYPE_NAMES=Object.keys(TYPE_CHART);
export function typeMultiplier(attacking:string,defending:string):number {
  const row=TYPE_CHART[attacking];return !row?1:row[0].includes(defending)?1.5:row[1].includes(defending)?.75:row[2].includes(defending)?.5:1;
}
export const matchupMultiplier=(attacker:PetId,defender:PetId)=>typeMultiplier(PETS[attacker].type,PETS[defender].type);
export const typedDamage=(base:number,multiplier:number)=>Math.max(1,Math.round(base*multiplier));
export const attackAmount = (s: State) => typedDamage(s.attack * (s.goldDie==='strike'?1.5:1) * giantMultiplier(s,s.active.uid) * (s.doubled ? s.boostMultiplier : 1),matchupMultiplier(s.active.id,s.enemy)) + (skillReady(s,'opening')?2:0) + (skillReady(s,'heavy')&&s.skill!.attacks===2?4:0) + readySkillSpecs(s,'attack').filter(c=>SKILL_SPECS[c].effect==='damage').reduce((n,c)=>n+SKILL_SPECS[c].amount,0);
export const enemyAttackAmount=(s:State,base=s.enemyAttack)=>typedDamage(base*enemyVariantAttack(s),matchupMultiplier(s.enemy,s.active.id));
export const guardDamage = (incoming: number) => Math.max(1, Math.round(incoming / 100));
const rand = (s: State) => { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; };
const pick = <T>(s: State, a: T[]): T => a[Math.floor(rand(s) * a.length)];
export const maxHP = (s: State) => Math.round((petBaseHP(s.active) + s.hpBonus)*giantMultiplier(s,s.active.uid));
export const hp = (s: State) => Math.max(0, Math.ceil(s.hpRatio * maxHP(s) - 1e-8));
export const pet = (id: PetId): Pet => ({ id, faces: [...PETS[id].faces] });
export const enemyPet=(s:State):Pet=>({id:s.enemy,rarity:s.enemyRarity||'normal',faces:[]});
export const enemyName = (s: State) => petName(enemyPet(s));
export const enemyAttackFaces = (s: State): number[] => {
  const rank=rankForStage(s.step),tier=(rank==='normal'?(s.step<=10?(s.step<=3?0:s.step<=6?1:2):Math.floor((s.step-1)/3)):s.step<=10?0:Math.floor((s.step-(rank==='elite'?5:10))/5)*2)+(s.mapId||0)*2+(s.enemyRarity==='SSR'?2:s.enemyRarity==='SR'?1:0);
  return PETS[s.enemy].enemyFaces.map(v=>v+tier);
};
export function fresh(seed = Date.now(), owned: PetId[] = ['fox', 'turtle'], wins = 0): State {
  const s: State = {naturalSkillVersion:1,stageVersion:2,mapVersion:1,mapId:0,clearedMaps:[],contentVersion:2,version:1, seed:seed >>> 0, step:1, phase:'encounter', active:pet('fox'), reserve:pet('turtle'),
    owned:ids.filter(id=>id==='fox'||id==='turtle'||owned.indexOf(id)>=0), hpRatio:1, hpBonus:0, potions:3, boosts:2,
    healFaces:[3,5,7], healMultiplier:1, boostMultiplier:2, usedHeal:false, doubled:false, swaps:1, rerollVersion:1, enemy:'bud', enemyHP:7, enemyMax:7,
    attack:0, heal:0, enemyAttack:0, turn:0, reward:{kind:'hp',values:[3],title:'生命上限 +3'},
    previousReward:'', recruit:null, revision:0, wins, eggs:[], incubators:[null,null],warmth:0,hatchSeed:(seed^0x9e3779b9)>>>0,hatchedEggIds:[],qualities:{},preferredRarities:{},message:'先选伙伴，再开始挑战'};
  encounter(s, false); migrateIndividuals(s); return s;
}
// fresh remains the old-save/rule-fixture factory; production entry uses newJourney.
export function newJourney(seed=Date.now()):State {
  const s=fresh(seed);s.pets=[];s.owned=[];s.qualities={};s.preferredRarities={};s.active=pet('fox');s.reserve=null;s.team=['','',''];s.runRoster={};
  s.combatVitals={};s.journey={version:1,stage:'hero',hero:null,starter:null,legacy:false};return s;
}
export function prepareJourney(before:State):State {
  if(before.journey)return before;
  const untouched=before.phase==='encounter'&&before.step===1&&(before.mapId||0)===0&&before.wins===0&&!before.clearedMaps?.length&&before.hpRatio===1&&before.hpBonus===0&&before.potions===3&&before.boosts===2&&before.swaps===1&&!before.eggs?.length&&!before.warmth&&!before.breeding&&!before.social&&before.pets?.length===2&&before.active.id==='fox'&&before.reserve?.id==='turtle'&&before.pets.every(p=>['fox','turtle'].includes(p.id)&&p.uid==='legacy-'+p.id+'-normal')&&JSON.stringify(before.healFaces)==='[3,5,7]'&&JSON.stringify(before.active.faces)===JSON.stringify(PETS.fox.faces);
  if(untouched)return newJourney(before.seed);
  const s=clone(before);s.journey={version:1,stage:'hero',hero:null,starter:null,legacy:true};s.revision++;return s;
}
export function chooseHero(before:State,id:HeroId):State {
  if(before.journey?.stage!=='hero'||!HERO_IDS.includes(id))return before;
  const s=clone(before);s.journey!.hero=id;s.journey!.stage=s.journey!.legacy?'done':'starter';s.revision++;return s;
}
export function chooseStarter(before:State,id:PetId):State {
  if(before.journey?.stage!=='starter'||!STARTERS.includes(id))return before;
  const s=clone(before),p=individual(s,'starter-'+id+'-'+s.hatchSeed,naturalGenes(id,'normal'));
  s.pets=[p];s.owned=[id];s.qualities={[id]:['normal']};s.preferredRarities={};s.active=clonePet(p);s.reserve=null;s.team=[p.uid!,'',''];s.runRoster={};
  s.combatVitals={};rememberParty(s);s.journey!.starter=id;s.journey!.stage='done';s.revision++;return s;
}
export const heroFor=(s:State)=>s.journey?.hero?HEROES[s.journey.hero]:null;
export const heroHealBonus=(s:State)=>s.journey?.hero==='medic'&&s.skill&&!s.skill.heroHealUsed?3:0;
function reward(s: State, excluded: string[] = []): Reward {
  const tier = growthTier(s.step)+(s.mapId||0)*2;
  const kinds = ['hp','attack','heal','potion','boost','attackMin','attackMax'].filter(x => !excluded.includes(x) && (excluded.length>0 || x!==s.previousReward) && !(x==='potion'&&s.potions>=9) && !(x==='boost'&&s.boosts>=9));
  const k = pick(s,kinds) as Reward['kind'];
  if(k==='attackMin'||k==='attackMax')return {kind:k,values:[1],title:(k==='attackMin'?'最低攻击':'最高攻击')+' +1'};
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
function encounter(s: State, reroll: boolean, surprises=true) {
  delete s.enemyVariant;delete s.goldDie;
  delete s.skill;
  s.phase='encounter'; s.attack=s.heal=s.enemyAttack=0; s.turn=0; s.usedHeal=s.doubled=false;
  const pool=encounterPool(s.step,s.mapId||0),others=pool.filter(id=>id!==s.enemy);s.enemy=pick(s,reroll&&others.length?others:pool);s.enemyRarity=encounterRarity(s.step,s.mapId||0);
  s.enemyMax=enemyHealthForStage(s.step,s.mapId||0);s.enemyHP=s.enemyMax;
  s.reward=reward(s); s.recruit=null;
  if(!reroll) s.swaps=rankForStage(s.step)==='boss'?0:1;
  if(surprises&&s.expedition)rollEnemyVariant(s);
}
function roll(s: State) {
  s.attack=pick(s,s.active.faces); s.heal=pick(s,s.healFaces);
  s.enemyAttack=pick(s,enemyAttackFaces(s));
  s.healMultiplier=pick(s,ITEM_MULTIPLIERS.heal);s.boostMultiplier=pick(s,ITEM_MULTIPLIERS.boost);
  s.usedHeal=false; s.doubled=false; s.turn++;
  rollGoldDie(s);
  if(s.skill){const k=s.skill;
    if(k.nextMax){s.attack=Math.max(...s.active.faces);k.nextMax=false;}
    if(skillReady(s,'steady')&&s.attack===Math.min(...s.active.faces)){s.attack=[...s.active.faces].sort((a,b)=>a-b)[Math.floor(s.active.faces.length/2)];trigger(s,'steady');}
    if(skillReady(s,'repeat')&&s.attack===k.previousRoll){s.attack=Math.max(...s.active.faces);trigger(s,'repeat');}
    applySkillSpecs(s,readySkillSpecs(s,'roll'));
    k.previousRoll=s.attack;
  }
}
function next(s: State) { s.step++; encounter(s,false); s.message='新的对手出现了'; }
function afterReward(s: State) {
  s.previousReward=s.reward.kind;
  s.hpRatio=Math.min(1,s.hpRatio+Math.max(1,Math.floor(maxHP(s)*.2))/maxHP(s));
  if(rankForStage(s.step)==='elite'){beginEggHunt(s);return;}
  if(rankForStage(s.step)==='normal'&&rand(s)<.2){const options=battleEventOptions(s);if(options.length){Object.assign(s,grantBattleEvent(s,pick(s,options)));return;}}
  finishReward(s);
}
function finishReward(s:State){ next(s); }
function beginEggHunt(s: State) {
  s.phase='nest';s.eggHunt={limit:rankForStage(s.step)==='boss'?3:2,candidates:[],selected:-1};
  s.message='草丛后藏着一个巢穴，找找看！';
}
export function act(before: State, a: Action): State {
  if(before.journey&&before.journey.stage!=='done')return before;
  if(!hasActivePet(before)&&!['eggSearch','eggSelect0','eggSelect1','eggSelect2','eggTake','eggContinue'].includes(a))return before;
  if(before.phase==='encounter'&&a==='switch'&&before.reserve?.uid)return selectActive(before,before.reserve.uid);
  const s: State = JSON.parse(JSON.stringify(before)); let valid=false;
  delete s.lastRelay;
  if(s.phase==='encounter') {
    if(a==='reroll' && s.swaps>0 && rankForStage(s.step)!=='boss') { s.swaps--; encounter(s,true); s.message='换了一个对手'; valid=true; }
    if(a==='challenge'&&hp(s)>0) { s.active=preferredPet(s,s.active);s.phase='battle';revealEnemyVariant(s);s.skill=newBattleSkill(); roll(s); s.message='点数已确定，选择你的行动'; valid=true; }
  } else if(s.phase==='battle') {
    const k=s.skill;
    if(k){k.event='';k.lastDamage=0;k.lastTaken=0;}
    if(a==='heal' && !s.usedHeal && s.potions>0 && s.hpRatio<1) {
      const effects=readySkillSpecs(s,'heal');
      const heroBonus=heroHealBonus(s),amount=healAmount(s)+(skillReady(s,'healing')?2:0)+heroBonus,recovered=Math.min(amount,maxHP(s)-hp(s));
      s.potions--;s.usedHeal=true;
      if(heroBonus&&k){k.heroHealUsed=true;k.event='星遥 · 额外恢复3点';}
      if(k){if(skillReady(s,'healing'))trigger(s,'healing');if(skillReady(s,'refund')){s.potions++;trigger(s,'refund');}if(skillReady(s,'overflow')&&amount>maxHP(s)-hp(s)){k.shield+=Math.min(6,Math.floor(amount-(maxHP(s)-hp(s))));trigger(s,'overflow');}}
      s.hpRatio=Math.min(1,s.hpRatio+amount/maxHP(s));applySkillSpecs(s,effects);s.message='治疗 ×'+s.healMultiplier+' · 恢复 '+recovered+' 点生命';valid=true;
    }
    if(a==='boost' && !s.doubled && s.boosts>0) {s.boosts--;s.doubled=true;if(skillReady(s,'charged')){s.attack=Math.max(...s.active.faces);trigger(s,'charged');}applySkillSpecs(s,readySkillSpecs(s,'boost'));s.message='本回合攻击 ×'+s.boostMultiplier+' · 造成 '+attackAmount(s);valid=true;}
    if(a==='attack'||a==='guard') {
      valid=true;
      const previousEnemy=s.enemyHP;let slow=0;
      if(a==='attack'){
        const effects=readySkillSpecs(s,'attack'),raw=attackAmount(s),blocked=Math.min(s.enemyVariant?.shield||0,raw),dealt=Math.min(s.enemyHP,raw-blocked);if(s.enemyVariant)s.enemyVariant.shield-=blocked;s.enemyHP-=dealt;
        applySkillSpecs(s,effects,dealt);
        if(k){k.attacks++;
          if(skillReady(s,'opening'))trigger(s,'opening');
          if(skillReady(s,'heavy')&&k.attacks===3)trigger(s,'heavy');
          if(skillReady(s,'venom')){k.poison=3;trigger(s,'venom');}
          if(skillReady(s,'slow')){slow=2;trigger(s,'slow');}
          if(skillReady(s,'leech')){s.hpRatio=Math.min(1,s.hpRatio+Math.min(Math.ceil(dealt*.2),Math.ceil(maxHP(s)*.25))/maxHP(s));trigger(s,'leech');}
        }
      }else if(k){if(skillReady(s,'focus')){k.nextMax=true;trigger(s,'focus');}if(skillReady(s,'barrier')){k.shield+=6;trigger(s,'barrier');}applySkillSpecs(s,readySkillSpecs(s,'guard'));}
      if(k&&k.poison>0&&s.enemyHP>0){const poison=k.poisonDamage||2;s.enemyHP=Math.max(0,s.enemyHP-poison);k.poison--;k.event=k.event||'毒素 −'+poison;}
      if(k){k.lastDamage=previousEnemy-s.enemyHP;k.attackHPRatio=s.hpRatio;}
      if(s.enemyHP===0) {
        rewardEnemyVariant(s);
        s.warmth=Math.min(9999,(s.warmth||0)+(rankForStage(s.step)==='boss'?3:rankForStage(s.step)==='elite'?2:1));
        if(rankForStage(s.step)==='boss'){if(s.step===mapStageCount(s))s.wins++;beginEggHunt(s);}
        else {s.phase='reward';s.message='战斗胜利！领取战利品';}
      } else {
        const incoming=enemyAttackAmount(s);
        let damage=a==='guard'?guardDamage(incoming):Math.max(1,incoming-slow);
        if(k){if(skillReady(s,'armor')){damage=Math.max(1,damage-2);trigger(s,'armor');}
          const effects=readySkillSpecs(s,'hit',damage,a==='guard').filter(c=>SKILL_SPECS[c].effect!=='survive');applySkillSpecs(s,effects);
          damage=Math.max(1,damage-effects.filter(c=>SKILL_SPECS[c].effect==='reduce').reduce((n,c)=>n+SKILL_SPECS[c].amount,0));
          if(skillReady(s,'evade')){damage=0;trigger(s,'evade');}if(effects.some(c=>SKILL_SPECS[c].effect==='evade'))damage=0;
          const blocked=Math.min(k.shield,damage);damage-=blocked;k.shield-=blocked;
          const saves=readySkillSpecs(s,'hit',damage,a==='guard').filter(c=>SKILL_SPECS[c].effect==='survive');if(saves.length){damage=Math.max(0,hp(s)-1);applySkillSpecs(s,saves);}
          k.lastTaken=damage;
        }
        s.hpRatio=Math.max(0,s.hpRatio-damage/maxHP(s));
        if(skillReady(s,'emergency')&&s.hpRatio>1e-8&&s.hpRatio<=.3){s.hpRatio=Math.min(1,s.hpRatio+Math.ceil(maxHP(s)*.25)/maxHP(s));trigger(s,'emergency');}
        s.message=(a==='guard'?'挡住了攻击，只受 ':'对手反击，受到 ')+damage+' 点伤害';
        if(s.hpRatio<=1e-8) {s.hpRatio=0;if(!relayAfterDefeat(s)){s.phase='lost';s.message='所有伙伴已阵亡，回营地休息吧';}}
        else roll(s);
      }
    }
  } else if(s.phase==='event'&&a==='eventContinue') {
    delete s.battleEvent;next(s);valid=true;
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
      if(!s.eggs.some(e=>e.id===chosen.id)){
        s.eggs.push({...chosen});
        if(s.journey?.hero==='ranger'&&rand(s)<.2){
          const rates=eggRates(s),value=rand(s)*100,rarity:EggRarity=value<rates.normal?'normal':value<rates.normal+rates.SR?'SR':'SSR',affinity=pick(s,mapFor(s).pets);
          const bonus:Egg={id:chosen.id+'-bonus-'+s.seed,rarity,affinity,stage:s.step,mapId:s.mapId||0};s.eggs.push(bonus);hunt.bonusEggId=bonus.id;
        }
      }
      s.phase='eggClaimed';s.message=hunt.bonusEggId?'阿岚又找到一枚！两枚蛋已放入蛋袋':'宠物蛋已存入蛋袋';valid=true;
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
        if(r.kind==='hp'||r.kind==='attackMin'||r.kind==='attackMax')applyTeamReward(s,r);
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
  rememberParty(s);
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
    if(s.stamina&&(!Number.isInteger(s.stamina.value)||s.stamina.value<0||s.stamina.value>30||!finite(s.stamina.updatedAt)||s.stamina.updatedAt<0))return null;
    if(s.expedition!==undefined&&typeof s.expedition!=='boolean')return null;
    if(s.trustedTime&&(s.trustedTime.version!==1||!Number.isSafeInteger(s.trustedTime.lastMs)||s.trustedTime.lastMs<0))return null;
    if(s.pendingStaminaAd!==undefined&&typeof s.pendingStaminaAd!=='boolean')return null;
    if(s.pendingHatchAd&&(![0,1].includes(s.pendingHatchAd.index)||typeof s.pendingHatchAd.eggId!=='string'||!s.pendingHatchAd.eggId))return null;
    const legacyMaps=s.mapVersion===undefined;
    if(s.stageVersion!==undefined&&s.stageVersion!==2)return null;
    if(legacyMaps){s.mapId=s.step>10?1:0;s.clearedMaps=s.wins>0?[0,1]:s.step>10?[0]:[];if(s.phase==='won'&&!s.clearedMaps.includes(s.mapId))s.clearedMaps.push(s.mapId);s.mapVersion=1;s.enemyRarity='normal';}
    if(s.mapVersion!==1||!Number.isInteger(s.mapId)||s.mapId!<0||s.mapId!>=MAPS.length||!Array.isArray(s.clearedMaps)||s.clearedMaps.some((id,i,a)=>!Number.isInteger(id)||id<0||id>=MAPS.length||a.indexOf(id)!==i)||!mapUnlocked(s,s.mapId!)||!RARITIES.includes(s.enemyRarity!))return null;
    if(s.roster!==undefined&&(!s.roster||typeof s.roster!=='object'||Array.isArray(s.roster)||Object.keys(s.roster).some(id=>!ids.includes(id as PetId)||!validPet(s.roster![id])||s.roster![id].id!==id)))return null;
    if(!['encounter','battle','reward','recruit','team','won','lost','nest','eggClaimed','event'].includes(s.phase))return null;
    if(![s.seed,s.step,s.hpRatio,s.hpBonus,s.potions,s.boosts,s.swaps,s.enemyHP,s.enemyMax,s.revision,s.wins,s.attack,s.heal,s.enemyAttack,s.turn].every(finite))return null;
    const savedStageLimit=s.stageVersion===2?mapStageCount(s):Math.max(10,((s.mapId||0)+1)*10);
    if(s.step<1||s.step>savedStageLimit||!Number.isInteger(s.step)||s.hpRatio<0||s.hpRatio>1||s.hpBonus<0||s.hpBonus>450)return null;
    if(s.potions<0||s.potions>9||s.boosts<0||s.boosts>9||s.swaps<0||s.swaps>2)return null;
    if(!ids.includes(s.enemy)||!Array.isArray(s.owned)||!faces(s.healFaces))return null;
    // Recover the early preview's Set-serialization anomaly without dropping its run.
    if(s.owned.some(x=>typeof x==='object'&&x!==null))s.owned=ids.filter(id=>id==='fox'||id==='turtle'||s.owned.indexOf(id)>=0||s.active.id===id||s.reserve?.id===id||(s.phase==='team'&&s.recruit===id));
    if(!s.owned.every(x=>ids.includes(x)))return null;
    if(s.partySlots!==undefined&&(!Array.isArray(s.partySlots)||s.partySlots.length!==3||s.partySlots.some((id,i)=>!ids.includes(id)||s.partySlots!.indexOf(id)!==i)||!s.partySlots.includes(s.active.id)||(s.reserve&&!s.partySlots.includes(s.reserve.id))))return null;
    if(!s.reward||!['hp','attack','heal','potion','boost','attackMin','attackMax'].includes(s.reward.kind)||!faces(s.reward.values)||typeof s.reward.title!=='string')return null;
    if(['recruit','team'].includes(s.phase)&&(!s.recruit||!ids.includes(s.recruit)))return null;
    if(s.enemyMax<=0||s.enemyHP<0||s.enemyHP>s.enemyMax||typeof s.usedHeal!=='boolean'||typeof s.doubled!=='boolean')return null;
    // Preserve effects already committed in older saves; new turns roll multipliers.
    if(s.healMultiplier===undefined)s.healMultiplier=1;
    if(s.boostMultiplier===undefined)s.boostMultiplier=2;
    // Preserve a previous version's already-rolled x1; new turns use the current pool.
    if(!ITEM_MULTIPLIERS.heal.includes(s.healMultiplier)||![1,2,3,4].includes(s.boostMultiplier))return null;
    const validEgg=(e:any)=>e&&typeof e.id==='string'&&['normal','SR','SSR'].includes(e.rarity)&&ids.includes(e.affinity)&&(e.bond===undefined||validFriendBond(e.bond)&&ids.includes(e.bond.sourceAffinity)&&e.bond.species===e.affinity)&&((e.stage===0&&validGenes(e.genes)&&e.genes.id===e.affinity&&e.genes.rarity===e.rarity)||(Number.isInteger(e.stage)&&e.stage>=5&&e.stage<=90&&e.stage%5===0&&(e.mapId===undefined?e.stage<=20:Number.isInteger(e.mapId)&&e.mapId>=0&&e.mapId<MAPS.length&&e.stage<=Math.max(MAPS[e.mapId].stages,(e.mapId+1)*10)&&MAPS[e.mapId].pets.includes(e.bond?.sourceAffinity||e.affinity))));
    if(s.eggs===undefined)s.eggs=[];
    if(!Array.isArray(s.eggs)||!s.eggs.every(validEgg)||s.eggs.some((e,i)=>s.eggs!.findIndex(v=>v.id===e.id)!==i))return null;
    if(s.phase==='nest'||s.phase==='eggClaimed'){
      const h=s.eggHunt;if(s.step%5!==0||!h||h.limit!==(rankForStage(s.step)==='boss'?3:2)||!Array.isArray(h.candidates)||h.candidates.length>h.limit||!h.candidates.every(e=>validEgg(e)&&e.stage===s.step&&(e.mapId===undefined||e.mapId===s.mapId))||!Number.isInteger(h.selected)||h.selected<(h.candidates.length?0:-1)||h.selected>=h.candidates.length)return null;
      if(h.candidates.some((e,i)=>h.candidates.findIndex(v=>v.id===e.id)!==i))return null;
      if(s.phase==='eggClaimed'&&(!h.candidates[h.selected]||!s.eggs.some(e=>e.id===h.candidates[h.selected].id)))return null;
    }else delete s.eggHunt;
    if(!validHatching(s)||!validSocial(s))return null;
    if(s.eggHunt?.bonusEggId&&(s.phase!=='eggClaimed'||!s.eggs.some(e=>e.id===s.eggHunt!.bonusEggId)||s.eggHunt.candidates.some(e=>e.id===s.eggHunt!.bonusEggId)))return null;
    if(s.contentVersion!==2){if(s.phase==='encounter'){const swaps=s.swaps;encounter(s,false);s.swaps=rankForStage(s.step)==='boss'?0:swaps;}s.contentVersion=2;}
    if(s.individualVersion===1&&!validIndividuals(s))return null;
    migrateIndividuals(s);
    if(s.journey){const j=s.journey;
      if(j.version!==1||!['hero','starter','done'].includes(j.stage)||typeof j.legacy!=='boolean'||(j.hero!==null&&!HERO_IDS.includes(j.hero))||(j.starter!==null&&!STARTERS.includes(j.starter)))return null;
      if(j.stage==='hero'?(j.hero!==null||j.starter!==null):!j.hero)return null;
      if(j.stage==='starter'&&(j.legacy||j.starter!==null||s.pets!.length!==0))return null;
      if(j.stage==='done'&&!j.legacy&&!j.starter)return null;
      if(j.stage!=='done'&&!j.legacy&&(s.pets!.length!==0||s.phase!=='encounter'||s.step!==1))return null;
    }
    if(legacyMaps&&s.phase==='encounter'){const swaps=s.swaps;encounter(s,false);s.swaps=rankForStage(s.step)==='boss'?0:swaps;}
    if(s.rerollVersion!==1){s.swaps=rankForStage(s.step)==='boss'?0:Math.max(0,s.swaps-1);s.rerollVersion=1;}
    if(s.swaps>1||!Number.isInteger(s.swaps))return null;
    if(s.phase==='recruit'||s.phase==='team'){s.recruit=null;next(s);}
    // Shorten old long expeditions without discarding collection, eggs or timed jobs.
    if(s.stageVersion!==2){
      if(s.step>10){
        s.step=10;
        if(s.phase==='nest'||s.phase==='eggClaimed'){
          for(const e of s.eggHunt!.candidates){e.stage=10;const stored=s.eggs!.find(v=>v.id===e.id);if(stored)stored.stage=10;}
        }else if(s.phase!=='won'&&s.phase!=='lost'){encounter(s,false);s.message='本地图已调整为10层，挑战最终首领';}
      }
      s.stageVersion=2;
    }
    // Only update the gifted starter; inherited skills and existing hatched individuals stay intact.
    const starter=s.pets?.find(p=>p.uid?.startsWith('starter-otter-')&&p.skills?.length===1&&p.skills[0]==='healing');
    if(starter){for(const p of [starter,s.active,s.reserve,...Object.values(s.runRoster||{})])if(p?.uid===starter.uid)p.skills=['armor'];
      if(s.active.uid===starter.uid&&s.skill?.usedCodes)s.skill.usedCodes=s.skill.usedCodes.map(c=>c==='healing'?'armor':c);
    }
    if(!restoreCombat(s)||!validRunEffects(s)||!validSurprises(s))return null;
    migrateNaturalSkills(s);
    if(s.breeding){s.team=homeParty(s);if(isBreedingPet(s,s.reserve?.uid||''))s.reserve=null;}
    delete s.lastRelay;
    return s;
  } catch {return null;}
}
export function equipReserve(before:State,key:string):State { return assignPartySlot(before,key,1); }
export function grantRerollAd(before:State,completed:boolean):State {
  if(!completed||before.phase!=='encounter'||before.swaps!==0||rankForStage(before.step)==='boss'||!hasActivePet(before))return before;
  return act({...before,swaps:1},'reroll');
}
export const canManageParty=(s:State)=>s.phase!=='battle'&&(!s.journey||s.journey.stage==='done');
export function partyChoices(s:State):string[]{return homeParty(s);}
export function isBreedingPet(s:State,key:string):boolean{return !!s.breeding&&[s.breeding.mother,s.breeding.father].includes(key);}
export function homeParty(s:State):string[]{
  const slots=(s.team||[]).slice(0,3);while(slots.length<3)slots.push('');
  const place=(key:string,index:number)=>{const old=slots.indexOf(key);if(old>=0)slots[old]=slots[index];slots[index]=key;};
  place(s.active.uid||'',0);if(s.reserve?.uid)place(s.reserve.uid,1);
  return slots.map(key=>isBreedingPet(s,key)?'':key);
}
function rememberParty(s:State){s.runRoster=s.runRoster||{};if(s.active.uid)s.runRoster[s.active.uid]=clonePet(s.active);if(s.reserve?.uid)s.runRoster[s.reserve.uid]=clonePet(s.reserve);
  s.combatVersion=1;s.combatVitals=s.combatVitals||{};if(s.active.uid)s.combatVitals[s.active.uid]={hpRatio:s.hpRatio,hpBonus:s.hpBonus};
}
function runPet(s:State,key:string):Pet {return clonePet(s.runRoster?.[key]||s.pets!.find(p=>p.uid===key)!);}
export function petCombat(s:State,key:string){
  const p=key===s.active.uid?s.active:s.runRoster?.[key]||petEntry(s,key);
  const v=key===s.active.uid?{hpRatio:s.hpRatio,hpBonus:s.hpBonus}:s.combatVitals?.[key]||{hpRatio:1,hpBonus:0};
  const max=Math.round((petBaseHP(p)+v.hpBonus)*giantMultiplier(s,key));
  return {pet:p,ratio:v.hpRatio,bonus:v.hpBonus,max,hp:Math.max(0,Math.ceil(v.hpRatio*max-1e-8))};
}
function loadActiveVitals(s:State){const v=s.combatVitals?.[s.active.uid!]||{hpRatio:1,hpBonus:0};s.hpRatio=v.hpRatio;s.hpBonus=v.hpBonus;}
function applyTeamReward(s:State,r:Reward){
  rememberParty(s);
  for(const uid of new Set(homeParty(s).filter(Boolean))){
    const stats=petCombat(s,uid),p=runPet(s,uid);
    if(r.kind==='hp'){
      const bonus=Math.min(450,stats.bonus+r.values[0]);
      s.combatVitals![uid]={hpBonus:bonus,hpRatio:stats.ratio*stats.max/Math.round((petBaseHP(p)+bonus)*giantMultiplier(s,uid))};
    }else{
      const edge=r.kind==='attackMin'?Math.min(...p.faces):Math.max(...p.faces);
      p.faces=p.faces.map(v=>v===edge?Math.min(100,v+r.values[0]):v);
    }
    s.runRoster![uid]=p;
  }
  s.active=runPet(s,s.active.uid!);if(s.reserve?.uid)s.reserve=runPet(s,s.reserve.uid);
  loadActiveVitals(s);
}
function newBattleSkill():SkillState{return {usedCodes:[],used:false,attacks:0,shield:0,poison:0,nextMax:false,previousRoll:0,event:'',lastDamage:0,lastTaken:0,heroHealUsed:false};}
function relayAfterDefeat(s:State):boolean {
  rememberParty(s);
  const slots=homeParty(s),index=slots.findIndex((uid,i)=>i>0&&!!uid&&petCombat(s,uid).hp>0&&!(s.breeding&&[s.breeding.mother,s.breeding.father].includes(uid)));
  if(index<0)return false;
  const from=s.active.uid!,combat=JSON.parse(JSON.stringify(s.skill||newBattleSkill()));
  [slots[0],slots[index]]=[slots[index],slots[0]];
  s.team=slots;s.active=runPet(s,slots[0]);s.reserve=slots[1]?runPet(s,slots[1]):null;loadActiveVitals(s);
  s.skill=newBattleSkill();s.skill.poison=combat.poison;s.skill.poisonDamage=combat.poisonDamage;s.skill.heroHealUsed=combat.heroHealUsed;
  s.lastRelay={from,to:s.active.uid!,combat};roll(s);
  s.message=petName(s.active)+'接替出战';return true;
}
function restoreCombat(s:State):boolean {
  if(s.combatVersion!==undefined&&s.combatVersion!==1)return false;
  if(s.combatVitals!==undefined){
    if(!s.combatVitals||typeof s.combatVitals!=='object'||Array.isArray(s.combatVitals))return false;
    for(const [uid,v] of Object.entries(s.combatVitals)){
      if(!s.pets?.some(p=>p.uid===uid)||!v||!Number.isFinite(v.hpRatio)||v.hpRatio<0||v.hpRatio>1||!Number.isInteger(v.hpBonus)||v.hpBonus<0||v.hpBonus>450)return false;
    }
  }
  // Old shared growth belongs to the active pet only. Collection/base genes are unchanged.
  rememberParty(s);return true;
}
export function selectActive(before:State,key:string):State {
  if(before.phase!=='encounter')return before;return assignPartySlot(before,key,0);
}
export function assignPartySlot(before:State,key:string,index:number):State {
  if(!canManageParty(before)||!before.pets?.some(p=>p.uid===key)||isBreedingPet(before,key)||![0,1,2].includes(index))return before;
  const slots=homeParty(before);if(slots[index]===key)return before;
  if(index===0&&petCombat(before,key).hp===0)return before;
  const s=clone(before);rememberParty(s);const old=slots.indexOf(key);if(old>=0)slots[old]=slots[index];slots[index]=key;
  if(!slots[0]){const replacement=slots.findIndex((value,i)=>i!==index&&!!value);if(replacement<0)return before;slots[0]=slots[replacement];slots[replacement]='';}
  if(before.breeding&&[before.breeding.mother,before.breeding.father].includes(slots[0]))return before;
  if(petCombat(before,slots[0]).hp===0)return before;
  s.team=slots;s.active=runPet(s,slots[0]);s.reserve=slots[1]?runPet(s,slots[1]):null;delete s.partySlots;
  loadActiveVitals(s);delete s.lastRelay;
  s.revision++;return s;
}
export function continueAdventure(before:State):State {
  if(before.phase!=='won')return before;
  return startMap(before,(before.mapId||0)+1);
}
export function restartRun(before:State,seed=Date.now()):State {
  if(!hasActivePet(before))return before;
  const s=fresh(seed,before.owned,before.wins);
  s.owned=before.owned.slice();
  for(const key of ['eggs','incubators','warmth','hatchSeed','hatchedEggIds','qualities','preferredRarities','pendingHatch','pets','team','individualVersion','breeding','breedingSerial','mapId','mapVersion','clearedMaps','social','journey','stamina','expedition','trustedTime','pendingStaminaAd','pendingHatchAd','surprises'])if(before[key]!==undefined)s[key]=JSON.parse(JSON.stringify(before[key]));
  s.active=clonePet(s.pets!.find(p=>p.uid===before.active.uid)!);s.reserve=before.reserve?clonePet(s.pets!.find(p=>p.uid===before.reserve!.uid)!):null;
  s.team=homeParty(before);s.runRoster={};s.combatVitals={};s.hpRatio=1;s.hpBonus=0;rememberParty(s);encounter(s,false,false);return s;
}
export function startMap(before:State,mapId:number,seed=Date.now()):State {
  if(!mapUnlocked(before,mapId)||!hasActivePet(before))return before;
  const s=restartRun(before,seed);s.mapId=mapId;encounter(s,false,false);s.revision=before.revision+1;return s;
}

export const STAMINA_MAX=30,STAMINA_INTERVAL=120000,EXPEDITION_COST=BUILD_TEST_MODE?1:5,STAMINA_AD_REWARD=10;
export function syncStamina(before:State,now=gameNow()):State {
  if(!Number.isFinite(now)||now<0)return before;
  if(!before.stamina){const s=clone(before);s.stamina={value:STAMINA_MAX,updatedAt:now};s.expedition=false;return s;}
  const energy=before.stamina;if(energy.value>=STAMINA_MAX||now<=energy.updatedAt)return before;
  const gained=Math.floor((now-energy.updatedAt)/STAMINA_INTERVAL);if(gained<1)return before;
  const s=clone(before),value=Math.min(STAMINA_MAX,energy.value+gained);
  s.stamina={value,updatedAt:value===STAMINA_MAX?now:energy.updatedAt+gained*STAMINA_INTERVAL};return s;
}
export const staminaRemaining=(s:State,now=gameNow())=>!s.stamina||s.stamina.value>=STAMINA_MAX?0:Math.max(0,s.stamina.updatedAt+STAMINA_INTERVAL-now);
export const staminaFullRemaining=(s:State,now=gameNow())=>!s.stamina||s.stamina.value>=STAMINA_MAX?0:!Number.isFinite(now)?Infinity:Math.max(0,s.stamina.updatedAt+(STAMINA_MAX-s.stamina.value)*STAMINA_INTERVAL-now);
export function grantAdStamina(before:State,completed:boolean,now=gameNow()):State {
  if(!Number.isFinite(now))return before;
  const current=syncStamina(before,now);if(!completed||current.stamina!.value>=STAMINA_MAX)return current;
  const s=clone(current);s.stamina!.value=Math.min(STAMINA_MAX,s.stamina!.value+STAMINA_AD_REWARD);if(s.stamina!.value===STAMINA_MAX)s.stamina!.updatedAt=now;s.revision++;return s;
}
export function enterExpedition(before:State,mapId:number,now=gameNow()):State {
  if(!Number.isSafeInteger(now)||now<0)return before;
  if(!mapUnlocked(before,mapId)||!hasActivePet(before)||(before.journey&&before.journey.stage!=='done')||before.expedition&&!['won','lost'].includes(before.phase))return before;
  const current=syncStamina(before,now);if(current.stamina!.value<EXPEDITION_COST)return current;
  const s=startMap(current,mapId,now);if(s===current)return before;
  if(s.stamina!.value===STAMINA_MAX)s.stamina!.updatedAt=now;
  s.stamina!.value-=EXPEDITION_COST;s.expedition=true;rollEnemyVariant(s);return s;
}
export function retreatExpedition(before:State,now=gameNow()):State {
  const current=syncStamina(before,now);if(!current.expedition)return current;
  const s=restartRun(current,Number.isFinite(now)?now:current.seed);s.expedition=false;s.revision=current.revision+1;return s;
}

export const RARITIES:EggRarity[]=['normal','SR','SSR'];
export const rarityName=(r:EggRarity='normal')=>r==='normal'?'R':r;
export const qualityHP=(r:EggRarity='normal')=>r==='SSR'?4:r==='SR'?2:0;
export const HATCH_DURATION=BUILD_TEST_MODE?3000:30*60*1000, HATCH_ACCELERATION=5*60*1000;
export const hatchDuration=(s:State)=>s.journey?.hero==='keeper'?HATCH_DURATION*.8:HATCH_DURATION;
export const HATCH_RATES={normal:[90,9,1],SR:[0,95,5],SSR:[0,0,100]};
export function unlockedRarities(s:State,id:PetId):EggRarity[]{return s.qualities?.[id]?.slice()||(s.owned.includes(id)?['normal']:[]);}
export function preferredRarity(s:State,id:PetId):EggRarity {const unlocked=unlockedRarities(s,id);return s.preferredRarities?.[id]||RARITIES.filter(r=>unlocked.includes(r)).pop()||'normal';}
function preferredPet(s:State,p:Pet):Pet {return p;}
const clone=(s:State):State=>JSON.parse(JSON.stringify(s));
const clonePet=(p:Pet):Pet=>JSON.parse(JSON.stringify(p));
// Forms are separate individuals and can no longer be toggled in place.
export function setPetRarity(before:State,id:PetId,rarity:EggRarity):State {return before;}
export const availableEggs=(s:State)=>(s.eggs||[]).filter(e=>!(s.hatchedEggIds||[]).includes(e.id)&&!(s.incubators||[]).some(slot=>slot?.eggId===e.id));
export const hatchRemaining=(slot:Incubation,now=gameNow())=>Number.isFinite(now)?Math.max(0,slot.readyAt-now):Infinity;
export function startIncubation(before:State,eggId:string,index:number,now=gameNow()):State {
  if(![0,1].includes(index)||before.incubators?.[index]||!Number.isFinite(now)||now<0)return before;
  const egg=availableEggs(before).find(e=>e.id===eggId);if(!egg)return before;
  const s=clone(before);s.incubators=s.incubators||[null,null];
  s.hatchSeed=(Math.imul(s.hatchSeed===undefined?(s.seed^0x9e3779b9)>>>0:s.hatchSeed,1664525)+1013904223)>>>0;
  const roll=s.hatchSeed/4294967296*100,weights=HATCH_RATES[egg.rarity];
  const result:EggRarity=egg.genes||egg.bond?egg.rarity:roll<weights[0]?'normal':roll<weights[0]+weights[1]?'SR':'SSR';
  const shiny=SHINY_PETS.includes(egg.affinity)&&surpriseChance(s,'shiny');
  const nestedEgg=!egg.nested&&surpriseChance(s,'nested')?surpriseEgg(s,'nested-'+egg.id,egg.mapId??MAPS.find(m=>m.pets.includes(egg.affinity))!.id,true):undefined;
  s.incubators[index]={eggId,startedAt:now,readyAt:now+hatchDuration(s),result,shiny,nestedEgg};s.revision++;return s;
}
export function accelerateHatch(before:State,index:number,now=gameNow()):State {
  const slot=before.incubators?.[index];if(!slot||!Number.isFinite(now)||now<slot.startedAt||hatchRemaining(slot,now)===0||(before.warmth||0)<1)return before;
  const s=clone(before);s.warmth!--;s.incubators![index]!.readyAt=Math.max(now,slot.readyAt-HATCH_ACCELERATION);s.revision++;return s;
}
export function grantHatchAd(before:State,index:number,eggId:string,completed:boolean,now=gameNow()):State {
  const slot=before.incubators?.[index];
  if(!completed||!slot||slot.eggId!==eggId||!Number.isSafeInteger(now)||now<slot.startedAt||hatchRemaining(slot,now)===0)return before;
  const s=clone(before);s.incubators![index]!.readyAt=Math.max(now,slot.readyAt-30*60000);s.revision++;return s;
}
export function claimHatch(before:State,index:number,now=gameNow()):State {
  const slot=before.incubators?.[index];if(!slot||before.pendingHatch||!Number.isFinite(now)||now<slot.startedAt||hatchRemaining(slot,now)>0)return before;
  const egg=before.eggs?.find(e=>e.id===slot.eggId);if(!egg||(before.hatchedEggIds||[]).includes(egg.id))return before;
  const s=clone(before),id=egg.affinity,genes=egg.genes||naturalGenes(id,slot.result);
  const child=individual(s,'hatch-'+egg.id,genes);if(slot.shiny)child.shiny=true;s.pets!.push(child);
  if(slot.nestedEgg&&!s.eggs!.some(e=>e.id===slot.nestedEgg!.id))s.eggs!.push(JSON.parse(JSON.stringify(slot.nestedEgg)));
  if(!hasActivePet(s)){s.active=clonePet(child);s.reserve=null;s.team=[child.uid!,'',''];s.runRoster={};s.hpRatio=1;s.phase='encounter';encounter(s,false);}
  if(!s.owned.includes(id))s.owned.push(id);
  s.qualities=s.qualities||{};s.qualities[id]=Array.from(new Set([...(s.qualities[id]||[]),slot.result]));
  s.hatchedEggIds=[...(s.hatchedEggIds||[]),egg.id];s.incubators![index]=null;
  s.pendingHatch={eggId:egg.id,petId:id,rarity:slot.result,duplicate:false,warmthGain:0,uid:child.uid,bonusEggId:slot.nestedEgg?.id};s.revision++;return s;
}
export function acknowledgeHatch(before:State):State {if(!before.pendingHatch)return before;const s=clone(before);delete s.pendingHatch;s.revision++;return s;}

const LEGACY_SKILLS={
  opening:['抢先一击','首次攻击额外造成 2 点伤害。'], armor:['硬壳','首次受击减少 2 点伤害，至少受到 1 点。'],
  healing:['草木祝福','首次使用生命药水额外恢复 2 点生命。'], steady:['稳定发挥','首次掷出最低攻击点数，自动变为中间点数。'],
  repeat:['连锁电流','首次连续两回合攻击点数相同，后一次变为最高点数。'], charged:['力量共鸣','首次使用力量药水，攻击点数变为最高，再计算药水倍率。'],
  focus:['蓄势反击','首次防御后，下回合攻击必定为最高点数。'], barrier:['坚垒','首次防御获得 6 点护盾，可跨回合抵消伤害。'],
  overflow:['泡泡护盾','首次生命药水产生溢出治疗时，溢出部分变为护盾，最多 6 点。'], refund:['药水回响','首次生命药水不消耗库存；每回合仍只能使用一次。'],
  emergency:['生命绽放','首次受击后存活且生命不超过 30%，自动恢复最大生命的 25%。'],
  venom:['毒素印记','首次攻击施毒，本次及随后两次行动结束时各造成 2 点伤害。'],
  heavy:['三连重击','第三次攻击额外造成 4 点伤害。'], slow:['霜羽压制','首次攻击令本次反击伤害减少 2，至少受到 1 点。'],
  evade:['幻影守护','首次敌方反击完全免伤。'],leech:['生命汲取','首次攻击恢复其实际直接伤害的 20%（向上取整），不超过最大生命的 25%。'],
  tm_healStrike:['回春击',''],tm_guardHeal:['休整防御',''],
  tm_boostShield:['强化屏障',''],tm_healPower:['治愈蓄能',''],
  tm_finisher:['追击招式',''],tm_lastStand:['不屈招式',''],
  tm_firstShield:['开场护盾',''],tm_combo:['连击恢复',''],
  res_bloom:['共鸣·花盾',''],res_venom:['共鸣·蚀魂',''],res_drive:['共鸣·蓄壁',''],
} as const;
export type SkillCode=string;
export const SKILLS:Record<SkillCode,readonly [string,string]>={...LEGACY_SKILLS};
const OLD_PET_SKILLS:Record<PetId,[SkillCode,SkillCode,SkillCode]>={
  nectar:["healing", "refund", "emergency"],
  orchid:["healing", "overflow", "emergency"],
  axolotl:["armor", "overflow", "refund"],
  lantern:["opening", "steady", "charged"],
  cobra:["opening", "venom", "leech"],
  hornbill:["opening", "slow", "evade"],
  embercamel:["opening", "heavy", "charged"],
  frill:["opening", "repeat", "charged"],
  wombat:["armor", "focus", "barrier"],
  trilobite:["armor", "barrier", "evade"],
  wolverine:["opening", "heavy", "charged"],
  bison:["armor", "focus", "barrier"],
  narwhal:["armor", "slow", "focus"],
  raccoon:["opening", "venom", "leech"],
  octopus:["opening", "steady", "charged"],
  moonbat:["opening", "steady", "leech"],
  silkmoth:["healing", "refund", "emergency"],
  kirin:["opening", "heavy", "charged"],
  capy:["healing","refund","emergency"],
  lotus:["healing","overflow","emergency"],
  manta:["armor","overflow","refund"],
  crane:["opening","slow","evade"],
  mantis:["opening","heavy","charged"],
  cragcrab:["armor","focus","barrier"],
  cinder:["opening","heavy","charged"],
  voltage:["opening","repeat","charged"],
  venom:["opening","venom","leech"],
  dune:["armor","focus","barrier"],
  monk:["opening","heavy","charged"],
  ironboar:["armor","barrier","evade"],
  frost:["armor","slow","focus"],
  spirit:["opening","venom","leech"],
  dream:["opening","steady","charged"],
  shade:["opening","steady","leech"],
  aurora:["healing","refund","emergency"],
  starwyrm:["opening","heavy","charged"],
  fox:['opening','steady','charged'],bud:['healing','refund','emergency'],turtle:['armor','focus','barrier'],
  cotton:['opening','steady','emergency'],otter:['armor','overflow','refund'],spark:['opening','repeat','charged'],
  seal:['armor','slow','focus'],ape:['opening','heavy','charged'],slug:['opening','venom','leech'],mole:['armor','focus','barrier'],
  bird:['opening','slow','evade'],owl:['opening','steady','charged'],beetle:['armor','venom','refund'],ghost:['opening','venom','leech'],
  dragon:['opening','heavy','charged'],lynx:['opening','steady','leech'],rhino:['armor','barrier','evade'],deer:['healing','refund','emergency']
};
type SkillMoment='attack'|'heal'|'boost'|'guard'|'hit'|'roll';
type SkillGate='any'|'third'|'low'|'full'|'enemyHalf'|'minimum'|'maximum'|'repeat'|'first'|'boosted'|'guarded'|'lethal'|'resisted';
type SkillEffect='damage'|'heal'|'healPct'|'drain'|'shield'|'reduce'|'poison'|'nextMax'|'maxRoll'|'refundHeal'|'refundBoost'|'evade'|'survive'|'healShield'|'venomDrain'|'powerGuard';
export interface SkillSpec {when:SkillMoment;gate:SkillGate;effect:SkillEffect;amount:number}
const spec=(when:SkillMoment,gate:SkillGate,effect:SkillEffect,amount=1):SkillSpec=>({when,gate,effect,amount});
const TYPE_SKILL_SPECS:Record<string,SkillSpec[]>={
  '一般':[spec('attack','any','damage',2),spec('roll','repeat','maxRoll'),spec('attack','third','shield',8)],
  '火':[spec('attack','boosted','damage',3),spec('boost','any','shield',6),spec('attack','third','poison',4)],
  '水':[spec('hit','any','reduce',2),spec('guard','any','heal',5),spec('heal','any','nextMax')],
  '草':[spec('heal','any','heal',3),spec('hit','low','healPct',30),spec('attack','full','shield',7)],
  '电':[spec('roll','minimum','maxRoll'),spec('boost','any','refundBoost'),spec('attack','third','damage',8)],
  '冰':[spec('attack','any','nextMax'),spec('hit','full','shield',6),spec('attack','minimum','damage',9)],
  '格斗':[spec('attack','low','damage',4),spec('guard','any','nextMax'),spec('attack','third','healPct',35)],
  '毒':[spec('attack','any','poison',2),spec('attack','enemyHalf','poison',4),spec('hit','low','poison',6)],
  '地面':[spec('hit','guarded','shield',3),spec('attack','minimum','damage',4),spec('guard','any','refundHeal')],
  '飞行':[spec('hit','full','evade'),spec('attack','full','damage',3),spec('roll','first','shield',10)],
  '超能力':[spec('roll','minimum','shield',3),spec('boost','any','nextMax'),spec('heal','any','refundBoost')],
  '虫':[spec('attack','any','drain',25),spec('heal','any','shield',5),spec('hit','low','heal',8)],
  '岩石':[spec('hit','any','shield',3),spec('guard','any','shield',8),spec('hit','lethal','survive')],
  '幽灵':[spec('hit','low','evade'),spec('attack','enemyHalf','drain',60),spec('attack','resisted','damage',7)],
  '龙':[spec('attack','maximum','damage',3),spec('attack','boosted','poison',5),spec('attack','any','damage',6)],
  '恶':[spec('attack','enemyHalf','damage',3),spec('boost','any','heal',5),spec('attack','maximum','drain',50)],
  '钢':[spec('hit','full','reduce',3),spec('guard','any','shield',10),spec('hit','any','reduce',6)],
  '妖精':[spec('roll','first','heal',3),spec('heal','low','healPct',25),spec('guard','any','healPct',40)]
};
export const SKILL_SPECS:Record<SkillCode,SkillSpec>={
  res_bloom:spec('heal','any','healShield',4),res_venom:spec('attack','any','venomDrain',3),res_drive:spec('guard','any','powerGuard',5),
  tm_healStrike:spec('attack','any','heal',4),tm_guardHeal:spec('guard','any','heal',6),
  tm_boostShield:spec('boost','any','shield',5),tm_healPower:spec('heal','any','nextMax'),
  tm_finisher:spec('attack','enemyHalf','damage',5),tm_lastStand:spec('hit','lethal','survive'),
  tm_firstShield:spec('roll','first','shield',4),tm_combo:spec('attack','third','heal',5)
};
const effectNames:Record<SkillEffect,string>={healShield:'花盾',venomDrain:'蚀魂',powerGuard:'蓄壁',damage:'强击',heal:'回春',healPct:'复苏',drain:'汲取',shield:'屏障',reduce:'坚守',poison:'印记',nextMax:'蓄能',maxRoll:'改运',refundHeal:'药剂回响',refundBoost:'力量回响',evade:'闪避',survive:'不屈'};
const momentText:Record<SkillMoment,string>={attack:'攻击时',heal:'使用生命药水时',boost:'使用力量药水时',guard:'防御时',hit:'受到反击时',roll:'掷骰时'};
const gateText:Record<SkillGate,string>={any:'',third:'第三次攻击时',low:'生命不超过50%',full:'满血时',enemyHalf:'敌人生命不超过50%',minimum:'攻击点数为最低',maximum:'攻击点数为最高',repeat:'点数与上回合相同',first:'本场首次掷骰',boosted:'力量药水生效时',guarded:'本次选择防御',lethal:'将受到致命伤害',resisted:'本次攻击被抵抗'};
function specDescription(v:SkillSpec):string {
 const n=v.amount,effects:Record<SkillEffect,string>={healShield:'恢复生命及护盾各 +4',venomDrain:'汲取25%伤害并施毒3次，每次3点',powerGuard:'获得护盾 +5，下回合最高点数',damage:'额外伤害 +'+n,heal:'恢复生命 +'+n,healPct:'恢复最大生命 '+n+'%',drain:'恢复实际伤害的 '+n+'%',shield:'获得护盾 +'+n,reduce:'本次伤害减少 '+n,poison:'施毒3次，每次伤害 '+n,nextMax:'下回合攻击取最高点数',maxRoll:'本次攻击取最高点数',refundHeal:'生命药水 +1',refundBoost:'力量药水 +1',evade:'免疫本次反击',survive:'本次保留1点生命'};
 return momentText[v.when]+(gateText[v.gate]?' · '+gateText[v.gate]:'')+'：'+effects[v.effect]+'。每场一次。';
}
const PET_SKILLS={} as Record<PetId,[SkillCode,SkillCode,SkillCode]>;
for(const code of Object.keys(SKILL_SPECS))SKILLS[code]=[SKILLS[code][0],specDescription(SKILL_SPECS[code])];
for(const [i,type] of TYPE_NAMES.entries()){
 const codes=TYPE_SKILL_SPECS[type].map((v,tier)=>{const code='trait_'+i+'_'+tier;SKILL_SPECS[code]=v;SKILLS[code]=[type+'·'+['R','SR','SSR'][tier]+'·'+effectNames[v.effect],specDescription(v)];return code;}) as [SkillCode,SkillCode,SkillCode];
 for(const id of ids)if(PETS[id].type===type)PET_SKILLS[id]=codes;
}
export const NATURAL_SKILL_CODES=Object.keys(SKILL_SPECS).filter(c=>c.startsWith('trait_'));
function readySkillSpecs(s:State,when:SkillMoment,damage=0,guarded=false):SkillCode[]{
 if(!s.skill)return [];
 return combatSkills(s).filter(c=>{const v=SKILL_SPECS[c];if(!v||v.when!==when||!skillReady(s,c))return false;
  const gates:Record<SkillGate,boolean>={any:true,third:s.skill!.attacks===2,low:s.hpRatio<=.5,full:s.hpRatio===1,enemyHalf:s.enemyHP<=s.enemyMax*.5,minimum:s.attack===Math.min(...s.active.faces),maximum:s.attack===Math.max(...s.active.faces),repeat:s.turn>1&&s.attack===s.skill!.previousRoll,first:s.turn===1,boosted:s.doubled,guarded,lethal:damage>=hp(s)&&hp(s)>0,resisted:matchupMultiplier(s.active.id,s.enemy)<1};
  return gates[v.gate];
 });
}
function applySkillSpecs(s:State,codes:SkillCode[],dealt=0){
 const k=s.skill!;
 for(const code of codes){const v=SKILL_SPECS[code],n=v.amount;
  if(v.effect==='heal'||v.effect==='healPct'||v.effect==='drain'){const amount=v.effect==='heal'?n:Math.ceil((v.effect==='healPct'?maxHP(s):dealt)*n/100);s.hpRatio=Math.min(1,s.hpRatio+amount/maxHP(s));}
  if(v.effect==='shield')k.shield+=n;
  if(v.effect==='healShield'){s.hpRatio=Math.min(1,s.hpRatio+4/maxHP(s));k.shield+=4;}
  if(v.effect==='venomDrain'){s.hpRatio=Math.min(1,s.hpRatio+Math.ceil(dealt*.25)/maxHP(s));k.poison=3;k.poisonDamage=Math.max(k.poisonDamage||0,3);}
  if(v.effect==='powerGuard'){k.shield+=5;k.nextMax=true;}
  if(v.effect==='poison'){k.poison=3;k.poisonDamage=Math.max(k.poisonDamage||2,n);}
  if(v.effect==='nextMax')k.nextMax=true;
  if(v.effect==='maxRoll')s.attack=Math.max(...s.active.faces);
  if(v.effect==='refundHeal')s.potions=Math.min(9,s.potions+1);
  if(v.effect==='refundBoost')s.boosts=Math.min(9,s.boosts+1);
  trigger(s,code);
 }
 k.shield=Math.min(200,k.shield);
}
function migrateNaturalSkills(s:State){
 if(s.naturalSkillVersion===1)return;
 for(const p of s.pets||[]){const egg=p.uid?.startsWith('hatch-')?s.eggs?.find(e=>'hatch-'+e.id===p.uid):undefined;
  if(egg?.genes||p.uid?.startsWith('hatch-breed-')||p.skills?.length!==1)continue;
  const tier=RARITIES.indexOf(p.rarity||'normal'),old=OLD_PET_SKILLS[p.id][tier],code=PET_SKILLS[p.id][tier];
  if(p.skills[0]!==old)continue;
  for(const x of [p,s.active,s.reserve,...Object.values(s.runRoster||{})])if(x?.uid===p.uid)x.skills=[code];
  if(s.active.uid===p.uid&&s.skill?.usedCodes)s.skill.usedCodes=s.skill.usedCodes.map(c=>c===old?code:c);
 }
 s.naturalSkillVersion=1;
}
export function petSkills(p:Pick<Pet,'id'|'rarity'|'skills'>):SkillCode[]{return p.skills?.slice()||[PET_SKILLS[p.id][RARITIES.indexOf(p.rarity||'normal')]];}
export function skillFor(p:Pick<Pet,'id'|'rarity'|'skills'>){const codes=petSkills(p);return {code:codes[0],name:codes.map(c=>SKILLS[c][0]).join(' · '),description:codes.map(c=>SKILLS[c][1]).join('\n')+'\n各技能每场限一次。'};}
function skillReady(s:State,code:SkillCode):boolean {return !!s.skill&&combatSkills(s).includes(code)&&!(s.skill.usedCodes||(s.skill.used?combatSkills(s):[])).includes(code);}
function trigger(s:State,code:SkillCode){if(s.skill){const k=s.skill;k.usedCodes=k.usedCodes||[];if(!k.usedCodes.includes(code))k.usedCodes.push(code);k.used=combatSkills(s).every(c=>k.usedCodes!.includes(c));k.event+=(k.event?' · ':'')+SKILLS[code][0]+'！';}}
export const TEMP_SKILLS:SkillCode[]=['tm_healStrike','tm_guardHeal','tm_boostShield','tm_healPower','tm_finisher','tm_lastStand','tm_firstShield','tm_combo'];
export type BattleEventKind='revive'|'heal'|'giant'|'learn'|'egg';
export const giantMultiplier=(s:State,uid?:string)=>uid&&(s.runEffects?.[uid]?.giantUntil||0)>=s.step?1.5:1;
export function combatSkills(s:State,uid=s.active.uid!):SkillCode[]{return Array.from(new Set([...petSkills(uid===s.active.uid?s.active:petEntry(s,uid)),...(s.runEffects?.[uid]?.skills||[])]));}
export function battleEventOptions(s:State):BattleEventKind[]{
  const team=homeParty(s).filter(Boolean),alive=team.filter(uid=>petCombat(s,uid).hp>0),out:BattleEventKind[]=['egg'];
  if(team.some(uid=>petCombat(s,uid).hp===0))out.push('revive');
  if(alive.some(uid=>petCombat(s,uid).ratio<1))out.push('heal');
  if(alive.some(uid=>giantMultiplier(s,uid)===1))out.push('giant');
  if(alive.some(uid=>TEMP_SKILLS.some(c=>!combatSkills(s,uid).includes(c))))out.push('learn');
  return out;
}
export function grantBattleEvent(before:State,kind:BattleEventKind):State {
  if(before.phase==='event'||!battleEventOptions(before).includes(kind))return before;
  const s=clone(before);rememberParty(s);delete s.skill;
  const team=homeParty(s).filter(Boolean),alive=team.filter(uid=>petCombat(s,uid).hp>0);
  s.battleEvent={kind};s.phase='event';
  if(kind==='egg'){
    const rates=eggRates({mapId:s.mapId,step:5}),roll=rand(s)*100;
    const rarity:EggRarity=roll<rates.normal?'normal':roll<rates.normal+rates.SR?'SR':'SSR',affinity=pick(s,mapFor(s).pets);
    const id='event-'+(s.mapId||0)+'-'+s.step+'-'+s.seed+'-'+s.revision;
    s.eggs=s.eggs||[];s.eggs.push({id,affinity,rarity,stage:5,mapId:s.mapId||0});s.battleEvent.eggId=id;
  }else{
    let targets=alive;
    if(kind==='revive')targets=team.filter(uid=>petCombat(s,uid).hp===0);
    if(kind==='heal'){const lowest=Math.min(...alive.filter(uid=>petCombat(s,uid).ratio<1).map(uid=>petCombat(s,uid).hp));targets=alive.filter(uid=>petCombat(s,uid).ratio<1&&petCombat(s,uid).hp===lowest);}
    if(kind==='giant')targets=alive.filter(uid=>giantMultiplier(s,uid)===1);
    if(kind==='learn')targets=alive.filter(uid=>TEMP_SKILLS.some(c=>!combatSkills(s,uid).includes(c)));
    const uid=pick(s,targets);s.battleEvent.uid=uid;
    if(kind==='revive'||kind==='heal'){const p=petCombat(s,uid);s.combatVitals![uid]={hpRatio:1,hpBonus:p.bonus};loadActiveVitals(s);}
    else{const effect=(s.runEffects||(s.runEffects={}))[uid]||(s.runEffects![uid]={});
      if(kind==='giant')effect.giantUntil=Math.min(mapStageCount(s),s.step+2);
      else{const code=pick(s,TEMP_SKILLS.filter(c=>!combatSkills(s,uid).includes(c)));effect.skills=[...(effect.skills||[]),code];s.battleEvent.skill=code;}
    }
  }
  s.revision++;return s;
}
function validRunEffects(s:State):boolean {
  if(s.runEffects){if(typeof s.runEffects!=='object'||Array.isArray(s.runEffects))return false;
    for(const [uid,e] of Object.entries(s.runEffects)){if(!s.pets?.some(p=>p.uid===uid)||!e||typeof e!=='object'||e.giantUntil!==undefined&&(!Number.isInteger(e.giantUntil)||e.giantUntil<1||e.giantUntil>mapStageCount(s))||e.skills!==undefined&&(!Array.isArray(e.skills)||e.skills.length>8||new Set(e.skills).size!==e.skills.length||e.skills.some(c=>!TEMP_SKILLS.includes(c))))return false;}
  }
  if(s.phase==='event'){const e=s.battleEvent;if(!e||!['revive','heal','giant','learn','egg'].includes(e.kind))return false;
    if(e.kind==='egg'){if(!s.eggs?.some(egg=>egg.id===e.eggId))return false;}
    else if(!s.pets?.some(p=>p.uid===e.uid)||e.kind==='learn'&&(!e.skill||!TEMP_SKILLS.includes(e.skill)))return false;
  }
  return true;
}
export function skillStatus(s:State):string {const k=s.skill;if(!k)return '技能从下一场生效';return rarityName(s.active.rarity)+' · 技能 '+(k.usedCodes?.length||(k.used?1:0))+'/'+combatSkills(s).length+(k.shield?' · 护盾 '+k.shield:k.poison?' · 毒 '+k.poison+' 回合':k.nextMax?' · 下回合最高点数':'');}
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
  if(s.skill){const k=s.skill;if(!object(k)||typeof k.used!=='boolean'||typeof k.nextMax!=='boolean'||typeof k.event!=='string'||![k.attacks,k.shield,k.poison,k.previousRoll,k.lastDamage,k.lastTaken].every(uint)||k.poison>3||k.shield>200||(k.poisonDamage!==undefined&&(!uint(k.poisonDamage)||k.poisonDamage>10))||(k.usedCodes!==undefined&&(!Array.isArray(k.usedCodes)||k.usedCodes.some(c=>!combatSkills(s).includes(c))||new Set(k.usedCodes).size!==k.usedCodes.length)))return false;}
  if(s.skill?.attackHPRatio!==undefined&&(!Number.isFinite(s.skill.attackHPRatio)||s.skill.attackHPRatio<0||s.skill.attackHPRatio>1))return false;
  if(s.skill?.heroHealUsed!==undefined&&typeof s.skill.heroHealUsed!=='boolean')return false;
  return true;
}

// Species forms and individuals are separate: no quality selector and no duplicate conversion.
export const FORM_NAMES:Record<PetId,[string,string,string]>={
  nectar:["蜜团睡鼠", "蜜袋睡鼠", "花蜜守望鼠"],
  orchid:["兰芽壁虎", "花冠壁虎", "翠兰花龙"],
  axolotl:["露鳃螈", "涟波螈", "瀑冠灵螈"],
  lantern:["灯豆萤", "琥灯萤", "曦灯萤后"],
  cobra:["紫芽蛇", "棘冠眼镜蛇", "蚀花蛇君"],
  hornbill:["冠喙雏", "风冠犀鸟", "苍穹冠皇"],
  embercamel:["炭团驼", "熔峰驼", "赤曜焰驼"],
  frill:["电扇蜥", "雷冠蜥", "霆环伞蜥"],
  wombat:["砂团熊", "掘岩袋熊", "地脉堡熊"],
  trilobite:["砾甲虫", "晶脊古虫", "磐古甲尊"],
  wolverine:["拳爪獾", "赤拳战獾", "震岳斗獾"],
  bison:["铁角犊", "铠峰野牛", "天铸钢牛"],
  narwhal:["雪角鲸", "冰帆鲸", "霜冕角鲸"],
  raccoon:["幽面狸", "夜灯灵狸", "冥面幻狸"],
  octopus:["念泡章", "星瞳章", "星轨贤章"],
  moonbat:["暮绒蝠", "月刃蝠", "蚀夜翼蝠"],
  silkmoth:["月绒蛾", "绫月蝶蛾", "月华织梦蛾"],
  kirin:["曜角驹", "星鬃麒麟", "九曜龙麟"],
  capy:["绒果豚","果篮豚","丰收山豚"],
  lotus:["荷芽蛙","莲蓬蛙","碧莲仙蛙"],
  manta:["泡泡鳐","潮纹鳐","瀚海翼鳐"],
  crane:["风铃鹤","逐风鹤","九霄灵鹤"],
  mantis:["叶镰螳","双刃螳","翠甲刃皇"],
  cragcrab:["砂晶蟹","晶簇蟹","磐晶蟹王"],
  cinder:["炭角羊","炽鬃羊","熔冠炎羊"],
  voltage:["电绒鼠","雷跃鼠","极电灵鼠"],
  venom:["紫尾蝎","荆毒蝎","蚀毒蝎王"],
  dune:["沙鳞兽","流砂穿山兽","地脉甲尊"],
  monk:["拳袋鼠","斗篷袋鼠","震岳斗王"],
  ironboar:["铁鼻豕","钢鬃战豕","陨铁巨牙"],
  frost:["雪耳兔","冰棱兔","霜冠灵兔"],
  spirit:["幽泡灵","夜灯水母","冥幕灯母"],
  dream:["梦芽貘","星枕貘","梦境贤貘"],
  shade:["墨羽鸦","暮刃鸦","蚀星鸦王"],
  aurora:["彩翎雏","幻彩孔雀","极光仙凰"],
  starwyrm:["星鳞幼龙","星环游龙","星渊龙君"],
  fox:['闪尾狐','焰鬃狐','曜焰灵狐'],bud:['芽芽龙','蕨翼龙','花冠森龙'],turtle:['岩背龟','峭甲龟','山垒巨龟'],
  cotton:['绒团兔','绒领兔','云绒王兔'],otter:['潮泡獭','涌浪獭','沧澜海獭'],spark:['蓄电貂','电弧貂','雷冠灵貂'],
  seal:['霜团海豹','霜鳍海豹','冰冠海狮'],ape:['拳铠猿','破岩拳猿','金刚斗猿'],slug:['毒泡蜗','棘壳蜗','毒冠巨蜗'],
  mole:['铲角鼹','钻甲鼹','地脉巨鼹'],bird:['云翎雀','流云隼','天穹鹏'],owl:['星环鸮','月轮鸮','星冕贤鸮'],
  beetle:['芽角甲虫','荆角甲虫','翠刃甲皇'],ghost:['灯芯幽灵','引魂灯灵','冥灯灵君'],dragon:['霆冠龙','裂霆翼龙','苍霆龙皇'],
  lynx:['暮影猞猁','夜刃猞猁','蚀月影王'],rhino:['铁垒犀','钢棘战犀','星钢巨犀'],deer:['铃芽鹿','花铃灵鹿','圣铃仙鹿']
};
export const petName=(p:Pick<Pet,'id'|'rarity'>)=>FORM_NAMES[p.id][RARITIES.indexOf(p.rarity||'normal')];
export const formKey=(p:Pick<Pet,'id'|'rarity'>)=>p.id+'-'+(p.rarity||'normal');
export const naturalPetHP=(id:PetId,rarity:EggRarity='normal')=>PETS[id].hp+(NEW_PET_IDS.includes(id)?RARITIES.indexOf(rarity)*6:qualityHP(rarity));
export const naturalPetFaces=(id:PetId,rarity:EggRarity='normal')=>PETS[id].faces.map(v=>v+(NEW_PET_IDS.includes(id)?RARITIES.indexOf(rarity)*2:0));
export const petBaseHP=(p:Pet)=>p.baseHP??naturalPetHP(p.id,p.rarity);
export const sexSymbol=(sex?:Sex)=>sex==='female'?'♀':sex==='male'?'♂':'';
export function petEntry(s:State,key:string):Pet {
  const p=s.pets?.find(p=>p.uid===key);if(p)return p;
  const [id,r]=key.split(':') as [PetId,EggRarity];return {id:ids.includes(id)?id:'fox',rarity:RARITIES.includes(r)?r:'normal',faces:naturalPetFaces(ids.includes(id)?id:'fox',RARITIES.includes(r)?r:'normal')};
}
function hatchRandom(s:State):number {s.hatchSeed=(Math.imul(s.hatchSeed===undefined?(s.seed^0x9e3779b9)>>>0:s.hatchSeed,1664525)+1013904223)>>>0;return s.hatchSeed/4294967296;}
function naturalGenes(id:PetId,rarity:EggRarity):Genes {return {id,rarity,baseHP:naturalPetHP(id,rarity),baseFaces:naturalPetFaces(id,rarity),skills:[PET_SKILLS[id][RARITIES.indexOf(rarity)]]};}
function individual(s:State,uid:string,g:Genes):Pet {return {id:g.id,rarity:g.rarity,uid,sex:hatchRandom(s)<.5?'female':'male',baseHP:g.baseHP,baseFaces:[...g.baseFaces],faces:[...g.baseFaces],skills:[...g.skills],...(g.ornament?{ornament:g.ornament}:{})};}
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
export const BREED_DURATION=BUILD_TEST_MODE?3000:30*60*1000;
export function inheritedSkillCount(total:number,roll:number):number {
  if(total<=1)return Math.max(0,total);
  if(total<3)return 2;
  if(total===3)return roll<.5?2:3;
  if(total===4)return roll<.25?2:roll<.75?3:4;
  if(total===5)return roll<.25?3:roll<.75?4:5;
  return roll<.25?4:roll<.75?5:6;
}
export function startBreeding(before:State,mother:string,father:string,now=gameNow()):State {
  const m=before.pets?.find(p=>p.uid===mother),f=before.pets?.find(p=>p.uid===father);
  if(before.breeding||!m||!f||m.sex!=='female'||f.sex!=='male'||mother===father||mother===before.active.uid||father===before.active.uid||!Number.isSafeInteger(now)||now<0)return before;
  const s=clone(before),mr=RARITIES.indexOf(m.rarity||'normal'),fr=RARITIES.indexOf(f.rarity||'normal');
  const form=mr===fr?(hatchRandom(s)<.5?m:f):mr>fr?m:f,health=hatchRandom(s)<.5?m:f,attack=hatchRandom(s)<.5?m:f;
  const pool=Array.from(new Set([...petSkills(m),...petSkills(f)])),count=inheritedSkillCount(pool.length,hatchRandom(s)),skills:SkillCode[]=[];
  while(skills.length<count){const i=Math.floor(hatchRandom(s)*pool.length);skills.push(pool.splice(i,1)[0]);}
  const genes:Genes={id:form.id,rarity:form.rarity||'normal',baseHP:petBaseHP(health),baseFaces:[...(attack.baseFaces||PETS[attack.id].faces)],skills};
  applyBreedingSurprises(s,m,f,genes);
  s.breedingSerial=(s.breedingSerial||0)+1;
  s.breeding={id:'breed-'+s.breedingSerial+'-'+s.hatchSeed,mother,father,startedAt:now,readyAt:now+BREED_DURATION,genes};
  rememberParty(s);s.team=homeParty(s);if(isBreedingPet(s,s.reserve?.uid||''))s.reserve=null;
  s.revision++;return s;
}
export function claimBreeding(before:State,now=gameNow()):State {
  const b=before.breeding;if(!b||before.phase==='battle'||before.pendingHatch||!Number.isSafeInteger(now)||now<b.readyAt)return before;
  const s=clone(before);s.eggs=s.eggs||[];
  if(!s.eggs.some(e=>e.id===b.id))s.eggs.push({id:b.id,rarity:b.genes.rarity,affinity:b.genes.id,stage:0,genes:JSON.parse(JSON.stringify(b.genes))});
  if(b.genes.ornament){const book=surpriseState(s).recipes;if(!book.includes(b.genes.ornament))book.push(b.genes.ornament);}
  const removed=[b.mother,b.father],slots=homeParty(s);rememberParty(s);
  if(removed.includes(s.active.uid!))delete s.skill;
  s.pets=s.pets!.filter(p=>!removed.includes(p.uid!));
  for(const uid of removed){delete s.runRoster![uid];if(s.combatVitals)delete s.combatVitals[uid];if(s.runEffects)delete s.runEffects[uid];}
  s.team=slots.map(uid=>removed.includes(uid)?'':uid);
  if(s.pets.length){
    if(!s.team[0])s.team[0]=s.team.find(Boolean)||s.pets[0].uid!;
    for(let i=1;i<3;i++)if(s.team[i]===s.team[0])s.team[i]='';
    s.active=runPet(s,s.team[0]);s.reserve=s.team[1]?runPet(s,s.team[1]):null;
    loadActiveVitals(s);
  }else{s.active=pet('fox');s.reserve=null;s.team=['','',''];s.runRoster={};s.hpRatio=1;s.phase='encounter';s.enemyHP=s.enemyMax;delete s.skill;}
  s.breeding=null;s.revision++;return s;
}
function validGenes(g:any):g is Genes {return !!g&&ids.includes(g.id)&&RARITIES.includes(g.rarity)&&Number.isInteger(g.baseHP)&&g.baseHP>0&&g.baseHP<=200&&Array.isArray(g.baseFaces)&&g.baseFaces.length>0&&g.baseFaces.length<=5&&g.baseFaces.every((v:any)=>Number.isInteger(v)&&v>0&&v<=100)&&Array.isArray(g.skills)&&g.skills.length>0&&g.skills.length<=6&&new Set(g.skills).size===g.skills.length&&g.skills.every((c:any)=>Object.prototype.hasOwnProperty.call(SKILLS,c))&&(g.ornament===undefined||SECRET_RECIPES.some(r=>r.id===g.ornament));}
function validIndividuals(s:State):boolean {
  if(!Array.isArray(s.pets))return false;
  const valid=(p:Pet)=>p&&typeof p.uid==='string'&&p.uid.length>0&&['female','male'].includes(p.sex!)&&validGenes({...p,rarity:p.rarity||'normal'});
  if(s.pets.some(p=>!valid(p)||(p.shiny!==undefined&&typeof p.shiny!=='boolean'))||new Set(s.pets.map(p=>p.uid)).size!==s.pets.length)return false;
  const exists=(uid?:string)=>s.pets!.some(p=>p.uid===uid);
  const same=(p:Pet)=>valid(p)&&exists(p.uid)&&['id','rarity','sex','baseHP','baseFaces','skills','shiny','ornament'].every(k=>JSON.stringify(p[k])===JSON.stringify(s.pets!.find(v=>v.uid===p.uid)![k]));
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
function validFriendCard(card:any):card is FriendCard {
 if(!card||![1,2].includes(card.version)||!socialIdentity(card.owner)||!socialIdentity(card.petUid,1,160)||!ids.includes(card.species)||!RARITIES.includes(card.rarity)||!['female','male'].includes(card.sex))return false;
 if(card.version===1)return card.id==='card-'+visitChecksum(cardBody(card));
 return validNickname(card.nickname)&&validWishes(card.wishes)&&Array.isArray(card.skills)&&card.skills.length<=6&&new Set(card.skills).size===card.skills.length&&card.skills.every(c=>Object.prototype.hasOwnProperty.call(SKILLS,c))&&typeof card.shiny==='boolean'&&(card.ornament===''||SECRET_RECIPES.some(r=>r.id===card.ornament))&&(!card.replyTo||socialIdentity(card.replyTo))&&card.id==='card-'+visitChecksum(postcardBody(card));
}
const validNickname=(n:any)=>{if(typeof n!=='string'||Array.from(n).length>12||/[\u0000-\u001f\u007f<>]/.test(n))return false;try{encodeURIComponent(n);return true;}catch{return false;}};
const validWishes=(v:any)=>Array.isArray(v)&&v.length<=3&&new Set(v).size===v.length&&v.every(id=>ids.includes(id));
function packPostcard(value:string):string {
 const bytes=encodeURIComponent(value).replace(/%([0-9A-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))),chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';let out='',bits=0,buffer=0;
 for(let i=0;i<bytes.length;i++){buffer=(buffer<<8)|bytes.charCodeAt(i);bits+=8;while(bits>=6){bits-=6;out+=chars[(buffer>>>bits)&63];}}if(bits)out+=chars[(buffer<<(6-bits))&63];return out;
}
function unpackPostcard(value:string):string {const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';let out='',bits=0,buffer=0;for(const c of value){const v=chars.indexOf(c);if(v<0)throw Error('code');buffer=(buffer<<6)|v;bits+=6;if(bits>=8){bits-=8;out+='%'+((buffer>>>bits)&255).toString(16).padStart(2,'0');}}return decodeURIComponent(out);}
function postcardBody(c:FriendCard):string {return 'PMV2.'+packPostcard(JSON.stringify([c.owner,c.petUid,ids.indexOf(c.species),RARITIES.indexOf(c.rarity),c.sex==='female'?0:1,c.nickname,c.wishes!.map(id=>ids.indexOf(id)),c.skills,c.shiny?1:0,c.ornament,c.replyTo||'']));}
export function makePostcardCode(s:State,uid:string,replyTo=''):string|null {
 const p=s.pets?.find(p=>p.uid===uid);if(!s.social||!p?.sex||!socialIdentity(p.uid,1,160))return null;
 const c:FriendCard={version:2,id:'',owner:s.social.owner,petUid:p.uid!,species:p.id,rarity:p.rarity||'normal',sex:p.sex,nickname:s.social.nickname||heroFor(s)?.name||'',wishes:s.social.wishes||[],skills:petSkills(p),shiny:!!p.shiny,ornament:p.ornament||'',replyTo};const body=postcardBody(c);return body+'.'+visitChecksum(body);
}
export function setSocialProfile(before:State,nickname:string,wishes:PetId[]):State {if(!before.social||!validNickname(nickname)||!validWishes(wishes))return before;const s=clone(before);s.social!.nickname=nickname.trim();s.social!.wishes=[...wishes];s.revision++;return s;}
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
  if(typeof input!=='string'||input.length>4096)return null;
  const match=input.match(/PMV[12]\.[A-Za-z0-9_.-]+/),code=(match?match[0]:input).replace(/\s/g,''),parts=code.split('.');
  if(parts[0]==='PMV2')try{if(parts.length!==3||parts[1].length>1800||parts[2]!==visitChecksum(parts.slice(0,2).join('.')))return null;const a=JSON.parse(unpackPostcard(parts[1]));if(!Array.isArray(a)||a.length!==11||![0,1].includes(a[4])||![0,1].includes(a[8])||!Number.isInteger(a[2])||!Number.isInteger(a[3])||!Array.isArray(a[6])||a[6].some(v=>!Number.isInteger(v)))return null;const c:FriendCard={version:2,id:'card-'+parts[2],owner:a[0],petUid:a[1],species:ids[a[2]],rarity:RARITIES[a[3]],sex:a[4]===0?'female':'male',nickname:a[5],wishes:a[6].map(i=>ids[i]),skills:a[7],shiny:!!a[8],ornament:a[9],replyTo:a[10]};return validFriendCard(c)?c:null;}catch{return null;}
  if(parts.length!==7)return null;
  const [version,owner,species,rarity,sex,petUid,check]=parts;
  if(version!=='PMV1'||!socialIdentity(owner)||!socialIdentity(petUid,1,160)||!/^\d{1,2}$/.test(species)||!ids[Number(species)]||String(Number(species))!==species||!/[012]/.test(rarity)||rarity.length!==1||!['F','M'].includes(sex))return null;
  const body=parts.slice(0,6).join('.');if(check!==visitChecksum(body))return null;
  return {version:1,owner,petUid,species:ids[Number(species)],rarity:RARITIES[Number(rarity)],sex:sex==='F'?'female':'male',id:'card-'+check};
}
export function receiveVisitor(before:State,code:string,now=gameNow()):State {
  const card=readVisitCode(code);if(!before.social||!card||card.owner===before.social.owner||!Number.isSafeInteger(now)||now<0||before.social.visitor?.card.id===card.id)return before;
  const s=clone(before);s.social!.visitor={card,progress:s.social!.bonds.some(b=>b.species===card.species)?3:0,lastPlayedAt:now};s.revision++;return s;
}
export function visitorPet(s:State):Pet|null {const c=s.social?.visitor?.card;return c?{id:c.species,rarity:c.rarity,sex:c.sex,faces:[],skills:c.skills?.length?c.skills:undefined,shiny:c.shiny,ornament:c.ornament||undefined}:null;}
export function completeVisit(before:State,now=gameNow()):State {
 const v=before.social?.visitor,local=before.pets?.find(p=>p.uid===before.active.uid)||before.pets?.[0];if(!v||!local||!Number.isSafeInteger(now)||now<0)return before;
 const old=before.social!.album?.find(r=>r.card.owner===v.card.owner&&r.card.species===v.card.species);if(v.progress===3&&old)return before;
 const s=clone(before),social=s.social!,card=social.visitor!.card;social.visitor!.progress=3;social.visitor!.lastPlayedAt=now;
 if(!social.bonds.some(b=>b.species===card.species))social.bonds.push({species:card.species,owner:card.owner,cardId:card.id,nickname:card.nickname||''});
 const n=parseInt(visitChecksum(card.id+social.owner),36),dice:[number,number]=[n%6+1,Math.floor(n/6)%6+1];
 const record:MailMemory={card,local:{id:local.id,rarity:local.rarity||'normal',shiny:!!local.shiny,ornament:local.ornament||''},dice,stamp:(dice[0]+dice[1])%3};social.album=[record,...(social.album||[]).filter(r=>r.card.owner!==card.owner||r.card.species!==card.species)].slice(0,12);s.revision++;return s;
}
export function replyPet(s:State,card:FriendCard):Pet|undefined {return s.pets?.find(p=>card.wishes?.includes(p.id))||s.pets?.find(p=>p.uid===s.active.uid)||s.pets?.[0];}
export function friendBonds(s:State):FriendBond[] {return (s.social?.bonds||[]).map(b=>({...b}));}
export function visitAction(before:State,now=gameNow()):State {
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
export function startBondIncubation(before:State,eggId:string,target:PetId,index:number,now=gameNow()):State {
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
  if(social.nickname!==undefined&&!validNickname(social.nickname)||social.wishes!==undefined&&!validWishes(social.wishes))return false;
  if(social.bonds.some(b=>b.nickname!==undefined&&!validNickname(b.nickname)))return false;
  if(social.album!==undefined&&(!Array.isArray(social.album)||social.album.length>12||new Set(social.album.map(r=>r?.card?.owner+':'+r?.card?.species)).size!==social.album.length||social.album.some(r=>!r||!validFriendCard(r.card)||r.card.owner===social.owner||!r.local||!ids.includes(r.local.id)||!RARITIES.includes(r.local.rarity!)||typeof r.local.shiny!=='boolean'||r.local.ornament!==''&&!SECRET_RECIPES.some(v=>v.id===r.local.ornament)||!Array.isArray(r.dice)||r.dice.length!==2||r.dice.some(n=>!Number.isInteger(n)||n<1||n>6)||![0,1,2].includes(r.stamp))))return false;
  if(s.eggs?.some(e=>e.bond&&!social.bonds.some(b=>b.species===e.bond!.species&&b.owner===e.bond!.owner&&b.cardId===e.bond!.cardId)))return false;
  return true;
}


// Surprises use a separate persisted random stream, leaving combat dice and genes independent.
export type SurpriseKind='gold'|'variant'|'shiny'|'nested'|'resonance';
export const SURPRISE_RULES:Record<SurpriseKind,{base:number;step:number;cap:number;pity:number}>={
 gold:{base:.04,step:.002,cap:.15,pity:50},variant:{base:.08,step:.004,cap:.20,pity:20},
 shiny:{base:.02,step:.002,cap:.12,pity:50},nested:{base:.05,step:.005,cap:.20,pity:25},resonance:{base:.12,step:.01,cap:.30,pity:10}
};
export const SHINY_PETS:PetId[]=MAPS.map(m=>m.pets[0]);
export const SECRET_RECIPES=[
 {id:'steam',types:['火','水'],name:'蒸汽之约',color:'#80e6ef'},
 {id:'firefly',types:['草','电'],name:'萤光之约',color:'#b9f37a'},
 {id:'moon',types:['幽灵','妖精'],name:'月影之约',color:'#d4b2fa'}
];
function surpriseState(s:State){return s.surprises||(s.surprises={seed:(s.seed^0xa341316c)>>>0,misses:{},recipes:[]});}
function surpriseRandom(s:State){const d=surpriseState(s);d.seed=(Math.imul(d.seed,1664525)+1013904223)>>>0;return d.seed/4294967296;}
export function surpriseChance(s:State,kind:SurpriseKind):boolean {
 const d=surpriseState(s),r=SURPRISE_RULES[kind],miss=d.misses[kind]||0,roll=surpriseRandom(s);
 const hit=miss>=r.pity-1||roll<Math.min(r.cap,r.base+miss*r.step);d.misses[kind]=hit?0:miss+1;return hit;
}
function surpriseEgg(s:State,id:string,mapId:number,nested=false):Egg {
 const pool=MAPS[mapId].pets;return {id,rarity:'normal',affinity:pool[Math.floor(surpriseRandom(s)*pool.length)],stage:5,mapId,...(nested?{nested:true}:{})};
}
function rollGoldDie(s:State){
 delete s.goldDie;if(!s.expedition||!surpriseChance(s,'gold'))return;
 s.goldDie=(['strike','heal','shield'] as const)[Math.floor(surpriseRandom(s)*3)];
 if(s.goldDie==='shield'&&s.skill)s.skill.shield=Math.min(200,s.skill.shield+6);
 if(s.goldDie==='heal'){rememberParty(s);for(const uid of homeParty(s).filter(Boolean)){const c=petCombat(s,uid);if(c.hp>0)s.combatVitals![uid]={hpBonus:c.bonus,hpRatio:Math.min(1,c.ratio+Math.ceil(c.max*.15)/c.max)};}loadActiveVitals(s);}
}
function rollEnemyVariant(s:State){
 delete s.enemyVariant;if(!surpriseChance(s,'variant'))return;
 s.enemyVariant={kind:(['giant','mirror','ward'] as const)[Math.floor(surpriseRandom(s)*3)],revealed:false,shield:0};
}
function revealEnemyVariant(s:State){const v=s.enemyVariant;if(!v||v.revealed)return;v.revealed=true;
 if(v.kind==='giant'){s.enemyMax=Math.ceil(s.enemyMax*1.4);s.enemyHP=s.enemyMax;}
 if(v.kind==='ward')v.shield=Math.ceil(s.enemyMax*.25);
}
export function enemyVariantAttack(s:State){const v=s.enemyVariant;return !v?.revealed?1:v.kind==='giant'?1.2:v.kind==='mirror'&&s.turn%3===0?1.4:1;}
function rewardEnemyVariant(s:State){const v=s.enemyVariant;if(!v||v.rewardEggId)return;v.rewardEggId='variant-'+(s.mapId||0)+'-'+s.step+'-'+s.seed+'-'+s.revision;s.eggs=s.eggs||[];s.eggs.push(surpriseEgg(s,v.rewardEggId,s.mapId||0));}
function applyBreedingSurprises(s:State,m:Pet,f:Pet,g:Genes){
 const recipe=SECRET_RECIPES.find(r=>r.types.includes(PETS[m.id].type)&&r.types.includes(PETS[f.id].type)&&PETS[m.id].type!==PETS[f.id].type);if(recipe)g.ornament=recipe.id;
 const effect=(c:string)=>SKILL_SPECS[c]?.effect||({healing:'heal',armor:'reduce',barrier:'shield',venom:'poison',leech:'drain',opening:'damage',focus:'nextMax'} as Record<string,string>)[c];
 const pairs:[string,string[],string[]][]=[['res_bloom',['heal','healPct','drain'],['shield','reduce']],['res_venom',['poison'],['drain','damage']],['res_drive',['nextMax','maxRoll'],['shield','reduce']]];
 const candidates=pairs.filter(([code,a,b])=>!g.skills.includes(code)&&g.skills.some(c=>!c.startsWith('res_')&&a.includes(effect(c)))&&g.skills.some(c=>!c.startsWith('res_')&&b.includes(effect(c))));
 if(!candidates.length||!surpriseChance(s,'resonance'))return;
 const [code,a]=candidates[Math.floor(surpriseRandom(s)*candidates.length)],i=g.skills.findIndex(c=>!c.startsWith('res_')&&a.includes(effect(c)));g.skills[i]=code;
}
function validSurprises(s:State):boolean {
 const d=s.surprises;if(d&&(!Number.isInteger(d.seed)||d.seed<0||d.seed>4294967295||!d.misses||typeof d.misses!=='object'||Array.isArray(d.misses)||Object.entries(d.misses).some(([k,n])=>!Object.prototype.hasOwnProperty.call(SURPRISE_RULES,k)||!Number.isInteger(n)||n!<0||n!>1000)||!Array.isArray(d.recipes)||new Set(d.recipes).size!==d.recipes.length||d.recipes.some(k=>!SECRET_RECIPES.some(r=>r.id===k))))return false;
 if(s.goldDie!==undefined&&!['strike','heal','shield'].includes(s.goldDie))return false;
 const v=s.enemyVariant;if(v&&(!['giant','mirror','ward'].includes(v.kind)||typeof v.revealed!=='boolean'||!Number.isInteger(v.shield)||v.shield<0||v.shield>Math.ceil(s.enemyMax*.25)||v.rewardEggId!==undefined&&!s.eggs?.some(e=>e.id===v.rewardEggId)))return false;
 if(s.eggs?.some(e=>e.nested!==undefined&&typeof e.nested!=='boolean'))return false;
 for(const slot of s.incubators||[]){if(!slot)continue;if(slot.shiny!==undefined&&typeof slot.shiny!=='boolean')return false;const e=slot.nestedEgg;if(e&&(e.nested!==true||e.rarity!=='normal'||e.stage!==5||e.id!=='nested-'+slot.eggId||!MAPS[e.mapId!]?.pets.includes(e.affinity)||s.eggs?.find(v=>v.id===slot.eggId)?.nested))return false;}
 if(s.pendingHatch?.bonusEggId&&!s.eggs?.some(e=>e.id===s.pendingHatch!.bonusEggId&&e.nested))return false;
 return true;
}
