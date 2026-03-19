// ─────────────────────────────────────────
// sw.js — Service Worker
// Caches the app shell so it works offline
// ─────────────────────────────────────────

const CACHE_NAME = 'skycheck-v1';

// Files to cache on install (the "app shell")
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// ── Install: cache the app shell ──
self.addEventListener('install', event => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // activate immediately
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fall back to network ──
self.addEventListener('fetch', event => {
  // For API calls, always use the network (no caching)
  if (event.request.url.includes('api.open-meteo.com') ||
      event.request.url.includes('geocoding-api.open-meteo.com')) {
    return; // let the browser handle it normally
  }

  // For app files, try cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        console.log('[SW] Serving from cache:', event.request.url);
        return cached;
      }
      // Not in cache — fetch from network
      return fetch(event.request);
    })
  );
});