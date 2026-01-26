import { useEffect, useState } from 'react';

interface GridConfig {
  colWidth: number;
  gap: number;
}

export function useResponsiveGrid() {
  const [gridConfig, setGridConfig] = useState<GridConfig>({ colWidth: 220, gap: 14 });

  useEffect(() => {
    const updateGrid = () => {
      const width = window.innerWidth;
      let config: GridConfig;
      
      // Mobile
      if (width < 640) {
        config = { colWidth: 150, gap: 8 };
      }
      // Tablet
      else if (width < 1024) {
        config = { colWidth: 180, gap: 10 };
      }
      // Desktop (1366px+ = 5 colunas)
      else if (width < 1440) {
        config = { colWidth: 220, gap: 12 };
      }
      // Large Desktop
      else if (width < 1920) {
        config = { colWidth: 240, gap: 14 };
      }
      // UltraWide
      else {
        config = { colWidth: 280, gap: 16 };
      }
      
      console.log(`[Grid] Width: ${width}, Config:`, config);
      setGridConfig(config);
    };
    
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, []);

  return gridConfig;
}
