# Cómo trabajar en este repo

Hay **dos sesiones de Claude trabajando en paralelo** sobre el mismo
repositorio, cada una en su rama, y las dos mergean a `main`. Este archivo
es el acuerdo entre las dos. Leelo antes de tocar nada.

## Quién es dueño de qué

| Archivo | Dueño | Rama |
|---|---|---|
| `muro.html`, `app.html` | sesión **Muro** | `claude/code-review-0wp0ht` |
| `rollo.html` | sesión **Rollo** | `claude/clicketerno-event-photos-yvyyfs` |
| `index.html` | Muro | |
| `sql/claves.sql`, `sql/columnas.sql`, `sql/probar.sql`, `sql/esquema_falso.sql`, `sql/revisar.sql` | Muro | |
| `sql/rollo*.sql` | Rollo | |
| `pruebas/rollo_*.js` | Rollo | |
| el resto de `pruebas/` | Muro | |
| `README.md`, `CLAUDE.md` | las dos (secciones separadas) | |

**Dueño** no significa permiso exclusivo: significa que si vas a tocar un
archivo que no es tuyo, lo decís en el mensaje del commit y avisás a la otra
sesión. Los archivos compartidos de verdad (`fakesb.js`, `README.md`) se
tocan con cuidado y sin reescribir lo ajeno.

## Antes de empezar a trabajar

    git fetch origin main && git merge origin/main

La otra sesión mergea a `main` sin avisar. Si arrancás sin traer sus cambios
vas a estar editando un archivo viejo — ya pasó: el muro se mudó de
`app.html` a `muro.html` mientras la otra sesión escribía sobre el archivo
anterior, y hubo que portar todo a mano.

## Antes de mergear a main

Correr **todas** las pruebas, no solo las tuyas. Las dos sesiones comparten
`pruebas/fakesb.js` y la misma base de datos, así que un cambio en el rollo
puede romper el muro y al revés.

    python3 -m http.server 8099 --bind 127.0.0.1 &
    for t in stress extras nuevas borrar xss hostil diagnostico; do node pruebas/$t.js; done
    node pruebas/rollo_navegador.js && node pruebas/rollo_organizador.js

Si una prueba que no es tuya falla, **no la ignores y no la arregles a
ciegas**: fijate primero si ya fallaba antes de tus cambios

    git worktree add --detach /tmp/limpio origin/main

y avisá a quien corresponda. Una prueba ajena en rojo es información, no
ruido.

## Reglas que ya nos costaron caro

- **`innerText` devuelve el texto YA transformado por el CSS.** Media app
  está en mayúsculas: comparar contra `'Probar de nuevo'` falla aunque en
  pantalla diga exactamente eso. Comparar siempre en minúsculas.
- **Nombres de clase CSS repetidos.** `.tapa` y la función `solapa()` ya
  existían y fueron pisadas por código nuevo: una capa se comía los clics,
  la otra tiraba "Algo se cortó". Antes de inventar un nombre, `grep`.
- **Una prueba que pasa siempre no prueba nada.** Cuando escribas una
  prueba nueva, corrigela contra el código *anterior* al arreglo y
  comprobá que falla. Si pasa en los dos, no estás midiendo lo que creés.
- **La base corta en 1000 filas por pedido.** Cualquier lectura que pueda
  traer más (recuerdos, fotos del rollo, archivos del depósito) se pide de
  a tandas. Sin eso se pierden datos en silencio, que es la peor manera.
- **No mentirle al usuario.** Si algo no se guardó, el mensaje no puede
  decir "listo". Hay pruebas que verifican exactamente esto.

## Deuda conocida

- `pruebas/rollo_organizador.js` falla en `ZIP → NO bajó`. Ya fallaba en
  `main` antes del repaso del 14/09 (verificado con un worktree limpio).
  Es de la sesión Rollo.
- `pruebas/rollo_navegador.js` puede dar 4 fallas de
  `ERR_CERT_AUTHORITY_INVALID`: es el contenedor, no el código (pasa igual
  con `main` limpio). No lo persigas.

## Lo que se publica en clicketerno.com.ar

`wrangler.json` sube **toda** la carpeta. Lo que no tiene que estar en la
web va en `.assetsignore` (`sql/`, `pruebas/`, los `.md`). Sin ese archivo,
`clicketerno.com.ar/sql/claves.sql` se bajaba desde el navegador — y ese
archivo llevaba la clave maestra de producción escrita en texto plano.
Antes de agregar un archivo al repo, preguntate si querés que sea público.

## Invitaciones alojadas en el repo

Cada invitación es una carpeta con su `index.html` en la **raíz** del repo:
`delfina15/index.html` se sirve en `clicketerno.com.ar/delfina15`. Las
reglas y los nombres prohibidos están en `invitaciones/LEEME.md`, y
`pruebas/invitaciones.js` las verifica (que no tapen una ruta de la app,
que no apunten a Netlify, que no usen caminos absolutos, que no pesen de
más). Correla cuando entre una invitación nueva.

## Lo que no se toca sin permiso del dueño del proyecto

- La clave maestra de administrador.
- Las políticas de Supabase ya instaladas (`sql/claves.sql` está corrido en
  producción; cualquier cambio hay que dárselo a él para que lo corra).
- El número de WhatsApp: **341 250-6451**.
