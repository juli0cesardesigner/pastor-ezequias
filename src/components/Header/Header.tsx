import React from 'react';
import { CAMPAIGN_CONFIG } from '../../config/campaign';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header-container">
      <h1 className="header-title">
        Apoie o <span className="highlight">{CAMPAIGN_CONFIG.candidateName}</span>
      </h1>
    </header>
  );
};
