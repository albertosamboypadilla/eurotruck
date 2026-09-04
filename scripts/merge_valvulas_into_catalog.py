from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote

CATALOG = Path('/tmp/eurotruck-catalog.json')
RESULTS = Path('/home/ubuntu/console_outputs/exec_result_2026-09-04_15-17-42_647.txt')
GTIN_MAP = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-complete.json')
OUTPUT = Path('/home/ubuntu/webdev-static-assets/catalog-with-valvulas_ba8546a7.json')

catalog = json.loads(CATALOG.read_text())
results = json.loads(RESULTS.read_text())
search_products = results['products']
existing = {str(item.get('sku', '')).strip() for item in catalog}
existing_codes = [int(str(item.get('internalCode'))) for item in catalog if str(item.get('internalCode', '')).isdigit()]
next_code = max(existing_codes or [0]) + 1

def slugify(value: str) -> str:
    text = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii').lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

added = []
for product in search_products:
    sku = str(product.get('sku') or '').strip()
    if not sku or sku in existing:
        continue
    name = str(product.get('name') or '').strip() or f'Válvula DT Spare Parts {sku}'
    image_src = str(product.get('image') or '').strip()
    image_path = image_src or f"0355/{sku.replace('.', '_')}_0.jpg"
    slug = f"dt-{sku.replace('.', '-')}-{slugify(name)}"
    entry = {
        'id': f'valvulas-{sku}',
        'sku': sku,
        'name': name,
        'description': f'DT Spare Parts {sku} {name}',
        'slug': slug,
        'url': f'https://partnerportal.dieseltechnic.com/es/products/{slug}',
        'image': f'https://dieseltechnic.tiny.pictures/{image_path}?format=webp&width=640',
        'imageFull': f'https://dieseltechnic.tiny.pictures/{image_path}?format=webp&width=1920',
        'imageSource': image_path,
        'application': '',
        'applicationId': '',
        'brand': 'DT Spare Parts',
        'brandId': 'DT',
        'manufacturer': '',
        'category': 'Motor',
        'subcategory': 'Válvulas',
        'usage': [],
        'replaces': '',
        'mainOe': '',
        'packagingAmount': 1,
        'salesUnit': 'PCS',
        'badges': [],
        'isProductNews': False,
        'isProductPromotion': False,
        'crossReferences': [],
        'internalCode': f'{next_code:05d}',
        'barcode': None,
    }
    catalog.append(entry)
    existing.add(sku)
    added.append(entry)
    next_code += 1

OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')))
print(json.dumps({'source_raw': results['raw'], 'source_unique': results['unique'], 'catalog_before': len(catalog)-len(added), 'added': len(added), 'catalog_after': len(catalog), 'output': str(OUTPUT)}, ensure_ascii=False))
print('ADDED_FIRST_LAST', added[0]['sku'] if added else None, added[-1]['sku'] if added else None)
