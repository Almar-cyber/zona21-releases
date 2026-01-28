# Gerenciamento de Carga Cognitiva - Princípios Críticos

**Data:** 28 de Janeiro de 2026
**Problema:** Implementação completa pode AFASTAR usuários ao invés de aproximar

---

## ⚠️ O Problema Real

### Sobrecarga Cognitiva Identificada

Se implementarmos TUDO ao mesmo tempo:
- ❌ Checklist na sidebar (sempre visível)
- ❌ Tooltips aparecendo em vários lugares
- ❌ Milestones interrompendo trabalho
- ❌ Pro tips surgindo constantemente
- ❌ Empty states com textos longos

**Resultado:** Usuário se sente **bombardeado**, não **guiado**.

---

## 🎯 Princípios de Implementação Consciente

### 1. **One Thing at a Time** (Regra de Ouro)

> "Nunca mostre mais de 1 elemento de onboarding simultaneamente"

**Implementação:**
```typescript
// onboarding-service.ts - adicionar
interface OnboardingQueue {
  activeElement: 'checklist' | 'tooltip' | 'milestone' | 'pro-tip' | null;
  queue: OnboardingElement[];
}

// Só mostra próximo quando usuário interagir com atual
```

**Prioridade:**
1. Milestone (alta prioridade - conquista!)
2. Checklist (média - progresso)
3. Tooltip contextual (baixa - aprendizado)
4. Pro tip (muito baixa - otimização)

---

### 2. **Respect User Intent** (Não Interrompa Fluxo)

> "Nunca interrompa usuário no meio de uma ação"

**Boas Práticas:**
- ✅ Milestone aparece APÓS exportação (fim de tarefa)
- ✅ Pro tip aparece quando usuário pausa (3s sem ação)
- ✅ Checklist só visível em momentos de low-activity
- ❌ Nunca durante marcação rápida
- ❌ Nunca durante scroll/navegação

**Detecção de Contexto:**
```typescript
interface UserContext {
  isActivelyWorking: boolean; // Marcando fotos rapidamente
  isPaused: boolean; // 3+ segundos sem ação
  isExploring: boolean; // Navegando sem marcar
  justFinishedTask: boolean; // Exportou, completou algo
}

// Só mostrar onboarding quando isPaused ou justFinishedTask
```

---

### 3. **Progressive Reduction** (Desaparecer com o Tempo)

> "Quanto mais experiente o usuário, menos onboarding"

**Implementação por Estágios:**

#### Estágio 1: Novato (0-50 fotos marcadas)
- Checklist visível
- Tooltips ativos
- Milestones comemorados
- Empty states educativos

#### Estágio 2: Intermediário (51-500 fotos)
- Checklist colapsa automaticamente
- Tooltips reduzidos (só features avançadas)
- Milestones menos frequentes
- Empty states simples

#### Estágio 3: Expert (500+ fotos)
- Sem checklist
- Sem tooltips (exceto novidades)
- Milestones apenas grandes (1000, 5000)
- Empty states minimalistas

```typescript
// onboarding-service.ts
getUserLevel(): 'novice' | 'intermediate' | 'expert' {
  const marked = this.state.stats.photosMarked;
  if (marked < 50) return 'novice';
  if (marked < 500) return 'intermediate';
  return 'expert';
}

shouldShowOnboarding(element: string): boolean {
  const level = this.getUserLevel();

  if (level === 'expert') {
    // Experts não veem onboarding básico
    return element === 'new-feature-announcement';
  }

  if (level === 'intermediate') {
    // Intermediários só veem onboarding avançado
    return !['checklist', 'basic-tooltips'].includes(element);
  }

  return true; // Novice vê tudo
}
```

---

### 4. **Easy Opt-Out** (Respeite Quem Já Sabe)

> "Usuários avançados devem poder desligar TUDO com 1 clique"

**Implementação:**

#### Botão "Sou Experiente"
```tsx
// FirstUseChecklist.tsx
<button
  onClick={() => {
    if (confirm('Deseja pular todo o onboarding? Você pode reativá-lo nas Preferências.')) {
      onboardingService.skipAll();
    }
  }}
  className="text-xs text-gray-500 hover:text-gray-300"
>
  Sou experiente, pular tutorial
</button>
```

