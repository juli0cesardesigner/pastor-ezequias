import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseReminderMinutes,
  getEventTimestamp,
  checkPendingReminders,
} from '../src/services/agendaReminderService.ts';

import {
  subscribeToPushNotifications,
  sendLocalNotification,
  DEFAULT_VAPID_PUBLIC_KEY,
  urlBase64ToUint8Array,
} from '../src/utils/pwaService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper para emular ambiente window / navigator / localStorage
function setupMockEnv({
  hasNotification = true,
  permission = 'granted',
  hasSW = true,
  swReady = true,
  showNotificationFails = false,
} = {}) {
  const store = new Map();
  const postedMessages = [];
  const notificationsShown = [];

  const mockSWRegistration = {
    active: {
      postMessage: (msg) => {
        postedMessages.push(msg);
      },
    },
    showNotification: async (title, options) => {
      if (showNotificationFails) {
        throw new TypeError('Failed to execute showNotification on ServiceWorkerRegistration: No active Service Worker');
      }
      notificationsShown.push({ title, options });
    },
    pushManager: {
      getSubscription: async () => null,
      subscribe: async () => {
        throw new Error('Registration failed - missing applicationServerKey');
      },
    },
  };

  const mockSWContainer = {
    ready: swReady ? Promise.resolve(mockSWRegistration) : new Promise(() => {}),
    getRegistration: async () => mockSWRegistration,
    register: async () => mockSWRegistration,
    controller: {
      postMessage: (msg) => {
        postedMessages.push(msg);
      },
    },
  };

  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };

  globalThis.window = {
    localStorage: globalThis.localStorage,
    atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  };

  if (hasNotification) {
    globalThis.Notification = {
      permission,
      requestPermission: async () => permission,
    };
    globalThis.window.Notification = globalThis.Notification;
  } else {
    delete globalThis.Notification;
    delete globalThis.window.Notification;
  }

  const mockNavigator = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile; rv:120.0) Chrome/120.0 Mobile',
  };
  if (hasSW) {
    mockNavigator.serviceWorker = mockSWContainer;
  }
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true,
  });

  return { store, notificationsShown, postedMessages, mockSWRegistration };
}

test('parseReminderMinutes parses all supported Portuguese reminder labels and recognizes disabled states', () => {
  assert.equal(parseReminderMinutes(''), null);
  assert.equal(parseReminderMinutes(undefined), null);
  assert.equal(parseReminderMinutes('Sem anotação de lembrete'), null);

  // Estados desativados explicitamente retornam -1
  assert.equal(parseReminderMinutes('[Lembrete: Nenhum]'), -1);
  assert.equal(parseReminderMinutes('[Lembrete: Desativado]'), -1);
  assert.equal(parseReminderMinutes('[Lembrete: Sem lembrete]'), -1);

  // Na hora / no dia
  assert.equal(parseReminderMinutes('[Lembrete: Na hora]'), 0);
  assert.equal(parseReminderMinutes('[Lembrete: na hora]'), 0);
  assert.equal(parseReminderMinutes('[Lembrete: no horário]'), 0);
  assert.equal(parseReminderMinutes('[Aviso: no dia]'), 0);
  assert.equal(parseReminderMinutes('[Aviso: no dia do evento]'), 0);

  // Minutos
  assert.equal(parseReminderMinutes('[Lembrete: 5 min antes]'), 5);
  assert.equal(parseReminderMinutes('[Lembrete: 10 min antes]'), 10);
  assert.equal(parseReminderMinutes('[Lembrete: 15 min antes]'), 15);
  assert.equal(parseReminderMinutes('[Lembrete: 30 min antes]'), 30);

  // Horas
  assert.equal(parseReminderMinutes('[Lembrete: 1h antes]'), 60);
  assert.equal(parseReminderMinutes('[Lembrete: 1 hora antes]'), 60);
  assert.equal(parseReminderMinutes('[Lembrete: 2h antes]'), 120);
  assert.equal(parseReminderMinutes('[Lembrete: 2 horas antes]'), 120);

  // Dias e semanas
  assert.equal(parseReminderMinutes('[Lembrete: 1 dia antes]'), 1440);
  assert.equal(parseReminderMinutes('[Lembrete: 2 dias antes]'), 2880);
  assert.equal(parseReminderMinutes('[Lembrete: 1 semana antes]'), 10080);
  assert.equal(parseReminderMinutes('[Lembrete: 2 semanas antes]'), 20160);

  // Suporte a tag [Aviso: ...] (usado em datas importantes)
  assert.equal(parseReminderMinutes('[Aviso: 1 dia antes]'), 1440);
  assert.equal(parseReminderMinutes('Observações gerais\n[Lembrete: 15 min antes]'), 15);
});

