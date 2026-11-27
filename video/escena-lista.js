/* ═══════════════════════════════════════════════════════════════
   INSTRUCTIVO · cómo armar la lista de invitados · La Mansión del Rey
   1080x1920 (vertical, para WhatsApp), 30 fps, 55 s.

   El problema que resuelve: la lista llega por mesa y en la puerta hay
   que leer la hoja entera para encontrar a uno. Lo que más importa es
   el PASO 3 (ordenada por apellido) y por eso es el tramo más largo.

   Rejilla de la música: 96 BPM, compás 2,5 s, 22 compases = 55 s.
   Cada paso arranca en un compás.

   Los nombres de la hoja son INVENTADOS (no son de un cliente).
   El logo sale de video/logo-mansion.png si está; si no, el nombre en letras.
   ═══════════════════════════════════════════════════════════════ */
const W = 1080, H = 1920, DUR = 55, FPS = 30;

const FONDO = '#F4F0E9', PAPEL = '#FFFFFF', TINTA = '#1B1820', TINTA2 = '#5E5862',
  LINEA = '#E3DDD4', ROJO = '#B23A26', ROJO_S = 'rgba(194,65,45,.12)', ORO = '#9A7224',
  VERDE = '#17704A', VERDE_S = 'rgba(34,160,107,.14)', CLARO = '#F5F1EA';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const sale5 = x => 1 - Math.pow(1 - x, 5);
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let ctx, grano, logo = null;

const F = {
  b: (px, it = false, w = 400) => `${it ? 'italic ' : ''}${w} ${px}px "Bodoni Moda"`,
  j: (px, w = 400) => `${w} ${px}px "Jost"`,
};
/* entra con un empujón desde abajo y se va desvaneciendo */
const vis = (t, t0, t1, d = .6) => sale5(inv(t, t0, t0 + d)) * (1 - suave(inv(t, t1 - .35, t1)));

function txt(s, x, y, font, color, a = 1, align = 'center', ls = 0){
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.font = font; ctx.fillStyle = color;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px';
  ctx.fillText(s, x, y); ctx.restore();
}
/* achica la letra hasta que entre en el ancho */
function cabe(s, px, max, fn){
  ctx.letterSpacing = '0px';
  for (; px > 20; px -= 2){ ctx.font = fn(px); if (ctx.measureText(s).width <= max) break; }
  return px;
}
/* texto en varias líneas, centrado */
function parrafo(s, y, px, color, a, paso = px * 1.35, max = 900, w = 400){
  if (a <= 0) return;
  ctx.font = F.j(px, w); ctx.letterSpacing = '0px';
  const pal = s.split(' '), lin = []; let cur = '';
  for (const p of pal){
    const prueba = cur ? cur + ' ' + p : p;
    if (ctx.measureText(prueba).width > max && cur){ lin.push(cur); cur = p; } else cur = prueba;
  }
  if (cur) lin.push(cur);
  lin.forEach((l, i) => txt(l, 540, y + i * paso, F.j(px, w), color, a));
}
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

/* ── el encabezado de cada paso: PASO n + título + bajada ── */
function encabezado(t, t0, t1, paso, titulo, bajada){
  const a = vis(t, t0, t1), dy = (1 - sale5(inv(t, t0, t0 + .7))) * 40;
  if (a <= 0) return;
  if (paso) txt(paso, 540, 250 + dy, F.j(30, 600), ROJO, a, 'center', 8);
  const px = cabe(titulo, 92, 960, p => F.b(p));
  txt(titulo, 540, 365 + dy, F.b(px), TINTA, a);
  if (bajada) txt(bajada, 540, 440 + dy, F.j(40, 400), TINTA2, sale5(inv(t, t0 + .25, t0 + .9)) * a);
}

