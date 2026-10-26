/* Prueba el Apps Script de las confirmaciones SIN Google.
 *
 * Por qué existe: ese código corre en los servidores de Google, no acá,
 * y el que lo estrena es el invitado la noche de la fiesta. Si una
 * columna se crea mal o una confirmación pisa la de otro, no hay
 * ninguna pantalla donde mirarlo: llega un "no anda" por WhatsApp al
 * otro día, con la planilla ya sucia.
 *
 * Así que se le arma una planilla de mentira —con las mismas cinco
 * cosas que usa de SpreadsheetApp— y se lo ataca como lo haría una
 * fiesta: dos invitados a la vez, uno que toca dos veces, uno que
 * cambia de opinión, un campo que no existía, y alguien sin la clave.
 *
 *     node pruebas/rsvp.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');

const fallas = [];
const mal  = m => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = m => console.log('  ✓ ' + m);
const es = (cond, m) => cond ? bien(m) : mal(m);

/* ── la planilla de mentira ──────────────────────────────────────
   Solo lo que el script usa de verdad. Si algún día usa algo más,
   esto revienta acá y no en la fiesta. */
function hojaFalsa(filas = [], nombre = 'Hoja 1') {
  const d = filas.map(f => f.slice());
  const h = {
    datos: d,
    getName: () => nombre,
    getLastRow: () => d.length,
    getLastColumn: () => d.reduce((m, f) => Math.max(m, f.length), 0),
    setFrozenRows: () => h,
    appendRow(f) { d.push(f.slice()); return h; },
    getDataRange: () => h.getRange(1, 1, Math.max(1, d.length), Math.max(1, h.getLastColumn())),
    getRange(fila, col, nf = 1, nc = 1) {
      const caja = {
        getValues() {
          const sal = [];
          for (let i = 0; i < nf; i++) {
            const f = [];
            for (let j = 0; j < nc; j++) f.push((d[fila - 1 + i] || [])[col - 1 + j] ?? '');
            sal.push(f);
          }
          return sal;
        },
        getDisplayValues: () => caja.getValues().map(f => f.map(v => String(v ?? ''))),
        setValues(v) {
          for (let i = 0; i < v.length; i++) {
            while (d.length < fila + i) d.push([]);
            for (let j = 0; j < v[i].length; j++) d[fila - 1 + i][col - 1 + j] = v[i][j];
          }
          return caja;
        },
        setValue(v) { return caja.setValues([[v]]); },
        setFontWeight: () => caja
      };
      return caja;
    }
  };
  return h;
}

/* ── cargar el .gs.txt con los globales de Apps Script falsos ──── */
function cargar(filas = [], ahora = null) {
  const hoja = hojaFalsa(filas);
  const props = {};
  let uuid = 0;
  const registro = [];
  const caja = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [hoja] }) },
    /* El de Google tiene las tres. Con `deleteProperty` sin poner, el
       freno de intentos reventaba acá con "is not a function" y la
       suite se cortaba entera: un falso al que le falta un método de
       los de verdad no mide el código, mide al falso. */
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = v; },
      deleteProperty: k => { delete props[k]; }
    }) },
    Utilities: {
      /* El de Google es un uuid v4: hexadecimal y al azar. El falso
       también, o la prueba mediría otra cosa. */
    getUuid: () => { uuid++; return require('crypto').randomUUID(); },
      base64EncodeWebSafe: s => Buffer.from(String(s)).toString('base64url'),
      /* La de verdad respeta la zona. La falsa también, que es
         justamente lo que hay que medir. */
      formatDate: (fecha, zona, _f) => new Intl.DateTimeFormat('sv-SE', {
        timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(fecha).replace(' ', ' ')
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: t => ({ texto: t, setMimeType() { return this; } })
    },
    Logger: { log: m => registro.push(String(m)) },
    console
  };
  /* El reloj va adentro del contexto: el vm tiene sus propios
     globales, así que pisar el Date de afuera no lo toca y la
     comprobación de la zona pasaba midiendo la hora de hoy. */
  if (ahora) {
    const real = Date;
    caja.Date = class extends real {
      constructor(...x) { super(...(x.length ? x : [ahora])); }
      static now() { return new real(ahora).getTime(); }
    };
  } else caja.Date = Date;
  vm.createContext(caja);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'evento-nuevo.gs.txt'), 'utf8'), caja);
  const leer = r => JSON.parse(r.texto);
  return {
    hoja, props, registro, caja,
    preparar: () => caja.preparar(),
    post: campos => leer(caja.doPost({ parameter: Object.assign({}, campos) })),
    get:  p => leer(caja.doGet({ parameter: p || {} }))
  };
}

