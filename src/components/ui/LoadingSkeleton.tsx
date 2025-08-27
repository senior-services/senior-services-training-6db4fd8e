/**
 * Loading Skeleton Components
 * Provides accessible loading states with proper ARIA attributes
 */

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  'aria-label'?: string;
}

/**
 * Base skeleton component with accessibility features
 */
export const Skeleton = ({ className, 'aria-label': ariaLabel, ...props }: LoadingSkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      role="status"
      aria-label={ariaLabel || "Loading..."}
      aria-live="polite"
      {...props}
    />
  );
};

/**
 * Card-specific loading skeleton
 */
export const CardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="p-6 space-y-4">
        <Skeleton className="h-4 w-2/3" aria-label="Loading title" />
        <Skeleton className="h-3 w-1/2" aria-label="Loading subtitle" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" aria-label="Loading content line 1" />
          <Skeleton className="h-3 w-4/5" aria-label="Loading content line 2" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table row loading skeleton
 */
export const TableRowSkeleton = () => {
  return (
    <tr role="row" aria-label="Loading table row">
      <td className="p-4">
        <Skeleton className="h-8 w-12" aria-label="Loading thumbnail" />
      </td>
      <td className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" aria-label="Loading title" />
          <Skeleton className="h-3 w-48" aria-label="Loading description" />
        </div>
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16 mx-auto" aria-label="Loading badge" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-8 mx-auto" aria-label="Loading count" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-12 mx-auto" aria-label="Loading percentage" />
      </td>
      <td className="p-4">
        <Skeleton className="h-3 w-16 mx-auto" aria-label="Loading date" />
      </td>
      <td className="p-4">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8" aria-label="Loading action button" />
          <Skeleton className="h-8 w-8" aria-label="Loading action button" />
        </div>
      </td>
    </tr>
  );
};

/**
 * Dashboard stats loading skeleton
 */
export const StatsSkeleton = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};