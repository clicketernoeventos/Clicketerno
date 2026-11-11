# Ficha MURO — Muro en vivo

*Sale de `PROYECTO.md` (que no se tocó). Lo dudoso va marcado **A CONFIRMAR**.*

## Qué es
Las fotos y saludos de los invitados proyectados en el salón en tiempo real, más el panel del organizador. `/muro`.

## Cómo funciona
- El invitado entra por el QR o el código (sin clave ni cuenta), manda foto o texto; si el organizador moderó, aparece cuando él aprueba.
- La pantalla del salón rota cada 7 s; pide solo la "punta" de lo nuevo y relee todo cada ~3,5 min para enterarse de lo borrado.
- Cuatro puertas en la portada: organizador, código y clave, invitado, proyector.
- El código se escribe como salga (minúscula, sin guión, solo los seis finales).
- Álbum descargable en zip, tarjetas A4 para cortar, y la central `/muro#central` (solo con la clave maestra): lista todos los eventos, borra vencidos y genera códigos de activación.
- Cada evento vence a los 90 días, con aviso 15 días antes.
- Demostración: `/muro?demo=1`, todo en memoria; lo que manda el visitante se borra a los 2 min.

## Archivos clave
`muro.html`, `muro.webmanifest`, `demo/` (diez fotos reales), `lib/qrcode.min.js` y `lib/jszip.min.js`, `sql/claves.sql`, `sql/blindaje.sql`, `sql/blindaje2.sql`, `sql/rafaga.sql`, `sql/activacion.sql`, `sql/estado.sql`, `pruebas/fakesb.js`.

## Estado
- Base blindada (`blindaje2.sql` corrido el 21/09/2026): tope de 2000 recuerdos y 300 por minuto por fiesta (`rafaga.sql`, 22/09).
- Alta protegida con código de activación (`activacion.sql`). **A CONFIRMAR** si está corrido en producción: no figura en lo que el dueño reportó como corrido.
- Reintentos de red: 3 intentos y tope total de 4 minutos; el último pedido (`anotarItem`) también reintenta.
- Miniaturas en el álbum; la proyección usa la foto entera.

## Decisiones
- Primero la web y después el SQL.
- Sin moderación en la demostración.
- El panel solo muestra los eventos cuya clave está guardada en ese aparato.
- La clave maestra vive en `sessionStorage`, nunca en disco.
- Los tonos son cuatro y fijos (Oro, Perla, Rosa antiguo, Salvia).
- Desde acá no se llega a producción: el SQL va pegado en el chat.

## Pendientes
- Contratar Supabase Pro (por depósito y porque el plan gratis pausa el proyecto). **A CONFIRMAR** si ya se contrató.
- Limpieza mensual a mano en `/muro#central`; no hay nada automático.
- Rotar la clave maestra, que nunca se cambió.
- Respaldo del contenido: hoy las fotos están en un solo lugar.
- Registro de la base en la AAIP.
- El freno de altas de `ce_eventos` es global (30 por minuto): **A CONFIRMAR** si se acepta o se cuenta por IP.
- Los nombres "Muro en vivo" y "Rollo eterno" son provisorios.
