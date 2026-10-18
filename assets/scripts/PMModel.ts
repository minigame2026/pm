/** Engine-independent rules. Every action returns a committed, serializable state. */
export type PetId = 'fox' | 'bud' | 'turtle';
export const PETS = {
  fox: { name: '闪尾狐', trait: '爆发型', hp: 22, faces: [1, 3, 7], color: '#ffb24e' },
  bud: { name: '芽芽龙', trait: '稳定型', hp: 24, faces: [3, 3, 4], color: '#8bd6a0' },
  turtle: { name: '岩背龟', trait: '耐打型', hp: 30, faces: [2, 2, 4], color: '#7fc9f4' },
};
export type Phase = 'encounter' | 'battle' | 'reward' | 'recruit' | 'team' | 'won' | 'lost';
export interface Pet { id: PetId; faces: number[] }
export interface Reward { kind: 'hp' | 'attack' | 'heal' | 'potion' | 'boost'; values: number[]; title: string }
export interface State {
  version: 1; seed: number; step: number; phase: Phase; active: Pet; reserve: Pet | null;
  owned: PetId[]; hpRatio: number; hpBonus: number; potions: number; boosts: number;
  healFaces: number[]; healMultiplier: number; boostMultiplier: number; usedHeal: boolean; doubled: boolean; swaps: number;
  enemy: PetId; enemyHP: number; enemyMax: number; attack: number; heal: number; enemyAttack: number;
  turn: number; reward: Reward; previousReward: string; recruit: PetId | null; revision: number;
  wins: number; message: string;
  roster?: Partial<Record<PetId,Pet>>;
}
export type Action = 'challenge' | 'reroll' | 'switch' | 'attack' | 'guard' | 'heal' | 'boost' |
  'take' | 'keep' | 'reward0' | 'invite' | 'skip' | 'replace' | 'collect';
