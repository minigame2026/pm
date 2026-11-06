import { native, sys } from 'cc';

export type TapArchive = { uuid:string; fileId:string; name:string; modifiedTime?:number; summary?:string };
type Host = Record<string,any>;
/** Platform services only. No developer server, login code or server secret is persisted. */
export class PMTapServices {
  connected=false;
  playAllowed=false;
  onCompliance:((allowed:boolean,code:number)=>void)|null=null;
  private certificationPending=false;
  private readyReported=false;
  private serial=0;
  private pending=new Map<string,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
  constructor(private host:Host=globalThis as any,
    private android=sys.isNative&&sys.os===sys.OS.ANDROID,
    private invoke=(id:string,op:string,data:string)=>native.reflection.callStaticMethod(
      'com/cocos/game/PMTapServices','request','(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V',id,op,data)) {
    this.playAllowed=!android;
    if(android)host.__pmTapComplianceResult=(code:number)=>{
      if(code===500&&!this.certificationPending&&!this.playAllowed)return;
      this.certificationPending=code===0;
      this.playAllowed=code===500;
      this.connected=this.playAllowed;
      this.onCompliance?.(this.playAllowed,code);
    };
    if(android)host.__pmTapServiceResult=(id:string,ok:boolean,result:any)=>{
      const p=this.pending.get(id);if(!p)return;this.pending.delete(id);clearTimeout(p.timer);
      ok?p.resolve(result):p.reject(new Error('Tap service unavailable'));
    };
  }
  get available(){return this.android||typeof this.host.tap?.getCloudSaveManager==='function';}
  get requiresCompliance(){return this.android;}
  reportReady(){
    if(this.android||this.readyReported||typeof this.host.tap?.reportScene!=='function')return;
    try{this.host.tap.reportScene({sceneId:7});this.readyReported=true;}catch{}
  }
  private call(target:any,method:string,options:Record<string,any>={}):Promise<any>{
    return new Promise((resolve,reject)=>{
      let done=false;const finish=(ok:boolean,value:any)=>{if(done)return;done=true;clearTimeout(timer);ok?resolve(value):reject(new Error('Tap service unavailable'));};
      const timer=setTimeout(()=>finish(false,null),60000);
      try{target[method]({...options,success:(v:any)=>finish(true,v),fail:()=>finish(false,null)});}catch{finish(false,null);}
    });
  }
  private request(op:string,data:any={}):Promise<any>{
    return new Promise((resolve,reject)=>{
      const id=String(++this.serial),timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Tap service timeout'));},180000);
      this.pending.set(id,{resolve,reject,timer});
      try{this.invoke(id,op,JSON.stringify(data));}catch{clearTimeout(timer);this.pending.delete(id);reject(new Error('Tap service unavailable'));}
    });
  }
  async login(){
    if(!this.available)throw new Error('Tap unavailable');
    if(this.android){
      const result=await this.request('login');
      if(result?.complianceCode!==500||!this.playAllowed)throw new Error('Certification required');
    }
    else {
      // code is a temporary credential only; the host cloud service owns account authentication.
      const result=await this.call(this.host.tap,'login');
      if(!result?.code)throw new Error('Tap login failed');
      await this.list();
    }
    this.connected=true;
  }
  async list():Promise<TapArchive[]>{
    const result=this.android?await this.request('list'):await this.call(this.host.tap.getCloudSaveManager(),'getArchiveList');
    const saves=this.android?result:result?.saves;
    if(!Array.isArray(saves))throw new Error('Invalid Tap archive list');
    return saves.filter((a:any)=>a?.name==='pm_save_v1'&&typeof a.uuid==='string'&&typeof a.fileId==='string');
  }
  async upload(raw:string,archive?:TapArchive){
    if(!this.connected)throw new Error('Login required');
    if(raw.length>4000000)throw new Error('Save too large');
    if(this.android){await this.request('upload',{raw,uuid:archive?.uuid||''});return;}
    const tap=this.host.tap,fs=tap.getFileSystemManager(),path=tap.env.USER_DATA_PATH+'/pm_cloud_upload.json';
    await this.call(fs,'writeFile',{filePath:path,data:raw,encoding:'utf8'});
    await this.call(tap.getCloudSaveManager(),archive?'updateArchive':'createArchive',{
      archiveUUID:archive?.uuid,archiveMetaData:{name:'pm_save_v1',summary:'Dice Pet progress',playtime:0,extra:'pm-save-v1'},archiveFilePath:path
    });
  }
  async download(archive:TapArchive):Promise<string>{
    if(!this.connected)throw new Error('Login required');
    if(this.android)return (await this.request('download',archive)).raw;
    const tap=this.host.tap,fs=tap.getFileSystemManager();
    const file=await this.call(tap.getCloudSaveManager(),'getArchiveData',{archiveUUID:archive.uuid,archiveFileId:archive.fileId});
    const result=await this.call(fs,'readFile',{filePath:file.filePath,encoding:'utf8'});
    if(typeof result.data!=='string'||result.data.length>4000000)throw new Error('Invalid save');
    return result.data;
  }
}
