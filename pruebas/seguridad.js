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
/* Escribir y tocar sin que la suite entera se caiga si el elemento no está:
   la comprobación que corresponda lo dice con nombre, y las demás siguen. */
const escribir = async (pg, sel, v) => { try { await pg.fill(sel, v, { timeout: 2500 }); } catch (e) {} };
const tocar = async (pg, sel) => { try { await pg.click(sel, { timeout: 2500 }); } catch (e) {} };
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
    await pg.locator('#aceptoT').check().catch(()=>{}); await pg.fill('#n', 'Fiesta de prueba'); await pg.click('#crear');
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
    /* La base vieja es la ABIERTA: sin blindaje.sql las tablas se leían sin
       clave. Con el falso cerrado esto simulaba una base que nunca existió
       (sin funciones Y cerrada) y la prueba se contradecía sola. */
    const fake = crearFake('ok', false);
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

  /* ── 4 bis · y DESPUÉS de correr blindaje.sql ── */
  {
    console.log('\n── el día después de cerrar la base ──');
    /* El otro lado del mismo asunto, y el que importa para el orden: con la
       base ya cerrada, el que llega por el QR no tiene clave y el select
       directo a las tablas le devuelve CERO filas. Si la app no supiera
       pedir por función, el invitado no podría subir, la pantalla del salón
       no proyectaría y la cámara no abriría: la fiesta entera.
       Por eso el orden no es libre. Primero la web, después el SQL. */
    const EV = { codigo: 'QUI-DESP01', nombre: 'Los 15 de Delfina', fecha: '2026-08-21',
                 tono: '#D9AE72', moderar: false, cerrado: false, camara: true,
                 cupo_fotos: 24, revelado: false, creado: 1 };
    const IT = [{ id: 'a1', codigo: 'QUI-DESP01', kind: 'mensaje', url: '', autor: 'Tomás',
                  texto: 'SALUDO-DE-PRUEBA', estado: 'aprobado', ts: 1 }];
    /* Playwright le da prioridad a la ruta registrada ÚLTIMA: el comodín va
       primero y lo específico después. Al revés, el comodín se come todo y
       la prueba mide cualquier cosa (me pasó escribiéndola). */
    const cerrada = async pg => {
      await pg.route('**/storage/v1/**', r => r.fulfill({ status: 200,
        contentType: 'application/json', body: '[]' }));
      await pg.route('**/rest/v1/**', r => {
        if (/\/rpc\//.test(r.request().url()))
          return r.fulfill({ status: 404, contentType: 'application/json',
            body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) });
        return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });
      await pg.route('**/rest/v1/rpc/ce_evento_publico', r => r.fulfill({ status: 200,
        contentType: 'application/json', body: JSON.stringify(EV) }));
      await pg.route('**/rest/v1/rpc/ce_items_de', r => r.fulfill({ status: 200,
        contentType: 'application/json', body: JSON.stringify(IT) }));
    };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    for (const [que, ruta, espero] of [
      ['el invitado puede subir',        'muro.html#subir/QUI-DESP01',    /sub[ií] al muro/i],
      ['el álbum abre',                  'muro.html#album/QUI-DESP01',    /álbum digital/i],
      ['la pantalla del salón proyecta', 'muro.html#pantalla/QUI-DESP01', /los 15 de delfina/i],
      ['la cámara del rollo abre',       'rollo.html?e=QUI-DESP01',       /est[aá]s invitado/i],
    ]) {
      const pg = await ctx.newPage();
      await cerrada(pg);
      await pg.goto(`${BASE}/${ruta}`, { waitUntil: 'domcontentloaded' });
      await pg.waitForTimeout(2200);
      const t = await pg.locator('body').innerText();
      afirmar(espero.test(t), 'con la base ya cerrada, ' + que, t.replace(/\s+/g, ' ').slice(0, 90));
      await pg.close();
    }
    await ctx.close();
  }

  /* ── 5 · la lista de invitados de una invitación ── */
  {
    console.log('\n── el panel de invitados de una invitación ──');
    const CLAVE = 'clave-de-prueba-larga';
    const FILA = {
      'Persona 1 - Nombre': '<img src=x onerror="window.__XSS_LISTADO=1">',
      'Persona 1 - Apellido': 'Colado',
      '¿Confirma?': 'Confirmo',
    };
    /* La planilla de mentira se porta como el Apps Script nuevo: sin la
       clave no entrega nada. */
    const montar = async pg => {
      const pedidos = [];
      pg.on('request', r => { if (/script\.google\.com/.test(r.url())) pedidos.push(r.url()); });
      await pg.route('**/script.google.com/**', r => {
        const u = new URL(r.request().url());
        if (u.searchParams.get('confirmado') !== null)
          return r.fulfill({ status: 200, contentType: 'application/json',
            body: JSON.stringify({ ok: true }) });
        if (u.searchParams.get('clave') !== CLAVE)
          return r.fulfill({ status: 200, contentType: 'application/json',
            body: JSON.stringify({ error: 'clave', mensaje: 'Clave incorrecta.' }) });
        return r.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ invitados: [FILA] }) });
      });
      return pedidos;
    };

    afirmar(!leer('pia/listado/index.html').includes('clienteEmail'),
      'la clave del listado NO está escrita en la página',
      'el portón de antes comparaba contra un correo que estaba ahí a la vista');

    const ctx = await browser.newContext();

    /* con la clave mal: ni una fila */
    const malo = await ctx.newPage();
    await montar(malo);
    await malo.goto(`${BASE}/pia/listado/index.html`, { waitUntil: 'domcontentloaded' });
    await malo.waitForTimeout(500);
    await escribir(malo, '#clave-input', 'la-que-no-es');
    await tocar(malo, '#gate-btn');
    await malo.waitForTimeout(1200);
    afirmar(await malo.locator('#tabla-body tr').count() === 0,
      'con la clave equivocada no se ve ni una fila');
    afirmar(!(await malo.locator('body').innerText()).includes('Colado'),
      'ni un apellido suelto');
    await malo.close();

    /* con la clave bien: entra, y el texto raro es texto */
    const pg = await ctx.newPage();
    const pedidos = await montar(pg);
    await pg.goto(`${BASE}/pia/listado/index.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(500);
    await escribir(pg, '#clave-input', CLAVE);
    await tocar(pg, '#gate-btn');
    await pg.waitForTimeout(1600);
    afirmar(await pg.locator('#tabla-body tr').count() > 0,
      'con la clave correcta sí entra (si no, lo de abajo no mide nada)');
    /* pedidos.length > 0: sin eso, un .every() sobre una lista vacía da
       true y la comprobación pasaba aunque no hubiera habido un solo
       pedido. Pasaba siempre, o sea que no probaba nada. */
    afirmar(pedidos.length > 0 && pedidos.every(u => u.includes('clave=')),
      'y cada pedido a la planilla lleva la clave',
      pedidos.join(' · ') || 'no hubo ningún pedido');
    afirmar(!(await pg.evaluate(() => !!window.__XSS_LISTADO)),
      'un invitado que se anota con código adentro del nombre NO lo ejecuta',
      'la organizadora abre esta pantalla: era su navegador el que corría eso');
    afirmar((await pg.locator('body').innerText()).includes('onerror'),
      'el texto raro se ve como texto, que es lo que corresponde');
    await pg.close();

    /* la invitación pregunta sí o no, no se lleva la lista */
    const inv = await ctx.newPage();
    const pedidosInv = await montar(inv);
    await inv.goto(`${BASE}/pia/nueva/index.html`, { waitUntil: 'domcontentloaded' });
    await inv.waitForTimeout(1200);
    const respuesta = await inv.evaluate(() => (typeof llegó === 'function') ? llegó('Delfina') : null);
    afirmar(respuesta === true, 'la invitación puede comprobar si llegó la confirmación');
    afirmar(pedidosInv.length > 0 && pedidosInv.every(u => u.includes('confirmado=')),
      'y lo pregunta por nombre, sin bajarse la lista de invitados',
      pedidosInv.join(' · '));
    afirmar(!/fetch\(CONFIG\.endpoint,\s*\{cache/.test(leer('pia/nueva/index.html')),
      'ya no queda el pedido que se traía la planilla entera');

    /* El Apps Script lo pega una persona a mano, más tarde. Entre que sube
       la web y eso pasa, las dos pantallas hablan con el script viejo: que
       no se rompan. */
    const viejo = r => r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ invitados: [{ 'Persona 1 - Nombre': 'Delfina',
                                           'Persona 1 - Apellido': 'Pérez',
                                           '¿Confirma?': 'Confirmo' }] }) });
    const vp = await ctx.newPage();
    await vp.route('**/script.google.com/**', viejo);
    await vp.goto(`${BASE}/pia/listado/index.html`, { waitUntil: 'domcontentloaded' });
    await vp.waitForTimeout(500);
    await escribir(vp, '#clave-input', 'loquesea');
    await tocar(vp, '#gate-btn');
    await vp.waitForTimeout(1500);
    afirmar(await vp.locator('#tabla-body tr').count() > 0,
      'con el Apps Script todavía viejo, el panel sigue andando',
      'no se rompe nada en el rato entre subir la web y pegar el script');
    const vi = await ctx.newPage();
    await vi.route('**/script.google.com/**', viejo);
    await vi.goto(`${BASE}/pia/nueva/index.html`, { waitUntil: 'domcontentloaded' });
    await vi.waitForTimeout(1200);
    afirmar(await vi.evaluate(() => (typeof llegó === 'function') ? llegó('Delfina') : 'no existe') === null,
      'y la invitación dice que no pudo comprobar, en vez de usar la lista vieja');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas ? `\nFALLARON ${fallas} de ${bien + fallas}` : `\n${bien} comprobaciones, todas bien`);
  process.exit(fallas ? 1 : 0);
})().catch(e => { console.log('✗ [seguridad] se cortó: ' + e.message); process.exit(1); });
