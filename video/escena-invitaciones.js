/* ═══════════════════════════════════════════════════════════════
   INVITACIONES DIGITALES · pieza vertical para redes
   El centro es LA CONFIRMACIÓN: el invitado contesta desde el
   celular y el organizador ve quién viene. Eso es lo que distingue
   una invitación de una imagen de WhatsApp.

   Las pantallas de adentro del teléfono son CAPTURAS DE VERDAD de
   pia/nueva/, la invitación que está en el repo. La única parte
   dibujada es la lista del organizador, y se dibuja con tipografía
   —no como una captura falsa— a propósito: mostrar una pantalla
   que no existe como si existiera es mentirle al cliente.

   dibujar(t) es pura: el mismo t da siempre el mismo cuadro.
   ═══════════════════════════════════════════════════════════════ */
const W = 1080, H = 1920, DUR = 24;

const ORO = '#D9AE72', CHAMPAN = '#F3D9A6';
const NEGRO = '#0A0806', CREMA = '#EDE6D8', MUTE = '#B3A896';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const sale = x => 1 - Math.pow(1 - x, 3);
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
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

/* ── el teléfono con una captura adentro ──
   Las capturas son 660x1428, que es 390x844 por 1,69: el mismo alto
   relativo de un iPhone. El marco se dibuja alrededor, no encima. */
const TW = 660, TH = 1428, BORDE = 16, R = 56;
function telefono(cx, cy, img, { escala = 1, alfa = 1, desliz = 0, giro = 0 } = {}) {
  if (alfa <= .002 || !img) return;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(escala, escala);
  /* sombra del aparato: lo despega del fondo negro */
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#17130F';
  ctx.beginPath();
  ctx.roundRect(-TW / 2 - BORDE, -TH / 2 - BORDE, TW + BORDE * 2, TH + BORDE * 2, R + 8);
  ctx.fill();
  ctx.restore();
  /* la pantalla, recortada */
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-TW / 2, -TH / 2, TW, TH, R); ctx.clip();
  ctx.drawImage(img, -TW / 2, -TH / 2 - desliz, TW, TH);
  ctx.restore();
  /* el filo claro del borde */
  ctx.strokeStyle = 'rgba(217,174,114,.30)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-TW / 2 - BORDE + 1, -TH / 2 - BORDE + 1, TW + BORDE * 2 - 2, TH + BORDE * 2 - 2, R + 7);
  ctx.stroke();
  ctx.restore();
}

/* Dónde cae, en la pantalla del video, un punto que en la captura está
   a la fracción (fx, fy). Sin esto los anillos se ponen a ojo y señalan
   cualquier cosa: la primera versión apuntaba al desplegable de
   "cuántas personas" en vez de al botón "Sí, voy". Las fracciones se
   sacaron del DOM de la invitación de verdad con getBoundingClientRect,
   no mirando la imagen. */
const enPantalla = (cx, cy, escala, fx, fy) => ({
  x: cx + (fx - .5) * TW * escala,
  y: cy + (fy - .5) * TH * escala,
});
/* Las cajas las mide capturar.js del DOM de la invitacion y las inyecta
   montar.py. Si falta el archivo se usan estos valores, que son los que
   se midieron el dia que se armo la pieza. */
const CAJA = (n, porDefecto) => (window.__CAJAS && window.__CAJAS[n]) || porDefecto;

/* Un anillo dorado que señala algo adentro de la pantalla: es lo que
   hace que se entienda QUÉ hay que mirar en una captura llena de cosas. */
function senalar(cx, cy, w, h, p, { etiqueta = '' } = {}) {
  if (p <= 0) return;
  const e = sale(clamp(p, 0, 1));
  ctx.save();
  ctx.globalAlpha = Math.min(1, p * 1.6);
  ctx.strokeStyle = ORO; ctx.lineWidth = 5;
  const ww = w * (1.25 - .25 * e), hh = h * (1.25 - .25 * e);
  ctx.beginPath(); ctx.roundRect(cx - ww / 2, cy - hh / 2, ww, hh, 14); ctx.stroke();
  /* halo que late, para que no sea un recuadro muerto */
  ctx.globalAlpha = .28 * (0.5 + 0.5 * Math.sin(p * 9));
  ctx.lineWidth = 16; ctx.stroke();
  ctx.restore();
  if (etiqueta) texto(etiqueta, cx, cy - hh / 2 - 34,
    { tam: 34, esp: 7, color: ORO, alfa: Math.min(1, p * 2), peso: 400 });
}

