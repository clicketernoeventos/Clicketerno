/* ═══════════════════════════════════════════════════════════════
   TODAS LAS PUERTAS

   Antes de salir de la beta: entrar por CADA puerta del producto,
   con el navegador limpio, como entra alguien que llega por
   primera vez. Las otras suites miran si una pantalla funciona;
   esta mira si se puede ENTRAR a todas y SALIR de todas.

   Tres cosas por puerta, y las tres son de las que no se ven
   leyendo el código:

     · que cargue sin un error de JavaScript,
     · que muestre algo (una pantalla en blanco no avisa: parece
       que el teléfono está lento),
     · y que tenga salida. Una pantalla sin vuelta atrás en un
       teléfono es una pantalla de la que se sale cerrando la app.

   Más las promesas que no se pueden romper: al invitado no se le
   pide contraseña en ninguna puerta, y las del administrador no
   se abren sin la clave maestra.

   También se recorren TODOS los enlaces de la página pública: un
   ancla a una sección que no existe, o una dirección que da 404,
   es un cliente que se cae del embudo sin que nadie se entere.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const fs = require('fs');
const path = require('path');
const BASE = 'http://127.0.0.1:8099';
const TELEFONO = { width: 390, height: 844 };
const COD = 'QUI-PUERTA', CLAVE = 'clave-puerta';

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Lo que se puede decir de una pantalla sin saber cuál es. */
const mirar = (p) => p.evaluate(() => {
  const texto = (document.body.innerText || '').trim();
  const vis = (n) => n && n.getClientRects().length > 0;
  /* "Salida" es cualquier cosa visible que lleve a otro lado: el volver
     de cada cabecera, un enlace con hash, o un botón con data-ir. */
  const salidas = [...document.querySelectorAll(
    '.volver,.vuelve,.atras,.link-abajo,.volver-flota,[data-ir],a[href^="#"],a[href^="/"]')]
    .filter(vis).length;
  return {
    largo: texto.length,
    texto: texto.slice(0, 160).replace(/\s+/g, ' '),
    salidas,
    claves: [...document.querySelectorAll('input[type=password]')].filter(vis).length,
    /* Lo que deja SEGUIR, que no es lo mismo que lo que deja salir: un
       campo para escribir, o un botón que no sea el de volver. Una puerta
       donde lo único que se puede tocar es "Salir" es un callejón. */
    avanzar: [...document.querySelectorAll('input:not([type=hidden]),textarea,select,button,[data-cod]')]
      .filter((n) => vis(n) && !n.matches('.volver,.vuelve,.atras,.volver-flota')).length,
    hash: location.hash,
  };
});

async function contexto(browser, { admin = false, claves = null } = {}) {
  const ctx = await browser.newContext({ viewport: TELEFONO });
  await ctx.addInitScript(([admin, claves, maestra]) => {
    try {
      localStorage.clear(); sessionStorage.clear();
      if (claves) localStorage.setItem('ce:claves', JSON.stringify(claves));
      if (admin) {
        sessionStorage.setItem('ce:admin', '1');
        sessionStorage.setItem('ce:maestra', maestra);
        sessionStorage.setItem('ce:pinOK', '1');
      }
    } catch (e) {}
  }, [admin, claves, 'CLAVE-MAESTRA-DE-PRUEBA']);
  return ctx;
}

async function abrirPuerta(ctx, fake, url) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.route('**/cdnjs.cloudflare.com/**', (r) => r.fulfill({ status: 200,
    contentType: 'application/javascript',
    body: 'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};' }));
  if (fake) await fake.instalar(p);
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  const est = await mirar(p);
  await p.close();
  return { ...est, errs };
}

