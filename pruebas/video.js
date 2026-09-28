/* ══════════════════════════════════════════════════════════════════
   EL VIDEO DE LOS XV · que las fotos salgan en el orden en que pasaron.

   Lo que se mide acá:
     · el orden sale de la hora ESCRITA ADENTRO de la foto (EXIF), no del
       nombre del archivo ni de su fecha: los archivos se entregan con los
       nombres al revés de la cronología y todos con la misma fecha;
     · se lee el EXIF en las dos órdenes de bytes (II y MM) y los
       subsegundos desempatan una ráfaga;
     · la que no trae hora (una de WhatsApp) queda marcada y avisada, y la
       que no se puede abrir queda afuera DICIÉNDOLO;
     · la fecha de la fiesta se completa sola;
     · se puede mover y sacar;
     · el video se crea de verdad: hay un archivo, pesa, y un <video> lo
       abre con el tamaño pedido. "Listo" solo cuando existe;
     · cortar no dice "listo" ni deja un archivo;
     · con la pestaña escondida la grabación se frena;
     · no sale nada a la red: las fotos no dejan la computadora.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
let fallas = 0;
const ok = (t) => console.log('  ✓ ' + t);
const mal = (t, extra) => { fallas++; console.log(`  ✗ [video] ${t}${extra ? ' → ' + extra : ''}`); };
const afirmar = (cond, t, extra) => (cond ? ok(t) : mal(t, extra));
const texto = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/* ── un EXIF de verdad, armado a mano ──
   IFD0 con el puntero al IFD de Exif, y ahí DateTimeOriginal (0x9003) y
   SubSecTimeOriginal (0x9291). Con las dos órdenes de bytes, porque las
   cámaras usan una y los iPhone la otra. */
function exif(fecha, sub, grande) {
  const b = Buffer.alloc(80);
  const u16 = (o, v) => (grande ? b.writeUInt16BE(v, o) : b.writeUInt16LE(v, o));
  const u32 = (o, v) => (grande ? b.writeUInt32BE(v, o) : b.writeUInt32LE(v, o));
  b.write(grande ? 'MM' : 'II', 0, 'latin1'); u16(2, 42); u32(4, 8);
  u16(8, 1); u16(10, 0x8769); u16(12, 4); u32(14, 1); u32(18, 26); u32(22, 0);
  u16(26, 2);
  u16(28, 0x9003); u16(30, 2); u32(32, 20); u32(36, 56);
  u16(40, 0x9291); u16(42, 2); u32(44, 3); b.write(sub + '\0', 48, 'latin1');
  u32(52, 0);
  b.write(fecha + '\0', 56, 'latin1');
  const cuerpo = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), b.subarray(0, 76)]);
  const cab = Buffer.alloc(4); cab.writeUInt16BE(0xFFE1, 0); cab.writeUInt16BE(cuerpo.length + 2, 2);
  return Buffer.concat([cab, cuerpo]);
}
const conExif = (jpg, fecha, sub, grande) =>
  Buffer.concat([jpg.subarray(0, 2), exif(fecha, sub, grande), jpg.subarray(2)]);

/* un WAV de 12 segundos, para la música */
function wav(seg) {
  const sr = 22050, n = sr * seg, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / sr * 2 * Math.PI * 440) * 8000), 44 + i * 2);
  return b;
}

