const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),DEST=path.join(ROOT,'build','pc-project');
const write=(p,value)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value);};
function prepare({qaFastTimers=false}={}){
  require('./compile-pc-locales.cjs').compile();
  // Copy-on-build, never symlink or mutate the mobile source tree.
  fs.mkdirSync(DEST,{recursive:true});
  for(const dir of ['assets','settings'])fs.cpSync(path.join(ROOT,dir),path.join(DEST,dir),{recursive:true});
  for(const file of ['package.json','tsconfig.json'])fs.copyFileSync(path.join(ROOT,file),path.join(DEST,file));
  const tsconfig=JSON.parse(fs.readFileSync(path.join(ROOT,'temp/tsconfig.cocos.json')));
  tsconfig.compilerOptions.types=tsconfig.compilerOptions.types.map(p=>path.resolve(ROOT,p));
  tsconfig.compilerOptions.strict=false;tsconfig.compilerOptions.skipLibCheck=true;tsconfig.compilerOptions.lib=['ES2019','DOM'];
  tsconfig.include=['assets/scripts/**/*.ts'];write(path.join(DEST,'tsconfig.json'),JSON.stringify(tsconfig,null,2));
  const pkg=JSON.parse(fs.readFileSync(path.join(DEST,'package.json')));pkg.name='pm-creature-dice-pc';pkg.uuid='b2693783-2903-473a-a5fe-0d065994e2d7';write(path.join(DEST,'package.json'),JSON.stringify(pkg,null,2));
  for(const name of fs.readdirSync(path.join(ROOT,'pc/game')).filter(f=>f.endsWith('.ts'))){
    const target=name==='PMPCGame.ts'?'PMGame.ts':name;
    fs.copyFileSync(path.join(ROOT,'pc/game',name),path.join(DEST,'assets/scripts',target));
  }
  write(path.join(DEST,'assets/scripts/PCTextWarmupData.ts'),'// Generated from PC UI call sites; never copied to mobile.\nexport const PC_TEXT_WARMUP='+JSON.stringify(require('./pc-text-warmup.cjs').entries(ROOT))+';\n');
  const pcModel=path.join(DEST,'assets/scripts/PMModel.ts');
  write(pcModel,require('./pc-model-overrides.cjs').applyPCModelOverrides(fs.readFileSync(pcModel,'utf8').replace(/\r\n/g,'\n')));
  for(const [file,from,to] of [['DurableCheckpoint.ts','pm-checkpoints-v1','pm-pc-checkpoints-v1'],['PMAudio.ts','pm.audio.v1','pm.pc.audio.v1'],['PMLocale.ts','pm.language.v1','pm.pc.language.v1']]){
    const p=path.join(DEST,'assets/scripts',file),text=fs.readFileSync(p,'utf8');if(!text.includes(from))throw Error('Storage identity changed in '+file);write(p,text.replaceAll(from,to));
  }
  // Desktop HD menus retain recently visited textures; active pages still own their references.
  const artPath=path.join(DEST,'assets/scripts/PMArt.ts'),mobilePolicy='(this.nativeApp?96:32)*1024*1024&&now-e.last<(this.nativeApp?120000:4000)',desktopPolicy='256*1024*1024&&now-e.last<60000';
  const artSource=fs.readFileSync(artPath,'utf8');if(!artSource.includes(mobilePolicy))throw Error('Art cache policy changed; review the PC override');write(artPath,artSource.replace(mobilePolicy,desktopPolicy));
  fs.cpSync(path.join(ROOT,'pc/assets'),path.join(DEST,'assets/resources/pc'),{recursive:true});
  // Register landscape art in the generated PC copy only, using the actual PNG header dimensions.
  // Resources remain under pc/battle-scenes; do not duplicate the same bitmaps into art/.
  const sceneNames=[...Array.from({length:15},(_,i)=>'map-'+String(i+1).padStart(2,'0')+'-v1'),'raid-molten-v1'];
  const sceneSizes={},scenePaths={},scenes=[];
  for(const name of sceneNames){const file=path.join(ROOT,'pc/assets/battle-scenes',name+'.png'),image=fs.readFileSync(file),key='pc-'+name;
    if(image.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Expected PNG battle scene: '+file);
    const size=[image.readUInt32BE(16),image.readUInt32BE(20)];if(size[0]<1600||size[1]<900)throw Error('PC scene source is too small: '+file);
    sceneSizes[key]=size;scenePaths[key]='pc/battle-scenes/'+name;scenes.push({key,resource:scenePaths[key],sourcePixels:size,sha256:crypto.createHash('sha256').update(image).digest('hex')});
  }
  const sizePath=path.join(DEST,'assets/scripts/ArtSourceSizes.ts');fs.appendFileSync(sizePath,'\n// PC-only original landscape sources, generated from PNG headers.\nObject.assign(ART_SOURCE_SIZES,'+JSON.stringify(sceneSizes)+');\n');
  const textureRoute="resources.load('art/'+source+'/texture',Texture2D",pcTextureRoute="resources.load((PC_ART_PATHS[source]||'art/'+source)+'/texture',Texture2D";
  const pcArtSource=fs.readFileSync(artPath,'utf8');if(!pcArtSource.includes(textureRoute))throw Error('PMArt texture loader changed; review PC scene mapping');
  write(artPath,pcArtSource.replace('type Spec=', 'const PC_ART_PATHS:Record<string,string>='+JSON.stringify(scenePaths)+';\n\ntype Spec=').replace(textureRoute,pcTextureRoute));
  write(path.join(DEST,'pc-battle-scenes.json'),JSON.stringify({scenes},null,2));
  // Restore actual source pixels in the PC copy only; this is not upscaling.
  const hd=[];const masters=path.join(ROOT,'art-source/runtime-masters-v1');
  for(const name of fs.readdirSync(masters).filter(n=>n.endsWith('.png'))){const target=path.join(DEST,'assets/resources/art',name);if(!fs.existsSync(target))continue;
    const src=fs.readFileSync(path.join(masters,name)),runtime=fs.readFileSync(target),sw=src.readUInt32BE(16),sh=src.readUInt32BE(20),rw=runtime.readUInt32BE(16),rh=runtime.readUInt32BE(20);
    if(sw>rw||sh>rh){fs.writeFileSync(target,src);hd.push({file:name,sourcePixels:[sw,sh],mobilePixels:[rw,rh]});}
  }
  write(path.join(DEST,'pc-hd-assets.json'),JSON.stringify(hd,null,2));
  const config={...JSON.parse(fs.readFileSync(path.join(ROOT,'build-config.json'))),platform:'web-desktop',name:'Dicekin: Monster Tamer',outputName:'web-desktop',debug:true,buildPath:'project://build',logDest:path.join(ROOT,'checks/pc-build.log'),packages:{'web-desktop':{embedWebDebugger:false}}};
  write(path.join(DEST,'build-pc.json'),JSON.stringify(config,null,2));
  const hashes={};for(const file of ['PMModel.ts','PMGame.ts','PMArt.ts','DurableCheckpoint.ts','PMAudio.ts'])hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'assets/scripts',file))).digest('hex');
  const profile=qaFastTimers?require('./pc-test-profile.cjs').applyTestProfile(DEST):{profile:'production',storage:'pm.pc.creature-dice.v1'};
  write(path.join(DEST,'pc-manifest.json'),JSON.stringify({generatedFrom:ROOT,engine:'3.8.7',...profile,sourceHashes:hashes},null,2));
  console.log(DEST);return DEST;
}
if(require.main===module)prepare();module.exports={prepare,DEST};