/* Una puerta está bien si carga, dice algo y deja salir. */
function juzgar(nombre, e, { salidaObligatoria = true, sinClave = false,
                             avanzarObligatorio = false } = {}) {
  if (e.errs.length) return mal(`${nombre}: error de JavaScript → ${e.errs[0].slice(0, 90)}`);
  if (e.largo < 25) return mal(`${nombre}: pantalla casi vacía (${e.largo} caracteres)`);
  if (salidaObligatoria && !e.salidas)
    return mal(`${nombre}: no tiene salida, se sale cerrando la app`);
  /* El agujero que tuvo la pantalla del salón: con el teléfono limpio
     mostraba la lista de eventos guardados —vacía— y un cartel que decía
     "creá uno desde el panel del organizador". Ahí se terminaba. Y le
     pasaba justo al cliente que compró el muro y entra desde otro
     teléfono con el código que le pasamos. */
  if (avanzarObligatorio && !e.avanzar)
    return mal(`${nombre}: callejón sin salida — con el teléfono limpio no hay nada para tocar salvo "Salir"`);
  if (sinClave && e.claves)
    return mal(`${nombre}: le pide una contraseña al invitado (${e.claves} campos)`);
  bien(`${nombre} → "${e.texto.slice(0, 64)}…"`);
}

