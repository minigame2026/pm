// Prepare a fresh, local-only Tap project without changing APP/Web assets or UUIDs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),MIB=1024*1024;
const SUBPACKAGE_PRESET='tapLocalSubpackages';
function inside(parent,child){return path.resolve(child).startsWith(path.resolve(parent)+path.sep);}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function json(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function write(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
function writeJson(file,value){write(file,JSON.stringify(value,null,2)+'\n');}
function directoryMeta(file,userData={}){writeJson(file,{ver:'1.2.0',importer:'directory',imported:true,uuid:crypto.randomUUID(),files:[],subMetas:{},userData});}
function configureTapSubpackages({sourceRoot=ROOT,projectDir,bundleNames}={}){
 projectDir=path.resolve(projectDir);
 if(!inside(path.join(sourceRoot,'build'),projectDir))throw Error('The isolated project must be inside the source build directory');
 bundleNames=bundleNames||json(path.join(projectDir,'tap-project-manifest.json')).bundles.map(b=>b.name);
 const file=path.join(projectDir,'settings/v2/packages/builder.json');
 const settings=fs.existsSync(file)?json(file):{__version__:'1.3.9'};
 const local={isRemote:false,compressionType:'merge_dep'};
 settings.bundleConfig=settings.bundleConfig||{};settings.bundleConfig.custom=settings.bundleConfig.custom||{};
 settings.bundleConfig.custom[SUBPACKAGE_PRESET]={displayName:'Tap local subpackages',configs:{
  native:{preferredOptions:{...local},fallbackOptions:{...local},configMode:'auto'},
  web:{preferredOptions:{...local},fallbackOptions:{...local},configMode:'auto'},
  miniGame:{preferredOptions:{isRemote:false,compressionType:'subpackage'},fallbackOptions:{...local},configMode:'auto'}
 }};
 // Creator 3.8 full builds resolve this preset through each directory's bundleConfigID.
 // Task-level bundleConfigs alone only configures individual-bundle builds.
 for(const name of bundleNames){
  if(!/^[\w-]+$/.test(name))throw Error('Invalid Tap bundle name: '+name);
  const metaFile=path.join(projectDir,'assets/tap-bundles',name+'.meta'),meta=json(metaFile);
  if(!meta.userData?.isBundle)throw Error('Missing Tap bundle metadata: '+name);
  meta.userData.bundleConfigID=SUBPACKAGE_PRESET;writeJson(metaFile,meta);
 }
 writeJson(file,settings);
 const buildFile=path.join(projectDir,'build-tap.json');
 if(fs.existsSync(buildFile)){const build=json(buildFile);build.useBuildAssetCache=false;writeJson(buildFile,build);}
 return {preset:SUBPACKAGE_PRESET,bundles:bundleNames.length};
}
function chunks(units,budget){
 const result=[];let current=[],bytes=0;
 for(const unit of units){const size=unit.reduce((n,x)=>n+x.bytes,0);if(current.length&&bytes+size>budget){result.push(current);current=[];bytes=0;}current.push(...unit);bytes+=size;}
 if(current.length)result.push(current);return result;
}
function planBundles(entries,budget){
 const groups=[];
 const add=(prefix,sets)=>sets.forEach((entries,i)=>groups.push({name:prefix+String(i+1).padStart(2,'0'),entries}));
 const early=/^(home-|trainer-|(?:fox|bud|turtle)(?:$|-)|attack-die-|heal-potion|power-potion|guard-shield|egg-nest-|battle-arena|battle-start)/;
 const art=entries.filter(x=>x.logical.startsWith('art/'));
 for(const [prefix,isEarly] of [['tapartcore',true],['tapart',false]]){
  const units=new Map();
  for(const e of art.filter(x=>early.test(path.basename(x.logical))===isEarly)){
   const key=e.logical.replace(/-(?:battle-ref|battle-v\d+|evolution-v\d+|forms-v\d+)$/,'');
   if(!units.has(key))units.set(key,[]);units.get(key).push(e);
  }
  add(prefix,chunks([...units.values()],budget));
 }
 const audio=entries.filter(x=>x.logical.startsWith('audio/'));
 const music=audio.filter(x=>/\/(?:camp-|battle-|egg-quest$)/.test(x.logical));
 add('tapmusic',music.map(x=>[x]));
 add('tapsfx',chunks(audio.filter(x=>!music.includes(x)).map(x=>[x]),budget));
 return groups;
}
function startupAssets(sourceRoot){
 const resources=path.join(sourceRoot,'assets/resources'),keep=new Set(['shiny-pet.effect','art/login-cover-v2.png','art/login-button-v4.png','art/login-title-v3.png']);
 const logos=fs.readFileSync(path.join(sourceRoot,'assets/scripts/LocalizedLogoArt.ts'),'utf8');
 for(const m of logos.matchAll(/["'](login-title-[\w-]+)["']\s*:/g))keep.add('art/'+m[1]+'.png');
 // Keep resource dependencies of the first-screen effect in the same main bundle.
 const byUuid=new Map();
 for(const file of files(path.join(sourceRoot,'assets')).filter(x=>x.endsWith('.meta'))){const data=json(file);if(data.uuid)byUuid.set(data.uuid,file.slice(0,-5));}
 const queue=[...keep].map(x=>path.join(resources,x)),seen=new Set();
 for(let i=0;i<queue.length;i++){
  const file=queue[i];if(seen.has(file))continue;seen.add(file);
  if(!fs.existsSync(file)||!fs.existsSync(file+'.meta'))throw Error('Missing first-screen asset/meta: '+file);
  if(!/\.(?:effect|mtl|json|anim|prefab)$/i.test(file))continue;
  for(const uuid of fs.readFileSync(file,'utf8').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)||[]){
   const dependency=byUuid.get(uuid);if(!dependency||!inside(resources,dependency))continue;
   keep.add(path.relative(resources,dependency).split(path.sep).join('/'));queue.push(dependency);
  }
 }
 return keep;
}
function loaderSource(routes){return String.raw`// Generated only in the isolated Tap project. Bundle descriptors stay cached; assets release normally.
import { Asset, AssetManager, assetManager, Constructor, resources } from 'cc';
const routes:Record<string,string>=__ROUTES__;
type Kind=Constructor<Asset>;
type Done=(error:Error|null,value:Asset|null)=>void;
type Pending={callbacks:Done[];release:boolean};
const bundleLoads=new Map<string,Promise<AssetManager.Bundle>>();
const assetLoads=new Map<Kind,Map<string,Pending>>();
function route(path:string){return routes[path]||routes[path.replace(/\/(?:texture|spriteFrame)$/,'')];}
function bundle(name:string):Promise<AssetManager.Bundle>{
 const existing=assetManager.getBundle(name);if(existing)return Promise.resolve(existing);
 let task=bundleLoads.get(name);if(task)return task;
 task=new Promise((resolve,reject)=>assetManager.loadBundle(name,(error,value)=>error?reject(error):resolve(value)));
 bundleLoads.set(name,task);task.then(()=>bundleLoads.delete(name),()=>bundleLoads.delete(name));return task;
}
function release(path:string,type:Kind){const name=route(path),owner=name?assetManager.getBundle(name):resources;if(owner)owner.release(path,type);}
export function loadTapResource<T extends Asset>(path:string,type:Constructor<T>,done:(error:Error|null,value:T|null)=>void){
 let typed=assetLoads.get(type);if(!typed){typed=new Map();assetLoads.set(type,typed);}
 const existing=typed.get(path);if(existing){existing.callbacks.push(done as Done);return;}
 const entry:Pending={callbacks:[done as Done],release:false};typed.set(path,entry);
 const name=route(path),owner=name?bundle(name):Promise.resolve(resources);
 owner.then(value=>new Promise<Asset>((resolve,reject)=>value.load(path,type,(error,asset)=>error?reject(error):resolve(asset)))).then(
  asset=>{try{for(const cb of entry.callbacks)cb(null,asset);}finally{typed!.delete(path);if(entry.release)release(path,type);}},
  error=>{typed!.delete(path);for(const cb of entry.callbacks)cb(error instanceof Error?error:Error(String(error)),null);});
}
export function releaseTapResource<T extends Asset>(path:string,type:Constructor<T>){
 const pending=assetLoads.get(type)?.get(path);if(pending){pending.release=true;return;}release(path,type);
}
`.replace('__ROUTES__',JSON.stringify(routes));}
function patchSource(source,name){
 const loads=(source.match(/\bresources\.load\(/g)||[]).length;
 if(!loads)throw Error(name+' resources.load anchor is missing');
 let result="import { loadTapResource, releaseTapResource } from './PMTapResourceLoader';\n"+source.replace(/\bresources\.load\(/g,'loadTapResource(').replace(/\bresources\.release\(/g,'releaseTapResource(');
 if(/\bresources\.(?:load|release)\(/.test(result))throw Error('Incomplete resource routing: '+name);
 return result;
}
function prepareTapProject({sourceRoot=ROOT,targetDir,bundleBytes=12*MIB}={}){
 sourceRoot=path.resolve(sourceRoot);targetDir=path.resolve(sourceRoot,targetDir||'');
 if(!inside(path.join(sourceRoot,'build'),targetDir))throw Error('The isolated project must be inside the source build directory');
 if(fs.existsSync(targetDir))throw Error('Isolated project already exists; choose a fresh target: '+targetDir);
 if(!Number.isSafeInteger(bundleBytes)||bundleBytes<=0)throw Error('Invalid source-byte bundle budget');
 const keep=startupAssets(sourceRoot),resourceRoot=path.join(sourceRoot,'assets/resources');
 const entries=files(resourceRoot).filter(file=>!file.endsWith('.meta')).map(file=>{
  const relative=path.relative(resourceRoot,file).split(path.sep).join('/');
  return {file,relative,logical:relative.replace(/\.[^/.]+$/,''),bytes:fs.statSync(file).size};
 }).filter(e=>/^(art|audio)\//.test(e.relative)&&!keep.has(e.relative)).sort((a,b)=>a.relative.localeCompare(b.relative,'en'));
 for(const e of entries)if(!fs.existsSync(e.file+'.meta'))throw Error('Missing asset UUID metadata: '+e.file);
 const bundles=planBundles(entries,bundleBytes),routes={};
 const patches={};for(const name of ['PMArt.ts','PMAudio.ts'])patches[name]=patchSource(fs.readFileSync(path.join(sourceRoot,'assets/scripts',name),'utf8'),name);
 const build=json(path.join(sourceRoot,'checks/build-tap-final.json'));
 const engine=json(path.join(sourceRoot,'settings/v2/packages/engine.json'));
 if(!engine.modules?.configs?.tap2d)throw Error('The isolated build requires the existing tap2d engine configuration');
 fs.mkdirSync(targetDir,{recursive:true});
 for(const name of ['assets','settings','package.json','tsconfig.json'])fs.cpSync(path.join(sourceRoot,name),path.join(targetDir,name),{recursive:true,errorOnExist:true});
 directoryMeta(path.join(targetDir,'assets/tap-bundles.meta'));
 for(const group of bundles){
  const root=path.join(targetDir,'assets/tap-bundles',group.name);
  fs.mkdirSync(root,{recursive:true});directoryMeta(root+'.meta',{isBundle:true,bundleConfigID:'default',bundleName:group.name,priority:8});
  const dirs=new Set();
  for(const e of group.entries){
   const from=path.join(targetDir,'assets/resources',e.relative),to=path.join(root,e.relative);
   if(!inside(targetDir,from)||!inside(targetDir,to))throw Error('Unsafe isolated asset path');
   fs.mkdirSync(path.dirname(to),{recursive:true});
   for(let p=path.dirname(to);p!==root;p=path.dirname(p))dirs.add(p);
   fs.renameSync(from,to);fs.renameSync(from+'.meta',to+'.meta');routes[e.logical]=group.name;
  }
  for(const dir of dirs)directoryMeta(dir+'.meta');
 }
 for(const [name,text] of Object.entries(patches))write(path.join(targetDir,'assets/scripts',name),text);
 write(path.join(targetDir,'assets/scripts/PMTapResourceLoader.ts'),loaderSource(routes));
 writeJson(path.join(targetDir,'assets/scripts/PMTapResourceLoader.ts.meta'),{ver:'4.0.24',importer:'typescript',imported:true,uuid:crypto.randomUUID(),files:[],subMetas:{},userData:{}});
 build.engineModulesConfigKey='tap2d';build.server='';build.buildPath='project://build';build.logDest=path.join(targetDir,'tap-build.log');
 build.packages=build.packages||{};build.packages.wechatgame={...build.packages.wechatgame,remoteServerAddress:'',separateEngine:false};
 build.bundleConfigs=[{root:'db://assets/resources',name:'resources',isRemote:false,compressionType:'merge_dep',output:true},...bundles.map(b=>({root:'db://assets/tap-bundles/'+b.name,name:b.name,isRemote:false,compressionType:'subpackage',output:true}))];
 writeJson(path.join(targetDir,'build-tap.json'),build);
 configureTapSubpackages({sourceRoot,projectDir:targetDir,bundleNames:bundles.map(b=>b.name)});
 const summary={projectDir:targetDir,buildConfig:path.join(targetDir,'build-tap.json'),sourceByteBudget:bundleBytes,budgetIsPlatformLimit:false,firstScreen:[...keep].sort(),routes,bundles:bundles.map(b=>({name:b.name,sourceBytes:b.entries.reduce((n,e)=>n+e.bytes,0),assets:b.entries.map(e=>e.relative)}))};
 writeJson(path.join(targetDir,'tap-project-manifest.json'),summary);return summary;
}
module.exports={prepareTapProject,loaderSource,planBundles,configureTapSubpackages};
if(require.main===module){try{
 if(!process.argv[2])throw Error('Usage: node tools/prepare-tap-project.cjs build/<fresh-project-name>');
 const result=prepareTapProject({targetDir:process.argv[2]});console.log(JSON.stringify({projectDir:result.projectDir,buildConfig:result.buildConfig,bundles:result.bundles.map(({name,sourceBytes})=>({name,sourceBytes})),firstScreenAssets:result.firstScreen.length}));
}catch(error){console.error(error.message);process.exitCode=1;}}
