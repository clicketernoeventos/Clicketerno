/* ═══════════════════════════════════════════════════════════════
   /invitaciones · LA PÁGINA QUE SE LE MANDA AL QUE NO COMPRÓ

   Pedido del dueño (19/10/2026): «una pestaña de invitaciones con
   todas las que tenemos para poder enviar el link a potenciales
   clientes para que vean qué es lo que hacemos».

   Hasta acá, lo único que había era la galería adentro del inicio:
   para llegar a ella el que recibe el link tiene que entrar al
   sitio y bajar. Ahora hay una dirección propia.

   Lo que se mide, y por qué cada cosa:

   · LA LISTA ES UNA SOLA. La página y la galería del inicio sacan
     las invitaciones de `lib/trabajos.js`. Escrita en los dos
     lados, el día que entra una invitación nueva una de las dos se
     queda atrás — y la que se queda atrás es justo la que abre el
     cliente. La prueba cuenta las dos y exige el mismo número.

   · LOS NÚMEROS NO SE ESCRIBEN A MANO. El renglón que dice cuántas
     son de clientes y cuántas son muestras se cuenta de la lista.
     Escrito, miente el día que entra una más — y la página promete
     que son las que recibieron los invitados, así que mentir ahí
     es caro.

   · CADA FICHA MUESTRA ALGO. Si la invitación no responde —las dos
     que todavía viven en Netlify dependen de que Netlify esté en
     pie— tiene que quedar la portada dibujada, con el nombre. Un
     rectángulo negro y vacío parece un producto roto, y eso no
     tira ningún error.

   · EL BOTÓN LLEVA A WHATSAPP Y DICE DE DÓNDE VIENE. El `href` del
     HTML ya apunta a wa.me para que sin JavaScript lleve igual;
     con JS tiene que llevar el mensaje puesto. Un botón que se ve
     igual y manda un mensaje vacío no da ningún error.

   · Y lo de siempre: que nada se salga por el costado, que todo lo
     que se toca llegue a 44x44, y que la consola quede limpia —o
     sea que la CSP no bloqueó nada—.

   Contra el código anterior esta suite no corre: la página no
   existía y la dirección daba 404. Eso es lo primero que mide.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const APARATOS = [
  { nombre: 'iPhone SE  320', ancho: 320, alto: 568, dedo: true },
  { nombre: 'iPhone     390', ancho: 390, alto: 844, dedo: true },
  { nombre: 'escritorio 1280', ancho: 1280, alto: 900, dedo: false },
];

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Lo que no se perdona es un error de JavaScript. Que un archivo no se
   pueda bajar es ruido del entorno: acá el proxy firma los certificados
   y el navegador rechaza las fuentes de Google y los sitios de Netlify.
   Contarlo como falla sería informar un problema que no existe. */
const ruido = (t) => /favicon|net::ERR_|ERR_CERT|fonts\.googleapis|fonts\.gstatic|netlify/i.test(t);