#### Preferências Granulares
```tsx
// PreferencesModal.tsx > Guia "Onboarding"
<div className="preference-section">
  <h3>Assistência de Onboarding</h3>

  <Toggle
    label="Checklist de primeiros passos"
    checked={settings.showChecklist}
  />

  <Toggle
    label="Tooltips contextuais"
    checked={settings.showTooltips}
  />

  <Toggle
    label="Celebrações de milestone"
    checked={settings.showMilestones}
  />

  <Toggle
    label="Pro tips"
    checked={settings.showProTips}
  />

  <Select
    label="Intensidade de onboarding"
    options={['Completo', 'Moderado', 'Mínimo', 'Desligado']}
  />
</div>
```

---

### 5. **Measure Annoyance** (Detectar Frustração)

> "Se usuário está fechando tooltips rapidamente, pare de mostrar"

**Implementação:**
```typescript
interface FrustrationSignals {
  tooltipDismissedWithin3s: number; // Fechou muito rápido = irritante
  checklistCollapsedQuickly: number; // Colapsou sem ler
  milestoneSkippedImmediately: number; // Pulou sem ler
  consecutiveDismisses: number; // Fechou 3+ elementos seguidos
}

// Se detectar frustração, desligar automaticamente
if (frustrationSignals.consecutiveDismisses >= 3) {
  this.autoDisableOnboarding();
  showToast('Desativamos os tutoriais. Reative nas Preferências se mudar de ideia.');
}
```

---

### 6. **Value-First, Not Features-First**

> "Mostre valor antes de ensinar como usar"

**Mau Exemplo:**
```
Tooltip: "Pressione A para aprovar fotos"
```

**Bom Exemplo:**
```
Tooltip: "Marque 3x mais rápido com teclado (A/F/D)"
Benefício primeiro, feature depois
```

**Aplicação:**

| Elemento | ❌ Feature-first | ✅ Value-first |
|----------|------------------|----------------|
| Smart Culling | "Use Smart Culling para analisar bursts" | "Economize 15 min analisando 50 fotos automaticamente" |
| Keyboard | "Pressione A para aprovar" | "3x mais rápido: use A/F/D ao invés de clicar" |
| Find Similar | "Clique em Find Similar" | "Encontre todas as versões de uma foto em 2 segundos" |

---

## 🔧 Implementação Prática - Modo "Less is More"

### Configuração de Intensidade

```typescript
// onboarding-service.ts
export type OnboardingIntensity = 'full' | 'moderate' | 'minimal' | 'off';

interface OnboardingSettings {
  intensity: OnboardingIntensity;
  showChecklist: boolean;
  showTooltips: boolean;
  showMilestones: boolean;
  showProTips: boolean;
  autoDetectExpertise: boolean; // Detectar e reduzir automaticamente
}

const INTENSITY_PRESETS: Record<OnboardingIntensity, Partial<OnboardingSettings>> = {
  full: {
    showChecklist: true,
    showTooltips: true,
    showMilestones: true,
    showProTips: true
  },
  moderate: {
    showChecklist: true,
    showTooltips: true,
    showMilestones: true,
    showProTips: false // Sem pro tips
  },
  minimal: {
    showChecklist: false, // Sem checklist
    showTooltips: false,
    showMilestones: true, // Só grandes conquistas
    showProTips: false
  },
  off: {
    showChecklist: false,
    showTooltips: false,
    showMilestones: false,
    showProTips: false
  }
};
```

---

### Checklist: Versão Minimalista

**Problema Original:** Checklist sempre visível, 7 itens, ocupa espaço

**Solução:**

```tsx
// FirstUseChecklist.tsx - Versão Minimalista
function FirstUseChecklistMinimal() {
  const { progress, isComplete } = useChecklist();

  // Só mostra se < 50% completo
  if (progress.completed / progress.total > 0.5 || isComplete) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#4F46E5]/10 border border-[#4F46E5]/30 rounded-lg text-xs">
      <Sparkles className="w-3 h-3 text-[#818CF8]" />
      <span className="text-gray-300">{progress.completed}/{progress.total} passos</span>
      <button
        onClick={() => setExpanded(true)}
        className="ml-auto text-[#818CF8] hover:underline"
      >
        Ver
      </button>
    </div>
  );
}
```

