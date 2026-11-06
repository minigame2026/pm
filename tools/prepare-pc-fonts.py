"""Rebuild the redistributable PC fonts from Google Fonts (SIL OFL).

Run with Python fontTools installed. Runtime/builds use checked-in pc/fonts;
this maintenance command alone downloads sources. No OS fonts are installed.
"""
from pathlib import Path
import concurrent.futures, hashlib, json, urllib.request, subprocess, copy, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'output/pc-font-sources'
DEST = ROOT / 'pc/fonts'
FAMILIES = {
    'notosans': 'DicekinSans', 'notosanssc': 'DicekinSansSC',
    'notosanstc': 'DicekinSansTC', 'notosansjp': 'DicekinSansJP',
    'notosanskr': 'DicekinSansKR', 'notosansthai': 'DicekinSansThai',
    'notosansdevanagari': 'DicekinSansDevanagari', 'notosansbengali': 'DicekinSansBengali',
    'notosanstelugu': 'DicekinSansTelugu', 'notosanstamil': 'DicekinSansTamil',
    'notosansarabic': 'DicekinSansArabic',
}

def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'DicekinFontBuild/1.0'}),timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2: raise

def download(folder):
    target=CACHE/folder;target.mkdir(parents=True,exist_ok=True)
    entries=json.loads(get('https://api.github.com/repos/google/fonts/contents/ofl/'+folder))
    entry=next(e for e in entries if e['name'].endswith('.ttf') and 'Italic' not in e['name'])
    file=target/entry['name']
    if not file.exists():file.write_bytes(get(entry['download_url']))
    license=target/'OFL.txt'
    if not license.exists():license.write_bytes(get(next(e['download_url'] for e in entries if e['name']=='OFL.txt')))
    return folder,file,entry['download_url'],license

def rename(font,family):
    # Derivative static instances use a new family; original copyright/OFL stay intact.
    names={1:family,2:'Regular',3:family+' Regular',4:family+' Regular',6:family+'-Regular',16:family,17:'Regular'}
    for name_id,value in names.items():
        font['name'].removeNames(nameID=name_id)
        font['name'].setName(value,name_id,3,1,0x409)
        font['name'].setName(value,name_id,1,0,0)

def main():
    DEST.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        sources=list(pool.map(download,['notosanssymbols','notosanssymbols2'] if '--supplement-only' in sys.argv else [*FAMILIES,'notosanssymbols','notosanssymbols2']))
    rows=json.loads((DEST/'manifest.json').read_text())['fonts'] if '--supplement-only' in sys.argv else []
    for folder,file,url,license in sources:
        family=FAMILIES.get(folder,'DicekinSymbols2' if folder=='notosanssymbols2' else 'DicekinSymbols');font=TTFont(file)
        if 'fvar' in font:
            axes={axis.axisTag:(400 if axis.axisTag=='wght' else axis.defaultValue) for axis in font['fvar'].axes}
            font=instantiateVariableFont(font,axes,inplace=True)
        rename(font,family)
        output=DEST/(family+'.ttf');font.save(output)
        license_name=folder+'-OFL.txt';(DEST/license_name).write_bytes(license.read_bytes())
        if folder in FAMILIES:rows.append({'family':family,'file':output.name,'license':license_name,'source':url,'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()})
        print(f'{family}: {output.stat().st_size} bytes',flush=True)
    manifest={'license':'SIL Open Font License 1.1','upstream':'https://github.com/google/fonts','modification':'Static weight 400 instances renamed Dicekin. UI punctuation and untranslated source glyphs from Noto Sans SC, Noto Sans, Noto Sans Symbols and Noto Sans Symbols 2 merged where missing.','fonts':rows,'supplementalLicenses':['notosans-OFL.txt','notosanssc-OFL.txt','notosanssymbols-OFL.txt','notosanssymbols2-OFL.txt']}
    manifest_path=DEST/'manifest.json';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    subprocess.run(['node',str(ROOT/'checks/pc-fonts.test.cjs'),'--corpus-only'],cwd=ROOT,check=True)
    corpus=json.loads((ROOT/'checks/pc-fonts/corpus.json').read_text(encoding='utf-8'))
    coverage=json.loads((ROOT/'checks/pc-fonts/coverage.json').read_text(encoding='utf-8'))
    # Keep donor files stable while the primary families are supplemented.
    donors=[]
    for name in ['DicekinSansSC','DicekinSans','DicekinSymbols','DicekinSymbols2']:
        donor_copy=CACHE/(name+'-donor.ttf');donor_copy.write_bytes((DEST/(name+'.ttf')).read_bytes());donors.append(donor_copy)
    for row in rows:
        target=DEST/row['file'];required=set()
        for locale in coverage:
            if locale['family']==row['family']:required.update(corpus[locale['locale']])
        for index,donor_path in enumerate(donors):
            primary=TTFont(target);missing=required-set(primary.getBestCmap());primary.close()
            donor=TTFont(donor_path);extra=missing&set(donor.getBestCmap())
            if not extra:donor.close();continue
            options=subset.Options();options.layout_features=[];options.hinting=False
            sub=subset.Subsetter(options=options);sub.populate(unicodes=extra);sub.subset(donor)
            # Copy only standalone Han/symbol outlines and their components. Do not
            # merge layout/metrics tables: the primary Arabic/Indic shaping survives.
            primary=TTFont(target)
            assert primary['head'].unitsPerEm==donor['head'].unitsPerEm
            order=list(primary.getGlyphOrder())
            names={name:'ui'+str(index)+'_'+name for name in donor.getGlyphOrder()}
            for old,new in names.items():
                glyph=copy.deepcopy(donor['glyf'][old])
                if glyph.isComposite():
                    for component in glyph.components:component.glyphName=names[component.glyphName]
                primary['glyf'][new]=glyph;primary['hmtx'][new]=donor['hmtx'][old]
                if 'vmtx' in primary:primary['vmtx'][new]=(primary['head'].unitsPerEm,0)
            primary.setGlyphOrder(order+list(names.values()))
            mapping={code:names[name] for code,name in donor.getBestCmap().items() if code in extra}
            for table in primary['cmap'].tables:
                if table.isUnicode() and table.format in [4,12]:table.cmap.update({c:n for c,n in mapping.items() if table.format==12 or c<=0xffff})
            primary.save(target);primary.close();donor.close()
        row['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
    (DEST/'DicekinSymbols.ttf').unlink()
    (DEST/'DicekinSymbols2.ttf').unlink()
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__': main()
