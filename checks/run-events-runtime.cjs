/* Expanded encounters: real canvas UI, localized copy, touch continuation and saved effects. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
for(const name of ['PMTranslations','PMLocale','PMModel']){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:p=>modules[p.replace('./','')],Math,Date,JSON,Set,Map,RegExp});modules[name]=exports;}
const M=modules.PMModel,L=modules.PMLocale,T=Date.now(),copy=x=>JSON.parse(JSON.stringify(x)),out='checks/run-events-expanded',results=[];
fs.mkdirSync(out,{recursive:true});M.setTimeProvider(()=>T);
function base(){const s=M.fresh(91,['fox','turtle','bud']);s.journey={version:1,stage:'done',hero:'ranger',starter:'fox',legacy:true};s.expedition=true;s.hpRatio=.6;s.potions=1;s.boosts=2;const party=M.homeParty(s);assert.equal(party.filter(Boolean).length,3);s.combatVitals[party[1]]={hpRatio:0,hpBonus:0};s.combatVitals[party[2]]={hpRatio:.4,hpBonus:0};const ready=M.syncStamina(s,T);ready.expedition=true;return ready;}
const rewards=s=>copy({eggs:s.eggs,runEffects:s.runEffects||{},potions:s.potions,boosts:s.boosts});
(async()=>{assert.equal(M.BATTLE_EVENT_KINDS.length,20);assert.equal(M.TEMP_SKILLS.length,32);const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height,lang] of [[390,844,'zh-CN'],[320,568,'en'],[320,568,'de'],[320,568,'ta']]){
  L.selectLanguage(lang,lang);const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  // A trusted server advances across reloads; a frozen value would correctly trip the clock's rollback protection.
  await context.route('https://timeapi.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({timeZone:'UTC',dateTime:new Date().toISOString().slice(0,-1)})}));await context.route('https://worldtimeapi.org/**',r=>r.abort());
  await page.addInitScript(lang=>localStorage.setItem('pm.language.v1',lang),lang);
  async function ready(){await page.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});try{await page.waitForFunction(()=>__pm.timeReady(),null,{timeout:15000});}catch(e){throw new Error('Trusted clock failed after boot/reload: '+JSON.stringify(await page.evaluate(()=>({ready:__pm.ready,timeReady:__pm.timeReady(),screen:__pm.screen()})))+'; '+e.message);}}
  await page.goto(cfg.url+'?events=expanded');await ready();
  const bind=()=>page.evaluate(async()=>{
   globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.battleEventUI==='function');if(c)return c;for(const ch of n.children){const f=walk(ch);if(f)return f;}}globalThis.g=walk(cc.director.getScene());
   globalThis.eventNode=(name,n=g.root)=>n.name===name?n:n.children.map(c=>eventNode(name,c)).find(Boolean);
   globalThis.eventLabels=()=>{const all=[],title=eventNode('event-title'),sheet=title?.parent;function walk(n){const l=n.getComponent(cc.Label);if(l&&l.string){const u=n.getComponent(cc.UITransform),p=n.worldPosition,s=n.worldScale;all.push({node:n.name,text:l.string,font:l.fontSize,actual:l.actualFontSize||l.fontSize,x:p.x-u.width*s.x*u.anchorX,y:p.y-u.height*s.y*u.anchorY,w:u.width*s.x,h:u.height*s.y,scale:s.y});}n.children.forEach(walk);}if(sheet)walk(sheet);return all;};
  });await bind();
  async function idle(){await page.waitForFunction(()=>!g.busy&&!g.pressPending&&!__pm.animating()&&!g.artCache.pending);await page.waitForTimeout(140);}
  async function seed(s){await idle();await page.evaluate(s=>{g.state=s;g.screen='game';g.save();g.render();},s);await idle();}
  async function tap(id){await idle();await page.waitForFunction(()=>performance.now()-g.lastTap>=200);const p=await page.evaluate(id=>__pm.controls()[id],id);assert(p,id);await page.touchscreen.tap(p.x*width/390,p.y*width/390);await idle();}
  async function inspect(key,screenshot=false){
   const labels=await page.evaluate(()=>eventLabels()),size=await page.evaluate(()=>({w:cc.view.getVisibleSize().width,h:cc.view.getVisibleSize().height}));assert(labels.length,'event text visible: '+key);
   for(const l of labels){assert(l.x>=-1&&l.y>=-1&&l.x+l.w<=size.w+1&&l.y+l.h<=size.h+1,`${lang}/${key} outside screen: ${JSON.stringify(l)}`);assert(l.actual>=Math.min(11,l.font),`${lang}/${key} unreadable shrink: ${JSON.stringify(l)}`);if(lang!=='zh-CN')assert(!/[\u3400-\u9fff]/.test(l.text),`${lang}/${key} untranslated: ${l.text}`);}
   const title=labels.find(l=>l.node==='event-title'),card=await page.evaluate(()=>{const n=eventNode('event-detail'),u=n.getComponent(cc.UITransform);return {x:n.worldPosition.x-u.width/2,y:n.worldPosition.y-u.height/2,w:u.width,h:u.height};}),button=await page.evaluate(()=>__pm.controls().eventContinue);
   assert(title.y>=card.y+card.h-1,'title clears detail card');assert(button.y*width/390+button.h*width/780<=height+1,'continue within viewport');assert(button.h*width/390>=45,'continue keeps mobile touch size');
   const detail=labels.find(l=>l.node==='event-skill-description');if(detail){assert(detail.y>=card.y-1&&detail.y+detail.h<=card.y+card.h+1,'skill description stays inside its card');assert(detail.actual>=11,`${lang}/${key} skill description unreadable`);}
   const screenshotPath=screenshot?`${out}/${width}-${lang}-${key}.png`:undefined;if(screenshotPath)await page.screenshot({path:screenshotPath});results.push({width,height,lang,key,labels,screenshot:screenshotPath});
   fs.writeFileSync(`${out}/report.json`,JSON.stringify({results},null,2));return labels;
  }
  for(const kind of M.BATTLE_EVENT_KINDS){
   const s=M.grantBattleEvent(base(),kind);assert.equal(s.phase,'event',kind+' eligible fixture');assert.equal(s.battleEvent.kind,kind);assert(M.restore(JSON.stringify(s)),kind+' restores');await seed(s);
   const labels=await inspect(kind,lang==='zh-CN'||lang==='en'||['teamHeal','reviveHalf','focus','potionLesson'].includes(kind));assert(labels.some(l=>l.node==='event-title'&&l.text===L.tr(M.BATTLE_EVENTS[kind].title)),kind+' localized title');
   const expected=copy(await page.evaluate(()=>g.state));assert.deepEqual(rewards(expected),rewards(s),'render does not grant again');
   if((lang==='zh-CN'&&kind==='learn')||(lang==='en'&&['ward','supplies','affinityEgg'].includes(kind))){
    await page.reload();await ready();await bind();await tap('start-game');
    const restored=await page.evaluate(()=>g.state);assert.equal(restored.phase,'event');assert.deepEqual(copy(restored.runEffects||{}),copy(expected.runEffects||{}));assert.deepEqual(copy(restored.battleEvent),expected.battleEvent);assert.deepEqual(rewards(restored),rewards(expected),'reopen does not reroll/regrant rewards');await inspect(kind+'-reloaded');
   }
   await tap('eventContinue');const next=await page.evaluate(()=>g.state);assert.equal(next.step,2);assert.equal(next.phase,'encounter');assert(M.restore(JSON.stringify(next)));assert.deepEqual(rewards(next),rewards(expected),'continue does not duplicate or discard rewards');
   if(kind==='giant'&&(lang==='zh-CN'||lang==='en')){
    let b=M.act(s,'eventContinue');b=M.selectActive(b,s.battleEvent.uid);b=M.act(b,'challenge');await seed(b);
    const giant=await page.evaluate(()=>g.playerNode.getComponent(cc.UITransform).width*g.playerNode.scale.x);await page.screenshot({path:`${out}/${width}-${lang}-giant-battle.png`});
    const normal=copy(b);delete normal.runEffects;await seed(normal);const size=await page.evaluate(()=>g.playerNode.getComponent(cc.UITransform).width*g.playerNode.scale.x);assert(Math.abs(giant/size-1.5)<.03,'actual sprite enlarged 50%');
   }
  }
  // New attack/health buffs must appear in the existing encounter and reward previews.
  for(const kind of ['power','vitality']){
   const event=M.grantBattleEvent(base(),kind),uid=event.battleEvent.uid;let s=M.selectActive(M.act(event,'eventContinue'),uid);await seed(s);
   if(kind==='power'){
    const actual=await page.evaluate(()=>eventNode('encounter-party').children.filter(n=>n.position.y===135&&n.position.x>=60).map(n=>n.children.map(c=>c.getComponent(cc.Label)).find(Boolean)?.string).filter(Boolean));
    const expected=M.petAttackFaces(s.active).map(v=>String(M.typedDamage(v*M.runAttackMultiplier(s,uid)*M.gymBonus(s,s.active.id),M.matchupMultiplier(s.active.id,s.enemy))));assert.deepEqual(actual,copy(expected),'encounter shows buffed attack dice');
   }else{
    s.phase='reward';s.reward={kind:'hp',values:[3],title:'生命上限 +3'};let claimed;for(let n=1;n<100;n++){s.seed=n;claimed=M.act(s,'take');if(claimed.phase==='encounter')break;}assert.equal(claimed.phase,'encounter');await seed(s);
    const labels=await page.evaluate(()=>{const out=[];function walk(n){const l=n.getComponent(cc.Label);if(l)out.push(l.string);n.children.forEach(walk);}walk(g.root);return out;});
    for(const key of M.homeParty(s).filter(Boolean))assert(labels.includes(M.petCombat(s,key).max+' → '+M.petCombat(claimed,key).max),'health reward preview includes temporary health multiplier');
   }
  }
  // Exercise every possible learned move, not merely the seeded random result.
  for(const skill of M.TEMP_SKILLS){
   const s=M.grantBattleEvent(base(),'learn'),uid=s.battleEvent.uid;s.battleEvent.skill=skill;s.runEffects[uid].skills=[skill];assert(M.restore(JSON.stringify(s)));await seed(s);
   const labels=await inspect(skill,['tm_repeatFocus','tm_resistBreak','tm_boostRefund','tm_guardSupply'].includes(skill));assert(labels.some(l=>l.text===L.tr(M.SKILLS[skill][0])),lang+' skill name '+skill);assert.equal(labels.find(l=>l.node==='event-skill-description').text,L.tr(M.SKILLS[skill][1]),lang+' skill description '+skill);
  }
  assert.deepEqual(errors,[]);console.log(`PASS ${width} ${lang}: all 20 event UIs, touch continuation, saved rewards; all 32 learned skills readable/localized`);await context.close();
 }
 console.log('PASS expanded events: 80 encounter views, 128 learned move views, persisted/reopened effects, no duplicate rewards, actual giant scale +50%');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
