/* La conexión con la base (Supabase): ingreso con PIN y sincronización.
   Primero se guarda en el teléfono; cuando hay señal se envía y se recibe.
   Si dos tocan lo mismo, gana el último que guarda (y queda en el registro). */
'use strict';
const SES = 'mansion.sesion.v2', LISTA = 'mansion.lista.v2';
const COLS_SENSIBLES = ['pagos', 'avisos', 'precios', 'servicios'];

const Nube = {
  on: NUBE, ses: null, estado: 'ok', ultima: 0, enCurso: false, timer: null, espera: null, _ref: null,
  url(p) { return CONFIG.url.replace(/\/$/, '') + p; },
  /* La clave nueva (sb_publishable) no es un JWT: solo va en apikey. El Authorization lleva la sesión, si hay. */
  cab(t) { const h = { apikey: CONFIG.clave, 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t; return h; },

  leerSes() { try { this.ses = JSON.parse(localStorage.getItem(SES)); } catch (e) { this.ses = null; } return this.ses; },
  guardarSes(s) { this.ses = s; try { if (s) localStorage.setItem(SES, JSON.stringify(s)); else localStorage.removeItem(SES); } catch (e) { } },
  guardarPerfil(p) { if (this.ses) { this.ses.perfil = p; this.guardarSes(this.ses); } },

  /* La función de accesos (lista, crear dueño, entrar y, para dueños, altas y permisos) */
  async fn(accion, cuerpo, conSesion) {
    const t = conSesion ? await this.token() : null;
    const r = await fetch(this.url('/functions/v1/mansion'), { method: 'POST', headers: this.cab(t), body: JSON.stringify(Object.assign({ accion }, cuerpo || {})) });
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok) throw Object.assign(new Error(j.error || 'Error ' + r.status), { status: r.status });
    return j;
  },

  async token() {
    const s = this.ses; if (!s) throw Object.assign(new Error('Sin sesión'), { vencida: true });
    if (Date.now() < s.exp - 60000) return s.at;
    return this.refrescar();
  },
  refrescar() {
    if (this._ref) return this._ref;
    this._ref = (async () => {
      const s = this.ses;
      const r = await fetch(this.url('/auth/v1/token?grant_type=refresh_token'), { method: 'POST', headers: { apikey: CONFIG.clave, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.rt }) });
      if (r.status === 400 || r.status === 401) throw Object.assign(new Error('Sesión vencida'), { vencida: true });
      if (!r.ok) throw new TypeError('Sin conexión');
      const j = await r.json();
      this.guardarSes({ uid: s.uid, perfil: s.perfil, at: j.access_token, rt: j.refresh_token, exp: Date.now() + j.expires_in * 1000 });
      return j.access_token;
    })().finally(() => { this._ref = null; });
    return this._ref;
  },

  async rest(path, op = {}) {
    const t = await this.token();
    const r = await fetch(this.url('/rest/v1/' + path), { method: op.method || 'GET', headers: Object.assign(this.cab(t), op.headers || {}), body: op.body });
    if (r.status === 401) throw Object.assign(new Error('Sesión vencida'), { vencida: true });
    if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch (e) { } throw Object.assign(new Error(m || 'Error ' + r.status), { status: r.status }); }
    return r.status === 204 ? null : (r.headers.get('content-type') || '').includes('json') ? r.json() : null;
  },

  /* Entrar: nombre + PIN. Guarda la sesión en el teléfono. */
  async entrar(id, pin) {
    const j = await this.fn('entrar', { id, pin });
    const s = j.sesion;
    this.guardarSes({ uid: s.user.id, at: s.access_token, rt: s.refresh_token, exp: Date.now() + s.expires_in * 1000 });
    const p = await this.traerPerfil();
    if (!p || !p.activo) { this.guardarSes(null); throw new Error('Ese usuario ya no tiene permiso'); }
    this.guardarPerfil(p);
    return p;
  },
  async traerPerfil() {
    const a = await this.rest('perfiles?id=eq.' + this.ses.uid + '&select=id,nombre,rol,activo');
    return a && a[0];
  },
  async lista() {
    try { const j = await this.fn('lista'); try { localStorage.setItem(LISTA, JSON.stringify(j)); } catch (e) { } return j; }
    catch (e) { try { return JSON.parse(localStorage.getItem(LISTA)) || { usuarios: [], pendientes: [] }; } catch (x) { return { usuarios: [], pendientes: [] }; } }
  },

  /* ── Sincronizar ── */
  pendientes() { return Object.keys(DB.meta.dirty || {}).length; },
  pronto() { if (!this.on || !this.ses) return; clearTimeout(this.espera); this.espera = setTimeout(() => this.sincronizar(), 1500); },
  iniciar() {
    if (!this.on) return;
    this.sincronizar();
    clearInterval(this.timer);
    this.timer = setInterval(() => { if (!document.hidden) this.sincronizar(); }, 20000);
  },
  parar() { clearInterval(this.timer); clearTimeout(this.espera); },

  async sincronizar() {
    if (!this.on || !this.ses || this.enCurso) return;
    this.enCurso = true; let cambio = false;
    if (typeof pintarEstado === 'function') pintarEstado();
    try {
      await this.empujar();
      cambio = await this.traer();
      const p = await this.traerPerfil();
      if (p) {
        if (!p.activo) { this.estado = 'sinpermiso'; return alSinPermiso(); }
        const igual = JSON.stringify(p) === JSON.stringify(Sesion.u);
        if (!igual) { Sesion.u = p; this.guardarPerfil(p); cambio = true; }
      }
      this.estado = 'ok'; this.ultima = Date.now();
    } catch (e) {
      if (e.vencida) { this.estado = 'vencida'; alVencerSesion(); }
      else this.estado = (e instanceof TypeError || !navigator.onLine) ? 'offline' : 'error';
    } finally { this.enCurso = false; }
    pintarEstado();
    if (cambio) alLlegarCambios();
  },

  async empujar() {
    const claves = Object.keys(DB.meta.dirty || {}).slice(0, 200);
    if (!claves.length) return;
    const ver = {}, filas = claves.map(k => {
      ver[k] = DB.meta.dirty[k];
      const i = k.indexOf('/'), col = k.slice(0, i), id = k.slice(i + 1);
      const doc = col === 'ajustes' ? DB.d.ajustes : DB.get(col, id);
      return { col, id, data: doc || {}, borrado: !doc, sensible: esSensible(col, doc) };
    });
    const mandar = f => this.rest('datos?on_conflict=col,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(f) });
    const listo = k => { if (DB.meta.dirty[k] === ver[k]) delete DB.meta.dirty[k]; };
    try { await mandar(filas); claves.forEach(listo); }
    catch (e) {
      if (e.status !== 403) throw e;
      /* Algo del lote no está permitido para este usuario: se manda de a una y lo rechazado se descarta */
      for (let n = 0; n < filas.length; n++) {
        try { await mandar([filas[n]]); } catch (x) { if (x.status !== 403) throw x; DB.meta.rechazados = (DB.meta.rechazados || 0) + 1; }
        listo(claves[n]);
      }
    }
    DB.guardar();
    if (Object.keys(DB.meta.dirty).length) await this.empujar();
  },

  async traer() {
    let cambio = false, desde = DB.meta.desde || '', max = desde;
    for (;;) {
      const q = 'datos?select=col,id,data,borrado,actualizado&order=actualizado.asc&limit=500' + (desde ? '&actualizado=gt.' + encodeURIComponent(desde) : '');
      const filas = await this.rest(q);
      for (const f of filas) { if (aplicarFila(f)) cambio = true; if (f.actualizado > max) max = f.actualizado; }
      if (filas.length < 500) break;
      desde = max;
    }
    if (max) DB.meta.desde = new Date(new Date(max).getTime() - 10000).toISOString();
    const ps = await this.rest('perfiles?select=id,nombre,rol,activo&order=nombre');
    if (JSON.stringify(ps) !== JSON.stringify(DB.d.usuarios)) { DB.d.usuarios = ps; cambio = true; }
    if (DB.d.registro.length > 600) { DB.d.registro.sort((a, b) => b.cuando - a.cuando); DB.d.registro.length = 600; }
    DB.guardar();
    return cambio;
  }
};

