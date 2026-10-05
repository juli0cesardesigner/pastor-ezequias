import React from 'react';
import { THERMOMETER_LEVELS } from '../../utils/electionColors';
import './ElectionThermometer.css';

interface ElectionThermometerProps {
  selectedLevelId?: string | null;
  onSelectLevel?: (levelId: string | null) => void;
}

export const ElectionThermometer: React.FC<ElectionThermometerProps> = ({
  selectedLevelId,
  onSelectLevel,
}) => {
  return (
    <div className="election-thermometer-box">
      <div className="thermometer-header">
        <span className="thermometer-title">🌡️ Termômetro de Votação</span>
        {selectedLevelId && onSelectLevel && (
          <button
            type="button"
            className="thermometer-clear-btn"
            onClick={() => onSelectLevel(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.72rem',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Limpar filtro
          </button>
        )}
      </div>

      <div className="thermometer-legend-items">
        {THERMOMETER_LEVELS.map((lvl) => {
          const isSelected = selectedLevelId === lvl.id;
          const isZero = lvl.min === 0 && lvl.max === 0;
          const isTop = lvl.min > 500;

          return (
            <div
              key={lvl.id}
              className={`thermometer-step ${isSelected ? 'is-selected' : ''} ${
                isZero ? 'step-zero' : ''
              } ${isTop ? 'step-top' : ''}`}
              onClick={() => onSelectLevel?.(isSelected ? null : lvl.id)}
              style={{ color: lvl.textColor }}
              title={
                isZero
                  ? 'Municípios onde o candidato teve 0 votos'
                  : `Municípios com ${lvl.rangeLabel}`
              }
            >
              <span
                className="step-indicator"
                style={{
                  backgroundColor: lvl.color,
                  boxShadow: `0 0 8px ${lvl.glowColor}`,
                }}
              />
              <span className="step-label">{lvl.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
