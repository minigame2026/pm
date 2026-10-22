/* Validate only the region 10–12 atlases; read original alpha without changing pixels. */
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('node:assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),bundle=path.join(root,'art-source/regions-10-12');
const roster=JSON.parse(fs.readFileSync(path.join(bundle,'roster.json'),'utf8'));
const generation=JSON.parse(fs.readFileSync(path.join(bundle,'generation.json'),'utf8'));
const data=(file)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').split(/\s=\s|>=/).slice(1).join(' = ').trim().replace(/;$/,''));
const rects=data('assets/scripts/RegionArt.ts'),sizes=data('assets/scripts/ArtSourceSizes.ts');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'art-source/runtime-masters-v1/manifest.json'),'utf8'));
assert.equal(roster.pets.length,18,'18 new species');assert.equal(generation.length,roster.pets.length,'all generation jobs finished');
assert.deepEqual([...new Set(generation.map(p=>p.id))].sort(),roster.pets.map(p=>p.id).sort(),'manifest IDs match current roster');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputs=roster.pets.map(pet=>{
 const item=generation.find(item=>item.id===pet.id),file=pet.id+'-forms-v1.png',runtime=path.join(root,'assets/resources/art',file),source=path.join(root,'art-source/runtime-masters-v1',file),entry=manifest.find(r=>r.file===file);
 for(const f of [runtime,source,item.source,runtime+'.meta'])assert(fs.existsSync(f),'missing '+f);
 assert(entry,'missing runtime manifest '+file);assert.deepEqual(entry.sourceSize,sizes[file.slice(0,-4)],'source coordinates retained '+file);
 assert.equal(hash(source),hash(item.source),'master is the unchanged generated image '+file);assert.equal(hash(source),entry.sourceSha256,'manifest hash '+file);
 const views=[];for(const rarity of ['normal','SR','SSR'])for(const side of ['back','front']){const view=rects[pet.id]?.[rarity]?.[side];assert(view,'missing '+pet.id+'/'+rarity+'/'+side);views.push({rarity,side,...view});}
 return {id:pet.id,source,runtime,sourceSize:entry.sourceSize,runtimeSize:entry.runtimeSize,views};
});
const python=process.env.PM_PYTHON||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const code=String.raw`
from pathlib import Path
import ast,json,sys,numpy as np
from PIL import Image
payload=json.load(sys.stdin)
source=(Path(payload['root'])/'tools/register-evolution-art.py').read_text(encoding='utf-8-sig')
fn=next(n for n in ast.parse(source).body if isinstance(n,ast.FunctionDef) and n.name=='components')
# Instrument the established run-length component finder to retain component labels.
code=ast.get_source_segment(source,fn)
code=code.replace('parents=[];bounds=[];areas=[];prev=[]','parents=[];bounds=[];areas=[];prev=[];runs=[]')
code=code.replace('current.append((x,e,i))','current.append((x,e,i));runs.append((y,int(x),int(e),i))')
code=code.replace('return sorted([(areas[i],bounds[i]) for i in range(len(parents)) if find(i)==i],reverse=True)','labels=np.full(mask.shape,-1,dtype=np.int32)\n    for y,x,e,i in runs:labels[y,x:e]=find(i)\n    return sorted([(areas[i],bounds[i],i) for i in range(len(parents)) if find(i)==i],reverse=True),labels')
scope={'np':np};exec(code,scope)
register=(Path(payload['root'])/'tools/register-region-art.py').read_text(encoding='utf-8')
group_fn=next(n for n in ast.parse(register).body if isinstance(n,ast.FunctionDef) and n.name=='atlas_groups')
exec(compile(ast.Module(body=[group_fn],type_ignores=[]),'<atlas-groups>','exec'),scope)
results=[];errors=[]
for item in payload['items']:
 try:
  im=Image.open(item['source']);runtime=Image.open(item['runtime'])
  assert im.mode=='RGBA' and runtime.mode=='RGBA','missing RGBA alpha'
  assert list(im.size)==item['sourceSize'] and list(runtime.size)==item['runtimeSize'],'source/runtime size mismatch'
  assert max(runtime.size)<=1024,'runtime atlas exceeds 1024px'
  assert abs(runtime.width/im.width-runtime.height/im.height)<.002,'runtime aspect ratio changed'
  a=np.asarray(im)[:,:,3];assert (a==0).mean()>.1,'background not transparent'
  parts,labels=scope['components'](a>100);groups=scope['atlas_groups'](parts)
  for group in groups:
   main=group[0][1]
   assert main[2]-main[0]<im.width*.75,'main silhouette joins both columns'
  for view,group in zip(item['views'],groups):
   x,y,w,h=view['rect'];assert all(isinstance(v,int) for v in [x,y,w,h]),'noninteger atlas rect'
   assert 0<=x<x+w<=im.width and 0<=y<y+h<=im.height,'rect exceeds source'
   assert all(x<=box[0] and y<=box[1] and x+w>=box[2] and y+h>=box[3] for _,box,_ in group),'silhouette or detached crown stone cropped'
   crop=labels[y:y+h,x:x+w]
   identities={identity for _,_,identity in group}
   foreign=sum(int((crop==other).sum()) for _,_,other in parts if other not in identities)
   assert foreign==0,view['rarity']+'/'+view['side']+' rect includes '+str(foreign)+' pixels from another sprite'
   assert 0<=view['feet'][0]<=1 and 0<=view['feet'][1]<=1,'feet anchor exceeds view'
  results.append({'id':item['id'],'views':6,'sourceSize':im.size,'runtimeSize':runtime.size})
 except (AssertionError,ValueError) as e:errors.append(item['id']+': '+str(e))
print(json.dumps({'results':results,'errors':errors}))
`;
const report=JSON.parse(execFileSync(python,['-c',code],{input:JSON.stringify({root,items:inputs}),encoding:'utf8',maxBuffer:1024*1024}));
assert.deepEqual(report.errors,[],'atlas validation failed');assert.equal(report.results.length,18);
console.log('PASS 18 legendary atlases / 108 isolated views, unchanged masters, original coordinates, <=1024px runtime textures');
