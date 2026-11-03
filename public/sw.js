// Service Worker para a Agenda PWA - Pastor Ezequias
const CACHE_NAME = 'ezequias-agenda-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
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

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Fallback básico para requisições de navegação offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
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
    } catch (e) {
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
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

