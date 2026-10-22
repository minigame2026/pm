const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8')+'\nexport const probeRoll=roll;',{compilerOptions:{module:1,target:4}}).outputText,{exports:M,Math,Date,JSON,Set});
const copy=x=>JSON.parse(JSON.stringify(x)),saved=s=>{const r=M.restore(JSON.stringify(s));assert(r);return r;};
for(const id of M.PET_IDS)for(const rarity of M.RARITIES){let s=M.fresh(7);s.eggs=[{id:'test',rarity,affinity:id,stage:5,mapId:M.MAPS.find(m=>m.pets.includes(id)).id}];s.surprises={seed:1972,misses:{shiny:0},recipes:[]};s=M.startIncubation(s,'test',0,1000);assert(s.incubators[0].shiny);s=saved(s);s=M.claimHatch(s,0,s.incubators[0].readyAt);const p=s.pets.at(-1);assert(p.shiny);assert.equal(Math.max(...M.petAttackFaces(p)),Math.max(...p.baseFaces)+2);assert.deepEqual(copy(M.petAttackFaces(p)),copy(p.faces.map(v=>v===Math.max(...p.faces)?v+2:v)));saved(s);}
// Fixed chance independent of accumulated misses, including obsolete old-save pity.
for(let seed=0;seed<10000;seed++){let s=M.fresh(7);s.surprises={seed,misses:{shiny:999},recipes:[]};assert.equal(M.surpriseChance(s,'shiny'),((Math.imul(seed,1664525)+1013904223)>>>0)/4294967296<.05);}
const forms=new Set();for(let seed=1;seed<=30;seed++){
 let s=M.fresh(seed,['fox','turtle','bud']);s.pets[0].sex='female';s.pets[0].shiny=true;s.pets[1].sex='male';s.active=copy(s.pets[0]);s.reserve=copy(s.pets[1]);s.runRoster={};const mother=s.pets[0].uid,father=s.pets[1].uid;s=M.assignPartySlot(s,s.pets[2].uid,0);s=M.startBreeding(s,mother,father,1000);
 const genes=s.breeding.genes;forms.add(genes.id);assert.equal(!!genes.shiny,genes.id==='fox');assert.deepEqual(copy(genes.baseFaces),copy(s.pets.find(p=>JSON.stringify(p.baseFaces)===JSON.stringify(genes.baseFaces)).baseFaces));
 s=saved(s);s=M.claimBreeding(s,s.breeding.readyAt);const egg=s.eggs.at(-1);s.surprises={seed:1,misses:{},recipes:[]};s=M.startIncubation(s,egg.id,0,2000000);assert.equal(s.incubators[0].shiny,genes.id==='fox');s=M.claimHatch(saved(s),0,s.incubators[0].readyAt);assert.equal(!!s.pets.at(-1).shiny,genes.id==='fox');saved(s);
}
assert.equal(forms.size,2,'both form sources tested');
let s=M.fresh(4);s.pets[0].shiny=true;s.active=copy(s.pets[0]);s.runRoster={};s=M.act(s,'challenge');s.skill.usedCodes=[];s.skill.nextMax=true;M.probeRoll(s);assert.equal(s.attack,Math.max(...s.active.faces)+2);saved(s);
console.log('PASS 162 forms hatch shiny, fixed 5%, saved result, +2 max only, both inheritance sources, no inherited bonus stacking, max-roll combat');
