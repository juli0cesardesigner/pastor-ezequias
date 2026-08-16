import { sql } from '../config/database';

const STORAGE_KEY = 'ezequias_profile_supporters_count';
const SESSION_VISIT_KEY = 'ezequias_session_visited_counted';
export const CAMPAIGN_COUNTER_ID = 'pastor_ezequias_supporters';
export const BASE_SUPPORTERS_COUNT = 1;

/**
 * Leitura síncrona do cache local para evitar flicker de carregamento na tela
 */
export function getStoredSupportersCount(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        return parsed;
      }
    }
  } catch {
    // Fallback silencioso
  }
  return BASE_SUPPORTERS_COUNT;
}

/**
 * Registra o acesso/visita à página no Neon DB e retorna a contagem atualizada
 */
export async function registerVisitAndGetCount(): Promise<number> {
  const currentLocal = getStoredSupportersCount();

  // Verifica se este usuário já foi contabilizado nesta sessão
  let alreadyCountedInSession = false;
  try {
    alreadyCountedInSession = sessionStorage.getItem(SESSION_VISIT_KEY) === '1';
  } catch {}

  try {
    if (!alreadyCountedInSession) {
      // 1. Nova visita: incrementa atomicamente no Neon DB
      const rows = await sql`
        UPDATE campaign_counters
        SET count = count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${CAMPAIGN_COUNTER_ID}
        RETURNING count;
      `;

      // Marca que a sessão já foi computada
      try {
        sessionStorage.setItem(SESSION_VISIT_KEY, '1');
      } catch {}

      // Registra log assíncrono de acesso
      sql`
        INSERT INTO supporters_log (campaign_id)
        VALUES ('pastor_ezequias');
      `.catch(() => {});

      if (rows && rows.length > 0) {
        const liveCount = Number(rows[0].count);
        if (!isNaN(liveCount) && liveCount >= 1) {
          try {
            localStorage.setItem(STORAGE_KEY, liveCount.toString());
          } catch {}
          return liveCount;
        }
      }
      return currentLocal + 1;
    } else {
      // 2. Visita já computada na sessão: apenas busca a contagem mais recente
      const rows = await sql`
        SELECT count 
        FROM campaign_counters 
        WHERE id = ${CAMPAIGN_COUNTER_ID}
        LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        const liveCount = Number(rows[0].count);
        if (!isNaN(liveCount) && liveCount >= 1) {
          try {
            localStorage.setItem(STORAGE_KEY, liveCount.toString());
          } catch {}
          return liveCount;
        }
      }
    }
  } catch (err) {
    console.warn('Aviso: Falha ao comunicar com o Neon DB, usando cache local.', err);
  }

  return currentLocal;
}
