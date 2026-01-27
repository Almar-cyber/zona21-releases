import { useState } from 'react';
import Icon from './Icon.tsx';
import logoFull from '../assets/logotipo-white.png';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileSidebar({ isOpen, onClose, children }: MobileSidebarProps) {
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
        fixed top-0 left-0 z-[60] h-full w-80 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="w-24">
            <img src={logoFull} alt="Zona21" className="w-full h-auto object-contain opacity-80" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          <div>Feito com ❤️ por Almar.</div>
          <div>© 2026 Zona21. Todos os direitos reservados.</div>
        </div>
      </div>
    </>
  );
}
