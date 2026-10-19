from pathlib import Path
p=Path('D:/game/PM/assets/scripts/PMModel.ts')
s=p.read_text(encoding='utf-8-sig')
def rep(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b)
rep('stage:number }','stage:number; genes?:Genes }')
rep('export interface Pet { id: PetId; faces: number[]; rarity?:EggRarity }', '''export type Sex='female'|'male';
export interface Genes { id:PetId; rarity:EggRarity; baseHP:number; baseFaces:number[]; skills:SkillCode[] }
export interface Pet { id:PetId; faces:number[]; rarity?:EggRarity; uid?:string; sex?:Sex; baseHP?:number; baseFaces?:number[]; skills?:SkillCode[] }
export interface Breeding { id:string; mother:string; father:string; startedAt:number; readyAt:number; genes:Genes }''')
rep('warmthGain:number }','warmthGain:number; uid?:string }')
rep('export interface SkillState { used:boolean;', 'export interface SkillState { usedCodes?:SkillCode[]; used:boolean;')
rep('pendingHatch?:HatchResult; skill?:SkillState;','pendingHatch?:HatchResult; skill?:SkillState;\n  individualVersion?:1; pets?:Pet[]; team?:string[]; runRoster?:Record<string,Pet>; breeding?:Breeding|null; breedingSerial?:number;')
rep("export const attackAmount = (s: State) => s.attack * (s.doubled ? s.boostMultiplier : 1) + (s.skill&&!s.skill.used?(skillFor(s.active).code==='opening'?2:skillFor(s.active).code==='heavy'&&s.skill.attacks===2?4:0):0);", "export const attackAmount = (s: State) => s.attack * (s.doubled ? s.boostMultiplier : 1) + (skillReady(s,'opening')?2:0) + (skillReady(s,'heavy')&&s.skill!.attacks===2?4:0);")
rep('PETS[s.active.id].hp + s.hpBonus + qualityHP(s.active.rarity)', 'petBaseHP(s.active) + s.hpBonus')
rep('encounter(s, false); return s;', 'encounter(s, false); migrateIndividuals(s); return s;')
start=s.index('  if(s.skill){const k=s.skill,code=skillFor(s.active).code;')
end=s.index('\n}\nfunction next',start)
s=s[:start]+'''  if(s.skill){const k=s.skill;
    if(k.nextMax){s.attack=Math.max(...s.active.faces);k.nextMax=false;}
    if(skillReady(s,'steady')&&s.attack===Math.min(...s.active.faces)){s.attack=[...s.active.faces].sort((a,b)=>a-b)[Math.floor(s.active.faces.length/2)];trigger(s,'steady');}
    if(skillReady(s,'repeat')&&s.attack===k.previousRoll){s.attack=Math.max(...s.active.faces);trigger(s,'repeat');}
    k.previousRoll=s.attack;
  }'''+s[end:]
start=s.index('function finishReward(');end=s.index('function beginEggHunt',start)
s=s[:start]+"function finishReward(s:State){ next(s); }\n"+s[end:]
rep("s.skill={used:false,attacks:0", "s.skill={usedCodes:[],used:false,attacks:0")
rep('const k=s.skill,code=skillFor(s.active).code;', 'const k=s.skill;')
rep("(k&&!k.used&&code==='healing'?2:0)", "(skillReady(s,'healing')?2:0)")
rep("if(k&&!k.used){if(code==='healing')trigger(s);if(code==='refund'){s.potions++;trigger(s);}if(code==='overflow'&&amount>maxHP(s)-hp(s)){k.shield=Math.min(6,Math.floor(amount-(maxHP(s)-hp(s))));trigger(s);}}", "if(k){if(skillReady(s,'healing'))trigger(s,'healing');if(skillReady(s,'refund')){s.potions++;trigger(s,'refund');}if(skillReady(s,'overflow')&&amount>maxHP(s)-hp(s)){k.shield+=Math.min(6,Math.floor(amount-(maxHP(s)-hp(s))));trigger(s,'overflow');}}")
rep("if(k&&!k.used&&code==='charged'){s.attack=Math.max(...s.active.faces);trigger(s);}", "if(skillReady(s,'charged')){s.attack=Math.max(...s.active.faces);trigger(s,'charged');}")
start=s.index('        if(k){k.attacks++;if(!k.used){');end=s.index('\n      if(k&&k.poison',start)
s=s[:start]+'''        if(k){k.attacks++;
          if(skillReady(s,'opening'))trigger(s,'opening');
          if(skillReady(s,'heavy')&&k.attacks===3)trigger(s,'heavy');
          if(skillReady(s,'venom')){k.poison=3;trigger(s,'venom');}
          if(skillReady(s,'slow')){slow=2;trigger(s,'slow');}
          if(skillReady(s,'leech')){s.hpRatio=Math.min(1,s.hpRatio+Math.min(Math.ceil(dealt*.2),Math.ceil(maxHP(s)*.25))/maxHP(s));trigger(s,'leech');}
        }
      }else if(k){if(skillReady(s,'focus')){k.nextMax=true;trigger(s,'focus');}if(skillReady(s,'barrier')){k.shield+=6;trigger(s,'barrier');}}'''+s[end:]
