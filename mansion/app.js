/* La Mansión del Rey — las pantallas. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = (n, c = '') => `<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const iniciales = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const sel = (v, o) => v === o ? ' selected' : '';
const may = s => s.charAt(0).toUpperCase() + s.slice(1);
const pres = b => ` aria-pressed="${b ? 'true' : 'false'}"`;

/* ── Quién está usando la app ── */
const SESION = 'mansion.sesion';
const Sesion = {
  u: null,
  leer() { try { const id = localStorage.getItem(SESION); this.u = DB.d.usuarios.find(x => x.id === id && x.activo) || null; } catch (e) { this.u = null; } },
  entrar(u) { this.u = u; try { localStorage.setItem(SESION, u.id); } catch (e) { } },
  salir() { this.u = null; try { localStorage.removeItem(SESION); } catch (e) { } }
};
const PERMISOS = {
  dueno: { plata: true, fiestas: true, editar: true, stock: true, precios: true, usuarios: true, registroTodo: true, ajustes: true, contacto: true },
  encargado: { plata: false, fiestas: true, editar: true, stock: true, precios: false, usuarios: false, registroTodo: true, ajustes: false, contacto: true },
  empleado: { plata: false, fiestas: true, editar: false, stock: true, precios: false, usuarios: false, registroTodo: false, ajustes: false, contacto: false }
};
const puede = p => !!(Sesion.u && PERMISOS[Sesion.u.rol][p]);

/* ── Tostada (con deshacer) ── */
let tTostada;
function tostada(texto, regId) {
  const t = $('#tostada');
  t.innerHTML = `<span>${esc(texto)}</span>` + (regId ? `<button data-a="deshacer-t" data-id="${regId}">${ico('deshacer', 'ch')}Deshacer</button>` : '');
  t.classList.add('ver');
  clearTimeout(tTostada);
  tTostada = setTimeout(() => t.classList.remove('ver'), regId ? 7000 : 3200);
}

/* ── Hojas ── */
function hoja(titulo, cuerpo, alAbrir) {
  const capa = document.createElement('div');
  capa.className = 'velo';
  capa.innerHTML = `<section class="hoja" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
    <div class="asa"></div>
    <div class="cab-h"><h2>${esc(titulo)}</h2><button class="redondo chico" data-a="calc" aria-label="Calculadora">${ico('calc', 'ch')}</button><button class="redondo chico" data-a="cerrar" aria-label="Cerrar">${ico('x')}</button></div>
    <div class="cuerpo">${cuerpo}</div></section>`;
  capa.addEventListener('click', e => { if (e.target === capa) cerrarHoja(capa); });
  $('#capas').appendChild(capa);
  document.body.style.overflow = 'hidden';
  if (alAbrir) alAbrir($('.hoja', capa));
  const f = $('.hoja [autofocus]', capa);
  if (f && matchMedia('(min-width: 700px)').matches) f.focus();
  return capa;
}
function cerrarHoja(capa) {
  capa = capa || $('#capas .velo:last-child');
  if (capa) capa.remove();
  if (!$('#capas .velo')) document.body.style.overflow = '';
}
const cerrarTodo = () => { $$('#capas .velo').forEach(c => c.remove()); document.body.style.overflow = ''; };
function confirmar(titulo, texto, si, fn, peligro) {
  hoja(titulo, `<p style="margin:0 0 18px;color:var(--tinta-2)">${esc(texto)}</p>
    <div class="botones"><button class="btn suave" data-a="cerrar">Cancelar</button><button class="btn ${peligro ? 'acento' : ''}" id="si">${esc(si)}</button></div>`,
    h => $('#si', h).onclick = () => { cerrarHoja(); fn(); });
}
const val = (h, n) => { const e = $(`[name="${n}"]`, h); return e ? e.value.trim() : ''; };
const num = (h, n) => { const v = val(h, n).replace(/\./g, '').replace(',', '.'); return v === '' ? 0 : Number(v) || 0; };

/* ── Navegación ── */
let resaltar = '';
function ir(ruta, id) { resaltar = id || ''; if (location.hash === '#/' + ruta) render(); else location.hash = '#/' + ruta; }
const NAV = () => {
  const r = Sesion.u ? Sesion.u.rol : 'empleado';
  const base = [['inicio', 'casa', 'Inicio'], ['agenda', 'cal', 'Agenda']];
  return r === 'empleado'
    ? base.concat([['stock', 'caja', 'Stock'], ['mas', 'grilla', 'Más']])
    : base.concat([['fiestas', 'copa', 'Fiestas'], ['mas', 'grilla', 'Más']]);
};
function pintarNav(ruta) {
  const actual = r => ruta === r || (r === 'fiestas' && ruta === 'fiesta') || (r === 'mas' && !['inicio', 'agenda', 'fiestas', 'fiesta', 'stock'].includes(ruta));
  $('#abajo').innerHTML = NAV().map(([r, i, t]) => `<a href="#/${r}"${actual(r) ? ' aria-current="page"' : ''}>${ico(i)}<span>${t}</span></a>`).join('');
  const lat = [['inicio', 'casa', 'Inicio'], ['agenda', 'cal', 'Agenda'], ['buscar', 'buscar', 'Buscar']];
  if (puede('fiestas')) lat.push(['fiestas', 'copa', 'Fiestas']);
  if (puede('plata')) lat.push(['pagos', 'plata', 'Pagos'], ['precios', 'etiqueta', 'Precios y aumentos']);
  lat.push(['stock', 'caja', 'Stock'], ['proveedores', 'camion', 'Proveedores'], ['registro', 'reloj', 'Registro de cargas']);
  if (puede('usuarios')) lat.push(['usuarios', 'usuarios', 'Usuarios']);
  if (puede('ajustes')) lat.push(['ajustes', 'ajustes', 'Ajustes']);
  $('#lateral').innerHTML = `<div class="marca"><div class="sello">${ico('corona')}</div><div>${esc(DB.d.ajustes.salon)}<small>${esc(Sesion.u.nombre)} · ${ROLES[Sesion.u.rol]}</small></div></div>
    <button class="btn acento cargar" data-a="cargar">${ico('mas')}Carga rápida</button>
    ${lat.map(([r, i, t]) => `<a href="#/${r}"${ruta === r || (r === 'fiestas' && ruta === 'fiesta') ? ' aria-current="page"' : ''}>${ico(i)}${t}</a>`).join('')}
    <div class="pie"><button class="nav" data-a="salir">${ico('salir')}Salir</button></div>`;
}

