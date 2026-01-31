# 📚 Documentation Index - Zona21

Welcome to Zona21 documentation! Here you'll find everything you need about the project.

> **Current Version**: v0.4.9 | **Last Updated**: January 30, 2026

---

## 🚀 Quick Start

### For Users
- **[Installation Guide](./INSTALLATION.md)** - Complete installation guide for macOS
- **[Keyboard Shortcuts](./user-guide/KEYBOARD_SHORTCUTS.md)** - Complete keyboard shortcuts reference
- **[Troubleshooting](./troubleshooting/)** - Common issues and solutions

### For Developers
- **[Development Setup](./DEVELOPMENT.md)** - Development environment setup
- **[Performance Guide](./PERFORMANCE.md)** - Optimization and benchmarking
- **[Distribution](./DISTRIBUTION.md)** - Building and releasing

---

## 📖 Core Documentation

### 📋 Fundamentals
| Document | Description | Version |
|----------|-------------|---------|
| [README](../README.md) | Project overview, features and quick start | v0.4.9 |
| [CHANGELOG](../CHANGELOG.md) | Version history and changes | v0.4.9 |
| [ROADMAP](../ROADMAP.md) | Future planning and milestones | v0.5.0 |

### 🎨 Features
| Document | Description | Status |
|----------|-------------|--------|
| [Instagram Integration](./integrations/INSTAGRAM_SETUP.md) | Instagram Platform API setup | ✅ Complete |
| [Menu System](./developer/MENU_INTEGRATION_GUIDE.md) | Context-aware menu integration | ✅ Complete |
| [Batch Edit](./batch-edit.md) | Batch editing operations | ✅ Complete |
| [Quick Edit](./quick-edit.md) | Quick photo editing | ✅ Complete |
| [Video Trim](./video-trim.md) | Video trimming feature | ✅ Complete |
| [Smart Culling](./smart-culling-sidebar.md) | AI-powered photo selection | ✅ Complete |

### 🔧 Technical Documentation
| Document | Description | Audience |
|----------|-------------|----------|
| [Installation](./INSTALLATION.md) | Installation and configuration | Users/Devs |
| [Development](./DEVELOPMENT.md) | Development guide | Developers |
| [Performance](./PERFORMANCE.md) | Optimizations and benchmarks | Developers |
| [Distribution](./DISTRIBUTION.md) | Build and publishing | Devs/DevOps |
| [AI Architecture](./AI_ARCHITECTURE.md) | AI system architecture | Developers |
| [Security Guidelines](./SECURITY_GUIDELINES.md) | Security best practices | Developers |

### 📊 Reports & Analysis
| Document | Description | Version |
|----------|-------------|---------|
| [Performance Optimizations](./developer/PERFORMANCE_OPTIMIZATIONS.md) | v0.4 optimization report | v0.4.9 |
| [Performance Testing](./developer/PERFORMANCE_TESTING.md) | Testing procedures and metrics | v0.4.9 |
| [Build Results](./archive/deprecated/BUILD_RESULTS_V049.md) | Latest build report (archived) | v0.4.9 |
| [Design System QA](./archive/deprecated/DESIGN_SYSTEM_QA_REPORT.md) | Design consistency audit (archived) | v0.5.0 |
| [Implementation Summary](./archive/deprecated/FINAL_IMPLEMENTATION_REPORT.md) | Sprint 5 deliverables (archived) | v0.5.0 |

---

## 🎯 Guides by Topic

### 🚀 Getting Started
1. **Installation**: Follow [INSTALLATION.md](./INSTALLATION.md)
2. **First Import**: Learn basic workflows
3. **Organization**: Use collections and tags
4. **Shortcuts**: Master [keyboard shortcuts](./user-guide/KEYBOARD_SHORTCUTS.md)

### 🛠️ Development
1. **Setup**: Development environment ([DEVELOPMENT.md](./DEVELOPMENT.md))
2. **Architecture**: Understand the structure
3. **Contributing**: How to contribute (coming soon)
4. **Debugging**: Debugging tips

### 📈 Performance
1. **Metrics**: Current benchmarks
2. **Optimizations**: Implemented improvements
3. **Monitoring**: How to measure
4. **Testing**: Performance testing guide

### 🚀 Distribution
1. **Building**: How to compile
2. **Signing**: macOS certificates
3. **Publishing**: Upload and release
4. **Auto-update**: Update system

---

## 🔍 Quick Reference

### Main Commands
```bash
# Development
npm run electron:dev

# Build
npm run build

# Tests
npm test

# Lint
npm run lint

# Type check
npm run type-check
```

