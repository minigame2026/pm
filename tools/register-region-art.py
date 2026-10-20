"""Copy generated six-view atlases unchanged and measure alpha, rectangles and feet."""
from pathlib import Path
import ast,json,shutil,uuid,sys
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
# Reuse the existing connected-component measurement, without running its old import job.
tree=ast.parse((root/'tools/register-evolution-art.py').read_text(encoding='utf-8-sig'))
function=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='components')
scope={'np':np};exec(compile(ast.Module(body=[function],type_ignores=[]),'<components>','exec'),scope)
components=scope['components']
bundle=sys.argv[1] if len(sys.argv)>1 else 'regions-4-6'
assert bundle in ['regions-4-6','regions-7-9']
manifest=json.loads((root/f'art-source/{bundle}/generation.json').read_text(encoding='utf-8'))
existing=(root/'assets/scripts/RegionArt.ts').read_text(encoding='utf-8')
out=json.loads(existing[existing.index(' = ')+3:].strip().rstrip(';'));report=[]
for item in manifest:
    pet_id=item['id'];dest=root/f'assets/resources/art/{pet_id}-forms-v1.png'
    shutil.copyfile(item['source'],dest)
    img=Image.open(dest);assert img.mode=='RGBA',(pet_id,'missing alpha')
    a=np.asarray(img)[:,:,3];parts=components(a>100)
    main=sorted(parts[:6],key=lambda p:(p[1][1]+p[1][3])/2)
    assert len(main)==6 and main[-1][0]>1500,(pet_id,'expected six substantial sprites',parts[:8])
    assert (a==0).mean()>.1,(pet_id,'background not transparent')
    out[pet_id]={}
    for row,rarity in enumerate(['normal','SR','SSR']):
        pair=sorted(main[row*2:row*2+2],key=lambda p:p[1][0]);out[pet_id][rarity]={}
        assert pair[0][1][0]<img.width/2 and pair[1][1][0]>=img.width*.40,(pet_id,rarity,'invalid columns')
        for side,(_,box) in zip(['back','front'],pair):
            x,y,r,b=box;x=max(0,x-2);y=max(0,y-2);r=min(img.width,r+2);b=min(img.height,b+2)
            w=r-x;h=b-y;foot=a[y+int(h*.90):b,x:r]>100;fy,fx=np.where(foot)
            u=float((fx.min()+fx.max())/2/w) if len(fx) else .5
            out[pet_id][rarity][side]={'rect':[x,y,w,h],'feet':[round(u,4),.97]}
    meta=Path(str(dest)+'.meta')
    if not meta.exists():
        template=json.loads((root/'assets/resources/art/fox-evolution-v1.png.meta').read_text(encoding='utf-8-sig'))
        old=template['uuid'];template=json.loads(json.dumps(template).replace(old,str(uuid.uuid4())).replace('fox-evolution-v1',dest.stem))
        meta.write_text(json.dumps(template,indent=2),encoding='utf-8')
    report.append({'id':pet_id,'file':str(dest.relative_to(root)).replace('\\','/'),'size':img.size,'bytes':dest.stat().st_size,'transparentFraction':round(float((a==0).mean()),4),'views':out[pet_id]})
(root/'assets/scripts/RegionArt.ts').write_text('// Geometry measured from original generated alpha; pixels are not edited.\nexport const REGION_ART:Record<string,Record<string,Record<string,{rect:number[];feet:number[]}>>> = '+json.dumps(out,separators=(',',':'))+';\n',encoding='utf-8')
(root/f'art-source/{bundle}/art-index.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'sheets':len(report),'sprites':len(report)*6,'megabytes':round(sum(r['bytes'] for r in report)/1048576,2)}))
