import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, Calculator, ClipboardList, FileDown, Hand, House, LoaderCircle, LogIn, LogOut, PackageSearch, RefreshCw, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type View = "active" | "deleted";
type DraftLine = {
  id: number;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  brand?: string | null;
  application?: string | null;
  category?: string | null;
  image?: string | null;
  sourceUrl?: string | null;
};

const money = (value: number | string) => `RD$ ${Number(value || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AdminLogin() {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.auth.localLogin.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: () => setError("Usuario o contraseña incorrectos.") });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(""); login.mutate({ username, password }); };
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}><div className="orders-eyebrow">EUROTRUCK / ACCESO INTERNO</div><h1>Cotizaciones</h1><p>Ingresa con tu usuario administrativo para revisar solicitudes, precios y disponibilidad.</p><label>Usuario<input autoFocus required value={username} onChange={event => setUsername(event.target.value)} placeholder="admin1" /></label><label>Clave<input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tu clave" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="orders-button" disabled={login.isPending} type="submit"><LogIn size={15} />{login.isPending ? "Verificando…" : "Entrar a cotizaciones"}</button><a className="orders-button orders-button--ghost" href="/"><House size={15} />Ir a la página principal</a></form></main>;
}

export default function Orders() {
  const { user, loading: authLoading, logout } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pdfOrderId, setPdfOrderId] = useState<number | null>(null);
  const [view, setView] = useState<View>("active");
  const [drafts, setDrafts] = useState<Record<number, DraftLine[]>>({});
  const [savedQuoteId, setSavedQuoteId] = useState<number | null>(null);
  const localLogout = trpc.auth.localLogout.useMutation({ onSuccess: async () => { await logout(); window.location.href = "/"; } });
  const ordersQuery = trpc.orders.list.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const deletedOrdersQuery = trpc.orders.deleted.useQuery(undefined, { enabled: user?.role === "admin" && view === "deleted", retry: false });
  const availabilityQuery = trpc.inventory.publicLocations.useQuery(undefined, { enabled: user?.role === "admin", staleTime: 5_000 });
  const availability = useMemo(() => new Map((availabilityQuery.data || []).map(item => [item.productId, item] as const)), [availabilityQuery.data]);
  const pdfQuery = trpc.orders.pdf.useQuery({ id: pdfOrderId ?? 0 }, { enabled: pdfOrderId !== null });
  const takeOrder = trpc.orders.take.useMutation({ onSuccess: () => ordersQuery.refetch() });
  const updateQuote = trpc.orders.update.useMutation({ onSuccess: async result => { setSavedQuoteId(result.order.id); await ordersQuery.refetch(); window.setTimeout(() => setSavedQuoteId(null), 2600); } });
  const removeOrder = trpc.orders.remove.useMutation({ onSuccess: () => { void ordersQuery.refetch(); void deletedOrdersQuery.refetch(); } });
  const purgeOrder = trpc.orders.purge.useMutation({ onSuccess: () => deletedOrdersQuery.refetch() });

  useEffect(() => {
    if (!pdfQuery.data) return;
    const bytes = Uint8Array.from(atob(pdfQuery.data.pdfBase64), character => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a"); link.href = url; link.download = `${pdfQuery.data.orderNumber}-cotizacion.pdf`; link.click(); URL.revokeObjectURL(url); setPdfOrderId(null);
  }, [pdfQuery.data]);

  const openQuote = (id: number, items: DraftLine[]) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    setDrafts(current => current[id] ? current : { ...current, [id]: items.map(item => ({ ...item, unitPrice: String(item.unitPrice ?? "0.00") })) });
  };
  const updateDraft = (quoteId: number, itemId: number, changes: Partial<DraftLine>) => setDrafts(current => ({ ...current, [quoteId]: (current[quoteId] || []).map(item => item.id === itemId ? { ...item, ...changes } : item) }));
  const removeDraftLine = (quoteId: number, itemId: number) => setDrafts(current => ({ ...current, [quoteId]: (current[quoteId] || []).filter(item => item.id !== itemId) }));
  const saveQuote = (quoteId: number) => {
    const lines = drafts[quoteId] || [];
    updateQuote.mutate({ id: quoteId, items: lines.map(item => ({ productId: item.productId, sku: item.sku, name: item.name, quantity: Math.max(1, Number(item.quantity) || 1), unitPrice: Math.max(0, Number(item.unitPrice) || 0), brand: item.brand || undefined, application: item.application || undefined, category: item.category || undefined, image: item.image || undefined, sourceUrl: item.sourceUrl || undefined })) });
  };

  if (authLoading) return <div className="orders-state"><LoaderCircle className="orders-spin" />Comprobando acceso…</div>;
  if (!user) return <AdminLogin />;
  if (user.role !== "admin") return <div className="orders-state"><ClipboardList size={32} /><h1>Acceso restringido</h1><p>Las cotizaciones solo están disponibles para usuarios autorizados de Eurotruck.</p><button className="orders-button" onClick={() => localLogout.mutate()}>Cerrar sesión <LogOut size={15} /></button><a className="orders-button orders-button--ghost" href="/"><House size={15} />Ir a la página principal</a></div>;

  const isDeletedView = view === "deleted";
  const currentQuery = isDeletedView ? deletedOrdersQuery : ordersQuery;
  const visibleOrders = isDeletedView ? deletedOrdersQuery.data || [] : ordersQuery.data || [];

  return <main className="orders-page quotes-page">
    <header className="orders-header"><div><span className="orders-eyebrow">EUROTRUCK / COTIZACIONES</span><h1>{isDeletedView ? "Historial" : "Cotizaciones"}</h1><p>{isDeletedView ? "Cotizaciones archivadas para consulta administrativa." : "Revisa existencias, ajusta cantidades y precios, y genera el PDF final."}</p></div><div className="orders-header-actions"><a className="orders-button orders-button--ghost" href="/"><House size={15} />Página principal</a>{user.name?.toLowerCase() === "admin1" && <a className="orders-button orders-button--inventory" href="/inventory"><PackageSearch size={15} />Inventario</a>}<button className="orders-button orders-button--ghost" onClick={() => { void ordersQuery.refetch(); void availabilityQuery.refetch(); if (isDeletedView) void deletedOrdersQuery.refetch(); }}><RefreshCw size={15} />Actualizar</button><button className="orders-button orders-button--ghost" onClick={() => localLogout.mutate()}><LogOut size={15} />Salir</button></div></header>
    <nav className="orders-view-tabs quotes-tabs" aria-label="Vista de cotizaciones"><button type="button" className={view === "active" ? "is-active" : ""} onClick={() => { setView("active"); setExpanded(null); }}><ClipboardList size={18} /><span><b>Cotizaciones</b><small>Pendientes y atendidas</small></span><strong>{ordersQuery.data?.length ?? 0}</strong></button><button type="button" className={view === "deleted" ? "is-active" : ""} onClick={() => { setView("deleted"); setExpanded(null); }}><Archive size={18} /><span><b>Historial</b><small>Cotizaciones archivadas</small></span><strong>{deletedOrdersQuery.data?.length ?? "—"}</strong></button></nav>
    {currentQuery.isLoading ? <div className="orders-state"><LoaderCircle className="orders-spin" />Cargando cotizaciones…</div> : currentQuery.isError ? <div className="orders-state"><h2>No se pudo cargar la vista</h2><p>Verifica tu sesión autorizada e inténtalo nuevamente.</p><button className="orders-button" onClick={() => currentQuery.refetch()}>Reintentar</button></div> : visibleOrders.length === 0 ? <div className="orders-empty"><ClipboardList size={38} /><h2>{isDeletedView ? "No hay cotizaciones archivadas" : "No hay cotizaciones recibidas"}</h2><p>{isDeletedView ? "El historial aparecerá aquí." : "Las nuevas solicitudes aparecerán cuando un cliente envíe su carrito."}</p></div> : <section className="orders-list quotes-list">{visibleOrders.map(({ order, items }) => {
      const isOpen = expanded === order.id;
      const draft = drafts[order.id] || (items as DraftLine[]);
      const total = draft.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
      return <article className={isOpen ? "order-card quote-card order-card--open" : "order-card quote-card"} key={order.id}>
        <button className="order-card-summary" onClick={() => openQuote(order.id, items as DraftLine[])}><span className="order-number">{order.orderNumber}</span><span className="order-client"><b>{order.company}</b><small>{order.email} · {order.phone}</small></span><span className={`order-status order-status--${order.status}`}>{isDeletedView ? "Archivada" : order.status === "new" ? "Pendiente" : order.status === "taken" ? "En preparación" : "Cerrada"}</span><span className="quote-summary-total">{money(total)}<small>{items.length} referencias</small></span><span className="order-date">{new Date(isDeletedView && order.deletedAt ? order.deletedAt : order.createdAt).toLocaleString("es-DO")}</span></button>
        {isOpen && <div className="order-card-detail quote-card-detail"><div className="quote-client-grid"><span><small>Empresa / flota</small><strong>{order.company}</strong></span><span><small>Teléfono</small><strong>{order.phone}</strong></span><span><small>Correo</small><strong>{order.email}</strong></span><span><small>RNC</small><strong>{order.rnc || "—"}</strong></span></div><div className="quote-editor-head"><div><Calculator size={20} /><span><h3>Preparar cotización</h3><p>Ajusta cantidades y precios. Elimina una línea si no hay disponibilidad.</p></span></div><strong>{money(total)}</strong></div>{draft.length ? <div className="quote-items-editor">{draft.map(item => { const stock = availability.get(item.productId)?.totalQuantity || 0; const subtotal = Number(item.unitPrice || 0) * Number(item.quantity || 0); return <article className={`quote-line${stock < item.quantity ? " is-unavailable" : ""}`} key={item.id}><div className="quote-line-product">{item.image ? <img src={item.image} alt="" /> : <PackageSearch size={22} />}<span><small>{item.sku}</small><b>{item.name}</b><em>{stock > 0 ? `${stock} disponibles` : "Sin existencia registrada"}</em></span></div><label>Cantidad<input type="number" min="1" max="9999" value={item.quantity} onChange={event => updateDraft(order.id, item.id, { quantity: Number(event.target.value) })} /></label><label>Precio unitario RD$<input type="number" min="0" step="0.01" value={item.unitPrice} onChange={event => updateDraft(order.id, item.id, { unitPrice: event.target.value })} /></label><div className="quote-line-subtotal"><small>Subtotal</small><strong>{money(subtotal)}</strong></div><button type="button" className="quote-line-remove" onClick={() => removeDraftLine(order.id, item.id)} aria-label={`Eliminar ${item.name}`}><Trash2 size={16} /></button>{stock < item.quantity && <div className="quote-stock-warning"><AlertTriangle size={14} />La cantidad solicitada supera la existencia. Ajusta o elimina esta línea.</div>}</article>; })}</div> : <div className="quote-empty-lines"><PackageSearch size={28} /><b>Esta cotización no tiene artículos.</b><span>Puedes moverla al historial si no será procesada.</span></div>}{order.partsNote && <p className="order-note"><b>Nota del cliente:</b> {order.partsNote}</p>}{isDeletedView && <p className="order-archive-note"><Archive size={15} /> Archivada por <b>{order.deletedBy || "administrador"}</b>{order.deletedAt ? ` el ${new Date(order.deletedAt).toLocaleString("es-DO")}` : ""}.</p>}<div className="order-actions quote-actions">{!isDeletedView && <button className="orders-button orders-button--save" disabled={updateQuote.isPending} onClick={() => saveQuote(order.id)}><Save size={16} />{updateQuote.isPending ? "Guardando…" : savedQuoteId === order.id ? "Cotización guardada" : "Guardar cambios"}</button>}<button className="orders-button orders-button--ghost" disabled={pdfQuery.isFetching} onClick={() => setPdfOrderId(order.id)}><FileDown size={15} />{pdfQuery.isFetching && pdfOrderId === order.id ? "Generando…" : "Descargar cotización"}</button>{!isDeletedView && order.status === "new" ? <button className="orders-button orders-button--take" disabled={takeOrder.isPending} onClick={() => takeOrder.mutate({ id: order.id })}><Hand size={18} />{takeOrder.isPending ? "Asignando…" : "Tomar cotización"}</button> : !isDeletedView ? <span className="order-assigned">Atendida por <b>{order.assignedAdmin || "administrador"}</b></span> : <button className="orders-button orders-button--danger" disabled={purgeOrder.isPending} onClick={() => { if (window.confirm(`¿Eliminar definitivamente la cotización ${order.orderNumber}?`)) purgeOrder.mutate({ id: order.id }); }}><Trash2 size={15} />Eliminar definitivamente</button>}{!isDeletedView && <button className="orders-button orders-button--danger" disabled={removeOrder.isPending} onClick={() => { if (window.confirm(`¿Mover la cotización ${order.orderNumber} al historial?`)) removeOrder.mutate({ id: order.id }); }}><Archive size={15} />Mover al historial</button>}</div></div>}
      </article>;
    })}</section>}
  </main>;
}