/* ── la hoja impresa ── */
const COL = [  // dónde empieza cada columna y cómo se alinea
  {x: 96,  w: 400, et: 'APELLIDO Y NOMBRE', al: 'left'},
  {x: 496, w: 100, et: 'MESA', al: 'center'},
  {x: 596, w: 250, et: 'MENÚ ESPECIAL', al: 'left'},
  {x: 846, w: 140, et: 'SILLA ALTA', al: 'center'},
];
const HX = 70, HW = 940, CAB = 74, FILA = 66;
/* nombres inventados. iM = orden por mesa (así llega), iA = orden por apellido */
const INV = [
  ['Gómez, Marta',   '1', '',            ''],
  ['Gómez, Luis',    '1', '',            ''],
  ['Ruiz, Ana',      '1', 'Celíaco',     ''],
  ['Pereyra, Juan',  '2', '',            ''],
  ['Acosta, Lucía',  '2', 'Vegetariano', ''],
  ['Acosta, Pablo',  '2', '',            ''],
  ['Díaz, Sofía',    '3', 'Infantil',    ''],
  ['Díaz, Tomás',    '3', '',            'SÍ'],
  ['Benítez, Carla', '3', 'Sin sal',     ''],
].map((f, iM) => ({f, iM}));
[...INV].sort((a, b) => a.f[0].localeCompare(b.f[0], 'es')).forEach((r, i) => r.iA = i);

function celda(r, c, y, a, color){
  const co = COL[c], s = r.f[c];
  if (!s) { if (c >= 2) txt('—', co.al === 'left' ? co.x + 10 : co.x + co.w / 2, y, F.j(28), LINEA, a, co.al === 'left' ? 'left' : 'center'); return; }
  const font = c === 0 ? F.j(33, 400) : c === 1 ? F.j(34, 600) : c === 2 ? F.j(29, 400) : F.j(30, 600);
  const col = color || (c === 2 ? ORO : c === 3 ? VERDE : TINTA);
  txt(s, co.al === 'left' ? co.x + 10 : co.x + co.w / 2, y, font, col, a, co.al === 'left' ? 'left' : 'center');
}

/* o: {a, y0, filas:[{r, pos, a, lift}], banda:{c, color, a}, cab:{c, a}} */
function hoja(o){
  const nf = o.nfilas || o.filas.length;
  const alto = CAB + nf * FILA + 24;
  ctx.save(); ctx.globalAlpha = o.a;
  ctx.save(); ctx.shadowColor = 'rgba(60,40,20,.18)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  rr(HX, o.y0, HW, alto, 14); ctx.fillStyle = PAPEL; ctx.fill(); ctx.restore();
  // cabecera
  ctx.save(); rr(HX, o.y0, HW, CAB, [14, 14, 0, 0]); ctx.fillStyle = TINTA; ctx.fill(); ctx.restore();
  COL.forEach((co, c) => {
    let fondo = null;
    if (o.cab && o.cab.c === c && o.cab.a > 0){ fondo = o.cab.color || ROJO; }
    if (fondo){ ctx.save(); ctx.globalAlpha = o.a * o.cab.a; ctx.fillStyle = fondo;
      ctx.fillRect(co.x - (c === 0 ? 26 : 0), o.y0, co.w + (c === 0 ? 26 : 0) + (c === 3 ? 24 : 0), CAB); ctx.restore(); }
    txt(co.et, co.al === 'left' ? co.x + 10 : co.x + co.w / 2, o.y0 + 47, F.j(21, 600), CLARO, o.a, co.al === 'left' ? 'left' : 'center', 2);
  });
  // banda sobre una columna
  if (o.banda && o.banda.a > 0){
    const co = COL[o.banda.c];
    ctx.save(); ctx.globalAlpha = o.a * o.banda.a; ctx.fillStyle = o.banda.color || ROJO_S;
    ctx.fillRect(co.x - (o.banda.c === 0 ? 26 : 0), o.y0 + CAB, co.w + (o.banda.c === 0 ? 26 : 0) + (o.banda.c === 3 ? 24 : 0), nf * FILA + 24); ctx.restore();
  }
  // renglones de fondo (las líneas quedan quietas, los nombres se mueven)
  for (let i = 1; i < nf; i++){
    ctx.fillStyle = LINEA; ctx.fillRect(HX + 26, o.y0 + CAB + 12 + i * FILA, HW - 52, 2);
  }
  // marca que recorre (la búsqueda en la puerta)
  if (o.busca && o.busca.a > 0){
    const y = o.y0 + CAB + 12 + o.busca.pos * FILA;
    ctx.save(); ctx.globalAlpha = o.a * o.busca.a; ctx.fillStyle = 'rgba(224,161,50,.30)';
    rr(HX + 14, y + 4, HW - 28, FILA - 8, 10); ctx.fill(); ctx.restore();
  }
  // los nombres: primero los quietos, después los que van levantados
  const orden = [...o.filas].sort((p, q) => (p.lift || 0) - (q.lift || 0));
  for (const fl of orden){
    if (fl.a <= 0) continue;
    const y = o.y0 + CAB + 12 + fl.pos * FILA;
    ctx.save();
    if (fl.lift > .01){
      ctx.save(); ctx.globalAlpha = o.a * fl.a; ctx.shadowColor = 'rgba(60,40,20,.25)'; ctx.shadowBlur = 24 * fl.lift; ctx.shadowOffsetY = 8 * fl.lift;
      rr(HX + 14 + 10 * fl.lift, y + 4, HW - 28, FILA - 8, 10); ctx.fillStyle = PAPEL; ctx.fill(); ctx.restore();
      ctx.translate(10 * fl.lift, 0);
    }
    const ya = y + 44;
    for (let c = 0; c < 4; c++) celda(fl.r, c, ya, o.a * fl.a * (fl.colA ? fl.colA[c] : 1));
    // la inicial del apellido, en verde cuando ya está ordenada
    if (fl.ini > 0){
      txt(fl.r.f[0][0], COL[0].x + 10, ya, F.j(33, 600), VERDE, o.a * fl.a * fl.ini, 'left');
    }
    ctx.restore();
  }
  ctx.restore();
  return alto;
}

