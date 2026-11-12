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
 * Chave pública VAPID padrão para Push Notifications da Agenda (P-256 base64url)
 */
export const DEFAULT_VAPID_PUBLIC_KEY =
  'BILDjcmPOttZLxkvujQOYPoEYEEO1Z_GCKrIMM7wBGEKxTHr_LjE1fp6EPStD7ikkbXMNJYZJcrgM9lFymhaPwk';

/**
 * Converte base64 VAPID key para Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
 * Solicita permissão e inscreve o usuário para Push Notifications no PushManager
 * Compatível com o padrão do projeto Hellen (VAPID key + PushManager.subscribe)
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string = DEFAULT_VAPID_PUBLIC_KEY
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }

    if (registration.pushManager) {
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // No Chrome/Android, pushManager.subscribe exige applicationServerKey (VAPID).
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
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Dispara notificação com garantia de exibição na Central de Notificações de celulares
 * (Android Chrome, PWA standalone, Edge, Safari Desktop, iOS PWA adicionado à tela inicial).
 * Utiliza o padrão consagrado do projeto Hellen:
 * - navigator.serviceWorker.ready direto
 * - Opções limpas de notificação (sem tags conflitantes ou flags que silenciam no Android)
 * - Fallback via postMessage para o Service Worker
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  customOptions?: LocalNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // Verifica permissão. Se não estiver concedida, não tenta disparar
  if (Notification.permission !== 'granted') {
    return false;
  }

  // Opções padronizadas para compatibilidade mobile (espelhado do projeto Hellen):
  // - Ícone PNG de 192px (leve e compatível com área de notificação do Android)
  // - Badge PNG transparente monocromático (específico para a barra de status do Android)
  // - Vibração clássica [100, 50, 100]
  // - Data com URL de redirecionamento para a Agenda
  // - Sem tag genérica obrigatória para evitar que o Android silencie ou mescle alertas novos
  // Helper seguro para normalização de URLs absolutas para Android NotificationManager
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const toAbsoluteUrl = (path?: string, defaultPath: string = ''): string => {
    const p = (path || defaultPath).trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    if (!origin) return p.startsWith('/') ? p : `/${p}`;
    const cleanPath = p.startsWith('/') ? p : `/${p}`;
    return `${origin}${cleanPath}`;
  };

  const finalOptions: Record<string, unknown> = {
    body,
    icon: toAbsoluteUrl(customOptions?.icon, '/agenda-icon-192.png'),
    badge: toAbsoluteUrl(customOptions?.badge, '/badge-icon.png'),
    vibrate: customOptions?.vibrate || [100, 50, 100],
    data: customOptions?.data || { url: '/?page=agenda' }
  };

  if (Array.isArray(customOptions?.actions) && customOptions.actions.length > 0) {
    finalOptions.actions = customOptions.actions;
  }

  if (customOptions?.tag) {
    finalOptions.tag = customOptions.tag;
    if (customOptions.renotify) {
      finalOptions.renotify = true;
    }
  }

  if (customOptions?.requireInteraction) {
    finalOptions.requireInteraction = true;
  }

  if (customOptions?.silent) {
    finalOptions.silent = true;
  }

  // 1. Prioridade móvel: ServiceWorkerRegistration.showNotification()
  // No Android Chrome, 'new Notification()' lança TypeError. O método showNotification do Service Worker
  // ativo é a ÚNICA forma de postar notificações na Central de Notificações do sistema operacional.
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      // Tenta obter registration existente (rápido, sem bloquear)
      let registration: ServiceWorkerRegistration | null = null;
      try {
        registration = (await navigator.serviceWorker.getRegistration()) || null;
      } catch {}

      // Se ainda não estiver registrado, registra /sw.js
      if (!registration) {
        try {
          registration = (await registerServiceWorker()) || null;
        } catch {}
      }

      // Se não há worker ativo na registration, aguarda navigator.serviceWorker.ready
      if (!registration?.active) {
        let timer: any = null;
        try {
          const readyReg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration | null>((resolve) => {
              timer = setTimeout(() => resolve(null), 2500);
              if (timer && typeof timer === 'object' && typeof timer.unref === 'function') {
                timer.unref();
              }
            })
          ]);
          if (readyReg) {
            registration = readyReg;
          }
        } catch {} finally {
          if (timer) clearTimeout(timer);
        }
      }

      // Se o Service Worker ainda estiver em transição (installing/waiting), aguarda ativação
      if (registration && !registration.active && (registration.installing || registration.waiting)) {
        const worker = registration.installing || registration.waiting;
        if (worker) {
          await new Promise<void>((resolve) => {
            let stateTimer: any = null;
            const onState = () => {
              if (worker.state === 'activated' || worker.state === 'redundant') {
                worker.removeEventListener('statechange', onState);
                if (stateTimer) clearTimeout(stateTimer);
                resolve();
              }
            };
            worker.addEventListener('statechange', onState);
            stateTimer = setTimeout(() => {
              worker.removeEventListener('statechange', onState);
              resolve();
            }, 1500);
          });
        }
      }

      // Chamada direta a registration.showNotification no Service Worker ativo
      if (registration && typeof registration.showNotification === 'function') {
        try {
          await registration.showNotification(title, finalOptions);
          return true;
        } catch (showErr) {
          console.warn('Falha direta em registration.showNotification, tentando postMessage:', showErr);
        }
      }

      // Se a chamada direta falhou, envia postMessage ao SW (evento SHOW_NOTIFICATION)
      const targetWorker =
        registration?.active ||
        navigator.serviceWorker.controller ||
        registration?.waiting ||
        registration?.installing;
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
    console.warn('Fallback new Notification() não suportado neste dispositivo (ex: Android Chrome exige Service Worker ativo):', notifErr);
    return false;
  }
}
