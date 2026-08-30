import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  CalendarClock,
  X,
} from 'lucide-react';
import {
  getAgendaSession,
  fetchAllAgendaEvents,
  createAgendaEvent,
  updateAgendaEvent,
  deleteAgendaEvent,
  postponeAgendaEvent,
  getLocalAgendaEventsCache,
} from '../../services/agendaService';
import type {
  AgendaEvent,
  AgendaEventInput,
  AgendaSessionUser,
  AgendaPriority,
  AgendaStatus,
  AgendaEventType,
} from '../../types/agenda';
import { AgendaLogin } from './components/AgendaLogin';
import { AgendaModal } from './components/AgendaModal';
import { AgendaPostponeModal } from './components/AgendaPostponeModal';
import { CustomDropdown } from './components/CustomDropdown';
import './AgendaPage.css';

const priorityFilterOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'urgente', label: 'Urgentes', colorDot: '#ef4444' },
  { value: 'alta', label: 'Alta Prioridade', colorDot: '#f59e0b' },
  { value: 'media', label: 'Média Prioridade', colorDot: '#3b82f6' },
  { value: 'baixa', label: 'Baixa Prioridade', colorDot: '#10b981' },
];

const statusFilterOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes', colorDot: '#f59e0b' },
  { value: 'confirmado', label: 'Confirmados', colorDot: '#10b981' },
  { value: 'em_andamento', label: 'Em Andamento', colorDot: '#8b5cf6' },
  { value: 'concluido', label: 'Concluídos', colorDot: '#64748b' },
  { value: 'cancelado', label: 'Cancelados', colorDot: '#ef4444' },
];

