const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function resolveSDK({withoutSteam=false,sdk=process.env.STEAMWORKS_SDK}={}){
  if(withoutSteam)return null;
  const choices=[sdk,path.join(ROOT,'build/deps/steamworks-sdk/sdk'),path.join(ROOT,'build/deps/steamworks-sdk'),path.join(ROOT,'build/deps/sdk')].filter(Boolean);
  for(const candidate of choices){const root=path.resolve(candidate);if(['public/steam/steam_api.h','redistributable_bin/win64/steam_api64.lib','redistributable_bin/win64/steam_api64.dll'].every(p=>fs.existsSync(path.join(root,p))))return root;}
  throw Error('Official Steamworks SDK missing. Set STEAMWORKS_SDK to its sdk folder, or explicitly use --without-steam for an offline test build. Download: https://partner.steamgames.com/downloads/list');
}
function prepareSteam(destination,{sdk=null,development=true}={}){
  const common=path.join(destination,'native/engine/common'),classes=path.join(common,'Classes');fs.mkdirSync(classes,{recursive:true});
  for(const name of ['SteamBridge.cpp','SteamBridge.h'])fs.copyFileSync(path.join(ROOT,'pc/native',name),path.join(classes,name));
  const cmake=path.join(destination,'native/engine/win64/CMakeLists.txt');
  const inclusion='include(${CMAKE_CURRENT_LIST_DIR}/../common/Steam.cmake)';
  const existing=fs.readFileSync(cmake,'utf8');if(!existing.includes(inclusion))fs.appendFileSync(cmake,'\n'+inclusion+'\n');
  const local=path.join(common,'steamworks');fs.mkdirSync(local,{recursive:true});
  const lines=['# Generated PC-only Steamworks integration. SDK remains outside source control.','target_sources(${EXECUTABLE_NAME} PRIVATE "${CMAKE_CURRENT_LIST_DIR}/Classes/SteamBridge.cpp")','set_source_files_properties("${CMAKE_CURRENT_LIST_DIR}/Classes/SteamBridge.cpp" PROPERTIES COMPILE_OPTIONS "/utf-8")',`target_compile_definitions(\${EXECUTABLE_NAME} PRIVATE DICEKIN_STEAM_ENABLED=${sdk?1:0})`];
  if(sdk){
    fs.cpSync(path.join(sdk,'public/steam'),path.join(local,'include/steam'),{recursive:true});
    for(const name of ['steam_api64.lib','steam_api64.dll'])fs.copyFileSync(path.join(sdk,'redistributable_bin/win64',name),path.join(local,name));
    // Cocos 3.8.7 windows.cmake links this target with the plain signature.
    lines.push('target_include_directories(${EXECUTABLE_NAME} PRIVATE "${CMAKE_CURRENT_LIST_DIR}/steamworks/include")','target_link_libraries(${EXECUTABLE_NAME} "${CMAKE_CURRENT_LIST_DIR}/steamworks/steam_api64.lib" delayimp)','target_link_options(${EXECUTABLE_NAME} PRIVATE "/DELAYLOAD:steam_api64.dll")','add_custom_command(TARGET ${EXECUTABLE_NAME} POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_if_different "${CMAKE_CURRENT_LIST_DIR}/steamworks/steam_api64.dll" "$<TARGET_FILE_DIR:${EXECUTABLE_NAME}>")');
    if(development){fs.writeFileSync(path.join(local,'steam_appid.txt'),'5500200\n');lines.push('add_custom_command(TARGET ${EXECUTABLE_NAME} POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_if_different "${CMAKE_CURRENT_LIST_DIR}/steamworks/steam_appid.txt" "$<TARGET_FILE_DIR:${EXECUTABLE_NAME}>")');}
  }
  fs.writeFileSync(path.join(common,'Steam.cmake'),lines.join('\n')+'\n');
  const manifest={enabled:!!sdk,development:!!sdk&&development,appId:5500200};fs.writeFileSync(path.join(destination,'steam-build.json'),JSON.stringify(manifest,null,2));
  return manifest;
}
function packageSteam(destination,release,target){
  const manifest=JSON.parse(fs.readFileSync(path.join(destination,'steam-build.json'),'utf8'));
  for(const name of ['steam_api64.dll','steam_appid.txt']){
    const src=path.join(release,name),dst=path.join(target,name),needed=name.endsWith('.dll')?manifest.enabled:manifest.enabled&&manifest.development;
    if(needed){if(!fs.existsSync(src))throw Error('Steam build output missing '+name);fs.copyFileSync(src,dst);}
    else if(fs.existsSync(dst))fs.unlinkSync(dst);
  }
  fs.writeFileSync(path.join(target,'steam-build.json'),JSON.stringify(manifest,null,2));return manifest;
}
module.exports={resolveSDK,prepareSteam,packageSteam};
