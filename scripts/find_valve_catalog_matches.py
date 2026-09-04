from __future__ import annotations

import json
from pathlib import Path

catalog_path = Path('/tmp/eurotruck-catalog.json')
if not catalog_path.exists():
    raise SystemExit('Missing /tmp/eurotruck-catalog.json')
items = json.loads(catalog_path.read_text())
needle = 'válvula'
matches = []
for item in items:
    haystack = ' '.join(str(item.get(key) or '') for key in ('sku', 'name', 'description', 'brand', 'application')).lower()
    if needle in haystack or 'valvula' in haystack:
        matches.append(item)
print(f'COUNT={len(matches)}')
for item in matches:
    print(json.dumps({
        'sku': item.get('sku'),
        'name': item.get('name'),
        'brand': item.get('brand'),
        'application': item.get('application'),
        'image': item.get('image'),
        'url': item.get('url'),
    }, ensure_ascii=False))
