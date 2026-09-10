# Rino 3D para el carrito

- [x] Diseñar el personaje Rino 3D inspirado en la referencia, con identidad azul de Eurotruck.
- [x] Integrar Rino en la parte derecha inferior de la vista del carrito.
- [x] Añadir movimiento suave y estados de ayuda sin cubrir artículos ni botones.
- [x] Conectar el panel con preguntas sobre piezas, orden, teléfono, correo y horario.
- [x] Verificar carrito, responsive, teclado y reducción de movimiento.
- [x] Guardar checkpoint y entregar la actualización.
- [x] Implementar estados de ayuda reales en el panel de Rino según carrito vacío o con artículos.
- [x] Conectar Rino a acciones verificables para pieza, orden, teléfono, correo y horario.
- [x] Validar drawer del carrito en móvil y teclado con foco y cierre accesible.
- [x] Guardar un checkpoint nuevo después de los cambios del carrito con Rino.

# Flujo de orden de compra

- [x] Crear modelo persistente de órdenes con numeración consecutiva.
- [x] Guardar cliente, artículos, fecha, estado y destinatarios de cada orden.
- [x] Generar PDF descargable con formato de orden de compra.
- [x] Retirar el envío automático del PDF; la gestión será manual desde la bandeja.
- [x] Conectar el checkout del carrito con la creación de la orden.
- [x] Mostrar confirmación, número de orden y mensaje fuera de horario.
- [x] Añadir pruebas del backend y validar build, descarga y flujo de error.
- [x] Incluir el teléfono de contacto (809) 413-0846 en la orden, confirmación y canales de contacto.

# Bandeja privada de órdenes

- [x] Crear órdenes persistentes con correo, teléfono, artículos, número y estado.
- [x] Restringir la bandeja y sus acciones a usuarios de empresa con rol autorizado.
- [x] Mostrar la bandeja en lista con detalle de cliente y artículos.
- [x] Añadir acción para abrir WhatsApp con mensaje preparado y datos de la orden.
- [x] Añadir eliminación protegida de órdenes y actualización de la lista.
- [x] Conectar el formulario del carrito con el registro de órdenes.
- [x] Crear pruebas de permisos, creación, WhatsApp y eliminación.

# Acceso local de administradores

- [x] Crear tabla de credenciales locales con contraseñas hasheadadas.
- [x] Registrar admin1, admin2, admin3, admin4 y admin5 con rol administrativo.
- [x] Implementar login, logout y sesión segura para la bandeja.
- [x] Sustituir la dependencia exclusiva de OAuth en /orders por autorización local o OAuth administrativa.
- [x] Validar intentos inválidos, protección de endpoints y expiración de sesión.

# Correcciones de validación

- [x] Persistir los destinatarios de notificación dentro de cada orden.
- [x] Añadir prueba del flujo de creación y PDF consumible por el frontend.
- [x] Crear pruebas de login inválido, permisos de bandeja y sesión expirada.
- [x] Implementar el mensaje de atención fuera de horario al finalizar una orden.
- [x] Crear una prueba de orders.create que verifique respuesta PDF, numeración y mensaje horario.
- [x] Añadir prueba de la construcción del enlace WhatsApp y eliminación exitosa.
- [x] Añadir prueba del procedimiento auth.localLogin con credenciales inválidas.
- [x] Probar de forma determinista el generador de numeración y el caso fuera de horario.
- [x] Extraer y probar el helper real usado por la UI para construir enlaces de WhatsApp.
- [x] Extraer y probar directamente el formato consecutivo real ET-YYYY-###### de las órdenes.

# Órdenes abiertas y asignación

- [x] Mantener la orden en estado abierta/nueva después de descargar el PDF.
- [x] Añadir selección explícita de artículos desde las tarjetas del catálogo.
- [x] Permitir que un administrador tome una orden abierta desde la bandeja.
- [x] Registrar el administrador que tomó la orden y la fecha de asignación.
- [x] Evitar que dos administradores tomen simultáneamente la misma orden.
- [x] Mostrar estados abierta, tomada y cerrada en la bandeja.
- [x] Validar con pruebas de concurrencia, permisos y descarga PDF.
- [x] Añadir prueba de que orders.take rechaza usuarios no autenticados o no administradores.
- [x] Añadir prueba de orders.take con usuario autenticado cuyo rol no sea admin.

# Acceso visible a la bandeja

- [x] Añadir botón visible de Acceso empresa/Bandeja de órdenes en la página principal.
- [x] Confirmar que el botón navega a /orders y muestra el login administrativo.
- [x] Validar la navegación en escritorio y móvil.
- [x] Verificar en viewport móvil que Acceso empresa sea visible/usables y navegue correctamente a /orders.

# Simplificación solicitada

