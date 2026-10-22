import {State,Pet,PetId,Egg,SkillCode,PETS,PET_IDS,RARITIES,MAPS,SKILLS,TEMP_SKILLS,petBaseHP,petSkills,petAttackFaces,petEntry,isBreedingPet,homeParty,fresh,DuelCore,act,hp,maxHP} from './PMModel';
export type ArenaMode='league'|'friend'|'rental'|'champion';
export type ArenaPhase='draft'|'preview'|'battle'|'result'|'finished';
export interface Challenge {version:1;owner:string;name:string;team:Pet[];kind:'challenge'|'receipt';record?:{opponent:string;won:boolean;rounds:number;alive:number}}
export interface Champion {name:string;team:Pet[];generation:number}
export interface ArenaRun {id:string;mode:ArenaMode;phase:ArenaPhase;team:Pet[];foes:Pet[];name:string;wins:number;losses:number;round:number;fighters:[State[],State[]];current:[number,number];potions:[number,number];boosts:[number,number];intent:'attack'|'guard';first:0|1;options:Pet[][];tier:number;result?:boolean;reward?:Egg;claimed?:boolean;friend?:Challenge;last?:{side:number;damage:number;attacks?:boolean;hp?:[number,number];events?:[string,string]}[]}
export interface ArenaSave {version:1;owner:string;seed:number;serial:number;crowns:number;claims:string[];history:Champion[];champion?:Champion;run?:ArenaRun;parked?:Partial<Record<ArenaMode,ArenaRun>>;imported?:Challenge;lastReceipt?:Challenge}
export const ARENA_RANKS=['新人','青铜','白银','黄金','大师'];
export const TRAINERS=['剧毒研究员','暴击少年','坚守少女','异色收藏家'];
const copy=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const random=(a:ArenaSave)=>{a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;return a.seed/4294967296;};
const pick=<T>(a:ArenaSave,x:T[])=>x[Math.floor(random(a)*x.length)];
export function arenaSave(s:State):ArenaSave {return s.arena||{version:1,owner:'arena-'+s.hatchSeed.toString(36)+'-'+s.seed.toString(36),seed:(s.seed^0x71c8e9)>>>0,serial:0,crowns:0,claims:[],history:[]};}
/** Keep the legacy active slot, parking each other mode independently. */
export function selectArenaMode(before:State,mode:ArenaMode):State {
 const a=copy(arenaSave(before));if(a.run?.mode===mode)return before;
 a.parked=a.parked||{};if(a.run)a.parked[a.run.mode]=a.run;
 a.run=a.parked[mode];delete a.parked[mode];if(!a.run)delete a.run;
 return {...before,arena:a,revision:before.revision+1};
}
export const modeRun=(a:ArenaSave,mode:ArenaMode)=>a.run?.mode===mode?a.run:a.parked?.[mode];
export const arenaEligible=(s:State)=>(s.pets||[]).filter(p=>!isBreedingPet(s,p.uid||''));
export function arenaPet(p:Pet):Pet{return {id:p.id,rarity:p.rarity||'normal',uid:p.uid,baseHP:petBaseHP(p),baseFaces:[...(p.baseFaces||p.faces)],faces:[...(p.baseFaces||p.faces)],skills:petSkills(p).filter(c=>!TEMP_SKILLS.includes(c)).slice(0,6),shiny:!!p.shiny,sex:p.sex||'female',...(p.ornament?{ornament:p.ornament}:{})};}
export function arenaNatural(id:PetId,rarity:typeof RARITIES[number],uid:string):Pet{const p=petEntry(fresh(1),id+':'+rarity);return arenaPet({...p,uid});}
function opponents(a:ArenaSave,tier:number,round:number):{team:Pet[];name:string}{
 const style=Math.floor(random(a)*4),types=[['毒','虫','幽灵'],['火','电','龙'],['钢','岩石','水'],['妖精','超能力','冰']][style];
 const team:Pet[]=[],pool=PET_IDS.filter(id=>types.includes(PETS[id].type));
 for(let i=0;i<3;i++){const id=pick(a,pool.filter(id=>!team.some(p=>p.id===id))),r=RARITIES[Math.min(2,Math.max(0,Math.floor((tier+round-1)/3)))],p=arenaNatural(id,r,'opponent-'+i);p.shiny=style===3;
  // Published rank progression, fixed before the match; never counters the selected team.
  p.baseHP!+=tier*2;p.faces=p.faces.map(v=>v+Math.floor(tier/2));p.baseFaces=[...p.faces];team.push(p);
 }return {team,name:TRAINERS[style]};
}
function prepare(a:ArenaSave){const r=a.run!;if(r.mode==='friend'){r.foes=copy(r.friend!.team);r.name=r.friend!.name;}else if(r.mode==='champion'){r.foes=copy(a.champion!.team);r.name=a.champion!.name;}else{const e=opponents(a,r.tier,r.wins+r.losses);r.foes=e.team;r.name=e.name;}r.phase='preview';r.fighters=[[],[]];r.round=0;delete r.result;}
export function startArena(before:State,mode:ArenaMode,keys:string[]=[]):State{
 const selected=selectArenaMode(before,mode),a=copy(arenaSave(selected));if(a.run)return selected;
 const eligible=arenaEligible(before),team=keys.map(k=>eligible.find(p=>p.uid===k)).filter(Boolean) as Pet[];
 if(mode!=='rental'&&(team.length!==3||new Set(keys).size!==3))return before;if(mode==='friend'&&!a.imported)return before;
 const tier=Math.min(4,a.crowns);a.serial++;const r:ArenaRun={id:a.owner+'-'+a.serial,mode,phase:mode==='rental'?'draft':'preview',team:team.map(arenaPet),foes:[],name:'',wins:0,losses:0,round:0,fighters:[[],[]],current:[0,0],potions:[2,2],boosts:[1,1],intent:'attack',first:0,options:[],tier};a.run=r;if(mode==='friend')r.friend=copy(a.imported!);
 if(mode==='rental'){
  r.team=[];r.tier=1;const used:PetId[]=[];
  for(let row=0;row<3;row++){const choices:Pet[]=[];for(let i=0;i<3;i++){const id=pick(a,PET_IDS.filter(id=>!used.includes(id)));used.push(id);const p=arenaNatural(id,RARITIES[i],'loan-'+row+'-'+i);p.shiny=random(a)<.1;choices.push(p);}r.options.push(choices);}
 }else{
  if(mode==='champion'&&!a.champion){const e=opponents(a,0,0);a.champion={name:'初代冠军',team:e.team,generation:1};}
  prepare(a);
 }return {...before,arena:a,revision:before.revision+1};
}
export function chooseRental(before:State,index:number):State{const a=copy(arenaSave(before)),r=a.run;if(!r||r.phase!=='draft'||![0,1,2].includes(index))return before;r.team.push(copy(r.options[r.team.length][index]));if(r.team.length===3)prepare(a);return {...before,arena:a,revision:before.revision+1};}
export function reorderArena(before:State,index:number):State{const a=copy(arenaSave(before)),r=a.run;if(!r||r.phase!=='preview'||index<1||index>2)return before;[r.team[0],r.team[index]]=[r.team[index],r.team[0]];return {...before,arena:a,revision:before.revision+1};}
export const arenaActor=(r:ArenaRun,side:0|1)=>r.fighters[side][r.current[side]];
function syncActors(r:ArenaRun){const x=arenaActor(r,0),y=arenaActor(r,1);DuelCore.sync(x,y);DuelCore.sync(y,x);x.potions=r.potions[0];x.boosts=r.boosts[0];y.potions=r.potions[1];y.boosts=r.boosts[1];}
function useItem(r:ArenaRun,side:0|1,action:'heal'|'boost'){syncActors(r);const old=arenaActor(r,side),next=act(old,action);r.fighters[side][r.current[side]]=next;r.potions[side]=next.potions;r.boosts[side]=next.boosts;}
function round(a:ArenaSave){const r=a.run!;syncActors(r);DuelCore.roll(arenaActor(r,0),arenaActor(r,1));DuelCore.roll(arenaActor(r,1),arenaActor(r,0));r.round++;r.first=(r.round%2?0:1);syncActors(r);
 let ai=arenaActor(r,1);if(ai.hpRatio<=.5&&r.potions[1]>0)useItem(r,1,'heal');ai=arenaActor(r,1);if(ai.attack>=petAttackFaces(ai.active).slice().sort((a,b)=>a-b)[1]&&r.boosts[1]>0)useItem(r,1,'boost');
 // Committed before any player input. Only the current public rolls are consulted.
 ai=arenaActor(r,1);r.intent=ai.attack===Math.min(...petAttackFaces(ai.active))&&!ai.doubled&&arenaActor(r,0).attack>ai.attack*1.5&&r.round%3!==0?'guard':'attack';
}
export function challengeArena(before:State):State{const a=copy(arenaSave(before)),r=a.run;if(!r||r.phase!=='preview')return before;r.fighters=[r.team.map((p,i)=>DuelCore.create(p,(a.seed+i+1)>>>0)),r.foes.map((p,i)=>DuelCore.create(p,(a.seed+i+101)>>>0))];r.current=[0,0];r.potions=[2,2];r.boosts=[1,1];r.round=0;r.phase='battle';round(a);return {...before,arena:a,revision:before.revision+1};}
function endMatch(r:ArenaRun,won:boolean){r.result=won;r.phase='result';if(won)r.wins++;else r.losses++;}
export function arenaAction(before:State,action:'attack'|'guard'|'heal'|'boost'):State{
 const a=copy(arenaSave(before)),r=a.run;if(!r||r.phase!=='battle')return before;syncActors(r);
 if(action==='heal'||action==='boost')useItem(r,0,action);
 else{
  r.last=[];const actors=[arenaActor(r,0),arenaActor(r,1)],moves=[action,r.intent];actors.forEach(s=>{if(s.skill)s.skill.event='';});
  for(let i=0;i<2;i++)if(moves[i]==='guard')DuelCore.guard(actors[i]);
  for(const i of [r.first,1-r.first]){if(hp(actors[i])<=0||hp(actors[1-i])<=0)break;const damage=DuelCore.strike(actors[i],actors[1-i],moves[i]==='attack',moves[1-i]==='guard');r.last.push({side:i,damage,attacks:moves[i]==='attack',hp:[actors[0].hpRatio,actors[1].hpRatio],events:[actors[0].skill?.event||'',actors[1].skill?.event||'']});}
  for(const side of [0,1] as const){r.potions[side]=actors[side].potions;r.boosts[side]=actors[side].boosts;if(hp(actors[side])<=0)r.current[side]++;}
  if(r.current[0]>=3||r.current[1]>=3)endMatch(r,r.current[0]<3);
  else if(r.round>=60){const totals=r.fighters.map(team=>team.reduce((n,s)=>n+hp(s)/maxHP(s),0));endMatch(r,totals[0]>totals[1]);}
  else round(a);
 }return {...before,arena:a,revision:before.revision+1};
}
export function finishArenaMatch(before:State):State{
 const a=copy(arenaSave(before)),r=a.run;if(!r||r.phase!=='result')return before;
 if((r.mode==='league'||r.mode==='rental')&&r.wins<5&&r.losses<2){prepare(a);return {...before,arena:a,revision:before.revision+1};}
 r.phase='finished';const won=r.mode==='friend'||r.mode==='champion'?!!r.result:r.wins===5;
 if(r.mode==='friend')a.lastReceipt={version:1,owner:a.owner,name:'好友挑战书',kind:'receipt',team:copy(r.team),record:{opponent:r.friend!.owner,won,rounds:r.round,alive:r.fighters[0].filter(s=>hp(s)>0).length}};
 if(won&&(r.mode==='league'||r.mode==='champion')){if(a.champion)a.history=[copy(a.champion),...a.history].slice(0,5);a.champion={name:'冠军守擂',team:copy(r.team),generation:(a.champion?.generation||0)+1};if(r.mode==='league')a.crowns++;}
 const key=r.mode==='league'?'league-'+r.tier:r.mode;
 if(won&&r.mode!=='friend'&&!a.claims.includes(key)){a.claims.push(key);const map=MAPS[Math.min(Math.max(-1,...(before.clearedMaps||[]))+1,8)],rarity=r.mode==='league'&&r.tier>=3?'SSR':r.mode==='league'?'SR':'normal';r.reward={id:'arena-'+r.id,rarity,affinity:pick(a,map.pets),stage:5,mapId:map.id};}
 return {...before,arena:a,revision:before.revision+1};
}
export function closeArena(before:State):State{const a=copy(arenaSave(before)),r=a.run;if(!r||r.phase!=='finished')return before;const eggs=[...(before.eggs||[])];if(r.reward&&!eggs.some(e=>e.id===r.reward!.id))eggs.push(r.reward);delete a.run;return {...before,eggs,arena:a,revision:before.revision+1};}
export function abandonArena(before:State):State{const a=copy(arenaSave(before));if(!a.run)return before;delete a.run;return {...before,arena:a,revision:before.revision+1};}
const permanent=Object.keys(SKILLS).filter(c=>!TEMP_SKILLS.includes(c));
function validPet(p:any):p is Pet{return !!p&&PET_IDS.includes(p.id)&&RARITIES.includes(p.rarity)&&Number.isInteger(p.baseHP)&&p.baseHP>0&&p.baseHP<=200&&Array.isArray(p.baseFaces)&&p.baseFaces.length>=1&&p.baseFaces.length<=5&&p.baseFaces.every(n=>Number.isInteger(n)&&n>=1&&n<=100)&&Array.isArray(p.skills)&&p.skills.length>=1&&p.skills.length<=6&&new Set(p.skills).size===p.skills.length&&p.skills.every(c=>permanent.includes(c))&&typeof p.shiny==='boolean';}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function encode(s:string){const bytes:number[]=[];for(const part of encodeURIComponent(s).match(/%[0-9A-F]{2}|./g)||[])bytes.push(part[0]==='%'?parseInt(part.slice(1),16):part.charCodeAt(0));let out='',bits=0,value=0;for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=6){bits-=6;out+=alphabet[(value>>>bits)&63];}}if(bits)out+=alphabet[(value<<(6-bits))&63];return out;}
function decode(s:string){let out='',bits=0,value=0;for(const c of s){const i=alphabet.indexOf(c);if(i<0)throw Error('code');value=(value<<6)|i;bits+=6;if(bits>=8){bits-=8;out+='%'+((value>>>bits)&255).toString(16).padStart(2,'0');}}return decodeURIComponent(out);}
function checksum(s:string){let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return (n>>>0).toString(36);}
export function challengeCode(card:Challenge):string{
 const team=card.team.map(p=>[PET_IDS.indexOf(p.id),RARITIES.indexOf(p.rarity||'normal'),p.baseHP,p.baseFaces,p.skills!.map(c=>permanent.indexOf(c)),p.shiny?1:0,p.sex==='male'?1:0]);
 const body='PMD1.'+encode(JSON.stringify([card.owner,card.name,team,card.kind,card.record||null]));return body+'.'+checksum(body);
}
export function readChallenge(text:string):Challenge|null{try{
 const code=text.trim();if(code.length>6000)return null;const parts=code.split('.');if(parts.length!==3||parts[0]!=='PMD1'||checksum(parts.slice(0,2).join('.'))!==parts[2])return null;const x=JSON.parse(decode(parts[1]));if(!Array.isArray(x)||x.length!==5||typeof x[0]!=='string'||x[0].length>100||typeof x[1]!=='string'||x[1].length>40||!['challenge','receipt'].includes(x[3])||!Array.isArray(x[2])||x[2].length!==3)return null;
 const team:Pet[]=x[2].map((p,i)=>({id:PET_IDS[p[0]],rarity:RARITIES[p[1]],uid:'visitor-'+i,baseHP:p[2],baseFaces:p[3],faces:p[3],skills:p[4].map(c=>permanent[c]),shiny:p[5]===1,sex:p[6]===1?'male':'female'}));if(!team.every(validPet))return null;
 if(x[3]==='receipt'&&(!x[4]||typeof x[4].opponent!=='string'||typeof x[4].won!=='boolean'||!Number.isInteger(x[4].rounds)||x[4].rounds<1||x[4].rounds>60||!Number.isInteger(x[4].alive)||x[4].alive<0||x[4].alive>3))return null;
 return {version:1,owner:x[0],name:x[1].replace(/[\u0000-\u001f<>]/g,''),team,kind:x[3],...(x[4]?{record:x[4]}:{})};
 }catch{return null;}}
