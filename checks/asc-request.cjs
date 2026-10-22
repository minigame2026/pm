const fs=require('fs'),crypto=require('crypto');
async function asc(endpoint,method='GET',data){
 const c=JSON.parse(fs.readFileSync('.env.ios-upload.json'));
 const b=x=>Buffer.from(JSON.stringify(x)).toString('base64url'),now=Math.floor(Date.now()/1000);
 const body=b({alg:'ES256',kid:c.keyId,typ:'JWT'})+'.'+b({iss:c.issuerId,iat:now,exp:now+300,aud:'appstoreconnect-v1'});
 const token=body+'.'+crypto.sign('sha256',Buffer.from(body),{key:crypto.createPrivateKey(fs.readFileSync(c.privateKeyFile)),dsaEncoding:'ieee-p1363'}).toString('base64url');
 const r=await fetch('https://api.appstoreconnect.apple.com'+endpoint,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(45000)});
 const text=await r.text();const result=text?JSON.parse(text):{};if(!r.ok)throw Error(r.status+' '+JSON.stringify(result));return result;
}
module.exports=asc;
if(require.main===module)asc(process.argv[2]).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1;});
