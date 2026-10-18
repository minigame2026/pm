const {chromium}=require('C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8780/');await page.waitForFunction(()=>globalThis.__pm?.ready);
 const c=await page.evaluate(()=>__pm.controls().challenge);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(700);
 await page.screenshot({path:__dirname+'/final-battle.png'});
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(500);
 await page.screenshot({path:__dirname+'/final-small-battle.png'});
 fs.writeFileSync(__dirname+'/visual-result.json',JSON.stringify({errors,state:await page.evaluate(()=>__pm.snapshot())},null,2));
 if(errors.length)throw Error(errors.join('\n'));console.log('Battle view checked at 390x844 and 320x568; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
