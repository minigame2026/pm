/* 15-map mobile / PC navigation. Run after matching builds: default mobile; --pc-only or --both. */
const fs=require('fs'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const out='checks/regions-13-15-ui';fs.mkdirSync(out,{recursive:true});
async function mobile(){const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,lang] of [[390,650,'zh-CN'],[320,568,'en'],[390,844,'zh-CN'],[320,568,'ta']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
  await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.adventureUI==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());g.clockSaveAt=Infinity;
   globalThis.findNode=(id,n=g.root)=>n.name===id?n:n.children.map(c=>findNode(id,c)).find(Boolean);
   globalThis.rect=n=>{const t=n.getComponent(cc.UITransform),p=n.worldPosition,s=n.worldScale,w=t.width*Math.abs(s.x),h=t.height*Math.abs(s.y);return {name:n.name,x:p.x-w*t.anchorX,y:p.y-h*t.anchorY,w,h};};
   g.screen='adventure';g.render();});
  const idle=async()=>{await page.waitForFunction(()=>!g.artCache.pending&&!g.pressPending&&!g.busy);await page.waitForTimeout(240);};
  const tap=async id=>{await idle();const c=await page.evaluate(id=>__pm.controls()[id],id);assert(c,'missing '+id);await page.touchscreen.tap(c.x*width/390,c.y*width/390);await idle();};
  const nonOverlapping=(boxes,where)=>{for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j],dx=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),dy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);assert(!(dx>1&&dy>1),`${width}x${height} ${lang} ${where}: ${a.name} overlaps ${b.name}`);}};
  const checkTabs=async prefix=>{const tabs=await page.evaluate(prefix=>Array.from({length:15},(_,i)=>{const n=findNode(prefix+'-'+i);return n?rect(n):null;}),prefix);assert(tabs.every(Boolean),prefix+' has all fifteen maps');const rows=new Map();for(const r of tabs){const key=Math.round(r.y);rows.set(key,(rows.get(key)||0)+1);assert(r.x>=0&&r.x+r.w<=390);}assert.deepEqual([...rows.values()],[5,5,5],prefix+' is fixed three rows of five');nonOverlapping(tabs,prefix);return tabs;};
  await idle();await checkTabs('map');assert((await page.evaluate(()=>Array.from({length:15},(_,i)=>g.sceneRegion(i)))).every(n=>Number.isInteger(n)&&n>=0&&n<=5),'all maps have valid shared scene themes');
  const maps=['ar','ru','ta'].includes(lang)?[12,13,14]:Array.from({length:15},(_,i)=>i);
  for(const map of maps){
   await tap('map-'+map);assert.equal(await page.evaluate(()=>g.mapIndex),map);
   const boxes=await page.evaluate(()=>{const list=[];function walk(n){if(/^map-(pet-|types$|note$|title$|stage-count$)/.test(n.name))list.push(rect(n));n.children.forEach(walk);}walk(g.root);return list;});assert.equal(boxes.length,15);assert.equal(await page.evaluate(()=>!!findNode('map-stage-count')),false,'map header omits floor count');nonOverlapping(boxes,'map '+(map+1));
   const title=await page.evaluate(()=>{const l=findNode('map-title').getComponent(cc.Label);return {text:l.string,font:l.actualFontSize||l.fontSize};});assert(title.font>=12,`${lang} map ${map+1} title unreadable: ${JSON.stringify(title)}`);
   if(map===14)await page.screenshot({path:`${out}/${width}x${height}-${lang}-adventure.png`});
  }
  const before=await page.evaluate(()=>JSON.stringify(g.state));await page.evaluate(()=>g.pokedexUI());await idle();
  const tabs=await checkTabs('dex-map');const all=await page.evaluate(()=>rect(findNode('dex-map-all')));assert(all.y>Math.max(...tabs.map(t=>t.y+t.h)),'all filter is separate in header');
  for(const id of [0,5,12,13,14]){await tap('dex-map-'+id);assert.equal(await page.evaluate(()=>g.dexMap),id);}
  const dexBoxes=await page.evaluate(()=>{const ids=['dex-type','dex-owned','dex-friends','dex-shiny'],boxes=ids.map(id=>rect(findNode(id)));for(const id of Object.keys(__pm.controls()).filter(id=>id.startsWith('dex-pet-')))boxes.push(rect(findNode(id)));return boxes;});assert.equal(dexBoxes.length,10,'four filters and six cards');nonOverlapping([...tabs,...dexBoxes],'dex filters/cards');
  await page.screenshot({path:`${out}/${width}x${height}-${lang}-dex.png`});await tap('dex-map-all');assert.equal(await page.evaluate(()=>g.dexMap),-1);assert.equal(await page.evaluate(()=>JSON.stringify(g.state)),before,'navigation does not change game save');
  assert.deepEqual(errors,[]);console.log(`PASS map/dex 15 maps 3×5, all filter, geometry and untouched save: ${width}x${height} ${lang}`);await ctx.close();
 }
}finally{await browser.close();}}

