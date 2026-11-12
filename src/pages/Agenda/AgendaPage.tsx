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
  fetchAllAgendaTasks,
  createAgendaTask,
  updateAgendaTask,
  toggleAgendaTaskCompleted,
  deleteAgendaTask,
} from '../../services/agendaService';
import type {
  AgendaEvent,
  AgendaEventInput,
  AgendaSessionUser,
  AgendaTask,
  AgendaTaskInput,
} from '../../types/agenda';
import {
  registerServiceWorker,
  isPushNotificationSupported,
  subscribeToPushNotifications,
  sendLocalNotification,
  requestNotificationPermission,
  DEFAULT_VAPID_PUBLIC_KEY,
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
import { AgendaChecklist } from './components/AgendaChecklist';
import { AgendaTaskModal } from './components/AgendaTaskModal';

import './AgendaPage.css';

export const AgendaPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AgendaSessionUser | null>(() => getAgendaSession());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Aba ativa na Home: 'calendario' | 'datas' | 'pendencias'
  const [activeTab, setActiveTab] = useState<'calendario' | 'datas' | 'pendencias'>('calendario');

  // Pendências & Checklist
  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AgendaTask | null>(null);
  const [taskDefaultDate, setTaskDefaultDate] = useState<string | undefined>(undefined);

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

  // Carrega pendências
  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const data = await fetchAllAgendaTasks();
      setTasks(data);
    } catch (err) {
      console.error('Erro ao buscar pendências:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
      loadTasks();
    }
  }, [currentUser, loadEvents, loadTasks]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => !t.completed).length;
  }, [tasks]);

  // Mantém referência atualizada dos eventos para o monitor de lembretes
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Checa status de permissão Push e assinatura ativa ao carregar
  useEffect(() => {
    let isMounted = true;
    const checkPushState = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const isGranted = Notification.permission === 'granted';
        if (isMounted) {
          setPushSubscribed(isGranted);
        }
        if (isGranted && 'serviceWorker' in navigator) {
          try {
            const registration = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<ServiceWorkerRegistration | null>((resolve) => setTimeout(() => resolve(null), 2000))
            ]);
            if (registration && isMounted) {
              const sub = await registration.pushManager?.getSubscription();
              setPushSubscribed(!!sub || isGranted);
            }
          } catch {}
        }
      }
    };
    checkPushState();
    return () => {
      isMounted = false;
    };
  }, []);

  // Inicia o monitor de lembretes em background para disparar avisos de compromissos no celular
  useEffect(() => {
    if (
      currentUser &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const stopMonitor = startReminderMonitor(() => eventsRef.current);
      return () => {
        stopMonitor();
      };
    }
  }, [currentUser, pushSubscribed]);

  // Quando a lista de eventos carregar ou atualizar, checa imediatamente lembretes pendentes
  useEffect(() => {
    if (
      events.length > 0 &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      checkPendingReminders(events).catch(() => {});
    }
  }, [events]);

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

      // Garante registro e ativação do Service Worker antes do disparo
      if ('serviceWorker' in navigator) {
        await registerServiceWorker().catch(console.warn);
      }

      // Dispara IMEDIATAMENTE notificação na Central de Notificações do celular (não bloqueia esperando pushManager)
      await sendLocalNotification(
        'Agenda Pastor Ezequias',
        wasAlreadySubscribed
          ? 'Notificações ativas! O alerta de teste foi enviado para o seu celular.'
          : 'Notificações ativadas com sucesso! Você receberá avisos dos seus compromissos no celular.',
        {
          icon: '/agenda-icon-192.png',
          badge: '/badge-icon.png',
          vibrate: [100, 50, 100],
          data: { url: '/?page=agenda' }
        }
      );

      // Checa imediatamente se há lembretes pendentes na agenda para entrega imediata no celular
      if (Array.isArray(eventsRef.current) && eventsRef.current.length > 0) {
        checkPendingReminders(eventsRef.current).catch(() => {});
      }

      // Em paralelo / background: inscreve no PushManager com chave pública VAPID (como no projeto Hellen)
      if (isPushNotificationSupported()) {
        (async () => {
          try {
            const registration = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<ServiceWorkerRegistration | null>((resolve) => setTimeout(() => resolve(null), 4000))
            ]);
            if (registration) {
              const sub = await subscribeToPushNotifications(registration, DEFAULT_VAPID_PUBLIC_KEY);
              if (sub) {
                await savePushSubscription(currentUser?.id, sub);
              }
            }
          } catch (pushErr) {
            console.warn('Inscrição Web Push remota em background não concluída:', pushErr);
          }
        })();
      }
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
      const isEditing = !!editingEvent;
      if (editingEvent) {
        await updateAgendaEvent(editingEvent.id, input);
      } else {
        await createAgendaEvent(input);
      }
      setIsCompromissoModalOpen(false);
      setIsImportantDateModalOpen(false);
      setEditingEvent(null);
      await loadEvents();

      // Dispara confirmação visual na central de notificações se ativo
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const isImportant = input.eventType === 'data_importante';
        const notifTitle = isEditing
          ? (isImportant ? '⭐ Data Importante Atualizada!' : '📅 Compromisso Atualizado!')
          : (isImportant ? '⭐ Nova Data Importante Registrada!' : '📅 Novo Compromisso Agendado!');
        const dateFormatted = input.eventDate.includes('-')
          ? input.eventDate.split('-').reverse().join('/')
          : input.eventDate;
        const timeFormatted = input.eventTime && input.eventTime !== 'Dia Todo' ? ` às ${input.eventTime}` : '';
        const notifBody = `${input.title} (${dateFormatted}${timeFormatted})`;

        sendLocalNotification(notifTitle, notifBody, {
          icon: '/agenda-icon-192.png',
          badge: '/badge-icon.png',
          vibrate: [100, 50, 100],
          data: { url: '/?page=agenda' }
        }).catch(() => {});
      }

      // Checa imediatamente lembretes com os novos eventos cadastrados
      if (Array.isArray(eventsRef.current) && eventsRef.current.length > 0) {
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
      const postponedTitle = postponeEvent.title;
      setPostponeEvent(null);
      await loadEvents();

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const dateFormatted = newDate.includes('-') ? newDate.split('-').reverse().join('/') : newDate;
        const timeFormatted = newTime && newTime !== 'Dia Todo' ? ` às ${newTime}` : '';
        sendLocalNotification(
          '📅 Compromisso Reagendado!',
          `${postponedTitle} (adiado para ${dateFormatted}${timeFormatted})`,
          {
            icon: '/agenda-icon-192.png',
            badge: '/badge-icon.png',
            vibrate: [100, 50, 100],
            data: { url: '/?page=agenda' }
          }
        ).catch(() => {});
      }
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

  // Handlers de Pendências & Checklist
  const handleNewTask = (forDate?: string) => {
    setEditingTask(null);
    setTaskDefaultDate(forDate || selectedDate);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: AgendaTask) => {
    setEditingTask(task);
    setTaskDefaultDate(task.assignedDate || selectedDate);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (input: AgendaTaskInput, editingId?: number) => {
    try {
      if (editingId) {
        await updateAgendaTask(editingId, input);
      } else {
        await createAgendaTask(input);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await loadTasks();

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notifTitle = editingId ? '📋 Pendência Atualizada!' : '📋 Nova Pendência Cadastrada!';
        sendLocalNotification(notifTitle, input.title, {
          icon: '/agenda-icon-192.png',
          badge: '/badge-icon.png',
          vibrate: [80, 40, 80],
          data: { url: '/?page=agenda' }
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao salvar pendência:', err);
      alert('Não foi possível salvar a pendência. Tente novamente.');
    }
  };

  const handleToggleTask = async (task: AgendaTask) => {
    try {
      const newStatus = !task.completed;
      // Atualização otimista imediata
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: newStatus } : t))
      );
      await toggleAgendaTaskCompleted(task.id, newStatus);
      await loadTasks();
    } catch (err) {
      console.error('Erro ao alterar status da pendência:', err);
      await loadTasks();
    }
  };

  const handleDeleteTask = async (task: AgendaTask) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      await deleteAgendaTask(task.id);
      await loadTasks();
    } catch (err) {
      console.error('Erro ao excluir pendência:', err);
      await loadTasks();
    }
  };

  const handleQuickCreateTask = async (title: string) => {
    if (!currentUser) return;
    try {
      const newTask = await createAgendaTask({
        title,
        completed: false,
        priority: 'media',
        createdByName: currentUser.name || 'Equipe',
        createdByUserId: currentUser.id,
      });
      setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
      await loadTasks();
    } catch (err) {
      console.error('Erro ao criar pendência rápida:', err);
      throw err;
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
      {/* Topo: Três Abas equilibradas: Calendário | Datas | Pendências */}
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
          <button
            type="button"
            className={`agenda-nav-tab-btn ${activeTab === 'pendencias' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendencias')}
          >
            <span>Pendências</span>
            {pendingTasksCount > 0 && (
              <span className="agenda-nav-tab-badge">{pendingTasksCount}</span>
            )}
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

          {/* Registros e Compromissos do Dia Selecionado + Pendências do Dia */}
          <main className="agenda-timeline-section">
            {isLoading && events.length === 0 ? (
              <div className="agenda-simple-empty">
                <p>Carregando registros...</p>
              </div>
            ) : (
              <AgendaTimeline
                events={dayEvents}
                selectedDate={selectedDate}
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onNewTaskForDay={(date) => {
                  setSelectedDate(date);
                  handleNewTask(date);
                }}
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
      ) : activeTab === 'datas' ? (
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
      ) : (
        /* Aba de Pendências & Checklist com espaçamento otimizado */
        <main className="agenda-checklist-wrapper">
          <AgendaChecklist
            tasks={tasks}
            events={events}
            isLoading={isLoadingTasks}
            onToggleComplete={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onQuickCreate={handleQuickCreateTask}
            onOpenNewModal={() => handleNewTask()}
          />
        </main>
      )}

      {/* FAB Flutuante com Opções: Sair, Notificações, Pendência, Data Importante, Compromisso */}
      {!isCompromissoModalOpen && !isImportantDateModalOpen && !isTaskModalOpen && !postponeEvent && !confirmDeleteEvent && (
        <AgendaSpeedDial
          onSelectCompromisso={handleNewCompromisso}
          onSelectDataImportante={handleNewDataImportante}
          onSelectPendencia={() => handleNewTask(activeTab === 'calendario' ? selectedDate : undefined)}
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

      {/* Modal 3: Nova / Editar Pendência (Checklist) */}
      {isTaskModalOpen && (
        <AgendaTaskModal
          isOpen={isTaskModalOpen}
          editingTask={editingTask}
          defaultDate={taskDefaultDate}
          currentUser={currentUser}
          events={events}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
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
