/**
 * F1 Archive — Service Worker (v1.0.0)
 * Bulletproof offline & performance caching strategy:
 * - Network-First for navigations (index.html)
 * - Cache-First for immutable hashed assets, 3D models, decoders, and static data
 * - Network-Only for live APIs (Jolpica, OpenF1, Sentry, PostHog, Backend)
 */

const CACHE_NAME = 'f1-archive-v1.0.0';

// Core shell assets pre-cached during install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 1. Network-Only for external dynamic APIs and Observability
  if (
    url.hostname.includes('openf1.org') ||
    url.hostname.includes('jolpi.ca') ||
    url.hostname.includes('sentry.io') ||
    url.hostname.includes('posthog.com') ||
    url.port === '8000' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/health') ||
    url.pathname.startsWith('/query')
  ) {
    return;
  }

  // 2. Network-First for HTML navigation requests
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return new Response('Offline: Page not cached.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // 3. Cache-First for static assets, 3D models, decoders, and static data
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/models/') ||
    url.pathname.startsWith('/draco/') ||
    url.pathname.startsWith('/basis/') ||
    url.pathname.startsWith('/data/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
