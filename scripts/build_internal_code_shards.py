import json
from pathlib import Path

source = Path('/tmp/eurotruck-assets/catalog-with-internal-codes.json')
out_dir = Path('/tmp/eurotruck-assets/internal-shards')
out_dir.mkdir(parents=True, exist_ok=True)
items = json.loads(source.read_text())
keys = ['0','1','2','3','4','5','6','7','8','9','s']
for key in keys:
    shard = [item for item in items if (str(item.get('sku','')).strip()[:1].lower() == key)]
    (out_dir / f'shard-{key}.json').write_text(json.dumps(shard, ensure_ascii=False, separators=(',', ':')))
print({key: sum(1 for item in items if str(item.get('sku','')).strip()[:1].lower() == key) for key in keys})
