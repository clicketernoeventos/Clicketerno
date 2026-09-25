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

**Las miniaturas van por convención, no por columna.** La foto se sube a
`CODIGO/ID.jpg` y su miniatura a `CODIGO/ID-min.jpg`; el álbum la arma con
`miniDe()` y no le pregunta nada a la base. Así **no hizo falta tocar el
SQL** y las fotos de antes —que no la tienen— caen solas a la foto entera:
un único oyente de `error` **en captura** (los errores de un `<img>` no
burbujean) cambia el `src` por el de `data-entera`, una sola vez. Y **lo
que se proyecta en el salón sigue siendo la foto entera**: una miniatura
de 420px estirada a tres metros se ve horrible, y hay una prueba que lo
cuida.

**Las tarjetas para cortar** (`muro#tarjetas/CODIGO`, `rollo#tarjetas/CODIGO`)
son lo único del producto que el cliente necesita en la mano: una A4 con la
misma tarjeta repetida —2, 4 u 8— con el QR, el nombre y la fecha, para
cortar y poner en las mesas. El cartel de mesa del muro sigue existiendo y
es una sola tarjeta por hoja; esto es para repartir. Antes del rollo no
había nada y el organizador le sacaba una captura al QR de la pantalla.

**El alta del rollo son seis pasos**: nombre (con sugerencias, porque
escribir en un teléfono es lo que más cuesta), qué festejan y cuándo,
cuándo se ven las fotos, cuántas por invitado, **cuánta gente** —el número
con el que se cotiza, que vivía solo en la base en 300 por defecto y nadie
preguntaba— y el **resumen**. El resumen no es un trámite: es la pantalla
que se le manda al cliente por WhatsApp antes de cobrarle.

Al que ya contrató se entra por **`/#entrar`** de la página pública. Es lo
primero que pregunta un cliente cuando paga, y son dos caminos distintos:

- **El que arma la fiesta** va a `muro#panel` o a `rollo`, donde crea el
  evento y ve los suyos.
- **El que recibe un evento ya armado** va a `muro#codigo` o a
  `rollo#codigo`, escribe el código y después la clave. **No pasa por el
  PIN del panel**, que no es suyo y no entiende. Así se vende: el evento lo
  arma Click Eterno y al cliente se le pasan código y clave para que modere
  durante la fiesta y se baje el álbum al otro día.

**La portada del muro tiene cuatro puertas y cada una dice para quién es.**
Antes el que compró y el invitado entraban por la misma: "Soy invitado"
mostraba la lista de eventos guardados EN ESE CELULAR —vacía en el teléfono
de un invitado, con un cartel que le decía "Creá uno desde el panel del
organizador", que no es lo suyo— y al que contrató no había puerta que lo
llevara: había que saberse `#codigo` de memoria. Lo que las separa es lo
importante: **el que contrató entra con código Y CLAVE porque administra;
el invitado entra solo con el código, sin clave y sin cuenta.** Al invitado
no se le pide ni se le hace inventar una contraseña en ningún momento.

**Ese mismo agujero sobrevivió en la puerta del proyector.** `#proyector`
(elegir qué fiesta se proyecta) seguía mostrando SOLO los eventos guardados
en ese celular, y sin ninguno decía "Creá uno desde el panel del
organizador" y ahí se terminaba: **nada para tocar salvo "Salir"**. Le pega
justo al cliente que compró el muro, al que le armamos nosotros el evento y
le pasamos código y clave: llega al salón con otro teléfono, sin nada
guardado, y lo único que quiere es poner la proyección. Ahora tiene su campo
de código, igual que la puerta del invitado —con el código alcanza: lo que
se proyecta es lo que YA está aprobado—. Lo encontró `pruebas/puertas.js`,
que recorre **todas** las puertas de las dos apps y de la página pública con
un navegador limpio y le exige a cada una tres cosas: que cargue, que diga
algo, y que **haya por dónde seguir**. Un callejón sin salida no tira ningún
error: la pantalla se dibuja perfecta y el cliente se queda ahí.

**El código se escribe como sale.** El invitado lo lee del cartel de la mesa
con el teléfono en una mano, así que entra igual en minúscula, sin el guión,
con espacios de más, o **solo los seis del final**: `normalizarCodigo()`
limpia y pone el guión, y `resolverCodigo()` prueba los prefijos (`QUI`,
`BOD`, `CUM`, `COR`, `EVE`, `DEMO`) cuando falta. Son cinco consultas en el
peor caso y solo cuando hacen falta; la alternativa es hacerle escribir
cuatro caracteres que ya sabemos. Están en los dos archivos —si cambia,
cambia en los dos— y los prefijos van **de más largo a más corto**: si no,
`DEMO-FIESTA` se partiría como `DEM-OFIESTA`. También se normaliza el `?e=`
de la dirección, que alguien puede copiar mal o pasar por WhatsApp.

Los dos tienen **modo demostración**: `?demo=1` (`/muro?demo=1`,
`/rollo?demo=1`) arma una fiesta inventada y **no toca Supabase ni el
almacenamiento del navegador**. Es a donde apuntan los botones "Probar la
demostración" de `index.html`. Antes esos botones abrían la app de verdad:
desde ahí se veían los eventos de todos los clientes en "Tus eventos" y el
botón "cargar una fiesta de ejemplo" escribía un evento inventado **en la
base de producción**. `pruebas/demo.js` cuida que no vuelva a pasar.

**Cada demostración entra directo a su momento.** No al alta, no al panel:
a lo que hay que vender.

- **`/muro?demo=1` → la pantalla del salón**, ya proyectando el muro (no el
  QR). Un botón dorado, "Probá mandar una foto", lleva al otro lado; lo que
  mandes vuelve proyectado. Todo lo del organizador (`panel`, `evento`,
  `cartel`, `portada`, `invitado`, `proyector`) cae en `pantalla/DEMO-FIESTA`.
- **`/rollo?demo=1` → el álbum revelado.** El rollo de ejemplo nace
  `revelado` y el visitante ya tiene su token con tres fotos, así que cae
  derecho ahí sin que le preguntemos el nombre. **Y derecho quiere decir
  sin el cuarto oscuro**: el revelado dura diez segundos y empieza en
  negro, y en el teléfono eso se lee como "no muestra nada". En la
  demostración el álbum está a la vista apenas entra y el revelado queda a
  un toque, con su botón "Ver cómo se revela". En una fiesta de verdad no
  cambia nada: ahí el cuarto oscuro es el momento y se ve una vez. Con **`?camara=1`** nace sin
  revelar y se ve el otro lado: cómo el invitado gasta sus fotos sin ver
  ninguna. `nuevo`, `ev/`, `ajustes/`, `codigo` y `clave` no existen en
  demostración: "Crear el rollo de mi fiesta" es el formulario de alta, no
  una prueba.

La fiesta del muro va **sin moderación**: con `moderar` en true, lo que
mandaba el visitante decía "Enviado, el organizador lo aprueba" y no se veía
nunca, o sea que el ejemplo no mostraba nada.

**Se siembra en cada carga, sin preguntar si ya estaba, y la cinta tiene
"Empezar de nuevo"** (que es una recarga: todo vive en memoria). Es un modo
prueba: el que entra después no tiene que encontrarse con lo que dejó el
anterior.

**Lo que manda el visitante se borra solo a los dos minutos**
(`VIDA_DEMO`, en `muro.html` y en `rollo.html`). La demostración ya vivía
entera en memoria y se iba con la recarga, pero MIENTRAS la pestaña sigue
abierta lo que dejó uno se queda: la demostración pasa de mano en mano en
el teléfono del negocio, y el segundo cliente se encontraba proyectada la
foto del primero. Dos minutos alcanzan para verla pasar por la pantalla
del salón —la proyección cambia cada siete segundos— y son poco para que
quede colgada. **Se le avisa al visitante**: que una foto desaparezca sin
haberlo dicho parece un producto roto. En el rollo es lo mismo pero al
revés: la foto se devuelve (`ce_devolver_foto`, el camino que ya existía
para cuando falla la subida), así el cupo se repone y al tercer cliente la
cámara le abre igual. **Lo sembrado no se toca**: las nueve fotos y los
saludos del ejemplo son la fiesta.

**La cinta se pliega.** Un ✕ la deja en una tira de 18px que se toca y
vuelve. No se esconde del todo a propósito: es la única salida al sitio y
el único "Empezar de nuevo". Su alto real vive en `--cinta` y lo mide el
JS (ver la regla del alto escrito a mano).

**Desde el álbum del rollo se pasa a la cámara y se vuelve**, con un botón
en la cinta. Antes al otro lado solo se llegaba escribiendo `?camara=1` a
mano, así que la mitad del producto no se mostraba nunca.

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

    sql/claves.sql → sql/rollo.sql → sql/blindaje.sql → sql/blindaje2.sql
    → sql/rafaga.sql → sql/camaras.sql

`blindaje.sql` va **después de los dos primeros**: reemplaza políticas y
funciones que ellos crean. `blindaje2.sql` va **al final**: cierra el muro
(la puerta de `ce_items`) y usa funciones que crea `blindaje.sql`.
`rafaga.sql` va **después de blindaje2**: reemplaza `ce_items_puerta`
entera, así que corrido antes lo pisa el otro. `camaras.sql` va al final
por lo mismo: reemplaza `ce_mi_rollo`, que la crea `blindaje.sql`. Después, `sql/revisar.sql`,
`sql/rollo_revisar.sql` y `sql/blindaje_revisar.sql` tienen que dar todas
`true`.

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

