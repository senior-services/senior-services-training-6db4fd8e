/**
 * Accessible loading spinner component
 * Provides visual and screen reader feedback for loading states
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  inline?: boolean;
}

/**
 * Loading spinner with accessibility features
 * @param size - Size variant of the spinner
 * @param className - Additional CSS classes
 * @param label - Accessible label for screen readers
 * @param inline - Whether to display inline or as block element
 */
export const LoadingSpinner = ({
  size = 'md',
  className,
  label = 'Loading',
  inline = false,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const containerClasses = inline
    ? 'inline-flex items-center'
    : 'flex items-center justify-center';

  return (
    <div
      className={cn(containerClasses, className)}
      role="status"
      aria-label={label}
    >
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * Full page loading overlay
 */
interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay = ({
  message = 'Loading...',
  transparent = false,
}: LoadingOverlayProps) => {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        transparent ? 'bg-background/80' : 'bg-background'
      )}
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-body-sm text-muted-foreground font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Inline loading state for buttons
 */
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LoadingButton = ({
  loading = false,
  children,
  className,
}: LoadingButtonProps) => {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" label="Processing" />
        </div>
      )}
      <div className={cn(loading && 'opacity-0')}>
        {children}
      </div>
    </div>
  );
};

/**
 * Loading skeleton for content placeholders
 */
interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export const LoadingSkeleton = ({
  className,
  lines = 3,
  avatar = false,
}: LoadingSkeletonProps) => {
  return (
    <div className={cn('animate-pulse space-y-3 shadow-sm', className)} role="status" aria-label="Loading content">
      {avatar && (
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-muted rounded-full shadow-sm" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/4 shadow-sm" />
            <div className="h-3 bg-muted rounded w-1/3 shadow-sm" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-muted rounded shadow-sm',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
      <span className="sr-only">Loading content</span>
    </div>
  );
};