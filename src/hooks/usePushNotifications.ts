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

async function ensureSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const vapidPublicKey = await fetchVapidPublicKey();
  if (!vapidPublicKey) return null;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const p256dh = sub.getKey('p256dh');
  const auth = sub.getKey('auth');
  if (p256dh && auth) {
    await supabase.from('push_subscriptions').upsert({
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    });
  }

  return sub;
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
      // Auto-create subscription if permission already granted but no subscription exists
      void ensureSubscription().then((sub) => {
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
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPermission('denied');
        setRegistering(false);
        return false;
      }
      setPermission('granted');

      const sub = await ensureSubscription();
      setSubscription(sub);

      setRegistering(false);
      return sub !== null;
    } catch {
      setRegistering(false);
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Ensure we have a subscription before sending test
      if (!subscription) {
        const sub = await ensureSubscription();
        setSubscription(sub);
        if (!sub) {
          return { success: false, message: 'Nuk u krijua abonimi push. Lejo njoftimet së pari.' };
        }
      }

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
        return { success: true, message: `Push notification u dërgua (${data.sent}/${data.total}).` };
      }
      const reason = data.errors?.[0] ?? 'Nuk ka abonime të regjistruara.';
      return { success: false, message: `Nuk u dërgua: ${reason}` };
    } catch {
      return { success: false, message: 'Nuk u arrit serveri i njoftimeve.' };
    }
  }, [subscription]);

  return { permission, subscription, registering, requestPermission, sendTestNotification };
}
