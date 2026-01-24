# Zona21 - Plano de Versões e Distribuição

**Data**: 24 de Janeiro de 2026
**Versão Atual**: 0.1.0
**Objetivo**: Roadmap para v1.0 e estratégia de distribuição sem assinatura de desenvolvedor

---

## 📋 Resumo Executivo

### Status Atual (v0.1.0)
- ✅ Core funcional completo (indexação, visualização, decisões, exports)
- ✅ Sistema de auto-update configurado (R2 generic feed)
- ✅ Build para macOS (arm64 + x64)
- ✅ Testes e QA em progresso

### Próximos Passos
1. **v0.1.1** - Hotfix e polish (1 semana)
2. **v0.2.0** - UX refinement (2-3 semanas)
3. **v0.3.0** - Robustez e performance (2-3 semanas)
4. **v1.0.0** - Release estável (1 semana de QA final)

### Estratégia de Distribuição
- **macOS sem assinatura**: Guia de instalação manual + whitelist do Gatekeeper
- **Distribuição futura**: Considerar assinatura Apple Developer ($99/ano) após validação de mercado

---

## 🗺️ Roadmap de Versões

### v0.1.1 - Hotfix e Preparação para Distribuição (1 semana)

**Objetivo**: Resolver problemas críticos e preparar para distribuição inicial

#### Tarefas Críticas
- [x] **App funcionando**
  - App roda sem erros ✅
  - TypeScript compila 100% ✅
  - Testes passando ✅

- [x] **Documentação de instalação**
  - Guia completo para instalação em macOS sem assinatura ✅
  - Script de instalação automática ✅
  - Troubleshooting comum ✅

- [ ] **Error Handling robusto**
  - Implementar ErrorHandler centralizado em todos os catch blocks
  - Substituir `catch { // ignore }` por tratamento adequado
  - Mensagens de erro amigáveis (sem stack traces para usuário)
  - Integração com Sentry (opcional)

- [ ] **Sistema de logs exportáveis**
  - Logs salvos em arquivo em `userData`
  - Botão "Exportar Logs" na UI para suporte
  - Rotação de logs (evitar crescimento infinito)
  - Níveis de log configuráveis (debug, info, warn, error)

- [ ] **Build e distribuição**
  - Build de produção testado
  - Upload para R2 (Cloudflare)
  - Auto-update funcionando
  - Instalação testada em máquina limpa

**Critério de Aceite**: App distribuível, logs funcionam, error handling robusto

---

### v0.2.0 - UX Refinement (2-3 semanas)

**Objetivo**: Melhorar experiência do usuário e consistência visual

#### UI/UX
- [ ] **Consistência visual**
  - Unificar spacings e typography
  - Padronizar cores e estados (hover, focus, active)
  - Transições suaves em todas as interações

- [ ] **SelectionTray melhorado**
  - Layout mais limpo e organizado
  - Tooltips explicativos em todos os botões
  - Estados vazios com mensagens amigáveis
  - Atalhos de teclado visíveis na UI

- [ ] **Viewer refinado**
  - Controles de zoom mais intuitivos
  - Player de vídeo com melhor UX
  - Estados de loading mais claros
  - Preview de qualidade antes do load completo

- [ ] **Acessibilidade**
  - Focus visível em todos os elementos interativos
  - Navegação completa por teclado
  - Labels ARIA apropriados
  - Contraste de cores adequado (WCAG AA)
  - Atalhos sempre visíveis e documentados

#### Features
- [ ] **Preferências/Configurações**
  - Pasta padrão de export
  - Comportamento de seleção (single vs multi)
  - Idioma (PT/EN)
  - Tema (dark/light)
  - Atalhos customizáveis

- [ ] **Smart Collections UI**
  - Interface para criar/editar smart collections
  - Sidebar com lista de collections
  - Aplicar collection como filtro ativo
  - Visual feedback de filtros ativos

**Critério de Aceite**: UX polida, acessível, com todas as configurações funcionando

---

### v0.3.0 - Robustez e Performance (2-3 semanas)

**Objetivo**: Otimizar performance e aumentar estabilidade

