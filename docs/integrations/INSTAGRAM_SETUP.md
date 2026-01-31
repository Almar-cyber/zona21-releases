# 📸 Configuração do Instagram Scheduler

Este guia te ajuda a configurar o Instagram Scheduler no Zona21.

## 🎯 Passo a Passo Rápido

### 1. Criar App no Meta for Developers

1. Acesse: https://developers.facebook.com/
2. Clique em **"My Apps"** → **"Create App"**
3. Escolha tipo: **"Consumer"** ou **"Business"**
4. Nome do App: "Zona21" (ou qualquer nome)
5. Email de contato: seu email

### 2. Configurar Use Cases (Casos de Uso)

⚠️ **IMPORTANTE:** O Instagram API não aparece mais como "produto" separado. Agora é configurado via **Use Cases**.

1. No menu lateral do seu app, clique em **"Use cases"** (Casos de uso)
2. Selecione **"Authenticate and request data from users"**
3. Clique em **"Get started"** ou **"Configure"**
4. Isso ativará o **Facebook Login** (necessário para Instagram)

### 3. Configurar OAuth Redirect

1. Ainda em **"Use cases"** → **"Authenticate and request data from users"**
2. Configure o **Facebook Login**:
3. Em **"Valid OAuth Redirect URIs"**, adicione:
   ```
   zona21://oauth/callback
   ```
3. Em **"Deauthorize Callback URL"** e **"Data Deletion Request URL"**, pode colocar qualquer URL válida:
   ```
   https://zona21.app/deauth
   https://zona21.app/delete
   ```
4. Clique em **"Save Changes"**

### 4. Adicionar Permissões do Instagram

1. No menu lateral, vá em **"App Review"** → **"Permissions and Features"**
2. Procure e solicite estas permissões:
   - ✅ `instagram_business_basic` (clique em "Request")
   - ✅ `instagram_business_content_publish` (clique em "Request")
3. Para **desenvolvimento/teste**, você pode usar imediatamente
4. Para **produção**, precisará submeter para revisão da Meta

### 5. Obter Credenciais

1. No menu lateral, vá em **"Settings"** → **"Basic"**
2. Você verá:
   - **App ID** (ex: 123456789012345) ← Este é o `appId`
   - **App Secret** (clique em "Show" para revelar) ← Este é o `appSecret`
3. **COPIE** esses dois valores!

**Importante**: Certifique-se de que sua conta do Instagram é Business ou Creator. Contas pessoais não funcionam.

### 6. Configurar no Zona21

#### Opção A: Arquivo de Configuração (Recomendado) ⭐

1. **Copie o arquivo de exemplo:**
   ```bash
   cp instagram-config.example.json instagram-config.json
   ```

2. **Edite `instagram-config.json`** e cole suas credenciais:
   ```json
   {
     "instagram": {
       "appId": "123456789012345",
       "appSecret": "seu_app_secret_aqui",
       "redirectUri": "zona21://oauth/callback"
     }
   }
   ```

3. **IMPORTANTE:** O arquivo `instagram-config.json` já está no `.gitignore`. **NUNCA** commite ele no git!

#### Opção B: Variáveis de Ambiente

Se preferir, pode usar variáveis de ambiente:

```bash
export INSTAGRAM_APP_ID="123456789012345"
export INSTAGRAM_APP_SECRET="seu_app_secret_aqui"
export INSTAGRAM_REDIRECT_URI="zona21://oauth/callback"
```

Ou criar um arquivo `.env`:

```env
INSTAGRAM_APP_ID=123456789012345
INSTAGRAM_APP_SECRET=seu_app_secret_aqui
INSTAGRAM_REDIRECT_URI=zona21://oauth/callback
```

### 7. Pronto! 🎉

Agora você pode:

1. Abrir o Zona21
2. Clicar no botão **"Instagram"** na SelectionTray
3. Clicar em **"Conectar Instagram"**
4. Autorizar o app no Instagram
5. Agendar posts!

## 📁 Onde o Zona21 Procura o Config?

