from pathlib import Path

path = Path('/home/ubuntu/eurotruck-clone/client/src/pages/Inventory.tsx')
text = path.read_text()
replacements = [
(
'''return <article className={`inventory-row is-counted${item.totalQuantity <= lowStockThreshold ? " is-low-stock" : ""}`} key={item.id}><div className="inventory-row-copy">''',
'''const countedProduct = allProducts.find(product => product.id === item.productId); return <article className={`inventory-row is-counted${item.totalQuantity <= lowStockThreshold ? " is-low-stock" : ""}`} key={item.id} role="button" tabIndex={0} onClick={() => countedProduct && selectProduct(countedProduct)} onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && countedProduct) { event.preventDefault(); selectProduct(countedProduct); } }}><div className="inventory-row-copy">'''
),
(
'''<small>{item.lastTramo || "—"} · {item.lastGondola || "—"} · {item.scanCount || 0} lecturas</small></div><div className="inventory-row-actions">''',
'''<small>{item.lastTramo || "—"} · {item.lastGondola || "—"} · {item.scanCount || 0} lecturas</small><button type="button" className="inventory-row-sale-button" onClick={event => { event.stopPropagation(); setSaleCode(item.sku); setSaleQuantity("1"); setSaleConfirmSku(item.sku); setSaleConfirmKey(""); setSaleConfirmError(""); }}>Eliminar del inventario</button></div><div className="inventory-row-actions">'''
),
(
'''onClick={() => setExpandedInventoryId(expanded ? null : item.id)}''',
'''onClick={event => { event.stopPropagation(); setExpandedInventoryId(expanded ? null : item.id); }}'''
),
(
'''onClick={() => { if (window.confirm(`¿Eliminar esta lectura de ${item.sku}''',
'''onClick={event => { event.stopPropagation(); if (window.confirm(`¿Eliminar esta lectura de ${item.sku}'''
),
(
'''</aside>\n    </section>''',
'''</aside>\n      {saleConfirmSku && <div className="inventory-sale-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-sale-dialog-title"><form className="inventory-sale-dialog-card" onSubmit={event => { event.preventDefault(); confirmProtectedSale(); }}><div className="inventory-sale-dialog-icon"><TrendingDown size={22} /></div><span className="orders-eyebrow">SALIDA DE ALMACÉN</span><h2 id="inventory-sale-dialog-title">Confirmar venta</h2><p>Se descontará del inventario la cantidad indicada para <strong>{saleConfirmSku}</strong>.</p><label>Cantidad<input type="number" min="1" max="9999" value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} autoFocus /></label><label>Clave de confirmación<input type="password" inputMode="numeric" maxLength={4} value={saleConfirmKey} onChange={event => setSaleConfirmKey(event.target.value.replace(/\\D/g, "").slice(0, 4))} placeholder="0000" /></label>{saleConfirmError && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{saleConfirmError}</div>}<div className="inventory-sale-dialog-actions"><button type="button" className="orders-button orders-button--ghost" onClick={() => { setSaleConfirmSku(null); setSaleConfirmKey(""); setSaleConfirmError(""); }}>Cancelar</button><button type="submit" className="orders-button inventory-row-sale-confirm" disabled={recordSale.isPending}>{recordSale.isPending ? "Procesando…" : "Confirmar salida"}</button></div></form></div>}\n    </section>'''
)
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'No se encontró el anclaje: {old[:90]!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
print('Inventory UI patch applied')