**Versão Colapsada por Padrão:**
- Linha única com progress
- Só expande quando usuário quer
- Desaparece após 50% completo

---

### Tooltips: Só os Essenciais

**Implementação Seletiva:**

```typescript
// Apenas 3 tooltips essenciais no início
const ESSENTIAL_TOOLTIPS = [
  {
    id: 'keyboard-navigation',
    trigger: 'after-3-mouse-navigations', // Só se usar mouse 3x
    content: 'Use ←→ para navegar mais rápido'
  },
  {
    id: 'burst-detected',
    trigger: 'first-burst-detection', // Só quando houver burst
    content: 'Smart Culling pode analisar essas 15 fotos em 30s'
  },
  {
    id: 'shift-advance',
    trigger: 'after-20-marks-without-shift', // Só se marcar 20+ sem shift
    content: 'Shift+A marca e avança automaticamente'
  }
];

// Demais tooltips: OFF por padrão
// Usuário habilita nas Preferências se quiser
```

---

### Milestones: Menos Frequentes, Mais Significativos

**Problema:** 8 milestones é demais

**Solução:** Reduzir para 4 essenciais

```typescript
const CORE_MILESTONES: Milestone[] = [
  {
    id: 'first-100-marks',
    trigger: { event: 'asset-marked', count: 100 },
    title: 'Primeira Centena! 🎯',
    celebration: true
  },
  {
    id: 'first-500-marks',
    trigger: { event: 'asset-marked', count: 500 },
    title: 'Curador Profissional! 💪',
    celebration: true
  },
  {
    id: 'keyboard-master',
    trigger: { event: 'keyboard-usage', threshold: 80 },
    title: 'Mestre dos Atalhos! ⌨️',
    celebration: true
  },
  {
    id: 'ai-power-user',
    trigger: { event: 'ai-features-used', count: 10 },
    title: 'Expert em IA! ✨',
    celebration: true
  }
];

// Remover milestones de 10, 50 fotos (muito cedo)
// Focar em conquistas reais
```

**Apresentação Não-Intrusiva:**

```tsx
// Usar MilestoneNotification ao invés de MilestoneModal
// Apenas toast no canto, não modal full-screen
<MilestoneNotification /> // Pequeno, dismissable, discreto
```

---

### Empty States: Mais Concisos

**Problema:** Textos longos, múltiplos CTAs, muita informação

**Solução:**

```tsx
// Versão concisa
<EmptyStateUnified
  type="library-empty"
  title="Biblioteca vazia"
  description="Adicione uma pasta para começar"
  onAction={handleAddFolder}
  // Sem: benefits list, stats, secondary CTA, tips
/>
```

**Regra:**
- Máximo 2 linhas de descrição
- 1 CTA primário
- Sem tips (usuário já sabe usar arrastar/soltar)

---

## 📊 Métricas de Sucesso REAIS

### ❌ Métricas Erradas (Vaidade)

- Quantos tooltips foram vistos
- Quantos milestones foram alcançados
- Taxa de conclusão do checklist

### ✅ Métricas Certas (Valor)

- **Time to First Value:** Quanto tempo até marcar primeira foto?
- **Completion Rate:** % de usuários que marcam 100+ fotos
- **Retention D7/D30:** Voltam ao app?
- **Feature Adoption (Organic):** Descobrem Smart Culling sozinhos?
- **NPS:** Recomendariam o app?

### 🎯 Meta Principal

> "Usuário marca 20 fotos em < 5 minutos, SEM ajuda"

Se precisar do checklist/tooltips, o design do app que está errado, não o usuário.

---

## 🚀 Roadmap Revisado - Implementação Consciente

### Fase 1: Minimalist Foundations (Agora)

**O QUE FAZER:**
- ✅ Sistema de tracking (invisível para usuário)
- ✅ 2-3 tooltips essenciais (só se necessário)
- ⚠️ Checklist minimalista (1 linha, colapsada)
- ⚠️ 3-4 milestones (100, 500, keyboard, AI)
- ✅ Empty states concisos

**O QUE NÃO FAZER:**
- ❌ Pro tips automáticos (spam)
- ❌ Celebrações full-screen
- ❌ 7 itens de checklist sempre visíveis
- ❌ Tooltips em todo lugar

