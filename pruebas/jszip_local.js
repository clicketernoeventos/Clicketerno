/* JSZip viene de un CDN y las pruebas del zip lo necesitan de verdad (no
   sirve un doble: lo que se mira es que el archivo salga bien armado).
   Este módulo lo consigue de donde se pueda y lo deja en pruebas/.cache
   para la próxima corrida, que puede ser sin internet.

   Antes cada prueba leía una ruta suelta de /tmp, que era la carpeta de
   borradores de quien la escribió: en cualquier otra máquina la prueba
   daba "NO bajó", como si el zip estuviera roto. No lo estaba. */
const fs=require('fs'), path=require('path');
const CACHE=path.join(__dirname,'.cache','jszip.min.js');
/* Desde que las librerías viven en el repo, lo primero es mirar ahí: es la
   MISMA copia que sirve el sitio, así que la prueba mide lo que se publica
   y encima anda sin internet. El CDN queda solo por si alguien corre esto
   en una copia vieja. */
const LOCAL=path.join(__dirname,'..','lib','jszip.min.js');
const CDN='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

async function conseguir(){
  if(fs.existsSync(LOCAL)) return fs.readFileSync(LOCAL,'utf8');
  if(fs.existsSync(CACHE)) return fs.readFileSync(CACHE,'utf8');
  try{
    const r=await fetch(CDN);
    if(!r.ok) throw new Error('HTTP '+r.status);
    const txt=await r.text();
    fs.mkdirSync(path.dirname(CACHE),{recursive:true});
    fs.writeFileSync(CACHE,txt);
    return txt;
  }catch(e){ return null; }
}

/* Devuelve true si el navegador va a tener JSZip. Si devuelve false, la
   prueba del zip hay que saltearla y DECIRLO: una dependencia que falta no
   es un error del producto, y anotarla como tal manda a la otra sesión a
   buscar un bug que no existe. */
async function servir(page){
  const js=await conseguir();
  await page.route('**/jszip.min.js', r=>{
    if(!js) return r.abort('failed');
    r.fulfill({status:200, contentType:'application/javascript', body:js});
  });
  return !!js;
}

module.exports={servir, CACHE};
