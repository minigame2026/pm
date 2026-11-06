// Downsize only exported title PNGs. Original art, UUIDs, scripts and crop coordinates stay intact.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const ROOT=path.resolve(__dirname,'..');
const inside=(parent,child)=>path.resolve(child).startsWith(path.resolve(parent)+path.sep);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
async function optimizeTapStartup(exportDir){
 if(!exportDir)throw Error('Usage: node tools/optimize-tap-startup.cjs <export-dir>');
 const build=fs.realpathSync(path.join(ROOT,'build')),target=fs.realpathSync(path.resolve(ROOT,exportDir));
 if(!inside(build,target))throw Error('Export directory must be inside this project build directory');
 const native=fs.realpathSync(path.join(target,'assets/resources/native'));
 if(!inside(target,native))throw Error('Export native resources must remain inside the export directory');
 const originals=path.join(ROOT,'assets/resources/art'),titles=new Map();
 for(const name of fs.readdirSync(originals).filter(name=>/^login-title-.*\.png\.meta$/.test(name))){
  const data=JSON.parse(fs.readFileSync(path.join(originals,name),'utf8'));
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.uuid))throw Error('Invalid title UUID: '+name);
  titles.set(data.uuid+'.png',name.slice(0,-5));
 }
 const report=[];
 for(const file of walk(native)){
  const source=titles.get(path.basename(file));if(!source)continue;
  if(!inside(native,fs.realpathSync(file)))throw Error('Title PNG resolves outside native resources');
  const input=fs.readFileSync(file),before=await sharp(input).metadata();
  if(before.format!=='png'||!before.width||!before.height)throw Error('Invalid exported title PNG: '+file);
  let output=input,after=before;
  if(before.width>1024){
   output=await sharp(input).resize({width:1024,withoutEnlargement:true}).png({palette:true,quality:80,effort:8,dither:1,compressionLevel:9}).toBuffer();
   after=await sharp(output).metadata();
   if(after.width!==1024||after.height!==Math.round(before.height*1024/before.width)||before.hasAlpha!==after.hasAlpha)throw Error('Title dimensions or alpha validation failed: '+source);
   fs.writeFileSync(file,output);
  }
  report.push({source,file:path.relative(target,file).split(path.sep).join('/'),changed:before.width>1024,before:{width:before.width,height:before.height,bytes:input.length,alpha:before.hasAlpha},after:{width:after.width,height:after.height,bytes:output.length,alpha:after.hasAlpha}});
 }
 return {exportDir:target,maxTitleWidth:1024,matched:report.length,changed:report.filter(item=>item.changed).length,beforeBytes:report.reduce((n,item)=>n+item.before.bytes,0),afterBytes:report.reduce((n,item)=>n+item.after.bytes,0),files:report};
}
module.exports={optimizeTapStartup};
if(require.main===module)optimizeTapStartup(process.argv[2]).then(report=>console.log(JSON.stringify(report,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
