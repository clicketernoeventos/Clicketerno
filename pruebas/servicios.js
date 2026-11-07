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
        /* Un puntito por ficha, no "tres": el día que entró la cuarta
           invitación esta prueba falló por contar, no por medir. Es la
           misma lección que la de los clicks del alta del rollo. */
        fichas: g.children.length,
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

    if (m.puntos !== m.fichas || !m.puntosSeVen)
      mal(`los puntitos no coinciden con las fichas: ${m.puntos} puntos para ${m.fichas} invitaciones (¿se ven? ${m.puntosSeVen})`);
    else bien(`un puntito por invitación: ${m.puntos}`);

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

    /* Ahora hay UNA pantalla siempre abierta —la de la pastilla activa— y
       las otras dos ni existen. Lo que no puede pasar es que haya más de
       una, ni un marco prendido abajo de una pastilla que nadie eligió:
       eso es la visita entera pagando algo que no ve. */
    const arranque = await p.evaluate(() => ({
      abiertos: [...document.querySelectorAll('.prueba')].filter((x) => !x.hidden).map((x) => x.dataset.de),
      escondidosConMarco: [...document.querySelectorAll('.prueba')]
        .filter((x) => x.hidden).reduce((n, x) => n + x.querySelectorAll('iframe').length, 0),
      pastillas: [...document.querySelectorAll('.pastilla[data-prueba]')].map((b) => b.dataset.prueba),
      activas: document.querySelectorAll('.pastilla.activa').length,
    }));
    if (arranque.pastillas.length !== 3)
      mal(`la fila de pastillas tiene ${arranque.pastillas.length} y tienen que ser 3`);
    else bien('las tres pastillas: ' + arranque.pastillas.join(' · '));
    if (arranque.abiertos.length !== 1)
      mal(`al cargar hay ${arranque.abiertos.length} pantallas abiertas y tiene que haber 1`);
    else bien('al cargar hay una sola pantalla, la de ' + arranque.abiertos[0]);
    if (arranque.activas !== 1) mal(`${arranque.activas} pastillas marcadas como activas`);
    if (arranque.escondidosConMarco)
      mal(`${arranque.escondidosConMarco} marcos prendidos abajo de una pastilla que nadie eligió`);

    /* Un control que no se puede tocar con el pulgar no existe. */
    const chicas = await p.evaluate(() =>
      [...document.querySelectorAll('.pastilla')].map((b) => {
        const c = b.getBoundingClientRect();
        return { t: b.textContent.trim(), w: Math.round(c.width), h: Math.round(c.height) };
      }).filter((c) => c.h < 44 || c.w < 44));
    if (chicas.length) mal('pastillas que no llegan a 44px: ' + JSON.stringify(chicas));
    else bien('las pastillas llegan a 44px');

    for (const [cual, dentro] of [['muro', 'muro'], ['rollo', 'rollo'], ['invitaciones', 'pia/nueva']]) {
      await p.evaluate(() => document.getElementById('servicios').scrollIntoView());
      await p.waitForTimeout(300);
      const hayPastilla = await p.evaluate((c) =>
        !!document.querySelector(`.pastilla[data-prueba="${c}"]`), cual);
      if (!hayPastilla) { mal(`no hay pastilla de ${cual}: la fila dejó de ser la navegación de la sección`); continue; }
      await p.click(`.pastilla[data-prueba="${cual}"]`);
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

    /* Cambiar de pastilla apaga el marco de la que se va: un muro
       demostración latiendo cada siete segundos abajo de una pantalla que
       ya nadie mira es la visita entera pagando algo que no ve. Y queda
       UN marco, el de la que se eligió. */
    await p.click('.pastilla[data-prueba="invitaciones"]');
    await p.waitForTimeout(600);
    const tras = await p.evaluate(() => ({
      abiertos: [...document.querySelectorAll('.prueba')].filter((x) => !x.hidden).map((x) => x.dataset.de),
      marcos: document.querySelectorAll('.prueba iframe').length,
      activa: (document.querySelector('.pastilla.activa') || {}).dataset
        ? document.querySelector('.pastilla.activa').dataset.prueba : null,
      activas: document.querySelectorAll('.pastilla.activa').length,
    }));
    if (tras.abiertos.join() !== 'invitaciones')
      mal('la pastilla no cambió la pantalla: quedó ' + JSON.stringify(tras.abiertos));
    else bien('la pastilla cambia la pantalla de abajo');
    if (tras.activas !== 1 || tras.activa !== 'invitaciones')
      mal(`la pastilla marcada no es la que se tocó (${tras.activas} activas, ${tras.activa})`);
    else bien('se marca la pastilla que se tocó, y sólo esa');
    if (tras.marcos > 1) mal(`quedaron ${tras.marcos} marcos prendidos a la vez`);
    else bien('al cambiar, el marco del anterior se apaga');

    if (errs.length) mal('error de JavaScript: ' + errs[0]);
    await ctx.close();
  }

  /* ─────────── 3. sin JavaScript ─────────── */
  titulo('sin JavaScript queda una pantalla abierta y sus enlaces vivos');
  {
    const { ctx, p } = await abrir(browser, { javaScriptEnabled: false });
    /* Sin JavaScript las pastillas no conmutan nada, así que el estado por
       defecto TIENE que ser el bueno: una pantalla abierta, no tres
       escondidas y la sección vacía. */
    const sinJS = await p.evaluate(() =>
      [...document.querySelectorAll('.prueba')].filter((x) => !x.hidden).map((x) => x.dataset.de));
    if (sinJS.length !== 1)
      mal(`sin JavaScript quedan ${sinJS.length} pantallas abiertas y tiene que quedar 1`);
    else bien('sin JavaScript queda abierta la de ' + sinJS[0]);
    const destinos = await p.evaluate(() =>
      [...document.querySelectorAll('.prueba .pr-detalle')].map((a) => a.getAttribute('href')));
    if (destinos.length !== 3 || destinos.some((h) => !h || h[0] !== '#'))
      mal('alguna pantalla se quedó sin enlace a su sección: ' + JSON.stringify(destinos));
    else bien('las tres llevan a su sección sin JavaScript: ' + destinos.join(' · '));
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
