# Guia de Testes - Zona21

## Visão Geral

Este projeto usa **Vitest** como framework de testes. A estrutura de testes está organizada para suportar testes do processo principal (Electron main) e do processo de renderização (React).

## Estrutura de Testes

```
zona21/
├── electron/
│   ├── main/
│   │   ├── *.test.ts          # Testes do processo principal
│   │   └── ...
│   └── test/
│       ├── mocks/
│       │   └── electron.ts    # Mocks das APIs do Electron
│       └── helpers/
│           ├── test-db.ts     # Utilitários para testes de banco de dados
│           └── fixtures.ts    # Utilitários para criar arquivos de teste
├── src/
│   ├── shared/
│   │   └── *.test.ts          # Testes de código compartilhado
│   └── test/
│       └── setup.ts           # Configuração de testes do renderer
├── vitest.config.ts           # Configuração principal
├── vitest.config.main.ts      # Configuração para processo principal
└── vitest.config.renderer.ts # Configuração para processo de renderização
```

## Comandos de Teste

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch
```bash
npm run test:watch
```

### Executar apenas testes do processo principal
```bash
npm run test:main
```

### Executar apenas testes do processo de renderização
```bash
npm run test:renderer
```

### Executar testes com cobertura
```bash
npm run test:coverage
```

### Abrir UI interativa de testes
```bash
npm run test:ui
```

## Configurações de Teste

### Processo Principal (Electron Main)
- **Ambiente**: Node.js
- **Arquivos**: `electron/**/*.test.ts`
- **Configuração**: `vitest.config.main.ts`

### Processo de Renderização (React)
- **Ambiente**: jsdom
- **Arquivos**: `src/**/*.test.ts`, `src/**/*.test.tsx`
- **Configuração**: `vitest.config.renderer.ts`
- **Setup**: `src/test/setup.ts`

## Utilitários de Teste

### Mocks do Electron
Localizado em `electron/test/mocks/electron.ts`:
- `mockApp` - Mock do módulo app do Electron
- `mockBrowserWindow` - Mock de BrowserWindow
- `mockIpcMain` - Mock do IPC principal
- `mockDialog` - Mock de diálogos
- `mockShell` - Mock do shell

Exemplo de uso:
```typescript
import { mockApp, mockIpcMain } from '../test/mocks/electron';

vi.mock('electron', () => ({
  app: mockApp,
  ipcMain: mockIpcMain
}));
```

### Helpers de Banco de Dados
Localizado em `electron/test/helpers/test-db.ts`:

```typescript
import { createTestDb } from '../test/helpers/test-db';

describe('Database tests', () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    await testDb.create();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });
});
```

### Helpers de Sistema de Arquivos
Localizado em `electron/test/helpers/fixtures.ts`:

```typescript
import { createTestFileSystem } from '../test/helpers/fixtures';

describe('File system tests', () => {
  let testFs: ReturnType<typeof createTestFileSystem>;

  beforeEach(() => {
    testFs = createTestFileSystem();
    testFs.create();
  });

  afterEach(() => {
    testFs.cleanup();
  });

  it('should work with test files', () => {
    const file = testFs.createFile('test.txt', 'content');
    // file.path, file.name, file.size, file.content
  });
});
```

## Testes Existentes

### ✅ Implementados

#### Processo Principal
- **database.ts** - Testes de schema, operações CRUD, constraints
- **volume-manager.ts** - Testes de gerenciamento de volumes, ejeção, renomeação
- **indexer.ts** - Testes de varredura de diretórios, detecção de tipos de mídia
- **moveUtils.ts** - Testes de paths únicos, normalização de paths

#### Código Compartilhado
- **logger.ts** - Testes de níveis de log, formatação, edge cases
- **ipcInvoke.ts** - Testes de IPC assíncrono e tratamento de erros

### 📋 Próximos Passos Recomendados

1. **Testes de Integração**
   - Fluxo completo de indexação
   - Comunicação IPC entre main e renderer
   - Operações de banco de dados com volumes reais

2. **Testes de Componentes React**
   - Componentes de UI principais
   - Hooks personalizados
   - Gerenciamento de estado

3. **Testes E2E**
   - Considerar Playwright para testes Electron E2E
   - Fluxos de usuário completos

## Cobertura de Código

Relatórios de cobertura são gerados em:
- `coverage/` - Cobertura geral
- `coverage/main/` - Cobertura do processo principal
- `coverage/renderer/` - Cobertura do processo de renderização

Formatos disponíveis:
- `text` - Saída no terminal
- `html` - Relatório HTML interativo
- `json` - Dados JSON para integração CI
- `lcov` - Formato LCOV para ferramentas externas

## Melhores Práticas

1. **Organize testes por funcionalidade** - Use `describe` para agrupar testes relacionados
2. **Use nomes descritivos** - Testes devem explicar claramente o que está sendo testado
3. **Teste casos extremos** - Não teste apenas o caminho feliz
4. **Mock dependências externas** - Isole a unidade sendo testada
5. **Limpe após os testes** - Use `afterEach` para limpar recursos (arquivos, conexões DB)
6. **Evite testes frágeis** - Não dependa de ordem de execução
7. **Mantenha testes rápidos** - Use mocks quando possível

## Exemplo de Teste Completo

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MyService } from './my-service';
import { createTestDb } from '../test/helpers/test-db';

describe('MyService', () => {
  let service: MyService;
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    const db = await testDb.create();
    service = new MyService(db);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('Feature X', () => {
    it('should work correctly', () => {
      const result = service.doSomething();
      expect(result).toBe(expectedValue);
    });

    it('should handle errors gracefully', () => {
      expect(() => service.doSomethingBad()).toThrow();
    });
  });
});
```

## Troubleshooting

### Erro: "Cannot find module"
Verifique se todas as dependências estão instaladas:
```bash
npm install
```

### Testes falhando após mudanças no código
Execute com modo verbose para mais detalhes:
```bash
npm test -- --reporter=verbose
```

### Problemas de permissão em arquivos de teste
Certifique-se de limpar arquivos temporários no `afterEach`:
```typescript
afterEach(async () => {
  await testFs.cleanup();
});
```

## Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
