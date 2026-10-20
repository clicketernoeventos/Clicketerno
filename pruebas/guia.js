/* ═══════════════════════════════════════════════════════════════
   EL FLYER DEL LISTADO · flyer/listado.html

   Pedido del dueño (20/10/2026): «un flyer con todo lo que contiene
   ese Dashboard y cómo entenderlo y manejarlo. Hacelo GENÉRICO así
   ya lo tengo para todos los que hagan invitación. ¿A qué me
   refiero con genérico? Que a la hora de poner la contraseña diga
   "el correo que nos enviaste para usar como contraseña" y cosas
   así».

   Lo que se mide, y por qué cada cosa:

   · QUE SEA GENÉRICA, que es el pedido entero. Una guía con el
     nombre de una fiesta adentro deja de servir para la siguiente,
     y el que la recibe ve el nombre de otra clienta. Acá se falla
     si aparece el nombre de cualquier evento del repo, o una
     dirección de listado de uno en concreto.
   · Que no prometa una contraseña que no es: la clave de cada
     listado la elige el cliente y se la pasamos nosotros, así que
     la guía la nombra, no la escribe.
   · Que se pueda IMPRIMIR. Se manda por WhatsApp como link y se
     guarda en PDF; si la hoja sale corrida, la mitad se va fuera
     del papel. Ya pasó con las tarjetas para cortar.
   · Y lo de siempre en tres aparatos: que nada se salga, que todo
     lo que se toca llegue a 44x44 y que la consola quede limpia.

   Contra el código anterior no corre: la página no existía y la
   dirección daba 404. Eso es lo primero que mide.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const RUTA = '/flyer/listado.html';
const RAIZ = path.dirname(__dirname);
const APARATOS = [
  { nombre: 'iPhone SE  320', ancho: 320, alto: 568, dedo: true },
  { nombre: 'iPhone     390', ancho: 390, alto: 844, dedo: true },
  { nombre: 'escritorio 1280', ancho: 1280, alto: 900, dedo: false },
];

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');
const ruido = (t) => /favicon|net::ERR_|ERR_CERT|fonts\.googleapis|fonts\.gstatic/i.test(t);

(async () => {
  const navegador = await chromium.launch();

  /* ── existe, y NO se publica ──
     Es un archivo para mandar por WhatsApp, no una página del sitio:
     el dueño lo dijo con todas las letras, *"yo quería un flyer, no
     armarla en la página"*. Si `flyer/` se cayera de .assetsignore,
     Cloudflare lo subiría y quedaría una página suelta en el sitio sin
     que nadie se entere — el servidor de pruebas la sirve igual, así
     que esto NO se nota mirando la pantalla. */
  titulo('el archivo');
  {
    const ignora = fs.readFileSync(path.join(RAIZ, '.assetsignore'), 'utf8');
    if (!/^flyer\/$/m.test(ignora))
      mal('`flyer/` no está en .assetsignore: se va a publicar como una página del sitio');
    else bien('`flyer/` no se publica: es un archivo que se manda');
  }
  titulo('la fuente');
  const r = await fetch(BASE + RUTA);
  const crudo = r.ok ? await r.text() : '';
  if (!r.ok) {
    mal(`${RUTA} no se puede abrir (${r.status}): es de donde sale el flyer`);
    await navegador.close();
    console.log(`\n${fallas.length} FALLAS`);
    process.exit(1);
  }
  bien('la fuente del flyer abre');

  /* ── es genérica ──
     Los nombres salen de las carpetas del repo, no escritos a mano:
     escritos, la prueba se queda corta sola el día que entra una
     invitación nueva — que es justo el día en que alguien podría
     meterle el nombre a la guía. */
  titulo('sirve para todos: no nombra ninguna fiesta');
  {
    const carpetas = fs.readdirSync(RAIZ, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .filter((n) => fs.existsSync(path.join(RAIZ, n, 'index.html')))
      .filter((n) => !['invitaciones', 'pruebas', 'lib', 'iconos', 'demo', 'muestra', 'video', 'sql', 'ads'].includes(n));

    const texto = crudo.replace(/<!--[\s\S]*?-->/g, '');   /* los comentarios no los ve nadie */
    const nombrada = carpetas.filter((n) => new RegExp('\\b' + n + '\\b', 'i').test(texto));
    if (nombrada.length)
      mal(`nombra ${nombrada.length} fiesta(s) concreta(s) —${nombrada.join(', ')}—: así no sirve para el cliente siguiente`);
    else
      bien(`no nombra ninguna de las ${carpetas.length} fiestas del repo`);

    /* Y tampoco una dirección de listado de alguien. */
    const direccion = texto.match(/[a-z0-9-]+\/listado/gi) || [];
    if (direccion.length)
      mal(`escribe una dirección de listado concreta: ${direccion[0]}`);
    else
      bien('ni una dirección de listado de nadie');

    /* La contraseña se NOMBRA, no se escribe: la de cada listado la
       elige el cliente. Una guía con una contraseña adentro es una
       guía que miente en la siguiente fiesta — y si acertara, peor. */
    const correo = texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
    const ajenos = correo.filter((c) => !/clicketerno/i.test(c));
    if (ajenos.length) mal(`tiene un correo escrito adentro: ${ajenos[0]}`);
    else bien('y la contraseña la nombra, no la escribe');

    const dice = /correo que nos (mandaste|enviaste|pasaste)/i.test(texto);
    if (!dice) mal('no dice de dónde sacar la contraseña con las palabras del cliente');
    else bien('dice de dónde sacarla: "el correo que nos mandaste para usar como contraseña"');
  }

  /* ── están las partes del tablero ──
     Una guía a la que le falta una parte es peor que no tenerla: el
     cliente la lee entera, no encuentra lo que busca y escribe igual. */
  titulo('explica todo lo que tiene el tablero');
  {
    const partes = [
      ['los tres números', /vienen/i, /respuestas/i],
      ['la diferencia entre gente y respuestas', /personas/i],
      ['una fila por persona', /cada persona es un rengl/i],
      ['las columnas visibles', /columnas visibles/i],
      ['el Excel', /descargar excel/i],
      ['imprimir', /imprimir listado/i],
      ['el PDF para mandar', /pdf/i],
      ['la comida de cada uno', /comida/i],
      ['qué pasa si confirman dos veces', /dos veces/i],
    ];
    const faltan = partes.filter((p) => !p.slice(1).every((re) => re.test(crudo)));
    if (faltan.length) mal(`no explica: ${faltan.map((f) => f[0]).join(' · ')}`);
    else bien(`explica las ${partes.length} partes del tablero`);
  }

  /* ── en tres aparatos ── */
  for (const ap of APARATOS) {
    titulo(ap.nombre);
    const ctx = await navegador.newContext({
      viewport: { width: ap.ancho, height: ap.alto },
      hasTouch: ap.dedo, isMobile: ap.dedo,
    });
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', (m) => m.type() === 'error' && !ruido(m.text()) && errs.push(m.text()));
    p.on('pageerror', (e) => !ruido(String(e)) && errs.push(String(e)));
    await p.goto(BASE + RUTA, { waitUntil: 'load' });
    await p.waitForTimeout(300);

    /* Las cajas de verdad: el `overflow-x:hidden` del body hace que
       `scrollWidth` devuelva el ancho de la pantalla con la página
       rota. Se exime lo que un padre recorta a propósito —la tabla
       de ejemplo se desliza—. */
    const salidos = await p.evaluate(() => [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        if (!r.width) return false;
        if (r.right <= innerWidth + 1 && r.left >= -1) return false;
        for (let a = e.parentElement; a; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (/auto|scroll|hidden/.test(cs.overflowX)) return false;
        }
        return true;
      }).map((e) => e.tagName + '.' + (e.className || '').toString().slice(0, 22)));
    if (salidos.length) mal(`${salidos.length} se salen de la pantalla: ${salidos[0]}`);
    else bien('nada se sale por el costado');

    if (ap.dedo) {
      const chicos = await p.evaluate(() => [...document.querySelectorAll('a,button')]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.width < 44 || r.height < 44);
        }).map((e) => (e.textContent || '').trim().slice(0, 20) + ' ' +
          Math.round(e.getBoundingClientRect().width) + 'x' +
          Math.round(e.getBoundingClientRect().height)));
      if (chicos.length) mal(`${chicos.length} no llegan a 44x44: ${chicos[0]}`);
      else bien('todo lo que se toca llega a 44x44');
    }

    /* El botón de WhatsApp lleva el mensaje puesto; y sin JavaScript
       lleva igual a algún lado, que es por lo que el href ya está
       escrito en el HTML. */
    const href = await p.evaluate(() => (document.getElementById('wsp') || {}).href || '');
    if (!/wa\.me\/\d+\?text=.+/.test(href)) mal('el botón de WhatsApp no manda ningún mensaje');
    else bien('el botón de WhatsApp abre con el mensaje puesto');

    if (errs.length) mal(`la consola tira un error: ${errs[0].slice(0, 90)}`);
    else bien('sin errores de JavaScript (la CSP no bloqueó nada)');
    await ctx.close();
  }

  /* ── en papel ──
     Se manda como link y se guarda en PDF. Con el padding de la
     pantalla puesto, la hoja arranca corrida y lo de la derecha se
     va afuera: pasó con las tarjetas para cortar y se descubrió en
     la impresora del cliente. */
  titulo('impresa');
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE + RUTA, { waitUntil: 'load' });
    await p.emulateMedia({ media: 'print' });
    await p.waitForTimeout(200);

    const hoja = await p.evaluate(() => {
      const h = document.querySelector('.hoja').getBoundingClientRect();
      const cs = getComputedStyle(document.body);
      return { x: Math.round(h.x), padBody: cs.paddingLeft, ancho: Math.round(h.width) };
    });
    if (hoja.padBody !== '0px')
      mal(`en papel el body conserva ${hoja.padBody} de borde: corre la hoja y la derecha se va afuera`);
    else bien('en papel los contenedores se resetean');

    const botones = await p.evaluate(() => [...document.querySelectorAll('.btn')]
      .filter((b) => b.getBoundingClientRect().width > 0).length);
    if (botones) mal(`${botones} botones se imprimen: en papel un botón es una mancha que no hace nada`);
    else bien('los botones no se imprimen');

    /* Y que el papel esté declarado en milímetros, no en píxeles: una
       hoja en px sale de otro tamaño en cada impresora. */
    if (!/@page\s*\{[^}]*210mm/.test(crudo)) mal('la hoja no está declarada en milímetros (A4)');
    else bien('la hoja está declarada como A4 en milímetros');
    await ctx.close();
  }

  /* ── el armado deja los archivos ──
     Lo que se manda es el PDF y las imágenes, no el HTML: si el armador
     se rompe, el dueño se entera recién cuando va a mandar el flyer. */
  titulo('lo que se manda');
  {
    for (const f of ['listado.pdf', 'listado-1.png']) {
      const donde = path.join(RAIZ, 'flyer', f);
      if (!fs.existsSync(donde)) mal(`falta ${f}: corré \`bash flyer/armar.sh\``);
      else if (fs.statSync(donde).size < 20000) mal(`${f} pesa casi nada: salió vacío`);
      else bien(`${f} armado (${(fs.statSync(donde).size / 1024).toFixed(0)} KB)`);
    }
  }

  await navegador.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