/* ══════════ 1 · llega el link ══════════ */
function actoLink(t) {
  const a = inv(t, .3, 1.3);
  texto('INVITACIONES DIGITALES', W / 2, 300,
    { tam: 29, esp: 13, color: ORO, alfa: a, peso: 400 });

  /* la burbuja del mensaje: así es como la recibe el invitado */
  const b = inv(t, .7, 1.6), sb = sale(b);
  ctx.save();
  ctx.globalAlpha = b;
  ctx.translate(W / 2, 560 + (1 - sb) * 50);
  const bw = 760, bh = 190;
  ctx.fillStyle = '#1A1612';
  ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 26); ctx.fill();
  ctx.strokeStyle = 'rgba(217,174,114,.28)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 26); ctx.stroke();
  ctx.restore();
  texto('Estás invitada a mis 15 🤍', W / 2, 540, { tam: 40, color: CREMA, alfa: b });
  texto('clicketerno.com.ar/pia', W / 2, 600, { tam: 34, color: ORO, alfa: inv(t, 1.1, 1.9) });

  texto('Un link por WhatsApp.', W / 2, 840,
    { tam: 70, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(t, 1.5, 2.3) });
  texto('Nada que imprimir. Nada que instalar.', W / 2, 920,
    { tam: 38, color: MUTE, alfa: inv(t, 1.9, 2.7) });

  /* el sobre cerrado, asomando desde abajo */
  const c = inv(t, 1.8, 3.0);
  if (c > 0) telefono(W / 2, 1560 + (1 - sale(c)) * 400, IMG.sobre, { escala: .72, alfa: c });
}

/* ══════════ 2 · se abre ══════════ */
function actoAbre(t) {
  const u = t - 3.2;                                    // 0 … 3.3
  /* el sobre se va y entra la portada, con un destello en el cruce */
  const corte = .95;
  const saleSobre = 1 - inv(u, corte - .25, corte + .1);
  const entraPortada = inv(u, corte, corte + .5);
  if (saleSobre > 0)
    telefono(W / 2, 1050, IMG.sobre, { escala: .78, alfa: saleSobre, escala2: 1 });
  if (entraPortada > 0)
    telefono(W / 2, 1050, IMG.portada, { escala: .74 + .04 * sale(entraPortada), alfa: entraPortada });

  const f = pulso(u, corte - .12, corte + .22);
  if (f > .01) { ctx.fillStyle = `rgba(255,248,232,${f * .38})`; ctx.fillRect(0, 0, W, H); }

  texto('Se abre como un sobre.', W / 2, 250,
    { tam: 76, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, 1.2, 2.0) });
  texto('Con su foto, su música y su fecha.', W / 2, 330,
    { tam: 38, color: MUTE, alfa: inv(u, 1.7, 2.5) });
}

/* ══════════ 3 · la cuenta regresiva ══════════ */
function actoCuenta(t) {
  const u = t - 6.5;                                    // 0 … 3.0
  const ESC_C = .74, CY_C = 1090;
  telefono(W / 2, CY_C, IMG.cuenta, { escala: ESC_C, alfa: inv(u, 0, .45) });
  {
    const k = CAJA('reloj', { fx: .5, fy: .5, fw: .88, fh: .097 });
    const q = enPantalla(W / 2, CY_C, ESC_C, k.fx, k.fy);
    senalar(q.x, q.y, k.fw * TW * ESC_C, k.fh * TH * ESC_C, inv(u, .6, 1.3));
  }
  texto('Los días que faltan,', W / 2, 250,
    { tam: 72, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .25, 1.0) });
  texto('corriendo en vivo.', W / 2, 335,
    { tam: 72, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, .6, 1.4) });
  texto('Cada vez que la abren, falta menos.', W / 2, 1880,
    { tam: 36, color: MUTE, alfa: inv(u, 1.6, 2.4) });
}

