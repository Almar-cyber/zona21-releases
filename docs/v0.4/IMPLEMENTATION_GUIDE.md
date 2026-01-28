# Guia de Implementação - Growth Design Features

Este guia mostra como integrar os novos componentes de onboarding e growth design no Zona21.

## 📦 Componentes Criados

### 1. Sistema de Tracking
- `src/services/onboarding-service.ts` - Serviço singleton para tracking
- `src/hooks/useOnboarding.ts` - Hook React para uso nos componentes

### 2. Componentes UI
- `src/components/SmartTooltip.tsx` - Tooltips inteligentes com tracking
- `src/components/Kbd.tsx` - Componente para exibir teclas de atalho
- `src/components/FirstUseChecklist.tsx` - Checklist gamificada
- `src/components/MilestoneModal.tsx` - Modal de celebração de conquistas
- `src/components/EmptyStateUnified.tsx` - Empty states melhorados (atualizado)

### 3. Estilos
- `src/index.css` - Animações de confetti e celebração (adicionado)

---

## 🚀 Integração no App.tsx

### Passo 1: Adicionar o MilestoneModal Globalmente

```tsx
// src/App.tsx
import MilestoneModal from './components/MilestoneModal';
import FirstUseChecklist from './components/FirstUseChecklist';

function App() {
  return (
    <div className="app">
      {/* ... resto do app ... */}

      {/* Adicionar no final, antes do fechamento da div principal */}
      <MilestoneModal />
    </div>
  );
}
```

### Passo 2: Adicionar Checklist na Sidebar

```tsx
// src/components/Sidebar.tsx
import FirstUseChecklist from './FirstUseChecklist';
import { useChecklist } from '../hooks/useOnboarding';

function Sidebar() {
  const { isComplete } = useChecklist();

  return (
    <aside className="mh-sidebar">
      {/* Logo e header */}

      {/* Adicionar checklist no topo, antes das collections */}
      {!isComplete && (
        <div className="px-3 mb-4">
          <FirstUseChecklist />
        </div>
      )}

      {/* Volumes, folders, collections... */}
    </aside>
  );
}
```

### Passo 3: Integrar Tracking de Eventos

#### Marcar quando usuário importa pasta

```tsx
// src/components/Sidebar.tsx ou onde a pasta é adicionada
import { useOnboarding } from '../hooks/useOnboarding';

function AddFolderButton() {
  const { trackEvent, updateChecklistItem } = useOnboarding();

  const handleAddFolder = async () => {
    // ... lógica existente de adicionar pasta ...

    // Tracking
    trackEvent('folder-added');
    updateChecklistItem('import-folder', true);
  };

  return <button onClick={handleAddFolder}>Adicionar Pasta</button>;
}
```

#### Marcar quando usuário marca fotos

```tsx
// src/components/AssetCard.tsx ou onde as fotos são marcadas
import { useOnboarding } from '../hooks/useOnboarding';

function AssetCard({ asset }) {
  const { trackEvent, updateChecklistItem, stats } = useOnboarding();

  const handleMark = (type: 'approved' | 'favorited' | 'rejected') => {
    // ... lógica existente de marcação ...

    // Tracking
    if (type === 'approved') {
      trackEvent('asset-approved');
    } else if (type === 'favorited') {
      trackEvent('asset-favorited');
    } else if (type === 'rejected') {
      trackEvent('asset-rejected');
    }

    // Tracking de uso de teclado vs mouse
    trackEvent('keyboard-shortcut-used'); // ou 'mouse-click-used'

    // Atualizar checklist
    if (stats.photosMarked >= 5) {
      updateChecklistItem('mark-5-photos', true);
    }

    // Verificar se usou teclado
    if (stats.keyboardUsageCount > 0) {
      updateChecklistItem('use-keyboard', true);
    }
  };

  return (
    <div onClick={() => handleMark('approved')}>
      {/* ... */}
    </div>
  );
}
```

#### Marcar quando usuário usa Smart Culling

```tsx
// src/components/SmartCullingModal.tsx
import { useOnboarding } from '../hooks/useOnboarding';

function SmartCullingModal() {
  const { trackEvent, updateChecklistItem } = useOnboarding();

  const handleStartCulling = () => {
    // ... lógica existente ...

    // Tracking
    trackEvent('smart-culling-used');
    updateChecklistItem('try-smart-culling', true);
  };

  return (
    <button onClick={handleStartCulling}>Iniciar Smart Culling</button>
  );
}
```

