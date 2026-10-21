// Temporarily compile the explicitly requested QA balance, then restore production source.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),file=path.join(root,'assets/scripts/PMModel.ts');
const source=fs.readFileSync(file,'utf8'),marker='export const BUILD_TEST_MODE=false;';
if(!source.includes(marker))throw Error('Production balance marker missing; refusing ambiguous test build');
const gradle=fs.readFileSync(path.join(root,'native/engine/android/app/build.gradle'),'utf8');
const versionCode=Number(gradle.match(/versionCode\s+(\d+)/)[1]),versionName=gradle.match(/versionName\s+"([^"]+)"/)[1];
const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('');
const out=path.join(root,`build/releases/骰子宠物精灵-安卓测试版-${date}-v${versionCode}.apk`);
if(fs.existsSync(out))throw Error('Test APK already exists; increment the Android version before building: '+out);
const run=(args)=>{const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});if(r.status!==0)throw Error('Build failed: '+args.join(' '));};
try{
 fs.writeFileSync(file,source.replace(marker,'export const BUILD_TEST_MODE=true;'));
 run(['tools/build-platform.cjs','android','--qa-profile']);
 const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','tools/compile-android.ps1'],{cwd:root,stdio:'inherit',windowsHide:true});
 if(r.status!==0)throw Error('Android compilation failed');
 const apk=path.join(root,'build/android/proj/build/DicePet/outputs/apk/release/DicePet-release.apk');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.copyFileSync(apk,out);
 fs.writeFileSync(out+'.json',JSON.stringify({profile:'qa',versionCode,versionName,staminaCost:1,hatchMs:3000,breedingMs:3000,sourceRestoredToProduction:true,created:new Date().toISOString()},null,2));
 console.log('Test APK: '+out);
}finally{
 fs.writeFileSync(file,source);
 console.log('Production balance restored: 5 stamina / 30 minutes');
}
