# Guia de Instalação - Zona21

## 📋 Requisitos do Sistema

- **macOS**: 11 (Big Sur) ou superior
- **Memória RAM**: 4GB (8GB recomendado)
- **Espaço em Disco**: 500MB para o app + espaço para biblioteca de mídia
- **Processador**:
  - Apple Silicon (M1/M2/M3) → Versão ARM64
  - Intel → Versão x64

## 🚀 Instalação

### Método 1: Instalação Manual (Recomendado)

Este é o método mais simples e recomendado para a maioria dos usuários.

#### Passo 1: Download

1. Acesse a página de download: [https://zona21.app/download](https://zona21.app/download)
2. Clique em **"Download para macOS"**
3. Escolha a versão correta para seu Mac:
   - **Apple Silicon** (M1/M2/M3) → `Zona21-latest-arm64.dmg`
   - **Intel** → `Zona21-latest-x64.dmg`

**Dica**: Para saber qual processador seu Mac tem:
- Clique no ícone  (Apple) no canto superior esquerdo
- Selecione "Sobre Este Mac"
- Se aparecer "Chip Apple M1/M2/M3" → ARM64
- Se aparecer "Processador Intel" → x64

#### Passo 2: Abrir o DMG

1. Localize o arquivo `.dmg` baixado (geralmente em `Downloads`)
2. Dê duplo clique no arquivo
3. Uma janela aparecerá mostrando o ícone do Zona21

#### Passo 3: Arrastar para Applications

1. Arraste o ícone **Zona21** para a pasta **Applications**
2. Aguarde a cópia concluir
3. Feche a janela do DMG
4. Ejete o volume Zona21 (botão ejetar no Finder)

#### Passo 4: Primeira Execução

⚠️ **IMPORTANTE**: Na primeira execução, o macOS bloqueará o app por não estar assinado. Siga estas etapas:

1. Abra o **Finder**
2. Vá em **Applications** (Cmd+Shift+A)
3. Localize o app **Zona21**
4. **Segure a tecla Control (Ctrl)** e clique no app
5. No menu que aparecer, selecione **"Abrir"**
6. Uma janela de confirmação aparecerá:
   - Clique em **"Abrir"** novamente
7. ✅ O app abrirá normalmente!

#### Passo 5: Próximas Execuções

A partir de agora, você pode abrir o Zona21 normalmente:
- Duplo clique no Launchpad
- Ou abra pelo Spotlight (Cmd+Espaço, digite "Zona21")
- Ou arraste para o Dock para acesso rápido

---

### Método 2: Terminal (Script Automático)

Para usuários que preferem terminal, criamos um script que automatiza todo o processo.

#### Usando o Script de Instalação

```bash
# Download e execução em um comando
curl -fsSL https://zona21.app/install.sh | bash
```

**O que o script faz:**
1. Detecta automaticamente sua arquitetura (ARM64 ou x64)
2. Baixa a versão correta do Zona21
3. Remove atributos de quarentena
4. Instala na pasta Applications
5. Abre o app automaticamente

**Instalação manual do script:**

```bash
# Download do script
curl -o install.sh https://zona21.app/install.sh

# Dar permissão de execução
chmod +x install.sh

# Executar
./install.sh
```

---

### Método 3: Homebrew (Em Breve)

O Zona21 estará disponível via Homebrew em breve.

```bash
# Quando disponível (v0.2.0+)
brew tap zona21/zona21
brew install --cask zona21
```

---

## 🔧 Troubleshooting

### Problema: "Zona21 não pode ser aberto"

**Causa**: O macOS Gatekeeper está bloqueando apps não assinados.

**Solução**:
1. Use **Ctrl+Clique** > **"Abrir"** na primeira execução
2. Ou remova a quarentena via Terminal:
   ```bash
   xattr -cr /Applications/Zona21.app
   open /Applications/Zona21.app
   ```

### Problema: "App danificado e deve ir para Lixeira"

**Causa**: Atributos de quarentena do macOS.

**Solução**:
```bash
xattr -cr /Applications/Zona21.app
```

### Problema: "Não tenho permissão para abrir"

**Causa**: Permissões de arquivo incorretas.

**Solução**:
```bash
sudo chown -R $(whoami) /Applications/Zona21.app
chmod -R 755 /Applications/Zona21.app
```

### Problema: App não aparece no Launchpad

**Causa**: Cache do Launchpad não atualizado.

**Solução**:
```bash
defaults write com.apple.dock ResetLaunchPad -bool true
killall Dock
```

### Problema: Tela branca ao abrir

**Causa**: Possível problema de cache ou instalação corrompida.

**Solução**:
1. Feche o app completamente
2. Limpe o cache:
   ```bash
   rm -rf ~/Library/Application\ Support/Zona21
   ```
3. Abra o app novamente

### Problema: "FFmpeg não encontrado"

**Causa**: Zona21 precisa do FFmpeg para processar vídeos.

**Solução**:
O FFmpeg já vem embutido no app, mas se houver problemas:
```bash
# Verificar se FFmpeg está disponível
ls /Applications/Zona21.app/Contents/Resources/app.asar.unpacked/node_modules/@ffmpeg-installer/
```

---

## 🗑️ Desinstalação

### Desinstalar o App

```bash
# Remover o aplicativo
rm -rf /Applications/Zona21.app
```

### Remover Dados do Usuário (Opcional)

⚠️ **Atenção**: Isso apagará todas as suas bibliotecas e configurações!

```bash
# Remover dados da aplicação
rm -rf ~/Library/Application\ Support/Zona21

# Remover preferências
rm -rf ~/Library/Preferences/com.zona21.app.plist

# Remover logs
rm -rf ~/Library/Logs/Zona21
```

---

## 📝 Perguntas Frequentes

### O Zona21 é seguro?

Sim! O Zona21 é um software open-source. Você pode verificar o código-fonte em:
https://github.com/zona21/zona21

A razão pela qual o macOS mostra um aviso é que não pagamos a taxa anual de $99 para assinatura da Apple. Isso não significa que o software é inseguro.

### Por que preciso usar Ctrl+Clique na primeira vez?

O macOS tem um sistema de segurança chamado Gatekeeper que verifica assinaturas digitais. Como não temos assinatura da Apple (para evitar custos), você precisa autorizar manualmente na primeira execução.

### O app funcionará em versões futuras do macOS?

Sim! O processo de instalação é o mesmo para todas as versões modernas do macOS (11+).

### Posso instalar em múltiplos Macs?

Sim! O Zona21 é gratuito e pode ser instalado em quantos Macs você quiser.

### Como faço para atualizar?

O Zona21 tem auto-update embutido. Quando uma nova versão estiver disponível:
1. Uma notificação aparecerá no app
2. Clique em "Atualizar"
3. O app baixará e instalará automaticamente

### Onde ficam salvos meus dados?

- **Biblioteca de mídia**: `~/Library/Application Support/Zona21/zona21.db`
- **Thumbnails**: `~/Library/Application Support/Zona21/thumbnails/`
- **Configurações**: `~/Library/Preferences/com.zona21.app.plist`

---

## 🆘 Suporte

Se você continuar tendo problemas após seguir este guia:

- **Email**: suporte@zona21.app
- **GitHub Issues**: https://github.com/zona21/zona21/issues
- **Discord**: https://discord.gg/zona21

Ao reportar um problema, inclua:
1. Versão do macOS (Sobre Este Mac)
2. Versão do Zona21 (no menu Sobre)
3. Logs do app (veja seção abaixo)

### Como exportar logs

1. Abra o Zona21
2. Vá em **Help** > **Export Logs**
3. Salve o arquivo de log
4. Anexe ao seu report

Ou via Terminal:
```bash
cat ~/Library/Logs/Zona21/main.log
```

---

## ✅ Checklist de Instalação

- [ ] Download da versão correta (ARM64 ou x64)
- [ ] DMG aberto e app arrastado para Applications
- [ ] Primeira execução com Ctrl+Clique > Abrir
- [ ] App abre normalmente
- [ ] Testado com uma pasta de fotos/vídeos

Se todos os itens estão marcados, você está pronto! 🎉

---

**Versão do Guia**: 1.0
**Última Atualização**: 24 de Janeiro de 2026
**Compatibilidade**: Zona21 v0.1.0+
