# Clicketerno

Sitio estático en Cloudflare (`wrangler.json`, carpeta `.`) más Supabase.
Sin build, sin dependencias: cada pantalla es un HTML suelto. Tres
productos: **invitaciones digitales** (las "tarjetas"), **Muro en vivo**
(`/muro`) y **Rollo eterno** (`/rollo`).

**Este archivo tiene solo lo que vale para las tarjetas y para trabajar con
el dueño.** Lo demás vive aparte y se lee cuando hace falta:

| Qué | Dónde |
|---|---|
| Muro, rollo, base, SQL, seguridad, página pública, lo legal, pendientes del proyecto | `PROYECTO.md` (leerlo antes de tocar algo de afuera de una tarjeta) |
| Cómo se hace una tarjeta, paso a paso | skill `/tarjeta` (`.claude/skills/tarjeta/SKILL.md`) |
| El manual de las invitaciones (CSP, pesos, nombres reservados, RSVP) | `invitaciones/COMO-SE-HACE.md` |
| La crónica de cada tarjeta | `invitaciones/HISTORIA.md` (leer la de la que se copia) |
| Copia del HTML de cada tarjeta terminada | `tarjetas/<nombre>.html` (archivo, no se publica) |
| Este archivo como era antes del 11/11/2026, entero | `respaldo/CLAUDE-2026-11-11.md` |

## Cómo trabajar con el dueño

- **Todo termina PUBLICADO**: cambio, pruebas, commit, merge a `main` y
  verificar en `clicketerno.com.ar`, de corrido. No se pide permiso en el
  último paso.
- **El contenido sí es suyo**: un dato que no mandó el cliente (hora,
  fecha, titular de una cuenta, alias) no se inventa. Su renglón no se
  dibuja y se anota como pendiente.
- **No explicarle el cómo** (*"yo no sé programación"*). El informe es qué
  cambió, qué se ve distinto y qué falta de su lado. Corto, en castellano.
- **No gastarle la sesión**: correr solo las pruebas que ven el cambio, una
  vez y al final; nada de volcar archivos enteros; respuestas cortas.
- **Cuando hay opciones, dar la más simple** (*"no quiero renegar"*).
- **El SQL va pegado en el chat**, listo para copiar, nunca como adjunto.
- **El negocio está en Rosario (UTC−3).** Fechas y horas se piensan desde
  ahí. `new Date("AAAA-MM-DD")` y `toISOString()` dan UTC: no usarlos para
  fechas de una fiesta.
- **Un link nunca va pelado**: va con un texto sentido, en la voz de quien
  invita, y los datos abajo, cortos.
- **"Pasame el listado"** = el texto para el cliente con el link
  `https://clicketerno.com.ar/<carpeta>/listado` y la contraseña de esa
  fiesta, de la tarjeta que se está haciendo en el chat. La contraseña va
  en el chat, nunca en el repo.
- WhatsApp del negocio: **341 250-6451**. No se cambia.

## Reglas fijas de las tarjetas

**Cómo nace una.** Se copia la más parecida (`ambar15/` con sobre,
`facuymaxi/` sin sobre; las últimas son `maricel50/` y `valentinaegreso/`)
y se le cambia la cara, no la maquinaria. Carpeta en la raíz, en
minúscula, sin espacios ni acentos: `<nombre>/index.html` se sirve en
`clicketerno.com.ar/<nombre>`. **Repartido el link, la carpeta no se mueve
ni se renombra.** Los `id` que buscan las pruebas (`#abrir`, `#portada`,
`#cD #cH #cM #cS`, `#calendario`, `#rsvp`, `#fNombre`, `#fLugares`,
`#fComida`, `#fMensaje`, `#enviar`, `#aviso`) no se renombran.

**Los datos.** Hacen falta: quién festeja, qué, fecha, hora, salón, dress
code, alias y hasta cuándo se confirma. Todo sale del `CONFIG`; un campo
vacío no se dibuja. **El alias y la frase del cliente se copian tal cual**
(un punto final puede ser parte del alias). El **titular de la cuenta**
casi siempre falta y hay que pedirlo.

**Lo que lleva toda tarjeta:**

- `<meta name="color-scheme" content="light dark">` y el bloque
  `prefers-color-scheme: dark` que no cambia nada (si no, Android la da
  vuelta).
- `noindex`, y su `og.jpg` de 1200x630 **tipográfica**, nunca una foto de
  la fiesta.
- `html:not(.js) #sobre{display:none}` más el script del `<head>` que pone
  la clase: sin JS el sobre no puede tapar la invitación.
- Las `<img>` las crea el JS y la sección aparece cuando la foto cargó.
- Fotos en `.webp`, hasta 1600 px y 300 KB cada una; la carpeta, hasta
  12 MB. Un archivo pesado que haga falta (un video) va con su excepción
  `!` en `.assetsignore` y `.gitignore`.
- Lo aleatorio sale de una semilla fija (la fecha de la fiesta).
- El aviso de datos (artículo 6, Ley 25.326) adentro del formulario.
- Encuadres mirando la pantalla terminada en el aparato más chico, y el
  texto que cae sobre una foto medido también en escritorio.

**Diseño.**

- Que se vea lujosa y que no sea igual a la anterior. Iconos dibujados a
  mano (la CSP no deja un CDN de iconos).
