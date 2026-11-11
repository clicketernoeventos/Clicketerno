# Ficha ROLLO — Rollo eterno

*Sale de `PROYECTO.md` (que no se tocó). Lo dudoso va marcado **A CONFIRMAR**.*

## Qué es
Una cámara descartable en el teléfono de cada invitado: 24 fotos que no se ven hasta el "revelado" que fija el organizador. `/rollo`.

## Cómo funciona
- El invitado lee el QR, pone su nombre y saca fotos con cinco filtros en vivo. La tira de cuadraditos y el número "quedan" muestran cuántas le faltan.
- Las fotos van a un depósito PRIVADO (`ce-rollos`): antes del revelado ni se puede firmar una URL. Después se leen con URLs firmadas que duran una hora.
- Al revelar hay un cuarto oscuro con una copia cada 1,4 s; el álbum se puede descargar en zip.
- El alta tiene seis pasos (nombre, qué festejan y cuándo, cuándo se ven, cuántas por invitado, cuánta gente, resumen) y pide código de activación en el primero.
- El organizador elige el color de la fiesta entre cuatro tonos fijos.
- Demostración: `/rollo?demo=1` (álbum revelado) y `?camara=1` (cámara sin revelar).

## Archivos clave
`rollo.html`, `rollo.webmanifest`, `sql/rollo.sql`, `sql/camaras.sql`, `sql/blindaje.sql`, `sql/rollo_revisar.sql`, `pruebas/rollo_*.js`, `demo/`.

## Estado
- Probado por el dueño en iPhone: salió el ✕ de la cámara y el revelado que se tapaba a sí mismo.
- Topes en la base: `cupo_invitados` y la ráfaga de altas. `camaras.sql` frena 100 cámaras por minuto y no cuenta las vacías. **A CONFIRMAR** que esté corrido en producción.
- La clave maestra funciona sobre cualquier rollo; el álbum baja en tandas de 500 sin cortes silenciosos.

## Decisiones
- Es un servicio aparte del muro: no se llega al rollo pasando por el muro.
- La privacidad es "el servidor se niega a firmar", no "la dirección es difícil".
- Nada de píxeles ni grabación de sesión donde un menor saca una foto.
- Una URL firmada no se puede anular: "volver a ocultar" avisa que valen una hora más.
- Sin service worker; se instala con manifiesto.
- Descartado: recap en video.

## Pendientes
- Probar con un salón lleno (200 teléfonos en el mismo wifi): es lo único sin ver, solo se ve la primera noche real.
- Contratar Supabase Pro y el respaldo del depósito (misma situación que el muro).
- Estado de `camaras.sql` y `activacion.sql` en producción: **A CONFIRMAR** con `sql/estado.sql`.
- El "Estudio" del competidor (piezas con la marca del evento) no está pedido.
- La central y el borrado de vencidos viven en el muro: el rollo depende de eso para limpiarse.
