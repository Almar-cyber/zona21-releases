# 📚 Índice de Documentação - Zona21

> ⚠️ **DEPRECATED**: This file is outdated. Please use [README.md](./README.md) instead.
>
> **Current Version**: v0.4.9 (this file references v0.2.0)
>
> **Updated Documentation**: [docs/README.md](./README.md)

---

Bem-vindo à documentação do Zona21! Aqui você encontrará tudo o que precisa sobre o projeto.

## 🚀 Guia Rápido

### Para Usuários
- [**README**](../README.md) - Visão geral e quick start
- [**Instalação**](./INSTALLATION.md) - Guia completo de instalação
- [**Troubleshooting**](../README.md#-troubleshooting) - Problemas comuns

### Para Desenvolvedores
- [**Desenvolvimento**](./DEVELOPMENT.md) - Setup e guia de dev
- [**Performance**](./PERFORMANCE.md) - Otimizações e métricas
- [**Distribuição**](./DISTRIBUTION.md) - Build e publicação

## 📋 Documentação Completa

### 📖 Fundamentos
| Documento | Descrição | Última Atualização |
|-----------|-----------|-------------------|
| [README](../README.md) | Visão geral, features e quick start | Jan 2024 |
| [CHANGELOG](../CHANGELOG.md) | Histórico de versões e mudanças | Jan 2024 |
| [ROADMAP](../ROADMAP.md) | Planejamento futuro e milestones | Jan 2024 |

### 🔧 Técnica
| Documento | Descrição | Público |
|-----------|-----------|---------|
| [INSTALLATION](./INSTALLATION.md) | Instalação e configuração | Usuários/Dev |
| [DEVELOPMENT](./DEVELOPMENT.md) | Guia de desenvolvimento | Devs |
| [PERFORMANCE](./PERFORMANCE.md) | Otimizações e benchmarks | Devs |
| [DISTRIBUTION](./DISTRIBUTION.md) | Build e publicação | Devs/DevOps |

### 📊 Relatórios
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [Performance Optimizations](./developer/PERFORMANCE_OPTIMIZATIONS.md) | v0.4 optimization report | ✅ Completo |
| [Performance Testing](./developer/PERFORMANCE_TESTING.md) | Testing procedures | ✅ Completo |
| [Build Results](./archive/deprecated/BUILD_RESULTS_V049.md) | Latest build report (archived) | ✅ Completo |

## 🎯 Guias por Tópico

### 🚀 Primeiros Passos
1. **Instalação**: Siga [INSTALLATION.md](./INSTALLATION.md)
2. **Configuração**: Preferências iniciais
3. **Importação**: Primeiros arquivos
4. **Organização**: Collections e tags

### 🛠️ Desenvolvimento
1. **Setup**: Ambiente de dev
2. **Arquitetura**: Entenda a estrutura
3. **Contribuição**: Como contribuir
4. **Debug**: Dicas de debug

### 📈 Performance
1. **Métricas**: Benchmarks atuais
2. **Otimizações**: Implementadas
3. **Monitoramento**: Como medir
4. **Melhorias**: Futuras

### 🚀 Distribuição
1. **Build**: Como compilar
2. **Assinatura**: Certificados macOS
3. **Publicação**: Upload e release
4. **Auto-update**: Sistema de updates

## 🔍 Referência Rápida

### Comandos Principais
```bash
# Desenvolvimento
npm run electron:dev

# Build
npm run build

# Testes
npm test

# Lint
npm run lint
```

### Estrutura de Pastas
```
src/           # Frontend React
├── components/ # UI Components
├── shared/     # Código compartilhado
└── App.tsx     # App principal

electron/       # Backend Electron
├── main/       # Processo principal
└── preload/    # Preload scripts

docs/           # Documentação
```

### Configurações Chave
- **Porta dev**: 5174
- **Build output**: `./release/`
- **Database**: SQLite
- **Cache**: `~/Library/Application Support/Zona21/`

## 🆘 Ajuda

### Problemas Comuns
- [Porta ocupada](../README.md#porta-5174-ocupada)
- [Permissão negada](../README.md#permissão-negada-em-fotos)
- [Architecture mismatch](../README.md#better-sqlite3-architecture-mismatch)

### Contato
- **Issues**: [GitHub Issues](https://github.com/Almar-cyber/zona21/issues)
- **Discord**: [Comunidade](https://discord.gg/zona21)
- **Email**: contato@zona21.com

## 📝 Contribuindo

### Como Ajudar
1. **Report bugs**: Abra uma issue
2. **Sugira features**: Use discussions
3. **Contribua código**: Faça um PR
4. **Melhore docs**: Edite esta documentação

### Estilo de Documentação
- Use Markdown claro
- Inclua exemplos de código
- Adicione datas de atualização
- Mantenha consistência

---

**Última atualização**: Janeiro 2024  
**Versão**: 0.2.0

Para mais informações, visite o [repositório GitHub](https://github.com/Almar-cyber/zona21).
