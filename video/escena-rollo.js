/* ═══════════════════════════════════════════════════════════════
   ROLLO ETERNO · pieza vertical para redes
   Todo se dibuja en función del tiempo: dibujar(t) con el mismo t
   da siempre el mismo cuadro. Nada de requestAnimationFrame ni de
   animaciones de CSS — así el render sale parejo aunque la máquina
   vaya lenta, y se puede volver a generar idéntico.
   ═══════════════════════════════════════════════════════════════ */
const W = 1080, H = 1920, DUR = 25;

const ORO = '#D9AE72', CHAMPAN = '#F3D9A6', HONDO = '#8A6530';
const NEGRO = '#0A0806', CREMA = '#EDE6D8', MUTE = '#B3A896';

/* ── curvas ── */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const inv = (t, a, b) => clamp((t - a) / (b - a), 0, 1);          // 0→1 entre a y b
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const sale = x => 1 - Math.pow(1 - x, 3);
const entra = x => x * x * x;
const pulso = (t, a, b) => { const x = inv(t, a, b); return Math.sin(x * Math.PI); };

/* ── azar estable: la misma semilla da siempre lo mismo ── */
function rnd(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

let ctx;
const fondo = () => { ctx.fillStyle = NEGRO; ctx.fillRect(0, 0, W, H); };

/* Fotos de verdad. montar.py incrusta en window.__FOTOS lo que haya en
   video/fotos/ (propias o generadas con IA). Si hay, se usan; si no, la
   escena dibuja la fiesta como siempre y el video sale igual. Se cargan
   ANTES del primer cuadro: una imagen a medio cargar deja el hueco en
   negro y eso no avisa, sale mal y listo. */
const FOTOS = [];
/* El orden en que se reparten. Elegir con rnd(semilla) repetía: en la
   grilla del álbum, que pide nueve seguidas, la misma selfie salía tres
   veces. Con una permutación fija e índice por semilla, nueve semillas
   consecutivas dan nueve fotos DISTINTAS, y sigue siendo reproducible. */
let ORDEN = [];
function barajar(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd(i * 7.3 + 1.9) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
async function cargarFotos() {
  const fuentes = (window.__FOTOS || []).slice(0, 40);
  await Promise.all(fuentes.map(src => new Promise(ok => {
    const im = new Image();
    im.onload = () => { FOTOS.push(im); ok(); };
    im.onerror = () => ok();
    im.src = src;
  })));
  ORDEN = barajar(FOTOS.length);
}

/* Dibuja la foto i recortada a la caja, como `object-fit: cover`. */
function fotoReal(im, x, y, w, h) {
  const ei = im.naturalWidth / im.naturalHeight, ec = w / h;
  let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
  if (ei > ec) { sw = sh * ec; sx = (im.naturalWidth - sw) / 2; }
  else { sh = sw / ec; sy = (im.naturalHeight - sh) / 2; }
  ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
}

function texto(s, x, y, { tam = 48, fam = 'Jost', peso = 300, color = CREMA,
  alfa = 1, esp = 0, cursiva = false, centro = true } = {}) {
  if (alfa <= .002) return;
  ctx.save(); ctx.globalAlpha = clamp(alfa, 0, 1);
  ctx.fillStyle = color;
  ctx.font = `${cursiva ? 'italic ' : ''}${peso} ${tam}px "${fam}"`;
  ctx.textAlign = centro ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';
  if (esp) {
    /* el espaciado entre letras no existe en canvas: se dibuja letra por
       letra y se centra a mano sobre el ancho total ya separado */
    const letras = [...s];
    const ancho = letras.reduce((a, c) => a + ctx.measureText(c).width + esp, -esp);
    let px = centro ? x - ancho / 2 : x;
    ctx.textAlign = 'left';
    for (const c of letras) { ctx.fillText(c, px, y); px += ctx.measureText(c).width + esp; }
  } else ctx.fillText(s, x, y);
  ctx.restore();
}

/* Grano de película: le saca el aspecto de plantilla y es la textura del
   producto. Fijo por cuadro, no al azar en cada repintado. */
function grano(t, fuerza = 0.055) {
  const n = 2600, s = Math.floor(t * 30);
  ctx.save(); ctx.globalAlpha = fuerza;
  for (let i = 0; i < n; i++) {
    const a = rnd(i + s * 7919), b = rnd(i * 3.3 + s * 104729);
    ctx.fillStyle = rnd(i * 7 + s) > .5 ? '#FFFFFF' : '#000000';
    ctx.fillRect(a * W, b * H, 2, 2);
  }
  ctx.restore();
}

function vineta(f = .85) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .30, W / 2, H / 2, H * .82);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* Una “foto” inventada. Antes eran manchas de luz y se leían como
   abstracciones: en una pieza que vende FOTOS, el cuadro no puede estar
   vacío. Ahora cada una es una escena de fiesta — gente de contraluz,
   guirnalda de luces, papelitos y el flash duro de una descartable —
   dibujada con su semilla, así la número 7 es siempre la misma.

   Son siluetas a propósito, no caras: una cara inventada en una pieza
   que vende fotos de verdad promete algo que no es, y una cara de una
   persona real necesita su consentimiento (art. 53 del CCyC). Cuando
   haya fotos de una fiesta nuestra, se cambian por esas. */
function foto(x, y, w, h, semilla, revelado = 1, redondeo = 10) {
  const pares = [['#140E0A', '#53381C'], ['#0C0D14', '#2C3A4B'], ['#160D10', '#52252E'],
                 ['#0E1210', '#273B31'], ['#141014', '#432A40'], ['#13100A', '#5B4420']];
  const p = pares[Math.floor(rnd(semilla) * pares.length)];
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, redondeo); ctx.clip();

  /* Con fotos de verdad no hace falta inventar nada: se dibuja la foto,
     se le deja el grano y el revelado, y chau. */
  if (FOTOS.length) {
    const im = FOTOS[ORDEN[((semilla % FOTOS.length) + FOTOS.length) % FOTOS.length]];
    fotoReal(im, x, y, w, h);
    ctx.fillStyle = `rgba(217,174,114,${.07 * revelado})`;   // el tinte cálido de la marca
    ctx.fillRect(x, y, w, h);
    if (revelado < 1) { ctx.fillStyle = `rgba(6,5,4,${1 - revelado})`; ctx.fillRect(x, y, w, h); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = .5 * revelado;
    ctx.strokeStyle = 'rgba(217,174,114,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x + .75, y + .75, w - 1.5, h - 1.5, redondeo); ctx.stroke();
    ctx.restore();
    return;
  }

  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, p[0]); g.addColorStop(1, p[1]);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);

  /* el resplandor del salón: la luz viene de arriba, como el flash */
  const gl = ctx.createRadialGradient(x + w * .5, y + h * .22, 4, x + w * .5, y + h * .22, w * .95);
  gl.addColorStop(0, `rgba(255,228,180,${.30 * revelado})`);
  gl.addColorStop(1, 'rgba(255,228,180,0)');
  ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);

  /* Guirnalda de luces. No va en todas ni a la misma altura: puesta
     siempre igual, nueve fotos juntas se leen como un patrón repetido
     y ahí se nota que están dibujadas. */
  const luces = ['#F3D9A6', '#FFE9C4', '#E8C79A', '#FFF4DF', '#D9AE72'];
  const hayGuirnalda = rnd(semilla * 53) > .35;
  const altoG = .06 + rnd(semilla * 61) * .13, caida = .04 + rnd(semilla * 67) * .09;
  for (let i = 0; hayGuirnalda && i < 9; i++) {
    const fx = (i + .5) / 9, lx = x + fx * w;
    const ly = y + h * (altoG + Math.sin(fx * Math.PI) * caida) + rnd(semilla + i) * 6;
    ctx.globalAlpha = (.45 + rnd(semilla * 3 + i) * .4) * revelado;
    ctx.fillStyle = luces[Math.floor(rnd(semilla * 7 + i) * luces.length)];
    ctx.beginPath(); ctx.arc(lx, ly, w * .018, 0, 7); ctx.fill();
    ctx.globalAlpha = (.12 + rnd(semilla + i * 3) * .18) * revelado;
    ctx.beginPath(); ctx.arc(lx, ly, w * .07, 0, 7); ctx.fill();
  }

  /* La gente, de contraluz. Dibujadas limpias se leían como el icono de
     usuario de un formulario: lo que las vuelve una foto es el
     DESENFOQUE y que no sean todas iguales — las del fondo chicas, muy
     borrosas y claritas; las de adelante grandes, nítidas y oscuras. */
  const cuantos = 4 + Math.floor(rnd(semilla * 5) * 4);
  const gente = [];
  for (let i = 0; i < cuantos; i++) gente.push({ i, z: rnd(semilla * 13 + i * 4.3) });
  gente.sort((a, b) => a.z - b.z);                 // del fondo hacia adelante
  for (const { i, z } of gente) {
    const r = rnd(semilla * 29 + i * 2.1);
    const cx = x + w * (.08 + ((i * 1.37 + r) % 1) * .86);
    const esc = .55 + z * .95;
    const cab = w * .082 * esc;
    const base = y + h * (1.02 + rnd(semilla + i * 2) * .06);
    const homY = base - h * (.26 + rnd(semilla * 9 + i) * .15) * esc;
    const anchoHom = cab * (1.7 + rnd(semilla * 11 + i) * .9);
    ctx.save();
    ctx.filter = `blur(${(1 - z) * w * .035 + w * .004}px)`;
    ctx.globalAlpha = (.42 + z * .5) * revelado;
    ctx.fillStyle = '#060509';
    ctx.beginPath();
    ctx.ellipse(cx, homY - cab * 1.7, cab * (.92 + r * .2), cab * 1.1, (r - .5) * .3, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - anchoHom * 1.25, base);
    ctx.quadraticCurveTo(cx - anchoHom * 1.08, homY, cx, homY - cab * .3);
    ctx.quadraticCurveTo(cx + anchoHom * 1.08, homY, cx + anchoHom * 1.25, base);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* papelitos */
  for (let i = 0; i < 14; i++) {
    const r = rnd(semilla * 23 + i), r2 = rnd(semilla * 41 + i * 2.7);
    ctx.globalAlpha = (.25 + r2 * .5) * revelado;
    ctx.fillStyle = luces[Math.floor(r2 * luces.length)];
    ctx.save();
    ctx.filter = `blur(${w * (.002 + rnd(semilla * 13 + i) * .012)}px)`;
    ctx.translate(x + r * w, y + r2 * h * .8);
    ctx.rotate(r * 6.2);
    ctx.fillRect(0, 0, w * .016, w * .034);
    ctx.restore();
  }

  /* dos o tres velos de bokeh grandes, que es lo que daba el aire de foto */
  for (let i = 0; i < 3; i++) {
    const r = rnd(semilla * 31 + i), r2 = rnd(semilla * 17 + i * 5.1), r3 = rnd(semilla + i * 9.7);
    ctx.save();
    ctx.filter = `blur(${w * .05}px)`;
    ctx.globalAlpha = (.08 + r3 * .18) * revelado;
    ctx.fillStyle = luces[Math.floor(r3 * luces.length)];
    ctx.beginPath(); ctx.arc(x + r * w, y + r2 * h * .6, (.10 + r3 * .18) * w, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  /* el revelado: la foto sube desde el negro, no aparece de golpe */
  if (revelado < 1) { ctx.fillStyle = `rgba(6,5,4,${1 - revelado})`; ctx.fillRect(x, y, w, h); }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .5 * revelado;
  ctx.strokeStyle = 'rgba(217,174,114,.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x + .75, y + .75, w - 1.5, h - 1.5, redondeo); ctx.stroke();
  ctx.restore();
}

/* La tira de cuadraditos del cupo, que es LO que hace que se entienda
   que las fotos se acaban. Es el elemento del producto, no un adorno. */
function tira(cx, cy, total, quedan, ancho = 760, alfa = 1) {
  const gap = 9, w = (ancho - gap * (total - 1)) / total, h = 16;
  ctx.save(); ctx.globalAlpha = alfa;
  for (let i = 0; i < total; i++) {
    const x = cx - ancho / 2 + i * (w + gap);
    const vivo = i < quedan;
    ctx.fillStyle = vivo ? ORO : 'rgba(217,174,114,.16)';
    ctx.beginPath(); ctx.roundRect(x, cy, w, h, 3); ctx.fill();
  }
  ctx.restore();
}

/* ══════════ 1 · el gancho: 24 fotos ══════════ */
function actoGancho(t) {
  const a = inv(t, .25, 1.5);
  /* visor de cámara: cuatro esquinas que se dibujan */
  const m = 110, L = 150 * sale(a);
  ctx.save(); ctx.globalAlpha = a * .9; ctx.strokeStyle = ORO; ctx.lineWidth = 4;
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = sx > 0 ? m : W - m, y = sy > 0 ? m + 180 : H - m - 180;
    ctx.beginPath();
    ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
  }
  ctx.restore();

  const b = inv(t, .7, 1.9);
  texto('ROLLO ETERNO', W / 2, 330, { tam: 30, esp: 14, color: ORO, alfa: b, peso: 400 });

  /* el número entra con un golpe y se asienta */
  const c = inv(t, 1.0, 2.1), esc = .82 + .18 * sale(c);
  ctx.save();
  ctx.translate(W / 2, H / 2 - 60); ctx.scale(esc, esc);
  texto('24', 0, 0, { tam: 420, fam: 'Bodoni Moda', peso: 400, color: CHAMPAN, alfa: c });
  ctx.restore();

  texto('fotos por invitado', W / 2, H / 2 + 110,
    { tam: 46, esp: 6, color: MUTE, alfa: inv(t, 1.5, 2.4) });

  tira(W / 2, H / 2 + 230, 24, 24, 760, inv(t, 1.9, 2.7));

  const d = inv(t, 2.2, 3.1);
  texto('Como un rollo de verdad.', W / 2, H - 420,
    { tam: 62, fam: 'Bodoni Moda', cursiva: true, color: CREMA, alfa: d });
}

/* ══════════ 2 · se gastan ══════════ */
function actoGasta(t) {
  const u = t - 3.2;                                   // 0 … 3.8
  /* cuatro disparos: flash, el número baja, un cuadradito se apaga */
  const disparos = [.35, 1.15, 1.95, 2.75];
  let quedan = 24;
  for (const d of disparos) if (u > d) quedan -= [1, 6, 7, 8][disparos.indexOf(d)];

  texto('ROLLO ETERNO', W / 2, 330, { tam: 30, esp: 14, color: ORO, alfa: .85, peso: 400 });

  /* el número salta un poco en cada disparo */
  let golpe = 0;
  for (const d of disparos) golpe = Math.max(golpe, pulso(u, d, d + .3));
  ctx.save();
  ctx.translate(W / 2, H / 2 - 60); ctx.scale(1 + golpe * .07, 1 + golpe * .07);
  texto(String(quedan), 0, 0, { tam: 420, fam: 'Bodoni Moda', color: CHAMPAN });
  ctx.restore();

  texto('quedan', W / 2, H / 2 + 110, { tam: 46, esp: 6, color: MUTE });
  tira(W / 2, H / 2 + 230, 24, quedan);

  const d2 = inv(u, 1.3, 2.1);
  texto('Una vez que sale, salió.', W / 2, H - 420,
    { tam: 62, fam: 'Bodoni Moda', cursiva: true, color: CREMA, alfa: d2 });
  texto('No se borra. No se repite.', W / 2, H - 340,
    { tam: 40, color: MUTE, alfa: inv(u, 1.9, 2.7) });

  /* el flash del obturador, encima de todo */
  /* OJO: inv() recorta a 0 cuando todavía no llegó el momento, y
     (1 - 0)² da UNO. O sea que sin el `u >= d` el flash estaba a pleno
     ANTES de cada disparo y la pantalla quedaba lavada todo el acto, que
     es justo al revés de lo que tiene que pasar. Se vio recién mirando un
     cuadro del mp4 ya encodeado, no en el canvas. */
  let f = 0;
  for (const d of disparos) if (u >= d) f = Math.max(f, Math.pow(1 - inv(u, d, d + .22), 2));
  if (f > .01) { ctx.fillStyle = `rgba(255,248,232,${f * .5})`; ctx.fillRect(0, 0, W, H); }
}

/* ══════════ 3 · nadie ve nada ══════════ */
function actoSecreto(t) {
  const u = t - 7.0;                                   // 0 … 4.0
  /* las fotos caen a un pozo negro */
  for (let i = 0; i < 7; i++) {
    const d = i * .13, p = inv(u, .15 + d, 1.5 + d);
    if (p <= 0) continue;
    const caida = entra(p);
    const w = 300 - caida * 230, h = w * 1.3;
    const y = 420 + caida * 700, x = W / 2 - w / 2 + Math.sin(i * 2.1) * (1 - caida) * 170;
    ctx.save();
    ctx.globalAlpha = 1 - Math.pow(p, 3.2);
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(Math.sin(i * 1.7) * .25 * (1 - caida));
    foto(-w / 2, -h / 2, w, h, i + 3, 1);
    ctx.restore();
  }
  /* el pozo */
  const g = ctx.createRadialGradient(W / 2, 1180, 10, W / 2, 1180, 520);
  g.addColorStop(0, 'rgba(0,0,0,.96)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 660, W, 1040);

  texto('Y nadie ve nada.', W / 2, 330,
    { tam: 82, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .4, 1.3) });
  texto('Ni el que la sacó.', W / 2, 430,
    { tam: 52, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, 1.1, 2.0) });

  const c = inv(u, 2.0, 2.9);
  texto('Las fotos viven en un depósito privado.', W / 2, H - 440, { tam: 40, color: MUTE, alfa: c });
  texto('Hasta el revelado no hay dirección', W / 2, H - 370,
    { tam: 40, color: MUTE, alfa: inv(u, 2.3, 3.2) });
  texto('con la que abrirlas. Ni para nosotros.', W / 2, H - 300,
    { tam: 40, color: MUTE, alfa: inv(u, 2.5, 3.4) });
}

