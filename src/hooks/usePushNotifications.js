import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const PUBLIC_VAPID_KEY = 'BKK4uBgAWRVhznoTxx7vsXt_1fD2uNB3_T1O9gheERAkXTZo-ak5EahDOuyvjfZvyi9aGkmNHDHcem75lEzpIyY';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Convertir la clé VAPID pour le navigateur
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
      // 1. Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission de notification refusée');
      }

      // 2. Enregistrer/Récupérer le Service Worker
      const registration = await navigator.serviceWorker.ready;

      // 3. S'abonner au service push du navigateur
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      // 4. Envoyer à Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ 
          user_id: user.id, 
          subscription_data: subscription.toJSON() 
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setIsSubscribed(true);
      console.log('Push OK pour Boisset !');
    } catch (err) {
      console.error('Erreur Push:', err);
    } finally {
      setLoading(false);
    }
  };

  return { subscribeToPush, isSubscribed, loading };
};
