const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),M={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports:M,Math,Date,JSON,Set});
assert.equal(M.TYPE_NAMES.length,18);const counts={1:0,1.5:0,.75:0,.5:0};
for(const a of M.TYPE_NAMES)for(const b of M.TYPE_NAMES){const m=M.typeMultiplier(a,b);assert.ok(m in counts);counts[m]++;}
assert.deepEqual(counts,{1:204,1.5:51,.75:61,.5:8});
for(const p of Object.values(M.PETS))assert.ok(M.TYPE_CHART[p.type]);
for(const [a,b,m] of [['电','水',1.5],['水','电',1],['火','草',1.5],['草','火',.75],['冰','冰',.75],['幽灵','幽灵',1.5],['龙','龙',1.5],['一般','一般',1],['钢','恶',1],['钢','幽灵',1],['电','地面',.5],['毒','钢',.5],['格斗','幽灵',.5],['一般','幽灵',.5],['地面','飞行',.5],['超能力','恶',.5],['幽灵','一般',.5],['龙','妖精',.5]])assert.equal(M.typeMultiplier(a,b),m,a+' -> '+b);
function battle(own='fox',enemy='bud',skills=[]){let s=M.act(M.chooseStarter(M.chooseHero(M.newJourney(23),'ranger'),'fox'),'challenge');s.active={...s.active,id:own,skills,baseHP:100};s.pets[0]={...s.active};s.enemy=enemy;s.enemyHP=s.enemyMax=200;s.attack=8;s.enemyAttack=8;s.doubled=false;s.boostMultiplier=3;s.hpRatio=1;s.skill={usedCodes:[],used:false,attacks:0,shield:0,poison:0,nextMax:false,previousRoll:0,event:'',lastDamage:0,lastTaken:0};return s;}
let s=battle();assert.equal(M.attackAmount(s),12);assert.equal(M.enemyAttackAmount(s),6);let n=M.act(s,'attack');assert.equal(n.enemyHP,188);assert.equal(n.skill.lastTaken,6);
s=battle();s.doubled=true;assert.equal(M.attackAmount(s),36);n=M.act(s,'attack');assert.equal(n.skill.lastDamage,36);
s=battle('fox','bud',['opening','heavy']);s.skill.attacks=2;s.doubled=true;assert.equal(M.attackAmount(s),42);n=M.act(s,'attack');assert.equal(n.skill.lastDamage,42);
s=battle('bud','fox');assert.equal(M.attackAmount(s),6);assert.equal(M.enemyAttackAmount(s),12);n=M.act(s,'attack');assert.equal(n.skill.lastTaken,12);
s=battle('spark','mole');assert.equal(M.attackAmount(s),4);s.attack=1;assert.equal(M.attackAmount(s),1);s.enemyAttack=100;n=M.act(s,'guard');assert.equal(n.skill.lastTaken,2); // ground -> electric 150, 99% guard => round(1.5)
s=battle('bud','fox',['armor','slow']);n=M.act(s,'attack');assert.equal(n.skill.lastTaken,8); // 8*1.5 - slow2 - armor2
s=battle('bud','fox',['evade']);n=M.act(s,'attack');assert.equal(n.skill.lastTaken,0);
s=battle('bud','fox');s.skill.shield=12;n=M.act(s,'attack');assert.equal(n.skill.lastTaken,0);assert.equal(n.skill.shield,0);
s=battle('bud','fox',['venom']);n=M.act(s,'attack');assert.equal(n.skill.lastDamage,8); // resisted6 + unscaled poison2
s=battle('fox','bud',['leech']);s.hpRatio=.5;n=M.act(s,'attack');assert.equal(n.skill.lastDamage,12);assert.ok(Math.abs(n.hpRatio-.47)<1e-8); // heal ceil(12*.2)=3 then take6
s=battle('fox','bud');s.enemyHP=2;n=M.act(s,'attack');assert.equal(n.phase,'reward');assert.equal(n.skill.lastDamage,2);assert.equal(n.hpRatio,1);
s=battle('fox','bud');s.hpRatio=.5;s.heal=8;s.healMultiplier=3;n=M.act(s,'heal');assert.ok(Math.abs(n.hpRatio-.74)<1e-8);
// Save shape remains unchanged, deterministic restore midfight, all map ranks share the same chart.
s=M.act(M.chooseStarter(M.chooseHero(M.newJourney(43),'ranger'),'fox'),'challenge');assert.ok(M.restore(JSON.stringify(s)));assert.equal(M.attackAmount(M.restore(JSON.stringify(s))),M.attackAmount(s));
for(const map of M.MAPS)for(const step of [1,5,10]){s=battle();s.mapId=map.id;s.step=step;assert.equal(M.attackAmount(s),12);}
console.log('PASS 324 matchups; 36 series; asymmetry/immunities; potions/fixed skills/poison/leech/guard/shield/evade; rounding; victory; save restore; all ranks');
