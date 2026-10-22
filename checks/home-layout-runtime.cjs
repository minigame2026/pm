const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const lower=['home-partners','home-hatch','home-breed','home-social','home-dex'],buttons=['home-explore','home-gym',...lower],now=Date.now();
M.setTimeProvider(()=>now);
let base=M.chooseHero(M.prepareJourney(M.fresh(73,['fox','bud','otter'])),'ranger');base.expedition=false;base.stamina={value:30,updatedAt:now};
const copy=x=>JSON.parse(JSON.stringify(x)),overlaps=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,lang] of [[390,844,'zh-CN'],[320,568,'zh-CN'],[450,650,'zh-CN'],[320,568,'en'],[450,650,'de']]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);await page.goto(cfg.url+'?home-layout=1');await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
  await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const found=n.components.find(c=>typeof c.homeUI==='function');if(found)return found;for(const child of n.children){const found=walk(child);if(found)return found;}}globalThis.g=walk(cc.director.getScene());});
  const showHome=async state=>{await page.evaluate(s=>{g.state=s;g.screen='home';g.render();},state);await page.waitForFunction(()=>!__pm.animating());await page.waitForTimeout(220);};
  const tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const p=await page.evaluate(id=>__pm.controls()[id],id);assert(p,'missing control '+id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await page.waitForTimeout(220);await page.waitForFunction(()=>!__pm.animating());};
  await showHome(base);
  const layout=await page.evaluate(ids=>{
   function find(name,n=g.root){if(n.name===name)return n;for(const child of n.children){const hit=find(name,child);if(hit)return hit;}return null;}
   function rect(n){if(!n)return null;const ui=n.getComponent(cc.UITransform),r=ui.getBoundingBoxToWorld();return {x:r.x,y:r.y,w:r.width,h:r.height,width:ui.width,height:ui.height};}
   function titles(n){const list=[];function walk(n){const label=n.getComponent(cc.Label);if(label&&/\p{L}/u.test(label.string))list.push({text:label.string,box:rect(n)});n.children.forEach(walk);}walk(n);return list;}
   return {menu:rect(find('home-menu')),pet:rect(find('home-pet')),buttons:ids.map(id=>({id,...rect(find(id)),control:__pm.controls()[id],titles:titles(find(id))})),badges:['home-hatch-badge','home-breed-badge'].filter(id=>find(id)?.activeInHierarchy),size:{w:cc.view.getVisibleSize().width,h:cc.view.getVisibleSize().height}};
  },buttons);
  const label=`${width}x${height} ${lang}`;assert(layout.menu,label+' named menu');assert(layout.pet,label+' named central pet');assert.equal(layout.menu.height,174,label+' compact menu height');assert.equal(layout.badges.length,0,label+' no idle badges');
  assert(!overlaps(layout.pet,layout.menu),label+' pet clears menu');assert(layout.pet.y>=layout.menu.y+layout.menu.h-1,label+' pet is above menu');
  const inside=(a,b)=>a.x>=b.x-1&&a.y>=b.y-1&&a.x+a.w<=b.x+b.w+1&&a.y+a.h<=b.y+b.h+1,viewport={x:0,y:0,w:layout.size.w,h:layout.size.h};
  assert(inside(layout.menu,viewport),label+' menu fits viewport');assert(inside(layout.pet,viewport),label+' pet fits viewport');
  for(const b of layout.buttons){
   assert(b.control,label+' clickable '+b.id);assert(inside(b,layout.menu),label+' button inside menu '+b.id);
   assert(b.control.w*width/390>=44&&b.control.h*width/390>=44,label+' effective touch area '+b.id);
   if(lower.includes(b.id)){assert.equal(b.width,64,label+' lower button width');assert.equal(b.height,72,label+' lower button height');}
   assert.equal(b.titles.length,1,label+' one title without persistent subtitle '+b.id);
   assert(inside(b.titles[0].box,b),label+' title box inside '+b.id);assert(!/[\r\n]/.test(b.titles[0].text),label+' one-line title '+b.id);
   if(lang!=='zh-CN')assert(!/[\u3400-\u9fff]/.test(b.titles[0].text),label+' title translated '+b.id);
  }
  for(let i=0;i<layout.buttons.length;i++)for(let j=i+1;j<layout.buttons.length;j++)assert(!overlaps(layout.buttons[i],layout.buttons[j]),label+' button overlap');
  const [explore,gym,...small]=layout.buttons;assert(explore.x<gym.x&&Math.abs(explore.y-gym.y)<1,label+' explore left / gym right');for(let i=0;i<small.length;i++){assert(small[i].y+small[i].h<=explore.y+1,label+' small row below main');assert(Math.abs(small[i].y-small[0].y)<1,label+' one secondary row');if(i)assert(small[i].x>small[i-1].x,label+' small buttons retain order');}
  await page.screenshot({path:`checks/home-layout-${width}x${height}-${lang}.png`});
  for(const [id,screen,control] of [['home-explore','adventure','adventure-go'],['home-gym','utility','gym-0'],['home-partners','partners','team-slot-0'],['home-hatch','utility','hatch-slot-0'],['home-breed','utility','breed-start'],['home-social','utility','social-tab-share'],['home-dex','utility','dex-type']]){
   await showHome(base);await tap(id);const result=await page.evaluate(()=>({screen:__pm.screen(),controls:__pm.controls(),state:__pm.snapshot()}));
   assert.equal(result.screen,screen,label+' destination '+id);assert(result.controls[control],label+' destination control '+control);assert.equal(result.state.stamina.value,30,label+' browsing never spends stamina');assert.equal(result.state.expedition,false,label+' browsing never starts expedition');assert.equal(result.state.gymRun,undefined,label+' browsing never starts gym');
  }
  if(width===320&&lang==='zh-CN'){
   let pending=copy(base);pending.eggs=[{id:'home-layout-egg',rarity:'normal',affinity:'bud',stage:5,mapId:0}];pending=M.startIncubation(pending,'home-layout-egg',0,now);
   const parents=pending.pets.filter(p=>p.uid!==pending.active.uid).slice(0,2);parents[0].sex='female';parents[1].sex='male';pending=M.startBreeding(pending,parents[0].uid,parents[1].uid,now);assert(pending.breeding&&pending.incubators[0],'valid in-progress fixtures');
   const badges=()=>page.evaluate(()=>{const found=[];function walk(n){if(n.activeInHierarchy&&['home-hatch-badge','home-breed-badge'].includes(n.name))found.push(n.name);n.children.forEach(walk);}walk(g.root);return found.sort();});
   await showHome(pending);assert.deepEqual(await badges(),[],'unfinished tasks have no badges');pending.incubators[0].startedAt=now-3600000;pending.incubators[0].readyAt=now-1000;pending.breeding.startedAt=now-3600000;pending.breeding.readyAt=now-1000;
   await showHome(pending);assert.deepEqual(await badges(),['home-breed-badge','home-hatch-badge'],'ready tasks show only their badges');await page.screenshot({path:'checks/home-layout-ready-320x568.png'});
  }
  assert.deepEqual(errors,[],label+' browser errors');await context.close();console.log('PASS '+label+' compact menu, bounds, titles and seven real entry clicks');
 }
 console.log('PASS home layout: isolated saves; three viewports; Chinese, English and German; 174px menu; seven usable entries; ready-only badges; no stamina spent.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
