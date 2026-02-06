import { useResponsiveGrid } from './LibraryGrid.tsx';

export default function LoadingSkeleton() {
  const { colWidth, gap } = useResponsiveGrid();
  
  return (
    <div className="w-full px-2 sm:px-3 lg:px-4 py-4" role="status" aria-label="Carregando conteúdo" aria-busy="true">
      <div className="w-full max-w-none">
        <div
          style={{
            columnWidth: `${colWidth}px`,
            columnGap: `${gap}px`
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                breakInside: 'avoid',
                marginBottom: `${gap}px`
              }}
              className="animate-pulse"
            >
              <div 
                className="bg-[var(--color-overlay-light)] rounded-lg overflow-hidden"
                style={{ 
                  width: `${colWidth}px`,
                  height: `${colWidth}px`
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-overlay-light)] via-[var(--color-overlay-light)] to-[var(--color-overlay-light)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
