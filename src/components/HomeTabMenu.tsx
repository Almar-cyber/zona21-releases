/**
 * HomeTabMenu - Menus contextuais para Home Tab
 *
 * Left Menu: Navigation (volumes, folders, collections)
 * Right Menu: Actions (file operations, AI features, bulk actions)
 */

import React from 'react';
import { ContextualMenu } from './ContextualMenu';
import { MenuSection, MenuSectionItem } from './MenuSection';
import { useMenu } from '../contexts/MenuContext';
import { useTabs } from '../contexts/TabsContext';

// ============================================================================
// Types
// ============================================================================

interface HomeTabMenuProps {
  // Left menu props (navigation)
  sidebarContent?: React.ReactNode; // Can pass existing Sidebar as content

  // Right menu props (actions)
  hasSelection?: boolean;
  selectionCount?: number;
  onSelectAll?: () => void;
  onExport?: (format: 'xml' | 'xmp' | 'zip') => void;
  onMoveToCollection?: () => void;
  onInstagramScheduler?: () => void;
  onDelete?: () => void;
  onIndexDirectory?: () => void;
  onScanDuplicates?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function HomeTabMenu({
  sidebarContent,
  hasSelection = false,
  selectionCount = 0,
  onSelectAll,
  onExport,
  onMoveToCollection,
  onInstagramScheduler,
  onDelete,
  onIndexDirectory,
  onScanDuplicates
}: HomeTabMenuProps) {
  const { getMenuState, toggleMenu, setMenuWidth } = useMenu();
  const { getTabByType } = useTabs();

  const homeTab = getTabByType('home');
  const tabType = 'home';
  const menuState = getMenuState(tabType);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleToggleLeft = () => toggleMenu(tabType, 'left');
  const handleToggleRight = () => toggleMenu(tabType, 'right');

  const handleLeftWidthChange = (width: number) => {
    setMenuWidth(tabType, 'left', width);
  };

  const handleRightWidthChange = (width: number) => {
    setMenuWidth(tabType, 'right', width);
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      {/* Left Menu - Navigation */}
      <ContextualMenu
        side="left"
        isCollapsed={menuState.left.isCollapsed}
        onToggleCollapse={handleToggleLeft}
        width={menuState.left.width}
        onWidthChange={handleLeftWidthChange}
        floatingIcon="folder"
      >
        {/* For now, render sidebar content passed as prop */}
        {/* In the future, we can migrate Sidebar content here directly */}
        {sidebarContent || (
          <div className="p-4">
            <p className="text-sm text-white/50">
              Navigation content will be migrated from Sidebar
            </p>
          </div>
        )}
      </ContextualMenu>

      {/* Right Menu - Actions */}
      <ContextualMenu
        side="right"
        isCollapsed={menuState.right.isCollapsed}
        onToggleCollapse={handleToggleRight}
        width={menuState.right.width}
        onWidthChange={handleRightWidthChange}
        floatingIcon="tune"
      >
        {/* File Operations Section */}
        <MenuSection
          title="File Operations"
          icon="folder_open"
          collapsible
          defaultExpanded
          storageKey="home-file-operations"
        >
          <div className="space-y-1">
            <MenuSectionItem
              icon="create_new_folder"
              label="Add Folder/Volume"
              onClick={onIndexDirectory}
            />
            <MenuSectionItem
              icon="sync"
              label="Index Directory"
              onClick={onIndexDirectory}
            />
            <MenuSectionItem
              icon="content_copy"
              label="Scan for Duplicates"
              onClick={onScanDuplicates}
            />
          </div>
        </MenuSection>

        {/* Bulk Actions Section (conditional) */}
        {hasSelection && (
          <MenuSection
            title={`Bulk Actions (${selectionCount})`}
            icon="checklist"
            collapsible
            defaultExpanded
            storageKey="home-bulk-actions"
          >
            <div className="space-y-1">
              <MenuSectionItem
                icon="select_all"
                label="Select All"
                onClick={onSelectAll}
              />

              {/* Export submenu */}
              <div className="mt-2 mb-2">
                <div className="text-xs text-white/50 mb-1 px-3">Export</div>
                <MenuSectionItem
                  icon="description"
                  label="XML (Premiere)"
                  onClick={() => onExport?.('xml')}
                />
                <MenuSectionItem
                  icon="description"
                  label="XMP (Lightroom)"
                  onClick={() => onExport?.('xmp')}
                />
                <MenuSectionItem
                  icon="folder_zip"
                  label="ZIP Archive"
                  onClick={() => onExport?.('zip')}
                />
              </div>

              <MenuSectionItem
                icon="collections"
                label="Move to Collection"
                onClick={onMoveToCollection}
              />
              <MenuSectionItem
                icon="photo_camera"
                label="Instagram Scheduler"
                onClick={onInstagramScheduler}
              />
              <MenuSectionItem
                icon="delete"
                label="Delete"
                onClick={onDelete}
              />
            </div>
          </MenuSection>
        )}

        {/* Info Section */}
        {!hasSelection && (
          <div className="p-4 text-xs text-white/30 text-center">
            Select assets to see bulk actions
          </div>
        )}
      </ContextualMenu>
    </>
  );
}