#### Performance
- [ ] **Otimizações de memória**
  - Memory profiling em bibliotecas grandes (10k+ assets)
  - Garbage collection otimizado
  - Limpar cache de thumbnails antigos
  - Lazy loading mais agressivo

- [ ] **Virtualização melhorada**
  - Scroll mais fluido em grids grandes
  - Preload inteligente de thumbnails
  - Unload de assets fora da viewport

- [ ] **Database otimizado**
  - Índices adicionais para queries lentas
  - Query profiling e otimização
  - Vacuum automático do SQLite

#### Robustez
- [ ] **Cancelamento de operações**
  - Cancelar indexação em progresso
  - Cancelar export/copy em progresso
  - AbortController em todas as operações assíncronas

- [ ] **Retry automático**
  - Retry em operações de rede
  - Retry em operações de IO que falham
  - Exponential backoff

- [ ] **Tratamento de erros por arquivo**
  - Continuar indexação mesmo se arquivo falhar
  - Relatório de erros ao final
  - Logs detalhados de falhas

- [ ] **Testes automatizados**
  - Expandir cobertura de testes
  - Testes de integração E2E
  - Testes de performance

**Critério de Aceite**: App estável com 10k+ assets, operações canceláveis, testes passando

---

### v1.0.0 - Release Estável (1 semana de QA)

**Objetivo**: Versão estável para produção com QA completo

#### QA Final
- [ ] **Testes em diferentes ambientes**
  - macOS Ventura (Intel)
  - macOS Sonoma (Apple Silicon)
  - macOS Sequoia
  - Com/sem discos externos
  - Com/sem volumes de rede

- [ ] **Testes de stress**
  - Biblioteca com 50k+ assets
  - Múltiplos volumes simultâneos
  - Operações em paralelo
  - Uso prolongado (memory leaks)

- [ ] **Testes de upgrade**
  - Migração de v0.1 para v1.0
  - Preservação de dados e configurações
  - Rollback se necessário

#### Documentação Final
- [ ] **Manual do usuário**
  - Guia completo de todas as features
  - Screenshots e vídeos tutoriais
  - FAQ e troubleshooting

- [ ] **Release Notes**
  - Changelog detalhado
  - Breaking changes (se houver)
  - Instruções de migração

- [ ] **Marketing**
  - Landing page
  - Vídeo de apresentação
  - Comparação com concorrentes (Photo Mechanic, Kyno)

**Critério de Aceite**: Sem bugs críticos, documentação completa, pronto para distribuição

---

## 📦 Estratégia de Distribuição para macOS (Sem Assinatura)

### Contexto
O macOS Gatekeeper bloqueia apps não assinados por padrão. Para distribuir sem pagar $99/ano pelo Apple Developer Program, precisamos fornecer instruções claras aos usuários.

### Opções de Distribuição

#### Opção 1: Instalação Manual com Whitelist (Recomendada para MVP)

**Vantagens**:
- ✅ Sem custo
- ✅ Funciona imediatamente
- ✅ Controle total sobre distribuição

**Desvantagens**:
- ❌ Requer passos manuais do usuário
- ❌ Pode parecer menos profissional
- ❌ Alguns usuários podem ter receio

**Processo de Instalação**:

1. **Download do .dmg ou .zip**
   ```bash
   # Usuário baixa de:
   https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.1.0-arm64.dmg
   ```

2. **Remover quarentena (antes de abrir)**
   ```bash
   # Terminal
   cd ~/Downloads
   xattr -cr Zona21-0.1.0-arm64.dmg
   ```

3. **Montar DMG e arrastar para Applications**
   - Duplo clique no .dmg
   - Arrastar Zona21.app para /Applications

4. **Primeira execução**
   ```bash
   # Se o Gatekeeper bloquear:
   # Opção A: Ctrl+Clique no app > "Abrir"

   # Opção B: Terminal
   xattr -cr /Applications/Zona21.app
   open /Applications/Zona21.app
   ```

5. **Auto-update funcionará normalmente após primeira execução**

**Implementação**:
- [ ] Criar script `install.sh` que automatiza os passos acima
- [ ] Criar página web com instruções visuais (screenshots)
- [ ] Vídeo tutorial de 1 minuto mostrando instalação
- [ ] README.md com troubleshooting

---

#### Opção 2: Homebrew Cask (Médio Prazo)