const RUTAS = {};
function render() {
  if (!Sesion.u) { $('#app').classList.add('sin-sesion'); $('#vista').innerHTML = vIngreso(); return; }
  $('#app').classList.remove('sin-sesion');
  const [ruta, ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const v = RUTAS[ruta] || RUTAS.inicio;
  let html;
  try { html = v.apply(null, args); } catch (e) { console.error(e); html = vacio('alerta', 'Algo falló al mostrar esta pantalla.'); }
  if (html == null) { html = vacio('alerta', 'Esta parte no está habilitada para tu usuario.'); }
  $('#vista').innerHTML = html;
  pintarNav(RUTAS[ruta] ? ruta : 'inicio');
  if (resaltar) {
    const el = $(`[data-id="${CSS.escape(resaltar)}"]`, $('#vista'));
    if (el) { el.classList.add('brilla'); el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    resaltar = '';
  } else window.scrollTo(0, 0);
  animarAnillos();
}
window.addEventListener('hashchange', () => { cerrarTodo(); render(); });

function animarAnillos() {
  requestAnimationFrame(() => $$('.anillo .lleno').forEach(c => { c.style.strokeDashoffset = c.dataset.fin; }));
}

const vacio = (i, t) => `<div class="vacio-t">${ico(i)}${esc(t)}</div>`;
const barra = (titulo, atras, extra = '') => `<div class="barra">${atras ? `<a class="redondo" href="#/${atras}" aria-label="Volver">${ico('atras')}</a>` : ''}<h1>${esc(titulo)}</h1>${extra}</div>`;

/* ═════════════ Ingreso ═════════════ */
let elegido = null, pin = '';
function vIngreso() {
  const us = DB.d.usuarios.filter(u => u.activo);
  if (!elegido) return `<section class="ingreso">
      <div class="sello-g">${ico('corona')}</div>
      <h1>${esc(DB.d.ajustes.salon)}</h1>
      <p>¿Quién entra?</p>
      <div class="quienes">${us.map(u => `<button data-a="elegir" data-id="${u.id}"><span class="avatar">${iniciales(u.nombre)}</span><span>${esc(u.nombre)}<small>${ROLES[u.rol]}</small></span>${ico('der')}</button>`).join('')}</div>
      ${DB.d.demo ? `<p style="margin-top:22px"><span class="aviso-demo">${ico('chispa', 'ch')}Datos de ejemplo · PIN 1111, 2222 o 3333</span></p>` : ''}
    </section>`;
  return `<section class="ingreso">
      <span class="avatar" style="width:64px;height:64px;font-size:22px;margin:0 auto 12px">${iniciales(elegido.nombre)}</span>
      <h1 style="font-size:28px">${esc(elegido.nombre)}</h1>
      <p>Poné tu PIN de 4 números</p>
      <div class="pin-puntos" aria-live="polite" aria-label="${pin.length} de 4">${[0, 1, 2, 3].map(i => `<i class="${i < pin.length ? 'lleno' : ''}"></i>`).join('')}</div>
      <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-a="tecla" data-n="${n}">${n}</button>`).join('')}
        <button data-a="otro-usuario" aria-label="Elegir otro usuario">${ico('atras')}</button><button data-a="tecla" data-n="0">0</button><button data-a="borrar-tecla" aria-label="Borrar">${ico('x')}</button></div>
    </section>`;
}
function tecla(n) {
  if (pin.length >= 4) return;
  pin += n;
  if (pin.length === 4) {
    if (pin === elegido.pin) { Sesion.entrar(elegido); elegido = null; pin = ''; location.hash = '#/inicio'; render(); return; }
    render(); const p = $('.pin-puntos'); p.classList.add('mal');
    setTimeout(() => { pin = ''; render(); }, 450);
    return;
  }
  render();
}
document.addEventListener('keydown', e => {
  if (Sesion.u || !elegido) return;
  if (/^\d$/.test(e.key)) tecla(e.key);
  else if (e.key === 'Backspace') { pin = pin.slice(0, -1); render(); }
});

/* ═════════════ Inicio ═════════════ */
RUTAS.inicio = () => {
  const hoy = F.hoy(), h = F.hora(), u = Sesion.u;
  const saludo = h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const prox = DB.d.eventos.filter(e => activa(e) && e.fecha >= hoy).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  const p = prox[0];
  const faltan = DB.d.productos.filter(enFalta).filter(x => !enCamino(x.id));
  const avisos = DB.d.avisos.filter(a => a.estado === 'pendiente');
  const mes = hoy.slice(0, 7);

  /* La píldora: lo más urgente primero */
  let pil = '';
  if (puede('plata') && avisos.length) pil = [`Tenés ${avisos.length} ${avisos.length === 1 ? 'cliente' : 'clientes'} para avisar del aumento`, 'avisos', 'campana'];
  else if (faltan.length) pil = [`Faltan ${faltan.length} ${faltan.length === 1 ? 'producto' : 'productos'} en el stock`, 'stock/faltantes', 'caja'];
  else if (puede('plata')) {
    const ultimo = DB.d.precios.flatMap(l => l.historial.map(x => x.desde)).sort().pop() || hoy;
    const dias = F.dif(ultimo, hoy), cada = +DB.d.ajustes.revisarCada || 0;
    if (cada && dias >= cada) pil = [`Hace ${dias} días que no se actualiza la tarjeta`, 'precios', 'etiqueta'];
  }
  const pildora = pil && !sessionStorage.getItem('pil:' + pil[0])
    ? `<a class="pildora" href="#/${pil[1]}"><span class="ico">${ico(pil[2], 'ch')}</span><span>${esc(pil[0])}</span><button data-a="cerrar-pil" data-t="${esc(pil[0])}" aria-label="Ocultar">${ico('x', 'ch')}</button></a>` : '';

  let heroe = '';
  if (p) {
    const c = puede('plata') ? cuentas(p) : null;
    heroe = `<a class="heroe" href="#/fiesta/${p.id}">
      <div class="arr"><span class="chip">${TIPOS[p.tipo].nombre} · ${ESTADOS[p.estado]}</span><span class="flecha">${ico('flecha', 'ch')}</span></div>
      <h3>${esc(p.titulo)}</h3>
      <div class="sub">${esc(F.largo(p.fecha))} · ${TURNOS[p.turno]}</div>
      <div class="cuenta"><div class="dias">${Math.max(0, F.dif(hoy, p.fecha)) || 'Hoy'}<small>${F.dif(hoy, p.fecha) ? 'días para la fiesta' : 'es la fiesta'}</small></div>
        <div class="datos"><span><b>${(p.adultos || 0) + (p.menores || 0)}</b> invitados</span>${c ? `<span>Saldo <b>${plata(c.saldo)}</b></span>` : ''}
        <span>Tareas <b>${p.tareas.filter(t => t.hecha).length}/${p.tareas.length}</b></span></div></div>
      ${c ? `<div class="barra-p"><i style="width:${Math.round(c.frac * 100)}%"></i></div>` : ''}
    </a>`;
  } else heroe = `<div class="tarjeta">${vacio('cal', 'No hay fiestas por delante. Cargá la primera con el botón +')}</div>`;

  /* La semana */
  const lunes = F.sumar(hoy, -((F.dow(hoy) + 6) % 7));
  const semana = [...Array(7)].map((_, i) => {
    const d = F.sumar(lunes, i), evs = DB.d.eventos.filter(e => e.fecha === d && e.estado !== 'cancelada');
    return `<a href="#/agenda/${d}" class="${d === hoy ? 'hoy' : ''}"><span>${DIAS[F.dow(d)].slice(0, 3)}</span><b>${+d.slice(8)}</b><span class="puntos">${evs.map(e => `<i class="${e.estado}"></i>`).join('')}</span></a>`;
  }).join('');

  let kpis = '';
  if (puede('plata')) {
    const porCobrar = DB.d.eventos.filter(activa).reduce((t, e) => t + cuentas(e).saldo, 0);
    const cobrado = DB.d.pagos.filter(x => x.fecha.slice(0, 7) === mes).reduce((t, x) => t + x.monto, 0);
    kpis += `<a class="kpi" href="#/pagos"><div class="et">${ico('plata')}Cobrado este mes</div><div class="val">${plata(cobrado)}</div></a>
      <a class="kpi" href="#/pagos/saldos"><div class="et">${ico('reloj')}Por cobrar</div><div class="val">${plata(porCobrar)}</div></a>`;
  }
  const delMes = DB.d.eventos.filter(e => e.fecha.slice(0, 7) === mes && e.estado !== 'cancelada').length;
  const consultas = DB.d.eventos.filter(e => e.estado === 'consulta' && e.fecha >= hoy).length;
  kpis += `<a class="kpi ${faltan.length ? 'alerta' : ''}" href="#/stock/faltantes"><div class="et">${ico('caja')}Faltantes</div><div class="val">${faltan.length}</div></a>
    <a class="kpi" href="#/stock/pedidos"><div class="et">${ico('camion')}Pedidos en camino</div><div class="val">${DB.d.pedidos.filter(o => o.estado === 'enviado').length}</div></a>`;
  if (puede('fiestas')) kpis += `<a class="kpi" href="#/agenda"><div class="et">${ico('copa')}Fiestas este mes</div><div class="val">${delMes}</div></a>
    <a class="kpi" href="#/fiestas/consulta"><div class="et">${ico('chat')}Consultas abiertas</div><div class="val">${consultas}</div></a>`;

  /* Tareas de las fiestas de los próximos 30 días */
  const pend = prox.filter(e => F.dif(hoy, e.fecha) <= 30).flatMap(e => e.tareas.filter(t => !t.hecha).map(t => ({ e, t }))).slice(0, 6);

  return `<div class="barra"><div class="marca" style="flex:1"><div class="sello">${ico('corona')}</div><div>${esc(DB.d.ajustes.salon)}<small>${esc(F.largo(hoy))}</small></div></div>
      <a class="redondo" href="#/buscar" aria-label="Buscar">${ico('buscar')}</a>
      <a class="redondo" href="#/registro" aria-label="Registro de cargas">${ico('reloj')}</a>
      <a class="avatar" href="#/mas" aria-label="Mi usuario" style="text-decoration:none">${iniciales(u.nombre)}</a></div>
    ${DB.d.demo ? `<p style="margin:0 0 6px"><span class="aviso-demo">${ico('chispa', 'ch')}Datos de ejemplo</span></p>` : ''}
    <h1 class="titulo-g">Inicio</h1><p class="bajada">${saludo}, ${esc(u.nombre)}</p>
    ${pildora}
    <div class="dos-col"><div>
      ${heroe}
      <h2 class="sec">Esta semana <a href="#/agenda">Agenda ${ico('der', 'ch')}</a></h2>
      <div class="semana">${semana}</div>
      ${pend.length ? `<details class="grupo" open><summary>Para hacer<b>${pend.length}</b></summary><div>${pend.map(({ e, t }) => `<button class="tarea" data-a="tarea" data-e="${e.id}" data-t="${t.id}"><span class="caja"></span><span class="crece">${esc(t.texto)}<small class="sub">${esc(e.titulo)}</small></span><span class="chip ${F.dif(hoy, e.fecha) <= 7 ? 'falta' : ''}">${F.corto(e.fecha)}</span></button>`).join('')}</div></details>` : ''}
    </div><div>
      <h2 class="sec" style="margin-top:0">Resumen</h2>
      <div class="kpis">${kpis}</div>
      ${puede('fiestas') ? `<h2 class="sec">Próximas fiestas <a href="#/fiestas">Ver todas ${ico('der', 'ch')}</a></h2>
      <div class="lista-t filas">${prox.slice(1, 5).map(filaFiesta).join('') || `<div class="tarjeta">${vacio('copa', 'Nada más por ahora.')}</div>`}</div>` : ''}
    </div></div>`;
};

function filaFiesta(e) {
  const [, m, d] = e.fecha.split('-');
  const c = puede('plata') && e.estado !== 'cancelada' ? cuentas(e) : null;
  return `<a class="tarjeta fiesta" href="#/fiesta/${e.id}" data-id="${e.id}">
    <div class="fecha-cubo"><b>${+d}</b><span>${MESES[+m - 1].slice(0, 3)}</span></div>
    <div class="min"><h3>${esc(e.titulo)}</h3><div class="sub">${TIPOS[e.tipo].nombre} · ${TURNOS[e.turno]} · ${(e.adultos || 0) + (e.menores || 0)} inv.</div>
      ${c && c.totalHoy ? `<div class="barra-p" style="height:5px;margin-top:8px"><i style="width:${Math.round(c.frac * 100)}%"></i></div>` : ''}</div>
    <div class="der"><span class="chip ${e.estado}">${ESTADOS[e.estado]}</span>${c ? `<small class="sub">${c.saldo ? 'Debe ' + plata(c.saldo) : 'Pagada'}</small>` : ''}</div>
  </a>`;
}

/* ═════════════ Agenda ═════════════ */
let modoSemana = false;
RUTAS.agenda = (dia) => {
  const hoy = F.hoy();
  const esDia = /^\d{4}-\d{2}-\d{2}$/.test(dia || ''), esMes = /^\d{4}-\d{2}$/.test(dia || '');
  const sel_ = esDia ? dia : esMes ? (dia === hoy.slice(0, 7) ? hoy : dia + '-01') : hoy;
  const [y, m] = sel_.split('-').map(Number);
  const primero = F.armar(y, m, 1);
  const mm = String(m).padStart(2, '0');
  const inicio = modoSemana ? F.sumar(sel_, -((F.dow(sel_) + 6) % 7)) : F.sumar(primero, -((F.dow(primero) + 6) % 7));
  const mesAnt = (m === 1 ? F.armar(y - 1, 12, 1) : F.armar(y, m - 1, 1)).slice(0, 7);
  const mesSig = (m === 12 ? F.armar(y + 1, 1, 1) : F.armar(y, m + 1, 1)).slice(0, 7);
  const ant = modoSemana ? F.sumar(sel_, -7) : mesAnt, sig = modoSemana ? F.sumar(sel_, 7) : mesSig;
  const prioridad = ['confirmada', 'senada', 'consulta', 'realizada'];
  const vivos = d => DB.d.eventos.filter(e => e.fecha === d && e.estado !== 'cancelada');
  let celdas = '';
  for (let i = 0; i < (modoSemana ? 7 : 42); i++) {
    const d = F.sumar(inicio, i);
    if (!modoSemana && i >= 35 && d.slice(5, 7) !== mm) break;
    const evs = vivos(d), top = prioridad.find(p => evs.some(e => e.estado === p));
    const cls = [!modoSemana && d.slice(5, 7) !== mm ? 'otro' : '', top ? 'hay-' + top : '', d === hoy ? 'hoy' : ''].join(' ');
    celdas += `<button class="${cls}" data-a="dia" data-d="${d}"${pres(d === sel_)} aria-label="${F.largo(d)}${evs.length ? ', ' + evs.length + ' fiesta' + (evs.length > 1 ? 's' : '') : ''}"><b>${+d.slice(8)}</b><span class="puntos">${evs.slice(0, 3).map(e => `<i class="${e.estado}"></i>`).join('')}</span></button>`;
  }
  const delDia = vivos(sel_);
  const libres = Object.keys(TURNOS).filter(t => !delDia.some(e => e.turno === t));
  const prox = DB.d.eventos.filter(e => e.fecha >= sel_ && e.estado !== 'cancelada')
    .sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.turno === 'mediodia' ? -1 : 1)).slice(0, 40);
  const grupos = []; for (const e of prox) { const g = grupos[grupos.length - 1]; if (g && g.d === e.fecha) g.es.push(e); else grupos.push({ d: e.fecha, es: [e] }); }
  let mesPrev = sel_.slice(0, 7), lista = '';
  for (const g of grupos) {
    if (g.d.slice(0, 7) !== mesPrev) { mesPrev = g.d.slice(0, 7); lista += `<h2 class="sec ag-mes">${MESES[+g.d.slice(5, 7) - 1]}</h2>`; }
    lista += `<div class="ag-dia"><div class="ag-f${g.d === hoy ? ' hoy' : ''}"><span>${DIAS[F.dow(g.d)].slice(0, 3)}</span><b>${+g.d.slice(8)}</b></div><div class="ag-evs">${g.es.map(e => `<a class="ag-ev ${e.estado}" href="#/fiesta/${e.id}" data-id="${e.id}"><i class="pt"></i><span class="min"><small>${TURNOS[e.turno]} · ${TIPOS[e.tipo].nombre}</small><b>${esc(e.titulo)}</b></span><span class="chip ${e.estado}">${ESTADOS[e.estado]}</span></a>`).join('')}</div></div>`;
  }
  return `${barra('Agenda', '', puede('editar') ? `<button class="redondo oscuro" data-a="nueva-fiesta" data-d="${sel_}" aria-label="Reservar fecha">${ico('mas')}</button>` : '')}
    <div class="dos-col"><div class="tarjeta cal-t" data-ant="${ant}" data-sig="${sig}">
      <div class="cal-cab"><h2>${MESES[m - 1]} ${y}</h2>
        <a class="redondo chico" href="#/agenda/${ant}" aria-label="${modoSemana ? 'Semana' : 'Mes'} anterior">${ico('atras', 'ch')}</a>
        <a class="redondo chico" href="#/agenda/${sig}" aria-label="${modoSemana ? 'Semana' : 'Mes'} siguiente">${ico('der', 'ch')}</a></div>
      <div class="cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<div class="dn">${x}</div>`).join('')}${celdas}</div>
      <div class="cal-pie"><div class="leyenda"><span><i style="background:var(--verde-vivo)"></i>Confirmada</span><span><i style="background:var(--acento)"></i>Señada</span><span><i style="background:var(--ambar-vivo)"></i>Consulta</span></div>
        <div class="cal-modo"><button data-a="modo-cal" data-v="mes"${pres(!modoSemana)}>Mes</button><button data-a="modo-cal" data-v="semana"${pres(modoSemana)}>Semana</button></div></div>
      ${sel_ !== hoy ? `<a class="btn chico suave" style="margin-top:10px" href="#/agenda/${hoy}">Ir a hoy</a>` : ''}
    </div><div>
      <h2 class="sec" style="margin-top:0">${esc(may(F.largo(sel_)))}</h2>
      ${puede('editar') && libres.length ? `<div class="libres">${libres.map(t => `<button class="turno-libre" data-a="nueva-fiesta" data-d="${sel_}" data-turno="${t}">${ico('mas')}${TURNOS[t]} libre · Reservar</button>`).join('')}</div>` : ''}
      ${grupos.length ? `<h2 class="sec ag-mes" style="margin-top:18px">Lo que viene</h2>${lista}` : `<div class="tarjeta">${vacio('cal', 'No hay fiestas desde este día.')}</div>`}
    </div></div>`;
};

/* ═════════════ Fiestas ═════════════ */
let busca = '';
RUTAS.fiestas = (filtro = 'proximas') => {
  if (!puede('fiestas')) return null;
  const hoy = F.hoy();
  const F_ = {
    proximas: ['Próximas', e => activa(e) && e.fecha >= hoy],
    consulta: ['Consultas', e => e.estado === 'consulta' && e.fecha >= hoy],
    deben: ['Con saldo', e => activa(e) && cuentas(e).saldo > 0],
    pasadas: ['Pasadas', e => e.fecha < hoy || e.estado === 'realizada'],
    canceladas: ['Canceladas', e => e.estado === 'cancelada'],
    todas: ['Todas', () => true]
  };
  if (!puede('plata')) delete F_.deben;
  const f = F_[filtro] ? filtro : 'proximas';
  const q = norm(busca);
  let lista = DB.d.eventos.filter(F_[f][1]).filter(e => !q || norm(e.titulo + ' ' + e.cliente.nombre + ' ' + e.cliente.tel + ' ' + TIPOS[e.tipo].nombre).includes(q));
  lista.sort((a, b) => (f === 'pasadas' ? -1 : 1) * (a.fecha < b.fecha ? -1 : 1));
  return `${barra('Fiestas', '', puede('editar') ? `<button class="redondo oscuro" data-a="nueva-fiesta" aria-label="Fiesta nueva">${ico('mas')}</button>` : '')}
    <label class="buscador">${ico('buscar')}<span class="oculto">Buscar</span><input type="search" id="buscar-f" placeholder="Buscar por nombre, cliente o teléfono" value="${esc(busca)}"></label>
    <div class="filtros">${Object.entries(F_).map(([k, [t, fn]]) => `<button data-a="ruta" data-r="fiestas/${k}"${pres(k === f)}>${t}<b>${DB.d.eventos.filter(fn).length}</b></button>`).join('')}</div>
    <div id="lista-f">${agrupadas(lista) || `<div class="tarjeta">${vacio('copa', q ? 'No hay ninguna con ese nombre.' : 'No hay fiestas acá.')}</div>`}</div>`;
};

function agrupadas(lista) {
  const g = [];
  for (const e of lista) { const k = e.fecha.slice(0, 7), u = g[g.length - 1]; if (u && u.k === k) u.es.push(e); else g.push({ k, es: [e] }); }
  return g.map(({ k, es }) => `<details class="grupo" open><summary>${may(MESES[+k.slice(5) - 1])} ${k.slice(0, 4)}<b>${es.length}</b></summary><div class="lista-t filas">${es.map(filaFiesta).join('')}</div></details>`).join('');
}
RUTAS.fiesta = (id) => {
  const e = DB.get('eventos', id);
  if (!e) return barra('Fiesta', 'fiestas') + `<div class="tarjeta">${vacio('alerta', 'Esa fiesta no existe (¿se deshizo la carga?).')}</div>`;
  const hoy = F.hoy(), plataOk = puede('plata');
  const c = plataOk ? cuentas(e) : null;
  const p = vigente(e.lista, hoy), lista = DB.get('precios', e.lista);
  const aviso = plataOk && DB.d.avisos.find(a => a.evento === e.id && a.estado === 'pendiente');
  const cab = `<div class="ficha-cab t-${e.tipo}">
      <div class="cab-t"><span class="chip">${TIPOS[e.tipo].nombre} · ${TURNOS[e.turno]}</span><span class="chip">${F.falta(e.fecha)}</span></div>
      <h1>${esc(e.titulo)}</h1>
      <div class="sub">${esc(may(F.largo(e.fecha)))} · ${(e.adultos || 0)} adultos${e.menores ? ' · ' + e.menores + ' menores' : ''}</div>
      ${puede('editar') ? `<div class="estados" role="group" aria-label="Estado">${Object.entries(ESTADOS).map(([k, t]) => `<button data-a="estado" data-id="${e.id}" data-v="${k}"${pres(e.estado === k)}>${t}</button>`).join('')}</div>` : `<div class="estados"><span class="chip">${ESTADOS[e.estado]}</span></div>`}
    </div>`;
  const tel = e.cliente.tel;
  const cliente = puede('contacto') ? `<div class="tarjeta"><div class="cab-t"><h3>${ico('usuario')}Cliente</h3>${puede('editar') ? `<button class="redondo chico" data-a="editar-fiesta" data-id="${e.id}" aria-label="Editar">${ico('lapiz', 'ch')}</button>` : ''}</div>
      <div class="fila"><span class="avatar">${iniciales(e.cliente.nombre)}</span><div class="crece"><b>${esc(e.cliente.nombre || 'Sin nombre')}</b><div class="sub">${esc(tel || 'Sin teléfono')}${e.cliente.mail ? ' · ' + esc(e.cliente.mail) : ''}${e.cliente.dni ? ' · DNI ' + esc(e.cliente.dni) : ''}</div></div>
      ${tel ? `<a class="redondo chico" href="tel:${esc(tel.replace(/[^\d+]/g, ''))}" aria-label="Llamar">${ico('tel', 'ch')}</a><a class="redondo chico" href="${esc(linkWa(tel, '¡Hola ' + (e.cliente.nombre || '').split(' ')[0] + '! '))}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${ico('chat', 'ch')}</a>` : ''}</div></div>` : '';
  let contratado = '';
  if (puede('fiestas')) {
    const filas = [`<div class="fila"><div class="crece"><b>${esc(lista ? lista.nombre : 'Sin tarjeta')}</b><div class="sub">${e.adultos || 0} adultos${plataOk ? ' × ' + plata(p.adulto) : ''}</div></div>${plataOk ? `<span class="monto">${plata((e.adultos || 0) * p.adulto)}</span>` : ''}</div>`];
    if (e.menores) filas.push(`<div class="fila"><div class="crece"><b>Menores</b><div class="sub">${e.menores}${plataOk ? ' × ' + plata(p.menor) : ''}</div></div>${plataOk ? `<span class="monto">${plata(e.menores * p.menor)}</span>` : ''}</div>`);
    for (const x of e.extras || []) filas.push(`<div class="fila"><div class="crece"><b>${esc(x.nombre)}</b>${x.cant > 1 ? `<div class="sub">× ${x.cant}</div>` : ''}</div>${plataOk ? `<span class="monto">${plata(x.precio * (x.cant || 1))}</span>` : ''}</div>`);
    contratado = `<div class="tarjeta"><div class="cab-t"><h3>${ico('lista')}Lo contratado</h3>${puede('editar') ? `<button class="redondo chico" data-a="editar-fiesta" data-id="${e.id}" aria-label="Editar">${ico('lapiz', 'ch')}</button>` : ''}</div>${filas.join('')}
      ${plataOk ? `<div class="fila"><div class="crece"><b>Total a valores de hoy</b></div><span class="monto">${plata(c.totalHoy)}</span></div>` : ''}</div>`;
  }
  let caja = '';
  if (plataOk) {
    const pct = Math.round(c.frac * 100), R = 40, L = 2 * Math.PI * R;
    caja = `<div class="caja-plata" data-id="pagos-${e.id}"><div class="cab-t"><h3>${ico('plata')}Pagos</h3><button class="btn chico acento" data-a="nuevo-pago" data-e="${e.id}">${ico('mas', 'ch')}Pago</button></div>
      <div class="arriba"><div class="anillo"><svg viewBox="0 0 100 100"><circle class="fondo-a" cx="50" cy="50" r="${R}"/><circle class="lleno" cx="50" cy="50" r="${R}" stroke-dasharray="${L}" stroke-dashoffset="${L}" data-fin="${L * (1 - c.frac)}"/></svg><b>${pct}%</b></div>
      <div class="nums"><div><span>Pagado</span><b>${plata(c.pagado)}</b></div><div><span>Saldo a hoy</span><b>${plata(c.saldo)}</b></div></div></div>
      ${c.pagos.slice().reverse().map(x => `<div class="fila tocable" data-a="editar-pago" data-id="${x.id}" role="button" tabindex="0"><div class="crece"><b>${esc(x.concepto)}</b> <span class="sub">· ${esc(x.medio)}</span><div class="sub">${F.num(x.fecha)}${x.nota ? ' · ' + esc(x.nota) : ''}</div></div><span class="monto">${plata(x.monto)}</span></div>`).join('') || '<p class="sub" style="margin:0">Todavía no pagó nada.</p>'}
      <p class="sub" style="font-size:12px;margin:10px 0 0">Lo pagado queda congelado: si sube la tarjeta, sube solamente lo que falta.</p></div>`;
  }
  const avisoH = aviso ? `<a class="pildora" href="#/avisos" data-id="aviso-${e.id}"><span class="ico">${ico('campana', 'ch')}</span><span>Subió la tarjeta: avisale el saldo nuevo (${plata(aviso.despues)})</span>${ico('der', 'ch')}</a>` : '';
  const tareas = `<div class="tarjeta"><div class="cab-t"><h3>${ico('check')}Para hacer</h3><span class="sub">${e.tareas.filter(t => t.hecha).length}/${e.tareas.length}</span></div>
    ${e.tareas.map(t => `<button class="tarea ${t.hecha ? 'hecha' : ''}" data-a="tarea" data-e="${e.id}" data-t="${t.id}"><span class="caja">${t.hecha ? ico('check') : ''}</span><span>${esc(t.texto)}</span></button>`).join('')}
    ${puede('editar') ? `<form class="rapida" data-f="tarea-nueva" data-e="${e.id}" style="margin-top:8px"><input name="t" class="campo" style="flex:1;border:1.5px solid var(--linea);border-radius:14px;padding:10px 12px;background:var(--superficie)" placeholder="Agregar algo para hacer" aria-label="Tarea nueva"><button class="redondo chico" aria-label="Agregar">${ico('mas', 'ch')}</button></form>` : ''}</div>`;
  const notas = `<div class="tarjeta" data-id="notas-${e.id}"><div class="cab-t"><h3>${ico('lapiz')}Notas</h3></div>
    ${e.notas.slice().reverse().map(n => { const u = DB.get('usuarios', n.usuario); return `<div class="fila"><span class="avatar chico">${iniciales(u ? u.nombre : '?')}</span><div class="crece">${esc(n.texto)}<div class="sub">${F.cuando(n.cuando)}${u ? ' · ' + esc(u.nombre) : ''}</div></div></div>`; }).join('') || '<p class="sub" style="margin:0 0 8px">Sin notas.</p>'}
    <form class="rapida" data-f="nota-nueva" data-e="${e.id}" style="margin-top:8px"><input name="t" style="flex:1;border:1.5px solid var(--linea);border-radius:14px;padding:10px 12px;background:var(--superficie);min-height:44px" placeholder="Escribir una nota" aria-label="Nota nueva"><button class="redondo chico" aria-label="Guardar nota">${ico('check', 'ch')}</button></form></div>`;
  return `${barra('', 'fiestas', puede('editar') ? `<button class="redondo" data-a="editar-fiesta" data-id="${e.id}" aria-label="Editar fiesta">${ico('lapiz')}</button>` : '')}
    ${cab}<div style="height:12px"></div>${avisoH}
    <div class="dos-col"><div>${caja}${caja ? '<div style="height:12px"></div>' : ''}${contratado}</div><div>${cliente}${cliente ? '<div style="height:12px"></div>' : ''}${tareas}<div style="height:12px"></div>${notas}</div></div>`;
};

function formFiesta(e) {
  const nuevo = !e.id;
  const servicios = DB.d.servicios;
  const tiene = id => (e.extras || []).find(x => x.id === id);
  return `<form data-f="fiesta" data-id="${e.id || ''}">
    <div class="campo"><span>Tipo</span><div class="segmentos" data-seg="tipo">${Object.entries(TIPOS).map(([k, t]) => `<button type="button" data-v="${k}"${pres(e.tipo === k)}>${t.nombre}</button>`).join('')}</div><input type="hidden" name="tipo" value="${e.tipo || '15'}"></div>
    <label class="campo"><span>¿Quién festeja?</span><input name="titulo" value="${esc(e.titulo || '')}" placeholder="Ej.: Sofía · Camila y Joaquín" required autofocus></label>
    <div class="dos"><label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${esc(e.fecha || '')}" required></label>
      <label class="campo"><span>Turno</span><select name="turno">${Object.entries(TURNOS).map(([k, t]) => `<option value="${k}"${sel(e.turno, k)}>${t}</option>`).join('')}</select></label></div>
    <div id="choque"></div>
    <label class="campo"><span>Estado</span><select name="estado">${Object.entries(ESTADOS).map(([k, t]) => `<option value="${k}"${sel(e.estado || 'consulta', k)}>${t}</option>`).join('')}</select></label>
    <h3 style="margin:18px 2px 10px;font-size:15px">Cliente</h3>
    <label class="campo"><span>Nombre y apellido</span><input name="cnombre" value="${esc(e.cliente?.nombre || '')}" autocomplete="off"></label>
    <div class="dos"><label class="campo"><span>Teléfono</span><input name="ctel" type="tel" inputmode="tel" value="${esc(e.cliente?.tel || '')}" placeholder="341 …"></label>
      <label class="campo"><span>DNI</span><input name="cdni" inputmode="numeric" value="${esc(e.cliente?.dni || '')}"></label></div>
    <label class="campo"><span>Mail</span><input name="cmail" type="email" value="${esc(e.cliente?.mail || '')}"></label>
    <h3 style="margin:18px 2px 10px;font-size:15px">Lo contratado</h3>
    <label class="campo"><span>Tarjeta</span><select name="lista">${DB.d.precios.map(l => { const v = vigente(l.id, F.hoy()); return `<option value="${l.id}"${sel(e.lista, l.id)}>${esc(l.nombre)}${puede('plata') ? ' — ' + plata(v.adulto) : ''}</option>`; }).join('')}</select></label>
    <div class="dos"><label class="campo"><span>Adultos</span><input name="adultos" type="number" inputmode="numeric" min="0" value="${e.adultos || ''}"></label>
      <label class="campo"><span>Menores</span><input name="menores" type="number" inputmode="numeric" min="0" value="${e.menores || ''}"></label></div>
    <div class="campo"><span>Extras</span>${servicios.map(s => `<label class="extra-item"><input type="checkbox" name="x-${s.id}"${tiene(s.id) ? ' checked' : ''}><span>${esc(s.nombre)}</span>${puede('plata') ? `<small>${plata(tiene(s.id) ? tiene(s.id).precio : s.precio)}</small>` : ''}</label>`).join('')}</div>
    <div class="botones" style="margin-top:8px"><button class="btn acento ancho">${nuevo ? 'Guardar fiesta' : 'Guardar cambios'}</button></div>
    ${!nuevo && puede('plata') ? `<div class="botones" style="margin-top:10px"><button type="button" class="btn peligro ancho" data-a="borrar-fiesta" data-id="${e.id}">${ico('basura', 'ch')}Borrar esta fiesta</button></div>` : ''}
  </form>`;
}
function abrirFiesta(e) {
  hoja(e.id ? 'Editar fiesta' : 'Fiesta nueva', formFiesta(e), h => {
    const f = $('form', h);
    const revisar = () => {
      const fecha = val(h, 'fecha'), turno = val(h, 'turno');
      const otra = DB.d.eventos.find(x => x.id !== e.id && x.fecha === fecha && x.turno === turno && x.estado !== 'cancelada');
      $('#choque', h).innerHTML = otra ? `<div class="error-campo">${ico('alerta', 'ch')}<span>Ese día a ${turno === 'noche' ? 'la noche' : 'mediodía'} ya está ${esc(otra.titulo)} (${ESTADOS[otra.estado].toLowerCase()}).</span></div>` : '';
      return otra;
    };
    f.fecha.addEventListener('change', revisar); f.turno.addEventListener('change', revisar); revisar();
  });
}

/* ═════════════ Pagos ═════════════ */
RUTAS.pagos = (vista = 'movimientos', mesQ) => {
  if (!puede('plata')) return null;
  const hoy = F.hoy(), mes = /^\d{4}-\d{2}$/.test(mesQ || '') ? mesQ : hoy.slice(0, 7);
  const [y, m] = mes.split('-').map(Number);
  const ant = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const sig = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const delMes = DB.d.pagos.filter(p => p.fecha.slice(0, 7) === mes).sort((a, b) => a.fecha < b.fecha ? 1 : -1);
  const total = delMes.reduce((t, p) => t + p.monto, 0);
  const porMedio = MEDIOS.map(md => [md, delMes.filter(p => p.medio === md).reduce((t, p) => t + p.monto, 0)]).filter(x => x[1]);
  const conSaldo = DB.d.eventos.filter(activa).map(e => ({ e, c: cuentas(e) })).filter(x => x.c.saldo > 0).sort((a, b) => a.e.fecha < b.e.fecha ? -1 : 1);
  const porCobrar = conSaldo.reduce((t, x) => t + x.c.saldo, 0);
  const tabs = `<div class="filtros"><button data-a="ruta" data-r="pagos/movimientos/${mes}"${pres(vista !== 'saldos')}>Cobros del mes</button><button data-a="ruta" data-r="pagos/saldos"${pres(vista === 'saldos')}>Saldos por fiesta<b>${conSaldo.length}</b></button></div>`;
  let cuerpo;
  if (vista === 'saldos') {
    cuerpo = `<div class="kpis" style="margin-bottom:12px"><div class="kpi alerta"><div class="et">Por cobrar</div><div class="val">${plata(porCobrar)}</div></div><div class="kpi"><div class="et">Fiestas con saldo</div><div class="val">${conSaldo.length}</div></div></div>
      <div class="lista-t">${conSaldo.map(({ e, c }) => `<a class="tarjeta" href="#/fiesta/${e.id}"><div class="cab-t"><b>${esc(e.titulo)}</b><span class="monto" style="font-weight:800">${plata(c.saldo)}</span></div><div class="sub">${F.num(e.fecha)} · ${esc(e.cliente.nombre)} · pagó ${Math.round(c.frac * 100)}%</div><div class="barra-p"><i style="width:${Math.round(c.frac * 100)}%"></i></div></a>`).join('') || `<div class="tarjeta">${vacio('check', 'Nadie debe nada.')}</div>`}</div>`;
  } else {
    cuerpo = `<div class="cal-cab"><h2>${MESES[m - 1]} ${y}</h2><a class="redondo chico" href="#/pagos/movimientos/${ant}" aria-label="Mes anterior">${ico('atras', 'ch')}</a><a class="redondo chico" href="#/pagos/movimientos/${sig}" aria-label="Mes siguiente">${ico('der', 'ch')}</a></div>
      <div class="caja-plata" style="margin-bottom:12px"><div class="nums" style="border:0;padding:0;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))"><div><span>Cobrado</span><b style="font-size:24px">${plata(total)}</b></div>${porMedio.map(([md, v]) => `<div><span>${md}</span><b>${plata(v)}</b></div>`).join('')}</div></div>
      <div class="tarjeta">${delMes.length ? `<table class="tabla"><thead><tr><th>Fecha</th><th>Fiesta</th><th class="num">Monto</th></tr></thead><tbody>${delMes.map(p => { const e = DB.get('eventos', p.evento); return `<tr data-a="editar-pago" data-id="${p.id}" style="cursor:pointer"><td>${F.num(p.fecha)}</td><td><b>${esc(e ? e.titulo : '—')}</b><div class="sub">${esc(p.concepto)} · ${esc(p.medio)}</div></td><td class="num"><b>${plata(p.monto)}</b></td></tr>`; }).join('')}</tbody></table>` : vacio('plata', 'No hubo cobros este mes.')}</div>
      <div class="botones" style="margin-top:12px"><button class="btn borde" data-a="csv" data-mes="${mes}">${ico('bajar', 'ch')}Bajar la planilla</button><button class="btn acento" data-a="nuevo-pago">${ico('mas', 'ch')}Cargar pago</button></div>`;
  }
  return barra('Pagos', 'mas') + tabs + cuerpo;
};

function formPago(p) {
  const hoy = F.hoy();
  const fiestas = DB.d.eventos.filter(e => e.estado !== 'cancelada' && (e.fecha >= F.sumar(hoy, -60) || e.id === p.evento)).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  return `<form data-f="pago" data-id="${p.id || ''}">
    <label class="campo"><span>Fiesta</span><select name="evento" required><option value="">Elegí la fiesta…</option>${fiestas.map(e => `<option value="${e.id}"${sel(p.evento, e.id)}>${esc(e.titulo)} — ${F.num(e.fecha)}</option>`).join('')}</select></label>
    <div class="dos"><label class="campo"><span>Monto</span><input name="monto" inputmode="numeric" value="${p.monto || ''}" placeholder="$" required autofocus></label>
      <label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${p.fecha || hoy}" required></label></div>
    <div class="campo"><span>Medio</span><div class="segmentos" data-seg="medio">${MEDIOS.map(x => `<button type="button" data-v="${x}"${pres((p.medio || 'Transferencia') === x)}>${x}</button>`).join('')}</div><input type="hidden" name="medio" value="${esc(p.medio || 'Transferencia')}"></div>
    <div class="campo"><span>Concepto</span><div class="segmentos" data-seg="concepto">${CONCEPTOS.map(x => `<button type="button" data-v="${x}"${pres((p.concepto || 'Cuota') === x)}>${x}</button>`).join('')}</div><input type="hidden" name="concepto" value="${esc(p.concepto || 'Cuota')}"></div>
    <label class="campo"><span>Nota (opcional)</span><input name="nota" value="${esc(p.nota || '')}" placeholder="N.º de operación, quién trajo la plata…"></label>
    <p class="ayuda" id="queda"></p>
    <button class="btn acento ancho">${p.id ? 'Guardar cambios' : 'Guardar pago'}</button>
    ${p.id ? `<button type="button" class="btn peligro ancho" style="margin-top:10px" data-a="borrar-pago" data-id="${p.id}">${ico('basura', 'ch')}Borrar este pago</button>` : ''}
  </form>`;
}
function abrirPago(p) {
  hoja(p.id ? 'Editar pago' : 'Pago nuevo', formPago(p), h => {
    const calc = () => {
      const e = DB.get('eventos', val(h, 'evento')); const m = num(h, 'monto');
      if (!e) { $('#queda', h).textContent = ''; return; }
      const tmp = { id: '__tmp', evento: e.id, fecha: val(h, 'fecha') || F.hoy(), monto: m };
      const orig = DB.d.pagos; DB.d.pagos = orig.filter(x => x.id !== p.id).concat(m ? [tmp] : []);
      const c = cuentas(e); DB.d.pagos = orig;
      $('#queda', h).textContent = c.saldo ? `Con este pago le queda un saldo de ${plata(c.saldo)} (a valores de hoy).` : 'Con este pago queda todo pagado.';
    };
    $$('input,select', h).forEach(x => x.addEventListener('input', calc)); calc();
  });
}

/* ═════════════ Precios y aumentos ═════════════ */
RUTAS.precios = () => {
  if (!puede('precios')) return null;
  const hoy = F.hoy();
  return `${barra('Precios y aumentos', 'mas')}
    <p class="sub" style="margin:-6px 2px 14px">Cuando sube la tarjeta, cargá el valor nuevo acá: la app calcula el saldo nuevo de cada fiesta y te arma el mensaje para cada cliente.</p>
    <div class="lista-t">${DB.d.precios.map(l => {
      const v = vigente(l.id, hoy), futuro = l.historial.filter(h => h.desde > hoy).sort((a, b) => a.desde < b.desde ? -1 : 1)[0];
      const hist = l.historial.slice().sort((a, b) => a.desde < b.desde ? 1 : -1);
      return `<div class="tarjeta" data-id="${l.id}"><div class="cab-t"><h3>${ico('etiqueta')}${esc(l.nombre)}</h3><button class="redondo chico" data-a="editar-lista" data-id="${l.id}" aria-label="Cambiar nombre">${ico('lapiz', 'ch')}</button></div>
        <div class="kpis" style="margin:10px 0"><div class="kpi" style="box-shadow:none;background:var(--superficie-2)"><div class="et">Adulto</div><div class="val">${plata(v.adulto)}</div></div><div class="kpi" style="box-shadow:none;background:var(--superficie-2)"><div class="et">Menor</div><div class="val">${plata(v.menor)}</div></div></div>
        ${futuro ? `<p class="chip senada" style="margin:0 0 10px">Desde el ${F.num(futuro.desde)}: ${plata(futuro.adulto)} / ${plata(futuro.menor)}</p>` : ''}
        <details><summary class="sub" style="cursor:pointer;font-weight:600">Historial (${hist.length})</summary>${hist.map(h => `<div class="fila"><div class="crece">Desde el ${F.num(h.desde)}</div><span class="monto">${plata(h.adulto)} · ${plata(h.menor)}</span></div>`).join('')}</details>
        <button class="btn acento ancho" style="margin-top:12px" data-a="aumento" data-id="${l.id}">${ico('flecha', 'ch')}Cargar aumento</button></div>`;
    }).join('')}</div>
    <button class="btn borde ancho" style="margin-top:12px" data-a="nueva-lista">${ico('mas', 'ch')}Otra tarjeta</button>
    <h2 class="sec">Extras que se ofrecen <button data-a="servicio">${ico('mas', 'ch')}Agregar</button></h2>
    <div class="tarjeta">${DB.d.servicios.map(s => `<div class="fila tocable" data-a="servicio" data-id="${s.id}" role="button" tabindex="0"><div class="crece"><b>${esc(s.nombre)}</b></div><span class="monto">${plata(s.precio)}</span>${ico('der', 'ch')}</div>`).join('') || vacio('etiqueta', 'Sin extras cargados.')}</div>
    <p class="sub" style="font-size:12.5px;margin:10px 2px">Los extras quedan al precio del día que se contrataron.</p>`;
};
function abrirAumento(l) {
  const v = vigente(l.id, F.hoy());
  hoja('Aumento · ' + l.nombre, `<form data-f="aumento" data-id="${l.id}">
    <label class="campo"><span>Desde qué día</span><input type="date" name="desde" value="${F.hoy()}" required></label>
    <div class="dos"><label class="campo"><span>Adulto (antes ${plata(v.adulto)})</span><input name="adulto" inputmode="numeric" value="${v.adulto}" required autofocus></label>
      <label class="campo"><span>Menor (antes ${plata(v.menor)})</span><input name="menor" inputmode="numeric" value="${v.menor}"></label></div>
    <div class="segmentos" style="margin:-2px 0 14px">${[5, 8, 10, 15].map(n => `<button type="button" data-a="pct" data-p="${n}" data-ad="${v.adulto}" data-me="${v.menor}">+${n}%</button>`).join('')}</div>
    <div id="afecta"></div>
    <button class="btn acento ancho">Guardar aumento</button></form>`, h => {
    const calc = () => {
      const nueva = clon(l); nueva.historial.push({ desde: val(h, 'desde') || F.hoy(), adulto: num(h, 'adulto'), menor: num(h, 'menor') });
      const af = afectadosPor(nueva, val(h, 'desde') || F.hoy());
      $('#afecta', h).innerHTML = af.length ? `<div class="tarjeta" style="margin-bottom:12px"><b>${af.length} ${af.length === 1 ? 'fiesta queda' : 'fiestas quedan'} para avisar</b>${af.map(x => `<div class="fila"><div class="crece">${esc(x.evento.titulo)}<div class="sub">${esc(x.evento.cliente.nombre)}</div></div><span class="monto">${plata(x.antes)} → ${plata(x.despues)}</span></div>`).join('')}</div>` : '<p class="ayuda">No cambia el saldo de ninguna fiesta con fecha por delante.</p>';
    };
    $$('input', h).forEach(x => x.addEventListener('input', calc)); calc();
  });
}

RUTAS.avisos = () => {
  if (!puede('plata')) return null;
  const pend = DB.d.avisos.filter(a => a.estado === 'pendiente'), env = DB.d.avisos.filter(a => a.estado === 'enviado').slice(-15).reverse();
  const tarjeta = a => {
    const e = DB.get('eventos', a.evento); if (!e) return '';
    return `<div class="tarjeta" data-id="${a.id}"><div class="cab-t"><b>${esc(e.cliente.nombre)}</b><span class="chip ${a.estado === 'enviado' ? 'ok' : 'senada'}">${a.estado === 'enviado' ? 'Avisado' : 'Para avisar'}</span></div>
      <div class="sub">${esc(e.titulo)} · ${F.num(e.fecha)} · saldo ${plata(a.antes)} → <b>${plata(a.despues)}</b></div>
      ${a.estado === 'pendiente' ? `<div class="mensaje">${esc(mensajeAumento(a))}</div>
      <div class="botones">${e.cliente.tel ? `<a class="btn acento" href="${esc(linkWa(e.cliente.tel, mensajeAumento(a)))}" target="_blank" rel="noopener" data-a="aviso-enviado" data-id="${a.id}">${ico('chat', 'ch')}Mandar por WhatsApp</a>` : '<span class="sub">Falta el teléfono del cliente.</span>'}<button class="btn borde" data-a="aviso-listo" data-id="${a.id}">Ya le avisé</button></div>` : `<div class="sub" style="margin-top:4px">Avisado el ${F.cuando(a.enviadoEl)}</div>`}</div>`;
  };
  return `${barra('Avisos de aumento', 'mas')}
    <p class="sub" style="margin:-6px 2px 14px">Cada botón abre WhatsApp con el mensaje listo; lo mandás con un toque. El texto se cambia en Ajustes.</p>
    <div class="lista-t">${pend.map(tarjeta).join('') || `<div class="tarjeta">${vacio('check', 'No hay nadie para avisar.')}</div>`}</div>
    ${env.length ? `<h2 class="sec">Ya avisados</h2><div class="lista-t">${env.map(tarjeta).join('')}</div>` : ''}`;
};

/* ═════════════ Stock ═════════════ */
let catStock = '';
RUTAS.stock = (vista = 'todo') => {
  if (!puede('stock')) return null;
  const faltan = DB.d.productos.filter(enFalta);
  const camino = DB.d.pedidos.filter(o => o.estado === 'enviado');
  const tabs = [['todo', 'Todo', DB.d.productos.length], ['faltantes', 'Faltantes', faltan.length], ['pedidos', 'Pedidos', camino.length], ['contar', 'Contar', '']];
  const cab = `${barra('Stock', '', `<button class="redondo oscuro" data-a="producto" aria-label="Producto nuevo">${ico('mas')}</button>`)}
    <div class="filtros">${tabs.map(([k, t, n]) => `<button data-a="ruta" data-r="stock/${k}"${pres(vista === k)}>${t}${n !== '' ? `<b>${n}</b>` : ''}</button>`).join('')}</div>`;
  if (vista === 'faltantes') {
    const porProv = {};
    for (const p of faltan) (porProv[p.proveedor || ''] = porProv[p.proveedor || ''] || []).push(p);
    return cab + (Object.keys(porProv).length ? Object.entries(porProv).map(([pv, ps]) => {
      const prov = DB.get('proveedores', pv);
      return `<div class="tarjeta" data-id="prov-${pv}"><div class="cab-t"><h3>${ico('camion')}${esc(prov ? prov.nombre : 'Sin proveedor')}</h3></div>
        <form data-f="pedido" data-prov="${pv}">${ps.map(p => `<div class="fila"><div class="crece"><b>${esc(p.nombre)}</b><div class="sub">Hay ${p.stock} · mínimo ${p.minimo}${enCamino(p.id) ? ' · <b>ya pedido</b>' : ''}</div></div>
          <label style="display:flex;align-items:center;gap:6px"><span class="oculto">Cantidad a pedir de ${esc(p.nombre)}</span><input name="q-${p.id}" inputmode="numeric" value="${enCamino(p.id) ? 0 : aPedir(p)}" style="width:64px;text-align:center;border:1.5px solid var(--linea);border-radius:12px;padding:8px;background:var(--superficie)"><small class="sub">${esc(p.unidad)}</small></label></div>`).join('')}
        <button class="btn acento ancho" style="margin-top:10px">${prov && prov.tel ? ico('chat', 'ch') + 'Armar pedido y mandar' : ico('check', 'ch') + 'Anotar el pedido'}</button></form></div>`;
    }).join('') : `<div class="tarjeta">${vacio('check', 'No falta nada.')}</div>`);
  }
  if (vista === 'pedidos') {
    const viejos = DB.d.pedidos.filter(o => o.estado === 'recibido').slice(-10).reverse();
    const fila = o => { const pv = DB.get('proveedores', o.proveedor); return `<div class="tarjeta" data-id="${o.id}"><div class="cab-t"><b>${esc(pv ? pv.nombre : 'Sin proveedor')}</b><span class="chip ${o.estado === 'recibido' ? 'ok' : 'consulta'}">${o.estado === 'recibido' ? 'Llegó' : 'En camino'}</span></div>
      <div class="sub">Pedido el ${F.num(o.fecha)}${o.recibido ? ' · llegó el ' + F.num(o.recibido) : ''}</div>
      ${o.items.map(i => { const p = DB.get('productos', i.producto); return `<div class="fila"><div class="crece">${esc(p ? p.nombre : '—')}</div><span class="monto">${i.llego ?? i.cant} ${esc(p ? p.unidad : '')}</span></div>`; }).join('')}
      ${o.estado === 'enviado' ? `<button class="btn ancho" style="margin-top:8px" data-a="llego" data-id="${o.id}">${ico('check', 'ch')}Llegó: sumar al stock</button>` : ''}</div>`; };
    return cab + `<div class="lista-t">${camino.map(fila).join('') || `<div class="tarjeta">${vacio('camion', 'No hay pedidos en camino.')}</div>`}</div>${viejos.length ? `<h2 class="sec">Recibidos</h2><div class="lista-t">${viejos.map(fila).join('')}</div>` : ''}`;
  }
  if (vista === 'contar') {
    return cab + `<p class="sub" style="margin:0 2px 12px">Para el conteo de inventario: escribí lo que hay de verdad y guardá. Solo se toca lo que cambió.</p>
      <form data-f="conteo" class="tarjeta">${CATEGORIAS.map(c => { const ps = DB.d.productos.filter(p => p.categoria === c); return ps.length ? `<h3 style="margin:10px 0 2px;font-size:13px;color:var(--tinta-2)">${c}</h3>` + ps.map(p => `<label class="fila"><span class="crece"><b>${esc(p.nombre)}</b><span class="sub"> · sistema: ${p.stock}</span></span><input name="c-${p.id}" inputmode="numeric" value="${p.stock}" style="width:72px;text-align:center;border:1.5px solid var(--linea);border-radius:12px;padding:8px;background:var(--superficie)"></label>`).join('') : ''; }).join('')}
      <button class="btn acento ancho" style="margin-top:12px">Guardar conteo</button></form>`;
  }
  const cats = CATEGORIAS.filter(c => DB.d.productos.some(p => p.categoria === c));
  const q = norm(busca);
  const ps = DB.d.productos.filter(p => (!catStock || p.categoria === catStock) && (!q || norm(p.nombre + ' ' + (p.alias || []).join(' ')).includes(q)));
  return cab + `<label class="buscador">${ico('buscar')}<span class="oculto">Buscar producto</span><input type="search" id="buscar-s" placeholder="Buscar producto" value="${esc(busca)}"></label>
    <div class="filtros"><button data-a="cat"${pres(!catStock)} data-c="">Todas</button>${cats.map(c => `<button data-a="cat" data-c="${c}"${pres(catStock === c)}>${c}</button>`).join('')}</div>
    <div class="lista-t filas">${ps.map(filaProducto).join('') || `<div class="tarjeta">${vacio('caja', 'No hay productos acá.')}</div>`}</div>`;
};
function filaProducto(p) {
  const pct = Math.min(100, Math.round(p.stock / Math.max(1, p.minimo * 2) * 100));
  const est = p.stock <= p.minimo ? 'bajo' : p.stock <= p.minimo * 1.25 ? 'justo' : '';
  const prov = DB.get('proveedores', p.proveedor);
  return `<div class="tarjeta prod" data-id="${p.id}"><div class="fila tocable" style="padding:0" data-a="producto" data-id="${p.id}" role="button" tabindex="0"><div class="crece"><h3>${esc(p.nombre)}</h3>
      <div class="sub">${esc(p.categoria)}${prov ? ' · ' + esc(prov.nombre) : ''}${enFalta(p) ? ` · <span style="color:var(--acento-texto);font-weight:700">${enCamino(p.id) ? 'pedido' : 'falta'}</span>` : ''}</div>
      <div class="medidor"><i class="${est}" style="width:${pct}%"></i></div></div></div>
    <div class="cuenta-stock"><button class="redondo chico" data-a="mov" data-id="${p.id}" data-m="${p.durable ? 'rotura' : 'uso'}" aria-label="Restar ${esc(p.nombre)}">${ico('menos', 'ch')}</button>
      <span class="n">${p.stock}<small>${esc(p.unidad)}</small></span>
      <button class="redondo chico" data-a="mov" data-id="${p.id}" data-m="entrada" aria-label="Sumar ${esc(p.nombre)}">${ico('mas', 'ch')}</button></div></div>`;
}
const MOVS = { entrada: 'Entró', uso: 'Se usó', rotura: 'Se rompió / perdió', ajuste: 'Hay en total', falta: 'Hay que pedir' };
function formMov(p, mov, cant, evento) {
  const fiestas = DB.d.eventos.filter(e => e.estado !== 'cancelada' && Math.abs(F.dif(F.hoy(), e.fecha)) <= 15);
  return `<form data-f="mov" data-id="${p.id}">
    <p class="sub" style="margin:-6px 2px 14px">Hay <b>${p.stock} ${esc(p.unidad)}</b> · mínimo ${p.minimo}</p>
    <div class="campo"><span>¿Qué pasó?</span><div class="segmentos" data-seg="mov">${Object.entries(MOVS).map(([k, t]) => `<button type="button" data-v="${k}"${pres(mov === k)}>${t}</button>`).join('')}</div><input type="hidden" name="mov" value="${mov}"></div>
    <label class="campo"><span>Cantidad (${esc(p.unidad)})</span><input name="cant" inputmode="numeric" value="${cant ?? ''}" required autofocus></label>
    <label class="campo"><span>¿De qué fiesta? (opcional)</span><select name="evento"><option value="">—</option>${fiestas.map(e => `<option value="${e.id}"${sel(evento, e.id)}>${esc(e.titulo)} — ${F.num(e.fecha)}</option>`).join('')}</select></label>
    <button class="btn acento ancho">Guardar</button></form>`;
}
function formProducto(p) {
  return `<form data-f="producto" data-id="${p.id || ''}">
    <label class="campo"><span>Nombre</span><input name="nombre" value="${esc(p.nombre || '')}" required autofocus></label>
    <div class="dos"><label class="campo"><span>Categoría</span><select name="categoria">${CATEGORIAS.map(c => `<option${sel(p.categoria, c)}>${c}</option>`).join('')}</select></label>
      <label class="campo"><span>Unidad</span><input name="unidad" value="${esc(p.unidad || 'unidades')}"></label></div>
    <div class="dos"><label class="campo"><span>Hay ahora</span><input name="stock" inputmode="numeric" value="${p.stock ?? ''}"></label>
      <label class="campo"><span>Mínimo</span><input name="minimo" inputmode="numeric" value="${p.minimo ?? ''}"></label></div>
    <p class="ayuda">Cuando baja del mínimo pasa a Faltantes.</p>
    <label class="campo"><span>Proveedor</span><select name="proveedor"><option value="">—</option>${DB.d.proveedores.map(v => `<option value="${v.id}"${sel(p.proveedor, v.id)}>${esc(v.nombre)}</option>`).join('')}</select></label>
    <label class="campo"><span>Otros nombres (separados por coma)</span><input name="alias" value="${esc((p.alias || []).join(', '))}" placeholder="coca, cola"></label>
    <p class="ayuda">Sirven para la carga rápida: "faltan 3 coca" encuentra la gaseosa.</p>
    <label class="extra-item"><input type="checkbox" name="durable"${p.durable ? ' checked' : ''}><span>Es vajilla, mantelería o muebles (se rompe, no se gasta)</span></label>
    <button class="btn acento ancho" style="margin-top:8px">${p.id ? 'Guardar cambios' : 'Agregar producto'}</button>
    ${p.id ? `<button type="button" class="btn peligro ancho" style="margin-top:10px" data-a="borrar-producto" data-id="${p.id}">${ico('basura', 'ch')}Borrar producto</button>` : ''}
  </form>${p.id ? historialProducto(p) : ''}`;
}
function historialProducto(p) {
  const ms = DB.d.movimientos.filter(m => m.producto === p.id).slice(-12).reverse();
  if (!ms.length) return '';
  return `<h3 style="margin:22px 2px 6px;font-size:15px">Últimos movimientos</h3><div class="tarjeta">${ms.map(m => { const u = DB.get('usuarios', m.usuario), e = DB.get('eventos', m.evento); return `<div class="fila"><div class="crece"><b>${MOVS[m.mov] || m.mov}</b><div class="sub">${F.cuando(m.cuando)}${u ? ' · ' + esc(u.nombre) : ''}${e ? ' · ' + esc(e.titulo) : ''}</div></div><span class="monto">${m.dif > 0 ? '+' : ''}${m.dif}</span></div>`; }).join('')}</div>`;
}

/* ═════════════ Proveedores ═════════════ */
RUTAS.proveedores = () => `${barra('Proveedores', 'mas', puede('editar') ? `<button class="redondo oscuro" data-a="proveedor" aria-label="Proveedor nuevo">${ico('mas')}</button>` : '')}
  <div class="lista-t filas">${DB.d.proveedores.map(v => `<div class="tarjeta" data-id="${v.id}"><div class="fila" style="padding:0"><span class="avatar">${iniciales(v.nombre)}</span><div class="crece"><b>${esc(v.nombre)}</b><div class="sub">${esc(v.rubro || '')}${v.tel ? ' · ' + esc(v.tel) : ''} · ${DB.d.productos.filter(p => p.proveedor === v.id).length} productos</div></div>
    ${v.tel ? `<a class="redondo chico" href="${esc(linkWa(v.tel, '¡Hola! '))}" target="_blank" rel="noopener" aria-label="WhatsApp">${ico('chat', 'ch')}</a>` : ''}${puede('editar') ? `<button class="redondo chico" data-a="proveedor" data-id="${v.id}" aria-label="Editar">${ico('lapiz', 'ch')}</button>` : ''}</div></div>`).join('') || `<div class="tarjeta">${vacio('camion', 'Sin proveedores.')}</div>`}</div>`;

/* ═════════════ Registro de cargas ═════════════ */
RUTAS.registro = (filtro = 'todo') => {
  const hoy = F.hoy(), yo = Sesion.u.id;
  let rs = DB.d.registro;
  if (!puede('registroTodo') || filtro === 'mias') rs = rs.filter(r => r.usuario === yo);
  if (filtro === 'hoy') rs = rs.filter(r => F.desdeMs(r.cuando - 3 * 36e5) === hoy);
  rs = rs.slice(0, 120);
  return `${barra('Registro de cargas', 'mas')}
    <p class="sub" style="margin:-6px 2px 14px">Todo lo que se carga queda acá, con quién y cuándo. Si algo quedó mal, se corrige o se deshace.</p>
    <div class="filtros">${[['todo', 'Todo'], ['hoy', 'Hoy'], ['mias', 'Lo mío']].filter(x => puede('registroTodo') || x[0] !== 'todo').map(([k, t]) => `<button data-a="ruta" data-r="registro/${k}"${pres(filtro === k)}>${t}</button>`).join('')}</div>
    <div class="tarjeta">${rs.map(r => { const u = DB.get('usuarios', r.usuario); return `<div class="fila ${r.deshecho ? 'deshecho' : ''}" data-id="${r.id}"><span class="avatar chico">${iniciales(u ? u.nombre : '?')}</span><div class="crece"><div class="texto">${esc(r.texto)}</div><div class="sub">${F.cuando(r.cuando)} · ${esc(u ? u.nombre : '—')}${r.deshecho ? ' · deshecho' : ''}</div></div>
      ${r.ir && !r.deshecho ? `<a class="redondo chico" href="#/${esc(r.ir)}" aria-label="Ir a corregir">${ico('lapiz', 'ch')}</a>` : ''}${!r.deshecho && (puede('registroTodo') || r.usuario === yo) ? `<button class="redondo chico" data-a="deshacer" data-id="${r.id}" aria-label="Deshacer">${ico('deshacer', 'ch')}</button>` : ''}</div>`; }).join('') || vacio('reloj', 'Todavía no hay cargas.')}</div>`;
};

/* ═════════════ Buscar en todo ═════════════ */
RUTAS.buscar = (cat = 'todo') => {
  const q = norm(busca), ver = puede('contacto');
  const fs = q ? DB.d.eventos.filter(e => norm(e.titulo + ' ' + TIPOS[e.tipo].nombre + (ver ? ' ' + e.cliente.nombre + ' ' + e.cliente.tel : '')).includes(q)).sort((a, b) => a.fecha < b.fecha ? 1 : -1) : [];
  const ps = q ? DB.d.productos.filter(p => norm(p.nombre + ' ' + (p.alias || []).join(' ') + ' ' + p.categoria).includes(q)) : [];
  const vs = q ? DB.d.proveedores.filter(v => norm(v.nombre + ' ' + (v.rubro || '')).includes(q)) : [];
  const chips = [['todo', 'Todo', fs.length + ps.length + vs.length], ['fiestas', 'Fiestas', fs.length], ['productos', 'Productos', ps.length], ['proveedores', 'Proveedores', vs.length]];
  const sec = (k, t, arr, fn) => (cat === 'todo' || cat === k) && arr.length ? `<details class="grupo" open><summary>${t}<b>${arr.length}</b></summary><div class="lista-t filas">${(cat === 'todo' ? arr.slice(0, 5) : arr).map(fn).join('')}</div>${cat === 'todo' && arr.length > 5 ? `<button class="mas-r" data-a="ruta" data-r="buscar/${k}">Ver los ${arr.length}</button>` : ''}</details>` : '';
  const cuerpo = sec('fiestas', 'Fiestas', fs, filaFiesta) + sec('productos', 'Productos', ps, filaProducto) + sec('proveedores', 'Proveedores', vs, v => `<div class="tarjeta"><div class="fila" style="padding:0"><span class="avatar">${iniciales(v.nombre)}</span><div class="crece"><b>${esc(v.nombre)}</b><div class="sub">${esc(v.rubro || '')}</div></div></div></div>`);
  return `${barra('Buscar', 'inicio')}
    <label class="buscador">${ico('buscar')}<span class="oculto">Buscar</span><input type="search" id="buscar-g" placeholder="Fiestas, clientes, productos…" value="${esc(busca)}" autofocus></label>
    <div class="filtros">${chips.map(([k, t, n]) => `<button data-a="ruta" data-r="buscar/${k}"${pres(cat === k)}>${t}${q ? `<b>${n}</b>` : ''}</button>`).join('')}</div>
    ${q ? (cuerpo || `<div class="tarjeta">${vacio('buscar', 'No encontré nada con eso.')}</div>`) : `<div class="tarjeta">${vacio('buscar', 'Buscá una fiesta, un cliente, un teléfono o un producto.')}</div>`}`;
};

/* ═════════════ Más, usuarios y ajustes ═════════════ */
RUTAS.mas = () => {
  const t = (r, i, b, s) => `<a href="#/${r}"><span class="ico">${ico(i)}</span><span><b>${b}</b><small>${s}</small></span></a>`;
  const av = DB.d.avisos.filter(a => a.estado === 'pendiente').length;
  return `<div class="barra"><span class="avatar">${iniciales(Sesion.u.nombre)}</span><h1>${esc(Sesion.u.nombre)}<div class="sub" style="font-weight:600">${ROLES[Sesion.u.rol]}</div></h1></div>
    <div class="mosaico">
      ${puede('plata') ? t('pagos', 'plata', 'Pagos', 'Planilla y saldos') + t('precios', 'etiqueta', 'Precios', 'Tarjetas y aumentos') + t('avisos', 'campana', 'Avisos', av ? av + ' para mandar' : 'Al día') : ''}
      ${Sesion.u.rol !== 'empleado' ? t('stock', 'caja', 'Stock', DB.d.productos.filter(enFalta).length + ' faltantes') : ''}
      ${puede('fiestas') && Sesion.u.rol === 'empleado' ? t('fiestas', 'copa', 'Fiestas', 'Las que vienen') : ''}
      ${t('proveedores', 'camion', 'Proveedores', DB.d.proveedores.length + ' cargados')}
      ${t('registro', 'reloj', 'Registro', 'Corregir cargas')}
      ${puede('usuarios') ? t('usuarios', 'usuarios', 'Usuarios', DB.d.usuarios.filter(u => u.activo).length + ' activos') : ''}
      ${puede('ajustes') ? t('ajustes', 'ajustes', 'Ajustes', 'Salón, mensaje, copia') : ''}
      <button data-a="salir"><span class="ico">${ico('salir')}</span><span><b>Salir</b><small>Cambiar de usuario</small></span></button>
    </div>`;
};
RUTAS.usuarios = () => {
  if (!puede('usuarios')) return null;
  return `${barra('Usuarios', 'mas', `<button class="redondo oscuro" data-a="usuario" aria-label="Usuario nuevo">${ico('mas')}</button>`)}
    <div class="tarjeta">${DB.d.usuarios.map(u => `<div class="fila tocable ${u.activo ? '' : 'deshecho'}" data-a="usuario" data-id="${u.id}" role="button" tabindex="0"><span class="avatar">${iniciales(u.nombre)}</span><div class="crece"><b>${esc(u.nombre)}</b><div class="sub">${ROLES[u.rol]}${u.activo ? '' : ' · desactivado'}</div></div>${ico('der', 'ch')}</div>`).join('')}</div>
    <div class="tarjeta"><h3>Qué ve cada uno</h3><div class="sub" style="line-height:1.6"><b>Dueño:</b> todo, la plata incluida.<br><b>Encargado:</b> agenda, fiestas, clientes y stock. No ve montos.<br><b>Empleado:</b> agenda, stock y lo que él mismo cargó.</div></div>`;
};
RUTAS.ajustes = () => {
  if (!puede('ajustes')) return null;
  const a = DB.d.ajustes;
  return `${barra('Ajustes', 'mas')}
    <form data-f="ajustes" class="tarjeta">
      <label class="campo"><span>Nombre del salón</span><input name="salon" value="${esc(a.salon)}"></label>
      <label class="campo"><span>Mensaje de aumento</span><textarea name="plantilla" rows="6">${esc(a.plantilla)}</textarea></label>
      <p class="ayuda">Se reemplazan solos: {cliente} {salon} {desde} {adulto} {menor} {fiesta} {saldo}</p>
      <label class="campo"><span>Avisarme si la tarjeta no se actualiza en … días</span><input name="revisarCada" inputmode="numeric" value="${a.revisarCada || ''}" placeholder="30"></label>
      <button class="btn acento ancho">Guardar</button></form>
    <h2 class="sec">Copia de seguridad</h2>
    <div class="tarjeta"><p class="sub" style="margin:0 0 12px">Por ahora los datos viven en este teléfono. Bajá una copia de vez en cuando.</p>
      <div class="botones"><button class="btn borde" data-a="exportar">${ico('bajar', 'ch')}Bajar copia</button><label class="btn borde" style="cursor:pointer">Restaurar copia<input type="file" accept="application/json" id="restaurar" class="oculto"></label></div></div>
    <h2 class="sec">Datos</h2>
    <div class="tarjeta"><div class="botones"><button class="btn borde" data-a="demo">Volver a los de ejemplo</button><button class="btn peligro" data-a="cero">Empezar de cero</button></div>
      <p class="sub" style="margin:12px 0 0;font-size:12.5px">"Empezar de cero" borra fiestas, pagos, stock y registro de este teléfono. Quedan los usuarios, las tarjetas y los proveedores.</p></div>
    <div class="tarjeta"><h3>Instalar en el teléfono</h3><p class="sub" style="margin:4px 0 0">iPhone: Compartir → "Agregar a inicio". Android: menú ⋮ → "Instalar app" o "Agregar a la pantalla principal".</p></div>`;
};

/* ═════════════ Carga rápida ═════════════ */
const EJEMPLOS = () => {
  const r = Sesion.u.rol, e = DB.d.eventos.find(x => activa(x)) || { cliente: { nombre: 'Gómez' } };
  const ap = (e.cliente.nombre || 'Gómez').split(' ').pop();
  const st = ['llegaron 30 bolsas de hielo', 'se rompieron 4 copas', 'faltan 2 lavandinas', 'quedan 12 coca'];
  if (r === 'empleado') return st;
  return (puede('plata') ? [`seña 800.000 ${ap} transferencia`] : []).concat([`15 de Pilar 21/3 noche 120 adultos`, `nota ${ap}: traen torta propia`], st.slice(0, 2));
};
function abrirCarga(texto = '') {
  const habla = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  hoja('Carga rápida', `<form data-f="rapida"><div class="rapida"><textarea name="q" rows="1" placeholder="Escribí lo que pasó…" aria-label="Qué querés cargar" autofocus>${esc(texto)}</textarea>
      ${habla ? `<button type="button" class="redondo mic" data-a="dictar" aria-label="Dictar">${ico('mic')}</button>` : ''}</div></form>
    <div class="ejemplos">${EJEMPLOS().map(x => `<button data-a="ejemplo" data-t="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <div id="entendido"></div>
    <h3 class="sub" style="margin:18px 2px 6px;font-weight:700">O elegí qué cargar</h3>
    <div class="manual">${puede('editar') ? `<button data-a="m-fiesta">${ico('copa')}Fiesta</button>` : ''}${puede('plata') ? `<button data-a="m-pago">${ico('plata')}Pago</button>` : ''}<button data-a="m-stock">${ico('caja')}Stock</button>${puede('fiestas') ? `<button data-a="m-nota">${ico('lapiz')}Nota</button>` : ''}</div>`, h => {
    const ta = $('textarea', h);
    let t; ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; clearTimeout(t); t = setTimeout(() => entender(h), 250); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const b = $('#entendido [data-a="confirmar-carga"]', h); if (b) b.click(); } });
    if (texto) entender(h);
    setTimeout(() => ta.focus(), 60);
  });
}
let entendidoAhora = null;
function entender(h) {
  const q = $('textarea', h).value;
  let r = interpretar(q);
  if (r.tipo === 'pago' && !puede('plata')) r = { tipo: '' };
  if ((r.tipo === 'evento' || r.tipo === 'nota') && !puede('fiestas')) r = { tipo: '' };
  if (r.tipo === 'evento' && !puede('editar')) r = { tipo: '' };
  entendidoAhora = r;
  const box = $('#entendido', h);
  if (!q.trim()) { box.innerHTML = ''; return; }
  if (!r.tipo) { box.innerHTML = `<div class="entendido"><div class="que"><span class="ico">${ico('alerta')}</span><span>No me di cuenta qué es<small>Probá con otras palabras o elegí abajo qué cargar.</small></span></div></div>`; return; }
  const fiestaSel = (id, ok = e => e.estado !== 'cancelada') => `<label class="campo"><span>Fiesta</span><select name="evento"><option value="">Elegí la fiesta…</option>${DB.d.eventos.filter(ok).sort((a, b) => a.fecha < b.fecha ? -1 : 1).map(e => `<option value="${e.id}"${sel(id, e.id)}>${esc(e.titulo)} — ${F.num(e.fecha)}</option>`).join('')}</select></label>`;
  let que, campos;
  if (r.tipo === 'pago') {
    que = ['plata', 'Un pago', 'Va a la ficha de la fiesta'];
    campos = `${fiestaSel(r.evento)}<div class="dos"><label class="campo"><span>Monto</span><input name="monto" inputmode="numeric" value="${r.monto}"></label><label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${r.fecha}"></label></div>
      <div class="dos"><label class="campo"><span>Medio</span><select name="medio">${MEDIOS.map(m => `<option${sel(r.medio, m)}>${m}</option>`).join('')}</select></label><label class="campo"><span>Concepto</span><select name="concepto">${CONCEPTOS.map(m => `<option${sel(r.concepto, m)}>${m}</option>`).join('')}</select></label></div>`;
  } else if (r.tipo === 'stock') {
    const p = DB.get('productos', r.producto);
    que = ['caja', MOVS[r.mov] + ' · ' + p.nombre, r.mov === 'falta' ? 'Va a Faltantes, para el próximo pedido' : 'Va al stock (hay ' + p.stock + ')'];
    campos = `<div class="dos"><label class="campo"><span>Producto</span><select name="producto">${DB.d.productos.map(x => `<option value="${x.id}"${sel(r.producto, x.id)}>${esc(x.nombre)}</option>`).join('')}</select></label>
      <label class="campo"><span>Cantidad</span><input name="cant" inputmode="numeric" value="${r.cant}"></label></div>
      <label class="campo"><span>Qué pasó</span><select name="mov">${Object.entries(MOVS).map(([k, t]) => `<option value="${k}"${sel(r.mov, k)}>${t}</option>`).join('')}</select></label>`;
  } else if (r.tipo === 'evento') {
    const choque = r.fecha && DB.d.eventos.find(x => x.fecha === r.fecha && x.turno === r.turno && x.estado !== 'cancelada');
    que = ['copa', 'Una fiesta nueva', 'Se abre su ficha para completarla'];
    campos = `<label class="campo"><span>¿Quién festeja?</span><input name="titulo" value="${esc(r.titulo)}"></label>
      <div class="dos"><label class="campo"><span>Tipo</span><select name="tipo">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}"${sel(r.tipoFiesta || '15', k)}>${t.nombre}</option>`).join('')}</select></label>
      <label class="campo"><span>Turno</span><select name="turno">${Object.entries(TURNOS).map(([k, t]) => `<option value="${k}"${sel(r.turno, k)}>${t}</option>`).join('')}</select></label></div>
      <div class="dos"><label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${r.fecha}"></label><label class="campo"><span>Adultos</span><input name="adultos" inputmode="numeric" value="${r.adultos || ''}"></label></div>
      ${choque ? `<div class="error-campo">${ico('alerta', 'ch')}<span>Ese día y turno ya está ${esc(choque.titulo)}.</span></div>` : ''}`;
  } else {
    que = ['lapiz', 'Una nota', 'Va a la ficha de la fiesta'];
    campos = `${fiestaSel(r.evento)}<label class="campo"><span>Nota</span><input name="texto" value="${esc(r.texto)}"></label>`;
  }
  box.innerHTML = `<form class="entendido" data-f="confirmar"><div class="que"><span class="ico">${ico(que[0])}</span><span>${esc(que[1])}<small>${esc(que[2])}</small></span></div>${campos}
    <button class="btn acento ancho" data-a="confirmar-carga">${ico('check', 'ch')}Confirmar</button></form>`;
}

/* ═════════════ Guardar ═════════════ */
const ok = (reg, msg) => { tostada(msg, reg.id); };
function guardarFiesta(h, id) {
  const viejo = id ? DB.get('eventos', id) : null;
  const e = viejo ? clon(viejo) : { id: nid(), notas: [], tareas: TAREAS_BASE.map((t, i) => ({ id: 't' + i, texto: t, hecha: false })), creado: Date.now(), extras: [] };
  e.tipo = val(h, 'tipo') || '15'; e.titulo = val(h, 'titulo'); e.fecha = val(h, 'fecha'); e.turno = val(h, 'turno'); e.estado = val(h, 'estado');
  e.cliente = { nombre: val(h, 'cnombre'), tel: val(h, 'ctel'), dni: val(h, 'cdni'), mail: val(h, 'cmail') };
  e.lista = val(h, 'lista'); e.adultos = num(h, 'adultos'); e.menores = num(h, 'menores');
  e.extras = DB.d.servicios.filter(s => $(`[name="x-${s.id}"]`, h).checked).map(s => (viejo && viejo.extras.find(x => x.id === s.id)) || { id: s.id, nombre: s.nombre, precio: s.precio, cant: 1 })
    .concat((e.extras || []).filter(x => !DB.d.servicios.some(s => s.id === x.id)));
  if (!e.titulo || !e.fecha) { tostada('Falta quién festeja o la fecha'); return; }
  const choque = DB.d.eventos.find(x => x.id !== e.id && x.fecha === e.fecha && x.turno === e.turno && x.estado !== 'cancelada');
  if (choque && e.estado !== 'cancelada') { tostada('Esa fecha y turno ya están tomados'); return; }
  const reg = cambiar(`${viejo ? 'Editó' : 'Nueva fiesta:'} ${e.titulo} (${F.num(e.fecha)})`, [{ col: 'eventos', nuevo: e }], { ir: 'fiesta/' + e.id, tipo: 'fiesta' });
  cerrarTodo(); ok(reg, viejo ? 'Cambios guardados' : 'Fiesta guardada'); ir('fiesta/' + e.id);
}
function guardarPago(h, id) {
  const viejo = id ? DB.get('pagos', id) : null;
  const p = viejo ? clon(viejo) : { id: nid(), usuario: Sesion.u.id };
  p.evento = val(h, 'evento'); p.monto = num(h, 'monto'); p.fecha = val(h, 'fecha') || F.hoy(); p.medio = val(h, 'medio'); p.concepto = val(h, 'concepto'); p.nota = val(h, 'nota');
  const e = DB.get('eventos', p.evento);
  if (!e || !p.monto) { tostada('Falta la fiesta o el monto'); return; }
  const reg = cambiar(`${viejo ? 'Corrigió pago' : 'Pago'} de ${plata(p.monto)} · ${e.titulo}`, [{ col: 'pagos', nuevo: p }], { ir: 'fiesta/' + e.id, tipo: 'pago' });
  cerrarTodo(); ok(reg, `${viejo ? 'Pago corregido' : 'Pago anotado'}: ${plata(p.monto)}`); ir('fiesta/' + e.id, 'pagos-' + e.id);
}
function guardarMov(pid, mov, cant, evento) {
  const p = clon(DB.get('productos', pid)); if (!p) return;
  cant = Math.max(0, Math.round(cant || 0));
  if (mov === 'falta') {
    p.pedir = cant || aPedir(Object.assign({}, p, { pedir: 0 })) || p.minimo || 1;
    const reg = cambiar(`Hay que pedir ${p.pedir} ${p.unidad} de ${p.nombre}`, [{ col: 'productos', nuevo: p }], { ir: 'stock/faltantes', tipo: 'stock' });
    cerrarTodo(); ok(reg, 'Anotado en faltantes'); ir('stock/faltantes', 'prov-' + (p.proveedor || '')); return;
  }
  if (!cant && mov !== 'ajuste') { tostada('Falta la cantidad'); return; }
  const antes = p.stock;
  p.stock = mov === 'entrada' ? antes + cant : mov === 'ajuste' ? cant : Math.max(0, antes - cant);
  if (mov === 'entrada' && p.stock > p.minimo) p.pedir = 0;
  const m = { id: nid(), producto: p.id, mov, dif: p.stock - antes, cuando: Date.now(), usuario: Sesion.u.id, evento: evento || '' };
  const txt = { entrada: `Entraron ${cant}`, uso: `Se usaron ${cant}`, rotura: `Se rompieron/perdieron ${cant}`, ajuste: `Conteo: hay ${cant}` }[mov];
  const reg = cambiar(`${txt} ${p.unidad} de ${p.nombre}`, [{ col: 'productos', nuevo: p }, { col: 'movimientos', nuevo: m }], { ir: 'stock', tipo: 'stock' });
  cerrarTodo(); ok(reg, `${p.nombre}: ${antes} → ${p.stock}`);
  if (location.hash.startsWith('#/stock')) { resaltar = p.id; render(); } else ir('stock/todo', p.id);
}

/* ═════════════ Toques ═════════════ */
const ACC = {
  cerrar: () => cerrarHoja(),
  elegir: b => { elegido = DB.get('usuarios', b.dataset.id); pin = ''; render(); },
  'otro-usuario': () => { elegido = null; pin = ''; render(); },
  tecla: b => tecla(b.dataset.n),
  'borrar-tecla': () => { pin = pin.slice(0, -1); render(); },
  salir: () => { Sesion.salir(); cerrarTodo(); location.hash = ''; render(); },
  ruta: b => ir(b.dataset.r),
  cargar: () => abrirCarga(),
  calc: () => abrirCalc(),
  'cerrar-pil': (b, e) => { e.preventDefault(); e.stopPropagation(); try { sessionStorage.setItem('pil:' + b.dataset.t, '1'); } catch (x) { } b.closest('.pildora').remove(); },
  'deshacer-t': b => { const m = deshacer(b.dataset.id); $('#tostada').classList.remove('ver'); if (m) tostada(m); else { tostada('Listo, deshecho'); render(); } },
  deshacer: b => {
    const r = DB.d.registro.find(x => x.id === b.dataset.id);
    const m = deshacer(b.dataset.id);
    if (m === 'Eso se volvió a cambiar después.') confirmar('¿Deshacer igual?', 'Después de esta carga se volvió a tocar lo mismo. Si la deshacés, se pierden también esos cambios.', 'Deshacer igual', () => { deshacer(r.id, true); tostada('Deshecho'); render(); }, true);
    else { tostada(m || 'Deshecho'); render(); }
  },
  dia: b => ir('agenda/' + b.dataset.d),
  'modo-cal': b => { modoSemana = b.dataset.v === 'semana'; render(); },
  'nueva-fiesta': b => abrirFiesta({ fecha: b.dataset.d || '', turno: b.dataset.turno || 'noche', tipo: '15', estado: 'consulta', lista: DB.d.precios[0] && DB.d.precios[0].id, cliente: {} }),
  'editar-fiesta': b => abrirFiesta(DB.get('eventos', b.dataset.id)),
  'borrar-fiesta': b => {
    const e = DB.get('eventos', b.dataset.id);
    const pagos = DB.d.pagos.filter(p => p.evento === e.id);
    confirmar('¿Borrar ' + e.titulo + '?', `Se borra la ficha${pagos.length ? ' y sus ' + pagos.length + ' pagos' : ''}. Si fue un error, se recupera desde el Registro. Si se suspendió, mejor marcala como Cancelada.`, 'Borrar', () => {
      const reg = cambiar(`Borró la fiesta ${e.titulo} (${F.num(e.fecha)})`, [{ col: 'eventos', id: e.id, nuevo: null }].concat(pagos.map(p => ({ col: 'pagos', id: p.id, nuevo: null }))).concat(DB.d.avisos.filter(a => a.evento === e.id).map(a => ({ col: 'avisos', id: a.id, nuevo: null }))), { tipo: 'fiesta' });
      cerrarTodo(); ok(reg, 'Fiesta borrada'); ir('fiestas');
    }, true);
  },
  estado: b => {
    const e = clon(DB.get('eventos', b.dataset.id)); if (e.estado === b.dataset.v) return;
    if (b.dataset.v !== 'cancelada' && DB.d.eventos.some(x => x.id !== e.id && x.fecha === e.fecha && x.turno === e.turno && x.estado !== 'cancelada')) { tostada('Esa fecha y turno ya están tomados'); return; }
    e.estado = b.dataset.v;
    const reg = cambiar(`${e.titulo}: pasó a ${ESTADOS[e.estado]}`, [{ col: 'eventos', nuevo: e }], { ir: 'fiesta/' + e.id });
    ok(reg, 'Ahora está ' + ESTADOS[e.estado].toLowerCase()); render();
  },
  tarea: b => {
    const e = clon(DB.get('eventos', b.dataset.e)), t = e.tareas.find(x => x.id === b.dataset.t);
    t.hecha = !t.hecha;
    const reg = cambiar(`${e.titulo}: ${t.hecha ? 'hecho' : 'pendiente'} "${t.texto}"`, [{ col: 'eventos', nuevo: e }], { ir: 'fiesta/' + e.id });
    ok(reg, t.hecha ? 'Hecho' : 'Vuelve a pendiente'); render();
  },
  'nuevo-pago': b => abrirPago({ evento: b.dataset.e || '' }),
  'editar-pago': b => { if (puede('plata')) abrirPago(clon(DB.get('pagos', b.dataset.id))); },
  'borrar-pago': b => {
    const p = DB.get('pagos', b.dataset.id), e = DB.get('eventos', p.evento);
    confirmar('¿Borrar este pago?', `${plata(p.monto)} del ${F.num(p.fecha)}${e ? ' · ' + e.titulo : ''}. Se puede recuperar desde el Registro.`, 'Borrar pago', () => {
      const reg = cambiar(`Borró pago de ${plata(p.monto)}${e ? ' · ' + e.titulo : ''}`, [{ col: 'pagos', id: p.id, nuevo: null }], { ir: e ? 'fiesta/' + e.id : 'pagos' });
      cerrarTodo(); ok(reg, 'Pago borrado'); render();
    }, true);
  },
  csv: b => {
    const filas = [['Fecha', 'Fiesta', 'Cliente', 'Concepto', 'Medio', 'Monto', 'Nota']].concat(DB.d.pagos.filter(p => p.fecha.slice(0, 7) === b.dataset.mes).sort((a, c) => a.fecha < c.fecha ? -1 : 1)
      .map(p => { const e = DB.get('eventos', p.evento) || { titulo: '', cliente: {} }; return [F.num(p.fecha), e.titulo, e.cliente.nombre, p.concepto, p.medio, p.monto, p.nota]; }));
    bajar('pagos-' + b.dataset.mes + '.csv', '﻿' + filas.map(f => f.map(x => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n'), 'text/csv');
  },
  aumento: b => abrirAumento(DB.get('precios', b.dataset.id)),
  pct: b => { const h = b.closest('form'), k = 1 + b.dataset.p / 100; h.adulto.value = Math.round(b.dataset.ad * k / 100) * 100; h.menor.value = Math.round(b.dataset.me * k / 100) * 100; h.adulto.dispatchEvent(new Event('input')); },
  'editar-lista': b => { const l = DB.get('precios', b.dataset.id); hoja('Nombre de la tarjeta', `<form data-f="lista" data-id="${l.id}"><label class="campo"><span>Nombre</span><input name="nombre" value="${esc(l.nombre)}" autofocus></label><button class="btn acento ancho">Guardar</button></form>`); },
  'nueva-lista': () => hoja('Tarjeta nueva', `<form data-f="lista"><label class="campo"><span>Nombre</span><input name="nombre" placeholder="Ej.: Tarjeta casamientos" autofocus required></label><div class="dos"><label class="campo"><span>Adulto</span><input name="adulto" inputmode="numeric" required></label><label class="campo"><span>Menor</span><input name="menor" inputmode="numeric"></label></div><button class="btn acento ancho">Guardar</button></form>`),
  servicio: b => { const s = b.dataset.id ? DB.get('servicios', b.dataset.id) : {}; hoja(s.id ? 'Editar extra' : 'Extra nuevo', `<form data-f="servicio" data-id="${s.id || ''}"><label class="campo"><span>Nombre</span><input name="nombre" value="${esc(s.nombre || '')}" required autofocus></label><label class="campo"><span>Precio</span><input name="precio" inputmode="numeric" value="${s.precio || ''}"></label><button class="btn acento ancho">Guardar</button></form>`); },
  'aviso-enviado': b => { setTimeout(() => marcarAviso(b.dataset.id), 300); },
  'aviso-listo': b => marcarAviso(b.dataset.id),
  cat: b => { catStock = b.dataset.c; render(); },
  mov: b => { const p = DB.get('productos', b.dataset.id); hoja(p.nombre, formMov(p, b.dataset.m, '', '')); },
  producto: b => { const p = b.dataset.id ? DB.get('productos', b.dataset.id) : { categoria: 'Bebidas', unidad: 'unidades', stock: 0, minimo: 0 }; hoja(p.id ? p.nombre : 'Producto nuevo', formProducto(p)); },
  'borrar-producto': b => { const p = DB.get('productos', b.dataset.id); confirmar('¿Borrar ' + p.nombre + '?', 'Se puede recuperar desde el Registro.', 'Borrar', () => { const reg = cambiar('Borró el producto ' + p.nombre, [{ col: 'productos', id: p.id, nuevo: null }], { ir: 'stock' }); cerrarTodo(); ok(reg, 'Producto borrado'); render(); }, true); },
  llego: b => {
    const o = DB.get('pedidos', b.dataset.id);
    hoja('Llegó el pedido', `<form data-f="llego" data-id="${o.id}"><p class="sub" style="margin:-6px 2px 12px">Corregí lo que llegó distinto de lo pedido.</p>${o.items.map(i => { const p = DB.get('productos', i.producto); return p ? `<label class="fila"><span class="crece"><b>${esc(p.nombre)}</b><span class="sub"> · pedido ${i.cant}</span></span><input name="l-${p.id}" inputmode="numeric" value="${i.cant}" style="width:72px;text-align:center;border:1.5px solid var(--linea);border-radius:12px;padding:8px;background:var(--superficie)"></label>` : ''; }).join('')}<button class="btn acento ancho" style="margin-top:12px">Sumar al stock</button></form>`);
  },
  proveedor: b => { const v = b.dataset.id ? DB.get('proveedores', b.dataset.id) : {}; hoja(v.id ? 'Editar proveedor' : 'Proveedor nuevo', `<form data-f="proveedor" data-id="${v.id || ''}"><label class="campo"><span>Nombre</span><input name="nombre" value="${esc(v.nombre || '')}" required autofocus></label><label class="campo"><span>Qué trae</span><input name="rubro" value="${esc(v.rubro || '')}"></label><label class="campo"><span>WhatsApp / teléfono</span><input name="tel" type="tel" value="${esc(v.tel || '')}"></label><button class="btn acento ancho">Guardar</button></form>`); },
  usuario: b => {
    const u = b.dataset.id ? DB.get('usuarios', b.dataset.id) : { rol: 'empleado', activo: true };
    hoja(u.id ? u.nombre : 'Usuario nuevo', `<form data-f="usuario" data-id="${u.id || ''}"><label class="campo"><span>Nombre</span><input name="nombre" value="${esc(u.nombre || '')}" required autofocus></label>
      <label class="campo"><span>Rol</span><select name="rol">${Object.entries(ROLES).map(([k, t]) => `<option value="${k}"${sel(u.rol, k)}>${t}</option>`).join('')}</select></label>
      <label class="campo"><span>PIN (4 números)</span><input name="pin" inputmode="numeric" maxlength="4" pattern="\\d{4}" value="${esc(u.pin || '')}" required></label>
      ${u.id ? `<label class="extra-item"><input type="checkbox" name="activo"${u.activo ? ' checked' : ''}><span>Puede entrar</span></label>` : ''}
      <button class="btn acento ancho" style="margin-top:8px">Guardar</button></form>`);
  },
  exportar: () => bajar('mansion-copia-' + F.hoy() + '.json', JSON.stringify(DB.d), 'application/json'),
  demo: () => confirmar('¿Volver a los datos de ejemplo?', 'Se pierde todo lo que cargaste en este teléfono. Bajá una copia antes si la querés.', 'Sí, volver', () => { DB.d = semilla(); DB.guardar(); Sesion.leer(); if (!Sesion.u) Sesion.salir(); tostada('Datos de ejemplo cargados'); ir('inicio'); }, true),
  cero: () => confirmar('¿Empezar de cero?', 'Se borran fiestas, pagos, avisos, stock, pedidos y registro de este teléfono. No se puede deshacer.', 'Borrar todo', () => {
    const d = DB.d; Object.assign(d, { demo: false, eventos: [], pagos: [], avisos: [], movimientos: [], pedidos: [], registro: [] });
    d.productos = []; DB.guardar(); tostada('Listo, todo en blanco'); ir('inicio');
  }, true),
  ejemplo: b => { const h = b.closest('.hoja'), ta = $('textarea', h); ta.value = b.dataset.t; ta.dispatchEvent(new Event('input')); entender(h); },
  dictar: b => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition, rec = new R(), ta = $('textarea', b.closest('.hoja'));
    rec.lang = 'es-AR'; rec.interimResults = true; b.classList.add('escuchando');
    rec.onresult = ev => { ta.value = [...ev.results].map(r => r[0].transcript).join(' '); ta.dispatchEvent(new Event('input')); };
    rec.onend = () => { b.classList.remove('escuchando'); entender(b.closest('.hoja')); };
    rec.onerror = () => { b.classList.remove('escuchando'); tostada('No pude escuchar. ¿Diste permiso al micrófono?'); };
    rec.start();
  },
  'm-fiesta': () => { cerrarTodo(); ACC['nueva-fiesta']({ dataset: {} }); },
  'm-pago': () => { cerrarTodo(); abrirPago({}); },
  'm-stock': () => { cerrarTodo(); ir('stock/todo'); },
  'm-nota': () => { cerrarTodo(); hoja('Nota', `<form data-f="nota-sola"><label class="campo"><span>Fiesta</span><select name="evento" required><option value="">Elegí la fiesta…</option>${DB.d.eventos.filter(activa).map(e => `<option value="${e.id}">${esc(e.titulo)} — ${F.num(e.fecha)}</option>`).join('')}</select></label><label class="campo"><span>Nota</span><textarea name="texto" required></textarea></label><button class="btn acento ancho">Guardar</button></form>`); }
};
function marcarAviso(id) {
  const a = clon(DB.get('avisos', id)); if (!a || a.estado === 'enviado') return;
  a.estado = 'enviado'; a.enviadoEl = Date.now();
  const e = DB.get('eventos', a.evento);
  const reg = cambiar(`Avisó el aumento a ${e ? e.cliente.nombre : '—'}`, [{ col: 'avisos', nuevo: a }], { ir: 'avisos' });
  ok(reg, 'Marcado como avisado'); render();
}
function bajar(nombre, texto, tipo) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

document.addEventListener('click', e => {
  const seg = e.target.closest('.segmentos[data-seg] button');
  if (seg) {
    const g = seg.parentElement; $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === seg ? 'true' : 'false'));
    const inp = g.parentElement.querySelector(`input[name="${g.dataset.seg}"]`); if (inp) { inp.value = seg.dataset.v; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    return;
  }
  const b = e.target.closest('[data-a]');
  if (!b || !ACC[b.dataset.a]) return;
  if (b.tagName === 'A' && b.dataset.a !== 'aviso-enviado') e.preventDefault();
  if (b.dataset.a === 'confirmar-carga') return;
  ACC[b.dataset.a](b, e);
});
/* Deslizar el calendario con el dedo cambia de mes o de semana */
let toque = null;
document.addEventListener('touchstart', e => { const c = e.target.closest('.cal-t'); toque = c ? { x: e.touches[0].clientX, y: e.touches[0].clientY, c } : null; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!toque) return; const t = e.changedTouches[0], dx = t.clientX - toque.x, dy = t.clientY - toque.y;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) ir('agenda/' + (dx < 0 ? toque.c.dataset.sig : toque.c.dataset.ant));
  toque = null;
}, { passive: true });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#capas .velo')) { cerrarHoja(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-a]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'buscar-f' || e.target.id === 'buscar-s' || e.target.id === 'buscar-g') {
    busca = e.target.value; const pos = e.target.selectionStart, id = e.target.id; render();
    const n = $('#' + id); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }
});
document.addEventListener('change', e => {
  if (e.target.id !== 'restaurar' || !e.target.files[0]) return;
  e.target.files[0].text().then(t => {
    let d; try { d = JSON.parse(t); } catch (x) { tostada('Ese archivo no es una copia de la app'); return; }
    if (!d || d.version !== 1 || !Array.isArray(d.eventos)) { tostada('Ese archivo no es una copia de la app'); return; }
    confirmar('¿Restaurar esta copia?', `Tiene ${d.eventos.length} fiestas y ${d.pagos.length} pagos. Reemplaza lo que hay en este teléfono.`, 'Restaurar', () => { DB.d = d; DB.guardar(); Sesion.leer(); tostada('Copia restaurada'); if (!Sesion.u) render(); else ir('inicio'); }, true);
  });
});

/* Los formularios */
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-f]'); if (!f) return;
  e.preventDefault();
  const h = f, id = f.dataset.id, tipo = f.dataset.f;
  if (tipo === 'rapida') { const b = $('#entendido [data-a="confirmar-carga"]', f.closest('.hoja')); if (b) b.click(); return; }
  if (tipo === 'fiesta') return guardarFiesta(h, id);
  if (tipo === 'pago') return guardarPago(h, id);
  if (tipo === 'mov') return guardarMov(id, val(h, 'mov'), num(h, 'cant'), val(h, 'evento'));
  if (tipo === 'confirmar') return confirmarCarga(h);
  if (tipo === 'tarea-nueva' || tipo === 'nota-nueva' || tipo === 'nota-sola') {
    const texto = (val(h, 't') || val(h, 'texto')), eid = f.dataset.e || val(h, 'evento');
    if (!texto || !eid) return;
    const ev = clon(DB.get('eventos', eid));
    if (tipo === 'tarea-nueva') ev.tareas.push({ id: nid(), texto, hecha: false });
    else ev.notas.push({ id: nid(), cuando: Date.now(), usuario: Sesion.u.id, texto });
    const reg = cambiar(`${ev.titulo}: ${tipo === 'tarea-nueva' ? 'para hacer' : 'nota'} "${texto.slice(0, 60)}"`, [{ col: 'eventos', nuevo: ev }], { ir: 'fiesta/' + ev.id });
    cerrarTodo(); ok(reg, tipo === 'tarea-nueva' ? 'Agregado' : 'Nota guardada');
    return ir('fiesta/' + ev.id, 'notas-' + ev.id);
  }
  if (tipo === 'aumento') {
    const l = clon(DB.get('precios', id)), desde = val(h, 'desde') || F.hoy();
    const entrada = { desde, adulto: num(h, 'adulto'), menor: num(h, 'menor') };
    if (!entrada.adulto) { tostada('Falta el valor de adulto'); return; }
    l.historial = l.historial.filter(x => x.desde !== desde).concat([entrada]);
    const af = afectadosPor(l, desde);
    const viejos = DB.d.avisos.filter(a => a.estado === 'pendiente' && af.some(x => x.evento.id === a.evento));
    const avisos = af.map(x => ({ id: nid(), evento: x.evento.id, lista: l.id, desde, adulto: entrada.adulto, menor: entrada.menor, antes: x.antes, despues: x.despues, estado: 'pendiente', creado: Date.now() }));
    const reg = cambiar(`Aumento ${l.nombre}: ${plata(entrada.adulto)} desde el ${F.num(desde)} (${avisos.length} para avisar)`,
      [{ col: 'precios', nuevo: l }].concat(viejos.map(a => ({ col: 'avisos', id: a.id, nuevo: null }))).concat(avisos.map(a => ({ col: 'avisos', nuevo: a }))), { ir: 'avisos' });
    cerrarTodo(); ok(reg, avisos.length ? `Guardado · ${avisos.length} para avisar` : 'Aumento guardado');
    return ir(avisos.length ? 'avisos' : 'precios');
  }
  if (tipo === 'lista') {
    const l = id ? clon(DB.get('precios', id)) : { id: nid(), historial: [{ desde: F.hoy(), adulto: num(h, 'adulto'), menor: num(h, 'menor') }] };
    l.nombre = val(h, 'nombre'); if (!l.nombre) return;
    const reg = cambiar(`${id ? 'Renombró' : 'Nueva'} tarjeta: ${l.nombre}`, [{ col: 'precios', nuevo: l }], { ir: 'precios' }); cerrarTodo(); ok(reg, 'Guardado'); return render();
  }
  if (tipo === 'servicio') {
    const s = id ? clon(DB.get('servicios', id)) : { id: nid() }; s.nombre = val(h, 'nombre'); s.precio = num(h, 'precio'); if (!s.nombre) return;
    const reg = cambiar(`Extra ${s.nombre}: ${plata(s.precio)}`, [{ col: 'servicios', nuevo: s }], { ir: 'precios' }); cerrarTodo(); ok(reg, 'Guardado'); return render();
  }
  if (tipo === 'producto') {
    const p = id ? clon(DB.get('productos', id)) : { id: nid(), pedir: 0 };
    Object.assign(p, { nombre: val(h, 'nombre'), categoria: val(h, 'categoria'), unidad: val(h, 'unidad') || 'unidades', stock: num(h, 'stock'), minimo: num(h, 'minimo'), proveedor: val(h, 'proveedor'), alias: val(h, 'alias').split(',').map(x => x.trim()).filter(Boolean), durable: $('[name="durable"]', h).checked });
    if (!p.nombre) return;
    const reg = cambiar(`${id ? 'Editó' : 'Nuevo'} producto: ${p.nombre}`, [{ col: 'productos', nuevo: p }], { ir: 'stock' }); cerrarTodo(); ok(reg, 'Guardado'); resaltar = p.id; return render();
  }
  if (tipo === 'pedido') {
    const prov = DB.get('proveedores', f.dataset.prov);
    const items = DB.d.productos.filter(p => $(`[name="q-${p.id}"]`, h)).map(p => ({ producto: p.id, cant: num(h, 'q-' + p.id) })).filter(i => i.cant > 0);
    if (!items.length) { tostada('No hay nada para pedir'); return; }
    const o = { id: nid(), proveedor: f.dataset.prov, fecha: F.hoy(), estado: 'enviado', items };
    const prods = items.map(i => { const p = clon(DB.get('productos', i.producto)); p.pedir = 0; return { col: 'productos', nuevo: p }; });
    const reg = cambiar(`Pedido a ${prov ? prov.nombre : 'sin proveedor'} (${items.length} productos)`, [{ col: 'pedidos', nuevo: o }].concat(prods), { ir: 'stock/pedidos' });
    if (prov && prov.tel) {
      const txt = `¡Hola! Te paso el pedido de ${DB.d.ajustes.salon}:\n` + items.map(i => { const p = DB.get('productos', i.producto); return `• ${i.cant} ${p.unidad} de ${p.nombre}`; }).join('\n') + '\n¡Gracias!';
      window.open(linkWa(prov.tel, txt), '_blank', 'noopener');
    }
    ok(reg, 'Pedido anotado'); return ir('stock/pedidos', o.id);
  }
  if (tipo === 'llego') {
    const o = clon(DB.get('pedidos', id)); const cambios = [];
    o.items.forEach(i => {
      const p = clon(DB.get('productos', i.producto)); if (!p) return;
      const n = num(h, 'l-' + p.id); i.llego = n;
      const antes = p.stock; p.stock += n; if (p.stock > p.minimo) p.pedir = 0;
      cambios.push({ col: 'productos', nuevo: p }, { col: 'movimientos', nuevo: { id: nid(), producto: p.id, mov: 'entrada', dif: p.stock - antes, cuando: Date.now(), usuario: Sesion.u.id, evento: '' } });
    });
    o.estado = 'recibido'; o.recibido = F.hoy();
    const prov = DB.get('proveedores', o.proveedor);
    const reg = cambiar(`Llegó el pedido de ${prov ? prov.nombre : '—'}`, [{ col: 'pedidos', nuevo: o }].concat(cambios), { ir: 'stock/pedidos' });
    cerrarTodo(); ok(reg, 'Sumado al stock'); return render();
  }
  if (tipo === 'conteo') {
    const cambios = []; let n = 0;
    for (const p0 of DB.d.productos) {
      const v = num(h, 'c-' + p0.id); if (v === p0.stock) continue;
      const p = clon(p0); p.stock = v; n++;
      cambios.push({ col: 'productos', nuevo: p }, { col: 'movimientos', nuevo: { id: nid(), producto: p.id, mov: 'ajuste', dif: v - p0.stock, cuando: Date.now(), usuario: Sesion.u.id, evento: '' } });
    }
    if (!n) { tostada('No cambió nada'); return; }
    const reg = cambiar(`Conteo de inventario: ${n} ${n === 1 ? 'producto corregido' : 'productos corregidos'}`, cambios, { ir: 'stock' });
    ok(reg, 'Conteo guardado'); return ir('stock/todo');
  }
  if (tipo === 'proveedor') {
    const v = id ? clon(DB.get('proveedores', id)) : { id: nid() }; Object.assign(v, { nombre: val(h, 'nombre'), rubro: val(h, 'rubro'), tel: val(h, 'tel') }); if (!v.nombre) return;
    const reg = cambiar(`${id ? 'Editó' : 'Nuevo'} proveedor: ${v.nombre}`, [{ col: 'proveedores', nuevo: v }], { ir: 'proveedores' }); cerrarTodo(); ok(reg, 'Guardado'); return render();
  }
  if (tipo === 'usuario') {
    const u = id ? clon(DB.get('usuarios', id)) : { id: nid(), activo: true };
    Object.assign(u, { nombre: val(h, 'nombre'), rol: val(h, 'rol'), pin: val(h, 'pin') });
    const act = $('[name="activo"]', h); if (act) u.activo = act.checked;
    if (!u.nombre || !/^\d{4}$/.test(u.pin)) { tostada('Falta el nombre o el PIN de 4 números'); return; }
    if (DB.d.usuarios.some(x => x.id !== u.id && x.pin === u.pin && x.activo)) { tostada('Ese PIN ya lo usa otra persona'); return; }
    const duenos = DB.d.usuarios.filter(x => x.id !== u.id && x.rol === 'dueno' && x.activo).length + (u.rol === 'dueno' && u.activo ? 1 : 0);
    if (!duenos) { tostada('Tiene que quedar al menos un dueño'); return; }
    const reg = cambiar(`${id ? 'Editó' : 'Nuevo'} usuario: ${u.nombre} (${ROLES[u.rol]})`, [{ col: 'usuarios', nuevo: u }], { ir: 'usuarios' });
    if (u.id === Sesion.u.id) Sesion.u = DB.get('usuarios', u.id);
    cerrarTodo(); ok(reg, 'Guardado'); return render();
  }
  if (tipo === 'ajustes') {
    DB.d.ajustes = { salon: val(h, 'salon') || 'La Mansión del Rey', plantilla: val(h, 'plantilla') || PLANTILLA_AUMENTO, revisarCada: num(h, 'revisarCada'), tel: DB.d.ajustes.tel || '' };
    DB.guardar(); tostada('Ajustes guardados'); return render();
  }
});

function confirmarCarga(h) {
  const r = entendidoAhora; if (!r) return;
  if (r.tipo === 'pago') {
    const e = DB.get('eventos', val(h, 'evento')); const monto = num(h, 'monto');
    if (!e || !monto) { tostada('Elegí la fiesta y el monto'); return; }
    const p = { id: nid(), evento: e.id, fecha: val(h, 'fecha') || F.hoy(), monto, medio: val(h, 'medio'), concepto: val(h, 'concepto'), nota: '', usuario: Sesion.u.id };
    const reg = cambiar(`Pago de ${plata(monto)} · ${e.titulo}`, [{ col: 'pagos', nuevo: p }], { ir: 'fiesta/' + e.id, tipo: 'pago' });
    cerrarTodo(); ok(reg, 'Pago anotado: ' + plata(monto)); return ir('fiesta/' + e.id, 'pagos-' + e.id);
  }
  if (r.tipo === 'stock') return guardarMov(val(h, 'producto'), val(h, 'mov'), num(h, 'cant'), r.evento);
  if (r.tipo === 'evento') {
    const fecha = val(h, 'fecha'), turno = val(h, 'turno');
    if (!fecha) { tostada('Falta la fecha'); return; }
    const choque = DB.d.eventos.find(x => x.fecha === fecha && x.turno === turno && x.estado !== 'cancelada');
    if (choque) { tostada('Esa fecha y turno ya están tomados por ' + choque.titulo); return; }
    const tipo = val(h, 'tipo');
    const lista = DB.d.precios.find(l => tipo === 'infantil' ? /infantil/i.test(l.nombre) : tipo === 'corporativo' ? /corpor/i.test(l.nombre) : true) || DB.d.precios[0];
    const e = { id: nid(), tipo, titulo: val(h, 'titulo') || 'Sin nombre', fecha, turno, estado: 'consulta', adultos: num(h, 'adultos'), menores: r.menores || 0, lista: lista ? lista.id : '', cliente: { nombre: '', tel: '', mail: '', dni: '' }, extras: [], notas: [], tareas: TAREAS_BASE.map((t, i) => ({ id: 't' + i, texto: t, hecha: false })), creado: Date.now() };
    const reg = cambiar(`Nueva fiesta: ${e.titulo} (${F.num(fecha)})`, [{ col: 'eventos', nuevo: e }], { ir: 'fiesta/' + e.id, tipo: 'fiesta' });
    cerrarTodo(); ok(reg, 'Fiesta creada · completá los datos'); ir('fiesta/' + e.id); abrirFiesta(DB.get('eventos', e.id)); return;
  }
  if (r.tipo === 'nota') {
    const ev = clon(DB.get('eventos', val(h, 'evento'))); const texto = val(h, 'texto');
    if (!ev || !texto) { tostada('Elegí la fiesta'); return; }
    ev.notas.push({ id: nid(), cuando: Date.now(), usuario: Sesion.u.id, texto });
    const reg = cambiar(`${ev.titulo}: nota "${texto.slice(0, 60)}"`, [{ col: 'eventos', nuevo: ev }], { ir: 'fiesta/' + ev.id });
    cerrarTodo(); ok(reg, 'Nota guardada'); return ir('fiesta/' + ev.id, 'notas-' + ev.id);
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a="confirmar-carga"]'); if (!b) return;
  e.preventDefault(); confirmarCarga(b.closest('form'));
});

/* ── Arranque ── */
DB.cargar();
DB.guardar();
Sesion.leer();
if (!location.hash && Sesion.u) location.hash = '#/inicio';
render();
