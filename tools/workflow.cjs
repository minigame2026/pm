const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const {spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),config=require('./workflow.config.json');
const absolute=p=>path.isAbsolute(p)?p:path.join(root,p);
function plan(scope,files=[]){
 let scopes=scope==='auto'?[]:scope.split(',');
 if(scope==='auto'){
  if(!files.length)throw Error('auto 需要 --file 指定本次改动；也可直接选 ui / social / rules / save / preview。');
  for(const raw of files){
   const f=(path.isAbsolute(raw)?path.relative(root,raw):raw).replace(/\\/g,'/');
   if(f==='assets/scripts/PMModel.ts')scopes.push('rules');
   else if(f==='assets/scripts/DurableCheckpoint.ts')scopes.push('resume');
   else if(f==='assets/scripts/TrustedClock.ts')scopes.push('time');
   else if(f==='assets/scripts/PMAudio.ts'||/^assets\/resources\/audio\//.test(f))scopes.push('audio');
   else if(/assets\/scripts\/(HomeScenery|RegionPads)\.ts/.test(f))scopes.push('scenery');
   else if(f==='assets/scripts/PMGame.ts'||/^assets\/(resources|scenes)\//.test(f))scopes.push('ui','battle');
   else if(f==='build-config.json'||f==='package.json')scopes.push('preview');
   else if(/(^docs\/|\.md$|^tools\/|^checks\/|\.ps1$)/.test(f))throw Error('文档/工具/测试改动请选明确检查范围；不要自动当作游戏验证通过：'+f);
   else throw Error('未知改动范围，请明确选择检查组：'+f);
  }
 }
 scopes=[...new Set(scopes)];for(const s of scopes)if(!config.scopes[s])throw Error('未知检查组：'+s);
 return {scopes,tests:[...new Set(scopes.flatMap(s=>config.scopes[s].tests))],runtime:[...new Set(scopes.flatMap(s=>config.scopes[s].runtime))],build:scopes.some(s=>config.scopes[s].build!==false)};
}
function args(argv){let scope='auto',files=[],dry=false,forceBuild=false;for(let i=0;i<argv.length;i++){
 const a=argv[i];if(a==='--scope'){scope=argv[++i];if(!scope)throw Error('--scope 缺少值');}
 else if(a==='--file'){const f=argv[++i];if(!f)throw Error('--file 缺少路径');files.push(f);}
 else if(a==='--plan')dry=true;else if(a==='--force-build')forceBuild=true;else throw Error('未知参数：'+a);
 }return {scope,files,dry,forceBuild};}
function fingerprint(paths){
 const hash=crypto.createHash('sha256');
 const visit=file=>{const full=absolute(file);if(!fs.existsSync(full)){hash.update(file+':missing');return;}
  if(fs.statSync(full).isDirectory()){for(const name of fs.readdirSync(full).sort())visit(path.join(file,name));}
  else{hash.update(file.replace(/\\/g,'/'));hash.update(fs.readFileSync(full));}
 };paths.forEach(visit);return hash.digest('hex');
}
const sourceFingerprint=()=>fingerprint(['assets','settings','package.json','tsconfig.json',config.buildConfig]);
function canReuseBuild(receipt,sourceHash){
 try{return receipt.sourceHash===sourceHash&&receipt.editor===config.editor&&receipt.buildHash===fingerprint(['build/web-mobile'])&&fs.existsSync(absolute(config.buildIndex));}catch{return false;}
}
function scopeReport(report,scope){
 const group=plan(scope),names=[...(group.build?['typecheck','build','preview-server']:[]),...group.tests.concat(group.runtime).map(f=>path.basename(f,'.cjs'))];
 const steps=report.steps.filter(s=>names.includes(s.name));
 const status=steps.some(s=>s.status==='failed')?'failed':names.every(n=>steps.some(s=>s.name===n&&s.status==='passed'))?'passed':'not-completed';
 return {...report,...group,selectedScope:scope,status,steps,visualReview:group.runtime.length?'pending':'not-applicable'};
}
function execute(executable,argv,log,expected=0,timeout=120000){
 return new Promise((resolve,reject)=>{
  const fd=fs.openSync(log,'w');let child;
  try{child=spawn(executable,argv,{cwd:root,windowsHide:true,stdio:['ignore',fd,fd]});}catch(e){fs.closeSync(fd);reject(e);return;}
  fs.closeSync(fd);let expired=false;
  const timer=setTimeout(()=>{expired=true;child.kill();},timeout);
  child.once('error',e=>{clearTimeout(timer);reject(e);});
  child.once('close',(code,signal)=>{clearTimeout(timer);if(expired)reject(Error('超时，停止此轮检查'));else if(code!==expected)reject(Error('退出码 '+code+'，期望 '+expected+(signal?'；信号 '+signal:'')));else resolve(code);});
 });
}
function fetchIndex(){return new Promise((resolve,reject)=>{const r=http.get(config.url,res=>{let body='';res.setEncoding('utf8');res.on('data',s=>body+=s);res.on('end',()=>resolve({status:res.statusCode,body}));});r.setTimeout(2500,()=>r.destroy(Error('预览服务响应超时')));r.on('error',reject);});}
async function ensureServer(log){
 fs.writeFileSync(log,'Checking '+config.url+' against '+config.buildIndex+'\n');
 const expected=fs.readFileSync(absolute(config.buildIndex),'utf8');
 const verify=r=>{if(r.status!==200||r.body!==expected)throw Error('8780 返回的不是当前构建；未关闭或替换已有服务。');};
 try{verify(await fetchIndex());fs.appendFileSync(log,'Verified existing preview server.\n');return 'reused';}catch(e){if(e.code!=='ECONNREFUSED')throw e;}
 const fd=fs.openSync(log,'w'),child=spawn(process.execPath,[absolute(config.server)],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 let spawnError;child.on('error',e=>spawnError=e);child.unref();
 for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,250));if(spawnError)throw spawnError;try{verify(await fetchIndex());return 'started';}catch(e){if(e.code!=='ECONNREFUSED'){child.kill();throw e;}}}
 child.kill();throw Error('预览服务启动失败');
}
async function main(argv){
 const options=args(argv),selection=plan(options.scope,options.files);
 if(options.dry){console.log(JSON.stringify({planOnly:true,...selection,typecheck:selection.build,buildPolicy:options.forceBuild?'force':'reuse-only-if-content-matches',url:config.url,visualReview:selection.runtime.length?'运行后仍需查看截图':'不涉及'},null,2));return;}
 const folder=absolute('checks/workflow'),startedAt=new Date().toISOString();fs.mkdirSync(folder,{recursive:true});
 const report={startedAt,status:'running',...selection,steps:[],url:config.url,visualReview:selection.runtime.length?'pending':'not-applicable',deviceValidation:'not-run'};
 const reportFile=path.join(folder,'latest.json');
 const save=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2));save();
 const step=async(name,fn)=>{const entry={name,status:'running',startedAt:new Date().toISOString(),log:path.join(folder,String(report.steps.length+1).padStart(2,'0')+'-'+name+'.log')};report.steps.push(entry);save();console.log('正在检查：'+name);const begin=Date.now();try{entry.result=await fn(entry.log);entry.status='passed';}catch(e){entry.status='failed';entry.error=e.message;throw e;}finally{entry.elapsedMs=Date.now()-begin;save();}};
 try{
  for(const p of [...(selection.build?[config.editor,config.typescript,config.buildConfig,config.server]:[]),...selection.tests,...selection.runtime])if(!fs.existsSync(absolute(p)))throw Error('缺少文件：'+p);
  report.sourceHash=sourceFingerprint();
  if(selection.build)await step('typecheck',log=>execute(process.execPath,[config.typescript,'--noEmit','-p',absolute('tsconfig.json')],log));
  for(const script of selection.tests)await step(path.basename(script,'.cjs'),log=>execute(process.execPath,[absolute(script)],log));
  if(selection.build){
   const receiptFile=path.join(folder,'build-receipt.json');let receipt;try{receipt=JSON.parse(fs.readFileSync(receiptFile,'utf8'));}catch{}
   await step('build',async log=>{
    if(!options.forceBuild&&receipt&&canReuseBuild(receipt,report.sourceHash)){fs.writeFileSync(log,'Reused matching source and build content fingerprints.\n');return 'reused';}
    const code=await execute(config.editor,['--project',root,'--build','configPath='+absolute(config.buildConfig)],log,36,180000);if(!fs.existsSync(absolute(config.buildIndex)))throw Error('构建产物不存在');
    if(sourceFingerprint()!==report.sourceHash)throw Error('构建期间源文件变化，停止验收，请重跑');
    fs.writeFileSync(receiptFile,JSON.stringify({sourceHash:report.sourceHash,editor:config.editor,buildHash:fingerprint(['build/web-mobile'])},null,2));return code;
   });
   await step('preview-server',log=>ensureServer(log));
  }
  const screenshotStart=Date.now();
  for(const script of selection.runtime)await step(path.basename(script,'.cjs'),async log=>{await execute(process.execPath,[absolute(script)],log,0,240000);if(!/pass/i.test(fs.readFileSync(log,'utf8')))throw Error('脚本退出但没有完成验证的通过输出');return 0;});
  report.screenshots=fs.readdirSync(absolute('checks')).filter(f=>f.endsWith('.png')&&fs.statSync(absolute('checks/'+f)).mtimeMs>=screenshotStart-1000).map(f=>'checks/'+f);
  report.status='passed';console.log('相关自动检查通过。'+(selection.runtime.length?'试玩：'+config.url+'\n截图仍需人工/助手查看；':'无需构建或画面验收；')+'结果：checks/workflow/latest.json');
 }catch(e){report.status='failed';report.error=e.message;throw e;}finally{report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(folder,selection.scopes.join('-')+'-latest.json'),JSON.stringify(report,null,2));for(const scope of selection.scopes)fs.writeFileSync(path.join(folder,scope+'-latest.json'),JSON.stringify(scopeReport(report,scope),null,2));}
}
module.exports={plan,args,execute,fingerprint,canReuseBuild,scopeReport};
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error('已停止：'+e.message);process.exitCode=1;});
