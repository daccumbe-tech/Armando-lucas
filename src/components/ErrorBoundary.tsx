import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorToFirestore } from '../logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error caught:', event.error);
    this.setState({ hasError: true, error: event.error });
    logErrorToFirestore({
      errorMessage: event.error?.message || 'Global error',
      errorStack: event.error?.stack,
      url: window.location.href,
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled rejection caught:', event.reason);
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.setState({ hasError: true, error });
    logErrorToFirestore({
      errorMessage: error.message || 'Unhandled rejection',
      errorStack: error.stack,
      url: window.location.href,
    });
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    logErrorToFirestore({
      errorMessage: error.message || 'Uncaught error',
      errorStack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      url: window.location.href,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Algo deu errado</h2>
            <p className="text-gray-500 mb-6">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Recarregar Página
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Ver detalhes técnicos</summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-[10px] overflow-auto max-h-40 text-gray-500">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
