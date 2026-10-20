// Export the APP battle sample with QA balance, preserving production source and v4.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const modelFile = path.join(root, 'assets/scripts/PMModel.ts');
const productionMarker = 'export const BUILD_TEST_MODE=false;';
const qaMarker = 'export const BUILD_TEST_MODE=true;';
const apk = path.join(root, 'build/android/proj/build/DicePet/outputs/apk/release/DicePet-release.apk');
const previousApk = path.join(root, 'build/releases/骰子宠物精灵-安卓测试版-20261020-v4.apk');
const output = path.join(root, 'build/releases/骰子宠物精灵-APP战斗样板-20261020-v5.apk');
const expected = { packageName: 'com.minigame2026.dicepet', versionCode: 5, versionName: '1.0.4' };
const tools = JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE, 'Documents/Codex/Tools/android-development/installation.json')));
const java = path.join(tools.javaHome, 'bin/java.exe');
const aapt = path.join(tools.sdkRoot, 'build-tools/34.0.0/aapt.exe');
const signer = path.join(tools.sdkRoot, 'build-tools/34.0.0/lib/apksigner.jar');
const source = fs.readFileSync(modelFile, 'utf8');
const android = JSON.parse(fs.readFileSync(path.join(root, 'build-android.json'))).packages.android;
const gradle = fs.readFileSync(path.join(root, 'native/engine/android/app/build.gradle'), 'utf8');

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { cwd: root, windowsHide: true, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Build/check failed: ${path.basename(command)} (exit ${result.status})${capture ? '\n' + result.stderr : ''}`);
  return result.stdout || '';
}
function certificate(file) {
  const report = run(java, ['-jar', signer, 'verify', '--verbose', '--print-certs', file], true);
  const digest = report.match(/^Signer #1 certificate SHA-256 digest: ([0-9a-f]+)$/mi);
  if (!digest) throw Error('APK signing certificate not found: ' + file);
  return digest[1].toLowerCase();
}
function restoreProductionBalance() {
  const current = fs.readFileSync(modelFile, 'utf8');
  if (current.includes(qaMarker)) fs.writeFileSync(modelFile, current.replace(qaMarker, productionMarker));
  if (!fs.readFileSync(modelFile, 'utf8').includes(productionMarker)) throw Error('Unable to restore production balance');
  console.log('Production balance restored: 5 stamina / 30 minutes');
}

if (source.split(productionMarker).length !== 2 || source.includes(qaMarker)) throw Error('Production balance marker missing or ambiguous');
if (android.packageName !== expected.packageName || android.useDebugKeystore !== true) throw Error('Expected existing package and Cocos test signing configuration');
if (!/\bversionCode\s+5\b/.test(gradle) || !/\bversionName\s+"1\.0\.4"/.test(gradle)) throw Error('Android source version must be 1.0.4 / code 5');
for (const file of [java, aapt, signer, previousApk, path.join(root, 'native/engine/android/app/libs/dirichlet_ad_5.3.0.4.aar')]) {
  if (!fs.existsSync(file)) throw Error('Required build input missing: ' + file);
}
if (fs.existsSync(output)) throw Error('Sample APK already exists; move it explicitly before rebuilding: ' + output);
if (process.argv.includes('--check')) {
  console.log(JSON.stringify({ ...expected, profile: 'app-battle-qa', staminaCost: 1, hatchMs: 3000, breedingMs: 3000, output, buildStarted: false }, null, 2));
  process.exit(0);
}

const previousCertificate = certificate(previousApk);
let details;
try {
  fs.writeFileSync(modelFile, source.replace(productionMarker, qaMarker));
  run(process.execPath, ['tools/build-platform.cjs', 'android', '--qa-profile']);
  run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'tools/compile-android.ps1']);
  const badging = run(aapt, ['dump', 'badging', apk], true);
  const identity = badging.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  if (!identity || identity[1] !== expected.packageName || +identity[2] !== expected.versionCode || identity[3] !== expected.versionName) {
    throw Error('Compiled APK package/version does not match the sample');
  }
  if (certificate(apk) !== previousCertificate) throw Error('Signing certificate differs from v4; refusing an incompatible update');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(apk, output, fs.constants.COPYFILE_EXCL);
  details = { ...expected, profile: 'app-battle-qa', staminaCost: 1, hatchMs: 3000, breedingMs: 3000,
    signatureMatchesV4: true, bytes: fs.statSync(output).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'), created: new Date().toISOString() };
} finally {
  restoreProductionBalance();
}
fs.writeFileSync(output + '.json', JSON.stringify({ ...details, sourceRestoredToProduction: true }, null, 2));
console.log('APP battle sample APK: ' + output);
