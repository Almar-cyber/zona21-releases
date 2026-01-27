import { useEffect, useState, RefObject } from 'react';

interface GridConfig {
  colWidth: number;
  gap: number;
}

// Hook that calculates grid config based on container width
// CSS column-width handles the actual column count fluidly
// We just adjust the base column width for different screen sizes
export function useResponsiveGrid(containerRef?: RefObject<HTMLElement | null>) {
  const [gridConfig, setGridConfig] = useState<GridConfig>({ colWidth: 240, gap: 12 });

  useEffect(() => {
    const updateGrid = (containerWidth?: number) => {
      const width = containerWidth ?? window.innerWidth;
      let config: GridConfig;

      // Fluid column sizing - CSS will calculate actual column count
      // We set a target column width that results in good density at each size
      if (width < 500) {
        // Mobile: ~2 columns
        config = { colWidth: 180, gap: 8 };
      } else if (width < 800) {
        // Tablet: ~3 columns
        config = { colWidth: 200, gap: 10 };
      } else {
        // Desktop+: fluid 4-6 columns depending on available width
        // Using 240px gives us:
        // - ~4 columns at 1000px
        // - ~5 columns at 1200px (sidebar collapsed on 1440 screen)
        // - ~4 columns at 1000px (sidebar open on 1440 screen)
        // - ~6 columns at 1500px+ (ultrawide)
        config = { colWidth: 240, gap: 12 };
      }

      setGridConfig(config);
    };

    // Use ResizeObserver to track container size changes (sidebar collapse, window resize)
    const container = containerRef?.current;
    if (container) {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          updateGrid(entry.contentRect.width);
        }
      });
      resizeObserver.observe(container);
      updateGrid(container.clientWidth);
      return () => resizeObserver.disconnect();
    }

    // Fallback to window resize
    const handleResize = () => updateGrid();
    updateGrid();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);

  return gridConfig;
}
