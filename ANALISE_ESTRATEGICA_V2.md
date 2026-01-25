# Zona21 - Análise Estratégica e Roadmap

**Data**: 24 de Janeiro de 2026  
**Versão Atual**: 0.1.0  
**Autor**: Análise técnica, produto e UX consolidada

---

## 📊 Sumário Executivo

### O que é o Zona21
Plataforma desktop (Electron) de **ingestão, catalogação e seleção de mídia** para fotógrafos e videomakers profissionais. Compete com Photo Mechanic, Kyno e Adobe Bridge.

### Status Atual
- **Core funcional**: 95% completo
- **UX/Polish**: 60% (funcional mas precisa refinamento)
- **Distribuição**: Em beta (sem assinatura Apple)
- **Estabilidade**: Boa para MVP, precisa hardening

### Principais Forças
1. Performance em bibliotecas grandes (virtualização)
2. Export direto para Premiere/Resolve (XML) e Lightroom (XMP)
3. Sistema de decisões completo (ratings, flags, reject, notes)
4. Auto-update funcional via Cloudflare R2

### Principais Gaps
1. Notarização macOS pendente (erro "is damaged")
2. UX inconsistente em alguns fluxos
3. Falta sistema de logs exportáveis para suporte
4. Credenciais de produção expostas (R2, Anthropic)

---

## 🔧 Análise Técnica (Líder Técnico)

### Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERER (React 18)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ App.tsx │ │ Library │ │ Viewer  │ │ Sidebar │           │
│  │ (1298   │ │ (bento) │ │ (zoom/  │ │ (volumes│           │
│  │  lines) │ │         │ │  video) │ │  /cols) │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│        │                                                     │
│        ▼ IPC (preload)                                       │
├─────────────────────────────────────────────────────────────┤
│                    MAIN PROCESS (Node.js)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ index.ts    │ │ indexer.ts  │ │ database.ts │            │
│  │ (IPC +      │ │ (ffmpeg/    │ │ (SQLite +   │            │
│  │  protocols) │ │  exiftool)  │ │  better-    │            │
│  │             │ │             │ │  sqlite3)   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ volume-     │ │ exporters/  │ │ binary-     │            │
│  │ manager.ts  │ │ (xml, xmp)  │ │ paths.ts    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Stack Técnico

| Camada | Tecnologia | Versão | Status |
|--------|------------|--------|--------|
| Framework | Electron | 28.1.3 | ✅ Estável |
| UI | React | 18.2.0 | ✅ Estável |
| Styling | Tailwind CSS | 4.1.18 | ✅ Funcional |
| State | useState/useRef | - | ⚠️ Monolítico |
| Build | Vite | 5.0.11 | ✅ Funcional |
| Database | better-sqlite3 | 11.0.0 | ✅ Performante |
| Video | fluent-ffmpeg | 2.1.2 | ✅ Bundled |
| Metadata | exiftool-vendored | 25.1.0 | ✅ Funcional |
| Images | sharp | 0.33.1 | ✅ Nativo OK |
| Auto-update | electron-updater | 6.3.9 | ✅ R2 feed |
| Testes | Vitest | 4.0.17 | ✅ Cobertura básica |

### Pontos Fortes Técnicos

1. **Virtualização robusta**: Grid bento com renderização apenas de itens visíveis
2. **Protocolos customizados**: `zona21thumb://` e `zona21file://` para servir mídia
3. **Binary bundling**: ffmpeg/ffprobe empacotados corretamente em `app.asar.unpacked`
4. **Fallbacks**: Indexação não quebra se arquivo falhar
5. **Testes**: Cobertura de ~70% em módulos críticos (database, indexer, volume-manager)

### Débitos Técnicos

| Débito | Severidade | Esforço | Recomendação |
|--------|------------|---------|--------------|
| App.tsx monolítico (1298 linhas) | Alta | 2-3 dias | Migrar para Zustand stores |
| Sidebar.tsx gigante (51KB) | Média | 1-2 dias | Extrair subcomponentes |
| `catch { // ignore }` em vários lugares | Alta | 1 dia | Implementar ErrorHandler |
| Logs sem persistência | Alta | 1 dia | Sistema de logs exportáveis |
| Credenciais hardcoded/expostas | Crítica | 1 hora | Rotacionar imediatamente |
| Sem CI/CD configurado | Média | 1 dia | GitHub Actions |

