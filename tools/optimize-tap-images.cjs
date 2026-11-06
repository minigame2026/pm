// Optimize an isolated Creator export; source art and native APP textures stay intact.
const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),target=path.resolve(root,process.argv[2]||'build/tap-final-source');
if(!target.startsWith(path.join(root,'build')+path.sep))throw Error('Output must be inside project build directory');
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
(async()=>{
 const report=[];
 for(const file of walk(target).filter(f=>f.endsWith('.png'))){
  const input=fs.readFileSync(file),before=await sharp(input).metadata();
  const output=await sharp(input).png({palette:true,quality:80,effort:8,dither:1,compressionLevel:9}).toBuffer();
  const after=await sharp(output).metadata();
  if(before.width!==after.width||before.height!==after.height||before.hasAlpha!==after.hasAlpha)throw Error('Texture layout changed: '+file);
  if(output.length<input.length)fs.writeFileSync(file,output);
  report.push({file:path.relative(target,file),before:input.length,after:Math.min(input.length,output.length),width:before.width,height:before.height});
 }
 const summary={textures:report.length,before:report.reduce((n,r)=>n+r.before,0),after:report.reduce((n,r)=>n+r.after,0),files:report};
 fs.writeFileSync(path.join(root,'checks/tap-image-optimization.json'),JSON.stringify(summary,null,2));
 console.log(JSON.stringify({textures:summary.textures,before:summary.before,after:summary.after}));
})().catch(e=>{console.error(e);process.exitCode=1});