**Vantagens**:
- ✅ Instalação simples (`brew install --cask zona21`)
- ✅ Confiável para usuários técnicos
- ✅ Auto-update via Homebrew

**Desvantagens**:
- ❌ Requer manutenção do cask
- ❌ Apenas para usuários com Homebrew
- ❌ Review process do Homebrew

**Implementação**:
```ruby
# Formula: zona21.rb
cask "zona21" do
  version "0.1.0"
  sha256 "abc123..."

  url "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-#{version}-arm64.dmg"
  name "Zona21"
  desc "Plataforma de ingestão e catalogação de mídia"
  homepage "https://zona21.app"

  app "Zona21.app"
end
```

**Próximos passos**:
- [ ] Criar tap do Homebrew: `homebrew-zona21`
- [ ] Submeter para Homebrew Cask oficial (após tração)

---

#### Opção 3: Assinatura e Notarização (Longo Prazo)

**Quando considerar**:
- ✅ Após validação inicial do produto
- ✅ Quando houver receita recorrente
- ✅ Para distribuição mais ampla

**Custos**:
- $99/ano - Apple Developer Program
- Tempo: ~1-2 dias para setup inicial

**Benefícios**:
- ✅ Instalação sem warnings
- ✅ Credibilidade profissional
- ✅ Elegível para Mac App Store
- ✅ Auto-update sem fricção

**Setup**:
```yml
# electron-builder.yml
mac:
  identity: "Developer ID Application: Zona21 Team (TEAM_ID)"
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: resources/entitlements.mac.plist
  notarize:
    teamId: "TEAM_ID"
```

**Processo**:
1. Criar Apple Developer Account ($99/ano)
2. Gerar certificados (Developer ID Application)
3. Configurar notarização automática
4. Testar instalação em máquina limpa

---

### Plano de Distribuição Faseado

#### Fase 1: MVP (v0.1.1 - v0.2.0) - Próximos 1-2 meses
- **Método**: Instalação manual com whitelist
- **Público**: Early adopters, beta testers
- **Distribuição**: Link direto do R2 + instruções detalhadas
- **Feedback**: Google Forms ou email direto

#### Fase 2: Early Access (v0.3.0 - v1.0.0) - Meses 3-4
- **Método**: Homebrew Cask + Manual
- **Público**: Fotógrafos profissionais, videomakers
- **Distribuição**: Site próprio + Homebrew
- **Feedback**: In-app feedback form

#### Fase 3: Public Release (v1.0+) - Após 4-6 meses
- **Método**: Assinado e notarizado
- **Público**: Mercado geral
- **Distribuição**: Site + Homebrew + (opcional) Mac App Store
- **Monetização**: Freemium ou licença perpétua

---

## 🛠️ Implementação da Estratégia de Distribuição

### Tarefas Imediatas (v0.1.1)

#### 1. Criar Página de Download
```
zona21.app/
├── index.html           # Landing page
├── download.html        # Página de download
├── install-guide.html   # Guia de instalação detalhado
└── troubleshooting.html # FAQ e resolução de problemas
```

**Conteúdo da página de instalação**:
- Video tutorial (1-2 minutos)
- Screenshots passo-a-passo
- Script de instalação automática
- Link para troubleshooting

#### 2. Script de Instalação Automática
```bash
#!/bin/bash
# install-zona21.sh

echo "🚀 Instalando Zona21..."

# Download
curl -L -o ~/Downloads/Zona21.dmg \
  "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-latest-arm64.dmg"

# Remover quarentena
xattr -cr ~/Downloads/Zona21.dmg

# Montar DMG
hdiutil attach ~/Downloads/Zona21.dmg

# Copiar para Applications
cp -R /Volumes/Zona21/Zona21.app /Applications/

# Remover quarentena do app
xattr -cr /Applications/Zona21.app

# Desmontar
hdiutil detach /Volumes/Zona21

echo "✅ Zona21 instalado em /Applications"
echo "Você pode abrir o app agora!"
open /Applications/Zona21.app
```

#### 3. Documentação Completa

**Criar arquivo: INSTALLATION_GUIDE.md**
- Requisitos do sistema
- Download e instalação passo-a-passo
- Troubleshooting comum
- Como desinstalar
- Como reportar bugs

