// Screen-size emulation, not iOS/Android device or GPU certification.
const fs=require('fs'),path=require('path'),vm=require('vm'),cfg=require('../tools/workflow.config.json'),{chromium,webkit}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
let base=M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(17),'ranger'),'fox'),Date.now());
base.clearedMaps=[0,1,2,3,4,5,6,7,8];
base.eggs=Array.from({length:14},(_,i)=>({id:'responsive-'+i,rarity:'normal',affinity:'bud',stage:5,mapId:0}));
const profiles=[['compact',320,568,2],['iphone-se',375,667,2],['iphone-x',375,812,3],['iphone-14',390,844,3],['iphone-pro',393,852,3],['iphone-max',430,932,3],['android-short',360,640,2],['android-tall',360,800,3],['android-large',412,915,3],['android-extra-tall',384,854,2],['browser-bars',390,664,3],['ipad',768,1024,2],['ipad-air',820,1180,2],['android-tablet',800,1280,2]];
const safari=process.env.PM_BROWSER==='webkit',suffix=safari?'-webkit':'',out='checks/responsive/results'+suffix+'.json';
const result={kind:safari?'Windows WebKit touch emulation':'Edge touch viewport emulation',realDevices:false,profiles:[],errors:[]};fs.mkdirSync('checks/responsive',{recursive:true});
(async()=>{const browser=await (safari?webkit.launch({headless:true}):chromium.launch({channel:'msedge',headless:true}));try{for(const [name,width,height,deviceScaleFactor] of profiles.filter(p=>!safari||['iphone-se','iphone-14','ipad'].includes(p[0]))){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor}),page=await ctx.newPage();
 page.on('pageerror',e=>result.errors.push({profile:name,error:String(e)}));
 await ctx.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await ctx.route('https://worldtimeapi.org/**',r=>r.abort());
 await page.addInitScript(s=>localStorage.setItem('pm.creature-dice.v1',JSON.stringify(s)),base);
 await page.goto(cfg.url+'?responsive=1');await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});
 await page.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());});
 const report={name,width,height,deviceScaleFactor,screens:[]};result.profiles.push(report);
 async function tap(id){await page.waitForFunction(()=>!__pm.animating());const c=await page.evaluate(id=>__pm.controls()[id],id);if(!c)throw Error('missing '+id);await page.touchscreen.tap(c.x*width/390,c.y*width/390);await page.waitForTimeout(250);await page.waitForFunction(()=>!__pm.animating());}
 await tap('start-game');if(await page.evaluate(()=>g.screen)!=='home')throw Error(name+' start touch');
 await tap('home-hatch');await tap('hatch-slot-0');if(!await page.evaluate(()=>g.root.getComponentsInChildren(cc.Label).some(l=>l.string==='选择宠物蛋')))throw Error(name+' egg picker touch');
 await tap('picker-back');await tap('hatch-close');await tap('home-settings');await tap('settings-close');report.touchFlow='start, hatch, egg picker, return, settings, close passed';
 const scenarios=['login','hero','starter','home','adventure','encounter','battle','reward','nest','won','lost','partners','dex','detail','hatch','eggs','breed','social','settings'];
 for(const screen of scenarios){
  await page.evaluate(({screen,base})=>{g.state=JSON.parse(JSON.stringify(base));g.utilityDraw=null;g.busy=false;g.pressPending=false;
   if(['login','hero','starter','home','adventure','partners'].includes(screen)){g.screen=screen;g.render();}
   else if(['encounter','battle','reward','nest','won','lost'].includes(screen)){g.screen='game';g.state.phase=screen;if(screen==='nest')g.state.eggHunt={limit:2,candidates:[],selected:-1};if(screen==='reward')g.state.reward={kind:'attack',values:[7,9]};g.render();}
   else {g.screen='home';g.render();if(screen==='dex')g.pokedexUI();if(screen==='detail')g.dexDetail('fox','SSR');if(screen==='hatch')g.hatchery();if(screen==='eggs')g.eggBag();if(screen==='breed')g.breedingUI();if(screen==='social')g.socialUI('visit');if(screen==='settings')g.homeSettings();}
  },{screen,base});
  await page.waitForTimeout(80);await page.waitForFunction(()=>!__pm.animating());
  const sample=await page.evaluate(()=>{const s=cc.view.getVisibleSize(),controls=Object.entries(__pm.controls()).map(([id,c])=>({id,...c}));return {logical:{width:s.width,height:s.height},outside:controls.filter(c=>c.x-c.w/2<-.6||c.x+c.w/2>s.width+.6||c.y-c.h/2<-.6||c.y+c.h/2>s.height+.6),controls:controls.length,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()};});
  report.screens.push({screen,...sample});
  if(['compact','iphone-14','ipad','android-tablet'].includes(name))await page.screenshot({path:`checks/responsive/${name}-${screen}${suffix}.png`,scale:'css'});
 }
 // Rotation and back must not change gameplay/save or strand a utility page.
 await page.evaluate(()=>g.hatchery());const before=await page.evaluate(()=>JSON.stringify(g.state));
 await page.setViewportSize({width:height,height:width});await page.waitForTimeout(500);
 report.landscape=await page.evaluate(()=>({logical:cc.view.getVisibleSize(),controls:__pm.controls(),screen:g.screen,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()}));
 if(['compact','iphone-14','ipad'].includes(name))await page.screenshot({path:`checks/responsive/${name}-landscape${suffix}.png`,scale:'css'});
 await page.setViewportSize({width,height});await page.waitForTimeout(500);report.rotationStatePreserved=before===await page.evaluate(()=>JSON.stringify(g.state));
 await ctx.close();console.log(name+': '+report.screens.reduce((n,s)=>n+s.outside.length,0)+' out-of-bounds controls');
 fs.writeFileSync(out,JSON.stringify(result,null,2));
}result.status=result.errors.length?'runtime-errors':'measured';}finally{await browser.close();fs.writeFileSync(out,JSON.stringify(result,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
