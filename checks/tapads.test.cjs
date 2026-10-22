const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const js=ts.transpileModule(fs.readFileSync('assets/scripts/PMRewardedAds.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exportsObj={},timers=new Map();let timerId=0;
vm.runInNewContext(js,{exports:exportsObj,require:n=>n==='cc'?{sys:{isNative:false,OS:{ANDROID:'Android'}},native:{}}:{TAP_MINI_AD_UNITS:{}},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)});
const install=exportsObj.installRewardedAds,units={stamina_10:'test',hatch_reduce_30m:'test',breed_reduce_30m:'test',encounter_reroll:'test'};
const flush=()=>new Promise(r=>setImmediate(r));
function fixture(){const ads=[];const host={tap:{createRewardedVideoAd:options=>{
 const ad={options,destroyed:false,load:()=>Promise.resolve(),show:()=>{ad.shown=true;return Promise.resolve();},
 onClose:f=>ad.close=f,onError:f=>ad.error=f,offClose:()=>{},offError:()=>{},destroy:()=>ad.destroyed=true};ads.push(ad);return ad;
}}};install(host,false,undefined,units);return {host,ads};}
(async()=>{
 const plain={};install(plain,false);assert.equal(plain.pmRewardedAd,undefined);
 const {host,ads}=fixture();
 let p=host.pmRewardedAd.show({placement:'stamina_10'});await flush();assert(ads[0].shown);
 assert.equal((await host.pmRewardedAd.show({placement:'encounter_reroll'})).reason,'busy');
 ads[0].close({isEnded:false});assert.equal((await p).completed,false);assert(ads[0].destroyed);
 p=host.pmRewardedAd.show({placement:'encounter_reroll'});await flush();
 ads[0].close({isEnded:true}); // Late success from previous request must not grant this one.
 let settled=false;p.then(()=>settled=true);await flush();assert.equal(settled,false);
 ads[1].close({isEnded:true});assert.equal((await p).completed,true);ads[1].close({isEnded:true});
 p=host.pmRewardedAd.show({placement:'hatch_reduce_30m'});await flush();ads[2].error({});assert.equal((await p).completed,false);
 p=host.pmRewardedAd.show({placement:'hatch_reduce_30m'});await flush();ads[3].close(undefined);assert.equal((await p).completed,false);
 p=host.pmRewardedAd.show({placement:'stamina_10'});await flush();for(const fn of [...timers.values()])fn();assert.equal((await p).reason,'timeout');
 const missing={tap:host.tap};install(missing,false,undefined,{});assert.equal((await missing.pmRewardedAd.show({placement:'stamina_10'})).reason,'not-configured');
 const nativeHost={};let called;
 install(nativeHost,true,(id,placement)=>called={id,placement});
 p=nativeHost.pmRewardedAd.show({placement:'stamina_10'});
 nativeHost.__pmTapAdResult('wrong',true,'completed');assert.equal(called.placement,'stamina_10');
 nativeHost.__pmTapAdResult(called.id,true,'completed');assert.equal((await p).completed,true);
 assert.equal((await nativeHost.pmRewardedAd.show({placement:'unknown'})).completed,false);
 for(const placement of ['breed_reduce_30m']){
  p=host.pmRewardedAd.show({placement});await flush();const ad=ads[ads.length-1];assert.equal(ad.options.adUnitId,'test');ad.close({isEnded:true});assert.equal((await p).completed,true);
  p=nativeHost.pmRewardedAd.show({placement});assert.equal(called.placement,placement);nativeHost.__pmTapAdResult(called.id,true,'completed');assert.equal((await p).completed,true);
 }
 assert.equal(timers.size,0);
 console.log('PASS: Tap mini/native routing, completion-only rewards, cancellation, errors, missing config, duplicate/late callbacks, concurrency and timeout.');
})().catch(e=>{console.error(e);process.exitCode=1});
