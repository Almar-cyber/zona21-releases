# Zona21

Plataforma de ingestão, catalogação e seleção de mídia para profissionais de foto e vídeo.

## 📋 Versão Atual: v0.2.1

### Status
- ✅ App funcional para Apple Silicon (M1-M4)
- ✅ Segurança: 3 vulnerabilidades moderadas (baixo risco)
- ⚠️ Em desenvolvimento: Correções de UI desktop

## 🚀 Instalação

Veja [docs/instalacao/GUIA_TESTERS.md](docs/instalacao/GUIA_TESTERS.md)

## 📁 Documentação

```
docs/
├── v0.2/                    # Tasks e QA da versão 0.2.x
│   ├── QA_V02_COMPLETO.md   # QA principal
│   ├── CHECKLIST_TESTES.md  # Checklist de testes
│   └── IMPLEMENTACOES_FINAL.md
├── instalacao/              # Guias de instalação
├── troubleshoot/            # Solução de problemas
└── arquivados/              # Docs obsoletos
```

## �️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em dev
npm run electron:dev

# Build para produção
npm run electron:build:mac:arm64
```

## � Licença

© 2026 Almar. Todos os direitos reservados.

Feito com ❤️ por Almar