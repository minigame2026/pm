/** Browser crash-safe mirror. Native/mini-game builds retain Cocos synchronous storage. */
export class DurableCheckpoint {
  private db:IDBDatabase|null=null;
  async open():Promise<string|null>{
    if(typeof indexedDB==='undefined')return null;
    try{
      this.db=await new Promise<IDBDatabase>((resolve,reject)=>{
        const request=indexedDB.open('pm-checkpoints-v1',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('saves');
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
        request.onblocked=()=>reject(new Error('Checkpoint database blocked'));
      });
      this.db.onversionchange=()=>{this.db?.close();this.db=null;};
      return await new Promise<string|null>((resolve,reject)=>{
        const tx=this.db!.transaction('saves','readonly'),request=tx.objectStore('saves').get('current');
        tx.oncomplete=()=>resolve(typeof request.result==='string'?request.result:null);
        tx.onerror=tx.onabort=()=>reject(tx.error);
      });
    }catch{return null;}
  }
  get available(){return this.db!==null;}
  write(raw:string):Promise<boolean>{
    if(!this.db)return Promise.resolve(false);
    return new Promise(resolve=>{
      try{
        // A successful strict transaction confirms persistence, unlike a localStorage cache update.
        const tx=this.db!.transaction('saves','readwrite',{durability:'strict'});
        tx.objectStore('saves').put(raw,'current');
        tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(false);
      }catch{resolve(false);}
    });
  }
  close(){this.db?.close();this.db=null;}
}
