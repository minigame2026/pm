const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const NOW=Date.now(),out='checks/pc-pet-animation';M.setTimeProvider(()=>NOW);fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
let state=M.chooseStarter(M.chooseHero(M.newJourney(324),'ranger'),'fox');state=M.syncStamina(state,NOW);state=M.act(M.enterExpedition(state,0),'challenge');state.enemyHP=40;state.enemyMax=40;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:out+'/video',size:{width:1280,height:720}}});
 await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(NOW).toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
 await ctx.addInitScript(s=>localStorage.setItem('pm.pc.creature-dice.v1',JSON.stringify(s)),state);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto('http://127.0.0.1:8781/');await p.waitForFunction(()=>globalThis.__pmPC?.ready);
 await p.evaluate(async s=>{globalThis.cc=await System.import('cc');function find(n){const g=n.components.find(c=>typeof c.battleActors==='function');if(g)return g;for(const child of n.children){const g=find(child);if(g)return g;}}globalThis.g=find(cc.director.getScene());g.state=s;g.show('battle');},state);
 await p.waitForTimeout(600);await p.mouse.click(960,490);
 assert.equal(await p.evaluate(()=>g.player.components.some(c=>typeof c.strike==='function')),true,'battle pets need the new shared motion controller');
 // Capture the presentation every frame, independent of model already resolving the command.
 await p.evaluate(()=>{globalThis.frames=[];globalThis.recording=true;const start=performance.now();const step=()=>{const motion=g.player?.components.find(c=>typeof c.strike==='function');frames.push({t:performance.now()-start,hp:g.enemyHP?.string,playerHP:g.playerHP?.string,x:g.player?.position.x,y:g.player?.position.y,angle:g.player?.eulerAngles.z,shadowX:motion?.shadow?.position.x,shadowY:motion?.shadow?.position.y,busy:__pmPC.busy(),revision:g.state.revision});if(recording)requestAnimationFrame(step);};requestAnimationFrame(step);});
 const before=await p.evaluate(()=>({hp:g.enemyHP.string,revision:g.state.revision,home:g.player.position.clone()}));
 await p.keyboard.press('1');await p.keyboard.press('2');await p.keyboard.press('1');await p.waitForFunction(()=>!__pmPC.busy());await p.waitForTimeout(220);
 const data=await p.evaluate(()=>{recording=false;return{frames,revision:g.state.revision,home:g.player?.position.clone(),state:__pmPC.snapshot()};});
 assert.equal(data.revision,before.revision+1,'overlapping shortcuts accept exactly one command');
 const accepted=data.frames.find(f=>f.revision>before.revision),hit=data.frames.find(f=>f.hp!==before.hp),unlocked=data.frames.find(f=>accepted&&f.t>accepted.t&&!f.busy);
 assert(accepted&&hit&&unlocked,'actual acceptance, contact and unlock observed');assert(hit.t-accepted.t>=110,'HP cannot jump before anticipation and contact');assert(unlocked.t>=hit.t,'input stays blocked through contact');
 assert(data.frames.some(f=>f.x<before.home.x-3),'anticipation shifts opposite attack direction');assert(data.frames.some(f=>f.x>before.home.x+45),'attack has readable travel');assert(Math.abs(data.home.x-before.home.x)<.01&&Math.abs(data.home.y-before.home.y)<.01,'feet return to their original slot');
 const forward=data.frames.filter(f=>f.x>before.home.x+45);assert(forward.every(f=>Math.abs(f.shadowX-f.x)<.01&&Math.abs(f.shadowY-before.home.y)<.01),'ground shadow follows forward movement without floating');assert(forward.some(f=>f.angle<0),'forward strike leans toward its target, not away');
 await p.screenshot({path:out+'/mainline-1080.png'});results.push({name:'mainline contact, stable feet, keyboard barrier',acceptMs:accepted.t,contactMs:hit.t,unlockMs:unlocked.t});
 // Fast/reduced presentation must produce the exact same production rule result.
 const expected=M.act(state,'attack');for(const mode of ['fast','reduced']){await p.evaluate(({s,mode})=>{g.state=s;g.fast=mode==='fast';g.reduced=mode==='reduced';g.show('battle');},{s:state,mode});await p.waitForTimeout(100);await p.keyboard.press('1');await p.waitForFunction(()=>!__pmPC.busy());const actual=await p.evaluate(()=>__pmPC.snapshot());for(const k of ['seed','revision','enemyHP','hpRatio','phase','potions','boosts'])assert.deepEqual(actual[k],expected[k],mode+' preserves '+k);}
 results.push({name:'fast and reduced modes preserve exact rule outcomes'});
 // Every species uses the controller; non-starters retain existing shiny material and alpha.
 await p.evaluate(()=>{g.reduced=false;g.fast=false;});
 for(const id of ['dragon','fox','otter','bud']){await p.evaluate(id=>{const actor=g.battleActor(g.battleRoot,{id,faces:[1,2,3,4,5,6],shiny:true},800,550,290,'front');globalThis.testActor=actor;},id);await p.waitForTimeout(150);assert(await p.evaluate(()=>testActor.components.some(c=>typeof c.strike==='function')));await p.evaluate(()=>testActor.destroy());}
 results.push({name:'starter poses and non-starter shiny actors share animation safely'});
 // Re-enter a scene while effects are alive: no orphan nodes/callbacks or old actor mutations.
 for(let i=0;i<8;i++){await p.evaluate(s=>{g.state=s;g.show('battle');g.command('attack');},state);await p.waitForFunction(()=>!__pmPC.busy());await p.evaluate(()=>g.show('home'));}
 await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>{let n=0;const walk=a=>{if(a.name.startsWith('pc-combat-fx'))n++;a.children.forEach(walk);};walk(cc.director.getScene());return n;}),0,'no effects survive leaving battle');
 results.push({name:'repeated scene exit cleans animation effects'});
 assert.equal(errors.length,0,errors.join('\n'));await ctx.close();fs.writeFileSync(out+'/report.json',JSON.stringify({results,errors,checkedAt:new Date().toISOString(),platform:'Cocos web-desktop, Edge; isolated fixture'},null,2));console.log(JSON.stringify({passed:results.length,results}));
 }finally{await browser.close();}})().catch(e=>{fs.writeFileSync(out+'/failure.txt',String(e.stack));console.error(e);process.exitCode=1;});
