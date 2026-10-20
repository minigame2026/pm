// Isolated cold-start measurement, trace and rendering evidence. Desktop
// emulation is not a phone GPU/memory certification.
const fs=require('node:fs'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const result={browser:browser.version(),viewport:'390x844',realPhone:false,errors:[],failedLocalRequests:[]};let context;
 try{
  context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  page.on('pageerror',e=>result.errors.push(String(e)));page.on('requestfailed',r=>{if(r.url().startsWith(cfg.url))result.failedLocalRequests.push({url:r.url(),error:r.failure()});});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Performance.enable');
  const urls=new Map();let transferred=0,requests=0;cdp.on('Network.requestWillBeSent',e=>urls.set(e.requestId,e.request.url));cdp.on('Network.loadingFinished',e=>{if(urls.get(e.requestId)?.startsWith(cfg.url)){transferred+=e.encodedDataLength;requests++;}});
  const began=Date.now();await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});result.coldStartMs=Date.now()-began;result.localTransferBytesAtReady=transferred;result.localRequestsAtReady=requests;
  result.minimumTransferSecondsAt10Mbps=Number((transferred*8/10000000).toFixed(1));
  await page.evaluate(async()=>{const cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const v=walk(ch);if(v)return v;}}globalThis.qaGame=walk(cc.director.getScene());});
  result.art=await page.evaluate(()=>{const seen=new Set(),textures=[];for(const [key,frame] of Object.entries(qaGame.art)){const t=frame.texture;if(t&&!seen.has(t)){seen.add(t);textures.push({key,width:t.width,height:t.height,rgbaBytes:t.width*t.height*4});}}return{frames:Object.keys(qaGame.art).length,uniqueTextures:textures.length,rgbaBaseLevelBytes:textures.reduce((n,t)=>n+t.rgbaBytes,0),largest:textures.sort((a,b)=>b.rgbaBytes-a.rgbaBytes).slice(0,8)};});
  // The load measurement above excludes trace overhead.
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  const tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const c=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(c,id);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(220);await page.waitForFunction(()=>!__pm.animating());};
  await tap('start-game');await tap('hero-confirm');await tap('starter-confirm');
  await page.screenshot({path:'checks/release-camp.png'});
  result.frameIntervals=await page.evaluate(()=>new Promise(resolve=>{const intervals=[];let previous=performance.now();function frame(now){intervals.push(now-previous);previous=now;if(intervals.length<120)requestAnimationFrame(frame);else{intervals.shift();intervals.sort((a,b)=>a-b);resolve({samples:intervals.length,medianMs:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)],maxMs:intervals.at(-1)});}}requestAnimationFrame(frame);}));
  await tap('home-explore');await tap('adventure-go');await tap('challenge');await tap('attack');
  const before=await page.evaluate(()=>__pm.snapshot());await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});await tap('start-game');
  const restored=await page.evaluate(()=>__pm.snapshot());for(const k of ['phase','step','seed','hpRatio','enemyHP','attack','usedHeal','doubled'])assert.deepEqual(restored[k],before[k],'trace resume '+k);
  await page.screenshot({path:'checks/release-battle.png'});await context.tracing.stop({path:'checks/release-trace.zip'});
  result.jsHeapUsedBytes=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='JSHeapUsedSize')?.value;
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.failedLocalRequests,[]);result.status='passed';
  console.log('PASS cold-start measured, isolated player-input trace, battle reload, no JS errors or failed local requests');
 }catch(e){result.status='failed';result.failure=String(e);throw e;}finally{fs.writeFileSync('checks/release-audit.json',JSON.stringify(result,null,2));if(context)await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