#### Marcar outras ações

```tsx
// Find Similar
trackEvent('find-similar-used');
updateChecklistItem('find-similar', true);

// Smart Rename
trackEvent('smart-rename-used');
updateChecklistItem('smart-rename', true);

// Export
trackEvent('project-exported');
updateChecklistItem('export-project', true);
```

---

## 💡 Usando SmartTooltips

### Exemplo 1: Tooltip Simples

```tsx
import SmartTooltip from './components/SmartTooltip';

<SmartTooltip
  id="keyboard-nav-tip"
  content="Use as setas do teclado para navegar mais rápido"
  showOnce={true}
  trigger="auto"
  autoDelay={3000}
>
  <button>Navegar</button>
</SmartTooltip>
```

### Exemplo 2: Tooltip com Atalho

```tsx
import { SmartTooltipWithShortcut } from './components/SmartTooltip';

<SmartTooltipWithShortcut
  id="approve-shortcut"
  content="Aprovar foto"
  shortcut="A"
  showOnce={false}
>
  <button>✓</button>
</SmartTooltipWithShortcut>
```

### Exemplo 3: Pro Tip

```tsx
import { ProTipTooltip } from './components/SmartTooltip';

<ProTipTooltip
  id="shift-advance-tip"
  tip="Use Shift+A para marcar e avançar automaticamente"
  trigger="auto"
  autoDelay={5000}
  dismissible={true}
>
  <div className="asset-grid">
    {/* grid items */}
  </div>
</ProTipTooltip>
```

### Exemplo 4: Rich Tooltip com Ação

```tsx
import { SmartTooltipRich } from './components/SmartTooltip';

<SmartTooltipRich
  id="smart-culling-intro"
  title="Experimente Smart Culling"
  description="Deixe a IA analisar sequências e sugerir as melhores fotos automaticamente"
  icon={<Sparkles className="w-4 h-4" />}
  action={{
    label: 'Tentar Agora',
    onClick: () => openSmartCulling()
  }}
  trigger="auto"
  autoDelay={10000}
  showOnce={true}
>
  <div className="burst-group">
    {/* fotos em burst */}
  </div>
</SmartTooltipRich>
```

---

## 🎨 Usando Novos Empty States

### Empty State: Biblioteca Vazia

```tsx
import EmptyStateUnified from './components/EmptyStateUnified';

<EmptyStateUnified
  type="library-empty"
  onAction={handleAddFolder}
/>
```

### Empty State: Nenhuma Foto Aprovada

```tsx
<EmptyStateUnified
  type="no-approved"
/>
```

### Empty State: IA Desabilitada

```tsx
<EmptyStateUnified
  type="ai-disabled"
  onAction={() => {
    // Abrir preferências e ativar IA
    openPreferences('ai');
  }}
/>
```

### Empty State Customizado

```tsx
<EmptyStateUnified
  type="search"
  title="Nenhuma foto com 'montanha'"
  description="Experimente: praia, cidade, pessoas ou ver todas as tags"
  icon="search"
  showTips={false}
/>
```

---

## 🎯 Detectando Condições para Tooltips

### Detectar Burst de Fotos

```tsx
import { SmartTooltipRich } from './components/SmartTooltip';
import { useState, useEffect } from 'react';

function LibraryGrid({ assets }) {
  const [hasBurst, setHasBurst] = useState(false);

  useEffect(() => {
    // Detectar se há sequência de fotos (burst)
    const timestamps = assets.map(a => a.timestamp).sort();
    const hasSequence = timestamps.some((t, i) =>
      i > 0 && (t - timestamps[i - 1]) < 2000 // 2s entre fotos
    );
    setHasBurst(hasSequence && timestamps.length >= 5);
  }, [assets]);

  return (
    <div className="library-grid">
      {hasBurst && (
        <SmartTooltipRich
          id="burst-detected"
          title="Sequência detectada"
          description="Smart Culling pode analisar e sugerir as melhores"
          trigger="auto"
          showOnce={true}
        >
          <div className="grid">
            {/* assets */}
          </div>
        </SmartTooltipRich>
      )}
    </div>
  );
}
```

### Detectar Uso Excessivo de Mouse

