/* ═══════════════════════════════════════════════════════════════
   LA PÁGINA PÚBLICA NO PUEDE SER INFINITA

   Medido antes de esta pasada: en un teléfono la página tenía
   21,3 PANTALLAS de scroll. El contenido era bueno; lo que sobraba
   era aire. Las veinte tarjetas de "qué incluye" solas se llevaban
   5,8 pantallas —más de un cuarto del sitio— porque abajo de 520px
   caían a UNA columna.

   Lo que se mide acá:
   1. que no vuelva a crecer sola,
   2. que las tarjetas sigan a dos columnas en un teléfono,
   3. que la galería de trabajos sea un carrusel que SE PUEDA deslizar
      y que ASOME el siguiente (un carrusel que no asoma nada parece
      una tarjeta sola y nadie lo desliza),
   4. y lo más importante de todo: que la animación atada al scroll
      NO ESCONDA NADA. `animation-timeline` recién llegó a Safari, y
      si el estado por defecto fuera invisible, en un iPhone viejo la
      página quedaría en blanco. Eso no da ningún error: se ve negro
      y listo.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8099';
const TELEFONO = { width: 390, height: 844 };

/* El tope va con aire sobre lo medido (16,6): esto no persigue un número
   exacto, ataja que alguien sume dos pantallas sin darse cuenta. */
const TOPE_PANTALLAS = 18;

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

async function abrir(browser, opciones = {}) {
  const ctx = await browser.newContext({ viewport: TELEFONO, ...opciones });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  return { ctx, p, errs };
}

/* Lo que está EN PANTALLA tiene que verse. Ese es el chequeo, y la
   parte de "en pantalla" no es un detalle: la aparición se dispara con
   un IntersectionObserver, así que un bloque que todavía no subió —o que
   ya pasó de largo— puede estar en 0 con toda la razón.
   La primera versión de esto miraba TODOS los .ap en cada parada y daba
   18 fallas… y también 20 contra `main`, o sea que no medía la página:
   medía que un scroll a los saltos le gana al observador. Una prueba que
   falla igual contra el código de antes no está midiendo el cambio. */
const invisiblesEnPantalla = (p) => p.evaluate(() => {
  const out = [];
  for (const n of document.querySelectorAll('.ap')) {
    const c = n.getBoundingClientRect();
    if (!c.height) continue;                       // no está en el flujo
    const dentro = c.top < innerHeight * 0.85 && c.bottom > innerHeight * 0.15;
    if (!dentro) continue;
    if (+getComputedStyle(n).opacity < 0.9)
      out.push((n.className || n.tagName) + ' · ' + (n.innerText || '').trim().slice(0, 30));
  }
  return out;
});

/* Recorre la página de a media pantalla, como una persona, y en cada
   parada mira solo lo que está a la vista.
   Si encuentra algo invisible NO lo anota de una: espera y vuelve a
   mirar SIN moverse. La aparición tarda un momento en dispararse, y
   agarrarla a mitad de camino no es una falla — medido: contra `main`
   esto mismo informaba 3 bloques que un segundo después estaban en
   opacidad 1. Lo que se busca es lo que se queda invisible, no lo que
   está apareciendo. */
async function recorrer(p) {
  const alto = await p.evaluate(() => document.body.scrollHeight);
  const escondidos = new Set();
  for (let y = 0; y < alto; y += 380) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(420);
    if (!(await invisiblesEnPantalla(p)).length) continue;
    await p.waitForTimeout(900);                   // que termine de aparecer
    for (const q of await invisiblesEnPantalla(p)) escondidos.add(q);
  }
  return [...escondidos];
}

