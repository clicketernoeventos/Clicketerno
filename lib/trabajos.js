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
   fondo:'radial-gradient(120% 80% at 50% 0,#241C14,#100E0B 60%,#080706)', tinta:'#EFDCBC', suave:'#C9A063', ad:'✦ ✦ ✦'},
  /* ── las fiestas de clientes (12/11/2026) ──
     Entran con el permiso de cada familia, que el dueño confirmó ese día.
     Llevan `cuidar:true`: son tarjetas que siguen EN USO, con el alias de
     la familia y el formulario mandando a la planilla de la fiesta. La
     galería las muestra enteras pero con eso apagado (ver CUIDAR_MARCO,
     abajo), y no ofrece abrirlas en una pestaña suelta. La tarjeta no se
     toca: el invitado que entra por su link la ve como siempre. */
  {nombre:'Ámbar', tipo:'XV años · Rosa y estrellas', url:'ambar15/', captura:'', vivo:true, cuidar:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#FBDCE6,#FDF0F5 55%,#F7DCE6)', tinta:'#2A1A20', suave:'#9B3558', ad:'✦ ✦ ✦'},
  {nombre:'Facu & Maxi', tipo:'Casamiento · Monograma', url:'facuymaxi/', captura:'', vivo:true, cuidar:true,
   sub:'Nos casamos',
   fondo:'radial-gradient(120% 80% at 50% 0,#FBF7EF,#F4EDE0 60%,#EBE1CF)', tinta:'#2E2A24', suave:'#75603A', ad:'✦ ✦ ✦'},
  {nombre:'Magali', tipo:'XV años · Rosa viejo', url:'magali15/', captura:'', vivo:true, cuidar:true,
   sub:'Mis XV',
   fondo:'radial-gradient(120% 80% at 50% 0,#E7CFCE,#F2E9E3 55%,#EADBD3)', tinta:'#3D2E2B', suave:'#7B5354', ad:'✦ ✦ ✦'},
  {nombre:'Maricel', tipo:'Cumpleaños · Mis 50', url:'maricel50/', captura:'', vivo:true, cuidar:true,
   sub:'Mis 50',
   fondo:'radial-gradient(120% 80% at 50% 0,#F1DDA5,#F7F2EA 55%,#EFE6D6)', tinta:'#1B181E', suave:'#A3164B', ad:'✦ ✦ ✦'},
  {nombre:'Valentina', tipo:'Egreso · Lila', url:'valentinaegreso/', captura:'', vivo:true, cuidar:true,
   sub:'Mi egreso',
   fondo:'radial-gradient(120% 80% at 50% 0,#E6DAF5,#F6F3F8 55%,#E9E0F3)', tinta:'#3B2462', suave:'#5E3591', ad:'✦ ✦ ✦'},
  {nombre:'Lucía', tipo:'XV años · Plata', url:'lucia15/', captura:'', vivo:true, cuidar:true,
   sub:'Mis quince',
   fondo:'radial-gradient(120% 80% at 50% 0,#EEF0F3,#F5F5F6 55%,#E4E6EB)', tinta:'#3C404A', suave:'#4C5160', ad:'✦ ✦ ✦'},
  {nombre:'Mia', tipo:'XV años · Negro y oro', url:'mia15/', captura:'', vivo:true, cuidar:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#FCFAF6,#F5F1E8 60%,#EDE6D6)', tinta:'#111010', suave:'#7A5D1E', ad:'✦ ✦ ✦'},
  {nombre:'Almi', tipo:'XV años · Crema y oro', url:'almi15/', captura:'', vivo:true, cuidar:true,
   fondo:'radial-gradient(120% 80% at 50% 0,#FFFAF6,#F8EFE6 60%,#F0E3D4)', tinta:'#3A2A2F', suave:'#7A5E30', ad:'✦ ✦ ✦'}
];

/* ── cuidar una fiesta de verdad adentro de un marco ──
   Las de `cuidar:true` son tarjetas en uso. Mostrarlas tal cual es darle a
   cualquier visitante el alias de la familia y un formulario que escribe
   en la planilla de la fiesta. Como el marco es del mismo sitio, la
   galería puede entrar y apagar eso SIN tocar la tarjeta:
     · el alias, el titular y el botón de copiar no se dibujan;
     · la confirmación queda a la vista pero inerte, con un cartel;
     · y por si algo igual llega a apretar "enviar", el marco no puede
       mandarle nada a la planilla (script.google.com).
   Se repite un rato porque la tarjeta arma sus partes después de cargar,
   y en cada `load` porque adentro del marco se puede navegar. */
window.TRABAJO_DE = function(url){
  return (window.TRABAJOS || []).find(function(t){ return t.url === url; }) || null;
};
window.CUIDAR_MARCO = function(marco){
  var CSS = '#alias,#titular,#copiar,.rotulo-alias,#aliasEtiq{display:none!important}' +
    '#confirmar{position:relative;pointer-events:none!important}' +
    '#confirmar *{pointer-events:none!important}' +
    '#confirmar::before{content:"Muestra: acá la confirmación está apagada";display:block;' +
    'width:max-content;max-width:86%;margin:0 auto 18px;padding:9px 16px;border-radius:999px;' +
    'background:#14110F;color:#FFFFFF;font:600 11px/1.3 system-ui,sans-serif;' +
    'letter-spacing:.08em;text-transform:uppercase;text-align:center;position:relative;z-index:5}';
  var poner = function(){
    try{
      if (!marco.__ceActivo) return;
      var d = marco.contentDocument, w = marco.contentWindow;
      if (!d || !w || !d.head || !/^https?:/.test(w.location.protocol)) return;
      if (!d.getElementById('ce-cuidado')){
        var s = d.createElement('style'); s.id = 'ce-cuidado'; s.textContent = CSS;
        d.head.appendChild(s);
      }
      var f = d.getElementById('confirmar');
      if (f && !f.inert){ f.inert = true; f.setAttribute('inert', ''); }
      if (!w.__ceCuidado){
        w.__ceCuidado = true;
        var real = w.fetch;
        w.fetch = function(u, o){
          var dir = String(u && u.url || u);
          if (/script\.google(usercontent)?\.com/.test(dir) && o && String(o.method || '').toUpperCase() === 'POST')
            return Promise.reject(new TypeError('muestra: no se envía'));
          return real.apply(w, arguments);
        };
        if (w.navigator && w.navigator.sendBeacon)
          try{ w.navigator.sendBeacon = function(){ return false; }; }catch(e){}
      }
    }catch(e){}
  };
  marco.__ceActivo = true;
  if (marco.__ceReloj) clearInterval(marco.__ceReloj);
  var n = 0;
  marco.__ceReloj = setInterval(function(){
    poner();
    if (++n > 200 || !marco.isConnected){ clearInterval(marco.__ceReloj); marco.__ceReloj = null; }
  }, 150);
  if (!marco.__ceOye){ marco.__ceOye = true; marco.addEventListener('load', poner); }
  poner();
};
