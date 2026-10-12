/* ══════════════════════════════════════════════════════════════════
   BARRIDO: ¿se puede tocar todo, y qué pasa cuando lo tocás?

   Pedido del dueño (12/10/2026): "revisá toda la página web y las apps,
   tiene que ser adaptable a iPhone, Android y PC, medí minuciosamente y
   ya que estamos probá todo lo que se pueda clickear".

   `dispositivos.js` ya mide la FORMA de nueve pantallas en siete
   aparatos. Lo que no medía nadie es lo otro: que cada control se pueda
   TOCAR, y que al tocarlo pase algo sano. Son dos fallas distintas y
   ninguna tira un error:

     · Un botón tapado por una capa se dibuja perfecto y no responde.
       El dedo cae en la capa de arriba. Ya pasó dos veces en este
       proyecto (`.tapa` pisada, el aviso legal debajo de la barra fija).
     · Un control que lleva a una pantalla vacía es un callejón sin
       salida: la pantalla se dibuja bien y el cliente se queda ahí.

   Dos pasadas, porque miden cosas distintas y cuestan distinto:

   PASADA A — sin tocar nada, en DIEZ aparatos (iPhone, Android, iPad,
   notebook, proyector). De cada control visible:
       · ¿llega a 44x44 en un aparato táctil?
       · ¿lo tapa otra cosa? (se pregunta quién atajaría el dedo en el
         centro del control; si no es él ni un hijo suyo, está tapado)
       · ¿se sale de la pantalla por el costado?

   PASADA B — tocando todo, en un teléfono y una notebook. De cada
   control:
       · ¿tira un error de JavaScript?
       · ¿deja la página desbordada para el costado?
       · ¿deja una pantalla sin texto o sin NADA para seguir tocando?

   Lo que NO se cuenta como falla, y es parte de medir bien:
     · Lo decorativo (`pointer-events:none`) no ataja ningún dedo.
     · Una capa del tamaño de la pantalla es el fondo de esa pantalla.
     · Un control adentro de algo que recorta a propósito (la marquesina,
       el carrusel) no "se sale": está esperando su turno.
     · Lo que abre otra pestaña o va a WhatsApp no se toca.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const COD = 'QUI-7FCE64';

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

const APARATOS = [
  { n: 'iPhone SE',        w: 320,  h: 568,  dedo: true },
  { n: 'iPhone 13 mini',   n2:'',   w: 375,  h: 667,  dedo: true },
  { n: 'iPhone 14',        w: 390,  h: 844,  dedo: true },
  { n: 'iPhone Pro Max',   w: 430,  h: 932,  dedo: true },
  { n: 'Galaxy S20',       w: 360,  h: 800,  dedo: true },
  { n: 'Pixel 7',          w: 412,  h: 915,  dedo: true },
  { n: 'Android chico',    w: 360,  h: 640,  dedo: true },
  { n: 'iPad',             w: 768,  h: 1024, dedo: true },
  { n: 'Notebook',         w: 1280, h: 800,  dedo: false },
  { n: 'Escritorio',       w: 1440, h: 900,  dedo: false },
];

const PANTALLAS = [
  ['la página pública',       '/index.html',              2600],
  ['la de 404',               '/no-existe-esta-pagina',   1200],
  ['la política de privacidad','/privacidad',             1400],
  ['los términos',            '/terminos',                1400],
  ['cómo empezar',            '/empezar',                 1400],
  ['la portada del muro',     '/muro.html',               1500],
  ['la pantalla del salón',   '/muro.html?demo=1',        2800],
  ['el panel del muro',       '/muro.html#panel',         1600],
  ['lo que ve el invitado',   '/muro.html#subir/' + COD,  1600],
  ['el rollo revelado',       '/rollo.html?demo=1',       3000],
  ['la cámara del rollo',     '/rollo.html?demo=1&camara=1', 3000],
  ['el alta del rollo',       '/rollo.html#nuevo',        1600],
];

/* ── lo que mide el navegador, una sola vez por pantalla ──
   `elementFromPoint` es el corazón de esto: pregunta QUIÉN atajaría el
   dedo en ese punto. Si no es el control ni un hijo suyo, el control
   está tapado y no se puede tocar, por más que se vea. */
