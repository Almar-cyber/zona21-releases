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
    gap: gap ? `${gap}px` : '12px',
    gridTemplateColumns: variant === 'responsive' 
      ? window.innerWidth >= 1366 
        ? `repeat(auto-fill, minmax(${minColumnWidth || 220}px, 1fr))`
        : `repeat(auto-fill, minmax(${minColumnWidth || 200}px, 1fr))`
      : undefined,
    width: '100%',
    maxWidth: '100%',
    minWidth: '0'
  };
  
  console.log('[Grid] Style:', gridStyle, 'Props:', { variant, minColumnWidth, gap });
  console.log('[Grid] Window width:', window.innerWidth, 'Available width:', window.innerWidth - 280);
  
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
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export default Grid;
