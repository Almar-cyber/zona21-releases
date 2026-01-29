import { useState, useCallback } from 'react';

export interface ZoomPanState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface UseZoomSyncReturn {
  zoomPanState: ZoomPanState;
  isSyncEnabled: boolean;
  isPanEnabled: boolean;

  // Actions
  setZoom: (scale: number) => void;
  setPan: (offsetX: number, offsetY: number) => void;
  resetZoomPan: () => void;
  toggleSync: () => void;
  togglePan: () => void;

  // Convenience methods
  zoomIn: () => void;
  zoomOut: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.5;

export function useZoomSync(): UseZoomSyncReturn {
  const [zoomPanState, setZoomPanState] = useState<ZoomPanState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isPanEnabled, setIsPanEnabled] = useState(false);

  const setZoom = useCallback((scale: number) => {
    const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
    setZoomPanState((prev) => ({
      ...prev,
      scale: clampedScale,
      // Reset pan when zoom changes if pan is disabled
      offsetX: isPanEnabled ? prev.offsetX : 0,
      offsetY: isPanEnabled ? prev.offsetY : 0,
    }));
  }, [isPanEnabled]);

  const setPan = useCallback((offsetX: number, offsetY: number) => {
    if (!isPanEnabled) return;
    setZoomPanState((prev) => ({
      ...prev,
      offsetX,
      offsetY,
    }));
  }, [isPanEnabled]);

  const resetZoomPan = useCallback(() => {
    setZoomPanState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  const toggleSync = useCallback(() => {
    setIsSyncEnabled((prev) => !prev);
  }, []);

  const togglePan = useCallback(() => {
    setIsPanEnabled((prev) => {
      const newValue = !prev;
      // Reset pan when disabling
      if (!newValue) {
        setZoomPanState((state) => ({
          ...state,
          offsetX: 0,
          offsetY: 0,
        }));
      }
      return newValue;
    });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(zoomPanState.scale + ZOOM_STEP);
  }, [zoomPanState.scale, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoomPanState.scale - ZOOM_STEP);
  }, [zoomPanState.scale, setZoom]);

  return {
    zoomPanState,
    isSyncEnabled,
    isPanEnabled,
    setZoom,
    setPan,
    resetZoomPan,
    toggleSync,
    togglePan,
    zoomIn,
    zoomOut,
  };
}
