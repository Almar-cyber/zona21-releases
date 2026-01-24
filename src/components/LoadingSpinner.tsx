import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-2',
  lg: 'h-16 w-16 border-3'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`animate-spin rounded-full border-b-blue-500 border-t-transparent ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {message && (
        <p className="mt-4 text-gray-400 text-sm text-center" aria-label={message}>
          {message}
        </p>
      )}
      <span className="sr-only">Carregando...</span>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, show }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        <LoadingSpinner message={message} size="lg" />
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-700 rounded ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