/* ── iconos dibujados ── */
function tilde(x, y, r, a, color = VERDE){
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * .45, y + r * .02); ctx.lineTo(x - r * .12, y + r * .34); ctx.lineTo(x + r * .48, y - r * .32); ctx.stroke(); ctx.restore();
}
function cruz(x, y, r, a){
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = ROJO; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .22; ctx.lineCap = 'round';
  const k = r * .36; ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke(); ctx.restore();
}
function coronita(x, y, s, a, color = ORO){
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-30, 14); ctx.lineTo(-34, -14); ctx.lineTo(-16, 0); ctx.lineTo(0, -20); ctx.lineTo(16, 0); ctx.lineTo(34, -14); ctx.lineTo(30, 14); ctx.closePath(); ctx.fill();
  ctx.fillRect(-30, 18, 60, 6); ctx.restore();
}
function sillaAlta(x, y, s, a, k){
  // la silla alta de bebé, dibujada con trazos que se van haciendo (k de 0 a 1)
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = TINTA; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const trazos = [
    [[-60, -120], [-60, 10]], [[60, -120], [60, 10]],              // respaldo
    [[-60, -120], [60, -120]],
    [[-80, 10], [80, 10]], [[-80, -40], [-60, -40]], [[60, -40], [80, -40]], // asiento y apoyabrazos
    [[-80, -40], [-80, 10]], [[80, -40], [80, 10]],
    [[-50, 10], [-95, 170]], [[50, 10], [95, 170]],                // patas
    [[-70, 90], [70, 90]],                                          // apoyapié
  ];
  trazos.forEach((tr, i) => {
    const kk = clamp(k * trazos.length - i, 0, 1); if (kk <= 0) return;
    ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1]); ctx.lineTo(lerp(tr[0][0], tr[1][0], kk), lerp(tr[0][1], tr[1][1], kk)); ctx.stroke();
  });
  // la bandeja, en rojo
  const kb = clamp(k * 1.2 - .2, 0, 1);
  if (kb > 0){ ctx.strokeStyle = ROJO; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-95, -52); ctx.lineTo(-95 + 190 * kb, -52); ctx.stroke(); }
  ctx.restore();
}
function telefono(x, y, s, color){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-14, -26); ctx.quadraticCurveTo(-26, -24, -24, -8); ctx.quadraticCurveTo(-18, 14, 4, 24);
  ctx.quadraticCurveTo(20, 30, 26, 18); ctx.lineTo(24, 10); ctx.lineTo(12, 4); ctx.lineTo(6, 12);
  ctx.quadraticCurveTo(-6, 6, -10, -6); ctx.lineTo(-2, -12); ctx.lineTo(-6, -24); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ── la marca, abajo de todo ── */
function marca(t, y = 1800, a = 1){
  if (logo){
    const h = 120, w = h * logo.width / logo.height;
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(logo, 540 - w / 2, y - h / 2 - 20, w, h); ctx.restore();
    return;
  }
  coronita(540, y - 58, .7, a);
  txt('LA MANSIÓN DEL REY', 540, y, F.j(28, 600), TINTA, a, 'center', 8);
}

/* ═════ los tramos ═════ */

