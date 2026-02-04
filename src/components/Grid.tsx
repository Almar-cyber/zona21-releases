import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  variant?: 'responsive' | 'fixed' | 'dense' | 'masonry';
  minColumnWidth?: number;
  gap?: number;
  className?: string;
}

export function Grid({
  children,
  variant = 'responsive',
  minColumnWidth = 180,
  gap = 12,
  className = ''
}: GridProps) {
  // Use CSS Columns for masonry/dense layout - eliminates gaps with variable height items
  if (variant === 'dense' || variant === 'masonry') {
    const masonryStyle: React.CSSProperties = {
      columnWidth: `${minColumnWidth}px`,
      columnGap: `${gap}px`,
      width: '100%',
    };

    return (
      <div className={className} style={masonryStyle}>
        {children}
      </div>
    );
  }

  // Standard CSS Grid for uniform layouts
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
    gap: `${gap}px`,
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

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  gap?: number;
}

export function GridItem({ children, className = '', style, gap = 12, ...rest }: GridItemProps) {
  return (
    <div
      className={className}
      style={{
        breakInside: 'avoid',
        marginBottom: `${gap}px`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Grid;
