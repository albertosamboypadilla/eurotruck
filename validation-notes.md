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
