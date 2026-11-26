/* La calculadora: un botón flotante que la abre en cualquier pantalla.
   No usa eval: arma las cuentas con su propio evaluador. */
'use strict';
const Calc = {
  items: [], entry: null, listo: false, abierta: false, campo: null,
  reset() { this.items = []; this.entry = null; this.listo = false; },
  fmtN(s) {
    if (s === 'Error') return s;
    const neg = String(s).startsWith('-'), t = String(s).replace('-', ''), [e, d] = t.split('.');
    return (neg ? '-' : '') + e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d !== undefined ? ',' + d : '');
  },
  digito(d) {
    if (this.listo) this.reset();
    let e = this.entry == null ? '' : this.entry;
    if (d === '.') { if (e.includes('.')) return; e = e === '' || e === '-' ? e + '0.' : e + '.'; }
    else e = e === '0' ? d : e === '-0' ? '-' + d : e + d;
    if (e.replace(/[-.]/g, '').length > 15) return;
    this.entry = e;
  },
  op(o) {
    if (this.entry != null) { this.items.push({ k: 'n', v: this.entry }); this.entry = null; }
    else if (!this.items.length) this.items.push({ k: 'n', v: '0' });
    const ult = this.items[this.items.length - 1];
    if (ult.k === 'o') ult.v = o; else this.items.push({ k: 'o', v: o });
    this.listo = false;
  },
  pct() {
    if (this.entry != null) { this.items.push({ k: 'n', v: this.entry, p: true }); this.entry = null; }
    else { const u = this.items[this.items.length - 1]; if (u && u.k === 'n') u.p = true; }
    this.listo = false;
  },
  atras() {
    if (this.listo) { this.reset(); return; }
    if (this.entry != null) { this.entry = this.entry.slice(0, -1); if (this.entry === '' || this.entry === '-') this.entry = null; return; }
    const u = this.items.pop(); if (u && u.k === 'n' && !u.p) { /* se puede volver a editar */ }
    const n = this.items[this.items.length - 1]; if (n && n.k === 'n' && !n.p) { this.entry = n.v; this.items.pop(); }
  },
  signo() {
    if (this.entry != null) this.entry = this.entry.startsWith('-') ? this.entry.slice(1) : '-' + this.entry;
    else if (this.listo || !this.items.length) { const r = this.valor(); this.reset(); this.entry = String(-r); }
  },
  calcular(items) {
    let suma = 0, signo = 1, term = null, mul = null;
    const val = (n, previoAditivo) => { const x = parseFloat(n.v); return n.p ? (previoAditivo ? suma * x / 100 : x / 100) : x; };
    items.forEach((it, i) => {
      if (it.k === 'o') { if (it.v === '+' || it.v === '−') { suma += signo * term; signo = it.v === '+' ? 1 : -1; term = null; mul = null; } else mul = it.v; return; }
      const previo = items[i - 1];
      const v = val(it, previo && (previo.v === '+' || previo.v === '−'));
      if (term == null) term = v; else term = mul === '×' ? term * v : term / v;
    });
    return suma + signo * (term == null ? 0 : term);
  },
  valor() {
    const its = this.items.slice();
    if (this.entry != null) its.push({ k: 'n', v: this.entry });
    while (its.length && its[its.length - 1].k === 'o') its.pop();
    if (!its.length) return 0;
    const r = this.calcular(its);
    return Number.isFinite(r) ? parseFloat(r.toPrecision(12)) : NaN;
  },
  igual() {
    if (this.entry == null && !this.items.length) return;
    const r = this.valor();
    this.historia = this.texto() + ' =';
    this.reset();
    if (Number.isNaN(r)) { this.error = true; return; }
    this.error = false; this.items = [{ k: 'n', v: String(r) }]; this.listo = true;
  },
  texto() {
    const t = this.items.map(i => i.k === 'o' ? i.v : this.fmtN(i.v) + (i.p ? '%' : ''));
    if (this.entry != null) t.push(this.fmtN(this.entry));
    return t.join('');
  },
  grande() {
    if (this.error) return 'Error';
    if (this.entry != null) return this.fmtN(this.entry);
    if (this.items.length) { const v = this.valor(); return Number.isNaN(v) ? 'Error' : this.fmtN(String(v)); }
    return '0';
  },
  pintar() {
    const c = document.getElementById('calc'); if (!c) return;
    const g = this.grande(), tam = Math.max(40, Math.min(104, 104 - (g.length - 5) * 9));
    const n = c.querySelector('.c-num'); n.textContent = g; n.style.fontSize = tam + 'px';
    const ex = this.texto(); c.querySelector('.c-expr').textContent = (this.listo ? this.historia : ex).slice(-26) || ' ';
    const b = c.querySelector('[data-c="pasar"]'); if (b) b.hidden = !(this.campo && this.campo.isConnected);
  },
  tocar(k) {
    if (k === 'C') { this.reset(); this.error = false; }
    else if (k === '⌫') this.atras();
    else if (k === '%') this.pct();
    else if (k === '=') this.igual();
    else if (k === '±') this.signo();
    else if ('÷×−+'.includes(k)) { this.error = false; this.op(k); }
    else { this.error = false; this.digito(k); }
    this.pintar();
    if (navigator.vibrate) try { navigator.vibrate(6); } catch (e) { }
  }
};
document.addEventListener('focusin', e => {
  if (e.target.matches && e.target.matches('input:not([type=checkbox]):not([type=hidden]):not([type=date]):not([type=search]),textarea') && !e.target.closest('#calc')) Calc.campo = e.target;
});
function abrirCalc() {
  if (document.getElementById('calc')) return cerrarCalc();
  const d = document.createElement('div'); d.id = 'calc';
  const teclas = [['C', '%', '⌫', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '.', '±', '=']];
  d.innerHTML = `<div class="c-hoja" role="dialog" aria-modal="true" aria-label="Calculadora">
    <div class="c-cab"><span>Calculadora</span><button class="c-pasar" data-c="pasar" hidden>Pasar al campo</button><button class="c-x" data-c="cerrar" aria-label="Cerrar">✕</button></div>
    <div class="c-expr"></div><button class="c-num" data-c="copiar" aria-label="Resultado, tocá para copiar">0</button>
    <div class="c-teclas">${teclas.map(f => f.map(k => `<button data-k="${k}" class="${'÷×−+'.includes(k) ? 'op' : k === '=' ? 'ig' : 'C%⌫±'.includes(k) ? 'fn' : ''}" aria-label="${({ '÷': 'dividir', '×': 'por', '−': 'menos', '+': 'más', '=': 'igual', '⌫': 'borrar', '±': 'cambiar signo', '.': 'coma' })[k] || k}">${k}</button>`).join('')).join('')}</div></div>`;
  d.addEventListener('click', e => {
    if (e.target === d) return cerrarCalc();
    const k = e.target.closest('[data-k]'); if (k) return Calc.tocar(k.dataset.k);
    const c = e.target.closest('[data-c]'); if (!c) return;
    if (c.dataset.c === 'cerrar') cerrarCalc();
    else if (c.dataset.c === 'copiar') { const v = Calc.valor(); if (!Number.isNaN(v) && navigator.clipboard) navigator.clipboard.writeText(String(v)).then(() => tostada('Copiado: ' + Calc.fmtN(String(v))), () => { }); }
    else if (c.dataset.c === 'pasar') {
      const v = Calc.valor(); if (Number.isNaN(v) || !Calc.campo || !Calc.campo.isConnected) return;
      Calc.campo.value = String(Math.round(v * 100) / 100).replace('.', ','); Calc.campo.dispatchEvent(new Event('input', { bubbles: true }));
      cerrarCalc(); Calc.campo.focus(); tostada('Pasado al campo');
    }
  });
  document.body.appendChild(d); Calc.abierta = true; Calc.pintar();
}
function cerrarCalc() { const d = document.getElementById('calc'); if (d) d.remove(); Calc.abierta = false; }
document.addEventListener('keydown', e => {
  if (!Calc.abierta) return;
  const k = e.key;
  if (k === 'Escape') { e.stopImmediatePropagation(); return cerrarCalc(); }
  const mapa = { '*': '×', '/': '÷', '-': '−', 'x': '×', ',': '.', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Delete': 'C', 'c': 'C', 'C': 'C' };
  const t = mapa[k] || k;
  if (/^[0-9.+%]$/.test(t) || '÷×−=⌫C'.includes(t) && t.length === 1) { e.preventDefault(); e.stopImmediatePropagation(); Calc.tocar(t); }
}, true);