### Fase 2: Observar e Ajustar

- Implementar analytics
- Ver onde usuários travam DE VERDADE
- Adicionar ajuda APENAS onde há fricção real
- Remover o que não está ajudando

### Fase 3: Personalização

- Detectar expertise automaticamente
- Reduzir onboarding para experts
- Aumentar para quem precisa
- Dar controle total ao usuário

---

## 🎨 Design Principles Revisados

### Original (Errado)
> "Ensinar todas as features para maximizar feature adoption"

### Corrigido (Certo)
> "Remover fricção para que usuário descubra valor naturalmente"

---

### Original (Errado)
> "Gamificação e celebrações aumentam engajamento"

### Corrigido (Certo)
> "Celebrar conquistas reais, não steps artificiais"

---

### Original (Errado)
> "Mais tooltips = usuário mais educado"

### Corrigido (Certo)
> "Design intuitivo = usuário não precisa de tooltips"

---

## 💡 Exemplos de Outros Apps

### Bons Exemplos (Respeito ao Usuário)

**Lightroom:**
- Onboarding: 0 tooltips
- Design tão intuitivo que não precisa
- Shortcuts visíveis na UI (ícones com letras)

**VSCode:**
- Welcome screen com "Don't show again"
- Tooltips só no hover (não automáticos)
- Command Palette para descoberta

**Figma:**
- Onboarding interativo de 2 minutos
- Depois: ZERO intrusão
- Aprende fazendo, não lendo

### Maus Exemplos (Sobrecarga)

**Muitos Apps SaaS:**
- Tour forçado de 10+ passos
- Tooltips piscando constantemente
- Checklist permanente no dashboard
- Gamificação forçada

---

## 🔧 Ajustes Imediatos Recomendados

### 1. Adicionar Modo "Silencioso" por Padrão

```typescript
// onboarding-service.ts
const DEFAULT_SETTINGS: OnboardingSettings = {
  intensity: 'moderate', // não 'full'!
  autoDetectExpertise: true, // reduz automaticamente
  respectFlowState: true, // não interrompe trabalho
};
```

### 2. Checklist: Colapsado por Padrão

```tsx
// FirstUseChecklist.tsx
const [isExpanded, setIsExpanded] = useState(false); // era true
```

### 3. Milestones: Toast ao Invés de Modal

```tsx
// App.tsx
<MilestoneNotification /> // não <MilestoneModal />
```

### 4. Tooltips: Opt-in, Não Opt-out

```typescript
// Tooltip só aparece se usuário habilitar ou se detectar fricção
shouldShowTooltip(id): boolean {
  return this.settings.showTooltips && this.hasShownFriction();
}
```

---

## 📝 Checklist de "Não Irritar Usuário"

Antes de mostrar QUALQUER elemento de onboarding, perguntar:

- [ ] Isso adiciona valor IMEDIATO ao usuário?
- [ ] Isso pode esperar até depois?
- [ ] Usuário pediu por isso?
- [ ] Há outra forma menos intrusiva?
- [ ] Posso fazer o design ser mais óbvio ao invés de explicar?
- [ ] Isso respeita o fluxo de trabalho atual do usuário?
- [ ] Tem opção fácil de desligar?
- [ ] Desaparece quando não é mais necessário?

Se resposta for "não" para qualquer pergunta: **NÃO MOSTRAR**

---

## 🎯 Conclusão

### Princípio de Ouro

> **"O melhor onboarding é aquele que o usuário não percebe"**

### Implementação Ideal

1. **App é intuitivo** → Usuário descobre sozinho
2. **Usuário trava** → Detecta fricção → Oferece ajuda contextual
3. **Usuário progride** → Sistema se torna invisível
4. **Usuário domina** → Zero intrusão, 100% produtividade

### Remember

O objetivo do Zona21 não é ensinar o app.
O objetivo é **curar fotos rapidamente**.

Todo elemento de UI deve servir esse objetivo ou sair do caminho.

---

**Criado em:** 28 Janeiro 2026
**Status:** Princípios para revisão da implementação
**Próximo Passo:** Ajustar implementação atual para modo "less is more"
