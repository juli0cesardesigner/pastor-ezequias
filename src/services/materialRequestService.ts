import { sql } from '../config/database';
import { DEFAULT_WHATSAPP_NUMBER } from '../config/materials';
import type { MaterialRequestPayload, MaterialRequestRecord, MaterialRequestStatus } from '../types/materials';

export async function ensureMaterialRequestTables(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS material_requests (
        id BIGSERIAL PRIMARY KEY,
        supporter_name VARCHAR(150) NOT NULL,
        whatsapp VARCHAR(30) NOT NULL,
        cep VARCHAR(10) NOT NULL,
        street VARCHAR(150) NOT NULL,
        number VARCHAR(20) NOT NULL,
        complement VARCHAR(100),
        neighborhood VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(10) NOT NULL,
        reference_point VARCHAR(200),
        items_json JSONB NOT NULL,
        notes TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (err) {
    console.warn('Aviso ao inicializar tabelas de pedidos:', err);
  }
}

export async function createMaterialRequest(payload: MaterialRequestPayload): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    await ensureMaterialRequestTables();
    const rows = await sql`
      INSERT INTO material_requests (
        supporter_name, whatsapp, cep, street, number, complement, 
        neighborhood, city, state, reference_point, items_json, notes, status
      )
      VALUES (
        ${payload.supporter.name},
        ${payload.supporter.whatsapp},
        ${payload.address.cep},
        ${payload.address.street},
        ${payload.address.number},
        ${payload.address.complement || null},
        ${payload.address.neighborhood},
        ${payload.address.city},
        ${payload.address.state},
        ${payload.address.referencePoint || null},
        ${JSON.stringify(payload.items)}::jsonb,
        ${payload.supporter.notes || null},
        'pendente'
      )
      RETURNING id;
    `;

    const newId = rows[0]?.id ? Number(rows[0].id) : undefined;
    return { success: true, id: newId };
  } catch (err) {
    console.error('Erro ao registrar pedido de materiais:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao salvar pedido no banco'
    };
  }
}

export async function fetchMaterialRequests(statusFilter?: string): Promise<MaterialRequestRecord[]> {
  try {
    await ensureMaterialRequestTables();
    const rows = statusFilter && statusFilter !== 'todos'
      ? await sql`
          SELECT id, supporter_name, whatsapp, cep, street, number, complement,
                 neighborhood, city, state, reference_point, items_json, notes,
                 status, created_at, updated_at
          FROM material_requests
          WHERE status = ${statusFilter}
          ORDER BY created_at DESC;
        `
      : await sql`
          SELECT id, supporter_name, whatsapp, cep, street, number, complement,
                 neighborhood, city, state, reference_point, items_json, notes,
                 status, created_at, updated_at
          FROM material_requests
          ORDER BY created_at DESC;
        `;

    return rows.map((r) => ({
      id: Number(r.id),
      supporter_name: String(r.supporter_name),
      whatsapp: String(r.whatsapp),
      cep: String(r.cep),
      street: String(r.street),
      number: String(r.number),
      complement: r.complement ? String(r.complement) : undefined,
      neighborhood: String(r.neighborhood),
      city: String(r.city),
      state: String(r.state),
      reference_point: r.reference_point ? String(r.reference_point) : undefined,
      items_json: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : (r.items_json || []),
      notes: r.notes ? String(r.notes) : undefined,
      status: r.status as MaterialRequestStatus,
      created_at: String(r.created_at),
      updated_at: r.updated_at ? String(r.updated_at) : undefined
    }));
  } catch (err) {
    console.error('Erro ao buscar pedidos de materiais:', err);
    return [];
  }
}

export async function updateMaterialRequestStatus(id: number, status: MaterialRequestStatus): Promise<boolean> {
  try {
    await ensureMaterialRequestTables();
    await sql`
      UPDATE material_requests
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;
    return true;
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    return false;
  }
}

export async function getCampaignSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    await ensureMaterialRequestTables();
    const rows = await sql`SELECT value FROM campaign_settings WHERE key = ${key} LIMIT 1;`;
    if (rows.length > 0 && rows[0]?.value) {
      return String(rows[0].value);
    }
    return defaultValue;
  } catch (err) {
    console.warn(`Aviso ao ler configuração ${key}:`, err);
    return defaultValue;
  }
}

export async function saveCampaignSetting(key: string, value: string): Promise<boolean> {
  try {
    await ensureMaterialRequestTables();
    await sql`
      INSERT INTO campaign_settings (key, value, updated_at)
      VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (err) {
    console.error(`Erro ao salvar configuração ${key}:`, err);
    return false;
  }
}

export async function getWhatsAppDestination(): Promise<string> {
  return getCampaignSetting('whatsapp_destination', DEFAULT_WHATSAPP_NUMBER);
}
