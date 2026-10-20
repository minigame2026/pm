"""Install isolated build dependencies, without changing system PATH."""
import concurrent.futures,hashlib,json,urllib.request,zipfile
from pathlib import Path
ROOT=Path('C:/Users/k/Documents/Codex/Tools/android-development');ROOT.mkdir(parents=True,exist_ok=True)
def download(url,dest,sha=None):
    if not dest.exists():
        print('Downloading '+dest.name,flush=True)
        with urllib.request.urlopen(url,timeout=90) as r,dest.open('wb') as w:
            while data:=r.read(1024*1024):w.write(data)
    if sha and hashlib.sha256(dest.read_bytes()).hexdigest()!=sha:raise ValueError('Checksum mismatch '+str(dest))
def jdk():
    request=urllib.request.Request('https://api.github.com/repos/adoptium/temurin17-binaries/releases/latest',headers={'User-Agent':'PM-build'})
    with urllib.request.urlopen(request,timeout=45) as r:meta=json.load(r)
    asset=next(a for a in meta['assets'] if a['name'].startswith('OpenJDK17U-jdk_x64_windows_hotspot_') and a['name'].endswith('.zip'))
    check=next(a for a in meta['assets'] if a['name']==asset['name']+'.sha256.txt')
    with urllib.request.urlopen(check['browser_download_url'],timeout=45) as r:sha=r.read().decode().split()[0]
    dest=ROOT/'jdk17.zip';download(asset['browser_download_url'],dest,sha)
    with zipfile.ZipFile(dest) as z:
        folder=z.namelist()[0].split('/')[0]
        if not (ROOT/folder/'bin/java.exe').exists():z.extractall(ROOT)
    return {'javaHome':str(ROOT/folder)}
def sdk():
    dest=ROOT/'commandlinetools-12.zip';download('https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip',dest)
    location=ROOT/'sdk/cmdline-tools/12.0'
    if not (location/'bin/sdkmanager.bat').exists():
        with zipfile.ZipFile(dest) as z:
            for entry in z.infolist():
                rel=Path(*Path(entry.filename).parts[1:]);target=location/rel
                if entry.is_dir():target.mkdir(parents=True,exist_ok=True)
                else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(entry))
    return {'sdkRoot':str(ROOT/'sdk'),'sdkmanager':str(location/'bin/sdkmanager.bat')}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    futures=[pool.submit(jdk),pool.submit(sdk)];config={}
    for f in futures:config.update(f.result())
(ROOT/'installation.json').write_text(json.dumps(config,indent=2))
print(json.dumps(config),flush=True)
