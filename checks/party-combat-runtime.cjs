const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=Date.now();
function ready(){const s=M.fresh(91,['fox','turtle','bud','otter','spark']);s.journey={version:1,stage:'done',hero:'ranger',starter:null,legacy:true};return M.syncStamina(s,T);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));
 await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.addInitScript(s=>localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s)),ready());
 await page.goto(cfg.url+'?battle=party-v1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
 await page.evaluate(async()=>{
  globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());
  globalThis.texts=(root=g.root)=>{const out=[];function walk(n){const l=n.getComponent(cc.Label);if(l)out.push(l.string);n.children.forEach(walk);}walk(root);return out;};
 });
 async function seed(s){await page.waitForFunction(()=>!g.busy);await page.evaluate(s=>{g.state=s;g.screen='game';g.render();},s);await page.waitForFunction(()=>!__pm.animating());}
 async function tap(id){const p=await page.evaluate(id=>__pm.controls()[id],id);assert(p,id);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(300);}
 let s=ready();s=M.selectActive(s,s.pets.find(p=>p.id==='otter').uid);s.enemy='spark';s.enemyRarity='normal';await seed(s);
 assert((await page.evaluate(()=>texts())).includes('↑ ×1.5'));assert((await page.evaluate(()=>texts())).includes('×1'));
 await tap('encounter-types');assert((await page.evaluate(()=>texts())).includes('敌方攻击'));
 await page.screenshot({path:'checks/party-types-390.png'});
 await tap('types-enemy');await tap('nav-home');assert((await page.evaluate(()=>texts())).includes('克制关系'));await tap('types-close');
 const before=await page.evaluate(()=>g.state.enemy);await tap('pet-'+s.reserve.uid);assert.equal(await page.evaluate(()=>g.state.enemy),before);
 s=ready();s.expedition=true;s=M.act(s,'challenge');s.enemyHP=s.enemyMax=99999;s.enemyAttack=9999;s.attack=1;
 const from=s.active.uid,next=s.reserve.uid;await seed(s);
 await page.evaluate(()=>{globalThis.lifeEvents=[];const original=g.lifeTo.bind(g);g.lifeTo=(key,ratio,total)=>{lifeEvents.push({key,ratio,total});return original(key,ratio,total);};});
 await tap('attack');await page.waitForFunction(()=>!g.busy);
 assert.equal(await page.evaluate(()=>g.state.active.uid),next);assert.equal(await page.evaluate(()=>g.state.phase),'battle');
 assert.equal(await page.evaluate(()=>g.root.children.some(n=>n.name.startsWith('battle-reserve-'))),false,'battle reserve HUD removed');
 assert((await page.evaluate(()=>lifeEvents)).some(e=>e.key==='player'&&e.ratio===0));
 assert.equal(await page.evaluate(uid=>JSON.parse(localStorage.getItem('pm.creature-dice.v1')).combatVitals[uid].hpRatio,from),0);
 await page.screenshot({path:'checks/party-relay-390.png'});
 for(let i=0;i<2;i++){await page.evaluate(()=>{g.state.enemyAttack=9999;g.state.enemyHP=g.state.enemyMax=99999;g.state.attack=1;g.render();});await page.waitForFunction(()=>!__pm.animating());await tap('attack');await page.waitForFunction(()=>!g.busy);}
 assert.equal(await page.evaluate(()=>g.state.phase),'lost');assert((await page.evaluate(()=>texts())).includes('失败结算'));
 s=ready();const parents=s.pets.filter(p=>p.uid!==s.active.uid).slice(0,2);parents[0].sex='female';parents[1].sex='male';s=M.restartRun(s,71);
 s=M.startBreeding(s,parents[0].uid,parents[1].uid,T-M.BREED_DURATION-1000);assert(s.breeding);
 await seed(s);await page.evaluate(T=>{g.trustedClock.now=()=>T;g.breedingUI();},T);await tap('breed-claim');
 assert((await page.evaluate(()=>texts())).includes('获得宠物蛋'));assert((await page.evaluate(()=>texts())).some(t=>t.includes('已放入蛋袋')));
 assert.equal(await page.evaluate(()=>g.state.eggs.length),1);assert.equal(await page.evaluate(()=>g.state.breeding),null);
 await page.screenshot({path:'checks/party-breed-390.png'});await tap('breed-egg-confirm');assert((await page.evaluate(()=>texts())).includes('孵化屋'));
 await page.setViewportSize({width:320,height:568});
 s=ready();s.hpRatio=0;s=M.selectActive(s,s.reserve.uid);await seed(s);assert((await page.evaluate(()=>texts())).includes('阵亡'));
 await page.screenshot({path:'checks/party-encounter-320.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS real UI: directional preview/help/back, independent switch, impact-zero then relay, two deaths then team loss, saved deaths, breeding egg receipt; 390/320 screenshots');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
