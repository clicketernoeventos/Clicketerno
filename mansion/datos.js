/* La Mansión del Rey — los datos y las cuentas.
   Hoy todo vive en este aparato (localStorage). Cuando se pase a la base,
   se cambia DB.cargar/DB.guardar y las pantallas no se enteran. */
'use strict';

/* ¿Hay base conectada? Si no, la app anda sola en el teléfono con datos de ejemplo. */
const NUBE = typeof CONFIG !== 'undefined' && !!CONFIG.url && !/PEGAR/.test(CONFIG.url);
const ZONA = 'America/Argentina/Buenos_Aires';
const CLAVE = 'mansion.v1';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

/* ── Fechas: siempre 'AAAA-MM-DD' pensadas desde Rosario ── */
const F = {
  hoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  },
  hora() {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', hour12: false }).format(new Date()));
  },
  ms(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d, 12); },
  desdeMs(t) {
    const d = new Date(t);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  },
  sumar(s, n) { return F.desdeMs(F.ms(s) + n * 864e5); },
  dif(a, b) { return Math.round((F.ms(b) - F.ms(a)) / 864e5); },
  dow(s) { return new Date(F.ms(s)).getUTCDay(); },
  armar(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); },
  largo(s) { const [, m, d] = s.split('-').map(Number); return DIAS[F.dow(s)] + ' ' + d + ' de ' + MESES[m - 1]; },
  corto(s) { const [, m, d] = s.split('-').map(Number); return d + ' ' + MESES[m - 1].slice(0, 3); },
  num(s) { const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y.slice(2); },
  cuando(t) {
    const p = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(t));
    return p.replace('.', '');
  },
  falta(s) {
    const n = F.dif(F.hoy(), s);
    if (n === 0) return 'Hoy';
    if (n === 1) return 'Mañana';
    if (n === -1) return 'Ayer';
    return n > 0 ? 'Faltan ' + n + ' días' : 'Hace ' + (-n) + ' días';
  }
};

const $$plata = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const plata = n => $$plata.format(Math.round(n || 0)).replace(/\s/g, '\u00A0');
const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clon = o => o == null ? o : JSON.parse(JSON.stringify(o));

const TIPOS = {
  '15': { nombre: '15 años', corto: 'XV' },
  casamiento: { nombre: 'Casamiento', corto: 'Casamiento' },
  infantil: { nombre: 'Infantil', corto: 'Infantil' },
  corporativo: { nombre: 'Corporativo', corto: 'Empresa' }
};
const ESTADOS = {
  consulta: 'Consulta',
  senada: 'Señada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada'
};
const TURNOS = { noche: 'Noche', mediodia: 'Mediodía' };
const MEDIOS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Otro'];
const CONCEPTOS = ['Seña', 'Cuota', 'Saldo', 'Extra'];
const CATEGORIAS = ['Bebidas', 'Descartables', 'Limpieza', 'Cocina', 'Vajilla', 'Mantelería', 'Mobiliario', 'Otros'];
const ROLES = { dueno: 'Dueño', encargado: 'Encargado', empleado: 'Empleado' };
const TAREAS_BASE = ['Reunión de menú', 'Cantidad final de invitados', 'Música y entrada', 'Decoración y colores', 'Saldo cancelado'];
const PLANTILLA_AUMENTO = '¡Hola {cliente}! Te escribimos de {salon}. Te contamos que desde el {desde} la tarjeta de adulto pasa a {adulto}{menor}. Con lo que ya abonaste, el saldo de {fiesta} queda en {saldo}. Cualquier duda, escribinos.';

