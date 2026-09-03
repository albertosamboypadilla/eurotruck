from pathlib import Path
import json

catalog = json.loads(Path('/home/ubuntu/webdev-static-assets/diesel-catalog-bombillas-merged.json').read_text(encoding='utf-8'))
out_dir = Path('/home/ubuntu/webdev-static-assets/inventory-bombillas')
out_dir.mkdir(parents=True, exist_ok=True)
keys = ['0','1','2','3','4','5','6','7','8','9','s']
shards = {k: [] for k in keys}
for product in catalog:
    sku = str(product.get('sku') or '')
    key = sku[:1].lower() if sku[:1].lower() in shards else 's'
    shards[key].append(product)
index = [{k: product.get(k) for k in ('id','sku','name','description','brand','application')} for product in catalog]
index_path = out_dir / 'index.json'
index_path.write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
for key, rows in shards.items():
    (out_dir / f'shard-{key}.json').write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(json.dumps({'catalog': len(catalog), 'index': len(index), 'shards': {k: len(v) for k, v in shards.items()}}, ensure_ascii=False))
