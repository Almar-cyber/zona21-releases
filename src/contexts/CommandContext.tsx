/**
 * CommandContext - Global Command Registry for Command Palette
 *
 * Provides:
 * - Command registry with categories
 * - Fuzzy search across commands
 * - Recent command history (localStorage)
 * - Context-aware command filtering
 */

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type CommandCategory =
  | 'navigation'
  | 'selection'
  | 'export'
  | 'ai'
  | 'view'
  | 'edit'
  | 'marking'
  | 'general';

export interface Command {
  id: string;
  title: string;
  shortcut?: string[];
  category: CommandCategory;
  icon?: string;
  action: () => void;
  isEnabled?: () => boolean;
  keywords?: string[];
  /** Optional context requirement (e.g., 'home', 'viewer') */
  context?: string | string[];
}

interface CommandContextValue {
  commands: Command[];
  recentCommandIds: string[];
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
  executeCommand: (id: string) => void;
  searchCommands: (query: string, activeContext?: string) => Command[];
  getCommandById: (id: string) => Command | undefined;
  clearRecentCommands: () => void;
}

// ============================================================================
// Category Labels (for display)
// ============================================================================

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'Navegação',
  selection: 'Seleção',
  export: 'Exportar',
  ai: 'IA',
  view: 'Visualização',
  edit: 'Edição',
  marking: 'Marcação',
  general: 'Geral',
};

export const CATEGORY_ORDER: CommandCategory[] = [
  'navigation',
  'marking',
  'selection',
  'edit',
  'ai',
  'export',
  'view',
  'general',
];

// ============================================================================
// Fuzzy Search
// ============================================================================

function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) {
    return { match: true, score: 100 };
  }

  // Starts with query
  if (textLower.startsWith(queryLower)) {
    return { match: true, score: 90 };
  }

  // Contains query as substring
  if (textLower.includes(queryLower)) {
    return { match: true, score: 70 };
  }

  // Fuzzy matching: all query chars appear in order
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }

  if (queryIndex === queryLower.length) {
    // All chars matched - score based on consecutive matches
    const score = 30 + (maxConsecutive / queryLower.length) * 30;
    return { match: true, score };
  }

  return { match: false, score: 0 };
}

function searchCommand(command: Command, query: string): { match: boolean; score: number } {
  // Search title
  const titleMatch = fuzzyMatch(command.title, query);
  if (titleMatch.match) {
    return titleMatch;
  }

  // Search keywords
  if (command.keywords) {
    for (const keyword of command.keywords) {
      const keywordMatch = fuzzyMatch(keyword, query);
      if (keywordMatch.match) {
        return { match: true, score: keywordMatch.score * 0.8 }; // Keywords score slightly lower
      }
    }
  }

  // Search category
  const categoryLabel = CATEGORY_LABELS[command.category];
  const categoryMatch = fuzzyMatch(categoryLabel, query);
  if (categoryMatch.match) {
    return { match: true, score: categoryMatch.score * 0.5 }; // Category matches score lower
  }

  return { match: false, score: 0 };
}

// ============================================================================
// LocalStorage Persistence
// ============================================================================

const STORAGE_KEY = 'zona21:command-history';
const MAX_RECENT = 5;

function loadRecentCommands(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as string[];
    }
  } catch (error) {
    console.error('[CommandContext] Error loading recent commands:', error);
  }
  return [];
}

function saveRecentCommands(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch (error) {
    console.error('[CommandContext] Error saving recent commands:', error);
  }
}

// ============================================================================
// Context
// ============================================================================

const CommandContext = createContext<CommandContextValue | undefined>(undefined);

export function CommandProvider({ children }: { children: ReactNode }) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>(loadRecentCommands);

  // Persist recent commands when they change
  useEffect(() => {
    saveRecentCommands(recentCommandIds);
  }, [recentCommandIds]);

  const registerCommand = useCallback((command: Command) => {
    setCommands(prev => {
      // Replace if exists, otherwise add
      const exists = prev.findIndex(c => c.id === command.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = command;
        return updated;
      }
      return [...prev, command];
    });
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCommandById = useCallback((id: string): Command | undefined => {
    return commands.find(c => c.id === id);
  }, [commands]);

  const executeCommand = useCallback((id: string) => {
    const command = commands.find(c => c.id === id);
    if (!command) return;

    // Check if enabled
    if (command.isEnabled && !command.isEnabled()) {
      return;
    }

    // Execute
    command.action();

    // Update recent commands
    setRecentCommandIds(prev => {
      const filtered = prev.filter(cid => cid !== id);
      return [id, ...filtered].slice(0, MAX_RECENT);
    });
  }, [commands]);

  const searchCommands = useCallback((query: string, activeContext?: string): Command[] => {
    // Filter by context first
    let filteredCommands = commands.filter(cmd => {
      // Check if command is enabled
      if (cmd.isEnabled && !cmd.isEnabled()) {
        return false;
      }

      // Check context requirement
      if (cmd.context) {
        const contexts = Array.isArray(cmd.context) ? cmd.context : [cmd.context];
        if (activeContext && !contexts.includes(activeContext)) {
          return false;
        }
      }

      return true;
    });

    // If no query, return recent + all by category
    if (!query.trim()) {
      // Return recent commands first, then rest grouped by category
      const recentCommands = recentCommandIds
        .map(id => filteredCommands.find(c => c.id === id))
        .filter(Boolean) as Command[];

      const nonRecent = filteredCommands.filter(
        c => !recentCommandIds.includes(c.id)
      );

      // Sort by category order
      nonRecent.sort((a, b) => {
        const aIndex = CATEGORY_ORDER.indexOf(a.category);
        const bIndex = CATEGORY_ORDER.indexOf(b.category);
        return aIndex - bIndex;
      });

      return [...recentCommands, ...nonRecent];
    }

    // Search and score
    const results = filteredCommands
      .map(cmd => {
        const { match, score } = searchCommand(cmd, query);
        return { command: cmd, match, score };
      })
      .filter(r => r.match)
      .sort((a, b) => {
        // Boost recent commands
        const aRecent = recentCommandIds.includes(a.command.id) ? 10 : 0;
        const bRecent = recentCommandIds.includes(b.command.id) ? 10 : 0;
        return (b.score + bRecent) - (a.score + aRecent);
      })
      .map(r => r.command);

    return results;
  }, [commands, recentCommandIds]);

  const clearRecentCommands = useCallback(() => {
    setRecentCommandIds([]);
  }, []);

  const value: CommandContextValue = {
    commands,
    recentCommandIds,
    registerCommand,
    unregisterCommand,
    executeCommand,
    searchCommands,
    getCommandById,
    clearRecentCommands,
  };

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useCommands(): CommandContextValue {
  const context = useContext(CommandContext);

  if (context === undefined) {
    throw new Error('useCommands must be used within a CommandProvider');
  }

  return context;
}

/**
 * Hook to register commands on mount and unregister on unmount
 */
export function useRegisterCommands(commands: Command[]): void {
  const { registerCommand, unregisterCommand } = useCommands();

  useEffect(() => {
    commands.forEach(cmd => registerCommand(cmd));

    return () => {
      commands.forEach(cmd => unregisterCommand(cmd.id));
    };
  }, [commands, registerCommand, unregisterCommand]);
}
