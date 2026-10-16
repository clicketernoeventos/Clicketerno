/* ═══════════════════════════════════════════════════════════════
   MURO EN VIVO · comercial vertical (Reels / TikTok / pantalla)

   Qué cuenta, en una línea: cientos de recuerdos entrando EN VIVO a
   una pantalla, y la fiesta viéndose a sí misma mientras pasa.

   DE DÓNDE SALE LO QUE SE VE, que es lo único que no se negocia:

   · Las fotos son las DIEZ de demo/, las mismas que ya se publican
     con el sitio y que ve cualquiera que entre a "Probar la
     demostración". Son fotos de una fiesta de verdad. No hay una
     sola imagen de banco: una pieza que vende el producto con fotos
     que el producto no sacó miente, y acá el producto son las fotos.
   · Las pantallas de app son CAPTURAS DE VERDAD de img-muro/, que
     saca capturar-muro.js recorriendo el muro contra el Supabase
     falso de las pruebas. Ninguna está dibujada: mostrar una
     pantalla que no existe como si existiera es mentirle al cliente.
   · La interfaz que flota alrededor (los chips, el contador, las
     reacciones) SÍ está dibujada acá, y es lo único: son adornos de
     la pieza, no pantallas del producto. Dicen lo que el producto
     hace de verdad — el contador sube porque el muro cuenta, no
     porque quede lindo.

   LA REJILLA MANDA. 120 BPM, negra = 0,5 s, compás = 2 s, TRECE
   compases = 26,000 s exactos, los mismos que musica-vivo.py. Cada
   corte cae en un tiempo. Si cambia DUR acá, cambia allá.

   dibujar(t) es PURA: el mismo t da siempre el mismo cuadro. Nada de
   Date.now() ni de estado que se arrastre, o el video no se puede
   volver a generar igual.
   ═══════════════════════════════════════════════════════════════ */
const W = 1080, H = 1920, DUR = 26, FPS = 30;

const NEGRA = 0.5, COMPAS = 2.0;

/* Los mismos momentos que musica-vivo.py, con el mismo nombre. */
const T_PULSO = 0.55, T_FOTO1 = 1.00, T_BEAT = 4.00, T_SALA = 10.00,
  T_MOSAICO = 14.00, T_RISER = 18.00, T_GOLPE = 20.00,
  T_FRASE2 = 23.00, T_MARCA = 24.50;

const NEGRO = '#0A0806', ORO = '#D9AE72', CHAMPAN = '#F3D9A6',
  CREMA = '#EDE6D8', MUTE = '#9A8F7F', VIVO = '#FF4D4D';

