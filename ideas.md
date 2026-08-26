# Especificación de diseño: réplica Eurotruck

## Especificación de referencia

Este proyecto reproduce la página proporcionada en `https://web-eurotruck.vercel.app/`. La referencia es la fuente de verdad para la composición: una página única, de alto contraste, con encabezado compacto, navegación horizontal, hero con selector de marcas y fotografía de camiones, servicios, registro de pedidos, catálogo de repuestos, preguntas frecuentes y pie de página.

La fidelidad visual tiene prioridad sobre la reinterpretación creativa. Se conservará la atmósfera industrial oscura, la jerarquía tipográfica blanca, los acentos azul eléctrico, amarillo de acción y verde de servicio, los bordes finos azulados, el uso de chips y el overlay de asistencia en el hero. Se reutilizará la información pública visible en la referencia sin inventar reseñas, calificaciones ni testimonios.

## Movimiento visual

**Industrial nocturno / interfaz de taller técnico.** La interfaz mezcla la sobriedad de un panel de control de flota con la energía de una fotografía editorial de camiones en carretera al anochecer.

## Principios centrales

1. **Contraste operativo:** el texto blanco y los acentos de estado deben ser legibles sobre superficies carbón, vino y azul noche.
2. **Precisión modular:** tarjetas, chips y controles mantienen radios pequeños, bordes finos y una retícula técnica, evitando el aspecto de plantilla genérica.
3. **Fotografía como superficie:** los camiones y piezas aportan profundidad; los overlays oscuros permiten que el contenido siga siendo protagonista.
4. **Acción visible:** cotizar, registrar, llamar y agregar al carrito siempre deben destacarse con color y estados de interacción claros.

## Filosofía de color

El fondo negro-vino transmite trabajo nocturno y carretera; el azul eléctrico identifica tecnología, navegación y selección activa; el amarillo marca operaciones que requieren atención; el verde lima representa disponibilidad y auxilio; los grises fríos sostienen metadatos y bordes sin competir con el contenido.

## Paradigma de layout

Una secuencia vertical de paneles anchos y ligeramente asimétricos. El hero es el centro visual, con texto centrado y el camión desplazado dentro de una superficie panorámica. Las secciones de servicios y catálogo se organizan en columnas para escaneo rápido, mientras el formulario alterna una introducción lateral con controles densos.

## Elementos distintivos

El isotipo de camión azul con el wordmark EUROTRUCK; chips de marca con puntos cromáticos; botones técnicos con bordes luminosos; tarjetas de catálogo con metadatos en mayúsculas; y el panel flotante “Rino Asistente” visible sobre el hero.

## Interacción y animación

Las interacciones son rápidas y funcionales: hover con elevación breve, botones con compresión al pulsar, selección de marca con transición de color y cambio de imagen, acordeones con apertura suave y filtros de catálogo instantáneos. Las animaciones no deben superar 300 ms y se desactivan cuando el usuario prefiere movimiento reducido.

## Tipografía

Se usará **Barlow Condensed** para wordmark, etiquetas y datos técnicos, combinada con **Manrope** para titulares, párrafos y controles. El h1 será extra bold, compacto y centrado; los títulos de sección usarán negro/extra bold; los metadatos usarán mayúsculas, tracking amplio y tamaño pequeño.

## Esencia de marca

Eurotruck es el aliado operativo de flotas y transportistas que necesitan repuestos europeos y auxilio mecánico móvil sin perder tiempo en la carretera. Personalidad: **precisa, resolutiva, cercana**.

## Voz de marca

Los titulares son directos y técnicos; los CTA hablan en verbos de acción; el microcopy aclara tiempos, disponibilidad y próximos pasos sin promesas exageradas.

Ejemplos: “Tu camión no espera. Nosotros tampoco.” y “Dinos la pieza; coordinamos el siguiente movimiento.”

## Wordmark y logo

El wordmark se presenta en dos líneas: EUROTRUCK en mayúsculas con peso alto y REPUESTOS / SERVICIOS como descriptor espaciado. El isotipo es un camión frontal azul simplificado con un pequeño motivo de ruta; se mantiene visible a tamaño de marca tanto en escritorio como en móvil.

## Color de marca propio

**Azul ruta eléctrica `#2d76ff`**, reservado para selección activa, enlaces operativos y acciones primarias.
