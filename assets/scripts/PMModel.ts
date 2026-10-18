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
export interface Pet { id: PetId; faces: number[] }
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
export const attackAmount = (s: State) => s.attack * (s.doubled ? s.boostMultiplier : 1);
export const guardDamage = (incoming: number) => Math.max(1, Math.round(incoming / 100));
const rand = (s: State) => { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; };
const pick = <T>(s: State, a: T[]): T => a[Math.floor(rand(s) * a.length)];
export const maxHP = (s: State) => PETS[s.active.id].hp + s.hpBonus;
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
    previousReward:'', recruit:null, revision:0, wins, eggs:[], message:'先选伙伴，再开始挑战'};
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
    if(a==='challenge') { s.phase='battle'; roll(s); s.message='点数已确定，选择你的行动'; valid=true; }
  } else if(s.phase==='battle') {
    if(a==='heal' && !s.usedHeal && s.potions>0 && s.hpRatio<1) {
      const recovered=Math.min(healAmount(s),maxHP(s)-hp(s));
      s.potions--;s.usedHeal=true;s.hpRatio=Math.min(1,s.hpRatio+healAmount(s)/maxHP(s));s.message='治疗 ×'+s.healMultiplier+' · 恢复 '+recovered+' 点生命';valid=true;
    }
    if(a==='boost' && !s.doubled && s.boosts>0) {s.boosts--;s.doubled=true;s.message='本回合攻击 ×'+s.boostMultiplier+' · 造成 '+attackAmount(s);valid=true;}
    if(a==='attack'||a==='guard') {
      valid=true;
      if(a==='attack')s.enemyHP=Math.max(0,s.enemyHP-attackAmount(s));
      if(s.enemyHP===0) {
        if(rankForStage(s.step)==='boss'){if(s.step===TOTAL_STAGES)s.wins++;if(!s.owned.includes(s.enemy))s.owned.push(s.enemy);beginEggHunt(s);}
        else {s.phase='reward';s.message='战斗胜利！领取战利品';}
      } else {
        const damage=a==='guard'?guardDamage(s.enemyAttack):s.enemyAttack;
        s.hpRatio=Math.max(0,s.hpRatio-damage/maxHP(s));
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
      const p=pet(s.recruit);p.faces=p.faces.map(x=>x+growthTier(s.step));
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
    const validPet=(p: any)=>p&&ids.includes(p.id)&&faces(p.faces);
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
    if(s.contentVersion!==2){if(s.phase==='encounter'){const swaps=s.swaps;encounter(s,false);s.swaps=rankForStage(s.step)==='boss'?0:swaps;}s.contentVersion=2;}
    return s;
  } catch {return null;}
}
export function equipReserve(before: State, id: PetId): State {
  if(!canManageParty(before)||!before.owned.includes(id)||id===before.active.id||id===before.reserve?.id)return before;
  const s:State=JSON.parse(JSON.stringify(before));rememberParty(s);replacePartyReserve(s,s.roster![id]||pet(id));s.revision++;s.message='已设为候补 · 生命不会恢复';return s;
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
  const chosen=s.roster![id]||pet(id);s.reserve=s.active;s.active=chosen;s.revision++;return s;
}
export const canManageParty = (s: State) => s.phase !== 'battle';
export function continueAdventure(before:State):State {
  if(before.phase!=='won'||before.step!==10)return before;
  const s:State=JSON.parse(JSON.stringify(before));next(s);s.revision++;return s;
}
export function restartRun(before: State, seed=Date.now()): State {
  const s=fresh(seed,before.owned,before.wins);
  s.eggs=JSON.parse(JSON.stringify(before.eggs||[]));
  s.active=pet(before.active.id);s.reserve=before.reserve?pet(before.reserve.id):null;
  s.partySlots=partyChoices(before);
  return s;
}
