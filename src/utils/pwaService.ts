// Utilitários para registro do Service Worker e gerenciamento de Web Push PWA

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não é suportado neste navegador.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    return registration;
  } catch (error) {
    console.error('Falha ao registrar o Service Worker da Agenda:', error);
    return null;
  }
}

export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Converte base64 VAPID key para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Solicita permissão e inscreve o usuário para Push Notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKey?: string
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Se houver uma subscription ativa, retorna
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return subscription;
    }

    // Configura opções de inscrição
    const options: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey ? (urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource) : undefined
    };

    subscription = await registration.pushManager.subscribe(options);
    return subscription;
  } catch (error) {
    console.error('Erro ao subscrever para Push Notifications:', error);
    return null;
  }
}

/**
 * Dispara uma notificação local de teste caso push remoto não esteja configurado
 */
export async function sendLocalNotification(title: string, body: string): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      await (registration as unknown as { showNotification: (title: string, options: Record<string, unknown>) => Promise<void> }).showNotification(title, {
        body,
        icon: '/foto.webp',
        badge: '/foto.webp',
        vibrate: [100, 50, 100]
      });
      return true;
    } else {
      new Notification(title, { body, icon: '/foto.webp' });
      return true;
    }
  }
  return false;
}

