import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ErrorBanner.css';

interface ErrorBannerProps {
  message: string | null;
  onClear: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="error-banner animate-fade-in" role="alert">
      <span className="error-banner-content">
        <AlertCircle size={16} />
        <span>{message}</span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="error-banner-close-btn"
        aria-label="Fechar mensagem de erro"
      >
        <X size={16} />
      </button>
    </div>
  );
};
