import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Ta clé publique générée tout à l'heure
const PUBLIC_VAPID_KEY = 'BKK4uBgAWRVhznoTxx7vsXt_1fD2uNB3_T1O9gheERAkXTZo-ak5EahDOuyvjfZvyi9aGkmNHDHcem75lEzpIyY';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      // 1. On vérifie que les notifications sont supportées
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Notifications non supportées par ce navigateur');
      }

      // 2. On demande la permission (c'est là que la fenêtre Android doit apparaître)
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission refusée par l\'utilisateur');
      }

      // 3. On enregistre explicitement le Service Worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // 4. On s'abonne avec ta clé VAPID
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      // 5. CORRECTION : On utilise TON système de connexion (le téléphone)
      const savedUser = localStorage.getItem('user_boisset');
      if (!savedUser) throw new Error('Utilisateur non connecté sur AlloBoisset');
      
      const user = JSON.parse(savedUser);
      const userId = user.telephone; // On utilise le 06... comme identifiant

      // 6. On sauvegarde dans Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ 
          user_id: userId, 
          subscription_data: subscription.toJSON() 
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setIsSubscribed(true);
      alert('✅ Notifications activées avec succès pour AlloBoisset !');
      
    } catch (err) {
      console.error('Erreur Push:', err);
      alert('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return { subscribeToPush, isSubscribed, loading };
};
