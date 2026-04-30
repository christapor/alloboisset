// public/sw.js

self.addEventListener('push', (event) => {
  // On récupère les données envoyées par le serveur
  const data = event.data ? event.data.json() : { 
    title: 'AlloBoisset', 
    body: 'Nouveau message de covoiturage !' 
  };

  const options = {
    body: data.body,
    icon: '/logo-192.png',    // L'icône de l'app
    badge: '/favicon.png',    // L'icône dans la barre de notifications Android
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'    // L'URL où envoyer l'utilisateur au clic
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
