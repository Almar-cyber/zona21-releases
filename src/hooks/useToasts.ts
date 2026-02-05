import { useState, useCallback, useRef, useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UseToastsReturn {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export function useToasts(): UseToastsReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Track timeout IDs for cleanup on unmount
  const timeoutIdsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutIdsRef.current.clear();
    };
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto-remove after 5 seconds with tracked timeout
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutIdsRef.current.delete(id);
    }, 5000);

    timeoutIdsRef.current.set(id, timeoutId);
  }, []);

  const removeToast = useCallback((id: string) => {
    // Clear timeout when manually removing
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    // Clear all timeouts when clearing toasts
    timeoutIdsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutIdsRef.current.clear();
    setToasts([]);
  }, []);

  return {
    toasts,
    pushToast,
    removeToast,
    clearToasts
  };
}
