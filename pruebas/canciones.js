/* Prueba "¡Vos elegís la música!": el Apps Script de las canciones (corrido en un vm, sin Google), el panel de la organizadora
 * (`julieta/canciones`) y el formulario de la invitación (`julieta`), los tres CONECTADOS entre sí: la página le habla al
 * script de verdad, no a un dibujo de su respuesta.
 *
 *     python3 pruebas/servidor.py 8099 &   y después   node pruebas/canciones.js
 *
 * Qué mide, y por qué:
 *  - que una canción mandada sin clave quede anotada UNA vez (sin repetir "De música ligera" / "de musica ligera!");
 *  - que nadie, sin la clave, pueda leer la lista ni aprobar nada, y que doce claves malas cierren la puerta;
 *  - que una canción que empieza con "=" no sea una FÓRMULA en la planilla de la organizadora;
 *  - que la invitación diga "anotada" SOLO cuando la planilla lo contestó, y que si no llegó, no lo diga;
 *  - que el panel cambie el estado en la planilla y, si ésta se niega, vuelva atrás. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');

const fallas = [];
const mal  = m => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = m => console.log('  ✓ ' + m);
const es = (c, m) => c ? bien(m) : mal(m);
const raiz = path.join(__dirname, '..');

/* ── la planilla de mentira: solo lo que el script usa ── */
function hojaFalsa() {
  const d = [];
  const h = {
    datos: d,
    getLastRow: () => d.length,
    setFrozenRows: () => h,
    appendRow(f) { d.push(f.slice()); return h; },
    getRange(fila, col, nf = 1, nc = 1) {
      const caja = {
        getValues() {
          const s = [];
          for (let i = 0; i < nf; i++) { const f = []; for (let j = 0; j < nc; j++) f.push((d[fila - 1 + i] || [])[col - 1 + j] ?? ''); s.push(f); }
          return s;
        },
        setValue(v) { while (d.length < fila) d.push([]); d[fila - 1][col - 1] = v; return caja; },
        setFontWeight: () => caja
      };
      return caja;
    }
  };
  return h;
}

function cargar(opts = {}) {
  const hoja = hojaFalsa(), props = {}, cache = {}, registro = [];
  const caja = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [hoja] }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = v; },
      deleteProperty: k => { delete props[k]; } }) },
    CacheService: { getScriptCache: () => ({ get: k => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; } }) },
    Utilities: {
      getUuid: () => require('crypto').randomUUID(),
      formatDate: (f, zona) => new Intl.DateTimeFormat('sv-SE', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(f)
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ texto: t, setMimeType() { return this; } }) },
    Logger: { log: m => registro.push(String(m)) },
    Date, console
  };
  vm.createContext(caja);
  let src = fs.readFileSync(path.join(raiz, 'apps-script', 'canciones.gs.txt'), 'utf8');
  if (opts.claves) src = src.replace("var CLAVE_ELEGIDA = '';", "var CLAVE_ELEGIDA = '" + opts.claves[0] + "';").replace("var CLAVE_MAESTRA_ELEGIDA = '';", "var CLAVE_MAESTRA_ELEGIDA = '" + opts.claves[1] + "';");
  vm.runInContext(src, caja);
  const leer = r => JSON.parse(r.texto);
  const get = p => leer(caja.doGet({ parameter: p }));
  return { hoja, props, registro, caja, get, cache,
    preparar: () => caja.preparar(),
    sugerir: (c, a, q = '', extra = {}) => get(Object.assign({ accion: 'sugerir', cancion: c, artista: a, quien: q }, extra)) };
}

