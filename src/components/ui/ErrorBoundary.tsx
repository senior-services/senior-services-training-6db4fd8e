/**
 * Enhanced Error Boundary Component for the Senior Services Training Portal
 * Provides graceful error handling with accessibility features and user-friendly messaging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Enhanced Error Boundary with comprehensive error handling and accessibility
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Announce error to screen readers
    this.announceError();
  }

  private announceError = (): void => {
    const announcement = 'An error has occurred. Please try refreshing the page or return to the home page.';
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  private handleRefresh = (): void => {
    // Clear error state and attempt to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
    
    // Optionally reload the page for a fresh start
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI with accessibility features
      return (
        <main 
          className="min-h-screen bg-background flex items-center justify-center p-4"
          role="alert"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle 
                    className="w-8 h-8 text-destructive" 
                    aria-hidden="true"
                  />
                </div>
              </div>
              <CardTitle id="error-title" className="text-h2 text-foreground">
                Something went wrong
              </CardTitle>
              <CardDescription id="error-description">
                We encountered an unexpected error while loading this page. 
                This has been logged and our team will investigate.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error ID for support reference */}
              <div className="bg-muted p-3 rounded-md">
                <p className="text-body-sm text-muted-foreground mb-1">Error ID:</p>
                <p className="text-body-sm font-mono text-foreground">{this.state.errorId}</p>
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-3 rounded-md">
                  <summary className="text-body-sm font-medium cursor-pointer text-foreground mb-2">
                    Technical Details (Development)
                  </summary>
                  <pre className="text-caption text-muted-foreground overflow-auto whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRefresh}
                  className="flex-1"
                  aria-describedby="refresh-help"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  asChild 
                  className="flex-1"
                  aria-describedby="home-help"
                >
                  <Link to="/dashboard">
                    <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>

              {/* Screen reader helper text */}
              <div className="sr-only">
                <p id="refresh-help">
                  Clicking "Try Again" will refresh the page and attempt to reload the content.
                </p>
                <p id="home-help">
                  Clicking "Go to Dashboard" will navigate you back to the main dashboard page.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallbackComponent={fallbackComponent} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};