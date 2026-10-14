self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 ALERTA FLOODWAY - NÍVEL DO RIO';
  const options = {
    body: data.body || 'Atenção: o nível do Rio Taquari atingiu a cota de atenção para sua localidade.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'alerta-enchente',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
