import React, { useState, useEffect } from 'react';
import { ErrorBanner } from '../../components/UI/ErrorBanner';
import { PhotoUploader } from '../../components/Uploader/PhotoUploader';
import { CanvasPreview } from '../../components/Editor/CanvasPreview';
import { EditorControls } from '../../components/Editor/EditorControls';
import { CopyLinkButton } from '../../components/Actions/CopyLinkButton';
import { SupportersCounter } from '../../components/Counter/SupportersCounter';
import { PreviewExample } from '../../components/PreviewExample/PreviewExample';
import { usePhotoEditor } from '../../hooks/usePhotoEditor';
import { exportCompositeImage } from '../../services/imageExporter';
import {
  getStoredSupportersCount,
  fetchLiveSupportersCount,
  incrementLiveSupportersCount,
} from '../../services/counterService';
import { CAMPAIGN_CONFIG } from '../../config/campaign';

export const PhotoGeneratorPage: React.FC = () => {
  const {
    userImage,
    frameImage,
    transform,
    isLoading,
    errorMessage,
    handlePhotoSelect,
    setZoom,
    panBy,
    rotate90,
    clearPhoto,
    clearError,
  } = usePhotoEditor();

  const [isExporting, setIsExporting] = useState(false);
  const [supportersCount, setSupportersCount] = useState<number>(getStoredSupportersCount);

  useEffect(() => {
    fetchLiveSupportersCount().then(setSupportersCount);
  }, []);

  const handleDownload = async () => {
    if (!userImage || isExporting) return;
    setIsExporting(true);
    try {
      const fileName = `perfil-${CAMPAIGN_CONFIG.candidateName.toLowerCase().replace(/\s+/g, '-')}.png`;
      await exportCompositeImage(userImage, frameImage, transform, fileName);
      const updatedCount = await incrementLiveSupportersCount();
      setSupportersCount(updatedCount);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <ErrorBanner message={errorMessage} onClear={clearError} />

      {!userImage ? (
        <div className="uploader-flow-container animate-fade-in">
          <PhotoUploader
            onPhotoSelected={handlePhotoSelect}
            isLoading={isLoading}
          />
          <div className="center-row">
            <SupportersCounter count={supportersCount} />
          </div>
          <PreviewExample />
        </div>
      ) : (
        <div className="editor-flow-container animate-fade-in">
          <EditorControls
            onZoomIn={() => setZoom(transform.scale + 0.1)}
            onZoomOut={() => setZoom(transform.scale - 0.1)}
            onPan={panBy}
            onRotate={rotate90}
            onClearPhoto={clearPhoto}
            onDownload={handleDownload}
            isDownloading={isExporting}
          />

          <CanvasPreview
            userImage={userImage}
            frameImage={frameImage}
            transform={transform}
            onPan={panBy}
            onZoomChange={(delta) => setZoom(transform.scale + delta)}
          />

          <CopyLinkButton />

          <div className="center-row">
            <SupportersCounter count={supportersCount} />
          </div>

          <PreviewExample />
        </div>
      )}
    </>
  );
};
