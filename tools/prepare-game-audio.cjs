const fs=require('fs'),path=require('path'),cp=require('child_process');
const config=JSON.parse(fs.readFileSync('C:/Users/k/Documents/Codex/Tools/audio-production/installation.json','utf8'));
const out='assets/resources/audio';fs.mkdirSync(out,{recursive:true});
const crypto=require('crypto'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('art-source/audio-user-v1/manifest.json','utf8'));
// Validate all masters before modifying any output.
for(const t of manifest.tracks){assert(fs.existsSync(t.source),'Missing master: '+t.source);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(t.source)).digest('hex'),t.sourceSha256,'Changed master: '+t.source);}
for(const t of manifest.tracks)cp.execFileSync(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',t.source,'-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','128k',t.file],{stdio:'inherit'});
// Casual battle/click/potion effects are maintained by make-casual-sfx.py.
for(const [id,start,end] of [['hatch',0,2.55]]){
 const duration=end-start;
 cp.execFileSync(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',`art-source/audio-v1/masters/${id}.wav`,'-af',`atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=${duration-.08}:d=0.08,alimiter=limit=0.8:level=false`,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',path.join(out,id+'.mp3')],{stdio:'inherit'});
}
console.log('Prepared current music tracks and hatch effect; casual effects remain unchanged');
