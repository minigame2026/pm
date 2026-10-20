// Keep release checks derived from the current module registry.
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'workflow.config.json'),cfg=JSON.parse(fs.readFileSync(file,'utf8'));
const scopes=Object.entries(cfg.scopes).filter(([name])=>name!=='release').map(([,value])=>value);
cfg.scopes.release={
 tests:[...new Set(scopes.flatMap(s=>s.tests).concat('checks/release-soak.test.cjs'))],
 runtime:[...new Set(scopes.flatMap(s=>s.runtime).concat('checks/release-audit-runtime.cjs'))]
};
fs.writeFileSync(file,JSON.stringify(cfg,null,2)+'\n');
console.log('Registered release suite: '+cfg.scopes.release.tests.length+' rule/tool scripts, '+cfg.scopes.release.runtime.length+' browser scripts.');
