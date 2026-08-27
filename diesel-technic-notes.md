# Hallazgos del portal Diesel Technic

## Fuente inspeccionada

URL consultada: https://partnerportal.dieseltechnic.com/es/search/results?start=0&length=25&sort_by=_score&desc=1&applications=55

La página es accesible en la sesión del navegador sin iniciar sesión para consultar resultados. El portal muestra la marca DIESEL TECHNIC Partner Portal, buscador por número de referencia o descripción, filtros por aplicación, serie/tipo, año, norma Euro, marca, grupos de productos, divisiones y promociones.

## Conteos y paginación

La cabecera general indica “50 000 artículos”, mientras que la consulta concreta con `applications=55` muestra “5897 Resultados encontrados” y “Resultado de la búsqueda: 5897 Productos encontrados”. La vista inicial solicita 25 artículos con `start=0&length=25`. La paginación visible comienza en 1, 2 y 3.

## Campos observados por artículo

Las tarjetas exponen nombre o descripción, etiqueta de promoción cuando aplica, acción “Más información”, acción “añadir”, número de artículo, referencias reemplazadas, aplicaciones compatibles, unidad de embalaje, disponibilidad regional y precio neto bajo demanda. En la primera página aparecen, entre otros, Amortiguador con referencia 7.00467 para Iveco, Prolongación del guardabarros derecho 7.00491, Sensor de impulsos 1.21539, Válvula de recirculación de gases de escape 12.27003 y Alternador 12.72008.

## Imágenes y enlaces

El usuario proporcionó como patrón de imagen la URL `https://dieseltechnic.tiny.pictures/0355/7_00467_0.jpg?format=webp&width=1920` para el artículo `7.00467`. Esto indica que la imagen puede construirse a partir del prefijo de carpeta y del número de referencia; no se debe asumir que todos los artículos compartan el mismo prefijo de carpeta sin extraerlo del portal o de su API. El enlace de detalle debe conservarse desde el artículo “Más información” o construirse únicamente después de confirmar el patrón real.

## Pendientes técnicos

Antes de importar los 5897 artículos es necesario identificar el endpoint o la respuesta JSON que alimenta la lista, porque el HTML renderizado contiene solo la página visible y no garantiza todos los campos ni URLs. La integración requerirá datos reales, almacenamiento persistente y carga diferida de imágenes; no se deben inventar artículos, URLs ni disponibilidad. Si el portal exige autenticación para las páginas posteriores o bloquea solicitudes automatizadas, el usuario deberá proporcionar acceso autorizado o un archivo/exportación oficial.

## Artículo de referencia confirmado

La ficha del artículo 7.00467 usa el enlace canónico `https://partnerportal.dieseltechnic.com/es/products/dt-7-00467-amortiguador`, muestra el título “Amortiguador”, la marca DT Spare Parts, aplicación Iveco, GTIN 4047755994792, peso neto 5515 g y unidad de embalaje de 1 pieza. La ficha contiene varias imágenes y un control de pantalla completa; el modal de Eurotruck debe ser mediano, permitir cerrar, mostrar el número, el nombre y la imagen principal, y ofrecer un enlace externo “Ver artículo en Diesel Technic”.

## Prueba de paginación amplia

La consulta `length=100` mostró temporalmente “0 Resultados encontrados” en la extracción visual, pero el HTML guardado por el navegador para esa misma URL contiene `5897 Resultados encontrados` y 100 tarjetas únicas de producto, cada una con su enlace y una miniatura de Tiny Pictures. Por tanto, la estrategia viable es descargar las páginas en bloques de 100, hasta cubrir 5897 registros, usando una sesión/autorización que el servidor acepte. Las tarjetas repiten enlaces en versiones móvil/escritorio, por lo que el importador debe deduplicar por URL o referencia.

## Prueba de paginación amplia

La consulta `length=100` mostró temporalmente “0 Resultados encontrados” en la extracción visual, pero el HTML guardado por el navegador para esa misma URL contiene `5897 Resultados encontrados` y 100 tarjetas únicas de producto, cada una con su enlace y una miniatura de Tiny Pictures. La estrategia viable es descargar las páginas en bloques de 100 hasta cubrir 5897 registros, usando una sesión/autorización que el servidor acepte. Las tarjetas repiten enlaces en versiones móvil/escritorio, por lo que el importador debe deduplicar por URL o referencia.

