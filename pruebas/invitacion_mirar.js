/* ═══════════════════════════════════════════════════════════════
   MIRAR UNA INVITACIÓN · node pruebas/invitacion_mirar.js <carpeta>
   Ej:  node pruebas/invitacion_mirar.js mia15

   Esto es lo que una persona NO tiene que descubrir mirando: que un
   texto no se lee, que un botón no se puede tocar con el pulgar, que
   algo se sale por el costado, o que la CSP bloqueó una fuente. Cada
   invitación se mide con esto ANTES de que la abra el cliente.

   Reusa el medidor de contraste de pruebas/contraste.js, que ya trae
   corregidas las dos trampas caras: el degradé que termina en
   transparente (se saltea la CAPA y se sigue subiendo) y lo que nace
   escondido (no se mide).

   Mide en cuatro aparatos y en las dos posiciones de la invitación:
   con el sobre cerrado y con el sobre abierto, que son dos pantallas
   distintas y la primera es la única que ve el que no toca nada.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { MEDIDOR, DESTAPAR } = require('./contraste_medidor');
const { leerPNG, masClaro, razon } = require('./png');

const CARPETA = process.argv[2];
if (!CARPETA){ console.log('uso: node pruebas/invitacion_mirar.js <carpeta>'); process.exit(2); }
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const URL  = BASE + '/' + CARPETA + '/';
const PISO = 3;      /* abajo de 3:1 no es "poco contraste": es que el texto no está */

const APARATOS = [
  { nom:'iPhone SE  320', w:320,  h:568,  tactil:true  },
  { nom:'iPhone     390', w:390,  h:844,  tactil:true  },
  { nom:'iPhone Max 430', w:430,  h:932,  tactil:true  },
  { nom:'escritorio 1280',w:1280, h:900,  tactil:false }
];

const fallas = [];
const mal  = m => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = m => console.log('  ✓ ' + m);
const es   = (c,m) => c ? bien(m) : mal(m);
const titulo = t => console.log('\n─── ' + t + ' ───');

