/**
 * AssetContextMenu Component
 *
 * Right-click context menu for assets in the grid.
 * Follows the pattern from Sidebar.tsx (volumeMenu).
 *
 * Actions:
 * - Open in Viewer (Enter)
 * - Add to Selection (⌘Click)
 * - Approve (A), Favorite (P), Reject (D)
 * - Smart Rename (AI)
 * - Export submenu (XML, XMP, ZIP)
 * - Add to Collection
 * - Instagram Scheduler
 * - Delete (⌫)
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { Kbd } from './Kbd';
import { Asset } from '../shared/types';

export interface AssetContextMenuPosition {
  x: number;
  y: number;
}

export interface AssetContextMenuProps {
  asset: Asset;
  position: { x: number; y: number };
  isInTray: boolean;
  onClose: () => void;
  onOpenViewer: (asset: Asset) => void;
  onToggleSelection: (assetId: string) => void;
  onMarkApprove: (assetId: string) => void;
  onMarkFavorite: (assetId: string) => void;
  onMarkReject: (assetId: string) => void;
  onExportXML?: (assetIds: string[]) => void;
  onExportXMP?: (assetIds: string[]) => void;
  onExportZIP?: (assetIds: string[]) => void;
  onAddToCollection?: (assetIds: string[]) => void;
  onOpenInstagram?: (assetIds: string[]) => void;
  onDelete: (assetIds: string[]) => void;
}

interface MenuItemProps {
  icon?: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, shortcut, onClick, disabled, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors
        ${danger
          ? 'text-red-400 hover:bg-red-500/10'
          : disabled
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-gray-200 hover:bg-white/5'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} size={16} className={danger ? 'text-red-400' : 'text-gray-400'} />}
        <span>{label}</span>
      </div>
      {shortcut && <Kbd size="sm">{shortcut}</Kbd>}
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-white/10" />;
}

interface SubMenuProps {
  icon?: string;
  label: string;
  children: React.ReactNode;
}

function SubMenu({ icon, label, children }: SubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close submenu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} size={16} className="text-gray-400" />}
          <span>{label}</span>
        </div>
        <Icon name="chevron_right" size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute left-full top-0 ml-1 w-40 mh-menu shadow-xl z-10"
          onMouseLeave={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function AssetContextMenu({
  asset,
  position,
  isInTray,
  onClose,
  onOpenViewer,
  onToggleSelection,
  onMarkApprove,
  onMarkFavorite,
  onMarkReject,
  onExportXML,
  onExportXMP,
  onExportZIP,
  onAddToCollection,
  onOpenInstagram,
  onDelete,
}: AssetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position to keep menu in viewport
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position if overflowing right
    if (x + rect.width > viewportWidth - 8) {
      x = viewportWidth - rect.width - 8;
    }

    // Adjust vertical position if overflowing bottom
    if (y + rect.height > viewportHeight - 8) {
      y = viewportHeight - rect.height - 8;
    }

    // Ensure minimum position
    x = Math.max(8, x);
    y = Math.max(8, y);

    setAdjustedPosition({ x, y });
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Small delay to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const markingStatus = asset.markingStatus || 'unmarked';

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] w-52 mh-menu shadow-2xl py-1"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {/* Open in Viewer */}
      <MenuItem
        icon="visibility"
        label="Abrir no Viewer"
        shortcut="Enter"
        onClick={() => {
          onOpenViewer(asset);
          onClose();
        }}
      />

      <MenuDivider />

      {/* Selection */}
      <MenuItem
        icon={isInTray ? 'check_box' : 'check_box_outline_blank'}
        label={isInTray ? 'Remover da Seleção' : 'Adicionar à Seleção'}
        shortcut="⌘Click"
        onClick={() => {
          onToggleSelection(asset.id);
          onClose();
        }}
      />

      <MenuDivider />

      {/* Marking */}
      <MenuItem
        icon="check"
        label={markingStatus === 'approved' ? 'Desmarcar Aprovação' : 'Aprovar'}
        shortcut="A"
        onClick={() => {
          onMarkApprove(asset.id);
          onClose();
        }}
      />
      <MenuItem
        icon="star"
        label={markingStatus === 'favorite' ? 'Desmarcar Favorito' : 'Favoritar'}
        shortcut="P"
        onClick={() => {
          onMarkFavorite(asset.id);
          onClose();
        }}
      />
      <MenuItem
        icon="close"
        label={markingStatus === 'rejected' ? 'Desmarcar Rejeição' : 'Rejeitar'}
        shortcut="D"
        onClick={() => {
          onMarkReject(asset.id);
          onClose();
        }}
      />

      {/* Export submenu */}
      {(onExportXML || onExportXMP || onExportZIP) && (
        <SubMenu icon="ios_share" label="Exportar">
          {onExportXML && (
            <MenuItem
              label="XML (Premiere)"
              onClick={() => {
                onExportXML([asset.id]);
                onClose();
              }}
            />
          )}
          {onExportXMP && (
            <MenuItem
              label="XMP (Lightroom)"
              onClick={() => {
                onExportXMP([asset.id]);
                onClose();
              }}
            />
          )}
          {onExportZIP && (
            <MenuItem
              label="ZIP"
              onClick={() => {
                onExportZIP([asset.id]);
                onClose();
              }}
            />
          )}
        </SubMenu>
      )}

      <MenuDivider />

      {/* Collection */}
      {onAddToCollection && (
        <MenuItem
          icon="playlist_add"
          label="Adicionar à Coleção..."
          onClick={() => {
            onAddToCollection([asset.id]);
            onClose();
          }}
        />
      )}

      {/* Instagram */}
      {onOpenInstagram && (
        <MenuItem
          icon="photo_camera"
          label="Instagram Scheduler"
          onClick={() => {
            onOpenInstagram([asset.id]);
            onClose();
          }}
        />
      )}

      <MenuDivider />

      {/* Delete */}
      <MenuItem
        icon="delete"
        label="Excluir"
        shortcut="⌫"
        danger
        onClick={() => {
          onDelete([asset.id]);
          onClose();
        }}
      />
    </div>,
    document.body
  );
}