function s1(t){ // 0–5 · el título
  const a = vis(t, .2, 5.0, .8);
  if (a <= 0) return;
  if (logo){
    const h = 260, w = h * logo.width / logo.height, e = sale5(inv(t, .2, 1.1));
    ctx.save(); ctx.globalAlpha = a * e; ctx.drawImage(logo, 540 - w / 2, 300, w, h); ctx.restore();
  } else {
    coronita(540, 400, 1.4, a * sale5(inv(t, .2, 1)));
    txt('LA MANSIÓN DEL REY', 540, 500, F.j(34, 600), TINTA, a * sale5(inv(t, .3, 1.1)), 'center', 10);
  }
  const l = [
    ['Cómo armar', F.b(84, true), ROJO, 760, .5],
    ['la lista de', F.b(124), TINTA, 900, .75],
    ['invitados', F.b(150, false, 600), TINTA, 1060, 1.0],
  ];
  for (const [s, f, c, y, d] of l){
    const e = sale5(inv(t, d, d + .8));
    txt(s, 540, y + (1 - e) * 50, f, c, a * e);
  }
  const e = sale5(inv(t, 1.6, 2.3));
  ctx.save(); ctx.globalAlpha = a * e; ctx.fillStyle = ORO; ctx.fillRect(540 - 120 * e, 1130, 240 * e, 3); ctx.restore();
  txt('4 pasos para que el ingreso', 540, 1230, F.j(42), TINTA2, a * e);
  txt('sea rápido y sin problemas', 540, 1290, F.j(42), TINTA2, a * e);
}

function s2(t){ // 5–10 · impresa, 10 días antes
  const t0 = 5.0, t1 = 10.0;
  encabezado(t, t0, t1, 'PASO 1', 'Traela impresa', 'en papel, al salón');
  const a = vis(t, t0 + .3, t1);
  if (a <= 0) return;
  // el calendario
  const e = sale5(inv(t, t0 + .3, t0 + 1.1)), cy = 860 + (1 - e) * 80;
  ctx.save(); ctx.globalAlpha = a;
  ctx.save(); ctx.shadowColor = 'rgba(60,40,20,.2)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  rr(330, cy - 220, 420, 440, 28); ctx.fillStyle = PAPEL; ctx.fill(); ctx.restore();
  ctx.save(); rr(330, cy - 220, 420, 110, [28, 28, 0, 0]); ctx.fillStyle = ROJO; ctx.fill(); ctx.restore();
  ctx.fillStyle = TINTA; for (const x of [430, 650]){ rr(x - 10, cy - 250, 20, 64, 10); ctx.fill(); }
  ctx.restore();
  txt('ANTES DE LA FIESTA', 540, cy - 150, F.j(28, 600), CLARO, a, 'center', 4);
  // cuenta de 30 a 10
  const n = Math.round(lerp(30, 10, suave(inv(t, t0 + .8, t0 + 2.0))));
  txt(String(n), 540, cy + 120, F.b(230, false, 600), TINTA, a);
  txt('DÍAS', 540, cy + 185, F.j(36, 600), TINTA2, a, 'center', 10);
  // la bajada
  const b = vis(t, t0 + 1.9, t1);
  parrafo('La lista se entrega impresa en el salón, 10 días antes de la fiesta.', 1290, 46, TINTA, b, 64, 860, 400);
  parrafo('Así la revisamos con tiempo.', 1450, 40, TINTA2, vis(t, t0 + 2.6, t1), 56);
}

