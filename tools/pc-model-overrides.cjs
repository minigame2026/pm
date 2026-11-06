/** Explicit user-approved PC rules; the mobile model stays byte-for-byte unchanged. */
function applyPCModelOverrides(source){
 const replace=(from,to)=>{if(!source.includes(from))throw Error('PC model integration hook changed: '+from.slice(0,80));source=source.replace(from,to);};
 source="import {PCCookingState,foodAttack,foodDefense,foodHeal,foodHealth} from './PCCooking';\n"+source;
 replace('export interface State {','export interface State {\n  pcCooking?:PCCookingState;');
 replace("'arena','gymBadges']","'arena','gymBadges','pcCooking']");
 replace('EXPEDITION_COST=BUILD_TEST_MODE?1:5','EXPEDITION_COST=0');
 replace('export function enterExpedition(before:State,mapId:number,now=gameNow()):State {\n  if(!Number.isSafeInteger(now)||now<0)return before;', 'export function enterExpedition(before:State,mapId:number,now=gameNow()):State {\n  if(!Number.isSafeInteger(now)||now<0)now=before.seed;');
 replace('const current=syncStamina(before,now);if(current.stamina!.value<EXPEDITION_COST)return current;', 'const current=before;');
 replace('  if(s.stamina!.value===STAMINA_MAX)s.stamina!.updatedAt=now;\n  s.stamina!.value-=EXPEDITION_COST;s.expedition=true;rollEnemyVariant(s);return s;', '  s.expedition=true;rollEnemyVariant(s);return s;');
 for(const [name,fn] of [['attackAmount','foodAttack'],['enemyAttackAmount','foodDefense'],['healAmount','foodHeal'],['maxHP','foodHealth']]){
   const regex=new RegExp('(export const '+name+'\\s*=[^\\n]*?=>)\\s*([^\\n]+);');
   if(!regex.test(source))throw Error('PC food calculation hook changed: '+name);
   source=source.replace(regex,(_,prefix,expr)=>prefix+' '+fn+'(s.pcCooking,PETS[s.active.id].type,('+expr+'));');
 }
 // UI reads actual meal-adjusted health; internal rewards/events keep their original calculation.
 source+=`\nexport function pcPetCombat(s:State,key:string){
  const stats=petCombat(s,key),max=foodHealth(s.pcCooking,PETS[stats.pet.id].type,stats.max);
  return {...stats,max,hp:Math.max(0,Math.ceil(stats.ratio*max-1e-8))};
}\n`;
 return source;
}
module.exports={applyPCModelOverrides};
