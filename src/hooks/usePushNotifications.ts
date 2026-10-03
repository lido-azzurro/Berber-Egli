import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

let cachedVapidKey: string | null = null;

async function fetchVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey !== null) return cachedVapidKey;

  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey && envKey.length > 0) {
    cachedVapidKey = envKey;
    return envKey;
  }

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vapidPublicKey) {
        cachedVapidKey = data.vapidPublicKey;
        return data.vapidPublicKey;
      }
    }
  } catch {
    // fall through
  }
  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      setPermission('granted');
      void navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscription(sub);
      });
    } else if (Notification.permission === 'denied') {
      setPermission('denied');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return false;
    }
    setRegistering(true);
    try {
      const vapidPublicKey = await fetchVapidPublicKey();
      if (!vapidPublicKey) {
        setRegistering(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPermission('denied');
        setRegistering(false);
        return false;
      }
      setPermission('granted');

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      setSubscription(sub);

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (p256dh && auth) {
        await supabase.from('push_subscriptions').upsert({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        });
      }

      setRegistering(false);
      return true;
    } catch {
      setRegistering(false);
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        return { success: true, message: `Push notification sent (${data.sent}/${data.total}).` };
      }
      const reason = data.errors?.[0] ?? 'No subscriptions registered.';
      return { success: false, message: `Not sent: ${reason}` };
    } catch {
      return { success: false, message: 'Could not reach notification server.' };
    }
  }, []);

  return { permission, subscription, registering, requestPermission, sendTestNotification };
}
