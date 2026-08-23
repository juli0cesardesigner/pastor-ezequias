import React from 'react';
import { Camera, Package } from 'lucide-react';
import { useRoute } from '../../hooks/useRoute';
import { CAMPAIGN_CONFIG } from '../../config/campaign';
import './HomePage.css';

const InstagramIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsappIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

interface LinkItem {
  id: string;
  label: string;
  type: 'internal' | 'external';
  target?: string;
  href?: string;
  icon: React.ReactNode;
}

interface HomePageProps {
  onNavigate?: (route: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { navigateTo } = useRoute();
  const navigate = onNavigate || navigateTo;

  const buttons: LinkItem[] = [
    {
      id: 'apoio',
      label: 'Criar Foto de Perfil',
      type: 'internal',
      target: 'apoio',
      icon: <Camera size={20} />,
    },
    {
      id: 'materiais',
      label: 'Solicitar Materiais',
      type: 'internal',
      target: 'materiais',
      icon: <Package size={20} />,
    },
    {
      id: 'whatsapp',
      label: 'Grupo no WhatsApp',
      type: 'external',
      href: CAMPAIGN_CONFIG.whatsappGroupUrl || 'https://chat.whatsapp.com',
      icon: <WhatsappIcon />,
    },
    {
      id: 'instagram',
      label: 'Instagram Oficial',
      type: 'external',
      href: CAMPAIGN_CONFIG.instagramUrl || 'https://instagram.com',
      icon: <InstagramIcon />,
    },
  ];

  const handleButtonClick = (item: LinkItem) => {
    if (item.type === 'internal' && item.target) {
      navigate(item.target as any);
    } else if (item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="linktree-page">
      {/* Background layer */}
      <div className="linktree-bg-layer" aria-hidden="true">
        <img
          src="/bg.webp"
          alt=""
          className="linktree-bg-img"
          loading="eager"
        />
      </div>

      {/* Main Content Area */}
      <main className="linktree-container">
        {/* Top/Right Action Buttons */}
        <section className="linktree-buttons-section" aria-label="Links principais">
          <div className="linktree-buttons-grid">
            {buttons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                className="linktree-btn"
                onClick={() => handleButtonClick(btn)}
              >
                <span className="linktree-btn-icon">{btn.icon}</span>
                <span className="linktree-btn-text">{btn.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Visual Composition: Mobile & Desktop Layouts */}
        <section className="linktree-visual-section" aria-label="Apresentação do Candidato">
          {/* Pastor Ezequias Photo */}
          <div className="linktree-photo-wrap">
            <img
              src="/foto.webp"
              alt="Pastor Ezequias"
              className="linktree-photo"
              loading="eager"
            />
          </div>

          {/* Bottom Wave Graphics & Typography */}
          <div className="linktree-graphics-wrap">
            {/* Mobile Bottom Arch */}
            <img
              src="/detalhe_mobile.webp"
              alt=""
              className="linktree-wave-mobile"
              aria-hidden="true"
            />

            {/* Desktop Bottom Curve */}
            <img
              src="/detalhe_desktop.webp"
              alt=""
              className="linktree-wave-desktop"
              aria-hidden="true"
            />

            {/* Candidate Identity Overlays */}
            <div className="linktree-identity-overlay">
              <img
                src="/nome.webp"
                alt="Pastor Ezequias - Deputado Estadual"
                className="linktree-name-img"
              />
              <img
                src="/numero.webp"
                alt="15 333"
                className="linktree-number-img"
              />
              <img
                src="/slogan.webp"
                alt="Unidos pelo Espírito Santo"
                className="linktree-slogan-img"
              />
            </div>
          </div>
        </section>

        {/* Small Vertical Legal Notice in the corner */}
        <aside className="linktree-legal-notice" aria-label="Aviso Legal Eleitoral">
          <span>{CAMPAIGN_CONFIG.legalNotice}</span>
        </aside>
      </main>
    </div>
  );
};
