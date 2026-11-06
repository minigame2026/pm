const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
function load(name,dir='assets/scripts',extra={}){const exports={},source=fs.readFileSync(path.join(dir,name+'.ts'),'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019},reportDiagnostics:true});assert.equal(compiled.diagnostics.length,0,name+' syntax');vm.runInNewContext(compiled.outputText,{exports,require:p=>extra[p]||modules[p.replace('./','')],Map,Set,WeakMap,RegExp});return modules[name]=exports;}
const compiled=require('../tools/compile-pc-locales.cjs').compile();
load('PMTranslations');load('PMLocale');load('PCTranslations','pc/game');const L=load('PCLocale','pc/game'),catalog=modules.PMTranslations.TRANSLATIONS,pcCatalog=modules.PCTranslations.PC_TRANSLATIONS,langs=L.LANGUAGES.filter(v=>v.id!=='system');
assert.equal(langs.length,22);assert.equal(L.PC_LANGUAGE_KEY,'pm.pc.language.v1');
L.selectPCLanguage(null,'en-US');assert.equal(L.currentLocale(),'zh-CN','existing PC default stays Chinese');
L.selectPCLanguage('system','ja-JP');assert.equal(L.currentLocale(),'ja');
L.selectPCLanguage('en','zh-CN');
assert.equal(L.pcTr('生命药水'),'Healing Potion','longest source match must preserve compound terms');
assert.equal(L.pcTr('草叶海岸 1/10'),'Leaf Coast 1/10');
assert.equal(L.pcTr('回合 2'),'Turn 2');assert.equal(L.pcTr('总伤害 9'),'Damage 9');
assert.equal(L.pcTr('保留原点数'),'Keep Current Roll');assert.equal(L.pcTr('第 4 场 / 10'),'Encounter 4 / 10');assert.equal(L.pcTr('第 4 阶'),'Tier 4');assert.equal(L.pcTr('单人试炼 · 第2阶 · 回合 3'),'Solo Trial · Tier 2 · Turn 3');assert.match(L.pcTr('3 阶 · 6 回合'),/6 turns$/);assert.equal(L.pcTr('第 4 回合'),'Turn 4');
assert.equal(L.pcTr('出发探险   →'),'Set Out   →');assert.equal(L.pcTr('继续冒险  →'),'Continue Adventure  →');
for(const value of ['HP 9 / 20','9 × 4 = +36','00:59','R / SR / SSR','PM1:abc123'])assert.equal(L.pcTr(value),value);
function strings(file){const values=new Set(),source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);function visit(n){if((ts.isStringLiteralLike(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n))&&/[\u3400-\u9fff]/.test(n.text))values.add(n.text);ts.forEachChild(n,visit);}visit(source);return [...values];}
const files=fs.readdirSync('pc/game').filter(f=>f.endsWith('.ts')&&!['PCLocale.ts','PCTranslations.ts'].includes(f)),fileAudit=[];
for(const file of files){const source=strings('pc/game/'+file),missing=source.map(value=>({source:value,english:L.pcTr(value)})).filter(v=>/[\u3400-\u9fff]/.test(v.english));fileAudit.push({file,sourceFragments:source.length,englishUntranslated:missing.length,missing});}
for(const row of fileAudit)assert.equal(row.englishUntranslated,0,row.file+' untranslated PC source');
const core=strings('assets/scripts/PMModel.ts');for(const value of core)assert(!/[\u3400-\u9fff]/.test(L.pcTr(value)),'model/name/type translation '+value);
for(const [source,row] of Object.entries(catalog)){assert.equal(row.length,21,source);assert(row.every(v=>typeof v==='string'),'invalid translation row '+source);}
const localeAudit=langs.map((lang,i)=>{L.selectPCLanguage(lang.id,'en');assert.equal(L.currentLocale(),lang.id);
  for(const [source,row]of Object.entries(pcCatalog)){
    const expected=lang.id==='zh-CN'?source:row[lang.id];assert.equal(typeof expected,'string');assert.equal(L.pcTr(source),expected,lang.id+' exact PC translation '+source);
    if(!['zh-CN','zh-TW','ja'].includes(lang.id))assert(!/[\u3400-\u9fff]/.test(expected),lang.id+' retained Chinese '+source);
  }
  for(const kind of ['场','阶'])assert.equal(L.pcTr('第 37 '+kind),(lang.id==='zh-CN'?'第 {n} '+kind:pcCatalog['第 {n} '+kind][lang.id]).replace('{n}','37'),lang.id+' numbered phrase');
  return {locale:lang.id,name:lang.name,availableInPC:true,baseTranslationRows:lang.id==='zh-CN'?Object.keys(catalog).length:Object.values(catalog).filter(row=>row[i-1]!==undefined&&row[i-1]!=='').length,pcTranslatedRows:Object.keys(pcCatalog).length,pcNewEnglishFallbackKeys:0,font:L.pcFont(),nativeDisplayVerified:false};});
// Exercise the actual PC Label wrapper with later writes and switch-back, without a game save or engine.
class Label {get string(){return this._string||'';}set string(v){this._string=v;this.writes=(this.writes||0)+1;}constructor(){this.isValid=true;}}
Label.CacheMode={NONE:0};Label.HorizontalAlign={LEFT:0,CENTER:1,RIGHT:2};Label.VerticalAlign={CENTER:1};Label.Overflow={SHRINK:1};
class UITransform {setContentSize(){}}
class Node {constructor(name){this.name=name;this.children=[];this.components=[];}addChild(n){this.children.push(n);n.parent=this;}setPosition(){}addComponent(T){const c=new T();c.node=this;this.components.push(c);return c;}getComponentsInChildren(T){return [...this.components.filter(c=>c instanceof T),...this.children.flatMap(n=>n.getComponentsInChildren(T))];}}
class Color {static fromHEX(){}}
const {PCUI}=load('PCUI','pc/game',{'cc':{Node,UITransform,Label,Color,Layers:{Enum:{UI_2D:1}}},'./PMArt':{}}),root=new Node('root'),ui=new PCUI(root,{});
L.selectPCLanguage('en','en');const label=ui.text(root,'回合 1',0,0);assert.equal(label.string,'Turn 1');label.string='总伤害 9';assert.equal(label.string,'Damage 9');L.selectPCLanguage('zh-CN','en');ui.refreshLanguage();assert.equal(label.string,'总伤害 9','switch-back restores source, not translated result');L.selectPCLanguage('en','en');ui.refreshLanguage();assert.equal(label.string,'Damage 9');assert(label.writes>=4,'engine Label setter receives updates');
const report={generatedAt:new Date().toISOString(),scope:'Source coverage, placeholders, all PC translations, numbered phrases and dynamic Label updates; not native font or mother-tongue acceptance.',locales:localeAudit,baseTranslationKeys:Object.keys(catalog).length,pcTranslationKeys:Object.keys(pcCatalog).length,translatedCells:compiled.translations,pcOnlyEnglishFallbackKeys:0,coreModelChineseFragments:core.length,files:fileAudit,limitations:['Source completeness does not establish mother-tongue editorial review.','Native Windows text shaping and reading order require native checks; browser evidence is separate.']};
fs.mkdirSync('checks/pc-locale',{recursive:true});fs.writeFileSync('checks/pc-locale/source-audit.json',JSON.stringify(report,null,2));
console.log('PASS 22 PC locale choices, complete PC catalogs, placeholders, numbered phrases, all PC source coverage, dynamic Label writes and language switch-back.');console.log(JSON.stringify({baseKeys:report.baseTranslationKeys,pcKeys:report.pcTranslationKeys,translatedCells:report.translatedCells,pcOnlyFallbackKeys:0}));