/* ══════════ 4 · LA CONFIRMACIÓN ══════════ */
function actoConfirma(t) {
  const u = t - 9.5;                                    // 0 … 6.5
  /* el formulario, y después el gracias */
  const cambio = 3.9;
  const haceGracias = u >= cambio;
  const img = haceGracias ? IMG.gracias : IMG.rsvp;
  const ap = inv(u, 0, .45);
  const golpe = pulso(u, cambio - .1, cambio + .35);
  const ESC_R = .74 + golpe * .025, CY_R = 1120;
  telefono(W / 2, CY_R, img, { escala: ESC_R, alfa: ap });

  if (!haceGracias) {
    /* El corazón del asunto: "¿VAS A VENIR? · SÍ, VOY". Las fracciones
       salen del getBoundingClientRect del botón de verdad. */
    const k = CAJA('siVoy', { fx: .274, fy: .646, fw: .427, fh: .056 });
    const q = enPantalla(W / 2, CY_R, ESC_R, k.fx, k.fy);
    senalar(q.x, q.y, k.fw * TW * ESC_R * 1.18, k.fh * TH * ESC_R * 1.6,
      inv(u, 1.9, 2.9));   // sin etiqueta: se montaba con el campo de abajo
  } else {
    /* PULSO, no escalón: con inv() el destello se quedaba prendido al
       50% para siempre y el "gracias" salía lavado todo el acto. Es el
       mismo error que el flash del obturador en el video del rollo. */
    const g = pulso(u, cambio, cambio + .55);
    ctx.save(); ctx.globalAlpha = g * .42;
    ctx.fillStyle = CHAMPAN; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  texto('Y confirman ahí mismo.', W / 2, 250,
    { tam: 78, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .3, 1.1) });
  texto('Cuántos vienen · si comen sin TACC · un mensaje', W / 2, 330,
    { tam: 34, color: MUTE, alfa: inv(u, 1.0, 1.8) });

  texto('Sin llamar a nadie. Sin contar a mano.', W / 2, 1870,
    { tam: 38, color: MUTE, alfa: inv(u, 2.4, 3.2) * (1 - inv(u, cambio - .3, cambio)) });
  texto('Listo. Ya está anotada.', W / 2, 1870,
    { tam: 42, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, cambio + .4, cambio + 1.1) });
}

/* ══════════ 5 · lo que ve el organizador ══════════ */
function actoLista(t) {
  const u = t - 16.0;                                   // 0 … 4.2
  texto('Y VOS VES', W / 2, 270, { tam: 29, esp: 13, color: ORO, alfa: inv(u, 0, .6), peso: 400 });
  texto('quién viene.', W / 2, 400,
    { tam: 92, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .2, 1.0) });

  /* La lista va DIBUJADA, no como captura: el panel existe, pero
     fabricar una pantalla falsa y pasarla por real es otra cosa. */
  const gente = [
    ['Camila Giménez', '1', true], ['Familia Ferreyra', '4', true],
    ['Martín y Sol', '2', true], ['Abuela Nelly', '1', true],
    ['Los primos', '6', true], ['Tía Graciela', '2', false],
  ];
  const x0 = 130, w = W - 260, alto = 112, y0 = 620;
  for (let i = 0; i < gente.length; i++) {
    const [nom, cuantos, vino] = gente[i];
    const p = inv(u, .7 + i * .17, 1.25 + i * .17);
    if (p <= 0) continue;
    const y = y0 + i * (alto + 14), e = sale(p);
    ctx.save(); ctx.globalAlpha = p;
    ctx.translate((1 - e) * 46, 0);
    ctx.fillStyle = '#15120E';
    ctx.beginPath(); ctx.roundRect(x0, y, w, alto, 12); ctx.fill();
    ctx.strokeStyle = vino ? 'rgba(217,174,114,.34)' : 'rgba(179,168,150,.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x0, y, w, alto, 12); ctx.stroke();
    /* tilde o guión: el estado se ve en la FORMA, no solo en el texto */
    ctx.strokeStyle = vino ? ORO : '#5A5248'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const cx = x0 + 62, cy = y + alto / 2;
    ctx.beginPath();
    if (vino) { ctx.moveTo(cx - 15, cy + 1); ctx.lineTo(cx - 4, cy + 12); ctx.lineTo(cx + 16, cy - 13); }
    else { ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); }
    ctx.stroke();
    ctx.globalAlpha = p * (vino ? 1 : .55);
    ctx.textAlign = 'left'; ctx.fillStyle = CREMA;
    ctx.font = '300 40px "Jost"'; ctx.fillText(nom, x0 + 112, cy + 14);
    ctx.textAlign = 'right'; ctx.fillStyle = vino ? ORO : '#5A5248';
    ctx.font = '400 38px "Jost"'; ctx.fillText(cuantos, x0 + w - 42, cy + 14);
    ctx.restore();
  }

  const r = inv(u, 2.5, 3.3);
  texto('16 confirmados · 2 sin responder', W / 2, y0 + 6 * (alto + 14) + 96,
    { tam: 40, color: MUTE, alfa: r });
  texto('La lista se arma sola.', W / 2, 1840,
    { tam: 46, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, 3.0, 3.8) });
}

