# Validación visual — 2026-09-04

La página principal carga en el preview y muestra navegación, catálogo, filtros, imágenes, referencias DT Spare Parts/SKU, códigos Zebra, barras y GTIN según la vista actual. La consola del navegador no reportó errores.

La ruta `/inventory` muestra correctamente una pantalla protegida que indica disponibilidad exclusiva para `admin1`, con campos de usuario y clave, botón de entrada y enlace de regreso a la página principal. La validación autenticada del flujo se mantiene cubierta por las pruebas Vitest y la compilación de producción.

La revisión se realizó sin crear ni modificar datos de inventario.

## Validación técnica

- `pnpm check`: correcto.
- `pnpm test`: 19 archivos, 52 pruebas correctas.
- `pnpm build`: correcto; solo avisos no bloqueantes de assets runtime y tamaño de chunk.
- Dev server: operativo en el preview configurado.

## Revisión autenticada

Con `admin1` se abrió el panel completo de Inventario. En el primer viewport se observan el área activa, controles de tramo y góndola, modo de escaneo automático, modo manual, registro de últimos ingresos, salida protegida, descarga Excel, alta nueva y filtro del catálogo. La tabla reciente muestra fecha/hora, SKU, artículo, código Zebra, cantidad, ubicación y usuario. El catálogo indica 39.440 artículos y 35.517 con GTIN. No se ejecutaron escaneos, altas, salidas ni eliminaciones durante la revisión.

## Validación del rediseño oscuro — 2026-09-04

La vista autenticada de `/inventory` carga con fondo oscuro continuo y superficies azul petróleo diferenciadas. Se verificó que la cabecera, KPIs, selector de ubicación, modos de entrada, formulario de escaneo, catálogo, estados de stock y acciones usen la nueva paleta.

El historial ya no ocupa el flujo principal como tabla fija. Ahora se presenta como una tarjeta-resumen con los botones “Últimos ingresos” y “Ver historial”; ambos abren una ventana modal independiente dentro de Inventario. La ventana incluye actualización, cierre, tabla horizontal con desplazamiento, contador de lecturas y cierre haciendo clic fuera de la tarjeta. La tabla conserva fecha/hora, SKU, artículo, código Zebra, cantidad, ubicación y usuario.

## GTIN adicionales — revisión visual

La ruta `/inventory` carga correctamente con sesión de admin1. El catálogo muestra la referencia, código Zebra, barcode y GTIN; el campo de búsqueda acepta referencia, SKU o GTIN. El detalle de cada artículo incluye un panel para conservar el GTIN principal y registrar GTIN adicionales vinculados al mismo SKU para resolver escaneos sin duplicar artículos.

La validación técnica pasó TypeScript, 53 pruebas Vitest y el build de producción; la revisión visual no mostró errores de consola ni fallos de carga.

## Acceso visible para agregar GTIN — 2026-09-04

Inventario carga el catálogo completo con búsqueda por referencia, SKU o GTIN. Al abrir cualquier artículo, el detalle mantiene el panel de GTIN aunque no exista ningún código y muestra el botón visible “Agregar otro GTIN”, que lleva el foco y desplaza la pantalla al campo de captura. La validación técnica pasó TypeScript, 53 pruebas Vitest y build de producción.

## Sincronización GTIN Inventario/Home — 2026-09-04

Home incorpora la consulta pública `inventory.publicGtins` y fusiona sus alias con el mapa estático usando el SKU normalizado. La comprobación desde la página principal respondió correctamente con un registro de muestra que contiene únicamente `productId`, `sku` y `gtin`; el catálogo público conserva búsqueda y visualización por todos los códigos asociados.

## Deduplicación por SKU — 2026-09-04

La auditoría encontró 39.894 registros, 36.725 SKU únicos, 2.119 grupos duplicados y 3.169 filas repetidas. El catálogo deduplicado conserva 36.725 artículos, cero SKU duplicados y cero violaciones de unión/máximo de GTIN. La base de datos contiene 15 registros de inventario, 14 SKU y ninguna fila con existencia positiva; no se eliminaron movimientos ni datos persistentes. Home mostró 36.725 resultados y cargó tarjetas/GTIN correctamente.

## Búsqueda Diesel Technic: Juego de segmentos de pistón — 2026-09-04

La búsqueda directa quedó detrás de Azure WAF. Las fichas indexadas identificadas incluyen 2.90126, 1.33134, 4.90617, 4.92041, 3.90031, 2.90125, 7.94509, 5.94224, 4.92038, 6.91171, 2.94579, 6.91174, 1.31881 y 13.00630. La ficha 1.33134 respondió con tres GTIN confirmados: 4057795904064, 4057795904071 y 4057795762442; aplicación Scania y referencia de ficha 1.33134. Las demás fichas requieren reintento o fuente indexada adicional antes de importarse.

La búsqueda indexada confirmó datos adicionales: 5.94224 tiene GTIN 4070174094231 y 4057795786639, aplicación DAF; 6.91171 tiene GTIN 4047755617752 y 4047755365707, aplicación Renault; 13.00630 tiene GTIN 4070174135699, aplicación Ford. La ficha española de 6.91174 fue localizada, pero todavía no expone un GTIN verificable en los resultados indexados.

## Revisión visual 2026-09-04

Inventario muestra el botón “Imprimir área activa” junto a la ubicación GENERAL/GENERAL y mantiene “Artículos contados — Descargar inventario”. La página administrativa carga el catálogo y conserva el resumen, bajo stock e historial. La sesión de previsualización mostró temporalmente “Comprobando acceso…” durante la carga y después renderizó la vista completa.

La revisión de Home confirmó que el catálogo carga 36.729 resultados después de integrar los cuatro SKU faltantes. La revisión de Inventario mostró “Imprimir área activa” junto a la ubicación activa y la carga del catálogo administrativo. La búsqueda visual se mantuvo operativa; el filtro de referencia puede utilizarse para localizar 5.94224, 6.91171, 6.91174 y 13.00630.
