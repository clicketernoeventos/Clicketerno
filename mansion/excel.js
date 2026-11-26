/* Bajar todo en un Excel (.xlsx). Se arma en el teléfono, sin internet. */
'use strict';
function cargarScript(src) {
  return new Promise((ok, no) => {
    if (window.XLSX) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = () => ok(); s.onerror = () => no(new Error('No se pudo cargar la librería de Excel'));
    document.head.appendChild(s);
  });
}
async function bajarExcel() {
  await cargarScript('../lib/xlsx.full.min.js');
  const d = DB.d, plata_ = puede('plata'), hoy = F.hoy();
  const ser = f => Math.floor(F.ms(f) / 864e5) + 25569;                    // fecha → número de Excel
  const serH = t => t / 864e5 + 25569 - 3 / 24;                            // instante → hora de Rosario
  const nom = (col, id) => { const x = DB.get(col, id); return x ? (x.titulo || x.nombre || '') : ''; };
  const hoja = (nombre, cab, filas, formatos = {}, anchos = []) => {
    const ws = XLSX.utils.aoa_to_sheet([cab].concat(filas));
    Object.entries(formatos).forEach(([c, z]) => filas.forEach((_, i) => { const a = XLSX.utils.encode_cell({ r: i + 1, c: +c }); if (ws[a]) ws[a].z = z; }));
    ws['!cols'] = cab.map((t, i) => ({ wch: Math.min(40, Math.max(String(t).length, ...filas.map(f => String(f[i] ?? '').length)) + 2) }));
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    return ws;
  };
  const M = '"$" #,##0', wb = XLSX.utils.book_new();
  const evs = d.eventos.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  const cabF = ['Fecha', 'Turno', 'Tipo', 'Quién festeja', 'Cliente', 'Teléfono', 'Adultos', 'Menores', 'Estado'].concat(plata_ ? ['Total hoy', 'Pagado', 'Saldo'] : []);
  XLSX.utils.book_append_sheet(wb, hoja('Fiestas', cabF, evs.map(e => {
    const base = [ser(e.fecha), TURNOS[e.turno] || '', (TIPOS[e.tipo] || {}).nombre || '', e.titulo, puede('contacto') ? (e.cliente.nombre || '') : '', puede('contacto') ? (e.cliente.tel || '') : '', e.adultos || 0, e.menores || 0, ESTADOS[e.estado] || ''];
    if (!plata_) return base;
    const c = cuentas(e); return base.concat([c.totalHoy, c.pagado, c.saldo]);
  }), { 0: 'dd/mm/yyyy', 9: M, 10: M, 11: M }), 'Fiestas');
  if (plata_) XLSX.utils.book_append_sheet(wb, hoja('Pagos', ['Fecha', 'Fiesta', 'Concepto', 'Medio', 'Monto', 'Nota', 'Cargó'],
    d.pagos.slice().sort((a, b) => a.fecha < b.fecha ? 1 : -1).map(p => [ser(p.fecha), nom('eventos', p.evento), p.concepto, p.medio, p.monto, p.nota || '', nom('usuarios', p.usuario)]), { 0: 'dd/mm/yyyy', 4: M }), 'Pagos');
  XLSX.utils.book_append_sheet(wb, hoja('Stock', ['Producto', 'Categoría', 'Hay', 'Unidad', 'Mínimo', 'Proveedor', 'Estado'],
    d.productos.slice().sort((a, b) => (a.categoria + a.nombre) < (b.categoria + b.nombre) ? -1 : 1).map(p => [p.nombre, p.categoria, p.stock, p.unidad, p.minimo, nom('proveedores', p.proveedor), enFalta(p) ? 'FALTA' : 'ok'])), 'Stock');
  XLSX.utils.book_append_sheet(wb, hoja('Pedidos', ['Fecha', 'Proveedor', 'Estado', 'Productos'],
    d.pedidos.slice().sort((a, b) => a.fecha < b.fecha ? 1 : -1).map(o => [ser(o.fecha), nom('proveedores', o.proveedor), o.estado === 'recibido' ? 'Llegó' : 'En camino',
      o.items.map(i => { const p = DB.get('productos', i.producto); return (i.llego ?? i.cant) + ' ' + (p ? p.unidad + ' de ' + p.nombre : '?'); }).join(' · ')]), { 0: 'dd/mm/yyyy' }), 'Pedidos');
  XLSX.utils.book_append_sheet(wb, hoja('Registro', ['Cuándo', 'Quién', 'Qué', 'Estado'],
    d.registro.slice().sort((a, b) => b.cuando - a.cuando).slice(0, 600).map(r => [serH(r.cuando), nom('usuarios', r.usuario), r.texto, r.deshecho ? 'Deshecho' : '']), { 0: 'dd/mm/yyyy hh:mm' }), 'Registro');
  XLSX.writeFile(wb, 'La-Mansion-del-Rey-' + hoy + '.xlsx');
}
