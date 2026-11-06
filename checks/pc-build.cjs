// PC owns its build target; the shared workflow must never rebuild mobile for this scope.
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const cfg=require('../tools/workflow.config.json'),{build}=require('../tools/build-pc.cjs');
(async()=>{await build();const types=spawnSync(process.execPath,[cfg.typescript,'--noEmit','--pretty','false','--project','build/pc-project/tsconfig.json'],{encoding:'utf8',windowsHide:true});if(types.status!==0)throw Error(types.stdout+types.stderr);
 const expected=path.resolve('build/pc-project/build/web-desktop');
 const health=async()=>{const r=await fetch('http://127.0.0.1:8781/__pc_health');const data=await r.json();if(data.project!=='PM-PC'||path.resolve(data.root)!==expected)throw Error('Port 8781 is used by a different preview');};
 try{await health();}catch(e){if(!String(e.cause?.code||e.message).includes('ECONNREFUSED')&&!String(e.message).includes('fetch failed'))throw e;const fd=fs.openSync('checks/pc-server.log','a');const server=spawn(process.execPath,['tools/serve-pc.cjs'],{detached:true,stdio:['ignore',fd,fd],windowsHide:true});server.unref();fs.closeSync(fd);let ready=false;for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,250));try{await health();ready=true;break;}catch{}}if(!ready)throw Error('PC preview failed to start');}
 console.log('PC Creator build, TypeScript and preview server passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
