# Roadmap Priorizado - Zona21 até v1.0

> **Objetivo:** Implementar features de maior impacto em crescimento e retenção, baseadas em princípios Growth.design e análise competitiva.

## 🎉 STATUS DA IMPLEMENTAÇÃO

**Data de Atualização:** 2026-01-29

**Sprints Completados:** 4 de 4 ✅

| Sprint | Status | Features | Data Conclusão |
|--------|--------|----------|----------------|
| **Sprint 1** | ✅ Completo | Review Modal, Compare Mode | 2026-01-29 |
| **Sprint 2** | ✅ Completo | Smart Culling, Quick Edit | 2026-01-29 |
| **Sprint 3** | ✅ Completo | Batch Edit, Video Trim | 2026-01-29 |
| **Sprint 4** | ✅ Completo | Instagram Scheduler | 2026-01-29 |

**Total:** 7 features implementadas | 0 features pendentes

**Próximo:** Refinamentos growth.design + Polish para v1.0 🚀

---

## 🎯 Framework de Priorização

**RICE Score = (Reach × Impact × Confidence) / Effort**

- **Reach**: % de usuários impactados (0-100%)
- **Impact**: Impacto no objetivo (1=baixo, 2=médio, 3=alto)
- **Confidence**: Certeza do impacto (0-100%)
- **Effort**: Dias de trabalho (1-20)

**Objetivo Principal:** Reduzir fricção + Aumentar wow moments + Criar loops de retenção

---

## 📊 Priorização Completa

| # | Feature | Reach | Impact | Conf | Effort | **RICE** | Sprint | Status |
|---|---------|-------|--------|------|--------|----------|--------|--------|
| 1 | **Review Modal** | 100% | 3 | 100% | 1 | **300** | S1 | ✅ |
| 2 | **Compare 2-4 Fotos** | 90% | 3 | 90% | 3 | **81** | S1 | ✅ |
| 3 | **Smart Culling Sidebar** | 70% | 2 | 80% | 3 | **37** | S2 | ✅ |
| 4 | **Quick Edit Básico** | 80% | 3 | 80% | 5 | **38** | S2 | ✅ |
| 5 | **Batch Quick Edit** | 50% | 3 | 90% | 3 | **45** | S3 | ✅ |
| 6 | **Video Trim** | 40% | 3 | 70% | 4 | **21** | S3 | ✅ |
| 7 | **Instagram Scheduler** | 60% | 3 | 70% | 10 | **13** | S4 | ✅ |
| 8 | **Export LR/Premiere** | 40% | 2 | 100% | 4 | **20** | Backlog |
| 9 | **Collaborative Review** | 30% | 3 | 60% | 8 | **7** | Backlog |

---

## 🚀 Sprint 1 (Semana 1-2) - Fundação de Confiança
**Tema:** "Aumentar confiança nas decisões de culling"

### ✅ 1. Review Modal (1 dia) - RICE 300
**Por quê primeiro:** Maior RICE score, implementação rápida, impacto imediato

#### Problema que resolve
- 😰 **Medo atual:** "E se eu apagar a foto errada?"
- 😰 **Arrependimento:** Usuário apaga e depois se arrepende
- 😰 **Fricção:** Precisa conferir antes de deletar

#### Solução
Modal de confirmação com preview antes de apagar/exportar

```
┌──────────────────────────────────────────────────┐
│  ⚠️  Você vai apagar 47 fotos                    │
│                                                  │
│  [Grid 4x4 thumbnails]                           │
│  [←] [→] Navegar                                 │
│                                                  │
│  [ Cancelar ]  [ 🗑️ Confirmar e Apagar ]         │
└──────────────────────────────────────────────────┘
```

#### Growth Principles aplicados
- ✅ **Celebration Moment**: "Você organizou 250 fotos e vai manter apenas 47 incríveis! 📸"
- ✅ **Safety Net**: Undo fácil + preview = confiança
- ✅ **Progressive Disclosure**: Mostra só quando necessário

