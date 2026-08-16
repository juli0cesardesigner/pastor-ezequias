import React from 'react';
import { CAMPAIGN_CONFIG } from '../../config/campaign';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <p>{CAMPAIGN_CONFIG.legalNotice}</p>
    </footer>
  );
};
