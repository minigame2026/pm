import { Camera, Color, Director, Label, Node, RenderTexture, UITransform, Vec3, director, native, sys } from 'cc';
import qr from './vendor/QRCode';
import decodeQR from './vendor/QRReader';

export function qrCells(code:string):boolean[][] {const q:any=qr(0,'M');q.addData(code);q.make();return Array.from({length:q.getModuleCount()},(_,y)=>Array.from({length:q.getModuleCount()},(_,x)=>q.isDark(y,x)));}
export interface CardImage {pixels:Uint8Array;width:number;height:number;blob?:Blob;path?:string}
const android=()=>sys.isNative&&sys.os===sys.OS.ANDROID;
const call=(name:string,sig:string,...args:any[])=>native.reflection.callStaticMethod('com/cocos/game/PMShare',name,sig,...args);
export async function capturePostcard(card:Node):Promise<CardImage>{
 const width=720,height=960,ui=card.getComponent(UITransform)!,target=new RenderTexture();target.reset({width,height});
 const node=new Node('Postcard Camera');card.scene!.addChild(node);const camera=node.addComponent(Camera),layers:[Node,number][]=[],labels:{label:Label;size:number;line:number;scale:Vec3;w:number;h:number;outline:number}[]=[];
 // Re-rasterize text at export resolution; do not enlarge a phone-sized glyph bitmap.
 const factor=width/(ui.width*card.worldScale.x);
 const walk=(n:Node)=>{layers.push([n,n.layer]);n.layer=1<<20;const label=n.getComponent(Label),box=n.getComponent(UITransform);if(label&&box){labels.push({label,size:label.fontSize,line:label.lineHeight,scale:n.scale.clone(),w:box.width,h:box.height,outline:label.outlineWidth});label.fontSize*=factor;label.lineHeight*=factor;label.outlineWidth*=factor;box.setContentSize(box.width*factor,box.height*factor);n.setScale(n.scale.x/factor,n.scale.y/factor,n.scale.z);}n.children.forEach(walk);};walk(card);
 camera.projection=Camera.ProjectionType.ORTHO;camera.orthoHeight=ui.height*card.worldScale.y/2;camera.near=.1;camera.far=2000;camera.clearFlags=Camera.ClearFlag.SOLID_COLOR;camera.clearColor=new Color(255,250,234,255);camera.visibility=1<<20;camera.targetTexture=target;node.setWorldPosition(card.worldPosition.x,card.worldPosition.y,1000);
 try{await new Promise<void>(resolve=>director.once(Director.EVENT_AFTER_DRAW,resolve));const raw=target.readPixels();if(!raw)throw Error('capture');const pixels=new Uint8Array(raw.length);for(let y=0;y<height;y++)pixels.set(raw.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);return {pixels,width,height};}
 finally{camera.targetTexture=null;layers.forEach(([n,layer])=>{if(n.isValid)n.layer=layer;});labels.forEach(v=>{if(!v.label.isValid)return;v.label.fontSize=v.size;v.label.lineHeight=v.line;v.label.outlineWidth=v.outline;v.label.node.getComponent(UITransform)!.setContentSize(v.w,v.h);v.label.node.setScale(v.scale);});node.destroy();target.destroy();}
}
export async function prepareCard(image:CardImage):Promise<CardImage>{
 if(android()){const path=call('imagePath','()Ljava/lang/String;');if(!path)throw Error('path');await native.saveImageData(image.pixels,image.width,image.height,path);image.path=path;return image;}
 const host=globalThis as any,mini=host.wx||host.tt;if(mini?.createCanvas){const canvas=mini.createCanvas();canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d'),data=ctx.createImageData(image.width,image.height);data.data.set(image.pixels);ctx.putImageData(data,0,0);image.path=await new Promise<string>((resolve,reject)=>canvas.toTempFilePath({success:r=>resolve(r.tempFilePath),fail:reject}));return image;}
 if(typeof document==='undefined')throw Error('unsupported');const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.putImageData(new ImageData(new Uint8ClampedArray(image.pixels),image.width,image.height),0,0);image.blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('capture')),'image/png'));return image;
}
export async function sendCard(image:CardImage,text:string,saveOnly=false):Promise<'opened'|'saved'|'cancelled'>{
 if(android()){
  if(saveOnly){const host=globalThis as any,id=String(++serial);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{delete host.__pmSaveCard;resolve('cancelled');},120000);host.__pmSaveCard=(key:string,ok:boolean)=>{if(key!==id)return;clearTimeout(timer);delete host.__pmSaveCard;resolve(ok?'saved':'cancelled');};try{call('saveImage','(Ljava/lang/String;Ljava/lang/String;)V',image.path||'',id);}catch(e){clearTimeout(timer);delete host.__pmSaveCard;reject(e);}});}
  call('share','(Ljava/lang/String;Ljava/lang/String;)V',image.path||'',text);return 'opened';
 }
 const host=globalThis as any,mini=host.wx||host.tt;
 if(mini&&image.path){if(saveOnly&&mini.saveImageToPhotosAlbum){await new Promise<void>((resolve,reject)=>mini.saveImageToPhotosAlbum({filePath:image.path,success:resolve,fail:reject}));return 'saved';}if(mini.shareAppMessage){mini.shareAppMessage({title:text.split('\n')[0],imageUrl:image.path,query:'postcard='+encodeURIComponent(text.match(/PMV2\.[A-Za-z0-9_.-]+/)?.[0]||'')});return 'opened';}}
 if(!image.blob)throw Error('unsupported');const file=new File([image.blob],'Dice-Pet-Postcard.png',{type:'image/png'});
 if(!saveOnly&&navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],text});return 'opened';}catch(e){if(e?.name==='AbortError')return 'cancelled';throw e;}}
 const url=URL.createObjectURL(image.blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'saved';
}
export async function copyVisitCode(text:string):Promise<boolean>{try{if(android()){call('copy','(Ljava/lang/String;)V',text);return true;}const host=globalThis as any,mini=host.wx||host.tt;if(mini?.setClipboardData){await new Promise<void>((resolve,reject)=>mini.setClipboardData({data:text,success:resolve,fail:reject}));return true;}await navigator.clipboard.writeText(text);return true;}catch{return false;}}
export async function pasteVisitCode():Promise<string>{if(android())return call('paste','()Ljava/lang/String;')||'';const host=globalThis as any,mini=host.wx||host.tt;if(mini?.getClipboardData)return new Promise((resolve,reject)=>mini.getClipboardData({success:r=>resolve(r.data),fail:reject}));return navigator.clipboard.readText();}
let serial=0;
export async function importCardImage():Promise<string>{
 if(android()){const host=globalThis as any,id=String(++serial);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{delete host.__pmImageCode;resolve('');},120000);host.__pmImageCode=(key:string,code:string)=>{if(key!==id)return;clearTimeout(timer);delete host.__pmImageCode;resolve(code);};try{call('pickImage','(Ljava/lang/String;)V',id);}catch(e){clearTimeout(timer);delete host.__pmImageCode;reject(e);}});}
 if(typeof document==='undefined')throw Error('unsupported');return new Promise((resolve,reject)=>{const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.oncancel=()=>resolve('');input.onchange=async()=>{const file=input.files?.[0];if(!file){resolve('');return;}if(file.size>12*1024*1024){reject(Error('size'));return;}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{const scale=Math.min(1,1600/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0,canvas.width,canvas.height);const data=ctx.getImageData(0,0,canvas.width,canvas.height);resolve((decodeQR as any)(data.data,data.width,data.height,{inversionAttempts:'attemptBoth'})?.data||'');}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('image'));};img.src=url;};input.click();});
}
export function incomingPostcard():string {try{if(android())return call('consumeIncoming','()Ljava/lang/String;')||'';const host=globalThis as any,mini=host.wx||host.tt;if(mini?.getLaunchOptionsSync)return mini.getLaunchOptionsSync().query?.postcard||'';return new URLSearchParams(location.hash.replace(/^#/, '')||location.search).get('postcard')||'';}catch{return '';}}