### Folder Structure
```
src/                    # Frontend React
├── components/         # UI Components
│   ├── tabs/          # Tab components (Viewer, Compare, BatchEdit, Instagram)
│   └── menus/         # Context menu components
├── contexts/          # React contexts (Tabs, Menu)
├── hooks/             # Custom hooks
├── services/          # Business logic services
├── shared/            # Shared code and types
└── App.tsx            # Main app component

electron/              # Backend Electron
├── main/              # Main process
│   ├── ipc/          # IPC handlers
│   └── services/     # Backend services
└── preload/           # Preload scripts

docs/                  # Documentation
├── troubleshoot/      # Troubleshooting guides
├── instalacao/        # Installation guides (Portuguese)
├── agents/            # Multi-agent coordination logs
└── arquivados/        # Archived documentation
```

### Key Configuration
- **Dev port**: 5174
- **Build output**: `./release/`
- **Database**: SQLite (in `~/Library/Application Support/Zona21/`)
- **Cache**: Same directory
- **Current version**: v0.4.9
- **Electron**: v32.2.7
- **Node**: v20.18.0

---

## 🆘 Help & Support

### Troubleshooting
- [Installation Issues](../i18n/pt-BR/docs/troubleshooting/installation-errors.md) - Common macOS errors (Portuguese)
- [Performance Issues](./developer/PERFORMANCE_TESTING.md#troubleshooting) - Slow app, memory issues
- [macOS Security](../i18n/pt-BR/docs/troubleshooting/erro-damaged.md) - "App is damaged" error (Portuguese)
- [Architecture Issues](../i18n/pt-BR/docs/troubleshooting/sharp-arm64.md) - ARM64 compilation (Portuguese)

### Common Issues
- **Port 5174 occupied**: Change port in `vite.config.ts`
- **Permission denied**: Grant Photos access in System Preferences
- **better-sqlite3 architecture mismatch**: Run `npm rebuild better-sqlite3`

### Contact
- **Issues**: [GitHub Issues](https://github.com/Almar-cyber/zona21/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Almar-cyber/zona21/discussions)
- **Website**: [zona21.com](https://zona21.com)

---

## 📝 Contributing

### How to Help
1. **Report bugs**: Open an issue on GitHub
2. **Suggest features**: Use GitHub discussions
3. **Contribute code**: Submit a pull request
4. **Improve docs**: Edit this documentation

### Documentation Style
- Use clear Markdown
- Include code examples
- Add update dates
- Maintain consistency
- Follow naming conventions (lowercase-with-hyphens.md)

---

## 📌 Important Links

### User Documentation
- [Installation Guide](./INSTALLATION.md)
- [Keyboard Shortcuts](./user-guide/KEYBOARD_SHORTCUTS.md)
- [Instagram Setup](./integrations/INSTAGRAM_SETUP.md)
- [Instagram Quick Setup](./integrations/INSTAGRAM_QUICK_SETUP.md)

### Developer Documentation
- [Development Setup](./DEVELOPMENT.md)
- [Performance Guide](./PERFORMANCE.md)
- [Distribution Guide](./DISTRIBUTION.md)
- [AI Architecture](./AI_ARCHITECTURE.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)

### Feature Documentation
- [Batch Edit](./batch-edit.md)
- [Quick Edit](./quick-edit.md)
- [Video Trim](./video-trim.md)
- [Smart Culling](./smart-culling-sidebar.md)
- [Growth Features](./growth-features.md)

### Project Management
- [Roadmap](../ROADMAP.md)
- [Changelog](../CHANGELOG.md)
- [Multi-Agent Coordination](./MULTI_AGENT_COORDINATION.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)

---

## 📂 Documentation Structure

This documentation is organized as follows:

- **`/docs/`** - Main documentation folder
  - **`troubleshoot/`** - Troubleshooting guides
  - **`instalacao/`** - Installation guides (Portuguese)
  - **`agents/`** - Multi-agent coordination logs
  - **`arquivados/`** - Archived/deprecated documentation
  - **`v0.2/`, `v0.3/`, `v0.4/`** - Version-specific documentation

- **Root-level docs** - Important documentation at project root
  - Feature guides (INSTAGRAM_SETUP.md, MENU_INTEGRATION_GUIDE.md, etc.)
  - Reports (PERFORMANCE_OPTIMIZATIONS.md, DESIGN_SYSTEM_QA_REPORT.md, etc.)
  - Project files (README.md, CHANGELOG.md, ROADMAP.md, etc.)

---

**Last Updated**: January 30, 2026
**Version**: v0.4.9
**Documentation Status**: ✅ Current

For more information, visit the [GitHub repository](https://github.com/Almar-cyber/zona21).
