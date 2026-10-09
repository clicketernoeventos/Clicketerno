/* ═══════════════════════════════════════════════════════════════
   INVITACIONES DIGITALES · reel 1920x1080, 60 fps, 15,000 s

   LA PRIMERA VERSIÓN ERA UN PASE DE DIAPOSITIVAS. Medido sobre el MP4:
   la diferencia media entre cuadros consecutivos daba 0,26 sobre 255 —
   o sea, una imagen fija— y toda la energía estaba en siete saltos de
   16 a 53 en los cambios de compás. Cada acto era una composición
   quieta y entre acto y acto había un corte duro. Eso se ve trabado
   aunque cada cuadro suelto esté lindo.

   ESTA VERSIÓN TIENE UNA CÁMARA QUE NO SE DETIENE. Hay un solo mundo
   con todo puesto en una línea, y la cámara lo recorre de izquierda a
   derecha durante los quince segundos. Los compases ya no son cortes:
   son los lugares DONDE LLEGA la cámara. Lo único que corta de verdad
   son dos momentos, a propósito.

   Encima de eso, todo flota: cada aparato tiene su balanceo, el polvo
   va a otra velocidad que la cámara (paralaje) y la cámara misma lleva
   una deriva mínima que nunca se apaga. Entre cuadro y cuadro siempre
   pasa algo.

   El mundo, en el eje X:
        0   los tres modelos (Key -560 · Xiomara 0 · Pia 560)
     1950   la cuenta regresiva
     3150   la confirmación: el formulario y el gracias
     4350   el cierre

   La rejilla sigue siendo la música: 128 BPM, compás 1,875 s, ocho
   compases = 15,000 s exactos.
   ═══════════════════════════════════════════════════════════════ */
const W = 1920, H = 1080, DUR = 15.0;
const NEGRA = 60 / 128, COMPAS = NEGRA * 4;
const C = n => n * COMPAS;

const ORO = '#D9AE72', CHAMPAN = '#F3D9A6', CREMA = '#EDE6D8', MUTE = '#B3A896';
const NEGRO = '#070605';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const sale = x => 1 - Math.pow(1 - x, 3);
const sale5 = x => 1 - Math.pow(1 - x, 5);
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const pulso = (t, a, b) => { const x = inv(t, a, b); return Math.sin(x * Math.PI); };
const rebote = x => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let ctx; const IMG = {};
const MODELOS = [
  { k: 'key',     x: -520, luz: '#9FC6AC', nombre: 'Key',     tipo: 'Bosque encantado' },
  { k: 'xiomara', x: 0,    luz: '#E7A8BE', nombre: 'Xiomara', tipo: 'Rosa y blanco' },
  { k: 'pia',     x: 520,  luz: '#C9A063', nombre: 'Pia',     tipo: 'Clásica' },
];

/* ── la cámara ──
   Claves en los compases; entre clave y clave se interpola suave. La
   deriva de abajo es lo que hace que NUNCA haya dos cuadros iguales,
   ni cuando la cámara "está quieta". */
/* El Y de cada clave NO está puesto a ojo: sale de exigir que el borde
   de arriba del sujeto caiga por debajo de y=300 en pantalla, que es
   donde termina la banda de los títulos. Con
       arriba = H/2 + (-alto/2 - camY) * z
   despejar camY = -alto/2 + 240/z. La primera versión los tenía
   estimados y el título se montaba con los teléfonos en cuatro de los
   ocho planos. Que el plano cerrado recorte ABAJO está buscado: un
   primer plano que entra entero no es un primer plano. */
