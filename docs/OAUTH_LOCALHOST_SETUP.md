# OAuth com Localhost - Guia Rápido

## ✅ Alterações Realizadas

O sistema foi atualizado para usar `http://localhost:3000/oauth/callback` em vez do custom scheme `zona21://`.

### O que mudou:

1. **instagram-config.json** → Redirect URI agora é `http://localhost:3000/oauth/callback`
2. **oauth-manager.ts** → Agora inicia um servidor HTTP temporário na porta 3000
3. **Meta for Developers** → Precisa adicionar a URL localhost

## 🔧 Configuração no Meta for Developers

### Passo 1: Adicionar Localhost como Redirect URI

1. Acesse: https://developers.facebook.com/apps/820805891006941/

2. Vá em **Facebook Login** → **Settings** (ou **Configurações**)

3. Na seção **Valid OAuth Redirect URIs**, adicione:
   ```
   http://localhost:3000/oauth/callback
   ```

4. **IMPORTANTE**: Clique em **Save Changes** no final da página

5. Aguarde alguns segundos para as mudanças serem aplicadas

### Passo 2: Verificar

No validador, teste se funciona:
- Digite: `http://localhost:3000/oauth/callback`
- Clique em **Verificar URI**
- Deve mostrar ✅ URI válido

## 🚀 Como Funciona Agora

### Fluxo OAuth Atualizado:

```
1. Usuário clica "Conectar Instagram" no Zona21
   ↓
2. Zona21 inicia servidor HTTP em localhost:3000
   ↓
3. Abre navegador com URL do Instagram OAuth
   ↓
4. Usuário autoriza no Instagram
   ↓
5. Instagram redireciona para http://localhost:3000/oauth/callback?code=XXX
   ↓
6. Servidor captura o code
   ↓
7. Zona21 troca code por token
   ↓
8. Mostra página de sucesso no navegador
   ↓
9. Servidor fecha automaticamente após 5 segundos
   ↓
10. ✅ Usuário volta ao Zona21 e está conectado!
```

## 🧪 Testando

1. **Salve as alterações** no Meta for Developers

2. **Feche** o Zona21 completamente

3. **Reinicie** o app

4. Clique em **"Conectar Instagram"**

5. Você deve ver:
   - Navegador abre com login Instagram
   - Autoriza o app
   - Navegador mostra "✅ Conectado com Sucesso!"
   - Volta ao Zona21 automaticamente

## 📋 Checklist

- [ ] `http://localhost:3000/oauth/callback` adicionado no Meta
- [ ] Alterações salvas (botão "Save Changes")
- [ ] Conta Instagram adicionada como Tester
- [ ] Convite aceito no app Instagram
- [ ] Conta é Business ou Creator
- [ ] Zona21 reiniciado

## 🔍 Logs para Debug

Se algo não funcionar, verifique os logs:

```bash
# macOS
tail -f ~/Library/Logs/zona21/main.log | grep -i oauth

# Procure por:
# "OAuth callback server started on http://localhost:3000"
# "Received OAuth callback"
# "OAuth token obtained successfully"
```

## ⚠️ Erros Comuns

### Porta 3000 já está em uso

Se você tiver outro app usando a porta 3000:

```bash
# Verificar o que está usando a porta
lsof -i :3000

# Parar o processo (se seguro)
kill -9 <PID>

# OU mudar a porta no código
```

### Navegador não redireciona

- Verifique se salvou as alterações no Meta
- Aguarde 30 segundos e tente novamente
- Limpe o cache do navegador

### "Connection refused"

- O servidor não iniciou corretamente
- Verifique os logs do Zona21
- Tente reiniciar o app

## 🎯 Vantagens do Localhost

✅ **Aceito pelo Meta** - URLs HTTP são permitidas
✅ **Fácil de testar** - Funciona em qualquer plataforma
✅ **Sem configuração extra** - Não precisa registrar protocolos
✅ **Feedback visual** - Mostra página de sucesso/erro

## 📝 Notas

- O servidor só fica ativo durante o OAuth (30 segundos)
- Fecha automaticamente após capturar o callback
- Porta 3000 é liberada logo após a autenticação
- Funciona em macOS, Windows e Linux

## 🔄 Próximo Passo

Após configurar tudo, teste o fluxo completo:

1. Conectar Instagram ✓
2. Agendar um post ✓
3. Ver no calendário ✓
4. Publicar automaticamente ✓

Tudo pronto! 🚀
