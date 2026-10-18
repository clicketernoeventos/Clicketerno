/* El medidor de contraste, en un solo lugar.
 *
 * Lo usan `pruebas/contraste.js` (las pantallas del producto) y
 * `pruebas/invitacion_mirar.js` (cada invitación). Copiado en los dos
 * sería una copia que se queda atrás, y acá adentro están las dos
 * correcciones que costaron caro: el degradé que termina en
 * transparente —se saltea la CAPA y se sigue subiendo, porque en su
 * punto más flojo el texto cae sobre el fondo del padre— y que una
 * foto o un degradé opaco de punta a punta NO se juzgan: mejor callar
 * que inventar una falla.
 *
 * Devuelve una lista de {r, txt, que}: la razón de contraste, el texto
 * y la etiqueta. `r` es null para lo que no se puede juzgar.
 */
const MEDIDOR=`(${function(){
  const num=s=>{ const m=String(s).match(/[\d.]+/g)||[]; return m.map(Number); };
  const mezclar=(fr,at)=>{ // fr con alfa sobre at, opaco
    const a=fr[3]===undefined?1:fr[3];
    return [0,1,2].map(i=>fr[i]*a + at[i]*(1-a)).concat(1);
  };
  const luz=c=>{ const f=c.slice(0,3).map(v=>{ const s=v/255;
      return s<=0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055,2.4); });
    return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2]; };
  const razon=(a,b)=>{ const l1=luz(a), l2=luz(b);
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  /* el fondo que de verdad queda atrás: el primer ancestro que pinte */
  const fondoDe=n=>{
    /* Se sube hasta el primer fondo OPACO: ese es el piso que pinta.
       Si antes de llegar aparece un degradé o una foto, no sabemos de
       qué color quedó y no lo juzgamos (mejor callar que inventar una
       falla). Antes se cortaba con CUALQUIER degradé del árbol, aunque
       estuviera por encima de un fondo opaco, y así se salteaba media
       página: por eso la primera corrida decía "41 textos" en una
       página que tiene cientos. */
    let pila=[];
    for(let e=n; e; e=e.parentElement){
      const cs=getComputedStyle(e);
      const img=cs.backgroundImage;
      if(img && img!=='none'){
        /* Un degradé que TERMINA en transparente sí se puede juzgar, y hay
           que juzgarlo: en su punto más flojo el texto cae sobre el fondo
           del padre, y es ahí donde se tiene que leer. Se saltea la capa
           —el peor caso— y se sigue subiendo. Esto no es un detalle: el
           panel de la prueba de cada servicio tiene su propio degradé
           terminado en `transparent`, así que TODO su texto se salteaba, y
           ahí la tinta de la parte negra cayó sobre el crema de `.clara` a
           1,49:1 con esta suite en verde.
           Lo que sigue sin juzgarse es una FOTO o un degradé opaco de
           punta a punta: de esos no sabemos de qué color quedó el piso, y
           mejor callar que inventar una falla. */
        const traslucido=/\btransparent\b|rgba\([^)]*,\s*0(?:\.0+)?\s*\)/.test(img);
        if(!traslucido) return null;
        continue;
      }
      let c=num(cs.backgroundColor);
      if(c.length>=3){
        if(c.length===3) c=c.concat(1);
        if(c[3]>0) pila.push(c);
        if(c[3]>=1){ let sobre=pila.pop();
          for(let i=pila.length-1;i>=0;i--) sobre=mezclar(pila[i],sobre);
          return sobre; }
      }
    }
    let sobre=[255,255,255,1];
    for(let i=pila.length-1;i>=0;i--) sobre=mezclar(pila[i],sobre);
    return sobre;
  };
  const visible=e=>{
    const cs=getComputedStyle(e);
    if(cs.display==='none'||cs.visibility==='hidden') return false;
    const r=e.getBoundingClientRect();
    return r.width>2 && r.height>2;
  };
  /* la opacidad que le cae encima por herencia */
  const opacidadDe=n=>{ let o=1; for(let e=n;e;e=e.parentElement){
      const v=parseFloat(getComputedStyle(e).opacity); if(!isNaN(v)) o*=v; } return o; };
  const salida=[];
  for(const e of document.querySelectorAll('body *')){
    const propio=[...e.childNodes].some(n=>n.nodeType===3 && n.textContent.trim().length>1);
    if(!propio) continue;
    if(!visible(e)) continue;
    const cs=getComputedStyle(e);
    /* La DECORACIÓN no se juzga, y "decoración" tiene una definición
       estricta: escondida del lector de pantalla (aria-hidden) Y que
       no ataja el dedo (pointer-events:none). Las dos juntas, no una.
       Con esa regla queda afuera lo que de verdad es un adorno —el
       "15" en contorno de la portada de mia15, que es una marca de
       agua y se mide como 1,00:1 porque su color ES transparente— y
       no puede quedar afuera ningún texto que alguien tenga que
       leer: un texto que importa no se esconde del lector de
       pantalla.
       Es el mismo criterio que ya vale para lo que cae sobre una
       foto: mejor callar que inventar una falla. */
    if(e.getAttribute('aria-hidden')==='true' && cs.pointerEvents==='none') continue;
    const fondo=fondoDe(e); if(!fondo) continue;
    let tinta=num(cs.color); if(tinta.length===3) tinta=tinta.concat(1);
    const op=opacidadDe(e);
    if(op<0.08) continue;               // está apagado a propósito
    tinta=[tinta[0],tinta[1],tinta[2], (tinta[3]===undefined?1:tinta[3])*op];
    const r=razon(mezclar(tinta,fondo), fondo);
    salida.push({ r:Math.round(r*100)/100,
      que:(e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):'')).slice(0,70),
      txt:e.textContent.trim().replace(/\s+/g,' ').slice(0,42) });
  }
  return salida.sort((a,b)=>a.r-b.r);
}})()`;


/* Lo que aparece al bajar nace en opacidad 0, y el medidor saltea lo
   que no se ve: sin esto se miden los seis textos del primer
   pantallazo de una página que tiene cientos, y el error que se vino
   a buscar queda justo afuera. */
const DESTAPAR=`.ap,.ap *{opacity:1!important;transform:none!important;filter:none!important}
  *{animation-duration:0s!important;transition-duration:0s!important}`;

module.exports = { MEDIDOR, DESTAPAR };
