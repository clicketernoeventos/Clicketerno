# Clicketerno

**Todo el proyecto se lleva desde un solo chat.** Antes eran dos sesiones en
paralelo, cada una con sus archivos, y se pisaron: el muro se mudó de
`app.html` a `muro.html` mientras la otra escribía sobre el archivo viejo.
Si alguna vez vuelven a ser dos, lo primero es repartir los archivos por
escrito y traer `main` antes de cada tanda.

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

Los dos tienen **modo demostración**: `?demo=1` (`/muro?demo=1`,
`/rollo?demo=1`) arma una fiesta inventada y **no toca Supabase ni el
almacenamiento del navegador**. Es a donde apuntan los botones "Probar la
demostración" de `index.html`. Antes esos botones abrían la app de verdad:
desde ahí se veían los eventos de todos los clientes en "Tus eventos" y el
botón "cargar una fiesta de ejemplo" escribía un evento inventado **en la
base de producción**. `pruebas/demo.js` cuida que no vuelva a pasar.

**La demostración del muro es SOLO lo que ve un invitado**: se entra en la
pantalla de subir, se deja una foto o un saludo y se lo ve proyectado en la
pantalla del salón. El panel del organizador, el cartel y el diagnóstico no
son parte de la muestra: `panel`, `evento`, `cartel`, `portada` e
`invitado` caen todos en `subir/DEMO-FIESTA`. Y la fiesta de ejemplo va
**sin moderación**: con `moderar` en true, lo que mandaba el visitante decía
"Enviado, el organizador lo aprueba" y no se veía nunca, o sea que el
ejemplo no mostraba nada.

**Se siembra en cada carga, sin preguntar si ya estaba, y la cinta tiene
"Empezar de nuevo"** (que es una recarga: todo vive en memoria). Es un modo
prueba: el que entra después no tiene que encontrarse con lo que dejó el
anterior.

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

### El orden en que se corre el SQL

    sql/claves.sql  →  sql/rollo.sql  →  sql/blindaje.sql

`blindaje.sql` va **último siempre**: reemplaza políticas y funciones que
crean los otros dos. Después, `sql/revisar.sql`, `sql/rollo_revisar.sql` y
`sql/blindaje_revisar.sql` tienen que dar todas `true`.