(async () => {
  const nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const errores = [], afuera = [];
  pg.on('pageerror', (e) => errores.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) errores.push(m.text()); });
  pg.on('request', (r) => {
    const u = r.url();
    if (/^(blob:|data:)/.test(u) || u.startsWith(BASE) || /fonts\.(googleapis|gstatic)\.com/.test(u)) return;
    afuera.push(u);
  });

  await pg.goto(BASE + '/video', { waitUntil: 'domcontentloaded' });
  afirmar(/video de/i.test(await pg.locator('h1').innerText()), 'la dirección limpia /video abre la página');

  /* JPEGs de verdad, dibujados por el propio navegador: uno horizontal y
     uno vertical, de colores distintos. */
  const jpg = async (w, h, color) => Buffer.from(await pg.evaluate(async ([w, h, color]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff'; x.fillRect(w * .3, h * .3, w * .4, h * .4);
    const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', .8));
    return [...new Uint8Array(await b.arrayBuffer())];
  }, [w, h, color]));
  const horiz = await jpg(1600, 900, '#7a3b52');
  const vert = await jpg(900, 1600, '#2b5a7a');

  /* Los nombres van AL REVÉS de la hora: si ordenara por nombre, fallaría. */
  const archivos = [
    { name: 'a_brindis.jpg', mimeType: 'image/jpeg', buffer: conExif(horiz, '2026:03:15 01:10:00', '000', false) },
    { name: 'b_vals.jpg', mimeType: 'image/jpeg', buffer: conExif(vert, '2026:03:14 23:05:00', '500', true) },
    { name: 'c_vals_rafaga.jpg', mimeType: 'image/jpeg', buffer: conExif(horiz, '2026:03:14 23:05:00', '120', false) },
    { name: 'd_llegada.jpg', mimeType: 'image/jpeg', buffer: conExif(horiz, '2026:03:14 21:40:05', '000', true) },
    { name: 'e_whatsapp.jpg', mimeType: 'image/jpeg', buffer: horiz },
    { name: 'f_rota.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('esto no es una foto') },
  ];
  await pg.setInputFiles('#fotos', archivos);
  await pg.waitForSelector('#grilla li.foto', { timeout: 10000 });
  await pg.waitForFunction(() => document.querySelectorAll('#grilla li.foto').length >= 5, null, { timeout: 10000 }).catch(() => {});

  const orden = await pg.$$eval('#grilla li.foto', (l) => l.map((x) => x.dataset.nombre));
  afirmar(JSON.stringify(orden) === JSON.stringify(['d_llegada.jpg', 'c_vals_rafaga.jpg', 'b_vals.jpg', 'a_brindis.jpg', 'e_whatsapp.jpg']),
    'ordena por la hora de la cámara (II y MM), con la ráfaga desempatada por los subsegundos', orden.join(', '));
  const horas = await pg.$$eval('#grilla li.foto .hora', (l) => l.map((x) => x.textContent));
  afirmar(horas[0] === '21:40' && horas[3] === '01:10', 'muestra la hora de la pared, sin correrla por el huso', horas.join(' '));
  afirmar(await pg.locator('#grilla li.sin-hora').count() === 1, 'la de WhatsApp queda marcada como sin hora');
  const avisos = texto(await pg.locator('#avisos').innerText());
  afirmar(/whatsapp/i.test(avisos), 'y se avisa por qué', avisos.slice(0, 120));
  afirmar(/no se pudo abrir/i.test(avisos) && /f_rota/.test(avisos), 'la que no se puede abrir queda afuera DICIÉNDOLO');
  afirmar(await pg.locator('#grilla li.corte').count() >= 1, 'un hueco largo entre fotos marca otro momento de la fiesta');
  afirmar(await pg.inputValue('#fecha') === '14 de marzo de 2026', 'la fecha de la fiesta sale de las fotos (la del día con más)', await pg.inputValue('#fecha'));

  /* mover y sacar */
  await pg.locator('#grilla li.foto').nth(4).locator('button[data-a="antes"]').click();
  let o2 = await pg.$$eval('#grilla li.foto', (l) => l.map((x) => x.dataset.nombre));
  afirmar(o2[3] === 'e_whatsapp.jpg', 'la flecha la corre un lugar', o2.join(', '));
  await pg.locator('#grilla li.foto').nth(3).locator('button[data-a="quitar"]').click();
  o2 = await pg.$$eval('#grilla li.foto', (l) => l.map((x) => x.dataset.nombre));
  afirmar(o2.length === 4 && !o2.includes('e_whatsapp.jpg'), 'la ✕ la saca del video');

  await pg.fill('#nombre', 'Delfina');

  /* el formato */
  await pg.click('#formato button[data-f="v"]');
  afirmar(await pg.$eval('#lienzo', (c) => c.width === 1080 && c.height === 1920), 'vertical es 1080x1920');
  await pg.click('#formato button[data-f="h"]');

  /* la música ajusta la duración */
  await pg.setInputFiles('#cancion', { name: 'vals.wav', mimeType: 'audio/wav', buffer: wav(12) });
  await pg.waitForFunction(() => /vals\.wav/.test(document.querySelector('#cancionNombre').textContent), null, { timeout: 8000 }).catch(() => {});
  const res = texto(await pg.locator('#resumen').innerText());
  afirmar(/12 s/.test(res) && /canción/.test(res), 'con música, el video dura lo que la canción', res);

  /* cortar no deja nada ni dice listo */
  await pg.click('#crear');
  await pg.waitForTimeout(1500);
  await pg.click('#cortar');
  await pg.waitForFunction(() => !document.querySelector('#crear').hidden, null, { timeout: 8000 }).catch(() => {});
  const cortado = texto(await pg.locator('#estado').innerText());
  afirmar(/cortado/i.test(cortado) && !/listo/i.test(cortado) && await pg.locator('#descargar').isHidden(),
    'cortar no dice "listo" ni deja un archivo', cortado);

  /* crear de verdad, escondiendo la pestaña a mitad de camino */
  await pg.click('#crear');
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await pg.waitForTimeout(300);
  const b1 = await pg.$eval('#barra i', (e) => e.style.width);
  await pg.waitForTimeout(1500);
  const b2 = await pg.$eval('#barra i', (e) => e.style.width);
  const pausa = texto(await pg.locator('#estado').innerText());
  afirmar(b1 === b2 && /pausa/i.test(pausa), 'con la pestaña escondida se frena y lo dice', `${b1} → ${b2} · ${pausa}`);
  await pg.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await pg.waitForSelector('#descargar:not([hidden])', { timeout: 40000 }).catch(() => {});
  const fin = texto(await pg.locator('#estado').innerText());
  const peso = +(await pg.getAttribute('#descargar', 'data-peso') || 0);
  afirmar(peso > 20000 && /listo/i.test(fin), 'crea el video y recién ahí dice "listo"', `${peso} bytes · ${fin}`);
  const nombre = await pg.getAttribute('#descargar', 'download');
  afirmar(/^XV Delfina\.(mp4|webm)$/.test(nombre || ''), 'el archivo se llama con el nombre de la quinceañera', nombre);
  const abre = await pg.evaluate(async () => {
    const v = document.createElement('video'); v.muted = true;
    v.src = document.querySelector('#descargar').href;
    return await new Promise((r) => { v.onloadedmetadata = () => r([v.videoWidth, v.videoHeight]); v.onerror = () => r(null); setTimeout(() => r(null), 8000); });
  });
  afirmar(abre && abre[0] === 1920 && abre[1] === 1080, 'el archivo es un video que se abre, en 1920x1080', JSON.stringify(abre));

  afirmar(!afuera.length, 'no sale nada a la red: las fotos no dejan la computadora', afuera.slice(0, 3).join(' '));
  afirmar(!errores.length, 'sin errores de JavaScript', errores.slice(0, 3).join(' | '));

  await nav.close();
  if (fallas) { console.log(`\n  FALLARON ${fallas}`); process.exit(1); }
})().catch((e) => { console.log('  ✗ [video] la suite se cayó → ' + e.message); process.exit(1); });
