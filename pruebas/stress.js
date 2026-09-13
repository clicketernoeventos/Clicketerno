const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const fallas = [];
const anota = (modo, etapa, msg) => {
  fallas.push({ modo, etapa, msg });
  console.log(`  ✗ [${modo}/${etapa}] ${msg}`);
};

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function nuevaPagina(browser, modo) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: [],
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      // ignoramos fallos de red de fuentes/cdn que no son del código
      if (/fonts\.googleapis|gstatic|cdnjs|favicon|ERR_|Failed to load resource/i.test(t)) return;
      errores.push('console.error: ' + t);
    }
  });
  // stub de las librerías del CDN (acá está bloqueado, y a un invitado
  // con mala señal le puede pasar lo mismo)
  await page.route('**/cdnjs.cloudflare.com/**', (route) => {
    const u = route.request().url();
    if (process.env.SIN_LIBS === '1') return route.abort('failed');
    const js = u.includes('jszip')
      ? `window.JSZip=function(){this.__f=[];window.__ZIPFILES=this.__f;
           this.file=(n,d,o)=>this.__f.push({n,tipo:typeof d,vacio:d===undefined||d===null||d==='',o});
           this.generateAsync=async()=>new Blob(['x']);};`
      : `window.QRCode=function(nodo,op){nodo.innerHTML='<canvas width=10 height=10></canvas>';};
         window.QRCode.CorrectLevel={M:0,L:1,Q:2,H:3};`;
    route.fulfill({ status: 200, contentType: 'application/javascript', body: js });
  });

  // vigía: si la página se va sola de muro.html, es un bug
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame() && !f.url().includes('muro.html')) {
      errores.push('NAVEGACIÓN INESPERADA fuera de la app: ' + f.url().slice(0, 90));
    }
  });

  const fake = crearFake(modo);
  await fake.instalar(page);
  return { ctx, page, errores, fake };
}

