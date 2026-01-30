/**
 * TabContainer Component
 *
 * Canvas para renderização de tabs
 *
 * Estratégia:
 * - Render all tabs, hide inactive com display: none
 * - Preserva estado entre switches (zoom, scroll, form data)
 * - Trade-off: Maior memória vs. UX superior
 */

import { ReactNode } from 'react';
import { useTabs } from '../contexts/TabsContext';
import TabRenderer from './TabRenderer';

interface TabContainerProps {
  renderHomeTab?: () => ReactNode;
}

export default function TabContainer({ renderHomeTab }: TabContainerProps) {
  const { tabs, activeTabId } = useTabs();

  return (
    <div className="flex-1 relative overflow-hidden">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className="absolute inset-0"
          style={{
            display: tab.id === activeTabId ? 'flex' : 'none'
          }}
        >
          <TabRenderer tab={tab} renderHomeTab={renderHomeTab} />
        </div>
      ))}
    </div>
  );
}