- [x] Eliminar el envío automático de correo y dejar el PDF disponible para gestión manual.
- [x] Retirar Rino 3D del carrito y de los elementos visibles donde no aporta valor.
- [x] Rediseñar el carrito con resumen limpio, cantidades, eliminación y acción clara para continuar.
- [x] Mantener la bandeja privada con los cinco usuarios y contacto manual por teléfono.
- [x] Mostrar en cada orden el botón de llamada al cliente y los datos necesarios para atenderla.
- [x] Validar responsive, PDF, usuarios, bandeja y pruebas tras la simplificación.
- [x] Añadir en la bandeja privada una acción real para descargar o regenerar el PDF de cada orden.
- [x] Validar que la gestión manual de la orden funciona sin correo automático.
- [x] Añadir manejo real de cantidades en el carrito con incrementar y decrementar por línea.
- [x] Añadir un botón de llamada al cliente claramente visible en cada orden.
- [x] Verificar en móvil y escritorio el carrito simplificado y la descarga manual del PDF desde la bandeja.
- [x] Añadir una prueba del procedimiento orders.pdf que verifique regeneración y descarga para una orden existente.
- [x] Verificar en navegador desktop el carrito simplificado abierto con cantidades y la gestión manual del PDF.
- [x] Verificar en navegador móvil el carrito simplificado abierto y la navegación básica de la bandeja.
- [x] Verificar interactivamente el carrito simplificado abierto en desktop y móvil, mostrando controles de cantidad.
- [x] Verificar interactivamente desde /orders la descarga manual/regeneración del PDF.
- [x] Registrar evidencia de navegación básica de la bandeja en móvil.
- [x] Completar la verificación interactiva móvil del carrito abierto con controles de cantidad.
- [x] Validar la descarga manual del PDF desde /orders usando una sesión administrativa real.
- [x] Confirmar una interacción básica de la bandeja en móvil con estado vacío u orden expandida.
- [x] Crear temporalmente una orden de validación y eliminarla después de probar el PDF desde la UI.
- [x] Guardar evidencia de una descarga real del PDF manual en /orders.
- [x] Confirmar que la orden temporal desaparece de la bandeja después de eliminarla desde la UI.

# Módulo de inventario para admin1

- [x] Crear acceso Inventario visible únicamente para admin1.
- [x] Abrir el inventario en una ventana/ruta separada protegida.
- [x] Permitir buscar o escanear una referencia del catálogo.
- [x] Registrar cantidad, tramo y góndola por artículo.
- [x] Sumar conteos del mismo artículo cuando aparezca en otra área.
- [x] Notificar cuando un artículo ya fue contado y mostrar el acumulado.
- [x] Validar permisos, persistencia, responsive y pruebas del inventario.
- [x] Añadir pruebas unitarias del acumulado de conteos y aviso de artículo repetido.
- [x] Añadir pruebas de que solo admin1 puede listar o registrar inventario.
- [x] Validar visualmente /inventory en escritorio y móvil.
- [x] Corregir la resolución de sesión local para que admin1 pueda abrir /inventory aunque exista una sesión OAuth de preview.
- [x] Hacer que Salir cierre tanto la sesión local como la sesión OAuth/preview cuando ambas existan.
- [x] Conectar el botón Salir de /inventory al cierre de sesión local y OAuth igual que la bandeja.

# Ajuste solicitado: salida e inventario con catálogo principal

- [x] Hacer que Salir desde el acceso de empresa vuelva siempre a `/`.
- [x] Hacer que Salir desde `/inventory` vuelva siempre a `/`.
- [x] Reutilizar en Inventario todos los registros disponibles en el catálogo de la página principal.
- [x] Mantener en Inventario los mismos datos de referencia, descripción, marca y aplicación del catálogo principal.
- [x] Permitir escanear/buscar una referencia y registrar cantidad, tramo y góndola sobre esos datos.
- [x] Validar pruebas, búsqueda real, acumulación y navegación de salida.
- [x] Mostrar y tipar explícitamente la descripción del catálogo principal en Inventory.
- [x] Verificar con una prueba que Inventory conserva la descripción al resolver un artículo fragmentado.

# Extensión solicitada: inventario visual y artículos nuevos

- [x] Mostrar en Inventory todos los artículos del catálogo principal con carga paginada o virtualizada.
- [x] Marcar visualmente en verde cada artículo que ya tenga conteo registrado.
- [x] Mantener el estado verde y el total acumulado al refrescar el inventario.
- [x] Añadir botón visible para agregar un artículo nuevo.
- [x] Guardar artículos nuevos con referencia, descripción, marca y aplicación.
- [x] Permitir contar artículos nuevos con cantidad, tramo y góndola.
- [x] Restringir el alta de artículos nuevos y sus conteos a admin1.
- [x] Validar pruebas, responsive y flujo real del inventario extendido.
- [x] Diferenciar artículos nuevos con cantidad cero de artículos realmente contados para el estado verde y el aviso de repetición.
- [x] Centralizar y probar la regla que considera contado a un artículo solo cuando su total acumulado es mayor que cero.

# Verificación final solicitada por la extensión

- [x] Crear un artículo y conteo temporal de validación, confirmar visualmente la fila verde y limpiar el dato temporal.
- [x] Refrescar Inventory después del conteo y confirmar el verde y total persistidos.
- [x] Validar en viewport móvil el listado, paginación, Agregar nuevo, formulario y resumen.
- [x] Validar en viewport móvil autenticado de /inventory el listado, paginación, botón Agregar nuevo, formulario y resumen, con evidencia clara.
- [x] Repetir la comprobación móvil después de confirmar que no quedan errores de render o HMR en Inventory.tsx.
- [x] Validar /inventory en un viewport móvil autenticado real con evidencia clara del listado, paginación, Agregar nuevo, formulario y resumen.
- [x] Confirmar con logs actuales y una nueva ejecución que no existen errores de Vite/HMR en Inventory.tsx.
- [x] Validar /inventory con admin1 en una ventana física de 375px de ancho y documentar listado, paginación, alta y resumen.

# Mejora solicitada: acumulación automática por escaneo

- [x] Hacer que cada escaneo de una referencia registre automáticamente 1 unidad.
- [x] Mostrar el artículo encontrado y el nuevo total después de cada escaneo.
- [x] Sumar lecturas repetidas del mismo artículo y conservar el historial de scans.
- [x] Mantener la suma cuando el mismo artículo se escanee en otra ubicación.
- [x] Cubrir el flujo de escaneo acumulativo con pruebas y validación real.
- [x] Mantener visible la paginación del catálogo completo después de un escaneo automático, mostrando el resultado en el resumen y en el aviso.
- [x] Evitar un segundo registro accidental desde el formulario manual después de un escaneo automático, manteniendo el artículo y total como confirmación.

