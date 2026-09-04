import json
from collections import defaultdict
from pathlib import Path

source_path = Path('/home/ubuntu/webdev-static-assets/catalog-with-valvulas-gtin-xlsx_20260904.json')
gtin_path = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-valvulas-xlsx_20260904.json')
output_path = Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-20260904.json')
report_path = Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-report-20260904.json')
items = json.loads(source_path.read_text())
gtin_map = json.loads(gtin_path.read_text())

def norm(value):
    return ''.join(str(value or '').split()).lower()

def unique(values):
    return sorted({str(value).strip() for value in values if str(value).strip()})

def all_gtins(item):
    values = list(item.get('gtins') or [])
    entry = gtin_map.get(norm(item.get('sku')))
    if entry:
        values.extend(entry.get('gtins') or [])
    return unique(values)

def completeness(item):
    fields = ('description', 'image', 'imageFull', 'application', 'brand', 'category', 'subcategory', 'url', 'imageSource')
    return sum(bool(item.get(field)) for field in fields) + len(item.get('usage') or []) + len(item.get('crossReferences') or [])

groups = defaultdict(list)
for index, item in enumerate(items):
    groups[norm(item.get('sku'))].append((index, item))

result = []
duplicate_groups = []
for sku_key, rows in groups.items():
    if not sku_key:
        result.extend(item for _, item in rows)
        continue
    ranked = sorted(rows, key=lambda pair: (-len(all_gtins(pair[1])), -completeness(pair[1]), pair[0]))
    winner_index, winner = ranked[0]
    merged = dict(winner)
    merged_gtins = unique(value for _, item in rows for value in all_gtins(item))
    if merged_gtins:
        merged['gtins'] = merged_gtins
    if len(rows) > 1:
        duplicate_groups.append({
            'sku': winner.get('sku'),
            'kept_id': winner.get('id'),
            'kept_index': winner_index,
            'kept_gtin_count': len(merged_gtins),
            'removed_ids': [item.get('id') for _, item in ranked[1:]],
            'removed_count': len(ranked) - 1,
        })
    result.append(merged)

output_path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
report = {
    'source_count': len(items),
    'deduped_count': len(result),
    'removed_count': len(items) - len(result),
    'duplicate_sku_groups': len(duplicate_groups),
    'duplicate_groups': duplicate_groups,
}
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({key: report[key] for key in ('source_count', 'deduped_count', 'removed_count', 'duplicate_sku_groups')}, ensure_ascii=False))
print('output', output_path)
print('report', report_path)