console.log('\n─── preparar(): deja la planilla y la clave listas ───');
{
  const a = cargar();
  const clave = a.preparar();
  es(a.hoja.datos.length === 1, 'escribe la fila de títulos');
  es(a.hoja.datos[0].join('|') === 'Cuándo|Nombre|Confirma',
     'los títulos son los tres de siempre');
  es(typeof clave === 'string' && clave.length >= 12,
     `inventa una clave larga (${clave.length} caracteres)`);
  es(a.props.CLAVE_LISTADO === clave, 'la guarda en las propiedades del proyecto');
  es(a.registro.join('\n').includes(clave), 'y la muestra en el registro, para copiarla');

  /* Correrla dos veces no puede romper nada: el que la corre no sabe
     si ya la corrió. */
  const antes = a.props.CLAVE_LISTADO, filas = a.hoja.datos.length;
  a.preparar();
  es(a.props.CLAVE_LISTADO === antes, 'corrida dos veces NO cambia la clave');
  es(a.hoja.datos.length === filas, 'ni repite los títulos');

  const b = cargar();
  es(b.preparar() !== clave, 'dos eventos distintos no comparten clave');
}

console.log('\n─── la clave elegida a mano ───');
{
  /* Se puede elegir la clave en vez de dejar que la invente la
     planilla. No es lo recomendado —un correo es público y
     adivinable, y esa clave abre la lista entera— pero es decisión
     de quien vende, y si está puesta tiene que ANDAR: una clave que
     se acepta a medias es peor que no tenerla.

     EL DATO DE PRUEBA ES INVENTADO, y no es un detalle de estilo.
     Acá estaba el correo de verdad de la familia de un cliente, de
     cuando esto se escribió. El día que ese correo pasó a ser la
     clave de verdad de su listado —decisión del dueño, 18/10/2026—
     quedó versionada en el repo la llave que abre la lista entera de
     invitados de esa fiesta, con sus nombres y sus comidas.
     Un dato de prueba que es el de un cliente deja de ser de prueba
     el día que ese cliente lo usa. */
  const a = cargar();
  const CLAVE_DE_MENTIRA = 'clave.de.prueba@ejemplo.com';
  a.caja.CLAVE_ELEGIDA = CLAVE_DE_MENTIRA;
  const clave = a.preparar();
  es(clave === CLAVE_DE_MENTIRA, 'preparar() usa la que se eligió');
  es(a.props.CLAVE_LISTADO === clave, 'y la guarda en las propiedades');
  es(a.get({ clave }).error === undefined, 'y con ella se entra al listado');
  es(a.get({ clave: 'otra' }).error === 'clave', 'con otra, no');
  /* Correrla de nuevo no puede cambiarla. */
  a.preparar();
  es(a.props.CLAVE_LISTADO === clave, 'corrida dos veces sigue siendo la misma');
}

console.log('\n─── la clave maestra, y el freno ───');
{
  /* La maestra es la misma para todas las invitaciones y la tiene
     Click Eterno: es para poder abrir el listado de un cliente sin ir
     a buscar su clave. Pedido del dueño el 20/10/2026.
     El valor de verdad NO está acá ni en el repo: vive en la copia
     del editor del dueño y en las propiedades de cada proyecto. Acá
     se prueba con uno inventado — un dato de prueba que es el de un
     cliente deja de ser de prueba el día que el cliente lo usa. */
  const a = cargar();
  const DEL_EVENTO = 'clave.de.prueba@ejemplo.com';
  const MAESTRA = '1234';
  a.caja.CLAVE_ELEGIDA = DEL_EVENTO;
  a.caja.CLAVE_MAESTRA_ELEGIDA = MAESTRA;
  a.preparar();
  es(a.props.CLAVE_MAESTRA === MAESTRA, 'preparar() guarda la maestra');
  es(a.get({ clave: DEL_EVENTO }).error === undefined, 'entra la del evento');
  es(a.get({ clave: MAESTRA }).error === undefined, 'y entra la maestra');
  es(a.get({ clave: '9999' }).error === 'clave', 'y una cualquiera no entra');

  /* EL FRENO. La maestra elegida son cuatro dígitos, o sea diez mil
     combinaciones en una puerta abierta a internet: un script las
     prueba todas en minutos y se lleva la lista de invitados —con
     las comidas, que son datos de salud— de TODOS los clientes.
     El freno no la vuelve larga, la vuelve lenta.
     Se mide con intentos FALLADOS seguidos, que es lo que hace un
     atacante, y se comprueba que el que acierta lo borra: si no, el
     cliente que se equivocó dos veces quedaría castigado. */
  const b = cargar();
  b.caja.CLAVE_ELEGIDA = DEL_EVENTO;
  b.caja.CLAVE_MAESTRA_ELEGIDA = MAESTRA;
  b.preparar();
  let frenado = null;
  for (let i = 0; i < 20 && frenado === null; i++){
    const r = b.get({ clave: '0' + i });
    if (r.error === 'frenado') frenado = i + 1;
  }
  es(frenado !== null && frenado <= 14,
     frenado === null ? 'probando mil claves no frena NUNCA: la puerta se abre a fuerza bruta'
                      : 'a los ' + frenado + ' intentos fallados la puerta se cierra');
  es(b.get({ clave: MAESTRA }).error === 'frenado',
     'y frenada no entra ni la buena: el freno no distingue, por eso dura poco');

  const c = cargar();
  c.caja.CLAVE_ELEGIDA = DEL_EVENTO;
  c.caja.CLAVE_MAESTRA_ELEGIDA = MAESTRA;
  c.preparar();
  c.get({ clave: 'mal' }); c.get({ clave: 'mal' });
  es(c.get({ clave: DEL_EVENTO }).error === undefined,
     'el que se equivoca dos veces y después acierta, entra');
  const d = c.props.FALLOS;
  es(!d, 'y acertar borra la cuenta: no se arrastra de una visita a la otra');
}

