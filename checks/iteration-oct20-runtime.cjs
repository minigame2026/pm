const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=Date.now(),ready=()=>M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(411),'ranger'),'fox'),T);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));
 await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.addInitScript(s=>localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s)),ready());
 await page.goto(cfg.url+'?iteration=oct20');
 await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
 await page.evaluate(async()=>{
  globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());
  globalThis.texts=()=>{const out=[];function walk(n){const l=n.getComponent(cc.Label);if(l)out.push(l.string);n.children.forEach(walk);}walk(g.root);return out;};
 });
 async function seed(s,screen='game'){await page.waitForFunction(()=>!g.busy);await page.evaluate(({s,screen})=>{g.state=s;g.screen=screen;g.render();},{s,screen});await page.waitForFunction(()=>!__pm.animating());}
 async function tap(id){const p=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(p,id);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(350);}
 let s=ready();s.clearedMaps=[0,1,2];await seed(s,'home');await tap('home-explore');
 assert.equal(await page.evaluate(()=>g.mapIndex),3);
 let text=await page.evaluate(()=>texts());assert.ok(!text.some(t=>t.includes('发现伙伴')||t.includes('通关上一地图解锁')));assert.ok(text.includes('10 层'));
 await page.screenshot({path:'checks/iteration-map.png'});
 await page.evaluate(()=>g.pokedexUI());let keys=await page.evaluate(()=>Object.keys(__pm.controls()));
 assert.ok(keys.includes('dex-pet-fox-normal')&&keys.includes('dex-pet-fox-SR')&&keys.includes('dex-pet-fox-SSR'));
 text=await page.evaluate(()=>texts());assert.ok(text.includes('1 / 18'));assert.ok(!text.includes('1/3'));
 await page.screenshot({path:'checks/iteration-dex.png'});
 await tap('dex-pet-fox-SR');assert.ok((await page.evaluate(()=>texts())).some(t=>t.includes('焰鬃狐')));assert.ok(!(await page.evaluate(()=>Object.keys(__pm.controls()))).some(k=>k.startsWith('dex-form-')));
 s=M.act(M.enterExpedition(ready(),0,T),'challenge');s.enemyMax=s.enemyHP=100;s.enemyAttack=5;s.hpRatio=.8;
 await seed(s);
 await page.evaluate(()=>{
  globalThis.events=[];const hurt=g.hurt.bind(g),life=g.lifeTo.bind(g);
  g.hurt=(n,...args)=>{events.push({type:'hit',who:n===g.playerNode?'player':'enemy',hp:g.meters.player.label.string});return hurt(n,...args);};
  g.lifeTo=(key,...args)=>{events.push({type:'life',who:key,hp:g.meters.player.label.string});return life(key,...args);};
 });
 const oldHP=await page.evaluate(()=>g.meters.player.label.string);
 await page.evaluate(()=>g.command('attack'));
 await page.waitForFunction(()=>events.some(e=>e.type==='hit'&&e.who==='enemy'));
 const early=await page.evaluate(()=>({events:events.slice(),hp:g.meters.player.label.string}));
 assert.equal(early.hp,oldHP);assert.ok(!early.events.some(e=>e.type==='life'&&e.who==='player'));
 assert.ok((await page.evaluate(()=>texts())).includes('抢先一击 +2'));
 await page.waitForFunction(()=>!g.busy);
 const ev=await page.evaluate(()=>events),enemyHit=ev.findIndex(e=>e.type==='hit'&&e.who==='player'),hpChange=ev.findIndex(e=>e.type==='life'&&e.who==='player');
 assert.ok(enemyHit>=0&&hpChange>enemyHit);
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('pm.creature-dice.v1')).hpRatio)),M.act(s,'attack').hpRatio);
 await page.screenshot({path:'checks/iteration-battle.png'});
 s=ready();s.stamina={value:20,updatedAt:T};await seed(s,'home');
 await page.evaluate(T=>{g.trustedClock.now=()=>T+30000;g.refreshStaminaHUD();},T);
 assert.equal(await page.evaluate(()=>g.staminaCountdown.string),'01:30');
 for(let seedNo=1;seedNo<200;seedNo++){
  let b=M.chooseStarter(M.chooseHero(M.newJourney(seedNo),'ranger'),'fox');b.step=5;b.phase='nest';b.eggHunt={limit:2,candidates:[],selected:-1};b=M.act(b,'eggSearch');
  if(M.act(b,'eggTake').eggs.length===2){await seed(b);await page.evaluate(()=>g.command('eggTake'));break;}
 }
 assert.equal(await page.evaluate(()=>g.state.eggs.length),2);
 assert.ok((await page.evaluate(()=>texts())).includes('寻蛋好手 · 额外带回一枚！'));
 await page.screenshot({path:'checks/iteration-bonus-egg.png'});
 await page.setViewportSize({width:320,height:568});await page.evaluate(()=>g.pokedexUI());await page.waitForTimeout(500);await page.screenshot({path:'checks/iteration-dex-320.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS latest unlocked map, clean labels, 162 independent entries, impact-timed HP, visible first-hit/ranger effects, next-point countdown, 390/320 layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
