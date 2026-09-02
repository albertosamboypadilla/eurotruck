import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Barcode, Boxes, CheckCircle2, ChevronLeft, ChevronRight, House, LoaderCircle, LogIn, LogOut, MapPin, PackageSearch, Plus, Printer, RefreshCw, ScanLine, Trash2, TrendingDown, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { buildInventoryNotice, getInventoryScanLocation, isInventoryAdmin, isInventoryItemCounted } from "@shared/inventoryHelpers";
import { findInventoryCatalogProduct, getInventorySearchShardKeys, inventoryCatalogShardKeys, type InventoryCatalogProduct } from "@shared/inventoryCatalog";
import { attachGtins, getGtinsForSku, productMatchesCatalogQuery, type GtinMap } from "@shared/gtinHelpers";
import { buildZebraLabelSequence } from "@shared/zebraLabel";

const catalogIndexUrl = "/manus-storage/diesel-catalog-inventory-index_a42543ed.json";
const gtinMapFileUrl = "/manus-storage/diesel-gtin-map-complete_604000de.json";
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
type InventoryLocation = { id: string; tramo: string; gondola: string };
const defaultInventoryLocation: InventoryLocation = { id: "general", tramo: "GENERAL", gondola: "GENERAL" };
const activeInventoryLocationStorageKey = "eurotruck-inventory-active-location";

function getStoredInventoryLocations(): InventoryLocation[] {
  if (typeof window === "undefined") return [defaultInventoryLocation];
  try {
    const parsed = JSON.parse(window.localStorage.getItem("eurotruck-inventory-locations") || "[]") as Partial<InventoryLocation>[];
    const locations = parsed.filter(location => location.id && location.tramo && location.gondola).map(location => ({ id: String(location.id), tramo: String(location.tramo), gondola: String(location.gondola) }));
    return [defaultInventoryLocation, ...locations.filter(location => location.id !== defaultInventoryLocation.id)];
  } catch {
    return [defaultInventoryLocation];
  }
}

function persistInventoryLocations(locations: InventoryLocation[]) {
  window.localStorage.setItem("eurotruck-inventory-locations", JSON.stringify(locations.filter(location => location.id !== defaultInventoryLocation.id)));
}

function getStoredActiveInventoryLocation() {
  const locations = getStoredInventoryLocations();
  if (typeof window === "undefined") return defaultInventoryLocation.id;
  const storedId = window.localStorage.getItem(activeInventoryLocationStorageKey);
  return storedId && locations.some(location => location.id === storedId) ? storedId : defaultInventoryLocation.id;
}

function persistActiveInventoryLocation(locationId: string) {
  window.localStorage.setItem(activeInventoryLocationStorageKey, locationId);
}

function formatInventoryScanDate(value: string | Date) {
  return new Date(value).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });
}

type InventoryRow = {
  id: number;
  productId: string;
  sku: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  application?: string | null;
  image?: string | null;
  gtins?: string[];
  totalQuantity: number;
  lastTramo?: string | null;
  lastGondola?: string | null;
  lastScanId?: number | null;
  scanCount?: number;
};

type InventoryScanRow = {
  id: number;
  quantity: number;
  tramo: string;
  gondola: string;
  countedBy: string;
  createdAt: string | Date;
};

type TopSoldRow = {
  sku: string;
  productId: string;
  name: string;
  soldQuantity: number;
};

const lowStockThreshold = 3;

function InventoryLogin() {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.auth.localLogin.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: () => setError("Usuario o contraseña incorrectos.") });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(""); login.mutate({ username, password }); };
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}><div className="orders-eyebrow">EUROTRUCK / INVENTARIO</div><h1>Acceso de inventario</h1><p>Esta pantalla está disponible únicamente para admin1.</p><label>Usuario<input autoFocus required value={username} onChange={event => setUsername(event.target.value)} placeholder="admin1" /></label><label>Clave<input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tu clave" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="orders-button" disabled={login.isPending} type="submit"><LogIn size={15} />{login.isPending ? "Verificando…" : "Entrar a inventario"}</button><a className="orders-button orders-button--ghost" href="/"><House size={15} />Ir a la página principal</a></form></main>;
}

