from bs4 import BeautifulSoup
from pathlib import Path
import json

html_path = Path('/home/ubuntu/browser_html/partnerportal_dieseltechnic_com_results_1788353606955.html')
out_path = Path('/home/ubuntu/eurotruck-clone/validation/bombillas-portal-audit.json')
html = html_path.read_text(encoding='utf-8', errors='ignore')
soup = BeautifulSoup(html, 'html.parser')

items = []
for heading in soup.select('h2'):
    link = heading.find('a', href=True)
    if not link:
        continue
    href = link.get('href', '')
    if '/products/' not in href:
        continue
    card = heading
    for parent in heading.parents:
        if parent.find('img') and parent.find(href=href):
            card = parent
            break
    image = card.find('img')
    text = ' '.join(card.get_text(' ', strip=True).split())
    sku = ''
    if image:
        src = image.get('src', '')
    else:
        src = ''
    import re
    match = re.search(r'/(\d+_\d+)_0\.jpg', src)
    image_key = match.group(1) if match else ''
    ref_match = re.search(r'\b(\d+[.]\d+)\b', text)
    if ref_match:
        sku = ref_match.group(1)
    items.append({
        'name': link.get_text(' ', strip=True),
        'href': href,
        'image': src,
        'imageKey': image_key,
        'skuFromCard': sku,
        'cardText': text,
    })

links = []
for a in soup.find_all('a', href=True):
    href = a['href']
    if '/search/results?' in href and ('start=' in href or 'length=' in href):
        links.append(href)

result = {
    'title': soup.title.get_text(strip=True) if soup.title else '',
    'resultText': ' '.join(soup.get_text(' ', strip=True).split()),
    'items': items,
    'resultLinks': sorted(set(links)),
}
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'items': len(items), 'resultLinks': len(result['resultLinks']), 'output': str(out_path)}, ensure_ascii=False))
