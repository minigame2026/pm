import { TRANSLATIONS } from './PMTranslations';

export type Locale='zh-CN'|'en'|'ja'|'ko'|'zh-TW'|'th'|'pt-BR'|'es-419'|'id'|'vi'|'de'|'fr'|'hi'|'ar'|'ru'|'ur'|'bn'|'tr'|'fil'|'mr'|'te'|'ta';
export type LanguageChoice=Locale|'system';
export const LANGUAGE_KEY='pm.language.v1';
export const LANGUAGES:{id:LanguageChoice;name:string}[]=[
  {id:'system',name:'跟随系统'},{id:'zh-CN',name:'简体中文'},{id:'en',name:'English'},
  {id:'ja',name:'日本語'},{id:'ko',name:'한국어'},{id:'zh-TW',name:'繁體中文'},{id:'th',name:'ไทย'},
  {id:'pt-BR',name:'Português (BR)'},{id:'es-419',name:'Español (LatAm)'},
  {id:'id',name:'Bahasa Indonesia'},{id:'vi',name:'Tiếng Việt'},
  {id:'de',name:'Deutsch'},{id:'fr',name:'Français'},
  {id:'hi',name:'हिन्दी'},{id:'ar',name:'العربية'},{id:'ru',name:'Русский'},
  {id:'ur',name:'اردو'},{id:'bn',name:'বাংলা'},{id:'tr',name:'Türkçe'},
  {id:'fil',name:'Filipino'},{id:'mr',name:'मराठी'},{id:'te',name:'తెలుగు'},{id:'ta',name:'தமிழ்'}
];
const columns:Record<string,number>={en:0,ja:1,ko:2,'zh-TW':3,th:4,'pt-BR':5,'es-419':6,id:7,vi:8,de:9,fr:10,hi:11,ar:12,ru:13,ur:14,bn:15,tr:16,fil:17,mr:18,te:19,ta:20};
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp(Object.keys(TRANSLATIONS).sort((a,b)=>b.length-a.length).map(escape).join('|'),'g');
let locale:Locale='en',choice:LanguageChoice='system';
const cache=new Map<string,string>();
export function resolveLocale(code:string):Locale{
  const parts=String(code||'').trim().toLowerCase().replace(/_/g,'-').split('-'),base=parts[0];
  if(base==='zh'){
    if(parts.includes('hant'))return 'zh-TW';
    if(parts.includes('hans'))return 'zh-CN';
    return parts.some(p=>['tw','hk','mo'].includes(p))?'zh-TW':'zh-CN';
  }
  if(base==='pt')return 'pt-BR';
  if(base==='es')return 'es-419';
  // Older Android system language codes may still report Indonesian as "in".
  if(base==='in')return 'id';
  if(base==='tl')return 'fil';
  if(['en','ja','ko','th','id','vi','de','fr','hi','ar','ru','ur','bn','tr','fil','mr','te','ta'].includes(base))return base as Locale;
  return 'en';
}
export function selectLanguage(value:string|null,systemCode:string):LanguageChoice{
  choice=LANGUAGES.some(l=>l.id===value)?value as LanguageChoice:'system';
  locale=choice==='system'?resolveLocale(systemCode):choice;
  cache.clear();return choice;
}
export const currentLocale=()=>locale;
export const languageChoice=()=>choice;
export function tr(value:string):string{
  if(locale==='zh-CN'||!value||!/[\u3400-\u9fff]/.test(value))return value;
  const cached=cache.get(value);if(cached!==undefined)return cached;
  const index=columns[locale],exact=TRANSLATIONS[value];
  // Replace source-language fragments once, never translated output; dynamic names,
  // counters and skill values keep their original game data and save identifiers.
  const translated=exact?exact[index]??exact[0]:value.replace(pattern,key=>TRANSLATIONS[key][index]??TRANSLATIONS[key][0]);
  if(cache.size>=2048)cache.clear();cache.set(value,translated);return translated;
}
