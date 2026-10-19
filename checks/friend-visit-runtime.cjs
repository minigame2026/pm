const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:mod.exports,Math,Date,JSON,Set});const M=mod.exports,copy=s=>JSON.parse(JSON.stringify(s));
const key='pm.creature-dice.v1',errors=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
async function client(){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text()+' '+m.location().url)});
 await page.addInitScript(()=>{globalThis.__clipboard='';Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{globalThis.__clipboard=text;},readText:async()=>globalThis.__clipboard},configurable:true});});
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.version==='0.11.0',null,{timeout:60000});
 const bind=()=>page.evaluate(async()=>{const cc=await System.import('cc');const walk=n=>{const c=n.components.find(c=>typeof c.socialUI==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}};globalThis.__testGame=walk(cc.director.getScene());});await bind();
 const set=async s=>{await page.evaluate(s=>{__testGame.state=s;__testGame.screen='home';__testGame.partnerSelected=null;__testGame.save();__testGame.render();},copy(s));await page.waitForTimeout(160);};
 const state=()=>page.evaluate(()=>__pm.snapshot());
 const tap=async id=>{await page.waitForFunction(()=>!__pm.animating());const p=await page.evaluate(id=>__pm.controls()[id],id),k=page.viewportSize().width/390;assert.ok(p,id);await page.touchscreen.tap(p.x*k,p.y*k);await page.waitForTimeout(180);await page.waitForFunction(()=>!__pm.animating());};
 const shot=name=>page.screenshot({path:__dirname+'/friend-'+name+'.png'});
 return{page,bind,set,state,tap,shot};
}
const a=await client(),b=await client();
let source=M.ensureSocial(M.fresh(19,['dragon']),'demo-friend');const pet=source.pets.find(p=>p.id==='dragon');
Object.assign(pet,{rarity:'SSR',sex:'female',baseHP:91,baseFaces:[71,81,91],faces:[71,81,91],skills:['opening','charged','healing','armor','focus','barrier']});source.qualities.dragon=['SSR'];
if(source.active.uid===pet.uid)source.active=copy(pet);if(source.reserve?.uid===pet.uid)source.reserve=copy(pet);if(source.runRoster[pet.uid])source.runRoster[pet.uid]=copy(pet);
assert.ok(M.restore(JSON.stringify(source)));await a.set(source);await a.tap('home-social');await a.tap('social-tab-share');await a.tap('share-choose');await a.tap('share-pick-'+pet.uid);await a.tap('share-copy');const code=await a.page.evaluate(()=>__clipboard);assert.equal(code,M.makeVisitCode(source,pet.uid));await a.shot('share');
let recipient=M.fresh(73);recipient.eggs.push({id:'qa-own-R',rarity:'normal',affinity:'bud',stage:5,mapId:0},{id:'qa-own-SR',rarity:'SR',affinity:'bud',stage:5,mapId:0});await b.set(recipient);await b.tap('home-social');
// Enter through the real mobile EditBox, not a direct state mutation.
await b.tap('visit-code');const input=b.page.locator('input:visible,textarea:visible').first();await input.waitFor({state:'visible',timeout:5000});await input.fill(code);await input.press('Enter');await b.tap('visit-receive');assert.equal((await b.state()).social.visitor.card.species,'dragon');await b.shot('visitor');
await b.tap('visit-play');assert.equal((await b.state()).social.visitor.progress,1);
await b.page.reload();await b.page.waitForFunction(()=>globalThis.__pm?.ready);await b.bind();await b.tap('home-social');assert.equal((await b.state()).social.visitor.progress,1);
await b.page.evaluate(code=>{globalThis.__clipboard=code;},code);await b.tap('visit-paste');await b.tap('visit-receive');assert.equal((await b.state()).social.visitor.progress,1);
await b.tap('visit-play');await b.tap('visit-play');let n=await b.state();assert.equal(n.social.visitor.progress,3);assert.equal(n.social.bonds.length,1);assert.equal(n.pets.length,recipient.pets.length);assert.deepEqual((await a.state()).pets,copy(source.pets));await b.shot('bond-unlocked');
await b.tap('visit-bond');await b.tap('bond-select-dragon');await b.shot('egg-picker');await b.tap('bond-egg-qa-own-SR');assert.equal(await b.page.evaluate(()=>!!__pm.controls()['bond-confirm']),false);
await b.tap('bond-egg-qa-own-R');await b.shot('confirm');await b.tap('bond-confirm');n=await b.state();assert.equal(n.incubators[0].result,'normal');assert.equal(n.eggs.length,2);assert.equal(n.eggs.find(e=>e.id==='qa-own-R').affinity,'dragon');assert.ok(M.restore(JSON.stringify(n)));
await b.page.evaluate(()=>{globalThis.__realNow=Date.now;Date.now=()=>__realNow()+31*60*1000;});await b.page.waitForTimeout(1100);await b.tap('hatch-slot-0');n=await b.state();const child=n.pets.at(-1);assert.equal(child.id,'dragon');assert.equal(child.rarity,'normal');assert.equal(child.baseHP,M.PETS.dragon.hp);assert.deepEqual(child.skills,copy(M.petSkills({id:'dragon',rarity:'normal'})));assert.equal(n.pets.length,recipient.pets.length+1);await b.shot('hatched');await b.tap('hatch-ack');await b.tap('hatch-close');
await b.page.setViewportSize({width:320,height:568});await b.page.waitForTimeout(250);await b.tap('home-social');await b.shot('small-visitor');await b.tap('social-tab-share');await b.shot('small-share');await b.tap('social-close');
assert.equal(await b.page.locator('input:visible').count(),0);assert.ok(M.restore(JSON.stringify(await b.state())));assert.ok(await b.page.evaluate(key=>localStorage.getItem(key+'.pre-social-v1'),key));
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,version:'0.11.0',manualInput:true,clipboard:true,twoClients:true,progressReload:true,noDuplicateUnlock:true,ownEggRarity:true,lockedSRBlocked:true,hatch:true,smallScreen:true,errors,testCode:code}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
