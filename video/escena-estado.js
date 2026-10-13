/* ═══════════════════════════════════════════════════════════════
   ESTADO DE WHATSAPP · la invitación digital · 1080x1920, 30 fps, 30 s

   Un aviso, no un catálogo: arranca con una pregunta que incomoda
   ("¿todavía mandás la invitación en PDF?"), muestra lo que vive el
   invitado al abrirla, y cierra con un solo pedido: escribinos.

   LO QUE SE VE ADENTRO DEL CELULAR ES LA INVITACIÓN DE VERDAD: las dos
   muestras del repo (claraybruno y juliayfranco) grabadas cuadro a
   cuadro por capturar-estado.js. Mostrar una pantalla que no existe
   como si existiera es mentirle al cliente.

   La grabación no tiene dedo: los toques quedaron anotados (dónde y
   cuándo) y acá se dibuja un círculo en ese lugar, para que se entienda
   qué hizo la persona.

   La rejilla es la música: 96 BPM, compás 2,5 s, doce compases = 30 s.
   Cada cambio de tramo cae en un compás.
   ═══════════════════════════════════════════════════════════════ */
const W = 1080, H = 1920, DUR = 30, FPS = 30;
const NEGRA = 60 / 96, COMPAS = NEGRA * 4;          // 0,625 · 2,5

const ORO = '#D9AE72', CHAMPAN = '#F3D9A6', CREMA = '#F1EADC', MUTE = '#B9AE9B';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const sale = x => 1 - Math.pow(1 - x, 3);
const sale5 = x => 1 - Math.pow(1 - x, 5);
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let ctx, grano, marca;
const TOQUES = () => window.__TOQUES || {a:{toques:[],cuadros:1}, b:{toques:[],cuadros:1}};

/* ── qué pedazo de cada grabación se ve en cada momento ──
   [desde, hasta] del aviso ↔ [desde, hasta] de la grabación. Si los dos
   largos no coinciden, ese tramo va más rápido o más lento. */
const TRAMOS = [
  {a0: 2.5,  a1: 4.0,  clip:'a', c0: 0.2,  c1: 1.0},    // el sobre, quieto
  {a0: 4.0,  a1: 10.0, clip:'a', c0: 1.0,  c1: 7.0},    // el lacre y los nombres en oro
  {a0: 10.0, a1: 11.25,clip:'a', c0: 7.6,  c1: 9.6,  chip:'Cuenta regresiva'},
  {a0: 11.25,a1: 12.95,clip:'a', c0: 10.7, c1: 13.4, chip:'Su historia en fotos'},
  {a0: 12.95,a1: 14.4, clip:'a', c0: 14.2, c1: 17.8, chip:'Del atardecer a la noche'},
  {a0: 14.4, a1: 15.0, clip:'a', c0: 20.6, c1: 21.6, chip:'Mapa y cómo llegar'},
  {a0: 15.0, a1: 20.0, clip:'b', c0: 0.4,  c1: 5.4},    // el telón J&F y la portada
  {a0: 20.0, a1: 22.5, clip:'b', c0: 7.4,  c1: 10.4},   // el calendario y el corazón
  {a0: 22.5, a1: 25.0, clip:'b', c0: 12.3, c1: 14.8},   // "Sí, voy" y el nombre
  {a0: 25.0, a1: 30.0, clip:'a', c0: 6.6,  c1: 7.4},    // el cierre: los nombres en oro
];
const tramoDe = t => TRAMOS.find(s => t >= s.a0 && t < s.a1) || (t >= 30 ? TRAMOS[TRAMOS.length-1] : null);
const tiempoClip = (s, t) => s.c0 + (s.c1 - s.c0) * inv(t, s.a0, s.a1);

