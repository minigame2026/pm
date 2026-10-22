// Run after the shared web build: node checks/ui-comfort-care.cjs
// Isolated browser storage. Exercises presentation controls, never the player's save.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const cfg=require('../tools/workflow.config.json');
const {chromium}=require(cfg.playwright),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set,Map});
const now=Date.now(),clone=v=>JSON.parse(JSON.stringify(v));M.setTimeProvider(()=>now);
const base=M.fresh(73,M.PET_IDS.slice(0,16));
base.journey={version:1,stage:'done',hero:'ranger',starter:null,legacy:true};base.expedition=false;
base.stamina={value:30,updatedAt:now};base.pets.forEach((p,i)=>{p.sex=i%2?'male':'female';});
base.pets[0].skills=Object.keys(M.SKILLS).slice(0,6);base.active.skills=[...base.pets[0].skills];
base.pets[2].skills=Object.keys(M.SKILLS).slice(0,6);base.pets[1].skills=Object.keys(M.SKILLS).slice(6,9);
base.pets[5].skills=Object.keys(M.SKILLS).slice(0,6);
base.eggs=[{id:'care-audit',rarity:'SSR',affinity:M.PET_IDS[2],stage:5,mapId:0}];
const ready=M.claimHatch(M.startIncubation(base,'care-audit',0,now-3600000),0,now);
const out='checks/ui-comfort-care';fs.mkdirSync(out,{recursive:true});const report=[];
const partySnapshot=s=>clone(Object.fromEntries(['active','reserve','team','pets','runRoster','combatVitals','hpRatio','hpBonus'].map(k=>[k,s[k]])));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const [width,height,lang] of [[390,844,'zh-CN'],[320,568,'de']]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date(now).toISOString().slice(0,-1)})}));
    await context.route('https://worldtimeapi.org/**',r=>r.abort());
    await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);
    await page.goto(cfg.url);await page.waitForFunction(()=>globalThis.__pm?.ready&&__pm.timeReady(),null,{timeout:120000});
    await page.evaluate(async()=>{globalThis.cc=await System.import('cc');const find=n=>n.components.find(c=>typeof c.hatchery==='function')||n.children.map(find).find(Boolean);globalThis.g=find(cc.director.getScene());globalThis.findNode=(name,n=g.root)=>n.name===name?n:n.children.map(c=>findNode(name,c)).find(Boolean);});
    const settle=async()=>{await page.waitForTimeout(240);await page.waitForFunction(()=>!g.pressPending&&!g.artCache.pending);};
    const tap=async id=>{const p=await page.evaluate(id=>{const c=__pm.controls()[id];if(!c)throw new Error('Missing control '+id);return c;},id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await settle();};
    const image=async name=>{await settle();const file=`${out}/${name}-${width}-${lang}.png`;await page.screenshot({path:file});return file;};
    const load=async(s,route)=>{await page.evaluate(({s,route})=>{g.state=s;g.screen='home';g.render();g.breedMother='';g.breedFather='';g.partnerSelected=null;if(route==='partners')g.collection();if(route==='breed'){g.breedMother=s.pets[2].uid;g.breedFather=s.pets[1].uid;g.breedingUI();}if(route==='hatch')g.hatchery();},{s:clone(s),route});await settle();};

    await load(base,'partners');
    await tap('partner-skill');
    const skills=await page.evaluate(()=>{const n=findNode('skill-scroll'),scroll=n?.getComponent(cc.ScrollView);if(!scroll)throw new Error('Missing scrollable skill page');return {rows:scroll.content.children.length,fonts:scroll.content.children.flatMap(r=>r.children.map(n=>n.getComponent(cc.Label)).filter(Boolean).map(l=>l.actualFontSize||l.fontSize)),max:scroll.getMaxScrollOffset().y};});
    assert.equal(skills.rows,6);assert(skills.fonts.every(n=>n>=18),'Skill text shrank below readable design size');
    report.push({width,lang,screen:'skills-top',skills,screenshot:await image('skills-top')});
    if(skills.max>1){
      const box=await page.evaluate(()=>{const n=findNode('skill-scroll'),h=n.getComponent(cc.UITransform).height*n.worldScale.y;return {x:n.worldPosition.x,top:cc.view.getVisibleSize().height-n.worldPosition.y-h/2,h};});
      const cdp=await context.newCDPSession(page),x=box.x*width/390,y1=(box.top+box.h*.82)*width/390,y2=(box.top+box.h*.2)*width/390;
      for(let swipe=0;swipe<4;swipe++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
        for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/8}]});await page.waitForTimeout(20);}
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(280);
      }
      const offset=await page.evaluate(()=>findNode('skill-scroll').getComponent(cc.ScrollView).getScrollOffset().y);
      report.push({width,lang,screen:'skills-bottom',offset,screenshot:await image('skills-bottom')});
      assert(offset>skills.max*.8,`Skill list did not respond to vertical swiping: offset=${offset}, max=${skills.max}, box=${JSON.stringify(box)}`);
      await cdp.detach();
    }
    await tap('quality-back');assert.equal(await page.evaluate(()=>g.screen),'partners');
    const selected=base.pets[5].uid;await tap('pet-'+selected);
    for(const index of [0,1,2]){
      const before=await page.evaluate(()=>g.state),expected=M.assignPartySlot(before,selected,index);
      await tap('partner-assign-'+index);
      assert.deepStrictEqual(partySnapshot(await page.evaluate(()=>g.state)),partySnapshot(expected),'Quick assignment diverged from the established model');
    }
    report.push({width,lang,screen:'partners',screenshot:await image('partners')});
    assert(await page.evaluate(()=>{const l=findNode('partner-skill').children.map(n=>n.getComponent(cc.Label)).find(Boolean);return (l.actualFontSize||l.fontSize)>=15;}),'Partner skill shortcut text became too small');
    await page.evaluate(()=>{g.state.phase='battle';g.render();});await settle();
    const locked=await page.evaluate(()=>JSON.stringify(g.state));await tap('partner-assign-0');
    assert.equal(await page.evaluate(()=>JSON.stringify(g.state)),locked,'Battle-locked party changed');

    await load(base,'breed');const keys=await page.evaluate(()=>[g.breedMother,g.breedFather]);
    await tap('breed-skills-female');assert.equal(await page.evaluate(()=>findNode('skill-content').children.length),6);
    await tap('quality-back');assert.deepStrictEqual(await page.evaluate(()=>[g.breedMother,g.breedFather]),keys);
    await tap('breed-skill-pool');assert.equal(await page.evaluate(()=>findNode('skill-content').children.length),9,'Inheritance pool did not preserve every unique parental skill');
    await tap('quality-back');report.push({width,lang,screen:'parents',screenshot:await image('parents')});
    await tap('breed-female');const pickerKey=base.pets[2].uid;
    await tap('breed-pick-skills-'+pickerKey);await tap('quality-back');
    assert.deepStrictEqual(await page.evaluate(()=>[g.breedMother,g.breedFather]),keys,'Viewing skills changed the selected parents');
    report.push({width,lang,screen:'parent-picker',screenshot:await image('parent-picker')});
    await tap('breed-pick-'+pickerKey);assert.equal(await page.evaluate(()=>g.breedMother),pickerKey);

    await load(ready,'hatch');const pending=await page.evaluate(()=>JSON.stringify(g.state.pendingHatch));
    await tap('hatch-skills');await tap('quality-back');assert.equal(await page.evaluate(()=>JSON.stringify(g.state.pendingHatch)),pending,'Viewing skills acknowledged the hatch prematurely');
    report.push({width,lang,screen:'hatch-result',screenshot:await image('hatch-result')});
    assert.deepStrictEqual(errors,[]);await context.close();console.log(`care UI ${width}x${height} ${lang}: passed`);
  }
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
