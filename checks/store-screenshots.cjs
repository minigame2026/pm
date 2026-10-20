const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const out=path.resolve('build/releases/游戏实机截图-20261020');fs.mkdirSync(out,{recursive:true});
const base=M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(17),'ranger'),'fox'),Date.now());
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));
  await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await context.addInitScript(s=>localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s)),base);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(cfg.url+'?capture=store-20261020');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  await page.evaluate(async()=>{const cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.nestUI==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());});
  async function tap(id){await page.waitForFunction(()=>!__pm.animating());const p=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(p,id);await page.touchscreen.tap(p.x*720/390,p.y*720/390);await page.waitForTimeout(500);await page.waitForFunction(()=>!__pm.animating());}
  async function shot(name){await page.waitForTimeout(1800);await page.screenshot({path:path.join(out,name+'.png')});console.log(name);}
  await tap('start-game');await shot('01-主界面');
  await tap('home-explore');await shot('02-探险地图');
  await tap('adventure-go');await tap('challenge');await shot('03-战斗');
  // Stage the existing elite nest screen in this isolated screenshot save.
  await page.evaluate(()=>{g.state.step=5;g.state.phase='nest';g.state.eggHunt={limit:2,candidates:[],selected:-1};g.render();});
  await tap('eggSearch');await shot('04-偷蛋');
  await page.evaluate(()=>g.goHome());await tap('home-dex');await shot('05-图鉴');
  assert.deepEqual(errors,[]);
  const files=fs.readdirSync(out).filter(n=>n.endsWith('.png')).map(n=>{const b=fs.readFileSync(path.join(out,n));assert.equal(b.readUInt32BE(16),720);assert.equal(b.readUInt32BE(20),1280);assert.ok(b.length<4*1024*1024);return {file:n,width:720,height:1280,bytes:b.length};});
  assert.equal(files.length,5);fs.writeFileSync(path.join(out,'规格.json'),JSON.stringify({source:'actual browser game rendering, isolated test save',aspectRatio:'9:16',files},null,2));console.log(JSON.stringify(files));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
