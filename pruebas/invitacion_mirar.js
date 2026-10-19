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
      await pag.waitForTimeout(1200);
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
  let seMando = false;
  await pag.route('**/script.google.com/**', r => {
    if (r.request().method() === 'POST'){ seMando = true; return r.fulfill({status:200, body:'{"ok":true}'}); }
    return r.fulfill({status:200, contentType:'application/json',
                      body: JSON.stringify({ ok: seMando })});
  });
  await pag.goto(URL, {waitUntil:'domcontentloaded'});
  if (await pag.locator('#abrir').count()){ await pag.click('#abrir'); await pag.waitForTimeout(1200); }

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

  /* El mapa no puede quedar en "#": un botón que se ve igual y no
     lleva a ningún lado no da ningún error. */
  const mapas = await pag.evaluate(() =>
    [...document.querySelectorAll('a[target="_blank"]')].map(a => ({href:a.getAttribute('href'), rel:a.getAttribute('rel')||''})));
  es(mapas.every(m => m.href && m.href !== '#'), 'ningún enlace externo quedó vacío');
  es(mapas.every(m => /noopener/.test(m.rel)), 'todo lo que abre en otra pestaña lleva rel=noopener');

  /* La confirmación no puede decir "listo" si no se mandó nada. */
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
    const endpointVacio = await pag.evaluate(() => !CONFIG.endpoint);
    if (endpointVacio)
      es(/muestra|no se manda|no se mand/.test(av),
         'sin planilla puesta, DICE que no se mandó a ningún lado (no miente con un "listo")');
  }
  await ctx.close();

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
    const cuantas = await pagL.evaluate(
      () => (typeof CONFIG !== 'undefined' && CONFIG.fotos || []).length);
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
      if (await pag1.locator('#abrir').count()){ await pag1.click('#abrir'); await pag1.waitForTimeout(900); }
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
        const esperados = g.fotos > 1 ? g.fotos : 0;
        es(g.puntos === esperados,
           g.puntos === esperados ? `y los puntitos son ${esperados}, uno por foto que existe`
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
      if (await pag2.locator('#abrir').count()){ await pag2.click('#abrir'); await pag2.waitForTimeout(900); }
      await pag2.waitForTimeout(1200);
      const vacia = await pag2.evaluate(() => {
        const sec = document.querySelector('#galeria');
        if (!sec) return {hay:false};
        const r = sec.getBoundingClientRect();
        return {hay:true, escondida: sec.hidden || (r.width === 0 && r.height === 0)};
      });
      if (vacia.hay)
        es(vacia.escondida, vacia.escondida
          ? 'sin ninguna foto que cargue, la sección entera se esconde'
          : 'sin ninguna foto, la sección queda dibujada vacía');
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
    if (await pag3.locator('#abrir').count()){ await pag3.click('#abrir'); await pag3.waitForTimeout(900); }
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
      es(port.rasgos > 0, port.rasgos
        ? `y los bordes rasgados se rehacen (${port.rasgos})`
        : 'quedó sin bordes rasgados: juntura recta entre el negro y el papel');
    }
    await ctx3.close();
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
    if (await pagN.locator('#abrir').count()){ await pagN.click('#abrir'); await pagN.waitForTimeout(900); }
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

  /* ── 9 · con foto, el 15 SIGUE animándose ──
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
