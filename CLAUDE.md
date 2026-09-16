# Clicketerno

Dos servicios para fiestas, un sitio estático y una base. No hay build, no
hay dependencias, no hay framework: cada pantalla es un HTML suelto que
habla directo con Supabase. Si algo parece que necesita `npm install`, está
mal pensado.

| Dirección | Archivo | Qué es |
|---|---|---|
| `/` | `index.html` | la página pública |
| `/muro` | `muro.html` | **Muro en vivo**: fotos y saludos proyectados en el salón, + su panel |
| `/rollo` | `rollo.html` | **Rollo eterno**: la cámara descartable, + su panel |
| `/app` | `app.html` | redirección a `/muro`. **No borrar**: hay QR impresos apuntando ahí |

**Son dos servicios aparte.** Comparten la tabla de eventos y el sistema de
clave, pero se manejan cada uno desde lo suyo: al rollo no se llega nunca
pasando por el muro. Un evento puede tener los dos, o uno solo.

## Cómo trabajar con quien lleva el proyecto

Esto no es un detalle de estilo: es la diferencia entre que algo sirva y que
quede a medio hacer.

- **El SQL va pegado en el chat, listo para copiar.** De ahí se copia al
  SQL Editor de Supabase y el resultado vuelve pegado al chat. Nunca como
  archivo adjunto, nunca "corré esto" sin el bloque a mano.
- **Cuando hay opciones, dar la más simple.** Lo dijo con todas las letras:
  *"no quiero renegar"*. Una recomendación, no un menú.
- **Del otro lado no se depura.** Si algo falla en el teléfono, lo que
  llega es "no anda" o una captura. La prueba tiene que existir antes de
  que la pruebe una persona.
- **El negocio está en Rosario (UTC−3).** Todo lo de fechas y horas se
  piensa desde ahí, no desde UTC. Ya costó un bug fatal.
- El teléfono del negocio es **341 250-6451** y no se cambia.

## Arrancar

    bash pruebas/todo.sh

Levanta los servidores que hagan falta, corre las pruebas del muro, las del
rollo y las de la base, y apaga solo lo que haya levantado. También
`todo.sh muro`, `todo.sh rollo`, `todo.sh sql`.

Correr **todo** antes de mergear, no solo lo que tocaste: los dos servicios
comparten `pruebas/fakesb.js`, las tablas y el sistema de clave.

## Cómo está armado

- **Estático en Cloudflare** (`wrangler.json`, directorio `.`). Las
  direcciones limpias sirven `muro.html` en `/muro` y `rollo.html` en
  `/rollo`.
- **Supabase**: PostgREST + Storage. La clave `anon` está escrita en el
  HTML, a propósito: es pública por diseño, lo que protege de verdad son
  las políticas de la base.
- **Nadie entra directo a las tablas.** RLS prendido y **sin políticas**,
  que en Postgres quiere decir "nadie". Todo pasa por funciones
  `security definer` (`ce_mi_rollo`, `ce_tomar_foto`, `ce_album_de`…).
- **Clave por evento**: viaja en la cabecera `x-clave`, la valida
  `ce_permitido()` leyendo `current_setting('request.headers')`. Se guarda
  en el navegador del organizador; desde otro teléfono se la pide.
- **Las fotos del rollo viven en un depósito privado** (`ce-rollos`). Esa
  privacidad **es** el producto: antes del revelado no se puede ni firmar
  una URL. Se leen con URLs firmadas, de a 100, y duran una hora.

### Lo que está corrido en producción

`sql/claves.sql` y `sql/rollo.sql` están instalados y confirmados, con el
depósito `ce-rollos` y sus tres reglas. De `sql/columnas.sql` (del muro) no
hay confirmación de primera mano: antes de darlo por puesto, correr
`sql/revisar.sql` y mirar.

**Desde acá no se llega a la base de producción.** Cualquier cambio de SQL
va pegado en el chat, en un bloque listo para copiar, y lo corre una
persona en el SQL Editor. Para ver qué está puesto y qué falta:
`sql/revisar.sql` y `sql/rollo_revisar.sql`.

### Probar sin tocar producción

`sql/esquema_falso.sql` arma una copia del esquema en un Postgres local y
`sql/probar.sql` y `sql/rollo_probar.sql` la atacan como lo haría un
invitado curioso: ¿puede revelar antes de hora?, ¿puede sacar más fotos que
las del cupo?, ¿puede ver las de otro?

## Reglas que ya nos costaron caro

- **Las horas.** `datetime-local` devuelve la hora de la pared, sin zona.
  Mandarla tal cual a una columna `timestamptz` la corre tres horas: un
  revelado puesto para hoy a la tarde **ya había pasado**, así que el rollo
  nacía revelado y al invitado no se le abría nunca la cámara. Usar `aUTC()`
  al guardar y `aLocal()` al mostrar. Y `toISOString().slice(0,10)` da la
  fecha **en UTC**: después de las nueve de la noche acá, ya es mañana.
- **Los cortes silenciosos.** La base corta en 1000 filas por pedido, y hay
  cortes nuestros además: en el rollo era un `limit 400` adentro de
  `ce_album_de`. El álbum decía "1450 fotos" y entregaba 400, y el zip del
  organizador se bajaba con esas 400 diciendo **"Listo"**. Toda lectura que
  pueda traer de más se pide de a tandas. Buscar los dos límites: los de la
  base y los nuestros.
- **No mentirle al usuario.** Si algo no se guardó, el mensaje no puede
  decir "listo". Hay pruebas que verifican exactamente eso.
