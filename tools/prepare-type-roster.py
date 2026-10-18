"""Copy generated source art and index alpha bounds; preserve original PNG pixels."""
from pathlib import Path
from PIL import Image
import json, shutil, uuid, re

root=Path(__file__).resolve().parents[1]
source=root/'art-source/type-roster-v1'
catalog=json.loads((root/'docs/pets/catalog.json').read_text(encoding='utf-8'))
manifest=json.loads((source/'generated-manifest.json').read_text(encoding='utf-8'))
art=root/'assets/resources/art'
old=(root/'assets/scripts/BattleArt.ts').read_text(encoding='utf-8')
rects=json.loads(re.search(r'BATTLE_RECTS\s*=\s*(\{.*?\});',old,re.S).group(1))
feet={}
template=json.loads((art/'fox.png.meta').read_text(encoding='utf-8'))
report=[]
for item in manifest:
    pet=next(p for p in catalog if p['id']==item['id'])
    folder=source/pet['rank']/(pet['typeId']+'-'+pet['id']);folder.mkdir(parents=True,exist_ok=True)
    original=Path(item['path']);dest=folder/'sheet.png'
    shutil.copy2(original,dest)
    (folder/'prompt.txt').write_text(item['prompt'],encoding='utf-8')
    runtime=art/(pet['id']+'-battle-v1.png');shutil.copy2(original,runtime)
    im=Image.open(runtime)
    assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0,pet['id']
    w,h=im.size;alpha=im.getchannel('A');rects[pet['id']]={};feet[pet['id']]={}
    for side,left,right in [('back',0,w//2),('front',w//2,w)]:
        mask=alpha.crop((left,0,right,h)).point(lambda a:255 if a>=32 else 0)
        x0,y0,x1,y1=mask.getbbox();x0=max(0,x0-2);y0=max(0,y0-2);x1=min(right-left,x1+2);y1=min(h,y1+2)
        rects[pet['id']][side]=[left+x0,y0,x1-x0,y1-y0]
        # Bottom 12% estimates the contact center rather than the tail/ear bounds.
        contact=mask.crop((x0,int(y0+(y1-y0)*.88),x1,y1)).getbbox()
        u=(contact[0]+contact[2])/(2*(x1-x0)) if contact else .5
        feet[pet['id']][side]=[round(u,4),.97]
    overrides={'dragon':{'back':[.60,.88],'front':[.45,.95]},'beetle':{'back':[.54,.90],'front':[.50,.90]},'ghost':{'back':[.5,.94],'front':[.5,.94]}}
    if pet['id'] in overrides:feet[pet['id']]=overrides[pet['id']]
    meta_path=runtime.with_suffix('.png.meta')
    if not meta_path.exists():
        meta=json.loads(json.dumps(template).replace(template['uuid'],str(uuid.uuid4())))
        for sub in meta['subMetas'].values():sub['displayName']=runtime.stem
        frame=meta['subMetas']['f9941']['userData'];frame.update(width=w,height=h,rawWidth=w,rawHeight=h,trimX=0,trimY=0,offsetX=0,offsetY=0,packable=False,trimType='none');frame.pop('vertices',None)
        meta_path.write_text(json.dumps(meta,indent=2),encoding='utf-8')
    report.append({'id':pet['id'],'size':[w,h],'bytes':runtime.stat().st_size,'rects':rects[pet['id']],'feet':feet[pet['id']],'source':str(dest.relative_to(root)).replace('\\','/')})
(root/'assets/scripts/BattleArt.ts').write_text('// Sprite rectangles preserve generated PNGs; front views also serve as collection portraits.\nexport const BATTLE_RECTS = '+json.dumps(rects,indent=2)+';\nexport const PET_FEET = '+json.dumps(feet,indent=2)+';\n',encoding='utf-8')
(root/'docs/pets/art-index.json').write_text(json.dumps({'rects':rects,'feet':feet,'files':report},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'prepared':len(report),'ids':[r['id'] for r in report],'runtimeMB':round(sum(r['bytes'] for r in report)/1048576,2)}))
