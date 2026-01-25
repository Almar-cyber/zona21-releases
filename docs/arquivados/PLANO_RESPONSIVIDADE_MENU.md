# 📱 Plano de Responsividade - Menu Flutuante

## 🎯 Problema Identificado

O menu de filtros (`Toolbar.tsx`) em telas pequenas usa `w-[92vw]` (92% da viewport width), o que pode cobrir a sidebar quando ela está visível.

## 📊 Análise Atual

### Estrutura Layout
```
┌─────────────────────────────────────────┐
│ Sidebar (hidden sm:flex) │   Toolbar    │
├─────────────────────────────────────────┤
│         │          Menu (z-[140])       │
│         │  w-[92vw] max-w-md            │
│         └───────────────────────────────┘
│         │                               │
│ Library │                               │
└─────────────────────────────────────────┘
```

### Breakpoints Atuais
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+

## 🎯 Soluções Propostas

### Opção 1: Ajustar Width Baseado na Sidebar
```tsx
// Toolbar.tsx
className={`mh-popover absolute mt-2 p-3 z-[140] ${
  isSidebarCollapsed 
    ? 'w-[92vw] max-w-md right-0' 
    : 'w-[80vw] max-w-md right-0 sm:right-0 md:right-0'
}`}
```

### Opção 2: Mudar Posição Baseada no Viewport
```tsx
// Em telas pequenas, centralizar
// Em telas grandes, alinhar à direita
className={`mh-popover absolute mt-2 p-3 z-[140] ${
  'sm:right-0 sm:left-auto left-1/2 sm:-translate-x-0 -translate-x-1/2'
} w-[92vw] sm:w-auto sm:max-w-md`}
```

### Opção 3: Usar CSS Container Queries (Recomendado)
```tsx
// Adicionar container ao Toolbar
<div className="relative isolate z-[120] @container">
  {/* Menu usa container queries */}
  <div className="mh-popover absolute mt-2 p-3 z-[140] @sm:right-0 @sm:left-auto @sm:w-auto @sm:max-w-md left-1/2 -translate-x-1/2 w-[92vw]">
```

### Opção 4: Responsive com Tailwind (Mais Simples)
```tsx
className="mh-popover absolute mt-2 p-3 z-[140] left-1/2 -translate-x-1/2 sm:left-auto sm:-translate-x-0 sm:right-0 w-[92vw] sm:w-auto sm:max-w-md"
```

## 🛠️ Implementação

### Passo 1: Modificar Toolbar.tsx
```tsx
{isFiltersOpen && (
  <div
    className="mh-popover absolute mt-2 p-3 z-[140] left-1/2 -translate-x-1/2 sm:left-auto sm:-translate-x-0 sm:right-0 w-[92vw] sm:w-auto sm:max-w-md"
    onPointerDown={(e) => e.stopPropagation()}
  >
    {/* Conteúdo */}
  </div>
)}
```

### Passo 2: Adicionar CSS Custom (se necessário)
```css
/* index.css */
@media (min-width: 640px) {
  .mh-popover-responsive {
    max-width: min(28rem, calc(100vw - 2rem));
  }
}
```

### Passo 3: Testar em Diferentes Tamanhos
- iPhone SE: 375px
- iPad: 768px
- Desktop: 1920px

## 📱 Comportamento Esperado

### Mobile (< 640px)
- Menu centralizado horizontalmente
- 92% da largura da tela
- Não cobre sidebar (que está oculta)

### Tablet (640px+)
- Menu alinhado à direita
- Largura automática até max-w-md
- Sidebar visível, menu não cobre

### Desktop
- Menu alinhado à direita
- Largura fixa máxima
- Comportamento ideal

## 🎨 Melhorias Adicionais

### 1. Animação Suave
```tsx
className="... transition-all duration-200 ease-out"
```

### 2. Detectar Clique Fora
```tsx
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (!e.target.closest('.mh-popover') && !e.target.closest('button')) {
      setIsFiltersOpen(false);
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);
```

### 3. Suporte a Teclado
```tsx
onKeyDown={(e) => {
  if (e.key === 'Escape') setIsFiltersOpen(false);
}}
```

## 📊 Testes

### Casos de Teste
1. **Mobile**: Menu centralizado, não cobre conteúdo
2. **Tablet**: Menu à direita, respeita sidebar
3. **Desktop**: Menu comportamento consistente
4. **Scroll**: Menu fixo, não segue scroll
5. **Z-index**: Sempre acima de outros elementos

### Ferramentas
- Chrome DevTools: Device Mode
- Responsively App
- BrowserStack

## ✅ Critérios de Aceite

- [ ] Mobile: Menu centralizado, 92vw width
- [ ] Tablet+: Menu alinhado à direita
- [ ] Não cobrir sidebar quando visível
- [ ] Manter z-[140] acima de tudo
- [ ] Animação suave de abertura/fechamento
- [ ] Suporte a ESC para fechar
- [ ] Clique fora fecha o menu

---

**Prioridade**: Alta - Impacta diretamente a UX em dispositivos móveis
