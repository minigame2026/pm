// Compile the real C++ bridge in isolation and run its no-Steam/failure paths.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cfg=require('../tools/workflow.config.json');
const sdk=process.argv.includes('--with-steam')?require('../tools/prepare-pc-steam.cjs').resolveSDK():null;
const build=path.join(root,'build',sdk?'steam-bridge-check-sdk':'steam-bridge-check');fs.mkdirSync(build,{recursive:true});
const engine=path.join(path.dirname(cfg.editor),'resources/resources/3d/engine/native');
const cmake=path.join(path.dirname(cfg.editor),'resources/tools/cmake/bin/cmake.exe');
fs.writeFileSync(path.join(build,'probe.cpp'),`#ifdef NDEBUG
#undef NDEBUG
#endif
#include "SteamBridge.cpp"
#include "rapidjson/document.h"
#include <cassert>
#include <iostream>
int main(int argc,char** argv){
  dicekin::initializeSteam();
  rapidjson::Document status;auto value=dicekin::steamRequest("status","{}");status.Parse(value.c_str());
  #if DICEKIN_STEAM_ENABLED
  if(argc>1 && std::string(argv[1])=="--features"){
    assert(status["data"]["available"].GetBool());
    uint64 total=0,available=0;const bool quota=SteamRemoteStorage()->GetQuota(&total,&available);
    const std::string name="save-"+std::to_string(SteamUser()->GetSteamID().ConvertToUint64())+".json";
    std::cout<<"cloud enabled="<<(SteamRemoteStorage()->IsCloudEnabledForAccount()&&SteamRemoteStorage()->IsCloudEnabledForApp())<<" quota="<<(quota?total:0)<<" saveBytes="<<SteamRemoteStorage()->GetFileSize(name.c_str())<<"\\n";
    for(const auto id:{"DK_PARTNER","DK_MAP_1","DK_MAP_6","DK_MAP_12","DK_COLLECT_10","DK_COLLECT_30","DK_COLLECT_60","DK_HATCH_1","DK_HATCH_10","DK_SSR","DK_SHINY","DK_GYM_1","DK_GYM_9","DK_COOK","DK_FEAST","DK_RAID"}){bool earned=false;const auto found=SteamUserStats()->GetAchievement(id,&earned);std::cout<<id<<" defined="<<found<<" earned="<<earned<<"\\n";}
    const auto read=dicekin::steamRequest("cloud.read",("{\\\"name\\\":\\\""+name+"\\\"}").c_str());rapidjson::Document result;result.Parse(read.c_str());std::cout<<"cloud read ok="<<result["ok"].GetBool()<<"\\n";
    dicekin::shutdownSteam();return 0;
  }
  #endif
  if(argc>1 && std::string(argv[1])=="--identity"){
    std::cout<<value<<"\\n";
    if(status["ok"].GetBool() && status["data"]["available"].GetBool()) std::cout<<dicekin::steamRequest("time","{}")<<"\\n";
    #if DICEKIN_STEAM_ENABLED
    else {
      SteamErrMsg reason{};const auto initResult=SteamAPI_InitEx(&reason);
      auto diagnosis=dicekin::object();diagnosis.AddMember("initResult",static_cast<int>(initResult),diagnosis.GetAllocator());
      dicekin::put(diagnosis,"method","InitEx",diagnosis.GetAllocator());dicekin::put(diagnosis,"reason",reason,diagnosis.GetAllocator());std::cout<<dicekin::encode(diagnosis)<<"\\n";
      if(initResult==k_ESteamAPIInitResult_OK) SteamAPI_Shutdown();
      else {
        SteamErrMsg flatReason{};const auto flatResult=SteamAPI_InitFlat(&flatReason);
        auto flat=dicekin::object();flat.AddMember("initResult",static_cast<int>(flatResult),flat.GetAllocator());dicekin::put(flat,"method","InitFlat",flat.GetAllocator());
        dicekin::put(flat,"reason",flatReason,flat.GetAllocator());std::cout<<dicekin::encode(flat)<<"\\n";
        if(flatResult==k_ESteamAPIInitResult_OK) SteamAPI_Shutdown();
      }
    }
    #endif
    dicekin::shutdownSteam();return 0;
  }
  assert(!status.HasParseError() && status["ok"].GetBool() && !status["data"]["available"].GetBool());
  assert(status["data"]["steamId"].GetStringLength()==0);
  assert(dicekin::validFile("profiles/player-1.json"));
  assert(!dicekin::validFile("../profile.json") && !dicekin::validFile("/profile.json") && !dicekin::validFile("C:/profile.json"));
  assert(dicekin::validReplayFile("raid-76561198000000001-run1.json","76561198000000001"));
  assert(!dicekin::validReplayFile("raid-76561198000000002-run1.json","76561198000000001"));
  assert(!dicekin::validReplayFile("profile-76561198000000001.json","76561198000000001"));
  assert(!dicekin::validReplayFile("raid-76561198000000001-x/save.json","76561198000000001"));
  assert(!dicekin::validReplayFile("raid-76561198000000001-.json","76561198000000001"));
  assert(dicekin::validOwnedCloudFile("save-76561198000000001.json","76561198000000001"));
  assert(!dicekin::validOwnedCloudFile("save-76561198000000002.json","76561198000000001"));
  assert(!dicekin::validOwnedCloudFile("profiles/save-76561198000000001.json","76561198000000001"));
  assert(!dicekin::validOwnedCloudFile("save-76561198000000001-backup.json","76561198000000001"));
  assert(!dicekin::validReplayFile("save-76561198000000001.json","76561198000000001"));
  assert(dicekin::quotaAllows(500,500,0) && dicekin::quotaAllows(400,500,0));
  assert(dicekin::quotaAllows(700,500,200) && !dicekin::quotaAllows(701,500,200));
  for(const auto op:{"time","friends","lobby.create","message.send","leaderboard.upload","cloud.write","achievements.sync"}){
    rapidjson::Document result;auto text=dicekin::steamRequest(op,"{}");result.Parse(text.c_str());
    assert(!result.HasParseError() && !result["ok"].GetBool() && result.HasMember("error"));
  }
  auto invalid=dicekin::steamRequest("status","[]");assert(invalid.find("invalid_steam_arguments")!=std::string::npos);
  invalid=dicekin::steamRequest("status","{");assert(invalid.find("invalid_steam_arguments")!=std::string::npos);
  invalid=dicekin::steamRequest("status",std::string(1100000,'x'));assert(invalid.find("steam_arguments_too_large")!=std::string::npos);
  const auto nested=std::string("{\\\"payload\\\":")+std::string(70,'[')+"0"+std::string(70,']')+"}";
  invalid=dicekin::steamRequest("status",nested);assert(invalid.find("invalid_steam_arguments")!=std::string::npos);
  for(int i=0;i<100;i++) assert(dicekin::steamPoll()=="[]");
  dicekin::shutdownSteam();dicekin::shutdownSteam();
  std::cout<<"Native bridge: offline identity, guarded requests, malformed input, size limits, polling and shutdown passed\\n";
}`);
const normalized=p=>p.replaceAll('\\','/');
fs.writeFileSync(path.join(build,'CMakeLists.txt'),`cmake_minimum_required(VERSION 3.18)
project(SteamBridgeProbe CXX)
set(CMAKE_CXX_STANDARD 17)
add_executable(SteamBridgeProbe probe.cpp)
target_include_directories(SteamBridgeProbe PRIVATE "${normalized(path.join(root,'pc/native'))}" "${normalized(path.join(engine,'external/sources'))}")
target_compile_definitions(SteamBridgeProbe PRIVATE DICEKIN_STEAM_TEST=1 DICEKIN_STEAM_ENABLED=${sdk?1:0})
target_compile_options(SteamBridgeProbe PRIVATE /utf-8)
${sdk?`target_include_directories(SteamBridgeProbe PRIVATE "${normalized(path.join(sdk,'public'))}")
target_link_libraries(SteamBridgeProbe PRIVATE "${normalized(path.join(sdk,'redistributable_bin/win64/steam_api64.lib'))}" delayimp)
target_link_options(SteamBridgeProbe PRIVATE "/DELAYLOAD:steam_api64.dll")`:''}
`);
for(const args of [['-S',build,'-B',path.join(build,'out'),'-G','Visual Studio 17 2022','-A','x64'],['--build',path.join(build,'out'),'--config','Release','--parallel','2']]){
  try{execFileSync(cmake,args,{stdio:'pipe',windowsHide:true});}catch(e){console.error(String(e.stdout||'')+String(e.stderr||''));process.exit(1);}
}
const bin=path.join(build,'out/Release'),exe=path.join(bin,'SteamBridgeProbe.exe');
if(sdk){const runtime=path.join(bin,'steam_api64.dll');if(fs.existsSync(runtime))fs.unlinkSync(runtime);}
console.log(execFileSync(exe,[],{encoding:'utf8',windowsHide:true,cwd:bin}).trim());
if(sdk){
  fs.copyFileSync(path.join(sdk,'redistributable_bin/win64/steam_api64.dll'),path.join(bin,'steam_api64.dll'));
  fs.writeFileSync(path.join(bin,'steam_appid.txt'),'5500200\n');
  const output=execFileSync(exe,['--identity'],{encoding:'utf8',windowsHide:true,cwd:bin}).trim();
  for(const line of output.split(/\r?\n/)){
    let safe=line;try{const result=JSON.parse(line);if(result.data&&Object.hasOwn(result.data,'steamId')){result.data.steamId=result.data.steamId?'[present]':'';result.data.name=result.data.name?'[present]':'';}safe=JSON.stringify(result);}catch{}
    console.log('Actual Steam initialization: '+safe.replace(/\b\d{15,20}\b/g,'[account-id]'));
  }
}
