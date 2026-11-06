const fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
const {prepare,DEST}=require('./prepare-pc-project.cjs'),cfg=require('./workflow.config.json');
const {resolveSDK,prepareSteam,packageSteam}=require('./prepare-pc-steam.cjs');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT='windows-client';
function packageClient(){
  const profile=JSON.parse(fs.readFileSync(path.join(DEST,'pc-manifest.json'),'utf8')),qa=profile.profile==='qa-fast-timers';
  const release=path.join(DEST,'build',OUTPUT,'proj/Release'),destination=path.join(ROOT,'build/releases',qa?'Dicekin-Windows-QA-1s-x64':'Dicekin-Windows-x64');
  const executable=path.join(release,'Dicekin.exe');if(!fs.existsSync(executable)||!fs.existsSync(path.join(release,'Resources/main.js')))throw Error('Native executable or packaged resources missing');
  fs.mkdirSync(destination,{recursive:true});
  for(const name of fs.readdirSync(release))if(name==='Resources'||/\.(exe|dll)$/i.test(name))fs.cpSync(path.join(release,name),path.join(destination,name),{recursive:true});
  const fonts=path.join(ROOT,'pc/fonts'),fontManifest=JSON.parse(fs.readFileSync(path.join(fonts,'manifest.json'),'utf8'));
  for(const target of [release,destination]){
    const directory=path.join(target,'Fonts');fs.mkdirSync(directory,{recursive:true});
    for(const name of new Set(['manifest.json',...(fontManifest.supplementalLicenses||[]),...fontManifest.fonts.flatMap(f=>[f.file,f.license])]))fs.copyFileSync(path.join(fonts,name),path.join(directory,name));
  }
  const steam=packageSteam(DEST,release,destination);
  // Ship the release runtime from the compiler used to build this executable.
  const vswhere=path.join(process.env['ProgramFiles(x86)'],'Microsoft Visual Studio/Installer/vswhere.exe');
  const vs=execFileSync(vswhere,['-latest','-products','*','-requires','Microsoft.VisualStudio.Component.VC.Tools.x86.x64','-property','installationPath'],{encoding:'utf8'}).trim();
  const redist=path.join(vs,'VC/Redist/MSVC'),versions=fs.readdirSync(redist).filter(n=>/^\d/.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const runtime=path.join(redist,versions.at(-1),'x64/Microsoft.VC143.CRT');
  for(const name of fs.readdirSync(runtime).filter(n=>n.endsWith('.dll')))fs.copyFileSync(path.join(runtime,name),path.join(destination,name));
  // The engine links WebP statically; the unrelated mux DLL has an absent external dependency.
  for(const name of ['msvcp140d.dll','vcruntime140d.dll','vcruntime140_1d.dll','ucrtbased.dll','libwebpmux.dll']){const file=path.join(destination,name);if(fs.existsSync(file))fs.unlinkSync(file);}
  if(!fs.existsSync(path.join(destination,'vcruntime140_1.dll')))throw Error('Missing release C++ runtime');
  fs.writeFileSync(path.join(destination,'启动说明.txt'),'骰子精灵：驯兽之旅 / Dicekin: Monster Tamer\r\n双击 Dicekin.exe 启动。请保持 Resources、Fonts 文件夹和 DLL 与程序放在一起。\r\n鼠标选择；Enter 确认；战斗 1–4 操作；Esc 返回或打开设置。\r\n'+(steam.enabled?'已接入 Steamworks；Steam 未运行、离线或账号无应用权限时可继续单人游玩。多人功能须使用拥有应用权限的 Steam 账号验证。\r\n':'此包以 --without-steam 明确构建，仅供离线界面与单人测试，Steam 功能不可用。\r\n'),'utf8');
  if(qa){fs.appendFileSync(path.join(destination,'启动说明.txt'),'\r\n【1秒计时测试包，非商店正式版】\r\n所有品质/主角孵蛋与交配均为1秒，仍使用原有可信时间。\r\n使用独立测试存档，不导入正式进度；不读写正式Steam云档、不解锁正式成就、不上传天梯分数。\r\n本包不可提交到Steam正式分支。\r\n','utf8');fs.writeFileSync(path.join(destination,'qa-profile.json'),JSON.stringify(profile,null,2));}
  console.log('Windows native client ready: '+path.join(destination,'Dicekin.exe'));
}
async function creator(config,stage){
  const log=path.join(ROOT,'checks',`pc-windows-${stage}.log`),fd=fs.openSync(log,'w');
  const code=await new Promise((resolve,reject)=>{const child=spawn(cfg.editor,['--project',DEST,'--build',`configPath=${config};stage=${stage}`],{stdio:['ignore',fd,fd],windowsHide:true});child.on('error',reject);child.on('close',resolve);});fs.closeSync(fd);
  if(code!==36)throw Error(`Windows ${stage} failed (${code}); see ${log}`);
}
async function build(){
  const sdk=resolveSDK({withoutSteam:process.argv.includes('--without-steam')});
  const qa=process.argv.includes('--qa-fast-timers');prepare({qaFastTimers:qa});
  const config=path.join(DEST,'build-windows.json'),base=JSON.parse(fs.readFileSync(path.join(DEST,'build-pc.json')));
  Object.assign(base,{platform:'windows',name:'Dicekin',outputName:OUTPUT,debug:false,logDest:path.join(ROOT,'checks/pc-windows-builder.log'),packages:{windows:{executableName:'Dicekin',targetPlatform:'x64',renderBackEnd:{vulkan:false,gles3:true,gles2:false}},native:{template:'default',runAfterMake:false,encrypted:false,compressZip:false,JobSystem:'none'}}});
  fs.writeFileSync(config,JSON.stringify(base,null,2));
  const nativeSource=path.join(ROOT,'pc/native/Game.cpp'),nativeTarget=path.join(DEST,'native/engine/common/Classes/Game.cpp');
  fs.mkdirSync(path.dirname(nativeTarget),{recursive:true});fs.copyFileSync(nativeSource,nativeTarget);
  if(qa)fs.writeFileSync(nativeTarget,fs.readFileSync(nativeTarget,'utf8').replace('_windowInfo.title = "Dicekin: Monster Tamer";','_windowInfo.title = "Dicekin: Monster Tamer [QA - 1s Timers]";'));
  // Windows copies can preserve the older source timestamp. Invalidate the QA object
  // when returning to production so MSBuild cannot reuse its test-only window title.
  const nativeStamp=new Date();fs.utimesSync(nativeTarget,nativeStamp,nativeStamp);
  // Creator also configures CMake during build; refresh an existing native export first.
  if(fs.existsSync(path.join(DEST,'native/engine/win64/CMakeLists.txt')))prepareSteam(DEST,{sdk,development:!process.argv.includes('--steam-release')});
  await creator(config,'build');
  prepareSteam(DEST,{sdk,development:!process.argv.includes('--steam-release')});
  if(process.argv.includes('--export-only')){console.log('Windows native project exported: '+path.join(DEST,'build',OUTPUT));return;}
  await creator(config,'make');
  packageClient();
}
if(require.main===module)Promise.resolve().then(()=>process.argv.includes('--package-only')?packageClient():build()).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={build,packageClient};