async function irA(page, ruta) {
  try {
    await page.evaluate((r) => { location.hash = '#' + r; }, ruta);
  } catch (e) {
    // el contexto se destruyó => algo navegó la página
    await page.goto(BASE + '/muro.html#' + ruta, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(350);
}

async function textoApp(page) {
  return page.evaluate(() => (document.getElementById('app') || {}).innerText || '');
}

const etapasVistas = new Set();
async function chequearVivo(page, modo, etapa) {
  etapasVistas.add(modo + '/' + etapa);
  const t = await textoApp(page);
  const ancho = await page.evaluate(() => ({
    desborda: document.documentElement.scrollWidth > window.innerWidth + 1,
    culpables: [...document.querySelectorAll('#app *')]
      .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 2).map(e => e.className || e.tagName),
  })).catch(() => ({ desborda: false, culpables: [] }));
  if (ancho.desborda)
    anota(modo, etapa, `se sale de la pantalla a lo ancho (${ancho.culpables.join(', ') || '?'})`);
  if (!t.trim()) anota(modo, etapa, 'pantalla EN BLANCO (#app vacío)');
  if (/undefined|NaN|\[object Object\]/.test(t)) {
    const m = t.match(/.{0,40}(undefined|NaN|\[object Object\]).{0,40}/);
    anota(modo, etapa, `texto roto visible: "${(m && m[0] || '').trim()}"`);
  }
  return t;
}

async function chequearXSS(page, modo, etapa) {
  const flags = await page.evaluate(() =>
    Object.keys(window).filter((k) => k.startsWith('__XSS'))
  );
  if (flags.length) anota(modo, etapa, `XSS EJECUTADO: ${flags.join(',')}`);
}

/* ══════════ recorrido completo ══════════ */
async function recorrer(browser, modo) {
  console.log(`\n─── modo: ${modo} ───`);
  const { ctx, page, errores, fake } = await nuevaPagina(browser, modo);

  await page.goto(BASE + '/muro.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await chequearVivo(page, modo, 'portada');

  // ── sembrar demo si está el botón ──
  const demo = page.locator('#demo');
  if (await demo.count()) {
    await demo.click();
    await page.waitForTimeout(900);
    await chequearVivo(page, modo, 'sembrar-demo');
    await chequearXSS(page, modo, 'sembrar-demo');
    // ¿se ven las fotos de ejemplo?
    const rotas = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter(
        (i) => !i.getAttribute('src') || i.getAttribute('src') === ''
      ).length
    );
    if (rotas) anota(modo, 'sembrar-demo', `${rotas} <img> con src vacío tras cargar la fiesta de ejemplo`);
  }

  // ── panel: crear PIN ──
  await irA(page, 'panel');
  if (await page.locator('#pin').count()) {
    await chequearVivo(page, modo, 'acceso');   // la pantalla de la clave, con el campo a la vista
    const campoRaro = await page.evaluate(() => {
      const el = document.querySelector('#pin');
      const c = getComputedStyle(el);
      const claro = /^rgba?\((2[0-4]\d|25[0-5]), *(2[0-4]\d|25[0-5]), *(2[0-4]\d|25[0-5])/.test(c.backgroundColor);
      const sale = el.getBoundingClientRect().right > window.innerWidth + 1;
      return { claro, sale, fondo: c.backgroundColor };
    });
    if (campoRaro.claro) anota(modo, 'acceso', `el campo de la clave tiene fondo claro (${campoRaro.fondo})`);
    if (campoRaro.sale) anota(modo, 'acceso', 'el campo de la clave se sale de la pantalla');
    await page.fill('#pin', '12');            // demasiado corto
    await page.click('#entrar');
    await page.waitForTimeout(200);
    await page.fill('#pin', '1234');
    await page.click('#entrar');
    await page.waitForTimeout(700);
    // entrar al panel no es opcional: si falla, todo lo de abajo se saltea
    const entro = await page.evaluate(() => !!document.querySelector('#crear'));
    if (!entro) {
      const aviso = (document.querySelector) ? '' : '';
      const msg = await page.locator('#recado').innerText().catch(() => '');
      anota(modo, 'acceso', `NO se pudo crear la clave ni entrar al panel (mensaje: "${msg.trim()}")`);
    }
  }
  await chequearVivo(page, modo, 'panel');

  // ── crear evento sin nombre y con nombre ──
  if (await page.locator('#crear').count()) {
    await page.click('#crear');               // sin nombre → debe avisar
    await page.waitForTimeout(250);
    const aviso = await page.locator('#recado').innerText().catch(() => '');
    if (!/nombre/i.test(aviso)) anota(modo, 'crear-vacio', 'no avisa que falta el nombre');

    await page.fill('#n', 'Fiesta "Test" <b>& cía</b>');
    await page.click('#crear');
    await page.waitForTimeout(300);
    await page.click('#crear').catch(() => {});  // doble toque
    await page.waitForTimeout(1600);
    await chequearVivo(page, modo, 'crear-evento');
    await chequearXSS(page, modo, 'crear-evento');

    // ── pantalla de clave nueva: se muestra una sola vez, hay que pasarla ──
    if (await page.locator('#alEvento').count()) {
      const laClave = (await page.locator('.clave-grande').innerText().catch(() => '')).trim();
      if (!/^[A-Z0-9]{6}$/.test(laClave))
        anota(modo, 'clave-nueva', `la clave que muestra no es legible: "${laClave}"`);
      const guardada = await page.evaluate(() => {
        try { return JSON.parse(localStorage.getItem('ce:claves') || '{}'); } catch (e) { return {}; }
      });
      if (!Object.values(guardada).includes(laClave))
        anota(modo, 'clave-nueva', 'la clave mostrada no quedó guardada en el aparato');
      await page.click('#alEvento');
      await page.waitForTimeout(700);
      await chequearVivo(page, modo, 'clave-nueva');
    } else if (modo === 'ok' || modo === 'evil') {
      anota(modo, 'clave-nueva', 'crear un evento no muestra la clave del evento');
    }
  }

  // ── tomar un código existente ──
  const codigo = await page.evaluate(() => {
    const m = location.hash.match(/evento\/(.+)$/);
    if (m) return m[1];
    const b = document.querySelector('[data-cod]');
    return b ? b.dataset.cod : null;
  });

  if (!codigo) {
    if (modo === 'ok' || modo === 'evil')
      anota(modo, 'flujo', 'no hay ningún evento: se saltea TODO el recorrido profundo');
    else
      console.log(`  · [${modo}] sin evento (esperable con la base caída): no se recorre lo profundo`);
  }
  if (codigo) {
    // ── vista evento: tocar todo ──
    await irA(page, 'evento/' + codigo);
    await chequearVivo(page, modo, 'evento');
    await chequearXSS(page, modo, 'evento');
    // recorrer las tres pestañas y tocar lo de cada una
    const porSolapa = {
      pCompartir: ['#copiar'],
      pModerar: ['#mod', '#mod'],
      pAjustes: ['#cerr', '#cerr', '#guardarC'],
    };
    for (const [solapa, botones] of Object.entries(porSolapa)) {
      const tab = page.locator(`[data-sol="${solapa}"]`);
      if (!(await tab.count())) { anota(modo, 'solapas', `falta la solapa ${solapa}`); continue; }
      await tab.click();
      await page.waitForTimeout(400);
      const visible = await page.evaluate((id) => {
        const s = document.getElementById(id);
        return !!s && !s.hidden && s.getBoundingClientRect().height > 0;
      }, solapa);
      if (!visible) anota(modo, 'solapas', `${solapa} no se muestra al tocar su solapa`);
      for (const sel of botones) {
        if (await page.locator(sel).count()) {
          await page.click(sel, { timeout: 4000 }).catch((e) =>
            anota(modo, 'solapas', `no pude tocar ${sel} en ${solapa}`));
          await page.waitForTimeout(250);
        }
      }
      await chequearVivo(page, modo, 'solapa:' + solapa);
    }
    // la barra de abajo no debe tapar el contenido
    const tapado = await page.evaluate(() => {
      const nav = document.querySelector('.barra-abajo');
      const wrap = document.querySelector('.wrap-ev');
      if (!nav || !wrap) return false;
      const ultimo = wrap.querySelector('.panel-ev:not([hidden])')?.lastElementChild;
      if (!ultimo) return false;
      const r = ultimo.getBoundingClientRect(), n = nav.getBoundingClientRect();
      // con la página al final, el último elemento no puede quedar debajo de la barra
      window.scrollTo(0, document.body.scrollHeight);
      const r2 = ultimo.getBoundingClientRect();
      return r2.bottom > n.top + 1;
    });
    if (tapado) anota(modo, 'evento', 'la barra de abajo tapa el final del contenido');

    // ── cartel ──
    await irA(page, 'cartel/' + codigo);
    await chequearVivo(page, modo, 'cartel');

    // ── subir: foto ──
    await irA(page, 'subir/' + codigo);
    await chequearVivo(page, modo, 'subir');
    if (await page.locator('#file').count()) {
      await page.setInputFiles('#file', { name: 'foto.png', mimeType: 'image/png', buffer: PNG });
      await page.waitForTimeout(700);
      await page.fill('#autor', 'Tomás <script>').catch(() => {});
      if (await page.locator('#pie').count()) await page.fill('#pie', 'Epígrafe "raro" & <b>');
      const tapaInv = await page.evaluate(() => {
        const bar = document.querySelector('.accion-abajo');
        const campo = document.querySelector('#autor');
        if (!bar || !campo) return false;
        window.scrollTo(0, document.body.scrollHeight);
        return campo.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 1;
      });
      if (tapaInv) anota(modo, 'subir', 'la barra de acción tapa el campo del nombre');
      await page.click('#enviar');
      await page.waitForTimeout(1500);
      await chequearVivo(page, modo, 'subir-foto');
      await chequearXSS(page, modo, 'subir-foto');
    }

    // ── subir: dedicatoria ──
    // vMomento no cambia el hash, así que hay que pasar por otra vista
    // para que "subir" se vuelva a pintar de verdad
    await irA(page, 'portada');
    await irA(page, 'subir/' + codigo);
    await page.waitForTimeout(500);
    if (!(await page.locator('[data-m="texto"]').count()))
      anota('ok', 'subir', 'no se repintó la vista del invitado al volver');
    if (await page.locator('[data-m="texto"]').count()) {
      await page.click('[data-m="texto"]');
      await page.waitForTimeout(200);
      await page.click('#enviar');             // vacío → debe avisar
      await page.waitForTimeout(250);
      await page.fill('#msg', 'Que sea una noche eterna ✨');
      await page.fill('#autor', 'La abuela');
      await page.click('#enviar');
      await page.waitForTimeout(1400);
      await chequearVivo(page, modo, 'subir-texto');
    }

    // ── cambiar de pestaña con foto cargada (fuga de estado) ──
    await irA(page, 'portada');
    await irA(page, 'subir/' + codigo);
    await page.waitForTimeout(500);
    if (await page.locator('#file').count()) {
      await page.setInputFiles('#file', { name: 'foto.png', mimeType: 'image/png', buffer: PNG });
      await page.waitForTimeout(600);
      await page.click('[data-m="voz"]');
      await page.waitForTimeout(400);
      // Sin grabar nada, enviar tiene que quejarse. Si en cambio manda, la
      // foto elegida en la otra solapa se coló sin que el invitado la vea.
      await page.click('#enviar');
      await page.waitForTimeout(900);
      const msg = await page.locator('#recado').innerText().catch(() => '');
      const salio = await page.evaluate(() => !document.querySelector('[data-m="voz"]'));
      if (salio || !/subí algo|escribí/i.test(msg))
        anota(modo, 'fuga-estado',
          `al pasar de Foto a Voz se mandó la foto igual (mensaje: "${msg.trim()}")`);
    }

    // ── pantalla del salón ──
    await irA(page, 'pantalla/' + codigo);
    await page.waitForTimeout(1200);
    await chequearVivo(page, modo, 'pantalla');
    await chequearXSS(page, modo, 'pantalla');
    // navegar mientras el timer corre (carrera)
    await irA(page, 'album/' + codigo);
    await page.waitForTimeout(200);
    await irA(page, 'portada');
    await page.waitForTimeout(200);
    await irA(page, 'pantalla/' + codigo);
    await page.waitForTimeout(300);
    await irA(page, 'panel');
    await page.waitForTimeout(1500);          // el timer viejo dispara acá
    await chequearVivo(page, modo, 'carrera-timer');

    // ── álbum + descarga ──
    await irA(page, 'album/' + codigo);
    await page.waitForTimeout(1400);
    await chequearVivo(page, modo, 'album');
    await chequearXSS(page, modo, 'album');
    for (const sol of ['aFotos', 'aRecuerdos', 'aGuardar']) {
      const tab = page.locator(`[data-sol="${sol}"]`);
      if (!(await tab.count())) { anota(modo, 'album', `falta la solapa ${sol}`); continue; }
      await tab.click();
      await page.waitForTimeout(350);
      const ok = await page.evaluate((id) => {
        const s = document.getElementById(id);
        return !!s && !s.hidden && s.getBoundingClientRect().height > 0;
      }, sol);
      if (!ok) anota(modo, 'album', `${sol} no se muestra al tocarla`);
      await chequearVivo(page, modo, 'album:' + sol);
    }
    await page.locator('[data-sol="aGuardar"]').click().catch(() => {});
    await page.waitForTimeout(300);
    if (await page.locator('#dl').count()) {
      page.on('download', (d) => d.cancel().catch(() => {}));
      const res = await page.evaluate(async () => {
        try {
          const btn = document.querySelector('#dl');
          if (!btn) return { msg: 'sin boton' };
          btn.click();
          await new Promise((r) => setTimeout(r, 2500));
          return {
            msg: document.querySelector('#recado').innerText || 'sin mensaje',
            zip: window.__ZIPFILES || null,
          };
        } catch (e) { return { msg: 'EXCEPCION: ' + e.message }; }
      }).catch((e) => ({ msg: 'CONTEXTO DESTRUIDO: ' + e.message.slice(0, 60) }));
      if (/no pude|EXCEPCION|CONTEXTO/i.test(res.msg))
        anota(modo, 'album-zip', 'descargar todo falló: ' + res.msg);
      if (res.zip) {
        const vacios = res.zip.filter((f) => f.vacio);
        if (vacios.length)
          anota(modo, 'album-zip', `${vacios.length}/${res.zip.length} archivos entran VACÍOS al ZIP (${vacios[0].n})`);
      }
    }
  }

  // ── rutas basura ──
  for (const r of ['evento/', 'evento/NO-EXISTE', 'subir/', 'pantalla/', 'album/', 'cualquiera', 'evento/../../x']) {
    await irA(page, r);
    const t = await textoApp(page);
    if (!t.trim()) anota(modo, 'ruta:' + r, 'pantalla en blanco');
  }

  // ── recarga directa en vista profunda ──
  if (codigo) {
    await page.goto(BASE + '/muro.html#evento/' + codigo, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await chequearVivo(page, modo, 'recarga-profunda');
  }

  for (const e of [...new Set(errores)]) anota(modo, 'js', e);
  await ctx.close();
}

/* ══════════ landing ══════════ */
async function landing(browser) {
  console.log('\n─── landing index.html ───');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts|gstatic|cdnjs|favicon|Failed to load resource/i.test(m.text()))
      errores.push('console.error: ' + m.text());
  });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  const secc = await page.evaluate(() => {
    const s = document.querySelector('#trabajos');
    return {
      hayCabeza: !!(s && s.querySelector('.cabeza')),
      hayWrap: !!(s && s.querySelector('.wrap')),
      hayPista: !!(s && s.querySelector('.pista-toque')),
      tarjetas: s ? s.querySelectorAll('.trabajo').length : 0,
      idsDuplicados: [...document.querySelectorAll('[id]')]
        .map((e) => e.id)
        .filter((id, i, a) => a.indexOf(id) !== i),
    };
  });
  if (!secc.hayCabeza) anota('landing', 'trabajos', 'se perdió el título de la sección');
  if (!secc.hayWrap) anota('landing', 'trabajos', 'se perdió el contenedor .wrap');
  if (!secc.hayPista) anota('landing', 'trabajos', 'se perdió el texto "Tocá cualquiera…"');
  if (secc.tarjetas !== 3) anota('landing', 'trabajos', `se esperaban 3 tarjetas, hay ${secc.tarjetas}`);
  if (secc.idsDuplicados.length) anota('landing', 'ids', 'ids duplicados: ' + secc.idsDuplicados.join(','));

  const meta = await page.evaluate(() => ({
    ogImage: !!document.querySelector('meta[property="og:image"]'),
    favicon: !!document.querySelector('link[rel*="icon"]'),
    themeColor: !!document.querySelector('meta[name="theme-color"]'),
    canonical: !!document.querySelector('link[rel="canonical"]'),
    jsonld: !!document.querySelector('script[type="application/ld+json"]'),
    lang: document.documentElement.lang,
  }));
  for (const [k, v] of Object.entries(meta)) if (!v) anota('landing', 'meta', 'falta ' + k);

  // menú móvil y visor
  await page.click('#burger');
  await page.waitForTimeout(400);
  const abierto = await page.evaluate(() => document.querySelector('#menuMovil').classList.contains('abierto'));
  if (!abierto) anota('landing', 'menu', 'el menú móvil no abre');
  await page.click('#menuMovil a');
  await page.waitForTimeout(400);

  await page.evaluate(() => document.querySelector('.trabajo').click());
  await page.waitForTimeout(600);
  const visor = await page.evaluate(() => document.querySelector('#visor').classList.contains('abierto'));
  if (!visor) anota('landing', 'visor', 'el visor no abre al tocar un trabajo');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const cerrado = await page.evaluate(() => !document.querySelector('#visor').classList.contains('abierto'));
  if (!cerrado) anota('landing', 'visor', 'el visor no cierra con Escape');
  const scrollBloqueado = await page.evaluate(() => document.body.style.overflow === 'hidden');
  if (scrollBloqueado) anota('landing', 'visor', 'el scroll del body queda bloqueado tras cerrar');

  const desborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (desborde) anota('landing', 'layout', 'la página scrollea horizontalmente en 390px');

  for (const e of [...new Set(errores)]) anota('landing', 'js', e);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  await landing(browser);
  for (const modo of ['ok', 'evil', 'fail', 'net']) await recorrer(browser, modo);
  await browser.close();

  console.log('\n═══════════ RESUMEN ═══════════');
  if (!fallas.length) console.log('Sin fallas 🎉');
  else {
    const porModo = {};
    for (const f of fallas) (porModo[f.modo] = porModo[f.modo] || []).push(f);
    for (const [m, fs] of Object.entries(porModo)) {
      console.log(`\n[${m}] ${fs.length}`);
      for (const f of fs) console.log(`   · ${f.etapa}: ${f.msg}`);
    }
  }
  const ESPERADAS = ['portada','panel','clave-nueva','evento','solapa:pCompartir','solapa:pModerar',
    'solapa:pAjustes','cartel','subir','subir-foto','subir-texto','pantalla',
    'album','album:aFotos','album:aRecuerdos','album:aGuardar','recarga-profunda'];
  console.log('\n═══ COBERTURA (modo ok) ═══');
  const faltan = ESPERADAS.filter((e) => !etapasVistas.has('ok/' + e));
  console.log(`etapas recorridas: ${ESPERADAS.length - faltan.length}/${ESPERADAS.length}`);
  if (faltan.length) {
    console.log('NO SE EJECUTARON: ' + faltan.join(', '));
    fallas.push({ modo: 'cobertura', etapa: 'saltadas', msg: faltan.join(', ') });
  }
  console.log(`\nTOTAL: ${fallas.length}`);
})();
