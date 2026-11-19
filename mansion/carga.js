/* La carga rápida: una frase escrita como se habla y la app entiende qué
   es y dónde va. Nunca guarda sola: muestra lo que entendió y se confirma. */
'use strict';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const sing = w => w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
const palabras = s => norm(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

const RX = {
  pago: /\b(sena|senaron|pago|pagaron|pagaron|abono|abonaron|abonamos|cobre|cobramos|cobro|cuota|transfirio|transfirieron|transferencia|deposito|deposito|efectivo|mercado ?pago|mp|entrega|entregaron|adelanto)\b/,
  entrada: /\b(llegaron|llego|entraron|entro|compre|compramos|ingresaron|ingreso|recibimos|recibi|repuse|repusimos|trajeron|sume|sumar|agregar|agregue)\b/,
  uso: /\b(usamos|use|usaron|salieron|salio|consumimos|consumieron|gastamos|sacamos|saque|se usaron|se uso)\b/,
  rotura: /\b(roto|rota|rotos|rotas|rompieron|rompio|rompimos|se rompio|se rompieron|perdimos|se perdieron|se perdio|quebr)/,
  falta: /\b(falta|faltan|no hay|no queda|no quedan|se acabo|se acabaron|pedir|hay que comprar|hay que pedir|comprar|necesitamos)\b/,
  quedan: /\b(quedan|queda|conte|contamos|contaron|hay|tenemos|stock de)\b/,
  evento: /\b(reserva|reservaron|reservo|nueva fiesta|nuevo evento|fiesta|evento|quince|xv|15 anos|casamiento|boda|casan|infantil|cumple|cumpleanos|corporativo|empresa|cena de fin)\b/,
  nota: /^(nota|anotar|anota|anotacion|ojo|importante|recordar)\b/
};
const MEDIO_RX = [[/transfer/, 'Transferencia'], [/efectivo|cash/, 'Efectivo'], [/mercado ?pago|\bmp\b/, 'Mercado Pago']];
const CONCEPTO_RX = [[/sena|adelanto/, 'Seña'], [/saldo|resto|cancel/, 'Saldo'], [/cuota/, 'Cuota'], [/extra/, 'Extra']];

function leerFecha(t) {
  const h = F.hoy(), [hy] = h.split('-').map(Number);
  let m = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
  let d, mes, y;
  if (m) { d = +m[1]; mes = +m[2]; y = m[3] ? +m[3] : 0; }
  else {
    m = t.match(new RegExp('\\b(\\d{1,2}) de (' + MESES.join('|') + ')(?: (?:de |del )?(\\d{4}))?'));
    if (m) { d = +m[1]; mes = MESES.indexOf(m[2]) + 1; y = m[3] ? +m[3] : 0; }
  }
  if (m && d >= 1 && d <= 31 && mes >= 1 && mes <= 12) {
    if (y && y < 100) y += 2000;
    if (!y) { y = hy; if (F.armar(y, mes, d) < h) y++; }
    return { fecha: F.armar(y, mes, d), texto: m[0] };
  }
  if (/\bhoy\b/.test(t)) return { fecha: h, texto: 'hoy' };
  if (/\bmanana\b/.test(t) && !/a la manana/.test(t)) return { fecha: F.sumar(h, 1), texto: 'manana' };
  return null;
}

/* Montos: "80000", "80.000", "$80.000", "80k", "80 mil", "1,5 palos". */
function leerMontos(t, quitar) {
  let s = t; if (quitar) s = s.replace(quitar, ' ');
  const out = [], rx = /\$?\s?(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(k|mil|lucas|luca|palos?|millon(?:es)?|m)?\b/g;
  let m;
  while ((m = rx.exec(s))) {
    let n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    const mult = m[2] || '';
    if (/^(k|mil|lucas?)$/.test(mult)) n *= 1000;
    else if (/^(palos?|millon|millones|m)$/.test(mult)) n *= 1e6;
    out.push({ n, crudo: m[0], conPlata: m[0].includes('$') || !!mult });
  }
  return out;
}

function buscarProducto(t) {
  const ws = palabras(t).map(sing);
  let mejor = null, pts = 0;
  for (const p of DB.d.productos) {
    let s = 0;
    for (const w of palabras(p.nombre).map(sing)) if (w.length >= 3 && ws.includes(w)) s += 2;
    for (const a of p.alias || []) {
      const an = norm(a);
      if (an.includes(' ') ? norm(t).includes(an) : ws.includes(sing(an))) s += 3;
    }
    if (s > pts) { pts = s; mejor = p; }
  }
  return mejor;
}

function buscarFiesta(t) {
  const ws = palabras(t).filter(w => w.length >= 3);
  const hoy = F.hoy();
  let mejor = null, pts = 0;
  for (const e of DB.d.eventos) {
    let s = 0;
    const nombres = palabras(e.titulo + ' ' + (e.cliente.nombre || '')).filter(w => w.length >= 3 && !['los', 'las', 'del'].includes(w));
    for (const w of nombres) if (ws.includes(w)) s += 3;
    if (!s) continue;
    if (activa(e)) s += 1;
    if (e.fecha >= hoy) s += 0.5;
    if (s > pts) { pts = s; mejor = e; }
  }
  return mejor;
}

const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'nueva', 'nuevo', 'reserva', 'reservaron', 'reservo', 'fiesta', 'evento',
  'anos', 'a', 'al', 'noche', 'mediodia', 'almuerzo', 'turno', 'quince', 'xv', 'casamiento', 'boda', 'infantil', 'cumple', 'cumpleanos',
  'corporativo', 'empresa', 'hoy', 'manana', 'con', 'personas', 'invitados', 'adultos', 'chicos', 'menores', 'el', 'se', 'casan', 'tarde', 'cena']);