rep("if(!s.owned.includes(s.enemy))s.owned.push(s.enemy);",'')
rep("if(!k.used&&code==='armor'){damage=Math.max(1,damage-2);trigger(s);}if(!k.used&&code==='evade'){damage=0;trigger(s);}","if(skillReady(s,'armor')){damage=Math.max(1,damage-2);trigger(s,'armor');}if(skillReady(s,'evade')){damage=0;trigger(s,'evade');}")
rep("if(k&&!k.used&&code==='emergency'&&s.hpRatio>1e-8&&s.hpRatio<=.3){s.hpRatio=Math.min(1,s.hpRatio+Math.ceil(maxHP(s)*.25)/maxHP(s));trigger(s);}","if(skillReady(s,'emergency')&&s.hpRatio>1e-8&&s.hpRatio<=.3){s.hpRatio=Math.min(1,s.hpRatio+Math.ceil(maxHP(s)*.25)/maxHP(s));trigger(s,'emergency');}")
start=s.index("  } else if(s.phase==='recruit') {");end=s.index('\n  if(!valid)return before;',start)
s=s[:start]+'''  } else if(s.phase==='recruit'||s.phase==='team') {
    // Legacy screens can only continue; new companions are exclusively hatched.
    if(['invite','skip','replace','collect'].includes(a)){s.recruit=null;next(s);valid=true;}
  }'''+s[end:]
rep("ids.includes(e.affinity)&&[5,10,15,20].includes(e.stage)", "ids.includes(e.affinity)&&([5,10,15,20].includes(e.stage)||(e.stage===0&&validGenes(e.genes)&&e.genes.id===e.affinity&&e.genes.rarity===e.rarity))")
rep('    return s;\n  } catch {return null;}', "    if(s.individualVersion===1&&!validIndividuals(s))return null;\n    migrateIndividuals(s);\n    if(s.phase==='recruit'||s.phase==='team'){s.recruit=null;next(s);}\n    return s;\n  } catch {return null;}")
start=s.index('export function equipReserve');end=s.index('export function continueAdventure',start)
s=s[:start]+'''export function equipReserve(before:State,key:string):State { return assignPartySlot(before,key,1); }
export const canManageParty=(s:State)=>s.phase!=='battle';
export function partyChoices(s:State):string[]{return homeParty(s);}
export function homeParty(s:State):string[]{
  const result=[s.active.uid||'',s.reserve?.uid||'',...(s.team||[])].filter(Boolean);
  const unique=Array.from(new Set(result)).slice(0,3);while(unique.length<3)unique.push('');return unique;
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
  s.team=slots;s.active=runPet(s,slots[0]);s.reserve=slots[1]?runPet(s,slots[1]):null;delete s.partySlots;
  s.revision++;return s;
}
'''+s[end:]
start=s.index('export function restartRun');end=s.index('\nexport const RARITIES',start)
s=s[:start]+'''export function restartRun(before:State,seed=Date.now()):State {
  const s=fresh(seed,before.owned,before.wins);
  for(const key of ['eggs','incubators','warmth','hatchSeed','hatchedEggIds','qualities','preferredRarities','pendingHatch','pets','team','individualVersion','breeding','breedingSerial'])if(before[key]!==undefined)s[key]=JSON.parse(JSON.stringify(before[key]));
  s.active=clonePet(s.pets!.find(p=>p.uid===before.active.uid)!);s.reserve=before.reserve?clonePet(s.pets!.find(p=>p.uid===before.reserve!.uid)!):null;
  s.team=homeParty(before);s.runRoster={};return s;
}
'''+s[end:]
start=s.index('function preferredPet');end=s.index('export const availableEggs',start)
s=s[:start]+'''function preferredPet(s:State,p:Pet):Pet {return p;}
const clone=(s:State):State=>JSON.parse(JSON.stringify(s));
const clonePet=(p:Pet):Pet=>JSON.parse(JSON.stringify(p));
// Forms are separate individuals and can no longer be toggled in place.
export function setPetRarity(before:State,id:PetId,rarity:EggRarity):State {return before;}
'''+s[end:]
rep("const result:EggRarity=roll<weights[0]?'normal':roll<weights[0]+weights[1]?'SR':'SSR';", "const result:EggRarity=egg.genes?egg.rarity:roll<weights[0]?'normal':roll<weights[0]+weights[1]?'SR':'SSR';")
start=s.index('  const s=clone(before),id=egg.affinity');end=s.index('\n}\nexport function acknowledgeHatch',start)
s=s[:start]+'''  const s=clone(before),id=egg.affinity,genes=egg.genes||naturalGenes(id,slot.result);
  const child=individual(s,'hatch-'+egg.id,genes);s.pets!.push(child);
  if(!s.owned.includes(id))s.owned.push(id);
  s.qualities=s.qualities||{};s.qualities[id]=Array.from(new Set([...(s.qualities[id]||[]),slot.result]));
  s.hatchedEggIds=[...(s.hatchedEggIds||[]),egg.id];s.incubators![index]=null;
  s.pendingHatch={eggId:egg.id,petId:id,rarity:slot.result,duplicate:false,warmthGain:0,uid:child.uid};s.revision++;return s;'''+s[end:]
