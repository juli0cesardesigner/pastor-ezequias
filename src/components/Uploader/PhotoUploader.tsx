import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Image as ImageIcon } from 'lucide-react';
import './PhotoUploader.css';

interface PhotoUploaderProps {
  onPhotoSelected: (file: File) => void;
  isLoading?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotoSelected,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPhotoSelected(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onPhotoSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`uploader-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="uploader-icon-circle">
        <UploadCloud size={36} />
      </div>

      <h3 className="uploader-title">
        {isLoading ? 'Carregando foto...' : 'Envie sua melhor foto'}
      </h3>

      <p className="uploader-desc">
        Escolha uma foto da sua galeria ou tire uma selfie na hora
      </p>

      <div className="uploader-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="uploader-btn uploader-btn-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={18} /> Galeria de Fotos
        </button>

        <button
          type="button"
          className="uploader-btn uploader-btn-secondary"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera size={18} /> Câmera / Selfie
        </button>
      </div>

      {/* Hidden standard file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden-file-input"
        onChange={handleFileChange}
      />

      {/* Hidden camera capture input for mobile devices */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden-file-input"
        onChange={handleFileChange}
      />
    </div>
  );
};
