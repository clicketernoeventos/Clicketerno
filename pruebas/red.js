/* ═══════════════════════════════════════════════════════════════
   CUANDO EL WIFI DEL SALÓN SE CORTA

   Un salón lleno con doscientos teléfonos colgados del mismo router
   pierde la conexión un par de segundos cada tanto. Hasta este
   arreglo, ese corte le devolvía "no se pudo" al invitado y la foto
   se perdía: en el muro se perdía la foto, y en el rollo se perdía
   ADEMÁS una de las que tenía para sacar, porque el cupo se reserva
   antes de subir.

   Lo que se mide acá:
     · que un corte se reintente y la foto llegue igual
     · que una NEGATIVA de la base no se reintente (repetir un 4xx es
       hacerlo esperar para darle el mismo error)
     · que cuando de verdad no se pudo, el mensaje no diga "listo"

   Comprobado contra el código anterior: sin los reintentos, las
   pruebas de "se corta una vez y llega igual" fallan.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8099';
const SUPA = 'https://kuqlqgrwsospwjexodqa.supabase.co';
const COD = 'QUI-REDXXX', CLAVE = 'clave-red';

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Una foto de verdad: el muro la pasa por un canvas y con bytes
   inventados el navegador no la puede decodificar. */
const JPG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAKAAoBAREA/8QAHwAAAQUBAQEB' +
  'AQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1Fh' +
  'ByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZ' +
  'WmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG' +
  'x8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiiiiiiiiiiv/9k=',
  'base64');

