/**
 * Kbd Component
 *
 * Componente para exibir teclas de atalho de forma estilizada
 */

import React from 'react';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Kbd({ children, className = '', size = 'md', ...props }: KbdProps) {
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
        bg-[rgba(var(--overlay-rgb),0.10)]
        border border-[var(--color-border-hover)]
        rounded
        shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
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
          {index > 0 && <span className="text-[var(--color-text-muted)] text-xs">{separator}</span>}
          <Kbd>{key}</Kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
