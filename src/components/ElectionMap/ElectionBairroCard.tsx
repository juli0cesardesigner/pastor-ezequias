import React from 'react';
import type { BairroVoto } from '../../types/election';
import { getVoteColorConfig, formatVotesBR } from '../../utils/electionColors';
import './ElectionCityCard.css';

interface ElectionBairroCardProps {
  bairro: BairroVoto;
  rank: number;
  isSelected?: boolean;
  onSelect: (bairro: BairroVoto) => void;
}

export const ElectionBairroCard: React.FC<ElectionBairroCardProps> = ({
  bairro,
  rank,
  isSelected,
  onSelect,
}) => {
  const colorCfg = getVoteColorConfig(bairro.votos);
  const isZero = bairro.votos === 0;
  const rankClass = rank === 1 ? 'rank-top1' : rank <= 3 ? 'rank-top3' : '';

  const mainLocal =
    bairro.principaisLocais && bairro.principaisLocais.length > 0
      ? bairro.principaisLocais[0]
      : null;

  return (
    <div
      className={`election-city-card election-bairro-card ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(bairro)}
    >
      <div className="card-left-info">
        <span className={`city-rank-badge ${rankClass}`}>#{rank}</span>
        <div className="city-names-col">
          <span className="city-card-name">{bairro.nome}</span>
          <span className="city-card-region">
            {bairro.secoesCount
              ? `${bairro.secoesCount} ${bairro.secoesCount === 1 ? 'seção' : 'seções'}`
              : 'Colatina'}
            {mainLocal ? ` • ${mainLocal}` : ''}
          </span>
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
          {formatVotesBR(bairro.votos)} {bairro.votos === 1 ? 'voto' : 'votos'}
        </span>

        <span className="percent-label">
          {bairro.percentualCidade}% de Colatina
        </span>
      </div>
    </div>
  );
};
