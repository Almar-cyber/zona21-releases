# 🔧 Debug de Erros JavaScript no Zona21

## 🚨 Erros de Módulos/JavaScript

Isso indica que o app não carregou corretamente. Vamos debugar:

### 📋 Passo 1: Exportar Logs

1. **Abra o Zona21** (mesmo com erro)
2. Menu: **Help** → **Export Logs**
3. Salve o arquivo de logs
4. Procure por estes erros:
   - `Cannot find module`
   - `Failed to load resource`
   - `TypeError`
   - `ReferenceError`

### 🔍 Passo 2: Verificar Arquivos

No Terminal, verifique se os arquivos essenciais existem:

```bash
# Verificar se o app está completo
ls -la "/Applications/Zona21.app/Contents/Resources/app/"

# Deve existir:
# - index.html
# - main/
# - preload/
# - src/
```

### 🛠️ Passo 3: Reinstalar (Corrompido)

Se faltar arquivos:

1. **Delete o app atual**:
   ```bash
   rm -rf "/Applications/Zona21.app"
   ```

2. **Limpe cache**:
   ```bash
   rm -rf ~/Library/Application\ Support/Zona21
   rm -rf ~/Library/Caches/Zona21
   ```

3. **Reinstale** usando o método ultra fácil

### 📝 Erros Comuns e Soluções

#### Erro: `Cannot find module 'electron'`
- **Causa**: App incompleto
- **Solução**: Reinstalar completamente

#### Erro: `Failed to load resource: net::ERR_FILE_NOT_FOUND`
- **Causa**: Arquivos faltando
- **Solução**: Reinstalar

#### Erro: `TypeError: Cannot read properties of null`
- **Causa**: Bug no código
- **Solução**: Reportar para devs

### 🧪 Teste Rápido

1. **Reinicie o Mac**
2. **Abra apenas o Zona21** (nada mais)
3. **Tente reproduzir o erro**

### 📤 Enviar Relatório de Bug

Se o erro persistir:

1. **Exporte os logs** (Help → Export Logs)
2. **Print da tela** do erro
3. **Descreva o que estava fazendo**
4. **Envie para**: [email de suporte]

### 🔧 Solução Temporária

Se o app não abrir:
- Tente a versão anterior: [Zona21 0.2.0](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0.dmg)

---

**Erros de JavaScript geralmente indicam que o app está corrompido ou incompleto. Reinstalar costuma resolver!**
