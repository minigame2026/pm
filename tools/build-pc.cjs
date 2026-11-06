const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {prepare,DEST}=require('./prepare-pc-project.cjs'),cfg=require('./workflow.config.json');
function finish(){const dir=path.join(DEST,'build/web-desktop'),file=path.join(dir,'index.html');let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<title>.*?<\/title>/,'<title>骰子精灵：驯兽之旅 · Dicekin: Monster Tamer</title>').replace(/<h1 class="header">[\s\S]*?<\/h1>/,'').replace(/<p class="footer">[\s\S]*?<\/p>/,'').replace('cc_exact_fit_screen="false"','cc_exact_fit_screen="true"').replace('style="width: 1280px; height: 960px;"','style="width: 100vw; height: 100vh;"').replace('content="portrait"','content="landscape"');
  html=html.replace('</head>','<style>html,body{width:100%;height:100%;overflow:hidden;background:#183d41}#GameDiv{position:fixed;inset:0;width:100vw!important;height:100vh!important;margin:0;border:0;border-radius:0;box-shadow:none}#GameCanvas{display:block}</style></head>');fs.writeFileSync(file,html);
  console.log('PC build ready: '+dir);
}
async function build(){prepare();const log=path.resolve(__dirname,'../checks/pc-creator-output.log'),fd=fs.openSync(log,'w');
  const code=await new Promise((resolve,reject)=>{const child=spawn(cfg.editor,['--project',DEST,'--build','configPath='+path.join(DEST,'build-pc.json')],{stdio:['ignore',fd,fd],windowsHide:true});child.on('error',reject);child.on('exit',resolve);});fs.closeSync(fd);
  if(code!==36)throw Error('Creator did not confirm success: '+code+'; see '+log);finish();
}
if(require.main===module)(process.argv.includes('--finish')?Promise.resolve().then(finish):build()).catch(e=>{console.error(e.message);process.exitCode=1;});module.exports={finish,build};
