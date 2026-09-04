import json
from pathlib import Path

paths = [
    Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-20260904.json'),
    Path('/home/ubuntu/webdev-static-assets/catalog-with-valvulas-gtin-xlsx_20260904.json'),
]
for path in paths:
    if not path.exists():
        continue
    items = json.loads(path.read_text())
    print('\nSOURCE', path)
    for sku in ['1.33134', '2.90126', '5.94224', '6.91171', '6.91174', '13.00630']:
        found = [x for x in items if str(x.get('sku') or '') == sku]
        for item in found:
            print(sku, json.dumps({k: item.get(k) for k in ('name','description','brand','application','image','url','gtins','internalCode','barcode')}, ensure_ascii=False))
    print('sample images')
    for item in items:
        if 'segmentos' in str(item.get('name') or '').lower() and item.get('image'):
            print(json.dumps({k: item.get(k) for k in ('sku','image','url')}, ensure_ascii=False))
            break
