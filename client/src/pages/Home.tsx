// Design system: réplica Eurotruck — industrial nocturno, contraste operativo, precisión modular y acciones visibles.
// La referencia visual manda: fondo carbón/vino, azul ruta eléctrica, amarillo operativo, verde de servicio y fotografía de camiones.
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
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

const products = [
  { id: "dt-liner-110090", brand: "Scania", code: "1.10090", name: "Camisa de cilindro de motor (con anillos de junta)", category: "Motor & Turbos", badges: ["Scania"], icon: Cog },
  { id: "dt-gasket-210050", brand: "Volvo", code: "2.10050", name: "Juego de juntas de culata / empaquetadura", category: "Motor & Turbos", badges: ["Volvo", "Renault Trucks"], icon: ShieldCheck },
  { id: "dt-piston-461905", brand: "Mercedes-Benz", code: "4.61905", name: "Pistón completo de motor", category: "Motor & Turbos", badges: ["Mercedes-Benz"], icon: CircleDot },
  { id: "dt-valve-intake-110111", brand: "Scania", code: "1.10111", name: "Válvula de admisión de motor", category: "Motor & Turbos", badges: ["Scania"], icon: Zap },
  { id: "dt-valve-exhaust-110112", brand: "Scania", code: "1.10112", name: "Válvula de escape de motor (blindada)", category: "Motor & Turbos", badges: ["Scania"], icon: Cog },
  { id: "dt-oilpump-212150", brand: "Volvo", code: "2.12150", name: "Bomba de aceite de engranajes de motor", category: "Motor & Turbos", badges: ["Volvo", "Renault Trucks"], icon: BatteryCharging },
  { id: "dt-waterpump-461520", brand: "Mercedes-Benz", code: "4.61520", name: "Bomba de agua de refrigeración de motor", category: "Motor & Turbos", badges: ["Mercedes-Benz"], icon: PackageCheck },
  { id: "dt-camshaft-460150", brand: "Mercedes-Benz", code: "4.60150", name: "Árbol de levas de distribución", category: "Motor & Turbos", badges: ["Mercedes-Benz"], icon: Cog },
  { id: "dt-bearing-111200", brand: "Scania", code: "1.11200", name: "Juego de cojinetes de biela (estándar)", category: "Motor & Turbos", badges: ["Scania"], icon: CircleDot },
  { id: "dt-injector-213050", brand: "Volvo", code: "2.13050", name: "Inyector bomba unitario / Inyector Diésel", category: "Eléctrico 24V", badges: ["Volvo", "Renault Trucks"], icon: BatteryCharging },
  { id: "dt-tensioner-115105", brand: "Scania", code: "1.15105", name: "Polea tensora de correa de accesorios (automático)", category: "Aire & Suspensión", badges: ["Scania"], icon: CircleDot },
  { id: "dt-cooler-312050", brand: "MAN", code: "3.12050", name: "Intercambiador térmico / Enfriador de aceite de motor", category: "Aire & Suspensión", badges: ["MAN"], icon: Box },
];

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

