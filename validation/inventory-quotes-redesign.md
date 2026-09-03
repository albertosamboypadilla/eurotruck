# Validación del rediseño de Inventario y Cotizaciones

Fecha de validación: 2026-09-02.

## Servidor y acceso

El servidor de desarrollo fue reiniciado y quedó operativo. La sesión local de `admin1` abrió correctamente **Cotizaciones** y permitió navegar a **Inventario**. La ruta de Inventario continúa restringida para otros administradores.

## Inventario

La pantalla autenticada muestra los indicadores de artículos contados, unidades de almacén, bajo stock y área activa. El selector diferencia claramente **Escaneo automático** y **Entrada manual**. Se buscó la bombilla `1.21574` en modo manual: el detalle abrió con imagen, SKU, GTIN, descripción, existencia, ubicación, costo, precio final, etiqueta Zebra y cantidad manual; el total del inventario no cambió durante esta consulta.

El catálogo administrativo cargó **39.440 referencias** y **35.517 referencias con GTIN**, incluidas las bombillas incorporadas desde el Excel. Las filas muestran ubicación, estado de conteo y bajo stock.

## Cotizaciones

La bandeja presenta botones separados para **Cotizaciones** e **Historial**. Al abrir una cotización existente se mostraron datos del cliente, editor de cantidades, precio unitario, subtotal, disponibilidad por línea, eliminación de artículos, guardado, descarga del PDF y archivado. Las líneas sin existencia muestran una advertencia visible.

## Página principal

Las tarjetas del catálogo muestran existencia real de almacén, ubicación y precio final cuando está configurado. Los artículos sin registro muestran un estado explícito de existencia pendiente. El vocabulario público usa **Cotización** en lugar de Orden.

## Salida protegida

Se abrió el botón rojo **Eliminar del inventario** de una fila contada. El diálogo mostró la referencia, cantidad, clave de confirmación y botones separados. Al enviar una clave incorrecta (`1111`), el modal permaneció abierto, mostró “Clave incorrecta” y no ejecutó el descuento; la existencia visible se mantuvo sin cambios.
