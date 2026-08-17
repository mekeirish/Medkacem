// ====== SERVICE WORKER ======
const CACHE_NAME = 'medical-glass-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker : mise en cache des assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interception : stratégie Cache First, fallback réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les schémas non supportés
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Si la ressource est en cache, on la sert immédiatement
        if (cached) return cached;

        // Sinon, on va chercher sur le réseau
        return fetch(event.request).then(response => {
          // Si la réponse est valide, on la met en cache pour la prochaine fois
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(() => {
          // En cas d'échec réseau et de cache absent, on peut retourner une page hors ligne (optionnel)
          // Ici on ne fait rien, le navigateur affichera son erreur standard
          console.warn('Ressource non disponible hors ligne :', event.request.url);
        });
      })
  );
});