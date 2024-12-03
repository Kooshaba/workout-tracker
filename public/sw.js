const CACHE_NAME = 'workout-tracker-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/bell.mp3'
];

// Skip waiting and claim clients immediately
self.skipWaiting();
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Always try network first, fall back to cache
      return fetch(event.request)
        .then(networkResponse => {
          // Update cache with new response
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => response || fetch(event.request));
    })
  );
});

// Listen for updates
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
}); 