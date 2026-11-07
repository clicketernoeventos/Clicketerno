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
     · y que el modo oscuro de Android no dé vuelta ninguna
       pantalla, que es lo que le pasaba a la página de inicio —le
       cambiaba el 28,8%— y a las invitaciones

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
    /* `stale-while-revalidate` grande es la MISMA falla que
       `immutable`, con fecha de vencimiento: quiere decir "serví la
       copia vieja y buscá la nueva por atrás", así que el que entra
       ve el HTML de hace horas y lo nuevo recién la visita siguiente.
       Con 86400 puestos, un cliente abrió su invitación recién
       publicada y vio el texto anterior y dos fotos rotas —el HTML
       viejo pidiendo archivos que ese deploy había borrado—. El tope
       va en cinco minutos: alcanza para que dos pantallas seguidas no
       vuelvan a pedir, y no para publicar algo y que no se vea. */
    const swr = +((cc || '').match(/stale-while-revalidate\s*=\s*(\d+)/) || [])[1] || 0;
    if (!cc) mal('el HTML no tiene Cache-Control: se baja entero en cada visita');
    else if (/immutable/.test(cc)) mal(`el HTML quedó inmutable ("${cc}"): una versión vieja se pega para siempre`);
    else if (swr > 300) mal(`el HTML se sirve viejo hasta ${swr}s después ("${cc.trim()}"): se publica algo y no se ve`);
    else bien(`el HTML se puede guardar un rato sin quedar pegado: ${cc.trim()}`);
  }

  /* ── EL MODO OSCURO DE ANDROID NO DA VUELTA NINGUNA PANTALLA ──
     Si una página no declara de qué color es, Chrome en Android y
     Samsung Internet le INVIERTEN la luminosidad a todo, y el tema
     oscuro del sistema viene prendido en casi todos los teléfonos.
     No tira ningún error: la pantalla se dibuja perfecta y con los
     colores cambiados. Lo encontró la clienta de una invitación —su
     papel rosa a rayas salía marrón y el encaje negro salía blanco—
     y era lo mismo en la página de inicio, que es donde cae el
     tráfico pagado: le cambiaba el 28,8%.

     No se mide que exista el `color-scheme`: se mide el EFECTO. Se
     dibuja la misma pantalla dos veces —normal y con el modo oscuro
     automático pedido por CDP, que es el que aplica el teléfono— y
     se comparan los píxeles. Así da igual cómo esté apagado. */
  titulo('el modo oscuro de Android no da vuelta ninguna pantalla');
  {
    const { leerPNG } = require('./png');
    const PAGINAS = ['/', '/invitaciones', '/404.html', '/privacidad', '/terminos',
                     '/empezar', '/muro?demo=1', '/rollo?demo=1'];

    const dibujar = async (ruta, auto) => {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 915 },
                                             isMobile: true, hasTouch: true, colorScheme: 'dark' });
      const pag = await ctx.newPage();
      const cdp = await ctx.newCDPSession(pag);
      await cdp.send('Emulation.setAutoDarkModeOverride', { enabled: auto });
      /* Key y Xiomara viven en Netlify y NO son nuestras: desde acá su
         marco no carga y el navegador dibuja su propia pantalla de
         error, que sí se da vuelta. Eso mediría a Chrome, no a la
         página, así que se las reemplaza por un marco quieto. (En un
         teléfono de verdad esas dos SÍ se dan vuelta, y lo único que
         lo arregla es traerlas al repo.) */
      await pag.route('**netlify.app**', r => r.fulfill({ status: 200, contentType: 'text/html',
        body: '<!doctype html><meta name="color-scheme" content="only light"><body style="margin:0">' }));
      await pag.route('**fonts.g**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
      await pag.goto(MURO + ruta, { waitUntil: 'domcontentloaded' });
      await pag.waitForTimeout(1400);
      const alto = await pag.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < alto; y += 700) {
        await pag.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
        await pag.waitForTimeout(100);
      }
      await pag.waitForTimeout(400);
      /* De a pantallas y NO con una captura `fullPage`: para ésa el
         navegador le cambia la medida a la ventana, y eso BORRA el
         modo oscuro que acabamos de pedir. Medido: con `fullPage`
         daba 0% de diferencia con la página rota. */
      const tomas = [];
      for (let y = 0, k = 0; y < alto && k < 10; y += 915, k++) {
        await pag.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
        await pag.waitForTimeout(220);
        tomas.push(leerPNG(await pag.screenshot()));
      }
      await ctx.close();
      return tomas;
    };

    for (const ruta of PAGINAS) {
      const A = await dibujar(ruta, false), B = await dibujar(ruta, true);
      let distintos = 0, total = 0;
      for (let k = 0; k < Math.min(A.length, B.length); k++) {
        const a = A[k], b = B[k];
        for (let y = 0; y < Math.min(a.alto, b.alto); y += 4) {
          for (let x = 0; x < Math.min(a.ancho, b.ancho); x += 4) {
            const ia = (y * a.ancho + x) * a.canales, ib = (y * b.ancho + x) * b.canales;
            const d = Math.abs(a.pix[ia] - b.pix[ib]) + Math.abs(a.pix[ia + 1] - b.pix[ib + 1])
                    + Math.abs(a.pix[ia + 2] - b.pix[ib + 2]);
            total++;
            if (d > 24) distintos++;
          }
        }
      }
      const pc = total ? Math.round(distintos * 1000 / total) / 10 : 0;
      if (pc > 4) mal(`${ruta}: el modo oscuro de Android le cambia el ${pc}% de la pantalla`);
      else bien(`${ruta} se dibuja igual con el tema oscuro puesto (${pc}%)`);
    }
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
