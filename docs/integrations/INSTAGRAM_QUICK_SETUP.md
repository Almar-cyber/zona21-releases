# 🚀 Guia Rápido: Instagram Platform API (2026)

## ⚡ TL;DR - O Que Procurar

Você **NÃO** vai encontrar "Instagram API" como produto para adicionar.
O Instagram agora é configurado via **"Use Cases"** (Casos de Uso) + **"Permissions"** (Permissões).

---

## 📍 Onde Encontrar Cada Coisa no Meta Dashboard

### 1️⃣ Menu Lateral Esquerdo do Seu App

Quando você abre seu app em https://developers.facebook.com/apps/YOUR_APP_ID, procure:

```
Menu Lateral:
├── Dashboard (tela inicial)
├── Use cases ← COMECE AQUI
├── App Review
│   └── Permissions and Features ← DEPOIS AQUI
├── Settings
│   └── Basic ← CREDENCIAIS AQUI
├── Roles
└── ...outros
```

---

## 🎯 Passo 1: Use Cases

**Menu lateral → "Use cases"**

Você verá cards com opções:

```
┌─────────────────────────────────────────┐
│ Authenticate and request data from users│ ← CLIQUE NESTE
│ Let people log in and share data        │
│                                         │
│              [Get started]               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Build a business solution               │
│ Create apps for businesses              │
└─────────────────────────────────────────┘
```

**Clique em "Get started"** no primeiro card.

---

## 🎯 Passo 2: Configurar Facebook Login

Dentro de "Authenticate and request data from users":

1. **Facebook Login** será configurado (é a base para tudo)
2. Adicione o redirect URI:
   ```
   zona21://oauth/callback
   ```
3. Salve as configurações

---

## 🎯 Passo 3: Permissões do Instagram

**Menu lateral → "App Review" → "Permissions and Features"**

Você verá uma lista enorme de permissões. Use o **search box** para encontrar:

```
🔍 Buscar: "instagram"

Resultados:
✅ instagram_business_basic             [Request ▼]
✅ instagram_business_content_publish   [Request ▼]
   instagram_manage_comments            [Request ▼]
   instagram_manage_insights            [Request ▼]
   ...
```

**Clique em "Request"** nas duas primeiras:
- `instagram_business_basic`
- `instagram_business_content_publish`

**Para teste/desenvolvimento:** Permissões são ativadas imediatamente.
**Para produção:** Você precisará submeter para revisão.

---

## 🎯 Passo 4: Obter Credenciais

**Menu lateral → "Settings" → "Basic"**

Role para baixo até ver:

```
App ID
123456789012345                    [Copy]
                                   ↑ COPIE ESTE

App Secret
*****************************      [Show] [Copy]
                                   ↑ CLIQUE EM "SHOW" E COPIE
```

---

## 📝 Passo 5: Configurar no Zona21

```bash
# 1. Criar arquivo de config
cp instagram-config.example.json instagram-config.json

# 2. Editar com suas credenciais
{
  "instagram": {
    "appId": "123456789012345",        ← App ID copiado
    "appSecret": "abc123def456...",     ← App Secret copiado
    "redirectUri": "zona21://oauth/callback"
  }
}
```

---

## ✅ Checklist de Verificação

Antes de testar, confirme:

- [ ] App tipo "Business" criado
- [ ] "Use cases" → "Authenticate and request data" configurado
- [ ] Facebook Login configurado com redirect URI
- [ ] Permissão `instagram_business_basic` solicitada
- [ ] Permissão `instagram_business_content_publish` solicitada
- [ ] Credenciais (App ID e App Secret) copiadas
- [ ] Arquivo `instagram-config.json` criado e configurado
- [ ] Conta Instagram é Business ou Creator (não Personal)

---

## 🐛 Problema: "Não vejo Use Cases no menu"

**Causa 1:** App tipo incorreto

**Solução:**
1. Menu → Settings → Basic
2. Verificar "App Type"
3. Se não for "Business", você precisará criar um novo app tipo Business

---

**Causa 2:** Dashboard antigo

**Solução:**
1. Tente acessar diretamente: `https://developers.facebook.com/apps/YOUR_APP_ID/use-cases/`
2. Ou procure por "Business settings" ou "App settings"

---

## 🎬 Próximo Passo: Testar

```bash
# 1. Iniciar o app
npm run dev

# 2. Abrir aba Instagram no Zona21

# 3. Clicar em "Conectar Instagram"

# 4. Verificar no console do navegador OAuth:
#    URL deve conter: scope=instagram_business_basic,instagram_business_content_publish

# 5. Autorizar com sua conta Business/Creator

# 6. Sucesso! 🎉
```

---

## 📚 Referências

- [Instagram Platform API GitHub Guide](https://gist.github.com/PrenSJ2/0213e60e834e66b7e09f7f93999163fc)
- [Instagram API Complete Guide 2026](https://tagembed.com/blog/instagram-api/)
- [Instagram Graph API Guide 2025](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)

---

**🆘 Ainda com problemas?** Tire um print do menu lateral do seu app e compartilhe - posso te orientar especificamente!
