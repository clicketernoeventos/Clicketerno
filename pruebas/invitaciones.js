/* Revisa las invitaciones alojadas en el repo antes de que rompan algo en
   producción: que no tapen una ruta de la app, que tengan index.html, que
   no apunten a Netlify, y que no pesen una barbaridad. */
const fs=require('fs'), path=require('path');
const RAIZ=path.join(__dirname,'..');
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* Lo que ya usa la app. Una carpeta con uno de estos nombres la tapa. */
const RESERVADOS=['muro','rollo','app','sql','pruebas','invitaciones',
                  'logo','marca','og','index','_redirects','_headers'];
const TOPE_FOTO=300*1024, TOPE_TOTAL=12*1024*1024;
/* La música es aparte: con preload="none" recién se baja si el invitado
   toca el botón, así que no frena la primera carga. Igual hay un tope:
   son megas de datos del celular de otra persona. */
const TOPE_AUDIO=8*1024*1024;
/* Una invitación puede traer las fotos pegadas adentro del HTML en base64.
   El tope por foto no las ve —el archivo es .html— así que el HTML tiene
   el suyo: todo eso se baja de una antes de que se vea nada. */
const TOPE_HTML=2*1024*1024;

const esInvitacion=d=>{
  const p=path.join(RAIZ,d);
  return fs.statSync(p).isDirectory() && !d.startsWith('.')
    /* lib/ son las librerías del sitio (QR, zip, excel), no una invitación */
    && !['sql','pruebas','invitaciones','node_modules','lib'].includes(d);
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
console.log('\n─── las direcciones de la app siguen libres ───');
for(const r of ['muro.html','rollo.html','app.html','index.html']){
  if(!fs.existsSync(path.join(RAIZ,r))) mal(`falta ${r}`);
}
if(!fallas.length) bien('nada las tapa');

console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
process.exit(fallas.length?1:0);
