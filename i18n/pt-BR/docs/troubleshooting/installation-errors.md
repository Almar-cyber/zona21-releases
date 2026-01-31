# 🔧 Solução de Erros de Instalação

## ❌ Erros Comuns e Soluções

### Erro 1: "Zona21 is damaged and can't be opened"

**Causa**: O macOS detectou o arquivo como possivelmente prejudicial.

**Solução A (Botão Direito)**:
1. Após arrastar para Applications, **botão direito** no app Zona21
2. Selecione **"Abrir"**
3. Clique **"Abrir"** novamente no alerta

**Solução B (Terminal - se A não funcionar)**:
```bash
sudo xattr -rd com.apple.quarantine /Applications/Zona21.app
```

### Erro 2: "Zona21 can't be opened because Apple cannot check it for malicious software"

**Solução**:
1. Vá em **System Settings** → **Privacy & Security**
2. Role até encontrar **"Security"**
3. Clique em **"Open Anyway"** ao lado do Zona21
4. Tente abrir novamente

### Erro 3: "The application cannot be opened because its executable is missing"

**Causa**: O DMG foi corrompido no download.

**Solução**:
1. Delete o DMG atual
2. Limpe o cache: `rm -rf ~/Library/Caches/com.apple.Safari*`
3. Baixe novamente: [Link direto](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.1.dmg)

### Erro 4: DMG não monta ou fica cinza

**Solução**:
1. Abra **Disk Utility** (Applications → Utilities)
2. Arquivo → Open Image
3. Selecione o DMG do Zona21
4. Se montar, arraste o app manualmente

## 🧪 Teste de Verificação

Após instalar, verifique se está funcionando:

1. **Abra o Zona21**
2. **Deve aparecer**: Welcome ou tela de seleção de volume
3. **Se aparecer erro**: Exporte os logs (Help → Export Logs)

## 📱 Se Nada Funcionar

### Opção 1: Usar versão ZIP
Baixe a versão ZIP em vez do DMG:
```bash
curl -L -o Zona21.zip https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.1-arm64-mac.zip
# Descompacte e arraste para Applications
```

### Opção 2: Contatar suporte
Envie:
- Print do erro
- Versão do macOS
- Modelo do Mac
- Logs do app (Help → Export Logs)

## ✅ Verificação Final

Para confirmar que instalou corretamente:
1. Abra o Terminal
2. Digite: `ls -la /Applications/Zona21.app`
3. Deve mostrar a pasta do app

---

**Se o erro persistir, por favor, me envie o print exato que aparece!** 📸
