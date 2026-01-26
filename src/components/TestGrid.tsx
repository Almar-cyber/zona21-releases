import React from 'react';

export function TestGrid() {
  const items = Array.from({ length: 20 }, (_, i) => i + 1);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      padding: '20px',
      background: 'var(--color-background)'
    }}>
      <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
        Teste Grid - {items.length} itens
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        width: '100%'
      }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary)',
              fontSize: '24px',
              fontWeight: 'bold'
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
