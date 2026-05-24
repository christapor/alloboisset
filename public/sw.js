self.addEventListener('push', (event) => {
  console.log('☁️ Notification Push reçue !');
  
  let pushData = {};
  if (event.data) {
    try {
      pushData = event.data.json();
    } catch (e) {
      console.error("Erreur parsing JSON push:", e);
      pushData = { title: 'AlloBoisset', body: event.data.text() };
    }
  }

  // Sécurité : On cherche l'URL soit dans pushData.data.url (nouveau format), 
  // soit dans pushData.url (ancien format), soit on met le mur par défaut.
  const targetUrl = pushData.data?.url || pushData.url || 'https://alloboisset.fr/?view=messages';

  const options = {
    body: pushData.body || 'Nouveau message de covoiturage !',
    icon: '/logo-192.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: targetUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title || 'AlloBoisset', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || 'https://alloboisset.fr/?view=messages';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'application est déjà ouverte en arrière-plan, on change son URL et on la focus
      for (const client of clientList) {
        if ('navigate' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Si l'application était complètement fermée, on l'ouvre
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