**El orden entre la web y el SQL NO es libre: primero la web, después el
SQL.** La app nueva aguanta la base vieja (prueba la función y, si no está,
lee como antes), pero la app vieja **no** aguanta la base nueva: con
`ce_eventos` cerrada, el que llega por el QR no tiene clave y el select
directo le devuelve cero filas. Comprobado contra `main`: el invitado no
puede subir, la pantalla del salón no proyecta y la cámara del rollo no
abre. Correr `blindaje.sql` antes de publicar la web rompe la fiesta
entera. Las dos mitades están medidas en `pruebas/seguridad.js` ("el día
antes" y "el día después").

### Lo que está corrido en producción

`sql/claves.sql` y `sql/rollo.sql` se corrieron y se confirmaron, con el
depósito `ce-rollos` y sus tres reglas. De `sql/columnas.sql` (del muro) no
hay confirmación de primera mano.

**Pero `rollo.sql` creció después de esa confirmación**, así que el archivo
del repo tiene más cosas que la base. Falta al menos `ce_album_pagina`, que
es la que deja bajar TODAS las fotos: sin ella el zip del organizador se
lleva las primeras 400 y le dice **"Listo"**. `sql/rollo.sql` está hecho
para poder correrse de nuevo encima de lo que ya hay, así que la forma de
poner la base al día es volver a correrlo entero.

**Nunca dar por puesto lo que dice este archivo: mirarlo.**
`sql/rollo_revisar.sql` y `sql/revisar.sql` dicen qué está y qué falta, fila
por fila. Tienen que dar todas `true`.

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
- **Una demostración que escribe en producción no es una demostración.**
  Todo lo del modo demostración vive en memoria: `guarda` pasa a ser un
  objeto suelto y en el rollo los métodos de `SB` se reemplazan por una
  base inventada, con `SB.pedir` tapiado para que cualquier camino que se
  haya olvidado reviente acá y lo vean las pruebas, en vez de irse callado
  a la base de verdad.
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
- **Una regla de la base no ve más de lo que ve quien la dispara.** Las del
  depósito preguntaban "¿existe el evento de esta carpeta?" con un `select`
  a `ce_eventos`. Ese `select` corre como `anon`. El día que `ce_eventos`
  dejó de ser de lectura libre, la respuesta pasó a ser siempre "no existe",
  y la rama "el evento ya no existe" —la que sirve para limpiar archivos
  sueltos— se puso a valer para **todas** las fotos: cualquiera podía mirar
  un rollo sin revelar. Se arregla preguntándole a una función
  `security definer` (`ce_evento_existe`, `ce_evento_abierto`), igual que
  `ce_ruta_reservada`. Es la misma trampa que el `delete ... where`.
- **Lo que decide el navegador no es una regla, es una decoración.** El muro
  pedía `ce_items` entero y filtraba lo pendiente al dibujar: "nada llega a
  la pantalla sin que alguien lo mire primero" se cumplía en la pantalla y
  no en la base. Con la consola abierta, un invitado veía las fotos que
  esperaban aprobación. Lo mismo el panel: filtrar la lista de eventos en
  el cliente no esconde nada, porque el que mira no usa la app, usa `curl`.
  Toda promesa del producto tiene que estar escrita en una política o en
  una función de la base.
- **Un camino de archivo que manda el teléfono no es un dato, es una
  orden.** `ce_tomar_foto` aceptaba cualquier `p_ruta`: con eso se reservaba
  —y se subía— dentro de la carpeta de otro evento, o de una carpeta de
  ningún evento, que queda legible para siempre. El depósito del negocio
  servía de hosting gratis. Ahora la base exige `CODIGO/TOKEN/algo.jpg`, con
  el código y el token de quien está sacando la foto.
- **Si el navegador lo genera, el navegador lo puede repetir.** El token del
  rollo lo inventa el teléfono: inventando tokens se creaban rollos sin
  tope, de 24 fotos cada uno, y el almacenamiento lo paga el negocio.
  Cualquier cosa que el cliente cree sin límite necesita un tope del lado de
  la base (`cupo_invitados`).
- **`Math.random()` no sirve para nada que sea una llave.** El código del
  evento salía de `Math.random().toString(16).slice(2,8)`: se puede predecir
  y **a veces devuelve menos de seis dígitos** (`0.5` da `"0.8"`). Y como
  guardar un evento es un *upsert*, dos códigos iguales no dan error: uno
  pisa al otro. `crypto.getRandomValues`, siempre.
- **`upsert` en un depósito abierto es "pisá lo que quieras".** Las subidas
  del muro iban con `x-upsert: true` a un camino fijo (`CODIGO/portada`):
  cualquiera podía cambiar la portada que se proyecta en el salón. Camino al
  azar y sin `upsert`: si ya existe, que falle.
- **El panel mostraba los eventos de todo el mundo.** `eventos()` le pedía
  a la base la tabla entera y los pintaba bajo "Tus eventos": cualquiera
  que entrara al panel veía el casamiento del cliente de al lado. Ahora
  pide solo los códigos cuya clave está guardada en ese aparato
  (`codigo=in.(…)`), y la tabla entera únicamente con la clave maestra. El
  rollo ya lo hacía bien.
- **`position:fixed` no lo corre el padding del body.** La cinta de la
  demostración empuja la página con `padding-top`, pero la pantalla del
  salón y el visor del álbum están fijos: la cinta les tapaba los botones de
  modo y el de salir, y desde la demostración no se llegaba al muro. Cada
  capa fija necesita su propio `top` en `body.en-demo`.
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

## Las cabeceras y las librerías

`_headers` lleva la CSP y las demás cabeceras; las lee Cloudflare. Las
pruebas **se sirven con esas cabeceras puestas** (`pruebas/servidor.py`), así
que si la CSP bloquea algo que la app necesita, salta acá y no en la fiesta
de un cliente.

Las librerías (QR, zip, excel) viven en `lib/`, en el repo. Antes venían de
cdnjs: eso es darle a un tercero permiso para correr código en la página que
tiene a mano la clave del evento y la maestra. De paso, el QR y el zip ahora
andan aunque el wifi del salón no deje salir — y las pruebas del zip, que se
salteaban por no poder bajarlo, ahora corren.

## Lo que se publica en clicketerno.com.ar

`wrangler.json` sube **toda** la carpeta. Lo que no tiene que estar en la
web va en `.assetsignore` (`sql/`, `pruebas/`, los `.md`). Sin ese archivo,
`clicketerno.com.ar/sql/claves.sql` se bajaba desde el navegador — y ese
archivo llevaba la clave maestra de producción escrita en texto plano.
Antes de agregar un archivo al repo, preguntate si querés que sea público.

## El Apps Script de las invitaciones

La planilla de confirmaciones vive en Google, no acá. El `doGet` está en
`apps-script/listado.gs.txt` y se pega a mano en el editor de Apps Script:
el repo no puede tocarlo. Dos puertas, ninguna abre de más: `?clave=` (la
lista, para el panel) y `?confirmado=NOMBRE` (sí o no, para la invitación).
La clave vive en las propiedades del proyecto, no en el código ni en
ninguna página: **una página pública no puede guardar un secreto.** El
portón anterior comparaba contra un correo escrito en el propio HTML.

`apps-script/` va en `.assetsignore`: no se publica.

## Invitaciones alojadas en el repo

Cada invitación es una carpeta con su `index.html` en la **raíz**:
`delfina15/index.html` se sirve en `clicketerno.com.ar/delfina15`. Antes
vivían en Netlify. Las reglas y los nombres prohibidos (`muro`, `rollo`,
`app`…) están en `invitaciones/LEEME.md`; `pruebas/invitaciones.js` las
verifica: que no tapen una ruta de la app, que no queden apuntando a
netlify.app, que no usen caminos absolutos —que en Netlify funcionaban
porque cada una era un sitio aparte y acá no— y que no pesen de más.

## Lo que no se toca sin permiso

- La clave maestra de administrador.
- Las políticas de Supabase ya instaladas.
- `app.html`: hay QR impresos apuntando ahí.
- El número de WhatsApp.

## Pendiente, decidido y no hecho

- **Correr `sql/rollo.sql` de nuevo en Supabase.** Es lo primero de la lista
  y lo único que hoy hace que el producto mienta: sin `ce_album_pagina`,
  "Descargar todas las fotos" le baja al organizador las primeras 400 y le
  dice "Listo". Comprobar después con `sql/rollo_revisar.sql`: las dieciséis
  filas tienen que dar `true`.
- **El rollo nunca se probó en un teléfono de verdad.** Está repasado línea
  por línea y tiene 69 comprobaciones de casos feos, pero todo eso corre en
  un Chromium de escritorio contra un Supabase de mentira. Lo que falta ver
  en hardware real: la cámara de un iPhone (Safari es donde más se rompió
  esto), el revelado en una pantalla chica, y el wifi de un salón lleno.
- **Darle forma a la interfaz del rollo.** Es el paso que sigue y está
  pedido: que la app guíe sola, una cosa para tocar por pantalla, y
  personalizarla. La referencia que gustó es instante.camera, pero con
  interfaz propia y más moderna: copiar el funcionamiento, no el aspecto.
- ~~**Video recap** del álbum~~. **Descartado por el dueño** (16/09), con
  la propuesta técnica sobre la mesa y comprobada: canvas + `MediaRecorder`
  da un mp4 de ~2,5 MB para 30 segundos, sin servidor. No insistir sin que
  lo pida él.
- **Dónde viven las fotos a la larga.** Una foto pesa ~441 KB: un evento de
  100 invitados con 24 fotos son ~1 GB. **El plan gratis de Supabase no
  aguanta un solo casamiento.** Hay que decidir entre Supabase Pro y
  Cloudflare R2, y fijar hasta cuándo se guardan.
- **Miniaturas.** El álbum baja las fotos enteras para mostrarlas chiquitas;
  generar miniaturas al subir ahorraría cerca de 11 veces el tráfico.
- **Los nombres de los servicios.** "Muro en vivo" y "Rollo eterno" son
  provisorios.
- **Correr `sql/blindaje.sql`.** Hasta que no se corra, la tabla de eventos
  sigue siendo de lectura libre para cualquiera con `curl`. Comprobar
  después con `sql/blindaje_revisar.sql`: las dieciséis filas en `true`.
- **Pegar `apps-script/listado.gs.txt` en el Apps Script de Pía.** Es el
  `doGet` nuevo; el `doPost` no se toca. Antes de pegarlo hay que poner
  `CLAVE_LISTADO` en las propiedades del proyecto (está explicado adentro
  del archivo). Hasta que no se pegue, cualquiera con el link de la
  invitación se baja la lista entera de invitados. Las dos pantallas ya
  están del lado nuevo: el panel pide la clave y la invitación pregunta
  `?confirmado=NOMBRE`, que contesta sí o no.
- **La clave maestra vive en `sessionStorage` mientras el administrador está
  adentro.** Se borra al cerrar la pestaña y la CSP le cierra la puerta de
  salida a un script inyectado, pero sigue siendo la joya: conviene entrar
  como administrador solo cuando hace falta y cerrar la pestaña después.
