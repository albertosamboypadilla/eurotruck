import json
from pathlib import Path
p=Path('/home/ubuntu/webdev-static-assets/diesel-gtin-map-complete.json')
x=json.loads(p.read_text())
print(type(x).__name__, len(x))
for key, value in list(x.items())[:3]:
    print(key, repr(value))