async function pc(){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const [width,height,lang] of [[1280,720,'zh-CN'],[1280,720,'en'],[1920,1080,'de'],[1280,720,'ta']]){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
  await ctx.addInitScript(lang=>localStorage.setItem('pm.pc.language.v1',lang),lang);
  await p.goto('http://127.0.0.1:8781/');await p.waitForFunction(()=>globalThis.__pmPC?.ready,null,{timeout:120000});
  await p.evaluate(async()=>{globalThis.cc=await System.import('cc');function find(n){return n.components.find(c=>typeof c.mapDetail==='function')||n.children.map(find).find(Boolean);}globalThis.g=find(cc.director.getScene());g.show('map');});
  const idle=async()=>{await p.waitForFunction(()=>!__pmPC.busy()&&!g.art.pending);await p.waitForTimeout(250);};await idle();
  const snapshot=()=>p.evaluate(()=>JSON.stringify({revision:g.state.revision,pets:g.state.pets,cleared:g.state.clearedMaps,step:g.state.step,hp:g.state.hpRatio}));const before=await snapshot();
  const cards=await p.evaluate(()=>Array.from({length:15},(_,i)=>__pmPC.controls()['map-'+i]));assert(cards.every(Boolean),'PC all15 map controls');
  const rows=new Map();for(const c of cards){rows.set(c.y,(rows.get(c.y)||0)+1);assert(c.x-c.w/2>=280&&c.x+c.w/2<1040);assert(c.y-c.h/2>188&&c.y+c.h/2<=810);assert(c.w>=200&&c.h>=100);}
  assert.deepEqual([...rows.values()],[3,3,3,3,3],'PC three columns, five rows, no page navigation');
  for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){const a=cards[i],b=cards[j];assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2,'PC cards do not overlap');}
  for(const id of [0,11,12,13,14]){
   await idle();const pt=await p.evaluate(id=>{const c=__pmPC.controls()['map-'+id],b=document.querySelector('canvas').getBoundingClientRect(),k=Math.min(b.width/1600,b.height/900);return{x:b.left+(b.width-1600*k)/2+c.x*k,y:b.top+(b.height-900*k)/2+c.y*k};},id);await p.mouse.click(pt.x,pt.y);await idle();
   assert.equal(await p.evaluate(()=>g.mapIndex),id);
   const art=await p.evaluate(()=>{const detail=g.content.getChildByName('map-detail');return {actors:detail.children.filter(n=>n.name.startsWith('actor-')).length,frames:detail.getComponentsInChildren(cc.Sprite).filter(s=>!!s.spriteFrame).length,labels:detail.getComponentsInChildren(cc.Label).map(l=>({text:l.string,size:l.actualFontSize||l.fontSize}))};});assert.equal(art.actors,6,'each map preview has six species');assert(art.frames>=7,'scene and pet assets resolve');assert(art.labels.every(l=>l.size>=11),'PC detail text readable');
  }
  const names=await p.evaluate(()=>Array.from({length:15},(_,i)=>{const c=g.ui.controls.get('map-'+i),n=c.visual.getChildByName('map-name-'+i);const label=n.getComponent(cc.Label);return {text:label.string,size:label.actualFontSize||label.fontSize};}));assert(names.every(n=>n.size>=12),'PC all map names readable');if(lang!=='zh-CN')assert(names.every(n=>!/[\u3400-\u9fff]/.test(n.text)),'PC map names translated');
  await p.screenshot({path:`${out}/pc-${width}x${height}-${lang}-maps.png`});assert.equal(await snapshot(),before,'map navigation preserves game progress');
  await p.evaluate(()=>g.show('dex'));await idle();const dexTotal=await p.evaluate(()=>g.content.getComponentsInChildren(cc.Label).map(l=>l.string).some(s=>s.includes('324')));assert(dexTotal,'PC dex count includes54 new forms');
  await p.screenshot({path:`${out}/pc-${width}x${height}-${lang}-dex.png`});
  if(lang==='zh-CN')await pcBattleContent(p,idle);
  assert.deepEqual(errors,[]);console.log(`PASS PC15 maps 3×5 one page, map assets, selection, translated names and324-form dex: ${width}x${height} ${lang}`);await ctx.close();
 }}finally{await browser.close();}
}