console.log('\n─── el invitado confirma ───');
{
  const a = cargar(); a.preparar();
  es(a.post({ Nombre: 'Sofía Pérez', Confirma: 'Sí' }).ok === true, 'entra una confirmación');
  es(a.hoja.datos.length === 2, 'queda una sola fila');
  es(a.hoja.datos[1][1] === 'Sofía Pérez', 'con su nombre en la columna que va');

  es(a.post({ Confirma: 'Sí' }).ok === false, 'sin nombre NO entra');
  es(a.hoja.datos.length === 2, 'y no deja una fila vacía');
}

console.log('\n─── un campo que la planilla no conocía ───');
{
  const a = cargar(); a.preparar();
  a.post({ Nombre: 'Ana', Confirma: 'Sí', 'Menú': 'Vegetariano', 'Canción': 'Cualquiera' });
  es(a.hoja.datos[0].includes('Menú') && a.hoja.datos[0].includes('Canción'),
     'se crean las columnas solas');
  const i = a.hoja.datos[0].indexOf('Menú');
  es(a.hoja.datos[1][i] === 'Vegetariano', 'y el valor cae en la suya');

  /* El que vino antes no tiene por qué tener ese campo. */
  a.post({ Nombre: 'Beto', Confirma: 'Sí' });
  es(a.hoja.datos[2][i] === '' || a.hoja.datos[2][i] === undefined,
     'el que no lo contesta queda vacío, no corrido');
  es(a.hoja.datos[2][1] === 'Beto', 'y su nombre sigue en su columna');
}

console.log('\n─── el que toca dos veces y el que cambia de opinión ───');
{
  const a = cargar(); a.preparar();
  a.post({ Nombre: 'Caro', Confirma: 'Sí' });
  a.post({ Nombre: 'Caro', Confirma: 'Sí' });
  es(a.hoja.datos.length === 2, 'tocar dos veces NO deja dos filas');

  a.post({ Nombre: 'caro', Confirma: 'No' });
  es(a.hoja.datos.length === 2, 'cambiar de opinión tampoco (ni con otra mayúscula)');
  es(a.hoja.datos[1][2] === 'No', 'y queda la respuesta NUEVA');

  a.post({ Nombre: 'Caro Gómez', Confirma: 'Sí' });
  es(a.hoja.datos.length === 3, 'pero otro nombre parecido SÍ es otra persona');
}

console.log('\n─── la hora es la de Rosario, no la de UTC ───');
{
  /* 2 de enero, 01:30 UTC = 1 de enero, 22:30 en Rosario. Con UTC la
     planilla fecharía la confirmación al día siguiente. */
  const a = cargar([], '2027-01-02T01:30:00Z'); a.preparar();
  a.post({ Nombre: 'Tarde', Confirma: 'Sí' });
  const cuando = String(a.hoja.datos[1][0]);
  es(cuando.startsWith('2027-01-01'), `fecha la confirmación el 1, no el 2 (dice "${cuando}")`);
  es(cuando.includes('22:30'), 'y con la hora de acá');
}

console.log('\n─── la puerta del invitado no entrega datos ───');
{
  const a = cargar(); a.preparar();
  a.post({ Nombre: 'Sofía', Confirma: 'Sí', Teléfono: '341 555' });

  const si = a.get({ confirmado: 'Sofía' });
  es(si.ok === true, 'le dice que SÍ llegó la suya');
  es(JSON.stringify(si) === '{"ok":true}', 'y no manda nada más que eso');
  es(!JSON.stringify(si).includes('341'), 'ni un teléfono se escapa por ahí');

  es(a.get({ confirmado: '  sofía ' }).ok === true, 'no se pierde por un espacio o una mayúscula');
  es(a.get({ confirmado: 'Otro' }).ok === false, 'y del que no está dice que no');
}

