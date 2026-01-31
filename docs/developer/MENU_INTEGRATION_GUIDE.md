# Guia de Integração dos Menus Contextuais

Guia completo para integrar os menus contextuais nas tabs de arquivos.

## 📋 Visão Geral

Foram criados três componentes de menu para as tabs de arquivos:
1. **ViewerTabMenu** - File info & edit tools
2. **CompareTabMenu** - Asset list & compare controls
3. **BatchEditTabMenu** - Preview grid & operations

## ✅ Menus Criados

### 1. ViewerTabMenu
**Arquivo**: [src/components/ViewerTabMenu.tsx](src/components/ViewerTabMenu.tsx)

**Menu Esquerdo**:
- Thumbnail preview
- Detalhes do arquivo (formato, tamanho, dimensões, data)
- Caminho com botão "Revelar no Finder"
- Navegação (anterior, próximo, voltar para biblioteca)
- Arquivos relacionados (placeholder)

**Menu Direito**:
- **Zoom Controls**: Zoom in/out, Fit/100%, nível atual
- **Metadados**: Câmera, lente, ISO, abertura, velocidade, focal
- **Notas**: Textarea para anotações
- **Sugestões AI**: Smart rename
- **Ferramentas**: Quick Edit (E), Video Trim (V), Rotacionar
- **Marcação**: Favorito (F), Aprovado (A), Rejeitado (D)

### 2. CompareTabMenu
**Arquivo**: [src/components/CompareTabMenu.tsx](src/components/CompareTabMenu.tsx)

**Menu Esquerdo**:
- Lista de assets com thumbnails
- Indicador de painel ativo
- Status de decisão por asset
- Navegação de grupos (anterior/próximo)
- Resumo de decisões (aprovados, rejeitados, pendentes)
- Botão "Aplicar e Fechar"

**Menu Direito**:
- **Layout**: Selector de colunas (2/3/4) com preview visual
- **Zoom & Pan**: Controls + sync toggles
- **Marcação**: Aprovar (A), Rejeitar (D), Neutro (N)
- **Opções de View**: Toggle metadados e filename

### 3. BatchEditTabMenu
**Arquivo**: [src/components/BatchEditTabMenu.tsx](src/components/BatchEditTabMenu.tsx)

**Menu Esquerdo**:
- Grid de preview (8 thumbnails)
- Informações (total, operação, preset)
- Progresso (durante processamento)
- Resultados (após conclusão com tempo economizado)

**Menu Direito**:
- **Seletor de Operação**: Crop, Resize, Rotate, Flip
- **Presets**: Crop (1:1, 4:5, 16:9, 9:16), Resize (Instagram, Web, 4K, Thumbnail)
- **Direção**: Horizontal/Vertical (para Flip)
- **Ações**: Aplicar e Cancelar
- **Dicas**: Informações úteis

## 🔧 Como Integrar

### Passo 1: Importar o Menu

```typescript
// No topo do arquivo da tab
import { ViewerTabMenu } from '../ViewerTabMenu';
// ou
import { CompareTabMenu } from '../CompareTabMenu';
// ou
import { BatchEditTabMenu } from '../BatchEditTabMenu';
```

### Passo 2: Adicionar ao Layout

#### ViewerTab

```typescript
export default function ViewerTab({ data, tabId }: ViewerTabProps) {
  // ... existing state ...

  return (
    <>
      {/* Add menus */}
      <ViewerTabMenu
        asset={asset}
        zoom={zoom}
        fitMode={fitMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onJumpToLibrary={handleJumpToLibrary}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleFit={handleToggleFit}
        onToggleQuickEdit={handleToggleQuickEdit}
        onToggleVideoTrim={handleToggleVideoTrim}
        onRotate={handleRotate}
        onMarkFavorite={handleMarkFavorite}
        onMarkApproved={handleMarkApproved}
        onMarkRejected={handleMarkRejected}
        notes={notes}
        onNotesChange={handleNotesChange}
        smartNameSuggestion={smartNameSuggestion}
        onApplySmartName={handleApplySmartName}
      />

      {/* Existing viewer content */}
      <div className="flex-1 flex items-center justify-center">
        {/* ... preview content ... */}
      </div>
    </>
  );
}
```

