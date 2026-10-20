"""Copy approved generated assets; measure atlas cells without altering raster pixels."""
from pathlib import Path
from PIL import Image
import json, shutil, uuid

root=Path(__file__).resolve().parents[1]
generated=Path('C:/Users/k/.codex/generated_images/01a13a87-2b39-78e2-95d0-45f08d572726')
files={
 'fox':'exec-d2197d68-33dc-4021-b441-676ebbf37c64.png',
 'bud':'exec-d0a66b22-5004-4803-a3a8-0b3ea201a5ee.png',
 'otter':'exec-741be422-f3ef-49d8-8b8d-32415fcaf5d6.png',
 'scene':'exec-b796aa40-e037-4bc3-a3b7-491c930c829c.png'
}
dest=root/'art-source/app-battle-v1'
dest.mkdir(parents=True,exist_ok=True)
atlases={}
manifest={}
for name,source in files.items():
    key='app-coast-v1' if name=='scene' else 'app-'+name+'-poses-v1'
    target=root/'assets/resources/art'/f'{key}.png'
    shutil.copy2(generated/source,dest/f'{key}.png')
    shutil.copy2(generated/source,target)
    im=Image.open(target)
    meta=target.with_suffix('.png.meta')
    if not meta.exists():
        ident=str(uuid.uuid4())
        meta.write_text(json.dumps({'ver':'1.0.27','importer':'image','imported':False,'uuid':ident,'files':[],
            'subMetas':{},'userData':{'type':'texture','hasAlpha':name!='scene','fixAlphaTransparencyArtifacts':False}},indent=2),encoding='utf-8')
    manifest[name]={'file':str(target.relative_to(root)).replace('\\','/'),'source':source,'size':im.size,'bytes':target.stat().st_size}
    if name=='scene': continue
    w,h=im.size
    xs=[int(i*w/4) for i in range(5)]
    ys=[0,h//2,h]
    if name=='otter':xs=[0,450,900,1360,w];ys=[0,475,h]
    rects=[];feet=[]
    alpha=im.getchannel('A')
    for row in range(2):
        for col in range(4):
            x,y=xs[col],ys[row];cw,ch=xs[col+1]-x,ys[row+1]-y
            rects.append([x,y,cw,ch])
            region=alpha.crop((x,y,x+cw,y+ch))
            bbox=region.point(lambda p:255 if p>96 else 0).getbbox()
            assert bbox, (name,row,col)
            foot_y=bbox[3]-1
            # Lower feet/contact mass, ignoring broad tails and ears.
            bottom=region.crop((0,max(0,foot_y-12),cw,foot_y+1))
            points=[xx for yy in range(bottom.height) for xx in range(cw) if bottom.getpixel((xx,yy))>160]
            foot_x=sum(points)/len(points) if points else cw/2
            feet.append([round(foot_x/cw,5),round(foot_y/ch,5)])
    atlases[name]={'size':[w,h],'rects':rects,'feet':feet,'scale':1.25 if name=='bud' else 1}
text="""/** Approved APP pose atlases. Rects/feet measured from alpha; source PNGs remain unchanged. */
export const APP_BATTLE_IDS=['fox','bud','otter'];
export const APP_BATTLE_POSES=['idle','charge','attack','hurt'];
export const APP_BATTLE_ATLASES:Record<string,{size:[number,number];rects:number[][];feet:number[][];scale:number}>=DATA;
export function appPoseKey(id:string,side:'front'|'back',pose='idle'){return 'app-'+id+'-'+side+'-'+pose;}
export function appPoseRect(id:string,side:'front'|'back',pose='idle'){return APP_BATTLE_ATLASES[id].rects[(side==='back'?0:4)+APP_BATTLE_POSES.indexOf(pose)];}
export function appPoseFeet(id:string,side:'front'|'back',pose='idle'){return APP_BATTLE_ATLASES[id].feet[(side==='back'?0:4)+APP_BATTLE_POSES.indexOf(pose)];}
"""
(root/'assets/scripts/AppBattleArt.ts').write_text(text.replace('DATA',json.dumps(atlases,separators=(',',':'))),encoding='utf-8')
tsmeta=root/'assets/scripts/AppBattleArt.ts.meta'
if not tsmeta.exists():tsmeta.write_text(json.dumps({'ver':'4.0.24','importer':'typescript','imported':True,'uuid':str(uuid.uuid4()),'files':[],'subMetas':{},'userData':{}},indent=2),encoding='utf-8')
(dest/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(manifest,indent=2))
