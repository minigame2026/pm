// Store compositions preserve each approved gameplay capture's full aspect ratio.
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve('build/releases/Google-Play-phone-screenshots-20261021');
const out=path.resolve('build/releases/App-Store-screenshots-20261022');
const locales=[
 ['en','Dice Pet Spirits',['Your adventure awaits','Roll into battle','Meet your companions','Discover every spirit','Find hidden eggs']],
 ['ja','サイコロペット精霊',['冒険のはじまり','サイコロでバトル','仲間と出会おう','精霊を見つけよう','隠された卵を探そう']],
 ['ko','주사위 펫 스피릿',['모험의 시작','주사위로 펼치는 전투','동료를 만나 보세요','정령을 발견하세요','숨겨진 알을 찾아요']],
 ['th','Dice Pet Spirits',['เริ่มการผจญภัย','ทอยลูกเต๋าเข้าต่อสู้','พบกับเพื่อนร่วมทาง','ค้นพบเหล่าภูตสัตว์เลี้ยง','ค้นหาไข่ที่ซ่อนอยู่']],
 ['zh-TW','骰子寵物精靈',['展開你的冒險','擲骰展開戰鬥','結識寵物夥伴','探索精靈圖鑑','尋找隱藏的蛋']]
];
const names=['01-home','02-battle','03-partners','04-encyclopedia','05-egg-hunt'];
const esc=s=>s.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const html='<!doctype html><meta charset="utf-8"><title>Dice Pet Spirits · App Store screenshots</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0;width:6030px;background:#eaf6ff}main{width:6030px;display:grid;grid-template-columns:repeat(5,1206px)}article{width:1206px;height:2622px;overflow:hidden;background:linear-gradient(130deg,#eaf6ff,#fff8e7);color:#183852}header{height:478px;padding:70px 64px 32px;font-family:Arial,"Yu Gothic","Malgun Gothic","Leelawadee UI","Microsoft JhengHei",sans-serif}.brand{font-size:42px;font-weight:700;letter-spacing:1px;color:#357b9c}.title{font-size:86px;line-height:1.17;font-weight:750;margin-top:46px;max-width:1080px}img{display:block;width:1206px;height:2144px}</style><main>'+locales.map(([lang,brand,titles])=>names.map((name,i)=>'<article lang="'+lang+'"><header><div class="brand">'+esc(brand)+'</div><div class="title">'+esc(titles[i])+'</div></header><img alt="'+esc(titles[i])+'" src="/images/'+lang+'/'+name+'.png"></article>').join('')).join('')+'</main>';
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'layout.html'),html);
fs.writeFileSync(path.join(out,'composition-source.json'),JSON.stringify({source:'Full approved 720x1280 actual web game captures, composed as marketing screenshots without stretching or cropping gameplay; not iOS device captures',hero:'third protagonist / medic',width:1206,height:2622,locales:locales.map(x=>x[0]),names},null,2));
http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(html);}const match=url.pathname.match(/^\/images\/(en|ja|ko|th|zh-TW)\/(0[1-5]-[a-z-]+)\.png$/);if(!match){res.writeHead(404);return res.end();}const file=path.join(root,match[1],match[2]+'.png');fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':'image/png'});res.end(e?'Not found':b);});}).listen(8786,'127.0.0.1',()=>console.log('Screenshot layout ready: http://127.0.0.1:8786/'));
