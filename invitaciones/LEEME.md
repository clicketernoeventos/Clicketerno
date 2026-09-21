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

## Nombres que NO se pueden usar

Son los que ya usa la app. Una carpeta con uno de estos nombres tapa la
aplicación entera:

    muro  rollo  app  sql  pruebas  invitaciones  logo  marca  og
    privacidad  terminos  .well-known

Los dos últimos de la primera línea y los de la segunda son páginas legales
y archivos que el sitio tiene que servir sí o sí: una carpeta con uno de
esos nombres tapa la Política de Privacidad, los Términos o el
`security.txt`, y eso ya no es un bug, es un incumplimiento.

`node pruebas/invitaciones.js` revisa esto y falla si alguna carpeta pisa
algo. Corrélo después de agregar una.

## Peso

Cada despliegue sube todo el repositorio. Una invitación con veinte fotos
sin comprimir pesa más que toda la app junta. Antes de subirla:

- Fotos a **1600 px** de ancho como máximo, en `.webp` o `.jpg`.
- Ninguna foto arriba de **300 KB**.
- Música: un solo archivo, `.m4a` o `.mp3`, y que no pase de **3 MB**.

La prueba avisa si una invitación se va de peso.