O app procura nesta ordem (prioridade):

1. **Variáveis de ambiente** (`INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`)
2. **Arquivo na raiz do projeto** (desenvolvimento): `./instagram-config.json`
3. **Arquivo no userData** (produção): `~/Library/Application Support/Zona21/instagram-config.json`

## 🔒 Segurança

- ✅ O arquivo `instagram-config.json` está no `.gitignore`
- ✅ Tokens são armazenados criptografados no SQLite
- ✅ Logs não exibem tokens completos (masked)
- ⚠️ **NUNCA** compartilhe seu `appSecret` publicamente!

## ⚠️ Requisitos Importantes

### Tipo de Conta Instagram
O Instagram Platform API requer uma conta **Business** ou **Creator**:

1. Abra o app do Instagram no celular
2. Vá em **Configurações** → **Conta** → **Mudar tipo de conta**
3. Escolha **Conta profissional** → **Criador** ou **Empresa**
4. Complete o processo de configuração

**Sem uma conta Business/Creator, o OAuth irá falhar com erro de permissões.**

### Como Converter Conta Pessoal para Business/Creator

Se você receber erro sobre tipo de conta:

1. **No App Instagram** (celular):
   - Abra Perfil → Menu (☰) → Configurações
   - Toque em **Conta**
   - Role até **Mudar tipo de conta**
   - Escolha **Conta profissional**
   - Selecione **Criador** ou **Empresa**
   - Complete as etapas (categoria, informações de contato)

2. **Conectar ao Facebook**:
   - Após converter, o Instagram pedirá para conectar a uma Página
   - Se não tiver uma Página, pode criar uma nova
   - A conexão é necessária para o Instagram Platform API

3. **Testar a Conversão**:
   - Volte ao Zona21
   - Clique em **Conectar Instagram** novamente
   - A autenticação deve funcionar agora

## ❓ Problemas Comuns

### Erro: "Instagram não está configurado"

**Causa:** O arquivo `instagram-config.json` não existe ou está com valores placeholder.

**Solução:**
1. Verifique se o arquivo existe e está no local correto
2. Confirme que você substituiu `YOUR_INSTAGRAM_APP_ID` e `YOUR_INSTAGRAM_APP_SECRET` pelos valores reais
3. Reinicie o app

### Erro: "OAuth callback failed"

**Causa:** Redirect URI não está configurado corretamente no Meta for Developers.

**Solução:**
1. Vá em https://developers.facebook.com/ → Seu App → Instagram Basic Display → Settings
2. Confirme que `zona21://oauth/callback` está em **Valid OAuth Redirect URIs**
3. Clique em "Save Changes"
4. Tente novamente

### Erro: "Invalid client_id or client_secret"

**Causa:** Credenciais incorretas.

**Solução:**
1. Confirme que você copiou o **Instagram App ID** (não o Facebook App ID)
2. Confirme que você copiou o **Instagram App Secret** corretamente (clique em "Show")
3. Verifique se não há espaços extras no início/fim das strings no JSON

## 🚀 Testando

Para testar se está tudo OK:

1. Abra o Console do Electron (View → Toggle Developer Tools)
2. Procure por logs de `oauth-manager`
3. Se aparecer erro "Instagram não está configurado", o config não foi encontrado
4. Se aparecer "Starting Instagram OAuth flow", está funcionando!

## 📚 Documentação Adicional

- [Instagram Platform API](https://developers.facebook.com/docs/instagram-platform)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)

## 💡 Dicas

1. **Teste em ambiente de desenvolvimento primeiro**: Use o arquivo `instagram-config.json` na raiz do projeto
2. **Para produção**: Copie o arquivo para o userData do usuário (path exibido no erro)
3. **Guarde suas credenciais com segurança**: Use um gerenciador de senhas
4. **Crie um app separado para produção**: Não use o mesmo app para dev e prod

---

**Precisa de ajuda?** Abra uma issue no GitHub ou consulte a documentação completa do Instagram API.