**Al 21/09/2026 la base está COMPLETA, con el muro blindado.** El dueño
corrió `sql/blindaje2.sql` en el SQL Editor y las cinco comprobaciones
dieron `true`: la puerta de `ce_items`, el freno de `ce_eventos`, que la
puerta corre como dueña, `ce_evento_abierto` en su lugar y la columna
`acepto`. Así que **los cuatro archivos están puestos**: `claves.sql`,
`rollo.sql`, `blindaje.sql` y `blindaje2.sql`.

Antes de eso, al 19/09/2026, ya estaban los tres primeros: el depósito
`ce-rollos` con sus reglas, la tabla `ce_eventos` cerrada a `curl`, y las
columnas `vence` y `cupo_invitados`.

**Lo que cambió para el usuario el día que se corrió `blindaje2.sql`**, y
conviene tenerlo presente si alguien reporta algo raro:

- Con el **muro cerrado**, al invitado ya no le entra nada: antes la app se
  lo escondía pero la base aceptaba. Ahora la base contesta *"El muro de
  esta fiesta está cerrado"*.
- Un evento acepta **hasta 2000 recuerdos** y **300 por minuto** (eran 120
  hasta que `rafaga.sql` los subió). Si alguna vez una fiesta de verdad
  toca ese techo, el número está en la función `ce_items_puerta` y se sube;
  no es una constante mágica escondida.
- El **orden de la proyección** ya no lo puede elegir el que sube: el `ts`
  lo pone la base.

Lo último que faltaba era `ce_album_pagina` —la que deja bajar TODAS las
fotos— y se agregó sola, sin volver a correr `rollo.sql` entero. Antes de
pasarla se probó contra una copia local idéntica a producción (todo
instalado menos esa función): pagina 1200 fotos en 500+500+200 sin repetir
ni saltear ninguna, corta en 500 aunque le pidan 99999, y sin la clave del
evento —o con la de otro— devuelve cero.

**`sql/rafaga.sql` está corrido** (22/09/2026): el dueño lo pasó por el SQL
Editor y la comprobación dio `300` y `true`. Sube el tope de ráfaga de 120
a 300 recuerdos por minuto y por fiesta, y hace que ese rechazo llegue al
navegador como un 429 en vez de un 403. Antes de esto, **una fiesta de 200
invitados perdía todo lo que pasara de 120 en el minuto del brindis** —
medido contra una copia del esquema de producción, la número 121 rebotaba—
y cada una de esas perdidas ya tenía el archivo subido, así que además
   quedaba huérfano en el depósito.
Así que **los cinco archivos están puestos**.

**Nunca dar por puesto lo que dice este archivo: mirarlo.**
`sql/estado.sql` lo contesta en dieciséis filas y dice de qué archivo
viene cada cosa. `sql/revisar.sql`, `sql/rollo_revisar.sql` y
`sql/blindaje_revisar.sql` lo dicen con más detalle, fila por fila.

**Desde acá no se llega a la base de producción.** Cualquier cambio de SQL
va pegado en el chat, en un bloque listo para copiar, y lo corre una
persona en el SQL Editor.

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
- **El servidor de pruebas tiene que parecerse al de verdad.** No servía las
  direcciones limpias (`/muro` → `muro.html`), así que la vitrina de la
  página de inicio daba 404 **solo en las pruebas** y se veía negra, cuando
  en producción anda. Y antes, sin las cabeceras, la CSP no la probaba
  nadie. Cada diferencia entre los dos esconde justo lo que hay que ver.
- **Una CSP apaga cosas sin decir nada.** `connect-src` no tenía
  `netlify.app` y la galería de Trabajos le pregunta a cada invitación si
  responde ANTES de meterla en un marco: la pregunta se bloqueaba, la
  galería las daba por muertas y no se veía **ninguna** invitación en vivo.
  Sin un solo error a la vista. Lo que la CSP bloquea hay que ir a mirarlo.
- **Dos botones fijos, cada uno con su `right` a ojo, se montan.** En la
  pantalla del salón "Pantalla completa" y el de al lado se pisaban apenas
  el segundo cambiaba de texto. Van en una fila (`.botones-sala`) con `gap`,
  no con posiciones calculadas a mano.
- **El cuerpo del archivo no es una función.** Un `return` suelto en el
  bloque de arranque de `rollo.html` es un error de sintaxis y la app no
  arranca. Y llamar ahí a algo declarado más abajo con `const` tira "Cannot
  access before initialization": ese bloque corre antes.
- **`position:fixed` no lo corre el padding del body.** La cinta de la
  demostración empuja la página con `padding-top`, pero la pantalla del
  salón y el visor del álbum están fijos: la cinta les tapaba los botones de
  modo y el de salir, y desde la demostración no se llegaba al muro. Cada
  capa fija necesita su propio `top` en `body.en-demo`.
- **Nombres de clase repetidos.** `.tapa` y `solapa()` ya existían y fueron
  pisados: una capa se comía los clics, la otra tiraba "Algo se cortó".
  Antes de inventar un nombre, `grep`. **Volvió a pasar**: un parámetro
  `solapa` en `vEvento` tapó la función `solapa()` y el panel entero moría
  con "solapa is not a function". El parámetro se llama `abrirEn`. No alcanza
  con tener la regla escrita: hay que hacer el `grep`.
- **Guardar no puede moverle el piso al organizador.** Cada botón de Ajustes
  redibujaba con `vEvento(codigo)`, que vuelve a la solapa Compartir y arriba
  de todo: guardabas el hashtag y tenías que volver a bajar hasta las
  consignas. Seis botones hacían lo mismo. Ahora se redibuja con
  `redibujar(codigo)`, que conserva la solapa y el punto de la página.
- **Un refresco automático se paga por hora.** El primer sondeo del panel se
  bajaba el índice ENTERO cada ocho segundos: con 1500 recuerdos son unos
  130 MB por hora, en el teléfono del organizador y con el wifi del salón.
  Ahora pregunta solo por los que esperan y solo su `id`. Medido, no
  estimado: `pruebas/recorrido.js` falla si se vuelve al sondeo caro.
  **La pantalla del salón hacía lo mismo y ya no**: medido, 1029 pedidos y
  **137,2 MB por hora** con 1500 recuerdos. Ahora pide solo la **punta**
  —los aprobados que vienen DESPUÉS de los que ya tiene, con "cuántos
  llevamos" de `offset`— y eso son unos veinte bytes por vuelta:
  **137,2 MB → prácticamente cero**, los mismos 514 pedidos.
  Funciona porque los dos caminos de lectura (`ce_items` con la clave y
  `ce_items_de` sin ella) devuelven SOLO lo aprobado y en el mismo orden
  `(ts, id)`, así que la cantidad que llevamos ES el offset. Una foto nueva
  y una recién aprobada caen las dos ahí: las dos suben el total.
  **Lo que la punta no ve es lo que DESAPARECE** —un recuerdo borrado o
  desaprobado no deja hueco en la punta—, y por eso cada 30 vueltas
  (`RESINCRO`, tres minutos y medio) se vuelve a leer todo. Sin esa red una
  foto borrada se seguiría proyectando toda la noche.
  Lo mide `pruebas/recorrido.js`, y comprobado contra el código anterior:
  ahí falla con 3 lecturas completas en 22 segundos.
  El competidor resuelve lo mismo con un `text/event-stream` (el servidor
  avisa en vez de que el teléfono pregunte). Es más lindo y necesita un
  servidor; esto no necesita ninguno y da el mismo resultado.
- **En el wifi de un salón, que la conexión se corte dos segundos es lo
  normal, no una excepción.** Doscientos teléfonos colgados del mismo
  router. Hasta acá el primer tropiezo le devolvía "no se pudo" al
  invitado: en el muro se perdía la foto y en el rollo se perdía ADEMÁS una
  de las que tenía para sacar, porque `ce_tomar_foto` reserva el cupo
  ANTES de subir. Ahora `SB.archivo` (muro) y `SB.subir` (rollo) intentan
  **tres veces**, esperando 1,2 s y 3,5 s.
  **Solo se repite lo que puede salir bien la próxima**: un corte, un
  tiempo agotado, un 5xx o un 429. Un 4xx es una negativa —el camino ya
  existe, el archivo es muy grande, el muro está cerrado— y repetirla es
  hacerlo esperar para darle el mismo error. Eso lo decide
  `seVuelveAIntentar()`, que mira el estado HTTP, no el texto del mensaje.
  Dos detalles que no son adorno: si el teléfono está **sin señal** se
  espera al evento `online` en vez de gastar un intento contra el vidrio
  (`esperarRed`, con tope de 20 s), y hay un **tope total de 4 minutos**
  además del de intentos, porque tres esperas seguidas de tres minutos cada
  una es una pantalla que parece colgada. Reintentar la misma ruta ya
  reservada del rollo NO gasta otra foto.
  Lo mide `pruebas/red.js`, que también comprueba lo de siempre: que cuando
  de verdad no se pudo, el mensaje **no diga "listo"**. Contra el código
  anterior esa suite da 6 fallas.
