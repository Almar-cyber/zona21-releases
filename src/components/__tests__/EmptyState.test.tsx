import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';

// Mock Icon and Kbd components
vi.mock('../Icon.tsx', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock('../Kbd', () => ({
  Kbd: ({ children }: { children: React.ReactNode }) => <kbd>{children}</kbd>,
}));

describe('EmptyState', () => {
  it('renders volume empty state', () => {
    render(<EmptyState type="volume" />);

    expect(screen.getByText(/Nenhum volume selecionado/i)).toBeInTheDocument();
  });

  it('renders folder empty state', () => {
    render(<EmptyState type="folder" />);

    expect(screen.getByText(/Nenhuma pasta selecionada/i)).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const onAction = vi.fn();
    render(<EmptyState type="volume" onAction={onAction} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders button text when onAction is provided', () => {
    const onAction = vi.fn();
    render(<EmptyState type="volume" onAction={onAction} />);

    // The component renders "Adicionar Pasta" for type="volume"
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Adicionar Pasta');
  });
});
