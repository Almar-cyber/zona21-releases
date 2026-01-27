# Zona21

Plataforma de ingestão, catalogação e seleção de mídia para profissionais de foto e vídeo.

## 📋 Versão Atual: v0.4.0

### ✨ Novidades v0.4.0

#### 🏷️ Novo Sistema de Marcação
- **3 Coleções Virtuais Fixas**: Favoritos, Aprovados e Desprezados com contadores em tempo real
- **Atalhos de Teclado Intuitivos**:
  - `A` - Aprovar (verde)
  - `F` - Favoritar (amarelo)
  - `D` - Descartar (vermelho)
  - `Shift+A/F/D` - Marca e avança automaticamente
  - `Ctrl+Z` - Limpar marcação
- **Badges Visuais Sutis**: Indicadores nos thumbnails com estilo consistente (fundo transparente colorido + borda)
- **Opacidade Reduzida**: Assets descartados aparecem com 50% de opacidade
- **Persistência**: Marcações são salvas no banco de dados e sobrevivem entre sessões

#### 🎨 Melhorias de Interface
- **Onboarding Atualizado**: Tutorial agora mostra os novos atalhos A/F/D
- **Tamanho Fixo nos Modais**: Preferências e Onboarding não mudam de tamanho ao navegar
- **Footer Fixo**: Botões sempre visíveis na parte inferior dos modais

#### 🐛 Correções
- Corrigido problema onde badges de marcação desapareciam ao navegar entre pastas
- Corrigido empty state nas coleções de marcação (Favoritos/Aprovados/Desprezados)
- Corrigida contagem incorreta nas coleções virtuais

---

### 📝 Versões Anteriores

<details>
<summary>v0.3.0</summary>

- **Onboarding Wizard**: Tutorial interativo para novos usuários
- **Atalhos de Teclado**: `?` para ajuda, `Cmd+A`, `P`, `Enter`, `Delete`, setas
- **Viewer Lateral**: Visualização detalhada no lado direito
- **Indexação Otimizada**: Batches menores + delays para reduzir uso de CPU/GPU
- **Controles de Indexação**: Pausar / Retomar / Cancelar
- **Auto-Update**: Atualizações automáticas via GitHub Releases
</details>

<details>
<summary>Otimizações de Performance</summary>

- **Carregamento Progressivo**: Carrega apenas 100 assets por vez
- **Renderização Otimizada**: Memoização de computações pesadas
- **Geração de Thumbnails**: Controle de concorrência (máx. 2 simultâneos)
- **Scroll Infinito Inteligente**: Carrega incrementos conforme você rola
</details>

### Status
- ✅ App funcional para Apple Silicon (M1-M4) e Intel
- ✅ Auto-update configurado via GitHub Releases
- ✅ Sistema de marcação completo (Favoritos/Aprovados/Desprezados)
- ✅ Onboarding + Help System completo

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

Feito com ❤️ por Almar
