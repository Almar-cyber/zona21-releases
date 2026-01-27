# Zona21

Plataforma de ingestão, catalogação e seleção de mídia para profissionais de foto e vídeo.

## 📋 Versão Atual: v0.3.0

### ✨ Novidades v0.3.0
- **Onboarding Wizard**: Tutorial interativo para novos usuários
- **Atalhos de Teclado**: `?` para ajuda, `Cmd+A`, `P`, `Enter`, `Delete`, setas
- **Viewer Lateral**: Visualização detalhada no lado direito
- **Indexação Otimizada**: Batches menores + delays para reduzir uso de CPU/GPU
- **Controles de Indexação**: Pausar ⏸️ / Retomar ▶️ / Cancelar ✕
- **Versão Automática**: Exibida automaticamente em todo o app
- **Auto-Update**: Atualizações automáticas via GitHub Releases

### 🚀 Otimizações de Performance (Última Atualização)
- **Carregamento Progressivo**: Carrega apenas 100 assets por vez (antes: 500), reduzindo uso de memória
- **Renderização Otimizada**: Memoização de computações pesadas na biblioteca de assets
- **Geração de Thumbnails**: 
  - Controle de concorrência (máx. 2 simultâneos) para evitar sobrecarga
  - Cache do Sharp desabilitado para prevenir memory bloat
  - Fallback inteligente para placeholders em caso de erro
- **Scroll Infinito Inteligente**: Carrega incrementos de 100 items conforme você rola, mantendo fluidez
- **Correção Crítica**: Resolvido erro que impedia o app de abrir (AppErrorBoundary)

### Status
- ✅ App funcional para Apple Silicon (M1-M4) e Intel
- ✅ Auto-update configurado via GitHub Releases
- ✅ Onboarding + Help System completo
- ✅ 10 princípios de Nielsen implementados

## 🚀 Instalação

### macOS
1. Baixe o `.dmg` da [última release](https://github.com/Almar-cyber/zona21/releases/latest)
2. Abra o DMG e arraste para Applications
3. Na primeira execução, clique direito > Abrir

### Atualizações
O app verifica automaticamente por atualizações. Você será notificado quando houver uma nova versão disponível.

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `?` | Mostrar atalhos |
| `Cmd+A` | Selecionar tudo |
| `P` | Marcar/Desmarcar favorito |
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

 2026 Almar. Todos os direitos reservados.

Feito com ❤️ por Almar