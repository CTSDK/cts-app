// Service worker: gemmer selve appen på telefonen, så den kan starte uden net.
// Kald til Google (maskinrummet) går aldrig gennem cachen.
var CACHE = 'cts-app-v17';
var FILER = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css?v=17',
  'js/beregn.js?v=17', 'js/retro.js?v=17', 'js/api.js?v=17', 'js/lokal.js?v=17', 'js/data.js?v=17',
  'js/foto.js?v=17', 'js/beskaer.js?v=17', 'js/app.js?v=17',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/logo-segl.png', 'icons/logo-ikon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILER); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (navne) {
    return Promise.all(navne.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Selve siden: hent ny version når der er net (højst 4 sek.), ellers brug den gemte
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(function (ok) {
      var faerdig = false;
      var fra = function () { caches.match('index.html').then(function (r) { if (!faerdig) { faerdig = true; ok(r || Response.error()); } }); };
      var t = setTimeout(fra, 4000);
      fetch(req).then(function (r) {
        clearTimeout(t);
        if (r && r.ok) { var kopi = r.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', kopi); }); }
        if (!faerdig) { faerdig = true; ok(r); }
      }).catch(function () { clearTimeout(t); fra(); });
    }));
    return;
  }

  // Øvrige filer: fra cache, ellers net (og gem)
  e.respondWith(caches.match(req).then(function (r) {
    return r || fetch(req).then(function (svar) {
      if (svar && svar.ok) { var kopi = svar.clone(); caches.open(CACHE).then(function (c) { c.put(req, kopi); }); }
      return svar;
    });
  }));
});
