const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js'));
let now=0,loads=0,releases=0,failures=0;const jobs=[],modules={},manifest=JSON.parse(fs.readFileSync('art-source/runtime-masters-v1/manifest.json','utf8'));
class Texture {constructor(w,h){this.width=w;this.height=h;this.refs=0;}addRef(){this.refs++;}decRef(){assert.ok(this.refs>0);this.refs--;releases++;}}
class Frame {reset(v){Object.assign(this,v);}destroy(){this.destroyed=true;}}
class Vec {constructor(x,y,w,h){this.x=x;this.y=y;this.width=w;this.height=h;}}
class Size {constructor(width,height){this.width=width;this.height=height;}}
class Sprite {static SizeMode={CUSTOM:1};spriteFrame=null;}
class Node {static EventType={NODE_DESTROYED:'destroy'};isValid=true;sp=new Sprite();events=[];on(_,fn){this.events.push(fn);}getComponent(){return this.sp;}destroy(){this.isValid=false;this.events.forEach(f=>f());}}
const cc={sys:{isNative:false},Node,Sprite,SpriteFrame:Frame,Texture2D:Texture,Rect:Vec,Size,resources:{load(name,type,callback){loads++;jobs.push(()=>{if(failures-->0)return callback(Error('simulated offline'));const item=manifest.find(r=>name==='art/'+r.file.replace('.png','')+'/texture');assert.ok(item,name);callback(null,new Texture(...item.runtimeSize));});}}};
function moduleFor(name){if(modules[name])return modules[name];const exports={};modules[name]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:key=>key==='cc'?cc:moduleFor(key.replace('./','')),performance:{now:()=>now},console,Set,Map,setTimeout:fn=>{fn();}});return exports;}
async function drain(){for(let i=0;i<15;i++){jobs.splice(0).forEach(f=>f());await Promise.resolve();}}
(async()=>{
 const {PMArt}=moduleFor('PMArt'),cache=new PMArt();
 for(const [key,s] of Object.entries(cache.specs)){const [w,h]=moduleFor('ArtSourceSizes').ART_SOURCE_SIZES[s.source],[x,y,rw,rh]=s.rect;assert.ok(x>=0&&y>=0&&rw>0&&rh>0&&x+rw<=w+1&&y+rh<=h+1,'source crop '+key);}
 assert.ok(!fs.readFileSync('assets/scripts/PMArt.ts','utf8').includes('[...this.entries.values()]'),'Cocos loose spread does not expand Map iterators');
 const a=new Node(),b=new Node();cache.bind(a,'kirin-SSR-front');cache.bind(b,'kirin-SSR-back');await Promise.resolve();assert.equal(loads,1,'atlas load deduplicated');await drain();assert.ok(a.sp.spriteFrame&&b.sp.spriteFrame);assert.equal(a.sp.spriteFrame.texture,b.sp.spriteFrame.texture);
 const f=a.sp.spriteFrame;assert.ok(f.rect.x+f.rect.width<=f.texture.width+1);assert.ok(f.rect.y+f.rect.height<=f.texture.height+1);
 now=10000;cache.sweep();assert.equal(releases,0,'visible sprites pinned');a.destroy();b.destroy();cache.sweep();assert.equal(releases,1);assert.equal(cache.stats().bytes,0);assert.equal(cache.frames['kirin-SSR-front'],undefined);
 const c=new Node();cache.bind(c,'fox-front');cache.bind(c,'bud-front');await drain();assert.equal(c.sp.spriteFrame,cache.frames['bud-front'],'stale response must not replace new binding');c.destroy();now+=5000;cache.sweep();assert.equal(cache.stats().textures,0);
 const dead=new Node();cache.bind(dead,'lotus-front');dead.destroy();await drain();assert.equal(dead.sp.spriteFrame,null,'destroyed node untouched');now+=5000;cache.sweep();assert.equal(cache.stats().textures,0);
 failures=1;const retry=new Node();cache.bind(retry,'kirin-SSR-front');await drain();assert.ok(retry.sp.spriteFrame,'transient failure retries');retry.destroy();now+=5000;cache.sweep();assert.equal(cache.pending,0);
 const hidden=new Node();hidden.parent={artPageVisible:false,parent:null};const loadCount=loads;cache.bind(hidden,'manta-front');await drain();assert.equal(loads,loadCount,'off-page image must not download');hidden.parent.artPageVisible=true;cache.refreshVisibility();await drain();assert.ok(hidden.sp.spriteFrame);hidden.parent.artPageVisible=false;cache.refreshVisibility();now+=5000;cache.sweep();assert.equal(cache.stats().textures,0);hidden.destroy();
 const stop=new Node();cache.bind(stop,'kirin-SR-front');await Promise.resolve();cache.dispose();await drain();assert.equal(cache.pending,0);assert.equal(cache.stats().textures,0);
 cc.sys.isNative=true;const native=new PMArt();const np=new Node();native.bind(np,'fox-front');await drain();np.destroy();now+=5000;native.sweep();assert.equal(native.stats().textures,1,'APP local texture retained after 5s');const count=loads;const np2=new Node();native.bind(np2,'fox-front');await drain();assert.equal(loads,count,'APP reopening reuses decoded texture');np2.destroy();now+=121000;native.sweep();assert.equal(native.stats().textures,0,'APP idle cache eventually releases');native.dispose();
 console.log('PASS art cache: all original crop bounds, shared load, scaled rectangles, live pins, idle release, stale responses, destroyed targets, retry and dispose');
})().catch(e=>{console.error(e);process.exitCode=1;});
