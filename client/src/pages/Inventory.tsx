import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Barcode, Boxes, CheckCircle2, ChevronLeft, ChevronRight, DollarSign, Download, Eye, House, Keyboard, LoaderCircle, LogIn, LogOut, MapPin, PackageSearch, Plus, Printer, RefreshCw, ScanLine, Trash2, TrendingDown, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { buildInventoryNotice, getInventoryScanLocation, INVENTORY_SALE_CONFIRMATION_KEY, isInventoryAdmin, isInventoryItemCounted, isInventorySaleConfirmationKey } from "@shared/inventoryHelpers";
import { findInventoryCatalogProduct, type InventoryCatalogProduct } from "@shared/inventoryCatalog";
import { attachGtins, getGtinsForSku, normalizeCatalogIdentifier, productMatchesCatalogQuery, type GtinMap } from "@shared/gtinHelpers";
import { buildZebraLabelSequence, defaultZebraLabelFields, normalizeInternalLabelCode, type ZebraLabelFields } from "@shared/zebraLabel";
import { buildInventoryExportHtml, buildLowStockPurchaseRows, buildPhysicalInventoryExportHtml } from "@shared/inventoryExport";

const catalogIndexUrl = "/manus-storage/catalog-with-junta-torica-gtin-20260904_40163118.json";
const gtinMapFileUrl = "/manus-storage/diesel-gtin-map-junta-torica-20260904_b67682ec.json";
const emptyArticle = { sku: "", barcode: "", name: "", description: "", brand: "", application: "", image: "", costPrice: "0", salePrice: "0", initialQuantity: "0" };
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

function playScanTone(kind: "success" | "alert") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === "success" ? "sine" : "square";
    oscillator.frequency.value = kind === "success" ? 880 : 220;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === "success" ? 0.16 : 0.28));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === "success" ? 0.17 : 0.29));
    oscillator.addEventListener("ended", () => { void context.close(); }, { once: true });
  } catch {
    // Algunos navegadores bloquean audio hasta la primera interacción del usuario.
  }
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
  costPrice: string;
  salePrice: string;
  gtins?: string[];
  internalCode?: string | null;
  barcode?: string | null;
  totalQuantity: number;
  lastTramo?: string | null;
  lastGondola?: string | null;
  lastScanId?: number | null;
  scanCount?: number;
};

type InventoryGtinRow = { id: number; productId: string; sku: string; gtin: string; addedBy: string; createdAt: string | Date };

type InventoryScanRow = {
  id: number;
  quantity: number;
  tramo: string;
  gondola: string;
  countedBy: string;
  createdAt: string | Date;
};

