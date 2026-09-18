/* Supabase falso en memoria, controlable por modo.
   modos: ok | fail (500) | net (aborta) | evil (datos maliciosos/rotos) */
/* La base de verdad nunca devuelve más de mil filas de una: sin esto, las
   pruebas pasaban con álbumes que en producción salen cortados. */
const TOPE = 1000;
/* modo: ok | fail | net | evil
   cerrada: si la base tiene corrido blindaje.sql (que es lo que hay en
   producción). Se puede apagar para probar el camino viejo. */
function crearFake(modo = 'ok', cerrada = true) {
  const db = { ce_eventos: [], ce_items: [] };
  const claves = {};                 // codigo -> clave, como la tabla ce_claves
  const archivosFalsos = [];         // lo que hay en el depósito
  const MAESTRA = 'CLAVE-MAESTRA-DE-PRUEBA';
  let subidas = 0;
  const pedidos = { items: 0, tandasBorrado: 0, archivosBorrados: 0 };
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
  /* PostgREST también entiende codigo=in.(A,B,C), que es como el panel pide
     SOLO los eventos cuya clave tiene guardada este aparato. Sin esto el
     falso devolvía la lista vacía y la prueba pasaba por el motivo
     equivocado. */
  const inVals = (v) => (v && v.startsWith('in.(') && v.endsWith(')')
    ? v.slice(4, -1).split(',').map((x) => x.replace(/^"|"$/g, '')).filter(Boolean)
    : null);

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

    // ── borrado de archivos del depósito ──
    if (url.includes('/storage/v1/object/ce-medios') && metodo === 'DELETE') {
      const cuerpo = JSON.parse(request.postData() || '{}');
      pedidos.tandasBorrado++;
      pedidos.archivosBorrados += (cuerpo.prefixes || []).length;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    // ── listado del depósito, con su tope y su offset ──
    if (url.includes('/storage/v1/object/list/')) {
      const cuerpo = JSON.parse(request.postData() || '{}');
      const desde = cuerpo.offset || 0;
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(archivosFalsos.slice(desde, desde + Math.min(cuerpo.limit || TOPE, TOPE))) });
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
    // ── las funciones que puso blindaje.sql ──
    // Sin esto, el camino nuevo de la app (leer un evento o sus recuerdos
    // sin tener la clave) no lo probaba nadie: el falso contestaba 200 con
    // una lista vacía y la app se caía para atrás al camino viejo, que acá
    // sigue abierto. O sea: pasaba todo, y lo nuevo sin medir.
    const envenenar = (filas, tabla) => {
      if (modo !== 'evil') return filas;
      if (tabla === 'ce_eventos') return filas.map((f) => ({
        ...f, fecha: null,
        nombre: '"><img src=x onerror="window.__XSS=1">',
        portada: "x' onerror='window.__XSS2=1",
      }));
      return filas.map((f) => ({
        ...f,
        url: '" onerror="window.__XSS3=1" data-x="',
        autor: '<script>window.__XSS4=1</script>',
        texto: '"><svg onload="window.__XSS5=1">',
      }));
    };
    if (url.includes('/rest/v1/rpc/ce_evento_publico')) {
      const cod = (JSON.parse(request.postData() || '{}')).p_codigo;
      const f = db.ce_eventos.find((e) => e.codigo === cod);
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(f ? envenenar([f], 'ce_eventos')[0] : null) });
    }
    if (url.includes('/rest/v1/rpc/ce_items_de')) {
      const b = JSON.parse(request.postData() || '{}');
      pedidos.items++;
      let out = db.ce_items.filter((i) => i.codigo === b.p_codigo);
      // como la función de verdad: sin la clave del evento, lo que está
      // esperando aprobación no sale
      if (!permitido(b.p_codigo, clave)) out = out.filter((i) => i.estado === 'aprobado');
      out.sort((x, y) => (x.ts - y.ts) || String(x.id).localeCompare(String(y.id)));
      const desde = b.p_desde || 0;
      out = out.slice(desde, desde + Math.min(b.p_cuanto || TOPE, TOPE));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(envenenar(out, 'ce_items')) });
    }
    if (/\/rest\/v1\/rpc\/ce_item(\?|$)/.test(url)) {
      const b = JSON.parse(request.postData() || '{}');
      const f = db.ce_items.find((i) => i.codigo === b.p_codigo && i.id === b.p_id
        && (permitido(b.p_codigo, clave) || i.estado === 'aprobado'));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(f ? envenenar([f], 'ce_items')[0] : null) });
    }
    // Como PostgREST: una función que no existe da 404, no una lista vacía.
    // De eso depende que la app sepa volver al camino viejo.
    if (url.includes('/rest/v1/rpc/')) {
      const conocidas = ['ce_quien_soy','ce_cambiar_clave','ce_evento_publico','ce_items_de','ce_item'];
      if (!conocidas.some((n) => url.includes('/rpc/' + n))) {
        return route.fulfill({ status: 404, contentType: 'application/json',
          body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) });
      }
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
      if (tabla === 'ce_items') pedidos.items++;
      let out = filas.slice();
      /* Como la base DE VERDAD desde blindaje.sql: la regla de SELECT es
         ce_permitido(codigo). Sin la clave del evento (o la maestra) no se
         ve ninguna fila, se pida lo que se pida.
         Antes el falso devolvía todo a cualquiera, así que las pruebas
         corrían contra una base que ya no existe: cualquier pantalla que
         dependiera de leer sin clave pasaba acá y fallaba en producción. */
      if (cerrada) out = out.filter((f) => permitido(f.codigo, clave));
      if (q.codigo) {
        const lista = inVals(q.codigo);
        if (lista) out = out.filter((f) => lista.includes(f.codigo));
        else { const v = eqVal(q.codigo); out = out.filter((f) => f.codigo === v); }
      }
      if (q.id) { const v = eqVal(q.id); out = out.filter((f) => String(f.id) === v); }
      if (q.order && q.order.startsWith('ts.asc')) out.sort((a, b) => a.ts - b.ts);
      if (q.order && q.order.startsWith('creado.desc')) out.sort((a, b) => (b.creado || 0) - (a.creado || 0));
      // como la base de verdad: nunca más de TOPE filas, y respeta offset
      const desde = +(q.offset || 0);
      const pedido = q.limit ? +q.limit : TOPE;
      out = out.slice(desde, desde + Math.min(pedido, TOPE));
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
        if (tabla === 'ce_items' && i < 0 && !permitido(obj.codigo, clave)) {
          // como el disparador ce_forzar_estado: el invitado no elige su estado
          const ev = db.ce_eventos.find((f) => f.codigo === obj.codigo);
          obj.estado = (ev && ev.moderar) ? 'pendiente' : 'aprobado';
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
    db, claves, pedidos, cerrada,
    archivos: archivosFalsos,
    get subidas() { return subidas; },
    instalar: async (page) => {
      await page.route('**/rest/v1/**', (r) => manejar(r, r.request()));
      await page.route('**/storage/v1/**', (r) => manejar(r, r.request()));
    },
  };
}

module.exports = { crearFake };