/* ── los cuadros de la grabación, cargados a demanda ── */
const cache = new Map();
function cuadro(clip, ct){
  const n = TOQUES()[clip].cuadros;
  const i = clamp(Math.round(ct * FPS), 0, n - 1);
  const k = clip + i;
  if (!cache.has(k)){
    cache.set(k, new Promise((ok, no) => {
      const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('no cargó ' + k));
      im.src = `img-estado/${clip}/${String(i).padStart(4,'0')}.jpg`;
    }));
    if (cache.size > 40) cache.delete(cache.keys().next().value);
  }
  return cache.get(k);
}

/* ── el celular: dónde está y cómo se mueve ── */
const PW = 620, PH = 1071, SW = 580, SH = 1031;      // la pantalla es 780x1386 escalada
function celular(t){
  let cy = 1100, s = 1, rot = 0, sx = 1;
  // entra desde abajo en el compás 1
  const ent = sale5(inv(t, 2.45, 3.7));
  cy = 2700 - (2700 - 1100) * ent; rot += (1 - ent) * 7;
  // flota siempre: dos senos con periodos que no coinciden nunca
  cy += Math.sin(t * 2 * Math.PI / 4.3) * 9; rot += Math.sin(t * 2 * Math.PI / 5.7) * .55;
  // se acerca mientras se escriben los nombres
  s *= 1 + .09 * suave(inv(t, 6.6, 8.6)) - .09 * suave(inv(t, 9.4, 10.2));
  // el giro: de una invitación a la otra (y en el cierre, de vuelta)
  for (const c of [15.0, 25.0]){
    const k = inv(t, c - .28, c + .28);
    if (k > 0 && k < 1) sx = Math.max(.02, Math.abs(Math.cos(k * Math.PI)));
  }
  // el cierre: se achica y deja lugar al logo y al teléfono
  const cie = suave(inv(t, 25.0, 26.1));
  s *= 1 - .44 * cie; cy += (1010 - cy) * cie;
  return {cx: 540, cy, s, rot: rot * Math.PI / 180, sx};
}