const MEDIR = `(${function () {
  const V = { w: innerWidth, h: innerHeight };
  /* Mirar SOLO el elemento no alcanza: el visor de invitaciones está
     cerrado con `opacity:0;pointer-events:none` en el padre, y su botón
     "Cerrar" sigue midiendo 1 de opacidad. Medido así, el barrido
     informaba en los diez aparatos que ese botón estaba tapado — por el
     logo, por un párrafo, por lo que hubiera debajo. Era verdad y no
     importaba: ese botón no está en la pantalla.
     Es la regla de la caja de 0x0 al revés: antes de medir algo, hay que
     comprobar que ESTÉ. */
  const vis = (n) => {
    for (let e = n; e && e !== document.documentElement; e = e.parentElement) {
      if (e.hasAttribute && e.hasAttribute('hidden')) return false;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      if (e !== n && cs.pointerEvents === 'none') return false;
    }
    const b = n.getBoundingClientRect();
    return b.width > 1 && b.height > 1;
  };
  const nombre = (n) => {
    const t = (n.getAttribute('aria-label') || n.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28);
    return n.tagName.toLowerCase()
      + (n.id ? '#' + n.id : '')
      + (typeof n.className === 'string' && n.className
        ? '.' + n.className.trim().split(/\\s+/)[0] : '')
      + (t ? ' «' + t + '»' : '');
  };
  /* ¿algún padre lo recorta? entonces no "se sale": está esperando turno
     adentro de un carrusel o de la marquesina. */
  const recortado = (n) => {
    for (let e = n.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return true;
    }
    return false;
  };

  const SEL = 'a[href],button,summary,select,[role="button"],[onclick],'
    + 'input:not([type="hidden"]),textarea,label[for],[tabindex]:not([tabindex="-1"])';
  const todos = [...document.querySelectorAll(SEL)].filter(vis);

  const chicos = [], tapados = [], afuera = [];
  for (const n of todos) {
    const b = n.getBoundingClientRect();
    /* lo que está fuera de la pantalla por arriba o por abajo todavía no
       es su momento: se mide cuando se scrollea hasta él */
    const enPantalla = b.bottom > 0 && b.top < V.h;

    /* Una `label` no es el blanco: el blanco es su campo, que está al
       lado y es grande. Tocar la etiqueta enfoca el campo, pero nadie
       apunta ahí — y pedirle 44px de alto a un rótulo de 14 es meterle
       aire muerto a todos los formularios. Se exime SOLO si el campo al
       que apunta existe, se ve y llega a 44. */
    let eximida = false;
    if (n.tagName === 'LABEL') {
      const campo = n.htmlFor ? document.getElementById(n.htmlFor) : n.querySelector('input,select,textarea');
      if (campo && vis(campo) && campo.getBoundingClientRect().height >= 44) eximida = true;
    }
    if (!eximida && (b.width < 44 || b.height < 44))
      chicos.push({ q: nombre(n), w: Math.round(b.width), h: Math.round(b.height) });

    if ((b.left < -1 || b.right > V.w + 1) && !recortado(n))
      afuera.push({ q: nombre(n), x: Math.round(b.left), x2: Math.round(b.right) });

    if (enPantalla) {
      /* Preguntar en la posición en la que quedó al cargar NO es lo que
         hace una persona: en una pantalla corta lo de abajo arranca
         debajo de la barra fija y se destapa scrolleando, que es para lo
         que está el `padding-bottom` de esas pantallas. Así que primero
         se mira donde está, y si parece tapado se lo trae al medio y se
         vuelve a preguntar. Solo cuenta si sigue tapado ahí: mejor callar
         que inventar una falla. */
      const tapadoEn = (caja) => {
        const x = Math.min(Math.max(caja.left + caja.width / 2, 1), V.w - 1);
        const y = Math.min(Math.max(caja.top + caja.height / 2, 1), V.h - 1);
        const encima = document.elementFromPoint(x, y);
        if (!encima || encima === n || n.contains(encima) || encima.contains(n)) return null;
        const c = encima.getBoundingClientRect();
        if (c.width >= V.w - 2 && c.height >= V.h - 2) return null;  // es el fondo
        return encima;
      };
      let quien = tapadoEn(b);
      if (quien) {
        n.scrollIntoView({ block: 'center' });
        quien = tapadoEn(n.getBoundingClientRect());
      }
      if (quien) tapados.push({ q: nombre(n), lo: nombre(quien) });
    }
  }
  return {
    cuantos: todos.length, chicos, tapados, afuera,
    desborde: Math.round(document.documentElement.scrollWidth - V.w),
  };
}})()`;

/* Para la pasada B: la lista de controles que vale la pena tocar. Se
   saltea lo que se va del sitio (otra pestaña, WhatsApp, un teléfono) y
   lo que recarga de verdad. */
