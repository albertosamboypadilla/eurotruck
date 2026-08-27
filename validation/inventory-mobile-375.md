# Validación móvil de inventario

La vista `/inventory` se verificó con una sesión local de **admin1** en una ventana de **375 × 812 px**, usando el navegador automatizado del entorno. La prueba no creó ni modificó conteos; únicamente abrió el formulario de alta manual y tomó capturas de evidencia.

| Comprobación | Resultado |
| --- | --- |
| Sesión autenticada como admin1 | Aprobada |
| Catálogo completo visible | Aprobada; muestra 39.439 artículos |
| Paginación visible | Aprobada; muestra 1–60 de 39.439 |
| Ubicación activa tramo/góndola | Aprobada; controles visibles y adaptados a móvil |
| Botón «Agregar nuevo» | Aprobada |
| Diálogo de alta manual | Aprobada; visible y usable en 375 px |
| Resumen «Artículos contados» | Aprobada |
| Conteos de validación persistentes | No se generaron datos de prueba |

También se validó con admin1 el flujo real de lectura automática: dos lecturas de `1.00739` registraron una unidad cada una, la segunda lectura cambió la ubicación a `T-02 / G-04`, el total pasó de 1 a 2, la fila se marcó en verde y el resumen mostró el acumulado. Ese registro temporal y sus dos scans se eliminaron después de la prueba.