const CLAVES = [
  { t: 0.000,  x: 0,    y: -227, z: 1.95, r: 0.020 },  // arranca encima de Xiomara
  { t: 1.875,  x: 0,    y: -105, z: 0.98, r: 0.000 },  // C2 · se abre a los tres
  { t: 3.750,  x: -520, y: -165, z: 1.30, r: -0.014 }, // C3 · viaja hasta Key
  { t: 5.625,  x: 0,    y: -232, z: 1.26, r: 0.012 },  // C4 · entra en Xiomara
  { t: 7.500,  x: 1750, y: -141, z: 1.15, r: -0.010 },// C5 · la cuenta regresiva
  { t: 9.375,  x: 2900, y: -141, z: 1.15, r: 0.010 }, // C6 · la confirmación
  { t: 11.250, x: 1450, y: -10,  z: 0.42, r: -0.016 },// C7 · se va atrás y se ve TODO
  /* Sostener el plano abierto. Sin esta clave, a los 0,6 s la cámara ya
     iba camino al cierre y el plano que muestra TODO junto —que es el
     remate del aviso— no se llegaba a ver. */
  { t: 12.400, x: 1620, y: -10,  z: 0.445, r: -0.010 },
  { t: 13.125, x: 4100, y: -40,  z: 1.00, r: 0.000 }, // C8 · la marca
  { t: 15.000, x: 4100, y: -118, z: 1.26, r: 0.006 }, // el cierre empuja de verdad
];
/* Catmull-Rom, no interpolación suave.
   Con suave() la cámara llega a CADA clave con velocidad cero, o sea
   que se para ocho veces en quince segundos. Medido sobre el MP4: había
   cinco tramos quietos de hasta 45 cuadros, y caían exactamente en las
   claves. Catmull-Rom pasa POR los puntos sin frenar, que es lo que
   hace un dolly de verdad. Un poco de sobrepaso en las curvas no es un
   defecto: es lo que le da peso al movimiento. */
function catmull(p0, p1, p2, p3, s) {
  const s2 = s * s, s3 = s2 * s;
  return 0.5 * ((2 * p1) + (-p0 + p2) * s +
                (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 +
                (-p0 + 3 * p1 - 3 * p2 + p3) * s3);
}
function camara(t) {
  let i = 0;
  while (i < CLAVES.length - 2 && t >= CLAVES[i + 1].t) i++;
  const a = CLAVES[i], b = CLAVES[i + 1];
  /* fracción LINEAL dentro del tramo: la curva pone la suavidad, y si
     además se suaviza acá se vuelve a frenar en cada clave */
  const s = clamp((t - a.t) / (b.t - a.t), 0, 1);
  const p0 = CLAVES[Math.max(0, i - 1)], p3 = CLAVES[Math.min(CLAVES.length - 1, i + 2)];
  const ch = k => catmull(p0[k], a[k], b[k], p3[k], s);
  /* La deriva: tres senos de periodos primos entre sí, así nunca se
     repite el mismo encuadre. Es poca amplitud a propósito — se siente
     más de lo que se ve. */
  return {
    x: ch('x') + Math.sin(t * 0.43) * 26 + Math.sin(t * 1.27) * 7,
    y: ch('y') + Math.cos(t * 0.37) * 16 + Math.sin(t * 1.61) * 5,
    z: Math.max(0.25, ch('z')) * (1 + 0.012 * Math.sin(t * 0.29)),
    r: ch('r') + Math.sin(t * 0.51) * 0.004,
  };
}
/* Pone el lienzo en coordenadas del mundo. Todo lo que se dibuje
   después queda sujeto a la cámara. */
function conCamara(t, paralaje = 1) {
  const c = camara(t);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(c.r * paralaje);
  ctx.scale(c.z, c.z);
  ctx.translate(-c.x * paralaje, -c.y * paralaje);
  return c;
}

/* ── tipografía ── */
function medirEsp(s, esp) { let a = 0; for (const c of [...s]) a += ctx.measureText(c).width + esp; return a - esp; }
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
/* Una línea que entra y sale sola. `p` de 0 a 1 es toda su vida: entra
   rápido, se queda, y se va. Nunca aparece ni desaparece de golpe. */
function linea(s, x, y, t, desde, dura, o = {}) {
  const p = inv(t, desde, desde + dura);
  if (p <= 0 || p >= 1) return;
  const ent = sale5(inv(t, desde, desde + 0.34));
  const sal = inv(t, desde + dura - 0.3, desde + dura);
  const dy = (1 - ent) * 28 - sal * 18;
  texto(s, x, y + dy, { ...o, alfa: Math.min(ent * 1.3, 1 - sal) });
}

/* ── capas ── */
const fondo = () => { ctx.fillStyle = NEGRO; ctx.fillRect(0, 0, W, H); };

/* El grano se renueva cada tres cuadros, no cada uno. A 60 fps un
   grano nuevo por cuadro es un titileo que compite con el movimiento
   —y encima le arruina la compresión al encoder. */
function grano(t, f = .032) {
  const s = Math.floor(t * 20);
  ctx.save(); ctx.globalAlpha = f;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rnd(i * 7 + s) > .5 ? '#FFF' : '#000';
    ctx.fillRect(rnd(i + s * 7919) * W, rnd(i * 3.3 + s * 104729) * H, 2, 2);
  }
  ctx.restore();
}
function vineta(f = .5) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .74);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* Polvo con paralaje: va más lento que la cámara, así se nota que hay
   profundidad. Es la mitad del truco de que algo "se sienta" en 3D. */
