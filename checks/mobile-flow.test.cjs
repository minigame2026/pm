const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
let s=M.fresh(42);assert.equal(s.swaps,1);assert.equal(M.grantRerollAd(s,true),s);s=M.act(s,'reroll');assert.equal(s.swaps,0);assert.equal(M.act(s,'reroll'),s);assert.equal(M.grantRerollAd(s,false),s);
for(let i=0;i<5;i++){const next=M.grantRerollAd(s,true);assert.notEqual(next,s);assert.notEqual(next.enemy,s.enemy);assert.equal(next.swaps,0);s=M.restore(JSON.stringify(next));assert.ok(s);assert.equal(s.swaps,0);}
assert.equal(M.grantRerollAd(M.act(s,'challenge'),true).phase,'battle');
const boss={...s,step:10};assert.equal(M.grantRerollAd(boss,true),boss);
for(const [old,expected] of [[2,1],[1,0],[0,0]]){const legacy=M.fresh(42);delete legacy.rerollVersion;legacy.swaps=old;const migrated=M.restore(JSON.stringify(legacy));assert.equal(migrated.swaps,expected);assert.equal(M.restore(JSON.stringify(migrated)).swaps,expected);}
console.log('PASS: one free refresh; each completed ad grants one immediate refresh; cancellation, battle, BOSS blocked; legacy remaining count migrated once; reload cannot refill');
