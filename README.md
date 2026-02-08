# Zona21

Plataforma de ingestão, catalogação e seleção de mídia para profissionais de foto e vídeo.

[![Version](https://img.shields.io/badge/version-0.5.1-blue.svg)](https://github.com/Almar-cyber/zona21/releases)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen.svg)](./docs/README.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20arm64-lightgrey.svg)](./docs/getting-started/installation.md)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](./COPYRIGHT.md)
[![i18n](https://img.shields.io/badge/i18n-pt--BR-green.svg)](./i18n/pt-BR/README.md)

## 📋 Versão Atual: v0.5.1

> **🎯 Foco até v1.0:** Builds apenas para **macOS arm64**. Desenvolvimento rápido e iterativo focado em funcionalidades essenciais. Windows e Linux serão suportados após v1.0.

### ✨ Novidades v0.5.1

#### 🎨 Design System & Tema
- **Design Tokens Completo**: Migração de 50+ componentes para sistema de tokens CSS (--color-*, --spacing-*)
- **Modo Claro**: Suporte completo a light mode com alternância de tema
- **Consistência Visual**: Interface unificada com tokens centralizados
- **CSS Otimizado**: Redução de 40% no tamanho dos arquivos de estilo

#### 🧹 Simplificação de UX
- **Compare Mode Removido**: Funcionalidade complexa removida para simplificar o fluxo
- **Modais Unificados**: UnifiedExportModal consolidando múltiplas opções de export
- **Interface Mais Limpa**: Menos abas, menos modais, mais foco no essencial

#### ⚡ Performance
- **Código Mais Limpo**: Remoção de hooks e componentes não utilizados
- **Manutenibilidade**: Arquitetura mais simples e fácil de manter

### 📝 Versões Anteriores

<details>
<summary>v0.5.0</summary>

#### 🧹 Foco em Funcionalidades Essenciais
- **Instagram removido temporariamente**: Funcionalidade de agendamento pausada para foco no core
- **Grid Masonry melhorado**: Layout sem buracos usando CSS Columns
- **Refresh automático**: View atualiza após Compare, QuickEdit e VideoTrim
- **Toasts informativos**: Feedback visual para ações do usuário
</details>

<details>
<summary>v0.4.9</summary>

#### 🎨 Site Beta Melhorado
- **Seções 3 e 4 refinadas**: Animações SVG mais sofisticadas e UI polida
- **Centralização perfeita**: Workflow com setas reduzidas e espaçamento otimizado
- **Performance otimizada**: Smooth scroll inspirado no Lenis com easing suave
- **SEO completo**: Open Graph, Twitter Cards, Schema.org
- **Acessibilidade WCAG**: ARIA labels, navegação por teclado, reduced-motion
- **Mobile first**: Responsividade completa com touch targets adequados
</details>

<details>
<summary>v0.4.8</summary>

#### 🏪 Windows Store Distribution
- **Híbrido Store + GitHub**: Distribuição simultânea via Windows Store e GitHub Releases
- **MSIX Packaging**: Pacotes MSIX para Windows Store com assinatura digital
- **NSIS Installers**: Instaladores tradicionais para GitHub Releases e auto-updates
- **CI/CD Melhorado**: Workflow automatizado para build e publicação em múltiplas plataformas

#### 🔄 Auto-update Otimizado
- **Repo Público**: Auto-update funcionando via repositório público `zona21-releases`
- **Cross-platform**: Updates automáticos para Windows (NSIS), Linux (AppImage) e macOS (Universal)
- **Token Seguro**: Publicação via Personal Access Token para maior segurança

#### 🤖 Zona I.A.
- **Smart Culling**: Analisa suas fotos e identifica sequências (burst), sugerindo a melhor foto de cada grupo baseado em qualidade e detecção de faces
- **Tags Automáticas**: IA detecta automaticamente objetos, pessoas, paisagens e mais de 290 categorias traduzidas para português
- **Filtro por Tags**: Filtre suas fotos por tags detectadas pela IA (praia, pessoas, animais, etc.)
- **Fotos Similares**: Encontre fotos visualmente similares a partir de qualquer imagem
- **Smart Rename**: Sugestões inteligentes de nomes baseados no conteúdo da foto
- **Detecção de Faces**: Identifica rostos nas fotos para melhor organização

#### 🎨 Melhorias de Interface
- **Onboarding com IA**: Tutorial atualizado incluindo funcionalidades de curadoria inteligente
- **Smart Culling na Toolbar**: Botão de acesso rápido visível na barra principal
- **Tags Traduzidas**: Todas as tags de IA exibidas em português brasileiro
- **Status de Processamento**: Feedback claro quando a IA está analisando fotos

#### 🐛 Correções
- Corrigido auto-tagging usando ViT em vez de CLIP zero-shot para maior precisão
- Melhorada performance do processamento de IA em background
</details>

---

### 📝 Versões Anteriores

<details>
<summary>v0.4.2</summary>

- **Layout Pinterest**: Grid estilo masonry com CSS Columns
- **Grid Responsivo**: Adapta automaticamente ao tamanho da janela
- **Melhorias de Performance**: Otimizações no carregamento de thumbnails
</details>

<details>
<summary>v0.4.0</summary>

#### 🏷️ Novo Sistema de Marcação
- **3 Coleções Virtuais Fixas**: Favoritos, Aprovados e Desprezados com contadores em tempo real
- **Atalhos de Teclado Intuitivos**:
  - `A` - Aprovar (verde)
  - `F` - Favoritar (amarelo)
  - `D` - Descartar (vermelho)
  - `Shift+A/F/D` - Marca e avança automaticamente
  - `Ctrl+Z` - Limpar marcação
- **Badges Visuais Sutis**: Indicadores nos thumbnails com estilo consistente
- **Persistência**: Marcações são salvas no banco de dados
</details>

<details>
<summary>v0.3.0</summary>

- **Onboarding Wizard**: Tutorial interativo para novos usuários
- **Atalhos de Teclado**: `?` para ajuda, `Cmd+A`, `P`, `Enter`, `Delete`, setas
- **Viewer Lateral**: Visualização detalhada no lado direito
- **Indexação Otimizada**: Batches menores + delays para reduzir uso de CPU/GPU
- **Controles de Indexação**: Pausar / Retomar / Cancelar
- **Auto-Update**: Atualizações automáticas via GitHub Releases
</details>

### Status
- ✅ App funcional para Apple Silicon (M1-M4) e Intel
- ✅ Auto-update configurado via GitHub Releases
- ✅ Sistema de marcação completo (Favoritos/Aprovados/Desprezados)
- ✅ Onboarding + Help System completo
- ✅ Zona I.A.: Smart Culling, Tags, Similares

## 🛠️ Desenvolvimento (até v1.0)

### Release Rápido (macOS arm64)

```bash
# Build e release em um comando
chmod +x scripts/release-mac.sh
./scripts/release-mac.sh 0.5.1
```

O script faz automaticamente:
- ✅ Atualiza versão no package.json
- ✅ Build macOS arm64 (rápido, ~3-5 min)
- ✅ Commit e tag
- ✅ Push para GitHub

### Build Manual (desenvolvimento)

```bash
# Dev mode
npm run electron:dev

# Build local arm64 (sua arquitetura)
npm run electron:build:mac:arm64
```

**Nota:** Foco total em macOS até v1.0. Windows e Linux serão adicionados depois do produto estar refinado.

## 🚀 Instalação

### macOS
1. Baixe o `.dmg` da [última release](https://github.com/Almar-cyber/zona21/releases/latest)
2. Abra o DMG e arraste para Applications
3. Na primeira execução, clique direito > Abrir

### Atualizações
O app verifica automaticamente por atualizações. Você será notificado quando houver uma nova versão disponível.

## ⌨️ Atalhos de Teclado

### Marcação
| Atalho | Ação |
|--------|------|
| `A` | Aprovar arquivo |
| `F` | Favoritar arquivo |
| `D` | Descartar arquivo |
| `Shift+A/F/D` | Marcar e avançar |
| `Ctrl+Z` | Limpar marcação |

### Navegação
| Atalho | Ação |
|--------|------|
| `?` | Mostrar atalhos |
| `Cmd+A` | Selecionar tudo |
| `Enter` | Abrir detalhes |
| `Delete` | Limpar seleção |
| `←` `→` `↑` `↓` | Navegar entre arquivos |
| `Esc` | Fechar viewer/modal |

## 📁 Documentação

```
docs/
├── v0.2/                    # Tasks e QA da versão 0.2.x/0.3.x
│   ├── QA_V02_COMPLETO.md   # QA principal
│   ├── CHECKLIST_TESTES.md  # Checklist de testes
│   └── IMPLEMENTACOES_FINAL.md
├── instalacao/              # Guias de instalação
├── troubleshoot/            # Solução de problemas
├── windows-store-submission.md # Windows Store submission guide
└── arquivados/              # Docs obsoletos
```

## 🏪 Distribuição

### Windows Store + GitHub Releases

**Windows Store (MSIX)**
- Pacote MSIX assinado para Windows Store
- Distribuição oficial via Microsoft Store
- Updates automáticos via Store

**GitHub Releases (NSIS)**
- Instaladores NSIS tradicionais
- Auto-update via repositório público `zona21-releases`
- Downloads diretos para sideloading

**Linux & macOS**
- Linux: AppImage com auto-update
- macOS: Universal binaries (arm64 + x64) com auto-update

### Download
- **GitHub Releases**: https://github.com/Almar-cyber/zona21-releases
- **Windows Store**: Em breve (submissão em andamento)

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em dev
npm run electron:dev

# Build para produção (Apple Silicon)
npm run electron:build:mac:arm64

# Build para produção (Intel)
npm run electron:build:mac:x64

# Publicar release
npm run electron:publish
```

## 📄 Licença

© 2026 Almar. Todos os direitos reservados.

Feito com ❤️ por Almar.
