/* Revisa las invitaciones alojadas en el repo antes de que rompan algo en
   producción: que no tapen una ruta de la app, que tengan index.html, que
   no apunten a Netlify, y que no pesen una barbaridad. */
const fs=require('fs'), path=require('path');
const RAIZ=path.join(__dirname,'..');
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* Lo que ya usa la app. Una carpeta con uno de estos nombres la tapa. */
const RESERVADOS=['muro','rollo','app','sql','pruebas','invitaciones',
                  'logo','marca','og','index','_redirects','_headers',
                  /* las fotos de la fiesta de ejemplo: una carpeta
                     "demo" las tapa y las dos demostraciones quedan con
                     las fotos en blanco, sin tirar ningún error */
                  'demo','muestra','empezar','404',
                  /* los legales: una carpeta llamada "privacidad" taparía la
                     política de privacidad, que es una obligación legal */
                  'privacidad','terminos','.well-known',
                  /* los iconos de "poner en la pantalla del teléfono": una
                     carpeta acá taparía los que declara el manifiesto, y el
                     sistema pondría un cuadrado gris con la inicial */
                  'iconos'];
const TOPE_FOTO=300*1024, TOPE_TOTAL=12*1024*1024;
/* La música es aparte: con preload="none" recién se baja si el invitado
   toca el botón, así que no frena la primera carga. Igual hay un tope:
   son megas de datos del celular de otra persona. */
const TOPE_AUDIO=8*1024*1024;
/* Una invitación puede traer las fotos pegadas adentro del HTML en base64.
   El tope por foto no las ve —el archivo es .html— así que el HTML tiene
   el suyo: todo eso se baja de una antes de que se vea nada. */
const TOPE_HTML=2*1024*1024;

/* Lo que NO se publica no puede ser una invitación: si Cloudflare no lo
   sube, no hay ninguna dirección que abrir. Así que la lista sale de
   .assetsignore y no de acá — una enumeración escrita a mano se queda
   corta sola, y de hecho se quedó: el día que apareció `video/` esta
   prueba la reclamó como invitación sin index.html. */
const NO_PUBLICADAS = fs.readFileSync(path.join(RAIZ, '.assetsignore'), 'utf8')
  .split('\n').map(l => l.trim())
  .filter(l => l && !l.startsWith('#') && l.endsWith('/'))
  .map(l => l.slice(0, -1));
/* Estas SÍ se publican y tampoco son invitaciones: lib/ son las
   librerías del sitio (QR, zip, excel), iconos/ los del manifiesto y
   demo/ las fotos de la fiesta de ejemplo. Van también en RESERVADOS,
   que es lo contrario y hace falta igual: acá para que la prueba no las
   reclame como invitación, allá para que nadie llame así a una. */
const PUBLICADAS_NO_INVITACION = ['lib', 'iconos', 'node_modules', 'demo', 'muestra'];
const esInvitacion=d=>{
  const p=path.join(RAIZ,d);
  return fs.statSync(p).isDirectory() && !d.startsWith('.')
    && !NO_PUBLICADAS.includes(d)
    && !PUBLICADAS_NO_INVITACION.includes(d);
};
const pesar=d=>fs.readdirSync(d,{withFileTypes:true}).reduce((t,e)=>{
  const p=path.join(d,e.name);
  return t + (e.isDirectory()?pesar(p):fs.statSync(p).size);
},0);
const archivos=(d,lista=[])=>{
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d,e.name);
    if(e.isDirectory()) archivos(p,lista); else lista.push(p);
  }
  return lista;
};

const carpetas=fs.readdirSync(RAIZ).filter(esInvitacion);
console.log(`\n─── ${carpetas.length} ${carpetas.length===1?'invitación':'invitaciones'} en el repo ───`);
if(!carpetas.length) console.log('  (todavía ninguna)');