## Bundle de la aplicación

El navegador pudo cargar el bundle Nuxt principal `/_nuxt/DtEaadbD.js` y lo guardó localmente para análisis. Las solicitudes directas con `curl` al dominio del portal devuelven 403, por lo que la obtención masiva debe reutilizar el HTML entregado por la sesión del navegador o localizar el endpoint desde el bundle, sin saltarse controles de acceso.

## Módulo de resultados

La ruta `/es/search/results` carga el módulo lazy `/_nuxt/BmCaW_G-.js`. En ese módulo se confirma que la página acepta `start`, `length`, `sort_by`, `desc`, `term`, `subterm` y filtros como `applications`, `brands`, `categories`, `divisions`, `yearsFrom`, `yearsTo`, `emissions` y `badges`. La prueba `length=100` debe validarse con el HTML persistido del navegador, porque la extracción visual puede mostrar cero mientras la respuesta renderizada sí contiene tarjetas.

## Segundo bloque validado

La URL `start=100&length=100&sort_by=_score&desc=1&applications=55` entrega en el HTML del navegador el total `5897 Resultados encontrados` y 100 artículos distintos, comenzando con 7.34228, 7.34075, 7.38101 y 7.38505. La extracción visual puede mostrar cero mientras la respuesta renderizada sí contiene las tarjetas; el parser local debe trabajar con los HTML guardados por la sesión.

## Tercer bloque validado

La consulta `start=200&length=100&sort_by=_score&desc=1&applications=55` también entrega en el HTML del navegador el total `5897 Resultados encontrados` y 100 artículos distintos, comenzando con 7.96005, 7.94547, 7.94100 y 3.31013. El patrón por bloques de 100 se confirma para el catálogo filtrado.

## Cuarto bloque validado

La consulta `start=300&length=100&sort_by=_score&desc=1&applications=55` vuelve a entregar el total `5897 Resultados encontrados` y 100 artículos distintos, comenzando con 7.14107, 7.15703, 7.30107 y 7.32226. El HTML también contiene la estructura repetida de cada tarjeta con enlace de detalle e imagen de Tiny Pictures.

## Quinto bloque validado

La consulta `start=400&length=100&sort_by=_score&desc=1&applications=55` entrega 100 productos distintos y conserva el total de 5897. El bloque comienza con referencias 7.00040, 7.36054, 7.32500 y 7.25355, con enlaces de detalle y miniaturas en el HTML renderizado.

## Límite de una sola respuesta

La consulta `start=0&length=5897&sort_by=_score&desc=1&applications=55` muestra cero resultados y no entrega tarjetas en el HTML guardado. El portal sí funciona con bloques de 100, por lo que la importación completa requiere paginación por lotes y deduplicación.

## Catálogo completo recuperado

La sesión Chromium validada permitió consultar el endpoint POST `/api/search/filteredSearch` en 59 bloques de 100 y recuperar exactamente 5897 registros, sin fallos. Cada registro incluye `sku`, `name`, `slug`, `usageList`, `manufacturer`, `image.src`, `brand`, `categories`, `crossReferences` y badges. Hay 226 SKUs repetidos en la respuesta y deberán deduplicarse por SKU/slug antes de construir las tarjetas. Algunas referencias, como 7.00491, usan una imagen de aviso (`0000/important_advice_design.jpg`) en lugar de una foto de pieza; se conservará la imagen entregada por el portal y se marcará como disponible según fuente, sin inventar imágenes.

## Aplicaciones adicionales

Se confirmaron los IDs de aplicación en el portal: Iveco `55` con 5897 resultados, Scania `103` con 7005, Volvo `120` con 8511, Mercedes-Benz `74` con 11299 y MAN `69` con 6958. La consulta masiva se completó en bloques de 1000 para Scania, Volvo, Mercedes-Benz y MAN, con 0 fallos. La respuesta contiene rutas de imagen `image.src` para todos los registros de las cuatro aplicaciones. El catálogo consolidado contiene 39439 referencias únicas tras deduplicar únicamente repeticiones internas por SKU.