/* ── Datos de ejemplo: todo inventado, para ver la app andando ── */
function semilla() {
  const h = F.hoy(), d = n => F.sumar(h, n);
  const u = [
    { id: 'u1', nombre: 'Administración', rol: 'dueno', pin: '1111', activo: true },
    { id: 'u2', nombre: 'Encargado', rol: 'encargado', pin: '2222', activo: true },
    { id: 'u3', nombre: 'Empleado', rol: 'empleado', pin: '3333', activo: true }
  ];
  const precios = [
    { id: 'l1', nombre: 'Tarjeta 15 y casamientos', historial: [{ desde: d(-150), adulto: 45000, menor: 25000 }, { desde: d(-40), adulto: 52000, menor: 29000 }] },
    { id: 'l2', nombre: 'Tarjeta infantil', historial: [{ desde: d(-90), adulto: 30000, menor: 22000 }] },
    { id: 'l3', nombre: 'Tarjeta corporativa', historial: [{ desde: d(-90), adulto: 38000, menor: 0 }] }
  ];
  const servicios = [
    { id: 's1', nombre: 'DJ, sonido e iluminación', precio: 350000 },
    { id: 's2', nombre: 'Barra de tragos', precio: 400000 },
    { id: 's3', nombre: 'Mesa dulce', precio: 180000 },
    { id: 's4', nombre: 'Fotografía y video', precio: 300000 },
    { id: 's5', nombre: 'Ambientación floral', precio: 250000 },
    { id: 's6', nombre: 'Cabina de fotos', precio: 150000 }
  ];
  const tareas = (hechas = 0) => TAREAS_BASE.map((t, i) => ({ id: 't' + i, texto: t, hecha: i < hechas }));
  const ev = (o) => Object.assign({ turno: 'noche', menores: 0, extras: [], notas: [], tareas: tareas(), creado: Date.now() }, o);
  const eventos = [
    ev({ id: 'e1', tipo: '15', titulo: 'Sofía', fecha: d(6), estado: 'confirmada', adultos: 110, menores: 20, lista: 'l1',
      cliente: { nombre: 'Mariana Gómez', tel: '341 000-0101', mail: '', dni: '' },
      extras: [{ id: 's1', nombre: 'DJ, sonido e iluminación', precio: 350000, cant: 1 }, { id: 's3', nombre: 'Mesa dulce', precio: 180000, cant: 1 }],
      tareas: tareas(3), notas: [{ id: 'n1', cuando: Date.now() - 864e5 * 3, usuario: 'u1', texto: 'Entrada con vals, después tema de la banda que le gusta.' }] }),
    ev({ id: 'e2', tipo: 'infantil', titulo: 'Benja', fecha: d(9), turno: 'mediodia', estado: 'senada', adultos: 30, menores: 40, lista: 'l2',
      cliente: { nombre: 'Carla Ruiz', tel: '341 000-0102', mail: '', dni: '' }, tareas: tareas(1) }),
    ev({ id: 'e3', tipo: 'casamiento', titulo: 'Camila y Joaquín', fecha: d(13), estado: 'senada', adultos: 150, menores: 10, lista: 'l1',
      cliente: { nombre: 'Camila Ortiz', tel: '341 000-0103', mail: '', dni: '' },
      extras: [{ id: 's2', nombre: 'Barra de tragos', precio: 400000, cant: 1 }, { id: 's5', nombre: 'Ambientación floral', precio: 250000, cant: 1 }], tareas: tareas(2) }),
    ev({ id: 'e4', tipo: 'corporativo', titulo: 'Cierre de año — Estudio Paredes', fecha: d(20), estado: 'consulta', adultos: 80, lista: 'l3',
      cliente: { nombre: 'Martín Paredes', tel: '341 000-0104', mail: '', dni: '' } }),
    ev({ id: 'e5', tipo: '15', titulo: 'Renata', fecha: d(48), estado: 'senada', adultos: 120, menores: 25, lista: 'l1',
      cliente: { nombre: 'Andrea Sosa', tel: '341 000-0105', mail: '', dni: '' }, extras: [{ id: 's6', nombre: 'Cabina de fotos', precio: 150000, cant: 1 }] }),
    ev({ id: 'e6', tipo: 'casamiento', titulo: 'Paula y Diego', fecha: d(-10), estado: 'realizada', adultos: 130, menores: 8, lista: 'l1',
      cliente: { nombre: 'Paula Méndez', tel: '341 000-0106', mail: '', dni: '' }, tareas: tareas(5) })
  ];
  const pago = (id, e, f, monto, medio, concepto) => ({ id, evento: e, fecha: d(f), monto, medio, concepto, nota: '', usuario: 'u1' });
  const pagos = [
    pago('p1', 'e1', -120, 1500000, 'Transferencia', 'Seña'),
    pago('p2', 'e1', -60, 2000000, 'Transferencia', 'Cuota'),
    pago('p3', 'e1', -20, 1800000, 'Efectivo', 'Cuota'),
    pago('p4', 'e2', -30, 600000, 'Mercado Pago', 'Seña'),
    pago('p5', 'e3', -100, 2500000, 'Transferencia', 'Seña'),
    pago('p6', 'e3', -15, 1500000, 'Efectivo', 'Cuota'),
    pago('p7', 'e5', -8, 1200000, 'Transferencia', 'Seña'),
    pago('p8', 'e6', -200, 3000000, 'Transferencia', 'Seña'),
    pago('p9', 'e6', -40, 5112000, 'Transferencia', 'Saldo')
  ];
  const proveedores = [
    { id: 'v1', nombre: 'Distribuidora de bebidas', rubro: 'Bebidas y hielo', tel: '341 000-0201' },
    { id: 'v2', nombre: 'Mayorista de descartables', rubro: 'Descartables', tel: '341 000-0202' },
    { id: 'v3', nombre: 'Limpieza del centro', rubro: 'Limpieza', tel: '341 000-0203' },
    { id: 'v4', nombre: 'Bazar gastronómico', rubro: 'Vajilla y mantelería', tel: '341 000-0204' }
  ];
  const prod = (id, nombre, categoria, unidad, stock, minimo, proveedor, alias = [], durable = false) =>
    ({ id, nombre, categoria, unidad, stock, minimo, proveedor, alias, durable, pedir: 0 });
  const productos = [
    prod('a1', 'Gaseosa cola 2,25 L', 'Bebidas', 'botellas', 36, 48, 'v1', ['coca', 'coca cola', 'cola']),
    prod('a2', 'Gaseosa lima limón 2,25 L', 'Bebidas', 'botellas', 30, 24, 'v1', ['sprite', 'lima limon', '7up']),
    prod('a3', 'Agua sin gas 2 L', 'Bebidas', 'botellas', 40, 40, 'v1', ['agua']),
    prod('a4', 'Cerveza en lata', 'Bebidas', 'latas', 120, 96, 'v1', ['birra', 'cerveza']),
    prod('a5', 'Hielo', 'Bebidas', 'bolsas', 10, 30, 'v1', ['hielo']),
    prod('a6', 'Servilletas', 'Descartables', 'paquetes', 8, 20, 'v2'),
    prod('a7', 'Vasos descartables', 'Descartables', 'unidades', 300, 200, 'v2', ['vasitos']),
    prod('a8', 'Lavandina 5 L', 'Limpieza', 'bidones', 3, 4, 'v3', ['lavandina']),
    prod('a9', 'Detergente', 'Limpieza', 'botellas', 2, 3, 'v3'),
    prod('a10', 'Rollo de cocina', 'Limpieza', 'rollos', 12, 10, 'v3', ['rollo', 'papel']),
    prod('a11', 'Copas de vino', 'Vajilla', 'unidades', 220, 250, 'v4', ['copa', 'copas'], true),
    prod('a12', 'Platos playos', 'Vajilla', 'unidades', 300, 280, 'v4', ['plato', 'platos'], true),
    prod('a13', 'Manteles blancos', 'Mantelería', 'unidades', 40, 45, 'v4', ['mantel', 'manteles'], true),
    prod('a14', 'Sillas', 'Mobiliario', 'unidades', 260, 250, '', ['silla'], true)
  ];
  const pedidos = [
    { id: 'o1', proveedor: 'v2', fecha: d(-2), estado: 'enviado', items: [{ producto: 'a6', cant: 30 }] }
  ];
  return {
    version: 1, demo: true,
    ajustes: { salon: 'La Mansión del Rey', tel: '', plantilla: PLANTILLA_AUMENTO, revisarCada: 30 },
    usuarios: u, precios, servicios, eventos, pagos, avisos: [], proveedores, productos, movimientos: [], pedidos, registro: []
  };
}

