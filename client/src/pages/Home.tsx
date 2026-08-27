// Design system: réplica Eurotruck — industrial nocturno, contraste operativo, precisión modular y acciones visibles.
// La referencia visual manda: fondo carbón/vino, azul ruta eléctrica, amarillo operativo, verde de servicio y fotografía de camiones.
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { attachGtins, productMatchesCatalogQuery, type GtinMap } from "@shared/gtinHelpers";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Barcode,
  BatteryCharging,
  Box,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Cog,
  Facebook,
  Factory,
  Globe2,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench,
  X,
  Zap,
} from "lucide-react";

const truckImages = {
  SCANIA: "/manus-storage/scania_1210de67.jpg",
  VOLVO: "/manus-storage/volvo_c177e924.jpg",
  "MERCEDES-BENZ": "/manus-storage/mercedes_136007a3.jpg",
  MAN: "/manus-storage/man_42f48747.jpg",
  IVECO: "/manus-storage/iveco_0d12bea0.jpg",
} as const;

type TruckBrand = keyof typeof truckImages;

const brandMeta: Record<TruckBrand, { copy: string; chips: string[]; dot: string }> = {
  SCANIA: { copy: "Potencia sueca para los kilómetros que no pueden detenerse", chips: ["Piezas de motor", "Sistemas de freno", "Diagnóstico pesado"], dot: "#2d76ff" },
  VOLVO: { copy: "Seguridad, rendimiento y control en cada trayecto", chips: ["Transmisión I-Shift", "Frenos ABS", "Suspensión neumática"], dot: "#34a8ff" },
  "MERCEDES-BENZ": { copy: "Ingeniería de Precisión y Tecnología MirrorCam", chips: ["Sensores de Telemetría", "Discos y Pastillas de Freno", "Compresores de Aire"], dot: "#f4f7fb" },
  MAN: { copy: "Eficiencia alemana para flotas que trabajan en serio", chips: ["Turbos y motores", "Sistemas de aire", "Mantenimiento móvil"], dot: "#f6b51e" },
  IVECO: { copy: "Respuesta europea para carga, ruta y servicio continuo", chips: ["Componentes OEM", "Repuestos eléctricos", "Auxilio 24/7"], dot: "#ee4b59" },
};

const brands = Object.keys(truckImages) as TruckBrand[];

type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  description: string;
  slug: string;
  url: string;
  image: string;
  imageFull: string;
  imageSource: string;
  application: string;
  applicationId: string;
  brand: string;
  brandId: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  usage: string[];
  replaces: string;
  mainOe: string;
  packagingAmount: number;
  salesUnit: string;
  badges: Array<string | { id: string; visible?: { from?: string; till?: string } }>;
  isProductNews: boolean;
  isProductPromotion: boolean;
  crossReferences: Array<{ competitor: string; referenceNo: string }>;
  gtins?: string[];
};

const catalogFileUrl = "/manus-storage/diesel-catalog-all_60b23acb.json";
const gtinMapFileUrl = "/manus-storage/diesel-gtin-map_e428333b.json";
const catalogPageSize = 24;
const catalogSourceCounts: Record<string, number> = { Iveco: 5897, Scania: 7005, Volvo: 8511, "Mercedes-Benz": 11299, MAN: 6958 };
const catalogApplications = ["Todas las aplicaciones", "Iveco", "Scania", "Volvo", "Mercedes-Benz", "MAN"];
const formatCount = (value: number) => new Intl.NumberFormat("es-DO").format(value);

const faqs = [
  ["¿Qué marcas de piezas vendemos?", "Trabajamos con repuestos para Scania, Volvo, Mercedes-Benz, MAN e Iveco, además de referencias compatibles Renault Trucks y alternativas OEM seleccionadas."],
  ["¿Hacemos envíos?", "Coordinamos despachos a través de Caribe Express y transportistas aliados. Confirma disponibilidad y destino al solicitar tu cotización."],
  ["¿De dónde provienen las partes que vendemos?", "Importamos piezas genuinas y alternativas OEM desde Europa y Brasil, con trazabilidad de marca y referencia para cada pedido."],
  ["¿Qué tipo de servicios ofrecemos?", "Venta de repuestos, mantenimiento preventivo y correctivo, diagnóstico, instalación y asistencia mecánica móvil para flotas."],
  ["¿Hacen asistencias en mi propia empresa?", "Sí. Coordinamos visitas a patios, talleres y centros de operación según la necesidad de tu flota."],
  ["¿Tienen servicio de rescate?", "Contamos con rescate 24 horas y taller móvil. Llama a Jose Steven al (809) 949-9406 para atención en carretera."],
  ["¿Cómo contactarte con nosotros?", "Para cotizaciones llama a Kelvin al (809) 893-0258, para oficina al (809) 591-1222 o escribe a eurotruckcxa@yahoo.com."],
];

function EurotruckLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo-lockup ${compact ? "logo-lockup--compact" : ""}`} aria-label="Eurotruck Repuestos y Servicios">
      <svg className="logo-mark" viewBox="0 0 320 180" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="blueTruck" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="48%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>
        <path d="M30 86h170V56h65l13 36h12v8h-8v12h-20c0 10-8 18-20 18s-20-8-20-18h-57c0 10-8 18-20 18s-20-8-20-18h-10c0 10-8 18-20 18s-20-8-20-18H40V94H30Z" fill="url(#blueTruck)" stroke="#1d4ed8" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M212 62h43l8 22h-51Z" fill="#fff" opacity=".95" />
        {[95, 145, 242].map((cx) => <g key={cx} transform={`translate(${cx} 112)`}><circle r="16" fill="#0f172a" stroke="#1d4ed8" strokeWidth="2.5" /><circle r="8" fill="#1e293b" /><circle r="3.5" fill="#60a5fa" /><path d="M-7 0h14M0-7v14" stroke="#94a3b8" strokeWidth="1.5" /></g>)}
        <path d="M180 32a42 42 0 1 0 0 50h14a52 52 0 1 1 0-50ZM94 44h82l-4 9H94Zm-4 18h80l-4 9H90Zm98-18h10v42h-10Z" fill="url(#blueTruck)" stroke="#1e40af" strokeWidth="1" />
      </svg>
      <div className="logo-type">
        <span>EUROTRUCK</span>
        <small>REPUESTOS / SERVICIOS</small>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="section-label"><span className="label-pulse" />{children}</div>;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function submitCatalogSearch(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  scrollToId("catalogo");
}

export default function Home() {
  const [activeBrand, setActiveBrand] = useState<TruckBrand>("MERCEDES-BENZ");
  const [outgoingBrand, setOutgoingBrand] = useState<TruckBrand | null>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isSliding, setIsSliding] = useState(false);
  const slideTimerRef = useRef<number | undefined>(undefined);
  const [isFleetPaused, setIsFleetPaused] = useState(false);
  const [cartItems, setCartItems] = useState<Array<CatalogProduct & { quantity: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const [mobileNav, setMobileNav] = useState(false);
  const [language, setLanguage] = useState<"ES" | "EN">("ES");
  const [company, setCompany] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerRnc, setCustomerRnc] = useState("");
  const [truckBrand, setTruckBrand] = useState("Multi-Flota / Todas");
  const [partsNote, setPartsNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState("");
  const [orderError, setOrderError] = useState("");
  const [afterHoursMessage, setAfterHoursMessage] = useState("");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [gtinMap, setGtinMap] = useState<GtinMap>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("Todas las aplicaciones");
  const [brandFilter, setBrandFilter] = useState("Todas las Marcas");
  const [categoryFilter, setCategoryFilter] = useState("Todas las Piezas");
  const [catalogPage, setCatalogPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const createOrderMutation = trpc.orders.create.useMutation();

  function addToCart(product: CatalogProduct) {
    setCartItems((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, 99) } : item);
      return [...items, { ...product, quantity: 1 }];
    });
  }

  const activeIndex = brands.indexOf(activeBrand);
  const catalogBrands = useMemo(() => ["Todas las Marcas", ...Array.from(new Set(catalog.map((product) => product.brand))).sort()], [catalog]);
  const catalogCategories = useMemo(() => ["Todas las Piezas", ...Array.from(new Set(catalog.map((product) => product.category))).sort()], [catalog]);
  const filteredProducts = useMemo(() => catalog.filter((product) => {
    return (!catalogSearch || productMatchesCatalogQuery(product, catalogSearch)) &&
      (applicationFilter === "Todas las aplicaciones" || product.application === applicationFilter) &&
      (brandFilter === "Todas las Marcas" || product.brand === brandFilter) &&
      (categoryFilter === "Todas las Piezas" || product.category === categoryFilter);
  }), [catalog, catalogSearch, applicationFilter, brandFilter, categoryFilter]);
  const applicationResultCount = applicationFilter === "Todas las aplicaciones" ? Object.values(catalogSourceCounts).reduce((total, count) => total + count, 0) : (catalogSourceCounts[applicationFilter] || filteredProducts.length);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / catalogPageSize));
  const visibleProducts = useMemo(() => filteredProducts.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize), [filteredProducts, catalogPage]);

  const filteredFaqs = useMemo(() => faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(faqSearch.toLowerCase())), [faqSearch]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(catalogFileUrl).then((response) => { if (!response.ok) throw new Error(`Catalog ${response.status}`); return response.json() as Promise<CatalogProduct[]>; }),
      fetch(gtinMapFileUrl).then((response) => { if (!response.ok) throw new Error(`GTIN map ${response.status}`); return response.json() as Promise<GtinMap>; }),
    ])
      .then(([items, map]) => { if (!cancelled) { setGtinMap(map); setCatalog(items.map(item => attachGtins(item, map))); setCatalogLoading(false); } })
      .catch(() => { if (!cancelled) { setCatalogError(true); setCatalogLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogSearch, applicationFilter, brandFilter, categoryFilter]);

  useEffect(() => {
    if (!selectedProduct && !cartOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
        setCartOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct, cartOpen]);

  function transitionToBrand(next: TruckBrand, direction: "next" | "prev") {
    if (next === activeBrand) return;
    if (slideTimerRef.current) window.clearTimeout(slideTimerRef.current);
    setOutgoingBrand(activeBrand);
    setSlideDirection(direction);
    setIsSliding(true);
    setActiveBrand(next);
    slideTimerRef.current = window.setTimeout(() => {
      setOutgoingBrand(null);
      setIsSliding(false);
    }, 680);
  }

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (isFleetPaused || reduceMotion) return;

    const timer = window.setInterval(() => {
      const nextIndex = (brands.indexOf(activeBrand) + 1) % brands.length;
      transitionToBrand(brands[nextIndex], "next");
    }, 5200);

    return () => window.clearInterval(timer);
  }, [activeBrand, isFleetPaused]);

  useEffect(() => () => {
    if (slideTimerRef.current) window.clearTimeout(slideTimerRef.current);
  }, []);

  function changeBrand(next: TruckBrand) {
    const targetIndex = brands.indexOf(next);
    const forwardDistance = (targetIndex - activeIndex + brands.length) % brands.length;
    transitionToBrand(next, forwardDistance <= brands.length / 2 ? "next" : "prev");
    window.setTimeout(() => document.getElementById("hero-fleet")?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  }

  function stepBrand(direction: number) {
    const nextIndex = (activeIndex + direction + brands.length) % brands.length;
    transitionToBrand(brands[nextIndex], direction > 0 ? "next" : "prev");
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrderError("");
    if (!company.trim() || !customerEmail.trim() || !customerPhone.trim() || cartItems.length === 0) return;
    try {
      const result = await createOrderMutation.mutateAsync({ company: company.trim(), email: customerEmail.trim(), phone: customerPhone.trim(), rnc: customerRnc.trim() || undefined, truckBrand, partsNote: partsNote.trim() || undefined, items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity, sku: item.sku, name: item.name, brand: item.brand, application: item.application, category: item.category, image: item.image, sourceUrl: item.url })) });
      const bytes = Uint8Array.from(atob(result.pdfBase64), character => character.charCodeAt(0));
      const downloadUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${result.orderNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setSubmittedOrder(result.orderNumber);
      setAfterHoursMessage(result.afterHoursMessage || "");
      setSubmitted(true);
      setCartItems([]);
      setCartOpen(false);
      window.setTimeout(() => setSubmitted(false), 10000);
    } catch {
      setOrderError("No pudimos registrar la orden. Revisa los datos e inténtalo nuevamente.");
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-glow" />
        <div className="header-top container-wide">
          <button className="brand-button" onClick={() => scrollToId("inicio")} aria-label="Volver al inicio"><EurotruckLogo /></button>
          <form className="portal-header-search" onSubmit={submitCatalogSearch}><span>Buscar piezas</span><div><input aria-label="Buscar piezas" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="N.º de referencia, GTIN o descripción (DT, SA, OE, etc.)" /><button type="submit" aria-label="Buscar en el catálogo"><Search size={19} /></button></div></form>
          <div className="header-tools">
            <div className="contact-email"><Mail size={13} /><a href="mailto:eurotruckcxa@yahoo.com">eurotruckcxa@yahoo.com</a></div>
            <div className="utility-row">
              <div className="socials" aria-label="Redes sociales">
                <a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={13} /></a>
                <a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={13} /></a>
                <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok"><Sparkles size={13} /></a>
                <button onClick={() => scrollToId("contacto")} aria-label="Ubicación"><MapPin size={13} /></button>
              </div>
              <div className="language-switch" aria-label="Selector de idioma">
                <button className={language === "ES" ? "is-selected" : ""} onClick={() => setLanguage("ES")}>ES</button>
                <button className={language === "EN" ? "is-selected" : ""} onClick={() => setLanguage("EN")}>EN</button>
              </div>
              <a className="company-access-button" href="/orders" aria-label="Abrir acceso de empresa y bandeja de órdenes"><ShieldCheck size={14} />Acceso empresa</a><button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingCart size={14} />Carrito <b>{cartCount}</b></button>
            </div>
            <div className="contact-lines">
              <a href="tel:8098930258"><span>COTIZACIONES (KELVIN)</span><strong>(809) 893-0258</strong></a>
              <a className="contact-lines--green" href="tel:8099499406"><span>RESCATE 24H &amp; TALLER</span><strong>(809) 949-9406</strong></a>
              <a href="tel:8095911222"><span>OFICINA CENTRAL</span><strong>(809) 591-1222</strong></a>
            </div>
          </div>
          <a className="mobile-company-access-top" href="/orders" aria-label="Abrir acceso empresa"><ShieldCheck size={16} /></a><button className="mobile-menu-button" onClick={() => setMobileNav((value) => !value)} aria-label="Abrir menú">{mobileNav ? <X /> : <Menu />}</button>
        </div>
        <nav className={`main-nav container-wide ${mobileNav ? "main-nav--open" : ""}`} aria-label="Navegación principal"><div className="portal-nav-links">{[['Inicio', 'inicio'], ['Venta de Piezas', 'catalogo'], ['Servicio a Domicilio', 'registro'], ['Marcas', 'hero-fleet'], ['Preguntas Frecuentes', 'faq'], ['Contacto', 'contacto']].map(([label, id], index) => <button key={id} className={index === 0 ? "nav-active" : ""} onClick={() => { scrollToId(id); setMobileNav(false); }}>{label}</button>)}</div><a className="mobile-company-access" href="/orders"><ShieldCheck size={14} />Acceso empresa / Bandeja de órdenes</a></nav>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-atmosphere" />
          <div className="hero-content container-wide">
            <SectionLabel>ESPECIALISTAS EN CAMIONES EUROPEOS</SectionLabel>
            <h1>Venta de Piezas, Mantenimiento y<br className="desktop-break" /> Reparación a Domicilio</h1>
            <p className="hero-intro">Repuestos genuinos para Scania, Volvo, MAN, Iveco y Mercedes-Benz con servicio<br className="desktop-break" /> técnico móvil donde tú estés.</p>
            <div className="brand-pills" role="tablist" aria-label="Seleccionar marca de camión">
              {brands.map((brand) => <button key={brand} className={activeBrand === brand ? "brand-pill is-active" : "brand-pill"} onClick={() => changeBrand(brand)} role="tab" aria-selected={activeBrand === brand}><span style={{ background: brandMeta[brand].dot }} />{brand}</button>)}
            </div>
          </div>

          <div id="hero-fleet" className="fleet-stage container-wide" onMouseEnter={() => setIsFleetPaused(true)} onMouseLeave={() => setIsFleetPaused(false)} onFocus={() => setIsFleetPaused(true)} onBlur={() => setIsFleetPaused(false)}>
            <div className={`fleet-image-frame ${isSliding ? `fleet-image-frame--${slideDirection}` : ""}`}>
              {outgoingBrand && <img src={truckImages[outgoingBrand]} alt="" aria-hidden="true" className="fleet-image fleet-image--outgoing" />}
              <img src={truckImages[activeBrand]} alt={`${activeBrand} — Eurotruck Repuestos y Mantenimiento`} className={`fleet-image fleet-image--active ${isSliding ? "is-entering" : ""}`} key={activeBrand} />
              <div className="fleet-image-overlay" />
              <div className="fleet-grid" />
            </div>
            <button className="fleet-arrow fleet-arrow--left" onClick={() => stepBrand(-1)} aria-label="Camión anterior"><ArrowLeft size={18} /></button>
            <button className="fleet-arrow fleet-arrow--right" onClick={() => stepBrand(1)} aria-label="Siguiente camión"><ArrowRight size={18} /></button>
            <div className="fleet-caption">
              <span className="fleet-title">{activeBrand}</span>
              <p>{brandMeta[activeBrand].copy}</p>
              <div className="feature-chips">{brandMeta[activeBrand].chips.map((chip) => <span key={chip}><Check size={11} />{chip}</span>)}</div>
            </div>
            <div className="hero-ctas">
              <button className="cta cta-blue" onClick={() => scrollToId("catalogo")}><Box size={15} />Cotizar Repuestos</button>
              <button className="cta cta-green" onClick={() => scrollToId("registro")}><ClipboardList size={15} />Registrar Pedido de Pieza</button>
              <a className="cta cta-yellow" href="tel:8099499406"><Wrench size={15} />Solicitar Servicio a Domicilio</a>
            </div>
          </div>

          <div className="fleet-deck container-wide" aria-label="Selector visual de camiones">
            <p>Toca cualquier camión para moverlo al frente:</p>
            <div className="deck-items">
              {brands.map((brand) => <button className={brand === activeBrand ? "deck-card is-active" : "deck-card"} key={brand} onClick={() => changeBrand(brand)}><img src={truckImages[brand]} alt={brand} /><span>{brand}</span></button>)}
            </div>
          </div>
        </section>

        <section className="service-section section-dark" id="servicios">
          <div className="container-wide">
            <div className="services-intro">
              <div><SectionLabel>EUROTRUCK EN MOVIMIENTO</SectionLabel><h2>La ruta no se detiene.<br /><em>Tu operación tampoco.</em></h2></div>
              <p>Desde la pieza correcta hasta el diagnóstico que resuelve el problema, acompañamos a tu flota en cada tramo con respuesta técnica y atención directa.</p>
            </div>
            <div className="service-grid">
              <article className="service-card"><div className="service-icon"><Boxes /></div><span className="service-index">01 / PARTS</span><h3>Venta de Piezas y Repuestos</h3><p>Stock certificado de piezas originales y alternativas OEM para todas las líneas europeas.</p><button onClick={() => scrollToId("catalogo")}>Explorar catálogo <ArrowUpRight size={14} /></button></article>
              <article className="service-card"><div className="service-icon"><Cog /></div><span className="service-index">02 / WORKSHOP</span><h3>Mantenimiento Preventivo y Correctivo</h3><p>Diagnóstico por computadora, ajustes de motor, frenos, transmisión y sistemas neumáticos.</p><button onClick={() => scrollToId("registro")}>Coordinar mantenimiento <ArrowUpRight size={14} /></button></article>
              <article className="service-card service-card--image"><div className="service-card-image" /><div className="service-card-shade" /><div className="service-card-copy"><div className="service-icon"><Phone /></div><span className="service-index">03 / 24·7 ASSISTANCE</span><h3>Servicio a Domicilio y Auxilio 24/7</h3><p>Unidades móviles con mecánicos equipados para reparar directo en tus instalaciones o en carretera.</p><a href="tel:8099499406">Llamar a rescate <ArrowUpRight size={14} /></a></div></article>
            </div>
          </div>
        </section>

        <section className="registration-section" id="registro">
          <div className="container-wide registration-layout">
            <div className="registration-copy"><SectionLabel>REGISTRO RÁPIDO DE PEDIDOS</SectionLabel><h2>Registra tu Empresa<br /><span>para Pedidos de Piezas</span></h2><p>Solo necesitamos estos datos para procesar tus despachos y cotizaciones de inmediato.</p><div className="registration-promises"><span><Check size={14} />Atención prioritaria y despacho el mismo día</span><span><Check size={14} />Opción de instalación en taller o a domicilio</span></div><div className="registration-photo"><div /><small>RESPUESTA DIRECTA PARA TU FLOTA</small></div></div>
            <form className="registration-form" onSubmit={submitRegistration}>
              <div className="form-heading"><span>01</span><p>Completa la información de tu operación</p></div>
              <label>Nombre de la Empresa o Flota <b>*</b><input id="reg-company-input" required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Ej. Transportes del Caribe SRL" /></label>
              <div className="form-grid"><label>RNC <small>(Registro Nacional de Contribuyentes)</small><input id="reg-rnc-input" value={customerRnc} onChange={(event) => setCustomerRnc(event.target.value)} placeholder="Ej. 131-12345-6 o 101123456" /></label><label>Número de Teléfono / WhatsApp <b>*</b><input id="reg-phone-input" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Ej. (809) 893-0258" /></label></div>
              <div className="form-grid"><label>Correo Electrónico<input id="reg-email-input" required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Ej. compras@tuempresa.com" /></label><label>Marca de Camión Principal<select id="reg-brand-select" value={truckBrand} onChange={(event) => setTruckBrand(event.target.value)}><option>Scania</option><option>Volvo</option><option>Mercedes-Benz</option><option>MAN</option><option>Iveco</option><option>Multi-Flota / Todas</option></select></label></div>
              <label>Piezas que necesitas <small>(Opcional)</small><input id="reg-parts-input" value={partsNote} onChange={(event) => setPartsNote(event.target.value)} placeholder="Ej. Kit de embrague, filtros de aceite, disco de frenos..." /></label>
              <label className="checkbox-label"><input id="reg-onsite-service-checkbox" type="checkbox" /> <span className="fake-checkbox"><Check size={12} /></span>Requiero también servicio mecánico o instalación a domicilio</label>
              <button className="submit-button" type="submit" disabled={createOrderMutation.isPending || cartItems.length === 0}>{submitted ? <><Check size={16} />Orden {submittedOrder} descargada — te contactaremos</> : createOrderMutation.isPending ? <>Generando orden…</> : <>Generar Orden de Compra <Send size={15} /></>}</button>
              <p className="form-note">Al enviar, un asesor de Eurotruck revisará tu requerimiento y te contactará directamente. Teléfono Eurotruck: (809) 413-0846.</p>{afterHoursMessage && <p className="form-after-hours" role="status">{afterHoursMessage}</p>}{orderError && <p className="form-error" role="alert">{orderError}</p>}
            </form>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="catalog-backdrop" />
          <div className="container-wide catalog-content">
            <div className="catalog-heading"><div><SectionLabel>REPUESTOS GENUINOS &amp; OEM</SectionLabel><h2>Catálogo de Repuestos<br /><span>para Camiones Europeos</span></h2></div><p>Repuestos importados de Europa y Brasil, envíos por Caribe Express y auxilio mecánico directo a patio. Solicita tu cotización instantánea.</p></div>
            <div className="catalog-portal-search"><form className="catalog-search" onSubmit={submitCatalogSearch}><Search size={17} /><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="N.º de referencia, GTIN o descripción (DT, SA, OE, etc.)" /><button type="submit" aria-label="Buscar piezas"><Search size={16} /></button></form><button className="add-part-button" onClick={() => scrollToId("registro")}><Plus size={15} />Agregar Repuesto</button></div>
            <div className="filter-row"><div className="filter-group filter-group--applications"><span>Aplicaciones:</span>{catalogApplications.map((filter) => <button className={applicationFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setApplicationFilter(filter)}>{filter}</button>)}</div><div className="filter-group"><span>Marcas:</span>{catalogBrands.slice(0, 12).map((filter) => <button className={brandFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setBrandFilter(filter)}>{filter}</button>)}</div><div className="filter-group"><span>Grupos:</span>{catalogCategories.slice(0, 18).map((filter) => <button className={categoryFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setCategoryFilter(filter)}>{filter}</button>)}</div></div>
            <div className="catalog-result-head"><div><strong>{catalogLoading ? "Cargando catálogo..." : `${formatCount(filteredProducts.length)} Resultados encontrados`}</strong><span>El resultado puede restringirse mediante filtros.</span></div><div className="catalog-sort"><label htmlFor="catalog-sort-select">Ordenar por</label><select id="catalog-sort-select" defaultValue="score"><option value="score">Relevancia</option><option value="sku-asc">N.º artículo ascendente</option><option value="sku-desc">N.º artículo descendente</option><option value="name-asc">Descripción ascendente</option></select></div></div>
            <div className="catalog-meta"><span><PackageCheck size={14} />{catalogLoading ? "Cargando catálogo..." : `${formatCount(applicationResultCount)} resultados de la aplicación`}</span><span><Barcode size={14} />{catalogLoading ? "Cargando GTIN…" : `${Object.keys(gtinMap).length.toLocaleString("es-DO")} referencias con GTIN verificado`}</span></div>
            {catalogLoading && <div className="catalog-loading">Cargando las miniaturas y referencias de las aplicaciones...</div>}
            {catalogError && <div className="empty-catalog"><Search size={22} /><p>No fue posible cargar el índice Diesel Technic.</p><button onClick={() => window.location.reload()}>Reintentar</button></div>}
            {!catalogLoading && !catalogError && <>
            <div className="product-grid">{visibleProducts.map((product) => {
              const badges = product.badges.map((badge) => typeof badge === "string" ? badge : (badge.id || "PROMOCIÓN"));
              const productBadges = badges.length > 0 ? badges : (product.isProductPromotion ? ["PROMOCIÓN"] : []);
              return <article className="product-card" key={product.id}>
                <button className="product-open" onClick={() => setSelectedProduct(product)} aria-label={`Ver ${product.name}, referencia ${product.sku}`}>
                  <div className="product-visual product-visual--photo">{product.image ? <img src={product.image} alt={`${product.name} — ${product.sku}`} loading="lazy" /> : <div className="product-no-image"><PackageCheck size={38} /><span>Imagen no disponible en la fuente</span></div>}<span className="product-image-hint"><ArrowUpRight size={13} />Abrir imagen</span></div>
                  <div className="product-info"><div className="product-kicker"><span>{product.category}</span><span>{product.brand}</span><b>{product.sku}</b>{product.gtins?.length ? <small className="product-gtin-label"><Barcode size={11} />GTIN {product.gtins.join(" · ")}</small> : <small className="product-gtin-label product-gtin-label--missing"><Barcode size={11} />GTIN no registrado</small>}</div>{productBadges.length > 0 && <div className="product-badges">{productBadges.slice(0, 3).map((badge) => <span key={badge}>{badge}</span>)}</div>}<h3>{product.name}</h3><div className="product-source-facts"><span><small>Reemplaza</small>{product.replaces || "—"}</span><span><small>Adecuado para</small>{product.application}</span><span><small>Empaque</small>{product.packagingAmount} {product.salesUnit}</span><span><small>Precio neto</small>Bajo demanda</span></div><div className="product-footer"><span className="stock"><span className="status-dot" />{product.application}</span><span className="product-more">Más información <ArrowUpRight size={13} /></span></div></div>
                </button>
                <button className="product-add-button" onClick={() => addToCart(product)}><Plus size={13} />Agregar</button>
              </article>;
            })}</div>
            {filteredProducts.length === 0 && <div className="empty-catalog"><Search size={22} /><p>No encontramos una referencia con esos filtros.</p><button onClick={() => { setCatalogSearch(""); setBrandFilter("Todas las Marcas"); setCategoryFilter("Todas las Piezas"); }}>Limpiar filtros</button></div>}
            {filteredProducts.length > 0 && <><div className="catalog-bulk-actions"><label><input type="checkbox" />Seleccionar todo</label><button>Comparar producto</button><button>Añadir a bloc de notas</button><button onClick={() => scrollToId("registro")}><ShoppingCart size={13} />Añadir al carrito</button></div><div className="catalog-pagination"><button disabled={catalogPage === 1} onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}><ArrowLeft size={14} />Anterior</button><span>Página <b>{catalogPage}</b> de <b>{pageCount}</b></span><button disabled={catalogPage === pageCount} onClick={() => setCatalogPage((page) => Math.min(pageCount, page + 1))}>Siguiente<ArrowRight size={14} /></button></div></>}
            </>}
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="container-wide faq-layout"><div className="faq-side"><SectionLabel>PREGUNTAS FRECUENTES</SectionLabel><h2>Todo lo que necesitas saber sobre <span>Eurotruck</span></h2><p>Si no encuentras tu respuesta, escríbenos y un asesor te orientará según tu flota.</p><a href="mailto:eurotruckcxa@yahoo.com">Hablar con un asesor <ArrowUpRight size={14} /></a></div><div className="faq-main"><div className="faq-search"><Search size={16} /><input id="faq-search-input" value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder="Buscar en preguntas (ej: Caribe Express, Grúa, Kelvin, Marcas...)" /></div><div className="faq-list">{filteredFaqs.map(([question, answer]) => { const originalIndex = faqs.findIndex(([item]) => item === question); const isOpen = openFaq === originalIndex; return <div className={isOpen ? "faq-item is-open" : "faq-item"} key={question}><button onClick={() => setOpenFaq(isOpen ? null : originalIndex)}><span><b>{String(originalIndex + 1).padStart(2, "0")}</b>{question}</span><ChevronDown size={17} /></button>{isOpen && <p>{answer}</p>}</div>; })}</div></div></div>
        </section>
      </main>

      {cartOpen && <div className="cart-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="cart-drawer-head"><div><SectionLabel>COTIZACIÓN EUROTRUCK</SectionLabel><h2 id="cart-title">Tu solicitud de piezas</h2><p className="cart-drawer-subtitle">Revisa las referencias antes de enviarnos tus datos.</p></div><button autoFocus className="product-modal-close" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X size={17} /></button></div>{cartItems.length === 0 ? <div className="cart-empty"><ShoppingCart size={34} /><h3>Tu carrito está vacío</h3><p>Agrega piezas del catálogo para preparar una solicitud clara y recibir atención de nuestro equipo.</p><button className="modal-add-button" onClick={() => { setCartOpen(false); scrollToId("catalogo"); }}>Ver catálogo <ArrowRight size={14} /></button></div> : <><div className="cart-items">{cartItems.map((item) => <div className="cart-item" key={item.id}><div className="cart-item-image"><img src={item.image} alt="" /></div><div className="cart-item-copy"><b>{item.name}</b><small>{item.sku} · {item.application || "Aplicación general"}</small><span>{item.brand || "Referencia catalogada"}</span>{item.gtins?.length ? <small className="cart-item-gtin">GTIN {item.gtins.join(" · ")}</small> : null}<div className="cart-item-quantity" aria-label={`Cantidad de ${item.name}`}><button type="button" onClick={() => setCartItems((items) => items.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) } : cartItem))} aria-label={`Reducir cantidad de ${item.name}`}>−</button><b>{item.quantity}</b><button type="button" onClick={() => setCartItems((items) => items.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: Math.min(99, cartItem.quantity + 1) } : cartItem))} aria-label={`Aumentar cantidad de ${item.name}`}>+</button></div></div><button className="cart-item-remove" onClick={() => setCartItems((items) => items.filter((cartItem) => cartItem.id !== item.id))} aria-label={`Eliminar ${item.name}`}><X size={14} /></button></div>)}</div><div className="cart-summary"><div><span>Referencias seleccionadas</span><strong>{cartItems.length}</strong></div><div><span>Total de piezas</span><strong>{cartCount}</strong></div><div><span>Modalidad</span><strong>Cotización</strong></div></div><div className="cart-drawer-actions"><button className="cart-continue-button" onClick={() => { setCartOpen(false); scrollToId("catalogo"); }}><Plus size={15} />Agregar otra pieza</button><button className="cart-checkout-button" onClick={() => { setCartOpen(false); scrollToId("registro"); }}><ClipboardList size={15} />Continuar con mis datos</button></div></>}</aside></div>}

      {selectedProduct && <div className="product-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="product-modal-close" onClick={() => setSelectedProduct(null)} aria-label="Cerrar detalle"><X size={17} /></button><div className="product-modal-media">{selectedProduct.imageFull || selectedProduct.image ? <img src={selectedProduct.imageFull || selectedProduct.image} alt={`${selectedProduct.name} — ${selectedProduct.sku}`} /> : <div className="product-no-image"><PackageCheck size={48} /><span>Imagen no disponible en la fuente</span></div>}</div><div className="product-modal-copy"><SectionLabel>DETALLE DE REFERENCIA</SectionLabel><span className="product-modal-sku">{selectedProduct.sku}</span><h2 id="product-modal-title">{selectedProduct.name}</h2><p>{selectedProduct.description}</p><div className="product-modal-facts"><span><b>Marca</b>{selectedProduct.brand}</span><span><b>Aplicación</b>{selectedProduct.usage.slice(0, 3).join(", ") || selectedProduct.manufacturer || "Multibrand"}</span><span><b>Categoría</b>{selectedProduct.category}</span><span><b>Empaque</b>{selectedProduct.packagingAmount} {selectedProduct.salesUnit}</span><span><b>GTIN</b>{selectedProduct.gtins?.join(" · ") || "No registrado"}</span></div>{selectedProduct.replaces && <p className="product-modal-replaces"><b>Reemplaza:</b> {selectedProduct.replaces}</p>}<div className="product-modal-actions"><a className="modal-source-link" href={selectedProduct.url} target="_blank" rel="noreferrer">Ver artículo en Diesel Technic <ArrowUpRight size={14} /></a><button className="modal-add-button" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true); }}><Plus size={14} />Agregar a cotización</button></div></div></div></div>}

      <footer className="site-footer" id="contacto">
        <div className="footer-portal-strip"><div className="container-wide footer-portal-strip-inner"><span>EUROTRUCK / PORTAL DE PIEZAS</span><span>Consulta por referencia, descripción o aplicación</span><a href="mailto:eurotruckcxa@yahoo.com">Contactar HelpDesk <ArrowUpRight size={13} /></a></div></div>
        <div className="container-wide footer-portal-columns"><div><span>DIVISIONES</span><button onClick={() => scrollToId("catalogo")}>Recambios para Camión</button><button onClick={() => scrollToId("catalogo")}>Recambios para Trailer</button><button onClick={() => scrollToId("catalogo")}>Recambios para Autobús</button><button onClick={() => scrollToId("catalogo")}>Recambios para Furgoneta</button></div><div><span>GRUPOS DE PRODUCTOS</span><button onClick={() => setCategoryFilter("Motor")}>Motor</button><button onClick={() => setCategoryFilter("Sistema de freno")}>Sistema de freno</button><button onClick={() => setCategoryFilter("Sistema eléctrico")}>Sistema eléctrico</button><button onClick={() => setCategoryFilter("Suspensión")}>Suspensión</button></div><div><span>INFORMACIÓN</span><button onClick={() => scrollToId("faq")}>Preguntas frecuentes</button><button onClick={() => scrollToId("registro")}>Registrar empresa</button><button onClick={() => scrollToId("servicios")}>Servicio a domicilio</button><a href="mailto:eurotruckcxa@yahoo.com">Formulario de contacto</a><a href="/orders">Bandeja de empresa</a></div><div><span>PERFILES DE MARCA</span><button onClick={() => setBrandFilter("DT Spare Parts")}>DT Spare Parts</button><button onClick={() => setBrandFilter("SIEGEL Automotive")}>SIEGEL Automotive</button><a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer">Instagram</a></div></div>
        <div className="container-wide footer-main"><div className="footer-brand"><EurotruckLogo compact /><p>Tu aliado en la carretera. Repuestos europeos, mantenimiento y servicio técnico móvil para flotas que no pueden parar.</p><div className="footer-socials"><a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer"><Facebook size={15} /></a><a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer"><Instagram size={15} /></a><a href="mailto:eurotruckcxa@yahoo.com"><Mail size={15} /></a></div></div><div className="footer-column"><span>EXPLORA</span><button onClick={() => scrollToId("catalogo")}>Venta de Piezas <ChevronRight size={13} /></button><button onClick={() => scrollToId("servicios")}>Servicios <ChevronRight size={13} /></button><button onClick={() => scrollToId("faq")}>Preguntas Frecuentes <ChevronRight size={13} /></button></div><div className="footer-column"><span>CONTACTO DIRECTO</span><a href="tel:8098930258"><small>COTIZACIONES (KELVIN)</small>(809) 893-0258</a><a href="tel:8099499406"><small>RESCATE 24H &amp; TALLER</small>(809) 949-9406</a><a href="tel:8095911222"><small>OFICINA CENTRAL</small>(809) 591-1222</a></div><div className="footer-column footer-location"><span>OPERACIONES</span><p><MapPin size={15} />Santo Domingo, República Dominicana</p><p><Factory size={15} />Atención para flotas y empresas</p><a className="footer-mail" href="mailto:eurotruckcxa@yahoo.com"><Mail size={15} />eurotruckcxa@yahoo.com</a></div></div><div className="container-wide footer-bottom"><span>© 2026 Eurotruck Repuestos / Servicios</span><span>Precisión europea. Respuesta local.</span></div>
      </footer>


      <a className="floating-call" href="tel:8099499406"><Phone size={16} /><span>RESCATE 24H</span></a>
    </div>
  );
}
