/* ═══════════════════════════════════════════════════════════════
   EL LISTADO: cómo lee el cliente quiénes confirmaron

   Es la única pantalla del producto que usa quien contrató, y la usa
   una vez: la semana antes de la fiesta, para armar las mesas. Si
   dice un número equivocado no hay forma de notarlo —la planilla
   está en Google y nadie la va a ir a contar a mano—, así que
   encarga comida para la gente que diga esto.

   Lo que se mide acá es justamente eso: que los tres números y la
   tabla salgan de lo que manda la PLANILLA y no de una columna
   adivinada por la página. Contados de los dos lados, el día que la
   columna se llame distinto la pantalla dice "0 confirmaron" con la
   planilla llena y no hay ningún error a la vista.

   El Apps Script no se toca desde acá: se lo reemplaza interceptando
   el pedido, igual que `puertas.js` hace con el HTML. La lógica de
   adentro del Apps Script la mide `pruebas/rsvp.js`, sin navegador.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8099';
const PLANTILLA = BASE + '/invitaciones/plantilla-listado/index.html';

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const es = (c, m) => c ? bien(m) : mal(m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

const URL_FALSA = 'https://script.google.com/macros/s/AKfyFALSA123/exec';

/* La planilla de mentira: seis invitados y el resumen que mandaría el
   Apps Script de verdad, con una columna que NO se llama como la de
   Pía, que es lo que la página no puede dar por sentado. */
const RESPUESTA = {
  invitados: [
    { 'Cuándo': '2027-02-01 21:10', Nombre: 'Sofía Pérez',  Confirma: 'Sí',     'Menú': 'Vegetariano' },
    { 'Cuándo': '2027-02-01 21:12', Nombre: 'Bruno Díaz',   Confirma: 'No',     'Menú': '' },
    { 'Cuándo': '2027-02-01 21:20', Nombre: 'Caro Gómez',   Confirma: 'Sí',     'Menú': 'Sin TACC' },
    { 'Cuándo': '2027-02-02 10:02', Nombre: 'Diego Ruiz',   Confirma: 'no voy', 'Menú': '' },
    { 'Cuándo': '2027-02-02 10:40', Nombre: 'Elena Soto',   Confirma: 'Sí',     'Menú': '' },
    { 'Cuándo': '2027-02-02 11:15', Nombre: 'Fede Álvarez', Confirma: 'Sí',     'Menú': '' }
  ],
  resumen: { total: 6, confirmados: 4, no: 2 },
  columnas: { nombre: 'Nombre', confirma: 'Confirma' }
};

/* Abre la plantilla con su CONFIG rellenada —como quedaría copiada a
   <evento>/listado/— y con el Apps Script reemplazado. */
async function abrir(ctx, { responde = RESPUESTA, config = true } = {}) {
  const pag = await ctx.newPage();
  const errores = [];
  pag.on('pageerror', e => errores.push(String(e)));
  if (config) {
    await pag.route(PLANTILLA, async ruta => {
      const r = await ruta.fetch();
      let html = await r.text();
      html = html.replace('nombreEvento: ""', 'nombreEvento: "Casamiento de prueba"')
                 .replace('appsScriptUrl: ""', `appsScriptUrl: "${URL_FALSA}"`);
      await ruta.fulfill({ response: r, body: html });
    });
  }
  await pag.route('https://script.google.com/**', ruta =>
    ruta.fulfill({ status: 200, contentType: 'application/json',
                   body: JSON.stringify(typeof responde === 'function' ? responde(ruta.request().url()) : responde) }));
  await pag.goto(PLANTILLA, { waitUntil: 'domcontentloaded' });
  return { pag, errores };
}

const txt = async (pag, sel) => (await pag.locator(sel).first().innerText()).trim();

