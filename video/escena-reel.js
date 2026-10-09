/* ═══════════════════════════════════════════════════════════════
   INVITACIONES DIGITALES · reel 1920x1080, 60 fps, 15,000 s

   TODO CAE EN LA REJILLA DE LA MÚSICA. 128 BPM, compás 1,875 s, ocho
   compases. Los cortes están en C1..C8 y los golpes en negras: un corte
   fuera de tiempo se nota aunque el que mira no sepa por qué.

     C1  0,000  anticipación — el título se arma letra por letra
     C2  1,875  GOLPE — el título entra de una y suben los tres modelos
     C3  3,750  los tres, cada uno con su nombre
     C4  5,625  uno toma el centro, los otros se van de foco
     C5  7,500  PICO — la cuenta regresiva
     C6  9,375  la confirmación: "Sí, voy" y el gracias
     C7 11,250  los tres en perspectiva
     C8 13,125  cierre

   Las tres portadas son las de la galería de la página, con la paleta
   de cada fiesta. Las pantallas de adentro son capturas de pia/nueva.
   dibujar(t) es pura: el mismo t da siempre el mismo cuadro.
   ═══════════════════════════════════════════════════════════════ */
const W = 1920, H = 1080, DUR = 15.0;
const NEGRA = 60 / 128, COMPAS = NEGRA * 4;        // 0,46875 · 1,875
const C = n => n * COMPAS;                          // principio del compás n

const ORO = '#D9AE72', CHAMPAN = '#F3D9A6', CREMA = '#EDE6D8', MUTE = '#B3A896';
const NEGRO = '#080706';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const sale = x => 1 - Math.pow(1 - x, 3);
const sale5 = x => 1 - Math.pow(1 - x, 5);
const entra = x => x * x * x;
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const pulso = (t, a, b) => { const x = inv(t, a, b); return Math.sin(x * Math.PI); };
/* rebote: pasa de largo y vuelve. Es lo que separa "aparece" de "entra". */
const rebote = x => { const c = 1.70158 + 1; return 1 + c * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); };
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let ctx; const IMG = {};
const PALETA = {
  key:      { fondo: '#101A14', luz: '#9FC6AC', nombre: 'Key',     tipo: 'Bosque encantado' },
  xiomara:  { fondo: '#F7E3EA', luz: '#B9738D', nombre: 'Xiomara', tipo: 'Rosa y blanco' },
  pia:      { fondo: '#241C14', luz: '#C9A063', nombre: 'Pia',     tipo: 'Clásica' },
};
const MODELOS = ['key', 'xiomara', 'pia'];

/* ── tipografía ── */
function medirEsp(s, esp) {
  let a = 0; for (const c of [...s]) a += ctx.measureText(c).width + esp;
  return a - esp;
}
function texto(s, x, y, o = {}) {
  const { tam = 60, fam = 'Jost', peso = 300, color = CREMA, alfa = 1,
          esp = 0, cursiva = false, centro = true } = o;
  if (alfa <= .002) return;
  ctx.save(); ctx.globalAlpha = clamp(alfa, 0, 1); ctx.fillStyle = color;
  ctx.font = `${cursiva ? 'italic ' : ''}${peso} ${tam}px "${fam}"`;
  ctx.textBaseline = 'alphabetic';
  if (esp) {
    ctx.textAlign = 'left';
    let px = centro ? x - medirEsp(s, esp) / 2 : x;
    for (const c of [...s]) { ctx.fillText(c, px, y); px += ctx.measureText(c).width + esp; }
  } else { ctx.textAlign = centro ? 'center' : 'left'; ctx.fillText(s, x, y); }
  ctx.restore();
}

/* Tipografía cinética: cada letra entra por su cuenta, con retardo.
   Es lo que hace que un título se sienta armado y no pegado. */