/* paso 2 y 3: la misma hoja */
const CAPS = [
  ['Apellido y nombre', 'de cada invitado'],
  ['Número de mesa', 'la que le toca'],
  ['Menú especial', 'solo si tiene'],
  ['Silla alta', 'si viene un bebé'],
];
function s34(t){ // 10–27,5
  const ta = 10.0, tb = 17.5, tc = 27.5;
  encabezado(t, ta, tb, 'PASO 2', 'Un invitado por renglón', 'con estos 4 datos');
  encabezado(t, tb, tc, 'PASO 3', 'Ordenala por apellido', 'de la A a la Z · no por mesa');
  const a = vis(t, ta + .3, tc, .7);
  if (a <= 0) return;
  const y0 = 540 + (1 - sale5(inv(t, ta + .3, ta + 1.1))) * 120;
  // orden: por mesa, y entre 20,6 y 22,6 se reacomodan por apellido
  const filas = INV.map((r, i) => {
    const k = suave(inv(t, 20.6 + r.iA * .1, 21.8 + r.iA * .1));
    const lift = Math.sin(k * Math.PI);
    // en el paso 2 se van escribiendo de a un renglón
    const ap = sale5(inv(t, ta + .9 + r.iM * .13, ta + 1.4 + r.iM * .13));
    const colA = [0, 1, 2, 3].map(c => c === 0 ? 1 : sale5(inv(t, 11.6 + c * 1.45 - .2 + r.iM * .04, 11.6 + c * 1.45 + .4 + r.iM * .04)));
    return {r, pos: lerp(r.iM, r.iA, k), a: ap, lift, colA, ini: sale5(inv(t, 22.6, 23.2))};
  });
  // en el paso 2, cada columna se enciende con su leyenda
  let cab = null, banda = null;
  const cIdx = Math.floor((t - 11.6) / 1.45);
  if (t >= 11.6 && t < 17.4 && cIdx < 4){
    const k = vis(t, 11.6 + cIdx * 1.45, 11.6 + (cIdx + 1) * 1.45, .3);
    cab = {c: cIdx, a: k}; banda = {c: cIdx, a: k};
  }
  // paso 3: mesa en rojo (así no), después apellido en verde (así sí)
  const mal = vis(t, 18.3, 20.7, .4);
  if (mal > 0){ cab = {c: 1, a: mal}; banda = {c: 1, a: mal}; }
  const bien = vis(t, 22.4, 27.4, .5);
  if (bien > 0 && t >= 22.4){ cab = {c: 0, a: bien, color: VERDE}; banda = {c: 0, a: bien * (1 - inv(t, 24.0, 24.4)), color: VERDE_S}; }
  // la búsqueda: "Pereyra" se encuentra enseguida
  let busca = null;
  const bk = vis(t, 24.2, 27.2, .3);
  if (bk > 0){
    const destino = INV.find(r => r.f[0].startsWith('Pereyra')).iA;
    busca = {a: bk, pos: lerp(0, destino, suave(inv(t, 24.5, 25.3)))};
  }
  const alto = hoja({a, y0, filas, cab, banda, busca});
  // sello "así no"
  if (mal > 0){
    const s = 1 + (1 - sale5(inv(t, 18.3, 18.7))) * .6;
    ctx.save(); ctx.globalAlpha = mal * a; ctx.translate(540, y0 + alto + 110); ctx.rotate(-.12); ctx.scale(s, s);
    ctx.strokeStyle = ROJO; ctx.lineWidth = 6; rr(-170, -48, 340, 96, 14); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(540, y0 + alto + 110); ctx.rotate(-.12); ctx.scale(s, s);
    txt('ASÍ NO', 0, 18, F.j(50, 600), ROJO, mal * a, 'center', 8); ctx.restore();
  }
  // las leyendas de abajo
  const yc = y0 + alto + 120;
  if (t < 17.5 && cIdx >= 0 && cIdx < 4){
    const k = vis(t, 11.6 + cIdx * 1.45, 11.6 + (cIdx + 1) * 1.45, .35);
    const [g, p] = CAPS[cIdx];
    txt((cIdx + 1) + '.', 540, yc - 70, F.j(34, 600), ROJO, k * a);
    txt(g, 540, yc + 10, F.b(70), TINTA, k * a);
    txt(p, 540, yc + 75, F.j(40), TINTA2, k * a);
  }
  if (t >= 17.5){
    const l1 = vis(t, 18.3, 20.7, .5);
    parrafo('Por mesa, en la puerta hay que leer toda la hoja para encontrar a uno.', yc + 130, 42, ROJO, l1 * a, 58, 880);
    const l2 = vis(t, 22.6, 24.4, .5);
    parrafo('Por apellido, cada invitado se encuentra en segundos.', yc, 44, VERDE, l2 * a, 60, 880, 600);
    const l3 = vis(t, 24.4, 27.5, .5);
    parrafo('Así la gente entra rápido y sin hacer fila.', yc, 44, TINTA, l3 * a, 60, 880, 600);
    // chip "buscando" mientras corre la marca
    if (bk > 0){
      const kk = bk * (1 - inv(t, 25.6, 26.0));
      txt('Buscamos: Pereyra', 540, y0 - 32, F.j(34, 600), ORO, kk * a);
      if (t > 25.3) tilde(540 + 400, y0 + CAB + 12 + 7 * FILA + FILA / 2, 26, bk * sale5(inv(t, 25.3, 25.6)) * a);
    }
  }
}

