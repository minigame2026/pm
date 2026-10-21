// Normalize approved localized title art; preserve alpha and load one locale at runtime.
const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'art-source/login-localized-v2');
(async()=>{
 const sources=JSON.parse(fs.readFileSync(path.join(dir,'sources.json'),'utf8'));
 const registryFile=path.join(root,'assets/scripts/LocalizedLogoArt.ts');
 const text=fs.readFileSync(registryFile,'utf8'),registry=JSON.parse(text.slice(text.indexOf('=')+1,text.lastIndexOf(';')));
 const outputs=[];
 for(const {locale,source} of sources){
  const original=path.join(dir,`${locale}-source.png`);
  if(!fs.existsSync(original))fs.copyFileSync(source,original);
  const key=`login-title-${locale}-v1`,file=path.join(root,`assets/resources/art/${key}.png`);
  await sharp(original).trim({background:'#00000000',threshold:8}).resize({width:1024,height:430,fit:'inside',withoutEnlargement:true}).png({compressionLevel:9}).toFile(file);
  const m=await sharp(file).metadata();
  if(!m.hasAlpha)throw Error('Missing transparency: '+locale);
  registry[key]={size:[m.width,m.height],rect:[0,0,m.width,m.height]};
  outputs.push({locale,file:`assets/resources/art/${key}.png`,width:m.width,height:m.height,bytes:fs.statSync(file).size,source:`art-source/login-localized-v2/${locale}-source.png`});
 }
 fs.writeFileSync(registryFile,'/** Localized title images: original pixel dimensions and alpha bounds. */\nexport const LOCALIZED_LOGOS:Record<string,{size:[number,number];rect:[number,number,number,number]}>= '+JSON.stringify(registry,null,2)+';\n');
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({tool:'built-in image_gen',outputs},null,2));
 console.log(outputs);
})().catch(e=>{console.error(e);process.exitCode=1;});
