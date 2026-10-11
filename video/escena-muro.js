/* ═══════════════════════════════════════════════════════════════
   MURO EN VIVO · pieza vertical para redes

   El centro es EL SEGUNDO QUE PASA entre que el invitado manda la
   foto y que la foto está en la pantalla del salón. Eso es lo que
   no tiene una carpeta compartida ni un hashtag: la fiesta se ve a
   sí misma mientras pasa.

   TODAS las pantallas son CAPTURAS DE VERDAD, sacadas por
   capturar-muro.js recorriendo la app contra el Supabase falso de
   las pruebas. No hay una sola pantalla dibujada: mostrar una que
   no existe como si existiera es mentirle al cliente.

   Las fotos que se ven adentro son las de video/fotos/, una fiesta
   de verdad. Si esa carpeta estuviera vacía, capturar-muro.js
   dibuja manchas de luz y la pieza se arma igual (más fea).

   dibujar(t) es pura: el mismo t da siempre el mismo cuadro.
   ═══════════════════════════════════════════════════════════════ */
const W = 1080, H = 1920, DUR = 28;

const ORO = '#D9AE72', CHAMPAN = '#F3D9A6';
const NEGRO = '#0A0806', CREMA = '#EDE6D8', MUTE = '#B3A896';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const sale = x => 1 - Math.pow(1 - x, 3);
const pulso = (t, a, b) => { const x = inv(t, a, b); return Math.sin(x * Math.PI); };
function rnd(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

let ctx; const IMG = {};
const fondo = () => { ctx.fillStyle = NEGRO; ctx.fillRect(0, 0, W, H); };

function texto(s, x, y, { tam = 48, fam = 'Jost', peso = 300, color = CREMA,
  alfa = 1, esp = 0, cursiva = false } = {}) {
  if (alfa <= .002) return;
  ctx.save(); ctx.globalAlpha = clamp(alfa, 0, 1); ctx.fillStyle = color;
  ctx.font = `${cursiva ? 'italic ' : ''}${peso} ${tam}px "${fam}"`;
  ctx.textBaseline = 'alphabetic';
  if (esp) {
    const l = [...s]; ctx.textAlign = 'left';
    const an = l.reduce((a, c) => a + ctx.measureText(c).width + esp, -esp);
    let px = x - an / 2;
    for (const c of l) { ctx.fillText(c, px, y); px += ctx.measureText(c).width + esp; }
  } else { ctx.textAlign = 'center'; ctx.fillText(s, x, y); }
  ctx.restore();
}

function grano(t, f = .05) {
  const s = Math.floor(t * 30);
  ctx.save(); ctx.globalAlpha = f;
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = rnd(i * 7 + s) > .5 ? '#FFF' : '#000';
    ctx.fillRect(rnd(i + s * 7919) * W, rnd(i * 3.3 + s * 104729) * H, 2, 2);
  }
  ctx.restore();
}

function vineta(f = .6) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .30, W / 2, H / 2, H * .85);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* ── el teléfono, con una captura adentro ──
   Las capturas son 1170x2532 (390x844 por 3). 660x1428 tiene la misma
   proporción, así que la pantalla no se deforma. */
const TW = 660, TH = 1428, BORDE = 16, R = 56;
function telefono(cx, cy, img, { escala = 1, alfa = 1, desliz = 0, giro = 0 } = {}) {
  if (alfa <= .002 || !img) return;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(escala, escala);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#17130F';
  ctx.beginPath();
  ctx.roundRect(-TW / 2 - BORDE, -TH / 2 - BORDE, TW + BORDE * 2, TH + BORDE * 2, R + 8);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-TW / 2, -TH / 2, TW, TH, R); ctx.clip();
  ctx.drawImage(img, -TW / 2, -TH / 2 - desliz, TW, TH);
  ctx.restore();
  ctx.strokeStyle = 'rgba(217,174,114,.30)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-TW / 2 - BORDE + 1, -TH / 2 - BORDE + 1, TW + BORDE * 2 - 2, TH + BORDE * 2 - 2, R + 7);
  ctx.stroke();
  ctx.restore();
}

/* ── la pantalla del salón ──
   Las capturas anchas son 1920x1080. Se dibujan como lo que son: una
   proyección en un salón oscuro, con su halo. Sin el halo es un
   rectángulo pegado sobre negro y no se lee como una pantalla. */
