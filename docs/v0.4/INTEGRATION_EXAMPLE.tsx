/**
 * EXEMPLO DE INTEGRAÇÃO - Growth Design Features
 *
 * Este arquivo mostra exemplos práticos de como integrar os novos
 * componentes de onboarding no Zona21.
 *
 * NÃO EXECUTAR - Apenas referência!
 */

// ============================================================================
// EXEMPLO 1: Integração no App.tsx
// ============================================================================

import MilestoneModal from './components/MilestoneModal';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <MainContent />
      <Viewer />

      {/* Adicionar no final */}
      <MilestoneModal />
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Sidebar com Checklist
// ============================================================================

import FirstUseChecklist from './components/FirstUseChecklist';
import { useChecklist } from './hooks/useOnboarding';

function Sidebar() {
  const { isComplete } = useChecklist();

  return (
    <aside className="mh-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <Logo />
      </div>

      {/* Checklist - só mostra se não completou */}
      {!isComplete && (
        <div className="px-3 mb-4">
          <FirstUseChecklist />
        </div>
      )}

      {/* Volumes */}
      <div className="sidebar-volumes">
        <h3>Volumes</h3>
        {/* ... */}
      </div>

      {/* Collections */}
      <div className="sidebar-collections">
        <h3>Coleções</h3>
        {/* ... */}
      </div>
    </aside>
  );
}

// ============================================================================
// EXEMPLO 3: Tracking de Marcação de Fotos
// ============================================================================

import { useOnboarding } from './hooks/useOnboarding';
import { useCallback } from 'react';

function useAssetMarking() {
  const { trackEvent, updateChecklistItem, stats } = useOnboarding();

  const markAsset = useCallback((assetId: string, status: 'approved' | 'favorited' | 'rejected', usedKeyboard: boolean) => {
    // Lógica existente de marcação
    // ... atualizar database, state, etc ...

    // Tracking de eventos
    trackEvent(`asset-${status}`);

    // Tracking de input method
    if (usedKeyboard) {
      trackEvent('keyboard-shortcut-used');
    } else {
      trackEvent('mouse-click-used');
    }

    // Atualizar checklist
    if (stats.photosMarked + 1 >= 5) {
      updateChecklistItem('mark-5-photos', true);
    }

    if (usedKeyboard && stats.keyboardUsageCount + 1 > 0) {
      updateChecklistItem('use-keyboard', true);
    }
  }, [trackEvent, updateChecklistItem, stats]);

  return { markAsset };
}

