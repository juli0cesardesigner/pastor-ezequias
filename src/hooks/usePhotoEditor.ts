import { useState, useCallback, useEffect } from 'react';
import type { TransformState } from '../types/editor';
import type { FrameOption } from '../types/frame';
import { AVAILABLE_FRAMES } from '../config/frames';
import { DEFAULT_TRANSFORM } from '../config/campaign';
import { loadImageFromFile, loadImageFromUrl } from '../services/imageLoader';

export function usePhotoEditor() {
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(AVAILABLE_FRAMES[0]);
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [showCircularGuide, setShowCircularGuide] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load frame image whenever selectedFrame changes
  useEffect(() => {
    let isMounted = true;
    loadImageFromUrl(selectedFrame.src)
      .then((img) => {
        if (isMounted) setFrameImage(img);
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFrame]);

  // Handle Photo File Upload
  const handlePhotoSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const img = await loadImageFromFile(file);
      setUserImage(img);
      setTransform(DEFAULT_TRANSFORM); // Reset position on new photo
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar a foto.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Transformation actions
  const setZoom = useCallback((scale: number) => {
    setTransform((prev) => ({ ...prev, scale: Math.min(Math.max(scale, 0.5), 3.0) }));
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
    }));
  }, []);

  const rotate90 = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  const toggleFlip = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(DEFAULT_TRANSFORM);
  }, []);

  return {
    userImage,
    selectedFrame,
    frameImage,
    transform,
    showCircularGuide,
    isLoading,
    errorMessage,
    setSelectedFrame,
    setShowCircularGuide,
    handlePhotoSelect,
    setZoom,
    panBy,
    rotate90,
    toggleFlip,
    resetTransform,
    clearPhoto: () => {
      setUserImage(null);
      setTransform(DEFAULT_TRANSFORM);
    },
    clearError: () => setErrorMessage(null),
  };
}
