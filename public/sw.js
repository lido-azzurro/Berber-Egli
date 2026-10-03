const CACHE_NAME = 'berber-egli-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

// Inline SVG badge — gold "E" on dark background, used as notification badge/icon
const NOTIFICATION_ICON = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">' +
  '<rect width="192" height="192" fill="#0a0a0a"/>' +
  '<text x="50%" y="50%" font-family="sans-serif" font-size="96" fill="#d4af37" ' +
  'text-anchor="middle" dominant-baseline="central">E</text></svg>'
);

const NOTIFICATION_BADGE = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
  '<circle cx="48" cy="48" r="40" fill="#d4af37"/>' +
  '<text x="50%" y="50%" font-family="sans-serif" font-size="48" fill="#0a0a0a" ' +
  'text-anchor="middle" dominant-baseline="central">E</text></svg>'
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Rezervim i Ri',
    body: 'Keni një rezervim të ri',
    url: '/',
    tag: 'new-booking',
    test: false,
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    image: NOTIFICATION_ICON,
    vibrate: [300, 150, 300, 150, 300],
    data: {
      url: data.url || '/',
      test: data.test,
    },
    requireInteraction: true,
    tag: data.tag || 'new-booking',
    renotify: true,
    priority: 'high',
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