/* Una de las dos puertas del revelado. Se dibujan juntas porque el
   punto es que son DOS y las elige el organizador: decir sólo "al otro
   día" dejaba afuera la mitad del producto, y es lo primero que preguntan. */
function opcion(cx, cy, w, h, rotulo, titulo, bajada, alfa, marcada) {
  if (alfa <= .002) return;
  ctx.save(); ctx.globalAlpha = alfa;
  ctx.fillStyle = marcada ? 'rgba(217,174,114,.07)' : 'rgba(255,255,255,.025)';
  ctx.beginPath(); ctx.roundRect(cx - w / 2, cy, w, h, 10); ctx.fill();
  ctx.strokeStyle = marcada ? 'rgba(217,174,114,.55)' : 'rgba(217,174,114,.22)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.roundRect(cx - w / 2, cy, w, h, 10); ctx.stroke();
  ctx.restore();
  texto(rotulo, cx, cy + 50, { tam: 22, esp: 6, color: ORO, peso: 400, alfa });
  texto(titulo, cx, cy + 124, { tam: 50, fam: 'Bodoni Moda', color: CHAMPAN, alfa });
  texto(bajada, cx, cy + 186, { tam: 32, color: MUTE, alfa });
}

/* ══════════ 4 · el revelado: dos formas ══════════ */
function actoRevelado(t) {
  const u = t - 11.0;                                  // 0 … 6.5
  texto('EL REVELADO', W / 2, 288,
    { tam: 30, esp: 14, color: ORO, alfa: inv(u, .2, 1.0), peso: 400 });
  texto('Vos elegís cuándo', W / 2, 400,
    { tam: 82, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .45, 1.3) });
  texto('se abre el rollo.', W / 2, 492,
    { tam: 82, fam: 'Bodoni Moda', cursiva: true, color: ORO, alfa: inv(u, .7, 1.6) });

  const aw = 452, ah = 232, ay = 596;
  opcion(W / 2 - 240, ay, aw, ah, 'A LA HORA QUE ELIJAS', 'En la fiesta',
    'Lo ven ahí mismo', inv(u, 1.25, 2.1), true);
  opcion(W / 2 + 240, ay, aw, ah, 'O AL OTRO DÍA', 'A la mañana',
    'Se despiertan con todo', inv(u, 1.65, 2.5), false);

  /* tres copias que suben desde el negro, una atrás de otra */
  const w = 392, h = 516, cx = W / 2, cy = 1372;
  for (let i = 0; i < 3; i++) {
    const d = i * .55, ap = inv(u, 2.7 + d, 3.2 + d), rev = inv(u, 2.85 + d, 4.2 + d);
    if (ap <= 0) continue;
    const sub = sale(ap);
    ctx.save();
    ctx.globalAlpha = ap;
    ctx.translate(cx + (i - 1) * 214, cy + (1 - sub) * 120 + Math.abs(i - 1) * 42);
    ctx.rotate((i - 1) * .085);
    /* papel */
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-w / 2 - 13, -h / 2 - 13, w + 26, h + 26 + 52, 12); ctx.fill();
    foto(-w / 2, -h / 2, w, h, i * 5 + 11, suave(rev), 6);
    ctx.restore();
  }
  texto('Primero las tuyas. Después, toda la fiesta.', W / 2, H - 112,
    { tam: 42, color: MUTE, alfa: inv(u, 5.1, 5.9) });
}

