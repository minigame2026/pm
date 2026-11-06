import { State, availableEggs, homeParty, isBreedingPet, attackAmount, petAttackFaces, petCombat, matchupMultiplier, canManageParty, assignPartySlot, acknowledgeHatch } from './PMModel';

/** Pure presentation guidance. Never grants resources, changes rolls or touches saves. */
export function hasHatchAction(s:State,now:number):boolean {
  return !!s.pendingHatch||(s.incubators||[]).some(slot=>!!slot&&Number.isFinite(now)&&slot.readyAt<=now)||
    ([0,1].some(i=>!s.incubators?.[i])&&availableEggs(s).length>0);
}
export function hasOpenPartySlot(s:State):boolean {
  const party=homeParty(s).filter(Boolean);
  return party.length<3&&(s.pets||[]).some(p=>!party.includes(p.uid!)&&!isBreedingPet(s,p.uid!));
}
export function battleLearningHint(s:State):string {
  if(s.phase!=='battle'||s.gymRun!==undefined||(s.mapId||0)!==0||s.clearedMaps?.includes(0))return '';
  if(s.hpRatio<=.5&&s.potions>0&&!s.usedHeal)return '生命不足，先用药水';
  const faces=petAttackFaces(s.active),average=faces.reduce((a,b)=>a+b,0)/faces.length;
  if(!s.doubled&&s.attack<average*.85&&attackAmount(s)<s.enemyHP)return '低点数？防御后重新掷骰';
  return '药水不耗回合，再点骰子攻击';
}

/** An optional type hint, not a skill-aware battle solver. Prefer the active pet on ties. */
export function suggestedTypePartner(s:State):string {
  if(s.phase!=='encounter')return '';
  let best='',score=1;
  for(const uid of homeParty(s).filter(Boolean)){
    const p=petCombat(s,uid);if(p.hp<=0||p.ratio<.35||isBreedingPet(s,uid))continue;
    const fit=matchupMultiplier(p.pet.id,s.enemy)/matchupMultiplier(s.enemy,p.pet.id);
    if(fit>score){best=uid;score=fit;}
  }
  return best;
}
export function hatchPartySlot(s:State):number {
  const uid=s.pendingHatch?.uid;
  if(!uid||s.expedition||s.gymRun!==undefined||!canManageParty(s)||isBreedingPet(s,uid)||homeParty(s).includes(uid))return -1;
  return homeParty(s).findIndex((value,i)=>i>0&&!value);
}
/** Only fill an empty reserve slot after an explicit tap; never replace a teammate. */
export function welcomeHatchToParty(s:State):State {
  const slot=hatchPartySlot(s);if(slot<0)return s;
  const next=assignPartySlot(s,s.pendingHatch!.uid!,slot);
  return next===s?s:acknowledgeHatch(next);
}
