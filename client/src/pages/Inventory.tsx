import { FormEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, Barcode, Boxes, CheckCircle2, LoaderCircle, LogIn, LogOut, PackageSearch, Plus, RefreshCw, ScanLine } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { buildInventoryNotice, isInventoryAdmin } from "@shared/inventoryHelpers";
import { findInventoryCatalogProduct, getInventorySearchShardKeys, type InventoryCatalogProduct } from "@shared/inventoryCatalog";
const catalogShardUrls: Record<string, string> = {
  "0": "/manus-storage/diesel-catalog-inventory-shard-0_98d51a34.json",
  "1": "/manus-storage/diesel-catalog-inventory-shard-1_9aefba15.json",
  "2": "/manus-storage/diesel-catalog-inventory-shard-2_a01e429c.json",
  "3": "/manus-storage/diesel-catalog-inventory-shard-3_40ae2135.json",
  "4": "/manus-storage/diesel-catalog-inventory-shard-4_52532e7d.json",
  "5": "/manus-storage/diesel-catalog-inventory-shard-5_e1df4d5f.json",
  "6": "/manus-storage/diesel-catalog-inventory-shard-6_9d06066c.json",
  "7": "/manus-storage/diesel-catalog-inventory-shard-7_23aba4c9.json",
  "8": "/manus-storage/diesel-catalog-inventory-shard-8_8ea0a0ac.json",
  "9": "/manus-storage/diesel-catalog-inventory-shard-9_04e2631f.json",
  s: "/manus-storage/diesel-catalog-inventory-shard-s_1bdb056a.json",
};

function InventoryLogin() {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.auth.localLogin.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: () => setError("Usuario o contraseña incorrectos.") });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(""); login.mutate({ username, password }); };
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}><div className="orders-eyebrow">EUROTRUCK / INVENTARIO</div><h1>Acceso de inventario</h1><p>Esta pantalla está disponible únicamente para admin1.</p><label>Usuario<input autoFocus required value={username} onChange={event => setUsername(event.target.value)} placeholder="admin1" /></label><label>Clave<input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tu clave" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="orders-button" disabled={login.isPending} type="submit"><LogIn size={15} />{login.isPending ? "Verificando…" : "Entrar a inventario"}</button></form></main>;
}

