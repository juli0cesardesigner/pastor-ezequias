// Service Worker para a Agenda PWA - Pastor Ezequias
const CACHE_NAME = 'ezequias-agenda-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/?page=agenda',
  '/index.html',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/agenda-icon-192.png',
  '/agenda-icon-512.png',
  '/agenda-icon.svg',
  '/foto.webp',
  '/nome.webp'
];

// Instalação do Service Worker e pré-cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Falha parcial no pré-cache do PWA:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
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
    })
  );
  self.clients.claim();
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Não interceptar chamadas ao Neon Database ou APIs externas
  if (url.hostname.includes('neon.tech') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Requisições de navegação (HTML / SPA): Network first com fallback para cache
  // Preserva query parameters como page=agenda
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html').then((indexRes) => {
              return indexRes || caches.match('/');
            });
          });
        })
    );
    return;
  }

  // Requisições de assets estáticos e recursos: Cache first com fallback de rede e cache dinâmico
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Listener de Notificações Web Push (Background)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Compromisso - Pastor Ezequias',
    body: 'Você tem um compromisso na sua agenda!',
    url: '/?page=agenda'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/foto.webp',
    badge: '/foto.webp',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/?page=agenda'
    },
    actions: [
      { action: 'open', title: 'Ver Agenda' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/?page=agenda';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (typeof client.navigate === 'function') {
            return client.navigate(targetUrl)
              .then((navClient) => (navClient || client).focus())
              .catch(() => client.focus());
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