# Integración GTIN Diesel Technic

- [x] Inspeccionar el portal Diesel Technic y confirmar dónde expone el GTIN para las aplicaciones ya integradas.
- [x] Verificar la disponibilidad de GTIN para Scania, Volvo, Mercedes-Benz y MAN; los faltantes quedan documentados sin inventar valores por el bloqueo Azure WAF del portal.
- [x] Continuar la captura de DT Spare Parts, GTIN y N.º de referencia desde el último registro confirmado, con reintento normal y reanudación segura ante errores; se añadieron 1.19067, 1.21157 y 1.61100 con fuente oficial verificable.
- [x] Asociar cada GTIN a la referencia correcta y conservar los artículos sin GTIN con estado explícito.
- [x] Extender el catálogo compartido, el inventario y la búsqueda para mostrar y localizar por GTIN.
- [x] Validar cobertura, deduplicación, rendimiento, permisos y ausencia de errores en la carga por fragmentos.
- [x] Permitir búsqueda exacta y parcial por número de referencia y por cualquiera de los GTIN asociados a cada artículo.
- [x] Mostrar el número de referencia y los GTIN verificados en las tarjetas, detalle e inventario.
- [x] Incorporar los GTIN obtenidos en el archivo oficial, conservando varios GTIN cuando una referencia tenga más de uno.
- [x] Validar búsquedas por referencia y GTIN con un artículo real presente en Scania, Volvo, Mercedes-Benz y MAN.

# Captura GTIN desde detalles

- [x] Intentar el procesamiento de páginas de detalle con reintentos y límites seguros; el portal bloqueó la captura masiva mediante Azure WAF y no se evadieron controles.
- [x] Asociar GTIN únicamente cuando proviene de una fuente verificable; los detalles bloqueados quedan sin completar y sin valores inventados.
- [x] Conservar múltiples GTIN por referencia y marcar artículos sin código en el mapa publicado; los faltantes del portal bloqueado permanecen pendientes de fuente oficial.
- [x] Habilitar búsqueda por referencia, SKU y GTIN en catálogo e inventario con el mapa oficial disponible.
- [x] Validar muestras y generar cobertura del mapa importado; se documenta la cobertura real disponible y sus limitaciones.

# Alcance Scania solicitado

- [x] Intentar recorrer el filtro Scania `applications=103`; la recopilación masiva quedó limitada por Azure WAF y se documentó el resultado.
- [x] Aplicar la regla de asociar SKU y GTIN solo desde la misma fuente verificable, excluyendo valores no confirmados; el detalle masivo quedó bloqueado.
- [x] Incorporar al catálogo los GTIN de Scania que sí cuentan con fuente verificable y permitir su búsqueda por referencia o GTIN.
- [x] Validar el escaneo con GTIN reales disponibles y conservar la referencia original; los códigos no verificables no se incorporan.
- [x] Procesar `catalogo_gtin_dt_spare_parts_final.csv`, validar sus columnas y asociar sus referencias con el catálogo Eurotruck.
- [x] Registrar cobertura, duplicados, conflictos y filas sin coincidencia antes de publicar los GTIN.
- [x] Añadir pruebas unitarias para coincidencia exacta por GTIN, múltiples GTIN y referencias que no tengan código importado.
- [x] Ejecutar TypeScript, Vitest y build después de integrar la búsqueda GTIN.
- [x] Corregir la coincidencia parcial por SKU/número de referencia en el helper compartido.
- [x] Mostrar “GTIN no registrado” de forma explícita en tarjetas y listados relevantes cuando no exista código importado.
- [x] Añadir una prueba de referencia válida sin GTIN, conservando su SKU y rechazando códigos ajenos.
- [x] Documentar que la ampliación de los 39.369 artículos restantes requiere una fuente oficial verificable adicional; el CSV adjunto se importó completamente en cuanto a coincidencias válidas.
- [x] Auditar e importar `todas_las_marcas_dt_gtin_5.csv`, asociando GTIN al número de parte/SKU coincidente y documentando duplicados o no coincidencias.

# Corrección solicitada: registro de cliente y orden de compra

- [x] Reproducir el fallo del formulario de datos del cliente desde el carrito.
- [x] Verificar validación, campos obligatorios, estado del formulario y llamada a orders.create.
- [x] Corregir el registro para que cree la orden, genere el PDF y muestre la confirmación al cliente.
- [x] Añadir o actualizar pruebas del flujo de cliente, PDF, error y persistencia sin dejar órdenes de prueba.
- [x] Validar el checkout en escritorio y móvil, y publicar el checkpoint corregido.

# Ajuste solicitado: carrito lateral y PDF al enviar

- [x] Confirmar que Agregar no crea órdenes ni descarga PDF.
- [x] Mostrar el artículo agregado inmediatamente en el carrito lateral derecho.
- [x] Mantener cantidades, eliminación y total de piezas en el carrito antes del envío.
- [x] Generar el PDF únicamente al enviar el formulario completo del cliente.
- [x] Probar el flujo completo sin dejar órdenes temporales y publicar la corrección.

# Restauración solicitada: inventario completo

- [x] Verificar que la ruta /inventory y el acceso de admin1 sigan disponibles.
- [x] Confirmar que Inventario carga todos los datos del catálogo principal y el mapa GTIN disponible.
- [x] Confirmar búsqueda/escaneo, conteo automático +1, acumulación por ubicación, historial y estado verde.
- [x] Confirmar alta de artículos nuevos y persistencia de tramo y góndola.
- [x] Validar permisos, responsive y pruebas; publicar la restauración si se requiere algún ajuste.

