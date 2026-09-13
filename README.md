# Clicketerno

Sitio estático (Cloudflare) + Supabase. Sin build: `index.html` es la
página pública, `app.html` es la app del organizador y del invitado (muro
digital, en vivo), y `camara.html` es la cámara descartable de cada evento.

## Cámara descartable

Cada invitado saca una cantidad limitada de fotos (24 por defecto) con uno
de 5 filtros, y nadie ve ninguna —ni quien la sacó— hasta que se revela el
rollo: a una hora que fija el organizador, o a mano con el botón "Revelar
ahora". Al revelarse, primero cada uno ve las suyas y después puede pasar
al álbum completo del evento.

Se activa desde el panel del evento en `app.html` (pestaña **Cámara**), y
para que funcione hace falta correr una vez en el SQL Editor de Supabase:

1. `sql/claves.sql` (si todavía no está corrido: es la base del sistema de
   clave por evento).
2. `sql/rollo.sql` — tablas, funciones y el depósito privado de la cámara.
3. `sql/rollo_revisar.sql` — pega el resultado para confirmar que quedó
   todo instalado.

Detalles de diseño (por qué el depósito es privado, por qué el filtro se
aplica al sacar la foto y no después, qué falta) en los comentarios de
`sql/rollo.sql` y `camara.html`.
