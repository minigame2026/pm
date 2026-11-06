const fs=require('fs'),path=require('path');
const prefix=fs.readFileSync('checks/simulate-gym-comparison.cjs','utf8').split('const report=')[0];
const {A,M}=new Function('require','__dirname',prefix+'\nreturn {A,M};')(require,path.resolve('checks'));
const r=JSON.parse(fs.readFileSync('checks/gym-comparison-report.json','utf8')),snapshots=JSON.parse(fs.readFileSync('checks/gym-comparison-checkpoints.json','utf8'));
for(const row of r.pairs.filter(x=>x.map===5)){
 const cp=snapshots.find(x=>x.map===row.map&&x.starter===row.starter&&x.breeding===row.breeding&&x.career===row.career),time=cp.savedTime+(row.repeat+1)*719233;
 const start=A.copy(cp.state);start.seed=time>>>0;
 A.setNow(time);row.gym=A.run(A.copy(start),5,true,true,true).stats;
 A.setNow(time);row.gymPrepared=A.run(A.team(A.copy(start),5,M.gymEnemyPool(5)),5,true,true,true).stats;
}
for(const kind of ['gym','gymPrepared']){const rows=r.pairs.filter(x=>x.map===5).map(x=>x[kind]),wins=rows.filter(x=>x.won);r.summary[5][kind]={wins:wins.length,n:rows.length,winRate:+(100*wins.length/rows.length).toFixed(1),meanDeaths:+A.mean(rows.map(x=>x.deaths)).toFixed(2),meanTurns:+A.mean(rows.map(x=>x.turns)).toFixed(1),winMedianTurns:A.q(wins.map(x=>x.turns),.5),deathFloors:Array.from({length:10},(_,i)=>rows.filter(x=>x.deathFloor===i+1).length)};}
r.sourceSHA=require('crypto').createHash('sha256').update(fs.readFileSync('assets/scripts/PMModel.ts')).digest('hex');r.pressure=Array.from(M.GYM_ATTACK_PRESSURE);
fs.writeFileSync('checks/gym-comparison-report.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r.summary[5]));
