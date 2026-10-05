import React from 'react';
import type { ElectionTotals, MobileTab } from '../../types/election';
import { formatVotesBR } from '../../utils/electionColors';
import './ElectionNavbar.css';

interface ElectionNavbarProps {
  totais: ElectionTotals;
  mobileTab: MobileTab;
  onSelectMobileTab: (tab: MobileTab) => void;
}

export const ElectionNavbar: React.FC<ElectionNavbarProps> = ({
  totais,
  mobileTab,
  onSelectMobileTab,
}) => {
  return (
    <header className="election-navbar">
      <div className="election-navbar-left">
        <div className="stat-chip chip-total" title="Total oficial apurado no Espírito Santo">
          <span>🗳️ Total no ES:</span>
          <strong>{formatVotesBR(totais.totalVotosEstado)}</strong>
        </div>

        <div className="stat-chip chip-success" title="Municípios onde o candidato pontuou com 1 ou mais votos">
          <span>🟢 Com Votos:</span>
          <strong>
            {totais.cidadesComVoto} / {totais.totalMunicipios} cidades
          </strong>
        </div>
      </div>

      {/* Switcher de abas no mobile (Mapa vs Ranking) */}
      <div className="election-mobile-tabs" role="tablist">
        <button
          type="button"
          className={`tab-toggle-btn ${mobileTab === 'mapa' ? 'active' : ''}`}
          onClick={() => onSelectMobileTab('mapa')}
        >
          🗺️ Mapa
        </button>
        <button
          type="button"
          className={`tab-toggle-btn ${mobileTab === 'ranking' ? 'active' : ''}`}
          onClick={() => onSelectMobileTab('ranking')}
        >
          🏆 Ranking
        </button>
      </div>
    </header>
  );
};
