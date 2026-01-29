# ⚡ Guia Rápido para Agentes IA

**LEIA ISTO ANTES DE COMEÇAR A TRABALHAR**

---

## 🚀 Quick Start (2 minutos)

### 1. Identifique seu papel
- 🔵 **Frontend UI/UX** → Componentes React, estilos, animações
- 🟢 **Backend/Electron** → Electron, IPC, processos, auto-update
- 🟣 **Data/AI** → IA, processamento mídia, banco de dados
- 🟠 **DevOps** → CI/CD, builds, testes, deploy
- 🟡 **Docs/QA** → Documentação, testes, QA
- 🔴 **Site** → Landing page, marketing

### 2. Seu arquivo de log
```
docs/agents/[seu-agente]-log.md
```

### 3. Antes de QUALQUER modificação
```bash
# Execute SEMPRE:
git pull origin main
./scripts/detect-conflicts.sh
cat docs/SUPERVISOR_LOG.md | tail -50
```

---

## ✅ Checklist Obrigatório

### Antes de Modificar Código
- [ ] Git pull feito
- [ ] Script de conflitos executado
- [ ] SUPERVISOR_LOG.md consultado
- [ ] Nenhum outro agente trabalhando na mesma área
- [ ] Registrei intenção no meu log

### Durante o Trabalho
- [ ] Commits pequenos e frequentes
- [ ] Mensagens começam com `[AGENT_ID]`
- [ ] Log atualizado em tempo real
- [ ] Testes executados

### Após Completar
- [ ] Testes passaram
- [ ] Build funcionando
- [ ] Documentação atualizada
- [ ] SUPERVISOR_LOG.md atualizado
- [ ] Outros agentes notificados (se necessário)

---

## 🎯 O Que VOCÊ Pode Tocar

### 🔵 Frontend UI/UX
```
✅ src/components/**/*.tsx
✅ src/components/**/*.css
✅ src/styles/
✅ tailwind.config.js
❌ electron/
❌ src/services/database*
```

### 🟢 Backend/Electron
```
✅ electron/**/*.ts
✅ src/services/ipc*.ts
✅ electron-builder.yml
❌ src/components/
❌ docs/ (exceto técnica)
```

### 🟣 Data/AI
```
✅ src/services/ai*.ts
✅ src/services/media*.ts
✅ src/services/database*.ts
✅ src/lib/ai/
❌ src/components/ (UI)
❌ electron/ (main process core)
```

### 🟠 DevOps
```
✅ .github/workflows/
✅ .gitlab-ci.yml
✅ vite.config.ts
✅ vitest.config*.ts
✅ scripts/**/*.sh
❌ src/ (lógica de negócio)
❌ electron/ (IPC)
```

### 🟡 Docs/QA
```
✅ docs/**/*.md
✅ README.md, CHANGELOG.md
✅ e2e/**/*.spec.ts
✅ src/**/*.test.ts
❌ Código de produção direto
```

### 🔴 Site
```
✅ site/**/*
✅ site-improved/**/*
✅ docs/instalacao/
❌ Aplicação Electron
❌ Build da aplicação
```

---

## 🔴 NUNCA Faça Isto

❌ Modificar código sem pull recente
❌ Trabalhar em área de outro agente sem coordenar
❌ Push sem testar
❌ Commits gigantes
❌ Breaking changes sem notificar
❌ Ignorar conflitos detectados

---

## 🟢 SEMPRE Faça Isto

✅ Commits pequenos e frequentes
✅ Prefixo `[AGENT_ID]` em commits
✅ Atualizar log em tempo real
✅ Testar antes de push
✅ Comunicar mudanças que afetam outros
✅ Pull antes de começar

---

## 📝 Formato de Commit

```
[AGENT_ID] tipo: descrição curta

- Detalhe 1
- Detalhe 2

Impacto: [ALTO/MÉDIO/BAIXO]
Agentes Afetados: @AGENT_X @AGENT_Y

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Tipos:**
- `feat:` Nova feature
- `fix:` Correção de bug
- `refactor:` Refatoração
- `docs:` Documentação
- `test:` Testes
- `style:` Estilo/CSS
- `perf:` Performance
- `chore:` Manutenção

---

## 🚨 Níveis de Prioridade

### 🔴 CRÍTICA - Para TUDO
- Breaking changes em APIs internas
- Mudanças em estrutura de dados compartilhada
- Refatoração de código compartilhado

**Ação:** Notificar IMEDIATAMENTE no SUPERVISOR_LOG.md

### 🟠 ALTA - Notificar Antes
- Novos componentes compartilhados
- Mudanças em interfaces TypeScript
- Novas dependências npm

**Ação:** Documentar no SUPERVISOR_LOG.md antes de implementar

### 🟡 MÉDIA - Mencionar no Commit
- Mudanças em estilos globais
- Novos hooks/utilities
- Mudanças em configuração

### 🟢 BAIXA - Apenas Logar
- Componentes isolados
- Documentação
- Testes unitários específicos

---

## 🆘 Problemas Comuns

### "Outro agente está trabalhando no mesmo arquivo"
1. Verificar SUPERVISOR_LOG.md
2. Coordenar via log ou esperar
3. Se urgente, dividir arquivo

### "Conflito de merge"
1. `git pull --rebase`
2. Resolver localmente
3. Testar novamente
4. Push

### "Minha mudança quebrou algo"
1. `git revert HEAD`
2. Documentar no SUPERVISOR_LOG.md
3. Coordenar solução
4. Reimplementar com fixes

### "Não sei se posso modificar este arquivo"
1. Verificar matriz de responsabilidades acima
2. Se em dúvida, perguntar no SUPERVISOR_LOG.md
3. Documentar decisão

---

## 📊 Workflow Diário

```
1. git pull origin main
2. ./scripts/detect-conflicts.sh
3. cat docs/SUPERVISOR_LOG.md | tail -50
4. Registrar início no seu log
   ↓
5. Trabalhar na sua área
6. Commits frequentes
7. Atualizar log em tempo real
   ↓
8. npm run test (se relevante)
9. npm run build (se relevante)
10. git push origin main
11. Atualizar SUPERVISOR_LOG.md
12. Notificar outros agentes (se necessário)
```

---

## 🔗 Links Importantes

- [SUPERVISOR_LOG.md](SUPERVISOR_LOG.md) - **CONSULTE SEMPRE**
- [MULTI_AGENT_COORDINATION.md](MULTI_AGENT_COORDINATION.md) - Sistema completo
- [AGENT_ACTIVITY_TEMPLATE.md](AGENT_ACTIVITY_TEMPLATE.md) - Template detalhado
- [docs/agents/](agents/) - Logs dos agentes

---

## 🎯 Filosofia do Sistema

**"Comunicação é chave"**
- 🤝 Comunique ANTES de fazer mudanças grandes
- 📝 Documente EM TEMPO REAL
- 🔍 Verifique SEMPRE antes de modificar
- 🚀 Commits PEQUENOS e FREQUENTES
- ✅ Teste ANTES de push

---

## 💡 Dica Final

**QUANDO EM DÚVIDA:**
1. Pare
2. Consulte SUPERVISOR_LOG.md
3. Pergunte no seu log
4. Espere confirmação do supervisor
5. Prossiga com segurança

---

**Criado por:** Claude Sonnet 4.5 (Supervisor)
**Data:** 2026-01-29
**Versão:** 1.0

🚀 **Agora você está pronto para trabalhar em paralelo com eficiência!**