### Recomendações Técnicas

#### Curto Prazo (v0.2)
1. **Extrair estado do App.tsx**: Criar Zustand stores para assets, UI, volumes
2. **ErrorHandler centralizado**: Substituir todos os `catch { }` por tratamento adequado
3. **Sistema de logs**: Persistir em arquivo, botão "Exportar Logs"
4. **Rotacionar credenciais**: R2 e Anthropic foram expostas

#### Médio Prazo (v0.3)
1. **CI/CD**: GitHub Actions para build + upload R2
2. **Notarização macOS**: Configurar assinatura Apple ($99/ano)
3. **Testes E2E**: Playwright para fluxos críticos
4. **Memory profiling**: Identificar leaks em bibliotecas grandes

#### Longo Prazo (v1.0+)
1. **Plugins/extensões**: Arquitetura para exporters customizados
2. **Cloud sync**: Sincronizar decisões entre máquinas (opcional)
3. **IA integrada**: Anthropic Claude para auto-tagging

---

## 📦 Análise de Produto (Líder de Produto)

### Proposta de Valor

**Para**: Fotógrafos e videomakers profissionais  
**Que**: Precisam selecionar e organizar grandes volumes de mídia rapidamente  
**O Zona21**: É uma plataforma desktop de culling e catalogação  
**Que**: Permite decisões rápidas com atalhos de teclado e export direto para NLEs  
**Diferente de**: Photo Mechanic (caro), Adobe Bridge (lento), Kyno (descontinuado)  
**Nosso produto**: É gratuito/acessível, rápido e integrado com workflows profissionais

### Funcionalidades por Prioridade

#### ✅ Core (MVP) - 100% Completo
| Feature | Status | Notas |
|---------|--------|-------|
| Indexação de pastas | ✅ | Foto + vídeo + RAW |
| Grid virtualizado | ✅ | Performance 10k+ |
| Thumbnails persistentes | ✅ | Cache em userData |
| Ratings (1-5) + atalhos | ✅ | Teclas 1-5, 0 |
| Flags (pick) + atalho P | ✅ | |
| Reject + atalho X | ✅ | |
| Notes com auto-save | ✅ | Full-text search |
| Navegação por setas | ✅ | ←→↑↓ |
| Filtros básicos | ✅ | Tipo, rating, flagged |
| Export Premiere/Resolve | ✅ | FCP XML |
| Export Lightroom | ✅ | XMP sidecar |
| Volume tracking | ✅ | Detecta discos |
| Auto-update | ✅ | R2 generic feed |

#### ⚠️ Secundário - 80% Completo
| Feature | Status | Gap |
|---------|--------|-----|
| Bento/masonry layout | ✅ | |
| Seleção por lasso | ✅ | |
| Agrupamento por data | ✅ | |
| Copy/Export com progresso | ✅ | |
| ZIP export | ✅ | |
| Detecção de duplicatas | ✅ | |
| Smart Collections | ⚠️ | Backend OK, UI falta |
| Tags UI | ⚠️ | Backend OK, UI falta |
| Color labels UI | ⚠️ | Backend OK, UI falta |

#### ❌ Futuro - Não Iniciado
| Feature | Prioridade | Versão Alvo |
|---------|------------|-------------|
| Preferências/Config | Alta | v0.2 |
| Busca semântica (IA) | Média | v1.0+ |
| Auto-tagging (IA) | Média | v1.0+ |
| Face detection | Baixa | v1.5+ |
| Colaboração | Baixa | v2.0+ |

### Análise Competitiva

| Aspecto | Zona21 | Photo Mechanic | Adobe Bridge | Kyno |
|---------|--------|----------------|--------------|------|
| **Preço** | Grátis/Acessível | $139 | Assinatura CC | Descontinuado |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Export NLE** | ✅ XML | ✅ | ❌ | ✅ |
| **Export Lightroom** | ✅ XMP | ✅ | Nativo | ❌ |
| **RAW support** | ✅ Preview | ✅ Full | ✅ Full | ✅ |
| **Video support** | ✅ | ⚠️ Básico | ⚠️ | ✅ |
| **macOS native** | ✅ Electron | ✅ | ✅ | ✅ |
| **Curva aprendizado** | Baixa | Média | Alta | Média |

