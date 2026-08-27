# Validación de búsqueda GTIN

La fuente recibida fue `catalogo_gtin_dt_spare_parts_final.csv`. Contiene **70 referencias** y **167 GTIN únicos**; 63 referencias tienen más de un GTIN. Las 70 referencias coinciden exactamente con el catálogo Eurotruck y no hubo filas vacías ni GTIN con formato inválido.

La aplicación carga el mapa GTIN desde almacenamiento persistente y lo combina con el catálogo completo de 39.439 registros. La búsqueda acepta coincidencias exactas y parciales de la referencia original, el ID, el nombre, la descripción y cualquiera de los GTIN asociados. El inventario usa la misma lógica, por lo que un lector puede enviar directamente un GTIN y el resultado conserva la referencia DT Spare Parts.

## Prueba funcional

Se buscó el GTIN `4057795863408` en Home. El catálogo devolvió cinco registros porque la misma referencia `1.14082` aparece una vez por aplicación —Iveco, Scania, Volvo, Mercedes-Benz y MAN—; en todos los casos la referencia fue `1.14082` y el conjunto mostrado de GTIN fue `4057795863408`, `4070174120060` y `4070174120077`. Esto confirma que no se asociaron códigos a un SKU distinto.

En Inventory se inició sesión como `admin1` en viewport de **375 × 812 px**, se filtró por `4057795863408` y la fila visible conservó el SKU `1.14082`, el nombre del artículo y los tres GTIN, sin crear un conteo.

## Comprobaciones técnicas

- TypeScript: correcto.
- Vitest: **14 archivos, 32 pruebas exitosas**.
- Build de producción: correcto.
- Assets persistentes GTIN: HTTP 200 para mapa y metadatos.
- Responsive: Home e Inventory revisados en viewport de 375 × 812 px.

El archivo recibido cubre 70 referencias; los demás artículos continúan visibles y buscables por su referencia, pero no se etiquetan con GTIN hasta disponer de sus códigos fuente verificados.
