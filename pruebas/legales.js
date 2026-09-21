/* ══════════════════════════════════════════════════════════════════
   Lo legal, medido.

   Un texto legal se escribe una vez y después se pudre solo: alguien
   toca el pie de página y el enlace desaparece, alguien rehace la
   pantalla del invitado y el aviso del artículo 6 se va con ella, el
   security.txt vence y queda peor que si no estuviera. Nada de eso da
   error en pantalla. Esta suite lo mira.

   Qué cuida:

     1. Que /privacidad y /terminos existan y se sirvan con la dirección
        limpia, igual que /muro.
     2. Que estén enlazadas desde la página de inicio, y el BOTÓN DE
        ARREPENTIMIENTO también: la Resolución 424/2020 de la Secretaría
        de Comercio Interior lo exige accesible desde la página de inicio
        y en un lugar destacado. Enterrado no cumple.
     3. Que el aviso del artículo 6 de la Ley 25.326 esté EN LA PANTALLA
        donde se pide el dato —el muro y el rollo—, y que diga las cinco
        cosas que la ley manda decir.
     4. Que la política de privacidad no se vacíe con el tiempo: tiene
        que seguir nombrando al responsable, la finalidad, el plazo, los
        derechos, la AAIP y la transferencia internacional.
     5. Que el security.txt esté y NO esté vencido. Uno vencido incumple
        la RFC 9116 y le dice a quien encuentra un agujero que nadie está
        atendiendo.
     6. Que lo que no va a la web siga sin ir: si mañana alguien agrega un
        .md o una carpeta con datos y se olvida de .assetsignore, se
        publica. Ya pasó con sql/claves.sql, que llevaba la clave maestra
        de producción en texto plano.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const S = 'http://127.0.0.1:8099';
const COD='QUI-7FCE64', CLAVE='ABC123';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);
const nota=m=>console.log('  · salteada · '+m);

/* Las cinco cosas que el artículo 6 de la Ley 25.326 manda decir antes de
   recolectar un dato. Se buscan por su idea, no por su redacción exacta:
   el texto se puede mejorar, lo que no se puede es que falte una. */
const ART6=[
  ['para qué se usa',      /se proyecta|queda en el álbum|álbum de/i],
  ['quién es responsable', /Click Eterno/i],
  ['que es voluntario',    /voluntari/i],
  ['cuánto dura',          /90 días/i],
  ['cómo pedir el borrado',/borre|borrar|clicketernoeventos@gmail\.com/i],
];

