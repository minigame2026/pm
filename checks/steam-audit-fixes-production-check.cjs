// Read-only audit of the actual Windows distribution. No real Steam/save APIs are called.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),release=path.resolve(process.argv[2]||path.join(root,'build/releases/Dicekin-Windows-x64')),generated=path.join(root,'build/pc-project');
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const bundlePath=path.join(release,'Resources/assets/main/index.js'),bundle=read(bundlePath),manifest=json(path.join(generated,'pc-manifest.json'));
assert.equal(manifest.profile,'production');assert.equal(manifest.storage,'pm.pc.creature-dice.v1');
assert(!/qa_profile_disabled|qa-1s/.test(bundle),'QA code or storage identity leaked into the distribution');
assert(!fs.existsSync(path.join(release,'qa-profile.json')));assert(!fs.existsSync(path.join(release,'steam_appid.txt')),'Steam release must exclude the development AppID override');
const modules={},cache={},calls=[],sandbox={Math,Date,JSON,Set,Map,encodeURIComponent,decodeURIComponent,System:{register:(name,deps,fn)=>{modules[name]={deps,fn};}}};
vm.runInNewContext(bundle,sandbox,{filename:bundlePath});
function load(name){if(name==='cc')return {cclegacy:{_RF:{push(){},pop(){}}}};name=name.startsWith('./')?'chunks:///_virtual/'+name.slice(2):name;if(cache[name])return cache[name];const m=modules[name];assert(m,'compiled module missing: '+name);const out=cache[name]={},body=m.fn((key,value)=>{if(typeof key==='string')out[key]=value;else Object.assign(out,key);return value;},{meta:{}});body.setters.forEach((setter,i)=>setter&&setter(load(m.deps[i])));body.execute();return out;}
const M=load('chunks:///_virtual/PMModel.ts'),C=load('chunks:///_virtual/PCCooking.ts'),S=load('chunks:///_virtual/PCSocial.ts'),P=load('chunks:///_virtual/PCProfile.ts'),Steam=load('chunks:///_virtual/PCSteam.ts');
function timers(model){
 assert.equal(model.BUILD_TEST_MODE,false);assert.equal(model.EXPEDITION_COST,0);assert.equal(model.HATCH_DURATION,900000);assert.equal(model.BREED_DURATION,600000);
 assert.deepEqual(JSON.parse(JSON.stringify(model.HATCH_DURATIONS)),{normal:300000,SR:600000,SSR:900000});
 const at=1800000000000,rows=[];model.setTimeProvider(()=>at);
 for(const hero of model.HERO_IDS)for(const [rarity,minutes]of [['normal',5],['SR',10],['SSR',15]]){
  let state=model.chooseStarter(model.chooseHero(model.newJourney(217),hero),'bud');state.eggs=[{id:'production-timer-'+hero+'-'+rarity,rarity,affinity:'bud',stage:5,mapId:0}];
  state=model.startIncubation(state,state.eggs[0].id,0,at);const elapsed=state.incubators[0].readyAt-state.incubators[0].startedAt,want=minutes*60000*(hero==='keeper'?.8:1);
  assert.equal(elapsed,want,hero+' '+rarity+' actual incubation');assert.equal(model.claimHatch(state,0,at+want-1),state,'cannot claim before production completion');
  assert(model.claimHatch(state,0,at+want).pendingHatch,'claim at production completion');rows.push({hero,rarity,durationMs:elapsed});
 }
 let breeding;for(let seed=1;seed<=50&&!breeding;seed++){const state=model.fresh(seed,['fox','bud','otter','beetle','turtle']);const mother=state.pets.find(p=>p.sex==='female'&&p.uid!==state.active.uid),father=state.pets.find(p=>p.sex==='male'&&p.uid!==state.active.uid);if(mother&&father)breeding=model.startBreeding(state,mother.uid,father.uid,at).breeding;}
 assert(breeding,'legal breeding fixture');assert.equal(breeding.readyAt-breeding.startedAt,600000);
 return {buildTestMode:model.BUILD_TEST_MODE,pcExpeditionCost:model.EXPEDITION_COST,hatch:rows,breedDurationMs:breeding.readyAt-breeding.startedAt};
}
const compiledTimers=timers(M);
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const generatedModel=read(path.join(generated,'assets/scripts/PMModel.ts'));assert(!/qa_profile_disabled|qa-1s/.test(generatedModel));const G={};vm.runInNewContext(ts.transpileModule(generatedModel,{compilerOptions:{module:1,target:4}}).outputText,{exports:G,require:()=>C,Math,Date,JSON,Set,Map});assert.deepEqual(timers(G),compiledTimers,'generated source and packaged compiled model must agree');
const owner='76561198000000001';assert.equal(S.accountSaveKey(owner),'pm.pc.creature-dice.v1.steam.'+owner);assert.equal(S.accountSaveKey('local'),'pm.pc.creature-dice.v1.local');assert.equal(Steam.steam.request('status').data.appId,5500200);
sandbox.__dicekinSteam={request(operation,args){calls.push({operation,args:JSON.parse(args)});return JSON.stringify({ok:true,data:{audit:true}});},poll(){return '[]';}};
for(const operation of ['cloud.read','cloud.write','achievements.sync','leaderboard.upload']){const response=Steam.steam.request(operation,{auditOnly:true});assert(response.ok&&response.data.audit,operation+' must reach the injected native bridge');}assert.equal(calls.length,4);
assert.equal(typeof M.pcPetCombat,'function');assert.equal(typeof P.startNewPCProfile,'function');
let state=M.fresh(125,['beetle','fox','bud']);state=M.selectActive(state,state.pets.find(p=>p.id==='beetle').uid);state.pcCooking={...C.newCooking(),active:{recipeId:'leaf-stew',quality:3,remaining:10}};assert.equal(M.pcPetCombat(state,state.active.uid).max,32);assert.equal(M.pcPetCombat(state,state.active.uid).max,M.maxHP(state));
const gameModule=modules['chunks:///_virtual/PMGame.ts'];assert(gameModule);const compiledGame=gameModule.fn.toString();for(const method of ['recoverProfile','breedingPicker','breedingFilter','battleHelp'])assert(compiledGame.includes(method),'compiled fix missing: '+method);const healthAlias=compiledGame.match(/([\w$]+)=[\w$]+\.pcPetCombat\b/)?.[1];assert(healthAlias&&compiledGame.split(healthAlias+'(').length-1>=2,'both PC combat views must use corrected health');
const catalog=json(path.join(root,'pc/i18n/source.json')),entries=Array.isArray(catalog)?catalog:catalog.entries,T=load('chunks:///_virtual/PCTranslations.ts').PC_TRANSLATIONS,locales=require('../tools/compile-pc-locales.cjs').LOCALES;
for(const locale of locales){const expected=json(path.join(root,'pc/i18n/locales',locale+'.json'));for(const row of entries)assert.equal(T[row.source]?.[locale],expected[row.id],'packaged translation '+locale+' '+row.id);}
for(const key of ['恢复旅行档案','开始独立新旅程','筛选属性','筛选技能','攻击起伏大，低点时防御','更耐打，适合初次冒险','战斗技巧'])assert(T[key],'new translation missing: '+key);
const steamBuild=json(path.join(release,'steam-build.json'));assert.deepEqual(steamBuild,{enabled:true,development:false,appId:5500200});assert.deepEqual(json(path.join(generated,'steam-build.json')),steamBuild);
assert(read(path.join(generated,'native/engine/common/Steam.cmake')).includes('DICEKIN_STEAM_ENABLED=1'));
assert(read(path.join(generated,'native/engine/common/Classes/SteamBridge.cpp')).includes('APP_ID = 5500200'));
const sdk=require('../tools/prepare-pc-steam.cjs').resolveSDK(),dll=path.join(release,'steam_api64.dll');assert.equal(hash(dll),hash(path.join(sdk,'redistributable_bin/win64/steam_api64.dll')),'packaged Steam DLL must match the official SDK');
const executable=fs.readFileSync(path.join(release,'Dicekin.exe'));assert(!executable.includes(Buffer.from('QA - 1s'))&&!executable.includes(Buffer.from('QA - 1s','utf16le')),'QA title in executable');
const report={passed:true,checkedAt:new Date().toISOString(),release,actualCompiledModuleTimers:compiledTimers,sourceAndCompiledAgree:true,qaMarkersAbsent:true,productionStorage:{local:S.accountSaveKey('local'),steam:S.accountSaveKey(owner)},steam:{...steamBuild,officialSDKDllMatched:true,injectedBridgeOperations:calls.map(c=>c.operation),realSteamCalled:false},fixes:{pcPetCombat:true,recoverProfile:true,startNewPCProfile:true,breedingPicker:true,breedingFilter:true,battleHelp:true},translations:{keys:entries.length,locales:locales.length,allMatchSourceCatalog:true},hashes:{bundle:hash(bundlePath),executable:hash(path.join(release,'Dicekin.exe')),steamDLL:hash(dll),generatedModel:hash(path.join(generated,'assets/scripts/PMModel.ts'))}};
fs.writeFileSync(path.join(__dirname,'steam-audit-fixes-production-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
