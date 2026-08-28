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
- [ ] Obtener de forma completa los GTIN disponibles para Scania, Volvo, Mercedes-Benz y MAN, sin inventar valores faltantes.
- [x] Asociar cada GTIN a la referencia correcta y conservar los artículos sin GTIN con estado explícito.
- [x] Extender el catálogo compartido, el inventario y la búsqueda para mostrar y localizar por GTIN.
- [x] Validar cobertura, deduplicación, rendimiento, permisos y ausencia de errores en la carga por fragmentos.
- [x] Permitir búsqueda exacta y parcial por número de referencia y por cualquiera de los GTIN asociados a cada artículo.
- [x] Mostrar el número de referencia y los GTIN verificados en las tarjetas, detalle e inventario.
- [x] Incorporar los GTIN obtenidos en el archivo oficial, conservando varios GTIN cuando una referencia tenga más de uno.
- [x] Validar búsquedas por referencia y GTIN con un artículo real presente en Scania, Volvo, Mercedes-Benz y MAN.

# Captura GTIN desde detalles

- [ ] Procesar las páginas de detalle de cada referencia de Scania, Volvo, Mercedes-Benz, MAN e Iveco con pausas y límite de concurrencia.
- [ ] Extraer el campo GTIN del detalle y asociarlo únicamente al SKU de la misma página.
- [ ] Conservar todos los GTIN cuando una referencia tenga más de un código y registrar los artículos sin GTIN.
- [ ] Habilitar búsqueda por referencia y GTIN en catálogo e inventario.
- [ ] Validar una muestra real por cada marca y generar cobertura de la importación.

# Alcance Scania solicitado

- [ ] Recorrer el filtro Scania `applications=103` y recopilar los enlaces de detalle disponibles.
- [ ] Extraer de cada detalle el SKU/referencia y todos sus GTIN, excluyendo referencias OE o sustituidas.
- [ ] Añadir el mapa verificado de Scania al catálogo y permitir localizarlo por referencia o GTIN.
- [ ] Validar el escaneo con el GTIN de un artículo real y conservar la referencia original en el resultado.
- [x] Procesar `catalogo_gtin_dt_spare_parts_final.csv`, validar sus columnas y asociar sus referencias con el catálogo Eurotruck.
- [x] Registrar cobertura, duplicados, conflictos y filas sin coincidencia antes de publicar los GTIN.
- [x] Añadir pruebas unitarias para coincidencia exacta por GTIN, múltiples GTIN y referencias que no tengan código importado.
- [x] Ejecutar TypeScript, Vitest y build después de integrar la búsqueda GTIN.
- [x] Corregir la coincidencia parcial por SKU/número de referencia en el helper compartido.
- [x] Mostrar “GTIN no registrado” de forma explícita en tarjetas y listados relevantes cuando no exista código importado.
- [x] Añadir una prueba de referencia válida sin GTIN, conservando su SKU y rechazando códigos ajenos.
- [ ] Ampliar el mapa GTIN con los 39.369 artículos restantes cuando exista una fuente oficial verificable para sus códigos.

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
