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

**Las fotos de las dos demostraciones son FOTOS DE VERDAD.** Están en
`demo/`, diez archivos de ~1000px y 750 KB en total, y se publican con el
sitio. Hasta acá las dos dibujaban un degradado con manchas de luz en un
canvas (`fotoDemo` en el muro, `fotoInventada` en el rollo): el que entra
a "Probar la demostración" veía manchas, y lo que hay que mostrarle es el
producto. El álbum revelado del rollo —que es LA pantalla que vende— era
el peor caso.

Son caminos relativos (`demo/01.jpg`), no `data:`: `urlSegura` los acepta,
`miniDe` devuelve vacío para todo lo que no sea del depósito y en
demostración no hay nube, así que la foto entra por el mismo camino que
una de verdad sin tocar nada más. En el rollo **lo que sacó el que está
probando sigue ganando**: `urlDe` mira primero el `blob:` de su propia
foto. La portada del muro es la 10 porque es la única apaisada y se
proyecta a tres metros.

**Si faltara uno de esos archivos no pasaría nada visible**: la foto queda
en blanco y no hay ningún error. Lo cuida `pruebas/demo.js`, que exige que
los diez se sirvan, que `demo/` **no** esté en `.assetsignore` —ahí
Cloudflare no los sube pero el servidor de pruebas los sirve igual, y la
prueba pasaría en verde con la web rota— y que las fotos del álbum carguen
de verdad (`naturalWidth > 0`). Contra el código anterior esa suite da 4
fallas. `demo` quedó en la lista de nombres reservados de
`invitaciones/LEEME.md`.

**Son fotos de personas y están publicadas.** No es lo mismo que ponerlas
en un video que se manda por WhatsApp: acá quedan en una dirección fija,
las puede bajar cualquiera y las puede indexar un buscador. Vale lo del
artículo 53 del Código Civil y Comercial igual que para un cliente, y si
alguna vez aparece un menor en una, no va.

**Lo escrito va MEZCLADO con las fotos, no después.** La fiesta de
ejemplo tiene nueve fotos y cinco dedicatorias, y la proyección va en
orden de `ts`: sembradas por tanda —las nueve fotos primero— el que
entraba a probar veía ocho fotos seguidas, casi un minuto, antes del
primer saludo escrito, y se iba creyendo que el muro no escribe. Ahora
va un saludo cada dos fotos, que además es lo que pasa en una fiesta.
El orden se decide armando la lista y el `ts` sale de ahí, no al revés.
Y el botón de la demostración lo dice: *"Probá mandar una foto o un
saludo"*, que antes era solo la foto.

Lo mide `pruebas/demo.js` por la **racha más larga de fotos seguidas**
en una vuelta entera (tope: tres), no por "si hay un saludo en los
primeros cuatro": la proyección arranca en cualquier punto del ciclo y,
arrancando justo en el bloque de saludos, esa comprobación pasaba
también con el orden viejo. Contra el código anterior da 7. Ojo con
`.dejar`: lo comparten el botón de pantalla completa y el de la
demostración, y el muro mismo lo busca como `:last-child`.

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
- **Un pedido termina PUBLICADO, no "listo para publicar".** Dicho el
  18/10/2026: *"siempre que te pida algo dale hasta que esté publicado"*.
  O sea que el camino completo —cambio, pruebas, commit, merge a `main`—
  va de corrido y no hay que pedirle permiso en el último paso. Antes
  cada cosa quedaba esperando un "mandalo" suyo, y eso lo convertía en el
  que tiene que acordarse de apretar el botón. **Lo que sigue necesitando
  su decisión no es la publicación, es el CONTENIDO**: un dato que no
  mandó el cliente —una hora, una fecha de cierre, el titular de una
  cuenta— no se inventa para poder terminar.
- **No explicarle el cómo.** *"No me des mucho detalle que yo no sé
  programación."* El informe es: qué cambió, qué se ve distinto, y qué
  falta de su lado. Los nombres de archivos, los selectores y los
  números de las pruebas no le dicen nada; si algo salió mal, eso sí se
  dice, en castellano.
- **No gastarle la sesión.** Dicho el 30/10/2026: *"me haces gastar
  tokens"*. Tres cosas, y las tres salieron de esa misma tanda: correr
  **solo** las pruebas que pueden ver el cambio (ver la excepción de
  arriba), correrlas **una vez y al final** en vez de después de cada
  ajuste, y contestar corto. Un informe largo no es más completo: es
  más caro.
- **Del otro lado no se depura.** Si algo falla en el teléfono, lo que
  llega es "no anda" o una captura. La prueba tiene que existir antes de
  que la pruebe una persona.
- **El negocio está en Rosario (UTC−3).** Todo lo de fechas y horas se
  piensa desde ahí, no desde UTC. Ya costó un bug fatal.
- El teléfono del negocio es **341 250-6451** y no se cambia.
- **Un link nunca se entrega pelado: va con un texto SENTIDO para el que
  lo recibe.** Dicho el 01/11/2026: *"siempre que te pida para entregar el
  link sea con un texto sentido para el que lo reciba"*. La primera vuelta
  salió como una ficha —lugar, fecha, dress code y el link— y eso no es una
  invitación, es un dato: el que lo recibe no siente nada y la pieza que
  hay del otro lado es justamente lo contrario. El texto va **en la voz de
  quien invita**, no en la nuestra, y dice por qué querría que esa persona
  esté; los datos van abajo, cortos, porque la invitación ya los tiene. Lo
  mismo vale para el link del tablero que se le manda al cliente.
  **Lo único que no se toca es el DATO**: una hora, un lugar o una fecha que
  no mandó el cliente no se inventan para que la frase cierre mejor.

## Arrancar

    bash pruebas/todo.sh

Levanta los servidores que hagan falta, corre las pruebas del muro, las del
rollo y las de la base, y apaga solo lo que haya levantado. También
`todo.sh muro`, `todo.sh rollo`, `todo.sh sql`.

Correr **todo** antes de mergear, no solo lo que tocaste: los dos servicios
comparten `pruebas/fakesb.js`, las tablas y el sistema de clave.

**Con UNA excepción, y la marcó el dueño**: *"¿por qué chequeás muro y
rollo siendo que lo único que modificamos es tarjetas?"*. Si el cambio
vive entero adentro de `<evento>/` —una invitación— y de
`pruebas/invitacion_mirar.js`, **la tanda del rollo y la de la base no
pueden verlo**: comprobado, ninguna prueba del rollo nombra una
invitación ni ese medidor. Ahí alcanza con
`node pruebas/invitacion_mirar.js <evento>` y `todo.sh muro`.

**Y la tanda entera del muro TAMPOCO va.** Dicho por el dueño el
05/11/2026, después de que se corrieran las 31 suites por una
invitación: *"¿qué parte no entendés que me tenés que ahorrar tokens?
¿Para qué ejecutás muro si estás con una invitación?"*. Tenía razón y
la regla de más arriba estaba escrita de más: de esas 31, **una sola**
puede ver una invitación —`invitaciones`, que le mira el peso, el
nombre de la carpeta, que no use caminos absolutos y que no nombre a
la clienta de otra—. Las demás miran el muro, la página pública, el
flyer o la vitrina, y una invitación que no está en la galería no
aparece en ninguna.

Así que para una invitación son **DOS comandos y nada más**:

    node pruebas/invitacion_mirar.js <carpeta>
    node pruebas/invitaciones.js

Se suman **sólo si el cambio las toca**: `listado` y `rsvp` si se
toca el tablero o el Apps Script, `vitrina` y `contraste` si la
invitación entra en la galería de Trabajos o en `/invitaciones`, y
`guia` si se toca el flyer. **Ninguna de esas cuatro ve una invitación
de un cliente**, que por definición no está en la galería.

La regla sigue siendo la misma de siempre, dicha bien: no se corre
una tanda por su nombre, se corre **lo que puede ver el cambio**. Las
pruebas están agrupadas por dónde viven —el servidor que necesitan— y
no por lo que miden, así que el nombre de la tanda no dice qué cubre,
y eso vale para decidir qué correr **y también qué NO**.

En cuanto se toca cualquier cosa de afuera de esa carpeta —`lib/`,
`index.html`, las dos apps, `_headers`, `sql/`, o cualquier otra
prueba— vuelve a valer la regla entera.

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
    → sql/rafaga.sql → sql/camaras.sql → sql/activacion.sql

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

**Crear una función no alcanza: PostgREST tiene que enterarse.** Su caché
de esquema no se actualiza al toque, así que una función recién creada
existe en la base y la API igual contesta `PGRST202`, *"no matches were
found in the schema cache"*. Lo peor es cómo se ve: **las comprobaciones
del propio SQL dan todas `true`** —miran `pg_proc` directo— y la app sigue
sin poder llamarla, así que parece que el archivo se corrió mal cuando se
corrió bien. Cada archivo de `sql/` termina con `notify pgrst, 'reload
schema';` por eso. Si alguna vez se pasa una función suelta pegada en el
chat, esa línea va al final o no sirve de nada. Medido el 25/09/2026.

**En el SQL Editor NO existe `request.headers`.** Se conecta directo a
Postgres y esa variable la pone **PostgREST**, o sea el camino por el que
entra la app. Ahí `current_setting('request.headers', true)` devuelve
siempre `null`, haga lo que haga el navegador. Cualquier cosa que dependa
de las cabeceras —la clave del evento, la maestra, una IP— **no se puede
diagnosticar desde el editor**: hay que hacerla medir por un pedido de
verdad (una función `stable` que las devuelva, llamada por `/rest/v1/rpc/`,
y borrada después). Se perdió una vuelta entera dando `NULL` y creyendo
que decía algo.

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
- **Una capa con degradado hecha para ir arriba de una foto se le monta al
  texto.** El nombre de las fichas de "entrando ahora" (`.nom-p`) es un
  `position:absolute` con un degradado negro: arriba de una foto separa y
  se lee, pero la MISMA ficha sirve para un saludo escrito, y ahí no hay
  foto que oscurecer — solo la última línea del saludo, tapada. Medido en
  un teléfono: 18px de superposición, y en la pantalla se leía *"de esto."*
  con *"Nacho"* encima. En la ficha de texto el nombre va en el flujo. Y el
  saludo se corta con `-webkit-line-clamp`: cortado a la mitad de una
  palabra parece un producto roto, cortado en "…" se lee como "sigue". Se
  puede recortar porque la dedicatoria entera pasa igual por la pantalla
  grande y por la cinta de abajo.
- **La tipografía de las dedicatorias está en `--dedi`, una sola vez.** Lo
  que escribe el invitado va en **Poppins** (decisión del dueño); la Bodoni
  queda para los NOMBRES y los títulos. La dedicatoria se dibuja en cinco
  lugares —la placa del salón, el epígrafe de la foto, las fichas de
  "entrando ahora", la cinta que corre abajo y el álbum—: escrito cinco
  veces, alguno se queda atrás y el salón muestra dos tipografías para la
  misma cosa. Y el peso que se pide en el link tiene que ser el que usa el
  CSS: `font-weight:200` con Poppins cargada en 300 es pedirle al navegador
  que invente un peso, y eso no avisa.
- **Desde acá no se puede VER una fuente de Google.** El proxy firma los
  certificados y el navegador rechaza `fonts.googleapis.com`:
  `document.fonts` queda vacío y **tampoco carga la Bodoni**, así que un
  `[]` ahí no dice nada del producto. Lo que sí se mide, y es lo que se
  rompe de verdad, son las dos mitades: que el HTML la PIDA (incluido el
  `<link>` del `<noscript>`, que el navegador no expone como elemento —hay
  que mirar el HTML crudo—) y que el CSS la APLIQUE. Con una sola de las
  dos el texto sale en otra tipografía y no hay ningún error.
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

- **Si un bloque trae su propio fondo, trae su propia tinta — tercera
  vez.** Ahora fue `.btn-hilo`, el botón de contorno: nació para la parte
  negra y su tinta es champán. Puesto en la sección clara del cierre de
  Invitaciones dio **1.20:1**, o sea que el texto no estaba. En el monitor
  no se nota porque uno mira el borde, no la letra. Lo agarró
  `pruebas/contraste.js` y se arregla donde corresponde: la sección clara
  le da su propia tinta (`.clara .btn-hilo`, 4.86:1). El contraste no se
  opina, se calcula.

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

## Lo que se vio en un iPhone de verdad

La primera prueba en hardware real, y encontró dos cosas que ninguna de
las 39 suites podía ver, porque las dos son sobre **cómo se siente**, no
sobre si funciona.

**De la cámara no se podía salir.** Entrabas y no había forma de volver
hasta gastar las 24 fotos. Una fiesta dura seis horas y nadie saca
veinticuatro seguidas: el invitado saca dos en la entrada, guarda el
teléfono y vuelve en el brindis. Y mientras tanto **la cámara quedaba
prendida**, comiéndole la batería toda la noche. Ahora hay un ✕ arriba a
la izquierda que la apaga y lleva a una pantalla con cuántas le quedan y
un botón para volver.

Tres cosas que no son adorno:

- **El sondeo lo devolvía solo.** El estado se consulta cada 15 s y esa
  consulta llama a `rutear()`, que manda a la cámara mientras queden
  fotos: sin cuidarlo, el invitado salía y a los quince segundos la app lo
  metía adentro de nuevo. Lo cuida la bandera `pausado`, que `rutear()`
  mira **después** de `revelado` y `cerrado`, así esos dos siguen mandando.
  Hay una comprobación que espera 18 s justamente para eso.
- **Al volver se vuelve a preguntar el estado**, en vez de confiar en el
  que teníamos: si el organizador cerró o reveló mientras el invitado
  estaba en pausa, va a donde corresponde y no a la cámara.
- **La pausa es de esa visita, no del rollo.** Si recarga o vuelve a leer
  el QR, entra derecho a la cámara: el que reabre el link quiere sacar una
  foto, no ver un cartel.

**El revelado existía entero y no se veía.** Parecía que duraba poco, y no
era la duración: las copias caen todas en el **mismo lugar** de la
bandeja, una encima de la otra, y la imagen tarda ~2,4 s en subir desde el
papel — pero la siguiente copia caía a los **680 ms**. Tapaba a la
anterior cuando iba por la cuarta parte del revelado, así que de las cinco
se veía revelarse **una: la última**. Medido con el DOM, no deducido: los
huecos daban `680, 680` contra un revelado de 2,2 s.
Ahora `PASO_COPIA` son 1400 ms y la imagen sube en 2,6 s. Con 5 copias el
cuarto oscuro pasa de ~8 s a ~11, y el "Tocá para saltear" aparece antes:
alargar el efecto sin dar la salida es hacer esperar al que no lo quiere
ver. Lo mide `pruebas/rollo_revelado.js`.

**La lección que dejan las dos**: lo que una suite no puede medir es si
algo se SIENTE bien. Las dos fallas estaban a la vista en el código y
ninguna rompía nada. Hasta que no lo tuvo en la mano una persona, no
existieron.

## El alta no es gratis: el código de activación

Hasta el 26/09/2026 **cualquiera que llegara a `/#entrar` se armaba su
evento sin pagar**. La "clave" que pedía el panel es un PIN que el propio
visitante inventa y que se guarda EN ESE TELÉFONO —el comentario del
código ya lo decía: *"sirve de traba en este aparato y nada más"*— y en el
rollo no había ni eso. Y no hacía falta ni el navegador: la política de
INSERT de `ce_eventos` dice `with check (true)`, así que con `curl`
también. Lo encontró el dueño probando su propia página.

Es la misma trampa por **tercera vez**: *lo que decide el navegador no es
una regla, es una decoración.* Esconder el botón no cierra nada.

Lo arregla `sql/activacion.sql`:

- **`ce_codigos`**, cerrada a lectura. Si se pudieran leer, se podrían
  usar.
- Un **disparador en `ce_eventos`**: sin un código válido y sin usar, no
  hay evento. Se consume **en el mismo movimiento en que se comprueba**
  (un `update ... where usado_en is null`), así que dos pedidos
  simultáneos con el mismo código no entran los dos.
- **Con la clave maestra no hace falta código**: es para cuando la fiesta
  la arma Click Eterno, que es como se vende hoy.
- Los genera **la base** (`ce_crear_codigo`), no el navegador: *si el
  navegador lo genera, el navegador lo puede repetir*.

Del lado de la web: el alta del muro y la del rollo lo piden —en el rollo
va en el **primer** paso, porque enterarse en el sexto después de elegir
todo es peor—, viaja en `x-activacion`, y **la central pasó a ser la caja
del negocio**: ahí se generan los códigos, se copian y se ve cuáles se
usaron.

**Esto no cobra: es una puerta, no una caja.** El día que se automatice
con Mercado Pago, MP no tiene que hacer otra cosa que llamar a
`ce_crear_codigo` cuando el pago se acredita. Por eso este trabajo no se
tira si algún día se integra.

**Mercado Pago no podía ir primero**, y el motivo principal es del dueño:
un checkout obliga a **publicar precios**, y está decidido que no
(*"el presupuesto se cierra hablando"*). Además necesita un servidor que
reciba el aviso del pago, y razón social y CUIT, que todavía no hay.

Lo mide `sql/activacion_probar.sql` (5 fallas contra el esquema anterior,
13 verdes con el candado) y `pruebas/puertas.js` del lado de la web.

**Ocho suites crean eventos recorriendo la pantalla** (`stress`, `hostil`,
`seguridad`, `legales`, `recorrido`, `rollo_hostil`, y las del alta): todas
tuvieron que aprender a poner el código, porque una persona también tiene
que ponerlo. En `legales` **el orden importa**: hay una comprobación que
mide "sin aceptar los Términos no se crea el evento", y con el código
puesto DESPUÉS de ese intento lo que rebotaría sería el código y no la
casilla — la prueba seguiría verde midiendo otra cosa.

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

Y lo que se mide en `pruebas/barrido.js`, que es la revisión que pidió el
dueño el 12/10/2026 (*"tiene que ser adaptable a iPhone, Android y PC, medí
minuciosamente, y ya que estamos probá todo lo que se pueda clickear"*).
`dispositivos.js` mide la FORMA; esto mide otra cosa, y son dos fallas
distintas que no tiran ningún error:

- **Pasada A, sin tocar nada, en DIEZ aparatos** —cuatro iPhone (320, 375,
  390, 430), tres Android (360x800, 412x915, 360x640), iPad, notebook y
  escritorio— y **doce pantallas**: de cada control visible, que llegue a
  44x44 en un aparato táctil, que no se salga por el costado, y que **no
  lo tape otra cosa**. Lo del tapado es lo nuevo y se mide con
  `elementFromPoint`: se le pregunta al navegador **quién atajaría el dedo**
  en el centro del control. Un botón tapado se dibuja perfecto y no
  responde; ya pasó dos veces acá.
- **Pasada B, tocando todo, uno por uno**, en un teléfono y una notebook:
  **118 controles cada uno**. De cada toque: que no tire un error, que no
  deje la página desbordada, que no deje una pantalla **sin texto** y que
  no deje un **callejón sin salida**.

Encontró tres cosas de verdad, y las tres estaban a la vista:
**"Entrar como administrador"** medía 230x17 —la única puerta al modo
administrador, imposible de acertar con un pulgar—; el enlace de vuelta de
la pantalla de 404 medía 99x18 y el teléfono del pie de `empezar`, 87x19;
y el **aviso emergente del rollo se comía el toque** de lo que quedara
abajo, que es justamente el disparador de la cámara. Un cartel que aparece
solo y se va solo no puede atajar un dedo, y encima el que lo toca cree
que tocó el botón: ahora va con `pointer-events:none`.

Contra el código anterior da **8 fallas**.

**Dos cosas que la primera versión medía mal**, y las dos son la misma
lección de siempre:

- **Miraba la opacidad del elemento y no la de sus padres.** El visor de
  invitaciones está cerrado con `opacity:0;pointer-events:none` en el
  padre, y su botón "Cerrar" sigue midiendo 1 de opacidad: el barrido
  informaba en los diez aparatos que ese botón estaba tapado. Era verdad y
  no importaba, porque ese botón no está en la pantalla. Es la regla de la
  caja de 0x0 al revés: **antes de medir algo, comprobar que ESTÉ**.
- **Preguntaba sin scrollear.** En una pantalla corta, lo de abajo arranca
  debajo de la barra fija y se destapa scrolleando — para eso está el
  `padding-bottom` de esas pantallas. Ahora, si parece tapado, lo trae al
  medio y vuelve a preguntar; solo cuenta si sigue tapado ahí.
- **Una `label` no es el blanco: el blanco es su campo.** Pedirle 44px de
  alto a un rótulo de 14 es meterle aire muerto a todos los formularios.
  Se exime solo si el campo al que apunta existe, se ve y llega a 44.

**Los aparatos se miden de a cinco a la vez.** En fila son 120 cargas de
página con sus esperas: más de los diez minutos que `todo.sh` le da a cada
suite, y una prueba que el corredor mata a mitad no informa nada. En
paralelo tarda **menos de cinco minutos** y mide lo mismo: cada aparato
tiene su contexto y no se ven entre ellos. Se informan **en orden**, no
según quién terminó antes, para que dos corridas se puedan comparar.

Y lo que se mide en `pruebas/enlaces.js`, que recorre la parte pública
—inicio, privacidad, términos y la de 404— con un navegador limpio:

- **Cada enlace llega a algo vivo**: el ancla existe en el documento, o la
  ruta contesta menos de 400. Un enlace muerto no tira ningún error: la
  página se queda quieta y el que pagó el clic se va.
- **Ningún enlace vacío, ningún id repetido, ningún botón sin nombre.** El
  segundo elemento con el mismo id no se alcanza nunca por su ancla.
- **Todo lo que abre en otra pestaña lleva `rel="noopener"`.**
- **Los tres productos tienen su botón de presupuesto** y el mensaje dice
  de cuál. Esto no es decoración: el muro y el rollo estuvieron meses sin
  un solo botón de comprar.
- **La vista previa al compartir**: título, bajada e imagen, y que la
  imagen no devuelva 404. Un recuadro vacío en WhatsApp no avisa.

Y lo que se mide en `pruebas/contraste.js`:

- **Todo el texto se LEE.** Recorre las pantallas del muro, del rollo y de
  la página pública en teléfono y en escritorio, y de cada texto saca el
  color efectivo (con la opacidad heredada y las capas translúcidas
  encima) y el fondo que de verdad quedó atrás —subiendo hasta el primer
  fondo opaco—, y calcula la razón de contraste de la WCAG. Abajo de 3:1
  no es "poco contraste": es que el texto no está. Con `PEORES=1` lista
  los diez más flojos de cada pantalla aunque pasen. Lo que cae sobre una
  FOTO no lo juzga: mejor callar que inventar una falla.

- **Un degradé que termina en transparente SÍ se juzga.** Antes se
  salteaba cualquier degradé del árbol, y ahí se escondió un error grande:
  el panel de la prueba de cada servicio traía su propio degradé terminado
  en `transparent`, así que **todo su texto quedaba sin medir** — y ese
  panel cayó en la sección clara con la tinta de la parte negra, a
  **1,49:1**. Las cuatro líneas de "qué incluye", que son lo que el panel
  vino a mostrar, no estaban, y la suite daba verde. Ahora, si el degradé
  tiene una parada transparente, se saltea la CAPA y se sigue subiendo: en
  su punto más flojo el texto cae sobre el fondo del padre, y es ahí donde
  se tiene que leer. Lo que sigue sin juzgarse es una foto o un degradé
  opaco de punta a punta. Corolario para el CSS: **un bloque de texto con
  un fondo en degradé opaco es un bloque que la suite no puede medir**, o
  sea donde esto va a volver a pasar. Por eso el panel es negro y macizo.
  Con esa sola corrección el medidor pasó de 150 a 164 textos en la página
  pública y de 6 a 18 en el panel del muro.

- **Lo que nace `hidden` no se mide.** Los paneles de prueba y la pantalla
  con las cinco invitaciones juntas están cerrados al cargar, así que la
  suite no los veía: la página pública se mide **tres veces** —como
  carga, con las tres pruebas abiertas y con las cinco juntas abiertas—.
  Es la regla de la caja de 0x0 otra vez: antes de medir, que lo que se
  mide ESTÉ.

- **Y volvió a aparecer la de siempre, quinta vez**: el acento dorado de
  los títulos de las tarjetas —"digitales", "en vivo", "eterno"— es
  `--oro`, que sobre el crema da **1,84:1**. La palabra que remata cada
  título no estaba. Va en `--oro-hondo` (3,37:1, que para 26px es lo que
  pide la WCAG). *Si un bloque trae su propio fondo, trae su propia
  tinta* — y si una sección le cambia el fondo a un bloque que ya existía,
  es lo mismo al revés.

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
- **Un acento grave adentro de una plantilla la cierra, aunque esté en un
  comentario HTML.** Escribir `` `nuevo` `` dentro de un `<!-- … -->` que
  vive adentro de un template literal rompió `rollo.html` entero, con un
  "Unexpected identifier" que apuntaba a una línea que se leía perfecta.
  Los comentarios de adentro de una plantilla no llevan acentos graves.
- **Mirar que el cambio haya ENTRADO, no suponerlo.** Un script de edición
  se cortó a mitad por un `assert` y no escribió el archivo, así que la
  cabecera `x-activacion` nunca se editó — pero las otras dos ediciones de
  scripts posteriores sí, y todo *parecía* hecho. Lo agarró la prueba: el
  `POST` del alta salía con `x-clave` y sin `x-activacion`. Después de
  editar, un `grep` de lo que se acaba de poner.
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
- **Un dato de prueba que es el de un cliente deja de ser de prueba el
  día que ese cliente lo usa.** `pruebas/rsvp.js` comprobaba que se
  pueda ELEGIR la clave del listado, y como dato usaba el correo de
  verdad de la familia de una clienta. Era feo y no era grave. Pasó a
  ser grave el día que el dueño decidió que ESE correo fuera la clave
  de verdad de ese listado: quedó versionada en el repo la llave que
  abre la lista entera de invitados de esa fiesta, con sus nombres y
  sus comidas. Lo agarró un `git grep` al verificar lo publicado, no
  una prueba. Los datos de prueba se inventan
  (`clave.de.prueba@ejemplo.com`), aunque en el momento parezca que
  no importa.
  **Y sacarlo del archivo no lo saca del historial**: sigue estando
  en los commits viejos. Lo único que lo saca de verdad es cambiar la
  clave — que acá es justo lo que el dueño no quiere, y es otra forma
  de ver por qué un correo es una clave floja.
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
- **Un servidor que quedó de antes te deja fallas que parecen del
  producto.** `todo.sh` no levanta el suyo si ya hay algo escuchando el
  puerto —lo dice: *"ya había algo sirviendo (no lo toco)"*— así que reusa
  el que quedó de una corrida a mano. Si ese se cae en el medio, las suites
  que faltaban informan `ERR_CONNECTION_REFUSED` y parece que el producto
  se rompió: pasó con `rollo_hostil`, seis fallas seguidas que no existían.
  Antes de creerle a una corrida, mirar ese renglón: si dice "ya había algo
  sirviendo", matar todo (`pkill -f pruebas/servidor.py`) y correr de nuevo.
- **Lo que falla por el entorno no es una falla del producto.** Un proxy
  que firma los certificados hace que el navegador rechace el CDN y la
  prueba lo contaba como error del rollo. Todo lo que sea "no pude bajar un
  archivo" es ruido: lo que no se perdona es un error de JavaScript.
- **Un servidor de comparación que devuelve 404 da una base perfecta y
  falsa.** Para medir contra `main` se copió `index.html` a otra carpeta y
  se levantó un servidor ahí; faltaban archivos, contestaba **404**, y la
  medición dijo "main: 0 invisibles" — que no era un 0, era la página de
  error. Sobre esa base yo daba 65 fallas y parecía una regresión mía.
  Antes de creerle a una comparación: `curl -o /dev/null -w "%{http_code}"`
  al archivo que se está midiendo, y contar en el HTML servido los
  elementos que la prueba busca. Si el conteo da **cero**, no estás
  midiendo el código viejo: no estás midiendo nada. Es la regla de la caja
  de 0x0 otra vez, con un servidor en el medio.
- **Una prueba que falla igual contra el código de antes no mide tu
  cambio.** Es la regla de siempre, pero conviene decirla al revés:
  también hay que correr la prueba NUEVA contra `main` cuando falla, no
  solo cuando pasa. Las 18 fallas de la animación por scroll daban 20
  contra `main`: el problema estaba en cómo medía, no en la página.

## Las cabeceras y las librerías

`_headers` lleva la CSP y las demás cabeceras; las lee Cloudflare. Las
pruebas **se sirven con esas cabeceras puestas** (`pruebas/servidor.py`), así
que si la CSP bloquea algo que la app necesita, salta acá y no en la fiesta
de un cliente.

**`stale-while-revalidate` es "publicá, que no se va a ver".** El HTML iba
con `max-age=60, stale-while-revalidate=86400`, y el comentario decía que
así "nunca queda una versión vieja pegada". Dice lo contrario de lo que
hace: quiere decir *serví la copia vieja y andá a buscar la nueva por
atrás*, así que el que entra ve el HTML de hasta **veinticuatro horas**
antes y lo nuevo recién en la visita SIGUIENTE. Se publicó la invitación
de Mia con la foto de portada sacada y el texto corregido, el cliente
abrió el link que ya tenía, y vio **el texto viejo y dos cuadrados
rotos** — el HTML viejo pidiendo las fotos que ese mismo deploy había
borrado. Un `max-age` corto no sirve de nada si después se sirve lo viejo
igual. Quedó en `max-age=60` pelado: la segunda visita cuesta una
revalidación —un 304, sin cuerpo— y muestra lo que hay.
`pruebas/arranque.js` ya miraba que el HTML no fuera `immutable`, que es
la misma falla sin fecha de vencimiento, y no miraba ésta: ahora corta
arriba de 300 s. Contra el `_headers` anterior da 1 falla.

**Y la lección de arriba, dicha para cualquier publicación: borrar un
archivo que el HTML ya publicado nombra deja una imagen rota en todo el
que tenga ese HTML guardado.** No es lo mismo sacar una foto de la
invitación que borrarla del servidor; lo segundo se nota en el navegador
del cliente y no en el nuestro.

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

## Las piezas de video

No se publican (`video/` y `*.mp4` están en `.assetsignore` y en
`.gitignore`): se arman acá y se mandan por WhatsApp o se suben a redes.
Se rehacen con `bash video/armar.sh <cual>` y tardan uno o dos minutos.

| Qué | Archivo | Qué muestra |
|---|---|---|
| `rollo` | `rollo-eterno.mp4` | la cámara descartable, 25 s |
| `muro` | `muro-en-vivo.mp4` | el muro en vivo, 28 s |
| `invitaciones` | `invitaciones.mp4` | la invitación digital, 24 s |
| `reel` | `reel-invitaciones.mp4` | el reel con música, 15 s (ver `video/DECISIONES.md`) |
| `vivo` | `muro-vivo-comercial.mp4` | el comercial del muro, vertical, 26 s con música |

**Las pantallas no se dibujan: se capturan de la app de verdad.** Mostrar
una pantalla que no existe como si existiera es mentirle al cliente.
`capturar.js` recorre `pia/nueva` y `capturar-muro.js` recorre el muro
—montando una fiesta en el Supabase falso de las pruebas, igual que
`pruebas/tablero.js`—. Se sacan de nuevo en cada armado a propósito:
guardadas, el día que el muro cambie el video seguiría mostrando la
versión vieja y nadie se enteraría.

**El muro NO se captura de la demostración.** Ahí todo lo del organizador
—panel, evento, cartel— cae en la pantalla del salón a propósito, así que
de ahí no salen esas pantallas, y además arrastra la cinta de "la fiesta y
las fotos son inventadas", que en una pieza de venta no puede aparecer.

Tres cosas que costaron una vuelta cada una:

- **`#invitado` es la puerta donde se ESCRIBE el código**, no la pantalla
  donde el invitado elige la foto: ésa es `#subir/CODIGO`. La primera
  versión de la pieza mostraba un formulario de código donde tenía que
  mostrar el producto.
- **Un `ts` inventado se dibuja tal cual.** Con `ts: 1000` el panel decía
  *"hace 20738 d"* abajo de cada foto. Las fechas del falso se ponen
  relativas a `Date.now()`.
- **Un anillo dorado alrededor de un botón dorado no se ve.** El señalador
  (`senalar`) queda para lo que es chiquito y está sobre negro, como el
  "Aprobar" del panel; sobre el "Enviar a la pantalla", que ya es lo más
  grande de la captura, sólo ensucia. Y dónde cae el anillo **sale del
  DOM** (`cajas.json`, que mide `capturar-muro.js` y pega `montar.py` en
  `window.__CAJAS_MURO`), nunca de mirar la imagen: puesto a ojo señala
  cualquier cosa, y ya pasó en el de invitaciones.

**Las fotos que se ven adentro son las de `video/fotos/`**, una fiesta de
verdad. Esa carpeta está en `.gitignore` —fotos de gente no se versionan—
y si está vacía las dos escenas dibujan manchas de luz y la pieza se arma
igual, más fea. No confundirla con `demo/`, que sí se publica y es otra
cosa.

### El comercial del muro (`vivo`)

Pedido del dueño: una pieza **premium y de ritmo rápido**, vertical, para
Reels, TikTok y las pantallas de los salones, con las fotos **de verdad
que ya están en la demostración del sitio** — con todas las letras: *"no
las reemplaces por stock"*.

Son 26 s exactos (13 compases a 120 BPM) y el guion va en escenas con sus
tiempos escritos arriba en `escena-vivo.js`: negro total y un pulso, las
primeras fotos entrando de a una, la pantalla del invitado, la **captura
de verdad de la pantalla del salón**, el mosaico armándose, el riser, el
golpe —*"Tus momentos. En vivo."* y *"Todos comparten. Todos lo viven."*—
y la marca centrada con *"El muro en vivo de tu evento."* y el llamado
*"Vivilo en tiempo real."*

**El contenido son las diez fotos de `demo/`, no las de `video/fotos/`.**
Son dos conjuntos con dos permisos distintos y por eso viajan por dos
variables distintas (`window.__DEMO` y `window.__FOTOS`): `demo/` ya se
publica con el sitio y es lo que ve cualquiera que entre a "Probar la
demostración"; `video/fotos/` es una fiesta de un cliente y está en
`.gitignore`. Mezclarlas en una sola lista sería perder cuál es cuál, y
el día que una pieza de venta saliera con las fotos del cliente de al
lado nadie se enteraría hasta verla publicada.

Cuatro cosas que costaron una vuelta cada una:

- **El fantasma.** `fondo()` tenía la primera parada de su degradé en
  `rgba(42,33,24,.55)`: el centro de la pantalla **no se tapaba nunca**,
  así que cada cuadro se dibujaba encima del anterior y las fotos dejaban
  estelas. Todas las paradas van opacas, y `dibujar()` arranca
  devolviendo el contexto a cero (`setTransform`, `globalAlpha`,
  `globalCompositeOperation`, `filter`) y limpiando el lienzo: en una
  escena de cuatrocientas líneas alcanza con un `return` adentro de un
  `save()` sin su `restore()` para arrastrar un alfa al cuadro siguiente.
  Medido: **0 px de diferencia con el arreglo, 589.592 contra el código
  anterior.**
- **Y la primera medición del fantasma no medía el fantasma.** Contaba
  los píxeles donde domina el rojo y daba **el mismo número antes y
  después**, porque lo que contaba eran los corazones y el punto de EN
  VIVO. Se mide pintando el cuadro **solo** y después pintándolo
  **detrás del anterior**, y comparando los dos. Es la regla de siempre:
  una prueba que da igual de los dos lados no mide tu cambio.
- **Un cierre que crece mientras el cuadro se va a negro no se lee.** La
  cascada de la marca llegaba a opacidad plena a los 25,75 y la dirección
  a los 25,85, con el fundido de salida ya empezado a los 25,55: la
  bajada, el llamado y la dirección **nunca se veían enteros**. Ahora
  todo entra antes de los 25,55 y el fundido se acortó a 0,32 s.
- **La pieza se vende en Rosario, así que está en castellano.** La
  primera versión tenía los rótulos de la interfaz en inglés —`LIVE
  WALL`, `LIVE`, `EVENT`, `MEMORIES`, `NEW PHOTO`, `REAL TIME`— arriba
  de frases en castellano y de una captura de la app de verdad, que dice
  *"EN VIVO · 13 EN EL MURO"*. Eso no es un bilingüismo elegante: es la
  pieza contándole al cliente que el producto no es el que va a recibir.
  Y el servicio se llama **Muro en vivo**, no Live Wall.
- **El grano es ruido y el ruido no comprime.** Con el CRF 18 de las
  demás piezas el comercial salía de **21 MB** y WhatsApp —que es por
  donde se manda— no pasa de 16. El CRF se puede subir por pieza
  (`CRF=21` en el entorno de `render.js`); las otras cuatro se quedan en
  18, que es donde están medidas.

La música se sintetiza sin samples igual que la del reel
(`video/musica-vivo.py`) y **comparte las constantes de tiempo con la
escena**: el riser, el golpe y la marca caen en el mismo milisegundo en
los dos archivos. Si se mueve un tiempo, se mueve en los dos. La primera
versión daba 0,080 de RMS entre el segundo 4 y el 18 —o sea, plana justo
en el medio— y se arregló con una curva de forma (`forma()`) y aflojando
el compresor.

## El Apps Script de las invitaciones

La planilla de confirmaciones vive en Google, no acá, y **cada evento
necesita la suya**. Son dos archivos y no son lo mismo:

- **`apps-script/evento-nuevo.gs.txt`** · el script COMPLETO de una
  invitación nueva: el `doPost` (lo que escribe el formulario) y el
  `doGet` con sus dos puertas. Es el que se usa de ahora en adelante.
- **`apps-script/listado.gs.txt`** · solo el `doGet`. Es el parche para
  la planilla de **Pía**, que ya tiene su `doPost` andando y a la que
  únicamente hay que cambiarle quién puede LEER.

Dos puertas y ninguna abre de más: `?clave=` (la lista, para el
listado) y `?confirmado=NOMBRE` (sí o no, para la invitación). La clave
vive en las propiedades del proyecto, no en el código ni en ninguna
página: **una página pública no puede guardar un secreto.** El portón
anterior comparaba contra un correo escrito en el propio HTML.

**La clave la inventa la planilla, no una persona.** `preparar()` se
corre una vez desde el editor: escribe los títulos, genera la clave, la
guarda y la muestra. Pensada a mano termina siendo el nombre de la
fiesta y el año, y además ahorra el paso de ir a buscar el panel de
propiedades, que es donde se abandona el trámite.
Son **16 dígitos hexadecimales de dos uuid**, no un pedazo de un
base64: el principio de un base64 depende del principio del texto de
adentro, así que dos claves hechas igual arrancaban iguales — lo agarró
la prueba, que pedía que dos eventos no compartieran clave. Hexadecimal
además se dicta por teléfono sin pifiar: no tiene o ni l.

**Los campos del formulario son los títulos de las columnas**, y el
`doPost` crea la columna sola la primera vez que llega uno que no
conocía. Así cada invitación pregunta lo suyo sin tocar el script. Van
con candado (`LockService`): dos confirmaciones en el mismo segundo
—que es lo que pasa cuando se reparte el link por WhatsApp— leerían las
dos la misma última fila y una pisaría a la otra.

**Confirmar dos veces NO deja dos filas.** El que toca de nuevo porque
el wifi tardó y el que cambia el "no" por un "sí" son los dos casos que
pasan de verdad; con filas nuevas el cliente cuenta de más y encarga
comida para gente que no existe. Se le pisa la fila.

`apps-script/` va en `.assetsignore`: no se publica.

## La planilla central: una sola para todas las invitaciones

Pedido del dueño el 22/10/2026, en una línea que es una regla y no un
pedido: *"Hace la planilla. Siempre que hagas la tarjeta tenés que hacer
la planilla. No hace falta aclararlo."*

Tenía razón y lo que lo impedía estaba escrito en este mismo archivo:
cada invitación necesitaba **su propio** proyecto de Apps Script —
planilla nueva, pegar el código, correr `preparar()`, implementar,
copiar la dirección— y esos son seis pasos en la interfaz de Google que
**no se pueden hacer desde el chat**. Así que cada tarjeta nueva
terminaba publicada diciendo *"esto es una muestra"*, esperando a que
alguien hiciera los clics. Un pendiente que vuelve en cada trabajo no es
un pendiente: es un paso del proceso que está mal puesto.

**Ahora es UNA planilla con UNA pestaña por fiesta, y UN solo Apps
Script implementado.** Los seis clics se hacen **una vez en la vida**.
Después, agregar una invitación es:

1. un renglón en `lib/planillas.json` (qué fiestas pueden crear su
   pestaña), y
2. `CONFIG.evento` en la invitación, más su carpeta `<evento>/listado/`.

Cero pasos del lado de Google. Eso es lo que hacía falta para que "hacer
la tarjeta" incluya "hacer la planilla" sin que nadie lo pida.

**Qué NO se tocó**: las invitaciones que ya andan (`pia`, `mia15`) siguen
con su propio proyecto y su propio código, `evento-nuevo.gs.txt`. Andan,
tienen datos de clientes adentro y moverlas no le suma nada a nadie. El
archivo viejo se queda por eso, no de sobrante. El listado acepta las dos
formas: `appsScriptUrl` propio, o `evento` contra la central.

**La dirección vive en UN lugar** (`lib/planilla.js`) y la lista de
fiestas en OTRO (`lib/planillas.json`), sin un solo dato repetido entre
los dos: una la lee el navegador y la otra el Apps Script. Escrita la
dirección en cada invitación, el día que cambie quedarían la mitad
apuntando a una dirección muerta — y eso **no tira ningún error**: la
confirmación se manda, no llega, y la pantalla dice "listo".

Cinco cosas que esto obligó a pensar, y ninguna es un detalle:

- **Una dirección pública que crea una pestaña con el nombre que le
  manden es una planilla que cualquiera llena de basura.** La `/exec`
  está a la vista de cualquiera que abra el código de una invitación.
  Un tope por hora **no alcanza**: sólo hace que llenarla lleve unos
  días, y el que se queda sin poder crear su pestaña es un cliente con
  el salón lleno — es la lección de `rafaga.sql` otra vez, *ya pusimos
  un tope pensando en un atacante y le cortamos el brindis a una fiesta
  de verdad*. Lo único que no se puede agotar es una **lista**, y la
  lista vive donde mandamos nosotros: `lib/planillas.json`. Si el sitio
  no contesta, vale la última copia guardada; si nunca se pudo leer, no
  se crea nada. **Y una pestaña que ya existe recibe igual, pase lo que
  pase con la lista**: la lista sólo decide si se CREA.
- **El freno de intentos pasó a ser POR FIESTA.** Con una planilla por
  cliente, un freno global era el freno de ese cliente. Con una sola
  planilla para todos, un freno global es un desconocido dejando a
  **todos** los clientes afuera de su listado con doce intentos
  fallados. Mismo código, significado opuesto, sólo porque cambió lo
  que hay del otro lado.
- **La clave guardada del listado iba atada a la DIRECCIÓN**, y con la
  central la dirección es la misma para todos: volvía exactamente el bug
  que ya está escrito más arriba —el segundo listado que abrís en el
  mismo aparato arranca mandando la clave del primero y te dice "esa
  clave no es" sin que hayas escrito nada—. Va atada al **evento**.
- **La clave de cada cliente se lee sin entrar al editor.** Abriendo su
  listado con la clave maestra, la respuesta la trae escrita. Con la
  clave del evento no viene: ahí ya la tiene quien pregunta. Sin esto,
  "pasarle la clave al cliente" habría sido otro paso a mano por
  invitación, o sea el mismo problema con otra cara.
- **El permiso de "servicio externo" se pide en `preparar()`**, a
  propósito. Pedido la primera vez que se usa, se pediría la noche de
  una fiesta, cuando no hay nadie para aceptarlo — y la confirmación se
  pierde.

Lo mide `pruebas/rsvp.js`, que corre el `.gs.txt` de verdad contra una
planilla de mentira con varias pestañas. Lo que mide no es que guarde una
fila —eso ya estaba medido— sino **lo único que trae tener a todos los
clientes en el mismo archivo: que no se mezclen**. Una fuga ahí no tira
ningún error: se ve como un listado perfecto con la gente de otra fiesta.
Verificado rompiendo a propósito: freno global en vez de por fiesta da
**1 falla**, sacar la lista da **5**, y una sola pestaña para todos
—la fuga— da **5**, entre ellas *"el listado de una fiesta trae SOLO su
gente"* y *"en la fiesta de al lado NO figura"*.
Y `pruebas/invitaciones.js` cruza los dos archivos: una fiesta en la
lista sin carpeta, o un listado que pide una pestaña que no está
habilitada, no traerían nada.

**La clave de un cliente que la elige él va en `CLAVES_ELEGIDAS`**, un
renglón por fiesta, en la copia del editor y nunca en el repositorio —
igual que `CLAVE_ELEGIDA` de antes. Para `almi15` es el correo que
mandó la clienta, que es la misma excepción ya escrita para `mia15` y
por el mismo motivo: lo pidió el cliente, se le dijo el riesgo y lo
sostuvo.
**Se mira en `claveDe_` y no en `preparar()`**, y eso no es un detalle:
escrita en el editor pero sin volver a correr `preparar()`, la planilla
seguiría esperando la inventada y la clave que le pasamos al cliente no
abriría — sin un solo error a la vista, sólo un cliente diciendo *"me
dice que la clave no es"*. El precio es que cambiarla pide volver a
implementar, porque es código y no un dato guardado.
**Y la comparación perdona espacios y mayúsculas.** Hace falta
justamente cuando la clave es un CORREO: el que la escribe en un
iPhone se come una mayúscula del autocompletado o un espacio al pegar,
y le diría "clave incorrecta" teniéndola bien. A una clave inventada
por la planilla —toda minúscula— no le cambia nada.
Verificado rompiendo a propósito: ignorar la elegida da **4 fallas** y
comparar sin perdonar mayúsculas da **1**.

**IMPLEMENTADA el 23/10/2026.** El dueño hizo los seis clics, la
dirección `/exec` está en `lib/planilla.js` y `almi15/listado/` existe.
De acá en adelante una invitación nueva sale con su planilla y su
tablero sin un solo paso del lado de Google.

**Y el día que se conectó aparecieron dos cosas que nadie había
medido**, las dos porque hasta entonces TODAS las invitaciones nuevas
estaban sin planilla y esa mitad vivía sin una comprobación:

- **El camino bueno de la confirmación.** Con planilla puesta se mide
  que se mande, que diga "listo" cuando la planilla contestó que
  entró, que vaya en UN viaje y que el POST lleve de qué fiesta es.
  **Y el camino del TELÉFONO aparte**, forzándolo: cuando el navegador
  no deja leer la respuesta, la invitación manda a ciegas y después
  PREGUNTA — y esa pregunta tiene que decir `evento=`, o con la
  planilla central contestaría por otra fiesta y le diría al invitado
  que no llegó teniendo la confirmación guardada. Ese camino no se
  recorre nunca en el flujo rápido, así que hay que provocarlo.
- **Una plantilla de listado sin llenar pasó a mentir.** Antes, sin
  `appsScriptUrl`, decía "falta configurar". Con la central puesta ya
  hay dirección, así que preguntaba sin decir de qué fiesta, la
  planilla contestaba `sin_evento` y la pantalla lo leía como un error
  cualquiera: **"clave incorrecta"** a quien tiene la clave bien — y
  el que lo puede arreglar es el que publicó la página, no él. Es la
  misma lección ya escrita (*"falta llenar el CONFIG" y "se cortó
  internet" no son lo mismo*), que volvió por una puerta nueva. Lo
  agarró `pruebas/listado.js`, que ya la cuidaba.

**Y la primera versión de la comprobación nueva no medía nada.**
Preguntaba si `CONFIG.evento` estaba puesto, así que vaciarlo se leía
como *"esta invitación tiene su propia planilla"* y la suite daba
verde con la confirmación muerta. Se pregunta por la DIRECCIÓN: si la
que usa es la central, `evento` es obligatorio. Verificado rompiendo a
propósito — vaciarlo da **1 falla**; con la versión anterior daba
cero.

#### Y la maestra no abría, con la maestra bien puesta

El dueño pegó el código, puso la clave maestra, implementó, y en el
listado le decía **"clave incorrecta"**. La clave estaba perfecta.

La maestra vivía **sólo en las propiedades del proyecto**, y ahí la
escribe `preparar()`, que es un paso aparte. Escrita en el editor pero
sin volver a correr `preparar()`, la puerta seguía sin aceptarla — y
del otro lado lo único que se ve es "clave incorrecta". **Es la misma
trampa que ya estaba escrita y resuelta tres párrafos más arriba para
la clave que elige un cliente** (*"se mira en `claveDe_` y no en
`preparar()`"*): estaba aplicada a la mitad de las claves. Ahora la
maestra se lee igual, con `maestraPuesta_()`, y la escrita en el
código **gana**, así que cambiarla deja de valer la vieja en el
momento.

La lección, que es la de siempre vista de otro lado: **un paso de
instalación que no se puede saltear sin que algo avise, se va a
saltear.** Lo mide `pruebas/rsvp.js` corriendo el `.gs.txt` de verdad
— contra el código anterior da **5 fallas**.

#### Y después entró al listado, y la fila igual no aparecía

La otra mitad del mismo reporte, y es peor: con la maestra ya
andando —o sea con el script respondiendo bien— **el invitado
confirmaba y en la planilla no quedaba nada**. Sin un solo error a la
vista: el que confirma ve que no se pudo, y del otro lado hay una
planilla vacía.

La causa es de diseño. La lista de fiestas habilitadas vivía **sólo en
el sitio** (`lib/planillas.json`), y era lo ÚNICO que permitía crear
una pestaña nueva. O sea que una lectura HTTP a un servidor nuestro
estaba en el **camino crítico de lo único que esta planilla hace**: si
no se podía leer —el permiso de "servicio externo" sin dar, el sitio
lento, un 404— la confirmación no entraba. Y la decisión escrita
("mejor que no entre una confirmación a que entre cualquiera") estaba
tomada pensando en un atacante llenando la planilla de pestañas
basura, no en el caso que de verdad pasó: **la fiesta del cliente que
ya está habilitada, perdiendo confirmaciones por un problema
nuestro.** Es la lección de `rafaga.sql` otra vez, en otro archivo:
*ya pusimos un tope pensando en un atacante y le cortamos el brindis a
una fiesta de verdad.*

Ahora son **dos listas y valen las dos juntas**: la del sitio, que es
la que hace que una invitación nueva no cueste un paso del lado de
Google, y `EVENTOS_EN_EL_CODIGO`, un **piso** escrito adentro del Apps
Script que no depende de nada. No afloja nada: lo escrito en el código
también es una lista que decidimos nosotros. Lo que sigue sin entrar
es una fiesta que no está en ninguna de las dos.

**El piso puede quedarse corto, pero nunca ser más ancho.** Una fiesta
nueva va en `lib/planillas.json` y nada más; el piso cubre las que ya
existían cuando se pegó el código. `pruebas/invitaciones.js` falla si
el Apps Script habilita algo que la lista de verdad no.

**Y `preparar()` dice si leyó el sitio, aunque el piso salve la
noche.** Si la lista no se lee, una fiesta NUEVA sigue sin poder crear
su pestaña, y eso no se descubre hasta que un cliente avisa que su
fila falta. Por eso no devuelve "listo" en ese caso aunque las fiestas
del código funcionen: un informe que dice "listo" cuando la mitad no
anda es la mentira de siempre.

Contra el código anterior, `pruebas/rsvp.js` da **2 fallas** y
`pruebas/invitaciones.js` **1**.

#### Y después estaban guardadas, y no se encontraban

Lo siguiente que pasó la misma noche: **el listado mostraba dos
confirmaciones y en la planilla no estaban.** Es imposible, y por eso
la respuesta es tranquilizadora: el listado lee de la planilla y de
ningún otro lado —no guarda nada, pide con `cache:'no-store'`— así que
si muestra filas, las filas están ahí. Lo que pasaba es que **cada
fiesta es una PESTAÑA** de un solo libro, y se estaba mirando otra.

Es la primera vez que eso puede pasar, y es una consecuencia directa
de la planilla central: antes cada cliente tenía su archivo y el
archivo que se abría era el archivo. Ahora hay que saber **cuál
pestaña y cuál archivo**, y eso no estaba escrito en ninguna pantalla.

Se arregla donde se mira: con la clave maestra, el Apps Script
devuelve además **dónde está la planilla**, con el enlace parado en la
pestaña de esa fiesta (`getUrl()` + `#gid=`), y el listado dibuja un
**"Abrir la planilla"** al lado de "Descargar Excel". **Con la clave
del cliente no viene y el enlace no se dibuja**: él no puede abrir el
archivo, así que ahí sería un enlace muerto. Y `preparar()` escribe en
su registro el nombre y la dirección del libro en el que escribe —y si
el script no está adentro de ninguna planilla, lo dice en vez de
fallar callado.

Lo mide `pruebas/rsvp.js` (que el enlace venga con la maestra, que
apunte a la pestaña y que al cliente NO se le mande) y
`pruebas/listado.js` (que el enlace se vea, que llegue a 44px y que
sin ese dato no exista). Contra lo publicado dan **2** y **1**.

**Y hubo que enseñarle dos métodos al falso** —`getUrl` del libro y
`getSheetId` de la hoja—: un falso al que le falta un método de los de
verdad no mide el código, mide al falso.

**Y además lo DICE en palabras, que es lo que sirve cuando el enlace no
está.** El enlace sólo aparece con el Apps Script nuevo pegado, y eso es
un paso del lado de Google; la frase no necesita nada. Entrando con la
maestra, el listado escribe *"estas filas están guardadas en la pestaña
**almi15** de la planilla de confirmaciones. Cada fiesta tiene su propia
pestaña: en las otras no aparecen."* Con la clave del cliente no se
dibuja: el nombre de una pestaña de un archivo que no puede abrir es
ruido.

**Y la primera versión de esa prueba no medía nada**: leía el texto con
`innerText` y daba verde con el bloque `hidden`. **El `innerText` de un
elemento que NO se está dibujando devuelve el `textContent` igual** —lo
dice la especificación—, así que leer el texto no dice si se VE. Medido:
con `hidden` puesto a propósito, la comprobación pasaba. Se pregunta
`isVisible()` primero. Es la caja de 0x0 otra vez, disfrazada de leer un
texto.

### El listado: cómo lee el cliente quiénes confirmaron

`clicketerno.com.ar/<evento>/listado`. Escribe una clave —la que generó
`preparar()`— y ve los tres números (en total · confirmados · no
asisten), la tabla y **"Descargar Excel"**, que es para lo que de
verdad entra: armar las mesas. La clave se guarda en ese aparato, así
que la escribe una sola vez.

**Es una sola plantilla** (`invitaciones/plantilla-listado/index.html`)
y cada evento es una copia con su `CONFIG` —dos líneas— y nada más.
`pruebas/invitaciones.js` falla si alguna copia se separó: dos
versiones de la misma pantalla es una que se queda atrás, y la que se
queda atrás es la del cliente que ya pagó.

Cuatro cosas que esto costó, y **ninguna tiraba un error**:

- **Las columnas estaban escritas a mano**, y eran las del formulario
  de Pía (`Persona 1 - Nombre`, `¿Confirma?`, `Canción pedida`…). Con
  cualquier otra invitación la tabla salía con **todas las filas
  vacías**: las seis filas ahí, cada celda en blanco, y la consola
  limpia. Ahora las columnas salen de los datos que manda la planilla,
  que es la única lista que no miente.
- **El resumen lo cuenta la PLANILLA, no la página.** Contado de los
  dos lados, el día que una columna se llame distinto el listado dice
  "0 confirmaron" con la planilla llena. El `doGet` manda el resumen
  ya hecho y de paso dice con qué columnas contó.
- **Y cuando hay que adivinar la columna, se adivina por palabra
  entera.** Con el Apps Script viejo no hay quién diga los nombres, así
  que se busca. Buscando por "contiene", `confirma` matcheaba primero
  **"Fecha y hora de la confirmaCIÓN"** —la del reloj— y el sí/no se
  pintaba contra una fecha: cero confirmados, todo verde apagado,
  ningún error. Se saca el acento y la puntuación y se compara palabra
  por palabra, así "¿Confirma?" cuenta y "confirmación" no.
- **Una columna vacía en todas las filas se muestra apagada.** Un
  formulario que admite cinco acompañantes trae veinte columnas que no
  llenó nadie, y con todas puestas la tabla no se lee.

**La clave guardada va por evento.** Era una sola (`ce:listado:clave`)
para todos: con dos eventos, el segundo listado que abrís en el mismo
aparato arranca mandando la clave del primero y te dice "esa clave no
es" sin que hayas escrito nada.

**"Falta llenar el CONFIG" y "se cortó internet" no son lo mismo.** Las
dos terminan sin datos, pero una la arregla quien publicó la página y
la otra se arregla sola. Una plantilla copiada y sin llenar decía "no
se pudo conectar con la planilla", echándole la culpa a la conexión.

Lo mide todo `pruebas/listado.js` (la pantalla, con el Apps Script
reemplazado por interceptación) y `pruebas/rsvp.js` (el Apps Script,
corrido en un `vm` con una planilla de mentira). Contra el código
anterior el primero da **8 fallas**.

**`rsvp.js` corre el .gs.txt de verdad, sin Google.** Ese código vive
en los servidores de Google y el que lo estrena es el invitado la noche
de la fiesta: no hay ninguna pantalla donde mirarlo, llega un "no anda"
al otro día con la planilla ya sucia. Así que se le arma una planilla
falsa con las cinco cosas que usa de `SpreadsheetApp` y se lo ataca
como lo haría una fiesta. Está verificada rompiendo a propósito cada
decisión: agregar fila en vez de pisar → 4 fallas, que "no voy" cuente
como sí → 2, la hora en UTC → 2, que la puerta del invitado devuelva la
lista → 2, que no pida la clave → 3.

**Y el reloj de la prueba va DENTRO del `vm`.** Pisar el `Date` de
afuera no toca el del contexto, así que la comprobación de que la hora
es la de Rosario pasaba midiendo la hora de hoy. Es la regla de la caja
de 0x0 otra vez: antes de medir, comprobar que lo que se mide ESTÉ.

**Lo que NO se puede hacer desde acá.** Crear el proyecto, correr
`preparar()` y publicar la implementación son tres pasos en la interfaz
de Apps Script. No hay conector de Google autorizado en esta sesión, y
aunque lo hubiera, el de Drive no despliega una aplicación web: eso es
la API de Apps Script, que hay que habilitar aparte y con su propio
OAuth. Sale más caro de configurar que los seis clics. Lo que sí se
hace desde acá es que esos clics sean los menos posibles y que el
código llegue medido.

## La app andando adentro de la web

**Es la presentación, y va arriba de todo**: decisión del dueño. Lo primero
que ve el que entra, apenas pasa la portada, son los tres servicios
FUNCIONANDO —no una lista de lo que hacemos—. El menú la nombra "Probala" y
es su primer renglón; la flecha "Deslizá" de la portada apunta ahí.
`pruebas/movil.js` falla si esa sección se vuelve a ir abajo.

`index.html` tiene el apartado **`#app`**, que son las tres tarjetas de
servicio y, debajo de cada una, su panel con el producto corriendo de
verdad en un marco, no una captura. Reusa la misma maquinaria que la
galería de Trabajos (`.vivo`, con `IntersectionObserver` y un dibujo de
reserva debajo por si el marco no carga); `data-ancho` dice a qué ancho se
dibuja adentro (1200 la pantalla del salón, 390 el celular) en vez de estar
clavado en 390.

**Antes eran DOS apartados y mostraban lo mismo.** `#app` era una vitrina
—una notebook con el muro y dos celulares— y `#servicios` eran las
tarjetas con sus paneles: los **mismos tres marcos cargando las mismas
tres direcciones**, a 1,7 pantallas de distancia. El visitante veía el muro
proyectándose, bajaba, y lo veía otra vez. Es exactamente lo que ya costó
caro en la vitrina: en 4G seis marcos se estorban entre ellos. Se fundieron
en uno: **la tarjeta es la vitrina y el panel es la prueba**. Medido:
15,1 → **13,8 pantallas** y 1015 → **923 palabras**. El id `app` se quedó
puesto porque lo usan la flecha de la portada, el menú ("Probala") y
`pruebas/demo.js`; `servicios` pasó a ser el id de la grilla de tarjetas,
y el menú dejó de nombrarlo dos veces.

**Y la tarjeta trae su propia tinta.** `#app` es `class="clara"`, así que
hereda `color:#1A1713`; la tarjeta tiene fondo oscuro. Es la regla de
siempre —*si un bloque trae su propio fondo, trae su propia tinta*, cuarta
vez— y por eso están `.clara .serv`, `.clara .serv p`, `.clara .serv .chip`,
`.clara .serv .etiq`, `.clara .serv .mas` y `.clara .serv .flecha`.

Las apps entienden **`?marco=1`**: sin cinta de demostración y sin los
botones de la pantalla del salón. Es una vidriera, no algo para tocar: se
toca y se abre la demostración de verdad en otra pestaña.

**Y con `?marco=1` la pantalla del salón arranca en el TABLERO.** En una
fiesta arranca en el cartel del código, que es lo primero que hace falta;
adentro de una notebook dibujada eso es un QR gigante que no dice nada de
lo que hace el producto —y que encima nadie puede escanear desde una
maqueta—. Lo que vende es el tablero: la foto grande, las que vienen, el
contador y el QR chiquito, todo junto. **Esto no se puede medir con la
demostración**: ahí la sala ya arrancaba en el muro, así que el QR no
aparecía y una prueba contra `?demo=1` pasaba con el código viejo también.
`pruebas/tablero.js` lo mide con una fiesta de verdad servida por el
Supabase falso.

El marco de la prueba del muro (`#pr-muro .vivo`) proyecta el evento de
verdad que diga `MUESTRA_MURO` en `index.html`; con la constante vacía cae
en la demostración. **Ese código no se lee desde la prueba**: si la prueba
mirara la constante publicada, fallaría el día que el negocio cambie de
fiesta de muestra — `pruebas/puertas.js` fuerza las dos ramas
interceptando el HTML. **El TOQUE sigue abriendo la demostración**, no la
fiesta de verdad: en una fiesta real no hay nada que probar y a pantalla
completa expondría las fotos de invitados reales bastante más que un marco
chico.

**Y el texto del panel dice cuál de las dos está mirando.** Por defecto
avisa que la fiesta y las fotos son inventadas; con `MUESTRA_MURO` puesto
lo reemplaza por "es una fiesta nuestra proyectándose ahora mismo". Las
dos mitades están medidas: decir "inventada" arriba de una fiesta de
verdad es mentir, y no decirlo arriba de la demostración es lo mismo al
revés.

**Ese párrafo se agarra por `id` (`#txtMuroPrueba`), no por
`.pr-texto>p`.** El rótulo de arriba ("Andando ahora mismo") también es un
`<p>` hijo directo de `.pr-texto`, y es el PRIMERO: con ese selector el
reemplazo le cambiaba el texto al rótulo y dejaba el párrafo intacto, así
que arriba de una fiesta de verdad seguía diciendo "inventada" y el rótulo
decía cualquier cosa. Y la prueba miraba el mismo selector equivocado, o
sea que medía el rótulo y daba verde: **los dos lados tenían que estar
mal igual para que no se viera.**

Ahí NO se mide cuánto recorta la foto: es una pantalla apaisada y `cover`
recorta a propósito, igual que el proyector —medido, 43% en 1920x1080 y 52%
en el marco—, así que exigirle más al marco que a la pantalla que está
mostrando es inventar una falla.

El muro y el rollo tienen su lista de **qué incluye** (`.incluye tres`),
igual que las invitaciones. **Sin precios**, por decisión del dueño: el
presupuesto se cierra hablando.

### Las letras, y por qué se cambiaron

**Una sola familia en todo: Hanken Grotesk**, y la jerarquía la hace el
PESO, no la fuente. Los títulos en 800 con el interletrado cerrado
(`-.035em`), el texto en 300. Antes eran **Bodoni Moda + Jost**, y el
cambio no es de gusto:

- La **Bodoni es una didone**: el contraste entre el trazo grueso y el
  fino es enorme a propósito. En un cartel es preciosa; en un teléfono a
  15px los finos **se parten**. El dueño lo dijo mirando el muestrario:
  *"como que desaparecen"*.
- La **Jost tiene la equis baja** (es una geométrica tipo Futura), así que
  el texto chico parece más chico de lo que es.
- **Hanken Grotesk tiene la equis alta** y bastardilla de verdad.

En el medio hubo una vuelta por **Gloock** para los títulos, que el dueño
aprobó y después descartó: *"a mí me gusta eso para todo, que sea canchero
está bueno"*, mirando el mockup del rollo en grotesca gruesa. Gloock además
**no tiene bastardilla** y la marca la usa en todos lados ("en *vivo*",
"*digitales*"): pedirla igual hace que el navegador invente una oblicua
torcida. Hanken Grotesk la tiene de fábrica, así que el acento vuelve a ser
el oro **y** la cursiva. Donde hace falta una cursiva de otro género —el
nombre dibujado adentro de los celulares de Trabajos, que es el diseño de
OTRA marca, no la nuestra— va una del sistema (Georgia).

**El peso que se pide en el link tiene que ser el que usa el CSS.** Se
piden 300/400/500/600/700/800 y las dos bastardillas; un `font-weight` que
no esté pedido se lo inventa el navegador y eso no avisa.

**Las apps siguen en Bodoni.** `muro.html` y `rollo.html` no se tocaron:
ahí la letra la ve un invitado tres segundos en una pantalla, no alguien
leyendo una página de venta, y cambiarlas toca las pruebas que cuidan que
las dedicatorias vayan en Poppins. Si alguna vez se unifican, es una
pasada aparte.

### Los servicios son tarjetas, y la tarjeta ABRE la prueba

Dos cosas que pidió el dueño el 12/10/2026, mirando la página en su
iPhone. La segunda la dijo con todas las letras: *"me gustaría que cada
servicio en donde dice ver más se abra y ahí esté la prueba del servicio.
**Es lo más importante**"*.

**La forma**, de una referencia de Behance que él eligió (*"en tarjeta,
que mejor que como está hoy"*): radio grande (26px), el ícono adentro de
un círculo, aire entre el ícono y el título, y una flecha circular. De la
referencia **no se toma el ícono SOLO**: es una agencia de marketing y no
tiene nada que mostrar, por eso dibuja un ícono. Nosotros tenemos la
captura del producto andando, que es lo que vende; el círculo quedó de
insignia montada sobre el borde de la foto.

**El fondo**: hasta acá "Ver más" bajaba a un bloque de TEXTO. El que
llega de un anuncio quiere ver el producto, no leer sobre él. Ahora la
tarjeta abre, ahí mismo, un panel con **el servicio andando de verdad**:
la pantalla del salón proyectando, el álbum del rollo revelado, y la
invitación de Pía. Abajo, cuatro renglones de qué incluye, "Probarlo
entero" (que abre el visor, donde SÍ se toca) y "Pedir presupuesto".

Tres cosas que no son adorno:

- **El marco se enciende al abrir y se APAGA al cerrar.** Tres marcos más
  en la carga inicial es exactamente lo que ya costó caro en la vitrina:
  en 4G se estorban entre ellos y no termina de cargar ninguno. Y un muro
  demostración latiendo cada siete segundos abajo de un panel cerrado es
  la visita entera pagando algo que nadie mira. Para prenderlo tarde, el
  IIFE de los marcos exporta `prenderVivo` y saltea los `.vivo[data-tarde]`.
- **El `href` sigue apuntando a la sección de texto.** Si el JavaScript no
  corre, la tarjeta lleva igual a algún lado en vez de no hacer nada. Es
  la misma razón por la que los botones de producto apuntan a `#contacto`.
- **El panel ocupa la fila entera** (`grid-column:1/-1`), así que en
  escritorio se abre debajo de las tres tarjetas y en un teléfono —una
  columna— queda pegado a la suya. Y al abrirse se trae la pantalla hasta
  él: abierto abajo del borde, no pasa nada a la vista.

Lo mide `pruebas/servicios.js`. Contra el código anterior da **9 fallas**.

### El carrusel que se veía cortado y no se movía

El mismo reporte, la primera mitad: *"esto se ve cortado y no se mueven
para las otras invitaciones"*. Eran **dos** fallas que se tapaban entre sí
y las dos se ven perfectas en un escritorio:

- **El carrusel medía 342px en una pantalla de 390.** La regla base le
  pone `width:100%`, que es el 100% del `.wrap` **ya descontado su
  padding**; con los márgenes negativos encima, la galería arrancaba en 0
  pero terminaba a 48px del borde derecho, y la tarjeta siguiente se
  cortaba contra un borde invisible. Se arregla con `width:auto` en el
  bloque del carrusel. Un número que depende del padding de otro no se
  escribe dos veces.
- **Y deslizar ABRÍA la invitación a pantalla completa.** El dedo arranca
  arriba de una tarjeta, que tiene su `click`: el que intentaba pasar a la
  siguiente se comía el visor. Desde afuera eso es exactamente *"no se
  mueve"*. Ahora un movimiento de más de 8px —o un `pointercancel`, que es
  lo que manda el navegador cuando se queda con el gesto para scrollear—
  cancela el toque.

**Y seguía cortada, pero por el otro lado: por abajo.** Arreglado el ancho,
la tarjeta pasó a medir **633px** y el dueño volvió a decir lo mismo: *"está
queda cortada"*. En un iPhone la barra del navegador se come unos 145, así
que la pantalla útil no es 844 sino ~700: el nombre de la fiesta quedaba
debajo del borde y se veía medio teléfono.

**El ancho de una tarjeta de celular no se elige por el ancho.** La pantalla
es 9/19.5, así que cada píxel de ancho son **2,17 de alto**: poner un
porcentaje del ancho es decidir el alto sin mirarlo. Ahora el ancho sale del
alto disponible —`min(78%, calc((78svh - 56px) / 2.17))`— y el 78% del ancho
queda de techo, así que en una pantalla alta no cambia nada.

**`svh` y no `vh`**: `vh` en un iPhone es la pantalla **con las barras
escondidas**, que es justo el caso que no hay que medir. El `vh` va de
respaldo para quien no tenga `svh`.

Lo mide `pruebas/largo.js` **a 700 y a 667** (un iPhone SE), no a 844: a 844
la falla no existe y la prueba habría pasado con el código roto.

Se le sumaron **los puntitos**: un carrusel sin nada que diga cuántos hay
parece una tarjeta recortada. Son tocables (44px de área con `padding` y
`background-clip:content-box`, sin agrandar el punto) y solo existen abajo
de 640px. Ojo con dónde se escribe su `display:flex`: metido adentro del
`@media` de arriba lo pisaba el `display:none` de la regla base, que viene
después y tiene la misma especificidad. Dos reglas para lo mismo, gana la
última — por tercera vez en este archivo.

### Lo que se mueve, y por qué eso

Se eligieron de un muestrario con doce animaciones andando; el dueño pidió
tres. **Las tres funcionan en el iPhone**, que es donde cae el tráfico
pago: nada depende de `animation-timeline`, que Safari recién trae en
versiones nuevas.

- **La barra se esconde al bajar y vuelve al subir** (`nav.oculta`). Nunca
  arriba de todo, donde no estorba, y **nunca con el menú abierto**, que
  tiene adentro el botón de cerrar.
- **Lo que se toca se hunde** (`:active` con `scale(.975)`). En un teléfono
  el `:hover` no existe: hasta acá tocar un botón no devolvía nada, y con
  mala señal el que consulta toca tres veces. Va con `!important` porque
  varios `:hover` también mueven el `transform` y, al soltar el dedo,
  ganaba el otro. De paso se anula el hover pegado en `@media(hover:none)`.
- ~~**La cinta de abajo acelera con el scroll.**~~ **Sacada** (12/10/2026),
  y la había elegido él del muestrario. En el teléfono quedaba al revés de
  lo que promete: bajando se apura, pero **subiendo el empujón va CONTRA
  la animación** y la cinta se queda clavada o retrocede 12px. Eso no se
  lee como un efecto, se lee como que se colgó: *"el texto que pase que no
  se frene… queda horrible, que quede como estaba antes, que se iba
  pasando despacio"*. Vuelve a ser un solo bucle de 42s, siempre a la
  misma velocidad. De paso se fue un `requestAnimationFrame` que corría
  para siempre a 60 cuadros por segundo aunque el empujón valiera cero.
  Lo mide `pruebas/largo.js`: mide la **caja de verdad** de `.pista` —el
  bucle vive ahí y el empujón vivía en su padre, así que mirar el
  `transform` de la pista sola no mostraría nada— mientras scrollea hacia
  arriba, y falla si retrocede. Contra el código anterior da 2 fallas.
  La lección, que ya está escrita más arriba de otra forma: **una
  animación elegida mirando un muestrario en un escritorio puede salir
  distinta en un teléfono**, y acá lo que cambia no es cuánto se ve sino
  en qué dirección va.

**Todo lo que depende del scroll pasa por un solo oyente** con
`requestAnimationFrame`: tres oyentes sueltos corriendo en cada píxel es
lo que hace que una página se sienta pesada en un teléfono.

### Que la página se lea en un teléfono

Lo que se arregló cuando el dueño dijo *"mucho texto que no es legible ni
a palos"*, medido antes y después: **17,5 → 15,4 pantallas** y **1240 →
973 palabras**.

- **El párrafo de "qué incluye" estaba en 12px** gris, en dos columnas de
  144px. En el teléfono ahora va **una sola columna en renglones**, con la
  estrella al costado del título en vez de arriba: 17px el título, 15px el
  texto. Se puede porque además cada tarjeta dice **una línea**, y de
  veinte quedaron catorce. `pruebas/largo.js` dejó de exigir dos columnas
  —era la cuenta vieja— y ahora mide el tamaño de la letra, que es lo que
  importaba.
- **Las tres tarjetas de servicio mostraban dibujos hechos con CSS** —un
  sobre, una pila, una tira de película— que se animaban **sólo con
  `:hover`**. En un teléfono el hover no existe: eran tres rectángulos
  marrones quietos, y por eso se leían como una maqueta sin terminar.
  Ahora son **capturas de la app andando**, en `muestra/`.
- **En el teléfono los dos celulares de la vitrina van uno al lado del
  otro.** Apilados, los tres aparatos se llevaban 2,4 pantallas de scroll
  para mostrar lo mismo.

**`muestra/` son tres capturas del producto** (1040x585, 188 KB en total),
sacadas a mano y versionadas. La del rollo se saca con **`?demo=1&marco=1`**:
sin `marco=1` sale la cinta de "la fiesta y las fotos son inventadas"
arriba de todo, que en la página de venta no puede aparecer. `muestra`
quedó en la lista de nombres reservados.

Y tres cosas que se veían mal y no daban ningún error: la **burbuja de
WhatsApp tapaba** el botón "Todo lo que hacemos" de la portada (ahora
aparece recién pasada la primera pantalla, y **entra con un desplazamiento
y no con una escala**, porque escalada mide 32px y la prueba del mínimo de
44 la agarra, con razón); la **barra fija cortaba el título** de la
sección al saltar desde el menú (`scroll-margin-top`); y el **logo se veía
dos veces** arriba de todo, el de la barra encima del de la portada.

### Por qué sólo compraban invitaciones

Medido sobre la página, no opinado. El muro y el rollo estaban bien
explicados y **no los compraba nadie**, y el motivo no era el texto: era
que la página los escondía.

- **El menú no los nombraba.** Decía Probala · Servicios · *Invitaciones*
  · Trabajos · Preguntas · Ya contraté. Dos de los tres productos no
  estaban, y el tercero sí. El que entra y mira arriba entiende que lo que
  se vende son invitaciones.
- **Las secciones del muro y del rollo no tenían botón de comprar.**
  Terminaban en "Probar la demostración" y "Ya contraté · entrar": una es
  para el que no pagó y la otra para el que ya pagó. El único botón de
  compra de toda la página era el del menú, y era genérico.
- **El WhatsApp mandaba siempre el mismo mensaje.** No decía qué producto,
  así que del otro lado no se sabía qué pedían y el que escribía no había
  elegido nada — y elegir es la mitad de comprar.
- **Trabajos partía el bloque de productos** (invitaciones → trabajos →
  muro → rollo) y Trabajos muestra SOLO invitaciones: justo antes de
  presentar los otros dos, la página volvía al primero.
- **El combo no existía como oferta.** "Cada pieza va sola o las tres
  juntas" estaba escrito una vez, arriba, y no se volvía a mencionar. Un
  combo sin botón propio no es una oferta: es una aclaración.

Ahora el menú nombra los tres, cada producto cierra con el **mismo par de
botones** —el dorado de presupuesto primero, la demostración al lado—,
cada uno con **su** mensaje de WhatsApp prellenado, Trabajos quedó después
del rollo y hay una sección **`#combo`** con la línea antes / durante /
después. Los cuatro botones y el de contacto salen del **mismo camino**
(`[data-wsp]`): el de contacto estaba escrito aparte y por eso se había
quedado sin `rel="noopener"` sin que nadie lo notara.

En el HTML los botones de producto apuntan a `#contacto` **a propósito**:
si el JavaScript no corre, el botón sigue llevando a algún lado en vez de
no hacer nada. Lo mide `pruebas/enlaces.js`, que comprueba que después de
correr el JS terminen en `wa.me` — un botón que se ve igual y no lleva a
WhatsApp no da ningún error.

Contra el código anterior esa suite da **7 fallas**.

### La pantalla de 404

No existía. Cualquier dirección mal tipeada caía en la pantalla de error
de Cloudflare: fondo blanco, tipografía de sistema y un número. Con QR
impresos y tráfico pagado eso pasa todos los días —una letra de más, un
link viejo— y el que cae ahí se va, porque parece que el negocio no
existe.

`404.html` es de la marca y ofrece **las cuatro puertas** más WhatsApp.
Cloudflare la sirve sola, y **`pruebas/servidor.py` aprendió a servirla
igual**: antes devolvía la pantalla de Python, así que la nuestra podía
estar rota y las pruebas seguían en verde. Es la regla de siempre — un
servidor de pruebas que no se parece al de verdad esconde justo lo que
hay que ver.

### Cómo se ve el link cuando lo reenvían

`muro.html` y `rollo.html` tenían `noindex` pero **ninguna etiqueta
`og:`**. El link del rollo se reparte por WhatsApp (el propio CLAUDE.md lo
dice: "al que le reenviaron el link"), y sin tarjeta llega una dirección
pelada y gris, que es exactamente lo que parece un link trucho: el
invitado duda y no lo abre.

Ahora las dos tienen título, bajada e imagen. **La imagen es la de la
marca a propósito**: nunca el nombre del evento ni nada del cliente, que
viajaría en la vista previa de cada chat por el que pase el link. El
`noindex` sigue puesto: esto no lo publica en Google, sólo le pone cara a
la tarjeta.

### La página no puede ser infinita

Medido en un teléfono: tenía **21,3 pantallas de scroll**. El contenido
estaba bien; lo que sobraba era aire. Las **veinte** tarjetas de "qué
incluye" solas se llevaban **5,8 pantallas** —más de un cuarto del sitio—
porque abajo de 520px caían a UNA columna. Ahora van a dos y compactas, la
galería de trabajos es un carrusel que se desliza (2,3 → 0,7) y los textos
dicen lo mismo con menos palabras: **21,3 → 16,6**. Lo cuida
`pruebas/largo.js`, con el tope en 18 para que no crezca sola otra vez.

**Dos reglas para lo mismo, gana la última.** El carrusel de `.trabajos`
no funcionaba escrito antes del `@media(max-width:860px)` que pone
`flex-direction:column`: la galería seguía apilada y la medición decía
2,3 pantallas igual que sin tocar nada. Parecía que el CSS no había
entrado.

**Un carrusel que no asoma nada parece una tarjeta sola** y nadie lo
desliza. El recorte del costado —el siguiente celular asomando— es lo que
le dice al que mira que hay más, y hay una prueba que mide esos píxeles.

### La animación atada al scroll

`animation-timeline: view()` en vez de un interruptor: el fundido lo
maneja la POSICIÓN del bloque en la pantalla, así que si frenás a mitad de
camino la animación frena ahí. Es CSS del navegador, no cuesta un
kilobyte y encaja con "no hay build".

Tres cosas que se pagaron caro y no son opcionales:

- **Va adentro de `@supports` y ahí `.ap` se redefine a `opacity:1`.**
  `animation-timeline` recién llegó a Safari y los iPhone que no lo tienen
  son exactamente donde están los invitados. Si el estado por defecto
  fuera invisible, en esos teléfonos **la página quedaría en blanco**, y
  eso no tira ningún error: se ve negro y listo. Es el mismo agujero que
  ya tenía comentado el `IntersectionObserver`.
- **El rango termina dentro de `entry`, no en `cover`.** Con
  `cover 22%` un bloque de la ÚLTIMA pantalla nunca lo alcanza —no queda
  página por delante para recorrer— y se queda a mitad del fundido: medio
  transparente para siempre. Lo agarró la prueba.
- **Lo que está fuera de la pantalla POR EL COSTADO no lo revela el
  observador.** Al volver la galería un carrusel, las tarjetas que
  esperaban a la derecha nunca intersecaban, se quedaban en opacidad 0, y
  al deslizar aparecía una tarjeta EN BLANCO. En una fila que se desliza
  la aparición de a una no tiene sentido: entra la fila entera
  (`.trabajo.ap{opacity:1}`).

**Cómo se mide "no esconde nada", porque la primera versión no medía
nada.** Miraba TODOS los `.ap` en cada parada de un scroll a los saltos e
informaba 18 fallas… y también **20 contra `main`**: no medía la página,
medía que un scroll a los saltos le gana al observador. La prueba correcta
mira **solo lo que está en pantalla**, y si lo encuentra invisible espera
sin moverse y vuelve a mirar: agarrar un bloque a mitad de la aparición no
es una falla. Se prueba en tres modos —normal, "menos movimiento" y **sin
JavaScript**—, porque cada uno recorre un camino distinto y en los tres el
contenido tiene que verse.

## Hacer una invitación nueva: el chat aparte

`invitaciones/COMO-SE-HACE.md` es el manual para un chat dedicado a hacer
UNA invitación, sin tener que contarle el proyecto entero. Decisión del
dueño (12/10/2026): *"me gustaría tenerlo en otro chat por la cuestión de
que acá ajustamos las cosas de la página, así trabajamos prolijo"*.

Lo importante es **el reparto de archivos, por escrito**, que es
exactamente lo que dice el primer párrafo de este archivo que hay que
hacer si alguna vez vuelven a ser dos sesiones: ese chat toca **solo**
`<nombre>/`, y **la invitación no se agrega sola a la galería de
Trabajos** —eso vive en `index.html`, que es de este chat—. Cuando está
lista, avisa y acá se suma, con el nombre de la carpeta, el tipo de fiesta
y los tres colores de la portada dibujada.

El manual lleva lo que no se puede deducir mirando el código: qué permite
la CSP (ningún CDN, ningún píxel de terceros), los topes de peso, los
nombres reservados, cómo funciona el RSVP contra Apps Script —y por qué
después del POST hay que **volver a preguntar** si llegó—, y las reglas
que ya costaron caro y aplican a una invitación: el `toISOString` en UTC,
que Safari necesita un gesto para sonar, `svh` y no `vh`, los 44px, el
hover pegado, el contraste, `prefers-reduced-motion`, y lo legal del
artículo 53 y de los menores.

## La galería de Trabajos: qué se muestra y qué se promete

**Ya no es una sección aparte: vive ADENTRO de `#invitaciones`**, entre la
promesa y el "qué incluye". Medido antes de moverla, en un teléfono: la
página tenía 15,6 pantallas y **lo que vende las invitaciones —las cinco
corriendo de verdad— caía en la pantalla 11,1**, después del muro y del
rollo; el que tocaba "Invitaciones" en el menú llegaba a un párrafo.
Ahora la prueba queda pegada a la promesa, en la 6,3.

**No rompe el bloque de productos**, que era el motivo por el que Trabajos
se había ido abajo (*"muestra SOLO invitaciones, y justo antes de
presentar los otros dos la página volvía al primero"*): si Trabajos **es**
la sección de invitaciones, no hay a dónde volver.

**El `id="trabajos"` se queda**, ahora en el `div` de la galería: ese ancla
ya circuló —estaba en el menú y en enlaces de adentro— y un ancla repartida
no puede quedar muerta. Del menú sí se fue la entrada "Trabajos", que
llevaba exactamente al mismo lugar que "Invitaciones".

Seis fichas. **Tres son de clientes** (Key, Xiomara, Pia) y **tres son
muestras nuestras de casamiento** (`claraybruno/`, `juliayfranco/`,
`mateoylucas/`).

**Los números NO se escriben a mano.** El renglón que dice cuántas son de
cada cosa y el título de la pantalla con todas se cuentan de `TRABAJOS`.
Escritos decían "cinco" el día que pasaron a ser seis — y la sección
promete *"las mismas que recibieron los invitados"*, así que ahí un número
que miente es caro. El botón dice "Verlas todas juntas", sin número.

**La primera es un casamiento, y es la única decisión de orden que
importa.** Eran tres XV seguidos: el que entra buscando para su boda
cierra la página creyendo que esto es para quinceañeras. Además
`claraybruno/` vive en el repo, así que abre siempre — la primera ficha no
puede depender de que Netlify esté en pie.

**Y se dice que son muestras.** La sección prometía *"Invitaciones reales,
las mismas que recibieron los invitados"*, y de estas dos eso es mentira:
la de Julia lo declara en su propia `og:description`. Cuesta un renglón
(`muestra:true` pinta una píldora "Muestra nuestra" en la ficha) y el
texto de arriba ahora dice cuántas son de cada cosa. Es la regla de
siempre: *mostrar una pantalla que no existe como si existiera es
mentirle al cliente*.

**`sub` es lo que dice la portada DIBUJADA** —la que se ve mientras baja
el marco, o para siempre si el sitio no responde—. Estaba clavado en "Mis
quince años" porque hasta acá eran todas de quince: en un casamiento eso
es un cartel equivocado puesto encima del producto.

`claraybruno/v2/` **no es un sobrante**: es una redirección al link nuevo,
porque esa dirección ya circuló y un link repartido no puede quedar
muerto.

### `mateoylucas/`: la boda de dos hombres

Pedido del dueño (15/10/2026): *"una invitación para una boda gay, que sea
emotiva y que se trate el tema con emoción y respeto"*, con algo simbólico
de dos hombres y una frase de amor. Mandó dos referencias: una foto de dos
novios en blanco y negro, y una tarjeta de stock con dos smokings
dibujados sobre glitter.

**De las dos, la segunda NO.** Dos smokings dibujados dicen "boda gay" como
*género*, igual que un cotillón: reemplazan a la pareja por el símbolo de
la categoría. La foto dice "estos dos". Tratar el tema con respeto es
exactamente eso, y es la misma regla de siempre dicha de otra forma: el
cliente no es una categoría.

**La idea, en una línea: dos metales iguales que se encuentran.** Uno es
oro, el otro plata, y **todo va de a dos y del mismo tamaño** — los
nombres, los anillos, las columnas de "cuándo y dónde"—. En una invitación
hétero hay un orden heredado (la novia primero, los padres de cada lado);
acá cualquier jerarquía sería una declaración, así que no hay ninguna.
**Eso es lo simbólico de verdad**, cuesta una línea de CSS, y no se lee
como un adorno: se lee como que está bien hecha.

Lo simbólico, concreto: **dos alianzas idénticas entrelazadas** —no un
anillo de compromiso y una alianza—, el `&` en el degradé de los dos
metales, dos moños (uno de cada metal) en el dress code, y **el espectro
una sola vez**, apagado dentro de la paleta. Dicho una vez es una caricia;
repetido es un disfraz.

**Lo que NO tiene, a propósito**: caligrafía —es el registro de la novia;
acá va capitular espaciada y una serif de transición, que es el registro
del smoking— y **ninguna foto**. No se pueden inventar fotos de dos
personas que no existen, y poner una de stock como si fueran ellos es
mentirle al que mira, más el artículo 53. Los huecos quedan cableados en
`CONFIG.historia`: vacío no dibuja la sección —nada de huecos en blanco— y
el día que llegan las fotos de una pareja real, aparece sola. **Que la
pieza se sostenga sin una sola foto es lo que demuestra**: se vende antes
de que el cliente mande nada.

**La frase es de Walt Whitman** (*Canto del camino abierto*, 1856) y no
está elegida por bonita: es el poeta del amor entre hombres, murió en 1892
—así que es de dominio público— y **la traducción es nuestra**, con lo que
no hay derechos de nadie en el medio (las traducciones publicadas tienen
los suyos). El verso que importa es el tercero: *"me doy entero, antes que
cualquier sermón y cualquier ley"*.

**Y tiene una sección que es el corazón de la pieza: "No siempre se
pudo".** Hasta el 15 de julio de 2010 (Ley 26.618) dos personas como ellos
no se podían casar en Argentina. Tres renglones, dichos por ellos, sin
bajada de línea, y termina en *"Vení a festejarla con nosotros"*. Es la
única sección donde el espectro significa algo y por eso es la única donde
aparece. **Para una pareja de verdad es opcional**: se saca borrando el
bloque, y hay que preguntarlo — a algunas les va a encantar y otras van a
querer que su invitación no hable de eso.

Cuatro cosas que se rompieron armándola, y **ninguna tiraba un error**:

- **Los `<defs>` vivían adentro del SVG del sobre, que se REMUEVE al
  abrir.** Los anillos de la portada y del cierre apuntan a `url(#gOro)`:
  se quedaban sin pintura y desaparecían. Un degradé compartido va en un
  SVG suelto que no se saca nunca.
- **Los anillos no estaban entrelazados.** La máscara recortaba el arco
  equivocado —el de un círculo que no era ninguno de los dos— y la plata
  quedaba mordida como una medialuna. Se arregla sin máscara: los dos
  círculos enteros y **encima el trocito del de oro** que vuelve a pasar
  por delante en el cruce de arriba.
- **El `<select>` repetía la flecha SEIS VECES** encima del texto de la
  opción. `background` es el ATAJO y resetea `background-repeat`,
  `-position` y `-size`: la regla de la sección clara, que viene después,
  le borraba el `no-repeat` a la de arriba. Va `background-color`.
  Es la enésima versión de *dos reglas para lo mismo, gana la última*.
- **El botón del sobre latía con un `scale`** y Playwright no lo podía
  tocar nunca: *"element is not stable"*, treinta segundos colgada contra
  un botón que está perfecto. El latido va en un halo alrededor
  (`:after`), no en la caja que se toca.

Medido, no a ojo: **85 textos y ninguno abajo de 3:1** (el peor, 4,24),
nada abajo de 44px, nada se sale de ancho, la consola limpia —o sea que la
CSP no bloqueó nada— y **los siete versos entran en una línea a 320, 360,
390 y 430**. Eso último tiene su propia medición porque los versos van
cortados a mano: uno partido al medio (*"más precioso que el / dinero"*)
se lee como un error de maqueta, no como un poema.

Pesa **76 KB entera**, con la imagen de la vista previa incluida.

#### Después: la foto, el salón y el calendario

El dueño mandó la foto que había usado de referencia y pidió ponerla, con
**La Mansión del Rey** de Rosario como lugar y un calendario de "guardá la
fecha" para 2027.

**La foto se puso y después se SACÓ, y el motivo queda escrito.** Son dos
personas reales e identificables, sacadas de una captura, y la invitación
vive en una dirección pública que cualquiera baja y un buscador indexa:
es el artículo 53, el que está escrito en nuestros propios Términos, y si
además es de un banco de imágenes, la licencia casi nunca cubre usarla
como si fueran los novios. Se le dijo al dueño las dos veces que lo pidió
y la tercera contestó *"sacala entonces"*.

**Lo que NO se tiró es el camino.** La portada con foto quedó entera,
apagada detrás de `CONFIG.portada`: vacío es la portada tipográfica —que
se sostiene sola— y con un archivo la portada pasa a ser la foto a
pantalla completa, con los nombres abajo y su velo. **Es una línea.** El
`<img>` lo crea el JS y no el HTML: un `<img>` con `src` vacío le pide al
servidor la página entera de nuevo, y eso no avisa.

**La dirección del salón NO se escribió.** La única fuente que apareció
era un directorio sin confirmar. Va el nombre y "Rosario · Santa Fe", y el
mapa busca el salón por su nombre: mandar a los invitados a una calle
sacada de un directorio dudoso no se arregla la noche de la fiesta.

**El calendario sale de la CADENA de `CONFIG.ceremonia`, no de
`new Date(...)`.** `new Date("2027-11-13T19:00:00-03:00").getDate()`
devuelve el día **en el reloj del que mira**: un invitado en Madrid veía
marcado el 14. La fecha de una fiesta es la del lugar de la fiesta y de
nadie más. Las cuentas del mes se hacen con `new Date(anio, mes-1, 1)`,
que se construye por componentes y no mete zona horaria. La semana
arranca el lunes. El día va marcado con los dos metales y **no con un
corazón rojo** como la referencia: sería el único rojo de la pieza, y lo
que la sostiene es que todo va de a dos.

Y tres cosas más que no tiraban ningún error. **Las tres eran de
medición, no de código**, que es lo que las hace peligrosas:

- **La portada no puede pasar por el observador.** El `IntersectionObserver`
  descuenta un 12% abajo (`rootMargin`) para que un bloque entre cuando ya
  se ve bien. La portada mide exactamente una pantalla y su texto quedó
  abajo: "Rosario · Santa Fe" y "Deslizá" caían DEBAJO de esa raya y no
  intersecaban nunca — **opacidad 0 para siempre**, y justo "Deslizá" es lo
  único que avisa que hay más abajo. Lo que ya está en la primera pantalla
  entra solo, sin esperar a que alguien scrollee.
- **`visibility:hidden` en el padre esconde también su `::before`.** Para
  medir el contraste sobre una foto hay que fotografiar el fondo SIN el
  texto; escondiendo `.port` se escondía además el velo que es justamente
  lo que hace que el texto se lea. Resultado: el medidor decía 1,09:1
  sobre un fondo que el visitante no ve nunca, y **cambiar el velo no
  movía un solo número**. Se esconden los HIJOS. Corregido, los cinco
  renglones dan entre 6,0 y 8,6:1 en teléfono y en escritorio.
- **Comparar el ancho del documento contra `innerWidth` no mide nada.** El
  velo se desborda 60vw por lado a propósito y, sin `overflow:hidden`, la
  página pasó a medir **578px en vez de 390**: ahí el navegador del
  teléfono se aleja solo para que entre todo y la invitación entera se ve
  más chica. Como `innerWidth` ya viene achicado, `ancho == innerWidth` y
  la comprobación pasaba en verde con la página rota. **Se compara contra
  el ancho PEDIDO.** Es la regla de la caja de 0x0 otra vez, con el zoom
  del navegador en el medio.

**El velo del texto va atado al TEXTO, no a un porcentaje de la
pantalla.** Medido en porcentajes, el renglón de la fecha caía sobre la
camisa blanca y daba 2,36:1 en el teléfono y 1,29:1 en escritorio: el
alto del bloque cambia con la pantalla y la raya del degradé no. Pegado al
bloque (`.port:before`), el piso es el mismo en cualquier aparato.

### Las cinco juntas

El carrusel muestra una invitación y media: está bien para que el que pasa
entienda que hay más, y mal para el que quiere **comparar**. Pedido del
dueño: *"me gustaría que tengan la opción de abrir una pantalla donde están
todas juntas"*. El botón **"Ver las cinco juntas →"** abre `#todas`, una
capa con las cinco corriendo de verdad en su celular, en grilla.

Cuatro cosas que no son adorno:

- **Se dibuja UNA vez, la primera que se abre.** Cinco fichas en el HTML
  inicial es peso que casi nadie va a mirar.
- **Los marcos se encienden al abrir y se APAGAN al cerrar** (se les saca
  el `<iframe>`), igual que los paneles de los servicios. Cinco
  invitaciones latiendo detrás de una pantalla cerrada es la visita entera
  pagando algo que nadie mira. Hay una medición que cuenta los `<iframe>`
  antes de abrir (0), con la capa abierta (5) y después de cerrar (**0**).
- **La ficha es la MISMA función** (`fichaTrabajo(t,i,tarde)`) que dibuja
  el carrusel: dos plantillas para la misma tarjeta es una que se queda
  atrás. `tarde` le pone `data-tarde` al `.vivo` para que el IIFE de los
  marcos lo saltee y lo prenda recién `prenderVivo`.
- **Cierra con el ✕ y con Escape**, y adentro scrollea. En la grilla la
  ficha no se deriva del alto —no es un carrusel, se scrollea— así que va
  `width:100%;max-width:252px` con `auto-fit,minmax(230px,1fr)`.

### `mia15/`: la primera invitación de un cliente de verdad

29 de enero de 2028, La Mansión del Rey (Vera Mujica 68, Rosario).
Lo que mandó la cumpleañera fue corto: **blanco, dorado y negro**,
*"elegante o formal"*, que se marque si asisten y que tenga cuenta
regresiva.

**Se armó SIN publicar**, a pedido del dueño: vive en la rama de
trabajo hasta que el cliente la apruebe. Cloudflare publica `main`,
así que mientras no se mergee no existe en el sitio. Y el
`CONFIG.endpoint` va vacío a propósito: la confirmación se ve y se
completa entera y **dice con todas las letras que no se mandó a
ningún lado**, así la tarjeta se revisa antes de que exista la
planilla.

**Hubo cuatro versiones y las tres primeras se tiraron.** Vale
anotar por qué, porque es la misma lección tres veces:

1. Negra con oro. *"Parece hecha a lo Click Eterno y no al pedido
   de la quinceañera"*, y tenía razón: **esa es NUESTRA paleta** —la
   del muro, la del rollo, la del sitio— y el blanco, que era uno de
   los tres colores que ella pidió, había quedado de relleno.
2. Papel marfil con tipografía negra. Correcta y sosa.
3. Con la referencia que eligió él (BOMA): tipografía gigante como
   gráfico, títulos manuscritos y una línea vertical al costado.
4. Con la segunda referencia: **bandas que alternan blanco y negro
   con el borde RASGADO**, que es lo que usa el blanco y el negro
   como estructura y no como detalle.

**El atajo para elegir tipografía: mostrarla, no describirla.** Tres
veces se cambió la familia por descripción y tres veces no era. A la
cuarta se montó la MISMA portada con siete tipografías y se le
mandaron las siete capturas. Eligió mirando. Está en
`pruebas/invitacion_mirar.js` la forma de hacerlo: interceptar el
HTML y cambiarle el `<link>` y la variable, igual que hace
`puertas.js` con `MUESTRA_MURO`.

**Los bordes rasgados se ponen SOLOS**, y solo donde cambia el
color. Escritos a mano en el HTML, el día que una sección se
esconda —el regalo se esconde si no hay alias— quedarían dos bandas
del mismo color pegadas con un rasgado en el medio. Los caminos SVG
se generan con la fecha de la fiesta de semilla, así salen iguales
en cada armado.

**Lo que NO se escribió hasta tenerlo confirmado.** La cumpleañera
mandó el día y no la hora, y una hora inventada manda a la gente a
la hora equivocada: quedó apagada en `CONFIG.mostrarHora` hasta que
el dueño la pasó el 18/10/2026 — **de 21 a 4**. **La fecha para
confirmar NO tuvo ese cuidado y debería haberlo tenido**: salió
publicada con un "29 de diciembre" que puse yo y que la clienta nunca
mandó. Ahora `CONFIG.confirmarHasta` vacío **no dibuja el renglón**
en vez de inventar una fecha, que es lo mismo que hace la hora; el
valor sigue puesto y está preguntado. Va como un RANGO
(`CONFIG.hastaHora`), y el final es una hora suelta y no una fecha a
propósito: las 4 son del día siguiente, y escribirlas como fecha
completa haría que la invitación dijera "30 de enero" en algún
lado — la fiesta es el 29 y eso es lo que tiene que leer el
invitado. Se escribe como se dice: *"de 21 a 4 h"*, sin los
`:00` que nadie pronuncia.
**Y Mia va sin apellido**, dicho por el dueño el mismo día: no es un
dato que falte, es una decisión.

**El "Te invito" lo escribió la clienta.** Pidió por WhatsApp (18/10/2026)
que dijera *"me encantaría que formes parte de esta noche tan especial
para mi"* en lugar de lo que había. Va casi literal: *"Vengo esperando
este día hace mucho. Me encantaría que formes parte de esta noche tan
especial para mí."* — lo único que se tocó fue no repetir "noche" dos
veces en la misma frase. **Esa línea no se mejora**: es la voz de la que
invita, no la nuestra.
El alias del regalo estuvo en
la misma lista hasta que el dueño lo confirmó (17/10/2026), y
**cambió al día siguiente**: era `Ceci.montenegro.11` y pasó a ser
`Aneley.1974`, de otra cuenta. Va con el rótulo "Alias para
transferir" arriba, y ese rótulo hace falta por los dos lados: los
dos se leen igual que un usuario de Instagram, y el dueño lo pasó
diciendo *"es el cbu para regalos"* —no es un CBU, es un alias, y
pegar un alias donde el banco pide un CBU no entra—. El que pega el
dato equivocado manda la plata a cualquier parte. El **titular** —el
nombre que le va a mostrar el banco al pegarlo— sigue sin saberse y
por eso no se escribe nada: un nombre inventado al lado de un alias
es peor que ninguno. **Y ahora hay que preguntarlo de nuevo**: la
cuenta no es la misma, así que el titular tampoco tiene por qué
serlo.

#### Las cuatro fotos

**La primera va en la portada, a sangre, y las otras tres pasan
solas** en un marco con sus puntitos. Tres decisiones que no son de
gusto:

- **La portada es la foto, a pantalla completa.** La primera
  versión la puso arriba, en una franja, con la tipografía abajo
  sobre el papel — justamente para no apostarle el contraste de un
  "15" negro a lo que hubiera salido en la imagen. El dueño mandó la
  de Julia y Franco: *"algo así hace"*. Ahí la foto ES la portada y
  el texto va encima. Lo que lo hace posible es dar vuelta la tinta:
  crema para el texto, el oro de las bandas negras para el acento, y
  **un velo** que hace de piso. El velo no es un adorno, es lo único
  que sostiene la promesa de que esos cinco renglones se leen.
  **Y el velo TERMINA en la tinta**, que es el color de la banda que
  sigue: la foto se funde con la sección de abajo, así que ahí no va
  ningún borde rasgado —el rasgado separa papel de tinta y acá no
  hay papel—. Lo saltea solo el bloque de los bordes, mirando la
  clase `con-foto`.
  **Las dos líneas verticales se esconden**: dicen "Mis quince años"
  y la fecha, que es exactamente lo que dicen dos renglones del
  medio. Al costado del papel eran un adorno; encima de la foto son
  dos textos más tapando la cara.
- **Van en blanco y negro, y el grayscale está en el CSS.** La
  paleta que pidió son tres colores; cuatro fotos a color meten los
  suyos —el beige del salón, el amarillo de un vestido de princesa—
  y la tarjeta deja de ser blanca, dorada y negra. En el CSS y no
  quemado en el archivo: el original queda entero por si algún día
  se quiere a color.
- **Las cuatro se recortaron, y eso es la mitad del trabajo.** La
  de la portada era la captura de una historia, con el marco, el
  globo de respuesta y la foto de perfil pegados abajo; las dos de
  Mia chiquita traían las franjas negras y la marca de agua de la
  app con que se sacaron. Puesto tal cual, eso dice que la tarjeta
  se hizo con lo que había. Las cuatro quedaron en `mia15/fotos/`,
  en `.webp`, 240 KB las cuatro juntas.

**Tres cosas que se rompieron poniéndolas**, y ninguna tiraba un
error:

- **El marco de las fotos no tomaba el CSS.** El contenedor se
  llamaba `.fotos` de cuando eran dos encimadas y las reglas nuevas
  son `.pase`: las tres fotos salieron apiladas, a color y a ancho
  completo. Se ve enseguida en una captura y no se ve nunca mirando
  el código.
- **"Deslizá" es `position:absolute` y una capa absoluta no empuja
  a nadie.** Con el bloque de texto abajo de todo, "ROSARIO · SANTA
  FE" quedó con "DESLIZÁ" montado encima. El lugar se lo tiene que
  dejar el `padding-bottom` de la portada, y en una pantalla baja
  además se achica el 15.
  **Y la segunda vuelta de lo mismo fue peor**: la regla que sube el
  texto por encima del velo (`#portada.con-foto > :not(.port-foto)`)
  le pone `position:relative` a TODO, "Deslizá" incluido — y le gana
  en especificidad. Un `bottom:30px` en `relative` no ancla abajo:
  **sube el elemento 30px**, o sea justo encima del renglón de
  arriba. Se arregla devolviéndole el `absolute` en una regla
  posterior. Dos reglas para lo mismo, gana la última, otra vez.
- **El color del titular estaba escrito en el propio tag.** Un
  estilo en línea le gana a `.oscura`, así que ese renglón sobre la
  banda negra daba 1,6:1. Vacío no se notaba; el día que llegue el
  nombre del titular, sí. Es *si un bloque trae su propio fondo,
  trae su propia tinta* otra vez, por el lado del estilo en línea.

**Con "menos movimiento" las fotos no pasan solas, pero se llega a
las tres con los puntitos**: apagar el movimiento no puede esconder
contenido. Y al tocar un punto el pase **se detiene**: si sigue
corriendo, la foto que eligió el invitado se le va sola a los tres
segundos y parece que el toque no entró.

**El texto sobre una foto NO lo mide el medidor de contraste, y da
verde igual.** Es la trampa más cara de todo este archivo puesta en
una pantalla nueva: el medidor sube por el árbol buscando el primer
fondo opaco, y en una portada a sangre ese fondo es el
`background-color` del contenedor —no la foto—. Informa "crema
sobre tinta, 14:1" mientras el renglón puede estar cayendo sobre una
pared blanca. Lo midió igual de bien con velo y sin velo.
Por eso `invitacion_mirar.js` tiene ahora una medición aparte, y es
**con el píxel, que es lo único que no miente**: esconde los HIJOS
de la portada —no la portada, que se llevaría puesto el velo, que es
su `::after`—, saca una captura y busca el píxel **MÁS CLARO** abajo
de cada renglón. El más claro y no el promedio: el promedio esconde
justo el reflejo que se come la letra. La captura se lee con
`pruebas/png.js`, un lector de PNG de setenta líneas sin
dependencias (zlib de Node y los cinco filtros), porque en este
proyecto no hay `npm install`.
Verificada rompiendo a propósito: **sacado el velo da 16 fallas**
(el "15" a 1,53:1 y el manuscrito a 1,08:1) y con el velo puesto el
peor renglón da 3,26:1 en un iPhone SE.
**Y encontró una falla de verdad en una invitación publicada**: en
`juliayfranco/`, "20 NOVIEMBRE 2027" cae sobre el vestido blanco de
la novia y da **1,15:1 en un teléfono de 390** — o sea que la fecha
de la boda no está. Se ve en la captura que mandó el dueño y nadie
lo había notado. Esa invitación tiene además otras fallas de la
misma suite (desborde y los años de la línea de tiempo a 1,00:1):
le falta una pasada entera, que es un trabajo aparte.

#### Los iconos, y la foto entera

Dos pedidos del dueño del 18/10/2026: *"que haya iconos aesthetic
para cada cosa, que sea súper lujosa"* y *"la foto de portada que
esté entera"*.

**Ocho iconos de línea, dibujados en el JS y no escritos ocho veces
en el HTML**: una tiara (te invito), una cámara (las fotos), un
reloj de arena (cuánto falta), un pin con un rombo adentro (el
lugar), un vestido largo (dress code), una caja con moño (el
regalo), un sobre (¿venís?) y un destello (el cierre). Son SVG de
24×24 con `stroke:currentColor`, así que **el color lo pone la
banda**: `--oro` sobre el papel (4,6:1) y `--oro-neg` sobre el negro
(10:1). Es *cada bloque con su propia tinta* aplicado a un dibujo.
Van con `aria-hidden` y `pointer-events:none`, que es la definición
estricta con la que el medidor saltea un adorno.
Nada de una librería de iconos: la CSP no deja bajar un CDN, y acá
no hay build. Un `stroke` y listo.
**La galería no tiene `.caja`**, así que el icono va en la sección y
no en el primer hijo — metido ahí quedaría ENCIMA de la foto.

**La foto de la portada va `contain`, no `cover`.** `cover` llenaba
la pantalla recortándole los costados: en un teléfono le comía el
13% del ancho. Ahora se ve entera, apoyada arriba, y lo que sobra
abajo es negro — que es justo donde cae el texto. Dos cosas que
hubo que arreglar para que eso no se note:

- **El fondo de la caja de la foto es la TINTA y no el papel.** Lo
  que sobra es ese fondo, y el velo lo deja ver a un 12%: un papel
  crema ahí es una banda más clara pegada al pie de la foto, una
  juntura a lo ancho de toda la pantalla.
- **El velo se hace macizo en el 86% y no recién en el 100%.** Con
  la foto entera, su borde de abajo cae en un punto distinto en
  cada pantalla (el 79% de un iPhone, el 96% de un SE), y un velo
  que todavía deja pasar un 10% ahí dibuja una raya. De paso el
  texto sobre la foto pasó de 3,26:1 a **7,31:1** en el peor caso.

En una pantalla ancha la foto queda como una columna centrada con
negro a los costados. Es lo que pasa cuando se muestra entera una
foto vertical en un monitor apaisado, y se ve editorial.

#### Lo que se mueve, y los márgenes

*"Fíjate de poner animaciones o transiciones copadas para que se
sorprendan pero que tampoco sea muy molesto."* Son cuatro, y la
regla que las separa de lo molesto es la misma en todas: **cada una
pasa una sola vez, o va atada al scroll.** Nada que se repita solo
delante de los ojos.

- **El zoom lento de la portada.** La foto entra 7% agrandada y se
  acomoda sola en **nueve segundos**. Nueve es a propósito: un zoom
  que se nota es un zoom molesto; éste se percibe sin poder
  señalarlo. El estado agrandado cuelga de `body.cerrado`, la clase
  que pone el JS al dibujar el sobre: **sin JS no hay zoom y la foto
  está entera desde el principio**, que es el estado bueno.
- **La cascada de la portada**, 160 ms entre renglón y renglón:
  el nombre, el 15, el manuscrito, la fecha, el lugar, "Deslizá".
  Y entra **cuando se abre el sobre, no al cargar**: con el sobre
  encima, una cascada que corre detrás no la ve nadie — se gasta el
  único momento de sorpresa que tiene la pieza contra una capa
  opaca. El retardo se saca cuando terminó: dejado puesto, lo
  hereda cualquier transición futura de ese elemento.
- **Los iconos se dibujan solos** al entrar en pantalla, en 1,15 s.
  Con el largo REAL de cada trazo (`getTotalLength`), no con un
  número a ojo: con un largo inventado el dibujo arranca por la
  mitad o termina antes. El navegador que no tenga `getTotalLength`
  se queda con el icono dibujado, que es el estado bueno.
- **La foto de la portada se queda atrás al bajar**, a un quinto de
  la velocidad de la página. Se mueve la CAJA y no la imagen: la
  imagen ya tiene su propio `transform` con el zoom, y dos cosas
  peleando por la misma propiedad es una que gana y otra que
  desaparece. El velo se queda quieto, que es lo que hace que se
  note. Un solo oyente con `requestAnimationFrame` y `passive`, y
  se corta apenas la portada sale de pantalla: mover algo que nadie
  ve es batería del invitado.

Las cuatro están medidas (el zoom de 1,07 a 1 en 9 s; la cascada
con "MIA" en 0,42 de opacidad y el resto en 0 a los 260 ms; el
trazo del icono de 6,7 a 0; el paralaje en 22, 66, 132 y 198 px a
100, 300, 600 y 900 de scroll) y **las cuatro se apagan con "menos
movimiento"**.

**Los márgenes, medidos con las cajas de verdad en tres aparatos**:
simétricos en todas las secciones, 36px de borde a 320 y 390, 360 a
1280. Lo único que estaba flojo: **la portada tenía 26px de borde y
las secciones 22** abajo de 400px de ancho. Cuatro píxeles no se
ven de a uno; se ven al scrollear, porque el texto de la portada
arranca más adentro que todo el resto.

#### El marco de la foto, y los nombres de los que vienen

Lo primero que reportó el dueño con la invitación ya publicada, y
las dos son de producto, no de diseño:

**El marco estaba mal, y el motivo es de bulto.** Era un filete
corrido dibujado con un `:before` de `.pase` — y `.pase` no es la
foto: es la foto **más los puntitos**. El filete terminaba 14px
abajo de los puntitos y asomaba por la derecha de la imagen, así
que no se leía como un marco sino como un rectángulo suelto mal
puesto. En una captura de escritorio pasa por una decisión de
diseño; en un teléfono se ve que está roto. Ahora el marco es una
caja de verdad alrededor del `figure` (`.pase-marco`, un pasepartú
de 10px con su filete) y **lo que mide es lo que encierra**.
Hay una medición que exige las tres cosas: que rodee la foto, que
sea simétrico y que no se coma los puntitos.

**"¿Cuántos son?" decía cuántos y no quiénes.** Para lo único que
entra el que organiza —armar las mesas— un número no sirve: al otro
día hay que escribirle a cada uno preguntándole con quién viene.
Eligiendo 5 se abren los otros cuatro renglones, así son cinco
nombres en total con el suyo.

- **No son obligatorios, a propósito.** El que no se acuerda del
  apellido de uno abandona la pantalla, y una confirmación sin un
  nombre vale más que ninguna confirmación.
- **El nombre del campo ES el título de la columna**, y el Apps
  Script crea la columna sola la primera vez que llega una que no
  conocía: del otro lado no hay nada que configurar.
- **Lo escrito se conserva al cambiar el número**, y el caso que
  importa no es bajar de 5 a 3: es contestar **"no voy a poder"**,
  que borra los renglones, y volver al "sí". Con el guardado
  adentro de la función que redibuja, al volver ya no había de
  dónde leerlos. Medido: cuatro nombres puestos volvían en blanco.
  El guardado vive afuera.

#### El que dice que NO no llena lo que no es suyo

Al elegir *"No voy a poder"* desaparecían los renglones de los
acompañantes —eso ya estaba— pero la pantalla **seguía preguntando
cuántos son, qué comida no puede y qué tema quiere**: tres renglones
después de haber dicho que no va. Desde afuera se lee como que la
pantalla no lo escuchó.

**Y lo caro no es cómo se ve.** `new FormData(form)` manda **todo lo
que esté en el formulario**, esté a la vista o no, así que a la
planilla le llegaba una fila que dice NO VIENE con **"Cuántos: 4"** —
y ésa es exactamente la columna con la que el que organiza arma las
mesas. Medido: con "No", antes viajaban `Nombre, Confirma, Cuántos,
Comida, Canción`; ahora viajan `Nombre, Confirma`.

Por eso **no alcanza con esconderlos**: van `hidden` *y*
`disabled`, que es lo único que hace que no viajen. Y volviendo al
"sí" vuelve todo, con los nombres de los acompañantes ya escritos —
el mismo caso que ya había costado una vuelta.

Lo mide `pruebas/invitacion_mirar.js` por **las dos mitades**: que no
se vea Y que no se mande. Esconder sin deshabilitar arregla la
pantalla y deja la planilla mintiendo, y una prueba que sólo mirara
la pantalla daría verde. Contra el código publicado da **2 fallas**.

#### Que los campos del formulario encajen en la planilla

El Apps Script crea cada columna **con el nombre del campo que le
llega**, así que lo que decide si la planilla sale bien es cómo se
llaman los `name=` del formulario — y eso no lo mira nadie hasta que
el cliente abre la planilla después de la fiesta.

`pruebas/rsvp.js` corre el `.gs.txt` de verdad con los campos de
mia15 **leídos del HTML publicado** y comprueba que la planilla cree
sola las columnas (`Nombre`, `Confirma`, `Cuántos`, `Comida`,
`Canción` y los `Invitado N` que arma el JS), que el resumen cuente
bien, que el que no viene no deje número en "Cuántos" y que la puerta
`?confirmado=` reconozca el nombre con espacios y en minúscula.

**La primera versión no medía nada y hay que decir por qué**, porque
es una trampa nueva: posteaba los nombres **escritos a mano** en la
prueba y aparte comprobaba que el formulario tuviera dos de ellos.
Renombrar un campo la dejaba en VERDE, porque la prueba seguía
posteando el nombre viejo contra un Apps Script que lo aceptaba
igual. Ahora postea **los que lee del HTML**. Verificada rompiéndola
a propósito: renombrar `Confirma` da **3 fallas**, y el síntoma que
destapa es el que importa — *"2 invitados · 0 confirmados"* con la
planilla llena, que es la misma falla que ya está escrita para el
listado.

**Es una verificación, no un guardián de regresión**: pasa igual
contra el código anterior, porque antes nadie había medido esto. Lo
que la hace valer es que está atada al formulario y no a una lista
escrita a mano.

#### La clave del tablero de Mia es un correo, y es una excepción

La regla de este archivo es que **la clave la inventa la planilla**, y
el `.gs.txt` explica por qué: *"un correo es público y adivinable — y
esa clave abre la lista entera de invitados"*. Para mia15 **no se
cumple, y es decisión del dueño**: la cumpleañera mandó un correo de
la familia como contraseña para ver las confirmaciones y él lo pidió
dos veces. Se le dijo el riesgo las dos y lo sostuvo.

Quedó anotado acá para que nadie —yo el mes que viene incluido— lo
"arregle" volviéndolo a generar al azar.

**El valor NO se escribe en el repo**, que es la otra mitad de la
regla y ésa sigue en pie: vive en `CLAVE_ELEGIDA`, en la copia del
editor de Apps Script del dueño, y en las propiedades de ese
proyecto. El `.gs.txt` versionado sigue con la cadena vacía.

Tres cosas medidas corriendo el `.gs.txt` de verdad, porque del otro
lado no se depura:

- Poner `CLAVE_ELEGIDA` y volver a correr `preparar()` **pisa la
  clave que se había inventado**, y la vieja deja de servir.
- **No hace falta volver a implementar.** La clave vive en las
  propiedades del proyecto, que la implementación lee en cada
  pedido; lo que queda congelado al implementar es el CÓDIGO. La
  dirección `/exec` no cambia.
- **La comparación distingue mayúsculas** (`igualesSinApuro_` compara
  byte a byte, que es lo que la hace no filtrar cuántas letras
  acertaste). Medido: con la clave guardada en `Gabi…`, escribir
  `gabi…` **no abre**. Por eso se guarda toda en minúscula: el campo
  es `type="password"`, que en iPhone no autocapitaliza, así que lo
  que se escribe es lo que se guardó.

#### El tablero no puede existir antes que el Apps Script

`pruebas/invitaciones.js` falla si una carpeta `<evento>/listado/`
tiene el `appsScriptUrl` vacío: *"no va a traer nada"*. Está bien que
falle. Quiere decir que **`mia15/listado/` no se crea por adelantado**
— se crea el día que existe la dirección `/exec`, y es copiar la
plantilla con sus dos líneas de `CONFIG`. **No se le cambia el
estilo** para que combine con la invitación: la plantilla es una sola
y la prueba falla si una copia se separa.

#### El que ya confirmó

*"Si Juan Pérez se registró, que no pueda volver a registrarse. Más
que nada para no llenarle de duplicados el formulario a quien lo
chequea."* Son **dos puertas** y hacen falta las dos, porque tapan
agujeros distintos:

1. **En ese aparato.** El caso que de verdad llena la planilla es el
   mismo invitado volviendo a abrir el link de WhatsApp dos días
   después y completando todo otra vez. Confirmado una vez, la
   pantalla le muestra un cartel con su nombre **en lugar del
   formulario**: dejarlo abierto abajo es invitarlo a llenarlo de
   nuevo. Queda el botón "Cambiar mi respuesta", que es el otro caso
   real —el que pasó de "no" a "sí"— y ésa no se puede cerrar.
   **Se guarda solo cuando la confirmación llegó de verdad**:
   guardarlo en la muestra sería decirle "ya confirmaste" cuando no
   se mandó a ningún lado.
2. **En la planilla.** Antes de mandar se pregunta si ese nombre ya
   está (`?confirmado=`, la puerta que ya existía). Si está, **no se
   manda**: se lo dice y recién el segundo toque actualiza la fila.
   Esto agarra lo que la memoria del aparato no ve — el que confirma
   desde el teléfono de la madre, o el que borró los datos del
   navegador.

**La comparación es la MISMA que usa el Apps Script**:
`trim().toLowerCase()`, sin tocar los acentos. Si la pantalla
normalizara más que la planilla, diría "ya estás anotado" y la
planilla igual crearía una segunda fila — justo lo que se vino a
evitar. Si alguna vez cambia de un lado, cambia en los dos.

**Si la pregunta falla, se manda igual.** Sin señal o con el
servidor caído, bloquear por no haber podido preguntar sería perder
una confirmación de verdad para evitar un duplicado que **la
planilla ya no hace**: el `doPost` pisa la fila del mismo nombre
desde siempre. Esto es para que el invitado se entere, no para tapar
un agujero de la planilla.

**Y el formulario escondido vuelve invisible.** `#rsvp` tiene `.ap`:
escondido nunca interseca, así que el observador no le pone `.entro`
y al mostrarlo de nuevo aparece en opacidad 0 — sin un solo error.
Se lo deja entrar a mano, igual que al cartel, que lo dibuja el JS
cuando el observador ya pasó.

Medido contra el código publicado, que es el que no lo tenía: con el
nombre ya anotado **manda igual y contesta "¡Listo, Juan!"**; con
esto, no manda nada y lo dice. Y el recorrido entero —primera vez,
recarga, cambiar la respuesta, otro aparato con `"  juan pérez  "`,
segundo toque— corre contra un Apps Script interceptado, igual que
`pruebas/listado.js`.

#### Lo que se rompió la primera noche que lo usó gente de verdad

El dueño repartió el link, entraron las primeras confirmaciones y
aparecieron **cuatro cosas**, todas en la misma pantalla. Ninguna tiraba
un error: las cuatro se dibujaban perfecto.

**1 · La cuenta contaba RESPUESTAS y no PERSONAS.** Dos filas que decían
"Cuántos: 2" y "Cuántos: 4" son seis personas y el tablero marcaba 2.
Dicho por él: *"confirmaron dos personas pero en la cuenta figura como
1"*. Para lo único que el cliente entra al tablero —saber cuánta gente
va— el número estaba mal, y el error se descubre el día de la fiesta con
comida encargada de menos. Ahora el número grande son **personas**
(suma de "Cuántos" en las que dijeron que sí, 1 si está vacía) y al lado
quedan "No vienen" y "Respuestas", que es el dato viejo sin perderse.
Lo cuenta la planilla (`resumen.personas`, en `evento-nuevo.gs.txt`) y,
**si el Apps Script publicado todavía es el de antes, lo cuenta la
pantalla con las filas que ya tiene**: así se arregló sin que el dueño
tuviera que volver a pegar nada esa misma noche.
**El "no" no suma su número**: alguien que eligió 4 y después cambió la
respuesta dejaba cuatro personas escritas en una fila que dice que no va.

**2 · La comida era un campo libre y era UNA SOLA para toda la mesa.**
Dicho por él: *"si elegís 5 personas no sale la opción para elegir la
alimentación de las 5; te toma solo 1 y te pone 5 celiacos"*. Esa columna
se le pasa al salón tal cual, así que eso son cinco platos sin TACC y
cuatro personas que no los pidieron. Ahora cada acompañante es un
**bloque con su nombre y su comida**, elegida de la lista de siempre
(Ninguno · Vegetariano · Celíaco · Diabético · Hipertenso · No tolerante
a la lactosa · Otro), que es la que ya usaban `pia/nueva` y
`juliayfranco`. Las columnas son `Comida 2`…`Comida 5` y **las crea sola
la planilla**: del otro lado no hay nada que configurar.
Y **"Otro" manda lo que escribieron**, no la palabra "Otro": el que le
pasa las comidas al salón necesita leer *"sin frutos secos"*.

**3 · Tardaba una eternidad.** Eran **tres viajes al Apps Script** por
confirmación —preguntar si ese nombre ya estaba, mandar, y volver a
preguntar si llegó— más una espera fija de 1,2 s. Cada viaje a Google es
uno o dos segundos: seis u ocho en total, y *"la gente no es de esperar
mucho las cargas"*. Se fue la pregunta de "¿ya estaba?", que **no
protegía de nada**: el `doPost` pisa la fila del mismo nombre desde
siempre, así que el duplicado no existe; lo único que hacía era cobrar un
viaje antes de cada envío. Y el POST ahora se manda **pidiendo leer la
respuesta**: el Apps Script contesta `{"ok":true}` con los permisos
puestos, así que en un solo viaje ya se sabe si entró. Si el navegador no
deja leerla, cae al camino viejo. Medido en el navegador: **un viaje y
~1,5 s** contra tres viajes.
**Lo que no cambia es la regla más vieja**: si no sabemos que llegó, la
pantalla no dice que llegó.

**4 · El alias le faltaba el punto del final.** Es `Aneley.1974.`, con
punto, y estaba escrito `Aneley.1974`. **El punto es parte del alias**:
copiado sin él, la transferencia del invitado va a otra cuenta o no
encuentra ninguna. Se le preguntó cuál de los dos era antes de tocarlo
—un alias no se adivina— y avisándole que la mayoría de los bancos no
aceptan uno que termine en punto; lo confirmó igual. Queda anotado para
que nadie lo "arregle" sacándoselo.

Lo miden `pruebas/rsvp.js` (las columnas por persona y el resumen en
personas: **2 fallas** contra el código anterior),
`pruebas/listado.js` (el tablero, con la planilla contándolo y sin
contarlo: **2 fallas**, y la que importa decía *"dio 2"*) y
`pruebas/invitacion_mirar.js` (que la comida sea una lista y que haya una
por persona, medido por **lo que viaja** y no por lo que se ve: **2
fallas**).

**La lección, y es la de siempre dicha de otra forma**: las cuatro
estaban a la vista y ninguna rompía nada. Las agarró una persona
repartiendo el link de verdad, no una suite — igual que las dos del
iPhone. Lo que una suite no puede medir es si algo SIRVE.

#### Una fila por PERSONA, no una por respuesta

Lo siguiente que reportó el dueño, probando él mismo: la cuenta ya daba
bien, pero *"esas personas no forman parte de una misma columna sino que
cada una sea una fila diferente. Que no estén todos juntos, ya que hace
más difícil contabilizar quién respondió y es más difícil para imprimir
la lista"*.

Tenía razón y es de producto: una respuesta que dice "somos 3" llegaba
como **una** fila con los otros dos metidos en columnas de al costado
—`Invitado 2`, `Comida 2`, `Invitado 3`, `Comida 3`—, así que para saber
quién va a la fiesta había que leer **a lo ancho**. Y lo que se imprime y
se le pasa al salón es una lista de GENTE.

**La planilla NO cambia.** Sigue guardando una fila por respuesta, que es
lo que hace que confirmar dos veces no deje dos filas y lo que usa la
puerta `?confirmado=`. Lo que se abre es la PANTALLA: `porPersona()`
toma cada respuesta y la parte en una fila por persona, con su nombre y
su comida. Por eso esto no necesitó volver a pegar el Apps Script.

**Funciona sin saber cómo se llaman las columnas de esa invitación.** Se
buscan las que terminan en un número (`Comida 2`) y se las entiende como
la misma pregunta hecha a la persona 2; el nombre es el caso especial,
porque en la persona 1 la columna se llama distinto (`Nombre` contra
`Invitado 2`). Una invitación que no pregunta por acompañantes no tiene
ninguna columna así y **queda exactamente igual que antes** — hay una
comprobación para eso, porque el listado de Pía ya anda y no se puede
romper.

**Cuántas filas salen**: lo que diga "Cuántos", y si escribieron más
nombres que ese número, mandan los nombres — hay gente escrita que si no
no aparecería. Tope de 20, por si alguien tipea 999. El que dijo que
**no** es siempre una sola fila.

**No se agrega ninguna columna que diga con quién vino cada uno**, y
quedó escrito porque se probaron dos. Primero `Vino con`, que no se
entendía en la fila del que contestó (*"Cris vino con Cris"*); después
`Mesa sugerida`, que el dueño pidió con esas palabras y al verla sacó:
*"va a ser mucho relleno"*. Tiene razón para lo que esto es —una lista
para imprimir y pasarle al salón, donde cada renglón repetido en todas
las filas es una columna más que no se lee—. **El grupo se ve por el
orden**: las personas de una misma respuesta salen una debajo de la
otra. Y en la planilla sigue entero, porque allá cada respuesta es una
sola fila. Hay una comprobación que falla si vuelve a aparecer una
columna así.

**Y "Cuántos" tampoco se muestra**, por lo mismo: con una fila por
persona ese número ya está contado —son las filas— y repetido en cada
renglón del grupo es una columna más que no se lee. Sigue entero en la
planilla, y los números de arriba lo siguen usando cuando el listado es
de una invitación que no se abre por persona.

**Y los dos números de arriba salen de listas distintas a propósito**:
"Respuestas" cuenta familias (las filas de la planilla) y "Vienen" cuenta
**las filas dibujadas** que dicen que sí — así el número de arriba es
exactamente lo que se ve abajo. Si dijera otra cosa que lo que está
dibujado, el que mira no sabe a cuál creerle.

Lo mide `pruebas/listado.js`: que dos respuestas (3 personas + 1) den
**4 filas**, que no quede ninguna columna "Invitado 2 / Comida 2" a lo
ancho, que cada fila lleve SU comida, que diga el grupo, que los tres
números sigan separando gente de respuestas, y que **el Excel se baje con
esas mismas filas** — medido interceptando el archivo, no contando otra
vez las filas de la tabla, que daría verde con el Excel roto porque
estaría midiendo dos veces lo mismo. Contra el código publicado da
**6 fallas**.

#### Un mensaje para Mia

Pedido del dueño: *"estaría bueno que le pongas mensaje, una pestaña
para escribirle un mensaje o deseo"*. Es un `textarea` al final del
formulario, opcional, con tope de 500 caracteres.

**NO se apaga al contestar que no viene**, que es lo contrario de lo que
hace el resto del formulario: el que no llega es justamente el que más
quiere dejar escrito algo, y esconderle el campo ahí es perder el
saludo. Por eso no está en `soloSiViene`, y hay una comprobación para
las dos mitades —que se vea Y que viaje— porque esconder bien y mandar
mal da verde igual.

**En el tablero aparece UNA sola vez**, en la fila del que contestó. Con
una fila por persona, un mensaje largo repetido en las de sus
acompañantes son tres párrafos iguales uno abajo del otro — el mismo
relleno que el dueño ya había sacado. La regla quedó general: lo que
contestó la respuesta (cuándo, el tema, el mensaje) va solo en su fila;
**el sí/no es la excepción** y va en todas, porque vienen o no vienen
todos.

**Y el aviso del artículo 6 tuvo que cambiar con el campo.** Decía que
lo que se escribe se usa "solo para organizar la fiesta: saber cuántos
son, armar las mesas y pasarle al salón las comidas especiales" — un
mensaje para la cumpleañera no es ninguna de esas tres. Ahora lo dice.
Si se agrega una pregunta, ese párrafo se mira: es lo que convierte al
aviso en verdadero o en una formalidad que miente.

**La del tablero es un guardián de regresión** (contra el código
anterior da 1 falla: el mensaje repetido en las tres filas). **La de la
invitación es una verificación**: si el campo no está, lo dice y no
mide — vale para mia15, no impide que alguien lo saque.

#### La portada volvió a ser tipográfica, y el 15 se llena de tinta

A la clienta **no le gustó la foto de portada** (18/10/2026), así que
`CONFIG.portada` quedó vacío un rato y con eso volvió la portada
tipográfica — **el mismo día se arrepintió y la foto está de vuelta**
(ver más abajo); lo de acá queda escrito porque el camino tipográfico
sigue entero y vaciar esa línea es volver a él — que para esto se dejó entera y probada: el camino con
foto sigue completo, es una línea volver. De la galería salió además
**la foto de Mia más grande**: quedaron las dos de chiquita, y así la
sección entera dice una sola cosa —"la que era"— en vez de tres fotos
sueltas. Los dos archivos se borraron del repo: una foto de una menor
que ya no se usa, sentada en una dirección pública, es peso y es
exposición sin nada a cambio.

**La animación de portada**, pedida con esas palabras: *"qué idea
podemos hacer para alguna animación de portada, así ponemos algo con
onda"*. El 15 entra **dibujado en oro** y la tinta negra lo llena **de
abajo hacia arriba** en 1,8 s, como un sello que se apoya en el papel.
Pasa una vez y después no se mueve nada.

**Son DOS capas y no un color que cambia**, y el motivo no es de
gusto. Con `background-clip:text` —que es la forma obvia de hacer que
un relleno suba por adentro de una letra— el relleno viaja en el
fondo y el `color` del texto queda en `transparent` **para siempre**:
el medidor de contraste lee el color, no lo que se ve, así que
informaría el "15" a 1,00:1 y tendría razón según lo que mide. Es la
misma trampa del "15" en contorno de `mateoylucas`. Con dos capas
cada una tiene su color de verdad: la de abajo es el oro que SE LEE
(4,6:1 sobre el papel) y la de arriba es la tinta, recortada con
`clip-path` y declarada decoración (`aria-hidden` +
`pointer-events:none`), que es como el medidor saltea un adorno sin
quedarse ciego. La suite sigue midiendo 85 textos.

El oro de la capa de abajo **lo pone el JS** al armar la de arriba:
sin JS no hay animación y el 15 es negro, que es el estado bueno. Con
"menos movimiento" tampoco se crea la capa.

**Dos selectores que se rompieron solos al agregar esa capa**, y las
dos son la misma lección —*agregar un nodo cambia a quién le pega un
selector*—:

- **`.quince-big span:last-child`** dejó de matchear el "5": la capa
  de tinta es el último hijo del `h1`, así que el "5" de abajo perdió
  su margen negativo y **las dos capas quedaron corridas 8px** una de
  otra. Va `span + span`.
- **`.quince-big.con-tinta span{color:var(--oro)}`** le llegaba
  también a las cifras de ARRIBA —son descendientes del mismo `h1`—
  y la tinta no se veía nunca: la animación corría perfecta y el 15
  quedaba dorado de principio a fin. Va `> span`.

Y el manuscrito de abajo entra con el **interletrado cerrándose**
(.08em → 0 en 1,4 s): la misma idea de que algo se asienta, en el
renglón de al lado.

#### Una foto que no carga se va, no deja el cuadrado roto

Lo reportó el dueño con una captura, y es lo que se ve cuando chocan las
dos cosas de arriba: el HTML viejo, servido por el
`stale-while-revalidate`, pidiendo `fotos/portada.webp` y `fotos/1.webp`,
que ese deploy había borrado. **Dos cuadrados grises con un `?`**, uno
arriba de todo en la portada y otro adentro del pasepartú dorado.

**No tiraba ningún error de JavaScript y las pruebas daban verde**: una
imagen rota es un dibujo del navegador, no una excepción. Es la familia de
siempre —*se dibuja perfecto y está mal*— y por eso ahora se mide.

Arreglado el caché, esto no debería volver a pasar; se pone igual porque
**la próxima vez que se saque una foto va a volver a pasar durante el
minuto del `max-age`**, y porque un archivo puede faltar por cualquier
otro motivo.

- En el pase, la foto que no carga **se saca, y se saca su puntito**: un
  punto que no lleva a ninguna foto es la misma mentira más chica. Si no
  queda ninguna, se esconde la sección entera, que es exactamente lo que
  ya hacía `CONFIG.fotos` vacío — un marco dorado alrededor de nada es
  peor que no estar.
- **Qué foto es cada punto se pregunta al TOCAR**, no se captura al
  dibujar: sacada una, las de atrás se corren un lugar y el número
  guardado señalaría la equivocada.
- **A la que ya falló hay que preguntarle.** Si la imagen se cayó antes de
  que llegáramos a escuchar, el evento `error` no vuelve a dispararse
  nunca: se mira `complete && !naturalWidth`.
- En la portada, si falta la foto se vuelve a la **portada tipográfica**,
  que se sostiene sola. Y hay que **volver a rasgar**: el borde del pie de
  la portada se saltea justamente cuando hay foto, así que sacada la clase
  `con-foto` quedaría una juntura recta entre el negro y el papel. Por eso
  ese bloque dejó de ser un IIFE y es `rasgar()`, que **primero borra los
  rasgados que ya estaban** — corrido dos veces sin eso, quedan dos
  pegados.

Lo mide `pruebas/invitacion_mirar.js` haciendo que el servidor conteste
404: una foto, después todas, y después la de la portada (encendida
interceptando el HTML, igual que `puertas.js` con `MUESTRA_MURO`, porque
mirar la constante publicada ataría la prueba a lo que hoy está elegido).
Contra el código anterior da **5 fallas**.

**Y esa prueba primero no medía nada.** Preguntaba `window.CONFIG` para
saber cuántas fotos declara la invitación, y `CONFIG` es un `const` de
script: **no cuelga de `window`**. Daba 0, la prueba se salteaba sola
informando *"esta invitación no tiene fotos: nada que medir"* y la suite
quedaba verde. La caja de 0x0 otra vez, disfrazada de atajo amable.

#### Volvió la foto de portada, y la animación tuvo que cambiar

La clienta la sacó el 18/10/2026 y el mismo día se arrepintió. La foto
**se recuperó del historial** (`git show 11335bc~1:mia15/fotos/portada.webp`)
en vez de recortarla de nuevo de la captura: es el mismo archivo que ya
estaba recortado —sin el marco de la historia, sin el globo de respuesta y
sin la foto de perfil— y ya medido. Recortar otra vez era rehacer a mano un
trabajo que estaba hecho, y con el riesgo de que saliera distinto.

**Y el pedido era que la animación del 15 se mantuviera.** Estaba apagada
justo en ese caso: `if (!h || CONFIG.portada) return`. O sea que poner la
foto la perdía sin que nada avisara.

**Encenderla tal cual no servía, y el motivo es de medición.** Sobre el
papel el 15 entra en ORO y la tinta lo llena; sobre la foto el 15 termina
en CREMA con borde de oro, así que el relleno habría sido negro sobre un
15 claro: no lo llena, lo borra. Y el camino obvio —oro abajo, crema
llenando— **falla de verdad**: medido con el píxel más claro debajo del
15, el fondo cambia con la pantalla (gris medio `121,120,120` en un iPhone
SE, casi negro en un Max) y ahí el oro da **2,31:1**. La suite lo agarró
sola: *"sobre la foto no se leen: 2,96:1 «1» · 2,93:1 «5»"*.

Probados los seis colores de la paleta contra ese fondo, **el único que
pasa de 3:1 en los cuatro aparatos es la crema** — o sea el color con el
que el 15 TERMINA. Sobre esta foto no existen dos colores que se lean.

Así que sobre la foto **el 15 no cambia de color: se revela** de abajo
hacia arriba, en su crema de siempre y con su borde de oro, con el mismo
recorte y el mismo tiempo. Es el mismo gesto —algo que sube y se asienta—
y es el único que no le apuesta la legibilidad a dos segundos. De paso no
crea ninguna capa: lo que se anima es el `clip-path` de las propias
cifras, así que el color que mide el medidor es el de verdad.

**La tentación que había que esquivar**: dejar la crema abajo (que mide
7,31:1) y poner el oro de capa de ARRIBA, declarada decoración. El
medidor habría dado verde y el que mira habría visto igual dos segundos
de oro a 2,31:1. Esconderle un color al medidor no es arreglarlo — es la
misma trampa que este archivo ya tiene escrita tres veces.

Lo mide `pruebas/invitacion_mirar.js`, **con el píxel y no con una clase**:
cuenta cuánta tinta clara hay dibujada adentro de la caja del 15 a los 0,7 s
y a los 3,3 s. Así da igual cómo esté hecha la animación —dos capas de
color o un recorte— y lo que se comprueba es lo único que importa: que el
15 entre y termine entero. La foto se **fuerza interceptando el HTML**, no
se lee de `CONFIG.portada`: si mirara la constante publicada, el día que
se vacíe la prueba dejaría de medir y nadie se enteraría. Contra el código
publicado da **1 falla**: *"el 15 NO se anima con foto: 4268 → 4312
píxeles, no se movió"*.

#### El pie es la puerta de entrada del próximo cliente

*"Cuando toquen Click Eterno que vayan directo al WhatsApp y que me
diga de qué invitación viene"* (18/10/2026). Es el único renglón
nuestro en toda la invitación y es por donde entra el que la recibe
y le gusta. Llevaba a la página de inicio: de ahí hay que encontrar
el botón, elegir el servicio y recién entonces escribir. Ahora abre
el chat con el mensaje puesto —*"Vi la invitación de Mia y quiero
consultar por una invitación para mi fiesta"*— y el nombre sale de
`CONFIG.quien`, no escrito a mano: la próxima invitación que se
copie de ésta lo trae bien sin que nadie se acuerde de cambiarlo.
Es la misma decisión que ya estaba tomada en los botones de la
página pública: *el que escribe ya eligió, y del otro lado se sabe
qué pide sin tener que preguntarlo.*

El `href` del HTML sigue apuntando al sitio a propósito —si el JS no
corre, el enlace lleva igual a algún lado— y **el logo de WhatsApp se
pone en el mismo lugar donde se arma el enlace**: sin JS el enlace va
al sitio, y ahí un logo de WhatsApp sería una promesa que no se
cumple.

#### Tocar un punto NO detiene el pase de fotos

*"Que la foto vaya pasando sola así la gente no tiene que clickear
en vano."* La primera versión paraba el pase al tocar un punto, y el
motivo parecía bueno: que la foto elegida no se fuera a los tres
segundos. El resultado fue el contrario. El que toca un punto —y el
dueño fue el primero— deja la cinta clavada para siempre y se va
creyendo que **las fotos no pasan solas**; y el que no toca nada,
que es casi todo el mundo, nunca se entera de que podía tocar. Ahora
el toque lleva a esa foto y **reprograma** el pase con una espera más
larga (7 s en vez de 4,2).
Va con un `setTimeout` que se vuelve a programar y no con un
`setInterval`: la espera larga vale una vez y vuelve sola al ritmo
de siempre. Con un intervalo habría que tirarlo y crear otro, y el
largo quedaría puesto para siempre.
Medido: entra en la 1, a los 4,6 s está en la 2, a los 9 en la 3;
tocando la 1 sigue en la 1 a los 4 s y **a los 8 ya pasó sola**.
Contra el código anterior, ese último paso no ocurría nunca.

#### El borde dorado de los títulos

Pedido del dueño: *"a las letras le pones borde dorado, a todas las
que tengan fuente blanca y sean títulos"*. Son los que caen sobre
negro —el "15" y la fecha de la portada, los títulos de las bandas
oscuras, el salón, el alias y el "Mia" manuscrito del cierre—; los
que están sobre el papel ya son negros y no llevan nada.

Dos cosas que no son opcionales, y las dos dejan la pantalla sin un
solo error:

- **`paint-order:stroke fill`, o el borde se come la letra.** Sin
  eso el trazo va CENTRADO sobre el contorno y se mete la mitad para
  adentro: en una Yeseva, que ya tiene partes finas, los finos se
  cierran y la palabra se empasta. Por eso todo vive adentro de un
  `@supports (paint-order: stroke)`: el navegador que no lo tenga se
  queda con la letra crema de siempre —que se lee perfecta— en vez
  de con una letra empastada. Es la regla del `animation-timeline`
  otra vez: **el estado por defecto tiene que ser el bueno.**
- **El grosor va en `em`, y el `em` es el del ELEMENTO.** El tamaño
  del "15" no vive en el `h1`, vive en el `span` de adentro: puesto
  en el padre, `.022em` se resuelve contra los 32px del `h1` y sale
  un hilo de **0,70px en un número de 140**. Se ve igual que si el
  borde no se hubiera puesto, y en una captura chica no se nota.
  Pasó, y lo agarró la prueba.

Por eso `invitacion_mirar.js` mide ahora los bordes de letra, y solo
donde hay: que el trazo resuelto llegue a 0,8px —abajo de eso es una
declaración que no hace nada— y que haya `paint-order:stroke`.
Verificada rompiendo las dos cosas a propósito: el borde en el `h1`
da 4 fallas (una por aparato) y sin `paint-order` da 8.

**El grosor se subió una vez** (18/10/2026): *"es muy sutil, ponele
un poquitito más"*. De `.05em` a `.072em` en los títulos y de
`.022em` a `.033em` en el "15" — en pantalla, de 1,25px a 1,80 y de
3,1 a 4,6. El manuscrito del cierre va aparte y más fino
(`.026em`): la Pinyon tiene hairlines de un píxel y el mismo grosor
que en una capitular se las come.

**Lleva `noindex`, y es la primera invitación que lo lleva.** Son
fotos de una menor en una dirección pública. El `noindex` no la
esconde —el que tiene el link entra igual— pero la saca de los
buscadores, que es por donde llega el que no fue invitado. La imagen
de la vista previa sigue siendo la tipográfica: la cara de Mia
viajaría en cada chat por el que pase el link, que es la misma
decisión ya escrita para `muro.html` y `rollo.html`.

**Es la primera invitación con el aviso del artículo 6** adentro del
formulario. Acá hace falta de verdad: se piden nombres de invitados
y comidas especiales, que es información de salud.

### `almi15/`: la segunda invitación de un cliente

19 de junio de 2027, La Mansión del Rey, de 21 a 4 h. Quince años.
Lo que pidió: **la misma que la de Pia** —*"misma paleta de colores
pero con otras animaciones"*—, dress code **formal**, alias
`nancyvaldez1976`.

**La paleta y las letras son las de Pia, tal cual** (`--vino`,
`--rosa`, `--oro`, Cormorant Garamond + Jost). Lo que NO se copió de
Pia son los **IDs**: van los de `mia15` (`#abrir`, `#cD`…`#cS`,
`#calendario .elDia`, `#rsvp`, `#fNombre`, `#fLugares`, `#fComida`,
`#fMensaje`, `#enviar`, `#aviso`), porque son los que mide
`pruebas/invitacion_mirar.js`. Una invitación con los nombres de Pia
se dibuja igual y **la suite la mide a medias**: lo que no encuentra
lo informa como "esta invitación no tiene eso" y queda verde.

**Y la confirmación es la de mia15 entera**, que es la única medida
contra una fiesta de verdad: una comida POR PERSONA, el que dice que
no no manda "Cuántos: 4", el mensaje sigue a la vista aunque conteste
que no, y un solo viaje al Apps Script.

**Lo que tiene de distinto es el movimiento**, que es lo que se pidió.
Son cuatro y todas pasan una vez o van atadas al scroll: la **solapa
del sobre** se abre sobre su bisagra y la tarjeta sale de adentro; el
nombre **cierra su interletrado** (.26em → el suyo) mientras el hilo de
abajo se abre desde el centro; cada bloque se revela como un **telón
que sube** (`clip-path`) en vez de subir él; y el **anillo del día del
calendario se dibuja** (`stroke-dasharray` con el perímetro de verdad).
Las cuatro se apagan con "menos movimiento" y el estado por defecto —el
que se ve sin JavaScript— es el bueno.

**El telón se escondía tan bien que no se destapaba nunca, y de paso
se comía los clics.** Esto costó la vuelta entera y es una trampa
nueva: Chrome **tiene en cuenta el `clip-path` para calcular la
intersección**, así que un bloque recortado a cero NO INTERSECA, el
`IntersectionObserver` no lo ve y no le pone nunca su `.entro`. Y un
recorte a cero tampoco responde a un dedo: el formulario entero estaba
dibujado ahí abajo y **no se podía tocar ni el "Sí" ni el botón de
confirmar**, sin un solo error en la consola. Se arregla observando la
**sección**, que no está recortada, y que sea ella la que destapa a los
suyos. La regla, para la próxima: **el que se mira no puede ser el que
se esconde.**

**Y un control escondido se esconde, no se desconecta.** El radio de
`¿Vas a asistir?` se achica a 1x1 detrás de su label —el blanco del
dedo es el label, que mide 52— y llevaba además `pointer-events:none`.
Con eso el navegador no se lo puede dar a nadie: marcar la opción con
el teclado deja de andar, y desde una prueba es imposible. Alcanza con
achicarlo y dejarlo transparente.

**El oro no es el mismo en las dos mitades.** `--oro` (#B8935A) vive
sobre el vino y ahí se lee 5,5:1; sobre el papel claro da **2,38:1**, o
sea que el rótulo de cada sección clara no estaría. Las secciones
claras usan `--oro-tierra` (#8A6B39, 4,45:1). Es *si un bloque trae su
propio fondo, trae su propia tinta* otra vez — y vale la pena mirarlo
en la de Pia, que tiene el mismo rótulo dorado sobre el mismo papel.

**Y el botón principal es un dorado MACIZO, no un degradé.** El
medidor de contraste no juzga lo que cae sobre un degradé opaco de
punta a punta: con el degradé de Pia, el texto del botón es
exactamente un bloque que la suite no puede medir. Sólido, se mide y
da 9:1.

**Lo que NO se escribió porque no lo mandó la clienta**: la fecha
límite para confirmar (vacía no dibuja el renglón, no se inventa una),
y el **titular de la cuenta** del alias — el nombre que le va a mostrar
el banco al pegarlo. Un nombre inventado al lado de un alias es peor
que ninguno, así que ese renglón no existe hasta que llegue.

**`almi15/listado/` todavía no existe, y eso está bien.** Se crea el
día que exista la dirección `/exec` de su planilla: copiar la plantilla
y llenarle las dos líneas de `CONFIG`. `pruebas/invitaciones.js` falla
si una carpeta de listado tiene el `appsScriptUrl` vacío, porque esa
pantalla no traería nada. Mientras tanto `CONFIG.endpoint` de la
invitación está vacío y la confirmación **dice con todas las letras que
no se manda a ningún lado**.

**No está en la galería de Trabajos ni en `/invitaciones`**, por lo
mismo que mia15: es la fiesta de una clienta de verdad, lleva `noindex`
y en el formulario se juntan nombres de invitados y comidas. La página
que se le manda a cualquiera que pregunta muestra las muestras
nuestras, no las fiestas de los clientes.

**Lleva su propia `og.jpg`** (1200x630, 24 KB), tipográfica como la de
mia15: nunca una foto de la fiesta, que viajaría en la vista previa de
cada chat por el que pase el link.

#### La segunda pasada: "es muy básica y de poco vuelo"

El dueño la miró publicada y la bajó entera, con cinco reparos y ninguno
de gusto: *"la presentación es mala. El sobre debería tener mejor
animación. Que se vea la carta por fuera queda feo. La portada debería
ser más linda. Necesito que haya mejor desmarque entre cada sector.
Quiero emoticones más lujosos y con animación. Es muy básica y de poco
vuelo."* Los cinco se arreglaron y los cinco dejaron algo escrito.

**1 · La carta se veía por fuera, y el motivo es de geometría.** Un
sobre cerrado se dibujaba con DOS capas —el cuerpo y la solapa en
triángulo— y el triángulo se angosta hacia abajo: por los dos costados
de arriba asomaban dos cuñas de papel crema. Un sobre de verdad tiene
**cuatro pliegues** en la espalda: el grande de arriba, dos laterales y
el de abajo. Puestos los cuatro no queda un solo punto por donde se vea
lo de adentro. Es el mismo error que *una caja de 0x0 pasa todas las
cuentas*, al revés: lo que no se tapa, se ve.

**2 · El sobre se abre de verdad.** El sello se apaga, la solapa gira
sobre su bisagra (`rotateX`, con `perspective` en el padre), la carta
—con su monograma— sale de atrás del frente, el sobre se acerca un
paso y recién ahí se funde. **Y el `z-index` de la solapa cambia a los
0,45 s**: una solapa abierta va DETRÁS de la carta. Cambiado de entrada,
la carta se ve un cuadro antes de que la solapa se mueva; no cambiado
nunca, la carta sale tapada por el triángulo y el gesto no se entiende.
`z-index` no se interpola, pero `transition:z-index 0s linear .45s`
hace el salto en el momento justo.
**El fundido arranca cuando la carta YA salió.** Pisados, se ven las dos
cosas a la vez —el sobre translúcido encima de la portada— y eso no se
lee como una transición sino como una pantalla a medio cargar.

**3 · El desmarque entre secciones es una CURVA, no un borde.** Cada
sección sube sobre la anterior con un radio en porcentaje —una elipse
achatada— y apoya una filigrana en la cumbre. Dos franjas de color
pegadas por una línea recta se leen como una página web; una curva con
su ornamento se lee como que empezó otra cosa. No pesa nada, no se
pixela y se adapta a cualquier ancho.
**El marco de la portada tiene que esquivar esa curva**: sin ese
respiro, la cumbre del arco le come las dos esquinas de abajo y el
filete termina cortado contra una curva que no es suya.

**4 · Los medallones.** Siete iconos de línea —reloj de arena,
calendario, pin, vestido, regalo, sobre, destello— adentro de un anillo
con dos rombos, y **el anillo y el icono se dibujan solos** al entrar la
sección, con el largo REAL de cada trazo (`getTotalLength`). Se dibujan
en el JS desde una tabla y no se escriben siete veces en el HTML. El
color lo pone la banda, así que el mismo dibujo se lee sobre el vino y
sobre el papel.

**5 · El marco de la portada se dibuja, y por eso son cuatro líneas y
no un `border`.** Un borde de CSS no se puede recorrer: o está o no
está. Cuatro rayas de un píxel que se estiran en cadena —arriba,
derecha, abajo, izquierda— es el gesto de alguien trazando el marco con
una regla, y cuesta cuatro divs. Las cuatro esquinas floreadas entran
después. Sin JS quedan enteras, que es el estado bueno.

**Y la cascada de la portada entra AL ABRIR EL SOBRE, no al cargar.**
Con el sobre encima, una animación que corre detrás no la ve nadie: se
gasta el único momento de sorpresa que tiene la pieza contra una capa
opaca. Por eso el observador saltea la portada mientras el sobre exista
y es el sobre el que la destapa. Es la misma decisión que ya estaba
tomada en `mia15/`.

**Y volvió a aparecer la de siempre, por enésima vez**: la tarjeta de
papel crema vive adentro de una sección oscura, así que el botón de
contorno heredaba ahí una tinta pensada para el vino y daba **1,55:1** —
o sea que "Copiar alias" no estaba. *Si un bloque trae su propio fondo,
trae su propia tinta.* No lo vio el ojo: lo agarró el medidor.

#### Las fotos, y el sobre que se abre de verdad

Tercera pasada, con tres fotos que mandó el dueño y una captura de otra
invitación como referencia: *"La primera foto va en la portada. El sobre
mejorarlo. Busca una animación de apertura que sea copada y no tan
genérica. La segunda foto va antes de la ubicación... quiero que quede
como la tercera foto. Y la cuarta foto quiero que sea en el final con el
'te espero'."*

**Las tres van en blanco y negro, y el filtro está en el CSS.** La paleta
de esta tarjeta son tres colores; una foto a color mete los suyos —el
verde de los árboles, el rojo de la remera— y la pieza deja de ser la de
Pia. En el CSS y no quemado en el archivo: el original queda entero por
si algún día se quiere a color. Es la misma decisión que ya estaba tomada
en `mia15/`.

**La portada va `cover` y no `contain`**, al revés que mia15, y el motivo
es la foto: ésta es apaisada y la pantalla de un teléfono es alta, así que
entera dejaría dos bandas enormes. Lo que se recorta son los costados, no
la cara: el `object-position` la sostiene arriba, que es donde no cae el
texto. **El velo va atado al TEXTO**, no a un porcentaje de la pantalla —
el alto del bloque cambia con el aparato y la raya del degradé no—, y se
hace macizo en el 88% y no en el 100%, porque el borde de abajo de la
foto cae en un punto distinto en cada pantalla.

**Las dos franjas son el pedido de la captura**: una foto a todo lo ancho
con el borde de arriba RASGADO en el color de la sección que viene
arriba, que abajo se funde con la que viene después. No llevan marco ni
título: la foto ES la sección, y por eso la sección que sigue a la
primera franja perdió su curva — la franja ya hace el corte y dos cortes
pegados se leen como un error de maqueta.

Cuatro cosas que costaron una vuelta cada una, y **ninguna tiraba un
error**:

- **La sierra se llenaba del lado equivocado.** El camino rellenaba de la
  cresta para ABAJO, así que entre la sección de arriba y el rasgado
  quedaba una tira de la foto metida en el medio: se leía como una raya
  mal puesta, no como un borde. Va lleno de arriba —del borde de la
  pantalla hasta la cresta— y ahí el rasgado cuelga sobre la foto, que es
  lo que hace la referencia.
- **Una sierra de rectas no es una montaña, es un cotillón.** La primera
  versión eran triángulos y se veía de papel picado. La cresta va con
  curvas y seis cumbres.
- **El camino sale de una SEMILLA fija** —la fecha de la fiesta—, no de
  `Math.random()`: cambiando en cada carga, dos capturas de la misma
  invitación saldrían distintas. Es la regla de `mia15/`.
- **El pie vive FUERA de la franja.** La franja se esconde entera si la
  foto no carga, y con el pie adentro se iría con ella el único renglón
  nuestro de toda la invitación — el que le abre el WhatsApp al próximo
  cliente. Y si esa franja falta, el papel claro del cierre chocaría con
  el pie oscuro en una juntura recta, así que ahí el pie se pone su
  curva: el mismo cuidado que ya costó una vuelta en mia15, donde sacar
  la foto dejaba el borde sin rasgar.

**El sobre: la carta VUELA.** Que la carta salga y el sobre se funda no
es un gesto, es una transición — y eso era lo "genérico". Ahora el sello
se PARTE en dos mitades que se separan y se caen con su polvo de oro, la
solapa gira, la carta sale de atrás del frente y después **se abre sobre
la pantalla hasta que el papel ES la portada**. Cuánto tiene que crecer
lo calcula el JS con la caja de verdad contra la pantalla de verdad: un
número escrito a mano se queda corto en una tablet y se pasa en un iPhone
SE, y en los dos casos se ve el borde del papel cruzando la pantalla a
mitad de la animación. Y el quiebre del sello va en una capa aparte y no
en el botón: moviendo la caja que se toca, el navegador la da por
inestable y una prueba se cuelga treinta segundos contra un botón que
está perfecto.

#### Lo que la prueba de las invitaciones no estaba midiendo

almi15 es la primera invitación PUBLICADA con foto en la portada, y con
eso aparecieron tres agujeros en `pruebas/invitacion_mirar.js`. Los tres
daban verde.

- **"0 renglones sobre la foto" no es un cero, es que no miró.** La
  comprobación que mide con el píxel lo que cae sobre la foto corre
  DESPUÉS de la que recorre la invitación entera para que el observador
  destape, así que la pantalla estaba en el pie: la portada quedaba fuera
  de la vista y todos sus renglones se descartaban por estar arriba. Se
  vuelve al principio antes de medir. Con eso pasó de 0 a **3 renglones
  en almi15 y 7 en mia15** — o sea que esa comprobación llevaba desde que
  se escribió sin medir un solo píxel de mia15 tampoco. Es la caja de 0x0
  otra vez, con el scroll en el medio.
- **Contaba las fotos de una sola manera.** Miraba `CONFIG.fotos` —el
  pase de mia15— y no las franjas, así que una invitación con franjas se
  salteaba sola informando *"no tiene fotos"*. Ahora cuenta las dos, y
  con todas las fotos caídas exige además que **no quede un solo cuadrado
  roto dibujado en ningún lado** y que las franjas se escondan enteras.
  Verificado rompiéndolo a propósito —dibujando la franja antes de saber
  si la foto cargó—: da 2 fallas.
- **Le exigía bordes rasgados a una invitación que no los usa.** El
  rasgado es la forma que eligió mia15 para el corte; almi15 lo resuelve
  con una curva. Lo que hay que medir es que la que LOS USA no se quede
  sin ellos al volver a la portada tipográfica; exigírselos a una que no
  los tiene es inventar una falla.

#### La letra, los medallones y el deslizar

Cuarto reporte del dueño, mirándola publicada: *"El sobre dice A. Podría
decir te invito a mi fiesta. Después me gustaría que haya otra fuente.
Algo más redondeado y más legible. No tan finita como la que está. Me
gustaría que haya unos iconos más llamativos y algo de animación al
deslizar. Para que no sean genéricas."*

**La carta dice lo que tiene que decir.** Era una inicial; ahora dice
*"Te invito a mi fiesta"*. Se ve un segundo —mientras sale del sobre y
se abre sobre la pantalla—, así que va corta y grande: una frase larga
ahí no la lee nadie.

**La letra: Cormorant Garamond + Jost → Fraunces + Hanken Grotesk.** Es
el mismo diagnóstico que ya está escrito para la página pública, ahora
en una invitación: la Cormorant es una **didone** —el contraste entre el
trazo grueso y el fino es enorme a propósito— y en un teléfono los finos
se parten; la Jost tiene la **equis baja**, así que el texto chico
parece más chico de lo que es. Fraunces es una serif de trazo parejo y
formas redondas, con bastardilla de verdad, y Hanken Grotesk tiene la
equis alta. **Los pesos subieron un escalón** (300 → 400, 400 → 500),
que es la otra mitad de "no tan finita", y lo que se pide en el link es
exactamente lo que usa el CSS: un `font-weight` que no esté pedido se lo
inventa el navegador y eso no avisa.

**Las dos familias viven en DOS VARIABLES** (`--titulos`, `--texto-f`).
Estaban escritas quince veces en el CSS; cambiarlas a mano es garantizar
que alguna se quede atrás y la pieza muestre dos letras para la misma
cosa. Además es lo que hace posible lo que sigue.

**`pruebas/letras.js`: mostrar la tipografía, no describirla.** Ya está
escrito más arriba que con mia15 se cambió la familia por descripción
tres veces y las tres no era, y que a la cuarta se montó la misma
portada con siete letras y eligió mirando. Eso ahora es un comando:
`node pruebas/letras.js <carpeta>` arma la invitación con cada pareja
candidata y deja las capturas. **Las fuentes van INCRUSTADAS en base64 y
no es un lujo**: desde acá el navegador rechaza `fonts.googleapis.com`
—el proxy firma los certificados—, así que una captura hecha sin eso
sale con la letra de respaldo del sistema y muestra justo lo que no es.
Se bajan con `fetch`, que sí pasa por el proxy. La primera corrida salió
con Georgia en las cuatro y parecían todas iguales.

**Los medallones.** Eran contorno puro de un píxel: un plano, no una
insignia. Ahora llevan un disco de oro a muy poca opacidad —el mismo oro
del contorno, así que no mete un color nuevo—, un anillo de afuera
punteado, cuatro rombos macizos en vez de dos, y el trazo del icono pasó
de 1 a 1,7. **El anillo punteado NO se dibuja**, y no es un olvido: el
dibujo anima el `stroke-dasharray`, que es justamente lo que le da los
puntos. Las dos cosas en el mismo trazo se pelean y gana una.

**Lo que se mueve al deslizar: las fotos se quedan atrás.** La página
sube y las franjas suben más despacio, así que la foto parece estar
detrás del papel en vez de pegada a él. Es el único efecto de la pieza
que no pasa una sola vez, y por eso va **atado a la posición y no a un
reloj**: si frenás a mitad de camino, frena ahí. Un solo oyente con
`requestAnimationFrame` y `passive`.

Tres cosas de eso que no son opcionales:

- **La foto es más alta que su marco** (126%, corrida −13%). Sin ese
  sobrante, al correrla queda un hueco arriba o abajo, y un hueco en el
  medio de una foto a sangre se lee como un error de carga.
- **La portada queda AFUERA del paralaje.** Su foto ya tiene el zoom
  lento, que es un `transform`, y dos cosas peleando por la misma
  propiedad es una que gana y otra que desaparece. Moverle la caja
  tampoco sirve: el velo que hace que el texto se lea es un `::after` de
  esa caja y se iría con ella.
- **Se mide lo que importa: que la foto esté corrida DISTINTO en dos
  puntos del scroll** (−52 → 54 px), no que exista una clase ni un
  oyente. Así da igual cómo esté hecho. Apagado el paralaje, da 1 falla.

**Y una que dejó la letra nueva al pasar**: el enlace del pie medía
43,6px de alto y dejó de llegar al mínimo de 44. El `padding` estaba
calculado contra la altura de UNA tipografía, así que dejó de valer el
día que se cambió la tipografía. Se ve igual y no se toca igual; lo
agarró la prueba, no el ojo.

#### La frase de la portada, y el velo que hubo que volver a medir

*"Que en la portada diga alguna frase como te invito a festejar esta
noche inolvidable o algo así."* Dice **"Vení a festejar conmigo una
noche inolvidable"**, y el cambio de arranque no es de gusto: *"Te
invito"* es lo que dice la carta del sobre, que el que mira acaba de
ver dos segundos antes. Dicho dos veces seguidas se lee como un error
de copiar y pegar, no como una invitación; así la segunda continúa a la
primera.

**Y agregar dos renglones sobre una foto corrió todo el bloque hacia
arriba, a la parte clara de la cara.** El nombre pasó de 5,85:1 a
**2,58:1 en un iPhone SE** — o sea que "Almi" dejó de estar—. No se ve
en un escritorio, donde la pantalla es más alta y el bloque no sube
tanto: lo agarró la medición con el píxel, en el aparato más chico.
El velo hubo que volver a repartirlo y volver a medirlo hasta 4,28:1,
que es cómodo sin apagarle la cara a la foto.
**La regla, que vale para cualquier invitación con foto a sangre: un
renglón que se agrega encima de una foto no es sólo un renglón más — es
todo lo que estaba abajo, subido.** El velo se vuelve a medir cada vez
que cambia el texto de la portada.

#### Dos caras tapadas, y por qué el recorte no se elige por el ancho

*"La foto de portada está muy tapada la cara con las letras. Y la del
final está tapada la cara con el zócalo blanco."* Las dos son el mismo
error con dos disfraces: **se encuadró la foto sin mirar qué le cae
encima**.

**La portada.** Con `cover` en una pantalla alta la foto se escala por
el ALTO, así que `object-position` vertical **no hace nada**: la cara
queda donde la puso el fotógrafo, y ahí es justo donde va el nombre.
Se arregla moviendo la caja de la imagen (`top:-17%`), no la posición
del objeto. Lo que sube es la cara; abajo queda la ropa, que es donde
el velo y las letras no tapan nada.

**Y en una pantalla BAJA volvía a pasar**, porque el bloque de texto
mide casi lo mismo en todas y en 568px de alto se lleva la mitad de la
pantalla. Abajo de 720px de alto la portada achica un escalón —el
nombre, los aires, el pie— y la foto sube más. **El recorte no se
elige por el ancho: se elige por lo que queda libre arriba.**

**La franja del final.** Ahí el culpable no era el rasgado sino el
**sobrante del paralaje**: la foto es más alta que su marco y lo que
se recorta arriba es exactamente la cabeza. Se bajó el sobrante de 26%
a 16%, se recortó la foto de origen con aire arriba —130 píxeles más
de espejo— y la cresta quedó menos honda. Un borde que cuelga sobre
una foto tiene que ser un borde, no una tapa.

**La lección, y es la tercera vez que aparece en esta invitación**: una
foto encima de la cual va a caer texto —o un borde, o una curva— no se
encuadra mirando la foto. Se encuadra mirando la pantalla terminada, y
en el aparato más chico, que es donde el texto pesa más.

#### El sobre se va cuando la carta sale, y la portada se limpia

*"Cuando sale la carta del sobre y hace la animación debería desaparecer
el sobre"* y *"en la portada borrá toda la info del salón y del día
porque eso está más abajo"*.

**El sobre.** Se fundía la capa ENTERA —carta incluida— recién al final,
así que la carta se abría sobre la pantalla con el sobre todavía
dibujado detrás: dos cosas pasando a la vez, no una transición. Ahora el
fondo y el papel del sobre se funden apenas la carta arranca a volar, y
lo único que queda en pantalla es la carta creciendo sobre la portada.
**Por eso el fondo vive en su propia capa** (`#sobre:before`) y no en
`#sobre`: fundiendo `#sobre` se funde también la carta, que es su hija.
Es la misma forma del problema que ya está escrita para el `z-index` de
la solapa — *lo que se mueve no puede ser lo que se esconde*.

**La portada.** Salieron la fecha, el salón y el horario: los tres están
más abajo, cada uno en su sección con su medallón. Quedan el nombre, "mis
quince años" y la frase. **Y eso destapó la cara sola**: con tres
renglones menos el bloque bajó, así que la foto volvió a subir mucho
menos (de −17% a −8%) y se ve la cabeza entera. De paso el texto pasó a
caer sobre la ropa y no sobre la piel: el contraste sobre la foto subió
de **4,28:1 a 11,3:1**.
**La regla, al revés de la de más arriba**: sacar un renglón de una
portada con foto tampoco es sacar un renglón — es todo lo de arriba
bajando, y el encuadre se vuelve a mirar.

#### La carta no salta a la portada: el cruce

*"Me gustaría que sea menos brusca la transición de la carta y la
portada."* La carta volaba **creciendo hasta 6,1x** —o sea hasta tapar
la pantalla entera— y recién ahí se cortaba a la portada, que estaba
puesta en opacidad 1 desde el primer cuadro. Son dos pantallas pegadas
con un corte, y un corte **no tira ningún error**: las dos se dibujan
perfectas y lo único que pasa es que el único momento de sorpresa que
tiene la pieza se siente barato.

Ahora es un **cruce**: la carta crece hasta 2,7x y se disuelve
(1,25 s desacelerando, el fundido entrando a los 0,3), el papel y el
fondo del sobre se van con ella, y la portada **se asienta** —entra al
45% y apenas agrandada (1,035) y llega a su tamaño en 1,1 s—. Medido en
un iPhone: a los 1,3 s la carta va en 2,2x y la portada ya está en
0,77; a los 1,7 la carta en 0,16 y la portada en 0,97. Las dos cosas
pasan **a la vez**, que es lo que hace que no se note el empalme.

**Y la cascada de la portada corría detrás del sobre opaco.** El nombre
cerrando su interletrado, el hilo abriéndose y los bloques entrando
arrancaban en el click: con el sobre todavía encima, **eso no lo veía
nadie** — se gastaba la animación contra una capa opaca. Ahora se
destapa a los 1,05 s, cuando el sobre ya se está yendo. Es la misma
decisión que ya estaba escrita para `mia15/`, que no se había aplicado
acá.

**Lo que se mide es el CRUCE, no una clase ni un tiempo.** La suite
muestrea cada 150 ms desde el click y pide tres cosas: que haya al
menos dos instantes en que la portada esté **a medio camino con el
sobre todavía en pantalla** (si no, aparece de golpe), que la carta no
pase de 4x (si crece más, tapa todo y lo que se ve es un corte), y que
al final no quede nada a medias. Así da igual cómo esté hecho. Contra
el código anterior da **2 fallas**: *"la portada APARECE de golpe"* y
*"la carta se agranda hasta 6.1x"*.

### `ambar15/`: la tercera de un cliente — Ámbar Zoe Balbi

10 de abril de 2027 · La Mansión del Rey · de 21 a 4 h. Quince años.
Alias `ambar.balbi.rc`, dress code **Elegante sport**, y los colores de
la fiesta —**rosa, negro y plateado**— que ella mandó escritos a mano.

**La carpeta se llamaba `nueva15` y se renombró el día que llegó el
nombre**, que era exactamente para lo que se había dejado así: la
dirección es `clicketerno.com.ar/ambar15` y el link todavía no se había
repartido. Un link repartido no se puede mover; uno que nadie tiene, sí.

**La referencia la eligió la clienta** y la mandó el dueño: dos
capturas y un video de TikTok de una invitación de Etsy, todo en la
estética de **Victoria's Secret** — rayas rosa y blanco, encaje negro,
moño de raso, perlas, y una foto adentro de un óvalo con alas. El
pedido fue *"hacela igual pero con nuestro estilo para que no sea copia
fiel"*.

**Dos cosas de la referencia NO se copian, y no es una opinión:**

- **El monograma de alas con la V y la S es el logo de Victoria's
  Secret**, una marca registrada. Una invitación publicada con el logo
  de otro es un problema nuestro, no de la clienta. En el óvalo va **la
  inicial de ella** —y si no hay foto, esa inicial es el centro de la
  portada—. Visualmente no pierde nada: lo que hace la estética son las
  rayas, el encaje, el moño y las alas, no las dos letras.
- **El moodboard de dress code de la referencia son fotos de personas
  reales sacadas de internet.** Es el artículo 53 otra vez, el que está
  escrito en nuestros propios Términos. Acá el dress code va
  **dibujado** —vestido, taco, cartera, moño—, que dice lo mismo, pesa
  cero y es nuestro. El día que la clienta mande sus fotos, se cambia.

**Lo que se hereda de `almi15`, que a su vez lo heredó de `mia15`**: el
sobre que se abre y la carta que vuela, los medallones, el corte en
curva, y **la confirmación entera** —una comida por persona, el que
dice que no no manda "Cuántos", el mensaje a la vista aunque conteste
que no, y un solo viaje al Apps Script—. Son los IDs que mide
`pruebas/invitacion_mirar.js`: una invitación con otros nombres se
dibuja igual y la suite la mide a medias.

**LOS HUECOS.** Esta salió a propósito a medio llenar: el dueño la
pidió así —*"hacé todo y dejá los huecos así vamos viendo qué
modificar"*— porque la clienta todavía no mandó los datos. Lo que falta
no se inventa **y tampoco se deja en blanco**: cada dato ausente se
dibuja como una **píldora que dice qué falta** (`falta()` + `.falta`),
y la píldora desaparece sola en cuanto el dato existe. Lo que la
enciende es que todavía no haya pestaña de planilla (`CONFIG.evento`
vacío), o sea exactamente "esto es un borrador", así que no puede
quedarse puesta el día que esto se reparta.
Eran cinco —nombre, foto, dress code, alias y titular— y **hoy no
queda ninguna píldora dibujada**: lo que falta son el **titular de la
cuenta** y **hasta cuándo se puede confirmar**, y esos dos no llevan
píldora sino que **no dibujan su renglón**, que es lo que ya hacían
`mia15` y `almi15`. Un renglón que no está no le miente a nadie; una
fecha puesta a ojo le cierra las mesas al invitado el día que no es.

**Y la dirección de la planilla se enciende sola** cuando `CONFIG.evento`
tiene valor. Con dirección y sin pestaña, la confirmación se manda, la
planilla contesta `sin_evento` y el invitado ve un error que no es
suyo: es la misma trampa que ya costó una vuelta en el listado.

Cuatro cosas que costaron una vuelta cada una, y **ninguna tiraba un
error**:

- **`.hueco` ya existía**: es el botón de contorno de las tres
  invitaciones. La píldora de los datos que faltan se llamó `.falta`.
  Es la regla escrita dos veces en este archivo y por poco la piso una
  tercera: antes de inventar un nombre, `grep`.
- **El encaje y el marco de la portada desaparecían.** La portada tiene
  `#portada > *{position:relative}` para que el texto quede por encima
  del velo, y eso le pisaba el `position:absolute` a las dos capas: de
  capas pasaron a ser filas de la grilla, con `justify-items:center` y
  ancho de contenido, o sea **0 de ancho**. La caja de 0x0 otra vez,
  ahora por un selector demasiado ancho. La regla exime a las dos.
- **El ala no se dibuja con trazos.** La primera versión eran cinco
  arcos paralelos y se leía como un rayado; la segunda, cinco plumas
  sueltas, y se leía como dos pestañas. Lo que hace que sea un ala es
  la **silueta**: una sola forma rellena con las muescas de las plumas
  en el borde de abajo, y encima tres hilos claros. Se ve mirando, no
  leyendo el código.
- **Un ancho en `vw` adentro de una sección con padding se sale.** Las
  alas iban `min(440px,92vw)` y la portada tiene su propio padding: 36
  píxeles afuera de la pantalla en un iPhone. Va `width:100%` con
  `max-width`. Un número que depende del padding de otro no se escribe
  dos veces — lo agarró la suite, no el ojo.

**Los iconos son PRODUCTOS DE LA TIENDA**, pedido del dueño con esas
palabras: *"los quiero personalizados con onda Victoria's Secret, como
si fueran de productos"*. Son siete y cada uno sigue diciendo de qué
habla su sección: el reloj de arena **con su moño**, el calendario
**atado con un moño**, el pin **con una perla** adentro, el vestido
**colgado de su percha**, la **bolsa a rayas** (el producto más
reconocible de los dos), el sobre **cerrado con un moño** y el **frasco
de perfume** con su atomizador. La filigrana de cada corte dejó de ser
un rombo y es un **moño entre dos hilos de perlas**.

**El moño es UNO SOLO** (`MONO(cx,cy,ancho,alto)`) y se usa en los
cuatro lugares: escrito cuatro veces, el día que se cambie alguno se
queda atrás y la pieza muestra dos moños distintos para la misma cosa.

Y tres cosas que sólo se ven MIRANDO, no leyendo el código:

- **Un icono con quince líneas a 42px no es un dibujo, es una mancha.**
  La primera tanda tenía percha + vestido + moño + cintura en el mismo
  dibujo y se leía como un borrón. Lo que no se lee a 42 no va.
- **El moño dibujado con dos curvas en S se lee como un garabato
  cruzado.** Son dos hojas que se tocan en el nudo, y el nudo se
  dibuja: sin él son dos gotas sueltas.
- **Una hoja del moño mide 0,75 del ancho que se le pasa.** Con 3,4
  quedaba de cuatro píxeles en pantalla y parecía una nube. Y la bolsa
  con los lados en diagonal se leía como un **tacho de basura**: va
  recta y con las rayas de punta a punta.

**La tarjeta de dress code acepta FOTOS** (`CONFIG.dressFotos`, hasta
cuatro), que es el detalle de la referencia que el dueño marcó como
bueno: cuatro recortes enmarcados y apenas torcidos, como pegados en un
tablero. Vacío deja los cuatro dibujos. Cada foto aparece recién cuando
cargó de verdad, la que falla se saca y si no queda ninguna vuelve el
dibujo — nunca un marco alrededor de un cuadrado roto.
**Van EN COLOR**, al revés que las de la portada de `mia15` y `almi15`:
en un dress code el color es el dato, y una foto en blanco y negro no
dice si el vestido es negro o es verde.

**EL ENCAJE ES ENCAJE, no un festón.** El dueño mandó dos capturas —
una tira de encaje negro fruncido arriba y abajo de las rayas, y una
tarjeta con **textura** de encaje negro— y pidió las dos. Están hechas
con SVG que se repite, no con imágenes: pesan 23 KB y 15 KB, no se
pixelan y se adaptan a cualquier pantalla.

**Lo que hace que un recorte parezca TELA es la red fina.** La primera
versión eran festones con tres ojalitos y se leía como un toldo; la
segunda tenía la malla con el punto grande y se leía como lunares. El
encaje es **red fina MÁS motivo grande**, los dos tamaños a la vez: una
malla de puntos de 0,6 y rosetas de seis pétalos. Con un tamaño solo no
hay encaje. Se ve mirando, no leyendo el código.

**Y en la textura, cuatro elipses cruzadas no son una flor: son un
moño.** La primera versión del motivo giraba cuatro elipses sobre el
mismo centro y salían aspas. La flor son **seis pétalos alrededor de un
centro**, separados. Va en un negro apenas más claro que el fondo
(`#2C2029` sobre `#140B10`): tiene que sentirse, no verse — si se ve,
le compite a los títulos y a las tarjetas, que es justo lo que va
encima.

**La bolsa costó tres vueltas y es la lección de siempre**: el dueño
mandó la foto de la bolsa de verdad —rayas, dos asas de cinta y el
papel de seda asomando— y las tres cosas juntas a 42px son una mancha.
Con las asas colgando POR ADENTRO se perdían contra las rayas; con el
papel de seda arriba, los picos y las asas formaban una cara. Quedó lo
que identifica a la bolsa y se lee: el cuerpo ancho, **las dos asas
sobre el borde** y las rayas. **Un icono no es una foto: lo que no se
lee a 42 no va**, y de tres detalles hay que elegir dos.

**Y una cuarta vuelta, porque seguía sin parecerse**: el dueño volvió
con la foto —*"no podés hacer un icono parecido al de la bolsa de
VS"*—. Lo que faltaba no era un detalle más, era la PROPORCIÓN: las
asas eran dos arcos cortos apoyados en el borde, y en la bolsa de
verdad las cintas suben casi tanto como el cuerpo y se cruzan arriba.
Con las cintas altas la bolsa se reconoce de un vistazo. **Se eligió
mirando**: se montaron cinco versiones a 150px y a 42 y se comparó —es
lo mismo que ya está escrito para la tipografía, y es lo único que
sirve cuando el problema es que algo "no se parece". El papel de seda
volvió a quedar afuera y por el mismo motivo de siempre.

**Y los POMPONES del dress code.** Estaban marcados en la referencia y
no se habían hecho: son tres plumas —crema, rosa y negro— atadas con
el moño de la pieza, y ahora son el dibujo de la tarjeta de dress code
mientras no lleguen las fotos de la clienta. Reemplazan a los cuatro
productos en fila que había antes: lo que dice qué ponerse es el
texto, el dibujo es decoración, y la decoración es la que él señaló.
Tres cosas que costaron una vuelta cada una, y **las tres se ven
mirando, no leyendo el código**:
- **Con lóbulos parejos un pompón es un chupetín.** Lo que lo vuelve
  pluma es el borde: muchos bultos chiquitos e irregulares. Quince
  lóbulos iguales y un mango largo y recto se leían como algodón de
  azúcar.
- **Los tres mangos tienen que CONVERGER en el nudo.** Sueltos, cada
  pompón era una flor aparte y eso no es un ramo; y el moño, dibujado
  lejos de donde se juntan, quedaba flotando sin atar nada.
- **Las siluetas van escritas ya calculadas, de una semilla fija.**
  Con `Math.random()` dos capturas de la misma invitación saldrían
  distintas — la misma regla que la sierra de las franjas.

**El ramo después se tiró entero**, y con él el moño y los mangos: los
pompones pasaron ARRIBA y CORTADOS, haciendo de marco. Está abajo, en
*"Los tres pompones haciendo de marco"*, y ahí el dibujo se rehizo de
cero — lo único que sobrevive de esta vuelta es la lección del
chupetín, que volvió a aparecer.

**El medidor de contraste no ve esta textura** —mide el
`background-color`, no la imagen—, y acá eso no esconde nada porque los
dos negros están a menos de un punto de luminancia. Si alguna vez se
aclara el motivo, ese texto hay que volver a mirarlo con el píxel, como
en la portada de `mia15`.

**No está en la galería de Trabajos ni en `/invitaciones`**, por lo
mismo que `mia15` y `almi15`: es la fiesta de una clienta de verdad,
lleva `noindex` y en el formulario se juntan nombres de invitados y
comidas.

#### El monograma AZB, el sobre de la referencia y la bolsa

El dueño mandó los datos, cinco fotos y dos capturas más, con tres
pedidos: *"que el sobre sea igual al que te mandé y con la misma
fuente"*, *"la parte del Dresscode y eso que sea como la última foto"*
y *"hacé un juego con las iniciales de la quinceañera y que parezca el
logo de Victoria's Secret; las iniciales son AZB"*.

**El monograma se eligió MIRANDO, no describiendo**, que es la misma
regla ya escrita para la tipografía y para la bolsa de los iconos. Se
montaron doce armados a 72, 34 y 20 píxeles y adentro del lacre, y se
eligió el que se lee en los cuatro tamaños: la Z al 122% entre una A y
una B al 74%, tocándose apenas. Y la conclusión que se sacó de ahí
—*"solapar tres capitulares de una didona no se lee"*— era cierta a
medias, y el dueño lo destapó con una referencia.
**Son SUS iniciales**, no la V y la S de una marca registrada: eso
último sigue prohibido y por el mismo motivo de siempre —una invitación
publicada con el logo de otro es un problema nuestro, no de la clienta.
Y va como **texto y no como dibujo**, así que el medidor de contraste
lo mide de verdad: dibujado en un SVG sin color propio informaría
1,00:1 y tendría razón según lo que mide.

##### Y después mandó el logo que quería, y la conclusión estaba a medias

*"Prefiero este logo en vez del que hiciste. Ponerlo como la cera de la
carta y al final de la invitación así en negro como en la segunda
foto."* La referencia es una **A y una B de didona ENTRELAZADAS**, con
una lazada caligráfica cruzando por el medio, en oro rosa.

Acá arriba estaba escrito que con tres letras no se puede entrelazar, y
**lo medido era verdad pero la conclusión sobraba**: lo que no se lee
son tres capitulares **de la misma didona**, porque las tres pelean por
el mismo peso y la del medio se la come la de al lado. Con la Z en la
**manuscrita** —la Pinyon, que ya estaba cargada para el nombre— la del
medio deja de ser una capitular y pasa a ser la LAZADA: la A y la B se
entrelazan como en la referencia y la Z las cose, sin taparse. Se
probaron cuatro armados y se eligió mirando, igual que la vez anterior.

**La lección, que es nueva**: una medición dice que algo *no funcionó*,
no que *no se puede*. La primera vuelta probó doce variantes de un solo
camino —tres capitulares de la misma familia— y escribió la conclusión
como si cubriera todos. El camino que faltaba lo señaló el dueño con una
imagen en dos segundos.

**El lacre pasó a ser de ORO ROSA**, que es el metal de la referencia
—y le queda, porque se llama Ámbar—, con el monograma en cobre hondo
encima (4,8:1). Ese número **hay que calcularlo a mano**: el medidor no
juzga lo que cae sobre un degradé opaco de punta a punta, así que ahí
da verde mire lo que mire.

**Y al final de la invitación va la misma marca en NEGRO**, con el
nombre completo abajo en versalitas espaciadas, que es la segunda
referencia. Sobre el papel claro el oro rosa da 2,2:1 —no estaría—, así
que ahí la marca es tinta: *si un bloque trae su propio fondo, trae su
propia tinta*, enésima vez.
**Y el cierre perdió su medallón**: la marca ES su emblema, y dos
emblemas apilados se leen como un error de maqueta.
*(Más abajo: esa marca dibujada pasó a ser el RESPALDO, porque el dueño
mandó después la pieza ya hecha.)*

**El sobre sale de la captura: las alas a los costados y el lacre
dorado.** ~~Abierto, con la carta asomando.~~ **Eso duró poco y está
contado abajo**, en *"El sobre estaba revelado"*: la carta afuera
mostraba el nombre y la fecha antes de tocar nada, y encima peleándose
con el lacre. Lo que no puede verse nunca es lo que el sobre dice que
está tapando.
El lacre es **dorado** y no negro —en la referencia lo es, y además le
queda: se llama Ámbar—, con el monograma en tinta encima (5,9:1).

**El sobre es más ANGOSTO que la pantalla, y no es un ajuste de gusto**:
las alas no son un adorno que se pueda recortar, son la mitad de la
referencia, y un ala cortada contra el borde se lee como un error de
maqueta. Con el sobre a 78vw las dos quedaban mochas; a 66vw entran
enteras hasta en un iPhone SE.
**Y el ala es UNA sola**, en un `<symbol>` que usan la portada (negra)
y el sobre (blanca). Un selector de CSS no entra adentro de un `<use>`,
así que el color viaja por propiedades que SÍ heredan: `color` para la
silueta y `--pluma` para los nervios.

**El dress code y el regalo pasaron a ser LA BOLSA de papel a rayas**,
que es la segunda captura. Antes eran dos tarjetas de papel. Son las
asas, el pliegue de la boca y las rayas lo que la hace leer como la
tienda; **lo que NO se copia es el texto en ARCO** de la referencia,
que es lindo en una captura y en un teléfono es un párrafo que hay que
girar la cabeza para leer.
Adentro van las **muestras de color** —rosa, negro y plateado, cada una
con su nombre: una fila de cuadraditos sin rótulo es un adorno, y esto
es un dato— y el renglón que dice que *son una guía, no una
obligación*, porque a cómo se visten contestó **"como quieran"**.
Las muestras salen de `CONFIG.dressColores` y no del HTML: escritas en
los dos lados, el día que cambie un color uno de los dos se queda viejo.

**Y la bolsa trae su propio fondo, así que trae su propia tinta** —
enésima vez—: vive adentro de una sección oscura y sin eso heredaba el
crema del texto sobre negro, o sea crema sobre papel rosa. Ojo con un
detalle de especificidad que ya costó una vuelta: `.bolsa-cuerpo p`
pesa más que `.bolsa-marca`, así que el monograma heredaba el gris de
los párrafos **y las alas con él**. Se dibujaba y no era el color.

**El ancho de una muestra lo decide el RÓTULO, no el cuadradito**:
"PLATEADO" espaciado mide 58px y la primera versión le daba 55. Lo
agarró la prueba, no el ojo.

**El medidor de contraste no ve las rayas de la bolsa** —mide el
`background-color`, no la imagen—, y acá eso no esconde nada porque la
raya rosa y el papel están a menos de cinco puntos de luminancia y el
texto es oscuro. Si alguna vez se oscurece la raya, ese texto hay que
volver a mirarlo con el píxel.

#### El monograma con alas, y los besos

Dos pedidos más, con dos capturas: *"Pone ese diseño en algún lado y
unos labios iguales a esos en algunas partes de la invitación"*.

**El diseño con alas va al FINAL**, que es el único lugar donde entra
entero y en grande sin competirle a nada: la A y la B negras entre las
dos alas, el nombre completo abajo en versalitas y, debajo, el beso.
Ahí las alas van **blancas** —son las de la referencia— con los
nervios en rosa y su sombra: sobre el papel claro, un blanco sin
sombra no se ve. Es el mismo dibujo de siempre, el del `<symbol>`.

**El beso va DIBUJADO, no es la imagen de la captura.** Una imagen de
la que no sabemos la licencia no se publica —la regla de siempre—, y
además así pesa cero, no se pixela y se puede teñir donde haga falta.
Está en cuatro lugares: el fondo del sobre, la portada, la bolsa y el
cierre, cada uno con su propia semilla para que no sean el mismo
dibujo repetido cuatro veces.

**Lo que hace que se lea como un SELLO y no como una boca de dibujito
son tres cosas, y las tres se vieron mirando:**

- **El HUECO entre los dos labios.** La primera versión los pegaba con
  una línea fina y quedaba un globo rosa.
- **Las ESTRÍAS claras**, y **recortadas con un `clipPath`**. Sueltas
  asoman por fuera del labio y lo que se ve son rayones blancos
  colgando, no un sello. Eso costó una vuelta entera.
- **El borde IRREGULAR**, de una semilla fija como la sierra: al azar
  en cada carga, dos capturas de la misma invitación saldrían
  distintas.

**Y volvió la trampa del selector demasiado ancho, por tercera vez.**
`#portada > *` y `.bolsa-cuerpo > *` les ponen `position:relative` a
todos sus hijos para subirlos por encima del velo — y con eso el beso
deja de ser una capa y pasa a ser una fila del flujo: el `top/right`
no vale nada y se planta donde caiga. Ya había pasado con el encaje y
con el marco. Las dos reglas eximen ahora a `.beso`.

#### Las fotos, y la que no se usó

Son cinco selfies que mandó ella. **Van tres**: una en el óvalo de la
portada y dos en las franjas, todas en blanco y negro por el CSS —la
paleta son tres colores y una foto a color mete los suyos—. Las otras
dos son casi la misma pose con otra ropa, así que no suman nada y no se
versionan: una foto de una menor sentada en una dirección pública es
peso y es exposición sin nada a cambio.

**El recorte del óvalo se hizo DOS veces.** El primero entraba 900px de
ancho y la cara quedaba en el cuarto de arriba del óvalo: el óvalo
recorta apenas un 10% del alto, así que `object-position` casi no
mueve nada — **el encuadre se arregla en el archivo, no en el CSS**.

#### ~~Los tres pompones haciendo de marco~~

**SACADOS el 30/10/2026**, con el monograma con alas de la misma
tarjeta: *"Esta parte quedó fea. Esos pompones no se parecen en nada a
lo que te pedí. Lo mejor sería sacar eso y el logo horrendo ese que
hiciste"*. Lo que hay ahí ahora son las tres estrellas; está abajo, en
*"Las tres estrellas, de emblema del dress code"*. Lo de acá queda
escrito por la lección de la pluma, que es lo único que sobrevive.


Pedido del dueño con una captura —una tarjeta de RSVP con tres
pompones de pluma asomando por detrás del borde de arriba—:
*"Esto mismo para la parte del Dresscode. Los 3 pompones esos
haciendo de marco en la parte de arriba."*

Los pompones ya existían, pero estaban ABAJO del texto, atados en un
ramo con su moño. **Lo que cambia no es dónde se ponen: es que ahora
están CORTADOS.** Un ramo entero es un dibujo más adentro de la
bolsa; tres pompones que se ven a medias se leen como que hay algo
adelante, y ese algo es el bloque. El corte lo hace la CAJA —alto fijo
más `overflow:hidden`— y no el dibujo, y la raya de abajo es el borde
del que asoman: sin ella el corte se lee como un recorte mal hecho.

**Y dejaron de ser el dibujo que espera a las fotos.** Antes se
escondían el día que llegaran las del dress code. La corona es el
MARCO del bloque, así que se queda: las fotos entran abajo, que es el
moodboard.

**Los colores pasaron a ser los TRES QUE MANDÓ LA CLIENTA** —rosa,
negro y plateado— en vez del crema de antes. Son los mismos de las
muestras que están dos renglones más abajo, así que el adorno dice lo
mismo que el dato; y el plateado se ve sobre el papel rayado, donde un
crema casi no existe. Lo mismo el rosa y el plateado del dibujo, que
van un tono más hondos que la muestra: sobre el papel rosa claro, el
rosa de la muestra no se despega del fondo.

##### Una pluma se dibuja con PELO, no con silueta

Esto costó cuatro vueltas y es la lección que queda. **Cualquier forma
rellena de borde limpio se lee como otra cosa**, y las tres primeras
versiones fallaron todas por lo mismo:

- con lóbulos redondos y parejos sale una **margarita** —es la misma
  falla que ya estaba anotada para los pompones del ramo, "con lóbulos
  parejos un pompón es un chupetín"—;
- con el borde en puntas, una **corona de espinas**;
- con lóbulos grandes y blandos, un **loto**;
- y con barbas rectas y parejas, un **helecho**.

Lo que hace a la pluma es el raquis y las BARBAS que salen de él, y lo
que hace al pompón es que **el borde quede peludo**, o sea que la
silueta NO se cierre. Tres cosas que no son de gusto:

- **Las barbas se arquean** —el punto de control cae hacia la base— y
  se van parando hacia la punta.
- **Adentro hay un núcleo relleno MÁS ANGOSTO Y MÁS CORTO que las
  barbas**: denso abajo y pura pelusa arriba, como el de verdad. Sin
  núcleo se transparenta; con el núcleo del largo de la pluma sale una
  hoja con punta y el pompón se lee como una **planta de interior**.
- **El abanico va aplanado** —todas las plumas casi del mismo largo y
  muy abiertas—, que es lo que lo vuelve un montículo. Con la del
  medio larga y las de afuera cortas sale una **palmera**.

Todo sale de una semilla fija, como la sierra y los besos, y los
parámetros viven en una sola constante (`PLUMA`) —que es lo que
permitió probar los armados **interceptando el HTML**, igual que
`puertas.js` con `MUESTRA_MURO`, en vez de editar el archivo cada
vez—. **Se eligió mirando**, montado al tamaño real y al de un
teléfono, que es lo único que sirve cuando el problema es que algo
"no se parece". Es la misma forma de trabajar que la tipografía, el
monograma y la bolsa.

##### Y la regla de los nombres repetidos también vale para un script de edición

Haciendo esto se perdieron 32 KB del archivo y no hubo ningún error.
El script de edición buscaba un comentario por su título
(`/* ── LA CORONA DE PLUMAS DEL DRESS CODE ──`) y reemplazaba hasta
otro ancla — pero ese título había quedado **dos veces**, una en el
CSS y otra en el JS, así que `index()` encontró la primera y se llevó
puesto todo lo que había en el medio: el CSS, el HTML de dos secciones
y la mitad del JS. El archivo quedó válido, se sirvió con 200 y la
página dibujó sin una sola excepción en la consola; lo único que
delataba era que `#detalles` ya no existía.

Es *antes de inventar un nombre, `grep`* —la regla que ya está escrita
dos veces para el código y una para las pruebas— aplicada a los
scripts que EDITAN el código. Un ancla se busca con
`assert s.count(ancla) == 1`, nunca con el primer `index()`, y después
se mira el tamaño del archivo.

#### Las tres estrellas, de emblema del dress code

*"Esta parte quedó fea. Esos pompones no se parecen en nada a lo que te
pedí. Lo mejor sería sacar eso y el logo horrendo ese que hiciste y
hacer algo como lo de la segunda foto"* — y la segunda foto son las
**tres estrellas apiladas**: la de atrás en animal print, la del medio
rosa y la de adelante plateada con glitter, sobre el papel a rayas.

De la tarjeta se fueron las dos cosas: la corona de pompones y el
monograma con alas que encabezaba el bloque. En su lugar van las
estrellas, **que ya estaban dibujadas en el archivo**: son las de la
portada tipográfica, que hoy no se ven porque manda el afiche. Es la
misma regla de siempre —*dos dibujos para lo mismo es uno que se queda
atrás*—, así que las dos las hace `estrellasSVG()`.

**Lo que las hacía no parecerse a la referencia era el RIBETE BLANCO.**
Sin él las tres se tocan y lo que se ve es una mancha con varias
puntas; el borde blanco es lo que dice que hay tres cosas pegadas, y es
lo primero que salta de la captura. Lo demás fue el leopardo —pocas
rosetas GRANDES en vez de muchas chiquitas, que a este tamaño se leen
como lunares— y el glitter, que pasó de 54 granos a 300: un degradé
liso con cuatro burbujas se lee como plástico gris, no como brillo.
Y abajo del grupo va una sombra suave, que es lo que despega al rosa
del papel rayado.

**El animal print sigue en NEGRO sobre rosa claro y no en marrón**,
aunque la referencia sea tan: lo que hace leer un animal print es el
DIBUJO y no el color, y el marrón sería un cuarto color en una paleta
de tres. Si alguna vez se pide tal cual, es una línea.

##### Y el mismo dibujo dos veces en la página son `id` repetidos

Esto no se vio, se razonó, y es la regla de los nombres repetidos
llevada a un SVG: el dibujo lleva adentro dos recortes, dos degradés y
una sombra, cada uno con su `id`. Puesto dos veces —la portada y la
tarjeta— el navegador resuelve `url(#…)` contra el **primero** que
encuentra. Hoy los dos son iguales y no se notaría; el día que uno
cambie, se pintaría con las piezas del otro. `estrellasSVG(suf)` lleva
sufijo, igual que el beso.

**Y ponerle el sufijo rompió el dibujo, sin un solo error.** Se
renombraron los `id` de los degradés y quedaron sin tocar los dos
`fill="url(#estRosa)"` que los nombran: una referencia que no resuelve
no es un error en SVG, es un relleno vacío. El rosa y el plateado
salieron **blancos**, con el ribete y la sombra perfectos. Lo agarró la
captura, no la consola — las pruebas daban verde igual. Es *mirar que
el cambio haya ENTRADO*, y acá entró a medias.

#### Y una que nadie había medido: el nombre de otra clienta

Esta invitación salió copiando `almi15`, y el nombre de la clienta
anterior se quedó escrito a mano en **tres renglones**: el cierre, el
rótulo del mensaje y el aviso de datos. *"Un mensaje para Almi"* en la
fiesta de Ámbar. Se dibujaba perfecto, no tiraba ningún error, y lo
primero que ve la clienta es el nombre de otra.

Ahora esos tres salen de `CONFIG.quien` como todo lo demás (`.elNom`),
y lo cuida `pruebas/invitaciones.js`: ninguna invitación puede nombrar
a la clienta de otra. Se mira el HTML **sin los comentarios** —lo que
explica de dónde salió la pieza puede nombrar a la otra; lo que se
publica, no— y el borde de la palabra no es `\b` sino "ni letra ni
dígito", para que la carpeta `almi15` no cuente como nombrar a Almi.
Verificada rompiéndola a propósito: con el "Almi" del cierre puesto da
**1 falla**.

**La lección, que es la de siempre con otra cara**: hacer una
invitación nueva es copiar la anterior, así que lo que se queda viejo
no es el código — es el DATO escrito a mano en el renglón que nadie
vuelve a mirar.

#### Y después mandó la marca ya dibujada

*"Esto ponelo."* — un PNG con la A y la B en negro y oro rosa entre dos
alas de pluma, que es el emblema del cierre pero hecho como una pieza
terminada: las plumas con volumen y las letras con su biselado.

**Va en el cierre y reemplaza a la dibujada, pero la dibujada se
queda.** Se pone recién cuando el archivo cargó de verdad; si faltara
—o si el día de mañana alguien lo borra— queda la de siempre, que se
sostiene sola, y no un cuadrado roto donde va el emblema. Es lo mismo
que ya hacen la portada y las franjas, y es por lo que el `<img>` lo
crea el JS y no el HTML: un `<img>` con `src` vacío le pide al servidor
la página entera de nuevo, y eso no avisa.

**Y va SOLO en el cierre, no en todos lados.** Sus plumas son casi
blancas, así que se lee sobre el papel claro del final —con su sombra,
igual que la dibujada— y se perdería sobre las rayas de la bolsa, que
es claro también. En la bolsa y en la portada las alas siguen siendo
las dibujadas, que ahí van en negro. **Un emblema no se pone donde
entra: se pone donde se lee.**

Pesa **53 KB** en `.webp` a 820px de ancho, que es el doble de lo que
se dibuja en pantalla. El PNG que llegó pesaba 1,5 MB.

#### El sobre estaba revelado, y la bolsa de la fiesta

Dos cosas que marcó el dueño mirando la invitación publicada.

**1 · "El sobre ya está revelado. Eso está mal."** Y tenía razón por
partida doble. La carta asomaba por arriba del bolsillo con **el
nombre, "mis quince años" y la fecha a la vista**: el que llega ya leyó
la invitación antes de tocar nada, así que abrir el sobre no le muestra
nada nuevo — se gasta el único momento de sorpresa que tiene la pieza
antes de empezar. Y además era contradictorio: **el lacre dice sellado y
el papel afuera dice abierto.**

Esto *parece* contradecir lo que está escrito más arriba —que acá el
sobre está abierto porque así es la referencia— y no lo contradice: la
referencia es un sobre abierto **sin lacre**. Copiado el lacre encima,
las dos mitades se pelean. **Un detalle de una referencia no se puede
copiar solo: viene con lo que lo hace cierto.**

Se arregla como en `almi15`: **la carta vive DETRÁS de un cuerpo
opaco**. Adentro, cualquier parte que los pliegues no tapen se ve y hay
que acertarle al apilado; atrás no hay nada que tapar. El sobre pasó a
ser uno cerrado de verdad —la proporción de un C6, los cuatro pliegues
de la espalda y la solapa doblada hacia abajo con el lacre en su punta—
y al abrir la solapa se levanta sobre su bisagra de arriba.

**Y al salir la carta SIGUE DETRÁS del sobre**, que es lo que pasa de
verdad: lo que todavía está adentro queda oculto, y lo que se lee es la
parte que ya salió. Recién cuando empieza a volar pasa adelante. Son
dos saltos de `z-index` —la solapa cae, la carta sube— y ninguno de los
dos se interpola: se hacen con una transición de 0 s y retardo, el mismo
truco que ya costó una vuelta en `almi15`.
**Corolario del relleno**: la carta se centra contra lo que se VE de
ella, no contra su caja. Centrada en la caja entera, el último renglón
—la fecha— queda adentro del sobre todo el tiempo que dura el gesto.

**2 · La bolsa de la fiesta, de icono del regalo.** El dueño mandó una
foto de la bolsa a rayas con **"ÁMBAR FEST"** impreso: *"poné la primera
foto en donde dice regalos, como si fuera un icono"*.

**Va RECORTADA, sin el fondo de la foto.** Un recuadro ahí se lee como
una captura pegada en el medio de la tarjeta, no como un icono; y la
juntura de un rectángulo contra el papel rayado se ve a la legua. El
fondo se sacó con un relleno por inundación desde las cuatro esquinas,
que acá funciona porque el borde de la bolsa es negro y el fondo un
degradé parejo.
**Y la sombra no es adorno**: una bolsa rosa a rayas sobre un papel rosa
a rayas se funde con el fondo. Pesa **19 KB** en `.webp` a 420px; el PNG
que llegó pesaba 1,8 MB.
Como la marca del cierre, se pone recién cuando el archivo cargó de
verdad: si faltara, el bloque queda como estaba y no un cuadrado roto
arriba del título.

#### La canción, el cuenta atrás y el dress code sin colores

Tres cosas de una vez, con dos capturas y un video de referencia.

**1 · El dress code se quedó sin los colores.** *"Esos colores no van en
el dress code. Solo elegante."* Las muestras de rosa, negro y plateado
estaban debajo de "Elegante sport" como si fueran una instrucción, y la
clienta nunca dijo cómo quiere que se vistan —a eso contestó *"como
quieran"*—. Los tres colores siguen estando en toda la pieza: son la
paleta, los pompones del marco y las rayas. Lo que se fue es la fila de
cuadraditos, **y con ella el renglón que la explicaba**: "son una guía,
no una obligación" sin ninguna muestra arriba no se entiende de qué
habla. Y el dress code pasó a decir **"Elegante"**, no "Elegante sport".

**2 · El cuenta atrás, como la captura.** El "faltan…" en manuscrita y
las cuatro cifras **en una sola línea** separadas por dos puntos, con su
rótulo abajo. Antes eran cuatro fichas con sus esquinitas: cuatro
recuadros se leen como un tablero, una línea corrida se lee como un
reloj.
Dos cosas que no son de gusto: **el rótulo chico de la sección se fue**
—"Falta poco" arriba de "faltan…" dice dos veces lo mismo—, y **el dos
puntos se alinea con las CIFRAS y no con la caja**: su caja mide
exactamente el alto de una cifra, así que queda sobre la misma línea
aunque los días pasen a tres dígitos. Esa es justamente la falla que ya
está anotada para esta suite —*"469" pintado encima del dos puntos de al
lado*— y por eso acá el separador vive en el hueco entre casilla y
casilla, no pegado a un número.

**3 · La canción, con su reproductor.** El dueño mandó un video y una
línea: *"la música del video ese. No el video"*. El audio se sacó con
`ffmpeg`, normalizado y con un fundido de entrada de un cuarto de
segundo para que el bucle no haga clic.

**ARRANCA CON EL TOQUE QUE ABRE EL SOBRE.** Safari no deja sonar nada
sin un gesto de la persona, y ese gesto ya existe: no hay que inventarle
otro botón ni dejar la invitación muda esperando que alguien descubra el
play. Si el navegador se niega igual, el reproductor queda en "play" y
decide el invitado.

**SON TRES BOTONES Y LOS TRES HACEN ALGO.** La captura tiene cinco
—mezclar y repetir además— y con UNA sola canción esos dos no pueden
hacer nada: *un botón que no puede hacer su trabajo molesta más que no
estar*. "Anterior" y "siguiente" sí valen, porque con un solo tema los
dos vuelven al principio, que es lo que hace un reproductor de verdad. **La
línea con el corazón no es un control**: es el avance, y va con
`aria-hidden` y sin atajar el dedo.
*(Más abajo, en "El fondo de rayas": los cinco se dibujan igual que en
la captura, y los dos de los extremos son DIBUJO y no botones.)*

**Dos archivos y UNA sola descarga.** El `<audio>` lleva dos `<source>`:
AAC para el iPhone —que es donde están los invitados— y Opus para el que
no puede con ese formato. El navegador baja uno solo. Son 170 KB y 150 KB
en el repo, no 320 para la misma persona.
**Y hubo que ponerlo así para poder MEDIRLO**: el Chromium de las pruebas
no decodifica AAC, así que con un `src` suelto el reproductor se borraba
solo —que es lo que tiene que pasar cuando el archivo no sirve— y la
suite veía una sección vacía sin saber por qué. Con los dos `<source>`,
el error llega al elemento recién cuando fallaron TODAS las fuentes.
**Y el dibujo se AGREGA, no reemplaza**: con `innerHTML` se borraba el
`<audio>` que acababa de colgarse ahí adentro.

##### La canción no es nuestra, y eso queda escrito

Más arriba, para `facuymaxi/`, dice que **la canción no suena adentro de
la invitación** porque *"el archivo no es nuestro"*. Acá suena. La mitad
técnica de aquel motivo sigue en pie y se respeta —no hay ningún
reproductor de un tercero: la CSP no lo deja y además sería un tercero
corriendo código en la pantalla del invitado—, pero **la otra mitad no**:
el audio es una grabación comercial sacada de un video y queda publicada
en una dirección nuestra, que cualquiera puede bajar.

**Lo decidió el dueño y se le dijo.** Queda anotado para que nadie —yo el
mes que viene incluido— lo "arregle" sacándolo, y para que la próxima
invitación no copie el criterio sin saber que es una excepción: en
`facuymaxi/` el play LLEVA a escucharla y no suena, y ahí sigue siendo
lo correcto porque ellos no pidieron otra cosa.

#### El fondo de rayas, los cinco mandos y una sola vuelta

*"Pone ese fondo y usa el mismo reproductor y la misma frase. Y el audio
es el de este video. Que se reproduzca una sola vez. Después si quieren
repetirlo que toque el play."* — con la captura de la referencia, que es
el mismo reproductor sobre el **papel de rayas rosa** y no sobre negro.

**La sección pasó de la banda oscura al papel de rayas**, que es el
fondo de la portada y de la bolsa: no entra ningún fondo nuevo a la
pieza, se reusa el que ya existe (`.rayado`) con la tinta clara
(`.claro`), así que los rótulos, la filigrana y el arco toman solos su
color. Y lleva el **mismo velo claro de la portada**: una raya fuerte
detrás de una capitular espaciada es un texto que no se lee, y **eso el
medidor no lo mide** —mide el fondo, no el dibujo—.

**Los CINCO mandos se dibujan y TRES son botones.** Mezclar y repetir
están en la captura, pero con una sola canción —y sonando una sola vez—
no pueden hacer nada: van con `aria-hidden` y `pointer-events:none`, o
sea como adorno declarado, que es exactamente como el medidor de
contraste y el barrido saltean un dibujo. Se ve igual que la referencia
y no queda nada que se toque y no responda. Es la misma salida que ya
se había usado para el "15" en contorno de `mia15`.

**Suena UNA sola vez.** El audio deja de ir en bucle y, al terminar, se
**rebobina solo**: parado en el final, el primer toque del play no
sonaría — y eso no tira ningún error, sólo un botón que parece roto. El
`pause()` del final tampoco sobra: el navegador ya dejó el audio
parado, pero así el botón queda bien dibujado venga el final de donde
venga.

**Y un Ogg todavía sin bajar entero devuelve `Infinity` de duración**,
no un número: la cuenta del avance daba 0 para siempre y el corazón se
quedaba clavado a la izquierda. En el iPhone —que es donde están los
invitados— suena el AAC y la duración se sabe, así que esto no se veía
nunca desde acá.

##### El corazón salía cortado al medio, y el culpable era el telón

El corazón del avance se dibujaba **sin la mitad de arriba**: lo que se
veía colgando de la línea era media gota. No había ningún error, el
camino SVG estaba perfecto —montado solo se dibuja entero— y nada lo
tapaba.

Lo tapaba **el telón de `.ap`**, la animación de entrada: es un
`clip-path` recortado **a la caja del bloque**, y el corazón está
centrado sobre una línea de 2px pegada al borde de arriba, así que su
mitad superior caía fuera de la caja y desaparecía. Se arregla dándole
al bloque 9px de aire arriba —que no es aire: es lo que hace que el
corazón quepa—.

**La regla, que es pariente de la de `almi15`** (*el que se mira no
puede ser el que se esconde*): **el que recorta no puede ser más chico
que lo que tiene que mostrar.** Y la de siempre: se ve mirando, no
leyendo el código — el camino, los tamaños y las posiciones estaban
todos bien.

**Y volvió por CUARTA vez el selector `> *` que pisa un `absolute`.**
El velo nuevo obligó a subir el contenido con `#cancion > *
{position:relative}`, y eso le pisó el `position:absolute` a la
filigrana del corte: de capa pasó a ser una fila y se le montó encima a
"La canción". Ya había pasado con el encaje, con el marco y con el
beso. La regla exime a `.orna`.

Lo mide `pruebas/invitacion_mirar.js` con una comprobación nueva y
genérica —se saltea sola en una invitación sin canción—: que el audio
**no quede en bucle**, que al terminar **se rebobine** y que el botón
vuelva a decir "escuchar". El final se **fuerza**, porque en el camino
normal hay que esperar la canción entera. Contra el código anterior da
**3 fallas**.

#### El encaje, de borde de la cuenta regresiva

*"Podés ponerle el diseño de abajo a la fecha. Esa tela"* — con la
captura de una cuenta regresiva sobre el papel a rayas, con la tira de
**encaje negro** arriba y abajo.

**El encaje ya existía y no se veía nunca.** Es el de la portada, y la
portada se esconde entera desde que manda el afiche: una pieza
dibujada, medida y publicada que ningún invitado iba a ver. Ahora es el
borde de la cuenta regresiva, que además pasó al papel a rayas.

**Y el encaje REEMPLAZA al corte en curva, no se suma.** Son dos formas
de cortar y puestas juntas se leen como un error de maqueta: por eso
esta sección perdió su `arco` —y con él su filigrana, porque el encaje
es el remate— y **la de la canción también**. Con las dos puestas
quedaba la costura del arco justo encima de la tira y la filigrana
enterrada debajo del encaje: dibujada y tapada, que es lo peor de los
dos mundos.

##### Dos rayas finas que aparecieron por ser dos secciones rayadas

Ninguna de las dos existía antes, y las dos aparecieron por lo mismo:
**la sección de arriba pasó a ser rayada, así que lo que antes caía
sobre un fondo liso ahora cae sobre un dibujo que sigue del otro lado.**

- **El velo de la canción no llegaba a cero en su propio borde.**
  Estaba centrado en el 46% y con el radio corto, así que en su fila de
  arriba todavía valía un 22% de blanco: una raya clara de punta a
  punta, como si las dos mitades fueran de dos papeles distintos. Se
  arregla centrándolo y poniendo la parada transparente EXACTAMENTE
  donde cae el borde (50/78 = 64%).
- **El encaje del pie dado vuelta dejaba una fila oscura por encima.**
  `transform:scaleY(-1)` a secas deja el borde de arriba de la tira a
  medio píxel y Chrome pinta ahí una fila al 13%: medido, **28 puntos
  de escalón**. Con `translateZ(0)` la tira va en su propia capa y
  queda alineada a píxeles enteros — **escalón 0 ó 1**, medido en los
  cuatro anchos. No es un amuleto: se probaron seis variantes y sólo
  las dos que promueven la capa lo arreglan.

**Las dos se midieron con el píxel, no con el ojo.** Una fila de un
píxel al 13% no se ve en una captura de escritorio y sí en un teléfono,
y ninguna de las dos tira un error.

##### Y el papel a rayas también era un punto ciego de la suite

La comprobación del texto sobre un fondo dibujado buscaba `url(...)`, y
el rayado es un `repeating-linear-gradient`: o sea que **la portada, la
canción y ahora la cuenta regresiva no se medían con el píxel**, y el
medidor compartido las juzga contra `--papel`, ignorando la raya. La
raya cuesta **un punto** de contraste —medido: 5,82 → 4,87 para el gris
de los párrafos— así que hoy no escondía nada, pero el agujero es el
mismo. Ahora entra también el `repeating-gradient`, y con eso la suite
pasó de **55 a 74 renglones medidos** en ambar15, el peor en 5,49:1.
Verificado rompiéndolo a propósito —el contador en rosa claro— da
**4 fallas**, una por aparato, con el "162" a 1,10:1. Y verificado que
no inventa fallas en las otras: `almi15` y `facuymaxi` quedan limpias y
`mia15` informa sólo la suya de antes.

#### El pase VIP, de emblema de "dónde nos vemos"

*"Esto quiero que lo pongas como icono en donde va el icono de la
ubicación"* — una credencial VIP con su cintita, el moño, los dijes y
la marca AB entre alas, con "ÁMBAR FEST" y "VIP ALL ACCESS".

**Reemplaza al medallón de esa sección, y no se mete adentro del
anillo.** El medallón lleva un icono de línea de 42px, y una credencial
llena de brillantes a ese tamaño es una mancha —*lo que no se lee a 42
no va*, la lección que este archivo ya tiene escrita tres veces—. Va del
tamaño al que se LEEN las dos líneas de la tarjeta, que es lo único que
la hace valer la pena. La credencial además dice lo que la sección dice:
es la entrada a la fiesta.

**Va recortada, sin el fondo de la foto**, por lo mismo que la bolsa del
regalo: un recuadro oscuro en el medio del papel rosa se lee como una
captura pegada. Acá el recorte funciona porque la tarjeta tiene su borde
dorado y la cinta es rosa maciza, así que el relleno por inundación
desde las esquinas corta justo. Pesa **89 KB** en `.webp`; el PNG que
llegó pesaba 2,6 MB.

Y como la marca del cierre y la bolsa del regalo, **se pone recién
cuando el archivo cargó de verdad**: si faltara queda el medallón con el
pin dibujado, que se sostiene solo.

#### El sobre con alas, y el papel que se cortaba

*"Me gustaría que el sobre sea algo así. Que se abra y que corrijas
cuando aparezca el papel porque queda medio cortado lo que dice y la
transición mejórala."* — con una referencia de sobre rosa con alas de
pluma blancas, su lacre y la carta asomando.

**De la referencia NO va el logo**: es el de Victoria's Secret, marca
registrada, y vale lo de siempre —una invitación publicada con el logo
de otro es un problema nuestro—. Va el monograma AB. **Y la carta
asomando tampoco**: eso ya se sacó una vez, por pedido del dueño, y está
contado arriba en *"El sobre estaba revelado"*.

**Las alas tuvieron que REDIBUJARSE.** El ala que había es la del
monograma, dibujada para 60 o 70 píxeles; en el sobre mide tres veces
eso y a ese tamaño una silueta lisa se lee como un **pétalo**. Se probó
subirla, abrirla y ponerle una segunda capa corrida —dos hileras de
plumas por el precio de un `use`— y no alcanzó: lo que falta no es
cantidad, es que **tenga plumas**.

La nueva son tres hileras que salen del mismo hombro, la de afuera
larga y las de adentro cortas. Tres cosas, y las tres se vieron
mirando:

- **La punta va REDONDEADA.** En aguja, el dibujo se lee como un
  abanico de cuchillas.
- **El hombro lleva una mancha** que tapa donde convergen las plumas;
  sin ella se ve el pico de la convergencia. Y va CHICA: grande y
  blanca, asomando por arriba del sobre, se lee como dos huevos.
- **La postura es la mitad del asunto.** El barrido hacia arriba es lo
  que las vuelve alas; apoyadas de costado son dos hojas. Costó seis
  vueltas acertarle al par ángulo/altura que además **entra en la
  pantalla**: hay una medición que falla si se salen, porque un ala
  cortada contra el borde se lee como un error de maqueta.

Va de **símbolo, y el HTML sigue apuntando al ala chica**: sin JS
quedan las de siempre, que es el estado bueno.

##### El papel se cortaba, y no era la escala: era la CAJA

La carta volaba hasta `(ancho de pantalla / ancho de la carta) × 1,7`,
o sea que se salía por los dos costados **justo cuando más se lee** —
medido, 165px afuera—. Ahora el tope sale de la caja de verdad contra
la pantalla de verdad, con 18px de aire a cada lado, y nunca baja de
1,25: con menos no se lee como que la carta se acerca.

Y la transición es más larga y más suave (1,5 s con una curva que
desacelera, el fundido entrando a los 0,22 s en vez de 0,3), así que la
portada se ve aparecer alrededor de la carta en vez de debajo de ella.

**Lo mide la suite por la CAJA, no por la escala**: el ancho de la
carta cambia con el aparato, así que una cota sobre `--esc` no dice
nada. Mientras la carta se ve, su caja no puede salirse de la pantalla.
Verificada rompiéndola a propósito —el cálculo anterior— da **1 falla**,
*"la carta SE SALE 165px de la pantalla"*.

#### Las alas dibujadas se cayeron: el emblema es SU logo

*"Fíjate que el sobre nada que ver. Además las alas están feas y al
revés. Presta atención a los detalles. Por otro lado la carta está
desfasada. No está centrada. Y ese logo que hiciste es horrible. Pone
el logo de la última foto."* Y después, con dos recortes del lacre y
de la carta: *"Debes cambiar ese logo por los dos AB."*

Las alas de la vuelta anterior estaban **al revés de verdad, no de
gusto**: el dibujo sale de un hombro abajo a la derecha y barre hacia
arriba, pero el CSS les ponía `rotate(-40deg)`, que es **antihorario**,
o sea que les sumaba cuarenta grados y las pasaba de la horizontal
hacia el piso. Y los dos hombros caían juntos en el centro, así que lo
que se veía no eran dos alas: era un moño. Se dibuja perfecto y está
mal, que es la familia de siempre.

**Y la lección más cara es la otra: el dibujo no hacía falta.** El logo
de la fiesta —la A y la B entrelazadas, con su corona, entre dos alas—
ya existía, es de ella, está en su afiche y en el empapelado, y el
dueño lo tenía a mano. Nosotros estábamos aproximándolo a mano, seis
vueltas de plumas, para terminar con algo que no se le parece. **Antes
de dibujar una pieza de la marca de un cliente: preguntar si la
tiene.**

Así que el emblema del sobre es el logo recortado (`fotos/logo.webp`,
88 KB), y las alas dibujadas quedan de respaldo —con el giro
corregido—: si el archivo falta no queda un cuadrado roto. Es lo mismo
que ya hacen la marca del cierre, la bolsa, el pase VIP y la bata.

**Va ARRIBA del sobre y no detrás**, que es lo que haría la
referencia. El motivo es de geometría: en su logo las alas vienen
pegadas a las letras, así que agrandarlo hasta que flanqueen el sobre
deja un monograma **más alto que el sobre entero**. Arriba, entero y
apenas más ancho que el sobre, se lee de una y las alas igual asoman a
los costados. El margen negativo lo pega al sobre: separados son dos
piezas sueltas.

**Y el fondo dejó de ser las rayas.** Acá estaba escrito que el sobre
vivía sobre las rayas "porque son las de la portada" — y eso dejó de
ser cierto el día que la portada pasó a ser el afiche que mandó el
dueño, cuyo fondo es un rosa fuerte. Encima el logo es rosa PÁLIDO:
sobre las rayas claras no estaría. Ahora el fondo es ese mismo rosa
(`#C85075`) con la luz de estudio de la referencia, y el que abre
sigue sin cambiar de mundo — ahora de verdad.
**Los dos rótulos del sobre hay que medirlos A MANO**: su fondo es un
`:before`, o sea un pseudoelemento, que ningún `querySelectorAll`
devuelve, así que el medidor los juzga contra el negro del `body` y da
verde mire lo que mire. Medido con el píxel sobre la captura: en crema
daban 3,2:1 y por eso van en blanco puro (3,7:1 y 4,2:1).

##### El monograma de la carta y el del lacre son el suyo, recortado

Los dos AB que señaló son los dos lugares donde el monograma se ve
chico. Ahí **las alas no entran** —en un lacre de 62px serían dos
manchas—, así que va una segunda pieza: el mismo logo **sin alas y en
rosa hondo** (`fotos/sello.webp`, 17 KB), que se lee tanto sobre el oro
rosa del lacre como sobre el papel crema de la carta. Una sola
descarga para los dos: el segundo es un clon.

**Recortarle las alas a una imagen no es recortar un rectángulo.** Las
alas pasan POR DETRÁS de las letras, así que no hay un corte vertical
que las separe; lo que sí hay, mirando el alfa fila por fila, es un
HUECO entre donde termina el ala y donde empieza la letra, y ese hueco
se mueve con la altura. El recorte es una frontera por tramos sacada de
esa medición, y después se tiran las islas sueltas que quedan —las
puntas de pluma que caían del lado de adentro— quedándose sólo con las
dos grandes: las letras y la corona.

##### Y el monograma dibujado perdió la Z

El de texto sigue existiendo, porque es el respaldo de los dos
anteriores, pero ahora es **A + B**. Acá estaba escrito —y bien medido—
que la Z en manuscrita era la lazada que dejaba leer tres capitulares;
lo que estaba de más era la decisión: **el logo de la fiesta no tiene
Z**, nunca la tuvo, y el monograma de la pieza tiene que ser el de
ella. Es la misma lección que la de las alas, en chiquito.

##### La carta estaba desfasada porque el relleno era para otra escena

El texto de la carta vive arriba a propósito: mientras ASOMA del sobre,
lo que se ve es sólo su parte de arriba, y centrado en la caja entera
el último renglón queda adentro. Eso es cierto durante el asomo **y
deja de serlo en cuanto vuela**: afuera se ve la carta entera, y el
texto arriba con medio papel en blanco abajo se lee como una tarjeta
mal armada. Ahora el relleno de abajo se va con el vuelo, en el mismo
tiempo que la escala, así que el texto se acomoda al medio mientras
crece. **Un valor que es correcto en una escena no lo es en la
siguiente: si la escena cambia, el valor se anima con ella.**

##### Y al final de la transición quedaba una capa pegada

*"Tenés que ver que al finalizar la transición no queda bien."* Y no
quedaba: mientras el papel del sobre se deshacía y la portada se
encendía, **el logo y el beso seguían OPACOS encima de ella** —el
monograma alado estampado sobre la foto de Ámbar y los labios
flotando en una esquina— hasta que el sobre entero se sacaba de un
saque. Lo que tendría que leerse como un cruce se leía como dos capas
mal superpuestas y un corte al final.

**El motivo es de bulto: las dos capas eran NUEVAS y no estaban en la
lista que se funde.** El sobre apaga sus piezas con una enumeración
de selectores, y el logo se agregó la vuelta anterior sin entrar ahí;
el beso nunca había estado. Se dibuja perfecto y está mal, que es la
familia de siempre. **Lo que entra con el sobre se va con el sobre.**

**Y lo que lo cuida NO es la lista**, porque fue justamente una lista
la que se quedó corta. `pruebas/invitacion_mirar.js` recorre ahora
todos los descendientes del sobre mientras la portada ya está más de
la mitad encendida y se queda con el más opaco, midiendo la opacidad
**efectiva** —multiplicada por la de todos sus padres—; cuenta sólo
al que PINTA algo propio (un fondo, una imagen, un dibujo o su
texto), así que un contenedor vacío no inventa una falla, y saltea la
carta, que vuela sola. Verificada rompiéndola a propósito: con el
logo sin fundido da **1 falla**, *"algo del sobre se queda OPACO
sobre la portada: 1.00 en «IMG» con la portada en 0.66"*.

**Y encontró la misma falla en una invitación ya publicada**:
`facuymaxi/` dejaba pegados los dos renglones del sobre y su botón,
exactamente igual. De paso, el tope de la carta de `almi15/` era el
cálculo viejo, así que **se salía 159px de la pantalla** justo cuando
más se lee — que es el *"queda medio cortado lo que dice"* que el
dueño ya había marcado en ambar15, sin arreglar en la de al lado.
Las dos se arreglaron con esto. Es la lección de siempre: **una
trampa que se arregla en un lugar hay que ir a buscarla a los otros**,
y una medición nueva se corre contra TODAS las invitaciones, no sólo
contra la que la motivó.

##### Y lo que la carta lleva adentro se va antes que la carta

*"El problema está en que en la transición se agranda ese logo y queda
mal cuando desaparece."* La carta crece hasta **1,7x** mientras vuela,
y lo de adentro crece con ella: el AB del lacre —lo único oscuro y
macizo que lleva— llegaba a **34,8px, OPACO, con la portada ya en
1,00**, y recién ahí desaparecía de golpe. Agrandado un 83% encima del
afiche, que tiene su propio empapelado de monogramas, no se lee como
un sello: se lee como una mancha.

**Se va primero**, en 0,24 s, apenas arranca el vuelo: mientras se ve,
crece un 24% y no más. El texto de la carta sí se queda —es lo que se
lee mientras se acerca, y para eso se le animó el relleno de abajo—;
el AB ya hizo su trabajo en el lacre.

**La regla, que es pariente de las otras dos del sobre** (*lo que entra
con el sobre se va con el sobre*, *lo que se mueve no puede ser lo que
se esconde*): **lo que viaja adentro de algo que se agranda también se
agranda**, y un dibujo macizo agrandado y medio transparente encima de
otra cosa es una mancha, no una transición.

Lo mide `pruebas/invitacion_mirar.js`: mientras la portada ya está más
de la mitad encendida, el emblema de la carta no puede seguir a la
vista, y la falla dice cuánto creció. Se saltea sola en una carta sin
emblema. Contra el código anterior da **1 falla**: *"el emblema de la
carta sigue a la vista sobre la portada: opacidad 1.00 y 36% más
grande, con la portada en 0.66"*.

#### La bata, de emblema de "para la noche"

*"Donde dice para la noche y está el icono quiero que lo cambies por la
primera imagen"* — una bata de raso a rayas rosas, con su ribete negro
y su moño.

**Reemplaza al medallón de la percha**, igual que el pase VIP y el
afiche de la fecha, y por el mismo motivo: un icono de línea de 42px no
es lo que se pidió. Va del tamaño al que se leen las rayas, el ribete y
el moño.

**Acá no hubo nada que recortar**: vino ya con fondo transparente, así
que lo único que se le hizo fue sacarle el aire de alrededor. Se
comprobó que no trajera motas sueltas —una sola isla opaca en todo el
archivo— y pesa **27 KB** contra 1,4 MB del PNG.

**Y no lleva sombra, al revés que la bolsa del regalo.** La bolsa es
rosa sobre papel rosa y sin sombra se funde; la bata cae sobre la banda
oscura, donde el rosa claro se despega solo. *Un emblema no se pone
donde entra: se pone donde se lee* — y cómo se lo prepara depende de
sobre qué cae.

Como las otras tres piezas que mandó ya hechas, **se pone recién cuando
el archivo cargó de verdad**: si faltara queda el medallón con la
percha dibujada, que se sostiene sola.

#### El empapelado de "¿Venís?"

*"Esto es para la parte del ¿Venís?"* — el monograma alado repetido
sobre el rosa, como un papel de pared.

**Va de a BALDOSA, no la imagen entera estirada.** Probado y
descartado: una foto de 1024x1536 puesta a `cover` en una sección tan
larga como un formulario escala los monogramas a 300px, y lo que se ve
no es un empapelado — son dos alas gigantes detrás de las letras.

**Y la baldosa no es un recorte de la captura.** Sus bordes no
coinciden —la luz de la imagen cae de un lado—, así que repetida deja
una raya cada pantalla. Se recortó UN monograma, se lo fundió contra el
rosa plano con un velo radial, y se lo plantó **cinco veces** en la
baldosa: al centro y en las cuatro esquinas. Eso es un *medio paso*
seamless — las filas salen corridas la mitad, igual que en la captura, y
no queda un solo borde que empalmar. Pesa **15 KB**.

**El formulario NO va sobre el empapelado: va sobre una tarjeta negra.**
Dos motivos y ninguno es de gusto. Uno, el texto: todo lo de adentro
está escrito para la banda oscura y sobre el rosa no se leería nada.
Dos, el MEDIDOR: la tarjeta es un color **macizo** y no un degradé,
porque un degradé opaco de punta a punta es un bloque que la suite no
puede medir — la misma decisión que ya está escrita para el panel de la
página pública.

##### Y la tarjeta se puso TRANSLÚCIDA, para que se vea el empapelado

*"A este formulario deberías ponerlo con transparencia así se ve el
diseño de abajo"*, mirándola publicada. El empapelado estaba y la
tarjeta negra lo tapaba entero justo donde más superficie hay.

**La tarjeta no se puede sacar** —todo lo de adentro está escrito para
la banda oscura y sobre el rosa no se leería nada—, pero sí dejar pasar
luz: queda en `rgba(20,11,16,.78)`. **El número no es a ojo**: la
tarjeta es casi negra, así que la transparencia cuesta poquísimo
contraste. Medido contra el píxel MÁS CLARO del empapelado —que es casi
blanco— el peor texto da 6,4:1 en la cuenta, y con el píxel de verdad
la suite informa **55 renglones y el peor en 5,5:1**.

**Y lo que lo cuida de acá en adelante no es esa cuenta.** Translúcida,
la tarjeta deja de ser un fondo opaco, así que el medidor compartido la
atraviesa y cada renglón del formulario pasa a medirse CON EL PÍXEL
contra lo que de verdad quedó atrás. El día que se aclare el empapelado
o se suba la transparencia, la suite lo dice sola. Verificado
rompiéndolo a propósito: con la tarjeta sin fondo da **4 fallas**, una
por aparato, y el "¿Venís?" en 1,08:1.

El filete de afuera subió de `.08` a `.16`: translúcida, la tarjeta se
funde con el rosa en los bordes y deja de leerse como una tarjeta
apoyada encima.

###### Y el `<details>` cerrado volvió a morder, ahora en el medidor del píxel

Apenas se puso la transparencia la suite informó **cuatro renglones a
1,13:1** en los cuatro aparatos, y los cuatro eran del aviso de datos
—*"Lo que ponés se usa solo para organizar la fiesta"*, *"voluntario"*,
*"la familia de Ámbar"*—. Su color es `#E8CBD6` y se lee perfecto: con
el `<details>` abierto a propósito, esos nueve renglones miden **5,5:1**
como todos los demás.

Lo de adentro de un `<details>` cerrado **no está dibujado**, pero en
Chrome tiene caja igual: el navegador lo esconde con
`content-visibility`, no con `display:none`, para que el buscador de la
página lo encuentre. Así que la comprobación comparaba el color de un
texto que no se pinta contra el píxel de lo que hubiera abajo.

**Es la MISMA trampa que esta suite ya tenía escrita y resuelta** para
la comprobación de los controles tapados, aplicada a la mitad de las
comprobaciones. Es la regla de la caja de 0x0 otra vez: *antes de medir
algo, comprobar que ESTÉ*. Y la lección que deja: una trampa que se
arregla en un lugar hay que ir a buscarla a los otros, porque el que la
descubre es el que la escribió y no vuelve a pasar por ahí.

Verificado que el arreglo no la deja ciega: con la tarjeta sin fondo
sigue dando las 4 fallas.

##### Una sección empapelada es un PUNTO CIEGO de la suite

Y es la lección que deja esto. El medidor compartido sube por el árbol
hasta el primer `background-color` opaco y, si ese mismo elemento trae
además un `url(...)`, **el número que informa es el del color y no el
del dibujo**. O sea que cualquier texto apoyado sobre un fondo dibujado
da verde mire lo que mire. Comprobado: con el formulario entero cayendo
sobre el rosa fuerte —1,1:1, o sea que no estaba— la suite seguía
diciendo *"sin fallas"*.

Ahora `pruebas/invitacion_mirar.js` lo mide **con el píxel**, igual que
el texto sobre la foto de la portada, y sólo donde hace falta: un
renglón que tenga entre él y la sección un ancestro con fondo opaco
propio ya lo midió bien el medidor compartido y se saltea. Lo que queda
es exactamente lo que se apoya sobre el dibujo. Contra el código
anterior —con la tarjeta sin su fondo— da **4 fallas**, una por aparato.

**Y la primera versión de esa comprobación no medía lo que importaba.**
Sacaba una captura POR RENGLÓN y cortaba en 24 para no tardar una
eternidad — y los 24 primeros caían todos en las secciones de arriba,
así que el formulario, que era justo el que estaba en riesgo, no se
medía nunca. Daba verde con el texto sobre el rosa. Ahora es **una
captura por PANTALLA**: se baja de a 85% de la ventana y se miden todos
los renglones que entran enteros. Es la regla de siempre —*una prueba
que pasa siempre no prueba nada*— con un tope de tiempo de disfraz.

#### El reloj de arena sobraba

*"Ese icono queda feo. Sácalo"*, mirándola publicada: el medallón del
reloj de arena, arriba de la cuenta regresiva.

Tenía razón y el motivo se puede decir en una línea: **un reloj de
arena dibujado arriba de un reloj que corre dice dos veces lo mismo, y
el de verdad es el que está abajo.** En las otras secciones el medallón
es lo único que anuncia de qué habla el bloque antes de leerlo; acá el
bloque ES un reloj andando, así que el dibujo no anuncia nada y encima
le compite al dato, que es lo único que se mira.

Se saca quitándole el `data-ico` a esa sección —el medallón lo pone el
JS para cualquiera que lo lleve— y el icono, que quedaba sin usar, se
fue de la tabla. **La canción y el cierre ya estaban así**, cada uno
por el mismo motivo: donde el bloque trae su propio emblema (el
reproductor, la marca), un medallón arriba son dos emblemas apilados.

#### El afiche de "guardá la fecha"

*"Este ponelo en el icono de guardá la fecha"* — un afiche de "ÁMBAR
FEST 2027" en negro sobre rosa, con el monograma alado y su corona.

**Reemplaza al medallón del calendario**: un afiche que dice el nombre
de la fiesta y el año ES guardar la fecha, así que va donde estaba el
icono de línea. Abajo quedan "Anotalo · Guardá la fecha", el mes de
abril con el 10 marcado y el horario.

**Acá NO se recorta, al revés que el pase VIP y la bolsa.** Su tinta es
NEGRA y la banda de esta sección también: sin su papel rosa no quedaría
nada a la vista. Se apoya como un afiche impreso sobre la banda oscura,
con la esquina apenas redondeada y su sombra, que es lo que lo despega
del fondo. Es la regla de siempre vista al revés: **un emblema no se
pone donde entra, se pone donde se lee** — y cómo se lo prepara depende
de sobre qué cae, no de lo que se hizo la vez anterior.

Pesa **21 KB** en `.webp`; el PNG que llegó pesaba 1,1 MB. Y como las
otras tres piezas que mandó ya hechas, **se pone recién cuando el
archivo cargó de verdad**: si faltara queda el medallón con el
calendario dibujado, que se sostiene solo.

#### La portada es un afiche, y el afiche manda

*"Esta va a ser la portada."* — una pieza ya terminada: la foto de ella
sobre un rosa fuerte, "ÁMBAR · MIS XV AÑOS" en una didona cromada y el
monograma alado con su corona.

**Con el afiche puesto, la portada no vuelve a decir nada de eso.** El
nombre, el hilo, el renglón de abajo, las alas, el óvalo, el encaje, el
marco y el beso se esconden: repetirlos sería decir dos veces lo mismo,
una de ellas con otra letra. Lo único que queda encima es el "Deslizá".

**Va ENTERO, no recortado.** El afiche es 3:4 y un teléfono es 9:19.5:
recortándolo para llenar la pantalla se le van las dos puntas de
"ÁMBAR" y la mitad del monograma. Y el ancho sale del ALTO que queda,
no de un porcentaje del ancho — la misma regla que la ficha de celular
del carrusel del sitio—, porque medido por el ancho, en una pantalla
baja el pie del afiche cae abajo del borde. Y sin esquinas
redondeadas, que ahí dibujarían cuatro esquinitas rosas donde no hay
ningún borde.
**Como nunca tiene la forma del teléfono, SIEMPRE queda una banda**, y
qué se pone ahí depende del BORDE del afiche. Con el primero, que
tenía el fondo plano, alcanzaba con el mismo rosa sacado de sus
esquinas y el afiche iba centrado. Con el de ahora no: está más abajo,
en *"La foto nueva, y la banda que tuvo que aprender a dibujar"*.

**El nombre no se borra: se esconde.** Es el `h1` de la página y lo que
el afiche dice lo dice DIBUJADO — un lector de pantalla no lee una
imagen. Queda de 1x1 con `clip-path`, a la vista de nadie y presente
para quien lo necesita.

**Y si el archivo falta, no queda una pantalla vacía**: no se pone la
clase y vuelve la portada tipográfica entera, que se sostiene sola. Es
lo mismo que ya hacen la marca del cierre, la bolsa y el pase VIP, y por
eso el `<img>` lo crea el JS y nunca el HTML.
**La foto del óvalo se pide RECIÉN si el afiche no vino**: con el afiche
puesto el óvalo está escondido, así que bajarla igual son 29 KB que el
invitado paga por una foto que no va a ver nunca.

Lo mide `pruebas/invitacion_mirar.js` con una comprobación nueva, y las
dos mitades: con el afiche, que cargue, que entre entero en la pantalla
y que **el nombre no se escriba dos veces**; y sin él —forzado con un
404, porque en el camino normal no se recorre nunca— que no quede un
cuadrado roto, que no se quede en modo afiche y que el nombre vuelva a
la vista. Verificada rompiéndola a propósito —poniendo la clase y el
`<img>` sin esperar a que cargue— da **3 fallas**.

#### La foto nueva, y la banda que tuvo que aprender a dibujar

*"Necesito que cambiemos esta foto para la portada. Ajústala y que
quede bien."* — el mismo afiche con otra foto, y con una diferencia que
cambia todo: **el empapelado le llega hasta el borde.** El anterior
tenía el fondo plano, así que las bandas de arriba y abajo con ese
mismo rosa desaparecían. Acá el relleno plano deja una juntura a lo
ancho de la pantalla: el dibujo arranca de golpe.

Son tres decisiones y ninguna es de gusto:

- **El afiche se apoya ABAJO y va a todo el ancho.** Medido, su borde
  de arriba es un rosa parejo (±8 a lo ancho) y el de abajo es la
  remera y el pelo. Así que todo el sobrante va arriba, donde un
  relleno puede pasar desapercibido, y la figura termina en el borde
  de la pantalla: una figura que sale por abajo se lee como algo
  pensado, y cortada contra una banda se lee como una foto pegada en
  el medio.
- **La banda CONTINÚA el empapelado, con una baldosa recortada del
  propio afiche.** Los períodos se midieron comparando parches, no a
  ojo: **325 x 351**. Se corta un período exacto de una zona limpia y
  se lo **rueda 70px** para que su borde izquierdo caiga en la misma
  fase que el borde izquierdo del afiche; va colgada del borde de
  arriba del afiche (`bottom:100%` + `background-position:left
  bottom`), así la fase sigue enganchada sea cual sea el alto de la
  pantalla. El `29.926%` es `325/1086`: escrito como fracción del
  ancho del afiche, la trama se dibuja siempre a su misma escala.
  Pesa **7,5 KB**.
- **La baldosa del formulario NO servía**, y es lo primero que se
  probó: es el mismo dibujo, pero con otra escala, otro rosa y su
  propio viñeteado, que a este tamaño deja los cuadrados a la vista.
  Mismo monograma no es misma trama.

**Y volvió el selector `> *`, por QUINTA vez.** La flecha de "Deslizá"
tenía que pasar a `position:absolute` para no empujar al afiche hacia
arriba —y devolver la banda que vinimos a sacar—, y
`#portada > :not(.encaje):not(.marco):not(.beso)` le ganaba en
especificidad y la dejaba en `relative`: ahí un `bottom` no ancla
abajo, **sube el elemento**, que es exactamente la trampa ya escrita
para `mia15`. Se arregla eximiéndola de esa regla y dándole su propia
`position:relative`, como ya estaban el encaje, el marco y el beso.
De paso la flecha cambia de color: cae sobre la ropa oscura y el negro
de siempre ahí no existe.

##### La juntura se mide por la TEXTURA, no comparando dos filas

La primera versión de la comprobación restaba la fila de arriba contra
la de abajo del borde, y **daba MENOR diferencia con la banda rota**
(4,9) que con la trama puesta (9,3): el borde del afiche también es
liso, así que dos filas pegadas son casi iguales en los dos casos — el
dibujo empieza unos píxeles más abajo. Lo que se ve es **plano arriba
contra dibujo abajo**, así que se mide el desvío de la luminancia en
una franja de 70px a cada lado y se compara. Con la trama da **0,50**;
con la banda plana, **0,06**. El tope quedó en 0,25.

Se saltea sola donde no aplica: sin banda, o con un afiche de borde
liso —que es justamente el caso del afiche anterior, donde la banda
plana era la respuesta correcta—. Verificada rompiéndola a propósito:
con la banda sin su trama da **1 falla**.

#### Lo que quedó debajo del afiche

Dos cosas de la vuelta anterior quedaron hechas y **no se ven**, porque
el afiche llegó después y las reemplaza. No son un sobrante: son la
portada tipográfica, que es a donde cae todo si el archivo falta.

- **El nombre pasó de la manuscrita a CAPITULARES espaciadas**, que es
  la forma de una etiqueta de perfume: "ÁMBAR" grande y "XV AÑOS" chico
  debajo son un solo bloque que se lee *"Ámbar XV años"*. Se probaron
  cinco familias mirándolas (`pruebas/letras.js`) y la mejor era la
  **Bodoni Moda** — pero va la **Playfair**, que ya está cargada para
  los títulos: bajarle a cada invitado una familia entera por un texto
  que sólo aparece si el archivo falta es peso regalado.
- **Las tres estrellas apiladas** que había pedido con una captura —la
  de atrás en animal print, la del medio rosa y la de adelante plateada,
  los tres colores que mandó la clienta—. Van dibujadas y no es la
  imagen de la referencia: una imagen de la que no sabemos la licencia
  no se publica. Están donde estaba el moño, que salió de ahí porque ya
  está en los cuatro cortes, en el sobre y en tres iconos, y dos adornos
  apilados entre el óvalo y el nombre se leen como un error de maqueta.
  **Ponerlas encima del afiche no se hizo a propósito**: el afiche es un
  diseño cerrado y pegarle estrellas arriba lo arruina.

**Y un animal print chiquito se lee como una VACA.** Costó seis vueltas
y la lección es la de siempre —se ve mirando, no leyendo el código—:
manchas macizas dan vaca; rayitas sueltas dan granos de arroz. Lo que lo
vuelve leopardo son tres cosas juntas: el anillo ROTO (dibujado con UN
círculo punteado, no con cuatro elipses sueltas, que se separan), el
centro del anillo TEÑIDO un tono más hondo, y las rosetas repartidas en
una **grilla sacudida** y no al azar puro —al azar se amontonan de un
lado y media estrella queda lisa—. Y el print va en negro sobre rosa
claro, no en marrón: el marrón sería un cuarto color en una paleta de
tres.
**Y la composición importaba más que el dibujo**: la estrella de atrás
estaba tapada en un 80% por las otras dos, así que su print no se veía
por fino que se dibujara. Separadas, se lee.

#### El teléfono de la madre la daba vuelta entera

La clienta avisó que la invitación *"sale así"* en el teléfono de la
madre, y que **a todos los que se la manda les sale igual**. Esa
segunda mitad es la que dice qué pasa: si le pasara a un solo aparato
sería una configuración suya; si le pasa a todos, es la pieza.

Es el **modo oscuro de Android**. Cuando una página no declara de qué
color es, Chrome en Android y Samsung Internet le **invierten la
luminosidad a todo**, y el tema oscuro del sistema viene prendido en
casi todos los teléfonos. Reproducido acá y medido: el papel rosa a
rayas sale **marrón oscuro**, el **encaje negro sale blanco**, el sobre
sale bordó y el texto queda lavado. **No tira ningún error**: la
invitación se dibuja perfecta y equivocada.

**Las fotos no se invierten** —el modo oscuro no las toca— y eso es lo
que lo hace difícil de ver: la portada de Ámbar es el afiche, o sea una
imagen, así que la primera pantalla se ve bien y lo dado vuelta empieza
al segundo scroll. Es la misma familia de siempre: *se dibuja perfecto
y está mal*.

Se apaga con una línea, `<meta name="color-scheme" content="only
light">`, que quiere decir *"esta pieza es clara y así va"*. **No
cambia nada de lo que vemos nosotros**: lo único que hace es sacarle al
navegador el permiso de adaptarla.

**Está puesto en las ocho invitaciones y en los seis listados** (y en
la plantilla), no sólo en la de Ámbar: es la regla de siempre —*una
trampa que se arregla en un lugar hay que ir a buscarla a los otros*—.
Medido una por una, lo que el teléfono les cambiaba: `juliayfranco`
**100%**, `mia15` 50%, `ambar15` 44%, `almi15` 40%, `magali15` y
`facuymaxi` entre 3 y 10%.

**Y falta la página pública y el muro**, medidos igual y sin arreglar
todavía: `/` cambia **28,8%** —que es donde cae el tráfico pagado— y
`/muro?demo=1` un 8,9%. `/rollo`, la de 404 y los listados ya daban 0.
Tocar eso es fuera de `<evento>/`, así que pide la tanda entera y va en
una pasada aparte.

**Lo mide `pruebas/invitacion_mirar.js`, y mide el EFECTO y no la
etiqueta**: dibuja la invitación dos veces —normal y con el modo oscuro
automático pedido por CDP, que es el mismo que aplica el teléfono— y
compara los píxeles. Así da igual cómo esté apagado. Dos cosas que
costaron una vuelta cada una:

- **Mirando sólo la primera pantalla daba 0%** con la invitación dada
  vuelta de la mitad para abajo, porque arriba hay una foto y las fotos
  no se invierten. Se mide la pieza entera, pantalla por pantalla.
- **Y no se puede sacar una captura `fullPage`**: para eso el navegador
  le cambia la medida a la ventana, y **eso borra el modo oscuro que
  acabamos de pedir**. Medido: con `fullPage`, 0% de diferencia con la
  página rota; de a pantallas, 43,5%. Es la caja de 0x0 otra vez — la
  medición apagaba sola lo que venía a medir.

Verificado sacando la línea a propósito: con el `meta` puesto da
**0,0%** y sin él **43,5%**, contra un tope del 4%.

#### Lo que sigue faltando

**El titular de la cuenta** del alias —el nombre que le muestra el
banco al invitado cuando lo pega— y **hasta cuándo se puede
confirmar**: a esa pregunta contestó *"confirmar asistencia"*, que no
es una fecha. Los dos siguen como huecos con su píldora, y vacíos no
dibujan el renglón en vez de inventarlo.

### `facuymaxi/`: el casamiento de Facundo y Maximiliano

Sábado 22 de mayo de 2027 · La Mansión del Rey (Vera Mujica 68, Rosario)
· de 21 a 4 h. La ceremonia civil es **durante la fiesta y en el mismo
salón**, así que va en un solo bloque: partida en dos —"ceremonia" y
"fiesta"— el invitado lee dos lugares y dos horarios donde hay uno
solo, y aparece temprano en una puerta cerrada.

Lo que pidieron ellos, por escrito: *"moderna y elegante, pero cálida,
romántica y descontracturada… diseño limpio, buena tipografía,
transiciones delicadas y una presentación atractiva de nuestras
fotografías… sin demasiados adornos ni elementos innecesarios"*.

#### Las seis referencias, y dónde está cada una

La primera vuelta salió **sin sobre** y con una estructura propia. El
dueño miró y mandó **seis capturas** con una línea: *"usá todos estos
recursos para cada una de las cosas que dice ahí"*. Así que la pieza se
rehizo alrededor de ellas, y **cada captura tiene su lugar**:

| Referencia | Qué se tomó | Dónde está |
|---|---|---|
| Alejandra y Mateo | el monograma de iniciales en su marco de ramas, "NOS CASAMOS", la **fecha en una línea** con separadores, la ramita, la foto con el **borde ondulado**, la frase en cursiva y el **reproductor** de la canción | la portada y la tarjeta de la canción |
| Darya y Nikolay | la **galería en trío** escalonado (después la reemplazó la tira a sangre) | `#galeria` |
| Timing / Dress code | el **cronograma** de horas colgando de una línea, los **títulos con eco** y los **círculos** de la paleta | `#timing` y la tarjeta de dress code |
| El calendario | el **arco** oscuro y el día marcado con un **corazón** | `#fecha` |
| Confirmación y contactos | la **cuenta regresiva en fichas** y la sección de **contacto** con WhatsApp | `#invitacion` y `#contacto` |
| Mark & Esenia | **el sobre** con su sello de lacre y "tocá el sobre para abrirlo" | `#sobre` |

**Lo que se copia es el RECURSO, no el color de otro.** Las capturas son
casi todas blanco y negro o verde inglés; la paleta la mandaron los
novios —verde salvia, marfil cálido, champagne, dorado suave y gris
antracita— y es la que manda. Los círculos del dress code son esa
paleta, no el "total black" de la referencia.

**Y lo que se sostiene de la primera vuelta, porque es de esta pareja y
no de una referencia**: los dos nombres **entran desde los costados y se
encuentran en el medio** —ahora al abrirse el sobre, que es cuando hay
alguien mirando—, el **hilo** de un píxel con su rombo que cose las
secciones, y que **todo vaya de a dos y del mismo tamaño**: las dos
iniciales del monograma, los dos nombres, las dos tarjetas de los
detalles. Es la regla que ya está escrita para `mateoylucas/`: en una
invitación hétero hay un orden heredado (la novia primero, los padres de
cada lado); acá cualquier jerarquía sería una declaración, así que no
hay ninguna.
**La sección "No siempre se pudo"** de `mateoylucas` **no** se puso: ahí
mismo dice que para una pareja de verdad es opcional **y hay que
preguntarlo**. Está preguntado.

#### Lo que costó una vuelta, y ninguna tiraba un error

- **El sobre dejaba ver la carta.** La carta vivía ADENTRO del sobre y
  pintaba por encima de los pliegues laterales: dos cuñas de papel crema
  asomando arriba. La primera corrección fue acomodar el apilado; la
  buena fue mover la carta **DETRÁS** de un frente opaco. Adentro,
  cualquier parte que los cuatro pliegues no tapen se ve, y hay que
  acertarle al apilado y al tamaño; atrás no hay nada que tapar. El
  `z-index` salta a los 0,45 s con una transición de 0 s y retardo —no se
  interpola— así que la carta pasa adelante justo cuando el sobre ya se
  está yendo.
- **`#portada > *` le gana a una clase.** Esa regla sube el texto por
  encima del velo y de paso le pisó el `position:absolute` a la caja de
  la foto y a "Deslizá": la capa absoluta pasó a ser una fila más y
  "Deslizá" quedó montado arriba del renglón de abajo. Es exactamente lo
  que ya había pasado en `mia15`. Las dos recuperan el suyo en una regla
  con el id adelante.
- **El día marcado del calendario llevaba su fondo DETRÁS**, en un `<i>`
  posicionado, y el medidor informó el "22" a **1,00:1**. Tenía razón
  según lo que mide: sube por el árbol buscando el primer fondo OPACO, y
  el del `<td>` es transparente, así que encontraba el papel de la
  tarjeta. Es la misma trampa del `background-clip:text`.
  **Con el corazón de la referencia 4 el problema vuelve**, porque un
  corazón es una forma y no un rectángulo de color. Se resuelve
  eligiendo un color de texto que funcione contra LAS DOS COSAS: el
  corazón va en oro hondo y el número en marfil, que se lee sobre el
  corazón (3,99:1) y sobre el fondo del arco (10,8:1). El medidor ve una
  y el invitado ve la otra, y las dos pasan.
- **El eco del título solo sirve en UNA línea.** La palabra en cursiva
  corrida encima funciona cuando el título no envuelve; envuelto a dos
  líneas el eco cae en el hueco del medio y se lee como un error de
  maqueta. No se adivina por la cantidad de letras —depende del ancho y
  de la tipografía—: se MIDE la caja ya dibujada y, si envolvió, el eco
  se saca.
- **La tarjeta del dress code decía dos veces lo mismo** ("Elegante
  sport" de título y "Elegante sport · elegante de fiesta" abajo). El
  título y el detalle van partidos en el CONFIG. Y el icono tuvo su
  vuelta: la camisa a 28px se leía como un libro abierto. Se eligió
  mirando, entre cuatro a 26px: quedó la **percha**, que es la que se lee
  y además es la que no promete etiqueta.

#### Lo que no se inventa

**La paleta tuvo que crecer para que el texto exista**: el dorado que
mandaron (`#B79A68`) sobre el marfil da **2,38:1**. Sobre el papel va
`#8E7342` (3,99:1) y sobre la tinta el de ellos (4,54:1). Los
contrastes se calcularon ANTES de escribir una línea de CSS.

**Las letras son Newsreader + Figtree**, elegidas MIRANDO con
`pruebas/letras.js` contra cuatro parejas: la Newsreader es una serif de
trazo parejo —no una didone, que en un teléfono se parte— y la Figtree
tiene la equis alta. Con Lora, *"Sábado 22 de mayo de 2027, de 21 a 4
h"* se partía y dejaba un `h.` solo en el renglón de abajo. La tercera
familia (Parisienne) es **solo** para la "y" y la frase manuscrita: no
lleva un solo texto largo.

**La canción SUENA** desde el 01/11/2026 — está contado abajo, en
*"Sin sobre, con las fotos, con la canción sonando y con SU paleta"*.
Hasta ese día el reproductor era un dibujo y el play LLEVABA a
escucharla, porque *el archivo no es nuestro*; el dueño pidió lo
contrario y es la misma excepción que `ambar15/`. Lo que no se afloja
es la mitad técnica: ningún reproductor de un tercero, que la CSP no
lo deja y además sería un tercero corriendo código en la pantalla del
invitado.

**El cronograma solo tiene lo que mandaron**: la ceremonia a las 21 y el
final a las 4. Una hora inventada manda a la gente a la hora
equivocada.

**El contacto del día de la fiesta está vacío a propósito.** El WhatsApp
de Click Eterno **no va ahí**: nosotros no organizamos la fiesta, y un
invitado con un problema a las dos de la mañana tiene que caer en
alguien que esté en el salón.

**El texto del regalo es de ELLOS, casi literal**, igual que el "Te
invito" de `mia15`: es su voz, no la nuestra. El corazón que escribieron
va dibujado en el dorado de la paleta en vez de ir como emoji: un ❤️
rojo sería el único rojo de toda la pieza. Y el alias, **`FACUYMAXI.BODA`,
se escribe tal cual lo mandaron.**

**LOS HUECOS.** `CONFIG.borrador` dibuja una píldora donde falta un
dato, igual que en `ambar15` — un dato que no mandaron no se inventa y
tampoco se deja en blanco, porque en blanco nadie se acuerda y se
publica así. **Hoy la bandera está en `false`** y no se dibuja
ninguna: las mandó sacar el dueño el 02/11/2026. Lo que falta sigue
siendo lo mismo y sigue sin inventarse —su renglón no se dibuja—,
pero el recordatorio ya no está en la pantalla, sólo en este archivo.
Son tres: **hasta cuándo se puede confirmar**
(dijeron "durante marzo de 2027, confirmamos el día exacto", y eso no
es una fecha), **el titular de la cuenta** del alias y **a quién le
escriben los invitados el día de la fiesta**. Eran cinco: las fotos
llegaron el 01/11 y los horarios el 02/11, y cada píldora desapareció
sola el día que el dato existió —que es lo único que hace que esto no
se publique con un hueco olvidado—. Acá la píldora cuelga de una bandera explícita y no
de `CONFIG.evento` como en `ambar15`, porque esta invitación nace con su
pestaña de planilla andando: la confirmación entra desde el primer día.

**Sin fotos no queda ningún hueco visible**: la banda de la portada y la
galería se esconden enteras y la portada tipográfica se sostiene sola.
Con ellas, la galería va en trío sin marcos y **sin puntitos**: las
fotos son el contenido. Por eso `pruebas/invitacion_mirar.js` dejó de
exigir un puntito por foto siempre y lo exige **solo si la galería tiene
puntitos** — lo que hay que agarrar es un punto que no lleva a ninguna
foto (el pase de `mia15`, que sigue medido), no que una galería esté
hecha con pase.

`facuymaxi` está en `lib/planillas.json` y tiene su `facuymaxi/listado/`,
así que el tablero de confirmaciones funciona desde el día uno sin un
solo paso del lado de Google. Lleva `noindex` y **no está en la galería
de Trabajos ni en `/invitaciones`**, por lo mismo que `mia15`, `almi15` y
`ambar15`.

**La carpeta se llama `facuymaxi` y se puede renombrar** mientras el
link no se haya repartido: la dirección es
`clicketerno.com.ar/facuymaxi` y sale del alias que eligieron ellos. Un
link repartido no se puede mover; uno que nadie tiene, sí.

#### Las tres referencias nuevas, y lo que cambió con ellas

El dueño mandó tres capturas más —una portada rusa con el reproductor
arriba, un timing marrón con el calendario enmarcado y un cronograma
que serpentea, y una galería en mosaico con sus preguntas— y una
línea: *"me gustaría que haya ese estilo y pongas todo lo que te piden
en ese texto"*. La pieza se rehizo alrededor de ellas; lo que piden
los novios ya estaba y no se tocó.

**La portada es otra.** Ahora es el REPRODUCTOR arriba de todo sobre
el papel, la FOTO a sangre en el medio, y abajo una BANDA DE TINTA con
el monograma de dos iniciales separadas por una raya, los nombres en
capitulares espaciadas, la fecha en números (`22.05.2027`) y la
flecha. Se fueron el marco de ramas y el borde ondulado de la foto:
eran de la referencia anterior y la nueva corta derecho, que además es
lo que hace que la foto y la banda se lean como una sola pieza.

**Es UNA sola maqueta, con foto y sin foto.** Lo único que se esconde
es la foto; todo lo demás está en los dos casos. Así no hay dos
portadas que medir y el día que llegue el archivo no se mueve nada
más — al revés de `mia15`, donde la portada con foto y la tipográfica
son dos caminos distintos y cada cambio hay que mirarlo dos veces.

**El reproductor se mudó y por eso se fue de la ficha.** Estaba
dibujado en la tarjeta de "nuestra canción" y ahora vive en la
portada; la tarjeta quedó con el nombre, el autor y un botón que lleva
al mismo lado. Dibujarlo en los dos lugares es *dos dibujos para lo
mismo, y uno se queda atrás*. Y los dos mandos de los costados van
declarados decoración (`aria-hidden` + `pointer-events:none`): con una
sola canción no pueden hacer nada, y *un botón que no puede hacer su
trabajo molesta más que no estar*.

**La frase y el lugar se fueron de la portada, y no es de gusto.**
Medido: con los dos renglones puestos la portada daba **973px en un
iPhone de 844**, así que "Deslizá" —lo único que avisa que hay más
abajo— quedaba debajo del borde. La frase bajó a "Queremos que estés",
donde encima se lee mejor, y el lugar ya vivía en "dónde y cuándo".
Con eso la portada mide **836** y entra entera. Es la misma lección ya
escrita para `ambar15`: *un renglón que se agrega a una portada no es
un renglón, es todo lo que estaba abajo, movido*.

**El calendario pasó del arco al MARCO**, con sus cuatro esquinas
floreadas y la barra del horario de inicio abajo ("EMPIEZA · 21:00",
que es el "START 14:30" de la captura). Y el corazón del día pasó a
ser **de contorno**, que además arregla una medición: con uno relleno
hay que elegir un color de número que funcione contra el corazón Y
contra el fondo, porque *el medidor ve una cosa y el invitado ve la
otra*; de contorno no hay dos cosas, el número cae sobre el fondo
macizo de la tarjeta y lo que informa el medidor es lo que se ve.
**Las dos cosas se dieron vuelta después**, con otra referencia del
dueño: está abajo, en *"El calendario vuelve a su arco"*.

**El cronograma serpentea**, con los iconos dibujados a los costados y
los nodos de corazón sobre la línea. Tres cosas que costaron una
vuelta cada una y **ninguna tiraba un error**:

- **La línea se MIDE, no se estira.** La primera versión era un SVG de
  `viewBox` fijo estirado al alto de la lista con
  `preserveAspectRatio:none`: estirada así, la curva cruza el centro
  en los BORDES de cada renglón y no en su medio, así que los
  corazones —que van centrados en su renglón— caían justo donde la
  curva está más lejos y se veían **flotando al costado de la línea**.
  Y los renglones no miden todos lo mismo, porque el texto envuelve.
  Ahora el camino se arma con las cajas de verdad (`offsetTop` +
  `offsetHeight/2`) y se vuelve a dibujar al cambiar el tamaño y
  **cuando terminan de bajar las letras**: una curva medida contra la
  tipografía de respaldo pasa al lado de los corazones.
- **`nth-of-type` y no `nth-child`.** El primer hijo de la lista es el
  SVG de la línea, así que contando HIJOS el primer renglón salía del
  lado equivocado — y eso se ve perfecto, sólo que espejado.
- **Un icono que no está en la tabla no dibuja nada y el renglón igual
  se ve.** Los iconos van por NOMBRE en `CONFIG.timing`: agregar una
  hora del resto de la noche tiene que ser una línea, no un dibujo.

**La galería es un MOSAICO con su visor.** Una alta a la izquierda,
dos cuadradas a la derecha y el resto fluyendo. **La ancha de cierre
no es decoración**: la alta se come dos filas de la columna
izquierda, así que con una cantidad PAR de fotos queda siempre un
hueco al final, y la última ocupando las dos columnas es lo que lo
tapa — con cualquier cantidad el mosaico no tiene un agujero. La
altura de las filas la fijan las cuadradas, así que la alta se estira
sola sin que nadie calcule nada.

**Y el botón "Ver todas las fotos" hace un trabajo de verdad**: en el
mosaico van recortadas y en el visor se ven enteras. Las imágenes son
LAS MISMAS que ya están en la página, así que abrirlo no baja un solo
byte más. Cierra con ✕ y con Escape, y devuelve el scroll del body.
Si no hay fotos el botón no existe.

**Las preguntas, y SOLO las que ellos contestaron.** "¿Pueden ir
chicos?" y "¿hay estacionamiento?" están en la captura y no van: una
respuesta inventada ahí hace venir a una familia entera a una fiesta
donde no la esperan. Son cinco y las cinco salen de lo que mandaron
—la hora, el lugar, el dress code, "durante marzo de 2027" y el
alias—. Entran solas agregando un renglón el día que manden más.

#### Sin sobre, con las fotos, con la canción sonando y con SU paleta

Cuatro pedidos del dueño el 01/11/2026, con las fotos y el audio.

**1 · "No quiero que tenga sobre. Que arranque directo en la portada.
Va a quedar más prolijo."** Se fue entero: la capa, su CSS y su JS, y
la cascada de la portada —que esperaba a que el sobre se abriera—
arranca ahora al cargar, en el cuadro SIGUIENTE y no en éste (puesta
en el mismo, el navegador junta los dos estados y no hay transición
que ver, sin un solo error que lo diga).
De paso se fue sola la falla de abajo: **acá ya no hay capa fija que
pueda tapar nada si el script no corre.**

**2 · Las cinco fotos.** La del jardín al atardecer es la portada —la
que eligieron ellos— y las otras cuatro son el mosaico. **Las cinco
van en BLANCO Y NEGRO**, con el filtro en el CSS y no quemado en el
archivo: el original queda entero. La primera versión las puso a
color, razonando que la paleta que mandaron es cálida y natural; el
dueño bajó las dos cosas, primero la portada (*"es muy apagada"*) y
después el mosaico (*"así tienen que ir las otras fotos"*, con la
referencia al lado). Tenía razón las dos veces y el motivo es el
mismo: **una foto a color mete SU paleta**, y cuatro fotos distintas
meten cuatro —el verde del pasto, el azul de un traje, el beige del
salón—, así que el bloque se lee como un collage y no como una pieza.
En blanco y negro las cinco son lo mismo, luz y sombra, y lo que
queda de color es la paleta de ellos: el champagne del filete, el oro
de los rótulos, la salvia de las bandas.
**Y el visor va en blanco y negro también**: tocar una miniatura
monocroma y que se abra a color se lee como un error de carga.

**Los recortes son la mitad del trabajo.** La de la portada se recortó
a 1,1:1 alrededor de las caras: entera es vertical de cuerpo entero y
en la banda de la portada se habría visto una tira de torsos. Y **la
ancha del mosaico pasó de 2,1:1 a 1,55:1**, porque las cuatro son
selfies verticales y en una banda tan angosta no entra una cara
entera: *el ancho de la ranura se elige por lo que hay que mostrar, no
al revés*.

**3 · La canción SUENA.** Más arriba está escrito que acá no sonaba
porque *"el archivo no es nuestro"*; el dueño pidió lo contrario, igual
que en `ambar15`, y es la misma excepción: se le dijo y la sostuvo. La
mitad técnica no se afloja —ningún reproductor de un tercero: la CSP
no lo deja y además sería un tercero corriendo código en la pantalla
del invitado—. El audio sale del video que mandó, normalizado, en AAC
y en Opus: el navegador baja UNO.

**`preload="metadata"`, y no es un detalle**: son 2,3 MB que no se
bajan hasta que alguien toca el corazón. Y el reproductor **trae
escrito cuánto dura**, porque un Ogg todavía sin bajar entero devuelve
`Infinity` de duración y ahí la cuenta del avance da 0 para siempre —
la rayita se queda clavada a la izquierda toda la canción, sin un solo
error que lo diga.
**Y el reproductor es UNO**: la tarjeta de "nuestra canción" perdió su
botón y dice dónde suena. Dos botones para escuchar la misma canción no
son dos entradas, son dos cosas haciendo lo mismo.

**4 · "Necesito que juegues con estos colores. Los bordes, las letras,
todo. No improvises."** Ninguna raya de la invitación es un gris
inventado: hay **una variable de borde por cada fondo**
(`--borde-papel`, `--borde-tinta`, `--borde-verde`), sacadas del
dorado, del champagne y de la salvia que mandaron ellos, y las usan el
hilo que cose las secciones, el filete de la banda de la portada, el
contorno de cada foto del mosaico, las dos tarjetas, las preguntas, el
marco del calendario, la barra del horario, las fichas de la cuenta
regresiva, la caja del alias y los botones.
**El hilo dejó de ir en `currentColor`**, que ahí era el color del
texto, o sea un gris: va en el dorado sobre el papel, en el champagne
sobre la tinta y en la salvia honda sobre el verde.

#### El cierre es la foto del mar, con "te esperamos" encima

*"Esta foto quiero que sea como la primera pero que diga te esperamos
y la fecha con las iniciales de ellos. Que sea en color champagne con
ese código el borde en gris"*, con la referencia al lado: una foto a
sangre y el saludo escrito encima, abajo.

**Sale del mosaico.** Era la ancha del cierre del mosaico; puesta
además acá sería la misma foto dos veces. Con tres el mosaico no tiene
agujero igual —la alta se come dos filas y las dos cuadradas las
llenan—, que es justo lo que la regla del "ancha" estaba cuidando.

**Se RECORTÓ de nuevo del original**, y es la mitad del trabajo: la
que estaba en el repo ya venía recortada a 1,55:1 para la ranura
ancha, así que el saludo aterrizaba **sobre las dos caras**. El
recorte nuevo deja las caras arriba y los hombros abajo, que es donde
cae el texto. *El encuadre se arregla en el archivo, no en el CSS.*

**El velo se midió CON EL PÍXEL, no a ojo.** El texto va en champagne
—un color claro— y debajo hay un cielo, el pasto y la piel de los dos.
Con el primer velo, en un monitor ancho *"Te esperamos"* caía sobre un
gris de 126 y daba **2,38:1**, o sea que no estaba; en un teléfono el
MISMO velo daba 4,7. La foto escala distinto en cada pantalla y la
raya del degradé no — la misma lección del velo de `almi15`. Con el
velo repartido: **4,45 a 9,48:1** en los cuatro aparatos.

**Y esto es un PUNTO CIEGO del medidor compartido**, igual que la
portada de `mia15`: `.cierre-foto` tiene un `background-color` opaco,
así que el medidor informa champagne sobre casi negro y da un número
perfecto mientras el renglón puede estar cayendo sobre el cielo. Por
eso se midió a mano con `pruebas/png.js`.

**El borde gris de la letra lo pidió el dueño**, y de paso protege el
caso en que el velo no alcance. Va adentro de `@supports (paint-order:
stroke)` y con `paint-order:stroke fill`: sin eso el trazo se centra
sobre el contorno, se mete para adentro y empasta la manuscrita.
**Y el grosor va en `em`, que es el del ELEMENTO**: `.055em` en un
rótulo de 9,5px es un hilo de medio píxel, o sea una declaración que
no hace nada. Lo agarró la prueba, no el ojo — es exactamente la misma
falla ya escrita para el "15" de `mia15`.

**Las iniciales salen de `CONFIG.quien`**, como el monograma de la
portada: escritas a mano, la próxima invitación que se copie de ésta
las trae de otra pareja — que es lo que ya pasó en `ambar15` con el
nombre de Almi.

**Y el renglón "Te esperamos el 22 de mayo" se va cuando la foto
carga**: la foto lo dice, y dicho dos veces una encima de la otra es
un error de maqueta. Si el archivo falta, el cierre queda como estaba
y no un cuadrado roto.

#### El dress code, con los círculos encimados

*"Esto para el dress code con la paleta que te pidieron"*, con la
referencia: el título, una línea corta, el nombre del dress code en
**capitular espaciada** y abajo tres discos **encimados**.

**En fila y separados, cinco bolitas son una leyenda de colores;
encimados son una paleta.** Es el mismo gesto que una carta de
pinturas, y cuesta un margen negativo.

**Cada disco lleva un aro del color de la ficha, y no es un adorno**:
encimados sin aro, dos colores vecinos parecidos —acá el champagne y
el dorado— se funden en una sola mancha y la paleta deja de tener
cinco colores. El marfil lleva además su filete gris, porque un
círculo del color del fondo no es un círculo.

**El rótulo va ARRIBA de los círculos**, que es donde la referencia
pone la línea que los explica: una fila de bolitas sin rótulo es un
adorno, y esto es un DATO — la misma lección ya escrita para
`ambar15`. Y dice *"los colores de la boda"* y no *"vestite así"*:
ellos mandaron su paleta, nunca dijeron cómo tiene que ir vestido el
invitado, y eso no se inventa.

**El nombre del dress code va en capitular espaciada por `id` y no en
el `h3`**: el otro `h3` de la fila es el nombre de la canción, que en
mayúsculas sería otra cosa.

**Y de paso se encontró un verde que había quedado suelto.** El botón
"Cómo llegar" seguía con `--borde-verde` y `--salvia-honda`, que es
la piel que esta invitación ya no tiene: se dibujaba perfecto, no
tiraba ningún error, y era el único verde de toda la pieza. Es la de
siempre: **una variable que sobrevive a la skin que la creó no
avisa**.

#### "Que sea así en general": dos colores y el borde rasgado

Cuarta corrección seguida del dueño sobre la misma invitación, con
una referencia de bandas **blancas y negras que se alternan con el
borde RASGADO**. Las tres anteriores —la portada, el mosaico, el
calendario— eran la misma observación en pedazos; ésta la dice
entera.

**Las pieles pasaron de tres a DOS.** Eran marfil, salvia y
antracita. La salvia era "el respiro", y en una pieza de dos colores
es exactamente lo que no deja que haya dos colores: tres grises
cálidos apilados no hacen contraste, hacen barro — la misma lección
que ya había costado la portada. Y el antracita `#333638` subió al
casi negro de la portada (`--tinta-port`), así que **la pieza entera
tiene un solo negro y un solo blanco**.

**Lo que queda de la paleta que ellos mandaron son los ACENTOS**: el
oro de los rótulos sobre el papel, el champagne sobre la tinta, los
hilos, los filetes de las fotos — y la salvia, que sigue entera en
los círculos del dress code, donde es un DATO y no una decoración.
Esto no contradice *"jugá con estos colores, no improvises"*: los
cinco siguen estando, lo que cambió es cuál manda.

**El borde rasgado se pone SOLO, y SOLO donde el color cambia.**
Escrito a mano en el HTML, el día que una sección se esconda —la
galería si no hay fotos, las preguntas si no hay ninguna— quedarían
dos bandas del mismo color pegadas con un rasgado en el medio. Y por
eso `rasgar()` **es una función y no un IIFE**: la galería aparece
recién cuando las fotos cargaron, o sea después de la primera
pasada, así que hay que volver a rasgar o queda una juntura recta de
los dos lados.

**Y la sección que se rasga PIERDE SU HILO.** El hilo con su rombo y
el rasgado son dos separadores; puestos juntos se leen como un error
de maqueta. Es la misma lección ya escrita para el encaje de
`ambar15`, que *reemplaza* al corte en curva y no se suma. Además el
rasgado se dibuja encima y le comería la mitad.

**Un rasgado no es una sierra**, y eso costó una vuelta. La primera
versión ponía cada punto al azar entre 9 y 39: picos independientes,
y lo que se ve es papel picado —la misma falla que ya está anotada
para la sierra de `ambar15`—. Un papel rasgado es un camino que
**camina**: cada punto cerca del anterior, con alguna muesca más
honda de vez en cuando. Y tiene que **volver al medio**: un paseo
aleatorio puro se pega al tope y deja una recta de doscientos
píxeles, que es justo lo que un rasgado no tiene. Los caminos salen
de una **semilla fija** —la fecha de la boda—, como en `mia15`: con
`Math.random()` dos capturas de la misma invitación saldrían
distintas.

#### El calendario vuelve a su arco, y el corazón se rellena

*"Así el calendario pero en la paleta que pidieron"*, con una
referencia: un **arco** oscuro, el mes y el año arriba, la grilla en
serif clara y el día marcado con un **corazón relleno** con el número
adentro. Los colores siguen siendo los de ellos —antracita, champagne
y marfil—; lo que cambia es la forma.

**El arco no es un `border-radius` a ojo.** El radio horizontal es el
**50%** —o sea la mitad del ancho, siempre— y el vertical un **34%
del alto**, que es lo que lo deja apenas achatado como en la captura.
Escrito en píxeles se vuelve un semicírculo en una tarjeta angosta y
una cúpula en una ancha. Y el relleno de arriba tiene que ser grande:
el mes vive ADENTRO del arco, debajo de su corona, y con el relleno
de antes quedaba montado sobre la curva.

**Y el corazón relleno trae de vuelta la trampa que el de contorno
esquivaba.** El medidor de contraste sube por el árbol hasta el
primer fondo OPACO, y **un corazón es una forma, no un fondo**: así
que informaría el número contra el antracita del arco —**1,00:1**, o
sea que el número no está— y tendría razón según lo que mide,
mientras el invitado lo ve en marfil sobre marfil. Dos párrafos más
arriba, en la vuelta anterior, eso se había resuelto **sacando el
relleno**; ahora el relleno es el pedido, así que se resuelve al
revés: el número vive adentro de un `<b>` que lleva **el marfil del
corazón de fondo de verdad**, metido entero en la panza del corazón,
donde no se nota porque es el mismo color. No es esconderle un color
al medidor —que es la trampa que este archivo ya tiene escrita tres
veces—: es **decirle la verdad**, porque ése ES el color sobre el que
el número está.
Verificado sacándole ese fondo al `<b>`: da **4 fallas**, una por
aparato, con el "22" a 1,00:1.

**Y el corazón va corrido ABAJO a propósito.** Su panza —la parte
ancha— queda entonces a la altura del número. Centrado, el número
aterriza justo en la muesca de arriba y el `<b>` asoma por los dos
costados: deja de leerse como un corazón y pasa a leerse como una
insignia. Se ve mirando, no leyendo el código.

#### "Es muy apagada. Cero diseño": la portada en blanco y negro

El dueño la miró publicada y la bajó con tres palabras. Tenía razón y
el motivo se puede decir en una línea: **la portada eran tres grises
cálidos apilados** —el papel crema arriba, la foto a color de un
atardecer en el medio, la banda en antracita abajo—, y tres cosas
cálidas y medias una encima de otra no hacen contraste, hacen barro.
En una captura de escritorio pasa por sobria; en un teléfono se lee
como una pantalla sin terminar.

Son tres decisiones y ninguna es de gusto:

- **La foto va en BLANCO Y NEGRO**, con el filtro en el CSS y no
  quemado en el archivo — el original queda entero por si algún día se
  la quiere a color. Acá estaba escrito lo contrario (*"van en COLOR…
  el atardecer y las guirnaldas SON el champagne y el dorado de su
  lista"*) y era justamente eso lo que el dueño rechazó: el dorado de
  la foto no suma a la paleta, **se funde con ella**.
- **La portada es oscura de punta a punta.** El papel no entra: el
  reproductor, la foto y la banda caen sobre el mismo casi negro
  (`--tinta-port`, `#101214`), así que la foto y el bloque de texto se
  leen como UNA pieza y no como dos franjas pegadas. El antracita
  `#333638` es un gris cálido y apagaba las dos.
- **El monograma va en el corte DISPLAY de la misma tipografía.**
  `opsz` es el eje de tamaño óptico de la Newsreader: en 72 los finos
  se afinan y los gruesos engordan, que es el contraste de una didona.
  Acá se puede y en el cuerpo del texto no —*lo que se parte en un
  teléfono es una didona a 15px, y esto mide noventa*— y **no cuesta
  una descarga más**, porque es la misma familia que ya está pedida.

Dos cosas que costaron una vuelta cada una:

- **El degradé de abajo de la foto no es un adorno.** Sin él queda una
  juntura recta a lo ancho de la pantalla justo donde la foto termina,
  y ahí se vuelven a leer como dos cosas pegadas. Con la foto fundida
  en el negro, el monograma parece salir de ella.
- **El botón del corazón va AL REVÉS que antes**: círculo claro y
  corazón oscuro. Sobre el casi negro, un círculo de tinta no existe —
  es *si un bloque trae su propio fondo, trae su propia tinta* por el
  lado del fondo que cambió abajo del bloque.

**Y el aire alrededor de la "y" quedó torcido.** El `letter-spacing`
de los nombres deja su espacio DESPUÉS de la última letra de
"FACUNDO", así que un padding simétrico en la "y" da más hueco de un
lado que del otro. Se ve en una captura y no leyendo el código.

Medido: la portada mide **799px en un iPhone de 844**, así que
"Deslizá" —lo único que avisa que hay más abajo— sigue entrando
entero, y la suite informa **122 textos y ninguno abajo de 3:1**.

##### Dos cosas que la suite medía con el selector de OTRA invitación

Las dos daban verde o una falla falsa, y las dos son la misma lección
—*una comprobación escrita para una invitación mide a esa invitación*—:

- **La foto que se tira tenía que ser una de la GALERÍA.** La prueba
  404ea la PRIMERA imagen de `fotos/` que pide el navegador, y acá esa
  es la de la PORTADA: la galería quedaba entera y la cuenta informaba
  *"quedaron 4 de las 3"*. Parecía que la foto caída no se iba, cuando
  lo que no se había caído era una foto de la galería. Ahora saltea la
  portada, que tiene su propio bloque.
- **El reproductor se buscaba por `.repro audio`**, que es la clase de
  `ambar15`. Acá es `.player`, así que la suite informaba *"esta
  invitación no trae canción"* con la canción puesta y las tres
  comprobaciones del bucle y el rebobinado **no se corrían**. Se busca
  el `<audio>`, que es lo único que toda invitación con canción tiene
  sí o sí.

#### Y midiendo eso apareció otra, en CINCO invitaciones a la vez

**Sin JavaScript, el sobre tapaba la invitación entera y no se podía
abrir.** `#sobre` es una capa `position:fixed` que cubre la pantalla y
su botón lo abre el JS: si el script no corre —o revienta en la
primera línea— el invitado se queda mirando un sobre cerrado y un
botón que no hace nada, **para siempre y sin un solo error a la
vista**. Comprobado preguntándole al navegador quién ataja el dedo en
el medio de la pantalla con el JS apagado: en `mia15`, `almi15`,
`ambar15`, `mateoylucas` y `facuymaxi` contestaba el sobre.

Y el comentario del propio archivo decía lo contrario —*"sin JS no
existe: el CSS lo esconde"*—, así que estaba escrito como resuelto. En
`facuymaxi` el JS hasta hacía `sobre.hidden = false`, o sea que la
intención estaba: lo que fallaba es que **`#sobre{display:grid}` le
gana al `hidden` del HTML**, que es exactamente la trampa de abajo.

Se arregla con `html:not(.js) #sobre{display:none}` **más un script de
una línea en el `<head>`** que pone esa clase. Los dos juntos: sin la
clase puesta antes de pintar, la invitación se vería un cuadro y
después aparecería el sobre encima, que es peor que el bug.
`claraybruno` y `juliayfranco` ya estaban bien.

**La lección es la de siempre y por eso vale repetirla**: una trampa
que se arregla en un lugar hay que ir a buscarla a los otros, y un
comentario que dice que algo está resuelto no es una medición. Ésta
apareció midiendo otra cosa.

**Una trampa de CSS que volvió a morder: `hidden` lo pisa cualquier
`display` escrito después.** `.port-foto{display:block}` y
`.btn[hidden]` sin su regla hacían que la foto vacía y el botón de la
galería se dibujaran igual estando ocultos. No tira ningún error: lo
que se ve es una caja negra donde no va nada. No se puede arreglar con
un `[hidden]{display:none!important}` global, porque el sobre depende
justamente de que su `display:grid` le gane al `hidden` del HTML.

#### El countdown en fila, la tira de fotos y los horarios en columnas

Tres pedidos de una vez, con cinco capturas: el countdown ruso
(*"ese quiero que sea el countdown y que sea color marfil con borde
color champagne las letras"*), la tira de fotos de abajo de una
página de wedding planner (*"hacé lo mismo que en la primera foto
con las otras tres"*) y el bloque de columnas de arriba de esa misma
página (*"arriba lo de la ceremonia quiero que lo copies para la
parte donde dice los horarios"*). Y, por fin, **los horarios de
verdad**: 21 h apertura de puertas, 21:30 ceremonia, 22 h comienza
la fiesta, 4 am finaliza el evento. Con eso se fue la píldora de
*"falta: los horarios del resto de la noche"*, que era uno de los
cinco huecos.

**1 · El countdown pasó de fichas a una fila, y el COLOR eligió la
banda.** Cuatro recuadros con su rayita se leen como un tablero; los
cuatro números corridos, en serif grande y con su rótulo chico
abajo, se leen como un reloj. Pero *"marfil con borde champagne"*
sobre el papel marfil es texto que no está: así que **`#invitacion`
pasó a ser de TINTA**. Es la regla de siempre —*si un bloque trae su
propio fondo, trae su propia tinta*— vista al revés: **el color de
letra que se pide es el que elige sobre qué puede caer.** De paso la
portada y la invitación quedaron en un solo bloque oscuro de
apertura, y el papel empieza en "guardá la fecha"; los bordes
rasgados se recalculan solos, porque los pone `rasgar()` y sólo
donde el color cambia (8 antes, 8 ahora).
**El borde va en `em` y el `em` es el del ELEMENTO**: el tamaño del
número vive en el `b`, así que escrito en la fila se resolvía contra
16px y salía un hilo de medio píxel. Es la misma falla ya escrita
para el "15" de `mia15` y para el rótulo del cierre. Y el rótulo de
abajo **no lleva borde**: ya es champagne, y un trazo champagne
alrededor de una letra champagne es una declaración que no hace
nada.

**2 · La tira de fotos va A SANGRE, y eso NO es sacarle el padding a
la sección.** La primera versión le puso los márgenes negativos de
siempre y en un teléfono quedó perfecta; en un monitor la tira medía
**730 de 1280**, encerrada en el medio. El culpable es `.caja`, que
está topada en 640px: adentro de ella, el margen negativo descuenta
el padding de la sección y nada más. La tira pasó a ser **hija
directa de la sección**, con el rótulo arriba en su caja y el botón
abajo en otra.
**Y la ranura es 4:5, no una tira fina, y eso lo deciden las FOTOS.**
Dos de las tres son cuadradas con las dos caras una al lado de la
otra: con una ranura angosta —que es lo lindo de la referencia— una
de las dos caras queda cortada en cada foto. Es la regla que esta
misma invitación ya tenía escrita para la foto ancha del mosaico:
*el ancho de la ranura se elige por lo que hay que mostrar, no al
revés.*
**El alto sale del ancho con `aspect-ratio`, no de un alto escrito**:
un alto fijo cambia la proporción de la ranura en cada pantalla, así
que un recorte que en el teléfono deja las dos caras adentro en un
monitor las corta. Y la cantidad de columnas la pone el JS (`--n`),
porque sólo él sabe cuántas fotos CARGARON: con el número escrito en
el CSS, una foto que falla deja un hueco donde estaba.

**3 · Los horarios son columnas con una raya fina en el medio, y las
rayas son `border-left`.** Un separador puesto a mano entre columna y
columna deja una raya colgando al final de la fila el día que entre
un horario más; con `border-left` se saca en el primero de cada fila
y listo: el impar en un teléfono (dos columnas) y el `4n+1` arriba de
700px (cuatro). Se fue con esto la línea que serpenteaba y su
`pintarHilo`, que medía las cajas de verdad para que los corazones no
quedaran flotando — un trabajo bien hecho que el pedido dejó sin uso.

**Y el icono de la fiesta se leía como una TIJERA.** Eran dos
monigotes bailando: a 36px las dos cabezas son los ojos y las piernas
cruzadas, las hojas. Va una corchea doble, que se reconoce de un
vistazo. *Lo que no se lee a 36 no va* — la misma lección que ya
costó cuatro vueltas con la bolsa de `ambar15`, y que no se descubre
leyendo el código: se descubre mirando la captura.

#### Las manos con los anillos, el corazón descentrado y los huecos

Tres cosas de un reporte: *"probá poner esta imagen en donde está el
cuenta atrás. Fíjate que el corazón del calendario está descentrado.
Borrá lo que dice falta tal información."*

**1 · La foto de las manos va ENMARCADA y no a sangre.** Es una foto
de fondo BLANCO y la sección de la cuenta regresiva es casi negra: a
sangre, ese blanco es un agujero del tamaño de la pantalla y se lee
como un error de carga. Contenida, con su hilo de champagne, se lee
como una copia apoyada sobre una pared oscura — que es lo que es.
**El hilo va por AFUERA y no `inset`**, al revés que las fotos de la
tira: por dentro cae sobre el blanco de la foto y no se ve, o sea una
declaración que no hace nada.
No lleva el `grayscale` del CSS: **ya viene en blanco y negro**, así
que el filtro sería una capa que no cambia nada. Y se recortó a 4:5
alrededor de los anillos: entera son 941x1672 y en la sección se
habría visto una tira de brazo. Pesa 29 KB contra 1,8 MB del PNG.
Como todas las demás, se pone recién cuando el archivo cargó de
verdad: si faltara, la sección queda como estaba.

**2 · El corazón del calendario se ubica por la FORMA, no por la
caja.** Su `viewBox` es `0 0 24 24` y el dibujo vive en x 3,6..20,4 e
y 5,2..21,2: la forma **no está centrada en su propia caja**, le sobra
aire arriba y a los costados. Posicionado contra la caja —que es lo
que parece obvio— el número caía al **28% del alto del corazón**,
pegado a la muesca de arriba, y la punta se metía en la fila de abajo.
Ahora los números salen de esa cuenta: la caja mide 52 para dibujar 36
de ancho y el `-26px` sube el corazón hasta que el número queda al
**42% de la forma**, que es donde se ve centrado — y de paso el
corazón se lee como un corazón y no como un cuadrado con punta.
**La caja va CUADRADA a propósito**: con una rectangular, el `meet`
del SVG mete un recorte más en la cuenta y hay que volver a resolver
todo. Si se cambia el tamaño, se recalcula: a ojo vuelve a quedar
descentrado y no lo dice nadie.

**3 · Se fueron las píldoras de "falta".** `CONFIG.borrador` pasó a
`false` por pedido del dueño. **Lo que NO cambia es que el dato no se
inventa**: el titular de la cuenta, la fecha límite para confirmar y
el contacto del día de la fiesta siguen sin escribirse, y sus
renglones simplemente **no se dibujan** — que es lo que ya hacían
`mia15` y `almi15`. Lo que se pierde es el recordatorio en pantalla,
así que el pendiente vive ahora sólo en este archivo.

##### Y una foto suelta en `fotos/` rompió la prueba del 404

La comprobación que tira una foto y mira que se vaya elegía **la
primera que pidiera el navegador**, salteando la portada a mano. Con
la foto de las manos —que vive en `fotos/` y no es de la galería— la
que se tiraba era ésa: la galería quedaba entera y la prueba informaba
*"quedaron 3 de las 2"*, como si la foto caída no se hubiera ido.
Excluir la portada a mano era la misma curita una foto tarde. Ahora la
prueba lee de `CONFIG` **cuáles son las de la galería** y tira una de
ésas. Contra el código anterior da **1 falla**.

#### La cuenta regresiva pasa al papel, y la foto que se recortaba sola

Dos capturas del dueño, mirándola publicada: *"mejora la foto porque
queda recortado"* y *"la foto de las manos debe ir como en la foto 3.
El contador también"* — la referencia es una cuenta regresiva en serif
oscura sobre papel crema y, debajo, una foto a sangre.

**1 · `#invitacion` pasó de TINTA a PAPEL**, y con eso se cayó solo el
motivo por el que la foto de las manos iba enmarcada. Acá estaba
escrito —y era cierto— que *"una foto de fondo BLANCO a sangre sobre
antracita es un agujero del tamaño de la pantalla"*. Con la sección en
crema, el agujero no existe. **Un argumento puede ser correcto y
caducar el día que cambia lo que había debajo.**
Esto da vuelta la decisión de *"marfil con borde champagne"* de la
vuelta anterior, que había sido del dueño y para la banda oscura.

**El número toma la tinta de SU banda** (`color:inherit`) y el borde de
letra vive sólo sobre la oscura: el champagne alrededor de una cifra ya
champagne no hace nada, y alrededor de una cifra oscura sobre papel la
empasta. Es *si un bloque trae su propio fondo, trae su propia tinta*
vista al revés — no cambió el bloque, cambió el fondo de abajo.

**2 · El blanco de la foto se funde con el papel, y NO se tocó el
archivo.** El fondo de la foto es `#F8F8F8` y el papel es `#F6F1E8`: a
sangre quedaría un rectángulo blanco con su juntura a lo ancho de la
pantalla. Con **`mix-blend-mode:multiply`** sobre el crema, el blanco se
multiplica por el papel y desaparece —queda el papel— mientras los
negros de las manos no se mueven. Es la misma decisión que el
`grayscale` del resto: el filtro va en el CSS y el original queda
entero. El `isolation:isolate` no es un adorno: sin él la mezcla se va
a buscar lo que haya más atrás en la página.

**3 · Un recorte que depende del ALTO de la ventana recorta distinto en
cada aparato, y no lo decide nadie.** Eso era lo de *"queda
recortado"*. La foto del cierre iba `width:100%` con `max-height:74svh`
y `object-fit:cover`: en una pantalla ancha se agrandaba hasta el ancho
entero y después el alto la cortaba. **Medido: en un monitor de 1280 se
veía el 35% de la foto; en un teléfono con la barra del navegador, el
83%** —que es exactamente la captura que mandó—. Se topa el **ancho** y
no el alto: así el alto sale de la proporción de la foto y se ve el
100% en cualquier pantalla. A sangre en un teléfono y como una columna
centrada sobre la banda oscura en un monitor, que es lo que ya hace la
portada entera de `mia15` y se lee editorial.

**Y el velo hubo que volver a medirlo**, porque lo que cae debajo del
texto cambió: antes se medía contra un recorte y ahora contra la foto
entera. Es el punto ciego de siempre —`.cierre-foto` trae su propio
`background-color` opaco, así que el medidor compartido informa
champagne sobre antracita y da un número perfecto y falso—, así que se
mide a mano con `pruebas/png.js`, escondiendo los HIJOS del texto y no
el contenedor, que se llevaría el velo. Da **5,93 a 6,80:1** en los
cuatro aparatos.

**Lo que NO se pudo arreglar: la canción no arranca del principio.**
Pedido del dueño, y el archivo no da. Medido con `ffmpeg`: los
primeros 0,4 s son el fundido de entrada y **del 0,4 en adelante entra
a todo volumen** (−17,6 dB, lo mismo que en el minuto uno), o sea que
empieza en medio de una frase; el final, en cambio, baja solo
(−21,7 dB), así que lo que falta está al principio y no al final. El
audio salió de un video que el dueño mandó y ese video arrancaba con
la canción empezada. **No se baja de ningún lado**: es una grabación
comercial, y vale lo ya escrito. Hace falta que mande el tema desde el
principio; cambiarlo es reemplazar los dos archivos y nada más.

#### La escena de la fecha: foto, arco y foto

*"Proba este diseño con esas fotos"*, con la referencia —una foto a
sangre arriba, un ARCO oscuro montado encima con el calendario adentro
y el día marcado con un corazón, y otra foto a sangre abajo— más la
foto de las manos y una **foto nueva de los dos en el lobby de un
hotel**, que entró como `fotos/juntos.webp` (900x1490, 69 KB, el
original queda entero: el blanco y negro va en el CSS).

**Lo que hace que se lea como UNA pieza es que el arco SE SUPERPONE a
las dos fotos.** Pegadas borde con borde son tres rectángulos
apilados. El arco ya existía; lo que faltaba era la escena.

**La foto de las manos se mudó de `#invitacion` a `#fecha`** y con eso
no cambió de lugar en la pantalla —las dos secciones son de papel y
van una detrás de la otra—, pero ahora el arco puede montársele
encima.

**EL ARCO VA ARRIBA EN EL APILADO, y eso no es un detalle de gusto**:
la foto de las manos se funde con el papel con
`mix-blend-mode:multiply`, así que dibujado DEBAJO el arco sería el
fondo de esa mezcla y las manos se multiplicarían contra el antracita
hasta desaparecer. El `isolation:isolate` de `.manos` mantiene la
mezcla adentro de su caja y el arco la tapa por delante.
Medido con el píxel, de paso: el blanco de la foto multiplicado da
**exactamente** el papel (246,241,232 de los dos lados, ni un píxel más
claro en toda la banda), así que no hay ninguna juntura a lo ancho.

**Cuánto monta se eligió mirando LAS FOTOS, no la referencia.** Arriba
el arco sube 68 a 94px, que es lo que deja al antebrazo tatuado debajo
de la cúpula y a las manos enteras arriba; abajo baja 20 a 30px, que
es lo que el aire que la foto tiene sobre las cabezas aguanta sin que
el pie del arco les tape la cara. **Un encuadre no se mira solo: se
mira con lo que le va a caer encima** — es la misma lección de las dos
caras tapadas de `ambar15`, ahora por el lado del borde y no del
texto.

**El manuscrito pasó a vivir ADENTRO del arco**, como en la
referencia, y su texto viaja en un `data-` de `#calendario`: el JS le
pisa el `innerHTML` entero, así que escrito como hijo en el HTML se
perdería sin que nada avise.

**Y el ancho se topa**, igual que en el cierre: a sangre en un monitor
la foto de los dos mediría 2100 de alto. Topada en 440, en un teléfono
llena el ancho y en un monitor queda como una columna centrada con el
arco —más angosto— encima.

##### El corazón del día se quedó en `scale(0)`, y no avisó

El arco dejó de llevar su propio `.ap` —entra con la escena entera, que
es lo que hace que la composición no aparezca en tres pedazos
escalonados—, y el latido del corazón colgaba de
`#calendario.entro`. Sin ese `.entro`, el corazón se quedó en
`scale(0)` **para siempre**: lo que quedaba era el número del 22
flotando en un rectangulito blanco, perfecto y al revés. Ningún error.
Ahora cuelga de la SECCIÓN (`#fecha.entro`), que nunca está escondida
— es *el que se mira no puede ser el que se esconde* otra vez.

**Y ahora se mide**, genérico y por la CAJA de verdad y no por que el
nodo exista: la marca del día marcado tiene que llegar a 20x20. Se
saltea sola en una invitación cuyo calendario no dibuja marca.
Verificada rompiéndola a propósito: da **1 falla**, *"la marca del día
está dibujada (0x0)"*.

**Y la primera versión de esa comprobación inventaba la falla**:
preguntaba sin haber scrolleado hasta el calendario, y quien destapa es
un `.entro` que pone el observador, que avisa en otra vuelta del reloj.
Sin llegar, la marca da 0x0 esté bien o mal el código. Es la regla ya
escrita para la comprobación de los controles tapados —*preguntaba sin
llegar*— por segunda vez en la misma suite.

#### La tira de fotos, sobre papel y con su filete dorado

*"La primera foto quiero que lleve el estilo de la segunda. Igual los
marcos pero con el borde dorado del código que te pasé (#b79a68) y el
fondo sea color marfil (#f6f1e8)"* — con la captura de la tira
publicada y una referencia donde las tres fotos van sobre una banda de
papel claro.

Los dos colores que pidió **son los que ya tiene la pieza**:
`--oro` es `#B79A68` y `--marfil` es `#F6F1E8`, o sea la paleta que
mandaron los novios. No entra ningún color nuevo.

**Lo que la hace leer como tres copias apoyadas —y no como tres
recortes pegados— son las dos cosas juntas**: el marfil que las separa
y las rodea, y el filete. Con el marfil solo son tres fotos flotando;
con el filete solo, sobre el antracita, el dorado casi no se despega
del fondo. Por eso el pedido trae las dos.

**La banda va A SANGRE y el papel nace y muere con ella.** No es un
cambio de SECCIÓN, así que ahí no entra ningún borde rasgado: ésos los
pone `rasgar()` sólo donde cambia el color de una sección, y los dos de
`#galeria` siguen donde estaban.

**El `padding` del bloque y el `gap` son lo mismo** —el margen del
passepartout—, escritos aparte porque el de los costados descuenta el
medio píxel del filete: si uno cambia, se miran los dos.

**Y el filete no lo juzga el medidor de contraste**, porque es un
borde y no texto. El marfil de la banda sí entra en la cuenta de todo
lo que cae encima, y ahí no cae ningún texto: lo único que hay adentro
son las tres fotos.

#### La canción arranca sola apenas se entra

*"Que la música suene apenas entras a la invitación."* Acá no hay
sobre que abrir —se lo sacó el dueño el 01/11— así que no existe el
gesto con el que la canción arranca en `ambar15` y en `magali15`.

**Y el navegador la va a bloquear, que es lo normal en un teléfono**:
ni Safari ni Chrome dejan sonar nada antes de que la persona toque
algo. Medido acá: el Chromium de las pruebas la bloquea igual.
Así que son **dos caminos y hacen falta los dos**: se intenta al
cargar, y si rebota suena con el **primer gesto** que haga la persona,
en cualquier parte de la pantalla. Desde afuera eso es "apenas
entrás", porque nadie mira una invitación sin tocarla.

**Un scroll no alcanza**, y por eso no está en la lista de gestos: el
navegador no lo cuenta como activación para esto. Los que sí valen son
el toque y la tecla (`pointerdown`, `touchend`, `click`, `keydown`).

**Y el primer toque en el propio reproductor no cuenta.** El oyente va
en CAPTURA, o sea que corre antes que el botón: sin cuidarlo, el toque
arranca la canción y después el `click` del play la encuentra sonando
y la pausa — el botón se vería muerto justo en el único toque que de
verdad lo usa. Se desarma y se deja pasar.

**`preload="metadata"` se queda.** Bloqueada la primera vez, los 2,3 MB
no se bajan hasta el gesto; y cuando suena, el audio arranca mientras
se sigue bajando.

**Lo que mide la suite es lo que hace la PÁGINA, no lo que decide el
navegador**: comprobar "suena" mediría la política de Chromium. Se le
pisa `play()` y se cuenta. Tres cosas: que al cargar se INTENTE sin
que nadie toque nada; que, bloqueada, suene con el primer toque en
cualquier parte; y que si ese primer toque cae en el play el botón no
quede muerto. Se saltea sola en una invitación sin canción, y en una
**con sobre** —ahí el gesto es abrirlo y eso ya está medido—.
Verificada rompiéndola a propósito: sacar el arranque da **2 fallas**
y sacar la exención del reproductor da **1**.

#### Los detalles, en UNA cápsula

*"Que esas dos tarjetas estén dentro del modelo ese de la primera
foto"*, con la referencia: una sola pieza de papel con los extremos
redondeados y los dos bloques adentro. Dos recuadros sueltos sobre la
banda oscura se leen como dos avisos; una cápsula se lee como una
tarjeta. Es el mismo armado que ya tiene `magali15`.

**El radio horizontal va en porcentaje y el vertical en una medida que
sigue al ANCHO, no al alto.** La mitad está escrita en `magali15`: los
dos en píxeles dan un semicírculo en una pantalla angosta y una cúpula
en una ancha. La otra mitad es nueva y aparece acá porque **adentro
hay dos bloques de texto**: un vertical en porcentaje se mide contra
el ALTO, así que una línea más y la cúpula crece. La altura de la
cúpula es una decisión de forma y tiene que depender de lo ancha que
sea la tarjeta, no de cuánto texto le toque.

**Y la cúpula se eligió MIRANDO.** La primera versión tenía el radio
vertical en la mitad y lo que se veía no era una cápsula: era una
lápida con las esquinas apenas redondeadas. En la referencia el alto
de la cúpula es como tres cuartos de la mitad del ancho; con la mitad
de eso el gesto no existe. No se ve leyendo el código.

**El relleno de arriba y abajo tiene que ser más alto que una tarjeta
común**: con el de antes, el primer icono aterriza sobre la curva.

**Va en una sola columna siempre**, y por eso además se topa el ancho
en 460: en dos columnas la cápsula queda ancha y baja y los extremos
redondeados se leen como un botón gigante. La referencia es una
cápsula vertical.

**Lo que separa a los dos bloques es el aire**, como en la referencia:
una raya en el medio volvería a partir en dos lo que la cápsula vino a
juntar.

**Y el `.ap` pasó a la cápsula.** Lo tenían las dos fichas, con sus
retardos escalonados: una pieza continua que aparece en dos pedazos
se lee como un error de carga. Es la misma decisión que la escena de
la fecha.

#### Más verde, que es uno de los cinco que mandaron

*"Necesito que agregues más del verde solicitado porque todo es
mayoría blanco y grafito."* Tenía razón, y la cuenta lo dice: de las
trece bandas de la invitación, diez eran crema y tres grafito. El
verde salvia era uno de los cinco colores que mandaron los novios y
había quedado sólo en los círculos del dress code.

**La banda verde NO es una piel nueva: es la oscura con otro fondo.**
El camino obvio —una tercera piel con sus propias reglas de tinta— es
el que ya falló cuando la salvia era una de tres: son quince reglas
`.tinta X` que hay que repetir, y a la que se escape le queda el texto
invisible. Acá el fondo viaja en una variable (`--banda`) y `.verde`
sólo la cambia, así que **toda** la tinta de la banda oscura —el
rótulo champagne, el cuerpo, los filetes, los botones— sigue valiendo
sin tocar una línea.

**Y la banda es la salvia HONDA, no la clara.** Calculado antes de
escribir una línea de CSS: sobre `--salvia` (#A3AD95) el champagne da
**1,4:1** y el oro **1,9:1**, o sea que el rótulo de cada sección no
estaría. `--verde-banda` (#46513C) es el mismo tinte bajado de
luminosidad: marfil 7,6:1, champagne 5,0:1, oro 3,2:1. La salvia clara
se queda donde es un DATO —los círculos del dress code— y la banda usa
la honda.

**Dónde va, y es una decisión de ritmo.** Tres bandas —la galería, los
detalles y el contacto— **y el ARCO del calendario**, que es la pieza
más grande de la mitad de arriba y donde la invitación era toda crema
de punta a punta. El arco costó una línea porque su tinta ya era la de
la banda oscura. Y no van dos verdes pegados: `#timing` también era
candidato y está justo antes de la galería, así que los dos juntos
serían un solo bloque verde en vez de un ritmo.

**El rasgado tuvo que aprender a contar hasta tres.** `rasgar()`
preguntaba "¿es papel?" y pintaba el borde en antracita o en marfil:
con el verde puesto, una banda verde contra una de papel se rasgaba en
**antracita**, o sea una raya negra entre dos colores que no son el
negro. Ahora se pregunta por el COLOR, no por la piel.

#### Las flechas del visor no respondían, y se dibujaban perfectas

*"No está bien puestas las flechas para pasar las fotos."* Medido con
`elementFromPoint`, que es lo único que no miente: en un teléfono,
**quien atajaba el dedo en el centro de las dos flechas era la IMG**.
O sea que no se podía pasar de foto, con los dos botones dibujados y
sin un solo error en la consola.

**El culpable es el `filter` de la foto.** Un elemento con filtro se
pinta **en la capa de los posicionados** aunque no esté posicionado; la
foto lleva `grayscale(...)` y viene DESPUÉS en el HTML, así que le
ganaba a las flechas, que son `absolute` sin `z-index`. Un `z-index:2`
lo arregla. **En un monitor no pasa** —ahí la foto no llega al borde y
las flechas quedan en el negro de los costados—, y por eso nadie lo
vio: es la regla de siempre, lo que se mide angosto se rompe angosto.

**Y el disco de la flecha pasó de claro a oscuro.** Puesta por encima
de la foto, una flecha marfil adentro de un disco al 10% de marfil
desaparece sobre cualquier zona clara de la imagen.

#### Y en un teléfono lo que se hace es DESLIZAR

Las flechas quedan en los dos bordes de la pantalla y acertarles con
el pulgar es un trámite. **Dos cosas se comían el deslizamiento y
ninguna tira un error**, las dos medidas —llega el `pointerdown` y el
`pointerup` no llega NUNCA—:

- **Un `<img>` es arrastrable de fábrica.** El dedo que empieza encima
  de la foto inicia un arrastre nativo y el navegador se queda con el
  gesto. Pasa igual en un escritorio con el mouse. Se apaga con
  `-webkit-user-drag:none` y el `draggable="false"`.
- **El `touch-action` del contenedor.** Sin `pan-y`, el navegador toma
  el gesto horizontal por un paneo y en vez del `pointerup` manda un
  `pointercancel`. Es la misma trampa que ya costó una vuelta en el
  carrusel del sitio, **del otro lado**: allá había que CANCELAR el
  toque y acá hay que quedarse con él.

**Y el deslizamiento cancela el click que viene después**: sin eso, un
dedo que arranca sobre la foto y termina sobre el fondo dispara el
`click` del fondo y el visor se cierra justo cuando la persona quiso
pasar de foto.

**Lo mide `pruebas/invitacion_mirar.js`**, y hubo que ABRIR el visor
para medirlo: cerrado, sus flechas no las ve ni el barrido de los 44px
ni el de los controles tapados. Con cada foto abierta se pregunta
quién ataja el dedo, y después se arrastra y se exige que la foto
CAMBIE —no que exista un oyente—. Se saltea sola en una invitación sin
visor. Verificada rompiendo las dos cosas a propósito: sacar el
`z-index` da **1 falla** (*".ant lo tapa IMG"*) y dejar la foto
arrastrable da **1** (*"deslizando no pasa nada"*).

### `magali15/`: la cuarta de un cliente — Magali

13 de febrero de 2027 · Salón Valmar · de 21 a 5 h. Quince años.
Alias `magali.loor`, dress code **Elegante sport** —*"el outfit con el
que te sientas más cómodo para bailar toda la noche"*— y dos colores
que mandó escritos: **#7B5354 y #3D2E2B**.

**La portada es el armado de SU PROPIA TARJETA.** El dueño mandó la
captura de la invitación de Canva que ella ya tenía: "MIS XV" en
capitular espaciada y **"Magali" en una manuscrita grande cruzándolo
por encima**. Eso es la portada, y el cruce es lo que la hace — sin él
son dos renglones apilados. El margen negativo que lo produce va en
`em` y no en píxeles: en `em` se mueve con la letra, así que el cruce
es el mismo en un iPhone SE y en un monitor. Y el `em` es el **del
elemento**: escrito en el padre se resolvería contra los 16px del body
y el cruce no existiría, que es la misma trampa del borde de letra de
`mia15`.

**Y "una planta entre secciones"**, con esas palabras. El lugar es la
cumbre de cada corte en curva, que es exactamente donde iba la
filigrana de rombos de `almi15`: la curva ya dice que empezó otra cosa
y la planta es lo que la remata.

#### De las cinco tipografías que pidió, TRES no existen

Pidió *"Gilda display / Parfumerie script pro / Frasa display / Bebas
neue / Bright"*. Comprobado contra `fonts.googleapis.com`: **Gilda
Display y Bebas Neue contestan 200; Parfumerie Script Pro, Frasa,
Frasa Display y Bright contestan 400.** Son de Canva o comerciales y
no se pueden servir desde acá — y meterlas en el `<link>` igual no
tira ningún error: el navegador cae a la letra de respaldo del sistema
y la pieza sale con otra tipografía sin que nadie se entere.

Así que van las dos que existen y **la manuscrita se eligió MIRANDO**,
montando la misma portada con seis candidatas (`pruebas/letras.js`).
Quedó **Mrs Saint Delafield**, que es la que reproduce el cruce de
swashes de la referencia. Es la misma forma de trabajar que ya está
escrita para la tipografía de `mia15`, para el monograma y para la
bolsa de `ambar15`: *mostrar, no describir*. "Bright" —que es un sans
de texto— se reemplaza por Hanken Grotesk, que es la del resto del
proyecto.

**Gilda Display viene en UN solo peso (400) y SIN bastardilla.** Los
cinco `font-weight:500` que heredaba la pieza y los tres
`font-style:italic` eran, los ocho, pedirle al navegador que invente
una negrita o una oblicua — y eso no avisa. Los pesos bajaron a 400 y
**lo que iba en cursiva pasó a la manuscrita**, que además es el gesto
de la referencia: capitular más letra escrita a mano. El arreglo y el
diseño van para el mismo lado.
Y los rótulos chicos en versalitas van en **Bebas Neue**, que es la
otra que pidió y la única de las cinco que sirve para eso: no tiene
minúsculas y acá está todo en mayúsculas igual. Sube un punto de
tamaño porque es condensada, y va en 400 por lo mismo de arriba.

#### Los dos colores que mandó, uno sobre el otro, dan 1,99:1

O sea que **el texto no está**. Calculado, no opinado. Por eso la
paleta tuvo que CRECER, exactamente como ya había pasado en
`facuymaxi`:

- **#3D2E2B** es la banda oscura y la tinta sobre el papel (10,8:1).
- **#7B5354** es el acento **sobre el papel** (5,47:1).
- **#C9A3A4**, un malva claro, es el acento **sobre la banda oscura**
  (5,70:1). El de ella ahí daría 1,99; el claro sobre el papel daría
  1,97 — la misma trampa dada vuelta.
- **#F2E9E3** es el papel y **#6B5856** el gris de los párrafos
  (5,56:1).

Es la regla de siempre: *si un bloque trae su propio fondo, trae su
propia tinta*. La suite mide 32 textos y el más flojo da **5,47:1**.

#### El dibujo del salón reemplaza al medallón

Lo mandó con la referencia: el lugar se anuncia con el dibujo del
salón en línea, no con un icono genérico. Así que el dibujo **ocupa el
lugar del medallón** de "dónde nos vemos" — donde el bloque trae su
propio emblema, un medallón arriba son dos emblemas apilados, que es
la misma decisión ya tomada en `ambar15` con el pase VIP.

**Va con el fondo blanco SACADO y las líneas teñidas** en el malva de
la clienta: puesto tal cual, un rectángulo blanco en el medio del
papel crema se ve a la legua. Pesa 74 KB. Y se pone recién cuando el
archivo CARGÓ de verdad, y recién entonces se saca el medallón: si
faltara queda el pin dibujado, que se sostiene solo, y nunca un
cuadrado roto arriba del título.

#### La planta se eligió mirando, y tiene dos reglas

Se montaron **ocho armados** al tamaño al que se ve de verdad (132px)
sobre el papel y sobre el marrón. Ganó la rama doble con hojas
alternadas y un brote en el medio. Las dos cosas que la hacían fallar
no se ven leyendo el código:

- **Una hoja SALE del tallo, no lo cruza.** La elipse va corrida casi
  un radio entero a lo largo de su eje; centrada en el tallo lo
  atraviesa y lo que se ve no es una hoja, es un lazo. La primera
  versión eran nueve lazos.
- **Y las hojas no se tocan entre ellas.** Amontonadas, el conjunto se
  lee como una greca y no como una planta: las de afuera van más
  chicas y más separadas.

#### Una capa de foto VACÍA es un velo opaco sobre la portada

Lo más caro de esta pieza, y no tiraba ningún error. `.port-foto` es
un `position:absolute` con fondo **opaco** que existe siempre, haya
foto o no. Y una capa posicionada pinta por encima de todo lo que
**no** está posicionado: lo que lleva `.ap` se salva —su `transform`
le arma su propio contexto— y lo que no, desaparece.

Acá desaparecieron dos cosas. El **swash de abajo del nombre**, que se
dibujaba perfecto —con su color, su geometría y su caja en el lugar
justo, comprobado con `getBoundingClientRect`— y no se veía; y el
**degradé de la portada**, que quedaba tapado por un marrón plano.
Media hora buscando por qué un trazo que el DOM declara dibujado no
aparece en la captura. Ahora, sin foto, esa capa **se saca**.

Es la caja de 0x0 otra vez, al revés: la caja estaba, lo que faltaba
era que se PINTARA. Y vale para cualquier invitación con una capa de
foto condicional.

#### Y un color de la piel vieja sobrevivió URL-encodeado

El barrido de colores pedía todos los `#RRGGBB` del archivo y exigía
que estuvieran en la paleta nueva — y daba limpio. Pero la flecha de
los `<select>` es un SVG en un `data:` URI, donde el `#` va escrito
`%23`: ahí quedó el **dorado** de la pieza anterior, el único amarillo
de toda la tarjeta, en la pantalla donde el invitado confirma. Se ve
en una captura y no se ve en un `grep`. Un barrido de colores tiene
que pedir las dos formas.

#### Lo que NO se inventó

- **La dirección del salón.** La mandó el dueño el 05/11/2026 —**Salón
  Valmar, Campo Timbó**— y recién ahí se escribió. Hasta ese día el
  renglón de la calle no se dibujaba: mandar a los invitados a una
  calle adivinada no se arregla la noche de la fiesta, y el link corto
  de Google que había desde acá no se puede resolver porque el proxy
  lo rechaza.
- **El titular de la cuenta** del alias `magali.loor`: sin él ese
  renglón no existe. Y el alias se escribe **tal cual lo mandó**, sin
  "arreglarle" nada: en `mia15` el punto del final resultó ser parte
  del alias.
- **El valor de la tarjeta ($50.000) sale de SU PROPIA tarjeta de
  Canva**, no del mensaje del dueño; queda anotado para que se sepa de
  dónde salió y se pueda sacar con una palabra. **La fecha para
  confirmar la mandó el dueño** el 05/11/2026: 10 de enero de 2027.
- **La primera línea de "¿Venís?" es de ella**, también de su Canva:
  *"Tu compañía hace que este día sea aún más especial."* Es su voz y
  no la nuestra.

#### "Forzá las fuentes": dos son de ella y tres no existen para web

Segunda vuelta del dueño: *"quiero que fuerces lo de utilizar esas
fuentes, son requisitos de la cumpleañera"*. Se forzó todo lo que se
puede forzar, y lo que no se puede queda escrito con su precio:

- **Gilda Display y Bebas Neue son de ella y están puestas.** Esas dos
  existen y son gratis.
- **Parfumerie Script Pro es PAGA.** La vende Typesenses en MyFonts y
  Fontspring, y la licencia web se compra aparte. Publicarla sin
  licencia es el mismo problema que publicar el logo de otro: es un
  problema nuestro, no de la clienta.
- **Frasa Display y Bright no existen como fuente web**: son de Canva,
  cuya licencia cubre usarlas adentro de Canva y no incrustarlas en un
  sitio. El papel de Frasa Display —una serif de display— lo hace
  Gilda Display, que también pidió ella; el de Bright —un sans de
  texto— lo hace Hanken Grotesk.

**La manuscrita se volvió a elegir MIRANDO**, ahora contra doce
candidatas y buscando lo que tiene Parfumerie: contraste fuerte,
formas redondas y swashes en las capitulares. Quedó **Great Vibes**,
que es más gruesa y más redonda que la primera elección (Mrs Saint
Delafield, que al lado de su tarjeta se ve un pelo fina). Al cambiarla
hubo que bajar un escalón los tres lugares donde vive: Great Vibes
llena mucho más la caja, así que el mismo tamaño en píxeles se ve
bastante más grande.

**Y el día que se compre la licencia web de Parfumerie Script Pro esto
es UNA línea**: el archivo va en la carpeta, su `@font-face` al lado
del `:root` y `--mano` pasa a nombrarla. Para eso las familias viven
en variables y no escritas quince veces en el CSS. Lo que NO se hace
es bajar el archivo de cualquier lado y subirlo igual.

#### La canción suena

El dueño mandó el tema —*Loving Life Again*, de Ella Langley— con
*"ese es el tema que debe sonar, poné un reproductor"*. Es el mismo
reproductor de `ambar15` y `facuymaxi`: **tres mandos y los tres hacen
algo** —con una sola canción, los de los costados vuelven al
principio—, la línea con la flor es el AVANCE y va declarada
decoración, **suena una sola vez** y al terminar **se rebobina** (
parada en el final, el primer toque del play no sonaría, y eso no tira
ningún error: sólo un botón que parece roto).

**Arranca con el toque que abre el sobre.** Safari no deja sonar nada
sin un gesto de la persona, y ese gesto ya existe: no hace falta
inventarle otro botón ni dejar la invitación muda esperando que
alguien descubra el play.

Van **dos archivos y UNA sola descarga**: AAC para el iPhone —que es
donde están los invitados— y Opus para el que no puede con ese
formato. Con `preload="metadata"` no se baja nada hasta que alguien
toca el play. Y el largo del tema va **escrito en el CONFIG**: un Ogg
todavía sin bajar entero devuelve `Infinity` de duración y ahí la
rayita del avance se queda clavada a la izquierda toda la canción.

**El archivo NO es nuestro**, y vale la misma excepción ya escrita
para `ambar15` y `facuymaxi`: es una grabación comercial publicada en
una dirección nuestra. Lo decidió el dueño y se le dijo. Lo que no se
afloja es la mitad técnica: ningún reproductor de un tercero, que la
CSP no lo deja y además sería un tercero corriendo código en la
pantalla del invitado.

#### Los detalles, en UNA cápsula

Pedido con una captura: el dress code, el valor de la tarjeta y el
regalo dejan de ser dos tarjetas sueltas sobre la banda oscura y pasan
a ser **una sola pieza de papel con los extremos redondeados**, con su
guirnalda arriba y abajo y los tres bloques separados por una ramita.

- **El radio va en PORCENTAJE** —50% del ancho por 9% del alto—, no en
  píxeles: escrito en píxeles se vuelve un semicírculo en una pantalla
  angosta y una cúpula en una ancha.
- **El relleno de arriba y abajo tiene que dejar entrar la
  guirnalda**: es una capa absoluta, así que no empuja a nadie, y sin
  ese aire se le monta al primer título.
- **El botón va MACIZO y no de contorno.** Adentro de la cápsula —que
  es papel crema dentro de una sección oscura— el contorno hereda una
  tinta pensada para la banda oscura y no se lee. Es la regla de
  siempre, y acá además es lo que pide la referencia.
- **El valor es un DATO, no una frase.** La primera versión decía *"El
  valor de la tarjeta es de $50.000."* abajo de un título que ya dice
  "Valor de la tarjeta": dos veces lo mismo, y encima partido en dos
  renglones. Dice **$50.000**.
- **Y el bloque del regalo se fue: son DOS bloques, no tres.** Lo pidió
  el dueño el 05/11/2026 —*"la parte del regalo hay que sacarla, poner
  sólo valor de la tarjeta y abajo el alias"*—. Tiene razón: el alias
  es dónde se paga el valor que está justo arriba, así que partidos en
  dos se leían como dos pedidos de plata distintos. Ahora el bloque
  desaparece sólo si no hay NI valor NI alias: escondido por falta de
  valor se llevaría puesto el único dato para transferir.
- **El cierre va al revés: primero "te espero el 13 de febrero" y abajo
  el nombre.** También del 05/11. El renglón chico es la frase y el
  manuscrito grande es la firma, que es el orden en que se escribe una
  tarjeta a mano.
- **Y ahí la M del nombre salía CORTADA.** Lo vio el dueño. Los swashes
  de la manuscrita suben bastante más que su línea —o sea que la letra
  se sale de su propia caja— y el telón de `.ap` recorta JUSTO en la
  caja: la M quedaba cortada al ras, sin un solo error y perfecta en
  todo lo demás. Se arregla dándole aire arriba al bloque, con un
  margen negativo que le devuelve el lugar para que en pantalla no se
  mueva nada. **Es la misma regla que ya costó una vuelta en `ambar15`
  con el corazón del reproductor: el que recorta no puede ser más chico
  que lo que tiene que mostrar** — y vale para cualquier manuscrita
  metida adentro de un bloque con telón.

#### El dibujo de flor del final, y por qué un adorno de esquina se queda en la esquina

También con una captura: una composición botánica en los rincones de
abajo del cierre. Sale del mismo **herbario** que la planta de los
cortes y la guirnalda de la cápsula —hoja, flor, capullo—, así que las
tres usan el mismo trazo y ninguna se queda atrás el día que se
cambie. La hoja es una **almendra** y no una elipse: a este tamaño una
elipse se lee como un lazo.

**La primera versión era alta y angosta y le cruzaba el texto.** El
tallo subía desde la esquina hasta pasarle por encima al nombre y al
"te espero": el dibujo se lee perfecto y el texto queda encima de una
flor. Un adorno de esquina tiene que quedarse en la esquina, así que
la composición pasó a ser **ancha y baja**.

**Y después quedaba cortada por la curva del pie.** Pegada al borde de
abajo, el arco oscuro del pie le comía la mitad de las flores — y una
flor cortada por una curva que no es suya se lee como un error de
maqueta. Se levanta sobre esa curva.

El rincón de la derecha es el mismo dibujo **espejado por CSS**: dos
dibujos para lo mismo es uno que se queda atrás. Y el cierre **perdió
su medallón**: la flor es su emblema, y dos emblemas apilados se leen
como un error de maqueta.

#### Va con su propia planilla, no con la central

Como decidió el dueño el 01/11/2026 —*"un sheet para cada fiesta,
siempre separado"*—. Por eso `CONFIG.evento` no existe y la dirección
de `lib/planilla.js` **no se carga**: con la central puesta y sin
pestaña, la planilla contesta `sin_evento` y el invitado ve un error
que no es suyo.

**IMPLEMENTADA el 05/11/2026.** El dueño creó la planilla, pegó
`apps-script/evento-nuevo.gs.txt`, corrió `preparar()` e implementó: su
`/exec` está en `CONFIG.endpoint` y en `magali15/listado/`, que se armó
copiando la plantilla con sus dos líneas de `CONFIG`.
`pruebas/invitaciones.js` falla si una carpeta de listado tiene el
`appsScriptUrl` vacío, porque esa pantalla no traería nada.

**Y conectarla destapó dos renglones que habrían ensuciado la planilla
de la clienta, los dos heredados de `almi15`, que va con la central.**
Ninguno tira un error:

- **`CONFIG.evento` acá no existe, y mandado igual viaja como la cadena
  `"undefined"`.** `fd.set('evento', CONFIG.evento)` le habría dejado a
  Magali una columna **"evento"** llena de `undefined` en su planilla: el
  `doPost` crea una columna con el nombre de cada campo que le llega. Va
  sólo si hay evento, igual que en `ambar15`. Lo mismo la pregunta de
  *"¿llegó lo mío?"*, que salía con `?evento=undefined&confirmado=…`.
- **La regla, que es la de siempre con otra cara**: una invitación nueva
  se copia de la anterior, así que lo que se queda viejo no es el código
  — es el renglón escrito para la planilla de la OTRA.

**Y volver a pegar el código CAMBIA la dirección si se crea una
implementación NUEVA.** Pasó el mismo día: el dueño volvió al editor a
llenar las dos claves y, en vez de *Administrar implementaciones →
editar → Versión: nueva*, hizo *Nueva implementación*. La `/exec` vieja
sigue viva y vacía, y la invitación publicada seguía apuntando ahí: la
confirmación entraba en una planilla que ya no mira nadie. **No tira
ningún error** —las dos direcciones contestan 200—, y desde acá se vio
porque la dirección nueva contestaba `sin_clave_configurada` y la vieja
no. El aviso ya estaba escrito en la cabecera del `.gs.txt`; lo que
faltaba era decirlo al entregar el código.

**Y la segunda mitad: pegar el código NO alcanza, hay que correr
`preparar()`.** Es lo que escribe las claves en las propiedades del
proyecto. Sin eso la puerta del listado contesta
`sin_clave_configurada` para cualquier clave, la maestra incluida —
mientras la confirmación del invitado entra perfecto, porque el
`doPost` no depende de ninguna clave. O sea: **el invitado anda y el
cliente no puede entrar a su tablero**, que es exactamente la clase de
falla que no se descubre hasta que alguien la busca. Es *un paso de
instalación que no se puede saltear sin que algo avise, se va a
saltear*, por tercera vez.

**El correo que mandó la clienta es la clave de su tablero**, cuarta
vez después de `mia15`, `almi15` y `ambar15`, y vale la misma
advertencia: un correo es público y adivinable, y lo que abre es la
lista entera de invitados con sus nombres y sus comidas. **En el
repositorio no va nunca**: como ésta tiene su propio proyecto, vive en
`CLAVE_ELEGIDA` de la copia del editor del dueño —no en
`CLAVES_ELEGIDAS`, que es el mapa de la central—, y `pruebas/rsvp.js`
falla si lo versionado deja de estar vacío.

**No está en la galería de Trabajos ni en `/invitaciones`**, por lo
mismo que las otras cuatro: es la fiesta de una clienta de verdad,
lleva `noindex` y en el formulario se juntan nombres de invitados y
comidas. Y lleva su propia `og.jpg` (1200x630, 33 KB), tipográfica:
nunca una foto de la fiesta, que viajaría en la vista previa de cada
chat por el que pase el link.

**No mandó ninguna foto**, así que la portada es la tipográfica —que
es justamente el armado de su Canva— y las dos franjas se esconden
enteras. El día que lleguen es un renglón en `CONFIG`; ahí hay que
sacarle la curva a la sección que sigue a la franja, y eso lo hace el
JS solo.

### Probar el listado de una fiesta antes de que lo use gente

Pedido del dueño el 31/10/2026 para `ambar15`: *"necesito que armemos
la lista así la probamos"*. Lo que descubrió esa vuelta es que el
tablero de Ámbar **ya estaba armado y conectado** —su `CONFIG.evento`,
su renglón en `lib/planillas.json` y su carpeta `ambar15/listado/`—,
así que no había nada que armar. Lo que faltaba era **medirlo**.

**El recorrido entero se medía SÓLO con los campos de mia15**, que es
la única que tiene su propio Apps Script. Las tres que van contra la
planilla central —`almi15`, `facuymaxi`, `ambar15`— no se recorrían
nunca de punta a punta: si una renombrara un campo, o su
`CONFIG.evento` quedara vacío, el invitado confirmaría, la pantalla
diría **"listo"** y la fila no existiría. Eso no tira ningún error y se
descubre con el salón lleno.

Ahora `pruebas/rsvp.js` recorre **cada fiesta de `lib/planillas.json`**
contra el `.gs.txt` de verdad: postea los campos que LEE de su HTML,
comprueba que la planilla cree sola sus columnas, que la fila caiga en
SU pestaña y en ninguna otra, que el resumen cuente gente y no
respuestas, y que la puerta `?confirmado=` la reconozca.

Tres cosas que no son un detalle:

- **La lista no se escribe en la prueba**: sale de `lib/planillas.json`,
  que es la misma que lee el Apps Script. Escrita a mano se queda corta
  sola el día que entra una invitación nueva — que es justo el día en
  que algo se puede haber quedado sin conectar.
- **La pestaña se lee del `CONFIG.evento` de la invitación, no del
  nombre de la carpeta.** Dándolo por hecho, la prueba pasaría igual
  con la invitación desconectada: es la trampa de siempre —*una prueba
  que pasa siempre no prueba nada*— y acá ya había mordido una vez.
- **El recorrido está escrito UNA sola vez** (`puntaAPunta`) y lo usan
  mia15 y las tres de la central. Dos copias de lo mismo es una que se
  queda atrás, y la que se queda atrás mide la invitación del cliente
  que ya pagó.

Verificado rompiendo a propósito, sobre `ambar15`: vaciarle
`CONFIG.evento` da **1 falla** y renombrarle el campo `Confirma` da
**5**, entre ellas el síntoma que importa — *"2 · 0 confirmados"* con
la planilla llena.

**Y la vuelta de verdad SÍ se puede dar desde acá** (05/11/2026). El
proxy no dejaba salir a `script.google.com`, así que esto estaba
escrito como "lo hace una persona"; son tres hosts en la lista de la
sesión —`script.google.com`, `script.googleusercontent.com` y
`clicketerno.com.ar`— y pasa a ser una medición más.
**Cómo se hace, porque tiene una trampa**: el navegador de las pruebas
NO sale a internet —hace su propio DNS y no usa el proxy—, así que no
alcanza con apuntarlo a la `/exec`. Se intercepta
`**script.google.com/**` con `page.route`, se hace el pedido con el
`fetch` de NODE —que sí pasa por el proxy, igual que el de
`letras.js`— y se le devuelve la respuesta al navegador. Así lo que se
mide es lo que hace la PÁGINA: cuántos viajes, qué manda y qué dice
después. Medido contra la planilla de `magali15`: **un viaje, 9 s, "¡Listo,
Invitado!"**, la fila en la planilla con sus columnas (`Cuántos`,
`Canción`, `Comida 2`) y el resumen en **2 respuestas · 4 personas**.
**Y lo que se escribe queda escrito**: la planilla es la del cliente,
así que la fila de prueba hay que ir a borrarla a mano.
**Ojo con `curl --data-urlencode`**: encodea el VALOR y no el NOMBRE
del campo, así que `Cuántos=2` le llega al Apps Script como `Cuntos` y
le crea esa columna —y con eso `resumen.personas` da 1 en vez de 2,
que es exactamente el bug que el dueño ya había reportado—. Parece una
falla del producto y es de la prueba. El nombre va encodeado a mano
(`Cu%C3%A1ntos`), o se mide desde el navegador, que lo hace bien.
Lo que sigue necesitando a una persona es el editor de Apps Script. Para entrar al tablero se usa la **maestra**, que además
devuelve escrita la clave propia de esa fiesta y el enlace parado en
su pestaña; la del cliente no hay que elegirla ni ir a buscarla.

#### La clave de Ámbar la eligió la clienta, y es un correo

Tercera vez —después de `mia15` y `almi15`— y por el mismo motivo: el
cliente manda un correo de la familia y lo quiere de contraseña. Se le
dice el riesgo y se hace: *un correo es público y adivinable, y lo que
abre no es un correo, es la lista entera de invitados con sus nombres
y sus comidas.*

**El valor NO se escribe en el repo**, y eso ya no depende de que
alguien se acuerde. Vive en `CLAVES_ELEGIDAS`, en la copia del editor
de Apps Script del dueño, y `pruebas/rsvp.js` **falla si lo versionado
deja de estar vacío** —las dos `CLAVE_*_ELEGIDA` y el mapa de
`CLAVES_ELEGIDAS`, en los dos `.gs.txt`—. No le hace falta conocer
ninguna clave para medirlo: lo que exige es el vacío.

Hace falta porque la vez anterior lo agarró **un `git grep` a mano y
no una prueba**, y porque *sacarlo del archivo después no lo saca del
historial*: lo único que lo saca de verdad es cambiar la clave, que es
justo lo que el cliente no quiere. Así que tiene que fallar ANTES de
que el commit exista. Verificado rompiéndolo a propósito: da 2 fallas
—y arrastra otras tres, porque el falso reemplaza esas líneas para
poner las suyas y con una clave escrita ya no matchean.

**Y cambiarla pide volver a implementar**, porque `CLAVES_ELEGIDAS` es
código y no un dato guardado. La maestra y la inventada por la
planilla viven en las propiedades del proyecto y no lo piden.

#### La pestaña del sheet no se arma a mano: se crea sola

Preguntado por el dueño —*"pero hay que armar el sheet"*— y la
respuesta es que no, y ése **es** el punto de la planilla central: la
pestaña de una fiesta la crea el Apps Script la primera vez que llega
una confirmación suya. No hay nada que abrir en Google.

**Lo único que decide si se crea es la lista**, y hay dos: la del
sitio (`lib/planillas.json`) y el piso escrito en el código del Apps
Script. Con el piso en `['almi15']`, las confirmaciones de `ambar15` y
`facuymaxi` dependían enteras de que el Apps Script pudiera LEER el
sitio — y si no podía, no entraban: el invitado ve que no se pudo y la
planilla queda vacía, sin un solo error a la vista. Es exactamente la
falla que ya está contada más arriba, esperando a las dos fiestas que
todavía no la habían pisado.

El piso pasó a ser `['almi15', 'facuymaxi', 'ambar15']`: **las de
clientes que ya existen**. Una invitación nueva sigue yendo en
`lib/planillas.json` y nada más —si no, cada tarjeta volvería a costar
un paso del lado de Google, que es justo lo que esto vino a sacar—; el
día que una pase a ser de un cliente de verdad, se le agrega en el
próximo pegado. **Corto puede quedarse; más ancho que la lista del
sitio, nunca**, y eso lo cuida `pruebas/invitaciones.js`.

**El precio es que hay que volver a pegar el código**, igual que las
claves. Las tres cosas —la maestra, la clave elegida y el piso— se
hacen en el mismo viaje al editor.

#### Y al final se volvió atrás: una planilla POR FIESTA

Decisión del dueño el 01/11/2026, mirando todo esto: *"nosotros nos
vamos a seguir manejando como siempre. Un sheet para cada fiesta.
Siempre separado."* Se le explicó qué cuesta —cada invitación nueva
vuelve a costarle los cinco pasos en Google, que es exactamente el
problema que la central vino a sacar— y lo sostuvo. **Ámbar ya tiene
la suya**, con su propio `/exec` en `CONFIG.endpoint` y en su listado,
igual que Pía y Mia.

**Lo que NO se desarmó**: `almi15` y `facuymaxi` siguen en la central,
porque ya están andando y moverlas no le suma nada a nadie. O sea que
el sistema sostiene las dos formas a la vez, que es como nació.

Tres cosas que esto obligó a mirar, y **ninguna tira un error**:

- **`CONFIG.evento` tiene que quedar VACÍO.** Con las dos puestas
  —`evento` y `endpoint` propio— el arranque pisa el endpoint con el
  de la central y la fila cae en otro archivo. La invitación se dibuja
  igual y la pantalla dice "listo".
- **Un `evento` vacío en el POST es una COLUMNA.** El `doPost` del
  script propio crea una columna con el nombre de cada campo que le
  llega, así que `fd.set('evento','')` le dejaba al cliente una
  columna "evento" vacía en su planilla. Va sólo si hay evento.
- **Y hay que sacarla de las DOS listas de la central** —
  `lib/planillas.json` y el piso del Apps Script—: dejarla ahí no
  rompe nada hoy, pero es una pestaña habilitada que ya no usa nadie,
  y el piso no puede ser más ancho que la lista del sitio.

**Y la prueba se fue con ella.** El recorrido de punta a punta
recorría las fiestas de `lib/planillas.json`, así que sacar a Ámbar de
ahí la dejaba sin medir — un cambio que se lleva puesta su propia
medición. Ahora `pruebas/rsvp.js` recorre **las dos familias**: las de
la central salen de `lib/planillas.json` y las de planilla propia
salen de **qué carpetas de listado declaran su `appsScriptUrl`**,
contra el `.gs.txt` que corresponde a cada una. Ninguna de las dos
listas se escribe en la prueba. La de Pía se saltea sola **diciéndolo**:
su formulario no vive en `pia/index.html` sino en `pia/nueva/`.
Verificado rompiéndolo a propósito —dejándole a Ámbar el `evento`
puesto además del endpoint— da **1 falla**.

### La clave maestra de los listados

Pedido del dueño el 20/10/2026, junto con `almi15`: *"que se pueda
entrar con 1667 — contraseña maestra para todas las invitaciones de
ahora en más"*. Es para poder abrir el listado de cualquier cliente sin
ir a buscar la clave de ese evento.

Está en `apps-script/evento-nuevo.gs.txt` y en el parche
`apps-script/listado.gs.txt`: la puerta acepta **la del evento o la
maestra**, y el valor vive en las propiedades del proyecto. **En el
repositorio va vacío** (`CLAVE_MAESTRA_ELEGIDA = ''`), igual que
`CLAVE_ELEGIDA`: una clave versionada es una clave pública.

**Se le dijo el riesgo y lo sostuvo.** Cuatro dígitos son **diez mil
combinaciones** en una puerta abierta a internet, y lo que hay del otro
lado no es un listado: son los de **todos** los clientes, con los
nombres de los invitados y sus comidas, que es información de salud.
Un script las prueba todas en minutos.

Por eso la puerta ahora **se frena**: doce intentos fallados seguidos y
queda cerrada diez minutos. No la vuelve segura —la vuelve cara: diez
mil pruebas pasan de minutos a días de insistir—. El que acierta borra
la cuenta, así que el cliente que se equivocó dos veces y después entró
arranca de cero. Que un atacante pueda dejar al cliente diez minutos
afuera es el precio, y es barato: el cliente entra una vez y su
navegador se acuerda de la clave.

Del lado de la pantalla, **"esperá un rato" no es "esa clave no es"**:
el listado tiene su propio mensaje para el freno y **no borra la clave
guardada**, porque la clave puede estar perfecta y lo único que pasa es
que hay que esperar. Borrándola, el cliente vuelve mañana y se
encuentra con que tiene que escribirla de nuevo sin haberse equivocado
nunca.

Lo mide `pruebas/rsvp.js`, corriendo el `.gs.txt` de verdad: contra el
código anterior da **4 fallas**. Y hubo que enseñarle una cosa al
falso: su `PropertiesService` no tenía `deleteProperty`, que el de
Google sí tiene, y la suite se cortaba entera con un "is not a
function". **Un falso al que le falta un método de los de verdad no
mide el código, mide al falso.**

### Medir una invitación: `pruebas/invitacion_mirar.js <carpeta>`

Cuatro aparatos (320, 390, 430 y escritorio), con el sobre cerrado y
abierto, que son dos pantallas distintas. Al lado vive
`pruebas/letras.js`, que es cómo se ELIGE la tipografía: monta la misma
invitación con cada candidata y deja las capturas, porque una letra se
elige mirando y no leyendo su nombre. Contraste, 44px, desborde,
consola, CSP, **el texto que cae sobre la foto de la portada —medido
con el píxel, ver `mia15/` más arriba—**, **los bordes de letra que
no se ven**, y después las piezas: que
la cuenta regresiva corra, que el calendario marque un solo día, que
ningún enlace quede en `#`, que el sí/no no venga preseleccionado y
que la confirmación no mienta. No está en `todo.sh` porque toma un
argumento: se corre después de tocar una invitación.

**Y desde `almi15` mide una cosa más: que lo que se toca SE PUEDA
TOCAR.** Que un botón mida 56x56 y se vea perfecto no quiere decir que
responda. Se le pregunta al navegador quién atajaría el dedo en el
centro de cada control (`elementFromPoint`), con el control traído al
medio de la pantalla, que es lo que hace una persona. Si contesta
otro, está tapado. Sin esto, un formulario entero recortado por un
`clip-path` no da ningún error: lo único que se ve es la suite
**colgada treinta segundos** contra un botón que está perfecto, y eso
no dice qué pasó. Contra el código anterior da 4 fallas (una por
aparato).

**Esa comprobación se equivocó tres veces antes de medir algo**, y las
tres son la misma lección:

- **Perdonaba que contestara un PADRE del control.** Es lo que hace
  `barrido.js`, y ahí está bien. Acá no: que en el centro del botón el
  navegador devuelva al `<div>` que lo contiene quiere decir que **no
  encontró al botón**, que es exactamente lo que pasa con un recorte a
  cero. Con esa indulgencia la comprobación daba verde con el
  formulario muerto. Lo único que se perdona es que conteste un HIJO
  —el ícono adentro del botón— o que el control se declare decoración
  (`pointer-events:none`).
- **Preguntaba sin llegar.** Estas páginas llevan
  `scroll-behavior:smooth`, así que un `scrollIntoView` pelado ANIMA y
  no llega a destino antes de la pregunta: se terminaba midiendo
  arriba, donde contesta la portada, que ocupa la pantalla entera y se
  descarta por fondo. Verde sin haber medido. Va
  `behavior:'instant'` — y lo mismo el barrido previo que recorre la
  página para que el observador destape: **el observador avisa en otra
  vuelta del reloj**, así que medir en la misma vuelta en que se
  scrollea informa la invitación entera.
- **Medía lo de adentro de un `<details>` cerrado.** En Chrome eso no
  se esconde con `display:none` sino con `content-visibility`, para que
  el buscador de la página lo encuentre: tiene caja igual. El correo
  del aviso de datos devolvía una caja de 181x50 en una posición que no
  existe y la suite informaba un botón tapado que nadie ve. Es la regla
  de la caja de 0x0 otra vez: antes de medir algo, comprobar que ESTÉ.

**Tres cosas que esa suite midió mal y cómo se arreglaron**, que son
las tres la misma lección —*antes de creerle a una medición,
rompela a propósito y mirá si falla*—:

- **`scrollWidth` contra el ancho pedido no mide el desborde.** El
  `overflow-x:hidden` del body —que está puesto a propósito— hace
  que devuelva el ancho de la pantalla igual. Medido: con un bloque
  de 900px metido adentro seguía diciendo "320 contra 320". Se miden
  las CAJAS de verdad, y con el mismo bloque da 1 salido.
- **Que dos cajas no se superpongan no es que el texto no se pise.**
  La cuenta regresiva con los días en tres dígitos pintaba "469"
  ENCIMA del dos puntos de al lado y se leía `46904`. Las cajas no
  se tocaban —esa comprobación daba verde con el bug puesto—: lo que
  se desbordaba era la TINTA. Se mide con `scrollWidth` contra
  `clientWidth` de cada elemento con texto propio.
- **El medidor de contraste tiene que saltear la decoración**, con
  una definición estricta: `aria-hidden` Y `pointer-events:none`,
  las dos juntas. Sin eso un "15" dibujado en contorno se mide como
  texto a 1,00:1 —su color ES transparente— y la suite informa una
  falla que no existe. Comprobado que no la deja ciega: 2098 textos
  medidos en el producto con el filtro y sin él.

**Y la exención que dejó la prueba sin poder fallar.** El zoom de
la portada hace que la foto mida más que la pantalla —está adentro
de un `overflow:hidden` y el navegador la corta—, así que la
comprobación del desborde la informaba en los cuatro aparatos. La
primera corrección fue perdonar **todo lo que un padre recorte**, y
eso la rompió entera: `.seccion` lleva `overflow:hidden`, o sea que
perdonaba la invitación completa. Medido: con la exención ancha, un
bloque de 900px metido adentro de una sección **no se informaba**.
La exención correcta es solo para **medios** —`img`, `svg`,
`video`, `canvas`—, que es lo que el `object-fit` está hecho para
recortar, y el padre que recorta tiene que entrar él en la
pantalla. Con eso: la página limpia, y el bloque de 900px vuelve a
informarse.

**Y una de CSS que no da ningún error: una variable que no existe.**
Al rehacer la paleta se fueron `--crema`, `--crema2` y `--oro-neg`
de `:root`, pero las bandas negras las seguían usando. Una `var()`
sin definir **no es un error**: la declaración se descarta y la
propiedad hereda. Resultado, negro sobre negro en trece textos —
1,00:1— y en el navegador una banda negra vacía que parece un error
de carga. Lo agarró el medidor de contraste.

## `/invitaciones`: el link que se le manda al que todavía no compró

Pedido del dueño el 19/10/2026: *"una pestaña de invitaciones con todas
las que tenemos para poder enviar el link a potenciales clientes para que
vean qué es lo que hacemos"*.

Hasta acá lo único que había era la galería **adentro** del inicio: para
llegar, el que recibe el link por WhatsApp tiene que entrar al sitio y
bajar hasta la pantalla 6. Ahora hay una dirección propia,
`clicketerno.com.ar/invitaciones`, que entra directo a las invitaciones
andando.

**Es `invitaciones.html` en la raíz, no una carpeta.** `invitaciones/`
ya existe y está en `.assetsignore` —ahí viven el LEEME y la plantilla
del listado, que no se publican—, así que la carpeta no llega a
producción y la dirección limpia sirve el archivo de la raíz, igual que
`/muro` sirve `muro.html`. **El servidor de pruebas tuvo que aprender lo
mismo**: en el disco la carpeta SÍ está, así que `/invitaciones` le
devolvía el listado de archivos mientras en producción sirve la página.
Era la regla de siempre —un servidor de pruebas que no se parece al de
verdad esconde justo lo que hay que ver—, y acá escondía la página
entera: no se podía probar. Ahora, si la carpeta no tiene `index.html`,
cae al `.html` de al lado.

**La lista de invitaciones se mudó a `lib/trabajos.js` y es UNA sola.**
La usan la galería del inicio y esta página. Escrita en los dos lados, el
día que entra una invitación nueva una de las dos se queda atrás — y la
que se queda atrás es justamente la que abre el cliente que todavía no
compró. **Agregar una invitación es agregar un renglón ahí y nada más.**

**Lo que NO se comparte es cómo se dibuja la ficha, y es a propósito.**
El inicio la muestra adentro de un celular dibujado, con su chasis, su
isla y su barra de iOS; la página de invitaciones la muestra grande y
sola, porque ahí la invitación es el contenido y no una ilustración de un
producto. Son dos trabajos distintos y no hay nada que se pueda quedar
atrás entre ellos; lo que sí se quedaba atrás era la lista. La regla de
*"la ficha es la MISMA función"* vale cuando las dos tienen que verse
igual —el carrusel y la pantalla de todas—, y acá no es el caso.

**Los marcos van de a uno y sólo cuando se ven.** Seis invitaciones
arrancando juntas en 4G se estorban entre ellas y no termina de cargar
ninguna: es exactamente lo que ya costó caro en la vitrina. Van en fila,
con un tope de 12 s para dejar pasar a la siguiente —que no cancela a la
que quedó bajando— y no se saca ninguna por lenta: sólo si el navegador
avisa que falló, y ahí queda la portada dibujada, que se sostiene sola.

**Mia NO está en la lista, y no es un olvido.** `mia15/` es de una
clienta de verdad, lleva fotos de una menor y por eso lleva `noindex`:
meterla en la página que se le manda a cualquiera que pregunta es
publicar esas fotos a un público que no es el de la fiesta. Si alguna vez
se agrega, se pregunta primero a la familia.

Lo mide `pruebas/vitrina.js`: que la dirección abra, que las dos páginas
muestren el MISMO número de invitaciones, que cada ficha diga de quién es
aunque el marco no haya cargado, que las muestras nuestras estén
marcadas, que el botón lleve a WhatsApp con el mensaje puesto —y que lo
lleve también sin JavaScript—, que la vista previa al compartir esté
entera, y lo de siempre en tres aparatos: que nada se salga, que todo lo
que se toca llegue a 44x44 y que la consola quede limpia. Contra el
código anterior da **11 fallas**. El contraste lo mide
`pruebas/contraste.js`, que ahora recorre también esta página (38
textos).

## El flyer del listado: `bash flyer/armar.sh`

Pedido del dueño (20/10/2026): *"un flyer con todo lo que contiene ese
Dashboard y cómo entenderlo y manejarlo. Hacelo GENÉRICO así ya lo tengo
para todos los que hagan invitación. ¿A qué me refiero con genérico? Que
a la hora de poner la contraseña diga «el correo que nos enviaste para
usar como contraseña» y cosas así"*.

**La primera versión salió mal y vale anotar por qué**: se armó como una
página del sitio, en `/guia-listado`. Él lo corrigió en una línea —*"yo
quería un flyer, no armarla en la página"*— y tenía razón: lo que se
manda por WhatsApp es un **archivo**, no un link más que el cliente
tiene que abrir. Un link se pierde en el chat; un PDF queda en
"Documentos" y una imagen se ve sin tocar nada.

**Sale de un HTML igual, y eso no es un rodeo.** `flyer/listado.html` es
la fuente y `bash flyer/armar.sh` escupe `listado.pdf` (A4, para mandar
o imprimir) y `listado-1.png` / `listado-2.png` (las hojas en imagen,
que es lo que se ve en el chat sin abrir nada). Es la misma decisión que
las piezas de video: **el día que el tablero cambie, el flyer se rehace
con un comando** en vez de volver a dibujarlo — y así lo puede medir una
prueba, que a un PDF dibujado a mano no se le puede preguntar nada.

**`flyer/` está en `.assetsignore` y los archivos armados en
`.gitignore`.** Si se cayera del `.assetsignore`, Cloudflare lo subiría
y quedaría una página suelta en el sitio sin que nadie se entere — y
**eso no se nota mirando la pantalla**, porque el servidor de pruebas lo
sirve igual. Por eso hay una comprobación que lo lee.

**Las imágenes se cortan POR SECCIÓN**, no en pedazos iguales: cortar
cada N píxeles parte un renglón al medio y el que lo recibe ve media
palabra arriba y media abajo. Se le pregunta al navegador dónde termina
cada bloque y se corta ahí; y si lo que sobra al final es poco, se le
suma a la hoja anterior — una última hoja de dos dedos es un recorte,
no una hoja.

**Lo genérico es el pedido entero, y por eso es lo que se mide.** Un
flyer con el nombre de una fiesta adentro deja de servir para la
siguiente — y el que lo recibe ve el nombre de otra clienta. Donde iría
un dato de cada evento, el flyer lo NOMBRA como se lo dice por WhatsApp:
*"el correo que nos mandaste para usar como contraseña"*, *"la dirección
de tu listado, que te pasamos nosotros y termina en /listado"*.
`pruebas/guia.js` falla si aparece el nombre de cualquier carpeta de
invitación del repo, una dirección de listado concreta o un correo que
no sea el nuestro. **Los nombres los saca del repo, no escritos a mano**:
escritos, la prueba se queda corta sola el día que entra una invitación
nueva, que es justo el día en que alguien podría meterle el nombre.
Verificada poniéndole `mia15` a propósito: da 3 fallas.

**Y lo que explica también se mide.** Un flyer al que le falta una parte
es peor que no tenerlo: el cliente lo lee entero, no encuentra lo que
busca y escribe igual. La prueba exige que estén las nueve cosas —los
tres números, la diferencia entre gente y respuestas, la fila por
persona, las columnas visibles, el Excel, imprimir, el PDF, la comida de
cada uno y qué pasa si confirman dos veces—. Y que los archivos estén
armados y no pesen casi nada, porque si el armador se rompe el dueño se
entera recién cuando va a mandarlo.

**El logo va con `../marca.webp`.** Vive en la raíz y esto está en
`flyer/`: sin el `../` sale el cuadradito roto, y es lo primero que se
ve. Lo agarró una captura, no una prueba.

En papel la hoja va en milímetros, los contenedores se resetean y los
botones no se imprimen: en papel un botón es una mancha que no hace
nada. Es la lección de las tarjetas para cortar. El contraste lo mide
`pruebas/contraste.js`, que recorre la fuente (98 textos) — y le agarró
dos grises que no llegaban a 3:1 apenas escrita.

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
4. **El nombre del titular** para las dos páginas legales. El **CUIT ya
   está** (17/10/2026): `20-38900666-2`, en `privacidad.html#responsable`
   y en `terminos.html#quienes`. Empieza en 20, o sea que es una persona
   física, y ahí la "razón social" es el nombre y apellido del titular
   — eso es lo único que falta. Con el CUIT solo el vendedor ya queda
   identificado: el que lo busca en ARCA lo encuentra.
   `pruebas/legales.js` lo informa como "salteada" en cada corrida: no
   rompe la suite, pero no deja olvidarse.
   **Y comprueba que el CUIT sea un CUIT**, con su dígito verificador.
   Un dígito cambiado en una página legal no tira ningún error y no lo
   nota nadie hasta que alguien lo va a buscar y no existe — y el que
   mira ahí es un cliente con un problema, o Defensa del Consumidor.
5. **Rotar la clave maestra**, que nunca se cambió.

## Lo que no se toca sin permiso

- La clave maestra de administrador.
- Las políticas de Supabase ya instaladas.
- `app.html`: hay QR impresos apuntando ahí.
- El número de WhatsApp.

## Pendiente, decidido y no hecho

- ~~**Implementar la planilla central**~~. **Hecho el 23/10/2026.** La
  dirección está en `lib/planilla.js` y `almi15/listado/` existe. Lo
  único que falta de eso es **verlo entrar una vez**: confirmar en
  `/almi15` como si fuera un invitado y mirar que aparezca la fila en
  la pestaña `almi15`. **Eso ya se puede medir desde acá** desde el
  05/11/2026 —ver *"Probar el listado de una fiesta antes de que lo use
  gente"*—, y está hecho para `magali15`; falta correrlo para ésta.
  La clave de cada cliente **no hay que elegirla ni ir a buscarla**: la
  inventa la planilla y se lee abriendo el listado de ese cliente con la
  maestra. La de `almi15` la eligió la clienta y está en
  `CLAVES_ELEGIDAS`, en la copia del editor.
- **El titular de la cuenta del alias de `almi15`.** El alias **cambió
  el 26/10/2026**: era `nancyvaldez1976` y pasó a **`alma.mia120`**, de
  otra cuenta — así que el titular hay que **volver a preguntarlo**, que
  es exactamente lo que ya había pasado en `mia15`. Es el nombre que le
  muestra el banco al invitado cuando pega el alias; sin él ese renglón
  no se dibuja, y un nombre inventado al lado de un alias es peor que
  ninguno.
  **El alias se escribe TAL CUAL lo manda el dueño.** En `mia15` el
  punto del final resultó ser parte del alias y por poco se lo
  "arreglamos": copiado de menos, la transferencia del invitado va a
  otra cuenta o no encuentra ninguna. Y el rótulo *"Alias para
  transferir"* queda arriba por los dos lados: se lee igual que un
  usuario de Instagram, y el dueño lo pasa diciendo *"el cbu para
  regalos"* — pegar un alias donde el banco pide un CBU no entra.
- **Lo que falta de `ambar15/`, y lo tiene que mandar la clienta**: el
  **titular de la cuenta** del alias `ambar.balbi.rc` —el nombre que le
  muestra el banco al invitado cuando lo pega— y **hasta cuándo se
  puede confirmar**: a esa pregunta contestó *"confirmar asistencia"*,
  que no es una fecha. Los dos, vacíos, no dibujan su renglón. Y el
  alias se escribe **tal cual lo mandó**, sin "arreglarle" nada: en
  `mia15` el punto del final resultó ser parte del alias.
  **Y del lado del dueño, un paso en el editor de Apps Script**: la
  clienta eligió un correo de contraseña para su tablero, así que va
  en `CLAVES_ELEGIDAS` con la fiesta `ambar15` y **hay que volver a
  implementar** —es código, no un dato guardado—. Hasta que eso no
  esté, su listado abre con la clave que inventó la planilla (se lee
  entrando con la maestra) y no con el correo. En el repositorio ese
  valor **no va nunca**, y ahora hay una prueba que lo cuida.
- **Lo que falta de `facuymaxi/`, y lo tienen que mandar ellos.** Las
  fotos YA LLEGARON (01/11/2026): la del jardín al atardecer es la
  portada, la del mar es el cierre y las otras tres son la tira;
  **falta la de las mascotas**, que todavía no se sacaron. **Los
  horarios ya están** (02/11/2026): 21 h apertura de puertas, 21:30
  ceremonia, 22 h la fiesta, 4 am el final. Quedan **hasta cuándo se
  puede confirmar** —dijeron "durante marzo de 2027"—, el **titular de la
  cuenta** del alias `FACUYMAXI.BODA` y **a quién le escriben los
  invitados el día de la fiesta**, que no podemos ser nosotros.
  **Y desde el 02/11/2026 ya NO hay píldora en la pantalla** que lo
  recuerde —el dueño las mandó sacar—, así que este renglón es lo
  único que queda: el dato sigue sin inventarse y su renglón no se
  dibuja. Y hay dos
  cosas para preguntarles: si quieren una sección como la de
  `mateoylucas/` sobre la Ley 26.618 —no se pone sin preguntar— y si
  la frase de la portada se queda como está, porque **esa frase es
  nuestra**: no mandaron ninguna.
- **Lo que falta de `magali15/`.** Del lado de la clienta: el
  **titular de la cuenta** del alias `magali.loor` —el nombre que le
  muestra el banco al invitado cuando lo pega—. Vacío no dibuja su
  renglón. (La dirección del salón ya llegó: Campo Timbó.)
  **Y el valor de la tarjeta ($50.000) salió de la tarjeta de Canva de
  ella y no del mensaje del dueño**, así que queda anotado de dónde
  vino. La fecha para confirmar la mandó él el 05/11/2026: **10 de
  enero de 2027**.
  Y si la clienta quiere **la tipografía exacta** de su tarjeta:
  Parfumerie Script Pro se compra con licencia web en MyFonts o
  Fontspring; con el archivo en la mano es una línea. Las otras dos
  que pidió (Frasa Display y Bright) son de Canva y no se pueden
  incrustar en un sitio — su papel ya lo hacen Gilda Display y Hanken
  Grotesk.
  **La planilla ya está** (05/11/2026): el dueño la creó, pegó el
  código, corrió `preparar()` e implementó, así que la confirmación
  entra y el tablero vive en `clicketerno.com.ar/magali15/listado`.
  **El tablero abre** (05/11/2026): con la maestra y con el correo que
  mandó la clienta. Medido de punta a punta desde acá —un invitado
  confirmando en la invitación de verdad, un viaje, la fila en la
  planilla y el resumen en gente y no en respuestas—. Ese correo
  **en el repositorio no va nunca**: vive en `CLAVE_ELEGIDA` de la
  copia del editor del dueño.
  Quedó para borrar a mano en su planilla lo que dejó la prueba: las
  dos filas que dicen "PRUEBA" y dos columnas vacías, `Cancin` y
  `Cuntos`, que creó un `curl` mal encodeado (ver más abajo).
- **`mia15/` informa 1 falla de `invitacion_mirar.js`** y es de antes:
  "la portada APARECE de golpe, no hay cruce con la carta". El cruce
  se escribió para `almi15` y nunca se le aplicó a Mia. Comprobado
  contra el código publicado: da la misma falla.
- **`mateoylucas/` y `claraybruno/` no pasan `invitacion_mirar.js`**, y
  es de antes de todo esto: la de Mateo y Lucas informa 2 fallas (la
  portada se queda en modo foto sin tener ninguna, y por eso le falta un
  borde rasgado) y la de Clara y Bruno **corta la suite**, porque su
  sobre no tiene el botón `#abrir` que la prueba busca. Las dos son
  muestras nuestras, así que no hay un cliente esperando, pero son las
  que se le muestran al que todavía no compró. Es la misma pasada
  pendiente que ya está anotada para `juliayfranco/`.
- ~~**El rollo nunca se probó en un teléfono de verdad.**~~ **Mal escrito, y
  quedó dando vueltas.** Esta línea sobrevivió a la sesión que la
  desmintió: el apartado *"Lo que se vio en un iPhone de verdad"*, más
  arriba, es justamente el dueño probándolo en su iPhone, y de ahí salieron
  las dos fallas que ninguna suite podía ver (de la cámara no se podía
  salir, y el revelado se tapaba a sí mismo). Él lo corrigió el 12/10/2026
  con cuatro palabras: *"pero yo siempre lo probé en iPhone"*.
  **Un pendiente que ya se hizo y sigue escrito es peor que no tener la
  lista**: hace tomar decisiones sobre un estado que no existe, y acá
  estuvo a punto de mandar a repetir una prueba hecha.
  **Lo que de verdad queda sin ver**, y es lo único:
  **el wifi de un salón lleno** —doscientos teléfonos colgados del mismo
  router, subiendo en el minuto del brindis—. Eso no se puede simular: los
  reintentos, el freno de ráfaga y el tope de cámaras están medidos contra
  una copia del esquema de producción, pero el router de un salón no se
  copia. Se ve la primera noche de verdad.
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
  donde están, no se mudan a R2. Hay DOS motivos, y el segundo es peor que
  el primero.
  **El depósito**: una foto pesa ~441 KB y un evento de 100 invitados con
  24 fotos son ~1 GB, así que **el plan gratis (1 GB) no aguanta un solo
  casamiento.**
  **Y que el plan gratis PAUSA el proyecto solo** tras unos días sin
  actividad. Pasó el 25/09/2026: el proyecto apareció pausado y **con eso
  el producto entero está caído** —la página pública abre, pero el muro no
  proyecta, la cámara del rollo no abre y nadie entra a su evento—. Desde
  acá no se nota: las demostraciones y las 37 suites corren contra un
  Supabase de mentira y dan verde igual. Se despierta gratis con "Resume
  project" y no se pierde nada (los datos y los respaldos quedan), pero el
  riesgo de verdad es otro: **si entre la venta y la noche de la fiesta
  pasan unos días sin que nadie toque la base, se puede pausar justo el
  día del evento**, con los QR impresos y el salón lleno. Pro son USD 25 al mes con 100 GB, y con los 90 días
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