export default function Home() {
  const [activeBrand, setActiveBrand] = useState<TruckBrand>("MERCEDES-BENZ");
  const [outgoingBrand, setOutgoingBrand] = useState<TruckBrand | null>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isSliding, setIsSliding] = useState(false);
  const slideTimerRef = useRef<number | undefined>(undefined);
  const [isFleetPaused, setIsFleetPaused] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [language, setLanguage] = useState<"ES" | "EN">("ES");
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("Todas las Marcas");
  const [categoryFilter, setCategoryFilter] = useState("Todas las Piezas");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeIndex = brands.indexOf(activeBrand);
  const filteredProducts = useMemo(() => products.filter((product) => {
    const haystack = `${product.name} ${product.brand} ${product.code}`.toLowerCase();
    return (!catalogSearch || haystack.includes(catalogSearch.toLowerCase())) &&
      (brandFilter === "Todas las Marcas" || product.brand === brandFilter) &&
      (categoryFilter === "Todas las Piezas" || product.category === categoryFilter);
  }), [catalogSearch, brandFilter, categoryFilter]);

  const filteredFaqs = useMemo(() => faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(faqSearch.toLowerCase())), [faqSearch]);

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

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company.trim()) return;
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 7000);
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-glow" />
        <div className="header-top container-wide">
          <button className="brand-button" onClick={() => scrollToId("inicio")} aria-label="Volver al inicio"><EurotruckLogo /></button>
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
              <button className="cart-button" onClick={() => scrollToId("catalogo")}><ShoppingCart size={14} />Carrito <b>{cartCount}</b></button>
            </div>
            <div className="contact-lines">
              <a href="tel:8098930258"><span>COTIZACIONES (KELVIN)</span><strong>(809) 893-0258</strong></a>
              <a className="contact-lines--green" href="tel:8099499406"><span>RESCATE 24H &amp; TALLER</span><strong>(809) 949-9406</strong></a>
              <a href="tel:8095911222"><span>OFICINA CENTRAL</span><strong>(809) 591-1222</strong></a>
            </div>
          </div>
          <button className="mobile-menu-button" onClick={() => setMobileNav((value) => !value)} aria-label="Abrir menú">{mobileNav ? <X /> : <Menu />}</button>
        </div>
        <nav className={`main-nav container-wide ${mobileNav ? "main-nav--open" : ""}`} aria-label="Navegación principal">
          {[['Inicio', 'inicio'], ['Venta de Piezas', 'catalogo'], ['Servicio a Domicilio', 'registro'], ['Marcas', 'hero-fleet'], ['Preguntas Frecuentes', 'faq'], ['Contacto', 'contacto']].map(([label, id], index) => (
            <button key={id} className={index === 0 ? "nav-active" : ""} onClick={() => { scrollToId(id); setMobileNav(false); }}>{label}</button>
          ))}
        </nav>
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
              <div className="form-grid"><label>RNC <small>(Registro Nacional de Contribuyentes)</small><input id="reg-rnc-input" placeholder="Ej. 131-12345-6 o 101123456" /></label><label>Número de Teléfono / WhatsApp <b>*</b><input id="reg-phone-input" required placeholder="Ej. (809) 893-0258" /></label></div>
              <div className="form-grid"><label>Correo Electrónico<input id="reg-email-input" type="email" placeholder="Ej. compras@tuempresa.com" /></label><label>Marca de Camión Principal<select id="reg-brand-select" defaultValue="Multi-Flota / Todas"><option>Scania</option><option>Volvo</option><option>Mercedes-Benz</option><option>MAN</option><option>Iveco</option><option>Multi-Flota / Todas</option></select></label></div>
              <label>Piezas que necesitas <small>(Opcional)</small><input id="reg-parts-input" placeholder="Ej. Kit de embrague, filtros de aceite, disco de frenos..." /></label>
              <label className="checkbox-label"><input id="reg-onsite-service-checkbox" type="checkbox" /> <span className="fake-checkbox"><Check size={12} /></span>Requiero también servicio mecánico o instalación a domicilio</label>
              <button className="submit-button" type="submit">{submitted ? <><Check size={16} />Registro recibido — te contactaremos</> : <>Guardar Registro y Pedir Piezas <Send size={15} /></>}</button>
              <p className="form-note">Al enviar, un asesor de Eurotruck revisará tu requerimiento y te contactará directamente.</p>
            </form>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="catalog-backdrop" />
          <div className="container-wide catalog-content">
            <div className="catalog-heading"><div><SectionLabel>REPUESTOS GENUINOS &amp; OEM</SectionLabel><h2>Catálogo de Repuestos<br /><span>para Camiones Europeos</span></h2></div><p>Repuestos importados de Europa y Brasil, envíos por Caribe Express y auxilio mecánico directo a patio. Solicita tu cotización instantánea.</p></div>
            <div className="catalog-toolbar"><div className="catalog-search"><Search size={17} /><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Buscar pieza, código o marca..." /></div><button className="add-part-button" onClick={() => scrollToId("registro")}><Plus size={15} />Agregar Repuesto</button></div>
            <div className="filter-row"><div className="filter-group"><span>Marca:</span>{["Todas las Marcas", "Scania", "Volvo", "Mercedes-Benz", "MAN", "Iveco"].map((filter) => <button className={brandFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setBrandFilter(filter)}>{filter}</button>)}</div><div className="filter-group"><span>Categoría:</span>{["Todas las Piezas", "Embragues", "Frenos", "Motor & Turbos", "Aire & Suspensión", "Eléctrico 24V"].map((filter) => <button className={categoryFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setCategoryFilter(filter)}>{filter}</button>)}</div></div>
            <div className="catalog-meta"><span><PackageCheck size={14} />{filteredProducts.length} referencias disponibles para cotización</span><span><span className="status-dot" />Actualizado para tu operación</span></div>
            <div className="product-grid">{filteredProducts.map((product) => { const Icon = product.icon; return <article className="product-card" key={product.id}><div className="product-visual"><div className="product-visual-glow" /><Icon size={49} strokeWidth={1.1} /><span>SUBIR FOTO</span><small>Presiona para usar cámara o galería</small></div><div className="product-info"><div className="product-kicker"><span>CATEGORÍA M01: MOTOR</span><span>DT Spare Parts</span><b>{product.code}</b></div><div className="product-badges">{product.badges.map((badge) => <span key={badge}>{badge}</span>)}</div><h3>{product.name}</h3><div className="product-footer"><span className="stock"><span className="status-dot" />En Stock</span><button onClick={() => setCartCount((count) => count + 1)}><Plus size={13} />Agregar</button></div></div></article>; })}</div>
            {filteredProducts.length === 0 && <div className="empty-catalog"><Search size={22} /><p>No encontramos una referencia con esos filtros.</p><button onClick={() => { setCatalogSearch(""); setBrandFilter("Todas las Marcas"); setCategoryFilter("Todas las Piezas"); }}>Limpiar filtros</button></div>}
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="container-wide faq-layout"><div className="faq-side"><SectionLabel>PREGUNTAS FRECUENTES</SectionLabel><h2>Todo lo que necesitas saber sobre <span>Eurotruck</span></h2><p>Si no encuentras tu respuesta, escríbenos y un asesor te orientará según tu flota.</p><a href="mailto:eurotruckcxa@yahoo.com">Hablar con un asesor <ArrowUpRight size={14} /></a></div><div className="faq-main"><div className="faq-search"><Search size={16} /><input id="faq-search-input" value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder="Buscar en preguntas (ej: Caribe Express, Grúa, Kelvin, Marcas...)" /></div><div className="faq-list">{filteredFaqs.map(([question, answer]) => { const originalIndex = faqs.findIndex(([item]) => item === question); const isOpen = openFaq === originalIndex; return <div className={isOpen ? "faq-item is-open" : "faq-item"} key={question}><button onClick={() => setOpenFaq(isOpen ? null : originalIndex)}><span><b>{String(originalIndex + 1).padStart(2, "0")}</b>{question}</span><ChevronDown size={17} /></button>{isOpen && <p>{answer}</p>}</div>; })}</div></div></div>
        </section>
      </main>

      <footer className="site-footer" id="contacto">
        <div className="container-wide footer-main"><div className="footer-brand"><EurotruckLogo compact /><p>Tu aliado en la carretera. Repuestos europeos, mantenimiento y servicio técnico móvil para flotas que no pueden parar.</p><div className="footer-socials"><a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer"><Facebook size={15} /></a><a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer"><Instagram size={15} /></a><a href="mailto:eurotruckcxa@yahoo.com"><Mail size={15} /></a></div></div><div className="footer-column"><span>EXPLORA</span><button onClick={() => scrollToId("catalogo")}>Venta de Piezas <ChevronRight size={13} /></button><button onClick={() => scrollToId("servicios")}>Servicios <ChevronRight size={13} /></button><button onClick={() => scrollToId("faq")}>Preguntas Frecuentes <ChevronRight size={13} /></button></div><div className="footer-column"><span>CONTACTO DIRECTO</span><a href="tel:8098930258"><small>COTIZACIONES (KELVIN)</small>(809) 893-0258</a><a href="tel:8099499406"><small>RESCATE 24H &amp; TALLER</small>(809) 949-9406</a><a href="tel:8095911222"><small>OFICINA CENTRAL</small>(809) 591-1222</a></div><div className="footer-column footer-location"><span>OPERACIONES</span><p><MapPin size={15} />Santo Domingo, República Dominicana</p><p><Factory size={15} />Atención para flotas y empresas</p><a className="footer-mail" href="mailto:eurotruckcxa@yahoo.com"><Mail size={15} />eurotruckcxa@yahoo.com</a></div></div><div className="container-wide footer-bottom"><span>© 2026 Eurotruck Repuestos / Servicios</span><span>Precisión europea. Respuesta local.</span></div>
      </footer>

      <div className={`assistant-widget ${assistantOpen ? "assistant-widget--open" : ""}`}>
        {assistantOpen && <div className="assistant-panel"><div className="assistant-head"><div className="assistant-avatar"><img src="/manus-storage/eurotruck-mark_a4622014.png" alt="" /></div><div><b>Rino Asistente</b><span><i /> Eurotruck</span></div><button onClick={() => setAssistantOpen(false)} aria-label="Cerrar asistente"><X size={13} /></button></div><p>¡Buenas tardes! Soy Rino, tu asistente mecánico. ¿Buscas repuestos o necesitas servicio a domicilio?</p><button className="assistant-primary" onClick={() => scrollToId("registro")}>Preguntarle a Rino <ChevronRight size={14} /></button><div className="assistant-actions"><button onClick={() => scrollToId("catalogo")}><ShoppingCart size={13} />Carrito de Pedidos <small>({cartCount})</small></button><button onClick={() => scrollToId("registro")}><ClipboardList size={13} />Registrar Empresa</button></div><small className="assistant-hint">Puedes arrastrarme por la pantalla</small></div>}
        <button className="assistant-trigger" onClick={() => setAssistantOpen((value) => !value)} aria-label="Abrir Rino Asistente"><img src="/manus-storage/eurotruck-mark_a4622014.png" alt="Rino Asistente" /><span><MessageCircle size={15} /></span></button>
      </div>

      <a className="floating-call" href="tel:8099499406"><Phone size={16} /><span>RESCATE 24H</span></a>
    </div>
  );
}
