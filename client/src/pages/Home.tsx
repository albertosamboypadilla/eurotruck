// Design system: réplica Eurotruck — industrial nocturno, contraste operativo, precisión modular y acciones visibles.
// La referencia visual manda: fondo carbón/vino, azul ruta eléctrica, amarillo operativo, verde de servicio y fotografía de camiones.
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { attachGtins, productMatchesCatalogQuery, type GtinMap } from "@shared/gtinHelpers";
import { getOrderFormValidationError } from "@shared/orderFormHelpers";
import { isInventorySaleConfirmationKey } from "@shared/inventoryHelpers";
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

const brandMetaEnglish: Record<TruckBrand, { copy: string; chips: string[]; dot: string }> = {
  SCANIA: { copy: "Swedish power for the miles that cannot stop", chips: ["Engine parts", "Brake systems", "Heavy-duty diagnostics"], dot: "#2d76ff" },
  VOLVO: { copy: "Safety, performance and control on every journey", chips: ["I-Shift transmission", "ABS brakes", "Air suspension"], dot: "#34a8ff" },
  "MERCEDES-BENZ": { copy: "Precision Engineering and MirrorCam Technology", chips: ["Telemetry sensors", "Brake discs and pads", "Air compressors"], dot: "#f4f7fb" },
  MAN: { copy: "German efficiency for fleets that mean business", chips: ["Turbos and engines", "Air systems", "Mobile maintenance"], dot: "#f6b51e" },
  IVECO: { copy: "European response for cargo, routes and continuous service", chips: ["OEM components", "Electrical parts", "24/7 roadside assistance"], dot: "#ee4b59" },
};

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
  internalCode?: string;
  barcode?: string;
};

type PublicInventoryLocation = { productId: string; totalQuantity: number; lastTramo: string | null; lastGondola: string | null; salePrice: string };

const catalogFileUrl = "/manus-storage/catalog-with-internal-codes_ba8546a7.json";
const gtinMapFileUrl = "/manus-storage/diesel-gtin-map-bombillas-merged_7d3b08a9.json";
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
] as const;

