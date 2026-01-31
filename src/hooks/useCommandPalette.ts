/**
 * useCommandPalette Hook
 *
 * Manages Command Palette state:
 * - Open/close state
 * - Search query
 * - Keyboard navigation (selected index)
 * - Filtered results
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useCommands, Command } from '../contexts/CommandContext';

interface UseCommandPaletteOptions {
  /** Current active context (e.g., 'home', 'viewer') */
  activeContext?: string;
  /** Callback when palette closes */
  onClose?: () => void;
}

interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (query: string) => void;
  results: Command[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  executeSelected: () => void;
  executeCommand: (id: string) => void;
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}): UseCommandPaletteReturn {
  const { activeContext, onClose } = options;
  const { searchCommands, executeCommand: execCmd } = useCommands();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get filtered results
  const results = useMemo(() => {
    return searchCommands(query, activeContext);
  }, [searchCommands, query, activeContext]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query]);

  // Reset query when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const selectNext = useCallback(() => {
    setSelectedIndex(prev => {
      if (results.length === 0) return 0;
      return (prev + 1) % results.length;
    });
  }, [results.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex(prev => {
      if (results.length === 0) return 0;
      return (prev - 1 + results.length) % results.length;
    });
  }, [results.length]);

  const executeSelected = useCallback(() => {
    if (results.length === 0) return;
    const selected = results[selectedIndex];
    if (selected) {
      execCmd(selected.id);
      close();
    }
  }, [results, selectedIndex, execCmd, close]);

  const executeCommand = useCallback((id: string) => {
    execCmd(id);
    close();
  }, [execCmd, close]);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
        return;
      }

      // Only handle these when palette is open
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;

        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;

        case 'ArrowUp':
          e.preventDefault();
          selectPrevious();
          break;

        case 'Enter':
          e.preventDefault();
          executeSelected();
          break;

        case 'Tab':
          // Tab cycles through results
          e.preventDefault();
          if (e.shiftKey) {
            selectPrevious();
          } else {
            selectNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close, selectNext, selectPrevious, executeSelected]);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    executeSelected,
    executeCommand,
  };
}
