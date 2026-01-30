/**
 * Responsive Utilities
 *
 * Utilities para gerenciar breakpoints e comportamento responsivo
 */

// ============================================================================
// Breakpoints (seguindo padrão Tailwind)
// ============================================================================

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ============================================================================
// Media Queries
// ============================================================================

export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
} as const;

// ============================================================================
// Device Detection
// ============================================================================

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ============================================================================
// Responsive Hook
// ============================================================================

export function useResponsive() {
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowWidth,
    isMobile: windowWidth < BREAKPOINTS.md,
    isTablet: windowWidth >= BREAKPOINTS.md && windowWidth < BREAKPOINTS.lg,
    isDesktop: windowWidth >= BREAKPOINTS.lg,
    isXl: windowWidth >= BREAKPOINTS.xl,
    is2Xl: windowWidth >= BREAKPOINTS['2xl'],
    breakpoint: Object.entries(BREAKPOINTS)
      .reverse()
      .find(([_, width]) => windowWidth >= width)?.[0] as Breakpoint,
  };
}

// Need to import React for the hook
import React from 'react';

// ============================================================================
// Responsive Classes Helper
// ============================================================================

export function getResponsiveClasses(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string {
  const classes = [base];
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  return classes.join(' ');
}

// ============================================================================
// Touch Utilities
// ============================================================================

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export function useSwipe(
  onSwipe: (event: SwipeEvent) => void,
  threshold: number = 50
) {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine direction
    let direction: SwipeEvent['direction'];
    let distance: number;

    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
      distance = absX;
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
      distance = absY;
    }

    // Only trigger if above threshold
    if (distance >= threshold) {
      const velocity = distance / deltaTime;
      onSwipe({ direction, distance, velocity });
    }

    setTouchStart(null);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// ============================================================================
// Orientation Detection
// ============================================================================

export type Orientation = 'portrait' | 'landscape';

export function getOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

export function useOrientation() {
  const [orientation, setOrientation] = React.useState<Orientation>(getOrientation());

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

// ============================================================================
// Viewport Height Fix (for mobile browsers)
// ============================================================================

export function useViewportHeight() {
  React.useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}

// ============================================================================
// Safe Area Insets (for notch/home indicator)
// ============================================================================

export function useSafeAreaInsets() {
  const [insets, setInsets] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  React.useEffect(() => {
    const getInset = (prop: string): number => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(prop);
      return parseInt(value) || 0;
    };

    const updateInsets = () => {
      setInsets({
        top: getInset('--safe-area-inset-top') || getInset('env(safe-area-inset-top)'),
        right: getInset('--safe-area-inset-right') || getInset('env(safe-area-inset-right)'),
        bottom: getInset('--safe-area-inset-bottom') || getInset('env(safe-area-inset-bottom)'),
        left: getInset('--safe-area-inset-left') || getInset('env(safe-area-inset-left)'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);

    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}

// ============================================================================
// Mobile Menu Defaults
// ============================================================================

export const MOBILE_MENU_DEFAULTS = {
  collapsedByDefault: true,
  overlayMode: true,
  fullWidth: true,
  swipeToClose: true,
} as const;

// ============================================================================
// Performance Helpers
// ============================================================================

export function shouldUseReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(shouldUseReducedMotion());

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
