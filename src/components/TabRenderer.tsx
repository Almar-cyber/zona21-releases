/**
 * TabRenderer Component
 *
 * Router de tabs - renderiza o componente correto baseado no tipo da tab
 *
 * Cada tab recebe:
 * - data: Estado específico da tab
 * - tabId: ID para updates via updateTab()
 */

import { ReactNode } from 'react';
import { Tab } from '../contexts/TabsContext';
import HomeTab from './tabs/HomeTab';
import ViewerTab from './tabs/ViewerTab';
// import ReviewTab from './tabs/ReviewTab';

interface TabRendererProps {
  tab: Tab;
  renderHomeTab?: () => ReactNode;
}

export default function TabRenderer({ tab, renderHomeTab }: TabRendererProps) {
  switch (tab.type) {
    case 'home':
      return renderHomeTab ? <>{renderHomeTab()}</> : <HomeTab />;

    case 'viewer':
      return <ViewerTab data={tab.data} tabId={tab.id} />;

    // case 'review':
    //   return <ReviewTab data={tab.data} tabId={tab.id} />;

    default:
      return (
        <div className="flex items-center justify-center h-full w-full bg-[var(--color-overlay-light)]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Tab não implementada
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Tipo: {tab.type}
            </p>
          </div>
        </div>
      );
  }
}
