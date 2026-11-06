const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {resolveSDK,prepareSteam,packageSteam}=require('../tools/prepare-pc-steam.cjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dicekin-steam-build-'));
try{
  assert.equal(resolveSDK({withoutSteam:true}),null);
  const sdk=path.join(temp,'sdk'),dest=path.join(temp,'project'),release=path.join(temp,'release'),output=path.join(temp,'output');
  for(const name of ['public/steam/steam_api.h','redistributable_bin/win64/steam_api64.lib','redistributable_bin/win64/steam_api64.dll']){const file=path.join(sdk,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,name);}
  assert.equal(resolveSDK({sdk}),sdk);
  const cmake=path.join(dest,'native/engine/win64/CMakeLists.txt');fs.mkdirSync(path.dirname(cmake),{recursive:true});
  fs.writeFileSync(path.join(path.dirname(cmake),'fixture.cpp'),'int main() { return 0; }\n');
  fs.writeFileSync(cmake,'cmake_minimum_required(VERSION 3.18)\nproject(Dicekin CXX)\nset(EXECUTABLE_NAME Dicekin)\nadd_executable(Dicekin fixture.cpp)\ntarget_link_libraries(Dicekin cocos-plain-signature-fixture.lib)\n');
  prepareSteam(dest,{sdk,development:true});prepareSteam(dest,{sdk,development:true});
  const cfg=require('../tools/workflow.config.json'),cmakeExe=path.join(path.dirname(cfg.editor),'resources/tools/cmake/bin/cmake.exe');
  try{execFileSync(cmakeExe,['-S',path.dirname(cmake),'-B',path.join(temp,'cmake-configure'),'-G','Visual Studio 17 2022','-A','x64'],{stdio:'pipe',windowsHide:true});}
  catch(e){console.error(String(e.stdout||'')+String(e.stderr||''));throw Error('Steam integration must configure alongside the actual Cocos plain-link convention');}
  assert.equal(fs.readFileSync(cmake,'utf8').split('include(').length,2,'Repeated export does not duplicate integration');
  for(const dir of [release,output])fs.mkdirSync(dir,{recursive:true});
  fs.copyFileSync(path.join(sdk,'redistributable_bin/win64/steam_api64.dll'),path.join(release,'steam_api64.dll'));fs.writeFileSync(path.join(release,'steam_appid.txt'),'5500200\n');
  assert.equal(packageSteam(dest,release,output).enabled,true);assert.equal(fs.readFileSync(path.join(output,'steam_appid.txt'),'utf8'),'5500200\n');
  prepareSteam(dest,{sdk,development:false});packageSteam(dest,release,output);assert.ok(!fs.existsSync(path.join(output,'steam_appid.txt')),'Production distribution excludes development AppID override');
  prepareSteam(dest,{sdk:null});packageSteam(dest,release,output);assert.ok(!fs.existsSync(path.join(output,'steam_api64.dll')),'Offline packaging removes stale SDK runtime');
  assert.ok(fs.existsSync(path.join(dest,'native/engine/common/Classes/SteamBridge.cpp')));
  console.log('PC Steam build: SDK discovery, idempotent export, production AppID exclusion and stale-runtime removal passed');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
