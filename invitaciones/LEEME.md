# Invitaciones

Cada invitación es **una carpeta con su `index.html` adentro**, puesta en la
raíz del repositorio (no acá adentro). Así queda con la dirección más corta:

    delfina15/index.html   →   clicketerno.com.ar/delfina15

Este archivo es solo la explicación; las carpetas van afuera.

## Cómo agregar una

1. Poné la carpeta en la raíz del repo, con el nombre que va a ser la
   dirección: en minúsculas, sin espacios ni acentos (`delfina15`, no
   `Delfina 15`).
2. Adentro tiene que haber un `index.html`. Si la carpeta que te pasaron
   tiene el HTML con otro nombre, renombralo.
3. Las fotos y la música van dentro de esa misma carpeta, y el HTML las
   tiene que llamar por camino relativo (`fotos/uno.jpg`), nunca con una
   dirección de Netlify.
4. Subila y esperá un minuto: Cloudflare publica solo.

## Las confirmaciones (el listado)

La planilla vive en Google, no acá, y **cada evento necesita la suya**.
Son tres pasos y el orden importa:

1. **Planilla nueva** en Google Sheets → Extensiones → Apps Script →
   pegar `apps-script/evento-nuevo.gs.txt` entero.
2. Arriba del archivo hay dos constantes. `CLAVE_ELEGIDA` se deja
   vacía salvo que el cliente pida una suya, y `CLAVE_MAESTRA_ELEGIDA`
   lleva la maestra —la misma para todas las invitaciones, la que usa
   Click Eterno para entrar a cualquier listado—. **Las dos se llenan
   acá, en la copia del editor, nunca en el repositorio.**
   Después, correr la función **`preparar`** una vez: escribe los
   títulos, **inventa la clave** del listado si no elegiste una, la
   guarda y te la muestra. Y por último, Implementar → Nueva
   implementación → Aplicación web → acceso **Cualquier persona**, y
   copiar la dirección que termina en `/exec`.
3. Copiar `invitaciones/plantilla-listado/index.html` a
   **`<evento>/listado/index.html`** y llenarle las dos líneas de
   `CONFIG`: el nombre del evento y esa dirección. La misma dirección
   va en el `CONFIG.endpoint` de la invitación.

El cliente entra a `clicketerno.com.ar/<evento>/listado`, escribe la
clave una vez y ve los tres números, la tabla y el botón de Excel.

**El listado no se edita por evento.** Es la plantilla con su `CONFIG`
y nada más; `pruebas/invitaciones.js` falla si alguna copia se separó.
Dos versiones de la misma pantalla es una que se queda atrás, y la que
se queda atrás es la del cliente que ya pagó.

## Nombres que NO se pueden usar

Son los que ya usa la app. Una carpeta con uno de estos nombres tapa la
aplicación entera:

    muro  rollo  app  sql  pruebas  invitaciones  logo  marca  og
    demo  muestra  empezar  404
    privacidad  terminos  .well-known  iconos

`demo` son las fotos de la fiesta de ejemplo y `muestra` las capturas
del producto que usa la página de inicio: tapadas, quedan huecos en
blanco y no tiran ningún error.

Los dos últimos de la primera línea y los de la tercera son páginas legales
y archivos que el sitio tiene que servir sí o sí: una carpeta con uno de
esos nombres tapa la Política de Privacidad, los Términos o el
`security.txt`, y eso ya no es un bug, es un incumplimiento.

`iconos` guarda los del manifiesto —los que hacen que el muro y el rollo se
puedan poner en la pantalla del teléfono—. Una carpeta con ese nombre los
tapa y el sistema dibuja un cuadrado gris con la inicial.

`node pruebas/invitaciones.js` revisa esto y falla si alguna carpeta pisa
algo. Corrélo después de agregar una.

## Peso

Cada despliegue sube todo el repositorio. Una invitación con veinte fotos
sin comprimir pesa más que toda la app junta. Antes de subirla:

- Fotos a **1600 px** de ancho como máximo, en `.webp` o `.jpg`.
- Ninguna foto arriba de **300 KB**.
- Música: un solo archivo, `.m4a` o `.mp3`, y que no pase de **3 MB**.

La prueba avisa si una invitación se va de peso.
