const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),cfg=require('../tools/workflow.config.json');
const ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
for(const name of ['PMTranslations','PMLocale']){
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:p=>modules[p.replace('./','')],Map,Set,RegExp});
 modules[name]=exports;
}
const L=modules.PMLocale;
for(const [code,want] of Object.entries({'en-US':'en','ja-JP':'ja','ko_KR':'ko','th-TH':'th','zh-CN':'zh-CN','zh-SG':'zh-CN','zh-Hans-TW':'zh-CN','zh-Hant':'zh-TW','zh-Hant-HK':'zh-TW','zh-TW':'zh-TW','zh-MO':'zh-TW','pt_BR':'pt-BR','pt-PT':'pt-BR','es-MX':'es-419','es-AR':'es-419','es-419':'es-419','es-ES':'es-419','id-ID':'id','in-ID':'id','vi-VN':'vi','de-DE':'de','de-AT':'de','fr-FR':'fr','fr-CA':'fr','it-IT':'en','':'en','unknown':'en'}))assert.equal(L.resolveLocale(code),want,code);
L.selectLanguage('ko','ja-JP');assert.equal(L.currentLocale(),'ko');
L.selectLanguage('system','ja-JP');assert.equal(L.currentLocale(),'ja');
L.selectLanguage('bad','it-IT');assert.equal(L.currentLocale(),'en');assert.equal(L.languageChoice(),'system');
const sourceStrings=new Set();
for(const name of ['PMGame','PMModel','TrustedClock','PMRewardedAds']){
 const src=ts.createSourceFile(name,fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),ts.ScriptTarget.Latest,true);
 function walk(n){if(ts.isStringLiteralLike(n)&&/[\u3400-\u9fff]/.test(n.text))sourceStrings.add(n.text);ts.forEachChild(n,walk);}walk(src);
}
for(const lang of ['en','ko','th','pt-BR','es-419','id','vi','de','fr']){
 L.selectLanguage(lang,'zh-CN');
 for(const s of sourceStrings)assert(!/[\u3400-\u9fff]/.test(L.tr(s)),lang+' missing: '+s);
 for(const s of ['HP 9 / 20','9 × 4 = +36','00:59','R / SR / SSR','PM1:abc123'])assert.equal(L.tr(s),s);
}
for(const [key,values] of Object.entries(modules.PMTranslations.TRANSLATIONS)){
 assert.equal(values.length,11,key);
 if(key!==' 回合')assert(values.slice(5).every(v=>v.length>0),'empty expanded translation: '+key);
}
assert.equal(L.LANGUAGES.length,13,'12 languages and system');
L.selectLanguage('zh-CN','en');assert.equal(L.tr('草叶海岸 1/10'),'草叶海岸 1/10');
L.selectLanguage('en','en');assert.equal(L.tr('草叶海岸 1/10'),'Leaf Coast 1/10');assert.equal(L.tr('音乐  开'),'Music  On');
L.selectLanguage('zh-TW','en');assert.equal(L.tr('图鉴'),'圖鑑');assert.equal(L.tr('攻击点数'),'攻擊點數');
console.log('PASS language detection, traditional variants, unsupported fallback, override/system, '+sourceStrings.size+' source fragments, numeric/code preservation and catalog columns');
