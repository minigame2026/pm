const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
const sceneModule={},M={};
for(const [file,exports]of [['pc/game/PCBattleScenes.ts',sceneModule],['assets/scripts/PMModel.ts',M]])vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports,Math,Date,JSON,Set,Map,Number,Array});
const names=[...Array.from({length:15},(_,i)=>'map-'+String(i+1).padStart(2,'0')+'-v1'),'raid-molten-v1'],hash=b=>crypto.createHash('sha256').update(b).digest('hex'),out='checks/pc-battle-scenes';
fs.mkdirSync(out,{recursive:true});const results=[],errors=[],screenshots=[],sources=names.map(name=>{const file='pc/assets/battle-scenes/'+name+'.png',data=fs.readFileSync(file);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return {name,key:'pc-'+name,file,width:data.readUInt32BE(16),height:data.readUInt32BE(20),sha256:hash(data)};});
assert.equal(new Set(sources.map(s=>s.sha256)).size,16,'every region and raid has a distinct source painting');
sources.forEach(s=>{assert(s.width>=1600&&s.height>=900);assert(Math.abs(s.width/s.height-16/9)<.003);});
assert.equal(new Set(sceneModule.PC_MAP_SCENES).size,15);for(let i=0;i<15;i++)assert.equal(sceneModule.pcMapScene(i),sources[i].key);assert.equal(sceneModule.PC_RAID_SCENE,sources[15].key);
for(const size of [[1600,900],[2133.333,900],[1440,900]])for(const s of sources){const box=sceneModule.pcSceneCover(s.width,s.height,...size);assert(box.width>=size[0]-.001&&box.height>=size[1]-.001);assert.equal(box.x,800);assert.equal(box.y,-450);assert(Math.abs(box.width/box.height-s.width/s.height)<1e-10);}
for(const file of ['assets/scripts/PMArt.ts','assets/scripts/ArtSourceSizes.ts'])assert(!/pc-map-|pc-raid-|PC_ART_PATHS/.test(fs.readFileSync(file,'utf8')),'mobile source remains unregistered');
assert(!fs.existsSync('assets/resources/pc/battle-scenes'),'PC backgrounds must not enter the mobile asset tree');results.push('16 unique actual-pixel sources, map routing, centered cover math and mobile isolation');
if(process.argv.includes('--source-only')){console.log(results.join('\n'));process.exit(0);}
const generated=JSON.parse(fs.readFileSync('build/pc-project/pc-battle-scenes.json','utf8'));
for(const s of sources){const row=generated.scenes.find(r=>r.key===s.key);assert(row);assert.equal(row.sha256,s.sha256);assert.deepEqual(row.sourcePixels,[s.width,s.height]);assert.equal(row.resource,'pc/battle-scenes/'+s.name);assert.equal(hash(fs.readFileSync('build/pc-project/assets/resources/'+row.resource+'.png')),s.sha256);assert(!fs.existsSync('build/pc-project/assets/resources/art/'+s.key+'.png'),'no duplicated scene bitmap in art/');}
const generatedArt=fs.readFileSync('build/pc-project/assets/scripts/PMArt.ts','utf8');assert(generatedArt.includes('PC_ART_PATHS[source]'));results.push('generated PC registration uses actual pixels and one resources/pc copy');
const {chromium}=require(cfg.playwright),NOW=Date.now();M.setTimeProvider(()=>NOW);
function fixture(){let s=M.fresh(491,['fox','bud','otter']);s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.expedition=false;s.clearedMaps=Array.from({length:15},(_,i)=>i);return M.syncStamina(s,NOW);}
let browser;
async function screenshot(page,name){await page.screenshot({path:path.join(out,name+'.png')});screenshots.push(name+'.png');}
async function readyArt(page,key){await page.waitForFunction(key=>pcGame.art.pending===0&&pcGame.art.frames[key],key,{timeout:60000});await page.waitForTimeout(250);}
async function inspectCover(page,raid=false){return page.evaluate(raid=>{const node=raid?pcGame.onlineUI.raidScenery:pcGame.battleScenery,t=node.getComponent(pcCC.UITransform),visible=__pmPC.resolution().visible,frame=node.getComponent(pcCC.Sprite).spriteFrame;return {w:t.width,h:t.height,x:node.position.x,y:node.position.y,visible,texture:[frame.texture.width,frame.texture.height]};},raid);}
function checkCover(box,source){assert(box.w>=box.visible.width-.01&&box.h>=box.visible.height-.01,'landscape covers the complete viewport');assert(Math.abs(box.w/box.h-source.width/source.height)<.0001,'source aspect ratio preserved');assert.equal(box.x,800);assert.equal(box.y,-450);assert.deepEqual(box.texture,[source.width,source.height]);}
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:1280,height:720}});
 await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(NOW).toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
 await context.addInitScript(s=>{localStorage.setItem('pm.pc.creature-dice.v1',JSON.stringify(s));localStorage.setItem('pm.creature-dice.v1','MOBILE_SCENE_SENTINEL');},fixture());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:8781/');await page.waitForFunction(()=>globalThis.__pmPC?.ready,null,{timeout:120000});
 await page.evaluate(async()=>{globalThis.pcCC=await System.import('cc');function find(n){const game=n.components.find(c=>typeof c.ensureBattleScene==='function');if(game)return game;for(const child of n.children){const game=find(child);if(game)return game;}}globalThis.pcGame=find(pcCC.director.getScene());});
 for(let i=0;i<15;i++){
   const source=sources[i],s=M.act(M.enterExpedition(fixture(),i),'challenge');assert.equal(s.phase,'battle');
   await page.evaluate(s=>{pcGame.state=s;pcGame.show('battle');},s);await readyArt(page,source.key);assert.equal(await page.evaluate(()=>pcGame.sceneKey),source.key);checkCover(await inspectCover(page),source);await screenshot(page,'map-'+String(i+1).padStart(2,'0')+'-720p');
   await page.evaluate(i=>{pcGame.mapIndex=i;pcGame.show('map');},i);await readyArt(page,source.key);assert(await page.evaluate(key=>Array.from(pcGame.art.bindings).some(([node,bound])=>bound===key&&node.activeInHierarchy),source.key),'map preview must use the same region painting');
 }
 results.push('all 15 live 720p battle scenes and map previews use their own landscape paintings');
 await page.setViewportSize({width:2560,height:1080});await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>__pmPC.resolution().visible.width),1600);
 await page.evaluate(s=>{pcGame.state=s;pcGame.show('battle');},M.act(M.enterExpedition(fixture(),11),'challenge'));await readyArt(page,sources[11].key);checkCover(await inspectCover(page),sources[11]);await screenshot(page,'map-12-ultrawide');
 await page.evaluate(s=>{pcGame.state=s;pcGame.show('raids');},fixture());await readyArt(page,sceneModule.PC_RAID_SCENE);assert(await page.evaluate(key=>Array.from(pcGame.art.bindings).some(([node,bound])=>bound===key&&node.activeInHierarchy),sceneModule.PC_RAID_SCENE),'raid lobby has its independent den painting');
 await page.evaluate(()=>{pcGame.online.startSolo(1);pcGame.show('raidbattle');});await readyArt(page,sceneModule.PC_RAID_SCENE);checkCover(await inspectCover(page,true),sources[15]);await screenshot(page,'raid-ultrawide');
 await page.setViewportSize({width:1280,height:720});await page.waitForFunction(()=>Math.abs(__pmPC.resolution().visible.width-1600)<.01);await page.waitForTimeout(250);checkCover(await inspectCover(page,true),sources[15]);await screenshot(page,'raid-720p');
 assert.equal(await page.evaluate(()=>localStorage.getItem('pm.creature-dice.v1')),'MOBILE_SCENE_SENTINEL');results.push('independent raid lobby/battle art, 16:9 and live ultrawide resizing preserve cover and mobile save');
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),platform:'Cocos web-desktop, Edge',results,errors,screenshots,sources,nativeVerified:false},null,2));console.log(JSON.stringify({passed:results.length,results,screenshots:screenshots.length},null,2));await context.close();
 }finally{await browser.close();}})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack));console.error(e);process.exitCode=1;});
