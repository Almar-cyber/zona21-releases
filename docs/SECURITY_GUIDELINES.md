# 🔒 Security Guidelines - Zona21

**Data:** 2026-01-29
**Responsável:** Backend/Electron Lead
**Status:** ✅ Implementado

---

## 📋 Visão Geral

Este documento descreve as diretrizes de segurança implementadas no Zona21 e boas práticas para desenvolvimento seguro.

---

## 🚨 Vulnerabilidades Corrigidas

### 1. Command Injection (CRÍTICO) ✅

**Problema:** Uso de `execSync` e `exec` com strings interpoladas permitia injeção de comandos.

**Solução:**
```typescript
// ❌ INSEGURO
execSync(`diskutil info "${mountPoint}"`)

// ✅ SEGURO
execFileSync('diskutil', ['info', mountPoint])
```

**Arquivos:** `volume-manager.ts`, `ipc/volumes.ts`

---

### 2. URL Validation (ALTO) ✅

**Problema:** `shell.openExternal` aceitava qualquer URL HTTPS sem validação de domínio.

**Solução:**
- Validação rigorosa com `new URL()`
- Whitelist de domínios confiáveis
- Dialog de confirmação para domínios não confiáveis

**Arquivos:** `index.ts`

---

### 3. Path Traversal (MÉDIO) ✅

**Problema:** Nomes de arquivo não sanitizados permitiam `../../../` em paths.

**Solução:**
```typescript
// Usar security-utils
import { sanitizeFileName, buildSafePath } from './security-utils';

const safeFileName = sanitizeFileName(userInput);
const safePath = buildSafePath(baseDir, safeFileName);
```

**Arquivos:** `ipc/export.ts`, `security-utils.ts`

---

### 4. Rate Limiting (MÉDIO) ✅

**Problema:** Nenhum rate limiting em operações sensíveis (OAuth, exports).

**Solução:**
```typescript
import { globalRateLimiter } from './security-utils';

if (!globalRateLimiter.canProceed('operation-key', 3, 60000)) {
  return { error: 'Too many attempts' };
}
```

**Arquivos:** `ipc/instagram-oauth.ts`, `security-utils.ts`

---

### 5. SQL Injection Prevention (MÉDIO) ✅

**Problema:** Arrays dinâmicos de IDs sem validação.

**Solução:**
```typescript
import { validateAssetIds } from './security-utils';

const validIds = validateAssetIds(assetIds, 1000);
// Agora é seguro usar em prepared statements
```

**Arquivos:** `ipc/assets.ts`, `security-utils.ts`

---

### 6. Sensitive Data in Logs (BAIXO) ✅

**Problema:** OAuth codes e tokens parcialmente expostos em logs.

**Solução:**
```typescript
// ❌ INSEGURO
logger.info('oauth', { code: code.slice(0, 10) + '...' })

// ✅ SEGURO
logger.info('oauth', { codeLength: code.length })
```

**Arquivos:** `oauth/oauth-manager.ts`

---

## 🛡️ Boas Práticas de Segurança

### 1. Validação de Input

**SEMPRE validar input do usuário:**
```typescript
// Validar tipo
if (typeof value !== 'string') throw new Error('Invalid type');

// Validar formato
if (!/^[a-zA-Z0-9-]+$/.test(value)) throw new Error('Invalid format');

// Validar tamanho
if (value.length > 255) throw new Error('Too long');
```

### 2. Sanitização de Paths

**SEMPRE sanitizar nomes de arquivo:**
```typescript
import { sanitizeFileName, buildSafePath } from './security-utils';

// Sanitizar nome
const safeName = sanitizeFileName(fileName);

// Construir path seguro
const safePath = buildSafePath(baseDir, safeName);

// Validar que está dentro do diretório permitido
if (!safePath.startsWith(baseDir)) {
  throw new Error('Path traversal attempt');
}
```

### 3. Command Execution

**NUNCA usar `exec` ou `execSync` com strings interpoladas:**
```typescript
// ❌ PERIGOSO
execSync(`command "${userInput}"`)

// ✅ SEGURO
execFileSync('command', [userInput])
```

### 4. URL Handling

**SEMPRE validar URLs antes de `shell.openExternal`:**
```typescript
// Parse e valide
const parsed = new URL(url);

// Verifique protocolo
if (parsed.protocol !== 'https:') throw new Error('Only HTTPS');

// Verifique domínio (whitelist ou dialog)
if (!trustedDomains.includes(parsed.hostname)) {
  // Mostrar dialog de confirmação
}
```

