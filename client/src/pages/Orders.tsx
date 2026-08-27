import { FormEvent, useEffect, useState } from "react";
import { ClipboardList, ExternalLink, FileDown, Hand, LoaderCircle, LogIn, LogOut, MessageCircle, Phone, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { buildWhatsAppOrderUrl } from "@shared/orderHelpers";

function AdminLogin() {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.auth.localLogin.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: () => setError("Usuario o contraseña incorrectos.") });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(""); login.mutate({ username, password }); };
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}><div className="orders-eyebrow">EUROTRUCK / ACCESO INTERNO</div><h1>Bandeja de órdenes</h1><p>Ingresa con tu usuario administrativo para consultar clientes y solicitudes.</p><label>Usuario<input autoFocus required value={username} onChange={event => setUsername(event.target.value)} placeholder="admin1" /></label><label>Clave<input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tu clave" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="orders-button" disabled={login.isPending} type="submit"><LogIn size={15} />{login.isPending ? "Verificando…" : "Entrar a la bandeja"}</button></form></main>;
}

export default function Orders() {
  const { user, loading: authLoading, logout } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pdfOrderId, setPdfOrderId] = useState<number | null>(null);
  const localLogout = trpc.auth.localLogout.useMutation({ onSuccess: () => window.location.reload() });
  const ordersQuery = trpc.orders.list.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const pdfQuery = trpc.orders.pdf.useQuery({ id: pdfOrderId ?? 0 }, { enabled: pdfOrderId !== null });
  const takeOrder = trpc.orders.take.useMutation({ onSuccess: () => ordersQuery.refetch() });
  const removeOrder = trpc.orders.remove.useMutation({ onSuccess: () => ordersQuery.refetch() });

  useEffect(() => {
    if (!pdfQuery.data) return;
    const bytes = Uint8Array.from(atob(pdfQuery.data.pdfBase64), character => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdfQuery.data.orderNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    setPdfOrderId(null);
  }, [pdfQuery.data]);

  if (authLoading) return <div className="orders-state"><LoaderCircle className="orders-spin" />Comprobando acceso…</div>;
  if (!user) return <AdminLogin />;
  if (user.role !== "admin") return <div className="orders-state"><ClipboardList size={32} /><h1>Acceso restringido</h1><p>Esta bandeja solo está disponible para usuarios autorizados de Eurotruck.</p><button className="orders-button" onClick={() => localLogout.mutate()}>Cerrar sesión <LogOut size={15} /></button></div>;

  return <main className="orders-page"><header className="orders-header"><div><span className="orders-eyebrow">EUROTRUCK / OPERACIONES</span><h1>Bandeja de órdenes</h1><p>Solicitudes recibidas de clientes y flotas.</p></div><div className="orders-header-actions"><button className="orders-button orders-button--ghost" onClick={() => ordersQuery.refetch()}><RefreshCw size={15} />Actualizar</button><button className="orders-button orders-button--ghost" onClick={() => localLogout.mutate()}><LogOut size={15} />Salir</button></div></header>{ordersQuery.isLoading ? <div className="orders-state"><LoaderCircle className="orders-spin" />Cargando órdenes…</div> : ordersQuery.isError ? <div className="orders-state"><h2>No se pudo cargar la bandeja</h2><p>Verifica tu sesión autorizada e inténtalo nuevamente.</p><button className="orders-button" onClick={() => ordersQuery.refetch()}>Reintentar</button></div> : ordersQuery.data?.length === 0 ? <div className="orders-empty"><ClipboardList size={38} /><h2>No hay órdenes recibidas</h2><p>Las nuevas solicitudes aparecerán aquí cuando un cliente complete su carrito.</p></div> : <section className="orders-list">{ordersQuery.data?.map(({ order, items }) => { const isOpen = expanded === order.id; const whatsappUrl = buildWhatsAppOrderUrl(order.phone, order.orderNumber, order.company); return <article className={isOpen ? "order-card order-card--open" : "order-card"} key={order.id}><button className="order-card-summary" onClick={() => setExpanded(isOpen ? null : order.id)}><span className="order-number">{order.orderNumber}</span><span className="order-client"><b>{order.company}</b><small>{order.email} · {order.phone}</small></span><span className={`order-status order-status--${order.status}`}>{order.status === "new" ? "Abierta" : order.status === "taken" ? "Tomada" : "Cerrada"}</span><span className="order-date">{new Date(order.createdAt).toLocaleString("es-DO")}</span></button>{isOpen && <div className="order-card-detail"><div className="order-contact"><div><small>Correo del cliente</small><a href={`mailto:${order.email}`}>{order.email}</a></div><div><small>Teléfono / WhatsApp</small><a href={`tel:${order.phone.replace(/\D/g, "")}`}>{order.phone}</a></div><div><small>Contacto Eurotruck</small><a href="tel:8094130846">(809) 413-0846</a></div></div><h3>Artículos solicitados ({items.length})</h3><div className="order-items">{items.map(item => <div className="order-item" key={item.id}><span>{item.sku}</span><b>{item.name}</b><small>{item.brand || "—"} · {item.application || "Todas las aplicaciones"} · Cantidad: {item.quantity || 1}</small></div>)}</div>{order.partsNote && <p className="order-note"><b>Nota:</b> {order.partsNote}</p>}<div className="order-actions"><button className="orders-button orders-button--ghost" disabled={pdfQuery.isFetching} onClick={() => setPdfOrderId(order.id)}><FileDown size={15} />{pdfQuery.isFetching && pdfOrderId === order.id ? "Generando…" : "Descargar PDF"}</button>{order.status === "new" ? <button className="orders-button" disabled={takeOrder.isPending} onClick={() => takeOrder.mutate({ id: order.id })}><Hand size={15} />{takeOrder.isPending ? "Tomando…" : "Tomar orden"}</button> : <span className="order-assigned">Tomada por <b>{order.assignedAdmin || "administrador"}</b></span>}<a className="orders-button orders-button--call" href={`tel:${order.phone.replace(/\D/g, "")}`}><Phone size={15} />Llamar al cliente</a><a className="orders-button orders-button--whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} />Contactar por WhatsApp <ExternalLink size={13} /></a><button className="orders-button orders-button--danger" disabled={removeOrder.isPending} onClick={() => { if (window.confirm(`¿Eliminar la orden ${order.orderNumber}? Esta acción no se puede deshacer.`)) removeOrder.mutate({ id: order.id }); }}><Trash2 size={15} />Eliminar orden</button></div></div>}</article>; })}</section>}</main>;
}
