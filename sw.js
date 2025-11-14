// Nombre del caché
const CACHE_NAME = 'michicatt-store-cache-v1';

// Recursos para cachear (el "App Shell")
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Evento Install: se dispara cuando el SW se instala
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        // Cachear todos los recursos del App Shell
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Fallo al cachear el App Shell:', err);
      })
  );
});

// Evento Fetch: se dispara cada vez que la app pide un recurso (CSS, JS, imagen)
self.addEventListener('fetch', event => {
  // Solo nos interesan las peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia: "Cache First" (Primero caché, luego red)
  // Intentamos servir el recurso desde el caché
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Si está en el caché, lo devolvemos
        if (response) {
          return response;
        }

        // 2. Si no está en el caché, vamos a la red
        return fetch(event.request)
          .then(networkResponse => {
            // Si la respuesta es válida, la clonamos y la guardamos en el caché
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            // Devolvemos la respuesta de la red
            return networkResponse;
          })
          .catch(error => {
            // Manejo de error si falla la red (modo offline)
            console.warn('Petición fetch falló, el usuario está offline o el recurso no está disponible:', error);
          });
      })
  );
});

// Evento Activate: Limpia cachés antiguos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Borra el caché si no está en la lista blanca
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});