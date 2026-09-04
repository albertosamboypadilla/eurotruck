import json
from pathlib import Path

catalog_path = Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-20260904.json')
gtin_path = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-complete.json')
items = json.loads(catalog_path.read_text())
gtin_map = json.loads(gtin_path.read_text())
keywords = ('segmentos de pistón', 'segmentos de piston', 'juego de segmentos')
indexed_skus = ['2.90126', '1.33134', '4.90617', '4.92041', '3.90031', '2.90125', '7.94509', '5.94224', '4.92038', '6.91171', '2.94579', '6.91174', '1.31881', '13.00630']
matched = []
for item in items:
    text = ' '.join(str(item.get(key) or '') for key in ('name', 'description', 'application')).lower()
    if any(keyword in text for keyword in keywords):
        sku = str(item.get('sku') or item.get('internalCode') or '')
        matched.append({
            'sku': sku,
            'name': item.get('name'),
            'url': item.get('url'),
            'gtins': item.get('gtins') or gtin_map.get(sku) or [],
            'internal_code': item.get('internalCode'),
            'image': item.get('image'),
        })
by_sku = {item['sku']: item for item in matched}
print(json.dumps({'count': len(matched), 'items': matched, 'indexed_checks': [{'sku': sku, 'present': sku in by_sku, 'item': by_sku.get(sku)} for sku in indexed_skus]}, ensure_ascii=False, indent=2))