(async()=>{
  console.log('\n─── las páginas legales ───');
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  await ctx.addInitScript(c=>{ try{
    localStorage.setItem('ce:claves',JSON.stringify(c));
  }catch(e){} },{[COD]:CLAVE});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));

  /* 1 · existen y se sirven con la dirección limpia */
  for(const [q,ruta] of [['la política de privacidad','/privacidad'],
                         ['los términos y condiciones','/terminos']]){
    const r=await p.request.get(S+ruta);
    if(!r.ok()) mal(`${q} da ${r.status()} en ${ruta}`);
    else bien(`${q} se sirve en ${ruta}`);
  }

  /* 2 · enlazadas desde el inicio, y el botón de arrepentimiento visible */
  await p.goto(S+'/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  const pie=await p.evaluate(()=>[...document.querySelectorAll('footer a[href]')]
    .map(a=>({h:a.getAttribute('href'),t:a.textContent.trim()})));
  for(const [q,re] of [['la política de privacidad',/privacidad/],
                       ['los términos y condiciones',/terminos/]]){
    if(!pie.some(a=>re.test(a.h))) mal(`${q} no está enlazada desde el inicio`);
    else bien(`${q} está enlazada desde el inicio`);
  }
  /* El botón de arrepentimiento, medido como lo pide la resolución: desde
     la página de inicio, visible y con área para el dedo. */
  const arrep=await p.evaluate(()=>{
    const a=[...document.querySelectorAll('a')].find(x=>/arrepentimiento/i.test(x.textContent));
    if(!a) return null;
    const b=a.getBoundingClientRect(), cs=getComputedStyle(a);
    return {h:a.getAttribute('href'), w:Math.round(b.width), alto:Math.round(b.height),
            visible: cs.display!=='none' && cs.visibility!=='hidden' && +cs.opacity>0.6};
  });
  if(!arrep) mal('no hay botón de arrepentimiento en la página de inicio (Res. 424/2020)');
  else{
    bien('el botón de arrepentimiento está en la página de inicio');
    if(!arrep.visible) mal('el botón de arrepentimiento está pero no se ve');
    else bien('y se ve');
    if(arrep.alto<44) mal(`el botón de arrepentimiento mide ${arrep.w}x${arrep.alto}: no se puede tocar`);
    else bien(`y se puede tocar (${arrep.w}x${arrep.alto})`);
    const r=await p.request.get(S+'/'+String(arrep.h).replace(/^\//,'').split('#')[0]);
    if(!r.ok()) mal(`el botón de arrepentimiento lleva a ${arrep.h}, que da ${r.status()}`);
    else bien('y lleva a una página que existe');
  }

  /* 3 · el aviso del artículo 6, en la pantalla donde se pide el dato */
  console.log('\n─── el aviso del artículo 6, donde se pide el dato ───');
  const { crearFake } = require('./fakesb');
  const fake=crearFake('ok'); await fake.instalar(p); fake.claves[COD]=CLAVE;
  fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
    tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now(),
    camara:true,cupo_fotos:24,cupo_invitados:100,revelado:false});

  const mirarAviso=async(q,url,abrir)=>{
    await p.goto(url,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1800);
    if(abrir) await abrir();
    const d=await p.evaluate(()=>{
      const n=document.querySelector('.aviso-datos');
      if(!n) return null;
      const b=n.getBoundingClientRect();
      const res=n.querySelector('summary');
      return {texto:n.textContent.replace(/\s+/g,' '),
              rotulo:res?res.textContent.trim():'',
              w:Math.round(b.width), alto:Math.round(res?res.getBoundingClientRect().height:0),
              priv:!!n.querySelector('a[href*="privacidad"]')};
    });
    if(!d){ mal(`${q}: no hay aviso de datos en la pantalla donde se pide el dato`); return; }
    bien(`${q}: el aviso está en la pantalla`);
    for(const [k,re] of ART6){
      if(!re.test(d.texto)) mal(`${q}: el aviso no dice ${k}`);
      else bien(`${q}: dice ${k}`);
    }
    if(!d.priv) mal(`${q}: el aviso no enlaza la Política de Privacidad`);
    else bien(`${q}: enlaza la Política de Privacidad`);
    /* Plegado está bien; escondido no. El rótulo tiene que poder tocarse. */
    if(d.alto<44) mal(`${q}: el aviso no se puede abrir con el dedo (${d.alto}px)`);
    else bien(`${q}: se puede abrir con el dedo`);
  };

  await mirarAviso('el muro', S+'/muro.html#subir/'+COD);
  /* En el rollo el aviso está donde se le pide el nombre al invitado. */
  await p.route('**/*.supabase.co/**', r=>{
    const u=r.request().url();
    if(u.includes('/rest/v1/ce_eventos')) return r.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify([{codigo:'TEST-1',nombre:'Los 15 de Delfina',tono:'#D9AE72',
        camara:true,cerrado:false,cupo_fotos:24,fecha:'2026-10-18'}])});
    if(u.includes('/rpc/ce_mi_rollo')) return r.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({token:'tok',nombre:'Ana',disparos:0,cupo:24,camara:true,
        cerrado:false,revelado:false,revela_en:null})});
    return r.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
  await mirarAviso('el rollo', S+'/rollo.html?e=TEST-1');

  /* 4 · que la política no se vacíe */
  console.log('\n─── que los textos no se vacíen con el tiempo ───');
  const priv=fs.readFileSync(path.join(RAIZ,'privacidad.html'),'utf8');
  const term=fs.readFileSync(path.join(RAIZ,'terminos.html'),'utf8');
  for(const [q,re] of [
      ['al responsable y su domicilio', /Click Eterno[\s\S]{0,200}Rosario/i],
      ['la ley que la rige',            /Ley\s*25\.?326/i],
      ['el plazo de conservación',      /90 días/i],
      /* Los tres por separado: una ventana de N caracteres entre "acceso" y
         "rectificación" es un número inventado, y el día que se agrega una
         frase en el medio la prueba falla por el motivo equivocado. */
      ['el derecho de acceso',          /\bacceso\b/i],
      ['el derecho de rectificación',   /rectificaci/i],
      ['el derecho de supresión',       /supresi/i],
      ['los plazos para responder',     /10 días|5 días/i],
      ['el organismo de control',       /Agencia de Acceso a la Información Pública/i],
      ['la transferencia internacional',/transferencia internacional|60-E\/2016/i],
      ['el derecho a la imagen',        /art[ií]culo 53|53 del C[óo]digo Civil/i],
      ['a los menores de edad',         /menores/i],
      ['que no hay cookies',            /no usa cookies|sin cookies/i]]){
    if(!re.test(priv)) mal(`la política de privacidad ya no menciona ${q}`);
    else bien(`la política menciona ${q}`);
  }
  for(const [q,re] of [
      ['el derecho de revocación',   /34 de la Ley 24\.?240|derecho de revocaci/i],
      ['los 10 días para arrepentirse',/10 días/i],
      ['la jurisdicción del consumidor',/domicilio del consumidor/i],
      ['los 90 días del álbum',      /90 días/i],
      ['Defensa del Consumidor',     /Defensa del Consumidor/i]]){
    if(!re.test(term)) mal(`los términos ya no mencionan ${q}`);
    else bien(`los términos mencionan ${q}`);
  }

  /* 5 · el security.txt, y que no esté vencido */
  console.log('\n─── security.txt ───');
  const rs=await p.request.get(S+'/.well-known/security.txt');
  if(!rs.ok()) mal(`/.well-known/security.txt da ${rs.status()}`);
  else{
    bien('/.well-known/security.txt se sirve');
    const t=await rs.text();
    if(!/^Contact:/m.test(t)) mal('el security.txt no tiene Contact, que es el único campo obligatorio');
    else bien('tiene Contact');
    const m=t.match(/^Expires:\s*(\S+)/m);
    if(!m) mal('el security.txt no tiene Expires (lo exige la RFC 9116)');
    else{
      const cuando=new Date(m[1]);
      if(isNaN(cuando)) mal('el Expires del security.txt no es una fecha válida: '+m[1]);
      else if(cuando<=new Date())
        mal(`el security.txt está VENCIDO (${m[1]}): hay que renovarlo`);
      else{
        const dias=Math.round((cuando-new Date())/86400000);
        if(dias<30) nota(`el security.txt vence en ${dias} días: conviene renovarlo`);
        bien(`no está vencido (quedan ${dias} días)`);
      }
    }
  }

  /* 6 · lo que no va a la web sigue sin ir */
  console.log('\n─── lo que no se publica ───');
  const ignora=fs.readFileSync(path.join(RAIZ,'.assetsignore'),'utf8')
    .split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
  const cubre=rel=>ignora.some(pat=>{
    if(pat.endsWith('/')) return rel.startsWith(pat);
    if(pat.startsWith('*.')) return rel.endsWith(pat.slice(1));
    return rel===pat;
  });
  /* Todo lo que hay en el repo que no tiene que ser público. */
  const secretos=[];
  for(const d of ['sql','pruebas','apps-script'])
    if(fs.existsSync(path.join(RAIZ,d))) secretos.push(d+'/');
  for(const f of fs.readdirSync(RAIZ))
    if(f.endsWith('.md')) secretos.push(f);
  secretos.push('wrangler.json');
  for(const s of secretos){
    if(!cubre(s)) mal(`${s} se publicaría en la web: falta en .assetsignore`);
  }
  bien(`los ${secretos.length} archivos y carpetas que no van a la web están cubiertos`);
  /* Y al revés: que no hayamos tapado por error algo que SÍ tiene que salir. */
  for(const debe of ['privacidad.html','terminos.html','.well-known/security.txt']){
    if(cubre(debe)) mal(`${debe} está en .assetsignore y NO se publicaría`);
    else bien(`${debe} se publica`);
  }

  /* 7 · lo que todavía falta completar, dicho en voz alta en cada corrida */
  for(const [q,arch] of [['la política de privacidad','privacidad.html'],
                         ['los términos y condiciones','terminos.html']]){
    const t=fs.readFileSync(path.join(RAIZ,arch),'utf8');
    if(/\[PENDIENTE: razón social y CUIT\]/.test(t))
      nota(`${q} todavía dice "[PENDIENTE: razón social y CUIT]": hay que completarlo`);
  }

  if(errs.length) mal('errores de JavaScript: '+errs.slice(0,2).join(' | '));
  await ctx.close();
  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