### Oportunidades de Mercado

1. **Preço**: Photo Mechanic custa $139 - usuários buscam alternativas
2. **Kyno descontinuado**: Usuários órfãos procurando substituição
3. **Workflow híbrido**: Fotógrafos que também fazem vídeo precisam de ferramenta unificada
4. **Simplicidade**: Bridge é complexo demais para culling rápido

### Métricas de Sucesso por Versão

| Versão | Métrica | Target |
|--------|---------|--------|
| v0.2 | Beta testers ativos | 20+ |
| v0.3 | NPS | >8 |
| v1.0 | Usuários ativos | 100+ |
| v1.0 | Crash rate | <0.5% |
| v1.0 | Reviews positivos | 80%+ |

---

## 🎨 Análise de UX (Líder de UX)

### Avaliação Heurística

| Heurística (Nielsen) | Score | Observações |
|---------------------|-------|-------------|
| Visibilidade do estado | ⭐⭐⭐⭐ | Progress bars, toasts OK |
| Correspondência sistema-mundo | ⭐⭐⭐⭐⭐ | Terminologia de foto/vídeo |
| Controle do usuário | ⭐⭐⭐ | Falta cancelar indexação |
| Consistência | ⭐⭐⭐ | Spacings inconsistentes |
| Prevenção de erros | ⭐⭐⭐ | Confirmações OK, mas mensagens vagas |
| Reconhecimento > memória | ⭐⭐⭐⭐ | Atalhos visíveis na UI |
| Flexibilidade | ⭐⭐⭐⭐ | Atalhos + cliques |
| Design minimalista | ⭐⭐⭐⭐ | Clean mas pode melhorar |
| Recuperação de erros | ⭐⭐ | Mensagens técnicas ainda aparecem |
| Ajuda e documentação | ⭐⭐ | Falta onboarding e tooltips |

**Score médio**: 3.5/5 (Bom para MVP, precisa polish)

### Fluxos Críticos - Avaliação

#### 1. Primeira Indexação
```
Estado atual: ⭐⭐⭐
- ✅ Botão "Add Folder" visível
- ✅ Progress bar durante indexação
- ⚠️ Sem onboarding para novos usuários
- ⚠️ Se falhar, mensagem técnica
- ❌ Não explica o que está acontecendo
```

**Melhorias propostas**:
- Onboarding wizard na primeira execução
- Mensagens explicativas durante indexação
- Estimated time remaining

#### 2. Culling (Decisões Rápidas)
```
Estado atual: ⭐⭐⭐⭐
- ✅ Atalhos de teclado funcionam bem
- ✅ Feedback visual imediato
- ✅ Navegação por setas fluida
- ⚠️ Falta visual de "próximo não-decidido"
```

**Melhorias propostas**:
- Auto-advance para próximo asset
- Highlight de assets sem decisão
- Stats de progresso (ex: "147/500 decididos")

#### 3. Export para NLE
```
Estado atual: ⭐⭐⭐⭐
- ✅ Botões claros no Viewer
- ✅ Dialog de salvar funciona
- ✅ Feedback de sucesso
- ⚠️ Não explica o que o XML contém
```

**Melhorias propostas**:
- Preview do que será exportado
- Opções de export (incluir/excluir campos)

#### 4. Instalação (macOS sem assinatura)
```
Estado atual: ⭐⭐
- ❌ Erro "is damaged" assusta usuários
- ❌ Requer Terminal (técnico)
- ⚠️ Documentação existe mas não é in-app
```

**Melhorias propostas (curto prazo)**:
- Guia visual passo-a-passo no site
- Vídeo de 1 minuto
- Script de instalação automática

**Melhoria definitiva (médio prazo)**:
- Assinatura e notarização Apple ($99/ano)

### Problemas de UX Prioritários

