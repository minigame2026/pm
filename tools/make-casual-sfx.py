"""Deterministic original short game effects; no network, samples or paid API.
Preserve PCM masters and export compact mono MP3 through installed FFmpeg.
"""
import json, math, random, struct, subprocess, uuid, wave
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SR=44100
OUT=ROOT/'assets/resources/audio'
MASTER=ROOT/'art-source/audio-casual-v2'
MASTER.mkdir(parents=True,exist_ok=True)
FFMPEG=json.loads(Path('C:/Users/k/Documents/Codex/Tools/audio-production/installation.json').read_text())['ffmpeg']
def bell(buf,start,duration,freq,amp):
    for j in range(int(duration*SR)):
        i=int(start*SR)+j
        if i>=len(buf): break
        t=j/SR; env=min(1,t/.006)*math.exp(-5*t/duration)*min(1,(duration-t)/.025)
        buf[i]+=amp*env*(math.sin(2*math.pi*freq*t)+.12*math.sin(2*math.pi*freq*2*t))
def pop(buf,start,duration,f0,f1,amp,noise=0):
    rng=random.Random(91);phase=0;smoothed=0
    for j in range(int(duration*SR)):
        i=int(start*SR)+j
        if i>=len(buf):break
        t=j/SR;u=t/duration;freq=f1+(f0-f1)*(1-u)**2;phase+=2*math.pi*freq/SR
        smoothed=.87*smoothed+.13*rng.uniform(-1,1)
        env=min(1,t/.004)*(1-u)**2
        buf[i]+=amp*env*(math.sin(phase)+noise*smoothed)
effects=[('click',.16,'柔软低音水滴点击，无高频硬起音'),('attack',.27,'轻快弹性命中'),('hurt',.30,'柔和低音受击'),('heal',.64,'气泡与清亮恢复音'),('boost',.62,'温暖上扬强化音')]
manifest={'title':'休闲音效 v2','method':'original deterministic synthesis, PCM 44.1kHz mono; MP3 96kbps','samples':[]}
for name,duration,description in effects:
    buf=[0.0]*int(SR*duration)
    if name=='click':
        phase=0
        for i in range(len(buf)):
            t=i/SR;u=t/duration;phase+=2*math.pi*(520-180*u)/SR
            env=(1-math.exp(-t/.012))*math.exp(-t/.042)*min(1,(duration-t)/.045)
            buf[i]=.25*env*math.sin(phase)
    elif name=='attack': pop(buf,0,.21,510,175,.48,.65);bell(buf,.025,.18,784,.16)
    elif name=='hurt': pop(buf,0,.25,260,120,.40,.8);bell(buf,.018,.16,392,.12)
    elif name=='heal':
        pop(buf,0,.10,420,720,.12)
        for start,freq in [(0.05,659.25),(.15,783.99),(.26,1046.5)]:bell(buf,start,.34,freq,.22)
    elif name=='boost':
        pop(buf,0,.14,240,480,.18)
        for start,freq in [(.04,392),(.13,523.25),(.22,783.99)]:bell(buf,start,.36,freq,.24)
    # Bound peak with headroom, smooth both endpoints, eliminate DC.
    dc=sum(buf)/len(buf);buf=[x-dc for x in buf];peak=max(abs(x) for x in buf)
    gain=min(1,.68/peak)
    buf=[x*gain*min(1,i/(SR*.003),(len(buf)-1-i)/(SR*.02)) for i,x in enumerate(buf)]
    master=MASTER/(name+'.wav')
    with wave.open(str(master),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(b''.join(struct.pack('<h',round(x*32767)) for x in buf))
    target=OUT/(name+'.mp3')
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(master),'-ac','1','-ar',str(SR),'-c:a','libmp3lame','-b:a','96k',str(target)],check=True)
    meta=Path(str(target)+'.meta')
    if not meta.exists():meta.write_text(json.dumps({'ver':'1.0.0','importer':'audio-clip','imported':True,'uuid':str(uuid.uuid4()),'files':['.json','.mp3'],'subMetas':{},'userData':{'downloadMode':0}},indent=2)+'\n')
    manifest['samples'].append({'id':name,'description':description,'duration':duration,'peak':round(max(abs(x) for x in buf),4),'rms':round(math.sqrt(sum(x*x for x in buf)/len(buf)),4),'bytes':target.stat().st_size})
(MASTER/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(manifest,ensure_ascii=False))