const ids: PetId[] = ['fox', 'bud', 'turtle'];
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
export const enemyName = (s: State) => s.step === 9 ? '花冠守护者' : PETS[s.enemy].name;
export const enemyAttackFaces = (s: State): number[] => {
  if(s.step===9)return [3,5,7,10];
  const tier=s.step<=3?0:s.step<=6?1:2;
  return ({fox:[1,1,7],bud:[2,2,3],turtle:[1,3,5]})[s.enemy].map(v=>v+tier);
};
export function fresh(seed = Date.now(), owned: PetId[] = ['fox', 'turtle'], wins = 0): State {
  const s: State = {version:1, seed:seed >>> 0, step:1, phase:'encounter', active:pet('fox'), reserve:pet('turtle'),
    owned:ids.filter(id=>id==='fox'||id==='turtle'||owned.indexOf(id)>=0), hpRatio:1, hpBonus:0, potions:3, boosts:2,
    healFaces:[3,5,7], healMultiplier:1, boostMultiplier:2, usedHeal:false, doubled:false, swaps:2, enemy:'bud', enemyHP:7, enemyMax:7,
    attack:0, heal:0, enemyAttack:0, turn:0, reward:{kind:'hp',values:[3],title:'生命上限 +3'},
    previousReward:'', recruit:null, revision:0, wins, message:'先选伙伴，再开始挑战'};
  encounter(s, false); return s;
}
function reward(s: State, excluded: string[] = []): Reward {
  const tier = s.step <= 3 ? 0 : s.step <= 6 ? 2 : 4;
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
  s.enemy=s.step===9?'bud':s.step===1&&!reroll?'bud':pick(s,reroll?ids.filter(x=>x!==s.enemy):ids);
  s.enemyMax=[7,9,11,14,17,20,23,26,45][s.step-1]; s.enemyHP=s.enemyMax;
  s.reward=reward(s); s.recruit=null;
  if(!reroll) s.swaps=s.step===9?0:2;
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
  if(!s.owned.includes(s.enemy)) { s.recruit=s.enemy; s.phase='recruit'; s.message='它想和你一起冒险！'; }
  else { next(s); }
}
export function act(before: State, a: Action): State {
  const s: State = JSON.parse(JSON.stringify(before)); let valid=false;
  if(s.phase==='encounter') {
    if(a==='switch' && s.reserve) { [s.active,s.reserve]=[s.reserve,s.active]; s.message='已切换伙伴 · 生命比例保持'; valid=true; }
    if(a==='reroll' && s.swaps>0 && s.step!==9) { s.swaps--; encounter(s,true); s.message='换了一个对手'; valid=true; }
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
        if(s.step===9){s.phase='won';s.wins++;s.message='这一程，伙伴们做到了！';}
        else {s.phase='reward';s.message='战斗胜利！领取战利品';}
      } else {
        const damage=a==='guard'?guardDamage(s.enemyAttack):s.enemyAttack;
        s.hpRatio=Math.max(0,s.hpRatio-damage/maxHP(s));
        s.message=(a==='guard'?'挡住了攻击，只受 ':'对手反击，受到 ')+damage+' 点伤害';
        if(s.hpRatio<=1e-8) {s.hpRatio=0;s.phase='lost';s.message='伙伴累了，休息后再出发吧';}
        else roll(s);
      }
    }
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
      const p=pet(s.recruit);p.faces=p.faces.map(x=>x+(s.step<=3?0:s.step<=6?2:4));
      rememberParty(s);s.reserve=p;next(s);s.message='新伙伴已成为候补，战前可切换';valid=true;
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
    if(!['encounter','battle','reward','recruit','team','won','lost'].includes(s.phase))return null;
    if(![s.seed,s.step,s.hpRatio,s.hpBonus,s.potions,s.boosts,s.swaps,s.enemyHP,s.enemyMax,s.revision,s.wins,s.attack,s.heal,s.enemyAttack,s.turn].every(finite))return null;
    if(s.step<1||s.step>9||!Number.isInteger(s.step)||s.hpRatio<0||s.hpRatio>1||s.hpBonus<0||s.hpBonus>100)return null;
    if(s.potions<0||s.potions>9||s.boosts<0||s.boosts>9||s.swaps<0||s.swaps>2)return null;
    if(!ids.includes(s.enemy)||!Array.isArray(s.owned)||!faces(s.healFaces))return null;
    // Recover the early preview's Set-serialization anomaly without dropping its run.
    if(s.owned.some(x=>typeof x==='object'&&x!==null))s.owned=ids.filter(id=>id==='fox'||id==='turtle'||s.owned.indexOf(id)>=0||s.active.id===id||s.reserve?.id===id||(s.phase==='team'&&s.recruit===id));
    if(!s.owned.every(x=>ids.includes(x)))return null;
    if(!s.reward||!['hp','attack','heal','potion','boost'].includes(s.reward.kind)||!faces(s.reward.values)||typeof s.reward.title!=='string')return null;
    if(['recruit','team'].includes(s.phase)&&(!s.recruit||!ids.includes(s.recruit)))return null;
    if(s.enemyMax<=0||s.enemyHP<0||s.enemyHP>s.enemyMax||typeof s.usedHeal!=='boolean'||typeof s.doubled!=='boolean')return null;
    // Preserve effects already committed in older saves; new turns roll multipliers.
    if(s.healMultiplier===undefined)s.healMultiplier=1;
    if(s.boostMultiplier===undefined)s.boostMultiplier=2;
    // Preserve a previous version's already-rolled x1; new turns use the current pool.
    if(!ITEM_MULTIPLIERS.heal.includes(s.healMultiplier)||![1,2,3,4].includes(s.boostMultiplier))return null;
    return s;
  } catch {return null;}
}
export function equipReserve(before: State, id: PetId): State {
  if(!canManageParty(before)||!before.owned.includes(id)||id===before.active.id||id===before.reserve?.id)return before;
  const s:State=JSON.parse(JSON.stringify(before));rememberParty(s);s.reserve=s.roster![id]||pet(id);s.revision++;s.message='已设为候补 · 生命不会恢复';return s;
}
function rememberParty(s:State){s.roster=s.roster||{};s.roster[s.active.id]=s.active;if(s.reserve)s.roster[s.reserve.id]=s.reserve;}
export function selectActive(before:State,id:PetId):State {
  if(before.phase!=='encounter'||!before.owned.includes(id)||id===before.active.id)return before;
  const s:State=JSON.parse(JSON.stringify(before));rememberParty(s);
  const chosen=s.roster![id]||pet(id);s.reserve=s.active;s.active=chosen;s.revision++;return s;
}
export const canManageParty = (s: State) => s.phase !== 'battle';
export function restartRun(before: State, seed=Date.now()): State {
  const s=fresh(seed,before.owned,before.wins);
  s.active=pet(before.active.id);s.reserve=before.reserve?pet(before.reserve.id):null;
  return s;
}
