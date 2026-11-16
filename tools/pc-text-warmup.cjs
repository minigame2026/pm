const fs=require('node:fs'),path=require('node:path'),cfg=require('./workflow.config.json'),ts=require(cfg.typescript.replace(/tsc\.js$/,'typescript.js'));
// Extract only UI copy with a known display size. Dynamic names are added from the current save at startup.
function entries(root){const groups=new Map();const add=(value,size)=>{if(!value||size<12||size>48)return;const set=groups.get(size)||new Set();set.add(value);groups.set(size,set);};
 const strings=n=>!n?[]:ts.isStringLiteralLike(n)?[n.text]:ts.isConditionalExpression(n)?[...strings(n.whenTrue),...strings(n.whenFalse)]:ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken?[...strings(n.left),...strings(n.right)]:[];
 const number=(n,fallback)=>n&&ts.isNumericLiteral(n)?Number(n.text):fallback;
 for(const file of ['PMPCGame.ts','PCUI.ts','PCCookingUI.ts','PCOnlineUI.ts']){const source=ts.createSourceFile(file,fs.readFileSync(path.join(root,'pc/game',file),'utf8'),ts.ScriptTarget.Latest,true);const visit=n=>{if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){const method=n.expression.name.text,args=n.arguments;if(method==='text')for(const s of strings(args[1]))add(s,number(args[4],20));if(method==='button')for(const s of strings(args[2]))add(s,20);if(method==='badge')for(const s of strings(args[1]))add(s,14);if(method==='title'){for(const s of strings(args[0]))add(s,42);for(const s of strings(args[1]))add(s,17);}}ts.forEachChild(n,visit);};visit(source);}
 return [...groups].sort((a,b)=>a[0]-b[0]).map(([size,texts])=>({size,texts:[...texts]}));
}
module.exports={entries};
