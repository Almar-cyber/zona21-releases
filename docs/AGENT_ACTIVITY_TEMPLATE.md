# 📝 Template de Atividade do Agente

**INSTRUÇÕES:** Copie este template para documentar cada sessão de trabalho

---

## Informações da Sessão

- **Agente:** [Nome/ID do Agente]
- **Data/Hora Início:** [YYYY-MM-DD HH:MM]
- **Data/Hora Fim:** [YYYY-MM-DD HH:MM]
- **Objetivo da Sessão:** [Descrever objetivo principal]

---

## ✅ Checklist Pré-Trabalho

Antes de iniciar qualquer modificação, SEMPRE verificar:

- [ ] Consultei o [SUPERVISOR_LOG.md](SUPERVISOR_LOG.md) para verificar conflitos
- [ ] Verifiquei se outro agente está trabalhando na mesma área
- [ ] Registrei minha intenção no SUPERVISOR_LOG.md
- [ ] Li a documentação relevante para o trabalho
- [ ] Executei `git status` para verificar estado atual

---

## 📁 Áreas de Trabalho

### Arquivos que Pretendo Modificar
```
- caminho/para/arquivo1.ts (Razão: ...)
- caminho/para/arquivo2.tsx (Razão: ...)
- caminho/para/arquivo3.css (Razão: ...)
```

### Arquivos que Pretendo Criar
```
- caminho/para/novo-arquivo1.ts (Propósito: ...)
- caminho/para/novo-arquivo2.tsx (Propósito: ...)
```

### Arquivos que Pretendo Deletar
```
- caminho/para/arquivo-antigo.ts (Motivo: ...)
```

---

## 🎯 Plano de Implementação

### Etapa 1: [Nome da Etapa]
**Descrição:** [O que será feito]
**Arquivos Afetados:** [Lista de arquivos]
**Dependências:** [Outras etapas ou arquivos]
**Status:** [ ] Não iniciado / [ ] Em progresso / [ ] Concluído

### Etapa 2: [Nome da Etapa]
**Descrição:** [O que será feito]
**Arquivos Afetados:** [Lista de arquivos]
**Dependências:** [Outras etapas ou arquivos]
**Status:** [ ] Não iniciado / [ ] Em progresso / [ ] Concluído

### Etapa 3: [Nome da Etapa]
**Descrição:** [O que será feito]
**Arquivos Afetados:** [Lista de arquivos]
**Dependências:** [Outras etapas ou arquivos]
**Status:** [ ] Não iniciado / [ ] Em progresso / [ ] Concluído

---

## 💻 Mudanças Realizadas

### [Timestamp] - [Descrição da Mudança]

**Arquivo:** `caminho/para/arquivo.ts`

**Tipo de Mudança:** [ ] Feature [ ] Fix [ ] Refactor [ ] Docs [ ] Style [ ] Test

**Descrição Detalhada:**
```
Explicar o que foi mudado e por quê
```

**Código Anterior:**
```typescript
// código antes da mudança
```

**Código Novo:**
```typescript
// código depois da mudança
```

**Impacto:**
- [ ] Afeta outros componentes: [Listar quais]
- [ ] Requer atualização de testes
- [ ] Requer atualização de documentação
- [ ] Pode causar breaking changes
- [ ] Requer migração de dados

**Testes Realizados:**
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Testado manualmente
- [ ] Build executado com sucesso

---

## ⚠️ Possíveis Conflitos Identificados

### Conflito 1: [Descrição]
**Área Afetada:** [Arquivo/Módulo]
**Outro Agente Envolvido:** [Nome do agente]
**Severidade:** [ ] Baixa [ ] Média [ ] Alta [ ] Crítica
**Proposta de Resolução:** [Como resolver]
**Status:** [ ] Não resolvido [ ] Em discussão [ ] Resolvido

---

## 🐛 Bugs/Issues Encontrados

### Bug 1: [Título]
**Localização:** `arquivo.ts:linha`
**Descrição:** [Descrever o bug]
**Causa Raiz:** [Se identificada]
**Status:** [ ] Não corrigido [ ] Em correção [ ] Corrigido
**Solução:** [Descrever a solução implementada]

---

## 📊 Testes Executados

### Testes Unitários
```bash
npm run test
```
**Resultado:** [ ] ✅ Passou [ ] ❌ Falhou
**Output:**
```
[colar output aqui]
```

### Build
```bash
npm run build
```
**Resultado:** [ ] ✅ Passou [ ] ❌ Falhou
**Output:**
```
[colar output aqui]
```

### Testes Manuais
- [ ] Feature X testada e funcionando
- [ ] Interface responsiva verificada
- [ ] Performance verificada
- [ ] Compatibilidade testada

---

## 📚 Documentação Atualizada

- [ ] README.md atualizado (se necessário)
- [ ] CHANGELOG.md atualizado
- [ ] Documentação técnica atualizada
- [ ] Comentários no código adicionados
- [ ] JSDoc/TSDoc atualizado

**Arquivos de Documentação Modificados:**
- `docs/arquivo1.md` - [Descrição da mudança]
- `docs/arquivo2.md` - [Descrição da mudança]

---

## 🔄 Comunicação com Outros Agentes

### Mensagem para [Nome do Agente]
**Assunto:** [Título da mensagem]
**Conteúdo:**
```
Descrever mudanças que podem afetar o trabalho do outro agente
```

### Mensagem para Supervisor
**Assunto:** [Título da mensagem]
**Conteúdo:**
```
Reportar progresso, conflitos ou questões que precisam de decisão
```

---

## 📈 Métricas da Sessão

- **Arquivos Criados:** [número]
- **Arquivos Modificados:** [número]
- **Arquivos Deletados:** [número]
- **Linhas Adicionadas:** [número]
- **Linhas Removidas:** [número]
- **Commits Realizados:** [número]
- **Bugs Corrigidos:** [número]
- **Features Implementadas:** [número]

---

## 🎓 Lições Aprendidas

### O que funcionou bem:
- [Item 1]
- [Item 2]

### O que pode melhorar:
- [Item 1]
- [Item 2]

### Decisões técnicas importantes:
- [Decisão 1 e justificativa]
- [Decisão 2 e justificativa]

---

## ✅ Checklist Pós-Trabalho

Antes de finalizar a sessão:

- [ ] Todos os testes passaram
- [ ] Build executado com sucesso
- [ ] Commits realizados com mensagens descritivas
- [ ] SUPERVISOR_LOG.md atualizado
- [ ] Documentação relevante atualizada
- [ ] Outros agentes notificados sobre mudanças relevantes
- [ ] Conflitos reportados e/ou resolvidos
- [ ] Próximos passos documentados

---

## 🎯 Próximos Passos

### Para esta feature/tarefa:
1. [Próximo passo 1]
2. [Próximo passo 2]
3. [Próximo passo 3]

### Para outros agentes:
- **Agente [Nome]:** [O que este agente precisa fazer em seguida]
- **Agente [Nome]:** [O que este agente precisa fazer em seguida]

---

## 🔗 Links Úteis

- [SUPERVISOR_LOG.md](SUPERVISOR_LOG.md) - Log central de supervisão
- [Documentação relacionada 1](link)
- [Documentação relacionada 2](link)

---

**Sessão Finalizada em:** [YYYY-MM-DD HH:MM]
**Status Final:** [ ] Concluído [ ] Em progresso [ ] Bloqueado
**Próxima Sessão Planejada:** [Data/Hora]
