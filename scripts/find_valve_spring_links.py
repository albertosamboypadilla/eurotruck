from __future__ import annotations

import re
from urllib.parse import quote
import requests
from bs4 import BeautifulSoup

queries = [
    'site:partnerportal.dieseltechnic.com/es/products "Muelle de válvula"',
    'site:partnerportal.dieseltechnic.com/es/products "Platillo del muelle de válvula"',
]
pattern = re.compile(r'https?://partnerportal\.dieseltechnic\.com/es/products/[^&"<> ]+')
seen: dict[str, str] = {}
for query in queries:
    url = 'https://www.google.com/search?q=' + quote(query)
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
    soup = BeautifulSoup(response.text, 'html.parser')
    text = soup.get_text(' ', strip=True)
    for match in pattern.findall(response.text):
        clean = match.replace('\\u003f', '?').replace('\\u003d', '=').rstrip('\\')
        seen.setdefault(clean, text[:120])

for url in sorted(seen):
    print(url)
print(f'COUNT={len(seen)}')
