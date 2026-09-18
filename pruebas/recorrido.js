/* ══════════════════════════════════════════════════════════════════
   EL RECORRIDO · la fiesta entera, de punta a punta.

   Las otras suites miran pantallas sueltas y casos feos. Esta hace lo
   que hace una persona en una noche: el organizador crea el evento y lo
   configura, un invitado manda un saludo desde otro teléfono, la
   pantalla del salón NO lo proyecta porque está esperando aprobación,
   el organizador se entera solo, aprueba, y recién ahí aparece
   proyectado. Después entra desde un segundo aparato con la clave y
   cierra el muro.

   Va contra la base BLINDADA, que es la que hay en producción: sin la
   clave del evento, la base no devuelve ni una fila.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const B=process.env.BASE||'http://127.0.0.1:8099';
let mal=0, bien=0;
const ok=t=>{bien++;console.log('   ✓ '+t)};
const no=(t,x)=>{mal++;console.log('   ✗ '+t+(x?' → '+String(x).replace(/\s+/g,' ').slice(0,110):''))};
const af=(c,t,x)=>c?ok(t):no(t,x);
const T=async(p,s)=>{try{return (await p.locator(s||'body').innerText()).replace(/\s+/g,' ')}catch(e){return ''}};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

(async()=>{
 const br=await chromium.launch();
 const ctx=await br.newContext({viewport:{width:390,height:844},permissions:['microphone']});
 const fake=crearFake('ok');            // base blindada, como producción
 const errs=[];
 const org=await ctx.newPage(); await fake.instalar(org);
 org.on('pageerror',e=>errs.push('ORG '+e.message));
 org.on('console',m=>{if(m.type()==='error'&&!/net::ERR|Failed to load/.test(m.text()))errs.push('ORG '+m.text())});

 console.log('\n═══ ORGANIZADOR ═══');
 await org.goto(B+'/muro.html#panel',{waitUntil:'domcontentloaded'}); await org.waitForTimeout(900);
 await org.fill('#pin','4321'); await org.click('#entrar'); await org.waitForTimeout(900);
 af(await org.locator('#crear').count()===1,'crea su clave y entra al panel', await T(org));

 await org.fill('#n','Casamiento Flor y Juan');
 await org.selectOption('#t','Boda').catch(()=>{});
 await org.click('#crear'); await org.waitForTimeout(2200);
 const cod=Object.keys(fake.claves)[0]||'';
 const clave=fake.claves[cod]||'';
 af(/^BOD-[A-Z2-9]{6}$/.test(cod),'el código es del tipo elegido y de 6 al azar',cod);
 af(/^[A-Z2-9]{6}$/.test(clave),'la clave del evento también',clave);
 af((await T(org)).includes(clave),'la clave se muestra una sola vez, para anotarla');

 await org.locator('#alEvento').click(); await org.waitForTimeout(1800);
 af((await T(org)).includes('Casamiento Flor y Juan'),'entra a su evento', await T(org));
 af(await org.locator('#qr canvas, #qr img').count()>0,'dibuja el QR');

 // ── ajustes ──
 await org.locator('[data-sol="pAjustes"]').click(); await org.waitForTimeout(700);
 await org.fill('#edTag','#FloryJuan'); await org.fill('#edLugar','Quinta El Ombú');
 await org.click('#guardarTag'); await org.waitForTimeout(1200);
 af((fake.db.ce_eventos[0]||{}).hashtag==='#FloryJuan','guarda hashtag y lugar',JSON.stringify(fake.db.ce_eventos[0]&&fake.db.ce_eventos[0].hashtag));
 await org.fill('#consignas','La foto más fea de la noche'); await org.click('#guardarC');
 await org.waitForTimeout(1200);
 af(((fake.db.ce_eventos[0]||{}).consignas||[]).length===1,'guarda las consignas');

 // ── moderación encendida ──
 await org.evaluate(c=>location.hash='#evento/'+c,cod); await org.waitForTimeout(1500);
 /* la palanca de moderar vive en la solapa Moderar, no en Ajustes */
 await org.locator('[data-sol="pModerar"]').click(); await org.waitForTimeout(600);
 const palanca=org.locator('#mod');
 if(await palanca.getAttribute('aria-pressed')!=='true'){ await palanca.click(); await org.waitForTimeout(1200); }
 af((fake.db.ce_eventos[0]||{}).moderar===true,'enciende la moderación',(fake.db.ce_eventos[0]||{}).moderar);

 console.log('\n═══ INVITADO (otro teléfono, sin clave) ═══');
 const inv=await ctx.newPage(); await fake.instalar(inv);
 inv.on('pageerror',e=>errs.push('INV '+e.message));
 inv.on('console',m=>{if(m.type()==='error'&&!/net::ERR|Failed to load/.test(m.text()))errs.push('INV '+m.text())});
 await inv.goto(B+'/muro.html#subir/'+cod,{waitUntil:'domcontentloaded'}); await inv.waitForTimeout(1800);
 const tInv=await T(inv);
 af(tInv.includes('Casamiento Flor y Juan'),'el invitado entra sin clave y ve la fiesta',tInv);
 af(tInv.includes('La foto más fea'),'y ve la consigna que puso el organizador');
 af(!/panel del organizador|zona de peligro|ajustes/i.test(tInv),'y no ve nada del organizador');

 await inv.locator('.chips button').filter({hasText:/dedicatoria/i}).click(); await inv.waitForTimeout(400);
 await inv.locator('#zona textarea, #zona input[type=text]').first().fill('Que sean muy felices');
 await inv.fill('#autor','La tía Nélida');
 await inv.click('#enviar'); await inv.waitForTimeout(2200);
 const trasEnviar=await T(inv);
 af(/enviado/i.test(trasEnviar),'con moderación le dice "Enviado", no "ya está en la pantalla"',trasEnviar);
 af(fake.db.ce_items.length===1 && fake.db.ce_items[0].estado==='pendiente',
    'la base lo guarda como PENDIENTE aunque el celular pida aprobado',
    JSON.stringify(fake.db.ce_items.map(i=>i.estado)));

 console.log('\n═══ LA PANTALLA DEL SALÓN ═══');
 const sala=await ctx.newPage(); await fake.instalar(sala);
 sala.on('pageerror',e=>errs.push('SALA '+e.message));
 await sala.goto(B+'/muro.html#pantalla/'+cod,{waitUntil:'domcontentloaded'}); await sala.waitForTimeout(2200);
 await sala.locator('[data-modo="muro"]').click().catch(()=>{}); await sala.waitForTimeout(1500);
 af(!(await T(sala)).includes('Que sean muy felices'),
    'lo pendiente NO se proyecta (la promesa del producto)');

 console.log('\n═══ EL ORGANIZADOR APRUEBA ═══');
 /* Sin recargar: el panel tiene que enterarse solo, como se entera la
    pantalla del salón. Antes había que salir y volver a entrar. */
 await org.waitForTimeout(10000);
 const globo=await org.locator('#globoPend').innerText().catch(()=>'-');
 af(globo==='1','el panel se entera SOLO de que llegó algo para aprobar',globo);
 await org.locator('[data-sol="pModerar"]').click(); await org.waitForTimeout(900);
 await org.locator('#cola .si').first().click(); await org.waitForTimeout(1500);
 af(fake.db.ce_items[0].estado==='aprobado','aprueba y la base lo marca aprobado',fake.db.ce_items[0].estado);

 await sala.reload({waitUntil:'domcontentloaded'}); await sala.waitForTimeout(2200);
 await sala.locator('[data-modo="muro"]').click().catch(()=>{}); await sala.waitForTimeout(1800);
 af((await T(sala)).includes('Que sean muy felices'),'ahora sí se proyecta',await T(sala));

 console.log('\n═══ SEGUNDO APARATO, CON LA CLAVE ═══');
 /* Navegador aparte de verdad: en el mismo contexto comparten localStorage
    y la clave ya estaba guardada, así que no probaba nada. */
 const ctx2=await br.newContext({viewport:{width:390,height:844}});
 const otro=await ctx2.newPage(); await fake.instalar(otro);
 otro.on('pageerror',e=>errs.push('OTRO '+e.message));
 await otro.goto(B+'/muro.html#evento/'+cod,{waitUntil:'domcontentloaded'}); await otro.waitForTimeout(2000);
 const pide=await T(otro);
 af(/clave/i.test(pide),'sin la clave guardada, la pide',pide);
 const campo=otro.locator('#claveEv');
 if(await campo.count()){
   await campo.fill('MAL123'); await otro.locator('#entrarEv, #entrar').first().click().catch(()=>{});
   await otro.waitForTimeout(1500);
   af(/no|incorrect|mal/i.test(await T(otro))||(await otro.locator('#claveEv').count())===1,
      'con la clave equivocada no entra');
   await otro.fill('#claveEv',clave); await otro.locator('#entrarEv, #entrar').first().click().catch(()=>{});
   await otro.waitForTimeout(2200);
   af((await T(otro)).includes('Casamiento Flor y Juan'),'con la clave correcta sí entra',await T(otro));
 } else no('hay campo para escribir la clave', pide);

 console.log('\n═══ ÁLBUM Y CIERRE ═══');
 await org.evaluate(c=>location.hash='#album/'+c,cod); await org.waitForTimeout(2200);
 af((await T(org)).includes('Casamiento Flor y Juan'),'el álbum abre');
 await org.evaluate(c=>location.hash='#evento/'+c,cod); await org.waitForTimeout(1800);
 await org.locator('[data-sol="pAjustes"]').click(); await org.waitForTimeout(600);
 await org.locator('#cerr').click(); await org.waitForTimeout(1600);
 af((fake.db.ce_eventos[0]||{}).cerrado===true,'cierra el muro',(fake.db.ce_eventos[0]||{}).cerrado);
 await org.evaluate(c=>location.hash='#subir/'+c,cod); await org.waitForTimeout(1600);
 af(/termin|cerr|gracias/i.test(await T(org)),'con el muro cerrado el invitado ya no sube',await T(org));

 console.log('\n─── errores de JavaScript ───');
 console.log(errs.length?errs.slice(0,6).join('\n'):'   ninguno');
 console.log(`\n${bien} bien · ${mal} mal`);
 await br.close();
 process.exit(mal?1:0);
})().catch(e=>{console.log('SE CORTÓ: '+e.message);process.exit(1)});
