import EmptyStateUnified from './EmptyStateUnified.tsx';

interface EmptyStateProps {
  type: 'volume' | 'folder';
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  return (
    <EmptyStateUnified
      type={type}
      onAction={onAction}
    />
  );
}