function polvo(t) {
  const c = camara(t);
  ctx.save();
  for (let i = 0; i < 110; i++) {
    const prof = .12 + rnd(i * 31) * .5;
    const x = ((rnd(i) * 3600 - c.x * prof + t * (8 + rnd(i * 3) * 26)) % 2400 + 2400) % 2400 - 240;
    const y = ((rnd(i * 5) * 1400 - c.y * prof - t * (10 + rnd(i * 7) * 18)) % 1300 + 1300) % 1300 - 110;
    ctx.globalAlpha = (.1 + rnd(i * 13) * .45) * prof * 1.6;
    ctx.fillStyle = rnd(i * 17) > .35 ? ORO : CHAMPAN;
    ctx.beginPath(); ctx.arc(x, y, (.7 + rnd(i * 11) * 2.6) * prof * 2, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function barrido(p, ancho = 500, alfa = .18) {
  if (p <= 0 || p >= 1) return;
  const x = -ancho + p * (W + ancho * 2);
  const g = ctx.createLinearGradient(x, 0, x + ancho, H);
  g.addColorStop(0, 'rgba(243,217,166,0)');
  g.addColorStop(.5, `rgba(243,217,166,${alfa})`);
  g.addColorStop(1, 'rgba(243,217,166,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* ── objetos del mundo ── */
function aparato(img, x, y, alto, o = {}) {
  const { alfa = 1, giro = 0, desenfoque = 0, luz = null } = o;
  if (!img || alfa <= .004) return;
  const esc = alto / img.naturalHeight, w = img.naturalWidth * esc;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(x, y); ctx.rotate(giro);
  if (desenfoque > .25) ctx.filter = `blur(${desenfoque}px)`;
  if (luz) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alfa * .17;
    const g = ctx.createRadialGradient(0, 0, alto * .2, 0, 0, alto * .85);
    g.addColorStop(0, luz); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-w, -alto, w * 2, alto * 2); ctx.restore();
  }
  ctx.shadowColor = 'rgba(0,0,0,.82)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30;
  ctx.drawImage(img, -w / 2, -alto / 2, w, alto);
  ctx.restore();
}
function lamina(img, x, y, alto, o = {}) {
  const { alfa = 1, giro = 0 } = o;
  if (!img || alfa <= .004) return;
  const esc = alto / img.naturalHeight, w = img.naturalWidth * esc;
  ctx.save();
  ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.translate(x, y); ctx.rotate(giro);
  ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26;
  ctx.beginPath(); ctx.roundRect(-w / 2, -alto / 2, w, alto, 26); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -alto / 2, w, alto, 26); ctx.clip();
  ctx.drawImage(img, -w / 2, -alto / 2, w, alto); ctx.restore();
  ctx.strokeStyle = 'rgba(217,174,114,.45)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-w / 2, -alto / 2, w, alto, 26); ctx.stroke();
  ctx.restore();
}

/* ── el mundo, dibujado entero en cada cuadro ── */
function mundo(t) {
  const c = conCamara(t);

  /* los tres modelos, siempre presentes, siempre flotando */
  MODELOS.forEach((m, i) => {
    const entra = sale5(inv(t, 0.30 + i * (NEGRA / 2), 1.55 + i * (NEGRA / 2)));
    if (entra <= 0) return;
    const flota = Math.sin(t * 1.25 + i * 2.1) * 12;
    const bal = Math.sin(t * .83 + i * 1.7) * .012;
    /* en C4 el del centro crece y los de al lado se abren y se van de foco */
    const foco = suave(inv(t, C(3), C(3) + .8)) * (1 - suave(inv(t, C(4) - .35, C(4))));
    const esCentro = i === 1;
    const abre = esCentro ? 0 : (i - 1) * 140 * foco;
    const alto = 700 + (esCentro ? 150 : -90) * foco;
    aparato(IMG[m.k], m.x + abre, flota + (1 - entra) * 820, alto, {
      alfa: entra * (esCentro ? 1 : 1 - .3 * foco),
      giro: (i - 1) * .035 + bal,
      desenfoque: esCentro ? 0 : 7 * foco,
      luz: m.luz,
    });
    /* el nombre aparece en su negra del compás 3 y se va solo */
    const vn = inv(t, C(2) + NEGRA * (1 + i), C(2) + NEGRA * (1 + i) + .34);
    const vs = 1 - inv(t, C(3) + .2, C(3) + .6);
    if (vn > 0 && vs > 0) {
      const a = Math.min(vn, vs);
      texto(m.nombre, m.x, 428 + (1 - sale(vn)) * 20,
        { tam: 52, fam: 'Bodoni Moda', cursiva: true, color: CHAMPAN, alfa: a });
      texto(m.tipo.toUpperCase(), m.x, 468, { tam: 20, esp: 6, color: MUTE, alfa: a * .85 });
    }
  });

  /* la cuenta regresiva */
  /* Se quedan puestas hasta DESPUÉS del plano abierto: en C7 la cámara
     se va atrás justamente para que se vea todo junto, y si se hubieran
     ido antes ese plano mira un hueco negro. */
  const seVan = 1 - inv(t, C(7) + .5, C(7) + 1.1);
  const v5 = inv(t, C(4) - 1.0, C(4) - .25);
  if (v5 > 0) lamina(IMG.cuenta, 1750, Math.sin(t * 1.1) * 14, 700,
    { alfa: v5 * seVan, giro: -.03 + Math.sin(t * .7) * .008 });

  /* la confirmación: el formulario se vuelve el gracias EN EL MISMO
     lugar, sin corte — la cámara ya está ahí y lo ve cambiar */
  const v6 = inv(t, C(5) - 1.0, C(5) - .25);
  if (v6 > 0) {
    const cambio = C(5) + NEGRA * 2;
    const g = pulso(t, cambio - .07, cambio + .3);
    lamina(t < cambio ? IMG.rsvp : IMG.gracias, 2900, Math.sin(t * 1.05) * 14,
      700 + g * 26, { alfa: v6 * seVan, giro: .03 + Math.cos(t * .66) * .008 });
    /* el anillo sobre "Sí, voy" — la caja se midió del DOM de la
       invitación de verdad, no a ojo */
    if (t < cambio && t > C(5) - .2) {
      const q = inv(t, C(5) - .1, C(5) + .5);
      const alto = 700, esc = alto / 1428, an = 660 * esc;
      const cx = 2900 + (.274 - .5) * an, cy = (.646 - .5) * alto + Math.sin(t * 1.05) * 14;
      const e = sale(q), ww = .427 * an * (1.35 - .35 * e), hh = .056 * alto * (2 - .6 * e);
      ctx.save();
      ctx.globalAlpha = Math.min(1, q * 1.8) * (.55 + .45 * Math.sin(t * 16));
      ctx.strokeStyle = ORO; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.roundRect(cx - ww / 2, cy - hh / 2, ww, hh, 10); ctx.stroke();
      ctx.restore();
    }
  }

  /* el cierre: la marca vive en el mundo, la cámara llega hasta ella */
  const v8 = inv(t, C(7) - .9, C(7) - .1);
  if (v8 > 0) {
    const a = v8;
    texto('CLICK ETERNO', 4100, -30,
      { tam: 118, fam: 'Bodoni Moda', esp: 22, color: CHAMPAN, alfa: a });
    const l = inv(t, C(7) + .25, C(7) + .8);
    ctx.save(); ctx.globalAlpha = l; ctx.strokeStyle = ORO; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(4100 - 250 * l, 36); ctx.lineTo(4100 + 250 * l, 36); ctx.stroke();
    ctx.restore();
    texto('clicketerno.com.ar', 4100, 120,
      { tam: 48, fam: 'Bodoni Moda', color: ORO, alfa: inv(t, C(7) + .45, C(7) + 1.0) });
    texto('341 250-6451  ·  ROSARIO', 4100, 182,
      { tam: 25, esp: 8, color: MUTE, alfa: inv(t, C(7) + .65, C(7) + 1.2) });
  }
  ctx.restore();
}

/* ── los textos, pegados a la pantalla (no al mundo) ── */
function rotulos(t) {
  /* C1 · el gancho, el que vende */
  linea('Tu fiesta merece', W / 2, 452, t, .30, 1.70,
    { tam: 92, fam: 'Bodoni Moda', color: CREMA });
  linea('algo más que un flyer', W / 2, 568, t, .55, 1.45,
    { tam: 92, fam: 'Bodoni Moda', cursiva: true, color: ORO });

  /* C2 · el golpe */
  const g = inv(t, C(1), C(1) + .38);
  if (g > 0 && t < C(2) - .1) {
    const s = 1.18 - .18 * sale5(g), sal = 1 - inv(t, C(2) - .45, C(2) - .1);
    ctx.save();
    ctx.globalAlpha = Math.min(g * 2.4, sal);
    ctx.translate(W / 2, 212); ctx.scale(s, s);
    texto('Invitaciones digitales', 0, 0, { tam: 86, fam: 'Bodoni Moda', color: CHAMPAN });
    ctx.restore();
    texto('Una web propia para tu fiesta, no una imagen', W / 2, 272,
      { tam: 31, esp: 4, color: MUTE, alfa: Math.min(inv(t, C(1) + .3, C(1) + .8), sal) });
  }

  /* C3-C4 · lo que trae */
  linea('Tres fiestas, tres diseños', W / 2, 190, t, C(2) + .15, 1.5,
    { tam: 54, fam: 'Bodoni Moda', color: CHAMPAN });
  ['Se abre como un sobre', 'Diseñada a medida, no elegida de una lista']
    .forEach((s, i) => linea(s, W / 2, 180 + i * 62, t, C(3) + .25 + i * .5, 1.35 - i * .25,
      { tam: i ? 34 : 50, fam: i ? 'Jost' : 'Bodoni Moda', color: i ? MUTE : CHAMPAN }));

  /* C5 · la cuenta */
  linea('Cuenta los días que faltan', W / 2, 196, t, C(4) + .12, 1.6,
    { tam: 62, fam: 'Bodoni Moda', color: CHAMPAN });
  linea('y corre cada vez que la abren', W / 2, 262, t, C(4) + .45, 1.25,
    { tam: 34, color: MUTE });

  /* C6 · la confirmación, que es el argumento más fuerte */
  linea('Confirman desde el celular', W / 2, 196, t, C(5) + .1, 1.65,
    { tam: 62, fam: 'Bodoni Moda', color: CHAMPAN });
  linea('Vos ves quién viene. Sin llamar a nadie.', W / 2, 262, t, C(5) + .45, 1.3,
    { tam: 34, color: MUTE });

  /* C7 · el remate */
  linea('Todo lo de tu fiesta', W / 2, 180, t, C(6) + .2, 1.5,
    { tam: 66, fam: 'Bodoni Moda', color: CHAMPAN });
  linea('en un solo link', W / 2, 254, t, C(6) + .45, 1.25,
    { tam: 50, fam: 'Bodoni Moda', cursiva: true, color: ORO });
  linea('Pedí la tuya', W / 2, H - 150, t, C(6) + .9, .9,
    { tam: 38, esp: 9, color: CREMA });
}

/* ── el cuadro ── */
function dibujar(t) {
  fondo();
  polvo(t);
  mundo(t);
  rotulos(t);
  vineta(.46);
  grano(t);
  /* Dos destellos en todo el video, y nada más: el golpe del título y
     el momento en que el formulario se vuelve el "gracias". Los otros
     seis cambios de compás son movimientos de cámara, no cortes. */
  const d1 = pulso(t, C(1) - .02, C(1) + .12);
  if (d1 > .02) { ctx.fillStyle = `rgba(255,248,232,${d1 * .3})`; ctx.fillRect(0, 0, W, H); }
  const d2 = pulso(t, C(5) + NEGRA * 2 - .03, C(5) + NEGRA * 2 + .18);
  if (d2 > .02) { ctx.fillStyle = `rgba(243,217,166,${d2 * .26})`; ctx.fillRect(0, 0, W, H); }
  barrido(inv(t, C(1), C(1) + .5), 520, .14);
  barrido(inv(t, C(6), C(6) + .6), 620, .1);

  const n = Math.min(inv(t, 0, .35), 1 - inv(t, DUR - .5, DUR));
  if (n < 1) { ctx.fillStyle = `rgba(7,6,5,${1 - n})`; ctx.fillRect(0, 0, W, H); }
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
  await document.fonts.load('400 118px "Bodoni Moda"');
  await document.fonts.load('italic 400 92px "Bodoni Moda"');
  await document.fonts.load('300 54px "Jost"');
  await document.fonts.ready;
  dibujar(0);
  window.__listo = true;
})();
