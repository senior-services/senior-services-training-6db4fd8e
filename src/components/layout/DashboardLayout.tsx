/**
 * Dashboard layout wrapper component
 * Provides consistent layout structure with accessibility features
 */

import React from 'react';
import { logger } from '@/utils/logger';
import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { createModalAriaProps } from '@/utils/accessibility';
import { DashboardProps } from '@/types';

interface DashboardLayoutProps extends DashboardProps {
  children: React.ReactNode;
  userRole: 'admin' | 'employee';
  overallProgress?: number;
  loading?: boolean;
  className?: string;
}

/**
 * Main dashboard layout component with semantic HTML structure
 * Provides header, main content area, and accessibility features
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName,
  userEmail,
  userRole,
  overallProgress,
  onLogout,
  loading = false,
  className,
}) => {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Page header */}
      <Header
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      {/* Main content area */}
      <main
        id="main-content"
        className="relative"
        role="main"
        aria-label={`${userRole === 'admin' ? 'Administrator' : 'Employee'} dashboard main content`}
      >
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log error for monitoring in production
            logger.error('Dashboard error', error as Error, { errorInfo });
            
            // In production, send to error tracking service
            // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
          }}
        >
          {loading && <LoadingOverlay message="Loading dashboard..." />}
          
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </ErrorBoundary>
      </main>

      {/* Footer for additional navigation or info */}
      <footer
        className="bg-gradient-card border-t border-border-primary mt-auto"
        role="contentinfo"
        aria-label="Dashboard footer"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-small text-muted-foreground">
              <p>
                Senior Services Training Portal &copy; {new Date().getFullYear()}
              </p>
            </div>
            
            <nav aria-label="Footer navigation">
              <div className="flex items-center space-x-4 text-small">
                <a
                  href="mailto:support@southsoundseniors.org"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Support
                </a>
                <span className="text-muted-foreground/50">•</span>
                <a
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Privacy Policy
                </a>
                <span className="text-muted-foreground/50">•</span>
                <a
                  href="/accessibility"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Accessibility
                </a>
              </div>
            </nav>
          </div>
        </div>
      </footer>

      {/* Live region for announcements to screen readers */}
      <div
        id="live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
};

/**
 * Specialized layout for admin dashboard
 */
interface AdminLayoutProps extends Omit<DashboardLayoutProps, 'userRole'> {
  activeTab?: string;
}

export const AdminDashboardLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  ...props
}) => {
  return (
    <DashboardLayout {...props} userRole="admin">
      <div
        className="space-y-6"
        role="region"
        aria-labelledby="admin-dashboard-title"
      >
        {/* Dashboard title */}
        <div className="space-y-2">
          <h1 
            id="admin-dashboard-title" 
            className="font-bold tracking-tight"
          >
            Administrator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage training content, monitor employee progress, and configure system settings.
          </p>
        </div>

        {/* Main content with proper landmark */}
        <div role="region" aria-label="Dashboard content">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * Specialized layout for employee dashboard
 */
interface EmployeeLayoutProps extends Omit<DashboardLayoutProps, 'userRole'> {}

export const EmployeeDashboardLayout: React.FC<EmployeeLayoutProps> = ({
  children,
  overallProgress,
  ...props
}) => {
  return (
    <DashboardLayout {...props} userRole="employee" overallProgress={overallProgress}>
      <div
        className="space-y-6"
        role="region"
        aria-labelledby="employee-dashboard-title"
      >
        {/* Welcome section */}
        <div className="space-y-2">
          <h1 
            id="employee-dashboard-title" 
            className="font-bold tracking-tight"
          >
            Welcome to Your Training Portal
          </h1>
          <p className="text-muted-foreground">
            Complete your required training modules and explore additional learning resources.
          </p>
        </div>

        {/* Progress summary for screen readers */}
        {typeof overallProgress === 'number' && (
          <div className="sr-only" aria-live="polite">
            Your overall training progress is {overallProgress} percent complete.
          </div>
        )}

        {/* Main content */}
        <div role="region" aria-label="Training content">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * Modal layout wrapper for consistent modal styling
 */
interface ModalLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export const ModalLayout: React.FC<ModalLayoutProps> = ({
  children,
  title,
  description,
  className,
}) => {
  const ariaProps = createModalAriaProps(title, description);

  return (
      <div
        className={cn('space-y-6', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${Math.random().toString(36).substr(2, 9)}`}
        aria-describedby={description ? `modal-desc-${Math.random().toString(36).substr(2, 9)}` : undefined}
      >
      {/* Modal header */}
      <div className="space-y-2">
        <h2 className="font-semibold" id={ariaProps['aria-labelledby']}>
          {title}
        </h2>
        {description && (
          <p 
            className="text-small text-muted-foreground"
            id={ariaProps['aria-describedby']}
          >
            {description}
          </p>
        )}
      </div>

      {/* Modal content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};