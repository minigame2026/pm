/* Isolated browser UI check: no player's profile or save is opened. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const T=Date.now(),out='checks/ui-comfort-social';fs.mkdirSync(out,{recursive:true});M.setTimeProvider(()=>T);
function make(owner){let s=M.fresh(53,['fox','otter','bud']);s.journey={version:1,stage:'done',hero:'keeper',starter:'fox',legacy:true};s=M.syncStamina(s,T);s.expedition=false;return M.ensureSocial(s,owner);}
let populated=make('comfort-owner');for(let i=0;i<4;i++){const friend=M.setSocialProfile(make('comfort-friend-'+i),['Mika','Sophie','Hiro','Jules'][i],['fox','otter','bud']);populated=M.receiveVisitor(populated,M.makePostcardCode(friend,friend.active.uid));populated=M.completeVisit(populated);}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];try{
  for(const [width,height,lang] of [[390,844,'zh-CN'],[320,568,'de']]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
    await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
    await p.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);await p.goto(cfg.url+'?ui=comfort-social');await p.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
    await p.evaluate(async s=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.socialUI==='function');if(c)return c;for(const ch of n.children){const v=walk(ch);if(v)return v;}}globalThis.g=walk(cc.director.getScene());g.state=s;g.screen='home';g.render();},populated);
    const before=await p.evaluate(()=>JSON.stringify([g.state.pets,g.state.eggs,g.state.stamina]));
    const controls=()=>p.evaluate(()=>__pm.controls());
    async function tap(id){await p.waitForFunction(()=>!g.busy&&!g.pressPending);const c=(await controls())[id];assert(c,'Missing control '+id);await p.touchscreen.tap(c.x*width/390,c.y*width/390);await p.waitForTimeout(240);await p.waitForFunction(()=>!g.busy&&!g.pressPending);}
    async function shot(name){await p.waitForFunction(()=>!g.artCache.pending,null,{timeout:30000});await p.waitForTimeout(150);await p.screenshot({path:`${out}/${width}-${lang}-${name}.png`});}
    await p.evaluate(()=>g.socialUI('visit'));let c=await controls();assert(c['social-tab-visit']&&c['social-tab-share']&&c['social-tab-friends']);assert(!c['social-tab-bonds']&&!c['social-tab-album']);await shot('receive');
    await tap('social-tab-friends');c=await controls();assert(c['social-tab-bonds']&&c['social-tab-album']);
    const friendTexts=await p.evaluate(()=>{const a=[];function w(n){const l=n.getComponent(cc.Label);if(l)a.push(l.string);n.children.forEach(w);}w(g.root);return a;});assert(friendTexts.some(t=>/^\d{2}:\d{2}:\d{2}$/.test(t)),'Friend countdown must include hours');assert(!friendTexts.some(t=>/^♡\s*\d+\s*·/.test(t)),'Old ambiguous gift count');await shot('friends');
    await tap('social-tab-bonds');assert.equal(await p.evaluate(()=>g.socialTab),'bonds');await tap('nav-home');assert.equal(await p.evaluate(()=>g.socialTab),'friends');await tap('social-tab-album');assert.equal(await p.evaluate(()=>g.socialTab),'album');await tap('nav-home');assert.equal(await p.evaluate(()=>g.socialTab),'friends');
    await tap('social-tab-share');c=await controls();assert(c['share-send'].y>c['share-copy'].y&&c['share-send'].y>c['share-choose'].y,'Main share action should be at the bottom');await shot('send');
    await p.evaluate(()=>{g.dexPage=0;g.dexMap=-1;g.dexType='';g.dexOwnedOnly=false;g.dexFriendsOnly=false;g.dexShinyOnly=false;g.pokedexUI();});c=await controls();assert.equal(Object.keys(c).filter(k=>/^dex-map-(all|\d+)$/.test(k)).length,10);assert(c['dex-friends']&&c['dex-shiny']);await shot('dex');
    await tap('dex-friends');c=await controls();const ids=Object.keys(c).filter(k=>k.startsWith('dex-pet-'));assert(ids.length>0);assert(ids.every(k=>M.FRIEND_PET_IDS.some(id=>k.startsWith('dex-pet-'+id+'-'))));
    await tap(ids[0]);assert((await controls())['dex-detail-back']);await shot('friend-detail');await tap('dex-detail-back');
    await tap('dex-shiny');c=await controls();assert(Object.keys(c).filter(k=>k.startsWith('dex-pet-')).every(k=>k.endsWith('-shiny')));await shot('dex-friend-shiny');
    await tap('dex-map-0');assert.equal(await p.evaluate(()=>g.dexFriendsOnly),false,'Selecting a map clears the incompatible friend-only source');
    // Every friend family has no MAPS entry; cover its three quality variants directly.
    await p.evaluate(ids=>{for(const id of ids)for(const rarity of ['normal','SR','SSR'])g.dexDetail(id,rarity);},M.FRIEND_PET_IDS);
    assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>JSON.stringify([g.state.pets,g.state.eggs,g.state.stamina])),before,'UI navigation must preserve pets, eggs and stamina');results.push({width,height,lang,friendFormsChecked:M.FRIEND_PET_IDS.length*3,errors});await ctx.close();
  }
  fs.writeFileSync(`${out}/result.json`,JSON.stringify(results,null,2));console.log('PASS social/dex UI: '+JSON.stringify({ok:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
