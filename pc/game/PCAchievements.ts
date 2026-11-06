import * as M from './PMModel';
import {PCSocialState,isSteamId} from './PCSocial';
import {steam} from './PCSteam';
import {ACHIEVEMENT_IDS} from './PCAchievementIds';
import type {PCCloudBridge} from './PCCloud';

/** Derived only from existing game facts; no extra grind or gameplay RNG. */
export function earnedAchievements(game:M.State,social:PCSocialState):string[]{
  const maps=new Set(game.clearedMaps||[]).size,gyms=new Set(game.gymBadges||[]).size;
  const pets=game.pets||[],species=new Set([...(game.owned||[]),...pets.map(p=>p.id)].filter(id=>M.PET_IDS.includes(id))).size;
  const hatched=new Set(game.hatchedEggIds||[]).size;
  const cooking=(game as any).pcCooking,meals=Object.entries(cooking?.meals||{}).filter(([,n])=>Number(n)>0);
  const flags=[game.journey?.stage==='done',maps>=1,maps>=6,maps>=12,species>=10,species>=30,species>=60,hatched>=1,hatched>=10,pets.some(p=>p.rarity==='SSR'),pets.some(p=>p.shiny),gyms>=1,gyms>=9,meals.length>0||!!cooking?.active,meals.some(([key])=>key.endsWith(':3'))||cooking?.active?.quality===3,social.firstRaidClears.includes('molten-crown')];
  return ACHIEVEMENT_IDS.filter((_,i)=>flags[i]);
}
/** Account-bound ledger travels in the profile and remembers consumed/temporary evidence offline. */
export function recordAchievements(game:M.State,social:PCSocialState):PCSocialState{
  const earned=earnedAchievements(game,social),known=new Set(social.achievements||[]);
  if(earned.every(id=>known.has(id)))return social;
  return {...social,achievements:ACHIEVEMENT_IDS.filter(id=>known.has(id)||earned.includes(id))};
}
export class PCAchievementSync {
  private next=0;private last='';
  constructor(private owner:string,private bridge:PCCloudBridge=steam,private now:()=>number=()=>performance.now()){}
  update(social:PCSocialState){
    if(!isSteamId(this.owner)||social.ownerSteamId!==this.owner)return;
    const ids=social.achievements||[],key=ids.join(',');if(!ids.length||key===this.last&&this.now()<this.next)return;
    this.last=key;this.next=this.now()+30000;
    try{const r=this.bridge.request('status'),s=r.data;if(!r.ok||!s?.available||s.online===false||s.appId!==5500200||s.steamId!==this.owner)return;
      // StoreStats acceptance is not server confirmation. Native callback retains failed work for retry.
      this.bridge.request('achievements.sync',{ids});
    }catch{/* Pending achievements remain in the durable profile. */}
  }
}
