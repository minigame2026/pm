/** Explicit user-approved PC rules; the mobile model stays byte-for-byte unchanged. */
function applyPCModelOverrides(source){
 const replace=(from,to)=>{if(!source.includes(from))throw Error('PC model integration hook changed: '+from.slice(0,80));source=source.replace(from,to);};
 source="import {PCCookingState,foodAttack,foodDefense,foodHeal,foodHealth} from './PCCooking';\n"+source;
 replace('export interface State {','export interface State {\n  pcCooking?:PCCookingState;');
 replace("'arena','gymBadges']","'arena','gymBadges','pcCooking']");
 replace('EXPEDITION_COST=BUILD_TEST_MODE?1:5','EXPEDITION_COST=0');
 // Production PC care timers; preserve deadlines already committed to old saves.
 replace('HATCH_DURATION=BUILD_TEST_MODE?3000:30*60*1000','HATCH_DURATION=BUILD_TEST_MODE?3000:15*60*1000');
 replace('{normal:BUILD_TEST_MODE?3000:10*60*1000,SR:BUILD_TEST_MODE?3000:20*60*1000,SSR:HATCH_DURATION}',
   '{normal:BUILD_TEST_MODE?3000:5*60*1000,SR:BUILD_TEST_MODE?3000:10*60*1000,SSR:HATCH_DURATION}');
 replace('BREED_DURATION=BUILD_TEST_MODE?3000:30*60*1000','BREED_DURATION=BUILD_TEST_MODE?3000:10*60*1000');
 replace('b.readyAt!==b.startedAt+BREED_DURATION','(b.readyAt!==b.startedAt+BREED_DURATION&&b.readyAt!==b.startedAt+30*60*1000&&((b as Breeding&{pcHelpCompletedAt?:number}).pcHelpCompletedAt!==b.readyAt||!Number.isSafeInteger(b.readyAt)||b.readyAt<b.startedAt||b.readyAt>b.startedAt+Math.max(BREED_DURATION,30*60*1000)))');
 // PC gyms 1–9 use the world 4–12 combat budget. Versions 1–5 keep their
 // committed encounter on reload; only a newly generated opponent adopts v6.
 replace('gymDifficultyVersion?:1|2|3|4|5;', 'gymDifficultyVersion?:1|2|3|4|5|6;');
 replace('![1,2,3,4,5].includes(s.gymDifficultyVersion)', '![1,2,3,4,5,6].includes(s.gymDifficultyVersion)');
 replace('s.gymDifficultyVersion=5;', 's.gymDifficultyVersion=6;');
 replace('export const enemyAttackFaces = (s: State): number[] => {', `export const enemyAttackFaces = (s: State): number[] => {
  if(s.gymRun!==undefined&&s.gymDifficultyVersion===6){
    const map=s.gymRun+3,pool=encounterPool(s.step,map);
    const average=pool.reduce((sum,enemy)=>{
      const faces=enemyAttackFaces({...s,gymRun:undefined,gymDifficultyVersion:undefined,adventureDifficultyVersion:1,mapId:map,enemy,enemyRarity:encounterRarity(s.step,map)});
      return sum+faces.reduce((a,b)=>a+b,0)/faces.length;
    },0)/pool.length;
    return [.8,1,1.2].map(v=>Math.max(1,Math.round(average*v)));
  }`);
 replace('const health=enemyHealthForStage(s.step,s.mapId||0);\n  s.enemyMax=s.gymRun!==undefined?Math.round(Math.round(health*1.2)*GYM_DIFFICULTY_UPLIFT):health;s.enemyHP=s.enemyMax;',
   'const health=enemyHealthForStage(s.step,s.gymRun!==undefined?s.gymRun+3:s.mapId||0);\n  s.enemyMax=health;s.enemyHP=s.enemyMax;');
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
