// Current documentation gate: read-only; never touches gameplay or player storage.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),cfg=require('./workflow.config.json');
const exported=cp.spawnSync(process.execPath,['tools/export-design-data.cjs','--check'],{cwd:root,encoding:'utf8',windowsHide:true});
assert.equal(exported.status,0,exported.stderr||exported.stdout);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const docs=[path.join(root,'README.md'),...walk(path.join(root,'docs')).filter(p=>p.endsWith('.md'))];
for(const file of docs){const body=fs.readFileSync(file,'utf8');for(const match of body.matchAll(/\]\(([^)]+)\)/g)){
 const link=match[1].replace(/^<|>$/g,'');if(/^(https?:|#|mailto:)/i.test(link))continue;
 const target=decodeURIComponent(link.split('#')[0]);if(target)assert.ok(fs.existsSync(path.resolve(path.dirname(file),target)),path.relative(root,file)+' -> '+link);
}}
for(const file of ['试玩说明.txt','docs/主界面-v0.8.txt','docs/孵蛋与品质技能-v1.txt','docs/巢穴寻蛋-实施说明.txt','docs/pets/catalog.json','docs/pets/宠物图鉴.html','tools/prepare.py','tools/upgrade-individuals.py','assets/resources/audio/camp.mp3','assets/resources/audio/battle.mp3','art-source/audio-v1/masters/camp.wav','art-source/audio-v1/masters/battle.wav','checks/map-overlap-before.cjs'])assert.ok(!fs.existsSync(path.join(root,file)),'Superseded file remains: '+file);
for(const [name,group] of Object.entries(cfg.scopes))for(const file of [...group.tests,...group.runtime])assert.ok(fs.existsSync(path.join(root,file)),name+': '+file);
const data=JSON.parse(fs.readFileSync(path.join(root,'docs/generated/design-data.json'),'utf8'));
assert.equal(data.counts.forms,data.counts.species*3);assert.equal(data.counts.stages,data.maps.reduce((n,m)=>n+m.stages,0));assert.equal(data.hatching.adReductionMs,1800000);
const obsolete=/54形态与60关|新档只有闪尾狐\/岩背龟两个|尚无属性相克伤害|每1能量减5分钟|1能量减少|三张地图、系列预览/;
for(const file of docs)assert.ok(!obsolete.test(fs.readFileSync(file,'utf8')),'Stale rule: '+path.relative(root,file));
console.log('PASS current docs: generated data fresh, local links valid, obsolete entries absent, module scripts exist, counts and ad reduction match');