(async () => {
  const browser = await chromium.launch();

  titulo('la página entra en un teléfono sin ser infinita');
  {
    const { ctx, p, errs } = await abrir(browser);
    const m = await p.evaluate(() => {
      const pant = (n) => +(n.getBoundingClientRect().height / 844).toFixed(2);
      const inc = document.querySelector('.incluye');
      const cols = inc ? getComputedStyle(inc).gridTemplateColumns.trim().split(/\s+/).length : 0;
      return {
        total: +(document.body.scrollHeight / 844).toFixed(1),
        columnas: cols,
        anchoDeMas: Math.round(document.documentElement.scrollWidth - 390),
        secciones: [...document.querySelectorAll('section')].map((s) => s.id + '=' + pant(s)),
      };
    });
    if (m.total > TOPE_PANTALLAS)
      mal(`la página creció a ${m.total} pantallas de scroll (el tope es ${TOPE_PANTALLAS})`);
    else bien(`${m.total} pantallas de scroll`);
    if (m.columnas < 2)
      mal(`el "qué incluye" volvió a una columna en el teléfono (${m.columnas}): son 20 tarjetas`);
    else bien(`el "qué incluye" va a ${m.columnas} columnas`);
    if (m.anchoDeMas > 1) mal(`algo se sale ${m.anchoDeMas}px por el costado`);
    else bien('y nada se sale por el costado');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  titulo('la galería de trabajos se desliza y asoma la siguiente');
  {
    const { ctx, p } = await abrir(browser);
    const g = await p.evaluate(() => {
      const n = document.querySelector('.trabajos');
      if (!n) return null;
      const cs = getComputedStyle(n);
      return {
        hijos: n.children.length,
        alto: Math.round(n.getBoundingClientRect().height),
        asoma: Math.round(n.scrollWidth - n.clientWidth),
        snap: cs.scrollSnapType,
        direccion: cs.flexDirection,
      };
    });
    if (!g || !g.hijos) mal('no se dibujó la galería: no se puede medir');
    else {
      if (g.direccion !== 'row') mal(`la galería volvió a apilarse (flex-direction: ${g.direccion})`);
      else bien('la galería va en fila');
      if (g.asoma < 60)
        mal(`no asoma la siguiente (${g.asoma}px): parece una tarjeta sola y nadie la desliza`);
      else bien(`asoma ${g.asoma}px de las que siguen`);
      if (!/x/.test(g.snap)) mal('sin scroll-snap queda a mitad de camino entre dos');
      else bien('y engancha al deslizar');
      if (g.alto > 844 * 1.2) mal(`la galería mide ${(g.alto / 844).toFixed(1)} pantallas`);
      else bien(`mide ${(g.alto / 844).toFixed(1)} pantallas`);
    }
    await ctx.close();
  }

  /* ── lo que de verdad importa ── */
  titulo('la animación por scroll no esconde nada');
  {
    const { ctx, p, errs } = await abrir(browser);
    const soporta = await p.evaluate(() => CSS.supports('animation-timeline', 'view()'));
    console.log('     (este navegador ' + (soporta ? 'SÍ' : 'no') + ' soporta animation-timeline)');
    const ocultos = await recorrer(p);
    if (ocultos.length)
      mal(`${ocultos.length} bloques quedaron invisibles al pasar: ${ocultos[0]}`);
    else bien('todo el contenido se ve al recorrer la página entera');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  titulo('y con "menos movimiento" tampoco');
  {
    /* Con reduced-motion el bloque @supports no aplica y la página cae al
       camino viejo (el IntersectionObserver). Apagar el movimiento no
       puede esconder contenido: es la misma regla que ya cuida
       pruebas/interfaz.js en el álbum. */
    const { ctx, p } = await abrir(browser, { reducedMotion: 'reduce' });
    const ocultos = await recorrer(p);
    if (ocultos.length)
      mal(`con menos movimiento quedaron ${ocultos.length} bloques invisibles: ${ocultos[0]}`);
    else bien('con menos movimiento se ve todo igual');
    await ctx.close();
  }

  titulo('sin JavaScript la página tampoco queda en blanco');
  {
    /* El <noscript> existe justamente para esto. Si alguien toca el .ap
       y se olvida de esa regla, la página se ve negra para el que entra
       con el JS bloqueado — y no hay ningún error que lo diga. */
    const { ctx, p } = await abrir(browser, { javaScriptEnabled: false });
    const ocultos = await invisiblesEnPantalla(p);
    if (ocultos.length)
      mal(`sin JavaScript quedaron ${ocultos.length} bloques invisibles: ${ocultos[0]}`);
    else bien('sin JavaScript se ve el contenido');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
