const fs=require('fs'),http=require('http'),path=require('path');
const root=path.resolve(__dirname,'../build/wechat-remote');
http.createServer((req,res)=>{
  let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);return res.end();}
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache','Content-Type':file.endsWith('.json')?'application/json':'application/octet-stream'});res.end(data);});
}).listen(8782,'127.0.0.1',()=>console.log('WeChat local resources http://127.0.0.1:8782/'));