function textoLetras(s, x, y, p, o = {}) {
  const { tam = 60, fam = 'Bodoni Moda', peso = 400, color = CHAMPAN,
          esp = 0, escalonado = .045, desde = 46, cursiva = false } = o;
  ctx.save();
  ctx.font = `${cursiva ? 'italic ' : ''}${peso} ${tam}px "${fam}"`;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const letras = [...s];
  let px = x - medirEsp(s, esp) / 2;
  for (let i = 0; i < letras.length; i++) {
    const c = letras[i];
    const w = ctx.measureText(c).width;
    if (c !== ' ') {
      const q = clamp((p - i * escalonado) / (1 - (letras.length - 1) * escalonado), 0, 1);
      if (q > 0) {
        const e = sale5(q);
        ctx.save();
        ctx.globalAlpha = Math.min(1, q * 2.2);
        ctx.fillStyle = color;
        ctx.translate(px + w / 2, y + (1 - e) * desde);
        ctx.scale(.92 + .08 * e, .92 + .08 * e);
        ctx.fillText(c, -w / 2, 0);
        ctx.restore();
      }
    }
    px += w + esp;
  }
  ctx.restore();
}

/* ── capas ── */
const fondo = col => { ctx.fillStyle = col || NEGRO; ctx.fillRect(0, 0, W, H); };

function grano(t, f = .04) {
  const s = Math.floor(t * 60);
  ctx.save(); ctx.globalAlpha = f;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rnd(i * 7 + s) > .5 ? '#FFF' : '#000';
    ctx.fillRect(rnd(i + s * 7919) * W, rnd(i * 3.3 + s * 104729) * H, 2, 2);
  }
  ctx.restore();
}
function vineta(f = .55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .28, W / 2, H / 2, W * .72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* Un barrido de luz: el brillo que cruza en los golpes. */
function barrido(p, ancho = 420, alfa = .22) {
  if (p <= 0 || p >= 1) return;
  const x = -ancho + p * (W + ancho * 2);
  const g = ctx.createLinearGradient(x, 0, x + ancho, H);
  g.addColorStop(0, 'rgba(243,217,166,0)');
  g.addColorStop(.5, `rgba(243,217,166,${alfa})`);
  g.addColorStop(1, 'rgba(243,217,166,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* Polvo dorado flotando: le saca el aspecto de plantilla al negro. */
function polvo(t, n = 70, alfa = .5) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const vx = (rnd(i) - .5) * 14, vy = -8 - rnd(i * 3) * 22;
    const x = (rnd(i * 5) * W + vx * t * 10 + W) % W;
    const y = (rnd(i * 7) * H + vy * t * 10 + H * 2) % H;
    const r = .8 + rnd(i * 11) * 2.4;
    ctx.globalAlpha = alfa * (.15 + rnd(i * 13) * .5);
    ctx.fillStyle = rnd(i * 17) > .35 ? ORO : CHAMPAN;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* ── el teléfono ──
   Las portadas vienen ya con su marco dibujado por la galería, así que
   acá no se le agrega otro: se dibuja la imagen con su sombra. */
function aparato(img, cx, cy, alto, { alfa = 1, giro = 0, desenfoque = 0, brilloCol = null } = {}) {
  if (!img || alfa <= .003) return;
  const esc = alto / img.naturalHeight;
  const w = img.naturalWidth * esc, h = alto;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro);
  if (desenfoque > .2) ctx.filter = `blur(${desenfoque}px)`;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 34;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  ctx.filter = 'none';
  if (brilloCol) {                       // halo del color de esa fiesta
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(alfa, 0, 1) * .16;
    const g = ctx.createRadialGradient(0, 0, h * .18, 0, 0, h * .78);
    g.addColorStop(0, brilloCol); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-w, -h, w * 2, h * 2);
  }
  ctx.restore();
}

/* La pantalla sola, sin marco: para las capturas de adentro. */
function lamina(img, cx, cy, alto, { alfa = 1, giro = 0, recorte = 1, desenfoque = 0 } = {}) {
  if (!img || alfa <= .003) return;
  const esc = alto / img.naturalHeight;
  const w = img.naturalWidth * esc, h = alto;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro);
  if (desenfoque > .2) ctx.filter = `blur(${desenfoque}px)`;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h * recorte, 26); ctx.clip();
  ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1) * .5; ctx.translate(cx, cy); ctx.rotate(giro);
  ctx.strokeStyle = 'rgba(217,174,114,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h * recorte, 26); ctx.stroke();
  ctx.restore();
}

