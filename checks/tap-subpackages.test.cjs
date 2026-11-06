const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const tool=path.resolve(__dirname,'../tools/prepare-tap-subpackages.cjs');
const prepare=fs.existsSync(tool)?require(tool).prepare:()=>{throw Error('Tap subpackage preparation is not implemented');};
function fixture(run){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pm-tap-subpackages-'));
  const write=(file,value)=>{fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),typeof value==='string'?value:JSON.stringify(value));};
  try{
    write('game.json',{deviceOrientation:'portrait',subpackages:[{name:'tapart01',root:'subpackages/tapart01'}]});
    write('game.js',"require('./web-adapter');");
    write('src/settings.json',{assets:{subpackages:['tapart01'],preloadBundles:[{bundle:'resources'},{bundle:'main'}],bundleVers:{}}});
    write('subpackages/tapart01/config.json',{name:'tapart01',deps:[],hasPreloadScript:true});
    write('subpackages/tapart01/index.js','globalThis.__fixtureEntryRuns=(globalThis.__fixtureEntryRuns||0)+1;');
    // The real Creator adapter captures fsUtils.loadSubpackage, then reads this path.
    write('engine-adapter.js',"var api=window.fsUtils.loadSubpackage;var root='subpackages/';");
    // Callback/progress forwarding copied from Creator 3.8.7's fs-utils.js.
    write('web-adapter.js',`var fsUtils={loadSubpackage(name,onProgress,onComplete){
      const task=wx.loadSubpackage({name,success(){onComplete&&onComplete();},
        fail(res){onComplete&&onComplete(new Error('Failed to load subpackage '+name+': '+res.errMsg));}});
      onProgress&&task.onProgressUpdate(onProgress);return task;
    }};`);
    return run({dir,write,read:file=>fs.readFileSync(path.join(dir,file),'utf8')});
  }finally{
    const resolved=path.resolve(dir),prefix=path.resolve(os.tmpdir())+path.sep+'pm-tap-subpackages-';
    if(!resolved.startsWith(prefix))throw Error('Unexpected temporary directory');
    fs.rmSync(resolved,{recursive:true,force:true});
  }
}
test('normalizes the actual manifest and creates a traceable Creator index entry, idempotently',()=>fixture(({dir,read})=>{
  const first=prepare(dir),config=JSON.parse(read('game.json'));
  assert(!('subpackages' in config));assert.deepEqual(config.subPackages,[{name:'tapart01',root:'subpackages/tapart01/'}]);
  assert.equal(config.deviceOrientation,'portrait');assert(first.changed.length>=2);
  const runs={},entry=read('subpackages/tapart01/game.js');
  vm.runInNewContext(entry,{require:request=>{assert.equal(request,'./index.js');vm.runInNewContext(read('subpackages/tapart01/index.js'),runs);}});
  assert.equal(runs.__fixtureEntryRuns,1);
  assert.deepEqual(prepare(dir).changed,[]);assert.deepEqual(prepare(dir,{check:true}).changed,[]);
  assert(first.packages[0].bytes>0);assert(first.mainBytes>0);
}));
test('preserves real adapter callbacks/progress and uses Tap when present, WeChat otherwise',()=>fixture(({dir,read})=>{
  prepare(dir);const events=[],context={wx:{loadSubpackage:()=>{throw Error('Tap must take precedence');}},tap:{loadSubpackage:options=>{events.push(options);return {onProgressUpdate:fn=>fn({progress:40})};}}};
  vm.runInNewContext(read('web-adapter.js'),context);
  const progress=[],complete=[];const task=context.fsUtils.loadSubpackage('tapart01',p=>progress.push(p.progress),e=>complete.push(e));
  assert.equal(events[0].name,'tapart01');assert.deepEqual(progress,[40]);assert.equal(typeof task.onProgressUpdate,'function');
  events[0].fail({errMsg:'network unavailable'});assert.match(complete[0].message,/network unavailable/);
  events[0].success();assert.equal(complete[1],undefined);
  delete context.tap;context.wx.loadSubpackage=options=>{events.push(options);return task;};
  context.fsUtils.loadSubpackage('tapart01',null,()=>{});assert.equal(events.length,2);
}));
test('rejects malformed or eager packages before mutating any source',()=>{
  for(const invalid of ['missing-entry','wrong-name','eager','mismatched-list','escape-root','conflicting-keys','unknown-adapter','size-limit'])fixture(({dir,write,read})=>{
    if(invalid==='missing-entry')fs.unlinkSync(path.join(dir,'subpackages/tapart01/index.js'));
    if(invalid==='wrong-name')write('subpackages/tapart01/config.json',{name:'other'});
    if(invalid==='eager')write('src/settings.json',{assets:{subpackages:['tapart01'],preloadBundles:[{bundle:'tapart01'}]}});
    if(invalid==='mismatched-list')write('src/settings.json',{assets:{subpackages:['other'],preloadBundles:[]}});
    if(invalid==='escape-root')write('game.json',{subpackages:[{name:'tapart01',root:'../external'}]});
    if(invalid==='conflicting-keys')write('game.json',{subpackages:[{name:'tapart01',root:'subpackages/tapart01'}],subPackages:[{name:'other',root:'subpackages/other'}]});
    if(invalid==='unknown-adapter')write('web-adapter.js','// no native subpackage call');
    const before=[read('game.json'),read('web-adapter.js')];
    assert.throws(()=>prepare(dir,invalid==='size-limit'?{maxSubpackageMiB:0.000001}:{}),undefined,invalid);
    assert.deepEqual([read('game.json'),read('web-adapter.js')],before,invalid);
  });
});
test('check mode reports required changes without creating the shim',()=>fixture(({dir,read})=>{
  const before=read('game.json');assert.throws(()=>prepare(dir,{check:true}),/requires preparation/);
  assert.equal(read('game.json'),before);assert(!fs.existsSync(path.join(dir,'subpackages/tapart01/game.js')));
}));

test('accepts the official converter formatting of the same Tap bridge',()=>fixture(({dir,write,read})=>{
  prepare(dir);
  write('web-adapter.js',read('web-adapter.js').replace('(/* PM_TAP_SUBPACKAGE_BRIDGE */','( /* PM_TAP_SUBPACKAGE_BRIDGE */'));
  assert.deepEqual(prepare(dir,{check:true}).changed,[]);
}));
