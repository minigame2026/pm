const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const config = JSON.parse(fs.readFileSync('config/ios-appstore-upload.json','utf8'));
assert.match(config.sourceRun, /^\d+$/);
assert.match(config.artifact, /^[A-Za-z0-9_.-]+$/);
assert.equal(config.bundleID, 'com.dice.pet.rpg');
function run(command,args,options={}) {
  const r = cp.spawnSync(command,args,{stdio:'inherit',...options});
  if(r.error) throw r.error;
  assert.equal(r.status,0,`${command} failed`);
  return r;
}
function plist(file) {
  return JSON.parse(cp.execFileSync('plutil',['-convert','json','-o','-',file],{encoding:'utf8'}));
}
function source() {
  const text = `run_id=${config.sourceRun}\nartifact=${config.artifact}\n`;
  if(process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,text);
  console.log(`Verified build source: run ${config.sourceRun}, ${config.artifact}`);
}
function upload() {
  const root = process.cwd();
  const src = path.join(root,'build/ios-upload-source/ios-export');
  const built = JSON.parse(fs.readFileSync(path.join(src,'build-result.json'),'utf8'));
  assert.equal(built.signed,true);
  assert.equal(built.readyForAppStore,true);
  assert.equal(built.bundleID,config.bundleID);
  assert.equal(built.version,config.version);
  assert.equal(built.build,config.build);
  assert.deepEqual(built.balance,{testMode:false,stamina:5,hatchMs:1800000,breedingMs:1800000});
  const ipas = fs.readdirSync(path.join(src,'AppStore')).filter(x=>x.endsWith('.ipa'));
  assert.equal(ipas.length,1);
  const out = path.join(root,'build/ios-delivery');
  fs.mkdirSync(out,{recursive:true});
  const ipa = path.join(out,`Dice-Pet-Spirits-1.0-build${config.build}.ipa`);
  fs.copyFileSync(path.join(src,'AppStore',ipas[0]),ipa);
  const work = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP,'pm-ios-delivery-'));
  const result = {sourceRun:config.sourceRun,...built,bytes:fs.statSync(ipa).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(ipa)).digest('hex'),uploaded:false};
  function save() {
    fs.writeFileSync(path.join(out,'delivery-result.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  }
  try {
    run('ditto',['-xk',ipa,path.join(work,'unpacked')]);
    const payload = path.join(work,'unpacked/Payload');
    const apps = fs.readdirSync(payload).filter(x=>x.endsWith('.app'));
    assert.equal(apps.length,1);
    const app = path.join(payload,apps[0]);
    const info = plist(path.join(app,'Info.plist'));
    assert.equal(info.CFBundleIdentifier,config.bundleID);
    assert.equal(info.CFBundleShortVersionString,config.version);
    assert.equal(info.CFBundleVersion,config.build);
    assert.deepEqual(info.UIDeviceFamily,[1]);
    run('codesign',['--verify','--deep','--strict',app]);
    const signature = cp.spawnSync('codesign',['-d','--verbose=4',app],{encoding:'utf8'});
    assert.equal(signature.status,0);
    assert.match(signature.stderr,/TeamIdentifier=U5FT6JFLWS/);
    const {ASC_API_KEY_ID:key,ASC_API_ISSUER_ID:issuer,ASC_API_PRIVATE_KEY_BASE64:encoded} = process.env;
    if(!key || !issuer || !encoded) {
      result.status = 'awaiting-api-private-key';
      save();
      console.log('Signed IPA verified and saved. Automatic upload requires the downloaded App Store Connect private key.');
      return;
    }
    assert.match(key,/^[A-Z0-9]{10}$/);
    assert.match(issuer,/^[a-f0-9-]{36}$/i);
    const pem = Buffer.from(encoded,'base64').toString('utf8');
    const privateKey = crypto.createPrivateKey(pem);
    assert.equal(privateKey.asymmetricKeyType,'ec');
    assert.equal(privateKey.asymmetricKeyDetails.namedCurve,'prime256v1');
    const keyDir = path.join(work,'private_keys');
    fs.mkdirSync(keyDir,{mode:0o700});
    fs.writeFileSync(path.join(keyDir,`AuthKey_${key}.p8`),pem,{mode:0o600});
    const env = {...process.env};
    delete env.ASC_API_PRIVATE_KEY_BASE64;
    for(const action of ['--validate-app','--upload-app']) {
      const r = cp.spawnSync('xcrun',['altool',action,'-f',ipa,'-t','ios','--apiKey',key,'--apiIssuer',issuer,'--output-format','json'],{cwd:work,env,encoding:'utf8',maxBuffer:16*1024*1024});
      const text = ((r.stdout||'')+'\n'+(r.stderr||'')).replaceAll(pem,'[private key redacted]');
      fs.writeFileSync(path.join(out,action.slice(2)+'.log'),text);
      console.log(text);
      assert.equal(r.status,0,`Apple ${action} failed; see delivery log`);
    }
    result.uploaded = true;
    result.status = 'uploaded-awaiting-apple-processing';
    save();
  } finally {
    // Only this process's unique temporary directory; all signing credentials stay out of artifacts.
    fs.rmSync(work,{recursive:true,force:true});
  }
}
assert.ok(['source','upload'].includes(process.argv[2]));
({source,upload})[process.argv[2]]();
