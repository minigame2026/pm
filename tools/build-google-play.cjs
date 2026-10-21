// Google Play uses an isolated native build, production balance, and its own upload key.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),cfg=require('./workflow.config.json');
const androidTools=JSON.parse(fs.readFileSync('C:/Users/k/Documents/Codex/Tools/android-development/installation.json','utf8'));
const build=path.join(root,'build/google-play'),native=path.join(build,'native');
const env={...process.env,JAVA_HOME:androidTools.javaHome,ANDROID_SDK_ROOT:androidTools.sdkRoot,ANDROID_HOME:androidTools.sdkRoot,NDK_ROOT:path.join(androidTools.sdkRoot,'ndk/23.2.8568313')};
env.Path=path.join(androidTools.javaHome,'bin')+';'+(env.Path||env.PATH);
const normal=p=>p.replace(/\\/g,'/');
function run(exe,args,expected=0){const r=spawnSync(exe,args,{cwd:root,env,stdio:'inherit',windowsHide:true});if(r.error)throw r.error;if(r.status!==expected)throw Error(path.basename(exe)+' exited '+r.status);}
function replace(file,before,after){const s=fs.readFileSync(file,'utf8');assert.ok(before instanceof RegExp?before.test(s):s.includes(before),'Missing expected content in '+file);fs.writeFileSync(file,s.replace(before,after));}
function production(){const s=fs.readFileSync('assets/scripts/PMModel.ts','utf8');assert.ok(s.includes('export const BUILD_TEST_MODE=false;'));assert.ok(s.includes('EXPEDITION_COST=BUILD_TEST_MODE?1:5'));assert.ok(s.includes('HATCH_DURATION=BUILD_TEST_MODE?3000:30*60*1000'));assert.ok(s.includes('BREED_DURATION=BUILD_TEST_MODE?3000:30*60*1000'));}
production();
if(!process.argv.includes('--compile-only')){
 const options=JSON.parse(fs.readFileSync('build-android.json','utf8'));
 Object.assign(options,{outputName:'google-play',logDest:normal(path.join(root,'checks/google-play-export.log'))});
 Object.assign(options.packages.android,{packageName:'com.dice.pet.rpg',apiLevel:36,sdkPath:env.ANDROID_HOME,ndkPath:env.NDK_ROOT,javaHome:env.JAVA_HOME,javaPath:path.join(env.JAVA_HOME,'bin/java.exe')});
 const file=path.join(root,'checks/build-google-play-local.json');fs.writeFileSync(file,JSON.stringify(options,null,2));
 run(cfg.editor,['--project',root,'--build','configPath='+file],36);
 fs.mkdirSync(native,{recursive:true});
 fs.cpSync(path.join(root,'native/engine/android'),path.join(native,'android'),{recursive:true});
 fs.cpSync(path.join(root,'native/engine/common'),path.join(native,'common'),{recursive:true});
 const appGradle=path.join(native,'android/app/build.gradle');
 replace(appGradle,'defaultConfig {',"defaultConfig {\n        ndk { abiFilters 'arm64-v8a' }");
 // Android supplies libEGL; the NDK link-time stub must not ship in the app.
 replace(appGradle,'android {',"android {\n    ndkVersion '23.2.8568313'\n    packagingOptions { jniLibs { excludes += ['**/libEGL.so'] } }");
 replace(path.join(native,'android/app/src/com/cocos/game/PMTapAds.java'),'import com.minigame2026.dicepet.BuildConfig;','import com.dice.pet.rpg.BuildConfig;');
 fs.appendFileSync(path.join(native,'android/CMakeLists.txt'),'\n# Support Android 16 KB memory pages with the installed NDK.\ntarget_link_options(${CC_LIB_NAME} PRIVATE "-Wl,-z,max-page-size=16384" "-Wl,-z,common-page-size=16384")\n');
 replace(path.join(build,'proj/build.gradle'),/com\.android\.tools\.build:gradle:8\.0\.2/,'com.android.tools.build:gradle:8.10.1');
 replace(path.join(build,'proj/gradle/wrapper/gradle-wrapper.properties'),/gradle-8\.0\.2-bin/,'gradle-8.11.1-bin');
 const props=path.join(build,'proj/gradle.properties');
 replace(props,/^NATIVE_DIR=.*$/m,'NATIVE_DIR='+normal(path.join(native,'android')));
 replace(props,/^PROP_BUILD_TOOLS_VERSION=.*$/m,'PROP_BUILD_TOOLS_VERSION=35.0.0');
 replace(props,/^PROP_COMPILE_SDK_VERSION=.*$/m,'PROP_COMPILE_SDK_VERSION=36');
 replace(props,/^PROP_TARGET_SDK_VERSION=.*$/m,'PROP_TARGET_SDK_VERSION=36');
 const signingFile=path.join(root,'.env.google-play-signing');
 let signing;
 if(fs.existsSync(signingFile))signing=JSON.parse(fs.readFileSync(signingFile,'utf8'));
 else{
  signing={storeFile:normal(path.join(root,'config/google-play-upload.keystore')),storePassword:crypto.randomBytes(24).toString('base64url'),keyAlias:'upload'};
  fs.mkdirSync(path.dirname(signing.storeFile),{recursive:true});assert.ok(!fs.existsSync(signing.storeFile),'Existing upload key has no matching credential record');
  env.PM_PLAY_STORE_PASSWORD=signing.storePassword;env.PM_PLAY_KEY_PASSWORD=signing.storePassword;
  run(path.join(androidTools.javaHome,'bin/keytool.exe'),['-genkeypair','-keystore',signing.storeFile,'-storetype','PKCS12','-storepass:env','PM_PLAY_STORE_PASSWORD','-keypass:env','PM_PLAY_KEY_PASSWORD','-alias',signing.keyAlias,'-dname','CN=Dice Pet Spirits Upload','-keyalg','RSA','-keysize','3072','-validity','10000']);
  fs.writeFileSync(signingFile,JSON.stringify(signing,null,2));
 }
 assert.ok(fs.existsSync(signing.storeFile),'Upload key missing');
 for(const [key,value] of Object.entries({RELEASE_STORE_FILE:signing.storeFile,RELEASE_STORE_PASSWORD:signing.storePassword,RELEASE_KEY_ALIAS:signing.keyAlias,RELEASE_KEY_PASSWORD:signing.storePassword}))replace(props,new RegExp('^'+key+'=.*$','m'),key+'='+value);
}
// Apply release identity and Play protection requirements on compile-only retries too.
replace(path.join(native,'android/app/build.gradle'),/versionCode\s+\d+/,'versionCode 9');
replace(path.join(native,'android/app/build.gradle'),/versionName\s+"[^"]+"/,'versionName "1.0.8"');
replace(path.join(build,'proj/gradle.properties'),/^PROP_MIN_SDK_VERSION=.*$/m,'PROP_MIN_SDK_VERSION=24');
// Neither package installation nor in-app purchases are used by this game.
// Remove the unused permissions inherited from TapADN and the Cocos library.
const playManifest=path.join(native,'android/app/AndroidManifest.xml');
for(const permission of ['android.permission.REQUEST_INSTALL_PACKAGES','com.android.vending.BILLING']){
 const text=fs.readFileSync(playManifest,'utf8');
 const marker='<uses-permission android:name="'+permission+'" tools:node="remove"/>';
 if(!text.includes(marker))replace(playManifest,'  <uses-permission android:name="android.permission.INTERNET"/>','  '+marker+'\n  <uses-permission android:name="android.permission.INTERNET"/>');
}
production();
run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','tools/compile-android.ps1','-BuildDir','build/google-play','-Bundle','-AppLabel','Dice Pet Spirits']);
const output=path.join(build,'proj/build/DicePet/outputs');fs.mkdirSync('build/releases',{recursive:true});
for(const [from,to] of [['bundle/release/DicePet-release.aab','Dice-Pet-Spirits-Google-Play-1.0.8-code9.aab'],['apk/release/DicePet-release.apk','Dice-Pet-Spirits-Google-Play-1.0.8-code9.apk']]){
 const dest=path.join(root,'build/releases',to);fs.copyFileSync(path.join(output,from),dest);console.log('Release artifact: '+dest+' ('+fs.statSync(dest).size+' bytes)');
}
console.log('PASS Google Play build: production balance; dedicated upload key; package com.dice.pet.rpg; min API 24; target API 36; version 1.0.8/code9');
