import json
from pathlib import Path

catalog = json.loads(Path('/home/ubuntu/webdev-static-assets/catalog-with-valvulas-gtin-xlsx_20260904.json').read_text())
rows = [x for x in catalog if str(x.get('id','')).startswith('valvulas-')]
print('valvulas_prefixed', len(rows))
for row in rows[:10]:
    print({'id': row.get('id'), 'sku': row.get('sku'), 'gtins': row.get('gtins'), 'internalCode': row.get('internalCode'), 'barcode': row.get('barcode')})
print('gtin_coverage', sum(bool(x.get('gtins')) for x in rows), 'of', len(rows))
print('ids_with_multiple_gtins', sum(len(x.get('gtins') or []) > 1 for x in rows))
