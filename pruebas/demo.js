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
   Y que lo que manda el visitante se borre solo: la demostración se
   muestra en el teléfono del negocio, de cliente en cliente, y sin eso el
   segundo se encontraba proyectada la foto que dejó el primero.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const fs = require('fs');
const path = require('path');
const RAIZ_WEB = path.join(__dirname, '..');

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
    /* Y desde que la vitrina del inicio proyecta una fiesta de VERDAD, el
       marco le pregunta a Supabase — que desde acá no se alcanza, a
       propósito: este entorno no llega a producción. Ese "Failed to fetch"
       es del entorno, no del producto, y además está cubierto: cuando el
       evento no se puede leer, el marco se cae solo a la demostración (hay
       una comprobación de eso justo arriba). Si alguna vez falla algo de
       verdad en esa llamada, lo que se rompe es esa comprobación, no
       ésta. */
    if (/Failed to fetch/.test(m.text())) return;
    espia.errores.push(m.text());
  });
  return { pg, espia };
}

(async () => {
  /* Con cámara de mentira: sin estos dos, getUserMedia no devuelve nada, el
     rollo cae en el camino alternativo (elegir un archivo) y el disparador
     no dispara. La prueba fallaba por el navegador, no por la app. */
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

  /* ── 1 · el muro en demostración: SOLO lo que ve un invitado ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/muro.html?demo=1`);
    await pg.waitForTimeout(3500);

    afirmar(await pg.evaluate(() => location.hash) === '#pantalla/DEMO-FIESTA',
      'el muro cae en la pantalla del salón, que es lo que hay que mostrar',
      await pg.evaluate(() => location.hash));
    afirmar(await pg.locator('[data-modo="muro"][aria-pressed="true"]').count() === 1,
      'y arranca proyectando el muro, no el código QR');
    afirmar(/prob[aá] mandar/i.test(await leer(pg, '.botones-sala')),
      'con un botón que invita a probar el otro lado');
    afirmar(await pg.locator('#cinta-demo').count() === 1,
      'se ve la cinta que avisa que es una demostración');
    afirmar(/inventad/i.test(await leer(pg, '#cinta-demo')),
      'la cinta dice que la fiesta y las fotos son inventadas');
    afirmar(await pg.locator('#deNuevo').count() === 1,
      'y tiene el botón para empezar de nuevo');
    afirmar(espia.nube.length === 0,
      'el muro en demostración no toca Supabase ni una vez',
      espia.nube.slice(0, 3).join(' · '));

    /* Nada de lo del organizador: es una muestra de cómo se deja una foto o
       un saludo, no el panel de quien vende el servicio. */
    for (const ruta of ['panel', 'evento/DEMO-FIESTA', 'cartel/DEMO-FIESTA', 'portada', 'invitado']) {
      await pg.evaluate(r => { location.hash = '#' + r; }, ruta);
      await pg.waitForTimeout(900);
      afirmar(await pg.evaluate(() => location.hash) === '#pantalla/DEMO-FIESTA',
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
    await pg.locator('#deNuevo').click();
    await pg.waitForTimeout(3500);
    afirmar(await pg.evaluate(() => location.hash) === '#pantalla/DEMO-FIESTA',
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

  /* ── 2 · el rollo en demostración: derecho al álbum ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/rollo.html?demo=1`);
    await pg.waitForTimeout(5000);
    /* el revelado tiene una animación que se puede saltear tocando */
    for (let i = 0; i < 3; i++) { await pg.mouse.click(195, 420).catch(() => {}); await pg.waitForTimeout(800); }
    await pg.waitForTimeout(1500);

    const t = await leer(pg, 'body');
    afirmar(/se revel[oó] el rollo/i.test(t),
      'el rollo cae en el ÁLBUM, que es el momento del producto', t.slice(0, 90));
    afirmar(!/crear el rollo de mi fiesta/i.test(t),
      'y en ningún lado dice "crear el rollo de mi fiesta": eso es el alta, no una prueba');
    afirmar(await pg.locator('.grilla img').count() > 0, 'se ven las fotos');
    afirmar(await pg.locator('#cinta-demo').count() === 1,
      'el rollo también avisa que es una demostración');
    afirmar(await pg.locator('#deNuevo').count() === 1,
      'y también se puede empezar de nuevo');
    afirmar(espia.nube.length === 0,
      'el rollo en demostración no toca Supabase ni una vez',
      espia.nube.slice(0, 3).join(' · '));

    /* nada del organizador ni del alta */
    for (const ruta of ['nuevo', 'ev/DEMO-ROLLO', 'ajustes/DEMO-ROLLO', 'codigo', 'clave']) {
      await pg.evaluate(r => { location.hash = '#' + r; }, ruta);
      await pg.waitForTimeout(1800);
      afirmar(!/crear el rollo|ajustes del rollo|revelar el rollo/i.test(await leer(pg, 'body')),
        `#${ruta} no lleva a ningún lado del organizador`,
        (await leer(pg, 'body')).slice(0, 70));
    }

    const rastro = await pg.evaluate(() => JSON.stringify(Object.keys(localStorage)));
    afirmar(rastro === '[]', 'la demostración del rollo no deja nada en el navegador', rastro);
    afirmar(espia.errores.length === 0, 'el rollo en demostración no tira errores de JavaScript',
      espia.errores.slice(0, 2).join(' · '));

    /* y el otro lado: con ?camara=1 se ve cómo el invitado gasta sus fotos */
    const { pg: pgc, espia: espiac } = await abrir(ctx);
    await pgc.goto(`${BASE}/rollo.html?demo=1&camara=1`);
    await pgc.waitForTimeout(4000);
    afirmar(/quedan/i.test(await leer(pgc, 'body')),
      'con ?camara=1 se ve la cámara, el otro lado del rollo',
      (await leer(pgc, 'body')).slice(0, 80));
    afirmar(espiac.nube.length === 0, 'y tampoco toca Supabase');

    /* cualquier otro código no existe acá */
    const { pg: pg2, espia: espia2 } = await abrir(ctx);
    await pg2.goto(`${BASE}/rollo.html?e=QUI-7FCE64&demo=1`);
    await pg2.waitForTimeout(1800);
    afirmar(/no encontr/i.test(await leer(pg2, 'body')),
      'con otro código la demostración no muestra nada');
    afirmar(espia2.nube.length === 0, 'y tampoco sale a preguntarle a la base');
    await ctx.close();
  }

  /* ── 3 · el invitado del rollo saca una foto de verdad ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/rollo.html?demo=1&camara=1`);
    await pg.waitForTimeout(4000);
    const antes = await leer(pg, 'body');
    afirmar(/quedan/i.test(antes), 'la cámara abre con su contador', antes.slice(0, 80));
    const quedaban = (antes.match(/(\d+)\s*QUEDAN/i) || [])[1];
    await pg.locator('#disparo, .disparo, [id*=disparo]').first().click({ force: true }).catch(() => {});
    await pg.waitForTimeout(2500);
    const despues = (await leer(pg, 'body')).match(/(\d+)\s*QUEDAN/i);
    afirmar(quedaban && despues && Number(despues[1]) === Number(quedaban) - 1,
      'saca una foto y le queda una menos', `${quedaban} → ${despues && despues[1]}`);
    afirmar(espia.nube.length === 0, 'sacar la foto tampoco toca Supabase',
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

  /* ── 4 ter · la app andando adentro de la página de inicio ── */
  {
    console.log('\n── la vitrina de la página de inicio ──');
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const { pg, espia } = await abrir(ctx);
    await pg.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(800);
    await pg.evaluate(() => document.querySelector('.vitrina').scrollIntoView({ block: 'center' }));
    await pg.waitForTimeout(12000);

    const marcos = await pg.evaluate(() => [...document.querySelectorAll('#app .vivo')].map(v => {
      const f = v.querySelector('iframe');
      if (!f) return { falta: true };
      let dentro = '';
      try { dentro = (f.contentDocument.body.innerText || '').replace(/\s+/g, ' '); } catch (e) {}
      let cinta = -1;
      try { cinta = f.contentDocument.querySelectorAll('#cinta-demo').length; } catch (e) {}
      return { src: f.getAttribute('src'), listo: v.classList.contains('listo'), dentro, cinta,
               alto: Math.round(f.getBoundingClientRect().height) };
    }));
    afirmar(marcos.length === 3 && marcos.every(m => !m.falta && m.listo),
      'los tres marcos de la vitrina se encienden (muro, rollo e invitación)',
      JSON.stringify(marcos.map(m => m.src)));
    afirmar(marcos.every(m => !/404|File not found|Error code/i.test(m.dentro)),
      'y traen la app, no un 404',
      'ojo: /muro y /rollo son direcciones limpias; el servidor de pruebas tiene que resolverlas como Cloudflare');
    afirmar((marcos[0] || {}).dentro && /delfina/i.test(marcos[0].dentro),
      'en la notebook se ve el muro proyectado', (marcos[0] || {}).dentro);
    afirmar((marcos[1] || {}).dentro && /revel/i.test(marcos[1].dentro),
      'en el primer celular se ve el álbum del rollo', (marcos[1] || {}).dentro);
    afirmar((marcos[2] || {}).dentro && /invitad/i.test(marcos[2].dentro),
      'y en el segundo, una invitación', (marcos[2] || {}).dentro);
    afirmar(marcos.every(m => m.cinta === 0),
      'adentro del marco no va la cinta de demostración: es una vidriera, no algo para tocar');

    /* Al tocar se agranda ACÁ, no en otra pestaña: el visitante prueba y
       vuelve con la X sin perderse del sitio. */
    await pg.locator('.pieza.sala').click();
    await pg.waitForTimeout(4000);
    const visor = await pg.evaluate(() => {
      const v = document.getElementById('visor');
      const f = document.getElementById('marcoV');
      let dentro = '';
      try { dentro = (f.contentDocument.body.innerText || '').replace(/\s+/g, ' '); } catch (e) {}
      let salir = -1;
      try { salir = f.contentDocument.querySelectorAll('#cinta-demo a').length; } catch (e) {}
      return { clases: v.className, src: f.getAttribute('src'), dentro, salir };
    });
    afirmar(/abierto/.test(visor.clases) && /ancho/.test(visor.clases),
      'la pantalla del salón se agranda en el visor apaisado, sin salir de la web', visor.clases);
    afirmar(/delfina/i.test(visor.dentro), 'y adentro corre la demostración de verdad',
      visor.dentro.slice(0, 80));
    afirmar(visor.salir === 0,
      'sin el "Salir" de la cinta, que metería el sitio adentro de sí mismo',
      String(visor.salir));
    await pg.locator('#cerrarV').click();
    await pg.waitForTimeout(600);
    afirmar(marcos.every(m => m.alto > 200), 'y tienen alto de verdad, no cero',
      JSON.stringify(marcos.map(m => m.alto)));
    afirmar(espia.errores.length === 0, 'la página de inicio no tira errores de JavaScript',
      espia.errores.slice(0, 2).join(' · '));
    await ctx.close();
  }

  /* ── 4 quater · lo que incluye cada servicio, en la web ── */
  {
    const html = fs.readFileSync(path.join(RAIZ_WEB, 'index.html'), 'utf8');
    const listas = (html.match(/class="incluye tres"/g) || []).length;
    afirmar(listas === 2,
      'el muro y el rollo dicen qué incluyen, como las invitaciones', String(listas));
    afirmar(/id="app"/.test(html) && /href="#app"/.test(html),
      'y el apartado de la app tiene su lugar en el menú');
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

  /* ── 5 bis · las fotos del ejemplo son fotos de VERDAD ──
     Antes las dos demostraciones dibujaban un degradado con manchas de
     luz en un canvas: el que entra a "Probar la demostración" veía
     manchas, no una fiesta. Ahora salen de demo/, diez archivos del
     repo.

     Lo que se mide es que CARGUEN (naturalWidth > 0), no que el src diga
     lo que tiene que decir: un archivo que falta deja la foto en blanco
     y no tira ningún error — es la regla de la caja de 0x0. Un <img>
     roto da naturalWidth 0 y pasa cualquier cuenta. */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { pg } = await abrir(ctx);

    /* Los diez archivos tienen que estar servidos, antes de mirar
       ninguna pantalla: si faltan, lo que sigue falla por otro motivo y
       el mensaje no dice qué pasó. */
    const faltan = [];
    for (let i = 1; i <= 10; i++) {
      const n = String(i).padStart(2, '0');
      const r = await pg.request.get(`${BASE}/demo/${n}.jpg`);
      if (!r.ok()) faltan.push(`${n}.jpg → ${r.status()}`);
    }
    afirmar(faltan.length === 0, 'los diez archivos de demo/ están publicados', faltan.join(' · '));

    /* Y que no se hayan quedado en .assetsignore: ahí Cloudflare no los
       sube y el servidor de pruebas los sirve igual, así que esto pasaría
       en verde y la demostración de la web quedaría en blanco. */
    const ignora = fs.readFileSync(path.join(RAIZ_WEB, '.assetsignore'), 'utf8')
      .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    afirmar(!ignora.some((l) => /^\/?demo\/?$/.test(l) || /^demo\//.test(l)),
      'demo/ se publica (no está en .assetsignore)', ignora.filter((l) => /demo/.test(l)).join(' · '));

    /* Y que no engorden. Las bajan los que llegan del anuncio, en el
       teléfono: son diez archivos y a 1000px pesan 750 KB. Si alguna
       vez se reemplazan por las fotos sin achicar, son 13 MB y nadie se
       entera hasta la factura de datos de otro. */
    const pesoDemo = fs.readdirSync(path.join(RAIZ_WEB, 'demo'))
      .reduce((t, f) => t + fs.statSync(path.join(RAIZ_WEB, 'demo', f)).size, 0);
    afirmar(pesoDemo < 1.6 * 1024 * 1024, 'y pesan lo que tienen que pesar',
      Math.round(pesoDemo / 1024) + ' KB');

    const cargadas = async (sel) => pg.evaluate((s) => Array.from(document.querySelectorAll(s))
      .filter((i) => i.getBoundingClientRect().width > 20)
      .map((i) => ({ w: i.naturalWidth, src: i.currentSrc || i.src })), sel);

    /* El álbum del muro: nueve fotos sembradas. Hay que pasar PRIMERO
       por la pantalla del salón, que es donde se siembra la fiesta:
       entrando derecho al álbum no hay nada todavía y el único <img> que
       queda es el QR de compartir — con eso la comprobación medía la nada
       (la regla de la caja de 0x0, otra vez). */
    await pg.goto(BASE + '/muro.html?demo=1#pantalla/DEMO-FIESTA', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(4000);
    await pg.goto(BASE + '/muro.html?demo=1#album/DEMO-FIESTA', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(3500);
    const mur = (await cargadas('#app img')).filter((i) => /\/demo\/\d\d\.jpg/.test(i.src));
    afirmar(mur.length >= 9, 'el álbum del ejemplo del muro dibuja las nueve fotos', String(mur.length));
    afirmar(mur.length > 0 && mur.every((i) => i.w > 0),
      'y todas cargaron de verdad', mur.filter((i) => !i.w).map((i) => i.src.slice(-14)).join(' · '));
    afirmar(mur.some((i) => /\/demo\/\d\d\.jpg/.test(i.src)),
      'y son los archivos de demo/, no un canvas', (mur[0] || {}).src || '');

    /* La pantalla del salón proyecta la foto ENTERA, nunca la miniatura:
       una de 420px estirada a tres metros se ve horrible. Acá además no
       hay miniaturas, así que lo que se comprueba es que lo proyectado
       cargue y sea una de las de verdad. */
    await pg.goto(BASE + '/muro.html?demo=1#pantalla/DEMO-FIESTA', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(4000);
    const sala = await cargadas('.toma img, .tab-foto img, #app img');
    afirmar(sala.length > 0 && sala.every((i) => i.w > 0),
      'la pantalla del salón proyecta una foto que cargó',
      sala.length ? sala.filter((i) => !i.w).map((i) => i.src.slice(-14)).join(' · ') : 'ninguna');

    /* ── y que lo ESCRITO se vea, mezclado con las fotos ──
       El muro no es solo fotos: el invitado puede dejar una dedicatoria
       y se proyecta igual. Sembrado por tandas —primero las nueve fotos
       y después los cinco saludos— la proyección mostraba ocho fotos
       seguidas, casi un minuto, antes del primer texto: el que entra a
       probar se iba creyendo que esto no escribe.

       Se mide la RACHA MÁS LARGA de fotos seguidas en una vuelta
       entera, no "si hay un saludo en los primeros cuatro": la
       proyección puede arrancar en cualquier punto del ciclo, y
       arrancando justo en el bloque de saludos esa comprobación pasaba
       también con el orden viejo. La racha no depende de dónde arranque.

       Se avanza con la flecha, no esperando: siete segundos por cuadro
       son casi dos minutos de suite. */
    await pg.goto(BASE + '/muro.html?demo=1#pantalla/DEMO-FIESTA', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(4000);
    const clases = [];
    for (let i = 0; i < 14; i++) {
      clases.push(await pg.evaluate(() => {
        const v = document.querySelector('.toma.on');
        return v ? (v.querySelector('.placa') ? 'texto' : 'foto') : '?';
      }));
      await pg.keyboard.press('ArrowRight');
      /* 900 y no 700: el cruce entre cuadro y cuadro dura 1,4 s y con
         la espera corta se leía dos veces el mismo. */
      await pg.waitForTimeout(900);
    }
    const escritos = clases.filter((c) => c === 'texto').length;
    let racha = 0, peor = 0;
    for (const c of clases) { racha = c === 'foto' ? racha + 1 : 0; if (racha > peor) peor = racha; }
    afirmar(escritos >= 4, 'la fiesta de ejemplo tiene saludos escritos, no solo fotos',
      `${escritos} de ${clases.length}`);
    afirmar(peor <= 3, 'y van mezclados: nunca más de tres fotos seguidas sin uno escrito',
      `la racha más larga fue de ${peor}`);
    /* Y que el botón de la demostración lo diga: "Probá mandar una
       foto" es la mitad del producto. */
    /* `.dejar` lo comparten el botón de pantalla completa y éste: el
       propio muro lo busca como `:last-child` y acá hay que hacer lo
       mismo, o se mide el otro. */
    const BOTON = '.botones-sala .dejar:last-child';
    afirmar(/foto\s+o\s+un\s+saludo/i.test(await leer(pg, BOTON)),
      'y el botón invita a las dos cosas', await leer(pg, BOTON));

    /* El rollo entra derecho al álbum revelado: es la pantalla que
       vende, y es justo la que mostraba manchas. */
    await pg.goto(BASE + '/rollo.html?demo=1', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(4500);
    const rol = await cargadas('#app img');
    afirmar(rol.length >= 3, 'el álbum revelado del rollo dibuja sus fotos', String(rol.length));
    afirmar(rol.length > 0 && rol.every((i) => i.w > 0),
      'y todas cargaron de verdad', rol.filter((i) => !i.w).map((i) => i.src.slice(-14)).join(' · '));
    afirmar(rol.some((i) => /\/demo\/\d\d\.jpg/.test(i.src)),
      'y también son los archivos de demo/', (rol[0] || {}).src || '');

    await ctx.close();
  }

  /* ── 6 · lo que manda el visitante se borra solo ──
     Todo lo de la demostración ya vive en memoria y se va con la recarga.
     Lo que faltaba es MIENTRAS la pestaña sigue abierta: la demostración
     pasa de mano en mano en el teléfono del negocio.
     Con el reloj falso de Playwright, para no esperar dos minutos de
     verdad en cada corrida. */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const espia = { nube: [], errores: [] };
    pg.on('request', (r) => { if (/supabase|\/rest\/v1\/|\/storage\/v1\//.test(r.url())) espia.nube.push(r.url()); });
    pg.on('pageerror', (e) => espia.errores.push('PAGEERROR ' + e.message));
    await pg.clock.install();
    const cuantos = () => pg.evaluate(async () => (await window.indice('DEMO-FIESTA')).length);

    await pg.goto(BASE + '/muro.html?demo=1', { waitUntil: 'domcontentloaded' });
    await pg.clock.runFor(3000); await pg.waitForTimeout(1500);
    const alEntrar = await cuantos();
    afirmar(alEntrar > 0, 'la fiesta de ejemplo se siembra', String(alEntrar));

    await pg.goto(BASE + '/muro.html?demo=1#subir/DEMO-FIESTA', { waitUntil: 'domcontentloaded' });
    await pg.clock.runFor(2000); await pg.waitForTimeout(1200);
    await pg.fill('#autor', 'Tomás');
    await pg.click('[data-m="texto"]'); await pg.waitForTimeout(300);
    await pg.fill('#msg', 'Un saludo de prueba');
    await pg.click('#enviar');
    await pg.clock.runFor(1500); await pg.waitForTimeout(1200);
    const trasMandar = await cuantos();
    afirmar(trasMandar === alEntrar + 1, 'lo que manda el visitante entra al muro',
      `${alEntrar} → ${trasMandar}`);
    /* Que se borre sin avisar sería peor que dejarlo: el que mandó la foto
       la ve desaparecer y parece un producto roto. */
    afirmar(/se borra sola/i.test(await leer(pg, '#app')),
      'y le avisa al visitante que se borra sola');

    await pg.clock.fastForward('02:30');
    await pg.waitForTimeout(800);
    const despues = await cuantos();
    afirmar(despues === alEntrar, 'a los dos minutos se borró solo',
      `quedaron ${despues}, esperaba ${alEntrar}`);
    /* Y las nueve fotos y los saludos del ejemplo NO: son la fiesta. */
    afirmar(despues === alEntrar && alEntrar > 10,
      'el ejemplo sembrado sigue entero', String(despues));

    /* Y la pantalla del salón se entera: si el contador se queda con el
       número viejo, el que mira ve "15 en el muro" y catorce fotos. */
    await pg.goto(BASE + '/muro.html?demo=1#pantalla/DEMO-FIESTA', { waitUntil: 'domcontentloaded' });
    await pg.clock.runFor(3000); await pg.waitForTimeout(1200);
    /* El número y el "En el muro" salen pegados ("14EN EL MURO"), así que
       no hay borde de palabra donde ponerle \b: se saca el número. */
    const enPantalla = texto(await leer(pg, '#cuenta'));
    const nDicho = Number((enPantalla.match(/\d+/) || [])[0]);
    afirmar(nDicho === alEntrar,
      'la pantalla del salón muestra la cuenta al día', `dice ${enPantalla}, esperaba ${alEntrar}`);

    afirmar(espia.nube.length === 0, 'y en todo esto no salió un pedido a Supabase',
      espia.nube.slice(0, 2).join(' · '));
    afirmar(espia.errores.length === 0, 'sin errores de JavaScript', espia.errores.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fallas ? `\nFALLARON ${fallas} de ${bien + fallas}` : `\n${bien} comprobaciones, todas bien`);
  process.exit(fallas ? 1 : 0);
})().catch((e) => { console.log('✗ [demo] se cortó: ' + e.message); process.exit(1); });
