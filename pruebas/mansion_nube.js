/* La Mansión del Rey con base conectada: ingreso con PIN, sincronización sin
   conexión, usuarios, registro con "antes → después", panel de buscar y Excel.
   Levanta una base de juguete en el puerto 8098 que imita lo que usa la app
   (la función de accesos, el REST de datos y perfiles) y las reglas por rol.
   Hace falta el servidor del sitio:  python3 pruebas/servidor.py 8099        */
const http = require('http'), fs = require('fs');
const { chromium } = require('playwright');
const BASE = 'http://localhost:8099/mansion/', NUBE_URL = 'http://localhost:8098';
let fallas = 0, caido = false;  // caido = sin internet
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallas++; };

/* ── la base de juguete ── */
const U = [{ id: 'u-jere', nombre: 'Jere', rol: 'dueno', activo: true, pin: null }, { id: 'u-eri', nombre: 'Eri', rol: 'dueno', activo: true, pin: null }];
const filas = new Map(); let reloj = Date.now();
const SOLO_DUENO = ['pagos', 'avisos', 'precios', 'servicios', 'ajustes'], EMPLEADO = ['productos', 'movimientos', 'pedidos', 'registro', 'eventos'];
const puedeEscribir = (u, c) => u.rol === 'dueno' || (u.rol === 'encargado' && !SOLO_DUENO.includes(c)) || (u.rol === 'empleado' && EMPLEADO.includes(c));
const srv = http.createServer((req, res) => {
  const cab = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cab); return res.end(); }
  let t = ''; req.on('data', c => t += c); req.on('end', () => {
    const url = new URL(req.url, NUBE_URL), b = t ? JSON.parse(t) : {};
    const out = (o, s = 200) => { res.writeHead(s, cab); res.end(JSON.stringify(o)); };
    const tok = (req.headers.authorization || '').replace('Bearer ', ''), yo = U.find(u => 't-' + u.id === tok && u.activo && u.pin);
    if (url.pathname === '/functions/v1/mansion') {
      if (b.accion === 'lista') return out({ usuarios: U.filter(u => u.pin && u.activo).map(u => ({ id: u.id, nombre: u.nombre })), pendientes: U.filter(u => !u.pin && u.rol === 'dueno').map(u => ({ nombre: u.nombre })) });
      if (b.accion === 'crear_dueno') { const u = U.find(x => !x.pin && x.nombre === b.nombre); if (!u) return out({ error: 'No hay nadie pendiente con ese nombre' }, 404); u.pin = b.pin; return out({ ok: true }); }
      if (b.accion === 'entrar') {
        const u = U.find(x => x.id === b.id && x.pin); if (!u || !u.activo) return out({ error: 'Usuario no habilitado' }, 403);
        if (u.pin !== b.pin) return out({ error: 'PIN incorrecto' }, 401);
        return out({ sesion: { access_token: 't-' + u.id, refresh_token: 'r-' + u.id, expires_in: 3600, user: { id: u.id } } });
      }
      if (!yo || yo.rol !== 'dueno') return out({ error: 'Solo los dueños pueden hacer esto' }, 403);
      if (b.accion === 'alta') { U.push({ id: 'u-' + b.nombre.toLowerCase(), nombre: b.nombre, rol: b.rol, activo: true, pin: b.pin }); return out({ ok: true }); }
      if (b.accion === 'cambiar_pin') { U.find(x => x.id === b.id).pin = b.pin; return out({ ok: true }); }
      if (b.accion === 'permiso') { const u = U.find(x => x.id === b.id); if (b.rol) u.rol = b.rol; if (b.activo !== undefined) u.activo = b.activo; return out({ ok: true }); }
    }
    if (url.pathname === '/auth/v1/token') { const u = U.find(x => 'r-' + x.id === b.refresh_token); return u ? out({ access_token: 't-' + u.id, refresh_token: 'r-' + u.id, expires_in: 3600 }) : out({}, 400); }
    if (!yo) return out({ message: 'JWT inválido' }, 401);
    if (url.pathname === '/rest/v1/perfiles') { let l = U.filter(u => u.pin); const id = url.searchParams.get('id'); if (id) l = l.filter(u => 'eq.' + u.id === id); return out(l.map(u => ({ id: u.id, nombre: u.nombre, rol: u.rol, activo: u.activo }))); }
    if (url.pathname === '/rest/v1/datos') {
      if (req.method === 'GET') {
        const gt = (url.searchParams.get('actualizado') || '').replace('gt.', '');
        return out([...filas.values()].filter(f => (!gt || f.actualizado > gt) && (yo.rol === 'dueno' || (!f.sensible && !['pagos', 'avisos'].includes(f.col)))).sort((a, c) => a.actualizado < c.actualizado ? -1 : 1));
      }
      if (b.some(f => !puedeEscribir(yo, f.col))) return out({ message: 'new row violates row-level security policy', code: '42501' }, 403);
      b.forEach(f => filas.set(f.col + '/' + f.id, Object.assign({}, f, { actualizado: new Date(reloj++).toISOString() })));
      return out(null, 201);
    }
    out({ error: 'no' }, 404);
  });
});