export function importChallenge(before:State,text:string):State{const card=readChallenge(text);if(!card)return before;const a=copy(arenaSave(before));if(card.owner===a.owner)return before;a.imported=card;return {...before,arena:a,revision:before.revision+1};}
export function makeChallenge(s:State,keys:string[]):Challenge|null{const team=keys.map(k=>arenaEligible(s).find(p=>p.uid===k)).filter(Boolean) as Pet[];if(team.length!==3||new Set(keys).size!==3)return null;return {version:1,owner:arenaSave(s).owner,name:s.social?.nickname||'好友挑战书',team:team.map(arenaPet),kind:'challenge'};}
export function validArena(a:any):boolean {try{return !!a&&a.version===1&&typeof a.owner==='string'&&Number.isSafeInteger(a.seed)&&Number.isSafeInteger(a.serial)&&a.serial>=0&&Number.isSafeInteger(a.crowns)&&a.crowns>=0&&Array.isArray(a.claims)&&a.claims.length<=20&&Array.isArray(a.history)&&a.history.length<=5&&(!a.champion||a.champion.team.length===3&&a.champion.team.every(validPet))&&(!a.imported||!!readChallenge(challengeCode(a.imported)))&&(!a.run||validRun(a.run))&&(!a.parked||Object.entries(a.parked).every(([mode,r]:[string,any])=>mode!==a.run?.mode&&mode===r.mode&&validRun(r)));}catch{return false;}}
function validRun(r:any):boolean{const pair=(x:any,max:number)=>Array.isArray(x)&&x.length===2&&x.every(v=>Number.isInteger(v)&&v>=0&&v<=max);if(!pair(r.current,3)||!pair(r.potions,2)||!pair(r.boosts,1)||![0,1].includes(r.first)||!Array.isArray(r.options))return false;if(r.phase==='draft'&&(r.options.length!==3||r.options.some(row=>!Array.isArray(row)||row.length!==3||!row.every(validPet))||r.team.length>=3))return false;if(r.phase!=='draft'&&(r.team.length!==3||r.foes.length!==3))return false;if(['battle','result','finished'].includes(r.phase)&&(r.fighters.some(t=>!Array.isArray(t)||t.length!==3)||r.phase==='battle'&&r.current.some(i=>i>=3)))return false;return ['league','friend','rental','champion'].includes(r.mode)&&['draft','preview','battle','result','finished'].includes(r.phase)&&Array.isArray(r.team)&&r.team.length<=3&&r.team.every(validPet)&&Array.isArray(r.foes)&&r.foes.every(validPet)&&r.wins>=0&&r.wins<=5&&r.losses>=0&&r.losses<=2&&Array.isArray(r.fighters)&&r.fighters.length===2&&r.fighters.every(t=>Array.isArray(t)&&t.length<=3&&t.every(s=>validPet(s.active)&&Number.isFinite(s.hpRatio)&&s.hpRatio>=0&&s.hpRatio<=1&&s.skill&&Array.isArray(s.skill.usedCodes)))&&['attack','guard'].includes(r.intent)&&r.round>=0&&r.round<=60;}
