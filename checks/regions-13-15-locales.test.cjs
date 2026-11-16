// New catalog coverage only; never touches browser or user saves.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const cfg=require('../tools/workflow.config.json'),ts=require(path.join(path.dirname(cfg.typescript),'typescript.js')),modules={};
for(const name of ['PMTranslations','PMLocale','PMModel']){
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/'+name+'.ts','utf8'),{compilerOptions:{module:1,target:4}}).outputText,{exports,require:p=>modules[p.replace('./','')],Math,Date,JSON,Map,Set,RegExp});modules[name]=exports;
}
const {PMModel:M,PMLocale:L,PMTranslations:T}=modules,roster=JSON.parse(fs.readFileSync('art-source/regions-13-15/roster.json','utf8'));
const texts=new Set(roster.maps.map(m=>m.name));
for(const p of roster.pets)for(const [tier,form] of p.forms.entries()){
 texts.add(M.petName({id:p.id,rarity:form.rarity}));
 const skill=M.petSkills({id:p.id,rarity:form.rarity})[0];assert.equal(skill,p.skills[tier].code);
 for(const text of M.SKILLS[skill])texts.add(text);
}
const digits=s=>s.replace(/\p{Nd}/gu,c=>{const n=c.codePointAt(0);for(const z of [48,1632,1776,2406,2534,2662,2790,2918,3046,3174,3302,3430,3664,3792,65296])if(n>=z&&n<=z+9)return String(n-z);return c;});
let n=0;for(const {id:lang} of L.LANGUAGES.filter(l=>l.id!=='system')){
 L.selectLanguage(lang,lang);
 for(const source of texts){const result=L.tr(source);assert(result.trim(),lang+' empty '+source);
  if(!['zh-CN','zh-TW','ja'].includes(lang))assert(!/[\u3400-\u9fff]/.test(result),lang+' untranslated '+source);
  for(const value of source.match(/\d+/g)||[])assert((digits(result).match(/\d+/g)||[]).includes(value),lang+' numeric value missing '+source);
  assert(!/\ufffd|\u0000/.test(result),lang+' invalid encoding');n++;
 }
}
const added=fs.readFileSync('tools/locales/regions-13-15.tsv','utf8').trim().split(/\r?\n/).map(line=>line.split('\t')[0]);
for(const key of added){assert(T.TRANSLATIONS[key],key);assert.equal(T.TRANSLATIONS[key].length,21);}
console.log(`PASS regions13-15: ${texts.size} pet/skill/map texts across22 languages (${n} translations), numeric values and ${added.length} complete new catalog keys`);