| Problema | Impacto | Esforço | Prioridade |
|----------|---------|---------|------------|
| Erro "is damaged" na instalação | Alto | Alto* | P0 |
| Mensagens de erro técnicas | Médio | Baixo | P0 |
| Falta onboarding | Médio | Médio | P1 |
| Inconsistência de spacings | Baixo | Baixo | P2 |
| Falta tooltips | Baixo | Baixo | P2 |

*Alto esforço se considerar assinatura Apple, baixo se apenas documentação

### Design System - Gaps

#### Cores
- ✅ Paleta dark mode consistente
- ⚠️ Falta definição formal de tokens
- ⚠️ Estados (hover, focus, active) inconsistentes

#### Tipografia
- ✅ Fontes carregadas (Bricolage Grotesque, Figtree)
- ⚠️ Escala tipográfica não documentada
- ⚠️ Line-heights inconsistentes

#### Spacing
- ⚠️ Gaps variam (8px, 12px, 16px, 24px sem padrão)
- ⚠️ Padding de containers inconsistente

#### Componentes
- ✅ Botões padronizados (mh-btn)
- ⚠️ Inputs sem estilo consistente
- ⚠️ Modals com estruturas diferentes

### Recomendações de UX

#### Imediato (v0.1.1)
1. Substituir mensagens técnicas por amigáveis
2. Adicionar tooltips nos botões principais
3. Melhorar feedback de operações longas

#### Curto prazo (v0.2)
1. Onboarding wizard
2. Unificar spacings (8, 16, 24, 32)
3. Estados de hover/focus consistentes
4. Progress stats durante culling

#### Médio prazo (v0.3)
1. Design tokens documentados
2. Component library formal
3. Acessibilidade WCAG AA
4. Temas (dark/light)

---

## 🗺️ Roadmap de Versões

### v0.1.1 - Hotfix Produção (1 semana)

**Objetivo**: Estabilizar distribuição e corrigir bugs críticos

| Task | Responsável | Esforço | Prioridade |
|------|-------------|---------|------------|
| Rotacionar credenciais R2/Anthropic | DevOps | 1h | P0 |
| ErrorHandler centralizado | Backend | 4h | P0 |
| Mensagens de erro amigáveis | Full-stack | 4h | P0 |
| Sistema de logs exportáveis | Backend | 8h | P1 |
| Documentação de instalação | Docs | 4h | P1 |
| Script install-zona21.sh | DevOps | 2h | P1 |
| Vídeo tutorial instalação | Marketing | 4h | P2 |

**Entregáveis**:
- App sem mensagens técnicas visíveis
- Logs funcionando em userData
- Guia de instalação completo
- Credenciais rotacionadas

---

### v0.2.0 - UX Refinement (3 semanas)

**Objetivo**: Polish visual e experiência do usuário

#### Sprint 1: Consistência Visual
| Task | Esforço |
|------|---------|
| Definir design tokens (cores, spacing, type) | 4h |
| Unificar spacings em todos os componentes | 8h |
| Padronizar estados (hover, focus, active) | 8h |
| Refatorar Sidebar.tsx (extrair subcomponentes) | 8h |

#### Sprint 2: Fluxos Críticos
| Task | Esforço |
|------|---------|
| Onboarding wizard (primeira execução) | 16h |
| Progress stats durante culling | 8h |
| Tooltips em todos os botões | 4h |
| Melhorar Viewer (controles de zoom) | 8h |

#### Sprint 3: Configurações
| Task | Esforço |
|------|---------|
| Tela de Preferências | 16h |
| Pasta padrão de export | 4h |
| Idioma (PT/BR) | 8h |
| Atalhos visíveis na UI | 4h |

**Entregáveis**:
- UX consistente e polida
- Onboarding funcional
- Preferências básicas
- NPS target: >7

---

### v0.3.0 - Robustez (3 semanas)

**Objetivo**: Performance, estabilidade e distribuição profissional

#### Sprint 1: Performance
| Task | Esforço |
|------|---------|
| Memory profiling (bibliotecas 50k+) | 16h |
| Otimizar virtualização | 8h |
| Lazy loading mais agressivo | 8h |
| Database vacuum automático | 4h |