/* Sin datos de ejemplo: así arranca cada usuario cuando hay base conectada */
function datosVacios() {
  return { version: 1, demo: false, ajustes: { salon: 'La Mansión del Rey', tel: '', plantilla: PLANTILLA_AUMENTO, revisarCada: 30 },
    usuarios: [], precios: [], servicios: [], eventos: [], pagos: [], avisos: [], proveedores: [], productos: [], movimientos: [], pedidos: [], registro: [] };
}

/* ── Guardar y leer ──
   Con base conectada, cada usuario tiene su copia en el teléfono y una lista de
   lo que falta enviar ("dirty"). Sin base, es una sola copia de ejemplo. */
const DB = {
  d: null, meta: { dirty: {}, desde: '' }, clave: CLAVE,
  usar(uid) { this.clave = uid ? 'mansion.v2.' + uid : (NUBE ? 'mansion.v2' : CLAVE); },
  cargar() {
    this.d = null; this.meta = { dirty: {}, desde: '' };
    try { const t = localStorage.getItem(this.clave); if (t) this.d = JSON.parse(t); } catch (e) { this.d = null; }
    try { const m = localStorage.getItem(this.clave + '.meta'); if (m) this.meta = JSON.parse(m); } catch (e) { }
    if (!this.meta.dirty) this.meta.dirty = {};
    if (!this.d || this.d.version !== 1) { this.d = NUBE ? datosVacios() : semilla(); this.meta = { dirty: {}, desde: '' }; }
    return this.d;
  },
  guardar() {
    try { localStorage.setItem(this.clave, JSON.stringify(this.d)); localStorage.setItem(this.clave + '.meta', JSON.stringify(this.meta)); return true; }
    catch (e) { return false; }
  },
  marcar(col, id) { if (!NUBE) return; const k = col + '/' + id; this.meta.dirty[k] = (this.meta.dirty[k] || 0) + 1; },
  get(col, id) { return (this.d[col] || []).find(x => x.id === id); }
};

