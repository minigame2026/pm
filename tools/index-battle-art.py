"""Index transparent sprite bounds for Cocos; source PNG pixels remain unchanged."""
from pathlib import Path
from PIL import Image
import json, uuid, sys

root = Path(__file__).resolve().parents[1]
art = root / 'assets/resources/art'
template = json.loads((art / 'fox.png.meta').read_text(encoding='utf-8'))
rects = {}
for pet in ('fox', 'bud', 'turtle'):
    name = pet + (sys.argv[1] if len(sys.argv)>1 else '-battle')
    source = art / (name + '.png')
    image = Image.open(source)
    assert image.mode == 'RGBA', (name, image.mode)
    width, height = image.size
    alpha = image.getchannel('A')
    assert alpha.getextrema()[0] == 0, 'Transparent background required'
    rects[pet] = {}
    for side, start, end in [('back', 0, width//2), ('front', width//2, width)]:
        bounds = alpha.crop((start, 0, end, height)).point(lambda a: 255 if a >= 12 else 0).getbbox()
        assert bounds, (name, side)
        x0, y0, x1, y1 = bounds
        x0, y0 = max(0, x0-2), max(0, y0-2)
        x1, y1 = min(end-start, x1+2), min(height, y1+2)
        rects[pet][side] = [start+x0, y0, x1-x0, y1-y0]
    meta_path = art / (name + '.png.meta')
    if not meta_path.exists():
        old = template['uuid']; new = str(uuid.uuid4())
        meta = json.loads(json.dumps(template).replace(old, new))
        for sub in meta['subMetas'].values(): sub['displayName'] = name
        frame = meta['subMetas']['f9941']['userData']
        frame.update(width=width,height=height,rawWidth=width,rawHeight=height,trimX=0,trimY=0,offsetX=0,offsetY=0,packable=False)
        frame.pop('vertices',None)
        meta_path.write_text(json.dumps(meta,indent=2),encoding='utf-8')
    print(name, image.size, source.stat().st_size, rects[pet])
(root/'assets/scripts/BattleArt.ts').write_text('// Alpha bounds of generated front/back art. PNGs are preserved as authored.\nexport const BATTLE_RECTS = '+json.dumps(rects,indent=2)+';\n',encoding='utf-8')
arena = art/'battle-arena.png'
arena_meta = art/'battle-arena.png.meta'
if arena.exists() and not arena_meta.exists():
    width,height=Image.open(arena).size
    meta=json.loads(json.dumps(template).replace(template['uuid'],str(uuid.uuid4())))
    for sub in meta['subMetas'].values(): sub['displayName']='battle-arena'
    frame=meta['subMetas']['f9941']['userData']
    frame.update(width=width,height=height,rawWidth=width,rawHeight=height,trimX=0,trimY=0,offsetX=0,offsetY=0,packable=False)
    frame.pop('vertices',None)
    arena_meta.write_text(json.dumps(meta,indent=2),encoding='utf-8')
