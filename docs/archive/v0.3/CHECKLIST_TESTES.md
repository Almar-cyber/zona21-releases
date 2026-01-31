# 📋 Checklist de Testes - Zona21 v0.3.0

## 🎯 Testes Obrigatórios Antes de Fechar v0.3

### 1. ⌨️ Atalhos de Teclado
- [ ] `?` → Abre modal de atalhos
- [ ] `Cmd+A` → Seleciona todos os arquivos visíveis
- [ ] `P` → Marca/desmarca favorito do selecionado
- [ ] `Enter` → Abre viewer do selecionado
- [ ] `Delete` → Limpa seleção atual
- [ ] `←` `→` `↑` `↓` → Navega entre arquivos
- [ ] `Esc` → Fecha viewer/modal aberto

### 2. 🎬 Onboarding Wizard
- [ ] Aparece na primeira execução
- [ ] Não aparece em execuções subsequentes
- [ ] Botão "Pular" funciona
- [ ] Navegação entre passos funciona
- [ ] Fecha corretamente ao finalizar

### 3. 📸 Viewer Lateral
- [ ] Double-click abre viewer no lado DIREITO
- [ ] Viewer não sobrepõe a grid de arquivos
- [ ] Botão X fecha o viewer
- [ ] Esc fecha o viewer
- [ ] Metadados são exibidos corretamente

### 4. ⏸️ Controles de Indexação
- [ ] Barra de progresso aparece durante indexação
- [ ] Botão pausar ⏸️ funciona
- [ ] Botão retomar ▶️ funciona  
- [ ] Botão cancelar ✕ funciona
- [ ] Status "Pausado" aparece quando pausado
- [ ] Indexação retoma do ponto onde parou

### 5. 🔄 Auto-Update
- [ ] App instalado v0.2.2
- [ ] Verificar atualizações encontra v0.3.0
- [ ] Download da atualização funciona
- [ ] Instalação da atualização funciona
- [ ] App reinicia na versão nova

### 6. 🖥️ Performance
- [ ] CPU não passa de 50% durante indexação
- [ ] Computador não esquenta excessivamente
- [ ] UI permanece responsiva durante indexação
- [ ] Scroll suave com 500+ arquivos
- [ ] Memória < 1GB com 1000 fotos

### 7. 📱 Responsividade
- [ ] Grid se ajusta ao redimensionar janela
- [ ] Sidebar colapsa em telas menores
- [ ] Viewer se adapta ao espaço disponível
- [ ] Toolbar permanece funcional

### 8. 🔧 Funcionalidades Core
- [ ] Importar pasta funciona
- [ ] Thumbnails são gerados
- [ ] Filtros funcionam
- [ ] Busca funciona
- [ ] Export ZIP funciona
- [ ] Coleções funcionam
- [ ] Favoritos funcionam

---

## 🐛 Bugs para Verificar

| Bug | Status | Como testar |
|-----|--------|-------------|
| Viewer no centro | ✅ Corrigido | Double-click em arquivo |
| CPU alta na indexação | ✅ Mitigado | Indexar pasta grande |
| App não abre (Gatekeeper) | ⚠️ Workaround | Instalar do DMG |

---

## ✅ Aprovação Final

- [ ] Todos os testes de atalhos passam
- [ ] Onboarding funciona
- [ ] Viewer lateral correto
- [ ] Controles de indexação funcionam
- [ ] Performance aceitável
- [ ] Nenhum bug crítico encontrado

**Testador:** _____________  
**Data:** _____________  
**Resultado:** [ ] APROVADO / [ ] REPROVADO

---

*Checklist v0.3.0 - 26/01/2026*
