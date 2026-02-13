import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { APP_CONFIG } from '@/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

/**
 * Error boundary specifically for authentication flows
 * Provides user-friendly fallback UI for auth-related errors
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `auth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    logger.error('Authentication error caught by boundary', error, {
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    });

    // Announce error to screen readers
    this.announceError(error.message);
  }

  private announceError = (message: string) => {
    // Create a temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Authentication error: ${message}`;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
    // Reload the current page to restart the auth flow
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isCompanyEmailError = this.state.error?.message.toLowerCase().includes('company email') ||
                                  this.state.error?.message.toLowerCase().includes('southsoundseniors.org') ||
                                  this.state.error?.message.toLowerCase().includes('domain');

      return (
        <div 
          className="min-h-screen bg-gradient-hero flex items-center justify-center p-4"
          role="alert"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle 
                  className="h-12 w-12 text-destructive" 
                  aria-hidden="true"
                />
              </div>
              <CardTitle id="error-title">
                {isCompanyEmailError ? 'Company Email Required' : 'Authentication Error'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div 
                id="error-description" 
                className="text-center text-muted-foreground"
                aria-live="polite"
              >
                {isCompanyEmailError ? (
                  <>
                    <p className="mb-2">
                      Only @southsoundseniors.org email addresses are allowed to access this training portal.
                    </p>
                    <p className="text-body-sm">
                      Need access? Contact {APP_CONFIG.supportEmail}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      Something went wrong during the authentication process.
                    </p>
                    <p className="text-body-sm text-muted-foreground">
                      Error ID: {this.state.errorId}
                    </p>
                  </>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-caption bg-muted p-3 rounded">
                  <summary className="cursor-pointer font-medium">
                    Technical Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  aria-describedby="retry-description"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Try Again
                </Button>
                <div id="retry-description" className="sr-only">
                  Reload the page and restart the authentication process
                </div>
                
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full"
                >
                  <Link to="/auth">
                    <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                    Go to Login Page
                  </Link>
                </Button>
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
 * Higher-order component for wrapping auth components with error boundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}