function leerEvento(orig, t, fecha) {
  let tipo = '';
  if (/\b(casamiento|boda|casan)\b/.test(t)) tipo = 'casamiento';
  else if (/\b(infantil|cumple|cumpleanos|bautismo|comunion)\b/.test(t)) tipo = 'infantil';
  else if (/\b(corporativo|empresa|cena de fin|fin de ano)\b/.test(t)) tipo = 'corporativo';
  else if (/\b(quince|xv|15 anos)\b/.test(t) || /^\s*15\s+(de\s+)?[a-z]/.test(t) && !new RegExp('^\\s*15 de (' + MESES.join('|') + ')').test(t)) tipo = '15';
  const turno = /\b(mediodia|almuerzo|al mediodia)\b/.test(t) ? 'mediodia' : 'noche';
  let adultos = 0, menores = 0;
  let m = t.match(/(\d+)\s*(adultos|personas|invitados|mayores)/); if (m) adultos = +m[1];
  m = t.match(/(\d+)\s*(chicos|menores|ninos|nenes)/); if (m) menores = +m[1];
  /* El nombre: lo que queda sacando fecha, números y palabras de relleno. */
  let resto = orig;
  if (fecha) resto = resto.replace(new RegExp(fecha.texto.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'i'), ' ');
  resto = resto.replace(new RegExp('\\b(\\d{1,2})\\s+de\\s+(' + MESES.join('|') + ')\\b', 'i'), ' ');
  const nombre = resto.split(/\s+/).filter(w => {
    const n = norm(w).replace(/[^a-z0-9ñ]/g, '');
    return n && !/^\d+$/.test(n) && !VACIAS.has(n) && !MESES.includes(n);
  }).map(w => w.replace(/[^\p{L}\p{N}'-]/gu, '')).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1)).join(' ').replace(/^(Y )+|( Y)+$/g, '');
  return { tipoFiesta: tipo, turno, adultos, menores, titulo: nombre.replace(/\bY\b/g, 'y') };
}

/* Devuelve { tipo, ...campos, entendido: 'texto', confianza } o tipo:'' */
function interpretar(orig) {
  const t = norm(orig).trim();
  if (!t) return { tipo: '' };
  const fecha = leerFecha(t);
  const quitarFecha = fecha ? new RegExp(fecha.texto.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')) : null;
  const montos = leerMontos(t, quitarFecha);
  const prod = buscarProducto(t);
  const fiesta = buscarFiesta(t);
  const grande = montos.filter(x => x.n >= 1000 || x.conPlata).sort((a, b) => b.n - a.n)[0];

  /* 1) nota */
  if (RX.nota.test(t)) {
    /* "nota Gómez: traen torta propia" → lo que va después de los dos puntos */
    let texto = orig.replace(/^\s*\S+\s*/, '');
    if (texto.includes(':')) texto = texto.slice(texto.indexOf(':') + 1);
    texto = texto.trim();
    return { tipo: 'nota', evento: fiesta ? fiesta.id : '', texto: texto || orig };
  }
  /* 2) pago: palabra de plata + monto */
  if (grande && (RX.pago.test(t) || (fiesta && !prod))) {
    let medio = 'Transferencia'; for (const [r, v] of MEDIO_RX) if (r.test(t)) { medio = v; break; }
    let concepto = ''; for (const [r, v] of CONCEPTO_RX) if (r.test(t)) { concepto = v; break; }
    if (!concepto && fiesta) concepto = DB.d.pagos.some(p => p.evento === fiesta.id) ? 'Cuota' : 'Seña';
    return { tipo: 'pago', evento: fiesta ? fiesta.id : '', monto: Math.round(grande.n), medio, concepto: concepto || 'Cuota', fecha: fecha ? fecha.fecha : F.hoy() };
  }
  /* 3) stock */
  if (prod && !(fecha && RX.evento.test(t) && !RX.falta.test(t))) {
    const cant = montos.filter(x => !x.conPlata).map(x => x.n)[0] || 0;
    let mov = 'entrada';
    if (RX.rotura.test(t)) mov = 'rotura';
    else if (RX.uso.test(t)) mov = 'uso';
    else if (RX.falta.test(t)) mov = 'falta';
    else if (RX.entrada.test(t)) mov = 'entrada';
    else if (RX.quedan.test(t)) mov = 'ajuste';
    else if (!cant) mov = 'falta';
    if (/se acab|no (hay|queda)/.test(t) && !cant) return { tipo: 'stock', producto: prod.id, mov: 'ajuste', cant: 0, evento: '' };
    return { tipo: 'stock', producto: prod.id, mov, cant: mov === 'falta' ? (cant || aPedir(Object.assign({}, prod, { pedir: 0 })) || prod.minimo) : cant, evento: fiesta && (mov === 'uso' || mov === 'rotura') ? fiesta.id : '' };
  }
  /* 4) fiesta nueva */
  if (fecha || RX.evento.test(t)) {
    const e = leerEvento(orig, t, fecha);
    return Object.assign({ tipo: 'evento', fecha: fecha ? fecha.fecha : '' }, e);
  }
  /* 5) algo de una fiesta sin monto: nota */
  if (fiesta) return { tipo: 'nota', evento: fiesta.id, texto: orig.trim() };
  return { tipo: '' };
}
