import json
from pathlib import Path
items = json.loads(Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-20260904.json').read_text())
for item in items:
    if item.get('sku') == '1.33134':
        print(json.dumps(item, ensure_ascii=False, indent=2))
        break
