const fs=require('fs'),path=require('path'),cp=require('child_process');
const config=JSON.parse(fs.readFileSync('C:/Users/k/Documents/Codex/Tools/audio-production/installation.json','utf8'));
const out='assets/resources/audio';fs.mkdirSync(out,{recursive:true});
for(const id of ['camp','battle']){
 const filter='[0:a]asplit=3[a][b][c];[a]atrim=start=0.5:end=39.5,asetpts=PTS-STARTPTS[mid];[b]atrim=start=39.5:end=40,asetpts=PTS-STARTPTS[tail];[c]atrim=start=0:end=0.5,asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d=0.5:c1=tri:c2=tri[join];[mid][join]concat=n=2:v=0:a=1,loudnorm=I=-20:TP=-2:LRA=9[out]';
 cp.execFileSync(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',`art-source/audio-v1/masters/${id}.wav`,'-filter_complex',filter,'-map','[out]','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','128k',path.join(out,id+'.mp3')],{stdio:'inherit'});
}
for(const [id,start,end] of [['dice',.40,1.75],['attack',0,1.85],['hatch',0,2.55]]){
 const duration=end-start;
 cp.execFileSync(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',`art-source/audio-v1/masters/${id}.wav`,'-af',`atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=${duration-.08}:d=0.08,alimiter=limit=0.8:level=false`,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',path.join(out,id+'.mp3')],{stdio:'inherit'});
}
console.log('Prepared 2 music loops and 3 trimmed effects');
