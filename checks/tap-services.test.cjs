const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const source=fs.readFileSync('assets/scripts/PMTapServices.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exp={},timers=new Map();let serial=0;
vm.runInNewContext(js,{exports:exp,require:()=>({sys:{isNative:false,OS:{ANDROID:'Android'}},native:{}}),setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:i=>timers.delete(i)});
const Service=exp.PMTapServices;
(async()=>{
  const reports=[],reporting=new Service({tap:{reportScene:event=>reports.push(event)}},false);
  reporting.reportReady();reporting.reportReady();assert.equal(reports.length,1);
  assert.equal(JSON.stringify(reports[0]),'{"sceneId":7}','report the true interaction point without inventing a duration');
  new Service({},false).reportReady();
  new Service({tap:{reportScene:()=>{throw Error('must not invoke mini reporting on Android');}}},true,()=>{}).reportReady();
  const unavailable=new Service({},false);assert(!unavailable.available);await assert.rejects(unavailable.login());
  let loginOptions,cloudOptions,write,upload;const files=new Map();
  const archive={name:'pm_save_v1',uuid:'u1',fileId:'f1'};
  const cloud={getArchiveList:o=>{cloudOptions=o;o.success({saves:[archive,{name:'another_game',uuid:'x',fileId:'x'}]});},
    createArchive:o=>{upload=o;o.success({uuid:'u1'});},updateArchive:o=>{upload=o;o.success({});},
    getArchiveData:o=>{files.set('/download','{"progress":42}');o.success({filePath:'/download'});}};
  const host={tap:{login:o=>{loginOptions=o;o.success({code:'temporary-never-persist'});},getCloudSaveManager:()=>cloud,
    env:{USER_DATA_PATH:'/usr'},getFileSystemManager:()=>({writeFile:o=>{write=o;files.set(o.filePath,o.data);o.success({});},readFile:o=>o.success({data:files.get(o.filePath)})})}};
  const service=new Service(host,false);await assert.rejects(service.upload('{}'));
  await service.login();assert(service.connected);assert(loginOptions);assert(cloudOptions);
  assert.equal(JSON.stringify(service).includes('temporary-never-persist'),false);
  const list=await service.list();assert.equal(list.length,1);assert.equal(list[0].uuid,'u1');
  await service.upload('{"progress":42}');assert.equal(write.data,'{"progress":42}');assert.equal(upload.archiveMetaData.name,'pm_save_v1');
  await service.upload('{"progress":43}',archive);assert.equal(upload.archiveUUID,'u1');
  assert.equal(await service.download(archive),'{"progress":42}');
  // A login code alone does not mean the platform cloud account is ready.
  cloud.getArchiveList=o=>o.fail({errno:400100});const failed=new Service(host,false);await assert.rejects(failed.login());assert(!failed.connected);
  host.tap.login=o=>o.fail({});await assert.rejects(new Service(host,false).login());
  let pending;host.tap.login=o=>pending=o;const late=new Service(host,false),p=late.login();
  for(const fn of [...timers.values()])fn();await assert.rejects(p);pending.success({code:'late'});assert(!late.connected);
  const androidHost={};let request;
  const android=new Service(androidHost,true,(id,op,data)=>request={id,op,data});const nativeLogin=android.login();
  androidHost.__pmTapServiceResult('stale',true,{});assert(!android.connected);
  androidHost.__pmTapComplianceResult(500);assert(!android.playAllowed,'unsolicited success must not authorize play');
  androidHost.__pmTapComplianceResult(0);assert(!android.playAllowed);
  androidHost.__pmTapComplianceResult(500);
  androidHost.__pmTapServiceResult(request.id,true,{complianceCode:500});await nativeLogin;assert(android.connected);assert(android.playAllowed);
  const download=android.download(archive);androidHost.__pmTapServiceResult(request.id,false,null);await assert.rejects(download);
  for(const code of [1000,1001,1030,1050,1100,1200,9002,9999]){
    androidHost.__pmTapComplianceResult(code);assert(!android.playAllowed);assert(!android.connected);
    androidHost.__pmTapComplianceResult(500);assert(!android.playAllowed,'late success cannot lift a restriction');
    androidHost.__pmTapComplianceResult(0);androidHost.__pmTapComplianceResult(500);assert(android.playAllowed);
  }
  const unverified=new Service({},true,(id)=>{request={id};}),unverifiedLogin=unverified.login();
  unverified.host.__pmTapServiceResult(request.id,true,{});await assert.rejects(unverifiedLogin);assert(!unverified.playAllowed);
  assert.equal(timers.size,0);
  assert(!source.includes('jscode2session'));assert(!source.includes('clientToken'));
  const gameSource=fs.readFileSync('assets/scripts/PMGame.ts','utf8');
  const ast=ts.createSourceFile('PMGame.ts',gameSource,ts.ScriptTarget.Latest,true);
  const cls=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='PMGame');
  const methods=['continueFromCover','command','startBattleSample'];
  const body=cls.members.filter(n=>n.name&&methods.includes(n.name.getText(ast))).map(n=>n.getText(ast)).join('\n');
  const code=ts.transpileModule('export class GateFixture{'+body+'}',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const gateExports={};vm.runInNewContext(code,{exports:gateExports});
  const fixture=new gateExports.GateFixture(),state={journey:{stage:'done'},expedition:true,step:7};
  fixture.state=state;fixture.screen='login';fixture.tapServices={playAllowed:false};let prompts=0,renders=0;
  fixture.tapAccount=()=>prompts++;fixture.render=()=>renders++;
  fixture.continueFromCover();await fixture.command('attack');await fixture.startBattleSample();
  assert.equal(fixture.screen,'login');assert.equal(fixture.state,state);assert.equal(prompts,1);assert.equal(renders,0);
  fixture.tapServices.playAllowed=true;fixture.continueFromCover();assert.equal(fixture.screen,'game');assert.equal(fixture.state.step,7);
  // A slow time provider must not hold the loaded title screen hostage. Timed actions stay gated.
  const bootBody=cls.members.filter(n=>n.name&&['start','requireTime'].includes(n.name.getText(ast))).map(n=>n.getText(ast)).join('\n');
  const bootCode=ts.transpileModule('export class BootFixture{'+bootBody+'}',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  class FakeNode{addChild(){} addComponent(){return {};}}
  class FakeCamera{} FakeCamera.ProjectionType={ORTHO:1};FakeCamera.ClearFlag={SOLID_COLOR:1};
  const bootExports={};let provider,clockRequested=0,bootRenders=0,timeNotices=0,afterDraw,readyReports=0;
  vm.runInNewContext(bootCode,{exports:bootExports,sys:{localStorage:{getItem:()=>null},languageCode:'zh-CN'},
    LANGUAGE_KEY:'language',KEY:'save',selectLanguage(){},installRewardedAds(){},PMAudio:class{},
    profiler:{hideStats(){}},view:{setDesignResolutionSize(){}},ResolutionPolicy:{FIXED_WIDTH:1},Node:FakeNode,
    Layers:{Enum:{UI_2D:1}},UITransform:class{},Camera:FakeCamera,Canvas:class{},color:()=>({}),C:{ink:'#000'},
    restore:()=>null,prepareJourney:s=>s,newJourney:()=>({stamina:{value:30},pets:[],journey:{stage:'hero'}}),
    setTimeProvider:fn=>provider=fn,loadShinyVisuals:async()=>{},incomingPostcard:()=>'',readVisitCode:()=>false,
    game:{on(){},resume(){},pause(){}},Game:{EVENT_HIDE:'hide',EVENT_SHOW:'show'},
    director:{once:(event,fn)=>{assert.equal(event,'after-draw');afterDraw=fn;}},Director:{EVENT_AFTER_DRAW:'after-draw'},console});
  const boot=new bootExports.BootFixture();
  Object.assign(boot,{node:new FakeNode(),tapServices:{reportReady:()=>readyReports++},durableCheckpoint:{open:async()=>null},
    trustedClock:{restore(){},now:()=>null},nativeApp:false,ready:false,state:null,checkpointSequence:0,
    layout(){},text:()=>({}),artCache:{load:async()=>{},stats:()=>({})},loginLogoKey:()=> 'logo',
    synchronizeTime(){clockRequested++;return new Promise(()=>{});},
    render(){bootRenders++;},save(){},timeNotice(){timeNotices++;}});
  void boot.start();for(let i=0;i<20;i++)await Promise.resolve();
  assert.equal(clockRequested,1);assert.equal(boot.ready,true,'loaded cover must appear while initial network time is pending');
  assert.equal(bootRenders,1);assert(Number.isNaN(provider()),'pending clock must never fall back to phone time');
  assert.equal(boot.requireTime(),false);assert.equal(timeNotices,1,'timed actions must remain blocked');
  assert.equal(readyReports,0,'ready must not be reported before the loaded cover is drawn');
  assert.equal(typeof afterDraw,'function');afterDraw();assert.equal(readyReports,1);
  console.log('PASS: Tap services, compliance gates, saved expedition preservation, and nonblocking cover with gated timed actions.');
})().catch(e=>{console.error(e);process.exitCode=1;});
