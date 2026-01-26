# Zona21 Design System v1.0

## Overview
Sistema de design centralizado para garantir consistência visual e prevenir quebras de layout no Zona21.

## Estrutura

### 📁 Arquivos
```
src/styles/
├── design-system.css  # Tokens CSS e utilidades
└── README.md         # Documentação

src/components/
├── Grid.tsx          # Componente Grid reutilizável
└── Library.tsx       # Implementação usando Grid
```

## 🎨 Tokens CSS

### Breakpoints (Desktop-First)
```css
--breakpoint-sm: 640px;   # Tablet
--breakpoint-md: 1024px;  # Desktop
--breakpoint-lg: 1440px;  # Large Desktop
--breakpoint-xl: 1920px;  # Ultra Wide
--breakpoint-2xl: 2560px; # 4K
```

### Grid System
```css
--grid-min-width-lg: 200px;  # Desktop
--grid-min-width-xl: 240px;  # Large Desktop
--grid-min-width-2xl: 280px; # Ultra Wide
--grid-gap-lg: 12px;
--grid-gap-xl: 14px;
--grid-gap-2xl: 16px;
```

### Cores
```css
/* Primárias */
--color-primary: #0066ff;
--color-primary-hover: #0052cc;
--color-secondary: #64748b;

/* Fundo */
--color-background: #0f172a;
--color-surface: #1e293b;
--color-surface-hover: #334155;
--color-surface-selected: #1e3a8a;

/* Bordas */
--color-border: #334155;
--color-border-hover: #475569;

/* Texto */
--color-text-primary: #f1f5f9;
--color-text-secondary: #cbd5e1;
--color-text-muted: #64748b;
--color-text-inverse: #0f172a;

/* Status */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #06b6d4;
```

## 🔧 Componentes

### Grid Component
```tsx
import { Grid, GridItem } from './Grid';

// Grid responsivo que preenche a largura
<Grid variant="responsive" minColumnWidth={200} gap={12}>
  <GridItem>
    <AssetCard />
  </GridItem>
</Grid>
```

### Layout Classes
```tsx
// Layout principal
<div className="zona-layout">
  <aside className="zona-layout__sidebar">
    <Sidebar />
  </aside>
  <main className="zona-layout__main">
    <header className="zona-layout__header">
      <Toolbar />
    </header>
    <div className="zona-layout__content">
      <Library />
    </div>
  </main>
</div>
```

### Exemplo de Uso das Cores
```tsx
// Botão primário
<button style={{
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)'
}}>
  Ação
</button>

// Card selecionado
<div style={{
  backgroundColor: 'var(--color-surface-selected)',
  borderColor: 'var(--color-primary)'
}}>
  Conteúdo
</div>

// Status
<div style={{ color: 'var(--color-success)' }}>Sucesso</div>
<div style={{ color: 'var(--color-warning)' }}>Atenção</div>
<div style={{ color: 'var(--color-error)' }}>Erro</div>
```

## 📐 Grid System

### CSS Grid com Auto-Fill
- Usa `repeat(auto-fill, minmax(minWidth, 1fr))`
- Cards expandem para preencher espaço disponível
- Sem colunas vazias em telas grandes

### Responsividade
- Mobile: 150px min width
- Tablet: 180px min width
- Desktop: 200px min width
- Large Desktop: 240px min width
- Ultra Wide: 280px min width

## 🎯 Problemas Resolvidos

### Antes (CSS Columns)
```css
/* Problemas */
- Colunas não preenchiam largura
- Espaços vazios em telas grandes
- Layout quebrado com sidebar
```

### Depois (CSS Grid)
```css
/* Soluções */
- Grid preenche 100% da largura
- Cards se ajustam dinamicamente
- Layout responsivo consistente
```

## 🔍 Debug Mode

Adicione a classe `zona-debug` para visualizar o grid:
```tsx
<div className="zona-debug">
  <Grid className="zona-grid--responsive">
    {/* Cards com outline de debug */}
  </Grid>
</div>
```

## 📏 Utilitários

### Classes de Layout
```css
.zona-fill          /* width: 100%; height: 100% */
.zona-fill-width    /* width: 100% */
.zona-fill-height   /* height: 100% */
.zona-overflow-hidden
.zona-overflow-auto
```

### Scrollbar Styling
```css
.zona-scrollbar /* Scrollbar customizado */
```

## 🚀 Boas Práticas

1. **Sempre usar Grid component** para layouts de cards
2. **Usar tokens CSS** em vez de valores hardcoded
3. **Testar em múltiplas resoluções**
4. **Usar zona-debug** durante desenvolvimento

## 📱 Compatibilidade

- ✅ Chrome 88+
- ✅ Firefox 89+
- ✅ Safari 14+
- ✅ Edge 88+

## 🔄 Migração

Para migrar componentes existentes:

1. Importar Grid component
2. Trocar CSS columns por Grid
3. Usar tokens do design system
4. Testar responsividade

Exemplo:
```tsx
// Antes
<div style={{ columnWidth: '200px', columnGap: '12px' }}>
  {cards}
</div>

// Depois
<Grid variant="responsive" minColumnWidth={200} gap={12}>
  {cards.map(card => <GridItem>{card}</GridItem>)}
</Grid>
```
