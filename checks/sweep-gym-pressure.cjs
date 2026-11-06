const fs=require('fs'),path=require('path');
const bootstrap=fs.readFileSync(path.join(__dirname,'simulate-gym-comparison.cjs'),'utf8').split('const report=')[0];
const {A,M}=new Function('require','__dirname',bootstrap+'\nreturn {A,M};')(require,__dirname);
const snapshots=JSON.parse(fs.readFileSync(path.join(__dirname,'gym-comparison-checkpoints.json'),'utf8'));
const results=[];
const candidates=[[1.1],[1.1],[.7,.74,.78],[.63,.67,.7],[.93,.99,1.03],[.67,.7,.73],[.59,.62,.65],[.69,.73,.77],[.84,.88,.92]];
for(let map=0;map<9;map++)for(const pressure of candidates[map]){
 M.GYM_SMOOTH_PRESSURE[map]=pressure;const rows=[];
 for(const checkpoint of snapshots.filter(x=>x.map===map))for(let n=0;n<3;n++){
  A.setNow(checkpoint.savedTime+(n+1)*719233);
  const start=A.copy(checkpoint.state);start.seed=A.getNow()>>>0;
  const team=A.team(start,map,M.gymEnemyPool(map));rows.push(A.run(team,map,true,true,true).stats);
 }
 const r={map:map+1,pressure,n:rows.length,win:rows.filter(x=>x.won).length,winRate:+(rows.filter(x=>x.won).length/rows.length*100).toFixed(1)};
 results.push(r);console.log(JSON.stringify(r));
 fs.writeFileSync(path.join(__dirname,'gym-pressure-sweep.json'),JSON.stringify(results,null,2));
}
