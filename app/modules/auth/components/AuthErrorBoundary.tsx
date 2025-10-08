"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
    
    // You could also log to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  public render() {
    if (this.state.hasError) {
      // Return custom fallback UI or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md shadow-xl rounded-2xl bg-white p-8 mx-auto border border-gray-100 text-center">
            <div className="mb-6">
              <svg 
                className="mx-auto h-12 w-12 text-red-500 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                We encountered an error while loading the authentication form. Please try refreshing the page.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 bg-red-50 p-3 rounded border overflow-auto max-h-32">
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

// Hook version for functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Auth Error:', error, errorInfo);
    
    // In a real app, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: { errorInfo } });
  };

  return { handleError };
}