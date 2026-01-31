# 🔧 Erro "is damaged" - Solução Definitiva

## ❌ Erro: "Zona21.app" está danificado e não pode ser aberto

Este erro ocorre porque o macOS não reconhece o desenvolvedor (app não assinado).

## ✅ Soluções (da mais fácil para mais técnica)

### Solução 1: Botão Direito (Mais Fácil)

1. **Clique com BOTÃO DIREITO** no Zona21.app
2. **Selecione "Abrir"** (não clique duplo!)
3. **Clique "Abrir"** na janela de alerta
4. **Pronto!** O app abrirá

### Solução 2: System Settings

1. **Vá em**: Apple  → System Settings
2. **Privacy & Security** (na barra lateral)
3. **Role até "Security"**
4. **Clique "Open Anyway"** ao lado do Zona21
5. **Tente abrir novamente**

### Solução 3: Terminal (Se as acima não funcionarem)

1. **Abra o Terminal** (⌘ + Espaço, digite "Terminal")
2. **Cole este comando**:
   ```bash
   sudo xattr -rd com.apple.quarantine /Applications/Zona21.app
   ```
3. **Digite sua senha** (não aparece ao digitar)
4. **Tente abrir o app**

### Solução 4: Reinstalar

1. **Delete o app**: Arraste Zona21.app para o Lixo
2. **Esvazie o Lixo**
3. **Baixe novamente**: https://github.com/Almar-cyber/zona21/releases/tag/v0.2.1
4. **Use a Solução 1** ao instalar

## 🤔 Por que isso acontece?

- O app não está assinado digitalmente pela Apple
- macOS protege contra apps desconhecidos
- É uma segurança, não um problema real

## 📱 Para Testers

**Instruções para enviar:**
> "Ao abrir o Zona21 pela primeira vez, clique com botão direito no app e selecione 'Abrir'. Confirme 'Abrir' na janela que aparece. Isso é necessário porque o app ainda não está assinado na App Store."

## ✅ Verificação

Após usar uma das soluções:
1. O app deve abrir normalmente
2. Aparecerá a tela de boas-vindas ou seleção de volume
3. Não precisará fazer isso novamente

## 🔮 Futuro

Quando assinarmos o app:
- Clique duplo funcionará normalmente
- Sem alertas de segurança
- Experiência nativa macOS

---

**Lembre-se: Isso é normal para apps em desenvolvimento!** 😊