#### Métricas de sucesso
- ↓ 50% em fotos apagadas por arrependimento
- ↑ Confiança → mais usuários usam culling agressivo
- ↑ NPS pela feature de segurança

#### Implementação
**Arquivos:**
- `src/components/ReviewModal.tsx` (novo)
- `src/App.tsx` (integração)

**Fluxo:**
1. User seleciona fotos + clica "Apagar"
2. Modal abre com grid de preview
3. User pode navegar/remover items
4. Confirma → deleta + celebration toast

**Esforço:** 1 dia
- [ ] Criar ReviewModal component
- [ ] Grid 4x4 com navegação
- [ ] Integrar em App (delete + export)
- [ ] Celebration toast após ação

---

### ✅ 2. Compare 2-4 Fotos (3 dias) - RICE 81
**Por quê segundo:** Segunda maior prioridade, resolve problema crítico de culling

#### Problema que resolve
- 🤔 **Indecisão:** "Qual dessas 4 fotos similares é melhor?"
- ⏱️ **Lento:** Alterna entre fotos individualmente
- 😵 **Memória visual:** Difícil lembrar qual era melhor

#### Solução
Modo compare lado a lado com zoom sincronizado

```
┌─────────┬─────────┬─────────┬─────────┐
│ Foto A  │ Foto B  │ Foto C  │ Foto D  │
│  [★]    │  [✓]    │  [✗]    │  [?]    │
└─────────┴─────────┴─────────┴─────────┘
  Tecla:     1         2         3         4
```

#### Growth Principles aplicados
- ✅ **Atalhos intuitivos**: Números 1-4 para escolher (natural)
- ✅ **Feedback visual imediato**: Checkmark aparece na escolhida
- ✅ **Flow state**: Space para próximo grupo = sem quebrar ritmo

#### Métricas de sucesso
- ↑ 30% velocidade de culling (menos tempo por foto)
- ↑ Qualidade das escolhas (menos fotos desfocadas aprovadas)
- ↑ Uso de "Fotos Similares" da IA

#### Implementação
**Arquivos:**
- `src/components/CompareView.tsx` (novo)
- `src/hooks/useCompareMode.ts` (novo)
- `src/App.tsx` (integração)

**Features:**
- Suporta 2-4 fotos lado a lado
- Zoom sincronizado (scroll = zoom todas)
- Pan sincronizado (opcional, toggle)
- Focus peaking overlay
- Metadata comparativa
- Atalhos: `1-4` select, `Space` próximo, `Esc` sair

**Esforço:** 3 dias
- [ ] CompareView layout responsivo
- [ ] Zoom/pan sincronizado
- [ ] Keyboard shortcuts
- [ ] Integração com similares IA
- [ ] Focus peaking overlay

---

## 🎨 Sprint 2 (Semana 3-4) - Agilidade e IA
**Tema:** "Reduzir fricção no workflow"

### ✅ 3. Smart Culling Sidebar (3 dias) - RICE 37
**Por quê terceiro:** Expõe valor da IA que já existe

#### Problema que resolve
- 🤷 **IA invisível:** "O que a IA está analisando?"
- 🎲 **Decisão sem contexto:** User não sabe se foto tem problema
- 💎 **Valor escondido:** IA já detecta tudo, mas não mostra

#### Solução
Painel lateral com insights da IA durante culling

```
┌──────────────────────────┐
│ 📸 IMG_2456.jpg          │
│                          │
│ ✅ Foco: Perfeito (98%)  │
│ ✅ Exposição: Ótima      │
│ ⚠️  Olhos fechados (1)   │
│ 🎨 Composição: Boa       │
│                          │
│ 📊 Similares: 5          │
│    [thumb][thumb][thumb] │
│                          │
│ 🏷️  Tags IA:             │
│    #retrato #outdoor     │
│                          │
│ [👍 Aprovar] [👎 Rejeitar]│
└──────────────────────────┘
```

