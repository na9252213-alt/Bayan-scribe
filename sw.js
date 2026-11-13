/* Bayan Scribe service worker — app shell + library caching for offline use.
 * App shell: precached. CDN libraries (transformers.js, docx.js, ONNX wasm)
 * and Hugging Face model files: cached on first use, then served from cache.
 * The Whisper model itself is also cached by transformers.js (Cache API). */
const VERSION = 'bayan-scribe-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg'
];
const RUNTIME_CACHE = 'bayan-scribe-runtime-v1';
const RUNTIME_ORIGINS = [
  'cdn.jsdelivr.net',
  'cdn-lfs.huggingface.co',
  'huggingface.co'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Navigation: network first, fall back to cached app shell offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(VERSION).then((cache) => cache.put('./index.html', copy));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // CDN libraries + model files: cache first (offline after first download).
  if (RUNTIME_ORIGINS.includes(url.hostname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const resp = await fetch(event.request);
        if (resp && (resp.status === 200 || resp.type === 'opaque')) {
          cache.put(event.request, resp.clone());
        }
        return resp;
      })
    );
    return;
  }

  // Same-origin static files: cache first, refresh in background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request).then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(VERSION).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
