import json
from collections import Counter
from pathlib import Path

catalog_path = Path('/home/ubuntu/webdev-static-assets/catalog-deduped-by-sku-20260904.json')
source_path = Path('/home/ubuntu/webdev-static-assets/catalog-with-valvulas-gtin-xlsx_20260904.json')
gtin_path = Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-valvulas-xlsx_20260904.json')

def norm(value):
    return ''.join(str(value or '').split()).lower()

def gtins(item, gtin_map):
    values = list(item.get('gtins') or [])
    values.extend((gtin_map.get(norm(item.get('sku'))) or {}).get('gtins') or [])
    return {str(value).strip() for value in values if str(value).strip()}

catalog = json.loads(catalog_path.read_text())
source = json.loads(source_path.read_text())
gtin_map = json.loads(gtin_path.read_text())
catalog_by_sku = {norm(item.get('sku')): item for item in catalog if norm(item.get('sku'))}
counts = Counter(catalog_by_sku.keys())
source_groups = {}
for item in source:
    source_groups.setdefault(norm(item.get('sku')), []).append(item)
violations = []
for key, rows in source_groups.items():
    if not key: continue
    kept = catalog_by_sku.get(key)
    if kept is None:
        violations.append({'sku': key, 'reason': 'missing'})
        continue
    max_count = max(len(gtins(item, gtin_map)) for item in rows)
    kept_count = len(gtins(kept, gtin_map))
    union = set().union(*(gtins(item, gtin_map) for item in rows))
    if kept_count != len(union) or kept_count < max_count:
        violations.append({'sku': key, 'reason': 'gtin_mismatch', 'kept': kept_count, 'union': len(union), 'max': max_count})
print(json.dumps({'deduped_count': len(catalog), 'duplicate_skus': sum(1 for value in counts.values() if value > 1), 'max_gtin_violations': len(violations), 'violations_sample': violations[:10]}, ensure_ascii=False))
if any(value > 1 for value in counts.values()) or violations:
    raise SystemExit(1)
