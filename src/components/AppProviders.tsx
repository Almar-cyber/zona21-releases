import React from 'react';
import { AssetsProvider } from '../contexts/AssetsContext';
import { FiltersProvider } from '../contexts/FiltersContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Centraliza todos os providers da aplicação
 * Facilita manutenção e testes
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <FiltersProvider>
      <AssetsProvider>
        {children}
      </AssetsProvider>
    </FiltersProvider>
  );
}
