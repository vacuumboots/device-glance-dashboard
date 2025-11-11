import React from 'react';
import logger from '../logging/logger';

type FallbackRender = (error: Error, info?: React.ErrorInfo) => React.ReactNode;

export interface ErrorBoundaryProps {
  fallback?: React.ReactNode | FallbackRender;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  info?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<ErrorBoundaryProps>, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.setState({ info });
    logger.error('Unhandled render error', { error, info });
  }

  render(): React.ReactNode {
    const { hasError, error, info } = this.state;
    const { fallback, children } = this.props;
    if (!hasError) return children;

    if (typeof fallback === 'function') {
      return (fallback as FallbackRender)(error as Error, info);
    }
    if (fallback) return fallback;

    // Default fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            An unexpected error occurred while rendering the application. Please try reloading the app. If the problem persists, check the logs.
          </p>
          {error && (
            <details className="mt-2 text-xs whitespace-pre-wrap break-words opacity-80">
              <summary className="cursor-pointer">Error details</summary>
              {error.name}: {error.message}
            </details>
          )}
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => (typeof window !== 'undefined' ? window.location.reload() : undefined)}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
