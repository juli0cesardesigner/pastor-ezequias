import { sql } from '../config/database';
import type {
  AgendaEvent,
  AgendaEventInput,
  AgendaUser,
  AgendaUserInput,
  AgendaSessionUser,
  AgendaStatus,
  AgendaPriority,
  AgendaEventType,
} from '../types/agenda';

const LOCAL_STORAGE_EVENTS_KEY = 'pastor_ezequias_agenda_events_v1';
const LOCAL_STORAGE_SESSION_KEY = 'pastor_ezequias_agenda_session_v1';

let isTablesInitialized = false;

/**
 * Garante que as tabelas de Usuários da Agenda e Eventos existam no Neon DB
 */
export async function ensureAgendaTables(): Promise<void> {
  if (isTablesInitialized) return;
  try {
    // 1. Tabela de Usuários da Agenda
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_agenda_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        username VARCHAR(80) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(80) NOT NULL DEFAULT 'Equipe',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Tabela de Eventos da Agenda
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_agenda_events (
        id SERIAL PRIMARY KEY,
        event_date VARCHAR(20) NOT NULL,
        event_time VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        status VARCHAR(30) NOT NULL DEFAULT 'pendente',
        priority VARCHAR(20) NOT NULL DEFAULT 'media',
        event_type VARCHAR(50) NOT NULL DEFAULT 'compromisso',
        created_by_name VARCHAR(150) NOT NULL DEFAULT 'Equipe',
        created_by_user_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Garante a existência da coluna event_type caso a tabela já tenha sido criada anteriormente
    await sql`
      ALTER TABLE campaign_agenda_events
      ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) NOT NULL DEFAULT 'compromisso';
    `;

    // 3. Verifica se existe pelo menos um usuário. Se não houver, insere o usuário padrão de coordenação
    const existingUsers = await sql`SELECT id FROM campaign_agenda_users LIMIT 1;`;
    if (existingUsers.length === 0) {
      await sql`
        INSERT INTO campaign_agenda_users (name, username, password_hash, role, is_active)
        VALUES ('Pastor Ezequias / Coordenação', 'admin', 'ezequias2026', 'Coordenação', true)
        ON CONFLICT (username) DO NOTHING;
      `;
    }

    isTablesInitialized = true;
  } catch (err) {
    console.error('Erro ao inicializar tabelas da agenda no Neon DB:', err);
  }
}

/* ==========================================================================
   SESSÃO DO USUÁRIO DA AGENDA (LOCAL STORAGE)
   ========================================================================== */

export function getAgendaSession(): AgendaSessionUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function setAgendaSession(user: AgendaSessionUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
  } catch {}
}

export function clearAgendaSession(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  } catch {}
}

/* ==========================================================================
   AUTENTICAÇÃO & USUÁRIOS (ADMIN)
   ========================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToUser(row: any): AgendaUser {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    username: String(row.username || ''),
    role: String(row.role || 'Equipe'),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Realiza login do membro da equipe
 */
export async function loginAgendaUser(username: string, password: string): Promise<AgendaSessionUser> {
  await ensureAgendaTables();

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  const rows = await sql`
    SELECT id, name, username, password_hash, role, is_active
    FROM campaign_agenda_users
    WHERE LOWER(username) = ${cleanUser}
    LIMIT 1;
  `;

  if (rows.length === 0) {
    throw new Error('Usuário não encontrado.');
  }

  const userRow = rows[0];

  if (!userRow.is_active) {
    throw new Error('Este usuário está desativado pela coordenação.');
  }

  if (userRow.password_hash !== cleanPass) {
    throw new Error('Senha incorreta.');
  }

  const sessionUser: AgendaSessionUser = {
    id: Number(userRow.id),
    name: String(userRow.name),
    username: String(userRow.username),
    role: String(userRow.role || 'Equipe'),
  };

  setAgendaSession(sessionUser);
  return sessionUser;
}

/**
 * Lista todos os usuários cadastrados (para o painel Admin)
 */
export async function fetchAllAgendaUsers(): Promise<AgendaUser[]> {
  await ensureAgendaTables();
  try {
    const rows = await sql`
      SELECT id, name, username, role, is_active, created_at
      FROM campaign_agenda_users
      ORDER BY id ASC;
    `;
    return rows.map(mapRowToUser);
  } catch (err) {
    console.error('Erro ao buscar usuários da agenda:', err);
    return [];
  }
}

/**
 * Cria um novo usuário da equipe (via Admin)
 */
export async function createAgendaUser(input: AgendaUserInput): Promise<AgendaUser> {
  await ensureAgendaTables();

  const cleanName = input.name.trim();
  const cleanUser = input.username.trim().toLowerCase();
  const cleanPass = (input.password || '123456').trim();
  const cleanRole = (input.role || 'Equipe').trim();
  const isActive = input.isActive !== undefined ? input.isActive : true;

  const rows = await sql`
    INSERT INTO campaign_agenda_users (name, username, password_hash, role, is_active)
    VALUES (${cleanName}, ${cleanUser}, ${cleanPass}, ${cleanRole}, ${isActive})
    RETURNING id, name, username, role, is_active, created_at;
  `;

  return mapRowToUser(rows[0]);
}