- **Lo caro ya pasó y lo que se cae es el último pedido de un kilobyte.**
  La foto está subida y lo único que falta es la fila de `ce_items`. Si
  JUSTO ese pedido se cae, hasta acá el invitado veía "no se pudo" y el
  archivo quedaba **huérfano en el depósito: pagado, invisible y sin
  ninguna fila que lo nombre**. Ahora `anotarItem()` lo reintenta.
  **Reintentar un insert es seguro solo porque el `id` lo pone el teléfono
  y es la CLAVE PRIMARIA de `ce_items`**: si el primer intento sí había
  entrado y lo que se perdió fue la respuesta, el segundo choca con la
  clave repetida. Por eso ahí un `duplicate key` (23505 / 409) es un
  **éxito** —quiere decir "ya estaba"— y no un error.
  **Esto vale para `ce_items` y NO para `ce_eventos`.** Ahí un código
  repetido puede ser el evento de OTRO, y darlo por bueno sería meter al
  organizador adentro de una fiesta ajena. Es la misma razón por la que
  `SB.crear` no usa `merge-duplicates`.
  Para que todo esto se pueda decidir sin leer el texto del mensaje —que
  cambia según de dónde venga—, `SB.pedir` ahora **pega el estado HTTP al
  error** (`conEstado`), y un corte de red, que no llega como respuesta
  sino como excepción del propio `fetch`, se marca con 0.
- **El brindis no es un ataque.** El freno de ráfaga de `ce_items_puerta`
  cortaba en **120 recuerdos por minuto y por fiesta**, con el comentario
  "ciento veinte por minuto no los manda una persona". No los manda una
  persona: los manda una fiesta. Medido contra una copia del esquema de
  producción entero, con 200 invitados subiendo en el mismo minuto —que es
  exactamente lo que pasa cuando el QR aparece en la pantalla o se levanta
  el brindis— **entran 120 y rebotan 80**, y cada una de esas 80 ya tenía
  el archivo subido: el invitado pierde la foto y en el depósito queda un
  archivo huérfano. Lo sube a 300 `sql/rafaga.sql`. El techo de verdad
  sigue siendo el de **2000 por fiesta**, que es el que limita lo que un
  script puede costarnos en depósito.
  Del lado de la web, ese rechazo ahora **se espera y se vuelve a
  intentar** (`esRafaga` + la escalera larga de `anotarItem`, 9 s y 26 s):
  la ventana del freno es de un minuto, así que ahí esperar dos segundos
  no sirve de nada. Se lo reconoce por el estado **429** y también por el
  texto del mensaje, porque con qué estado lo traduce PostgREST no depende
  de nosotros y el mensaje sí.
  **Así se midió esa prueba y así hay que medir cualquier tope**: el falso
  tiene que rechazar por una VENTANA DE TIEMPO, no por un contador de
  intentos. La primera versión rechazaba "el primer intento" y pasaba
  contra el código viejo también —que ya reintentaba, solo que con esperas
  cortas—: no medía el arreglo, medía que existiera un reintento.
- **Un "ya existe" del depósito es un ÉXITO, no una negativa.** La regla
  estaba escrita para `anotarItem` del muro (el 23505 de `ce_items`) y
  faltaba la mitad del rollo. El wifi del salón se corta dos segundos: la
  foto LLEGÓ y lo que se perdió fue la respuesta. El reintento va a la
  misma ruta y Storage contesta **409**. Como 409 es 4xx, salía por el
  camino del error, y ahí pasaban tres cosas y las tres eran mentira:
  `ce_devolver_foto` se negaba —el archivo está—, el mensaje decía igual
  *"la foto te la devolvimos"*, y el contador se quedaba en el número de
  antes porque `pintarContador()` está DESPUÉS del `throw`: la pantalla
  decía 24 y la base 23. El invitado la saca de nuevo y gasta otra.
  Ahora `SB.subir` trata el 409 como éxito, pero **solo en un reintento**:
  un 409 en el primer intento no es nuestro, es un choque de nombre, y ahí
  sí es un error. Lo mide `pruebas/rollo_red.js`.
- **Un `<script src>` sincrónico arriba de todo para el dibujado entero.**
  Las dos librerías (QR y zip) se bajaban SIEMPRE, y el invitado —el que
  está colgado del wifi del salón— no usa ninguna: el QR es del panel, del
  cartel y de las tarjetas; el zip es de "Descargar todas". Medido con el
  navegador: **el rollo bajaba 117 KB de más y el muro 97 KB**, y en
  `rollo.html` estaban incluso ANTES del preconnect. Ahora las trae
  `cargarLib()` cuando hacen falta. `pintarQR()` sigue siendo sincrónica a
  propósito —la llaman pantallas que arman su HTML de una—: dibuja el
  reemplazo ya, pide la librería y se repinta sola cuando llega.
  Lo mide `pruebas/arranque.js`, que además exige el `preconnect` a
  Supabase y el `Cache-Control` del HTML.
- **Una URL firmada no se puede anular.** "Volver a ocultar las fotos"
  cambia `revelado`, pero las direcciones ya firmadas valen una hora más:
  se validan al FIRMARLAS, no al usarlas. El botón ahora lo dice. **No se
  bajó el vencimiento**, que es lo que parece obvio: `firmadas` es un
  caché y una ruta ya firmada no se vuelve a firmar en esa página, así que
  acortarlo rompería cualquier sesión más larga que el plazo. La promesa
  que se vende —nada ANTES del revelado— está intacta.
- **Lo que se actualiza solo tiene que actualizarse en los dos lados.** La
  pantalla del salón se refresca cada siete segundos; el panel del
  organizador no lo hacía. Durante la fiesta él miraba "Moderar" mientras
  las fotos se apilaban sin aparecer, y con la moderación encendida eso
  quiere decir que no se proyecta nada: había que salir y volver a entrar, y
  nadie lo sabe. Ahora el panel se entera solo.

- **Un alto escrito a mano en el CSS miente en cuanto el contenido
  envuelve.** Las capas fijas se corrían `38px` —lo que mide la cinta de
  la demostración— con el número puesto a mano en seis reglas. En un
  teléfono la cinta no entra en una línea, envuelve, mide 60 u 88, y
  volvió a tapar exactamente lo que ese número venía a destapar: el ✕ y
  "Salir" quedaban **fuera de la pantalla**, sin forma de cerrarla ni de
  volver al sitio. Ahora el JS mide la cinta y la pone en `--cinta`, y
  todo lo fijo se corre con `calc(var(--cinta) + …)`. Lo mismo la fila de
  modos de la sala, en `--modos`. Si un número de esos aparece dos veces
  en el CSS, es un número que va a mentir.
- **Dos grupos fijos, uno a cada lado, no entran en un celular.** La
  pantalla del salón tiene las solapas de modo a la izquierda y los
  botones a la derecha, las dos capas `position:fixed` y pensadas para un
  proyector. En 390px se montan y "Completa" se sale del borde: **desde el
  teléfono no se podía cambiar de modo**. Abajo de 640px van uno sobre el
  otro y en todo el ancho. Y pasa con demostración y sin ella: el
  organizador abre la pantalla del salón desde su celular para probarla.
- **La demostración también se mira desde un teléfono.** Todo lo de
  arriba se ve perfecto en un escritorio. `pruebas/movil.js` y
  `pruebas/rollo_cinta.js` miden las cajas de verdad
  (`getBoundingClientRect`) en 390×844: que nada se salga de la pantalla y
  que nada se monte con nada. Mirar el CSS no alcanza.
- **Al que ya contrató hay que decirle por dónde entra.** La página
  pública tenía tres botones de "Probar la demostración" y un enlace al
  panel del muro escondido en el pie a media opacidad; del rollo, nada. El
  cliente que ya pagó no tenía a dónde ir a crear su evento. Ahora está el
  apartado **`#entrar`** ("Ya contrataste"), con su entrada en el menú.

- **La clave maestra no puede terminar en el disco.** Vive en
  `sessionStorage` a propósito: se muere al cerrar la pestaña. Pero el
  campo "clave de este evento" —el que aparece cuando entrás a la fiesta
  de un cliente desde otro teléfono— guardaba en `ce:claves`, en
  `localStorage`, **cualquier** clave que la base aceptara. Escribir ahí
  la maestra, que es lo natural para entrar sin tener la del evento,
  dejaba la llave de todos los eventos de todos los clientes escrita en
  ese aparato, para siempre y sin que nadie lo supiera. La base ya dice
  cuál es (`es_maestra` en `ce_quien_soy`) y lo estábamos ignorando. Pasa
  en los dos: `pruebas/nuevas.js` y `pruebas/rollo_maestra.js`.
- **El rollo no mandaba la maestra.** `ce_permitido` la acepta para
  cualquier evento —la chequea ANTES que la del evento—, pero
  `claveDe()` del rollo solo miraba las guardadas en ese teléfono. O sea
  que un rollo solo se manejaba desde el aparato donde se creó: perdido
  el teléfono, perdido el evento. Lo que faltaba estaba en el navegador,
  no en la base.

- **Lo que se imprime no se mide en la pantalla.** Las tarjetas para
  cortar se veían perfectas en el monitor y salían mal: el `padding` del
  `body` y del `.wrap` corrían la hoja **113px** a la derecha y la mitad
  de las tarjetas se iba fuera del papel. En `@media print` hay que
  resetear los contenedores (`body,#app,.wrap{margin:0;padding:0}`) y dar
  la hoja en **milímetros** (210×297), no en píxeles. `pruebas/tarjetas.js`
  y `pruebas/rollo_alta.js` lo miden con `emulateMedia({media:'print'})`
  y `getBoundingClientRect`: que la hoja arranque en 0,0, que mida una A4
  exacta, que las tarjetas sean todas iguales y que ninguna se pase del
  borde. Sin eso, el error se descubre recién en la impresora del cliente.
