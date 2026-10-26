// Service worker bypass for local development to prevent ERR_FAILED and stale cache errors
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  // Let network handle all requests directly
})