### 5. Rate Limiting

**Implemente rate limiting em operações sensíveis:**
```typescript
import { globalRateLimiter } from './security-utils';

// OAuth, login, etc
if (!globalRateLimiter.canProceed('key', maxAttempts, windowMs)) {
  return { error: 'Rate limit exceeded' };
}
```

### 6. SQL Queries

**SEMPRE usar prepared statements:**
```typescript
// ✅ SEGURO
db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// ❌ PERIGOSO
db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();
```

**Para arrays dinâmicos, validar primeiro:**
```typescript
import { validateAssetIds } from './security-utils';

const validIds = validateAssetIds(assetIds);
const placeholders = validIds.map(() => '?').join(',');
db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`).all(...validIds);
```

### 7. Logging Seguro

**NUNCA logar informações sensíveis:**
```typescript
// ❌ PERIGOSO
logger.info({ password, token, apiKey });

// ✅ SEGURO
logger.info({ userId, action: 'login' });

// Se precisar logar para debug, mascare
import { maskSensitiveData } from './security-utils';
logger.debug({ token: maskSensitiveData(token) });
```

### 8. Armazenamento de Credenciais

**NUNCA hardcode credentials:**
```typescript
// ❌ PERIGOSO
const API_KEY = 'sk-1234567890abcdef';

// ✅ SEGURO
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY not configured');
```

**Para tokens persistentes, criptografe:**
```typescript
// TODO: Implementar com electron-store ou keytar
// const store = new Store({ encryptionKey: 'secret' });
// store.set('token', encryptedToken);
```

---

## 🔍 Checklist de Code Review

Use esta checklist ao revisar código:

- [ ] Input do usuário é validado (tipo, formato, tamanho)?
- [ ] Paths de arquivo são sanitizados?
- [ ] Comandos shell usam `execFile` ao invés de `exec`?
- [ ] URLs são validadas antes de `shell.openExternal`?
- [ ] Operações sensíveis têm rate limiting?
- [ ] SQL queries usam prepared statements?
- [ ] Arrays dinâmicos são validados?
- [ ] Logs não expõem dados sensíveis?
- [ ] Credenciais vêm de env vars, não hardcoded?
- [ ] IPC handlers validam todos os parâmetros?

---

## 📚 Recursos

### Security Utils

Todas as funções de segurança estão centralizadas em:
```
electron/main/security-utils.ts
```

**Funções disponíveis:**
- `sanitizeFileName(fileName)` - Sanitiza nome de arquivo
- `validateDestinationPath(dest, base)` - Valida path
- `buildSafePath(baseDir, fileName)` - Constrói path seguro
- `validateAssetIds(ids, maxLength)` - Valida array de IDs
- `maskSensitiveData(data, visibleChars)` - Mascara dados sensíveis
- `RateLimiter` class - Rate limiting configurável
- `globalRateLimiter` - Instância global do rate limiter

### Electron Security

Configurações de segurança já implementadas:
```typescript
webPreferences: {
  contextIsolation: true,    // ✅ Correto
  nodeIntegration: false,    // ✅ Correto
  webSecurity: true          // ✅ Correto
}
```

---

## 🚀 Próximos Passos

### Melhorias Pendentes

1. **Criptografia de Tokens OAuth** (P1)
   - Implementar com `electron-store` ou `keytar`
   - Criptografar tokens antes de salvar no DB
   - Usar chave derivada do hardware/user

2. **Content Security Policy** (P2)
   - Adicionar CSP headers no renderer
   - Restringir scripts inline
   - Whitelist de recursos externos

3. **Audit Logging** (P2)
   - Logar operações críticas (OAuth, exports, deletes)
   - Incluir timestamps e user context
   - Exportar logs para análise

4. **Security Tests** (P2)
   - Testes automatizados de segurança no CI/CD
   - npm audit no pipeline
   - SAST (Static Application Security Testing)

5. **Code Signing** (P3)
   - Assinar todas as builds
   - Configurar notarização (macOS)
   - Configurar SmartScreen (Windows)

---

## 📞 Contato

Para reportar vulnerabilidades de segurança:
- **Email:** security@zona21.app
- **GitHub Issues:** Use label `security` (apenas para issues públicas não-críticas)
- **Vulnerabilidades críticas:** Contate diretamente via email privado

---

**Última atualização:** 2026-01-29
**Revisão:** Agente Backend (Claude Sonnet 4.5)
