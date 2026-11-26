/* Para que la app abra sin señal. Siempre prueba primero con la red (así
   nunca queda una versión vieja pegada) y solo si no hay conexión usa la copia. */
const V = 'mansion-v1';
const ARCH = ['./', 'index.html', 'estilo.css', 'config.js', 'datos.js', 'carga.js', 'calc.js', 'nube.js', 'excel.js', 'app.js', 'manifest.webmanifest', 'icono-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(ARCH)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (!u.pathname.startsWith('/mansion/') && !u.pathname.startsWith('/lib/')) return;
  const red = fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return r; });
  const tope = new Promise((_, no) => setTimeout(() => no(new Error('lento')), 4000));
  e.respondWith(Promise.race([red, tope]).catch(() => caches.match(e.request).then(m => m || red.catch(() => caches.match('index.html')))));
});
