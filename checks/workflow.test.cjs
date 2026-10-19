const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {execute}=require('../tools/workflow.cjs'),root=path.resolve(__dirname,'..'),runner=path.join(root,'tools/workflow.cjs');
const command=args=>spawnSync(process.execPath,[runner,...args],{cwd:root,encoding:'utf8',windowsHide:true});
(async()=>{
 const report=path.join(root,'checks/workflow/latest.json'),before=fs.existsSync(report)?fs.readFileSync(report,'utf8'):null;
 const p=command(['--scope','auto','--file','assets/scripts/PMModel.ts','--file','assets/scripts/PMGame.ts','--plan']);assert.equal(p.status,0,p.stderr);const result=JSON.parse(p.stdout);assert.ok(result.tests.includes('checks/maps-breeding.test.cjs'));assert.ok(result.runtime.includes('checks/fullscreen-runtime.cjs'));assert.equal(result.runtime.filter(s=>s==='checks/workflow-smoke.cjs').length,1);
 for(const args of [[],['--scope','missing'],['--file','docs/PROJECT.md','--plan']]){const r=command(args);assert.equal(r.status,1);assert.ok(r.stderr.includes('已停止'));}
 assert.equal(fs.existsSync(report)?fs.readFileSync(report,'utf8'):null,before,'plans and invalid requests must not overwrite a result');
 const folder=path.join(root,'checks/workflow');fs.mkdirSync(folder,{recursive:true});const log=path.join(folder,'failure-path-test.log');
 await assert.rejects(execute(process.execPath,['-e','console.error("intentional failure");process.exit(7)'],log),/退出码 7/);assert.match(fs.readFileSync(log,'utf8'),/intentional failure/);
 console.log('PASS workflow CLI: relevant selection, deduplication, fail-closed inputs, read-only plans, subprocess failure logs');
})().catch(e=>{console.error(e);process.exit(1);});