- **Una regla `@page` puesta a mano se queda puesta.** `hojaPostal()` ya
  había hecho que el "Guardar en PDF" del álbum saliera en tamaño postal.
  La hoja de tarjetas agrega `hojaA4()`, y **las dos se sacan en
  `parar()`** (muro) y al cambiar de pantalla (rollo). Hay una prueba que
  entra, sale, y comprueba que no quedó.

- **Medir con imágenes falsas no mide nada.** La primera medición de las
  miniaturas usaba `Buffer.alloc()` como si fueran fotos: el navegador no
  las puede decodificar, las da por rotas, **dispara el respaldo** y baja
  las dos. El resultado decía que las miniaturas gastan MÁS. Se mide con
  un JPEG válido estirado con relleno después del marcador de fin, que
  sigue siendo una imagen de verdad y pesa lo que uno quiera.

- **No hay una columna que diga "tiene muro".** La tabla de eventos es
  una sola y `camara` es lo único que distingue: un evento nacido en el
  rollo la tiene en `true`. Así que la central ofrece el muro **siempre**
  —cualquier código sirve de muro— y el rollo **solo si `camara`**:
  mandar al organizador al rollo de un evento que no lo tiene es mandarlo
  a una pantalla vacía, y hay una prueba que lo cuida.

- **El `load` de un `<img>` NO llega a `window`; el `error` sí.** Medido,
  no supuesto: `addEventListener('load',fn,true)` en `window` no ve
  ninguna carga de imagen, y en `document` las ve todas. Con el latido de
  carga del álbum puesto, eso quería decir que **ninguna foto se marcaba
  como cargada y el álbum entero quedaba invisible**. El respaldo de las
  miniaturas usa `error` y por eso sí funciona en `window`. Los dos van
  en `document`, en captura, por las dudas.
- **Los 44px son para dedos, no para mouse.** El mínimo de área se puso
  en todos lados y en un proyector de 1920 la fila de modos creció diez
  píxeles y pasó a tapar la cabecera del tablero —lo agarró
  `pruebas/nuevas.js`—. Va en `@media (max-width:820px),(pointer:coarse)`.

- **`resolution=merge-duplicates` es un `on conflict do update`, y Postgres
  le aplica el WITH CHECK de la política de UPDATE SIEMPRE, haya conflicto
  o no.** Esa política dice `ce_permitido(codigo)`, así que las dos cosas
  que crean una fila rebotaban: el **alta de un evento** (el disparador
  acaba de escribir la clave, pero `ce_permitido` es `stable` y mira la
  foto del principio de la sentencia, así que todavía no existe) y la
  **subida del invitado**, que nunca tiene clave. En producción eso era
  "new row violates row-level security policy for table ce_eventos" al
  crear un rollo — y, sin que nadie lo hubiera probado todavía, **ninguna
  fiesta del muro habría podido recibir una sola foto.** Se arregla en la
  web, no en la base: `SB.crear()` manda un insert pelado, que la política
  de INSERT (`with check (true)`) acepta; `SB.guardar()` —el upsert— queda
  solo para el organizador que YA tiene la clave. De paso queda más sano:
  dos códigos iguales ahora dan error en vez de pisarse. Medido contra
  Postgres 16 con el esquema entero; lo cuidan `sql/probar.sql`,
  `pruebas/fakesb.js` y `pruebas/rollo_alta.js`. **No hay SQL que correr.**

- **Si un bloque trae su propio fondo, trae su propia tinta.** La tarjeta
  `.inc` nació adentro de la sección clara —que pone `color:#1A1713`— y
  después se reusó para el "qué incluye" del muro y del rollo, que están
  en la parte negra: ahí heredaba `--texto`, que es exactamente el mismo
  crema del fondo de la tarjeta. Contraste **1.00:1**: los títulos no
  existían. En el monitor no se nota porque uno mira la sección de arriba.
  El contraste no se opina, se calcula: `pruebas/contraste.js` recorre
  todo el texto de todas las pantallas, pregunta de qué color quedó y
  sobre qué fondo cayó, y falla abajo de 3:1.

- **Una maqueta no es una pantalla.** Al tocar la notebook de la vitrina,
  el visor abría la demostración del salón adentro de un marco apaisado de
  **367x206** en un iPhone. La app de adentro no sabe que es una maqueta:
  cree que ESE es el tamaño de la pantalla, y la cinta, las solapas de
  modo, los botones, el QR y el nombre de la fiesta se le apilaron todos
  encima. Ilegible. En un teléfono el visor no puede ser una maqueta: es la
  pantalla entera, y la demostración corre a 390 de ancho, que es
  exactamente para lo que está medida. Los botones nuestros van en una
  barra propia arriba, no flotando encima: flotando le tapaban a la cinta
  su ✕ y su "Salir", y quedaban dos ✕ pegados haciendo cosas distintas.

- **Rendirse a los nueve segundos es rendirse en 4G.** Los celulares de la
  vitrina se daban por muertos a los 9 s y BORRABAN el marco. Medido con la
  red frenada a 900 kb/s: la invitación tarda **doce**. El cliente veía un
  rectángulo negro con un rótulo, para siempre, aunque la descarga hubiera
  terminado. Ahora no se saca nada por lento: el marco sigue bajando y
  aparece cuando llega; solo se saca si el navegador avisa que falló. Y
  como la vitrina pasó a ser lo primero de la página, los tres marcos
  arrancaban juntos y se estorbaban: van **de a uno**, con un tope de 12 s
  para dejar pasar al siguiente (que no cancela al que quedó bajando).
  Mientras tanto la portada dibujada tiene una rayita que late: un
  rectángulo negro y quieto parece un producto roto.

- **El rollo estaba blindado y el muro no.** Toda la atención de seguridad
  se la había llevado el rollo —cupos, rutas, depósito privado— y el muro
  quedó como estaba. Medido contra una copia del esquema de producción, un
  desconocido **sin ninguna clave** podía: meter 500 filas en la fiesta de
  otro (y 500.000: no había tope), **seguir subiendo con el muro
  CERRADO** —el organizador aprieta el candado, la app le esconde el
  formulario, y la base aceptaba igual—, meter fotos en un evento que **no
  existe**, y **elegir el `ts`**, que es lo que ordena la proyección:
  poniendo un número grande su foto quedaba primera en la pantalla del
  salón toda la noche. El depósito de archivos ya estaba bien; lo que
  faltaba era la tabla. Lo arregla `sql/blindaje2.sql` con un disparador
  —no una política, para poder DECIR qué pasó— y lo cuida `sql/probar.sql`.
  Es la tercera vez que aparece la misma trampa: **lo que decide el
  navegador no es una regla, es una decoración.**

- **Medir un tope adentro de una sola transacción da cero.** La primera
  medición del tope de ráfaga hacía 400 inserts en un bloque `do $$`: los
  primeros 120 entraban, el 121 levantaba la excepción y el `exception
  when others` **revertía el bloque entero**. El resultado decía "entraron
  0", que parecía un blindaje perfecto y no era lo que pasa: en la vida
  real cada insert es un pedido HTTP aparte y el atacante se lleva sus 120.
  Los topes se miden con un `begin/exception` **por insert**.

- **`clamp()` medido en `vw` se derrumba en un teléfono.** El cartel de la
  pantalla del salón tenía el QR en `30vh` (253px en un iPhone) y el
  nombre, el código y el "ya mandaron" en `vw`: `1.3vw` de 390px son cinco
  píxeles, así que **todos** caían al mínimo del clamp. Un QR enorme y
  todo lo demás en 12px. Y los dos grupos de mandos, que abajo de 640px
  van uno sobre otro arriba de todo, le tapaban el logo y el título. Lo
  mide `pruebas/movil.js` con cajas de verdad.

## El competidor: instante.camera

Medido sobre dos capturas de red (HAR) del sitio real, el 22/09/2026. Es el
servicio que el dueño puso como referencia para la interfaz del rollo.

**Están en Rosario.** El WhatsApp del pie es **341 542-9448** y la empresa
detrás se llama **Runia**. No es un competidor lejano.

**Precios**, leídos del `AggregateOffer` de su propia página: gratis hasta
**30 invitados**, y cinco planes pagos por tamaño de evento —50, 100, 150,
200 y más de 200— de **$19.900 a $99.900**, o USD 14,99 a 89,99. Un solo
pago al crear el evento, MercadoPago en Argentina y tarjeta desde afuera,
con cuotas sin interés. El gratis es el anzuelo: el que prueba con una
juntada después paga la boda.

**Cómo está hecho**: Next.js en Vercel, cuenta con email y contraseña
(Better Auth), fotos en Cloudflare R2, y PostHog + píxel de Meta + píxel de
TikTok, con grabación de sesión. Están pautando.

**Cómo sube una foto** (los tres primeros pasos son nuestro
`ce_tomar_foto`): pide permiso y le contestan `{ok:true, restantes:24}`
—**24 fotos por invitado, el mismo número que usamos**—, pide dónde subir y
el servidor le **firma una URL de subida que dura 10 minutos**, sube, y
confirma. El teléfono no elige la carpeta.

**Dónde son más débiles, y es lo único que importa**: la lectura. La foto
revelada se sirve desde un **depósito PÚBLICO** (`pub-….r2.dev`) sin firma,
sin vencimiento y para siempre. Antes del revelado su servidor no entrega
la dirección —eso está bien—, pero su privacidad es *"la dirección es
imposible de adivinar"*. La nuestra es *"el servidor se niega a firmarla"*.
No es lo mismo y es lo que vendemos.
Tampoco tienen CSP (solo la que Next le pone a su optimizador de imágenes).

