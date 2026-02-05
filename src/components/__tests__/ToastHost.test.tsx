import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastHost, { Toast } from '../ToastHost';

describe('ToastHost', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
  });

  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastHost toasts={[]} onDismiss={mockOnDismiss} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a success toast', () => {
    const toasts: Toast[] = [
      { id: '1', type: 'success', message: 'Operação concluída' },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Operação concluída')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an error toast with alert role', () => {
    const toasts: Toast[] = [
      { id: '1', type: 'error', message: 'Erro na operação' },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Erro na operação')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders an info toast', () => {
    const toasts: Toast[] = [
      { id: '1', type: 'info', message: 'Informação importante' },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Informação importante')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    const toasts: Toast[] = [
      { id: '1', type: 'success', message: 'Toast 1' },
      { id: '2', type: 'error', message: 'Toast 2' },
      { id: '3', type: 'info', message: 'Toast 3' },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const toasts: Toast[] = [
      { id: 'test-id', type: 'success', message: 'Test toast' },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByRole('button', { name: /Dispensar notificação/i });
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('test-id');
  });

  it('renders toast actions when provided', () => {
    const mockAction = vi.fn();
    const toasts: Toast[] = [
      {
        id: '1',
        type: 'info',
        message: 'Toast with action',
        actions: [{ label: 'Undo', onClick: mockAction }],
      },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    const actionButton = screen.getByRole('button', { name: 'Undo' });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalled();
    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });

  it('renders multiple actions', () => {
    const toasts: Toast[] = [
      {
        id: '1',
        type: 'info',
        message: 'Toast with multiple actions',
        actions: [
          { label: 'Action 1', onClick: vi.fn() },
          { label: 'Action 2', onClick: vi.fn() },
        ],
      },
    ];

    render(<ToastHost toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
  });
});
