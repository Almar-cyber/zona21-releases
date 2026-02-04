# Instagram Scheduler - Guia de Configuração

## Visão Geral

O Zona21 permite agendar e publicar posts automaticamente no Instagram usando a Instagram Platform API (anteriormente conhecida como Instagram Basic Display API).

## Requisitos

### 1. Conta Instagram Business ou Creator

⚠️ **IMPORTANTE**: Contas pessoais do Instagram **NÃO** funcionam com a Instagram Platform API.

Para converter sua conta:
1. Abra o app Instagram
2. Vá em **Configurações** > **Conta**
3. Selecione **Mudar tipo de conta**
4. Escolha **Conta Business** ou **Conta Creator**

### 2. Criar App no Meta for Developers

1. Acesse https://developers.facebook.com/
2. Clique em **Meus Apps** > **Criar App**
3. Selecione **Consumer** como tipo de app
4. Preencha os detalhes do app
5. No painel do app, adicione o produto **Instagram**

### 3. Configurar Instagram Platform API

1. No painel do app, vá em **Instagram** > **Platform API**
2. Clique em **Configurar** e siga as instruções
3. Em **Valid OAuth Redirect URIs**, adicione:
   ```
   zona21://oauth/callback
   ```
4. Em **Instagram tester accounts**, adicione sua conta Instagram Business/Creator

### 4. Obter Credenciais

1. No painel do app, vá em **Configurações** > **Básico**
2. Copie o **App ID**
3. Clique em **Mostrar** ao lado de **App Secret** e copie

## Configuração no Zona21

Existem 3 formas de configurar as credenciais:

### Opção 1: Variáveis de Ambiente (Recomendado para Dev)

```bash
export INSTAGRAM_APP_ID="seu-app-id"
export INSTAGRAM_APP_SECRET="seu-app-secret"
export INSTAGRAM_REDIRECT_URI="zona21://oauth/callback"
```

### Opção 2: Arquivo de Configuração (Recomendado para Produção)

1. Localize a pasta userData do Zona21:
   - **macOS**: `~/Library/Application Support/zona21/`
   - **Windows**: `%APPDATA%/zona21/`
   - **Linux**: `~/.config/zona21/`

2. Crie o arquivo `instagram-config.json`:

```json
{
  "instagram": {
    "appId": "seu-app-id",
    "appSecret": "seu-app-secret",
    "redirectUri": "zona21://oauth/callback"
  }
}
```

### Opção 3: Arquivo no Projeto (Apenas Dev)

Crie `instagram-config.json` na raiz do projeto com o mesmo formato da Opção 2.

⚠️ **Segurança**: Nunca commite este arquivo! Já está no `.gitignore`.

## Como Usar

### 1. Conectar Conta Instagram

1. Abra o Zona21
2. Clique no menu **Tools** > **Instagram Scheduler**
3. Clique em **Conectar Instagram**
4. Autorize o acesso no navegador
5. Volte ao Zona21 (o app detectará automaticamente)

### 2. Agendar um Post

1. Selecione uma foto na biblioteca
2. Abra o Instagram Scheduler
3. Clique em **Agendar**
4. Preencha:
   - **Legenda**: Texto do post (até 2.200 caracteres)
   - **Hashtags**: Tags relevantes (máximo 30)
   - **Data e Hora**: Quando publicar
   - **Proporção**: 1:1 (quadrado), 4:5 (vertical) ou 16:9 (horizontal)
5. Clique em **Agendar Post**

### 3. Gerenciar Posts Agendados

- **Calendário**: Visualize posts agendados por mês
- **Fila**: Lista de todos os posts pendentes
- **Editar/Cancelar**: Clique no post para modificá-lo

## Limites

### Plano Free
- 5 posts por mês
- Calendário básico
- Sugestões de hashtags básicas

### Plano Pro
- Posts ilimitados
- Calendário com drag & drop
- Analytics detalhado
- Sugestões IA de hashtags
- Até 5 contas conectadas
- Suporte prioritário

## Solução de Problemas

### "Conta pessoal detectada"

**Problema**: A API detectou que sua conta é pessoal.

**Solução**: Converta para Business ou Creator (veja Requisitos acima).

### "OAuth callback failed"

**Possíveis causas**:
1. Credenciais incorretas
2. Redirect URI não configurado corretamente no Meta
3. Conta não adicionada como tester no app

**Solução**:
1. Verifique o arquivo de configuração
2. Confirme que `zona21://oauth/callback` está em Valid OAuth Redirect URIs
3. Adicione sua conta em Instagram Tester Accounts

### "Failed to publish post"

**Possíveis causas**:
1. Token expirado (60 dias)
2. Imagem muito grande ou formato inválido
3. Limite de posts do Instagram atingido

**Solução**:
1. Reconecte sua conta Instagram
2. Use imagens JPG ou PNG, máximo 8MB
3. Aguarde e tente novamente

### "No Instagram config found"

**Problema**: Zona21 não encontrou as credenciais.

**Solução**: Configure usando uma das 3 opções acima.

## Arquitetura Técnica

### Backend (Electron Main Process)

- **oauth-manager.ts**: Gerencia OAuth 2.0 com Instagram
- **instagram-scheduler.ts**: Verifica posts prontos a cada 30 segundos
- **instagram-queue.ts**: Fila de publicação com retry automático
- **instagram-publisher.ts**: Publica posts via Instagram Graph API
- **instagram-limits.ts**: Controle de limites Free/Pro

### Frontend (React)

- **InstagramTab.tsx**: Interface principal
- **InstagramCalendar.tsx**: Calendário visual
- **InstagramPreview.tsx**: Preview do post
- **InstagramHashtagSuggestions.tsx**: Sugestões de hashtags

### Banco de Dados (SQLite)

```sql
-- Posts agendados
scheduled_posts (
  id, asset_id, scheduled_at, caption, hashtags,
  location_name, location_id, aspect_ratio, status,
  remote_id, error_message, created_at, updated_at
)

-- Histórico de publicações
publish_history (
  id, scheduled_post_id, published_at, remote_id,
  permalink, likes_count, comments_count, created_at
)
```

## API Reference

### Instagram Graph API Endpoints Utilizados

1. **OAuth**: `GET https://api.instagram.com/oauth/authorize`
2. **Token Exchange**: `POST https://api.instagram.com/oauth/access_token`
3. **Long-Lived Token**: `GET https://graph.instagram.com/access_token`
4. **User Info**: `GET https://graph.instagram.com/me`
5. **Create Media**: `POST https://graph.instagram.com/v18.0/{user-id}/media`
6. **Publish Media**: `POST https://graph.instagram.com/v18.0/{user-id}/media_publish`

## Recursos Adicionais

- [Instagram Platform API Docs](https://developers.facebook.com/docs/instagram-platform-api/)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform-api/guides/content-publishing)
- [OAuth Guide](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

## Suporte

Para questões técnicas ou bugs, abra uma issue no GitHub do projeto.
