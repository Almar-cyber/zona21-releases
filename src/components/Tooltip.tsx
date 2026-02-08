import React, { useState, useRef, useEffect } from 'react';
import { useTooltipPosition } from '../utils/useTooltipPosition';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Use smart positioning to avoid screen boundaries
  const { positionClasses, style: positionStyle, arrowPosition } = useTooltipPosition(
    triggerRef,
    tooltipRef,
    {
      preferredPosition: position,
      fallbackPositions: ['bottom', 'top', 'right', 'left'],
      isVisible: isVisible && !disabled,
    }
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent'
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses} pointer-events-none`}
          style={positionStyle}
          role="tooltip"
          aria-label={content}
        >
          <div className="relative bg-[var(--color-surface-floating)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg py-1 px-2 shadow-lg whitespace-nowrap max-w-xs">
            {content}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[arrowPosition]}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface TooltipWithShortcutProps extends TooltipProps {
  shortcut: string;
}

export const TooltipWithShortcut: React.FC<TooltipWithShortcutProps> = ({
  content,
  shortcut,
  children,
  ...props
}) => {
  const fullContent = `${content} (${shortcut})`;
  return (
    <Tooltip content={fullContent} {...props}>
      {children}
    </Tooltip>
  );
};
