# 🧪 Teste do Auto-Update - Zona21

## 📋 Passos para Testar o Auto-Update Completo

### 1. Preparação

#### Versão 0.2.0 (Instalada)
- Baixar: [Zona21-0.2.0-arm64.dmg](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0-arm64.dmg)
- Instalar no Applications
- Abrir e confirmar versão 0.2.0 em Preferences → About

#### Versão 0.2.1 (Publicada)
- Build concluído localmente
- Arquivos gerados em `./release/`
- Servidor atualizado com novo YAML

### 2. Configuração do Update

1. **Abrir Preferences**
   - Menu Zona21 → Preferences
   - Tab "Updates"

2. **Verificar Configuração**
   - ✅ Auto-check for updates: ATIVADO
   - Status: "Checking..." ou "Not available"

3. **Forçar Verificação**
   - Clicar "Check for Updates"
   - Deve detectar versão 0.2.1

### 3. Fluxo do Update

#### Se Funcionar:
1. **Update Available**
   - Mensagem: "Atualização disponível: v0.2.1"
   - Botão "Download" aparece

2. **Download**
   - Clicar "Download"
   - Progresso aparece (0-100%)
   - Status: "Downloading..."

3. **Download Completo**
   - Mensagem: "Atualização baixada: v0.2.1"
   - Botão "Install" aparece

4. **Instalação**
   - Clicar "Install"
   - App fecha automaticamente
   - Novo app abre (versão 0.2.1)

#### Se Não Funcionar:
- **Server error**: Verificar URL do feed
- **404**: Arquivos não encontrados no servidor
- **Permission**: Erro de permissão macOS

### 4. Verificação Final

1. **Abrir About**
   - Deve mostrar "Versão 0.2.1"

2. **Logs**
   - Help → Export Logs
   - Procurar por "update" nos logs

3. **Console Dev**
   - Cmd+Opt+I
   - Verificar console por erros

## 🔧 Troubleshooting

### Problema: "Update server not available"
```bash
# Verificar servidor
curl -I https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml
```

### Problema: "404 Not Found"
- Verificar se arquivos foram uploadados
- Confirmar nomes dos arquivos no YAML

### Problema: "Permission denied"
```bash
# Remover quarentena
xattr -d com.apple.quarantine /Applications/Zona21.app
```

### Problema: Update não inicia
- Verificar se app.isPackaged = true
- Confirmar electron-updater configurado

## 📊 Logs Esperados

### Update Successful
```
[AutoUpdater] Checking for update
[AutoUpdater] Update available: 0.2.1
[AutoUpdater] Downloading update
[AutoUpdater] Update downloaded
[AutoUpdater] Installing update
```

### Update Failed
```
[AutoUpdater] Error: 404 Not Found
[AutoUpdater] Update server not available
```

## 🧪 Test Cases

### Test Case 1: Update Automático
1. Instalar 0.2.0
2. Abrir app
3. Aguardar 5 segundos
4. Verificar notificação de update

### Test Case 2: Update Manual
1. Abrir Preferences
2. Clicar "Check for Updates"
3. Confirmar detecção
4. Completar fluxo

### Test Case 3: Cancelar Download
1. Iniciar download
2. Fechar app
3. Reabrir
4. Retomar download

### Test Case 4: Múltiplos Updates
1. Publicar 0.2.2
2. Verificar se detecta
3. Pular direto para 0.2.2

## 📝 Checklist

- [ ] Versão 0.2.0 instalada
- [ ] Servidor com 0.2.1 configurado
- [ ] Auto-check ativado
- [ ] Update detectado
- [ ] Download bem-sucedido
- [ ] Instalação concluída
- [ ] Versão 0.2.1 confirmada
- [ ] Logs sem erros

## 🚀 Resultado Esperado

O sistema de auto-update deve:
1. Detectar automaticamente novas versões
2. Baixar em background
3. Instalar sem intervenção manual
4. Preservar dados do usuário

---

**Importante**: Este teste valida todo o sistema de distribuição do Zona21!
