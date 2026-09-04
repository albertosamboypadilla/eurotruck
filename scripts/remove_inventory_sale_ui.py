from pathlib import Path

path = Path('/home/ubuntu/eurotruck-clone/client/src/pages/Inventory.tsx')
text = path.read_text()
lines = text.splitlines(keepends=True)
removed = 0
kept = []
for line in lines:
    if 'saleConfirmSku && <div className="inventory-sale-dialog"' in line:
        removed += 1
        continue
    kept.append(line)
if removed != 1:
    raise SystemExit(f'Expected one Inventory sale dialog line, found {removed}')
path.write_text(''.join(kept))
