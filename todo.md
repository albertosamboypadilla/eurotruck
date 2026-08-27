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