(async () => {
  /* ═══ 1 · el Apps Script ═══ */
  console.log('\n─── el Apps Script de las canciones ───');
  const src = fs.readFileSync(path.join(raiz, 'apps-script', 'canciones.gs.txt'), 'utf8');
  es(/var CLAVE_ELEGIDA = '';/.test(src) && /var CLAVE_MAESTRA_ELEGIDA = '';/.test(src), 'las dos claves versionadas están vacías (una clave en el repo es una clave pública)');

  const A = cargar();
  const clave = A.preparar();
  es(/^[0-9a-f]{16}$/.test(clave), 'preparar() inventa una clave de 16 dígitos hexadecimales (' + clave.length + ')');
  es(A.hoja.datos.length === 1 && A.hoja.datos[0][2] === 'Canción', 'escribe los títulos de las columnas');

  let r = A.sugerir('De música ligera', 'Soda Stereo', 'Martina');
  es(r.ok === true && A.hoja.datos.length === 2, 'una sugerencia sin clave queda anotada');
  es(A.hoja.datos[1][5] === 'pendiente', 'y nace "pendiente"');
  r = A.sugerir('de musica ligera!', 'SODA STEREO');
  es(r.ok === true && r.duplicada === true && A.hoja.datos.length === 2, 'la misma canción con otras mayúsculas, sin acentos o con signos NO se repite (' + A.hoja.datos.length + ' filas)');
  r = A.sugerir('', 'Soda Stereo');
  es(r.ok === false && A.hoja.datos.length === 2, 'sin nombre de canción no se anota nada');
  r = A.sugerir('Tusa', '   ');
  es(r.ok === false && A.hoja.datos.length === 2, 'sin artista tampoco');
  r = A.sugerir('=HYPERLINK("http://malo")', 'X');
  es(r.ok === true && String(A.hoja.datos[2][2]).startsWith("'"), 'una canción que empieza con "=" se guarda como TEXTO, no como fórmula (' + A.hoja.datos[2][2] + ')');
  r = A.sugerir('A'.repeat(300), 'B'.repeat(300), 'C'.repeat(300));
  const fila = A.hoja.datos[3];
  es(fila[2].length <= 80 && fila[3].length <= 60 && fila[4].length <= 40, 'los textos largos se recortan (80/60/40): ' + fila[2].length + '/' + fila[3].length + '/' + fila[4].length);
  const antes = A.hoja.datos.length;
  r = A.sugerir('Trampa', 'Robot', '', { web: 'http://spam' });
  es(r.ok === true && A.hoja.datos.length === antes, 'el campo trampa lo llena un programa, no una persona: se contesta ok y no se anota');

  console.log('\n─── quién puede leer y cambiar ───');
  es(A.get({ accion: 'listar' }).error === 'clave', 'sin clave no se lee la lista');
  es(!JSON.stringify(A.get({ accion: 'listar', clave: 'mala' })).includes('Soda'), 'con una clave mala no sale ni una canción');
  r = A.get({ accion: 'estado', id: A.hoja.datos[1][0], valor: 'aprobada' });
  es(r.error === 'clave' && A.hoja.datos[1][5] === 'pendiente', 'sin clave NO se puede aprobar nada');
  r = A.get({ accion: 'listar', clave });
  es(r.canciones.length === 3 && r.resumen.total === 3 && r.resumen.pendientes === 3, 'con la clave se lee todo y el resumen lo cuenta la planilla (' + r.resumen.total + ' · ' + r.resumen.pendientes + ' pendientes)');
  const id = r.canciones[0].id;
  r = A.get({ accion: 'estado', clave, id, valor: 'aprobada' });
  es(r.ok === true && A.hoja.datos[1][5] === 'aprobada', 'con la clave se aprueba y queda en la planilla');
  es(A.get({ accion: 'estado', clave, id, valor: 'cualquiera' }).ok === false && A.hoja.datos[1][5] === 'aprobada', 'un estado inventado se rechaza');
  es(A.get({ accion: 'estado', clave, id: 'noexiste', valor: 'rechazada' }).ok === false, 'un id que no existe no cambia nada');
  es(A.get({ accion: 'cuantas', clave }).total === 3 && Object.keys(A.get({ accion: 'cuantas', clave })).join() === 'total', '"cuantas" contesta solo el total (es lo que se pregunta cada 12 s)');

  const B = cargar({ claves: ['laclave1234abcd', 'maestra-prueba'] });
  B.preparar(); B.sugerir('Perfecta', 'Miranda!');
  es(B.get({ accion: 'listar', clave: 'maestra-prueba' }).canciones?.length === 1, 'la clave maestra entra a cualquier panel');
  es(B.get({ accion: 'listar', clave: 'laclave1234abcd' }).canciones?.length === 1, 'y la de la fiesta también');

  const C = cargar(); C.preparar(); C.sugerir('Una', 'Cosa');
  for (let i = 0; i < 12; i++) C.get({ accion: 'listar', clave: 'x' + i });
  es(C.get({ accion: 'listar', clave: C.props.CLAVE_PANEL }).error === 'frenado', 'doce claves malas seguidas cierran la puerta, ni la buena entra');

  console.log('\n─── los topes ───');
  const D = cargar(); D.preparar();
  let ok = 0, ritmo = 0;
  for (let i = 0; i < 45; i++) { const x = D.sugerir('Tema ' + i, 'Banda ' + i); if (x.ok) ok++; else if (x.error === 'ritmo') ritmo++; }
  es(ok === 40 && ritmo === 5, 'más de 40 canciones en un minuto se frenan (entraron ' + ok + ', frenadas ' + ritmo + ')');
  const E = cargar(); E.preparar();
  for (let i = 0; i < 500; i++) E.hoja.appendRow(['i' + i, '', 'c' + i, 'a' + i, '', 'pendiente']);
  es(E.sugerir('Una más', 'Sobrante').error === 'lleno', 'con 500 canciones la lista se da por completa');

  /* ═══ 2 · las dos pantallas, hablándole al script ═══ */
  console.log('\n─── el panel y el formulario, conectados al script ───');
  const F = cargar(); const claveF = F.preparar();
  const URL_FALSA = 'https://script.google.com/macros/s/PRUEBA/exec';
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  let cortar = false, negarEstado = false;
  await ctx.route('**/script.google.com/**', async ruta => {
    if (cortar) return ruta.abort();
    const u = new URL(ruta.request().url()); const p = {};
    u.searchParams.forEach((v, k) => { p[k] = v; });
    if (negarEstado && p.accion === 'estado') return ruta.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, mensaje: 'no' }) });
    const salida = F.caja.doGet({ parameter: p }).texto;
    ruta.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: salida });
  });
  /* la página con la dirección puesta: se le cambia el HUECO del HTML servido */
  /* Se cambia la dirección que tenga el HTML publicado (vacía o la de verdad) por la falsa: la prueba no le habla a Google. */
  const poner = async (ctxX, patron, campo, url) => ctxX.route(patron, async ruta => {
    const r = await ruta.fetch(); let t = await r.text();
    t = t.replace(new RegExp('(' + campo + ': ")[^"]*(")'), '$1' + url + '$2');
    ruta.fulfill({ response: r, body: t });
  });
  await poner(ctx, '**/julieta/', 'cancionesEndpoint', URL_FALSA);
  await poner(ctx, '**/julieta/canciones/', '(?<![A-Za-z])endpoint', URL_FALSA);

  const inv = await ctx.newPage(); const errs = [];
  inv.on('pageerror', e => errs.push(e.message));
  await inv.goto('http://localhost:8099/julieta/'); await inv.click('#abrir'); await inv.waitForTimeout(3200);
  await inv.evaluate(() => document.querySelector('#formCancion').scrollIntoView({ block: 'center' }));
  await inv.fill('#fCancion', 'De música ligera'); await inv.fill('#fArtista', 'Soda Stereo'); await inv.fill('#fQuien', 'Martina');
  await inv.click('#enviarCancion'); await inv.waitForTimeout(700);
  let m = (await inv.textContent('#cMsg')).toLowerCase();
  es(m.includes('anotada') && F.hoja.datos.length === 2, 'la invitación dice "anotada" y la canción está en la planilla (' + F.hoja.datos.length + ' filas)');
  es((await inv.inputValue('#fCancion')) === '', 'y el formulario se vacía');
  await inv.fill('#fCancion', 'de musica ligera'); await inv.fill('#fArtista', 'soda stereo'); await inv.click('#enviarCancion'); await inv.waitForTimeout(600);
  m = (await inv.textContent('#cMsg')).toLowerCase();
  es(m.includes('ya estaba') && F.hoja.datos.length === 2, 'una repetida dice que ya estaba y no se anota dos veces');
  await inv.fill('#fCancion', 'Solo la canción'); await inv.fill('#fArtista', ''); await inv.click('#enviarCancion'); await inv.waitForTimeout(300);
  es((await inv.textContent('#cMsg')).toLowerCase().includes('falta') && F.hoja.datos.length === 2, 'sin artista pide el artista y no manda nada');
  cortar = true;
  await inv.fill('#fCancion', 'Tusa'); await inv.fill('#fArtista', 'Karol G'); await inv.click('#enviarCancion'); await inv.waitForTimeout(700);
  m = (await inv.textContent('#cMsg')).toLowerCase();
  es(!m.includes('anotada') && m.includes('no se pudo') && F.hoja.datos.length === 2, 'con la red cortada NO dice "anotada": dice que no se pudo (' + m.slice(0, 40) + ')');
  es(!(await inv.$eval('#enviarCancion', b => b.disabled)), 'y el botón vuelve a quedar usable para reintentar');
  cortar = false;
  es(errs.length === 0, 'sin errores de JavaScript en la invitación' + (errs.length ? ': ' + errs[0] : ''));

  /* sin planilla conectada: sale por WhatsApp */
  const ctx2 = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const inv2 = await ctx2.newPage();
  await poner(ctx2, '**/julieta/', 'cancionesEndpoint', '');
  await inv2.goto('http://localhost:8099/julieta/'); await inv2.click('#abrir'); await inv2.waitForTimeout(3200);
  await inv2.fill('#fCancion', 'Perfecta'); await inv2.fill('#fArtista', 'Miranda!');
  let dest = '';
  await ctx2.route('**/wa.me/**', r => { dest = decodeURIComponent(r.request().url()); r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }); });
  await inv2.click('#enviarCancion'); await inv2.waitForTimeout(1200);
  es(/wa\.me\/5493856172466/.test(dest) && dest.includes('Perfecta') && dest.includes('Miranda!'), 'sin planilla conectada abre WhatsApp con la canción armada (' + dest.slice(0, 50) + '…)');
  await ctx2.close();

  /* el panel */
  const pan = await ctx.newPage(); const errsP = [];
  pan.on('pageerror', e => errsP.push(e.message));
  await pan.goto('http://localhost:8099/julieta/canciones/'); await pan.waitForTimeout(400);
  es(await pan.isVisible('#entrar'), 'sin clave guardada pide la clave');
  await pan.fill('#clave', 'incorrecta'); await pan.click('#formClave button'); await pan.waitForTimeout(500);
  es((await pan.textContent('#errClave')).toLowerCase().includes('no es') && !(await pan.isVisible('#panel')), 'con una clave mala no muestra el panel y lo dice');
  await pan.fill('#clave', claveF); await pan.click('#formClave button'); await pan.waitForTimeout(700);
  es(await pan.isVisible('#panel') && (await pan.textContent('#nTotal')) === '1' && (await pan.textContent('#nPend')) === '1', 'con la clave buena muestra las canciones: 1 total, 1 pendiente');
  /* llega una nueva mientras el panel está abierto */
  F.sugerir('Tusa', 'Karol G', 'Caro');
  await pan.waitForTimeout(13000);
  es((await pan.textContent('#nTotal')) === '2', 'el panel se entera SOLO de la canción nueva (sin recargar)');
  await pan.click('button[data-v="aprobada"] >> nth=0'); await pan.waitForTimeout(600);
  es(F.hoja.datos.filter(f => f[5] === 'aprobada').length === 1 && (await pan.textContent('#nAprob')) === '1', 'aprobar se guarda en la planilla y el contador sube');
  negarEstado = true;
  await pan.click('button[data-v="aprobada"] >> nth=0'); await pan.waitForTimeout(600);
  es(F.hoja.datos.filter(f => f[5] === 'aprobada').length === 1 && (await pan.textContent('#nAprob')) === '1', 'si la planilla se niega a guardar, el panel vuelve atrás y no dice que aprobó');
  negarEstado = false;
  const href = await pan.getAttribute('.abrir >> nth=0', 'href');
  es(/^https:\/\/open\.spotify\.com\/search\/.+/.test(href), 'cada canción tiene su enlace de búsqueda de Spotify (' + href.slice(0, 60) + ')');
  const chicos = await pan.$$eval('button, a.abrir, input', es => es.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44 ? Math.round(r.width) + 'x' + Math.round(r.height) : null; }).filter(Boolean));
  es(chicos.length === 0, 'todo lo que se toca llega a 44x44' + (chicos.length ? ': ' + chicos.join(', ') : ''));
  const sal = await pan.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  es(sal <= 0, 'el panel no se sale por el costado');
  es(errsP.length === 0, 'sin errores de JavaScript en el panel' + (errsP.length ? ': ' + errsP[0] : ''));
  await navegador.close();

  console.log('\n' + (fallas.length ? fallas.length + ' FALLAS' : '✓ Sin fallas'));
  process.exit(fallas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
