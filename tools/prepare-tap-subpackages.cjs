// Prepare an actual Creator 3.8 mini-game export, before the official Tap converter.
// Tap contract: https://developer.taptap.cn/minigameapidoc/dev/tutorial/basic/subpackage/
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const BRIDGE="(/* PM_TAP_SUBPACKAGE_BRIDGE */typeof tap !== 'undefined' && tap ? tap : wx).loadSubpackage(";
function prepare(directory,options={}){
  const root=fs.realpathSync(path.resolve(directory)),files=new Map(),changes=new Map();
  function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,item.name);
    if(item.isSymbolicLink())throw Error('Export cannot contain symbolic links: '+path.relative(root,file));
    if(item.isDirectory())walk(file);else if(item.isFile())files.set(path.relative(root,file).split(path.sep).join('/'),fs.statSync(file).size);
  }}
  walk(root);
  const text=file=>{if(!files.has(file))throw Error('Missing export file: '+file);return fs.readFileSync(path.join(root,file),'utf8');};
  const json=file=>JSON.parse(text(file));
  const stage=(file,value)=>{if(!files.has(file)||text(file)!==value)changes.set(file,value);};
  const config=json('game.json'),settings=json('src/settings.json');
  new vm.Script(text('game.js'),{filename:'game.js'});
  if(settings.CocosEngine&&!/^3\.8\./.test(settings.CocosEngine))throw Error('Expected a Creator 3.8 export');
  const canonical=list=>{
    if(!Array.isArray(list)||!list.length)throw Error('A real Creator subpackage export is required');
    const names=new Set();
    return list.map(item=>{
      if(!item||typeof item.name!=='string'||!/^[A-Za-z0-9_-]+$/.test(item.name)||names.has(item.name))throw Error('Invalid or duplicate subpackage name');
      names.add(item.name);
      if(typeof item.root!=='string'||item.root.replace(/\/$/,'')!=='subpackages/'+item.name)throw Error('Subpackage root must match the actual Creator path: '+item.name);
      return {...item,root:'subpackages/'+item.name+'/'};
    });
  };
  const packages=canonical(config.subPackages||config.subpackages);
  if(config.subPackages&&config.subpackages&&JSON.stringify(canonical(config.subPackages))!==JSON.stringify(canonical(config.subpackages)))throw Error('Conflicting subPackages and subpackages configuration');
  const names=packages.map(item=>item.name),sorted=list=>[...list].sort();
  if(!Array.isArray(settings.assets?.subpackages)||JSON.stringify(sorted(settings.assets.subpackages))!==JSON.stringify(sorted(names)))throw Error('game.json and settings.assets.subpackages do not match');
  if(settings.assets.remoteBundles?.length)throw Error('This preparation expects platform-hosted local subpackages, not remote bundles');
  const preloads=(settings.assets.preloadBundles||[]).map(item=>typeof item==='string'?item:item.bundle);
  const lazyNames=names.filter(name=>!['main','resources','start-scene','internal'].includes(name));
  if(lazyNames.some(name=>preloads.includes(name)))throw Error('Content subpackage is eagerly included in preloadBundles');
  for(const item of packages){
    const version=settings.assets.bundleVers?.[item.name],folder=item.root;
    const bundle=json(folder+'config.'+(version?version+'.':'')+'json');
    if(bundle.name!==item.name)throw Error('Bundle config.name does not match '+item.name);
    if((bundle.deps||[]).some(dep=>names.includes(dep)))throw Error('Tap subpackages cannot depend on a sibling subpackage: '+item.name);
    const entry=folder+'game.js';
    if(!files.has(entry)){
      const candidates=[folder+'index.'+(version?version+'.':'')+'js',folder+'index.js'].filter((file,index,all)=>all.indexOf(file)===index&&files.has(file));
      if(candidates.length!==1)throw Error('Missing or ambiguous Creator subpackage entry: '+item.name);
      const index=candidates[0];new vm.Script(text(index),{filename:index});
      stage(entry,'// Tap executes game.js after native subpackage loading.\n// Forward the unchanged Creator-generated entry; do not signal load success here.\nrequire('+JSON.stringify('./'+path.posix.basename(index))+');\n');
    }else new vm.Script(text(entry),{filename:entry});
  }
  for(const preload of preloads){
    if(typeof preload!=='string'||!/^[A-Za-z0-9_-]+$/.test(preload))throw Error('Unexpected preload bundle name');
    const version=settings.assets.bundleVers?.[preload],base=names.includes(preload)?'subpackages/':'assets/';
    const file=base+preload+'/config.'+(version?version+'.':'')+'json';
    if(files.has(file)&&(json(file).deps||[]).some(dep=>lazyNames.includes(dep)))throw Error('Startup bundle depends on lazy content: '+preload);
  }
  for(const file of files.keys())if(file.startsWith('subpackages/')){
    const name=file.split('/')[1];if(!names.includes(name))throw Error('Undeclared subpackage directory: '+name);
  }
  const engine=text('engine-adapter.js');
  if(!engine.includes('fsUtils')||!engine.includes('loadSubpackage')||!engine.includes('subpackages/'))throw Error('Unsupported Creator engine-adapter subpackage loading chain');
  const adapter=text('web-adapter.js'),calls=adapter.match(/\bwx\.loadSubpackage\s*\(/g)||[];
  let patched=adapter;
  if(adapter.includes('PM_TAP_SUBPACKAGE_BRIDGE')){
    // The official converter adds whitespace around the unchanged expression.
    if(calls.length||adapter.split('PM_TAP_SUBPACKAGE_BRIDGE').length!==2||!adapter.replace(/\s+/g,'').includes(BRIDGE.replace(/\s+/g,'')))throw Error('Unexpected existing Tap subpackage bridge');
  }else{
    if(calls.length!==1)throw Error('Expected one actual wx.loadSubpackage call in Creator web-adapter');
    patched=adapter.replace(/\bwx\.loadSubpackage\s*\(/,BRIDGE);
  }
  new vm.Script(patched,{filename:'web-adapter.js'});stage('web-adapter.js',patched);
  config.subPackages=packages;delete config.subpackages;stage('game.json',JSON.stringify(config,null,2)+'\n');
  const sizes=new Map(files);for(const [file,value] of changes)sizes.set(file,Buffer.byteLength(value));
  const result={directory:root,changed:[...changes.keys()],mainBytes:0,totalBytes:0,packages:packages.map(item=>({name:item.name,root:item.root,bytes:0,files:0}))};
  for(const [file,bytes] of sizes){result.totalBytes+=bytes;const owner=result.packages.find(item=>file.startsWith(item.root));if(owner){owner.bytes+=bytes;owner.files++;}else result.mainBytes+=bytes;}
  if(options.maxSubpackageMiB!==undefined){
    if(!Number.isFinite(options.maxSubpackageMiB)||options.maxSubpackageMiB<=0)throw Error('maxSubpackageMiB must be a positive number');
    const oversized=result.packages.find(item=>item.bytes>options.maxSubpackageMiB*1048576);
    if(oversized)throw Error('Subpackage exceeds the requested uncompressed size limit: '+oversized.name);
  }
  if(options.check&&changes.size)throw Error('Export requires preparation: '+[...changes.keys()].join(', '));
  if(!options.check)for(const [file,value] of changes)fs.writeFileSync(path.join(root,file),value);
  return result;
}
if(require.main===module){
  try{
    const args=process.argv.slice(2),directory=args.shift(),options={};
    if(!directory||directory.startsWith('--'))throw Error('Usage: node tools/prepare-tap-subpackages.cjs <export/game directory> [--check] [--max-subpackage-mib N]');
    while(args.length){const flag=args.shift();if(flag==='--check')options.check=true;else if(flag==='--max-subpackage-mib')options.maxSubpackageMiB=Number(args.shift());else throw Error('Unknown option: '+flag);}
    console.log(JSON.stringify(prepare(directory,options),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={prepare};