#### Growth Principles aplicados
- ✅ **Aha Moment**: "Wow, a IA viu que os olhos estão fechados!"
- ✅ **Value Perception**: User vê que IA está trabalhando
- ✅ **Data-driven decisions**: Não é feeling, é análise objetiva

#### Métricas de sucesso
- ↑ Confiança nas rejeições
- ↑ Uso do Smart Culling (user entende o valor)
- ↓ Tempo de indecisão (dados claros = decisão rápida)

#### Implementação
**Arquivos:**
- `src/components/SmartCullingSidebar.tsx` (novo)
- `src/components/Viewer.tsx` (integração)

**Dados já existentes:**
- AI quality score
- Face detection
- Focus detection
- Fotos similares
- Tags

**Esforço:** 3 dias
- [ ] Sidebar component
- [ ] Quality indicators UI
- [ ] Thumbnails similares
- [ ] Toggle show/hide
- [ ] Keyboard shortcut (S = sidebar)

---

### ✅ 4. Quick Edit Básico (5 dias) - RICE 38
**Por quê quarto:** Remove dependência de app externo

#### Problema que resolve
- 🔁 **Workflow quebrado:** Zona21 → Lightroom → voltar
- 🐌 **Lento:** Abrir editor só pra crop simples
- 📱 **Instagram friction:** Precisa redimensionar fora

#### Solução
Edição básica não-destrutiva no viewer

**Ferramentas:**
- **Crop**: Presets (1:1, 4:5, 16:9, livre)
- **Rotate**: 90° CW/CCW, flip H/V
- **Resize**: Presets Instagram (1080x1080, 1080x1920)
- **Ajustes rápidos**: Brightness, contrast (opcional)

#### Growth Principles aplicados
- ✅ **Zero Context Switching**: Tudo em um app
- ✅ **Smart Defaults**: Presets Instagram ready
- ✅ **Non-destructive**: Original preservado = segurança

#### Métricas de sucesso
- ↑ 40% fotos exportadas prontas para uso
- ↓ Aberturas de apps externos
- ↑ Retenção (menos saída para outros apps)

#### Implementação
**Arquivos:**
- `src/components/QuickEditPanel.tsx` (novo)
- `src/hooks/useQuickEdit.ts` (novo)
- `electron/main/quick-edit.ts` (backend sharp)

**Tech stack:**
- Canvas overlay para crop/rotate
- Sharp no backend para processar
- LocalStorage para presets customizados

**Esforço:** 5 dias
- [ ] Crop tool com canvas
- [ ] Aspect ratio presets
- [ ] Rotate/flip logic
- [ ] Resize presets
- [ ] Sharp integration
- [ ] Preview em tempo real
- [ ] Export edited

---

## 🔥 Sprint 3 (Semana 5-6) - Produtividade Pro
**Tema:** "Features para power users"

### ✅ 5. Batch Quick Edit (3 dias) - RICE 45
**Por quê quinto:** Multiplica valor do Quick Edit

#### Problema que resolve
- 😫 **Repetição:** Crop manual em 50 fotos
- ⏱️ **Tempo perdido:** 30 segundos × 50 fotos = 25 minutos
- 🎯 **Consistência:** Mesma proporção em todas

#### Solução
Aplicar edição em múltiplas fotos

**Flow:**
1. User seleciona 50 fotos verticais
2. Crop primeira em 4:5 (Instagram)
3. "Aplicar em todas" ou "Aplicar em similares (orientação)"
4. Preview grid mostra resultado
5. Confirma → processa em batch

#### Growth Principles aplicados
- ✅ **Time Saved**: "Você economizou 24 minutos! ⏱️"
- ✅ **Consistency**: Todas fotos com mesmo aspect
- ✅ **Power User Feature**: Profissionais amam batch

