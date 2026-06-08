// ============================================
// SERVICE WORKER — Personal Finance App
// Δεν χρειάζεται να αλλάξεις αυτό το αρχείο.
// Το version διαχειρίζεται το index.html
// ============================================

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
});

// ACTIVATE — σβήνει παλιά caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// FETCH — network-first για HTML, cache για CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // HTML αρχεία: πάντα network πρώτα
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname === '/Personal/' ||
    url.pathname === '/Personal'
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const clone = response.clone();
          caches.open('pf-html').then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CDN (Chart.js, Supabase, Tailwind): cache-first
  if (url.hostname !== location.hostname) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open('pf-cdn').then(c => c.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default: network
  event.respondWith(fetch(event.request));
});

// Λαμβάνει εντολή reload από το app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
