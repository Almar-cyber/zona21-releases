# Zona21 Design System v2.0

> Atualizado: 26/01/2026 | Versão do App: 0.3.0

## Visao Geral

O Zona21 usa um sistema de design baseado em **glassmorphism** com efeitos de backdrop-blur, fundos semi-transparentes e uma paleta de cores indigo/roxo.

## Arquivos

```
src/styles/
├── design-system.css        # Documentacao completa do design system
├── design-tokens.css        # Variaveis CSS (tokens)
├── design-system-legacy.css # [DEPRECADO] Versao antiga nao utilizada
└── README.md                # Este arquivo

src/
└── index.css                # Classes .mh-* e estilos globais
```

## Classes de Componentes

Todas as classes seguem o prefixo `.mh-*` (definidas em `index.css`):

### Botoes

| Classe | Uso | Exemplo |
|--------|-----|---------|
| `.mh-btn` | Base de todos os botoes | `<button className="mh-btn">` |
| `.mh-btn-gray` | Botao secundario/neutro | Filtros, acoes secundarias |
| `.mh-btn-indigo` | Botao primario | "Adicionar pasta", CTAs |
| `.mh-btn-danger` | Acao destrutiva | "Apagar", "Remover" |
| `.mh-btn-selected` | Estado selecionado | Toggle ativo |

```tsx
// Exemplo de uso
<button className="mh-btn mh-btn-indigo px-4 py-2">
  Adicionar pasta
</button>
```

### Layout

| Classe | Uso |
|--------|-----|
| `.mh-sidebar` | Barra lateral com glassmorphism |
| `.mh-topbar` | Barra superior com glassmorphism |

### Menus

| Classe | Uso |
|--------|-----|
| `.mh-menu` | Container de dropdown |
| `.mh-menu-item` | Item normal |
| `.mh-menu-item-danger` | Item destrutivo (vermelho) |

### Formularios

| Classe | Uso |
|--------|-----|
| `.mh-control` | Inputs, selects, textareas |
| `.mh-popover` | Popovers e modais pequenos |

## Tokens CSS

### Cores Principais

```css
--color-primary: #4F46E5;            /* Indigo profundo - botoes principais */
--color-primary-hover: #4338CA;      /* Hover */
--color-primary-light: #818CF8;      /* Icones, destaques */
--color-background: #020005;          /* Fundo do app */
--color-surface: rgba(6,0,16,0.70);   /* Paineis */

/* Shadow para botoes primarios */
--shadow-primary: 0 4px 14px rgba(79, 70, 229, 0.4);
```

### Espacamentos

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Border Radius

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;  /* Pills */
```

## Grid System

O layout de cards usa **CSS Columns** (masonry/Pinterest style):

```tsx
// Grid.tsx
const gridStyle = {
  columnWidth: '180px',
  columnGap: '14px',
};

// GridItem usa breakInside: 'avoid'
```

Isso permite que cards de alturas diferentes se encaixem naturalmente.

## Efeito Glassmorphism

Componentes principais usam:

```css
backdrop-filter: blur(24px);  /* backdrop-blur-xl */
background: rgba(6, 0, 16, 0.70);
border: 1px solid rgba(255, 255, 255, 0.10);
```

## Tipografia

- **Fonte:** Figtree (Google Fonts)
- **Fallback:** -apple-system, system-ui
- **Tamanho base:** 14px
- **Line-height:** 1.5

### Escala

| Classe Tailwind | Tamanho |
|-----------------|---------|
| `text-xs` | 10px |
| `text-sm` | 14px |
| `text-base` | 16px |
| `text-lg` | 18px |

## Icones

- **Biblioteca:** Lucide React
- **Componente:** `<Icon name="icon_name" size={18} />`
- **Tamanhos comuns:** 14, 16, 18, 20, 24

```tsx
import Icon from './components/Icon';

<Icon name="folder" size={18} className="text-gray-400" />
```

O componente `Icon.tsx` mapeia nomes Material Design para equivalentes Lucide:
- `folder`, `folder_open`, `create_new_folder`
- `image`, `video`, `videocam`
- `search`, `filter`, `settings`
- `close`, `check`, `check_circle`
- `add`, `remove`, `delete`, `trash`
- `download`, `upload`, `share`
- E muitos outros...

## Responsividade

Breakpoints via Tailwind (mobile-first):

| Prefixo | Largura |
|---------|---------|
| `sm:` | >=640px |
| `md:` | >=768px |
| `lg:` | >=1024px |
| `xl:` | >=1280px |

## Animacoes

### Transicoes padrao

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
```

### Efeitos

- **Botoes:** `translateY(-1px)` no hover
- **Cards:** `scale(1.02)` no hover
- **Modais:** `fadeIn` com scale 0.95 -> 1

## Acessibilidade

### Focus Visible

```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Estados Disabled

```css
:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Migracao do Design System Antigo

O arquivo `design-system-legacy.css` contem o design system v1.0 que usava:
- Prefixo `.zona-*` (nao utilizado)
- Cores azuis (#0066ff)
- CSS Grid ao inves de CSS Columns

**Nao use as classes `.zona-*`** - elas foram descontinuadas.

## Exemplos de Componentes

### Botao Primario

```tsx
<button className="mh-btn mh-btn-indigo px-6 py-3 rounded-full">
  <Icon name="add" size={18} />
  <span>Adicionar pasta</span>
</button>
```

### Card de Asset

```tsx
<div className="rounded-xl border border-white/10 bg-black/20
                hover:scale-[1.02] transition-all">
  <img src={thumbnail} className="w-full h-auto" />
</div>
```

### Menu Dropdown

```tsx
<div className="mh-menu">
  <button className="mh-menu-item">Renomear</button>
  <button className="mh-menu-item-danger">Excluir</button>
</div>
```

---

## Changelog

### v2.0 (26/01/2026)
- Documentacao atualizada para refletir producao real
- Tokens de cor atualizados para paleta indigo
- Removidas referencias a classes `.zona-*` nao usadas
- Adicionada documentacao de glassmorphism
- Grid system documentado como CSS Columns

### v1.0 (Janeiro 2024)
- Versao inicial (descontinuada)
- Classes `.zona-*`
- Paleta azul (#0066ff)
