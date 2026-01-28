import { ReactNode, createContext, useContext } from 'react';

interface GridProps {
  children: ReactNode;
  variant?: 'responsive' | 'fixed' | 'dense';
  minColumnWidth?: number;
  gap?: number;
  className?: string;
}

// Context para passar o gap para os GridItems
const GridGapContext = createContext<number>(12);

export function Grid({ 
  children, 
  variant = 'responsive',
  minColumnWidth = 200,
  gap = 12,
  className = ''
}: GridProps) {
  // Usar CSS columns para layout masonry (estilo Pinterest)
  const gridStyle: React.CSSProperties = {
    columnWidth: `${minColumnWidth}px`,
    columnGap: `${gap}px`,
    width: '100%',
  };
  
  return (
    <GridGapContext.Provider value={gap}>
      <div 
        className={className}
        style={gridStyle}
      >
        {children}
      </div>
    </GridGapContext.Provider>
  );
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GridItem({ children, className = '', style }: GridItemProps) {
  const gap = useContext(GridGapContext);
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'inline-block',
        width: '100%',
        breakInside: 'avoid',
        marginBottom: `${gap}px`
      }}
    >
      {children}
    </div>
  );
}

export default Grid;
