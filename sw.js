/* Cache simples para funcionar offline depois da primeira visita (requer http/https). */
var C = 'ed-v1';
var FILES = ['./','index.html','sobre.html','areas.html','contato.html','direito-civil.html','direito-trabalhista.html','direito-previdenciario.html','direito-de-familia.html','direito-empresarial.html','css/app.css','js/app.js','manifest.webmanifest','img/icon-192.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== C; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(C).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () { return caches.match(e.request); }));
});
