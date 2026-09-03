import json
from pathlib import Path
m = json.loads(Path('/tmp/eurotruck-assets/gtin.json').read_text(encoding='utf-8'))
print(type(m).__name__, len(m))
for k in list(m)[:3]:
    print(k, type(m[k]).__name__, m[k])
