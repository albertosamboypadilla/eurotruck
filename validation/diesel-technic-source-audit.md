# Auditoría de fuente externa

Fuente consultada: https://partnerportal.dieseltechnic.com/es/search/results?start=0&length=25&sort_by=_score&desc=1&applications=55

El portal cargó en español y mostró 5.897 resultados para el filtro Iveco (`applications=55`). La página expuso filtros de aplicaciones, marcas y grupos de productos, además de referencias, descripción, aplicación y un control de “Más información” por artículo. En la primera extracción textual se observó inicialmente “0 Resultados encontrados” antes de completar la carga; después de esperar la página, el contenido mostró “5897 Resultados encontrados”. No se evadieron controles de acceso ni se inició sesión.

En el estado cargado se observaron referencias como `1.21094`, `9.78021`, `9.78160`, `2.14595` y otras, con descripciones y aplicaciones. Esta nota conserva únicamente hechos observados y la URL de origen; no constituye una importación de GTIN ni una autorización para sortear WAF o autenticación.

## Consulta oficial reanudada — 2026-08-29

La página de resultados general devolvió una pantalla de Azure WAF y no se intentó evadirla. El detalle público individual cargó correctamente:

| Fuente | DT Spare Parts / referencia | GTIN | Aplicación |
|---|---|---|---|
| https://partnerportal.dieseltechnic.com/en/products/dt-1-21157-switch | DT Spare Parts 1.21157 Switch | 4047755040543; 4057795949751 | Scania |

El detalle también mostró los números de comparación Scania `353628` y ZG `ZG.20164-0008`; no se mezclaron con el GTIN ni con la referencia DT. Este registro queda como evidencia pública de la fuente y como punto de continuación.


### Más detalles individuales confirmados

| Fuente | DT Spare Parts / referencia | GTIN | Aplicación |
|---|---|---|---|
| https://partnerportal.dieseltechnic.com/en/products/dt-1-61100-repair-kit-oil-separator-without-cap | DT Spare Parts 1.61100 Repair kit, oil separator, without cap | 4057795238183 | Scania |
| https://partnerportal.dieseltechnic.com/en/products/dt-1-19067-drag-link | DT Spare Parts 1.19067 Drag link | 4057795159525 | Scania |

Los detalles muestran además números de comparación Scania, que se mantienen separados del número DT y del GTIN. La recopilación continúa solo con páginas públicas que cargan correctamente.