#### Métricas de sucesso
- ↑ 10x produtividade em tarefas repetitivas
- ↑ Uso do Quick Edit (agora vale a pena)
- ↑ NPS de fotógrafos profissionais

#### Implementação
**Esforço:** 3 dias
- [ ] Batch processor backend
- [ ] Preview grid antes de aplicar
- [ ] Progress bar durante processo
- [ ] Celebration: "50 fotos processadas em 2min!"

---

### ✅ 6. Video Trim Básico (4 dias) - RICE 21
**Por quê sexto:** Fecha workflow de vídeo

#### Problema que resolve
- 🎬 **Clip longo:** 2 minutos de vídeo, só quer 10 segundos
- 📤 **Upload pesado:** Enviar vídeo inteiro é lento
- ✂️ **Fricção externa:** Abrir Final Cut só pra trim

#### Solução
Trim básico com handles no timeline

```
[────|████████████|────]
     In          Out
```

**Features:**
- Arraste handles In/Out
- Preview tempo selecionado
- Extract audio (MP3)
- Export apenas seleção

#### Growth Principles aplicados
- ✅ **Quick Task Done**: Trim em 10 segundos
- ✅ **Audio Extraction**: Bonus feature útil
- ✅ **Social Ready**: Vídeo no tamanho certo

#### Métricas de sucesso
- ↑ Uso com vídeos (não só fotos)
- ↑ Exports de vídeo curtos
- ↑ Retenção de filmmakers

#### Implementação
**Tech:**
- FFmpeg para trim (já instalado)
- Canvas para timeline UI
- Preview com video element

**Esforço:** 4 dias
- [ ] Timeline UI com handles
- [ ] Preview seleção
- [ ] FFmpeg trim integration
- [ ] Audio extraction
- [ ] Progress feedback

---

## 💰 Sprint 4 (Semana 7-10) - Monetização ✅ COMPLETO
**Tema:** "Killer feature + growth loop viral"
**Status:** ✅ Implementado (2026-01-29)

### ✅ 7. Instagram Scheduler (10 dias) - RICE 13
**Por quê sétimo:** Feature diferencial única, growth loop viral
**Status:** ✅ Backend + Frontend MVP completos

#### Problema que resolve
- 📱 **Workflow quebrado:** Culling → Edição → Instagram (manual)
- ⏰ **Timing ruim:** Publica quando lembra (não melhor horário)
- 📊 **Sem planejamento:** Feed desorganizado

#### Solução
Agendar posts direto do Zona21

**MVP Features:**
- Conectar Instagram (OAuth)
- Arrastar fotos para calendário
- Adicionar caption + hashtags
- Preview 1:1 / 4:5 / Story
- Queue visual
- Notificação para publicar

#### Growth Loop Viral 🔁
```
1. User culling fotos
   ↓
2. Encontra fotos perfeitas
   ↓
3. Agenda no Instagram via Zona21
   ↓
4. Zona21 publica com "📸 via Zona21" discreto
   ↓
5. Seguidores veem foto linda
   ↓
6. Alguns perguntam: "Como faz isso?"
   ↓
7. User compartilha Zona21
   ↓
LOOP REINICIA
```

#### Modelo Freemium
- **Free**: 5 posts/mês agendados
- **Pro ($5/mês)**: Posts ilimitados
- **Conversão esperada**: 10-15% free → pro

#### Growth Principles aplicados
- ✅ **Network Effect**: Cada post = micro-marketing
- ✅ **Habit Formation**: User volta diário para gerenciar queue
- ✅ **Aha Moment**: "Zona21 organiza E publica!"

#### Métricas de sucesso
- ↑ 2x retenção (usuários com posts agendados)
- ↑ Viralidade orgânica via Instagram
- ↑ Conversão Free → Pro (target: 10%)
- ↑ DAU/MAU ratio (check diário da queue)