#### CompareTab

```typescript
export default function CompareTab({ data, tabId }: CompareTabProps) {
  // ... existing state ...

  return (
    <>
      {/* Add menus */}
      <CompareTabMenu
        assets={assets}
        activePaneIndex={activePaneIndex}
        layout={layout}
        onSelectPane={setActivePaneIndex}
        onPreviousGroup={handlePreviousGroup}
        onNextGroup={handleNextGroup}
        currentGroup={currentGroup}
        totalGroups={totalGroups}
        onChangeLayout={setLayout}
        zoom={zoom}
        syncZoom={syncZoom}
        syncPan={syncPan}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleSyncZoom={handleToggleSyncZoom}
        onToggleSyncPan={handleToggleSyncPan}
        decisions={decisions}
        onMarkPane={handleMarkPane}
        onApplyDecisions={handleApplyDecisions}
        showMetadata={showMetadata}
        showFilename={showFilename}
        onToggleMetadata={handleToggleMetadata}
        onToggleFilename={handleToggleFilename}
      />

      {/* Existing compare grid */}
      <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${layout}, 1fr)` }}>
        {/* ... panes ... */}
      </div>
    </>
  );
}
```

#### BatchEditTab

```typescript
export default function BatchEditTab({ data, tabId }: BatchEditTabProps) {
  // ... existing state ...

  return (
    <>
      {/* Add menus */}
      <BatchEditTabMenu
        assets={assets}
        selectedOperation={selectedOperation}
        selectedPreset={selectedPreset}
        onSelectOperation={setSelectedOperation}
        onSelectPreset={setSelectedPreset}
        onApply={handleApply}
        onCancel={handleCancel}
        isProcessing={isProcessing}
        progress={progress}
        timeSaved={timeSaved}
      />

      {/* Existing content can be removed or simplified */}
      {/* Menus already show preview grid and operations */}
    </>
  );
}
```

### Passo 3: Remover UI Duplicado

Após integrar os menus, você pode remover:

**ViewerTab**:
- ✂️ Sidebar direita (30%) com metadados - agora no menu direito
- ✂️ Zoom controls do topo - agora no menu direito

**CompareTab**:
- ✂️ Toolbar com layout selector - agora no menu direito
- ✂️ Zoom controls - agora no menu direito

**BatchEditTab**:
- ✂️ Grid de preview (topo esquerdo) - agora no menu esquerdo
- ✂️ Operation selector (centro) - agora no menu direito
- ✂️ Preset grid - agora no menu direito

## 📱 Comportamento Mobile

Os menus já incluem suporte mobile:
- ✅ Auto-collapse em telas pequenas
- ✅ Full-width overlay quando abertos
- ✅ Swipe gestures para fechar
- ✅ Touch-friendly targets

## ⌨️ Keyboard Shortcuts

Os atalhos existentes continuam funcionando:
- `Cmd+\`: Toggle menu esquerdo
- `Cmd+/`: Toggle menu direito
- `E`, `V`, `A`, `D`, `F`, etc: Ações específicas da tab

## 🎨 Customização

### Adicionar Nova Seção

```typescript
<MenuSection
  title="Minha Seção"
  icon="star"
  collapsible
  defaultExpanded={false}
  storageKey="viewer-my-section"
>
  <div className="space-y-2">
    <MenuSectionItem
      icon="add"
      label="Minha Ação"
      onClick={handleMyAction}
    />
  </div>
