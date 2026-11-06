const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const out='checks/party-remove';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height] of [[390,844],[320,568]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  let s=M.fresh(42,['fox','turtle','bud']);s=M.assignPartySlot(s,s.pets[2].uid,2);s.expedition=false;
  await page.evaluate(async s=>{globalThis.cc=await System.import('cc');const walk=n=>n.components.find(c=>typeof c.partnersUI==='function')||n.children.map(walk).find(Boolean);globalThis.g=walk(cc.director.getScene());g.state=s;g.collection();},s);
  const idle=async()=>{await page.waitForTimeout(300);await page.waitForFunction(()=>!g.pressPending&&!g.artCache.pending);};
  const tap=async id=>{const c=await page.evaluate(id=>__pm.controls()[id],id);assert(c,id);await page.touchscreen.tap(c.x*width/390,c.y*width/390);await idle();};await idle();
  for(const index of [1,2]){
   const uid=M.homeParty(s)[index];await tap('team-slot-'+index);await page.screenshot({path:`${out}/remove-${index}-${width}.png`});await tap('partner-remove-'+index);
   const state=await page.evaluate(()=>g.state);assert.equal(M.homeParty(state)[index],'');assert(state.pets.some(p=>p.uid===uid));assert.equal(state.active.uid,s.active.uid);
   await tap('partner-assign-'+index);assert.equal(M.homeParty(await page.evaluate(()=>g.state))[index],uid);
  }
  assert.deepEqual(errors,[]);await ctx.close();console.log(`PASS ${width}: select reserve, actual remove touch, collection retained, reassign`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
