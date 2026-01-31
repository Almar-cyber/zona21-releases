/**
 * CommandPalette Component
 *
 * A Figma-style command palette (⌘K) for quick access to any action.
 *
 * Features:
 * - Fuzzy search by title and keywords
 * - Categorized results with headers
 * - Recent commands section
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Inline keyboard shortcuts display
 */

import { useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Clock } from 'lucide-react';
import Icon from './Icon';
import { Kbd, KbdCombo } from './Kbd';
import { Command, CATEGORY_LABELS, CommandCategory } from '../contexts/CommandContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: Command[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecute: (id: string) => void;
  recentCommandIds: string[];
}

// Group commands by category
function groupByCategory(
  commands: Command[],
  recentIds: string[],
  query: string
): { category: string; commands: Command[] }[] {
  // If there's no query, show recent commands first
  if (!query.trim() && recentIds.length > 0) {
    const recentCommands = recentIds
      .map(id => commands.find(c => c.id === id))
      .filter(Boolean) as Command[];

    const nonRecent = commands.filter(c => !recentIds.includes(c.id));

    const groups: { category: string; commands: Command[] }[] = [];

    if (recentCommands.length > 0) {
      groups.push({ category: 'Recentes', commands: recentCommands });
    }

    // Group remaining by category
    const byCategory = new Map<CommandCategory, Command[]>();
    for (const cmd of nonRecent) {
      const existing = byCategory.get(cmd.category) || [];
      existing.push(cmd);
      byCategory.set(cmd.category, existing);
    }

    for (const [cat, cmds] of byCategory) {
      groups.push({ category: CATEGORY_LABELS[cat], commands: cmds });
    }

    return groups;
  }

  // When searching, just group by category
  const byCategory = new Map<CommandCategory, Command[]>();
  for (const cmd of commands) {
    const existing = byCategory.get(cmd.category) || [];
    existing.push(cmd);
    byCategory.set(cmd.category, existing);
  }

  const groups: { category: string; commands: Command[] }[] = [];
  for (const [cat, cmds] of byCategory) {
    groups.push({ category: CATEGORY_LABELS[cat], commands: cmds });
  }

  return groups;
}

// Get flat index for a command in grouped view
function getFlatIndex(groups: { category: string; commands: Command[] }[], commandId: string): number {
  let index = 0;
  for (const group of groups) {
    for (const cmd of group.commands) {
      if (cmd.id === commandId) {
        return index;
      }
      index++;
    }
  }
  return -1;
}

// Get command at flat index
function getCommandAtIndex(groups: { category: string; commands: Command[] }[], flatIndex: number): Command | null {
  let index = 0;
  for (const group of groups) {
    for (const cmd of group.commands) {
      if (index === flatIndex) {
        return cmd;
      }
      index++;
    }
  }
  return null;
}

const CommandItem = memo(function CommandItem({
  command,
  isSelected,
  isRecent,
  onClick,
  onMouseEnter,
}: {
  command: Command;
  isSelected: boolean;
  isRecent: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const itemRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
        ${isSelected
          ? 'bg-[#4F46E5]/20 text-white'
          : 'text-gray-300 hover:bg-white/5'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        ${isSelected ? 'bg-[#4F46E5]/30' : 'bg-white/5'}
      `}>
        {isRecent ? (
          <Clock size={16} className="text-gray-400" />
        ) : command.icon ? (
          <Icon name={command.icon} size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
        ) : (
          <Icon name="terminal" size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
        )}
      </div>

      {/* Title */}
      <span className="flex-1 truncate text-sm font-medium">
        {command.title}
      </span>

      {/* Shortcut */}
      {command.shortcut && command.shortcut.length > 0 && (
        <div className="shrink-0">
          <KbdCombo keys={command.shortcut} />
        </div>
      )}
    </button>
  );
});

export default function CommandPalette({
  isOpen,
  onClose,
  query,
  onQueryChange,
  results,
  selectedIndex,
  onSelectIndex,
  onExecute,
  recentCommandIds,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid closing immediately on open
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groups = groupByCategory(results, recentCommandIds, query);
  const totalCount = results.length;

  // Build flat list for keyboard navigation
  let flatIndex = 0;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm">
      <div
        ref={containerRef}
        className="w-full max-w-xl mx-4 bg-[#0d0d1a]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Digite um comando..."
            className="flex-1 bg-transparent text-white text-base placeholder-gray-500 focus:outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {totalCount === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-500 text-sm">
                {query ? 'Nenhum comando encontrado' : 'Nenhum comando disponível'}
              </div>
            </div>
          ) : (
            groups.map((group) => {
              const isRecentGroup = group.category === 'Recentes';

              return (
                <div key={group.category}>
                  {/* Category Header */}
                  <div className="px-4 py-2 sticky top-0 bg-[#0d0d1a]/95 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.category}
                    </span>
                  </div>

                  {/* Commands */}
                  {group.commands.map((command) => {
                    const currentFlatIndex = flatIndex;
                    flatIndex++;

                    return (
                      <CommandItem
                        key={command.id}
                        command={command}
                        isSelected={currentFlatIndex === selectedIndex}
                        isRecent={isRecentGroup}
                        onClick={() => onExecute(command.id)}
                        onMouseEnter={() => onSelectIndex(currentFlatIndex)}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with hints */}
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Kbd size="sm">↑</Kbd>
              <Kbd size="sm">↓</Kbd>
              <span className="ml-1">navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd size="sm">Enter</Kbd>
              <span className="ml-1">executar</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd size="sm">Esc</Kbd>
              <span className="ml-1">fechar</span>
            </span>
          </div>
          <div className="text-gray-600">
            {totalCount} comando{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
