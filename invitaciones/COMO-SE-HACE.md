# Cómo se hace una invitación digital en Click Eterno

**Este archivo es para un chat aparte**, dedicado a hacer UNA invitación.
El chat de la página web no se toca; acá está todo lo que hace falta saber
para no tener que contarlo de nuevo.

Si venís de cero: leé esto entero antes de escribir una línea. Casi todo lo
que dice es una cosa que ya salió mal una vez.

---

## 0. Lo primero: qué archivos son tuyos

El proyecto se lleva **desde un solo chat** justamente porque ya pasó que
dos sesiones en paralelo se pisaran los archivos. Si vas a trabajar en
paralelo con el chat de la página, el reparto es éste y no se negocia
sobre la marcha:

**Tuyos, podés tocarlos:**

    <nombre>/index.html
    <nombre>/fotos/*
    <nombre>/<musica>.m4a

**NO los toques, ni para una coma:**

    index.html          la página pública          ← del otro chat
    muro.html           el muro en vivo            ← del otro chat
    rollo.html          el rollo eterno            ← del otro chat
    404.html  empezar.html  privacidad.html  terminos.html
    pruebas/*           las suites
    _headers            la CSP
    .assetsignore  wrangler.json
    CLAUDE.md           el manual del proyecto
    sql/*               la base

**La invitación NO se agrega sola a la galería de Trabajos.** Esa galería
vive en `index.html`, que es del otro chat. Cuando la invitación esté
lista, avisás y el otro chat la suma. Si la agregás vos, se pisan.

Antes de cada tanda de trabajo: `git fetch origin main && git merge origin/main`.

**El negocio está en Rosario (UTC−3)** y el teléfono es **341 250-6451**,
que no se cambia nunca.

---

## 1. Qué es una invitación acá

Una carpeta en la raíz del repo, con un `index.html` adentro. Nada más.

    pia/nueva/index.html   →   clicketerno.com.ar/pia/nueva
    delfina15/index.html   →   clicketerno.com.ar/delfina15

**No hay build, no hay dependencias, no hay framework.** Un solo archivo
HTML con su CSS y su JS adentro. Si algo parece que necesita `npm install`,
está mal pensado. Las fotos y la música van en esa misma carpeta y se
llaman por **camino relativo** (`fotos/1.webp`), nunca con una dirección
absoluta ni de Netlify: antes vivían en Netlify, donde cada invitación era
un sitio aparte, y los caminos absolutos funcionaban; acá no.

**El modelo a copiar es `pia/nueva/index.html`.** Está terminado, probado y
es el que el dueño muestra. Abrilo y mirá cómo está armado antes de
inventar nada.

### Las nueve secciones de Pía, en orden

1. **El sobre** (`#sobre`) — tapa cerrada, "tocá el libro para abrirlo". El
   primer toque del invitado es además el permiso que pide el navegador
   para que suene la música: si no se aprovecha ahí, después hay que
   pedírselo de nuevo y queda una invitación muda.
2. **El nombre** (`#nombre`) — el momento, a pantalla completa.
3. **La cuenta regresiva** — días, horas, minutos, segundos.
4. **Cuándo y dónde** — con el botón que abre el mapa.
5. **El cronograma** — hora por hora, de la recepción al baile.
6. **Dress code**.
7. **La playlist** — el invitado pide la canción que no puede faltar.
8. **El alias para regalos** — se toca y se copia solo.
9. **Confirmación (RSVP)** y **cierre**.

No son obligatorias las nueve. Son las que ya están resueltas.

---

## 2. Los nombres que NO se pueden usar

Una carpeta con uno de estos nombres **tapa la aplicación entera** y no da
ningún error: la dirección simplemente deja de llegar a donde iba.

    muro  rollo  app  sql  pruebas  invitaciones  logo  marca  og
    demo  muestra  empezar  404
    privacidad  terminos  .well-known  iconos  lib

`demo` son las fotos de la fiesta de ejemplo y `muestra` las capturas del
producto de la página de inicio: tapadas, quedan huecos en blanco.
`privacidad` y `terminos` son páginas legales obligatorias: taparlas ya no
es un bug, es un incumplimiento. `iconos` son los del manifiesto.

El nombre va **en minúsculas, sin espacios ni acentos**: `delfina15`, no
`Delfina 15`.

---

## 3. El peso: cada despliegue sube TODO el repo

Una invitación con veinte fotos sin comprimir pesa más que la app entera.

| Qué | Tope |
|---|---|
| Ancho de cada foto | 1600 px |
| Cada foto | 300 KB |
| La carpeta entera | 12 MB |
| El HTML (por si trae fotos en base64) | 2 MB |
| La música, un solo archivo | 8 MB |

La música va con **`preload="none"`**: así recién se baja si el invitado
toca el botón y no frena la primera carga. Son megas del celular de otra
persona.

`node pruebas/invitaciones.js` mide todo esto y falla si algo se pasa.
**Corrélo siempre antes de dar por terminada la invitación.**

---

## 4. La CSP: lo que el sitio NO deja cargar

`_headers` lleva una Content-Security-Policy que vale para **todo** el
sitio, invitaciones incluidas. Existe porque la página del muro tiene a
mano la clave del evento y la maestra: cualquier código ajeno que llegue a
correr ahí se las lleva.

Para una invitación, lo que importa es esto:

| Qué | De dónde puede venir |
|---|---|
| Scripts | **solo del propio sitio** (y el inline del HTML). **Ningún CDN.** |
| Hojas de estilo | del sitio, inline, y `fonts.googleapis.com` |
| Tipografías | del sitio y `fonts.gstatic.com` |
| Imágenes | del sitio, `data:` y `blob:` |
| Audio y video | del sitio, `data:` y `blob:` |
| `fetch`/XHR | del sitio, Supabase, **`script.google.com`** (el RSVP) y `*.netlify.app` |
| Marcos (`<iframe>`) | del sitio y `*.netlify.app` |

**Una CSP apaga cosas sin decir una palabra.** Ya pasó: faltaba
`netlify.app` en `connect-src` y la galería de Trabajos dejó de mostrar
las tres invitaciones, sin un solo error a la vista. Si algo no anda,
mirá la consola: un bloqueo de CSP sale con nombre y apellido y dice qué
directiva lo frenó.

**Nada de píxeles de Meta, TikTok, Hotjar ni grabación de sesión.** No es
solo la CSP: en una invitación de quince hay menores, y frente a la Ley
25.326 cargar terceros ahí es exposición. Es parte de lo que el negocio
vende.

---

## 5. Probarla: el servidor de pruebas, no un `file://`

    python3 pruebas/servidor.py 8099
    # y abrís http://127.0.0.1:8099/<nombre>

Ese servidor sirve **con las cabeceras de `_headers` puestas**, que es lo
que lo hace útil: si la CSP bloquea algo, salta acá y no en la fiesta de
un cliente. Abrir el HTML con doble clic (`file://`) no prueba nada: ahí no
hay CSP, no hay direcciones limpias y el `fetch` del RSVP se comporta
distinto.

Después:

    node pruebas/invitaciones.js

Si tocaste algo fuera de tu carpeta (no deberías), corré todo:

    bash pruebas/todo.sh

**Un servidor que quedó de antes te deja fallas que parecen del producto.**
Si `todo.sh` dice *"ya había algo sirviendo (no lo toco)"*, matá lo que
esté escuchando y corré de nuevo.

---

## 6. La confirmación (RSVP)

La planilla vive en Google, no en el repo. El flujo es:

1. El formulario manda un **POST** con `FormData` al endpoint del Apps
   Script, en `mode:'no-cors'`.
2. Como `no-cors` no deja leer la respuesta, **se vuelve a preguntar**:
   `GET ?confirmado=NOMBRE`, que contesta sí o no.
3. Recién si eso dice que sí, la pantalla dice "listo".

Ese segundo paso **no es un adorno**: es la regla más vieja del proyecto.
*Si algo no se guardó, el mensaje no puede decir "listo".* Con el POST
solo, una confirmación perdida se veía igual que una guardada.

El endpoint se escribe una sola vez, en el objeto `CONFIG` de arriba del
`<script>`:

```js
endpoint: "https://script.google.com/macros/s/AKfy…/exec"
```

**Cada invitación nueva necesita su propio Apps Script y su propia
planilla.** Lo que hay que pegar está entero en
`apps-script/evento-nuevo.gs.txt`: trae el `doPost` (la escritura) y el
`doGet` con sus dos puertas —`?clave=`, la lista entera para el
listado, y `?confirmado=NOMBRE`, que contesta sí o no y nada más—.

No confundirlo con `apps-script/listado.gs.txt`, que es otra cosa: el
parche para la planilla de Pía, que ya tiene su `doPost` andando.

**La clave va en las propiedades del proyecto de Apps Script, nunca en
el HTML**: una página pública no puede guardar un secreto. No hay que
inventarla ni ir a buscar el panel de propiedades — la función
`preparar()`, que se corre una vez desde el editor, la inventa, la
guarda y te la muestra. El portón anterior comparaba contra un correo
escrito en el propio HTML, que cualquiera leía con "ver código fuente".

**Los campos del formulario son los títulos de las columnas.** El
`doPost` crea la columna sola la primera vez que llega un campo que no
conocía, así que la invitación pregunta lo que quiera sin tocar el
script. Dos nombres sí están fijos y son los que el resumen entiende:
`Nombre` y `Confirma` (que vale `Sí` o `No`).

**Y el `fetch` no se puede cambiar por un `<form action>`.** Acá hay
CSP y dice `form-action 'self'`: un formulario que postea derecho a
`script.google.com` lo frena el navegador. En Netlify no había CSP y
andaba. Va por `fetch`, como está escrito arriba.

La lógica del Apps Script está medida sin Google en
`pruebas/rsvp.js`, y la pantalla del listado en `pruebas/listado.js`.

---

## 7. Las reglas que ya costaron caro

Todas éstas se pagaron una vez. Ninguna es teórica.

### Fechas y horas

- **`toISOString().slice(0,10)` da la fecha en UTC.** Después de las nueve
  de la noche en Rosario, ya es mañana. Una cuenta regresiva que usa eso
  se adelanta un día esa misma noche.
- Las fechas se arman con hora local explícita, y se piensan desde
  Rosario (UTC−3), no desde UTC.
- Los días se cuentan **en días de calendario**, no restando
  milisegundos: "falta un día" y "faltan 23 horas" no son lo mismo para
  el que lee.

### iPhone (que es donde está el tráfico)

- **El audio necesita un gesto del usuario.** Safari no deja sonar nada
  sin que la persona haya tocado algo primero. Por eso la música arranca
  en el toque del sobre.
- **Safari no tiene `ctx.filter`** en canvas. Si dibujás algo con
  filtros, en iPhone sale sin filtro y nadie se entera.
- **`vh` en un iPhone es la pantalla CON las barras escondidas.** Para
  que algo entre de verdad hay que usar `svh` (con `vh` de respaldo para
  los navegadores viejos). Una portada a `100vh` queda cortada por abajo.
- **`position:fixed` no lo corre el `padding` del body.** Cada capa fija
  necesita su propio `top`.

### Lo que se toca

- **Todo lo que se toca llega a 44×44 px.** Es la medida de Apple y de
  Google. Se agranda el **área** (padding), no la tipografía: el diseño
  queda igual.
- **El `:hover` se queda PEGADO en una pantalla táctil.** Al tocar, el
  navegador deja el estado puesto hasta que toques otra cosa, así que el
  botón parece seleccionado para siempre. Todo hover va adentro de
  `@media(hover:hover)`.
- **Lo que se toca tiene que hundirse** (`:active` con `scale(.975)`).
  Sin eso, con mala señal, el invitado no sabe si el toque entró y toca
  tres veces.
- **`-webkit-tap-highlight-color:transparent`** en todo, no en un botón
  suelto: el recuadro azul del sistema arruina el diseño.
- **Un botón que no puede hacer su trabajo molesta más que no estar.** Si
  el navegador no ofrece la función, el botón no se dibuja.

### Que se lea

- **El contraste no se opina, se calcula.** Abajo de 3:1 no es "poco
  contraste": es que el texto no está. Ya pasó dos veces con bloques que
  traían su propio fondo y heredaban la tinta de la sección de arriba:
  contraste 1.00:1, los títulos no existían, y en el monitor no se nota
  porque uno mira otra cosa.
- **Si un bloque trae su propio fondo, trae su propia tinta.**
- **Una tipografía fina se parte en un teléfono.** La Bodoni y las didone
  en general: preciosas en un cartel, invisibles a 15px. El dueño lo dijo
  mirando el muestrario: *"como que desaparecen"*.
- **El peso que se pide en el `<link>` tiene que ser el que usa el CSS.**
  `font-weight:200` con la fuente cargada en 300 es pedirle al navegador
  que invente un peso, y eso no avisa.
- **Una tipografía sin bastardilla no se puede poner en bastardilla.** El
  navegador inventa una oblicua torcida y se nota.

### Que se mueva bien

- **Con "menos movimiento" (`prefers-reduced-motion`) no late nada**,
  pero el contenido se sigue viendo. Apagar el movimiento no puede
  esconder contenido: si el estado por defecto es invisible y la
  animación es la que lo muestra, en ese modo la invitación queda en
  blanco y no hay ningún error.
- **Lo mismo con `animation-timeline: view()`**, que Safari recién trae
  en versiones nuevas: va adentro de un `@supports` y afuera el estado
  por defecto tiene que ser visible.
- **Todo lo que depende del scroll pasa por UN solo oyente** con
  `requestAnimationFrame`. Tres oyentes sueltos corriendo en cada píxel
  es lo que hace que una página se sienta pesada en un teléfono.
- **Dos reglas CSS para lo mismo: gana la última.** Un `@media` no sube
  la especificidad. Ya costó dos veces creer que el CSS "no había
  entrado".

### Al escribir el código

- **Antes de inventar un nombre, `grep`.** Pisar una función o una clase
  que ya existe mata la página entera con un error que apunta a otro
  lado. Pasó tres veces en este proyecto.
- **Un acento grave adentro de una plantilla la cierra**, aunque esté en
  un comentario HTML. Rompió un archivo entero con un "Unexpected
  identifier" que apuntaba a una línea perfecta.
- **Después de editar, un `grep` de lo que acabás de poner.** Un script
  de edición que se corta a la mitad deja todo *pareciendo* hecho.
- **El `load` de un `<img>` NO llega a `window`; el `error` sí.** Si
  escuchás cargas de imágenes, va en `document`, en captura.

---

## 8. Lo legal, que en una invitación de quince no es un detalle

- **Artículo 53 del Código Civil y Comercial**: para publicar la imagen de
  una persona hace falta su consentimiento. Las tres excepciones (actos
  públicos, interés científico, derecho de informar) **no** cubren una
  fiesta privada. Más el **artículo 31 de la Ley 11.723** para el retrato
  fotográfico.
- **Menores**: el consentimiento lo dan quienes ejercen la
  responsabilidad parental, y **lo tiene que reunir quien organiza la
  fiesta**, que es el que conoce a los invitados. Nosotros no podemos.
- Las fotos de la invitación quedan en una **dirección fija y pública**:
  las puede bajar cualquiera y las puede indexar un buscador. No es lo
  mismo que mandarlas por WhatsApp.
- **Nada de píxeles de terceros ni grabación de sesión.** Ver el punto 4.
- Los datos que deja el invitado al confirmar (nombre, si viene, la
  canción) son datos personales: se piden para organizar la fiesta y para
  nada más.

---

## 9. La marca

- **Paleta**: el negro/crema de Click Eterno con el oro `#D9AE72` es la
  marca; **cada invitación tiene la suya** (la de Pía es vino + oro, la de
  Key verde bosque, la de Xiomara rosa). El diseño se hace **para esa
  fiesta**, con su temática y sus colores: no hay dos iguales, y eso es
  justamente lo que se vende.
- La página pública usa **Hanken Grotesk**; las apps, **Bodoni Moda** y
  **Poppins**. Una invitación **no tiene por qué usar ninguna de ésas**:
  Pía va en Cormorant Garamond + Jost. Lo único obligatorio es que se lea
  (punto 7).
- Hay cosas que **no se tocan sin permiso**: el número de WhatsApp, la
  clave maestra, las políticas de Supabase ya instaladas y `app.html`
  (hay QR impresos apuntando ahí).

---

## 10. Cuando esté lista

1. `node pruebas/invitaciones.js` en verde.
2. Mirada en un teléfono de verdad, no solo en el emulador. **Lo que una
   suite no puede medir es si algo se SIENTE bien**: las dos peores fallas
   del rollo estaban a la vista en el código, no rompían nada, y no
   existieron hasta que una persona lo tuvo en la mano.
3. Commit y push a tu rama. **Nunca a `main` directo sin correr las
   pruebas.**
4. Avisás que está lista y **el otro chat la suma a la galería de
   Trabajos** de `index.html`. Para eso hace falta: el nombre de la
   carpeta, el nombre y el tipo de la fiesta ("XV años · Bosque
   encantado"), y los tres colores de la portada dibujada que se ve
   mientras carga el marco (fondo, tinta y el tono suave).

---

## 11. Si hace falta algo de afuera

- **El SQL va pegado en el chat, listo para copiar.** Nunca como archivo
  adjunto. Desde acá no se llega a la base de producción: lo corre una
  persona en el SQL Editor de Supabase.
- **Cuando hay opciones, dar la más simple.** Una recomendación, no un
  menú. Lo dijo con todas las letras: *"no quiero renegar"*.
- **Del otro lado no se depura.** Si algo falla en el teléfono, lo que
  llega es "no anda" o una captura. La prueba tiene que existir antes de
  que la pruebe una persona.
