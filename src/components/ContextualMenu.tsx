/**
 * ContextualMenu - Componente base para menus laterais colapsáveis
 *
 * Features:
 * - Collapsible (expand/collapse)
 * - Floating icon button quando collapsed
 * - Resizable (drag na borda)
 * - Animações suaves
 * - Suporte para left/right sides
 */

import React, { ReactNode, useRef, useState, useEffect } from 'react';
import { MenuSide } from '../contexts/MenuContext';
import { useResponsive, useSwipe } from '../utils/responsive';

// ============================================================================
// Types
// ============================================================================

export interface ContextualMenuProps {
  side: MenuSide;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange?: (width: number) => void;
  children: ReactNode;
  floatingIcon?: string; // Material icon when collapsed
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLLAPSED_WIDTH = 48;
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const RESIZE_HANDLE_WIDTH = 4;

// ============================================================================
// Component
// ============================================================================

export function ContextualMenu({
  side,
  isCollapsed,
  onToggleCollapse,
  width,
  onWidthChange,
  children,
  floatingIcon = 'menu',
  className = ''
}: ContextualMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);

  // Responsive behavior
  const { isMobile } = useResponsive();

  // Swipe gesture support for mobile
  const swipeHandlers = useSwipe((event) => {
    if (!isMobile) return;

    // Swipe right closes left menu, swipe left closes right menu
    if ((side === 'left' && event.direction === 'left') ||
        (side === 'right' && event.direction === 'right')) {
      if (!isCollapsed) {
        onToggleCollapse();
      }
    }
  }, 50);

  // ========================================================================
  // Resize Logic
  // ========================================================================

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onWidthChange) return;

      const delta = side === 'left' ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, startWidth, side, onWidthChange]);

  // ========================================================================
  // Styles
  // ========================================================================

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : width;

  const menuStyles: React.CSSProperties = {
    width: `${currentWidth}px`,
    transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const positionClasses = side === 'left' ? 'left-0' : 'right-0';
  const resizeHandleClasses = side === 'left' ? 'right-0' : 'left-0';

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      ref={menuRef}
      className={`
        fixed top-0 bottom-0 z-[110]
        bg-[var(--color-surface-floating)]/95 backdrop-blur-xl
        ${side === 'left' ? 'border-r' : 'border-l'} border-[var(--color-border)]
        flex flex-col
        ${positionClasses}
        ${isMobile && !isCollapsed ? 'w-full' : ''}
        ${className}
      `}
      style={isMobile && !isCollapsed ? undefined : menuStyles}
      {...(isMobile ? swipeHandlers : {})}
    >
      {/* Floating Icon Button (when collapsed) */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-10 h-10
            flex items-center justify-center
            rounded-lg
            bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)]
            transition-all duration-200
            group
          "
          aria-label={`Expand ${side} menu`}
        >
          <span className="material-icons text-[rgba(var(--overlay-rgb),0.70)] group-hover:text-[var(--color-text-primary)] text-xl">
            {floatingIcon}
          </span>
        </button>
      )}

      {/* Menu Content (when expanded) */}
      {!isCollapsed && (
        <>
          {/* Header with collapse button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <button
              onClick={onToggleCollapse}
              className="
                flex items-center justify-center
                w-8 h-8
                rounded-lg
                hover:bg-[var(--color-overlay-light)]
                transition-colors
              "
              aria-label={`Collapse ${side} menu`}
            >
              <span className="material-icons text-[rgba(var(--overlay-rgb),0.70)] hover:text-[var(--color-text-primary)] text-xl">
                {side === 'left' ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </>
      )}

      {/* Resize Handle (when expanded) */}
      {!isCollapsed && onWidthChange && (
        <div
          className={`
            absolute top-0 bottom-0 ${resizeHandleClasses}
            w-[${RESIZE_HANDLE_WIDTH}px]
            cursor-col-resize
            hover:bg-[var(--color-primary)]/30
            transition-colors
            group
          `}
          onMouseDown={handleResizeStart}
          style={{ width: `${RESIZE_HANDLE_WIDTH}px` }}
        >
          {/* Visual indicator on hover */}
          <div className="
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-1 h-8
            bg-[var(--color-primary)]
            rounded-full
            opacity-0 group-hover:opacity-100
            transition-opacity
          " />
        </div>
      )}

      {/* Cursor overlay during resize */}
      {isResizing && (
        <div className="fixed inset-0 z-[200] cursor-col-resize" />
      )}
    </div>
  );
}
