// Documentation snapshot only. Does not write game source, assets or player saves.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..'),check=process.argv.includes('--check');
if(process.argv.slice(2).some(v=>v!=='--check'))throw Error('Usage: node tools/export-design-data.cjs [--check]');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const config=JSON.parse(read('tools/workflow.config.json'));
const ts=require(process.env.PM_DOC_TYPESCRIPT||path.join(path.dirname(config.typescript),'typescript.js'));
function moduleAt(file,suffix=''){
  const code=ts.transpileModule(read(file)+suffix,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
  const exports={};vm.runInNewContext(code,{exports,Math,Date,JSON,Set},{filename:file,timeout:5000});return exports;
}
const M=moduleAt('assets/scripts/PMModel.ts','\nexport const DOC_GROWTH=growthTier;\n');
const B=moduleAt('assets/scripts/BattleArt.ts'),E=moduleAt('assets/scripts/EvolutionArt.ts'),ui=read('assets/scripts/PMGame.ts');
const footMatch=ui.match(/const feet=(\{fox:.*?\});/);
assert(footMatch,'PMGame foot override changed: review exporter');
const overrides=vm.runInNewContext('('+footMatch[1]+')');
const loadMatch=ui.match(/Promise\.all\(\[(.*?)\]\.map\(async key=>/s);
assert(loadMatch,'PMGame startup asset list changed: review exporter');
const loaded=new Set([...loadMatch[1].matchAll(/'([^']+)'/g)].map(m=>'assets/resources/art/'+m[1]+'.png'));
const ranks={normal:'普通',elite:'精英',boss:'BOSS'};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const sourceFiles=['assets/scripts/PMModel.ts','assets/scripts/PMGame.ts','assets/scripts/BattleArt.ts','assets/scripts/EvolutionArt.ts'];
const sourceHashes=Object.fromEntries(sourceFiles.map(f=>[f,hash(f)]));
const pngInfo=file=>{const b=fs.readFileSync(path.join(root,file));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);return {width:b.readUInt32BE(16),height:b.readUInt32BE(20),bytes:b.length,sha256:hash(file)};};
function frame(file,rect,feet){
  const info=pngInfo(file);assert(fs.existsSync(path.join(root,file+'.meta')),'Missing meta '+file);
  const [x,y,w,h]=rect;assert(rect.length===4&&rect.every(Number.isInteger)&&x>=0&&y>=0&&w>0&&h>0&&x+w<=info.width&&y+h<=info.height,'Invalid rect '+file);
  assert(feet.length===2&&feet.every(n=>Number.isFinite(n)&&n>=0&&n<=1),'Invalid feet '+file);
  loaded.add(file);return {file,rect:[...rect],feet:[...feet]};
}
const mapIds=M.MAPS.flatMap(m=>m.pets);assert.equal(new Set(mapIds).size,M.PET_IDS.length);assert.equal(mapIds.length,M.PET_IDS.length,'Map species overlap');
const forms=[];
for(const id of M.PET_IDS){
  const map=M.MAPS.find(m=>m.pets.includes(id)),i=map.pets.indexOf(id),role=i<4?'normal':i===4?'elite':'boss';
  for(const rarity of M.RARITIES){
    const p={id,rarity,faces:[...M.PETS[id].faces]},file='assets/resources/art/'+id+(rarity==='normal'?(['fox','bud','turtle'].includes(id)?'-battle-ref.png':'-battle-v1.png'):'-evolution-v1.png');
    const views={};for(const side of ['back','front']){
      const art=rarity==='normal'?{rect:B.BATTLE_RECTS[id][side],feet:(overrides[id]||B.PET_FEET[id])[side]}:E.EVOLUTION_ART[id][rarity][side];
      views[side]=frame(file,art.rect,art.feet);
    }
    const portrait=rarity==='normal'&&['fox','bud','turtle'].includes(id)?{file:'assets/resources/art/'+id+'.png',mirror:id==='fox'}:{...views.front,mirror:false};
    assert(fs.existsSync(path.join(root,portrait.file)));
    forms.push({key:M.formKey(p),id,rarity,displayRarity:M.rarityName(rarity),name:M.petName(p),type:M.PETS[id].type,mapId:map.id,map:map.name,encounterRole:role,artRank:M.PETS[id].rank,naturalHP:M.petBaseHP(p),naturalFaces:p.faces,baseEnemyFaces:[...M.PETS[id].enemyFaces],naturalSkills:[...M.petSkills(p)],views,portrait});
  }
}
const stages=[],eggCheckpoints=[];
for(const map of M.MAPS){
  for(let step=1;step<=map.stages;step++){
    const rank=M.rankForStage(step),rarity=M.encounterRarity(step,map.id),pool=M.encounterPool(step,map.id);
    stages.push({mapId:map.id,map:map.name,step,rank,rarity,enemyHP:M.enemyHealthForStage(step,map.id),rewardGrowth:M.DOC_GROWTH(step)+map.id*2,enemies:pool.map(id=>({id,name:M.petName({id,rarity}),faces:[...M.enemyAttackFaces({mapId:map.id,step,enemy:id,enemyRarity:rarity})]}))});
    if(rank!=='normal'){
      const rates=M.eggRates({mapId:map.id,step}),searches=rank==='boss'?3:2;
      assert.equal(Object.values(rates).reduce((a,b)=>a+b,0),100);assert(Object.values(rates).every(v=>v>=0&&v<=100));
      eggCheckpoints.push({mapId:map.id,map:map.name,step,rank,searches,rates,atLeastOneSSRPercent:Number(((1-(1-rates.SSR/100)**searches)*100).toFixed(4))});
    }
  }
}
for(const rates of Object.values(M.HATCH_RATES))assert.equal(rates.reduce((a,b)=>a+b,0),100);
const artDir='assets/resources/art';
const assets=fs.readdirSync(path.join(root,artDir)).filter(f=>f.toLowerCase().endsWith('.png')).sort().map(name=>{const file=artDir+'/'+name,info=pngInfo(file);return {file,...info,loadedAtStartup:loaded.has(file),rgba8EstimateBytes:info.width*info.height*4};});
assert([...loaded].every(file=>assets.some(a=>a.file===file)),'Missing loaded PNG');
const fresh=M.fresh(20261019);
const data={schemaVersion:1,sourceHashes,notes:['Read-only snapshot; edit PMModel and regenerate.','normal is displayed as R. Natural skills differ from inherited individuals.','artRank is not encounterRole. RGBA8 estimates are not measured runtime memory.'],counts:{species:M.PET_IDS.length,forms:forms.length,stages:stages.length,skills:Object.keys(M.SKILLS).length},initial:{sampleSeed:20261019,note:"Deterministic example only; actual fresh games use Date.now() and random sex.",pets:fresh.pets,team:fresh.team,potions:fresh.potions,boosts:fresh.boosts,healFaces:fresh.healFaces,hpRatio:fresh.hpRatio,hpBonus:fresh.hpBonus},maps:M.MAPS,forms,skills:M.SKILLS,stages,eggCheckpoints,hatching:{durationMs:M.HATCH_DURATION,accelerationMs:M.HATCH_ACCELERATION,rates:M.HATCH_RATES},breeding:{durationMs:M.BREED_DURATION},visitActionMs:M.VISIT_ACTION_MS,itemMultiplierArrays:M.ITEM_MULTIPLIERS,assets};
const table=(heads,rows)=>['| '+heads.join(' | ')+' |','| '+heads.map(()=>'---').join(' | ')+' |',...rows.map(row=>'| '+row.map(v=>String(v).replaceAll('|',' / ').replaceAll('\n',' ')).join(' | ')+' |')].join('\n');
const header='> 自动生成；不要手改。来源：PMModel、PMGame、BattleArt、EvolutionArt；精确 SHA-256 见 [design-data.json](design-data.json)。运行 `node tools/export-design-data.cjs` 更新，`--check` 检查过期。\n';
const lines=['# 当前游戏完整数据表','',header,'## 内容规模','',`${data.counts.species} 个系列，${forms.length} 种自然形态，${stages.length} 关，${data.counts.skills} 种技能机制。个体遗传后数值以存档为准。`,'','## 地图系列与关卡身份','',table(['地图','关数','普通池（等概率）','精英','BOSS'],M.MAPS.map(m=>[m.name,m.stages,m.pets.slice(0,4).map(id=>M.PETS[id].name).join('、'),M.PETS[m.pets[4]].name,M.PETS[m.pets[5]].name])),'','## 54 形态自然数据','', '角色身份为地图出怪身份；美术级为历史画面尺度分类。点数组按索引等概率，重复项保留。R/SR/SSR自然形态各只有一个下列技能。','',table(['形态ID','名称','属性','品质','地图 / 身份','美术级','HP','攻击点数','技能','图片'],forms.map(p=>[p.key,p.name,p.type,p.displayRarity,p.map+' / '+ranks[p.encounterRole],ranks[p.artRank],p.naturalHP,p.naturalFaces.join(' / '),p.naturalSkills.map(c=>M.SKILLS[c][0]).join('、'),`[源图](../../${p.views.front.file})`])),'','## 技能机制','',table(['代码','名称','效果'],Object.entries(M.SKILLS).map(([c,[n,d]])=>[c,n,d])),'','各技能每场至多触发一次；持续效果仍按规则继续。多技能执行顺序和取整见 [数值规则](../BALANCE.md)。','', '## 60关敌人数据','', 'HP为本关敌人上限。攻击一栏列出普通池中每只的实际点数组；敌方不执行我方的技能。奖励阶为点数组奖励每项加值，BOSS不领取普通战利品。','',table(['地图','关','类别','品质','HP','可遇敌人：攻击数组','奖励阶'],stages.map(s=>[s.map,s.step,ranks[s.rank],M.rarityName(s.rarity),s.enemyHP,s.enemies.map(e=>e.name+': '+e.faces.join('/')).join('；'),s.rank==='boss'?'不发普通掉落':s.rewardGrowth])),'','## 寻蛋概率','', '单次概率与“用尽翻找次数后至少找到一个SSR”的概率分列；后者不含孵化升品质。系列从该地图全部6个等概率抽。','',table(['地图','关','次数','R','SR','SSR','用尽次数至少一个SSR'],eggCheckpoints.map(e=>[e.map,e.step,e.searches,e.rates.normal+'%',e.rates.SR+'%',e.rates.SSR+'%',e.atLeastOneSSRPercent+'%'])),'','## 普通孵化品质概率','',table(['蛋','R宠物','SR宠物','SSR宠物'],M.RARITIES.map(r=>[M.rarityName(r),...M.HATCH_RATES[r].map(v=>v+'%')])),'',`孵化 ${M.HATCH_DURATION/60000} 分钟；1能量减少 ${M.HATCH_ACCELERATION/60000} 分钟。交配 ${M.BREED_DURATION/60000} 分钟产蛋后再孵化。交配蛋与结缘蛋品质固定。`,'','## 药水倍率','',table(['物品','抽样数组','含义'],[['治疗',M.ITEM_MULTIPLIERS.heal.join('/'),'×1 50% / ×2 40% / ×3 10%'],['力量',M.ITEM_MULTIPLIERS.boost.join('/'),'×2 50% / ×3 40% / ×4 10%']]),'','资源矩形、脚底、肖像映射、原始敌方数组及初始状态见 [机器可读数据](design-data.json)。\n'];
const sum=(arr,key)=>arr.reduce((n,a)=>n+a[key],0),mib=n=>(n/1048576).toFixed(2),startup=assets.filter(a=>a.loadedAtStartup);
const inventory=['# PNG资源实测清单','',header,`资源目录共 ${assets.length} 张 PNG，文件合计 ${mib(sum(assets,'bytes'))} MiB；当前启动加载 ${startup.length} 张，文件合计 ${mib(sum(startup,'bytes'))} MiB。`,'',`启动图片按每像素RGBA8四字节估算单份纹理为 ${mib(sum(startup,'rgba8EstimateBytes'))} MiB，未计mipmap、驱动副本、压缩格式、引擎和帧缓冲，不能当作实测峰值。裁切帧仍引用整张纹理。`,'','此表不包含JPG、引擎、音频或构建压缩结果，也不是平台主包/分包体积。资源SHA在JSON中，可用于复查资料版本。','',table(['文件','像素尺寸','文件KiB','启动加载','RGBA8估算MiB'],assets.map(a=>[`[${path.basename(a.file)}](../../${a.file})`,a.width+'×'+a.height,(a.bytes/1024).toFixed(1),a.loadedAtStartup?'是':'否',mib(a.rgba8EstimateBytes)])),'','当前使用的54形态双视角均经过存在性、矩形边界、归一化脚底值检查。脚底是否在视觉上准确仍需实际看画面。\n'];
const output={'docs/generated/design-data.json':JSON.stringify(data,null,2)+'\n','docs/generated/TABLES.md':lines.join('\n'),'docs/generated/ASSET-INVENTORY.md':inventory.join('\n')};
for(const [file,content] of Object.entries(output)){
  if(check)assert(fs.existsSync(path.join(root,file))&&read(file)===content,'Stale documentation: '+file);
  else {fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),content,'utf8');}
}
console.log(JSON.stringify({mode:check?'check':'write',...data.counts,assetPNGs:assets.length,startupPNGs:startup.length,files:Object.keys(output)}));
