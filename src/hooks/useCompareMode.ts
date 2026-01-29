import { useState, useCallback, useMemo } from 'react';
import { Asset, MarkingStatus } from '../shared/types';

export type CompareLayout = 2 | 3 | 4;

export interface CompareDecision {
  assetId: string;
  decision: MarkingStatus;
}

export interface UseCompareModeReturn {
  // Current state
  currentGroup: Asset[];
  currentGroupIndex: number;
  totalGroups: number;
  layout: CompareLayout;
  activePaneIndex: number;
  decisions: CompareDecision[];

  // Navigation
  nextGroup: () => void;
  previousGroup: () => void;
  goToGroup: (index: number) => void;

  // Layout
  setLayout: (layout: CompareLayout) => void;

  // Pane selection
  setActivePane: (index: number) => void;

  // Decisions
  markActivePane: (decision: MarkingStatus) => void;
  markAsset: (assetId: string, decision: MarkingStatus) => void;
  getDecision: (assetId: string) => MarkingStatus | undefined;

  // Utilities
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function useCompareMode(assets: Asset[], initialLayout: CompareLayout = 2): UseCompareModeReturn {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [layout, setLayout] = useState<CompareLayout>(initialLayout);
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const [decisions, setDecisions] = useState<CompareDecision[]>([]);

  // Split assets into groups based on layout
  const groups = useMemo(() => {
    const result: Asset[][] = [];
    for (let i = 0; i < assets.length; i += layout) {
      result.push(assets.slice(i, i + layout));
    }
    return result;
  }, [assets, layout]);

  const currentGroup = groups[currentGroupIndex] || [];
  const totalGroups = groups.length;

  const nextGroup = useCallback(() => {
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setActivePaneIndex(0); // Reset active pane when changing groups
    }
  }, [currentGroupIndex, totalGroups]);

  const previousGroup = useCallback(() => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
      setActivePaneIndex(0); // Reset active pane when changing groups
    }
  }, [currentGroupIndex]);

  const goToGroup = useCallback((index: number) => {
    if (index >= 0 && index < totalGroups) {
      setCurrentGroupIndex(index);
      setActivePaneIndex(0);
    }
  }, [totalGroups]);

  const handleSetLayout = useCallback((newLayout: CompareLayout) => {
    setLayout(newLayout);
    setCurrentGroupIndex(0); // Reset to first group when layout changes
    setActivePaneIndex(0);
  }, []);

  const handleSetActivePane = useCallback((index: number) => {
    if (index >= 0 && index < currentGroup.length) {
      setActivePaneIndex(index);
    }
  }, [currentGroup.length]);

  const markActivePane = useCallback((decision: MarkingStatus) => {
    const asset = currentGroup[activePaneIndex];
    if (!asset) return;

    setDecisions((prev) => {
      const existing = prev.find((d) => d.assetId === asset.id);
      if (existing) {
        return prev.map((d) =>
          d.assetId === asset.id ? { ...d, decision } : d
        );
      }
      return [...prev, { assetId: asset.id, decision }];
    });
  }, [currentGroup, activePaneIndex]);

  const markAsset = useCallback((assetId: string, decision: MarkingStatus) => {
    setDecisions((prev) => {
      const existing = prev.find((d) => d.assetId === assetId);
      if (existing) {
        return prev.map((d) =>
          d.assetId === assetId ? { ...d, decision } : d
        );
      }
      return [...prev, { assetId, decision }];
    });
  }, []);

  const getDecision = useCallback((assetId: string): MarkingStatus | undefined => {
    return decisions.find((d) => d.assetId === assetId)?.decision;
  }, [decisions]);

  const canGoNext = currentGroupIndex < totalGroups - 1;
  const canGoPrevious = currentGroupIndex > 0;

  return {
    currentGroup,
    currentGroupIndex,
    totalGroups,
    layout,
    activePaneIndex,
    decisions,
    nextGroup,
    previousGroup,
    goToGroup,
    setLayout: handleSetLayout,
    setActivePane: handleSetActivePane,
    markActivePane,
    markAsset,
    getDecision,
    canGoNext,
    canGoPrevious,
  };
}