test('getEventTimestamp correctly calculates local milliseconds for standard, ISO, and slash dates', () => {
  assert.equal(getEventTimestamp(''), null);
  assert.equal(getEventTimestamp('invalid-date'), null);

  // Formato padrão YYYY-MM-DD
  const tsStandard = getEventTimestamp('2026-11-04', '14:30');
  assert.ok(typeof tsStandard === 'number');
  const d1 = new Date(tsStandard);
  assert.equal(d1.getFullYear(), 2026);
  assert.equal(d1.getMonth(), 10); // 10 = Novembro
  assert.equal(d1.getDate(), 4);
  assert.equal(d1.getHours(), 14);
  assert.equal(d1.getMinutes(), 30);

  // Formato ISO 8601 retornado por PostgreSQL / Neon DB
  const tsIso = getEventTimestamp('2026-11-04T00:00:00.000Z', '14:30');
  assert.ok(typeof tsIso === 'number', 'Must parse ISO strings from Neon database');
  const d2 = new Date(tsIso);
  assert.equal(d2.getFullYear(), 2026);
  assert.equal(d2.getMonth(), 10);
  assert.equal(d2.getDate(), 4);

  // Formatos com barra (YYYY/MM/DD e DD/MM/YYYY)
  const tsSlash1 = getEventTimestamp('2026/11/04', '09:00');
  assert.ok(typeof tsSlash1 === 'number');
  const tsSlash2 = getEventTimestamp('04/11/2026', '09:00');
  assert.ok(typeof tsSlash2 === 'number');

  // Evento "Dia Todo"
  const tsAllDay = getEventTimestamp('2026-11-04', 'Dia Todo');
  assert.ok(typeof tsAllDay === 'number');
  const dAllDay = new Date(tsAllDay);
  assert.equal(dAllDay.getHours(), 9, 'All-day event defaults to 9 AM timestamp');
});

test('checkPendingReminders fires notifications when reminder time is reached and prevents duplicates', async () => {
  const { notificationsShown } = setupMockEnv({ permission: 'granted' });

  // Evento hoje às 14:00 com lembrete 15 min antes (disparo esperado às 13:45)
  const event = {
    id: 101,
    eventDate: '2026-11-04',
    eventTime: '14:00',
    title: 'Reunião de Liderança',
    location: 'Igreja Central',
    notes: '[Lembrete: 15 min antes]',
    eventType: 'compromisso',
    status: 'pendente',
  };

  const eventTimestamp = getEventTimestamp('2026-11-04', '14:00');

  // Caso 1: 30 minutos antes (ainda não chegou o momento do lembrete)
  const tooEarlyMs = eventTimestamp - (30 * 60 * 1000);
  let count = await checkPendingReminders([event], tooEarlyMs);
  assert.equal(count, 0, 'Must not fire before the reminder time');
  assert.equal(notificationsShown.length, 0);

  // Caso 2: Exatamente 15 minutos antes (horário do lembrete)
  const reminderTimeMs = eventTimestamp - (15 * 60 * 1000);
  count = await checkPendingReminders([event], reminderTimeMs);
  assert.equal(count, 1, 'Must fire notification at reminder time');
  assert.equal(notificationsShown.length, 1);
  assert.ok(notificationsShown[0].title.includes('Reunião de Liderança'));
  assert.equal(notificationsShown[0].options.tag, 'agenda-event-101');
  assert.equal(notificationsShown[0].options.renotify, true);
  assert.equal(notificationsShown[0].options.icon, '/agenda-icon-192.png');
  assert.equal(notificationsShown[0].options.badge, '/badge-icon.png');

  // Caso 3: Execução subsequente (mesmo evento já disparado)
  count = await checkPendingReminders([event], reminderTimeMs + 5000);
  assert.equal(count, 0, 'Must not fire duplicate notification for same event');
  assert.equal(notificationsShown.length, 1);

  // Caso 4: Evento cancelado não deve disparar
  const cancelledEvent = {
    id: 102,
    eventDate: '2026-11-04',
    eventTime: '14:00',
    title: 'Evento Cancelado',
    notes: '[Lembrete: 15 min antes]',
    eventType: 'compromisso',
    status: 'cancelado',
  };
  count = await checkPendingReminders([cancelledEvent], reminderTimeMs);
  assert.equal(count, 0, 'Cancelled event must be ignored');
});