/* ══════════ 5 · el álbum ══════════ */
function actoAlbum(t) {
  const u = t - 17.5;                                  // 0 … 4.0
  texto('EL ÁLBUM', W / 2, 300, { tam: 30, esp: 14, color: ORO, alfa: inv(u, 0, .7), peso: 400 });
  texto('Toda la noche, junta.', W / 2, 420,
    { tam: 76, fam: 'Bodoni Moda', color: CHAMPAN, alfa: inv(u, .15, 1.0) });

  const cols = 3, filas = 3, gap = 16, m = 96;
  const w = (W - m * 2 - gap * (cols - 1)) / cols, h = w * 1.3;
  const y0 = 620;
  for (let i = 0; i < cols * filas; i++) {
    const col = i % cols, fila = Math.floor(i / cols);
    const d = (fila * .11) + (col * .055);
    const p = inv(u, .5 + d, 1.25 + d);
    if (p <= 0) continue;
    const s = .86 + .14 * sale(p);
    const x = m + col * (w + gap), y = y0 + fila * (h + gap);
    ctx.save(); ctx.globalAlpha = p;
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s);
    foto(-w / 2, -h / 2, w, h, i + 21, 1, 8);
    ctx.restore();
  }
  texto('Con el nombre de quién sacó cada una.', W / 2, H - 210,
    { tam: 40, color: MUTE, alfa: inv(u, 2.1, 2.9) });
}

