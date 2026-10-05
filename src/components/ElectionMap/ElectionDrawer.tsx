import React, { useState, useMemo } from 'react';
import type { MunicipioVoto, BairroVoto, ElectionFilter } from '../../types/election';
import { ElectionCityCard } from './ElectionCityCard';
import { ElectionBairroCard } from './ElectionBairroCard';
import { formatVotesBR } from '../../utils/electionColors';
import './ElectionDrawer.css';

interface ElectionDrawerProps {
  municipios: MunicipioVoto[];
  bairros: BairroVoto[];
  selectedCityName?: string | null;
  onSelectCity: (city: MunicipioVoto) => void;
  selectedBairroName?: string | null;
  onSelectBairro: (bairro: BairroVoto) => void;
  filter: ElectionFilter;
  onChangeFilter: (f: ElectionFilter) => void;
  searchTerm: string;
  onChangeSearch: (s: string) => void;
  totalComVotos: number;
  totalColatinaVotos: number;
}

export const ElectionDrawer: React.FC<ElectionDrawerProps> = ({
  municipios,
  bairros,
  selectedCityName,
  onSelectCity,
  selectedBairroName,
  onSelectBairro,
  filter,
  onChangeFilter,
  searchTerm,
  onChangeSearch,
  totalComVotos,
  totalColatinaVotos,
}) => {
  const [sortBy, setSortBy] = useState<'votos' | 'nome'>('votos');

  const sortedList = useMemo(() => {
    const list = [...municipios];
    if (sortBy === 'nome') {
      list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else {
      list.sort((a, b) => b.votos - a.votos);
    }
    return list;
  }, [municipios, sortBy]);

  const filteredBairros = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return bairros;
    return bairros.filter((b) => {
      if (b.nome.toLowerCase().includes(term)) return true;
      if (b.principaisLocais?.some((l) => l.toLowerCase().includes(term))) return true;
      return false;
    });
  }, [bairros, searchTerm]);

  const sortedBairros = useMemo(() => {
    const list = [...filteredBairros];
    if (sortBy === 'nome') {
      list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else {
      list.sort((a, b) => b.votos - a.votos);
    }
    return list;
  }, [filteredBairros, sortBy]);

  const isBairrosActive = filter === 'bairros_colatina';

  return (
    <aside className="election-drawer">
      <div className="drawer-header">
        {/* Caixa de Busca */}
        <div className="search-box-wrapper">
          <span className="search-icon-prefix">🔍</span>
          <input
            type="text"
            className="drawer-search-input"
            placeholder={
              isBairrosActive
                ? 'Buscar bairro ou escola de Colatina...'
                : 'Buscar município capixaba...'
            }
            value={searchTerm}
            onChange={(e) => onChangeSearch(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onChangeSearch('')}
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {/* Linha de Filtros por Categoria */}
        <div className="drawer-filter-row">
          <button
            type="button"
            className={`filter-btn-chip ${filter === 'todos' ? 'active' : ''}`}
            onClick={() => onChangeFilter('todos')}
          >
            Todos (78)
          </button>
          <button
            type="button"
            className={`filter-btn-chip ${filter === 'com_votos' ? 'active' : ''}`}
            onClick={() => onChangeFilter('com_votos')}
          >
            🟢 Com Votos ({totalComVotos})
          </button>
          <button
            type="button"
            className={`filter-btn-chip filter-btn-bairros ${isBairrosActive ? 'active' : ''}`}
            onClick={() => onChangeFilter('bairros_colatina')}
            title="Ver ranking e distribuição dos 47 bairros de Colatina"
          >
            🏘️ Bairros Colatina ({bairros.length})
          </button>
        </div>

        {/* Barra de Ordenação e Contador */}
        <div className="drawer-sort-bar">
          <span>
            {isBairrosActive
              ? `Mostrando ${sortedBairros.length} bairros (${formatVotesBR(totalColatinaVotos)} votos)`
              : `Mostrando ${sortedList.length} cidades`}
          </span>
          <button
            type="button"
            className="sort-toggle-btn"
            onClick={() => setSortBy((prev) => (prev === 'votos' ? 'nome' : 'votos'))}
          >
            Ordenar: {sortBy === 'votos' ? '🔥 Mais votados' : '🔤 Nome (A-Z)'}
          </button>
        </div>
      </div>

      {/* Lista Rolável */}
      <div className="drawer-cards-scroll">
        {isBairrosActive ? (
          sortedBairros.length === 0 ? (
            <div className="empty-results-box">
              <span className="empty-icon">🏘️</span>
              <p>Nenhum bairro de Colatina encontrado para essa busca.</p>
            </div>
          ) : (
            sortedBairros.map((b, idx) => (
              <ElectionBairroCard
                key={b.id || b.nome}
                bairro={b}
                rank={idx + 1}
                isSelected={selectedBairroName?.toLowerCase() === b.nome.toLowerCase()}
                onSelect={onSelectBairro}
              />
            ))
          )
        ) : sortedList.length === 0 ? (
          <div className="empty-results-box">
            <span className="empty-icon">📍</span>
            <p>Nenhum município encontrado para essa busca.</p>
          </div>
        ) : (
          sortedList.map((m, idx) => (
            <ElectionCityCard
              key={m.cdTse || m.nome}
              municipio={m}
              rank={idx + 1}
              isSelected={selectedCityName === m.nome}
              onSelect={onSelectCity}
            />
          ))
        )}
      </div>
    </aside>
  );
};