export default function Inventory() {
  const { user, loading: authLoading, logout } = useAuth();
  const isAdmin1 = user?.role === "admin" && isInventoryAdmin(user.name);

  const [catalogLoading, setCatalogLoading] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryCatalogProduct | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [tramo, setTramo] = useState("");
  const [gondola, setGondola] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const catalogCache = useRef<Record<string, InventoryCatalogProduct[]>>({});
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, { enabled: isAdmin1, retry: false });
  const localLogout = trpc.auth.localLogout.useMutation({ onSuccess: async () => { await logout(); window.location.href = "/"; } });
  const recordCount = trpc.inventory.record.useMutation({ onSuccess: result => { setNotice(buildInventoryNotice(result.wasAlreadyCounted, Number(quantity), result.totalQuantity)); setSelectedProduct(null); setScanCode(""); setQuantity("1"); setTramo(""); setGondola(""); inventoryQuery.refetch(); inputRef.current?.focus(); }, onError: mutationError => setError(mutationError.message || "No se pudo guardar el conteo.") });

  const loadCatalogForSearch = async (keys: string[]) => {
    const missingKeys = keys.filter(key => !catalogCache.current[key]);
    if (missingKeys.length) {
      const loaded = await Promise.all(missingKeys.map(async key => {
        const response = await fetch(catalogShardUrls[key]);
        if (!response.ok) throw new Error(`Catalog ${response.status}`);
        return [key, await response.json() as InventoryCatalogProduct[]] as const;
      }));
      loaded.forEach(([key, items]) => { catalogCache.current[key] = items; });
    }
    return keys.flatMap(key => catalogCache.current[key] || []);
  };

  const countedByProduct = useMemo(() => new Map((inventoryQuery.data || []).map(item => [item.productId, item])), [inventoryQuery.data]);

  const findProduct = async (code: string) => {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return;
    setCatalogLoading(true); setError(""); setNotice("");
    try {
      const requestedKeys = getInventorySearchShardKeys(normalized);
      const searchable = await loadCatalogForSearch(requestedKeys);
      const product = findInventoryCatalogProduct(searchable, normalized);
      if (!product) { setSelectedProduct(null); setError("No encontramos ese artículo en el catálogo. Revisa la referencia e inténtalo otra vez."); return; }
      setSelectedProduct(product);
    } catch {
      setSelectedProduct(null); setError("No fue posible cargar el catálogo para escanear artículos.");
    } finally {
      setCatalogLoading(false);
    }
  };
  const submitScan = (event: FormEvent) => { event.preventDefault(); findProduct(scanCode); };
  const submitCount = (event: FormEvent) => { event.preventDefault(); if (!selectedProduct) return; setError(""); recordCount.mutate({ productId: selectedProduct.id, sku: selectedProduct.sku, name: selectedProduct.name, brand: selectedProduct.brand, application: selectedProduct.application, image: selectedProduct.image, quantity: Number(quantity), tramo: tramo.trim(), gondola: gondola.trim() }); };

  if (authLoading) return <div className="orders-state"><LoaderCircle className="orders-spin" />Comprobando acceso…</div>;
  if (!user) return <InventoryLogin />;
  if (!isAdmin1) return <div className="orders-state"><PackageSearch size={32} /><h1>Inventario restringido</h1><p>Solo el usuario admin1 puede acceder al conteo de inventario.</p><a className="orders-button" href="/orders"><LogOut size={15} />Volver a la bandeja</a></div>;

  return <main className="inventory-page"><header className="inventory-header"><div><span className="orders-eyebrow">EUROTRUCK / CONTROL DE EXISTENCIAS</span><h1>Inventario</h1><p>Escanea o busca una referencia, registra su ubicación y acumula las unidades encontradas.</p></div><div className="inventory-header-actions"><a className="orders-button orders-button--ghost" href="/orders">Bandeja de órdenes</a><button className="orders-button orders-button--ghost" onClick={() => inventoryQuery.refetch()}><RefreshCw size={15} />Actualizar</button><button className="orders-button orders-button--ghost" onClick={() => localLogout.mutate()} disabled={localLogout.isPending}><LogOut size={15} />{localLogout.isPending ? "Saliendo…" : "Salir"}</button></div></header><section className="inventory-workspace"><div className="inventory-scan-panel"><div className="inventory-panel-heading"><div><span className="orders-eyebrow">01 / ESCANEO</span><h2>Buscar artículo</h2></div><Barcode size={30} /></div><form className="inventory-scan-form" onSubmit={submitScan}><label htmlFor="inventory-scan">Referencia o código de barras</label><div><ScanLine size={18} /><input ref={inputRef} id="inventory-scan" autoFocus value={scanCode} onChange={event => setScanCode(event.target.value)} placeholder={catalogLoading ? "Cargando catálogo…" : "Escanea o escribe DT-…"} disabled={catalogLoading} /><button className="orders-button" type="submit" disabled={catalogLoading || !scanCode.trim()}><PackageSearch size={15} />Buscar</button></div></form>{error && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{error}</div>}{notice && <div className="inventory-alert inventory-alert--success" role="status"><CheckCircle2 size={16} />{notice}</div>}{selectedProduct && <form className="inventory-product-card" onSubmit={submitCount}><div className="inventory-product-main">{selectedProduct.image ? <img src={selectedProduct.image} alt="" /> : <div className="inventory-product-placeholder"><Boxes size={25} /></div>}<div><span>{selectedProduct.sku}</span><h3>{selectedProduct.name}</h3><small>{selectedProduct.brand || "—"} · {selectedProduct.application || "Aplicación general"}</small><p className="inventory-product-description">{selectedProduct.description || "Descripción no disponible."}</p></div></div>{countedByProduct.has(selectedProduct.id) && <div className="inventory-alert inventory-alert--warning"><AlertTriangle size={16} />Este artículo ya fue contado. El nuevo registro se sumará al total de {countedByProduct.get(selectedProduct.id)?.totalQuantity} unidades.</div>}<div className="inventory-count-fields"><label>Cantidad<input type="number" min="1" max="9999" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label>Tramo<input required value={tramo} onChange={event => setTramo(event.target.value)} placeholder="Ej. T-03" /></label><label>Góndola<input required value={gondola} onChange={event => setGondola(event.target.value)} placeholder="Ej. G-12" /></label></div><button className="orders-button inventory-save-button" disabled={recordCount.isPending} type="submit"><Plus size={16} />{recordCount.isPending ? "Guardando…" : "Guardar conteo"}</button></form>}</div><aside className="inventory-summary"><div className="inventory-panel-heading"><div><span className="orders-eyebrow">02 / RESUMEN</span><h2>Artículos contados</h2></div><Boxes size={26} /></div>{inventoryQuery.isLoading ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando conteos…</div> : inventoryQuery.data?.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>Aún no hay artículos contados.</p></div> : <div className="inventory-list">{inventoryQuery.data?.map(item => <article className="inventory-row" key={item.id}><div><strong>{item.sku}</strong><h3>{item.name}</h3><small>{item.lastTramo || "—"} · {item.lastGondola || "—"}</small></div><b>{item.totalQuantity}</b></article>)}</div>}</aside></section></main>;
}