type RecentIngressRow = InventoryScanRow & {
  inventoryItemId: number;
  sku: string;
  name: string;
  internalCode?: string | null;
  barcode?: string | null;
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
  const [entryMode, setEntryMode] = useState<"scan" | "manual">("scan");
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
  const [locationWarning, setLocationWarning] = useState("");
  const [pendingLocationProduct, setPendingLocationProduct] = useState<InventoryCatalogProduct | null>(null);
  const [error, setError] = useState("");
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [showRecentIngress, setShowRecentIngress] = useState(false);
  const [newArticle, setNewArticle] = useState<NewArticleForm>(emptyArticle);
  const [newArticleError, setNewArticleError] = useState("");
  const [newArticleImagePreview, setNewArticleImagePreview] = useState("");
  const [newArticleImageFile, setNewArticleImageFile] = useState<File | null>(null);
  const [saleCode, setSaleCode] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleNotice, setSaleNotice] = useState("");
  const [saleError, setSaleError] = useState("");
  const [saleConfirmSku, setSaleConfirmSku] = useState<string | null>(null);
  const [saleConfirmKey, setSaleConfirmKey] = useState("");
  const [saleConfirmError, setSaleConfirmError] = useState("");
  const [newGtin, setNewGtin] = useState("");
  const [gtinError, setGtinError] = useState("");
  const [deleteArticleProduct, setDeleteArticleProduct] = useState<InventoryCatalogProduct | null>(null);
  const [deleteArticleConfirmation, setDeleteArticleConfirmation] = useState("");
  const [deleteArticleError, setDeleteArticleError] = useState("");
  const [reportMonth, setReportMonth] = useState(() => new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [labelStartCode, setLabelStartCode] = useState(() => { if (typeof window === "undefined") return "00001"; return String(Number(window.localStorage.getItem("eurotruck-label-counter") || "1")).padStart(5, "0"); });
  const [labelQuantity, setLabelQuantity] = useState("1");
  const [labelFields, setLabelFields] = useState<ZebraLabelFields>(defaultZebraLabelFields);
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const inputRef = useRef<HTMLInputElement>(null);
  const gtinInputRef = useRef<HTMLInputElement>(null);
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, { enabled: isAdmin1, retry: false });
  const gtinAliasesQuery = trpc.inventory.gtins.useQuery(undefined, { enabled: isAdmin1, retry: false });
  const historyInput = useMemo(() => ({ inventoryItemId: expandedInventoryId ?? 1 }), [expandedInventoryId]);
  const historyQuery = trpc.inventory.history.useQuery(historyInput, { enabled: isAdmin1 && expandedInventoryId !== null, retry: false });
  const recentIngressQuery = trpc.inventory.recentIngress.useQuery({ limit: 50 }, { enabled: isAdmin1, retry: false });
  const topSoldInput = useMemo(() => ({ month: reportMonth, year: reportYear }), [reportMonth, reportYear]);
  const topSoldQuery = trpc.inventory.topSold.useQuery(topSoldInput, { enabled: isAdmin1, retry: false });
  const localLogout = trpc.auth.localLogout.useMutation({ onSuccess: async () => { await logout(); window.location.href = "/"; } });
  const recordCount = trpc.inventory.record.useMutation({ onSuccess: result => { playScanTone("success"); setNotice(buildInventoryNotice(result.wasAlreadyCounted, Number(quantity), result.totalQuantity)); setLastScanTotal(result.totalQuantity); setScanCode(""); setQuantity("1"); void Promise.all([inventoryQuery.refetch(), recentIngressQuery.refetch()]); if (expandedInventoryId === result.id) void historyQuery.refetch(); inputRef.current?.focus(); }, onError: mutationError => { playScanTone("alert"); setLastScanTotal(null); setError(mutationError.message || "No se pudo guardar el conteo."); } });
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
  const gtinAliasMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of (gtinAliasesQuery.data as InventoryGtinRow[] | undefined) || []) {
      const key = normalizeCatalogIdentifier(row.sku);
      map.set(key, Array.from(new Set([...(map.get(key) || []), row.gtin])));
    }
    return map;
  }, [gtinAliasesQuery.data]);
  const getInventoryGtins = (sku: string, productGtins?: string[]) => Array.from(new Set([...(productGtins || []), ...getGtinsForSku(sku, gtinMap), ...(gtinAliasMap.get(normalizeCatalogIdentifier(sku)) || [])]));
  const uploadImage = trpc.inventory.uploadImage.useMutation();
  const createArticle = trpc.inventory.create.useMutation({
    onSuccess: created => {
      const createdProduct: InventoryCatalogProduct = { id: String(created.productId), sku: created.sku, name: created.name, description: created.description ?? undefined, brand: created.brand ?? undefined, application: created.application ?? undefined, image: created.image ?? undefined, internalCode: created.internalCode, barcode: created.barcode };
      setCustomProducts(current => [...current.filter(item => item.id !== createdProduct.id), createdProduct]);
      setSelectedProduct(createdProduct);
      setLastScanAutoRecorded(false);
      setLastScanTotal(null);
      setScanCode(createdProduct.sku);
      setShowNewArticle(false);
      setNewArticle(emptyArticle);
      setNewArticleImageFile(null);
      setNewArticleImagePreview("");
      setNewArticleError("");
      setNotice("Artículo nuevo agregado. Registra ahora su cantidad, tramo y góndola.");
      setError("");
      void Promise.all([inventoryQuery.refetch(), recentIngressQuery.refetch()]);
    },
    onError: mutationError => setNewArticleError(mutationError.message || "No se pudo agregar el artículo."),
  });
  const confirmProtectedSale = () => {
    if (!saleConfirmSku) return;
    if (!isInventorySaleConfirmationKey(saleConfirmKey)) {
      setSaleConfirmError("Clave incorrecta. La salida no fue registrada.");
      return;
    }
    const requestedQuantity = Number(saleQuantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      setSaleConfirmError("Indica una cantidad válida mayor que cero.");
      return;
    }
    recordSale.mutate({ sku: saleConfirmSku, quantity: requestedQuantity, confirmationKey: saleConfirmKey, source: "manual" });
    setSaleConfirmSku(null);
    setSaleConfirmKey("");
    setSaleConfirmError("");
  };
  const deleteArticle = trpc.inventory.deleteArticle.useMutation({
    onSuccess: async result => {
      setDeleteArticleProduct(null);
      setDeleteArticleConfirmation("");
      setDeleteArticleError("");
      setSelectedProduct(null);
      setNotice(`Artículo ${result.sku} retirado del catálogo de Inventario. El historial de salidas se conserva.`);
      await inventoryQuery.refetch();
    },
    onError: mutationError => setDeleteArticleError(mutationError.message || "No se pudo retirar el artículo."),
  });
  const addGtin = trpc.inventory.addGtin.useMutation({
    onSuccess: result => {
      setNewGtin("");
      setGtinError("");
      setSelectedProduct(current => current ? { ...current, gtins: getInventoryGtins(current.sku, [...(current.gtins || []), result.gtin]) } : current);
      setNotice(`GTIN ${result.gtin} agregado a ${result.sku}. Ahora podrá encontrarse al escanearlo.`);
      void gtinAliasesQuery.refetch();
    },
    onError: mutationError => setGtinError(mutationError.message || "No se pudo agregar el GTIN."),
  });
  const updatePricing = trpc.inventory.updatePricing.useMutation({
    onSuccess: async result => {
      setCostPrice(String(result.costPrice));
      setSalePrice(String(result.salePrice));
      setNotice(`Precios guardados para ${result.sku}. Costo: RD$ ${Number(result.costPrice).toLocaleString("es-DO", { minimumFractionDigits: 2 })} · Venta: RD$ ${Number(result.salePrice).toLocaleString("es-DO", { minimumFractionDigits: 2 })}.`);
      setError("");
      await inventoryQuery.refetch();
    },
    onError: mutationError => setError(mutationError.message || "No se pudieron guardar los precios."),
  });

  const loadCatalogForSearch = async () => catalogProducts;

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
  const countedGroups = useMemo(() => {
    const groups = new Map<string, { tramo: string; gondola: string; items: InventoryRow[] }>();
    for (const item of countedItems as InventoryRow[]) {
      const tramo = item.lastTramo || "SIN TRAMO";
      const gondola = item.lastGondola || "SIN GÓNDOLA";
      const key = `${tramo}::${gondola}`;
      const group = groups.get(key) || { tramo, gondola, items: [] };
      group.items.push(item);
      groups.set(key, group);
    }
    return Array.from(groups.values()).sort((left, right) => `${left.tramo} ${left.gondola}`.localeCompare(`${right.tramo} ${right.gondola}`, "es"));
  }, [countedItems]);
  const countedByProduct = useMemo(() => new Map(countedItems.map(item => [item.productId, item])), [countedItems]);
  const inventoryByProduct = useMemo(() => new Map((inventoryQuery.data || []).map(item => [item.productId, item])), [inventoryQuery.data]);
  const selectedInventory = selectedProduct ? inventoryByProduct.get(selectedProduct.id) : undefined;
  const pendingInventory = pendingLocationProduct ? inventoryByProduct.get(pendingLocationProduct.id) : undefined;
  const persistedInventoryProducts = useMemo(() => (inventoryQuery.data || []).filter(item => !catalogProducts.some(product => product.id === item.productId) && !customProducts.some(product => product.id === item.productId)).map(item => ({ id: item.productId, sku: item.sku, name: item.name, description: item.description ?? undefined, brand: item.brand ?? undefined, application: item.application ?? undefined, image: item.image ?? undefined, internalCode: item.internalCode, barcode: item.barcode, gtins: getGtinsForSku(item.sku, gtinMap) } satisfies InventoryCatalogProduct)), [inventoryQuery.data, catalogProducts, customProducts, gtinMap]);
  const allProducts = useMemo(() => [...customProducts, ...persistedInventoryProducts, ...catalogProducts].map(product => ({ ...product, gtins: getInventoryGtins(product.sku, product.gtins) })), [customProducts, persistedInventoryProducts, catalogProducts, gtinMap, gtinAliasMap]);
  const catalogMatches = useMemo(() => {
    const query = catalogBrowseQuery.trim().toLowerCase();
    if (!query) return allProducts;
    return allProducts.filter(item => productMatchesCatalogQuery(item, query));
  }, [allProducts, catalogBrowseQuery]);
  const catalogPageCount = Math.max(1, Math.ceil(catalogMatches.length / catalogPageSize));
  const visibleCatalogProducts = catalogMatches.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize);

  useEffect(() => { setCatalogPage(1); }, [catalogBrowseQuery]);
  useEffect(() => { if (catalogPage > catalogPageCount) setCatalogPage(catalogPageCount); }, [catalogPage, catalogPageCount]);

  useEffect(() => {
    setNewGtin("");
    setGtinError("");
    setCostPrice(String(selectedInventory?.costPrice ?? "0"));
    setSalePrice(String(selectedInventory?.salePrice ?? "0"));
    if (selectedProduct?.internalCode) setLabelStartCode(selectedProduct.internalCode);
  }, [selectedProduct?.id, selectedProduct?.internalCode, selectedInventory?.costPrice, selectedInventory?.salePrice]);

  const findProduct = async (code: string, autoRecord = true) => {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return;
    setCatalogLoading(true); setError(""); setNotice("");
    try {
      const localProduct = findInventoryCatalogProduct(allProducts, normalized);
      const searchable = localProduct?.id.startsWith("custom-") ? [] : await loadCatalogForSearch();
      const product = localProduct || findInventoryCatalogProduct(searchable, normalized);
      if (!product) { const unknownCode = code.trim(); playScanTone("alert"); const isBarcode = /^\d{6,14}$/.test(unknownCode); setSelectedProduct(null); setError(""); setNewArticle({ ...emptyArticle, sku: isBarcode ? "" : unknownCode, barcode: isBarcode ? unknownCode : "" }); setNewArticleImageFile(null); setNewArticleImagePreview(""); setNewArticleError(`Código no encontrado: ${unknownCode}. Completa los datos para agregarlo al catálogo.`); setShowNewArticle(true); return; }
      setSelectedProduct(product);
      const existing = inventoryByProduct.get(product.id);
      const location = getInventoryScanLocation(tramo, gondola);
      const isDifferentLocation = Boolean(existing?.totalQuantity && (existing.lastTramo !== location.tramo || existing.lastGondola !== location.gondola));
      const warningText = isDifferentLocation ? `Atención: ${product.sku} ya tiene ${existing?.totalQuantity} unidad${existing?.totalQuantity === 1 ? "" : "es"} en ${existing?.lastTramo || "—"} / ${existing?.lastGondola || "—"}. Esta nueva entrada quedará en ${location.tramo} / ${location.gondola}.` : "";
      setLocationWarning(warningText);
      setLastScanTotal(null);
      if (isDifferentLocation && autoRecord) {
        setPendingLocationProduct(product);
        setLastScanAutoRecorded(false);
        return;
      }
      setPendingLocationProduct(null);
      setLastScanAutoRecorded(autoRecord);
      if (autoRecord) recordCount.mutate({ productId: product.id, sku: product.sku, name: product.name, description: product.description, brand: product.brand, application: product.application, image: product.image, internalCode: product.internalCode || undefined, barcode: product.barcode || product.gtins?.[0] || undefined, quantity: 1, tramo: location.tramo, gondola: location.gondola });
    } catch {
      setSelectedProduct(null); setError("No fue posible cargar el catálogo para escanear artículos.");
    } finally { setCatalogLoading(false); }
  };

  const selectProduct = async (product: InventoryCatalogProduct) => {
    setSelectedProduct(null); setLastScanAutoRecorded(false); setLastScanTotal(null); setScanCode(product.sku); setError(""); setNotice(""); setCatalogLoading(true);
    try {
      const fullProduct = product.image ? product : findInventoryCatalogProduct(await loadCatalogForSearch(), product.sku) || product;
      setSelectedProduct(fullProduct);
    } catch { setSelectedProduct(product); setError("No fue posible cargar el detalle completo; puedes continuar con el conteo."); }
    finally { setCatalogLoading(false); }
  };
  const submitScan = (event: FormEvent) => { event.preventDefault(); void findProduct(scanCode, entryMode === "scan"); };
  const confirmPendingLocation = () => {
    if (!pendingLocationProduct) return;
    const product = pendingLocationProduct;
    const location = getInventoryScanLocation(tramo, gondola);
    setPendingLocationProduct(null);
    setLocationWarning("");
    setLastScanAutoRecorded(true);
    recordCount.mutate({ productId: product.id, sku: product.sku, name: product.name, description: product.description, brand: product.brand, application: product.application, image: product.image, internalCode: product.internalCode || undefined, barcode: product.barcode || product.gtins?.[0] || undefined, quantity: 1, tramo: location.tramo, gondola: location.gondola });
  };
  const submitCount = (event: FormEvent) => { event.preventDefault(); if (!selectedProduct) return; setError(""); const location = getInventoryScanLocation(tramo, gondola); recordCount.mutate({ productId: selectedProduct.id, sku: selectedProduct.sku, name: selectedProduct.name, description: selectedProduct.description, brand: selectedProduct.brand, application: selectedProduct.application, image: selectedProduct.image, internalCode: selectedProduct.internalCode || undefined, barcode: selectedProduct.barcode || selectedProduct.gtins?.[0] || undefined, quantity: Number(quantity), tramo: location.tramo, gondola: location.gondola }); };
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
  const submitNewArticle = async (event: FormEvent) => { event.preventDefault(); setNewArticleError(""); const location = getInventoryScanLocation(tramo, gondola); try { let imageUrl = newArticle.image.trim() || undefined; if (newArticleImageFile) { const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("No se pudo leer la foto")); reader.readAsDataURL(newArticleImageFile); }); const uploaded = await uploadImage.mutateAsync({ fileName: newArticleImageFile.name, contentType: newArticleImageFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", dataBase64: dataUrl }); imageUrl = uploaded.url; } createArticle.mutate({ sku: newArticle.sku.trim(), barcode: newArticle.barcode.trim() || undefined, name: newArticle.name.trim(), description: newArticle.description.trim() || undefined, brand: newArticle.brand.trim() || undefined, application: newArticle.application.trim() || undefined, image: imageUrl, costPrice: Number(newArticle.costPrice || 0), salePrice: Number(newArticle.salePrice || 0), initialQuantity: Number(newArticle.initialQuantity || 0), tramo: location.tramo, gondola: location.gondola }); } catch (uploadError) { setNewArticleError(uploadError instanceof Error ? uploadError.message : "No se pudo cargar la foto."); } };
  const submitGtin = () => {
    if (!selectedProduct) return;
    const normalized = newGtin.replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(normalized)) {
      setGtinError("Escribe un GTIN válido de 8 a 14 dígitos.");
      return;
    }
    const conflictingProduct = allProducts.find(product => product.id !== selectedProduct.id && getInventoryGtins(product.sku, product.gtins).includes(normalized));
    if (conflictingProduct) {
      setGtinError(`Ese GTIN ya está asociado a ${conflictingProduct.sku}.`);
      return;
    }
    setGtinError("");
    addGtin.mutate({ productId: selectedProduct.id, sku: selectedProduct.sku, gtin: normalized });
  };
  const savePricing = () => {
    if (!selectedProduct) return;
    const parsedCost = Number(costPrice || 0);
    const parsedSale = Number(salePrice || 0);
    if (!Number.isFinite(parsedCost) || !Number.isFinite(parsedSale) || parsedCost < 0 || parsedSale < 0) { setError("Indica valores válidos para costo y precio de venta."); return; }
    updatePricing.mutate({ productId: selectedProduct.id, sku: selectedProduct.sku, name: selectedProduct.name, description: selectedProduct.description, brand: selectedProduct.brand, application: selectedProduct.application, image: selectedProduct.image, costPrice: parsedCost, salePrice: parsedSale });
  };
  const submitSale = (event: FormEvent) => { event.preventDefault(); setSaleError(""); setSaleNotice(""); const parsedQuantity = Number(saleQuantity); if (!saleCode.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) { setSaleError("Indica un SKU, código Zebra o barcode y una cantidad válida."); return; } const matched = findInventoryCatalogProduct(allProducts, saleCode.trim()); recordSale.mutate({ sku: matched?.sku || saleCode.trim(), quantity: parsedQuantity, confirmationKey: INVENTORY_SALE_CONFIRMATION_KEY, source: "scan" }); };
  const printTopSoldReport = () => { window.print(); };
  const downloadLowStockExcel = () => {
    const rows = buildLowStockPurchaseRows(lowStockInventoryItems.map(item => ({ ...item, gtins: getInventoryGtins(item.sku) })), lowStockThreshold);
    const headers = ["SKU / DT Spare Parts", "Artículo", "Existencia actual", "Mínimo operativo", "Unidades a comprar", "Tramo", "Góndola", "Costo", "Precio final", "Código Zebra", "Barcode", "GTIN"];
    const table = buildInventoryExportHtml(headers, rows);
    const blob = new Blob(["\\ufeff", table], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `eurotruck-compras-bajo-stock-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const downloadCountedInventoryExcel = () => {
    const rows = countedItems.map(item => {
      const product = allProducts.find(candidate => candidate.id === item.productId);
      return {
        warehouse: "01",
        productNumber: item.sku,
        description: item.name,
        counter: item.countedBy || "admin1",
        unitQuantity: item.totalQuantity,
        reference: product?.internalCode || item.internalCode || "",
        shelf: item.lastGondola || "",
        tramo: item.lastTramo || "",
        cost: item.costPrice || "0.00",
        price: item.salePrice || "0.00",
      };
    });
    const table = buildPhysicalInventoryExportHtml(rows);
    const blob = new Blob(["\\ufeff", table], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `EUROTRUCK_Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const downloadInventoryExcel = () => {
    const rows = allProducts.map(product => {
      const counted = countedByProduct.get(product.id);
      const gtins = getInventoryGtins(product.sku, product.gtins).join(" · ");
      return [product.internalCode || "", product.barcode || "", product.sku, gtins, product.name, product.description, product.brand, product.application, counted?.totalQuantity ?? 0, counted?.lastTramo || "", counted?.lastGondola || "", counted?.scanCount ?? 0, counted?.costPrice || "0.00", counted?.salePrice || "0.00", product.image || "", ("url" in product ? product.url : "") || ""];
    });
    const headers = ["Código interno Zebra", "Código de barras", "SKU / referencia", "GTIN", "Nombre", "Descripción", "Marca", "Aplicación", "Existencia", "Tramo", "Góndola", "Lecturas", "Costo", "Precio final", "Imagen", "Fuente"];
    const table = buildInventoryExportHtml(headers, rows);
    const blob = new Blob(["\\ufeff", table], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inventario-eurotruck-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const printActiveInventoryArea = () => {
    const activeItems = (inventoryQuery.data || []).filter(item => (item.lastTramo || "GENERAL") === tramo && (item.lastGondola || "GENERAL") === gondola);
    const rows = activeItems.map(item => ({
      warehouse: "01",
      productNumber: item.sku,
      description: item.name,
      counter: item.countedBy || "admin1",
      unitQuantity: item.totalQuantity,
      reference: item.internalCode || allProducts.find(product => product.id === item.productId)?.internalCode || "",
      shelf: item.lastGondola || gondola,
      tramo: item.lastTramo || tramo,
      cost: item.costPrice || "0.00",
      price: item.salePrice || "0.00",
    }));
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      setError("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo nuevamente.");
      return;
    }
    printWindow.document.write(buildPhysicalInventoryExportHtml(rows, new Date(), { tramo, gondola }));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  };

  const downloadZebraLabels = () => {
    if (!selectedProduct) return;
    const quantityToPrint = Number(labelQuantity);
    const zpl = buildZebraLabelSequence(labelStartCode, quantityToPrint, selectedProduct.sku, selectedProduct.name, labelFields);
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

  const totalUnits = countedItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  const lowStockInventoryItems = (inventoryQuery.data || []).filter(item => item.totalQuantity <= lowStockThreshold);
  const lowStockItems = lowStockInventoryItems.length;

  return <main className="inventory-page inventory-page--redesigned inventory-first-stage">
    <header className="inventory-header"><div><span className="orders-eyebrow">EUROTRUCK / ALMACÉN</span><h1>Inventario fácil</h1><p>Escanea para sumar una unidad automáticamente o cambia a entrada manual. La ubicación activa se aplica a cada registro.</p></div><div className="inventory-header-actions"><a className="orders-button orders-button--ghost" href="/"><House size={15} />Página principal</a><a className="orders-button orders-button--ghost" href="/orders">Cotizaciones</a><button className="orders-button orders-button--ghost" onClick={() => { setCatalogLoading(true); void fetch(catalogIndexUrl).then(response => response.json() as Promise<InventoryCatalogProduct[]>).then(items => setCatalogProducts(items.map(item => attachGtins(item, gtinMap)))).finally(() => setCatalogLoading(false)); void inventoryQuery.refetch(); }}><RefreshCw size={15} />Actualizar</button><button className="orders-button orders-button--ghost" onClick={() => localLogout.mutate()} disabled={localLogout.isPending}><LogOut size={15} />{localLogout.isPending ? "Saliendo…" : "Salir"}</button></div></header>
    <section className="inventory-kpis" aria-label="Resumen de inventario"><button type="button" className={`inventory-kpi-button${countedItems.length === 0 ? " is-disabled" : ""}`} onClick={downloadCountedInventoryExcel} disabled={countedItems.length === 0} aria-label="Descargar reporte de artículos contados"><Boxes size={22} /><span><small>Artículos contados</small><strong>{countedItems.length.toLocaleString("es-DO")}</strong><em>Descargar inventario</em></span><Download size={15} /></button><article><Barcode size={22} /><span><small>Unidades en almacén</small><strong>{totalUnits.toLocaleString("es-DO")}</strong></span></article><button type="button" className={`inventory-kpi-button${lowStockItems ? " is-warning" : ""}`} onClick={downloadLowStockExcel} disabled={!lowStockItems} aria-label="Descargar Excel de artículos bajo stock"><AlertTriangle size={22} /><span><small>Bajo stock</small><strong>{lowStockItems}</strong><em>Descargar compras</em></span><Download size={15} /></button><article><MapPin size={22} /><span><small>Área activa</small><strong>{tramo} / {gondola}</strong></span></article></section>
    <section className="inventory-workspace">
      <div className="inventory-scan-panel">
        <div className="inventory-scan-location"><div><span className="orders-eyebrow">01 / ÁREA DE CONTEO</span><strong>Ubicación activa</strong><small>Selecciona o agrega el tramo y la góndola antes de escanear. Cada lectura se guardará automáticamente en esta área hasta que la cambies.</small><div className="inventory-location-picker"><select value={activeLocationId} onChange={event => selectLocation(event.target.value)} aria-label="Seleccionar ubicación activa">{savedLocations.map(location => <option key={location.id} value={location.id}>{location.tramo} / {location.gondola}</option>)}</select><button type="button" className="inventory-location-delete" disabled={activeLocationId === defaultInventoryLocation.id} onClick={() => { if (window.confirm("¿Eliminar esta área guardada? Las lecturas existentes conservarán su ubicación histórica.")) removeLocation(activeLocationId); }}><Trash2 size={14} />Eliminar área</button></div><button type="button" className="inventory-location-add" onClick={() => setShowLocationForm(current => !current)}><Plus size={13} />{showLocationForm ? "Cerrar alta de área" : "Agregar otra área"}</button><button type="button" className="inventory-location-print" onClick={printActiveInventoryArea}><Printer size={14} />Imprimir área activa</button></div><div className="inventory-scan-location-fields"><label>Tramo<input value={tramo} readOnly aria-readonly="true" /></label><label>Góndola<input value={gondola} readOnly aria-readonly="true" /></label></div>{showLocationForm && <form className="inventory-location-form" onSubmit={submitNewLocation}><label>Nuevo tramo<input required value={newLocationTramo} onChange={event => setNewLocationTramo(event.target.value)} placeholder="Ej. T-03" /></label><label>Nueva góndola<input required value={newLocationGondola} onChange={event => setNewLocationGondola(event.target.value)} placeholder="Ej. G-12" /></label><button type="submit" className="orders-button orders-button--inventory"><Plus size={14} />Guardar y activar</button></form>}</div>
        <div className="inventory-panel-heading"><div><span className="orders-eyebrow">02 / ENTRADA</span><h2>Registrar artículos</h2></div><div className="inventory-panel-heading-actions"><button type="button" className="inventory-history-trigger" onClick={() => setShowRecentIngress(true)}><RefreshCw size={16} />Últimos ingresos</button><Barcode size={30} /></div></div>
        <div className="inventory-mode-switch" role="tablist" aria-label="Modo de entrada"><button type="button" className={entryMode === "scan" ? "is-active" : ""} onClick={() => { setEntryMode("scan"); setLastScanAutoRecorded(false); }}><ScanLine size={17} /><span><b>Escaneo automático</b><small>Cada lectura suma +1</small></span></button><button type="button" className={entryMode === "manual" ? "is-active" : ""} onClick={() => { setEntryMode("manual"); setLastScanAutoRecorded(false); }}><Keyboard size={17} /><span><b>Entrada manual</b><small>Busca y escribe la cantidad</small></span></button></div>
        <form className="inventory-scan-form" onSubmit={submitScan}><label htmlFor="inventory-scan">Referencia, SKU o GTIN</label><div><ScanLine size={18} /><input ref={inputRef} id="inventory-scan" autoFocus value={scanCode} onChange={event => setScanCode(event.target.value)} placeholder={catalogLoading ? "Cargando catálogo…" : entryMode === "scan" ? "Escanea y pulsa Enter: suma +1 automáticamente" : "Escribe o escanea para abrir el artículo…"} disabled={catalogLoading || recordCount.isPending} />{entryMode === "manual" && <button className="orders-button" type="submit" disabled={catalogLoading || recordCount.isPending || !scanCode.trim()}><PackageSearch size={15} />Abrir artículo</button>}</div></form>
        <div className="inventory-recent-summary"><div><span className="orders-eyebrow">03 / HISTORIAL</span><strong>Últimos ingresos</strong><small>Consulta las lecturas recientes en una ventana independiente sin salir del área de entrada.</small></div><button type="button" className="inventory-history-trigger" onClick={() => setShowRecentIngress(true)}><Eye size={16} />Ver historial</button></div>
        {showRecentIngress && <div className="inventory-history-dialog" role="dialog" aria-modal="true" aria-labelledby="recent-ingress-dialog-title" onMouseDown={event => { if (event.target === event.currentTarget) setShowRecentIngress(false); }}><div className="inventory-history-dialog-card"><div className="inventory-history-dialog-header"><div><span className="orders-eyebrow">03 / HISTORIAL DE ENTRADAS</span><h2 id="recent-ingress-dialog-title">Últimos ingresos</h2><p>Las lecturas más recientes aparecen con fecha, ubicación y usuario responsable.</p></div><div className="inventory-history-dialog-actions"><button type="button" className="inventory-history-refresh" onClick={() => void recentIngressQuery.refetch()} aria-label="Actualizar últimos ingresos"><RefreshCw size={17} /></button><button type="button" className="inventory-history-close" onClick={() => setShowRecentIngress(false)} aria-label="Cerrar últimos ingresos"><X size={18} /></button></div></div>{recentIngressQuery.isLoading ? <div className="inventory-empty">Cargando ingresos…</div> : recentIngressQuery.data?.length ? <div className="inventory-recent-table-wrap"><table className="inventory-recent-table"><thead><tr><th>Fecha y hora</th><th>SKU</th><th>Artículo</th><th>Código Zebra</th><th>Cantidad</th><th>Ubicación</th><th>Usuario</th></tr></thead><tbody>{(recentIngressQuery.data as RecentIngressRow[]).map(row => <tr key={row.id}><td>{formatInventoryScanDate(row.createdAt)}</td><td><strong>{row.sku}</strong></td><td>{row.name}</td><td>{row.internalCode || "—"}</td><td className="inventory-recent-quantity">+{row.quantity}</td><td>{row.tramo} / {row.gondola}</td><td>{row.countedBy}</td></tr>)}</tbody></table></div> : <div className="inventory-empty"><PackageSearch size={24} /><p>Aún no hay ingresos registrados.</p></div>}<div className="inventory-history-dialog-footer"><span>{recentIngressQuery.data?.length || 0} lecturas mostradas</span><button type="button" className="orders-button orders-button--ghost" onClick={() => setShowRecentIngress(false)}>Cerrar</button></div></div></div>}
        {pendingLocationProduct && <div className="inventory-location-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-location-dialog-title"><div className="inventory-location-dialog-card"><div className="inventory-location-dialog-icon"><AlertTriangle size={30} /></div><span className="orders-eyebrow">ATENCIÓN DE UBICACIÓN</span><h2 id="inventory-location-dialog-title">Artículo en otra ubicación</h2><p>{locationWarning}</p><div className="inventory-location-comparison"><div><small>Ubicación anterior</small><strong>{pendingInventory?.lastTramo || "—"} / {pendingInventory?.lastGondola || "—"}</strong></div><div><small>Ubicación activa</small><strong>{tramo} / {gondola}</strong></div></div><p className="inventory-location-dialog-hint">Mueve o confirma el artículo en el área activa. Después pulsa <strong>Aceptar y continuar</strong> para registrar la nueva lectura.</p><div className="inventory-location-dialog-actions"><button type="button" className="orders-button orders-button--ghost" onClick={() => { setPendingLocationProduct(null); setLocationWarning(""); setScanCode(""); inputRef.current?.focus(); }}>Cancelar</button><button type="button" className="orders-button inventory-location-confirm" onClick={confirmPendingLocation}><CheckCircle2 size={18} />Aceptar y continuar</button></div></div></div>}
        <section className="inventory-sale-panel" aria-labelledby="inventory-sale-title"><div className="inventory-subpanel-heading"><div><span className="orders-eyebrow">SALIDA POR VENTA</span><h3 id="inventory-sale-title">Descontar del inventario</h3></div><TrendingDown size={22} /></div><p>Escanea o escribe el SKU después de vender una pieza. Solo admin1 puede registrar la salida.</p><form className="inventory-sale-form" onSubmit={submitSale}><label>SKU, código Zebra o barcode<input value={saleCode} onChange={event => setSaleCode(event.target.value)} placeholder="Ej. 1.00739" /></label><label>Cantidad<input type="number" min="1" max="9999" value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} /></label><button className="orders-button orders-button--inventory" type="submit" disabled={recordSale.isPending || !saleCode.trim()}><TrendingDown size={15} />{recordSale.isPending ? "Descontando…" : "Registrar salida"}</button></form>{saleError && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{saleError}</div>}{saleNotice && <div className="inventory-alert inventory-alert--success" role="status"><CheckCircle2 size={16} />{saleNotice}</div>}</section>
        <div className="inventory-catalog-toolbar"><div><strong>Catálogo completo</strong><small>{catalogLoading ? "Cargando referencias…" : `${allProducts.length.toLocaleString("es-DO")} artículos disponibles · ${Object.keys(gtinMap).length.toLocaleString("es-DO")} con GTIN`}</small></div><div className="inventory-catalog-toolbar-actions"><button type="button" className="orders-button orders-button--ghost inventory-export-button" onClick={downloadInventoryExcel} disabled={catalogLoading || allProducts.length === 0}><Download size={15} />Descargar Excel</button><button type="button" className="orders-button orders-button--inventory" onClick={() => { setShowNewArticle(true); setNewArticleError(""); }}><Plus size={15} />Agregar nuevo</button></div></div>
        <label className="inventory-catalog-filter">Filtrar artículos<input value={catalogBrowseQuery} onChange={event => setCatalogBrowseQuery(event.target.value)} placeholder="Referencia, GTIN, descripción, marca o aplicación" /></label>
        {error && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={16} />{error}</div>}{notice && <div className="inventory-alert inventory-alert--success" role="status"><CheckCircle2 size={16} />{notice}</div>}
        <div className="inventory-catalog-list" aria-live="polite">{catalogLoading && catalogProducts.length === 0 ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando todos los artículos…</div> : visibleCatalogProducts.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>No hay artículos que coincidan con ese filtro.</p></div> : visibleCatalogProducts.map(product => { const counted = countedByProduct.get(product.id); const lowStock = Boolean(counted && counted.totalQuantity <= lowStockThreshold); return <div className="inventory-catalog-row-wrap" key={product.id}><button type="button" className={`inventory-catalog-row${counted ? " is-counted" : ""}${lowStock ? " is-low-stock" : ""}`} onClick={() => selectProduct(product)}><span className="inventory-catalog-thumb">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <Boxes size={18} />}</span><span className="inventory-catalog-copy"><strong>{product.sku}</strong>{product.internalCode && <em className="inventory-internal-code">Zebra {product.internalCode}</em>}{product.barcode && <em className="inventory-barcode">Barras {product.barcode}</em>}{product.gtins?.length ? <em>GTIN {product.gtins.join(" · ")}</em> : <em className="inventory-gtin-missing">GTIN no registrado</em>}<small className="inventory-catalog-location"><MapPin size={12} />{counted ? `Última ubicación: ${counted.lastTramo || "—"} / ${counted.lastGondola || "—"}` : "Ubicación pendiente"}</small><b>{product.name}</b><small>{product.brand || "—"} · {product.application || "Aplicación general"}</small></span><span className={`inventory-catalog-status${lowStock ? " is-low-stock" : ""}`}>{counted ? lowStock ? <><AlertTriangle size={15} />Bajo stock · {counted.totalQuantity}</> : <><CheckCircle2 size={15} />Contado · {counted.totalQuantity}</> : "Pendiente"}</span></button><button type="button" className="inventory-catalog-sale-button" onClick={() => { setSaleCode(product.sku); setSaleQuantity("1"); setSaleConfirmSku(product.sku); setSaleConfirmKey(""); setSaleConfirmError(""); }} aria-label={`Eliminar ${product.sku} del inventario`}>Eliminar</button></div>; })}</div>
        <div className="inventory-pagination"><small>Mostrando {catalogMatches.length ? (catalogPage - 1) * catalogPageSize + 1 : 0}–{Math.min(catalogPage * catalogPageSize, catalogMatches.length)} de {catalogMatches.length.toLocaleString("es-DO")}</small><div><button type="button" className="orders-button orders-button--ghost" disabled={catalogPage <= 1} onClick={() => setCatalogPage(page => page - 1)}><ChevronLeft size={15} />Anterior</button><span>Página {catalogPage} / {catalogPageCount}</span><button type="button" className="orders-button orders-button--ghost" disabled={catalogPage >= catalogPageCount} onClick={() => setCatalogPage(page => page + 1)}>Siguiente<ChevronRight size={15} /></button></div></div>
        {selectedProduct && <form className="inventory-product-card inventory-product-card--detail" onSubmit={submitCount}>
          <div className="inventory-product-main inventory-product-main--detail">
            <a className="inventory-product-image-link" href={selectedProduct.image || undefined} target="_blank" rel="noreferrer" aria-label={`Abrir imagen de ${selectedProduct.name}`}>{selectedProduct.image ? <img src={selectedProduct.image} alt={`${selectedProduct.name} ${selectedProduct.sku}`} /> : <div className="inventory-product-placeholder"><Boxes size={34} /></div>}<span><Eye size={15} />Ver imagen grande</span></a>
            <div className="inventory-product-copy"><span className="inventory-product-sku">SKU {selectedProduct.sku}</span>{selectedProduct.internalCode && <em className="inventory-internal-code">Código interno Zebra {selectedProduct.internalCode}</em>}{selectedProduct.barcode && <em className="inventory-barcode">Código externo {selectedProduct.barcode}</em>}{selectedProduct.gtins?.length ? <em>GTIN {selectedProduct.gtins.join(" · ")}</em> : <em className="inventory-gtin-missing">GTIN no registrado</em>}<h3>{selectedProduct.name}</h3><small>{selectedProduct.brand || "—"} · {selectedProduct.application || "Aplicación general"}</small><p className="inventory-product-description">{selectedProduct.description || "Descripción no disponible."}</p><div className="inventory-product-stock"><span><small>Existencia</small><strong>{selectedInventory?.totalQuantity ?? 0}</strong></span><span><small>Ubicación actual</small><strong>{selectedInventory?.lastTramo || tramo} / {selectedInventory?.lastGondola || gondola}</strong></span></div><div className="inventory-detail-actions"><button type="button" className="inventory-gtin-quick-action" onClick={() => { gtinInputRef.current?.focus(); gtinInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><Barcode size={17} />Agregar otro GTIN</button><button type="button" className="inventory-article-delete-button" onClick={() => { setDeleteArticleProduct(selectedProduct); setDeleteArticleConfirmation(""); setDeleteArticleError(""); }}><Trash2 size={16} />Eliminar artículo completo</button></div></div>
          </div>
          <section className="inventory-gtin-panel" aria-labelledby="inventory-gtin-title"><div className="inventory-gtin-heading"><div><span className="orders-eyebrow">IDENTIFICACIÓN</span><strong id="inventory-gtin-title">GTIN del artículo</strong><small>Conserva el GTIN viejo y agrega códigos nuevos; todos encontrarán este mismo SKU al escanear.</small></div><Barcode size={22} /></div><div className="inventory-gtin-list">{getInventoryGtins(selectedProduct.sku, selectedProduct.gtins).length ? getInventoryGtins(selectedProduct.sku, selectedProduct.gtins).map((code, index) => <span key={code} className={index === 0 ? "inventory-gtin-chip is-primary" : "inventory-gtin-chip"}>{index === 0 ? "Principal" : "Adicional"} · {code}</span>) : <span className="inventory-gtin-empty">Aún no hay GTIN registrado.</span>}</div><div className="inventory-gtin-entry"><label htmlFor="inventory-extra-gtin">Agregar GTIN antiguo o nuevo<input ref={gtinInputRef} id="inventory-extra-gtin" inputMode="numeric" maxLength={14} value={newGtin} onChange={event => setNewGtin(event.target.value.replace(/\D/g, ""))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); submitGtin(); } }} placeholder="Escanea o escribe 8–14 dígitos" /></label><button type="button" className="orders-button orders-button--inventory" onClick={submitGtin} disabled={addGtin.isPending || !newGtin.trim()}>{addGtin.isPending ? "Guardando…" : "Guardar GTIN"}</button></div>{gtinError && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={15} />{gtinError}</div>}</section>
          <section className="inventory-pricing-panel" aria-label="Costo y precio de venta"><div><DollarSign size={20} /><span><strong>Costo y venta final</strong><small>Información editable únicamente por admin1.</small></span></div><div className="inventory-pricing-fields"><label>Costo RD$<input type="number" min="0" step="0.01" value={costPrice} onChange={event => setCostPrice(event.target.value)} /></label><label>Venta final RD$<input type="number" min="0" step="0.01" value={salePrice} onChange={event => setSalePrice(event.target.value)} /></label><button type="button" className="orders-button orders-button--inventory" onClick={savePricing} disabled={updatePricing.isPending}>{updatePricing.isPending ? "Guardando…" : "Guardar precios"}</button></div></section>
          <section className="inventory-label-panel" aria-labelledby="zebra-label-title"><div className="inventory-label-heading"><div><span className="orders-eyebrow">IMPRESIÓN</span><strong id="zebra-label-title">Etiqueta Zebra LP2824 Plus</strong><small>Activa o quita los datos y revisa exactamente cómo quedará antes de descargar el ZPL.</small></div><Printer size={23} /></div><div className="inventory-label-config"><div className="inventory-label-fields"><label>Inicio<input value={labelStartCode} onChange={event => setLabelStartCode(event.target.value.replace(/\D/g, "").slice(-12))} inputMode="numeric" minLength={5} /></label><label>Cantidad<input type="number" min="1" max="500" value={labelQuantity} onChange={event => setLabelQuantity(event.target.value)} /></label></div><div className="inventory-label-toggles" aria-label="Datos visibles en la etiqueta"><label><input type="checkbox" checked={labelFields.internalCode} onChange={event => setLabelFields(current => ({ ...current, internalCode: event.target.checked }))} />Código interno</label><label><input type="checkbox" checked={labelFields.barcode} onChange={event => setLabelFields(current => ({ ...current, barcode: event.target.checked }))} />Código de barras</label><label><input type="checkbox" checked={labelFields.sku} onChange={event => setLabelFields(current => ({ ...current, sku: event.target.checked }))} />SKU</label><label><input type="checkbox" checked={labelFields.name} onChange={event => setLabelFields(current => ({ ...current, name: event.target.checked }))} />Nombre</label></div></div><div className="zebra-preview-wrap"><div className="zebra-preview-label" aria-label="Vista previa de etiqueta Zebra"><span className="zebra-preview-brand">EUROTRUCK · LP2824 PLUS</span>{labelFields.internalCode && <strong className="zebra-preview-code">{normalizeInternalLabelCode(labelStartCode)}</strong>}{labelFields.barcode && <span className="zebra-preview-barcode" aria-label={`Código de barras ${normalizeInternalLabelCode(labelStartCode)}`}><i /><i /><i /><i /><i /><i /><i /><i /><small>{normalizeInternalLabelCode(labelStartCode)}</small></span>}{labelFields.sku && <span className="zebra-preview-sku">SKU: {selectedProduct.sku}</span>}{labelFields.name && <span className="zebra-preview-name">{selectedProduct.name}</span>}{!Object.values(labelFields).some(Boolean) && <span className="zebra-preview-empty">Activa al menos un dato</span>}</div><div className="zebra-preview-caption">Vista aproximada de impresión · {Number(labelQuantity) || 0} etiqueta{Number(labelQuantity) === 1 ? "" : "s"}</div></div><button type="button" className="orders-button orders-button--ghost inventory-label-download" onClick={downloadZebraLabels}><Printer size={15} />Descargar ZPL seleccionado</button></section>
          {lastScanAutoRecorded && lastScanTotal !== null && <div className="inventory-alert inventory-alert--success"><CheckCircle2 size={16} />Lectura registrada: <strong>+1 unidad</strong>. Total acumulado: <strong>{lastScanTotal}</strong>.</div>}
          {!lastScanAutoRecorded && countedByProduct.has(selectedProduct.id) && <div className="inventory-alert inventory-alert--warning"><AlertTriangle size={16} />Este artículo ya tiene {countedByProduct.get(selectedProduct.id)?.totalQuantity} unidades. El conteo manual se sumará al total.</div>}
          {!lastScanAutoRecorded && <><div className="inventory-count-fields"><label>Cantidad manual<input type="number" min="1" max="9999" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label>Tramo<input required value={tramo} readOnly aria-readonly="true" /></label><label>Góndola<input required value={gondola} readOnly aria-readonly="true" /></label></div><button className="orders-button inventory-save-button" disabled={recordCount.isPending} type="submit"><Plus size={16} />{recordCount.isPending ? "Guardando…" : "Sumar cantidad manual"}</button></>}
        </form>}
        {deleteArticleProduct && <div className="inventory-delete-article-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-article-title"><div className="inventory-delete-article-card"><div className="inventory-delete-article-icon"><Trash2 size={28} /></div><span className="orders-eyebrow">ACCIÓN IRREVERSIBLE DEL CATÁLOGO</span><h2 id="delete-article-title">Eliminar artículo completo</h2><p>Se retirará <strong>{deleteArticleProduct.sku}</strong> — {deleteArticleProduct.name} de Inventario, junto con sus GTIN y conteos. El historial de salidas se conservará para auditoría.</p><label>Escribe <strong>ELIMINAR</strong> para confirmar<input autoFocus value={deleteArticleConfirmation} onChange={event => setDeleteArticleConfirmation(event.target.value.toUpperCase())} placeholder="ELIMINAR" /></label>{deleteArticleError && <div className="inventory-alert inventory-alert--error" role="alert"><AlertTriangle size={15} />{deleteArticleError}</div>}<div className="inventory-delete-article-actions"><button type="button" className="orders-button orders-button--ghost" onClick={() => { setDeleteArticleProduct(null); setDeleteArticleConfirmation(""); setDeleteArticleError(""); }}>Cancelar</button><button type="button" className="inventory-article-delete-button" disabled={deleteArticle.isPending || deleteArticleConfirmation !== "ELIMINAR"} onClick={() => deleteArticle.mutate({ productId: deleteArticleProduct.id, confirmation: "ELIMINAR" })}><Trash2 size={16} />{deleteArticle.isPending ? "Eliminando…" : "Confirmar eliminación"}</button></div></div></div>}
        {showNewArticle && <div className="inventory-new-article" role="dialog" aria-modal="true" aria-labelledby="new-article-title"><div className="inventory-new-article-header"><div><span className="orders-eyebrow">ALTA MANUAL</span><h2 id="new-article-title">Agregar artículo nuevo</h2></div><button type="button" className="inventory-close-button" onClick={() => { setShowNewArticle(false); setNewArticleImageFile(null); setNewArticleImagePreview(""); }} aria-label="Cerrar"><X size={18} /></button></div><p>Este artículo quedará disponible en el catálogo de inventario para que puedas contarlo y ubicarlo.</p><form onSubmit={submitNewArticle} className="inventory-new-article-form"><label>Referencia<input required maxLength={100} value={newArticle.sku} onChange={event => updateNewArticle("sku", event.target.value)} placeholder="Ej. NUEVO-001" /></label><label>Código de barras externo <span className="inventory-optional">escanea aquí</span><input maxLength={40} value={newArticle.barcode} onChange={event => updateNewArticle("barcode", event.target.value.replace(/\s/g, ""))} placeholder="Escanea o escribe el código" inputMode="numeric" /></label><label>Nombre<input required maxLength={500} value={newArticle.name} onChange={event => updateNewArticle("name", event.target.value)} placeholder="Nombre del artículo" /></label><label>Descripción<textarea maxLength={2000} value={newArticle.description} onChange={event => updateNewArticle("description", event.target.value)} placeholder="Descripción del artículo" /></label><div className="inventory-new-article-grid"><label>Marca<input maxLength={120} value={newArticle.brand} onChange={event => updateNewArticle("brand", event.target.value)} placeholder="Marca" /></label><label>Aplicación<input maxLength={120} value={newArticle.application} onChange={event => updateNewArticle("application", event.target.value)} placeholder="Iveco, Scania…" /></label></div><div className="inventory-new-article-grid"><label>Cantidad inicial<input type="number" min="0" max="9999" value={newArticle.initialQuantity} onChange={event => updateNewArticle("initialQuantity", event.target.value)} /></label><label>Área activa<strong className="inventory-form-location">{tramo} / {gondola}</strong></label></div><label>URL de imagen <span className="inventory-optional">opcional</span><input maxLength={2000} value={newArticle.image} onChange={event => updateNewArticle("image", event.target.value)} placeholder="https://…" /></label><label className="inventory-photo-upload">Foto desde el dispositivo <span className="inventory-optional">JPG, PNG o WEBP · máximo 6 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => { const file = event.target.files?.[0] || null; setNewArticleImageFile(file); setNewArticleImagePreview(file ? URL.createObjectURL(file) : ""); }} /></label>{newArticleImagePreview && <div className="inventory-photo-preview"><img src={newArticleImagePreview} alt="Previsualización del artículo nuevo" /><span>La foto se subirá al guardar.</span></div>}{newArticleError && <div className="form-error" role="alert">{newArticleError}</div>}<div className="inventory-new-article-actions"><button type="button" className="orders-button orders-button--ghost" onClick={() => setShowNewArticle(false)}>Cancelar</button><button type="submit" className="orders-button orders-button--inventory" disabled={createArticle.isPending}><Plus size={15} />{createArticle.isPending ? "Guardando…" : "Agregar artículo"}</button></div></form></div>}
      </div>
      <aside className="inventory-summary"><div className="inventory-panel-heading"><div><span className="orders-eyebrow">03 / RESUMEN</span><h2>Artículos contados</h2></div><Boxes size={26} /></div><section className="inventory-report-panel" aria-labelledby="inventory-report-title"><div className="inventory-subpanel-heading"><div><span className="orders-eyebrow">REPORTE</span><h3 id="inventory-report-title">Más vendidos</h3></div><Printer size={21} /></div><div className="inventory-report-filters"><label>Mes<select value={reportMonth} onChange={event => setReportMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index, 1).toLocaleString("es-DO", { month: "long" })}</option>)}</select></label><label>Año<input type="number" min="2000" max="2200" value={reportYear} onChange={event => setReportYear(Number(event.target.value))} /></label></div>{topSoldQuery.isLoading ? <small>Cargando reporte…</small> : topSoldQuery.data?.length ? <ol className="inventory-report-list">{(topSoldQuery.data as TopSoldRow[]).map(item => <li key={`${item.productId}-${item.sku}`}><span><strong>{item.sku}</strong><b>{item.name}</b></span><em>{item.soldQuantity} vendidos</em></li>)}</ol> : <p className="inventory-report-empty">No hay ventas registradas para este período.</p>}<button type="button" className="orders-button orders-button--ghost inventory-print-button" onClick={printTopSoldReport}><Printer size={15} />Imprimir reporte</button></section>{inventoryQuery.isLoading ? <div className="inventory-empty"><LoaderCircle className="orders-spin" />Cargando conteos…</div> : countedItems.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>Aún no hay artículos contados.</p></div> : countedGroups.length === 0 ? <div className="inventory-empty"><PackageSearch size={28} /><p>Aún no hay artículos contados.</p></div> : <div className="inventory-location-groups">{countedGroups.map((group, groupIndex) => <section className={`inventory-location-group inventory-location-group--${groupIndex % 4}`} key={`${group.tramo}::${group.gondola}`}><header className="inventory-location-group-header"><div><span className="orders-eyebrow">UBICACIÓN {String(groupIndex + 1).padStart(2, "0")}</span><h3>{group.tramo} / {group.gondola}</h3></div><strong>{group.items.length} artículo{group.items.length === 1 ? "" : "s"}</strong></header><div className="inventory-location-group-list">{group.items.map(item => { const expanded = expandedInventoryId === item.id; const history = (historyQuery.data as InventoryScanRow[] | undefined) || []; const countedProduct = allProducts.find(product => product.id === item.productId); return <article className={`inventory-row is-counted${item.totalQuantity <= lowStockThreshold ? " is-low-stock" : ""}`} key={item.id} role="button" tabIndex={0} onClick={() => countedProduct && selectProduct(countedProduct)} onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && countedProduct) { event.preventDefault(); selectProduct(countedProduct); } }}><div className="inventory-row-copy"><strong>{item.sku}</strong>{(item.internalCode || countedProduct?.internalCode) && <em className="inventory-internal-code">Zebra {item.internalCode || countedProduct?.internalCode}</em>}{(item.barcode || countedProduct?.barcode) && <em className="inventory-barcode">Barras {item.barcode || countedProduct?.barcode}</em>}{getInventoryGtins(item.sku).length ? <em>GTIN {getInventoryGtins(item.sku).join(" · ")}</em> : <em className="inventory-gtin-missing">GTIN no registrado</em>}<h3>{item.name}</h3><small>{item.lastTramo || "—"} · {item.lastGondola || "—"} · {item.scanCount || 0} lecturas</small></div><div className="inventory-row-actions"><b>{item.totalQuantity}</b><button type="button" className="inventory-history-toggle" aria-expanded={expanded} onClick={event => { event.stopPropagation(); setExpandedInventoryId(expanded ? null : item.id); }}>{expanded ? "Ocultar historial" : `Ver historial (${item.scanCount || 0})`}</button></div>{expanded && <div className="inventory-history" aria-live="polite">{historyQuery.isLoading ? <small><LoaderCircle className="orders-spin" /> Cargando historial…</small> : history.length === 0 ? <small>No hay lecturas guardadas.</small> : history.map(scan => <div className="inventory-history-item" key={scan.id}><div><strong>{scan.tramo} / {scan.gondola}</strong><small>{formatInventoryScanDate(scan.createdAt)} · {scan.countedBy}</small></div><div className="inventory-history-actions"><b>+{scan.quantity}</b><button type="button" className="inventory-delete-scan" title="Eliminar esta lectura" aria-label={`Eliminar lectura del ${formatInventoryScanDate(scan.createdAt)}`} disabled={deleteScan.isPending} onClick={event => { event.stopPropagation(); if (window.confirm(`¿Eliminar esta lectura de ${item.sku} (${scan.tramo} / ${scan.gondola})? Se restará ${scan.quantity} unidad${scan.quantity === 1 ? "" : "es"}.`)) deleteScan.mutate({ scanId: scan.id }); }}><Trash2 size={15} /></button></div></div>)}</div>}</article>; })}</div></section>)}</div>}</aside>
    </section>
  </main>;
}