const PW = 992, PH = 558;
function proyeccion(cx, cy, img, { escala = 1, alfa = 1, halo = 1 } = {}) {
  if (alfa <= .002 || !img) return;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.scale(escala, escala);
  if (halo > 0) {
    const g = ctx.createRadialGradient(0, 0, PH * .35, 0, 0, PH * 1.5);
    g.addColorStop(0, `rgba(217,174,114,${.14 * halo})`);
    g.addColorStop(1, 'rgba(217,174,114,0)');
    ctx.fillStyle = g; ctx.fillRect(-PH * 1.5, -PH * 1.5, PH * 3, PH * 3);
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#100D0A';
  ctx.beginPath(); ctx.roundRect(-PW / 2 - 10, -PH / 2 - 10, PW + 20, PH + 20, 12); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-PW / 2, -PH / 2, PW, PH, 6); ctx.clip();
  ctx.drawImage(img, -PW / 2, -PH / 2, PW, PH);
  ctx.restore();
  ctx.strokeStyle = 'rgba(217,174,114,.26)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-PW / 2 - 9, -PH / 2 - 9, PW + 18, PH + 18, 11); ctx.stroke();
  ctx.restore();
}

/* Dónde cae, en el video, un punto que en la captura del teléfono está
   a la fracción (fx, fy). Las fracciones las mide capturar-muro.js del
   DOM, no se ponen a ojo: puestas a mano el anillo señala cualquier
   cosa, y ya pasó en el video de invitaciones. */
const enPantalla = (cx, cy, escala, fx, fy) => ({
  x: cx + (fx - .5) * TW * escala,
  y: cy + (fy - .5) * TH * escala,
});
const CAJA = (n, porDefecto) => (window.__CAJAS_MURO && window.__CAJAS_MURO[n]) || porDefecto;

function senalar(cx, cy, w, h, p, { etiqueta = '' } = {}) {
  if (p <= 0) return;
  const e = sale(clamp(p, 0, 1));
  ctx.save();
  ctx.globalAlpha = Math.min(1, p * 1.6);
  ctx.strokeStyle = ORO; ctx.lineWidth = 5;
  const ww = w * (1.25 - .25 * e), hh = h * (1.25 - .25 * e);
  ctx.beginPath(); ctx.roundRect(cx - ww / 2, cy - hh / 2, ww, hh, 14); ctx.stroke();
  ctx.globalAlpha = .28 * (0.5 + 0.5 * Math.sin(p * 9));
  ctx.lineWidth = 16; ctx.stroke();
  ctx.restore();
  if (etiqueta) texto(etiqueta, cx, cy - hh / 2 - 34,
    { tam: 34, esp: 7, color: ORO, alfa: Math.min(1, p * 2), peso: 400 });
}

/* ══════════ 1 · el gancho ══════════
   El problema no es que falten fotos: es que están repartidas en
   doscientos teléfonos y no las ve nadie. */
function actoGancho(t) {
  texto('MURO EN VIVO', W / 2, 300,
    { tam: 29, esp: 13, color: ORO, alfa: inv(t, .3, 1.1), peso: 400 });

  /* Los teléfonos encendidos en la oscuridad del salón, cada uno con
     su foto guardada adentro y sin salir de ahí. La primera versión
     eran rectángulos grises de 54px: parecían ladrillos, no pantallas.
     Lo que los hace leer como teléfonos prendidos es el HALO, no el
     rectángulo. */
  const n = 14;
  for (let i = 0; i < n; i++) {
    const p = inv(t, .5 + i * .05, 1.3 + i * .05);
    if (p <= 0) continue;
    const x = 140 + rnd(i * 3.1) * (W - 280);
    const y = 690 + rnd(i * 7.7) * 440;
    const w = 72, h = 150;
    const luz = .30 + rnd(i * 9.1) * .40;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(x, y); ctx.rotate((rnd(i * 5.5) - .5) * .55);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, h * 1.25);
    g.addColorStop(0, `rgba(243,217,166,${.22 * luz})`);
    g.addColorStop(1, 'rgba(243,217,166,0)');
    ctx.fillStyle = g; ctx.fillRect(-h * 1.3, -h * 1.3, h * 2.6, h * 2.6);
    ctx.fillStyle = '#19150F';
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 13); ctx.fill();
    ctx.fillStyle = `rgba(243,217,166,${luz})`;
    ctx.beginPath(); ctx.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 8); ctx.fill();
    ctx.restore();
  }

  texto('Doscientos invitados', W / 2, 1320,
    { tam: 74, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(t, 1.4, 2.1) });
  texto('sacando fotos de tu fiesta.', W / 2, 1410,
    { tam: 74, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(t, 1.6, 2.3) });
  texto('Y vos no vas a ver casi ninguna.', W / 2, 1530,
    { tam: 40, color: MUTE, alfa: inv(t, 2.2, 2.9) });
}

