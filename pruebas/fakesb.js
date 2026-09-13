/* Supabase falso en memoria, controlable por modo.
   modos: ok | fail (500) | net (aborta) | evil (datos maliciosos/rotos) */
function crearFake(modo = 'ok') {
  const db = { ce_eventos: [], ce_items: [] };
  const claves = {};                 // codigo -> clave, como la tabla ce_claves
  const MAESTRA = '166774';
  let subidas = 0;
  // imita lo que hace la base: solo pasa si la clave es la del evento o la maestra
  const permitido = (codigo, clave) =>
    !!clave && (clave === MAESTRA || (codigo && claves[codigo] === clave));

  const qs = (url) => {
    const q = {};
    const s = url.split('?')[1] || '';
    for (const par of s.split('&')) {
      const [k, v] = par.split('=');
      if (k) q[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
    return q;
  };
  const eqVal = (v) => (v && v.startsWith('eq.') ? v.slice(3) : null);

  async function manejar(route, request) {
    const url = request.url();
    const metodo = request.method();
    const clave = (request.headers()['x-clave']) || '';

    if (modo === 'net') return route.abort('failed');
    if (modo === 'fail') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'relation "ce_eventos" does not exist', code: 'PGRST205' }),
      });
    }

    // ── storage ──
    if (url.includes('/storage/v1/object/')) {
      subidas++;
      const ruta = url.split('/storage/v1/object/ce-medios/')[1] || 'x';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Key: 'ce-medios/' + ruta }),
      });
    }

    // ── funciones de la base ──
    if (url.includes('/rest/v1/rpc/ce_quien_soy')) {
      const cod = (JSON.parse(request.postData() || '{}')).p_codigo;
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ llego_la_clave: !!clave, es_maestra: clave === MAESTRA,
                               puede_editar: permitido(cod, clave) }) });
    }
    if (url.includes('/rest/v1/rpc/ce_cambiar_clave')) {
      const b = JSON.parse(request.postData() || '{}');
      if (!permitido(b.p_codigo, clave))
        return route.fulfill({ status: 403, contentType: 'application/json',
          body: JSON.stringify({ message: 'new row violates row-level security policy' }) });
      claves[b.p_codigo] = b.p_nueva;
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }

    // ── rest ──
    const tabla = url.includes('/rest/v1/ce_items') ? 'ce_items' : 'ce_eventos';
    const q = qs(url);
    const filas = db[tabla];

    if (metodo === 'GET') {
      let out = filas.slice();
      if (q.codigo) { const v = eqVal(q.codigo); out = out.filter((f) => f.codigo === v); }
      if (q.id) { const v = eqVal(q.id); out = out.filter((f) => String(f.id) === v); }
      if (q.order && q.order.startsWith('ts.asc')) out.sort((a, b) => a.ts - b.ts);
      if (q.order && q.order.startsWith('creado.desc')) out.sort((a, b) => (b.creado || 0) - (a.creado || 0));
      if (q.limit) out = out.slice(0, +q.limit);
      if (modo === 'evil' && tabla === 'ce_eventos') {
        out = out.map((f) => ({
          ...f,
          // fecha nula: rompe bonito(); comillas: intento de XSS por atributo
          fecha: null,
          nombre: '"><img src=x onerror="window.__XSS=1">',
          portada: "x' onerror='window.__XSS2=1",
        }));
      }
      if (modo === 'evil' && tabla === 'ce_items') {
        out = out.map((f) => ({
          ...f,
          url: '" onerror="window.__XSS3=1" data-x="',
          autor: '<script>window.__XSS4=1</script>',
          texto: '"><svg onload="window.__XSS5=1">',
        }));
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    }

    if (metodo === 'POST') {
      const cuerpo = JSON.parse(request.postData() || '{}');
      const arr = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
      for (const obj of arr) {
        const pk = tabla === 'ce_items' ? 'id' : 'codigo';
        const i = filas.findIndex((f) => f[pk] === obj[pk]);
        if (tabla === 'ce_eventos' && i < 0) {
          // alta de evento: la base exige clave y la guarda (trigger ce_guardar_clave)
          if (!clave || clave.length < 4)
            return route.fulfill({ status: 400, contentType: 'application/json',
              body: JSON.stringify({ message: 'Falta la clave del evento' }) });
          claves[obj.codigo] = clave;
        }
        if (tabla === 'ce_eventos' && i >= 0 && !permitido(obj.codigo, clave))
          return route.fulfill({ status: 403, contentType: 'application/json',
            body: JSON.stringify({ message: 'new row violates row-level security policy' }) });
        if (i >= 0) filas[i] = { ...filas[i], ...obj }; else filas.push({ ...obj });
      }
      return route.fulfill({ status: 201, contentType: 'application/json', body: '' });
    }

    if (metodo === 'DELETE') {
      const cod = eqVal(q.codigo);
      if (!permitido(cod, clave))
        return route.fulfill({ status: 403, contentType: 'application/json',
          body: JSON.stringify({ message: 'new row violates row-level security policy' }) });
      db[tabla] = filas.filter((f) => f.codigo !== cod);
      if (tabla === 'ce_eventos') delete claves[cod];
      return route.fulfill({ status: 204, body: '' });
    }

    if (metodo === 'PATCH') {
      const cuerpo = JSON.parse(request.postData() || '{}');
      let objetivo = filas;
      if (q.codigo) { const v = eqVal(q.codigo); objetivo = filas.filter((f) => f.codigo === v); }
      if (q.id) { const v = eqVal(q.id); objetivo = filas.filter((f) => String(f.id) === v); }
      // como en la base: se puede editar solo con la clave del evento tocado
      const cods = [...new Set(objetivo.map((f) => f.codigo))];
      if (cods.length && !cods.every((c) => permitido(c, clave)))
        return route.fulfill({ status: 403, contentType: 'application/json',
          body: JSON.stringify({ message: 'new row violates row-level security policy' }) });
      objetivo.forEach((f) => Object.assign(f, cuerpo));
      return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  }

  return {
    db, claves,
    get subidas() { return subidas; },
    instalar: async (page) => {
      await page.route('**/rest/v1/**', (r) => manejar(r, r.request()));
      await page.route('**/storage/v1/**', (r) => manejar(r, r.request()));
    },
  };
}

module.exports = { crearFake };
