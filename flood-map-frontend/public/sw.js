// Versão do Service Worker (atualizada automaticamente com o build)
const CACHE_VERSION = 'floodway-v-' + Date.now();

// Força a ativação imediata do novo Service Worker sem esperar o usuário fechar as abas
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    // Reivindica o controle de todos os clientes abertos imediatamente
    self.clients.claim().then(() => {
      // Notifica as abas/janelas ativas que uma nova versão foi ativada
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// Mensagens diretas do cliente
self.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 ALERTA FLOODWAY - NÍVEL DO RIO';
  const options = {
    body: data.body || 'Atenção: o nível do Rio Taquari atingiu a cota de atenção para sua localidade.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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