#### Sprint 2: Robustez
| Task | Esforço |
|------|---------|
| Cancelamento de operações | 16h |
| Retry automático com backoff | 8h |
| Tratamento de erros por arquivo | 8h |
| Testes E2E (Playwright) | 16h |

#### Sprint 3: Distribuição
| Task | Esforço |
|------|---------|
| GitHub Actions (CI/CD) | 8h |
| Assinatura Apple Developer | 4h |
| Notarização automática | 8h |
| Testar em 5+ máquinas | 8h |

**Entregáveis**:
- App estável com 50k+ assets
- Instalação sem erros no macOS
- CI/CD funcionando
- Crash rate target: <1%

---

### v1.0.0 - Release Estável (2 semanas)

**Objetivo**: Versão production-ready

#### Semana 1: QA Final
| Task | Esforço |
|------|---------|
| Testes em macOS Ventura/Sonoma/Sequoia | 16h |
| Testes de stress (50k+ assets) | 8h |
| Testes de upgrade (v0.x → v1.0) | 8h |
| Bug fixing | 16h |

#### Semana 2: Lançamento
| Task | Esforço |
|------|---------|
| Manual do usuário | 16h |
| Release notes | 4h |
| Landing page | 8h |
| **Página do Beta** | 4h |
| Vídeo de apresentação | 8h |

**Entregáveis**:
- Zero bugs críticos
- Documentação completa
- Material de marketing
- 100+ usuários target

---

## 🎯 Priorização (MoSCoW)

### Must Have (v0.2)
- ErrorHandler e mensagens amigáveis
- Logs exportáveis
- Rotação de credenciais
- Onboarding básico
- Consistência visual mínima

### Should Have (v0.3)
- Diminuir tamanho do app
- Integração de I.A para taguemento de assets(Tags/Color labels UI),Face detection, melhorar exclusão de duplicados e Smart Collections UI
- Renomeação feita por IA: Template: {data}_{cliente}_{camera}_{sequencial} customizável
- Notarização macOS
- CI/CD
- Performance otimizada
- Testes E2E

### Could Have (v1.0)
- Temas (dark/light)
- Atalhos customizáveis


### Won't Have (v1.0)
- Cloud sync
- Colaboração

---

## 📋 Próximas Ações Imediatas

### Esta Semana ✅ (Concluído em 25/01/2026)
1. ✅ **CRÍTICO**: Rotacionar credenciais R2 e Anthropic
2. ✅ Implementar ErrorHandler centralizado (`electron/main/error-handler.ts`)
3. ✅ Substituir mensagens técnicas por amigáveis
4. ✅ Criar sistema de logs em userData (já existia `logger.ts`, adicionado export no PreferencesModal)

### UX Improvements Implementados (25/01/2026)
- ✅ Checkbox de seleção no hover dos assets
- ✅ Empty state centralizado
- ✅ Preferências consolidadas no modal (removido da Sidebar)
- ✅ Sidebar atualiza volumes automaticamente após indexação
- ✅ Pastas do sistema mostram nome correto
- ✅ Filtro de volumes hidden nas queries
- ✅ Opção de reiniciar tutorial nas Preferências
- ✅ Botões de exportar/abrir logs no PreferencesModal

### Próxima Semana
1. Finalizar documentação de instalação
2. Gravar vídeo tutorial
3. Build de produção testado
4. Distribuir para 5 beta testers

### Mês 1
1. Completar v0.2 (UX refinement)
2. Coletar feedback de beta testers
3. Iterar baseado em feedback

### Mês 2-3
1. Completar v0.3 (robustez)
2. Configurar assinatura Apple
3. Preparar v1.0

---

## 📊 KPIs de Acompanhamento

| Métrica | Atual | v0.2 Target | v1.0 Target |
|---------|-------|-------------|-------------|
| Beta testers | ~5 | 20+ | 100+ |
| Crash rate | Desconhecido | <2% | <0.5% |
| NPS | - | >7 | >8 |
| Instalação sucesso | ~70% | >90% | >99% |
| Tempo de culling (100 fotos) | - | <5min | <3min |

---

**Documento criado**: 24 de Janeiro de 2026  
**Próxima revisão**: Após lançamento de v0.2.0  
**Responsável**: Zona21 Team
