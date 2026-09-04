import json
from collections import defaultdict, Counter
from pathlib import Path

catalog_path = Path('/home/ubuntu/webdev-static-assets/catalog-with-valvulas-gtin-xlsx_20260904.json')
gtin_path = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-valvulas-xlsx_20260904.json')
items = json.loads(catalog_path.read_text())
gtin_map = json.loads(gtin_path.read_text())

def norm(value):
    return ''.join(str(value or '').split()).lower()

def gtins(item):
    values = list(item.get('gtins') or [])
    entry = gtin_map.get(norm(item.get('sku')))
    if entry:
        values.extend(entry.get('gtins') or [])
    return sorted({str(value).strip() for value in values if str(value).strip()})

groups = defaultdict(list)
for index, item in enumerate(items):
    groups[norm(item.get('sku'))].append((index, item))
dups = {sku: rows for sku, rows in groups.items() if sku and len(rows) > 1}
summary = {
    'catalog_count': len(items),
    'unique_sku_count': len([sku for sku in groups if sku]),
    'duplicate_sku_groups': len(dups),
    'duplicate_rows': sum(len(rows) - 1 for rows in dups.values()),
    'top_groups': [],
}
for sku, rows in sorted(dups.items(), key=lambda pair: (-len(pair[1]), pair[0]))[:50]:
    records = []
    for index, item in rows:
        records.append({
            'index': index,
            'id': item.get('id'),
            'sku': item.get('sku'),
            'name': item.get('name'),
            'brand': item.get('brand'),
            'application': item.get('application'),
            'gtins': gtins(item),
            'gtin_count': len(gtins(item)),
            'internalCode': item.get('internalCode'),
            'barcode': item.get('barcode'),
        })
    summary['top_groups'].append({'sku_key': sku, 'records': records})
Path('/tmp/duplicate-sku-audit.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
print(json.dumps({k: v for k, v in summary.items() if k != 'top_groups'}, ensure_ascii=False))
for group in summary['top_groups'][:10]:
    print(group['sku_key'], [(record['id'], record['name'], record['gtin_count']) for record in group['records']])
