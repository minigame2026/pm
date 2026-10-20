// Temporarily compile the explicitly requested QA balance, then restore production source.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),file=path.join(root,'assets/scripts/PMModel.ts');
const source=fs.readFileSync(file,'utf8'),marker='export const BUILD_TEST_MODE=false;';
if(!source.includes(marker))throw Error('Production balance marker missing; refusing ambiguous test build');
const run=(args)=>{const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});if(r.status!==0)throw Error('Build failed: '+args.join(' '));};
try{
 fs.writeFileSync(file,source.replace(marker,'export const BUILD_TEST_MODE=true;'));
 run(['tools/build-platform.cjs','android','--qa-profile']);
 const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','tools/compile-android.ps1'],{cwd:root,stdio:'inherit',windowsHide:true});
 if(r.status!==0)throw Error('Android compilation failed');
 const apk=path.join(root,'build/android/proj/build/DicePet/outputs/apk/release/DicePet-release.apk');
 const out=path.join(root,'build/releases/骰子宠物精灵-安卓测试版-20261020-v4.apk');
 fs.copyFileSync(apk,out);
 fs.writeFileSync(out+'.json',JSON.stringify({profile:'qa',staminaCost:1,hatchMs:3000,breedingMs:3000,sourceRestoredToProduction:true,created:new Date().toISOString()},null,2));
 console.log('Test APK: '+out);
}finally{
 fs.writeFileSync(file,source);
 console.log('Production balance restored: 5 stamina / 30 minutes');
}
