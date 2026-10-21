const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
const source=ts.transpileModule(fs.readFileSync('assets/scripts/TrustedClock.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function load(extra){const exports={};vm.runInNewContext(source,{exports,...extra});return exports;}
(async()=>{
  const utc=1792584036000;
  const tap=load({tap:{request:o=>o.success({statusCode:200,data:{code:0,data:{now:utc/1000}}})}});
  assert.equal(await tap.fetchTrustedUtc(),utc);
  let tapCalls=0;
  const fallback=load({tap:{request:o=>{tapCalls++;o.success({statusCode:200,data:tapCalls===1?{code:-1}:'QZOutputJson={"s":"o","t":1792584036};'});}}});
  assert.equal(await fallback.fetchTrustedUtc(),utc);assert.equal(tapCalls,2);
  await assert.rejects(load({tap:{request:o=>o.success({statusCode:200,data:'QZOutputJson=alert(1)'})}}).fetchTrustedUtc());
  await assert.rejects(load({tap:{request:o=>o.success({statusCode:200,data:{code:0,data:{now:0}}})}}).fetchTrustedUtc());
  let request;
  const wx=load({wx:{request(o){request=o;o.success({statusCode:200,data:{timeZone:'UTC'}});}}});
  assert.equal((await wx.requestTimeJson('https://example.test')).timeZone,'UTC');assert.equal(request.timeout,5000);
  await assert.rejects(load({wx:{request:o=>o.success({statusCode:503,data:{}})}}).requestTimeJson('x'));
  await assert.rejects(load({wx:{request:o=>o.fail(new Error('offline'))}}).requestTimeJson('x'));
  class XHR {open(method,url,async){assert.equal(method,'GET');assert.equal(async,true);}send(){this.status=200;this.responseText='{"native":true}';this.onload();}}
  assert.equal((await load({XMLHttpRequest:XHR}).requestTimeJson('https://example.test')).native,true);
  class TimeoutXHR extends XHR{send(){this.ontimeout();}}
  await assert.rejects(load({XMLHttpRequest:TimeoutXHR}).requestTimeJson('x'));
  class BadXHR extends XHR{send(){this.status=200;this.responseText='invalid';this.onload();}}
  await assert.rejects(load({XMLHttpRequest:BadXHR}).requestTimeJson('x'));
  assert.equal((await load({fetch:async()=>({ok:true,json:async()=>({browser:true})}),AbortController,setTimeout,clearTimeout}).requestTimeJson('x')).browser,true);
  console.log('PASS WeChat request, native XHR, browser fetch; HTTP, offline, timeout and invalid JSON fail closed');
})().catch(e=>{console.error(e);process.exitCode=1;});