(async () => {
  await new Promise(r => srv.listen(8098, r));
  const b = await chromium.launch();
  const abrir = async (opts = {}) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true }, opts));
    /* Chromium no deja que una página de localhost llame a otro puerto de localhost: las llamadas a la base de juguete pasan por acá */
    await ctx.route(NUBE_URL + '/**', async r => {
      if (caido) return r.abort('internetdisconnected');
      const q = r.request(), cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
      if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      const x = await fetch(q.url(), { method: q.method(), headers: q.headers(), body: q.method() === 'GET' ? undefined : q.postData() });
      r.fulfill({ status: x.status, headers: Object.assign({ 'Content-Type': 'application/json' }, cors), body: await x.text() });
    });
    await ctx.route('**/mansion/config.js', r => r.fulfill({ contentType: 'application/javascript', body: `const CONFIG={url:'${NUBE_URL}',clave:'sb_publishable_prueba'};` }));
    await ctx.route(/\/mansion\/(index\.html)?$/, async r => { const x = await r.fetch(), h = Object.assign({}, x.headers()); h['content-security-policy'] = h['content-security-policy'].replace('connect-src', 'connect-src ' + NUBE_URL); r.fulfill({ response: x, headers: h }); });
    const p = await ctx.newPage(); p.errores = []; if (process.env.DEBUG) { p.on('console', m => console.log('   [consola]', m.text().slice(0, 220))); p.on('requestfailed', r => console.log('   [falló]', r.url(), r.failure().errorText)); } p.on('pageerror', e => p.errores.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && /Content Security|Refused/.test(m.text())) p.errores.push(m.text()); });
    await p.goto(BASE); return { ctx, p };
  };
  const pin = async (p, d) => { for (const n of d) await p.click(`[data-a="tecla"][data-n="${n}"]`); };

  console.log('\n─── primera vez: los dos dueños eligen su PIN ───');
  let A = await abrir(); let p = A.p;
  await p.waitForSelector('[data-a="elegir-pend"]');
  ok(await p.locator('[data-a="elegir-pend"]').count() === 2, 'aparecen Jere y Eri para crear su PIN');
  await p.click('[data-a="elegir-pend"][data-n="Jere"]'); await pin(p, '123456'); await pin(p, '111111');
  await p.waitForSelector('.error-campo'); ok(/no coinciden/.test(await p.textContent('.error-campo')), 'si los dos PIN no coinciden, avisa');
  await pin(p, '123456'); await pin(p, '123456');
  await p.waitForSelector('.titulo-g', { timeout: 8000 }); ok(true, 'con el PIN repetido entra y ve Inicio');
  ok(U.find(u => u.nombre === 'Jere').pin === '123456', 'el PIN quedó guardado en la base');

  console.log('\n─── cargar algo: queda en el teléfono y llega a la base ───');
  await p.click('[data-a="cargar"].flot-nuevo'); await p.fill('.hoja textarea', '15 de Pilar 21/3 noche 120 adultos');
  await p.waitForSelector('[data-a="confirmar-carga"]'); await p.click('[data-a="confirmar-carga"]');
  await p.waitForSelector('.ficha-cab'); await p.waitForFunction(() => Nube.pendientes() === 0, null, { timeout: 8000 });
  ok([...filas.keys()].some(k => k.startsWith('eventos/')), 'la fiesta está en la base');
  ok([...filas.keys()].some(k => k.startsWith('registro/')), 'el registro también');

  console.log('\n─── sin internet: guarda y espera ───');
  caido = true;
  await p.click('button[aria-label="Volver"]').catch(() => { }); await p.evaluate(() => { location.hash = '#/inicio'; }); await p.waitForSelector('.titulo-g');
  await p.click('[data-a="cargar"].flot-nuevo'); await p.fill('.hoja textarea', 'faltan 2 lavandinas');
  await p.waitForSelector('#entendido [data-a="confirmar-carga"]').catch(() => { });
  await p.evaluate(() => { DB.d.productos.push({ id: 'pz', nombre: 'Lavandina 5 L', categoria: 'Limpieza', unidad: 'bidones', stock: 3, minimo: 4, proveedor: '', alias: ['lavandina'], durable: false, pedir: 0 }); });
  await p.keyboard.press('Escape');
  await p.evaluate(() => { const e = clon(DB.d.eventos[0]); e.adultos = 130; cambiar('Editó prueba', [{ col: 'eventos', nuevo: e }], {}); });
  ok(await p.evaluate(() => Nube.pendientes()) >= 2, 'sin señal queda "por enviar"');
  await p.evaluate(() => Nube.sincronizar()); await p.waitForTimeout(300);
  ok(await p.evaluate(() => Nube.estado) === 'offline', 'el estado dice sin conexión');
  caido = false;
  await p.evaluate(() => Nube.sincronizar()); await p.waitForFunction(() => Nube.pendientes() === 0, null, { timeout: 8000 });
  ok([...filas.values()].find(f => f.col === 'eventos').data.adultos === 130, 'al volver la señal se envía solo');

  console.log('\n─── otro teléfono: Eri crea su PIN y ve lo de Jere ───');
  const B = await abrir(); const q = B.p;
  await q.waitForSelector('[data-a="elegir-pend"]');
  await q.click('[data-a="elegir-pend"][data-n="Eri"]'); await pin(q, '654321'); await pin(q, '654321');
  await q.waitForSelector('.titulo-g', { timeout: 8000 });
  await q.waitForFunction(() => DB.d.eventos.length === 1, null, { timeout: 8000 }); ok(true, 've la fiesta que cargó Jere');
  await q.evaluate(() => { location.hash = '#/registro'; }); await q.waitForSelector('details.cambios');
  ok(await q.locator('details.cambios').count() > 0, 'el registro muestra "ver cambios"');
  await q.locator('details.cambios summary').first().click();
  console.log('    ejemplo:', (await q.locator('details.cambios').first().innerText()).replace(/\n/g, ' | '));

  console.log('\n─── usuarios: Jere da de alta un empleado ───');
  await p.evaluate(() => { location.hash = '#/usuarios'; }); await p.waitForSelector('[data-a="usuario"]');
  await p.click('.barra [data-a="usuario"]'); await p.fill('.hoja [name="nombre"]', 'Mozo'); await p.fill('.hoja [name="pin"]', '777777');
  await p.click('.hoja button.btn.acento'); await p.waitForFunction(() => DB.d.usuarios.some(u => u.nombre === 'Mozo'), null, { timeout: 8000 });
  ok(U.some(u => u.nombre === 'Mozo' && u.rol === 'empleado'), 'el empleado nació con rol empleado');
  const C = await abrir(); const e = C.p;
  await e.waitForSelector('[data-a="elegir"]'); await e.click('[data-a="elegir"]:has-text("Mozo")'); await pin(e, '777777');
  await e.waitForSelector('.titulo-g', { timeout: 8000 });
  ok(!(await e.evaluate(() => /Pagos|Precios/.test(document.querySelector('#abajo').innerText))), 'el empleado no ve plata en el menú');
  await e.evaluate(() => { location.hash = '#/pagos'; }); await e.waitForTimeout(200);
  ok(/no está habilitada/.test(await e.evaluate(() => document.body.innerText)), 'el empleado no entra a Pagos');
  await e.evaluate(() => { const x = clon(DB.d.precios[0] || { id: 'pr', nombre: 'x', historial: [] }); x.nombre = 'hack'; cambiar('Intento', [{ col: 'precios', nuevo: x }], {}); });
  await e.evaluate(() => Nube.sincronizar()); await e.waitForFunction(() => Nube.pendientes() === 0, null, { timeout: 8000 });
  ok(![...filas.values()].some(f => f.col === 'precios'), 'la base rechaza lo que el empleado no puede escribir, y no queda trabado');

  console.log('\n─── dueño le saca el permiso: se corta solo ───');
  await p.evaluate(async () => { await Nube.fn('permiso', { id: 'u-mozo', activo: false }, true); });
  await e.evaluate(() => Nube.sincronizar()); await e.waitForTimeout(500);
  ok(await e.locator('[data-a="elegir"]').count() >= 0 && !(await e.locator('.titulo-g').count()), 'el teléfono del empleado vuelve a la pantalla de ingreso');

  console.log('\n─── buscar rápido y Excel ───');
  await p.evaluate(() => { location.hash = '#/inicio'; }); await p.waitForSelector('.titulo-g');
  await p.click('.barra [data-a="cargar"]'); await p.fill('.hoja textarea', 'pilar');
  await p.waitForSelector('.res'); ok(await p.locator('.res').count() >= 1, 'escribir "pilar" encuentra la fiesta');
  await p.click('.res'); await p.waitForSelector('.ficha-cab'); ok(/Pilar/.test(await p.textContent('.ficha-cab h1')), 'tocar el resultado abre la ficha');
  await p.evaluate(() => { location.hash = '#/ajustes'; }); await p.waitForSelector('[data-a="excel"]');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-a="excel"]')]);
  const ruta = '/tmp/mansion-prueba.xlsx'; await d.saveAs(ruta);
  ok(/\.xlsx$/.test(d.suggestedFilename()) && fs.statSync(ruta).size > 3000, 'baja un .xlsx con ' + fs.statSync(ruta).size + ' bytes');
  ok(!p.errores.length && !q.errores.length, 'sin errores de página ni de seguridad (CSP)' + (p.errores.concat(q.errores)[0] ? ': ' + p.errores.concat(q.errores)[0] : ''));

  await b.close(); srv.close();
  console.log(fallas ? `\n✗ ${fallas} falla(s)` : '\n✓ Sin fallas'); process.exit(fallas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