(async () => {
  const navegador = await chromium.launch();
  /* Un contexto por bloque: el localStorage de uno le saltea el portón
     al siguiente y la comprobación de la puerta pasaría sin medirla.
     El bloque de la clave guardada pide los suyos aparte. */
  const nuevoCtx = () => navegador.newContext({ acceptDownloads: true });
  let ctx = await nuevoCtx();

  titulo('la puerta: sin la clave no se ve nada');
  {
    const { pag, errores } = await abrir(ctx);
    const cuerpo = (await pag.locator('body').innerText()).toLowerCase();
    es(cuerpo.includes('clave'), 'pide la clave al entrar');
    es(!cuerpo.includes('sofía'), 'y no hay ni un nombre en la pantalla');
    es(await pag.locator('#tabla-wrap').isHidden(), 'la tabla está escondida');

    /* La clave la comprueba el Apps Script, no la página: acá se
       simula que contesta que no. */
    await pag.route('https://script.google.com/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json',
                  body: JSON.stringify({ error: 'clave', mensaje: 'Clave incorrecta.' }) }));
    await pag.fill('#clave-input', 'la-que-no-es');
    await pag.keyboard.press('Enter');
    await pag.waitForTimeout(400);
    es((await pag.locator('body').innerText()).toLowerCase().includes('no'),
       'con una clave que no es, lo dice');
    es(await pag.locator('#tabla-wrap').isHidden(), 'y la tabla sigue escondida');
    es(errores.length === 0, 'sin errores de JavaScript');
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('con la clave: los tres números salen de la planilla');
  {
    const { pag, errores } = await abrir(ctx);
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });

    es(await txt(pag, '#stat-total') === '6', 'en total: 6');
    es(await txt(pag, '#stat-confirmados') === '4', 'confirmados: 4');
    es(await txt(pag, '#stat-no') === '2', 'no asisten: 2');

    const filas = await pag.locator('#tabla-body tr').count();
    es(filas === 6, 'la tabla trae las seis filas');
    const cuerpo = await pag.locator('#tabla-body').innerText();
    es(cuerpo.includes('Sofía Pérez') && cuerpo.includes('Fede Álvarez'),
       'con los nombres, el primero y el último');
    es(cuerpo.includes('Vegetariano') && cuerpo.includes('Sin TACC'),
       'y las columnas que la invitación agregó sola');

    /* El verde y el rojo salen de la MISMA cuenta que los números. */
    es(await pag.locator('#tabla-body .confirma-si').count() === 4,
       'cuatro filas marcadas como que van');
    const noVa = await pag.locator('#tabla-body .confirma-no').allInnerTexts();
    es(noVa.some(t => t.includes('no voy')),
       '"no voy" queda marcado como que NO va');
    es(errores.length === 0, 'sin errores de JavaScript');
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('la clave se escribe una vez por evento');
  {
    const { pag } = await abrir(ctx);
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });
    await pag.close();

    const { pag: p2 } = await abrir(ctx);
    await p2.waitForSelector('#tabla-wrap:visible', { timeout: 5000 }).catch(() => {});
    es(await p2.locator('#tabla-wrap').isVisible(), 'al volver entra solo');
    const guardadas = await p2.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('ce:listado')));
    es(guardadas.length === 1 && guardadas[0] !== 'ce:listado:clave',
       `la guarda con una llave propia de ese evento (${guardadas[0]})`);
    await p2.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('un Apps Script a medio armar se distingue de una clave mala');
  {
    const { pag } = await abrir(ctx, {
      responde: { error: 'sin_clave_configurada',
                  mensaje: 'Falta correr la función preparar() una vez.' } });
    await pag.fill('#clave-input', 'lo-que-sea');
    await pag.keyboard.press('Enter');
    await pag.waitForTimeout(400);
    const t = (await pag.locator('body').innerText()).toLowerCase();
    es(t.includes('apps script') || t.includes('planilla'),
       'dice que falta terminar de armarlo, no "esa clave no es"');
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('la planilla vacía no parece rota');
  {
    const { pag, errores } = await abrir(ctx, {
      responde: { invitados: [], resumen: { total: 0, confirmados: 0, no: 0 } } });
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForTimeout(500);
    const t = (await pag.locator('body').innerText()).toLowerCase();
    es(t.includes('todav') || t.includes('ningun') || t.includes('nadie') || t.includes('vac'),
       'dice que todavía no confirmó nadie');
    es(errores.length === 0, 'sin errores de JavaScript');
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('contra una planilla con el Apps Script VIEJO');
  {
    /* Hasta que no se pegue el doGet nuevo, la planilla de Pía
       contesta así: sin resumen, sin decir con qué columnas trabajó,
       y con los títulos de SU formulario. La pantalla tiene que
       servir igual — si no, el día que se migre se rompe el listado
       de una clienta que hoy anda. */
    const { pag, errores } = await abrir(ctx, { responde: { invitados: [
      { 'Fecha y hora de la confirmación': '2026-11-01 20:00',
        'Persona 1 - Nombre': 'Sofía', '¿Confirma?': 'Confirmo asistencia',
        'Canción pedida': 'Cualquiera' },
      { 'Fecha y hora de la confirmación': '2026-11-01 20:30',
        'Persona 1 - Nombre': 'Bruno', '¿Confirma?': 'No voy a poder',
        'Canción pedida': '', 'Persona 4 - Nombre': '' }
    ] } });
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });
    es(await txt(pag, '#stat-total') === '2', 'cuenta los dos');
    es(await txt(pag, '#stat-confirmados') === '1', 'y uno solo confirmado');
    es(await pag.locator('#tabla-body .confirma-si').count() === 1,
       'encuentra sola la columna "¿Confirma?" y pinta el verde');
    /* Y no la de al lado: "Fecha y hora de la confirmaCIÓN" contiene
       la palabra, y buscándola por "contiene" el listado pintaba el
       sí/no contra el reloj. */
    es(await pag.evaluate(() => COL_CONFIRMA) === '¿Confirma?',
       'y no se queda con la del reloj, que dice "confirmación"');
    es(await pag.evaluate(() => COL_NOMBRE) === 'Persona 1 - Nombre',
       'y encuentra la del nombre aunque se llame "Persona 1 - Nombre"');
    es((await pag.locator('#tabla-body').innerText()).includes('Sofía'),
       'y dibuja las columnas de ESE formulario');
    /* Un formulario que admite cinco acompañantes trae veinte columnas
       que nadie llenó. Con todas puestas la tabla no se lee. */
    /* En minúsculas: la cabecera va en mayúsculas por CSS e innerText
       devuelve el texto YA transformado. Es la regla de siempre. */
    const cab = (await pag.locator('#tabla-head').innerText()).toLowerCase();
    es(!cab.includes('persona 4'), 'y deja apagada la columna que no contestó nadie');
    es(cab.includes('canción pedida'), 'pero muestra la que contestó alguien');
    es(errores.length === 0, 'sin errores de JavaScript');
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('el Excel, que es para lo que de verdad entra');
  {
    const { pag } = await abrir(ctx);
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });
    const bajada = pag.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await pag.click('#btn-excel');
    const d = await bajada;
    es(!!d, 'el botón baja un archivo');
    if (d) es(/\.xlsx$/.test(d.suggestedFilename()),
              `y es un Excel (${d.suggestedFilename()})`);
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('la plantilla sin llenar avisa, no se queda muda');
  {
    const { pag } = await abrir(ctx, { config: false });
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForTimeout(400);
    const t = (await pag.locator('body').innerText()).toLowerCase();
    es(t.includes('config') || t.includes('falta'),
       'con CONFIG vacío dice qué falta');
    await pag.close();
  }

  await ctx.close(); ctx = await nuevoCtx();
  titulo('el listado de verdad que ya está publicado');
  {
    /* La plantilla puede estar perfecta y la copia publicada no abrir:
       las librerías van por camino relativo (../../lib/) y desde otra
       profundidad eso es un 404 sin error a la vista. */
    const pag = await ctx.newPage();
    const errores = []; pag.on('pageerror', e => errores.push(String(e)));
    await pag.route('https://script.google.com/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json',
                  body: JSON.stringify(RESPUESTA) }));
    await pag.goto(BASE + '/pia/listado/', { waitUntil: 'domcontentloaded' });
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });
    es(await txt(pag, '#stat-confirmados') === '4', 'abre y cuenta');
    es(await pag.evaluate(() => typeof XLSX !== 'undefined'),
       'y la librería del Excel le llega por su camino relativo');
    es(errores.length === 0, 'sin errores de JavaScript');
    await pag.close();
  }

  /* ══════════ el número grande son PERSONAS ══════════
     Lo reportó el dueño con la planilla en la mano: «confirmaron dos
     personas pero en la cuenta figura como 1». El tablero contaba
     RESPUESTAS, y una respuesta que dice "Cuántos: 4" es una familia
     de cuatro. Contada como una, el cliente encarga comida para menos
     gente de la que va a ir, y eso se descubre la noche de la fiesta.

     Se mide con las dos mitades: que el número de arriba sume la
     gente, y que el de las respuestas siga siendo el de las
     respuestas — si se arregla uno y se rompe el otro, el cliente
     deja de saber cuántas familias le contestaron. */
  {
    const titulo2 = (t) => console.log('\n─── ' + t + ' ───');
    /* La clave se guarda en el aparato, así que a la segunda pantalla
       ya entra sola y el campo ni se dibuja: pedírselo la cuelga
       esperando un campo que no existe. */
    const entrar = async (pg) => {
      if (await pg.locator('#clave-input').isVisible().catch(() => false)){
        await pg.fill('#clave-input', 'la-clave');
        await pg.keyboard.press('Enter');
      }
      await pg.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });
    };
    titulo2('cuánta gente viene, no cuántas respuestas');
    const conCuantos = { invitados: [
      { 'Cuándo': '2028-01-02 13:00', Nombre: 'Jere Arone', Confirma: 'Sí', 'Cuántos': '2' },
      { 'Cuándo': '2028-01-02 13:02', Nombre: 'Aquiles',    Confirma: 'Sí', 'Cuántos': '4' },
      { 'Cuándo': '2028-01-02 13:05', Nombre: 'Carla',      Confirma: 'No', 'Cuántos': '' }
    ], columnas: { nombre: 'Nombre', confirma: 'Confirma' } };

    /* Sin resumen: lo cuenta la pantalla con las filas que ya tiene.
       Es el caso de HOY, con el Apps Script que ya está publicado y
       sin volver a pegar nada. */
    const { pag, errores } = await abrir(ctx, { responde: conCuantos });
    await pag.fill('#clave-input', 'la-clave');
    await pag.keyboard.press('Enter');
    await pag.waitForSelector('#tabla-wrap:visible', { timeout: 5000 });
    es(await txt(pag, '#stat-confirmados') === '6',
       `vienen 6 personas (2 + 4), no 2 respuestas (dio ${await txt(pag, '#stat-confirmados')})`);
    es(await txt(pag, '#stat-total') === '3', 'y siguen siendo 3 respuestas');
    es(await txt(pag, '#stat-no') === '1', 'y una que no viene');
    es(errores.length === 0, 'sin errores de JavaScript');
    await pag.close();

    /* Y con el resumen de la planilla, que es quien tiene los títulos
       de verdad: gana el suyo. */
    const { pag: pag2 } = await abrir(ctx, { responde: Object.assign({}, conCuantos, {
      resumen: { total: 3, confirmados: 2, no: 1, personas: 6 } }) });
    await entrar(pag2);
    es(await txt(pag2, '#stat-confirmados') === '6', 'y con el resumen de la planilla, lo mismo');
    await pag2.close();

    /* Un "no" con un número escrito antes de cambiar la respuesta no
       puede sumar gente que no va. */
    const { pag: pag3 } = await abrir(ctx, { responde: { invitados: [
      { 'Cuándo': '2028-01-02 13:00', Nombre: 'Carla', Confirma: 'No', 'Cuántos': '4' }
    ], columnas: { nombre: 'Nombre', confirma: 'Confirma' } } });
    await entrar(pag3);
    es(await txt(pag3, '#stat-confirmados') === '0',
       'y el que dijo que no, no suma su número');
    await pag3.close();
  }

  await navegador.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : `\n✓ Sin fallas`);
  process.exit(fallas.length ? 1 : 0);
})();
