const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const now=Date.now();M.setTimeProvider(()=>now);
let base=M.chooseHero(M.prepareJourney(M.fresh(73,['fox','bud','otter'])),'ranger');base.expedition=false;base.stamina={value:30,updatedAt:now};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,reduced] of [[390,844,false],[320,568,false],[320,568,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(()=>localStorage.setItem('pm.language.v1','zh-CN'));await page.goto(cfg.url+'?home-motion=check');await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
  await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.homeUI==='function');if(c)return c;for(const child of n.children){const f=walk(child);if(f)return f;}}globalThis.g=walk(cc.director.getScene());});
  const show=async s=>{await page.evaluate(s=>{g.state=s;g.screen='home';g.render();},s);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(150);};
  const snapshot=()=>page.evaluate(()=>{let nodes=0;function count(n){nodes++;n.children.forEach(count);}count(g.root);const m=g.homeMotion;return {nodes,controls:__pm.controls(),motion:!!m,next:m?.next,pulse:m?.pulse?.opacity,icons:m?.icons.map(i=>({x:i.node.position.x,y:i.node.position.y,z:i.node.eulerAngles.z,baseX:i.x,baseY:i.y,baseZ:i.z})),badges:m?.badges.filter(n=>n.activeInHierarchy).map(n=>({name:n.name,x:n.position.x,y:n.position.y})),screen:__pm.screen()};});
  const tap=async id=>{const p=await page.evaluate(id=>__pm.controls()[id],id);assert(p,'missing '+id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await page.waitForTimeout(220);await page.waitForFunction(()=>!__pm.animating());};
  await show(base);const initial=await snapshot(),label=`${width}x${height}${reduced?' reduced':''}`;
  if(reduced){assert.equal(initial.motion,false,'reduced motion disables home controller');await page.waitForTimeout(500);assert.equal((await snapshot()).motion,false);await page.screenshot({path:'checks/home-motion-reduced-320.png'});await tap('home-explore');assert.equal(await page.evaluate(()=>__pm.screen()),'adventure');}
  else{
   assert(initial.motion,label+' controller enabled');assert.equal(initial.icons.length,5);let moved=false,pulsed=false;
   for(let i=0;i<20;i++){await page.waitForTimeout(150);const s=await snapshot();assert.equal(s.nodes,initial.nodes,label+' no per-frame nodes');assert.deepEqual(s.controls,initial.controls,label+' hitboxes stay fixed');pulsed ||= Math.abs(s.pulse-initial.pulse)>5;const active=s.icons.filter(v=>Math.abs(v.y-v.baseY)>.02||Math.abs(v.z-v.baseZ)>.02);assert(active.length<=1,label+' only one secondary icon moves');moved ||= active.length>0;}
   assert(moved&&pulsed,label+' sampled visible icon movement and pulse');
   // The controller itself throttles calls, independently of browser frame rate.
   assert(await page.evaluate(()=>{const m=g.homeMotion,t=performance.now()+100;g.homeMotionUpdate(t);const next=m.next;g.homeMotionUpdate(t+1);return next>=t+49&&m.next===next;}),label+' 20Hz gate');
   await page.evaluate(()=>g.onHide());const hidden=await snapshot();await page.waitForTimeout(550);const after=await snapshot();assert.equal(after.next,hidden.next,label+' background stops updates');assert.equal(after.pulse,hidden.pulse);assert.deepEqual(after.icons,hidden.icons);await page.evaluate(()=>g.onShow());await page.waitForTimeout(200);const resumed=await snapshot();assert(resumed.next>after.next,label+' foreground resumes');
   await page.screenshot({path:`checks/home-motion-${width}.png`});
   await tap('home-explore');assert.equal(await page.evaluate(()=>__pm.screen()),'adventure');assert.equal(await page.evaluate(()=>g.homeMotion),null,'leaving page clears controller');
   for(let i=0;i<4;i++){await show(base);assert.equal((await snapshot()).nodes,initial.nodes,label+' repeated home has bounded nodes');await page.evaluate(()=>{globalThis.oldHomeIcon=g.homeMotion.icons[0].node;g.screen='adventure';g.render();});await page.waitForTimeout(80);assert(await page.evaluate(()=>g.homeMotion===null&&!oldHomeIcon.isValid),label+' old nodes and controller released');}
   await show(base);await tap('home-hatch');assert.equal(await page.evaluate(()=>__pm.screen()),'utility');assert.equal(await page.evaluate(()=>g.homeMotion),null,'hatch entry clears controller');
   if(width===320){
    let ready=JSON.parse(JSON.stringify(base));ready.eggs=[{id:'motion-egg',rarity:'normal',affinity:'bud',stage:5,mapId:0}];ready=M.startIncubation(ready,'motion-egg',0,now);const parents=ready.pets.filter(p=>p.uid!==ready.active.uid).slice(0,2);parents[0].sex='female';parents[1].sex='male';ready=M.startBreeding(ready,parents[0].uid,parents[1].uid,now);assert(ready.breeding&&ready.incubators[0]);ready.incubators[0].readyAt=now-1000;ready.breeding.readyAt=now-1000;await show(ready);
    const ys=[new Set(),new Set()];for(let i=0;i<33;i++){const s=await snapshot();assert.equal(s.badges.length,2);s.badges.forEach((b,j)=>ys[j].add(b.y.toFixed(2)));await page.waitForTimeout(150);}assert(ys.every(s=>s.size>1),'both ready badges animate');await page.screenshot({path:'checks/home-motion-ready-320.png'});
   }
  }
  assert.deepEqual(errors,[],label+' browser errors');await context.close();console.log('PASS '+label+' bounded UI motion, fixed click regions, lifecycle and page entry');
 }
 console.log('PASS home motion: 390/320, 20Hz gate, one moving icon, ready badges, no frame-node growth, hidden pause, re-entry cleanup and reduced motion. Browser verification only; mobile device performance remains separate.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