/* Marco de encuadre: dos ángulos que respiran. Puro oficio de reel. */
function escuadras(p, margen = 76, largo = 120, alfa = .8) {
  if (p <= 0) return;
  const L = largo * sale(p);
  ctx.save(); ctx.globalAlpha = alfa * Math.min(1, p * 2);
  ctx.strokeStyle = ORO; ctx.lineWidth = 3;
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = sx > 0 ? margen : W - margen, y = sy > 0 ? margen : H - margen;
    ctx.beginPath();
    ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
  }
  ctx.restore();
}

/* ══════════ C1 · 0,000 — anticipación ══════════ */
function actoUno(t) {
  const p = inv(t, .05, .95);
  /* una línea que se abre desde el centro */
  ctx.save();
  ctx.globalAlpha = Math.min(1, p * 3);
  const g = ctx.createLinearGradient(W / 2 - 600 * p, 0, W / 2 + 600 * p, 0);
  g.addColorStop(0, 'rgba(217,174,114,0)');
  g.addColorStop(.5, CHAMPAN); g.addColorStop(1, 'rgba(217,174,114,0)');
  ctx.fillStyle = g;
  ctx.fillRect(W / 2 - 600 * p, H / 2 - 1, 1200 * p, 2);
  ctx.restore();

  texto('CLICK ETERNO', W / 2, H / 2 - 62,
    { tam: 26, esp: 15, color: ORO, alfa: inv(t, .35, 1.0), peso: 400 });
  /* el subtítulo se arma letra por letra y llega justo al golpe */
  textoLetras('INVITACIONES DIGITALES', W / 2, H / 2 + 110,
    inv(t, .55, COMPAS), { tam: 54, fam: 'Jost', peso: 300, esp: 16,
      color: MUTE, escalonado: .022, desde: 20 });
  escuadras(inv(t, .75, 1.5), 76, 120, .35);
  polvo(t, 50, .35);
}

