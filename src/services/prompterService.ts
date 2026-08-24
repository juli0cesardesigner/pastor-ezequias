import { sql } from '../config/database';

export interface CloudScript {
  id: number;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

let isTableInitialized = false;

/**
 * Garante que a tabela de roteiros do teleprompter exista no Neon DB
 */
export async function ensurePrompterTable(): Promise<void> {
  if (isTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS teleprompter_scripts (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(80) NOT NULL DEFAULT 'Geral',
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    isTableInitialized = true;
  } catch (err) {
    console.warn('Aviso ao inicializar tabela teleprompter_scripts:', err);
  }
}

/**
 * Busca todos os roteiros salvos no banco de dados
 */
export async function fetchCloudScripts(): Promise<CloudScript[]> {
  try {
    await ensurePrompterTable();
    const rows = await sql`
      SELECT 
        id, 
        title, 
        content, 
        category, 
        is_pinned as "isPinned", 
        to_char(created_at, 'DD/MM/YYYY HH24:MI') as "createdAt", 
        to_char(updated_at, 'DD/MM/YYYY HH24:MI') as "updatedAt"
      FROM teleprompter_scripts
      ORDER BY is_pinned DESC, updated_at DESC;
    `;

    return rows.map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      content: String(r.content),
      category: String(r.category || 'Geral'),
      isPinned: Boolean(r.isPinned),
      createdAt: String(r.createdAt),
      updatedAt: String(r.updatedAt),
    }));
  } catch (err) {
    console.error('Erro ao buscar roteiros na nuvem:', err);
    throw err;
  }
}

/**
 * Salva ou atualiza um roteiro no banco de dados Neon
 */
export async function saveCloudScript(data: {
  id?: number | null;
  title: string;
  content: string;
  category?: string;
  isPinned?: boolean;
}): Promise<CloudScript> {
  try {
    await ensurePrompterTable();
    const finalTitle = data.title.trim() || 'Roteiro sem título';
    const finalContent = data.content.trim();
    const finalCategory = data.category?.trim() || 'Geral';
    const finalPinned = Boolean(data.isPinned);

    if (data.id) {
      // Atualizar existente
      const rows = await sql`
        UPDATE teleprompter_scripts
        SET 
          title = ${finalTitle},
          content = ${finalContent},
          category = ${finalCategory},
          is_pinned = ${finalPinned},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${data.id}
        RETURNING 
          id, 
          title, 
          content, 
          category, 
          is_pinned as "isPinned", 
          to_char(created_at, 'DD/MM/YYYY HH24:MI') as "createdAt", 
          to_char(updated_at, 'DD/MM/YYYY HH24:MI') as "updatedAt";
      `;

      const r = rows[0];
      return {
        id: Number(r.id),
        title: String(r.title),
        content: String(r.content),
        category: String(r.category || 'Geral'),
        isPinned: Boolean(r.isPinned),
        createdAt: String(r.createdAt),
        updatedAt: String(r.updatedAt),
      };
    } else {
      // Inserir novo
      const rows = await sql`
        INSERT INTO teleprompter_scripts (title, content, category, is_pinned)
        VALUES (${finalTitle}, ${finalContent}, ${finalCategory}, ${finalPinned})
        RETURNING 
          id, 
          title, 
          content, 
          category, 
          is_pinned as "isPinned", 
          to_char(created_at, 'DD/MM/YYYY HH24:MI') as "createdAt", 
          to_char(updated_at, 'DD/MM/YYYY HH24:MI') as "updatedAt";
      `;

      const r = rows[0];
      return {
        id: Number(r.id),
        title: String(r.title),
        content: String(r.content),
        category: String(r.category || 'Geral'),
        isPinned: Boolean(r.isPinned),
        createdAt: String(r.createdAt),
        updatedAt: String(r.updatedAt),
      };
    }
  } catch (err) {
    console.error('Erro ao salvar roteiro na nuvem:', err);
    throw err;
  }
}

/**
 * Exclui um roteiro do banco de dados
 */
export async function deleteCloudScript(id: number): Promise<boolean> {
  try {
    await ensurePrompterTable();
    await sql`
      DELETE FROM teleprompter_scripts
      WHERE id = ${id};
    `;
    return true;
  } catch (err) {
    console.error('Erro ao excluir roteiro na nuvem:', err);
    throw err;
  }
}
