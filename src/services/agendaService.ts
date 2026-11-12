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
  AgendaTask,
  AgendaTaskInput,
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

    // Garante a existência da tabela para salvar inscrições de Web Push
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_agenda_push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INT,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Garante a existência da tabela de Pendências / Checklist
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_agenda_tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        assigned_date VARCHAR(20),
        agenda_event_id INT,
        priority VARCHAR(20) NOT NULL DEFAULT 'media',
        notes TEXT NOT NULL DEFAULT '',
        created_by_name VARCHAR(150) NOT NULL DEFAULT 'Equipe',
        created_by_user_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
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
    // Default caps: diariamente=365 dias, segunda a sexta=260 dias, semanal=156, mensal=60, anual=10
    let maxOccurrences = 10;
    if (recurrence === 'diariamente') maxOccurrences = 365;
    else if (recurrence === 'segunda_a_sexta') maxOccurrences = 260;
    else if (recurrence === 'semanal') maxOccurrences = 156;
    else if (recurrence === 'mensal') maxOccurrences = 60;
    else if (recurrence === 'anual') maxOccurrences = 10;
    
    let currentDate = input.eventDate;
    let added = 1;
    while (added < maxOccurrences) {
      if (recurrence === 'diariamente') {
        currentDate = addDays(currentDate, 1);
      } else if (recurrence === 'segunda_a_sexta') {
        currentDate = addDays(currentDate, 1);
        const dayOfWeek = new Date(`${currentDate}T12:00:00`).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // pula sábado e domingo
      } else if (recurrence === 'semanal') {
        currentDate = addDays(currentDate, 7);
      } else if (recurrence === 'mensal') {
        currentDate = addMonths(currentDate, 1);
      } else if (recurrence === 'anual') {
        currentDate = addYears(currentDate, 1);
      }

      if (endLimitDate && currentDate > endLimitDate) break;
      
      datesToInsert.push(currentDate);
      added++;
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

/**
 * Salva a inscrição do Web Push (PushSubscription) no Neon DB
 */
export async function savePushSubscription(
  userId: number | undefined,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    await ensureAgendaTables();
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys?.p256dh || '';
    const auth = subJson.keys?.auth || '';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    if (!endpoint || !p256dh || !auth) {
      return false;
    }

    await sql`
      INSERT INTO campaign_agenda_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
      VALUES (${userId || null}, ${endpoint}, ${p256dh}, ${auth}, ${userAgent}, CURRENT_TIMESTAMP)
      ON CONFLICT (endpoint) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          user_agent = EXCLUDED.user_agent,
          updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (err) {
    console.error('Erro ao salvar PushSubscription no Neon DB:', err);
    return false;
  }
}

/**
 * Remove a inscrição do Web Push no Neon DB
 */
export async function removePushSubscription(endpoint: string): Promise<boolean> {
  try {
    await ensureAgendaTables();
    await sql`
      DELETE FROM campaign_agenda_push_subscriptions
      WHERE endpoint = ${endpoint};
    `;
    return true;
  } catch (err) {
    console.error('Erro ao remover PushSubscription do Neon DB:', err);
    return false;
  }
}

/**
 * Retorna todas as inscrições ativas de Web Push
 */
export async function getAllPushSubscriptions(): Promise<
  Array<{ id: number; endpoint: string; p256dh: string; auth: string }>
> {
  try {
    await ensureAgendaTables();
    const rows = await sql`
      SELECT id, endpoint, p256dh, auth
      FROM campaign_agenda_push_subscriptions;
    `;
    return rows.map((r: any) => ({
      id: Number(r.id),
      endpoint: String(r.endpoint),
      p256dh: String(r.p256dh),
      auth: String(r.auth)
    }));
  } catch (err) {
    console.error('Erro ao listar PushSubscriptions do Neon DB:', err);
    return [];
  }
}

/* ==========================================================================
   PENDÊNCIAS & CHECKLIST DA AGENDA
   ========================================================================== */

const LOCAL_STORAGE_TASKS_KEY = 'pastor_ezequias_agenda_tasks_v1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToTask(row: any): AgendaTask {
  return {
    id: Number(row.id),
    title: String(row.title || ''),
    completed: Boolean(row.completed),
    assignedDate: row.assigned_date ? String(row.assigned_date) : null,
    agendaEventId: row.agenda_event_id ? Number(row.agenda_event_id) : null,
    eventTitle: row.event_title ? String(row.event_title) : null,
    priority: (row.priority as AgendaPriority) || 'media',
    notes: String(row.notes || ''),
    createdByName: String(row.created_by_name || 'Equipe'),
    createdByUserId: row.created_by_user_id ? Number(row.created_by_user_id) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export function getLocalAgendaTasksCache(): AgendaTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function setLocalAgendaTasksCache(tasks: AgendaTask[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
  } catch {}
}

/**
 * Busca todas as pendências / checklist cadastradas
 */
export async function fetchAllAgendaTasks(): Promise<AgendaTask[]> {
  await ensureAgendaTables();
  try {
    const rows = await sql`
      SELECT t.id, t.title, t.completed, t.assigned_date, t.agenda_event_id,
             t.priority, t.notes, t.created_by_name, t.created_by_user_id,
             t.created_at, t.updated_at,
             e.title AS event_title
      FROM campaign_agenda_tasks t
      LEFT JOIN campaign_agenda_events e ON t.agenda_event_id = e.id
      ORDER BY t.completed ASC, t.id DESC;
    `;
    const tasks = rows.map(mapRowToTask);
    setLocalAgendaTasksCache(tasks);
    return tasks;
  } catch (err) {
    console.error('Erro ao buscar pendências no Neon DB:', err);
    return getLocalAgendaTasksCache();
  }
}

/**
 * Cria uma nova pendência
 */
export async function createAgendaTask(input: AgendaTaskInput): Promise<AgendaTask> {
  await ensureAgendaTables();

  const assignedDate = input.assignedDate?.trim() || null;
  const agendaEventId = input.agendaEventId || null;
  const priority = input.priority || 'media';
  const notes = input.notes?.trim() || '';
  const completed = Boolean(input.completed);
  const createdByName = input.createdByName?.trim() || 'Equipe';
  const createdByUserId = input.createdByUserId || null;

  try {
    const rows = await sql`
      INSERT INTO campaign_agenda_tasks (
        title, completed, assigned_date, agenda_event_id, priority, notes,
        created_by_name, created_by_user_id
      )
      VALUES (
        ${input.title.trim()},
        ${completed},
        ${assignedDate},
        ${agendaEventId},
        ${priority},
        ${notes},
        ${createdByName},
        ${createdByUserId}
      )
      RETURNING id, title, completed, assigned_date, agenda_event_id, priority, notes,
                created_by_name, created_by_user_id, created_at, updated_at;
    `;

    let eventTitle: string | null = null;
    if (agendaEventId) {
      try {
        const eventRows = await sql`SELECT title FROM campaign_agenda_events WHERE id = ${agendaEventId} LIMIT 1;`;
        if (eventRows.length > 0) {
          eventTitle = String(eventRows[0].title);
        }
      } catch {}
    }

    const createdTask = mapRowToTask({ ...rows[0], event_title: eventTitle });
    const current = getLocalAgendaTasksCache();
    const updated = [createdTask, ...current.filter((t) => t.id !== createdTask.id)];
    setLocalAgendaTasksCache(updated);

    return createdTask;
  } catch (err) {
    console.error('Erro ao criar pendência no Neon DB, salvando em fallback local:', err);
    const fallbackId = Date.now();
    const fallbackTask: AgendaTask = {
      id: fallbackId,
      title: input.title.trim(),
      completed,
      assignedDate,
      agendaEventId,
      priority,
      notes,
      createdByName,
      createdByUserId: createdByUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    const current = getLocalAgendaTasksCache();
    const updated = [fallbackTask, ...current];
    setLocalAgendaTasksCache(updated);
    return fallbackTask;
  }
}

/**
 * Atualiza os campos de uma pendência
 */
export async function updateAgendaTask(id: number, input: Partial<AgendaTaskInput>): Promise<AgendaTask> {
  await ensureAgendaTables();

  try {
    const assignedDate = input.assignedDate !== undefined ? (input.assignedDate?.trim() || null) : undefined;
    const agendaEventId = input.agendaEventId !== undefined ? (input.agendaEventId || null) : undefined;
    const priority = input.priority !== undefined ? input.priority : undefined;
    const notes = input.notes !== undefined ? input.notes.trim() : undefined;
    const completed = input.completed !== undefined ? Boolean(input.completed) : undefined;
    const title = input.title !== undefined ? input.title.trim() : undefined;

    const rows = await sql`
      UPDATE campaign_agenda_tasks
      SET title = COALESCE(${title ?? null}, title),
          completed = COALESCE(${completed ?? null}, completed),
          assigned_date = CASE WHEN ${assignedDate !== undefined} THEN ${assignedDate ?? null} ELSE assigned_date END,
          agenda_event_id = CASE WHEN ${agendaEventId !== undefined} THEN ${agendaEventId ?? null} ELSE agenda_event_id END,
          priority = COALESCE(${priority ?? null}, priority),
          notes = COALESCE(${notes ?? null}, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, title, completed, assigned_date, agenda_event_id, priority, notes,
                created_by_name, created_by_user_id, created_at, updated_at;
    `;

    if (rows.length === 0) {
      throw new Error('Pendência não encontrada para atualização');
    }

    let eventTitle: string | null = null;
    const targetEventId = rows[0].agenda_event_id;
    if (targetEventId) {
      try {
        const eventRows = await sql`SELECT title FROM campaign_agenda_events WHERE id = ${targetEventId} LIMIT 1;`;
        if (eventRows.length > 0) {
          eventTitle = String(eventRows[0].title);
        }
      } catch {}
    }

    const updatedTask = mapRowToTask({ ...rows[0], event_title: eventTitle });
    const current = getLocalAgendaTasksCache();
    const updated = current.map((t) => (t.id === id ? updatedTask : t));
    setLocalAgendaTasksCache(updated);
    return updatedTask;
  } catch (err) {
    console.error('Erro ao atualizar pendência no Neon DB:', err);
    const current = getLocalAgendaTasksCache();
    const existing = current.find((t) => t.id === id);
    if (existing) {
      const merged: AgendaTask = {
        ...existing,
        ...input,
        title: input.title !== undefined ? input.title.trim() : existing.title,
        notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
        assignedDate: input.assignedDate !== undefined ? input.assignedDate : existing.assignedDate,
        agendaEventId: input.agendaEventId !== undefined ? input.agendaEventId : existing.agendaEventId,
        priority: input.priority !== undefined ? input.priority : existing.priority,
        completed: input.completed !== undefined ? input.completed : existing.completed,
        updatedAt: new Date().toISOString(),
      };
      setLocalAgendaTasksCache(current.map((t) => (t.id === id ? merged : t)));
      return merged;
    }
    throw err;
  }
}

/**
 * Alterna status de conclusão da pendência
 */
export async function toggleAgendaTaskCompleted(id: number, completed: boolean): Promise<AgendaTask> {
  return updateAgendaTask(id, { completed });
}

/**
 * Exclui uma pendência
 */
export async function deleteAgendaTask(id: number): Promise<void> {
  await ensureAgendaTables();
  try {
    await sql`DELETE FROM campaign_agenda_tasks WHERE id = ${id};`;
  } catch (err) {
    console.error('Erro ao excluir pendência no Neon DB:', err);
  }
  const current = getLocalAgendaTasksCache();
  const updated = current.filter((t) => t.id !== id);
  setLocalAgendaTasksCache(updated);
}


