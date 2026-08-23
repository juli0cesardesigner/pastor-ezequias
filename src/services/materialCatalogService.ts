import { sql } from '../config/database';
import { DEFAULT_MATERIALS_CATALOG } from '../config/materials';
import type { MaterialCatalogItem } from '../types/materials';

let isCatalogTableInitialized = false;

export async function ensureCatalogTable(): Promise<void> {
  if (isCatalogTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS materials_catalog (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        badge_text VARCHAR(50),
        has_limit BOOLEAN NOT NULL DEFAULT true,
        max_quantity INT NOT NULL DEFAULT 10,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Garante que o flag de seed inicial seja registrado para nunca recriar dados após o usuário apagar
    const seeded = await sql`
      SELECT value FROM campaign_settings WHERE key = 'catalog_seeded_v1' LIMIT 1;
    `;

    if (!seeded || seeded.length === 0) {
      await sql`
        INSERT INTO campaign_settings (key, value)
        VALUES ('catalog_seeded_v1', 'true')
        ON CONFLICT (key) DO UPDATE SET value = 'true';
      `;
    }

    isCatalogTableInitialized = true;
  } catch (err) {
    console.warn('Tabela materials_catalog aviso:', err);
  }
}

export async function fetchMaterialsCatalog(onlyActive = true): Promise<MaterialCatalogItem[]> {
  try {
    await ensureCatalogTable();
    const rows = onlyActive
      ? await sql`
          SELECT id, name, description, image_url as "imageUrl", badge_text as "badgeText", 
                 has_limit as "hasLimit", max_quantity as "maxQuantity", is_active as "isActive", display_order as "displayOrder"
          FROM materials_catalog
          WHERE is_active = true
          ORDER BY display_order ASC, name ASC;
        `
      : await sql`
          SELECT id, name, description, image_url as "imageUrl", badge_text as "badgeText", 
                 has_limit as "hasLimit", max_quantity as "maxQuantity", is_active as "isActive", display_order as "displayOrder"
          FROM materials_catalog
          ORDER BY display_order ASC, name ASC;
        `;

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description || ''),
      imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
      badgeText: row.badgeText ? String(row.badgeText) : undefined,
      hasLimit: Boolean(row.hasLimit),
      maxQuantity: Number(row.maxQuantity) || 1,
      isActive: Boolean(row.isActive),
      displayOrder: Number(row.displayOrder) || 0
    }));
  } catch (err) {
    console.error('Erro ao buscar catálogo de materiais:', err);
    return [];
  }
}

export async function saveCatalogItem(item: MaterialCatalogItem): Promise<boolean> {
  try {
    await ensureCatalogTable();
    await sql`
      INSERT INTO materials_catalog (id, name, description, image_url, badge_text, has_limit, max_quantity, is_active, display_order, updated_at)
      VALUES (${item.id}, ${item.name}, ${item.description}, ${item.imageUrl || null}, ${item.badgeText || null}, ${item.hasLimit}, ${item.maxQuantity}, ${item.isActive}, ${item.displayOrder}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        badge_text = EXCLUDED.badge_text,
        has_limit = EXCLUDED.has_limit,
        max_quantity = EXCLUDED.max_quantity,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (err) {
    console.error('Erro ao salvar item do catálogo:', err);
    return false;
  }
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
  try {
    await ensureCatalogTable();
    await sql`DELETE FROM materials_catalog WHERE id = ${id};`;
    return true;
  } catch (err) {
    console.error('Erro ao remover item do catálogo:', err);
    return false;
  }
}

/**
 * Função explícita caso o administrador queira recarregar os materiais padrão sugeridos
 */
export async function seedDefaultMaterials(): Promise<boolean> {
  try {
    await ensureCatalogTable();
    for (const item of DEFAULT_MATERIALS_CATALOG) {
      await sql`
        INSERT INTO materials_catalog (id, name, description, image_url, badge_text, has_limit, max_quantity, is_active, display_order)
        VALUES (${item.id}, ${item.name}, ${item.description}, ${item.imageUrl || null}, ${item.badgeText || null}, ${item.hasLimit}, ${item.maxQuantity}, ${item.isActive}, ${item.displayOrder})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    return true;
  } catch (err) {
    console.error('Erro ao semear materiais sugeridos:', err);
    return false;
  }
}

