import { Node, Sprite, SpriteFrame, Texture2D, Rect, Size, resources, sys } from 'cc';
import { ART_SOURCE_SIZES } from './ArtSourceSizes';
import { BATTLE_RECTS } from './BattleArt';
import { EVOLUTION_ART } from './EvolutionArt';
import { REGION_ART } from './RegionArt';
import { REGION_PAD_RECTS } from './RegionPads';
import { HERO_RECTS } from './HeroArt';
import { APP_BATTLE_IDS, APP_BATTLE_POSES, APP_BATTLE_ATLASES, appPoseKey, appPoseRect } from './AppBattleArt';
import { PMAppBattle } from './PMAppBattle';
import { LOCALIZED_LOGOS } from './LocalizedLogoArt';

type Spec={source:string,rect:number[]};
type Entry={source:string,texture:Texture2D|null,frames:Set<string>,users:Set<Node>,last:number,promise:Promise<void>|null};
/** Page-bound art with shared atlas loads and bounded idle residency. */
export class PMArt {
  readonly frames:Record<string,SpriteFrame>={};
  private specs:Record<string,Spec>={};
  private entries=new Map<string,Entry>();
  private bindings=new Map<Node,string>();
  private disposed=false;
  private nativeApp=PMAppBattle.enabled();
  private activeLoads=0;
  private loadQueue:(()=>void)[]=[];
  private loadCount=0;
  pending=0;
  constructor(){
    for(const id of APP_BATTLE_IDS)ART_SOURCE_SIZES['app-'+id+'-poses-v1']=APP_BATTLE_ATLASES[id].size;
    ART_SOURCE_SIZES['app-coast-v1']=[1024,1536];
    for(const [key,spec] of Object.entries(LOCALIZED_LOGOS))ART_SOURCE_SIZES[key]=spec.size;
    for(const [key,[w,h]] of Object.entries(ART_SOURCE_SIZES))this.specs[key]={source:key,rect:[0,0,w,h]};
    const set=(key:string,source:string,rect:readonly number[])=>this.specs[key]={source,rect:[...rect]};
    for(const id of APP_BATTLE_IDS)for(const side of ['back','front'] as const)for(const pose of APP_BATTLE_POSES)set(appPoseKey(id,side,pose),'app-'+id+'-poses-v1',appPoseRect(id,side,pose));
    set('login-title-v3','login-title-v3',[21,39,1906,732]);set('login-button-v4','login-button-v4',[71,28,2031,602]);
    for(const [key,spec] of Object.entries(LOCALIZED_LOGOS))set(key,key,spec.rect);
    for(const [id,rect] of Object.entries(HERO_RECTS))set('hero-'+id,id==='medic'?'trainer-medic-v2':'trainer-trio-v1',rect);
    for(const [id,rect] of Object.entries({ranger:[230,55,225,225],keeper:[688,57,234,234],medic:[370,150,360,360]}))set('avatar-'+id,id==='medic'?'trainer-medic-v2':'trainer-trio-v1',rect);
    for(const [id,sides] of Object.entries(BATTLE_RECTS))for(const side of ['front','back']){
      const source=id+(['fox','bud','turtle'].includes(id)?'-battle-ref':'-battle-v1');set(id+'-'+side,source,sides[side]);if(side==='front'&&!['fox','bud','turtle'].includes(id))set(id,source,sides[side]);
    }
    for(const [id,forms] of Object.entries(EVOLUTION_ART))for(const rarity of ['SR','SSR'])for(const side of ['front','back'])set(id+'-'+rarity+'-'+side,id+'-evolution-v1',forms[rarity][side].rect);
    for(const [id,forms] of Object.entries(REGION_ART))for(const rarity of ['normal','SR','SSR'])for(const side of ['front','back']){
      const key=(rarity==='normal'?id:id+'-'+rarity)+'-'+side;set(key,id+'-forms-v1',forms[rarity][side].rect);if(rarity==='normal'&&side==='front')set(id,id+'-forms-v1',forms[rarity][side].rect);
    }
    for(const [id,rect] of Object.entries(REGION_PAD_RECTS))set('region-pad-'+id,'region-pads-v1',rect);
  }
  size(key:string){const s=this.specs[key];if(!s)throw Error('Unknown art '+key);return {width:s.rect[2],height:s.rect[3]};}
  private entry(key:string){
    const spec=this.specs[key];if(!spec)throw Error('Unknown art '+key);
    let e=this.entries.get(spec.source);if(!e){e={source:spec.source,texture:null,frames:new Set(),users:new Set(),last:performance.now(),promise:null};this.entries.set(spec.source,e);}e.last=performance.now();return e;
  }
  /** Native resources.load resolves packaged files, and creates reusable decoded textures. */
  private texture(source:string):Promise<Texture2D>{
    return new Promise((resolve,reject)=>{
      const run=()=>{this.activeLoads++;this.loadCount++;
        resources.load('art/'+source+'/texture',Texture2D,(error,value)=>{
          this.activeLoads--;if(error)reject(error);else resolve(value);
          const next=this.loadQueue.shift();if(next)next();
        });
      };
      if(this.activeLoads<(this.nativeApp?2:4))run();else this.loadQueue.push(run);
    });
  }
  async warm(keys:string[]){
    // Bounded work, never preload the full catalog on APP startup.
    const queue=Array.from(new Set(keys)).filter(key=>!!this.specs[key]);
    await Promise.all([0,1].map(async()=>{while(queue.length&&!this.disposed)await this.load(queue.shift()!);}));
  }
  async load(key:string):Promise<SpriteFrame>{
    if(this.disposed)throw Error('Art cache disposed');const e=this.entry(key);
    if(!e.texture){
      if(!e.promise){this.pending++;e.promise=(async()=>{
        let failure:unknown;
        for(let attempt=0;attempt<3;attempt++)try{
          const texture=await this.texture(e.source);
          texture.addRef();if(this.disposed){texture.decRef();throw Error('Art cache disposed');}e.texture=texture;return;
        }catch(error){failure=error;if(this.disposed)break;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));}
        throw failure;
      })().then(()=>{e.promise=null;this.pending--;},error=>{e.promise=null;this.pending--;throw error;});}
      await e.promise;
    }
    if(this.disposed||!e.texture)throw Error('Art cache disposed');
    if(!this.frames[key]){
      const {rect:[x,y,w,h],source}=this.specs[key],[sw,sh]=ART_SOURCE_SIZES[source],sx=e.texture.width/sw,sy=e.texture.height/sh;
      const frame=new SpriteFrame();frame.reset({texture:e.texture,rect:new Rect(x*sx,y*sy,w*sx,h*sy),originalSize:new Size(w*sx,h*sy)});frame.packable=false;
      this.frames[key]=frame;e.frames.add(key);
    }
    e.last=performance.now();return this.frames[key];
  }
  bind(node:Node,key:string){
    const previous=this.bindings.get(node);if(previous){this.entries.get(this.specs[previous].source)?.users.delete(node);}else node.on(Node.EventType.NODE_DESTROYED,()=>this.unbind(node));
    this.bindings.set(node,key);
    const sp=node.getComponent(Sprite)!;sp.sizeMode=Sprite.SizeMode.CUSTOM;sp.spriteFrame=this.frames[key]||null;
    // PageView builds all sheets synchronously; defer requests until it has
    // marked which sheet is actually visible.
    void Promise.resolve().then(()=>this.activate(node,key));
  }
  private visible(node:Node){for(let n:Node|null=node;n;n=n.parent)if((n as any).artPageVisible===false)return false;return true;}
  private activate(node:Node,key:string){
    if(this.disposed||!node.isValid||this.bindings.get(node)!==key)return;
    const sp=node.getComponent(Sprite)!,e=this.entry(key);
    if(!this.visible(node)){e.users.delete(node);sp.spriteFrame=null;return;}
    e.users.add(node);sp.spriteFrame=this.frames[key]||null;
    if(!sp.spriteFrame)void this.load(key).then(frame=>{if(node.isValid&&this.bindings.get(node)===key&&this.visible(node))sp.spriteFrame=frame;}).catch(error=>{if(!this.disposed&&node.isValid)console.warn('Art unavailable; reopening page retries',key,error);});
  }
  refreshVisibility(){for(const [node,key] of this.bindings)this.activate(node,key);}
  private unbind(node:Node){const key=this.bindings.get(node);if(key)this.entries.get(this.specs[key].source)?.users.delete(node);this.bindings.delete(node);}
  sweep(){
    const now=performance.now();let bytes=this.stats().bytes;
    for(const e of Array.from(this.entries.values()).sort((a,b)=>a.last-b.last)){
      for(const n of e.users)if(!n.isValid)this.unbind(n);
      if(!e.texture||e.promise||e.users.size)continue;
      if(bytes<=(this.nativeApp?96:32)*1024*1024&&now-e.last<(this.nativeApp?120000:4000))continue;
      bytes-=e.texture.width*e.texture.height*4;this.release(e);
    }
  }
  private release(e:Entry){for(const key of e.frames){this.frames[key].destroy();delete this.frames[key];}e.texture?.decRef();e.texture=null;this.entries.delete(e.source);}
  stats(){return {mode:this.nativeApp?'app-local':'web-demand',loads:this.loadCount,textures:Array.from(this.entries.values()).filter(e=>e.texture).length,bytes:Array.from(this.entries.values()).reduce((n,e)=>n+(e.texture?e.texture.width*e.texture.height*4:0),0),pending:this.pending,sources:Array.from(this.entries.values()).filter(e=>e.texture).map(e=>e.source)};}
  dispose(){this.disposed=true;for(const e of this.entries.values())if(e.texture)this.release(e);this.bindings.clear();}
}