// Utilitários de data
function formatToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDateHeader(ymd: string): { label: string; sub: string; isToday: boolean; isTomorrow: boolean } {
  const todayYMD = formatToYMD(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowYMD = formatToYMD(tomorrow);

  const target = parseYMD(ymd);
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const weekday = weekdays[target.getDay()];
  const day = target.getDate();
  const month = months[target.getMonth()];

  const isToday = ymd === todayYMD;
  const isTomorrow = ymd === tomorrowYMD;

  let label = `${weekday}, ${day} de ${month}`;
  if (isToday) label = `Hoje • ${weekday}, ${day} de ${month}`;
  if (isTomorrow) label = `Amanhã • ${weekday}, ${day} de ${month}`;

  return { label, sub: `${day.toString().padStart(2, '0')}/${(target.getMonth() + 1).toString().padStart(2, '0')}`, isToday, isTomorrow };
}

export const AgendaPage: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<AgendaSessionUser | null>(getAgendaSession);
  const [events, setEvents] = useState<AgendaEvent[]>(getLocalAgendaEventsCache);

  // Data selecionada no calendário do topo
  const [selectedDate, setSelectedDate] = useState<string>(() => formatToYMD(new Date()));
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => new Date());
  const [viewTab, setViewTab] = useState<'dia_selecionado' | 'todos_eventos'>('dia_selecionado');

  // Filtros
  const [priorityFilter, setPriorityFilter] = useState<AgendaPriority | 'todas'>('todas');
  const [statusFilter, setStatusFilter] = useState<AgendaStatus | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [modalDefaultEventType, setModalDefaultEventType] = useState<AgendaEventType>('compromisso');

  // Menu FAB
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  // Modal de Adiar Compromisso
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [postponingEvent, setPostponingEvent] = useState<AgendaEvent | null>(null);

  const openPostponeModal = (event: AgendaEvent) => {
    setPostponingEvent(event);
    setIsPostponeModalOpen(true);
  };

  const handlePostponeEvent = async (
    eventId: number,
    newDate: string,
    newTime: string,
    reason?: string
  ) => {
    await postponeAgendaEvent(
      eventId,
      newDate,
      newTime,
      reason,
      sessionUser?.name || 'Equipe'
    );
    await loadEvents();
  };

  // Carregar eventos da nuvem
  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchAllAgendaEvents();
      setEvents(data);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    }
  }, []);

  useEffect(() => {
    if (sessionUser) {
      loadEvents();
    }
  }, [sessionUser, loadEvents]);

  // Salvar compromisso (novo ou edição)
  const handleSaveEvent = async (input: AgendaEventInput, editingId?: number) => {
    if (editingId) {
      await updateAgendaEvent(editingId, input);
    } else {
      await createAgendaEvent(input);
    }
    await loadEvents();
  };

  // Excluir compromisso
  const handleDeleteEvent = async (id: number, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      try {
        await deleteAgendaEvent(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        console.error('Erro ao excluir evento:', err);
      }
    }
  };

  // Datas que possuem compromissos (para badges no calendário)
  const datesWithEvents = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((ev) => {
      map.set(ev.eventDate, (map.get(ev.eventDate) || 0) + 1);
    });
    return map;
  }, [events]);

  // Datas com marcas de Data Importante
  const datesWithImportantDates = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev) => {
      if (ev.eventType === 'data_importante') {
        set.add(ev.eventDate);
      }
    });
    return set;
  }, [events]);

  // Filtro dos eventos para o Feed
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Filtro de prioridade
      if (priorityFilter !== 'todas' && e.priority !== priorityFilter) return false;
      // Filtro de status
      if (statusFilter !== 'todos' && e.status !== statusFilter) return false;
      // Busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesLocation = e.location.toLowerCase().includes(query);
        const matchesNotes = e.notes.toLowerCase().includes(query);
        const matchesAuthor = e.createdByName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesNotes && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [events, priorityFilter, statusFilter, searchTerm]);

  // Agrupamento por dia para o Feed Cronológico
  const groupedEvents = useMemo(() => {
    const groups: { [dateStr: string]: AgendaEvent[] } = {};
    filteredEvents.forEach((ev) => {
      if (!groups[ev.eventDate]) {
        groups[ev.eventDate] = [];
      }
      groups[ev.eventDate].push(ev);
    });

    // Ordenar datas
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedDates.map((dateStr) => ({
      dateStr,
      events: groups[dateStr].sort((a, b) => a.eventTime.localeCompare(b.eventTime)),
    }));
  }, [filteredEvents]);

  // Grupos a serem exibidos (Dia Selecionado vs Todos os Eventos)
  const displayedGroups = useMemo(() => {
    if (viewTab === 'dia_selecionado') {
      return groupedEvents.filter((g) => g.dateStr === selectedDate);
    }
    return groupedEvents;
  }, [groupedEvents, viewTab, selectedDate]);

  // Rolar suavemente para a data selecionada no feed
  const scrollToDate = (dateYMD: string) => {
    setSelectedDate(dateYMD);
    if (viewTab === 'todos_eventos') {
      setTimeout(() => {
        const element = document.getElementById(`agenda-group-${dateYMD}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  // Se não estiver logado, exibe tela de login da equipe
  if (!sessionUser) {
    return (
      <div className="agenda-page-container">
        <AgendaLogin onSuccess={(user) => setSessionUser(user)} />
      </div>
    );
  }

  // Renderização do Mini-Calendário no Topo Fixo
  const renderMiniCalendar = () => {
    const year = calendarViewMonth.getFullYear();
    const month = calendarViewMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const prevMonth = () => setCalendarViewMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCalendarViewMonth(new Date(year, month + 1, 1));

    const todayYMD = formatToYMD(new Date());

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateYMD = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dateYMD === selectedDate;
      const isToday = dateYMD === todayYMD;
      const eventCount = datesWithEvents.get(dateYMD) || 0;
      const isImportant = datesWithImportantDates.has(dateYMD);

      days.push(
        <button
          key={`day-${d}`}
          type="button"
          className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${eventCount > 0 ? 'has-events' : ''} ${isImportant ? 'has-important' : ''}`}
          onClick={() => scrollToDate(dateYMD)}
          title={`${d} de ${monthNames[month]}${isImportant ? ' (Data Importante)' : ''} (${eventCount} registro(s))`}
        >
          <span className="day-number">{d}</span>
          {isImportant ? (
            <span className="day-star-indicator">★</span>
          ) : eventCount > 0 ? (
            <span className="day-dot-indicator" />
          ) : null}
        </button>
      );
    }

    return (
      <div className="mini-calendar-wrapper">
        <div className="mini-calendar-nav">
          <div className="cal-nav-left-spacer" />
          <div className="cal-nav-center-selector">
            <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Mês anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="cal-month-title">
              {monthNames[month]} {year}
            </span>
            <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Próximo mês">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="cal-nav-right-actions">
            <button
              type="button"
              className="cal-today-btn"
              onClick={() => {
                const now = new Date();
                setCalendarViewMonth(now);
                scrollToDate(formatToYMD(now));
              }}
            >
              Hoje
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          <span>D</span>
          <span>S</span>
          <span>T</span>
          <span>Q</span>
          <span>Q</span>
          <span>S</span>
          <span>S</span>
        </div>

        <div className="calendar-days-grid">{days}</div>
      </div>
    );
  };

  const openNewEventModal = (type: AgendaEventType = 'compromisso') => {
    setEditingEvent(null);
    setModalDefaultEventType(type);
    setIsModalOpen(true);
    setIsFabMenuOpen(false);
  };

  const openEditEventModal = (event: AgendaEvent) => {
    setEditingEvent(event);
    setModalDefaultEventType(event.eventType || 'compromisso');
    setIsModalOpen(true);
  };

  return (
    <div className="agenda-page-container">
      {/* 1. Header do Painel da Agenda */}
      <header className="agenda-main-header">
        <h1 className="agenda-header-title">Agenda - Pastor Ezequias</h1>
      </header>

      {/* 2. Topo Fixo com Calendário e Filtros */}
      {/* 2. Topo com Busca, Filtros e Calendário */}
      <section className="agenda-sticky-top" aria-label="Navegação e Filtros">
        <div className="agenda-sticky-grid">
          {/* Busca e Filtros Rápidos (ACIMA DO CALENDÁRIO) */}
          <div className="agenda-controls-panel">
            <div className="agenda-filters-bar">
              <div className="agenda-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Buscar compromisso, data importante, local, pauta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" className="btn-clear-search" onClick={() => setSearchTerm('')}>
                    ×
                  </button>
                )}
              </div>

              <div className="agenda-filter-selectors">
                <CustomDropdown
                  value={priorityFilter}
                  onChange={(val) => setPriorityFilter(val as any)}
                  options={priorityFilterOptions}
                  icon={<Filter size={13} />}
                  labelPrefix="Prioridade"
                />

                <CustomDropdown
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val as any)}
                  options={statusFilterOptions}
                  icon={<CheckCircle2 size={13} />}
                  labelPrefix="Status"
                />
              </div>
            </div>
          </div>

          {/* Calendário (SEM BOX, PREENCHE TODA A TELA) */}
          <div className="agenda-calendar-panel">
            {renderMiniCalendar()}
          </div>
        </div>
      </section>

      {/* 3. Feed Cronológico Contínuo de Compromissos */}
      <main className="agenda-feed-container">
        {/* Abas de Alternância de Visualização */}
        <div className="agenda-view-tabs-container">
          <button
            type="button"
            className={`agenda-view-tab-btn ${viewTab === 'dia_selecionado' ? 'active' : ''}`}
            onClick={() => setViewTab('dia_selecionado')}
          >
            <CalendarIcon size={14} />
            <span>Eventos do Dia ({formatDateHeader(selectedDate).sub})</span>
          </button>

          <button
            type="button"
            className={`agenda-view-tab-btn ${viewTab === 'todos_eventos' ? 'active' : ''}`}
            onClick={() => setViewTab('todos_eventos')}
          >
            <FileText size={14} />
            <span>Agenda Completa</span>
            <span className="tab-count-badge">{filteredEvents.length}</span>
          </button>
        </div>

        {displayedGroups.length === 0 ? (
          <div className="agenda-empty-state">
            <CalendarIcon size={44} className="text-gold opacity-50" />
            {viewTab === 'dia_selecionado' ? (
              <>
                <h3>Nenhum evento em {formatDateHeader(selectedDate).label}</h3>
                <p>Não há compromissos ou marcos importantes agendados para este dia.</p>
                <button
                  type="button"
                  className="btn-agenda-new-event mt-3"
                  onClick={() => openNewEventModal('compromisso')}
                >
                  <Plus size={16} />
                  <span>Cadastrar Registro neste dia</span>
                </button>
              </>
            ) : (
              <>
                <h3>Nenhum compromisso encontrado</h3>
                <p>
                  {searchTerm || priorityFilter !== 'todas' || statusFilter !== 'todos'
                    ? 'Nenhum evento corresponde aos filtros aplicados. Tente ajustar a busca.'
                    : 'Não há compromissos cadastrados na agenda no momento.'}
                </p>
                <button
                  type="button"
                  className="btn-agenda-new-event mt-3"
                  onClick={() => setIsFabMenuOpen(true)}
                >
                  <Plus size={16} />
                  <span>Cadastrar Primeiro Registro</span>
                </button>
              </>
            )}
          </div>
        ) : (
          displayedGroups.map(({ dateStr, events: dayEvents }) => {
            const dateHeader = formatDateHeader(dateStr);
            const isTargetDay = dateStr === selectedDate;

            return (
              <section
                key={dateStr}
                id={`agenda-group-${dateStr}`}
                className={`agenda-day-group ${isTargetDay ? 'target-highlight' : ''}`}
              >
                {/* Cabeçalho da Data */}
                <div className="agenda-group-header">
                  <div className="group-header-left">
                    <span className="group-date-label">{dateHeader.label}</span>
                    {dateHeader.isToday && <span className="badge-today">HOJE</span>}
                    {dateHeader.isTomorrow && <span className="badge-tomorrow">AMANHÃ</span>}
                  </div>
                  <span className="group-event-count">
                    {dayEvents.length} {dayEvents.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {/* Lista de Cards do Dia */}
                <div className="agenda-events-list">
                  {dayEvents.map((event) => {
                    // Card Especial: Data Importante / Marco
                    if (event.eventType === 'data_importante') {
                      return (
                        <article
                          key={event.id}
                          className="agenda-event-card card-data-importante"
                          onClick={() => openEditEventModal(event)}
                        >
                          <div className="event-card-main">
                            <div className="event-time-col milestone-time-col">
                              <Star size={18} className="milestone-star-icon" />
                            </div>

                            <div className="event-details-col">
                              <h3 className="event-title milestone-title">{event.title}</h3>

                              {event.notes && (
                                <div className="event-notes-box milestone-notes-box">
                                  <FileText size={14} className="notes-icon" />
                                  <p className="notes-text">{event.notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="event-actions-col" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-event-action edit"
                                onClick={() => openEditEventModal(event)}
                                title="Editar data importante"
                                aria-label="Editar data importante"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                type="button"
                                className="btn-event-action delete"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                title="Excluir data importante"
                                aria-label="Excluir data importante"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    // Card Padrão: Compromisso da Agenda
                    return (
                      <article
                        key={event.id}
                        className={`agenda-event-card priority-border-${event.priority} ${event.status === 'concluido' ? 'event-done' : ''}`}
                        onClick={() => openEditEventModal(event)}
                      >
                        <div className="event-card-main">
                          {/* Coluna do Horário */}
                          <div className="event-time-col">
                            <Clock size={16} className="text-gold" />
                            <span className="event-time-text">{event.eventTime}</span>
                          </div>

                          {/* Conteúdo Central */}
                          <div className="event-details-col">
                            <h3 className="event-title">{event.title}</h3>

                            {event.notes && (
                              <div className="event-notes-box">
                                <FileText size={14} className="notes-icon" />
                                <p className="notes-text">{event.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Ações Rápidas */}
                          <div className="event-actions-col" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn-event-action postpone"
                              onClick={() => openPostponeModal(event)}
                              title="Adiar compromisso para outra data"
                              aria-label="Adiar compromisso"
                            >
                              <CalendarClock size={16} />
                            </button>

                            <button
                              type="button"
                              className="btn-event-action edit"
                              onClick={() => openEditEventModal(event)}
                              title="Editar compromisso"
                              aria-label="Editar compromisso"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              type="button"
                              className="btn-event-action delete"
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              title="Excluir compromisso"
                              aria-label="Excluir compromisso"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Modal de Criação / Edição */}
      <AgendaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        currentUser={sessionUser}
        defaultDate={selectedDate}
        defaultEventType={modalDefaultEventType}
      />

      {/* Modal de Adiar Compromisso */}
      <AgendaPostponeModal
        isOpen={isPostponeModalOpen}
        onClose={() => {
          setIsPostponeModalOpen(false);
          setPostponingEvent(null);
        }}
        event={postponingEvent}
        onPostpone={handlePostponeEvent}
      />

      {/* Menu do FAB e Botão Flutuante (FAB) */}
      {isFabMenuOpen && (
        <div className="agenda-fab-overlay" onClick={() => setIsFabMenuOpen(false)} />
      )}
      <div className="agenda-fab-container">
        {isFabMenuOpen && (
          <div className="agenda-fab-menu">
            <button
              type="button"
              className="fab-menu-item"
              onClick={() => openNewEventModal('compromisso')}
            >
              <CalendarIcon size={16} />
              <span>Novo Compromisso</span>
            </button>
            <button
              type="button"
              className="fab-menu-item data-importante"
              onClick={() => openNewEventModal('data_importante')}
            >
              <Star size={16} className="text-gold" />
              <span>Nova Data Importante</span>
            </button>
          </div>
        )}
        <button
          type="button"
          className={`agenda-fab-btn ${isFabMenuOpen ? 'active' : ''}`}
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
          title="Adicionar..."
          aria-label="Adicionar..."
        >
          {isFabMenuOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Overlay invisível para fechar o menu do FAB ao clicar fora */}
      {isFabMenuOpen && (
        <div 
          className="agenda-fab-overlay" 
          onClick={() => setIsFabMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        />
      )}
    </div>
  );
};
