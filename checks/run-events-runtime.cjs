const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=Date.now(),copy=x=>JSON.parse(JSON.stringify(x));
function base(){const s=M.fresh(91,['fox','turtle','bud']);s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.expedition=true;s.hpRatio=.6;s.combatVitals[s.pets[1].uid]={hpRatio:0,hpBonus:0};const ready=M.syncStamina(s,T);ready.expedition=true;return ready;}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [390,320]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:568},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(()=>localStorage.setItem('pm.language.v1','zh-CN'));
  await page.goto(cfg.url+'?events=v1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  const bind=()=>page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());globalThis.texts=()=>{const out=[];function walk(n){const l=n.getComponent(cc.Label);if(l)out.push(l.string);n.children.forEach(walk);}walk(g.root);return out;};});await bind();
  async function seed(s){await page.waitForFunction(()=>!g.busy&&!g.pressPending);await page.evaluate(s=>{g.state=s;g.screen='game';g.save();g.render();},s);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(200);}
  async function tap(id){await page.waitForFunction(()=>!g.busy&&!g.pressPending&&performance.now()-g.lastTap>=200);const p=await page.evaluate(id=>__pm.controls()[id],id);assert(p,id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await page.waitForTimeout(250);await page.waitForFunction(()=>!g.busy&&!g.pressPending);}
  for(const kind of ['revive','heal','giant','learn','egg']){
   const s=M.grantBattleEvent(base(),kind);assert.equal(s.phase,'event');await seed(s);
   assert((await page.evaluate(()=>texts())).includes('奇遇'));
   await page.screenshot({path:`checks/event-${kind}-${width}.png`});
   if(kind==='learn'){
    const expected=copy(await page.evaluate(()=>g.state));await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await bind();await tap('start-game');
    assert.equal(await page.evaluate(()=>g.state.phase),'event');assert.deepEqual(copy(await page.evaluate(()=>g.state.runEffects)),expected.runEffects);assert.deepEqual(copy(await page.evaluate(()=>g.state.battleEvent)),expected.battleEvent);
   }
   await tap('eventContinue');assert.equal(await page.evaluate(()=>g.state.step),2);assert.equal(await page.evaluate(()=>g.state.phase),'encounter');assert(M.restore(JSON.stringify(await page.evaluate(()=>g.state))));
   if(kind==='giant'){
    let b=M.act(s,'eventContinue');b=M.selectActive(b,s.battleEvent.uid);b=M.act(b,'challenge');await seed(b);
    const giant=await page.evaluate(()=>g.playerNode.getComponent(cc.UITransform).width*g.playerNode.scale.x);await page.screenshot({path:`checks/event-giant-battle-${width}.png`});
    const normal=copy(b);delete normal.runEffects;await seed(normal);const size=await page.evaluate(()=>g.playerNode.getComponent(cc.UITransform).width*g.playerNode.scale.x);assert(Math.abs(giant/size-1.5)<.03,'actual sprite enlarged 50%');
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS all five event screens at 390/320, continue, no duplicate on reload, giant actual sprite scale +50%, persisted event/effects');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
