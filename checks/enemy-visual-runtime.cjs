const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.goto(cfg.url+'?enemy-visual=1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const g=n.components.find(c=>typeof c.loadRegionArt==='function');if(g)return g;for(const ch of n.children){const g=walk(ch);if(g)return g;}}globalThis.g=walk(cc.director.getScene());});
 for(const width of [390,320])for(const variant of ['mirror','giant','ward',null]){
  await page.setViewportSize({width,height:width===390?844:568});let s=M.act(M.fresh(42),'challenge');s.enemy='fox';s.enemyRarity='SR';s.enemyVariant=variant?{kind:variant,revealed:true,shield:variant==='ward'?5:0}:undefined;
  await page.evaluate(async s=>{g.state=s;g.screen='game';await g.loadRegionArt(s.mapId);g.render();},s);await page.waitForFunction(()=>!g.artCache.pending);await page.waitForTimeout(150);
  if(variant==='mirror')await page.screenshot({path:`checks/enemy-visual-${process.env.PM_BEFORE?'before':'after'}-${width}.png`});
  const inspect=()=>page.evaluate(()=>g.stage.children.filter(n=>n.getComponent(cc.Sprite)?.spriteFrame===g.enemyNode.getComponent(cc.Sprite).spriteFrame).length);
  assert.equal(await inspect(),1,'exactly one enemy image: No.002 '+variant);await page.evaluate(()=>g.render());await page.waitForTimeout(100);assert.equal(await inspect(),1,'redraw keeps one enemy image');
 }
 assert.deepEqual(errors,[]);console.log('PASS No.002 normal/mirror/giant/ward one enemy image at 390/320, repeated redraw.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