/* ══════════ C2 · 1,875 — el golpe y la entrada ══════════ */
function actoDos(t) {
  const u = t - C(1);
  /* Corto y seco. La primera versión duraba 0,34 s con alfa 0,5 y a
     mitad del golpe la pantalla era un rectángulo crema: el título,
     que es lo único que hay que leer ahí, no se veía. */
  const g = pulso(u, 0, .13);
  if (g > .01) { ctx.fillStyle = `rgba(255,248,232,${g * .34})`; ctx.fillRect(0, 0, W, H); }
  barrido(inv(u, .02, .5), 520, .16);
  escuadras(1, 76, 120, .3);

  /* El título entra DESDE ADELANTE: escala de 1,25 a 1 con rebote. Las
     letras llegan juntas porque esto es el golpe, no el armado. */
  const e = inv(u, 0, .42), s = 1.22 - .22 * sale5(e);
  ctx.save();
  ctx.translate(W / 2, H / 2 - 20); ctx.scale(s, s);
  /* aberración cromática en el golpe: se separa y vuelve */
  const ab = (1 - inv(u, 0, .3)) * 9;
  ctx.globalCompositeOperation = 'lighter';
  for (const [dx, col] of [[-ab, '#C98A6A'], [ab, '#6A9AC9']]) {
    if (ab < .4) break;
    ctx.globalAlpha = .5;
    ctx.font = `400 128px "Bodoni Moda"`; ctx.textAlign = 'center';
    ctx.fillStyle = col; ctx.fillText('Invitaciones', dx, 0);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = Math.min(1, e * 3);
  texto('Invitaciones', 0, 0, { tam: 128, fam: 'Bodoni Moda', color: CHAMPAN, peso: 400 });
  texto('digitales', 0, 118, { tam: 128, fam: 'Bodoni Moda', cursiva: true, color: ORO, peso: 400,
    alfa: inv(u, .14, .5) });
  ctx.restore();

  texto('Una web propia para tu fiesta', W / 2, H - 170,
    { tam: 36, esp: 7, color: MUTE, alfa: inv(u, .7, 1.1) });

  /* los tres asoman desde abajo, en corcheas */
  MODELOS.forEach((m, i) => {
    const q = inv(u, 1.08 + i * (NEGRA / 2), 1.08 + i * (NEGRA / 2) + .5);
    if (q <= 0) return;
    const x = W / 2 + (i - 1) * 420;
    aparato(IMG[m], x, H + 330 - rebote(q) * 420, 760,
      { alfa: q, giro: (i - 1) * .03, brilloCol: PALETA[m].luz });
  });
  polvo(t, 60, .4);
}

/* ══════════ C3 · 3,750 — los tres, con su nombre ══════════ */
function actoTres(t) {
  const u = t - C(2);
  polvo(t, 60, .45);
  escuadras(1, 76, 120, .22);
  texto('TRES FIESTAS, TRES DISEÑOS', W / 2, 120,
    { tam: 26, esp: 14, color: ORO, alfa: inv(u, 0, .4), peso: 400 });

  MODELOS.forEach((m, i) => {
    const x = W / 2 + (i - 1) * 420;
    const flota = Math.sin((t + i * 1.3) * 1.5) * 7;
    aparato(IMG[m], x, H / 2 - 20 + flota, 760,
      { giro: (i - 1) * .03, brilloCol: PALETA[m].luz });
    /* el nombre de cada una entra en su negra */
    const q = inv(u, NEGRA * (1 + i), NEGRA * (1 + i) + .34);
    if (q <= 0) return;
    const y = H / 2 + 430 + (1 - sale(q)) * 22;
    texto(PALETA[m].nombre, x, y,
      { tam: 46, fam: 'Bodoni Moda', color: CHAMPAN, alfa: q, cursiva: true });
    texto(PALETA[m].tipo.toUpperCase(), x, y + 36,
      { tam: 19, esp: 6, color: MUTE, alfa: q * .9 });
  });
}

/* ══════════ C4 · 5,625 — uno toma el centro ══════════ */
function actoCuatro(t) {
  const u = t - C(3);
  const p = sale(inv(u, 0, .62));
  polvo(t, 50, .4);

  MODELOS.forEach((m, i) => {
    const esCentro = m === 'xiomara';
    const x0 = W / 2 + (i - 1) * 420;
    const x = esCentro ? x0 : x0 + (i - 1) * 300 * p;
    const alto = esCentro ? 760 + 220 * p : 760 - 150 * p;
    aparato(IMG[m], x, H / 2 - 20 + Math.sin((t + i * 1.3) * 1.5) * 6, alto, {
      alfa: esCentro ? 1 : 1 - .28 * p,
      giro: (i - 1) * .03,
      desenfoque: esCentro ? 0 : 9 * p,
      brilloCol: PALETA[m].luz,
    });
  });

  /* tres cosas que trae, cada una en su negra */
  const trae = ['Sobre animado', 'Cuenta regresiva', 'Confirmación online'];
  trae.forEach((s, i) => {
    const q = inv(u, NEGRA * (1 + i), NEGRA * (1 + i) + .3);
    if (q <= 0) return;
    const y = 300 + i * 118;
    const x = 210 + (1 - sale(q)) * -34;
    ctx.save(); ctx.globalAlpha = q;
    ctx.strokeStyle = ORO; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 56, y - 12); ctx.lineTo(x - 22, y - 12); ctx.stroke();
    ctx.restore();
    texto(s, x, y, { tam: 42, color: CREMA, alfa: q, centro: false });
  });
  texto('a medida de tu fiesta', 210, 300 + 2 * 118 + 86,
    { tam: 30, cursiva: true, fam: 'Bodoni Moda', color: ORO,
      alfa: inv(u, NEGRA * 3.2, NEGRA * 3.8), centro: false });
}

