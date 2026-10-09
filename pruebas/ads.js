/* ═══════════════════════════════════════════════════════════════
   LA ETIQUETA DE GOOGLE Y LA POLÍTICA TIENEN QUE DECIR LO MISMO

   El sitio tiene la medición de Google Ads preparada pero APAGADA:
   mientras `ADS_ID` esté vacío no se baja ni un script de terceros.
   El día que se lance la campaña se pega el ID y ahí la página pasa a
   cargar gtag y a dejar cookies de Google.

   El problema es que `privacidad.html` dice HOY, con todas las letras,
   "no hay publicidad, ni analítica, ni píxeles de seguimiento" y "este
   sitio no usa cookies". Las dos son verdad mientras esté apagado y las
   dos se vuelven MENTIRA en el mismo momento en que se pega el ID — y
   una política de privacidad falsa, frente a la Ley 25.326, es peor que
   no tener ninguna: es una declaración por escrito de algo que no se
   cumple, con la AAIP mirando.

   Nadie se va a acordar de editar la política el día que lance la
   campaña. Por eso lo cuida una prueba y no un comentario.

   También se mide lo que NO puede pasar nunca: que la etiqueta aparezca
   en `muro.html` o en `rollo.html`. Esas son las pantallas donde un menor
   saca una foto en una fiesta, y no cargar terceros ahí es parte del
   producto — es exactamente lo que le criticamos al competidor.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const lee = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

const index = lee('index.html');
/* Sin tags y con los espacios colapsados: la frase que buscamos viene
   partida en varios renglones del HTML y una búsqueda literal no la
   encuentra — pasó, y la prueba informó que faltaba algo que estaba. */
const privacidad = lee('privacidad.html').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const cabeceras = lee('_headers');

/* _headers tiene las directivas DE VERDAD y además comentarios que las
   nombran. Un match sin /g devuelve el primero, que es el comentario:
   la prueba decía que faltaba un dominio que estaba puesto. Nos
   quedamos con el más largo, que es siempre la directiva real. */
const directiva = (nombre) => {
  const todas = cabeceras.match(new RegExp(nombre + '[^;\n]*', 'g')) || [];
  return todas.sort((a, b) => b.length - a.length)[0] || '';
};

/* Lo que la política promete hoy, palabra por palabra. Si alguna de estas
   frases sigue estando con la medición encendida, la página miente. */
const PROMESAS = [
  { texto: 'no carga ningún script de terceros', donde: 'que no se cargan scripts de terceros' },
  { texto: 'no usa cookies', donde: 'que no se usan cookies' },
  { texto: 'ni píxeles de seguimiento', donde: 'que no hay píxeles de seguimiento' },
];

const valorDe = (nombre) => {
  const m = index.match(new RegExp(`const\\s+${nombre}\\s*=\\s*'([^']*)'`));
  return m ? m[1] : null;
};

titulo('la medición está donde tiene que estar y en ningún otro lado');
{
  const id = valorDe('ADS_ID');
  const conv = valorDe('ADS_CONV');
  if (id === null) mal('no encuentro ADS_ID en index.html: ¿se renombró?');
  else bien(`ADS_ID ${id ? 'puesto (' + id + ')' : 'vacío: el sitio no carga nada de Google'}`);
  if (conv === null) mal('no encuentro ADS_CONV en index.html');

  /* Encendida o apagada, la etiqueta NUNCA va en las pantallas del
     invitado. Esto no depende del ID: no se pega ahí ni para probar. */
  for (const f of ['muro.html', 'rollo.html']) {
    const src = lee(f);
    if (/googletagmanager|gtag\(|google-analytics/i.test(src))
      mal(`${f} carga la etiqueta de Google: ahí sacan fotos los invitados, muchos menores`);
    else bien(`${f} sigue sin un solo script de terceros`);
  }

  /* El script tiene que ser async: un <script src> sincrónico arriba de
     todo frena el dibujado entero, que es la regla de pruebas/arranque. */
  if (/googletagmanager/.test(index) && !/g\.async\s*=\s*true/.test(index))
    mal('la etiqueta no se carga async: frena el dibujado de la página');
  else bien('la etiqueta se carga async, sin frenar el dibujado');

  if (id && !conv)
    mal('hay ADS_ID pero no ADS_CONV: Google cobra los clics y no mide una sola consulta');

  titulo('la CSP deja pasar lo que la etiqueta necesita');
  /* Una CSP apaga cosas sin decir nada: si falta un dominio, la etiqueta
     no carga, no hay ningún error a la vista y la campaña mide cero. */
  const necesita = [
    ['script-src', 'https://www.googletagmanager.com'],
    ['connect-src', 'https://www.googletagmanager.com'],
    ['img-src', 'https://googleads.g.doubleclick.net'],
  ];
  for (const [dir, dominio] of necesita) {
    if (!directiva(dir).includes(dominio)) mal(`la CSP no deja ${dominio} en ${dir}: la etiqueta no va a cargar`);
    else bien(`${dir} deja pasar ${dominio.replace('https://', '')}`);
  }
}

titulo('la política de privacidad dice la verdad');
{
  const id = valorDe('ADS_ID');
  const encendida = !!id;
  for (const p of PROMESAS) {
    const loDice = privacidad.toLowerCase().includes(p.texto.toLowerCase());
    if (encendida && loDice)
      mal(`la medición está ENCENDIDA y la política sigue prometiendo ${p.donde}: hay que actualizarla`);
    if (!encendida && !loDice)
      mal(`la política dejó de prometer ${p.donde} pero el sitio sigue sin cargar nada: se quedó corta`);
  }
  if (encendida && !/Google Ads/i.test(privacidad))
    mal('con la medición encendida, la política no nombra a Google Ads por ningún lado');
  if (!fallas.length) bien(encendida
    ? 'la política declara la publicidad y las cookies de Google'
    : 'la política promete lo mismo que el sitio hace: nada de terceros');
}

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
process.exit(fallas.length ? 1 : 0);
