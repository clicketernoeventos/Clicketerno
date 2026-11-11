# Ficha WEB — la página pública y las invitaciones

*Sale de `PROYECTO.md` (que no se tocó). Lo dudoso va marcado **A CONFIRMAR**.*

## Qué es
`clicketerno.com.ar`: la vitrina que vende los tres productos (invitaciones, Muro en vivo, Rollo eterno) y la puerta de los que ya contrataron. Además aloja una carpeta por cada invitación de cliente.

## Cómo funciona
- Sitio estático en Cloudflare que publica `main`; sin build ni dependencias.
- Arriba de todo, tres pastillas (Invitaciones · Muro · Rollo): se toca una y abajo corre ESA prueba en un marco; el marco anterior se apaga.
- La galería de invitaciones es un teléfono más una fila de cuadraditos (uno por tarjeta, de `lib/trabajos.js`); `/invitaciones` es el mismo catálogo para mandar por WhatsApp.
- `/#entrar` lleva al que ya contrató: arma la fiesta (panel) o entra con código y clave.
- Cada producto cierra con presupuesto por WhatsApp con su propio mensaje; **sin precios** publicados.
- Paleta azul marino y celeste; el amarillo pálido es solo para detalles puntuales. Tipografía Hanken Grotesk.

## Archivos clave
`index.html`, `invitaciones.html`, `lib/trabajos.js` (lista de tarjetas), `404.html`, `empezar.html`, `privacidad.html`, `terminos.html`, `_headers` (CSP), `.assetsignore`, `<carpeta>/index.html` por tarjeta, `invitaciones/` (manual), `tarjetas/` (copias), `flyer/`.

## Estado
- Publicada con la paleta nueva, las pastillas y los cuadraditos (#87, #88, #89, #90).
- Cada tarjeta lleva su planilla y su tablero en `<carpeta>/listado`.
- Key y Xiomara siguen en Netlify, no en el repo.
- Pruebas: `bash pruebas/todo.sh muro` (31 suites) estaba en pie en la última publicación.

## Decisiones
- Todas las tarjetas se muestran ENTERAS en la galería; la planilla no recibe lo de la galería y llevan `noindex`.
- Una carpeta repartida no se mueve ni se renombra (hay QR impresos).
- Sin CDN, sin píxeles de terceros, sin service worker.
- Una planilla de Google por fiesta (`almi15` y `facuymaxi` quedan en la central).
- El blog y el video recap: descartados por el dueño.

## Pendientes
- Pedir permiso de exhibición a las familias (`valentinaegreso`, `maricel50`, `mia15`, `almi15`, `ambar15`, `facuymaxi`, `magali15`) y construir el modo `?muestra=1`.
- Datos de clientes que faltan: titulares de alias, fechas límite de confirmación, contacto de `facuymaxi`.
- Nombre del titular en privacidad y términos (el CUIT ya está).
- `mia15`, `mateoylucas`, `claraybruno` fallan `invitacion_mirar.js` desde antes.
- No hay `robots.txt` ni `sitemap.xml`. **A CONFIRMAR** si es a propósito.
- Traer a Key y Xiomara al repo.
