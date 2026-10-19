/* La lista de invitaciones, UNA sola vez.
   Vive acá y no adentro de index.html porque la usan DOS páginas: la
   galería de Trabajos del inicio y la página /invitaciones, que es el
   link que se le manda a un cliente que todavía no compró. Escrita en
   los dos lados, el día que entra una invitación nueva una de las dos
   se queda atrás — y la que se queda atrás es justamente la que el
   cliente abre. Agregar una invitación es agregar un renglón ACÁ.

   Lo que las dos páginas NO comparten es cómo se dibuja la ficha: el
   inicio la muestra adentro de un celular dibujado y la página de
   invitaciones la muestra grande y sola. Son dos trabajos distintos y
   no hay nada que se pueda quedar atrás entre ellos; lo que sí se
   quedaba atrás es la lista, y por eso es lo único que se comparte. */
window.TRABAJOS=[
  /* Primera a propósito, y es la única decisión de orden que importa: el
     que entra ve un CASAMIENTO antes que nada. La galería eran tres XV
     seguidos y el que busca para su boda cerraba la página creyendo que
     esto es para quinceañeras. Además vive en el repo, así que abre
     siempre: la primera ficha no puede depender de que Netlify esté en pie. */
  {nombre:'Clara & Bruno', tipo:'Casamiento · Olivo y lacre', url:'claraybruno/', captura:'', vivo:true,
   sub:'Nos casamos', muestra:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#3B4632,#1C2219 60%,#131811)', tinta:'#F5EFE4', suave:'#B8904F', ad:'✦ 🌿 ✦'},
  /* Dibujada entera: no tiene una sola foto, y es a propósito. No se
     pueden inventar fotos de dos personas que no existen, y poner una de
     stock como si fueran ellos es mentirle al que mira (más el artículo
     53). Lo que muestra es que la pieza se sostiene sola: tipografía,
     dos metales y los anillos. */
  {nombre:'Mateo & Lucas', tipo:'Casamiento · Dos metales', url:'mateoylucas/', captura:'', vivo:true,
   sub:'Nos casamos', muestra:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#1D2531,#0B0E13 60%,#070A0E)', tinta:'#F4F0E8', suave:'#C9A46B', ad:'✦ ✦ ✦'},
  {nombre:'Key', tipo:'XV años · Bosque encantado', url:'https://keyxv.netlify.app', captura:'', vivo:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#25382B,#0F1613 60%,#080B09)', tinta:'#F2EDE1', suave:'#9FC6AC', ad:'🍄 ✦ 🧚'},
  {nombre:'Julia & Franco', tipo:'Casamiento · Editorial', url:'juliayfranco/', captura:'', vivo:true,
   sub:'Nos casamos', muestra:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#1A1A1A,#0B0B0B 60%,#050505)', tinta:'#F1EDE6', suave:'#8A8782', ad:'✦ ✦ ✦'},
  {nombre:'Xiomara', tipo:'XV años · Rosa y blanco', url:'https://xiomarazalazar.netlify.app/', captura:'', vivo:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#F7E3EA,#FBF3F6 55%,#F3DCE6)', tinta:'#5A2E3E', suave:'#B9738D', ad:'✦ 💌 ✦'},
  /* Esta vive EN EL REPO (pia/nueva/), no en Netlify: por eso abre siempre
     y al toque. Las otras dos siguen afuera, así que dependen de que
     Netlify esté en pie y de que el navegador las deje incrustar; cuando no,
     queda la portada dibujada. Cuando tengamos sus archivos acá, pasan a ser
     un camino local como este y dejan de depender de nadie. */
  {nombre:'Pia', tipo:'XV años · Clásica', url:'pia/nueva/', captura:'', vivo:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#241C14,#100E0B 60%,#080706)', tinta:'#EFDCBC', suave:'#C9A063', ad:'✦ ✦ ✦'}
];
