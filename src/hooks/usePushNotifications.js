import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Clé publique VAPID utilisée pour l'abonnement Web Push
const PUBLIC_VAPID_KEY = 'BKK4uBgAWRVhznoTxx7vsXt_1fD2uNB3_T1O9gheERAkXTZo-ak5EahDOuyvjfZvyi9aGkmNHDHcem75lEzpIyY';

const detectMobileSystem = () => {
  const userAgent = window.navigator.userAgent || '';
  const platform = window.navigator.platform || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);

  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'other';
};

const getNotificationHelpText = () => {
  const system = detectMobileSystem();

  if (system === 'android') {
    return [
      'Les notifications semblent bloquées sur ce téléphone.',
      '',
      'Pour les réactiver :',
      '1. Appuyez longtemps sur l\'icône AlloBoisset.',
      '2. Appuyez sur "Infos sur l\'application" ou le petit i.',
      '3. Ouvrez "Notifications".',
      '4. Activez "Autoriser les notifications".',
      '5. Fermez complètement AlloBoisset, puis rouvrez l\'application.',
      '6. Revenez ici et appuyez de nouveau sur "Activer les alertes".'
    ].join('\n');
  }

  if (system === 'ios') {
    return [
      'Les notifications semblent bloquées sur cet iPhone.',
      '',
      'Pour les réactiver :',
      '1. Ouvrez l\'application Réglages.',
      '2. Allez dans "Notifications".',
      '3. Choisissez "AlloBoisset".',
      '4. Activez "Autoriser les notifications".',
      '5. Fermez complètement AlloBoisset, puis rouvrez l\'application.',
      '6. Revenez ici et appuyez de nouveau sur "Activer les alertes".'
    ].join('\n');
  }

  return [
    'Les notifications semblent bloquées dans ce navigateur.',
    '',
    'Pour les réactiver sur ordinateur :',
    '1. Cliquez sur le cadenas à gauche de l\'adresse du site.',
    '2. Ouvrez "Paramètres du site".',
    '3. Cherchez "Notifications".',
    '4. Choisissez "Autoriser".',
    '5. Fermez complètement AlloBoisset, puis rouvrez l\'application.',
    '6. Revenez ici et appuyez de nouveau sur "Activer les alertes".'
  ].join('\n');
};

const getNoChoiceHelpText = () => {
  const system = detectMobileSystem();

  if (system === 'android') {
    return 'Aucun choix n\'a été fait. Pour recevoir les alertes AlloBoisset, appuyez sur "Autoriser" lorsque le téléphone le propose.';
  }

  if (system === 'ios') {
    return 'Aucun choix n\'a été fait. Pour recevoir les alertes AlloBoisset, appuyez sur "Autoriser" lorsque l\'iPhone le propose.';
  }

  return 'Aucun choix n\'a été fait. Pour recevoir les alertes AlloBoisset, cliquez sur "Autoriser" lorsque le navigateur le propose. Si aucune demande ne s\'affiche, cliquez sur le cadenas à gauche de l\'adresse du site, puis autorisez les notifications.';
};

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
      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées par ce navigateur');
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Notifications non supportées par ce navigateur');
      }

      if (Notification.permission === 'denied') {
        alert(getNotificationHelpText());
        return;
      }

      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

      if (permission === 'default') {
        alert(getNoChoiceHelpText());
        return;
      }

      if (permission !== 'granted') {
        alert(getNotificationHelpText());
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
      }

      const savedUser = localStorage.getItem('user_boisset');
      if (!savedUser) throw new Error('Utilisateur non connecté sur AlloBoisset');
      
      const user = JSON.parse(savedUser);
      const userId = user.telephone;

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
