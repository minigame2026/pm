"""Produce smaller PNG runtime textures without changing source art or UUIDs."""
from pathlib import Path
from PIL import Image
import argparse, json, shutil, hashlib

root = Path(__file__).resolve().parents[1]
assets = root / 'assets/resources/art'
masters = root / 'art-source/runtime-masters-v1'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--files', nargs='+', metavar='FILE.png', help='Process only these exact art filenames; retain other manifest and source-size entries.')
args = parser.parse_args()
targets = sorted(assets.glob('*.png'))
if args.files:
    selected = set(args.files)
    assert all(Path(name).name == name and name.endswith('.png') for name in selected), '--files accepts PNG filenames only'
    missing = selected - {target.name for target in targets}
    assert not missing, 'Art files not found: ' + ', '.join(sorted(missing))
    targets = [target for target in targets if target.name in selected]
masters.mkdir(parents=True, exist_ok=True)
icons = {'attack-die-a','heal-potion','power-potion','guard-shield','loot-chest','refresh-enemy','battle-start'}
sizes, records = {}, []
manifest_path = masters / 'manifest.json'
sizes_path = root / 'assets/scripts/ArtSourceSizes.ts'
if args.files:
    if manifest_path.exists(): records = json.loads(manifest_path.read_text(encoding='utf-8'))
    if sizes_path.exists():
        source = sizes_path.read_text(encoding='utf-8')
        sizes = json.loads(source[source.index('>=')+2:].strip().rstrip(';'))
records_by_file = {record['file']: record for record in records}
processed = []
for target in targets:
    source = masters / target.name
    if not source.exists():
        shutil.copy2(target, source)
    with Image.open(source) as im:
        width, height = im.size
        sizes[target.stem] = [width, height]
        key = target.stem
        limit = 192 if key in icons else 512 if key in {'fox','bud','turtle'} else 768 if key.startswith('login-') and key != 'login-cover-v2' else 1152 if any(x in key for x in ['home-', 'camp','arena','nest','-battle-v1']) and not key.endswith('-battle-v1') else 1024
        if key.startswith('region-') or key.startswith('trainer-') or key == 'login-cover-v2': limit = 1152
        scale = min(1, limit/max(width,height))
        size = (max(1,round(width*scale)), max(1,round(height*scale)))
        out = im.convert('RGBA') if 'A' in im.getbands() else im.convert('RGB')
        if size != im.size: out = out.resize(size,Image.Resampling.LANCZOS)
        out.save(target, format='PNG', optimize=True, compress_level=9)
        record = {'file':target.name,'sourceSize':[width,height],'runtimeSize':list(size),'sourceBytes':source.stat().st_size,'runtimeBytes':target.stat().st_size,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()}
        records_by_file[target.name] = record
        processed.append(record)
records = list(records_by_file.values())
manifest_path.write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
sizes_path.write_text('// Original pixel coordinates; runtime textures are scaled independently.\nexport const ART_SOURCE_SIZES:Record<string,[number,number]>='+json.dumps(sizes,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({'textures':len(processed),'beforeBytes':sum(r['sourceBytes'] for r in processed),'afterBytes':sum(r['runtimeBytes'] for r in processed),'manifestTextures':len(records)}))
