import type { AgendaEvent } from '../types/agenda.ts';
import { sendLocalNotification } from '../utils/pwaService.ts';

export const NOTIFIED_STORAGE_KEY = 'agenda_notified_reminders_v1';

/**
 * Converte rótulo de lembrete em minutos de antecedência.
 * Exemplos aceitos:
 *  - 'Na hora' -> 0
 *  - '5 min antes' -> 5
 *  - '10 min antes' -> 10
 *  - '15 min antes' -> 15
 *  - '30 min antes' -> 30
 *  - '1h antes' / '1 hora antes' -> 60
 *  - '2h antes' / '2 horas antes' -> 120
 *  - '1 dia antes' -> 1440
 *  - '2 dias antes' -> 2880
 *  - '1 semana antes' -> 10080
 *  - '2 semanas antes' -> 20160
 */
export function parseReminderMinutes(notes?: string): number | null {
  if (!notes) return null;

  const match = notes.match(/\[(?:Lembrete|Aviso):\s*(.*?)\]/i);
  if (!match || !match[1]) return null;

  const raw = match[1].trim().toLowerCase();

  // Desativação explícita
  if (raw === 'nenhum' || raw === 'desativado' || raw === 'sem lembrete' || raw === 'desligado') {
    return -1;
  }

  if (
    raw === 'na hora' ||
    raw === 'no horario' ||
    raw === 'no horário' ||
    raw === 'no dia' ||
    raw === 'no dia do evento'
  ) {
    return 0;
  }

  const minMatch = raw.match(/^(\d+)\s*(?:min|minuto|minutos)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  const hourMatch = raw.match(/^(\d+)\s*h(?:ora|oras)?/);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60;
  }

  const dayMatch = raw.match(/^(\d+)\s*dia(?:s)?/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10) * 1440;
  }

  const weekMatch = raw.match(/^(\d+)\s*semana(?:s)?/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 10080;
  }

  return null;
}

/**
 * Retorna os IDs/chaves de lembretes já disparados armazenados no localStorage
 */
export function getNotifiedCache(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Salva cache de lembretes disparados e limpa entradas com mais de 7 dias
 */
export function saveNotifiedCache(cache: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const cleaned: Record<string, number> = {};
    for (const [key, timestamp] of Object.entries(cache)) {
      if (now - timestamp < sevenDaysMs) {
        cleaned[key] = timestamp;
      }
    }
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Falha silenciosa caso o armazenamento esteja bloqueado
  }
}

/**
 * Converte data e hora de um evento em timestamp local (milissegundos).
 * Suporta formatos:
 *  - YYYY-MM-DD
 *  - ISO 8601 (ex: 2026-11-04T00:00:00.000Z)
 *  - YYYY/MM/DD
 *  - DD/MM/YYYY
 */
export function getEventTimestamp(eventDate: string, eventTime?: string): number | null {
  if (!eventDate || typeof eventDate !== 'string') return null;

  // Extrai apenas a porção da data antes do 'T' (ex: 2026-11-04T00:00:00.000Z -> 2026-11-04)
  const cleanDate = eventDate.trim().split('T')[0];

  let year: number;
  let month: number;
  let day: number;

  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    year = parts[0];
    month = parts[1] - 1;
    day = parts[2];
  } else if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    if (parts[0] > 1000) {
      // YYYY/MM/DD
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    } else {
      // DD/MM/YYYY
      day = parts[0];
      month = parts[1] - 1;
      year = parts[2];
    }
  } else {
    return null;
  }

  let hours = 9;
  let minutes = 0;
  if (eventTime && typeof eventTime === 'string' && eventTime.includes(':')) {
    const timeParts = eventTime.trim().split(':').map(Number);
    if (!isNaN(timeParts[0])) hours = timeParts[0];
    if (!isNaN(timeParts[1])) minutes = timeParts[1];
  }

  const dateObj = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(dateObj.getTime()) ? null : dateObj.getTime();
}

/**
 * Verifica eventos pendentes e dispara notificações para aqueles cujo horário de aviso chegou.
 */
