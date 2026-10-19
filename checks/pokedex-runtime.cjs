const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const base=M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(17),'ranger'),'fox'),Date.now());
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.addInitScript(s=>localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s)),base);
 await page.goto(cfg.url+'?dex-test=1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
 await page.evaluate(async()=>{const cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());globalThis.uiText=()=>{const text=[];function visit(n){const l=n.getComponent(cc.Label);if(l)text.push(l.string);n.children.forEach(visit);}visit(g.root);return text;};});
 async function tap(id){await page.waitForFunction(()=>!__pm.animating());const c=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(c,id);const k=page.viewportSize().width/390;await page.touchscreen.tap(c.x*k,c.y*k);await page.waitForTimeout(240);await page.waitForFunction(()=>!__pm.animating());}
 const cdp=await context.newCDPSession(page);
 async function swipe(){const y=await page.evaluate(()=>{function walk(n){if(n.name==='dex-swipe')return n;for(const c of n.children){const f=walk(c);if(f)return f;}}return g.h-walk(g.root).worldPosition.y;});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300-235*i/12,y}]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(450);}
 const petControls=()=>page.evaluate(()=>Object.keys(__pm.controls()).filter(k=>k.startsWith('dex-pet-')));
 await tap('start-game');await page.screenshot({path:'checks/dex-home-390.png'});const before=await page.evaluate(()=>JSON.stringify({pets:g.state.pets,team:g.state.team,eggs:g.state.eggs,active:g.state.active}));
 await tap('home-dex');await page.screenshot({path:'checks/dex-list-390.png'});
 let ids=[];for(let i=0;i<4;i++){ids.push(...await petControls());if(i<3)await swipe();}assert.equal(new Set(ids).size,36);
 await tap('dex-map-5');assert.equal((await petControls()).length,6);await tap('dex-pet-starwyrm');for(const r of ['normal','SR','SSR']){await tap('dex-form-'+r);assert.ok((await page.evaluate(()=>uiText())).some(t=>t.includes(M.petName({id:'starwyrm',rarity:r}))));}
 await page.screenshot({path:'checks/dex-detail-390.png'});await tap('nav-home');assert.equal((await petControls()).length,6);
 await tap('dex-map-all');await tap('dex-type');await tap('dex-type-1');assert.equal((await petControls()).length,2);await tap('dex-type');await tap('dex-type-0');await tap('dex-owned');assert.deepEqual(await petControls(),['dex-pet-fox']);
 await tap('nav-home');assert.equal(await page.evaluate(()=>__pm.screen()),'home');await tap('home-partners');let labels=await page.evaluate(()=>uiText());assert.ok(labels.includes('伙伴'));assert.ok(!labels.includes('伙伴图鉴'));assert.ok(await page.evaluate(()=>!!__pm.controls()['team-slot-0']));
 await tap('partner-filter');await tap('nav-home');assert.equal(await page.evaluate(()=>__pm.screen()),'partners');await tap('nav-home');
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);await tap('home-dex');await tap('dex-owned');await page.screenshot({path:'checks/dex-list-320.png'});await tap('dex-pet-fox');await tap('dex-form-SSR');await page.screenshot({path:'checks/dex-detail-320.png'});
 for(const id of ['dex-detail-back','dex-form-normal','dex-form-SR','dex-form-SSR']){const c=await page.evaluate(id=>__pm.controls()[id],id),h=568*390/320;assert.ok(c.x-c.w/2>=0&&c.x+c.w/2<=390&&c.y-c.h/2>=0&&c.y+c.h/2<=h,id);}
 const after=await page.evaluate(()=>JSON.stringify({pets:g.state.pets,team:g.state.team,eggs:g.state.eggs,active:g.state.active}));assert.equal(after,before);assert.deepEqual(errors,[]);
 console.log('PASS: camp entry; 36 series / 108 forms; map/type/owned filters; detail forms; partner title and return paths; 390/320 layout; no pet/team/egg mutation or JS errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

