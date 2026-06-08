// ============================================
// SERVICE WORKER — Personal Finance App
// Άλλαξε το CACHE_VERSION κάθε φορά που
// ανεβάζεις νέο index.html στο GitHub
// ============================================
const CACHE_VERSION = '1.0.0';
const CACHE_NAME = 'pf-cache-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
];

// INSTALL — κατεβάζει και cache-άρει τα αρχεία
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => {
      // Αναλαμβάνει αμέσως χωρίς να περιμένει reload
      return self.skipWaiting();
    })
  );
});

// ACTIVATE — σβήνει παλιά caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      // Αναλαμβάνει όλα τα tabs αμέσως
      return self.clients.claim();
    })
  );
});

// FETCH — network-first για index.html, cache για τα υπόλοιπα
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Για το index.html: πάντα δοκιμάζει network πρώτα
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Αποθηκεύει το νέο αρχείο στο cache
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Αν δεν υπάρχει internet, χρησιμοποιεί το cached
          return caches.match(event.request);
        })
    );
    return;
  }

  // Για CDN scripts (Chart.js, Supabase, Tailwind): cache-first
  if (url.hostname !== location.hostname) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// MESSAGE — λαμβάνει εντολή skipWaiting από το app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
