const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {prepareTapProject}=require('../tools/prepare-tap-project.cjs');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pm-tap-project-'));
const source=path.join(temp,'source'),target=path.join(source,'build','tap-isolated');
const write=(p,text)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);};
const meta=uuid=>JSON.stringify({ver:'1.0.0',importer:'image',uuid,userData:{}});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const calls=[];
(async()=>{
 try{
  for(const file of ['PMArt.ts','PMAudio.ts'])write(path.join(source,'assets/scripts',file),fs.readFileSync(path.join(__dirname,'../assets/scripts',file)));
  write(path.join(source,'assets/scripts/LocalizedLogoArt.ts'),'export const LOCALIZED_LOGOS={"login-title-en-v1":{},"login-title-ja-v1":{}};');
  write(path.join(source,'assets/resources/shiny-pet.effect'),'CCEffect %{ techniques: [] }%');
  write(path.join(source,'assets/resources/shiny-pet.effect.meta'),meta('effect-uuid'));
  const names=['login-cover-v2','login-button-v4','login-title-v3','login-title-en-v1','login-title-ja-v1','fox-battle-ref','fox-evolution-v1','aurora-forms-v1','wombat-forms-v1'];
  for(const name of names){write(path.join(source,'assets/resources/art',name+'.png'),Buffer.alloc(20));write(path.join(source,'assets/resources/art',name+'.png.meta'),meta(name+'-uuid'));}
  for(const id of ['camp-short','battle-normal','click','hurt']){write(path.join(source,'assets/resources/audio',id+'.mp3'),Buffer.alloc(9));write(path.join(source,'assets/resources/audio',id+'.mp3.meta'),meta(id+'-uuid'));}
  write(path.join(source,'assets/resources.meta'),JSON.stringify({importer:'directory',uuid:'resources-uuid',userData:{isBundle:true,bundleName:'resources'}}));
  write(path.join(source,'settings/v2/packages/engine.json'),JSON.stringify({modules:{configs:{tap2d:{includeModules:['base','2d']}},globalConfigKey:'defaultConfig'}}));
  write(path.join(source,'package.json'),'{}');write(path.join(source,'tsconfig.json'),'{}');
  write(path.join(source,'checks/build-tap-final.json'),JSON.stringify({platform:'wechatgame',engineModulesConfigKey:'tap2d',outputName:'tap-final-source',bundleConfigs:[]}));
  const before=hash(path.join(source,'assets/scripts/PMArt.ts'));
  const result=prepareTapProject({sourceRoot:source,targetDir:target,bundleBytes:45});
  assert.equal(hash(path.join(source,'assets/scripts/PMArt.ts')),before,'the original APP/Web source must stay unchanged');
  assert.equal(result.projectDir,target);assert(result.bundles.length>=4);
  const map=result.routes;
  for(const name of names.slice(0,5)){assert.equal(map['art/'+name],undefined);assert(fs.existsSync(path.join(target,'assets/resources/art',name+'.png')));}
  assert(fs.existsSync(path.join(target,'assets/resources/shiny-pet.effect')));
  for(const name of names.slice(5)){
   const bundle=map['art/'+name];assert(bundle);assert(!fs.existsSync(path.join(target,'assets/resources/art',name+'.png')));
   const moved=path.join(target,'assets/tap-bundles',bundle,'art',name+'.png');assert(fs.existsSync(moved));assert.equal(JSON.parse(fs.readFileSync(moved+'.meta')).uuid,name+'-uuid');
  }
  assert.notEqual(map['audio/camp-short'],map['audio/battle-normal'],'music tracks must download independently');
  assert.equal(map['audio/click'],map['audio/hurt'],'short effects may share their small bundle');
  const build=JSON.parse(fs.readFileSync(path.join(target,'build-tap.json')));
  assert.equal(build.engineModulesConfigKey,'tap2d');
  for(const b of build.bundleConfigs.filter(b=>b.name!=='resources')){assert.equal(b.compressionType,'subpackage');assert.equal(b.isRemote,false);}
  const builderSettings=JSON.parse(fs.readFileSync(path.join(target,'settings/v2/packages/builder.json')));
  const preset=builderSettings.bundleConfig.custom.tapLocalSubpackages;
  assert.equal(preset.configs.miniGame.preferredOptions.compressionType,'subpackage');
  assert.equal(preset.configs.miniGame.preferredOptions.isRemote,false);
  for(const b of result.bundles)assert.equal(JSON.parse(fs.readFileSync(path.join(target,'assets/tap-bundles',b.name+'.meta'))).userData.bundleConfigID,'tapLocalSubpackages');
  assert.equal(build.server,'');assert.equal(build.packages.wechatgame.remoteServerAddress,'');
  assert.throws(()=>prepareTapProject({sourceRoot:source,targetDir:target}),/exists/i);
  assert.throws(()=>prepareTapProject({sourceRoot:source,targetDir:path.join(temp,'outside')}),/inside.*build/i);
  const art=fs.readFileSync(path.join(target,'assets/scripts/PMArt.ts'),'utf8'),audio=fs.readFileSync(path.join(target,'assets/scripts/PMAudio.ts'),'utf8');
  assert(art.includes('loadTapResource('));assert(!art.includes('resources.load('));
  assert(audio.includes('loadTapResource(')&&audio.includes('releaseTapResource('));assert(!audio.includes('resources.load('));assert(!audio.includes('resources.release('));
  let bundleAttempts=0,assetAttempts=0,failBundle=false,failAsset=false;
  const bundles=new Map();let finishBundle;
  const bundleFor=name=>({load(p,type,cb){calls.push(['load',name,p]);assetAttempts++;if(failAsset){failAsset=false;cb(Error('asset failed'));}else cb(null,{path:p});},release(p){calls.push(['release',name,p]);}});
  const cc={resources:bundleFor('resources'),assetManager:{getBundle:name=>bundles.get(name),loadBundle(name,cb){bundleAttempts++;calls.push(['bundle',name]);finishBundle=()=>{if(failBundle){failBundle=false;cb(Error('bundle failed'));}else{const b=bundleFor(name);bundles.set(name,b);cb(null,b);}};}}};
  const exports={};const js=ts.transpileModule(fs.readFileSync(path.join(target,'assets/scripts/PMTapResourceLoader.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(js,{exports,require:()=>cc,console,Map,Promise,Error});
  assert.equal(bundleAttempts,0,'importing the loader must not download content');
  const Type=class Texture{};
  const load=p=>new Promise((resolve,reject)=>exports.loadTapResource(p,Type,(e,a)=>e?reject(e):resolve(a)));
  await load('art/login-cover-v2/texture');assert.equal(bundleAttempts,0);
  const p='art/fox-battle-ref/texture';
  const a=load(p),b=load(p);assert.equal(bundleAttempts,1);finishBundle();
  const values=await Promise.all([a,b]);assert.equal(values[0],values[1]);assert.equal(calls.filter(c=>c[0]==='load'&&c[2]===p).length,1,'concurrent requests merge at both bundle and asset level');
  exports.releaseTapResource(p,Type);assert(calls.some(c=>c[0]==='release'&&c[1]===map['art/fox-battle-ref']&&c[2]===p));
  const untouched='art/wombat-forms-v1/texture';exports.releaseTapResource(untouched,Type);assert.equal(bundleAttempts,1,'release must not download an unopened bundle');
  failBundle=true;const failed=load(untouched);finishBundle();await assert.rejects(failed,/bundle failed/);
  const retry=load(untouched);finishBundle();await retry;assert.equal(bundleAttempts,3,'failed bundles must allow a later retry');
  failAsset=true;await assert.rejects(load(untouched),/asset failed/);await load(untouched);
  const deferred='audio/battle-normal';let delivered=false;
  const delayed=new Promise((resolve,reject)=>exports.loadTapResource(deferred,Type,(e,a)=>{delivered=true;assert(!calls.some(c=>c[0]==='release'&&c[2]===deferred),'release must wait until pending callbacks receive their asset');e?reject(e):resolve(a);}));
  exports.releaseTapResource(deferred,Type);finishBundle();await delayed;assert(delivered);assert(calls.some(c=>c[0]==='release'&&c[2]===deferred));
  assert(assetAttempts>0);console.log('PASS: isolated Tap project, UUID-preserving local bundles, lazy merged loading, retry, and routed release');
 }finally{assert(temp.startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
