import { useEffect, useState, RefObject } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface UseTooltipPositionOptions {
  preferredPosition?: TooltipPosition;
  fallbackPositions?: TooltipPosition[];
  offset?: number; // Distance from trigger (default: 8px)
  safeMargin?: number; // Min distance from screen edge (default: 16px)
  isVisible?: boolean; // Only calculate when tooltip is visible
}

export interface TooltipPositionResult {
  position: TooltipPosition;
  positionClasses: string;
  style: React.CSSProperties;
  arrowPosition: TooltipPosition;
}

const POSITION_CLASSES: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2',
  bottom: 'top-full left-1/2 -translate-x-1/2',
  left: 'right-full top-1/2 -translate-y-1/2',
  right: 'left-full top-1/2 -translate-y-1/2',
};

const ARROW_POSITION_MAP: Record<TooltipPosition, TooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Hook that intelligently positions tooltips to avoid screen boundaries
 * Automatically detects viewport constraints and picks the best position
 */
export function useTooltipPosition(
  triggerRef: RefObject<HTMLElement>,
  tooltipRef: RefObject<HTMLElement>,
  options: UseTooltipPositionOptions = {}
): TooltipPositionResult {
  const {
    preferredPosition = 'top',
    fallbackPositions = ['bottom', 'right', 'left'],
    offset = 8,
    safeMargin = 16,
    isVisible = true,
  } = options;

  const [result, setResult] = useState<TooltipPositionResult>({
    position: preferredPosition,
    positionClasses: POSITION_CLASSES[preferredPosition],
    style: {},
    arrowPosition: ARROW_POSITION_MAP[preferredPosition],
  });

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const calculatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;

      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Try preferred position first, then fallbacks
      const positionsToTry = [preferredPosition, ...fallbackPositions];
      let bestPosition: TooltipPosition = preferredPosition;
      let bestFit = -Infinity;

      for (const position of positionsToTry) {
        const fit = calculateFit(position, triggerRect, tooltipRect, viewport, offset, safeMargin);

        // If this position fits perfectly (no clipping), use it immediately
        if (fit >= 0) {
          bestPosition = position;
          break;
        }

        // Otherwise, track the least-bad option
        if (fit > bestFit) {
          bestFit = fit;
          bestPosition = position;
        }
      }

      setResult({
        position: bestPosition,
        positionClasses: POSITION_CLASSES[bestPosition],
        style: {
          marginTop: bestPosition === 'bottom' ? `${offset}px` : bestPosition === 'top' ? `-${offset}px` : undefined,
          marginLeft: bestPosition === 'right' ? `${offset}px` : bestPosition === 'left' ? `-${offset}px` : undefined,
        },
        arrowPosition: ARROW_POSITION_MAP[bestPosition],
      });
    };

    // Calculate immediately
    calculatePosition();

    // Recalculate on scroll/resize
    const handleUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [triggerRef, tooltipRef, preferredPosition, fallbackPositions, offset, safeMargin, isVisible]);

  return result;
}

/**
 * Calculate how well a tooltip fits in a given position
 * Returns a positive number if it fits within safe margins
 * Returns a negative number indicating overflow if it doesn't fit
 */
function calculateFit(
  position: TooltipPosition,
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  viewport: { width: number; height: number },
  offset: number,
  safeMargin: number
): number {
  let tooltipTop = 0;
  let tooltipLeft = 0;

  // Calculate hypothetical tooltip position
  switch (position) {
    case 'top':
      tooltipTop = triggerRect.top - tooltipRect.height - offset;
      tooltipLeft = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'bottom':
      tooltipTop = triggerRect.bottom + offset;
      tooltipLeft = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'left':
      tooltipTop = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      tooltipLeft = triggerRect.left - tooltipRect.width - offset;
      break;
    case 'right':
      tooltipTop = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      tooltipLeft = triggerRect.right + offset;
      break;
  }

  const tooltipRight = tooltipLeft + tooltipRect.width;
  const tooltipBottom = tooltipTop + tooltipRect.height;

  // Calculate overflow for each edge
  const overflowTop = safeMargin - tooltipTop;
  const overflowBottom = tooltipBottom - (viewport.height - safeMargin);
  const overflowLeft = safeMargin - tooltipLeft;
  const overflowRight = tooltipRight - (viewport.width - safeMargin);

  // Get the maximum overflow (most problematic edge)
  const maxOverflow = Math.max(overflowTop, overflowBottom, overflowLeft, overflowRight);

  // If maxOverflow <= 0, tooltip fits within safe margins (good!)
  // If maxOverflow > 0, tooltip is clipped by that many pixels (bad!)
  return -maxOverflow;
}
