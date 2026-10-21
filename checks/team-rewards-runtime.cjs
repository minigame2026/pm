const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=Date.now();
function ready(kind){const s=M.fresh(91,['fox','turtle','bud']);s.journey={version:1,stage:'done',hero:'ranger',starter:null,legacy:true};s.expedition=true;s.phase='reward';s.reward={kind,values:[kind==='hp'?3:1],title:kind};return M.syncStamina(s,T);}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [390,320]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:568},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));
  await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(s=>{localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));localStorage.setItem('pm.language.v1','zh-CN');},ready('hp'));
  await page.goto(cfg.url+'?rewards=team-v1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());
   globalThis.texts=()=>{const out=[];function walk(n){const l=n.getComponent(cc.Label);if(l)out.push(l.string);n.children.forEach(walk);}walk(g.root);return out;};});
  for(const kind of ['hp','attackMin','attackMax']){
   const s=ready(kind);await page.waitForFunction(()=>!g.busy&&!g.pressPending);
   await page.evaluate(s=>{g.state=s;g.screen='game';g.render();},s);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(350);
   const labels=await page.evaluate(()=>texts());assert(labels.includes('全队获得奖励'));
   for(const uid of M.homeParty(s).filter(Boolean)){
    const c=M.petCombat(s,uid),v=kind==='hp'?c.max:kind==='attackMin'?Math.min(...c.pet.faces):Math.max(...c.pet.faces);
    assert(labels.includes(v+' → '+(v+s.reward.values[0])),'visible per-pet preview');
   }
   await page.screenshot({path:`checks/team-reward-${kind}-${width}.png`});
   await page.waitForFunction(()=>!g.busy&&!g.pressPending&&performance.now()-g.lastTap>=200);
   const pos=await page.evaluate(()=>__pm.controls().take),scale=width/390;assert(pos.y*scale>0&&pos.y*scale< (width===390?844:568));await page.touchscreen.tap(pos.x*scale,pos.y*scale);
   await page.waitForFunction(()=>!g.busy&&!g.pressPending&&g.state.phase==='encounter');
   const actual=await page.evaluate(()=>g.state),expected=M.act(s,'take');
   for(const uid of M.homeParty(s).filter(Boolean))assert.deepEqual(JSON.parse(JSON.stringify(M.petCombat(actual,uid))),JSON.parse(JSON.stringify(M.petCombat(expected,uid))));
   assert(M.restore(JSON.stringify(actual)));
   await page.evaluate(s=>{g.state={...s,phase:'encounter'};g.screen='game';g.render();},s);await page.waitForTimeout(350);
   if(kind!=='hp')assert((await page.evaluate(()=>texts())).includes((kind==='attackMin'?'↓':'↑')+' +1'));
   if(kind==='attackMax')await page.screenshot({path:`checks/team-reward-encounter-${width}.png`});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS 390/320 reward previews and claim taps, all team effects, persisted state, encounter min/max dice indicators');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
