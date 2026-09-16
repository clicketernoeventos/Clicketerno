/* ══════════════════════════════════════════════════════════════════
   SEGURIDAD · lo que no se puede volver a romper.

   Cada comprobación de acá abajo nació de algo que estaba mal de
   verdad en el código que estaba publicado. No son hipótesis.

   Lo de la base (que la tabla de eventos no sea una guía telefónica,
   que una foto no pueda ir a la carpeta de otro, que la clave maestra
   no se pruebe desde internet) se mide en sql/probar.sql y
   sql/rollo_probar.sql, que es donde vive esa frontera. Acá se mide lo
   del navegador y lo que se publica.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const RAIZ = path.join(__dirname, '..');
/* Si el archivo no está, devuelve vacío en vez de tirar abajo la suite
   entera: lo que falta lo dice la comprobación que corresponda, con nombre,
   y las demás siguen corriendo. */
const leer = f => { try { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }
                    catch (e) { return ''; } };
/* Sin los comentarios. Tres de estas comprobaciones fallaban por lo que los
   comentarios del código EXPLICAN: el comentario que cuenta por qué sacamos
   x-upsert contiene la palabra "x-upsert". Lo que se mide es el código. */
const sinComentarios = f => leer(f)
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

let fallas = 0, bien = 0;
const ok = t => { bien++; console.log('  ✓ ' + t); };
const mal = (t, extra) => { fallas++; console.log(`  ✗ [seguridad] ${t}${extra ? ' → ' + extra : ''}`); };
const afirmar = (c, t, extra) => (c ? ok(t) : mal(t, extra));

