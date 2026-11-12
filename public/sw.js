// Service Worker para a Agenda PWA - Pastor Ezequias
const CACHE_NAME = 'ezequias-agenda-cache-v5';
const STATIC_ASSETS = [
  '/',
  '/?page=agenda',
  '/index.html',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/agenda-icon-192.png',
  '/agenda-icon-512.png',
  '/agenda-icon.svg',
  '/badge-icon.png',
  '/foto.webp',
  '/nome.webp'
];

// Instalação do Service Worker e pré-cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Falha parcial no pré-cache do PWA:', err);
      });
    })
  );
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

  // Nunca interceptar em localhost durante desenvolvimento ou requisições do Vite
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '5173' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

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
    title: 'Agenda Pastor Ezequias',
    body: 'Você tem um novo compromisso na sua agenda!',
    url: '/?page=agenda'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const origin = self.location ? self.location.origin : '';
  const toUrl = (path, defaultPath) => {
    const p = (path || defaultPath || '').trim();
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (!origin) return p.startsWith('/') ? p : `/${p}`;
    return `${origin}${p.startsWith('/') ? '' : '/'}${p}`;
  };

  const resolvedIcon = toUrl(data.icon, '/agenda-icon-192.png');
  const resolvedBadge = toUrl(data.badge, '/badge-icon.png');

  const options = {
    body: data.body || 'Você tem um novo compromisso na sua agenda!',
    icon: resolvedIcon,
    badge: resolvedBadge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/?page=agenda'
    }
  };

  if (Array.isArray(data.actions) && data.actions.length > 0) {
    options.actions = data.actions;
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Agenda Pastor Ezequias', options)
  );
});

// Listener de mensagens da aplicação (para exibição de notificações locais pelo Service Worker)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const origin = self.location ? self.location.origin : '';
    const toUrl = (path, defaultPath) => {
      const p = (path || defaultPath || '').trim();
      if (!p) return '';
      if (p.startsWith('http://') || p.startsWith('https://')) return p;
      if (!origin) return p.startsWith('/') ? p : `/${p}`;
      return `${origin}${p.startsWith('/') ? '' : '/'}${p}`;
    };

    const defaultOptions = {
      icon: toUrl(options?.icon, '/agenda-icon-192.png'),
      badge: toUrl(options?.badge, '/badge-icon.png'),
      vibrate: [100, 50, 100],
      data: {
        url: '/?page=agenda'
      }
    };
    const finalOptions = Object.assign({}, defaultOptions, options || {});
    finalOptions.icon = defaultOptions.icon;
    finalOptions.badge = defaultOptions.badge;
    if (Array.isArray(finalOptions.actions) && finalOptions.actions.length === 0) {
      delete finalOptions.actions;
    }
    event.waitUntil(
      self.registration.showNotification(title || 'Agenda Pastor Ezequias', finalOptions)
    );
  }
});

// Clique na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/?page=agenda';
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          if (typeof client.navigate === 'function' && client.url !== targetUrl) {
            client.navigate(targetUrl);
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