- Movimiento que sorprende sin molestar: **cada animación pasa una vez o
  va atada al scroll**. Todo se apaga con "menos movimiento".
- De una referencia se copia el recurso, no el color. Nunca un logo de
  otra marca ni fotos de personas sacadas de internet. Si el cliente tiene
  su logo o afiche, se usa el suyo.
- La paleta del cliente crece: se calcula el contraste antes de escribir
  CSS. Si un bloque trae su propio fondo, trae su propia tinta. Una
  `var()` que no existe no da error: deja negro sobre negro.
- Tipografías en dos variables (`--titulos`, `--texto-f`); el peso pedido
  en el `<link>` es el que usa el CSS. Se eligen mirando
  (`node pruebas/letras.js <carpeta>`).
- La canción: tres mandos que funcionan, suena una vez y se rebobina, dos
  archivos (AAC + Opus), `preload="metadata"`, arranca con el toque que
  abre el sobre.
- El sobre no deja ver la carta y de la carta a la portada va un cruce.
- Con `vector-effect:non-scaling-stroke`, `pathLength` no anda en Chrome.

## La planilla y el tablero

- **Una planilla por fiesta** (decisión del 01/11/2026). `CONFIG.evento`
  vacío y `CONFIG.endpoint` con el `/exec` de esa fiesta. `almi15` y
  `facuymaxi` siguen en la planilla central y no se mueven.
- Al terminar la tarjeta se entrega, sin que lo pida, una copia de
  `apps-script/evento-nuevo.gs.txt` con `CLAVE_ELEGIDA` (la que eligió el
  cliente, o vacía) y `CLAVE_MAESTRA_ELEGIDA` ya escritas, **en la carpeta
  de borradores, nunca en el repo**, con los cinco pasos: crear la
  planilla, pegar el código, correr `preparar()`, implementar, pasar la
  `/exec`.
- Dos avisos al entregarlo: volver a implementar es *Administrar
  implementaciones → editar → Versión nueva* (una implementación nueva
  cambia la dirección), y sin correr `preparar()` el cliente no entra a su
  tablero.
- Con la `/exec` en la mano: `CONFIG.endpoint`, la copia de
  `invitaciones/plantilla-listado/index.html` en `<carpeta>/listado/` con
  sus dos líneas de `CONFIG` (sin cambiarle el estilo), y publicar.
- El instructivo genérico del tablero sale con `bash flyer/armar.sh`.
- **Ninguna clave va al repo** (ni la maestra ni la de un cliente): hay una
  prueba que falla si lo versionado deja de estar vacío. Sacarla después
  no la saca del historial.

## Probar: dos comandos, una vez, al final

    python3 pruebas/servidor.py 8099        # en segundo plano
    node pruebas/invitacion_mirar.js <carpeta>
    node pruebas/invitaciones.js

Se suman `listado` y `rsvp` solo si se tocó el tablero o el Apps Script.
Si se toca algo de afuera de la carpeta de la tarjeta (`lib/`,
`index.html`, las apps, `_headers`, `pruebas/`), va `bash pruebas/todo.sh`
entero y vale lo de `PROYECTO.md`.

Una comprobación nueva se rompe a propósito para ver que falla. Si
`todo.sh` dice "ya había algo sirviendo", matar el servidor viejo y correr
de nuevo.

## Publicar

1. Traer lo último: `git fetch origin main && git merge origin/main`.
2. Commit en la rama de trabajo, en castellano; `git push -u origin <rama>`.
3. Pull request y merge a `main` (squash). Cloudflare publica `main`.
4. Mirar el check **"Workers Builds"** del commit: si dice *failure*, lo
   publicado es lo de antes.
5. Verificar lo publicado bajando `clicketerno.com.ar/<carpeta>`.

`.assetsignore` decide qué NO sube a la web: `.git/`, `sql/`, `pruebas/`,
`apps-script/`, `flyer/`, `tarjetas/`, `respaldo/` y los `.md`. Antes de
sumar un archivo al repo, preguntarse si se quiere público. Borrar un
archivo que un HTML publicado nombra deja una imagen rota en todo el que
tenga ese HTML guardado.

## Galería y permisos

Una tarjeta de cliente no entra en la galería de Trabajos ni en
`/invitaciones` sin el permiso de la familia (son fotos de sus hijos en
una dirección pública; artículo 53 del Código Civil y Comercial). La
respuesta se anota en la crónica con fecha. La ficha la suma el chat de la
página, en `lib/trabajos.js`.

## Lo que nunca

- Inventar un dato del cliente.
- Escribir una clave en el repo, o un dato real de un cliente como dato de
  prueba.
- Un CDN, un píxel de terceros o grabación de sesión.
- Tocar sin permiso: la clave maestra, las políticas de Supabase,
  `app.html` (hay QR impresos apuntando ahí) y el número de WhatsApp.

## Al terminar cada vuelta

- La crónica en `invitaciones/HISTORIA.md`: qué pidió el cliente, qué se
  descartó y por qué.
- Lo que falta del lado del cliente o del dueño, en "Pendiente" de
  `PROYECTO.md`.
- Una copia del `index.html` terminado en `tarjetas/<nombre>.html`.
