import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  getAgendaSession,
  clearAgendaSession,
  fetchAllAgendaEvents,
  createAgendaEvent,
  updateAgendaEvent,
  deleteAgendaEvent,
  postponeAgendaEvent,
  savePushSubscription,
} from '../../services/agendaService';
import type {
  AgendaEvent,
  AgendaEventInput,
  AgendaSessionUser,
} from '../../types/agenda';
import {
  registerServiceWorker,
  isPushNotificationSupported,
  subscribeToPushNotifications,
  sendLocalNotification,
  requestNotificationPermission,
} from '../../utils/pwaService';
import {
  startReminderMonitor,
  checkPendingReminders,
} from '../../services/agendaReminderService';

import { AgendaLogin } from './components/AgendaLogin';
import { InlineMonthCalendar } from './components/InlineMonthCalendar';
import { AgendaTimeline } from './components/AgendaTimeline';
import { AgendaInstallBanner } from './components/AgendaInstallBanner';
import { AgendaModal } from './components/AgendaModal';
import { AgendaImportantDateModal } from './components/AgendaImportantDateModal';
import { AgendaImportantDatesList } from './components/AgendaImportantDatesList';
import { AgendaSpeedDial } from './components/AgendaSpeedDial';
import { AgendaPostponeModal } from './components/AgendaPostponeModal';
import { AgendaConfirmModal } from './components/AgendaConfirmModal';

import './AgendaPage.css';

