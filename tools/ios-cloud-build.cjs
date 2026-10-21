// Creator export and Xcode archive are separate gates. Unsigned archives are not store uploads.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = process.cwd();
const logs = path.join(root, 'build/ios-logs');
const output = path.join(root, 'build/ios-export');
const temp = path.join(process.env.RUNNER_TEMP || path.join(root, 'checks'), 'pm-signing');
function run(command, args, options = {}) {
  const result = cp.spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed (${result.status})`);
}
function capture(command, args) {
  return cp.execFileSync(command, args, { encoding: 'utf8' }).trim();
}
function writePlist(file, object) {
  const value = x => Array.isArray(x) ? `<array>${x.map(value).join('')}</array>` :
    x && typeof x === 'object' ? `<dict>${Object.entries(x).map(([k,v]) => `<key>${k}</key>${value(v)}`).join('')}</dict>` :
    typeof x === 'boolean' ? `<${x}/>` : `<string>${String(x).replaceAll('&','&amp;').replaceAll('<','&lt;')}</string>`;
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0">${value(object)}</plist>`);
}
function plistJSON(file) {
  return JSON.parse(capture('python3', ['-c', 'import plistlib,json,sys,base64,datetime; print(json.dumps(plistlib.load(open(sys.argv[1],"rb")),default=lambda x:base64.b64encode(x).decode() if isinstance(x,bytes) else x.isoformat()))', file]));
}
function preflight() {
  const model = fs.readFileSync('assets/scripts/PMModel.ts', 'utf8');
  assert.match(model, /BUILD_TEST_MODE\s*=\s*false/);
  assert.equal(JSON.parse(fs.readFileSync('package.json')).creator.version, '3.8.7');
  assert.equal(JSON.parse(fs.readFileSync('config/buildConfig_ios.json')).debug, false);
  console.log('PASS production source; Creator 3.8.7; com.dice.pet.rpg');
}
function prepare() {
  preflight();
  fs.mkdirSync(logs, { recursive: true });
  const native = path.join(root, 'native/engine/ios');
  const plist = path.join(native, 'Info.plist');
  assert.ok(fs.existsSync(plist), 'Creator did not export iOS native project');
  const info = plistJSON(plist);
  info.CFBundleDisplayName = 'Dice Pet Spirits';
  info.CFBundleShortVersionString = '1.0';
  info.CFBundleVersion = String(process.env.GITHUB_RUN_NUMBER || '1');
  info.ITSAppUsesNonExemptEncryption = false;
  info.UIRequiredDeviceCapabilities = ['arm64', 'metal'];
  writePlist(plist, info);
  // Generate every existing app icon slot from the approved 1024px master.
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(path.join(dir,x.name)) : [path.join(dir,x.name)]);
  const icons = walk(native).filter(x => /AppIcon\.appiconset\/Contents\.json$/.test(x));
  assert.ok(icons.length, 'iOS app icon catalog missing');
  for (const contents of icons) {
    const catalog = JSON.parse(fs.readFileSync(contents));
    for (const image of catalog.images) {
      if (!image.size || !image.scale) continue;
      const pixels = Math.round(parseFloat(image.size) * parseFloat(image.scale));
      image.filename = `pet-${pixels}.png`;
      run('sips', ['-z', String(pixels), String(pixels), 'config/ios-app-icon.png', '--out', path.join(path.dirname(contents), image.filename)], { stdio: 'ignore' });
    }
    fs.writeFileSync(contents, JSON.stringify(catalog, null, 2));
  }
  const privacy = path.join(native, 'PrivacyInfo.xcprivacy');
  writePlist(privacy, {
    NSPrivacyTracking: false, NSPrivacyTrackingDomains: [], NSPrivacyCollectedDataTypes: [],
    NSPrivacyAccessedAPITypes: [
      { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
      { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
      { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] }
    ]
  });
  fs.appendFileSync(path.join(native, 'CMakeLists.txt'), '\nset_source_files_properties("${CMAKE_CURRENT_LIST_DIR}/PrivacyInfo.xcprivacy" PROPERTIES MACOSX_PACKAGE_LOCATION Resources)\ntarget_sources(${EXECUTABLE_NAME} PRIVATE "${CMAKE_CURRENT_LIST_DIR}/PrivacyInfo.xcprivacy")\n');
  run('cmake', ['-S', native, '-B', 'build/ios/proj', '-DCMAKE_POLICY_VERSION_MINIMUM=3.5']);
}
function signing() {
  fs.mkdirSync(temp, { recursive: true, mode: 0o700 });
  const { IOS_DISTRIBUTION_P12: p12, IOS_DISTRIBUTION_PASSWORD: password, IOS_APP_STORE_PROFILE: profile } = process.env;
  if (!p12 && !profile) {
    fs.writeFileSync(path.join(temp, 'state.json'), JSON.stringify({ signed: false }));
    console.log('Distribution private key unavailable: verify unsigned archive only; no submission IPA will be generated.');
    return;
  }
  assert.ok(p12 && password && profile, 'Incomplete signing secrets');
  fs.writeFileSync(path.join(temp, 'identity.p12'), Buffer.from(p12, 'base64'), { mode: 0o600 });
  fs.writeFileSync(path.join(temp, 'profile.mobileprovision'), Buffer.from(profile, 'base64'), { mode: 0o600 });
  const xml = cp.execFileSync('security', ['cms', '-D', '-i', path.join(temp, 'profile.mobileprovision')]);
  fs.writeFileSync(path.join(temp, 'profile.plist'), xml, { mode: 0o600 });
  const data = plistJSON(path.join(temp, 'profile.plist'));
  assert.equal(data.Entitlements['application-identifier'], 'U5FT6JFLWS.com.dice.pet.rpg');
  assert.equal(data.Entitlements['get-task-allow'], false);
  assert.ok(!data.ProvisionedDevices && !data.ProvisionsAllDevices, 'App Store profile required');
  assert.ok(new Date(data.ExpirationDate) > new Date(), 'Expired profile');
  const keychain = path.join(temp, 'build.keychain-db');
  const keychainPassword = crypto.randomBytes(32).toString('hex');
  // Keep all secret-bearing subprocess output private, including import failures.
  const privateRun = (args) => {
    const result = cp.spawnSync('security', args, { stdio: 'ignore' });
    assert.equal(result.status, 0, 'Temporary signing keychain operation failed');
  };
  privateRun(['create-keychain', '-p', keychainPassword, keychain]);
  fs.writeFileSync(path.join(temp, 'keychain.path'), keychain);
  privateRun(['set-keychain-settings', '-lut', '21600', keychain]);
  privateRun(['unlock-keychain', '-p', keychainPassword, keychain]);
  privateRun(['import', path.join(temp, 'identity.p12'), '-P', password, '-A', '-t', 'cert', '-f', 'pkcs12', '-k', keychain]);
  privateRun(['set-key-partition-list', '-S', 'apple-tool:,apple:', '-k', keychainPassword, keychain]);
  privateRun(['list-keychains', '-d', 'user', '-s', keychain]);
  const identities = capture('security', ['find-identity', '-v', '-p', 'codesigning', keychain]);
  const allowed = (data.DeveloperCertificates || []).map(c => crypto.createHash('sha1').update(Buffer.from(c,'base64')).digest('hex').toUpperCase());
  const matched = allowed.find(hash => identities.includes(hash));
  assert.ok(matched, 'P12 private key does not match the App Store distribution profile');
  const installed = path.join(process.env.HOME, 'Library/MobileDevice/Provisioning Profiles', `${data.UUID}.mobileprovision`);
  fs.mkdirSync(path.dirname(installed), { recursive: true });
  fs.copyFileSync(path.join(temp, 'profile.mobileprovision'), installed);
  fs.writeFileSync(path.join(temp, 'profile.path'), installed);
  fs.writeFileSync(path.join(temp, 'state.json'), JSON.stringify({ signed: true, identity: matched, uuid: data.UUID, name: data.Name, keychain }));
  console.log('PASS distribution identity matches App Store profile');
}
function archive() {
  const state = JSON.parse(fs.readFileSync(path.join(temp, 'state.json')));
  fs.mkdirSync(output, { recursive: true });
  const project = fs.readdirSync('build/ios/proj').find(x => x.endsWith('.xcodeproj'));
  assert.ok(project, 'Xcode project missing');
  const archive = path.join(output, 'DicePet.xcarchive');
  const settings = ['PRODUCT_BUNDLE_IDENTIFIER=com.dice.pet.rpg', 'TARGETED_DEVICE_FAMILY=1', 'IPHONEOS_DEPLOYMENT_TARGET=13.0', 'ENABLE_BITCODE=NO', 'SKIP_INSTALL=NO', 'ONLY_ACTIVE_ARCH=NO', 'ARCHS=arm64'];
  settings.push(...(state.signed ? ['CODE_SIGN_STYLE=Manual', 'DEVELOPMENT_TEAM=U5FT6JFLWS', `CODE_SIGN_IDENTITY=${state.identity}`, `PROVISIONING_PROFILE_SPECIFIER=${state.uuid}`, `OTHER_CODE_SIGN_FLAGS=--keychain ${state.keychain}`] : ['CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO']));
  const log = fs.openSync(path.join(logs, 'xcode-archive.log'), 'w');
  try { run('xcodebuild', ['-project', `build/ios/proj/${project}`, '-scheme', 'DicePet-mobile', '-configuration', 'Release', '-destination', 'generic/platform=iOS', '-archivePath', archive, '-jobs', '3', 'archive', ...settings], { stdio: ['ignore',log,log] }); }
  finally { fs.closeSync(log); console.log(fs.readFileSync(path.join(logs,'xcode-archive.log'),'utf8').split('\n').slice(-75).join('\n')); }
  const app = path.join(archive, 'Products/Applications', fs.readdirSync(path.join(archive,'Products/Applications')).find(x => x.endsWith('.app')));
  const info = plistJSON(path.join(app, 'Info.plist'));
  assert.equal(info.CFBundleIdentifier, 'com.dice.pet.rpg');
  assert.equal(info.CFBundleShortVersionString, '1.0');
  assert.ok(Number.parseFloat(info.DTSDKName.replace('iphoneos','')) >= 26);
  assert.ok(fs.existsSync(path.join(app, 'PrivacyInfo.xcprivacy')));
  const report = { signed: state.signed, bundleID: info.CFBundleIdentifier, version: info.CFBundleShortVersionString, build: info.CFBundleVersion, sdk: info.DTSDKName, readyForAppStore: false };
  if (state.signed) {
    run('codesign', ['--verify', '--deep', '--strict', app]);
    const options = path.join(temp, 'ExportOptions.plist');
    writePlist(options, { method: 'app-store-connect', signingStyle: 'manual', teamID: 'U5FT6JFLWS', signingCertificate: state.identity, provisioningProfiles: { 'com.dice.pet.rpg': state.name }, uploadSymbols: true, manageAppVersionAndBuildNumber: false });
    run('xcodebuild', ['-exportArchive', '-archivePath', archive, '-exportOptionsPlist', options, '-exportPath', path.join(output,'AppStore')]);
    assert.ok(fs.readdirSync(path.join(output,'AppStore')).some(x => x.endsWith('.ipa')));
    report.readyForAppStore = true;
  }
  fs.writeFileSync(path.join(output, 'build-result.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
const action = process.argv[2];
assert.ok(['preflight','prepare','signing','archive'].includes(action), 'Unknown build step');
({ preflight, prepare, signing, archive })[action]();