(async () => {
  /* ── 1 · lo que se publica: nada de código de terceros ── */
  {
    console.log('\n── el código que corre en la página ──');
    const externos = [];
    for (const f of ['index.html', 'muro.html', 'rollo.html',
                     'pia/index.html', 'pia/nueva/index.html', 'pia/listado/index.html']) {
      const html = leer(f);
      for (const m of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi))
        if (/^https?:\/\//i.test(m[1])) externos.push(`${f} → ${m[1]}`);
    }
    afirmar(externos.length === 0,
      'ninguna pantalla carga un script de otro dominio',
      externos.join(' · '));
    afirmar(fs.existsSync(path.join(RAIZ, 'lib/jszip.min.js'))
         && fs.existsSync(path.join(RAIZ, 'lib/qrcode.min.js')),
      'las librerías están en el repo, no en un CDN');

    const cab = leer('_headers');
    afirmar(cab.length > 0, 'existe _headers, que es de donde Cloudflare saca las cabeceras');
    for (const [dir, t] of [
      ["default-src 'self'", 'la CSP arranca cerrada'],
      ["object-src 'none'", 'no se pueden incrustar objetos'],
      ["base-uri 'none'", 'no se puede cambiar la base de las direcciones'],
      ['frame-ancestors', 'no se puede meter la app adentro de otro sitio'],
      ['connect-src', 'la app solo puede hablar con Supabase y con el sitio'],
    ]) afirmar(cab.includes(dir), t, dir);
    afirmar(!/script-src[^;]*https?:\/\//.test(cab),
      'la CSP no le da permiso a ningún servidor de scripts de afuera');
    afirmar(/X-Content-Type-Options:\s*nosniff/i.test(cab),
      'el navegador no adivina el tipo de los archivos subidos');

    afirmar(/<iframe[^>]+sandbox=/.test(leer('index.html')),
      'el visor de invitaciones va en una caja con llave (sandbox)');
    afirmar(!/allow-top-navigation/.test(sinComentarios('index.html')),
      'y una invitación no puede llevarse la página entera a otro lado');
  }

  /* ── 2 · el código del evento es la llave: tiene que ser una llave ── */
  {
    console.log('\n── el código del evento ──');
    const muro = sinComentarios('muro.html');
    afirmar(!/Math\.random\(\)\.toString\(16\)/.test(muro),
      'el código del evento NO sale de Math.random().toString(16)',
      'devuelve menos dígitos de los que uno cree, y se puede predecir');
    afirmar(/crypto\.getRandomValues/.test(muro) && /const nuevoCodigo/.test(muro),
      'sale de crypto.getRandomValues, como en el rollo');
    afirmar(!/x-upsert/.test(muro),
      'las subidas NO van con x-upsert',
      'con el depósito abierto, upsert = cualquiera pisa la portada ajena');
  }

  /* ── 3 · lo que el navegador realmente hace ── */
  const browser = await chromium.launch();
  {
    console.log('\n── moderar de verdad, no de mentira ──');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const fake = crearFake('ok');
    await fake.instalar(pg);
    fake.db.ce_eventos.push({ codigo: 'QUI-AAA111', nombre: 'Los 15 de Delfina',
      fecha: '2026-08-21', moderar: true, cerrado: false, creado: 1 });
    fake.db.ce_items.push(
      { id: 'a1', codigo: 'QUI-AAA111', kind: 'mensaje', url: '', autor: 'Tomás',
        texto: 'Felicidades', estado: 'aprobado', ts: 1 },
      { id: 'p1', codigo: 'QUI-AAA111', kind: 'mensaje', url: '', autor: 'Colado',
        texto: 'ESTO-ESPERA-APROBACION', estado: 'pendiente', ts: 2 });

    /* el invitado entra por el QR: no tiene ninguna clave guardada */
    const vistos = [];
    pg.on('response', async r => {
      if (!/ce_items|ce_eventos/.test(r.url())) return;
      try { vistos.push(await r.text()); } catch (e) {}
    });
    await pg.goto(`${BASE}/muro.html#album/QUI-AAA111`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2200);
    /* Las dedicatorias están en la solapa de al lado: sin abrirla, "no se
       ve el mensaje pendiente" era verdad porque no se veía NINGUNO. */
    await pg.locator('.tabs button, [data-sol]').filter({ hasText: /recuerdos/i })
      .first().click({ timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(900);
    const enPantalla = (await pg.locator('body').innerText()).toUpperCase();
    afirmar(enPantalla.includes('FELICIDADES'),
      'la dedicatoria aprobada sí se ve (si no, lo de abajo no mide nada)');
    afirmar(!enPantalla.includes('ESTO-ESPERA-APROBACION'),
      'y la que espera aprobación, al lado de esa, no');
    afirmar(/1\s+DEDICATORIA/.test(enPantalla),
      'el álbum cuenta una sola, no dos',
      (enPantalla.match(/\d+\s+DEDICATORIA\w*/) || ['?'])[0]);
    afirmar(!vistos.join(' ').includes('ESTO-ESPERA-APROBACION'),
      'y tampoco le LLEGA al navegador del invitado',
      'antes se pedía la tabla entera y se filtraba al dibujar: con la consola abierta se veía igual');
    await ctx.close();
  }

  {
    console.log('\n── el organizador sí ve lo suyo ──');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const fake = crearFake('ok');
    await fake.instalar(pg);
    await pg.goto(`${BASE}/muro.html`, { waitUntil: 'domcontentloaded' });
    /* crea su evento desde la app, así queda con su clave guardada */
    await pg.evaluate(() => { location.hash = '#panel'; });
    await pg.waitForTimeout(800);
    await pg.fill('#pin', '1234'); await pg.click('#entrar');
    await pg.waitForTimeout(900);
    await pg.fill('#n', 'Fiesta de prueba'); await pg.click('#crear');
    await pg.waitForTimeout(2000);
    const codigo = Object.keys(fake.claves)[0] || '';
    afirmar(/^[A-Z]{3}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(codigo),
      'el código que genera son seis caracteres del abecedario seguro',
      codigo);
    afirmar(Object.values(fake.claves)[0] && Object.values(fake.claves)[0].length >= 6,
      'y la clave del evento también');
    /* ahora entra a su evento: la clave tiene que viajar en la lectura */
    const conClave = [];
    pg.on('request', r => {
      if (/ce_eventos|ce_items/.test(r.url()) && r.method() === 'GET')
        conClave.push(!!r.headers()['x-clave']);
    });
    await pg.evaluate(c => { location.hash = '#evento/' + c; }, codigo);
    await pg.waitForTimeout(2200);
    afirmar(conClave.length > 0 && conClave.some(Boolean),
      'al entrar a su evento, la app manda la clave en la lectura',
      'sin esto, con la tabla cerrada el organizador deja de ver su propia fiesta');
    await ctx.close();
  }

  /* ── 4 · la web tiene que andar ANTES de correr blindaje.sql ── */
  {
    console.log('\n── el día de antes de tocar la base ──');
    /* La web se sube sola cuando se hace push; el SQL lo corre una persona
       en el editor de Supabase, más tarde. Entre una cosa y la otra la app
       nueva habla con la base vieja: si no supiera volver al camino de
       antes, ese rato sería la web caída para todos los clientes. */
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const fake = crearFake('ok');
    await fake.instalar(pg);
    /* la base vieja: esas funciones todavía no existen */
    await pg.route('**/rest/v1/rpc/ce_evento_publico', r => r.fulfill({
      status: 404, contentType: 'application/json',
      body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) }));
    await pg.route('**/rest/v1/rpc/ce_items_de', r => r.fulfill({
      status: 404, contentType: 'application/json',
      body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) }));
    fake.db.ce_eventos.push({ codigo: 'QUI-VIEJA1', nombre: 'Fiesta de antes',
      fecha: '2026-08-21', moderar: false, cerrado: false, creado: 1 });
    fake.db.ce_items.push({ id: 'v1', codigo: 'QUI-VIEJA1', kind: 'mensaje', url: '',
      autor: 'Tomás', texto: 'SALUDO-DE-PRUEBA', estado: 'aprobado', ts: 1 });
    const rotos = [];
    pg.on('pageerror', e => rotos.push(e.message));
    await pg.goto(`${BASE}/muro.html#album/QUI-VIEJA1`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2500);
    let txt = await pg.locator('body').innerText();
    afirmar(txt.includes('Fiesta de antes'),
      'con la base vieja el álbum abre igual', txt.replace(/\s+/g, ' ').slice(0, 90));
    await pg.locator('.tabs button, [data-sol]').filter({ hasText: /recuerdos/i })
      .first().click({ timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(900);
    txt = await pg.locator('body').innerText();
    afirmar(txt.includes('SALUDO-DE-PRUEBA'),
      'y trae los recuerdos', txt.replace(/\s+/g, ' ').slice(0, 120));
    afirmar(rotos.length === 0, 'sin un solo error de JavaScript', rotos.slice(0, 2).join(' · '));

    /* y lo mismo del lado del rollo */
    const pg2 = await ctx.newPage();
    await pg2.route('**/rest/v1/rpc/ce_evento_publico', r => r.fulfill({
      status: 404, contentType: 'application/json',
      body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) }));
    await pg2.route('**/rest/v1/ce_eventos**', r => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([{ codigo: 'QUI-VIEJA1', nombre: 'Fiesta de antes',
        tono: '#D9AE72', camara: true, cerrado: false, cupo_fotos: 24 }]) }));
    await pg2.goto(`${BASE}/rollo.html?e=QUI-VIEJA1`, { waitUntil: 'domcontentloaded' });
    await pg2.waitForTimeout(2200);
    afirmar((await pg2.locator('body').innerText()).includes('Fiesta de antes'),
      'el rollo también abre con la base vieja',
      (await pg2.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 90));
    await ctx.close();
  }

  /* ── 5 · la lista de invitados de una invitación ── */
  {
    console.log('\n── el panel de invitados de una invitación ──');
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    await pg.route('**/script.google.com/**', r => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ invitados: [{
        'Persona 1 - Nombre': '<img src=x onerror="window.__XSS_LISTADO=1">',
        'Persona 1 - Apellido': 'Colado',
        '¿Confirma?': 'Confirmo',
      }] }),
    }));
    await pg.goto(`${BASE}/pia/listado/index.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(600);
    /* El portón pide el correo de la clienta. No es una traba de verdad —el
       correo está escrito en la página y cualquiera lo lee— pero hay que
       pasarlo para llegar a la tabla, que es lo que se está midiendo. Sin
       esto la prueba pasaba sin dibujar una sola fila: pasaba siempre, que
       es lo mismo que no probar nada. */
    const correo = await pg.evaluate(() => (window.CONFIG || {}).clienteEmail
      || (document.documentElement.innerHTML.match(/clienteEmail:\s*"([^"]+)"/) || [])[1] || '');
    await pg.fill('#email-input', correo);
    await pg.click('#gate-btn');
    await pg.waitForTimeout(2000);
    afirmar(await pg.locator('#tabla-body tr').count() > 0,
      'la tabla de invitados llegó a dibujarse (si no, lo de abajo no mide nada)');
    afirmar(!(await pg.evaluate(() => !!window.__XSS_LISTADO)),
      'un invitado que se anota con código adentro del nombre NO lo ejecuta',
      'la organizadora abre esta pantalla: era su navegador el que corría eso');
    afirmar((await pg.locator('body').innerText()).includes('onerror'),
      'el texto raro se ve como texto, que es lo que corresponde');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas ? `\nFALLARON ${fallas} de ${bien + fallas}` : `\n${bien} comprobaciones, todas bien`);
  process.exit(fallas ? 1 : 0);
})().catch(e => { console.log('✗ [seguridad] se cortó: ' + e.message); process.exit(1); });
