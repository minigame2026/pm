// Narrow regression: long skill descriptions in the ten added languages.
// Run after the shared build. Does not modify the player's browser or save.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
for(const name of ['PMTranslations','PMLocale','PMModel']){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:p=>modules[p.replace('./','')],Math,Date,JSON,Set,Map,RegExp});modules[name]=exports;}
const M=modules.PMModel,L=modules.PMLocale,langs=['hi','ar','ru','ur','bn','tr','fil','mr','te','ta'],bottomScreens=new Set(['ar','ur','ta']);
const now=Date.now();M.setTimeProvider(()=>now);const state=M.syncStamina(M.fresh(42,['fox','turtle','bud']),now);state.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};state.expedition=false;
const out='checks/locale-long-text',report=[];fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const lang of langs){
  if(process.env.PM_LOCALE_LONG_TEXT&&process.env.PM_LOCALE_LONG_TEXT!==lang)continue;
  L.selectLanguage(lang,'en');const codes=Object.keys(M.SKILLS).sort((a,b)=>L.tr(M.SKILLS[b][1]).length-L.tr(M.SKILLS[a][1]).length).slice(0,8);
  const context=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));
  await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);
  await page.goto(cfg.url+'?locale-long-text='+lang);await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
  await page.evaluate(async({state,codes})=>{globalThis.cc=await System.import('cc');const find=n=>n.components.find(c=>typeof c.scrollSkillDetails==='function')||n.children.map(find).find(Boolean);globalThis.g=find(cc.director.getScene());globalThis.findNode=(name,n=g.root)=>n.name===name?n:n.children.map(c=>findNode(name,c)).find(Boolean);g.state=state;g.screen='home';g.render();g.scrollSkillDetails('Skills',codes,()=>{});await document.fonts.ready;},{state:JSON.parse(JSON.stringify(state)),codes});
  await page.waitForTimeout(350);
  const metrics=await page.evaluate(()=>{
    const content=findNode('skill-content'),scroll=findNode('skill-scroll').getComponent(cc.ScrollView),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
    const rows=content.children.map(row=>{
      const height=row.getComponent(cc.UITransform).height,labels=row.children.map(n=>n.getComponent(cc.Label)).filter(Boolean).map(label=>{
        const layout=label.textLayoutData,style=label.textStyle,t=label.node.getComponent(cc.UITransform),lines=layout?.parsedString;
        if(!Array.isArray(lines)||!lines.length||!style?.fontDesc)throw Error('Cocos rendered-line data unavailable for '+label.string);
        context.font=style.fontDesc;context.textAlign='left';context.direction=label.assemblerData?.context?.direction||'inherit';
        const renderScale=layout.canvasSize.width/t.width;
        if(!(renderScale>0))throw Error('Invalid text canvas scale');
        const measure=text=>{const m=context.measureText(text);return {advance:m.width/renderScale,ink:(m.actualBoundingBoxLeft+m.actualBoundingBoxRight)/renderScale};};
        return {text:label.string,wrap:label.enableWrapText,font:label.fontSize,actualFont:label.actualFontSize,fontDesc:style.fontDesc,renderScale,width:t.width,height:t.height,top:label.node.position.y+t.height/2,bottom:label.node.position.y-t.height/2,unwrapped:measure(label.string.replace(/\n/g,' ')),lines:lines.map(text=>({text,...measure(text)}))};
      });
      return {id:row.name,top:row.position.y+height/2,bottom:row.position.y-height/2,height,labels};
    });
    return {rows,maxScroll:scroll.getMaxScrollOffset().y,viewportHeight:scroll.node.getComponent(cc.UITransform).height};
  });
  const entry={lang,codes,...metrics,topScreenshot:out+'/'+lang+'-top-320.png'};report.push(entry);await page.screenshot({path:entry.topScreenshot});save();
  assert.equal(metrics.rows.length,8,lang+' skill count');
  let multiLineDescriptions=0;
  for(let i=0;i<metrics.rows.length;i++){
    const row=metrics.rows[i];assert.equal(row.labels.length,2,lang+' title/description pair');
    if(i)assert(row.top<=metrics.rows[i-1].bottom-10,lang+' overlapping skill cards '+row.id);
    for(const [j,label] of row.labels.entries()){
      assert(label.wrap||label.lines.length>=1,lang+' missing preformatted lines '+row.id);
      const expected=L.tr(M.SKILLS[codes[i]][j]);assert.equal(label.text.replace(/\s/g,''),expected.replace(/\s/g,''),lang+' source text changed '+row.id);
      assert(label.width<=310.1,lang+' text area too wide '+row.id);
      assert(label.top<=row.height/2+.1&&label.bottom>=-row.height/2-.1,lang+' label outside card '+row.id);
      assert.equal(label.lines.map(l=>l.text).join('').replace(/\s/g,''),label.text.replace(/\s/g,''),lang+' rendered text lost content '+row.id);
      for(const line of label.lines){assert(line.advance<=312&&line.ink<=312,lang+' rendered line exceeds 310px +2px ink tolerance: '+JSON.stringify({row:row.id,line}));}
      if(label.unwrapped.advance>312)assert(label.lines.length>1,lang+' long text did not wrap '+row.id);
      if(j===1&&label.lines.length>1)multiLineDescriptions++;
    }
    assert(row.labels[1].top<=row.labels[0].bottom-8,lang+' title/description overlap '+row.id);
  }
  assert(multiLineDescriptions>=6,lang+' fixture does not exercise enough long descriptions');assert(metrics.maxScroll>0,lang+' expected scrolling');
  const cdp=await context.newCDPSession(page),box=await page.evaluate(()=>{const n=findNode('skill-scroll'),h=n.getComponent(cc.UITransform).height;return {x:n.worldPosition.x,top:cc.view.getVisibleSize().height-n.worldPosition.y-h/2,h};});
  const k=320/390,x=box.x*k,y1=(box.top+box.h*.83)*k,y2=(box.top+box.h*.17)*k,maxSwipes=Math.min(40,Math.ceil(metrics.maxScroll/(box.h*.5))+4);
  let offset=0;
  for(let swipe=0;swipe<maxSwipes&&offset<metrics.maxScroll-2;swipe++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
    for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/8}]});await page.waitForTimeout(20);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);
    offset=await page.evaluate(()=>findNode('skill-scroll').getComponent(cc.ScrollView).getScrollOffset().y);
  }
  entry.bottomOffset=offset;
  if(bottomScreens.has(lang)){entry.bottomScreenshot=out+'/'+lang+'-bottom-320.png';await page.screenshot({path:entry.bottomScreenshot});}
  save();assert(offset>=metrics.maxScroll-2,lang+' could not reach last skill with touch scrolling');
  const endVisible=await page.evaluate(()=>{const v=findNode('skill-scroll'),c=findNode('skill-content'),last=c.children[c.children.length-1],h=v.getComponent(cc.UITransform).height,lastH=last.getComponent(cc.UITransform).height,y=last.worldPosition.y-lastH/2;return y>=v.worldPosition.y-h/2-1&&y<=v.worldPosition.y+h/2;});assert(endVisible,lang+' final card bottom not visible');
  assert.deepEqual(errors,[]);await cdp.detach();await context.close();console.log('PASS long skill text',lang,'8 cards, actual rendered line widths, complete text and touch scroll');
 }
}finally{save();await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
