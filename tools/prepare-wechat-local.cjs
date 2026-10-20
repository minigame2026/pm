// Keep scripts in the mini-game package; serve large textures/audio separately.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../build'),game=path.join(root,'wechatgame'),remote=path.join(root,'wechat-remote/remote/resources');
const source=path.join(game,'assets/resources'),scripts=path.join(game,'src/bundle-scripts/resources');
if(fs.existsSync(source)){
  fs.mkdirSync(scripts,{recursive:true});
  for(const name of fs.readdirSync(source).filter(x=>/^index.*\.js$/.test(x)))fs.copyFileSync(path.join(source,name),path.join(scripts,name));
  fs.mkdirSync(remote,{recursive:true});fs.cpSync(source,remote,{recursive:true});
  if(!source.startsWith(root+path.sep))throw Error('Unexpected build path');
  fs.rmSync(source,{recursive:true});
}
const settingsPath=path.join(game,'src/settings.json'),settings=JSON.parse(fs.readFileSync(settingsPath));
settings.assets.server='http://127.0.0.1:8782/';settings.assets.remoteBundles=['resources'];
fs.writeFileSync(settingsPath,JSON.stringify(settings));
const projectPath=path.join(game,'project.config.json'),project=JSON.parse(fs.readFileSync(projectPath));
project.setting.urlCheck=false;project.projectname='骰子宠物精灵-本地测试';
fs.writeFileSync(projectPath,JSON.stringify(project,null,2));
function bytes(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((s,f)=>s+(f.isDirectory()?bytes(path.join(dir,f.name)):fs.statSync(path.join(dir,f.name)).size),0);}
console.log(JSON.stringify({project:game,codeMiB:(bytes(game)/1048576).toFixed(2),remoteMiB:(bytes(remote)/1048576).toFixed(2),appid:'touristappid'}));
