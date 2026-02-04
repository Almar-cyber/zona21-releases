# Meta for Developers - Configuração OAuth

## Problema: "URI de redirecionamento inválido"

Você viu esta mensagem porque o `zona21://oauth/callback` ainda não foi adicionado à lista de URIs válidos.

## Solução Passo a Passo

### 1. Acessar Configurações do Facebook Login

1. Acesse: https://developers.facebook.com/apps/820805891006941/

2. No menu lateral esquerdo, procure por:
   ```
   Produtos → Facebook Login → Configurações
   ```
   OU
   ```
   Products → Facebook Login → Settings
   ```

3. Você verá uma seção chamada **"Valid OAuth Redirect URIs"**

### 2. Adicionar o Redirect URI

Na seção **Valid OAuth Redirect URIs**:

1. Clique no campo de texto

2. Digite exatamente:
   ```
   zona21://oauth/callback
   ```

3. Pressione **Enter** ou clique em **Add**

4. O URI deve aparecer como uma "tag" ou "chip" azul

5. **IMPORTANTE**: Role até o final da página e clique em **"Save Changes"** ou **"Salvar Alterações"**

### 3. Solicitar Advanced Access (Desenvolvimento)

Há 2 opções:

#### Opção A: Modo de Desenvolvimento (Recomendado para testes)

1. No topo da página do app, procure por um toggle/switch

2. Mude de **"Live"** para **"Development"**

3. Em modo de desenvolvimento, você pode testar sem aprovação

4. Adicione sua conta Instagram como **Tester**:
   - Vá em **Roles** → **Instagram Testers**
   - Adicione seu @username
   - Aceite o convite no app Instagram

#### Opção B: Solicitar Acesso Avançado (Para produção)

1. Vá em **App Review** → **Permissions and Features**

2. Procure por:
   - `instagram_basic` - Clique em **Request Advanced Access**
   - `instagram_content_publish` - Clique em **Request Advanced Access**

3. Preencha o formulário explicando:
   ```
   We need these permissions to allow users to schedule and publish
   Instagram posts directly from our media management application.
   ```

4. Aguarde aprovação (pode levar alguns dias)

### 4. Configuração Completa do Instagram Platform API

Se você ainda não configurou o Instagram Platform API:

1. No menu lateral, vá em **Add Product**

2. Adicione **Instagram Platform API** (não Instagram Basic Display)

3. Configure:
   - **Instagram App ID**: Será gerado automaticamente
   - **Instagram App Secret**: Será gerado automaticamente
   - **OAuth Redirect URIs**: `zona21://oauth/callback`
   - **Deauthorize Callback URL**: Pode deixar em branco
   - **Data Deletion Request URL**: Pode deixar em branco

### 5. Verificação Final

Após adicionar o URI e salvar:

1. Volte para o **Validador da URI de redirecionamento**

2. Digite: `zona21://oauth/callback`

3. Clique em **Verificar URI**

4. Agora deve mostrar **✓ URI válido**

## Configuração Atual do Seu App

```json
{
  "App ID": "820805891006941",
  "App Name": "Zona21 (ou nome que você deu)",
  "Redirect URI": "zona21://oauth/callback",
  "Produto": "Instagram Platform API"
}
```

## Checklist

- [ ] Facebook Login adicionado como produto
- [ ] Instagram Platform API adicionado como produto
- [ ] `zona21://oauth/callback` adicionado em Valid OAuth Redirect URIs
- [ ] Alterações salvas (botão Save Changes)
- [ ] App em modo Development OU permissões aprovadas
- [ ] Conta Instagram adicionada como Tester
- [ ] Convite aceito no app Instagram
- [ ] Conta Instagram é Business ou Creator

## Screenshots de Referência

### Onde adicionar o Redirect URI:

```
┌─────────────────────────────────────────┐
│ Facebook Login Settings                 │
├─────────────────────────────────────────┤
│                                         │
│ Valid OAuth Redirect URIs               │
│ ┌─────────────────────────────────────┐ │
│ │ zona21://oauth/callback         [×] │ │
│ │ [Digite um novo URI...]             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ☐ Use Strict Mode for Redirect URIs    │
│                                         │
│         [Save Changes]                  │
└─────────────────────────────────────────┘
```

### Modo Development vs Live:

```
┌────────────────────────────────────┐
│  [Development ▼]  │  820805891006941  │
│  ▲ Clique aqui para mudar           │
└────────────────────────────────────┘
```

## Testando

Depois de configurar tudo:

1. Feche o Zona21 completamente

2. Reinicie o app

3. Clique em "Conectar Instagram"

4. Você deve ser levado ao Instagram para autorizar

5. Após autorizar, deve voltar ao Zona21 automaticamente

## Erros Comuns

### "Redirect URI mismatch"
- Certifique-se de que digitou exatamente: `zona21://oauth/callback`
- Sem espaços, sem maiúsculas diferentes
- Salvou as alterações

### "App not configured for Facebook Login"
- Adicione o produto Facebook Login
- Configure Client OAuth Settings

### "Invalid Scopes: instagram_basic"
- Você precisa adicionar Instagram Platform API como produto
- OU solicitar Advanced Access para essa permissão

## Alternativa Temporária (apenas para testes)

Se o deep link não funcionar, você pode testar com localhost:

1. Adicione também este URI:
   ```
   http://localhost:3000/oauth/callback
   ```

2. No `instagram-config.json`, mude temporariamente para localhost

3. O Zona21 vai precisar iniciar um servidor local para capturar o callback

**Nota**: Esta é apenas uma solução temporária para debug. O deep link é a forma correta.

## Próximos Passos

Após configurar corretamente:

1. Teste o fluxo OAuth
2. Verifique os logs do Zona21
3. Se funcionar, você verá sua conta conectada
4. Pode começar a agendar posts!

## Suporte

Se ainda não funcionar após seguir todos os passos:

1. Verifique os logs: `~/Library/Logs/zona21/main.log`
2. Procure por: `oauth`, `deep-link`, `instagram`
3. Compartilhe os erros para debug
