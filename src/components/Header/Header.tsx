import React from 'react';
import { CAMPAIGN_CONFIG } from '../../config/campaign';
import './Header.css';

interface HeaderProps {
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ subtitle }) => {
  return (
    <header className="header-container">
      <h1 className="header-title">
        Apoie o <span className="highlight">{CAMPAIGN_CONFIG.candidateName}</span>
      </h1>
      {subtitle && <h2 className="header-subtitle-gold">{subtitle}</h2>}
    </header>
  );
};
