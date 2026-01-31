# 🧪 Testes da Migração: Instagram Platform API

## ✅ Status da Migração

**Commit:** `bb87fa8` - feat: migrate from Instagram Basic Display to Platform API

**Arquivos Modificados:**
- ✅ [electron/main/oauth/oauth-manager.ts](electron/main/oauth/oauth-manager.ts) - OAuth scopes e validações
- ✅ [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md) - Documentação atualizada
- ✅ [instagram-config.example.json](instagram-config.example.json) - Template atualizado
- ✅ [electron/main/config-loader.ts](electron/main/config-loader.ts) - Comentários atualizados

---

## 📋 Pré-requisitos para Testes

### 1. Configurar Credenciais do Instagram

Se ainda não configurou, siga o [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md):

```bash
# Copiar arquivo de exemplo
cp instagram-config.example.json instagram-config.json

# Editar com suas credenciais
# Obtenha em: https://developers.facebook.com/ > Seu App > Instagram API
```

### 2. Conta Instagram Business ou Creator

⚠️ **IMPORTANTE:** A migração requer conta Business ou Creator:

**Verificar tipo de conta:**
1. Abra o Instagram no celular
2. Vá em Perfil → Menu (☰) → Configurações → Conta
3. Se disser "Conta profissional" ou "Creator", está correto
4. Se disser "Conta pessoal", precisa converter (veja instruções abaixo)

**Converter conta Personal → Business/Creator:**
1. Configurações → Conta → Mudar tipo de conta
2. Escolha "Conta profissional" → "Criador" ou "Empresa"
3. Complete as etapas (categoria, informações de contato)
4. Conecte a uma Página do Facebook (crie uma se necessário)

---

## 🧪 Roteiro de Testes

### ✅ Teste 1: OAuth com Conta Business/Creator (CRÍTICO)

**Objetivo:** Verificar que o novo fluxo OAuth funciona com conta Business/Creator.

**Passos:**

```bash
# 1. Deletar token existente (se houver)
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db <<EOF
DELETE FROM oauth_tokens WHERE provider='instagram';
SELECT changes() as 'Tokens deletados';
.quit
EOF
```

```bash
# 2. Iniciar o app
npm run dev
```

3. Abrir a aba **Instagram** no Zona21
4. Clicar no botão **"Conectar Instagram"**
5. Uma janela do navegador deve abrir

**Verificações:**

**Na URL do navegador, verificar:**
```
https://api.instagram.com/oauth/authorize?
  client_id=...
  &scope=instagram_business_basic,instagram_business_content_publish  ← VERIFICAR
  &response_type=code
```

**✅ SUCESSO esperado:**
- Tela de autorização do Instagram aparece
- Após autorizar, volta para o Zona21
- Mensagem de sucesso é exibida
- Foto de perfil e nome aparecem na UI

**Verificar token salvo:**
```bash
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db <<EOF
SELECT
  username,
  scopes,
  datetime(expires_at/1000, 'unixepoch', 'localtime') as expires_at
FROM oauth_tokens
WHERE provider='instagram';
.quit
EOF
```

**Resultado esperado:**
```
username | scopes | expires_at
---------|--------|------------
seu_user | instagram_business_basic,instagram_business_content_publish | 2026-03-31 ...
```

---

### ⛔ Teste 2: Rejeição de Conta Personal (CRÍTICO)

**Objetivo:** Verificar que contas Personal são bloqueadas com mensagem clara.

**Pré-requisito:** Conta Instagram Personal (não Business/Creator)

**Passos:**

1. Deletar token (mesmo comando do Teste 1)
2. Iniciar o app: `npm run dev`
3. Clicar em **"Conectar Instagram"**
4. Autorizar com conta Personal no navegador

**✅ SUCESSO esperado:**

**Mensagem de erro exibida:**
```
Conta pessoal detectada. O Instagram Platform API requer uma conta Business ou Creator.
Vá em Configurações > Conta > Mudar tipo de conta no app do Instagram.
```

**Logs do Electron DevTools (Console):**
```
[oauth-manager] Personal account detected { accountType: 'PERSONAL' }
[oauth-manager] Failed to handle OAuth callback
```

**❌ FALHA se:**
- OAuth completa sem erro
- Erro genérico sem mencionar tipo de conta
- App trava

---

### 📱 Teste 3: Publicação de Post (FUNCIONAL)

**Objetivo:** Verificar que publicação continua funcionando com novos scopes.

**Pré-requisito:** OAuth completo (Teste 1 passou)

**Passos:**

1. Na aba Instagram, selecionar uma imagem do Zona21
2. Clicar em **"Agendar Post"** ou usar o botão do Instagram
3. Preencher:
   - **Caption:** "Teste de migração Instagram Platform API 🎉"
   - **Hashtags:** #test #zona21
   - **Aspect ratio:** 1:1 (Square)
   - **Data/hora:** Agora (publicação imediata)
4. Clicar em **"Agendar"**

**✅ SUCESSO esperado:**

**UI mostra:**
```
✓ Post agendado com sucesso!
Status: Pending → Publishing → Published
```

**Logs do Electron DevTools:**
```
[instagram-publisher] Creating media container...
[instagram-publisher] Container created: IG_CONTAINER_ID
[instagram-publisher] Waiting for container to finish...
[instagram-publisher] Container status: FINISHED
[instagram-publisher] Publishing container...
[instagram-publisher] Post published successfully!
[instagram-publisher] Permalink: https://www.instagram.com/p/...
```

