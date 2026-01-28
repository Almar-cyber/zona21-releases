/**
 * Kbd Component
 *
 * Componente para exibir teclas de atalho de forma estilizada
 */

import React from 'react';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Kbd({ children, className = '', size = 'md' }: KbdProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-2 text-sm'
  };

  return (
    <kbd
      className={`
        inline-flex items-center justify-center
        font-mono font-semibold
        bg-white/10
        border border-white/20
        rounded
        shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </kbd>
  );
}

// Variant: Multiple keys (for combos like Cmd+K)
interface KbdComboProps {
  keys: string[];
  separator?: string;
  className?: string;
}

export function KbdCombo({ keys, separator = '+', className = '' }: KbdComboProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-gray-500 text-xs">{separator}</span>}
          <Kbd>{key}</Kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