/* ── el andamio: una fiesta que existe, y el depósito bajo control ── */
async function conFiesta(browser, guionDeSubida, guionDeFila) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const intentos = [];   // cada vez que el depósito recibe un archivo
  const filas = [];      // cada vez que la base recibe un insert
  const guardado = [];   // los inserts que de verdad quedaron

  await p.route('**/cdnjs.cloudflare.com/**', (r) => r.fulfill({
    status: 200, contentType: 'application/javascript',
    body: 'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};' }));

  // el depósito: cada intento pasa por el guion, que decide si anda o no
  await p.route('**/storage/v1/object/ce-medios/**', (r) => {
    const n = intentos.push(r.request().url().split('/ce-medios/')[1]);
    guionDeSubida(r, n);
  });
  await p.route('**/storage/v1/object/public/ce-medios/**', (r) =>
    r.fulfill({ status: 200, contentType: 'image/jpeg', body: JPG }));

  await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/rest/v1/**', (r) => {
    const req = r.request(), u = req.url();
    if (u.includes('ce_eventos')) return r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify([{ codigo: COD, nombre: 'Fiesta con mal wifi', fecha: '2026-11-08',
        tono: '#D9AE72', moderar: false, cerrado: false, creado: 1 }]) });
    if (u.includes('ce_items') && req.method() === 'POST') {
      let fila = {};
      try { fila = JSON.parse(req.postData() || '{}'); } catch (e) {}
      filas.push(fila);
      if (guionDeFila) return guionDeFila(r, filas.length, fila, guardado);
      guardado.push(fila);
      return r.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    }
    return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await p.goto(BASE + '/muro.html#subir/' + COD, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  return { ctx, p, intentos, filas, guardado, errs };
}

async function mandarUnaFoto(p) {
  await p.setInputFiles('#file', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: JPG });
  await p.waitForTimeout(1200);
  await p.fill('#autor', 'La tía Nélida');
  await p.click('#enviar');
}

(async () => {
  const browser = await chromium.launch();

  /* ══ EL MURO ══ */
  titulo('el muro: se corta una vez y la foto llega igual');
  {
    // el primer intento muere como muere una conexión de verdad
    const { ctx, p, intentos, guardado, errs } = await conFiesta(browser,
      (r, n) => (n === 1 ? r.abort('connectionfailed')
                         : r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' })));
    await mandarUnaFoto(p);
    await p.waitForTimeout(9000);
    const texto = (await p.evaluate(() => document.body.innerText)).toLowerCase();
    if (intentos.length < 2) mal(`no reintentó: ${intentos.length} intento(s), la foto se perdió`);
    else bien(`reintentó (${intentos.length} intentos en total)`);
    if (!guardado.length) mal('la foto no llegó a la base después del corte');
    else bien('y la foto quedó guardada');
    /* La regla de siempre: si no se guardó, el mensaje no puede decir
       "listo". Acá SÍ se guardó, así que tiene que decirlo. */
    if (/no se pudo|algo se cort|error/.test(texto))
      mal('llegó bien pero le muestra un error: ' + texto.slice(0, 120));
    else bien('y al invitado no se le muestra ningún error');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  titulo('el muro: una negativa de la base no se reintenta');
  {
    /* 400 es "no", y no cambia por insistir. Reintentarlo son nueve
       segundos de espera para darle el mismo error. */
    const { ctx, p, intentos, guardado, errs } = await conFiesta(browser,
      (r) => r.fulfill({ status: 400, contentType: 'application/json',
        body: '{"message":"el camino ya existe"}' }));
    await mandarUnaFoto(p);
    await p.waitForTimeout(9000);
    const texto = (await p.evaluate(() => document.body.innerText)).toLowerCase();
    if (intentos.length !== 1) mal(`reintentó una negativa ${intentos.length} veces`);
    else bien('no reintenta: un 400 se responde de una');
    if (guardado.length) mal('¡guardó en la base una foto que no se subió!');
    else bien('y no guarda en la base lo que no se subió');
    if (!/no se pudo|no pudimos|algo se cort|error|falló/.test(texto))
      mal('la subida falló y no se lo dice: ' + texto.slice(0, 160));
    else bien('y se lo dice, no le miente con un "listo"');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  titulo('el muro: si se corta las tres veces, lo dice');
  {
    const { ctx, p, intentos, guardado, errs } = await conFiesta(browser,
      (r) => r.abort('connectionfailed'));
    await mandarUnaFoto(p);
    await p.waitForTimeout(14000);
    const texto = (await p.evaluate(() => document.body.innerText)).toLowerCase();
    if (intentos.length !== 3) mal(`intentó ${intentos.length} veces, se esperaban 3`);
    else bien('intenta tres veces y se rinde');
    if (guardado.length) mal('¡guardó en la base una foto que nunca subió!');
    else bien('y no guarda nada en la base');
    if (!/no se pudo|no pudimos|algo se cort|error|falló|conexi/.test(texto))
      mal('se rindió en silencio: ' + texto.slice(0, 160));
    else bien('y se lo dice');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  /* ══ EL ROLLO ══
     Acá se mide la pieza directamente: manejar la cámara de verdad para
     medir un reintento es mucha maquinaria para lo que se quiere saber,
     y lo que se quiere saber es si SB.subir insiste o no. */
  titulo('el rollo: la subida insiste, pero solo cuando tiene sentido');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    let intentos = 0, guion = null;
    await p.route('**/storage/v1/object/ce-rollos/**', (r) => { intentos++; guion(r, intentos); });
    await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/rest/v1/**', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await p.goto(BASE + '/rollo.html', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1200);

    const subir = () => p.evaluate(async () => {
      const b = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
      try { await SB.subir('QUI-REDXXX/tok/f.jpg', b); return 'ok'; }
      catch (e) { return 'falló: ' + (e && e.message || ''); }
    });

    // el servidor se cae dos veces y a la tercera contesta
    intentos = 0;
    guion = (r, n) => (n < 3 ? r.fulfill({ status: 503, body: 'ups' })
                             : r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    let res = await subir();
    if (res !== 'ok') mal('con dos 503 y un 200 tendría que subir: ' + res);
    else if (intentos !== 3) mal(`subió pero en ${intentos} intentos`);
    else bien('dos caídas del servidor y a la tercera sube (3 intentos)');

    // una negativa: un solo intento
    intentos = 0;
    guion = (r) => r.fulfill({ status: 403, body: 'no' });
    res = await subir();
    if (res === 'ok') mal('un 403 tendría que fallar y devolvió ok');
    else if (intentos !== 1) mal(`reintentó una negativa: ${intentos} intentos`);
    else bien('un 403 se responde de una, sin reintentar');

    // la red cortada de verdad
    intentos = 0;
    guion = (r) => r.abort('connectionfailed');
    res = await subir();
    if (res === 'ok') mal('con la red cortada devolvió ok');
    else if (intentos !== 3) mal(`con la red cortada intentó ${intentos} veces, se esperaban 3`);
    else bien('con la red cortada intenta tres veces y recién ahí se rinde');

    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  /* ══ LA FILA QUE QUEDABA HUÉRFANA ══
     Lo caro ya pasó: el archivo está arriba. Lo que queda es un pedido de
     un kilobyte, y si JUSTO ese se cae, hasta acá el invitado veía "no se
     pudo" y el archivo quedaba en el depósito sin ninguna fila que lo
     nombre: pagado, invisible y para siempre. */
  titulo('la foto ya subió y se cae el último pedido');
  {
    const { ctx, p, intentos, guardado, errs } = await conFiesta(browser,
      (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' }),
      (r, n, fila, ok) => {
        if (n === 1) return r.abort('connectionfailed');
        ok.push(fila);
        return r.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
      });
    await mandarUnaFoto(p);
    await p.waitForTimeout(9000);
    const texto = (await p.evaluate(() => document.body.innerText)).toLowerCase();
    if (!guardado.length) mal('la fila no se reintentó: el archivo quedó huérfano en el depósito');
    else bien('reintenta el insert y la fila queda guardada');
    if (intentos.length !== 1) mal(`volvió a subir el archivo ${intentos.length} veces (se paga dos veces)`);
    else bien('y NO vuelve a subir el archivo, que ya estaba');
    if (/no se pudo|algo se cort|error/.test(texto))
      mal('quedó guardada pero le muestra un error: ' + texto.slice(0, 120));
    else bien('y al invitado no se le muestra ningún error');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  titulo('el insert entró pero la respuesta se perdió');
  {
    /* El caso más difícil de ver: el primer intento SÍ llegó a la base, y
       lo que se cortó fue la respuesta. El segundo intento choca con la
       clave repetida —el id lo pone el teléfono y es la clave primaria—, y
       eso quiere decir "ya estaba", no "falló". */
    const { ctx, p, guardado, errs } = await conFiesta(browser,
      (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' }),
      (r, n, fila, ok) => {
        if (n === 1) { ok.push(fila); return r.abort('connectionfailed'); }
        return r.fulfill({ status: 409, contentType: 'application/json',
          body: '{"code":"23505","message":"duplicate key value violates unique constraint"}' });
      });
    await mandarUnaFoto(p);
    await p.waitForTimeout(9000);
    const texto = (await p.evaluate(() => document.body.innerText)).toLowerCase();
    if (guardado.length !== 1) mal('el andamio no reprodujo el caso');
    else if (/no se pudo|algo se cort|error|duplicate/.test(texto))
      mal('la foto está guardada y le dice que falló: ' + texto.slice(0, 140));
    else bien('una clave repetida se lee como "ya estaba", no como un error');
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
