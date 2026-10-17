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
function hojaFalsa(filas = []) {
  const d = filas.map(f => f.slice());
  const h = {
    datos: d,
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
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = v; }
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

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
process.exit(fallas.length ? 1 : 0);