/* ── matemática de sobremesa ── */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const sale = x => 1 - Math.pow(1 - x, 3);          // desacelera al llegar
const entra = x => x * x * x;                       // acelera al salir
const suave = x => x * x * (3 - 2 * x);
const rebote = x => 1 - Math.pow(1 - x, 2.4) * Math.cos(x * Math.PI * 1.15);
const pulso = (t, a, b) => { const x = inv(t, a, b); return Math.sin(x * Math.PI); };
/* Ruido repetible: la misma n da siempre lo mismo, así el cuadro es puro. */
function rnd(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
/* Latido del beat: 1 justo en el golpe, cae enseguida. */
function beat(t, desde = T_BEAT, cada = NEGRA) {
  if (t < desde) return 0;
  const f = ((t - desde) % cada) / cada;
  return Math.pow(1 - f, 5);
}

let ctx; const IMG = {}; const FOTO = []; let MARCA = null;

/* ── lo básico ── */
function fondo(t) {
  /* Un degradé que respira: el fondo nunca es negro plano, que es lo
     que hace que una pieza se vea barata.

     TODAS las paradas van OPACAS. La primera era `rgba(42,33,24,.55)`
     y con eso el centro de la pantalla no se tapaba nunca: cada cuadro
     dejaba ver el anterior por abajo. Entre dos cuadros seguidos no se
     nota —son casi iguales—, pero en cada CORTE de escena quedaba un
     fotograma con la escena vieja encima, y eso no tira ningún error.
     El latido ahora lo hace el BRILLO del color, no el alfa. */
  const v = .5 + .5 * Math.sin(t * .7);
  const b = 30 + 14 * v;
  const g = ctx.createRadialGradient(W / 2, H * .42, 60, W / 2, H * .5, H * .78);
  g.addColorStop(0, `rgb(${Math.round(b + 12)},${Math.round(b + 3)},${Math.round(b * .72)})`);
  g.addColorStop(.45, 'rgb(18,14,11)');
  g.addColorStop(1, NEGRO);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function texto(s, x, y, { tam = 48, fam = 'Jost', peso = 300, color = CREMA,
  alfa = 1, esp = 0, align = 'center' } = {}) {
  if (alfa <= .002) return;
  ctx.save(); ctx.globalAlpha = clamp(alfa, 0, 1); ctx.fillStyle = color;
  ctx.font = `${peso} ${tam}px "${fam}"`;
  ctx.textBaseline = 'alphabetic';
  if (esp) {
    const l = [...s]; ctx.textAlign = 'left';
    const an = l.reduce((a, c) => a + ctx.measureText(c).width + esp, -esp);
    let px = align === 'center' ? x - an / 2 : x;
    for (const c of l) { ctx.fillText(c, px, y); px += ctx.measureText(c).width + esp; }
  } else { ctx.textAlign = align; ctx.fillText(s, x, y); }
  ctx.restore();
}

function anchoTexto(s, { tam = 48, fam = 'Jost', peso = 300, esp = 0 } = {}) {
  ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`;
  const an = esp
    ? [...s].reduce((a, c) => a + ctx.measureText(c).width + esp, -esp)
    : ctx.measureText(s).width;
  ctx.restore(); return an;
}

function grano(t, f = .045) {
  const s = Math.floor(t * FPS);
  ctx.save(); ctx.globalAlpha = f;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rnd(i * 7 + s) > .5 ? '#FFF' : '#000';
    ctx.fillRect(rnd(i + s * 7919) * W, rnd(i * 3.3 + s * 104729) * H, 2, 2);
  }
  ctx.restore();
}

function vineta(f = .55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .86);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* ── la rejilla técnica del fondo ── */
function grilla(t, alfa) {
  if (alfa <= .004) return;
  ctx.save(); ctx.globalAlpha = alfa * .5;
  ctx.strokeStyle = 'rgba(217,174,114,.5)'; ctx.lineWidth = 1;
  const paso = 90, corr = (t * 14) % paso;
  ctx.beginPath();
  for (let x = -paso; x < W + paso; x += paso) { ctx.moveTo(x + corr, 0); ctx.lineTo(x + corr, H); }
  for (let y = -paso; y < H + paso; y += paso) { ctx.moveTo(0, y + corr); ctx.lineTo(W, y + corr); }
  ctx.stroke();
  ctx.restore();
}

/* ── partículas: polvo de luz con profundidad ── */
function particulas(t, alfa = 1) {
  if (alfa <= .004) return;
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const z = .35 + rnd(i * 5.1) * .65;                 // profundidad
    const x = (rnd(i * 2.3) * W + t * 11 * z) % (W + 120) - 60;
    const y = (rnd(i * 7.7) * H - t * 26 * z) % (H + 120);
    const r = (.9 + rnd(i * 3.9) * 2.4) * z;
    ctx.globalAlpha = alfa * (.12 + rnd(i * 1.7) * .3) * z;
    ctx.fillStyle = rnd(i * 11.3) > .72 ? CHAMPAN : ORO;
    ctx.beginPath(); ctx.arc(x, y < 0 ? y + H + 120 : y, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* ── estelas de luz, para los momentos rápidos ── */
function estelas(t, alfa) {
  if (alfa <= .004) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 7; i++) {
    const f = (t * (.5 + rnd(i) * .7) + rnd(i * 3.1)) % 1;
    const y = rnd(i * 9.4) * H;
    const largo = 240 + rnd(i * 5.5) * 520;
    const x = -largo + f * (W + largo * 2);
    const g = ctx.createLinearGradient(x, y, x + largo, y);
    g.addColorStop(0, 'rgba(217,174,114,0)');
    g.addColorStop(.5, `rgba(243,217,166,${alfa * .30})`);
    g.addColorStop(1, 'rgba(217,174,114,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, largo, 1.6);
  }
  ctx.restore();
}

/* ── dibujar una imagen CUBRIENDO una caja, sin deformarla ── */
function cubrir(img, x, y, w, h) {
  const ri = img.width / img.height, rc = w / h;
  let sw, sh, sx, sy;
  if (ri > rc) { sh = img.height; sw = sh * rc; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / rc; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ── la tarjeta de foto: el ladrillo de toda la pieza ── */
function tarjeta(img, cx, cy, w, h, {
  alfa = 1, giro = 0, escala = 1, radio = 22, brillo = 0, borde = true, desenfoque = 0 } = {}) {
  if (alfa <= .004 || !img) return;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(escala, escala);
  if (desenfoque > .2) ctx.filter = `blur(${desenfoque}px)`;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 48; ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#15110D';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, radio); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, radio); ctx.clip();
  cubrir(img, -w / 2, -h / 2, w, h);
  if (brillo > .01) {                        // el barrido de luz al aparecer
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(clamp(brillo, 0, 1), `rgba(255,255,255,${.5 * (1 - brillo)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  if (borde) {
    ctx.strokeStyle = `rgba(243,217,166,${.26 * alfa})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, radio - 1); ctx.stroke();
  }
  ctx.restore();
}

/* ── chip de interfaz, con vidrio esmerilado ──
   No es un sticker pegado encima: tiene fondo translúcido, borde y
   sombra, que es lo que hace que se lea como parte de una interfaz. */
function chip(txt, cx, cy, { alfa = 1, color = CREMA, punto = '', tam = 26,
  escala = 1, fuerte = false } = {}) {
  if (alfa <= .004) return;
  const esp = 3.4;
  const anT = anchoTexto(txt, { tam, peso: 600, esp });
  const padX = 26, alto = tam + 30;
  const anP = punto ? 22 : 0;
  const an = anT + padX * 2 + anP;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.scale(escala, escala);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
  ctx.fillStyle = fuerte ? 'rgba(217,174,114,.92)' : 'rgba(22,18,14,.62)';
  ctx.beginPath(); ctx.roundRect(-an / 2, -alto / 2, an, alto, alto / 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = fuerte ? 'rgba(255,240,210,.6)' : 'rgba(243,217,166,.32)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.roundRect(-an / 2 + .7, -alto / 2 + .7, an - 1.4, alto - 1.4, alto / 2); ctx.stroke();
  let x0 = -an / 2 + padX;
  if (punto) {
    ctx.fillStyle = punto; ctx.beginPath(); ctx.arc(x0 + 5, 0, 7, 0, 7); ctx.fill();
    ctx.globalAlpha = clamp(alfa, 0, 1) * .3;
    ctx.beginPath(); ctx.arc(x0 + 5, 0, 13, 0, 7); ctx.fill();
    ctx.globalAlpha = clamp(alfa, 0, 1);
    x0 += anP;
  }
  ctx.fillStyle = fuerte ? '#1A1409' : color;
  ctx.font = `600 ${tam}px "Jost"`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let px = x0;
  for (const c of [...txt]) { ctx.fillText(c, px, 1); px += ctx.measureText(c).width + esp; }
  ctx.restore();
}

/* ── corazón, dibujado (nada de emoji: en el render no carga) ── */
function corazon(cx, cy, r, alfa, color = VIVO) {
  if (alfa <= .004) return;
  ctx.save(); ctx.globalAlpha = clamp(alfa, 0, 1); ctx.fillStyle = color;
  ctx.translate(cx, cy); ctx.scale(r / 16, r / 16);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-14, -4, -9, -16, 0, -8);
  ctx.bezierCurveTo(9, -16, 14, -4, 0, 6);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ── el teléfono con una captura de la app adentro ──
   Las capturas son 1170x2532 (390x844 por 3); 600x1298 tiene la misma
   proporción, así que la pantalla no se deforma. */
const TW = 600, TH = 1298;
function telefono(cx, cy, img, { escala = 1, alfa = 1, giro = 0, desliz = 0 } = {}) {
  if (alfa <= .004 || !img) return;
  const B = 15, R = 52;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(escala, escala);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 28;
  ctx.fillStyle = '#17130F';
  ctx.beginPath(); ctx.roundRect(-TW / 2 - B, -TH / 2 - B, TW + B * 2, TH + B * 2, R + 8); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-TW / 2, -TH / 2, TW, TH, R); ctx.clip();
  ctx.drawImage(img, -TW / 2, -TH / 2 - desliz, TW, TH);
  ctx.restore();
  ctx.strokeStyle = 'rgba(217,174,114,.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-TW / 2 - B + 1, -TH / 2 - B + 1, TW + B * 2 - 2, TH + B * 2 - 2, R + 7); ctx.stroke();
  ctx.restore();
}

/* ── la pantalla del salón: 16:9, con pie ── */
function pantallaSalon(cx, cy, img, { ancho = 980, alfa = 1, escala = 1, giro = 0 } = {}) {
  if (alfa <= .004 || !img) return;
  const w = ancho, h = ancho * 9 / 16, B = 13;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(escala, escala);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 30;
  ctx.fillStyle = '#17130F';
  ctx.beginPath(); ctx.roundRect(-w / 2 - B, -h / 2 - B, w + B * 2, h + B * 2, 16); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.clip();
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(217,174,114,.32)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-w / 2 - B + 1, -h / 2 - B + 1, w + B * 2 - 2, h + B * 2 - 2, 15); ctx.stroke();
  ctx.fillStyle = 'rgba(23,19,15,.95)';                      // el pie del monitor
  ctx.fillRect(-w * .09, h / 2 + B, w * .18, 26);
  ctx.beginPath(); ctx.roundRect(-w * .20, h / 2 + B + 24, w * .40, 14, 7); ctx.fill();
  ctx.restore();
}

/* ── el contador, que es la promesa del producto en un número ── */
function contador(n, cx, cy, { alfa = 1, escala = 1, rot = '' } = {}) {
  if (alfa <= .004) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(escala, escala);
  const s = String(Math.round(n));
  texto(s, 0, 0, { tam: 108, peso: 600, color: CHAMPAN, alfa, fam: 'Jost' });
  if (rot) texto(rot, 0, 44, { tam: 21, peso: 600, color: MUTE, alfa: alfa * .9, esp: 7 });
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   LA POSICIÓN DE CADA FOTO
   El muro final es una grilla de 10. Se calcula una sola vez y todas
   las escenas se mueven HACIA o DESDE esa grilla: así la pieza se
   siente como una sola cosa que se arma, y no como diez planos
   distintos pegados.
   ═══════════════════════════════════════════════════════════════ */
const COLS = 3, FILAS = 4, HUECO = 16, MARGEN = 30;
const CW = (W - MARGEN * 2 - HUECO * (COLS - 1)) / COLS;   // 329,3
const CH = CW * 1.05;                                       // 345,8
const MURO_ALTO = FILAS * CH + (FILAS - 1) * HUECO;         // 1431
/* El muro arranca en 300 y termina en 1731: arriba quedan los chips y
   abajo el contador. Calculado y no a ojo — con la altura puesta a
   mano la cuarta fila se iba 65px por debajo del borde y la décima
   foto no se veía nunca. */
const MURO_Y = 300;
const MURO = [];
for (let i = 0; i < 10; i++) {
  const c = i % COLS, f = Math.floor(i / COLS);
  /* La décima va sola: centrada y de dos columnas, para que el bloque
     no termine en un escalón. */
  const sola = i === 9;
  MURO.push({
    x: sola ? W / 2 : MARGEN + c * (CW + HUECO) + CW / 2,
    y: MURO_Y + f * (CH + HUECO) + CH / 2,
    w: sola ? CW * 2 + HUECO : CW,
    h: CH,
  });
}

/* De dónde entra volando cada foto, fuera de la pantalla. */
const DESDE = MURO.map((m, i) => {
  const a = rnd(i * 13.7) * Math.PI * 2;
  return { x: W / 2 + Math.cos(a) * (W * 1.15), y: H / 2 + Math.sin(a) * (H * .85),
           giro: (rnd(i * 4.4) - .5) * 1.5 };
});

/* ═══════════════════════════════════════════════════════════════
   LAS ESCENAS
   ═══════════════════════════════════════════════════════════════ */

/* 0 · 0,0 – 2,0 · el pulso y la primera foto ───────────────────── */
function escPulso(t) {
  /* el latido: cinco anillos en negras, con la pantalla casi negra */
  for (let k = 0; k < 5; k++) {
    const ti = T_PULSO + k * NEGRA;
    const x = inv(t, ti, ti + .75);
    if (x <= 0 || x >= 1) continue;
    ctx.save();
    ctx.globalAlpha = (1 - x) * .55;
    ctx.strokeStyle = ORO; ctx.lineWidth = 2.5 * (1 - x) + .6;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 40 + x * 420, 0, 7); ctx.stroke();
    ctx.restore();
  }
  /* la línea de barrido */
  const b = inv(t, .25, 1.0);
  if (b > 0 && b < 1) {
    ctx.save(); ctx.globalAlpha = Math.sin(b * Math.PI) * .5;
    const y = H * .5;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(217,174,114,0)');
    g.addColorStop(.5, 'rgba(243,217,166,.9)');
    g.addColorStop(1, 'rgba(217,174,114,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 1, W, 2);
    ctx.restore();
  }
  /* la primera foto: aparece con el obturador */
  const a = inv(t, T_FOTO1, T_FOTO1 + .45);
  if (a > 0) {
    const e = .55 + sale(a) * .45;
    tarjeta(FOTO[0], W / 2, H * .5, CW * 1.5, CH * 1.5,
      { alfa: sale(a), escala: e, brillo: 1 - a, radio: 26 });
    /* el destello del obturador */
    const d = 1 - inv(t, T_FOTO1, T_FOTO1 + .18);
    if (d > 0) { ctx.save(); ctx.globalAlpha = d * .5; ctx.fillStyle = '#FFF'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    chip('FOTO NUEVA', W / 2, H * .5 + CH * .95, { alfa: inv(t, T_FOTO1 + .25, T_FOTO1 + .6), punto: ORO });
  }
}

/* 1-2 · 2,0 – 6,0 · entran las fotos y se arma el racimo ───────── */
function escEntran(t) {
  const n = Math.min(10, Math.floor((t - 2.0) / (NEGRA / 2)) + 1);
  for (let i = 0; i < 10; i++) {
    const ti = 2.0 + i * (NEGRA / 2);
    if (i === 0) {
      /* la primera ya estaba: viaja desde el centro a su lugar */
      const x = sale(inv(t, 2.0, 3.0));
      const m = MURO[0];
      tarjeta(FOTO[0], W / 2 + (m.x - W / 2) * x, H * .5 + (m.y - H * .5) * x,
        CW * 1.5 + (m.w - CW * 1.5) * x, CH * 1.5 + (m.h - CH * 1.5) * x,
        { alfa: 1, radio: 26 - 4 * x });
      continue;
    }
    const a = inv(t, ti, ti + .55);
    if (a <= 0) continue;
    const e = sale(a), m = MURO[i], d = DESDE[i];
    tarjeta(FOTO[i], d.x + (m.x - d.x) * e, d.y + (m.y - d.y) * e,
      m.w, m.h, {
      alfa: Math.min(1, a * 2.2),
      giro: d.giro * (1 - e),
      escala: .7 + .3 * e,
      brillo: 1 - a,
      desenfoque: (1 - e) * 9,            // desenfoque de movimiento
    });
  }
  /* la interfaz que acompaña */
  chip('EN VIVO', 150, 190, { alfa: inv(t, 2.3, 2.8), punto: VIVO, fuerte: false });
  const c = inv(t, 2.6, 5.8);
  contador(2 + c * 126, W - 180, 196, { alfa: inv(t, 2.6, 3.0), rot: 'FOTOS' });
  /* los "+1" que suben */
  for (let i = 1; i < 10; i++) {
    const ti = 2.0 + i * (NEGRA / 2);
    const a = inv(t, ti, ti + .9);
    if (a <= 0 || a >= 1) continue;
    const m = MURO[i];
    texto('+1', m.x + m.w * .3, m.y - m.h * .25 - a * 70,
      { tam: 34, peso: 600, color: CHAMPAN, alfa: (1 - a) * .95 });
  }
  return n;
}

/* 3-4 · 6,0 – 10,0 · el invitado manda y entra al muro ─────────── */
function escInvitado(t) {
  /* el muro, ya armado, se corre a la izquierda y se achica */
  const x = sale(inv(t, 6.0, 7.2));
  const esc = 1 - .34 * x, dx = -W * .20 * x;
  ctx.save();
  ctx.translate(W / 2 + dx, H * .5); ctx.scale(esc, esc); ctx.translate(-W / 2, -H * .5);
  for (let i = 0; i < 10; i++) {
    const m = MURO[i];
    const lat = 1 + beat(t) * .012 * (i % 3 === 0 ? 1 : .3);
    tarjeta(FOTO[i], m.x, m.y, m.w * lat, m.h * lat, { alfa: 1 });
  }
  ctx.restore();

  /* el teléfono del invitado, captura de verdad de la app */
  const a = inv(t, 6.6, 7.6);
  if (a > 0) {
    const e = sale(a);
    telefono(W * .80 + (1 - e) * 340, H * .54, IMG.invitado,
      { escala: .50, alfa: Math.min(1, a * 1.6), giro: -.055 });
    chip('SU TELÉFONO', W * .80, H * .54 - 360, { alfa: inv(t, 7.4, 7.9), tam: 20 });
  }

  /* la foto que sale del teléfono y entra al muro, dos veces */
  for (const [t0, idx] of [[7.9, 3], [9.0, 6]]) {
    const v = inv(t, t0, t0 + .85);
    if (v <= 0 || v >= 1) continue;
    const e = sale(v), m = MURO[idx];
    const ox = W * .80, oy = H * .54;
    const tx = (W / 2 + dx) + (m.x - W / 2) * esc;
    const ty = H * .5 + (m.y - H * .5) * esc;
    /* arco: sube y baja, que una recta se ve a computadora */
    const px = ox + (tx - ox) * e;
    const py = oy + (ty - oy) * e - Math.sin(e * Math.PI) * 190;
    tarjeta(FOTO[idx], px, py, m.w * esc * (1.5 - .5 * e), m.h * esc * (1.5 - .5 * e),
      { alfa: 1, giro: (1 - e) * .5, desenfoque: Math.sin(e * Math.PI) * 7, brillo: 1 - v });
    /* la estela */
    ctx.save(); ctx.globalAlpha = (1 - e) * .35; ctx.strokeStyle = ORO; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo((ox + tx) / 2, (oy + ty) / 2 - 240, px, py); ctx.stroke();
    ctx.restore();
  }

  chip('EN VIVO', 150, 190, { alfa: 1, punto: VIVO });
  contador(128 + inv(t, 6, 10) * 61, W - 180, 196, { alfa: 1, rot: 'FOTOS' });
  chip('TIEMPO REAL', 190, H - 210, { alfa: inv(t, 8.2, 8.7), tam: 22 });

  /* reacciones que suben */
  for (let k = 0; k < 7; k++) {
    const ti = 6.8 + k * .42;
    const v = inv(t, ti, ti + 1.5);
    if (v <= 0 || v >= 1) continue;
    corazon(W * .80 + (rnd(k * 3.1) - .5) * 180, H * .80 - v * 300,
      16 + rnd(k) * 9, (1 - v) * .85);
  }
}

/* 5-6 · 10,0 – 14,0 · el teléfono se vuelve la pantalla del salón ─ */
function escSala(t) {
  const m = inv(t, T_SALA, T_SALA + 1.1);          // el morfeo
  const e = sale(m);
  /* el muro se va hacia atrás */
  const f = 1 - inv(t, T_SALA, T_SALA + .7);
  if (f > 0) {
    ctx.save(); ctx.globalAlpha = f;
    const esc = .66 * (1 + (1 - f) * .5);
    ctx.translate(W / 2 - W * .20, H * .5); ctx.scale(esc, esc); ctx.translate(-W / 2, -H * .5);
    for (let i = 0; i < 10; i++) {
      const q = MURO[i];
      tarjeta(FOTO[i], q.x, q.y, q.w, q.h, { alfa: f, desenfoque: (1 - f) * 10 });
    }
    ctx.restore();
  }
  /* el teléfono se estira hasta ser la pantalla ancha: se dibujan los
     dos y se cruzan, que es lo que lee el ojo como "se transformó" */
  if (m < 1) {
    telefono(W * .80 + (W / 2 - W * .80) * e, H * .54 + (H * .46 - H * .54) * e,
      IMG.invitado, { escala: .50 + e * .55, alfa: 1 - e, giro: -.055 * (1 - e) });
  }
  if (m > .25) {
    const a = inv(t, T_SALA + .28, T_SALA + 1.0);
    pantallaSalon(W / 2, H * .46, IMG.sala,
      { ancho: 700 + sale(a) * 300, alfa: a, escala: 1 + (1 - sale(a)) * .06 });
  }
  /* el golpe de luz del cambio */
  const d = pulso(t, T_SALA - .05, T_SALA + .35);
  if (d > .01) { ctx.save(); ctx.globalAlpha = d * .3; ctx.fillStyle = CHAMPAN; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  chip('MURO EN VIVO', W / 2, H * .46 - 320 - 40 * (1 - inv(t, T_SALA + .9, T_SALA + 1.4)),
    { alfa: inv(t, T_SALA + .9, T_SALA + 1.4), punto: VIVO, tam: 28 });
  texto('La pantalla del salón', W / 2, H * .72,
    { tam: 40, peso: 300, color: CREMA, alfa: inv(t, T_SALA + 1.3, T_SALA + 1.9) });
  texto('se actualiza sola toda la noche', W / 2, H * .72 + 52,
    { tam: 30, peso: 300, color: MUTE, alfa: inv(t, T_SALA + 1.5, T_SALA + 2.1) });

  contador(189 + inv(t, T_SALA, 14) * 74, W / 2, H * .83,
    { alfa: inv(t, T_SALA + 1.8, T_SALA + 2.3), rot: 'RECUERDOS' });

  /* avisos que entran por el costado */
  for (const [ti, txt] of [[11.6, 'FOTO NUEVA'], [12.8, 'EN LA PANTALLA']]) {
    const v = inv(t, ti, ti + 1.3);
    if (v <= 0 || v >= 1) continue;
    const s = Math.min(1, v * 5) * (1 - inv(t, ti + .95, ti + 1.3));
    chip(txt, 230, H * .25 + (ti > 12 ? 92 : 0), { alfa: s, punto: ORO, tam: 22 });
  }
  for (let k = 0; k < 9; k++) {
    const ti = 10.6 + k * .36;
    const v = inv(t, ti, ti + 1.4);
    if (v <= 0 || v >= 1) continue;
    corazon(W * .14 + rnd(k * 7.3) * W * .72, H * .66 - v * 260, 15 + rnd(k) * 10, (1 - v) * .7);
  }
}

/* 7-8 · 14,0 – 18,0 · el mosaico y los cortes rápidos ──────────── */
function escMosaico(t) {
  /* zoom adentro de una foto y corte a la siguiente, en negras */
  const paso = NEGRA * 1.5;
  const k = Math.floor((t - T_MOSAICO) / paso);
  const f = ((t - T_MOSAICO) % paso) / paso;
  const idx = [2, 5, 8, 1][k % 4];
  /* la foto grande, con un empuje de cámara */
  tarjeta(FOTO[idx], W / 2, H * .42, W * .86, W * .86 * 1.18,
    { alfa: Math.min(1, f * 7) * (1 - inv(f, .86, 1)), escala: 1.0 + f * .09, radio: 28 });
  /* las que vienen, abajo, deslizándose */
  const corr = ((t - T_MOSAICO) * 180) % (CW + HUECO);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, H * .70, W, CH * .8); ctx.clip();
  for (let i = -1; i < 5; i++) {
    const j = (k + i + 10) % 10;
    tarjeta(FOTO[j], 120 + i * (CW + HUECO) - corr, H * .70 + CH * .4,
      CW * .9, CH * .62, { alfa: .9, radio: 14 });
  }
  ctx.restore();
  chip('RECUERDOS', W / 2, H * .70 - 54, { alfa: inv(t, T_MOSAICO + .3, T_MOSAICO + .8), tam: 22 });
  chip('EN VIVO', 150, 190, { alfa: 1, punto: VIVO });
  contador(263 + inv(t, T_MOSAICO, T_RISER) * 97, W - 180, 196, { alfa: 1, rot: 'FOTOS' });
  /* destellos en cada corte */
  const d = 1 - clamp(f * 9, 0, 1);
  if (d > .01) { ctx.save(); ctx.globalAlpha = d * .22; ctx.fillStyle = CHAMPAN; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  estelas(t, .7);
}

/* 9 · 18,0 – 20,0 · el riser: todo se junta ────────────────────── */
function escRiser(t) {
  const x = inv(t, T_RISER, T_GOLPE);
  const e = entra(x);
  /* las fotos convergen al centro, girando y acelerando */
  for (let i = 0; i < 10; i++) {
    const m = MURO[i];
    const a = rnd(i * 13.7) * Math.PI * 2;
    const r = (1 - e) * 560;
    tarjeta(FOTO[i], W / 2 + Math.cos(a) * r, H * .46 + Math.sin(a) * r * 1.3,
      m.w * (1 - e * .55), m.h * (1 - e * .55),
      { alfa: 1 - e * .25, giro: (1 - e) * (rnd(i) - .5) * .8 + e * .4,
        desenfoque: e * 14, radio: 16 });
  }
  /* las líneas que convergen */
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + x * .7;
    const r0 = 300 + (1 - e) * 500, r1 = r0 + 180 + e * 420;
    ctx.globalAlpha = e * .35;
    const g = ctx.createLinearGradient(
      W / 2 + Math.cos(a) * r0, H * .46 + Math.sin(a) * r0,
      W / 2 + Math.cos(a) * r1, H * .46 + Math.sin(a) * r1);
    g.addColorStop(0, 'rgba(243,217,166,0)');
    g.addColorStop(1, `rgba(243,217,166,${e})`);
    ctx.strokeStyle = g; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 + Math.cos(a) * r0, H * .46 + Math.sin(a) * r0);
    ctx.lineTo(W / 2 + Math.cos(a) * r1, H * .46 + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();
  /* el blanco que crece hasta tapar todo justo en el golpe */
  if (x > .72) {
    ctx.save(); ctx.globalAlpha = Math.pow(inv(x, .72, 1), 2.2) * .92;
    ctx.fillStyle = CHAMPAN; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  estelas(t, 1);
}

/* 10-11 · 20,0 – 24,5 · EL GOLPE: el muro entero ───────────────── */
function escGolpe(t) {
  const x = inv(t, T_GOLPE, T_GOLPE + .55);
  /* el muro cae en su sitio, cada foto con su retardo */
  for (let i = 0; i < 10; i++) {
    const m = MURO[i];
    const d = i * .028;
    const a = inv(t, T_GOLPE + d, T_GOLPE + d + .45);
    const e = rebote(a);
    const lat = 1 + beat(t, T_GOLPE) * .016;
    tarjeta(FOTO[i], m.x, m.y, m.w * e * lat, m.h * e * lat,
      { alfa: Math.min(1, a * 3), brillo: 1 - a, radio: 20 });
  }
  /* el destello del golpe */
  const d = 1 - inv(t, T_GOLPE, T_GOLPE + .3);
  if (d > .01) { ctx.save(); ctx.globalAlpha = d * .85; ctx.fillStyle = CHAMPAN; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  /* la interfaz viva alrededor */
  chip('EN VIVO', 150, 190, { alfa: inv(t, T_GOLPE + .3, T_GOLPE + .6), punto: VIVO });
  chip('TU FIESTA', W - 170, 190, { alfa: inv(t, T_GOLPE + .4, T_GOLPE + .7), tam: 22 });
  for (let k = 0; k < 14; k++) {
    const ti = T_GOLPE + .4 + k * .22;
    const v = inv(t, ti, ti + 1.6);
    if (v <= 0 || v >= 1) continue;
    corazon(W * .1 + rnd(k * 5.7) * W * .8, H * .92 - v * 420, 14 + rnd(k) * 12, (1 - v) * .8);
  }

  /* la frase, sobre una banda que la despega del muro */
  const f1 = inv(t, T_GOLPE + .7, T_GOLPE + 1.25);
  if (f1 > 0 && t < T_FRASE2 + .25) {
    const s = f1 * (1 - inv(t, T_FRASE2, T_FRASE2 + .25));
    banda(H * .50, 230, s * .9);
    texto('Tus momentos.', W / 2, H * .50 - 6,
      { tam: 86, peso: 600, color: CREMA, alfa: s });
    texto('En vivo.', W / 2, H * .50 + 86,
      { tam: 86, peso: 600, color: ORO, alfa: s });
  }
  /* la segunda */
  const f2 = inv(t, T_FRASE2, T_FRASE2 + .45);
  if (f2 > 0 && t < T_MARCA + .2) {
    const s = f2 * (1 - inv(t, T_MARCA - .15, T_MARCA + .2));
    banda(H * .50, 190, s * .9);
    texto('Todos comparten.', W / 2, H * .50 - 2,
      { tam: 60, peso: 600, color: CREMA, alfa: s });
    texto('Todos lo viven.', W / 2, H * .50 + 66,
      { tam: 60, peso: 600, color: ORO, alfa: s });
  }
  contador(360 + inv(t, T_GOLPE, T_MARCA) * 84, W / 2, 1830,
    { alfa: inv(t, T_GOLPE + .5, T_GOLPE + .9), rot: 'RECUERDOS EN VIVO' });
}

/* Banda oscura detrás de una frase: sin esto el texto cae sobre las
   fotos y no se lee. Sobre una foto el contraste no se calcula, así
   que se tapa y listo. */
function banda(cy, alto, alfa) {
  if (alfa <= .004) return;
  ctx.save(); ctx.globalAlpha = clamp(alfa, 0, 1);
  const g = ctx.createLinearGradient(0, cy - alto, 0, cy + alto);
  g.addColorStop(0, 'rgba(10,8,6,0)');
  g.addColorStop(.28, 'rgba(10,8,6,.93)');
  g.addColorStop(.72, 'rgba(10,8,6,.93)');
  g.addColorStop(1, 'rgba(10,8,6,0)');
  ctx.fillStyle = g; ctx.fillRect(0, cy - alto, W, alto * 2);
  ctx.restore();
}

/* 12 · 24,5 – 26,0 · la marca ──────────────────────────────────── */
function escMarca(t) {
  /* el muro se va al fondo, desenfocado */
  const v = inv(t, T_MARCA, T_MARCA + .5);
  ctx.save(); ctx.globalAlpha = (1 - v) * .5 + .11;
  for (let i = 0; i < 10; i++) {
    const m = MURO[i];
    tarjeta(FOTO[i], m.x, m.y, m.w * (1 + v * .1), m.h * (1 + v * .1),
      { alfa: 1, desenfoque: v * 16, borde: false });
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = v * .88; ctx.fillStyle = NEGRO; ctx.fillRect(0, 0, W, H); ctx.restore();

  /* La cascada del cierre entra ANTES de que empiece el fundido de
     salida (DUR - .45 = 25,55). Con las esperas largas de la primera
     version, la bajada llegaba a opacidad plena a los 25,75 y la
     direccion a los 25,85: o sea que las dos crecian mientras el cuadro
     se iba a negro y nunca se veian enteras. Un cierre que se lee a
     medias es un cierre que no se lee. */
  const a = inv(t, T_MARCA + .10, T_MARCA + .55);
  const e = sale(a);
  if (MARCA && a > 0) {
    const an = 560 * (.94 + e * .06), al = an * MARCA.height / MARCA.width;
    ctx.save(); ctx.globalAlpha = a;
    ctx.drawImage(MARCA, W / 2 - an / 2, H * .44 - al / 2, an, al);
    ctx.restore();
  }
  const l = inv(t, T_MARCA + .45, T_MARCA + .75);
  if (l > 0) {
    ctx.save(); ctx.globalAlpha = l * .7;
    ctx.strokeStyle = ORO; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(W / 2 - 150 * l, H * .55); ctx.lineTo(W / 2 + 150 * l, H * .55); ctx.stroke();
    ctx.restore();
  }
  texto('El muro en vivo de tu evento.', W / 2, H * .615,
    { tam: 42, peso: 300, color: CREMA, alfa: inv(t, T_MARCA + .45, T_MARCA + .80) });
  const c = inv(t, T_MARCA + .65, T_MARCA + .95);
  if (c > 0) {
    chip('VIVILO EN TIEMPO REAL', W / 2, H * .70, { alfa: c, tam: 24, fuerte: true });
  }
  texto('clicketerno.com.ar', W / 2, H * .775,
    { tam: 26, peso: 400, color: MUTE, alfa: inv(t, T_MARCA + .75, T_MARCA + 1.05), esp: 4 });
}

/* ═══════════════════════════════════════════════════════════════
   EL CUADRO
   ═══════════════════════════════════════════════════════════════ */
function dibujar(t) {
  /* El lienzo se limpia y el contexto se devuelve a cero ANTES de
     cualquier cosa. Es barato y es la red: en una escena de cuatrocientas
     líneas alcanza con un `return` adentro de un save() sin su restore()
     para que el alfa o un recorte se arrastren al cuadro siguiente, y eso
     se ve como un fantasma que nadie sabe de dónde sale. */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.clearRect(0, 0, W, H);
  fondo(t);
  grilla(t, inv(t, .8, 2.4) * .22 * (1 - inv(t, T_RISER, T_GOLPE)));
  particulas(t, clamp(inv(t, 1.2, 3) - inv(t, T_MARCA, DUR) * .6, 0, 1));

  if (t < 2.0) escPulso(t);
  else if (t < 6.0) escEntran(t);
  else if (t < T_SALA) escInvitado(t);
  else if (t < T_MOSAICO) escSala(t);
  else if (t < T_RISER) escMosaico(t);
  else if (t < T_GOLPE) escRiser(t);
  else if (t < T_MARCA) escGolpe(t);
  else escMarca(t);

  vineta(t < T_MARCA ? .5 : .62);
  grano(t);
  /* fundido de entrada y de salida */
  const n = Math.min(inv(t, 0, .35), 1 - inv(t, DUR - .32, DUR));
  if (n < 1) { ctx.fillStyle = `rgba(10,8,6,${1 - n})`; ctx.fillRect(0, 0, W, H); }
}

window.__listo = false; window.__dur = DUR; window.__fps = FPS;
window.pintar = t => dibujar(t);

(async () => {
  const c = document.getElementById('lienzo');
  c.width = W; c.height = H; ctx = c.getContext('2d');

  const cargar = src => new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => no(new Error('no cargó ' + String(src).slice(0, 60)));
    i.src = src;
  });

  /* Las fotos de demo/, incrustadas por montar.py. Si faltaran, la
     pieza no tiene contenido: mejor reventar acá y que se vea, antes
     que renderizar 780 cuadros de rectángulos vacíos. */
  const demo = window.__DEMO || [];
  if (demo.length < 10) throw new Error('faltan fotos de demo/: ' + demo.length + ' de 10');
  for (const d of demo) FOTO.push(await cargar(d));

  /* Las capturas de la app de verdad. */
  const archivos = { invitado: 'invitado.full.jpg', sala: 'sala.ancha.full.jpg' };
  await Promise.all(Object.entries(archivos).map(async ([n, f]) => {
    IMG[n] = await cargar('img-muro/' + f);
  }));

  if (window.__MARCA) MARCA = await cargar(window.__MARCA);

  await document.fonts.load('300 48px "Jost"');
  await document.fonts.load('600 86px "Jost"');
  await document.fonts.ready;
  dibujar(0);
  window.__listo = true;
})();