console.log('\n─── la lista entera pide la clave ───');
{
  const a = cargar(); const clave = a.preparar();
  a.post({ Nombre: 'Uno', Confirma: 'Sí' });
  a.post({ Nombre: 'Dos', Confirma: 'No' });
  a.post({ Nombre: 'Tres', Confirma: 'Sí' });

  const sin = a.get({});
  es(sin.error === 'clave' && !sin.invitados, 'sin clave no devuelve ni una fila');
  const falsa = a.get({ clave: 'cualquiera' });
  es(falsa.error === 'clave' && !falsa.invitados, 'con una clave inventada tampoco');
  es(!JSON.stringify(falsa).includes('Uno'), 'y no se filtra ningún nombre en el error');

  const ok = a.get({ clave });
  es(Array.isArray(ok.invitados) && ok.invitados.length === 3, 'con la clave, los tres');
  es(ok.invitados[0]['Nombre'] === 'Uno', 'con sus columnas por nombre');

  /* Sin la clave puesta, la puerta tiene que decir QUÉ falta: ese
     mensaje es lo que hace que el listado sepa distinguir "la clave
     está mal" de "el Apps Script todavía está a medio armar". */
  const b = cargar([['Cuándo', 'Nombre', 'Confirma']]);
  es(b.get({ clave: 'x' }).error === 'sin_clave_configurada',
     'sin preparar(), avisa que falta correrlo');
}

console.log('\n─── el resumen lo cuenta la planilla ───');
{
  const a = cargar(); const clave = a.preparar();
  [['Uno','Sí'],['Dos','No'],['Tres','sí'],['Cuatro','Confirmo'],
   ['Cinco','no voy'],['Seis','Sí, voy']].forEach(([n,c]) => a.post({ Nombre:n, Confirma:c }));
  const r = a.get({ clave }).resumen;
  es(r.total === 6, 'cuenta los seis');
  es(r.confirmados === 4, `cuenta 4 que van (dio ${r.confirmados})`);
  es(r.no === 2, 'y 2 que no');
  /* "no voy" empieza con "voy" adentro: si el sí se buscara por
     "contiene", contaría como que va y el cliente encarga de más. */
  es(a.get({ clave }).invitados[4]['Confirma'] === 'no voy',
     'y "no voy" sigue escrito tal cual, solo que no cuenta como sí');
  es(a.get({ clave }).columnas.confirma === 'Confirma',
     'y dice con qué columna contó, para que el listado no adivine');
}

