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
  minColumnWidth,
  gap,
  className = ''
}: GridProps) {
  const gridStyle = {
    display: 'grid',
    gap: gap ? `${gap}px` : undefined,
    gridTemplateColumns: variant === 'responsive' 
      ? `repeat(auto-fill, minmax(${minColumnWidth || 200}px, 1fr))`
      : undefined,
    width: '100%'
  };

  const variantClass = variant === 'dense' ? 'zona-grid--dense' : '';
  
  return (
    <div 
      className={`zona-grid zona-grid--${variant} ${variantClass} ${className}`}
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
    <div className={`zona-grid__item ${className}`} style={style}>
      {children}
    </div>
  );
}

export default Grid;