function esSensible(col, doc) {
  if (col === 'pagos' || col === 'avisos') return true;
  if (col === 'registro' && doc && Array.isArray(doc.ops)) return doc.ops.some(o => COLS_SENSIBLES.includes(o.col));
  return false;
}
/* Aplica una fila llegada de la base. Si acá hay un cambio sin enviar de lo mismo, el nuestro manda. */
function aplicarFila(f) {
  if (DB.meta.dirty[f.col + '/' + f.id]) return false;
  if (f.col === 'ajustes') {
    const n = Object.assign({}, DB.d.ajustes, f.data);
    if (JSON.stringify(n) === JSON.stringify(DB.d.ajustes)) return false;
    DB.d.ajustes = n; return true;
  }
  const arr = DB.d[f.col]; if (!arr) return false;
  const i = arr.findIndex(x => x.id === f.id);
  if (f.borrado) { if (i < 0) return false; arr.splice(i, 1); return true; }
  if (i >= 0) { if (JSON.stringify(arr[i]) === JSON.stringify(f.data)) return false; arr[i] = f.data; return true; }
  arr.push(f.data); return true;
}

window.addEventListener('online', () => Nube.sincronizar());
document.addEventListener('visibilitychange', () => { if (!document.hidden) Nube.sincronizar(); });
