/* eslint-env serviceworker */
/**
 * Handlers de Web Push, importados por el Service Worker que genera Workbox
 * (ver `workbox.importScripts` en vite.config.js).
 *
 * Va aparte y no dentro del SW generado para no tener que reescribir a mano
 * toda la configuración de caché: Workbox sigue manejando el offline y este
 * archivo sólo agrega las notificaciones.
 *
 * En iOS esto únicamente corre si la app está INSTALADA en la pantalla de
 * inicio (iOS 16.4+). En una pestaña de Safari no hay push.
 */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Si el server manda texto plano en vez de JSON, no se pierde el aviso.
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Citas — Gonza & Juli';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // Un tag por tipo: si llegan dos avisos de pendientes seguidos, se
    // reemplazan en vez de apilarse.
    tag: payload.tag || 'citas-novedad',
    renotify: true,
    data: { url: payload.url || '/' }
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);

      // El puntito en el ícono de la app. El número es la cantidad de avisos
      // sin leer, que es justo lo que hay en la bandeja del SW.
      if (self.navigator && 'setAppBadge' in self.navigator) {
        try {
          const pending = await self.registration.getNotifications();
          await self.navigator.setAppBadge(pending.length || 1);
        } catch {
          /* el badge es un extra: si el sistema no lo soporta, da igual */
        }
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      if (self.navigator && 'clearAppBadge' in self.navigator) {
        try {
          await self.navigator.clearAppBadge();
        } catch {
          /* ídem */
        }
      }

      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if ('focus' in client) {
          await client.focus();
          if (client.navigate && targetUrl !== '/') {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* si no deja navegar, al menos quedó la app en foco */
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

/**
 * La app avisa cuando el usuario ya vio las novedades para limpiar el ícono.
 * El badge se apaga desde acá porque en iOS el contador lo maneja el SW.
 */
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'CLEAR_BADGE') return;

  event.waitUntil(
    (async () => {
      if (self.navigator && 'clearAppBadge' in self.navigator) {
        try {
          await self.navigator.clearAppBadge();
        } catch {
          /* ídem */
        }
      }
      const pending = await self.registration.getNotifications();
      pending.forEach((n) => n.close());
    })()
  );
});