test('checkPendingReminders correctly handles database ISO dates, all-day events at 10 AM, and phone wake-up delays', async () => {
  const { notificationsShown } = setupMockEnv({ permission: 'granted' });

  // 1. Data Importante de Dia Todo (ex: Aniversário) às 10:00 da manhã
  const allDayEvent = {
    id: 201,
    eventDate: '2026-11-04',
    eventTime: 'Dia Todo',
    title: 'Aniversário Pastor Ezequias',
    notes: '[Aviso: Na hora]',
    eventType: 'data_importante',
    status: 'confirmado',
  };
  const at10am = new Date(2026, 10, 4, 10, 0).getTime();
  let count = await checkPendingReminders([allDayEvent], at10am);
  assert.equal(count, 1, 'Must notify all-day important date even if phone is checked at 10 AM');
  assert.equal(notificationsShown.length, 1);
  assert.ok(notificationsShown[0].title.includes('Data Importante'));

  // 2. Data em formato ISO com compromisso às 15:00, verificado 20 minutos após início
  const isoEvent = {
    id: 202,
    eventDate: '2026-11-04T00:00:00.000Z',
    eventTime: '15:00',
    title: 'Reunião com Diretoria',
    notes: '[Lembrete: 15 min antes]',
    eventType: 'compromisso',
    status: 'pendente',
  };
  const at1520 = new Date(2026, 10, 4, 15, 20).getTime();
  count = await checkPendingReminders([isoEvent], at1520);
  assert.equal(count, 1, 'Must deliver pending notification when phone wakes up 20 min into event');
  assert.equal(notificationsShown.length, 2);

  // 3. Evento com lembrete explicitamente desativado não deve disparar
  const disabledEvent = {
    id: 203,
    eventDate: '2026-11-04',
    eventTime: '15:00',
    title: 'Evento sem lembrete',
    notes: '[Lembrete: Nenhum]',
    eventType: 'compromisso',
    status: 'pendente',
  };
  count = await checkPendingReminders([disabledEvent], at1520);
  assert.equal(count, 0, 'Explicitly disabled reminder must not fire');
});

test('sendLocalNotification handles permissions, service worker dispatch and postMessage fallback', async () => {
  // Cenário 1: Notificação negada
  setupMockEnv({ permission: 'denied' });
  let result = await sendLocalNotification('Teste', 'Corpo');
  assert.equal(result, false, 'Must return false when permission is denied');

  // Cenário 2: Notificação permitida com ServiceWorker direto e opções limpas mobile
  const { notificationsShown } = setupMockEnv({ permission: 'granted' });
  result = await sendLocalNotification('Agenda Pastor Ezequias', 'Notificação de teste');
  assert.equal(result, true, 'Must return true when notification was dispatched');
  assert.equal(notificationsShown.length, 1);
  assert.equal(notificationsShown[0].title, 'Agenda Pastor Ezequias');
  assert.equal(notificationsShown[0].options.icon, '/agenda-icon-192.png');
  assert.equal(notificationsShown[0].options.badge, '/badge-icon.png');
  assert.deepEqual(notificationsShown[0].options.vibrate, [100, 50, 100]);

  // Cenário 3: Falha no showNotification direto recupera via postMessage para o Service Worker
  const { postedMessages } = setupMockEnv({ permission: 'granted', showNotificationFails: true });
  result = await sendLocalNotification('Agenda Pastor Ezequias', 'Alerta recuperado');
  assert.equal(result, true, 'Must succeed by falling back to Service Worker postMessage');
  assert.equal(postedMessages.length, 1);
  assert.equal(postedMessages[0].type, 'SHOW_NOTIFICATION');
  assert.equal(postedMessages[0].title, 'Agenda Pastor Ezequias');
});

