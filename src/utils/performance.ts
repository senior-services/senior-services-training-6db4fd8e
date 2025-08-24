/**
 * Performance utilities for the Senior Services Training Portal
 * Provides optimization helpers, memoization, and performance monitoring
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Debounce function to limit the rate of function execution
 * Useful for search inputs and API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit function execution to once per specified interval
 * Useful for scroll events and frequent UI updates
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Custom hook for memoized calculations with dependency array
 * Optimizes expensive calculations in components
 */
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

/**
 * Custom hook for optimized callback functions
 * Prevents unnecessary re-renders in child components
 */
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

/**
 * Calculates training progress efficiently
 * Memoized for performance with large datasets
 */
export const calculateTrainingProgress = (videos: any[]): {
  totalVideos: number;
  completedVideos: number;
  overallProgress: number;
  requiredComplete: number;
  totalRequired: number;
} => {
  if (!Array.isArray(videos) || videos.length === 0) {
    return {
      totalVideos: 0,
      completedVideos: 0,
      overallProgress: 0,
      requiredComplete: 0,
      totalRequired: 0
    };
  }

  let totalProgress = 0;
  let completedVideos = 0;
  let requiredComplete = 0;
  let totalRequired = 0;

  videos.forEach(video => {
    const progress = video.progress || 0;
    totalProgress += progress;
    
    if (progress === 100) {
      completedVideos++;
      if (video.isRequired) {
        requiredComplete++;
      }
    }
    
    if (video.isRequired) {
      totalRequired++;
    }
  });

  return {
    totalVideos: videos.length,
    completedVideos,
    overallProgress: Math.round(totalProgress / videos.length),
    requiredComplete,
    totalRequired
  };
};

/**
 * Optimizes image loading with lazy loading and error handling
 */
export const useOptimizedImage = (src: string, fallbackSrc: string) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  useEffect(() => {
    if (!imageRef.current) return;
    
    const image = imageRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            image.src = src;
            observer.unobserve(image);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(image);
    
    return () => observer.disconnect();
  }, [src]);
  
  const handleError = useCallback(() => {
    if (imageRef.current) {
      imageRef.current.src = fallbackSrc;
    }
  }, [fallbackSrc]);
  
  return { imageRef, handleError };
};

/**
 * Performance monitoring utility
 * Tracks component render times and performance metrics
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>(performance.now());
  
  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;
    
    // Only log if render time is unusually long (> 16ms for 60fps)
    if (renderTime > 16) {
      console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
    }
    
    renderStart.current = performance.now();
  });
};