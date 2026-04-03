/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const pushPromise = (async () => {
    try {
      const data = event.data?.json();
      const { title, body, referenceId, referenceType } = data;

      const options: NotificationOptions = {
        body: body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: referenceType === 'issue' && referenceId ? `/issues/${referenceId}` : 
               referenceType === 'message' ? '/messages' : 
               referenceType === 'payment' ? '/payments' : '/',
        },
      };

      await self.registration.showNotification(title, options);

      // Notify all active tabs to refresh their notification status
      const windowClients = await self.clients.matchAll({ type: 'window' });
      for (const client of windowClients) {
        client.postMessage({ type: 'PUSH_RECEIVED' });
      }
    } catch (err) {
      console.error('Push event error:', err);
    }
  })();

  event.waitUntil(pushPromise);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open and focus it or open a new one
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
