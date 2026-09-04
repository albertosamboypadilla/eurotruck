import json
from pathlib import Path

catalog_path = Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-20260904.json')
map_path = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-valvulas-xlsx_20260904.json')
out_catalog = Path('/home/ubuntu/webdev-static-assets/catalog-with-piston-rings-20260904.json')
out_map = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-piston-rings-20260904.json')

items = json.loads(catalog_path.read_text())
gtin_map = json.loads(map_path.read_text())
by_sku = {str(item.get('sku') or ''): item for item in items}

def next_internal_code():
    values = []
    for item in items:
        raw = str(item.get('internalCode') or '')
        if raw.isdigit():
            values.append(int(raw))
    return max(values or [0]) + 1

missing = [
    {'sku': '5.94224', 'application': 'DAF', 'gtins': ['4070174094231', '4057795786639']},
    {'sku': '6.91171', 'application': 'Renault', 'gtins': ['4047755617752', '4047755365707']},
    {'sku': '6.91174', 'application': '', 'gtins': []},
    {'sku': '13.00630', 'application': 'Ford', 'gtins': ['4070174135699']},
]
added = []
for spec in missing:
    if spec['sku'] in by_sku:
        continue
    code = f"{next_internal_code():05d}"
    sku = spec['sku']
    slug = f"dt-{sku.replace('.', '-')}-juego-de-segmentos-de-piston"
    image_source = f"0355/{sku.replace('.', '_')}_0.jpg"
    item = {
        'id': f'piston-{sku}',
        'sku': sku,
        'name': 'Juego de segmentos de pistón',
        'description': f'DT Spare Parts {sku} Juego de segmentos de pistón',
        'slug': slug,
        'url': f'https://partnerportal.dieseltechnic.com/es/products/{slug}',
        'image': f'https://dieseltechnic.tiny.pictures/{image_source}?format=webp&width=640',
        'imageFull': f'https://dieseltechnic.tiny.pictures/{image_source}?format=webp&width=1920',
        'imageSource': image_source,
        'application': spec['application'],
        'applicationId': '',
        'brand': 'DT Spare Parts',
        'brandId': 'DT',
        'manufacturer': spec['application'],
        'category': 'Motor',
        'subcategory': 'Juego de segmentos de pistón',
        'usage': [spec['application']] if spec['application'] else [],
        'replaces': '',
        'mainOe': '',
        'packagingAmount': 1,
        'salesUnit': 'PCS',
        'badges': [],
        'isProductNews': False,
        'isProductPromotion': False,
        'crossReferences': [],
        'internalCode': code,
        'barcode': spec['gtins'][0] if spec['gtins'] else '',
        'gtins': spec['gtins'],
    }
    items.append(item)
    by_sku[sku] = item
    added.append(item)
    if spec['gtins']:
        gtin_map[sku] = {'sku': sku, 'gtins': spec['gtins']}

out_catalog.write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')))
out_map.write_text(json.dumps(gtin_map, ensure_ascii=False, separators=(',', ':')))
print(json.dumps({'added': len(added), 'skus': [item['sku'] for item in added], 'catalog_count': len(items), 'map_count': len(gtin_map), 'catalog_path': str(out_catalog), 'map_path': str(out_map)}, ensure_ascii=False))
