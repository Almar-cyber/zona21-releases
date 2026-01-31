# 🎯 Instalação Fácil - Sem Terminal!

## Método 1: Botão Direito (Mais Fácil)

1. **Baixe o DMG** do Zona21
2. **Clique com botão direito** no arquivo DMG
3. **Selecione "Abrir"** (não clique duplo!)
4. **Clique "Abrir"** novamente no alerta que aparece
5. **Arraste o Zona21** para a pasta Applications
6. **Pronto!** ✅

## Método 2: System Settings (macOS 13+)

1. **Baixe o DMG**
2. **Vá em**: System Settings → Privacy & Security
3. **Role até "Security"**
4. **Clique "Open Anyway"** ao lado do Zona21
5. **Abra o DMG** normalmente

## Método 3: Automator App (Crie um instalador)

Vou criar um app que faz tudo automaticamente!

### Passo a passo para criar:

1. **Abra Automator** (em Applications)
2. **Crie "Application"**
3. **Adicione estas ações**:
   - Run Shell Script: `sudo xattr -rd com.apple.quarantine ~/Downloads/Zona21-*.dmg`
   - Run Shell Script: `open ~/Downloads/Zona21-*.dmg`

## Método 4: Arrastar e Soltar

1. **Baixe o DMG**
2. **Clique duplo** no DMG (vai dar erro)
3. **Ignore o erro**
4. **Arraste o Zona21** diretamente do DMG para o Desktop
5. **Clique botão direito** no app do Desktop → "Abrir"
6. **Depois mova** para Applications

## 🎯 Vídeo de 30 segundos (para fazer)

```
1. Mostrar download do DMG
2. Botão direito no DMG → Abrir
3. Clicar "Abrir" no alerta
4. Arrastar para Applications
5. Abrir o app
```

## 📱 Para iOS (futuro)

Quando tivermos a versão iOS:
- TestFlight beta (sem precisar de nada especial)
- App Store (quando lançar)

---

**Dica**: O botão direito é o método mais fácil! Funciona na maioria dos casos.
