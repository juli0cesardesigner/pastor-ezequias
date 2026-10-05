import React from 'react';
import type { ElectionTotals } from '../../types/election';
import { formatVotesBR } from '../../utils/electionColors';
import './ElectionStatsBar.css';

interface ElectionStatsBarProps {
  totais: ElectionTotals;
}

export const ElectionStatsBar: React.FC<ElectionStatsBarProps> = ({ totais }) => {
  return (
    <div className="election-stats-strip">
      <div className="stat-chip chip-total" title="Total geral apurado no estado">
        <span>🗳️ Total ES:</span>
        <strong>{formatVotesBR(totais.totalVotosEstado)}</strong>
      </div>

      <div className="stat-chip chip-success" title="Municípios onde o candidato pontuou com 1 ou mais votos">
        <span>🟢 Com Votos:</span>
        <strong>
          {totais.cidadesComVoto} / {totais.totalMunicipios} cidades
        </strong>
      </div>
    </div>
  );
};