const faqsEnglish = [
  ["Which parts brands do you sell?", "We work with parts for Scania, Volvo, Mercedes-Benz, MAN and Iveco, plus compatible Renault Trucks references and selected OEM alternatives."],
  ["Do you ship?", "We coordinate deliveries through Caribe Express and partner carriers. Confirm availability and destination when requesting your quote."],
  ["Where do the parts come from?", "We import genuine parts and OEM alternatives from Europe and Brazil, with brand and reference traceability for every order."],
  ["What services do you offer?", "Parts sales, preventive and corrective maintenance, diagnostics, installation and mobile mechanical assistance for fleets."],
  ["Can you assist at my company?", "Yes. We coordinate visits to yards, workshops and operating centers according to your fleet's needs."],
  ["Do you offer roadside rescue?", "We provide 24-hour roadside rescue and a mobile workshop. Call Jose Steven at (809) 949-9406 for roadside assistance."],
  ["How can I contact you?", "For quotes call Kelvin at (809) 893-0258, for the office call (809) 591-1222, or email eurotruckcxa@yahoo.com."],
] as const;

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
  const [language, setLanguage] = useState<"ES" | "EN">(() => {
    if (typeof window === "undefined") return "ES";
    return window.localStorage.getItem("eurotruck-language") === "EN" ? "EN" : "ES";
  });
  const t = (es: string, en: string) => language === "EN" ? en : es;
  const localizedBrandMeta = language === "EN" ? brandMetaEnglish : brandMeta;
  const translateFilter = (value: string) => language === "EN" ? ({ "Todas las aplicaciones": "All applications", "Todas las Marcas": "All brands", "Todas las Piezas": "All parts" }[value] || value) : value;
  const localizedFaqs = language === "EN" ? faqsEnglish : faqs;
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
  const [saleProduct, setSaleProduct] = useState<CatalogProduct | null>(null);
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleKey, setSaleKey] = useState("");
  const [saleError, setSaleError] = useState("");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const createOrderMutation = trpc.orders.create.useMutation();
  const recordSaleMutation = trpc.inventory.recordSale.useMutation({
    onSuccess: () => {
      setSaleProduct(null);
      setSaleKey("");
      setSaleQuantity("1");
      setSaleError("");
      void publicInventoryLocationsQuery.refetch();
    },
    onError: error => setSaleError(error.message || t("No se pudo descontar la existencia.", "Could not decrease stock.")),
  });
  const publicInventoryLocationsQuery = trpc.inventory.publicLocations.useQuery(undefined, { staleTime: 5_000, refetchInterval: 5_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true, retry: 1 });
  const inventoryLocations = useMemo(() => new Map((publicInventoryLocationsQuery.data || []).map((location: PublicInventoryLocation) => [location.productId, location] as const)), [publicInventoryLocationsQuery.data]);

  function confirmPublicSale() {
    if (!saleProduct) return;
    if (!isInventorySaleConfirmationKey(saleKey)) { setSaleError(t("Clave incorrecta. No se descontó inventario.", "Incorrect key. Inventory was not changed.")); return; }
    const parsedQuantity = Number(saleQuantity);
    const stock = inventoryLocations.get(saleProduct.id)?.totalQuantity || 0;
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > stock) { setSaleError(t("Indica una cantidad válida, menor o igual a la existencia.", "Enter a valid quantity no greater than available stock.")); return; }
    recordSaleMutation.mutate({ productId: saleProduct.id, sku: saleProduct.sku, quantity: parsedQuantity, source: "manual", confirmationKey: saleKey });
  }

  function addToCart(product: CatalogProduct) {
    setCartItems((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, 99) } : item);
      return [...items, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
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

  const filteredFaqs = useMemo(() => localizedFaqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(faqSearch.toLowerCase())), [faqSearch, localizedFaqs]);

  useEffect(() => {
    window.localStorage.setItem("eurotruck-language", language);
  }, [language]);

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
    if (!selectedProduct && !cartOpen && !saleProduct) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
        setCartOpen(false);
        setSaleProduct(null);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct, cartOpen, saleProduct]);

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
    const validationError = getOrderFormValidationError({ company, email: customerEmail, phone: customerPhone, itemCount: cartItems.length });
    if (validationError) {
      const validationErrorEnglish: Record<string, string> = {
        "Escribe el nombre de la empresa o flota.": "Enter the company or fleet name.",
        "Escribe el correo electrónico del cliente.": "Enter the customer's email.",
        "Ingresa un correo electrónico válido.": "Enter a valid email address.",
        "Escribe el teléfono o WhatsApp del cliente.": "Enter the customer's phone or WhatsApp number.",
        "Agrega al menos una pieza al carrito antes de generar la orden.": "Add at least one part to the cart before generating the quote.",
      };
      setOrderError(language === "EN" ? validationErrorEnglish[validationError] || validationError : validationError);
      if (cartItems.length === 0) window.setTimeout(() => scrollToId("catalogo"), 0);
      return;
    }
    try {
      const result = await createOrderMutation.mutateAsync({ company: company.trim(), email: customerEmail.trim(), phone: customerPhone.trim(), rnc: customerRnc.trim() || undefined, truckBrand, partsNote: partsNote.trim() || undefined, items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity, sku: item.sku, name: item.name, brand: item.brand, application: item.application, category: item.category, image: item.image, sourceUrl: item.url, unitPrice: Number(inventoryLocations.get(item.id)?.salePrice || 0) })) });
      const bytes = Uint8Array.from(atob(result.pdfBase64), character => character.charCodeAt(0));
      const downloadUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${result.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setSubmittedOrder(result.orderNumber);
      setAfterHoursMessage(language === "EN" ? (result.afterHoursMessageEn || "") : (result.afterHoursMessage || ""));
      setSubmitted(true);
      setCartItems([]);
      setCartOpen(false);
      window.setTimeout(() => setSubmitted(false), 10000);
    } catch (error) {
      console.error("[Order submission]", error);
      setOrderError(t("No pudimos registrar la cotización. Revisa los datos e inténtalo nuevamente.", "We could not register the quote. Check the details and try again."));
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-glow" />
        <div className="header-top container-wide">
          <button className="brand-button" onClick={() => scrollToId("inicio")} aria-label={t("Volver al inicio", "Back to home")}><EurotruckLogo /></button>
          <form className="portal-header-search" onSubmit={submitCatalogSearch}><span>{t("Buscar piezas", "Search parts")}</span><div><input aria-label={t("Buscar piezas", "Search parts")} value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder={t("N.º de referencia o nombre de pieza", "Part number or part name")} /><button type="submit" aria-label={t("Buscar en el catálogo", "Search catalog")}><Search size={19} /></button></div></form>
          <div className="header-tools">
            <div className="contact-email"><Mail size={13} /><a href="mailto:eurotruckcxa@yahoo.com">eurotruckcxa@yahoo.com</a></div>
            <div className="utility-row">
              <div className="socials" aria-label="Redes sociales">
                <a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={13} /></a>
                <a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={13} /></a>
                <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok"><Sparkles size={13} /></a>
                <button onClick={() => scrollToId("contacto")} aria-label={t("Ubicación", "Location")}><MapPin size={13} /></button>
              </div>
              <div className="language-switch" aria-label={t("Selector de idioma", "Language selector")}>
                <button className={language === "ES" ? "is-selected" : ""} onClick={() => setLanguage("ES")}>ES</button>
                <button className={language === "EN" ? "is-selected" : ""} onClick={() => setLanguage("EN")}>EN</button>
              </div>
              <a className="company-access-button" href="/orders" aria-label={t("Abrir acceso de empresa y cotizaciones", "Open company access and quotes")}><ShieldCheck size={14} />{t("Acceso empresa", "Company access")}</a><a className="company-access-button company-access-button--inventory" href="/inventory" aria-label={t("Abrir Inventario", "Open Inventory")}><PackageCheck size={14} />{t("Inventario", "Inventory")}</a><button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingCart size={14} />{t("Carrito", "Cart")} <b>{cartCount}</b></button>
            </div>
            <div className="contact-lines">
              <a href="tel:8098930258"><span>COTIZACIONES (KELVIN)</span><strong>(809) 893-0258</strong></a>
              <a className="contact-lines--green" href="tel:8099499406"><span>RESCATE 24H &amp; TALLER</span><strong>(809) 949-9406</strong></a>
              <a href="tel:8095911222"><span>OFICINA CENTRAL</span><strong>(809) 591-1222</strong></a>
            </div>
          </div>
          <a className="mobile-company-access-top" href="/orders" aria-label={t("Abrir acceso empresa", "Open company access")}><ShieldCheck size={16} /></a><button className="mobile-menu-button" onClick={() => setMobileNav((value) => !value)} aria-label={t("Abrir menú", "Open menu")}>{mobileNav ? <X /> : <Menu />}</button>
        </div>
        <nav className={`main-nav container-wide ${mobileNav ? "main-nav--open" : ""}`} aria-label={t("Navegación principal", "Main navigation")}><div className="portal-nav-links">{[[t("Inicio", "Home"), "inicio"], [t("Venta de Piezas", "Parts sales"), "catalogo"], [t("Servicio a Domicilio", "On-site service"), "registro"], [t("Marcas", "Brands"), "hero-fleet"], [t("Preguntas Frecuentes", "FAQ"), "faq"], [t("Contacto", "Contact"), "contacto"]].map(([label, id], index) => <button key={id} className={index === 0 ? "nav-active" : ""} onClick={() => { scrollToId(id); setMobileNav(false); }}>{label}</button>)}</div><a className="mobile-company-access" href="/orders"><ShieldCheck size={14} />{t("Acceso empresa / Cotizaciones", "Company access / Quotes")}</a><a className="mobile-company-access mobile-company-access--inventory" href="/inventory"><PackageCheck size={14} />{t("Inventario", "Inventory")}</a></nav>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-atmosphere" />
          <div className="hero-content container-wide">
            <SectionLabel>{t("ESPECIALISTAS EN CAMIONES EUROPEOS", "EUROPEAN TRUCK SPECIALISTS")}</SectionLabel>
            <h1>{t("Venta de Piezas, Mantenimiento y", "Parts Sales, Maintenance and")}<br className="desktop-break" /> {t("Reparación a Domicilio", "On-site Repairs")}</h1>
            <p className="hero-intro">{t("Repuestos genuinos para Scania, Volvo, MAN, Iveco y Mercedes-Benz con servicio", "Genuine parts for Scania, Volvo, MAN, Iveco and Mercedes-Benz with mobile")}<br className="desktop-break" /> {t("técnico móvil donde tú estés.", "technical service wherever you are.")}</p>
            <div className="brand-pills" role="tablist" aria-label={t("Seleccionar marca de camión", "Select truck brand")}>
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
            <button className="fleet-arrow fleet-arrow--left" onClick={() => stepBrand(-1)} aria-label={t("Camión anterior", "Previous truck")}><ArrowLeft size={18} /></button>
            <button className="fleet-arrow fleet-arrow--right" onClick={() => stepBrand(1)} aria-label={t("Siguiente camión", "Next truck")}><ArrowRight size={18} /></button>
            <div className="fleet-caption">
              <span className="fleet-title">{activeBrand}</span>
              <p>{localizedBrandMeta[activeBrand].copy}</p>
              <div className="feature-chips">{localizedBrandMeta[activeBrand].chips.map((chip) => <span key={chip}><Check size={11} />{chip}</span>)}</div>
            </div>
            <div className="hero-ctas">
              <button className="cta cta-blue" onClick={() => scrollToId("catalogo")}><Box size={15} />{t("Cotizar Repuestos", "Request a Parts Quote")}</button>
              <button className="cta cta-green" onClick={() => scrollToId("registro")}><ClipboardList size={15} />{t("Preparar Cotización", "Prepare Quote")}</button>
              <a className="cta cta-yellow" href="tel:8099499406"><Wrench size={15} />{t("Solicitar Servicio a Domicilio", "Request On-site Service")}</a>
            </div>
          </div>

          <div className="fleet-deck container-wide" aria-label={t("Selector visual de camiones", "Visual truck selector")}>
            <p>{t("Toca cualquier camión para moverlo al frente:", "Tap any truck to bring it forward:")}</p>
            <div className="deck-items">
              {brands.map((brand) => <button className={brand === activeBrand ? "deck-card is-active" : "deck-card"} key={brand} onClick={() => changeBrand(brand)}><img src={truckImages[brand]} alt={brand} /><span>{brand}</span></button>)}
            </div>
          </div>
        </section>

        <section className="service-section section-dark" id="servicios">
          <div className="container-wide">
            <div className="services-intro">
              <div><SectionLabel>{t("EUROTRUCK EN MOVIMIENTO", "EUROTRUCK IN MOTION")}</SectionLabel><h2>{t("La ruta no se detiene.", "The road never stops.")}<br /><em>{t("Tu operación tampoco.", "Neither does your operation.")}</em></h2></div>
              <p>{t("Desde la pieza correcta hasta el diagnóstico que resuelve el problema, acompañamos a tu flota en cada tramo con respuesta técnica y atención directa.", "From the right part to the diagnosis that solves the problem, we support your fleet every mile with technical response and direct attention.")}</p>
            </div>
            <div className="service-grid">
              <article className="service-card"><div className="service-icon"><Boxes /></div><span className="service-index">01 / PARTS</span><h3>{t("Venta de Piezas y Repuestos", "Parts and Spares Sales")}</h3><p>{t("Stock certificado de piezas originales y alternativas OEM para todas las líneas europeas.", "Certified stock of genuine parts and OEM alternatives for all European lines.")}</p><button onClick={() => scrollToId("catalogo")}>{t("Explorar catálogo", "Explore catalog")} <ArrowUpRight size={14} /></button></article>
              <article className="service-card"><div className="service-icon"><Cog /></div><span className="service-index">02 / WORKSHOP</span><h3>{t("Mantenimiento Preventivo y Correctivo", "Preventive and Corrective Maintenance")}</h3><p>{t("Diagnóstico por computadora, ajustes de motor, frenos, transmisión y sistemas neumáticos.", "Computer diagnostics, engine tuning, brakes, transmissions and pneumatic systems.")}</p><button onClick={() => scrollToId("registro")}>{t("Coordinar mantenimiento", "Schedule maintenance")} <ArrowUpRight size={14} /></button></article>
              <article className="service-card service-card--image"><div className="service-card-image" /><div className="service-card-shade" /><div className="service-card-copy"><div className="service-icon"><Phone /></div><span className="service-index">03 / 24·7 ASSISTANCE</span><h3>{t("Servicio a Domicilio y Auxilio 24/7", "On-site Service and 24/7 Rescue")}</h3><p>{t("Unidades móviles con mecánicos equipados para reparar directo en tus instalaciones o en carretera.", "Mobile units with equipped mechanics to repair at your facility or on the road.")}</p><a href="tel:8099499406">{t("Llamar a rescate", "Call roadside rescue")} <ArrowUpRight size={14} /></a></div></article>
            </div>
          </div>
        </section>

        <section className="registration-section" id="registro">
          <div className="container-wide registration-layout">
            <div className="registration-copy"><SectionLabel>{t("SOLICITUD RÁPIDA DE COTIZACIÓN", "QUICK QUOTE REQUEST")}</SectionLabel><h2>{t("Registra tu Empresa", "Register Your Company")}<br /><span>{t("para Cotizar Piezas", "to Quote Parts")}</span></h2><p>{t("Solo necesitamos estos datos para preparar tu cotización y confirmar disponibilidad.", "We only need these details to prepare your quote and confirm availability.")}</p><div className="registration-promises"><span><Check size={14} />{t("Atención prioritaria y confirmación de existencias", "Priority service and stock confirmation")}</span><span><Check size={14} />{t("Opción de instalación en taller o a domicilio", "Workshop or on-site installation available")}</span></div><div className="registration-photo"><div /><small>{t("RESPUESTA DIRECTA PARA TU FLOTA", "DIRECT RESPONSE FOR YOUR FLEET")}</small></div></div>
            <form className="registration-form" onSubmit={submitRegistration}>
              <div className="form-heading"><span>01</span><p>{t("Completa la información de tu operación", "Complete your fleet information")}</p></div>
              <label>{t("Nombre de la Empresa o Flota", "Company or Fleet Name")} <b>*</b><input id="reg-company-input" required value={company} onChange={(event) => setCompany(event.target.value)} placeholder={t("Ej. Transportes del Caribe SRL", "E.g. Caribbean Transport SRL")} /></label>
              <div className="form-grid"><label>RNC <small>{t("(Registro Nacional de Contribuyentes)", "(Taxpayer Registration Number)")}</small><input id="reg-rnc-input" value={customerRnc} onChange={(event) => setCustomerRnc(event.target.value)} placeholder={t("Ej. 131-12345-6 o 101123456", "E.g. 131-12345-6 or 101123456")} /></label><label>{t("Número de Teléfono / WhatsApp", "Phone / WhatsApp Number")} <b>*</b><input id="reg-phone-input" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder={t("Ej. (809) 893-0258", "E.g. (809) 893-0258")} /></label></div>
              <div className="form-grid"><label>{t("Correo Electrónico", "Email")}<input id="reg-email-input" required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder={t("Ej. compras@tuempresa.com", "E.g. purchasing@yourcompany.com")} /></label><label>{t("Marca de Camión Principal", "Main Truck Brand")}<select id="reg-brand-select" value={truckBrand} onChange={(event) => setTruckBrand(event.target.value)}><option>Scania</option><option>Volvo</option><option>Mercedes-Benz</option><option>MAN</option><option>Iveco</option><option>Multi-Flota / Todas</option></select></label></div>
              <label>{t("Piezas que necesitas", "Parts you need")} <small>{t("(Opcional)", "(Optional)")}</small><input id="reg-parts-input" value={partsNote} onChange={(event) => setPartsNote(event.target.value)} placeholder={t("Ej. Kit de embrague, filtros de aceite, disco de frenos...", "E.g. clutch kit, oil filters, brake disc...")} /></label>
              <label className="checkbox-label"><input id="reg-onsite-service-checkbox" type="checkbox" /> <span className="fake-checkbox"><Check size={12} /></span>{t("Requiero también servicio mecánico o instalación a domicilio", "I also need mechanical service or on-site installation")}</label>
              <button className="submit-button" type="submit" disabled={createOrderMutation.isPending}>{submitted ? <><Check size={16} />{t(`Cotización ${submittedOrder} descargada — te contactaremos`, `Quote ${submittedOrder} downloaded — we will contact you`)}</> : createOrderMutation.isPending ? <>{t("Generando cotización…", "Generating quote…")}</> : <>{t("Enviar solicitud y descargar cotización", "Send request and download quote")} <Send size={15} /></>}</button>
              <p className="form-note">{t("Al enviar, un asesor de Eurotruck revisará tu requerimiento y te contactará directamente. Teléfono Eurotruck: (809) 413-0846.", "After you send it, a Eurotruck advisor will review your request and contact you directly. Eurotruck phone: (809) 413-0846.")}</p>{afterHoursMessage && <p className="form-after-hours" role="status">{afterHoursMessage}</p>}{orderError && <p className="form-error" role="alert">{orderError}</p>}
            </form>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="catalog-backdrop" />
          <div className="container-wide catalog-content">
            <div className="catalog-heading"><div><SectionLabel>{t("REPUESTOS GENUINOS & OEM", "GENUINE & OEM PARTS")}</SectionLabel><h2>{t("Catálogo de Repuestos", "Parts Catalog")}<br /><span>{t("para Camiones Europeos", "for European Trucks")}</span></h2></div><p>{t("Repuestos importados de Europa y Brasil, envíos por Caribe Express y auxilio mecánico directo a patio. Solicita tu cotización instantánea.", "Parts imported from Europe and Brazil, shipping through Caribe Express and direct roadside assistance. Request your instant quote.")}</p></div>
            <div className="catalog-portal-search"><form className="catalog-search" onSubmit={submitCatalogSearch}><Search size={17} /><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder={t("N.º de referencia o nombre de pieza", "Part number or part name")} /><button type="submit" aria-label="Buscar piezas"><Search size={16} /></button></form><button className="add-part-button" onClick={() => scrollToId("registro")}><Plus size={15} />{t("Agregar Repuesto", "Add Part")}</button></div>
            <div className="filter-row"><div className="filter-group filter-group--applications"><span>{t("Aplicaciones:", "Applications:")}</span>{catalogApplications.map((filter) => <button className={applicationFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setApplicationFilter(filter)}>{translateFilter(filter)}</button>)}</div><div className="filter-group"><span>{t("Marcas:", "Brands:")}</span>{catalogBrands.slice(0, 12).map((filter) => <button className={brandFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setBrandFilter(filter)}>{translateFilter(filter)}</button>)}</div><div className="filter-group"><span>{t("Grupos:", "Groups:")}</span>{catalogCategories.slice(0, 18).map((filter) => <button className={categoryFilter === filter ? "filter-chip is-active" : "filter-chip"} key={filter} onClick={() => setCategoryFilter(filter)}>{translateFilter(filter)}</button>)}</div></div>
            <div className="catalog-result-head"><div><strong>{catalogLoading ? t("Cargando catálogo...", "Loading catalog...") : `${formatCount(filteredProducts.length)} ${t("Resultados encontrados", "Results found")}`}</strong><span>{t("El resultado puede restringirse mediante filtros.", "Results can be narrowed with filters.")}</span></div><div className="catalog-sort"><label htmlFor="catalog-sort-select">{t("Ordenar por", "Sort by")}</label><select id="catalog-sort-select" defaultValue="score"><option value="score">{t("Relevancia", "Relevance")}</option><option value="sku-asc">{t("N.º artículo ascendente", "Part number ascending")}</option><option value="sku-desc">{t("N.º artículo descendente", "Part number descending")}</option><option value="name-asc">{t("Descripción ascendente", "Description ascending")}</option></select></div></div>
            {catalogLoading && <div className="catalog-loading">{t("Cargando las miniaturas y referencias de las aplicaciones...", "Loading thumbnails and application references...")}</div>}
            {catalogError && <div className="empty-catalog"><Search size={22} /><p>{t("No fue posible cargar el índice Diesel Technic.", "The Diesel Technic index could not be loaded.")}</p><button onClick={() => window.location.reload()}>{t("Reintentar", "Try again")}</button></div>}
            {!catalogLoading && !catalogError && <>
            <div className="product-grid">{visibleProducts.map((product) => {
              return <article className="product-card" key={product.id}>
                <button className="product-open" onClick={() => setSelectedProduct(product)} aria-label={t(`Ver ${product.name}, referencia ${product.sku}`, `View ${product.name}, part number ${product.sku}`)}>
                  <div className="product-visual product-visual--photo">{product.image ? <img src={product.image} alt={`${product.name} — ${product.sku}`} loading="lazy" /> : <div className="product-no-image"><PackageCheck size={38} /><span>{t("Imagen no disponible en la fuente", "Image unavailable from source")}</span></div>}<span className="product-image-hint"><ArrowUpRight size={13} />{t("Abrir imagen", "Open image")}</span></div>
                  <div className="product-info"><div className="product-kicker"><b>DT Spare Parts / SKU {product.sku}</b></div><h3>{product.name}</h3><div className="product-footer"><span className="product-more">{t("Ver detalle", "View details")} <ArrowUpRight size={13} /></span></div></div>
                </button>
                <button className="product-add-button" onClick={() => addToCart(product)}><Plus size={13} />{t("Agregar", "Add")}</button>
              </article>;
            })}</div>
            {filteredProducts.length === 0 && <div className="empty-catalog"><Search size={22} /><p>{t("No encontramos una referencia con esos filtros.", "No part number matches these filters.")}</p><button onClick={() => { setCatalogSearch(""); setBrandFilter("Todas las Marcas"); setCategoryFilter("Todas las Piezas"); }}>{t("Limpiar filtros", "Clear filters")}</button></div>}
            {filteredProducts.length > 0 && <><div className="catalog-bulk-actions"><label><input type="checkbox" />{t("Seleccionar todo", "Select all")}</label><button>{t("Comparar producto", "Compare product")}</button><button>{t("Añadir a bloc de notas", "Add to notes")}</button><button onClick={() => scrollToId("registro")}><ShoppingCart size={13} />{t("Añadir al carrito", "Add to cart")}</button></div><div className="catalog-pagination"><button disabled={catalogPage === 1} onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}><ArrowLeft size={14} />{t("Anterior", "Previous")}</button><span>{t("Página", "Page")} <b>{catalogPage}</b> {t("de", "of")} <b>{pageCount}</b></span><button disabled={catalogPage === pageCount} onClick={() => setCatalogPage((page) => Math.min(pageCount, page + 1))}>{t("Siguiente", "Next")}<ArrowRight size={14} /></button></div></>}
            </>}
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="container-wide faq-layout"><div className="faq-side"><SectionLabel>{t("PREGUNTAS FRECUENTES", "FREQUENTLY ASKED QUESTIONS")}</SectionLabel><h2>{t("Todo lo que necesitas saber sobre", "Everything you need to know about")} <span>Eurotruck</span></h2><p>{t("Si no encuentras tu respuesta, escríbenos y un asesor te orientará según tu flota.", "If you cannot find your answer, write to us and an advisor will guide you based on your fleet.")}</p><a href="mailto:eurotruckcxa@yahoo.com">{t("Hablar con un asesor", "Talk to an advisor")} <ArrowUpRight size={14} /></a></div><div className="faq-main"><div className="faq-search"><Search size={16} /><input id="faq-search-input" value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder={t("Buscar en preguntas (ej: Caribe Express, Grúa, Kelvin, Marcas...)", "Search questions (e.g. Caribe Express, crane, Kelvin, brands...)")} /></div><div className="faq-list">{filteredFaqs.map(([question, answer]) => { const originalIndex = localizedFaqs.findIndex(([item]) => item === question); const isOpen = openFaq === originalIndex; return <div className={isOpen ? "faq-item is-open" : "faq-item"} key={question}><button onClick={() => setOpenFaq(isOpen ? null : originalIndex)}><span><b>{String(originalIndex + 1).padStart(2, "0")}</b>{question}</span><ChevronDown size={17} /></button>{isOpen && <p>{answer}</p>}</div>; })}</div></div></div>
        </section>
      </main>

      {cartOpen && <div className="cart-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="cart-drawer-head"><div><SectionLabel>{t("COTIZACIÓN EUROTRUCK", "EUROTRUCK QUOTE")}</SectionLabel><h2 id="cart-title">{t("Tu solicitud de piezas", "Your parts request")}</h2><p className="cart-drawer-subtitle">{t("Revisa las referencias antes de enviarnos tus datos.", "Review the references before sending us your details.")}</p></div><button autoFocus className="product-modal-close" onClick={() => setCartOpen(false)} aria-label={t("Cerrar carrito", "Close cart")}><X size={17} /></button></div>{cartItems.length === 0 ? <div className="cart-empty"><ShoppingCart size={34} /><h3>{t("Tu carrito está vacío", "Your cart is empty")}</h3><p>{t("Agrega piezas del catálogo para preparar una solicitud clara y recibir atención de nuestro equipo.", "Add parts from the catalog to prepare a clear request and receive help from our team.")}</p><button className="modal-add-button" onClick={() => { setCartOpen(false); scrollToId("catalogo"); }}>{t("Ver catálogo", "View catalog")} <ArrowRight size={14} /></button></div> : <><div className="cart-items">{cartItems.map((item) => <div className="cart-item" key={item.id}><div className="cart-item-image"><img src={item.image} alt="" /></div><div className="cart-item-copy"><b>{item.name}</b><small>DT Spare Parts / SKU {item.sku}</small><div className="cart-item-quantity" aria-label={t(`Cantidad de ${item.name}`, `Quantity of ${item.name}`)}><button type="button" onClick={() => setCartItems((items) => items.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) } : cartItem))} aria-label={t(`Reducir cantidad de ${item.name}`, `Decrease quantity of ${item.name}`)}>−</button><b>{item.quantity}</b><button type="button" onClick={() => setCartItems((items) => items.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: Math.min(99, cartItem.quantity + 1) } : cartItem))} aria-label={t(`Aumentar cantidad de ${item.name}`, `Increase quantity of ${item.name}`)}>+</button></div></div><button className="cart-item-remove" onClick={() => setCartItems((items) => items.filter((cartItem) => cartItem.id !== item.id))} aria-label={t(`Eliminar ${item.name}`, `Remove ${item.name}`)}><X size={14} /></button></div>)}</div><div className="cart-summary"><div><span>{t("Referencias seleccionadas", "Selected references")}</span><strong>{cartItems.length}</strong></div><div><span>{t("Total de piezas", "Total parts")}</span><strong>{cartCount}</strong></div><div><span>{t("Modalidad", "Request type")}</span><strong>{t("Cotización", "Quote")}</strong></div></div><div className="cart-drawer-actions"><button className="cart-continue-button" onClick={() => { setCartOpen(false); scrollToId("catalogo"); }}><Plus size={15} />{t("Agregar otra pieza", "Add another part")}</button><button className="cart-checkout-button" onClick={() => { setCartOpen(false); scrollToId("registro"); }}><ClipboardList size={15} />{t("Continuar con mis datos", "Continue with my details")}</button></div></>}</aside></div>}

      {selectedProduct && <div className="product-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><div className="product-modal product-modal--enhanced" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="product-modal-close" onClick={() => setSelectedProduct(null)} aria-label={t("Cerrar detalle", "Close details")}><X size={17} /></button><div className="product-modal-media">{selectedProduct.imageFull || selectedProduct.image ? <img src={selectedProduct.imageFull || selectedProduct.image} alt={`${selectedProduct.name} — ${selectedProduct.sku}`} /> : <div className="product-no-image"><PackageCheck size={48} /><span>{t("Imagen no disponible en la fuente", "Image unavailable from source")}</span></div>}<span className="product-modal-zoom-note">{t("Pasa el cursor para ampliar", "Hover to zoom")}</span></div><div className="product-modal-copy"><div className="product-modal-heading"><SectionLabel>{t("FICHA DEL ARTÍCULO", "PART PROFILE")}</SectionLabel><span className="product-modal-sku">SKU {selectedProduct.sku}</span></div><h2 id="product-modal-title">{selectedProduct.name}</h2><div className="product-modal-actions"><button className="modal-add-button" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true); }}><Plus size={14} />{t("Agregar a cotización", "Add to quote")}</button></div></div></div></div>}

      {saleProduct && <div className="public-sale-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaleProduct(null); }}><div className="public-sale-dialog" role="dialog" aria-modal="true" aria-labelledby="public-sale-title"><button className="product-modal-close" onClick={() => setSaleProduct(null)} aria-label={t("Cerrar salida", "Close sale")}><X size={17} /></button><SectionLabel>{t("SALIDA DE ALMACÉN", "WAREHOUSE SALE")}</SectionLabel><h2 id="public-sale-title">{t("Descontar cantidad", "Decrease stock")}</h2><p>{saleProduct.sku} · {saleProduct.name}</p><label>{t("Cantidad vendida", "Quantity sold")}<input type="number" min="1" max={inventoryLocations.get(saleProduct.id)?.totalQuantity || 1} value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} /></label><label>{t("Clave de confirmación", "Confirmation key")}<input type="password" inputMode="numeric" maxLength={4} autoFocus value={saleKey} onChange={event => setSaleKey(event.target.value)} placeholder="1989" /></label>{saleError && <p className="form-error" role="alert">{saleError}</p>}<div className="public-sale-actions"><button className="orders-button orders-button--ghost" onClick={() => setSaleProduct(null)}>{t("Cancelar", "Cancel")}</button><button className="orders-button orders-button--danger" disabled={recordSaleMutation.isPending} onClick={confirmPublicSale}>{recordSaleMutation.isPending ? t("Guardando…", "Saving…") : t("Confirmar salida", "Confirm sale")}</button></div></div></div>}

      <footer className="site-footer" id="contacto">
        <div className="footer-portal-strip"><div className="container-wide footer-portal-strip-inner"><span>EUROTRUCK / {t("PORTAL DE PIEZAS", "PARTS PORTAL")}</span><span>{t("Consulta por referencia, descripción o aplicación", "Search by part number, description or application")}</span><a href="mailto:eurotruckcxa@yahoo.com">{t("Contactar HelpDesk", "Contact HelpDesk")} <ArrowUpRight size={13} /></a></div></div>
        <div className="container-wide footer-portal-columns"><div><span>{t("DIVISIONES", "DIVISIONS")}</span><button onClick={() => scrollToId("catalogo")}>{t("Recambios para Camión", "Truck Parts")}</button><button onClick={() => scrollToId("catalogo")}>{t("Recambios para Trailer", "Trailer Parts")}</button><button onClick={() => scrollToId("catalogo")}>{t("Recambios para Autobús", "Bus Parts")}</button><button onClick={() => scrollToId("catalogo")}>{t("Recambios para Furgoneta", "Van Parts")}</button></div><div><span>{t("GRUPOS DE PRODUCTOS", "PRODUCT GROUPS")}</span><button onClick={() => setCategoryFilter("Motor")}>{t("Motor", "Engine")}</button><button onClick={() => setCategoryFilter("Sistema de freno")}>{t("Sistema de freno", "Brake system")}</button><button onClick={() => setCategoryFilter("Sistema eléctrico")}>{t("Sistema eléctrico", "Electrical system")}</button><button onClick={() => setCategoryFilter("Suspensión")}>{t("Suspensión", "Suspension")}</button></div><div><span>{t("INFORMACIÓN", "INFORMATION")}</span><button onClick={() => scrollToId("faq")}>{t("Preguntas frecuentes", "FAQ")}</button><button onClick={() => scrollToId("registro")}>{t("Registrar empresa", "Register company")}</button><button onClick={() => scrollToId("servicios")}>{t("Servicio a domicilio", "On-site service")}</button><a href="mailto:eurotruckcxa@yahoo.com">{t("Formulario de contacto", "Contact form")}</a><a href="/orders">{t("Bandeja de empresa", "Company inbox")}</a></div><div><span>{t("PERFILES DE MARCA", "BRAND PROFILES")}</span><button onClick={() => setBrandFilter("DT Spare Parts")}>DT Spare Parts</button><button onClick={() => setBrandFilter("SIEGEL Automotive")}>SIEGEL Automotive</button><a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer">Instagram</a></div></div>
        <div className="container-wide footer-main"><div className="footer-brand"><EurotruckLogo compact /><p>Tu aliado en la carretera. Repuestos europeos, mantenimiento y servicio técnico móvil para flotas que no pueden parar.</p><div className="footer-socials"><a href="https://www.facebook.com/p/Eurotruck-100069794508624/?locale=es_LA" target="_blank" rel="noreferrer"><Facebook size={15} /></a><a href="https://www.instagram.com/eurotrucksrl_rd/" target="_blank" rel="noreferrer"><Instagram size={15} /></a><a href="mailto:eurotruckcxa@yahoo.com"><Mail size={15} /></a></div></div><div className="footer-column"><span>EXPLORA</span><button onClick={() => scrollToId("catalogo")}>Venta de Piezas <ChevronRight size={13} /></button><button onClick={() => scrollToId("servicios")}>Servicios <ChevronRight size={13} /></button><button onClick={() => scrollToId("faq")}>Preguntas Frecuentes <ChevronRight size={13} /></button></div><div className="footer-column"><span>CONTACTO DIRECTO</span><a href="tel:8098930258"><small>COTIZACIONES (KELVIN)</small>(809) 893-0258</a><a href="tel:8099499406"><small>RESCATE 24H &amp; TALLER</small>(809) 949-9406</a><a href="tel:8095911222"><small>OFICINA CENTRAL</small>(809) 591-1222</a></div><div className="footer-column footer-location"><span>OPERACIONES</span><div className="footer-map-card"><MapView className="footer-interactive-map" initialCenter={{ lat: 18.5293806, lng: -70.0075319 }} initialZoom={15} onMapReady={map => { new window.google.maps.Marker({ map, position: { lat: 18.5293806, lng: -70.0075319 }, title: "Eurotruck SRL" }); }} /><div className="footer-map-meta"><MapPin size={18} /><span><strong>Eurotruck SRL</strong><small>Santo Domingo · mapa interactivo</small></span><a href="https://maps.app.goo.gl/jz9HhJi68JkW15nC6" target="_blank" rel="noreferrer">Abrir en Google Maps</a></div></div><p><Factory size={15} />Atención para flotas y empresas</p><a className="footer-mail" href="mailto:eurotruckcxa@yahoo.com"><Mail size={15} />eurotruckcxa@yahoo.com</a></div></div><div className="container-wide footer-bottom"><span>© 2026 Eurotruck Repuestos / Servicios</span><span>Precisión europea. Respuesta local.</span></div>
      </footer>


      <a className="floating-call" href="tel:8099499406"><Phone size={16} /><span>RESCATE 24H</span></a>
    </div>
  );
}