function rr(x, y, w, h, r){ ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

async function dibujarCelular(t){
  const s = tramoDe(t); if (!s) return;
  const g = celular(t);
  if (g.cy - PH/2 * g.s > H) return;
  // lo que se ve en la pantalla (con un fundido corto entre tramos)
  const ct = tiempoClip(s, t);
  const img = await cuadro(s.clip, ct);
  const idx = TRAMOS.indexOf(s), ant = TRAMOS[idx - 1];
  let imgAnt = null, kf = 1;
  if (ant && ant.a1 === s.a0 && ant.clip === s.clip && t - s.a0 < .16){
    kf = (t - s.a0) / .16; imgAnt = await cuadro(ant.clip, ant.c1);
  }
  ctx.save();
  ctx.translate(g.cx, g.cy); ctx.rotate(g.rot); ctx.scale(g.s * g.sx, g.s);
  // sombra y cuerpo
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 46;
  rr(-PW/2, -PH/2, PW, PH, 88); ctx.fillStyle = '#121010'; ctx.fill(); ctx.restore();
  const borde = ctx.createLinearGradient(-PW/2, -PH/2, PW/2, PH/2);
  borde.addColorStop(0, '#6d6253'); borde.addColorStop(.3, '#2a2622'); borde.addColorStop(.7, '#3a332b'); borde.addColorStop(1, '#8a7a62');
  rr(-PW/2, -PH/2, PW, PH, 88); ctx.lineWidth = 5; ctx.strokeStyle = borde; ctx.stroke();
  // botones de costado
  ctx.fillStyle = '#2b2622'; rr(PW/2 - 1, -260, 7, 120, 3); ctx.fill(); rr(-PW/2 - 6, -300, 7, 70, 3); ctx.fill(); rr(-PW/2 - 6, -200, 7, 70, 3); ctx.fill();
  // pantalla
  ctx.save(); rr(-SW/2, -SH/2, SW, SH, 66); ctx.clip();
  if (imgAnt) ctx.drawImage(imgAnt, -SW/2, -SH/2, SW, SH);
  ctx.globalAlpha = kf; ctx.drawImage(img, -SW/2, -SH/2, SW, SH); ctx.globalAlpha = 1;
  dibujarToques(s, ct, t);
  // reflejo del vidrio
  const vid = ctx.createLinearGradient(-SW/2, -SH/2, SW/2, SH/2);
  vid.addColorStop(0, 'rgba(255,255,255,.07)'); vid.addColorStop(.42, 'rgba(255,255,255,0)'); vid.addColorStop(1, 'rgba(255,255,255,.03)');
  ctx.fillStyle = vid; ctx.fillRect(-SW/2, -SH/2, SW, SH);
  ctx.restore();
  // la isla de arriba
  rr(-72, -SH/2 + 16, 144, 40, 20); ctx.fillStyle = '#050505'; ctx.fill();
  ctx.restore();
}

/* el dedo: un círculo donde se tocó, que se hunde y deja una onda */
function dibujarToques(s, ct, t){
  for (const q of TOQUES()[s.clip].toques){
    const a = ct - q.ini, d = ct - q.fin;
    if (a < -.22 || d > .55) continue;
    const x = -SW/2 + q.x * SW, y = -SH/2 + q.y * SH;
    const llega = sale(clamp((a + .22) / .22, 0, 1));
    const apretado = a >= 0 && d < 0;
    const se = d > 0 ? clamp(d / .55, 0, 1) : 0;
    const r = 46 * (apretado ? .86 : 1) * (.7 + .3 * llega);
    ctx.save();
    ctx.globalAlpha = llega * (1 - se);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
    if (d > 0){ ctx.globalAlpha = 1 - se; ctx.beginPath(); ctx.arc(x, y, r + 70 * sale(se), 0, 7);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.stroke(); }
    ctx.restore();
  }
}

/* ── el fondo: oscuro, cálido, con luces que van a la deriva ── */
function fondo(t){
  const g = ctx.createRadialGradient(540, 820, 80, 540, 900, 1250);
  g.addColorStop(0, '#2a2017'); g.addColorStop(.55, '#120d09'); g.addColorStop(1, '#060504');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++){
    const x = (rnd(i) * 1.3 - .15) * W + Math.sin(t * .23 + i) * 60;
    const y = (rnd(i + 40) * 1.1 - .05) * H - t * (8 + rnd(i + 9) * 16);
    const r = 120 + rnd(i + 3) * 220;
    const b = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = .05 + rnd(i + 7) * .07;
    b.addColorStop(0, `rgba(217,174,114,${a})`); b.addColorStop(1, 'rgba(217,174,114,0)');
    ctx.fillStyle = b; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // polvo dorado que sube (más rápido que las luces: paralaje)
  for (let i = 0; i < 70; i++){
    const vel = 30 + rnd(i + 100) * 70;
    const y = ((rnd(i + 200) * H - t * vel) % H + H) % H;
    const x = rnd(i + 300) * W + Math.sin(t * .8 + i) * 14;
    const a = (.25 + .5 * rnd(i + 400)) * (.6 + .4 * Math.sin(t * 2 + i));
    ctx.fillStyle = `rgba(243,217,166,${a * .55})`;
    ctx.beginPath(); ctx.arc(x, y, .8 + rnd(i + 500) * 2.2, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* ── el texto ── */
const F = {
  titulo: (px, it) => `${it ? 'italic ' : ''}400 ${px}px "Bodoni Moda"`,
  jost: (px, w = 400) => `${w} ${px}px "Jost"`,
};
/* una línea hecha de pedazos con estilos distintos: [texto, {it, oro}] */
function anchoLinea(partes, px){
  return partes.reduce((w, [tx, o = {}]) => { ctx.font = F.titulo(px, o.it); return w + ctx.measureText(tx).width; }, 0);
}
function linea(partes, px, y, alfa = 1, color = CREMA){
  let x = 540 - anchoLinea(partes, px) / 2;
  for (const [tx, o = {}] of partes){
    ctx.font = F.titulo(px, o.it); ctx.fillStyle = o.oro ? ORO : color; ctx.globalAlpha = alfa;
    ctx.fillText(tx, x, y); x += ctx.measureText(tx).width;
  }
  ctx.globalAlpha = 1;
}
/* un bloque de líneas que suben desde una ranura y se van hacia arriba */
function bloque(lineas, px, y0, paso, t, t0, t1){
  if (t < t0 - .01 || t > t1 + .01) return;
  lineas.forEach((ln, i) => {
    const e = sale5(inv(t, t0 + i * .09, t0 + i * .09 + .7));
    const s = suave(inv(t, t1 - .4 + i * .05, t1));
    const y = y0 + i * paso;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y - px * 1.05, W, px * 1.42); ctx.clip();
    linea(ln, px, y + (1 - e) * px * 1.1 - s * px * .9, 1 - s);
    ctx.restore();
  });
}
/* la ficha de abajo: una pastilla con borde dorado */
function ficha(texto, t, t0, t1, y = 1745){
  if (t < t0 || t > t1) return;
  const e = rebote(inv(t, t0, t0 + .45)), s = inv(t, t1 - .25, t1);
  ctx.save();
  ctx.font = F.jost(36, 400);
  const w = ctx.measureText(texto).width + 76, h = 82;
  ctx.globalAlpha = (1 - s) * clamp(e * 1.4, 0, 1);
  ctx.translate(540, y); ctx.scale(.85 + .15 * e, .85 + .15 * e);
  rr(-w/2, -h/2, w, h, h/2); ctx.fillStyle = 'rgba(20,15,10,.72)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(217,174,114,.7)'; ctx.stroke();
  ctx.fillStyle = CREMA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texto, 0, 2);
  ctx.restore();
}
function rebote(x){ return x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); }

function encabezado(t){
  // la marca chiquita arriba, presente desde que entra el celular hasta el cierre
  const a = inv(t, 2.6, 3.4) * (1 - inv(t, 24.6, 25.1));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a * .9;
  ctx.font = F.jost(26, 600); ctx.fillStyle = ORO; ctx.textAlign = 'center';
  ctx.letterSpacing = '9px';
  ctx.fillText('CLICK ETERNO · INVITACIONES DIGITALES', 540, 128);
  ctx.restore();
}

/* ── 0 · el gancho: una pregunta que incomoda ── */
function gancho(t){
  if (t > 2.65) return;
  const lineas = [[['¿Todavía mandás']], [['la invitación']], [['en ', {}], ['PDF', {it: true, oro: true}], ['?']]];
  const px = 112;
  // un acercamiento lento: el gancho armado no se queda quieto ni un cuadro
  const z = 1 + .05 * suave(inv(t, 0, 2.6));
  ctx.save(); ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
  lineas.forEach((ln, i) => {
    const t0 = .08 + i * NEGRA;
    const e = sale5(inv(t, t0, t0 + .55)), s = suave(inv(t, 2.2 + i * .06, 2.6));
    const y = 830 + i * 132;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 120, W, 160); ctx.clip();
    linea(ln, px, y + (1 - e) * 130 - s * 120, 1 - s);
    ctx.restore();
  });
  // y el PDF se tacha
  const k = sale(inv(t, 1.55, 1.95)) * (1 - inv(t, 2.2, 2.5));
  if (k > 0){
    ctx.font = F.titulo(px, false); const wEn = ctx.measureText('en ').width;
    ctx.font = F.titulo(px, true); const wPdf = ctx.measureText('PDF').width;
    const total = anchoLinea(lineas[2], px), x0 = 540 - total / 2 + wEn - 8;
    ctx.save(); ctx.strokeStyle = CHAMPAN; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, 1094 - 36); ctx.lineTo(x0 + (wPdf + 16) * k, 1094 - 36 - 10 * k); ctx.stroke(); ctx.restore();
  }
  // una línea fina que respira debajo
  const l = sale(inv(t, .9, 1.6)) * (1 - inv(t, 2.2, 2.6));
  ctx.fillStyle = `rgba(217,174,114,${.7 * l})`; ctx.fillRect(540 - 90 * l, 1190, 180 * l, 2);
  ctx.restore();
}

