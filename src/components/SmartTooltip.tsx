/**
 * SmartTooltip Component
 *
 * Tooltip inteligente que:
 * - Rastreia se já foi visto (showOnce)
 * - Suporta trigger automático após delay
 * - Pode ter condições customizadas para aparecer
 * - Integra com onboarding service para persistência
 */

import React, { useState, useRef, useEffect } from 'react';
import { onboardingService } from '../services/onboarding-service';
import Icon from './Icon';
import { useTooltipPosition } from '../utils/useTooltipPosition';

export interface SmartTooltipProps {
  id: string; // Identificador único para tracking
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'focus' | 'auto'; // 'auto' = aparece automaticamente
  showOnce?: boolean; // Se true, só mostra uma vez
  delay?: number; // Delay antes de aparecer (ms)
  autoDelay?: number; // Delay para trigger auto (ms)
  condition?: () => boolean; // Condição customizada
  disabled?: boolean;
  className?: string;
  onShown?: () => void; // Callback quando tooltip é mostrado
  onDismiss?: () => void; // Callback quando tooltip é fechado
}

export default function SmartTooltip({
  id,
  content,
  children,
  position = 'top',
  trigger = 'hover',
  showOnce = false,
  delay = 300,
  autoDelay = 2000,
  condition,
  disabled = false,
  className = '',
  onShown,
  onDismiss
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const autoTimeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Verificar se deve mostrar o tooltip
  const shouldShow = onboardingService.shouldShowTooltip(id, {
    id,
    showOnce,
    condition
  });

  // Use smart positioning to avoid screen boundaries
  const { positionClasses: smartPositionClasses, style: positionStyle, arrowPosition } = useTooltipPosition(
    triggerRef,
    tooltipRef,
    {
      preferredPosition: position,
      fallbackPositions: ['bottom', 'top', 'right', 'left'],
      isVisible: isVisible && shouldShow,
    }
  );

  useEffect(() => {
    // Auto-trigger
    if (trigger === 'auto' && shouldShow && !hasBeenShown && !disabled) {
      autoTimeoutRef.current = setTimeout(() => {
        showTooltip();
      }, autoDelay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, [trigger, shouldShow, hasBeenShown, disabled, autoDelay]);

  const showTooltip = () => {
    if (disabled || !shouldShow || hasBeenShown) return;

    setIsVisible(true);
    setHasBeenShown(true);
    onboardingService.markTooltipSeen(id);

    if (onShown) {
      onShown();
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);

    if (onDismiss) {
      onDismiss();
    }
  };

  const handleMouseEnter = () => {
    if (disabled || trigger === 'auto' || !shouldShow) return;

    timeoutRef.current = setTimeout(() => {
      showTooltip();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hideTooltip();
  };

  const handleFocus = () => {
    if (disabled || trigger === 'auto' || !shouldShow) return;
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  // Arrow classes for each position
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--color-surface-floating)] border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-surface-floating)] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--color-surface-floating)] border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-[var(--color-surface-floating)] border-y-transparent border-l-transparent'
  };

  // Se não deve mostrar, retornar apenas children
  if (!shouldShow) {
    return children;
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-[250] ${smartPositionClasses} animate-in fade-in zoom-in-95 duration-200`}
          style={positionStyle}
          role="tooltip"
          aria-label={typeof content === 'string' ? content : undefined}
        >
          <div
            className={`relative bg-[var(--color-surface-floating)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg py-2 px-3 shadow-lg shadow-black/20 ${className}`}
            style={{ maxWidth: '280px' }}
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-[6px] ${arrowClasses[arrowPosition]}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VARIANT: Tooltip com Keyboard Shortcut
// ============================================================================

interface SmartTooltipWithShortcutProps extends Omit<SmartTooltipProps, 'content'> {
  content: string;
  shortcut: string;
}

export function SmartTooltipWithShortcut({
  content,
  shortcut,
  ...props
}: SmartTooltipWithShortcutProps) {
  const tooltipContent = (
    <div className="flex items-center gap-2">
      <span>{content}</span>
      <kbd className="px-1.5 py-0.5 bg-[var(--color-overlay-light)] rounded text-[10px] font-mono border border-[var(--color-border-hover)]">
        {shortcut}
      </kbd>
    </div>
  );

  return <SmartTooltip content={tooltipContent} {...props} />;
}

// ============================================================================
// VARIANT: Tooltip com Rich Content
// ============================================================================

interface SmartTooltipRichProps extends Omit<SmartTooltipProps, 'content'> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SmartTooltipRich({
  title,
  description,
  icon,
  action,
  ...props
}: SmartTooltipRichProps) {
  const tooltipContent = (
    <div className="space-y-2">
      {icon && (
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
      )}
      {!icon && <div className="font-semibold text-sm">{title}</div>}

      <p className="text-[var(--color-text-secondary)] leading-relaxed">{description}</p>

      {action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className="w-full mt-2 px-3 py-1.5 mh-btn mh-btn-indigo text-white rounded-md text-xs font-medium transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  return <SmartTooltip content={tooltipContent} {...props} className="max-w-xs" />;
}

// ============================================================================
// VARIANT: Pro Tip Toast-style
// ============================================================================

interface ProTipTooltipProps extends Omit<SmartTooltipProps, 'content' | 'position'> {
  tip: string;
  dismissible?: boolean;
}

export function ProTipTooltip({
  tip,
  dismissible = true,
  onDismiss,
  ...props
}: ProTipTooltipProps) {
  const handleDismiss = () => {
    onboardingService.dismissTip(props.id);
    if (onDismiss) {
      onDismiss();
    }
  };

  const tooltipContent = (
    <div className="flex items-start gap-2">
      <Icon name="lightbulb" size={14} className="text-[var(--color-status-favorite)] flex-shrink-0" />
      <div className="flex-1">
        <div className="text-[10px] font-semibold text-[var(--color-status-favorite)] mb-0.5">PRO TIP</div>
        <p className="text-[var(--color-text-primary)] leading-relaxed">{tip}</p>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition flex-shrink-0"
          aria-label="Dispensar dica"
        >
          ×
        </button>
      )}
    </div>
  );

  return <SmartTooltip content={tooltipContent} position="bottom" {...props} />;
}
