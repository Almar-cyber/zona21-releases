import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  variant?: 'responsive' | 'fixed' | 'dense';
  minColumnWidth?: number;
  gap?: number;
  className?: string;
}

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
    <div 
      className={className}
      style={gridStyle}
    >
      {children}
    </div>
  );
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GridItem({ children, className = '', style }: GridItemProps) {
  return (
    <div 
      className={className} 
      style={{ 
        ...style, 
        breakInside: 'avoid',
        marginBottom: '12px'
      }}
    >
      {children}
    </div>
  );
}

export default Grid;
