/* ═══════════════════════════════════════════════════════════════
   LA PRUEBA DEL SERVICIO, Y EL CARRUSEL QUE NO SE MOVÍA

   Dos cosas que reportó el dueño mirando la página en su iPhone
   (12/10/2026), y las dos se ven perfectas en un escritorio:

   1. «Esto se ve cortado y no se mueven para las otras
      invitaciones.» Eran DOS fallas que se tapaban entre sí:

      · El carrusel medía 342px en una pantalla de 390. La regla
        base le pone `width:100%`, que es el 100% del .wrap YA sin
        su padding; con los márgenes negativos encima quedaba un
        borde invisible a 48px del costado y la tarjeta siguiente
        se cortaba contra él. Se lee como una foto mal recortada,
        no como algo que se desliza.
      · Y el deslizado ABRÍA la invitación a pantalla completa: el
        dedo arranca arriba de una tarjeta, que tiene su `click`.
        Desde afuera eso es exactamente «no se mueve».

   2. «Que cada servicio donde dice ver más se abra y ahí esté la
      prueba del servicio. Es lo más importante.» Antes "Ver más"
      bajaba a un bloque de TEXTO. El que llega de un anuncio
      quiere ver el producto andando, no leer sobre él.

   Lo que se cuida acá, y por qué cada cosa:

   · El marco de la prueba NO se enciende hasta que alguien la
     abre, y se APAGA al cerrar. Tres marcos más en la carga
     inicial es lo que ya costó caro en la vitrina: en 4G se
     estorban entre ellos y no termina de cargar ninguno.
   · Sin JavaScript la tarjeta sigue llevando a algún lado.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const TELEFONO = { width: 390, height: 844 };

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

async function abrir(browser, opciones = {}) {
  const ctx = await browser.newContext({
    viewport: TELEFONO, isMobile: true, hasTouch: true, ...opciones,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  return { ctx, p, errs };
}

const aServicios = async (p) => {
  await p.evaluate(() => document.getElementById('servicios').scrollIntoView());
  await p.waitForTimeout(500);
};

(async () => {
  const browser = await chromium.launch();

  /* ─────────── 1. el carrusel ─────────── */
  titulo('la galería de trabajos, en un teléfono');
  {
    const { ctx, p, errs } = await abrir(browser);
    await p.evaluate(() => document.getElementById('trabajos').scrollIntoView());
    await p.waitForTimeout(900);

    const m = await p.evaluate(() => {
      const g = document.querySelector('.trabajos');
      const r = g.getBoundingClientRect();
      const tar = [...g.children].map((t) => {
        const b = t.getBoundingClientRect();
        return { x: Math.round(b.x), der: Math.round(b.right), w: Math.round(b.width) };
      });
      return {
        x: Math.round(r.x), der: Math.round(r.right), ancho: Math.round(r.width),
        pantalla: innerWidth, desplaza: g.scrollWidth > g.clientWidth + 10,
        puntos: document.querySelectorAll('#puntosTrabajos span').length,
        /* Con `?.` porque contra el código anterior ese elemento no existe:
           una prueba que revienta no informa nada, y lo que hay que ver es
           la falla, no una excepción. */
        puntosSeVen: !!document.getElementById('puntosTrabajos')
          && getComputedStyle(document.getElementById('puntosTrabajos')).display !== 'none',
        tar,
      };
    });

    /* El carrusel tiene que llegar a los DOS bordes: si corta antes, lo
       que asoma del siguiente no parece "hay más", parece un recorte. */
    if (m.x > 1 || m.der < m.pantalla - 1)
      mal(`el carrusel va de ${m.x} a ${m.der} en una pantalla de ${m.pantalla}: queda cortado contra un borde invisible`);
    else bien(`el carrusel llega a los dos bordes (0 → ${m.der} de ${m.pantalla})`);

    if (!m.desplaza) mal('la galería no se desliza: no hay nada de más para correr');
    else bien('la galería se desliza');

    /* Y el siguiente tiene que ASOMAR de verdad adentro de la pantalla. */
    const asoma = m.tar[1] ? m.pantalla - m.tar[1].x : 0;
    if (asoma < 20)
      mal(`la segunda tarjeta asoma ${asoma}px: nadie va a saber que hay más`);
    else bien(`la segunda tarjeta asoma ${asoma}px`);

    if (m.puntos !== 3 || !m.puntosSeVen)
      mal(`los puntitos del carrusel: ${m.puntos}, ¿se ven? ${m.puntosSeVen}`);
    else bien('los tres puntitos dicen cuántas invitaciones hay');

    /* ── un deslizado no puede abrir el visor ── */
    const caja = await p.evaluate(() => {
      const r = document.querySelector('.trabajo').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await p.mouse.move(caja.x, caja.y);
    await p.mouse.down();
    for (let i = 1; i <= 6; i++) await p.mouse.move(caja.x - i * 18, caja.y);
    await p.mouse.up();
    await p.waitForTimeout(600);
    const abrioVisor = await p.evaluate(() => document.getElementById('visor').classList.contains('abierto'));
    if (abrioVisor) mal('deslizar la galería ABRE la invitación a pantalla completa: por eso parece que no se mueve');
    else bien('deslizar la galería no abre nada');

    /* Pero un toque limpio SÍ tiene que abrirla. */
    await p.evaluate(() => { document.getElementById('visor').classList.remove('abierto'); });
    await p.mouse.click(caja.x, caja.y);
    await p.waitForTimeout(600);
    const abrioAlTocar = await p.evaluate(() => document.getElementById('visor').classList.contains('abierto'));
    if (!abrioAlTocar) mal('tocar una invitación ya no la abre');
    else bien('tocar una invitación sigue abriéndola');

    if (errs.length) mal('error de JavaScript: ' + errs[0]);
    await ctx.close();
  }

  /* ─────────── 2. la prueba de cada servicio ─────────── */
  titulo('cada tarjeta abre el servicio ANDANDO');
  {
    const { ctx, p, errs } = await abrir(browser);
    await aServicios(p);

    /* Antes de tocar nada no puede haber ni un marco escondido. */
    const antes = await p.evaluate(() =>
      document.querySelectorAll('.prueba iframe').length);
    if (antes) mal(`${antes} marcos de la prueba ya estaban cargando sin que nadie abriera nada`);
    else bien('ningún marco de la prueba se carga hasta que se abre');

    for (const [cual, dentro] of [['muro', 'muro'], ['rollo', 'rollo'], ['invitaciones', 'pia/nueva']]) {
      await p.evaluate(() => document.getElementById('servicios').scrollIntoView());
      await p.waitForTimeout(300);
      const hayTarjeta = await p.evaluate((c) =>
        !!document.querySelector(`.serv[data-prueba="${c}"]`), cual);
      if (!hayTarjeta) { mal(`la tarjeta de ${cual} no abre ninguna prueba: "Ver más" sigue siendo un ancla a un bloque de texto`); continue; }
      await p.click(`.serv[data-prueba="${cual}"]`);
      await p.waitForTimeout(500);

      const abierto = await p.evaluate((c) => {
        const panel = document.getElementById('pr-' + c);
        if (!panel) return null;
        const capa = panel.querySelector('.vivo');
        return {
          visible: !panel.hidden,
          abiertos: [...document.querySelectorAll('.prueba')].filter((x) => !x.hidden).length,
          otrosMarcos: [...document.querySelectorAll('.prueba')]
            .filter((x) => x.hidden).reduce((n, x) => n + x.querySelectorAll('iframe').length, 0),
          direccion: capa ? capa.dataset.vivo : '',
          botones: panel.querySelectorAll('.pr-botones a,.pr-botones button').length,
        };
      }, cual);

      if (!abierto) { mal(`la tarjeta de ${cual} no tiene prueba que abrir`); continue; }
      if (!abierto.visible) mal(`la tarjeta de ${cual} no abre su prueba`);
      else bien(`${cual}: la prueba se abre`);
      if (abierto.abiertos !== 1) mal(`quedaron ${abierto.abiertos} pruebas abiertas a la vez`);
      if (abierto.otrosMarcos)
        mal(`al cambiar de servicio quedaron ${abierto.otrosMarcos} marcos prendidos abajo de un panel cerrado`);
      if (!abierto.direccion.includes(dentro))
        mal(`la prueba de ${cual} no apunta a su servicio (${abierto.direccion})`);
      if (abierto.botones < 2)
        mal(`la prueba de ${cual} tiene ${abierto.botones} botones: faltan el de probarlo y el de presupuesto`);

      /* Lo que importa de verdad: que el servicio CARGUE ahí adentro. */
      let cargo = false;
      for (let i = 0; i < 24 && !cargo; i++) {
        await p.waitForTimeout(500);
        cargo = await p.evaluate((c) => {
          const capa = document.querySelector('#pr-' + c + ' .vivo');
          return !!(capa && capa.classList.contains('listo') && capa.querySelector('iframe'));
        }, cual);
      }
      if (!cargo) mal(`la prueba de ${cual} no llegó a mostrar el servicio andando`);
      else bien(`${cual}: el servicio carga adentro del panel`);
    }

    /* Cerrar apaga el marco: un muro demostración latiendo cada siete
       segundos abajo de un panel cerrado es la visita entera pagando algo
       que nadie está mirando. */
    const hayCerrar = await p.evaluate(() => !!document.querySelector('#pr-invitaciones .pr-cerrar'));
    if (!hayCerrar) mal('la prueba no tiene cómo cerrarse');
    else await p.click('#pr-invitaciones .pr-cerrar');
    await p.waitForTimeout(400);
    const tras = await p.evaluate(() => ({
      cerrado: !!(document.getElementById('pr-invitaciones') || {}).hidden,
      marcos: document.querySelectorAll('.prueba iframe').length,
    }));
    if (!tras.cerrado) mal('el ✕ no cierra la prueba');
    else bien('el ✕ cierra la prueba');
    if (tras.marcos) mal(`cerrada la prueba quedaron ${tras.marcos} marcos prendidos`);
    else bien('al cerrar, el marco se apaga');

    if (errs.length) mal('error de JavaScript: ' + errs[0]);
    await ctx.close();
  }

  /* ─────────── 3. sin JavaScript ─────────── */
  titulo('sin JavaScript la tarjeta sigue llevando a algún lado');
  {
    const { ctx, p } = await abrir(browser, { javaScriptEnabled: false });
    const destinos = await p.evaluate(() =>
      [...document.querySelectorAll('.serv[data-prueba]')].map((a) => a.getAttribute('href')));
    if (destinos.length !== 3 || destinos.some((h) => !h || h[0] !== '#'))
      mal('alguna tarjeta de servicio se quedó sin destino: ' + JSON.stringify(destinos));
    else bien('las tres tarjetas llevan a su sección sin JavaScript: ' + destinos.join(' · '));
    /* Y ese destino tiene que EXISTIR: un ancla a una sección que no está
       es un botón que no hace nada y no da ningún error. */
    const vivos = await p.evaluate((hs) => hs.filter((h) => document.querySelector(h)).length, destinos);
    if (vivos !== destinos.length)
      mal(`${destinos.length - vivos} de esos destinos no existen en la página`);
    else bien('las tres secciones a las que lleva existen');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
