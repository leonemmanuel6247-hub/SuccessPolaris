
const CACHE_NAME = 'polaris-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // NE JAMAIS CACHER LES APPELS AUX SERVICES GOOGLE (Sheets, Macros, Apps Script)
  if (
    url.includes('google.com/spreadsheets') || 
    url.includes('script.google.com') || 
    url.includes('googleusercontent.com')
  ) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne la réponse du cache si elle existe, sinon fait une requête réseau
        if (response) return response;
        return fetch(event.request);
      })
  );
});

// Nettoyage des anciens caches lors de l'activation du nouveau SW
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
