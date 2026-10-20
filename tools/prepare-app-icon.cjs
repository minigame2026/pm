const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'art-source/app-icon-v4'),source=path.join(out,'source.png');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  if(process.argv[2])fs.copyFileSync(process.argv[2],source);
  const outputs=[];
  for(const size of [1024,144]){
    const file=path.join(out,`baby-pet-dice-${size}.png`);
    let data=await sharp(source).resize(size,size,{fit:'cover'}).removeAlpha().png({compressionLevel:9}).toBuffer();
    if(data.length>=2000000)data=await sharp(data).png({palette:true,quality:100,colours:256,compressionLevel:9}).toBuffer();
    if(data.length>=2000000)throw Error('Icon exceeds 2 MB');fs.writeFileSync(file,data);
    const m=await sharp(file).metadata();if(m.width!==size||m.height!==size||m.format!=='png')throw Error('Invalid icon');
    outputs.push({file:path.basename(file),width:m.width,height:m.height,bytes:data.length});
  }
  for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
    const dir=path.join(root,`native/engine/android/res/mipmap-${density}`);fs.mkdirSync(dir,{recursive:true});
    await sharp(source).resize(size,size).removeAlpha().png({compressionLevel:9}).toFile(path.join(dir,'ic_launcher.png'));
  }
  const manifestFile=path.join(out,'manifest.json'),manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{generator:'Built-in imagegen'};
  fs.writeFileSync(manifestFile,JSON.stringify({...manifest,outputs},null,2));
  console.log(outputs);
})().catch(e=>{console.error(e);process.exitCode=1;});
