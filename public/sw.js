const CACHE_NAME = 'amazing-trip-v12'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/app-icon-192.png',
  '/app-icon-512.png',
  '/app-icon.svg',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'AMAZING_TRIP_UPDATE_READY' })
          if ('navigate' in client) {
            client.navigate(client.url)
          }
        })
      })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (
        request.url.includes('/assets/') ||
        request.url.includes('/pdfjs/')
      ) {
        return fetch(request).catch(() => cachedResponse)
      }

      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((networkResponse) => {
        const shouldCache =
          networkResponse.ok &&
          new URL(request.url).origin === self.location.origin

        if (shouldCache) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
        }

        return networkResponse
      })
    })
  )
})
