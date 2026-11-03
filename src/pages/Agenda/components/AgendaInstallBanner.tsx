import React, { useState, useEffect } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AgendaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando em modo standalone (PWA instalado)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);

    // Detecta iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="agenda-install-banner">
      <div className="install-banner-icon">
        <Smartphone size={22} />
      </div>
      <div className="install-banner-content">
        <h4>Instale a Agenda no seu Celular</h4>
        {isIOS ? (
          <p>
            Toque no botão <Share2 size={13} className="inline-icon" /> <strong>Compartilhar</strong> do Safari e depois em <strong>"Adicionar à Tela de Início"</strong> para receber avisos e ter acesso direto.
          </p>
        ) : (
          <p>Instale como aplicativo para receber notificações de compromissos mesmo com o app fechado.</p>
        )}
      </div>

      <div className="install-banner-actions">
        {deferredPrompt && (
          <button className="btn-install" onClick={handleInstallClick}>
            <Download size={14} /> Instalar
          </button>
        )}
        <button className="btn-close" onClick={() => setDismissed(true)} aria-label="Fechar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