(async () => {
  const browser = await chromium.launch();

  /* ── la dirección existe ── */
  titulo('la dirección');
  {
    const r = await fetch(BASE + '/invitaciones');
    if (!r.ok) mal(`/invitaciones contesta ${r.status}: el link que se manda por WhatsApp no abre`);
    else bien('/invitaciones contesta 200 con la dirección limpia');
  }

  /* ── la lista es la misma que la del inicio ── */
  titulo('una sola lista');
  let cuantas = 0;
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/invitaciones', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    cuantas = await p.evaluate(() => (window.TRABAJOS || []).length);
    const fichas = await p.evaluate(() => document.querySelectorAll('.ficha').length);
    if (!cuantas) mal('la página no tiene ninguna invitación en la lista');
    else if (fichas !== cuantas) mal(`la lista tiene ${cuantas} y se dibujan ${fichas}`);
    else bien(`dibuja las ${cuantas} de la lista`);
    await ctx.close();

    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p2 = await ctx2.newPage();
    await p2.goto(BASE + '/', { waitUntil: 'load' });
    await p2.waitForTimeout(600);
    const enInicio = await p2.evaluate(() =>
      document.querySelectorAll('#galeriaTrabajos .trabajo').length);
    if (enInicio !== cuantas)
      mal(`el inicio muestra ${enInicio} invitaciones y /invitaciones ${cuantas}: una de las dos se quedó atrás`);
    else bien(`el inicio muestra las mismas ${enInicio}`);
    await ctx2.close();
  }

  /* ── las fichas, en tres aparatos ── */
  for (const ap of APARATOS) {
    titulo(ap.nombre);
    const ctx = await browser.newContext({
      viewport: { width: ap.ancho, height: ap.alto },
      hasTouch: ap.dedo, isMobile: ap.dedo,
    });
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', (m) => m.type() === 'error' && !ruido(m.text()) && errs.push(m.text()));
    p.on('pageerror', (e) => !ruido(String(e)) && errs.push(String(e)));
    await p.goto(BASE + '/invitaciones', { waitUntil: 'load' });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(2500);

    /* Cada ficha dice de quién es y tiene por dónde abrirla. Si el marco
       no cargó, lo que queda es la portada dibujada: tiene que decir el
       nombre igual. */
    const fichas = await p.evaluate(() => [...document.querySelectorAll('.ficha')].map((f) => ({
      nombre: (f.querySelector('.pie b') || {}).textContent || '',
      dibujo: ((f.querySelector('.dibujo .nm') || {}).textContent || '').trim(),
      abre: (f.querySelector('.abrir') || {}).getAttribute
        ? f.querySelector('.abrir').getAttribute('href') : '',
      alto: Math.round(f.querySelector('.marco').getBoundingClientRect().height),
    })));
    /* Antes de medir, comprobar que lo que se mide ESTÉ. Sin esto, con la
       página caída las comprobaciones de abajo recorrían una lista vacía y
       daban tres verdes seguidos midiendo la nada — y la que sí usa el
       primer elemento se cortaba con un error que no dice qué pasó. */
    if (!fichas.length) {
      mal('no se dibujó ninguna ficha: no hay nada que medir en este aparato');
      await ctx.close();
      continue;
    }

    const mudas = fichas.filter((f) => !f.nombre.trim() || !f.dibujo);
    if (mudas.length) mal(`${mudas.length} fichas no dicen de quién son`);
    else bien(`las ${fichas.length} dicen de quién son, cargue o no el marco`);

    const sinPuerta = fichas.filter((f) => !f.abre || f.abre === '#');
    if (sinPuerta.length) mal(`${sinPuerta.length} fichas no llevan a ninguna parte`);
    else bien('todas se pueden abrir enteras');

    const chatas = fichas.filter((f) => f.alto < 200);
    if (chatas.length) mal(`${chatas.length} marcos quedaron de ${chatas[0].alto}px de alto: no se ve nada`);
    else bien(`el marco mide ${fichas[0].alto}px de alto`);

    /* Nada se sale por el costado. Se miden las CAJAS de verdad: el
       `overflow-x:hidden` del body hace que `scrollWidth` devuelva el
       ancho de la pantalla igual, con la página rota. */
    const salidos = await p.evaluate(() => [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
      }).map((e) => e.tagName + '.' + (e.className || '').toString().slice(0, 24)));
    if (salidos.length) mal(`${salidos.length} se salen de la pantalla: ${salidos[0]}`);
    else bien('nada se sale por el costado');

    if (ap.dedo) {
      const chicos = await p.evaluate(() => [...document.querySelectorAll('a,button')]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.width < 44 || r.height < 44);
        }).map((e) => (e.textContent || '').trim().slice(0, 20) + ' ' +
          Math.round(e.getBoundingClientRect().width) + 'x' +
          Math.round(e.getBoundingClientRect().height)));
      if (chicos.length) mal(`${chicos.length} no llegan a 44x44: ${chicos[0]}`);
      else bien('todo lo que se toca llega a 44x44');
    }

    if (errs.length) mal(`la consola tira un error: ${errs[0].slice(0, 90)}`);
    else bien('sin errores de JavaScript (la CSP no bloqueó nada)');

    await ctx.close();
  }

  /* ── lo que la página promete ── */
  titulo('lo que dice y a dónde lleva');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/invitaciones', { waitUntil: 'load' });
    await p.waitForTimeout(500);

    /* El renglón de cuántas son de clientes se cuenta de la lista. Si
       alguien lo escribe a mano, el día que entra una más dice otro
       número que el que hay dibujado. */
    const dice = await p.evaluate(() => (document.getElementById('aclara') || {}).textContent || '');
    const pal = ['cero','una','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez'];
    const esperadas = pal[cuantas] || String(cuantas);
    if (!dice.trim()) mal('no dice cuántas son ni cuáles son muestras nuestras');
    else if (!dice.toLowerCase().includes(esperadas))
      mal(`dice "${dice.trim()}" y en la lista hay ${cuantas}`);
    else bien(`el renglón se cuenta de la lista: "${dice.trim()}"`);

    /* La página promete que son las que recibieron los invitados, así que
       las que son muestras nuestras tienen que estar marcadas. */
    const enLista = await p.evaluate(() => (window.TRABAJOS || []).filter((t) => t.muestra).length);
    const marcadas = await p.evaluate(() => document.querySelectorAll('.pie .muestra').length);
    if (marcadas !== enLista)
      mal(`${enLista} son muestras nuestras y hay ${marcadas} marcadas: la página dice que son todas de clientes`);
    else bien(`las ${marcadas} muestras nuestras lo dicen en la ficha`);

    /* Sin JavaScript el botón tiene que llevar igual a algún lado, y con
       JavaScript tiene que llevar el mensaje puesto. */
    const crudo = await (await fetch(BASE + '/invitaciones')).text();
    const hrefCrudo = (crudo.match(/id="pedir"[^>]*href="([^"]+)"/) ||
                       crudo.match(/href="([^"]+)"[^>]*id="pedir"/) || [])[1] || '';
    if (!/wa\.me/.test(hrefCrudo))
      mal('sin JavaScript el botón de presupuesto no lleva a WhatsApp');
    else bien('sin JavaScript el botón lleva igual a WhatsApp');

    const href = await p.evaluate(() => (document.getElementById('pedir') || {}).href || '');
    if (!/wa\.me\/\d+\?text=.+/.test(href))
      mal('el botón de presupuesto no manda ningún mensaje: del otro lado no se sabe qué pide');
    else bien('el botón abre WhatsApp con el mensaje puesto');

    /* Todo lo que abre en otra pestaña lleva rel="noopener". */
    const sinOpener = await p.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')]
      .filter((a) => !/noopener/.test(a.rel)).length);
    if (sinOpener) mal(`${sinOpener} enlaces abren en otra pestaña sin rel="noopener"`);
    else bien('todo lo que abre en otra pestaña lleva rel="noopener"');

    /* Y la vista previa al compartir: este link se manda por WhatsApp,
       y sin tarjeta llega una dirección pelada y gris. */
    for (const et of ['og:title', 'og:description', 'og:image']) {
      if (!crudo.includes(`property="${et}"`)) mal(`falta ${et}: el link llega gris por WhatsApp`);
    }
    if (crudo.includes('property="og:image"')) {
      const img = (crudo.match(/property="og:image" content="([^"]+)"/) || [])[1];
      const ruta = (img || '').replace(/^https?:\/\/[^/]+/, '');
      const r = await fetch(BASE + ruta);
      if (!r.ok) mal(`la imagen de la vista previa da ${r.status}`);
      else bien('la vista previa al compartir está entera y la imagen existe');
    }

    await ctx.close();
  }

  /* ── el inicio lleva hasta acá ── */
  titulo('se llega desde el inicio');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const hay = await p.evaluate(() =>
      [...document.querySelectorAll('a[href]')].some((a) => /\/invitaciones$/.test(a.getAttribute('href'))));
    if (!hay) mal('desde el inicio no se llega a /invitaciones');
    else bien('el inicio tiene su enlace a /invitaciones');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
