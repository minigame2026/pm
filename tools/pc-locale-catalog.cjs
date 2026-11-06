const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
if(fs.existsSync('pc/i18n/source.json'))throw Error('The catalog already exists. Preserve IDs; append new entries instead of regenerating it.');
const cfg=require('./workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),mods={};
function load(name,dir){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(dir,name+'.ts'),'utf8'),{compilerOptions:{module:1,target:7}}).outputText,{exports,require:p=>mods[p.slice(2)],Map,Set,RegExp});return mods[name]=exports;}
const base=load('PMTranslations','assets/scripts').TRANSLATIONS;load('PMLocale','assets/scripts');const old=load('PCLocale','pc/game');
const entries=new Map(Object.entries(old.PC_EN).filter(([key])=>!base[key]).map(([source,english])=>[source,{source,english,files:['PCLocale.ts']}]));
for(const file of fs.readdirSync('pc/game').filter(f=>f.endsWith('.ts')&&!['PCLocale.ts','PCTranslations.ts'].includes(f))){const ast=ts.createSourceFile(file,fs.readFileSync('pc/game/'+file,'utf8'),ts.ScriptTarget.Latest,true);function visit(n){if((ts.isStringLiteralLike(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n))&&/[\u3400-\u9fff]/.test(n.text)&&!base[n.text]){const e=entries.get(n.text)||{source:n.text,english:old.PC_EN[n.text]||'',files:[]};if(!e.files.includes(file))e.files.push(file);entries.set(n.text,e);}ts.forEachChild(n,visit);}visit(ast);}
for(const [source,english] of Object.entries({'保留原点数':'Keep Current Rolls','第 {n} 场':'Encounter {n}','语言设置立即生效':'Language changes apply immediately'})){entries.set(source,{source,english,files:['PC wording correction']});}
// This was a temporary disclaimer, not game content to retain after completion.
entries.delete('部分新内容仍显示英文或中文');
const rows=[...entries.values()].map((e,i)=>({id:'pc'+String(i+1).padStart(4,'0'),...e}));
fs.mkdirSync('pc/i18n',{recursive:true});fs.writeFileSync('pc/i18n/source.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync('pc/i18n/source.tsv','id\tsource\tEnglish reference\tfiles\n'+rows.map(e=>[e.id,e.source.replace(/\n/g,'\\n'),e.english.replace(/\n/g,'\\n'),e.files.join(',')].join('\t')).join('\n')+'\n');
console.log(JSON.stringify({rows:rows.length,knownEnglish:rows.filter(x=>x.english).length}));