# Ajuste solicitado: eliminar escaneos y cambiar de área

- [x] Añadir eliminación protegida de una lectura escaneada individual.
- [x] Recalcular el total del artículo y su última ubicación después de eliminar una lectura.
- [x] Mantener tramo y góndola activos para todas las lecturas hasta que el operador seleccione o agregue otra área.
- [x] Añadir selector de áreas guardadas y opción para agregar un tramo/góndola manualmente.
- [x] Añadir pruebas de permisos, doble escaneo, eliminación y persistencia de ubicación.
- [x] Validar el flujo en móvil y publicar la actualización.
- [x] Mostrar el historial de lecturas por artículo y permitir eliminar una lectura específica, no solo la última.
- [x] Hacer que el conteo manual use únicamente la ubicación activa y bloquear la edición directa de tramo/góndola.
- [x] Añadir una prueba de persistencia de áreas guardadas y ubicación activa entre recargas.
- [x] Guardar y publicar un checkpoint después de validar la nueva UX de áreas y eliminación.
- [x] Revisar la paleta neutra clara del módulo Inventario; a solicitud del usuario se actualizó a un tema oscuro neutro con estados funcionales contrastados.
- [x] Aplicar paleta oscura neutra al módulo Inventario, con texto claro y estados verde/rojo reservados para feedback funcional.
- [x] Mostrar la ubicación del producto —tramo y góndola— directamente en cada artículo del catálogo de Inventario.
- [x] Mostrar tramo y góndola en las tarjetas del catálogo de la página principal, con “Ubicación pendiente” si el producto aún no tiene conteo.
- [x] Sincronizar automáticamente la ubicación pública después de registrar, cambiar o eliminar conteos en Inventario.
- [x] Aumentar las imágenes de las tarjetas y añadir zoom con mouse al abrir el detalle del producto, sin cubrir la información.
- [x] Añadir un botón visible “Ir a la página principal” en Acceso de empresa e Inventario.
- [x] Hacer más grande y fácil de seleccionar la acción “Tomar orden” dentro de cada orden abierta.
- [x] Eliminar las acciones “Contactar por WhatsApp” y “Llamar al cliente” de la bandeja de órdenes.
- [x] Crear historial administrativo de órdenes eliminadas, con revisión y eliminación definitiva separadas de la bandeja activa.
- [x] Hacer funcional el selector ES/EN y traducir los textos visibles de Home, catálogo, carrito y formulario.
- [x] Permitir eliminar tramos y góndolas guardados únicamente desde Inventario y conservar la ubicación histórica de los conteos.
- [x] Aumentar la legibilidad de los datos de artículos en Inventario y aplicar estados de color contrastados para contado, pendiente y bajo stock, respetando el tema oscuro solicitado.
- [x] Crear código ZPL compatible con Zebra LP2824 Plus para imprimir una secuencia de códigos internos de al menos cinco dígitos usando solo SKU y nombre del artículo.
- [x] Registrar salidas de inventario por venta mediante escaneo o captura de SKU desde el panel protegido de Inventario, con autorización exclusiva de admin1.
- [x] Crear alertas de bajo stock con umbral operativo y un historial de artículos más vendidos filtrable por mes y año, con impresión del reporte.
- [x] Asegurar que admin1 sea el único usuario con acceso a Inventario y que los demás administradores conserven solo la bandeja de órdenes.
- [x] Aumentar las letras pequeñas y mejorar espacios de filtros, tarjetas y datos de artículos tomando como referencia la imagen adjunta.

# Nueva ampliación: catálogo de bombillas

- [x] Recopilar las referencias de bombillas disponibles mediante el archivo Excel exportado de Diesel Technic, ya que el portal dinámico bloqueó la captura completa.
- [x] Asociar nombre, imagen, referencia y GTIN de las bombillas únicamente cuando están confirmados en el Excel y el mapa oficial.
- [x] Integrar las bombillas al catálogo compartido y validar búsqueda, detalle e inventario.
- [x] Ejecutar pruebas, build y validación visual de la ampliación de bombillas; la publicación quedó incluida en checkpoints posteriores.

# Nueva fuente entregada: Bombillas_DieselTechnic.xlsx

- [x] Auditar `Bombillas_DieselTechnic.xlsx`, sus hojas, columnas, filas y duplicados.
- [x] Normalizar referencias, GTIN, nombres, enlaces e imágenes de las bombillas.
- [x] Integrar las bombillas válidas en los fragmentos del catálogo compartido para Home e Inventario.
- [x] Validar búsqueda, detalle, carrito, GTIN, permisos, pruebas y build; publicar el checkpoint.

# Rediseño integral de Inventario y Cotizaciones

- [x] Mostrar en las tarjetas y en el detalle público la existencia actual disponible en almacén.
- [x] Añadir costo y precio final por artículo, editables únicamente por admin1 desde Inventario.
- [x] Rediseñar Inventario con jerarquía visual más clara, acciones simples y vista ampliada de imagen/datos al pulsar un artículo.
- [x] Mantener escaneo automático de +1 y añadir una opción manual explícita para registrar cantidades.
- [x] Alertar al escanear una referencia ya contada en una ubicación diferente, mostrando ubicación anterior y ubicación activa.
- [x] Confirmar y reforzar que solo admin1 pueda entrar a Inventario, agregar artículos y modificar costo/precio.
- [x] Renombrar la bandeja de Órdenes a Cotizaciones y separar visualmente Cotizaciones activas e Historial.
- [x] Permitir preparar la cotización en la bandeja, ajustar líneas, eliminar artículos sin disponibilidad y guardar los cambios.
- [x] Rediseñar el PDF de cotización con logo, colores corporativos, datos del cliente, líneas, totales y condiciones.
- [x] Validar migración de datos, permisos, escaneo, entrada manual, existencias públicas, cotizaciones, PDF y responsive.
- [x] Reiniciar el servidor de desarrollo y confirmar que Home, Inventario y Cotizaciones vuelvan a responder sin errores.