/* ══════════ 6 · cierre ══════════ */
function actoCierre(t) {
  const u = t - 20.2;                                   // 0 … 3.8
  /* tres pantallas en abanico: lo que se lleva el cliente */
  const fichas = [[IMG.playlist, -300, -.10], [IMG.dress, 300, .10], [IMG.portada, 0, 0]];
  for (let i = 0; i < 3; i++) {
    const [im, dx, gi] = fichas[i];
    const p = inv(u, .05 + i * .14, .75 + i * .14);
    if (p <= 0) continue;
    telefono(W / 2 + dx * sale(p), 880 + (i === 2 ? -30 : 24), im,
      { escala: .40, alfa: p * (i === 2 ? 1 : .92), giro: gi * sale(p) });
  }
  const a = inv(u, 1.3, 2.1);
  texto('CLICK', W / 2, 1420, { tam: 104, fam: 'Bodoni Moda', esp: 16, color: CHAMPAN, alfa: a });
  texto('ETERNO', W / 2, 1530, { tam: 104, fam: 'Bodoni Moda', esp: 16, color: CHAMPAN, alfa: inv(u, 1.45, 2.25) });
  const b = inv(u, 1.9, 2.5);
  ctx.save(); ctx.globalAlpha = b; ctx.strokeStyle = ORO; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 160 * b, 1590); ctx.lineTo(W / 2 + 160 * b, 1590); ctx.stroke();
  ctx.restore();
  texto('Invitación digital a medida de tu fiesta', W / 2, 1670,
    { tam: 38, color: MUTE, alfa: inv(u, 2.1, 2.8) });
  texto('clicketerno.com.ar', W / 2, 1790,
    { tam: 54, fam: 'Bodoni Moda', color: ORO, alfa: inv(u, 2.4, 3.1) });
  texto('341 250-6451', W / 2, 1860, { tam: 38, esp: 4, color: MUTE, alfa: inv(u, 2.6, 3.3) });
}

function dibujar(t) {
  fondo();
  if (t < 3.2) actoLink(t);
  else if (t < 6.5) actoAbre(t);
  else if (t < 9.5) actoCuenta(t);
  else if (t < 16.0) actoConfirma(t);
  else if (t < 20.2) actoLista(t);
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
  const nombres = ['sobre', 'portada', 'cuenta', 'playlist', 'rsvp', 'gracias', 'dress'];
  await Promise.all(nombres.map(n => new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => { IMG[n] = i; ok(); };
    i.onerror = () => no(new Error('no cargó img/' + n + '.jpg'));
    i.src = 'img/' + n + '.jpg';
  })));
  await document.fonts.load('400 92px "Bodoni Moda"');
  await document.fonts.load('italic 400 72px "Bodoni Moda"');
  await document.fonts.load('300 40px "Jost"');
  await document.fonts.ready;
  dibujar(0);
  window.__listo = true;
})();
