import { sql } from '../config/database';

const STORAGE_KEY = 'ezequias_profile_supporters_count';
export const CAMPAIGN_COUNTER_ID = 'pastor_ezequias_supporters';
export const BASE_SUPPORTERS_COUNT = 1240;

/**
 * Leitura síncrona do cache local para renderização instantânea
 */
export function getStoredSupportersCount(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback silencioso
  }
  return BASE_SUPPORTERS_COUNT;
}

/**
 * Busca a contagem real atualizada no Neon DB
 */
export async function fetchLiveSupportersCount(): Promise<number> {
  try {
    const rows = await sql`
      SELECT count 
      FROM campaign_counters 
      WHERE id = ${CAMPAIGN_COUNTER_ID}
      LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      const liveCount = Number(rows[0].count);
      if (!isNaN(liveCount) && liveCount > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, liveCount.toString());
        } catch {
          // Ignore storage issues
        }
        return liveCount;
      }
    }
  } catch (err) {
    console.warn('Aviso: Falha ao sincronizar contador com Neon DB, usando cache local.', err);
  }
  return getStoredSupportersCount();
}

/**
 * Incrementa o contador atômico no Neon DB e registra log
 */
export async function incrementLiveSupportersCount(): Promise<number> {
  const optimisticNext = getStoredSupportersCount() + 1;
  try {
    localStorage.setItem(STORAGE_KEY, optimisticNext.toString());
  } catch {
    // Ignore storage issues
  }

  try {
    const rows = await sql`
      UPDATE campaign_counters
      SET count = count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${CAMPAIGN_COUNTER_ID}
      RETURNING count;
    `;

    // Registra log assíncrono
    sql`
      INSERT INTO supporters_log (campaign_id)
      VALUES ('pastor_ezequias');
    `.catch(() => {});

    if (rows && rows.length > 0) {
      const updatedCount = Number(rows[0].count);
      if (!isNaN(updatedCount)) {
        try {
          localStorage.setItem(STORAGE_KEY, updatedCount.toString());
        } catch {}
        return updatedCount;
      }
    }
  } catch (err) {
    console.error('Erro ao atualizar contador no Neon DB:', err);
  }

  return optimisticNext;
}