- **`null` en una comparación.** `0 >= null` da **verdadero** en JavaScript
  y `disparos >= null` **nunca** es verdadero en SQL. Con `cupo_fotos`
  vacío, al invitado le decía "ya sacaste tus fotos" sin haber sacado
  ninguna, y del lado de la base no había tope. `coalesce` de los dos lados.
- **Postgres aplica las políticas de SELECT al `DELETE ... WHERE`.** Por eso
  las fotos de un evento borrado quedaban inalcanzables para siempre: la
  regla de lectura miraba el revelado, que ya no existía.
- **Safari no tiene `ctx.filter`.** En iPhone la foto se guardaba sin filtro
  y nadie se enteraba hasta el revelado. Las matrices de color se calculan a
  mano, recortando entre filtro y filtro.
- **iOS corta la cámara solo** al bloquear el teléfono o cambiar de app.
  Hay que escuchar `onended`/`onmute` y `visibilitychange` y volver a
  prenderla, y no gastarle una foto al invitado si el cuadro viene negro.
- **`innerText` devuelve el texto ya transformado por el CSS.** Medio muro
  está en mayúsculas: comparar contra `'Probar de nuevo'` falla aunque en
  pantalla diga eso. Comparar siempre en minúsculas.
- **Nombres de clase repetidos.** `.tapa` y `solapa()` ya existían y fueron
  pisados: una capa se comía los clics, la otra tiraba "Algo se cortó".
  Antes de inventar un nombre, `grep`.

## Reglas para las pruebas

- **Una prueba que pasa siempre no prueba nada.** Escrita la prueba,
  corrigela contra el código *anterior* al arreglo y comprobá que falla. Si
  pasa en los dos, no estás midiendo lo que creés. Pasó con la del orden de
  las tandas: creía que probaba el desempate por `id` y no lo probaba.
- **Nunca una ruta de tu carpeta de borradores.** Una prueba tenía
  `/tmp/qa/jszip.min.js` escrito a mano. En esa máquina pasaba; en
  cualquier otra decía `ZIP → NO bajó`, que suena a producto roto y no lo
  era. Lo que falte se busca con `pruebas/jszip_local.js` o se saltea
  **diciéndolo**: una dependencia ausente no es un bug.
- **No editar un script mientras se está ejecutando.** Bash lee el archivo
  por posición, no de una: si se le insertan líneas en el medio, retoma a
  mitad de una palabra y tira un error de sintaxis en una línea que en
  disco está perfecta. Media hora buscando un bug que no existía.
- **Una prueba que falla siempre deja de ser información.** `stress`
  informa 15 observaciones de sus modos que rompen a propósito (cuenta cada
  `console.error`, y en los modos `fail` y `net` el error es justamente lo
  que se busca). Están anotadas por modo en `pruebas/linea-base` y el
  corredor avisa solo cuando **cambian**. No subir ese número para que deje
  de molestar: mirar qué apareció. Los modos `ok` y `evil` tienen que dar
  cero, siempre.
- **Cuidado al comparar contra `main`.** `git worktree` te da los archivos
  de main, pero las pruebas apuntan a un puerto fijo: si el servidor
  levantado sirve tu copia de trabajo, estás corriendo las pruebas de main
  contra tu propio HTML. Hay que servir el worktree en otro puerto y
  apuntar ahí. Nos mandó a una conclusión falsa.
- **Las suites no son repetibles por arte de magia.**
  `esquema_falso.sql` tira las tablas del rollo *antes* que `ce_eventos`: si
  se tira `ce_eventos` "cascade" con las otras en pie, se lleva puestas sus
  claves foráneas y el `create table if not exists` no las repone. La copia
  quedaba sin borrado en cascada y la prueba que justo cuida eso pasaba
  sola en la segunda corrida, sobre datos sucios.
- **Lo que falla por el entorno no es una falla del producto.** Un proxy
  que firma los certificados hace que el navegador rechace el CDN y la
  prueba lo contaba como error del rollo. Todo lo que sea "no pude bajar un
  archivo" es ruido: lo que no se perdona es un error de JavaScript.

## Lo que se publica en clicketerno.com.ar

`wrangler.json` sube **toda** la carpeta. Lo que no tiene que estar en la
web va en `.assetsignore` (`sql/`, `pruebas/`, los `.md`). Sin ese archivo,
`clicketerno.com.ar/sql/claves.sql` se bajaba desde el navegador — y ese
archivo llevaba la clave maestra de producción escrita en texto plano.
Antes de agregar un archivo al repo, preguntate si querés que sea público.

## Lo que no se toca sin permiso

- La clave maestra de administrador.
- Las políticas de Supabase ya instaladas.
- `app.html`: hay QR impresos apuntando ahí.
- El número de WhatsApp.

## Pendiente, decidido y no hecho

- **Video recap** del álbum, armado en el teléfono con WebCodecs
  (`VideoEncoder`, Safari 16.4+). Se puede sin servidor. Idea tomada de la
  competencia; gustó.
- **Dónde viven las fotos a la larga.** Una foto pesa ~441 KB: un evento de
  100 invitados con 24 fotos son ~1 GB. **El plan gratis de Supabase no
  aguanta un solo casamiento.** Hay que decidir entre Supabase Pro y
  Cloudflare R2, y fijar hasta cuándo se guardan.
- **Miniaturas.** El álbum baja las fotos enteras para mostrarlas chiquitas;
  generar miniaturas al subir ahorraría cerca de 11 veces el tráfico.
- **Los nombres de los servicios.** "Muro en vivo" y "Rollo eterno" son
  provisorios.