const MENUS = ['Infantil', 'Vegetariano', 'Vegano', 'Celíaco', 'Diabético', 'Sin sal'];
function s5(t){ // 27,5–35 · menú especial
  const t0 = 27.5, t1 = 35.0;
  encabezado(t, t0, t1, 'PASO 4', '¿Algún menú especial?', 'anotalo en su columna');
  MENUS.forEach((m, i) => {
    const e = vis(t, t0 + .5 + i * .18, t1, .5);
    if (e <= 0) return;
    const x = i % 2 ? 790 : 290, y = 620 + Math.floor(i / 2) * 140 + (1 - e) * 40;
    ctx.save(); ctx.globalAlpha = e;
    rr(x - 220, y - 52, 440, 104, 52); ctx.fillStyle = PAPEL; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ORO; ctx.stroke();
    ctx.restore();
    txt(m, x, y + 15, F.j(44, 400), TINTA, e);
  });
  // el renglón de ejemplo
  const a = vis(t, t0 + 2.4, t1, .6);
  if (a > 0){
    const r = INV.find(r => r.f[0].startsWith('Ruiz'));
    hoja({a, y0: 1080 + (1 - sale5(inv(t, t0 + 2.4, t0 + 3))) * 60, nfilas: 1, filas: [{r, pos: 0, a: 1}],
      cab: {c: 2, a: vis(t, t0 + 3.2, t1, .4)}, banda: {c: 2, a: vis(t, t0 + 3.2, t1, .4)}});
  }
  parrafo('Al lado del nombre de quien lo necesita.', 1370, 42, TINTA, vis(t, t0 + 3.4, t1), 58);
  parrafo('Si no tiene, ese casillero va vacío.', 1450, 40, TINTA2, vis(t, t0 + 4.2, t1), 56);
}

function s6(t){ // 35–40 · silla alta
  const t0 = 35.0, t1 = 40.0;
  encabezado(t, t0, t1, 'SI VIENE UN BEBÉ', '¿Necesita silla alta?', 'anotalo igual en la lista');
  const a = vis(t, t0 + .2, t1);
  if (a > 0) sillaAlta(540, 720, 1.3, a, inv(t, t0 + .3, t0 + 1.6));
  const b = vis(t, t0 + 1.2, t1, .6);
  if (b > 0){
    const r = INV.find(r => r.f[0].startsWith('Díaz, T'));
    hoja({a: b, y0: 1030 + (1 - sale5(inv(t, t0 + 1.2, t0 + 1.8))) * 60, nfilas: 1, filas: [{r, pos: 0, a: 1}],
      cab: {c: 3, a: vis(t, t0 + 2, t1, .4), color: VERDE}, banda: {c: 3, a: vis(t, t0 + 2, t1, .4), color: VERDE_S}});
  }
  parrafo('Con su nombre y su mesa, y un SÍ en la columna de silla alta.', 1350, 42, TINTA, vis(t, t0 + 2.2, t1), 58, 860);
}

const PARES = [
  ['Tía Marta', 'Gómez, Marta'],
  ['Los primos (4)', 'Un renglón por persona'],
  ['“El celíaco de la mesa 1”', 'Ruiz, Ana · Mesa 1 · Celíaco'],
];
function s7(t){ // 40–47,5 · así no / así sí
  const t0 = 40.0, t1 = 47.5;
  encabezado(t, t0, t1, 'LO QUE MÁS SE EQUIVOCA', 'Así no · Así sí', '');
  PARES.forEach(([no, si], i) => {
    const ti = t0 + .6 + i * 2.1, e = vis(t, ti, t1, .5);
    if (e <= 0) return;
    const y = 560 + i * 330 + (1 - e) * 40;
    ctx.save(); ctx.globalAlpha = e;
    ctx.save(); ctx.shadowColor = 'rgba(60,40,20,.14)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    rr(80, y, 920, 270, 22); ctx.fillStyle = PAPEL; ctx.fill(); ctx.restore();
    ctx.fillStyle = LINEA; ctx.fillRect(130, y + 134, 820, 2);
    ctx.restore();
    cruz(160, y + 70, 30, e);
    const px = cabe(no, 44, 760, p => F.j(p));
    txt(no, 215, y + 85, F.j(px), TINTA2, e, 'left');
    // tachado que se dibuja
    const k = sale5(inv(t, ti + .5, ti + .9));
    if (k > 0){ ctx.font = F.j(px); const w = ctx.measureText(no).width;
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = ROJO; ctx.fillRect(210, y + 70, (w + 10) * k, 4); ctx.restore(); }
    const ks = vis(t, ti + .9, t1, .5);
    tilde(160, y + 202, 30, ks);
    const ps = cabe(si, 46, 760, p => F.j(p, 600));
    txt(si, 215, y + 218, F.j(ps, 600), TINTA, ks, 'left');
  });
}

