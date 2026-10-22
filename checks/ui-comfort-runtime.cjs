/* UI input regression, using isolated browser profiles and a fixed trusted clock. */
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const now=Date.now(),out='checks/ui-comfort-core';fs.mkdirSync(out,{recursive:true});M.setTimeProvider(()=>now);
let base=M.fresh(91,['fox','bud','otter']);base.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};base.expedition=false;base.clearedMaps=[0,1,2];base=M.syncStamina(base,now);
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,lang] of [[390,844,'zh-CN'],[320,568,'de']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await p.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);await p.goto(cfg.url+'?ui=comfort');await p.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
  await p.evaluate(async()=>{globalThis.cc=await System.import('cc');function find(n){const g=n.components.find(c=>typeof c.confirmRetreat==='function');if(g)return g;for(const c of n.children){const g=find(c);if(g)return g;}}globalThis.g=find(cc.director.getScene());});
  const idle=async()=>{await p.waitForFunction(()=>!g.artCache.pending&&!g.busy&&!g.pressPending);await p.waitForTimeout(240);};
  const tap=async id=>{await idle();const c=await p.evaluate(id=>__pm.controls()[id],id);assert(c,'control '+id);await p.touchscreen.tap(c.x*width/390,c.y*width/390);await idle();};
  const show=async(screen,state=base)=>{await p.evaluate(({screen,state})=>{g.state=state;g.screen=screen;g.render();},{screen,state});await idle();};
  await show('home');const targets=await p.evaluate(()=>['home-settings','stamina-ad'].map(id=>__pm.controls()[id]));for(const c of targets){assert(c.w*width/390>=47.9);assert(c.h*width/390>=47.9);}
  // Tap in the invisible margin, outside the visible settings button.
  const edge=await p.evaluate(()=>{const n=g.root.getChildByName('home-settings'),u=n.getComponent(cc.UITransform);return {x:n.worldPosition.x,y:cc.view.getVisibleSize().height-n.worldPosition.y+u.height/2+2};});
  await p.touchscreen.tap(edge.x*width/390,edge.y*width/390);await idle();assert(await p.evaluate(()=>!!__pm.controls()['settings-close']),'margin is genuinely clickable');
  await tap('settings-close');assert.equal(await p.evaluate(()=>g.screen),'home');
  await show('adventure');for(const i of [0,4,5,8]){await tap('map-'+i);assert.equal(await p.evaluate(()=>g.mapIndex),i,'adjacent map tabs keep their own hits');}
  await p.screenshot({path:`${out}/${width}-${lang}-map.png`});
  let encounter=M.enterExpedition(JSON.parse(JSON.stringify(base)),0);await show('game',encounter);
  const snapshot=await p.evaluate(()=>JSON.stringify(g.state));await tap('retreat');assert(await p.evaluate(()=>!!__pm.controls()['retreat-confirm']));assert.equal(await p.evaluate(()=>g.screen),'game');
  await p.screenshot({path:`${out}/${width}-${lang}-retreat.png`});await tap('retreat-cancel');assert.equal(await p.evaluate(()=>JSON.stringify(g.state)),snapshot,'cancel leaves run and stamina untouched');
  await tap('encounter-types');await p.screenshot({path:`${out}/${width}-${lang}-types.png`});await tap('types-close');
  await tap('retreat');await tap('retreat-confirm');assert.equal(await p.evaluate(()=>g.screen),'home');assert.equal(await p.evaluate(()=>!!g.state.expedition),false);assert.equal(await p.evaluate(()=>g.state.stamina.value),encounter.stamina.value,'retreat does not refund energy');
  const battle=M.act(encounter,'challenge');await show('game',battle);
  const captions=await p.evaluate(()=>{const a=[];function walk(n){const l=n.getComponent(cc.Label);if(l)a.push(l.string);n.children.forEach(walk);}walk(g.root);return a;});assert(!captions.some(v=>v.includes('PM v0.12')),'no debug footer');
  await p.screenshot({path:`${out}/${width}-${lang}-battle.png`});assert.deepEqual(errors,[]);console.log(`PASS ${width} ${lang}: actual enlarged hit, map selection, safe retreat/cancel, type buttons, battle footer`);await ctx.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
