# Zona21

Plataforma de ingestão, catalogação e seleção de mídia para profissionais de foto e vídeo.

## 📋 Versão Atual: v0.4.4

### ✨ Novidades v0.4.4

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
└── arquivados/              # Docs obsoletos
```

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