# Ajuste solicitado: salida protegida y artículos contados

- [x] Añadir botón rojo pequeño debajo de la marca de cada artículo para iniciar una salida por venta.
- [x] Mostrar ventana de confirmación con clave 0000 y descontar la existencia solo si la clave es correcta.
- [x] Rediseñar Artículos contados como listado inferior clicable con estados de color diferenciados.
- [x] Abrir el detalle del artículo contado con imagen, ubicación, costo y precio final editables por admin1.
- [x] Validar clave incorrecta, permisos admin1, descuento, actualización de existencias, pruebas y vista responsive.

# Ajuste solicitado: alerta y listados por ubicación

- [x] Convertir la alerta de artículo en otra ubicación en una ventana emergente grande con ubicación anterior y activa.
- [x] Añadir botón Aceptar y continuar para cerrar la alerta y continuar el conteo después de mover o confirmar el artículo.
- [x] Reorganizar el catálogo en filas largas con tipografía grande y datos completos sin recortes.
- [x] Agrupar Artículos contados por tramo y góndola en cuadros verticales separados con colores diferenciados.
- [x] Validar escaneo, alerta, aceptación, agrupación, colores, responsive, pruebas y publicación.

# Códigos internos Zebra y alta por escaneo

- [x] Asignar un código interno Zebra único a todos los artículos existentes y mostrarlo en el inventario.
- [x] Generar automáticamente el código interno al crear un artículo nuevo, evitando duplicados.
- [x] Añadir búsqueda y escaneo por código interno además de SKU, referencia y GTIN.
- [x] Crear alta de artículo por escaneo de código externo con nombre manual y cantidad inicial o incremento automático.
- [x] Conectar el código interno a la etiqueta Zebra y validar permisos, unicidad, escaneo, cantidades y pruebas.

# Vista previa configurable de etiqueta Zebra

- [x] Añadir vista previa visual de la etiqueta Zebra dentro de Inventario.
- [x] Permitir activar o quitar código interno, código de barras, SKU y nombre antes de imprimir.
- [x] Hacer que la descarga ZPL respete exactamente los campos seleccionados en la vista previa.
- [x] Validar configuración, vista previa, ZPL, impresión y responsive.

# Ajuste solicitado: salida en catálogo y exportación Excel

- [x] Mover el botón rojo de salida del listado Artículos contados al catálogo principal, a la izquierda de Agregar.
- [x] Mantener la confirmación con clave 0000 y descontar la existencia usando SKU, código Zebra o barcode.
- [x] Verificar que el código interno Zebra use formato normal de cinco dígitos y no se duplique.
- [x] Añadir descarga Excel con todos los artículos, identificadores, GTIN, barcode, existencia, ubicación, costo, precio y movimientos disponibles.
- [x] Validar permisos de admin1, descarga Excel, salida, códigos y responsive; ejecutar pruebas y publicar.

# Vista pública limitada y descuentos sin borrado

- [x] Mostrar al cliente únicamente imagen y nombre del artículo.
- [x] Mantener para administradores todos los datos internos y las acciones autorizadas.
- [x] Restaurar el botón de descarga Excel del inventario con historial detallado de artículos más vendidos.
- [x] Confirmar que descontar cantidades nunca borra artículos ni modifica el catálogo base y conserva movimientos/historial.
- [x] Validar roles, exportación, descuento de cantidades, pruebas, build y responsive; publicar.

# Restauración pública y salida desde Home

- [x] Restaurar todos los datos del artículo para usuarios y clientes en tarjetas y detalle.
- [x] Mover el botón de eliminar cantidad al detalle de cada artículo en la página principal.
- [x] Retirar la acción de salida del listado y detalle de Inventario.
- [x] Mantener la salida como descuento de cantidad, sin borrar ni modificar el artículo base ni su historial.
- [x] Validar datos, permisos, cantidad, historial, pruebas, build y responsive; publicar.

# Selección múltiple y descuento protegido en Home

- [x] Añadir selección individual y múltiple de artículos en la página principal.
- [x] Añadir botón visible para eliminar/descontar cantidad de los artículos seleccionados.
- [x] Solicitar contraseña 1989 y cantidades por artículo antes de confirmar el lote.
- [x] Descontar existencias sin borrar artículos ni modificar el catálogo base y conservar historial por artículo.
- [x] Validar clave incorrecta, selección múltiple, cantidades, permisos, historial, pruebas, build y responsive; publicar.

# Simplificación visual del descuento de cantidad

- [x] Convertir Descontar cantidad en un botón rojo destacado junto al campo de cantidad.
- [x] Retirar la foto del bloque de salida para dejar código/SKU, cantidad y acción.
- [x] Quitar Eliminar del inventario que aparece al lado de los artículos y conservar solo el flujo central de descuento.
- [x] Validar descuento con clave 1989, conservación del artículo, pruebas, build y responsive.

# Rediseño por etapas de Inventario — primera fase

- [x] Conservar intactos artículos, existencias, ubicaciones, movimientos e historial de la base de datos.
- [x] Mantener la línea horizontal de indicadores: Artículos contados, Unidades, Bajo stock y Área activa.
- [x] Convertir Bajo stock en un botón que descargue un Excel con los artículos que deben comprarse.
- [x] Rediseñar Área de conteo en cuadros horizontales y ordenados de izquierda a derecha.
- [x] Separar visualmente Agregar otra área y Eliminar área, con acciones fáciles de entender.
- [x] Ocultar temporalmente los demás bloques de Inventario sin borrar su lógica para continuar por etapas.
- [x] Validar la primera fase con pruebas, build y revisión responsive; publicar checkpoint.

