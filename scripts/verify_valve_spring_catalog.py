from __future__ import annotations

import json
from pathlib import Path

skus = [
    "1.10004", "1.10005", "1.10780", "1.25780", "2.10275", "2.10276", "2.10296",
    "3.13039", "4.50055", "4.50139", "4.50393", "4.50413", "4.70029", "4.70056", "4.70117",
]
base = Path('/tmp/eurotruck-catalog.json')
if not base.exists():
    raise SystemExit('Missing /tmp/eurotruck-catalog.json; download the published catalog first.')
items = json.loads(base.read_text())
map_file = Path('/tmp/valve-gtin-map.json')
if not map_file.exists():
    raise SystemExit('Missing /tmp/valve-gtin-map.json; download the preview map first.')
gtin_map = json.loads(map_file.read_text())
by_sku = {str(item.get('sku')): item for item in items}
for sku in skus:
    item = by_sku.get(sku)
    entry = gtin_map.get(sku) if isinstance(gtin_map, dict) else None
    values = entry.get('gtins', []) if isinstance(entry, dict) else []
    print(json.dumps({
        'sku': sku,
        'present': bool(item),
        'name': item.get('name') if item else None,
        'image': item.get('image') if item else None,
        'url': item.get('url') if item else None,
        'gtins': values if isinstance(values, list) else [],
    }, ensure_ascii=False))
