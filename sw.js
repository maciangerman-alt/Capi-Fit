// Capifit: guarda la app en el celular para que abra aunque no haya señal.
// Los datos se sincronizan solos (Firebase guarda los cambios y los sube cuando vuelve la conexión).
const CACHE = 'capifit-v5';
const CDN = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './config.js', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png', './capi-deco.jpg', './capi-corre.jpg'])).catch(() => { }));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Los videos van directo (el iPhone los pide por partes y no se pueden guardar así)
  if (url.pathname.endsWith('.mp4')) return;
  // La app: primero internet (para tener siempre la última versión), si no hay, la guardada
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // La configuración también: si la cambiás, los celulares la toman al toque
  if (url.origin === location.origin && url.pathname.endsWith('/config.js')) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; }).catch(() => caches.match(req)));
    return;
  }
  // Íconos, librerías y fuentes: la copia guardada primero
  if (url.origin === location.origin || CDN.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
      return r;
    })));
  }
  // Todo lo demás (Firebase, Open Food Facts) va directo a internet
});
