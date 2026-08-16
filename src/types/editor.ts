export interface TransformState {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number; // in degrees (0, 90, 180, 270)
  flipHorizontal: boolean;
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  userImage: HTMLImageElement | null;
  frameImage: HTMLImageElement | null;
  transform: TransformState;
  showCircularGuide?: boolean;
  highResolution?: boolean;
}
