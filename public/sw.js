const CACHE_NAME = 'tunekit-pro-v4-network-first';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge all legacy cache-first caches so stale index.html never blocks new Vite bundle hashes
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
      // Automatically refresh any open tabs that were stuck on stale cached HTML
      const windowClients = await self.clients.matchAll({ type: 'window' });
      for (const client of windowClients) {
        try {
          await client.navigate(client.url);
        } catch (_) {
          // ignore cross-origin or closed tab errors
        }
      }
    })()
  );
});

// Network-first strategy: always fetch fresh HTML & JS bundles when online; fallback to cache only offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