/* ── los títulos de cada tramo ── */
const TITULOS = [
  {t0: 2.6,  t1: 6.75, l: [[['Mirá cómo la abren']], [['tus ', {}], ['invitados', {it: true, oro: true}]]]},
  {t0: 6.75, t1: 10.0, l: [[['Sus nombres,']], [['escritos en ', {}], ['oro', {it: true, oro: true}]]]},
  {t0: 10.0, t1: 15.0, l: [[['Toda la fiesta']], [['en un solo ', {}], ['link', {it: true, oro: true}]]]},
  {t0: 15.0, t1: 20.0, l: [[['Cada diseño']], [['es ', {}], ['único', {it: true, oro: true}]]]},
  {t0: 20.0, t1: 22.5, l: [[['Agendan la fecha']], [['con un ', {}], ['toque', {it: true, oro: true}]]]},
  {t0: 22.5, t1: 25.0, l: [[['Y te confirman']], [['ahí ', {}], ['mismo', {it: true, oro: true}]]]},
];
const FICHAS = [
  {t0: 4.15, t1: 6.7,  x: 'Mantienen apretado el lacre…'},
  {t0: 6.9,  t1: 9.95, x: 'Con música y animaciones'},
  {t0: 15.6, t1: 19.95,x: 'Estilo editorial, en blanco y negro'},
  {t0: 20.1, t1: 22.45,x: 'Google, iPhone y Outlook'},
  {t0: 22.6, t1: 24.95,x: 'Nombre, menú y su canción'},
];

