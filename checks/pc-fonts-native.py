"""Verify the packaged Windows fonts through the same GDI path used by Cocos.

No font is installed and no window is opened. GetGlyphIndicesW checks the
selected font itself rather than relying on Windows font linking/fallback.
"""
from pathlib import Path
import ctypes as c, ctypes.wintypes as w, json, sys

ROOT=Path(__file__).resolve().parents[1]
directory=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'pc/fonts'
manifest=json.loads((directory/'manifest.json').read_text(encoding='utf-8'))
coverage=json.loads((ROOT/'checks/pc-fonts/coverage.json').read_text(encoding='utf-8'))
corpus=json.loads((ROOT/'checks/pc-fonts/corpus.json').read_text(encoding='utf-8'))
gdi=c.WinDLL('gdi32',use_last_error=True)
class LOGFONT(c.Structure):
    _fields_=[('height',w.LONG),('width',w.LONG),('escapement',w.LONG),('orientation',w.LONG),('weight',w.LONG),('italic',w.BYTE),('underline',w.BYTE),('strikeout',w.BYTE),('charset',w.BYTE),('outprecision',w.BYTE),('clipprecision',w.BYTE),('quality',w.BYTE),('pitch',w.BYTE),('face',c.c_char*32)]
def bind(name,args,result):
    f=getattr(gdi,name);f.argtypes=args;f.restype=result;return f
create_dc=bind('CreateCompatibleDC',[w.HDC],w.HDC)
delete_dc=bind('DeleteDC',[w.HDC],w.BOOL)
create_font=bind('CreateFontIndirectA',[c.POINTER(LOGFONT)],w.HFONT)
select=bind('SelectObject',[w.HDC,w.HGDIOBJ],w.HGDIOBJ)
delete=bind('DeleteObject',[w.HGDIOBJ],w.BOOL)
face=bind('GetTextFaceW',[w.HDC,c.c_int,w.LPWSTR],c.c_int)
glyphs=bind('GetGlyphIndicesW',[w.HDC,w.LPCWSTR,c.c_int,c.POINTER(w.WORD),w.DWORD],w.DWORD)
add=bind('AddFontResourceExW',[w.LPCWSTR,w.DWORD,w.LPVOID],c.c_int)
remove=bind('RemoveFontResourceExW',[w.LPCWSTR,w.DWORD,w.LPVOID],w.BOOL)
dc=create_dc(None);assert dc
def check(family,points,weight):
    log=LOGFONT();log.height=-28;log.weight=weight;log.charset=1;log.quality=4;log.face=family.encode('ascii')
    font=create_font(c.byref(log));assert font
    previous=select(dc,font);name=c.create_unicode_buffer(128);face(dc,128,name)
    text=''.join(chr(p) for p in sorted(points));indices=(w.WORD*len(text))()
    assert glyphs(dc,text,len(text),indices,1)!=0xffffffff
    missing=[ord(char) for char,index in zip(text,indices) if index==65535]
    select(dc,previous);delete(font)
    return name.value,missing
registered=[];report=[]
try:
    for font in manifest['fonts']:
        actual,_=check(font['family'],[65],400)
        assert actual!=font['family'], 'Family unexpectedly already installed: '+actual
    for font in manifest['fonts']:
        path=str((directory/font['file']).resolve());assert add(path,0x10,None)>0, path
        registered.append(path)
    for locale in coverage:
        for weight in [400,700]:
            actual,missing=check(locale['family'],corpus[locale['locale']],weight)
            report.append({'locale':locale['locale'],'weight':weight,'requested':locale['family'],'selected':actual,'missing':missing})
            assert actual==locale['family'], report[-1]
            assert not missing,report[-1]
finally:
    delete_dc(dc)
    for path in registered:remove(path,0x10,None)
result={'directory':str(directory.resolve()),'registration':'FR_PRIVATE; families unavailable before registration','checks':report}
(ROOT/'checks/pc-fonts/native-gdi.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print('PASS GDI selected the bundled families for 22 languages in regular/bold; zero missing glyphs and no OS font fallback.')
