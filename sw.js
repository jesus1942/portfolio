// Service Worker — network-first (siempre contenido fresco online, cache como fallback offline)
const CACHE = 'jo-portfolio-v1';
const CORE = [
  '/',
  '/servicios',
  '/styles.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo-isotipo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Solo GET y mismo origen
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Network-first: intento red, guardo copia, fallback a cache si no hay conexión
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
  );
});
