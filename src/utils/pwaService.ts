// Utilitários para registro do Service Worker e gerenciamento de Web Push PWA

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
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

/**
 * Retorna se o navegador suporta a API Notification (local)
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retorna se o navegador suporta Web Push em background
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Solicita permissão de notificação com compatibilidade universal (Promise e legado callback)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const res = Notification.requestPermission();
    if (res && typeof res.then === 'function') {
      return await res;
    } else {
      return await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission((p) => resolve(p));
      });
    }
  } catch {
    return Notification.permission;
  }
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
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Se houver uma subscription ativa no PushManager, retorna
    if (registration.pushManager) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return subscription;
      }

      // No Chrome/Android, pushManager.subscribe exige applicationServerKey (VAPID).
      // Se vapidPublicKey não foi fornecido, não tenta subscrever com undefined para evitar DOMException.
      if (!vapidPublicKey) {
        return null;
      }

      // Configura opções de inscrição com chave pública VAPID
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource
      };

      return await registration.pushManager.subscribe(options);
    }

    return null;
  } catch (error) {
    console.warn('Inscrição Web Push não pôde ser completada:', error);
    return null;
  }
}

export interface LocalNotificationOptions {
  tag?: string;
  renotify?: boolean;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Dispara notificação com garantia de exibição na Central de Notificações de celulares
 * (Android Chrome, PWA standalone, Edge, Safari Desktop, etc).
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  customOptions?: LocalNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // Verifica permissão. Se não estiver concedida, não tenta disparar silenciosamente
  if (Notification.permission !== 'granted') {
    return false;
  }

  // Opções padronizadas para compatibilidade mobile:
  // - Ícone PNG de 192px (leve e compatível com área de notificação do Android)
  // - Badge PNG transparente monocromático (específico para a barra de status do Android)
  // - Tag e renotify: true (garantem que novos alertas vibrem e apareçam mesmo se houver anterior)
  // - Data com URL de redirecionamento para a Agenda
  const finalOptions: Record<string, unknown> = {
    body,
    icon: customOptions?.icon || '/agenda-icon-192.png',
    badge: customOptions?.badge || '/badge-icon.png',
    vibrate: customOptions?.vibrate || [200, 100, 200],
    tag: customOptions?.tag || 'agenda-notification',
    renotify: customOptions?.renotify ?? true,
    data: customOptions?.data || { url: '/?page=agenda' },
    requireInteraction: customOptions?.requireInteraction ?? false,
    silent: customOptions?.silent ?? false
  };

  // 1. Prioridade móvel: ServiceWorkerRegistration.showNotification()
  // No Android Chrome, 'new Notification()' lança TypeError. O método showNotification do Service Worker
  // é a ÚNICA forma de postar notificações na Central de Notificações do sistema.
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      let registration: ServiceWorkerRegistration | null = null;

      try {
        registration = (await navigator.serviceWorker.getRegistration()) || null;
      } catch {}

      if (!registration) {
        registration = await registerServiceWorker();
      }

      // Se o Service Worker ainda estiver instalando ou ativando, aguarda ativação
      if (registration && !registration.active && (registration.installing || registration.waiting)) {
        const worker = registration.installing || registration.waiting;
        if (worker) {
          await new Promise<void>((resolve) => {
            const handler = () => {
              if (worker.state === 'activated' || worker.state === 'redundant') {
                worker.removeEventListener('statechange', handler);
                resolve();
              }
            };
            worker.addEventListener('statechange', handler);
            setTimeout(resolve, 3000);
          });
        }
      }

      // Aguarda navigator.serviceWorker.ready caso active ainda não esteja pronto
      if (!registration?.active) {
        try {
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
          ]);
        } catch {
          registration = null;
        }
      }

      // Tenta chamada direta a registration.showNotification
      if (registration && typeof registration.showNotification === 'function') {
        try {
          await registration.showNotification(title, finalOptions);
          return true;
        } catch (showErr) {
          console.warn('Falha direta em registration.showNotification, tentando postMessage:', showErr);
        }
      }

      // Se a chamada direta falhou ou o worker está ativo, envia postMessage ao SW
      const targetWorker = registration?.active || navigator.serviceWorker.controller;
      if (targetWorker && typeof targetWorker.postMessage === 'function') {
        targetWorker.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: finalOptions
        });
        return true;
      }
    } catch (swError) {
      console.warn('Erro ao disparar notificação via Service Worker:', swError);
    }
  }

  // 2. Fallback para new Notification() (Desktop Chrome / Safari / Firefox)
  try {
    new Notification(title, finalOptions as NotificationOptions);
    return true;
  } catch (notifErr) {
    console.warn('Fallback new Notification() não suportado neste dispositivo:', notifErr);
    return false;
  }
}