for(const c of carpetas){
  const dir=path.join(RAIZ,c);
  if(RESERVADOS.includes(c.toLowerCase())){
    mal(`la carpeta "${c}" tapa una dirección de la app`);
    continue;
  }
  if(!/^[a-z0-9-]+$/.test(c))
    mal(`"${c}": el nombre tiene que ser minúsculas, números y guiones (es la dirección web)`);
  if(!fs.existsSync(path.join(dir,'index.html'))){
    mal(`"${c}" no tiene index.html: no se va a poder abrir`);
    continue;
  }
  const todos=archivos(dir);
  const html=todos.filter(f=>f.endsWith('.html'));
  let problemas=0;
  for(const f of html){
    const t=fs.readFileSync(f,'utf8');
    if(/netlify\.app/i.test(t)){
      mal(`"${c}" todavía apunta a netlify.app dentro de ${path.basename(f)}`); problemas++;
    }
    if(/src\s*=\s*["']\/(?!\/)/.test(t)||/href\s*=\s*["']\/(?!\/)/.test(t)){
      mal(`"${c}" usa caminos que arrancan con "/" en ${path.basename(f)}: `+
          `van a buscar el archivo en la raíz del sitio, no en la carpeta`); problemas++;
    }
  }
  /* Archivos que el HTML nombra y no están: la música es el caso típico,
     porque viaja aparte y es fácil olvidarla. */
  for(const f of html){
    const t=fs.readFileSync(f,'utf8');
    const nombrados=new Set();
    for(const m of t.matchAll(/(?:src|href)\s*=\s*["']([^"':#?][^"':]*\.(?:mp3|m4a|ogg|wav|jpg|jpeg|png|webp|gif|mp4|webm|css|js))["']/gi))
      nombrados.add(m[1]);
    for(const m of t.matchAll(/["']([\w./-]+\.(?:mp3|m4a|ogg|wav|mp4|webm))["']/gi))
      nombrados.add(m[1]);
    for(const n of nombrados){
      if(n.startsWith('http')||n.startsWith('data:')) continue;
      if(!fs.existsSync(path.resolve(path.dirname(f),n))){
        mal(`"${c}" nombra "${n}" y ese archivo no está en la carpeta`); problemas++;
      }
    }
  }
  for(const f of todos){
    const tam=fs.statSync(f).size;
    if(/\.html$/i.test(f) && tam>TOPE_HTML){
      mal(`"${c}": ${path.basename(f)} pesa ${Math.round(tam/1048576*10)/10} MB `+
          `(tope 2 MB; si trae fotos pegadas adentro, sacalas a archivos)`); problemas++;
    }
    if(/\.(jpg|jpeg|png|webp|gif)$/i.test(f) && tam>TOPE_FOTO){
      mal(`"${c}": ${path.basename(f)} pesa ${Math.round(tam/1024)} KB (tope 300 KB)`); problemas++;
    }
    if(/\.(mp3|m4a|ogg|wav)$/i.test(f) && tam>TOPE_AUDIO){
      mal(`"${c}": ${path.basename(f)} pesa ${Math.round(tam/1048576)} MB (tope 3 MB)`); problemas++;
    }
  }
  const total=pesar(dir);
  if(total>TOPE_TOTAL){
    mal(`"${c}" pesa ${Math.round(total/1048576)} MB en total (tope 12 MB)`); problemas++;
  }
  if(!problemas) bien(`"${c}" · ${todos.length} archivos · ${Math.round(total/1024)} KB · clicketerno.com.ar/${c}`);
}

/* Y que la app siga estando donde tiene que estar */
/* ─── los listados son TODOS la misma plantilla ───────────────────
   El listado de cada evento es una copia de
   `invitaciones/plantilla-listado/index.html` con su CONFIG llenado y
   nada más. Dos copias que se tocan por separado es una que se queda
   atrás, y la que se queda atrás es la del cliente que ya pagó: el
   panel de Pía tenía las columnas de SU formulario escritas a mano,
   así que cualquier otro evento abría la tabla con las filas vacías y
   sin un solo error. */
/* La planilla CENTRAL: una sola para todas las invitaciones nuevas.
   La dirección vive en lib/planilla.js y la lista de fiestas que
   pueden crear su pestaña en lib/planillas.json, que es lo que lee el
   Apps Script. Escritas en dos lados se separan solas; acá se cruzan. */
const CENTRAL = ((() => {
  try {
    const t = fs.readFileSync(path.join(RAIZ, 'lib', 'planilla.js'), 'utf8');
    return (t.match(/exec:\s*"([^"]*)"/) || [])[1] || '';
  } catch (e) { return ''; }
})());
const EVENTOS = ((() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, 'lib', 'planillas.json'), 'utf8')).eventos || [];
  } catch (e) { return []; }
})());
/* Una fiesta en la lista que no tiene carpeta es un renglón que quedó
   de algo que se borró: deja abierta una pestaña que nadie va a mirar. */
console.log('\n─── la planilla central ───');
if (!CENTRAL) console.log('  (todavía sin implementar: lib/planilla.js vacío)');
else bien('la dirección está puesta en lib/planilla.js');
for (const ev of EVENTOS) {
  if (!fs.existsSync(path.join(RAIZ, ev, 'index.html')))
    mal(`lib/planillas.json nombra "${ev}" y esa invitación no existe en el repo`);
}
if (EVENTOS.length) bien(`${EVENTOS.length} fiesta(s) habilitada(s): ${EVENTOS.join(', ')}`);

/* El piso escrito adentro del Apps Script: las fiestas que entran
   aunque el sitio no se pueda leer. Puede quedarse corto —una fiesta
   nueva va en lib/planillas.json y nada más, que es el punto de la
   planilla central— pero NO puede ser más ancho que la lista de
   verdad: ahí habilitaría una pestaña que nosotros ya no habilitamos. */
{
  const gs = fs.readFileSync(
    path.join(RAIZ, 'apps-script', 'planilla-central.gs.txt'), 'utf8');
  const m = gs.match(/var EVENTOS_EN_EL_CODIGO = \[([^\]]*)\];/);
  if (!m) mal('el Apps Script central no tiene su lista EVENTOS_EN_EL_CODIGO');
  else {
    const piso = (m[1].match(/'[^']*'|"[^"]*"/g) || []).map(t => t.slice(1, -1));
    const sobran = piso.filter(e => !EVENTOS.includes(e));
    if (sobran.length)
      mal(`el Apps Script habilita "${sobran.join(', ')}" y lib/planillas.json no`);
    else bien(`el piso del Apps Script no habilita nada de más (${piso.join(', ') || 'vacío'})`);
  }
}

console.log('\n─── los listados salen de la plantilla ───');
{
  const rutaPlantilla = path.join(RAIZ, 'invitaciones', 'plantilla-listado', 'index.html');
  if (!fs.existsSync(rutaPlantilla)) mal('falta invitaciones/plantilla-listado/index.html');
  else {
    /* Se comparan sin el CONFIG, que es lo único que cambia por evento. */
    const sinConfig = t => t.replace(/const CONFIG = \{[\s\S]*?\n\};/, 'CONFIG')
                            /* [\s\S]*? y no [^>]*: el comentario tiene un
                               "<evento>" adentro, así que cortado en el
                               primer ">" no lo saca entero. */
                            .replace(/<!-- PLANTILLA\.[\s\S]*?-->\n?/, '');
    const patron = sinConfig(fs.readFileSync(rutaPlantilla, 'utf8'));
    let hubo = 0;
    for (const c of carpetas) {
      const f = path.join(RAIZ, c, 'listado', 'index.html');
      if (!fs.existsSync(f)) continue;
      hubo++;
      const txt = fs.readFileSync(f, 'utf8');
      if (sinConfig(txt) !== patron)
        mal(`"${c}/listado" se separó de la plantilla: hay dos versiones de la misma pantalla`);
      else bien(`"${c}/listado" es la plantilla`);
      /* Una plantilla copiada y no llenada se ve perfecta y no trae
         ni un dato. */
      const url = (txt.match(/appsScriptUrl:\s*"([^"]*)"/) || [])[1];
      const ev  = (txt.match(/\n\s*evento:\s*"([^"]*)"/) || [])[1];
      /* Hay dos formas de tener planilla y las dos valen: la suya
         (pia, mia15, que tienen su propio Apps Script) o la CENTRAL,
         que es una sola para todas y entonces lo que hace falta es
         decir qué pestaña. Lo que no vale es ninguna de las dos: la
         pantalla se dibuja perfecta y no trae un solo dato. */
      if (url) {
        if (!/^https:\/\/script\.google\.com\//.test(url))
          mal(`"${c}/listado" apunta a algo que no es un Apps Script: ${url}`);
      } else if (ev) {
        if (!CENTRAL)
          mal(`"${c}/listado" usa la planilla central y lib/planilla.js está vacío: no va a traer nada`);
        else if (!EVENTOS.includes(ev))
          mal(`"${c}/listado" pide la pestaña "${ev}" y no está en lib/planillas.json: el Apps Script no la crea`);
        else bien(`"${c}/listado" lee la planilla central, pestaña "${ev}"`);
      } else {
        mal(`"${c}/listado" no dice de dónde saca los datos: ni appsScriptUrl ni evento`);
      }
      const nom = (txt.match(/nombreEvento:\s*"([^"]*)"/) || [])[1];
      if (!nom) mal(`"${c}/listado" no tiene nombre de evento: el título sale vacío`);
    }
    if (!hubo) console.log('  (todavía ningún listado)');
  }
}

console.log('\n─── las direcciones de la app siguen libres ───');
for(const r of ['muro.html','rollo.html','app.html','index.html']){
  if(!fs.existsSync(path.join(RAIZ,r))) mal(`falta ${r}`);
}
if(!fallas.length) bien('nada las tapa');

console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
process.exit(fallas.length?1:0);
