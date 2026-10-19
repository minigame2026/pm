"""Copy generated source PNGs unchanged; measure atlas rectangles and foot anchors.
Reads alpha only. Does not alter generated pixels.
"""
from pathlib import Path
import json,shutil,uuid
import numpy as np
from PIL import Image
root=Path('D:/game/PM');manifest=json.loads((root/'art-source/evolution-v1/generation.json').read_text(encoding='utf-8'))
def components(mask):
    parents=[];bounds=[];areas=[];prev=[]
    def find(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    for y,row in enumerate(mask):
        changes=np.diff(np.r_[False,row,False].astype('int8'));starts=np.where(changes==1)[0];ends=np.where(changes==-1)[0];current=[];j=0
        for x,e in zip(starts,ends):
            while j<len(prev) and prev[j][1]<x:j+=1
            near=[];k=j
            while k<len(prev) and prev[k][0]<=e:near.append(find(prev[k][2]));k+=1
            if near:
                i=near[0]
                for other in set(near):
                    other=find(other);i=find(i)
                    if other==i:continue
                    parents[other]=i;areas[i]+=areas[other];a,b=bounds[i],bounds[other];bounds[i]=[min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3])]
                a=bounds[i];bounds[i]=[min(a[0],int(x)),min(a[1],y),max(a[2],int(e)),y+1];areas[i]+=int(e-x)
            else:i=len(parents);parents.append(i);bounds.append([int(x),y,int(e),y+1]);areas.append(int(e-x))
            current.append((x,e,i))
        prev=current
    return sorted([(areas[i],bounds[i]) for i in range(len(parents)) if find(i)==i],reverse=True)
out={};report=[]
for item in manifest:
    id=item['id'];dest=root/f'assets/resources/art/{id}-evolution-v1.png';shutil.copyfile(item['source'],dest)
    img=Image.open(dest);a=np.array(img.getchannel('A'));parts=components(a>100);main=sorted(parts[:4],key=lambda p:(p[1][1]+p[1][3])/2)
    assert len(main)==4 and main[-1][0]>10000,(id,parts[:6])
    out[id]={}
    for rarity,pair in [('SR',main[:2]),('SSR',main[2:])]:
        out[id][rarity]={}
        for side,(_,box) in zip(['back','front'],sorted(pair,key=lambda p:p[1][0])):
            x,y,r,b=box;w=r-x;h=b-y;foot=a[y+int(h*.88):b,x:r]>100;fy,fx=np.where(foot)
            u=float((fx.min()+fx.max())/2/w) if len(fx) else .5
            out[id][rarity][side]={'rect':[x,y,w,h],'feet':[round(u,4),.97]}
    meta=Path(str(dest)+'.meta')
    if not meta.exists():
        template=json.loads((root/'assets/resources/art/fox-battle-ref.png.meta').read_text(encoding='utf-8-sig'));old=template['uuid'];new=str(uuid.uuid4());raw=json.dumps(template).replace(old,new).replace('fox-battle-ref',dest.stem);template=json.loads(raw)
        # These sheets are consumed as textures; atlas rectangles live in EvolutionArt.ts.
        template['subMetas']={k:v for k,v in template['subMetas'].items() if v['importer']=='texture'}
        meta.write_text(json.dumps(template,indent=2),encoding='utf-8')
    report.append({'id':id,'size':img.size,'components':[p[0] for p in parts[:5]],'rects':out[id]})
(root/'assets/scripts/EvolutionArt.ts').write_text('// Atlas geometry measured from unmodified generated alpha.\nexport const EVOLUTION_ART:Record<string,Record<string,Record<string,{rect:number[];feet:number[]}>>> = '+json.dumps(out,separators=(',',':'))+';\n',encoding='utf-8')
(root/'checks/evolution-art-analysis.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Registered',len(out),'sheets;',len(out)*4,'sprites')
for r in report:print(r['id'],r['size'],r['components'])