/**
 * Atualiza um usuário (via Admin)
 */
export async function updateAgendaUser(id: number, input: AgendaUserInput): Promise<AgendaUser> {
  await ensureAgendaTables();

  const cleanName = input.name.trim();
  const cleanUser = input.username.trim().toLowerCase();
  const cleanRole = (input.role || 'Equipe').trim();
  const isActive = input.isActive !== undefined ? input.isActive : true;

  if (input.password && input.password.trim() !== '') {
    const cleanPass = input.password.trim();
    const rows = await sql`
      UPDATE campaign_agenda_users
      SET name = ${cleanName},
          username = ${cleanUser},
          password_hash = ${cleanPass},
          role = ${cleanRole},
          is_active = ${isActive},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, username, role, is_active, created_at;
    `;
    return mapRowToUser(rows[0]);
  } else {
    const rows = await sql`
      UPDATE campaign_agenda_users
      SET name = ${cleanName},
          username = ${cleanUser},
          role = ${cleanRole},
          is_active = ${isActive},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, username, role, is_active, created_at;
    `;
    return mapRowToUser(rows[0]);
  }
}

/**
 * Alterna status ativo/inativo do usuário
 */
export async function toggleAgendaUserActive(id: number, isActive: boolean): Promise<void> {
  await ensureAgendaTables();
  await sql`
    UPDATE campaign_agenda_users
    SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;
}

/**
 * Exclui usuário da agenda
 */
export async function deleteAgendaUser(id: number): Promise<void> {
  await ensureAgendaTables();
  await sql`DELETE FROM campaign_agenda_users WHERE id = ${id};`;
}

/* ==========================================================================
   EVENTOS DA AGENDA
   ========================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToEvent(row: any): AgendaEvent {
  return {
    id: Number(row.id),
    eventDate: String(row.event_date || ''),
    eventTime: String(row.event_time || ''),
    title: String(row.title || ''),
    location: String(row.location || ''),
    notes: String(row.notes || ''),
    status: (row.status as AgendaStatus) || 'pendente',
    priority: (row.priority as AgendaPriority) || 'media',
    eventType: (row.event_type as AgendaEventType) || 'compromisso',
    createdByName: String(row.created_by_name || 'Equipe'),
    createdByUserId: row.created_by_user_id ? Number(row.created_by_user_id) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export function getLocalAgendaEventsCache(): AgendaEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function setLocalAgendaEventsCache(events: AgendaEvent[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
  } catch {}
}

/**
 * Busca todos os eventos da agenda, ordenados por data e horário
 */
export async function fetchAllAgendaEvents(): Promise<AgendaEvent[]> {
  await ensureAgendaTables();
  try {
    const rows = await sql`
      SELECT id, event_date, event_time, title, location, notes, status, priority,
             event_type, created_by_name, created_by_user_id, created_at, updated_at
      FROM campaign_agenda_events
      ORDER BY event_date ASC, event_time ASC;
    `;
    const events = rows.map(mapRowToEvent);
    setLocalAgendaEventsCache(events);
    return events;
  } catch (err) {
    console.error('Erro ao carregar eventos da agenda no Neon DB:', err);
    return getLocalAgendaEventsCache();
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().split('T')[0];
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().split('T')[0];
}

/**
 * Cria um novo evento na agenda, suportando repetição
 */
export async function createAgendaEvent(input: AgendaEventInput): Promise<AgendaEvent> {
  await ensureAgendaTables();

  const eventType = input.eventType || 'compromisso';
  const recurrence = input.recurrence || 'none';
  
  let datesToInsert: string[] = [input.eventDate];

  if (recurrence !== 'none') {
    const endLimitDate = input.recurrenceEndDate;
    // Default caps to avoid infinite loops: Weekly=3 years (~156), Monthly=5 years (60), Yearly=10 years (10)
    let maxOccurrences = recurrence === 'semanal' ? 156 : recurrence === 'mensal' ? 60 : 10;
    
    let currentDate = input.eventDate;
    for (let i = 1; i < maxOccurrences; i++) {
      if (recurrence === 'semanal') currentDate = addDays(currentDate, 7);
      else if (recurrence === 'mensal') currentDate = addMonths(currentDate, 1);
      else if (recurrence === 'anual') currentDate = addYears(currentDate, 1);

      if (endLimitDate && currentDate > endLimitDate) break;
      
      datesToInsert.push(currentDate);
    }
  }

  const createdEvents: AgendaEvent[] = [];

  for (const eventDate of datesToInsert) {
    const rows = await sql`
      INSERT INTO campaign_agenda_events (
        event_date, event_time, title, location, notes, status, priority,
        event_type, created_by_name, created_by_user_id
      )
      VALUES (
        ${eventDate},
        ${input.eventTime},
        ${input.title.trim()},
        ${input.location.trim()},
        ${input.notes.trim()},
        ${input.status},
        ${input.priority},
        ${eventType},
        ${input.createdByName.trim()},
        ${input.createdByUserId || null}
      )
      RETURNING id, event_date, event_time, title, location, notes, status, priority,
                event_type, created_by_name, created_by_user_id, created_at, updated_at;
    `;
    createdEvents.push(mapRowToEvent(rows[0]));
  }

  // Atualiza cache local com todos os novos eventos
  const current = getLocalAgendaEventsCache();
  const updated = [...current, ...createdEvents].sort((a, b) => {
    const dateCmp = a.eventDate.localeCompare(b.eventDate);
    if (dateCmp !== 0) return dateCmp;
    return a.eventTime.localeCompare(b.eventTime);
  });
  setLocalAgendaEventsCache(updated);

  // Retorna a primeira ocorrência para o frontend (para fechar modal, etc)
  return createdEvents[0];
}

/**
 * Atualiza um evento existente
 */
export async function updateAgendaEvent(id: number, input: AgendaEventInput): Promise<AgendaEvent> {
  await ensureAgendaTables();

  const eventType = input.eventType || 'compromisso';

  const rows = await sql`
    UPDATE campaign_agenda_events
    SET event_date = ${input.eventDate},
        event_time = ${input.eventTime},
        title = ${input.title.trim()},
        location = ${input.location.trim()},
        notes = ${input.notes.trim()},
        status = ${input.status},
        priority = ${input.priority},
        event_type = ${eventType},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, event_date, event_time, title, location, notes, status, priority,
              event_type, created_by_name, created_by_user_id, created_at, updated_at;
  `;

  const updatedEvent = mapRowToEvent(rows[0]);

  const current = getLocalAgendaEventsCache();
  const updated = current.map((e) => (e.id === id ? updatedEvent : e)).sort((a, b) => {
    const dateCmp = a.eventDate.localeCompare(b.eventDate);
    if (dateCmp !== 0) return dateCmp;
    return a.eventTime.localeCompare(b.eventTime);
  });
  setLocalAgendaEventsCache(updated);

  return updatedEvent;
}

/**
 * Adia um evento para outra data/hora registrando observação de adiamento
 */
export async function postponeAgendaEvent(
  id: number,
  newDate: string,
  newTime: string,
  reason?: string,
  postponedByName?: string
): Promise<AgendaEvent> {
  await ensureAgendaTables();

  const currentEvents = getLocalAgendaEventsCache();
  const current = currentEvents.find((e) => e.id === id);

  const prevDate = current?.eventDate || '';
  const postponementNote = `\n[Adiado de ${prevDate} para ${newDate}${newTime ? ' às ' + newTime : ''}${postponedByName ? ' por ' + postponedByName : ''}${reason ? ': ' + reason : ''}]`;
  const updatedNotes = current ? `${current.notes || ''}${postponementNote}`.trim() : (reason || '');

  const rows = await sql`
    UPDATE campaign_agenda_events
    SET event_date = ${newDate},
        event_time = ${newTime},
        notes = ${updatedNotes},
        status = 'pendente',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, event_date, event_time, title, location, notes, status, priority,
              event_type, created_by_name, created_by_user_id, created_at, updated_at;
  `;

  const updatedEvent = mapRowToEvent(rows[0]);

  const updated = currentEvents.map((e) => (e.id === id ? updatedEvent : e)).sort((a, b) => {
    const dateCmp = a.eventDate.localeCompare(b.eventDate);
    if (dateCmp !== 0) return dateCmp;
    return a.eventTime.localeCompare(b.eventTime);
  });
  setLocalAgendaEventsCache(updated);

  return updatedEvent;
}

/**
 * Atualiza rapidamente o status de um evento
 */
export async function updateAgendaEventStatus(id: number, status: AgendaStatus): Promise<void> {
  await ensureAgendaTables();

  await sql`
    UPDATE campaign_agenda_events
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;

  const current = getLocalAgendaEventsCache();
  const updated = current.map((e) => (e.id === id ? { ...e, status } : e));
  setLocalAgendaEventsCache(updated);
}

/**
 * Exclui um evento da agenda
 */
export async function deleteAgendaEvent(id: number): Promise<void> {
  await ensureAgendaTables();

  await sql`DELETE FROM campaign_agenda_events WHERE id = ${id};`;

  const current = getLocalAgendaEventsCache();
  const updated = current.filter((e) => e.id !== id);
  setLocalAgendaEventsCache(updated);
}