(async () => {
  if (!fs.existsSync(path.join(__dirname,'..',CARPETA,'index.html'))){
    console.log('No existe ' + CARPETA + '/index.html'); process.exit(2);
  }
  const navegador = await chromium.launch();

  for (const ap of APARATOS){
    titulo(ap.nom);
    const ctx = await navegador.newContext({
      viewport:{width:ap.w,height:ap.h},
      hasTouch:ap.tactil, isMobile:ap.tactil,
      deviceScaleFactor:ap.tactil?3:1
    });
    const pag = await ctx.newPage();
    const errores = [], bloqueos = [];
    pag.on('pageerror', e => errores.push(String(e)));
    pag.on('console', m => {
      const t = m.text();
      /* Lo que no se pudo bajar es ruido del entorno (el proxy firma
         los certificados y el navegador rechaza las fuentes). Lo que
         NO se perdona es que la CSP bloquee algo nuestro. */
      if (/Content Security Policy/i.test(t)) bloqueos.push(t);
    });
    await pag.goto(URL, { waitUntil:'domcontentloaded' });
    await pag.waitForTimeout(400);

    /* ── 1 · el sobre cerrado: lo primero y único que se ve ── */
    const sobre = await pag.locator('#sobre').count();
    if (sobre){
      const txt = (await pag.locator('#sobre').innerText()).trim();
      es(txt.length > 3, 'el sobre dice algo (' + txt.replace(/\s+/g,' ').slice(0,42) + '…)');
      const b = await pag.locator('#abrir').boundingBox();
      es(!!b && b.height >= 44 && b.width >= 44,
         'el botón de abrir llega a 44 (' + (b?Math.round(b.width)+'x'+Math.round(b.height):'no está') + ')');
      await pag.click('#abrir');
      /* La apertura entera dura 2,6 s —el sello, la solapa, la carta
         que sale y se disuelve, y la portada que se asienta—, así que
         medir a los 1200 ms es medir la invitación a mitad de la
         transición: la portada está todavía apagada y un punto más
         grande, y lo que se informa es el encuadre de la animación y
         no el de la pieza. */
      await pag.waitForTimeout(2700);
    }

    /* ── 2 · nada se sale por el costado ──
       Se miden las CAJAS DE VERDAD, no scrollWidth. La primera
       versión comparaba `document.documentElement.scrollWidth` contra
       el ancho pedido, y esa comprobación no podía fallar nunca: el
       `overflow-x:hidden` del body —que está puesto a propósito,
       porque el abanico de la portada se desborda y se recorta—
       hace que scrollWidth devuelva el ancho de la pantalla igual.
       Medido: con un bloque de 900px metido adentro, seguía diciendo
       "320 contra 320". Una comprobación que no puede fallar no es
       una comprobación.
       Lo decorativo que se desborda a propósito no cuenta: lleva
       pointer-events:none, y los pseudo-elementos no están en el DOM.
       Y TAMPOCO cuenta UNA FOTO que un padre recorta. Una imagen
       con un `scale` de zoom adentro de un `overflow:hidden` mide
       más que la pantalla y no se sale de ningún lado: el navegador
       la corta en el borde del padre, que es para lo que está el
       `object-fit`. Es la misma exención que la marquesina de la
       página pública, que corre 1400px de texto adentro de su caja.

       LA EXENCIÓN ES SOLO PARA MEDIOS —img, svg, video, canvas— y
       no para cualquier cosa recortada, y eso no es un detalle:
       `.seccion` entera lleva `overflow:hidden`, así que perdonar
       todo lo recortado perdonaría la invitación completa. Medido:
       con la exención ancha, un bloque de 900px metido adentro de
       una sección NO se informaba. Una prueba que no puede fallar
       no es una prueba. El padre que recorta tiene que entrar ÉL en
       la pantalla, si no se estaría perdonando un desborde de
       verdad escondido detrás de otro. */
    const salidos = await pag.evaluate((W) => {
      const MEDIO = /^(IMG|SVG|VIDEO|CANVAS|PICTURE)$/;
      const recortado = (n) => {
        if (!MEDIO.test(n.tagName)) return false;
        for (let q = n.parentElement; q && q !== document.body; q = q.parentElement){
          const c = getComputedStyle(q);
          if (!/hidden|clip/.test(c.overflowX)) continue;
          const b = q.getBoundingClientRect();
          if (b.left >= -1 && b.right <= W + 1) return true;
        }
        return false;
      };
      const out = [];
      for (const n of document.querySelectorAll('body *')){
        const cs = getComputedStyle(n);
        if (cs.display==='none' || cs.visibility==='hidden') continue;
        if (cs.pointerEvents === 'none') continue;
        const r = n.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if ((r.right > W + 1 || r.left < -1) && recortado(n)) continue;
        if (r.right > W + 1 || r.left < -1)
          out.push((n.id ? '#'+n.id : n.tagName.toLowerCase() +
                   (n.className && typeof n.className === 'string' ? '.'+n.className.trim().split(/\s+/)[0] : '')) +
                   ' → ' + Math.round(r.left) + '…' + Math.round(r.right));
      }
      return out;
    }, ap.w);
    es(salidos.length === 0, salidos.length ? 'se salen por el costado: ' + salidos.slice(0,3).join(' · ')
                                            : 'nada se sale por el costado');

    /* ── 3 · todo lo que se toca llega a 44x44 ── */
    if (ap.tactil){
      const chicos = await pag.evaluate(() => {
        const sel = 'a[href],button,input,select,textarea,[role="button"]';
        const malos = [];
        for (const n of document.querySelectorAll(sel)){
          const cs = getComputedStyle(n);
          if (cs.display==='none' || cs.visibility==='hidden') continue;
          const r = n.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;      // no está: no se mide
          /* Un radio escondido detrás de su label no es el blanco:
             el blanco es el label, y ese se mide aparte. */
          if (n.type === 'radio' && r.width <= 2) continue;
          if (r.width < 44 || r.height < 44)
            malos.push((n.id ? '#'+n.id : n.tagName.toLowerCase()) +
                       ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
        return malos;
      });
      es(chicos.length === 0, chicos.length ? 'no llegan a 44: ' + chicos.join(', ')
                                            : 'todo lo que se toca llega a 44x44');
    }

    /* ── 3bis · y además SE PUEDE TOCAR ──
       Que un botón mida 56x56 y se vea perfecto no quiere decir que
       responda. Se le pregunta al navegador QUIÉN atajaría el dedo en
       el centro del control (`elementFromPoint`): si no es él ni algo
       suyo, está tapado.
       No es un caso inventado. En almi15 los bloques se revelan con un
       `clip-path` que arranca recortado a cero, y un recorte a cero se
       lleva puestos los CLICS: el formulario entero estaba dibujado y
       no se podía tocar ni el "Sí" ni el botón de confirmar. No había
       un solo error en la consola; lo único que pasaba era que la
       pantalla no contestaba. Sin esta comprobación, lo que se ve es
       una prueba COLGADA treinta segundos contra un botón que está
       perfecto, y eso no dice qué pasó.
       Se pregunta donde está y, si parece tapado, se lo trae al medio y
       se vuelve a preguntar: en una pantalla corta lo de abajo arranca
       fuera de la vista y se destapa scrolleando. Mejor callar que
       inventar una falla. */
    /* Antes de preguntar hay que DEJAR QUE LA PÁGINA SE ABRA. Lo que
       aparece al bajar lo destapa un IntersectionObserver, y el
       observador avisa en OTRA vuelta del reloj: midiendo en la misma
       vuelta en que se scrollea, todo sigue recortado y la comprobación
       informa la invitación entera. Se recorre primero, se espera a que
       terminen las transiciones, y recién después se mide. */
    for (let i = 0; i < 16; i++){
      await pag.evaluate(() => scrollBy({top: innerHeight * 0.8, behavior:'instant'}));
      await pag.waitForTimeout(110);
    }
    await pag.waitForTimeout(900);
    const tapados = await pag.evaluate(() => {
      const V = {w:innerWidth, h:innerHeight};
      const nombre = n => (n.id ? '#'+n.id : n.tagName.toLowerCase() +
        (n.className && typeof n.className === 'string' && n.className.trim()
          ? '.'+n.className.trim().split(/\s+/)[0] : ''));
      const malos = [];
      for (const n of document.querySelectorAll('a[href],button,input,select,textarea,[role="button"]')){
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        /* Lo de adentro de un `<details>` cerrado NO ESTÁ en la
           pantalla, pero en Chrome tiene caja igual: el navegador lo
           esconde con `content-visibility`, no con `display:none`, para
           que el buscador de la página lo encuentre. Medido: el correo
           del aviso de datos devolvía una caja de 181x50 en una posición
           que no existe, y la comprobación informaba un botón tapado que
           nadie ve. Es la regla de la caja de 0x0 otra vez: antes de
           medir algo, comprobar que ESTÉ. */
        if (n.closest('details:not([open])')) continue;
        if (n.checkVisibility && !n.checkVisibility({contentVisibilityAuto:true,
            opacityProperty:true, visibilityProperty:true})) continue;
        /* Lo que está escondido a propósito —el radio de 1x1 detrás de
           su label— no se mide: el blanco es el label. */
        const b0 = n.getBoundingClientRect();
        if (b0.width < 3 || b0.height < 3) continue;
        /* Que conteste un PADRE del control no es "está bien, es suyo":
           quiere decir que en el centro del control el navegador NO
           encontró al control. Eso es exactamente lo que pasa con un
           recorte a cero, y era lo que dejaba pasar la primera versión
           de esta comprobación —`encima.contains(n)` lo perdonaba— así
           que medía y daba verde con el formulario muerto.
           Lo único que se perdona es que el propio control se declare
           decoración (`pointer-events:none`), y que conteste un HIJO
           suyo, que es el caso del ícono adentro del botón. */
        const quienEn = (caja) => {
          const x = Math.min(Math.max(caja.left + caja.width/2, 1), V.w-1);
          const y = Math.min(Math.max(caja.top + caja.height/2, 1), V.h-1);
          const encima = document.elementFromPoint(x, y);
          if (!encima || encima === n || n.contains(encima)) return null;
          if (cs.pointerEvents === 'none') return null;
          const c = encima.getBoundingClientRect();
          if (c.width >= V.w-2 && c.height >= V.h-2 && !encima.contains(n)) return null;  /* es el fondo */
          return encima;
        };
        /* SE PREGUNTA DONDE EL DEDO LO VA A TOCAR, o sea con el control
           traído al medio de la pantalla — que es lo que hace una
           persona. Preguntar donde quedó al cargar no mide nada: lo que
           está abajo del pliegue tiene su centro fuera de la ventana, el
           punto se recorta contra el borde y contesta la portada, que
           ocupa la pantalla entera y se descarta por fondo. Verde sin
           haber medido.
           Y `behavior:'instant'`: estas páginas llevan
           `scroll-behavior:smooth`, así que un scrollIntoView pelado
           ANIMA y no llega a destino antes de la pregunta. */
        n.scrollIntoView({block:'center', behavior:'instant'});
        let quien = quienEn(n.getBoundingClientRect());
        /* Un enlace de texto que envuelve a dos renglones tiene el
           centro de su CAJA en el aire, entre los dos: ahí contesta el
           párrafo y no es una falla. El segundo intento va sobre el
           primer renglón de verdad (`getClientRects`). */
        if (quien){
          const r1 = n.getClientRects()[0], rb = n.getBoundingClientRect();
          if (r1 && (Math.abs(r1.width - rb.width) > 1 || Math.abs(r1.height - rb.height) > 1))
            quien = quienEn(r1);
        }
        if (quien) malos.push(nombre(n) + ' lo tapa ' + nombre(quien));
      }
      return malos;
    });
    es(tapados.length === 0, tapados.length
      ? 'se ven pero no se pueden tocar: ' + tapados.slice(0,3).join(' · ')
      : 'y nada de lo que se toca está tapado por otra cosa');

    /* ── 4 · todo el texto se LEE ──
       Antes de medir hay que DESTAPAR: lo que aparece al bajar nace
       en opacidad 0 y el medidor saltea lo que no se ve. Sin esto se
       miden los seis textos de la portada y el resto de la
       invitación no se mide nunca. */
    await pag.addStyleTag({content:DESTAPAR});
    await pag.waitForTimeout(300);
    const textos = await pag.evaluate(MEDIDOR);
    const flojos = textos.filter(t => t.r !== null && t.r < PISO);
    es(flojos.length === 0,
       flojos.length ? flojos.length + ' textos abajo de ' + PISO + ':1 → ' +
                       flojos.slice(0,4).map(f=>f.r.toFixed(2)+':1 "'+f.txt.slice(0,26)+'"').join(' · ')
                     : textos.length + ' textos medidos, ninguno abajo de ' + PISO + ':1');
    if (textos.length){
      const peor = textos.filter(t=>t.r!==null).sort((a,b)=>a.r-b.r)[0];
      if (peor) console.log('      · el más flojo: ' + peor.r.toFixed(2) + ':1  "' + peor.txt.slice(0,40) + '"');
    }

    /* ── 5 · el texto que cae SOBRE LA FOTO de la portada ──
       El medidor de arriba no puede medir esto y no avisa: sube por
       el árbol buscando el primer fondo opaco, y en una portada a
       sangre ese fondo es el `background-color` del contenedor, no
       la foto. Da un número perfecto —crema sobre tinta— y el texto
       puede estar cayendo sobre una pared blanca.

       Se mide con el píxel, que es lo único que no miente: se
       esconden los HIJOS de la portada (no la portada, que se
       llevaría puesto el velo —su ::before y su ::after— que es
       justamente lo que hace que el texto se lea), se saca una
       captura y se busca el píxel MÁS CLARO debajo de cada renglón.
       El más claro y no el promedio: el promedio esconde justo el
       reflejo que se come la letra. */
    /* Y PRIMERO VOLVER ARRIBA. La comprobación de más arriba recorre
       la invitación entera para que el observador destape, así que al
       llegar acá la pantalla está en el pie: la portada queda fuera de
       la vista, todos sus renglones se descartan por `top > innerHeight`
       y la medición informaba "0 renglones sobre la foto" — verde sin
       haber mirado un solo píxel. Es la caja de 0x0 otra vez, con el
       scroll en el medio: lo agarró almi15, la primera invitación
       publicada con foto en la portada. */
    await pag.evaluate(() => scrollTo({top:0, behavior:'instant'}));
    await pag.waitForTimeout(260);
    const conFoto = await pag.evaluate(() => {
      const port = document.querySelector('#portada, header');
      return !!(port && port.querySelector('img'));
    });
    if (conFoto){
      const renglones = await pag.evaluate(() => {
        const port = document.querySelector('#portada, header');
        const out = [];
        for (const n of port.querySelectorAll('*')){
          if (n.closest('img') || n.tagName === 'IMG' || n.tagName === 'SVG') continue;
          const propio = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
          if (!propio) continue;
          const cs = getComputedStyle(n);
          if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          /* La decoración no se juzga, con la definición estricta:
             aria-hidden Y pointer-events:none, las dos juntas. */
          if (n.getAttribute('aria-hidden') === 'true' && cs.pointerEvents === 'none') continue;
          const r = n.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          if (r.bottom < 0 || r.top > innerHeight) continue;
          out.push({ txt:(n.textContent||'').trim().replace(/\s+/g,' ').slice(0,28), color:cs.color,
                     x:r.left, y:r.top, w:r.width, h:r.height });
        }
        return out;
      });
      const dpr = await pag.evaluate(() => devicePixelRatio || 1);
      await pag.evaluate(() => {
        const port = document.querySelector('#portada, header');
        port.__guardado = [];
        for (const n of port.children){
          if (n.querySelector && n.querySelector('img')) continue;
          if (n.tagName === 'IMG') continue;
          port.__guardado.push([n, n.style.visibility]);
          n.style.visibility = 'hidden';
        }
      });
      await pag.waitForTimeout(150);
      const img = leerPNG(await pag.screenshot());
      await pag.evaluate(() => {
        const port = document.querySelector('#portada, header');
        (port.__guardado||[]).forEach(([n,v]) => n.style.visibility = v);
      });
      const malos = [];
      let peorFoto = null;
      for (const t of renglones){
        const fondo = masClaro(img, t.x*dpr, t.y*dpr, t.w*dpr, t.h*dpr);
        if (!fondo) continue;
        const tinta = (t.color.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
        if (tinta.length < 3) continue;
        const r = razon(tinta, fondo);
        if (!peorFoto || r < peorFoto.r) peorFoto = { r, txt:t.txt };
        if (r < PISO) malos.push(r.toFixed(2) + ':1 "' + t.txt + '"');
      }
      es(malos.length === 0,
         malos.length ? 'sobre la foto no se leen: ' + malos.slice(0,4).join(' · ')
                      : renglones.length + ' renglones sobre la foto, el peor ' +
                        (peorFoto ? peorFoto.r.toFixed(2) + ':1 "' + peorFoto.txt + '"' : '—'));
    }

    /* ── 5b · el texto que cae SOBRE UN FONDO DIBUJADO ──
       El medidor compartido NO juzga lo que cae sobre una imagen de
       fondo: sube hasta el primer `background-color` opaco y, si ese
       mismo elemento trae además un `url(...)`, el número que informa
       es el del color y no el del dibujo. O sea que **una sección
       empapelada es un punto ciego de la suite**, y da verde mire lo
       que mire. Pasó apenas se puso un empapelado de verdad: con el
       texto del formulario cayendo sobre un rosa fuerte —1,5:1— la
       suite seguía diciendo "sin fallas".

       Se mide con el píxel, igual que el texto sobre la foto de la
       portada. Y sólo donde hace falta: un renglón que tenga ENTRE
       él y la sección un ancestro con fondo opaco propio ya lo midió
       bien el medidor compartido, así que acá se saltea. Lo que queda
       es exactamente lo que se apoya sobre el dibujo. */
    {
      const lineas = await pag.evaluate(() => {
        const opaco = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return false;
          const q = m[1].split(',').map(parseFloat); return q.length < 4 || q[3] >= .999; };
        /* Un fondo DIBUJADO es una imagen (`url(...)`) o el papel a
           rayas (`repeating-…-gradient`): los dos pintan encima del
           `background-color` que es lo único que mira el medidor
           compartido, así que los dos son puntos ciegos. La raya rosa
           cuesta un punto de contraste contra el papel —medido— y hoy
           no esconde nada; el agujero es el mismo y se cierra igual.
           Un degradé liso NO entra: ése el medidor compartido lo sabe
           atravesar cuando tiene una parada transparente, y cuando es
           opaco de punta a punta ya está escrito que no se juzga. */
        const fondos = [...document.querySelectorAll('section,div,main,header,footer')]
          .filter(e => /url\(|repeating-[a-z]*-?gradient/.test(getComputedStyle(e).backgroundImage));
        const out = [];
        for (const sec of fondos){
          for (const n of sec.querySelectorAll('*')){
            const propio = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
            if (!propio) continue;
            const cs = getComputedStyle(n);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            /* Lo de adentro de un `<details>` cerrado NO ESTÁ dibujado,
               pero en Chrome tiene caja igual —lo esconde con
               `content-visibility`, no con `display:none`—. Medido: con
               la tarjeta del formulario translúcida, los cuatro
               renglones del aviso de datos se informaban a 1,13:1 en los
               cuatro aparatos, y su color de verdad (#E8CBD6) se lee
               perfecto. Se estaba comparando el color de un texto que no
               se pinta contra el píxel de lo que haya abajo. Es la misma
               trampa que ya costó una vuelta en la comprobación de los
               controles tapados. */
            if (n.closest('details:not([open])')) continue;
            if (n.checkVisibility && !n.checkVisibility({contentVisibilityAuto:true,
                opacityProperty:true, visibilityProperty:true})) continue;
            if (n.getAttribute('aria-hidden') === 'true' && cs.pointerEvents === 'none') continue;
            if (opaco(cs.backgroundColor)) continue;      /* trae su propio fondo */
            let tapa = false;
            for (let a = n.parentElement; a && a !== sec; a = a.parentElement)
              if (opaco(getComputedStyle(a).backgroundColor)) { tapa = true; break; }
            if (tapa) continue;                            /* ya lo midió el otro */
            const r = n.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            n.dataset.ceMide = String(out.length);
            out.push({ txt:(n.textContent||'').trim().replace(/\s+/g,' ').slice(0,26),
                       color:cs.color });
          }
        }
        return out;
      });
      if (!lineas.length) bien('ningún texto se apoya directo sobre un fondo dibujado');
      else {
        const dpr = await pag.evaluate(() => devicePixelRatio || 1);
        /* Se esconden TODAS de una: `visibility:hidden` no mueve la
           maqueta, así que las cajas siguen valiendo. */
        await pag.evaluate(() => document.querySelectorAll('[data-ce-mide]')
          .forEach(n => { n.dataset.ceVis = n.style.visibility; n.style.visibility = 'hidden'; }));
        const malos = []; let peor = null;
        /* UNA captura por PANTALLA, no una por renglón. La primera
           versión sacaba una captura por renglón y cortaba en 24 para
           no tardar una eternidad — y los 24 primeros caían todos en
           las secciones de arriba, así que el formulario, que es el
           que estaba en riesgo, no se medía NUNCA. Verificado
           rompiéndolo: con el texto sobre el rosa, daba verde. */
        const vistos = new Set();
        const alto = await pag.evaluate(() => innerHeight);
        const largo = await pag.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < largo + alto && vistos.size < lineas.length; y += Math.round(alto * .85)){
          await pag.evaluate(y => scrollTo({top:y, behavior:'instant'}), y);
          await pag.waitForTimeout(90);
          const aqui = await pag.evaluate(() => {
            const out = [];
            document.querySelectorAll('[data-ce-mide]').forEach(n => {
              const r = n.getBoundingClientRect();
              if (r.width < 2 || r.height < 2) return;
              if (r.top < 0 || r.bottom > innerHeight) return;
              out.push({ i:+n.dataset.ceMide, x:r.left, y:r.top, w:r.width, h:r.height });
            });
            return out;
          });
          const nuevos = aqui.filter(t => !vistos.has(t.i));
          if (!nuevos.length) continue;
          const png = leerPNG(await pag.screenshot());
          for (const t of nuevos){
            vistos.add(t.i);
            const fondo = masClaro(png, t.x * dpr, t.y * dpr, t.w * dpr, t.h * dpr);
            if (!fondo) continue;
            const tinta = (lineas[t.i].color.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
            if (tinta.length < 3) continue;
            const rz = razon(tinta, fondo);
            if (!peor || rz < peor.r) peor = { r:rz, txt:lineas[t.i].txt };
            if (rz < PISO) malos.push(rz.toFixed(2) + ':1 "' + lineas[t.i].txt + '"');
          }
        }
        await pag.evaluate(() => document.querySelectorAll('[data-ce-mide]')
          .forEach(n => { n.style.visibility = n.dataset.ceVis || ''; }));
        es(malos.length === 0,
           malos.length ? 'sobre el fondo dibujado no se leen: ' + malos.slice(0,4).join(' · ')
                        : lineas.length + ' renglones sobre un fondo dibujado, el peor ' +
                          (peor ? peor.r.toFixed(2) + ':1 "' + peor.txt + '"' : '—'));
      }
    }

    /* ── 6 · un borde de letra que no se ve ──
       `-webkit-text-stroke-width` en `em` se resuelve contra el
       font-size DEL ELEMENTO, y el tamaño de un número gigante
       suele vivir en el `span` de adentro y no en el `h1`: puesto
       en el padre sale un hilo de 0,8px en una letra de 140 y
       parece que el borde no se hubiera puesto. No tira ningún
       error y en una captura chica tampoco se nota.
       Y sin `paint-order:stroke` el trazo va CENTRADO sobre el
       contorno y se le come la mitad a la letra para adentro.
       Las dos cosas se miden acá, y solo donde hay borde: la
       invitación que no usa ninguno no informa nada. */
    const bordes = await pag.evaluate(() => {
      const malos = [];
      for (const n of document.querySelectorAll('*')){
        const cs = getComputedStyle(n);
        const w = parseFloat(cs.webkitTextStrokeWidth) || 0;
        if (!w) continue;
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const propio = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
        if (!propio) continue;
        const txt = (n.textContent||'').trim().replace(/\s+/g,' ').slice(0,18);
        if (w < 0.8) malos.push('"' + txt + '" ' + w.toFixed(2) + 'px de borde en una letra de ' + cs.fontSize);
        else if (!/stroke/.test(cs.paintOrder)) malos.push('"' + txt + '" sin paint-order:stroke');
      }
      return malos;
    });
    if (bordes.length || await pag.evaluate(() => CSS.supports('paint-order','stroke') &&
          [...document.querySelectorAll('*')].some(n => parseFloat(getComputedStyle(n).webkitTextStrokeWidth) > 0)))
      es(bordes.length === 0, bordes.length ? 'bordes de letra que no se ven: ' + bordes.slice(0,3).join(' · ')
                                            : 'los bordes de letra se ven y van detrás del relleno');

    /* ── 7 · la consola ── */
    es(errores.length === 0, errores.length ? 'errores de JavaScript: ' + errores[0] : 'sin errores de JavaScript');
    es(bloqueos.length === 0, bloqueos.length ? 'la CSP bloqueó algo: ' + bloqueos[0].slice(0,90) : 'la CSP no bloqueó nada');

    await ctx.close();
  }

  /* ── 6 · lo que se promete y tiene que estar ── */
  titulo('las piezas');
  const ctx = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const pag = await ctx.newPage();
  /* ══ LA PRUEBA NO ESCRIBE EN LA PLANILLA DE UN CLIENTE ══
     Acá abajo se completa la confirmación y se toca Confirmar. Con
     el `CONFIG.endpoint` puesto, eso es un POST al Apps Script DE
     VERDAD: cada corrida le metería un "Juan Pérez" inventado en la
     planilla de la clienta, y lo vería cuando cuenta los invitados
     para las mesas. Es la misma regla que ya está escrita para la
     demostración —lo que escribe en producción no es una prueba—,
     que acá no estaba porque hasta hoy ninguna invitación tenía
     planilla.
     No se BLOQUEA y listo: se contesta como contestaría el Apps
     Script, así el recorrido se mide entero. El `?confirmado=` dice
     que no hasta que llega el POST, y que sí después — que es
     exactamente lo que hace la planilla. */
  let seMando = false, loQueViajo = '', urlesGoogle = [];
  await pag.route('**/script.google.com/**', r => {
    urlesGoogle.push(r.request().url());
    if (r.request().method() === 'POST'){
      seMando = true;
      loQueViajo = r.request().postData() || '';
      return r.fulfill({status:200, body:'{"ok":true}'});
    }
    return r.fulfill({status:200, contentType:'application/json',
                      body: JSON.stringify({ ok: seMando })});
  });
  await pag.goto(URL, {waitUntil:'domcontentloaded'});
  if (await pag.locator('#abrir').count()){ await pag.click('#abrir'); await pag.waitForTimeout(2700); }

  const cuenta = await pag.locator('#cD').count();
  if (cuenta){
    const antes = await pag.locator('#cS').innerText();
    await pag.waitForTimeout(1600);
    const despues = await pag.locator('#cS').innerText();
    es(antes !== despues, 'la cuenta regresiva corre (' + antes + ' → ' + despues + ')');
    const dias = await pag.locator('#cD').innerText();
    es(/^\d+$/.test(dias) && +dias > 0, 'y cuenta días de verdad (' + dias + ')');
  }

  /* NINGÚN TEXTO SE SALE DE SU CAJA.
     Pasó con la cuenta regresiva: los días en tres dígitos no
     entraban en su casilla y las cifras pintaban ENCIMA del dos
     puntos de al lado — "469" y "04" se leían como 46904.
     Y no lo agarraba nada: las cajas no se superponen (eso lo
     comprobé y daba verde con el bug puesto), nada se sale de la
     pantalla, y el contraste de cada pieza es perfecto. Lo que se
     desborda es la TINTA, no la caja, y eso se mide con
     scrollWidth contra clientWidth. */
  const derramados = await pag.evaluate(() => {
    const malos = [];
    for (const n of document.querySelectorAll('body *')){
      const propio = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      if (!propio) continue;
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (cs.overflowX !== 'visible') continue;        /* recortar a propósito no es derramar */
      if (cs.writingMode !== 'horizontal-tb') continue; /* el renglón vertical se mide al revés */
      if (n.scrollWidth > n.clientWidth + 1)
        malos.push('"' + n.textContent.trim().slice(0,14) + '" ' +
                   n.scrollWidth + ' en ' + n.clientWidth);
    }
    return malos;
  });
  es(derramados.length === 0, derramados.length
    ? 'texto que se sale de su caja: ' + derramados.slice(0,3).join(' · ')
    : 'ningún texto se sale de su caja');

  const cal = await pag.locator('#calendario .elDia').count();
  if (await pag.locator('#calendario').count())
    es(cal === 1, 'el calendario marca un solo día (marcó ' + cal + ')');

  /* ── las fotos se quedan atrás al deslizar ──
     El paralaje es el único efecto de la pieza que no pasa una sola
     vez, y si se rompe no tira ningún error: la foto simplemente deja
     de moverse y nadie se entera. Se mide lo que de verdad importa —
     que la foto esté CORRIDA distinto en dos puntos del scroll—, no
     que exista una clase ni un oyente: así da igual cómo esté hecho. */
  if (await pag.locator('.franja img').count()){
    const donde = await pag.evaluate(() => {
      const f = document.querySelector('.franja');
      return f.getBoundingClientRect().top + scrollY;
    });
    const correr = async y => {
      await pag.evaluate(v => scrollTo({top:Math.max(0,v), behavior:'instant'}), y);
      await pag.waitForTimeout(260);
      return pag.evaluate(() => new DOMMatrixReadOnly(
        getComputedStyle(document.querySelector('.franja img')).transform).f);
    };
    const antes = await correr(donde - 650), luego = await correr(donde + 350);
    const mueve = Math.abs(luego - antes);
    es(mueve > 12, mueve > 12
      ? 'la foto se queda atrás al deslizar (' + antes.toFixed(0) + ' → ' + luego.toFixed(0) + ' px)'
      : 'la foto NO se mueve al deslizar: el paralaje no está andando');
    await pag.evaluate(() => scrollTo({top:0, behavior:'instant'}));
    await pag.waitForTimeout(200);
  }
  else bien('esta invitación no tiene franjas de foto');

  /* El mapa no puede quedar en "#": un botón que se ve igual y no
     lleva a ningún lado no da ningún error. */
  const mapas = await pag.evaluate(() =>
    [...document.querySelectorAll('a[target="_blank"]')].map(a => ({href:a.getAttribute('href'), rel:a.getAttribute('rel')||''})));
  es(mapas.every(m => m.href && m.href !== '#'), 'ningún enlace externo quedó vacío');
  es(mapas.every(m => /noopener/.test(m.rel)), 'todo lo que abre en otra pestaña lleva rel=noopener');

  /* La confirmación no puede decir "listo" si no se mandó nada. */
  let CONF_RSVP = null;
  if (await pag.locator('#rsvp').count()){
    await pag.fill('#fNombre', 'Prueba Apellido');

    /* Si hay sí/no, NADA puede venir preseleccionado: el que toca
       Confirmar sin leer mandaría un "sí" que no quiso decir, y eso
       se paga en comida encargada para gente que no va. */
    const radios = await pag.locator('input[name="Confirma"]').count();
    if (radios){
      es(await pag.locator('input[name="Confirma"]:checked').count() === 0,
         'no viene elegido ni el sí ni el no');
      await pag.click('#enviar');
      await pag.waitForTimeout(400);
      const sinElegir = (await pag.locator('#aviso').innerText()).toLowerCase();
      es(/dec|eleg|venís|venis/.test(sinElegir), 'y sin elegir no deja mandar');
      await pag.locator('.radios label').first().click();
    }

    await pag.click('#enviar');
    await pag.waitForTimeout(600);
    const av = (await pag.locator('#aviso').innerText()).toLowerCase();
    es(av.length > 0, 'la confirmación contesta algo');
    const conf = await pag.evaluate(() => ({
      endpoint: (typeof CONFIG !== 'undefined' && CONFIG.endpoint) || '',
      evento:   (typeof CONFIG !== 'undefined' && CONFIG.evento) || '',
      /* La dirección de la planilla CENTRAL, la que comparten todas.
         Hace falta para saber cuál de las dos está usando: si la
         suya, `evento` no va; si la central, sin `evento` no entra en
         ninguna pestaña. Preguntado por la dirección y no por si
         `evento` está puesto — si no, vaciarlo se leía como "tiene
         planilla propia" y la prueba daba verde con la confirmación
         muerta. Pasó, y por eso está escrito así. */
      central:  (typeof PLANILLA !== 'undefined' && PLANILLA.exec) || ''
    }));
    if (!conf.endpoint)
      es(/muestra|no se manda|no se mand/.test(av),
         'sin planilla puesta, DICE que no se mandó a ningún lado (no miente con un "listo")');
    else {
      /* Con planilla puesta, el camino bueno: la planilla contestó que
         entró, así que la pantalla tiene que decirlo. Nunca se medía —
         hasta ahora todas las invitaciones nuevas estaban sin planilla,
         así que esta mitad vivía sin una sola comprobación. */
      es(seMando, 'con planilla puesta, la confirmación SE MANDA');
      es(/listo|gracias|nos vemos/.test(av),
         'y cuando la planilla dice que entró, la pantalla lo dice (no se queda en "mandando")');

      /* Y tiene que decir a QUÉ fiesta va. Con la planilla central, una
         confirmación sin eso no entra en ninguna pestaña: la planilla
         la rechaza y el invitado ve "no pudimos confirmar" teniendo
         todo bien. Es lo primero que se olvida al copiar una
         invitación para un cliente nuevo. */
      const usaCentral = !!conf.central && conf.endpoint === conf.central;
      if (usaCentral){
        es(!!conf.evento,
           conf.evento
             ? `usa la planilla central y dice de qué fiesta es ("${conf.evento}")`
             : 'usa la planilla CENTRAL y no dice de qué fiesta es: no va a entrar en ninguna pestaña');
        if (conf.evento)
          es(loQueViajo.indexOf('name="evento"') !== -1 && loQueViajo.indexOf(conf.evento) !== -1,
             `y el POST lo lleva adentro: "${conf.evento}"`);
      }
      else bien('esta invitación tiene su propia planilla, no la central');
      es(urlesGoogle.length === 1,
         'y entró en UN solo viaje a la planilla, no en tres');
      CONF_RSVP = conf;
    }
  }
  await ctx.close();

  /* ── el camino del TELÉFONO: cuando no se puede leer la respuesta ──
     En algunos navegadores el POST entra pero la respuesta no se
     puede leer, así que la invitación lo manda a ciegas y después
     PREGUNTA si llegó. Ese camino no se recorre en el flujo rápido
     —ahí alcanza con un viaje— o sea que vivía sin medirse, y es
     justamente el que corre en un iPhone.
     Lo que no puede faltar ahí es decir de QUÉ fiesta se pregunta:
     con la planilla central, una pregunta sin eso contestaría por
     otra fiesta, y al invitado le diría que no llegó teniendo la
     confirmación guardada. */
  if (CONF_RSVP && CONF_RSVP.endpoint && CONF_RSVP.evento &&
      CONF_RSVP.endpoint === CONF_RSVP.central){
    titulo('el camino del teléfono: mandar a ciegas y preguntar');
    const ctxF = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pagF = await ctxF.newPage();
    let posts = 0; const preguntas = [];
    await pagF.route('**/script.google.com/**', r => {
      if (r.request().method() === 'POST'){
        posts++;
        /* El primero revienta, como cuando el navegador no deja leer
           la respuesta. El segundo —el de a ciegas— entra. */
        if (posts === 1) return r.abort();
        return r.fulfill({status:200, body:'{"ok":true}'});
      }
      preguntas.push(r.request().url());
      return r.fulfill({status:200, contentType:'application/json',
                        body: JSON.stringify({ ok: posts > 1 })});
    });
    await pagF.goto(URL, {waitUntil:'domcontentloaded'});
    if (await pagF.locator('#abrir').count()){ await pagF.click('#abrir'); await pagF.waitForTimeout(2700); }
    await pagF.fill('#fNombre', 'Prueba Apellido');
    if (await pagF.locator('.radios label').count()) await pagF.locator('.radios label').first().click();
    await pagF.click('#enviar');
    await pagF.waitForTimeout(3500);

    es(posts >= 2, 'si no se puede leer la respuesta, se manda igual a ciegas');
    es(preguntas.length > 0, 'y después PREGUNTA si llegó');
    es(preguntas.every(u => u.indexOf('evento=' + CONF_RSVP.evento) !== -1),
       `y pregunta por SU fiesta: lleva "evento=${CONF_RSVP.evento}"`);
    const avF = (await pagF.locator('#aviso').innerText()).toLowerCase();
    es(/listo|gracias|nos vemos/.test(avF),
       'y al saber que entró, lo dice');
    await ctxF.close();
  }

  /* ── 7 · una foto que no está ──
     No es un caso inventado. El día que se saca una foto de una
     invitación ya publicada, el que la tenía abierta sigue corriendo
     el HTML viejo un rato contra el servidor nuevo y le pide un
     archivo que ese deploy borró. Pasó con mia15: dos cuadrados
     grises con un `?`, uno en la portada y otro adentro del marco
     dorado. No tira NINGÚN error de JavaScript y la suite daba
     verde: una imagen rota es un dibujo, no una excepción. */
  titulo('una foto que no carga');
  {
    /* Cuántas fotos declara esta invitación, para saber contra qué
       comparar. Sin fotos no hay nada que medir. */
    const ctxL = await navegador.newContext({viewport:{width:390,height:844}});
    const pagL = await ctxL.newPage();
    await pagL.goto(URL, {waitUntil:'domcontentloaded'});
    /* `CONFIG` es un `const` de script: NO cuelga de `window`, así que
       preguntando por `window.CONFIG` da 0 y la prueba se saltea sola
       informando "no tiene fotos" — verde midiendo la nada. */
    /* Dos formas de tener fotos y las dos cuentan: el PASE
       (`CONFIG.fotos`, mia15) y las FRANJAS a todo lo ancho
       (`CONFIG.franjas`, almi15). Contando solo la primera, una
       invitación con franjas se salteaba sola informando "no tiene
       fotos" — verde midiendo la nada. */
    const cuantas = await pagL.evaluate(() => {
      if (typeof CONFIG === 'undefined') return 0;
      return (CONFIG.fotos || []).length + Object.keys(CONFIG.franjas || {}).length;
    });
    const franjas = await pagL.evaluate(
      () => typeof CONFIG === 'undefined' ? [] : Object.keys(CONFIG.franjas || {}));
    await ctxL.close();

    if (!cuantas) bien('esta invitación no tiene fotos: nada que medir');
    else {
      /* a · se cae UNA: se va ella y se va su puntito */
      const ctx1 = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
      const pag1 = await ctx1.newPage();
      let primera = null;
      await pag1.route('**/*', r => {
        const u = r.request().url();
        if (r.request().resourceType() === 'image' && /\/fotos\//.test(u)){
          if (!primera) primera = u;
          if (u === primera) return r.fulfill({status:404, body:''});
        }
        return r.continue();
      });
      await pag1.goto(URL, {waitUntil:'domcontentloaded'});
      if (await pag1.locator('#abrir').count()){ await pag1.click('#abrir'); await pag1.waitForTimeout(2700); }
      await pag1.waitForTimeout(1200);
      const g = await pag1.evaluate(() => {
        const sec = document.querySelector('#galeria');
        const imgs = [...document.querySelectorAll('#fotos img')];
        return { hay: !!sec, escondida: !!(sec && sec.hidden),
                 rotas: imgs.filter(im => im.complete && !im.naturalWidth).length,
                 fotos: imgs.length,
                 puntos: document.querySelectorAll('#fotos .pase-puntos button').length };
      });
      if (!g.hay) bien('esta invitación no tiene galería');
      else {
        es(g.rotas === 0, g.rotas
          ? `quedó ${g.rotas} cuadrado(s) roto(s) dibujado(s) en el pase`
          : 'la foto que no cargó se va, no deja el cuadrado roto');
        if (cuantas > 1)
          es(g.fotos === cuantas - 1,
             g.fotos === cuantas - 1 ? `quedan las otras ${g.fotos}`
                                     : `quedaron ${g.fotos} fotos de las ${cuantas - 1} que tenían que quedar`);
        /* Los puntitos se miden SOLO si esta galería tiene puntitos.
           Lo que hay que agarrar es un punto que no lleva a ninguna
           foto —el pase de mia15—, no que una galería esté hecha con
           pase: `facuymaxi` las muestra en grilla, sin puntos, y
           exigírselos sería inventar una falla. */
        if (!g.puntos) bien('esta galería no tiene puntitos: no hay ninguno que lleve a la nada');
        else es(g.puntos === g.fotos,
           g.puntos === g.fotos ? `y los puntitos son ${g.fotos}, uno por foto que existe`
                                : `hay ${g.puntos} puntitos para ${g.fotos} foto(s): alguno no lleva a ninguna`);
      }
      await ctx1.close();

      /* b · se caen TODAS: la sección entera se esconde, que es lo
             mismo que hace `CONFIG.fotos` vacío. Un marco dorado
             alrededor de nada es peor que no estar. */
      const ctx2 = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
      const pag2 = await ctx2.newPage();
      await pag2.route('**/*', r => (r.request().resourceType() === 'image' && /\/fotos\//.test(r.request().url()))
        ? r.fulfill({status:404, body:''}) : r.continue());
      await pag2.goto(URL, {waitUntil:'domcontentloaded'});
      if (await pag2.locator('#abrir').count()){ await pag2.click('#abrir'); await pag2.waitForTimeout(2700); }
      await pag2.waitForTimeout(1200);
      const vacia = await pag2.evaluate(ids => {
        const sec = document.querySelector('#galeria');
        const r = sec && sec.getBoundingClientRect();
        return {
          hay: !!sec,
          escondida: !!(sec && (sec.hidden || (r.width === 0 && r.height === 0))),
          /* Y lo mismo preguntado SIN saber dónde está cada foto: una
             imagen rota es un dibujo del navegador, no una excepción,
             así que si no se cuenta no la ve nadie hasta que el cliente
             manda la captura. */
          rotas: [...document.querySelectorAll('img')]
                   .filter(im => im.complete && !im.naturalWidth).length,
          franjasVivas: ids.filter(id => {
            const n = document.getElementById(id);
            if (!n) return false;
            const c = n.getBoundingClientRect();
            return !n.hidden && c.width > 0 && c.height > 0;
          })
        };
      }, franjas);
      if (vacia.hay)
        es(vacia.escondida, vacia.escondida
          ? 'sin ninguna foto que cargue, la sección entera se esconde'
          : 'sin ninguna foto, la sección queda dibujada vacía');
      es(vacia.rotas === 0, vacia.rotas
        ? `con todas las fotos caídas quedaron ${vacia.rotas} cuadrado(s) roto(s) dibujado(s)`
        : 'con todas las fotos caídas no queda un solo cuadrado roto dibujado');
      if (franjas.length)
        es(vacia.franjasVivas.length === 0, vacia.franjasVivas.length
          ? `la(s) franja(s) ${vacia.franjasVivas.join(', ')} quedan dibujadas sin foto adentro`
          : `las ${franjas.length} franjas de foto se esconden enteras`);
      await ctx2.close();
    }
  }

  /* ── 8 · la foto de la PORTADA que no está ──
     La portada con foto está apagada en mia15 (`CONFIG.portada`
     vacío) y volver a prenderla es una línea, así que el camino
     tiene que seguir medido. Se enciende interceptando el HTML,
     igual que `puertas.js` con MUESTRA_MURO: mirar la constante
     publicada haría que la prueba dependa de lo que hoy está
     elegido. */
  titulo('la foto de la portada que no está');
  {
    /* ¿Esta invitación corta con bordes rasgados? Se le pregunta a la
       página SIN romperle nada: si los tiene con la foto puesta, tiene
       que seguir teniéndolos sin ella. */
    const ctxR = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pagR = await ctxR.newPage();
    await pagR.goto(URL, {waitUntil:'domcontentloaded'});
    if (await pagR.locator('#abrir').count()){ await pagR.click('#abrir'); await pagR.waitForTimeout(2700); }
    await pagR.waitForTimeout(600);
    const conRasgos = await pagR.evaluate(() => document.querySelectorAll('svg.rasgo').length > 0);
    await ctxR.close();

    const ctx3 = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pag3 = await ctx3.newPage();
    let pudo = false;
    await pag3.route('**/*', async r => {
      const u = r.request().url();
      if (r.request().resourceType() === 'image' && /no-esta-esta-foto/.test(u))
        return r.fulfill({status:404, body:''});
      if (r.request().resourceType() === 'document' && u.replace(/[?#].*/,'').replace(/\/$/,'') === URL.replace(/\/$/,'')){
        const res = await r.fetch();
        let html = await res.text();
        const antes = html;
        html = html.replace(/portada: *"[^"]*"/, 'portada: "fotos/no-esta-esta-foto.webp"');
        pudo = html !== antes;
        return r.fulfill({response:res, body:html});
      }
      return r.continue();
    });
    await pag3.goto(URL, {waitUntil:'domcontentloaded'});
    if (await pag3.locator('#abrir').count()){ await pag3.click('#abrir'); await pag3.waitForTimeout(2700); }
    await pag3.waitForTimeout(1200);
    if (!pudo) bien('esta invitación no tiene portada con foto');
    else {
      const port = await pag3.evaluate(() => {
        const p = document.querySelector('#portada');
        const im = document.querySelector('.port-foto img');
        return { conFoto: p.classList.contains('con-foto'),
                 rota: !!(im && im.complete && !im.naturalWidth),
                 rasgos: document.querySelectorAll('svg.rasgo').length };
      });
      es(!port.rota, port.rota ? 'la portada quedó con el cuadrado roto arriba de todo'
                               : 'la foto que no cargó no deja un cuadrado roto en la portada');
      es(!port.conFoto, port.conFoto
        ? 'la portada se quedó en modo foto sin ninguna foto'
        : 'vuelve a la portada tipográfica, que se sostiene sola');
      /* El rasgado es la forma que eligió mia15 para el corte; almi15
         lo resuelve con una curva. Lo que hay que medir es que la
         invitación que LOS USA no se quede sin ellos al volver a la
         portada tipográfica — exigírselos a una que no los tiene es
         inventar una falla. */
      if (!conRasgos) bien('esta invitación no corta con bordes rasgados');
      else es(port.rasgos > 0, port.rasgos
        ? `y los bordes rasgados se rehacen (${port.rasgos})`
        : 'quedó sin bordes rasgados: juntura recta entre el negro y el papel');
    }
    await ctx3.close();
  }

  /* ── 8a-ter · LA CANCIÓN SUENA UNA SOLA VEZ ──
     Una invitación puede traer su canción. Lo que se mide no es que
     suene —eso lo decide el navegador y acá el Chromium no decodifica
     AAC— sino las dos cosas que se ven: que NO quede en bucle, y que
     al terminar el botón vuelva a decir "play" con la canción
     rebobinada. Sin el rebobinado el primer toque no suena: el audio
     está parado en el final, y eso no tira ningún error. */
  titulo('la canción suena una sola vez');
  {
    const ctxM = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pagM = await ctxM.newPage();
    await pagM.goto(URL, {waitUntil:'domcontentloaded'});
    if (await pagM.locator('#abrir').count()){ await pagM.click('#abrir'); await pagM.waitForTimeout(2700); }
    await pagM.waitForTimeout(600);
    const hay = await pagM.evaluate(() => !!document.querySelector('.repro audio'));
    if (!hay) bien('esta invitación no trae canción');
    else {
      const enBucle = await pagM.evaluate(() => document.querySelector('.repro audio').loop);
      es(!enBucle, enBucle ? 'la canción queda en BUCLE: no se la puede dejar de escuchar'
                           : 'la canción no queda en bucle');
      /* Se fuerza el final: en el camino normal hay que esperar la
         canción entera, así que esto no se recorre nunca. */
      const fin = await pagM.evaluate(async () => {
        const a = document.querySelector('.repro audio'),
              b = document.querySelector('.repro .play');
        a.dispatchEvent(new Event('ended'));
        await new Promise(r => setTimeout(r, 120));
        return { t: a.currentTime, et: b ? (b.getAttribute('aria-label') || '') : '' };
      });
      es(fin.t < .2, fin.t < .2
        ? 'y al terminar se rebobina sola'
        : `quedó parada en el final (${fin.t.toFixed(1)}s): el primer toque del play no suena`);
      es(/escuchar/i.test(fin.et), /escuchar/i.test(fin.et)
        ? 'y el botón vuelve a decir "escuchar"'
        : `el botón quedó diciendo "${fin.et}" con la canción terminada`);
    }
    await ctxM.close();
  }

  /* ── 8a-bis · EL AFICHE DE LA PORTADA ──
     Una invitación puede traer la portada ya hecha: una pieza que el
     cliente mandó armada, con su foto, su nombre y su letra adentro.
     Eso abre dos agujeros y ninguno tira un error:
       · con el afiche puesto, la portada no puede escribir el nombre
         OTRA VEZ debajo — serían dos nombres con dos letras distintas;
       · sin el afiche —un archivo que falta, un deploy a medias— la
         portada no puede quedar VACÍA ni con el cuadrado roto: tiene
         que volver a la tipográfica, que se sostiene sola.
     El segundo es el que importa y por eso se fuerza: en el camino
     normal no se recorre nunca. */
  titulo('el afiche de la portada');
  {
    const ctxP = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pagP = await ctxP.newPage();
    await pagP.goto(URL, {waitUntil:'domcontentloaded'});
    if (await pagP.locator('#abrir').count()){ await pagP.click('#abrir'); await pagP.waitForTimeout(2700); }
    await pagP.waitForTimeout(900);
    const con = await pagP.evaluate(() => {
      const p = document.querySelector('#portada'),
            im = document.querySelector('.port-poster img'),
            n  = document.querySelector('#nombre');
      const vis = e => { if (!e) return false;
        const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      return { hay: !!im, modo: !!p && p.classList.contains('con-poster'),
               cargo: !!(im && im.naturalWidth > 0),
               caja: im ? im.getBoundingClientRect().height : 0,
               alto: innerHeight, nombreVisible: vis(n) };
    });
    if (!con.hay) bien('esta invitación no trae la portada ya hecha');
    else {
      es(con.cargo, con.cargo ? 'el afiche de la portada carga de verdad'
                              : 'el afiche de la portada NO cargó');
      es(con.modo, con.modo ? 'y la portada se pone en modo afiche'
                            : 'el afiche cargó y la portada no se puso en modo afiche');
      es(con.caja > 0 && con.caja <= con.alto,
         con.caja > 0 && con.caja <= con.alto
           ? `y entra entero en la pantalla (${Math.round(con.caja)} de ${con.alto})`
           : `el afiche se sale de la pantalla (${Math.round(con.caja)} de ${con.alto})`);
      es(!con.nombreVisible, con.nombreVisible
        ? 'el nombre se dibuja DOS veces: el del afiche y el de abajo'
        : 'y el nombre no se escribe dos veces');

      /* LA JUNTURA DE ARRIBA. Un afiche nunca tiene la forma de un
         teléfono, así que arriba queda una banda — y lo que se ve ahí
         depende del BORDE del afiche: con un fondo plano la banda del
         mismo color desaparece, y con un dibujo que llega al borde la
         banda plana se lee como una juntura a lo ancho de la pantalla.
         No se mide comparando dos filas pegadas: con el relleno plano
         esas dos filas son casi iguales igual, porque el borde del
         afiche también es liso y el dibujo empieza unos píxeles más
         abajo. Lo que se nota es PLANO ARRIBA contra DIBUJO ABAJO, o
         sea la TEXTURA. Medido: 0.50 de razón con la trama puesta y
         0.06 con la banda plana.
         Se saltea sola donde no aplica: sin banda, o con un afiche de
         borde liso —que es el caso en el que la banda plana es la
         respuesta correcta—. */
      if (con.caja > 0 && con.cargo) {
        const tex = await pagP.evaluate(async () => {
          const im = document.querySelector('.port-poster img');
          const T = Math.round(im.getBoundingClientRect().top);
          return T;
        });
        if (tex < 24) bien('el afiche llena la pantalla: no hay banda que juzgar');
        else {
          const tiro = await pagP.screenshot();
          const {leerPNG} = require('./png.js');
          const im = leerPNG(tiro);
          const lum = (x, y) => { const i = (y*im.ancho + x) * im.canales;
            return .2126*im.pix[i] + .7152*im.pix[i+1] + .0722*im.pix[i+2]; };
          const textura = (y0, y1) => { const v = [];
            for (let y = Math.max(0,y0); y < Math.min(im.alto,y1); y++)
              for (let x = 6; x < im.ancho - 6; x += 2) v.push(lum(x, y));
            if (!v.length) return 0;
            const m = v.reduce((a,b)=>a+b,0)/v.length;
            return Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/v.length); };
          const arriba = textura(tex-70, tex-2), abajo = textura(tex+2, tex+70);
          if (abajo < 8) bien('el afiche tiene el borde liso: la banda plana es lo correcto');
          else {
            const razon = arriba / abajo;
            es(razon >= .25, razon >= .25
              ? `y la banda de arriba sigue el dibujo del afiche (${razon.toFixed(2)})`
              : `la banda de arriba es PLANA y el afiche llega dibujado al borde: se ve la juntura (${razon.toFixed(2)})`);
          }
        }
      }
    }
    await ctxP.close();

    if (con.hay){
      const ctxQ = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
      const pagQ = await ctxQ.newPage();
      await pagQ.route('**/*', async r => {
        const u = r.request().url();
        if (r.request().resourceType() === 'image' && /no-esta-este-afiche/.test(u))
          return r.fulfill({status:404, body:''});
        if (r.request().resourceType() === 'document' && u.replace(/[?#].*/,'').replace(/\/$/,'') === URL.replace(/\/$/,'')){
          const res = await r.fetch();
          let html = await res.text();
          html = html.replace(/poster: *"[^"]*"/, 'poster: "fotos/no-esta-este-afiche.webp"');
          return r.fulfill({response:res, body:html});
        }
        return r.continue();
      });
      await pagQ.goto(URL, {waitUntil:'domcontentloaded'});
      if (await pagQ.locator('#abrir').count()){ await pagQ.click('#abrir'); await pagQ.waitForTimeout(2700); }
      await pagQ.waitForTimeout(1200);
      const sin = await pagQ.evaluate(() => {
        const p = document.querySelector('#portada'), n = document.querySelector('#nombre');
        const rotas = [...document.querySelectorAll('img')]
          .filter(i => i.complete && !i.naturalWidth && i.getBoundingClientRect().width > 2).length;
        const r = n ? n.getBoundingClientRect() : {width:0,height:0};
        return { modo: !!p && p.classList.contains('con-poster'), rotas,
                 nombre: (n && n.textContent || '').trim(),
                 vis: r.width > 2 && r.height > 2 };
      });
      es(!sin.modo, sin.modo
        ? 'la portada se quedó en modo afiche sin ningún afiche'
        : 'sin el afiche vuelve a la portada tipográfica');
      es(!sin.rotas, sin.rotas ? `quedaron ${sin.rotas} cuadrados rotos dibujados`
                               : 'y no queda ningún cuadrado roto');
      es(sin.vis && sin.nombre.length > 1,
         sin.vis && sin.nombre.length > 1
           ? `y el nombre vuelve a la vista ("${sin.nombre}")`
           : 'la portada quedó sin afiche Y sin nombre: una pantalla vacía');
      await ctxQ.close();
    }
  }

  /* ── 8b · el que NO viene no llena lo que no es suyo ──
     Un campo escondido igual VIAJA: `new FormData(form)` manda todo
     lo que esté en el formulario. Así que esto se mide por las dos
     mitades —que no se vea Y que no se mande—, porque esconderlo
     solo arregla la pantalla y deja la planilla diciendo "no viene"
     al lado de "Cuántos: 4", que es la columna de las mesas. */
  titulo('el que no viene no llena lo que no es suyo');
  {
    const ctxN = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pagN = await ctxN.newPage();
    await pagN.goto(URL, {waitUntil:'domcontentloaded'});
    if (await pagN.locator('#abrir').count()){ await pagN.click('#abrir'); await pagN.waitForTimeout(2700); }
    const hayNo = await pagN.locator('input[name="Confirma"][value="No"]').count();
    const haySel = await pagN.locator('#fLugares').count();
    if (!hayNo || !haySel) bien('esta invitación no pregunta cuántos son');
    else {
      const mirar = () => pagN.evaluate(() => {
        const f = document.querySelector('#rsvp');
        const ve = s => { const n = document.querySelector(s); if (!n) return false;
          const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        return { lugares: ve('#fLugares'),
                 manda: [...new FormData(f).keys()] };
      });
      await pagN.fill('#fNombre', 'Juan Pérez');
      await pagN.locator('input[name="Confirma"][value="Sí"]').check();
      await pagN.selectOption('#fLugares', '3');
      await pagN.waitForTimeout(250);
      const si = await mirar();
      await pagN.locator('input[name="Confirma"][value="No"]').check();
      await pagN.waitForTimeout(350);
      const no = await mirar();
      es(!no.lugares, no.lugares
        ? 'al decir que no viene se le sigue preguntando cuántos son'
        : 'al decir que no viene, "cuántos son" se va de la pantalla');
      /* El mensaje es la excepción de `soloSiViene`: tiene que seguir a
         la vista aunque contesten que no pueden ir. El que no llega es
         justamente el que más quiere dejar escrito algo, y si se lo
         escondemos ahí se pierde. */
      if (await pagN.locator('#fMensaje').count()){
        const seVe = await pagN.isVisible('#fMensaje');
        es(seVe, seVe
          ? 'el mensaje se puede dejar aunque conteste que no viene'
          : 'al decir que no viene se le esconde el campo del mensaje');
        es(no.manda.includes('Mensaje'), no.manda.includes('Mensaje')
          ? 'y viaja a la planilla igual'
          : 'y ni siquiera viaja: el saludo del que no puede ir se pierde');
        const obliga = await pagN.evaluate(() =>
          document.querySelector('#fMensaje').hasAttribute('required'));
        es(!obliga, obliga
          ? 'y encima es obligatorio: el que no quiere escribir nada no puede confirmar'
          : 'y no es obligatorio');
      } else {
        /* Se DICE que no se midió. Un `if` que no entra es una prueba
           que se saltea sola y deja la suite en verde sin haber mirado
           nada — y acá eso taparía el día que alguien saque el campo. */
        bien('esta invitación no tiene campo de mensaje: no hay nada que medir');
      }

      es(!no.manda.includes('Cuántos'), no.manda.includes('Cuántos')
        ? 'y la fila igual llega a la planilla con un número en "Cuántos"'
        : 'y tampoco viaja: a la planilla no le llega un número de mesas');
      /* Volver al "sí" tiene que devolver todo: si no, el que se
         equivocó de botón ya no puede decir con cuántos viene. */
      await pagN.locator('input[name="Confirma"][value="Sí"]').check();
      await pagN.waitForTimeout(350);
      const vuelta = await mirar();
      es(vuelta.lugares && vuelta.manda.length === si.manda.length,
         vuelta.lugares && vuelta.manda.length === si.manda.length
           ? 'y volviendo al "sí" vuelven todos los campos'
           : 'volviendo al "sí" no vuelven todos los campos');

      /* ── una comida POR PERSONA ──
         Lo reportó el dueño: «si elegís 5 personas no sale la opción
         para elegir la alimentación de las 5; te toma solo 1 y te
         pone 5 celiacos». Una sola columna de comida para toda la
         mesa es lo que se le pasa al salón tal cual, así que el día
         de la fiesta hay cinco platos sin TACC y cuatro personas que
         no los pidieron.
         Se mide por lo que VIAJA, no por lo que se ve: esconder bien
         y mandar mal es la mitad del problema y da verde igual. */
      if (await pagN.locator('#fComida').count()){
        const tipo = await pagN.evaluate(() =>
          document.querySelector('#fComida').tagName.toLowerCase());
        es(tipo === 'select', tipo === 'select'
          ? 'la comida se elige de una lista, no se escribe a mano'
          : `la comida es un <${tipo}>: escrita a mano llegan "celiaco", "CELÍACA" y "sin tacc" en la misma columna`);

        await pagN.selectOption('#fLugares', '5');
        await pagN.waitForTimeout(300);
        const cuantas = await pagN.locator('#rsvp select[name^="Comida"]').count();
        es(cuantas === 5, cuantas === 5
          ? 'con 5 personas hay 5 comidas para elegir, una por cada una'
          : `con 5 personas hay ${cuantas} comida(s) para elegir: a las otras se les pone la del primero`);

        if (cuantas === 5){
          const nombres = ['Celíaco','Vegetariano','Diabético','Hipertenso','Ninguno'];
          const ids = await pagN.evaluate(() => [...document.querySelectorAll('#rsvp select[name^="Comida"]')].map(s => s.id));
          for (let k = 0; k < ids.length; k++) await pagN.selectOption('#' + ids[k], nombres[k]);
          const viaja = await pagN.evaluate(() => {
            const fd = new FormData(document.querySelector('#rsvp'));
            const o = {}; for (const [k, v] of fd) if (/^Comida/.test(k)) o[k] = v; return o;
          });
          const valores = Object.values(viaja);
          es(valores.length === 5 && new Set(valores).size === 5,
             valores.length === 5 && new Set(valores).size === 5
               ? 'y a la planilla llega la de cada uno: ' + valores.join(', ')
               : 'y a la planilla llega una sola repetida: ' + JSON.stringify(viaja));
        }
      }
    }
    await ctxN.close();
  }

  /* ── 9 · la carta no SALTA a la portada ──
     "Que sea menos brusca la transición de la carta y la portada."
     Un corte entre dos pantallas no tira ningún error: las dos se
     dibujan perfectas y lo único que pasa es que el momento de la
     sorpresa se siente barato.
     Se mide el CRUCE y no una clase ni un tiempo: que la portada
     aparezca de a poco —que exista al menos un instante en que está
     a medio camino, con el sobre todavía en pantalla— y que la carta
     no se agrande hasta tapar todo, que es lo que la hacía "pasar
     por delante" en vez de disolverse. Así da igual cómo esté
     hecho. Contra el código anterior la portada medía 1.00 desde el
     primer cuadro y la carta llegaba a 7x: dos fallas. */
  titulo('la carta no salta a la portada');
  {
    const ctxT = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pagT = await ctxT.newPage();
    await pagT.goto(URL, {waitUntil:'domcontentloaded'});
    if (!await pagT.locator('#sobre').count()) bien('esta invitación no tiene sobre');
    else {
      await pagT.waitForTimeout(400);
      await pagT.click('#abrir');
      const t0 = Date.now();
      const tomas = [];
      for (let ms = 150; ms <= 3000; ms += 150){
        const falta = ms - (Date.now() - t0);
        if (falta > 0) await pagT.waitForTimeout(falta);
        tomas.push(await pagT.evaluate(() => {
          const c = document.querySelector('.carta');
          const p = document.querySelector('#portada');
          const esc = n => { const m = n && getComputedStyle(n).transform.match(/matrix\(([-\d.]+)/); return m ? +m[1] : 1; };
          /* Cuánto se SALE la carta de la pantalla mientras vuela: es
             lo único que el que mira ve como un defecto —su texto
             cortado contra el borde—, y no se deduce de la escala,
             porque depende del ancho de la carta en cada aparato. */
          let fuera = 0;
          if (c && +getComputedStyle(c).opacity > .06){
            const r = c.getBoundingClientRect();
            if (r.width > 2) fuera = Math.max(0, -r.left, r.right - innerWidth);
          }
          return {
            port:  p ? +getComputedStyle(p).opacity : 1,
            carta: c ? esc(c) : 1,
            fuera,
            sobre: !!document.querySelector('#sobre')
          };
        }));
      }
      /* "A medio camino" con el sobre todavía puesto: eso es el cruce.
         Sin él, la portada está entera desde el primer cuadro y lo que
         se ve es un corte. */
      const medio = tomas.filter(t => t.sobre && t.port > .05 && t.port < .95).length;
      es(medio >= 2, medio >= 2
        ? 'la portada se enciende de a poco, no de golpe (' + medio + ' instantes a medio camino)'
        : 'la portada APARECE de golpe: no hay cruce con la carta');

      const pico = Math.max(...tomas.map(t => t.carta));
      es(pico <= 4, pico <= 4
        ? 'y la carta se disuelve en vez de taparlo todo (llega a ' + pico.toFixed(1) + 'x)'
        : 'la carta se agranda hasta ' + pico.toFixed(1) + 'x: pasa por delante en vez de disolverse');

      /* Y QUE NO SE CORTE. Lo marcó el dueño: "queda medio cortado lo
         que dice". Mientras la carta se ve, su caja no puede salirse
         de la pantalla: ahí lo que queda afuera es justamente el
         nombre. No se mide por la escala —el ancho de la carta cambia
         con el aparato— sino por la CAJA contra la pantalla. */
      const sale = Math.max(...tomas.map(t => t.fuera || 0));
      es(sale <= 6, sale <= 6
        ? 'y no se corta contra el borde mientras se ve'
        : 'la carta SE SALE ' + Math.round(sale) + 'px de la pantalla: su texto queda cortado');

      const final = tomas[tomas.length - 1];
      es(final.port > .98 && !final.sobre, final.port > .98 && !final.sobre
        ? 'y al terminar la portada queda entera y el sobre se fue'
        : 'al terminar quedó algo a medias: portada ' + final.port.toFixed(2) + ', sobre ' + (final.sobre ? 'todavía puesto' : 'se fue'));
    }
    await ctxT.close();
  }

  /* ── 10 · con foto, el 15 SIGUE animándose ──
     La animación del 15 nació para la portada tipográfica y estaba
     apagada en cuanto había foto (`if (!h || CONFIG.portada) return`).
     El día que el cliente pidió la foto de vuelta, eso quería decir
     perder la animación sin que nada lo avisara: la portada se
     dibuja perfecta y queda quieta.
     Se mide con el PÍXEL y no con una clase ni con el `clip-path`:
     así da igual cómo esté hecha —sobre el papel son dos capas de
     color, sobre la foto es un recorte que revela— y lo que se
     comprueba es lo único que importa, que el 15 ENTRE. */
  titulo('el 15 de la portada entra animado');
  {
    const ctx4 = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const pag4 = await ctx4.newPage();
    let conFoto = false;
    await pag4.route('**/*', async r => {
      const u = r.request().url();
      if (r.request().resourceType() === 'document' && u.replace(/[?#].*/,'').replace(/\/$/,'') === URL.replace(/\/$/,'')){
        const res = await r.fetch();
        let html = await res.text();
        /* La foto se fuerza para que esto mida el camino CON foto
           aunque hoy la portada esté tipográfica: si mirara la
           constante publicada, el día que se vacíe dejaría de medir
           y nadie se enteraría. */
        const m = html.match(/portada: *"([^"]*)"/);
        if (m){ conFoto = true; html = html.replace(m[0], 'portada: "' + (m[1] || 'fotos/portada.webp') + '"'); }
        return r.fulfill({response:res, body:html});
      }
      return r.continue();
    });
    await pag4.goto(URL, {waitUntil:'domcontentloaded'});
    const hay = await pag4.locator('#portada .quince-big').count();
    if (!hay || !conFoto) bien('esta invitación no tiene el 15 de portada');
    else {
      if (await pag4.locator('#abrir').count()) await pag4.click('#abrir');
      const caja = await pag4.$eval('#portada .quince-big', el => {
        const r = el.getBoundingClientRect();
        return {x:Math.max(0,r.left), y:Math.max(0,r.top), width:r.width, height:r.height};
      });
      const dpr = await pag4.evaluate(() => devicePixelRatio || 1);
      /* Cuánta "tinta clara" hay dibujada: el 15 terminado es crema
         maciza, así que contar píxeles claros dentro de su caja dice
         cuánto entró, sin saber nada de cómo está hecho. */
      const claros = async () => {
        const im = leerPNG(await pag4.screenshot({clip:caja}));
        let n = 0;
        for (let y = 0; y < im.alto; y++)
          for (let x = 0; x < im.ancho; x++){
            const o = (y*im.ancho + x) * im.canales;
            if (im.pix[o] > 200 && im.pix[o+1] > 195) n++;
          }
        return n;
      };
      await pag4.waitForTimeout(700);
      const antes = await claros();
      await pag4.waitForTimeout(2600);
      const despues = await claros();
      const total = (caja.width*dpr) * (caja.height*dpr);
      es(despues > antes * 1.35 && despues > total * 0.08,
         despues > antes * 1.35 && despues > total * 0.08
           ? `el 15 entra animado (${antes} → ${despues} píxeles dibujados)`
           : `el 15 NO se anima con foto: ${antes} → ${despues} píxeles, no se movió`);
      es(despues > total * 0.08,
         despues > total * 0.08 ? 'y termina entero' : 'y quedó a medio dibujar');
    }
    await ctx4.close();
  }

  await navegador.close();
  console.log(fallas.length ? '\n' + fallas.length + ' FALLAS' : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})();
