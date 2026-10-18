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
export interface Egg { id:string; rarity:EggRarity; affinity:PetId; stage:number }
export interface EggHunt { limit:number; candidates:Egg[]; selected:number }
export const EGG_RATES={normal:80,SR:17,SSR:3};
export interface Pet { id: PetId; faces: number[]; rarity?:EggRarity }
export interface Incubation { eggId:string; startedAt:number; readyAt:number; result:EggRarity }
export interface HatchResult { eggId:string; petId:PetId; rarity:EggRarity; duplicate:boolean; warmthGain:number }
export interface SkillState { used:boolean; attacks:number; shield:number; poison:number; nextMax:boolean; previousRoll:number; event:string; lastDamage:number; lastTaken:number }
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
}
export type Action = 'challenge' | 'reroll' | 'switch' | 'attack' | 'guard' | 'heal' | 'boost' |
  'take' | 'keep' | 'reward0' | 'invite' | 'skip' | 'replace' | 'collect' |
  'eggSearch' | 'eggSelect0' | 'eggSelect1' | 'eggSelect2' | 'eggTake' | 'eggContinue';
export const PET_IDS=Object.keys(PETS) as PetId[];
const ids=PET_IDS;
export const TOTAL_STAGES=20;
export const rankForStage=(step:number):PetRank=>step%10===0?'boss':step%5===0?'elite':'normal';
const growthTier=(step:number)=>step<=10?(step<=3?0:step<=6?2:4):Math.floor((step-1)/3)*2;
export const enemyHealthForStage=(step:number)=>step<=10?[7,9,11,14,24,20,23,26,29,48][step-1]:Math.round((rankForStage(step)==='normal'?29/9:4.8)*step);
export const encounterPool=(step:number)=>ids.filter(id=>PETS[id].rank===rankForStage(step));
// Independent per-turn rolls: heal x1/x2/x3, boost x2/x3/x4, both 50%/40%/10%.
export const ITEM_MULTIPLIERS = { heal: [1,1,1,1,1,2,2,2,2,3], boost: [2,2,2,2,2,3,3,3,3,4] };
export const healAmount = (s: State) => s.heal * s.healMultiplier;
export const attackAmount = (s: State) => s.attack * (s.doubled ? s.boostMultiplier : 1) + (s.skill&&!s.skill.used?(skillFor(s.active).code==='opening'?2:skillFor(s.active).code==='heavy'&&s.skill.attacks===2?4:0):0);
export const guardDamage = (incoming: number) => Math.max(1, Math.round(incoming / 100));
const rand = (s: State) => { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; };
const pick = <T>(s: State, a: T[]): T => a[Math.floor(rand(s) * a.length)];
export const maxHP = (s: State) => PETS[s.active.id].hp + s.hpBonus + qualityHP(s.active.rarity);
export const hp = (s: State) => Math.max(0, Math.ceil(s.hpRatio * maxHP(s) - 1e-8));
export const pet = (id: PetId): Pet => ({ id, faces: [...PETS[id].faces] });
export const enemyName = (s: State) => PETS[s.enemy].name;
export const enemyAttackFaces = (s: State): number[] => {
  const tier=PETS[s.enemy].rank==='normal'?(s.step<=10?(s.step<=3?0:s.step<=6?1:2):Math.floor((s.step-1)/3)):s.step<=10?0:Math.floor((s.step-(PETS[s.enemy].rank==='elite'?5:10))/5)*2;
  return PETS[s.enemy].enemyFaces.map(v=>v+tier);
};
export function fresh(seed = Date.now(), owned: PetId[] = ['fox', 'turtle'], wins = 0): State {
  const s: State = {contentVersion:2,version:1, seed:seed >>> 0, step:1, phase:'encounter', active:pet('fox'), reserve:pet('turtle'),
    owned:ids.filter(id=>id==='fox'||id==='turtle'||owned.indexOf(id)>=0), hpRatio:1, hpBonus:0, potions:3, boosts:2,
    healFaces:[3,5,7], healMultiplier:1, boostMultiplier:2, usedHeal:false, doubled:false, swaps:2, enemy:'bud', enemyHP:7, enemyMax:7,
    attack:0, heal:0, enemyAttack:0, turn:0, reward:{kind:'hp',values:[3],title:'生命上限 +3'},
    previousReward:'', recruit:null, revision:0, wins, eggs:[], incubators:[null,null],warmth:0,hatchSeed:(seed^0x9e3779b9)>>>0,hatchedEggIds:[],qualities:{},preferredRarities:{},message:'先选伙伴，再开始挑战'};
  encounter(s, false); return s;
}
function reward(s: State, excluded: string[] = []): Reward {
  const tier = growthTier(s.step);
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
  const pool=encounterPool(s.step);s.enemy=pick(s,reroll?pool.filter(id=>id!==s.enemy):pool);
  s.enemyMax=enemyHealthForStage(s.step);s.enemyHP=s.enemyMax;
  s.reward=reward(s); s.recruit=null;
  if(!reroll) s.swaps=rankForStage(s.step)==='boss'?0:2;
}
function roll(s: State) {
  s.attack=pick(s,s.active.faces); s.heal=pick(s,s.healFaces);
  s.enemyAttack=pick(s,enemyAttackFaces(s));
  s.healMultiplier=pick(s,ITEM_MULTIPLIERS.heal);s.boostMultiplier=pick(s,ITEM_MULTIPLIERS.boost);
  s.usedHeal=false; s.doubled=false; s.turn++;
  if(s.skill){const k=s.skill,code=skillFor(s.active).code;
    if(k.nextMax){s.attack=Math.max(...s.active.faces);k.nextMax=false;}
    if(!k.used&&((code==='steady'&&s.attack===Math.min(...s.active.faces))||(code==='repeat'&&s.attack===k.previousRoll))){s.attack=code==='steady'?[...s.active.faces].sort((a,b)=>a-b)[Math.floor(s.active.faces.length/2)]:Math.max(...s.active.faces);trigger(s);}
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
function finishReward(s: State) {
  if(!s.owned.includes(s.enemy)) { s.recruit=s.enemy; s.phase='recruit'; s.message='它想和你一起冒险！'; }
  else { next(s); }
}
function beginEggHunt(s: State) {
  s.phase='nest';s.eggHunt={limit:rankForStage(s.step)==='boss'?3:2,candidates:[],selected:-1};
  s.message='草丛后藏着一个巢穴，找找看！';
}
export function act(before: State, a: Action): State {
  const s: State = JSON.parse(JSON.stringify(before)); let valid=false;
  if(s.phase==='encounter') {
    if(a==='switch' && s.reserve) { [s.active,s.reserve]=[s.reserve,s.active]; s.message='已切换伙伴 · 生命比例保持'; valid=true; }
    if(a==='reroll' && s.swaps>0 && rankForStage(s.step)!=='boss') { s.swaps--; encounter(s,true); s.message='换了一个对手'; valid=true; }
    if(a==='challenge') { s.active=preferredPet(s,s.active);s.phase='battle';s.skill={used:false,attacks:0,shield:0,poison:0,nextMax:false,previousRoll:0,event:'',lastDamage:0,lastTaken:0}; roll(s); s.message='点数已确定，选择你的行动'; valid=true; }
  } else if(s.phase==='battle') {
    const k=s.skill,code=skillFor(s.active).code;
    if(k){k.event='';k.lastDamage=0;k.lastTaken=0;}
    if(a==='heal' && !s.usedHeal && s.potions>0 && s.hpRatio<1) {
      const amount=healAmount(s)+(k&&!k.used&&code==='healing'?2:0),recovered=Math.min(amount,maxHP(s)-hp(s));
      s.potions--;s.usedHeal=true;
      if(k&&!k.used){if(code==='healing')trigger(s);if(code==='refund'){s.potions++;trigger(s);}if(code==='overflow'&&amount>maxHP(s)-hp(s)){k.shield=Math.min(6,Math.floor(amount-(maxHP(s)-hp(s))));trigger(s);}}
      s.hpRatio=Math.min(1,s.hpRatio+amount/maxHP(s));s.message='治疗 ×'+s.healMultiplier+' · 恢复 '+recovered+' 点生命';valid=true;
    }
    if(a==='boost' && !s.doubled && s.boosts>0) {s.boosts--;s.doubled=true;if(k&&!k.used&&code==='charged'){s.attack=Math.max(...s.active.faces);trigger(s);}s.message='本回合攻击 ×'+s.boostMultiplier+' · 造成 '+attackAmount(s);valid=true;}
    if(a==='attack'||a==='guard') {
      valid=true;
      const previousEnemy=s.enemyHP;let slow=0;
      if(a==='attack'){
        const dealt=Math.min(s.enemyHP,attackAmount(s));s.enemyHP-=dealt;
        if(k){k.attacks++;if(!k.used){
          if(code==='opening'||(code==='heavy'&&k.attacks===3))trigger(s);
          if(code==='venom'){k.poison=3;trigger(s);}
          if(code==='slow'){slow=2;trigger(s);}
          if(code==='leech'){s.hpRatio=Math.min(1,s.hpRatio+Math.min(Math.ceil(dealt*.2),Math.ceil(maxHP(s)*.25))/maxHP(s));trigger(s);}
        }}
      }else if(k&&!k.used){if(code==='focus'){k.nextMax=true;trigger(s);}if(code==='barrier'){k.shield=6;trigger(s);}}
      if(k&&k.poison>0&&s.enemyHP>0){s.enemyHP=Math.max(0,s.enemyHP-2);k.poison--;k.event=k.event||'毒素 −2';}
      if(k)k.lastDamage=previousEnemy-s.enemyHP;
      if(s.enemyHP===0) {
        s.warmth=Math.min(9999,(s.warmth||0)+(rankForStage(s.step)==='boss'?3:rankForStage(s.step)==='elite'?2:1));
        if(rankForStage(s.step)==='boss'){if(s.step===TOTAL_STAGES)s.wins++;if(!s.owned.includes(s.enemy))s.owned.push(s.enemy);beginEggHunt(s);}
        else {s.phase='reward';s.message='战斗胜利！领取战利品';}
      } else {
        let damage=a==='guard'?guardDamage(s.enemyAttack):Math.max(1,s.enemyAttack-slow);
        if(k){if(!k.used&&code==='armor'){damage=Math.max(1,damage-2);trigger(s);}if(!k.used&&code==='evade'){damage=0;trigger(s);}const blocked=Math.min(k.shield,damage);damage-=blocked;k.shield-=blocked;k.lastTaken=damage;}
        s.hpRatio=Math.max(0,s.hpRatio-damage/maxHP(s));
        if(k&&!k.used&&code==='emergency'&&s.hpRatio>1e-8&&s.hpRatio<=.3){s.hpRatio=Math.min(1,s.hpRatio+Math.ceil(maxHP(s)*.25)/maxHP(s));trigger(s);}
        s.message=(a==='guard'?'挡住了攻击，只受 ':'对手反击，受到 ')+damage+' 点伤害';
        if(s.hpRatio<=1e-8) {s.hpRatio=0;s.phase='lost';s.message='伙伴累了，休息后再出发吧';}
        else roll(s);
      }
    }
  } else if(s.phase==='nest' && s.eggHunt) {
    const hunt=s.eggHunt;
    if(a==='eggSearch' && hunt.candidates.length<hunt.limit){
      const roll=rand(s)*100,rarity:EggRarity=roll<EGG_RATES.normal?'normal':roll<EGG_RATES.normal+EGG_RATES.SR?'SR':'SSR';
      const affinity=pick(s,ids);
      hunt.candidates.push({id:s.wins+'-'+s.step+'-'+s.revision+'-'+s.seed,rarity,affinity,stage:s.step});
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
    delete s.eggHunt;if(s.step===TOTAL_STAGES){s.phase='won';s.message='冒险完成！';}else if(rankForStage(s.step)==='boss')next(s);else finishReward(s);valid=true;
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
  } else if(s.phase==='recruit') {
    if(a==='invite' && s.recruit) {
      if(!s.owned.includes(s.recruit))s.owned.push(s.recruit);
      s.phase='team';s.message='新伙伴已收入收藏';valid=true;
    }
    if(a==='skip'){next(s);valid=true;}
  } else if(s.phase==='team') {
    if(a==='replace' && s.recruit) {
      const p=preferredPet(s,pet(s.recruit));p.faces=p.faces.map(x=>x+growthTier(s.step));
      rememberParty(s);replacePartyReserve(s,p);next(s);s.message='新伙伴已成为候补，战前可切换';valid=true;
    }
    if(a==='collect'){next(s);s.message='新伙伴已留在收藏，队伍保持';valid=true;}
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
    if(s.roster!==undefined&&(!s.roster||typeof s.roster!=='object'||Array.isArray(s.roster)||Object.keys(s.roster).some(id=>!ids.includes(id as PetId)||!validPet(s.roster![id])||s.roster![id].id!==id)))return null;
    if(!['encounter','battle','reward','recruit','team','won','lost','nest','eggClaimed'].includes(s.phase))return null;
    if(![s.seed,s.step,s.hpRatio,s.hpBonus,s.potions,s.boosts,s.swaps,s.enemyHP,s.enemyMax,s.revision,s.wins,s.attack,s.heal,s.enemyAttack,s.turn].every(finite))return null;
    if(s.step<1||s.step>TOTAL_STAGES||!Number.isInteger(s.step)||s.hpRatio<0||s.hpRatio>1||s.hpBonus<0||s.hpBonus>100)return null;
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
    const validEgg=(e:any)=>e&&typeof e.id==='string'&&['normal','SR','SSR'].includes(e.rarity)&&ids.includes(e.affinity)&&[5,10,15,20].includes(e.stage);
    if(s.eggs===undefined)s.eggs=[];
    if(!Array.isArray(s.eggs)||!s.eggs.every(validEgg)||s.eggs.some((e,i)=>s.eggs!.findIndex(v=>v.id===e.id)!==i))return null;
    if(s.phase==='nest'||s.phase==='eggClaimed'){
      const h=s.eggHunt;if(![5,10,15,20].includes(s.step)||!h||h.limit!==(rankForStage(s.step)==='boss'?3:2)||!Array.isArray(h.candidates)||h.candidates.length>h.limit||!h.candidates.every(e=>validEgg(e)&&e.stage===s.step)||!Number.isInteger(h.selected)||h.selected<(h.candidates.length?0:-1)||h.selected>=h.candidates.length)return null;
      if(h.candidates.some((e,i)=>h.candidates.findIndex(v=>v.id===e.id)!==i))return null;
      if(s.phase==='eggClaimed'&&(!h.candidates[h.selected]||!s.eggs.some(e=>e.id===h.candidates[h.selected].id)))return null;
    }else delete s.eggHunt;
    if(!validHatching(s))return null;
    if(s.contentVersion!==2){if(s.phase==='encounter'){const swaps=s.swaps;encounter(s,false);s.swaps=rankForStage(s.step)==='boss'?0:swaps;}s.contentVersion=2;}
    return s;
  } catch {return null;}
}
export function equipReserve(before: State, id: PetId): State {
  if(!canManageParty(before)||!before.owned.includes(id)||id===before.active.id||id===before.reserve?.id)return before;
  const s:State=JSON.parse(JSON.stringify(before));rememberParty(s);replacePartyReserve(s,preferredPet(s,s.roster![id]||pet(id)));s.revision++;s.message='已设为候补 · 生命不会恢复';return s;
}
export function partyChoices(s:State):PetId[]{
  return s.partySlots?s.partySlots.slice():Array.from(new Set([s.active.id,...(s.reserve?[s.reserve.id]:[]),...s.owned,...(['fox','bud','turtle'] as PetId[])])).slice(0,3);
}
function replacePartyReserve(s:State,chosen:Pet){
  const slots=partyChoices(s);
  if(!slots.includes(chosen.id)){const index=s.reserve?slots.indexOf(s.reserve.id):-1;slots[index>=0?index:slots.length-1]=chosen.id;}
  s.partySlots=slots;s.reserve=chosen;
}
function rememberParty(s:State){s.roster=s.roster||{};s.roster[s.active.id]=s.active;if(s.reserve)s.roster[s.reserve.id]=s.reserve;}
export function selectActive(before:State,id:PetId):State {
  if(before.phase!=='encounter'||!before.owned.includes(id)||id===before.active.id)return before;
  const s:State=JSON.parse(JSON.stringify(before));rememberParty(s);s.partySlots=partyChoices(before);
  if(!s.partySlots.includes(id)){const index=s.partySlots.findIndex(x=>x!==s.active.id&&x!==s.reserve?.id);s.partySlots[index>=0?index:2]=id;}
  const chosen=preferredPet(s,s.roster![id]||pet(id));s.reserve=s.active;s.active=chosen;s.revision++;return s;
}
export const canManageParty = (s: State) => s.phase !== 'battle';
// Home roster slots are explicit: lead, reserve 1, reserve 2. Keep the run and face upgrades intact.
export function homeParty(s:State):PetId[]{return Array.from(new Set([s.active.id,...(s.reserve?[s.reserve.id]:[]),...partyChoices(s),...s.owned])).slice(0,3);}
export function assignPartySlot(before:State,id:PetId,index:number):State {
  if(!canManageParty(before)||!before.owned.includes(id)||![0,1,2].includes(index))return before;
  const slots=homeParty(before);if(slots[index]===id)return before;
  const s=clone(before);rememberParty(s);const previous=slots.indexOf(id);
  if(previous>=0)slots[previous]=slots[index];slots[index]=id;
  s.partySlots=slots;s.active=preferredPet(s,s.roster![slots[0]]||pet(slots[0]));
  s.reserve=s.owned.includes(slots[1])?preferredPet(s,s.roster![slots[1]]||pet(slots[1])):null;
  s.revision++;return s;
}
export function continueAdventure(before:State):State {
  if(before.phase!=='won'||before.step!==10)return before;
  const s:State=JSON.parse(JSON.stringify(before));next(s);s.revision++;return s;
}
export function restartRun(before: State, seed=Date.now()): State {
  const s=fresh(seed,before.owned,before.wins);
  s.eggs=JSON.parse(JSON.stringify(before.eggs||[]));
  for(const key of ['incubators','warmth','hatchSeed','hatchedEggIds','qualities','preferredRarities','pendingHatch'])if(before[key]!==undefined)s[key]=JSON.parse(JSON.stringify(before[key]));
  s.active=preferredPet(s,pet(before.active.id));s.reserve=before.reserve?preferredPet(s,pet(before.reserve.id)):null;
  s.partySlots=partyChoices(before);
  return s;
}

export const RARITIES:EggRarity[]=['normal','SR','SSR'];
export const rarityName=(r:EggRarity='normal')=>r==='normal'?'R':r;
export const qualityHP=(r:EggRarity='normal')=>r==='SSR'?4:r==='SR'?2:0;
export const HATCH_DURATION=30*60*1000, HATCH_ACCELERATION=5*60*1000;
export const HATCH_RATES={normal:[90,9,1],SR:[0,95,5],SSR:[0,0,100]};
export function unlockedRarities(s:State,id:PetId):EggRarity[]{return s.qualities?.[id]?.slice()||(s.owned.includes(id)?['normal']:[]);}
export function preferredRarity(s:State,id:PetId):EggRarity {const unlocked=unlockedRarities(s,id);return s.preferredRarities?.[id]||RARITIES.filter(r=>unlocked.includes(r)).pop()||'normal';}
function preferredPet(s:State,p:Pet):Pet {const r=preferredRarity(s,p.id),n={...p};if(r==='normal')delete n.rarity;else n.rarity=r;return n;}
const clone=(s:State):State=>JSON.parse(JSON.stringify(s));
export function setPetRarity(before:State,id:PetId,rarity:EggRarity):State {
  if(before.phase==='battle'||!unlockedRarities(before,id).includes(rarity))return before;
  const s=clone(before);s.preferredRarities=s.preferredRarities||{};s.preferredRarities[id]=rarity;
  if(s.active.id===id)s.active=preferredPet(s,s.active);if(s.reserve?.id===id)s.reserve=preferredPet(s,s.reserve);
  if(s.roster?.[id])s.roster[id]=preferredPet(s,s.roster[id]!);s.revision++;return s;
}
export const availableEggs=(s:State)=>(s.eggs||[]).filter(e=>!(s.hatchedEggIds||[]).includes(e.id)&&!(s.incubators||[]).some(slot=>slot?.eggId===e.id));
export const hatchRemaining=(slot:Incubation,now=Date.now())=>Math.max(0,slot.readyAt-now);
export function startIncubation(before:State,eggId:string,index:number,now=Date.now()):State {
  if(![0,1].includes(index)||before.incubators?.[index]||!Number.isFinite(now)||now<0)return before;
  const egg=availableEggs(before).find(e=>e.id===eggId);if(!egg)return before;
  const s=clone(before);s.incubators=s.incubators||[null,null];
  s.hatchSeed=(Math.imul(s.hatchSeed===undefined?(s.seed^0x9e3779b9)>>>0:s.hatchSeed,1664525)+1013904223)>>>0;
  const roll=s.hatchSeed/4294967296*100,weights=HATCH_RATES[egg.rarity];
  const result:EggRarity=roll<weights[0]?'normal':roll<weights[0]+weights[1]?'SR':'SSR';
  s.incubators[index]={eggId,startedAt:now,readyAt:now+HATCH_DURATION,result};s.revision++;return s;
}
export function accelerateHatch(before:State,index:number,now=Date.now()):State {
  const slot=before.incubators?.[index];if(!slot||!Number.isFinite(now)||now<slot.startedAt||hatchRemaining(slot,now)===0||(before.warmth||0)<1)return before;
  const s=clone(before);s.warmth!--;s.incubators![index]!.readyAt=Math.max(now,slot.readyAt-HATCH_ACCELERATION);s.revision++;return s;
}
export function claimHatch(before:State,index:number,now=Date.now()):State {
  const slot=before.incubators?.[index];if(!slot||before.pendingHatch||!Number.isFinite(now)||now<slot.startedAt||hatchRemaining(slot,now)>0)return before;
  const egg=before.eggs?.find(e=>e.id===slot.eggId);if(!egg||(before.hatchedEggIds||[]).includes(egg.id))return before;
  const s=clone(before),id=egg.affinity,unlocked=unlockedRarities(s,id),duplicate=unlocked.includes(slot.result),old=preferredRarity(s,id);
  s.qualities=s.qualities||{};s.qualities[id]=duplicate?unlocked:[...unlocked,slot.result];
  if(!s.owned.includes(id))s.owned.push(id);
  s.preferredRarities=s.preferredRarities||{};
  s.preferredRarities[id]=RARITIES.indexOf(slot.result)>RARITIES.indexOf(old)?slot.result:old;
  if(s.phase!=='battle'){if(s.active.id===id)s.active=preferredPet(s,s.active);if(s.reserve?.id===id)s.reserve=preferredPet(s,s.reserve);}
  const warmthGain=duplicate?{normal:3,SR:8,SSR:20}[slot.result]:0;s.warmth=Math.min(9999,(s.warmth||0)+warmthGain);
  s.hatchedEggIds=[...(s.hatchedEggIds||[]),egg.id];s.incubators![index]=null;
  s.pendingHatch={eggId:egg.id,petId:id,rarity:slot.result,duplicate,warmthGain};s.revision++;return s;
}
export function acknowledgeHatch(before:State):State {if(!before.pendingHatch)return before;const s=clone(before);delete s.pendingHatch;s.revision++;return s;}

const SKILLS={
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
type SkillCode=keyof typeof SKILLS;
const PET_SKILLS:Record<PetId,[SkillCode,SkillCode,SkillCode]>={
  fox:['opening','steady','charged'],bud:['healing','refund','emergency'],turtle:['armor','focus','barrier'],
  cotton:['opening','steady','emergency'],otter:['healing','overflow','refund'],spark:['opening','repeat','charged'],
  seal:['armor','slow','focus'],ape:['opening','heavy','charged'],slug:['opening','venom','leech'],mole:['armor','focus','barrier'],
  bird:['opening','slow','evade'],owl:['opening','steady','charged'],beetle:['armor','venom','refund'],ghost:['opening','venom','leech'],
  dragon:['opening','heavy','charged'],lynx:['opening','steady','leech'],rhino:['armor','barrier','evade'],deer:['healing','refund','emergency']
};
export function skillFor(p:Pick<Pet,'id'|'rarity'>){const code=PET_SKILLS[p.id][RARITIES.indexOf(p.rarity||'normal')],v=SKILLS[code];return {code,name:v[0],description:v[1]+' 每场限一次。'};}
function trigger(s:State){if(s.skill){s.skill.used=true;s.skill.event=skillFor(s.active).name+'！';}}
export function skillStatus(s:State):string {
  const k=s.skill;if(!k)return '技能从下一场生效';
  const status=k.used?'已触发':'可触发 1 次',extra=k.shield?' · 护盾 '+k.shield:k.poison?' · 毒 '+k.poison+' 回合':k.nextMax?' · 下回合最高点数':'';
  return rarityName(s.active.rarity)+' · '+skillFor(s.active).name+' · '+status+extra;
}
function validHatching(s:State):boolean {
  const uint=(n:any)=>Number.isSafeInteger(n)&&n>=0,object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);
  if(s.warmth!==undefined&&(!uint(s.warmth)||s.warmth>9999))return false;
  if(s.hatchSeed!==undefined&&(!uint(s.hatchSeed)||s.hatchSeed>4294967295))return false;
  if(s.qualities!==undefined&&(!object(s.qualities)||Object.keys(s.qualities).some(id=>!ids.includes(id as PetId)||!s.owned.includes(id as PetId)||!Array.isArray(s.qualities![id])||!s.qualities![id].length||s.qualities![id].some((r:any,i:number,a:any[])=>!RARITIES.includes(r)||a.indexOf(r)!==i))))return false;
  if(s.preferredRarities!==undefined&&(!object(s.preferredRarities)||Object.keys(s.preferredRarities).some(id=>!ids.includes(id as PetId)||!unlockedRarities(s,id as PetId).includes(s.preferredRarities![id]))))return false;
  if(s.hatchedEggIds!==undefined&&(!Array.isArray(s.hatchedEggIds)||s.hatchedEggIds.some((id,i,a)=>!s.eggs!.some(e=>e.id===id)||a.indexOf(id)!==i)))return false;
  if(s.incubators!==undefined){if(!Array.isArray(s.incubators)||s.incubators.length!==2)return false;
    for(const slot of s.incubators){if(slot===null)continue;const egg=s.eggs!.find(e=>e.id===slot?.eggId);
      if(!egg||!uint(slot.startedAt)||!uint(slot.readyAt)||slot.readyAt<slot.startedAt||!RARITIES.includes(slot.result)||RARITIES.indexOf(slot.result)<RARITIES.indexOf(egg.rarity)||(s.hatchedEggIds||[]).includes(slot.eggId)||s.incubators.filter(x=>x?.eggId===slot.eggId).length!==1)return false;}
  }
  if(s.pendingHatch){const r=s.pendingHatch,e=s.eggs!.find(e=>e.id===r.eggId);if(!e||e.affinity!==r.petId||!(s.hatchedEggIds||[]).includes(r.eggId)||!unlockedRarities(s,r.petId).includes(r.rarity)||typeof r.duplicate!=='boolean'||r.warmthGain!==(r.duplicate?{normal:3,SR:8,SSR:20}[r.rarity]:0))return false;}
  if(s.skill){const k=s.skill;if(!object(k)||typeof k.used!=='boolean'||typeof k.nextMax!=='boolean'||typeof k.event!=='string'||![k.attacks,k.shield,k.poison,k.previousRoll,k.lastDamage,k.lastTaken].every(uint)||k.poison>3||k.shield>6)return false;}
  return true;
}