console.log('\n─── de punta a punta con los campos DE VERDAD de mia15 ───');
/* El Apps Script crea cada columna con el nombre del campo que le
   llega, así que lo que decide si la planilla sale bien es cómo se
   llaman los `name=` del formulario. Acá no se escriben a mano: se
   LEEN del HTML y se postean ESOS. Escritos a mano, el día que el
   formulario renombre un campo la prueba seguiría verde posteando
   un nombre que ya no existe — comprobado rompiéndolo a propósito:
   con la primera versión, renombrar el campo no la hacía fallar. */
{
  const html = fs.readFileSync(path.join(__dirname, '..', 'mia15', 'index.html'), 'utf8');
  const form = (html.match(/<form id="rsvp"[\s\S]*?<\/form>/) || [''])[0];
  const campos = [...form.matchAll(/name="([^"]+)"/g)].map(m => m[1])
                   .filter((v, i, a) => a.indexOf(v) === i);
  /* Los acompañantes no están en el HTML: los dibuja el JS con el
     nombre de columna adentro. Se lee de ahí por el mismo motivo. */
  const plantillaInv = (html.match(/const nom = '([^']+)' \+ k/) || [])[1];
  /* Y desde que cada acompañante elige SU comida, hay una columna por
     persona. Antes era una sola para todos: eligiendo "Celíaco" con
     cinco invitados, la planilla decía que los cinco eran celíacos —y
     eso se le pasa al salón tal cual. */
  const plantillaCom = (html.match(/, com = '([^']+)' \+ k/) || [])[1];

  /* Estos dos el Apps Script los busca POR NOMBRE para contar y para
     contestarle al invitado si ya está. Renombrarlos no rompe nada a
     la vista: la planilla se llena igual y el resumen da cero. */
  const campoNombre = campos.find(c => /nombre/i.test(c));
  const campoSiNo   = campos.find(c => /confirma/i.test(c));
  es(!!campoNombre && !!campoSiNo,
     `el formulario manda ${campos.length} campos: ${campos.join(', ')}`);
  es(!!plantillaInv, `y arma los acompañantes como "${plantillaInv}N"`);
  es(!!plantillaCom, `y la comida de cada uno como "${plantillaCom}N"`);

  const a = cargar();
  const clave = a.preparar();
  /* Uno que viene, con TODOS los campos que el formulario manda. */
  const viene = {};
  for (const c of campos) viene[c] = 'algo';
  viene[campoNombre] = 'Juan Pérez';
  viene[campoSiNo] = 'Sí';
  if (plantillaInv){ viene[plantillaInv + '2'] = 'Ana Pérez'; viene[plantillaInv + '3'] = 'Luz Pérez'; }
  if (plantillaCom){ viene[plantillaCom + '2'] = 'Vegetariano'; viene[plantillaCom + '3'] = 'Celíaco'; }
  /* Tres personas en una sola respuesta: lo que el resumen tiene que
     contar como TRES y no como una. */
  const campoCuantos = campos.find(c => /cu[aá]nt/i.test(c));
  if (campoCuantos) viene[campoCuantos] = '3';
  a.post(viene);
  /* Y uno que NO viene: desde que el formulario deshabilita lo que
     no es suyo, de éste llegan SOLO el nombre y el sí/no. */
  a.post({ [campoNombre]: 'Carla Gómez', [campoSiNo]: 'No' });

  const titulos = a.hoja.datos[0];
  const faltan = campos.filter(c => !titulos.includes(c));
  es(faltan.length === 0, faltan.length
    ? `la planilla no creó la(s) columna(s): ${faltan.join(', ')}`
    : `la planilla creó sola las ${campos.length} columnas del formulario`);
  if (plantillaInv)
    es(titulos.includes(plantillaInv + '2') && titulos.includes(plantillaInv + '3'),
       `y las de los acompañantes ("${plantillaInv}2", "${plantillaInv}3")`);

  const d = a.get({ clave });
  es(d.resumen.total === 2 && d.resumen.confirmados === 1 && d.resumen.no === 1,
     `el resumen da 2 · 1 confirmado · 1 que no (dio ${d.resumen.total} · ${d.resumen.confirmados} · ${d.resumen.no})`);
  es(d.columnas.confirma === campoSiNo,
     `y cuenta por la columna "${campoSiNo}", no por "Cuándo"`);
  const carla = d.invitados.find(i => i[campoNombre] === 'Carla Gómez');
  if (campoCuantos)
    es(carla && !String(carla[campoCuantos] || '').trim(),
       `el que no viene NO deja un número en "${campoCuantos}": esa es la columna de las mesas`);
  const juan = d.invitados.find(i => i[campoNombre] === 'Juan Pérez');
  if (plantillaInv)
    es(juan && juan[plantillaInv + '2'] === 'Ana Pérez' && juan[plantillaInv + '3'] === 'Luz Pérez',
       'y los acompañantes llegan con nombre y apellido, no como un número');
  if (plantillaCom)
    es(juan && juan[plantillaCom + '2'] === 'Vegetariano' && juan[plantillaCom + '3'] === 'Celíaco',
       'y cada uno con SU comida, no la del primero repetida');

  /* ── el número que mira el que arma las mesas ──
     Una respuesta que dice "somos 3" son tres personas. Contada como
     una, el cliente encarga comida para menos gente de la que va: lo
     reportó el dueño con la planilla en la mano —"confirmaron dos
     personas y figura como 1"—. */
  if (campoCuantos){
    const r2 = a.get({ clave }).resumen;
    es(r2.personas === 3,
       `y el resumen dice cuánta GENTE viene, no cuántas respuestas (dio ${r2.personas} de 3)`);
    es(r2.total === 2 && r2.confirmados === 1,
       'sin perder las respuestas: 2 contestaron, 1 viene');
  }
  es(a.get({ confirmado: '  juan pérez  ' }).ok === true,
     'y la puerta del invitado lo reconoce con espacios y en minúscula');
}

/* ════════════════════════════════════════════════════════════════
   LA PLANILLA CENTRAL · apps-script/planilla-central.gs.txt

   Una sola planilla y un solo Apps Script para TODAS las
   invitaciones, con una pestaña por fiesta. Es lo que hace que
   agregar una tarjeta nueva no cueste seis clics en la interfaz de
   Google.

   Lo que hay que medir acá no es que guarde una fila —eso ya está
   medido arriba— sino lo ÚNICO que trae tener a todos los clientes
   adentro del mismo archivo: que no se mezclen. Una fuga ahí no tira
   ningún error, se ve como un listado perfecto con la gente de otra
   fiesta.
   ════════════════════════════════════════════════════════════════ */