(async () => {
  const browser = await chromium.launch();

  /* ══ A · LA PÁGINA PÚBLICA ══ */
  titulo('la página pública: todos los enlaces llegan a algún lado');
  {
    const ctx = await contexto(browser);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    if (errs.length) mal('la portada tira un error de JavaScript: ' + errs[0].slice(0, 90));
    else bien('la portada carga sin errores');

    const enlaces = await p.$$eval('a[href]', (ns) => ns.map((n) => ({
      href: n.getAttribute('href'),
      texto: (n.innerText || n.getAttribute('aria-label') || '').trim().slice(0, 40),
    })));
    const anclas = enlaces.filter((l) => l.href.startsWith('#') && l.href.length > 1);
    const internos = enlaces.filter((l) => /^\/?[a-z0-9]/i.test(l.href) && !/^https?:|^mailto:|^tel:/.test(l.href));
    const rotas = [];
    for (const a of anclas) {
      const hay = await p.evaluate((id) => !!document.getElementById(id), a.href.slice(1));
      if (!hay) rotas.push(a.href + ' ("' + a.texto + '")');
    }
    if (rotas.length) mal(`${rotas.length} anclas de la portada no llevan a nada: ` + rotas.join(', '));
    else bien(`las ${anclas.length} anclas de la portada llevan a una sección que existe`);

    const malas = [];
    for (const l of [...new Set(internos.map((x) => x.href))]) {
      const destino = l.split('#')[0].split('?')[0];
      if (!destino) continue;
      const r = await p.request.get(BASE + (destino.startsWith('/') ? destino : '/' + destino));
      if (!r.ok()) malas.push(`${l} → ${r.status()}`);
    }
    if (malas.length) mal(`${malas.length} direcciones de la portada no existen: ` + malas.join(', '));
    else bien(`las ${[...new Set(internos.map((x) => x.href))].length} direcciones internas responden`);

    /* Las cuatro puertas del que ya contrató tienen que estar a la vista:
       es lo primero que pregunta un cliente cuando paga. */
    const entrar = await p.evaluate(() => {
      const s = document.getElementById('entrar');
      if (!s) return null;
      return [...s.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    });
    if (!entrar) mal('no existe el apartado #entrar: el que ya pagó no tiene por dónde');
    else {
      const falta = ['muro', 'rollo'].filter((q) => !entrar.some((h) => h.includes(q)));
      if (falta.length) mal(`#entrar no ofrece ${falta.join(' ni ')}`);
      else bien(`#entrar ofrece las puertas de los dos servicios (${entrar.length} enlaces)`);
    }
    await ctx.close();
  }

  /* ══ B · LAS PUERTAS DEL MURO ══ */
  titulo('el muro: cada puerta carga, dice algo y deja salir');
  {
    const fake = crearFake('ok', true);
    fake.claves[COD] = CLAVE;
    fake.db.ce_eventos.push({ codigo: COD, nombre: 'Fiesta de las puertas', fecha: '2026-12-05',
      tono: '#D9AE72', moderar: false, cerrado: false, creado: Date.now(), camara: true });
    fake.db.ce_items.push({ codigo: COD, id: 'p1', kind: 'mensaje', url: '', autor: 'Alguien',
      texto: 'Que sean felices', estado: 'aprobado', ts: 1 });

    /* Sin nada guardado: así llega el que entra por primera vez. */
    const ctx = await contexto(browser);
    for (const [nombre, url, op] of [
      ['la portada',            '/muro',                    {}],
      ['soy invitado',          '/muro#invitado',           { sinClave: true, avanzarObligatorio: true }],
      ['ya contraté (código)',  '/muro#codigo',             { avanzarObligatorio: true }],
      ['el panel (PIN)',        '/muro#panel',              { avanzarObligatorio: true }],
      ['elegir la pantalla',    '/muro#proyector',          { avanzarObligatorio: true }],
      ['subir desde el QR',     '/muro#subir/' + COD,       { sinClave: true }],
      ['el álbum',              '/muro#album/' + COD,       {}],
      ['el cartel de mesa',     '/muro#cartel/' + COD,      {}],
      ['las tarjetas',          '/muro#tarjetas/' + COD,    {}],
      ['el diagnóstico',        '/muro#diagnostico',        {}],
      /* La pantalla del salón es de proyector: no lleva "volver" a
         propósito, tiene sus propios mandos. */
      ['la pantalla del salón', '/muro#pantalla/' + COD,    { salidaObligatoria: false }],
      ['una dirección inventada', '/muro#cualquier-cosa',   {}],
      ['/app (los QR impresos)', '/app',                    {}],
    ]) juzgar(nombre, await abrirPuerta(ctx, fake, url), op);

    /* ── LA PUERTA MÁS USADA DE TODAS: el QR del cartel de la mesa ──
       Por ahí entra cada invitado de cada fiesta, y lo que se imprime no
       se puede cambiar después. Lo que se mide es lo único que importa:
       que la dirección que ARMA la app sea una que la app sepa abrir. El
       muro la arma con un hash (#subir/CODIGO) y el rollo con ?e=CODIGO;
       son formatos distintos y cada uno lee el suyo.
       Si alguien cambia enlaceDe() o enlaceDelRollo() y se olvida del
       otro lado, los QR ya impresos dejan de entrar y nos enteramos en la
       fiesta de un cliente. */
    {
      const p = await ctx.newPage();
      await fake.instalar(p);
      await p.goto(BASE + '/muro', { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1200);
      const arma = await p.evaluate((c) => enlaceDe(c), COD);
      await p.close();
      const camino = arma.replace(/^https?:\/\/[^/]+/, '');
      const e = await abrirPuerta(ctx, fake, camino);
      if (!/fiesta de las puertas/i.test(e.texto))
        mal(`el QR del muro (${arma}) no abre la fiesta: "${e.texto.slice(0, 70)}"`);
      else if (e.claves)
        mal('el QR del muro le pide una contraseña al invitado');
      else bien(`el QR del muro entra derecho a mandar la foto (${camino})`);
    }
    /* Y escrito a mano, como lo copia el que no pudo escanear. */
    for (const [como, txt] of [['en minúscula', COD.toLowerCase()],
                               ['sin el guión', COD.replace('-', '')],
                               ['solo los seis del final', COD.split('-')[1]]]) {
      const p = await ctx.newPage();
      await fake.instalar(p);
      const errs = [];
      p.on('pageerror', (er) => errs.push(er.message));
      await p.goto(BASE + '/muro#invitado', { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1500);
      await p.fill('#codInv', txt);
      await p.click('#irFiesta');
      await p.waitForTimeout(2500);
      const h = await p.evaluate(() => location.hash);
      await p.close();
      if (errs.length) mal(`escribiendo el código ${como}: error JS → ${errs[0].slice(0, 70)}`);
      else if (!h.includes('subir/')) mal(`escribiendo el código ${como} no entra: quedó en "${h}"`);
      else bien(`escrito ${como}, entra igual`);
    }
    await ctx.close();

    /* Con la clave guardada, las del organizador tienen que abrir. */
    const ctx2 = await contexto(browser, { claves: { [COD]: CLAVE } });
    juzgar('el panel de un evento (con la clave)',
      await abrirPuerta(ctx2, fake, '/muro#evento/' + COD), {});
    await ctx2.close();

    /* Y la del administrador NO tiene que abrir sin la maestra. */
    const ctx3 = await contexto(browser);
    const sinAdmin = await abrirPuerta(ctx3, fake, '/muro#central');
    if (/fiesta de las puertas/i.test(sinAdmin.texto))
      mal('la central le muestra los eventos a alguien sin la clave maestra');
    else bien('la central no se abre sin la clave de administrador');
    await ctx3.close();

    const ctx4 = await contexto(browser, { admin: true });
    juzgar('la central (con la maestra)', await abrirPuerta(ctx4, fake, '/muro#central'), {});
    await ctx4.close();
  }

  /* ══ C · LAS PUERTAS DEL ROLLO ══ */
  titulo('el rollo: cada puerta carga, dice algo y deja salir');
  {
    const ctx = await contexto(browser);
    for (const [nombre, url, op] of [
      ['el inicio',              '/rollo',                  { avanzarObligatorio: true }],
      ['ya contraté (código)',   '/rollo#codigo',           { avanzarObligatorio: true }],
      ['crear el rollo',         '/rollo#nuevo',            { avanzarObligatorio: true }],
      ['una dirección inventada', '/rollo#cualquier-cosa',  {}],
      ['la demostración',        '/rollo?demo=1',           { salidaObligatoria: false }],
      ['la cámara de la demo',   '/rollo?demo=1&camara=1',  { salidaObligatoria: false, sinClave: true }],
      /* Sin la clave guardada, el panel de un rollo tiene que PEDIRLA,
         no romperse ni mostrar nada. */
      ['el panel sin la clave',  '/rollo#ev/' + COD,        {}],
      ['los ajustes sin la clave', '/rollo#ajustes/' + COD, {}],
    ]) juzgar(nombre, await abrirPuerta(ctx, null, url), op);
    /* El QR del rollo: mismo criterio que el del muro, otro formato. */
    {
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(e.message));
      await p.goto(BASE + '/rollo', { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1200);
      const arma = await p.evaluate((c) => enlaceDelRollo(c, false), COD);
      await p.close();
      if (!/[?&]e=/.test(arma))
        mal(`el QR del rollo cambió de formato y ya no lleva ?e=: ${arma}`);
      else bien(`el QR del rollo lleva el código en ?e= (${arma.replace(/^https?:\/\/[^/]+/, '')})`);
      if (errs.length) mal('errores JS leyendo el enlace del rollo: ' + errs[0].slice(0, 70));
    }
    await ctx.close();
  }

  /* ══ D · LAS DEMOSTRACIONES DEL MURO ══ */
  titulo('las demostraciones entran directo a lo que hay que vender');
  {
    const ctx = await contexto(browser);
    const d = await abrirPuerta(ctx, null, '/muro?demo=1');
    if (d.errs.length) mal('la demostración del muro tira un error: ' + d.errs[0].slice(0, 80));
    else if (!/pantalla\/DEMO-FIESTA/.test(d.hash))
      mal(`la demostración del muro no cae en la pantalla del salón: quedó en "${d.hash}"`);
    else bien('la demostración del muro cae en la pantalla del salón');
    /* Y en un marco, sin la cinta: es una vitrina, no algo para tocar. */
    const m = await abrirPuerta(ctx, null, '/muro?demo=1&marco=1');
    if (m.errs.length) mal('el marco de la vitrina tira un error: ' + m.errs[0].slice(0, 80));
    else bien('la vitrina (?marco=1) del muro carga');
    const mr = await abrirPuerta(ctx, null, '/rollo?demo=1&marco=1');
    if (mr.errs.length) mal('el marco del rollo tira un error: ' + mr.errs[0].slice(0, 80));
    else bien('la vitrina (?marco=1) del rollo carga');
    await ctx.close();
  }

  /* ══ E · LO QUE SE PUBLICA ══
     Que las páginas legales y el security.txt existan no alcanza: tienen
     que estar SERVIDAS, y lo que no va a la web tiene que no estar. */
  titulo('lo que se publica y lo que no');
  {
    const ctx = await contexto(browser);
    const p = await ctx.newPage();
    for (const r of ['/privacidad', '/terminos', '/muro', '/rollo', '/app',
                     '/muro.webmanifest', '/rollo.webmanifest', '/.well-known/security.txt']) {
      const res = await p.request.get(BASE + r);
      if (!res.ok()) mal(`${r} da ${res.status()} y tendría que estar publicada`);
    }
    bien('las páginas legales, las dos apps y los manifiestos responden');
    /* El servidor de pruebas sirve TODO el repo, así que acá no se puede
       comprobar .assetsignore. Lo que sí se puede es que el archivo exista
       y nombre lo que no tiene que salir. */
    const ig = fs.readFileSync(path.join(__dirname, '..', '.assetsignore'), 'utf8');
    const faltan = ['sql/', 'pruebas/', 'apps-script/', '*.md'].filter((x) => !ig.includes(x));
    if (faltan.length) mal('.assetsignore no excluye: ' + faltan.join(', '));
    else bien('.assetsignore excluye el SQL, las pruebas, el Apps Script y los .md');
  }

  /* ══ LO QUE UNA PUERTA PÚBLICA NO TIENE QUE MOSTRAR ══
     Las puertas del invitado y del proyector pintaban la lista de eventos
     guardados con un "En este celular · N". A cualquiera que abra esa
     pantalla le decía cuántas fiestas hay en ese aparato — y esa persona
     no administra nada.
     Peor: `eventos()` con la clave de administrador devuelve la TABLA
     ENTERA. O sea que con el modo administrador puesto, la puerta del
     invitado listaba el casamiento de todos los clientes. Y además se
     bajaba la tabla de a 500 filas para dibujar una puerta.
     La lista del organizador va en el panel, que está detrás del PIN. */
  titulo('las puertas públicas no muestran los eventos guardados');
  {
    /* Con el falso vacío, "no lista ningún evento" pasa midiendo la nada:
       es la caja de 0x0 de siempre. Hay que sembrarlo. */
    const fake = crearFake('ok');
    fake.claves[COD] = CLAVE;
    fake.db.ce_eventos.push({ codigo: COD, nombre: 'Fiesta de las puertas',
      fecha: '2026-12-05', tono: '#D9AE72', creado: Date.now(), cerrado: false });
    const ctxAdmin = await contexto(browser, { admin: true, claves: { [COD]: CLAVE } });
    for (const [nombre, url] of [['la puerta del invitado', '/muro.html#invitado'],
                                 ['la del proyector', '/muro.html#proyector']]) {
      const p = await ctxAdmin.newPage();
      const pedidos = [];
      p.on('request', (r) => { if (r.url().includes('ce_eventos')) pedidos.push(r.url()); });
      await fake.instalar(p);
      await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(2200);
      const v = await p.evaluate(() => ({
        cuenta: !!document.querySelector('.seccion-a'),
        tarjetas: document.querySelectorAll('[data-cod]').length,
        texto: (document.body.innerText || '').toLowerCase(),
      }));
      await p.close();

      if (v.cuenta || /en este celular/.test(v.texto))
        mal(`${nombre} muestra cuántos eventos hay guardados en el aparato`);
      else bien(`${nombre} no dice cuántos eventos hay guardados`);
      if (v.tarjetas)
        mal(`${nombre} lista ${v.tarjetas} evento(s) a quien no administra nada`);
      else bien(`${nombre} no lista ningún evento`);
      /* Y ni siquiera se lo pregunta a la base: con el administrador puesto
         eso era bajarse la tabla entera para dibujar una puerta. */
      if (pedidos.length)
        mal(`${nombre} le pide la lista de eventos a la base (${pedidos.length} pedidos)`);
      else bien(`${nombre} ni se lo pregunta a la base`);
    }
    await ctxAdmin.close();
  }

  /* Y la otra mitad, que es la que evita el borrado a lo bruto: en el
     panel —detrás del PIN— el organizador SÍ tiene que ver los suyos. */
  titulo('pero el panel sí muestra los del organizador');
  {
    const fake = crearFake('ok');
    fake.claves[COD] = CLAVE;
    fake.db.ce_eventos.push({ codigo: COD, nombre: 'Fiesta de las puertas',
      fecha: '2026-12-05', tono: '#D9AE72', creado: Date.now(), cerrado: false });
    const ctx2 = await contexto(browser, { admin: true, claves: { [COD]: CLAVE } });
    const p = await ctx2.newPage();
    await fake.instalar(p);
    await p.goto(BASE + '/muro.html#panel', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2600);
    const n = await p.evaluate(() => document.querySelectorAll('[data-cod]').length);
    await p.close(); await ctx2.close();
    if (!n) mal('el panel del organizador dejó de mostrar sus eventos');
    else bien(`el panel sigue mostrando los eventos del organizador (${n})`);
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