rep('const SKILLS={','export const SKILLS={')
rep('type SkillCode=','export type SkillCode=')
start=s.index('export function skillFor');end=s.index('function validHatching',start)
s=s[:start]+'''export function petSkills(p:Pick<Pet,'id'|'rarity'|'skills'>):SkillCode[]{return p.skills?.slice()||[PET_SKILLS[p.id][RARITIES.indexOf(p.rarity||'normal')]];}
export function skillFor(p:Pick<Pet,'id'|'rarity'|'skills'>){const codes=petSkills(p);return {code:codes[0],name:codes.map(c=>SKILLS[c][0]).join(' · '),description:codes.map(c=>SKILLS[c][1]).join('\\n')+'\\n各技能每场限一次。'};}
function skillReady(s:State,code:SkillCode):boolean {return !!s.skill&&petSkills(s.active).includes(code)&&!(s.skill.usedCodes||(s.skill.used?petSkills(s.active):[])).includes(code);}
function trigger(s:State,code:SkillCode){if(s.skill){const k=s.skill;k.usedCodes=k.usedCodes||[];if(!k.usedCodes.includes(code))k.usedCodes.push(code);k.used=petSkills(s.active).every(c=>k.usedCodes!.includes(c));k.event+=(k.event?' · ':'')+SKILLS[code][0]+'！';}}
export function skillStatus(s:State):string {const k=s.skill;if(!k)return '技能从下一场生效';return rarityName(s.active.rarity)+' · 技能 '+(k.usedCodes?.length||(k.used?1:0))+'/'+petSkills(s.active).length+(k.shield?' · 护盾 '+k.shield:k.poison?' · 毒 '+k.poison+' 回合':k.nextMax?' · 下回合最高点数':'');}
'''+s[end:]
rep("r.warmthGain!==(r.duplicate?{normal:3,SR:8,SSR:20}[r.rarity]:0)", "r.warmthGain!==(r.duplicate?{normal:3,SR:8,SSR:20}[r.rarity]:0)")
rep('k.poison>3||k.shield>6','k.poison>3||k.shield>12||(k.usedCodes!==undefined&&(!Array.isArray(k.usedCodes)||k.usedCodes.some(c=>!petSkills(s.active).includes(c))||new Set(k.usedCodes).size!==k.usedCodes.length))')
p.write_text(s,encoding='utf-8')