export const AgendaPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AgendaSessionUser | null>(() => getAgendaSession());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Aba ativa na Home: 'calendario' | 'datas'
  const [activeTab, setActiveTab] = useState<'calendario' | 'datas'>('calendario');

  // Data selecionada (padrão: hoje no formato YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // Modais
  const [isCompromissoModalOpen, setIsCompromissoModalOpen] = useState(false);
  const [isImportantDateModalOpen, setIsImportantDateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [postponeEvent, setPostponeEvent] = useState<AgendaEvent | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<AgendaEvent | null>(null);

  // Carrega eventos
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllAgendaEvents();
      setEvents(data);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser, loadEvents]);

  // Mantém referência atualizada dos eventos para o monitor de lembretes
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Checa status de permissão Push ao carregar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushSubscribed(Notification.permission === 'granted');
    }
  }, []);

  // Inicia o monitor de lembretes em background para disparar avisos de compromissos no celular
  useEffect(() => {
    if (currentUser && pushSubscribed) {
      const stopMonitor = startReminderMonitor(() => eventsRef.current);
      return () => {
        stopMonitor();
      };
    }
  }, [currentUser, pushSubscribed]);

  // Logout
  const handleLogout = () => {
    clearAgendaSession();
    setCurrentUser(null);
  };

  // Solicitar / Testar Notificações na Central do Celular
  const handleRequestPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Seu navegador ou dispositivo atual não suporta notificações web.');
      return;
    }

    // Detecção específica do ecossistema iOS (Safari)
    const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = (typeof window !== 'undefined') && (
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      (window.matchMedia && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches
      ))
    );

    if (isIos && !isStandalone) {
      alert(
        'No iPhone (iOS), para receber avisos e notificações é necessário primeiro adicionar a Agenda à Tela de Início:\n\n' +
        '1. Toque no botão Compartilhar do Safari (quadrado com seta para cima)\n' +
        '2. Escolha "Adicionar à Tela de Início"\n' +
        '3. Abra a Agenda pelo ícone criado na tela inicial e ative as notificações.'
      );
      return;
    }

    try {
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await requestNotificationPermission();
      }

      if (permission !== 'granted') {
        setPushSubscribed(false);
        alert('Para receber avisos, permita as notificações nas configurações do seu navegador ou celular.');
        return;
      }

      // Permissão concedida
      const wasAlreadySubscribed = pushSubscribed;
      setPushSubscribed(true);

      // Garante registro do Service Worker
      let registration: ServiceWorkerRegistration | null = null;
      if ('serviceWorker' in navigator) {
        registration = (await navigator.serviceWorker.getRegistration()) || null;
        if (!registration) {
          registration = await registerServiceWorker();
        }
      }

      // Tenta subscrição Web Push caso disponível
      if (registration && isPushNotificationSupported()) {
        try {
          const sub = await subscribeToPushNotifications(registration);
          if (sub) {
            await savePushSubscription(currentUser?.id, sub);
          }
        } catch (pushErr) {
          console.warn('Inscrição Web Push remota não ativa:', pushErr);
        }
      }

      // Dispara IMEDIATAMENTE notificação na Central de Notificações do celular
      await sendLocalNotification(
        'Agenda Pastor Ezequias',
        wasAlreadySubscribed
          ? 'Notificações ativas! O alerta de teste foi enviado para o seu celular.'
          : 'Notificações ativadas com sucesso! Você receberá avisos dos seus compromissos no celular.',
        {
          tag: 'agenda-confirmation-notification',
          badge: '/badge-icon.png',
          renotify: true,
          data: { url: '/?page=agenda' }
        }
      );
    } catch (err) {
      console.error('Erro ao ativar notificações:', err);
      alert('Não foi possível ativar as notificações no momento.');
    }
  };

  // Abrir modal para novo compromisso ou data importante
  const handleNewCompromisso = () => {
    setEditingEvent(null);
    setIsCompromissoModalOpen(true);
  };

  const handleNewDataImportante = () => {
    setEditingEvent(null);
    setIsImportantDateModalOpen(true);
  };

  // Salvar evento (criar ou editar)
  const handleSaveEvent = async (input: AgendaEventInput) => {
    try {
      if (editingEvent) {
        await updateAgendaEvent(editingEvent.id, input);
      } else {
        await createAgendaEvent(input);
      }
      setIsCompromissoModalOpen(false);
      setIsImportantDateModalOpen(false);
      setEditingEvent(null);
      await loadEvents();

      // Checa imediatamente lembretes com os novos eventos cadastrados
      if (pushSubscribed && Array.isArray(eventsRef.current)) {
        checkPendingReminders(eventsRef.current).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      alert('Não foi possível salvar o registro. Tente novamente.');
    }
  };

  // Adiar compromisso
  const handleConfirmPostpone = async (newDate: string, newTime: string) => {
    if (!postponeEvent) return;
    try {
      await postponeAgendaEvent(postponeEvent.id, newDate, newTime);
      setPostponeEvent(null);
      await loadEvents();
    } catch (err) {
      console.error('Erro ao adiar evento:', err);
    }
  };

  // Excluir compromisso
  const handleConfirmDelete = async () => {
    if (!confirmDeleteEvent) return;
    try {
      await deleteAgendaEvent(confirmDeleteEvent.id);
      setConfirmDeleteEvent(null);
      await loadEvents();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
    }
  };

  // Mapeamento de eventos por data com tipo para exibição das bolinhas coloridas no calendário
  const dayEventsMap = useMemo(() => {
    const map: Record<string, { type: 'compromisso' | 'data_importante' }[]> = {};
    for (const ev of events) {
      if (ev.status !== 'cancelado') {
        if (!map[ev.eventDate]) {
          map[ev.eventDate] = [];
        }
        map[ev.eventDate].push({
          type: ev.eventType === 'data_importante' ? 'data_importante' : 'compromisso',
        });
      }
    }
    return map;
  }, [events]);

  // Todos os eventos do dia selecionado (Compromissos + Datas Importantes)
  const dayEvents = useMemo(() => {
    return events.filter(
      (ev) => ev.eventDate === selectedDate && ev.status !== 'cancelado'
    );
  }, [events, selectedDate]);

  // Se não estiver logado, exibe tela de login
  if (!currentUser) {
    return <AgendaLogin onSuccess={(user: AgendaSessionUser) => setCurrentUser(user)} />;
  }

  return (
    <div className="agenda-pwa-container">
      {/* Topo: Duas Abas com distribuição equilibrada na tela */}
      <header className="agenda-top-calendar-bar">
        <div className="agenda-top-nav-tabs">
          <button
            type="button"
            className={`agenda-nav-tab-btn ${activeTab === 'calendario' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendario')}
          >
            Calendário
          </button>
          <button
            type="button"
            className={`agenda-nav-tab-btn ${activeTab === 'datas' ? 'active' : ''}`}
            onClick={() => setActiveTab('datas')}
          >
            Datas
          </button>
        </div>
      </header>

      {/* Banner de instalação PWA */}
      <AgendaInstallBanner />

      {activeTab === 'calendario' ? (
        <>
          {/* Calendário Mensal Principal */}
          <section className="agenda-main-calendar-box">
            <InlineMonthCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              dayEventsMap={dayEventsMap}
            />
          </section>

          {/* Registros e Compromissos do Dia Selecionado (Estilo Simplista) */}
          <main className="agenda-timeline-section">
            {isLoading && events.length === 0 ? (
              <div className="agenda-simple-empty">
                <p>Carregando registros...</p>
              </div>
            ) : (
              <AgendaTimeline
                events={dayEvents}
                selectedDate={selectedDate}
                onEdit={(ev) => {
                  setEditingEvent(ev);
                  if (ev.eventType === 'data_importante') {
                    setIsImportantDateModalOpen(true);
                  } else {
                    setIsCompromissoModalOpen(true);
                  }
                }}
                onPostpone={(ev) => setPostponeEvent(ev)}
                onDelete={(ev) => setConfirmDeleteEvent(ev)}
              />
            )}
          </main>
        </>
      ) : (
        /* Aba de Datas Importantes */
        <main className="agenda-timeline-section">
          <AgendaImportantDatesList
            events={events}
            isLoading={isLoading}
            onEdit={(ev) => {
              setEditingEvent(ev);
              setIsImportantDateModalOpen(true);
            }}
            onDelete={(ev) => setConfirmDeleteEvent(ev)}
          />
        </main>
      )}

      {/* FAB Flutuante com Opções: Sair, Notificações, Data Importante, Compromisso */}
      {!isCompromissoModalOpen && !isImportantDateModalOpen && !postponeEvent && !confirmDeleteEvent && (
        <AgendaSpeedDial
          onSelectCompromisso={handleNewCompromisso}
          onSelectDataImportante={handleNewDataImportante}
          pushSubscribed={pushSubscribed}
          onTogglePush={handleRequestPush}
          onLogout={handleLogout}
        />
      )}

      {/* Modal 1: Novo / Editar Compromisso (Tela Cheia com passos 1 a 6) */}
      {isCompromissoModalOpen && (
        <AgendaModal
          isOpen={isCompromissoModalOpen}
          editingEvent={editingEvent}
          defaultDate={selectedDate}
          currentUser={currentUser}
          dayEventsMap={dayEventsMap}
          onClose={() => {
            setIsCompromissoModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {/* Modal 2: Nova / Editar Data Importante (Tela Cheia Dourada) */}
      {isImportantDateModalOpen && (
        <AgendaImportantDateModal
          isOpen={isImportantDateModalOpen}
          editingEvent={editingEvent}
          defaultDate={selectedDate}
          currentUser={currentUser}
          dayEventsMap={dayEventsMap}
          onClose={() => {
            setIsImportantDateModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {/* Modal de Adiar Compromisso */}
      {postponeEvent && (
        <AgendaPostponeModal
          isOpen={!!postponeEvent}
          event={postponeEvent}
          onClose={() => setPostponeEvent(null)}
          onPostpone={async (_id, newDate, newTime) => {
            await handleConfirmPostpone(newDate, newTime);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {confirmDeleteEvent && (
        <AgendaConfirmModal
          isOpen={!!confirmDeleteEvent}
          event={confirmDeleteEvent}
          onClose={() => setConfirmDeleteEvent(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default AgendaPage;