/* ══════════ 2 · el código en la mesa ══════════ */
function actoCartel(t) {
  const u = t - 3.4;                                    // 0 … 3.6
  proyeccion(W / 2, 1010, IMG.cartel,
    { alfa: inv(u, 0, .5), escala: .96 + .04 * sale(inv(u, 0, 1.2)) });
  texto('Se proyecta un código.', W / 2, 560,
    { tam: 78, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .3, 1.1) });
  texto('Y el mismo va impreso en cada mesa.', W / 2, 650,
    { tam: 38, color: MUTE, alfa: inv(u, .7, 1.5) });
  texto('SIN APP · SIN CUENTA · SIN CONTRASEÑA', W / 2, 1480,
    { tam: 32, esp: 8, color: ORO, alfa: inv(u, 1.6, 2.4), peso: 400 });
  texto('Lo escanean con la cámara del teléfono.', W / 2, 1570,
    { tam: 36, color: MUTE, alfa: inv(u, 2.0, 2.8) });
}

/* ══════════ 3 · el invitado manda ══════════ */
function actoInvitado(t) {
  const u = t - 7.0;                                    // 0 … 4.0
  const ESC = .74, CY = 1120;
  telefono(W / 2, CY, IMG.invitado, { escala: ESC, alfa: inv(u, 0, .45) });
  /* Acá NO va anillo. El botón "Enviar a la pantalla" ya es la cosa más
     grande y más dorada de esa captura: un anillo dorado alrededor de
     un botón dorado no se ve, y encima ensucia lo único que se mira.
     El anillo queda para el "Aprobar" del panel, que es un renglón
     chiquito entre otros diez. */
  texto('Elige la foto,', W / 2, 250,
    { tam: 74, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .25, 1.0) });
  texto('escribe su dedicatoria,', W / 2, 340,
    { tam: 74, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .55, 1.3) });
  texto('y manda.', W / 2, 430,
    { tam: 74, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, .85, 1.6) });
  texto('También puede dejar un audio o un video.', W / 2, 1880,
    { tam: 36, color: MUTE, alfa: inv(u, 2.1, 2.9) });
}

/* ══════════ 4 · a los segundos, en la pantalla ══════════
   Es el acto que vende la cosa, así que la proyección entra con un
   destello: el corte tiene que SENTIRSE instantáneo. */
function actoSala(t) {
  const u = t - 11.0;                                   // 0 … 4.0
  const ap = inv(u, .15, .5);
  proyeccion(W / 2, 1000, IMG.sala, { alfa: ap, escala: .94 + .06 * sale(ap), halo: ap });
  const f = pulso(u, .05, .45);
  if (f > .01) { ctx.fillStyle = `rgba(255,248,232,${f * .34})`; ctx.fillRect(0, 0, W, H); }

  texto('A los segundos', W / 2, 520,
    { tam: 80, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .5, 1.2) });
  texto('está en la pantalla del salón.', W / 2, 615,
    { tam: 80, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .75, 1.5) });
  texto('Se van pasando solas toda la noche.', W / 2, 1470,
    { tam: 38, color: MUTE, alfa: inv(u, 1.9, 2.6) });
  texto('La fiesta se ve a sí misma mientras pasa.', W / 2, 1560,
    { tam: 38, cursiva: true, fam: 'Bodoni Moda', color: ORO, alfa: inv(u, 2.3, 3.0) });
}

/* ══════════ 5 · lo mirás antes ══════════ */
function actoModerar(t) {
  const u = t - 15.0;                                   // 0 … 3.6
  const ESC = .70, CY = 1170;
  telefono(W / 2, CY, IMG.panel, { escala: ESC, alfa: inv(u, 0, .45) });
  {
    const k = CAJA('aprobar', { fx: .284, fy: .792, fw: .429, fh: .049 });
    const q = enPantalla(W / 2, CY, ESC, k.fx, k.fy);
    senalar(q.x, q.y, k.fw * TW * ESC, k.fh * TH * ESC, inv(u, .9, 1.7));
  }
  texto('Nada se proyecta', W / 2, 250,
    { tam: 76, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .2, .9) });
  texto('sin que vos lo mires.', W / 2, 340,
    { tam: 76, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .45, 1.2) });
  texto('Desde tu teléfono, durante la fiesta.', W / 2, 1880,
    { tam: 36, color: MUTE, alfa: inv(u, 1.8, 2.5) });
}

/* ══════════ 6 · el tablero ══════════ */
function actoTablero(t) {
  const u = t - 18.6;                                   // 0 … 3.2
  proyeccion(W / 2, 1000, IMG.tablero, { alfa: inv(u, 0, .45), escala: .96 });
  texto('O todo junto.', W / 2, 560,
    { tam: 80, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .25, 1.0) });
  const lineas = [
    'La foto grande y las que están entrando',
    'El contador en vivo y el código, siempre a la vista',
  ];
  lineas.forEach((l, i) => texto(l, W / 2, 1450 + i * 62,
    { tam: 36, color: MUTE, alfa: inv(u, 1.0 + i * .35, 1.8 + i * .35) }));
}

