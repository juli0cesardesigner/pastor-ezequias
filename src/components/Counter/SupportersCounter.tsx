import React from 'react';
import { Users } from 'lucide-react';
import './SupportersCounter.css';

interface SupportersCounterProps {
  count: number;
}

export const SupportersCounter: React.FC<SupportersCounterProps> = ({ count }) => {
  const formattedCount = count.toLocaleString('pt-BR');

  return (
    <div
      className="supporters-badge-pill animate-fade-in"
      title={`${formattedCount} apoiadores já geraram sua foto oficial`}
    >
      <Users size={16} className="supporters-icon" />
      <span className="supporters-text">
        <strong>{formattedCount}</strong> {count === 1 ? 'Apoiador' : 'Apoiadores'}
      </span>
    </div>
  );
};
