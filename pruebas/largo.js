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
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
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
      /* Antes acá se exigían DOS columnas, porque veinte tarjetas en una
         sola se llevaban 5,8 pantallas. El problema se arregló por el otro
         lado: son catorce y cada una dice una línea, así que entran en una
         columna ancha y legible. Lo que se mide ahora es eso — el tamaño
         de la letra — porque dos columnas de 144px con el texto en 12px
         era exactamente la queja del dueño: "no se lee ni a palos". */
      const chico = inc ? Math.min(...[...inc.querySelectorAll('p')]
        .map((e) => parseFloat(getComputedStyle(e).fontSize))) : 0;
      return {
        total: +(document.body.scrollHeight / 844).toFixed(1),
        letraInc: chico,
        tarjetas: inc ? document.querySelectorAll('.inc').length : 0,
        anchoDeMas: Math.round(document.documentElement.scrollWidth - 390),
        secciones: [...document.querySelectorAll('section')].map((s) => s.id + '=' + pant(s)),
      };
    });
    if (m.total > TOPE_PANTALLAS)
      mal(`la página creció a ${m.total} pantallas de scroll (el tope es ${TOPE_PANTALLAS})`);
    else bien(`${m.total} pantallas de scroll`);
    if (m.letraInc < 14)
      mal(`el "qué incluye" tiene el texto en ${m.letraInc}px en un teléfono: no se lee`);
    else bien(`el "qué incluye" se lee: ${m.letraInc}px en ${m.tarjetas} tarjetas`);
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

  titulo('y el celular ENTERO entra en la pantalla');
  {
    /* En un iPhone la barra del navegador se come unos 145px, así que la
       pantalla útil no es 844 sino ~700. Con el ancho fijo en 78% la
       tarjeta medía 633 y el nombre de la fiesta quedaba abajo del borde:
       se veía medio teléfono cortado, que es lo mismo que no tener la
       foto entera. El dueño lo reportó dos veces con la misma palabra.
       Se mide a 700 y a 667 (un iPhone SE), que es donde pasa; a 844
       nunca se habría visto. */
    for (const alto of [700, 667]) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: alto }, isMobile: true, hasTouch: true,
      });
      const p = await ctx.newPage();
      await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(3000);
      await p.evaluate(() => document.querySelector('.trabajos').scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(700);
      const m = await p.evaluate(() => {
        const t = document.querySelector('.trabajo');
        if (!t) return null;
        const r = t.getBoundingClientRect();
        const otra = document.querySelectorAll('.trabajo')[1];
        return {
          alto: Math.round(r.height),
          asoma: otra ? Math.round(innerWidth - otra.getBoundingClientRect().x) : 0,
        };
      });
      if (!m) { mal('no se dibujó la galería'); await ctx.close(); continue; }
      /* 88% y no 100%: entrar justo justo no sirve, porque arriba va el
         título de la sección y abajo el nombre de la invitación. */
      if (m.alto > alto * 0.88)
        mal(`en ${alto}px de alto la tarjeta mide ${m.alto}: el celular queda cortado`);
      else bien(`en ${alto}px entra entera: ${m.alto}px (${Math.round(m.alto / alto * 100)}%)`);
      /* Achicarla no puede costarle el carrusel. */
      if (m.asoma < 40) mal(`a ${alto}px dejó de asomar la siguiente (${m.asoma}px)`);
      else bien(`y sigue asomando ${m.asoma}px de la siguiente`);
      await ctx.close();
    }
  }

  titulo('la cinta de abajo pasa despacio y NUNCA se frena');
  {
    /* Hubo una versión que la aceleraba con el scroll. Bajando se apura,
       pero SUBIENDO el empujón va contra la animación: la cinta se queda
       clavada o retrocede, y eso no se lee como un efecto, se lee como
       que se colgó. El dueño lo vio en su iPhone: "el texto que pase que
       no se frene… queda horrible".
       Se mide la caja de VERDAD de la pista, que es lo que ve el ojo:
       el bucle vive en .pista y cualquier empujón vivía en su padre, así
       que mirar el transform de la pista sola no mostraría nada. */
    const { ctx, p } = await abrir(browser);
    await p.evaluate(() => document.querySelector('.marquesina').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(600);
    const donde = () => p.evaluate(() =>
      document.querySelector('.marquesina .pista').getBoundingClientRect().x);

    const antes = await donde();
    await p.waitForTimeout(700);
    const luego = await donde();
    if (luego >= antes - 5) mal(`la cinta no se mueve sola (${(luego - antes).toFixed(1)}px en 700ms)`);
    else bien(`la cinta corre sola: ${(luego - antes).toFixed(1)}px en 700ms`);

    /* Subiendo tiene que seguir yendo para el mismo lado. El tope de 1px
       es para el redondeo, no para un empujón: el empujón de la versión
       anterior medía DOCE. */
    const pasos = [];
    for (let i = 0; i < 10; i++) {
      await p.evaluate(() => scrollBy(0, -55));
      await p.waitForTimeout(90);
      pasos.push(await donde());
    }
    const atras = Math.max(...pasos.slice(1).map((v, i) => v - pasos[i]));
    if (atras > 1)
      mal(`subiendo, la cinta retrocede ${atras.toFixed(1)}px: se frena y parece colgada`);
    else bien(`subiendo, la cinta sigue para el mismo lado (lo peor: ${atras.toFixed(1)}px)`);
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