# Paleta neutra y profesional para Inventario

- [x] Aplicar fondos y superficies neutras con contraste legible en todo Inventario.
- [x] Usar verde para sumas/conteos confirmados y rojo solo para bajo stock y alertas.
- [x] Suavizar bordes, sombras, botones y estados sin perder jerarquía visual.
- [x] Validar legibilidad, contraste, responsive y consistencia con Cotizaciones.

# Ajuste de paleta y escaneo automático

- [x] Sustituir la paleta actual de Inventario por un esquema profesional, sobrio y de alto contraste.
- [x] Mantener verde para confirmaciones y sumas, y rojo solo para bajo stock, errores y alertas.
- [x] Hacer que el escaneo reconocido registre automáticamente una unidad sin pulsar Registrar.
- [x] Mostrar una ventana grande de alta cuando el código no exista en el catálogo.
- [x] Incluir en el alta desconocida SKU, barcode, nombre, descripción, marca, aplicación, imagen, ubicación, cantidad, costo, precio y código Zebra automático.
- [x] Validar escaneo reconocido, código desconocido, alta completa, permisos, pruebas, build y responsive; publicar.

# Sonidos, fotos, historial reciente y nueva paleta de Inventario

- [x] Reproducir sonido de confirmación al escanear correctamente.
- [x] Reproducir sonido de alerta cuando el código no exista y se abra el alta.
- [x] Permitir seleccionar una foto del dispositivo en el alta y mostrar su previsualización.
- [x] Añadir tabla debajo del registro con los últimos artículos ingresados, fecha/hora, código, nombre, cantidad y ubicación.
- [x] Cambiar completamente la paleta de Inventario con contraste, jerarquía y estados profesionales.
- [x] Validar audio, foto, historial, alta, permisos, pruebas, build y responsive; publicar.

# Rediseño oscuro y ventana de últimos ingresos

- [x] Convertir Últimos ingresos en una ventana independiente dentro de Inventario, con apertura, cierre y tabla completa.
- [x] Cambiar el fondo y todos los colores del módulo Inventario a una paleta oscura profesional y legible.
- [x] Mantener accesibles los estados de stock, escaneo, alertas y acciones en escritorio y móvil.
- [x] Añadir o actualizar pruebas, validar TypeScript, Vitest, build y revisión visual antes de publicar.

# Importación Diesel Technic: Muelle de válvula

- [x] Identificar los resultados públicos verificables de la búsqueda “Muelle de válvula” (15 referencias localizadas en fichas indexadas).
- [x] Verificar e incorporar sin duplicados; las 15 referencias localizadas ya estaban en el catálogo con nombre, imagen y URL. No se añadieron copias.
- [x] Validar que las 15 referencias existentes funcionen en catálogo e Inventario; conservan sus códigos internos y quedan disponibles para búsqueda.
- [x] Confirmar que no se requiere cambio funcional ni migración; el catálogo publicado ya contiene las referencias verificadas.

# Importación Diesel Technic: válvulas

- [x] Inspeccionar la búsqueda pública de “válvulas” y delimitar las referencias verificables; se cubrió en la revisión exhaustiva de todas las páginas.
- [x] Comparar las referencias con el catálogo actual y evitar duplicados; se incorporaron solo 454 faltantes.
- [x] Incorporar las válvulas faltantes con nombre, imagen, ficha pública e imagen; GTIN solo cuando estaba confirmado por el mapa oficial.
- [x] Validar búsqueda, Inventario, pruebas, TypeScript y build; checkpoint publicado en c0ed891f.

# Importación Diesel Technic: válvulas — todas las páginas

- [x] Determinar el total de resultados y la paginación real de la búsqueda “valvulas” (2.234 resultados, 50 por página).
- [x] Recopilar las referencias de todas las páginas disponibles y validar sus fichas (2.233 referencias únicas).
- [x] Comparar contra Eurotruck e integrar solo las válvulas faltantes, sin duplicados (454 incorporadas; catálogo: 39.894).
- [x] Validar imágenes, GTIN disponibles, búsqueda, Inventario, 52 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Importación GTIN desde Valvulas_DieselTechnic_1.xlsx

- [x] Inspeccionar columnas, referencias y GTIN del archivo adjunto (hoja Valvulas, 1.519 filas, 1.490 válidas).
- [x] Cruzar los GTIN con las referencias de válvulas sin coincidencias ambiguas ni duplicados; 1.490 referencias coincidentes y 0 conflictos.
- [x] Actualizar el mapa GTIN persistente y asociar los códigos a Home e Inventario; se agregaron 1.292 asignaciones nuevas.
- [x] Validar búsquedas, Inventario, 52 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Corrección de referencia interna de válvulas

- [x] Retirar el prefijo `valvulas-` de los identificadores internos de los artículos nuevos; ahora usan el SKU como ID.
- [x] Asociar el GTIN correspondiente en la referencia interna y el mapa de búsqueda/escaneo, conservando SKU DT Spare Parts y código Zebra.
- [x] Validar referencias, búsquedas, Inventario, etiquetas Zebra, pruebas, TypeScript y build; publicar checkpoint.

# GTIN adicionales desde Inventario

- [x] Añadir en el detalle del artículo una opción para registrar GTIN antiguo y GTIN adicionales.
- [x] Persistir los GTIN sin borrar los códigos existentes y evitar duplicados o conflictos con otros SKU.
- [x] Hacer que búsqueda, escaneo e inventario resuelvan todos los GTIN asociados al mismo artículo.
- [x] Validar permisos admin1, pruebas, TypeScript, build y experiencia visual; publicar checkpoint.

