import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Barcode, Boxes, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, LogIn, LogOut, PackageSearch, Plus, RefreshCw, ScanLine, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { buildInventoryNotice, getInventoryScanLocation, isInventoryAdmin, isInventoryItemCounted } from "@shared/inventoryHelpers";
import { findInventoryCatalogProduct, getInventorySearchShardKeys, inventoryCatalogShardKeys, type InventoryCatalogProduct } from "@shared/inventoryCatalog";

const catalogIndexUrl = "/manus-storage/diesel-catalog-inventory-index_a42543ed.json";
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

const emptyArticle = { sku: "", name: "", description: "", brand: "", application: "", image: "" };
const catalogPageSize = 60;

type NewArticleForm = typeof emptyArticle;

type InventoryRow = {
  id: number;
  productId: string;
  sku: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  application?: string | null;
  image?: string | null;
  totalQuantity: number;
  lastTramo?: string | null;
  lastGondola?: string | null;
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
  const [catalogProducts, setCatalogProducts] = useState<InventoryCatalogProduct[]>([]);
  const [customProducts, setCustomProducts] = useState<InventoryCatalogProduct[]>([]);
  const [catalogBrowseQuery, setCatalogBrowseQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [scanCode, setScanCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryCatalogProduct | null>(null);
  const [lastScanAutoRecorded, setLastScanAutoRecorded] = useState(false);
  const [lastScanTotal, setLastScanTotal] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [tramo, setTramo] = useState("GENERAL");
  const [gondola, setGondola] = useState("GENERAL");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [newArticle, setNewArticle] = useState<NewArticleForm>(emptyArticle);
  const [newArticleError, setNewArticleError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const catalogCache = useRef<Record<string, InventoryCatalogProduct[]>>({});
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, { enabled: isAdmin1, retry: false });
  const localLogout = trpc.auth.localLogout.useMutation({ onSuccess: async () => { await logout(); window.location.href = "/"; } });
  const recordCount = trpc.inventory.record.useMutation({ onSuccess: result => { setNotice(buildInventoryNotice(result.wasAlreadyCounted, Number(quantity), result.totalQuantity)); setLastScanTotal(result.totalQuantity); setScanCode(""); setQuantity("1"); inventoryQuery.refetch(); inputRef.current?.focus(); }, onError: mutationError => { setLastScanTotal(null); setError(mutationError.message || "No se pudo guardar el conteo."); } });
  const createArticle = trpc.inventory.create.useMutation({
    onSuccess: created => {
      const createdProduct: InventoryCatalogProduct = { id: String(created.productId), sku: created.sku, name: created.name, description: created.description ?? undefined, brand: created.brand ?? undefined, application: created.application ?? undefined, image: created.image ?? undefined };
      setCustomProducts(current => [...current.filter(item => item.id !== createdProduct.id), createdProduct]);
      setSelectedProduct(createdProduct);
      setLastScanAutoRecorded(false);
      setLastScanTotal(null);
      setScanCode(createdProduct.sku);
      setShowNewArticle(false);
      setNewArticle(emptyArticle);
      setNewArticleError("");
      setNotice("Artículo nuevo agregado. Registra ahora su cantidad, tramo y góndola.");
      setError("");
      inventoryQuery.refetch();
    },
    onError: mutationError => setNewArticleError(mutationError.message || "No se pudo agregar el artículo."),
  });

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

  useEffect(() => {
    if (!isAdmin1) return;
    setCatalogLoading(true);
    fetch(catalogIndexUrl).then(response => { if (!response.ok) throw new Error(`Catalog index ${response.status}`); return response.json() as Promise<InventoryCatalogProduct[]>; }).then(items => setCatalogProducts(items)).catch(() => setError("No fue posible cargar el catálogo completo para inventario.")).finally(() => setCatalogLoading(false));
  }, [isAdmin1]);

  const countedItems = useMemo(() => (inventoryQuery.data || []).filter(item => isInventoryItemCounted(item.totalQuantity)), [inventoryQuery.data]);
  const countedByProduct = useMemo(() => new Map(countedItems.map(item => [item.productId, item])), [countedItems]);
  const persistedInventoryProducts = useMemo(() => (inventoryQuery.data || []).filter(item => !catalogProducts.some(product => product.id === item.productId) && !customProducts.some(product => product.id === item.productId)).map(item => ({ id: item.productId, sku: item.sku, name: item.name, description: item.description ?? undefined, brand: item.brand ?? undefined, application: item.application ?? undefined, image: item.image ?? undefined } satisfies InventoryCatalogProduct)), [inventoryQuery.data, catalogProducts, customProducts]);
  const allProducts = useMemo(() => [...customProducts, ...persistedInventoryProducts, ...catalogProducts], [customProducts, persistedInventoryProducts, catalogProducts]);
  const catalogMatches = useMemo(() => {
    const query = catalogBrowseQuery.trim().toLowerCase();
    if (!query) return allProducts;
    return allProducts.filter(item => [item.sku, item.id, item.name, item.description, item.brand, item.application].some(value => String(value || "").toLowerCase().includes(query)));
  }, [allProducts, catalogBrowseQuery]);
  const catalogPageCount = Math.max(1, Math.ceil(catalogMatches.length / catalogPageSize));
  const visibleCatalogProducts = catalogMatches.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize);

  useEffect(() => { setCatalogPage(1); }, [catalogBrowseQuery]);
  useEffect(() => { if (catalogPage > catalogPageCount) setCatalogPage(catalogPageCount); }, [catalogPage, catalogPageCount]);

  const findProduct = async (code: string) => {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return;
    setCatalogLoading(true); setError(""); setNotice("");
    try {
      const localProduct = findInventoryCatalogProduct(allProducts, normalized);
      const requestedKeys = getInventorySearchShardKeys(normalized);
      const searchable = localProduct?.id.startsWith("custom-") ? [] : await loadCatalogForSearch(requestedKeys);
      const product = localProduct || findInventoryCatalogProduct(searchable, normalized);
      if (!product) { setSelectedProduct(null); setError("No encontramos ese artículo en el catálogo. Revisa la referencia e inténtalo otra vez."); return; }
      setSelectedProduct(product);
      setLastScanAutoRecorded(true);
      setLastScanTotal(null);
      const location = getInventoryScanLocation(tramo, gondola);
      recordCount.mutate({ productId: product.id, sku: product.sku, name: product.name, description: product.description, brand: product.brand, application: product.application, image: product.image, quantity: 1, tramo: location.tramo, gondola: location.gondola });
    } catch {
      setSelectedProduct(null); setError("No fue posible cargar el catálogo para escanear artículos.");
    } finally { setCatalogLoading(false); }
  };

  const selectProduct = async (product: InventoryCatalogProduct) => {
    setSelectedProduct(null); setLastScanAutoRecorded(false); setLastScanTotal(null); setScanCode(product.sku); setError(""); setNotice(""); setCatalogLoading(true);
    try {
      const fullProduct = product.image ? product : findInventoryCatalogProduct(await loadCatalogForSearch(getInventorySearchShardKeys(product.sku)), product.sku) || product;
      setSelectedProduct(fullProduct);
    } catch { setSelectedProduct(product); setError("No fue posible cargar el detalle completo; puedes continuar con el conteo."); }
    finally { setCatalogLoading(false); }
  };
  const submitScan = (event: FormEvent) => { event.preventDefault(); void findProduct(scanCode); };
  const submitCount = (event: FormEvent) => { event.preventDefault(); if (!selectedProduct) return; setError(""); const location = getInventoryScanLocation(tramo, gondola); recordCount.mutate({ productId: selectedProduct.id, sku: selectedProduct.sku, name: selectedProduct.name, description: selectedProduct.description, brand: selectedProduct.brand, application: selectedProduct.application, image: selectedProduct.image, quantity: Number(quantity), tramo: location.tramo, gondola: location.gondola }); };
  const submitNewArticle = (event: FormEvent) => { event.preventDefault(); setNewArticleError(""); createArticle.mutate({ sku: newArticle.sku.trim(), name: newArticle.name.trim(), description: newArticle.description.trim() || undefined, brand: newArticle.brand.trim() || undefined, application: newArticle.application.trim() || undefined, image: newArticle.image.trim() || undefined }); };
  const updateNewArticle = (field: keyof NewArticleForm, value: string) => setNewArticle(current => ({ ...current, [field]: value }));

  if (authLoading) return <div className="orders-state"><LoaderCircle className="orders-spin" />Comprobando acceso…</div>;
  if (!user) return <InventoryLogin />;
  if (!isAdmin1) return <div className="orders-state"><PackageSearch size={32} /><h1>Inventario restringido</h1><p>Solo el usuario admin1 puede acceder al conteo de inventario.</p><a className="orders-button" href="/orders"><LogOut size={15} />Volver a la bandeja</a></div>;

  return <main className="inventory-page">
    <header className="inventory-header"><div><span className="orders-eyebrow">EUROTRUCK / CONTROL DE EXISTENCIAS</span><h1>Inventario</h1><p>Trabaja sobre el mismo catálogo de la página principal. Los artículos contados se marcan en verde y acumulan sus unidades por ubicación.</p></div><div className="inventory-header-actions"><a className="orders-button orders-button--ghost" href="/orders">Bandeja de órdenes</a><button className="orders-button orders-button--ghost" onClick={() => { setCatalogLoading(true); void fetch(catalogIndexUrl).then(response => response.json() as Promise<InventoryCatalogProduct[]>).then(items => setCatalogProducts(items)).finally(() => setCatalogLoading(false)); void inventoryQuery.refetch(); }}><RefreshCw size={15} />Actualizar</button><button className="orders-button orders-button--ghost" onClick={() => localLogout.mutate()} disabled={localLogout.isPending}><LogOut size={15} />{localLogout.isPending ? "Saliendo…" : "Salir"}</button></div></header>
    <section className="inventory-workspace">
      <div className="inventory-scan-panel">
        <div className="inventory-panel-heading"><div><span className="orders-eyebrow">01 / ESCANEO</span><h2>Buscar artículo</h2></div><Barcode size={30} /></div>
        <form className="inventory-scan-form" onSubmit={submitScan}><label htmlFor="inventory-scan">Referencia o código de barras · cada lectura suma 1 unidad</label><div><ScanLine size={18} /><input ref={inputRef} id="inventory-scan" autoFocus value={scanCode} onChange={event => setScanCode(event.target.value)} placeholder={catalogLoading ? "Cargando catálogo…" : "Escanea o escribe DT-…"} disabled={catalogLoading || recordCount.isPending} /><button className="orders-button" type="submit" disabled={catalogLoading || recordCount.isPending || !scanCode.trim()}><PackageSearch size={15} />{recordCount.isPending ? "Sumando…" : "Registrar +1"}</button></div></form>
        <div className="inventory-scan-location"><div><strong>Ubicación activa</strong><small>Cada escaneo suma 1 unidad aquí. Cámbiala antes de trabajar otra zona.</small></div><div className="inventory-scan-location-fields"><label>Tramo<input value={tramo} onChange={event => setTramo(event.target.value)} placeholder="GENERAL" /></label><label>Góndola<input value={gondola} onChange={event => setGondola(event.target.value)} placeholder="GENERAL" /></label></div></div>
        <div className="inventory-catalog-toolbar"><div><strong>Catálogo completo</strong><small>{catalogLoading ? "Cargando referencias…" : `${allProducts.length.toLocaleString("es-DO")} artículos disponibles`}</small></div><button type="button" className="orders-button orders-button--inventory" onClick={() => { setShowNewArticle(true); setNewArticleError(""); }}><Plus size={15} />Agregar nuevo</button></div>
        <label className="inventory-catalog-filter">Filtrar artículos<input value={catalogBrowseQuery} onChange={event => setCatalogBrowseQuery(event.target.value)} placeholder="Referencia, descripción, marca o aplicación" /></label>
        {error && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{error}</div>}{notice && <div className="inventory-alert inventory-alert--success" role="status"><CheckCircle2 size={16} />{notice}</div>}
        <div className="inventory-catalog-list" aria-live="polite">{catalogLoading && catalogProducts.length === 0 ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando todos los artículos…</div> : visibleCatalogProducts.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>No hay artículos que coincidan con ese filtro.</p></div> : visibleCatalogProducts.map(product => { const counted = countedByProduct.get(product.id); return <button type="button" className={`inventory-catalog-row${counted ? " is-counted" : ""}`} key={product.id} onClick={() => selectProduct(product)}><span className="inventory-catalog-thumb">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <Boxes size={18} />}</span><span className="inventory-catalog-copy"><strong>{product.sku}</strong><b>{product.name}</b><small>{product.brand || "—"} · {product.application || "Aplicación general"}</small></span><span className="inventory-catalog-status">{counted ? <><CheckCircle2 size={15} />Contado · {counted.totalQuantity}</> : "Pendiente"}</span></button>; })}</div>
        <div className="inventory-pagination"><small>Mostrando {catalogMatches.length ? (catalogPage - 1) * catalogPageSize + 1 : 0}–{Math.min(catalogPage * catalogPageSize, catalogMatches.length)} de {catalogMatches.length.toLocaleString("es-DO")}</small><div><button type="button" className="orders-button orders-button--ghost" disabled={catalogPage <= 1} onClick={() => setCatalogPage(page => page - 1)}><ChevronLeft size={15} />Anterior</button><span>Página {catalogPage} / {catalogPageCount}</span><button type="button" className="orders-button orders-button--ghost" disabled={catalogPage >= catalogPageCount} onClick={() => setCatalogPage(page => page + 1)}>Siguiente<ChevronRight size={15} /></button></div></div>
        {selectedProduct && <form className="inventory-product-card" onSubmit={submitCount}><div className="inventory-product-main">{selectedProduct.image ? <img src={selectedProduct.image} alt="" /> : <div className="inventory-product-placeholder"><Boxes size={25} /></div>}<div><span>{selectedProduct.sku}</span><h3>{selectedProduct.name}</h3><small>{selectedProduct.brand || "—"} · {selectedProduct.application || "Aplicación general"}</small><p className="inventory-product-description">{selectedProduct.description || "Descripción no disponible."}</p></div></div>{lastScanAutoRecorded && lastScanTotal !== null && <div className="inventory-alert inventory-alert--success"><CheckCircle2 size={16} />Lectura registrada: <strong>+1 unidad</strong>. Total acumulado: <strong>{lastScanTotal}</strong>. Puedes escanear la siguiente referencia.</div>}{!lastScanAutoRecorded && countedByProduct.has(selectedProduct.id) && <div className="inventory-alert inventory-alert--warning"><AlertTriangle size={16} />Este artículo ya fue contado. El nuevo registro se sumará al total de {countedByProduct.get(selectedProduct.id)?.totalQuantity} unidades.</div>}{!lastScanAutoRecorded && <><div className="inventory-count-fields"><label>Cantidad<input type="number" min="1" max="9999" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label>Tramo<input required value={tramo} onChange={event => setTramo(event.target.value)} placeholder="Ej. T-03" /></label><label>Góndola<input required value={gondola} onChange={event => setGondola(event.target.value)} placeholder="Ej. G-12" /></label></div><button className="orders-button inventory-save-button" disabled={recordCount.isPending} type="submit"><Plus size={16} />{recordCount.isPending ? "Guardando…" : "Guardar conteo"}</button></>}</form>}
        {showNewArticle && <div className="inventory-new-article" role="dialog" aria-modal="true" aria-labelledby="new-article-title"><div className="inventory-new-article-header"><div><span className="orders-eyebrow">ALTA MANUAL</span><h2 id="new-article-title">Agregar artículo nuevo</h2></div><button type="button" className="inventory-close-button" onClick={() => setShowNewArticle(false)} aria-label="Cerrar"><X size={18} /></button></div><p>Este artículo quedará disponible en el catálogo de inventario para que puedas contarlo y ubicarlo.</p><form onSubmit={submitNewArticle} className="inventory-new-article-form"><label>Referencia<input required maxLength={100} value={newArticle.sku} onChange={event => updateNewArticle("sku", event.target.value)} placeholder="Ej. NUEVO-001" /></label><label>Nombre<input required maxLength={500} value={newArticle.name} onChange={event => updateNewArticle("name", event.target.value)} placeholder="Nombre del artículo" /></label><label>Descripción<textarea maxLength={2000} value={newArticle.description} onChange={event => updateNewArticle("description", event.target.value)} placeholder="Descripción del artículo" /></label><div className="inventory-new-article-grid"><label>Marca<input maxLength={120} value={newArticle.brand} onChange={event => updateNewArticle("brand", event.target.value)} placeholder="Marca" /></label><label>Aplicación<input maxLength={120} value={newArticle.application} onChange={event => updateNewArticle("application", event.target.value)} placeholder="Iveco, Scania…" /></label></div><label>URL de imagen <span className="inventory-optional">opcional</span><input maxLength={2000} value={newArticle.image} onChange={event => updateNewArticle("image", event.target.value)} placeholder="https://…" /></label>{newArticleError && <div className="form-error" role="alert">{newArticleError}</div>}<div className="inventory-new-article-actions"><button type="button" className="orders-button orders-button--ghost" onClick={() => setShowNewArticle(false)}>Cancelar</button><button type="submit" className="orders-button orders-button--inventory" disabled={createArticle.isPending}><Plus size={15} />{createArticle.isPending ? "Guardando…" : "Agregar artículo"}</button></div></form></div>}
      </div>
      <aside className="inventory-summary"><div className="inventory-panel-heading"><div><span className="orders-eyebrow">02 / RESUMEN</span><h2>Artículos contados</h2></div><Boxes size={26} /></div>{inventoryQuery.isLoading ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando conteos…</div> : countedItems.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>Aún no hay artículos contados.</p></div> : <div className="inventory-list">{(countedItems as InventoryRow[]).map(item => <article className="inventory-row is-counted" key={item.id}><div><strong>{item.sku}</strong><h3>{item.name}</h3><small>{item.lastTramo || "—"} · {item.lastGondola || "—"}</small></div><b>{item.totalQuantity}</b></article>)}</div>}</aside>
    </section>
  </main>;
}