function cargarCentral(opciones = {}) {
  const hojas = [];
  const props = Object.assign({}, opciones.props || {});
  const registro = [];
  let pedidosLista = 0;
  const libro = {
    getSheets: () => hojas.slice(),
    getSheetByName: n => hojas.find(h => h.getName() === n) || null,
    insertSheet(n) { const h = hojaFalsa([], n); hojas.push(h); return h; }
  };
  const caja = {
    SpreadsheetApp: { getActiveSpreadsheet: () => libro },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = v; },
      deleteProperty: k => { delete props[k]; }
    }) },
    /* El script le pregunta al SITIO qué fiestas existen. El falso
       contesta lo que le diga la prueba — y puede contestar que se
       cayó, que es justamente el caso que hay que medir. */
    UrlFetchApp: { fetch: () => {
      pedidosLista++;
      if (opciones.sitioCaido) throw new Error('sin red');
      return {
        getResponseCode: () => opciones.codigo || 200,
        getContentText: () => JSON.stringify({ eventos: opciones.eventos || ['almi15'] })
      };
    } },
    Utilities: {
      getUuid: () => require('crypto').randomUUID(),
      formatDate: (fecha, zona) => new Intl.DateTimeFormat('sv-SE', {
        timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(fecha)
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: t => ({ texto: t, setMimeType() { return this; } })
    },
    Logger: { log: m => registro.push(String(m)) },
    Date, console
  };
  vm.createContext(caja);
  let fuente = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script', 'planilla-central.gs.txt'), 'utf8');
  /* La maestra va en la copia del editor del dueño, nunca en el repo:
     acá se la pone la prueba, igual que él. */
  if (opciones.maestra)
    fuente = fuente.replace(/var CLAVE_MAESTRA_ELEGIDA = '';/,
                            "var CLAVE_MAESTRA_ELEGIDA = " + JSON.stringify(opciones.maestra) + ";");
  /* Lo mismo con la clave que eligió un cliente. */
  if (opciones.elegidas)
    fuente = fuente.replace(/var CLAVES_ELEGIDAS = \{\n\};/,
                            "var CLAVES_ELEGIDAS = " + JSON.stringify(opciones.elegidas) + ";");
  vm.runInContext(fuente, caja);
  const leer = r => JSON.parse(r.texto);
  return {
    libro, hojas, props, registro, caja,
    get pedidosLista() { return pedidosLista; },
    preparar: () => caja.preparar(),
    post: campos => leer(caja.doPost({ parameter: Object.assign({}, campos) })),
    get:  p => leer(caja.doGet({ parameter: p || {} })),
    /* La clave de una fiesta, como la leería el dueño: entrando con la
       maestra. NO se va a buscar a las propiedades, que sería medir por
       adentro un camino que en la realidad no existe. */
    claveDe: (ev, maestra) => leer(caja.doGet({ parameter: { evento: ev, clave: maestra } })).claveEvento
  };
}

console.log('\n─── la planilla central: preparar() ───');
{
  const a = cargarCentral({ maestra: 'clave-maestra-de-prueba' });
  es(a.preparar() === 'listo', 'preparar() deja la maestra puesta');
  es(a.props.CLAVE_MAESTRA === 'clave-maestra-de-prueba',
     'la guarda en las propiedades del proyecto, no en el código');
  /* El permiso de "servicio externo" se pide en el editor, con alguien
     mirando. Pedido la primera noche que un invitado confirme, no hay
     quién lo acepte y la confirmación se pierde. */
  es(a.pedidosLista > 0, 'y toca la lista de fiestas ahí, para que el permiso se pida en el editor');

  const b = cargarCentral({});
  es(b.preparar() !== 'listo', 'sin la maestra puesta, lo DICE en vez de dar por listo');

  /* Si la lista de fiestas no se puede leer, NINGUNA confirmación de
     una fiesta nueva entra. Eso no se ve por ningún lado hasta que un
     cliente avisa que su fila no está, así que preparar() lo dice. */
  const c = cargarCentral({ maestra: 'm', sitioCaido: true });
  es(c.preparar() !== 'listo', 'si no pudo leer la lista de fiestas, tampoco da por listo');
  es(c.registro.join(' ').indexOf('lista de fiestas') !== -1,
     'y lo escribe en el registro, que es lo único que mira una persona');
}

console.log('\n─── la maestra entra sin volver a correr preparar() ───');
{
  /* Pasó de verdad: el dueño puso la maestra en el editor, implementó,
     y el listado le decía "clave incorrecta" con la clave bien. La
     maestra vivía SÓLO en las propiedades y ahí la escribe preparar(),
     que es un paso aparte. Es la misma trampa que ya estaba resuelta
     para la clave que elige un cliente (se mira en claveDe_), aplicada
     a medias. */
  const a = cargarCentral({ maestra: 'mil-seiscientos', eventos: ['almi15'] });
  const r = a.get({ evento: 'almi15', clave: 'mil-seiscientos' });
  es(!r.error, 'escrita en el código, la puerta abre sin que nadie corra nada');
  es(a.props.CLAVE_MAESTRA === undefined,
     'y no hizo falta que estuviera guardada en las propiedades');

  /* Y cambiarla tiene que dejar de valer la vieja en el momento: si la
     propiedad ganara, la clave de antes seguiría abriendo para
     siempre. */
  const b = cargarCentral({ maestra: 'la-nueva', eventos: ['almi15'],
                            props: { CLAVE_MAESTRA: 'la-vieja' } });
  es(!b.get({ evento: 'almi15', clave: 'la-nueva' }).error, 'la nueva abre');
  es(b.get({ evento: 'almi15', clave: 'la-vieja' }).error === 'clave',
     'y la vieja deja de abrir, aunque siga guardada');
}

