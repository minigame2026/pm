from pathlib import Path
import json,uuid,shutil
from PIL import Image
root=Path('D:/game/PM')
old=Path('C:/Users/k/Documents/Codex/2026-10-14/x20-x20/outputs/cocos-character-validation-v0.1')
gen=Path('C:/Users/k/.codex/generated_images/01a13a87-2b39-78e2-95d0-45f08d572726')
def put(path,obj):
    p=root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf8')
def uid():return str(uuid.uuid4())
def compact(u):
    s=u.replace('-',''); chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    return s[:5]+''.join(chars[int(s[i:i+3],16)>>6]+chars[int(s[i:i+3],16)&63] for i in range(5,32,3))
for name in ['assets/resources/art','assets/scenes','checks','art-source','settings/v2/packages']: (root/name).mkdir(parents=True,exist_ok=True)
shutil.copy2(gen/'exec-cba314a5-8685-4336-9ef4-7f4a2d6f63d0.png',root/'art-source/pets-original.png')
shutil.copy2(gen/'exec-f02d381c-0b3f-4860-88ad-6e5e1fb2975d.png',root/'art-source/background-original.png')
im=Image.open(root/'art-source/pets-original.png').convert('RGBA')
for i,name in enumerate(['fox','bud','turtle']):
    piece=im.crop((round(i*im.width/3),0,round((i+1)*im.width/3),im.height))
    bounds=piece.getchannel('A').getbbox()
    if bounds:piece=piece.crop(bounds)
    piece.thumbnail((512,512),Image.Resampling.LANCZOS)
    piece.save(root/f'assets/resources/art/{name}.png',optimize=True)
bg=Image.open(root/'art-source/background-original.png').convert('RGB');bg.thumbnail((768,1366),Image.Resampling.LANCZOS);bg.save(root/'assets/resources/art/background.jpg',quality=88,optimize=True)
for p in (root/'assets/resources/art').iterdir():
    if p.suffix not in ['.png','.jpg']:continue
    put(str(p.relative_to(root))+'.meta',{'ver':'1.0.27','importer':'image','imported':False,'uuid':uid(),'files':[],'subMetas':{},'userData':{'type':'sprite-frame','hasAlpha':p.suffix=='.png'}})
script=uid();sceneid=uid()
for filename in ['PMGame','PMModel']:
    put(f'assets/scripts/{filename}.ts.meta',{'ver':'4.0.24','importer':'typescript','imported':True,'uuid':script if filename=='PMGame' else uid(),'files':[],'subMetas':{},'userData':{}})
scene=json.loads((old/'assets/scenes/CharacterValidation.scene').read_text('utf-8-sig'))
scene[0]['_name']=scene[1]['_name']='PMGame';scene[1]['_children']=[];scene[1]['_id']=sceneid
scene[13]={'__type__':compact(script),'_name':'','_objFlags':0,'node':{'__id__':1},'_enabled':True,'__prefab':None,'_id':''}
put('assets/scenes/PMGame.scene',scene)
put('assets/scenes/PMGame.scene.meta',{'ver':'1.1.50','importer':'scene','imported':True,'uuid':sceneid,'files':['.json'],'subMetas':{},'userData':{}})
put('package.json',{'name':'pm-creature-dice','uuid':uid(),'creator':{'version':'3.8.7'},'version':'0.1.0','scripts':{'test':'node checks/model.test.cjs'}})
put('tsconfig.json',{'extends':'./temp/tsconfig.cocos.json','compilerOptions':{'strict':False,'skipLibCheck':True}})
for p in ['project','engine','builder','device']:
    shutil.copy2(old/f'settings/v2/packages/{p}.json',root/f'settings/v2/packages/{p}.json')
put('build-config.json',{'platform':'web-mobile','debug':True,'name':'PM Creature Dice','outputName':'web-mobile','startScene':sceneid,'scenes':[{'url':'db://assets/scenes/PMGame.scene','uuid':sceneid}],'buildPath':'project://build','logDest':str(root/'checks/build.log'),'packages':{'web-mobile':{'orientation':'portrait','embedWebDebugger':False}}})
print('Prepared Cocos 3.8.7 project. Imported three alpha sprites and background.')
