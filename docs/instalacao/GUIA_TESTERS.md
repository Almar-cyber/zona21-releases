# 🧪 Guia para Testers - Zona21

## 📥 Como Instalar (macOS)

O Zona21 ainda não está assinado na Apple Store, então siga estes passos:

### 🎯 Método Rápido (Recomendado)

1. **Baixe o DMG**
   - Link: [Download Zona21 v0.2.1](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.1-arm64.dmg)

2. **Abra o Terminal** (⌘ + Espaço, digite "Terminal")

3. **Cole e execute este comando**:
   ```bash
   sudo xattr -rd com.apple.quarantine ~/Downloads/Zona21-*.dmg
   ```

4. **Digite sua senha** (não aparece ao digitar)

5. **Agora clique duas vezes** no DMG e arraste para Applications!

### 🔧 Método Alternativo

Se o acima não funcionar:

1. **Clique com botão direito** no DMG → "Abrir"
2. **Clique "Abrir"** novamente no alerta
3. **Arraste o Zona21** para Applications

### ⚠️ Mensagem "is damaged"?

Se aparecer "Zona21 is damaged and can't be opened":

```bash
# No Terminal, execute:
sudo xattr -rd com.apple.quarantine /Applications/Zona21.app
```

## 🚀 Testando o Auto-Update

### Para Testar Update Automático:

1. **Instale a versão 0.2.0** (mais antiga):
   - Download: [Zona21 v0.2.0](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0.dmg)

2. **Abra o Zona21 0.2.0**

3. **O banner deve aparecer**:
   ```
   🔔 Atualização disponível!    [Atualizar agora]
   ```

4. **Clique em "Atualizar agora"**

5. **Vá em Preferences → Updates**

6. **Clique "Check for Updates"**

7. **Deve detectar v0.2.1**

8. **Clique "Download"** e veja o progresso

9. **Clique "Install"** para atualizar

## 📋 O que Testar?

### ✅ Funcionalidades Principais:
- [ ] Importar fotos/vídeos
- [ ] Navegar pela biblioteca
- [ ] Visualizar arquivos
- [ ] Selecionar múltiplos itens
- [ ] Exportar seleção

### 🔄 Auto-Update:
- [ ] Banner aparece
- [ ] Download com progresso
- [ ] Instalação automática
- [ ] App reabre atualizado

### 📱 Responsividade:
- [ ] Menu não cobre sidebar em mobile
- [ ] Layout funciona em telas pequenas
- [ ] Botões funcionam bem

### 🎨 UI/UX:
- [ ] Loading no filtro funciona
- [ ] Empty state aparece quando vazio
- [ ] Botão "Apagar" não fica todo vermelho

## 🐛 Encontrou um Bug?

1. **Print da tela** (⌘ + ⇧ + 4)
2. **Exporte os logs**: Help → Export Logs
3. **Descreva os passos** para reproduzir
4. **Envie para**: [seu-email@domínio.com]

## 💡 Dicas

- **Cmd + ,** abre Preferences
- **Cmd + K** atalhos do teclado
- **ESC** fecha menus popups
- **Cmd + C/V** funciona para copiar/colar arquivos

## 🆘 Problemas Comuns

**App não abre**: Execute o comando xattr acima
**Update não baixa**: Verifique conexão com internet
**Fotos não aparecem**: Clique em "Add Folder" ou conecte um HD

---

**Obrigado por testar o Zona21!** 🎉

*Sua ajuda é fundamental para melhorarmos o app!*