</MenuSection>
```

### Customizar Largura Padrão

Edite `src/contexts/MenuContext.tsx`:

```typescript
const DEFAULT_WIDTHS: Record<TabType, MenuState> = {
  viewer: {
    left: { isCollapsed: false, width: 300 },  // Aumentar de 280
    right: { isCollapsed: false, width: 350 }  // Aumentar de 320
  },
  // ...
};
```

### Adicionar Novo Ícone Floating

```typescript
<ContextualMenu
  side="left"
  floatingIcon="my_custom_icon"  // Material icon name
  // ...
>
```

## 🧪 Testando

### Teste 1: Menu Toggle
1. Abrir ViewerTab
2. Pressionar `Cmd+\` - menu esquerdo deve toggle
3. Pressionar `Cmd+/` - menu direito deve toggle

### Teste 2: Resize
1. Abrir menu
2. Arrastar borda do menu
3. Verificar largura muda suavemente
4. Refresh page - verificar largura persiste

### Teste 3: Mobile
1. Redimensionar janela para < 768px
2. Menus devem estar collapsed
3. Abrir menu - deve ser full-width
4. Swipe para fechar - deve funcionar

### Teste 4: Persistence
1. Ajustar largura dos menus
2. Collapse alguns menus
3. Refresh page
4. Estado deve ser restaurado

## 🐛 Troubleshooting

### Menu não aparece
**Causa**: MenuProvider não está wrappando a aplicação
**Solução**: Verificar que `<MenuProvider>` está em `App.tsx`

### Largura não persiste
**Causa**: localStorage bloqueado
**Solução**: Verificar permissões do browser/Electron

### Swipe não funciona
**Causa**: Conflito com outros event handlers
**Solução**: Verificar se não há `stopPropagation` em elementos pais

### Menu sobrepõe conteúdo
**Causa**: Z-index incorreto
**Solução**: Menus usam `z-[110]`, ajustar z-index do conteúdo se necessário

## 📚 Recursos

### Componentes Base
- [MenuContext.tsx](src/contexts/MenuContext.tsx) - Estado global
- [ContextualMenu.tsx](src/components/ContextualMenu.tsx) - Menu base
- [MenuSection.tsx](src/components/MenuSection.tsx) - Seção reutilizável

### Documentação
- [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) - Todos os atalhos
- [PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md) - Performance tips
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Visão geral

### Utilitários
- [responsive.ts](src/utils/responsive.ts) - Hooks responsivos
- [useUnsavedChanges.ts](src/hooks/useUnsavedChanges.ts) - Unsaved warnings

## ✨ Próximos Passos

1. **Integrar menus nas tabs** (seguir exemplos acima)
2. **Testar workflows** completos
3. **Ajustar estilos** se necessário
4. **Remover UI duplicado** das tabs
5. **Testar mobile** em dispositivos reais
6. **Performance check** com DevTools

## 🎯 Checklist de Integração

### ViewerTab
- [ ] Import ViewerTabMenu
- [ ] Pass all required props
- [ ] Remove duplicate sidebar
- [ ] Test zoom controls
- [ ] Test navigation
- [ ] Test marking
- [ ] Test notes saving

### CompareTab
- [ ] Import CompareTabMenu
- [ ] Pass all required props
- [ ] Remove duplicate toolbar
- [ ] Test layout switching
- [ ] Test zoom sync
- [ ] Test marking workflow
- [ ] Test apply decisions

### BatchEditTab
- [ ] Import BatchEditTabMenu
- [ ] Pass all required props
- [ ] Remove duplicate UI
- [ ] Test all operations
- [ ] Test presets
- [ ] Test progress tracking
- [ ] Test results display

## 🤝 Contribuindo

Se encontrar bugs ou tiver sugestões:
1. Documente o comportamento esperado
2. Inclua screenshots se possível
3. Mencione qual menu está afetado
4. Descreva steps para reproduzir

---

**Criado**: 2026-01-30
**Versão**: 1.0.0
**Status**: ✅ Pronto para integração