// Uso no componente:
function AssetCard({ asset }) {
  const { markAsset } = useAssetMarking();

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'A') {
      markAsset(asset.id, 'approved', true);
    } else if (e.key === 'f' || e.key === 'F') {
      markAsset(asset.id, 'favorited', true);
    } else if (e.key === 'd' || e.key === 'D') {
      markAsset(asset.id, 'rejected', true);
    }
  };

  const handleClick = (status: string) => {
    markAsset(asset.id, status as any, false);
  };

  return (
    <div onKeyDown={handleKeyPress} tabIndex={0}>
      <img src={asset.thumbnail} />
      <div className="actions">
        <button onClick={() => handleClick('approved')}>✓</button>
        <button onClick={() => handleClick('favorited')}>★</button>
        <button onClick={() => handleClick('rejected')}>✗</button>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: Empty States Inteligentes
// ============================================================================

import EmptyStateUnified from './components/EmptyStateUnified';

function CollectionView({ collection, assets }) {
  const handleAddToCollection = () => {
    // Abrir modal de seleção ou mostrar hint
  };

  // Empty state se não há assets
  if (assets.length === 0) {
    // Biblioteca totalmente vazia
    if (collection.id === 'library' && !hasAnyAssets) {
      return (
        <EmptyStateUnified
          type="library-empty"
          onAction={handleImportFolder}
        />
      );
    }

    // Coleção de aprovadas vazia
    if (collection.id === 'approved') {
      return <EmptyStateUnified type="no-approved" />;
    }

    // Coleção de favoritas vazia
    if (collection.id === 'favorites') {
      return <EmptyStateUnified type="no-favorites" />;
    }

    // Coleção custom vazia
    return (
      <EmptyStateUnified
        type="collection"
        title={`Coleção "${collection.name}" vazia`}
        onAction={handleAddToCollection}
      />
    );
  }

  return (
    <div className="asset-grid">
      {assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
    </div>
  );
}

// ============================================================================
// EXEMPLO 5: Tooltips Contextuais
// ============================================================================

import SmartTooltip, { SmartTooltipWithShortcut, ProTipTooltip } from './components/SmartTooltip';
import { useOnboarding } from './hooks/useOnboarding';
import { useState, useEffect } from 'react';

function LibraryGrid({ assets }) {
  const { stats } = useOnboarding();
  const [consecutiveMouseClicks, setConsecutiveMouseClicks] = useState(0);

  // Detectar se usuário está usando mouse demais
  useEffect(() => {
    const total = stats.keyboardUsageCount + stats.mouseUsageCount;
    const keyboardRate = total > 0 ? stats.keyboardUsageCount / total : 0;

    if (total > 5 && keyboardRate < 0.3) {
      setConsecutiveMouseClicks(prev => prev + 1);
    }
  }, [stats]);

  return (
    <div className="library-grid-container">
      {/* Pro Tip: Aparecer após 3 cliques consecutivos de mouse */}
      {consecutiveMouseClicks >= 3 && (
        <ProTipTooltip
          id="keyboard-is-faster"
          tip="Use A para aprovar, F para favoritar e D para rejeitar - é muito mais rápido!"
          trigger="auto"
          autoDelay={1000}
          dismissible={true}
        >
          <div className="library-grid">
            {assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </ProTipTooltip>
      )}

      {/* Grid normal */}
      {consecutiveMouseClicks < 3 && (
        <div className="library-grid">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tooltip simples em botões
function SmartCullingButton({ hasBurst }) {
  return (
    <SmartTooltipWithShortcut
      id="smart-culling-btn"
      content="Encontrar melhores fotos de sequências"
      shortcut="⌘⇧C"
      showOnce={false}
      disabled={!hasBurst}
    >
      <button
        className="toolbar-button"
        disabled={!hasBurst}
      >
        <Sparkles />
        Smart Culling
      </button>
    </SmartTooltipWithShortcut>
  );
}

// ============================================================================
// EXEMPLO 6: Tracking de Features de IA
// ============================================================================

import { useOnboarding } from './hooks/useOnboarding';

function SmartCullingModal({ assets }) {
  const { trackEvent, updateChecklistItem } = useOnboarding();

  const handleStartCulling = async () => {
    // Tracking
    trackEvent('smart-culling-used');
    updateChecklistItem('try-smart-culling', true);

    // Lógica de smart culling
    const results = await analyzeBurst(assets);
    showResults(results);
  };

  return (
    <div className="modal">
      <h2>Smart Culling</h2>
      <p>{assets.length} fotos detectadas em sequência</p>
      <button onClick={handleStartCulling}>
        Analisar com IA
      </button>
    </div>
  );
}

function FindSimilarButton({ asset }) {
  const { trackEvent, updateChecklistItem } = useOnboarding();

  const handleFindSimilar = () => {
    trackEvent('find-similar-used');
    updateChecklistItem('find-similar', true);

    // Lógica de find similar
    findSimilarAssets(asset.id);
  };

  return (
    <button onClick={handleFindSimilar}>
      Encontrar Similares
    </button>
  );
}

function SmartRenameAction({ selectedAssets }) {
  const { trackEvent, updateChecklistItem } = useOnboarding();

  const handleSmartRename = async () => {
    trackEvent('smart-rename-used');
    updateChecklistItem('smart-rename', true);

    // Lógica de smart rename
    await renameAssets(selectedAssets);
  };

  return (
    <button onClick={handleSmartRename}>
      Smart Rename
    </button>
  );
}

// ============================================================================
// EXEMPLO 7: Detectar Burst e Mostrar Tooltip
// ============================================================================

import { SmartTooltipRich } from './components/SmartTooltip';

function AssetGridWithBurstDetection({ assets }) {
  const [burstGroups, setBurstGroups] = useState([]);

  useEffect(() => {
    // Detectar bursts (fotos em sequência rápida)
    const groups = detectBurstGroups(assets);
    setBurstGroups(groups);
  }, [assets]);

  const hasBurst = burstGroups.length > 0 && burstGroups.some(g => g.length >= 5);

  return (
    <div className="asset-grid-wrapper">
      {hasBurst && (
        <SmartTooltipRich
          id="burst-detected"
          title="Sequência detectada 📸"
          description={`${burstGroups[0].length} fotos em sequência. Smart Culling pode encontrar as melhores automaticamente.`}
          icon={<Sparkles className="w-4 h-4 text-purple-400" />}
          action={{
            label: 'Experimentar Smart Culling',
            onClick: () => openSmartCulling(burstGroups[0])
          }}
          trigger="auto"
          autoDelay={3000}
          showOnce={true}
          position="bottom"
        >
          <div className="asset-grid">
            {assets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isBurst={burstGroups.some(g => g.includes(asset.id))}
              />
            ))}
          </div>
        </SmartTooltipRich>
      )}

      {!hasBurst && (
        <div className="asset-grid">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

// Função helper para detectar bursts
function detectBurstGroups(assets) {
  const sorted = [...assets].sort((a, b) => a.timestamp - b.timestamp);
  const groups = [];
  let currentGroup = [];

  sorted.forEach((asset, i) => {
    if (i === 0) {
      currentGroup.push(asset.id);
      return;
    }

    const prevAsset = sorted[i - 1];
    const timeDiff = asset.timestamp - prevAsset.timestamp;

    // Se diferença < 2 segundos, é burst
    if (timeDiff < 2000) {
      currentGroup.push(asset.id);
    } else {
      if (currentGroup.length >= 3) {
        groups.push([...currentGroup]);
      }
      currentGroup = [asset.id];
    }
  });

  if (currentGroup.length >= 3) {
    groups.push(currentGroup);
  }

  return groups;
}

// ============================================================================
// EXEMPLO 8: Dashboard de Estatísticas (Futuro)
// ============================================================================

import { useOnboarding } from './hooks/useOnboarding';

function ProductivityDashboard() {
  const { stats, insights } = useOnboarding();

  const totalMarked = stats.photosMarked;
  const approvalRate = totalMarked > 0
    ? Math.round((stats.photosApproved / totalMarked) * 100)
    : 0;

  const totalInputs = stats.keyboardUsageCount + stats.mouseUsageCount;
  const keyboardRate = totalInputs > 0
    ? Math.round((stats.keyboardUsageCount / totalInputs) * 100)
    : 0;

  return (
    <div className="dashboard">
      <h2>Sua Produtividade</h2>

      <div className="stats-grid">
        <StatCard
          label="Fotos Marcadas"
          value={totalMarked}
          icon="📸"
        />
        <StatCard
          label="Taxa de Aprovação"
          value={`${approvalRate}%`}
          icon="✓"
        />
        <StatCard
          label="Uso de Teclado"
          value={`${keyboardRate}%`}
          icon="⌨️"
        />
        <StatCard
          label="Tempo no App"
          value={formatTime(stats.totalTimeActive)}
          icon="⏱️"
        />
      </div>

      <div className="insights">
        <h3>Insights</h3>
        {insights.map((insight, i) => (
          <div key={i} className="insight-card">
            💡 {insight}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

// ============================================================================
// EXEMPLO 9: Integração com Preferences
// ============================================================================

function PreferencesModal() {
  const { stats } = useOnboarding();

  return (
    <div className="preferences">
      <div className="preference-section">
        <h3>IA</h3>
        {/* ... AI settings ... */}
      </div>

      <div className="preference-section">
        <h3>Estatísticas</h3>
        <p>Fotos marcadas: {stats.photosMarked}</p>
        <p>Sessões: {stats.sessionCount}</p>
        <p>Tempo total: {formatTime(stats.totalTimeActive)}</p>

        <button onClick={() => onboardingService.reset()}>
          Resetar Tutorial
        </button>
      </div>
    </div>
  );
}

export {};