async function pcBattleContent(page,idle){
 const vm=require('node:vm'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),cache={};
 function load(name){if(cache[name])return cache[name];const exp=cache[name]={},file=name==='PMModel'?'build/pc-project/assets/scripts/PMModel.ts':'pc/game/'+name+'.ts';vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:exp,require:p=>load(p.replace('./','')),Math,Date,JSON,Set,Map});return exp;}
 const M=load('PMModel'),scenes=load('PCBattleScenes'),copy=x=>JSON.parse(JSON.stringify(x)),results=[];
 const now=Date.now();M.setTimeProvider(()=>now);
 for(const mapId of [12,13,14])for(const [tier,rarity]of M.RARITIES.entries()){
  const id=M.MAPS[mapId].pets[[0,4,5][tier]];let s=M.fresh(173,[id,'fox','bud']);
  s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.expedition=false;s.clearedMaps=Array.from({length:mapId},(_,i)=>i);
  s=M.selectActive(s,s.pets.find(p=>p.id===id).uid);const pet=s.pets.find(p=>p.uid===s.active.uid);
  Object.assign(pet,{rarity,shiny:true,baseHP:M.naturalPetHP(id,rarity),baseFaces:M.naturalPetFaces(id,rarity),skills:M.petSkills({id,rarity})});pet.faces=pet.baseFaces.slice();s.active=copy(pet);s.runRoster={};
  s=M.enterExpedition(s,mapId,now);assert(s.expedition);s.step=[1,5,10][tier];s.enemy=id;s.enemyRarity=rarity;s.enemyMax=s.enemyHP=M.enemyHealthForStage(s.step,mapId);s=M.act(s,'challenge');assert.equal(s.phase,'battle');assert(M.restore(JSON.stringify(s)),'isolated battle fixture restores');
  await page.evaluate(s=>{g.state=s;g.reduced=true;g.show('battle');},s);await idle();
  const visual=await page.evaluate(()=>{const actor=n=>{const image=n.children.find(c=>!!c.getComponent(cc.Sprite)),sprite=image.getComponent(cc.Sprite),t=image.getComponent(cc.UITransform),motion=n.components.find(c=>typeof c.strike==='function'),shadow=motion.shadow;return{key:g.art.bindings.get(image),frame:!!sprite.spriteFrame,material:!!sprite.customMaterial,x:n.position.x,y:n.position.y,shadowX:shadow.position.x,shadowY:shadow.position.y,foot:image.position.y-t.height*t.anchorY,width:t.width,height:t.height};};const bg=g.battleScenery.getComponent(cc.Sprite),controls=__pmPC.controls();return{player:actor(g.player),enemy:actor(g.enemy),scene:g.sceneKey,background:!!bg.spriteFrame,canvas:__pmPC.resolution().visible,controls:Object.fromEntries(['attack','guard','heal','boost'].map(k=>[k,controls[k]]))};});
  const base=rarity==='normal'?id:M.formKey({id,rarity});assert.equal(visual.player.key,base+'-back');assert.equal(visual.enemy.key,base+(rarity==='normal'?'':'-front'));
  assert(visual.player.frame&&visual.enemy.frame&&visual.background,'both new views and aliased background resolve');assert(visual.player.material,'new shiny form uses shared recolor material');assert(!visual.enemy.material,'ordinary form keeps original colors');assert.equal(visual.scene,scenes.pcMapScene(mapId));
  for(const actor of [visual.player,visual.enemy]){assert.equal(actor.foot,0,'sprite bottom is anchored to actor feet');assert.equal(actor.x,actor.shadowX,'shadow centered at feet');assert.equal(actor.y,actor.shadowY,'shadow stays on the ground');assert(actor.width>100&&actor.height>100,'new art is not a fallback thumbnail');for(const c of Object.values(visual.controls))assert(Math.abs(actor.x-c.x)>c.w/2||Math.abs(-actor.y-c.y)>c.h/2,'feet do not land inside command UI');}
  const file=`pc-map-${mapId+1}-${rarity}-shiny-battle.png`;await page.screenshot({path:`${out}/${file}`});results.push({map:mapId+1,id,rarity,shinyPlayer:true,ordinaryEnemy:true,screenshot:file,...visual});
 }
 fs.writeFileSync(`${out}/pc-battle-content.json`,JSON.stringify({platform:'Isolated web-desktop browser fixture, not native Windows validation',results},null,2));console.log('PASS PC13–15:9 battle fixtures, R/SR/SSR front/back, shiny recolor, aliased backgrounds, foot/shadow anchors and command safety');
}

(async()=>{if(!process.argv.includes('--pc-only'))await mobile();if(process.argv.includes('--pc-only')||process.argv.includes('--both'))await pc();})().catch(e=>{console.error(e);process.exitCode=1;});