/* ══════════ 7 · el álbum del día después ══════════ */
function actoAlbum(t) {
  const u = t - 21.8;                                   // 0 … 3.0
  telefono(W / 2, 1180, IMG.album, { escala: .70, alfa: inv(u, 0, .45) });
  texto('Al otro día,', W / 2, 250,
    { tam: 76, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .2, .9) });
  texto('el álbum entero.', W / 2, 340,
    { tam: 76, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, .45, 1.2) });
  texto('Todas las fotos en un zip, en tamaño original.', W / 2, 1880,
    { tam: 35, color: MUTE, alfa: inv(u, 1.5, 2.2) });
}

/* ══════════ 8 · cierre ══════════ */
function actoCierre(t) {
  const u = t - 24.8;                                   // 0 … 3.2
  const fichas = [[IMG.album, -300, -.10], [IMG.panel, 300, .10], [IMG.invitado, 0, 0]];
  for (let i = 0; i < 3; i++) {
    const [im, dx, gi] = fichas[i];
    const p = inv(u, .05 + i * .14, .75 + i * .14);
    if (p <= 0) continue;
    telefono(W / 2 + dx * sale(p), 860 + (i === 2 ? -30 : 24), im,
      { escala: .40, alfa: p * (i === 2 ? 1 : .92), giro: gi * sale(p) });
  }
  const a = inv(u, 1.1, 1.9);
  texto('CLICK', W / 2, 1420, { tam: 104, fam: 'Bodoni Moda', esp: 16, color: CHAMPAN, alfa: a });
  texto('ETERNO', W / 2, 1530, { tam: 104, fam: 'Bodoni Moda', esp: 16, color: CHAMPAN, alfa: inv(u, 1.25, 2.05) });
  const b = inv(u, 1.7, 2.3);
  ctx.save(); ctx.globalAlpha = b; ctx.strokeStyle = ORO; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 160 * b, 1590); ctx.lineTo(W / 2 + 160 * b, 1590); ctx.stroke();
  ctx.restore();
  texto('El muro en vivo de tu fiesta', W / 2, 1670,
    { tam: 38, color: MUTE, alfa: inv(u, 1.9, 2.6) });
  texto('clicketerno.com.ar', W / 2, 1790,
    { tam: 54, fam: 'Bodoni Moda', color: ORO, alfa: inv(u, 2.1, 2.8) });
  texto('341 250-6451', W / 2, 1860, { tam: 38, esp: 4, color: MUTE, alfa: inv(u, 2.3, 3.0) });
}

function dibujar(t) {
  fondo();
  if (t < 3.4) actoGancho(t);
  else if (t < 7.0) actoCartel(t);
  else if (t < 11.0) actoInvitado(t);
  else if (t < 15.0) actoSala(t);
  else if (t < 18.6) actoModerar(t);
  else if (t < 21.8) actoTablero(t);
  else if (t < 24.8) actoAlbum(t);
  else actoCierre(t);
  vineta(.55);
  grano(t);
  const n = Math.min(inv(t, 0, .45), 1 - inv(t, DUR - .5, DUR));
  if (n < 1) { ctx.fillStyle = `rgba(10,8,6,${1 - n})`; ctx.fillRect(0, 0, W, H); }
}

window.__listo = false; window.__dur = DUR;
window.pintar = t => dibujar(t);
(async () => {
  const c = document.getElementById('lienzo');
  c.width = W; c.height = H; ctx = c.getContext('2d');
  /* Las anchas son 1920x1080 (la pantalla del salón) y las otras
     1170x2532 (un teléfono). Las saca capturar-muro.js. */
  const archivos = {
    invitado: 'invitado.full.jpg', panel: 'panel.full.jpg', album: 'album.full.jpg',
    cartel: 'cartel.ancha.full.jpg', sala: 'sala.ancha.full.jpg',
    tablero: 'tablero-limpio.ancha.full.jpg',
  };
  await Promise.all(Object.entries(archivos).map(([n, f]) => new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => { IMG[n] = i; ok(); };
    i.onerror = () => no(new Error('no cargó img-muro/' + f));
    i.src = 'img-muro/' + f;
  })));
  await document.fonts.load('400 92px "Bodoni Moda"');
  await document.fonts.load('italic 400 72px "Bodoni Moda"');
  await document.fonts.load('300 40px "Jost"');
  await document.fonts.ready;
  dibujar(0);
  window.__listo = true;
})();
