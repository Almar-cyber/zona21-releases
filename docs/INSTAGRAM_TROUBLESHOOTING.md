# Instagram OAuth - Solução de Problemas

## Erro ao fazer login no Instagram

### ❌ Sintoma
Ao clicar em "Conectar Instagram", você é levado ao navegador mas recebe um erro de "Não foi possível carregar a página".

### ✅ Solução

#### Passo 1: Configurar Redirect URI no Meta for Developers

1. Acesse https://developers.facebook.com/apps/

2. Selecione seu app (ID: 820805891006941)

3. No menu lateral, vá em **Instagram Platform API** > **Configurações**

4. Encontre o campo **Valid OAuth Redirect URIs**

5. Adicione exatamente:
   ```
   zona21://oauth/callback
   ```

6. Clique em **Save Changes**

#### Passo 2: Adicionar sua conta como Tester

1. No mesmo painel, vá em **Instagram Platform API** > **Roles**

2. Em **Instagram Testers**, clique em **Add Instagram Testers**

3. Digite seu username do Instagram

4. No app do Instagram:
   - Vá em **Configurações** > **Apps e sites**
   - Aceite o convite do seu app

#### Passo 3: Verificar tipo de conta

1. Abra o app Instagram

2. Vá em **Configurações** > **Conta**

3. Verifique se está como **Business** ou **Creator**

4. Se estiver como **Pessoal**, mude para **Business** ou **Creator**

#### Passo 4: Registrar protocolo zona21:// (opcional, mas recomendado)

**macOS:**
```bash
# O Electron já faz isso automaticamente, mas se não funcionar:
open -a "zona21.app" zona21://oauth/callback
```

**Windows:**
O Electron registra automaticamente ao iniciar o app.

**Linux:**
```bash
# Adicione ao ~/.local/share/applications/zona21.desktop
[Desktop Entry]
MimeType=x-scheme-handler/zona21;
```

### 🧪 Teste o Fluxo

Depois de configurar tudo acima:

1. **Feche completamente** o Zona21

2. **Reinicie** o app

3. Tente conectar novamente

4. Você deve ser levado ao navegador para autorizar

5. Após autorizar, você será redirecionado de volta ao Zona21

### 📝 Checklist de Verificação

- [ ] Redirect URI `zona21://oauth/callback` adicionado no Meta
- [ ] Mudanças salvas no painel do Meta
- [ ] Conta Instagram é Business ou Creator
- [ ] Conta adicionada como Instagram Tester
- [ ] Convite aceito no app do Instagram
- [ ] App Zona21 reiniciado

### 🔍 Logs para Debug

Se ainda não funcionar, verifique os logs:

**macOS:**
```bash
tail -f ~/Library/Logs/zona21/main.log | grep -i "oauth\|deep-link\|instagram"
```

**Windows:**
```powershell
Get-Content "$env:APPDATA\zona21\logs\main.log" -Tail 50 | Select-String "oauth|deep-link|instagram"
```

**Linux:**
```bash
tail -f ~/.config/zona21/logs/main.log | grep -i "oauth\|deep-link\|instagram"
```

### 🆘 Ainda não funciona?

#### Teste alternativo: OAuth com localhost

Se o deep link não funcionar, você pode temporariamente usar localhost:

1. No `instagram-config.json`, mude para:
   ```json
   {
     "instagram": {
       "appId": "820805891006941",
       "appSecret": "c6a43d17dcb7cc36af26e8252281bd62",
       "redirectUri": "http://localhost:3000/oauth/callback"
     }
   }
   ```

2. No Meta for Developers, adicione também:
   ```
   http://localhost:3000/oauth/callback
   ```

3. Reinicie o Zona21

**⚠️ Nota:** Esta é uma solução temporária. O deep link é a forma correta.

### 📞 Erros Comuns

#### "Invalid redirect_uri"
- O URI no Meta não está exatamente como `zona21://oauth/callback`
- Tem espaços ou caracteres extras
- Não clicou em "Save Changes"

#### "App not setup"
- Produto Instagram não adicionado ao app
- Instagram Platform API não configurado

#### "User not allowed"
- Conta não adicionada como tester
- Conta é pessoal (não Business/Creator)

#### "Protocol zona21 not registered"
- No macOS: `defaults write com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers -array-add '{LSHandlerURLScheme = "zona21"; LSHandlerRoleAll = "com.zona21.app"; }'`
- Reinicie o sistema

### 🎯 Fluxo OAuth Correto

1. **User clica "Conectar"** → Zona21 abre browser
2. **Browser abre** → Meta OAuth page
3. **User autoriza** → Meta redireciona para `zona21://oauth/callback?code=XXX`
4. **Sistema abre Zona21** → Deep link capturado
5. **Zona21 processa** → Troca code por token
6. **Sucesso** → User conectado!

Se qualquer passo falhar, o erro ocorre.