console.log('\n─── la pestaña se crea sola, pero sólo si la fiesta existe ───');
{
  const a = cargarCentral({ maestra: 'mmmm', eventos: ['almi15'] });
  es(a.post({ Nombre: 'Juan', Confirma: 'Sí' }).error === 'sin_evento',
     'sin decir de qué fiesta, no entra');
  es(a.hojas.length === 0, 'y no deja ninguna pestaña hecha');

  /* El agujero que cierra la lista: la dirección /exec está a la vista
     de cualquiera que abra una invitación, así que sin lista alcanza
     con mandar nombres inventados para llenar la planilla de pestañas
     basura — y el día que esté llena, la fiesta de verdad no puede
     crear la suya. */
  es(a.post({ evento: 'fiesta-trucha', Nombre: 'X', Confirma: 'Sí' }).error === 'evento_desconocido',
     'una fiesta que no está en la lista NO crea pestaña');
  es(a.hojas.length === 0, 'y la planilla sigue sin pestañas');

  es(a.post({ evento: 'almi15', Nombre: 'Juan Pérez', Confirma: 'Sí' }).ok === true,
     'la que SÍ está en la lista entra');
  es(a.hojas.length === 1 && a.hojas[0].getName() === 'almi15',
     'y se le crea su pestaña, con el nombre de la fiesta');
  es(a.hojas[0].datos[0].join('|') === 'Cuándo|Nombre|Confirma',
     'con los títulos de siempre');
  /* `evento` dice a qué pestaña va: como columna sería lo mismo
     repetido en todas las filas, que es el relleno que el dueño ya
     sacó del listado. */
  es(!a.hojas[0].datos[0].includes('evento'),
     'y "evento" NO queda de columna: no es una respuesta de nadie');

  /* El nombre viene de una página pública: es un dato, no una orden. */
  for (const feo of ['../otra', 'almi 15', 'a:b', 'x'.repeat(60), 'ALMI15/..'])
    es(a.post({ evento: feo, Nombre: 'X', Confirma: 'Sí' }).error === 'evento_desconocido'
       || a.post({ evento: feo, Nombre: 'X', Confirma: 'Sí' }).error === 'sin_evento',
       `un nombre de fiesta sucio no toca nada: ${JSON.stringify(feo).slice(0, 20)}`);
  es(a.hojas.length === 1, 'después de todo eso sigue habiendo UNA sola pestaña');
}

console.log('\n─── dos clientes en la misma planilla no se mezclan ───');
{
  const M = 'maestra-de-prueba';
  const a = cargarCentral({ maestra: M, eventos: ['almi15', 'otra15'] });
  a.preparar();
  a.post({ evento: 'almi15', Nombre: 'Juan Pérez', Confirma: 'Sí', 'Cuántos': '3' });
  a.post({ evento: 'otra15', Nombre: 'Ana Gómez',  Confirma: 'Sí', 'Cuántos': '2' });

  const kA = a.claveDe('almi15', M), kB = a.claveDe('otra15', M);
  es(!!kA && !!kB && kA !== kB, 'cada fiesta tiene SU clave, y no es la misma');
  /* Para pasársela al cliente no hay que entrar al editor de Apps
     Script: viene escrita al abrir su listado con la maestra. */
  es(a.get({ evento: 'almi15', clave: M }).claveEvento === kA,
     'y con la maestra se la puede leer, sin entrar al editor');
  es(a.get({ evento: 'almi15', clave: kA }).claveEvento === undefined,
     'con la clave del evento NO viene: ahí ya la tiene quien pregunta');

  const listaA = a.get({ evento: 'almi15', clave: kA });
  es(listaA.invitados.length === 1 && listaA.invitados[0].Nombre === 'Juan Pérez',
     'el listado de una fiesta trae SOLO su gente');
  es(JSON.stringify(listaA).indexOf('Ana Gómez') === -1,
     'y ni de casualidad la del cliente de al lado');
  es(listaA.resumen.personas === 3,
     'y el resumen cuenta la gente de ESA fiesta (dio ' + listaA.resumen.personas + ')');

  es(a.get({ evento: 'otra15', clave: kA }).error === 'clave',
     'la clave de un cliente NO abre el listado de otro');
  es(a.get({ evento: 'almi15', clave: M }).invitados.length === 1 &&
     a.get({ evento: 'otra15', clave: M }).invitados.length === 1,
     'la maestra abre los dos, cada uno con lo suyo');

  /* La puerta del invitado también es por fiesta. Sin esto, "¿ya
     confirmé?" contestaría que sí en una fiesta a la que nunca fue —y
     la invitación le escondería el formulario. */
  es(a.get({ evento: 'almi15', confirmado: '  juan pérez  ' }).ok === true,
     'el invitado pregunta si llegó lo suyo, con espacios y en minúscula');
  es(a.get({ evento: 'otra15', confirmado: 'Juan Pérez' }).ok === false,
     'y en la fiesta de al lado NO figura');
}