#### Implementação
**Tech stack:**
- Instagram Graph API (oficial)
- SQLite para queue local
- Electron notifications
- React DnD para calendário

**Esforço:** 10 dias
- [ ] OAuth Instagram
- [ ] Calendar UI (drag & drop)
- [ ] Caption editor
- [ ] Preview 1:1/4:5/story
- [ ] Queue manager
- [ ] Notification system
- [ ] Publish logic
- [ ] Freemium gate (5 posts)
- [ ] Pro upgrade flow

---

## 📦 Backlog (Post v1.0)
**Features para depois da v1.0**

### 8. Export Lightroom/Premiere (4 dias) - RICE 20

#### O que é
- **Lightroom**: Export XMP com ratings + collections
- **Premiere**: Export XML com In/Out points
- **Final Cut**: FCPXML support

#### Por que backlog
- Já existe export básico
- Não é diferencial competitivo crítico
- Audiência menor (pro editors)

#### Quando implementar
- Após v1.0 lançada
- Se receber pedidos de usuários
- Para upgrade Pro → Business

---

### 9. Collaborative Review (8 dias) - RICE 7

#### O que é
Link compartilhável para cliente aprovar fotos

**Free tier:**
- Link único
- Cliente aprova/rejeita
- Expira 7 dias

**Pro tier:**
- Links ilimitados
- Comentários
- Download cliente
- Branding customizado

#### Por que backlog
- Complexidade alta (auth, permissões, web app)
- ROI incerto (quantos usam colaboração?)
- Requer infraestrutura (hosting links)

#### Quando implementar
- Após validar demand (surveys)
- Se conseguir parceria com plataforma (tipo Dropbox)
- Para tier Business ($15/mês)

---

## 🎯 Roadmap Visual

```
Semana 1-2: SPRINT 1 - Fundação
├─ Review Modal (1d) ████████████████████████████████ RICE 300
└─ Compare 2-4 (3d)  █████████ RICE 81

Semana 3-4: SPRINT 2 - Agilidade
├─ Smart Sidebar (3d) ████ RICE 37
└─ Quick Edit (5d)    ████ RICE 38

Semana 5-6: SPRINT 3 - Produtividade
├─ Batch Edit (3d)  █████ RICE 45
└─ Video Trim (4d)  ███ RICE 21

Semana 7-10: SPRINT 4 - Monetização
└─ Instagram (10d)  ██ RICE 13 (mas ALTO potencial viral)

Post v1.0: BACKLOG
├─ Export LR/Premiere (4d) ███ RICE 20
└─ Collaborative (8d) █ RICE 7
```

---

## 📊 Princípios Growth.design Aplicados

### 1. Zero Friction Onboarding ✅
- Review Modal: sem medo de apagar
- Compare Mode: decisões rápidas
- Quick Edit: sem sair do app

### 2. Aha Moments ✨
- Smart Sidebar: "IA viu os olhos fechados!"
- Batch Edit: "Economizou 24 minutos!"
- Instagram: "Publica direto daqui?!"

### 3. Celebration Moments 🎉
- "Você organizou 250 fotos!"
- "50 fotos processadas em 2 minutos!"
- "3 posts agendados para semana"

### 4. Habit Loops 🔁
- Daily: Check Instagram queue
- Weekly: Culling + schedule posts
- Monthly: Ver stats de produtividade

### 5. Network Effects 📈
- Instagram posts = marketing viral
- "via Zona21" discreto = awareness
- User shares = aquisição orgânica

---

## 🎨 Design System Consistente

Todas features seguem:

**Visual:**
- Glassmorphism
- Gradient accents
- Smooth animations
- Dark mode native

**UX:**
- Atalhos de teclado consistentes
- Undo em tudo (Cmd+Z)
- Progressive disclosure
- Feedback imediato

**Tone:**
- Celebration messages
- Time saved indicators
- Encouraging (não intimidador)

---

## 📈 Métricas de Sucesso por Sprint

