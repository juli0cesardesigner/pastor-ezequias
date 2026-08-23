import { sql } from '../config/database';
import type { Visita, VisitaInput, ESMunicipality, VisitStatus } from '../types/visitas';

const LOCAL_STORAGE_KEY = 'pastor_ezequias_visitas_cache_v1';

/**
 * Lista completa dos 78 municípios do Espírito Santo com coordenadas centrais aproximadas
 */
export const ES_MUNICIPALITIES: ESMunicipality[] = [
  { name: 'Afonso Cláudio', lat: -20.0778, lng: -41.1347, region: 'Central Serrana' },
  { name: 'Água Doce do Norte', lat: -18.5469, lng: -40.9794, region: 'Noroeste' },
  { name: 'Águia Branca', lat: -18.9839, lng: -40.7408, region: 'Noroeste' },
  { name: 'Alegre', lat: -20.7631, lng: -41.5331, region: 'Caparaó' },
  { name: 'Alfredo Chaves', lat: -20.6364, lng: -40.7497, region: 'Central Sul' },
  { name: 'Alto Rio Novo', lat: -19.0578, lng: -41.0181, region: 'Noroeste' },
  { name: 'Anchieta', lat: -20.8058, lng: -40.6453, region: 'Litoral Sul' },
  { name: 'Apiacá', lat: -21.1542, lng: -41.5681, region: 'Sul' },
  { name: 'Aracruz', lat: -19.8203, lng: -40.2733, region: 'Rio Doce' },
  { name: 'Atílio Vivácqua', lat: -20.9147, lng: -41.1989, region: 'Central Sul' },
  { name: 'Baixo Guandu', lat: -19.5186, lng: -41.0153, region: 'Central Oeste' },
  { name: 'Barra de São Francisco', lat: -18.7553, lng: -40.8906, region: 'Noroeste' },
  { name: 'Boa Esperança', lat: -18.5408, lng: -40.2953, region: 'Nordeste' },
  { name: 'Bom Jesus do Norte', lat: -21.1111, lng: -41.6706, region: 'Caparaó' },
  { name: 'Brejetuba', lat: -20.1469, lng: -41.2917, region: 'Sudoeste Serrana' },
  { name: 'Cachoeiro de Itapemirim', lat: -20.8489, lng: -41.1128, region: 'Central Sul' },
  { name: 'Cariacica', lat: -20.2639, lng: -40.42, region: 'Metropolitana' },
  { name: 'Castelo', lat: -20.6039, lng: -41.2036, region: 'Central Sul' },
  { name: 'Colatina', lat: -19.5392, lng: -40.6308, region: 'Central Oeste' },
  { name: 'Conceição da Barra', lat: -18.5933, lng: -39.7322, region: 'Nordeste' },
  { name: 'Conceição do Castelo', lat: -20.3683, lng: -41.2439, region: 'Sudoeste Serrana' },
  { name: 'Divino de São Lourenço', lat: -20.6206, lng: -41.6853, region: 'Caparaó' },
  { name: 'Domingos Martins', lat: -20.3633, lng: -40.6589, region: 'Sudoeste Serrana' },
  { name: 'Dores do Rio Preto', lat: -20.6892, lng: -41.8456, region: 'Caparaó' },
  { name: 'Ecoporanga', lat: -18.3733, lng: -40.8306, region: 'Noroeste' },
  { name: 'Fundão', lat: -19.9333, lng: -40.4042, region: 'Metropolitana' },
  { name: 'Governador Lindenberg', lat: -19.2789, lng: -40.4778, region: 'Central Oeste' },
  { name: 'Guaçuí', lat: -20.7756, lng: -41.6792, region: 'Caparaó' },
  { name: 'Guarapari', lat: -20.6706, lng: -40.4975, region: 'Metropolitana' },
  { name: 'Ibatiba', lat: -20.2339, lng: -41.5108, region: 'Caparaó' },
  { name: 'Ibiraçu', lat: -19.8319, lng: -40.3697, region: 'Rio Doce' },
  { name: 'Ibitirama', lat: -20.5408, lng: -41.6669, region: 'Caparaó' },
  { name: 'Iconha', lat: -20.7931, lng: -40.8108, region: 'Litoral Sul' },
  { name: 'Irupi', lat: -20.3447, lng: -41.6406, region: 'Caparaó' },
  { name: 'Itaguaçu', lat: -19.8017, lng: -40.8558, region: 'Central Serrana' },
  { name: 'Itapemirim', lat: -21.0111, lng: -40.8339, region: 'Litoral Sul' },
  { name: 'Itarana', lat: -19.8739, lng: -40.8753, region: 'Central Serrana' },
  { name: 'Iúna', lat: -20.3458, lng: -41.5358, region: 'Caparaó' },
  { name: 'Jaguaré', lat: -18.9056, lng: -40.0761, region: 'Nordeste' },
  { name: 'Jerônimo Monteiro', lat: -20.7897, lng: -41.3961, region: 'Caparaó' },
  { name: 'João Neiva', lat: -19.7578, lng: -40.3861, region: 'Rio Doce' },
  { name: 'Laranja da Terra', lat: -19.8986, lng: -41.0569, region: 'Central Serrana' },
  { name: 'Linhares', lat: -19.3911, lng: -40.0722, region: 'Rio Doce' },
  { name: 'Mantenópolis', lat: -18.8622, lng: -41.1228, region: 'Noroeste' },
  { name: 'Marataízes', lat: -21.0433, lng: -40.8244, region: 'Litoral Sul' },
  { name: 'Marechal Floriano', lat: -20.4131, lng: -40.6831, region: 'Sudoeste Serrana' },
  { name: 'Marilândia', lat: -19.4136, lng: -40.5414, region: 'Central Oeste' },
  { name: 'Mimoso do Sul', lat: -21.0642, lng: -41.3283, region: 'Sul' },
  { name: 'Montanha', lat: -18.1269, lng: -40.3633, region: 'Nordeste' },
  { name: 'Mucurici', lat: -18.0933, lng: -40.5156, region: 'Nordeste' },
  { name: 'Muniz Freire', lat: -20.4642, lng: -41.4131, region: 'Caparaó' },
  { name: 'Muqui', lat: -20.9519, lng: -41.3458, region: 'Sul' },
  { name: 'Nova Venécia', lat: -18.7106, lng: -40.4006, region: 'Noroeste' },
  { name: 'Pancas', lat: -19.2247, lng: -40.8514, region: 'Central Oeste' },
  { name: 'Pedro Canário', lat: -18.0297, lng: -40.1492, region: 'Nordeste' },
  { name: 'Pinheiros', lat: -18.4239, lng: -40.2189, region: 'Nordeste' },
  { name: 'Piúma', lat: -20.8339, lng: -40.7244, region: 'Litoral Sul' },
  { name: 'Ponto Belo', lat: -18.1247, lng: -40.5369, region: 'Nordeste' },
  { name: 'Presidente Kennedy', lat: -21.0964, lng: -41.0486, region: 'Litoral Sul' },
  { name: 'Rio Bananal', lat: -19.2656, lng: -40.3331, region: 'Rio Doce' },
  { name: 'Rio Novo do Sul', lat: -20.8631, lng: -40.9364, region: 'Litoral Sul' },
  { name: 'Santa Leopoldina', lat: -20.1006, lng: -40.5297, region: 'Central Serrana' },
  { name: 'Santa Maria de Jetibá', lat: -20.0406, lng: -40.7461, region: 'Central Serrana' },
  { name: 'Santa Teresa', lat: -19.9356, lng: -40.6006, region: 'Central Serrana' },
  { name: 'São Domingos do Norte', lat: -19.1417, lng: -40.5847, region: 'Central Oeste' },
  { name: 'São Gabriel da Palha', lat: -19.0169, lng: -40.5361, region: 'Central Oeste' },
  { name: 'São José do Calçado', lat: -20.9806, lng: -41.6542, region: 'Caparaó' },
  { name: 'São Mateus', lat: -18.7161, lng: -39.8589, region: 'Nordeste' },
  { name: 'São Roque do Canaã', lat: -19.7389, lng: -40.6558, region: 'Central Oeste' },
  { name: 'Serra', lat: -20.1286, lng: -40.3078, region: 'Metropolitana' },
  { name: 'Sooretama', lat: -19.1969, lng: -40.0911, region: 'Rio Doce' },
  { name: 'Vargem Alta', lat: -20.6722, lng: -41.0083, region: 'Central Sul' },
  { name: 'Venda Nova do Imigrante', lat: -20.3297, lng: -41.1347, region: 'Sudoeste Serrana' },
  { name: 'Viana', lat: -20.3906, lng: -40.4958, region: 'Metropolitana' },
  { name: 'Vila Pavão', lat: -18.6144, lng: -40.6106, region: 'Noroeste' },
  { name: 'Vila Valério', lat: -18.9989, lng: -40.3889, region: 'Central Oeste' },
  { name: 'Vila Velha', lat: -20.3297, lng: -40.2925, region: 'Metropolitana' },
  { name: 'Vitória', lat: -20.3155, lng: -40.3128, region: 'Metropolitana' },
];