/* ── Toda modificación pasa por acá y queda en el registro, para poder
   corregirla o deshacerla después. ── */
function aplicarOps(ops) {
  for (const o of ops) {
    const arr = DB.d[o.col], i = arr.findIndex(x => x.id === o.id);
    if (o.despues == null) { if (i >= 0) arr.splice(i, 1); }
    else if (i >= 0) arr[i] = clon(o.despues);
    else arr.push(clon(o.despues));
    DB.marcar(o.col, o.id);
  }
}
function cambiar(texto, cambios, meta = {}) {
  const ops = cambios.map(c => {
    const id = c.id || c.nuevo.id, ant = DB.get(c.col, id);
    return { col: c.col, id, antes: ant ? clon(ant) : null, despues: c.nuevo ? clon(c.nuevo) : null };
  });
  aplicarOps(ops);
  const reg = { id: nid(), cuando: Date.now(), usuario: Sesion.u ? Sesion.u.id : '', texto, ops, ir: meta.ir || '', tipo: meta.tipo || '', deshecho: false };
  DB.d.registro.unshift(reg);
  DB.marcar('registro', reg.id);
  if (DB.d.registro.length > 600) DB.d.registro.length = 600;
  DB.guardar();
  if (typeof Nube !== 'undefined') Nube.pronto();
  return reg;
}
/* Devuelve '' si se pudo, o el motivo si algo se volvió a tocar después. */
function conflictoDe(reg) {
  for (const o of reg.ops) {
    const ahora = DB.get(o.col, o.id);
    if (JSON.stringify(ahora || null) !== JSON.stringify(o.despues || null)) return 'Eso se volvió a cambiar después.';
  }
  return '';
}
function deshacer(regId, forzar) {
  const r = DB.d.registro.find(x => x.id === regId);
  if (!r || r.deshecho) return 'Ya estaba deshecho.';
  const c = conflictoDe(r);
  if (c && !forzar) return c;
  aplicarOps(r.ops.slice().reverse().map(o => ({ col: o.col, id: o.id, despues: o.antes })));
  r.deshecho = true; r.deshechoPor = Sesion.u ? Sesion.u.id : ''; r.deshechoCuando = Date.now();
  DB.marcar('registro', r.id);
  DB.guardar();
  if (typeof Nube !== 'undefined') Nube.pronto();
  return '';
}

