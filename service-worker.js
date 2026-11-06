// Cache mínimo del shell de la app. Los datos (Mis Datos / Ranking / Carga) nunca se cachean:
// siempre se piden en vivo al backend, autenticados. Subir CACHE_VERSION en cada deploy para
// forzar a los celulares a bajar la versión nueva.
const CACHE_VERSION = 'liceo-app-v30';
const SHELL = ['./', './index.html', './manifest.json', './login-bg.webp', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Nunca cachear llamadas al backend (Apps Script) ni nada fuera de este origen.
  if (url.origin !== self.location.origin) return;
  // El documento principal (la navegación en sí, index.html) va SIEMPRE a la red primero y recién
  // si falla (sin señal) cae al cache -- incidente real, 6/11: un index.html viejo cacheado acá
  // quedó pisando al app.js nuevo (que nunca se cachea, siempre se pide fresco) y rompió el
  // arranque para todo el mundo hasta que cada celular volvía a instalar este Service Worker.
  // Cache-first sigue para el resto del shell (íconos, manifest, fondo), que casi no cambia.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((r) => { caches.open(CACHE_VERSION).then((c) => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