**Criar arquivo: DISTRIBUTION_README.md**
- Para distribuidores/revendedores
- Instruções de deploy
- Configuração de auto-update
- Assinatura futura

#### 4. Testes de Distribuição

**Checklist de QA**:
- [ ] Testar instalação em macOS limpo (Ventura)
- [ ] Testar instalação em macOS limpo (Sonoma)
- [ ] Testar instalação em macOS limpo (Sequoia)
- [ ] Testar auto-update de v0.1.0 → v0.1.1
- [ ] Testar com/sem Homebrew instalado
- [ ] Testar com SIP enabled/disabled
- [ ] Verificar permissões de filesystem
- [ ] Verificar que app funciona offline

---

## 📊 Métricas de Sucesso

### v0.1.1
- [ ] App instala sem erros em 3+ máquinas diferentes
- [ ] Documentação clara o suficiente para não-técnicos
- [ ] Logs funcionam e são úteis para debug

### v0.2.0
- [ ] NPS > 8 (Net Promoter Score)
- [ ] <5% de usuários com problemas de instalação
- [ ] 10+ beta testers ativos

### v0.3.0
- [ ] Performance estável com 50k+ assets
- [ ] <1% crash rate
- [ ] Auto-update funciona em 100% dos casos

### v1.0.0
- [ ] 100+ usuários ativos
- [ ] Receita suficiente para justificar Apple Developer ($99/ano)
- [ ] <0.5% bug report rate

---

## 🎯 Decisão: Assinatura Apple Developer

### Quando investir em assinatura ($99/ano)?

**Critérios para SIM**:
- ✅ 50+ usuários pagantes OU
- ✅ $500+ MRR (Monthly Recurring Revenue) OU
- ✅ Feedback forte indicando fricção na instalação OU
- ✅ Parceria com empresa/cliente grande

**Critérios para AINDA NÃO**:
- ❌ MVP em validação
- ❌ <20 usuários ativos
- ❌ Instalação manual não é blocker crítico
- ❌ Foco em features, não em distribuição

**Recomendação Atual**:
**AGUARDAR** até v0.2.0 ou v0.3.0. Usar instalação manual por enquanto.

---

## 📝 Tarefas Imediatas (Esta Sprint)

### 1. Fechar v0.1.0
- [x] Criar Zustand stores
- [x] Criar ErrorHandler e componentes
- [ ] **Resolver tela branca** (CRÍTICO)
- [ ] Migrar App.tsx para usar stores
- [ ] Testar app completo em dev

### 2. Preparar v0.1.1
- [ ] Criar INSTALLATION_GUIDE.md
- [ ] Criar script install-zona21.sh
- [ ] Gravar vídeo de instalação
- [ ] Build de produção com electron-builder
- [ ] Testar instalação em 3 máquinas

### 3. Documentar planos
- [x] Este documento (PLANO_VERSOES_E_DISTRIBUICAO.md)
- [ ] Atualizar TASKS.md com novas tarefas
- [ ] Criar checklist de release

---

## 🔄 Próximas Ações

1. **Imediato**: Resolver tela branca e finalizar v0.1.0
2. **Esta semana**: Completar v0.1.1 com instalação documentada
3. **Próxima semana**: Começar v0.2.0 (UX refinement)
4. **Mês que vem**: v0.3.0 (robustez) e testar com usuários reais
5. **2-3 meses**: v1.0.0 e decisão sobre assinatura Apple

---

## 📚 Recursos Úteis

### Distribuição macOS sem assinatura
- [Gatekeeper workarounds](https://disable-gatekeeper.github.io/)
- [Creating Homebrew Casks](https://docs.brew.sh/Cask-Cookbook)
- [Electron code signing guide](https://www.electron.build/code-signing)

### Auto-update
- [electron-updater docs](https://www.electron.build/auto-update)
- [Generic provider setup](https://www.electron.build/configuration/publish#genericserveroptions)

### Testing
- [Testing Electron apps](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Spectron (E2E testing)](https://www.electronjs.org/spectron)

---

**Última atualização**: 24 de Janeiro de 2026
**Próxima revisão**: Após lançamento de v0.1.1
