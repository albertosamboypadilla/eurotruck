# Investigación de fuente GTIN

**Fuente principal:** https://partnerportal.dieseltechnic.com/es/search/results?start=0&length=25&sort_by=_score&desc=1

## Hallazgos
1. **Ubicación del GTIN:** El GTIN no aparece en el listado de resultados, pero está presente en la página de detalle de cada producto (ej. `4057795983236` para la referencia `1.00117`).
2. **IDs de Aplicación:** MAN (69), Mercedes-Benz (74), Scania (103), Volvo (120).
3. **Estructura de URL de detalle:** `/es/products/dt-{referencia-con-guiones}-{nombre-normalizado}`.
4. **Desafío:** Obtener ~40.000 GTINs requiere una estrategia eficiente para evitar bloqueos y tiempos de espera excesivos. Se debe investigar si existe un endpoint de búsqueda que devuelva el GTIN en el JSON de resultados o si se puede extraer de forma masiva.

## Estrategia propuesta
- Intentar localizar el endpoint XHR que alimenta la búsqueda en el portal para ver si el GTIN viene oculto en el JSON.
- Si no viene en el JSON de búsqueda, se evaluará una captura por lotes de las páginas de detalle o el uso de un buscador de GTIN por referencia si Diesel Technic lo permite.

## Evidencia de detalle

La página de detalle `https://partnerportal.dieseltechnic.com/es/products/dt-1-00117-valvula-de-seguridad-secador-de-aire` expone explícitamente dos valores para el campo GTIN de la referencia `1.00117`: `4057795983236` y `4057795983229`. El producto corresponde a Scania. La implementación debe permitir **uno o varios GTIN por referencia** y conservarlos como una colección normalizada, sin perder el segundo valor.

## Fuentes oficiales alternativas

La página oficial de [DT Commerce](https://www.dieseltechnic.com/en/solutions/dt-commerce-tools/) indica que el **Data Package** contiene datos de producto, precios y stock, con descargas manuales o automatizadas, pero se habilita después de firmar un acuerdo de licencia. El [Download Center](https://www.dieseltechnic.com/en/solutions/downloads/) público ofrece principalmente documentos PDF y remite al Partner Portal para el acceso de socios; no se encontró allí un archivo público de catálogo con GTIN.

Por lo tanto, la vía autorizada y completa para los ~39.439 artículos es obtener el Data Package o una exportación equivalente desde una cuenta/representante de Diesel Technic. Las páginas de detalle sirven para verificar el formato, pero no son una fuente adecuada para descargar masivamente sin autorización y el portal bloquea las solicitudes automatizadas fuera del navegador con Azure WAF (HTTP 403).

## Comprobación del filtro Scania

La URL con `applications=103` carga correctamente **7.004 resultados** de Scania. El listado expone referencias y enlaces de detalle, pero no muestra GTIN; por ello, copiar todos los GTIN exigiría abrir los detalles individualmente o disponer del Data Package autorizado. Este comportamiento se repite con la limitación ya documentada del portal.

## Ejemplo solicitado: 1.33171

La página `https://partnerportal.dieseltechnic.com/es/products/dt-1-33171-piston-con-camisa` muestra la referencia propia `1.33171`, aplicación Scania y el GTIN `4070174101335`. El detalle también puede mostrar referencias OE/de reemplazo, pero esas no deben confundirse con el SKU ni con el GTIN.

## Revisión del flujo solicitado

La consulta `applications=103` carga **7.004 resultados** de Scania. El listado incluye el artículo `1.33171 Pistón con camisa` y su enlace de detalle; el GTIN se consulta dentro del detalle, donde se verificó `4070174101335`. La referencia y el GTIN se deben almacenar como campos separados para que el buscador y el lector de códigos puedan usar ambos.