const LISTAR = `(${function () {
  /* Mirar SOLO el elemento no alcanza: el visor de invitaciones está
     cerrado con `opacity:0;pointer-events:none` en el padre, y su botón
     "Cerrar" sigue midiendo 1 de opacidad. Medido así, el barrido
     informaba en los diez aparatos que ese botón estaba tapado — por el
     logo, por un párrafo, por lo que hubiera debajo. Era verdad y no
     importaba: ese botón no está en la pantalla.
     Es la regla de la caja de 0x0 al revés: antes de medir algo, hay que
     comprobar que ESTÉ. */
  const vis = (n) => {
    for (let e = n; e && e !== document.documentElement; e = e.parentElement) {
      if (e.hasAttribute && e.hasAttribute('hidden')) return false;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      if (e !== n && cs.pointerEvents === 'none') return false;
    }
    const b = n.getBoundingClientRect();
    return b.width > 1 && b.height > 1;
  };
  const SEL = 'a[href],button,summary,[role="button"],.serv,.pieza,.trabajo';
  return [...document.querySelectorAll(SEL)].filter(vis).filter((n) => {
    if (n.target === '_blank') return false;
    const h = n.getAttribute('href') || '';
    if (/^(https?:|mailto:|tel:|wa\\.me)/.test(h)) return false;
    if (n.closest('.visor')) return false;
    return true;
  }).map((n, i) => {
    const t = (n.getAttribute('aria-label') || n.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 26);
    return n.tagName.toLowerCase()
      + (n.id ? '#' + n.id : '')
      + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\\s+/)[0] : '')
      + (t ? ' «' + t + '»' : '');
  });
}})()`;

/* Después de tocar: ¿quedó algo para hacer, o es un callejón? */
const DESPUES = `(${function () {
  /* Mirar SOLO el elemento no alcanza: el visor de invitaciones está
     cerrado con `opacity:0;pointer-events:none` en el padre, y su botón
     "Cerrar" sigue midiendo 1 de opacidad. Medido así, el barrido
     informaba en los diez aparatos que ese botón estaba tapado — por el
     logo, por un párrafo, por lo que hubiera debajo. Era verdad y no
     importaba: ese botón no está en la pantalla.
     Es la regla de la caja de 0x0 al revés: antes de medir algo, hay que
     comprobar que ESTÉ. */
  const vis = (n) => {
    for (let e = n; e && e !== document.documentElement; e = e.parentElement) {
      if (e.hasAttribute && e.hasAttribute('hidden')) return false;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      if (e !== n && cs.pointerEvents === 'none') return false;
    }
    const b = n.getBoundingClientRect();
    return b.width > 1 && b.height > 1;
  };
  const SEL = 'a[href],button,summary,[role="button"],input,select,textarea,.serv,.pieza,.trabajo';
  return {
    texto: (document.body.innerText || '').trim().length,
    salidas: [...document.querySelectorAll(SEL)].filter(vis).length,
    desborde: Math.round(document.documentElement.scrollWidth - innerWidth),
  };
}})()`;

async function abrir(browser, ap) {
  const ctx = await browser.newContext({
    viewport: { width: ap.w, height: ap.h },
    isMobile: ap.dedo, hasTouch: ap.dedo,
    deviceScaleFactor: ap.dedo ? 2 : 1,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 90)));
  return { ctx, p, errs };
}

