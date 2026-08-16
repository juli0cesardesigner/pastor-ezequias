import React from 'react';
import { Wand2 } from 'lucide-react';
import './PreviewExample.css';

export const PreviewExample: React.FC = () => {
  return (
    <section className="preview-example-card glass-card animate-fade-in">
      <div className="example-header">
        <h3 className="example-title">
          <Wand2 size={20} className="example-title-icon" />
          Como vai ficar
        </h3>
        <p className="example-subtitle">
          Apoie esta campanha adicionando a moldura à sua foto de perfil.
        </p>
      </div>

      <div className="example-equation-row">
        {/* Step 1: Sua foto */}
        <div className="example-item">
          <div className="example-thumb-box">
            <img
              src="/sample-photo.jpg"
              alt="Sua foto de perfil"
              className="example-thumb-img"
              loading="lazy"
            />
          </div>
          <span className="example-label">Sua foto</span>
        </div>

        {/* Operator + */}
        <span className="example-operator">+</span>

        {/* Step 2: Moldura */}
        <div className="example-item">
          <div className="example-thumb-box example-frame-box">
            <img
              src="/frames/APOIO.png"
              alt="Moldura oficial da campanha"
              className="example-thumb-img"
              loading="lazy"
            />
          </div>
          <span className="example-label">Moldura</span>
        </div>

        {/* Operator = */}
        <span className="example-operator">=</span>

        {/* Step 3: Resultado */}
        <div className="example-item">
          <div className="example-thumb-box example-composite-box">
            <img
              src="/sample-photo.jpg"
              alt="Foto aplicada"
              className="example-composite-photo"
              loading="lazy"
            />
            <img
              src="/frames/APOIO.png"
              alt="Moldura sobreposta"
              className="example-composite-frame"
              loading="lazy"
            />
          </div>
          <span className="example-label">Resultado</span>
        </div>
      </div>
    </section>
  );
};
