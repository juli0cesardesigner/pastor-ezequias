import { sql } from '../config/database';
import { DEFAULT_MATERIALS_CATALOG } from '../config/materials';
import type { MaterialCatalogItem } from '../types/materials';

export async function ensureCatalogTable(): Promise<void> {
  try {
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

    const existing = await sql`SELECT count(*)::int as count FROM materials_catalog;`;
    if (existing[0]?.count === 0) {
      for (const item of DEFAULT_MATERIALS_CATALOG) {
        await sql`
          INSERT INTO materials_catalog (id, name, description, image_url, badge_text, has_limit, max_quantity, is_active, display_order)
          VALUES (${item.id}, ${item.name}, ${item.description}, ${item.imageUrl || null}, ${item.badgeText || null}, ${item.hasLimit}, ${item.maxQuantity}, ${item.isActive}, ${item.displayOrder})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
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
      return DEFAULT_MATERIALS_CATALOG.filter(item => !onlyActive || item.isActive);
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
    return DEFAULT_MATERIALS_CATALOG.filter(item => !onlyActive || item.isActive);
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
