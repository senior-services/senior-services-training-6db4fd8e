/**
 * Error boundary component for graceful error handling
 * Provides fallback UI when JavaScript errors occur in component tree
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { APP_CONFIG } from '@/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary class component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  /**
   * Resets error boundary state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reloads the current page
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Navigates to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4 bg-muted/50"
          role="alert"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle 
                  className="w-8 h-8 text-destructive" 
                  aria-hidden="true"
                />
              </div>
              <CardTitle id="error-title">
                Something went wrong
              </CardTitle>
              <CardDescription id="error-description">
                We apologize for the inconvenience. An unexpected error has occurred in the application.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-4 rounded-lg text-body-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="space-y-2 text-caption font-mono">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                  aria-label="Reload page"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                  aria-label="Go to home page"
                >
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                  Go Home
                </Button>
              </div>

              {/* Support information */}
              <div className="text-center text-body-sm text-muted-foreground border-t pt-4">
                <p>
                  If this problem persists, please contact support at{' '}
                  <a 
                    href={`mailto:${APP_CONFIG.supportEmail}`}
                    className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    {APP_CONFIG.supportEmail}
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div 
      className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
      role="alert"
      aria-labelledby="fallback-title"
    >
      <div className="flex items-start space-x-3">
        <AlertTriangle 
          className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" 
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h3 id="fallback-title" className="text-body-sm font-medium text-destructive">
            Component Error
          </h3>
          <p className="mt-1 text-body-sm text-destructive/80">
            This component encountered an error and cannot be displayed.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-2 text-caption font-mono text-destructive/70 break-all">
              {error.message}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={resetError}
          className="flex-shrink-0"
          aria-label="Retry loading component"
        >
          <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
          Retry
        </Button>
      </div>
    </div>
  );
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<ErrorFallbackProps>
): React.ComponentType<T> => {
  const WrappedComponent = (props: T) => {
    return (
      <ErrorBoundary 
        fallback={
          fallback ? React.createElement(fallback, { error: new Error('Component error'), resetError: () => {} }) : undefined
        }
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Error boundary specifically for async operations
 */
interface AsyncErrorBoundaryState {
  error: Error | null;
}

export class AsyncErrorBoundary extends Component<Props, AsyncErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-center">
          <p className="text-body-sm text-muted-foreground mb-2">
            Failed to load content
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => this.setState({ error: null })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}