# Acceso visible para agregar GTIN a cualquier artículo

- [x] Mostrar un botón claro “Agregar GTIN” al abrir cualquier artículo en Inventario.
- [x] Mantener visible el campo de entrada aunque el artículo no tenga GTIN registrado.
- [x] Confirmar que el código agregado queda asociado al SKU y funciona en búsqueda y escaneo.
- [x] Validar responsive, permisos admin1, pruebas, TypeScript y build; publicar checkpoint.

# Sincronización GTIN entre Inventario y página principal

- [x] Exponer una consulta segura de GTIN administrados para que Home use los alias agregados desde Inventario.
- [x] Combinar en Home los GTIN originales y adicionales por SKU sin duplicar artículos.
- [x] Hacer que la búsqueda principal encuentre un artículo mediante cualquier GTIN agregado.
- [x] Validar que Inventario y Home compartan los mismos GTIN, además de pruebas, TypeScript y build; publicar checkpoint.

# Limpieza de duplicados por SKU

- [x] Auditar cuántos artículos comparten el mismo SKU y clasificar duplicados exactos frente a variantes: 2.119 grupos y 3.169 filas repetidas.
- [x] Conservar por SKU el registro con más GTIN y fusionar cualquier GTIN válido sin perder códigos; verificación sin violaciones.
- [x] Eliminar del catálogo únicamente los duplicados exactos restantes, sin borrar historial ni movimientos de inventario; la base persistente no fue eliminada.
- [x] Validar búsqueda, Home, Inventario, alias GTIN, 54 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Reporte descargable de artículos contados

- [x] Inspeccionar la estructura visual, hojas, columnas, anchos y estilos del Excel de referencia.
- [x] Convertir “Artículos contados” en un botón de descarga del inventario.
- [x] Replicar el formato del archivo de referencia incluyendo encabezados, ubicación, cantidades, SKU y GTIN.
- [x] Validar archivo descargado, contenido, pruebas, TypeScript y build; publicar checkpoint.

# Hoja imprimible por área activa e importación de segmentos de pistón

- [x] Añadir un botón para imprimir el inventario del tramo y góndola activos con fecha/hora de impresión.
- [x] Replicar en la hoja imprimible los datos necesarios para conteo manual: SKU, descripción, referencia interna, cantidad, costo y precio.
- [x] Revisar todas las páginas de Diesel Technic para “Juego de segmentos de pistón” y recopilar referencias verificables.
- [x] Comparar e integrar únicamente los artículos faltantes con imagen, SKU y GTIN confirmado; 4 SKU añadidos, con GTIN cuando fue verificable.
- [x] Validar impresión, catálogo, búsqueda, 55 pruebas Vitest, TypeScript y build; publicar checkpoint.

# GTIN, entradas por cantidad, ventas del día y corrección de SKU

- [x] Inspeccionar el Excel de juntas tóricas y validar referencias y GTIN.
- [x] Importar los GTIN de juntas tóricas sin duplicar ni sobrescribir códigos existentes (464 registros procesados).
- [x] Permitir cantidad mayor que uno en Entrada manual y sumar el total en una sola operación.
- [x] Añadir en Cotizaciones una vista Venta del día con salidas, precio final y numeración por fecha.
- [x] Añadir junto a Agregar otro GTIN un botón rojo protegido para retirar artículos con SKU incorrecto, conservando historial.
- [x] Validar permisos, integridad, 57 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Precios de Inventario y carrito de cotización

- [x] Auditar cómo Inventario guarda precio final y cómo Cotizaciones construye sus líneas.
- [x] Cargar automáticamente el precio final de Inventario en nuevas líneas de Cotización, manteniendo edición manual.
- [x] Conectar el botón Agregar y la selección de artículos de Home con el carrito persistente/local.
- [x] Permitir cotizar juntos varios artículos seleccionados desde Home y reflejarlos en el resumen del carrito.
- [x] Validar sincronización de precios, carrito, PDF, 57 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Precio por cantidad y exportación ZIP autónoma

- [x] Confirmar que Cotizaciones use el precio final de Inventario como precio unitario para todos los artículos.
- [x] Confirmar que el subtotal y total multipliquen correctamente precio unitario por cantidad.
- [x] Preparar un ZIP con index.html en la raíz, CSS/JS locales, rutas relativas y carpeta images.
- [x] Descargar o empaquetar los recursos visuales locales sin depender de URLs externas; 35.222 imágenes descargadas y 60 imágenes reemplazadas por placeholder local.
- [x] Probar el ZIP offline, sus rutas, imágenes, carrito y cotización; entregar el archivo descargable.

# Sincronización de precio final con Cotizaciones

- [x] Auditar el flujo actual de precio final en Inventario y precio unitario en Cotizaciones.
- [x] Cargar automáticamente el precio final de Inventario en cada artículo nuevo de Cotización.
- [x] Mantener edición manual y recalcular subtotal/total según la cantidad.
- [x] Validar el flujo completo con pruebas, TypeScript y build; publicar checkpoint.

# Precio de Cotización sin movimientos de inventario

- [x] Auditar artículos con precio configurado pero sin movimientos o existencia.
- [x] Exponer el precio final guardado aunque la existencia sea cero o no haya conteos.
- [x] Separar visualmente precio unitario y disponibilidad en Cotizaciones.
- [x] Validar cotización, 58 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Escaneo automático continuo

- [x] Limpiar el campo de código después de cada escaneo reconocido.
- [x] Mantener seleccionado el artículo y la ubicación activa para el siguiente escaneo.
- [x] Registrar automáticamente un artículo reconocido sin Enter ni botón Registrar.
- [x] Validar escaneos repetidos, códigos desconocidos, permisos, 59 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Selección por clic para escaneo múltiple

