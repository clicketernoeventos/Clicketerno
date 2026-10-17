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
       pointer-events:none, y los pseudo-elementos no están en el DOM. */
    const salidos = await pag.evaluate((W) => {
      const out = [];
      for (const n of document.querySelectorAll('body *')){
        const cs = getComputedStyle(n);
        if (cs.display==='none' || cs.visibility==='hidden') continue;
        if (cs.pointerEvents === 'none') continue;
        const r = n.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
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

    /* ── 5 · la consola ── */
    es(errores.length === 0, errores.length ? 'errores de JavaScript: ' + errores[0] : 'sin errores de JavaScript');
    es(bloqueos.length === 0, bloqueos.length ? 'la CSP bloqueó algo: ' + bloqueos[0].slice(0,90) : 'la CSP no bloqueó nada');

    await ctx.close();
  }

  /* ── 6 · lo que se promete y tiene que estar ── */
  titulo('las piezas');
  const ctx = await navegador.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const pag = await ctx.newPage();
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

  await navegador.close();
  console.log(fallas.length ? '\n' + fallas.length + ' FALLAS' : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})();
