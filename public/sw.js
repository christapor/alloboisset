self.addEventListener('push', (event) => {
  console.log('☁️ Notification Push reçue !');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Erreur parsing JSON push:", e);
      data = { title: 'AlloBoisset', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Nouveau message de covoiturage !',
    icon: '/logo-192.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AlloBoisset', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
