const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),cfg=require('./workflow.config.json');
const target=process.argv[2];if(!['android','wechatgame'].includes(target))throw Error('Choose android or wechatgame');
const root=path.resolve(__dirname,'..'),env={...process.env},toolsFile='C:/Users/k/Documents/Codex/Tools/android-development/installation.json';
const qaProfile=process.argv.includes('--qa-profile');
const testBalance=/export const BUILD_TEST_MODE=true;/.test(fs.readFileSync(path.join(root,'assets/scripts/PMModel.ts'),'utf8'));
if(testBalance&&!qaProfile)throw Error('Test balance is enabled. Restore BUILD_TEST_MODE=false before a normal export.');
if(qaProfile&&(target!=='android'||!testBalance))throw Error('QA profile requires Android and explicit test balance.');
if(target==='android'){const t=JSON.parse(fs.readFileSync(toolsFile));Object.assign(env,{JAVA_HOME:t.javaHome,ANDROID_SDK_ROOT:t.sdkRoot,ANDROID_HOME:t.sdkRoot,NDK_ROOT:path.join(t.sdkRoot,'ndk/23.2.8568313')});env.Path=t.javaHome+'/bin;'+(env.Path||env.PATH);}
const options=JSON.parse(fs.readFileSync(path.join(root,'build-'+target+'.json')));
if(target==='android')Object.assign(options.packages.android,{sdkPath:env.ANDROID_HOME,ndkPath:env.NDK_ROOT,javaHome:env.JAVA_HOME,javaPath:path.join(env.JAVA_HOME,'bin/java.exe')});
const configPath=path.join(root,'checks','build-'+target+'-local.json');fs.writeFileSync(configPath,JSON.stringify(options,null,2));
const log=path.join(root,'checks',target+'-export.log'),fd=fs.openSync(log,'w'),child=spawn(cfg.editor,['--project',root,'--build','configPath='+configPath],{cwd:root,env,windowsHide:true,stdio:['ignore',fd,fd]});
console.log('Export '+target+'; log '+log);child.on('error',e=>{console.error(e);process.exitCode=1;});child.on('exit',code=>{fs.closeSync(fd);console.log('Creator exit '+code);fs.writeFileSync(path.join(root,'checks',target+'-export-result.json'),JSON.stringify({code,time:new Date().toISOString()}));if(code===36&&target==='wechatgame')require('./prepare-wechat-local.cjs');process.exitCode=code===36?0:1;});
