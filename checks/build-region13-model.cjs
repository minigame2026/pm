const fs=require('fs'),vm=require('vm'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const file='assets/scripts/PMModel.ts',source=fs.readFileSync(file,'utf8'),M={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
fs.writeFileSync('checks/regions-13-15-baseline.json',JSON.stringify({pets:M.PETS,ids:M.PET_IDS,skills:M.SKILLS,specs:M.SKILL_SPECS,maps:M.MAPS,curve:M.ADVENTURE_DIFFICULTY,forms:M.FORM_NAMES},null,2));
const f='art-source/regions-13-15/roster.json',r=JSON.parse(fs.readFileSync(f,'utf8'));
const defs=[
 ['誓环守护|Oath Ring|attack|even|shield|12','空瓶祷祝|Empty Flask Prayer|guard|noHeal|healPct|25','守誓承难|Oathkeeper Resolve|hit|allyDown|reduce|24'],
 ['单露回生|Odd Dew Renewal|roll|odd|healPct|12','奇露回瓶|Dew Flask Echo|heal|odd|refundHeal|1','暮露蚀印|Late Dew Mark|guard|late|poison|7'],
 ['偶潮棘盾|Even Tide Shield|hit|even|shield|12','单潮赠力|Odd Tide Offering|guard|odd|refundBoost|1','断潮毒冠|Broken Tide Crown|hit|allyDown|poison|8'],
 ['奇帆蓄风|Odd Sail Wind|attack|odd|nextMax|1','长航校准|Long Voyage Course|roll|late|maxRoll|1','无药掠影|Last Wind Evasion|hit|noBoost|evade|1'],
 ['双颚齐击|Twin Mandible Strike|attack|even|damage|10','奇数琥甲|Odd Amber Armor|boost|odd|shield|20','接旗补给|Fallen Banner Supply|attack|allyDown|refundBoost|1'],
 ['偶岩花冠|Even Stone Crown|roll|even|shield|15','久战化石|Enduring Fossil|hit|late|reduce|18','古海接生|Ancient Sea Renewal|guard|allyDown|healPct|40'],
 ['奇焰烙印|Odd Flame Brand|attack|odd|poison|5','双炉回暖|Twin Furnace Warmth|boost|even|healPct|20','久燃奔袭|Longburn Charge|attack|late|damage|18'],
 ['双极校点|Twin Pole Alignment|roll|even|maxRoll|1','绝药电解|Empty Flask Electrolysis|boost|noHeal|refundHeal|1','承雷怒击|Inherited Thunder|attack|allyDown|damage|24'],
 ['双孢蔓毒|Twin Spore Bloom|guard|even|poison|5','无力菌酿|Last Power Brew|heal|noBoost|refundBoost|1','久战菌汲|Enduring Mycosiphon|attack|late|venomDrain|3'],
 ['偶环缓震|Even Ring Cushion|hit|even|reduce|10','绝力砂垒|Last Power Sandwall|guard|noBoost|shield|24','绝药地饮|Empty Flask Earthdrink|attack|noHeal|drain|80'],
 ['奇步凝神|Odd Step Focus|guard|odd|nextMax|1','久战禅息|Enduring Zen Breath|hit|late|healPct|30','承志回生|Inherited Resolve|attack|allyDown|healPct|45'],
 ['双针蓄守|Twin Needle Guard|roll|even|powerGuard|5','长战磁壁|Enduring Magnet Wall|boost|late|shield|28','绝药钢命|Empty Flask Ironwill|hit|noHeal|survive|1'],
 ['奇晶缓冲|Odd Crystal Cushion|hit|odd|reduce|10','双星凝障|Twin Star Ward|heal|even|shield|20','承霜回光|Inherited Frostlight|roll|allyDown|healPct|30'],
 ['奇线脱身|Odd Thread Escape|hit|odd|evade|1','久舞提线|Enduring Puppet Dance|guard|late|nextMax|1','绝药返魂|Empty Flask Soulreturn|hit|noHeal|healPct|40'],
 ['奇棱结界|Odd Prism Ward|roll|odd|shield|12','绝力照真|Last Power Revelation|attack|noBoost|nextMax|1','长映幻毒|Lingering Prism Venom|boost|late|poison|7'],
 ['偶月攫生|Even Moon Siphon|attack|even|drain|35','绝药夜馈|Empty Flask Nightgift|guard|noHeal|refundHeal|1','久夜蚀痕|Enduring Night Scar|attack|late|poison|8'],
 ['奇铃晨歌|Odd Bell Dawn|roll|odd|heal|12','承愿赠力|Inherited Wish Offering|heal|allyDown|refundBoost|1','护愿花幕|Wishkeeper Veil|guard|allyDown|shield|32'],
 ['双帆龙痕|Twin Sail Dragonmark|attack|even|poison|6','绝力宙返|Last Power Timefold|boost|noBoost|refundBoost|1','承古噬生|Inherited Ancient Feast|attack|allyDown|drain|100']
];
const zWhen={attack:'攻击时',heal:'使用生命药水时',boost:'使用力量药水时',guard:'防御时',hit:'受到反击时',roll:'掷骰时'},eWhen={attack:'On attack',heal:'On using a healing potion',boost:'On using a power potion',guard:'On guard',hit:'On taking a counterattack',roll:'On rolling'};
const zGate={even:'攻击点数为偶数',odd:'攻击点数为奇数',late:'本场第4回合起',allyDown:'有队友阵亡',noHeal:'生命药水已用完',noBoost:'力量药水已用完'},eGate={even:'with an even attack roll',odd:'with an odd attack roll',late:'from turn 4 onward',allyDown:'with a fallen teammate',noHeal:'with no healing potions left',noBoost:'with no power potions left'};
function ze(e,n){return {damage:'额外伤害 +'+n,heal:'恢复生命 +'+n,healPct:'恢复最大生命 '+n+'%',drain:'恢复实际伤害的 '+n+'%',shield:'获得护盾 +'+n,reduce:'本次伤害减少 '+n,poison:'施毒3次，每次伤害 '+n,nextMax:'下回合攻击取最高点数',maxRoll:'本次攻击改为最高点数',refundHeal:'生命药水 +1',refundBoost:'力量药水 +1',evade:'闪避本次伤害',survive:'受到致命伤害时保留1点生命',venomDrain:'汲取25%伤害并施毒3次，每次3点',powerGuard:'获得护盾 +5，下回合最高点数'}[e];}
function ee(e,n){return {damage:`deal ${n} extra damage`,heal:`restore ${n} HP`,healPct:`restore ${n}% of maximum HP`,drain:`restore ${n}% of damage dealt as HP`,shield:`gain ${n} shield`,reduce:`reduce this hit by ${n}`,poison:`poison for 3 ticks of ${n} damage`,nextMax:'roll maximum attack next turn',maxRoll:'change this attack roll to its maximum',refundHeal:'gain 1 healing potion',refundBoost:'gain 1 power potion',evade:'evade this hit',survive:'survive a lethal hit with 1 HP',venomDrain:'drain 25% of damage and poison for 3 ticks of 3 damage',powerGuard:'gain 5 shield and roll maximum attack next turn'}[e];}
for(const [i,p] of r.pets.entries()){
 const map=p.mapId-12,role=p.rank==='boss'?2:p.rank==='elite'?1:0;p.hp=156+map*8+role*4;p.faces=[41+map*2+role,52+map*2+role,64+map*2+role];p.enemyFaces=p.faces.map(x=>x-2);
 p.skills=defs[i].map((s,tier)=>{const [name,en,when,gate,effect,amount]=s.split('|'),n=+amount;return {code:'trait_mythic_'+p.id+'_'+tier,name,en,when,gate,effect,amount:n,description:zWhen[when]+' · '+zGate[gate]+'：'+ze(effect,n)+'。每场一次。',descriptionEn:eWhen[when]+' · '+eGate[gate]+': '+ee(effect,n)+'. Once per battle.'};});
}
r.notes='18 mythic species appended after 90 existing species. Three independent normal/SR/SSR forms each; 54 unique new trigger/effect combinations. Existing IDs and skill indexes unchanged.';
fs.writeFileSync(f,JSON.stringify(r,null,2)+'\n');
let s=source;
s=s.replace(" | 'triarchdrake';"," | 'triarchdrake' | "+r.pets.map(p=>"'"+p.id+"'").join(' | ')+';');
const end=s.indexOf('\n};',s.indexOf('export const PETS:'));
s=s.slice(0,end).trimEnd()+',\n'+r.pets.map(p=>JSON.stringify(p.id)+':'+JSON.stringify({name:p.forms[0].name,trait:p.type+' · '+({normal:'普通',elite:'精英',boss:'首领'}[p.rank]),type:p.type,rank:p.rank,hp:p.hp,faces:p.faces,enemyFaces:p.enemyFaces,color:p.color})).join(',\n')+s.slice(end);
s=s.replace('export const NEW_PET_IDS:PetId[]=','export const MYTHIC_PET_IDS:PetId[]='+JSON.stringify(r.pets.map(p=>p.id))+';\nexport const NEW_PET_IDS:PetId[]=');
s=s.replace('...FRIEND_PET_IDS,...LEGENDARY_PET_IDS];','...FRIEND_PET_IDS,...LEGENDARY_PET_IDS,...MYTHIC_PET_IDS];');
const me=s.indexOf('\n];',s.indexOf('export const MAPS:'));
s=s.slice(0,me).trimEnd()+',\n'+r.maps.map(m=>JSON.stringify({...m,types:m.pets.map(id=>r.pets.find(p=>p.id===id).type).join(' · '),eggs:'精英 SSR 蛋 5% · BOSS SSR 蛋 10%',note:'6 个新系列 · 18 种形态 · 神兽领域'},(k,v)=>['en','eggRates'].includes(k)?undefined:v)).join(',\n')+s.slice(me);
s=s.replace('{hp:1,attack:1.04},','{hp:1,attack:1.04},\n  {hp:1,attack:1.07},{hp:1,attack:1.10},{hp:1,attack:1.13},');
s=s.replace("|'resisted';","|'resisted'|'even'|'odd'|'late'|'allyDown'|'noHeal'|'noBoost';");
s=s.replace("resisted:'本次攻击被抵抗'","resisted:'本次攻击被抵抗',even:'攻击点数为偶数',odd:'攻击点数为奇数',late:'本场第4回合起',allyDown:'有队友阵亡',noHeal:'生命药水已用完',noBoost:'力量药水已用完'");
s=s.replace('resisted:matchupMultiplier(s.active.id,s.enemy)<1','resisted:matchupMultiplier(s.active.id,s.enemy)<1,even:s.attack%2===0,odd:s.attack%2!==0,late:s.turn>=4,allyDown:homeParty(s).some(uid=>!!uid&&uid!==s.active.uid&&petCombat(s,uid).hp===0),noHeal:s.potions===0,noBoost:s.boosts===0');
const skills='// Append after every existing skill: old share-code indexes remain unchanged.\nconst MYTHIC_SKILL_DATA:Record<string,[string,SkillSpec][]>= {\n'+r.pets.map(p=>p.id+':['+p.skills.map(x=>'['+JSON.stringify(x.name)+',spec('+[x.when,x.gate,x.effect].map(JSON.stringify).join(',')+','+x.amount+')]').join(',')+']').join(',\n')+'\n};\nfor(const id of MYTHIC_PET_IDS){PET_SKILLS[id]=MYTHIC_SKILL_DATA[id].map(([name,v],tier)=>{const code=\'trait_mythic_\'+id+\'_\'+tier;SKILL_SPECS[code]=v;SKILLS[code]=[name,specDescription(v)];return code;}) as [SkillCode,SkillCode,SkillCode];}\n';
s=s.replace('export const NATURAL_SKILL_CODES=',skills+'export const NATURAL_SKILL_CODES=');
const fe=s.indexOf('\n};',s.indexOf('export const FORM_NAMES:'));s=s.slice(0,fe).trimEnd()+',\n'+r.pets.map(p=>p.id+':'+JSON.stringify(p.forms.map(f=>f.name))).join(',\n')+s.slice(fe);
fs.writeFileSync(file,s);
console.log('registered18 species/54 skills/3 maps; baseline preserved in checks/regions-13-15-baseline.json');
