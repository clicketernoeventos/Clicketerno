/* ══════════════════════════════════════════════════════════════════
   LA DEMOSTRACIÓN · que "probar" no sea una puerta a los datos reales.

   El botón "Probar la demostración" de la web abría la app de verdad.
   Desde ahí se veían los eventos de TODOS los clientes en "Tus eventos",
   se llegaba al panel del organizador, y el botón "cargar una fiesta de
   ejemplo" escribía un evento inventado EN LA BASE DE PRODUCCIÓN.

   Lo que se mide acá:
     · con ?demo=1 no sale un solo pedido a Supabase;
     · no queda nada guardado en el navegador del que miró;
     · no se llega al panel del organizador ni al modo administrador;
     · con otro código no se ve nada, porque en la demostración no existe;
     · y sin ?demo=1, quien no tiene claves guardadas no ve los eventos
       de nadie.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
let fallas = 0, bien = 0;
const ok = (t) => { bien++; console.log('  ✓ ' + t); };
const mal = (t, extra) => { fallas++; console.log(`  ✗ [demo] ${t}${extra ? ' → ' + extra : ''}`); };
const afirmar = (cond, t, extra) => (cond ? ok(t) : mal(t, extra));
const texto = (s) => String(s || '').replace(/\s+/g, ' ').trim();
/* Sin esto, la primera comprobación que no encuentra su elemento se lleva
   puesta la suite entera con un timeout de 30 segundos y no llegamos a ver
   qué más falla. Comparar contra el código de antes del arreglo era
   imposible. */
const leer = async (pg, sel) => {
  try { return texto(await pg.locator(sel).first().innerText({ timeout: 1500 })); }
  catch (e) { return ''; }
};

