const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
for(const name of ['PMTranslations','PMLocale','PMModel']){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:p=>modules[p.replace('./','')],Math,Date,JSON,Set,Map,RegExp});modules[name]=exports;}
const M=modules.PMModel,L=modules.PMLocale,T=Date.now();M.setTimeProvider(()=>T);
const ready=M.syncStamina(M.fresh(42,['fox','turtle','bud']),T);ready.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};ready.expedition=false;
const battle=M.act(ready,'challenge'),added=['hi','ar','ru','ur','bn','tr','fil','mr','te','ta'];
const systems=['zh-CN','en-US','ja-JP','ko-KR','zh-TW','th-TH','pt-BR','es-MX','id-ID','vi-VN','de-DE','fr-FR','hi-IN','ar-SA','ru-RU','ur-PK','bn-BD','tr-TR','fil-PH','mr-IN','te-IN','ta-IN','tl-PH','it-IT'];
const out=process.env.PM_LOCALE_NEW_ONLY?'checks/locale-expanded':'checks/locale-existing',results=[],layoutIssues=[];fs.mkdirSync(out,{recursive:true});
const saveReport=()=>fs.writeFileSync(out+'/report.json',JSON.stringify({results,layoutIssues},null,2));
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const system of systems){
  if(process.env.PM_LOCALE_SYSTEM&&system!==process.env.PM_LOCALE_SYSTEM)continue;
  const lang=L.resolveLocale(system);if(process.env.PM_LOCALE_NEW_ONLY&&!added.includes(lang))continue;if(!process.env.PM_LOCALE_NEW_ONLY&&!process.env.PM_LOCALE_SYSTEM&&added.includes(lang))continue;
  L.selectLanguage('system',system);const title=L.tr('伙伴');
  const context=await b.newContext({viewport:{width:390,height:844},locale:system,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));
  await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(s=>{if(!localStorage.getItem('pm.creature-dice.v1'))localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));},ready);
  async function idle(){await page.waitForTimeout(240);await page.waitForFunction(()=>!g.busy&&!g.pressPending&&!g.artCache.pending&&performance.now()-g.lastTap>=220);}
  async function boot(){await page.goto(cfg.url+'?locale=check');await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
   await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function find(n){const c=n.components.find(c=>typeof c.languageSettings==='function');return c||n.children.map(find).find(Boolean);}globalThis.g=find(cc.director.getScene());g.clockSaveAt=Infinity;
    globalThis.nodeByName=(name,n=g.root)=>n.name===name?n:n.children.map(c=>nodeByName(name,c)).find(Boolean);
    globalThis.labels=()=>{const all=[];function walk(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l)all.push(l.string);n.children.forEach(walk);}walk(g.root);return all;};
    globalThis.labelMetrics=()=>{const all=[],size=cc.view.getVisibleSize();const rect=n=>{const t=n.getComponent(cc.UITransform),p=n.worldPosition,s=n.worldScale,w=t.width*Math.abs(s.x),h=t.height*Math.abs(s.y);return {x:p.x-w*t.anchorX,y:p.y-h*t.anchorY,w,h};};
     function walk(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l&&l.string){const r=rect(n);let v={x:Math.max(0,r.x),y:Math.max(0,r.y),right:Math.min(size.width,r.x+r.w),top:Math.min(size.height,r.y+r.h)},masked=false,alpha=l.color.a;
      for(let p=n.parent;p;p=p.parent){const op=p.getComponent(cc.UIOpacity);if(op)alpha*=op.opacity/255;if(p.getComponent(cc.Mask)){masked=true;const m=rect(p);v.x=Math.max(v.x,m.x);v.y=Math.max(v.y,m.y);v.right=Math.min(v.right,m.x+m.w);v.top=Math.min(v.top,m.y+m.h);}}
      if(alpha>8&&v.right>v.x&&v.top>v.y){const actual=l.actualFontSize||l.fontSize;all.push({text:l.string,font:l.fontSize,actual,screenPx:actual*n.worldScale.y*innerWidth/390,bounds:r,masked,small:l.fontSize>=16&&actual<Math.min(11,l.fontSize*.6),outside:!masked&&l.fontSize>=14&&(r.x< -1||r.x+r.w>size.width+1||r.y< -1||r.y+r.h>size.height+1)});}}
      n.children.forEach(walk);}walk(g.root);return all;};
   });await idle();
  }
  async function tap(id){await idle();const c=await page.evaluate(id=>__pm.controls()[id],id);assert(c,id);const k=page.viewportSize().width/390;await page.touchscreen.tap(c.x*k,c.y*k);await idle();}
  async function inspect(screen,screenshot=false){await idle();const text=await page.evaluate(()=>labels());if(!['zh-CN','zh-TW','ja'].includes(lang))assert(!/[\u3400-\u9fff]/.test(text.join('\n')),system+' '+screen+': '+text.filter(t=>/[\u3400-\u9fff]/.test(t)).join('|'));
   const metrics=await page.evaluate(()=>labelMetrics()),entry={system,lang,screen,width:page.viewportSize().width,metrics};
   for(const m of metrics)if(m.small||m.outside)layoutIssues.push({system,screen,width:entry.width,...m});
   if(screenshot){entry.screenshot=out+'/'+system+'-'+screen+'-'+entry.width+'.png';await page.screenshot({path:entry.screenshot});}results.push(entry);saveReport();return text;
  }
  async function route(screen){await page.evaluate(({screen,s})=>{g.state=s;g.screen='home';g.render();if(['home','adventure','partners','game'].includes(screen)){g.screen=screen;g.render();}else g[screen]();},{screen,s:JSON.parse(JSON.stringify(screen==='game'?battle:ready))});await idle();}
  async function languageIntoView(id){await page.evaluate(id=>{const row=nodeByName('language-'+id),scroll=nodeByName('language-scroll').getComponent(cc.ScrollView);if(!row)throw Error('Missing language '+id);const h=scroll.node.getComponent(cc.UITransform).height,max=scroll.getMaxScrollOffset().y,offset=Math.max(0,Math.min(max,-row.position.y-h/2));scroll.scrollToPercentVertical(max?1-offset/max:1,0);},id);await idle();
   // Use the row's current position, because the content has scrolled.
   const p=await page.evaluate(id=>{const n=nodeByName('language-'+id);return {x:n.worldPosition.x,y:cc.view.getVisibleSize().height-n.worldPosition.y};},id);const k=page.viewportSize().width/390;await page.touchscreen.tap(p.x*k,p.y*k);await idle();
  }
  await boot();await page.screenshot({path:'checks/locale-'+lang+'-cover.png'});
  for(const screen of ['home','adventure','partners','game','pokedexUI','hatchery','breedingUI','socialUI','encounterTypesUI']){await route(screen);const text=await inspect(screen,screen==='home'||screen==='game');if(screen==='home')assert(text.includes(title),system+' home title');}
  await page.setViewportSize({width:320,height:568});await idle();
  if(added.includes(lang))for(const screen of ['home','adventure','partners','game','hatchery','breedingUI','socialUI']){await route(screen);await inspect(screen,true);}
  await route('home');await page.evaluate(()=>g.homeSettings());await idle();
  const before=await page.evaluate(()=>JSON.stringify(g.state));await page.screenshot({path:'checks/locale-'+lang+'-settings-320.png'});
  await tap('settings-language');await page.screenshot({path:'checks/locale-'+lang+'-picker-320.png'});
  const picker=await page.evaluate(()=>Object.entries(__pm.controls()).filter(([key])=>key.startsWith('language-')));assert.equal(picker.length,24,'23 choices and back');
  for(const [id,r] of picker)assert(r.x-r.w/2>=-1&&r.x+r.w/2<=391,id+' horizontal bounds');
  const menuMetrics=await page.evaluate(()=>labelMetrics());assert(menuMetrics.every(m=>!m.small&&!m.outside),system+' language menu text bounds');
  await languageIntoView(lang);assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),lang,'select current localized choice');
  const selectedVisible=await page.evaluate(lang=>{const row=nodeByName('language-'+lang),view=nodeByName('language-scroll'),half=row.getComponent(cc.UITransform).height/2,h=view.getComponent(cc.UITransform).height/2;return row.worldPosition.y-half>=view.worldPosition.y-h-1&&row.worldPosition.y+half<=view.worldPosition.y+h+1;},lang);assert(selectedVisible,'selected choice must remain visible');
  await languageIntoView('en');assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),'en');await tap('language-back');assert((await page.evaluate(()=>labels())).includes('Settings'));
  assert.equal(await page.evaluate(()=>JSON.stringify(g.state)),before,'language must not alter game state');
  await boot();await route('home');assert((await page.evaluate(()=>labels())).includes('Pets'),'manual choice survives restart');
  await page.evaluate(()=>g.languageSettings());await idle();await languageIntoView('system');assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),'system');await tap('language-back');await route('home');assert((await page.evaluate(()=>labels())).includes(title));
  assert.deepEqual(errors,[]);console.log('PASS',system,'detection, main screens, scrollable settings, persistence/system and unchanged save');await context.close();
 }
 saveReport();assert.equal(layoutIssues.length,0,'Layout issues: '+JSON.stringify(layoutIssues.slice(0,12))+'; see '+out+'/report.json');
}finally{saveReport();await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