/* ── el cierre: la marca, el pedido y el WhatsApp ── */
function cierre(t){
  if (t < 25.0) return;
  const a = sale5(inv(t, 25.2, 26.0));
  if (marca){
    const w = 520, h = w * marca.height / marca.width;
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(marca, 540 - w/2, 150 + (1 - a) * 40, w, h); ctx.restore();
  }
  const b = sale5(inv(t, 25.5, 26.2));
  ctx.save(); ctx.globalAlpha = b; ctx.font = F.jost(30, 400); ctx.fillStyle = CREMA; ctx.textAlign = 'center';
  ctx.letterSpacing = '6px'; ctx.fillText('UN CLICK, PARA TODA LA VIDA.', 540, 440 + (1 - b) * 20); ctx.restore();
  // "Pedí la tuya"
  ctx.save(); ctx.beginPath(); ctx.rect(0, 1380, W, 170); ctx.clip();
  const c = sale5(inv(t, 26.0, 26.8));
  linea([['Pedí ', {}], ['la tuya', {it: true, oro: true}]], 118, 1500 + (1 - c) * 150, c);
  ctx.restore();
  // el botón de WhatsApp: dorado, con su latido
  const d = rebote(inv(t, 26.6, 27.2));
  if (d > 0){
    const pul = 1 + .025 * Math.sin((t - 27.2) * 2 * Math.PI / NEGRA) * inv(t, 27.2, 27.6);
    ctx.save(); ctx.translate(540, 1640); ctx.scale(d * pul, d * pul);
    const w = 720, h = 120;
    const gr = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
    gr.addColorStop(0, '#F3D9A6'); gr.addColorStop(.55, '#D9AE72'); gr.addColorStop(1, '#A9814A');
    ctx.shadowColor = 'rgba(217,174,114,.45)'; ctx.shadowBlur = 50;
    rr(-w/2, -h/2, w, h, h/2); ctx.fillStyle = gr; ctx.fill(); ctx.shadowBlur = 0;
    // el ícono de WhatsApp, dibujado
    ctx.save(); ctx.translate(-w/2 + 92, 0);
    ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 30, .75 * Math.PI, .58 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-21, 21); ctx.lineTo(-33, 33); ctx.lineTo(-16, 28); ctx.closePath(); ctx.fillStyle = '#1a140c'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -9); ctx.quadraticCurveTo(-8, 10, 11, 12); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#1a140c'; ctx.font = F.jost(54, 600); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText('341 250-6451', 46, 3);          // centrado en lo que queda a la derecha del ícono
    ctx.restore();
  }
  const e = sale5(inv(t, 27.1, 27.8));
  ctx.save(); ctx.globalAlpha = e; ctx.font = F.jost(34, 400); ctx.fillStyle = MUTE; ctx.textAlign = 'center';
  ctx.letterSpacing = '4px'; ctx.fillText('clicketerno.com.ar', 540, 1790); ctx.restore();
  const f = sale5(inv(t, 27.5, 28.2));
  ctx.save(); ctx.globalAlpha = f * .85; ctx.font = F.jost(27, 400); ctx.fillStyle = ORO; ctx.textAlign = 'center';
  ctx.letterSpacing = '7px'; ctx.fillText('CASAMIENTOS · 15 AÑOS · CUMPLEAÑOS', 540, 1850); ctx.restore();
}

