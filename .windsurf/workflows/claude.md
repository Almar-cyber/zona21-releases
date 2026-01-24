
---
description: Instalar e testar Claude (Anthropic SDK)
---

# Instalar e testar Claude (Anthropic SDK)

## 1) Instalar SDK

Na raiz do projeto:

```bash
npm install @anthropic-ai/sdk
```

## 2) Configurar a chave da Anthropic (sem commitar)

Defina a variável de ambiente `ANTHROPIC_API_KEY`.

### Opção A: somente nesta sessão do terminal

```bash
export ANTHROPIC_API_KEY="SUA_CHAVE_AQUI"
```

### Opção B: persistir no seu shell (recomendado)

Adicione no seu `~/.zshrc`:

```bash
export ANTHROPIC_API_KEY="SUA_CHAVE_AQUI"
```

Depois:

```bash
source ~/.zshrc
```

## 3) Exemplo mínimo (Node.js)

Crie um arquivo (ex: `scripts/claude-smoke.mjs`) com o código abaixo e execute.

```js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'Olá, Claude!' }],
});

console.log(message.content);
```

Rodar:

```bash
node scripts/claude-smoke.mjs
```

## 4) Opção B: configurar Claude como modelo no Windsurf

Se o Windsurf suportar modelos customizados:

1. Abrir as configurações do Windsurf
2. Procurar por "AI Models" / "LLM Settings"
3. Adicionar sua API key da Anthropic
4. Selecionar Claude como modelo preferido

## 5) Boas práticas de uso no projeto

- **Planejamento arquitetural**: peça para revisar/sugerir arquitetura e trade-offs
- **Code review**: cole trechos e peça melhorias (performance, segurança, legibilidade)
- **Debugging**: compartilhe logs/erros e contexto do fluxo
- **Documentação**: peça para gerar/atualizar docs a partir do código
- **Testes**: peça casos de teste e estratégia de cobertura

### Exemplo de prompt efetivo

```txt
Estou desenvolvendo uma plataforma [descrição breve].
Preciso implementar [funcionalidade específica].
Aqui está meu código atual: [código]
Stack: [stack]
Problema: [descreva o desafio]
```

## Segurança

- Nunca commite `ANTHROPIC_API_KEY` no Git.
- Prefira variáveis de ambiente ou um gerenciador de segredos.

