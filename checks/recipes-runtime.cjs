const cfg=require('../tools/workflow.config.json'),{chromium}=require(cfg.playwright),assert=require('assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:320,height:568}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.addInitScript(()=>localStorage.setItem('pm.language.v1','en'));await p.goto(cfg.url);await p.waitForFunction(()=>globalThis.__pm?.ready,null,{timeout:60000});
 await p.evaluate(async()=>{globalThis.cc=await System.import('cc');function walk(n){const c=n.components.find(c=>typeof c.recipeBook==='function');if(c)return c;for(const ch of n.children){const c=walk(ch);if(c)return c;}}globalThis.g=walk(cc.director.getScene());g.state.surprises={seed:1,misses:{},recipes:['steam','firefly','moon','valor','cloudwing','spore','crystal','frostarmor','dream']};g.nativeApp=true;g.recipeBook();});await p.waitForTimeout(400);
 for(let i=0;i<3;i++){
  await p.screenshot({path:'checks/recipes-en-native-'+i+'.png'});
  const r=await p.evaluate(()=>{function find(n){if(n.name==='recipes-swipe')return n;for(const c of n.children){const v=find(c);if(v)return v;}}const n=find(g.root);return {x:n.worldPosition.x,y:cc.view.getVisibleSize().height-n.worldPosition.y,page:n.getComponent(cc.PageView).getCurrentPageIndex()};});assert.equal(r.page,i);
  if(i<2){const k=320/390;await p.mouse.move(r.x*k,r.y*k);await p.mouse.down();for(let j=1;j<=8;j++){await p.mouse.move((r.x-90*j/8)*k,r.y*k);await p.waitForTimeout(25);}await p.mouse.up();await p.waitForTimeout(600);}
 }
 assert.deepEqual(errors,[]);console.log('PASS English 320x568 all 9 discovered recipes, APP-mode swipe across 3 pages');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
