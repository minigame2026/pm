const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright);
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017},
}).outputText,{exports:M,Math,Date,JSON,Set});
const KEY='pm.creature-dice.v1',T=Date.now(),out='checks/app-battle';
fs.mkdirSync(out,{recursive:true});
const fixture=M.syncStamina(M.chooseStarter(M.chooseHero(M.newJourney(713),'ranger'),'fox'),T);
const combat=s=>({phase:s.phase,enemyHP:s.enemyHP,hpRatio:s.hpRatio,active:s.active.uid,
 damage:s.skill.lastDamage,taken:s.skill.lastTaken});
const results=[];

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  async function boot(viewport,sample) {
   const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',
    body:JSON.stringify({timeZone:'UTC',dateTime:new Date(T).toISOString().slice(0,-1)})}));
   await context.route('https://worldtimeapi.org/**',r=>r.abort());
   await page.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:KEY,state:fixture});
   await page.goto(cfg.url+(sample?'?appbattle=1':'?appbattlecheck=normal'));
   await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:120000});
   await page.evaluate(async()=>{
    globalThis.cc=await System.import('cc');
    const walk=n=>{const c=n.components.find(c=>typeof c.hatchery==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}};
    globalThis.g=walk(cc.director.getScene());
    globalThis.allNodes=root=>[root,...root.children.flatMap(allNodes)];
   });
   await page.waitForFunction(()=>__pm.timeReady(),null,{timeout:30000});
   await page.waitForFunction(()=>!__pm.animating());
   // Prevent the unrelated 15-second checkpoint timer from changing the baseline.
   await page.evaluate(async()=>{
    g.clockSaveAt=Infinity;g.clockRetryAt=Infinity;
    await g.save();
   });
   await page.waitForTimeout(220);
   return {context,page,errors};
  }
  async function tap(page,id,settle=true) {
   await page.waitForFunction(()=>!__pm.animating());
   const point=await page.evaluate(id=>__pm.controls()[id],id);
   assert.ok(point,'missing control '+id);
   const scale=page.viewportSize().width/390;
   await page.touchscreen.tap(point.x*scale,point.y*scale);
   if(settle) {
    await page.waitForTimeout(240);
    await page.waitForFunction(()=>!__pm.animating(),null,{timeout:30000});
   }
  }
  async function saved(page) {
   return page.evaluate(async key=>{
    const local=Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith(key)).sort().map(k=>[k,localStorage.getItem(k)]));
    const db=g.durableCheckpoint.db;
    const durable=db?await new Promise((resolve,reject)=>{
     const tx=db.transaction('saves','readonly'),request=tx.objectStore('saves').get('current');
     tx.oncomplete=()=>resolve(request.result??null);tx.onerror=tx.onabort=()=>reject(tx.error);
    }):null;
    return {local,durable};
   },KEY);
  }
  async function capture(page,name) {
   await page.waitForTimeout(220); // Let loaded sprite frames reach the canvas.
   await page.screenshot({path:path.join(out,name+'.png')});
  }
  async function armTrace(page) {
   await page.evaluate(()=>{
    globalThis.battleTrace={poses:[],hits:[],life:[],paused:null};
    const trace=battleTrace;
    // Pause only after two browser frames so transient poses/Graphics are drawn.
    const pauseAfterDraw=label=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
     cc.game.pause();trace.paused=label;
    }));
    const pose=g.appPose.bind(g),hurt=g.hurt.bind(g),life=g.lifeTo.bind(g);
    g.appPose=(node,value)=>{
     pose(node,value);
     const actor=g.appActors.get(node),role=actor?.side==='back'?'player':'enemy';
     trace.poses.push({role,pose:value});
     if(node===g.playerNode&&value==='charge'&&!trace.chargeCaptured) {
      trace.chargeCaptured=true;pauseAfterDraw('charge');
     }
    };
    g.hurt=(node,damage,guard,multiplier)=>{
     hurt(node,damage,guard,multiplier);
     const role=node===g.enemyNode?'enemy':'player';
     trace.hits.push({role,damage,effects:allNodes(g.fx).map(n=>n.name).filter(n=>n.startsWith('app-impact-'))});
     if(role==='enemy'&&!trace.impactCaptured) {
      trace.impactCaptured=true;pauseAfterDraw('impact');
     }
    };
    g.lifeTo=(key,ratio,max)=>{trace.life.push({key,ratio,max});return life(key,ratio,max);};
    globalThis.restoreBattleTrace=()=>{g.appPose=pose;g.hurt=hurt;g.lifeTo=life;};
   });
  }

  const normal=await boot({width:390,height:844},false);
  try {
   assert.equal(await normal.page.evaluate(()=>!!__pm.controls()['app-battle-sample']),false);
   assert.equal(await normal.page.evaluate(()=>g.appPresentation),false);
   await normal.page.evaluate(s=>{g.state=s;g.screen='game';g.render();},
    M.act(M.enterExpedition(M.syncStamina(fixture,T),0,T),'challenge'));
   await normal.page.waitForFunction(()=>!__pm.animating());
   await normal.page.waitForTimeout(220);
   assert.equal(await normal.page.evaluate(()=>g.appBattle),null);
   assert.equal(await normal.page.evaluate(()=>g.appActors.size),0);
   assert.equal(await normal.page.evaluate(()=>allNodes(g.root).some(n=>n.name.startsWith('app-coast-'))),false);
   const before=await normal.page.evaluate(()=>__pm.snapshot()),expected=M.act(before,'attack');
   await tap(normal.page,'attack');
   assert.deepEqual(combat(await normal.page.evaluate(()=>__pm.snapshot())),combat(expected),'ordinary browser damage unchanged');
   assert.deepEqual(normal.errors,[]);
   results.push({mode:'ordinary-web',entry:false,effects:false,damage:expected.skill.lastDamage,taken:expected.skill.lastTaken});
  } finally {await normal.context.close();}

  for(const viewport of [{width:390,height:844},{width:320,height:568}]) {
   const {context,page,errors}=await boot(viewport,true);
   try {
    assert.equal(await page.evaluate(()=>g.appPresentation),true);
    const original=await page.evaluate(()=>__pm.snapshot()),beforeSave=await saved(page);
    assert.ok(beforeSave.durable,'isolated durable save is available');
    for(const [index,id] of ['fox','bud','otter'].entries()) {
     await page.evaluate(index=>{g.sampleEnemy=index;},index);
     await tap(page,'app-battle-sample');
     await page.waitForFunction(()=>g.sampleOriginal&&g.state.phase==='encounter'&&!g.busy);
     assert.deepEqual(await saved(page),beforeSave,'enter sample must preserve both saves');
     const choices=await page.evaluate(()=>g.state.pets.map(p=>({id:p.id,uid:p.uid})));
     const selected=choices.find(p=>p.id===id);assert.ok(selected,id);
     if(id==='fox')await tap(page,'pet-'+choices.find(p=>p.id==='bud').uid);
     await tap(page,'pet-'+selected.uid);
     assert.equal(await page.evaluate(()=>g.state.active.id),id);
     await tap(page,'challenge');
     // Low deterministic dice ensure every case includes an enemy retaliation.
     await page.evaluate(()=>{g.state.attack=4;g.state.enemyAttack=4;g.render();});
     await page.waitForFunction(()=>!__pm.animating());
     await page.waitForTimeout(220);
     const view=await page.evaluate(()=>{
      const sheet=g.root.children.find(n=>n.getChildByName('attack')),fill=sheet.getComponent(cc.Graphics).fillColor;
      return {actors:g.appActors.size,ambient:allNodes(g.stage).filter(n=>n.name.startsWith('coast-')).length,
       frames:Object.keys(g.artCache.frames),sources:g.artCache.stats().sources,
       skin:[fill.r,fill.g,fill.b],sprites:[g.playerNode,g.enemyNode].every(n=>!!n.getComponent(cc.Sprite).spriteFrame)};
     });
     assert.equal(view.actors,2);
     assert.ok(view.ambient>0&&view.ambient<=20,'bounded coast ambience');
     assert.deepEqual(view.skin,[242,245,238],'APP battle sheet skin');
     assert.ok(view.sprites,'both actor sprite frames present');
     for(const pet of ['fox','bud','otter']) {
      assert.ok(view.sources.includes('app-'+pet+'-poses-v1'),'loaded pose atlas '+pet);
      for(const side of ['back','front'])for(const pose of ['idle','charge','attack','hurt'])
       assert.ok(view.frames.includes(`app-${pet}-${side}-${pose}`),'loaded pose '+[pet,side,pose].join('/'));
     }
     await capture(page,`app-battle-${viewport.width}-${id}-idle`);
     const before=await page.evaluate(()=>__pm.snapshot()),expected=M.act(before,'attack');
     assert.equal(expected.phase,'battle','fixture must leave both teams fighting');
     assert.ok(expected.enemyHP>0&&expected.skill.lastTaken>0,'fixture must include a damaging retaliation');
     await armTrace(page);
     await tap(page,'attack',false);
     await page.waitForFunction(()=>battleTrace.paused==='charge',null,{timeout:10000});
     assert.equal(await page.evaluate(()=>g.appActors.get(g.playerNode).pose),'charge');
     await capture(page,`app-battle-${viewport.width}-${id}-charge`);
     await page.evaluate(()=>{battleTrace.paused=null;cc.game.resume();});
     await page.waitForFunction(()=>battleTrace.paused==='impact',null,{timeout:10000});
     const element={fox:'fire',bud:'grass',otter:'water'}[id];
     assert.ok(await page.evaluate(element=>allNodes(g.fx).some(n=>n.name==='app-impact-'+element),element),'typed impact '+element);
     assert.equal(await page.evaluate(()=>g.appActors.get(g.enemyNode).pose),'hurt');
     await capture(page,`app-battle-${viewport.width}-${id}-impact`);
     await page.evaluate(()=>{battleTrace.paused=null;cc.game.resume();});
     await page.waitForFunction(()=>!__pm.animating(),null,{timeout:15000});
     const actual=await page.evaluate(()=>__pm.snapshot()),trace=await page.evaluate(()=>battleTrace);
     assert.deepEqual(combat(actual),combat(expected),'display effects must preserve model outcome');
     assert.deepEqual(trace.hits.map(h=>({role:h.role,damage:h.damage})),[
      {role:'enemy',damage:expected.skill.lastDamage},{role:'player',damage:expected.skill.lastTaken},
     ],'one outgoing hit and one retaliation');
     assert.ok(trace.life.some(v=>v.key==='enemy'&&Math.abs(v.ratio-expected.enemyHP/before.enemyMax)<1e-8),'enemy HP updates at hit');
     assert.ok(trace.life.some(v=>v.key==='player'&&Math.abs(v.ratio-expected.hpRatio)<1e-8),'player HP updates at retaliation');
     for(const role of ['player','enemy'])for(const pose of ['charge','attack','hurt'])
      assert.ok(trace.poses.some(p=>p.role===role&&p.pose===pose),role+' '+pose+' observed');
     assert.equal(await page.evaluate(()=>g.busy),false);
     assert.deepEqual(await saved(page),beforeSave,'attack must preserve both saves');
     const disposed=await page.evaluate(()=>{
      restoreBattleTrace();globalThis.finishedEffect=g.appBattle;
      return {nodes:finishedEffect.nodes.size,tweens:finishedEffect.motions.size};
     });
     assert.ok(disposed.nodes>0&&disposed.tweens>0);
     await tap(page,'retreat');
     assert.equal(await page.evaluate(()=>__pm.screen()),'login');
     assert.equal(await page.evaluate(()=>g.sampleOriginal),null);
     assert.equal(await page.evaluate(()=>finishedEffect.disposed&&finishedEffect.nodes.size===0&&finishedEffect.motions.size===0),true);
     assert.deepEqual(await page.evaluate(()=>__pm.snapshot()),original,'exit restores the original player state');
     assert.deepEqual(await saved(page),beforeSave,'exit must preserve both saves');
     results.push({width:viewport.width,height:viewport.height,id,enemy:before.enemy,
      damage:actual.skill.lastDamage,taken:actual.skill.lastTaken,ambient:view.ambient,
      poses:['idle','charge','attack','hurt'],screenshots:['idle','charge','impact'],saveUnchanged:true,cleanup:true});
    }
    assert.deepEqual(errors,[]);
   } finally {await page.evaluate(()=>cc.game.resume()).catch(()=>{});await context.close();}
  }
  fs.writeFileSync(path.join(out,'latest.json'),JSON.stringify({passed:true,results},null,2)+'\n');
  console.log('PASS APP sample: ordinary browser unchanged; 3 pets x 2 phone sizes; pose atlases, charge/attack/hurt, elemental impacts, exact damage and retaliation, busy unlock, isolated local/durable saves preserved, retreat restoration and FX disposal. Screenshots: '+out);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
