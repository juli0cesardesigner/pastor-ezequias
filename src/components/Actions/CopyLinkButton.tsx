import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './CopyLinkButton.css';

export const CopyLinkButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
    }
  };

  return (
    <div className="copy-link-container">
      <button
        type="button"
        className={`btn-copy-link-subtle ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        title="Copiar link da página"
        aria-label="Copiar link da página"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span>{copied ? 'Link Copiado!' : 'Copiar Link da Página'}</span>
      </button>
    </div>
  );
};
