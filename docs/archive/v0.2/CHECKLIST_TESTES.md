# 📋 Checklist de Testes - v0.2.2

## 🚀 App está rodando! PID: 52164

### ✅ Para Testar Agora:

#### 1. **Grid Responsivo**
- [ ] Reduza a janela para < 640px (mobile)
  - Cards devem ficar 150px
- [ ] Aumente para 768px (tablet)
  - Cards devem ficar 180px
- [ ] Aumente para 1280px (desktop)
  - Cards devem ficar 200px
- [ ] Aumente para 1600px (large)
  - Cards devem ficar 240px
- [ ] Aumente para >1920px (ultrawide)
  - Cards devem ficar 280px

#### 2. **Sidebar Mobile**
- [ ] Reduza janela < 1024px
  - Sidebar principal deve desaparecer
- [ ] Clique em "Navegar pastas" ou "Ver coleções"
  - Drawer deve deslizar da esquerda
- [ ] Clique no X ou fora do drawer
  - Drawer deve fechar
- [ ] Overlay escuro deve aparecer

#### 3. **Loading Skeleton**
- [ ] Importe uma pasta com muitas fotos
  - Cards cinzas animados devem aparecer
  - Transição suave para fotos reais

#### 4. **Direitos Autorais**
- [ ] Verifique rodapé da sidebar
  - "Feito com ❤️ por Almar"
  - "© 2026. Todos os direitos reservados."
- [ ] NÃO deve ter "Gerenciador de mídia local"
- [ ] NÃO deve ter footer no body

#### 5. **Menu vs Sidebar**
- [ ] Botão direito em volume/pasta
  - Menu deve aparecer ACIMA da sidebar
  - Sem sobreposição

---

### 🔧 Se não funcionar:

1. **Hard Reload**:
   - Cmd+R no app
   - Ou fechar e reabrir

2. **Limpar Cache**:
   ```bash
   rm -rf dist dist-electron
   npm run electron:dev
   ```

3. **Verificar Console**:
   - Cmd+Option+I (DevTools)
   - Verificar erros

---

### 📱 Teste em Diferentes Tamanhos:

Use estes tamanhos de janela:
- iPhone: 375x667
- iPad: 768x1024
- MacBook: 1440x900
- iMac: 1920x1080
- UltraWide: 3440x1440

---

## 🎯 Status Esperado

✅ Grid se ajusta automaticamente  
✅ Mobile funciona com drawer  
✅ Loading aparece  
✅ Direitos corretos  
✅ Sem sobreposição de menus  

**Se tudo funcionar, está pronto para build!** 🚀
