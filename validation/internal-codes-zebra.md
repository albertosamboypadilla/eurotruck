# Validación de códigos internos Zebra

Se generó una asignación determinista de códigos internos numéricos de cinco dígitos para **39.440 artículos** del catálogo fusionado. La auditoría confirmó **39.440 códigos internos únicos** y **38.653 artículos con código externo disponible**. Los códigos se incorporaron al catálogo público, a los fragmentos administrativos y a la búsqueda de Inventario.

Los identificadores visibles y buscables incluyen SKU, referencia, GTIN, código interno Zebra y código de barras externo. El alta de artículos nuevos acepta un barcode escaneado, nombre manual, cantidad inicial, ubicación activa, costo y precio final; el servidor genera automáticamente el código interno en el rango reservado para artículos personalizados.

El conteo automático y manual propaga internalCode y barcode al registro persistente. La salida por venta puede resolver el SKU desde código Zebra o barcode antes de descontar existencias. Las etiquetas Zebra usan el código normalizado y la vista previa configurable existente.

La validación final pasó `pnpm check`, **47 pruebas Vitest** y `pnpm build`. No se agregaron datos de prueba al inventario real.
