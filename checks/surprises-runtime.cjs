const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const T=Date.now(),copy=x=>JSON.parse(JSON.stringify(x));
function base(){let s=M.fresh(91,['fox','otter','bud']);s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s=M.syncStamina(s,T);s.expedition=true;return s;}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [390,320]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:568},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());await page.addInitScript(()=>localStorage.setItem('pm.language.v1','zh-CN'));
  await page.goto(cfg.url+'?surprises=v1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  const bind=()=>page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());globalThis.nodes=()=>{const out=[];function walk(n){out.push(n);n.children.forEach(walk);}walk(g.root);return out;};globalThis.texts=()=>nodes().map(n=>n.getComponent(cc.Label)?.string).filter(Boolean);});await bind();
  async function seed(s,method){await page.waitForFunction(()=>!g.busy&&!g.pressPending);await page.evaluate(async({s,method})=>{if(g.modal){g.modal.destroy();g.modal=null;}g.state=s;g.screen='game';await g.save();g.render();if(method)g[method]();},{s,method});await page.waitForTimeout(500);await page.waitForFunction(()=>!g.artCache.pending);}
  async function tap(id){await page.waitForFunction(()=>!g.busy&&!g.pressPending&&performance.now()-g.lastTap>=200);const p=await page.evaluate(id=>__pm.controls()[id],id);assert(p,id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await page.waitForTimeout(300);await page.waitForFunction(()=>!g.busy&&!g.pressPending);}
  for(const kind of ['giant','mirror','ward']){
   let s=base();s.enemyVariant={kind,revealed:false,shield:0};await seed(s);assert(await page.evaluate(()=>nodes().some(n=>n.name==='mysterious-enemy')));
   if(kind==='giant')await page.screenshot({path:`checks/surprise-mystery-${width}.png`});
   await tap('challenge');assert.equal(await page.evaluate(()=>g.state.enemyVariant.revealed),true);
   s=await page.evaluate(()=>g.state);s.goldDie=kind==='giant'?'strike':kind==='mirror'?'heal':'shield';await seed(s);
   assert(await page.evaluate(()=>nodes().some(n=>n.name==='gold-die-halo')));assert(await page.evaluate(()=>nodes().some(n=>n.name==='variant-badge')));
   await page.screenshot({path:`checks/surprise-battle-${kind}-${width}.png`});
   const snapshot=copy(s);await page.reload();await page.waitForFunction(()=>globalThis.__pm?.ready);await bind();await tap('start-game');assert.deepEqual(copy(await page.evaluate(()=>g.state.enemyVariant)),snapshot.enemyVariant);assert.equal(await page.evaluate(()=>g.state.goldDie),snapshot.goldDie);
  }
  let s=base();s.expedition=false;s.eggs=[{id:'surprise-source',affinity:M.MAPS[0].pets[0],rarity:'SSR',stage:5,mapId:0}];s.surprises={seed:1972,misses:{shiny:0,nested:24},recipes:['steam']};s=M.startIncubation(s,s.eggs[0].id,0,T);s=M.claimHatch(s,0,s.incubators[0].readyAt);s.pets.at(-1).ornament='steam';await seed(s,'hatchReveal');
  await page.waitForTimeout(550);assert((await page.evaluate(()=>texts())).includes('闪光伙伴'));assert(await page.evaluate(()=>nodes().some(n=>n.name==='nested-egg')));assert(await page.evaluate(()=>nodes().filter(n=>n.name==='pet-cosmetic').length>0));await page.screenshot({path:`checks/surprise-hatch-${width}.png`});
  const count=s.pets.length,eggCount=s.eggs.length;await tap('hatch-ack');assert.equal(await page.evaluate(()=>g.state.pets.length),count);assert.equal(await page.evaluate(()=>g.state.eggs.length),eggCount);
  await page.evaluate(()=>g.breedingUI());await tap('breed-recipes');assert((await page.evaluate(()=>texts())).includes('蒸汽之约'));assert((await page.evaluate(()=>texts())).includes('?'));await page.screenshot({path:`checks/surprise-recipes-${width}.png`});for(let pageIndex=0;pageIndex<3;pageIndex++){
    const cards=await page.evaluate(()=>nodes().filter(n=>n.name.startsWith('recipe-')).map(n=>{const r=n.getComponent(cc.UITransform).getBoundingBoxToWorld();return {name:n.name,y:r.y,h:r.height};}));
    assert.deepEqual(cards.map(c=>c.name),copy(M.SECRET_RECIPES.slice(pageIndex*3,pageIndex*3+3).map(r=>'recipe-'+r.id)));
    assert.equal(cards.length,3);for(let i=1;i<3;i++)assert(cards[i].y+cards[i].h<cards[i-1].y,'recipe cards do not overlap');assert(cards[2].y>40,'recipe cards clear footer');
    await page.screenshot({path:`checks/surprise-recipes-${width}-page${pageIndex+1}.png`});if(pageIndex<2)await tap('recipes-next');
  }
  await tap('recipes-prev');await tap('recipes-prev');
  await tap('nav-home');assert((await page.evaluate(()=>texts())).includes('交配屋'));
  await page.evaluate(()=>g.breedingEggResult({id:'preview',rarity:'SSR',affinity:'fox',stage:0,genes:{id:'fox',rarity:'SSR',baseHP:30,baseFaces:[1,3,7],skills:['res_bloom','barrier'],ornament:'steam'}}));await page.screenshot({path:`checks/surprise-breed-result-${width}.png`});assert((await page.evaluate(()=>texts())).some(t=>t.includes('技能共鸣')));
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS 390/320 mystery reveal, gold die, 3 variants, battle reload, shiny/bonus hatch, acknowledgement once, recipe book and breeding result; isolated saves');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