(async () => {
  const browser = await chromium.launch();

  /* ═══════════ PASADA A: se puede tocar ═══════════ */
  /* Los aparatos van de a varios a la vez. En fila son 120 cargas de
     página con sus esperas: más de los diez minutos que le da todo.sh a
     cada suite, y una prueba que el corredor mata a mitad no informa
     nada, informa que se cortó. De a cinco entra cómodo y mide lo mismo:
     cada aparato tiene su contexto, no se ven entre ellos. */
  const DE_A = 5;
  titulo('PASADA A · todo lo que se toca, en diez aparatos');
  const mirar = async (ap) => {
    const { ctx, p, errs } = await abrir(browser, ap);
    const problemas = [];
    let controles = 0, sanas = 0;

    for (const [q, ruta, esp] of PANTALLAS) {
      let d;
      try {
        await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(esp);
        d = await p.evaluate(MEDIR);
      } catch (e) {
        problemas.push(`${q}: se cortó (${String(e.message).slice(0, 50)})`);
        continue;
      }
      controles += d.cuantos;
      const p2 = [];
      if (d.desborde > 2) p2.push(`se sale ${d.desborde}px para el costado`);
      if (d.afuera.length)
        p2.push(`${d.afuera.length} control(es) fuera de la pantalla: ${d.afuera[0].q} (x ${d.afuera[0].x}→${d.afuera[0].x2})`);
      if (d.tapados.length)
        p2.push(`${d.tapados.length} tapado(s): ${d.tapados[0].q} lo tapa ${d.tapados[0].lo}`);
      if (ap.dedo && d.chicos.length)
        p2.push(`${d.chicos.length} abajo de 44px: ${d.chicos[0].q} (${d.chicos[0].w}x${d.chicos[0].h})`);
      if (p2.length) problemas.push(`${q}: ` + p2.join(' · '));
      else sanas++;
    }

    await ctx.close();
    return { ap, problemas, sanas, controles, errs };
  };

  /* Se miden en paralelo pero se INFORMAN en orden: una salida que sale
     desordenada según quién terminó antes no se puede comparar entre dos
     corridas. */
  for (let i = 0; i < APARATOS.length; i += DE_A) {
    const tanda = await Promise.all(APARATOS.slice(i, i + DE_A).map(mirar));
    for (const r of tanda) {
      if (r.problemas.length) {
        mal(`${r.ap.n} (${r.ap.w}x${r.ap.h}): ${r.problemas.length} de ${PANTALLAS.length} pantallas con algo`);
        r.problemas.slice(0, 4).forEach((x) => console.log('      · ' + x));
      } else {
        bien(`${r.ap.n} (${r.ap.w}x${r.ap.h}): las ${r.sanas} pantallas, ${r.controles} controles, todo tocable`);
      }
      if (r.errs.length) mal(`${r.ap.n}: error de JavaScript · ${r.errs[0]}`);
    }
  }

  /* ═══════════ PASADA B: qué pasa al tocar ═══════════ */
  titulo('PASADA B · tocar todo, uno por uno');
  const TOCAR = [
    { n: 'iPhone 14', w: 390, h: 844, dedo: true },
    { n: 'Notebook', w: 1280, h: 800, dedo: false },
  ];
  const TOPE = 26;   // por pantalla: más que eso es repetir lo mismo

  const tocar = async (ap) => {
    const { ctx, p, errs } = await abrir(browser, ap);
    let tocados = 0;
    const problemas = [];

    for (const [q, ruta, esp] of PANTALLAS) {
      let lista;
      try {
        await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(esp);
        lista = await p.evaluate(LISTAR);
      } catch (e) { problemas.push(`${q}: no abrió`); continue; }

      const n = Math.min(lista.length, TOPE);
      for (let i = 0; i < n; i++) {
        const antes = errs.length;
        let d = null;
        try {
          /* Se vuelve a la pantalla antes de cada toque: el anterior pudo
             haber navegado, y entonces el índice i apuntaría a otra cosa.
             Medir el control equivocado es peor que no medir. */
          if (p.url() !== BASE + ruta) {
            await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
            await p.waitForTimeout(Math.min(esp, 1600));
          }
          const nodo = (await p.$$('a[href],button,summary,[role="button"],.serv,.pieza,.trabajo'))[0];
          if (!nodo) break;
          const ok = await p.evaluate(([sel, idx]) => {
            const vis = (x) => {
              for (let e = x; e && e !== document.documentElement; e = e.parentElement) {
                if (e.hasAttribute && e.hasAttribute('hidden')) return false;
                const cs = getComputedStyle(e);
                if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
                if (e !== x && cs.pointerEvents === 'none') return false;
              }
              const b = x.getBoundingClientRect();
              return b.width > 1 && b.height > 1;
            };
            const todos = [...document.querySelectorAll(sel)].filter(vis).filter((x) => {
              if (x.target === '_blank') return false;
              const h = x.getAttribute('href') || '';
              if (/^(https?:|mailto:|tel:)/.test(h)) return false;
              if (x.closest('.visor')) return false;
              return true;
            });
            const el = todos[idx];
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
          }, ['a[href],button,summary,[role="button"],.serv,.pieza,.trabajo', i]);
          if (!ok) continue;
          tocados++;
          await p.waitForTimeout(650);
          d = await p.evaluate(DESPUES);
        } catch (e) {
          problemas.push(`${q} · ${lista[i]}: se cortó al tocarlo (${String(e.message).slice(0, 45)})`);
          continue;
        }
        if (errs.length > antes)
          problemas.push(`${q} · ${lista[i]}: tira un error · ${errs[errs.length - 1]}`);
        if (d && d.desborde > 2)
          problemas.push(`${q} · ${lista[i]}: deja la página ${d.desborde}px más ancha que la pantalla`);
        if (d && d.texto < 20)
          problemas.push(`${q} · ${lista[i]}: deja la pantalla sin texto`);
        if (d && d.salidas === 0)
          problemas.push(`${q} · ${lista[i]}: callejón sin salida, no queda nada para tocar`);
      }
    }

    await ctx.close();
    return { ap, problemas, tocados };
  };
  for (const r of await Promise.all(TOCAR.map(tocar))) {
    if (r.problemas.length) {
      mal(`${r.ap.n}: ${r.problemas.length} problema(s) tocando ${r.tocados} controles`);
      r.problemas.slice(0, 8).forEach((x) => console.log('      · ' + x));
    } else {
      bien(`${r.ap.n}: ${r.tocados} controles tocados, ninguno rompe nada`);
    }
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