**Verificar no Instagram:**
- Abrir o app do Instagram
- Verificar que o post aparece no feed
- Caption e hashtags corretas

**❌ FALHA se:**
- Erro de permissões (OAuthException)
- Erro "invalid_scope"
- Post fica travado em "Publishing"

---

### 🔄 Teste 4: Token Refresh (OPCIONAL)

**Objetivo:** Verificar que refresh de token continua funcionando.

**Passos:**

```bash
# 1. Forçar token próximo da expiração (59 dias)
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db <<EOF
UPDATE oauth_tokens
SET expires_at = (strftime('%s', 'now') * 1000) + (24 * 3600 * 1000)
WHERE provider='instagram';
SELECT 'Token expira em:', datetime(expires_at/1000, 'unixepoch', 'localtime')
FROM oauth_tokens WHERE provider='instagram';
.quit
EOF
```

2. Aguardar 24h (ou simular mudando data do sistema)
3. Abrir Zona21
4. Tentar agendar post

**✅ SUCESSO esperado:**
- Token é automaticamente refreshed
- Publicação funciona normalmente
- Novo expires_at é ~60 dias no futuro

---

### ♻️ Teste 5: Compatibilidade com Token Antigo (REGRESSÃO)

**Objetivo:** Verificar que tokens com scopes antigos ainda funcionam.

**Pré-requisito:** Token existente com scopes antigos (antes da migração)

**Passos:**

```bash
# 1. Simular token com scopes antigos
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db <<EOF
UPDATE oauth_tokens
SET scopes = 'instagram_basic,instagram_content_publish'
WHERE provider='instagram';
SELECT 'Scopes atuais:', scopes FROM oauth_tokens WHERE provider='instagram';
.quit
EOF
```

2. Iniciar o app: `npm run dev`
3. Verificar que app reconhece autenticação
4. Tentar agendar um post

**✅ SUCESSO esperado:**
- App reconhece usuário autenticado
- Publicação funciona (endpoints de publishing não mudaram)
- Nenhum erro exibido

**⚠️ NOTA:** Token antigo funcionará até expiração natural (60 dias). Depois precisará re-autenticar com novos scopes.

---

## 🐛 Problemas Comuns e Soluções

### Erro: "Invalid client_id or client_secret"

**Causa:** Credenciais incorretas no `instagram-config.json`

**Solução:**
1. Verificar em https://developers.facebook.com/
2. Confirmar que copiou **Instagram App ID** (não Facebook App ID)
3. Confirmar que copiou **Instagram App Secret** correto
4. Verificar se não há espaços extras no JSON

---

### Erro: "Redirect URI mismatch"

**Causa:** Redirect URI não configurado no Meta Dashboard

**Solução:**
1. Ir em https://developers.facebook.com/ → Seu App → Instagram API → Settings
2. Em **Valid OAuth Redirect URIs**, adicionar:
   ```
   zona21://oauth/callback
   ```
3. Clicar em "Save Changes"
4. Aguardar 2-3 minutos para propagar
5. Tentar novamente

---

### Erro: "Permissions error" ou "OAuthException"

**Causa:** Conta não é Business/Creator ou não está conectada ao Facebook

**Solução:**
1. Verificar tipo de conta no Instagram (Configurações → Conta)
2. Converter para Business/Creator se necessário
3. Conectar a uma Página do Facebook
4. Aguardar 5-10 minutos
5. Tentar novamente

---

### Erro: "App not in Live Mode"

**Causa:** App do Meta está em modo Development

**Solução:**
1. No Meta Dashboard → Seu App → App Settings
2. Verificar se app está em "Live Mode"
3. Se estiver em Development, testar apenas com contas de teste
4. Para produção, submeter app para revisão da Meta

---

## 📊 Checklist Final

Após executar todos os testes, verificar:

- [ ] ✅ Teste 1 passou: OAuth com Business/Creator funciona
- [ ] ✅ Teste 2 passou: Personal account é rejeitada com mensagem clara
- [ ] ✅ Teste 3 passou: Publicação de post funciona
- [ ] ✅ Teste 4 passou (opcional): Token refresh funciona
- [ ] ✅ Teste 5 passou (opcional): Tokens antigos ainda funcionam
- [ ] 📝 Scopes corretos no banco: `instagram_business_basic,instagram_business_content_publish`
- [ ] 📝 Logs não mostram tokens completos (apenas masked)
- [ ] 📝 Documentação está atualizada e clara

---

## 🎉 Próximos Passos

Se todos os testes passaram:

1. ✅ **Migração completa com sucesso!**
2. 📢 **Comunicar usuários existentes:**
   - Tokens antigos funcionam por ~60 dias
   - Após expiração, precisarão re-autenticar
   - Conta deve ser Business/Creator

3. 📝 **Atualizar changelogs/release notes:**
   ```markdown
   ## Instagram API Update

   Migrated from deprecated Instagram Basic Display API to Instagram Platform API.

   **What this means for you:**
   - New users: Must have Instagram Business or Creator account
   - Existing users: No action needed now. When your token expires (~60 days),
     you'll need to re-authenticate with a Business/Creator account.

   **How to convert:** Settings → Account → Switch to Professional Account
   ```

4. 🚀 **Deploy quando estiver pronto!**

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do Electron DevTools (Console)
2. Verificar logs do sistema em `~/Library/Logs/Zona21/`
3. Consultar [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md) para guia completo
4. Abrir issue no GitHub com logs e detalhes

---

**Boa sorte com os testes! 🚀**