### Sprint 1
- **Ativação**: ↑ 50% usuários que completam primeiro culling
- **Confiança**: ↓ 50% arrependimento em delete
- **Velocidade**: ↑ 30% fotos/hora no culling

### Sprint 2
- **Produtividade**: ↑ 40% fotos exportadas prontas
- **Percepção IA**: ↑ 80% users sabem que IA está analisando
- **Retenção**: ↓ 30% saída para apps externos

### Sprint 3
- **Power Users**: ↑ 10x velocidade em batch tasks
- **Uso Vídeo**: ↑ 50% imports de vídeo
- **NPS**: ↑ 20 pontos (target: 50+)

### Sprint 4
- **Monetização**: 10% conversão Free → Pro
- **Viralidade**: 1.2 K-factor (cada user traz 1.2 novos)
- **Engagement**: ↑ 2x DAU/MAU ratio

---

## 🚀 Como Executar

### Desenvolvimento
1. **Sprint Planning**: Review este doc, ajustar estimativas
2. **Daily**: Implementar features em ordem de prioridade
3. **Testing**: Build arm64 para testar cada feature
4. **Iteration**: Ajustar baseado em feedback

### Validação
- Analytics no app (track usage de cada feature)
- User interviews (5 users por sprint)
- NPS survey (mensal)
- Conversion funnel (free → pro)

### Launch
- Soft launch: Beta testers (50 users)
- Product Hunt: Após Sprint 3 completo
- Redes sociais: Casos de uso reais
- SEO: Blog posts sobre cada feature

---

## 💡 Quick Wins Fora do Código

Enquanto implementa:

1. **Onboarding video** (1 min): Mostrando workflow completo
2. **Keyboard shortcuts poster**: PDF para download
3. **Case studies**: 3 fotógrafos usando Zona21
4. **Instagram content**: Behind the scenes do desenvolvimento
5. **Beta community**: Discord/Telegram para early adopters

---

## ✨ Diferencial Competitivo Final

**Ao completar Sprint 1-3:**
- ✅ Mais rápido que Photo Mechanic ($150)
- ✅ Mais completo que FastRawViewer ($25)
- ✅ Mais ágil que Adobe Bridge (grátis com CC)
- ✅ Mais inteligente que ACDSee ($150)
- ✅ Mais completo que Aftershoot ($10/mês)

**Ao completar Sprint 4:**
- 🔥 **ÚNICO** com Instagram integration
- 🔥 **ÚNICO** freemium real (não trial)
- 🔥 **ÚNICO** foto + vídeo + social em um app

---

## 📌 Status Atual e Próximos Passos

**✅ COMPLETADO (2026-01-29):**
- ✅ Sprint 1: Review Modal + Compare Mode
- ✅ Sprint 2: Smart Culling + Quick Edit
- ✅ Sprint 3: Batch Edit + Video Trim
- ✅ Sprint 4: Instagram Scheduler
- ✅ Security Hardening (6 vulnerabilidades corrigidas)

**🎯 Próximo: Refinamentos para v1.0**

**Opções de implementação:**

1. **Growth & Delight Features** (Recomendado)
   - Enhanced Milestone System (celebrations + stats)
   - Smart Onboarding (tutorial interativo)
   - Productivity Dashboard (gamification leve)
   - **Esforço:** 7 horas | **Impacto:** Alto em retenção

2. **Polish & UX Improvements**
   - Enhanced Celebrations (animations + sounds)
   - Keyboard Shortcuts Discovery (progressive disclosure)
   - Smart Suggestions (feature discovery)
   - **Esforço:** 7 horas | **Impacto:** Médio em satisfação

3. **Backlog Features**
   - Export Lightroom/Premiere (RICE 20)
   - Performance Optimizations
   - **Esforço:** 3-4 dias | **Impacto:** Alto para pro users

---

**Pronto para começar Sprint 1? 🚀**
