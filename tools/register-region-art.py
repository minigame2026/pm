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

def atlas_groups(parts):
    """Keep detached crown stones etc. with their nearest of six main silhouettes."""
    main=sorted(parts[:6],key=lambda p:(p[1][1]+p[1][3])/2)
    assert len(main)==6 and min(p[0] for p in main)>1500,'expected six substantial sprites'
    main=[part for row in range(3) for part in sorted(main[row*2:row*2+2],key=lambda p:p[1][0])]
    groups=[[part] for part in main]
    for part in parts[6:]:
        x,y,r,b=part[1];cx=(x+r)/2;cy=(y+b)/2
        def distance(anchor):
            ax,ay,ar,ab=anchor[1]
            return max(ax-cx,0,cx-ar)**2+max(ay-cy,0,cy-ab)**2
        nearest=min(range(6),key=lambda i:distance(main[i]))
        groups[nearest].append(part)
    return groups

def atlas_rectangles(groups,width,height):
    """Pad only into clear inter-cell space; never trim the measured silhouettes."""
    bounds=[]
    for group in groups:
        boxes=[part[1] for part in group]
        bounds.append([min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)])
    rectangles=[]
    for i,(x,y,r,b) in enumerate(bounds):
        padded=[max(0,x-2),max(0,y-2),min(width,r+2),min(height,b+2)]
        for j,(ox,oy,orr,ob) in enumerate(bounds):
            if i==j:continue
            if min(r,orr)>max(x,ox):
                if b<=oy:padded[3]=min(padded[3],oy)
                if y>=ob:padded[1]=max(padded[1],ob)
            if min(b,ob)>max(y,oy):
                if r<=ox:padded[2]=min(padded[2],ox)
                if x>=orr:padded[0]=max(padded[0],orr)
        rectangles.append(padded)
    return rectangles

bundle=sys.argv[1] if len(sys.argv)>1 else 'regions-4-6'
assert bundle in ['regions-4-6','regions-7-9','regions-10-12','friends-v1']
manifest=json.loads((root/f'art-source/{bundle}/generation.json').read_text(encoding='utf-8'))
if bundle=='regions-10-12':
    roster=json.loads((root/f'art-source/{bundle}/roster.json').read_text(encoding='utf-8'))
    expected={pet['id'] for pet in roster['pets']}
    assert len(manifest)==len(expected) and {item['id'] for item in manifest}==expected,'New region atlas set is incomplete or duplicated'
existing=(root/'assets/scripts/RegionArt.ts').read_text(encoding='utf-8')
out=json.loads(existing[existing.index(' = ')+3:].strip().rstrip(';'));report=[]
for item in manifest:
    pet_id=item['id'];dest=root/f'assets/resources/art/{pet_id}-forms-v1.png'
    shutil.copyfile(item['source'],dest)
    img=Image.open(dest);assert img.mode=='RGBA',(pet_id,'missing alpha')
    a=np.asarray(img)[:,:,3];parts=components(a>100)
    main=sorted(parts[:6],key=lambda p:(p[1][1]+p[1][3])/2)
    if bundle=='regions-10-12':
        groups=atlas_groups(parts)
        main=[(sum(part[0] for part in group),box) for group,box in zip(groups,atlas_rectangles(groups,img.width,img.height))]
    assert len(main)==6 and main[-1][0]>1500,(pet_id,'expected six substantial sprites',parts[:8])
    assert (a==0).mean()>.1,(pet_id,'background not transparent')
    out[pet_id]={}
    for row,rarity in enumerate(['normal','SR','SSR']):
        pair=sorted(main[row*2:row*2+2],key=lambda p:p[1][0]);out[pet_id][rarity]={}
        assert pair[0][1][0]<img.width/2 and pair[1][1][0]>=img.width*.40,(pet_id,rarity,'invalid columns')
        for side,(_,box) in zip(['back','front'],pair):
            x,y,r,b=box
            if bundle!='regions-10-12':x=max(0,x-2);y=max(0,y-2);r=min(img.width,r+2);b=min(img.height,b+2)
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
sizes_path=root/'assets/scripts/ArtSourceSizes.ts'
sizes_source=sizes_path.read_text(encoding='utf-8')
sizes=json.loads(sizes_source[sizes_source.index('>=')+2:].strip().rstrip(';'))
for item in report:sizes[item['id']+'-forms-v1']=list(item['size'])
sizes_path.write_text('// Original pixel coordinates; runtime textures are scaled independently.\nexport const ART_SOURCE_SIZES:Record<string,[number,number]>='+json.dumps(sizes,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({'sheets':len(report),'sprites':len(report)*6,'megabytes':round(sum(r['bytes'] for r in report)/1048576,2)}))