export default function Inventory() {
  const { user, loading: authLoading, logout } = useAuth();
  const isAdmin1 = user?.role === "admin" && isInventoryAdmin(user.name);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<InventoryCatalogProduct[]>([]);
  const [gtinMap, setGtinMap] = useState<GtinMap>({});
  const [customProducts, setCustomProducts] = useState<InventoryCatalogProduct[]>([]);
  const [catalogBrowseQuery, setCatalogBrowseQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [scanCode, setScanCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryCatalogProduct | null>(null);
  const [lastScanAutoRecorded, setLastScanAutoRecorded] = useState(false);
  const [lastScanTotal, setLastScanTotal] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [tramo, setTramo] = useState(defaultInventoryLocation.tramo);
  const [gondola, setGondola] = useState(defaultInventoryLocation.gondola);
  const [savedLocations, setSavedLocations] = useState<InventoryLocation[]>(getStoredInventoryLocations);
  const [activeLocationId, setActiveLocationId] = useState(getStoredActiveInventoryLocation);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [newLocationTramo, setNewLocationTramo] = useState("");
  const [newLocationGondola, setNewLocationGondola] = useState("");
  const [expandedInventoryId, setExpandedInventoryId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [newArticle, setNewArticle] = useState<NewArticleForm>(emptyArticle);
  const [newArticleError, setNewArticleError] = useState("");
  const [saleCode, setSaleCode] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleNotice, setSaleNotice] = useState("");
  const [saleError, setSaleError] = useState("");
  const [reportMonth, setReportMonth] = useState(() => new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [labelStartCode, setLabelStartCode] = useState(() => { if (typeof window === "undefined") return "00001"; return String(Number(window.localStorage.getItem("eurotruck-label-counter") || "1")).padStart(5, "0"); });
  const [labelQuantity, setLabelQuantity] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);
  const catalogCache = useRef<Record<string, InventoryCatalogProduct[]>>({});
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, { enabled: isAdmin1, retry: false });
  const historyInput = useMemo(() => ({ inventoryItemId: expandedInventoryId ?? 1 }), [expandedInventoryId]);
  const historyQuery = trpc.inventory.history.useQuery(historyInput, { enabled: isAdmin1 && expandedInventoryId !== null, retry: false });
  const topSoldInput = useMemo(() => ({ month: reportMonth, year: reportYear }), [reportMonth, reportYear]);
  const topSoldQuery = trpc.inventory.topSold.useQuery(topSoldInput, { enabled: isAdmin1, retry: false });
  const localLogout = trpc.auth.localLogout.useMutation({ onSuccess: async () => { await logout(); window.location.href = "/"; } });
  const recordCount = trpc.inventory.record.useMutation({ onSuccess: result => { setNotice(buildInventoryNotice(result.wasAlreadyCounted, Number(quantity), result.totalQuantity)); setLastScanTotal(result.totalQuantity); setScanCode(""); setQuantity("1"); void inventoryQuery.refetch(); if (expandedInventoryId === result.id) void historyQuery.refetch(); inputRef.current?.focus(); }, onError: mutationError => { setLastScanTotal(null); setError(mutationError.message || "No se pudo guardar el conteo."); } });
  const deleteScan = trpc.inventory.deleteScan.useMutation({ onSuccess: async result => { setNotice(`Se eliminó ${result.removedQuantity === 1 ? "1 unidad" : `${result.removedQuantity} unidades`}. Total restante: ${result.totalQuantity}.`); setError(""); setSelectedProduct(null); setLastScanAutoRecorded(false); setLastScanTotal(null); await Promise.all([inventoryQuery.refetch(), historyQuery.refetch()]); inputRef.current?.focus(); }, onError: mutationError => setError(mutationError.message || "No se pudo eliminar la lectura.") });
  const recordSale = trpc.inventory.recordSale.useMutation({
    onSuccess: result => {
      setSaleNotice(`Salida registrada: -${result.soldQuantity} unidad${result.soldQuantity === 1 ? "" : "es"}. Stock restante de ${result.sku}: ${result.totalQuantity}.`);
      setSaleError("");
      setSaleCode("");
      setSaleQuantity("1");
      void inventoryQuery.refetch();
      void topSoldQuery.refetch();
      inputRef.current?.focus();
    },
    onError: mutationError => { setSaleError(mutationError.message || "No se pudo descontar el inventario."); setSaleNotice(""); },
  });
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
        const items = await response.json() as InventoryCatalogProduct[];
        return [key, items.map(item => attachGtins(item, gtinMap))] as const;
      }));
      loaded.forEach(([key, items]) => { catalogCache.current[key] = items; });
    }
    return keys.flatMap(key => catalogCache.current[key] || []);
  };

  useEffect(() => {
    if (!isAdmin1) return;
    setCatalogLoading(true);
    Promise.all([
      fetch(catalogIndexUrl).then(response => { if (!response.ok) throw new Error(`Catalog index ${response.status}`); return response.json() as Promise<InventoryCatalogProduct[]>; }),
      fetch(gtinMapFileUrl).then(response => { if (!response.ok) throw new Error(`GTIN map ${response.status}`); return response.json() as Promise<GtinMap>; }),
    ]).then(([items, map]) => { setGtinMap(map); setCatalogProducts(items.map(item => attachGtins(item, map))); }).catch(() => setError("No fue posible cargar el catálogo completo para inventario.")).finally(() => setCatalogLoading(false));
  }, [isAdmin1]);

  useEffect(() => {
    const active = savedLocations.find(location => location.id === activeLocationId);
    if (!active) return;
    setTramo(active.tramo);
    setGondola(active.gondola);
  }, [activeLocationId, savedLocations]);

  const countedItems = useMemo(() => (inventoryQuery.data || []).filter(item => isInventoryItemCounted(item.totalQuantity)), [inventoryQuery.data]);
  const countedByProduct = useMemo(() => new Map(countedItems.map(item => [item.productId, item])), [countedItems]);
  const persistedInventoryProducts = useMemo(() => (inventoryQuery.data || []).filter(item => !catalogProducts.some(product => product.id === item.productId) && !customProducts.some(product => product.id === item.productId)).map(item => ({ id: item.productId, sku: item.sku, name: item.name, description: item.description ?? undefined, brand: item.brand ?? undefined, application: item.application ?? undefined, image: item.image ?? undefined, gtins: getGtinsForSku(item.sku, gtinMap) } satisfies InventoryCatalogProduct)), [inventoryQuery.data, catalogProducts, customProducts, gtinMap]);
  const allProducts = useMemo(() => [...customProducts, ...persistedInventoryProducts, ...catalogProducts], [customProducts, persistedInventoryProducts, catalogProducts]);
  const catalogMatches = useMemo(() => {
    const query = catalogBrowseQuery.trim().toLowerCase();
    if (!query) return allProducts;
    return allProducts.filter(item => productMatchesCatalogQuery(item, query));
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
  const selectLocation = (locationId: string) => { if (!savedLocations.some(location => location.id === locationId)) return; setActiveLocationId(locationId); persistActiveInventoryLocation(locationId); };
  const removeLocation = (locationId: string) => {
    if (locationId === defaultInventoryLocation.id) return;
    const nextLocations = savedLocations.filter(location => location.id !== locationId);
    persistInventoryLocations(nextLocations);
    setSavedLocations(nextLocations);
    if (activeLocationId === locationId) selectLocation(defaultInventoryLocation.id);
    setNotice("Área eliminada. Las lecturas existentes conservan su ubicación histórica.");
  };
  const submitNewLocation = (event: FormEvent) => { event.preventDefault(); const location = getInventoryScanLocation(newLocationTramo, newLocationGondola); const id = `${location.tramo}::${location.gondola}`.toLowerCase(); const nextLocation: InventoryLocation = { id, ...location }; setSavedLocations(current => { const next = [...current.filter(item => item.id !== id), nextLocation]; persistInventoryLocations(next); return next; }); setActiveLocationId(id); persistActiveInventoryLocation(id); setShowLocationForm(false); setNewLocationTramo(""); setNewLocationGondola(""); setNotice(`Área activa: ${location.tramo} / ${location.gondola}. Las siguientes lecturas conservarán esta ubicación.`); };
  const submitNewArticle = (event: FormEvent) => { event.preventDefault(); setNewArticleError(""); createArticle.mutate({ sku: newArticle.sku.trim(), name: newArticle.name.trim(), description: newArticle.description.trim() || undefined, brand: newArticle.brand.trim() || undefined, application: newArticle.application.trim() || undefined, image: newArticle.image.trim() || undefined }); };
  const submitSale = (event: FormEvent) => { event.preventDefault(); setSaleError(""); setSaleNotice(""); const parsedQuantity = Number(saleQuantity); if (!saleCode.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) { setSaleError("Indica un SKU y una cantidad válida."); return; } recordSale.mutate({ sku: saleCode.trim(), quantity: parsedQuantity, source: "scan" }); };
  const printTopSoldReport = () => { window.print(); };
  const downloadZebraLabels = () => {
    if (!selectedProduct) return;
    const quantityToPrint = Number(labelQuantity);
    const zpl = buildZebraLabelSequence(labelStartCode, quantityToPrint, selectedProduct.sku, selectedProduct.name);
    const blobUrl = URL.createObjectURL(new Blob([zpl], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `eurotruck-${selectedProduct.sku.replace(/[^a-z0-9.-]/gi, "_")}-labels.zpl`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
    const nextCode = String(Number(labelStartCode) + quantityToPrint).padStart(5, "0");
    window.localStorage.setItem("eurotruck-label-counter", nextCode);
    setLabelStartCode(nextCode);
    setLabelQuantity("1");
    setNotice(`${quantityToPrint} etiqueta${quantityToPrint === 1 ? "" : "s"} ZPL preparada${quantityToPrint === 1 ? "" : "s"} para ${selectedProduct.sku}.`);
  };
  const updateNewArticle = (field: keyof NewArticleForm, value: string) => setNewArticle(current => ({ ...current, [field]: value }));

  if (authLoading) return <div className="orders-state"><LoaderCircle className="orders-spin" />Comprobando acceso…</div>;
  if (!user) return <InventoryLogin />;
  if (!isAdmin1) return <div className="orders-state"><PackageSearch size={32} /><h1>Inventario restringido</h1><p>Solo el usuario admin1 puede acceder al conteo de inventario.</p><div className="orders-state-actions"><a className="orders-button" href="/orders"><LogOut size={15} />Volver a la bandeja</a><a className="orders-button orders-button--ghost" href="/"><House size={15} />Ir a la página principal</a></div></div>;

  return <main className="inventory-page">
    <header className="inventory-header"><div><span className="orders-eyebrow">EUROTRUCK / CONTROL DE EXISTENCIAS</span><h1>Inventario</h1><p>Trabaja sobre el mismo catálogo de la página principal. Los artículos contados se marcan en verde y acumulan sus unidades por ubicación.</p></div><div className="inventory-header-actions"><a className="orders-button orders-button--ghost" href="/"><House size={15} />Ir a la página principal</a><a className="orders-button orders-button--ghost" href="/orders">Bandeja de órdenes</a><button className="orders-button orders-button--ghost" onClick={() => { setCatalogLoading(true); void fetch(catalogIndexUrl).then(response => response.json() as Promise<InventoryCatalogProduct[]>).then(items => setCatalogProducts(items.map(item => attachGtins(item, gtinMap)))).finally(() => setCatalogLoading(false)); void inventoryQuery.refetch(); }}><RefreshCw size={15} />Actualizar</button><button className="orders-button orders-button--ghost" onClick={() => localLogout.mutate()} disabled={localLogout.isPending}><LogOut size={15} />{localLogout.isPending ? "Saliendo…" : "Salir"}</button></div></header>
    <section className="inventory-workspace">
      <div className="inventory-scan-panel">
        <div className="inventory-scan-location"><div><span className="orders-eyebrow">01 / ÁREA DE CONTEO</span><strong>Ubicación activa</strong><small>Selecciona o agrega el tramo y la góndola antes de escanear. Cada lectura se guardará automáticamente en esta área hasta que la cambies.</small><div className="inventory-location-picker"><select value={activeLocationId} onChange={event => selectLocation(event.target.value)} aria-label="Seleccionar ubicación activa">{savedLocations.map(location => <option key={location.id} value={location.id}>{location.tramo} / {location.gondola}</option>)}</select><button type="button" className="inventory-location-delete" disabled={activeLocationId === defaultInventoryLocation.id} onClick={() => { if (window.confirm("¿Eliminar esta área guardada? Las lecturas existentes conservarán su ubicación histórica.")) removeLocation(activeLocationId); }}><Trash2 size={14} />Eliminar área</button></div><button type="button" className="inventory-location-add" onClick={() => setShowLocationForm(current => !current)}><Plus size={13} />{showLocationForm ? "Cerrar alta de área" : "Agregar otra área"}</button></div><div className="inventory-scan-location-fields"><label>Tramo<input value={tramo} readOnly aria-readonly="true" /></label><label>Góndola<input value={gondola} readOnly aria-readonly="true" /></label></div>{showLocationForm && <form className="inventory-location-form" onSubmit={submitNewLocation}><label>Nuevo tramo<input required value={newLocationTramo} onChange={event => setNewLocationTramo(event.target.value)} placeholder="Ej. T-03" /></label><label>Nueva góndola<input required value={newLocationGondola} onChange={event => setNewLocationGondola(event.target.value)} placeholder="Ej. G-12" /></label><button type="submit" className="orders-button orders-button--inventory"><Plus size={14} />Guardar y activar</button></form>}</div>
        <div className="inventory-panel-heading"><div><span className="orders-eyebrow">02 / ESCANEO</span><h2>Buscar artículo</h2></div><Barcode size={30} /></div>
        <form className="inventory-scan-form" onSubmit={submitScan}><label htmlFor="inventory-scan">Referencia o código de barras · cada lectura suma 1 unidad</label><div><ScanLine size={18} /><input ref={inputRef} id="inventory-scan" autoFocus value={scanCode} onChange={event => setScanCode(event.target.value)} placeholder={catalogLoading ? "Cargando catálogo…" : "Escanea referencia o GTIN…"} disabled={catalogLoading || recordCount.isPending} /><button className="orders-button" type="submit" disabled={catalogLoading || recordCount.isPending || !scanCode.trim()}><PackageSearch size={15} />{recordCount.isPending ? "Sumando…" : "Registrar +1"}</button></div></form><section className="inventory-sale-panel" aria-labelledby="inventory-sale-title"><div className="inventory-subpanel-heading"><div><span className="orders-eyebrow">SALIDA POR VENTA</span><h3 id="inventory-sale-title">Descontar del inventario</h3></div><TrendingDown size={22} /></div><p>Escanea o escribe el SKU después de vender una pieza. Solo admin1 puede registrar la salida.</p><form className="inventory-sale-form" onSubmit={submitSale}><label>SKU o referencia<input value={saleCode} onChange={event => setSaleCode(event.target.value)} placeholder="Ej. 1.00739" /></label><label>Cantidad<input type="number" min="1" max="9999" value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} /></label><button className="orders-button orders-button--inventory" type="submit" disabled={recordSale.isPending || !saleCode.trim()}><TrendingDown size={15} />{recordSale.isPending ? "Descontando…" : "Registrar salida"}</button></form>{saleError && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{saleError}</div>}{saleNotice && <div className="inventory-alert inventory-alert--success" role="status"><CheckCircle2 size={16} />{saleNotice}</div>}</section>
        <div className="inventory-catalog-toolbar"><div><strong>Catálogo completo</strong><small>{catalogLoading ? "Cargando referencias…" : `${allProducts.length.toLocaleString("es-DO")} artículos disponibles · ${Object.keys(gtinMap).length.toLocaleString("es-DO")} con GTIN`}</small></div><button type="button" className="orders-button orders-button--inventory" onClick={() => { setShowNewArticle(true); setNewArticleError(""); }}><Plus size={15} />Agregar nuevo</button></div>
        <label className="inventory-catalog-filter">Filtrar artículos<input value={catalogBrowseQuery} onChange={event => setCatalogBrowseQuery(event.target.value)} placeholder="Referencia, GTIN, descripción, marca o aplicación" /></label>
        {error && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{error}</div>}{notice && <div className="inventory-alert inventory-alert--success" role="status"><CheckCircle2 size={16} />{notice}</div>}
        <div className="inventory-catalog-list" aria-live="polite">{catalogLoading && catalogProducts.length === 0 ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando todos los artículos…</div> : visibleCatalogProducts.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>No hay artículos que coincidan con ese filtro.</p></div> : visibleCatalogProducts.map(product => { const counted = countedByProduct.get(product.id); const lowStock = Boolean(counted && counted.totalQuantity <= lowStockThreshold); return <button type="button" className={`inventory-catalog-row${counted ? " is-counted" : ""}${lowStock ? " is-low-stock" : ""}`} key={product.id} onClick={() => selectProduct(product)}><span className="inventory-catalog-thumb">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <Boxes size={18} />}</span><span className="inventory-catalog-copy"><strong>{product.sku}</strong>{product.gtins?.length ? <em>GTIN {product.gtins.join(" · ")}</em> : <em className="inventory-gtin-missing">GTIN no registrado</em>}<small className="inventory-catalog-location"><MapPin size={12} />{counted ? `Última ubicación: ${counted.lastTramo || "—"} / ${counted.lastGondola || "—"}` : "Ubicación pendiente"}</small><b>{product.name}</b><small>{product.brand || "—"} · {product.application || "Aplicación general"}</small></span><span className={`inventory-catalog-status${lowStock ? " is-low-stock" : ""}`}>{counted ? lowStock ? <><AlertTriangle size={15} />Bajo stock · {counted.totalQuantity}</> : <><CheckCircle2 size={15} />Contado · {counted.totalQuantity}</> : "Pendiente"}</span></button>; })}</div>
        <div className="inventory-pagination"><small>Mostrando {catalogMatches.length ? (catalogPage - 1) * catalogPageSize + 1 : 0}–{Math.min(catalogPage * catalogPageSize, catalogMatches.length)} de {catalogMatches.length.toLocaleString("es-DO")}</small><div><button type="button" className="orders-button orders-button--ghost" disabled={catalogPage <= 1} onClick={() => setCatalogPage(page => page - 1)}><ChevronLeft size={15} />Anterior</button><span>Página {catalogPage} / {catalogPageCount}</span><button type="button" className="orders-button orders-button--ghost" disabled={catalogPage >= catalogPageCount} onClick={() => setCatalogPage(page => page + 1)}>Siguiente<ChevronRight size={15} /></button></div></div>
        {selectedProduct && <form className="inventory-product-card" onSubmit={submitCount}><div className="inventory-product-main">{selectedProduct.image ? <img src={selectedProduct.image} alt="" /> : <div className="inventory-product-placeholder"><Boxes size={25} /></div>}<div><span>{selectedProduct.sku}</span>{selectedProduct.gtins?.length ? <em>GTIN {selectedProduct.gtins.join(" · ")}</em> : <em className="inventory-gtin-missing">GTIN no registrado</em>}<h3>{selectedProduct.name}</h3><small>{selectedProduct.brand || "—"} · {selectedProduct.application || "Aplicación general"}</small><p className="inventory-product-description">{selectedProduct.description || "Descripción no disponible."}</p></div></div><div className="inventory-label-panel"><div><strong>Etiqueta Zebra LP2824 Plus</strong><small>Usa el código interno y conserva SKU y nombre del artículo. Se descarga en formato ZPL para enviarlo al software de la impresora.</small></div><div className="inventory-label-fields"><label>Inicio<input value={labelStartCode} onChange={event => setLabelStartCode(event.target.value.replace(/\D/g, "").slice(-12))} inputMode="numeric" minLength={5} /></label><label>Cantidad<input type="number" min="1" max="500" value={labelQuantity} onChange={event => setLabelQuantity(event.target.value)} /></label><button type="button" className="orders-button orders-button--ghost" onClick={downloadZebraLabels}><Printer size={15} />Descargar ZPL</button></div></div>{lastScanAutoRecorded && lastScanTotal !== null && <div className="inventory-alert inventory-alert--success"><CheckCircle2 size={16} />Lectura registrada: <strong>+1 unidad</strong>. Total acumulado: <strong>{lastScanTotal}</strong>. Puedes escanear la siguiente referencia.</div>}{!lastScanAutoRecorded && countedByProduct.has(selectedProduct.id) && <div className="inventory-alert inventory-alert--warning"><AlertTriangle size={16} />Este artículo ya fue contado. El nuevo registro se sumará al total de {countedByProduct.get(selectedProduct.id)?.totalQuantity} unidades.</div>}{!lastScanAutoRecorded && <><div className="inventory-count-fields"><label>Cantidad<input type="number" min="1" max="9999" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label>Tramo<input required value={tramo} readOnly aria-readonly="true" /></label><label>Góndola<input required value={gondola} readOnly aria-readonly="true" /></label></div><button className="orders-button inventory-save-button" disabled={recordCount.isPending} type="submit"><Plus size={16} />{recordCount.isPending ? "Guardando…" : "Guardar conteo"}</button></>}</form>}
        {showNewArticle && <div className="inventory-new-article" role="dialog" aria-modal="true" aria-labelledby="new-article-title"><div className="inventory-new-article-header"><div><span className="orders-eyebrow">ALTA MANUAL</span><h2 id="new-article-title">Agregar artículo nuevo</h2></div><button type="button" className="inventory-close-button" onClick={() => setShowNewArticle(false)} aria-label="Cerrar"><X size={18} /></button></div><p>Este artículo quedará disponible en el catálogo de inventario para que puedas contarlo y ubicarlo.</p><form onSubmit={submitNewArticle} className="inventory-new-article-form"><label>Referencia<input required maxLength={100} value={newArticle.sku} onChange={event => updateNewArticle("sku", event.target.value)} placeholder="Ej. NUEVO-001" /></label><label>Nombre<input required maxLength={500} value={newArticle.name} onChange={event => updateNewArticle("name", event.target.value)} placeholder="Nombre del artículo" /></label><label>Descripción<textarea maxLength={2000} value={newArticle.description} onChange={event => updateNewArticle("description", event.target.value)} placeholder="Descripción del artículo" /></label><div className="inventory-new-article-grid"><label>Marca<input maxLength={120} value={newArticle.brand} onChange={event => updateNewArticle("brand", event.target.value)} placeholder="Marca" /></label><label>Aplicación<input maxLength={120} value={newArticle.application} onChange={event => updateNewArticle("application", event.target.value)} placeholder="Iveco, Scania…" /></label></div><label>URL de imagen <span className="inventory-optional">opcional</span><input maxLength={2000} value={newArticle.image} onChange={event => updateNewArticle("image", event.target.value)} placeholder="https://…" /></label>{newArticleError && <div className="form-error" role="alert">{newArticleError}</div>}<div className="inventory-new-article-actions"><button type="button" className="orders-button orders-button--ghost" onClick={() => setShowNewArticle(false)}>Cancelar</button><button type="submit" className="orders-button orders-button--inventory" disabled={createArticle.isPending}><Plus size={15} />{createArticle.isPending ? "Guardando…" : "Agregar artículo"}</button></div></form></div>}
      </div>
      <aside className="inventory-summary"><div className="inventory-panel-heading"><div><span className="orders-eyebrow">03 / RESUMEN</span><h2>Artículos contados</h2></div><Boxes size={26} /></div><section className="inventory-report-panel" aria-labelledby="inventory-report-title"><div className="inventory-subpanel-heading"><div><span className="orders-eyebrow">REPORTE</span><h3 id="inventory-report-title">Más vendidos</h3></div><Printer size={21} /></div><div className="inventory-report-filters"><label>Mes<select value={reportMonth} onChange={event => setReportMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index, 1).toLocaleString("es-DO", { month: "long" })}</option>)}</select></label><label>Año<input type="number" min="2000" max="2200" value={reportYear} onChange={event => setReportYear(Number(event.target.value))} /></label></div>{topSoldQuery.isLoading ? <small>Cargando reporte…</small> : topSoldQuery.data?.length ? <ol className="inventory-report-list">{(topSoldQuery.data as TopSoldRow[]).map(item => <li key={`${item.productId}-${item.sku}`}><span><strong>{item.sku}</strong><b>{item.name}</b></span><em>{item.soldQuantity} vendidos</em></li>)}</ol> : <p className="inventory-report-empty">No hay ventas registradas para este período.</p>}<button type="button" className="orders-button orders-button--ghost inventory-print-button" onClick={printTopSoldReport}><Printer size={15} />Imprimir reporte</button></section>{inventoryQuery.isLoading ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando conteos…</div> : countedItems.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>Aún no hay artículos contados.</p></div> : <div className="inventory-list">{(countedItems as InventoryRow[]).map(item => { const expanded = expandedInventoryId === item.id; const history = (historyQuery.data as InventoryScanRow[] | undefined) || []; return <article className={`inventory-row is-counted${item.totalQuantity <= lowStockThreshold ? " is-low-stock" : ""}`} key={item.id}><div className="inventory-row-copy"><strong>{item.sku}</strong>{getGtinsForSku(item.sku, gtinMap).length ? <em>GTIN {getGtinsForSku(item.sku, gtinMap).join(" · ")}</em> : <em className="inventory-gtin-missing">GTIN no registrado</em>}<h3>{item.name}</h3><small>{item.lastTramo || "—"} · {item.lastGondola || "—"} · {item.scanCount || 0} lecturas</small></div><div className="inventory-row-actions"><b>{item.totalQuantity}</b><button type="button" className="inventory-history-toggle" aria-expanded={expanded} onClick={() => setExpandedInventoryId(expanded ? null : item.id)}>{expanded ? "Ocultar historial" : `Ver historial (${item.scanCount || 0})`}</button></div>{expanded && <div className="inventory-history" aria-live="polite">{historyQuery.isLoading ? <small><LoaderCircle className="orders-spin" /> Cargando historial…</small> : history.length === 0 ? <small>No hay lecturas guardadas.</small> : history.map(scan => <div className="inventory-history-item" key={scan.id}><div><strong>{scan.tramo} / {scan.gondola}</strong><small>{formatInventoryScanDate(scan.createdAt)} · {scan.countedBy}</small></div><div className="inventory-history-actions"><b>+{scan.quantity}</b><button type="button" className="inventory-delete-scan" title="Eliminar esta lectura" aria-label={`Eliminar lectura del ${formatInventoryScanDate(scan.createdAt)}`} disabled={deleteScan.isPending} onClick={() => { if (window.confirm(`¿Eliminar esta lectura de ${item.sku} (${scan.tramo} / ${scan.gondola})? Se restará ${scan.quantity} unidad${scan.quantity === 1 ? "" : "es"}.`)) deleteScan.mutate({ scanId: scan.id }); }}><Trash2 size={15} /></button></div></div>)}</div>}</article>; })}</div>}</aside>
    </section>
  </main>;
}