/* Una página que además anota todo lo que intenta salir a la nube. */
async function abrir(ctx) {
  const pg = await ctx.newPage();
  const espia = { nube: [], errores: [] };
  pg.on('request', (r) => { if (/supabase|\/rest\/v1\/|\/storage\/v1\//.test(r.url())) espia.nube.push(r.url()); });
  pg.on('pageerror', (e) => espia.errores.push('PAGEERROR ' + e.message));
  pg.on('console', (m) => {
    if (m.type() !== 'error') return;
    /* Un CDN que no baja es el proxy de esta máquina, no un bug del
       producto: lo que no se perdona es un error de JavaScript. */
    if (/net::ERR|Failed to load resource/.test(m.text())) return;
    espia.errores.push(m.text());
  });
  return { pg, espia };
}

(async () => {
  const browser = await chromium.launch();

  /* ── 1 · el muro en demostración: SOLO lo que ve un invitado ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/muro.html?demo=1`);
    await pg.waitForTimeout(3500);

    afirmar(await pg.evaluate(() => location.hash) === '#subir/DEMO-FIESTA',
      'el muro cae en la pantalla de subir, que es la del invitado',
      await pg.evaluate(() => location.hash));
    afirmar(await pg.locator('#cinta-demo').count() === 1,
      'se ve la cinta que avisa que es una demostración');
    afirmar(/inventad/i.test(await leer(pg, '#cinta-demo')),
      'la cinta dice que la fiesta y las fotos son inventadas');
    afirmar(await pg.locator('#dedeNuevo').count() === 1,
      'y tiene el botón para empezar de nuevo');
    afirmar(espia.nube.length === 0,
      'el muro en demostración no toca Supabase ni una vez',
      espia.nube.slice(0, 3).join(' · '));

    /* Nada de lo del organizador: es una muestra de cómo se deja una foto o
       un saludo, no el panel de quien vende el servicio. */
    for (const ruta of ['panel', 'evento/DEMO-FIESTA', 'cartel/DEMO-FIESTA', 'portada', 'invitado']) {
      await pg.evaluate(r => { location.hash = '#' + r; }, ruta);
      await pg.waitForTimeout(900);
      afirmar(await pg.evaluate(() => location.hash) === '#subir/DEMO-FIESTA',
        `#${ruta} no lleva a ningún lado del organizador`,
        await pg.evaluate(() => location.hash));
    }
    afirmar(await pg.locator('#modoAdmin').count() === 0,
      'el botón de administrador no está en la demostración');
    const enPantalla = (await leer(pg, 'body')).toLowerCase();
    afirmar(!/cre[aá] tu clave|entrar como administrador|panel del organizador/.test(enPantalla),
      'y en pantalla no aparece ninguna puerta del organizador',
      enPantalla.slice(0, 90));

    /* El ejemplo completo: dejo una dedicatoria y la veo proyectada. */
    await pg.evaluate(() => { location.hash = '#subir/DEMO-FIESTA'; });
    await pg.waitForTimeout(1200);
    const MIO = 'QUE-NO-SE-TERMINE-MAS';
    await pg.locator('.chips button').filter({ hasText: /dedicatoria/i }).click();
    await pg.waitForTimeout(500);
    await pg.locator('#zona textarea, #zona input[type=text]').first().fill(MIO);
    await pg.fill('#autor', 'Jere');
    await pg.click('#enviar');
    await pg.waitForTimeout(2500);
    afirmar(/ya est[aá] en la pantalla/i.test(await leer(pg, 'body')),
      'lo que manda el visitante va derecho a la pantalla, sin esperar aprobación',
      'con moderación puesta decía "Enviado" y no se veía nunca: se pierde el ejemplo');
    await pg.locator('#ver').click();
    await pg.waitForTimeout(2200);
    await pg.locator('[data-modo="muro"]').click({ timeout: 4000 }).catch(() => {});
    await pg.waitForTimeout(2000);
    afirmar((await leer(pg, 'body')).includes(MIO),
      'y aparece proyectado en la pantalla del salón, que es todo el punto',
      'si la cinta tapa los botones de modo, acá no se llega');

    /* Empezar de nuevo: es un modo prueba, el que entra después no tiene
       que encontrarse con lo que dejó el anterior. */
    await pg.locator('#dedeNuevo').click();
    await pg.waitForTimeout(3500);
    afirmar(await pg.evaluate(() => location.hash) === '#subir/DEMO-FIESTA',
      'empezar de nuevo devuelve a la primera pantalla');
    await pg.evaluate(() => { location.hash = '#pantalla/DEMO-FIESTA'; });
    await pg.waitForTimeout(1800);
    await pg.locator('[data-modo="muro"]').click({ timeout: 4000 }).catch(() => {});
    await pg.waitForTimeout(1800);
    afirmar(!(await leer(pg, 'body')).includes(MIO),
      'y no queda nada de lo que dejó el anterior');

    const rastro = await pg.evaluate(() => JSON.stringify(Object.keys(localStorage)));
    afirmar(rastro === '[]', 'la demostración del muro no deja nada en el navegador', rastro);
    afirmar(espia.errores.length === 0, 'el muro en demostración no tira errores de JavaScript',
      espia.errores.slice(0, 2).join(' · '));
    await ctx.close();
  }

  /* ── 2 · el rollo en demostración ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/rollo.html?demo=1`);
    await pg.waitForTimeout(2500);

    afirmar(await pg.evaluate(() => location.hash) === '#ev/DEMO-ROLLO',
      'el rollo cae adentro del rollo de ejemplo',
      await pg.evaluate(() => location.hash));
    afirmar(await pg.locator('#cinta-demo').count() === 1,
      'el rollo también avisa que es una demostración');
    afirmar(await pg.locator('#deNuevo').count() === 1,
      'y también se puede empezar de nuevo');
    afirmar(await pg.locator('#revelar').count() === 1,
      'el rollo de ejemplo arranca abierto, para poder revelarlo');

    /* revelar tiene que funcionar de mentira, sin base */
    try { await pg.click('#revelar', { timeout: 2000 }); } catch (e) { /* lo dice la de arriba */ }
    await pg.waitForTimeout(1800);
    afirmar(/revelado/i.test(await leer(pg, 'body')),
      'se puede revelar el rollo de ejemplo y el panel lo muestra revelado');
    afirmar(await pg.locator('#verAlbum').count() === 1, 'y aparece el álbum para ver');

    afirmar(espia.nube.length === 0,
      'el rollo en demostración no toca Supabase ni una vez',
      espia.nube.slice(0, 3).join(' · '));
    const rastro = await pg.evaluate(() => JSON.stringify(Object.keys(localStorage)));
    afirmar(rastro === '[]', 'la demostración del rollo no deja nada en el navegador', rastro);
    afirmar(espia.errores.length === 0, 'el rollo en demostración no tira errores de JavaScript',
      espia.errores.slice(0, 2).join(' · '));

    /* cualquier otro código no existe acá: es justo lo que no queremos que
       se pueda mirar desde una demostración */
    const { pg: pg2, espia: espia2 } = await abrir(ctx);
    await pg2.goto(`${BASE}/rollo.html?e=QUI-7FCE64&demo=1`);
    await pg2.waitForTimeout(1800);
    afirmar(/no encontr/i.test(await leer(pg2, 'body')),
      'con otro código la demostración no muestra nada');
    afirmar(espia2.nube.length === 0, 'y tampoco sale a preguntarle a la base');
    await ctx.close();
  }

  /* ── 3 · el invitado del rollo, en demostración ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/rollo.html?e=DEMO-ROLLO&demo=1`);
    await pg.waitForTimeout(2000);
    afirmar(/est[aá]s invitado/i.test(await leer(pg, 'body')),
      'el link del rollo de ejemplo abre la vista del invitado');
    try {
      await pg.fill('#nombreG', 'Pía', { timeout: 2000 });
      await pg.click('#entrar', { timeout: 2000 });
    } catch (e) { /* si no llegó ni a la pantalla del nombre, lo dice la de abajo */ }
    await pg.waitForTimeout(3000);
    afirmar(/quedan/i.test(await leer(pg, 'body')),
      'y desde ahí se llega a la cámara con su contador de fotos');
    afirmar(espia.nube.length === 0, 'el invitado de la demostración tampoco toca Supabase',
      espia.nube.slice(0, 3).join(' · '));
    await ctx.close();
  }

  /* ── 4 · sin demostración: nadie ve los eventos de otro ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const fake = crearFake('ok');
    const pg = await ctx.newPage();
    await fake.instalar(pg);
    /* tres fiestas de tres clientes distintos, ya en la base */
    fake.db.ce_eventos.push(
      { codigo: 'QUI-AAA111', nombre: 'Los 15 de Delfina', fecha: '2026-08-21', creado: 3 },
      { codigo: 'BOD-BBB222', nombre: 'Casamiento Pérez', fecha: '2026-09-02', creado: 2 },
      { codigo: 'CUM-CCC333', nombre: 'Cumple de Tomás', fecha: '2026-09-10', creado: 1 });

    await pg.goto(`${BASE}/muro.html`);
    await pg.waitForTimeout(600);
    /* entra al panel como un visitante cualquiera: clave nueva en este
       aparato, sin ninguna clave de evento guardada */
    await pg.evaluate(() => { location.hash = '#panel'; });
    await pg.waitForTimeout(900);
    try {
      await pg.fill('#pin', '1234', { timeout: 2000 });
      await pg.click('#entrar', { timeout: 2000 });
    } catch (e) { /* idem */ }
    await pg.waitForTimeout(1800);

    const visto = await leer(pg, 'body');
    afirmar(!/Delfina|P[eé]rez|Tom[aá]s/.test(visto),
      'un visitante sin claves guardadas NO ve los eventos de los clientes',
      visto.slice(0, 120));
    await ctx.close();
  }

  /* ── 5 · los botones de la web apuntan a la demostración ── */
  {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const botones = [...html.matchAll(/href="([^"]+)"[^>]*>\s*Probar la demostraci[oó]n/g)].map((m) => m[1]);
    afirmar(botones.length >= 2, 'la web tiene sus dos botones de demostración', String(botones.length));
    afirmar(botones.every((h) => /[?&]demo=1/.test(h)),
      'los dos botones entran en modo demostración, no en la app de verdad',
      botones.join(' · '));
    afirmar(botones.some((h) => /^muro\?/.test(h)) && botones.some((h) => /^rollo\?/.test(h)),
      'cada servicio muestra SU demostración: el muro el muro y el rollo el rollo',
      botones.join(' · '));
  }

  await browser.close();
  console.log(fallas ? `\nFALLARON ${fallas} de ${bien + fallas}` : `\n${bien} comprobaciones, todas bien`);
  process.exit(fallas ? 1 : 0);
})().catch((e) => { console.log('✗ [demo] se cortó: ' + e.message); process.exit(1); });