/* ══════════ C5 · 7,500 — la cuenta regresiva ══════════ */
function actoCinco(t) {
  const u = t - C(4);
  polvo(t, 40, .3);
  const e = inv(u, 0, .4);
  lamina(IMG.cuenta, W / 2 - 430, H / 2, 880,
    { alfa: e, giro: -.04, desenfoque: (1 - e) * 9 });

  textoLetras('Cuenta los días', 1180, 400, inv(u, .18, .95),
    { tam: 82, fam: 'Bodoni Moda', color: CHAMPAN, escalonado: .03, desde: 34, centro: false });
  ctx.save(); ctx.textAlign = 'left'; ctx.restore();
  texto('que faltan.', 1180, 496,
    { tam: 82, fam: 'Bodoni Moda', cursiva: true, color: ORO,
      alfa: inv(u, .5, 1.0), centro: false });
  texto('Corriendo en vivo, cada vez que la abren.', 1180, 580,
    { tam: 30, color: MUTE, alfa: inv(u, .9, 1.4), centro: false });

  /* los dígitos saltan en cada negra: es lo que hace que se lea "corre" */
  for (let k = 0; k < 4; k++) {
    const q = pulso(u, NEGRA * k, NEGRA * k + .22);
    if (q < .02) continue;
    ctx.save();
    ctx.globalAlpha = q * .5; ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = ORO;
    const x = W / 2 - 430 - 252 + k * 168;
    ctx.beginPath(); ctx.roundRect(x, H / 2 - 78, 150, 150, 12); ctx.fill();
    ctx.restore();
  }
}

/* ══════════ C6 · 9,375 — la confirmación ══════════ */
function actoSeis(t) {
  const u = t - C(5);
  polvo(t, 40, .3);
  const corte = NEGRA * 2;                 // el cambio cae en la tercera negra
  const antes = u < corte;
  const img = antes ? IMG.rsvp : IMG.gracias;
  const golpe = pulso(u, corte - .06, corte + .26);
  lamina(img, W / 2 + 430, H / 2, 880 + golpe * 26,
    { alfa: inv(u, 0, .3), giro: .04 });

  if (golpe > .01) { ctx.fillStyle = `rgba(243,217,166,${golpe * .3})`; ctx.fillRect(0, 0, W, H); }

  textoLetras('Confirman', 740, 400, inv(u, .1, .8),
    { tam: 86, fam: 'Bodoni Moda', color: CHAMPAN, escalonado: .035, desde: 34, centro: false });
  texto('desde el celular.', 740, 500,
    { tam: 86, fam: 'Bodoni Moda', cursiva: true, color: ORO,
      alfa: inv(u, .42, .9), centro: false });

  const linea = antes
    ? 'Cuántos vienen · si comen sin TACC · un mensaje'
    : 'Y la lista se arma sola.';
  texto(linea, 740, 590, { tam: 32, color: antes ? MUTE : CHAMPAN,
    alfa: antes ? inv(u, .8, 1.2) : inv(u, corte + .1, corte + .5), centro: false });

  /* el anillo sobre "Sí, voy". La caja se midió del DOM de la
     invitación de verdad (video/img-muro/.. y video/img/cajas.json). */
  if (antes) {
    const q = inv(u, .55, 1.0);
    if (q > 0) {
      const alto = 880, esc = alto / 1428, ancho = 660 * esc;
      const cx = W / 2 + 430 + (.274 - .5) * ancho;
      const cy = H / 2 + (.646 - .5) * alto;
      const e = sale(q), ww = .427 * ancho * (1.3 - .3 * e), hh = .056 * alto * (1.9 - .5 * e);
      ctx.save();
      ctx.globalAlpha = Math.min(1, q * 1.8) * (.6 + .4 * Math.sin(u * 15));
      ctx.strokeStyle = ORO; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(cx - ww / 2, cy - hh / 2, ww, hh, 10); ctx.stroke();
      ctx.restore();
    }
  }
}

/* ══════════ C7 · 11,250 — los tres en perspectiva ══════════ */
function actoSiete(t) {
  const u = t - C(6);
  polvo(t, 70, .5);
  const p = sale(inv(u, 0, .75));
  MODELOS.forEach((m, i) => {
    const x = W / 2 + (i - 1) * (260 + 190 * p);
    const y = H / 2 + (i - 1) * 46 + 96;
    const alto = 620 - Math.abs(i - 1) * 80;
    aparato(IMG[m], x, y, alto, {
      alfa: inv(u, i * .07, .4 + i * .07),
      giro: (i - 1) * .13 * p,
      desenfoque: Math.abs(i - 1) * 2.4 * p,
      brilloCol: PALETA[m].luz,
    });
  });
  texto('Diseñada para tu fiesta.', W / 2, 148,
    { tam: 62, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .35, .85) });
  texto('No elegida de una lista.', W / 2, 212,
    { tam: 40, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, .62, 1.1) });
  barrido(inv(u, NEGRA * 3, NEGRA * 3 + .5), 500, .2);
}

