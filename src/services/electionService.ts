import electionDataRaw from '../data/votos_ezequias_es_2026.json';
import type { ElectionData, ElectionFilter, MunicipioVoto } from '../types/election';

export const electionData: ElectionData = electionDataRaw as ElectionData;

/**
 * Retorna os dados completos da eleição
 */
export function getElectionData(): ElectionData {
  return electionData;
}

/**
 * Filtra municípios por status (todos, com_votos, zerados) e termo de busca textual
 */
export function filterMunicipalities(
  municipios: MunicipioVoto[],
  filter: ElectionFilter,
  search: string
): MunicipioVoto[] {
  const query = search.trim().toLowerCase();

  return municipios.filter((m) => {
    // Filtro de status
    if (filter === 'com_votos' && m.votos === 0) return false;
    if (filter === 'zerados' && m.votos > 0) return false;

    // Filtro de texto
    if (query) {
      const matchNome = m.nome.toLowerCase().includes(query);
      const matchRegion = m.region.toLowerCase().includes(query);
      const matchTse = m.nomeTse.toLowerCase().includes(query);
      return matchNome || matchRegion || matchTse;
    }

    return true;
  });
}

/**
 * Retorna os N municípios com maior número de votos
 */
export function getTopMunicipalities(limit = 10): MunicipioVoto[] {
  return [...electionData.municipios]
    .sort((a, b) => b.votos - a.votos)
    .slice(0, limit);
}
