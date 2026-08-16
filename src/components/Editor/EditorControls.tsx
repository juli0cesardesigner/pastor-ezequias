import React from 'react';
import {
  Trash2,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import './EditorControls.css';

interface EditorControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (dx: number, dy: number) => void;
  onRotate: () => void;
  onClearPhoto: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
}

const PAN_STEP = 25; // Pixels to move per click

export const EditorControls: React.FC<EditorControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onPan,
  onRotate,
  onClearPhoto,
  onDownload,
  isDownloading = false,
}) => {
  return (
    <div className="editor-controls-wrapper animate-fade-in">
      {/* Top Action Row: Trash Button + Download Button */}
      <div className="top-action-row">
        <button
          type="button"
          className="btn-trash-action"
          onClick={onClearPhoto}
          title="Remover / Escolher outra foto"
          aria-label="Remover foto"
        >
          <Trash2 size={22} />
        </button>

        <button
          type="button"
          className="btn-download-action"
          onClick={onDownload}
          disabled={isDownloading}
          title="Baixar Foto"
        >
          <Download size={20} />
          <span>{isDownloading ? 'Processando...' : 'Baixar foto'}</span>
        </button>
      </div>

      {/* Adjustments Sub-Card */}
      <div className="adjustments-subcard">
        {/* Column 1: Girar */}
        <div className="adjust-group">
          <span className="adjust-group-label">Girar</span>
          <div className="adjust-buttons-row">
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={onRotate}
              title="Girar 90 graus"
              aria-label="Girar"
            >
              <RotateCw size={20} />
            </button>
          </div>
        </div>

        {/* Separator 1 */}
        <div className="adjust-divider" />

        {/* Column 2: Zoom */}
        <div className="adjust-group">
          <span className="adjust-group-label">Zoom</span>
          <div className="adjust-buttons-row">
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={onZoomOut}
              title="Diminuir Zoom"
              aria-label="Diminuir Zoom"
            >
              <ZoomOut size={20} />
            </button>
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={onZoomIn}
              title="Aumentar Zoom"
              aria-label="Aumentar Zoom"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>

        {/* Separator 2 */}
        <div className="adjust-divider" />

        {/* Column 3: Movimentar */}
        <div className="adjust-group">
          <span className="adjust-group-label">Movimentar</span>
          <div className="adjust-buttons-row">
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={() => onPan(-PAN_STEP, 0)}
              title="Mover para esquerda"
              aria-label="Mover para esquerda"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={() => onPan(PAN_STEP, 0)}
              title="Mover para direita"
              aria-label="Mover para direita"
            >
              <ArrowRight size={20} />
            </button>
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={() => onPan(0, -PAN_STEP)}
              title="Mover para cima"
              aria-label="Mover para cima"
            >
              <ArrowUp size={20} />
            </button>
            <button
              type="button"
              className="adjust-icon-btn"
              onClick={() => onPan(0, PAN_STEP)}
              title="Mover para baixo"
              aria-label="Mover para baixo"
            >
              <ArrowDown size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