/**
 * Encontra o município capixaba mais próximo de uma coordenada clicada
 */
export function findClosestESMunicipality(lat: number, lng: number): ESMunicipality {
  let closest = ES_MUNICIPALITIES[0];
  let minDistance = Infinity;

  for (const m of ES_MUNICIPALITIES) {
    const dLat = m.lat - lat;
    const dLng = m.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = m;
    }
  }

  return closest;
}

/**
 * Busca coordenada central padrão por nome do município
 */
export function getCoordinatesForCity(cityName: string): { lat: number; lng: number } {
  const match = ES_MUNICIPALITIES.find(
    (m) => m.name.toLowerCase() === cityName.trim().toLowerCase()
  );
  if (match) {
    return { lat: match.lat, lng: match.lng };
  }
  // Coordenada central de Vitória como fallback
  return { lat: -20.3155, lng: -40.3128 };
}

// =================== SERVIÇOS DE PERSISTÊNCIA NO NEON DB ===================

let isTableInitialized = false;

/**
 * Garante que a tabela `campaign_visitas` exista no banco Neon DB
 */
export async function ensureVisitasTable(): Promise<void> {
  if (isTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_visitas (
        id SERIAL PRIMARY KEY,
        city VARCHAR(100) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        phone VARCHAR(50),
        role VARCHAR(100),
        address TEXT,
        notes TEXT,
        visit_date VARCHAR(30),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    isTableInitialized = true;
  } catch (err) {
    console.error('Erro ao inicializar tabela campaign_visitas no Neon DB:', err);
  }
}

/**
 * Leitura de cache local para renderização instantânea sem flash
 */
export function getLocalVisitasCache(): Visita[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Salva cópia em cache local
 */
export function setLocalVisitasCache(data: Visita[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Converte linha do Neon DB para o tipo Visita da aplicação
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToVisita(row: any): Visita {
  return {
    id: Number(row.id),
    city: String(row.city || ''),
    contactName: String(row.contact_name || ''),
    status: row.status === 'visitado' ? 'visitado' : 'pendente',
    phone: row.phone || undefined,
    role: row.role || undefined,
    address: row.address || undefined,
    notes: row.notes || undefined,
    visitDate: row.visit_date || undefined,
    latitude: Number(row.latitude) || -20.3155,
    longitude: Number(row.longitude) || -40.3128,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

/**
 * Busca todas as visitas cadastradas no Neon DB
 */
export async function fetchAllVisitas(): Promise<Visita[]> {
  try {
    await ensureVisitasTable();
    const rows = await sql`
      SELECT *
      FROM campaign_visitas
      ORDER BY id DESC;
    `;

    const visitas = rows.map(mapRowToVisita);
    setLocalVisitasCache(visitas);
    return visitas;
  } catch (err) {
    console.error('Erro ao buscar visitas no Neon DB, usando cache local:', err);
    return getLocalVisitasCache();
  }
}

/**
 * Cria uma nova visita no Neon DB
 */
export async function createVisita(input: VisitaInput): Promise<Visita> {
  await ensureVisitasTable();

  try {
    const rows = await sql`
      INSERT INTO campaign_visitas (
        city,
        contact_name,
        status,
        phone,
        role,
        address,
        notes,
        visit_date,
        latitude,
        longitude
      )
      VALUES (
        ${input.city},
        ${input.contactName},
        ${input.status},
        ${input.phone || null},
        ${input.role || null},
        ${input.address || null},
        ${input.notes || null},
        ${input.visitDate || null},
        ${input.latitude},
        ${input.longitude}
      )
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      const created = mapRowToVisita(rows[0]);
      // Atualiza cache local
      const current = getLocalVisitasCache();
      setLocalVisitasCache([created, ...current]);
      return created;
    }
  } catch (err) {
    console.error('Erro ao inserir visita no Neon DB:', err);
  }

  // Fallback caso DB esteja indisponível
  const fallback: Visita = {
    id: Date.now(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  const current = getLocalVisitasCache();
  setLocalVisitasCache([fallback, ...current]);
  return fallback;
}

/**
 * Atualiza os dados de uma visita existente
 */
export async function updateVisita(id: number, input: Partial<VisitaInput>): Promise<boolean> {
  await ensureVisitasTable();

  try {
    await sql`
      UPDATE campaign_visitas
      SET
        city = COALESCE(${input.city || null}, city),
        contact_name = COALESCE(${input.contactName || null}, contact_name),
        status = COALESCE(${input.status || null}, status),
        phone = ${input.phone !== undefined ? input.phone : null},
        role = ${input.role !== undefined ? input.role : null},
        address = ${input.address !== undefined ? input.address : null},
        notes = ${input.notes !== undefined ? input.notes : null},
        visit_date = ${input.visitDate !== undefined ? input.visitDate : null},
        latitude = COALESCE(${input.latitude || null}, latitude),
        longitude = COALESCE(${input.longitude || null}, longitude),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;

    // Atualiza cache local
    const current = getLocalVisitasCache();
    const updated = current.map((v) =>
      v.id === id ? { ...v, ...input, updatedAt: new Date().toISOString() } : v
    );
    setLocalVisitasCache(updated);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar visita no Neon DB:', err);
    return false;
  }
}

/**
 * Alterna rapidamente o status de uma visita (visitado <-> pendente)
 */
export async function toggleVisitaStatus(id: number, currentStatus: VisitStatus): Promise<VisitStatus> {
  const nextStatus: VisitStatus = currentStatus === 'visitado' ? 'pendente' : 'visitado';
  await ensureVisitasTable();

  try {
    await sql`
      UPDATE campaign_visitas
      SET
        status = ${nextStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;
  } catch (err) {
    console.error('Erro ao alterar status no Neon DB:', err);
  }

  // Atualiza cache local imediatamente
  const current = getLocalVisitasCache();
  const updated = current.map((v) => (v.id === id ? { ...v, status: nextStatus } : v));
  setLocalVisitasCache(updated);

  return nextStatus;
}

/**
 * Exclui uma visita pelo ID
 */
export async function deleteVisita(id: number): Promise<boolean> {
  await ensureVisitasTable();

  try {
    await sql`
      DELETE FROM campaign_visitas
      WHERE id = ${id};
    `;

    // Atualiza cache local
    const current = getLocalVisitasCache();
    const updated = current.filter((v) => v.id !== id);
    setLocalVisitasCache(updated);
    return true;
  } catch (err) {
    console.error('Erro ao deletar visita no Neon DB:', err);
    return false;
  }
}