/* ── Las cuentas de una fiesta ──
   La tarjeta sube; lo que ya se pagó NO. Cada pago se guarda como el
   pedazo de la fiesta que cubría el día que se pagó, y el saldo es lo que
   falta de ese pedazo, al precio de hoy. */
function vigente(listaId, fecha, lista) {
  const l = lista || DB.get('precios', listaId);
  if (!l || !l.historial.length) return { adulto: 0, menor: 0, desde: '' };
  const orden = l.historial.slice().sort((a, b) => a.desde < b.desde ? -1 : 1);
  let r = orden[0];
  for (const h of orden) if (h.desde <= fecha) r = h;
  return r;
}
function extrasDe(ev) { return (ev.extras || []).reduce((t, x) => t + (x.precio || 0) * (x.cant || 1), 0); }
function totalEn(ev, fecha, lista) {
  const p = vigente(ev.lista, fecha, lista);
  return (ev.adultos || 0) * p.adulto + (ev.menores || 0) * p.menor + extrasDe(ev);
}
function cuentas(ev, fecha = F.hoy(), lista) {
  const pagos = DB.d.pagos.filter(p => p.evento === ev.id).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  let frac = 0, pagado = 0;
  for (const p of pagos) {
    const t = totalEn(ev, p.fecha, lista);
    pagado += p.monto;
    if (t > 0) frac += p.monto / t;
  }
  frac = Math.min(frac, 1);
  const total = totalEn(ev, fecha, lista);
  const saldo = ev.estado === 'cancelada' ? 0 : Math.max(0, Math.round((1 - frac) * total));
  return { pagado, saldo, frac, totalHoy: total, pagos };
}
const activa = ev => ev.estado !== 'cancelada' && ev.estado !== 'realizada';

/* Al cargar un aumento: a quién hay que avisarle y cuánto le queda. */
function afectadosPor(listaNueva, desde) {
  const vieja = DB.get('precios', listaNueva.id);
  const hoy = F.hoy();
  return DB.d.eventos
    .filter(e => e.lista === listaNueva.id && activa(e) && e.fecha >= hoy)
    .map(e => {
      const antes = cuentas(e, F.sumar(desde, -1), vieja).saldo;
      const despues = cuentas(e, desde, listaNueva).saldo;
      return { evento: e, antes, despues };
    })
    .filter(x => x.despues > x.antes);
}

function telWa(t) {
  let s = String(t || '').replace(/\D/g, '');
  if (!s) return '';
  if (s.startsWith('54')) s = s.slice(2);
  if (s.startsWith('9') && s.length === 11) s = s.slice(1);
  if (s.startsWith('0')) s = s.slice(1);
  if (s.length === 12) for (const a of [3, 2, 4]) if (s.substr(a, 2) === '15') { s = s.slice(0, a) + s.slice(a + 2); break; }
  return s.length === 10 ? '549' + s : s;
}
function linkWa(tel, texto) {
  const n = telWa(tel);
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
}
function mensajeAumento(av) {
  const e = DB.get('eventos', av.evento); if (!e) return '';
  const a = DB.d.ajustes;
  return (a.plantilla || PLANTILLA_AUMENTO)
    .replaceAll('{cliente}', (e.cliente.nombre || '').split(' ')[0])
    .replaceAll('{salon}', a.salon || 'el salón')
    .replaceAll('{desde}', F.num(av.desde))
    .replaceAll('{adulto}', plata(av.adulto))
    .replaceAll('{menor}', av.menor ? ' y la de menor a ' + plata(av.menor) : '')
    .replaceAll('{fiesta}', 'la fiesta de ' + e.titulo)
    .replaceAll('{saldo}', plata(av.despues));
}

/* Lo que hay que pedir de un producto: lo que pidieron a mano, o lo que
   falta para llegar a una vez y media el mínimo. */
function aPedir(p) {
  if (p.pedir > 0) return p.pedir;
  if (p.stock > p.minimo) return 0;
  return Math.max(1, Math.ceil(p.minimo * 1.5 - p.stock));
}
const enFalta = p => p.pedir > 0 || p.stock <= p.minimo;
const enCamino = pid => DB.d.pedidos.some(o => o.estado === 'enviado' && o.items.some(i => i.producto === pid));
