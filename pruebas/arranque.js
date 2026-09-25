/* ═══════════════════════════════════════════════════════════════
   LO QUE BAJA UN INVITADO ANTES DE VER NADA

   Las dos librerías (el dibujante de QR y el armador de zip) eran
   dos <script src> sincrónicos arriba de todo. Sincrónico quiere
   decir que NADA más empieza hasta que esas dos bajan y se
   ejecutan: ni la conexión a las tipografías, ni la consulta del
   evento. En el rollo estaban incluso ANTES del preconnect.

   Y el invitado no usa ninguna de las dos: el QR es del panel, del
   cartel y de las tarjetas; el zip es de "Descargar todas". Son 97
   KB de un armador de archivos comprimidos que esa persona no va a
   abrir nunca, en el camino crítico, con el wifi de un salón.

   Lo que se mide acá:
     · que el invitado NO se baje ninguna de las dos
     · que el QR se siga dibujando donde sí hace falta
     · que haya preconnect a Supabase, que es lo primero que la app
       consulta de verdad
     · que el HTML tenga Cache-Control (sin service worker: a los
       60 s revalida, así que nunca queda una versión vieja pegada)

   Contra el código anterior falla: las dos librerías bajaban
   siempre, no había preconnect y el HTML no tenía Cache-Control.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const MURO = 'http://127.0.0.1:8099';
const ROLLO = 'http://127.0.0.1:8890';
const RAIZ = __dirname + '/..';
const TELEFONO = { width: 390, height: 844 };

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Abre una pantalla y anota TODO lo que el navegador pidió. */
async function loQuePide(browser, url, esperar = 4000) {
  const ctx = await browser.newContext({ viewport: TELEFONO, permissions: ['camera'] });
  const p = await ctx.newPage();
  const pedidos = [];
  const errs = [];
  p.on('request', (r) => pedidos.push(r.url()));
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(esperar);
  return { ctx, p, pedidos, errs };
}
const pidio = (pedidos, que) => pedidos.some((u) => u.includes(que));

(async () => {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

  /* ══ 1 · EL INVITADO DEL ROLLO ══ */
  titulo('la cámara del invitado no baja lo que no usa');
  {
    const { ctx, pedidos, errs } = await loQuePide(browser, `${ROLLO}/rollo.html?demo=1&camara=1`);
    if (pidio(pedidos, 'jszip')) mal('el invitado del rollo se baja jszip (97 KB) y no lo usa nunca');
    else bien('el invitado del rollo no se baja el armador de zip');
    if (pidio(pedidos, 'qrcode')) mal('el invitado del rollo se baja el dibujante de QR y no lo usa');
    else bien('ni el dibujante de QR');
    if (errs.length) mal('errores JS en la cámara: ' + errs[0]);
    await ctx.close();
  }

  /* ══ 2 · EL INVITADO DEL MURO ══ */
  titulo('el invitado del muro tampoco');
  {
    const { ctx, pedidos, errs } = await loQuePide(browser, `${MURO}/muro.html?demo=1#subir/DEMO-FIESTA`);
    if (pidio(pedidos, 'jszip')) mal('el invitado del muro se baja jszip (97 KB) y no lo usa nunca');
    else bien('el invitado del muro no se baja el armador de zip');
    if (errs.length) mal('errores JS en la pantalla del invitado: ' + errs[0]);
    await ctx.close();
  }

  /* ══ 3 · PERO EL QR SE SIGUE DIBUJANDO ══
     Es la mitad que importa de cargar tarde: que donde SÍ hace falta,
     aparezca igual. Se llama a pintarQR() como lo llama el cartel. */
  titulo('el QR se sigue dibujando donde hace falta');
  for (const [quien, base, archivo] of [['muro', MURO, 'muro.html'], ['rollo', ROLLO, 'rollo.html']]) {
    const { ctx, p, errs } = await loQuePide(browser, `${base}/${archivo}?demo=1`, 2500);
    const dibujo = await p.evaluate(async () => {
      if (typeof pintarQR !== 'function') return 'no existe pintarQR';
      const d = document.createElement('div');
      document.body.appendChild(d);
      pintarQR(d, 'https://clicketerno.com.ar/muro#subir/QUI-ABC123', 120);
      /* pintarQR es sincrónica: dibuja el reemplazo y repinta cuando la
         librería llega. Le damos tiempo a que llegue. */
      for (let i = 0; i < 60; i++) {
        if (d.querySelector('canvas,img,table')) return 'ok';
        await new Promise((r) => setTimeout(r, 100));
      }
      return 'quedó sin QR: ' + d.innerHTML.slice(0, 80);
    });
    if (dibujo !== 'ok') mal(`el QR del ${quien} no se dibuja: ${dibujo}`);
    else bien(`el QR del ${quien} se dibuja igual`);
    if (errs.length) mal(`errores JS del ${quien}: ` + errs[0]);
    await ctx.close();
  }

  /* ══ 4 · LO QUE SE DECLARA EN EL HTML ══ */
  titulo('el camino crítico');
  for (const f of ['muro.html', 'rollo.html']) {
    const src = fs.readFileSync(`${RAIZ}/${f}`, 'utf8');
    const cab = src.slice(0, src.indexOf('</head>') + 1 || 6000);
    if (!/rel=["']?preconnect["']?[^>]*supabase\.co/.test(cab))
      mal(`${f} no tiene preconnect a Supabase, que es lo primero que consulta`);
    else bien(`${f} adelanta la conexión a Supabase`);
    /* Un <script src> sin async/defer para en seco el dibujado. */
    const bloquean = (cab.match(/<script\s+src=(?!.*(?:async|defer))[^>]*>/g) || []);
    if (bloquean.length)
      mal(`${f} tiene ${bloquean.length} script(s) que frenan el dibujado: ${bloquean[0].slice(0, 60)}`);
    else bien(`${f} no tiene ningún script que frene el dibujado`);
  }

  /* ══ 5 · EL HTML SE PUEDE GUARDAR UN RATO ══ */
  titulo('el HTML no se vuelve a bajar entero en cada vuelta');
  {
    const h = fs.readFileSync(`${RAIZ}/_headers`, 'utf8');
    /* El bloque /* es el que alcanza al HTML. Buscamos un Cache-Control
       ahí adentro, y que NO sea immutable: con inmutable una versión
       vieja se queda pegada, que es justo lo que no queremos sin SW. */
    const bloque = h.split(/^\/\S*$/m).find((b, i) => i === 1) || '';
    const cc = (bloque.match(/^\s*Cache-Control:\s*(.+)$/m) || [])[1];
    if (!cc) mal('el HTML no tiene Cache-Control: se baja entero en cada visita');
    else if (/immutable/.test(cc)) mal(`el HTML quedó inmutable ("${cc}"): una versión vieja se pega para siempre`);
    else bien(`el HTML se puede guardar un rato sin quedar pegado: ${cc.trim()}`);
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
