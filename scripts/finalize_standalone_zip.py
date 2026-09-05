from __future__ import annotations
import json
import re
import zipfile
from pathlib import Path

OUT = Path('/home/ubuntu/eurotruck-standalone')
ZIP_PATH = Path('/home/ubuntu/EUROTRUCK_Sitio_Autonomo.zip')
for name in ('catalog-source.json', 'gtin-source.json'):
    path = OUT / 'data' / name
    if path.exists():
        path.unlink()

external_hits = []
for path in OUT.rglob('*'):
    if not path.is_file() or path.suffix not in {'.html', '.js', '.css', '.json', '.txt'}:
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    for pattern in ('dieseltechnic.tiny.pictures', '/manus-storage/', 'fonts.googleapis.com', 'fonts.gstatic.com'):
        if pattern in text:
            external_hits.append(f'{path.relative_to(OUT)}: {pattern}')
if external_hits:
    raise SystemExit('External resource references remain:\n' + '\n'.join(external_hits[:20]))

manifest = {
    'catalog_items': len(json.loads((OUT / 'data' / 'catalog.json').read_text(encoding='utf-8'))),
    'image_files': len(list((OUT / 'images').glob('*'))),
    'external_resource_hits': 0,
    'offline_ready': True,
}
(OUT / 'export-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
if ZIP_PATH.exists():
    ZIP_PATH.unlink()
with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(OUT.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(OUT).as_posix())
manifest['zip_bytes'] = ZIP_PATH.stat().st_size
print(json.dumps(manifest, ensure_ascii=False, indent=2))
