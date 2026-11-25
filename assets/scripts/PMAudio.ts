import { AudioClip, AudioSource, Node, resources, sys } from 'cc';

type Music = 'camp-app'|'camp-short'|'battle-normal'|'battle-elite'|'battle-boss'|'egg-quest';
type MusicChoice = 'camp'|'battle-normal'|'battle-elite'|'battle-boss'|'egg-quest';
type Sound = 'click'|'attack'|'hurt'|'heal'|'boost'|'hatch';
const PREFS = 'pm.pc.audio.v1';

/** Audio lives outside the rebuilt UI tree. No game-save changes. */
export class PMAudio {
  musicEnabled=true;
  effectsEnabled=true;
  private music:AudioSource;
  private effects:AudioSource[]=[];
  private clips:Partial<Record<Music|Sound,AudioClip>>={};
  private desired:Music=sys.isNative?'camp-app':'camp-short';
  private loading=new Set<Music>();
  private failed=new Set<Music>();
  private playingTrack:Music|null=null;
  private unlocked=false;
  private suspended=new Set<string>();
  private voice=0;
  private disposed=false;
  private loadingStarted=false;
  private preferenceListener=(event:{key:string|null})=>{
    if(this.disposed||event.key!==PREFS)return;
    this.readPreferences();this.sync();this.onPreferencesChanged?.();
  };
  constructor(parent:Node,private onPreferencesChanged?:()=>void,deferUntilInteraction=false){
    const host=new Node('PM Audio');parent.addChild(host);
    this.music=host.addComponent(AudioSource);this.music.playOnAwake=false;this.music.loop=true;this.music.volume=.55;
    for(let i=0;i<2;i++){const n=new Node('SFX '+i);host.addChild(n);const source=n.addComponent(AudioSource);source.playOnAwake=false;source.volume=.75;this.effects.push(source);}
    this.readPreferences();
    if(!sys.isNative)(globalThis as any).addEventListener?.('storage',this.preferenceListener);
    if(!deferUntilInteraction)this.prepareAudio();
  }
  private prepareAudio(){
    if(this.disposed||this.loadingStarted)return;
    this.loadingStarted=true;
    for(const id of ['click','attack','hurt','heal','boost','hatch'] as const){
      resources.load('audio/'+id,AudioClip,(error,clip)=>{
        if(this.disposed)return;
        if(error){console.warn('Audio unavailable:',id);return;}
        this.clips[id]=clip;this.sync();
      });
    }
    this.loadMusic();
  }
  unlock(){this.readPreferences();this.unlocked=true;this.prepareAudio();this.sync();}
  select(track:MusicChoice){this.desired=track==='camp'?(sys.isNative?'camp-app':'camp-short'):track;this.sync();}
  pause(reason:string){this.suspended.add(reason);this.music.volume=0;this.music.pause();this.effects.forEach(s=>s.stop());}
  resume(reason:string){this.readPreferences();this.suspended.delete(reason);this.sync();}
  effect(id:Sound){
    const clip=this.clips[id];if(!clip||!this.unlocked||!this.effectsEnabled||this.suspended.size||this.disposed)return;
    const source=this.effects[this.voice++%this.effects.length];source.stop();source.volume=id==='click'?.55:.75;source.clip=clip;source.play();
  }
  toggle(kind:'music'|'effects'){
    this.readPreferences();
    if(kind==='music')this.musicEnabled=!this.musicEnabled;
    else {this.effectsEnabled=!this.effectsEnabled;if(!this.effectsEnabled)this.effects.forEach(s=>s.stop());}
    try{sys.localStorage.setItem(PREFS,JSON.stringify({music:this.musicEnabled,effects:this.effectsEnabled}));}catch{}
    this.sync();
  }
  private readPreferences(){
    try{const p=JSON.parse(sys.localStorage.getItem(PREFS)||'{}');if(!p||typeof p!=='object')return;this.musicEnabled=p.music!==false;this.effectsEnabled=p.effects!==false;}catch{}
    if(!this.effectsEnabled)this.effects.forEach(s=>s.stop());
  }
  private sync(){
    if(this.disposed)return;
    // Silence output immediately as well as stopping the engine's async player.
    this.music.volume=this.musicEnabled&&this.unlocked&&!this.suspended.size ? .55 : 0;
    if(!this.musicEnabled){this.music.stop();return;}
    this.loadMusic();
    if(!this.unlocked||this.suspended.size)return;
    const clip=this.clips[this.desired];if(!clip)return;
    if(this.music.clip!==clip){
      this.music.stop();this.music.clip=clip;
      const old=this.playingTrack;this.playingTrack=this.desired;
      if(old&&old!==this.desired){delete this.clips[old];resources.release('audio/'+old,AudioClip);}
    }
    if(!this.music.playing)this.music.play();
  }
  private loadMusic(){
    const id=this.desired;if(this.disposed||!this.loadingStarted||!this.musicEnabled||this.clips[id]||this.loading.has(id)||this.failed.has(id))return;
    this.loading.add(id);
    resources.load('audio/'+id,AudioClip,(error,clip)=>{
      this.loading.delete(id);
      if(error){this.failed.add(id);console.warn('Music unavailable:',id);return;}
      if(this.disposed||id!==this.desired){resources.release('audio/'+id,AudioClip);return;}
      this.clips[id]=clip;this.sync();
    });
  }
  dispose(){this.disposed=true;if(!sys.isNative)(globalThis as any).removeEventListener?.('storage',this.preferenceListener);this.music.volume=0;this.music.stop();this.music.clip=null;this.effects.forEach(s=>s.stop());for(const id of Object.keys(this.clips))if(id.startsWith('camp-')||id.startsWith('battle-')||id==='egg-quest')resources.release('audio/'+id,AudioClip);}
}
