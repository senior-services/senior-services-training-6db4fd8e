/**
 * Performance optimization hook for expensive callback functions
 * Prevents unnecessary re-renders by memoizing callback functions
 */

import { useCallback, useRef } from 'react';

/**
 * useOptimizedCallback - A performance-optimized version of useCallback
 * that uses a ref to maintain callback stability while allowing dependencies to change
 * 
 * @param callback - The callback function to optimize
 * @param deps - Dependencies array (optional)
 * @returns Memoized callback function
 */
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps?: React.DependencyList
): T => {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref when dependencies change
  callbackRef.current = callback;
  
  // Return a stable callback that calls the latest version
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    deps || []
  );
};