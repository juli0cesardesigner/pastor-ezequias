import { sql } from '../config/database';

const STORAGE_KEY = 'ezequias_profile_supporters_count';
const LAST_VISIT_TIMESTAMP_KEY = 'ezequias_last_counted_visit_time';
export const CAMPAIGN_COUNTER_ID = 'pastor_ezequias_supporters';
export const BASE_SUPPORTERS_COUNT = 1;

// Intervalo mínimo de 1 hora (em milissegundos) para computar novo acesso do mesmo usuário
const VISIT_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Leitura síncrona do cache local para renderização instantânea
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
 * Registra o acesso com trava de tempo (cooldown de 1 hora por dispositivo/navegador)
 * Evita contagens desenfreadas por F5/atualizações contínuas da página.
 */
export async function registerVisitAndGetCount(): Promise<number> {
  const currentLocal = getStoredSupportersCount();
  const now = Date.now();

  // Verifica se o dispositivo já foi computado na última 1 hora
  let isWithinCooldown = false;
  try {
    const lastVisitStr = localStorage.getItem(LAST_VISIT_TIMESTAMP_KEY);
    if (lastVisitStr) {
      const lastVisitTime = parseInt(lastVisitStr, 10);
      if (!isNaN(lastVisitTime) && now - lastVisitTime < VISIT_COOLDOWN_MS) {
        isWithinCooldown = true;
      }
    }
  } catch {}

  try {
    if (!isWithinCooldown) {
      // 1. Novo acesso válido (mais de 1h desde a última contagem ou primeira visita):
      const rows = await sql`
        UPDATE campaign_counters
        SET count = count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${CAMPAIGN_COUNTER_ID}
        RETURNING count;
      `;

      // Registra o timestamp atual no dispositivo para bloquear próximas atualizações por 1h
      try {
        localStorage.setItem(LAST_VISIT_TIMESTAMP_KEY, now.toString());
      } catch {}

      // Registra log assíncrono
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
      // 2. Atualização de página/recarregamento dentro de 1h: Apenas consulta o total atual
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