test('subscribeToPushNotifications without VAPID key gracefully returns null without crashing', async () => {
  const { mockSWRegistration } = setupMockEnv({ permission: 'granted' });
  globalThis.window.PushManager = {};

  const sub = await subscribeToPushNotifications(mockSWRegistration, '');
  assert.equal(sub, null, 'Must return null cleanly when empty vapidPublicKey is provided');
});

test('DEFAULT_VAPID_PUBLIC_KEY is configured and urlBase64ToUint8Array properly decodes 65 bytes', () => {
  assert.ok(DEFAULT_VAPID_PUBLIC_KEY, 'DEFAULT_VAPID_PUBLIC_KEY must be defined');
  const uint8 = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
  assert.equal(uint8.length, 65, 'Uncompressed P-256 public key must be 65 bytes');
});

test('Service Worker: sw.js includes SHOW_NOTIFICATION message listener, cache v4, and PNG icons', () => {
  const swPath = path.join(rootDir, 'public', 'sw.js');
  const content = fs.readFileSync(swPath, 'utf-8');

  assert.ok(
    content.includes("ezequias-agenda-cache-v4"),
    'sw.js must be configured with cache v4'
  );
  assert.ok(
    content.includes("event.data.type === 'SHOW_NOTIFICATION'"),
    'sw.js must handle SHOW_NOTIFICATION message'
  );
  assert.ok(
    content.includes("icon: '/agenda-icon-192.png'") || content.includes('data.icon'),
    'sw.js must use /agenda-icon-192.png'
  );
  assert.ok(
    content.includes("badge: '/badge-icon.png'") || content.includes('data.badge'),
    'sw.js must use /badge-icon.png as monochrome status bar badge'
  );
  assert.ok(
    content.includes("new URL(rawUrl, self.location.origin).href"),
    'sw.js notificationclick must resolve absolute URL'
  );
});

test('Physical badge asset public/badge-icon.png exists and is a valid PNG', () => {
  const badgePath = path.join(rootDir, 'public', 'badge-icon.png');
  assert.ok(fs.existsSync(badgePath), 'public/badge-icon.png must physically exist');
  const buf = fs.readFileSync(badgePath);
  assert.ok(buf.length > 50, 'Badge icon must have content');
  assert.equal(buf[0], 0x89);
  assert.equal(buf[1], 0x50); // P
  assert.equal(buf[2], 0x4e); // N
  assert.equal(buf[3], 0x47); // G
});

test('sendLocalNotification resolves absolute URLs when window.location.origin is defined', async () => {
  const { notificationsShown } = setupMockEnv({ permission: 'granted' });
  globalThis.window.location = { origin: 'https://pastor-ezequias.com' };

  const success = await sendLocalNotification('Teste Origem', 'Corpo teste');
  assert.equal(success, true);
  assert.equal(notificationsShown.length, 1);
  assert.equal(notificationsShown[0].options.icon, 'https://pastor-ezequias.com/agenda-icon-192.png');
  assert.equal(notificationsShown[0].options.badge, 'https://pastor-ezequias.com/badge-icon.png');
});

test('sendLocalNotification omits actions when empty to avoid Android mobile failures, but preserves valid actions', async () => {
  const { notificationsShown } = setupMockEnv({ permission: 'granted' });

  // 1. Sem actions ou actions vazio: propriedade actions não deve estar em options
  await sendLocalNotification('Alerta 1', 'Sem actions', { actions: [] });
  assert.equal(notificationsShown.length, 1);
  assert.equal(notificationsShown[0].options.actions, undefined, 'Empty actions array must be removed');

  // 2. Com action válida: preserva
  const customActions = [{ action: 'open', title: 'Ver Detalhes' }];
  await sendLocalNotification('Alerta 2', 'Com action', { actions: customActions });
  assert.equal(notificationsShown.length, 2);
  assert.deepEqual(notificationsShown[1].options.actions, customActions, 'Valid actions must be preserved');
});

test('sendLocalNotification recovers cleanly when navigator.serviceWorker.ready is pending', async () => {
  // ready nunca resolve, simulando Service Worker em processo lento de ativação
  const { notificationsShown } = setupMockEnv({ permission: 'granted', swReady: false });
  const result = await sendLocalNotification('Alerta SW Lento', 'Deve resolver via getRegistration fallback');
  assert.equal(result, true, 'Must successfully display notification via getRegistration fallback');
  assert.equal(notificationsShown.length, 1);
});

