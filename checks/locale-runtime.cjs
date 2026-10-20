const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=Date.now(),ready=M.syncStamina(M.fresh(42,['fox','turtle','bud']),T);ready.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};
const systems={'zh-CN':'伙伴','en-US':'Pets','ja-JP':'仲間','ko-KR':'친구','zh-TW':'仲間','th-TH':'เพื่อน','de-DE':'Pets'};
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [system,title] of Object.entries(systems)){
  const context=await b.newContext({viewport:{width:390,height:844},locale:system,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));
  await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(s=>{if(!localStorage.getItem('pm.creature-dice.v1'))localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));},ready);
  async function boot(){await page.goto(cfg.url+'?locale=check');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
   await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.languageSettings==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());
    globalThis.labels=()=>{const all=[];function walk(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l)all.push(l.string);n.children.forEach(walk);}walk(g.root);return all;};
   });
  }await boot();
  const lang=system==='de-DE'?'en':system==='zh-CN'||system==='zh-TW'?system:system.slice(0,2);
  await page.screenshot({path:`checks/locale-${lang}-cover.png`});
  for(const screen of ['home','adventure','partners','game']){
   await page.evaluate(screen=>{g.screen=screen;g.render();},screen);await page.waitForTimeout(220);
   const text=await page.evaluate(()=>labels());
   if(screen==='home')assert(text.includes(system==='zh-TW'?'夥伴':title),system+' home title');
   if(['en','ko','th'].includes(lang))assert(!/[\u3400-\u9fff]/.test(text.join('\n')),system+': '+text.filter(t=>/[\u3400-\u9fff]/.test(t)));
   if(screen==='home'||screen==='game')await page.screenshot({path:`checks/locale-${lang}-${screen}.png`});
  }
  for(const draw of ['pokedexUI','hatchery','breedingUI','socialUI','encounterTypesUI']){
   await page.evaluate(draw=>g[draw](),draw);await page.waitForTimeout(180);
   if(['en','ko','th'].includes(lang))assert(!/[\u3400-\u9fff]/.test((await page.evaluate(()=>labels())).join('\n')),system+' '+draw);
  }
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(250);
  await page.evaluate(()=>{g.screen='home';g.render();g.homeSettings();});
  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>JSON.stringify(g.state));
  await page.screenshot({path:`checks/locale-${lang}-settings-320.png`});
  async function tap(id){const c=await page.evaluate(id=>__pm.controls()[id],id);assert(c,id);const k=page.viewportSize().width/390;await page.touchscreen.tap(c.x*k,c.y*k);await page.waitForTimeout(180);}
  await tap('settings-language');await page.screenshot({path:`checks/locale-${lang}-picker-320.png`});
  await tap('language-en');assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),'en');
  await tap('language-back');assert((await page.evaluate(()=>labels())).includes('Settings'));
  assert.equal(await page.evaluate(()=>JSON.stringify(g.state)),before,'language must not alter game state');
  await boot();await page.evaluate(()=>{g.screen='home';g.render();});assert((await page.evaluate(()=>labels())).includes('Pets'),'manual choice survives restart');
  await page.evaluate(()=>g.languageSettings());await tap('language-system');assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),'system');
  await tap('language-back');await page.evaluate(()=>{g.screen='home';g.render();});assert((await page.evaluate(()=>labels())).includes(system==='zh-TW'?'夥伴':title));
  assert.deepEqual(errors,[]);console.log('PASS',system,'detection, main screens, 320px settings, switching/persistence/system, unchanged save');await context.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
