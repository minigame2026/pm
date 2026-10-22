// Runs against the current web preview after building the language expansion.
// Browser storage is isolated from the player's session.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const now=Date.now();M.setTimeProvider(()=>now);const state=M.fresh(73,M.PET_IDS.slice(0,6));
state.journey={version:1,stage:'done',hero:'ranger',starter:null,legacy:true};state.expedition=false;state.stamina={value:30,updatedAt:now};
const out='checks/language-menu';fs.mkdirSync(out,{recursive:true});const results=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const [width,height] of [[390,844],[320,568]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));
    await context.route('https://worldtimeapi.org/**',r=>r.abort());
    await page.addInitScript(()=>localStorage.setItem('pm.language.v1','en'));
    await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
    await page.evaluate(async()=>{globalThis.cc=await System.import('cc');const find=n=>n.components.find(c=>typeof c.languageSettings==='function')||n.children.map(find).find(Boolean);globalThis.g=find(cc.director.getScene());globalThis.nodeByName=(name,n=g.root)=>n.name===name?n:n.children.map(c=>nodeByName(name,c)).find(Boolean);});
    const settle=async()=>{await page.waitForTimeout(260);await page.waitForFunction(()=>!g.pressPending&&!g.artCache.pending);};
    const tap=async id=>{const p=await page.evaluate(id=>{const c=__pm.controls()[id];if(!c)throw Error('Missing control '+id);return c;},id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await settle();};
    const photo=async name=>{await settle();const path=`${out}/${name}-${width}.png`;await page.screenshot({path});return path;};
    await page.evaluate(s=>{g.state=s;g.screen='home';g.render();},JSON.parse(JSON.stringify(state)));await settle();
    const avatar=await page.evaluate(()=>{const n=nodeByName('home-avatar-crop'),t=n.getComponent(cc.UITransform),m=n.getComponent(cc.Mask),image=n.children.find(c=>c.getComponent(cc.Sprite));return {type:m.type,ellipse:cc.Mask.Type.GRAPHICS_ELLIPSE,w:t.width,h:t.height,image:!!image,imageW:image?.getComponent(cc.UITransform).width,imageH:image?.getComponent(cc.UITransform).height};});
    assert.equal(avatar.type,avatar.ellipse);assert.equal(avatar.w,38);assert.equal(avatar.h,38);assert(avatar.image);assert.equal(avatar.imageW,38);assert.equal(avatar.imageH,38);
    const saved=await page.evaluate(()=>({pets:g.state.pets,team:g.state.team,journey:g.state.journey,eggs:g.state.eggs,hpRatio:g.state.hpRatio}));
    results.push({width,screen:'home',avatar,screenshot:await photo('home')});
    await page.evaluate(()=>g.homeSettings());await settle();await tap('settings-language');
    const menu=await page.evaluate(()=>{const n=nodeByName('language-content'),s=nodeByName('language-scroll').getComponent(cc.ScrollView);return {rows:n.children.map(r=>({id:r.name,height:r.getComponent(cc.UITransform).height,font:r.getComponentInChildren(cc.Label).actualFontSize||r.getComponentInChildren(cc.Label).fontSize})),max:s.getMaxScrollOffset().y};});
    assert.equal(menu.rows.length,23,'22 languages plus Follow system expected');assert(menu.rows.every(r=>r.height>=56&&r.font>=20));assert(menu.max>0);
    results.push({width,screen:'languages-top',menu,screenshot:await photo('languages-top')});
    const cdp=await context.newCDPSession(page);
    const swipe=async()=>{
      const b=await page.evaluate(()=>{const n=nodeByName('language-scroll'),h=n.getComponent(cc.UITransform).height*n.worldScale.y;return {x:n.worldPosition.x,top:cc.view.getVisibleSize().height-n.worldPosition.y-h/2,h};});
      const x=b.x*width/390,y1=(b.top+b.h*.82)*width/390,y2=(b.top+b.h*.18)*width/390;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
      for(let i=1;i<=9;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/9}]});await page.waitForTimeout(20);}
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(320);
    };
    for(let i=0;i<7;i++)await swipe();
    assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),'en','Vertical swiping accidentally selected a language');
    const offset=await page.evaluate(()=>nodeByName('language-scroll').getComponent(cc.ScrollView).getScrollOffset().y);assert(offset>menu.max*.9);
    results.push({width,screen:'languages-bottom',offset,screenshot:await photo('languages-bottom')});
    const target=menu.rows[menu.rows.length-1].id;await tap(target);
    assert.equal(await page.evaluate(()=>localStorage.getItem('pm.language.v1')),target.slice('language-'.length));
    const visible=await page.evaluate(id=>{const n=nodeByName(id),v=nodeByName('language-scroll'),half=n.getComponent(cc.UITransform).height/2,viewHalf=v.getComponent(cc.UITransform).height/2;return n.worldPosition.y-half>=v.worldPosition.y-viewHalf-1&&n.worldPosition.y+half<=v.worldPosition.y+viewHalf+1;},target);assert(visible,'The selected language is offscreen after switching');
    results.push({width,screen:'languages-selected',target,screenshot:await photo('languages-selected')});
    await tap('language-back');assert.equal(await page.evaluate(()=>g.screen),'home');assert(await page.evaluate(()=>!!__pm.controls()['settings-language']),'Back should reopen camp settings');
    assert.deepStrictEqual(await page.evaluate(()=>({pets:g.state.pets,team:g.state.team,journey:g.state.journey,eggs:g.state.eggs,hpRatio:g.state.hpRatio})),saved,'Language changes modified the game save');
    await tap('settings-language');assert(await page.evaluate(id=>!!nodeByName(id),target));
    assert.deepStrictEqual(errors,[]);await cdp.detach();await context.close();
    console.log(`PASS language menu + circular avatar ${width}x${height}`);
  }
  fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
