import { useState } from 'react';
import Icon from './Icon.tsx';
import logoFullDark from '../assets/logotipo-white.png';
import logoFullLight from '../assets/logotipo.png';
import { useTheme } from '../contexts/ThemeContext';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileSidebar({ isOpen, onClose, children }: MobileSidebarProps) {
  const { resolvedTheme } = useTheme();
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-[60] h-full w-80 bg-[var(--color-background)]/95 backdrop-blur-xl border-r border-[var(--color-border)] transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="w-24">
            <img src={resolvedTheme === 'light' ? logoFullLight : logoFullDark} alt="Zona21" className="w-full h-auto object-contain opacity-80" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-medium)] rounded-lg transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          <div>Feito com ❤️ por Almar.</div>
          <div>© 2026 Almar. Todos os direitos reservados.</div>
        </div>
      </div>
    </>
  );
}