```tsx
import { ProTipTooltip } from './components/SmartTooltip';
import { useOnboarding } from '../hooks/useOnboarding';

function AssetGrid() {
  const { stats } = useOnboarding();

  const shouldShowKeyboardTip = () => {
    const total = stats.keyboardUsageCount + stats.mouseUsageCount;
    return total > 10 && (stats.keyboardUsageCount / total) < 0.3; // < 30% keyboard
  };

  return (
    <div className="asset-grid">
      {shouldShowKeyboardTip() && (
        <ProTipTooltip
          id="keyboard-faster"
          tip="Use A/F/D no teclado para marcar mais rápido"
          trigger="auto"
          autoDelay={2000}
        >
          <div>{/* grid */}</div>
        </ProTipTooltip>
      )}
    </div>
  );
}
```

---

## 📊 Acessando Estatísticas

```tsx
import { useOnboarding } from '../hooks/useOnboarding';

function Dashboard() {
  const { stats, insights } = useOnboarding();

  return (
    <div>
      <h2>Suas Estatísticas</h2>
      <div>
        <p>Fotos marcadas: {stats.photosMarked}</p>
        <p>Taxa de aprovação: {Math.round((stats.photosApproved / stats.photosMarked) * 100)}%</p>
        <p>Uso de teclado: {Math.round((stats.keyboardUsageCount / (stats.keyboardUsageCount + stats.mouseUsageCount)) * 100)}%</p>
      </div>

      <h3>Insights</h3>
      <ul>
        {insights.map((insight, i) => (
          <li key={i}>{insight}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🎮 Testando Durante Desenvolvimento

### Reset do Onboarding

```tsx
// Em modo desenvolvimento, adicionar botão para reset
import { onboardingService } from './services/onboarding-service';

function DevTools() {
  return (
    <button onClick={() => onboardingService.reset()}>
      Reset Onboarding
    </button>
  );
}
```

### Console Debug

```javascript
// No navegador console:
window.__onboardingService.getState();
window.__onboardingService.trackEvent('asset-marked');
window.__onboardingService.checkMilestones();
```

---

## 🐛 Troubleshooting

### Tooltip não aparece

1. Verificar se `id` é único
2. Verificar se `showOnce` está habilitado e tooltip já foi visto
3. Checar `condition` customizada
4. Verificar se `disabled` não está true

### Checklist não atualiza

1. Verificar se `trackEvent` está sendo chamado corretamente
2. Verificar se `updateChecklistItem` está com ID correto
3. Checar se localStorage não está cheio

### Milestone não dispara

1. Verificar se contador de eventos está correto
2. Checar se milestone já foi alcançado anteriormente
3. Verificar configuração do trigger no `DEFAULT_MILESTONES`

---

## 📝 Próximos Passos

1. **Adicionar mais tooltips contextuais** em locais estratégicos
2. **Criar mais milestones** para outras conquistas
3. **Implementar Dashboard de Produtividade** (Fase 3 do plano)
4. **Adicionar animações microinterativas** nos botões e cards
5. **Testar com usuários reais** e ajustar baseado em feedback

---

## 🎨 Customização

### Modificar cores dos milestones

```tsx
// src/components/MilestoneModal.tsx
// Alterar as classes de gradient e bordas
className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
```

### Adicionar novos milestones

```typescript
// src/services/onboarding-service.ts
export const DEFAULT_MILESTONES: Milestone[] = [
  // ... milestones existentes ...
  {
    id: 'speed-demon',
    trigger: { event: 'fast-marking', threshold: 20 }, // 20 fotos/min
    title: 'Velocista! ⚡',
    description: 'Você está marcando fotos super rápido!',
    celebration: true
  }
];
```

### Customizar textos de empty states

```tsx
<EmptyStateUnified
  type="collection"
  title="Sua coleção personalizada"
  description="Adicione suas fotos favoritas aqui"
  tipText="Dica: Arraste fotos diretamente ou use o menu de contexto"
/>
```

---

## 📚 Referências

- [Plano Completo](./PLANO_GROWTH_DESIGN.md)
- [Growth.Design Case Studies](https://growth.design/case-studies)
- [106 Cognitive Biases](https://growth.design/psychology)

---

**Criado em:** 28 Janeiro 2026
**Versão:** v0.5.0
**Status:** Pronto para implementação