/* destello corto en los dos cortes buscados (el giro del celular) */
function destello(t){
  for (const c of [2.5, 15.0, 25.0]){
    const k = 1 - Math.abs(t - c) / .14;
    if (k > 0){ ctx.fillStyle = `rgba(243,217,166,${.12 * k})`; ctx.fillRect(0, 0, W, H); }
  }
}

function velo(){
  const v = ctx.createRadialGradient(540, 960, 600, 540, 960, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

async function dibujar(t){
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = '0px';
  fondo(t);
  velo();
  gancho(t);
  await dibujarCelular(t);
  encabezado(t);
  for (const b of TITULOS) bloque(b.l, 84, 282, 100, t, b.t0, b.t1);
  for (const f of FICHAS) ficha(f.x, t, f.t0, f.t1);
  const s = tramoDe(t);
  if (s && s.chip) ficha(s.chip, t, s.a0 + .02, s.a1 - .02);
  cierre(t);
  destello(t);
  // el grano: una sola textura, corrida al azar en cada cuadro
  ctx.save(); ctx.globalAlpha = .06; ctx.globalCompositeOperation = 'overlay';
  const ox = -Math.floor(rnd(t * 30) * 256), oy = -Math.floor(rnd(t * 30 + 9) * 256);
  for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) ctx.drawImage(grano, x, y);
  ctx.restore();
  // fundido de entrada y de salida
  const n = 1 - inv(t, 0, .25) + inv(t, 29.55, 30);
  if (n > 0){ ctx.fillStyle = `rgba(0,0,0,${clamp(n, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
}

window.__listo = false; window.__dur = DUR; window.__fps = FPS;
window.pintar = t => dibujar(t);
(async () => {
  const c = document.getElementById('lienzo');
  c.width = W; c.height = H; ctx = c.getContext('2d');
  await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'img-estado/toques.js';
    s.onload = ok; s.onerror = () => no(new Error('falta img-estado/toques.js: corré capturar-estado.js')); document.head.appendChild(s); });
  marca = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = '../marca.webp'; });
  grano = document.createElement('canvas'); grano.width = grano.height = 256;
  const gx = grano.getContext('2d'), d = gx.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255; }
  gx.putImageData(d, 0, 0);
  await document.fonts.load('400 112px "Bodoni Moda"');
  await document.fonts.load('italic 400 112px "Bodoni Moda"');
  await document.fonts.load('400 36px "Jost"');
  await document.fonts.load('600 36px "Jost"');
  await document.fonts.ready;
  await dibujar(0);
  window.__listo = true;
})();
