from __future__ import annotations
import json
import re
import zipfile
from pathlib import Path

OUT = Path('/home/ubuntu/eurotruck-standalone')
ZIP_PATH = Path('/home/ubuntu/EUROTRUCK_Sitio_Autonomo.zip')

def clean_value(value):
    if isinstance(value, dict):
        result = {key: clean_value(item) for key, item in value.items()}
        if isinstance(result.get('image'), str) and result['image'].startswith('images/'):
            result['imageFull'] = result['image']
        for key in ('imageFull', 'imageUrl', 'sourceUrl', 'url'):
            if key in result and isinstance(result[key], str) and result[key].startswith(('http://', 'https://')):
                if key == 'imageUrl' and isinstance(result.get('image'), str):
                    result[key] = result['image']
                elif key == 'imageFull' and isinstance(result.get('image'), str):
                    result[key] = result['image']
                else:
                    result[key] = ''
        return result
    if isinstance(value, list):
        return [clean_value(item) for item in value]
    return value

catalog_path = OUT / 'data' / 'catalog.json'
catalog = clean_value(json.loads(catalog_path.read_text(encoding='utf-8')))
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
for path in (OUT / 'index.html', OUT / '404.html'):
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com"[^>]*>', '', text)
    text = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com"[^>]*>', '', text)
    text = re.sub(r'\s*<link href="https://fonts\.googleapis\.com/[^>]+>', '', text)
    path.write_text(text, encoding='utf-8')

hits = []
for path in OUT.rglob('*'):
    if path.is_file() and path.suffix in {'.html', '.js', '.css', '.json', '.txt'}:
        text = path.read_text(encoding='utf-8', errors='ignore')
        for pattern in ('dieseltechnic.tiny.pictures', '/manus-storage/', 'fonts.googleapis.com', 'fonts.gstatic.com'):
            if pattern in text:
                hits.append(f'{path.relative_to(OUT)}:{pattern}')
if hits:
    raise SystemExit('External references remain:\n' + '\n'.join(hits[:20]))
manifest = json.loads((OUT / 'export-manifest.json').read_text(encoding='utf-8'))
manifest.update({'external_resource_hits': 0, 'offline_ready': True})
(OUT / 'export-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
if ZIP_PATH.exists(): ZIP_PATH.unlink()
with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(OUT.rglob('*')):
        if path.is_file(): archive.write(path, path.relative_to(OUT).as_posix())
manifest['zip_bytes'] = ZIP_PATH.stat().st_size
(OUT / 'export-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False, indent=2))
