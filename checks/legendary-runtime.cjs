/* Run only after the shared build. One disposable browser context; never opens a player profile. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const modules={};
for(const name of ['PMTranslations','PMLocale','PMModel']){
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'assets/scripts',name+'.ts'),'utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports,require:p=>modules[p.replace('./','')],Math,Date,JSON,Set,Map,RegExp});modules[name]=exports;
}
const M=modules.PMModel,L=modules.PMLocale,translations=modules.PMTranslations.TRANSLATIONS;
const roster=JSON.parse(fs.readFileSync(path.join(root,'art-source/regions-10-12/roster.json'),'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>assert.deepEqual(copy(a),copy(b));
const norm=s=>String(s).replace(/\s+/g,' ').trim(),out=path.join(__dirname,'legendary-runtime');
const report={status:'pending',languages:[],resourceFrames:[],maps:[],dexEntries:[],screenshots:[],errors:[],elapsedMs:0};
function checkTextData(){
 const languages=L.LANGUAGES.filter(l=>l.id!=='system');assert.equal(languages.length,22);
 const keys=[...new Set(roster.pets.flatMap(p=>[...p.forms.map(f=>f.name),...p.skills.flatMap(s=>[s.name,s.description])]).concat(roster.maps.flatMap(m=>{const v=M.MAPS[m.id];return [v.name,v.eggs,v.note];})))];
 for(const key of keys){assert(translations[key],`Missing translation source: ${key}`);assert.equal(translations[key].length,21,key);assert(translations[key].every(v=>typeof v==='string'&&v.trim()),`Empty translation: ${key}`);}
 for(const {id} of languages){L.selectLanguage(id,id);for(const key of keys){const value=L.tr(key);assert(value&&value!=='undefined',`${id}: ${key}`);if(!['zh-CN','zh-TW','ja'].includes(id))assert(!/[\u3400-\u9fff]/.test(value),`${id} source-language residue: ${key} => ${value}`);}report.languages.push({id,keys:keys.length});}
 assert.equal(M.LEGENDARY_PET_IDS.length,18);assert.equal(M.MAPS.length,12);assert.equal(M.PET_IDS.length,90);
}
function fixtures(){
 const now=Date.now();M.setTimeProvider(()=>now);let base=M.syncStamina(M.fresh(711,M.LEGENDARY_PET_IDS),now);
 base.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};base.expedition=false;base.clearedMaps=M.MAPS.map(m=>m.id);
 // Use the real hatch path for SR/SSR genes, then add separate shiny individuals.
 for(const p of roster.pets)for(const rarity of ['SR','SSR']){const id=`legendary-runtime-${p.id}-${rarity}`;base.eggs.push({id,rarity,affinity:p.id,stage:5,mapId:p.mapId});base=M.startIncubation(base,id,0,now-3600000);base.incubators[0].result=rarity;base.incubators[0].shiny=false;delete base.incubators[0].nestedEgg;base=M.acknowledgeHatch(M.claimHatch(base,0,now));}
 for(const p of base.pets.filter(p=>M.LEGENDARY_PET_IDS.includes(p.id))){p.shiny=false;base.pets.push({...copy(p),uid:'shiny-'+p.uid,shiny:true});}
 assert(M.restore(JSON.stringify(base)),'isolated fixture must restore');assert.equal(base.pets.filter(p=>M.LEGENDARY_PET_IDS.includes(p.id)).length,108);
 return {base,now};
}
async function run(){
 checkTextData();const {base,now}=fixtures();
 if(process.argv.includes('--data-only')){console.log(`PASS 22 languages and ${report.languages[0].keys} new text keys; 108 isolated owned forms`);return;}
 fs.mkdirSync(out,{recursive:true});const saveReport=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 const {chromium}=require(cfg.playwright),started=Date.now();let browser,timer;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const work=async()=>{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'zh-CN'}),page=await context.newPage();page.setDefaultTimeout(12000);
   page.on('pageerror',e=>report.errors.push(String(e)));
   page.on('console',m=>{if(/Art unavailable|Unknown art|Failed to load|shader.*(error|failed)/i.test(m.text()))report.errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(cfg.url))report.errors.push(`HTTP ${r.status()} ${r.url()}`);});
   await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));
   await context.route('https://worldtimeapi.org/**',r=>r.abort());
   await page.addInitScript(s=>{localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s));localStorage.setItem('pm.language.v1','zh-CN');},base);
   await page.goto(cfg.url+'?legendary=isolated-check',{timeout:45000});await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:45000});
   await page.evaluate(async()=>{
    globalThis.cc=await System.import('cc');const find=n=>n.components.find(c=>typeof c.pokedexUI==='function')||n.children.map(find).find(Boolean);globalThis.g=find(cc.director.getScene());if(!g)throw Error('PMGame missing');g.clockSaveAt=Infinity;
    globalThis.legendNodes=(root=g.root)=>{const list=[];function walk(n){list.push(n);n.children.forEach(walk);}walk(root);return list;};
    globalThis.legendNode=name=>legendNodes().find(n=>n.name===name);
    globalThis.legendLabels=()=>legendNodes().filter(n=>n.activeInHierarchy).map(n=>n.getComponent(cc.Label)?.string).filter(Boolean);
    globalThis.legendPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    g.screen='home';g.render();
   });
   async function idle(){await page.waitForFunction(()=>!g.busy&&!g.pressPending&&!g.artCache.pending);await page.evaluate(()=>legendPaint());}
   async function tap(id){await idle();await page.waitForFunction(()=>performance.now()-g.lastTap>=230);const c=await page.evaluate(id=>__pm.controls()[id],id);assert(c,'Missing control '+id);const k=page.viewportSize().width/390;await page.touchscreen.tap(c.x*k,c.y*k);await page.waitForTimeout(60);await idle();}
   async function shot(name){await idle();const filename=name+'.png';await page.screenshot({path:path.join(out,filename)});report.screenshots.push(filename);saveReport();}
   async function setState(s,screen='home'){await page.evaluate(({s,screen})=>{g.state=s;g.screen=screen;g.render();},{s:copy(s),screen});await idle();}
   // Each source is touched once, and all six real PMArt frame bindings are checked.
   report.resourceFrames=await page.evaluate(async pets=>{
    const result=[];for(const p of pets){const nodes=[];for(const rarity of ['normal','SR','SSR'])for(const side of ['front','back']){
     const key=(rarity==='normal'?p.id:p.id+'-'+rarity)+'-'+side,n=new cc.Node('legendary-art-probe'),sprite=n.addComponent(cc.Sprite);nodes.push(n);g.artCache.bind(n,key);const frame=await g.artCache.load(key);await Promise.resolve();
     if(!(frame instanceof cc.SpriteFrame)||!frame.texture||sprite.spriteFrame!==frame||frame.rect.width<=0||frame.rect.height<=0)throw Error('Invalid SpriteFrame '+key);
     if(frame.rect.x<0||frame.rect.y<0||frame.rect.x+frame.rect.width>frame.texture.width+1||frame.rect.y+frame.rect.height>frame.texture.height+1)throw Error('Sprite crop exceeds texture '+key);
     result.push({key,width:frame.rect.width,height:frame.rect.height});
    }nodes.forEach(n=>n.destroy());await legendPaint();g.artCache.sweep();}return result;
   },roster.pets);assert.equal(report.resourceFrames.length,108);saveReport();
   // Enter via the actual map button, exercise a new skill, then win an elite encounter and search its nest.
   const fighters=[['cairnheart','normal','guard'],['drumthunder','SR','boost'],['frostfan','normal','guard']];
   for(const [i,map] of roster.maps.entries()){
    const [id,rarity,action]=fighters[i],uid=base.pets.find(p=>p.id===id&&p.rarity===rarity&&!p.shiny).uid,prepared=M.assignPartySlot(base,uid,0);
    await page.evaluate(({s,mapId})=>{g.state=s;g.mapIndex=mapId;g.mapTabPage=1;g.screen='adventure';g.render();},{s:copy(prepared),mapId:map.id});await shot(`map-${map.id+1}-390-zh-CN`);
    await tap('adventure-go');let state=await page.evaluate(()=>__pm.snapshot());assert.equal(state.mapId,map.id);assert.equal(state.phase,'encounter');assert(state.expedition);
    await tap('challenge');await tap(action);state=await page.evaluate(()=>__pm.snapshot());const code=M.petSkills({id,rarity})[0];assert(state.skill.usedCodes.includes(code),`${id} skill did not activate`);assert.equal(state.phase,'battle');await shot(`battle-${map.id+1}-390-zh-CN`);
    let elite=M.startMap(prepared,map.id,722+i);elite.step=5;elite.enemy=map.pets[4];elite.enemyRarity='SR';elite.enemyMax=M.enemyHealthForStage(5,map.id);elite.enemyHP=1;elite=M.act(elite,'challenge');elite.expedition=true;assert(M.restore(JSON.stringify(elite)));
    await setState(elite,'game');await tap('attack');assert.equal((await page.evaluate(()=>__pm.snapshot())).phase,'reward');await tap('take');assert.equal((await page.evaluate(()=>__pm.snapshot())).phase,'nest');await tap('eggSearch');state=await page.evaluate(()=>__pm.snapshot());assert(state.eggHunt.candidates.length>0);for(const egg of state.eggHunt.candidates){assert.equal(egg.mapId,map.id);assert(map.pets.includes(egg.affinity));}await shot(`nest-${map.id+1}-390-zh-CN`);
    await tap('eggTake');state=await page.evaluate(()=>__pm.snapshot());assert.equal(state.phase,'eggClaimed');assert(state.eggs.some(e=>e.mapId===map.id));assert(M.restore(JSON.stringify(state)));report.maps.push({id:map.id,skill:code,egg:state.eggs.at(-1)});saveReport();
   }
   await setState(base);
   // Scan actual rendered pages, rather than calling the model's list builder twice.
   for(const map of roster.maps)for(let pageIndex=0;pageIndex<6;pageIndex++){
    await page.evaluate(({mapId,pageIndex})=>{g.dexMap=mapId;g.dexType='';g.dexFriendsOnly=false;g.dexOwnedOnly=false;g.dexShinyOnly=false;g.dexPage=pageIndex;g.dexTabPage=1;g.pokedexUI();},{mapId:map.id,pageIndex});await idle();
    const cards=await page.evaluate(()=>legendNodes().filter(n=>n.activeInHierarchy&&n.name.startsWith('dex-pet-')).map(n=>{const sprites=legendNodes(n).map(n=>n.getComponent(cc.Sprite)).filter(Boolean);const pet=sprites.find(s=>s.spriteFrame);return {key:n.name,loaded:!!pet?.spriteFrame?.texture,shinyMaterial:!!pet?.customMaterial};}));
    const expected=[false,true].flatMap(shiny=>map.pets.flatMap(id=>M.RARITIES.map(r=>`dex-pet-${id}-${r}${shiny?'-shiny':''}`))).slice(pageIndex*6,pageIndex*6+6);same(cards.map(c=>c.key),expected);assert(cards.every(c=>c.loaded),'Missing rendered dex artwork');assert(cards.filter(c=>c.key.endsWith('-shiny')).every(c=>c.shinyMaterial),'Shiny cards need the shared-texture color material');report.dexEntries.push(...cards.map(c=>c.key));
   }
   assert.equal(new Set(report.dexEntries).size,108);assert.equal(report.dexEntries.filter(k=>k.endsWith('-shiny')).length,54);saveReport();
   await page.setViewportSize({width:320,height:568});await idle();
   async function selectLanguage(lang){
    await page.evaluate(()=>g.languageSettings());await idle();
    await page.evaluate(id=>{const row=legendNode('language-'+id),scroll=legendNode('language-scroll').getComponent(cc.ScrollView);if(!row)throw Error('Missing language '+id);const h=scroll.node.getComponent(cc.UITransform).height,max=scroll.getMaxScrollOffset().y,offset=Math.max(0,Math.min(max,-row.position.y-h/2));scroll.scrollToPercentVertical(max?1-offset/max:1,0);},lang);await idle();
    const pos=await page.evaluate(id=>{const n=legendNode('language-'+id);return {x:n.worldPosition.x,y:cc.view.getVisibleSize().height-n.worldPosition.y};},lang);await page.touchscreen.tap(pos.x*320/390,pos.y*320/390);await page.waitForTimeout(60);await idle();assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),lang);L.selectLanguage(lang,lang);
   }
   async function assertText(keys,lang){const labels=await page.evaluate(()=>legendLabels()),joined=norm(labels.join(' '));for(const key of keys)assert(joined.includes(norm(L.tr(key))),`${lang}: rendered text missing ${key}`);if(!['zh-CN','zh-TW','ja'].includes(lang))assert(!/[\u3400-\u9fff]/.test(joined),`${lang}: source Chinese in rendered UI`);}
   const subject=base.pets.find(p=>p.id==='triarchdrake'&&p.rarity==='SSR'&&p.shiny),sample=copy(base),samplePet=sample.pets.find(p=>p.uid===subject.uid);
   samplePet.skills=['glassdarner','crystalmedusa','cairnheart','origamighost','orbeholder','triarchdrake'].map(id=>M.petSkills({id,rarity:'SSR'})[0]);assert(M.restore(JSON.stringify(sample)));
   for(const lang of ['zh-CN','en','ru','ta']){
    await selectLanguage(lang);await page.evaluate(s=>{g.state=s;g.screen='adventure';g.mapIndex=11;g.mapTabPage=1;g.render();},copy(base));await idle();await assertText([M.MAPS[11].name],lang);await shot(`map-12-320-${lang}`);
    await page.evaluate(()=>g.dexDetail('triarchdrake','SSR',true));await idle();await assertText([M.petName(subject),M.SKILLS[M.petSkills(subject)[0]][0]],lang);await shot(`dex-ssr-shiny-320-${lang}`);
    await page.evaluate(({s,uid})=>{g.state=s;g.qualityDetail(uid,'SSR',0);},{s:copy(sample),uid:subject.uid});await idle();await assertText(samplePet.skills.flatMap(code=>[M.SKILLS[code][0],M.SKILLS[code][1]]),lang);
    const metrics=await page.evaluate(()=>{const content=legendNode('skill-content'),rows=content.children.filter(n=>n.name.startsWith('skill-row-'));return rows.map(row=>({name:row.name,width:row.getComponent(cc.UITransform).width,labels:row.children.map(n=>n.getComponent(cc.Label)).filter(Boolean).map(l=>({text:l.string,font:l.actualFontSize||l.fontSize,width:l.node.getComponent(cc.UITransform).width}))}));});
    assert.equal(metrics.length,6);assert(metrics.every(row=>row.width<=354&&row.labels.every(l=>l.font>=18&&l.width<=310)),`${lang}: skill content is too small or exceeds card width`);await shot(`skills-top-320-${lang}`);
    await page.evaluate(()=>legendNode('skill-scroll').getComponent(cc.ScrollView).scrollToBottom(0));await idle();await shot(`skills-bottom-320-${lang}`);
   }
   assert.deepEqual(report.errors,[]);await context.close();
  };
  await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Legendary runtime exceeded 110 seconds')),110000);})]);report.status='passed';
  console.log(`PASS legendary runtime: ${report.resourceFrames.length} front/back frames, 3 map/skill/nest flows, ${report.dexEntries.length} dex entries, 22-language text coverage and 4 small-screen language samples.`);
 }catch(error){report.status='failed';report.failure=String(error.stack||error);throw error;}
 finally{clearTimeout(timer);report.elapsedMs=Date.now()-started;saveReport();if(browser)await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
