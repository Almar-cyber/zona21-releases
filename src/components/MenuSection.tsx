/**
 * MenuSection - Seção colapsável reutilizável para menus
 *
 * Features:
 * - Título com ícone opcional
 * - Collapsible (opcional)
 * - Animação suave
 * - Persistência de estado (localStorage)
 */

import React, { ReactNode, useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface MenuSectionProps {
  title: string;
  icon?: string; // Material icon
  collapsible?: boolean;
  defaultExpanded?: boolean;
  storageKey?: string; // Key for localStorage persistence
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function MenuSection({
  title,
  icon,
  collapsible = false,
  defaultExpanded = true,
  storageKey,
  children,
  className = ''
}: MenuSectionProps) {
  // Load persisted state
  const getInitialExpanded = (): boolean => {
    if (!storageKey) return defaultExpanded;

    try {
      const stored = localStorage.getItem(`zona21:menu-section:${storageKey}`);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[MenuSection] Error loading persisted state:', error);
    }

    return defaultExpanded;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialExpanded);

  // Persist state when it changes
  useEffect(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(
        `zona21:menu-section:${storageKey}`,
        JSON.stringify(isExpanded)
      );
    } catch (error) {
      console.error('[MenuSection] Error saving persisted state:', error);
    }
  }, [isExpanded, storageKey]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={`border-b border-[var(--color-border)] ${className}`}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className={`
          w-full px-4 py-3
          flex items-center justify-between
          text-left
          ${collapsible ? 'hover:bg-[var(--color-overlay-light)] cursor-pointer' : 'cursor-default'}
          transition-colors
        `}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="material-icons text-[var(--color-text-secondary)] text-lg">
              {icon}
            </span>
          )}
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {title}
          </span>
        </div>

        {collapsible && (
          <span
            className={`
              material-icons text-[var(--color-text-muted)] text-lg
              transition-transform duration-200
              ${isExpanded ? 'rotate-0' : '-rotate-90'}
            `}
          >
            expand_more
          </span>
        )}
      </button>

      {/* Content with smooth animation */}
      <div
        className={`
          overflow-hidden
          transition-all duration-200 ease-in-out
        `}
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MenuSectionItem - Helper component for consistent styling
// ============================================================================

export interface MenuSectionItemProps {
  icon?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

export function MenuSectionItem({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  className = ''
}: MenuSectionItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-3 py-2
        flex items-center gap-3
        text-left
        rounded-lg
        transition-colors
        ${active
          ? 'bg-[var(--color-overlay-selected)] text-[var(--color-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-light)] hover:text-[var(--color-text-primary)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && (
        <span className="material-icons text-lg">
          {icon}
        </span>
      )}
      <span className="text-sm">
        {label}
      </span>
    </button>
  );
}