/* ══════════ 6 · cierre ══════════ */
function actoCierre(t) {
  const u = t - 21.5;                                  // 0 … 3.5
  const a = inv(u, .1, .9);
  texto('CLICK', W / 2, H / 2 - 90,
    { tam: 130, fam: 'Bodoni Moda', esp: 20, color: CHAMPAN, alfa: a });
  texto('ETERNO', W / 2, H / 2 + 50,
    { tam: 130, fam: 'Bodoni Moda', esp: 20, color: CHAMPAN, alfa: inv(u, .25, 1.05) });

  const b = inv(u, .7, 1.4);
  ctx.save(); ctx.globalAlpha = b; ctx.strokeStyle = ORO; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 170 * b, H / 2 + 130); ctx.lineTo(W / 2 + 170 * b, H / 2 + 130);
  ctx.stroke(); ctx.restore();

  texto('Rollo eterno · la cámara descartable, digital', W / 2, H / 2 + 230,
    { tam: 40, color: MUTE, alfa: inv(u, .9, 1.6) });
  texto('clicketerno.com.ar', W / 2, H / 2 + 400,
    { tam: 58, fam: 'Bodoni Moda', color: ORO, alfa: inv(u, 1.2, 1.9) });
  texto('341 250-6451', W / 2, H / 2 + 480,
    { tam: 42, esp: 4, color: MUTE, alfa: inv(u, 1.4, 2.1) });
}

