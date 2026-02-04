import React from 'react';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      return (
        <div className="h-screen w-screen bg-[#121124] text-gray-100 flex items-center justify-center p-6">
          <div className="mh-popover max-w-xl w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-8 h-8 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-lg font-semibold">Algo deu errado</div>
            </div>

            <div className="text-sm text-gray-300 mb-4">
              Ocorreu um erro inesperado na aplicação. Você pode tentar novamente ou recarregar a página.
            </div>

            {error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                  Detalhes técnicos
                </summary>
                <div className="bg-black/30 rounded-lg p-3 text-xs font-mono text-red-400 overflow-auto max-h-40">
                  <div className="font-semibold mb-1">{error.name}</div>
                  <div className="text-gray-400">{error.message}</div>
                  {error.stack && (
                    <pre className="mt-2 text-gray-500 text-[10px] overflow-x-auto whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                className="mh-btn mh-btn-indigo flex-1 px-4 py-2 text-sm"
                onClick={this.handleReset}
              >
                Tentar Novamente
              </button>
              <button
                type="button"
                className="mh-btn mh-btn-gray flex-1 px-4 py-2 text-sm"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