export async function checkPendingReminders(
  events: AgendaEvent[],
  nowMs = Date.now()
): Promise<number> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 0;
  }

  if (Notification.permission !== 'granted') {
    return 0;
  }

  const notifiedCache = getNotifiedCache();
  let dispatchedCount = 0;

  for (const event of events) {
    // Ignora eventos cancelados ou concluídos
    if (event.status === 'cancelado' || event.status === 'concluido') {
      continue;
    }

    const eventTimeMs = getEventTimestamp(event.eventDate, event.eventTime);
    if (!eventTimeMs) continue;

    // Se o evento tem lembrete explícito nas anotações, usa-o.
    // Se foi desativado explicitamente (-1), pula.
    // Se não tiver anotação, para compromissos com horário definido, adota 15 minutos antes por padrão.
    const parsedMinutes = parseReminderMinutes(event.notes);
    if (parsedMinutes === -1) {
      continue;
    }
    const reminderMinutes = parsedMinutes !== null ? parsedMinutes : (event.eventType === 'compromisso' ? 15 : null);

    if (reminderMinutes === null) {
      continue;
    }

    const reminderTargetMs = eventTimeMs - (reminderMinutes * 60 * 1000);
    const windowStart = reminderTargetMs - (60 * 1000); // 1 minuto de tolerância prévia

    // Janela de término de entrega no celular:
    // - Para datas importantes / eventos de "Dia Todo": válido durante todo o dia (até 23:59:59)
    // - Para compromissos com horário: válido até 2 horas após o início (garante entrega caso o celular estivesse bloqueado/sleep)
    let windowEnd: number;
    if (event.eventType === 'data_importante' || event.eventTime === 'Dia Todo') {
      const d = new Date(eventTimeMs);
      windowEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
    } else {
      windowEnd = eventTimeMs + (2 * 60 * 60 * 1000);
    }

    if (nowMs >= windowStart && nowMs <= windowEnd) {
      const cacheKey = `${event.id}_${event.eventDate}_${event.eventTime || '00:00'}_${reminderMinutes}`;
      if (notifiedCache[cacheKey]) {
        continue;
      }

      // Monta título e corpo da notificação
      let notifTitle = '';
      if (event.eventType === 'data_importante') {
        notifTitle = `⭐ Data Importante: ${event.title}`;
      } else if (reminderMinutes === 0) {
        notifTitle = `🔔 Compromisso agora: ${event.title}`;
      } else if (reminderMinutes >= 1440) {
        const days = Math.round(reminderMinutes / 1440);
        notifTitle = `📅 Compromisso em ${days} dia${days > 1 ? 's' : ''}: ${event.title}`;
      } else if (reminderMinutes >= 60) {
        const hours = Math.round(reminderMinutes / 60);
        notifTitle = `⏰ Compromisso em ${hours}h: ${event.title}`;
      } else {
        notifTitle = `⏰ Compromisso em ${reminderMinutes} min: ${event.title}`;
      }

      const timeText = event.eventTime ? `às ${event.eventTime}` : '';
      const locationText = event.location ? ` | Local: ${event.location}` : '';
      const notifBody = `${event.title} ${timeText}${locationText}`.trim();

      const success = await sendLocalNotification(notifTitle, notifBody, {
        tag: `agenda-event-${event.id}`,
        icon: '/agenda-icon-192.png',
        badge: '/badge-icon.png',
        vibrate: [100, 50, 100],
        renotify: true,
        data: {
          url: '/?page=agenda',
          eventId: event.id
        }
      });

      if (success) {
        notifiedCache[cacheKey] = nowMs;
        dispatchedCount++;
      }
    }
  }

  if (dispatchedCount > 0) {
    saveNotifiedCache(notifiedCache);
  }

  return dispatchedCount;
}

/**
 * Inicia o monitor de lembretes da agenda.
 * Checa a cada 30 segundos, ao focar na janela, ao retornar do background ou reconectar rede.
 */
export function startReminderMonitor(getEvents: () => AgendaEvent[]): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const runCheck = () => {
    try {
      const events = getEvents();
      if (Array.isArray(events) && events.length > 0) {
        checkPendingReminders(events).catch((err) => {
          console.warn('Erro ao checar lembretes pendentes da agenda:', err);
        });
      }
    } catch (e) {
      console.warn('Falha na execução do monitor de lembretes:', e);
    }
  };

  // Executa imediatamente
  runCheck();

  // Executa a cada 30 segundos
  const intervalId = window.setInterval(runCheck, 30000);

  // Executa ao voltar para a aba ou desbloquear celular
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runCheck();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', runCheck);
  window.addEventListener('pageshow', runCheck);
  window.addEventListener('online', runCheck);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', runCheck);
    window.removeEventListener('pageshow', runCheck);
    window.removeEventListener('online', runCheck);
  };
}