**Qué medían mal mis primeras conclusiones**, por si alguien vuelve sobre
esto: se dijo que sus fotos eran de 480x640 y ~80 KB mirando una captura de
DevTools. Era el tamaño con el que se MOSTRABA. El archivo de verdad, sacado
del HAR, es **941x1355 y 533 KB** — más pesado que el nuestro (441 KB). Un
tamaño en el inspector no es el tamaño del archivo.

**Lo que les tomamos**: que la app se pueda poner en la pantalla del
teléfono (lo hicieron con un manifiesto; nosotros también, ver abajo) y la
idea de no sondear —ellos usan `text/event-stream`, nosotros pedimos solo
la punta, mismo resultado sin servidor—.

**Lo que NO les tomamos y por qué**:

- *El blog* (71 notas apuntadas a "cuánto sale cabina de fotos", "espejo
  mágico precio"…). Es su canal de captación y se nota que funciona, pero
  el dueño lo bajó por ahora: *"el blog no me interesa"*. Está acá anotado
  para cuando cambie de idea.
- *Un filtro por evento, elegido por el organizador.* Nosotros vamos más
  lejos: el invitado elige entre cinco **por foto**, viendo en vivo cómo
  queda. No hay nada que copiar.
- *Los píxeles de Meta y TikTok en la pantalla del invitado.* Ellos cargan
  los dos, con grabación de sesión, donde un menor saca una foto en una
  fiesta. Frente a la Ley 25.326 eso es exposición, y no cargar terceros es
  parte de lo que vendemos.
- *El recap en video*: lo tienen. Descartado por el dueño el 16/09. No
  insistir.

## Que se pueda poner en la pantalla del teléfono

`muro.webmanifest` y `rollo.webmanifest`, con los iconos en `iconos/`
(generados de `marca.webp`: 192, 512, uno `maskable` de 512 con más margen
porque Android recorta en círculo, y uno de 180 para iOS).

**A propósito NO hay service worker.** En un sitio sin build que se publica
solo con cada push, un service worker es la forma más rápida de dejarle a
un cliente una versión vieja pegada para siempre — y lo que se pidió es
estabilidad. El costo: en Android no salta el cartel automático de
"instalar", pero la opción del menú del navegador funciona igual. En el
iPhone —que es donde están los invitados— "Añadir a pantalla de inicio"
alcanza con el manifiesto y las dos `meta` de Apple.

**Son cuatro piezas y si falta una el navegador se calla**: ni un error,
simplemente no ofrece instalarla. Por eso `pruebas/nuevas.js` las prueba
las cuatro contra el servidor de verdad —incluido que cada icono declarado
se baje, porque un icono 404 es peor que no declararlo: el sistema pone un
cuadrado gris con la inicial—. Y `pruebas/servidor.py` tuvo que aprender
que `.webmanifest` es `application/manifest+json`: Python lo servía como
`octet-stream` y el navegador lo ignoraba sin decir nada.

## La cámara del invitado

Es la pantalla donde el invitado pasa la noche. Lo que se pidió de ella
—"que la app guíe sola, una cosa para tocar por pantalla"— no se cumplía, y
lo que faltaba no era decoración:

**Se ve que es un rollo.** Arriba hay una tira de cuadraditos, uno por foto
del cupo, que se van apagando. El número de las que quedan está al lado, en
grande. Antes el contador era un `21 QUEDAN` chiquito en un rincón de
abajo, del mismo peso visual que todo lo demás: lo que hace que esto sea
una cámara descartable y no una app de fotos es justamente que las fotos se
**acaban**, y eso no se veía. Arriba de 36 de cupo los cuadraditos no se
dibujan —sesenta rayitas de dos píxeles no dicen nada— y ahí el total se
escribe.

**"21 de 24" se lee de las dos maneras.** La primera versión de esto decía
eso y es ambiguo: puede entenderse como "vas por la foto 21 de 24", o sea
que quedan tres, que es lo contrario. Dice **"quedan"**, que no se presta, y
hay una prueba que lo cuida.

**Los filtros se pliegan.** Los cinco en vivo son lo mejor que tiene la
pantalla —el competidor tiene uno solo, elegido por el organizador— así que
se muestran abiertos al entrar, que es el momento en que impresionan. Pero
el filtro se elige UNA vez y el disparador se toca veinticuatro: con la
tira siempre abierta había **seis cosas tocables abajo, del mismo tamaño
que el disparador**, y 170 de los 844 píxeles de un teléfono ocupados para
siempre por una decisión ya tomada. Sacada la primera foto —o elegido un
filtro— la tira se pliega a una ficha con el nombre, que la vuelve a abrir.
Quedan **dos** controles abajo. Eso está medido en `pruebas/rollo_camara.js`,
no opinado: la prueba cuenta los controles visibles en la mitad de abajo y
contra el código anterior da 6.
El filtro elegido se recuerda en el aparato (`ce:filtro`), y con la tira
plegada las muestras dejan de dibujarse: eran tres repintados por segundo
de cinco canvas que nadie está mirando, o sea batería del invitado.

**Una sola línea, y cambia sola.** El pie era un párrafo fijo que explicaba
lo mismo toda la noche —a partir de la segunda foto no lo lee nadie—. Ahora
dice dónde está: la primera, el acuse de la que acaba de salir, las últimas
tres, la última. **El acuse y el aviso van en el MISMO renglón**: con el
acuse solo, en la foto que más importa —la última— tapaba justo el aviso, y
el aviso aparecía recién tres segundos después, cuando el invitado ya había
disparado de nuevo. Lo agarró la prueba.

**El velo de arriba llega hasta abajo del contador.** Con 150px tapaba solo
el nombre de la fiesta: apuntando a algo claro —una pared blanca, el cielo,
una pantalla— los cuadraditos y el número quedaban ilegibles sobre la
propia imagen.

**Los nombres cortos de los filtros** (`corto`) existen porque "Blanco y
negro" envolvía a dos líneas y esa sola columna empujaba la tira entera más
abajo que las otras cuatro. En la ficha va el nombre entero.

**Lo que las pruebas del rollo usan de esta pantalla y no se puede
renombrar sin mirarlas**: `#disparo`, `#cRestan`, `#video`, `#altNativa` y
`.pie-camara` (que en demostración tiene que seguir diciendo "se vuelve a
llenar"). `rollo_cinta.js` daba por hecho que en la pantalla aparecía la
palabra "quedan" para saber si había llegado a la cámara: es un proxy
frágil, y conviene mirarlo si alguna vez se cambia ese texto.

### El color de la fiesta

La otra mitad de "darle forma al rollo". Hasta acá **todos los rollos se
veían iguales**: `tono` se aplicaba pero se creaba clavado en `#D9AE72` y
el organizador no tenía dónde cambiarlo, así que la cámara del invitado de
un casamiento y la de unos quince eran la misma pantalla dorada.

Se elige en **Ajustes del rollo**, con las **mismas cuatro pastillas que
el muro** (Oro, Perla, Rosa antiguo, Salvia). Si cambia la paleta, cambia
en los dos archivos.

**Es una lista corta y no un selector libre de color, a propósito.** Con un
selector libre el organizador puede dejar el texto ilegible sobre el negro,
y eso **no lo agarra ninguna prueba**: `pruebas/contraste.js` mide el
código, y ese color no está en el código, está en la base. Cuatro tonos
mirados uno por uno es la única forma de prometer que se lee.

**El acento no viaja solo: viaja con su versión honda.** El disparador es
un degradé de `--oro` a `--oro-hondo`, así que cambiando solo el primero el
botón quedaba **de dorado a verde en el mismo círculo**. Cada tono trae su
`h` en la paleta —el del oro es el que estaba escrito a mano desde siempre
y se dejó igual, porque es el aspecto actual de todo y ya pasó la prueba de
contraste— y `masHondo()` lo calcula para cualquier otro valor que venga de
la base. Baja la **luminosidad** dejando el tinte y la saturación:
multiplicar los tres canales por un número apaga el color además de
oscurecerlo, y el dorado quedaba barroso.

**Se aplica al tocar, sin botón de guardar**, y se pinta ANTES de guardar:
el cambio se ve en el momento y eso es la confirmación. Si la base se
niega, **se vuelve al color anterior** y se lo dice — dejarlo pintado de un
color que no se guardó es la mentira de siempre.

**`pintar()` resetea el tono en cada pantalla.** Sin eso, el color del
último rollo que abriste se quedaba puesto en la portada, en el alta y en
el rollo siguiente: la pantalla de crear una fiesta salía del color de la
fiesta de otro. Cada vista pone el suyo cuando sabe de qué evento se trata,
y eso son tres lugares: `arranqueInvitado` (el invitado), `vRollo` (el
panel) y `vAjustes` (donde se elige — ahí hace falta especialmente, porque
si no el organizador ve la pastilla de Salvia marcada y todo lo demás
dorado, y no sabe cuál de las dos le miente).

Lo mide `pruebas/rollo_color.js`, y lo que mide de verdad es que **el color
le llegue al invitado**: el organizador no elige un color para su panel, lo
elige para la cámara de los que van a la fiesta.

## Los 90 días

Un álbum que vive para siempre es un depósito que crece para siempre, y lo
paga el negocio todos los meses. Cada evento nace con `vence` a **90 días
de la fecha de la fiesta** (`DIAS_QUE_VIVE`, escrito en `muro.html` y en
`rollo.html`: si cambia, cambia en los dos).

Son tres piezas y las tres hacen falta:

- **El aviso**, 15 días antes (`AVISAR_DESDE`). Le aparece al organizador
  arriba de todo en Compartir (muro) y en el panel del rollo, con el botón
  de bajarse el álbum al lado. Cuando ya venció cambia de tono y lo dice.
  Avisar sin dar la salida no sirve; borrar sin avisar antes es perderle
  las fotos a un cliente.
- **La central**, `/muro#central` (`#limpieza` sigue andando), **solo con
  la clave de administrador**: lista TODOS los eventos ordenados por lo
  que les queda —vencidos, por vencer, el resto— y borra los vencidos con
  sus archivos. Un organizador común no la ve ni llega escribiendo la
  dirección.
- **El borrado**, que es `borrarEvento()`, el mismo de la zona de peligro:
  filas, archivos de `ce-medios` y fotos de `ce-rollos`. En tanda va de a
  uno y **no corta si uno falla**: al final dice cuántos pudo y cuáles no.
  Decir "Listo" cuando quedó algo sin borrar es la mentira de siempre.

**Los días se cuentan en días de calendario de acá, no en horas ni en
UTC.** Restando milisegundos, "vence hoy" daba "queda un día" y "faltan
nueve" daba diez; y con `toISOString` de por medio, pasadas las nueve de la
noche en Rosario ya era mañana.

**Los eventos de antes no tienen `vence` guardado**, así que las dos
puntas lo calculan igual desde la fecha (`m.vence||venceDe(m.fecha)`). Si
el aviso usara solo la columna y la limpieza la calculara, esas fiestas se
borrarían a los 90 días sin que el organizador hubiera visto un solo
aviso.

**La lista del administrador se pide de a tandas.** PostgREST corta en 1000
filas sin avisar: con la tabla pedida de un saque, el evento 1001 no existe
para el administrador —ni en el panel ni en la limpieza— y sus fotos se
quedan en el depósito para siempre. El orden lleva desempate por `codigo`:
sin él, dos eventos con el mismo `creado` pueden salir en distinto orden en
cada tanda, y con `offset` eso es una fila repetida y otra que no aparece
nunca.

**La central es el tablero del negocio, no solo la limpieza.** Cada fila
dice el nombre, el código, hasta cuándo vive, si está cerrado o revelado, y
tiene la puerta para entrar **al muro y al rollo** de ese evento. Resuelve
lo que hacía falta de verdad: hasta acá, un rollo solo se manejaba desde el
teléfono donde se creó.

**Se puede guardar antes de borrar.** La central es la única pantalla donde
las fotos de un cliente se borran para siempre, y hasta el 22/09 ofrecía
"Muro", "Rollo" y "Borrar": **ninguna puerta para guardar**. Como hoy las
fotos viven en un solo lugar, lo que se borra de ahí no está en ninguna
otra parte. Ahora cada fila lleva un **"Bajar"** en dorado —va primero, y
lleva a `#album/CODIGO`, que es donde está "Descargar todo"— y el borrado
en tanda avisa, ANTES de pedir la confirmación, que no hay otra copia.
Lo mide `pruebas/vencimiento.js`.
**Esto no reemplaza un respaldo de verdad**: sigue siendo a mano, uno por
evento, y depende de que alguien se acuerde. El respaldo del contenido
sigue en la lista de lo que solo puede hacer el dueño.


**No hay nada automático del lado del servidor.** La limpieza es a mano,
una vez por mes. Si algún día se automatiza, va como tarea programada en la
base, no en el navegador de nadie.

Lo miden `pruebas/vencimiento.js` (el aviso, quién entra a la limpieza, que
borre los vencidos y solo esos, que no diga "Listo" si la base se negó, y
el corte de las mil filas) y `pruebas/rollo_vence.js` (el aviso del rollo).

## Que no se quede una fiesta sin cámaras

El token del rollo lo inventa el teléfono. Alguien que lee el QR de
cualquier mesa —o al que le reenviaron el link por WhatsApp— llama 300
veces a `ce_mi_rollo` con tokens inventados: sin clave y sin cuenta.
Agotado `cupo_invitados`, al invitado siguiente le contesta *"Esta fiesta
ya tiene todas sus cámaras repartidas"* y **no había nada que el
organizador pudiera hacer**. Reproducido contra una copia del esquema de
producción entero.

Lo arregla `sql/camaras.sql`, con tres piezas porque ninguna sola alcanza:

- **Freno de ritmo**: 100 cámaras nuevas por minuto y por fiesta, y va
  **holgado a propósito**. Cuando el QR aparece en la pantalla, doscientos
  invitados lo leen en dos minutos. Es la misma lección de `rafaga.sql`:
  ya pusimos un tope pensando en un atacante y le cortamos el brindis a
  una fiesta de verdad. Llega como **429** para que el navegador espere y
  vuelva solo.
- **El cupo deja de contar las vacías y viejas.** El cupo existe para
  limitar lo que el negocio paga en depósito, y una cámara sin una sola
  foto no ocupa nada: se cuentan las que tienen fotos más las vacías de
  las últimas tres horas. Con eso el ataque **se cura solo**. No le saca
  la cámara a nadie: el token que ya existe sigue andando igual, esto solo
  cambia la cuenta para admitir uno nuevo.
- **`ce_liberar_vacias(codigo)`**, en Ajustes del rollo: borra las cámaras
  sin una sola foto. Las otras dos demoran el problema; ésta lo arregla en
  el momento, que es lo que hace falta una noche.

`camaras.sql` va **después de `blindaje.sql`**, porque reemplaza
`ce_mi_rollo` entera. Lo mide `sql/camaras_probar.sql`: 8 fallas contra el
esquema anterior, 13 verdes con el arreglo.

**El freno de altas de `ce_eventos` sigue siendo global** (30 por minuto
en toda la base, `blindaje2.sql`), así que alguien que sostenga 30 altas
por minuto deja sin crear eventos a todo el mundo. La solución obvia
—contar por la clave presentada— **no sirve**: `SB.crear` manda la clave
del evento nuevo, que sale de `nuevaClave()` y es distinta cada vez, así
que la cuenta daría 1 siempre y el freno dejaría de existir. Habría que
contar por IP y falta saber qué cabecera pasa Supabase, que desde acá no
se puede averiguar.

## La interfaz

Lo que se mide, en `pruebas/interfaz.js`:

- **Todo lo que se toca llega a 44x44 en un teléfono.** Es la medida de
  Apple y de Google. Antes de esta pasada **29 de 68 controles no
  llegaban**: el "Volver" medía 56x27 y el "atrás" del rollo 23x26.
  Se agranda el ÁREA, no la tipografía: el diseño queda igual.
- **De 320px a 1440px no se sale nada** y el título escala solo
  (38px → 66px en la página pública).
- **Las fotos del álbum laten mientras cargan y terminan visibles.** El
  hueco negro con el wifi de un salón era una pared de agujeros.
- **Con "menos movimiento" no late nada** y las fotos se ven igual:
  apagar el movimiento no puede esconder contenido.

Y lo que se mide en `pruebas/dispositivos.js`:

- **Las siete pantallas del producto, en siete aparatos.** De un iPhone SE
  de 320px a un proyector de 1920, pasando por el **teléfono acostado**
  (844x390, que no es un tamaño raro: el organizador da vuelta el celular
  para probar la proyección) y por las dos posiciones del iPad. Cuarenta y
  nueve combinaciones, y en cada una: que nada se salga por el costado, que
  las capas fijas que atajan el dedo no se monten entre ellas, que en un
  aparato táctil todo lo que se toca llegue a 44x44, que los mandos del
  salón no le tapen el cartel, y que no haya un error de JavaScript.
- **Filtrar el ruido es parte de la medición.** Sin filtro, el barrido
  informaba treinta choques por pantalla y ninguno era un problema: las
  capas decorativas (`#brillo`, `#polvo`, los velos) tienen
  `pointer-events:none` y tapar no les cuesta nada, una capa del tamaño de
  la pantalla es el fondo de esa pantalla, y la marquesina corre 1400px de
  texto adentro de un `overflow:hidden`. Una prueba que informa treinta
  cosas cuando hay dos es una prueba que nadie lee.
- **Una lista de selectores escrita a mano se queda corta sola.** El mínimo
  de 44px estaba puesto como una enumeración, y se le habían escapado los
  mandos de la pantalla del salón (29px de alto) y toda la cinta de la
  demostración, donde el **"Salir" medía 26x11**: la única puerta de vuelta
  al sitio, imposible de acertar con el pulgar. La lista sigue existiendo
  porque poner el mínimo en todo rompe el proyector, pero lo que la cuida
  ahora es la medición en los siete aparatos, no la lista.
- **Un botón que no puede hacer su trabajo molesta más que no estar.** En
  el iPhone no existe la pantalla completa —Safari no la da para un
  elemento cualquiera—, así que "Pantalla completa" de la sala no podía
  funcionar nunca, y el mensaje de respaldo decía *"Tocá F11"*, una tecla
  que ese aparato no tiene. Si el navegador no la ofrece, el botón no se
  dibuja.

Y lo que se mide en `pruebas/contraste.js`:

- **Todo el texto se LEE.** Recorre las pantallas del muro, del rollo y de
  la página pública en teléfono y en escritorio, y de cada texto saca el
  color efectivo (con la opacidad heredada y las capas translúcidas
  encima) y el fondo que de verdad quedó atrás —subiendo hasta el primer
  fondo opaco—, y calcula la razón de contraste de la WCAG. Abajo de 3:1
  no es "poco contraste": es que el texto no está. Con `PEORES=1` lista
  los diez más flojos de cada pantalla aunque pasen. Lo que cae sobre un
  degradé o una foto no lo juzga: mejor callar que inventar una falla.

Y tres reglas de interacción que no se ven pero se sienten:

- **El `:hover` se queda PEGADO en una pantalla táctil.** Al tocar, el
  navegador deja el estado puesto hasta que toques otra cosa, así que el
  botón parece seleccionado. Todo hover va en `@media(hover:hover)`, y lo
  que quedaba va anulado en `@media(hover:none)`.
- **Lo que se toca se hunde** (`:active` con `scale(.975)`). Sin eso, con
  mala señal, el invitado no sabe si el toque entró y toca tres veces.
- **`-webkit-tap-highlight-color:transparent`** en todo, no solo en un
  botón suelto: el recuadro azul del sistema arruina el diseño.

## Los dos recorridos

`pruebas/recorrido.js` y `pruebas/rollo_recorrido.js` hacen lo que hace una
persona en una noche, de punta a punta: crear el evento, configurarlo, que
un invitado mande algo desde otro teléfono, que la pantalla del salón no lo
proyecte porque espera aprobación, que el organizador se entere solo,
apruebe, y recién ahí aparezca. Las demás suites miran pantallas sueltas y
casos feos; estas miran si el producto funciona.

**El falso tiene que contestar como PostgREST, no "más o menos".** Ignoraba
`select` y los filtros `campo=eq.valor`: devolvía la fila entera siempre. Con
eso, una consulta angosta parecía diez veces más cara de lo que es y una
comparación entre lo dibujado y lo consultado no coincidía nunca. Medir
contra un falso mentiroso es peor que no medir.

**El Supabase falso está BLINDADO por defecto** (`crearFake(modo, cerrada)`),
igual que producción: sin la clave del evento no devuelve ni una fila. Antes
estaba abierto y las suites corrían contra una base que ya no existe —
cualquier pantalla que dependiera de leer sin clave pasaba en las pruebas y
fallaba en la fiesta. Para probar el camino viejo a propósito:
`crearFake('ok', false)`.

## Reglas para las pruebas

- **Una prueba que pasa siempre no prueba nada.** Escrita la prueba,
  corrigela contra el código *anterior* al arreglo y comprobá que falla. Si
  pasa en los dos, no estás midiendo lo que creés. Pasó con la del orden de
  las tandas: creía que probaba el desempate por `id` y no lo probaba.
- **La regla de los nombres repetidos también vale en las pruebas.**
  `movil.js` tiene una función `caja()` que mide un elemento. Una variable
  local `const caja=...` adentro de un bloque la tapó entera y la suite
  murió con "Cannot access 'caja' before initialization" — el mismo error
  que ya nos había costado el panel con `solapa`. Antes de inventar un
  nombre, `grep`, también acá.
- **Una caja de 0x0 pasa todas las cuentas.** La prueba del cartel del
  salón medía `.sala-cartel` sin darse cuenta de que la demostración entra
  proyectando el muro, no el QR: el cartel está `hidden`, la caja da
  `0,0,0,0` y entonces "entra en la pantalla" ✓, "no se monta con nada" ✓,
  "el QR mide 0px, no se come la pantalla" ✓. Tres verdes midiendo la
  nada. Antes de medir, comprobar que lo que se mide EXISTE y tiene alto.
- **Adentro de `${…}` va código, no texto.** El medidor de contraste se
  serializa con `` `(${function(){…}})()` ``: eso es una función de verdad
  interpolada por su fuente, así que `/[\\d.]+/` ahí adentro significa
  "barra o punto", no "dígito". No matcheaba nada, todas las razones daban
  `NaN`, y `NaN < 3` es falso: la prueba pasaba entera sin medir un solo
  color. Escapes simples adentro del `${}`, dobles solo en una cadena.
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
- **Recargar la página borra la evidencia.** La prueba del rollo que se
  vuelve a llenar sacaba una foto, adelantaba el reloj y **recargaba**
  para leer el contador. Pero la demostración se resiembra en cada carga,
  así que el cupo volvía entero con arreglo y sin arreglo: pasaba de los
  dos lados. Se mide sacando una SEGUNDA foto sin recargar: si la primera
  se devolvió, el contador vuelve a marcar lo mismo; si no, uno menos.
- **Una pestaña que queda abierta le arruina la siguiente.** La primera
  página de `rollo_cinta.js` se dejaba abierta hasta el final, con la
  cámara y los sondeos andando. La segunda —que usa el reloj falso de
  Playwright— no terminaba de cargar nunca: tres corridas colgadas en el
  mismo punto. Cerrar el contexto cuando se termina de usar.
- **Con el reloj falso puesto, `goto` con `waitUntil:'domcontentloaded'`
  se cuelga**; `waitUntil:'commit'` y después `waitForLoadState` vuelve en
  60 ms. Medido, no supuesto.
- **Una prueba que cuenta clicks se rompe sola.** `rollo_hora` y
  `rollo_hostil` recorrían el alta con "cuatro clicks en Siguiente". El
  día que el asistente pasó a seis pasos las dos fallaron **por el motivo
  equivocado**: se quedaban a mitad de camino y reportaban que no se
  guardaba la clave. Se avanza mientras el botón diga "Siguiente"; el
  click que no lo dice es el de crear. Lo mismo vale para cualquier
  recorrido: apoyarse en lo que dice la pantalla, no en cuántas veces hay
  que tocar.
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

## La app andando adentro de la web

**Es la presentación, y va arriba de todo**: decisión del dueño. Lo primero
que ve el que entra, apenas pasa la portada, son los tres servicios
FUNCIONANDO —no una lista de lo que hacemos—. El menú la nombra "Probala" y
es su primer renglón; la flecha "Deslizá" de la portada apunta ahí.
`pruebas/movil.js` falla si esa sección se vuelve a ir abajo.

`index.html` tiene el apartado **`#app`**: una notebook con el muro
proyectándose y dos celulares —el álbum del rollo y una invitación—, los
tres corriendo de verdad en un marco, no capturas. Reusa la misma maquinaria que la galería
de Trabajos (`.vivo`, con `IntersectionObserver` y un dibujo de reserva
debajo por si el marco no carga); ahora `data-ancho` dice a qué ancho se
dibuja adentro (1200 la pantalla del salón, 390 el celular) en vez de estar
clavado en 390.

Las apps entienden **`?marco=1`**: sin cinta de demostración y sin los
botones de la pantalla del salón. Es una vidriera, no algo para tocar: se
toca y se abre la demostración de verdad en otra pestaña.

El muro y el rollo tienen su lista de **qué incluye** (`.incluye tres`),
igual que las invitaciones. **Sin precios**, por decisión del dueño: el
presupuesto se cierra hablando.

## Invitaciones alojadas en el repo

Cada invitación es una carpeta con su `index.html` en la **raíz**:
`delfina15/index.html` se sirve en `clicketerno.com.ar/delfina15`. Antes
vivían en Netlify.

**La que está en el repo abre siempre; la que está en Netlify, depende.**
La galería de Trabajos las muestra andando adentro del celular, y antes de
meterlas en el marco le pregunta a cada una si responde: si el sitio está
caído, o tarda, o no se deja incrustar, queda la portada dibujada y el
cliente ve un dibujo en vez del producto. Pía ya vive acá (`pia/nueva/`) y
por eso abre al toque; **Key y Xiomara siguen en Netlify** y hay que
traerlas. Falta que el dueño pase las dos carpetas enteras —el HTML, las
fotos y la música—, no solo el HTML: con el HTML solo, las fotos siguen
saliendo de Netlify y el problema es el mismo. Las reglas de cómo entra una
carpeta nueva están en `invitaciones/LEEME.md`. Las reglas y los nombres prohibidos (`muro`, `rollo`,
`app`…) están en `invitaciones/LEEME.md`; `pruebas/invitaciones.js` las
verifica: que no tapen una ruta de la app, que no queden apuntando a
netlify.app, que no usen caminos absolutos —que en Netlify funcionaban
porque cada una era un sitio aparte y acá no— y que no pesen de más.

## Lo legal: privacidad, consumidor y la imagen de la gente

Dos páginas públicas —`privacidad.html` y `terminos.html`, servidas en
`/privacidad` y `/terminos`— y un protocolo interno, `SEGURIDAD.md`, que no
se publica. Lo mide `pruebas/legales.js`.

**Esto lo escribió un programa, no un abogado.** Está investigado contra las
normas vigentes y verificado contra las fuentes oficiales en septiembre de
2026, pero antes de apoyarse en ello para un conflicto conviene que lo mire
un matriculado. Lo que sí resuelve es no tener nada, que era la situación
anterior.

### Qué se aplica, verificado

- **Ley 25.326 de Protección de los Datos Personales** y su Decreto
  1558/2001. **Sigue vigente**: hay cuatro proyectos de reforma dando
  vueltas en el Congreso (Rossi 3397-D-2026, Yeza 1751-D-2026, Carro
  1948-D-2025, Doñate 644-S-2025) y **ninguno se sancionó**. Órgano de
  control: la **AAIP**.
- **Resolución 14/2018 de la AAIP**: derogó la vieja Disposición 10/2008,
  así que **las leyendas obligatorias de antes ya no van**. Lo que hay que
  hacer hoy es mostrar la información del **artículo 6 de la Ley 25.326**
  en forma clara y expresa **antes** de recolectar el dato, diciendo
  especialmente cómo se ejercen los derechos. Si alguna vez alguien
  propone pegar la leyenda vieja, está copiando una norma derogada.
- **Resolución 47/2018 de la AAIP**: medidas de seguridad recomendadas.
  Su Anexo I tiene ocho secciones —recolección, control de acceso, control
  de cambios, respaldo y recuperación, gestión de vulnerabilidades,
  destrucción de la información, incidentes de seguridad y entorno de
  desarrollo— y `SEGURIDAD.md` está armado con esas ocho, en ese orden.
- **Artículo 21 de la Ley 25.326**: inscribir la base en el **Registro
  Nacional de Bases de Datos** es obligatorio para cualquiera que trate
  datos más allá del uso personal. Es gratis, por Trámites a Distancia.
  **Está sin hacer.**
- **Disposición 60-E/2016**: transferencia internacional. Los Estados
  Unidos **no** están en la lista de países con protección adecuada, y ahí
  es donde suelen estar los servidores de Supabase y Cloudflare. La
  política lo dice con todas las letras en vez de esconderlo.
- **Artículo 53 del Código Civil y Comercial**: para captar o reproducir la
  imagen o la voz de una persona hace falta su consentimiento. Las tres
  excepciones son actos públicos, interés científico o cultural, y derecho
  de informar: **una fiesta privada no es ninguna de las tres**. Más el
  **artículo 31 de la Ley 11.723** para el retrato fotográfico. Este es el
  riesgo central del producto, no un detalle.
- **Menores**: en una fiesta de quince hay menores en casi todas las fotos.
  El consentimiento lo dan quienes ejercen la responsabilidad parental
  (arts. 26 y 53 CCyC) y **lo tiene que reunir el organizador**, que es
  quien conoce a los invitados. Nosotros no podemos.
- **Ley 24.240 de Defensa del Consumidor** y art. 42 CN. Dos cosas que se
  cumplen y no son opinables: el **derecho de revocación de 10 días
  corridos** (art. 34) y que **la jurisdicción es la del domicilio del
  consumidor** (art. 36) — cualquier cláusula en contra es nula, así que
  los Términos no la tienen.
- **Resolución 424/2020 de la Secretaría de Comercio Interior**: el
  **botón de arrepentimiento**, accesible desde la página de inicio y en
  lugar destacado. Está en el pie, con borde dorado, y la prueba mide que
  se vea, que llegue a 44px y que lleve a una página que existe.
- **Multas**: Resoluciones 240/2022 y 244/2022 de la AAIP, hasta 3, 10 y 15
  millones de pesos según la gravedad.

### El aviso del artículo 6 va DONDE se pide el dato

No en un enlace al pie. El invitado ve, en la misma pantalla en la que
escribe su nombre y elige su foto, un desplegable (`.aviso-datos`) que dice
para qué es, quién es el responsable, que es voluntario, que se borra a los
90 días y cómo pedir que se borre antes. Está en `muro.html` (pantalla del
invitado) y en `rollo.html` (pantalla del nombre). `pruebas/legales.js`
verifica que estén **las cinco cosas**, no que el desplegable exista.

**Plegado no es escondido, pero debajo de una capa fija sí.** La primera
versión quedó entre el contenido y la barra `position:fixed` de "Enviar":
se dibujaba, la prueba lo encontraba en el DOM, y era **imposible de
abrir**. Va adentro del contenido que scrollea.

### Los 90 días también son un argumento legal

El borrado automático a los 90 días existía por plata. Además cumple el
**artículo 4 inciso 7** de la Ley 25.326: el dato se destruye cuando deja de
ser necesario para la finalidad que justificó tratarlo. Por eso la limpieza
mensual de `/muro#central` dejó de ser una tarea de mantenimiento y pasó a
ser una obligación declarada por escrito en una página pública.

### Quién responde por los datos, y qué cubre al negocio

Decisión del dueño: **el responsable tiene que ser quien contrata**. Está
escrito en `terminos.html#responsable` y es defendible, porque es verdad:
el organizador decide hacer la fiesta, elige a quién invita, sabe quiénes
son menores y está en el salón. Click Eterno trata **por su cuenta y
orden**, en los términos del **artículo 25 de la Ley 25.326**.

Lo que lo sostiene son tres piezas, y las tres hacen falta:

1. **El reparto de roles**, escrito: él responsable, nosotros prestadores
   del servicio de tratamiento.
2. **Las declaraciones del organizador**: avisarles a los invitados, tener
   el consentimiento de imagen y el de los menores, no subir contenido
   ilícito, cuidar la clave. Son *lo único que no podemos cumplir por él*.
3. **La indemnidad**: si un tercero nos reclama por culpa de que él no
   cumplió, se hace cargo él.

**Y una casilla que es una puerta de verdad.** Sin marcarla no se crea el
evento —ni en el muro ni en el rollo— y el momento queda guardado en la
columna `acepto`. Un contrato que nadie puede probar que se aceptó no
sirve de mucho. `pruebas/legales.js` intenta crear sin marcarla y falla si
el evento aparece igual.

**Lo que esto NO hace, y conviene tenerlo claro antes de dormir
tranquilo:** un invitado que aparece en una foto **no firmó nada** y puede
reclamarnos directamente a nosotros. La indemnidad no lo impide: reparte
entre nosotros y el organizador quién asume qué, y nos da con qué repetir.
Y como el tratamiento nuestro es comercial, la Ley 25.326 **nos alcanza
igual**: la seguridad, el borrado y la información son obligaciones
nuestras y no se tercerizan. Quien ofrezca un blindaje total está
mintiendo. Por eso los Términos dicen, con las mismas letras, *"si el
problema es nuestro, es nuestro"*: una cláusula que intentara taparlo
sería nula frente a un consumidor (art. 37 de la Ley 24.240) y de paso nos
dejaría peor parados.

### Lo que falta y solo lo puede hacer el dueño

1. ~~**Verificación en dos pasos**~~ **Hecha** (24/09/2026): Supabase,
   Cloudflare y el correo del negocio, los tres con aplicación
   autenticadora. Era lo que más bajaba el riesgo de todo el sistema.
   En Cloudflare la pantalla nueva no tiene el botón "Enable" de antes:
   son tres métodos en fila —clave de seguridad, aplicación móvil, correo—
   y los botones quedan **a la derecha**, fuera de la vista si la ventana
   está angosta. El que vale es *aplicación móvil* (TOTP); el de correo no
   sirve de nada acá, porque con el correo se resetean las otras dos.
2. **Respaldo del contenido.** Hoy las fotos están en un solo lugar.
3. **Inscribir la base en el Registro Nacional de Bases de Datos** (AAIP).
4. **Razón social y CUIT** para las dos páginas legales. Mientras falten,
   `pruebas/legales.js` lo informa como "salteada" en cada corrida: no
   rompe la suite, pero no deja olvidarse.
5. **Rotar la clave maestra**, que nunca se cambió.

## Lo que no se toca sin permiso

- La clave maestra de administrador.
- Las políticas de Supabase ya instaladas.
- `app.html`: hay QR impresos apuntando ahí.
- El número de WhatsApp.

## Pendiente, decidido y no hecho

- **El rollo nunca se probó en un teléfono de verdad.** Está repasado línea
  por línea y tiene 69 comprobaciones de casos feos, pero todo eso corre en
  un Chromium de escritorio contra un Supabase de mentira. Lo que falta ver
  en hardware real: la cámara de un iPhone (Safari es donde más se rompió
  esto), el revelado en una pantalla chica, y el wifi de un salón lleno.
- ~~**Darle forma a la interfaz del rollo.**~~ **Hecho.** La cámara del
  invitado y el color de la fiesta tienen su apartado más arriba. Lo que
  queda de la referencia (instante.camera) es su "Estudio": generar piezas
  para redes con el branding del evento. Eso es otra cosa y no está
  pedido.
- ~~**Video recap** del álbum~~. **Descartado por el dueño** (16/09), con
  la propuesta técnica sobre la mesa y comprobada: canvas + `MediaRecorder`
  da un mp4 de ~2,5 MB para 30 segundos, sin servidor. No insistir sin que
  lo pida él.
- **Contratar Supabase Pro.** Decidido por el dueño: las fotos se quedan
  donde están, no se mudan a R2. Una foto pesa ~441 KB y un evento de 100
  invitados con 24 fotos son ~1 GB: **el plan gratis (1 GB) no aguanta un
  solo casamiento.** Pro son USD 25 al mes con 100 GB, y con los 90 días
  puestos el depósito deja de crecer para siempre. Hasta que no se
  contrate, el segundo casamiento del mes falla al subir.
- **Pasar la limpieza a mano, una vez por mes.** `/muro#limpieza`, con la
  clave de administrador. Es lo que ejecuta los 90 días: hoy no hay nada
  automático del lado del servidor.
- ~~**Miniaturas**~~. **Hecho.** El álbum baja **8,6 veces menos**
  (medido: 13,4 MB → 1,5 MB con 30 fotos). Se generan al subir, en el
  mismo lugar donde ya se comprime, y ocupan un 5% más de depósito.
- **Los nombres de los servicios.** "Muro en vivo" y "Rollo eterno" son
  provisorios.
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
