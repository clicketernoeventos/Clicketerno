/* Renderiza escena.html cuadro por cuadro y lo encodea a MP4.
   No se graba en tiempo real a propósito: cada cuadro se pide por su
   tiempo exacto (window.pintar(t)), así el video sale parejo aunque la
   máquina vaya lenta, y se puede volver a generar idéntico. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');

const FFMPEG = process.env.FFMPEG;
const FPS = 30, W = 1080, H = 1920;
const SALIDA = process.argv[2] || '/tmp/claude-0/video/rollo-eterno.mp4';

(async () => {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const pag = await ctx.newPage();
  const errores = [];
  pag.on('pageerror', e => errores.push(e.message));
  await pag.goto('file://' + __dirname + '/escena.html', { waitUntil: 'load' });
  await pag.waitForFunction('window.__listo===true', { timeout: 60000 });
  const dur = await pag.evaluate(() => window.__dur);
  const total = Math.round(dur * FPS);
  console.log(`${dur}s · ${FPS} fps · ${total} cuadros · ${W}x${H}`);

  const ff = spawn(FFMPEG, [
    '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-pix_fmt', 'yuv420p',                 // sin esto no se ve en iPhone
    '-movflags', '+faststart',             // arranca antes al subirlo
    SALIDA,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let errFF = '';
  ff.stderr.on('data', d => { errFF += d.toString(); });
  const fin = new Promise((ok, no) => {
    ff.on('close', c => c === 0 ? ok() : no(new Error('ffmpeg salió ' + c + '\n' + errFF.slice(-1500))));
  });

  const lienzo = pag.locator('#lienzo');
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await pag.evaluate(t => window.pintar(t), i / FPS);
    const buf = await lienzo.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 90 === 0) {
      const seg = (Date.now() - t0) / 1000;
      process.stdout.write(`  ${i}/${total} · ${seg.toFixed(0)}s\n`);
    }
  }
  ff.stdin.end();
  await fin;
  await navegador.close();
  if (errores.length) console.log('ERRORES JS:', errores[0]);
  console.log('listo en', ((Date.now() - t0) / 1000).toFixed(0) + 's');
})().catch(e => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
