import json
from pathlib import Path

source = Path('/home/ubuntu/webdev-static-assets/diesel-catalog-bombillas-merged.json')
output = Path('/tmp/eurotruck-assets/catalog-with-internal-codes.json')
gtin_path = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-bombillas-merged.json')
items = json.loads(source.read_text())
gtin_map = json.loads(gtin_path.read_text())
items = sorted(items, key=lambda item: (str(item.get('id', '')), str(item.get('sku', ''))))
seen = set()
for index, item in enumerate(items, start=1):
    code = str(index).zfill(5)
    if code in seen:
        raise RuntimeError(f'duplicate internal code: {code}')
    seen.add(code)
    sku = str(item.get('sku', ''))
    gtin_entry = gtin_map.get(sku, {})
    gtins = gtin_entry.get('gtins', []) if isinstance(gtin_entry, dict) else gtin_entry
    if isinstance(gtins, str):
        gtins = [gtins]
    item['internalCode'] = code
    item['barcode'] = str(gtins[0]) if gtins else ''
output.write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')))
print(json.dumps({'items': len(items), 'unique_internal_codes': len(seen), 'with_external_barcode': sum(bool(item['barcode']) for item in items), 'output': str(output)}))
