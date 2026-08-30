export type AgendaPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type AgendaStatus = 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';

export type AgendaEventType = 'compromisso' | 'data_importante';

export interface AgendaEvent {
  id: number;
  eventDate: string; // Formato YYYY-MM-DD
  eventTime: string; // Formato HH:MM (ou vazio para datas importantes)
  title: string;
  location: string;
  notes: string;
  status: AgendaStatus;
  priority: AgendaPriority;
  eventType?: AgendaEventType; // 'compromisso' | 'data_importante'
  createdByName: string;
  createdByUserId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AgendaEventInput {
  eventDate: string;
  eventTime: string;
  title: string;
  location: string;
  notes: string;
  status: AgendaStatus;
  priority: AgendaPriority;
  eventType?: AgendaEventType;
  recurrence?: 'none' | 'semanal' | 'mensal' | 'anual';
  recurrenceEndDate?: string; // Formato YYYY-MM-DD
  createdByName: string;
  createdByUserId?: number;
}

export interface AgendaUser {
  id: number;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AgendaUserInput {
  name: string;
  username: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface AgendaSessionUser {
  id: number;
  name: string;
  username: string;
  role: string;
}

export interface AgendaFilter {
  priority: AgendaPriority | 'todas';
  status: AgendaStatus | 'todos';
  searchTerm: string;
  selectedDate?: string;
}

export interface AgendaDayStats {
  total: number;
  pendentes: number;
  confirmados: number;
  emAndamento: number;
  concluidos: number;
}
