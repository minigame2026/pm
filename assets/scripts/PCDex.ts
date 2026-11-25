import * as M from './PMModel';

export interface PCDexState {version:1; collected:string[]; claimed:number[];}
export const DEX_SPECIES=M.PET_IDS.filter(id=>!M.FRIEND_PET_IDS.includes(id));
export const DEX_TOTAL=DEX_SPECIES.length*M.RARITIES.length*2;
export const DEX_REWARDS=Array.from({length:15},(_,i)=>({id:i+1,mapId:i,required:Math.ceil(DEX_TOTAL*(i+1)/15)}));
export const dexKey=(pet:Pick<M.Pet,'id'|'rarity'|'shiny'>)=>M.formKey(pet)+(pet.shiny?':shiny':'');
const validKeys=new Set<string>();
for(const id of DEX_SPECIES)for(const rarity of M.RARITIES){const key=M.formKey({id,rarity});validKeys.add(key);validKeys.add(key+':shiny');}

export function validDexState(value:unknown):boolean {
  if(value===undefined)return true;
  const d=value as PCDexState;
  return !!d&&d.version===1&&Array.isArray(d.collected)&&d.collected.length<=validKeys.size&&new Set(d.collected).size===d.collected.length&&d.collected.every(k=>validKeys.has(k))&&Array.isArray(d.claimed)&&d.claimed.length<=15&&new Set(d.claimed).size===d.claimed.length&&d.claimed.every(id=>Number.isInteger(id)&&id>=1&&id<=15&&d.collected.length>=DEX_REWARDS[id-1].required);
}
/** Record obtained forms before and after a transaction, including consumed parents. */
export function recordDex(previous:PCDexState|undefined,...states:M.State[]):PCDexState {
  const collected=new Set(previous?.collected||[]);
  for(const state of states){
    for(const pet of state.pets||[]){const key=dexKey(pet);if(validKeys.has(key))collected.add(key);}
    if(state.journey?.stage==='done'&&state.journey.starter)collected.add(M.formKey({id:state.journey.starter,rarity:'normal'}));
  }
  if(previous&&collected.size===previous.collected.length)return previous;
  return {version:1,collected:Array.from(collected),claimed:previous?.claimed.slice()||[]};
}
export function claimDexReward(game:M.State,previous:PCDexState|undefined,id:number,random:()=>number=Math.random){
  const book=recordDex(previous,game),reward=DEX_REWARDS.find(r=>r.id===id),map=reward&&M.MAPS[reward.mapId];
  const unchanged={game,book,changed:false,eggId:''};
  if(!reward||!map||book.claimed.includes(id)||book.collected.length<reward.required)return unchanged;
  const eggId='pc-dex-v1-'+id;
  if(game.eggs?.some(e=>e.id===eggId))return unchanged;
  const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)return unchanged;
  const egg:M.Egg={id:eggId,affinity:map.pets[Math.floor(roll*map.pets.length)],rarity:'SSR',stage:5,mapId:map.id};
  return {game:{...game,eggs:[...(game.eggs||[]),egg],revision:game.revision+1},book:{...book,claimed:[...book.claimed,id]},changed:true,eggId};
}