const RESUMEN = ['Impresa, 10 días antes', 'Un invitado por renglón', 'Ordenada por apellido', 'Mesa, menú y silla alta'];
function s8(t){ // 47,5–55 · resumen y contacto
  const t0 = 47.5;
  const a = sale5(inv(t, t0, t0 + .6));
  if (a <= 0) return;
  txt('En resumen', 540, 330, F.b(96, true), ROJO, a);
  RESUMEN.forEach((s, i) => {
    const e = sale5(inv(t, t0 + .5 + i * .35, t0 + 1.1 + i * .35)), y = 520 + i * 140;
    if (e <= 0) return;
    ctx.save(); ctx.globalAlpha = e; rr(100, y - 56, 880, 112, 20); ctx.fillStyle = PAPEL; ctx.fill(); ctx.restore();
    tilde(170, y, 30, e);
    txt(s, 225, y + 15, F.j(44, 600), TINTA, e, 'left');
  });
  // el teléfono
  const d = sale5(inv(t, t0 + 2.3, t0 + 3.0));
  if (d > 0){
    txt('¿Dudas? Escribinos o llamanos', 540, 1200, F.j(40), TINTA2, d);
    ctx.save(); ctx.globalAlpha = d; rr(170, 1250, 740, 130, 65); ctx.fillStyle = TINTA; ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = d; telefono(290, 1315, 1.5, CLARO); ctx.restore();
    txt('341 215-8338', 575, 1337, F.j(60, 600), CLARO, d);
  }
  marca(t, 1640, sale5(inv(t, t0 + 3, t0 + 3.8)));
}

/* ═════ el cuadro ═════ */
function fondo(){
  ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(540, 820, 100, 540, 900, 1300);
  g.addColorStop(0, 'rgba(255,255,255,.65)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* barrita de avance, arriba: cuánto falta */
function avance(t){
  const k = inv(t, 5, 47.5);
  if (t < 5 || t > 47.5) return;
  const a = vis(t, 5, 47.5, .4);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = LINEA; ctx.fillRect(140, 130, 800, 6);
  ctx.fillStyle = ROJO; ctx.fillRect(140, 130, 800 * k, 6); ctx.restore();
}

async function dibujar(t){
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.letterSpacing = '0px';
  fondo();
  avance(t);
  s1(t); s2(t); s34(t); s5(t); s6(t); s7(t); s8(t);
  if (t > 5 && t < 47.3) marca(t, 1800, vis(t, 5.2, 47.3, .5) * .9);
  // grano muy leve: que no se vea plano de computadora
  ctx.save(); ctx.globalAlpha = .035; ctx.globalCompositeOperation = 'multiply';
  const ox = -Math.floor(rnd(t * 30) * 256), oy = -Math.floor(rnd(t * 30 + 9) * 256);
  for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) ctx.drawImage(grano, x, y);
  ctx.restore();
  const n = 1 - inv(t, 0, .3) + inv(t, 54.4, 55);
  if (n > 0){ ctx.fillStyle = `rgba(244,240,233,${clamp(n, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
}

window.__listo = false; window.__dur = DUR; window.__fps = FPS;
window.pintar = t => dibujar(t);
(async () => {
  const c = document.getElementById('lienzo');
  c.width = W; c.height = H; ctx = c.getContext('2d');
  logo = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = 'logo-mansion.png'; });
  grano = document.createElement('canvas'); grano.width = grano.height = 256;
  const gx = grano.getContext('2d'), d = gx.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4){ const v = 128 + rnd(i) * 127; d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255; }
  gx.putImageData(d, 0, 0);
  for (const f of ['400 100px "Bodoni Moda"', 'italic 400 100px "Bodoni Moda"', '600 100px "Bodoni Moda"', '400 40px "Jost"', '600 40px "Jost"'])
    await document.fonts.load(f);
  await document.fonts.ready;
  await dibujar(0);
  window.__listo = true;
})();
