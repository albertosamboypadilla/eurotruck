from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sys
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import requests

PROJECT = Path('/home/ubuntu/eurotruck-clone')
DIST = PROJECT / 'dist' / 'public'
ASSETS = Path('/home/ubuntu/webdev-static-assets')
OUT = Path('/home/ubuntu/eurotruck-standalone')
ZIP_PATH = Path('/home/ubuntu/EUROTRUCK_Sitio_Autonomo.zip')
CATALOG_SOURCE = ASSETS / 'catalog-with-junta-torica-gtin-20260904.json'
GTIN_SOURCE = ASSETS / 'diesel-gtin-map-junta-torica-20260904.json'


def local_name(url: str) -> str:
    digest = hashlib.sha1(url.encode('utf-8')).hexdigest()[:18]
    return f'product-{digest}.webp'


def download_one(item: tuple[str, Path]) -> tuple[str, bool, str]:
    url, target = item
    if target.exists() and target.stat().st_size > 128:
        return url, True, 'cached'
    tmp = target.with_suffix('.tmp')
    try:
        response = requests.get(url, timeout=25, headers={'User-Agent': 'Eurotruck-Standalone-Exporter/1.0'})
        response.raise_for_status()
        if not response.content:
            raise ValueError('empty response')
        tmp.write_bytes(response.content)
        tmp.replace(target)
        return url, True, 'downloaded'
    except Exception as exc:
        if tmp.exists():
            tmp.unlink()
        return url, False, str(exc)


def copy_static_images(images_dir: Path) -> None:
    images_dir.mkdir(parents=True, exist_ok=True)
    public_origin = 'https://eurotruck.manus.space/manus-storage/'
    names = [
        'eurotruck-metal-texture_f3aa1d2f.jpg',
        'eurotruck-parts-detail_ee686c29.jpg',
        'eurotruck-workshop-service_e1743ce0.jpg',
        'iveco_0d12bea0.jpg',
        'man_42f48747.jpg',
        'mercedes_136007a3.jpg',
        'scania_1210de67.jpg',
        'volvo_c177e924.jpg',
    ]
    for name in names:
        target = images_dir / name
        if target.exists():
            continue
        response = requests.get(public_origin + name, timeout=30)
        response.raise_for_status()
        target.write_bytes(response.content)


def rewrite_catalog(catalog: object, images_dir: Path) -> tuple[object, dict[str, str]]:
    items = catalog if isinstance(catalog, list) else catalog.get('items', []) if isinstance(catalog, dict) else []
    image_map: dict[str, str] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        for key in ('image', 'imageUrl', 'img', 'photo'):
            value = item.get(key)
            if isinstance(value, str) and value.startswith('http'):
                image_map.setdefault(value, f'images/{local_name(value)}')
                item[key] = image_map[value]
                break
    return catalog, image_map


def main() -> int:
    if not DIST.exists():
        raise SystemExit('dist/public no existe; ejecuta pnpm build antes.')
    if not CATALOG_SOURCE.exists() or not GTIN_SOURCE.exists():
        raise SystemExit('No se encontraron el catálogo o el mapa GTIN persistentes.')

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    shutil.copytree(DIST, OUT, dirs_exist_ok=True)
    (OUT / 'data').mkdir()
    (OUT / 'images').mkdir()

    shutil.copy2(CATALOG_SOURCE, OUT / 'data' / 'catalog-source.json')
    shutil.copy2(GTIN_SOURCE, OUT / 'data' / 'gtin-source.json')
    catalog = json.loads(CATALOG_SOURCE.read_text(encoding='utf-8'))
    catalog, image_map = rewrite_catalog(catalog, OUT / 'images')
    (OUT / 'data' / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (OUT / 'data' / 'gtin.json').write_bytes(GTIN_SOURCE.read_bytes())

    copy_static_images(OUT / 'images')
    tasks = [(url, OUT / rel) for url, rel in image_map.items()]
    ok = 0
    failed: list[tuple[str, str]] = []
    with ThreadPoolExecutor(max_workers=48) as pool:
        futures = [pool.submit(download_one, task) for task in tasks]
        for index, future in enumerate(as_completed(futures), start=1):
            url, success, detail = future.result()
            if success:
                ok += 1
            else:
                failed.append((url, detail))
            if index % 500 == 0:
                print(f'images {index}/{len(tasks)} ok={ok} failed={len(failed)}', flush=True)

    placeholder = OUT / 'images' / 'product-placeholder.svg'
    placeholder.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="#101722"/><text x="320" y="215" fill="#9aa9be" text-anchor="middle" font-family="Arial" font-size="22">Imagen no disponible</text></svg>', encoding='utf-8')
    for item in (catalog if isinstance(catalog, list) else catalog.get('items', [])):
        if isinstance(item, dict):
            for key in ('image', 'imageUrl', 'img', 'photo'):
                value = item.get(key)
                if isinstance(value, str) and value.startswith('images/') and not (OUT / value).exists():
                    item[key] = 'images/product-placeholder.svg'
                    break
    (OUT / 'data' / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    for html in OUT.glob('*.html'):
        text = html.read_text(encoding='utf-8')
        text = re.sub(r'(<script[^>]+src=")/+', r'\1', text)
        text = re.sub(r'(<link[^>]+href=")/+', r'\1', text)
        text = text.replace('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap', '')
        html.write_text(text, encoding='utf-8')

    for asset in OUT.rglob('*'):
        if asset.is_file() and asset.suffix in {'.js', '.css', '.html'}:
            text = asset.read_text(encoding='utf-8', errors='ignore')
            text = text.replace('/manus-storage/catalog-with-junta-torica-gtin-20260904_40163118.json', 'data/catalog.json')
            text = text.replace('/manus-storage/diesel-gtin-map-junta-torica-20260904_b67682ec.json', 'data/gtin.json')
            for name in ['eurotruck-metal-texture_f3aa1d2f.jpg', 'eurotruck-parts-detail_ee686c29.jpg', 'eurotruck-workshop-service_e1743ce0.jpg', 'iveco_0d12bea0.jpg', 'man_42f48747.jpg', 'mercedes_136007a3.jpg', 'scania_1210de67.jpg', 'volvo_c177e924.jpg']:
                text = text.replace(f'/manus-storage/{name}', f'images/{name}')
            asset.write_text(text, encoding='utf-8')

    shutil.copy2(OUT / 'index.html', OUT / '404.html')
    (OUT / 'vercel.json').write_text(json.dumps({'rewrites': [{'source': '/(.*)', 'destination': '/index.html'}]}, indent=2), encoding='utf-8')
    (OUT / 'README.txt').write_text('EUROTRUCK — SITIO ESTÁTICO AUTÓNOMO\n\nAbre index.html con un servidor estático o sube todo este contenido a Vercel/GitHub Pages.\nLos datos del catálogo están en data/catalog.json y las imágenes locales en images/.\nLa exportación no depende del servidor Manus ni de URLs de almacenamiento externas.\n', encoding='utf-8')

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in OUT.rglob('*'):
            if path.is_file():
                archive.write(path, path.relative_to(OUT).as_posix())
    manifest = {
        'catalog_items': len(catalog if isinstance(catalog, list) else catalog.get('items', [])),
        'unique_image_urls': len(image_map),
        'images_downloaded': ok,
        'images_failed': len(failed),
        'zip_bytes': ZIP_PATH.stat().st_size,
        'zip_path': str(ZIP_PATH),
    }
    (OUT / 'export-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))
    if failed:
        Path('/home/ubuntu/eurotruck-image-download-failures.txt').write_text('\n'.join(f'{url}\t{reason}' for url, reason in failed), encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
