/** HTTPS time anchors + monotonic session elapsed time. Never trusts device wall time. */
export const CLOCK_LEASE_MS=10*60*1000;
export type TimeFetcher=()=>Promise<number>;
export async function fetchTrustedUtc():Promise<number>{
  const nonce=Math.random().toString(36).slice(2);
  const urls=['https://timeapi.io/api/time/current/zone?timeZone=UTC&_pm='+nonce,'https://worldtimeapi.org/api/timezone/Etc/UTC?_pm='+nonce];
  for(const url of urls){
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),5000);
    try{const response=await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:abort.signal});if(!response.ok)continue;
      const data=await response.json();let value:number;
      if(url.includes('timeapi.io')){if(data.timeZone!=='UTC'||typeof data.dateTime!=='string')continue;value=Date.parse(data.dateTime.replace(/(\.\d{3})\d+/, '$1')+'Z');}
      else{if(data.timezone!=='Etc/UTC'||typeof data.utc_datetime!=='string')continue;value=Date.parse(data.utc_datetime);}
      if(Number.isSafeInteger(value)&&value>=1577836800000&&value<4102444800000)return value;
    }catch{}finally{clearTimeout(timer);}
  }
  throw new Error('Trusted UTC unavailable');
}
export class TrustedClock {
  private anchor:{utc:number;mono:number}|null=null;private highWater=0;private pending:Promise<boolean>|null=null;private epoch=0;private hidden=false;
  constructor(private monotonic:()=>number=()=>performance.now(),private request:TimeFetcher=fetchTrustedUtc){}
  restore(lastMs:number){if(Number.isSafeInteger(lastMs)&&lastMs>=0)this.highWater=lastMs;}
  now():number|null {
    if(this.hidden||!this.anchor)return null;const elapsed=this.monotonic()-this.anchor.mono;
    if(!Number.isFinite(elapsed)||elapsed<0||elapsed>CLOCK_LEASE_MS)return null;
    const value=Math.floor(this.anchor.utc+elapsed);this.highWater=Math.max(this.highWater,value);return this.highWater;
  }
  checkpoint(){return this.now()??this.highWater;}
  suspend(){this.checkpoint();this.hidden=true;this.anchor=null;this.epoch++;}
  resume(){this.hidden=false;}
  sync():Promise<boolean>{
    if(this.pending)return this.pending;const epoch=this.epoch,start=this.monotonic();
    this.pending=(async()=>{try{const utc=await this.request(),end=this.monotonic();
      if(this.hidden||epoch!==this.epoch||!Number.isSafeInteger(utc)||utc<1577836800000||utc>=4102444800000||end<start||end-start>15000||utc<this.highWater-5000)return false;
      this.anchor={utc:Math.max(utc,this.highWater),mono:end};this.highWater=this.anchor.utc;return true;
    }catch{return false;}finally{this.pending=null;}})();return this.pending;
  }
}
