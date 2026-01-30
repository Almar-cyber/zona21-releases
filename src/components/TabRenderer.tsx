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
import CompareTab from './tabs/CompareTab';
import ViewerTab from './tabs/ViewerTab';
// import BatchEditTab from './tabs/BatchEditTab';
// import InstagramTab from './tabs/InstagramTab';
// import ReviewTab from './tabs/ReviewTab';

interface TabRendererProps {
  tab: Tab;
  renderHomeTab?: () => ReactNode;
}

export default function TabRenderer({ tab, renderHomeTab }: TabRendererProps) {
  switch (tab.type) {
    case 'home':
      return renderHomeTab ? <>{renderHomeTab()}</> : <HomeTab />;

    case 'compare':
      return <CompareTab data={tab.data} tabId={tab.id} />;

    case 'viewer':
      return <ViewerTab data={tab.data} tabId={tab.id} />;

    // Sprint 4: BatchEditTab, InstagramTab
    // case 'batch-edit':
    //   return <BatchEditTab data={tab.data} tabId={tab.id} />;

    // case 'instagram':
    //   return <InstagramTab data={tab.data} tabId={tab.id} />;

    // case 'review':
    //   return <ReviewTab data={tab.data} tabId={tab.id} />;

    default:
      return (
        <div className="flex items-center justify-center h-full w-full bg-black/20">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              Tab não implementada
            </h2>
            <p className="text-sm text-gray-400">
              Tipo: {tab.type}
            </p>
          </div>
        </div>
      );
  }
}
