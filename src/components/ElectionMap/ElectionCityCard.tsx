import React from 'react';
import type { MunicipioVoto } from '../../types/election';
import { getVoteColorConfig, formatVotesBR } from '../../utils/electionColors';
import './ElectionCityCard.css';

interface ElectionCityCardProps {
  municipio: MunicipioVoto;
  rank: number;
  isSelected?: boolean;
  onSelect: (municipio: MunicipioVoto) => void;
}

export const ElectionCityCard: React.FC<ElectionCityCardProps> = ({
  municipio,
  rank,
  isSelected,
  onSelect,
}) => {
  const colorCfg = getVoteColorConfig(municipio.votos);
  const isZero = municipio.votos === 0;

  const rankClass = rank === 1 ? 'rank-top1' : rank <= 3 ? 'rank-top3' : '';

  return (
    <div
      className={`election-city-card ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(municipio)}
    >
      <div className="card-left-info">
        <span className={`city-rank-badge ${rankClass}`}>#{rank}</span>
        <div className="city-names-col">
          <span className="city-card-name">{municipio.nome}</span>
          <span className="city-card-region">{municipio.region}</span>
        </div>
      </div>

      <div className="card-right-stats">
        <span
          className={`votes-pill ${isZero ? 'votes-zero' : ''}`}
          style={
            !isZero
              ? {
                  backgroundColor: `${colorCfg.color}22`,
                  borderColor: colorCfg.color,
                  color: colorCfg.textColor,
                  boxShadow: `0 0 6px ${colorCfg.glowColor}`,
                }
              : undefined
          }
        >
          {formatVotesBR(municipio.votos)} {municipio.votos === 1 ? 'voto' : 'votos'}
        </span>

        <span className="percent-label">
          {isZero ? '0,00%' : `${municipio.pvap}% dos válidos`}
        </span>
      </div>
    </div>
  );
};