console.log('\n─── el freno de intentos es POR FIESTA ───');
{
  const M = 'maestra-de-prueba';
  const a = cargarCentral({ maestra: M, eventos: ['almi15', 'otra15'] });
  a.preparar();
  a.post({ evento: 'almi15', Nombre: 'Juan', Confirma: 'Sí' });
  a.post({ evento: 'otra15', Nombre: 'Ana',  Confirma: 'Sí' });
  const kB = a.claveDe('otra15', M);

  /* Con una planilla por cliente, un freno global era el freno de ese
     cliente. Con UNA planilla para todos, un freno global es un
     desconocido dejando a TODOS los clientes afuera de su listado con
     doce intentos fallados. */
  for (let i = 0; i < 14; i++) a.get({ evento: 'almi15', clave: 'no-es' });
  es(a.get({ evento: 'almi15', clave: 'no-es' }).error === 'frenado',
     'doce fallos seguidos cierran la puerta de ESA fiesta');
  const otra = a.get({ evento: 'otra15', clave: kB });
  es(Array.isArray(otra.invitados),
     'y el cliente de al lado entra igual: el freno no es de toda la planilla');
}

console.log('\n─── si el sitio no contesta, la fiesta sigue ───');
{
  /* La lista de fiestas vive en el sitio nuestro. Si se cae justo la
     noche de una fiesta, lo que NO puede pasar es que el invitado no
     pueda confirmar. */
  const a = cargarCentral({ maestra: 'm', eventos: ['almi15'] });
  a.post({ evento: 'almi15', Nombre: 'Juan', Confirma: 'Sí' });
  es(a.hojas.length === 1, 'con el sitio en pie, la pestaña se crea');

  const caido = cargarCentral({ maestra: 'm', sitioCaido: true,
                                props: { 'EVENTOS_CACHE': JSON.stringify(['almi15']) } });
  es(caido.post({ evento: 'almi15', Nombre: 'Ana', Confirma: 'Sí' }).ok === true,
     'caído el sitio, vale la última copia de la lista que teníamos');

  const nunca = cargarCentral({ maestra: 'm', sitioCaido: true });
  es(nunca.post({ evento: 'almi15', Nombre: 'Ana', Confirma: 'Sí' }).error === 'evento_desconocido',
     'y si NUNCA se pudo leer, no se crea nada: mejor eso que cualquier cosa');

  /* Una pestaña que ya existe anda pase lo que pase con la lista: la
     lista sólo decide si se CREA. */
  const viva = cargarCentral({ maestra: 'm', sitioCaido: true });
  viva.libro.insertSheet('almi15').appendRow(['Cuándo', 'Nombre', 'Confirma']);
  es(viva.post({ evento: 'almi15', Nombre: 'Ana', Confirma: 'Sí' }).ok === true,
     'y la fiesta que ya tenía su pestaña recibe igual, con el sitio caído');
}

console.log('\n─── la clave que elige el cliente ───');
{
  /* Dato de prueba INVENTADO: el de un cliente de verdad versionado
     en el repo es la llave de su lista de invitados. Ya pasó. */
  const M = 'maestra-de-prueba', SUYA = 'clave.de.prueba@ejemplo.com';
  const a = cargarCentral({ maestra: M, eventos: ['almi15', 'otra15'],
                            elegidas: { almi15: SUYA } });
  a.preparar();
  a.post({ evento: 'almi15', Nombre: 'Juan', Confirma: 'Sí' });
  a.post({ evento: 'otra15', Nombre: 'Ana',  Confirma: 'Sí' });

  es(Array.isArray(a.get({ evento: 'almi15', clave: SUYA }).invitados),
     'la clave que eligió el cliente abre su listado');
  es(a.claveDe('almi15', M) === SUYA,
     'y es la que la planilla da por buena, no una inventada al lado');
  /* Si la elegida se mirara sólo en preparar(), escribirla sin volver
     a correrla dejaría puesta la inventada: le pasaríamos al cliente
     una clave que no abre, sin un solo error a la vista. */
  const b = cargarCentral({ maestra: M, eventos: ['almi15'],
                            elegidas: { almi15: SUYA } });
  b.post({ evento: 'almi15', Nombre: 'Juan', Confirma: 'Sí' });
  es(Array.isArray(b.get({ evento: 'almi15', clave: SUYA }).invitados),
     'y abre aunque no se haya vuelto a correr preparar()');

  es(a.get({ evento: 'otra15', clave: SUYA }).error === 'clave',
     'y NO abre el listado del cliente de al lado');

  /* El caso que de verdad pasa: la clave es un correo y el que la
     escribe en un iPhone se come una mayúscula o un espacio. */
  es(Array.isArray(a.get({ evento: 'almi15', clave: '  Clave.De.Prueba@Ejemplo.com ' }).invitados),
     'con mayúsculas y espacios de más entra igual: la escribe un dedo');
  es(a.get({ evento: 'almi15', clave: SUYA + 'x' }).error === 'clave',
     'pero una letra de más no');
}

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
process.exit(fallas.length ? 1 : 0);
