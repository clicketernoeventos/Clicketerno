/* Renderiza escena.html cuadro por cuadro y lo encodea a MP4.
   No se graba en tiempo real a propósito: cada cuadro se pide por su
   tiempo exacto (window.pintar(t)), así el video sale parejo aunque la
   máquina vaya lenta, y se puede volver a generar idéntico. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');

const FFMPEG = process.env.FFMPEG;
/* El tamaño y los cuadros por segundo los dice la escena: las verticales
   son 1080x1920 a 30 y el reel 1920x1080 a 60. */
const SALIDA = process.argv[2] || '/tmp/claude-0/video/rollo-eterno.mp4';
const AUDIO = process.argv[3] || '';

(async () => {
  const navegador = await chromium.launch();
  /* Arranca con un tamaño cualquiera: la escena dice el suyo y se
     ajusta apenas carga. */
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const pag = await ctx.newPage();
  const errores = [];
  pag.on('pageerror', e => errores.push(e.message));
  await pag.goto('file://' + __dirname + '/escena.html', { waitUntil: 'load' });
  await pag.waitForFunction('window.__listo===true', { timeout: 60000 });
  const { dur, fps, W, H } = await pag.evaluate(() => {
    const c = document.getElementById('lienzo');
    return { dur: window.__dur, fps: window.__fps || 30, W: c.width, H: c.height };
  });
  await pag.setViewportSize({ width: W, height: H });
  const total = Math.round(dur * fps);
  console.log(`${dur}s · ${fps} fps · ${total} cuadros · ${W}x${H}` +
    (AUDIO ? ' · con música' : ''));

  const args = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0'];
  if (AUDIO) args.push('-i', AUDIO);
  args.push(
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p',                 // sin esto no se ve en iPhone
    '-movflags', '+faststart');            // arranca antes al subirlo
  if (AUDIO) args.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  args.push(SALIDA);
  const ff = spawn(FFMPEG, args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let errFF = '';
  ff.stderr.on('data', d => { errFF += d.toString(); });
  const fin = new Promise((ok, no) => {
    ff.on('close', c => c === 0 ? ok() : no(new Error('ffmpeg salió ' + c + '\n' + errFF.slice(-1500))));
  });

  const lienzo = pag.locator('#lienzo');
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await pag.evaluate(t => window.pintar(t), i / fps);
    const buf = await lienzo.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) {
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
