// Service worker de l'application livreur : permet de relancer l'application sans réseau.
// Réseau d'abord (jamais de version périmée quand on est connecté), cache en secours.
var CACHE = 'stls-livreur-v1';
var SHELL = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin===location.origin;
  var sdk = url.href.indexOf('https://www.gstatic.com/firebasejs/')===0;     // bibliothèques Firebase : nécessaires pour démarrer hors ligne
  if(!sameOrigin && !sdk) return;                                              // les appels à la base ne passent jamais par le cache
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || (sameOrigin ? caches.match('./index.html') : undefined); });
    })
  );
});
