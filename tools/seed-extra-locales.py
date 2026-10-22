"""Build-only translation seed. Never called by the game; reviewed JSON is checked in."""
import concurrent.futures
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'tools/locales/expanded'
LOCALES = ['hi', 'ar', 'ru', 'ur', 'bn', 'tr', 'fil', 'mr', 'te', 'ta']
rows = []
for path in sorted((ROOT / 'tools/locales').glob('*.tsv')):
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line:
            continue
        fields = [s.replace(r'\n', '\n') for s in line.split('\t')]
        rows.append((fields[0], fields[1], path.stem == 'pets'))


def translate(text, locale):
    query = urllib.parse.urlencode({'client': 'gtx', 'sl': 'en', 'tl': 'tl' if locale == 'fil' else locale, 'dt': 't', 'q': text})
    request = urllib.request.Request('https://translate.googleapis.com/translate_a/single?' + query)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                data = json.load(response)
            return ''.join(part[0] for part in data[0] if part[0])
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** (attempt + 1))


def seed(locale):
    path = OUT / (locale + '.json')
    result = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    for zh, en, proper in rows:
        if proper or not en.strip():
            result.setdefault(zh, en)
    pending = [(zh, en) for zh, en, _ in rows if zh not in result]
    groups, group, count = [], [], 0
    for item in pending:
        if count + len(item[1]) > 1700 and group:
            groups.append(group)
            group, count = [], 0
        group.append(item)
        count += len(item[1]) + 12
    if group:
        groups.append(group)
    for batch_no, batch in enumerate(groups):
        source = '\n'.join(f'[{i:04d}] {en.replace(chr(10), " / ")}' for i, (_, en) in enumerate(batch))
        response = translate(source, locale)
        markers = list(re.finditer(r'\[\s*(\d{1,4})\s*\]', response))
        parsed = {}
        for i, marker in enumerate(markers):
            end = markers[i + 1].start() if i + 1 < len(markers) else len(response)
            parsed[int(marker.group(1))] = response[marker.end():end].strip()
        for i, (zh, en) in enumerate(batch):
            translated = parsed.get(i)
            # Some providers omit an item marker and join it to the previous item.
            # Never persist those combined answers as a single UI label.
            if not translated or '\n' in translated:
                translated = translate(en.strip(), locale).strip()
            # Dynamic fragments deliberately carry whitespace at their boundaries.
            translated = (' ' if en.startswith(' ') else '') + translated + (' ' if en.endswith(' ') else '')
            result[zh] = translated
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{locale}: {len(result)}/{len(rows)} entries', flush=True)
        time.sleep(.6)
    return locale


def repair(locale):
    path = OUT / (locale + '.json')
    result = json.loads(path.read_text(encoding='utf-8'))
    changed = 0
    for zh, en, proper in rows:
        if not proper and '\n' in result[zh]:
            text = translate(en.strip(), locale).strip()
            result[zh] = ('\n' if en.startswith('\n') else ' ' if en.startswith(' ') else '') + text + (' ' if en.endswith(' ') else '')
            changed += 1
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{locale}: repaired {changed} marker joins', flush=True)
    return locale


if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for locale in pool.map(repair if '--repair' in sys.argv else seed, LOCALES):
            print('Seed complete: ' + locale, flush=True)