/* ══════════ el cuadro ══════════ */
function dibujar(t) {
  fondo();
  if (t < 3.2) actoGancho(t);
  else if (t < 7.0) actoGasta(t);
  else if (t < 11.0) actoSecreto(t);
  else if (t < 17.5) actoRevelado(t);
  else if (t < 21.5) actoAlbum(t);
  else actoCierre(t);
  vineta(t >= 17.5 && t < 21.5 ? .42 : .62);
  grano(t);
  /* fundidos de entrada y de salida */
  const n = Math.min(inv(t, 0, .45), 1 - inv(t, DUR - .5, DUR));
  if (n < 1) { ctx.fillStyle = `rgba(10,8,6,${1 - n})`; ctx.fillRect(0, 0, W, H); }
}

window.__listo = false;
window.__dur = DUR;
window.pintar = t => dibujar(t);
(async () => {
  const c = document.getElementById('lienzo');
  c.width = W; c.height = H;
  ctx = c.getContext('2d');
  await document.fonts.load('400 420px "Bodoni Moda"');
  await document.fonts.load('italic 400 62px "Bodoni Moda"');
  await document.fonts.load('300 46px "Jost"');
  await document.fonts.ready;
  await cargarFotos();
  if (FOTOS.length) console.log('fotos de verdad: ' + FOTOS.length);
  dibujar(0);
  window.__listo = true;
})();