- [x] Hacer clickeables por separado la referencia, SKU y GTIN para seleccionar el código objetivo.
- [x] Mantener el código seleccionado mientras se escanean varias unidades sin pulsar Enter.
- [x] Limpiar cada lectura y conservar artículo, ubicación y objetivo hasta elegir otro.
- [x] Validar escaneo múltiple, scroll, alertas, 60 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Corrección final: selección por clic de código

- [x] Hacer clickeables la referencia/SKU y cada GTIN para seleccionar el objetivo.
- [x] Mantener el objetivo seleccionado durante varias lecturas sin pulsar Enter.
- [x] Limpiar cada lectura y conservar ubicación y artículo hasta cambiar la selección.
- [x] Validar con 60 pruebas Vitest, TypeScript y build de producción.

# Corrección de clic y escaneo en campo de código

- [x] Restaurar el clic de la tarjeta para abrir/seleccionar sin sumar cantidad.
- [x] Mantener la selección persistente únicamente desde Referencia, SKU o GTIN.
- [x] Sumar automáticamente solo las lecturas que entren por el campo de código, sin Enter.
- [x] Validar tarjetas, escaneo, limpieza, ubicación, 60 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Corrección de scroll en área de creación

- [x] Identificar el contenedor del formulario de alta que impide subir y bajar.
- [x] Corregir overflow, altura, foco y overlay del formulario de creación.
- [x] Validar desplazamiento completo, carga de foto, campos, modal, escaneo, 60 pruebas Vitest, TypeScript y build; publicar checkpoint.

# Feedback compacto para escaneo continuo

- [x] Revisar la captura y confirmar que el bloque de objetivo mostraba nombre, ubicación y el botón Cambiar selección.
- [x] Reemplazar el bloque por el código escaneado como único feedback visible, con estado verde tras sumar.
- [x] Mantener la suma automática de +1 sin Enter y reenfocar/seleccionar el campo después de cada lectura.
- [x] Conservar el sonido de éxito/alerta, retirar el aviso textual duplicado y validar 61 pruebas Vitest, TypeScript y build.

# Nuevos ajustes solicitados: cantidad, precios públicos y borrado por ubicación

- [x] Añadir cantidad manual para cajas o múltiples unidades en la entrada de Inventario.
- [x] Ocultar costo y precio del catálogo público, conservándolos para Cotizaciones.
- [x] Añadir borrado protegido de conteos por ubicación con la clave 1989 sin eliminar artículos.
- [x] Actualizar pruebas, validar TypeScript/build y publicar checkpoint.

# Formato EUROTRUCK para artículos contados

- [x] Inspeccionar el Excel adjunto y reproducir su estructura en la hoja de artículos contados.
- [x] Añadir SKU y código de barras al reporte y a cada fila de artículo/ubicación.
- [x] Colocar el control Borrar conteo junto a ubicación y artículo con confirmación protegida.
- [x] Mantener la clave oculta y validar exportación, pruebas, TypeScript/build y publicar checkpoint.

# Nuevo formato EUROTRUCKINVENTARIO y acceso Inventario

- [x] Inspeccionar EUROTRUCKINVENTARIO.xlsx y documentar hojas, columnas, encabezados, estilos y campos.
- [x] Adaptar Artículos contados para descargar el mismo formato y completar cada campo con los datos disponibles.
- [x] Restaurar el botón Inventario en el acceso visible para admin1 y conservar sus permisos.
- [x] Validar descarga, contenido, permisos, pruebas, TypeScript/build y publicar checkpoint.

# Ajuste exclusivo de plantilla de Artículos contados

- [x] Reproducir exclusivamente EUROTRUCKINVENTARIO.xlsx en la descarga de Artículos contados, sin modificar otros módulos.

# Corrección de descarga XLSX real

- [x] Reemplazar la descarga HTML/XLS actual de Artículos contados por un archivo XLSX real compatible con Excel.
- [x] Validar que el XLSX conserve la plantilla EUROTRUCKINVENTARIO, sus datos y estilos, y publicar el checkpoint.

# Reorganización de Inventario y pedidos de bajo stock

- [x] Cambiar las etiquetas de ubicación para usar Estante y Tramo de forma consistente.
- [x] Mover Imprimir área activa al encabezado de Artículos contados y conservar su función.
- [x] Rediseñar Bajo stock como un pedido claro con artículo, SKU, ubicación, existencia y cantidad sugerida.
- [x] Validar interfaz, exportaciones, pruebas, TypeScript/build y publicar checkpoint.

# Credenciales empresariales y persistencia de artículos

- [x] Actualizar las credenciales locales de admin1, admin2, admin3 y admin4 según lo solicitado.
- [x] Verificar que admin1 tenga acceso total y los demás usuarios conserven sus permisos limitados.
- [x] Garantizar que artículos, imágenes, SKU, GTIN, precios e inventario permanezcan almacenados aunque se oculten o retiren del catálogo público.
- [x] Validar login, permisos, persistencia, 63 pruebas Vitest, TypeScript/build y publicar checkpoint.

# Códigos Zebra únicos para todo el catálogo

- [x] Auditar códigos Zebra actuales y detectar vacíos, duplicados o valores fuera de 7 dígitos.
- [x] Asignar códigos Zebra únicos a todos los artículos existentes sin modificar SKU, GTIN, imagen, precios ni demás datos.
- [x] Asignar automáticamente un código Zebra no repetido al crear cada artículo nuevo.
- [x] Mantener el código Zebra en escaneo, exportaciones y etiquetas ZPL, y validar pruebas/build antes de publicar.