/* ══════════ C8 · 13,125 — cierre ══════════ */
function actoOcho(t) {
  const u = t - C(7);
  polvo(t, 60, .45);
  /* los tres se van hacia atrás y quedan de fondo, fuera de foco */
  const p = sale(inv(u, 0, .7));
  MODELOS.forEach((m, i) => {
    aparato(IMG[m], W / 2 + (i - 1) * (450 - 90 * p), H / 2 + 40,
      700 - 180 * p, { alfa: (1 - p) * .55 + .1, giro: (i - 1) * .13 * (1 - p),
        desenfoque: 4 + 16 * p, brilloCol: PALETA[m].luz });
  });
  ctx.save(); ctx.fillStyle = `rgba(8,7,6,${.55 * p})`; ctx.fillRect(0, 0, W, H); ctx.restore();

  const e = inv(u, .18, .72);
  textoLetras('CLICK ETERNO', W / 2, H / 2 - 10, e,
    { tam: 112, fam: 'Bodoni Moda', color: CHAMPAN, esp: 20, escalonado: .03, desde: 26 });
  const l = inv(u, .55, .95);
  ctx.save(); ctx.globalAlpha = l; ctx.strokeStyle = ORO; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 230 * l, H / 2 + 52); ctx.lineTo(W / 2 + 230 * l, H / 2 + 52);
  ctx.stroke(); ctx.restore();
  texto('clicketerno.com.ar', W / 2, H / 2 + 128,
    { tam: 44, fam: 'Bodoni Moda', color: ORO, alfa: inv(u, .75, 1.15) });
  texto('341 250-6451  ·  ROSARIO', W / 2, H / 2 + 186,
    { tam: 24, esp: 7, color: MUTE, alfa: inv(u, .9, 1.3) });
  escuadras(inv(u, .3, .9), 76, 120, .3);
}

/* ══════════ el cuadro ══════════ */
function dibujar(t) {
  fondo();
  if (t < C(1)) actoUno(t);
  else if (t < C(2)) actoDos(t);
  else if (t < C(3)) actoTres(t);
  else if (t < C(4)) actoCuatro(t);
  else if (t < C(5)) actoCinco(t);
  else if (t < C(6)) actoSeis(t);
  else if (t < C(7)) actoSiete(t);
  else actoOcho(t);
  vineta(.5);
  grano(t);
  /* Golpe de blanco en cada cambio de compás, muy corto: es lo que hace
     que el corte se sienta parte de la música y no un salto. */
  for (let n = 2; n <= 7; n++) {
    const f = pulso(t, C(n) - .02, C(n) + .1);
    if (f > .02) { ctx.fillStyle = `rgba(255,248,232,${f * .13})`; ctx.fillRect(0, 0, W, H); }
  }
  const n = Math.min(inv(t, 0, .3), 1 - inv(t, DUR - .45, DUR));
  if (n < 1) { ctx.fillStyle = `rgba(8,7,6,${1 - n})`; ctx.fillRect(0, 0, W, H); }
}

window.__listo = false; window.__dur = DUR; window.__fps = 60;
window.pintar = t => dibujar(t);
(async () => {
  const c = document.getElementById('lienzo');
  c.width = W; c.height = H; ctx = c.getContext('2d');
  const archivos = { key: 'img-reel/key.png', xiomara: 'img-reel/xiomara.png',
    pia: 'img-reel/pia.png', cuenta: 'img-reel/cuenta.jpg',
    rsvp: 'img-reel/rsvp.jpg', gracias: 'img-reel/gracias.jpg' };
  await Promise.all(Object.entries(archivos).map(([k, src]) => new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => { IMG[k] = i; ok(); };
    i.onerror = () => no(new Error('no cargó ' + src));
    i.src = src;
  })));
  await document.fonts.load('400 128px "Bodoni Moda"');
  await document.fonts.load('italic 400 86px "Bodoni Moda"');
  await document.fonts.load('300 54px "Jost"');
  await document.fonts.ready;
  dibujar(0);
  window.__listo = true;
})();
