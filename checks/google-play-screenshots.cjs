// Capture actual game screens using an isolated browser save for each language.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
const out=path.resolve('build/releases/Google-Play-phone-screenshots-20261021');
const languages=[['en','en-US','English'],['ja','ja-JP','日本語'],['ko','ko-KR','한국어'],['th','th-TH','ไทย'],['zh-TW','zh-TW','繁體中文']];
let base=M.chooseHero(M.prepareJourney(M.fresh(17,['fox','turtle','bud','cotton','otter','spark'])),'medic');
base=M.assignPartySlot(base,base.pets.find(p=>p.id==='bud').uid,2);
base=M.syncStamina(base,Date.now());
assert.equal(base.journey.hero,'medic');assert.ok(M.restore(JSON.stringify(base)));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),files=[];
 try{
  for(const [language,locale,name] of languages){
   if(process.env.PM_CAPTURE_LANGUAGE&&process.env.PM_CAPTURE_LANGUAGE!==language)continue;
   const folder=path.join(out,language);fs.mkdirSync(folder,{recursive:true});
   const context=await browser.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1,locale,isMobile:true,hasTouch:true});
   try{
    await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));
    await context.route('https://worldtimeapi.org/**',r=>r.abort());
    await context.addInitScript(({state,language})=>{
     const OriginalDate=Date;globalThis.Date=class extends OriginalDate{getHours(){return 13;}};
     localStorage.setItem('pm.creature-dice.v1',JSON.stringify(state));localStorage.setItem('pm.language.v1',language);
    },{state:base,language});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(cfg.url+'?capture=google-play-'+language);await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
    await page.evaluate(async()=>{
     globalThis.cc=await System.import('cc');
     function walk(n){const c=n.components.find(c=>typeof c.nestUI==='function');if(c)return c;for(const child of n.children){const f=walk(child);if(f)return f;}}
     globalThis.g=walk(cc.director.getScene());
    });
    async function idle(){await page.waitForFunction(()=>!__pm.animating()&&!g.pressPending&&performance.now()-g.lastTap>220,null,{timeout:90000});}
    async function tap(id){await idle();const p=await page.evaluate(id=>__pm.controls()[id],id);assert.ok(p,id);await page.touchscreen.tap(p.x*720/390,p.y*720/390);await page.waitForTimeout(320);await idle();}
    async function shot(file,screen){
     await idle();await page.waitForTimeout(1500);await idle();
     const evidence=await page.evaluate(()=>{
      const labels=[];function walk(n){if(!n.activeInHierarchy)return;const label=n.getComponent(cc.Label);if(label)labels.push(label.string);n.children.forEach(walk);}walk(g.root);
      return {hero:g.state.journey.hero,language:localStorage.getItem('pm.language.v1'),screen:__pm.screen(),phase:g.state.phase,labels,art:__pm.artStats()};
     });
     assert.equal(evidence.hero,'medic');assert.equal(evidence.language,language);
     if(['en','ko','th'].includes(language))assert.ok(!/[\u3400-\u9fff]/.test(evidence.labels.join('\n')),'Unexpected Chinese: '+evidence.labels.join(' | '));
     const target=path.join(folder,file+'.png');await page.screenshot({path:target});
     const data=fs.readFileSync(target);assert.equal(data.readUInt32BE(16),720);assert.equal(data.readUInt32BE(20),1280);assert.ok(data.length<8000000);
     assert.deepEqual(errors,[]);
     files.push({language,name,screen,file:path.relative(out,target).replace(/\\/g,'/'),width:720,height:1280,bytes:data.length,evidence});
     console.log('CAPTURED '+language+' '+file+' '+data.length+' bytes');
    }
    await tap('start-game');await shot('01-home','主界面');
    await tap('home-explore');await tap('adventure-go');await tap('challenge');await shot('02-battle','战斗');
    await page.evaluate(()=>{g.state.step=5;g.state.phase='nest';g.state.eggHunt={limit:2,candidates:[],selected:-1};g.render();});
    await tap('eggSearch');await tap('eggSearch');await shot('05-egg-hunt','偷蛋');
    await page.evaluate(()=>g.goHome());await idle();await tap('home-partners');await shot('03-partners','伙伴');
    await tap('nav-home');await tap('home-dex');await shot('04-encyclopedia','图鉴');
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
  assert.equal(files.length,process.env.PM_CAPTURE_LANGUAGE?5:25);
  fs.writeFileSync(path.join(out,'capture-manifest'+(process.env.PM_CAPTURE_LANGUAGE?'-'+process.env.PM_CAPTURE_LANGUAGE:'')+'.json'),JSON.stringify({source:'Actual current web game rendering; independent browser contexts; representative collection and elite nest in screenshot-only saves',hero:'medic / 星遥 / third protagonist',aspectRatio:'9:16',width:720,height:1280,files},null,2));
  console.log('PASS '+files.length+' actual game screenshots; five screens per language; third hero; 720x1280 PNG; each under 8 MB; no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
