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

  /* ─────────── 1. el escaparate ─────────── */
  titulo('el escaparate de invitaciones, en un teléfono');
  {
    const { ctx, p, errs } = await abrir(browser);
    await p.evaluate(() => document.getElementById('trabajos')
      .scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.waitForTimeout(3000);

    const m = await p.evaluate(() => {
      const cs = [...document.querySelectorAll('.cuadrito')];
      const caja = (n) => {
        const b = n.getBoundingClientRect();
        return { x: Math.round(b.x), der: Math.round(b.right),
                 w: Math.round(b.width), h: Math.round(b.height) };
      };
      return {
        /* Un cuadradito por invitación, contado de la lista y no escrito:
           el día que entró la cuarta, la prueba vieja falló por contar y
           no por medir. */
        cuadros: cs.length,
        declaradas: (window.TRABAJOS || []).length,
        telefonos: document.querySelectorAll('#fonoTrabajo .trabajo').length,
        cajas: cs.map(caja),
        pantalla: innerWidth,
        /* Un cuadradito que se dibuja perfecto y no responde es la falla
           que ya apareció dos veces acá: se le pregunta al navegador
           quién atajaría el dedo en el centro de cada uno. */
        tapados: cs.filter((c) => {
          const b = c.getBoundingClientRect();
          const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          return !(e === c || c.contains(e));
        }).length,
        /* Y el adorno de la portadita tiene que estar ADENTRO: con un
           `gap` en unidades de contenedor escrito en el propio
           contenedor, el adorno se iba fuera y quedaban seis cuadrados
           de color vacíos, sin un solo error. */
        adornosAfuera: cs.filter((c) => {
          const a = c.querySelector('.ad-c');
          if (!a) return true;
          const rc = c.getBoundingClientRect(), ra = a.getBoundingClientRect();
          return ra.x < rc.x - .5 || ra.y < rc.y - .5
              || ra.right > rc.right + .5 || ra.bottom > rc.bottom + .5;
        }).length,
        marcos: document.querySelectorAll('#trabajos iframe').length,
        elegidos: cs.filter((c) => c.classList.contains('hoy')).length,
        nombre: (document.querySelector('#fonoTrabajo .pie-t b') || {}).textContent,
      };
    });

    if (m.telefonos !== 1) mal(`hay ${m.telefonos} teléfonos y tiene que haber uno`);
    else bien('un solo teléfono, el de la invitación elegida');

    if (!m.declaradas || m.cuadros !== m.declaradas)
      mal(`se declaran ${m.declaradas} invitaciones y hay ${m.cuadros} cuadraditos`);
    else bien(`un cuadradito por invitación: ${m.cuadros}`);

    const chico = m.cajas.length ? Math.min(...m.cajas.map((c) => Math.min(c.w, c.h))) : 0;
    if (chico < 44) mal(`el cuadradito más chico mide ${chico}px: no se acierta con el pulgar`);
    else bien(`el más chico mide ${chico}px`);

    const salidos = m.cajas.filter((c) => c.x < -1 || c.der > m.pantalla + 1).length;
    if (salidos) mal(`${salidos} cuadraditos se salen de la pantalla de ${m.pantalla}px`);
    else bien('ninguno se sale por el costado');

    if (m.tapados) mal(`${m.tapados} cuadraditos están tapados: se dibujan y no responden`);
    else bien('y a todos les llega el dedo');

    if (m.adornosAfuera)
      mal(`${m.adornosAfuera} cuadraditos tienen la portadita fuera de su caja: se ven como un color y nada más`);
    else bien('cada cuadradito muestra su portada');

    if (m.elegidos !== 1) mal(`hay ${m.elegidos} cuadraditos marcados y tiene que haber uno`);
    else bien('y uno solo marcado');

    /* Lo que de verdad se ganó contra el carrusel: un marco a la vez. */
    if (m.marcos > 1)
      mal(`la galería tiene ${m.marcos} invitaciones bajando juntas: en 4G se estorban entre ellas`);
    else bien(`baja un marco a la vez (${m.marcos})`);

    /* ── tocar un cuadradito cambia el teléfono ── */
    const antes = m.nombre;
    await p.evaluate(() => document.querySelectorAll('.cuadrito')[1].click());
    await p.waitForTimeout(2500);
    const tras = await p.evaluate(() => ({
      nombre: (document.querySelector('#fonoTrabajo .pie-t b') || {}).textContent,
      marcado: [...document.querySelectorAll('.cuadrito')].findIndex((c) => c.classList.contains('hoy')),
      elegidos: document.querySelectorAll('.cuadrito.hoy').length,
      marcos: document.querySelectorAll('#trabajos iframe').length,
      /* El teléfono se redibuja: si naciera con `.ap` quedaría invisible
         esperando a un observador que para él no vuelve a disparar. */
      opacidad: Number(getComputedStyle(document.querySelector('#fonoTrabajo .trabajo')).opacity),
      visor: document.getElementById('visor').classList.contains('abierto'),
    }));
    if (tras.nombre === antes) mal('tocar un cuadradito no cambia la invitación del teléfono');
    else bien(`tocar el segundo cambia el teléfono: ${antes} → ${tras.nombre}`);
    if (tras.marcado !== 1 || tras.elegidos !== 1)
      mal(`quedó marcado el cuadradito ${tras.marcado} (${tras.elegidos} marcados)`);
    else bien('y queda marcado sólo ése');
    if (tras.opacidad < 1) mal(`el teléfono nuevo quedó en opacidad ${tras.opacidad}: se dibuja y no se ve`);
    else bien('el teléfono nuevo se ve');
    if (tras.marcos > 1) mal(`quedó el marco anterior prendido: ${tras.marcos} marcos`);
    else bien(`y el marco anterior se apagó (${tras.marcos})`);
    if (tras.visor) mal('tocar un cuadradito abre la invitación a pantalla completa');
    else bien('tocar un cuadradito no abre el visor');

    /* ── y el teléfono SIGUE siendo la puerta al visor ── */
    await p.evaluate(() => document.querySelector('#fonoTrabajo .trabajo').click());
    await p.waitForTimeout(700);
    const abrio = await p.evaluate(() => document.getElementById('visor').classList.contains('abierto'));
    if (!abrio) mal('tocar el teléfono ya no abre la invitación');
    else bien('tocar el teléfono abre la invitación');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);

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
